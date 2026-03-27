'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { useProducts } from '@/context/ProductsContext';
import ProductCard from '@/components/ProductCard';
import TrustBadges from '@/components/TrustBadges';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const { t, locale } = useLanguage();
  const { products, loading } = useProducts();
  const featured = products.filter(p => p.featured);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50">
        <div className="absolute inset-0 opacity-10">
          <img src="/Placeholder.jpg" alt="" className="absolute top-20 left-10 w-24 h-24 rounded-full object-cover animate-float" />
          <img src="/Placeholder.jpg" alt="" className="absolute top-40 right-20 w-20 h-20 rounded-full object-cover animate-float" style={{ animationDelay: '1s' }} />
          <img src="/Placeholder.jpg" alt="" className="absolute bottom-20 left-1/3 w-22 h-22 rounded-full object-cover animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="animate-fade-in">
              <span className="inline-block bg-rose-100 text-rose-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
                {t.common.handcraftedWithLove}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6 animate-fade-in">
              {t.hero.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto animate-fade-in-delay">
              {t.hero.subtitle}
            </p>
            <div className="animate-fade-in-delay-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:shadow-lg hover:shadow-rose-200 hover:-translate-y-0.5"
              >
                {t.hero.cta}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Featured Products */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.home.featuredTitle}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {t.home.featuredSubtitle}
            </p>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gradient-to-br from-rose-50 to-pink-50" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-6 bg-gray-200 rounded w-1/3 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">{t.common.noFeaturedProducts}</p>
          )}
          <div className="text-center mt-12">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 border-2 border-rose-500 text-rose-600 hover:bg-rose-500 hover:text-white px-8 py-3 rounded-full font-semibold transition-all"
            >
              {t.home.viewAll}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Our Roses Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
            {t.whyChooseRoses.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Handmade with Love */}
            <div className="bg-[#f5f1e8] rounded-2xl p-6 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow min-h-[280px]">
              <Image 
                src={`/Why Choose Our Roses/${locale === 'en' ? 'English' : locale === 'de' ? 'German' : locale === 'hr' ? 'Croatian' : locale === 'ro' ? 'Romanian' : locale === 'bg' ? 'Bulgarian' : 'Turkish'} Handmade.png`}
                alt={t.whyChooseRoses.handmadeTitle}
                width={300}
                height={300}
                className="w-full h-auto max-w-[280px]"
              />
            </div>

            {/* Everlasting Beauty */}
            <div className="bg-[#e8e8e8] rounded-2xl p-6 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow min-h-[280px]">
              <Image 
                src={`/Why Choose Our Roses/Everlasting Beauty ${locale === 'en' ? 'englihs' : locale === 'de' ? 'german' : locale === 'hr' ? 'croatian' : locale === 'ro' ? 'romanian' : locale === 'bg' ? 'bulgarian' : 'turkish'}.png`}
                alt={t.whyChooseRoses.everlastingTitle}
                width={300}
                height={300}
                className="w-full h-auto max-w-[280px]"
              />
            </div>

            {/* Premium Materials */}
            <div className="bg-[#f5f1e8] rounded-2xl p-6 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow min-h-[280px]">
              <Image 
                src={`/Why Choose Our Roses/Premium Materials ${locale === 'en' ? 'english' : locale === 'de' ? 'german' : locale === 'hr' ? 'croatian' : locale === 'ro' ? 'romanian' : locale === 'bg' ? 'bulgarian' : 'turkish'}.png`}
                alt={t.whyChooseRoses.premiumTitle}
                width={300}
                height={300}
                className="w-full h-auto max-w-[280px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <TrustBadges />

      {/* About Preview */}
      <section className="py-20 bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                {t.home.aboutTitle}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                {t.home.aboutText}
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-rose-600 font-semibold hover:text-rose-700 transition-colors"
              >
                {t.nav.about}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                <div className="w-32 h-32 rounded-2xl overflow-hidden mx-auto mb-6 bg-gray-100">
                  <Image 
                    src="/Quote Rose Icon.png" 
                    alt="Satin Rose Bouquet" 
                    width={128} 
                    height={128} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-gray-500 italic text-lg">&ldquo;Every rose tells a story of love and patience&rdquo;</p>
                <p className="text-rose-500 font-semibold mt-3">— SatinGlanz by Anamarija</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
