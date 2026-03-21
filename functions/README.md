# 🔥 Firebase Cloud Functions API Reference

## Overview

This document describes all Firebase Cloud Functions used in the SatinGlanz platform.

**Base URL**: `https://us-central1-anamarijasatinroses.cloudfunctions.net`

## Payment Functions

### `createCheckoutSession`

Creates a Stripe Checkout Session for processing payments with Card and Klarna.

**Type**: HTTPS Callable  
**Authentication**: Optional (supports guest checkout)

**Request**:
```typescript
{
  orderId: string;        // Required: Firestore order document ID
  successUrl?: string;    // Optional: Custom success redirect URL
  cancelUrl?: string;     // Optional: Custom cancel redirect URL
}
```

**Response**:
```typescript
{
  sessionId: string;      // Stripe Checkout Session ID
  url: string;           // Redirect URL to Stripe hosted checkout
}
```

**Example**:
```javascript
const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
const result = await createCheckoutSession({ 
  orderId: 'abc123',
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/checkout'
});
// Redirect to: result.data.url
```

**Errors**:
- `invalid-argument`: Missing orderId or invalid order data
- `not-found`: Order not found in Firestore
- `internal`: Stripe API error

---

### `createPaymentIntent`

Legacy function for creating Stripe Payment Intents. Kept for backward compatibility.

**Type**: HTTPS Callable  
**Authentication**: Optional

**Request**:
```typescript
{
  amount: number;         // Amount in cents (e.g., 1000 = €10.00)
  currency?: string;      // Default: 'eur'
  customerEmail?: string;
  orderId?: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
  }>;
  shippingCost: number;
}
```

**Response**:
```typescript
{
  clientSecret: string;   // For confirming payment on client
}
```

**Security**: Performs server-side price verification by recalculating total from product prices in Firestore.

---

### `stripeWebhook`

Handles Stripe webhook events for automated order status updates.

**Type**: HTTPS Request (POST)  
**URL**: `/stripeWebhook`  
**Authentication**: Stripe signature verification

**Supported Events**:
- `checkout.session.completed` - Updates order status to 'paid'

**Webhook Setup**:
1. Add endpoint in Stripe Dashboard: `https://us-central1-anamarijasatinroses.cloudfunctions.net/stripeWebhook`
2. Select event: `checkout.session.completed`
3. Copy webhook secret to `functions/.env` as `STRIPE_WEBHOOK_SECRET`

---

## Email Functions

All email functions use Gmail SMTP and return `{ success: boolean }`.

### `sendOrderEmail`

Sends order confirmation email to customer.

**Type**: HTTPS Callable  
**Authentication**: Required

**Request**:
```typescript
{
  orderData: {
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    shippingAddress: {
      firstName: string;
      lastName: string;
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };
  orderId: string;
}
```

---

### `sendOrderConfirmationEmail`

Sends order notification to admin.

**Request**: Same as `sendOrderEmail`

---

### `sendTrackingEmail`

Sends shipping notification with tracking number.

**Request**:
```typescript
{
  orderId: string;
  trackingNumber: string;
  carrier: 'DHL' | 'GLS' | 'UPS' | 'FedEx' | 'USPS';
  customerEmail: string;
  customerName: string;
}
```

---

### `sendWelcomeEmail`

Sends welcome email to new users.

**Request**:
```typescript
{
  email: string;
  displayName: string;
}
```

---

### `sendPasswordResetEmail`

Sends custom password reset email.

**Request**:
```typescript
{
  email: string;
  resetLink: string;
}
```

---

### `sendContactEmail`

Forwards contact form submissions to admin.

**Request**:
```typescript
{
  name: string;
  email: string;
  subject: string;
  message: string;
}
```

---

### `sendInvoiceEmail`

Sends invoice to customer.

**Request**:
```typescript
{
  orderId: string;
  customerEmail: string;
  invoiceData: {
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    shipping: number;
    total: number;
  };
}
```

---

### `sendSpecialBouquetRequest`

Handles special requests for 101+ rose bouquets.

**Request**:
```typescript
{
  customerName: string;
  customerEmail: string;
  roseCount: number;
  colors: string[];
  message?: string;
}
```

---

## Utility Functions

### `validateBouquetPrice`

Server-side validation of custom bouquet pricing.

**Type**: HTTPS Callable  
**Authentication**: Optional

**Request**:
```typescript
{
  roseCount: number;
  selectedRibbon: string;
  selectedDecorations: string[];
}
```

**Response**:
```typescript
{
  isValid: boolean;
  calculatedPrice: number;
  clientPrice: number;
}
```

**Pricing Logic**:
- 1-5 roses: €2.50/rose
- 6-10 roses: €2.30/rose
- 11-20 roses: €2.10/rose
- 21-30 roses: €1.95/rose
- 31+ roses: €1.80/rose
- Ribbon: +€3.00
- Decoration: +€2.00 each

---

### `verifyResetToken`

Verifies password reset token validity.

**Type**: HTTPS Callable  
**Authentication**: Not required

**Request**:
```typescript
{
  token: string;
}
```

**Response**:
```typescript
{
  valid: boolean;
  email?: string;
}
```

---

## Error Handling

All functions follow Firebase error format:

```typescript
{
  code: string;           // Error code (e.g., 'invalid-argument')
  message: string;        // Human-readable error message
  details?: any;          // Additional error details
}
```

**Common Error Codes**:
- `unauthenticated` - User not logged in (for protected functions)
- `permission-denied` - Insufficient permissions
- `invalid-argument` - Missing or invalid parameters
- `not-found` - Resource not found
- `internal` - Server error

---

## Rate Limiting

Firebase automatically rate limits functions:
- **Free tier**: 2M invocations/month
- **Blaze plan**: Pay per use

**Best Practices**:
- Implement client-side debouncing
- Cache responses when possible
- Use batch operations for multiple items

---

## Testing

### Local Testing
```bash
cd functions
npm run serve
```

Functions available at: `http://localhost:5001/anamarijasatinroses/us-central1/{functionName}`

### Calling Functions from Client
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const myFunction = httpsCallable(functions, 'functionName');

try {
  const result = await myFunction({ param: 'value' });
  console.log(result.data);
} catch (error) {
  console.error('Error:', error.code, error.message);
}
```

---

## Deployment

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:functionName

# View logs
firebase functions:log
```

---

**Last Updated**: March 2026  
**Functions Runtime**: Node.js 20
