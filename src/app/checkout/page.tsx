'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { db, app } from '@/lib/firebase';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Lock, MapPin, Check, ShoppingBag, ArrowRight, Truck, CreditCard, Shield, AlertCircle } from 'lucide-react';

const DHL_PRICE = 5.19;
const GLS_PRICE = 5.59;

const stripePromise = loadStripe('pk_test_51T6HdeRtazItoQroQhhnCNc9DZv9PpgrnHSZJtvEICpz40czkzfcasdxzuImY5PleiAuRZ3e7EohhtODWWpYXUsN00aB1M1Ew5');

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

function CheckoutForm() {
  const { locale, t } = useLanguage();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const stripe = useStripe();
  const elements = useElements();

  const [selectedCarrier, setSelectedCarrier] = useState<'dhl' | 'gls'>('dhl');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [cardComplete, setCardComplete] = useState(false);

  const shippingCost = totalPrice >= 50 ? 0 : (selectedCarrier === 'dhl' ? DHL_PRICE : GLS_PRICE);
  const total = totalPrice + shippingCost;

  // Order success
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{t.checkout.orderSuccess}</h1>
          <p className="text-gray-500 mb-4">{t.checkout.orderSuccessMessage}</p>
          <p className="text-sm text-gray-400 mb-8">
            {t.checkout.orderNumber}: <span className="font-mono font-semibold text-gray-700">#{orderId.slice(0, 8).toUpperCase()}</span>
          </p>
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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName || !street || !city || !postalCode || !phone) {
      setError(t.auth.errorGeneric);
      return;
    }

    if (!stripe || !elements) {
      setError('Payment system is loading. Please wait.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Payment card not found. Please refresh the page.');
      return;
    }

    setLoading(true);
    try {
      // 1. Save order to Firestore first
      const orderData = {
        userId: user!.uid,
        userEmail: user!.email,
        status: 'pending_payment',
        createdAt: new Date().toISOString(),
        shippingCarrier: selectedCarrier,
        shippingCost,
        subtotal: totalPrice,
        total,
        shippingAddress: {
          firstName,
          lastName,
          street,
          city,
          postalCode,
          country: 'Germany',
          phone,
        },
        items: items.map(item => ({
          productId: item.product.id,
          name: item.product.name[locale],
          price: item.product.price,
          quantity: item.quantity,
          color: item.selectedColor || '',
        })),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);

      // 2. Create payment intent via Cloud Function
      const functions = getFunctions(app, 'us-central1');
      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      const result = await createPaymentIntent({
        amount: total,
        currency: 'eur',
        customerEmail: user!.email,
        orderId: docRef.id,
      });

      const { clientSecret } = result.data as { clientSecret: string };

      // 3. Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${firstName} ${lastName}`,
            email: user!.email || undefined,
            phone: phone,
            address: {
              line1: street,
              city: city,
              postal_code: postalCode,
              country: 'DE',
            },
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed. Please try again.');
        // Update order status to failed
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'orders', docRef.id), { status: 'payment_failed' });
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // 4. Update order status to paid
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'orders', docRef.id), {
          status: 'paid',
          stripePaymentIntentId: paymentIntent.id,
        });

        setOrderId(docRef.id);
        setOrderPlaced(true);
        clearCart();

        // 5. Send order confirmation email (non-blocking)
        try {
          const sendOrderEmail = httpsCallable(functions, 'sendOrderEmail');
          await sendOrderEmail({ orderData: { ...orderData, status: 'paid' }, orderId: docRef.id });
        } catch (emailErr) {
          console.error('Email send failed (order still placed):', emailErr);
        }
      }
    } catch (err: any) {
      console.error('Order error:', err);
      setError(err?.message || t.auth.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10">{t.checkout.title}</h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Address + Shipping + Payment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-bold text-gray-900">{t.checkout.shippingAddress}</h2>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.checkout.firstName}</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.checkout.lastName}</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.checkout.street}</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.checkout.postalCode}</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.checkout.city}</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.checkout.country}</label>
                    <input
                      type="text"
                      value={t.checkout.germany}
                      disabled
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-sm text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.checkout.phone}</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Truck className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-bold text-gray-900">{t.cart.selectShipping}</h2>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
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
                      <span className="text-2xl font-black text-yellow-500">DHL</span>
                      <div className="text-xl font-bold text-gray-900 mt-2">{t.common.currency}{DHL_PRICE.toFixed(2)}</div>
                      <p className="text-xs text-gray-500 mt-1">✓ {t.cart.tracking}</p>
                    </button>

                    <button
                      type="button"
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
                      <span className="text-2xl font-black text-blue-600">GLS</span>
                      <div className="text-xl font-bold text-gray-900 mt-2">{t.common.currency}{GLS_PRICE.toFixed(2)}</div>
                      <p className="text-xs text-gray-500 mt-1">✓ {t.cart.tracking}</p>
                    </button>
                  </div>
                )}
              </div>

              {/* Important Notices */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900 mb-2">Important: No Refunds for Handmade Products</h3>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      All our products are handcrafted to order. Due to the custom nature of handmade items, <strong>we do not accept returns or offer refunds</strong> unless the product is defective or damaged upon arrival. Please review your order carefully before completing your purchase.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-4 border-t border-amber-200">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900 mb-2">Fraud Protection</h3>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      All orders are verified and monitored for fraudulent activity. Suspicious orders may be cancelled. By placing an order, you agree to our <Link href="/terms" className="underline hover:text-amber-900">Terms & Conditions</Link> and <Link href="/refund-policy" className="underline hover:text-amber-900">Refund Policy</Link>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-bold text-gray-900">Payment</h2>
                </div>

                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 focus-within:ring-2 focus-within:ring-rose-300 focus-within:border-rose-300 transition-all">
                  <CardElement
                    options={cardElementOptions}
                    onChange={(e) => setCardComplete(e.complete)}
                  />
                </div>

                <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                  <Shield className="w-4 h-4" />
                  <span>Secured by Stripe. Your card details are encrypted and never stored on our servers.</span>
                </div>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{t.cart.orderSummary}</h2>

                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-gray-700 truncate mr-2">
                        {item.product.name[locale]} × {item.quantity}
                      </span>
                      <span className="font-medium text-gray-900 whitespace-nowrap">
                        {t.common.currency}{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-4 mb-6">
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
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="text-lg font-bold text-gray-900">{t.cart.total}</span>
                    <span className="text-lg font-bold text-gray-900">{t.common.currency}{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !stripe || !cardComplete}
                  className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white py-4 rounded-full font-semibold text-lg transition-all hover:shadow-lg hover:shadow-rose-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pay {t.common.currency}{total.toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { items } = useCart();

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.checkout.loginRequired}</h1>
          <p className="text-gray-500 mb-6">{t.checkout.loginToCheckout}</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-sm transition-all"
            >
              {t.auth.login}
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-semibold text-sm transition-all"
            >
              {t.auth.register}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">{t.common.loading}</div>
      </div>
    );
  }

  // Empty cart
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
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
