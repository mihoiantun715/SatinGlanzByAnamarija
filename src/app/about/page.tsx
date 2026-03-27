'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

export default function AboutPage() {
  const { t, locale } = useLanguage();

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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-lg p-8 flex items-center justify-center">
            <Image 
              src={`/Craftsmanship/Craftsmanship ${locale === 'en' ? 'english' : locale === 'de' ? 'german' : locale === 'hr' ? 'croatian' : locale === 'ro' ? 'romanian' : locale === 'bg' ? 'bulgarian' : 'turkish'}.png`}
              alt={t.about.craftsmanship}
              width={800}
              height={400}
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
