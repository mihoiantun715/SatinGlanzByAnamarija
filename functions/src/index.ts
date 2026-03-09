import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import Stripe from 'stripe';

admin.initializeApp();

let _stripe: Stripe | null = null;
const getStripe = () => {
  if (!_stripe) {
    // Use Stripe secret key from environment variable
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    _stripe = new Stripe(secretKey, {
      apiVersion: '2025-04-30.basil' as any,
    });
  }
  return _stripe;
};

// HTML sanitizer to prevent XSS in email templates
const sanitize = (str: string): string => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// Generate tracking URL based on carrier
const getTrackingUrl = (carrier: string, trackingNumber: string): string => {
  switch (carrier.toLowerCase()) {
    case 'dhl':
      return `https://www.dhl.de/en/privatkunden/pakete-empfangen/verfolgen.html?piececode=${trackingNumber}`;
    case 'gls':
      return `https://gls-group.com/DE/en/parcel-tracking?match=${trackingNumber}`;
    case 'ups':
      return `https://www.ups.com/track?tracknum=${trackingNumber}`;
    case 'fedex':
      return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    case 'usps':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
    default:
      return '';
  }
};

// Generate random reset token
const generateResetToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Shipping rates - MUST match client-side shippingCalculator.ts
const SHIPPING_RATES = {
  dhl: {
    bouquet: [
      { maxRoses: 20, price: 5.19 },
      { maxRoses: 50, price: 7.69 },
      { maxRoses: 101, price: 7.69 },
    ],
    default: 5.19,
  },
  gls: {
    bouquet: [
      { maxRoses: 20, price: 5.59 },
      { maxRoses: 50, price: 7.79 },
      { maxRoses: 101, price: 10.00 },
    ],
    default: 5.59,
  },
};

// Calculate shipping cost on server (must match client calculation)
function calculateServerShipping(items: any[], carrier: 'dhl' | 'gls'): number {
  let totalBouquetRoses = 0;
  let hasBouquets = false;

  for (const item of items) {
    if (item.roseCount || item.category === 'Bouquets') {
      hasBouquets = true;
      const roses = item.roseCount || 1;
      totalBouquetRoses += roses * (item.quantity || 1);
    }
  }

  if (hasBouquets && totalBouquetRoses > 0) {
    const rates = SHIPPING_RATES[carrier].bouquet;
    for (const rate of rates) {
      if (totalBouquetRoses <= rate.maxRoses) {
        return rate.price;
      }
    }
    return rates[rates.length - 1].price;
  }

  return SHIPPING_RATES[carrier].default;
}

