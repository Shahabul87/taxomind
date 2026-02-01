'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Clock, ArrowRight } from 'lucide-react';
import type { RecommendationItem } from '@/lib/sam/agentic-chat/types';

interface RecommendationCardsProps {
  recommendations: RecommendationItem[];
  onSelect?: (recommendation: RecommendationItem) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20',
  medium: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20',
  low: 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20',
};

export function RecommendationCards({ recommendations, onSelect }: RecommendationCardsProps) {
  if (recommendations.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Lightbulb className="w-3 h-3" />
        <span>Recommended Next</span>
      </div>
      {recommendations.map((rec) => (
        <button
          key={rec.id}
          onClick={() => onSelect?.(rec)}
          className={`w-full text-left rounded-md border p-2 transition-colors hover:opacity-90 ${
            PRIORITY_STYLES[rec.priority] ?? PRIORITY_STYLES.medium
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium truncate">{rec.title}</p>
              {rec.description && (
                <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                  {rec.description}
                </p>
              )}
            </div>
            <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[9px] px-1 py-0">
              {rec.type}
            </Badge>
            <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <Clock className="w-2.5 h-2.5" />
              {rec.estimatedMinutes}m
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
