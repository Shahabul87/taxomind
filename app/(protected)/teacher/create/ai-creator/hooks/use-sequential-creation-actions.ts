"use client";

/**
 * useSequentialCreationActions
 *
 * Encapsulates all sequential course-creation business logic that was
 * previously inlined in the AI Creator page component. This includes:
 *   - Modal open/close state
 *   - Created course ID tracking
 *   - Generate-confirmation dialog state
 *   - Building the SequentialCreationConfig from wizard form data
 *   - Starting, retrying, resuming, approving, aborting, and regenerating
 *   - Memoised modal-level form data slice
 *
 * The hook delegates to `useSequentialCreation()` for the actual SSE-based
 * creation pipeline and exposes a unified API consumed by page.tsx.
 */

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useSequentialCreation } from "@/hooks/use-sam-sequential-creation";
import type { CreationProgress } from "@/hooks/use-sam-sequential-creation/types";
import type { DbProgress } from "@/hooks/use-sam-sequential-creation/types";
import type { CourseCreationRequest } from "../types/sam-creator.types";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSequentialCreationActions(
  formData: CourseCreationRequest,
  router: ReturnType<typeof useRouter>,
) {
  // -----------------------------------------------------------------------
  // Local state
  // -----------------------------------------------------------------------
  const [isSequentialModalOpen, setIsSequentialModalOpen] = React.useState(false);
  const [createdCourseId, setCreatedCourseId] = React.useState<string | null>(null);
  const [showGenerateConfirm, setShowGenerateConfirm] = React.useState(false);

  // -----------------------------------------------------------------------
  // Underlying sequential-creation hook
  // -----------------------------------------------------------------------
  const {
    progress: sequentialProgress,
    isCreating: isSequentialCreating,
    error: sequentialError,
    resumableCourseId,
    dbProgress,
    regeneratingChapterId,
    startCreation: startSequentialCreation,
    resumeCreation,
    approveAndResumeCreation,
    regenerateChapter,
    cancel: cancelSequentialCreation,
    reset: resetSequentialCreation,
    dismissCreation,
  } = useSequentialCreation();

  // -----------------------------------------------------------------------
  // Open / close modal
  // -----------------------------------------------------------------------

  /**
   * Open modal for a **fresh** creation — resets all prior state so the
   * pipeline starts clean. Used by "Create with SAM" / coherence-proceed flows.
   */
  const handleOpenSequentialModal = React.useCallback(() => {
    resetSequentialCreation();
    setIsSequentialModalOpen(true);
  }, [resetSequentialCreation]);

  /**
   * Open modal for **resume** — preserves existing state (resumableCourseId,
   * dbProgress, etc.) so the resume handler can read them. Used by the
   * resume banner and the modal's internal Resume button.
   */
  const handleOpenSequentialModalForResume = React.useCallback(() => {
    setIsSequentialModalOpen(true);
  }, []);

  const handleCloseSequentialModal = React.useCallback(() => {
    if (!isSequentialCreating) {
      setIsSequentialModalOpen(false);
      resetSequentialCreation();
    }
  }, [isSequentialCreating, resetSequentialCreation]);

  // -----------------------------------------------------------------------
  // Build config from wizard form data
  // -----------------------------------------------------------------------
  const buildSequentialConfig = React.useCallback(() => ({
    courseTitle: formData.courseTitle || '',
    courseDescription: formData.courseShortOverview || '',
    targetAudience:
      formData.targetAudience === 'Custom (describe below)'
        ? (formData.customAudience.trim() || formData.targetAudience)
        : (formData.targetAudience || ''),
    difficulty: (formData.difficulty?.toLowerCase() || 'intermediate') as 'beginner' | 'intermediate' | 'advanced' | 'expert',
    totalChapters: formData.chapterCount,
    sectionsPerChapter: formData.sectionsPerChapter,
    learningObjectivesPerChapter: formData.learningObjectivesPerChapter,
    learningObjectivesPerSection: formData.learningObjectivesPerSection,
    courseGoals: formData.courseGoals,
    bloomsFocus: formData.bloomsFocus,
    preferredContentTypes: formData.preferredContentTypes,
    category: formData.courseCategory,
    subcategory: formData.courseSubcategory,
    courseIntent: formData.courseIntent,
    includeAssessments: formData.includeAssessments,
    duration: formData.duration,
    enableEscalationGate: formData.enableEscalationGate,
    fallbackPolicy: {
      haltRateThreshold: formData.fallbackHaltRateThreshold,
      haltOnExcessiveFallbacks: formData.haltOnExcessiveFallbacks,
    },
    // Teacher-approved blueprint (replaces AI planning when present)
    teacherBlueprint: formData.teacherBlueprint ? {
      chapters: formData.teacherBlueprint.chapters,
      northStarProject: formData.teacherBlueprint.northStarProject,
      confidence: formData.teacherBlueprint.confidence,
      riskAreas: formData.teacherBlueprint.riskAreas,
    } : undefined,
    // Enable parallel generation when a teacher blueprint exists.
    // Blueprint-driven mode disables all inter-chapter dependencies,
    // making chapters independently generable via Promise.allSettled.
    parallelMode: !!formData.teacherBlueprint,
  }), [formData]);

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  const isPipelinePausedError = React.useCallback((err?: string) => {
    if (!err) return false;
    return err.toLowerCase().includes('paused for human review');
  }, []);

  // -----------------------------------------------------------------------
  // Start sequential creation
  // -----------------------------------------------------------------------
  const handleStartSequentialCreation = React.useCallback(async () => {
    try {
      logger.info('[AI-CREATOR] Starting sequential course creation');

      const result = await startSequentialCreation(buildSequentialConfig());

      if (result.success && result.courseId) {
        setCreatedCourseId(result.courseId);

        logger.info('[AI-CREATOR] Sequential creation completed successfully', {
          courseId: result.courseId,
          chaptersCreated: result.chaptersCreated,
          sectionsCreated: result.sectionsCreated,
        });

        toast.success('Course created successfully!', {
          description: `${result.chaptersCreated} chapters and ${result.sectionsCreated} sections created.`,
        });

        // Step 3 shows an inline completion card with "View Course" button.
        // No auto-navigation — let the user click the link themselves.

        // Save to SAM memory
        if (typeof window !== 'undefined') {
          import('@/lib/sam/utils/sam-memory-system').then(({ samMemory }) => {
            samMemory.incrementSuccessfulGenerations();
          });
        }
      } else {
        if (isPipelinePausedError(result.error)) {
          toast.info('Pipeline paused for review', {
            description: 'Choose Continue, Heal & Resume, or Abort in the modal.',
          });
          return;
        }

        const isCancelled = result.error?.toLowerCase().includes('cancel');
        if (isCancelled) {
          logger.info('[AI-CREATOR] Course creation was cancelled by user');
        } else {
          logger.error('[AI-CREATOR] Sequential creation failed:', result.error);
        }
        toast.error(isCancelled ? 'Course creation cancelled' : 'Course creation failed', {
          description: isCancelled ? 'You can restart generation anytime.' : (result.error || 'An unexpected error occurred'),
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isCancelled = errorMsg.toLowerCase().includes('cancel');
      if (isCancelled) {
        logger.info('[AI-CREATOR] Course creation was cancelled by user');
      } else {
        logger.error('[AI-CREATOR] Error in sequential creation:', error);
      }
      if (!isCancelled) {
        toast.error('Failed to create course');
      }
    }
  }, [startSequentialCreation, buildSequentialConfig, isPipelinePausedError]);

  // -----------------------------------------------------------------------
  // Retry
  // -----------------------------------------------------------------------
  const handleRetrySequentialCreation = React.useCallback(async () => {
    await dismissCreation();
    await handleStartSequentialCreation();
  }, [dismissCreation, handleStartSequentialCreation]);

  // -----------------------------------------------------------------------
  // Resume from failed creation
  // -----------------------------------------------------------------------
  const handleResumeCreation = React.useCallback(async () => {
    if (!resumableCourseId) return;

    try {
      logger.info('[AI-CREATOR] Resuming course creation', { courseId: resumableCourseId });

      const result = await resumeCreation(resumableCourseId, buildSequentialConfig());

      if (result.success && result.courseId) {
        toast.success('Course resumed and completed!', {
          description: `${result.chaptersCreated} chapters and ${result.sectionsCreated} sections created.`,
        });
        setTimeout(() => {
          router.push(`/teacher/courses/${result.courseId}`);
        }, 1500);
      } else if (isPipelinePausedError(result.error)) {
        toast.info('Pipeline paused for review', {
          description: 'Choose Continue, Heal & Resume, or Abort in the modal.',
        });
      } else {
        toast.error('Resume failed', { description: result.error || 'An unexpected error occurred' });
      }
    } catch (error) {
      logger.error('[AI-CREATOR] Error resuming creation:', error);
      toast.error('Failed to resume course creation');
    }
  }, [resumableCourseId, resumeCreation, router, buildSequentialConfig, isPipelinePausedError]);

  // -----------------------------------------------------------------------
  // Approve + Continue
  // -----------------------------------------------------------------------
  const handleApproveContinue = React.useCallback(async () => {
    if (!resumableCourseId) return;

    try {
      const result = await approveAndResumeCreation(
        resumableCourseId,
        'approve_continue',
        buildSequentialConfig(),
      );

      if (result.success && result.courseId) {
        toast.success('Course resumed and completed!', {
          description: `${result.chaptersCreated} chapters and ${result.sectionsCreated} sections created.`,
        });
        setTimeout(() => {
          router.push(`/teacher/courses/${result.courseId}`);
        }, 1500);
      } else {
        toast.error('Resume failed', { description: result.error || 'An unexpected error occurred' });
      }
    } catch (error) {
      logger.error('[AI-CREATOR] Error approving and resuming:', error);
      toast.error('Failed to approve and resume course creation');
    }
  }, [approveAndResumeCreation, resumableCourseId, buildSequentialConfig, router]);

  // -----------------------------------------------------------------------
  // Approve + Heal
  // -----------------------------------------------------------------------
  const handleApproveHeal = React.useCallback(async () => {
    if (!resumableCourseId) return;

    try {
      const result = await approveAndResumeCreation(
        resumableCourseId,
        'approve_heal',
        buildSequentialConfig(),
      );

      if (result.success && result.courseId) {
        toast.success('Course resumed and completed!', {
          description: `${result.chaptersCreated} chapters and ${result.sectionsCreated} sections created.`,
        });
        setTimeout(() => {
          router.push(`/teacher/courses/${result.courseId}`);
        }, 1500);
      } else {
        toast.error('Resume failed', { description: result.error || 'An unexpected error occurred' });
      }
    } catch (error) {
      logger.error('[AI-CREATOR] Error approving healing and resuming:', error);
      toast.error('Failed to approve healing and resume');
    }
  }, [approveAndResumeCreation, resumableCourseId, buildSequentialConfig, router]);

  // -----------------------------------------------------------------------
  // Abort paused pipeline
  // -----------------------------------------------------------------------
  const handleAbortPausedPipeline = React.useCallback(async () => {
    if (!resumableCourseId) return;

    try {
      const res = await fetch('/api/sam/course-creation/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: resumableCourseId,
          decision: 'reject_abort',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to abort paused pipeline');
      }

      toast.info('Pipeline aborted', {
        description: 'Generated content up to this point has been kept.',
      });
      await dismissCreation();
      setIsSequentialModalOpen(false);
    } catch (error) {
      logger.error('[AI-CREATOR] Error aborting paused pipeline:', error);
      toast.error('Failed to abort paused pipeline');
    }
  }, [dismissCreation, resumableCourseId]);

  // -----------------------------------------------------------------------
  // Chapter regeneration
  // -----------------------------------------------------------------------
  const handleRegenerateChapter = React.useCallback((chapterId: string, position: number) => {
    if (!createdCourseId) return;
    regenerateChapter(createdCourseId, chapterId, position);
  }, [createdCourseId, regenerateChapter]);

  // -----------------------------------------------------------------------
  // Memoised modal form data slice (prevents SequentialCreationModal re-renders)
  // -----------------------------------------------------------------------
  const modalFormData = React.useMemo(() => ({
    courseTitle: formData.courseTitle || '',
    targetAudience: formData.targetAudience === 'Custom (describe below)'
      ? (formData.customAudience || formData.targetAudience)
      : formData.targetAudience,
    difficulty: formData.difficulty,
    chapterCount: formData.chapterCount,
    sectionsPerChapter: formData.sectionsPerChapter,
  }), [formData.courseTitle, formData.targetAudience, formData.customAudience, formData.difficulty, formData.chapterCount, formData.sectionsPerChapter]);

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------
  return {
    // State
    isSequentialModalOpen,
    createdCourseId,
    showGenerateConfirm,
    setShowGenerateConfirm,

    // Sequential creation state (forwarded from useSequentialCreation)
    sequentialProgress,
    isSequentialCreating,
    sequentialError,
    resumableCourseId,
    dbProgress,
    regeneratingChapterId,
    modalFormData,

    // Actions
    handleOpenSequentialModal,
    handleOpenSequentialModalForResume,
    handleCloseSequentialModal,
    handleStartSequentialCreation,
    handleRetrySequentialCreation,
    handleResumeCreation,
    handleApproveContinue,
    handleApproveHeal,
    handleAbortPausedPipeline,
    handleRegenerateChapter,
    cancelSequentialCreation,
    resetSequentialCreation,
    dismissCreation,
  } as const;
}

// ---------------------------------------------------------------------------
// Re-export types that page.tsx may need for typing the return value
// ---------------------------------------------------------------------------
export type { CreationProgress, DbProgress };
