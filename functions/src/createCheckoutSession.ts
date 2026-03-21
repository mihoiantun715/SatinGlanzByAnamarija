import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Get Stripe instance
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-04-30.basil' as any,
  });
};

// Create Stripe Checkout Session (supports Klarna + Card natively)
export const createCheckoutSession = functions.https.onCall(async (data: any, context) => {
  try {
    const stripe = getStripe();
    const { orderId, successUrl, cancelUrl } = data;

    if (!orderId) {
      throw new functions.https.HttpsError('invalid-argument', 'Order ID is required.');
    }

    // Fetch order from Firestore
    const orderDoc = await admin.firestore().collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found.');
    }

    const orderData = orderDoc.data();
    if (!orderData) {
      throw new functions.https.HttpsError('invalid-argument', 'Order data is invalid.');
    }

    // Create line items from order
    const lineItems = orderData.items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name || 'Product',
          description: item.color ? `Color: ${item.color}` : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity || 1,
    }));

    // Add shipping as a line item
    if (orderData.shippingCost && orderData.shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Shipping',
          },
          unit_amount: Math.round(orderData.shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'klarna'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl || `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/checkout`,
      customer_email: orderData.userEmail || undefined,
      metadata: {
        orderId: orderId,
        userId: orderData.userId || 'guest',
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error: any) {
    console.error('Checkout session error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to create checkout session');
  }
});
