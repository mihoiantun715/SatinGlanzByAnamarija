# 🏗️ Architecture Overview - SatinGlanz E-Commerce Platform

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Next.js    │  │   React      │  │  Tailwind    │          │
│  │   App Router │  │   Contexts   │  │     CSS      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL (Static Hosting)                     │
│                    Next.js Static Export                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   FIREBASE SERVICES      │  │   STRIPE API             │
│  ┌────────────────────┐  │  │  ┌────────────────────┐  │
│  │   Firestore DB     │  │  │  │  Checkout Sessions │  │
│  │   - Products       │  │  │  │  - Card Payments   │  │
│  │   - Orders         │  │  │  │  - Klarna          │  │
│  │   - Users          │  │  │  └────────────────────┘  │
│  │   - Carts          │  │  │                          │
│  └────────────────────┘  │  └──────────────────────────┘
│  ┌────────────────────┐  │
│  │   Authentication   │  │
│  │   - Email/Password │  │
│  │   - Google OAuth   │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │  Cloud Functions   │  │
│  │   - Payment Intent │  │
│  │   - Email Sending  │  │
│  │   - Webhooks       │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │   Storage          │  │
│  │   - Product Images │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

## Data Flow

### 1. User Authentication Flow
```
User → Firebase Auth → Firestore User Doc → Context State → UI Update
```

### 2. Shopping Cart Flow
```
Add to Cart → CartContext → localStorage (guest) / Firestore (logged in)
Login → Merge localStorage cart with Firestore cart
```

### 3. Checkout & Payment Flow
```
1. User fills shipping info
2. Client creates order in Firestore (status: pending_payment)
3. Client calls createCheckoutSession Cloud Function
4. Function validates order exists and creates Stripe Checkout Session
5. User redirected to Stripe hosted checkout page
6. User selects payment method (Card/Klarna) and completes payment
7. Stripe redirects to success page with orderId
8. Success page validates order exists and is recent (<10 min)
9. [Future] Stripe webhook updates order status to 'paid'
10. Email confirmation sent via Cloud Function
```

### 4. Custom Bouquet Builder Flow
```
1. User selects rose colors (mix & match)
2. Client calculates price based on volume tiers
3. User adds wrapping, ribbons, decorations
4. Real-time price updates
5. Add to cart with all customization details
6. Checkout flow (same as above)
```

## Database Schema

### Firestore Collections

#### `products`
```typescript
{
  id: string;                    // Auto-generated
  slug: string;                  // URL-friendly identifier
  price: number;                 // Base price in EUR
  category: 'bouquet' | 'shop';
  inStock: boolean;
  featured: boolean;
  colors: string[];              // Available color options
  images: string[];              // Storage URLs
  name: {                        // Multilingual
    en: string;
    de: string;
    hr: string;
    ro: string;
    bg: string;
    tr: string;
  };
  description: { /* same */ };
  shortDescription: { /* same */ };
}
```

#### `orders`
```typescript
{
  id: string;                    // Auto-generated
  userId?: string;               // null for guest orders
  userEmail?: string;
  status: 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;             // ISO timestamp
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  
  // Items
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    color?: string;
    image?: string;
    // For custom bouquets:
    roseColors?: Array<{ color: string; quantity: number }>;
    wrappingPaper?: string;
    ribbon?: string;
    decorations?: string[];
    customization?: string;
  }>;
  
  // Pricing
  subtotal: number;
  shippingCost: number;
  total: number;
  
  // Shipping
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  shippingCarrier?: string;
  trackingNumber?: string;
  
  // Payment
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentMethod?: 'card' | 'klarna';
}
```

#### `users`
```typescript
{
  id: string;                    // Firebase Auth UID
  email: string;
  displayName?: string;
  photoURL?: string;
  isAdmin: boolean;              // Admin privileges
  createdAt: string;
  
  savedAddress?: {               // For faster checkout
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
  };
}
```

#### `carts`
```typescript
{
  id: string;                    // User ID
  items: Array<{
    productId: string;
    quantity: number;
    selectedColor?: string;
    // Custom bouquet details (same as order items)
  }>;
  updatedAt: string;
}
```

#### `analytics`
```typescript
{
  id: string;                    // Auto-generated
  userId?: string;
  sessionId: string;
  event: 'page_view' | 'product_view' | 'add_to_cart' | 'checkout_start' | 'purchase';
  timestamp: string;
  data: object;                  // Event-specific data
}
```

## Firebase Cloud Functions

### Payment Functions

#### `createCheckoutSession`
**Type**: HTTPS Callable  
**Purpose**: Create Stripe Checkout Session for Klarna + Card payments  
**Input**:
```typescript
{
  orderId: string;
  successUrl?: string;
  cancelUrl?: string;
}
```
**Output**:
```typescript
{
  sessionId: string;
  url: string;  // Redirect URL
}
```
**Security**: Validates order exists, creates line items from order data

