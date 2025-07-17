"use client";

import { useEffect } from 'react';

interface SimpleCourseContextProps {
  course?: {
    id: string;
    title: string;
    description?: string | null;
    whatYouWillLearn?: string[];
    isPublished: boolean;
    categoryId?: string | null;
    price?: number | null;
    imageUrl?: string | null;
    chapters?: Array<{
      id: string;
      title: string;
      description?: string | null;
      isPublished: boolean;
      isFree?: boolean;
      position?: number;
      sections?: Array<{
        id: string;
        title: string;
        isPublished: boolean;
      }>;
    }>;
  };
  completionStatus?: {
    titleDesc?: boolean;
    learningObj?: boolean;
    chapters?: boolean;
    category?: boolean;
  };
}

export function SimpleCourseContext({
  course,
  completionStatus = {}
}: SimpleCourseContextProps) {
  useEffect(() => {
    console.log('🔄 SimpleCourseContext useEffect triggered with:', { course, completionStatus });
    // Inject basic context data into global scope for Enhanced SAM
    if (typeof window !== 'undefined' && course && course.id) {
      // Add context data to window for Enhanced SAM to access
      (window as any).courseContext = {
        entityType: 'course',
        entityId: course.id,
        entityData: {
          // Core course data
          title: course.title,
          description: course.description,
          whatYouWillLearn: course.whatYouWillLearn || [],
          learningObjectives: course.whatYouWillLearn || [], // Alias for clarity
          isPublished: course.isPublished,
          categoryId: course.categoryId,
          price: course.price,
          imageUrl: course.imageUrl,
          chapterCount: course.chapters?.length || 0,
          publishedChapters: course.chapters?.filter(c => c.isPublished).length || 0,
          
          // Complete chapter details for SAM
          chapters: course.chapters?.map((chapter, index) => ({
            id: chapter.id,
            title: chapter.title || `Chapter ${index + 1}`,
            description: chapter.description,
            isPublished: chapter.isPublished,
            isFree: chapter.isFree,
            position: chapter.position ?? index,
            sectionCount: chapter.sections?.length || 0,
            sections: chapter.sections?.map(section => ({
              id: section.id,
              title: section.title,
              isPublished: section.isPublished
            })) || []
          })) || [],
          
          // Add full course data for SAM context
          fullCourseData: {
            ...course,
            learningObjectivesText: course.whatYouWillLearn?.join('\n') || '',
            learningObjectivesHtml: course.whatYouWillLearn?.map(obj => `<li>${obj}</li>`).join('') || '',
            completionStatus: completionStatus,
            // Chapter summary for quick access
            chapterSummary: course.chapters?.map(ch => ({
              title: ch.title || 'Untitled Chapter',
              status: ch.isPublished ? 'published' : 'draft'
            })) || []
          }
        },
        completionStatus,
        workflow: {
          currentStep: calculateCurrentStep(course, completionStatus),
          nextAction: determineNextAction(course, completionStatus),
          progress: calculateProgress(completionStatus)
        }
      };

      // Trigger Enhanced SAM context update event
      setTimeout(() => {
        if ((window as any).enhancedSam?.injectContext) {
          try {
            (window as any).enhancedSam.injectContext({
              serverData: {
                entityType: 'course',
                entityId: course.id,
                entityData: (window as any).courseContext.entityData,
                relatedData: {
                  stats: {
                    chapterCount: course.chapters?.length || 0,
                    publishedChapters: course.chapters?.filter(c => c.isPublished).length || 0,
                    hasLearningObjectives: Boolean(course.whatYouWillLearn?.length),
                    hasCategory: Boolean(course.categoryId),
                    learningObjectivesCount: course.whatYouWillLearn?.length || 0
                  },
                  learningObjectives: {
                    raw: course.whatYouWillLearn || [],
                    text: course.whatYouWillLearn?.join('\n') || '',
                    html: course.whatYouWillLearn?.map(obj => `<li>${obj}</li>`).join('') || '',
                    count: course.whatYouWillLearn?.length || 0
                  },
                  chapters: course.chapters?.map((chapter, index) => ({
                    id: chapter.id,
                    title: chapter.title || `Chapter ${index + 1}`,
                    description: chapter.description,
                    isPublished: chapter.isPublished,
                    isFree: chapter.isFree,
                    position: chapter.position ?? index,
                    sectionCount: chapter.sections?.length || 0,
                    sections: chapter.sections?.map(section => ({
                      id: section.id,
                      title: section.title,
                      isPublished: section.isPublished
                    })) || []
                  })) || []
                },
                permissions: {
                  canEdit: true,
                  canDelete: true,
                  canPublish: !course.isPublished
                }
              },
              workflow: (window as any).courseContext.workflow,
              metadata: {
                capabilities: [
                  'content-generation',
                  'form-assistance',
                  'learning-objectives-generation',
                  'course-structure-analysis'
                ]
              }
            });
            console.log('✅ Enhanced SAM context successfully injected');
          } catch (error) {
            console.warn('⚠️ Enhanced SAM context injection failed:', error);
          }
        } else {
          console.log('ℹ️ Enhanced SAM not ready yet, context stored in window.courseContext');
        }
      }, 1000);
      
      // Also trigger a custom event for Enhanced SAM to listen to
      window.dispatchEvent(new CustomEvent('sam-context-update', {
        detail: {
          serverData: {
            entityType: 'course',
            entityId: course.id,
            entityData: (window as any).courseContext.entityData
          }
        }
      }));

      console.log('🔄 Simple course context injected:', (window as any).courseContext);
      console.log('📋 Available form data for SAM:', (window as any).courseContext.entityData.formData);
      
      // Force a test API call to ensure the Enhanced SAM API has the data
      setTimeout(async () => {
        try {
          const testResponse = await fetch('/api/sam/enhanced-universal-assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: 'Test message to verify context',
              context: {
                pageTitle: course.title,
                pageDescription: course.description,
                pageType: 'course',
                forms: [], // Will be populated by Enhanced SAM
                serverData: {
                  entityType: 'course',
                  entityId: course.id,
                  entityData: (window as any).courseContext.entityData
                },
                workflow: (window as any).courseContext.workflow
              },
              conversationHistory: []
            })
          });
          
          if (testResponse.ok) {
            console.log('✅ Enhanced SAM API test successful');
          } else {
            console.warn('⚠️ Enhanced SAM API test failed:', testResponse.status);
          }
        } catch (error) {
          console.warn('⚠️ Enhanced SAM API test error:', error);
        }
      }, 3000);
    }
  }, [course, completionStatus]);

  return null;
}

function calculateCurrentStep(course: any, completionStatus: any): number {
  let step = 0;
  if (course.title && course.description) step = 1;
  if (course.whatYouWillLearn?.length) step = 2;
  if (course.chapters?.length) step = 3;
  if (course.categoryId) step = 4;
  return step;
}

function determineNextAction(course: any, completionStatus: any): string {
  if (!course.title || !course.description) return 'add-title-description';
  if (!course.whatYouWillLearn?.length) return 'add-learning-objectives';
  if (!course.chapters?.length) return 'create-first-chapter';
  if (!course.categoryId) return 'set-category';
  if (!course.isPublished) return 'publish-course';
  return 'course-complete';
}

function calculateProgress(completionStatus: any): number {
  const total = Object.keys(completionStatus).length;
  const completed = Object.values(completionStatus).filter(Boolean).length;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}