/**
 * SAM Course Creation Orchestrator
 *
 * This hook orchestrates the complete course creation process:
 * 1. Validates AI-generated content quality
 * 2. Creates course shell in database
 * 3. Fills all course fields
 * 4. Creates chapters with content
 * 5. Creates sections with content
 * 6. Handles errors with rollback capability
 *
 * @module hooks/use-sam-course-creation-orchestrator
 */

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// ============================================================================
// Bloom's Taxonomy Helpers - Enhanced with Thinking Framework
// ============================================================================

/**
 * Bloom's Taxonomy comprehensive reference
 * Each level includes verbs, cognitive process, and outcome descriptors
 */
const BLOOMS_TAXONOMY: Record<string, {
  level: number;
  verbs: string[];
  cognitiveProcess: string;
  studentOutcome: string;
  objectiveTemplates: string[];
}> = {
  REMEMBER: {
    level: 1,
    verbs: ['Define', 'List', 'Recall', 'Identify', 'Name', 'State', 'Recognize', 'Describe', 'Retrieve', 'Label'],
    cognitiveProcess: 'Retrieving relevant knowledge from long-term memory',
    studentOutcome: 'Can recall and recognize information accurately',
    objectiveTemplates: [
      'Define the key terminology and concepts of {topic}',
      'Identify the fundamental components of {topic}',
      'List the essential elements that comprise {topic}',
      'Recognize common patterns and structures in {topic}',
      'Describe the basic characteristics of {topic}',
    ],
  },
  UNDERSTAND: {
    level: 2,
    verbs: ['Explain', 'Summarize', 'Interpret', 'Classify', 'Compare', 'Discuss', 'Distinguish', 'Illustrate', 'Paraphrase', 'Predict'],
    cognitiveProcess: 'Constructing meaning from instructional messages',
    studentOutcome: 'Can explain concepts in their own words and make connections',
    objectiveTemplates: [
      'Explain how {topic} works and why it matters',
      'Compare different approaches to {topic} and their trade-offs',
      'Interpret real-world examples of {topic} in practice',
      'Summarize the key principles that govern {topic}',
      'Discuss the relationship between {topic} and related concepts',
    ],
  },
  APPLY: {
    level: 3,
    verbs: ['Apply', 'Demonstrate', 'Implement', 'Execute', 'Use', 'Solve', 'Practice', 'Calculate', 'Operate', 'Show'],
    cognitiveProcess: 'Carrying out or using a procedure in a given situation',
    studentOutcome: 'Can use learned concepts to solve problems and complete tasks',
    objectiveTemplates: [
      'Apply {topic} techniques to solve practical problems',
      'Implement {topic} solutions in real-world scenarios',
      'Demonstrate proficiency in using {topic} tools and methods',
      'Execute {topic} procedures following best practices',
      'Use {topic} to build functional components or solutions',
    ],
  },
  ANALYZE: {
    level: 4,
    verbs: ['Analyze', 'Differentiate', 'Organize', 'Examine', 'Investigate', 'Categorize', 'Deconstruct', 'Contrast', 'Diagram', 'Outline'],
    cognitiveProcess: 'Breaking material into parts and determining relationships',
    studentOutcome: 'Can break down complex information and identify patterns',
    objectiveTemplates: [
      'Analyze complex {topic} scenarios to identify key factors',
      'Examine how different components of {topic} interact',
      'Investigate problems in {topic} to determine root causes',
      'Differentiate between effective and ineffective {topic} approaches',
      'Organize {topic} concepts into logical frameworks',
    ],
  },
  EVALUATE: {
    level: 5,
    verbs: ['Evaluate', 'Judge', 'Assess', 'Critique', 'Justify', 'Recommend', 'Validate', 'Prioritize', 'Defend', 'Argue'],
    cognitiveProcess: 'Making judgments based on criteria and standards',
    studentOutcome: 'Can make informed decisions and defend their reasoning',
    objectiveTemplates: [
      'Evaluate {topic} solutions against quality criteria',
      'Assess the effectiveness of different {topic} strategies',
      'Critique existing {topic} implementations and suggest improvements',
      'Justify design decisions when working with {topic}',
      'Recommend optimal {topic} approaches based on requirements',
    ],
  },
  CREATE: {
    level: 6,
    verbs: ['Create', 'Design', 'Develop', 'Construct', 'Produce', 'Formulate', 'Compose', 'Generate', 'Invent', 'Build'],
    cognitiveProcess: 'Putting elements together to form a coherent whole',
    studentOutcome: 'Can synthesize information to create something new and original',
    objectiveTemplates: [
      'Design original {topic} solutions for complex problems',
      'Create comprehensive {topic} implementations from scratch',
      'Develop innovative approaches to {topic} challenges',
      'Construct integrated systems incorporating {topic}',
      'Produce professional-quality {topic} deliverables',
    ],
  },
};

