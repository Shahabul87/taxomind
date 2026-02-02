'use client';

/**
 * Mode Preferences Hook
 *
 * Tracks recently used modes and favorites in localStorage.
 * Provides sorted mode lists for the dropdown UI.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SAMModeId } from '@/lib/sam/modes';

const RECENT_KEY = 'sam-recent-modes';
const FAVORITES_KEY = 'sam-favorite-modes';
const MAX_RECENT = 5;

interface ModePreferences {
  recentModes: SAMModeId[];
  favoriteModes: Set<SAMModeId>;
  recordModeUsage: (modeId: SAMModeId) => void;
  toggleFavorite: (modeId: SAMModeId) => void;
  isFavorite: (modeId: SAMModeId) => boolean;
}

export function useModePreferences(): ModePreferences {
  const [recentModes, setRecentModes] = useState<SAMModeId[]>([]);
  const [favoriteModes, setFavoriteModes] = useState<Set<SAMModeId>>(new Set());
  const initializedRef = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined' || initializedRef.current) return;
    initializedRef.current = true;

    try {
      const storedRecent = localStorage.getItem(RECENT_KEY);
      if (storedRecent) {
        const parsed = JSON.parse(storedRecent) as SAMModeId[];
        if (Array.isArray(parsed)) {
          setRecentModes(parsed.slice(0, MAX_RECENT));
        }
      }
    } catch {
      // Ignore parse errors
    }

    try {
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      if (storedFavorites) {
        const parsed = JSON.parse(storedFavorites) as SAMModeId[];
        if (Array.isArray(parsed)) {
          setFavoriteModes(new Set(parsed));
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const recordModeUsage = useCallback((modeId: SAMModeId) => {
    setRecentModes((prev) => {
      const updated = [modeId, ...prev.filter((m) => m !== modeId)].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, []);

  const toggleFavorite = useCallback((modeId: SAMModeId) => {
    setFavoriteModes((prev) => {
      const next = new Set(prev);
      if (next.has(modeId)) {
        next.delete(modeId);
      } else {
        next.add(modeId);
      }
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (modeId: SAMModeId) => favoriteModes.has(modeId),
    [favoriteModes],
  );

  return {
    recentModes,
    favoriteModes,
    recordModeUsage,
    toggleFavorite,
    isFavorite,
  };
}
