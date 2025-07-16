/**
 * Course Page SAM Integration
 * 
 * This component shows how to integrate SAM with your course page forms
 * so that SAM can directly populate and control form fields.
 */

"use client";

import React, { useRef } from 'react';
import { FormAwareSamAssistant } from './form-aware-sam-assistant';

interface CoursePageSamIntegrationProps {
  courseId: string;
  courseData: {
    id: string;
    title: string;
    description: string | null;
    isPublished: boolean;
    categoryId: string | null;
    whatYouWillLearn: string[];
    chapters: Array<{
      id: string;
      title: string;
      description: string | null;
      position: number;
      isPublished: boolean;
      isFree: boolean;
      sections: Array<{
        id: string;
        title: string;
        description: string | null;
        position: number;
        isPublished: boolean;
      }>;
    }>;
    attachments: Array<{
      id: string;
      name: string;
      url: string;
    }>;
    category?: {
      id: string;
      name: string;
    };
  };
  completionStatus: {
    titleDesc: boolean;
    learningObj: boolean;
    chapters: boolean;
    price: boolean;
    category: boolean;
    image: boolean;
    attachments: boolean;
  };
}

/**
 * Example: How to modify your existing course page to support SAM form integration
 * 
 * In your main course page component (page.tsx), you need to:
 * 
 * 1. Create refs for each form component
 * 2. Pass these refs to both the form components AND SAM
 * 3. Expose form methods through the refs
 */

// Example of modified form components that expose their form instance
export const EnhancedCourseLearningOutcomeForm = React.forwardRef<any, any>(
  ({ initialData, courseId }, ref) => {
    // Your existing form logic here
    // const form = useForm(); // react-hook-form instance - commented out for build
    
    // Expose form methods through ref
    React.useImperativeHandle(ref, () => ({
      // form,
      // setValue: form.setValue,
      // trigger: form.trigger,
      // handleSubmit: form.handleSubmit,
      // reset: form.reset
    }));
    
    // Rest of your component...
    return <div>Form Component</div>;
  }
);

EnhancedCourseLearningOutcomeForm.displayName = 'EnhancedCourseLearningOutcomeForm';

export const EnhancedChaptersForm = React.forwardRef<any, any>(
  ({ initialData, courseId, onSetIsCreating }, ref) => {
    const [isCreating, setIsCreating] = React.useState(false);
    // const form = useForm(); // commented out for build
    
    // Expose both form and state setter
    React.useImperativeHandle(ref, () => ({
      // form,
      // setValue: form.setValue,
      // trigger: form.trigger,
      // handleSubmit: form.handleSubmit,
      // reset: form.reset,
      setIsCreating
    }));
    
    // Notify parent when isCreating changes
    React.useEffect(() => {
      if (onSetIsCreating) {
        onSetIsCreating(isCreating);
      }
    }, [isCreating, onSetIsCreating]);
    
    return <div>Chapters Form Component</div>;
  }
);

EnhancedChaptersForm.displayName = 'EnhancedChaptersForm';

// Main integration component for the course page
export function CoursePageWithSAM({
  courseId,
  courseData,
  completionStatus,
  categories,
  children
}: CoursePageSamIntegrationProps & { categories: any[], children?: React.ReactNode }) {
  // Create refs for form components
  const learningObjectivesFormRef = useRef<any>(null);
  const chaptersFormRef = useRef<any>(null);
  const titleFormRef = useRef<any>(null);
  const descriptionFormRef = useRef<any>(null);
  
  // State for chapters form
  const [isCreatingChapter, setIsCreatingChapter] = React.useState(false);

  return (
    <div className="relative">
      {/* Your existing course page content */}
      {children}
      
      {/* SAM Assistant with form integration */}
      <FormAwareSamAssistant
        courseId={courseId}
        courseData={courseData}
        completionStatus={completionStatus}
        learningObjectivesForm={learningObjectivesFormRef.current?.form}
        chaptersForm={chaptersFormRef.current?.form}
        titleForm={titleFormRef.current?.form}
        descriptionForm={descriptionFormRef.current?.form}
        setIsCreatingChapter={(value) => {
          // Control the chapters form creating state
          if (chaptersFormRef.current?.setIsCreating) {
            chaptersFormRef.current.setIsCreating(value);
          }
          setIsCreatingChapter(value);
        }}
        variant="floating"
      />
    </div>
  );
}

/**
 * Complete Example: Modifying your course page.tsx
 * 
 * In your page.tsx file:
 * 
 * import { CoursePageWithSAM } from './_components/course-page-sam-integration';
 * 
 * export default async function CourseIdPage({ params }) {
 *   // Your existing data fetching...
 *   
 *   return (
 *     <CoursePageWithSAM
 *       courseId={params.courseId}
 *       courseData={course}
 *       completionStatus={completionStatus}
 *       categories={categories}
 *     >
 *       // Your existing page content, but with modified form components
 *       <EnhancedCourseLearningOutcomeForm
 *         ref={learningObjectivesFormRef}
 *         initialData={course}
 *         courseId={course.id}
 *       />
 *       
 *       <EnhancedChaptersForm
 *         ref={chaptersFormRef}
 *         initialData={course}
 *         courseId={course.id}
 *         onSetIsCreating={setIsCreatingChapter}
 *       />
 *     </CoursePageWithSAM>
 *   );
 * }
 * 
 * Alternative: Direct Form Access Pattern
 * 
 * If you can't modify the existing forms, you can use DOM manipulation:
 */

export function DirectFormAccessSAM({ courseId, courseData, completionStatus }: CoursePageSamIntegrationProps) {
  
  const handleUpdateLearningObjectives = React.useCallback(async (objectives: string[]) => {
    // Find the form in the DOM
    const form = document.querySelector('[data-form="learning-objectives"]');
    const editor = form?.querySelector('.tiptap-editor');
    
    if (editor) {
      // Update the editor content directly
      const htmlContent = `<ul class="list-disc pl-6 space-y-1 mb-3">${
        objectives.map(obj => `<li class="text-slate-800 dark:text-slate-200 leading-relaxed">${obj}</li>`).join('')
      }</ul>`;
      
      // Trigger change event
      const event = new Event('input', { bubbles: true });
      editor.dispatchEvent(event);
      
      // Find and click the save button
      const saveButton = form?.querySelector('button[type="submit"]');
      if (saveButton) {
        (saveButton as HTMLButtonElement).click();
      }
    }
  }, []);
  
  const handleUpdateChapters = React.useCallback(async (chapters: any[]) => {
    // Find the "Add Chapter" button
    const addButton = document.querySelector('button:has(svg.lucide-plus-circle)');
    
    if (addButton) {
      // Click to show the form
      (addButton as HTMLButtonElement).click();
      
      // Wait for form to appear
      setTimeout(() => {
        const input = document.querySelector('input[name="title"]') as HTMLInputElement;
        if (input) {
          // Set the value
          input.value = chapters[0].title;
          
          // Trigger change event
          const event = new Event('input', { bubbles: true });
          input.dispatchEvent(event);
          
          // Focus for user to review
          input.focus();
          input.select();
        }
      }, 100);
    }
  }, []);
  
  return (
    <FormAwareSamAssistant
      courseId={courseId}
      courseData={courseData}
      completionStatus={completionStatus}
      onUpdateLearningObjectives={handleUpdateLearningObjectives}
      onUpdateChapters={handleUpdateChapters}
      variant="floating"
    />
  );
}