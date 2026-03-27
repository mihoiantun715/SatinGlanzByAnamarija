'use client';

import React from 'react';
import { Shield, Lock, Package, CreditCard, Award, CheckCircle } from 'lucide-react';
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
          <Shield className="w-4 h-4 text-green-600" />
          <span className="font-medium">{t.trustBadges.securePayment}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Package className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{t.trustBadges.fastDelivery}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Award className="w-4 h-4 text-rose-600" />
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
              <Lock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">{t.trustBadges.sslEncrypted}</h4>
              <p className="text-xs text-gray-600">{t.trustBadges.sslEncryptedDesc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">{t.trustBadges.securePaymentBadge}</h4>
              <p className="text-xs text-gray-600">{t.trustBadges.securePaymentBadgeDesc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-rose-600" />
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
              <Lock className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{t.trustBadges.securePayment}</h4>
            <p className="text-sm text-gray-600">
              {t.trustBadges.securePaymentDesc}
            </p>
          </div>

          {/* Fast Delivery */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{t.trustBadges.fastDelivery}</h4>
            <p className="text-sm text-gray-600">
              {t.trustBadges.fastDeliveryDesc}
            </p>
          </div>

          {/* Quality Guarantee */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full mb-4">
              <Award className="w-8 h-8 text-rose-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{t.trustBadges.premiumQuality}</h4>
            <p className="text-sm text-gray-600">
              {t.trustBadges.premiumQualityDesc}
            </p>
          </div>

          {/* Customer Support */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-purple-600" />
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
            <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
              <span className="text-sm font-semibold text-gray-700">💳 Visa</span>
            </div>
            <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
              <span className="text-sm font-semibold text-gray-700">💳 Mastercard</span>
            </div>
            <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
              <span className="text-sm font-semibold text-gray-700">💳 Amex</span>
            </div>
            <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
              <span className="text-sm font-semibold text-gray-700">🛍️ Klarna</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
