'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { colorTranslations } from '@/lib/products';
import { Check } from 'lucide-react';

// Volume-based pricing tiers
const getPricePerRose = (count: number): number => {
  if (count <= 5) return 2.50;
  if (count <= 10) return 2.30;
  if (count <= 20) return 2.10;
  if (count <= 30) return 1.95;
  return 1.80; // 31-50+
};

const RIBBON_PRICE = 3;
const DECORATION_PRICE = 2;
const CARD_PRICE = 2;
const CUSTOM_TEXT_PRICE_PER_LETTER = 0.10;

const ribbonOptions = [
  { key: 'baby-blue', translationKey: 'babyBlue' as const, image: '/Ribbons/Baby blue.png' },
  { key: 'burgundy', translationKey: 'burgundy' as const, image: '/Ribbons/Burgundy.png' },
  { key: 'light-gold', translationKey: 'lightGold' as const, image: '/Ribbons/Light gold.png' },
  { key: 'soft-pearl', translationKey: 'softPearl' as const, image: '/Ribbons/Soft pearl.png' },
  { key: 'none', translationKey: 'noThanks' as const, image: '' },
];

const roseColors = [
  { key: 'Red', hex: '#dc2626', image: '/Roses For Bouquete/Red.png' },
  { key: 'Cherry Red', hex: '#9f1239', image: '/Roses For Bouquete/Cherry red.png' },
  { key: 'Burgundy', hex: '#7c2d3e', image: '/Roses For Bouquete/Burgundy.png' },
  { key: 'Dusty Rose', hex: '#d4a0a0', image: '/Roses For Bouquete/Dusty rose.png' },
  { key: 'Peach', hex: '#fb923c', image: '/Roses For Bouquete/Peach.png' },
  { key: 'White', hex: '#f8f8f8', image: '/Roses For Bouquete/White.png' },
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

  const [colorMix, setColorMix] = useState<Record<string, number>>({});
  const [roseCount, setRoseCount] = useState(0);
  const [selectedRibbon, setSelectedRibbon] = useState('none');
  const [wrapping, setWrapping] = useState('blush-pink');
  const [selectedDecorations, setSelectedDecorations] = useState<string[]>(['noThanks']);
  const [added, setAdded] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);
  const [customCount, setCustomCount] = useState('');
  const [customText, setCustomText] = useState('');
  const [animateRose, setAnimateRose] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

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

  const pricePerRose = useMemo(() => getPricePerRose(roseCount), [roseCount]);

  const totalPrice = useMemo(() => {
    let price = roseCount * pricePerRose;
    if (selectedRibbon !== 'none') price += RIBBON_PRICE;
    if (customText.length > 0) price += customText.length * CUSTOM_TEXT_PRICE_PER_LETTER;
    const decoCount = selectedDecorations.filter(d => d !== 'noThanks').length;
    price += decoCount * DECORATION_PRICE;
    return price;
  }, [roseCount, pricePerRose, selectedRibbon, selectedDecorations, customText]);

  // Calculate incentive message for next discount tier
  const incentiveMessage = useMemo(() => {
    if (roseCount === 0) return null;
    if (roseCount < 6) {
      const needed = 6 - roseCount;
      const savings = (roseCount * 2.50 - roseCount * 2.30).toFixed(2);
      return { needed, nextTier: 6, savings: parseFloat(savings), newPrice: 2.30 };
    }
    if (roseCount < 11) {
      const needed = 11 - roseCount;
      const savings = (roseCount * 2.30 - roseCount * 2.10).toFixed(2);
      return { needed, nextTier: 11, savings: parseFloat(savings), newPrice: 2.10 };
    }
    if (roseCount < 21) {
      const needed = 21 - roseCount;
      const savings = (roseCount * 2.10 - roseCount * 1.95).toFixed(2);
      return { needed, nextTier: 21, savings: parseFloat(savings), newPrice: 1.95 };
    }
    if (roseCount < 31) {
      const needed = 31 - roseCount;
      const savings = (roseCount * 1.95 - roseCount * 1.80).toFixed(2);
      return { needed, nextTier: 31, savings: parseFloat(savings), newPrice: 1.80 };
    }
    return null; // Max tier reached
  }, [roseCount]);

  const handleAddToCart = () => {
    const wrapName = wrappingOptions.find(w => w.key === wrapping)?.label || wrapping;
    const ribbonObj = ribbonOptions.find(r => r.key === selectedRibbon);
    const ribbonName = ribbonObj ? t.bouquetBuilder.ribbonColors[ribbonObj.translationKey] : '';
    
    // Build color description
    const colorParts = Object.entries(colorMix)
      .filter(([_, count]) => count > 0)
      .map(([color, count]) => `${count}x ${colorTranslations[color]?.[locale] || color}`);
    const colorDesc = colorParts.join(', ');
    const colorList = Object.keys(colorMix).filter(k => colorMix[k] > 0);

    // Build detailed rose colors array
    const roseColorsArray = Object.entries(colorMix)
      .filter(([_, count]) => count > 0)
      .map(([color, count]) => ({ color, quantity: count }));

    // Build decorations array
    const decorationsArray = [];
    if (selectedDecorations.length > 0 && !selectedDecorations.includes('noThanks')) {
      decorationsArray.push(...selectedDecorations);
    }

    const customProduct = {
      id: `custom-bouquet-${Date.now()}`,
      slug: 'custom-bouquet',
      price: totalPrice,
      images: [],
      category: 'Custom Bouquet',
      colors: colorList,
      inStock: true,
      featured: false,
      name: {
        en: `Custom Bouquet (${roseCount} roses)`,
        de: `Individueller Strauß (${roseCount} Rosen)`,
        hr: `Prilagođeni buket (${roseCount} ruža)`,
        ro: `Buchet personalizat (${roseCount} trandafiri)`,
        bg: `Персонализиран букет (${roseCount} рози)`,
        tr: `Özel Buket (${roseCount} gül)`,
      },
      description: {
        en: `${colorDesc}, ${wrapName} wrap${ribbonName ? `, ${ribbonName} ribbon` : ''}${customText ? `, Custom text: "${customText}"` : ''}`,
        de: `${colorDesc}, ${wrapName} Verpackung${ribbonName ? `, ${ribbonName} Band` : ''}${customText ? `, Individueller Text: "${customText}"` : ''}`,
        hr: `${colorDesc}, ${wrapName} omot${ribbonName ? `, ${ribbonName} vrpca` : ''}${customText ? `, Prilagođeni tekst: "${customText}"` : ''}`,
        ro: `${colorDesc}, ${wrapName} ambalaj${ribbonName ? `, ${ribbonName} panglică` : ''}${customText ? `, Text personalizat: "${customText}"` : ''}`,
        bg: `${colorDesc}, ${wrapName} опаковка${ribbonName ? `, ${ribbonName} лента` : ''}${customText ? `, Персонализиран текст: "${customText}"` : ''}`,
        tr: `${colorDesc}, ${wrapName} ambalaj${ribbonName ? `, ${ribbonName} kurdele` : ''}${customText ? `, Özel metin: "${customText}"` : ''}`,
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

    // Add to cart with detailed information
    addToCart(customProduct, 1, `${colorDesc}, ${wrapName}`, {
      roseColors: roseColorsArray,
      wrappingPaper: wrapName,
      ribbon: selectedRibbon !== 'none' ? ribbonName : undefined,
      decorations: decorationsArray.length > 0 ? decorationsArray : undefined,
      customText: customText.length > 0 ? customText : undefined,
    });
    
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  // Generate thumbnail previews based on selected colors
  const selectedColors = Object.keys(colorMix).filter(k => colorMix[k] > 0);
  const primaryColor = selectedColors[0] || 'Red';
  const thumbColors = [primaryColor, ...roseColors.filter(c => !selectedColors.includes(c.key)).slice(0, 4).map(c => c.key)];
  const currentColorObj = roseColors.find(c => c.key === thumbColors[activeThumb]) || roseColors[0];

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
                    onClick={() => setActiveThumb(i)}
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
              {/* Roses — tight circular bouquet with mixed colors */}
              {(() => {
                const displayCount = Math.min(roseCount, 37);
                const positions: { x: number; y: number }[] = [];
                const cx = 50, cy = 46;
                // Concentric rings with tight spacing
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
                
                // Build array of rose colors based on colorMix
                const roseColorArray: string[] = [];
                Object.entries(colorMix).forEach(([color, count]) => {
                  for (let i = 0; i < count; i++) {
                    roseColorArray.push(color);
                  }
                });
                
                // Shuffle for natural mix (Fisher-Yates)
                for (let i = roseColorArray.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [roseColorArray[i], roseColorArray[j]] = [roseColorArray[j], roseColorArray[i]];
                }
                
                const roseSize = displayCount <= 1 ? 60 : displayCount <= 7 ? 44 : displayCount <= 19 ? 34 : 26;
                return (
                  <div className="absolute inset-0" style={{ zIndex: 2 }}>
                    {positions.map((pos, i) => {
                      const colorKey = roseColorArray[i % roseColorArray.length] || 'Red';
                      const colorObj = roseColors.find(c => c.key === colorKey);
                      return (
                        <img
                          key={i}
                          src={colorObj?.image}
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
                      );
                    })}
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
                    alt={t.bouquetBuilder.ribbonColors[ribObj.translationKey]}
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

          {/* RIGHT: Configuration */}
          <div>
            <h1 className="text-4xl font-serif italic text-gray-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              {t.bouquetBuilder.title}
            </h1>
            <p className="text-gray-600 mb-3">{t.bouquetBuilder.subtitle}</p>
            
            {/* Craftsmanship Message */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200">
              <p className="text-sm text-gray-700 text-center italic">
                ✨ {t.bouquetBuilder.craftsmanshipMessage}
              </p>
            </div>

            {/* Bouquet Size Guide - Moved to Top */}
            <div className="mb-8 p-5 rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50/50 to-pink-50/50">
              <p className="text-base font-semibold text-gray-800 mb-4 text-center">{t.bouquetBuilder.sizeGuide}</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Mini 6 */}
                <button
                  onClick={() => {
                    const newMix: Record<string, number> = {};
                    const colors = roseColors.slice(0, 2);
                    colors.forEach((color, i) => {
                      newMix[color.key] = i === 0 ? 4 : 2;
                    });
                    setColorMix(newMix);
                    setRoseCount(6);
                    setSelectedPreset(6);
                    setAnimateRose(true);
                    setTimeout(() => setAnimateRose(false), 200);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all hover:shadow-md text-left ${
                    selectedPreset === 6 ? 'border-rose-500 bg-rose-100 shadow-md ring-2 ring-rose-300' : 'border-gray-200 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🌹</span>
                    <span className="font-bold text-gray-900">6</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800">{t.bouquetBuilder.miniSize}</p>
                  <p className="text-xs text-gray-500 italic">{t.bouquetBuilder.miniMessage}</p>
                </button>

                {/* Classic 12 - Most Popular */}
                <button
                  onClick={() => {
                    const newMix: Record<string, number> = {};
                    const colors = roseColors.slice(0, 3);
                    colors.forEach((color, i) => {
                      newMix[color.key] = 4;
                    });
                    setColorMix(newMix);
                    setRoseCount(12);
                    setSelectedPreset(12);
                    setAnimateRose(true);
                    setTimeout(() => setAnimateRose(false), 200);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all hover:shadow-md text-left relative ${
                    selectedPreset === 12 ? 'border-rose-500 bg-rose-100 shadow-md ring-2 ring-rose-300' : 'border-rose-300 bg-rose-50/50 hover:border-rose-400'
                  }`}
                >
                  <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    ⭐ {t.bouquetBuilder.mostPopular}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🌹</span>
                    <span className="font-bold text-gray-900">12</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800">{t.bouquetBuilder.classicSize}</p>
                  <p className="text-xs text-gray-500 italic">{t.bouquetBuilder.classicMessage}</p>
                </button>

                {/* Luxury 24 */}
                <button
                  onClick={() => {
                    const newMix: Record<string, number> = {};
                    const colors = roseColors.slice(0, 4);
                    colors.forEach((color) => {
                      newMix[color.key] = 6;
                    });
                    setColorMix(newMix);
                    setRoseCount(24);
                    setSelectedPreset(24);
                    setAnimateRose(true);
                    setTimeout(() => setAnimateRose(false), 200);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all hover:shadow-md text-left ${
                    selectedPreset === 24 ? 'border-rose-500 bg-rose-100 shadow-md ring-2 ring-rose-300' : 'border-gray-200 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🌹</span>
                    <span className="font-bold text-gray-900">24</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800">{t.bouquetBuilder.luxurySize}</p>
                  <p className="text-xs text-gray-500 italic">{t.bouquetBuilder.luxuryMessage}</p>
                </button>

                {/* Grand 50 */}
                <button
                  onClick={() => {
                    const newMix: Record<string, number> = {};
                    const colors = roseColors.slice(0, 5);
                    colors.forEach((color) => {
                      newMix[color.key] = 10;
                    });
                    setColorMix(newMix);
                    setRoseCount(50);
                    setSelectedPreset(50);
                    setAnimateRose(true);
                    setTimeout(() => setAnimateRose(false), 200);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all hover:shadow-md text-left ${
                    selectedPreset === 50 ? 'border-rose-500 bg-rose-100 shadow-md ring-2 ring-rose-300' : 'border-gray-200 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🌹</span>
                    <span className="font-bold text-gray-900">50</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800">{t.bouquetBuilder.grandSize}</p>
                  <p className="text-xs text-gray-500 italic">{t.bouquetBuilder.grandMessage}</p>
                </button>
              </div>
              
              {/* Rose Count Display Inside Size Guide */}
              <div className="text-center mt-6 pt-6 border-t border-rose-200">
                <p className="text-sm text-gray-600 mb-2">{t.bouquetBuilder.totalRoses}</p>
                <p 
                  className={`text-5xl font-bold text-rose-600 transition-all duration-200 ${
                    animateRose ? 'scale-110 opacity-80' : 'scale-100 opacity-100'
                  }`}
                >
                  {roseCount}
                </p>
              </div>
            </div>

            {/* All Options Container with Glass Effect */}
            <div className="relative mb-8">
              <div className="relative rounded-2xl p-6 border border-white/40 shadow-lg" style={{ 
                background: 'rgba(255, 245, 247, 0.75)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}>
                
                {/* Color Mix Selection */}
                <div className="mb-6">
                  <p className="text-base font-semibold text-gray-800 mb-3">
                    {t.bouquetBuilder.color} <span className="font-normal text-gray-600">Mix colors</span>
                  </p>
                  <div className="space-y-3">
                {roseColors.map((color) => {
                  const count = colorMix[color.key] || 0;
                  return (
                    <div key={color.key} className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{
                          background: color.hex.startsWith('linear') ? color.hex : `${color.hex}22`,
                        }}
                      >
                        <img
                          src={color.image}
                          alt={color.key}
                          className="w-7 h-7 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{colorTranslations[color.key]?.[locale] || color.key}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newMix = { ...colorMix };
                            if (count > 0) {
                              newMix[color.key] = count - 1;
                              if (newMix[color.key] === 0) delete newMix[color.key];
                              const total = Object.values(newMix).reduce((a, b) => a + b, 0);
                              if (total <= 101) {
                                setColorMix(newMix);
                                setRoseCount(total);
                              }
                            }
                          }}
                          className="w-8 h-8 rounded-lg border-2 border-gray-200 hover:border-gray-400 flex items-center justify-center text-gray-600 font-bold transition-all hover:scale-110 active:scale-95"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          max="101"
                          value={count}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            const newMix = { ...colorMix };
                            if (val === 0) {
                              delete newMix[color.key];
                            } else {
                              newMix[color.key] = val;
                            }
                            const total = Object.values(newMix).reduce((a, b) => a + b, 0);
                            if (total <= 101) {
                              setColorMix(newMix);
                              setRoseCount(total);
                            }
                          }}
                          className="w-16 text-center font-semibold text-gray-900 border-2 border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-gray-900"
                        />
                        <button
                          onClick={() => {
                            const newMix = { ...colorMix, [color.key]: count + 1 };
                            const total = Object.values(newMix).reduce((a, b) => a + b, 0);
                            if (total <= 101) {
                              setColorMix(newMix);
                              setRoseCount(total);
                              setAnimateRose(true);
                              setTimeout(() => setAnimateRose(false), 200);
                            }
                          }}
                          className="w-8 h-8 rounded-lg border-2 border-gray-200 hover:border-gray-400 flex items-center justify-center text-gray-600 font-bold transition-all hover:scale-110 active:scale-95"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>

              {/* Total Rose Count Display & Special Request */}
              <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-900">
                  {t.bouquetBuilder.roseCount}
                </p>
                <span className="text-lg font-bold text-gray-900">{roseCount} / 101</span>
              </div>
              
              {roseCount > 101 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700">
                    ⚠️ Maximum 101 roses allowed. Please reduce your selection.
                  </p>
                </div>
              )}
              
              {/* Volume Discount Message with Glass Effect */}
              {roseCount >= 3 && roseCount < 101 && (
                <div className="mt-4 p-4 rounded-xl border border-white/40 shadow-md" style={{
                  background: 'rgba(240, 253, 244, 0.75)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}>
                  <p className="text-sm text-green-800 font-medium">
                    💰 {t.bouquetBuilder.volumeDiscount}
                  </p>
                </div>
              )}
              
              {/* Special Request for 101+ Roses with Glass Effect */}
              <div className="relative p-6 rounded-2xl overflow-hidden border border-white/40 shadow-lg" style={{
                background: 'rgba(255, 245, 247, 0.75)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}>
                <div className="relative">
                  <p className="text-base font-semibold text-gray-800 mb-2">
                    {t.bouquetBuilder.specialOrderTitle}
                  </p>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {t.bouquetBuilder.specialOrderDesc}
                  </p>
                  <button
                    type="button"
                    onClick={() => window.location.href = '/special-request'}
                    className="w-full relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-300 to-rose-400 rounded-full blur-sm opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-rose-200 via-rose-300 to-rose-400 py-3 rounded-full shadow-lg border border-rose-400/30">
                      <span className="text-sm font-semibold text-gray-800">
                        {t.bouquetBuilder.specialOrderButton}
                      </span>
                    </div>
                  </button>
                </div>
                </div>
              </div>

              {/* Ribbon Selection */}
              <div className="mb-6">
              <p className="text-base font-semibold text-gray-800 mb-1">
                {t.bouquetBuilder.ribbon} {selectedRibbon !== 'none' && (() => {
                  const rib = ribbonOptions.find(r => r.key === selectedRibbon);
                  return rib ? <span className="font-normal text-gray-600">{t.bouquetBuilder.ribbonColors[rib.translationKey]}</span> : null;
                })()}
              </p>
              <p className="text-xs text-gray-400 mb-3">(+{t.common.currency}{RIBBON_PRICE})</p>
              <div className="grid grid-cols-5 gap-2">
                {ribbonOptions.map((rib) => (
                  <button
                    key={rib.key}
                    onClick={() => setSelectedRibbon(rib.key)}
                    className={`flex flex-col items-center justify-center rounded-lg border-2 text-xs transition-all duration-300 aspect-square overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 ${
                      selectedRibbon === rib.key ? 'border-rose-400 ring-2 ring-rose-300 shadow-md' : 'border-gray-200 hover:border-rose-200'
                    }`}
                    title={t.bouquetBuilder.ribbonColors[rib.translationKey]}
                  >
                    {rib.image ? (
                      <img src={rib.image} alt={t.bouquetBuilder.ribbonColors[rib.translationKey]} className="w-12 h-12 object-contain mb-0.5" />
                    ) : (
                      <span className="text-xl mb-0.5">🚫</span>
                    )}
                    <span className="text-[10px] text-gray-600 leading-tight text-center truncate w-full px-0.5">
                      {t.bouquetBuilder.ribbonColors[rib.translationKey]}
                    </span>
                  </button>
                ))}
                </div>
              </div>

              {/* Wrapping Paper */}
              <div className="mb-6">
              <p className="text-base font-semibold text-gray-800 mb-1">
                {t.bouquetBuilder.wrappingPaper} <span className="text-rose-500">*</span>{' '}
                <span className="font-normal text-gray-600">{wrappingOptions.find(w => w.key === wrapping)?.label}</span>
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
                {wrappingOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveThumb(i);
                      // Update preview to show this color
                    }}
                    className={`w-16 h-20 rounded-lg border-2 overflow-hidden transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1 ${
                      activeThumb === i ? 'border-rose-400 ring-2 ring-rose-300 shadow-md' : 'border-gray-200 hover:border-rose-200'
                    }`}
                  >
                    <div className="relative w-full h-full bg-gradient-to-br from-rose-50 to-pink-50">
                      <img
                        src={opt.image}
                        alt={opt.label}
                        className="absolute inset-0 w-full h-full object-contain p-1"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  </button>
                ))}
                </div>
              </div>

              {/* Extra Decoration */}
              <div className="mb-6">
              <p className="text-base font-semibold text-gray-800 mb-1">{t.bouquetBuilder.extraDecoration}</p>
              <p className="text-xs text-gray-400 mb-3">{t.bouquetBuilder.extraDecorationNote}</p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {decorationOptions.map((deco) => (
                  <button
                    key={deco.key}
                    onClick={() => toggleDecoration(deco.key)}
                    className={`flex flex-col items-center justify-center rounded-lg border-2 text-xs transition-all duration-300 aspect-square overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 ${
                      selectedDecorations.includes(deco.key)
                        ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-300 shadow-md'
                        : 'border-gray-200 hover:border-rose-200'
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

              {/* Custom Text */}
              <div className="mb-0">
                <p className="text-base font-semibold text-gray-800 mb-1">{t.bouquetBuilder.customText}</p>
                <p className="text-xs text-gray-400 mb-3">{t.bouquetBuilder.customTextNote} (+{t.common.currency}{CUSTOM_TEXT_PRICE_PER_LETTER.toFixed(2)} {t.bouquetBuilder.perLetter})</p>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={t.bouquetBuilder.customTextPlaceholder}
                  maxLength={100}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 resize-none"
                  rows={3}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">{customText.length} / 100 {t.bouquetBuilder.characters}</span>
                  {customText.length > 0 && (
                    <span className="text-sm font-semibold text-rose-600">
                      +{t.common.currency}{(customText.length * CUSTOM_TEXT_PRICE_PER_LETTER).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              
            </div>
          </div>

          {/* Price + Add to Cart */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xl font-semibold text-gray-800">{t.bouquetBuilder.totalPrice}</span>
                <span className="text-2xl font-bold text-gray-900">{t.common.currency}{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>{roseCount} {t.bouquetBuilder.roses} × {t.common.currency}{pricePerRose.toFixed(2)} {t.bouquetBuilder.perRose}</span>
                {roseCount > 5 && (
                  <span className="text-green-600 font-semibold">{t.bouquetBuilder.volumeDiscount}</span>
                )}
              </div>
              <button
                onClick={handleAddToCart}
                className="w-full relative group"
              >
                {added ? (
                  <div className="bg-green-500 text-white py-4 rounded-full font-semibold text-base flex items-center justify-center gap-3">
                    <Check className="w-5 h-5" />
                    {t.bouquetBuilder.added}
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-300 to-rose-400 rounded-full blur-sm opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-rose-200 via-rose-300 to-rose-400 py-4 rounded-full shadow-xl border border-rose-400/30 flex items-center justify-center gap-3">
                      <span className="text-base font-semibold text-gray-800">
                        {t.bouquetBuilder.addToCart}
                      </span>
                    </div>
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
