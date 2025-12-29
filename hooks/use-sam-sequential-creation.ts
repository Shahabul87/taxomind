/**
 * SAM Sequential Course Creation Orchestrator
 *
 * This hook coordinates the 3-stage course creation process:
 * Stage 1: Generate all chapters sequentially
 * Stage 2: Generate all sections for each chapter
 * Stage 3: Fill in details for each section
 *
 * Each stage maintains full context awareness for quality and consistency.
 */

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import {
  CourseContext,
  GeneratedChapter,
  GeneratedSection,
  SectionDetails,
  CreationProgress,
  CreationState,
  SequentialCreationConfig,
  SequentialCreationResult,
  Stage1Response,
  Stage2Response,
  Stage3Response,
} from '@/lib/sam/course-creation/types';

// ============================================================================
// Types
// ============================================================================

interface CreatedEntities {
  courseId?: string;
  chapters: Array<{ id: string; data: GeneratedChapter }>;
  sections: Array<{ id: string; chapterId: string; data: GeneratedSection }>;
}

interface UseSequentialCreationReturn {
  // State
  progress: CreationProgress;
  isCreating: boolean;
  error: string | null;

  // Actions
  startCreation: (config: SequentialCreationConfig) => Promise<SequentialCreationResult>;
  cancel: () => void;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const INITIAL_STATE: CreationState = {
  stage: 1,
  phase: 'idle',
  currentChapter: 0,
  totalChapters: 0,
  currentSection: 0,
  totalSections: 0,
};

const INITIAL_PROGRESS: CreationProgress = {
  state: INITIAL_STATE,
  percentage: 0,
  message: '',
  completedItems: {
    chapters: [],
    sections: [],
  },
};

// ============================================================================
// Main Hook
// ============================================================================

export function useSequentialCreation(): UseSequentialCreationReturn {
  const router = useRouter();
  const [progress, setProgress] = useState<CreationProgress>(INITIAL_PROGRESS);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const entitiesRef = useRef<CreatedEntities>({
    chapters: [],
    sections: [],
  });
  const startTimeRef = useRef<number>(0);

  // ========================================
  // Progress Calculation
  // ========================================

  const calculatePercentage = useCallback((
    stage: number,
    currentChapter: number,
    totalChapters: number,
    currentSection: number,
    sectionsPerChapter: number
  ): number => {
    // Stage 1: 0-30%
    // Stage 2: 30-60%
    // Stage 3: 60-100%

    if (stage === 1) {
      return Math.round((currentChapter / totalChapters) * 30);
    }

    if (stage === 2) {
      const totalSections = totalChapters * sectionsPerChapter;
      const completedSections = (currentChapter - 1) * sectionsPerChapter + currentSection;
      return 30 + Math.round((completedSections / totalSections) * 30);
    }

    if (stage === 3) {
      const totalSections = totalChapters * sectionsPerChapter;
      const completedSections = (currentChapter - 1) * sectionsPerChapter + currentSection;
      return 60 + Math.round((completedSections / totalSections) * 40);
    }

    return 100;
  }, []);

  // ========================================
  // Update Progress Helper
  // ========================================

  const updateProgress = useCallback((
    stage: number,
    phase: CreationProgress['state']['phase'],
    currentChapter: number,
    totalChapters: number,
    currentSection: number,
    totalSections: number,
    message: string,
    thinking?: string,
    currentItem?: string
  ) => {
    const percentage = calculatePercentage(
      stage,
      currentChapter,
      totalChapters,
      currentSection,
      totalSections / totalChapters
    );

    setProgress(prev => ({
      state: {
        stage: stage as 1 | 2 | 3,
        phase,
        currentChapter,
        totalChapters,
        currentSection,
        totalSections,
      },
      percentage,
      message,
      thinking,
      currentItem,
      completedItems: prev.completedItems,
    }));
  }, [calculatePercentage]);

  // ========================================
  // API Callers
  // ========================================

  const callStage1API = async (
    courseContext: CourseContext,
    previousChapters: GeneratedChapter[]
  ): Promise<Stage1Response> => {
    const response = await fetch('/api/sam/course-creation/stage-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseContext, previousChapters }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate chapter');
    }

    return response.json();
  };

