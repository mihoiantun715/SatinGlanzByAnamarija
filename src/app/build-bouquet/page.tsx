'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { colorTranslations } from '@/lib/products';
import { Check, ShoppingBag, ChevronDown } from 'lucide-react';

const PRICE_PER_ROSE = 2.5;
const RIBBON_PRICE = 3;
const DECORATION_PRICE = 2;
const CARD_PRICE = 2;

const roseColors = [
  { key: 'Red', hex: '#dc2626', image: '/Roses For Bouquete/Red.png' },
  { key: 'Cherry Red', hex: '#9f1239', image: '/Roses For Bouquete/Cherry red.png' },
  { key: 'Dusty Rose', hex: '#d4a0a0', image: '/Roses For Bouquete/Dusty rose.png' },
  { key: 'Peach', hex: '#fb923c', image: '/Roses For Bouquete/Peach.png' },
  { key: 'Royal Blue', hex: '#1d4ed8', image: '/Roses For Bouquete/Royal Blue.png' },
  { key: 'Sunflower Yellow', hex: '#eab308', image: '/Roses For Bouquete/Sunflower yellow.png' },
];

const presetCounts = [1, 3, 5, 7, 10, 12, 15, 20, 24, 25, 30, 50, 100];

const wrappingOptions = [
  { key: 'blue', hex: '#93c5fd', label: 'Blue' },
  { key: 'teal', hex: '#5eead4', label: 'Teal' },
  { key: 'mint', hex: '#a7f3d0', label: 'Mint' },
  { key: 'black', hex: '#1f2937', label: 'Black' },
  { key: 'red', hex: '#dc2626', label: 'Red' },
  { key: 'cream', hex: '#fef3c7', label: 'Cream' },
  { key: 'pink', hex: '#fbcfe8', label: 'Pink' },
  { key: 'lace', hex: '#f5f5f4', label: 'Lace' },
];

const decorationOptions = [
  { key: 'heart', emoji: '💎', translationKey: 'heart' as const },
  { key: 'loveHeart', emoji: '💖', translationKey: 'loveHeart' as const },
  { key: 'mom', emoji: '👩', translationKey: 'mom' as const },
  { key: 'happyBirthday', emoji: '🎂', translationKey: 'happyBirthday' as const },
  { key: 'teddyBear', emoji: '🧸', translationKey: 'teddyBear' as const },
  { key: 'butterfly', emoji: '🦋', translationKey: 'butterfly' as const },
  { key: 'crown', emoji: '👑', translationKey: 'crown' as const },
  { key: 'noThanks', emoji: '🚫', translationKey: 'noThanks' as const },
];

const greetingCardOptions = [
  { key: 'iLoveYou', emoji: '💕', translationKey: 'iLoveYou' as const },
  { key: 'romantic', emoji: '🌹', translationKey: 'romantic' as const },
  { key: 'kiss', emoji: '💋', translationKey: 'kiss' as const },
  { key: 'floral', emoji: '🌸', translationKey: 'floral' as const },
  { key: 'elegant', emoji: '✨', translationKey: 'elegant' as const },
  { key: 'classic', emoji: '🎀', translationKey: 'classic' as const },
  { key: 'noThanks', emoji: '🚫', translationKey: 'noThanks' as const },
];