#### `createPaymentIntent`
**Type**: HTTPS Callable  
**Purpose**: Legacy - Create Stripe Payment Intent (kept for compatibility)  
**Security**: Server-side price verification

#### `stripeWebhook`
**Type**: HTTPS Request  
**Purpose**: Handle Stripe webhook events (checkout.session.completed)  
**Security**: Signature verification with webhook secret  
**Action**: Updates order status to 'paid' when payment succeeds

### Email Functions

All email functions use Gmail SMTP via Nodemailer:

- `sendOrderEmail` - Order confirmation to customer
- `sendOrderConfirmationEmail` - Admin notification
- `sendTrackingEmail` - Shipping notification
- `sendWelcomeEmail` - New user welcome
- `sendPasswordResetEmail` - Password reset
- `sendContactEmail` - Contact form submissions
- `sendInvoiceEmail` - Invoice generation
- `sendSpecialBouquetRequest` - 101+ roses special requests

### Utility Functions

- `validateBouquetPrice` - Server-side bouquet price validation
- `verifyResetToken` - Password reset token verification

## Security Implementation

### Firestore Security Rules

```javascript
// Products: Public read, Admin write
match /products/{productId} {
  allow read: if true;
  allow write: if isAdmin();
}

// Orders: User can read/write own, Admin can read all
match /orders/{orderId} {
  allow read: if request.auth.uid == resource.data.userId || isAdmin();
  allow create: if request.auth != null || true;  // Allow guest orders
  allow update: if request.auth.uid == resource.data.userId || isAdmin();
}

// Users: User can read/write own profile, Admin can read all
match /users/{userId} {
  allow read: if request.auth.uid == userId || isAdmin();
  allow write: if request.auth.uid == userId;
}

// Carts: User can read/write own cart
match /carts/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

### Server-Side Validation

1. **Price Verification** - All prices recalculated server-side before payment
2. **Order Validation** - Success page validates order exists and is recent
3. **XSS Prevention** - HTML sanitization in email templates
4. **CORS** - Restricted to allowed origins
5. **Rate Limiting** - Firebase Functions automatic throttling

## Payment Flow Details

### Stripe Checkout Session

**Advantages**:
- Native Klarna support
- PCI compliance handled by Stripe
- Mobile-optimized UI
- Multiple payment methods in one flow

**Flow**:
1. Client creates order in Firestore
2. Client calls `createCheckoutSession` with orderId
3. Function fetches order, creates line items
4. Function creates Stripe Checkout Session
5. Client redirects to Stripe hosted page
6. User completes payment
7. Stripe redirects to success page
8. Webhook updates order status (async)

### Supported Payment Methods
- **Card**: Visa, Mastercard, Amex
- **Klarna**: Buy Now Pay Later (30 days)

## Performance Optimizations

1. **Static Export** - Next.js generates static HTML for fast loading
2. **Image Optimization** - Lazy loading, WebP format
3. **Code Splitting** - Automatic route-based splitting
4. **Caching** - Firebase CDN for static assets
5. **Context Optimization** - Memoized values to prevent re-renders
6. **Local Storage** - Cart persisted locally for instant access

## Scalability Considerations

### Current Limits
- **Firestore**: 1M reads/day (free tier)
- **Cloud Functions**: 2M invocations/month (free tier)
- **Storage**: 5GB (free tier)

### Scaling Strategy
1. **Database**: Firestore auto-scales, consider indexes for complex queries
2. **Functions**: Increase memory allocation for high-traffic functions
3. **CDN**: Vercel Edge Network for global distribution
4. **Caching**: Implement Redis for frequently accessed data
5. **Search**: Add Algolia for product search at scale

## Monitoring & Analytics

- **Firebase Analytics** - User behavior tracking
- **Vercel Analytics** - Performance monitoring
- **Stripe Dashboard** - Payment analytics
- **Firebase Console** - Error logging and function metrics

## Deployment Pipeline

```
Developer → Git Push → GitHub → Vercel (Frontend) + Firebase (Backend)
                                    ↓                      ↓
                              Static Export          Cloud Functions
                                    ↓                      ↓
                              Vercel CDN            Firebase Hosting
```

**Automatic Deployments**:
- Frontend: Vercel auto-deploys on push to master
- Backend: Manual deployment via `firebase deploy`

## Future Enhancements

1. **Webhook Integration** - Fully automated order status updates
2. **Inventory Management** - Real-time stock tracking
3. **Advanced Analytics** - Customer lifetime value, conversion funnels
4. **Email Marketing** - Abandoned cart recovery
5. **Mobile App** - React Native with shared codebase
6. **Admin Features** - Bulk product upload, advanced reporting
7. **Multi-Currency** - Support for USD, GBP, etc.
8. **Subscription Model** - Weekly/monthly bouquet subscriptions

---

**Last Updated**: March 2026  
**Version**: 1.0.0