// Simplified verb lookup for backward compatibility
const BLOOMS_VERBS: Record<string, string[]> = Object.fromEntries(
  Object.entries(BLOOMS_TAXONOMY).map(([key, value]) => [key, value.verbs])
);

/**
 * Generate default learning outcomes for a chapter based on Bloom's taxonomy
 *
 * Thinking Framework Applied:
 * 1. What is the intuition behind this chapter?
 * 2. What main topics should the objectives cover?
 * 3. How does Bloom's level affect the cognitive demands?
 * 4. What practical applications are relevant?
 * 5. What skills will students develop?
 */
function generateDefaultChapterOutcomes(
  chapterTitle: string,
  bloomsLevel: string,
  objectiveCount: number = 5
): string {
  const level = bloomsLevel?.toUpperCase() || 'UNDERSTAND';
  const bloomsInfo = BLOOMS_TAXONOMY[level] || BLOOMS_TAXONOMY['UNDERSTAND'];

  // Extract key topic from chapter title (remove prefixes)
  const topic = chapterTitle
    .replace(/^(Chapter \d+:|Module \d+:|Unit \d+:)/i, '')
    .replace(/^(Introduction to|Overview of|Fundamentals of|Getting Started with)/i, '')
    .trim();

  const outcomes: string[] = [];

  // Use templates from Bloom's taxonomy reference
  const templates = bloomsInfo.objectiveTemplates;

  for (let i = 0; i < objectiveCount; i++) {
    // Rotate through templates and verbs for variety
    const template = templates[i % templates.length];
    const objective = template.replace('{topic}', topic);
    outcomes.push(`${i + 1}. ${objective}`);
  }

  return outcomes.join('\n');
}

/**
 * Generate learning objectives for a section based on Bloom's taxonomy
 *
 * Thinking Framework Applied:
 * 1. What focused outcome should this section achieve?
 * 2. What key concepts are covered?
 * 3. What practical exercise reinforces learning?
 * 4. What specific skill is practiced?
 */
function generateDefaultSectionObjectives(
  sectionTitle: string,
  bloomsLevel: string,
  objectiveCount: number = 3
): string {
  const level = bloomsLevel?.toUpperCase() || 'APPLY';
  const bloomsInfo = BLOOMS_TAXONOMY[level] || BLOOMS_TAXONOMY['APPLY'];

  // Extract topic from section title
  const topic = sectionTitle
    .replace(/^(Section \d+:|Lesson \d+:|Part \d+:)/i, '')
    .trim();

  const outcomes: string[] = [];
  const verbs = bloomsInfo.verbs;

  // Generate focused, actionable objectives
  const sectionTemplates = [
    `{verb} the core concepts of ${topic} with hands-on practice`,
    `{verb} ${topic.toLowerCase()} techniques in practical exercises`,
    `{verb} solutions that demonstrate mastery of ${topic}`,
    `{verb} ${topic.toLowerCase()} following industry best practices`,
    `{verb} how to troubleshoot common issues with ${topic}`,
  ];

  for (let i = 0; i < objectiveCount; i++) {
    const verb = verbs[i % verbs.length];
    const template = sectionTemplates[i % sectionTemplates.length];
    const objective = template.replace('{verb}', verb);
    outcomes.push(`${i + 1}. ${objective}`);
  }

  return outcomes.join('\n');
}

/**
 * Calculate estimated time for a chapter based on section count
 */
function calculateEstimatedTime(sectionCount: number): string {
  const minutesPerSection = 20; // Average 20 minutes per section
  const totalMinutes = sectionCount * minutesPerSection;

  if (totalMinutes < 60) {
    return `${totalMinutes} minutes`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  }
}

/**
 * Get the appropriate Bloom's level for a chapter based on position
 * Earlier chapters focus on lower levels, later chapters on higher levels
 */
function getBloomsLevelForPosition(position: number, totalChapters: number, focusLevels: string[]): string {
  // If specific focus levels are provided, use them
  if (focusLevels && focusLevels.length > 0) {
    const levelIndex = Math.min(position - 1, focusLevels.length - 1);
    return focusLevels[levelIndex];
  }

  // Default progression: Remember -> Understand -> Apply -> Analyze -> Evaluate -> Create
  const allLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const progressionIndex = Math.floor((position / totalChapters) * allLevels.length);
  return allLevels[Math.min(progressionIndex, allLevels.length - 1)];
}

