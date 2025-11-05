"use client";

import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/theme-provider";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Only render the icon after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={toggleTheme}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={[
          "group relative inline-flex items-center justify-center",
          "w-9 h-9 sm:w-10 sm:h-10 rounded-full",
          // Light defaults
          "bg-white/70 hover:bg-white/90 border border-slate-200 text-slate-700",
          // Dark overrides
          "dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-gray-200 dark:border-slate-700",
          "transition-all duration-200 hover:scale-110"
        ].join(" ")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
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

      {/* Tooltip */}
      <AnimatePresence>
        {mounted && showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded-lg shadow-lg whitespace-nowrap z-50"
          >
            {isDark ? "Light Mode" : "Dark Mode"}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
