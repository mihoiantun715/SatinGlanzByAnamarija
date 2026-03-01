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

// Create Stripe Payment Intent
export const createPaymentIntent = functions.https.onCall(async (data: any, context) => {
  // Auth check: only authenticated users can create payment intents
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to make a payment.');
  }

  try {
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

// Send contact form email (no auth required - public contact form)
export const sendContactEmail = functions.https.onCall(async (data: any) => {
  try {
    const { name, email, subject, message } = data;

    // Input validation
    if (!name || !email || !subject || !message) {
      throw new functions.https.HttpsError('invalid-argument', 'All fields are required.');
    }
    if (typeof email !== 'string' || !email.includes('@') || email.length > 254) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email address.');
    }
    if (String(name).length > 200 || String(subject).length > 500 || String(message).length > 5000) {
      throw new functions.https.HttpsError('invalid-argument', 'Input too long.');
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
