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

// Stripe Webhook Handler - Updates order status when payment succeeds
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    res.status(500).send('Webhook secret not configured');
    return;
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    res.status(400).send('No signature');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    try {
      const orderId = session.metadata?.orderId;
      
      if (!orderId) {
        console.error('No orderId in session metadata');
        res.status(400).send('No orderId in metadata');
        return;
      }

      // Update order status to paid
      await admin.firestore().collection('orders').doc(orderId).update({
        status: 'paid',
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        paidAt: new Date().toISOString(),
      });

      console.log(`Order ${orderId} marked as paid`);
      
      // Send order confirmation email
      try {
        const orderDoc = await admin.firestore().collection('orders').doc(orderId).get();
        const orderData = orderDoc.data();
        
        if (orderData) {
          // Trigger email function
          const sendOrderEmail = functions.httpsCallable('sendOrderEmail');
          await sendOrderEmail({ 
            orderData: { ...orderData, status: 'paid' }, 
            orderId: orderId 
          });
        }
      } catch (emailErr) {
        console.error('Failed to send order email:', emailErr);
        // Don't fail the webhook if email fails
      }

      res.json({ received: true, orderId });
    } catch (error: any) {
      console.error('Error updating order:', error);
      res.status(500).send(`Error: ${error.message}`);
    }
  } else {
    // Return a 200 response for other event types
    res.json({ received: true });
  }
});
