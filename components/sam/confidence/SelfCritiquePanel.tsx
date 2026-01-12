'use client';

/**
 * SelfCritiquePanel
 *
 * Displays AI self-evaluation and critique of its own responses.
 * Promotes transparency and helps users understand AI limitations.
 *
 * Features:
 * - Self-assessment breakdown
 * - Strength/weakness analysis
 * - Uncertainty acknowledgment
 * - Suggested improvements
 * - Source quality indicators
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import {
  Brain,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  Shield,
  Target,
  TrendingUp,
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
} from 'lucide-react';
import { ConfidenceIndicator } from './ConfidenceIndicator';

// ============================================================================
// TYPES
// ============================================================================

interface SelfCritiquePanelProps {
  className?: string;
  /** Self-critique data */
  critique: SelfCritique;
  /** Display mode */
  mode?: 'full' | 'compact' | 'inline';
  /** Initially expanded */
  defaultExpanded?: boolean;
  /** Show action buttons */
  showActions?: boolean;
  /** Callback for requesting clarification */
  onRequestClarification?: () => void;
  /** Callback for expanding explanation */
  onExpandExplanation?: () => void;
}

interface SelfCritique {
  /** Overall confidence score */
  overallConfidence: number;
  /** Individual dimension scores */
  dimensions: CritiqueDimension[];
  /** Identified strengths */
  strengths: string[];
  /** Identified weaknesses */
  weaknesses: string[];
  /** Areas of uncertainty */
  uncertainties: string[];
  /** Suggested improvements */
  suggestions: string[];
  /** Source quality assessment */
  sourceQuality?: {
    score: number;
    details: string;
  };
  /** Self-identified limitations */
  limitations?: string[];
  /** Generated timestamp */
  generatedAt: string;
}

