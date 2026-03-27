'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

interface TrustBadgesProps {
  variant?: 'default' | 'compact' | 'checkout';
}

export default function TrustBadges({ variant = 'default' }: TrustBadgesProps) {
  const { t } = useLanguage();
  
  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-center gap-4 py-4 border-t border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Image src="/Secure Payment.png" alt="Secure Payment" width={16} height={16} className="w-4 h-4" />
          <span className="font-medium">{t.trustBadges.securePayment}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Image src="/Delivery.png" alt="Fast Delivery" width={16} height={16} className="w-4 h-4" />
          <span className="font-medium">{t.trustBadges.fastDelivery}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Image src="/Premium Roses.png" alt="Premium Quality" width={16} height={16} className="w-4 h-4" />
          <span className="font-medium">{t.trustBadges.premiumQuality}</span>
        </div>
      </div>
    );
  }

  if (variant === 'checkout') {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Image src="/Secure Payment.png" alt="Secure Payment" width={20} height={20} className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">{t.trustBadges.sslEncrypted}</h4>
              <p className="text-xs text-gray-600">{t.trustBadges.sslEncryptedDesc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Image src="/Secure Payment.png" alt="Secure Payment" width={20} height={20} className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">{t.trustBadges.securePaymentBadge}</h4>
              <p className="text-xs text-gray-600">{t.trustBadges.securePaymentBadgeDesc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <Image src="/Satisfaction.png" alt="Satisfaction" width={20} height={20} className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">{t.trustBadges.moneyBack}</h4>
              <p className="text-xs text-gray-600">{t.trustBadges.moneyBackDesc}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-12 border-t border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
          {t.trustBadges.whyShopWithUs}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Secure Payment */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Image src="/Secure Payment.png" alt="Secure Payment" width={32} height={32} className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{t.trustBadges.securePayment}</h4>
            <p className="text-sm text-gray-600">
              {t.trustBadges.securePaymentDesc}
            </p>
          </div>

          {/* Fast Delivery */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Image src="/Delivery.png" alt="Fast Delivery" width={32} height={32} className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{t.trustBadges.fastDelivery}</h4>
            <p className="text-sm text-gray-600">
              {t.trustBadges.fastDeliveryDesc}
            </p>
          </div>

          {/* Quality Guarantee */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full mb-4">
              <Image src="/Premium Roses.png" alt="Premium Quality" width={32} height={32} className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{t.trustBadges.premiumQuality}</h4>
            <p className="text-sm text-gray-600">
              {t.trustBadges.premiumQualityDesc}
            </p>
          </div>

          {/* Customer Support */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Image src="/Satisfaction.png" alt="Satisfaction" width={32} height={32} className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{t.trustBadges.satisfaction}</h4>
            <p className="text-sm text-gray-600">
              {t.trustBadges.satisfactionDesc}
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 mb-4">{t.trustBadges.weAccept}</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image src="/visa.png" alt="Visa" width={60} height={40} className="h-8 w-auto" />
            </div>
            <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image src="/masercard.png" alt="Mastercard" width={60} height={40} className="h-8 w-auto" />
            </div>
            <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image src="/American-Express-logo.png" alt="American Express" width={60} height={40} className="h-8 w-auto" />
            </div>
            <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image src="/Klarna.png" alt="Klarna" width={60} height={40} className="h-8 w-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
