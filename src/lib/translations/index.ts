import { en } from './en';
import { de } from './de';
import { hr } from './hr';
import { ro } from './ro';
import { bg } from './bg';
import { tr } from './tr';
import { Locale, Translation } from '../types';

export const translations: Record<Locale, Translation> = {
  en,
  de,
  hr,
  ro,
  bg,
  tr,
};

export const localeNames: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  hr: 'Hrvatski',
  ro: 'Română',
  bg: 'Български',
  tr: 'Türkçe',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  de: '🇩🇪',
  hr: '🇭🇷',
  ro: '🇷🇴',
  bg: '🇧🇬',
  tr: '🇹🇷',
};

export function getTranslation(locale: Locale): Translation {
  return translations[locale] || translations.en;
}