// ============================================================================
// Types
// ============================================================================

export type CreationPhase =
  | 'idle'
  | 'validating'
  | 'creating_course'
  | 'filling_course'
  | 'creating_chapters'
  | 'creating_sections'
  | 'finalizing'
  | 'complete'
  | 'error'
  | 'rolling_back';

export interface CreationProgress {
  phase: CreationPhase;
  message: string;
  percentage: number;
  currentItem?: string;
  totalItems?: number;
  completedItems?: number;
}

export interface QualityScore {
  overall: number;
  breakdown: {
    clarity: number;
    relevance: number;
    completeness: number;
    engagement: number;
    bloomsAlignment: number;
  };
  passed: boolean;
  suggestions: string[];
}

export interface ChapterData {
  title: string;
  description: string;
  learningOutcomes?: string | string[];  // Learning objectives - supports both string and array format
  bloomsLevel: string;
  position: number;
  isFree?: boolean;
  courseGoals?: string;  // Summary of what this chapter covers
  estimatedTime?: string;
  difficulty?: string;
  prerequisites?: string;
  sections: SectionData[];
}

export interface SectionData {
  title: string;
  description: string;
  learningObjectives?: string | string[];  // Learning objectives - supports both string and array format
  bloomsLevel?: string;
  contentType: string;
  estimatedDuration: string;
  position: number;
  isFree?: boolean;
}

export interface CourseFormData {
  courseTitle: string;
  courseDescription: string;
  courseShortOverview: string;
  courseCategory?: string;
  courseSubcategory?: string;
  targetAudience: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  courseIntent?: string;
  courseGoals: string[];
  whatYouWillLearn?: string[];
  bloomsFocus: string[];
  preferredContentTypes: string[];
  chapterCount: number;
  sectionsPerChapter: number;
  // Learning objectives configuration
  learningObjectivesPerChapter: number;
  learningObjectivesPerSection: number;
  includeAssessments: boolean;
  price?: number;
  chapters?: ChapterData[];
}

export interface CreatedEntities {
  courseId?: string;
  chapterIds: string[];
  sectionIds: string[];
}

export interface OrchestrationResult {
  success: boolean;
  courseId?: string;
  courseUrl?: string;
  quality: QualityScore;
  stats: {
    totalChapters: number;
    totalSections: number;
    creationTimeMs: number;
  };
  error?: string;
}

export interface UseOrchestrator {
  // State
  progress: CreationProgress;
  quality: QualityScore | null;
  isCreating: boolean;
  error: string | null;

  // Actions
  createCourse: (formData: CourseFormData, generatedStructure: GeneratedStructure) => Promise<OrchestrationResult>;
  validateContent: (formData: CourseFormData, generatedStructure: GeneratedStructure) => Promise<QualityScore>;
  reset: () => void;
  cancel: () => void;
}

export interface GeneratedStructure {
  courseDescription: string;
  learningObjectives: string[];
  chapters: ChapterData[];
  metadata?: {
    totalChapters: number;
    totalSections: number;
    bloomsLevelsUsed: string[];
  };
}

// ============================================================================
// Constants
// ============================================================================

const MINIMUM_QUALITY_SCORE = 70;

const INITIAL_PROGRESS: CreationProgress = {
  phase: 'idle',
  message: '',
  percentage: 0,
};

const INITIAL_QUALITY: QualityScore = {
  overall: 0,
  breakdown: {
    clarity: 0,
    relevance: 0,
    completeness: 0,
    engagement: 0,
    bloomsAlignment: 0,
  },
  passed: false,
  suggestions: [],
};

// ============================================================================
// Quality Validation Functions
// ============================================================================

