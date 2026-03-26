import { create } from 'zustand';

export type Locale = 'ru' | 'kk' | 'en';

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const getInitialLocale = (): Locale => {
  const saved = localStorage.getItem('locale');
  if (saved === 'ru' || saved === 'kk' || saved === 'en') {
    return saved;
  }
  return 'ru'; // default
};

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: getInitialLocale(),
  
  setLocale: (locale: Locale) => {
    localStorage.setItem('locale', locale);
    set({ locale });
  },
}));

