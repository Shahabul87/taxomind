import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

/**
 * Parse duration string like "20 minutes" or "1 hour" to minutes as integer
 */
function parseDurationToMinutes(duration: string | undefined | null): number | null {
  if (!duration) return null;

  const str = duration.toLowerCase().trim();

  // Try to extract number
  const match = str.match(/(\d+)/);
  if (!match) return null;

  const num = parseInt(match[1], 10);

  // Check for hours
  if (str.includes('hour')) {
    return num * 60;
  }

  // Default to minutes
  return num;
}

interface SAMCompleteGenerationState {
  isGenerating: boolean;
  progress: {
    step: 'idle' | 'description' | 'objectives' | 'chapters' | 'complete';
    message: string;
    percentage: number;
  };
  error: string | null;
}

interface GenerationResult {
  courseDescription: string;
  learningObjectives: string[];
  chapters: Array<{
    title: string;
    description: string;
    bloomsLevel: string;
    position: number;
    learningOutcomes?: string[];  // Bloom's-aligned learning objectives for chapter
    keyTopics?: string[];
    practicalApplications?: string[];
    skillsDeveloped?: string[];
    estimatedTime?: string;
    prerequisites?: string;
    sections: Array<{
      title: string;
      description: string;
      contentType: string;
      estimatedDuration: string;
      position: number;
      learningObjectives?: string[];  // Bloom's-aligned learning objectives for section
      keyConceptsCovered?: string[];
      practicalActivity?: string;
    }>;
  }>;
  metadata: {
    totalChapters: number;
    totalSections: number;
    bloomsLevelsUsed: string[];
    contentTypesUsed?: string[];
    contextSources?: {
      samInteractions: number;
      existingObjectives: number;
      bloomsFocus: number;
    };
  };
}

