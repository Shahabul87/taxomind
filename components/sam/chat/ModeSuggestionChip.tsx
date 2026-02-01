'use client';

/**
 * Mode Suggestion Chip
 *
 * Non-intrusive mode switch suggestion that appears below suggestion chips
 * when the intent classifier detects a better mode for the current query.
 * Auto-dismisses after 15 seconds.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SAMModeId } from '@/lib/sam/modes';

interface ModeSuggestionChipProps {
  suggestedMode: string | null;
  suggestedModeLabel?: string;
  reason?: string;
  onAccept: (modeId: SAMModeId) => void;
  onDismiss: () => void;
}

export function ModeSuggestionChip({
  suggestedMode,
  suggestedModeLabel,
  reason,
  onAccept,
  onDismiss,
}: ModeSuggestionChipProps) {
  const [visible, setVisible] = useState(false);
  const dismissedModesRef = useRef(new Set<string>());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show chip when a new suggestion arrives (if not previously dismissed)
  useEffect(() => {
    if (!suggestedMode || dismissedModesRef.current.has(suggestedMode)) {
      setVisible(false);
      return;
    }
    setVisible(true);

    // Auto-dismiss after 15 seconds
    timerRef.current = setTimeout(() => {
      setVisible(false);
      dismissedModesRef.current.add(suggestedMode);
      onDismiss();
    }, 15000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [suggestedMode, onDismiss]);

  const handleAccept = useCallback(() => {
    if (!suggestedMode) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
    onAccept(suggestedMode as SAMModeId);
  }, [suggestedMode, onAccept]);

  const handleDismiss = useCallback(() => {
    if (!suggestedMode) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    dismissedModesRef.current.add(suggestedMode);
    setVisible(false);
    onDismiss();
  }, [suggestedMode, onDismiss]);

  if (!visible || !suggestedMode) return null;

  return (
    <div className="px-4 py-1.5 border-t border-[var(--sam-border)]">
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs',
          'bg-[var(--sam-accent)]/5 border border-[var(--sam-accent)]/20',
        )}
      >
        <ArrowRight className="h-3 w-3 shrink-0 text-[var(--sam-accent)]" />
        <span className="text-[var(--sam-text-secondary)] flex-1 truncate">
          Switch to <strong className="text-[var(--sam-accent)]">{suggestedModeLabel ?? suggestedMode}</strong>
          {reason ? ` — ${reason}` : ''}?
        </span>
        <button
          onClick={handleAccept}
          className={cn(
            'px-2 py-0.5 rounded text-[10px] font-medium',
            'bg-[var(--sam-accent)] text-white',
            'hover:opacity-90 transition-opacity',
          )}
        >
          Switch
        </button>
        <button
          onClick={handleDismiss}
          className="text-[var(--sam-text-muted)] hover:text-[var(--sam-text)] transition-colors"
          title="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