// Create Stripe Payment Intent with SERVER-SIDE PRICE VERIFICATION
export const createPaymentIntent = functions.https.onCall(async (data: any, context) => {
  // Allow both authenticated and guest users to create payment intents
  if (false) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to make a payment.');
  }

  try {
    const stripe = getStripe();
    const { amount, currency, customerEmail, orderId } = data;

    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid amount.');
    }

    // SECURITY: Verify the order exists and recalculate prices server-side
    if (!orderId) {
      throw new functions.https.HttpsError('invalid-argument', 'Order ID is required.');
    }

    const orderDoc = await admin.firestore().collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found.');
    }

    const orderData = orderDoc.data();
    if (!orderData || !orderData.items || orderData.items.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Order has no items.');
    }

    // Fetch real product prices from Firestore
    let calculatedSubtotal = 0;
    const productIds = orderData.items.map((item: any) => item.productId);
    const productDocs = await admin.firestore().collection('products').where(admin.firestore.FieldPath.documentId(), 'in', productIds).get();
    
    const productPrices: Record<string, number> = {};
    productDocs.forEach(doc => {
      const data = doc.data();
      if (data && typeof data.price === 'number') {
        productPrices[doc.id] = data.price;
      }
    });

    // Recalculate subtotal using real prices from database
    for (const item of orderData.items) {
      const realPrice = productPrices[item.productId];
      if (realPrice === undefined) {
        throw new functions.https.HttpsError('not-found', `Product ${item.productId} not found.`);
      }
      calculatedSubtotal += realPrice * (item.quantity || 1);
    }

    // Recalculate shipping using server-side logic
    const carrier = orderData.shippingCarrier || 'dhl';
    const calculatedShipping = calculateServerShipping(orderData.items, carrier);

    // Calculate expected total
    const expectedTotal = calculatedSubtotal + calculatedShipping;

    // SECURITY CHECK: Verify client amount matches server calculation
    // Allow 0.01 difference for rounding
    if (Math.abs(amount - expectedTotal) > 0.01) {
      console.error('Price mismatch detected!', {
        clientAmount: amount,
        serverCalculated: expectedTotal,
        subtotal: calculatedSubtotal,
        shipping: calculatedShipping,
        orderId: orderId,
      });
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Price verification failed. Expected €${expectedTotal.toFixed(2)}, received €${amount.toFixed(2)}`
      );
    }

    // Use server-calculated amount (not client amount!)
    const amountInCents = Math.round(expectedTotal * 100);

    if (amountInCents < 50) {
      throw new functions.https.HttpsError('invalid-argument', 'Amount must be at least €0.50');
    }

    // Max €10,000 to prevent abuse
    if (amountInCents > 1000000) {
      throw new functions.https.HttpsError('invalid-argument', 'Amount exceeds maximum allowed.');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency || 'eur',
      receipt_email: customerEmail || context.auth?.token?.email,
      metadata: {
        orderId: orderId || '',
        userId: context.auth?.uid || 'guest',
        verifiedAmount: expectedTotal.toFixed(2),
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error: any) {
    console.error('Stripe error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to create payment intent');
  }
});

// Gmail SMTP transporter (credentials from .env)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || '',
      pass: process.env.GMAIL_APP_PASSWORD || '',
    }
  });
};

const GMAIL_FROM = `SatinGlanz by Anamarija <${process.env.GMAIL_USER || 'satinglanzbyanamarija@gmail.com'}>`;
const GMAIL_TO = process.env.GMAIL_USER || 'satinglanzbyanamarija@gmail.com';

// Send order confirmation email to customer
export const sendOrderEmail = functions.https.onCall(async (data: any, context) => {
  // Auth check: only authenticated users can trigger order emails
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  }

  try {
    const transporter = createTransporter();

    const { orderData, orderId } = data;

    if (!orderData || !orderId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing order data.');
    }

    const orderNumber = sanitize(orderId.slice(0, 8).toUpperCase());

    // Build items HTML (sanitized)
    const itemsHtml = orderData.items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f3f4f6;">
          <strong>${sanitize(item.name)}</strong>
          ${item.color ? `<br><span style="color: #9ca3af; font-size: 13px;">Color: ${sanitize(item.color)}</span>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; text-align: center;">${Number(item.quantity)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; text-align: right;">€${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
      </tr>
    `).join('');

    const addr = orderData.shippingAddress;
    if (!addr || !addr.firstName) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing shipping address.');
    }
    const shippingLabel = orderData.shippingCost === 0 ? 'FREE' : `€${Number(orderData.shippingCost).toFixed(2)}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f43f5e, #ec4899); color: white; padding: 35px 30px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 700;">🌹 Vielen Dank für Ihre Bestellung!</h1>
          <p style="margin: 10px 0 0 0; font-size: 15px; opacity: 0.9;">SatinGlanz by Anamarija</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #f3e8f0;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Liebe/r <strong>${sanitize(addr.firstName)} ${sanitize(addr.lastName)}</strong>,
          </p>
          <p style="color: #6b7280; line-height: 1.6;">
            Vielen Dank für Ihre Bestellung! Wir haben sie erhalten und werden Ihre handgefertigten Satinrosen mit Sorgfalt vorbereiten.
          </p>
          
          <div style="background: #fdf2f8; padding: 16px 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #9d174d; font-size: 13px;">Bestellnummer</p>
            <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 22px; font-weight: 700; letter-spacing: 2px;">#${orderNumber}</p>
          </div>

          <h3 style="color: #1f2937; margin: 25px 0 12px 0; font-size: 16px;">📦 Bestelldetails</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: #fdf2f8;">
                <th style="padding: 10px 12px; text-align: left; color: #6b7280; font-weight: 600;">Artikel</th>
                <th style="padding: 10px 12px; text-align: center; color: #6b7280; font-weight: 600;">Anz.</th>
                <th style="padding: 10px 12px; text-align: right; color: #6b7280; font-weight: 600;">Preis</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 16px; padding: 16px; background: #f9fafb; border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #6b7280; font-size: 14px;">Zwischensumme</span>
              <span style="color: #1f2937; font-size: 14px; font-weight: 600;">€${orderData.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #6b7280; font-size: 14px;">Versand (${orderData.shippingCarrier.toUpperCase()})</span>
              <span style="color: ${orderData.shippingCost === 0 ? '#10b981' : '#1f2937'}; font-size: 14px; font-weight: 600;">${shippingLabel}</span>
            </div>
            <div style="border-top: 2px solid #e5e7eb; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between;">
              <span style="color: #1f2937; font-size: 16px; font-weight: 700;">Gesamt</span>
              <span style="color: #f43f5e; font-size: 16px; font-weight: 700;">€${orderData.total.toFixed(2)}</span>
            </div>
          </div>

          <h3 style="color: #1f2937; margin: 25px 0 12px 0; font-size: 16px;">📍 Lieferadresse</h3>
          <div style="background: #f9fafb; padding: 16px; border-radius: 10px; color: #374151; font-size: 14px; line-height: 1.8;">
            ${sanitize(addr.firstName)} ${sanitize(addr.lastName)}<br>
            ${sanitize(addr.street)}<br>
            ${sanitize(addr.postalCode)} ${sanitize(addr.city)}<br>
            ${sanitize(addr.country)}<br>
            📞 ${sanitize(addr.phone)}
          </div>

          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 13px;">
              <strong>💡 Wie geht es weiter?</strong><br>
              Wir werden Ihre Bestellung sorgfältig handgefertigen und Ihnen eine Versandbestätigung senden, sobald sie unterwegs ist. Jedes Stück wird mit Liebe und Aufmerksamkeit für Details hergestellt.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0 10px 0;">
            <a href="https://satinglanzbyanamarija.com/account" style="background: #f43f5e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 14px;">
              Meine Bestellungen ansehen
            </a>
          </div>

          <div style="border-top: 1px solid #f3e8f0; padding-top: 20px; margin-top: 25px; text-align: center;">
            <p style="color: #6b7280; font-size: 13px; margin: 5px 0;">Mit ❤️ von Anamarija</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              📧 satinglanzbyanamarija@gmail.com
            </p>
          </div>
        </div>
      </div>
    `;

    // Send to customer (use auth email as fallback for safety)
    const recipientEmail = orderData.userEmail || context.auth?.token.email;
    if (!recipientEmail) {
      throw new functions.https.HttpsError('invalid-argument', 'No recipient email.');
    }

    await transporter.sendMail({
      from: GMAIL_FROM,
      to: recipientEmail,
      subject: `🌹 Bestellbestätigung #${orderNumber} | SatinGlanz by Anamarija`,
      html: htmlContent
    });

    // Send notification to shop owner
    const ownerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1f2937; color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 22px;">🛒 New Order Received!</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8;">Order #${orderNumber}</p>
        </div>
        <div style="background: white; padding: 25px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p><strong>Customer:</strong> ${sanitize(addr.firstName)} ${sanitize(addr.lastName)}</p>
          <p><strong>Email:</strong> ${sanitize(orderData.userEmail)}</p>
          <p><strong>Phone:</strong> ${sanitize(addr.phone)}</p>
          <p><strong>Address:</strong> ${sanitize(addr.street)}, ${sanitize(addr.postalCode)} ${sanitize(addr.city)}, ${sanitize(addr.country)}</p>
          <p><strong>Shipping:</strong> ${sanitize(String(orderData.shippingCarrier).toUpperCase())} (${shippingLabel})</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
          <p><strong>Items:</strong></p>
          <ul style="padding-left: 20px;">
            ${orderData.items.map((item: any) => `<li>${sanitize(item.name)} × ${Number(item.quantity)} — €${(Number(item.price) * Number(item.quantity)).toFixed(2)}${item.color ? ` (${sanitize(item.color)})` : ''}</li>`).join('')}
          </ul>
          <p style="font-size: 18px; font-weight: bold; color: #f43f5e;">Total: €${orderData.total.toFixed(2)}</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: GMAIL_FROM,
      to: GMAIL_TO,
      subject: `🛒 New Order #${orderNumber} — €${Number(orderData.total).toFixed(2)} from ${sanitize(addr.firstName)} ${sanitize(addr.lastName)}`,
      html: ownerHtml
    });

    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send order email');
  }
});

