'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { colorTranslations } from '@/lib/products';
import { Check, ShoppingBag } from 'lucide-react';

const PRICE_PER_ROSE = 2.5;
const RIBBON_PRICE = 3;
const DECORATION_PRICE = 2;
const CARD_PRICE = 2;

const ribbonOptions = [
  { key: 'baby-blue', label: 'Baby Blue', image: '/Ribbons/Baby blue.png' },
  { key: 'burgundy', label: 'Burgundy', image: '/Ribbons/Burgundy.png' },
  { key: 'light-gold', label: 'Light Gold', image: '/Ribbons/Light gold.png' },
  { key: 'soft-pearl', label: 'Soft Pearl', image: '/Ribbons/Soft pearl.png' },
  { key: 'none', label: 'No Thanks', image: '' },
];

const roseColors = [
  { key: 'Red', hex: '#dc2626', image: '/Roses For Bouquete/Red.png' },
  { key: 'Cherry Red', hex: '#9f1239', image: '/Roses For Bouquete/Cherry red.png' },
  { key: 'Dusty Rose', hex: '#d4a0a0', image: '/Roses For Bouquete/Dusty rose.png' },
  { key: 'Peach', hex: '#fb923c', image: '/Roses For Bouquete/Peach.png' },
  { key: 'Royal Blue', hex: '#1d4ed8', image: '/Roses For Bouquete/Royal Blue.png' },
  { key: 'Sunflower Yellow', hex: '#eab308', image: '/Roses For Bouquete/Sunflower yellow.png' },
];

const presetCounts = [1, 3, 5, 7, 10, 12, 15, 20, 24, 25, 30, 50, 101];

const wrappingOptions = [
  { key: 'blush-pink', label: 'Blush Pink', image: '/Wrapping Paper/Blush Pink.png' },
  { key: 'dusty-pink', label: 'Dusty Pink', image: '/Wrapping Paper/Dusty Pink.png' },
  { key: 'light-beige-ivory', label: 'Light Beige Ivory', image: '/Wrapping Paper/Light beige ivory.png' },
  { key: 'black-gold-marble', label: 'Black Marble Gold', image: '/Wrapping Paper/Black marble with gold veins.png' },
  { key: 'blush-marble-gold', label: 'Blush Marble Gold', image: '/Wrapping Paper/Blush marble with gold veins.png' },
  { key: 'elegant-blush-marble', label: 'Elegant Blush Marble', image: '/Wrapping Paper/Elegant blush marble with warm gold accents.png' },
  { key: 'black-golden-edges', label: 'Black & Gold Edges', image: '/Wrapping Paper/Black and golden edges.png' },
  { key: 'white-golden-edges', label: 'White & Gold Edges', image: '/Wrapping Paper/White and golden edges.png' },
  { key: 'gold-edge-hex', label: 'Gold Edge Hex', image: '/Wrapping Paper/Gold Edge Hex.png' },
  { key: 'earthy-red-glitter', label: 'Earthy Red Glitter', image: '/Wrapping Paper/Earthy red with subtle multicolor glitter specks.png' },
  { key: 'antique-newspaper', label: 'Antique Newspaper', image: '/Wrapping Paper/Antique newspaper.png' },
];

const decorationOptions = [
  { key: 'crown', image: '/Extra Decoration/Crown.png', translationKey: 'crown' as const },
  { key: 'goldCrown', image: '/Extra Decoration/Gold Crown.png', translationKey: 'goldCrown' as const },
  { key: 'ledLight', image: '/Extra Decoration/Led Light.png', translationKey: 'ledLight' as const },
  { key: 'pearls', image: '/Extra Decoration/Pearls.png', translationKey: 'pearls' as const },
  { key: 'redButterfly', image: '/Extra Decoration/Red Butterfly.png', translationKey: 'redButterfly' as const },
  { key: 'silverButterfly', image: '/Extra Decoration/Silver Butterfly.png', translationKey: 'silverButterfly' as const },
  { key: 'noThanks', image: '', translationKey: 'noThanks' as const },
];