function validateCourseQuality(
  formData: CourseFormData,
  structure: GeneratedStructure
): QualityScore {
  const suggestions: string[] = [];
  let clarity = 100;
  let relevance = 100;
  let completeness = 100;
  let engagement = 100;
  let bloomsAlignment = 100;

  // 1. Title validation
  if (!formData.courseTitle || formData.courseTitle.length < 10) {
    clarity -= 20;
    suggestions.push('Course title should be at least 10 characters for clarity');
  }
  if (formData.courseTitle && formData.courseTitle.length > 100) {
    clarity -= 10;
    suggestions.push('Consider shortening the title for better readability');
  }

  // 2. Description validation
  const descLength = structure.courseDescription?.length || 0;
  if (descLength < 100) {
    completeness -= 30;
    suggestions.push('Course description should be at least 100 characters');
  } else if (descLength < 300) {
    completeness -= 15;
    suggestions.push('Consider expanding the course description for better context');
  }

  // 3. Learning objectives validation
  const objectivesCount = structure.learningObjectives?.length || 0;
  if (objectivesCount < 3) {
    completeness -= 25;
    suggestions.push('Add at least 3 learning objectives');
  } else if (objectivesCount > 15) {
    clarity -= 10;
    suggestions.push('Consider consolidating learning objectives (3-10 is ideal)');
  }

  // Check for Bloom's verbs in objectives
  const bloomsVerbs = [
    'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create',
    'define', 'describe', 'explain', 'demonstrate', 'compare', 'design',
    'identify', 'list', 'summarize', 'implement', 'assess', 'develop',
  ];

  const objectivesWithVerbs = structure.learningObjectives?.filter(obj =>
    bloomsVerbs.some(verb => obj.toLowerCase().includes(verb))
  ).length || 0;

  const verbAlignment = objectivesCount > 0 ? (objectivesWithVerbs / objectivesCount) * 100 : 0;
  if (verbAlignment < 80) {
    bloomsAlignment -= (80 - verbAlignment) / 2;
    suggestions.push('Use action verbs aligned with Bloom\'s Taxonomy in learning objectives');
  }

  // 4. Chapter structure validation
  const chaptersCount = structure.chapters?.length || 0;
  if (chaptersCount < 3) {
    completeness -= 20;
    suggestions.push('Add at least 3 chapters for comprehensive coverage');
  }

  // Check chapter descriptions
  const chaptersWithDescriptions = structure.chapters?.filter(ch =>
    ch.description && ch.description.length >= 50
  ).length || 0;

  if (chaptersCount > 0 && chaptersWithDescriptions / chaptersCount < 0.8) {
    completeness -= 15;
    suggestions.push('Add detailed descriptions to all chapters');
  }

  // 5. Sections validation
  const totalSections = structure.chapters?.reduce(
    (sum, ch) => sum + (ch.sections?.length || 0), 0
  ) || 0;

  if (totalSections < chaptersCount * 2) {
    completeness -= 15;
    suggestions.push('Add at least 2 sections per chapter');
  }

  // 6. Bloom's progression validation
  const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const usedLevels = new Set(structure.chapters?.map(ch => ch.bloomsLevel?.toUpperCase()));

  if (usedLevels.size < 3) {
    bloomsAlignment -= 20;
    suggestions.push('Use more diverse Bloom\'s taxonomy levels across chapters');
  }

  // Check for progression (lower levels should come before higher)
  const levelPositions = structure.chapters?.map(ch => ({
    position: ch.position,
    level: bloomsLevels.indexOf(ch.bloomsLevel?.toUpperCase() || 'UNDERSTAND'),
  })) || [];

  let progressionScore = 100;
  for (let i = 1; i < levelPositions.length; i++) {
    if (levelPositions[i].level < levelPositions[i - 1].level - 1) {
      progressionScore -= 10;
    }
  }
  bloomsAlignment = Math.min(bloomsAlignment, progressionScore);

  // 7. Target audience alignment
  if (!formData.targetAudience || formData.targetAudience.length < 10) {
    relevance -= 20;
    suggestions.push('Define target audience more specifically');
  }

  // 8. Engagement factors
  const hasVideos = structure.chapters?.some(ch =>
    ch.sections?.some(s => s.contentType?.toLowerCase().includes('video'))
  );
  const hasQuizzes = structure.chapters?.some(ch =>
    ch.sections?.some(s =>
      s.contentType?.toLowerCase().includes('quiz') ||
      s.contentType?.toLowerCase().includes('assessment')
    )
  );
  const hasProjects = structure.chapters?.some(ch =>
    ch.sections?.some(s =>
      s.contentType?.toLowerCase().includes('project') ||
      s.contentType?.toLowerCase().includes('assignment')
    )
  );

  if (!hasVideos) {
    engagement -= 15;
    suggestions.push('Consider adding video content for better engagement');
  }
  if (!hasQuizzes && formData.includeAssessments) {
    engagement -= 15;
    suggestions.push('Add quizzes or assessments to test understanding');
  }
  if (!hasProjects) {
    engagement -= 10;
    suggestions.push('Consider adding practical projects or assignments');
  }

  // Calculate overall score
  const overall = Math.round(
    (clarity * 0.2) +
    (relevance * 0.2) +
    (completeness * 0.25) +
    (engagement * 0.15) +
    (bloomsAlignment * 0.2)
  );

  return {
    overall: Math.max(0, Math.min(100, overall)),
    breakdown: {
      clarity: Math.max(0, Math.min(100, clarity)),
      relevance: Math.max(0, Math.min(100, relevance)),
      completeness: Math.max(0, Math.min(100, completeness)),
      engagement: Math.max(0, Math.min(100, engagement)),
      bloomsAlignment: Math.max(0, Math.min(100, bloomsAlignment)),
    },
    passed: overall >= MINIMUM_QUALITY_SCORE,
    suggestions: suggestions.slice(0, 5), // Top 5 suggestions
  };
}

