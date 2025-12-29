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
  // IMPORTANT: Always initialize with "light" to match server render
  // The blocking script in layout.tsx handles the visual theme before hydration
  // We sync the state from localStorage in useEffect to avoid hydration mismatch
  const [theme, setThemeState] = useState<Theme>("light");

  // Sync theme from localStorage after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme") as Theme | null;
      if (saved && (saved === "light" || saved === "dark")) {
        setThemeState(saved);
      }
    } catch {
      // localStorage not available
    }
  }, []);

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
