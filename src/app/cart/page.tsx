'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck, Check, MapPin } from 'lucide-react';

const DHL_PRICE = 5.19;
const GLS_PRICE = 5.59;

export default function CartPage() {
  const { locale, t } = useLanguage();
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();
  const [selectedCarrier, setSelectedCarrier] = useState<'dhl' | 'gls'>('dhl');

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.cart.empty}</h1>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 font-semibold mt-4 transition-colors"
          >
            {t.cart.continueShopping}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const shippingCost = totalPrice >= 50 ? 0 : (selectedCarrier === 'dhl' ? DHL_PRICE : GLS_PRICE);
  const total = totalPrice + shippingCost;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10">{t.cart.title}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Cart Items + Shipping */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex gap-6">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0">
                    <img src="/Placeholder.jpg" alt="Satin Rose" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/shop/${item.product.slug}`} className="font-semibold text-gray-900 hover:text-rose-600 transition-colors line-clamp-1">
                      {item.product.name[locale]}
                    </Link>
                    {item.selectedColor && (
                      <p className="text-sm text-gray-500 mt-1">{item.selectedColor}</p>
                    )}
                    <p className="text-lg font-bold text-rose-500 mt-2">
                      {t.common.currency}{item.product.price.toFixed(2)}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-semibold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-2">
                <Truck className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-bold text-gray-900">{t.cart.selectShipping}</h2>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs text-gray-400">{t.cart.shippingNote}</p>
              </div>

              {totalPrice >= 50 ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-700">{t.cart.freeShipping} 🎉</p>
                    <p className="text-xs text-green-600">{t.cart.freeShippingNote} {t.common.currency}50.00</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* DHL */}
                    <button
                      onClick={() => setSelectedCarrier('dhl')}
                      className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                        selectedCarrier === 'dhl'
                          ? 'border-yellow-400 bg-yellow-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {selectedCarrier === 'dhl' && (
                        <div className="absolute top-3 right-3">
                          <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-yellow-900" />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl font-black text-yellow-500">DHL</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900 mb-2">
                        {t.common.currency}{DHL_PRICE.toFixed(2)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">✓ {t.cart.liability}</p>
                        <p className="text-xs text-gray-500">✓ {t.cart.tracking}</p>
                      </div>
                    </button>

                    {/* GLS */}
                    <button
                      onClick={() => setSelectedCarrier('gls')}
                      className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                        selectedCarrier === 'gls'
                          ? 'border-blue-400 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {selectedCarrier === 'gls' && (
                        <div className="absolute top-3 right-3">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl font-black text-blue-600">GLS</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900 mb-2">
                        {t.common.currency}{GLS_PRICE.toFixed(2)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">✓ {t.cart.liability}</p>
                        <p className="text-xs text-gray-500">✓ {t.cart.tracking}</p>
                      </div>
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 mt-4">
                    {t.cart.freeShippingNote} {t.common.currency}50.00
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t.cart.orderSummary}</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>{t.cart.subtotal}</span>
                  <span className="font-semibold">{t.common.currency}{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1.5">
                    {t.cart.shipping}
                    {shippingCost > 0 && (
                      <span className="text-xs text-gray-400">({selectedCarrier.toUpperCase()})</span>
                    )}
                  </span>
                  <span className="font-semibold">
                    {shippingCost === 0 ? (
                      <span className="text-green-500">{t.cart.freeShipping}</span>
                    ) : (
                      `${t.common.currency}${shippingCost.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-4 flex justify-between">
                  <span className="text-lg font-bold text-gray-900">{t.cart.total}</span>
                  <span className="text-lg font-bold text-gray-900">{t.common.currency}{total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-full font-semibold text-lg transition-all hover:shadow-lg hover:shadow-rose-200 text-center"
              >
                {t.cart.checkout}
              </Link>

              <Link
                href="/shop"
                className="block text-center text-sm text-gray-500 hover:text-rose-500 mt-4 transition-colors"
              >
                {t.cart.continueShopping}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
