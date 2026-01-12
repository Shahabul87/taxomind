'use client';

/**
 * LearningStyleIndicator
 *
 * Compact indicator showing the user's detected learning style.
 * Can be used in headers, sidebars, or as a tooltip.
 *
 * Features:
 * - VARK learning style detection (Visual, Auditory, Read/Write, Kinesthetic)
 * - Confidence level indicator
 * - Tooltip with details
 * - Multiple display modes (badge, card, full)
 */

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Eye,
  Ear,
  BookOpen,
  Hand,
  Brain,
  Sparkles,
  Info,
} from 'lucide-react';
import { useBehaviorPatterns } from '@sam-ai/react';
import type { BehaviorPattern } from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface LearningStyleIndicatorProps {
  className?: string;
  /** Display mode */
  mode?: 'badge' | 'card' | 'full';
  /** Show confidence level */
  showConfidence?: boolean;
  /** Show description */
  showDescription?: boolean;
}

type LearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'multimodal';

interface StyleInfo {
  icon: typeof Eye;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  description: string;
  tips: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STYLE_CONFIG: Record<LearningStyle, StyleInfo> = {
  visual: {
    icon: Eye,
    label: 'Visual Learner',
    shortLabel: 'Visual',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    description: 'You learn best through images, diagrams, and visual representations.',
    tips: [
      'Use diagrams and flowcharts',
      'Highlight key concepts with colors',
      'Watch video tutorials',
      'Create mind maps',
    ],
  },
  auditory: {
    icon: Ear,
    label: 'Auditory Learner',
    shortLabel: 'Auditory',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    description: 'You learn best through listening and verbal explanations.',
    tips: [
      'Listen to lectures and podcasts',
      'Discuss topics with others',
      'Read notes aloud',
      'Use mnemonic devices',
    ],
  },
  reading: {
    icon: BookOpen,
    label: 'Read/Write Learner',
    shortLabel: 'Read/Write',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    description: 'You learn best through reading and writing text.',
    tips: [
      'Take detailed notes',
      'Rewrite concepts in your own words',
      'Create lists and outlines',
      'Read textbooks and articles',
    ],
  },
  kinesthetic: {
    icon: Hand,
    label: 'Kinesthetic Learner',
    shortLabel: 'Kinesthetic',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    description: 'You learn best through hands-on practice and experience.',
    tips: [
      'Practice with examples',
      'Build projects and prototypes',
      'Take breaks during study',
      'Use physical activities while learning',
    ],
  },
  multimodal: {
    icon: Brain,
    label: 'Multimodal Learner',
    shortLabel: 'Multimodal',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    description: 'You learn effectively using multiple modalities.',
    tips: [
      'Combine visual and verbal methods',
      'Use varied study techniques',
      'Switch between modalities as needed',
      'Leverage your flexibility',
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function detectLearningStyle(patterns: BehaviorPattern[]): {
  style: LearningStyle;
  confidence: number;
  breakdown: Record<LearningStyle, number>;
} {
  // Find learning style patterns
  const stylePatterns = patterns.filter((p) => p.type === 'LEARNING_STYLE');

  if (stylePatterns.length === 0) {
    return {
      style: 'multimodal',
      confidence: 0,
      breakdown: { visual: 0, auditory: 0, reading: 0, kinesthetic: 0, multimodal: 0 },
    };
  }

  // Parse metadata to determine style
  const breakdown: Record<LearningStyle, number> = {
    visual: 0,
    auditory: 0,
    reading: 0,
    kinesthetic: 0,
    multimodal: 0,
  };

  let totalConfidence = 0;
  let styleCount = 0;

  stylePatterns.forEach((pattern) => {
    const metadata = pattern.metadata || {};
    const styleValue = (metadata.style as string || pattern.name).toLowerCase();

    // Map pattern to style
    let detectedStyle: LearningStyle = 'multimodal';
    if (styleValue.includes('visual') || styleValue.includes('diagram') || styleValue.includes('image')) {
      detectedStyle = 'visual';
    } else if (styleValue.includes('audio') || styleValue.includes('listen') || styleValue.includes('verbal')) {
      detectedStyle = 'auditory';
    } else if (styleValue.includes('read') || styleValue.includes('write') || styleValue.includes('text')) {
      detectedStyle = 'reading';
    } else if (styleValue.includes('kinesthetic') || styleValue.includes('hands') || styleValue.includes('practice')) {
      detectedStyle = 'kinesthetic';
    }

    breakdown[detectedStyle] += pattern.confidence;
    totalConfidence += pattern.confidence;
    styleCount++;
  });

  // Normalize breakdown
  if (styleCount > 0) {
    Object.keys(breakdown).forEach((key) => {
      breakdown[key as LearningStyle] /= styleCount;
    });
  }

  // Find dominant style
  let dominantStyle: LearningStyle = 'multimodal';
  let maxScore = 0;
  let secondMaxScore = 0;

  Object.entries(breakdown).forEach(([style, score]) => {
    if (style !== 'multimodal' && score > maxScore) {
      secondMaxScore = maxScore;
      maxScore = score;
      dominantStyle = style as LearningStyle;
    } else if (style !== 'multimodal' && score > secondMaxScore) {
      secondMaxScore = score;
    }
  });

  // If scores are close, consider multimodal
  if (maxScore > 0 && secondMaxScore > 0 && maxScore - secondMaxScore < 0.2) {
    dominantStyle = 'multimodal';
  }

  return {
    style: dominantStyle,
    confidence: totalConfidence / styleCount,
    breakdown,
  };
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StyleBadge({
  style,
  confidence,
  showConfidence,
}: {
  style: LearningStyle;
  confidence: number;
  showConfidence: boolean;
}) {
  const config = STYLE_CONFIG[style];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5', config.color, config.bgColor)}
    >
      <Icon className="h-3 w-3" />
      {config.shortLabel}
      {showConfidence && confidence > 0 && (
        <span className="text-[10px] opacity-75">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </Badge>
  );
}

function StyleCard({
  style,
  confidence,
  breakdown,
  showDescription,
}: {
  style: LearningStyle;
  confidence: number;
  breakdown: Record<LearningStyle, number>;
  showDescription: boolean;
}) {
  const config = STYLE_CONFIG[style];
  const Icon = config.icon;

  return (
    <Card className={cn('overflow-hidden', config.bgColor)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={cn('p-2 rounded-full', config.bgColor, 'border')}>
            <Icon className={cn('h-4 w-4', config.color)} />
          </div>
          <div>
            <CardTitle className="text-sm">{config.label}</CardTitle>
            {confidence > 0 && (
              <CardDescription className="text-xs">
                {Math.round(confidence * 100)}% confidence
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {showDescription && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {config.description}
          </p>
        )}

        {/* Style breakdown */}
        <div className="space-y-1.5">
          {(Object.keys(breakdown) as LearningStyle[])
            .filter((s) => s !== 'multimodal')
            .map((s) => {
              const sConfig = STYLE_CONFIG[s];
              const SIcon = sConfig.icon;
              const value = breakdown[s] * 100;
              return (
                <div key={s} className="flex items-center gap-2">
                  <SIcon className={cn('h-3 w-3', sConfig.color)} />
                  <span className="text-xs w-16 truncate">{sConfig.shortLabel}</span>
                  <Progress value={value} className="h-1.5 flex-1" />
                  <span className="text-[10px] text-gray-500 w-8 text-right">
                    {Math.round(value)}%
                  </span>
                </div>
              );
            })}
        </div>

        {/* Tips */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
            <Sparkles className="h-3 w-3" />
            Tips for you
          </div>
          <ul className="space-y-0.5">
            {config.tips.slice(0, 3).map((tip, i) => (
              <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                <span className="text-gray-400">-</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState({ mode }: { mode: 'badge' | 'card' | 'full' }) {
  if (mode === 'badge') {
    return <Skeleton className="h-6 w-24" />;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LearningStyleIndicator({
  className,
  mode = 'badge',
  showConfidence = true,
  showDescription = true,
}: LearningStyleIndicatorProps) {
  // Hooks
  const { patterns, isLoading } = useBehaviorPatterns({
    autoFetch: true,
  });

  // Detect learning style
  const { style, confidence, breakdown } = useMemo(() => {
    return detectLearningStyle(patterns);
  }, [patterns]);

  const config = STYLE_CONFIG[style];

  if (isLoading) {
    return <LoadingState mode={mode} />;
  }

  // Badge mode with hover card
  if (mode === 'badge') {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className={cn('inline-flex cursor-pointer', className)}>
            <StyleBadge
              style={style}
              confidence={confidence}
              showConfidence={showConfidence}
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-0" align="start">
          <StyleCard
            style={style}
            confidence={confidence}
            breakdown={breakdown}
            showDescription={showDescription}
          />
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Card mode
  if (mode === 'card') {
    return (
      <div className={className}>
        <StyleCard
          style={style}
          confidence={confidence}
          breakdown={breakdown}
          showDescription={showDescription}
        />
      </div>
    );
  }

  // Full mode with all details
  return (
    <div className={cn('space-y-4', className)}>
      <StyleCard
        style={style}
        confidence={confidence}
        breakdown={breakdown}
        showDescription={showDescription}
      />

      {/* All tips */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Learning Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {config.tips.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <div className={cn('p-1 rounded', config.bgColor)}>
                  <Sparkles className={cn('h-3 w-3', config.color)} />
                </div>
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="flex items-start gap-2 text-xs text-gray-500">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <span>
          Learning style is detected based on your interaction patterns.
          The more you learn, the more accurate this becomes.
        </span>
      </div>
    </div>
  );
}

export default LearningStyleIndicator;
