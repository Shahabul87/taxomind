"use client";

import React, { useState } from 'react';
import { ChevronDown, Clock, MessageCircle, ThumbsUp, Lightbulb, AlertTriangle, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SamSuggestion } from '../../types/sam-creator.types';
import { CompactConfidenceIndicator } from './ConfidenceIndicator';

interface SuggestionHistoryProps {
  suggestions: SamSuggestion[];
  maxItems?: number;
  className?: string;
}

const getSuggestionIcon = (type: SamSuggestion['type']) => {
  switch (type) {
    case 'encouragement': return Heart;
    case 'warning': return AlertTriangle;
    case 'tip': return Lightbulb;
    case 'validation': return ThumbsUp;
    default: return MessageCircle;
  }
};

const getSuggestionColor = (type: SamSuggestion['type']) => {
  switch (type) {
    case 'encouragement': return 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20';
    case 'warning': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
    case 'tip': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    case 'validation': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
    default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20';
  }
};

const formatTimeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export function SuggestionHistory({
  suggestions,
  maxItems = 5,
  className
}: SuggestionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort by timestamp (newest first) and limit
  const sortedSuggestions = [...suggestions]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, maxItems);

  if (sortedSuggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between p-3 rounded-lg',
          'bg-slate-50 dark:bg-slate-800/50',
          'border border-slate-200 dark:border-slate-700',
          'hover:bg-slate-100 dark:hover:bg-slate-800',
          'transition-all duration-200',
          'group'
        )}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} suggestion history`}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30">
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Previous Suggestions
          </span>
          <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
            {sortedSuggestions.length}
          </span>
        </div>

        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-500 dark:text-slate-400',
            'transition-transform duration-200',
            'group-hover:text-slate-700 dark:group-hover:text-slate-300',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Collapsible Content */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
        aria-hidden={!isExpanded}
      >
        <div className="space-y-2">
          {sortedSuggestions.map((suggestion, index) => {
            const Icon = getSuggestionIcon(suggestion.type);
            const colorClass = getSuggestionColor(suggestion.type);

            return (
              <div
                key={suggestion.id || index}
                className={cn(
                  'p-3 rounded-lg border',
                  'bg-white dark:bg-slate-900',
                  'border-slate-200 dark:border-slate-700',
                  'hover:border-indigo-200 dark:hover:border-indigo-800',
                  'transition-all duration-200',
                  'animate-in fade-in-50 slide-in-from-top-2',
                  'group/item'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn('p-2 rounded-lg flex-shrink-0', colorClass)}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-100 capitalize">
                        {suggestion.type}
                      </span>
                      <div className="flex items-center gap-2">
                        <CompactConfidenceIndicator confidence={suggestion.confidence} />
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatTimeAgo(suggestion.timestamp || Date.now())}
                        </span>
                      </div>
                    </div>

                    {/* Message */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 group-hover/item:line-clamp-none transition-all">
                      {suggestion.message}
                    </p>

                    {/* Context Tag (if exists) */}
                    {suggestion.context && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-500 dark:text-slate-500">
                          Context: {suggestion.context}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Link (if more suggestions exist) */}
        {suggestions.length > maxItems && (
          <button
            className={cn(
              'w-full mt-3 p-2 text-xs font-medium',
              'text-indigo-600 dark:text-indigo-400',
              'hover:text-indigo-700 dark:hover:text-indigo-300',
              'transition-colors duration-200'
            )}
            onClick={() => {
              // TODO: Open full suggestion history modal
            }}
          >
            View all {suggestions.length} suggestions →
          </button>
        )}
      </div>
    </div>
  );
}

// Mini version for compact display
export function CompactSuggestionHistory({
  suggestions,
  className
}: {
  suggestions: SamSuggestion[];
  className?: string;
}) {
  const recentCount = suggestions.length;

  if (recentCount === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-slate-50 dark:bg-slate-800/50',
        'border border-slate-200 dark:border-slate-700',
        className
      )}
    >
      <Clock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
      <span className="text-xs text-slate-600 dark:text-slate-400">
        {recentCount} suggestion{recentCount !== 1 ? 's' : ''} in history
      </span>
    </div>
  );
}