  const callStage2API = async (
    courseContext: CourseContext,
    allChapters: GeneratedChapter[],
    currentChapter: GeneratedChapter,
    previousSections: GeneratedSection[],
    allExistingSectionTitles: string[]
  ): Promise<Stage2Response> => {
    const response = await fetch('/api/sam/course-creation/stage-2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseContext,
        allChapters,
        currentChapter,
        previousSections,
        allExistingSectionTitles,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate section');
    }

    return response.json();
  };

  const callStage3API = async (
    courseContext: CourseContext,
    chapter: GeneratedChapter,
    chapterSections: GeneratedSection[],
    currentSection: GeneratedSection
  ): Promise<Stage3Response> => {
    const response = await fetch('/api/sam/course-creation/stage-3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseContext,
        chapter,
        chapterSections,
        currentSection,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate section details');
    }

    return response.json();
  };

  // ========================================
  // Database Operations
  // ========================================

  // Helper to find or create category (POST API handles both cases)
  const getOrCreateCategoryId = async (categoryName: string, parentId?: string | null): Promise<string | null> => {
    if (!categoryName) return null;

    try {
      // The POST API checks for existing category and returns it, or creates new one
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryName,
          parentId: parentId || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.data?.id || result.id || null;
      }

      return null;
    } catch {
      logger.warn('Failed to get/create category:', categoryName);
      return null;
    }
  };

  const createCourseInDB = async (courseContext: CourseContext): Promise<string> => {
    // Look up category and subcategory IDs
    let categoryId: string | null = null;
    let subcategoryId: string | null = null;

    if (courseContext.courseCategory) {
      categoryId = await getOrCreateCategoryId(courseContext.courseCategory);

      // If we have a subcategory, look it up with the parent category
      if (courseContext.courseSubcategory && categoryId) {
        subcategoryId = await getOrCreateCategoryId(courseContext.courseSubcategory, categoryId);
      }
    }

    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: courseContext.courseTitle,
        description: courseContext.courseDescription,
        learningObjectives: courseContext.courseLearningObjectives || [],
        ...(categoryId && { categoryId }),
        ...(subcategoryId && { subcategoryId }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to create course in database');
    }

    const result = await response.json();
    return result.data?.id || result.id;
  };

  const createChapterInDB = async (
    courseId: string,
    chapter: GeneratedChapter
  ): Promise<string> => {
    // First create the chapter
    const createResponse = await fetch(`/api/courses/${courseId}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: chapter.title }),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create chapter in database');
    }

    const createResult = await createResponse.json();
    const chapterId = createResult.data?.id || createResult.id;

    // Then update with all details
    const updateResponse = await fetch(`/api/courses/${courseId}/chapters/${chapterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: chapter.description,
        learningOutcomes: chapter.learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n'),
        courseGoals: `Master ${chapter.title}`,
        estimatedTime: chapter.estimatedTime,
        prerequisites: chapter.prerequisites,
        position: chapter.position,
      }),
    });

    if (!updateResponse.ok) {
      logger.warn('Failed to update chapter details:', chapter.title);
    }

    return chapterId;
  };

  const createSectionInDB = async (
    courseId: string,
    chapterId: string,
    section: GeneratedSection
  ): Promise<string> => {
    // First create the section
    const createResponse = await fetch(
      `/api/courses/${courseId}/chapters/${chapterId}/sections`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: section.title }),
      }
    );

    if (!createResponse.ok) {
      throw new Error('Failed to create section in database');
    }

    const createResult = await createResponse.json();
    return createResult.data?.id || createResult.id;
  };

  const updateSectionDetailsInDB = async (
    courseId: string,
    chapterId: string,
    sectionId: string,
    section: GeneratedSection,
    details: SectionDetails
  ): Promise<void> => {
    const response = await fetch(
      `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: details.description,
          learningObjectives: details.learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n'),
          type: section.contentType,
          estimatedDuration: section.estimatedDuration,
        }),
      }
    );

    if (!response.ok) {
      logger.warn('Failed to update section details:', section.title);
    }
  };

  // ========================================
  // Main Creation Flow
  // ========================================

  const startCreation = useCallback(async (
    config: SequentialCreationConfig
  ): Promise<SequentialCreationResult> => {
    const { onProgress, onThinking, onStageComplete, onError, ...courseData } = config;

    // Build CourseContext from the simplified config
    const courseContext: CourseContext = {
      courseTitle: courseData.courseTitle,
      courseDescription: courseData.courseDescription,
      targetAudience: courseData.targetAudience,
      difficulty: courseData.difficulty,
      totalChapters: courseData.totalChapters,
      sectionsPerChapter: courseData.sectionsPerChapter,
      learningObjectivesPerChapter: courseData.learningObjectivesPerChapter,
      learningObjectivesPerSection: courseData.learningObjectivesPerSection,
      courseLearningObjectives: courseData.courseGoals,
      bloomsFocus: courseData.bloomsFocus.filter(b =>
        ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'].includes(b)
      ) as CourseContext['bloomsFocus'],
      preferredContentTypes: courseData.preferredContentTypes as CourseContext['preferredContentTypes'],
      courseCategory: courseData.category || '',
      courseSubcategory: courseData.subcategory,
    };

    cancelledRef.current = false;
    startTimeRef.current = Date.now();
    entitiesRef.current = { chapters: [], sections: [] };

    setError(null);

    const totalChapters = courseContext.totalChapters;
    const sectionsPerChapter = courseContext.sectionsPerChapter;
    const totalSections = totalChapters * sectionsPerChapter;

    let qualityScoreSum = 0;
    let qualityScoreCount = 0;

    try {
      // ========================================
      // Create Course in Database
      // ========================================
      updateProgress(1, 'creating_course', 0, totalChapters, 0, totalSections, 'Creating course...');

      const courseId = await createCourseInDB(courseContext);
      entitiesRef.current.courseId = courseId;

      logger.info('[SEQUENTIAL] Course created:', courseId);

      // ========================================
      // STAGE 1: Generate All Chapters
      // ========================================
      const generatedChapters: GeneratedChapter[] = [];

      for (let chapterNum = 1; chapterNum <= totalChapters; chapterNum++) {
        if (cancelledRef.current) throw new Error('Creation cancelled');

        updateProgress(
          1, 'generating_chapter',
          chapterNum, totalChapters,
          0, totalSections,
          `Generating Chapter ${chapterNum} of ${totalChapters}...`,
          undefined,
          `Chapter ${chapterNum}`
        );

        // Generate chapter with context of all previous chapters
        const stage1Result = await callStage1API(courseContext, generatedChapters);

        if (!stage1Result.success || !stage1Result.chapter) {
          throw new Error(`Failed to generate chapter ${chapterNum}`);
        }

        if (stage1Result.thinking && onThinking) {
          onThinking(stage1Result.thinking);
        }

        if (stage1Result.qualityScore) {
          qualityScoreSum += stage1Result.qualityScore;
          qualityScoreCount++;
        }

        // Save chapter to database
        updateProgress(
          1, 'saving_chapter',
          chapterNum, totalChapters,
          0, totalSections,
          `Saving Chapter ${chapterNum}: ${stage1Result.chapter.title}...`,
          stage1Result.thinking
        );

        const chapterId = await createChapterInDB(courseId, stage1Result.chapter);

        generatedChapters.push(stage1Result.chapter);
        entitiesRef.current.chapters.push({
          id: chapterId,
          data: stage1Result.chapter,
        });

        // Update completed items
        setProgress(prev => ({
          ...prev,
          completedItems: {
            ...prev.completedItems,
            chapters: [
              ...prev.completedItems.chapters,
              { position: chapterNum, title: stage1Result.chapter!.title, id: chapterId },
            ],
          },
        }));

        if (onProgress) {
          onProgress(progress);
        }
      }

      if (onStageComplete) {
        onStageComplete(1, generatedChapters);
      }

      logger.info('[SEQUENTIAL] Stage 1 complete:', { chaptersGenerated: generatedChapters.length });

      // ========================================
      // STAGE 2: Generate All Sections
      // ========================================
      const allSectionTitles: string[] = [];
      const sectionsByChapter: Map<number, GeneratedSection[]> = new Map();

      for (let chapterIdx = 0; chapterIdx < generatedChapters.length; chapterIdx++) {
        if (cancelledRef.current) throw new Error('Creation cancelled');

        const chapter = generatedChapters[chapterIdx];
        const chapterEntity = entitiesRef.current.chapters[chapterIdx];
        const chapterSections: GeneratedSection[] = [];

        for (let sectionNum = 1; sectionNum <= sectionsPerChapter; sectionNum++) {
          if (cancelledRef.current) throw new Error('Creation cancelled');

          updateProgress(
            2, 'generating_section',
            chapterIdx + 1, totalChapters,
            sectionNum, sectionsPerChapter,
            `Chapter ${chapterIdx + 1}: Generating Section ${sectionNum} of ${sectionsPerChapter}...`,
            undefined,
            `Section ${sectionNum} of Chapter ${chapterIdx + 1}`
          );

          // Generate section with context
          const stage2Result = await callStage2API(
            courseContext,
            generatedChapters,
            chapter,
            chapterSections,
            allSectionTitles
          );

          if (!stage2Result.success || !stage2Result.section) {
            throw new Error(`Failed to generate section ${sectionNum} for chapter ${chapterIdx + 1}`);
          }

          if (stage2Result.thinking && onThinking) {
            onThinking(stage2Result.thinking);
          }

          if (stage2Result.qualityScore) {
            qualityScoreSum += stage2Result.qualityScore;
            qualityScoreCount++;
          }

          // Save section to database
          updateProgress(
            2, 'saving_section',
            chapterIdx + 1, totalChapters,
            sectionNum, sectionsPerChapter,
            `Saving Section: ${stage2Result.section.title}...`,
            stage2Result.thinking
          );

          const sectionId = await createSectionInDB(
            courseId,
            chapterEntity.id,
            stage2Result.section
          );

          chapterSections.push(stage2Result.section);
          allSectionTitles.push(stage2Result.section.title);

          entitiesRef.current.sections.push({
            id: sectionId,
            chapterId: chapterEntity.id,
            data: stage2Result.section,
          });

          // Update completed items
          setProgress(prev => ({
            ...prev,
            completedItems: {
              ...prev.completedItems,
              sections: [
                ...prev.completedItems.sections,
                {
                  chapterPosition: chapterIdx + 1,
                  position: sectionNum,
                  title: stage2Result.section!.title,
                  id: sectionId,
                },
              ],
            },
          }));
        }

        sectionsByChapter.set(chapterIdx, chapterSections);
      }

      if (onStageComplete) {
        onStageComplete(2, Array.from(sectionsByChapter.values()).flat());
      }

      logger.info('[SEQUENTIAL] Stage 2 complete:', { sectionsGenerated: allSectionTitles.length });

      // ========================================
      // STAGE 3: Fill All Section Details
      // ========================================
      for (let chapterIdx = 0; chapterIdx < generatedChapters.length; chapterIdx++) {
        if (cancelledRef.current) throw new Error('Creation cancelled');

        const chapter = generatedChapters[chapterIdx];
        const chapterEntity = entitiesRef.current.chapters[chapterIdx];
        const chapterSections = sectionsByChapter.get(chapterIdx) || [];

        for (let sectionIdx = 0; sectionIdx < chapterSections.length; sectionIdx++) {
          if (cancelledRef.current) throw new Error('Creation cancelled');

          const section = chapterSections[sectionIdx];
          const sectionEntity = entitiesRef.current.sections.find(
            s => s.chapterId === chapterEntity.id && s.data.position === section.position
          );

          if (!sectionEntity) continue;

          updateProgress(
            3, 'generating_details',
            chapterIdx + 1, totalChapters,
            sectionIdx + 1, sectionsPerChapter,
            `Filling details for: ${section.title}...`,
            undefined,
            section.title
          );

          // Generate details
          const stage3Result = await callStage3API(
            courseContext,
            chapter,
            chapterSections,
            section
          );

          if (!stage3Result.success || !stage3Result.details) {
            logger.warn(`Failed to generate details for section: ${section.title}`);
            continue;
          }

          if (stage3Result.thinking && onThinking) {
            onThinking(stage3Result.thinking);
          }

          if (stage3Result.qualityScore) {
            qualityScoreSum += stage3Result.qualityScore;
            qualityScoreCount++;
          }

          // Save details to database
          updateProgress(
            3, 'saving_details',
            chapterIdx + 1, totalChapters,
            sectionIdx + 1, sectionsPerChapter,
            `Saving details for: ${section.title}...`,
            stage3Result.thinking
          );

          await updateSectionDetailsInDB(
            courseId,
            chapterEntity.id,
            sectionEntity.id,
            section,
            stage3Result.details
          );
        }
      }

      if (onStageComplete) {
        onStageComplete(3, []);
      }

      // ========================================
      // Complete
      // ========================================
      const totalTime = Date.now() - startTimeRef.current;
      const averageQualityScore = qualityScoreCount > 0
        ? Math.round(qualityScoreSum / qualityScoreCount)
        : 75;

      updateProgress(
        3, 'complete',
        totalChapters, totalChapters,
        sectionsPerChapter, sectionsPerChapter,
        'Course creation complete!',
        undefined
      );

      toast.success(
        `Course created with ${totalChapters} chapters and ${totalSections} sections!`,
        { duration: 5000 }
      );

      // Navigate to course
      setTimeout(() => {
        router.push(`/teacher/courses/${courseId}`);
      }, 1500);

      return {
        success: true,
        courseId,
        chaptersCreated: totalChapters,
        sectionsCreated: totalSections,
        stats: {
          totalChapters,
          totalSections,
          totalTime,
          averageQualityScore,
        },
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[SEQUENTIAL] Creation failed:', err);

      setError(errorMessage);

      if (onError) {
        onError(errorMessage, !cancelledRef.current);
      }

      toast.error(`Course creation failed: ${errorMessage}`);

      return {
        success: false,
        chaptersCreated: entitiesRef.current.chapters.length,
        sectionsCreated: entitiesRef.current.sections.length,
        stats: {
          totalChapters: entitiesRef.current.chapters.length,
          totalSections: entitiesRef.current.sections.length,
          totalTime: Date.now() - startTimeRef.current,
          averageQualityScore: 0,
        },
        error: errorMessage,
      };
    }
  }, [router, updateProgress, progress]);

  // ========================================
  // Cancel and Reset
  // ========================================

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    toast.info('Cancelling course creation...');
  }, []);

  const reset = useCallback(() => {
    setProgress(INITIAL_PROGRESS);
    setError(null);
    cancelledRef.current = false;
    entitiesRef.current = { chapters: [], sections: [] };
  }, []);

  // ========================================
  // Return
  // ========================================

  return {
    progress,
    isCreating: progress.state.phase !== 'idle' && progress.state.phase !== 'complete' && progress.state.phase !== 'error',
    error,
    startCreation,
    cancel,
    reset,
  };
}

export default useSequentialCreation;
