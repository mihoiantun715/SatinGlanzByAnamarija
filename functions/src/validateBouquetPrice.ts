import * as functions from 'firebase-functions';

// Volume-based pricing tiers (MUST match client-side logic)
const getPricePerRose = (count: number): number => {
  if (count <= 5) return 2.50;
  if (count <= 10) return 2.30;
  if (count <= 20) return 2.10;
  if (count <= 30) return 1.95;
  return 1.80; // 31-50+
};

const RIBBON_PRICE = 3;
const DECORATION_PRICE = 2;

interface BouquetPriceRequest {
  roseCount: number;
  hasRibbon: boolean;
  decorationCount: number;
}

interface BouquetPriceResponse {
  validatedPrice: number;
  pricePerRose: number;
  breakdown: {
    rosesTotal: number;
    ribbonTotal: number;
    decorationsTotal: number;
  };
}

/**
 * Cloud Function to validate bouquet pricing server-side
 * This prevents client-side price manipulation
 */
export const validateBouquetPrice = functions.https.onCall(
  (data: BouquetPriceRequest, context): BouquetPriceResponse => {
    // Validate input
    if (!data || typeof data.roseCount !== 'number') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid rose count provided'
      );
    }

    const { roseCount, hasRibbon, decorationCount } = data;

    // Validate ranges
    if (roseCount < 0 || roseCount > 200) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Rose count must be between 0 and 200'
      );
    }

    if (decorationCount < 0 || decorationCount > 10) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Decoration count must be between 0 and 10'
      );
    }

    // Calculate server-side price
    const pricePerRose = getPricePerRose(roseCount);
    const rosesTotal = roseCount * pricePerRose;
    const ribbonTotal = hasRibbon ? RIBBON_PRICE : 0;
    const decorationsTotal = decorationCount * DECORATION_PRICE;
    const validatedPrice = rosesTotal + ribbonTotal + decorationsTotal;

    return {
      validatedPrice: Math.round(validatedPrice * 100) / 100, // Round to 2 decimals
      pricePerRose,
      breakdown: {
        rosesTotal,
        ribbonTotal,
        decorationsTotal,
      },
    };
  }
);
