'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb, X } from 'lucide-react';
import type { InterventionContext } from '@/lib/sam/agentic-chat/types';

interface InterventionBannerProps {
  interventionContext: InterventionContext;
}

export function InterventionBanner({ interventionContext }: InterventionBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleDismiss = useCallback((interventionId: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(interventionId);
      return next;
    });

    // Fire-and-forget dismiss API call
    fetch(`/api/sam/agentic/behavior/interventions/${interventionId}/dismiss`, {
      method: 'PATCH',
    }).catch(() => {
      // Dismissal is best-effort
    });
  }, []);

  const visible = interventionContext.interventions.filter(
    (i) => !dismissedIds.has(i.id)
  );

  if (visible.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {visible.slice(0, 2).map((intervention) => (
        <div
          key={intervention.id}
          className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              {intervention.message}
            </p>
            {intervention.suggestedActions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {intervention.suggestedActions.slice(0, 2).map((action, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                  >
                    {action}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 shrink-0"
            onClick={() => handleDismiss(intervention.id)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
