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
  // Always explicitly add or remove dark class based on theme
  if (theme === "dark") {
    root.classList.remove("light");
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
  }
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // IMPORTANT: Always initialize with "light" to match server render
  // The blocking script in layout.tsx handles the visual theme before hydration
  // We sync the state from localStorage in useEffect to avoid hydration mismatch
  const [theme, setThemeState] = useState<Theme>("light");

  // Apply light theme immediately on mount, then sync from localStorage
  useEffect(() => {
    // First ensure light theme is applied (matching server render)
    applyThemeClass("light");

    // Then check localStorage for saved preference
    try {
      const saved = localStorage.getItem("theme") as Theme | null;
      if (saved === "dark") {
        setThemeState("dark");
        applyThemeClass("dark");
      } else if (saved === "light" || !saved) {
        // Explicitly set light mode if saved or if no preference
        setThemeState("light");
        applyThemeClass("light");
        // Save light as default if not set
        if (!saved) {
          localStorage.setItem("theme", "light");
        }
      }
    } catch {
      // localStorage not available - stay with light theme
      applyThemeClass("light");
    }
  }, []);

  // Apply theme class whenever theme state changes
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
