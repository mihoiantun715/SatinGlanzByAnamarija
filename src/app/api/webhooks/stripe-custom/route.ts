import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize Firebase only if not already initialized
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle payment success
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;

    if (orderId && paymentIntent.metadata.orderType === 'custom_order') {
      try {
        // Update custom order status to paid
        await updateDoc(doc(db, 'customOrders', orderId), {
          status: 'paid',
          paidAt: new Date().toISOString(),
          stripePaymentIntentId: paymentIntent.id,
        });

        console.log(`Custom order ${orderId} marked as paid`);
      } catch (error) {
        console.error('Error updating custom order:', error);
      }
    }
  }

  // Handle payment failure
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;

    if (orderId && paymentIntent.metadata.orderType === 'custom_order') {
      try {
        await updateDoc(doc(db, 'customOrders', orderId), {
          status: 'payment_failed',
        });

        console.log(`Custom order ${orderId} payment failed`);
      } catch (error) {
        console.error('Error updating custom order:', error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
