'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductsContext';
import { colorTranslations } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import { ShoppingBag, Minus, Plus, Check, ChevronLeft, ChevronRight } from 'lucide-react';

const colorMap: Record<string, string> = {
  Red: 'bg-red-500',
  Pink: 'bg-pink-400',
  White: 'bg-white border-2 border-gray-300',
  Burgundy: 'bg-rose-900',
  Peach: 'bg-orange-300',
  Lavender: 'bg-purple-400',
  Gold: 'bg-yellow-500',
  Ivory: 'bg-amber-50 border-2 border-gray-200',
  Coral: 'bg-orange-400',
  Mixed: 'bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-400',
};

export default function ProductDetail({ slug }: { slug: string }) {
  const { locale, t } = useLanguage();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const product = products.find(p => p.slug === slug);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img src="/Placeholder.jpg" alt="" className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h1>
          <Link href="/shop" className="text-rose-500 hover:text-rose-600 font-medium">
            {t.product.backToShop}
          </Link>
        </div>
      </div>
    );
  }

  const related = products
    .filter(p => p.id !== product.id && (p.category === product.category || p.colors.some(c => product.colors.includes(c))))
    .slice(0, 4);
  const activeColor = selectedColor || product.colors[0];

  const handleAddToCart = () => {
    addToCart(product, quantity, activeColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link href="/shop" className="inline-flex items-center text-sm text-gray-500 hover:text-rose-500 mb-8 transition-colors">
          {t.product.backToShop}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Product Image Gallery */}
          {(() => {
            const allImages = product.images?.length ? product.images : (product.imageUrl ? [product.imageUrl] : ['/Placeholder.jpg']);
            const hasMultiple = allImages.length > 1;
            return (
              <div className="flex gap-4">
                {/* Thumbnails */}
                {hasMultiple && (
                  <div className="hidden sm:flex flex-col gap-2 flex-shrink-0">
                    {allImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          activeImg === i ? 'border-rose-500 ring-1 ring-rose-500' : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                {/* Main Image */}
                <div className="flex-1 relative aspect-square bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl overflow-hidden group">
                  <img src={allImages[activeImg] || '/Placeholder.jpg'} alt="Satin Rose" className="w-full h-full object-cover" />
                  {hasMultiple && (
                    <>
                      <button
                        onClick={() => setActiveImg(i => (i - 1 + allImages.length) % allImages.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        onClick={() => setActiveImg(i => (i + 1) % allImages.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                      </button>
                      {/* Mobile dots */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:hidden">
                        {allImages.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImg(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeImg ? 'bg-white w-5' : 'bg-white/50'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  {/* Counter */}
                  {hasMultiple && (
                    <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full hidden sm:block">
                      {activeImg + 1} / {allImages.length}
                    </div>
                  )}
                  {product.featured && (
                    <div className="absolute top-4 left-4 bg-rose-500 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                      {t.common.featured}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {product.name[locale]}
            </h1>

            <div className="text-3xl font-bold text-rose-500 mb-6">
              {t.common.currency}{product.price.toFixed(2)}
            </div>

            <p className="text-gray-600 leading-relaxed mb-8">
              {product.description[locale]}
            </p>

            {/* Color Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {t.product.color}: {colorTranslations[activeColor]?.[locale] || activeColor}
              </label>
              <div className="flex gap-3">
                {product.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full ${colorMap[color] || 'bg-gray-300'} transition-all ${
                      activeColor === color ? 'ring-2 ring-offset-2 ring-rose-500 scale-110' : 'hover:scale-105'
                    }`}
                    title={colorTranslations[color]?.[locale] || color}
                  />
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">{t.product.quantity}</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            {product.inStock ? (
              <button
                onClick={handleAddToCart}
                className={`flex items-center justify-center gap-3 w-full py-4 rounded-full text-lg font-semibold transition-all ${
                  added
                    ? 'bg-green-500 text-white'
                    : 'bg-rose-500 hover:bg-rose-600 text-white hover:shadow-lg hover:shadow-rose-200'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5" />
                    {t.common.added}
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    {t.product.addToCart} — {t.common.currency}{(product.price * quantity).toFixed(2)}
                  </>
                )}
              </button>
            ) : (
              <button disabled className="w-full py-4 rounded-full text-lg font-semibold bg-gray-200 text-gray-500 cursor-not-allowed">
                {t.shop.outOfStock}
              </button>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-20 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.product.relatedProducts}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {related.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
