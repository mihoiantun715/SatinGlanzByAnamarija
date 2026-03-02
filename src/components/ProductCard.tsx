'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { Product } from '@/lib/types';
import { ShoppingBag, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import ProductQuickView from './ProductQuickView';

interface ProductCardProps {
  product: Product;
}

const colorMap: Record<string, string> = {
  Red: 'bg-red-500',
  Pink: 'bg-pink-400',
  White: 'bg-white border border-gray-300',
  Burgundy: 'bg-rose-900',
  Peach: 'bg-orange-300',
  Lavender: 'bg-purple-400',
  Gold: 'bg-yellow-500',
  Ivory: 'bg-amber-50 border border-gray-200',
  Coral: 'bg-orange-400',
  Mixed: 'bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-400',
};

export default function ProductCard({ product }: ProductCardProps) {
  const { locale, t } = useLanguage();
  const { addToCart } = useCart();
  const [currentImg, setCurrentImg] = useState(0);
  const [showQuickView, setShowQuickView] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const allImages = product.images?.length ? product.images : (product.imageUrl ? [product.imageUrl] : ['/Placeholder.jpg']);
  const hasMultiple = allImages.length > 1;

  const prev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImg(i => (i - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  const next = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImg(i => (i + 1) % allImages.length);
  }, [allImages.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setCurrentImg(i => (i + 1) % allImages.length);
      else setCurrentImg(i => (i - 1 + allImages.length) % allImages.length);
    }
    touchStartX.current = null;
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl cursor-pointer"
        onClick={() => setShowQuickView(true)}
      >
        <div
          className="relative aspect-square bg-gradient-to-br from-rose-50 to-pink-50 overflow-hidden"
          onTouchStart={hasMultiple ? handleTouchStart : undefined}
          onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.img 
              src={allImages[currentImg]} 
              alt="Satin Rose" 
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {/* Arrows */}
          {hasMultiple && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            </>
          )}
          {/* Dots */}
          {hasMultiple && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentImg(i); }}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentImg ? 'bg-white w-4' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
          {product.featured && (
            <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
              ★ Featured
            </div>
          )}
          <div className="absolute top-3 right-3 bg-rose-600 text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1 z-10 shadow-md">
            <AlertCircle className="w-3 h-3" />
            Handmade
          </div>
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
              <span className="bg-white text-gray-900 font-semibold px-4 py-2 rounded-full text-sm">
                {t.shop.outOfStock}
              </span>
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-rose-600 transition-colors line-clamp-1">
            {product.name[locale]}
          </h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {product.shortDescription?.[locale] || product.shortDescription?.en || product.description?.[locale] || product.description?.en || ''}
          </p>

          <div className="flex items-center gap-1.5 mb-4">
            {product.colors.map((color) => (
              <span
                key={color}
                className={`w-4 h-4 rounded-full ${colorMap[color] || 'bg-gray-300'}`}
                title={color}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">
              {t.common.currency}{product.price.toFixed(2)}
            </span>
            {product.inStock && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product, 1, product.colors[0]);
                }}
                className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">{t.shop.addToCart}</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {showQuickView && (
        <ProductQuickView product={product} onClose={() => setShowQuickView(false)} />
      )}
    </>
  );
}
