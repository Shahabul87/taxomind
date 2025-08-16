/**
 * Intelligent SAM Assistant Integration
 * 
 * This component integrates the intelligent SAM assistant that can:
 * - Read and understand course context and forms
 * - Generate content based on Bloom's taxonomy
 * - Directly update forms with generated content
 * - Provide context-aware suggestions
 */

"use client";

import { useEffect } from 'react';
import { IntelligentSamAssistant } from './intelligent-sam-assistant';

interface IntelligentSamIntegrationProps {
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
  // Form update callbacks - these should be passed from parent component
  onUpdateLearningObjectives?: (objectives: string[]) => void;
  onUpdateChapters?: (chapters: any[]) => void;
  onUpdateTitle?: (title: string) => void;
  onUpdateDescription?: (description: string) => void;
  variant?: 'floating' | 'embedded';
}

export function IntelligentSamIntegration({ 
  courseId, 
  courseData, 
  completionStatus,
  onUpdateLearningObjectives,
  onUpdateChapters,
  onUpdateTitle,
  onUpdateDescription,
  variant = 'floating'
}: IntelligentSamIntegrationProps) {
  
  // Log capabilities on mount (for debugging)
  useEffect(() => {

  }, [courseData, onUpdateLearningObjectives, onUpdateChapters, onUpdateTitle, onUpdateDescription]);

  return (
    <IntelligentSamAssistant
      courseId={courseId}
      courseData={courseData}
      completionStatus={completionStatus}
      onUpdateLearningObjectives={onUpdateLearningObjectives}
      onUpdateChapters={onUpdateChapters}
      onUpdateTitle={onUpdateTitle}
      onUpdateDescription={onUpdateDescription}
      variant={variant}
    />
  );
}

/**
 * Usage Instructions:
 * 
 * 1. Import in your course page:
 *    import { IntelligentSamIntegration } from './_components/intelligent-sam-integration';
 * 
 * 2. Pass the form update callbacks from your forms:
 *    <IntelligentSamIntegration
 *      courseId={courseId}
 *      courseData={courseData}
 *      completionStatus={completionStatus}
 *      onUpdateLearningObjectives={(objectives) => {
 *        // Update learning objectives form
 *        learningObjectivesForm.setValue('whatYouWillLearn', objectives);
 *        // Trigger form submission or update
 *      }}
 *      onUpdateChapters={(chapters) => {
 *        // Update chapters form
 *        chaptersForm.setValue('chapters', chapters);
 *        // Trigger form submission or update
 *      }}
 *      variant="floating"
 *    />
 * 
 * 3. SAM can now:
 *    - User: "Generate 10 learning objectives for my course"
 *      SAM: Generates objectives and automatically inserts them into the form
 *    
 *    - User: "Create 5 chapters based on my objectives"
 *      SAM: Analyzes objectives and creates structured chapters
 *    
 *    - User: "Apply Bloom's taxonomy to improve my content"
 *      SAM: Analyzes and suggests improvements with cognitive progression
 * 
 * 4. Features:
 *    - Context-aware responses based on course data
 *    - Direct form updates with generated content
 *    - Bloom's taxonomy integration
 *    - Intelligent suggestions based on course state
 *    - System messages confirming form updates
 */