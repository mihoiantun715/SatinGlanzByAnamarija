# 🔐 Environment Variables Setup Guide

## Overview

This guide covers all environment variables needed for the SatinGlanz platform.

## Frontend Environment Variables

Create `.env.local` in the project root:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAjqX5WS-BZlEFUMkgw5tRHzHaMN7_2_Fo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=anamarijasatinroses.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=anamarijasatinroses
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=anamarijasatinroses.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1016099013348
NEXT_PUBLIC_FIREBASE_APP_ID=1:1016099013348:web:c1e8b4d4e0f8f8f8f8f8f8
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Stripe Public Key (Live)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_51T6HdURxZ5rzXIkdeQqyjWs9mTaYOvCQNeGlgukCgvMNs4MrasTO6Tr9zoIp2Dfcxdcak60DiBQkkAE6iuWGg9fO00OCC5EmrL

# Google Maps API (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Backend Environment Variables (Firebase Functions)

Create `functions/.env`:

```env
# Stripe Secret Key (Live)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key

# Stripe Webhook Secret (for webhook signature verification)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Gmail SMTP Configuration
GMAIL_USER=satinglanzbyanamarija@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password

# Frontend URL (for email links and redirects)
FRONTEND_URL=https://satinglanzbyanamarija.com
```

## How to Get Each Variable

### Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click gear icon → Project settings
4. Scroll to "Your apps" → Web app
5. Copy all config values

### Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Click "Developers" → "API keys"
3. Copy "Publishable key" (pk_live_...) for frontend
4. Reveal and copy "Secret key" (sk_live_...) for backend
5. **Important**: Use test keys (pk_test_, sk_test_) for development

### Stripe Webhook Secret

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter URL: `https://us-central1-anamarijasatinroses.cloudfunctions.net/stripeWebhook`
4. Select event: `checkout.session.completed`
5. Copy the webhook signing secret (whsec_...)

### Gmail App Password

1. Go to [Google Account](https://myaccount.google.com/)
2. Security → 2-Step Verification (must be enabled)
3. App passwords → Generate new
4. Select "Mail" and "Other (Custom name)"
5. Copy the 16-character password

## Security Best Practices

- ✅ Never commit `.env` files to Git
- ✅ Use different keys for development and production
- ✅ Rotate secrets regularly
- ✅ Restrict API keys to specific domains/IPs
- ✅ Enable Stripe webhook signature verification
- ✅ Use environment-specific Firebase projects

## Deployment

### Vercel
Environment variables are set in Vercel dashboard:
1. Project Settings → Environment Variables
2. Add each `NEXT_PUBLIC_*` variable
3. Select "Production" environment

### Firebase Functions
Variables are set via `.env` file in `functions/` directory.
Firebase automatically loads them during deployment.

---

**Last Updated**: March 2026
