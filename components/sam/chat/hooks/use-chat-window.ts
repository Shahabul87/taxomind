import { useCallback, useEffect, useState } from 'react';
import type { WindowState, ThemeMode } from '../types';

interface UseChatWindowReturn {
  windowState: WindowState;
  theme: ThemeMode;
  /** Resolved to 'light' | 'dark' (system preference resolved). Use for data-sam-theme. */
  resolvedTheme: 'light' | 'dark';
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  setWindowState: (state: WindowState) => void;
  toggleTheme: () => void;
  open: () => void;
  close: () => void;
  minimize: () => void;
  maximize: () => void;
  restore: () => void;
  toggle: () => void;
}

export function useChatWindow(): UseChatWindowReturn {
  const [windowState, setWindowState] = useState<WindowState>('closed');
  const [theme, setTheme] = useState<ThemeMode>('light');

  const isOpen = windowState === 'open' || windowState === 'maximized';
  const isMinimized = windowState === 'minimized';
  const isMaximized = windowState === 'maximized';

  // Resolve effective theme for SAM (light/dark) without touching host DOM
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme !== 'system') {
      setResolvedTheme(theme);
      return;
    }

    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const resolve = () => setResolvedTheme(mql.matches ? 'dark' : 'light');

    resolve();
    mql.addEventListener('change', resolve);
    return () => mql.removeEventListener('change', resolve);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  }, []);

  const open = useCallback(() => setWindowState('open'), []);
  const close = useCallback(() => setWindowState('closed'), []);
  const minimize = useCallback(() => setWindowState('minimized'), []);
  const maximize = useCallback(() => {
    setWindowState((prev) => (prev === 'maximized' ? 'open' : 'maximized'));
  }, []);
  const restore = useCallback(() => setWindowState('open'), []);
  const toggle = useCallback(() => {
    setWindowState((prev) => (prev === 'closed' ? 'open' : 'closed'));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (e: KeyboardEvent) => {
      // Escape to minimize when open
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        minimize();
      }
      // Ctrl+Shift+S to toggle
      if (e.key === 'S' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, minimize, toggle]);

  return {
    windowState,
    theme,
    resolvedTheme,
    isOpen,
    isMinimized,
    isMaximized,
    setWindowState,
    toggleTheme,
    open,
    close,
    minimize,
    maximize,
    restore,
    toggle,
  };
}
