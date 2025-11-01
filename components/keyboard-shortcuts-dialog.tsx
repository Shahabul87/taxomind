"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard, X } from 'lucide-react';
import { formatShortcut, KeyboardShortcut } from '@/hooks/use-keyboard-shortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: KeyboardShortcut[];
}

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
  shortcuts,
}: KeyboardShortcutsDialogProps) {
  // Group shortcuts by category
  const groupedShortcuts: ShortcutGroup[] = React.useMemo(() => {
    const groups: Record<string, Array<{ keys: string; description: string }>> = {
      Navigation: [],
      'Reading Mode': [],
      Actions: [],
      Other: [],
    };

    shortcuts.forEach((shortcut) => {
      const formatted = formatShortcut(shortcut);
      const item = { keys: formatted, description: shortcut.description };

      if (
        shortcut.description.toLowerCase().includes('next') ||
        shortcut.description.toLowerCase().includes('previous') ||
        shortcut.description.toLowerCase().includes('scroll')
      ) {
        groups.Navigation.push(item);
      } else if (
        shortcut.description.toLowerCase().includes('mode') ||
        shortcut.description.toLowerCase().includes('view')
      ) {
        groups['Reading Mode'].push(item);
      } else if (
        shortcut.description.toLowerCase().includes('bookmark') ||
        shortcut.description.toLowerCase().includes('share') ||
        shortcut.description.toLowerCase().includes('print')
      ) {
        groups.Actions.push(item);
      } else {
        groups.Other.push(item);
      }
    });

    return Object.entries(groups)
      .filter(([, items]) => items.length > 0)
      .map(([title, shortcuts]) => ({ title, shortcuts }));
  }, [shortcuts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Keyboard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and interact with the post efficiently
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {groupedShortcuts.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-600 dark:bg-purple-400 rounded-full" />
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <kbd className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Press <kbd className="px-2 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">?</kbd> to toggle this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact floating keyboard shortcuts indicator
 */
interface KeyboardShortcutsIndicatorProps {
  onClick: () => void;
}

export function KeyboardShortcutsIndicator({ onClick }: KeyboardShortcutsIndicatorProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center group hover:shadow-xl transition-all duration-200"
      aria-label="Show keyboard shortcuts"
    >
      <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 right-0 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        Keyboard Shortcuts
        <div className="absolute top-full right-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 -mt-1" />
      </div>
    </motion.button>
  );
}
