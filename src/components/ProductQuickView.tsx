'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { Product } from '@/lib/types';
import { colorTranslations } from '@/lib/products';
import { X, ChevronLeft, ChevronRight, ShoppingBag, Minus, Plus, ExternalLink } from 'lucide-react';

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

interface Props {
  product: Product;
  onClose: () => void;
}

export default function ProductQuickView({ product, onClose }: Props) {
  const { locale, t } = useLanguage();
  const { addToCart } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] || '');
  const [added, setAdded] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const allImages = product.images?.length ? product.images : (product.imageUrl ? [product.imageUrl] : ['/Placeholder.jpg']);
  const hasMultiple = allImages.length > 1;

  const name = product.name?.[locale] || product.name?.en || '';
  const description = product.description?.[locale] || product.description?.en || '';

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleAdd = () => {
    addToCart(product, quantity, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex flex-col md:flex-row overflow-y-auto">
          {/* Image Section */}
          <div className="md:w-1/2 flex-shrink-0">
            <div className="relative aspect-square bg-gradient-to-br from-rose-50 to-pink-50 group">
              <img
                src={allImages[activeImg]}
                alt={name}
                className="w-full h-full object-contain"
              />
              {hasMultiple && (
                <>
                  <button
                    onClick={() => setActiveImg(i => (i - 1 + allImages.length) % allImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setActiveImg(i => (i + 1) % allImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}
              {/* Counter */}
              {hasMultiple && (
                <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                  {activeImg + 1} / {allImages.length}
                </div>
              )}
              {product.featured && (
                <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  ★ Featured
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {hasMultiple && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                      activeImg === i ? 'border-rose-500 ring-1 ring-rose-500' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="md:w-1/2 p-6 sm:p-8 flex flex-col">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{name}</h2>

            <div className="text-2xl font-bold text-rose-500 mb-4">
              {t.common.currency}{product.price.toFixed(2)}
            </div>

            {/* Colors */}
            {product.colors.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">{t.product.color}</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all text-sm ${
                        selectedColor === color
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${colorMap[color] || 'bg-gray-300'}`} />
                      <span className="text-gray-700">
                        {colorTranslations[color]?.[locale] || color}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {description && (
              <div className="mb-6 flex-1 overflow-y-auto">
                <p className="text-sm font-medium text-gray-700 mb-1.5">{t.product.description}</p>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{description}</p>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            {product.inStock ? (
              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100">
                <div className="flex items-center border-2 border-gray-200 rounded-full">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleAdd}
                  disabled={added}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm transition-all ${
                    added
                      ? 'bg-green-500 text-white'
                      : 'bg-rose-500 hover:bg-rose-600 text-white'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {added ? '✓ Added!' : t.shop.addToCart}
                </button>
              </div>
            ) : (
              <div className="mt-auto pt-4 border-t border-gray-100">
                <span className="block text-center bg-gray-100 text-gray-500 font-semibold py-3 rounded-full text-sm">
                  {t.shop.outOfStock}
                </span>
              </div>
            )}

            {/* View Full Page link */}
            <Link
              href={`/shop/${product.slug}`}
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 mt-3 text-sm text-gray-400 hover:text-rose-500 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View full product page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
