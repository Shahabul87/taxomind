/**
 * useKeyboardNav Hook
 * Handles keyboard navigation for lists and grids
 * Supports Arrow Up/Down, Home, End keys
 */

import { useState, useCallback } from 'react';
import type { UseKeyboardNavReturn } from '../types/mega-menu-types';

interface UseKeyboardNavOptions {
  /** Total number of items */
  itemCount: number;

  /** Loop to beginning/end when reaching limits */
  loop?: boolean;

  /** Callback when item is selected (Enter key) */
  onSelect?: (index: number) => void;

  /** Callback when focus changes */
  onFocusChange?: (index: number) => void;
}

export const useKeyboardNav = ({
  itemCount,
  loop = true,
  onSelect,
  onFocusChange,
}: UseKeyboardNavOptions): UseKeyboardNavReturn => {
  const [focusIndex, setFocusIndex] = useState(0);

  // Focus next item
  const focusNext = useCallback(() => {
    setFocusIndex((prev) => {
      const next = prev + 1;
      if (next >= itemCount) {
        return loop ? 0 : prev;
      }
      onFocusChange?.(next);
      return next;
    });
  }, [itemCount, loop, onFocusChange]);

  // Focus previous item
  const focusPrevious = useCallback(() => {
    setFocusIndex((prev) => {
      const previous = prev - 1;
      if (previous < 0) {
        return loop ? itemCount - 1 : prev;
      }
      onFocusChange?.(previous);
      return previous;
    });
  }, [itemCount, loop, onFocusChange]);

  // Reset focus to first item
  const resetFocus = useCallback(() => {
    setFocusIndex(0);
    onFocusChange?.(0);
  }, [onFocusChange]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusNext();
        break;

      case 'ArrowUp':
        event.preventDefault();
        focusPrevious();
        break;

      case 'Home':
        event.preventDefault();
        setFocusIndex(0);
        onFocusChange?.(0);
        break;

      case 'End':
        event.preventDefault();
        setFocusIndex(itemCount - 1);
        onFocusChange?.(itemCount - 1);
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect?.(focusIndex);
        break;

      default:
        break;
    }
  }, [focusIndex, focusNext, focusPrevious, itemCount, onSelect, onFocusChange]);

  return {
    focusIndex,
    setFocusIndex: useCallback((index: number) => {
      if (index >= 0 && index < itemCount) {
        setFocusIndex(index);
        onFocusChange?.(index);
      }
    }, [itemCount, onFocusChange]),
    focusNext,
    focusPrevious,
    resetFocus,
    handleKeyDown,
  };
};
