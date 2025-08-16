"use client";

import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import { IntelligentSamAssistant } from './intelligent-sam-assistant';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

// Form control context to share form refs
interface FormControlContext {
  // Form refs
  learningObjectivesFormRef: React.RefObject<any>;
  chaptersFormRef: React.RefObject<any>;
  titleFormRef: React.RefObject<any>;
  descriptionFormRef: React.RefObject<any>;
  
  // Form control methods
  setLearningObjectivesValue: (value: string) => void;
  setChapterTitle: (title: string) => void;
  setTitleValue: (title: string) => void;
  setDescriptionValue: (description: string) => void;
  
  // Form state
  isChapterFormCreating: boolean;
  setIsChapterFormCreating: (value: boolean) => void;
  
  // Submit methods
  submitLearningObjectives: () => void;
  submitChapter: () => void;
  submitTitle: () => void;
  submitDescription: () => void;
}

const FormContext = createContext<FormControlContext | null>(null);

export const useFormControl = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormControl must be used within FormControlProvider');
  }
  return context;
};

interface FormControlProviderProps {
  children: React.ReactNode;
  // Pass form instances from parent
  learningObjectivesForm?: any;
  chaptersForm?: any;
  titleForm?: any;
  descriptionForm?: any;
  // Pass form state setters
  setIsCreating?: (value: boolean) => void;
}

export function FormControlProvider({ 
  children,
  learningObjectivesForm,
  chaptersForm,
  titleForm,
  descriptionForm,
  setIsCreating
}: FormControlProviderProps) {
  const [isChapterFormCreating, setIsChapterFormCreating] = useState(false);
  
  // Form control methods
  const setLearningObjectivesValue = useCallback((value: string) => {
    if (learningObjectivesForm) {
      learningObjectivesForm.setValue('whatYouWillLearn', value);
      learningObjectivesForm.trigger('whatYouWillLearn');
    }
  }, [learningObjectivesForm]);

  const setChapterTitle = useCallback((title: string) => {
    if (chaptersForm) {
      // First, ensure the form is in creating mode
      if (setIsCreating) {
        setIsCreating(true);
      }
      setIsChapterFormCreating(true);
      
      // Set the value
      chaptersForm.setValue('title', title);
      chaptersForm.trigger('title');
      
      // Auto-focus the input if it exists
      setTimeout(() => {
        const input = document.querySelector('input[name="title"]') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }, 100);
    }
  }, [chaptersForm, setIsCreating]);

  const setTitleValue = useCallback((title: string) => {
    if (titleForm) {
      titleForm.setValue('title', title);
      titleForm.trigger('title');
    }
  }, [titleForm]);

  const setDescriptionValue = useCallback((description: string) => {
    if (descriptionForm) {
      descriptionForm.setValue('description', description);
      descriptionForm.trigger('description');
    }
  }, [descriptionForm]);

  // Submit methods
  const submitLearningObjectives = useCallback(() => {
    if (learningObjectivesForm) {
      learningObjectivesForm.handleSubmit((data: any) => {

      })();
    }
  }, [learningObjectivesForm]);

  const submitChapter = useCallback(() => {
    if (chaptersForm) {
      chaptersForm.handleSubmit((data: any) => {

      })();
    }
  }, [chaptersForm]);

  const submitTitle = useCallback(() => {
    if (titleForm) {
      titleForm.handleSubmit((data: any) => {

      })();
    }
  }, [titleForm]);

  const submitDescription = useCallback(() => {
    if (descriptionForm) {
      descriptionForm.handleSubmit((data: any) => {

      })();
    }
  }, [descriptionForm]);

  const value: FormControlContext = {
    learningObjectivesFormRef: { current: learningObjectivesForm },
    chaptersFormRef: { current: chaptersForm },
    titleFormRef: { current: titleForm },
    descriptionFormRef: { current: descriptionForm },
    setLearningObjectivesValue,
    setChapterTitle,
    setTitleValue,
    setDescriptionValue,
    isChapterFormCreating,
    setIsChapterFormCreating,
    submitLearningObjectives,
    submitChapter,
    submitTitle,
    submitDescription
  };

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
}

interface FormAwareSamAssistantProps {
  courseId: string;
  courseData: any;
  completionStatus: any;
  // Form instances
  learningObjectivesForm?: any;
  chaptersForm?: any;
  titleForm?: any;
  descriptionForm?: any;
  // Form state setters
  setIsCreatingChapter?: (value: boolean) => void;
  variant?: 'floating' | 'embedded';
}

