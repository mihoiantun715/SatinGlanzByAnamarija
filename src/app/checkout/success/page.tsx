'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { clearCart } = useCart();
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    // Get order ID from URL params
    const orderIdFromUrl = searchParams.get('orderId');
    if (orderIdFromUrl) {
      setOrderId(orderIdFromUrl);
      // Clear cart after successful payment
      clearCart();
    }
  }, [searchParams, clearCart]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Payment Successful! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Thank you for your order. We've received your payment.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
          {orderId && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Package className="w-5 h-5 text-gray-600" />
                <p className="text-sm text-gray-600 font-medium">
                  Order Number
                </p>
              </div>
              <p className="text-2xl font-bold text-gray-900 font-mono">
                #{orderId.slice(0, 8).toUpperCase()}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Payment Confirmed</p>
                <p className="text-xs text-gray-500">Your payment has been successfully processed</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Email Confirmation Sent</p>
                <p className="text-xs text-gray-500">Check your inbox for order details</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Preparing for Delivery</p>
                <p className="text-xs text-gray-500">Your order will be delivered in 1-3 business days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/account')}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-semibold text-center transition-all shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2"
          >
            <Package className="w-5 h-5" />
            View My Orders
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 px-6 py-4 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-semibold text-center transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? <Link href="/contact" className="text-rose-500 hover:text-rose-600 font-semibold">Contact us</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
