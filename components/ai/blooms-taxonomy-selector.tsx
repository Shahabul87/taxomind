"use client";

/**
 * Bloom's Taxonomy Selector Component
 *
 * Interactive selector for cognitive learning levels based on Bloom's Taxonomy.
 * Used in the Unified AI Generator for context-aware content generation.
 */

import { cn } from "@/lib/utils";
import {
  Brain,
  Lightbulb,
  Wrench,
  Search,
  Scale,
  Rocket,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { BloomsLevel, BloomsLevelConfig } from "./unified-ai-generator-types";

// ============================================================================
// Bloom's Taxonomy Configuration
// ============================================================================

export const BLOOMS_LEVELS: BloomsLevelConfig[] = [
  {
    id: 'remember',
    name: 'Remember',
    description: 'Recall facts and basic concepts',
    verbs: ['Define', 'List', 'Recall', 'Name', 'Identify', 'State', 'Recognize'],
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-700',
    icon: Brain,
  },
  {
    id: 'understand',
    name: 'Understand',
    description: 'Explain ideas or concepts',
    verbs: ['Describe', 'Explain', 'Summarize', 'Interpret', 'Classify', 'Discuss'],
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-700',
    icon: Lightbulb,
  },
  {
    id: 'apply',
    name: 'Apply',
    description: 'Use information in new situations',
    verbs: ['Apply', 'Demonstrate', 'Solve', 'Use', 'Implement', 'Execute'],
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-700',
    icon: Wrench,
  },
  {
    id: 'analyze',
    name: 'Analyze',
    description: 'Draw connections among ideas',
    verbs: ['Analyze', 'Compare', 'Contrast', 'Examine', 'Differentiate', 'Organize'],
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-700',
    icon: Search,
  },
  {
    id: 'evaluate',
    name: 'Evaluate',
    description: 'Justify a decision or course of action',
    verbs: ['Evaluate', 'Judge', 'Assess', 'Critique', 'Justify', 'Defend'],
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-700',
    icon: Scale,
  },
  {
    id: 'create',
    name: 'Create',
    description: 'Produce new or original work',
    verbs: ['Create', 'Design', 'Develop', 'Construct', 'Formulate', 'Invent'],
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-700',
    icon: Rocket,
  },
];

// ============================================================================
// Component Props
// ============================================================================

interface BloomsTaxonomySelectorProps {
  selectedLevels: Record<BloomsLevel, boolean>;
  onLevelChange: (level: BloomsLevel, enabled: boolean) => void;
  compact?: boolean;
  showVerbs?: boolean;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function BloomsTaxonomySelector({
  selectedLevels,
  onLevelChange,
  compact = false,
  showVerbs = true,
  disabled = false,
  className,
}: BloomsTaxonomySelectorProps) {
  const selectedCount = Object.values(selectedLevels).filter(Boolean).length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Bloom&apos;s Taxonomy Levels
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">
                  Select cognitive levels to target in the generated content.
                  Lower levels (Remember, Understand) are foundational, while
                  higher levels (Evaluate, Create) require deeper thinking.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Badge
          variant="secondary"
          className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
        >
          {selectedCount} selected
        </Badge>
      </div>

      {/* Level Grid */}
      <div className={cn(
        "grid gap-2",
        compact ? "grid-cols-3" : "grid-cols-2 lg:grid-cols-3"
      )}>
        {BLOOMS_LEVELS.map((level) => {
          const Icon = level.icon;
          const isSelected = selectedLevels[level.id];

          return (
            <TooltipProvider key={level.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onLevelChange(level.id, !isSelected)}
                    className={cn(
                      "relative flex flex-col items-start p-2.5 rounded-lg border-2 transition-all duration-200",
                      "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1",
                      disabled && "opacity-50 cursor-not-allowed",
                      isSelected
                        ? cn(
                            level.bgColor,
                            level.borderColor,
                            "ring-1",
                            level.borderColor.replace('border-', 'ring-')
                          )
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className={cn(
                        "absolute top-1.5 right-1.5 w-2 h-2 rounded-full",
                        level.color.includes('red') && "bg-red-500",
                        level.color.includes('orange') && "bg-orange-500",
                        level.color.includes('yellow') && "bg-yellow-500",
                        level.color.includes('green') && "bg-green-500",
                        level.color.includes('blue') && "bg-blue-500",
                        level.color.includes('purple') && "bg-purple-500"
                      )} />
                    )}

                    <div className="flex items-center gap-1.5 w-full">
                      <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", level.color)} />
                      <span className={cn(
                        "text-xs font-semibold truncate",
                        isSelected ? level.color : "text-gray-700 dark:text-gray-300"
                      )}>
                        {level.name}
                      </span>
                    </div>

                    {!compact && (
                      <p className={cn(
                        "text-[10px] leading-tight mt-1 line-clamp-2",
                        isSelected
                          ? level.color.replace('text-', 'text-').replace('-600', '-700').replace('-400', '-300')
                          : "text-gray-500 dark:text-gray-400"
                      )}>
                        {level.description}
                      </p>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{level.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {level.description}
                    </p>
                    {showVerbs && (
                      <div className="pt-1">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          Action verbs:
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {level.verbs.slice(0, 4).join(', ')}...
                        </p>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Quick Select Options */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            BLOOMS_LEVELS.forEach((level) => onLevelChange(level.id, true));
          }}
          className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Select All
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            BLOOMS_LEVELS.forEach((level) => onLevelChange(level.id, false));
          }}
          className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Clear All
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            BLOOMS_LEVELS.forEach((level) => {
              const isLowerOrder = ['remember', 'understand', 'apply'].includes(level.id);
              onLevelChange(level.id, isLowerOrder);
            });
          }}
          className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
        >
          Lower Order
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            BLOOMS_LEVELS.forEach((level) => {
              const isHigherOrder = ['analyze', 'evaluate', 'create'].includes(level.id);
              onLevelChange(level.id, isHigherOrder);
            });
          }}
          className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
        >
          Higher Order
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get action verbs for selected Bloom's levels
 */
export function getBloomsVerbs(levels: Record<BloomsLevel, boolean>): string[] {
  return BLOOMS_LEVELS
    .filter((level) => levels[level.id])
    .flatMap((level) => level.verbs);
}

/**
 * Get prompt section for Bloom's Taxonomy
 */
export function buildBloomsPromptSection(levels: Record<BloomsLevel, boolean>): string {
  const selectedLevels = BLOOMS_LEVELS.filter((level) => levels[level.id]);

  if (selectedLevels.length === 0) {
    return '';
  }

  let prompt = "\n## BLOOM'S TAXONOMY REQUIREMENTS:\n";
  prompt += "Generate content that targets these cognitive levels:\n\n";

  selectedLevels.forEach((level) => {
    prompt += `### ${level.name.toUpperCase()} (${level.description})\n`;
    prompt += `Use action verbs like: ${level.verbs.join(', ')}\n\n`;
  });

  return prompt;
}
