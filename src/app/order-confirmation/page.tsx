'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{t.checkout.orderSuccess}</h1>
        <p className="text-gray-500 mb-4">{t.checkout.orderSuccessMessage}</p>
        {orderId && (
          <p className="text-sm text-gray-400 mb-8">
            {t.checkout.orderNumber}: <span className="font-mono font-semibold text-gray-700">#{orderId.slice(0, 8).toUpperCase()}</span>
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Link
            href="/account"
            className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-sm transition-all"
          >
            {t.auth.myOrders}
          </Link>
          <Link
            href="/shop"
            className="px-6 py-3 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-semibold text-sm transition-all"
          >
            {t.checkout.backToShop}
          </Link>
        </div>
      </div>
    </div>
  );
}