// Send welcome email on new user registration
export const sendWelcomeEmail = functions.https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  }

  try {
    const transporter = createTransporter();
    const { userEmail, userName } = data;

    if (!userEmail) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing user email.');
    }

    const displayName = userName || userEmail.split('@')[0];

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f43f5e, #ec4899); color: white; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🌹 Willkommen bei SatinGlanz!</h1>
          <p style="margin: 12px 0 0 0; font-size: 16px; opacity: 0.95;">Handgefertigte Satinrosen von Anamarija</p>
        </div>
        
        <div style="background: #ffffff; padding: 35px; border-radius: 0 0 16px 16px; border: 1px solid #f3e8f0;">
          <p style="color: #374151; font-size: 17px; line-height: 1.7;">
            Liebe/r <strong>${sanitize(displayName)}</strong>,
          </p>
          <p style="color: #6b7280; line-height: 1.7; font-size: 15px;">
            Vielen Dank, dass Sie unserer Community beigetreten sind! Wir freuen uns sehr, Sie hier zu haben. Jede Satinrose, die wir kreieren, wird mit Liebe und Aufmerksamkeit für Details handgefertigt, wodurch jedes Stück einzigartig und besonders wird.
          </p>
          
          <div style="background: #fdf2f8; padding: 20px; border-radius: 12px; margin: 25px 0;">
            <h3 style="color: #9d174d; margin: 0 0 12px 0; font-size: 16px;">✨ Was uns besonders macht:</h3>
            <ul style="color: #374151; line-height: 1.8; padding-left: 20px; margin: 0;">
              <li>100% handgefertigte Satinrosen</li>
              <li>Perfekt für Hochzeiten, Events und Geschenke</li>
              <li>Individuelle Bouquets verfügbar</li>
              <li>Schneller und zuverlässiger Versand</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://satinglanzbyanamarija.com/shop" style="background: #f43f5e; color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);">
              Jetzt einkaufen 🛍️
            </a>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 18px; border-radius: 10px; margin: 25px 0;">
            <p style="margin: 0; color: #166534; font-size: 14px;">
              <strong>🎁 Sonderangebot:</strong> Verwenden Sie den Code <strong>WELCOME10</strong> für 10% Rabatt auf Ihre erste Bestellung!
            </p>
          </div>

          <div style="border-top: 1px solid #f3e8f0; padding-top: 25px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">Brauchen Sie Hilfe? Wir sind für Sie da!</p>
            <p style="color: #9ca3af; font-size: 13px; margin: 5px 0;">
              📧 <a href="mailto:satinglanzbyanamarija@gmail.com" style="color: #f43f5e; text-decoration: none;">satinglanzbyanamarija@gmail.com</a>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">Mit ❤️ von Anamarija</p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: GMAIL_FROM,
      to: userEmail,
      subject: '🌹 Willkommen bei SatinGlanz by Anamarija!',
      html: htmlContent
    });

    return { success: true };
  } catch (error) {
    console.error('Welcome email error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send welcome email');
  }
});

