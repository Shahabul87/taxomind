"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize theme from localStorage/system preference immediately
  // This matches the blocking script in layout.tsx that sets the class before hydration
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return "light"; // SSR default
    try {
      const saved = localStorage.getItem("theme") as Theme | null;
      return saved ?? (getSystemPrefersDark() ? "dark" : "light");
    } catch {
      return "light";
    }
  };

  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Apply theme class on mount to ensure consistency
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const updateTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem("theme", t);
    } catch {}
    applyThemeClass(t);
  }, []);

  const toggleTheme = useCallback(() => {
    updateTheme(theme === "dark" ? "light" : "dark");
  }, [theme, updateTheme]);

  const value = useMemo<ThemeContextType>(() => ({ theme, isDark: theme === "dark", setTheme: updateTheme, toggleTheme }), [theme, updateTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
