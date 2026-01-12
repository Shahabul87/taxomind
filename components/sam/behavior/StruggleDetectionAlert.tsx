'use client';

/**
 * StruggleDetectionAlert
 *
 * Alert component that shows when struggle patterns are detected.
 * Provides actionable suggestions to help learners overcome challenges.
 *
 * Features:
 * - Automatic struggle pattern monitoring
 * - Dismissible alerts
 * - Actionable suggestions
 * - Integration with SAM interventions
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  X,
  Lightbulb,
  MessageSquare,
  BookOpen,
  Coffee,
  ArrowRight,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useBehaviorPatterns } from '@sam-ai/react';
import type { BehaviorPattern } from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface StruggleDetectionAlertProps {
  className?: string;
  /** Topic or concept currently being studied */
  currentTopic?: string;
  /** Show even if no struggle detected (for demo) */
  forceShow?: boolean;
  /** Position on screen */
  position?: 'top' | 'bottom' | 'inline';
  /** Callback when user requests help */
  onRequestHelp?: (struggle: BehaviorPattern) => void;
  /** Callback when user takes a break */
  onTakeBreak?: () => void;
  /** Auto-dismiss after ms (0 to disable) */
  autoDismissMs?: number;
}

interface Suggestion {
  icon: typeof Lightbulb;
  label: string;
  description: string;
  action: 'help' | 'break' | 'simplify' | 'review';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SUGGESTIONS: Suggestion[] = [
  {
    icon: MessageSquare,
    label: 'Ask SAM for help',
    description: 'Get personalized guidance on this topic',
    action: 'help',
  },
  {
    icon: Coffee,
    label: 'Take a short break',
    description: 'Sometimes stepping away helps clarity',
    action: 'break',
  },
  {
    icon: BookOpen,
    label: 'Try simpler examples',
    description: 'Build up from fundamentals',
    action: 'simplify',
  },
  {
    icon: Clock,
    label: 'Review prerequisites',
    description: 'Ensure foundational concepts are solid',
    action: 'review',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStruggleLevel(patterns: BehaviorPattern[]): 'none' | 'mild' | 'moderate' | 'severe' {
  const strugglePatterns = patterns.filter((p) => p.type === 'STRUGGLE');
  if (strugglePatterns.length === 0) return 'none';

  const maxConfidence = Math.max(...strugglePatterns.map((p) => p.confidence));
  const recentCount = strugglePatterns.filter((p) => {
    const lastDetected = new Date(p.lastDetected);
    const hourAgo = new Date(Date.now() - 3600000);
    return lastDetected > hourAgo;
  }).length;

  if (maxConfidence >= 0.8 || recentCount >= 3) return 'severe';
  if (maxConfidence >= 0.6 || recentCount >= 2) return 'moderate';
  return 'mild';
}

function getAlertColors(level: 'mild' | 'moderate' | 'severe') {
  switch (level) {
    case 'severe':
      return {
        bg: 'bg-red-50 dark:bg-red-950/40',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-500',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      };
    case 'moderate':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-800',
        icon: 'text-amber-500',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      };
    default:
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/40',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-500',
        badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      };
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StruggleDetectionAlert({
  className,
  currentTopic,
  forceShow = false,
  position = 'inline',
  onRequestHelp,
  onTakeBreak,
  autoDismissMs = 0,
}: StruggleDetectionAlertProps) {
  // State
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showBreakDialog, setShowBreakDialog] = useState(false);

  // Hooks
  const { patterns, isLoading } = useBehaviorPatterns({
    autoFetch: true,
    refreshInterval: 30000, // Check every 30 seconds
  });

  // Get struggle patterns
  const strugglePatterns = useMemo(() => {
    return patterns.filter((p) => p.type === 'STRUGGLE');
  }, [patterns]);

  const struggleLevel = useMemo(() => {
    return getStruggleLevel(patterns);
  }, [patterns]);

  const shouldShow = forceShow || (struggleLevel !== 'none' && !isDismissed);
  const colors = struggleLevel !== 'none' ? getAlertColors(struggleLevel) : getAlertColors('mild');

  // Auto-dismiss
  useEffect(() => {
    if (!shouldShow || autoDismissMs <= 0) return;

    const timer = setTimeout(() => {
      setIsDismissed(true);
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [shouldShow, autoDismissMs]);

  // Handlers
  const handleSuggestionClick = useCallback((action: Suggestion['action']) => {
    switch (action) {
      case 'help':
        if (strugglePatterns.length > 0 && onRequestHelp) {
          onRequestHelp(strugglePatterns[0]);
        }
        break;
      case 'break':
        setShowBreakDialog(true);
        break;
      case 'simplify':
      case 'review':
        // These could open specific UI or trigger SAM actions
        if (strugglePatterns.length > 0 && onRequestHelp) {
          onRequestHelp(strugglePatterns[0]);
        }
        break;
    }
  }, [strugglePatterns, onRequestHelp]);

  const handleConfirmBreak = useCallback(() => {
    setShowBreakDialog(false);
    setIsDismissed(true);
    onTakeBreak?.();
  }, [onTakeBreak]);

  // Don't render if not showing
  if (!shouldShow) return null;

  const positionClasses = {
    top: 'fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg mx-auto px-4',
    bottom: 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg mx-auto px-4',
    inline: '',
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: position === 'bottom' ? 20 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'bottom' ? 20 : -20 }}
          className={cn(positionClasses[position], className)}
        >
          <Card className={cn('border-2', colors.bg, colors.border)}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('p-2 rounded-full', colors.bg)}>
                    <AlertTriangle className={cn('h-5 w-5', colors.icon)} />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      Struggle Detected
                      <Badge className={cn('text-xs', colors.badge)}>
                        {struggleLevel.charAt(0).toUpperCase() + struggleLevel.slice(1)}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-sm mt-0.5">
                      {currentTopic
                        ? `Having difficulty with ${currentTopic}?`
                        : 'It looks like you might need some help'}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsDismissed(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pb-4">
              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => handleSuggestionClick('help')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ask SAM
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => handleSuggestionClick('break')}
                >
                  <Coffee className="h-4 w-4 mr-2" />
                  Take Break
                </Button>
              </div>

              {/* Expandable details */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Hide suggestions
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    More suggestions
                  </>
                )}
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2">
                      {SUGGESTIONS.map((suggestion) => {
                        const Icon = suggestion.icon;
                        return (
                          <button
                            key={suggestion.action}
                            onClick={() => handleSuggestionClick(suggestion.action)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors text-left"
                          >
                            <Icon className="h-4 w-4 text-gray-500" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{suggestion.label}</div>
                              <div className="text-xs text-gray-500">
                                {suggestion.description}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </button>
                        );
                      })}
                    </div>

                    {/* Detected patterns */}
                    {strugglePatterns.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 mb-2">
                          Detected struggle patterns:
                        </div>
                        <div className="space-y-1">
                          {strugglePatterns.map((pattern) => (
                            <div
                              key={pattern.id}
                              className="text-xs flex items-center gap-2"
                            >
                              <HelpCircle className="h-3 w-3 text-gray-400" />
                              <span>{pattern.name}</span>
                              <Badge variant="outline" className="text-[10px] ml-auto">
                                {Math.round(pattern.confidence * 100)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Break confirmation dialog */}
      <AlertDialog open={showBreakDialog} onOpenChange={setShowBreakDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-amber-500" />
              Take a Break?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Taking short breaks can help improve focus and retention.
              SAM will remind you when it&apos;s time to return to studying.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBreak}>
              Start 5-min Break
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default StruggleDetectionAlert;