// Send order confirmation email to customer (German)
export const sendOrderConfirmationEmail = functions.https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  }

  try {
    const transporter = createTransporter();
    const { orderId, customerEmail, customerName } = data;

    if (!orderId || !customerEmail) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }

    const orderNumber = sanitize(orderId.slice(0, 8).toUpperCase());
    const displayName = customerName || customerEmail.split('@')[0];

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f43f5e, #fb7185); color: white; padding: 35px 30px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 700;">✅ Bestellung bestätigt!</h1>
          <p style="margin: 10px 0 0 0; font-size: 15px; opacity: 0.9;">SatinGlanz by Anamarija</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #fecdd3;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Liebe/r <strong>${sanitize(displayName)}</strong>,
          </p>
          <p style="color: #6b7280; line-height: 1.6;">
            Vielen Dank für Ihre Bestellung! Wir haben Ihre Bestellung erhalten und bestätigt.
          </p>
          
          <div style="background: #fef2f2; border-left: 4px solid #f43f5e; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; color: #374151; font-weight: 600;">Bestellnummer: #${orderNumber}</p>
          </div>

          <p style="color: #6b7280; line-height: 1.6;">
            <strong>Ihre Bestellung wird gerade vorbereitet!</strong>
          </p>
          <p style="color: #6b7280; line-height: 1.6;">
            Wir fertigen Ihre handgefertigten Satinrosen mit viel Liebe und Sorgfalt an. Da jedes Stück ein Unikat ist, kann die Herstellung einige Tage dauern.
          </p>
          <p style="color: #6b7280; line-height: 1.6;">
            <strong>In der nächsten E-Mail erhalten Sie:</strong>
          </p>
          <ul style="color: #6b7280; line-height: 1.8;">
            <li>📸 Fotos Ihrer fertigen Bestellung</li>
            <li>📦 Bilder der Verpackung</li>
            <li>✨ Vorschau, wie Ihre Rosen bei Ihnen ankommen werden</li>
          </ul>

          <p style="color: #6b7280; line-height: 1.6; margin-top: 25px;">
            Wir freuen uns, Ihnen Ihre wunderschönen Satinrosen zu liefern!
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              Mit freundlichen Grüßen,<br>
              <strong style="color: #f43f5e;">Anamarija</strong><br>
              SatinGlanz by Anamarija
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: GMAIL_FROM,
      to: customerEmail,
      subject: '✅ Ihre Bestellung wurde bestätigt - SatinGlanz',
      html: htmlContent
    });

    return { success: true };
  } catch (error) {
    console.error('Order confirmation email error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send order confirmation email');
  }
});

// Send order completion email with images (German)
export const sendOrderCompletionEmail = functions.https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  }

  try {
    const transporter = createTransporter();
    const { orderId, customerEmail, customerName, imageUrls } = data;

    if (!orderId || !customerEmail || !imageUrls || !Array.isArray(imageUrls)) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }

    const orderNumber = sanitize(orderId.slice(0, 8).toUpperCase());
    const displayName = customerName || customerEmail.split('@')[0];

    const imageGallery = imageUrls.map((url: string, index: number) => `
      <div style="margin-bottom: 15px;">
        <img src="${sanitize(url)}" alt="Bestellung Foto ${index + 1}" style="width: 100%; max-width: 550px; border-radius: 12px; border: 2px solid #fecdd3;" />
      </div>
    `).join('');

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f43f5e, #fb7185); color: white; padding: 35px 30px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 700;">📸 Ihre Bestellung ist fertig!</h1>
          <p style="margin: 10px 0 0 0; font-size: 15px; opacity: 0.9;">SatinGlanz by Anamarija</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #fecdd3;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Liebe/r <strong>${sanitize(displayName)}</strong>,
          </p>
          <p style="color: #6b7280; line-height: 1.6;">
            Ihre handgefertigten Satinrosen sind fertig! 🌹
          </p>
          
          <div style="background: #fef2f2; border-left: 4px solid #f43f5e; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; color: #374151; font-weight: 600;">Bestellnummer: #${orderNumber}</p>
          </div>

          <p style="color: #6b7280; line-height: 1.6;">
            <strong>Hier sind Fotos Ihrer Bestellung:</strong>
          </p>

          <div style="margin: 25px 0;">
            ${imageGallery}
          </div>

          <p style="color: #6b7280; line-height: 1.6;">
            Ihre Rosen wurden sorgfältig verpackt und sind bereit für den Versand. Jede Rose wurde mit viel Liebe und Aufmerksamkeit für Sie handgefertigt.
          </p>

          <p style="color: #6b7280; line-height: 1.6;">
            <strong>So werden Ihre Rosen bei Ihnen ankommen!</strong> Wir hoffen, sie gefallen Ihnen genauso gut wie uns. ✨
          </p>

          <p style="color: #6b7280; line-height: 1.6; margin-top: 25px;">
            <strong>Nächster Schritt:</strong> Sobald Ihre Bestellung versendet wurde, erhalten Sie eine weitere E-Mail mit der Tracking-Nummer, damit Sie die Lieferung verfolgen können.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              Vielen Dank für Ihr Vertrauen!<br>
              <strong style="color: #f43f5e;">Anamarija</strong><br>
              SatinGlanz by Anamarija
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: GMAIL_FROM,
      to: customerEmail,
      subject: '📸 Ihre Bestellung ist fertig - Fotos anbei!',
      html: htmlContent
    });

    return { success: true };
  } catch (error) {
    console.error('Order completion email error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send order completion email');
  }
});

