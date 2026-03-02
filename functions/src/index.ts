import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import Stripe from 'stripe';

admin.initializeApp();

let _stripe: Stripe | null = null;
const getStripe = () => {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
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

// Create Stripe Payment Intent
export const createPaymentIntent = functions.https.onCall(async (data: any, context) => {
  // Auth check: only authenticated users can create payment intents
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to make a payment.');
  }

  try {
    // Rate limiting: max 5 payment intents per user per 10 minutes
    const userId = context.auth.uid;
    const rateLimitRef = admin.firestore().collection('payment_rate_limit').doc(userId);
    const rateLimitDoc = await rateLimitRef.get();
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;

    if (rateLimitDoc.exists) {
      const data = rateLimitDoc.data();
      const recentAttempts = (data?.timestamps || []).filter((ts: number) => now - ts < tenMinutes);
      
      if (recentAttempts.length >= 5) {
        throw new functions.https.HttpsError('resource-exhausted', 'Too many payment attempts. Please try again later.');
      }
      
      await rateLimitRef.update({
        timestamps: [...recentAttempts, now]
      });
    } else {
      await rateLimitRef.set({
        timestamps: [now]
      });
    }

    const stripe = getStripe();
    const { amount, currency, customerEmail, orderId } = data;

    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid amount.');
    }

    // amount should be in cents
    const amountInCents = Math.round(amount * 100);

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
      receipt_email: customerEmail || context.auth.token.email,
      metadata: {
        orderId: orderId || '',
        userId: context.auth.uid,
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
          <h1 style="margin: 0; font-size: 26px; font-weight: 700;">🌹 Thank You for Your Order!</h1>
          <p style="margin: 10px 0 0 0; font-size: 15px; opacity: 0.9;">SatinGlanz by Anamarija</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #f3e8f0;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Dear <strong>${sanitize(addr.firstName)} ${sanitize(addr.lastName)}</strong>,
          </p>
          <p style="color: #6b7280; line-height: 1.6;">
            Thank you for your order! We've received it and will begin preparing your handcrafted satin roses with care.
          </p>
          
          <div style="background: #fdf2f8; padding: 16px 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #9d174d; font-size: 13px;">Order Number</p>
            <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 22px; font-weight: 700; letter-spacing: 2px;">#${orderNumber}</p>
          </div>

          <h3 style="color: #1f2937; margin: 25px 0 12px 0; font-size: 16px;">📦 Order Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: #fdf2f8;">
                <th style="padding: 10px 12px; text-align: left; color: #6b7280; font-weight: 600;">Item</th>
                <th style="padding: 10px 12px; text-align: center; color: #6b7280; font-weight: 600;">Qty</th>
                <th style="padding: 10px 12px; text-align: right; color: #6b7280; font-weight: 600;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 16px; padding: 16px; background: #f9fafb; border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #6b7280; font-size: 14px;">Subtotal</span>
              <span style="color: #1f2937; font-size: 14px; font-weight: 600;">€${orderData.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #6b7280; font-size: 14px;">Shipping (${orderData.shippingCarrier.toUpperCase()})</span>
              <span style="color: ${orderData.shippingCost === 0 ? '#10b981' : '#1f2937'}; font-size: 14px; font-weight: 600;">${shippingLabel}</span>
            </div>
            <div style="border-top: 2px solid #e5e7eb; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between;">
              <span style="color: #1f2937; font-size: 16px; font-weight: 700;">Total</span>
              <span style="color: #f43f5e; font-size: 16px; font-weight: 700;">€${orderData.total.toFixed(2)}</span>
            </div>
          </div>

          <h3 style="color: #1f2937; margin: 25px 0 12px 0; font-size: 16px;">📍 Shipping Address</h3>
          <div style="background: #f9fafb; padding: 16px; border-radius: 10px; color: #374151; font-size: 14px; line-height: 1.8;">
            ${sanitize(addr.firstName)} ${sanitize(addr.lastName)}<br>
            ${sanitize(addr.street)}<br>
            ${sanitize(addr.postalCode)} ${sanitize(addr.city)}<br>
            ${sanitize(addr.country)}<br>
            📞 ${sanitize(addr.phone)}
          </div>

          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 13px;">
              <strong>💡 What's next?</strong><br>
              We'll carefully handcraft your order and send you a shipping confirmation once it's on its way. Each piece is made with love and attention to detail.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0 10px 0;">
            <a href="https://satinglanzbyanamarija.com/account" style="background: #f43f5e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 14px;">
              View My Orders
            </a>
          </div>

          <div style="border-top: 1px solid #f3e8f0; padding-top: 20px; margin-top: 25px; text-align: center;">
            <p style="color: #6b7280; font-size: 13px; margin: 5px 0;">Made with ❤️ by Anamarija</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              📧 satinglanzbyanamarija@gmail.com<br>
              🌐 <a href="https://satinglanzbyanamarija.com/" style="color: #f43f5e;">satinglanzbyanamarija.com</a>
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
      subject: `🌹 Order Confirmation #${orderNumber} | SatinGlanz by Anamarija`,
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
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🌹 Welcome to SatinGlanz!</h1>
          <p style="margin: 12px 0 0 0; font-size: 16px; opacity: 0.95;">Handcrafted Satin Roses by Anamarija</p>
        </div>
        
        <div style="background: #ffffff; padding: 35px; border-radius: 0 0 16px 16px; border: 1px solid #f3e8f0;">
          <p style="color: #374151; font-size: 17px; line-height: 1.7;">
            Dear <strong>${sanitize(displayName)}</strong>,
          </p>
          <p style="color: #6b7280; line-height: 1.7; font-size: 15px;">
            Thank you for joining our community! We're thrilled to have you here. Each satin rose we create is handcrafted with love and attention to detail, making every piece unique and special.
          </p>
          
          <div style="background: #fdf2f8; padding: 20px; border-radius: 12px; margin: 25px 0;">
            <h3 style="color: #9d174d; margin: 0 0 12px 0; font-size: 16px;">✨ What makes us special:</h3>
            <ul style="color: #374151; line-height: 1.8; padding-left: 20px; margin: 0;">
              <li>100% handcrafted satin roses</li>
              <li>Perfect for weddings, events, and gifts</li>
              <li>Custom bouquets available</li>
              <li>Fast and reliable shipping</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://satinglanzbyanamarija.com/shop" style="background: #f43f5e; color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);">
              Start Shopping 🛍️
            </a>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 18px; border-radius: 10px; margin: 25px 0;">
            <p style="margin: 0; color: #166534; font-size: 14px;">
              <strong>🎁 Special Offer:</strong> Use code <strong>WELCOME10</strong> for 10% off your first order!
            </p>
          </div>

          <div style="border-top: 1px solid #f3e8f0; padding-top: 25px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">Need help? We're here for you!</p>
            <p style="color: #9ca3af; font-size: 13px; margin: 5px 0;">
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
      to: userEmail,
      subject: '🌹 Welcome to SatinGlanz by Anamarija!',
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
