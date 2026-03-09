'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { User, Package, LogOut, ShoppingBag, ArrowRight, Truck, ExternalLink, Plus, Key } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  color?: string;
}

interface Order {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  shippingCarrier: string;
  shippingCost: number;
  trackingNumber?: string;
  items: OrderItem[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

const getTrackingUrl = (carrier: string, trackingNumber: string): string => {
  switch (carrier) {
    case 'dhl':
      return `https://www.dhl.de/en/privatkunden/pakete-empfangen/verfolgen.html?piececode=${trackingNumber}`;
    case 'gls':
      return `https://gls-group.com/DE/en/parcel-tracking?match=${trackingNumber}`;
    default:
      return '';
  }
};

export default function AccountPage() {
  const { locale, t } = useLanguage();
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [claimOrderNumber, setClaimOrderNumber] = useState('');
  const [claimingOrder, setClaimingOrder] = useState(false);
  const [claimMessage, setClaimMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const claimOrder = async () => {
    if (!user || !claimOrderNumber.trim()) {
      setClaimMessage({ type: 'error', text: 'Please enter an order number' });
      return;
    }

    setClaimingOrder(true);
    setClaimMessage(null);

    try {
      // Try to find the order by ID
      const orderRef = doc(db, 'orders', claimOrderNumber.trim().toLowerCase());
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        setClaimMessage({ type: 'error', text: 'Order not found. Please check the order number.' });
        setClaimingOrder(false);
        return;
      }

      const orderData = orderSnap.data();

      // Check if order already has a userId
      if (orderData.userId && orderData.userId !== user.uid) {
        setClaimMessage({ type: 'error', text: 'This order is already claimed by another account.' });
        setClaimingOrder(false);
        return;
      }

      if (orderData.userId === user.uid) {
        setClaimMessage({ type: 'error', text: 'This order is already in your account.' });
        setClaimingOrder(false);
        return;
      }

      // Claim the order by adding userId
      await updateDoc(orderRef, {
        userId: user.uid,
        claimedAt: new Date().toISOString(),
      });

      // Refresh orders list
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(data);

      setClaimMessage({ type: 'success', text: t.account.claimSuccess });
      setClaimOrderNumber('');
    } catch (error) {
      console.error('Failed to claim order:', error);
      setClaimMessage({ type: 'error', text: 'Failed to claim order. Please try again.' });
    } finally {
      setClaimingOrder(false);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t.auth.statusPending;
      case 'pending_payment': return 'Awaiting Payment';
      case 'paid': return 'Paid';
      case 'payment_failed': return 'Payment Failed';
      case 'processing': return t.auth.statusProcessing;
      case 'shipped': return t.auth.statusShipped;
      case 'delivered': return t.auth.statusDelivered;
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'pending_payment': return 'bg-orange-100 text-orange-800';
      case 'paid': return 'bg-emerald-100 text-emerald-800';
      case 'payment_failed': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-rose-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {t.auth.welcome}, {user.displayName || user.email}
                </h1>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/account/change-password"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <Key className="w-4 h-4" />
                Change Password
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t.auth.logout}
              </button>
            </div>
          </div>
        </div>

        {/* Claim Guest Order */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Plus className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Claim Guest Order</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            If you placed an order as a guest, you can add it to your account by entering the order number.
          </p>
          
          <div className="flex gap-3">
            <input
              type="text"
              value={claimOrderNumber}
              onChange={(e) => setClaimOrderNumber(e.target.value)}
              placeholder="Enter order number (e.g., abc123def)"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              disabled={claimingOrder}
            />
            <button
              onClick={claimOrder}
              disabled={claimingOrder || !claimOrderNumber.trim()}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              {claimingOrder ? 'Claiming...' : 'Claim Order'}
            </button>
          </div>

          {claimMessage && (
            <div className={`mt-4 p-4 rounded-xl ${
              claimMessage.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {claimMessage.text}
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">{t.auth.myOrders}</h2>
          </div>

          {loadingOrders ? (
            <p className="text-gray-400 text-center py-8">{t.common.loading}</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">{t.auth.noOrders}</p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 font-semibold transition-colors"
              >
                {t.cart.continueShopping}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString(locale)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.name} × {item.quantity}
                          {item.color && <span className="text-gray-400 ml-1">({item.color})</span>}
                        </span>
                        <span className="text-gray-900 font-medium">
                          {t.common.currency}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Tracking */}
                  {order.trackingNumber && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-purple-800 font-medium">
                          {order.shippingCarrier.toUpperCase()} Tracking: <span className="font-mono">{order.trackingNumber}</span>
                        </span>
                      </div>
                      {getTrackingUrl(order.shippingCarrier, order.trackingNumber) && (
                        <a
                          href={getTrackingUrl(order.shippingCarrier, order.trackingNumber)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                        >
                          Track Package <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="text-sm text-gray-500">
                      {order.shippingCarrier.toUpperCase()} · {order.shippingCost === 0 ? 'FREE' : `${t.common.currency}${order.shippingCost.toFixed(2)}`}
                    </span>
                    <span className="font-bold text-gray-900">
                      {t.auth.orderTotal}: {t.common.currency}{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
