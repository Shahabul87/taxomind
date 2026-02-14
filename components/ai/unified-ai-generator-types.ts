/**
 * Unified AI Generator - TypeScript Types
 *
 * Centralized type definitions for the unified AI content generation system.
 * Supports context awareness, Bloom's Taxonomy, and multiple content types.
 */

import { LucideIcon } from "lucide-react";
import { BloomsLevel as PrismaBloomsLevel } from "@prisma/client";

// Re-export Prisma BloomsLevel for backend compatibility
export type BloomsLevelPrisma = PrismaBloomsLevel;

// ============================================================================
// Context Types
// ============================================================================

export interface CourseContext {
  title: string;
  description: string | null;
  whatYouWillLearn: string[];
  courseGoals: string | null;
  difficulty: string | null;
  category: string | null;
}

export interface ChapterContext {
  title: string;
  description: string | null;
  learningOutcomes: string | null;
  position: number;
}

export interface SectionContext {
  title: string;
  description: string | null;
  learningObjectives: string | null;
  position: number;
}

export interface FullContext {
  course?: CourseContext;
  chapter?: ChapterContext;
  section?: SectionContext;
}

// ============================================================================
// Bloom's Taxonomy Types
// ============================================================================

/**
 * Frontend Bloom's level format (lowercase)
 *
 * Used in UI components for display and user interaction.
 * For backend/Prisma operations, use BloomsLevelPrisma or convert using:
 * - normalizeToUppercase() from '@/lib/sam/utils/blooms-normalizer'
 *
 * @see lib/sam/utils/blooms-normalizer.ts for conversion utilities
 */
export type BloomsLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

export interface BloomsLevelConfig {
  id: BloomsLevel;
  name: string;
  description: string;
  verbs: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
}

export interface BloomsTaxonomyConfig {
  enabled: boolean;
  levels: Record<BloomsLevel, boolean>;
  autoSuggest?: boolean;
}

export const DEFAULT_BLOOMS_LEVELS: Record<BloomsLevel, boolean> = {
  remember: true,
  understand: true,
  apply: true,
  analyze: false,
  evaluate: false,
  create: false,
};

// ============================================================================
// Content Type Configuration
// ============================================================================

export type ContentType =
  | 'description'
  | 'learningObjectives'
  | 'content'
  | 'chapters'
  | 'sections'
  | 'questions'
  | 'codeExplanation'
  | 'mathExplanation'
  | 'creatorGuidelines';

export type EntityLevel = 'course' | 'chapter' | 'section';

export type OutputFormat = 'html' | 'array' | 'json' | 'markdown' | 'text';

export interface ContentTypeConfig {
  type: ContentType;
  title: string;
  description: string;
  icon: LucideIcon;
  color: 'sky' | 'indigo' | 'purple' | 'emerald' | 'amber';
  promptTemplate: string;
  outputFormat: OutputFormat;
  previewItems: string[];
  promptPlaceholder: string;
  focusPlaceholder: string;
}

// ============================================================================
// Generator Props
// ============================================================================

export type TriggerVariant =
  | 'default'
  | 'sky-gradient'
  | 'purple-gradient'
  | 'outline'
  | 'ghost';

// Chapter generation specific options
export interface ChapterGenerationOptions {
  defaultCount?: number;
  minCount?: number;
  maxCount?: number;
}

// Chapter-specific settings (used in API and UI)
export type ChapterDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ChapterSettings {
  chapterCount: number;
  difficulty: ChapterDifficulty;
  targetDuration: string;
  focusAreas: string[];
  includeKeywords: string;
  additionalInstructions: string;
}

export const DEFAULT_CHAPTER_SETTINGS: ChapterSettings = {
  chapterCount: 5,
  difficulty: 'intermediate',
  targetDuration: '3-4 hours',
  focusAreas: [],
  includeKeywords: '',
  additionalInstructions: '',
};

export const CHAPTER_DIFFICULTY_OPTIONS: Record<ChapterDifficulty, { label: string; description: string }> = {
  beginner: { label: 'Beginner', description: 'Foundational concepts, step-by-step' },
  intermediate: { label: 'Intermediate', description: 'Building on basics, practical applications' },
  advanced: { label: 'Advanced', description: 'Complex topics, expert-level content' },
};

export const CHAPTER_DURATION_OPTIONS = [
  { value: '2-3 hours', label: '2-3 hours per chapter' },
  { value: '3-4 hours', label: '3-4 hours per chapter' },
  { value: '4-6 hours', label: '4-6 hours per chapter' },
  { value: '6-8 hours', label: '6-8 hours per chapter' },
];

export const CHAPTER_FOCUS_AREA_OPTIONS = [
  'Practical Applications',
  'Theoretical Foundations',
  'Hands-on Projects',
  'Real-world Examples',
  'Industry Best Practices',
  'Problem Solving',
  'Case Studies',
  'Technical Skills',
  'Critical Thinking',
  'Creative Projects',
  'Professional Development',
  'Assessment & Evaluation',
];

