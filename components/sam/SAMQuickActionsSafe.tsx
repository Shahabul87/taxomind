'use client';

/**
 * SAMQuickActionsSafe
 *
 * A wrapper around SAMQuickActions that gracefully handles
 * the case when SAMProvider isn't available in the component tree.
 *
 * Use this component when SAMQuickActions needs to be rendered
 * in a context where SAMProvider may or may not be present.
 */

import React, { Component, type ReactNode } from 'react';
import { SAMQuickActions, type SAMQuickActionsProps } from './SAMQuickActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Lightbulb, BookOpen, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
}

class SAMErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ============================================================================
// FALLBACK COMPONENT
// ============================================================================

interface FallbackActionsProps {
  className?: string;
  variant?: 'inline' | 'floating' | 'compact';
}

function FallbackActions({ className, variant = 'inline' }: FallbackActionsProps) {
  const quickTips = [
    { icon: Lightbulb, label: 'Get Explanations', description: 'Learn concepts in depth' },
    { icon: BookOpen, label: 'Practice Problems', description: 'Test your knowledge' },
    { icon: HelpCircle, label: 'Ask Questions', description: 'Get help when stuck' },
  ];

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <Sparkles className="h-4 w-4" />
        <span className="text-sm">SAM AI actions available when connected</span>
      </div>
    );
  }

  if (variant === 'floating') {
    return null; // Don't show floating button if SAM isn't available
  }

  return (
    <Card className={cn('bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500/20 to-indigo-500/20">
            <Sparkles className="h-4 w-4 text-purple-500" />
          </div>
          SAM Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          AI-powered learning assistance is available. Configure SAM to unlock these features:
        </p>
        <div className="grid grid-cols-3 gap-2">
          {quickTips.map((tip) => {
            const Icon = tip.icon;
            return (
              <Button
                key={tip.label}
                variant="outline"
                className="h-auto flex-col gap-1 py-3 opacity-60 cursor-default"
                disabled
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{tip.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SAMQuickActionsSafe(props: SAMQuickActionsProps) {
  return (
    <SAMErrorBoundary fallback={<FallbackActions className={props.className} variant={props.variant} />}>
      <SAMQuickActions {...props} />
    </SAMErrorBoundary>
  );
}

export default SAMQuickActionsSafe;
