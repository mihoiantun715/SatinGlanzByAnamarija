'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Lock, MapPin, Check, ShoppingBag, ArrowRight, Truck, CreditCard, Shield, AlertCircle, CheckCircle, Package } from 'lucide-react';
import { calculateCartShipping, getRecommendedCarrier } from '@/lib/shippingCalculator';
import AddressAutocomplete from '@/components/AddressAutocomplete';

const stripePromise = loadStripe('pk_live_51T6HdURxZ5rzXIkdeQqyjWs9mTaYOvCQNeGlgukCgvMNs4MrasTO6Tr9zoIp2Dfcxdcak60DiBQkkAE6iuWGg9fO00OCC5EmrL');

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
  const router = useRouter();
  const { locale, t } = useLanguage();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const stripe = useStripe();
  const elements = useElements();

  // Get recommended carrier based on cart items (DHL for bouquets, GLS for products)
  const recommendedCarrier = useMemo(() => getRecommendedCarrier(items), [items]);
  
  const [selectedCarrier, setSelectedCarrier] = useState<'dhl' | 'gls'>(recommendedCarrier);
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Handle address autocomplete selection
  const handlePlaceSelected = (place: { street: string; city: string; postalCode: string }) => {
    setStreet(place.street);
    setCity(place.city);
    setPostalCode(place.postalCode);
  };

  // Calculate shipping cost based on box sizes and bouquet rose counts
  const shippingCost = useMemo(() => {
    return calculateCartShipping(items, selectedCarrier);
  }, [items, selectedCarrier]);
  
  const total = totalPrice + shippingCost;

  // Update selected carrier when recommended carrier changes
  useEffect(() => {
    setSelectedCarrier(recommendedCarrier);
  }, [recommendedCarrier]);


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
        ...(user ? { userId: user.uid, userEmail: user.email } : {}),
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
        customerEmail: user?.email || `guest-${docRef.id}@satinglanz.com`,
        orderId: docRef.id,
      });

      const { clientSecret } = result.data as { clientSecret: string };

      // 3. Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${firstName} ${lastName}`,
            email: user?.email || undefined,
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

        // 5. Send order confirmation email (non-blocking)
        try {
          const sendOrderEmail = httpsCallable(functions, 'sendOrderEmail');
          await sendOrderEmail({ orderData: { ...orderData, status: 'paid' }, orderId: docRef.id });
        } catch (emailErr) {
          console.error('Email send failed (order still placed):', emailErr);
        }

        // 6. Show success modal and set order ID
        setOrderId(docRef.id);
        setShowSuccessModal(true);
        
        // Clear cart after showing modal
        clearCart();
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
                    <AddressAutocomplete
                      value={street}
                      onChange={setStreet}
                      onPlaceSelected={handlePlaceSelected}
                      placeholder={t.checkout.street}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
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
                      <div className="text-xl font-bold text-gray-900 mt-2">
                        {t.common.currency}{calculateCartShipping(items, 'dhl').toFixed(2)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">✓ {t.cart.tracking}</p>
                      {recommendedCarrier === 'dhl' && (
                        <p className="text-xs text-yellow-600 font-semibold mt-1">⭐ Empfohlen</p>
                      )}
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
                      <div className="text-xl font-bold text-gray-900 mt-2">
                        {t.common.currency}{calculateCartShipping(items, 'gls').toFixed(2)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">✓ {t.cart.tracking}</p>
                      {recommendedCarrier === 'gls' && (
                        <p className="text-xs text-blue-600 font-semibold mt-1">⭐ Empfohlen</p>
                      )}
                    </button>
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

              {/* Terms & Conditions Checkbox */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="text-xs text-gray-600 leading-relaxed">
                    {locale === 'de' ? (
                      <>Ich habe die <Link href="/terms" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">AGB</Link>, <Link href="/refund-policy" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Widerrufsbelehrung</Link> und <Link href="/privacy" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Datenschutzerklärung</Link> gelesen und akzeptiere diese.</>
                    ) : locale === 'en' ? (
                      <>I have read and accept the <Link href="/terms" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Terms & Conditions</Link>, <Link href="/refund-policy" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Refund Policy</Link> and <Link href="/privacy" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Privacy Policy</Link>.</>
                    ) : locale === 'hr' ? (
                      <>Pročitao/la sam i prihvaćam <Link href="/terms" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Opće uvjete</Link>, <Link href="/refund-policy" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Politiku povrata</Link> i <Link href="/privacy" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Politiku privatnosti</Link>.</>
                    ) : locale === 'ro' ? (
                      <>Am citit și accept <Link href="/terms" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Termenii și Condițiile</Link>, <Link href="/refund-policy" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Politica de rambursare</Link> și <Link href="/privacy" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Politica de confidențialitate</Link>.</>
                    ) : locale === 'bg' ? (
                      <>Прочетох и приемам <Link href="/terms" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Общите условия</Link>, <Link href="/refund-policy" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Политиката за възстановяване</Link> и <Link href="/privacy" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Политиката за поверителност</Link>.</>
                    ) : (
                      <><Link href="/terms" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Şartlar ve Koşulları</Link>, <Link href="/refund-policy" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">İade Politikasını</Link> ve <Link href="/privacy" target="_blank" className="text-rose-600 underline hover:text-rose-700 font-medium">Gizlilik Politikasını</Link> okudum ve kabul ediyorum.</>
                    )}
                  </span>
                </label>
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
                  disabled={loading || !stripe || !cardComplete || !termsAccepted}
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

        {/* Payment Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
              {/* Success Header */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {t.checkout.orderSuccess || 'Narudžba uspješno poslana!'}
                </h2>
                <p className="text-green-50 text-sm">
                  {t.checkout.orderSuccessMessage || 'Hvala na narudžbi! Uskoro ćemo je obraditi i poslati vam e-mail s potvrdom.'}
                </p>
              </div>

              {/* Order Details */}
              <div className="p-8">
                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="w-5 h-5 text-gray-600" />
                    <p className="text-sm text-gray-600 font-medium">
                      {t.checkout.orderNumber || 'Broj narudžbe'}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 font-mono">
                    #{orderId.slice(0, 8).toUpperCase()}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Plaćanje potvrđeno</p>
                      <p className="text-xs text-gray-500">Vaša uplata je uspješno obrađena</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">E-mail potvrda poslana</p>
                      <p className="text-xs text-gray-500">Provjerite svoj inbox</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Priprema za dostavu</p>
                      <p className="text-xs text-gray-500">Pratit ćemo vas putem e-maila</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => router.push('/account')}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-rose-500/30"
                  >
                    {t.auth.myOrders || 'Moje narudžbe'}
                  </button>
                  <button
                    onClick={() => router.push('/shop')}
                    className="w-full px-6 py-3.5 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-semibold text-sm transition-all"
                  >
                    {t.checkout.backToShop || 'Nastavi kupovinu'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
