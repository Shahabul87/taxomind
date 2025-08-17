"use client";

import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import {
  type CourseGenerationRequest,
  type CourseGenerationResponse,
  type ChapterGenerationRequest,
  type ChapterGenerationResponse,
  type ContentCurationRequest,
  type ContentCurationResponse,
  CourseQuestionDifficulty,
  type ContentType,
  type LearningStyle
} from '@/lib/ai-course-types';

interface AIAssistanceState {
  isGenerating: boolean;
  currentStep: 'idle' | 'generating_course' | 'generating_chapters' | 'curating_content';
  progress: {
    current: number;
    total: number;
    status: string;
  };
  suggestions: {
    titles: string[];
    descriptions: string[];
    objectives: string[];
    prerequisites: string[];
  };
  error: string | null;
}

interface UseAICourseCreatorOptions {
  onCourseGenerated?: (course: CourseGenerationResponse) => void;
  onChapterGenerated?: (chapter: ChapterGenerationResponse) => void;
  onContentCurated?: (content: ContentCurationResponse) => void;
  onError?: (error: string) => void;
}

export function useAICourseCreator(options: UseAICourseCreatorOptions = {}) {
  const [aiState, setAIState] = useState<AIAssistanceState>({
    isGenerating: false,
    currentStep: 'idle',
    progress: { current: 0, total: 0, status: '' },
    suggestions: { titles: [], descriptions: [], objectives: [], prerequisites: [] },
    error: null
  });

  const [generatedCourse, setGeneratedCourse] = useState<CourseGenerationResponse | null>(null);
  const [generatedChapters, setGeneratedChapters] = useState<ChapterGenerationResponse[]>([]);
  const [curatedContent, setCuratedContent] = useState<ContentCurationResponse[]>([]);

  // Update progress helper
  const updateProgress = useCallback((current: number, total: number, status: string) => {
    setAIState(prev => ({
      ...prev,
      progress: { current, total, status }
    }));
  }, []);

  // Set generating state helper
  const setGeneratingState = useCallback((step: AIAssistanceState['currentStep'], isGenerating: boolean) => {
    setAIState(prev => ({
      ...prev,
      isGenerating,
      currentStep: step,
      error: null
    }));
  }, []);

  // Generate complete course plan
  const generateCoursePlan = useCallback(async (request: CourseGenerationRequest) => {
    try {
      setGeneratingState('generating_course', true);
      updateProgress(1, 3, 'Generating course structure...');

      const response = await axios.post('/api/ai/course-planner', request);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to generate course plan');
      }

      const courseData = response.data.data as CourseGenerationResponse;
      setGeneratedCourse(courseData);
      
      // Show warning if using fallback response
      if (response.data.warning) {
        toast.warning(response.data.warning);
      } else {
        toast.success('Course plan generated successfully!');
      }

      updateProgress(3, 3, 'Course plan ready!');
      options.onCourseGenerated?.(courseData);

      return courseData;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate course plan';
      setAIState(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
      options.onError?.(errorMessage);
      throw error;
    } finally {
      setGeneratingState('idle', false);
    }
  }, [setGeneratingState, updateProgress, options]);

  // Generate individual chapter
  const generateChapter = useCallback(async (request: ChapterGenerationRequest) => {
    try {
      setGeneratingState('generating_chapters', true);
      updateProgress(1, 2, `Generating chapter ${request.position}...`);

      const response = await axios.post('/api/ai/chapter-generator', request);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to generate chapter');
      }

      const chapterData = response.data.data as ChapterGenerationResponse;
      setGeneratedChapters(prev => [...prev, chapterData]);
      
      // Show warning if using fallback response
      if (response.data.warning) {
        toast.warning(response.data.warning);
      } else {
        toast.success(`Chapter ${request.position} generated successfully!`);
      }

      updateProgress(2, 2, 'Chapter ready!');
      options.onChapterGenerated?.(chapterData);

      return chapterData;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate chapter';
      setAIState(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
      options.onError?.(errorMessage);
      throw error;
    } finally {
      setGeneratingState('idle', false);
    }
  }, [setGeneratingState, updateProgress, options]);

  // Curate content for section
  const curateContent = useCallback(async (request: ContentCurationRequest) => {
    try {
      setGeneratingState('curating_content', true);
      updateProgress(1, 2, 'Finding relevant content...');

      const response = await axios.post('/api/ai/content-curator', request);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to curate content');
      }

      const contentData = response.data.data as ContentCurationResponse;
      setCuratedContent(prev => [...prev, contentData]);
      
      // Show warning if using fallback response
      if (response.data.warning) {
        toast.warning(response.data.warning);
      } else {
        toast.success('Content curated successfully!');
      }

      updateProgress(2, 2, 'Content ready!');
      options.onContentCurated?.(contentData);

      return contentData;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to curate content';
      setAIState(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
      options.onError?.(errorMessage);
      throw error;
    } finally {
      setGeneratingState('idle', false);
    }
  }, [setGeneratingState, updateProgress, options]);

  // Generate quick suggestions for form fields
  const generateQuickSuggestions = useCallback(async (topic: string, audience: string) => {
    if (!topic.trim()) return;

    try {
      // Simple suggestions based on topic and audience
      const suggestions = {
        titles: [
          `Complete ${topic} Course for ${audience}`,
          `Master ${topic}: From Beginner to Expert`,
          `${topic} Fundamentals and Advanced Techniques`,
          `Professional ${topic} Development Course`
        ],
        descriptions: [
          `A comprehensive course designed to take ${audience} from basics to advanced ${topic} concepts.`,
          `Learn ${topic} through hands-on projects and real-world applications.`,
          `Master ${topic} with expert-led instruction and practical exercises.`,
          `Build professional-grade skills in ${topic} with this structured course.`
        ],
        objectives: [
          `Understand fundamental ${topic} concepts and principles`,
          `Apply ${topic} techniques to solve real-world problems`,
          `Build practical projects using ${topic}`,
          `Master advanced ${topic} best practices and patterns`
        ],
        prerequisites: [
          'Basic computer literacy',
          'Understanding of fundamental programming concepts',
          'Familiarity with web technologies',
          'High school level mathematics'
        ]
      };

      setAIState(prev => ({
        ...prev,
        suggestions
      }));

    } catch (error: any) {
      logger.error('Failed to generate suggestions:', error);
    }
  }, []);

  // Clear all AI data
  const clearAIData = useCallback(() => {
    setGeneratedCourse(null);
    setGeneratedChapters([]);
    setCuratedContent([]);
    setAIState({
      isGenerating: false,
      currentStep: 'idle',
      progress: { current: 0, total: 0, status: '' },
      suggestions: { titles: [], descriptions: [], objectives: [], prerequisites: [] },
      error: null
    });
  }, []);

  // Helper to create course request from form data
  const createCourseRequest = useCallback((formData: {
    topic: string;
    description?: string;
    targetAudience: string;
    duration: string;
    difficulty: CourseQuestionDifficulty;
    learningGoals: string[];
    preferredContentTypes?: ContentType[];
    learningStyle?: LearningStyle;
  }): CourseGenerationRequest => {
    return {
      topic: formData.topic,
      description: formData.description,
      targetAudience: formData.targetAudience,
      duration: formData.duration,
      difficulty: formData.difficulty,
      learningGoals: formData.learningGoals,
      preferredContentTypes: formData.preferredContentTypes,
      learningStyle: formData.learningStyle
    };
  }, []);

  return {
    // State
    aiState,
    generatedCourse,
    generatedChapters,
    curatedContent,

    // Actions
    generateCoursePlan,
    generateChapter,
    curateContent,
    generateQuickSuggestions,
    clearAIData,

    // Helpers
    createCourseRequest,

    // Computed state
    isGenerating: aiState.isGenerating,
    hasError: !!aiState.error,
    currentStep: aiState.currentStep,
    progress: aiState.progress,
    suggestions: aiState.suggestions
  };
}