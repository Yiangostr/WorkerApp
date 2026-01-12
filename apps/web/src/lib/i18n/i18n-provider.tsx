'use client';

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { getLocaleFromNavigator, type Locale, LOCALES, DEFAULT_LOCALE } from './locales';
import { getMessages, type Messages } from './messages';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'worker-app-locale';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LOCALES.includes(stored as Locale)) {
      setLocaleState(stored as Locale);
    } else {
      setLocaleState(getLocaleFromNavigator());
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  };

  const messages = useMemo(() => getMessages(locale), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, messages }),
    [locale, messages]
  );

  // Avoid hydration mismatch by rendering children only after mount
  if (!mounted) {
    return (
      <I18nContext.Provider value={{ locale: DEFAULT_LOCALE, setLocale: () => {}, messages: getMessages(DEFAULT_LOCALE) }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useMessages<K extends keyof Messages>(namespace: K): Messages[K] {
  const { messages } = useI18n();
  return messages[namespace];
}
