"use client";

import { useState, useEffect, useCallback } from 'react';

export interface ReadingPreferences {
  // Typography
  fontSize: number;
  lineHeight: number;
  fontFamily: 'sans' | 'serif' | 'mono';
  textAlign: 'left' | 'center' | 'justify';

  // Theme
  theme: 'light' | 'dark' | 'sepia';
  highContrast: boolean;

  // Reading mode
  mode: 'standard' | 'focus' | 'magazine' | 'timeline' | 'presentation' | 'immersive' | 'book';

  // Accessibility
  reducedMotion: boolean;
  dyslexicFont: boolean;
  readingGuide: boolean;

  // Content
  showImages: boolean;
  autoPlayVideos: boolean;
}

const DEFAULT_PREFERENCES: ReadingPreferences = {
  fontSize: 16,
  lineHeight: 1.6,
  fontFamily: 'sans',
  textAlign: 'left',
  theme: 'light',
  highContrast: false,
  mode: 'standard',
  reducedMotion: false,
  dyslexicFont: false,
  readingGuide: false,
  showImages: true,
  autoPlayVideos: false,
};

const STORAGE_KEY = 'reading-preferences';

/**
 * Hook for managing user reading preferences
 * Persists preferences to localStorage and syncs across tabs
 */
export function useReadingPreferences() {
  const [preferences, setPreferences] = useState<ReadingPreferences>(DEFAULT_PREFERENCES);
  const [mounted, setMounted] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    setMounted(true);

    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ReadingPreferences>;
        setPreferences((prev) => ({ ...prev, ...parsed }));
      }

      // Check for system preferences
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      setPreferences((prev) => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
        theme: prefersDark ? 'dark' : prev.theme,
      }));
    } catch (error) {
      console.error('Failed to load reading preferences:', error);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save reading preferences:', error);
    }
  }, [preferences, mounted]);

  // Listen for storage events to sync across tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as ReadingPreferences;
          setPreferences(parsed);
        } catch (error) {
          console.error('Failed to parse storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update individual preference
  const updatePreference = useCallback(
    <K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Update multiple preferences at once
  const updatePreferences = useCallback((updates: Partial<ReadingPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  }, []);

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  // Get CSS variables for current preferences
  const getCSSVariables = useCallback((): Record<string, string> => {
    const fontFamilies = {
      sans: "'Inter', system-ui, -apple-system, sans-serif",
      serif: "'Merriweather', Georgia, serif",
      mono: "'JetBrains Mono', 'Courier New', monospace",
    };

    const themes = {
      light: {
        '--bg-primary': '#FFFFFF',
        '--bg-secondary': '#F7F9FC',
        '--text-primary': '#1A1A1A',
        '--text-secondary': '#6B7280',
      },
      dark: {
        '--bg-primary': '#0F0F0F',
        '--bg-secondary': '#1A1A1A',
        '--text-primary': '#F3F4F6',
        '--text-secondary': '#9CA3AF',
      },
      sepia: {
        '--bg-primary': '#F4ECD8',
        '--bg-secondary': '#E8DCC0',
        '--text-primary': '#3E2723',
        '--text-secondary': '#5D4037',
      },
    };

    return {
      '--font-size': `${preferences.fontSize}px`,
      '--line-height': `${preferences.lineHeight}`,
      '--font-family': fontFamilies[preferences.fontFamily],
      '--text-align': preferences.textAlign,
      ...themes[preferences.theme],
    };
  }, [preferences]);

  // Apply preferences to document
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const root = document.documentElement;
    const cssVars = getCSSVariables();

    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Apply high contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply dyslexic font
    if (preferences.dyslexicFont) {
      root.classList.add('dyslexic-font');
    } else {
      root.classList.remove('dyslexic-font');
    }
  }, [preferences, getCSSVariables, mounted]);

  return {
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
    getCSSVariables,
    mounted,
  };
}

/**
 * Hook for font size controls
 */
export function useFontSizeControls(
  currentSize: number,
  onChange: (size: number) => void,
  min = 12,
  max = 28
) {
  const increase = useCallback(() => {
    onChange(Math.min(currentSize + 2, max));
  }, [currentSize, max, onChange]);

  const decrease = useCallback(() => {
    onChange(Math.max(currentSize - 2, min));
  }, [currentSize, min, onChange]);

  const reset = useCallback(() => {
    onChange(16);
  }, [onChange]);

  return {
    increase,
    decrease,
    reset,
    canIncrease: currentSize < max,
    canDecrease: currentSize > min,
  };
}