// ============================================================================
// Section Generation Types
// ============================================================================

// Section generation specific options
export interface SectionGenerationOptions {
  defaultCount?: number;
  minCount?: number;
  maxCount?: number;
}

// Section-specific settings (used in API and UI)
export interface SectionSettings {
  sectionCount: number;
  contentType: SectionContentType;
  includeAssessment: boolean;
  focusAreas: string[];
  additionalInstructions: string;
}

export type SectionContentType = 'mixed' | 'theory' | 'practical' | 'project';

export const DEFAULT_SECTION_SETTINGS: SectionSettings = {
  sectionCount: 5,
  contentType: 'mixed',
  includeAssessment: true,
  focusAreas: [],
  additionalInstructions: '',
};

export const SECTION_CONTENT_TYPE_OPTIONS: Record<SectionContentType, { label: string; description: string }> = {
  mixed: { label: 'Mixed Content', description: 'Balanced theory and practical content' },
  theory: { label: 'Theory Focused', description: 'Concepts, explanations, and definitions' },
  practical: { label: 'Practical Focused', description: 'Hands-on exercises and examples' },
  project: { label: 'Project Based', description: 'Build real projects step by step' },
};

export const SECTION_FOCUS_AREA_OPTIONS = [
  'Introduction & Overview',
  'Core Concepts',
  'Step-by-Step Tutorial',
  'Code Examples',
  'Best Practices',
  'Common Mistakes',
  'Exercises & Practice',
  'Quiz & Assessment',
  'Real-world Application',
  'Summary & Review',
  'Additional Resources',
  'Q&A / FAQ',
];

export interface UnifiedAIGeneratorProps {
  // Required
  contentType: ContentType;
  entityLevel: EntityLevel;
  entityTitle: string;
  onGenerate: (content: string | string[] | object) => void;

  // Context (passed from parent)
  context: FullContext;

  // IDs for API
  courseId?: string;
  chapterId?: string;
  sectionId?: string;

  // Bloom's Taxonomy Configuration
  bloomsTaxonomy?: {
    enabled: boolean;
    defaultLevels?: Record<BloomsLevel, boolean>;
  };

  // Chapter Generation Options (only for contentType="chapters")
  chapterOptions?: ChapterGenerationOptions;

  // Section Generation Options (only for contentType="sections")
  sectionOptions?: SectionGenerationOptions;

  // UI Customization
  trigger?: React.ReactNode;
  triggerVariant?: TriggerVariant;
  size?: 'sm' | 'default' | 'lg';
  buttonText?: string;

  // Feature Flags
  premiumRequired?: boolean;
  isPremium?: boolean;
  showAdvancedMode?: boolean;
  initialMode?: 'simple' | 'advanced';

  // State
  disabled?: boolean;
  existingContent?: string | null;
}

// ============================================================================
// Advanced Settings
// ============================================================================

export interface AdvancedSettings {
  targetAudience: string;
  difficulty: string;
  duration: string;
  tone: string;
  creativity: number;
  detailLevel: number;
  includeExamples: boolean;
  learningStyle: string;
  industryFocus: string;
}

export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  targetAudience: 'general',
  difficulty: 'intermediate',
  duration: '8-12 weeks',
  tone: 'professional',
  creativity: 7,
  detailLevel: 5,
  includeExamples: true,
  learningStyle: 'mixed',
  industryFocus: '',
};

// ============================================================================
// API Types
// ============================================================================

export interface UnifiedGenerateRequest {
  contentType: ContentType;
  entityLevel: EntityLevel;
  entityTitle: string;
  context: FullContext;

  // IDs
  courseId?: string;
  chapterId?: string;
  sectionId?: string;

  // Generation Parameters
  userPrompt?: string;
  focusArea?: string;

  // Bloom's Taxonomy
  bloomsEnabled: boolean;
  bloomsLevels?: Record<BloomsLevel, boolean>;

  // Advanced Settings
  advancedMode?: boolean;
  advancedSettings?: AdvancedSettings;
}

export interface UnifiedGenerateResponse {
  success: boolean;
  content: string | string[] | object;
  bloomsMapping?: Record<BloomsLevel, string[]>;
  metadata?: {
    tokensUsed: number;
    generationTime: number;
    model: string;
    provider?: string;
    qualityScore?: number;
    qualityFeedback?: string;
    generationId?: string;
  };
  error?: string;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface GeneratorState {
  isOpen: boolean;
  isGenerating: boolean;
  isAdvancedMode: boolean;
  activeTab: string;
  userPrompt: string;
  focusArea: string;
  bloomsLevels: Record<BloomsLevel, boolean>;
  advancedSettings: AdvancedSettings;
}
