'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DollarSign, TrendingUp, Package, Truck, FileText, Send, Download } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

interface FinancialOrder {
  id: string;
  createdAt: string;
  total: number;
  subtotal: number;
  status: string;
  shippingCost: number;
  userEmail: string;
  items: { 
    name: string; 
    quantity: number; 
    price: number; 
    productId?: string;
  }[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

interface ProductCosts {
  [productId: string]: {
    materialCost: number;
    laborCost: number;
  };
}

export default function FinancialDashboard() {
  const [orders, setOrders] = useState<FinancialOrder[]>([]);
  const [productCosts, setProductCosts] = useState<ProductCosts>({});
  const [loading, setLoading] = useState(true);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  const [invoiceSuccess, setInvoiceSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch orders
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const ordersData = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as FinancialOrder[];
      setOrders(ordersData);

      // Fetch product costs
      const productsSnap = await getDocs(collection(db, 'products'));
      const costs: ProductCosts = {};
      productsSnap.docs.forEach(doc => {
        const data = doc.data();
        costs[doc.id] = {
          materialCost: data.materialCost || 0,
          laborCost: data.laborCost || 0,
        };
      });
      setProductCosts(costs);
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate financial metrics
  const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'processing' || o.status === 'shipped' || o.status === 'delivered');
  
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const totalShippingRevenue = paidOrders.reduce((sum, order) => sum + order.shippingCost, 0);
  const totalProductRevenue = paidOrders.reduce((sum, order) => sum + order.subtotal, 0);
  
  // Calculate total costs
  let totalMaterialCosts = 0;
  let totalLaborCosts = 0;
  
  paidOrders.forEach(order => {
    order.items.forEach(item => {
      if (item.productId && productCosts[item.productId]) {
        totalMaterialCosts += productCosts[item.productId].materialCost * item.quantity;
        totalLaborCosts += productCosts[item.productId].laborCost * item.quantity;
      }
    });
  });
  
  const totalCosts = totalMaterialCosts + totalLaborCosts;
  const netProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const sendInvoice = async (order: FinancialOrder) => {
    setSendingInvoice(order.id);
    setInvoiceSuccess(null);
    
    try {
      const functions = getFunctions(app, 'us-central1');
      const sendInvoiceEmail = httpsCallable(functions, 'sendInvoiceEmail');
      
      await sendInvoiceEmail({
        orderId: order.id,
        customerEmail: order.userEmail,
        orderData: order,
      });
      
      setInvoiceSuccess(order.id);
      setTimeout(() => setInvoiceSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to send invoice:', err);
      alert('Failed to send invoice. Please try again.');
    } finally {
      setSendingInvoice(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading financial data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">€{totalRevenue.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">{paidOrders.length} paid orders</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Product Revenue</span>
            <Package className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">€{totalProductRevenue.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">From product sales</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Shipping Revenue</span>
            <Truck className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">€{totalShippingRevenue.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">From shipping fees</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Net Profit</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">€{netProfit.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">{profitMargin.toFixed(1)}% margin</div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Cost Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Material Costs</div>
            <div className="text-xl font-bold text-gray-900">€{totalMaterialCosts.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Labor Costs</div>
            <div className="text-xl font-bold text-gray-900">€{totalLaborCosts.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Total Costs</div>
            <div className="text-xl font-bold text-gray-900">€{totalCosts.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Orders with Invoice Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Orders & Invoices
        </h3>
        <div className="space-y-3">
          {paidOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No paid orders yet</div>
          ) : (
            paidOrders.map(order => {
              const orderCosts = order.items.reduce((sum, item) => {
                if (item.productId && productCosts[item.productId]) {
                  return sum + (productCosts[item.productId].materialCost + productCosts[item.productId].laborCost) * item.quantity;
                }
                return sum;
              }, 0);
              const orderProfit = order.total - orderCosts;

              return (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-gray-900">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString()} • {order.userEmail}
                    </div>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-gray-600">Revenue: <strong>€{order.total.toFixed(2)}</strong></span>
                      <span className="text-gray-600">Costs: <strong>€{orderCosts.toFixed(2)}</strong></span>
                      <span className="text-green-600">Profit: <strong>€{orderProfit.toFixed(2)}</strong></span>
                    </div>
                  </div>
                  <button
                    onClick={() => sendInvoice(order)}
                    disabled={sendingInvoice === order.id}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {sendingInvoice === order.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : invoiceSuccess === order.id ? (
                      <>
                        <Download className="w-4 h-4" />
                        Sent!
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Invoice
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
