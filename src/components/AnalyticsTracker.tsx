'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Don't track admin pages
        if (pathname?.startsWith('/admin')) return;

        // Don't track if user is admin (check email)
        if (user?.email === 'mihoiantun715@gmail.com') return;

        // Get user's IP address
        let userIP = '';
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          userIP = ipData.ip;

          // Don't track if IP matches admin's home IP
          // You can add your home IP here
          const excludedIPs = [
            // Add your home IP address here when you know it
            // Example: '123.456.789.012'
          ];
          
          if (excludedIPs.includes(userIP)) return;
        } catch (ipError) {
          console.error('IP fetch error:', ipError);
          // Continue tracking even if IP fetch fails
        }

        await addDoc(collection(db, 'analytics'), {
          page: pathname || '/',
          timestamp: serverTimestamp(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
          referrer: typeof document !== 'undefined' ? document.referrer : '',
          ip: userIP,
        });
      } catch (error) {
        console.error('Analytics tracking error:', error);
      }
    };

    trackPageView();
  }, [pathname, user]);

  return null;
}
