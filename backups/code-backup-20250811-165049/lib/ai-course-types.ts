import * as z from "zod";

// Enums for better type safety
export enum CourseQuestionDifficulty {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate", 
  ADVANCED = "advanced"
}

// Alias for backward compatibility
export const CourseDifficulty = CourseQuestionDifficulty;

export enum ContentType {
  VIDEO = "video",
  ARTICLE = "article", 
  BLOG = "blog",
  EXERCISE = "exercise",
  ASSESSMENT = "assessment"
}

export enum LearningStyle {
  VISUAL = "visual",
  AUDITORY = "auditory",
  KINESTHETIC = "kinesthetic",
  READING_WRITING = "reading_writing"
}

// Zod schemas for validation
export const CourseGenerationRequestSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  description: z.string().optional(),
  targetAudience: z.string().min(1, "Target audience is required"),
  duration: z.string().min(1, "Duration is required"),
  difficulty: z.nativeEnum(CourseQuestionDifficulty),
  learningGoals: z.array(z.string()).min(1, "At least one learning goal is required"),
  preferredContentTypes: z.array(z.nativeEnum(ContentType)).optional(),
  learningStyle: z.nativeEnum(LearningStyle).optional(),
});

export const ChapterPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  learningObjectives: z.array(z.string()),
  estimatedTime: z.string(),
  difficulty: z.string(),
  prerequisites: z.array(z.string()),
  sections: z.array(z.object({
    title: z.string(),
    description: z.string(),
    contentType: z.nativeEnum(ContentType),
    estimatedTime: z.string(),
    learningObjectives: z.array(z.string()),
  })),
});

export const CourseGenerationResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  courseGoals: z.string(),
  prerequisites: z.array(z.string()),
  estimatedDuration: z.number(), // in hours
  targetAudience: z.string(),
  difficulty: z.nativeEnum(CourseQuestionDifficulty),
  chapters: z.array(ChapterPlanSchema),
  whatYouWillLearn: z.array(z.string()),
  courseStructure: z.object({
    totalChapters: z.number(),
    totalSections: z.number(),
    contentMix: z.record(z.number()), // content type -> percentage
  }),
});

export const ChapterGenerationRequestSchema = z.object({
  courseContext: z.string().min(1, "Course context is required"),
  chapterTopic: z.string().min(1, "Chapter topic is required"),
  position: z.number().min(1),
  previousChapters: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).min(1, "Learning objectives are required"),
  targetDuration: z.string().optional(),
  difficulty: z.nativeEnum(CourseQuestionDifficulty),
});

export const ChapterGenerationResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  learningOutcomes: z.array(z.string()),
  prerequisites: z.string(),
  estimatedTime: z.string(),
  difficulty: z.string(),
  sections: z.array(z.object({
    title: z.string(),
    description: z.string(),
    type: z.nativeEnum(ContentType),
    estimatedTime: z.string(),
    learningObjectives: z.array(z.string()),
    keyPoints: z.array(z.string()),
  })),
  assessmentSuggestions: z.array(z.object({
    type: z.string(),
    description: z.string(),
    estimatedTime: z.string(),
  })),
});

export const ContentCurationRequestSchema = z.object({
  sectionTopic: z.string().min(1, "Section topic is required"),
  learningObjectives: z.array(z.string()).min(1, "Learning objectives are required"),
  contentTypes: z.array(z.nativeEnum(ContentType)).min(1, "At least one content type is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  difficulty: z.nativeEnum(CourseQuestionDifficulty),
  estimatedTime: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

export const ContentSuggestionSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string().url().optional(),
  platform: z.string().optional(),
  estimatedTime: z.string(),
  difficulty: z.string(),
  qualityScore: z.number().min(0).max(10),
  relevanceScore: z.number().min(0).max(10),
  tags: z.array(z.string()),
  reasoning: z.string(), // Why this content was suggested
});

export const ContentCurationResponseSchema = z.object({
  recommendedContent: z.object({
    videos: z.array(ContentSuggestionSchema),
    articles: z.array(ContentSuggestionSchema),
    blogs: z.array(ContentSuggestionSchema),
    exercises: z.array(ContentSuggestionSchema),
  }),
  studyNotes: z.string(),
  keyConcepts: z.array(z.string()),
  practiceQuestions: z.array(z.string()),
  contentMixRecommendation: z.object({
    totalItems: z.number(),
    videoPercentage: z.number(),
    articlePercentage: z.number(),
    blogPercentage: z.number(),
    exercisePercentage: z.number(),
  }),
  learningPath: z.array(z.object({
    step: z.number(),
    activity: z.string(),
    estimatedTime: z.string(),
    contentType: z.nativeEnum(ContentType),
  })),
});

// TypeScript types inferred from schemas
export type CourseGenerationRequest = z.infer<typeof CourseGenerationRequestSchema>;
export type CourseGenerationResponse = z.infer<typeof CourseGenerationResponseSchema>;
export type ChapterPlan = z.infer<typeof ChapterPlanSchema>;
export type ChapterGenerationRequest = z.infer<typeof ChapterGenerationRequestSchema>;
export type ChapterGenerationResponse = z.infer<typeof ChapterGenerationResponseSchema>;
export type ContentCurationRequest = z.infer<typeof ContentCurationRequestSchema>;
export type ContentCurationResponse = z.infer<typeof ContentCurationResponseSchema>;
export type ContentSuggestion = z.infer<typeof ContentSuggestionSchema>;

// AI Interaction tracking types
export interface AIInteraction {
  id: string;
  userId: string;
  type: 'course_creation' | 'chapter_generation' | 'content_curation' | 'assessment_creation';
  prompt: string;
  response: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Form enhancement types for UI
export interface AIAssistanceState {
  isGenerating: boolean;
  currentStep: 'idle' | 'generating_course' | 'generating_chapters' | 'curating_content';
  suggestions: {
    titles: string[];
    descriptions: string[];
    objectives: string[];
    prerequisites: string[];
  };
  progress: {
    current: number;
    total: number;
    status: string;
  };
}

// Progressive form completion types
export interface CourseCreationWizardState {
  step: number;
  maxSteps: number;
  courseData: Partial<CourseGenerationRequest>;
  generatedPlan?: CourseGenerationResponse;
  aiAssistance: AIAssistanceState;
  validationErrors: Record<string, string[]>;
}

// Content quality assessment types
export interface ContentQualityMetrics {
  relevanceScore: number; // 0-10
  difficultyAlignment: number; // 0-10  
  educationalValue: number; // 0-10
  engagementPotential: number; // 0-10
  overallQuality: number; // 0-10
  recommendations: string[];
}

// Learning path optimization types
export interface LearningPathNode {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  difficulty: CourseQuestionDifficulty;
  estimatedTime: number; // in minutes
  prerequisites: string[];
  learningObjectives: string[];
  position: number;
}

export interface OptimizedLearningPath {
  nodes: LearningPathNode[];
  totalDuration: number;
  difficultyProgression: string;
  contentBalance: Record<ContentType, number>;
  recommendations: string[];
}