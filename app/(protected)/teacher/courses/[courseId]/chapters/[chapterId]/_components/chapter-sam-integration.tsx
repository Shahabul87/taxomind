"use client";

import { useEffect, useState } from 'react';
import { useEnhancedSam } from '../../../../../_components/enhanced-sam-provider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import axios from 'axios';

interface ChapterSamIntegrationProps {
  chapter: any;
  courseId: string;
  chapterId: string;
}

export function ChapterSamIntegration({ chapter, courseId, chapterId }: ChapterSamIntegrationProps) {
  const { refreshPageData, injectPageContext } = useEnhancedSam();
  const router = useRouter();
  const [formRefs, setFormRefs] = useState<{
    titleForm?: HTMLFormElement;
    descriptionForm?: HTMLFormElement;
    learningOutcomeForm?: HTMLFormElement;
    accessForm?: HTMLFormElement;
    sectionForm?: HTMLFormElement;
  }>({});

  // Update SAM with comprehensive chapter context
  useEffect(() => {
    // Inject chapter-specific context into Enhanced SAM
    injectPageContext({
      serverData: {
        entityType: 'chapter',
        entityId: chapterId,
        entityData: {
          id: chapter.id,
          title: chapter.title,
          description: chapter.description,
          position: chapter.position,
          isPublished: chapter.isPublished,
          isFree: chapter.isFree,
          learningOutcomes: chapter.learningOutcomes,
          videoUrl: chapter.videoUrl,
          createdAt: chapter.createdAt,
          updatedAt: chapter.updatedAt,
        },
        relatedData: {
          parent: { courseId },
          children: chapter.sections || [],
          stats: {
            sectionCount: chapter.sections?.length || 0,
            hasVideo: Boolean(chapter.videoUrl),
            hasLearningOutcomes: Boolean(chapter.learningOutcomes),
          }
        },
        permissions: {
          canEdit: true,
          canDelete: true,
          canPublish: !chapter.isPublished,
          canUnpublish: chapter.isPublished,
        }
      },
      metadata: {
        capabilities: [
          'update-chapter-details',
          'generate-learning-outcomes',
          'create-sections',
          'manage-access',
          'publish-chapter'
        ]
      }
    });
    
    // Also refresh page data for form detection
    const timer = setTimeout(() => {
      refreshPageData();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [chapter, courseId, chapterId, refreshPageData, injectPageContext]);

  // Form interaction functions that SAM can use
  const formInteractions = {
    
    // Title form interaction
    updateChapterTitle: async (title: string) => {
      try {
        // Try to find and populate the title form
        const titleForm = document.querySelector('form[data-form="chapter-title"]') as HTMLFormElement;
        const titleInput = titleForm?.querySelector('input[name="title"]') as HTMLInputElement;
        
        if (titleInput) {
          // Fill the form
          titleInput.value = title;
          titleInput.dispatchEvent(new Event('input', { bubbles: true }));
          titleInput.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Try to submit the form
          const submitButton = titleForm?.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (submitButton && !submitButton.disabled) {
            submitButton.click();
            toast.success('Chapter title updated!');
          }
        } else {
          // Fallback to API
          await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, {
            title: title
          });
          toast.success('Chapter title updated!');
          router.refresh();
        }
      } catch (error) {
        console.error('Failed to update chapter title:', error);
        toast.error('Failed to update chapter title');
      }
    },

    // Description form interaction
    updateChapterDescription: async (description: string) => {
      try {
        // Try to find and populate the description form
        const descForm = document.querySelector('form[data-form="chapter-description"]') as HTMLFormElement;
        const descTextarea = descForm?.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
        
        if (descTextarea) {
          // Fill the form
          descTextarea.value = description;
          descTextarea.dispatchEvent(new Event('input', { bubbles: true }));
          descTextarea.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Try to submit the form
          const submitButton = descForm?.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (submitButton && !submitButton.disabled) {
            submitButton.click();
            toast.success('Chapter description updated!');
          }
        } else {
          // Fallback to API
          await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, {
            description: description
          });
          toast.success('Chapter description updated!');
          router.refresh();
        }
      } catch (error) {
        console.error('Failed to update chapter description:', error);
        toast.error('Failed to update chapter description');
      }
    },

    // Learning outcomes form interaction
    updateLearningOutcomes: async (outcomes: string) => {
      try {
        // Try to find and populate the learning outcomes form
        const outcomesForm = document.querySelector('form[data-form="chapter-learning-outcomes"]') as HTMLFormElement;
        const outcomesTextarea = outcomesForm?.querySelector('textarea[name="learningOutcomes"]') as HTMLTextAreaElement;
        
        if (outcomesTextarea) {
          // Fill the form
          outcomesTextarea.value = outcomes;
          outcomesTextarea.dispatchEvent(new Event('input', { bubbles: true }));
          outcomesTextarea.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Try to submit the form
          const submitButton = outcomesForm?.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (submitButton && !submitButton.disabled) {
            submitButton.click();
            toast.success('Learning outcomes updated!');
          }
        } else {
          // Fallback to API
          await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, {
            learningOutcomes: outcomes
          });
          toast.success('Learning outcomes updated!');
          router.refresh();
        }
      } catch (error) {
        console.error('Failed to update learning outcomes:', error);
        toast.error('Failed to update learning outcomes');
      }
    },

    // Section creation
    createSection: async (sectionData: { title: string; description?: string; position?: number }) => {
      try {
        await axios.post(`/api/courses/${courseId}/chapters/${chapterId}/sections`, {
          title: sectionData.title,
          description: sectionData.description || '',
          position: sectionData.position || (chapter.sections.length + 1)
        });
        toast.success('Section created successfully!');
        router.refresh();
      } catch (error) {
        console.error('Failed to create section:', error);
        toast.error('Failed to create section');
      }
    },

    // Multiple sections creation
    createMultipleSections: async (sections: Array<{ title: string; description?: string }>) => {
      try {
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          await axios.post(`/api/courses/${courseId}/chapters/${chapterId}/sections`, {
            title: section.title,
            description: section.description || '',
            position: chapter.sections.length + i + 1
          });
          
          toast.success(`Section ${i + 1} of ${sections.length} created: ${section.title}`);
          
          // Small delay between requests
          if (i < sections.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        toast.success('All sections created successfully!');
        router.refresh();
      } catch (error) {
        console.error('Failed to create sections:', error);
        toast.error('Failed to create sections');
      }
    },

    // Chapter access settings
    updateChapterAccess: async (isFree: boolean) => {
      try {
        await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, {
          isFree: isFree
        });
        toast.success(`Chapter access updated to ${isFree ? 'free' : 'paid'}!`);
        router.refresh();
      } catch (error) {
        console.error('Failed to update chapter access:', error);
        toast.error('Failed to update chapter access');
      }
    },

    // Publishing
    publishChapter: async () => {
      try {
        await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}/publish`);
        toast.success('Chapter published successfully!');
        router.refresh();
      } catch (error) {
        console.error('Failed to publish chapter:', error);
        toast.error('Failed to publish chapter');
      }
    },

    // Unpublishing
    unpublishChapter: async () => {
      try {
        await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}/unpublish`);
        toast.success('Chapter unpublished successfully!');
        router.refresh();
      } catch (error) {
        console.error('Failed to unpublish chapter:', error);
        toast.error('Failed to unpublish chapter');
      }
    }
  };

  // Make form interactions available globally for SAM
  useEffect(() => {
    // Store form interactions in window object for SAM to access
    (window as any).chapterFormInteractions = formInteractions;
    
    return () => {
      delete (window as any).chapterFormInteractions;
    };
  }, []);

  return null; // This component doesn't render anything, just provides context
}