/**
 * Intelligent SAM Assistant Integration
 * 
 * SAM is now an intelligent assistant that can:
 * - Understand your course context and forms
 * - Generate learning objectives based on Bloom's taxonomy
 * - Create course chapters with proper progression
 * - Directly update forms with generated content
 */

"use client";

import { useEffect } from 'react';
import { IntelligentSamAssistant } from './intelligent-sam-assistant';
import { useCallback } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { initializeSamContext } from '@/lib/sam-context';
import { logger } from '@/lib/logger';

interface SamIntegrationProps {
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
      isPublished: boolean;
      sections: Array<{
        id: string;
        title: string;
        isPublished: boolean;
      }>;
    }>;
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
  variant?: 'floating' | 'inline';
}

export function SamIntegration({ 
  courseId, 
  courseData, 
  completionStatus,
  variant = 'floating'
}: SamIntegrationProps) {
  const router = useRouter();
  
  // Initialize context when component mounts
  useEffect(() => {
    const completionCount = Object.values(completionStatus).filter(Boolean).length;
    const completionRate = (completionCount / Object.keys(completionStatus).length) * 100;
    
    const healthScore = (() => {
      const baseScore = completionRate * 0.6;
      const contentScore = Math.min(courseData.chapters.length * 10, 40);
      return Math.round(baseScore + contentScore);
    })();
    
    initializeSamContext(courseId, courseData.title, healthScore, completionRate);
  }, [courseId, courseData.title, completionStatus, courseData.chapters.length]);

  // Direct DOM manipulation callbacks for form control
  const handleUpdateLearningObjectives = useCallback(async (objectives: string[]) => {
    try {
      // Find the learning objectives form in the DOM
      const editButton = document.querySelector('[data-testid="learning-objectives-edit"]') as HTMLButtonElement;
      if (editButton) {
        editButton.click();
        
        setTimeout(() => {
          // Find the TipTap editor
          const editor = document.querySelector('.ProseMirror') as HTMLElement;
          if (editor) {
            // Create HTML content
            const htmlContent = `<ul>${objectives.map(obj => `<li>${obj}</li>`).join('')}</ul>`;
            
            // Update editor content
            editor.innerHTML = htmlContent;
            
            // Trigger input event
            editor.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Find and click save button
            setTimeout(() => {
              const saveButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
              if (saveButton && !saveButton.disabled) {
                saveButton.click();
              }
            }, 100);
          }
        }, 200);
      } else {
        // Fallback to API
        await axios.patch(`/api/courses/${courseId}`, {
          whatYouWillLearn: objectives
        });
        router.refresh();
      }
      
      toast.success("Learning objectives updated!");
    } catch (error) {
      logger.error('Failed to update objectives:', error);
      toast.error('Failed to update learning objectives');
    }
  }, [courseId, router]);

  // Callback to populate chapter form
  const handleUpdateChapters = useCallback(async (chapters: any[]) => {
    try {

      // Store all chapters in session storage for sequential processing
      sessionStorage.setItem('sam_pending_chapters', JSON.stringify(chapters));
      sessionStorage.setItem('sam_current_chapter_index', '0');
      
      // Function to create the next chapter
      const createNextChapter = async () => {
        const pendingChapters = JSON.parse(sessionStorage.getItem('sam_pending_chapters') || '[]');
        const currentIndex = parseInt(sessionStorage.getItem('sam_current_chapter_index') || '0');
        
        if (currentIndex >= pendingChapters.length) {
          toast.success('All chapters created successfully!');
          sessionStorage.removeItem('sam_pending_chapters');
          sessionStorage.removeItem('sam_current_chapter_index');
          router.refresh();
          return;
        }
        
        const chapter = pendingChapters[currentIndex];
        
        // Create chapter directly via API
        try {
          await axios.post(`/api/courses/${courseId}/chapters`, {
            title: chapter.title,
            description: chapter.description || '',
            position: chapter.position || (currentIndex + 1)
          });
          
          // Update index for next chapter
          sessionStorage.setItem('sam_current_chapter_index', (currentIndex + 1).toString());
          
          toast.success(`Chapter ${currentIndex + 1} of ${pendingChapters.length} created: ${chapter.title}`);
          
          // Create next chapter after a short delay
          setTimeout(createNextChapter, 1000);
          
        } catch (error) {
          logger.error('Failed to create chapter:', error);
          toast.error(`Failed to create chapter: ${chapter.title}`);
        }
      };
      
      // Start creating chapters
      createNextChapter();
      
    } catch (error) {
      logger.error('Failed to process chapters:', error);
      toast.error('Failed to process chapters');
    }
  }, [courseId, router]);

  // Handle chapter deletion
  const handleDeleteChapters = useCallback(async (chapterIds: string[]) => {
    try {
      for (const chapterId of chapterIds) {
        await axios.delete(`/api/courses/${courseId}/chapters/${chapterId}`);
      }
      toast.success(`${chapterIds.length} chapters deleted!`);
      router.refresh();
    } catch (error) {
      logger.error('Failed to delete chapters:', error);
      toast.error('Failed to delete chapters');
    }
  }, [courseId, router]);

  return (
    <IntelligentSamAssistant
      courseId={courseId}
      courseData={courseData as any}
      completionStatus={completionStatus}
      onUpdateLearningObjectives={handleUpdateLearningObjectives}
      onUpdateChapters={handleUpdateChapters}
      onDeleteChapters={handleDeleteChapters}
      variant={variant === 'inline' ? 'embedded' : variant}
    />
  );
}

/**
 * Usage Instructions:
 * 
 * 1. Replace existing SAM imports:
 *    OLD: import { SamFloatingChatbot } from './_components/sam-floating-chatbot';
 *    NEW: import { SamIntegration } from './_components/sam-integration-example';
 * 
 * 2. Replace the component usage:
 *    OLD: <SamFloatingChatbot courseId={courseId} courseData={courseData} completionStatus={completionStatus} />
 *    NEW: <SamIntegration courseId={courseId} courseData={courseData} completionStatus={completionStatus} variant="floating" />
 * 
 * 3. For inline usage in cards or sidebars:
 *    <SamIntegration courseId={courseId} courseData={courseData} completionStatus={completionStatus} variant="inline" />
 * 
 * 4. The form-aware SAM features:
 *    - Full context awareness of course structure and forms
 *    - Directly populates form fields when generating content
 *    - Automatically opens forms and fills inputs
 *    - Generates learning objectives using Bloom's taxonomy
 *    - Creates course chapters with cognitive progression
 *    - Focuses inputs for user review before submission
 *    - Shows system messages when forms are updated
 *    - Professional UI with always-visible textarea
 *    - Works with existing form components via DOM manipulation
 * 
 * 5. Example interactions:
 *    - "Generate 10 learning objectives for my course"
 *    - "Create 5 chapters based on Bloom's taxonomy"
 *    - "Analyze my course structure"
 *    - "Improve my learning objectives"
 */