'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useProducts } from '@/context/ProductsContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Locale } from '@/lib/types';

interface PopupConfig {
  isActive: boolean;
  holidayType: 'mothers-day' | 'fathers-day' | 'valentines' | 'christmas' | 'easter' | null;
  featuredProductIds: string[];
}

export default function HolidayPopup() {
  const { t, locale } = useLanguage();
  const { products } = useProducts();
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<PopupConfig | null>(null);

  useEffect(() => {
    const fetchPopupConfig = async () => {
      try {
        const popupDoc = await getDoc(doc(db, 'settings', 'holidayPopup'));
        if (popupDoc.exists()) {
          const data = popupDoc.data() as PopupConfig;
          setConfig(data);
          
          // Check if popup should be shown (not shown in this session)
          const hasSeenPopup = sessionStorage.getItem('holidayPopupSeen');
          if (data.isActive && !hasSeenPopup && data.holidayType) {
            setTimeout(() => setIsOpen(true), 1000); // Show after 1 second
          }
        }
      } catch (error) {
        console.error('Error fetching popup config:', error);
      }
    };

    fetchPopupConfig();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('holidayPopupSeen', 'true');
  };

  if (!isOpen || !config || !config.holidayType) return null;

  const featuredProducts = products.filter(p => config.featuredProductIds.includes(p.id));

  const getHolidayContent = () => {
    switch (config.holidayType) {
      case 'mothers-day':
        return {
          title: t.popup?.mothersDay?.title || "Mother's Day Special",
          subtitle: t.popup?.mothersDay?.subtitle || "Show your love with handcrafted satin roses",
          bgGradient: 'from-pink-100 via-rose-100 to-pink-100',
          accentColor: 'rose',
        };
      case 'fathers-day':
        return {
          title: t.popup?.fathersDay?.title || "Father's Day Collection",
          subtitle: t.popup?.fathersDay?.subtitle || "Elegant gifts for the special dad",
          bgGradient: 'from-blue-100 via-gray-100 to-blue-100',
          accentColor: 'blue',
        };
      case 'valentines':
        return {
          title: t.popup?.valentines?.title || "Valentine's Day Special",
          subtitle: t.popup?.valentines?.subtitle || "Express your love with everlasting roses",
          bgGradient: 'from-red-100 via-pink-100 to-red-100',
          accentColor: 'red',
        };
      case 'christmas':
        return {
          title: t.popup?.christmas?.title || "Christmas Collection",
          subtitle: t.popup?.christmas?.subtitle || "Perfect gifts for the holiday season",
          bgGradient: 'from-green-100 via-red-100 to-green-100',
          accentColor: 'green',
        };
      case 'easter':
        return {
          title: t.popup?.easter?.title || "Easter Special",
          subtitle: t.popup?.easter?.subtitle || "Spring into beauty with our collection",
          bgGradient: 'from-yellow-100 via-pink-100 to-purple-100',
          accentColor: 'purple',
        };
      default:
        return null;
    }
  };

  const content = getHolidayContent();
  if (!content) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Header */}
          <div className={`bg-gradient-to-r ${content.bgGradient} p-8 text-center`}>
            <h2 className="text-4xl sm:text-5xl font-serif italic text-gray-800 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              {content.title}
            </h2>
            <p className="text-lg text-gray-700">
              {content.subtitle}
            </p>
          </div>

          {/* Featured Products */}
          {featuredProducts.length > 0 && (
            <div className="p-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                {t.popup?.featuredProducts || "Featured Products"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/shop?product=${product.id}`}
                    onClick={handleClose}
                    className="group"
                  >
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <div className="aspect-square relative bg-gradient-to-br from-rose-50 to-pink-50">
                        <Image
                          src={product.images[0]}
                          alt={typeof product.name === 'string' ? product.name : product.name[locale]}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-800 mb-2 group-hover:text-rose-600 transition-colors">
                          {typeof product.name === 'string' ? product.name : product.name[locale]}
                        </h4>
                        <p className="text-lg font-bold text-rose-600">
                          €{product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Shop All Button */}
              <div className="text-center mt-8">
                <Link
                  href="/shop"
                  onClick={handleClose}
                  className="relative inline-block group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-300 to-rose-400 rounded-full blur-sm opacity-50 group-hover:opacity-70 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-rose-200 via-rose-300 to-rose-400 px-10 py-4 rounded-full shadow-xl border border-rose-400/30 group-hover:shadow-rose-300/50 transition-all">
                    <span className="text-lg font-serif text-gray-800 tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                      {t.popup?.shopAll || "Shop All"}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
