# 🌹 SatinGlanz by Anamarija - Premium Rose Bouquet E-Commerce Platform

A modern, full-stack e-commerce platform specializing in custom rose bouquets with real-time pricing, multi-payment support (Stripe + Klarna), and a unique bouquet builder.

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-11.1.0-orange)
![Stripe](https://img.shields.io/badge/Stripe-17.5.0-purple)

## 🚀 Features

### Core E-Commerce
- **Product Catalog** - Browse pre-made bouquets and shop items
- **Shopping Cart** - Persistent cart with localStorage and Firestore sync
- **Secure Checkout** - Stripe Payment Element with Card + Klarna support
- **Order Management** - Real-time order tracking and status updates
- **User Authentication** - Firebase Auth with Google Sign-In
- **Admin Dashboard** - Manage products, orders, and customers

### Unique Features
- **🎨 Custom Bouquet Builder** - Interactive builder with:
  - 8 rose color options (Red, Cherry Red, Burgundy, Dusty Rose, Peach, White, Royal Blue, Sunflower Yellow)
  - Volume-based pricing (€2.50 - €1.80 per rose)
  - Real-time price calculation
  - Visual preview with color mixing
  - 11 wrapping paper options
  - 4 ribbon options
  - 6 decoration options
  - Special request flow for 101+ roses

- **💰 Smart Pricing System**
  - Volume discounts (5, 10, 20, 30, 50+ roses)
  - Free shipping over €70
  - Tiered shipping rates (€3.19 / €5.19)
  - Server-side price verification

- **🌍 Multi-Language Support**
  - English, German, Croatian, Romanian, Bulgarian, Turkish
  - Dynamic content translation
  - SEO-optimized for each language

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16.1.6 (App Router, Static Export)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Lucide React icons
- **Maps**: @react-google-maps/api
- **Animations**: Framer Motion

### Backend
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions (Node.js 20)
- **Email**: Nodemailer with Gmail SMTP

### Payment Processing
- **Provider**: Stripe
- **Methods**: Card, Klarna (Buy Now Pay Later)
- **Integration**: Stripe Checkout Sessions
- **Security**: Server-side price validation

### DevOps
- **Hosting**: Vercel (Frontend), Firebase (Functions)
- **Version Control**: Git
- **CI/CD**: Vercel auto-deployment
- **Analytics**: Firebase Analytics

## 📦 Installation

### Prerequisites
- Node.js 20+ and npm
- Firebase account
- Stripe account
- Gmail account (for email notifications)

### 1. Clone Repository
```bash
git clone https://github.com/mihoiantun715/SatinGlanzByAnamarija.git
cd SatinGlanzByAnamarija
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

### 3. Environment Setup

Create `.env.local` in root:
```env
# See ENV_SETUP.md for complete configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

Create `functions/.env`:
```env
STRIPE_SECRET_KEY=your_stripe_secret_key
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

**See [ENV_SETUP.md](./ENV_SETUP.md) for complete environment variable documentation.**

### 4. Firebase Setup
```bash
# Login to Firebase
firebase login

# Initialize Firebase (if needed)
firebase init

# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy Cloud Functions
firebase deploy --only functions
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── build-bouquet/      # Custom bouquet builder
│   │   ├── checkout/           # Checkout & payment
│   │   ├── admin/              # Admin dashboard
│   │   └── ...
│   ├── components/             # Reusable React components
│   ├── context/                # React Context providers
│   │   ├── AuthContext.tsx     # Authentication state
│   │   ├── CartContext.tsx     # Shopping cart state
│   │   ├── LanguageContext.tsx # i18n translations
│   │   └── ProductsContext.tsx # Product data
│   └── lib/                    # Utilities and helpers
│       ├── firebase.ts         # Firebase configuration
│       ├── products.ts         # Product data & translations
│       ├── shippingCalculator.ts # Shipping logic
│       └── types.ts            # TypeScript interfaces
├── functions/                  # Firebase Cloud Functions
│   └── src/
│       └── index.ts            # All backend functions
├── public/                     # Static assets
│   ├── Roses For Bouquete/    # Rose color images
│   ├── Wrapping Paper/         # Wrapping options
│   ├── Ribbons/                # Ribbon options
│   └── Extra Decoration/       # Decoration options
├── firestore.rules             # Firestore security rules
├── firebase.json               # Firebase configuration
└── next.config.ts              # Next.js configuration
```

## 🚢 Deployment

### Frontend (Vercel)
```bash
# Automatic deployment on git push to master
git push origin master

# Manual deployment
vercel --prod
```

### Backend (Firebase)
```bash
# Deploy all Firebase services
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

## 🔐 Security Features

- **Server-side price validation** - Prevents client-side price manipulation
- **Firestore security rules** - Role-based access control
- **XSS protection** - HTML sanitization in emails
- **CORS configuration** - Restricted API access
- **Secure payment flow** - PCI-compliant Stripe integration
- **Order validation** - Success page validates order existence and recency

## 📊 Key Business Logic

### Pricing Tiers (Bouquet Builder)
- 1-5 roses: €2.50/rose
- 6-10 roses: €2.30/rose
- 11-20 roses: €2.10/rose
- 21-30 roses: €1.95/rose
- 31+ roses: €1.80/rose

### Shipping Rates
- Shop products: €3.19
- Bouquets ≤10 roses: €3.19
- Bouquets >10 roses: €5.19
- Orders ≥€70: FREE

### Delivery
- Standard: 1-3 business days after order completion

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Firebase Functions
cd functions
npm run serve            # Test functions locally
npm run build            # Compile TypeScript
npm run deploy           # Deploy to Firebase

# Linting & Type Checking
npm run lint             # Run ESLint
npx tsc --noEmit         # Type check
```

## 📚 Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System design and data flow
- [Environment Setup](./ENV_SETUP.md) - Complete environment variable guide
- [API Documentation](./functions/README.md) - Firebase Functions API reference

## 🤝 Support

For questions or issues:
- Email: satinglanzbyanamarija@gmail.com
- Website: https://satinglanzbyanamarija.com

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ using Next.js, Firebase, and Stripe**
