'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, Translation } from '@/lib/types';
import { getTranslation } from '@/lib/translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translation;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // Check if user has previously selected a language
    const saved = localStorage.getItem('locale') as Locale;
    if (saved && ['en', 'de', 'hr', 'ro', 'bg', 'tr'].includes(saved)) {
      setLocaleState(saved);
      return;
    }

    // Auto-detect browser language if no saved preference
    const browserLang = navigator.language.toLowerCase();
    const supportedLocales: Locale[] = ['en', 'de', 'hr', 'ro', 'bg', 'tr'];
    
    // Check exact match first (e.g., 'de', 'hr')
    if (supportedLocales.includes(browserLang as Locale)) {
      setLocaleState(browserLang as Locale);
      localStorage.setItem('locale', browserLang);
      return;
    }
    
    // Check language prefix (e.g., 'de-DE' -> 'de', 'hr-HR' -> 'hr')
    const langPrefix = browserLang.split('-')[0] as Locale;
    if (supportedLocales.includes(langPrefix)) {
      setLocaleState(langPrefix);
      localStorage.setItem('locale', langPrefix);
      return;
    }
    
    // Default to English if no match
    setLocaleState('en');
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
  };

  const t = getTranslation(locale);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
