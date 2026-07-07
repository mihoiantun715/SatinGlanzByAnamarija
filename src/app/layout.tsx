import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProductsProvider } from "@/context/ProductsContext";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import CookieConsent from '@/components/CookieConsent';
import VacationMode from '@/components/VacationMode';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SatinGlanz by Anamarija | Handgefertigte Satinrosen",
  description: "SatinGlanz by Anamarija — Handgefertigte Satinrosen. Elegant, everlasting floral art made with love. Shop single roses, bouquets, arrangements, and wedding pieces.",
  keywords: "SatinGlanz, satin roses, handcrafted roses, satenske ruže, handgefertigte Satinrosen, Anamarija, everlasting flowers, wedding bouquets, satin flower art",
  icons: {
    icon: [
      { url: '/logo.png', sizes: 'any' },
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/logo.png',
    shortcut: '/logo.png',
  },
};

async function getVacationMode() {
  try {
    const docRef = doc(db, 'settings', 'vacationMode');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        active: data.active || false,
        returnDate: data.returnDate || null,
      };
    }
  } catch (error) {
    console.error('Error fetching vacation mode:', error);
  }
  return { active: false, returnDate: null };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const vacationConfig = await getVacationMode();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
          strategy="lazyOnload"
        />
        <ErrorBoundary>
          <LanguageProvider>
            <AuthProvider>
              <ProductsProvider>
                <CartProvider>
                  <AnalyticsTracker />
                  {vacationConfig.active && vacationConfig.returnDate ? (
                    <VacationMode returnDate={new Date(vacationConfig.returnDate)} />
                  ) : (
                    <div className="flex flex-col min-h-screen">
                      <Navbar />
                      <main className="flex-1">{children}</main>
                      <Footer />
                    </div>
                  )}
                  <CookieConsent />
                </CartProvider>
              </ProductsProvider>
            </AuthProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
