/**
 * SAM Mode Type System
 *
 * Defines the type structure for SAM engine modes.
 * Each mode maps to a specific set of SAM engines and provides
 * a focused experience for a particular capability domain.
 */

export type SAMModeCategory =
  | 'general'
  | 'content'
  | 'analysis'
  | 'learning'
  | 'assessment'
  | 'research'
  | 'course-design'
  | 'insights';

export interface ModeEngineConfig {
  maxResponseLength?: 'short' | 'medium' | 'long';
  outputFormat?: 'prose' | 'bullet-points' | 'structured' | 'conversational';
  contentFocus?: 'explanation' | 'examples' | 'resources' | 'relationships' | 'multimedia-suggestions';
  targetBloomsLevels?: string[];
  adaptationStrategy?: 'difficulty' | 'style' | 'pace' | 'depth';
  questionFormat?: 'mcq' | 'open-ended' | 'mixed' | 'practical';
  custom?: Record<string, string | number | boolean>;
}

export interface SAMMode {
  id: string;
  label: string;
  category: SAMModeCategory;
  /** Formal message posted in chat when mode activates */
  greeting: string;
  /** Engine pipeline to activate (appended to base 'context' engine) */
  enginePreset: string[];
  /** Additional system prompt instructions for this mode */
  systemPromptAddition: string;
  /** Tool categories this mode is allowed to invoke */
  allowedToolCategories: string[];
  /** Optional engine behavior configuration for differentiation */
  engineConfig?: ModeEngineConfig;
}

/** Union of all valid mode IDs */
export const SAM_MODE_IDS = [
  // General
  'general-assistant',
  // Content & Creation
  'content-creator',
  'adaptive-content',
  'microlearning',
  'multimedia',
  // Analysis & Taxonomy
  'blooms-analyzer',
  'depth-analysis',
  'cognitive-load',
  'alignment-checker',
  'scaffolding',
  'zpd-evaluator',
  // Learning & Coaching
  'learning-coach',
  'socratic-tutor',
  'study-planner',
  'mastery-tracker',
  'spaced-repetition',
  'metacognition',
  'skill-tracker',
  // Assessment & Evaluation
  'exam-builder',
  'practice-problems',
  'evaluation',
  'integrity-checker',
  // Research & Resources
  'research-assistant',
  'resource-finder',
  'trends-analyzer',
  // Course Design
  'course-architect',
  'knowledge-graph',
  'competency-mapper',
  // Insights & Analytics
  'analytics',
  'predictive',
  'market-analysis',
  'collaboration',
] as const;

export type SAMModeId = (typeof SAM_MODE_IDS)[number];

/** Category metadata for UI grouping */
export interface SAMModeCategoryInfo {
  id: SAMModeCategory;
  label: string;
  column: 'left' | 'right';
}

export const MODE_CATEGORIES: SAMModeCategoryInfo[] = [
  { id: 'general', label: 'General', column: 'left' },
  { id: 'content', label: 'Content & Creation', column: 'left' },
  { id: 'analysis', label: 'Analysis & Taxonomy', column: 'left' },
  { id: 'learning', label: 'Learning & Coaching', column: 'left' },
  { id: 'assessment', label: 'Assessment', column: 'right' },
  { id: 'research', label: 'Research & Resources', column: 'right' },
  { id: 'course-design', label: 'Course Design', column: 'right' },
  { id: 'insights', label: 'Insights & Analytics', column: 'right' },
];
