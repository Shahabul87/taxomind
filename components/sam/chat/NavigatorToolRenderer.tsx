'use client';

/**
 * NavigatorToolRenderer
 *
 * Renders NAVIGATOR skill builder tool output in SAM chat messages.
 * Handles conversation mode (showing options), generation mode (showing 6-stage progress),
 * and completed mode (showing skill graph summary, gap highlights, exit ramps).
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Target,
  Clock,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Compass,
  Briefcase,
  Calendar,
  GitBranch,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import {
  ConversationalOptions,
  InlineOptions,
  type ConversationalOption,
} from './ConversationalOptions';
import { NavigatorGenerationProgress } from './NavigatorGenerationProgress';
import type { SkillNavigatorToolOutput, NavigatorRoadmapResult } from './hooks/useSkillNavigatorTool';

// =============================================================================
// TYPES
// =============================================================================

interface NavigatorToolRendererProps {
  output: SkillNavigatorToolOutput;
  onSendMessage: (message: string) => void;
  onViewRoadmap?: (roadmapId: string) => void;
  /** Only the latest message should be interactive */
  isInteractive?: boolean;
  className?: string;
}

// =============================================================================
// STEP ICONS
// =============================================================================

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  skillName: BookOpen,
  goalOutcome: Target,
  goalType: Briefcase,
  currentLevel: MapPin,
  hoursPerWeek: Clock,
  deadline: Calendar,
  confirm: CheckCircle2,
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function NavigatorToolRenderer({
  output,
  onSendMessage,
  onViewRoadmap,
  isInteractive = true,
  className,
}: NavigatorToolRendererProps) {
  const [textInput, setTextInput] = useState('');
  const [completedRoadmap, setCompletedRoadmap] = useState<NavigatorRoadmapResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleOptionSelect = useCallback(
    (value: string) => {
      onSendMessage(value);
    },
    [onSendMessage],
  );

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      onSendMessage(textInput.trim());
      setTextInput('');
    }
  }, [textInput, onSendMessage]);

  const handleGenerationComplete = useCallback((roadmap: NavigatorRoadmapResult) => {
    setCompletedRoadmap(roadmap);
  }, []);

  const handleGenerationError = useCallback((error: string) => {
    setGenerationError(error);
  }, []);

  // Generation mode
  const shouldGenerate =
    output.type === 'generate_roadmap' &&
    output.triggerGeneration &&
    !completedRoadmap &&
    !generationError;

  if (shouldGenerate && output.params) {
    return (
      <div className={cn('space-y-3 sm:space-y-4 w-full', className)}>
        {output.message && (
          <p className="text-xs sm:text-sm text-muted-foreground break-words">{output.message}</p>
        )}
        <NavigatorGenerationProgress
          params={output.params}
          onComplete={handleGenerationComplete}
          onError={handleGenerationError}
        />
      </div>
    );
  }

  // Completed roadmap
  if (completedRoadmap) {
    return (
      <CompletedNavigatorCard
        roadmap={completedRoadmap}
        onViewRoadmap={onViewRoadmap}
        className={className}
      />
    );
  }

  // Generation error
  if (generationError) {
    return (
      <Card className={cn('border-destructive/50 w-full', className)}>
        <CardContent className="pt-4 px-3 sm:px-6">
          <p className="text-xs sm:text-sm text-destructive break-words">{generationError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full sm:w-auto"
            onClick={() => {
              setGenerationError(null);
            }}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Conversation mode
  if (output.type === 'conversation') {
    return (
      <ConversationRenderer
        output={output}
        textInput={textInput}
        onTextInputChange={setTextInput}
        onTextSubmit={handleTextSubmit}
        onOptionSelect={handleOptionSelect}
        isInteractive={isInteractive}
        className={className}
      />
    );
  }

  return null;
}

// =============================================================================
// CONVERSATION RENDERER
// =============================================================================

interface ConversationRendererProps {
  output: SkillNavigatorToolOutput;
  textInput: string;
  onTextInputChange: (value: string) => void;
  onTextSubmit: () => void;
  onOptionSelect: (value: string) => void;
  isInteractive?: boolean;
  className?: string;
}

function ConversationRenderer({
  output,
  textInput,
  onTextInputChange,
  onTextSubmit,
  onOptionSelect,
  isInteractive = true,
  className,
}: ConversationRendererProps) {
  const StepIcon = output.step ? STEP_ICONS[output.step] ?? Compass : Compass;
  const needsTextInput = output.step === 'skillName' || output.step === 'goalOutcome';
  const isConfirmStep = output.step === 'confirm';

  return (
    <div className={cn('space-y-3 w-full', className)}>
      {/* Progress dots */}
      {output.progress && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex gap-1">
            {Array.from({ length: output.progress.total }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors',
                  i < output.progress!.current ? 'bg-primary' : 'bg-muted',
                )}
              />
            ))}
          </div>
          <span className="whitespace-nowrap">
            Step {output.progress.current} of {output.progress.total}
          </span>
        </div>
      )}

      {/* Question */}
      {output.question && (
        <div className="flex items-start gap-2">
          <StepIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium break-words">{output.question}</p>
        </div>
      )}

      {/* Hint */}
      {output.hint && (
        <p className="text-xs text-muted-foreground ml-6 sm:ml-7 break-words">{output.hint}</p>
      )}

      {/* Text input for skillName / goalOutcome */}
      {needsTextInput && (
        <div className="flex flex-col sm:flex-row gap-2 ml-6 sm:ml-7">
          <Input
            placeholder={
              output.step === 'skillName'
                ? 'Enter skill name...'
                : 'Describe your goal outcome...'
            }
            value={textInput}
            onChange={(e) => onTextInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isInteractive) {
                onTextSubmit();
              }
            }}
            disabled={!isInteractive}
            className="flex-1 min-w-0"
          />
          <Button
            onClick={onTextSubmit}
            disabled={!isInteractive || !textInput.trim()}
            className="w-full sm:w-auto"
          >
            Continue
          </Button>
        </div>
      )}

      {/* Options */}
      {output.options && output.options.length > 0 && !needsTextInput && (
        <div className="ml-0 sm:ml-7">
          {isConfirmStep ? (
            <InlineOptions
              options={output.options}
              onSelect={onOptionSelect}
              disabled={!isInteractive}
            />
          ) : (
            <ConversationalOptions
              options={output.options}
              onSelect={onOptionSelect}
              columns={output.step === 'goalType' ? 2 : 2}
              showDescriptions={true}
              disabled={!isInteractive}
            />
          )}
        </div>
      )}

      {/* Collected data summary */}
      {output.collected && Object.keys(output.collected).length > 0 && (
        <CollectedDataSummary collected={output.collected} />
      )}
    </div>
  );
}

