'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircle, Loader2, Package } from 'lucide-react';
import Link from 'next/link';

export default function SuccessPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'customOrders', orderId));
        if (orderDoc.exists()) {
          setOrder({ id: orderDoc.id, ...orderDoc.data() });
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your order. We've received your payment and will start processing your order right away.
          </p>

          {order && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-gray-500 mb-2">ORDER DETAILS</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-gray-900">{orderId.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Paid:</span>
                  <span className="font-bold text-rose-600">€{order.total?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-900">{order.customerEmail}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl mb-6 text-left">
            <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 mb-1">What happens next?</p>
              <p className="text-blue-700">
                You'll receive an email confirmation shortly. We'll notify you when your order is ready and shipped.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="block w-full px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-all"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
