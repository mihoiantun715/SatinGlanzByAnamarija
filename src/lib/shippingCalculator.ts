// Shipping calculation based on box dimensions and carrier

interface BoxSize {
  length: number;
  width: number;
  height: number;
}

interface ShippingRate {
  name: string;
  price: number;
  maxLength: number;
  maxWidth: number;
  maxHeight: number;
  maxWeight?: number;
}

// DHL Shipping Rates (Germany)
const DHL_RATES: ShippingRate[] = [
  { name: '2kg - Päckchen S', price: 4.19, maxLength: 35, maxWidth: 25, maxHeight: 10, maxWeight: 2 },
  { name: '2kg - Päckchen M', price: 5.19, maxLength: 60, maxWidth: 30, maxHeight: 15, maxWeight: 2 },
  { name: '2kg - Paket', price: 6.19, maxLength: 60, maxWidth: 30, maxHeight: 15, maxWeight: 2 },
  { name: '5kg - Paket', price: 7.69, maxLength: 120, maxWidth: 60, maxHeight: 60, maxWeight: 5 },
  { name: '10kg - Paket', price: 10.49, maxLength: 120, maxWidth: 60, maxHeight: 60, maxWeight: 10 },
  { name: '20kg - Paket', price: 18.99, maxLength: 120, maxWidth: 60, maxHeight: 60, maxWeight: 20 },
  { name: '31.5kg - Paket', price: 23.99, maxLength: 120, maxWidth: 60, maxHeight: 60, maxWeight: 31.5 },
];

// GLS Shipping Rates (Germany)
const GLS_RATES: ShippingRate[] = [
  { name: 'XS', price: 3.29, maxLength: 28, maxWidth: 20, maxHeight: 5 },
  { name: 'S', price: 3.89, maxLength: 35, maxWidth: 20, maxHeight: 10 },
  { name: 'M', price: 5.59, maxLength: 45, maxWidth: 30, maxHeight: 20 },
  { name: 'L', price: 10.00, maxLength: 60, maxWidth: 36, maxHeight: 25 },
  { name: 'XL', price: 22.00, maxLength: 80, maxWidth: 40, maxHeight: 30 },
];

// Bouquet shipping rates based on rose count
const BOUQUET_SHIPPING = {
  dhl: [
    { maxRoses: 20, price: 5.19 },
    { maxRoses: 50, price: 7.69 },
    { maxRoses: 101, price: 7.69 },
  ],
  gls: [
    { maxRoses: 20, price: 5.59 },
    { maxRoses: 50, price: 7.79 },
    { maxRoses: 101, price: 10.00 },
  ],
};

/**
 * Check if box fits within shipping rate dimensions
 */
function boxFitsInRate(box: BoxSize, rate: ShippingRate): boolean {
  // Sort dimensions to find longest, middle, shortest
  const boxDims = [box.length, box.width, box.height].sort((a, b) => b - a);
  const rateDims = [rate.maxLength, rate.maxWidth, rate.maxHeight].sort((a, b) => b - a);
  
  // Check if each dimension fits
  return boxDims[0] <= rateDims[0] && boxDims[1] <= rateDims[1] && boxDims[2] <= rateDims[2];
}

/**
 * Calculate shipping cost for a product based on box dimensions
 */
export function calculateProductShipping(box: BoxSize, carrier: 'dhl' | 'gls'): number {
  // If no box dimensions, return 0 (will be calculated differently)
  if (box.length === 0 || box.width === 0 || box.height === 0) {
    return 0;
  }

  const rates = carrier === 'dhl' ? DHL_RATES : GLS_RATES;
  
  // Find the cheapest rate that fits the box
  for (const rate of rates) {
    if (boxFitsInRate(box, rate)) {
      return rate.price;
    }
  }
  
  // If no rate fits, return the largest rate
  return rates[rates.length - 1].price;
}

/**
 * Calculate shipping cost for a bouquet based on rose count
 */
export function calculateBouquetShipping(roseCount: number, carrier: 'dhl' | 'gls'): number {
  const rates = BOUQUET_SHIPPING[carrier];
  
  for (const rate of rates) {
    if (roseCount <= rate.maxRoses) {
      return rate.price;
    }
  }
  
  // If more than max roses, return highest rate
  return rates[rates.length - 1].price;
}

/**
 * Calculate total shipping cost for cart items based on box dimensions and bouquet rose count
 */
export function calculateCartShipping(
  items: Array<{
    product: any;
    quantity: number;
    roseCount?: number;
  }>,
  carrier: 'dhl' | 'gls'
): number {
  // Safety check - if no items, return 0
  if (!items || items.length === 0) {
    return 0;
  }

  try {
    let totalShipping = 0;
    let largestBoxLength = 0;
    let largestBoxWidth = 0;
    let largestBoxHeight = 0;
    let totalBouquetRoses = 0;
    let hasBouquets = false;
    let hasProducts = false;
    let hasProductsWithoutBoxSize = false;

    for (const item of items) {
      // Safety check - ensure product exists
      if (!item || !item.product) continue;
      
      const product = item.product;
      
      // PRIORITY 1: If product has box dimensions, use those (even for bouquets)
      if (product.boxLength && product.boxWidth && product.boxHeight) {
        hasProducts = true;
        // Track largest box dimensions for products
        const qty = item.quantity || 1;
        for (let i = 0; i < qty; i++) {
          if (product.boxLength > largestBoxLength) largestBoxLength = product.boxLength;
          if (product.boxWidth > largestBoxWidth) largestBoxWidth = product.boxWidth;
          if (product.boxHeight > largestBoxHeight) largestBoxHeight = product.boxHeight;
        }
      }
      // PRIORITY 2: If it's a bouquet without box dimensions, use rose count
      else if (item.roseCount || product.category === 'Bouquets') {
        hasBouquets = true;
        const roses = item.roseCount || 1;
        totalBouquetRoses += roses * (item.quantity || 1);
      } 
      // PRIORITY 3: Product without any dimensions
      else {
        hasProductsWithoutBoxSize = true;
      }
    }

    // Calculate bouquet shipping
    if (hasBouquets && totalBouquetRoses > 0) {
      totalShipping += calculateBouquetShipping(totalBouquetRoses, carrier);
    }

    // Calculate product shipping based on box dimensions
    if (hasProducts && largestBoxLength > 0) {
      totalShipping += calculateProductShipping(
        { length: largestBoxLength, width: largestBoxWidth, height: largestBoxHeight },
        carrier
      );
    }

    // Fallback: if there are products without box sizes, use default rate
    if (hasProductsWithoutBoxSize && !hasProducts && !hasBouquets) {
      totalShipping = carrier === 'dhl' ? 5.19 : 5.59;
    }

    // If no shipping calculated, use default
    if (totalShipping === 0) {
      totalShipping = carrier === 'dhl' ? 5.19 : 5.59;
    }

    return totalShipping;
  } catch (error) {
    console.error('Shipping calculation error:', error);
    // Fallback to default rates on any error
    return carrier === 'dhl' ? 5.19 : 5.59;
  }
}

/**
 * Get recommended carrier based on items - returns the cheaper option
 */
export function getRecommendedCarrier(
  items: Array<{
    product: any;
    quantity: number;
    roseCount?: number;
  }>
): 'dhl' | 'gls' {
  // Calculate shipping cost for both carriers
  const dhlCost = calculateCartShipping(items, 'dhl');
  const glsCost = calculateCartShipping(items, 'gls');
  
  // Return the cheaper option
  return dhlCost <= glsCost ? 'dhl' : 'gls';
}
