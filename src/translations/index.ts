import { ru } from './ru';
import { kk } from './kk';
import { en } from './en';
import type { Locale } from '../store/useLanguageStore';

export const translations = {
  ru,
  kk,
  en,
};

export const getTranslation = (locale: Locale) => translations[locale];

