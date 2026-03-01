"use client";

/**
 * Bloom's Feedback Button Component
 *
 * Phase 5: Confidence Calibration Learning Loop
 * Allows users to provide feedback on Bloom's Taxonomy classifications
 * to improve accuracy over time.
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ThumbsDown,
  Check,
  Loader2,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// TYPES
// ============================================================================

export type BloomsSubLevel = "BASIC" | "INTERMEDIATE" | "ADVANCED";

export interface BloomsFeedbackButtonProps {
  /** Hash of the content being classified */
  contentHash: string;
  /** The predicted Bloom's level (1-6) */
  predictedLevel: number;
  /** The predicted sub-level (optional) */
  predictedSubLevel?: BloomsSubLevel;
  /** The predicted confidence (0-1) */
  predictedConfidence?: number;
  /** Callback when feedback is submitted */
  onFeedback?: (feedback: FeedbackSubmission) => void;
  /** Course ID for context */
  courseId?: string;
  /** Section ID for context */
  sectionId?: string;
  /** The content that was classified (for API submission) */
  content?: string;
  /** Custom API endpoint */
  apiEndpoint?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Show as icon only */
  iconOnly?: boolean;
}

export interface FeedbackSubmission {
  actualLevel: number;
  actualSubLevel?: BloomsSubLevel;
  feedbackType: "EXPLICIT" | "IMPLICIT" | "EXPERT";
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BLOOMS_LEVELS = [
  {
    level: 1,
    name: "Remember",
    color: "bg-red-500",
    description: "Recall facts and basic concepts",
  },
  {
    level: 2,
    name: "Understand",
    color: "bg-orange-500",
    description: "Explain ideas or concepts",
  },
  {
    level: 3,
    name: "Apply",
    color: "bg-yellow-500",
    description: "Use information in new situations",
  },
  {
    level: 4,
    name: "Analyze",
    color: "bg-green-500",
    description: "Draw connections among ideas",
  },
  {
    level: 5,
    name: "Evaluate",
    color: "bg-blue-500",
    description: "Justify a decision or course of action",
  },
  {
    level: 6,
    name: "Create",
    color: "bg-purple-500",
    description: "Produce new or original work",
  },
];

const SUB_LEVELS: BloomsSubLevel[] = ["BASIC", "INTERMEDIATE", "ADVANCED"];

// ============================================================================
// COMPONENT
// ============================================================================

export function BloomsFeedbackButton({
  contentHash,
  predictedLevel,
  predictedSubLevel,
  predictedConfidence = 0.5,
  onFeedback,
  courseId,
  sectionId,
  content,
  apiEndpoint = "/api/sam/blooms-feedback",
  size = "md",
  className,
  iconOnly = false,
}: BloomsFeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedSubLevel, setSelectedSubLevel] =
    useState<BloomsSubLevel | null>(null);
  const [step, setStep] = useState<"level" | "sublevel">("level");

