'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { BarChart3, Users, Eye, TrendingUp, Calendar } from 'lucide-react';

interface PageView {
  page: string;
  timestamp: Timestamp;
  userAgent: string;
  referrer: string;
}

interface PageStats {
  page: string;
  views: number;
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [weekViews, setWeekViews] = useState(0);
  const [topPages, setTopPages] = useState<PageStats[]>([]);
  const [recentViews, setRecentViews] = useState<PageView[]>([]);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const analyticsRef = collection(db, 'analytics');
      
      // Get all views for total count
      const allViewsQuery = query(analyticsRef, orderBy('timestamp', 'desc'));
      const allViewsSnapshot = await getDocs(allViewsQuery);
      setTotalViews(allViewsSnapshot.size);

      // Get today's views
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayQuery = query(
        analyticsRef,
        where('timestamp', '>=', Timestamp.fromDate(today)),
        orderBy('timestamp', 'desc')
      );
      const todaySnapshot = await getDocs(todayQuery);
      setTodayViews(todaySnapshot.size);

      // Get this week's views
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekQuery = query(
        analyticsRef,
        where('timestamp', '>=', Timestamp.fromDate(weekAgo)),
        orderBy('timestamp', 'desc')
      );
      const weekSnapshot = await getDocs(weekQuery);
      setWeekViews(weekSnapshot.size);

      // Calculate top pages
      const pageViewsMap: { [key: string]: number } = {};
      allViewsSnapshot.forEach((doc) => {
        const data = doc.data();
        const page = data.page || '/';
        pageViewsMap[page] = (pageViewsMap[page] || 0) + 1;
      });

      const topPagesArray = Object.entries(pageViewsMap)
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);
      setTopPages(topPagesArray);

      // Get recent views based on time range
      let recentQuery;
      if (timeRange === 'today') {
        recentQuery = query(
          analyticsRef,
          where('timestamp', '>=', Timestamp.fromDate(today)),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
      } else if (timeRange === 'week') {
        recentQuery = query(
          analyticsRef,
          where('timestamp', '>=', Timestamp.fromDate(weekAgo)),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
      } else {
        recentQuery = query(analyticsRef, orderBy('timestamp', 'desc'), limit(100));
      }

      const recentSnapshot = await getDocs(recentQuery);
      const recentData: PageView[] = [];
      recentSnapshot.forEach((doc) => {
        recentData.push(doc.data() as PageView);
      });
      setRecentViews(recentData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp?.toDate) return 'N/A';
    return timestamp.toDate().toLocaleString();
  };

  const getPageName = (path: string) => {
    const pageNames: { [key: string]: string } = {
      '/': 'Home',
      '/shop': 'Shop',
      '/about': 'About',
      '/contact': 'Contact',
      '/cart': 'Cart',
      '/checkout': 'Checkout',
      '/build-bouquet': 'Bouquet Builder',
      '/account': 'Account',
      '/login': 'Login',
      '/register': 'Register',
    };
    
    if (pageNames[path]) return pageNames[path];
    if (path.startsWith('/shop/')) return `Product: ${path.split('/').pop()}`;
    return path;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Today</span>
          </div>
          <div className="text-3xl font-bold">{todayViews}</div>
          <div className="text-sm opacity-80 mt-1">Page Views</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">This Week</span>
          </div>
          <div className="text-3xl font-bold">{weekViews}</div>
          <div className="text-sm opacity-80 mt-1">Page Views</div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">All Time</span>
          </div>
          <div className="text-3xl font-bold">{totalViews}</div>
          <div className="text-sm opacity-80 mt-1">Total Views</div>
        </div>
      </div>

      {/* Top Pages */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          <h3 className="font-bold text-gray-900">Top Pages</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {topPages.map((page, index) => (
              <div key={page.page} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-600 text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{getPageName(page.page)}</div>
                  <div className="text-xs text-gray-500">{page.page}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{page.views}</div>
                  <div className="text-xs text-gray-500">views</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold text-gray-900">Recent Activity</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'today'
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'week'
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'all'
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Page</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Referrer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentViews.map((view, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{getPageName(view.page)}</div>
                    <div className="text-xs text-gray-500">{view.page}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(view.timestamp)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {view.referrer || 'Direct'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
