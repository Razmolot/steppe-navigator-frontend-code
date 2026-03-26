import { useLanguageStore } from '../store/useLanguageStore';
import { getTranslation } from '../translations';

export const useTranslation = () => {
  const { locale, setLocale } = useLanguageStore();
  const t = getTranslation(locale);

  return {
    t,
    locale,
    setLocale,
  };
};