// Send custom password reset email (German)
export const sendPasswordResetEmail = functions.https.onCall(async (data: any) => {
  try {
    const transporter = createTransporter();
    const { email, resetLink } = data;

    if (!email || !resetLink) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f43f5e, #fb7185); color: white; padding: 35px 30px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 700;">🔐 Passwort zurücksetzen</h1>
          <p style="margin: 10px 0 0 0; font-size: 15px; opacity: 0.9;">SatinGlanz by Anamarija</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #fecdd3;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hallo,
          </p>
          <p style="color: #6b7280; line-height: 1.6;">
            Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts für Ihr SatinGlanz-Konto gestellt.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${sanitize(resetLink)}" style="background: #f43f5e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);">
              Passwort zurücksetzen 🔑
            </a>
          </div>

          <p style="color: #6b7280; line-height: 1.6; font-size: 14px;">
            Oder kopieren Sie diesen Link in Ihren Browser:
          </p>
          <p style="color: #9ca3af; font-size: 12px; word-break: break-all; background: #f9fafb; padding: 12px; border-radius: 8px; font-family: monospace;">
            ${sanitize(resetLink)}
          </p>

          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 13px;">
              <strong>⚠️ Wichtig:</strong><br>
              Dieser Link ist nur 1 Stunde gültig. Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.
            </p>
          </div>

          <p style="color: #6b7280; line-height: 1.6; margin-top: 25px;">
            Aus Sicherheitsgründen wird dieser Link nach einmaliger Verwendung ungültig.
          </p>

          <div style="border-top: 1px solid #f3e8f0; padding-top: 20px; margin-top: 25px; text-align: center;">
            <p style="color: #6b7280; font-size: 13px; margin: 5px 0;">Fragen?</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              📧 <a href="mailto:satinglanzbyanamarija@gmail.com" style="color: #f43f5e; text-decoration: none;">satinglanzbyanamarija@gmail.com</a>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">Mit ❤️ von Anamarija</p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: GMAIL_FROM,
      to: email,
      subject: '🔐 Passwort zurücksetzen - SatinGlanz',
      html: htmlContent
    });

    return { success: true };
  } catch (error) {
    console.error('Password reset email error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send password reset email');
  }
});

// Send tracking number notification email to customer
export const sendTrackingEmail = functions.https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  }

  try {
    const transporter = createTransporter();
    const { orderId, trackingNumber, shippingCarrier, customerEmail, customerName } = data;

    if (!orderId || !trackingNumber || !shippingCarrier || !customerEmail) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }

    const orderNumber = sanitize(orderId.slice(0, 8).toUpperCase());
    const trackingUrl = getTrackingUrl(shippingCarrier, trackingNumber);
    const displayName = customerName || customerEmail.split('@')[0];

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; padding: 35px 30px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 700;">📦 Ihre Bestellung wurde versendet!</h1>
          <p style="margin: 10px 0 0 0; font-size: 15px; opacity: 0.9;">SatinGlanz by Anamarija</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #f3e8f0;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Liebe/r <strong>${sanitize(displayName)}</strong>,
          </p>
          <p style="color: #6b7280; line-height: 1.6;">
            Gute Nachrichten! Ihre Bestellung wurde versendet und ist auf dem Weg zu Ihnen. Ihre handgefertigten Satinrosen wurden sorgfältig mit viel Liebe verpackt.
          </p>
          
          <div style="background: #fdf2f8; padding: 16px 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #9d174d; font-size: 13px;">Order Number</p>
            <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 22px; font-weight: 700; letter-spacing: 2px;">#${orderNumber}</p>
          </div>

          <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 12px; margin: 25px 0;">
            <div style="text-align: center; margin-bottom: 15px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 600;">TRACKING INFORMATIONEN</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">Versanddienstleister</p>
              <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">${sanitize(shippingCarrier.toUpperCase())}</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">Sendungsnummer</p>
              <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 700; font-family: monospace; letter-spacing: 1px;">${sanitize(trackingNumber)}</p>
            </div>
          </div>

          ${trackingUrl ? `
          <div style="text-align: center; margin: 25px 0;">
            <a href="${trackingUrl}" style="background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
              Sendung verfolgen 📍
            </a>
          </div>
          ` : ''}

          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 13px;">
              <strong>💡 Lieferinformationen:</strong><br>
              Ihr Paket wird mit Sorgfalt behandelt. Die Lieferzeiten können je nach Standort variieren. Sie können Ihre Sendung mit der obigen Sendungsnummer verfolgen.
            </p>
          </div>

          <div style="border-top: 1px solid #f3e8f0; padding-top: 20px; margin-top: 25px; text-align: center;">
            <p style="color: #6b7280; font-size: 13px; margin: 5px 0;">Fragen zu Ihrer Bestellung?</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              📧 <a href="mailto:satinglanzbyanamarija@gmail.com" style="color: #f43f5e; text-decoration: none;">satinglanzbyanamarija@gmail.com</a>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">Mit ❤️ von Anamarija</p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: GMAIL_FROM,
      to: customerEmail,
      subject: `📦 Ihre Bestellung #${orderNumber} wurde versendet! | SatinGlanz`,
      html: htmlContent
    });

    return { success: true };
  } catch (error) {
    console.error('Tracking email error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send tracking email');
  }
});

