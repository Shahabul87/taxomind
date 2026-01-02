"use client";

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

interface SimpleSectionContextProps {
  section?: {
    id: string;
    title: string;
    description?: string | null;
    content?: string | null;
    contentType?: string | null;
    videoUrl?: string | null;
    isPublished: boolean;
    isFree?: boolean;
    position?: number;
    chapterId: string;
    chapterTitle?: string;
    courseId: string;
    courseTitle?: string;
  };
  completionStatus?: {
    title?: boolean;
    description?: boolean;
    content?: boolean;
    video?: boolean;
  };
}

/**
 * SimpleSectionContext - Injects section data into window for SAM to access
 *
 * This component mirrors SimpleCourseContext but for section-level pages.
 * It injects section context into window.sectionContext so SAMAssistant
 * can provide context-aware responses about the section being edited.
 */
export function SimpleSectionContext({
  section,
  completionStatus = {}
}: SimpleSectionContextProps) {
  useEffect(() => {
    // Inject section context data into global scope for SAM
    if (typeof window !== 'undefined' && section && section.id) {
      // Add context data to window for SAM to access
      (window as Window & { sectionContext?: unknown }).sectionContext = {
        entityType: 'section',
        entityId: section.id,
        entityData: {
          // Core section data
          title: section.title,
          description: section.description,
          content: section.content,
          contentType: section.contentType,
          videoUrl: section.videoUrl,
          isPublished: section.isPublished,
          isFree: section.isFree,
          position: section.position,

          // Parent chapter info
          chapterId: section.chapterId,
          chapterTitle: section.chapterTitle,

          // Parent course info
          courseId: section.courseId,
          courseTitle: section.courseTitle,

          // Full section data for detailed context
          fullSectionData: {
            ...section,
            completionStatus: completionStatus,
            // Strip HTML from content for summary
            contentPreview: section.content
              ? section.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 500)
              : null,
            hasVideo: !!section.videoUrl,
          }
        },
        completionStatus,
        workflow: {
          currentStep: calculateCurrentStep(section, completionStatus),
          nextAction: determineNextAction(section, completionStatus),
          progress: calculateProgress(completionStatus)
        }
      };

      // Trigger SAM context update event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('sam-context-update', {
          detail: {
            serverData: {
              entityType: 'section',
              entityId: section.id,
              entityData: (window as Window & { sectionContext?: { entityData?: unknown } }).sectionContext?.entityData
            }
          }
        }));

        logger.debug('[SimpleSectionContext] Context injected:', section.title);
      }, 100);
    }
  }, [section, completionStatus]);

  return null;
}

function calculateCurrentStep(section: SimpleSectionContextProps['section'], completionStatus: SimpleSectionContextProps['completionStatus']): number {
  let step = 0;
  if (section?.title) step = 1;
  if (section?.description) step = 2;
  if (section?.content || section?.videoUrl) step = 3;
  if (section?.isPublished) step = 4;
  return step;
}

function determineNextAction(section: SimpleSectionContextProps['section'], completionStatus: SimpleSectionContextProps['completionStatus']): string {
  if (!section?.title) return 'add-title';
  if (!section?.description) return 'add-description';
  if (!section?.content && !section?.videoUrl) return 'add-content-or-video';
  if (!section?.isPublished) return 'publish-section';
  return 'section-complete';
}

function calculateProgress(completionStatus: SimpleSectionContextProps['completionStatus']): number {
  if (!completionStatus) return 0;
  const total = Object.keys(completionStatus).length;
  const completed = Object.values(completionStatus).filter(Boolean).length;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}
