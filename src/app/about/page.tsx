'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Heart, Sparkles, Scissors } from 'lucide-react';

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
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Heart className="w-8 h-8 text-rose-500" />
                {t.about.story}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6 text-lg">
                {t.about.storyText1}
              </p>
              <p className="text-gray-600 leading-relaxed text-lg">
                {t.about.storyText2}
              </p>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-rose-100 to-pink-100 rounded-3xl p-16 text-center">
                <div className="text-[100px] mb-4">👩‍🎨</div>
                <h3 className="text-2xl font-bold text-gray-900">Anamarija Marković</h3>
                <p className="text-rose-500 font-medium mt-1">Founder & Artisan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-6" />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-rose-50 rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-3">✂️</div>
                  <p className="text-sm font-medium text-gray-700">Cutting</p>
                </div>
                <div className="bg-pink-50 rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-3">🪡</div>
                  <p className="text-sm font-medium text-gray-700">Shaping</p>
                </div>
                <div className="bg-amber-50 rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-3">🎨</div>
                  <p className="text-sm font-medium text-gray-700">Coloring</p>
                </div>
                <div className="bg-purple-50 rounded-2xl p-8 text-center">
                  <img src="/Placeholder.jpg" alt="Assembly" className="w-16 h-16 rounded-xl object-cover mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">Assembly</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Scissors className="w-8 h-8 text-rose-500" />
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
