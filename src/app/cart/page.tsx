'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck, Check, MapPin } from 'lucide-react';
import { calculateCartShipping } from '@/lib/shippingCalculator';

export default function CartPage() {
  const { locale, t } = useLanguage();
  const { items, removeFromCart, updateQuantity, totalPrice, loading } = useCart();

  // Calculate shipping cost - must be called unconditionally (React hooks rule)
  const shippingCost = useMemo(() => {
    if (items.length === 0) return 0;
    try {
      return calculateCartShipping(items);
    } catch (error) {
      console.error('Shipping calculation error:', error);
      return 3.19;
    }
  }, [items]);

  const total = totalPrice + shippingCost;

  // Show loading state while cart is being fetched from Firestore
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

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
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <img 
                      src={item.product.images?.[0] || item.product.imageUrl || '/Placeholder.jpg'} 
                      alt={item.product.name[locale]} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/shop/${item.product.slug}`} className="font-semibold text-gray-900 hover:text-rose-600 transition-colors line-clamp-1">
                      {item.product.name[locale]}
                    </Link>
                    {item.selectedColor && (
                      <p className="text-sm text-gray-500 mt-1">{item.selectedColor}</p>
                    )}
                    <div className="relative inline-block mt-2">
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-300 to-rose-400 rounded-full blur-sm opacity-30"></div>
                      <div className="relative bg-gradient-to-br from-rose-100 via-rose-200 to-rose-100 px-3 py-1.5 rounded-full border border-rose-300/40">
                        <span className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">
                          {t.common.currency}{item.product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
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

            {/* Shipping Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-2">
                <Truck className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-bold text-gray-900">{t.cart.shipping}</h2>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs text-gray-400">{t.cart.germanyOnly}</p>
              </div>

              {totalPrice >= 70 ? (
                <div className="p-5 rounded-xl border-2 border-green-400 bg-green-50">
                  <div className="flex items-center gap-3 mb-2">
                    <Check className="w-6 h-6 text-green-600" />
                    <span className="text-lg font-bold text-green-900">{t.cart.freeShipping}</span>
                  </div>
                  <p className="text-sm text-green-700">🎉 {t.cart.freeShippingNote || 'Your order qualifies for free shipping!'}</p>
                  <p className="text-xs text-gray-600 mt-2">🚚 Delivery: 1-3 business days after order completion</p>
                </div>
              ) : (
                <div className="p-5 rounded-xl border-2 border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-gray-900">{t.cart.shippingCost}</span>
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-300 to-rose-400 rounded-full blur-sm opacity-30"></div>
                      <div className="relative bg-gradient-to-br from-rose-100 via-rose-200 to-rose-100 px-3 py-1.5 rounded-full border border-rose-300/40">
                        <span className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">
                          {t.common.currency}{shippingCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">✓ Tracking included</p>
                  <p className="text-xs text-gray-500">✓ 1-3 business days delivery</p>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                      💡 Add {t.common.currency}{(70 - totalPrice).toFixed(2)} more to get free shipping!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t.cart.orderSummary}</h2>

              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl opacity-40"></div>
                <div className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-rose-50 rounded-2xl p-6 border border-rose-200/50 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex justify-between text-gray-600">
                      <span>{t.cart.subtotal}</span>
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-300 to-rose-400 rounded-full blur-sm opacity-30"></div>
                        <div className="relative bg-gradient-to-br from-rose-100 via-rose-200 to-rose-100 px-3 py-1.5 rounded-full border border-rose-300/40">
                          <span className="font-semibold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">
                            {t.common.currency}{totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>{t.cart.shipping}</span>
                      <span className="font-semibold">
                        {shippingCost === 0 ? (
                          <span className="text-green-600">{t.cart.freeShipping}</span>
                        ) : (
                          `${t.common.currency}${shippingCost.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    <div className="border-t border-rose-200/50 pt-4 flex justify-between">
                      <span className="text-lg font-bold text-gray-900">{t.cart.total}</span>
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-300 to-rose-400 rounded-full blur-sm opacity-30"></div>
                        <div className="relative bg-gradient-to-br from-rose-100 via-rose-200 to-rose-100 px-4 py-2 rounded-full border border-rose-300/40">
                          <span className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">
                            {t.common.currency}{total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-300 to-rose-400 rounded-full blur-sm opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-rose-200 via-rose-300 to-rose-400 py-4 rounded-full shadow-xl border border-rose-400/30 text-center">
                  <span className="text-lg font-semibold text-gray-800">
                    {t.cart.checkout}
                  </span>
                </div>
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