// Send delivery status update email to customer
export const sendDeliveryStatusEmail = functions.https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  }

  try {
    const transporter = createTransporter();
    const { orderId, status, trackingNumber, shippingCarrier, customerEmail, customerName, estimatedDelivery } = data;

    if (!orderId || !status || !customerEmail) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }

    const orderNumber = sanitize(orderId.slice(0, 8).toUpperCase());
    const displayName = customerName || customerEmail.split('@')[0];
    const trackingUrl = trackingNumber && shippingCarrier ? getTrackingUrl(shippingCarrier, trackingNumber) : '';

    let statusTitle = '';
    let statusMessage = '';
    let statusColor = '';
    let statusIcon = '';

    switch (status) {
      case 'processing':
        statusTitle = 'Order is Being Prepared';
        statusMessage = 'We\'re carefully handcrafting your satin roses. Your order will be shipped soon!';
        statusColor = '#3b82f6';
        statusIcon = '⚙️';
        break;
      case 'shipped':
        statusTitle = 'Order Has Been Shipped';
        statusMessage = 'Your package is on its way! Track your shipment to see its current location.';
        statusColor = '#8b5cf6';
        statusIcon = '📦';
        break;
      case 'in_transit':
        statusTitle = 'Package In Transit';
        statusMessage = 'Your order is moving through the delivery network and will arrive soon.';
        statusColor = '#f59e0b';
        statusIcon = '🚚';
        break;
      case 'out_for_delivery':
        statusTitle = 'Out for Delivery';
        statusMessage = 'Your package is out for delivery today! Please be available to receive it.';
        statusColor = '#10b981';
        statusIcon = '🏃';
        break;
      case 'delivered':
        statusTitle = 'Package Delivered';
        statusMessage = 'Your order has been delivered! We hope you love your handcrafted satin roses.';
        statusColor = '#059669';
        statusIcon = '✅';
        break;
      case 'delayed':
        statusTitle = 'Delivery Delayed';
        statusMessage = 'There\'s a slight delay with your shipment. We\'re working to get it to you as soon as possible.';
        statusColor = '#ef4444';
        statusIcon = '⏰';
        break;
      default:
        statusTitle = 'Order Status Update';
        statusMessage = 'There\'s an update on your order status.';
        statusColor = '#6b7280';
        statusIcon = '📋';
    }

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd); color: white; padding: 35px 30px; text-align: center; border-radius: 16px 16px 0 0;">
          <div style="font-size: 48px; margin-bottom: 10px;">${statusIcon}</div>
          <h1 style="margin: 0; font-size: 26px; font-weight: 700;">${statusTitle}</h1>
          <p style="margin: 10px 0 0 0; font-size: 15px; opacity: 0.9;">Order #${orderNumber}</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #f3e8f0;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Dear <strong>${sanitize(displayName)}</strong>,
          </p>
          <p style="color: #6b7280; line-height: 1.6; font-size: 15px;">
            ${statusMessage}
          </p>

          ${trackingNumber ? `
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 18px; border-radius: 10px; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="color: #6b7280; font-size: 13px;">Tracking Number</span>
              <span style="color: #1f2937; font-size: 14px; font-weight: 600; font-family: monospace;">${sanitize(trackingNumber)}</span>
            </div>
            ${shippingCarrier ? `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #6b7280; font-size: 13px;">Carrier</span>
              <span style="color: #1f2937; font-size: 14px; font-weight: 600;">${sanitize(shippingCarrier.toUpperCase())}</span>
            </div>
            ` : ''}
          </div>
          ` : ''}

          ${estimatedDelivery ? `
          <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 16px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-size: 14px;">
              <strong>📅 Estimated Delivery:</strong> ${sanitize(estimatedDelivery)}
            </p>
          </div>
          ` : ''}

          ${trackingUrl ? `
          <div style="text-align: center; margin: 25px 0;">
            <a href="${trackingUrl}" style="background: ${statusColor}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
              Track Your Package 📍
            </a>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 25px 0 10px 0;">
            <a href="https://satinglanzbyanamarija.com/account" style="color: #f43f5e; text-decoration: none; font-weight: 600; font-size: 14px;">
              View Order Details →
            </a>
          </div>

          <div style="border-top: 1px solid #f3e8f0; padding-top: 20px; margin-top: 25px; text-align: center;">
            <p style="color: #6b7280; font-size: 13px; margin: 5px 0;">Need assistance?</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              📧 <a href="mailto:satinglanzbyanamarija@gmail.com" style="color: #f43f5e; text-decoration: none;">satinglanzbyanamarija@gmail.com</a><br>
              🌐 <a href="https://satinglanzbyanamarija.com/" style="color: #f43f5e; text-decoration: none;">satinglanzbyanamarija.com</a>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">Made with ❤️ by Anamarija</p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: GMAIL_FROM,
      to: customerEmail,
      subject: `${statusIcon} Order #${orderNumber}: ${statusTitle} | SatinGlanz`,
      html: htmlContent
    });

    return { success: true };
  } catch (error) {
    console.error('Delivery status email error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send delivery status email');
  }
});

