"use client";

import { useState, useCallback, useRef } from "react";
import type { LineRange, UseLineSelectionReturn } from "../code-explanation.types";
import { normalizeRange } from "../code-explanation.types";

/**
 * Hook for managing line selection in Monaco Editor
 * Supports click-to-select and drag-to-select-range functionality
 */
export function useLineSelection(): UseLineSelectionReturn {
  const [selectedRange, setSelectedRange] = useState<LineRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Track selection start for drag operations
  const selectionStartRef = useRef<number | null>(null);

  /**
   * Start a new selection from a line number
   * Called when user clicks on a line number in the gutter
   */
  const startSelection = useCallback((lineNumber: number) => {
    selectionStartRef.current = lineNumber;
    setIsSelecting(true);
    setSelectedRange({ start: lineNumber, end: lineNumber });
  }, []);

  /**
   * Extend the current selection to include a new line
   * Called during drag operations when mouse moves over new lines
   */
  const extendSelection = useCallback((lineNumber: number) => {
    if (!isSelecting || selectionStartRef.current === null) return;

    setSelectedRange(
      normalizeRange({
        start: selectionStartRef.current,
        end: lineNumber,
      })
    );
  }, [isSelecting]);

  /**
   * End the current selection
   * Called when user releases mouse button
   */
  const endSelection = useCallback(() => {
    setIsSelecting(false);
    selectionStartRef.current = null;
  }, []);

  /**
   * Clear the current selection
   */
  const clearSelection = useCallback(() => {
    setSelectedRange(null);
    setIsSelecting(false);
    selectionStartRef.current = null;
  }, []);

  /**
   * Set a specific selection range programmatically
   * Useful for highlighting lines when hovering over explanations
   */
  const setSelection = useCallback((range: LineRange) => {
    setSelectedRange(normalizeRange(range));
  }, []);

  return {
    selectedRange,
    isSelecting,
    startSelection,
    extendSelection,
    endSelection,
    clearSelection,
    setSelection,
  };
}
