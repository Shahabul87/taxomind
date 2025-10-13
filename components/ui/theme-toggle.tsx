"use client";

import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/providers/theme-provider";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render the icon after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      onClick={toggleTheme}
      className={[
        "group relative inline-flex items-center justify-center",
        "p-1.5 sm:p-2 rounded-lg",
        // Light defaults
        "bg-white/70 hover:bg-white/90 border border-slate-200 text-slate-700",
        // Dark overrides
        "dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-gray-200 dark:border-slate-700",
        "transition-colors"
      ].join(" ")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      suppressHydrationWarning
    >
      {!mounted ? (
        // Render a placeholder during SSR/initial hydration to match server HTML
        <div className="w-4 h-4 sm:w-5 sm:h-5" />
      ) : (
        <motion.div
          initial={{ rotate: 0, scale: 1 }}
          animate={{ rotate: isDark ? 40 : 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </motion.div>
      )}
    </button>
  );
}
