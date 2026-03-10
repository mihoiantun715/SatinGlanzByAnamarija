'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Mail, Instagram } from 'lucide-react';

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">{t.contact.title}</h1>
          <p className="text-lg text-gray-600">{t.contact.subtitle}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t.contact.info}</h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{t.contact.email}</h3>
                <a href="mailto:satinglanzbyanamarija@gmail.com" className="text-gray-600 hover:text-rose-500 transition-colors">
                  satinglanzbyanamarija@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{t.contact.followUs}</h3>
            <div className="flex gap-3 justify-center">
              <a href="https://www.instagram.com/satinglanzbyanamarija?igsh=NG03Ymw1MDBueGl5" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="https://www.tiktok.com/@satinglanzbyanamarija" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.72a8.24 8.24 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.13z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
