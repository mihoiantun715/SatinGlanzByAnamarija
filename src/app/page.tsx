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
              <span className="inline-block text-rose-600 text-sm font-medium tracking-wide mb-6">
                {t.home.madeInGermany}
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif italic text-gray-800 leading-tight mb-6 animate-fade-in" style={{ fontFamily: 'Georgia, serif' }}>
              {t.hero.newTitle}
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 font-medium leading-relaxed mb-4 max-w-2xl mx-auto animate-fade-in-delay">
              {t.hero.newDescription}
            </p>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto animate-fade-in-delay">
              {t.hero.newSubtitle}
            </p>
            <div className="animate-fade-in-delay-2">
              <Link
                href="/build-bouquet"
                className="relative inline-block group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-300 to-rose-400 rounded-full blur-sm opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-rose-200 via-rose-300 to-rose-400 px-12 py-5 rounded-full shadow-2xl border border-rose-400/30 group-hover:shadow-rose-300/50 transition-all">
                  <span className="text-2xl font-serif text-gray-800 tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                    {t.hero.newCta}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Ready to Ship Banner */}
      <section className="py-12 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-serif italic text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              {t.home.readyToShipTitle}
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-6 max-w-3xl mx-auto">
              {t.home.readyToShipSubtitle}
            </p>
            <Link
              href="/shop"
              className="inline-block bg-white text-rose-600 px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              {t.home.shopNow} →
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-5xl sm:text-6xl font-serif italic text-gray-800 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              {t.home.featuredTitle}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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
              className="relative inline-block group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-300 to-rose-400 rounded-full blur-sm opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-rose-200 via-rose-300 to-rose-400 px-10 py-4 rounded-full shadow-xl border border-rose-400/30">
                <span className="text-base font-medium text-gray-800 tracking-wide">
                  {t.home.viewAll}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Our Roses Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-serif italic text-center text-gray-800 mb-12" style={{ fontFamily: 'Georgia, serif' }}>
            {t.whyChooseRoses.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
          </div>
        </div>
      </section>

      {/* Perfect For Every Occasion */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl sm:text-5xl font-serif italic text-gray-800 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              {t.home.occasionsTitle}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.home.occasionsSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Romantic Gift */}
            <div className="rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/40" style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}>
              <div className="mb-4 flex justify-center">
                <img src="/images/occasions/Express your love.png" alt="Romantic Gift" className="w-20 h-20 object-contain" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">{t.occasions.romantic}</h3>
              <p className="text-gray-600 text-center text-sm">{t.occasions.romanticDesc}</p>
            </div>
            {/* Birthday Surprise */}
            <div className="rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/40" style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}>
              <div className="mb-4 flex justify-center">
                <img src="/images/occasions/Birthday Suprise.png" alt="Birthday Surprise" className="w-20 h-20 object-contain" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">{t.occasions.birthday}</h3>
              <p className="text-gray-600 text-center text-sm">{t.occasions.birthdayDesc}</p>
            </div>
            {/* Wedding Decoration */}
            <div className="rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/40" style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}>
              <div className="mb-4 flex justify-center">
                <img src="/images/occasions/Wedding Decoration.png" alt="Wedding Decoration" className="w-20 h-20 object-contain" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">{t.occasions.wedding}</h3>
              <p className="text-gray-600 text-center text-sm">{t.occasions.weddingDesc}</p>
            </div>
            {/* Home Decor */}
            <div className="rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/40" style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}>
              <div className="mb-4 flex justify-center">
                <img src="/images/occasions/Home Decor.png" alt="Home Decor" className="w-20 h-20 object-contain" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">{t.occasions.homeDecor}</h3>
              <p className="text-gray-600 text-center text-sm">{t.occasions.homeDecorDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <TrustBadges variant="default" />

      {/* About Preview */}
      <section className="py-20 bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-serif italic text-gray-800 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
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
              <div className="bg-white rounded-3xl shadow-xl p-8 flex items-center justify-center">
                <Image 
                  src="/Quote Rose Icon.png" 
                  alt="Every rose tells a story of love and patience - SatinGlanz by Anamarija" 
                  width={400} 
                  height={400} 
                  className="w-full h-auto max-w-[400px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
