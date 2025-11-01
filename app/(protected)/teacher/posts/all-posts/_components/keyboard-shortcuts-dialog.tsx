"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeyboardShortcut, formatShortcut } from "@/hooks/use-keyboard-shortcuts";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: KeyboardShortcut[];
}

export const KeyboardShortcutsDialog = ({
  open,
  onOpenChange,
  shortcuts,
}: KeyboardShortcutsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and manage your posts more efficiently
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Group shortcuts by category */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Selection
            </h3>
            <div className="space-y-2">
              {shortcuts
                .filter((s) => s.description.toLowerCase().includes("select"))
                .map((shortcut, index) => (
                  <ShortcutRow key={index} shortcut={shortcut} />
                ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Actions
            </h3>
            <div className="space-y-2">
              {shortcuts
                .filter(
                  (s) =>
                    !s.description.toLowerCase().includes("select") &&
                    !s.description.toLowerCase().includes("navigation") &&
                    !s.description.toLowerCase().includes("search") &&
                    !s.description.toLowerCase().includes("help")
                )
                .map((shortcut, index) => (
                  <ShortcutRow key={index} shortcut={shortcut} />
                ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Navigation
            </h3>
            <div className="space-y-2">
              {shortcuts
                .filter(
                  (s) =>
                    s.description.toLowerCase().includes("search") ||
                    s.description.toLowerCase().includes("refresh") ||
                    s.description.toLowerCase().includes("cancel") ||
                    s.description.toLowerCase().includes("help")
                )
                .map((shortcut, index) => (
                  <ShortcutRow key={index} shortcut={shortcut} />
                ))}
            </div>
          </div>
        </div>

        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Tip:</strong> Keyboard shortcuts are disabled when typing in input fields
            (except for Escape and F-keys).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ShortcutRow = ({ shortcut }: { shortcut: KeyboardShortcut }) => {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {shortcut.description}
      </span>
      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
        {formatShortcut(shortcut)}
      </kbd>
    </div>
  );
};
