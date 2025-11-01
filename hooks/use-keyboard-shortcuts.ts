/**
 * Keyboard Shortcuts Hook
 * Enterprise-grade keyboard navigation and shortcuts
 */

import { useEffect, useCallback, useRef } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  handler: () => void;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  /** Element to attach listeners to. Defaults to document */
  target?: HTMLElement | null;
}

/**
 * Hook for managing keyboard shortcuts
 *
 * @example
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: 'e', ctrl: true, description: 'Export', handler: handleExport },
 *     { key: 'Delete', description: 'Delete selected', handler: handleDelete }
 *   ]
 * });
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  target = null,
}: UseKeyboardShortcutsOptions): void {
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when they change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    const isInputField =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable;

    // Allow some shortcuts in input fields (like Escape)
    const allowedInInput = ["Escape", "F1", "F2", "F3", "F4", "F5"];

    if (isInputField && !allowedInInput.includes(event.key)) {
      return;
    }

    // Find matching shortcut
    for (const shortcut of shortcutsRef.current) {
      const keyMatches = event.key === shortcut.key || event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatches = shortcut.alt ? event.altKey : !event.altKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler();
        break;
      }
    }
  }, [enabled]);

  useEffect(() => {
    const element = target || document;

    element.addEventListener("keydown", handleKeyDown as EventListener);

    return () => {
      element.removeEventListener("keydown", handleKeyDown as EventListener);
    };
  }, [handleKeyDown, target]);
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) {
    parts.push(isMac() ? "⌘" : "Ctrl");
  }
  if (shortcut.shift) {
    parts.push(isMac() ? "⇧" : "Shift");
  }
  if (shortcut.alt) {
    parts.push(isMac() ? "⌥" : "Alt");
  }

  // Format key name
  let keyName = shortcut.key;
  const keyMap: Record<string, string> = {
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Escape: "Esc",
    Delete: "Del",
  };

  if (keyMap[keyName]) {
    keyName = keyMap[keyName];
  } else if (keyName.length === 1) {
    keyName = keyName.toUpperCase();
  }

  parts.push(keyName);

  return parts.join(" + ");
}

/**
 * Check if user is on Mac
 */
function isMac(): boolean {
  return typeof window !== "undefined" && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
}

/**
 * Default keyboard shortcuts for common actions
 */
export const DEFAULT_SHORTCUTS = {
  SELECT_ALL: { key: "a", ctrl: true, description: "Select all" },
  DESELECT_ALL: { key: "d", ctrl: true, description: "Deselect all" },
  EXPORT: { key: "e", ctrl: true, description: "Export" },
  DELETE: { key: "Delete", description: "Delete selected" },
  SEARCH: { key: "f", ctrl: true, description: "Focus search" },
  REFRESH: { key: "r", ctrl: true, description: "Refresh" },
  HELP: { key: "?", shift: true, description: "Show shortcuts" },
  ESCAPE: { key: "Escape", description: "Cancel/Close" },
} as const;