export function FormAwareSamAssistant({
  courseId,
  courseData,
  completionStatus,
  learningObjectivesForm,
  chaptersForm,
  titleForm,
  descriptionForm,
  setIsCreatingChapter,
  variant = 'floating'
}: FormAwareSamAssistantProps) {
  const router = useRouter();

  // Handle learning objectives update
  const handleUpdateLearningObjectives = useCallback(async (objectives: string[]) => {
    try {
      // Convert to HTML format
      const htmlContent = `<ul class="list-disc pl-6 space-y-1 mb-3">${
        objectives.map(obj => `<li class="text-slate-800 dark:text-slate-200 leading-relaxed">${obj}</li>`).join('')
      }</ul>`;

      // Update form directly
      if (learningObjectivesForm) {
        learningObjectivesForm.setValue('whatYouWillLearn', htmlContent);
        learningObjectivesForm.trigger('whatYouWillLearn');
        
        // Submit the form
        await learningObjectivesForm.handleSubmit(async (values: any) => {

        })();
        
        toast.success("Learning objectives populated in form!");
      } else {
        // Fallback to API if form is not available
        const response = await fetch(`/api/courses/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ whatYouWillLearn: objectives })
        });
        
        if (!response.ok) throw new Error('Failed to update');
        
        toast.success("Learning objectives updated!");
        router.refresh();
      }
    } catch (error) {
      logger.error('Failed to update learning objectives:', error);
      toast.error('Failed to update learning objectives');
    }
  }, [courseId, learningObjectivesForm, router]);

  // Handle chapters update - populate form instead of creating directly
  const handleUpdateChapters = useCallback(async (chapters: any[]) => {
    try {
      if (chaptersForm && setIsCreatingChapter) {
        // Process chapters one by one
        for (let i = 0; i < chapters.length; i++) {
          const chapter = chapters[i];
          
          // Show the create form
          setIsCreatingChapter(true);
          
          // Wait a bit for the form to appear
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Set the chapter title in the form
          chaptersForm.setValue('title', chapter.title);
          chaptersForm.trigger('title');
          
          // Focus on the input
          const input = document.querySelector('input[name="title"]') as HTMLInputElement;
          if (input) {
            input.focus();
            input.select();
          }
          
          toast.info(`Chapter ${i + 1} of ${chapters.length} populated in form. Please review and submit.`);
          
          // Only populate one at a time - user needs to submit before next
          break;
        }
        
        // Store remaining chapters for later
        if (chapters.length > 1) {
          sessionStorage.setItem('sam_pending_chapters', JSON.stringify(chapters.slice(1)));
          toast.info(`${chapters.length - 1} more chapters ready. Submit this one to continue.`);
        }
      } else {
        // Fallback to API
        for (const chapter of chapters) {
          await fetch(`/api/courses/${courseId}/chapters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: chapter.title,
              description: chapter.description,
              position: chapter.position
            })
          });
        }
        
        toast.success(`${chapters.length} chapters created!`);
        router.refresh();
      }
    } catch (error) {
      logger.error('Failed to update chapters:', error);
      toast.error('Failed to update chapters');
    }
  }, [courseId, chaptersForm, setIsCreatingChapter, router]);

  // Handle title update
  const handleUpdateTitle = useCallback(async (title: string) => {
    try {
      if (titleForm) {
        titleForm.setValue('title', title);
        titleForm.trigger('title');
        toast.success("Title populated in form!");
      } else {
        await fetch(`/api/courses/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title })
        });
        toast.success("Title updated!");
        router.refresh();
      }
    } catch (error) {
      logger.error('Failed to update title:', error);
      toast.error('Failed to update title');
    }
  }, [courseId, titleForm, router]);

  // Handle description update
  const handleUpdateDescription = useCallback(async (description: string) => {
    try {
      if (descriptionForm) {
        descriptionForm.setValue('description', description);
        descriptionForm.trigger('description');
        toast.success("Description populated in form!");
      } else {
        await fetch(`/api/courses/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description })
        });
        toast.success("Description updated!");
        router.refresh();
      }
    } catch (error) {
      logger.error('Failed to update description:', error);
      toast.error('Failed to update description');
    }
  }, [courseId, descriptionForm, router]);

  // Handle chapter deletion
  const handleDeleteChapters = useCallback(async (chapterIds: string[]) => {
    try {
      // Delete chapters via API
      for (const chapterId of chapterIds) {
        await fetch(`/api/courses/${courseId}/chapters/${chapterId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      toast.success(`${chapterIds.length} chapters deleted!`);
      router.refresh();
    } catch (error) {
      logger.error('Failed to delete chapters:', error);
      toast.error('Failed to delete chapters');
    }
  }, [courseId, router]);

  return (
    <FormControlProvider
      learningObjectivesForm={learningObjectivesForm}
      chaptersForm={chaptersForm}
      titleForm={titleForm}
      descriptionForm={descriptionForm}
      setIsCreating={setIsCreatingChapter}
    >
      <IntelligentSamAssistant
        courseId={courseId}
        courseData={courseData}
        completionStatus={completionStatus}
        onUpdateLearningObjectives={handleUpdateLearningObjectives}
        onUpdateChapters={handleUpdateChapters}
        onUpdateTitle={handleUpdateTitle}
        onUpdateDescription={handleUpdateDescription}
        onDeleteChapters={handleDeleteChapters}
        variant={variant}
      />
    </FormControlProvider>
  );
}

/**
 * Usage in Course Page:
 * 
 * 1. Get form instances from your forms:
 *    const learningObjectivesForm = useForm(); // from learning objectives component
 *    const chaptersForm = useForm(); // from chapters component
 * 
 * 2. Pass them to FormAwareSamAssistant:
 *    <FormAwareSamAssistant
 *      courseId={courseId}
 *      courseData={courseData}
 *      completionStatus={completionStatus}
 *      learningObjectivesForm={learningObjectivesForm}
 *      chaptersForm={chaptersForm}
 *      setIsCreatingChapter={setIsCreating}
 *    />
 * 
 * 3. SAM will now:
 *    - Populate form fields directly when generating content
 *    - Show the chapter creation form when creating chapters
 *    - Focus on inputs for user convenience
 *    - Guide users through multi-step processes
 */