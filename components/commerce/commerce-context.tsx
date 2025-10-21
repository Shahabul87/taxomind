"use client";

import React from 'react';

type CommerceState = {
  currency: string;
  locale: string;
  setCurrency: (c: string) => void;
  setLocale: (l: string) => void;
};

const CommerceContext = React.createContext<CommerceState | null>(null);

function detectLocale(): string {
  if (typeof Intl !== 'undefined') {
    try {
      return Intl.NumberFormat().resolvedOptions().locale || 'en-US';
    } catch {}
  }
  if (typeof navigator !== 'undefined') return navigator.language || 'en-US';
  return 'en-US';
}

function loadPersisted(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export const CommerceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = React.useState<string>(() => loadPersisted('commerce:currency') || 'USD');
  const [locale, setLocale] = React.useState<string>(() => loadPersisted('commerce:locale') || detectLocale());

  React.useEffect(() => {
    try { localStorage.setItem('commerce:currency', currency); } catch {}
  }, [currency]);

  React.useEffect(() => {
    try { localStorage.setItem('commerce:locale', locale); } catch {}
  }, [locale]);

  const value = React.useMemo(() => ({ currency, locale, setCurrency, setLocale }), [currency, locale]);
  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
};

export function useCommerce(): CommerceState {
  const ctx = React.useContext(CommerceContext);
  if (!ctx) {
    // Provide sensible defaults outside provider usage
    return {
      currency: 'USD',
      locale: detectLocale(),
      setCurrency: () => {},
      setLocale: () => {},
    };
  }
  return ctx;
}