interface CritiqueDimension {
  name: string;
  score: number;
  description: string;
  category: 'knowledge' | 'reasoning' | 'relevance' | 'clarity' | 'accuracy';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DIMENSION_ICONS: Record<CritiqueDimension['category'], typeof Brain> = {
  knowledge: BookOpen,
  reasoning: Brain,
  relevance: Target,
  clarity: Sparkles,
  accuracy: Shield,
};

const DIMENSION_COLORS: Record<CritiqueDimension['category'], string> = {
  knowledge: 'text-blue-500',
  reasoning: 'text-purple-500',
  relevance: 'text-green-500',
  clarity: 'text-amber-500',
  accuracy: 'text-red-500',
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function DimensionBar({ dimension }: { dimension: CritiqueDimension }) {
  const Icon = DIMENSION_ICONS[dimension.category];
  const color = DIMENSION_COLORS[dimension.category];
  const percentage = Math.round(dimension.score * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', color)} />
          <span className="text-sm font-medium">{dimension.name}</span>
        </div>
        <span className="text-sm text-gray-500">{percentage}%</span>
      </div>
      <Progress
        value={percentage}
        className="h-1.5"
      />
      <p className="text-xs text-gray-500">{dimension.description}</p>
    </div>
  );
}

function ListSection({
  title,
  items,
  icon: Icon,
  color,
  emptyText,
}: {
  title: string;
  items: string[];
  icon: typeof CheckCircle;
  color: string;
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">{emptyText}</div>
    );
  }

  return (
    <div className="space-y-2">
      <div className={cn('flex items-center gap-2 text-sm font-medium', color)}>
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
          >
            <span className={cn('mt-1.5 h-1.5 w-1.5 rounded-full shrink-0', color.replace('text-', 'bg-'))} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SelfCritiquePanel({
  className,
  critique,
  mode = 'full',
  defaultExpanded = false,
  showActions = true,
  onRequestClarification,
  onExpandExplanation,
}: SelfCritiquePanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const avgDimensionScore =
      critique.dimensions.reduce((acc, d) => acc + d.score, 0) /
      Math.max(critique.dimensions.length, 1);
    const hasHighConfidence = critique.overallConfidence >= 0.8;
    const hasSignificantWeaknesses = critique.weaknesses.length > 0;
    const hasUncertainties = critique.uncertainties.length > 0;

    return {
      avgDimensionScore,
      hasHighConfidence,
      hasSignificantWeaknesses,
      hasUncertainties,
    };
  }, [critique]);

  // Inline mode - minimal display
  if (mode === 'inline') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <ConfidenceIndicator
          confidence={critique.overallConfidence}
          mode="badge"
          size="sm"
          showExplanation={false}
        />
        {critique.uncertainties.length > 0 && (
          <Badge variant="outline" className="text-xs text-amber-600 bg-amber-50">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {critique.uncertainties.length} uncertainties
          </Badge>
        )}
      </div>
    );
  }

  // Compact mode
  if (mode === 'compact') {
    return (
      <Collapsible
        open={isExpanded}
        onOpenChange={setIsExpanded}
        className={className}
      >
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-950/30">
                <Brain className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">AI Self-Assessment</div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{Math.round(critique.overallConfidence * 100)}% confidence</span>
                  {critique.weaknesses.length > 0 && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-amber-600">
                        {critique.weaknesses.length} notes
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="pt-3 space-y-3">
            {/* Quick summary */}
            <div className="grid grid-cols-2 gap-2">
              {critique.strengths.length > 0 && (
                <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle className="h-3 w-3" />
                    Strengths
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {critique.strengths[0]}
                  </div>
                </div>
              )}
              {critique.weaknesses.length > 0 && (
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    Note
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {critique.weaknesses[0]}
                  </div>
                </div>
              )}
            </div>

            {showActions && (onRequestClarification || onExpandExplanation) && (
              <div className="flex items-center gap-2">
                {onRequestClarification && (
                  <Button size="sm" variant="outline" onClick={onRequestClarification}>
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Ask for Clarity
                  </Button>
                )}
                {onExpandExplanation && (
                  <Button size="sm" variant="outline" onClick={onExpandExplanation}>
                    <Search className="h-3 w-3 mr-1" />
                    More Detail
                  </Button>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Full mode
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-950/30">
              <Brain className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-base">AI Self-Assessment</CardTitle>
              <CardDescription>
                Transparency about AI confidence and limitations
              </CardDescription>
            </div>
          </div>
          <ConfidenceIndicator
            confidence={critique.overallConfidence}
            mode="meter"
            size="sm"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dimension scores */}
        {critique.dimensions.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Assessment Dimensions
            </div>
            <div className="space-y-3">
              {critique.dimensions.map((dimension, index) => (
                <DimensionBar key={index} dimension={dimension} />
              ))}
            </div>
          </div>
        )}

        {/* Accordion for detailed sections */}
        <Accordion type="multiple" className="w-full">
          {critique.strengths.length > 0 && (
            <AccordionItem value="strengths">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Strengths ({critique.strengths.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ListSection
                  title=""
                  items={critique.strengths}
                  icon={CheckCircle}
                  color="text-green-600"
                  emptyText="No strengths identified"
                />
              </AccordionContent>
            </AccordionItem>
          )}

          {critique.weaknesses.length > 0 && (
            <AccordionItem value="weaknesses">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  Areas for Caution ({critique.weaknesses.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ListSection
                  title=""
                  items={critique.weaknesses}
                  icon={AlertTriangle}
                  color="text-amber-600"
                  emptyText="No weaknesses identified"
                />
              </AccordionContent>
            </AccordionItem>
          )}

          {critique.uncertainties.length > 0 && (
            <AccordionItem value="uncertainties">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2 text-orange-600">
                  <HelpCircle className="h-4 w-4" />
                  Uncertainties ({critique.uncertainties.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ListSection
                  title=""
                  items={critique.uncertainties}
                  icon={HelpCircle}
                  color="text-orange-600"
                  emptyText="No uncertainties noted"
                />
              </AccordionContent>
            </AccordionItem>
          )}

          {critique.suggestions.length > 0 && (
            <AccordionItem value="suggestions">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2 text-blue-600">
                  <Lightbulb className="h-4 w-4" />
                  Suggestions ({critique.suggestions.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ListSection
                  title=""
                  items={critique.suggestions}
                  icon={Lightbulb}
                  color="text-blue-600"
                  emptyText="No suggestions"
                />
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Source quality */}
        {critique.sourceQuality && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4 text-gray-500" />
                Source Quality
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  critique.sourceQuality.score >= 0.8
                    ? 'text-green-600 bg-green-50'
                    : critique.sourceQuality.score >= 0.6
                    ? 'text-amber-600 bg-amber-50'
                    : 'text-orange-600 bg-orange-50'
                )}
              >
                {Math.round(critique.sourceQuality.score * 100)}%
              </Badge>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {critique.sourceQuality.details}
            </p>
          </div>
        )}

        {/* Limitations disclaimer */}
        {critique.limitations && critique.limitations.length > 0 && (
          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Known Limitations
                </div>
                <ul className="mt-1 space-y-1">
                  {critique.limitations.map((limitation, index) => (
                    <li
                      key={index}
                      className="text-xs text-purple-600 dark:text-purple-400"
                    >
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (onRequestClarification || onExpandExplanation) && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {onRequestClarification && (
              <Button size="sm" variant="outline" onClick={onRequestClarification}>
                <HelpCircle className="h-4 w-4 mr-1" />
                Request Clarification
              </Button>
            )}
            {onExpandExplanation && (
              <Button size="sm" variant="outline" onClick={onExpandExplanation}>
                <Search className="h-4 w-4 mr-1" />
                Expand Explanation
              </Button>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-400 text-right">
          Generated: {new Date(critique.generatedAt).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

export default SelfCritiquePanel;
