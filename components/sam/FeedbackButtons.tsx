'use client';

import React, { useState, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export type FeedbackRating = 'helpful' | 'not_helpful';

export interface FeedbackButtonsProps {
  /** Unique identifier for the message being rated */
  messageId: string;
  /** Session ID for the current SAM conversation */
  sessionId: string;
  /** Optional callback when feedback is submitted successfully */
  onFeedbackSubmitted?: (rating: FeedbackRating) => void;
  /** Optional CSS class name for the container */
  className?: string;
  /** Size variant for the buttons */
  size?: 'sm' | 'default';
  /** Whether to show labels alongside icons */
  showLabels?: boolean;
}

interface FeedbackState {
  submitted: FeedbackRating | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// API CALL
// ============================================================================

async function submitFeedback(
  messageId: string,
  sessionId: string,
  rating: FeedbackRating,
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/sam/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messageId,
        sessionId,
        rating,
        comment,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message ?? 'Failed to submit feedback',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FeedbackButtons({
  messageId,
  sessionId,
  onFeedbackSubmitted,
  className,
  size = 'sm',
  showLabels = false,
}: FeedbackButtonsProps) {
  const [state, setState] = useState<FeedbackState>({
    submitted: null,
    isLoading: false,
    error: null,
  });

  const handleFeedback = useCallback(
    async (rating: FeedbackRating) => {
      // Prevent duplicate submissions
      if (state.submitted !== null || state.isLoading) {
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await submitFeedback(messageId, sessionId, rating);

      if (result.success) {
        setState({
          submitted: rating,
          isLoading: false,
          error: null,
        });

        toast.success(
          rating === 'helpful'
            ? 'Thanks for the feedback!'
            : "Thanks! We'll work on improving.",
          {
            duration: 2000,
            position: 'bottom-center',
          }
        );

        onFeedbackSubmitted?.(rating);
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error ?? 'Failed to submit',
        }));

        toast.error('Could not submit feedback. Please try again.', {
          duration: 3000,
          position: 'bottom-center',
        });
      }
    },
    [messageId, sessionId, state.submitted, state.isLoading, onFeedbackSubmitted]
  );

  // If already submitted, show confirmation
  if (state.submitted !== null) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400',
          className
        )}
      >
        <Check className="h-3 w-3 text-green-500" />
        <span>Feedback recorded</span>
      </div>
    );
  }

  const buttonSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Helpful Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleFeedback('helpful')}
        disabled={state.isLoading}
        className={cn(
          buttonSize,
          'rounded-md transition-colors',
          'text-gray-400 hover:text-green-600 hover:bg-green-50',
          'dark:text-gray-500 dark:hover:text-green-400 dark:hover:bg-green-900/20'
        )}
        title="This was helpful"
        aria-label="Mark response as helpful"
      >
        {state.isLoading ? (
          <Loader2 className={cn(iconSize, 'animate-spin')} />
        ) : (
          <ThumbsUp className={iconSize} />
        )}
      </Button>

      {showLabels && (
        <span className="text-xs text-gray-400 dark:text-gray-500 sr-only sm:not-sr-only">
          Helpful?
        </span>
      )}

      {/* Not Helpful Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleFeedback('not_helpful')}
        disabled={state.isLoading}
        className={cn(
          buttonSize,
          'rounded-md transition-colors',
          'text-gray-400 hover:text-red-600 hover:bg-red-50',
          'dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-900/20'
        )}
        title="This was not helpful"
        aria-label="Mark response as not helpful"
      >
        {state.isLoading ? (
          <Loader2 className={cn(iconSize, 'animate-spin')} />
        ) : (
          <ThumbsDown className={iconSize} />
        )}
      </Button>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FeedbackButtons;