export default function BuildBouquetPage() {
  const { locale, t } = useLanguage();
  const { addToCart } = useCart();

  const [selectedColor, setSelectedColor] = useState('Red');
  const [roseCount, setRoseCount] = useState(50);
  const [selectedRibbon, setSelectedRibbon] = useState('none');
  const [wrapping, setWrapping] = useState('blush-pink');
  const [selectedDecorations, setSelectedDecorations] = useState<string[]>(['noThanks']);
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
    if (selectedRibbon !== 'none') price += RIBBON_PRICE;
    const decoCount = selectedDecorations.filter(d => d !== 'noThanks').length;
    price += decoCount * DECORATION_PRICE;
    return price;
  }, [roseCount, selectedRibbon, selectedDecorations]);

  const handleAddToCart = () => {
    const colorName = colorTranslations[selectedColor]?.[locale] || selectedColor;
    const wrapName = wrappingOptions.find(w => w.key === wrapping)?.label || wrapping;
    const ribbonName = ribbonOptions.find(r => r.key === selectedRibbon)?.label || '';

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
        en: `${roseCount}x ${colorName} roses, ${wrapName} wrap${ribbonName ? `, ${ribbonName} ribbon` : ''}`,
        de: `${roseCount}x ${colorName} Rosen, ${wrapName} Verpackung${ribbonName ? `, ${ribbonName} Band` : ''}`,
        hr: `${roseCount}x ${colorName} ruža, ${wrapName} omot${ribbonName ? `, ${ribbonName} vrpca` : ''}`,
        ro: `${roseCount}x ${colorName} trandafiri, ${wrapName} ambalaj${ribbonName ? `, ${ribbonName} panglică` : ''}`,
        bg: `${roseCount}x ${colorName} рози, ${wrapName} опаковка${ribbonName ? `, ${ribbonName} лента` : ''}`,
        tr: `${roseCount}x ${colorName} gül, ${wrapName} ambalaj${ribbonName ? `, ${ribbonName} kurdele` : ''}`,
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

            {/* Main Image — Bouquet on Wrapping Paper */}
            <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden" style={{ aspectRatio: '3/4', maxHeight: '420px' }}>
              {/* Wrapping paper — fills the container */}
              {(() => {
                const wrapObj = wrappingOptions.find(w => w.key === wrapping);
                return wrapObj ? (
                  <img
                    src={wrapObj.image}
                    alt={wrapObj.label}
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ zIndex: 0 }}
                  />
                ) : null;
              })()}
              {/* Roses — tight circular bouquet */}
              {(() => {
                const displayCount = Math.min(roseCount, 37);
                const positions: { x: number; y: number }[] = [];
                const cx = 50, cy = 46;
                // Concentric rings with tight spacing
                // Ring 0: 1 center, Ring 1: up to 6, Ring 2: up to 12, Ring 3: up to 18
                const rings = [
                  { count: 1, radius: 0 },
                  { count: 6, radius: 11 },
                  { count: 12, radius: 22 },
                  { count: 18, radius: 33 },
                ];
                let placed = 0;
                for (const ring of rings) {
                  if (placed >= displayCount) break;
                  const n = Math.min(ring.count, displayCount - placed);
                  for (let j = 0; j < n; j++) {
                    if (ring.radius === 0) {
                      positions.push({ x: cx, y: cy });
                    } else {
                      const startAngle = ring.count === 6 ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / ring.count;
                      const angle = startAngle + (2 * Math.PI * j) / ring.count;
                      positions.push({
                        x: cx + ring.radius * Math.cos(angle),
                        y: cy + ring.radius * Math.sin(angle),
                      });
                    }
                    placed++;
                  }
                }
                const roseSize = displayCount <= 1 ? 60 : displayCount <= 7 ? 44 : displayCount <= 19 ? 34 : 26;
                return (
                  <div className="absolute inset-0" style={{ zIndex: 2 }}>
                    {positions.map((pos, i) => (
                      <img
                        key={i}
                        src={currentColorObj?.image}
                        alt=""
                        className="absolute object-contain drop-shadow-md"
                        style={{
                          width: `${roseSize}%`,
                          height: `${roseSize}%`,
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ))}
                  </div>
                );
              })()}
              {/* Selected decorations overlay */}
              {(() => {
                const activeDecos = selectedDecorations.filter(d => d !== 'noThanks');
                if (activeDecos.length === 0) return null;
                const decoPositions = [
                  { x: 50, y: 8 },
                  { x: 82, y: 20 },
                  { x: 18, y: 20 },
                  { x: 85, y: 50 },
                  { x: 15, y: 50 },
                  { x: 50, y: 88 },
                ];
                return (
                  <div className="absolute inset-0" style={{ zIndex: 3 }}>
                    {activeDecos.map((decoKey, i) => {
                      const decoObj = decorationOptions.find(d => d.key === decoKey);
                      if (!decoObj?.image) return null;
                      const pos = decoPositions[i % decoPositions.length];
                      return (
                        <img
                          key={decoKey}
                          src={decoObj.image}
                          alt={decoKey}
                          className="absolute object-contain drop-shadow-lg"
                          style={{
                            width: '50%',
                            height: '50%',
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })()}
              {/* Selected ribbon overlay */}
              {(() => {
                if (selectedRibbon === 'none') return null;
                const ribObj = ribbonOptions.find(r => r.key === selectedRibbon);
                if (!ribObj?.image) return null;
                return (
                  <img
                    src={ribObj.image}
                    alt={ribObj.label}
                    className="absolute object-contain drop-shadow-lg"
                    style={{
                      width: '44%',
                      height: '44%',
                      left: '50%',
                      bottom: '8%',
                      transform: 'translateX(-50%)',
                      zIndex: 4,
                    }}
                  />
                );
              })()}
              {roseCount > 37 && (
                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full z-10">
                  +{roseCount - 37} more
                </div>
              )}
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

            {/* Ribbon Selection */}
            <div className="mb-8">
              <p className="text-sm font-bold text-gray-900 mb-1">
                {t.bouquetBuilder.ribbon} <span className="font-normal text-gray-500">{ribbonOptions.find(r => r.key === selectedRibbon)?.label}</span>
              </p>
              <p className="text-xs text-gray-400 mb-3">(+{t.common.currency}{RIBBON_PRICE})</p>
              <div className="grid grid-cols-5 gap-2">
                {ribbonOptions.map((rib) => (
                  <button
                    key={rib.key}
                    onClick={() => setSelectedRibbon(rib.key)}
                    className={`flex flex-col items-center justify-center rounded-lg border-2 text-xs transition-all aspect-square overflow-hidden ${
                      selectedRibbon === rib.key ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'
                    }`}
                    title={rib.label}
                  >
                    {rib.image ? (
                      <img src={rib.image} alt={rib.label} className="w-12 h-12 object-contain mb-0.5" />
                    ) : (
                      <span className="text-xl mb-0.5">🚫</span>
                    )}
                    <span className="text-[10px] text-gray-600 leading-tight text-center truncate w-full px-0.5">
                      {rib.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wrapping Paper */}
            <div className="mb-8">
              <p className="text-sm font-bold text-gray-900 mb-1">
                {t.bouquetBuilder.wrappingPaper} <span className="text-rose-500">*</span>{' '}
                <span className="font-normal text-gray-500">{wrappingOptions.find(w => w.key === wrapping)?.label}</span>
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
                {wrappingOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setWrapping(opt.key)}
                    className={`relative rounded-lg border-2 overflow-hidden transition-all aspect-[3/4] ${
                      wrapping === opt.key ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'
                    }`}
                    title={opt.label}
                  >
                    <img
                      src={opt.image}
                      alt={opt.label}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Extra Decoration */}
            <div className="mb-8">
              <p className="text-sm font-bold text-gray-900 mb-1">{t.bouquetBuilder.extraDecoration}</p>
              <p className="text-xs text-gray-400 mb-3">{t.bouquetBuilder.extraDecorationNote}</p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {decorationOptions.map((deco) => (
                  <button
                    key={deco.key}
                    onClick={() => toggleDecoration(deco.key)}
                    className={`flex flex-col items-center justify-center rounded-lg border-2 text-xs transition-all aspect-square overflow-hidden ${
                      selectedDecorations.includes(deco.key)
                        ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {deco.image ? (
                      <img src={deco.image} alt={t.bouquetBuilder.decorations[deco.translationKey]} className="w-10 h-10 object-contain mb-0.5" />
                    ) : (
                      <span className="text-xl mb-0.5">🚫</span>
                    )}
                    <span className="text-[10px] text-gray-600 leading-tight text-center truncate w-full px-0.5">
                      {t.bouquetBuilder.decorations[deco.translationKey]}
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
