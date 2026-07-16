import { useState, useEffect, useCallback } from 'react';
import { t as translate, getLanguage, setLanguage, type Language } from '../i18n';

/**
 * Hook that returns the `t` translation function and re-renders the
 * calling component whenever the user switches language via LanguageSwitcher.
 *
 * Example:
 *   const { t, lang } = useTranslation();
 *   <h1>{t('hero.title')}</h1>
 */
export function useTranslation() {
  const [lang, setLang] = useState<Language>(getLanguage);

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('language-changed', handler);
    return () => window.removeEventListener('language-changed', handler);
  }, []);

  const changeLanguage = useCallback((newLang: Language) => {
    setLanguage(newLang);
    setLang(newLang);
    window.dispatchEvent(new CustomEvent('language-changed', { detail: newLang }));
  }, []);

  return {
    /** Translate a dot-path key to the current language */
    t: translate,
    /** Current language code */
    lang,
    /** Switch language (persists to localStorage & dispatches event) */
    changeLanguage,
  } as const;
}
