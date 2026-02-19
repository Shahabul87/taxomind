"use client";

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

interface SimpleChapterContextProps {
  chapter?: {
    id: string;
    title: string;
    description?: string | null;
    isPublished: boolean;
    isFree?: boolean;
    position?: number;
    courseId: string;
    courseTitle?: string;
    sections?: Array<{
      id: string;
      title: string;
      isPublished: boolean;
      position?: number;
      type?: string | null;
    }>;
  };
  completionStatus?: {
    titleDesc?: boolean;
    content?: boolean;
    sections?: boolean;
    video?: boolean;
  };
}

/**
 * SimpleChapterContext - Injects chapter data into window for SAM to access
 *
 * This component mirrors SimpleCourseContext but for chapter-level pages.
 * It injects chapter context into window.chapterContext so SAMAssistant
 * can provide context-aware responses about the chapter being edited.
 */
export function SimpleChapterContext({
  chapter,
  completionStatus = {}
}: SimpleChapterContextProps) {
  useEffect(() => {
    // Inject chapter context data into global scope for SAM
    if (typeof window !== 'undefined' && chapter && chapter.id) {
      const windowWithChapterContext = window as Window & {
        chapterContext?: Record<string, unknown>;
      };
      // Add context data to window for SAM to access
      windowWithChapterContext.chapterContext = {
        entityType: 'chapter',
        entityId: chapter.id,
        entityData: {
          // Core chapter data
          title: chapter.title,
          description: chapter.description,
          isPublished: chapter.isPublished,
          position: chapter.position,

          // Parent course info
          courseId: chapter.courseId,
          courseTitle: chapter.courseTitle,

          // Sections info
          sectionCount: chapter.sections?.length || 0,
          sections: chapter.sections?.map((section, index) => ({
            id: section.id,
            title: section.title || `Section ${index + 1}`,
            isPublished: section.isPublished,
            position: section.position ?? index,
            contentType: section.type,
          })) || [],

          // Full chapter data for detailed context
          fullChapterData: {
            ...chapter,
            completionStatus: completionStatus,
            sectionSummary: chapter.sections?.map(s => ({
              title: s.title || 'Untitled Section',
              status: s.isPublished ? 'published' : 'draft'
            })) || []
          }
        },
        completionStatus,
        workflow: {
          currentStep: calculateCurrentStep(chapter, completionStatus),
          nextAction: determineNextAction(chapter, completionStatus),
          progress: calculateProgress(completionStatus)
        }
      };

      // Trigger SAM context update event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('sam-context-update', {
          detail: {
            serverData: {
              entityType: 'chapter',
              entityId: chapter.id,
              entityData: (window as Window & { chapterContext?: { entityData?: unknown } }).chapterContext?.entityData
            }
          }
        }));

        logger.debug('[SimpleChapterContext] Context injected:', chapter.title);
      }, 100);
    }
  }, [chapter, completionStatus]);

  return null;
}

function calculateCurrentStep(chapter: SimpleChapterContextProps['chapter'], completionStatus: SimpleChapterContextProps['completionStatus']): number {
  let step = 0;
  if (chapter?.title && chapter?.description) step = 1;
  if (chapter?.sections?.length) step = 2;
  if (completionStatus?.content) step = 3;
  if (chapter?.isPublished) step = 4;
  return step;
}

function determineNextAction(chapter: SimpleChapterContextProps['chapter'], completionStatus: SimpleChapterContextProps['completionStatus']): string {
  if (!chapter?.title || !chapter?.description) return 'add-title-description';
  if (!chapter?.sections?.length) return 'create-first-section';
  if (!completionStatus?.content) return 'add-content';
  if (!chapter?.isPublished) return 'publish-chapter';
  return 'chapter-complete';
}

function calculateProgress(completionStatus: SimpleChapterContextProps['completionStatus']): number {
  if (!completionStatus) return 0;
  const total = Object.keys(completionStatus).length;
  const completed = Object.values(completionStatus).filter(Boolean).length;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}
