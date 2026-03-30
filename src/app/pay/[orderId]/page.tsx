'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Check, Loader2, CreditCard } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ orderId, total }: { orderId: string; total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/pay/${orderId}/success`,
        },
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        setProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay €{total.toFixed(2)}
          </>
        )}
      </button>

      <p className="text-xs text-center text-gray-500">
        Secure payment powered by Stripe. Your payment information is encrypted and secure.
      </p>
    </form>
  );
}

export default function PaymentPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'customOrders', orderId));
        
        if (!orderDoc.exists()) {
          setError('Order not found');
          setLoading(false);
          return;
        }

        const orderData = { id: orderDoc.id, ...orderDoc.data() } as any;
        setOrder(orderData);

        // If already paid, redirect to success
        if (orderData.status === 'paid') {
          window.location.href = `/pay/${orderId}/success`;
          return;
        }

        // Create payment intent
        const response = await fetch('/api/create-custom-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            amount: orderData.total,
            customerEmail: orderData.customerEmail,
            customerName: orderData.customerName,
          }),
        });

        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError('Failed to initialize payment');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-2">{error || 'Order not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Order</h1>
          <p className="text-gray-600">Secure payment for your custom order</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-3 mb-4">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.quantity}x {item.description}</span>
                <span className="font-semibold text-gray-900">€{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 mb-1">NOTES</p>
              <p className="text-sm text-gray-700">{order.notes}</p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-rose-600">€{order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Details</h2>
          
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm orderId={orderId} total={order.total} />
            </Elements>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Initializing payment...</p>
            </div>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            <span>PCI Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
