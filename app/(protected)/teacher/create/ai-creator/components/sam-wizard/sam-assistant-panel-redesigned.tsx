"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles, RefreshCw, ChevronRight, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SamSuggestion } from '../../types/sam-creator.types';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { SuggestionHistory } from './SuggestionHistory';

interface EnhancedSamSuggestion extends SamSuggestion {
  id?: string;
  timestamp?: number;
  context?: string;
}

interface SamAssistantPanelProps {
  suggestion: SamSuggestion | null;
  isLoading: boolean;
  onRefresh: () => void;
  onApplySuggestion?: () => void;
  className?: string;
}

const getSuggestionEmoji = (type: SamSuggestion['type']) => {
  switch (type) {
    case 'encouragement': return '💝';
    case 'warning': return '⚠️';
    case 'tip': return '💡';
    case 'validation': return '✅';
    default: return '🤖';
  }
};

const getSuggestionTitle = (type: SamSuggestion['type']) => {
  switch (type) {
    case 'encouragement': return 'Amazing progress!';
    case 'warning': return 'Quick heads up';
    case 'tip': return 'Pro tip for you';
    case 'validation': return 'Looks great!';
    default: return 'Sam suggests';
  }
};

const getSuggestionGradient = (type: SamSuggestion['type']) => {
  switch (type) {
    case 'encouragement':
      return 'from-pink-500/10 via-rose-500/10 to-red-500/10';
    case 'warning':
      return 'from-amber-500/10 via-yellow-500/10 to-orange-500/10';
    case 'tip':
      return 'from-blue-500/10 via-cyan-500/10 to-indigo-500/10';
    case 'validation':
      return 'from-emerald-500/10 via-green-500/10 to-teal-500/10';
    default:
      return 'from-indigo-500/10 via-purple-500/10 to-pink-500/10';
  }
};

export function SamAssistantPanelRedesigned({
  suggestion,
  isLoading,
  onRefresh,
  onApplySuggestion,
  className
}: SamAssistantPanelProps) {
  const [suggestionHistory, setSuggestionHistory] = useState<EnhancedSamSuggestion[]>([]);
  const [hasNewSuggestion, setHasNewSuggestion] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const prevSuggestionRef = useRef<SamSuggestion | null>(null);

  // Track suggestion history
  useEffect(() => {
    if (suggestion && suggestion !== prevSuggestionRef.current) {
      const enhancedSuggestion: EnhancedSamSuggestion = {
        ...suggestion,
        id: `suggestion-${Date.now()}`,
        timestamp: Date.now(),
      };

      setSuggestionHistory(prev => [enhancedSuggestion, ...prev].slice(0, 10));
      setHasNewSuggestion(true);
      setIsAnimatingIn(true);

      // Animate in
      setTimeout(() => setIsAnimatingIn(false), 500);

      // Clear notification after 3 seconds
      setTimeout(() => setHasNewSuggestion(false), 3000);

      prevSuggestionRef.current = suggestion;
    }
  }, [suggestion]);

  // Loading State
  if (isLoading) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden',
          'bg-gradient-to-br from-indigo-50 to-purple-50',
          'dark:from-indigo-950/30 dark:to-purple-950/30',
          'border-2 border-indigo-200 dark:border-indigo-800',
          'shadow-lg',
          className
        )}
      >
        <div className="p-6">
          {/* Loading Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Bot className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white animate-spin" />
              </div>
            </div>

            <div className="flex-1">
              <h4 className="font-bold text-base bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Sam is thinking...
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Analyzing your course content...
                </span>
              </div>
            </div>
          </div>

          {/* Loading Skeleton */}
          <div className="space-y-3">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-5/6" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-4/6" />
          </div>
        </div>
      </Card>
    );
  }

  // No Suggestion State
  if (!suggestion) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden',
          'bg-white dark:bg-slate-900',
          'border-2 border-slate-200 dark:border-slate-800',
          'shadow-md',
          className
        )}
      >
        <div className="p-6">
          {/* Idle Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-md">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  SAM AI Assistant
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Ready to help with your course
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-9 w-9 p-0 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
              aria-label="Get suggestion from SAM"
            >
              <Zap className="h-4 w-4" />
            </Button>
          </div>

          {/* Call to Action */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-2">
                  Get personalized suggestions to improve your course
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Click the ⚡ button to get AI-powered recommendations based on your current progress.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Active Suggestion State
  const gradientClass = getSuggestionGradient(suggestion.type);

  return (
    <div className={cn('space-y-4', className)}>
      <Card
        className={cn(
          'relative overflow-hidden',
          'bg-white dark:bg-slate-900',
          'border-2 border-slate-200 dark:border-slate-800',
          'shadow-lg hover:shadow-xl',
          'transition-all duration-300',
          isAnimatingIn && 'animate-in slide-in-from-top-4 fade-in-0 duration-500',
          className
        )}
      >
        {/* New Suggestion Notification Pulse */}
        {hasNewSuggestion && (
          <div className="absolute -top-1 -right-1 z-10">
            <div className="relative">
              <div className="w-4 h-4 bg-pink-500 rounded-full animate-ping" />
              <div className="absolute inset-0 w-4 h-4 bg-pink-500 rounded-full" />
            </div>
          </div>
        )}

        {/* Gradient Background Accent */}
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', gradientClass)} aria-hidden="true" />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3 flex-1">
              {/* Avatar with Confidence Indicator */}
              <div className="relative flex-shrink-0">
                <ConfidenceIndicator
                  confidence={suggestion.confidence}
                  size="md"
                  showLabel={false}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                    <span className="text-xl" aria-hidden="true">
                      {getSuggestionEmoji(suggestion.type)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & Type */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
                  {getSuggestionTitle(suggestion.type)}
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 capitalize">
                    {suggestion.type}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Just now
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Get new suggestion"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              </Button>
            </div>
          </div>

          {/* Message */}
          <div className="mb-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {suggestion.message}
            </p>
          </div>

          {/* Action Button */}
          {suggestion.actionable && (suggestion.action || onApplySuggestion) && (
            <Button
              onClick={suggestion.action || onApplySuggestion}
              className={cn(
                'w-full justify-between font-semibold',
                'bg-gradient-to-r from-indigo-600 to-purple-600',
                'hover:from-indigo-700 hover:to-purple-700',
                'text-white shadow-md hover:shadow-lg',
                'transition-all duration-200'
              )}
            >
              <span>Apply this suggestion</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>

      {/* Suggestion History */}
      {suggestionHistory.length > 0 && (
        <SuggestionHistory suggestions={suggestionHistory} maxItems={5} />
      )}
    </div>
  );
}