// Send contact form email (no auth required - public contact form)
export const sendContactEmail = functions.https.onCall(async (data: any, context) => {
  try {
    const { name, email, subject, message } = data;

    // Input validation
    if (!name || !email || !subject || !message) {
      throw new functions.https.HttpsError('invalid-argument', 'All fields are required.');
    }
    
    // Better email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email) || email.length > 254) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email address.');
    }
    
    if (String(name).length > 200 || String(subject).length > 500 || String(message).length > 5000) {
      throw new functions.https.HttpsError('invalid-argument', 'Input too long.');
    }

    // Rate limiting: max 3 messages per email per hour
    const rateLimitRef = admin.firestore().collection('contact_rate_limit').doc(email);
    const rateLimitDoc = await rateLimitRef.get();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (rateLimitDoc.exists) {
      const data = rateLimitDoc.data();
      const recentMessages = (data?.timestamps || []).filter((ts: number) => now - ts < oneHour);
      
      if (recentMessages.length >= 3) {
        throw new functions.https.HttpsError('resource-exhausted', 'Too many messages. Please try again later.');
      }
      
      await rateLimitRef.update({
        timestamps: [...recentMessages, now]
      });
    } else {
      await rateLimitRef.set({
        timestamps: [now]
      });
    }

    const transporter = createTransporter();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f43f5e, #ec4899); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 22px;">📬 New Contact Message</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">SatinGlanz by Anamarija</p>
        </div>
        <div style="background: white; padding: 25px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p><strong>From:</strong> ${sanitize(name)} (${sanitize(email)})</p>
          <p><strong>Subject:</strong> ${sanitize(subject)}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
          <p style="white-space: pre-line; color: #374151; line-height: 1.6;">${sanitize(message)}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
          <p style="color: #9ca3af; font-size: 12px;">Reply directly to this email to respond to the customer.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: GMAIL_FROM,
      replyTo: sanitize(email),
      to: GMAIL_TO,
      subject: `📬 Contact: ${sanitize(subject)} — from ${sanitize(name)}`,
      html: htmlContent
    });

    return { success: true };
  } catch (error) {
    console.error('Contact email error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send contact email');
  }
});

