"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EducationalPreset, EducationalPresetManager } from '@/lib/educational-presets';
import { logger } from '@/lib/logger';

interface PresetApplicationState {
  isApplying: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  appliedPreset: EducationalPreset | null;
}

interface ApplyPresetOptions {
  courseId?: string; // For updating existing course
  userId: string;
  overrideBehavior?: 'merge' | 'replace'; // How to handle existing content
  customizations?: {
    title?: string;
    description?: string;
    additionalObjectives?: string[];
    skipChapters?: string[];
    modifyAssessments?: boolean;
  };
}

interface CourseCreationData {
  title: string;
  description: string;
  whatYouWillLearn: string[];
  categoryId?: string;
  imageUrl?: string;
  price?: number;
}

interface ChapterCreationData {
  title: string;
  description: string;
  position: number;
  sections: SectionCreationData[];
}

interface SectionCreationData {
  title: string;
  description: string;
  position: number;
  videoUrl?: string;
  content?: string;
  type: 'lecture' | 'reading' | 'video' | 'interactive' | 'practical';
}

export const usePresetApplication = () => {
  const [state, setState] = useState<PresetApplicationState>({
    isApplying: false,
    progress: 0,
    currentStep: '',
    error: null,
    appliedPreset: null
  });

  const router = useRouter();

  const updateProgress = useCallback((progress: number, step: string) => {
    setState(prev => ({
      ...prev,
      progress,
      currentStep: step
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isApplying: false
    }));
  }, []);

  // Simulate API call with delay for demo purposes
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const applyPreset = useCallback(async (
    preset: EducationalPreset,
    options: ApplyPresetOptions
  ): Promise<{ courseId: string; success: boolean }> => {
    setState(prev => ({
      ...prev,
      isApplying: true,
      progress: 0,
      error: null,
      appliedPreset: preset
    }));

    try {
      // Step 1: Prepare course data
      updateProgress(10, 'Preparing course structure...');
      await delay(500);

      const { courseData, chaptersData, assessmentConfig } = EducationalPresetManager.applyPresetToCourse(preset);
      
      // Apply any customizations
      if (options.customizations) {
        if (options.customizations.title) {
          courseData.title = options.customizations.title;
        }
        if (options.customizations.description) {
          courseData.description = options.customizations.description;
        }
        if (options.customizations.additionalObjectives?.length) {
          courseData.whatYouWillLearn = [
            ...courseData.whatYouWillLearn,
            ...options.customizations.additionalObjectives
          ];
        }
      }

      // Step 2: Create or update course
      updateProgress(25, 'Creating course...');
      await delay(800);

      let courseId = options.courseId;
      
      if (!courseId) {
        // Create new course
        const courseResponse = await fetch('/api/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...courseData,
            userId: options.userId,
            presetId: preset.id,
            presetApplied: true
          }),
        });

        if (!courseResponse.ok) {
          throw new Error('Failed to create course');
        }

        const courseResult = await courseResponse.json();
        courseId = courseResult.courseId;
      } else {
        // Update existing course
        const updateResponse = await fetch(`/api/courses/${courseId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...courseData,
            presetId: preset.id,
            presetApplied: true,
            overrideBehavior: options.overrideBehavior || 'merge'
          }),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update course');
        }
      }

      // Step 3: Create chapters and sections
      updateProgress(40, 'Creating course chapters...');
      await delay(1000);

      const skipChapters = options.customizations?.skipChapters || [];
      const filteredChapters = chaptersData.filter(chapter => 
        !skipChapters.includes(chapter.title.toLowerCase())
      );

      for (let i = 0; i < filteredChapters.length; i++) {
        const chapter = filteredChapters[i];
        const progress = 40 + ((i + 1) / filteredChapters.length) * 35;
        
        updateProgress(progress, `Creating chapter: ${chapter.title}`);
        
        // Create chapter
        const chapterResponse = await fetch(`/api/courses/${courseId}/chapters`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: chapter.title,
            description: chapter.description,
            position: chapter.position,
            estimatedDuration: chapter.estimatedDuration
          }),
        });

        if (!chapterResponse.ok) {
          throw new Error(`Failed to create chapter: ${chapter.title}`);
        }

        const chapterResult = await chapterResponse.json();
        const chapterId = chapterResult.chapterId;

        // Create sections for this chapter
        for (const section of chapter.sections) {
          const sectionResponse = await fetch(`/api/courses/${courseId}/chapters/${chapterId}/sections`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: section.title,
              description: `${section.type.charAt(0).toUpperCase() + section.type.slice(1)} section covering ${section.contentHints.join(', ')}`,
              position: section.position,
              type: section.type,
              estimatedDuration: section.estimatedDuration,
              learningObjectives: section.learningObjectives,
              contentHints: section.contentHints,
              isPresetGenerated: true
            }),
          });

          if (!sectionResponse.ok) {
            logger.warn(`Failed to create section: ${section.title}`);
          }
        }

        await delay(300); // Small delay between chapters
      }

      // Step 4: Apply assessment configuration
      updateProgress(80, 'Configuring assessments...');
      await delay(600);

      if (!options.customizations?.modifyAssessments) {
        // Apply assessment configuration to course
        const assessmentResponse = await fetch(`/api/courses/${courseId}/assessment-config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(assessmentConfig),
        });

        if (!assessmentResponse.ok) {
          logger.warn('Failed to apply assessment configuration');
        }
      }

      // Step 5: Enable recommended features
      updateProgress(90, 'Enabling recommended features...');
      await delay(400);

      if (preset.recommendedFeatures.length > 0) {
        const featuresResponse = await fetch(`/api/courses/${courseId}/features`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            features: preset.recommendedFeatures,
            presetId: preset.id
          }),
        });

        if (!featuresResponse.ok) {
          logger.warn('Failed to enable recommended features');
        }
      }

      // Step 6: Complete
      updateProgress(100, 'Course created successfully!');
      await delay(500);

      setState(prev => ({
        ...prev,
        isApplying: false,
        progress: 100,
        currentStep: 'Complete'
      }));

      return { courseId, success: true };

    } catch (error: any) {
      logger.error('Error applying preset:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      return { courseId: '', success: false };
    }
  }, [updateProgress, setError]);

  const createCourseFromPreset = useCallback(async (
    preset: EducationalPreset,
    userId: string,
    customizations?: ApplyPresetOptions['customizations']
  ): Promise<string | null> => {
    const result = await applyPreset(preset, {
      userId,
      customizations,
      overrideBehavior: 'replace'
    });

    if (result.success) {
      // Navigate to the new course
      setTimeout(() => {
        router.push(`/teacher/courses/${result.courseId}`);
      }, 1000);
      return result.courseId;
    }

    return null;
  }, [applyPreset, router]);

  const updateCourseWithPreset = useCallback(async (
    preset: EducationalPreset,
    courseId: string,
    userId: string,
    customizations?: ApplyPresetOptions['customizations']
  ): Promise<boolean> => {
    const result = await applyPreset(preset, {
      courseId,
      userId,
      customizations,
      overrideBehavior: 'merge'
    });

    if (result.success) {
      // Navigate back to course
      setTimeout(() => {
        router.push(`/teacher/courses/${courseId}`);
      }, 1000);
    }

    return result.success;
  }, [applyPreset, router]);

  const generateCustomPreset = useCallback(async (requirements: {
    subject: string;
    level: string;
    duration: string;
    goals: string[];
    audience: string;
    userId: string;
  }): Promise<string | null> => {
    setState(prev => ({
      ...prev,
      isApplying: true,
      progress: 0,
      error: null,
      appliedPreset: null
    }));

    try {
      updateProgress(20, 'Analyzing requirements...');
      await delay(800);

      updateProgress(50, 'Generating custom preset with AI...');
      await delay(1500);

      // Generate custom preset
      const customPreset = EducationalPresetManager.generateCustomPreset(requirements);
      
      // Convert to full preset with AI-generated content
      const aiResponse = await fetch('/api/ai/generate-preset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requirements),
      });

      if (!aiResponse.ok) {
        throw new Error('Failed to generate custom preset');
      }

      const generatedPreset = await aiResponse.json();
      
      updateProgress(80, 'Creating course from custom preset...');
      
      // Apply the generated preset
      const result = await applyPreset(generatedPreset, {
        userId: requirements.userId,
        overrideBehavior: 'replace'
      });

      if (result.success) {
        setTimeout(() => {
          router.push(`/teacher/courses/${result.courseId}`);
        }, 1000);
        return result.courseId;
      }

      return null;

    } catch (error: any) {
      logger.error('Error generating custom preset:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate custom preset');
      return null;
    }
  }, [applyPreset, router, updateProgress, setError]);

  const resetState = useCallback(() => {
    setState({
      isApplying: false,
      progress: 0,
      currentStep: '',
      error: null,
      appliedPreset: null
    });
  }, []);

  return {
    ...state,
    applyPreset,
    createCourseFromPreset,
    updateCourseWithPreset,
    generateCustomPreset,
    resetState
  };
};