  const sizeClasses = {
    sm: "h-6 px-2 text-xs",
    md: "h-8 px-3 text-sm",
    lg: "h-10 px-4 text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const handleLevelSelect = useCallback((level: number) => {
    setSelectedLevel(level);
    setStep("sublevel");
  }, []);

  const handleSubLevelSelect = useCallback(
    async (subLevel: BloomsSubLevel) => {
      if (selectedLevel === null) return;

      setSelectedSubLevel(subLevel);
      setIsSubmitting(true);

      try {
        // Submit feedback to API
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: content ?? contentHash, // Use content if provided, otherwise hash
            contentHash,
            predictedLevel,
            predictedSubLevel,
            predictedConfidence,
            actualLevel: selectedLevel,
            actualSubLevel: subLevel,
            feedbackType: "EXPLICIT",
            courseId,
            sectionId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit feedback");
        }

        setSubmitted(true);

        // Notify parent
        onFeedback?.({
          actualLevel: selectedLevel,
          actualSubLevel: subLevel,
          feedbackType: "EXPLICIT",
        });

        // Close popover after brief success indication
        setTimeout(() => {
          setIsOpen(false);
          // Reset state after animation
          setTimeout(() => {
            setSubmitted(false);
            setSelectedLevel(null);
            setSelectedSubLevel(null);
            setStep("level");
          }, 300);
        }, 1000);
      } catch (error) {
        console.error("Failed to submit feedback:", error);
        // Reset to allow retry
        setSelectedSubLevel(null);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      selectedLevel,
      apiEndpoint,
      content,
      contentHash,
      predictedLevel,
      predictedSubLevel,
      predictedConfidence,
      courseId,
      sectionId,
      onFeedback,
    ]
  );

  const handleSkipSubLevel = useCallback(async () => {
    if (selectedLevel === null) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content ?? contentHash,
          contentHash,
          predictedLevel,
          predictedSubLevel,
          predictedConfidence,
          actualLevel: selectedLevel,
          feedbackType: "EXPLICIT",
          courseId,
          sectionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setSubmitted(true);

      onFeedback?.({
        actualLevel: selectedLevel,
        feedbackType: "EXPLICIT",
      });

      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => {
          setSubmitted(false);
          setSelectedLevel(null);
          setSelectedSubLevel(null);
          setStep("level");
        }, 300);
      }, 1000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedLevel,
    apiEndpoint,
    content,
    contentHash,
    predictedLevel,
    predictedSubLevel,
    predictedConfidence,
    courseId,
    sectionId,
    onFeedback,
  ]);

  const handleBack = useCallback(() => {
    setStep("level");
    setSelectedSubLevel(null);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when closing
      setTimeout(() => {
        setSelectedLevel(null);
        setSelectedSubLevel(null);
        setStep("level");
        setSubmitted(false);
      }, 300);
    }
  }, []);

  // Already submitted state
  if (submitted && !isOpen) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                "border-green-500 text-green-600 cursor-default",
                className
              )}
            >
              <Check className={cn(iconSizes[size], "mr-1")} />
              {!iconOnly && "Feedback sent"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Thank you for your feedback!</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            sizeClasses[size],
            "text-muted-foreground hover:text-foreground",
            className
          )}
        >
          {iconOnly ? (
            <ThumbsDown className={iconSizes[size]} />
          ) : (
            <>
              <MessageSquare className={cn(iconSizes[size], "mr-1")} />
              Wrong level?
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-0" align="start">
        {/* Success State */}
        {submitted ? (
          <div className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="font-medium text-green-600 dark:text-green-400">
              Thank you!
            </p>
            <p className="text-xs text-muted-foreground">
              Your feedback helps improve our classifications.
            </p>
          </div>
        ) : step === "level" ? (
          /* Level Selection Step */
          <div>
            <div className="px-3 py-2 border-b bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground">
                Current classification:{" "}
                <span className="text-foreground">
                  Level {predictedLevel} -{" "}
                  {BLOOMS_LEVELS[predictedLevel - 1]?.name}
                  {predictedSubLevel && ` (${predictedSubLevel})`}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Select the correct level:
              </p>
            </div>
            <div className="p-2 space-y-1">
              {BLOOMS_LEVELS.map((level) => (
                <button
                  key={level.level}
                  onClick={() => handleLevelSelect(level.level)}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors",
                    "hover:bg-muted",
                    predictedLevel === level.level &&
                      "ring-1 ring-primary bg-primary/5"
                  )}
                >
                  <div
                    className={cn("w-2 h-2 rounded-full flex-shrink-0", level.color)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {level.level}. {level.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {level.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Sub-Level Selection Step */
          <div>
            <div className="px-3 py-2 border-b bg-muted/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBack}
                  className="text-xs text-primary hover:underline"
                >
                  ← Back
                </button>
                <span className="text-xs text-muted-foreground">|</span>
                <span className="text-xs font-medium">
                  Level {selectedLevel} -{" "}
                  {BLOOMS_LEVELS[selectedLevel! - 1]?.name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Select the complexity level:
              </p>
            </div>
            <div className="p-2 space-y-1">
              {SUB_LEVELS.map((subLevel) => (
                <button
                  key={subLevel}
                  onClick={() => handleSubLevelSelect(subLevel)}
                  disabled={isSubmitting}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors",
                    "hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed",
                    selectedSubLevel === subLevel && "bg-primary/10"
                  )}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{subLevel}</p>
                    <p className="text-xs text-muted-foreground">
                      {subLevel === "BASIC" &&
                        "Simple, single-concept application"}
                      {subLevel === "INTERMEDIATE" &&
                        "Multiple concepts, some complexity"}
                      {subLevel === "ADVANCED" &&
                        "Complex, interconnected understanding"}
                    </p>
                  </div>
                  {isSubmitting && selectedSubLevel === subLevel && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </button>
              ))}
              <button
                onClick={handleSkipSubLevel}
                disabled={isSubmitting}
                className="w-full text-xs text-muted-foreground hover:text-foreground p-2 text-center"
              >
                {isSubmitting && selectedSubLevel === null ? (
                  <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                ) : (
                  "Skip sub-level selection"
                )}
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default BloomsFeedbackButton;
