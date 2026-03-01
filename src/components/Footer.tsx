'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Flower2, Instagram, Facebook, Mail } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Flower2 className="w-7 h-7 text-rose-400" />
              <div>
                <span className="text-lg font-bold text-white">SatinGlanz</span>
                <span className="block text-xs text-rose-400 font-medium tracking-wider -mt-0.5">by Anamarija</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              {t.footer.description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.quickLinks}</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-sm hover:text-rose-400 transition-colors">{t.nav.home}</Link></li>
              <li><Link href="/shop" className="text-sm hover:text-rose-400 transition-colors">{t.nav.shop}</Link></li>
              <li><Link href="/about" className="text-sm hover:text-rose-400 transition-colors">{t.nav.about}</Link></li>
              <li><Link href="/contact" className="text-sm hover:text-rose-400 transition-colors">{t.nav.contact}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.contactUs}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-400" />
                <a href="mailto:info@satinroses.com" className="hover:text-rose-400 transition-colors">info@satinroses.com</a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.followUs}</h3>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-rose-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-rose-500 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} SatinGlanz by Anamarija. {t.footer.rights}
          </p>
          <p className="text-sm text-gray-500">
            {t.footer.madeWith}
          </p>
        </div>
      </div>
    </footer>
  );
}