export default function BuildBouquetPage() {
  const { locale, t } = useLanguage();
  const { addToCart } = useCart();

  const [selectedColor, setSelectedColor] = useState('Red');
  const [roseCount, setRoseCount] = useState(50);
  const [ribbonOption, setRibbonOption] = useState('none');
  const [ribbonOpen, setRibbonOpen] = useState(false);
  const [wrapping, setWrapping] = useState('blue');
  const [selectedDecorations, setSelectedDecorations] = useState<string[]>(['noThanks']);
  const [selectedCard, setSelectedCard] = useState('noThanks');
  const [added, setAdded] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);
  const [customCount, setCustomCount] = useState('');

  const toggleDecoration = (key: string) => {
    if (key === 'noThanks') {
      setSelectedDecorations(['noThanks']);
      return;
    }
    setSelectedDecorations(prev => {
      const filtered = prev.filter(d => d !== 'noThanks');
      if (filtered.includes(key)) {
        const result = filtered.filter(d => d !== key);
        return result.length === 0 ? ['noThanks'] : result;
      }
      return [...filtered, key];
    });
  };

  const totalPrice = useMemo(() => {
    let price = roseCount * PRICE_PER_ROSE;
    if (ribbonOption === 'yes') price += RIBBON_PRICE;
    const decoCount = selectedDecorations.filter(d => d !== 'noThanks').length;
    price += decoCount * DECORATION_PRICE;
    if (selectedCard !== 'noThanks') price += CARD_PRICE;
    return price;
  }, [roseCount, ribbonOption, selectedDecorations, selectedCard]);

  const handleAddToCart = () => {
    const colorName = colorTranslations[selectedColor]?.[locale] || selectedColor;
    const wrapName = wrappingOptions.find(w => w.key === wrapping)?.label || wrapping;

    const customProduct = {
      id: `custom-bouquet-${Date.now()}`,
      slug: 'custom-bouquet',
      price: totalPrice,
      images: [],
      category: 'Custom Bouquet',
      colors: [selectedColor],
      inStock: true,
      featured: false,
      name: {
        en: `Custom Bouquet (${roseCount} ${selectedColor} roses)`,
        de: `Individueller Strauß (${roseCount} Rosen)`,
        hr: `Prilagođeni buket (${roseCount} ruža)`,
        ro: `Buchet personalizat (${roseCount} trandafiri)`,
        bg: `Персонализиран букет (${roseCount} рози)`,
        tr: `Özel Buket (${roseCount} gül)`,
      },
      description: {
        en: `${roseCount}x ${colorName} roses, ${wrapName} wrap${ribbonOption === 'yes' ? ', with blessing ribbon' : ''}`,
        de: `${roseCount}x ${colorName} Rosen, ${wrapName} Verpackung`,
        hr: `${roseCount}x ${colorName} ruža, ${wrapName} omot`,
        ro: `${roseCount}x ${colorName} trandafiri, ${wrapName} ambalaj`,
        bg: `${roseCount}x ${colorName} рози, ${wrapName} опаковка`,
        tr: `${roseCount}x ${colorName} gül, ${wrapName} ambalaj`,
      },
      shortDescription: {
        en: `Custom ${roseCount}-rose bouquet`,
        de: `Individueller ${roseCount}-Rosen-Strauß`,
        hr: `Prilagođeni buket od ${roseCount} ruža`,
        ro: `Buchet personalizat cu ${roseCount} trandafiri`,
        bg: `Персонализиран букет от ${roseCount} рози`,
        tr: `${roseCount} güllü özel buket`,
      },
    };

    addToCart(customProduct, 1, `${colorName}, ${wrapName}`);
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  // Generate thumbnail previews based on selected color
  const thumbColors = [selectedColor, ...roseColors.filter(c => c.key !== selectedColor).slice(0, 4).map(c => c.key)];
  const currentColorObj = roseColors.find(c => c.key === selectedColor);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="text-sm text-gray-500">
          <a href="/" className="hover:text-rose-500 underline">Home</a>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{t.bouquetBuilder.title}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

          {/* LEFT: Product Image Gallery */}
          <div className="flex gap-4">
            {/* Thumbnails */}
            <div className="hidden sm:flex flex-col gap-3">
              {thumbColors.map((color, i) => {
                const c = roseColors.find(r => r.key === color);
                return (
                  <button
                    key={i}
                    onClick={() => { setActiveThumb(i); if (i === 0) setSelectedColor(color); }}
                    className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center transition-all overflow-hidden ${
                      activeThumb === i ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: c?.hex.startsWith('linear') ? undefined : `${c?.hex}22` }}
                  >
                    <img
                      src={c?.image}
                      alt={color}
                      className="w-10 h-10 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Main Image */}
            <div className="flex-1 relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
              <div className="grid gap-1 p-8" style={{
                gridTemplateColumns: `repeat(${Math.min(Math.ceil(Math.sqrt(Math.min(roseCount, 36))), 6)}, 1fr)`,
              }}>
                {Array.from({ length: Math.min(roseCount, 36) }).map((_, i) => {
                  const colorForRose = currentColorObj;
                  return (
                    <div key={i} className="flex items-center justify-center">
                      <img
                        src={colorForRose?.image}
                        alt=""
                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  );
                })}
              </div>
              {roseCount > 36 && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                  +{roseCount - 36} more
                </div>
              )}
              {/* Wrapping indicator */}
              <div
                className="absolute bottom-0 left-0 right-0 h-16 opacity-30"
                style={{ backgroundColor: wrappingOptions.find(w => w.key === wrapping)?.hex }}
              />
            </div>
          </div>

          {/* RIGHT: Product Options */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {t.bouquetBuilder.title}
            </h1>

            <div className="text-2xl font-bold text-gray-900 mb-3">
              {t.common.currency}{totalPrice.toFixed(2)}
            </div>

            <p className="text-sm text-rose-600 font-medium mb-6">
              {t.bouquetBuilder.handmadeNote}
            </p>

            {/* Color Selection */}
            <div className="mb-8">
              <p className="text-sm font-bold text-gray-900 mb-3">
                {t.bouquetBuilder.color} <span className="font-normal text-gray-500">{colorTranslations[selectedColor]?.[locale] || selectedColor}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {roseColors.map((color) => (
                  <button
                    key={color.key}
                    onClick={() => setSelectedColor(color.key)}
                    className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all overflow-hidden ${
                      selectedColor === color.key ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'
                    }`}
                    style={{
                      background: color.hex.startsWith('linear') ? color.hex : `${color.hex}22`,
                    }}
                    title={colorTranslations[color.key]?.[locale] || color.key}
                  >
                    <img
                      src={color.image}
                      alt={color.key}
                      className="w-8 h-8 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Rose Count */}
            <div className="mb-8">
              <p className="text-sm font-bold text-gray-900 mb-1">
                {t.bouquetBuilder.roseCount} <span className="font-normal text-gray-500">{roseCount}</span>
              </p>
              <p className="text-xs text-gray-400 mb-3">{t.bouquetBuilder.roseCountNote}</p>
              <div className="flex flex-wrap gap-2">
                {presetCounts.map((count) => (
                  <button
                    key={count}
                    onClick={() => { setRoseCount(count); setCustomCount(''); }}
                    className={`min-w-[44px] px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                      roseCount === count && customCount === ''
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-sm font-medium text-gray-600">Custom:</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={customCount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomCount(val);
                    const num = parseInt(val);
                    if (num >= 1 && num <= 500) setRoseCount(num);
                  }}
                  placeholder="1-500"
                  className={`w-24 px-3 py-2.5 rounded-lg border-2 text-sm font-semibold text-center transition-all focus:outline-none focus:border-gray-900 ${
                    customCount !== '' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700'
                  }`}
                />
              </div>
            </div>

            {/* Blessing Ribbon Dropdown */}
            <div className="mb-8">
              <p className="text-sm font-bold text-gray-900 mb-3">
                {t.bouquetBuilder.blessingRibbon} <span className="text-rose-500">*</span>
              </p>
              <div className="relative">
                <button
                  onClick={() => setRibbonOpen(!ribbonOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-400 transition-colors"
                >
                  <span>
                    {ribbonOption === 'none'
                      ? t.bouquetBuilder.pleaseChoose
                      : ribbonOption === 'yes'
                      ? `🎀 ${t.bouquetBuilder.yesAdd} (+${t.common.currency}${RIBBON_PRICE})`
                      : t.bouquetBuilder.noThanks}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${ribbonOpen ? 'rotate-180' : ''}`} />
                </button>
                {ribbonOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <button
                      onClick={() => { setRibbonOption('yes'); setRibbonOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                    >
                      🎀 {t.bouquetBuilder.yesAdd} (+{t.common.currency}{RIBBON_PRICE})
                    </button>
                    <button
                      onClick={() => { setRibbonOption('no'); setRibbonOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-t border-gray-100"
                    >
                      {t.bouquetBuilder.noThanks}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Wrapping Paper */}
            <div className="mb-8">
              <p className="text-sm font-bold text-gray-900 mb-1">
                {t.bouquetBuilder.wrappingPaper} <span className="text-rose-500">*</span>{' '}
                <span className="font-normal text-gray-500">{wrappingOptions.find(w => w.key === wrapping)?.label}</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {wrappingOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setWrapping(opt.key)}
                    className={`w-14 h-14 rounded-lg border-2 transition-all ${
                      wrapping === opt.key ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: opt.hex }}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>

            {/* Extra Decoration */}
            <div className="mb-8">
              <p className="text-sm font-bold text-gray-900 mb-1">{t.bouquetBuilder.extraDecoration}</p>
              <p className="text-xs text-gray-400 mb-3">{t.bouquetBuilder.extraDecorationNote}</p>
              <div className="flex flex-wrap gap-2">
                {decorationOptions.map((deco) => (
                  <button
                    key={deco.key}
                    onClick={() => toggleDecoration(deco.key)}
                    className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 text-xs transition-all ${
                      selectedDecorations.includes(deco.key)
                        ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-xl mb-0.5">{deco.emoji}</span>
                    <span className="text-[10px] text-gray-600 leading-tight text-center truncate w-full px-0.5">
                      {t.bouquetBuilder.decorations[deco.translationKey]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Greeting Card */}
            <div className="mb-8">
              <p className="text-sm font-bold text-gray-900 mb-3">{t.bouquetBuilder.greetingCard}</p>
              <div className="flex flex-wrap gap-2">
                {greetingCardOptions.map((card) => (
                  <button
                    key={card.key}
                    onClick={() => setSelectedCard(card.key)}
                    className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 text-xs transition-all ${
                      selectedCard === card.key
                        ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-xl mb-0.5">{card.emoji}</span>
                    <span className="text-[10px] text-gray-600 leading-tight text-center truncate w-full px-0.5">
                      {t.bouquetBuilder.cards[card.translationKey]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price + Add to Cart */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-gray-900">{t.bouquetBuilder.totalPrice}</span>
                <span className="text-2xl font-bold text-gray-900">{t.common.currency}{totalPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                {roseCount} {t.bouquetBuilder.roses} × {t.common.currency}{PRICE_PER_ROSE} {t.bouquetBuilder.perRose}
              </p>
              <button
                onClick={handleAddToCart}
                className={`flex items-center justify-center gap-3 w-full py-4 rounded-lg text-base font-semibold transition-all ${
                  added
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5" />
                    {t.bouquetBuilder.added}
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    {t.bouquetBuilder.addToCart}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
