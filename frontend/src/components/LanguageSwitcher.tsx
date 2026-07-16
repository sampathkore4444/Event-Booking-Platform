import React from 'react';
import { setLanguage, getLanguage, languageNames } from '../i18n';
import type { Language } from '../i18n';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const [currentLang, setCurrentLang] = React.useState<Language>(getLanguage());
  const [isOpen, setIsOpen] = React.useState(false);

  const handleChange = (lang: Language) => {
    setLanguage(lang);
    setCurrentLang(lang);
    setIsOpen(false);
    // Force re-render by updating state
    window.dispatchEvent(new CustomEvent('language-changed', { detail: lang }));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
      >
        <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-gray-600 dark:text-gray-300 font-medium">{languageNames[currentLang]}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-1 z-20 animate-scale-in">
            {(Object.entries(languageNames) as [Language, string][]).map(([code, name]) => (
              <button
                key={code}
                onClick={() => handleChange(code)}
                className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 ${
                  currentLang === code ? 'text-brand-600 dark:text-brand-400 font-medium bg-brand-50 dark:bg-brand-500/20' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${currentLang === code ? 'bg-brand-500' : 'bg-gray-200'}`} />
                {name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