// ============================================================================
// Main Hook
// ============================================================================

export function useSAMCourseCreationOrchestrator(): UseOrchestrator {
  const router = useRouter();
  const [progress, setProgress] = useState<CreationProgress>(INITIAL_PROGRESS);
  const [quality, setQuality] = useState<QualityScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createdEntitiesRef = useRef<CreatedEntities>({
    chapterIds: [],
    sectionIds: [],
  });
  const cancelledRef = useRef(false);
  const startTimeRef = useRef<number>(0);

  // Update progress helper
  const updateProgress = useCallback((
    phase: CreationPhase,
    message: string,
    percentage: number,
    extras?: Partial<CreationProgress>
  ) => {
    setProgress({
      phase,
      message,
      percentage,
      ...extras,
    });
  }, []);

  // Rollback helper
  const rollback = useCallback(async (entities: CreatedEntities) => {
    updateProgress('rolling_back', 'Rolling back created entities...', 0);

    try {
      // Delete sections first
      for (const sectionId of entities.sectionIds.reverse()) {
        try {
          // Note: We'd need the full path, but for rollback we'll use a cleanup endpoint
          await fetch(`/api/sections/${sectionId}`, { method: 'DELETE' });
        } catch (err) {
          logger.warn('Failed to delete section during rollback:', err);
        }
      }

      // Delete chapters
      for (const chapterId of entities.chapterIds.reverse()) {
        try {
          await fetch(`/api/chapters/${chapterId}`, { method: 'DELETE' });
        } catch (err) {
          logger.warn('Failed to delete chapter during rollback:', err);
        }
      }

      // Delete course
      if (entities.courseId) {
        try {
          await fetch(`/api/courses/${entities.courseId}`, { method: 'DELETE' });
        } catch (err) {
          logger.warn('Failed to delete course during rollback:', err);
        }
      }

      logger.info('Rollback completed');
    } catch (err) {
      logger.error('Rollback failed:', err);
    }
  }, [updateProgress]);

  // Validate content
  const validateContent = useCallback(async (
    formData: CourseFormData,
    generatedStructure: GeneratedStructure
  ): Promise<QualityScore> => {
    updateProgress('validating', 'Validating course content quality...', 5);

    const qualityScore = validateCourseQuality(formData, generatedStructure);
    setQuality(qualityScore);

    return qualityScore;
  }, [updateProgress]);

  // Main creation function
  const createCourse = useCallback(async (
    formData: CourseFormData,
    generatedStructure: GeneratedStructure
  ): Promise<OrchestrationResult> => {
    cancelledRef.current = false;
    startTimeRef.current = Date.now();
    createdEntitiesRef.current = { chapterIds: [], sectionIds: [] };

    setError(null);

    try {
      // ========================================
      // Phase 1: Validate Quality
      // ========================================
      updateProgress('validating', 'Validating course content quality...', 5);

      const qualityScore = validateCourseQuality(formData, generatedStructure);
      setQuality(qualityScore);

      if (!qualityScore.passed) {
        const errorMsg = `Quality score (${qualityScore.overall}) is below minimum (${MINIMUM_QUALITY_SCORE}). Please improve the content.`;
        setError(errorMsg);
        updateProgress('error', errorMsg, 0);

        return {
          success: false,
          quality: qualityScore,
          stats: { totalChapters: 0, totalSections: 0, creationTimeMs: Date.now() - startTimeRef.current },
          error: errorMsg,
        };
      }

      if (cancelledRef.current) throw new Error('Creation cancelled');

      // ========================================
      // Phase 2: Create Course Shell
      // ========================================
      updateProgress('creating_course', 'Creating course in database...', 15);

      // Pre-validation: Check required fields before API call
      const courseTitle = formData.courseTitle?.trim();
      if (!courseTitle || courseTitle.length < 3) {
        throw new Error('Course title must be at least 3 characters long');
      }
      if (courseTitle.length > 200) {
        throw new Error('Course title must not exceed 200 characters');
      }

      // Validate categoryId is a valid UUID before sending (API rejects invalid UUIDs)
      const isValidUUID = (str: string | undefined): boolean => {
        if (!str) return false;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      // Prepare description (max 5000 chars)
      let courseDescription = generatedStructure.courseDescription || '';
      if (courseDescription.length > 5000) {
        courseDescription = courseDescription.substring(0, 4997) + '...';
      }

      const coursePayload: Record<string, unknown> = {
        title: courseTitle,
      };

      // Only add description if not empty
      if (courseDescription) {
        coursePayload.description = courseDescription;
      }

      // Only add learning objectives if array has items
      if (generatedStructure.learningObjectives?.length > 0) {
        // Limit each objective to 500 chars, max 20 objectives
        coursePayload.learningObjectives = generatedStructure.learningObjectives
          .slice(0, 20)
          .map(obj => obj.length > 500 ? obj.substring(0, 497) + '...' : obj);
      }

      // Only include categoryId if it's a valid UUID
      if (isValidUUID(formData.courseCategory)) {
        coursePayload.categoryId = formData.courseCategory;
      }

      // Only include subcategoryId if it's a valid UUID
      if (isValidUUID(formData.courseSubcategory)) {
        coursePayload.subcategoryId = formData.courseSubcategory;
      }

      logger.info('Creating course with payload:', {
        title: courseTitle,
        hasDescription: !!coursePayload.description,
        objectivesCount: (coursePayload.learningObjectives as string[] | undefined)?.length || 0,
        hasCategoryId: !!coursePayload.categoryId,
        hasSubcategoryId: !!coursePayload.subcategoryId,
      });

      const courseResponse = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coursePayload),
      });

      if (!courseResponse.ok) {
        const errorData = await courseResponse.json();
        throw new Error(errorData.error?.message || 'Failed to create course');
      }

      const courseResult = await courseResponse.json();
      const courseId = courseResult.data?.id || courseResult.id;

      if (!courseId) {
        throw new Error('No course ID returned from API');
      }

      createdEntitiesRef.current.courseId = courseId;
      logger.info('Course created:', courseId);

      if (cancelledRef.current) {
        await rollback(createdEntitiesRef.current);
        throw new Error('Creation cancelled');
      }

      // ========================================
      // Phase 3: Fill Course Fields
      // ========================================
      updateProgress('filling_course', 'Filling course details...', 25);

      const updatePayload: Record<string, unknown> = {
        courseId,
        description: generatedStructure.courseDescription,
        whatYouWillLearn: generatedStructure.learningObjectives,
        difficulty: formData.difficulty,
        courseGoals: formData.courseGoals?.join('\n') || '',
      };

      if (formData.price !== undefined) {
        updatePayload.price = formData.price;
      }

      const updateResponse = await fetch('/api/course-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!updateResponse.ok) {
        logger.warn('Course update had issues, continuing...');
      }

      if (cancelledRef.current) {
        await rollback(createdEntitiesRef.current);
        throw new Error('Creation cancelled');
      }

      // ========================================
      // Phase 4: Create Chapters
      // ========================================
      const chapters = generatedStructure.chapters || [];
      const totalChapters = chapters.length;
      let completedChapters = 0;

      for (const chapter of chapters) {
        if (cancelledRef.current) {
          await rollback(createdEntitiesRef.current);
          throw new Error('Creation cancelled');
        }

        updateProgress(
          'creating_chapters',
          `Creating chapter: ${chapter.title}`,
          30 + (completedChapters / totalChapters) * 30,
          {
            currentItem: chapter.title,
            totalItems: totalChapters,
            completedItems: completedChapters,
          }
        );

        // Create chapter
        const chapterResponse = await fetch(`/api/courses/${courseId}/chapters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: chapter.title,
          }),
        });

        if (!chapterResponse.ok) {
          logger.error('Failed to create chapter:', chapter.title);
          continue;
        }

        const chapterResult = await chapterResponse.json();
        const chapterId = chapterResult.data?.id || chapterResult.id;

        if (!chapterId) {
          logger.error('No chapter ID returned');
          continue;
        }

        createdEntitiesRef.current.chapterIds.push(chapterId);

        // Log incoming chapter data for debugging
        logger.info('[ORCHESTRATOR] Chapter data received:', {
          chapterTitle: chapter.title,
          hasDescription: !!chapter.description,
          descriptionLength: chapter.description?.length || 0,
          learningOutcomesType: typeof chapter.learningOutcomes,
          learningOutcomesCount: Array.isArray(chapter.learningOutcomes) ? chapter.learningOutcomes.length : 0,
          bloomsLevel: chapter.bloomsLevel,
        });

        // Format learning outcomes as a structured string (database stores as String)
        let formattedLearningOutcomes: string;
        if (Array.isArray(chapter.learningOutcomes) && chapter.learningOutcomes.length > 0) {
          // Format as numbered list with Bloom's taxonomy labels
          formattedLearningOutcomes = chapter.learningOutcomes
            .map((outcome, idx) => `${idx + 1}. ${outcome}`)
            .join('\n');
          logger.info('[ORCHESTRATOR] Using AI-generated chapter learning outcomes:', formattedLearningOutcomes.substring(0, 100));
        } else if (typeof chapter.learningOutcomes === 'string' && chapter.learningOutcomes.trim()) {
          formattedLearningOutcomes = chapter.learningOutcomes;
          logger.info('[ORCHESTRATOR] Using string chapter learning outcomes:', formattedLearningOutcomes.substring(0, 100));
        } else {
          // Generate default learning outcomes based on chapter title and Bloom's level
          formattedLearningOutcomes = generateDefaultChapterOutcomes(
            chapter.title,
            chapter.bloomsLevel,
            formData.learningObjectivesPerChapter || 5
          );
          logger.info('[ORCHESTRATOR] Generated default chapter learning outcomes:', formattedLearningOutcomes.substring(0, 100));
        }

        // Prepare chapter update payload
        const chapterUpdatePayload = {
          description: chapter.description,
          learningOutcomes: formattedLearningOutcomes,
          courseGoals: chapter.courseGoals || `Master the concepts covered in ${chapter.title}`,
          estimatedTime: chapter.estimatedTime || calculateEstimatedTime(chapter.sections?.length || 3),
          difficulty: chapter.difficulty || formData.difficulty,
          prerequisites: chapter.prerequisites || (chapter.position > 1 ? 'Completion of previous chapters recommended' : 'None'),
          isFree: chapter.isFree || chapter.position === 1, // First chapter often free
        };

        logger.info('[ORCHESTRATOR] Sending chapter PATCH:', {
          chapterId,
          fieldsToUpdate: Object.keys(chapterUpdatePayload),
          hasDescription: !!chapterUpdatePayload.description,
          hasLearningOutcomes: !!chapterUpdatePayload.learningOutcomes,
        });

        // Update chapter with comprehensive details
        const chapterUpdateResponse = await fetch(`/api/courses/${courseId}/chapters/${chapterId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chapterUpdatePayload),
        });

        if (!chapterUpdateResponse.ok) {
          const errorText = await chapterUpdateResponse.text();
          logger.warn('[ORCHESTRATOR] Failed to update chapter details:', {
            chapterTitle: chapter.title,
            status: chapterUpdateResponse.status,
            error: errorText,
          });
        } else {
          logger.info('[ORCHESTRATOR] Chapter updated successfully:', chapter.title);
        }

        // ========================================
        // Phase 5: Create Sections for this Chapter
        // ========================================
        const sections = chapter.sections || [];
        let completedSections = 0;

        for (const section of sections) {
          if (cancelledRef.current) {
            await rollback(createdEntitiesRef.current);
            throw new Error('Creation cancelled');
          }

          updateProgress(
            'creating_sections',
            `Creating section: ${section.title}`,
            60 + (completedChapters / totalChapters) * 30 + (completedSections / sections.length) * (30 / totalChapters),
            {
              currentItem: section.title,
              totalItems: sections.length,
              completedItems: completedSections,
            }
          );

          // Create section
          const sectionResponse = await fetch(
            `/api/courses/${courseId}/chapters/${chapterId}/sections`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: section.title,
              }),
            }
          );

          if (!sectionResponse.ok) {
            logger.error('Failed to create section:', section.title);
            continue;
          }

          const sectionResult = await sectionResponse.json();
          const sectionId = sectionResult.data?.id || sectionResult.id;

          if (!sectionId) {
            logger.error('No section ID returned');
            continue;
          }

          createdEntitiesRef.current.sectionIds.push(sectionId);

          // Log incoming section data for debugging
          logger.info('[ORCHESTRATOR] Section data received:', {
            sectionTitle: section.title,
            hasDescription: !!section.description,
            descriptionLength: section.description?.length || 0,
            learningObjectivesType: typeof section.learningObjectives,
            learningObjectivesCount: Array.isArray(section.learningObjectives) ? section.learningObjectives.length : 0,
            contentType: section.contentType,
          });

          // Format learning objectives for section based on Bloom's taxonomy
          let formattedSectionObjectives: string;
          if (Array.isArray(section.learningObjectives) && section.learningObjectives.length > 0) {
            formattedSectionObjectives = section.learningObjectives
              .map((obj, idx) => `${idx + 1}. ${obj}`)
              .join('\n');
            logger.info('[ORCHESTRATOR] Using AI-generated section learning objectives:', formattedSectionObjectives.substring(0, 100));
          } else if (typeof section.learningObjectives === 'string' && section.learningObjectives.trim()) {
            formattedSectionObjectives = section.learningObjectives;
            logger.info('[ORCHESTRATOR] Using string section learning objectives:', formattedSectionObjectives.substring(0, 100));
          } else {
            // Generate Bloom's-aligned objectives for the section
            const sectionBloomsLevel = section.bloomsLevel || chapter.bloomsLevel || 'APPLY';
            formattedSectionObjectives = generateDefaultSectionObjectives(
              section.title,
              sectionBloomsLevel,
              formData.learningObjectivesPerSection || 3
            );
            logger.info('[ORCHESTRATOR] Generated default section learning objectives:', formattedSectionObjectives.substring(0, 100));
          }

          // Prepare section update payload
          const sectionUpdatePayload = {
            description: section.description,
            learningObjectives: formattedSectionObjectives,
            type: section.contentType,
            estimatedDuration: section.estimatedDuration || '15-20 minutes',
            isFree: section.isFree || (chapter.position === 1 && section.position === 1), // First section of first chapter often free
          };

          logger.info('[ORCHESTRATOR] Sending section PATCH:', {
            sectionId,
            fieldsToUpdate: Object.keys(sectionUpdatePayload),
            hasDescription: !!sectionUpdatePayload.description,
            hasLearningObjectives: !!sectionUpdatePayload.learningObjectives,
          });

          // Update section with comprehensive details
          const sectionUpdateResponse = await fetch(
            `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sectionUpdatePayload),
            }
          );

          if (!sectionUpdateResponse.ok) {
            const errorText = await sectionUpdateResponse.text();
            logger.warn('[ORCHESTRATOR] Failed to update section details:', {
              sectionTitle: section.title,
              status: sectionUpdateResponse.status,
              error: errorText,
            });
          } else {
            logger.info('[ORCHESTRATOR] Section updated successfully:', section.title);
          }

          completedSections++;
        }

        completedChapters++;
      }

      // ========================================
      // Phase 6: Finalize
      // ========================================
      updateProgress('finalizing', 'Finalizing course creation...', 95);

      // Small delay to ensure all writes are complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const creationTime = Date.now() - startTimeRef.current;
      const totalSections = createdEntitiesRef.current.sectionIds.length;

      updateProgress('complete', 'Course created successfully!', 100);

      toast.success(
        `Course created with ${totalChapters} chapters and ${totalSections} sections!`,
        { duration: 5000 }
      );

      // Navigate to course page
      const courseUrl = `/teacher/courses/${courseId}`;

      // Delay navigation slightly to show completion
      setTimeout(() => {
        router.push(courseUrl);
      }, 1500);

      return {
        success: true,
        courseId,
        courseUrl,
        quality: qualityScore,
        stats: {
          totalChapters,
          totalSections,
          creationTimeMs: creationTime,
        },
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error('Course creation failed:', err);

      setError(errorMessage);
      updateProgress('error', errorMessage, 0);

      toast.error(`Course creation failed: ${errorMessage}`);

      return {
        success: false,
        quality: quality || INITIAL_QUALITY,
        stats: {
          totalChapters: createdEntitiesRef.current.chapterIds.length,
          totalSections: createdEntitiesRef.current.sectionIds.length,
          creationTimeMs: Date.now() - startTimeRef.current,
        },
        error: errorMessage,
      };
    }
  }, [updateProgress, rollback, quality, router]);

  // Reset state
  const reset = useCallback(() => {
    setProgress(INITIAL_PROGRESS);
    setQuality(null);
    setError(null);
    createdEntitiesRef.current = { chapterIds: [], sectionIds: [] };
    cancelledRef.current = false;
  }, []);

  // Cancel creation
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    toast.info('Cancelling course creation...');
  }, []);

  return {
    progress,
    quality,
    isCreating: progress.phase !== 'idle' && progress.phase !== 'complete' && progress.phase !== 'error',
    error,
    createCourse,
    validateContent,
    reset,
    cancel,
  };
}

export default useSAMCourseCreationOrchestrator;
