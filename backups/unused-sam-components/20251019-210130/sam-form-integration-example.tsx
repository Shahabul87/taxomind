/**
 * SAM Form Integration Example
 * 
 * This example shows how to integrate Intelligent SAM with your course forms
 * so that SAM can directly update learning objectives and chapters.
 */

"use client";

import { useCallback, useRef } from 'react';
import { IntelligentSamIntegration } from './intelligent-sam-integration';
import { toast } from 'sonner';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

// Example of how to integrate SAM in your course page component
export function SamFormIntegrationExample({ 
  courseId,
  courseData,
  completionStatus 
}: any) {
  const router = useRouter();
  
  // Refs to access form methods (you would get these from your actual forms)
  const learningObjectivesFormRef = useRef<any>(null);
  const chaptersFormRef = useRef<any>(null);

  // Callback to update learning objectives
  const handleUpdateLearningObjectives = useCallback(async (objectives: string[]) => {
    try {
      // Convert objectives array to HTML format that the form expects
      const htmlContent = `<ul class="list-disc pl-6 space-y-1 mb-3">${
        objectives.map(obj => `<li class="text-slate-800 dark:text-slate-200 leading-relaxed">${obj}</li>`).join('')
      }</ul>`;

      // Update the course via API
      await axios.patch(`/api/courses/${courseId}`, {
        whatYouWillLearn: objectives
      });

      toast.success("Learning objectives updated successfully!");
      router.refresh();
      
      // If you have access to the form instance, you can also update it directly:
      // learningObjectivesFormRef.current?.setValue('whatYouWillLearn', htmlContent);
      
    } catch (error: any) {
      logger.error('Failed to update learning objectives:', error);
      toast.error('Failed to update learning objectives');
      throw error;
    }
  }, [courseId, router]);

  // Callback to update chapters
  const handleUpdateChapters = useCallback(async (chapters: any[]) => {
    try {
      // Create chapters one by one via API
      for (const chapter of chapters) {
        await axios.post(`/api/courses/${courseId}/chapters`, {
          title: chapter.title,
          description: chapter.description,
          position: chapter.position
        });
      }

      toast.success(`${chapters.length} chapters created successfully!`);
      router.refresh();
      
    } catch (error: any) {
      logger.error('Failed to create chapters:', error);
      toast.error('Failed to create chapters');
      throw error;
    }
  }, [courseId, router]);

  // Callback to update title
  const handleUpdateTitle = useCallback(async (title: string) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, { title });
      toast.success("Course title updated!");
      router.refresh();
    } catch (error: any) {
      logger.error('Failed to update title:', error);
      toast.error('Failed to update title');
      throw error;
    }
  }, [courseId, router]);

  // Callback to update description
  const handleUpdateDescription = useCallback(async (description: string) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, { description });
      toast.success("Course description updated!");
      router.refresh();
    } catch (error: any) {
      logger.error('Failed to update description:', error);
      toast.error('Failed to update description');
      throw error;
    }
  }, [courseId, router]);

  return (
    <IntelligentSamIntegration
      courseId={courseId}
      courseData={courseData}
      completionStatus={completionStatus}
      onUpdateLearningObjectives={handleUpdateLearningObjectives}
      onUpdateChapters={handleUpdateChapters}
      onUpdateTitle={handleUpdateTitle}
      onUpdateDescription={handleUpdateDescription}
      variant="floating"
    />
  );
}

/**
 * Alternative: Direct Form Integration
 * 
 * If you have direct access to react-hook-form instances, you can update them directly:
 */

import { useForm } from 'react-hook-form';

export function DirectFormIntegrationExample({ courseId, courseData, completionStatus }: any) {
  const router = useRouter();
  
  // Example form instances (these would come from your actual forms)
  const learningObjectivesForm = useForm();
  const chaptersForm = useForm();

  const handleUpdateLearningObjectives = useCallback((objectives: string[]) => {
    // Convert to HTML format
    const htmlContent = `<ul class="list-disc pl-6 space-y-1 mb-3">${
      objectives.map(obj => `<li class="text-slate-800 dark:text-slate-200 leading-relaxed">${obj}</li>`).join('')
    }</ul>`;
    
    // Update form value
    learningObjectivesForm.setValue('whatYouWillLearn', htmlContent);
    
    // Trigger form submission
    learningObjectivesForm.handleSubmit(async (values) => {
      // The form's onSubmit will handle the API call

    })();
  }, [learningObjectivesForm]);

  const handleUpdateChapters = useCallback((chapters: any[]) => {
    // Process chapters one by one
    chapters.forEach((chapter, index) => {
      // Set form values
      chaptersForm.setValue('title', chapter.title);
      
      // Submit form
      chaptersForm.handleSubmit(async (values) => {

      })();
      
      // Reset for next chapter
      chaptersForm.reset();
    });
  }, [chaptersForm]);

  return (
    <IntelligentSamIntegration
      courseId={courseId}
      courseData={courseData}
      completionStatus={completionStatus}
      onUpdateLearningObjectives={handleUpdateLearningObjectives}
      onUpdateChapters={handleUpdateChapters}
      variant="floating"
    />
  );
}

/**
 * Usage in your main course page:
 * 
 * 1. Import the component:
 *    import { SamFormIntegrationExample } from './_components/sam-form-integration-example';
 * 
 * 2. Add it to your page (replace the existing SamIntegration):
 *    <SamFormIntegrationExample
 *      courseId={params.courseId}
 *      courseData={{
 *        id: course.id,
 *        title: course.title || "Untitled Course",
 *        description: course.description,
 *        isPublished: course.isPublished,
 *        categoryId: course.categoryId,
 *        whatYouWillLearn: course.whatYouWillLearn || [],
 *        chapters: course.chapters,
 *        attachments: course.attachments,
 *        category: course.category
 *      }}
 *      completionStatus={completionStatus}
 *    />
 * 
 * 3. Now SAM can:
 *    - Generate and insert learning objectives
 *    - Create course chapters
 *    - Update course title and description
 *    - All with direct form updates!
 */