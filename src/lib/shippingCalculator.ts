// Simplified shipping calculation
// - Shop products: €3.19
// - Bouquets ≤10 roses: €3.19
// - Bouquets >10 roses: €5.19
// - Orders above €70: FREE shipping

const SHOP_PRODUCT_SHIPPING = 3.19;
const BOUQUET_SMALL_SHIPPING = 3.19; // ≤10 roses
const BOUQUET_LARGE_SHIPPING = 5.19; // >10 roses
const FREE_SHIPPING_THRESHOLD = 70.00;

/**
 * Calculate shipping cost for a bouquet based on rose count
 */
export function calculateBouquetShipping(roseCount: number): number {
  if (roseCount <= 10) {
    return BOUQUET_SMALL_SHIPPING;
  }
  return BOUQUET_LARGE_SHIPPING;
}

/**
 * Calculate total shipping cost for cart items
 * Returns 0 if order total is above €70 (free shipping)
 */
export function calculateCartShipping(
  items: Array<{
    product: any;
    quantity: number;
    roseCount?: number;
    roseColors?: Array<{ color: string; quantity: number }>;
  }>
): number {
  // Safety check - if no items, return 0
  if (!items || items.length === 0) {
    return 0;
  }

  try {
    // Calculate total cart value
    let totalCartValue = 0;
    for (const item of items) {
      if (item && item.product) {
        totalCartValue += item.product.price * (item.quantity || 1);
      }
    }

    // FREE SHIPPING for orders above €70
    if (totalCartValue >= FREE_SHIPPING_THRESHOLD) {
      return 0;
    }

    // TESTING MODE: Free shipping for carts under €1 (for Stripe testing)
    if (totalCartValue < 1) {
      return 0;
    }

    // Determine if cart has bouquets or shop products
    let totalBouquetRoses = 0;
    let hasBouquets = false;
    let hasShopProducts = false;

    for (const item of items) {
      if (!item || !item.product) continue;
      
      const product = item.product;
      
      // Check if it's a custom bouquet (has roseCount or roseColors)
      if (item.roseCount || item.roseColors) {
        hasBouquets = true;
        // Calculate total roses from roseColors array if available
        if (item.roseColors && Array.isArray(item.roseColors)) {
          const rosesInItem = item.roseColors.reduce((sum, color) => sum + color.quantity, 0);
          totalBouquetRoses += rosesInItem * (item.quantity || 1);
        } else {
          totalBouquetRoses += (item.roseCount || 1) * (item.quantity || 1);
        }
      }
      // Check if it's a bouquet by category or slug
      else if (product.category === 'Bouquets' || product.slug === 'custom-bouquet') {
        hasBouquets = true;
        // Try to extract rose count from product name
        const nameMatch = product.name?.en?.match(/(\d+)\s*rose/i);
        const roses = nameMatch ? parseInt(nameMatch[1]) : 1;
        totalBouquetRoses += roses * (item.quantity || 1);
      }
      // Otherwise it's a shop product
      else {
        hasShopProducts = true;
      }
    }

    // Calculate shipping based on cart contents
    if (hasBouquets && totalBouquetRoses > 0) {
      // If cart has bouquets, use bouquet shipping rate
      return calculateBouquetShipping(totalBouquetRoses);
    } else if (hasShopProducts) {
      // If cart has only shop products, use shop product rate
      return SHOP_PRODUCT_SHIPPING;
    }

    // Default fallback
    return SHOP_PRODUCT_SHIPPING;
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return SHOP_PRODUCT_SHIPPING;
  }
}

/**
 * Legacy function for backward compatibility - no longer uses carrier parameter
 * @deprecated Use calculateCartShipping without carrier parameter
 */
export function getRecommendedCarrier(
  items: Array<{
    product: any;
    quantity: number;
    roseCount?: number;
  }>
): 'dhl' | 'gls' {
  // Always return 'dhl' since we no longer have carrier selection
  return 'dhl';
}