export function useSamCompleteGeneration() {
  const [state, setState] = useState<SAMCompleteGenerationState>({
    isGenerating: false,
    progress: {
      step: 'idle',
      message: '',
      percentage: 0
    },
    error: null
  });

  const updateProgress = useCallback((step: string, message: string, percentage: number) => {
    setState(prev => ({
      ...prev,
      progress: { step: step as any, message, percentage }
    }));
  }, []);

  const generateCompleteStructure = useCallback(async ({
    formData,
    samContext = [],
    onFormDataUpdate,
    onGenerationComplete
  }: {
    formData: any;
    samContext?: string[];
    onFormDataUpdate: (updates: any) => void;
    onGenerationComplete?: (result: GenerationResult) => void;
  }) => {
    try {
      setState(prev => ({ ...prev, isGenerating: true, error: null }));
      
      // Step 1: Prepare SAM context
      updateProgress('description', 'Analyzing SAM context and course requirements...', 10);
      
      const contextPayload = {
        formData,
        samContext,
        existingObjectives: formData.courseGoals || [],
        bloomsFocus: formData.bloomsFocus || [],
        preferredContentTypes: formData.preferredContentTypes || []
      };

      // Step 2: Call comprehensive generation API
      updateProgress('description', 'SAM is generating enhanced course description...', 25);
      
      const response = await fetch('/api/sam/generate-course-structure-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contextPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Failed to generate course structure';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      const { courseStructure } = result;

      // Step 3: Update course description
      updateProgress('description', 'Updating course description...', 40);
      
      onFormDataUpdate((prev: any) => ({
        ...prev,
        courseDescription: courseStructure.courseDescription,
        courseShortOverview: courseStructure.courseDescription // Also update overview if needed
      }));

      // Give a brief pause for UI feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Update learning objectives
      updateProgress('objectives', 'SAM is enhancing learning objectives...', 60);
      
      onFormDataUpdate((prev: any) => ({
        ...prev,
        courseGoals: courseStructure.learningObjectives
      }));

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 5: Generate and populate chapters
      updateProgress('chapters', 'SAM is creating Bloom\'s-focused chapters...', 80);
      
      // Transform chapters to match form structure
      // Map estimatedDuration to duration (API expects 'duration' not 'estimatedDuration')
      // Include all AI-generated content including learning objectives
      const formattedChapters = courseStructure.chapters.map((chapter: any, index: number) => ({
        id: `temp-${Date.now()}-${index}`, // Temporary ID for form
        title: chapter.title,
        description: chapter.description,
        bloomsLevel: chapter.bloomsLevel,
        position: chapter.position,
        // Include chapter learning objectives from AI generation
        learningOutcomes: chapter.learningOutcomes || [],
        courseGoals: chapter.courseGoals,
        estimatedTime: chapter.estimatedTime,
        difficulty: chapter.difficulty,
        prerequisites: chapter.prerequisites,
        keyTopics: chapter.keyTopics,
        practicalApplications: chapter.practicalApplications,
        skillsDeveloped: chapter.skillsDeveloped,
        sections: chapter.sections.map((section: any, sIndex: number) => ({
          id: `temp-section-${Date.now()}-${index}-${sIndex}`,
          title: section.title,
          description: section.description,
          type: section.contentType, // Map contentType to type
          contentType: section.contentType, // Keep original for orchestrator
          duration: parseDurationToMinutes(section.estimatedDuration), // Convert to minutes integer
          estimatedDuration: section.estimatedDuration, // Keep original for orchestrator
          position: section.position,
          // Include section learning objectives from AI generation
          learningObjectives: section.learningObjectives || [],
          keyConceptsCovered: section.keyConceptsCovered,
          practicalActivity: section.practicalActivity,
          bloomsLevel: chapter.bloomsLevel, // Inherit from chapter
          isPublished: false
        })),
        isPublished: false
      }));

      onFormDataUpdate((prev: any) => ({
        ...prev,
        chapters: formattedChapters,
        chapterCount: formattedChapters.length,
        sectionsPerChapter: formattedChapters[0]?.sections.length || 3
      }));

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 6: Complete
      updateProgress('complete', 'Course structure generated successfully!', 100);
      
      toast.success(`SAM generated ${courseStructure.chapters.length} chapters with ${courseStructure.metadata.totalSections} sections!`);

      // Call completion callback
      if (onGenerationComplete) {
        onGenerationComplete(courseStructure);
      }

      // Reset state after a brief delay
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          progress: { step: 'idle', message: '', percentage: 0 }
        }));
      }, 2000);

      return courseStructure;

    } catch (error: any) {
      logger.error('Error in complete generation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate course structure';
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
        progress: { step: 'idle', message: '', percentage: 0 }
      }));

      toast.error(`Generation failed: ${errorMessage}`);
      throw error;
    }
  }, [updateProgress]);

  const resetGeneration = useCallback(() => {
    setState({
      isGenerating: false,
      progress: {
        step: 'idle',
        message: '',
        percentage: 0
      },
      error: null
    });
  }, []);

  return {
    ...state,
    generateCompleteStructure,
    resetGeneration
  };
}

// Hook for gathering SAM context from wizard
export function useSamContextGathering() {
  const gatherSamContext = useCallback((formData: any, samSuggestion: string) => {
    const context: string[] = [];
    
    // Add current SAM suggestion if available
    if (samSuggestion && samSuggestion.trim()) {
      context.push(`Current SAM guidance: ${samSuggestion}`);
    }
    
    // Add course design preferences
    if (formData.courseIntent) {
      context.push(`Learning intent: ${formData.courseIntent}`);
    }
    
    if (formData.targetAudience) {
      context.push(`Target audience: ${formData.targetAudience}`);
    }
    
    if (formData.difficulty) {
      context.push(`Difficulty level: ${formData.difficulty}`);
    }
    
    // Add educational framework context
    if (formData.bloomsFocus && formData.bloomsFocus.length > 0) {
      context.push(`Bloom's taxonomy focus: ${formData.bloomsFocus.join(', ')}`);
    }
    
    if (formData.preferredContentTypes && formData.preferredContentTypes.length > 0) {
      context.push(`Preferred content types: ${formData.preferredContentTypes.join(', ')}`);
    }
    
    // Add course structure preferences
    if (formData.chapterCount) {
      context.push(`Desired chapter count: ${formData.chapterCount}`);
    }
    
    if (formData.sectionsPerChapter) {
      context.push(`Sections per chapter: ${formData.sectionsPerChapter}`);
    }
    
    // Add assessment preferences
    if (formData.includeAssessments !== undefined) {
      context.push(`Include assessments: ${formData.includeAssessments ? 'Yes' : 'No'}`);
    }
    
    return context;
  }, []);
  
  return { gatherSamContext };
}