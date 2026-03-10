'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">{t.about.title}</h1>
          <p className="text-lg text-gray-600">{t.about.subtitle}</p>
        </div>
      </div>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {t.about.story}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6 text-lg">
                {t.about.storyText1}
              </p>
              <p className="text-gray-600 leading-relaxed text-lg">
                {t.about.storyText2}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.about.mission}</h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            {t.about.missionText}
          </p>
        </div>
      </section>

      {/* Craftsmanship */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-rose-50 rounded-2xl p-8 text-center">
                  <p className="text-sm font-medium text-gray-700">{t.about.cutting}</p>
                </div>
                <div className="bg-pink-50 rounded-2xl p-8 text-center">
                  <p className="text-sm font-medium text-gray-700">{t.about.shaping}</p>
                </div>
                <div className="bg-purple-50 rounded-2xl p-8 text-center">
                  <p className="text-sm font-medium text-gray-700">{t.about.assembly}</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {t.about.craftsmanship}
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                {t.about.craftsmanshipText}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
