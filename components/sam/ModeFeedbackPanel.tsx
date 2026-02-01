'use client';

/**
 * Mode Feedback Panel
 *
 * Collects mode effectiveness feedback when a user switches modes
 * or clears a conversation (if 3+ messages were exchanged).
 *
 * Four rating options: Effective, Somewhat, Not effective, Wrong mode.
 * When "Wrong mode" is selected, shows an alternative mode dropdown.
 */

import { useCallback, useState } from 'react';
import { X, ThumbsUp, ThumbsDown, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllModes } from '@/lib/sam/modes';
import type { SAMModeId } from '@/lib/sam/modes';

// =============================================================================
// TYPES
// =============================================================================

type ModeFeedbackRating = 'EFFECTIVE' | 'SOMEWHAT' | 'NOT_EFFECTIVE' | 'WRONG_MODE';

interface ModeFeedbackPanelProps {
  modeId: string;
  modeLabel: string;
  sessionId?: string;
  onSubmit: (feedback: {
    modeId: string;
    rating: ModeFeedbackRating;
    suggestion?: string;
    comment?: string;
  }) => void;
  onDismiss: () => void;
}

// =============================================================================
// RATING OPTIONS
// =============================================================================

const RATING_OPTIONS: Array<{
  value: ModeFeedbackRating;
  label: string;
  icon: typeof ThumbsUp;
  color: string;
}> = [
  { value: 'EFFECTIVE', label: 'Effective', icon: ThumbsUp, color: 'text-emerald-500' },
  { value: 'SOMEWHAT', label: 'Somewhat', icon: ThumbsUp, color: 'text-amber-500' },
  { value: 'NOT_EFFECTIVE', label: 'Not effective', icon: ThumbsDown, color: 'text-red-400' },
  { value: 'WRONG_MODE', label: 'Wrong mode', icon: AlertCircle, color: 'text-gray-400' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function ModeFeedbackPanel({
  modeId,
  modeLabel,
  onSubmit,
  onDismiss,
}: ModeFeedbackPanelProps) {
  const [selectedRating, setSelectedRating] = useState<ModeFeedbackRating | null>(null);
  const [suggestedMode, setSuggestedMode] = useState<string>('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const allModes = getAllModes().filter((m) => m.id !== modeId);

  const handleSubmit = useCallback(() => {
    if (!selectedRating) return;
    setSubmitted(true);

    onSubmit({
      modeId,
      rating: selectedRating,
      suggestion: selectedRating === 'WRONG_MODE' && suggestedMode ? suggestedMode : undefined,
      comment: comment.trim() || undefined,
    });

    // Auto-dismiss after showing confirmation
    setTimeout(onDismiss, 1500);
  }, [selectedRating, modeId, suggestedMode, comment, onSubmit, onDismiss]);

  if (submitted) {
    return (
      <div className="px-4 py-3 border-t border-[var(--sam-border)] bg-[var(--sam-surface)]">
        <p className="text-xs text-[var(--sam-text-secondary)] text-center">
          Thanks for your feedback!
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-[var(--sam-border)] bg-[var(--sam-surface)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--sam-text)]">
          How was <strong>{modeLabel}</strong> mode?
        </span>
        <button
          onClick={onDismiss}
          className="text-[var(--sam-text-muted)] hover:text-[var(--sam-text)] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Rating options */}
      <div className="flex gap-1.5 mb-2">
        {RATING_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedRating === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setSelectedRating(opt.value)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-all',
                'border',
                isSelected
                  ? 'border-[var(--sam-accent)] bg-[var(--sam-accent)]/10 text-[var(--sam-accent)]'
                  : 'border-[var(--sam-border)] text-[var(--sam-text-secondary)] hover:border-[var(--sam-accent)]/30',
              )}
            >
              <Icon className={cn('h-3 w-3', isSelected ? 'text-[var(--sam-accent)]' : opt.color)} />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Wrong mode → alternative selector */}
      {selectedRating === 'WRONG_MODE' && (
        <div className="mb-2">
          <label className="text-[10px] text-[var(--sam-text-muted)] mb-1 block">
            Which mode would have been better?
          </label>
          <select
            value={suggestedMode}
            onChange={(e) => setSuggestedMode(e.target.value)}
            className={cn(
              'w-full px-2 py-1 rounded text-xs',
              'bg-[var(--sam-surface)] border border-[var(--sam-border)]',
              'text-[var(--sam-text)]',
              'focus:outline-none focus:border-[var(--sam-accent)]',
            )}
          >
            <option value="">Select a mode...</option>
            {allModes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Comment */}
      {selectedRating && (
        <div className="mb-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 200))}
            placeholder="Optional comment..."
            maxLength={200}
            rows={2}
            className={cn(
              'w-full px-2 py-1 rounded text-xs resize-none',
              'bg-[var(--sam-surface)] border border-[var(--sam-border)]',
              'text-[var(--sam-text)] placeholder:text-[var(--sam-text-muted)]',
              'focus:outline-none focus:border-[var(--sam-accent)]',
            )}
          />
          <div className="text-right text-[9px] text-[var(--sam-text-muted)]">
            {comment.length}/200
          </div>
        </div>
      )}

      {/* Submit */}
      {selectedRating && (
        <button
          onClick={handleSubmit}
          className={cn(
            'w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-medium',
            'bg-[var(--sam-accent)] text-white',
            'hover:opacity-90 transition-opacity',
          )}
        >
          Submit Feedback
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