// =============================================================================
// COLLECTED DATA SUMMARY
// =============================================================================

interface CollectedDataSummaryProps {
  collected: Record<string, unknown>;
}

function CollectedDataSummary({ collected }: CollectedDataSummaryProps) {
  const entries = Object.entries(collected).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return null;

  const formatValue = (key: string, value: unknown): string => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (key === 'hoursPerWeek') return `${value} hrs/week`;
      return String(value);
    }
    if (typeof value === 'string') {
      if (key.includes('Level')) return value.charAt(0) + value.slice(1).toLowerCase();
      if (key === 'goalType') return value.replace(/_/g, ' ');
      if (key === 'deadline') return value.replace(/_/g, ' ');
      return value;
    }
    return String(value);
  };

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2 ml-0 sm:ml-7">
      {entries.map(([key, value]) => (
        <Badge key={key} variant="secondary" className="text-[10px] sm:text-xs capitalize">
          {formatValue(key, value)}
        </Badge>
      ))}
    </div>
  );
}

// =============================================================================
// COMPLETED NAVIGATOR CARD
// =============================================================================

interface CompletedNavigatorCardProps {
  roadmap: NavigatorRoadmapResult;
  onViewRoadmap?: (roadmapId: string) => void;
  className?: string;
}

function CompletedNavigatorCard({
  roadmap,
  onViewRoadmap,
  className,
}: CompletedNavigatorCardProps) {
  return (
    <Card
      className={cn(
        'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20 w-full',
        className,
      )}
    >
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
          <CardTitle className="text-sm sm:text-base">NAVIGATOR Roadmap Created!</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-3 sm:px-6">
        <div>
          <h4 className="font-medium text-sm sm:text-base break-words">{roadmap.title}</h4>
          {roadmap.description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
              {roadmap.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>{roadmap.totalEstimatedHours} hours total</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>{roadmap.milestoneCount} phases</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>{roadmap.skillGraphSummary.totalNodes} skill nodes</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>
              {roadmap.matchedCourses}/{roadmap.totalCourses} courses matched
            </span>
          </div>
        </div>

        {/* Critical gaps highlight */}
        {roadmap.gapHighlights.criticalGaps.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Critical Gaps ({roadmap.gapHighlights.totalGapHours}h to close)
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 ml-5">
              {roadmap.gapHighlights.criticalGaps.slice(0, 4).map((gap, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px] sm:text-xs border-amber-300 dark:border-amber-700">
                  {gap}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Milestones with exit ramps */}
        {roadmap.milestones.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">Phases & Exit Ramps:</p>
            <div className="space-y-1.5 sm:space-y-1">
              {roadmap.milestones.slice(0, 4).map((milestone, index) => (
                <div key={milestone.id} className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="flex-1 truncate min-w-0">{milestone.title}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                      {milestone.estimatedHours}h
                    </span>
                  </div>
                  {milestone.exitRamp && (
                    <div className="flex items-start gap-1.5 ml-6 sm:ml-7">
                      <Shield className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-[10px] text-muted-foreground line-clamp-1">
                        Exit: {milestone.exitRamp}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {roadmap.milestones.length > 4 && (
                <p className="text-xs text-muted-foreground ml-6 sm:ml-7">
                  +{roadmap.milestones.length - 4} more phases
                </p>
              )}
            </div>
          </div>
        )}

        {/* View roadmap button */}
        {onViewRoadmap && (
          <Button
            className="w-full mt-2 text-sm"
            size="sm"
            onClick={() => onViewRoadmap(roadmap.roadmapId)}
          >
            View Full Roadmap
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