// Custom password reset - send email with reset token
export const sendCustomPasswordReset = functions.https.onCall(async (data: any, context) => {
  try {
    const { email } = data;

    if (!email || typeof email !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Email is required');
    }

    // Check if user exists
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      // User doesn't exist - show success anyway to prevent enumeration
      return { success: true };
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour expiration

    // Store token in Firestore
    await admin.firestore().collection('password_resets').doc(resetToken).set({
      email: email,
      userId: userRecord.uid,
      expiresAt: expiresAt,
      used: false,
      createdAt: Date.now(),
    });

    const transporter = createTransporter();
    const resetLink = `https://satinglanzbyanamarija.com/reset-password?token=${resetToken}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f43f5e, #ec4899); color: white; padding: 35px 30px; text-align: center; border-radius: 16px 16px 0 0;">
          <div style="font-size: 48px; margin-bottom: 10px;">🔑</div>
          <h1 style="margin: 0; font-size: 26px; font-weight: 700;">Passwort zurücksetzen</h1>
          <p style="margin: 10px 0 0 0; font-size: 15px; opacity: 0.9;">SatinGlanz by Anamarija</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #f3e8f0;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hallo,
          </p>
          <p style="color: #6b7280; line-height: 1.6; font-size: 15px;">
            Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts für Ihr SatinGlanz-Konto gestellt.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #f43f5e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);">
              Passwort zurücksetzen 🔑
            </a>
          </div>

          <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
            Oder kopieren Sie diesen Link in Ihren Browser:<br>
            <a href="${resetLink}" style="color: #f43f5e; word-break: break-all;">${resetLink}</a>
          </p>

          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 10px; margin-top: 20px;">
            <p style="margin: 0; color: #92400e; font-size: 13px;">
              <strong>⚠️ Wichtig:</strong><br>
              Dieser Link ist nur 1 Stunde gültig. Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.
            </p>
          </div>

          <div style="border-top: 1px solid #f3e8f0; padding-top: 20px; margin-top: 25px; text-align: center;">
            <p style="color: #6b7280; font-size: 13px; margin: 5px 0;">Fragen?</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              📧 <a href="mailto:satinglanzbyanamarija@gmail.com" style="color: #f43f5e; text-decoration: none;">satinglanzbyanamarija@gmail.com</a><br>
              🌐 <a href="https://satinglanzbyanamarija.com/" style="color: #f43f5e; text-decoration: none;">satinglanzbyanamarija.com</a>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">Mit ❤️ von Anamarija</p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: GMAIL_FROM,
      to: email,
      subject: '🔑 Passwort zurücksetzen - SatinGlanz by Anamarija',
      html: htmlContent,
    });

    return { success: true };
  } catch (error) {
    console.error('Custom password reset error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send password reset email');
  }
});

// Verify reset token and update password
export const verifyResetToken = functions.https.onCall(async (data: any, context) => {
  try {
    const { token, newPassword } = data;

    if (!token || !newPassword) {
      throw new functions.https.HttpsError('invalid-argument', 'Token and new password are required');
    }

    if (newPassword.length < 6) {
      throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters');
    }

    // Get token from Firestore
    const tokenDoc = await admin.firestore().collection('password_resets').doc(token).get();

    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Invalid or expired reset token');
    }

    const tokenData = tokenDoc.data();
    if (!tokenData) {
      throw new functions.https.HttpsError('not-found', 'Invalid reset token');
    }

    // Check if token is expired
    if (tokenData.expiresAt < Date.now()) {
      await admin.firestore().collection('password_resets').doc(token).delete();
      throw new functions.https.HttpsError('deadline-exceeded', 'Reset token has expired');
    }

    // Check if token was already used
    if (tokenData.used) {
      throw new functions.https.HttpsError('failed-precondition', 'Reset token has already been used');
    }

    // Update user password
    console.log('Updating password for user:', tokenData.userId);
    const updateResult = await admin.auth().updateUser(tokenData.userId, {
      password: newPassword,
    });
    console.log('Password update result:', updateResult);

    // Mark token as used
    await admin.firestore().collection('password_resets').doc(token).update({
      used: true,
      usedAt: Date.now(),
    });

    console.log('Password successfully updated for user:', tokenData.userId);
    return { success: true };
  } catch (error) {
    console.error('Verify reset token error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to reset password');
  }
});

// Send special bouquet request email (for 101+ roses)
export const sendSpecialBouquetRequest = functions.https.onCall(async (data: any, context) => {
  try {
    const transporter = createTransporter();
    const { customerEmail, customerPhone, roseCount, message } = data;

    if (!customerEmail || !customerPhone || !roseCount) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }

    // Email to Anamarija (shop owner)
    const ownerHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f43f5e, #ec4899); color: white; padding: 35px 30px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 700;">🌹 Spezielle Bouquet-Anfrage</h1>
          <p style="margin: 10px 0 0 0; font-size: 15px; opacity: 0.9;">Mehr als 101 Rosen</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #f3e8f0;">
          <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px;">Kundeninformationen</h3>
          
          <div style="background: #f9fafb; padding: 16px; border-radius: 10px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">
              <strong>📧 E-Mail:</strong> ${sanitize(customerEmail)}
            </p>
            <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">
              <strong>📞 Telefon:</strong> ${sanitize(customerPhone)}
            </p>
            <p style="margin: 0; color: #374151; font-size: 14px;">
              <strong>🌹 Anzahl der Rosen:</strong> ${Number(roseCount)}
            </p>
          </div>

          <h3 style="color: #1f2937; margin: 20px 0 12px 0; font-size: 16px;">Nachricht vom Kunden</h3>
          <div style="background: #fdf2f8; padding: 16px; border-radius: 10px; border-left: 4px solid #f43f5e;">
            <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
              ${sanitize(message)}
            </p>
          </div>

          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 10px; margin-top: 20px;">
            <p style="margin: 0; color: #92400e; font-size: 13px;">
              <strong>💡 Nächste Schritte:</strong><br>
              Bitte kontaktieren Sie den Kunden innerhalb von 24 Stunden, um ein individuelles Angebot für dieses spezielle Bouquet zu erstellen.
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: GMAIL_FROM,
      to: GMAIL_TO,
      subject: `🌹 Spezielle Bouquet-Anfrage: ${roseCount} Rosen von ${sanitize(customerEmail)}`,
      html: ownerHtml
    });

    // Confirmation email to customer
    const customerHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f43f5e, #ec4899); color: white; padding: 35px 30px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 700;">🌹 Anfrage erhalten!</h1>
          <p style="margin: 10px 0 0 0; font-size: 15px; opacity: 0.9;">SatinGlanz by Anamarija</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #f3e8f0;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Vielen Dank für Ihre Anfrage für ein spezielles Bouquet mit <strong>${Number(roseCount)} Rosen</strong>!
          </p>
          
          <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 18px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-size: 14px;">
              <strong>✓ Ihre Anfrage wurde erfolgreich gesendet</strong><br>
              Anamarija wird sich innerhalb von 24 Stunden bei Ihnen melden, um Ihr individuelles Bouquet zu besprechen und ein Angebot zu erstellen.
            </p>
          </div>

          <h3 style="color: #1f2937; margin: 20px 0 12px 0; font-size: 16px;">Ihre Anfrage-Details</h3>
          <div style="background: #f9fafb; padding: 16px; border-radius: 10px;">
            <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">
              <strong>Anzahl der Rosen:</strong> ${Number(roseCount)}
            </p>
            <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">
              <strong>E-Mail:</strong> ${sanitize(customerEmail)}
            </p>
            <p style="margin: 0; color: #374151; font-size: 14px;">
              <strong>Telefon:</strong> ${sanitize(customerPhone)}
            </p>
          </div>

          <div style="border-top: 1px solid #f3e8f0; padding-top: 20px; margin-top: 25px; text-align: center;">
            <p style="color: #6b7280; font-size: 13px; margin: 5px 0;">Mit ❤️ von Anamarija</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              📧 satinglanzbyanamarija@gmail.com
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: GMAIL_FROM,
      to: customerEmail,
      subject: '🌹 Ihre spezielle Bouquet-Anfrage wurde erhalten | SatinGlanz by Anamarija',
      html: customerHtml
    });

    return { success: true };
  } catch (error) {
    console.error('Special bouquet request error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send special bouquet request');
  }
});
