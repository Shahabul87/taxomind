"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Keyboard,
  X,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  StickyNote,
  BookmarkPlus,
  Play,
  Pause,
  Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KeyboardShortcutsProps {
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  onToggleFocus?: () => void;
  onToggleNotes?: () => void;
  onToggleBookmark?: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  icon: React.ReactNode;
  category: "navigation" | "actions" | "media" | "view";
  action?: () => void;
}

export const KeyboardShortcuts = ({
  onNavigatePrev,
  onNavigateNext,
  onToggleFocus,
  onToggleNotes,
  onToggleBookmark
}: KeyboardShortcutsProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const shortcuts: Shortcut[] = [
    {
      keys: ["?"],
      description: "Show keyboard shortcuts",
      icon: <Keyboard className="w-4 h-4" />,
      category: "view",
      action: () => setIsVisible(!isVisible)
    },
    {
      keys: ["←", "P"],
      description: "Previous section",
      icon: <ArrowLeft className="w-4 h-4" />,
      category: "navigation",
      action: onNavigatePrev
    },
    {
      keys: ["→", "N"],
      description: "Next section",
      icon: <ArrowRight className="w-4 h-4" />,
      category: "navigation",
      action: onNavigateNext
    },
    {
      keys: ["F"],
      description: "Toggle focus mode",
      icon: <Maximize2 className="w-4 h-4" />,
      category: "view",
      action: onToggleFocus
    },
    {
      keys: ["T"],
      description: "Toggle notes panel",
      icon: <StickyNote className="w-4 h-4" />,
      category: "actions",
      action: onToggleNotes
    },
    {
      keys: ["B"],
      description: "Toggle bookmark",
      icon: <BookmarkPlus className="w-4 h-4" />,
      category: "actions",
      action: onToggleBookmark
    },
    {
      keys: ["Space"],
      description: "Play/Pause video",
      icon: <Play className="w-4 h-4" />,
      category: "media"
    },
    {
      keys: ["M"],
      description: "Mute/Unmute",
      icon: <Volume2 className="w-4 h-4" />,
      category: "media"
    },
    {
      keys: ["Cmd", "K"],
      description: "Quick search",
      icon: <Keyboard className="w-4 h-4" />,
      category: "actions"
    }
  ];

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Show/hide shortcuts overlay
      if (key === "?" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsVisible(!isVisible);
        return;
      }

      // Escape to close
      if (key === "escape" && isVisible) {
        setIsVisible(false);
        return;
      }

      // Execute shortcuts
      shortcuts.forEach(shortcut => {
        const mainKey = shortcut.keys[shortcut.keys.length - 1].toLowerCase();

        if (key === mainKey && shortcut.action) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isVisible, shortcuts]);

  // Hide hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "navigation": return "text-blue-600 dark:text-blue-400";
      case "actions": return "text-purple-600 dark:text-purple-400";
      case "media": return "text-green-600 dark:text-green-400";
      case "view": return "text-orange-600 dark:text-orange-400";
      default: return "text-slate-600 dark:text-slate-400";
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case "navigation": return "bg-blue-50 dark:bg-blue-900/20";
      case "actions": return "bg-purple-50 dark:bg-purple-900/20";
      case "media": return "bg-green-50 dark:bg-green-900/20";
      case "view": return "bg-orange-50 dark:bg-orange-900/20";
      default: return "bg-slate-50 dark:bg-slate-800";
    }
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <>
      {/* Floating hint */}
      <AnimatePresence>
        {showHint && !isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
          >
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-purple-200 dark:border-purple-800 shadow-2xl">
              <CardContent className="p-3 flex items-center gap-3">
                <Keyboard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Press <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border rounded text-xs font-mono">?</kbd> for keyboard shortcuts
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowHint(false)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortcuts overlay */}
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsVisible(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-3xl"
              >
                <Card className="bg-white dark:bg-slate-900">
                  <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                          <Keyboard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                            Master these shortcuts for faster learning
                          </p>
                        </div>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsVisible(false)}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                        <div key={category} className="space-y-3">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              getCategoryBg(category)
                            )} />
                            {category}
                          </h3>
                          <div className="space-y-2">
                            {categoryShortcuts.map((shortcut, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg transition-colors",
                                  getCategoryBg(category)
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn("flex-shrink-0", getCategoryColor(category))}>
                                    {shortcut.icon}
                                  </div>
                                  <span className="text-sm text-slate-700 dark:text-slate-300">
                                    {shortcut.description}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  {shortcut.keys.map((key, keyIdx) => (
                                    <kbd
                                      key={keyIdx}
                                      className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono shadow-sm"
                                    >
                                      {key}
                                    </kbd>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Tip: Press <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border rounded text-xs font-mono">ESC</kbd> to close this dialog
                        </p>
                        <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                          Power User Mode
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
