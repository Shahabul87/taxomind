/**
 * Enhanced Course Depth Analysis Types
 * Comprehensive TypeScript interfaces for robust analysis engine
 */

import type { BloomsLevel } from '@sam-ai/core';

// ============================================
// Core Bloom's Taxonomy Types
// ============================================

export interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
  [key: string]: number; // Index signature for dynamic access
}

export type BloomsBalance = 'well-balanced' | 'bottom-heavy' | 'top-heavy';

// ============================================
// Webb's Depth of Knowledge (DOK) Types
// ============================================

export type WebbDOKLevel = 1 | 2 | 3 | 4;

export interface WebbDOKAnalysis {
  level: WebbDOKLevel;
  levelName: 'Recall' | 'Skill/Concept' | 'Strategic Thinking' | 'Extended Thinking';
  indicators: string[];
  bloomsCorrelation: BloomsLevel;
  confidence: number;
}

export interface WebbDOKDistribution {
  level1: number; // Recall
  level2: number; // Skill/Concept
  level3: number; // Strategic Thinking
  level4: number; // Extended Thinking
}

export const WEBB_DOK_DESCRIPTORS: Record<WebbDOKLevel, {
  name: string;
  description: string;
  keywords: string[];
  bloomsMapping: BloomsLevel[];
}> = {
  1: {
    name: 'Recall',
    description: 'Recall of information such as facts, definitions, terms, or simple procedures',
    keywords: ['recall', 'identify', 'recognize', 'list', 'name', 'define', 'match', 'quote', 'memorize', 'label'],
    bloomsMapping: ['REMEMBER'],
  },
  2: {
    name: 'Skill/Concept',
    description: 'Use of information, conceptual knowledge, and procedures',
    keywords: ['summarize', 'interpret', 'classify', 'compare', 'organize', 'estimate', 'predict', 'modify', 'explain', 'describe'],
    bloomsMapping: ['UNDERSTAND', 'APPLY'],
  },
  3: {
    name: 'Strategic Thinking',
    description: 'Reasoning, planning, and using evidence to solve problems',
    keywords: ['analyze', 'investigate', 'formulate', 'hypothesize', 'differentiate', 'conclude', 'critique', 'assess', 'justify', 'develop'],
    bloomsMapping: ['ANALYZE', 'EVALUATE'],
  },
  4: {
    name: 'Extended Thinking',
    description: 'Complex reasoning, planning, developing, and thinking over extended time',
    keywords: ['design', 'create', 'synthesize', 'apply concepts', 'connect', 'critique across', 'prove', 'research', 'develop original'],
    bloomsMapping: ['CREATE'],
  },
};

// ============================================
// Course Type and Adaptive Targets
// ============================================

export type CourseType =
  | 'foundational'
  | 'intermediate'
  | 'advanced'
  | 'professional'
  | 'creative'
  | 'technical'
  | 'theoretical';

export interface CourseTypeProfile {
  type: CourseType;
  description: string;
  idealBloomsDistribution: BloomsDistribution;
  idealDOKDistribution: WebbDOKDistribution;
  primaryObjective: string;
  targetAudience: string;
}

export const COURSE_TYPE_PROFILES: Record<CourseType, CourseTypeProfile> = {
  foundational: {
    type: 'foundational',
    description: 'Introductory courses for beginners with no prior knowledge',
    idealBloomsDistribution: {
      REMEMBER: 25,
      UNDERSTAND: 35,
      APPLY: 25,
      ANALYZE: 10,
      EVALUATE: 3,
      CREATE: 2,
    },
    idealDOKDistribution: { level1: 30, level2: 50, level3: 15, level4: 5 },
    primaryObjective: 'Build fundamental understanding',
    targetAudience: 'Complete beginners',
  },
  intermediate: {
    type: 'intermediate',
    description: 'Building on foundational knowledge with practical applications',
    idealBloomsDistribution: {
      REMEMBER: 10,
      UNDERSTAND: 20,
      APPLY: 35,
      ANALYZE: 20,
      EVALUATE: 10,
      CREATE: 5,
    },
    idealDOKDistribution: { level1: 15, level2: 40, level3: 35, level4: 10 },
    primaryObjective: 'Develop practical skills',
    targetAudience: 'Learners with basic knowledge',
  },
  advanced: {
    type: 'advanced',
    description: 'Deep exploration with critical analysis and evaluation',
    idealBloomsDistribution: {
      REMEMBER: 5,
      UNDERSTAND: 10,
      APPLY: 20,
      ANALYZE: 30,
      EVALUATE: 25,
      CREATE: 10,
    },
    idealDOKDistribution: { level1: 5, level2: 25, level3: 45, level4: 25 },
    primaryObjective: 'Master complex concepts',
    targetAudience: 'Experienced practitioners',
  },
  professional: {
    type: 'professional',
    description: 'Industry-focused with real-world problem solving',
    idealBloomsDistribution: {
      REMEMBER: 5,
      UNDERSTAND: 15,
      APPLY: 30,
      ANALYZE: 25,
      EVALUATE: 15,
      CREATE: 10,
    },
    idealDOKDistribution: { level1: 10, level2: 30, level3: 40, level4: 20 },
    primaryObjective: 'Prepare for professional practice',
    targetAudience: 'Working professionals',
  },
  creative: {
    type: 'creative',
    description: 'Focus on innovation, design, and original creation',
    idealBloomsDistribution: {
      REMEMBER: 5,
      UNDERSTAND: 10,
      APPLY: 15,
      ANALYZE: 15,
      EVALUATE: 20,
      CREATE: 35,
    },
    idealDOKDistribution: { level1: 5, level2: 20, level3: 30, level4: 45 },
    primaryObjective: 'Foster creativity and innovation',
    targetAudience: 'Creative professionals and enthusiasts',
  },
  technical: {
    type: 'technical',
    description: 'Hands-on technical skills with implementation focus',
    idealBloomsDistribution: {
      REMEMBER: 10,
      UNDERSTAND: 15,
      APPLY: 40,
      ANALYZE: 20,
      EVALUATE: 10,
      CREATE: 5,
    },
    idealDOKDistribution: { level1: 15, level2: 45, level3: 30, level4: 10 },
    primaryObjective: 'Build technical competency',
    targetAudience: 'Technical practitioners',
  },
  theoretical: {
    type: 'theoretical',
    description: 'Academic focus on concepts, theories, and research',
    idealBloomsDistribution: {
      REMEMBER: 15,
      UNDERSTAND: 25,
      APPLY: 10,
      ANALYZE: 30,
      EVALUATE: 15,
      CREATE: 5,
    },
    idealDOKDistribution: { level1: 20, level2: 30, level3: 40, level4: 10 },
    primaryObjective: 'Deep theoretical understanding',
    targetAudience: 'Researchers and academics',
  },
};

// ============================================
// Assessment Quality Types
// ============================================

export interface AssessmentQualityMetrics {
  overallScore: number;
  questionVariety: QuestionVarietyMetrics;
  difficultyProgression: DifficultyProgressionMetrics;
  bloomsCoverage: BloomsCoverageMetrics;
  feedbackQuality: FeedbackQualityMetrics;
  distractorAnalysis: DistractorAnalysisMetrics | null;
}

export interface QuestionVarietyMetrics {
  score: number;
  typeDistribution: Record<string, number>;
  uniqueTypes: number;
  recommendation: string;
}

export interface DifficultyProgressionMetrics {
  score: number;
  pattern: 'ascending' | 'descending' | 'random' | 'plateaued';
  averageDifficulty: number;
  isAppropriate: boolean;
  recommendation: string;
}

export interface BloomsCoverageMetrics {
  score: number;
  coveredLevels: BloomsLevel[];
  missingLevels: BloomsLevel[];
  distribution: BloomsDistribution;
  recommendation: string;
}

export interface FeedbackQualityMetrics {
  score: number;
  hasExplanations: boolean;
  explanationDepth: 'none' | 'basic' | 'detailed' | 'comprehensive';
  providesRemediation: boolean;
  recommendation: string;
}

export interface DistractorAnalysisMetrics {
  score: number;
  averagePlausibility: number;
  discriminationIndex: number;
  commonMistakes: string[];
  recommendation: string;
}

// ============================================
// Learning Objective Analysis Types
// ============================================

export interface ObjectiveAnalysis {
  objective: string;
  bloomsLevel: BloomsLevel;
  dokLevel: WebbDOKLevel;
  actionVerb: string;
  verbStrength: 'weak' | 'moderate' | 'strong';
  smartCriteria: SMARTCriteriaAnalysis;
  clarityScore: number;
  measurability: MeasurabilityAnalysis;
  suggestions: string[];
  improvedVersion: string;
}

export interface SMARTCriteriaAnalysis {
  specific: CriterionScore;
  measurable: CriterionScore;
  achievable: CriterionScore;
  relevant: CriterionScore;
  timeBound: CriterionScore;
  overallScore: number;
}

export interface CriterionScore {
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface MeasurabilityAnalysis {
  score: number;
  hasQuantifiableOutcome: boolean;
  assessmentMethod: string;
  verificationCriteria: string[];
}

// ============================================
// Objective Clustering (Deduplication)
// ============================================

export interface ObjectiveCluster {
  clusterId: string;
  objectives: string[];
  semanticSimilarity: number;
  recommendation: 'merge' | 'differentiate' | 'keep';
  suggestedMerge: string | null;
  reason: string;
}

export interface ObjectiveDeduplicationResult {
  totalObjectives: number;
  uniqueClusters: number;
  duplicateGroups: ObjectiveCluster[];
  recommendations: string[];
  optimizedObjectives: string[];
}

// ============================================
// Historical Trend Analysis Types
// ============================================

export interface AnalysisSnapshot {
  id: string;
  courseId: string;
  timestamp: Date;
  cognitiveDepth: number;
  balanceScore: number;
  completenessScore: number;
  bloomsDistribution: BloomsDistribution;
  dokDistribution: WebbDOKDistribution;
  assessmentQuality: number;
  totalChapters: number;
  totalSections: number;
  totalObjectives: number;
}

export interface TrendAnalysis {
  period: 'week' | 'month' | 'quarter' | 'year';
  snapshots: AnalysisSnapshot[];
  trends: TrendMetric[];
  improvements: ImprovementMetric[];
  regressions: RegressionMetric[];
  projections: ProjectionMetric[];
}

export interface TrendMetric {
  metric: string;
  startValue: number;
  endValue: number;
  changePercent: number;
  direction: 'improving' | 'declining' | 'stable';
  significance: 'low' | 'medium' | 'high';
}

export interface ImprovementMetric {
  area: string;
  improvement: number;
  milestone: string;
  date: Date;
}

export interface RegressionMetric {
  area: string;
  decline: number;
  possibleCause: string;
  suggestedAction: string;
}

export interface ProjectionMetric {
  metric: string;
  currentValue: number;
  projectedValue: number;
  timeframe: string;
  confidence: number;
}

// ============================================
// Chapter and Section Analysis Types
// ============================================

export interface EnhancedChapterAnalysis {
  chapterId: string;
  chapterTitle: string;
  position: number;
  bloomsDistribution: BloomsDistribution;
  dokDistribution: WebbDOKDistribution;
  primaryBloomsLevel: BloomsLevel;
  primaryDOKLevel: WebbDOKLevel;
  cognitiveDepth: number;
  complexity: ComplexityMetrics;
  sections: EnhancedSectionAnalysis[];
  strengths: string[];
  weaknesses: string[];
  recommendations: ChapterRecommendation[];
}

export interface EnhancedSectionAnalysis {
  sectionId: string;
  sectionTitle: string;
  position: number;
  bloomsLevel: BloomsLevel;
  dokLevel: WebbDOKLevel;
  activities: ActivityAnalysis[];
  learningObjectives: string[];
  contentDepth: number;
  engagementScore: number;
}

export interface ComplexityMetrics {
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  conceptDensity: number;
  prerequisiteCount: number;
  estimatedStudyTime: number;
}

export interface ActivityAnalysis {
  type: string;
  bloomsLevel: BloomsLevel;
  dokLevel: WebbDOKLevel;
  description: string;
  engagementPotential: number;
}

export interface ChapterRecommendation {
  type: 'content' | 'structure' | 'activity' | 'assessment';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  implementation: string[];
}

// ============================================
// Enhanced Analysis Response Types
// ============================================

export interface EnhancedDepthAnalysisResponse {
  courseLevel: {
    bloomsDistribution: BloomsDistribution;
    dokDistribution: WebbDOKDistribution;
    cognitiveDepth: number;
    balance: BloomsBalance;
    courseType: CourseType;
    courseTypeMatch: number;
  };
  chapterAnalysis: EnhancedChapterAnalysis[];
  objectivesAnalysis: ObjectiveAnalysis[];
  objectiveDeduplication: ObjectiveDeduplicationResult;
  assessmentQuality: AssessmentQualityMetrics;
  learningPathway: LearningPathway;
  recommendations: EnhancedRecommendations;
  studentImpact: StudentImpactAnalysis;
  metadata: AnalysisMetadata;
}

export interface LearningPathway {
  current: CognitivePath;
  recommended: CognitivePath;
  gaps: LearningGap[];
  milestones: LearningMilestone[];
}

export interface CognitivePath {
  stages: CognitiveStage[];
  currentStage: number;
  completionPercentage: number;
}

export interface CognitiveStage {
  level: BloomsLevel;
  dokLevel: WebbDOKLevel;
  mastery: number;
  activities: string[];
  timeEstimate: number;
}

export interface LearningGap {
  level: BloomsLevel;
  dokLevel: WebbDOKLevel;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestions: string[];
  estimatedEffortHours: number;
}

export interface LearningMilestone {
  title: string;
  bloomsLevel: BloomsLevel;
  dokLevel: WebbDOKLevel;
  description: string;
  assessmentCriteria: string[];
}

export interface EnhancedRecommendations {
  immediate: Recommendation[];
  shortTerm: Recommendation[];
  longTerm: Recommendation[];
  contentAdjustments: ContentRecommendation[];
  assessmentChanges: AssessmentRecommendation[];
  activitySuggestions: ActivitySuggestion[];
}

export interface Recommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'content' | 'structure' | 'activity' | 'assessment' | 'objectives';
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  estimatedTime: string;
  actionSteps: string[];
  examples: string[];
  bloomsTarget: BloomsLevel;
  dokTarget: WebbDOKLevel;
}

export interface ContentRecommendation {
  type: 'add' | 'modify' | 'remove' | 'restructure';
  targetChapter: string | null;
  targetSection: string | null;
  bloomsLevel: BloomsLevel;
  dokLevel: WebbDOKLevel;
  description: string;
  impact: 'low' | 'medium' | 'high';
  implementation: string[];
}

export interface AssessmentRecommendation {
  type: string;
  bloomsLevel: BloomsLevel;
  dokLevel: WebbDOKLevel;
  description: string;
  examples: string[];
  rubricSuggestion: string;
}

export interface ActivitySuggestion {
  bloomsLevel: BloomsLevel;
  dokLevel: WebbDOKLevel;
  activityType: string;
  description: string;
  implementation: string;
  expectedOutcome: string;
  materials: string[];
  timeRequired: string;
}

export interface StudentImpactAnalysis {
  skillsDeveloped: SkillDevelopment[];
  cognitiveGrowth: GrowthProjection;
  careerAlignment: CareerPath[];
  competencyGains: CompetencyGain[];
}

export interface SkillDevelopment {
  name: string;
  bloomsLevel: BloomsLevel;
  dokLevel: WebbDOKLevel;
  proficiency: number;
  description: string;
  industryRelevance: number;
}

export interface GrowthProjection {
  currentLevel: number;
  projectedLevel: number;
  timeframe: string;
  keyMilestones: string[];
  confidenceInterval: { low: number; high: number };
}

export interface CareerPath {
  role: string;
  alignment: number;
  requiredSkills: string[];
  matchedSkills: string[];
  gapSkills: string[];
  developmentPlan: string;
}

export interface CompetencyGain {
  competency: string;
  beforeLevel: number;
  afterLevel: number;
  bloomsAlignment: BloomsLevel;
  dokAlignment: WebbDOKLevel;
}

export interface AnalysisMetadata {
  analyzedAt: string;
  courseId: string;
  contentHash: string;
  engineVersion: string;
  totalChapters: number;
  totalSections: number;
  totalObjectives: number;
  completionPercentage: number;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  cached: boolean;
  processingTimeMs: number;
}

// ============================================
// Utility Types
// ============================================

export type BloomsLevelKey = keyof BloomsDistribution;

export interface BloomsKeywordMap {
  level: BloomsLevel;
  keywords: string[];
  weight: number;
}

export const BLOOMS_KEYWORD_MAP: BloomsKeywordMap[] = [
  {
    level: 'REMEMBER',
    keywords: ['define', 'identify', 'list', 'name', 'recall', 'recognize', 'state', 'describe', 'memorize', 'repeat', 'label', 'match', 'quote', 'select'],
    weight: 1,
  },
  {
    level: 'UNDERSTAND',
    keywords: ['explain', 'summarize', 'interpret', 'classify', 'compare', 'contrast', 'discuss', 'distinguish', 'predict', 'paraphrase', 'translate', 'illustrate', 'exemplify'],
    weight: 2,
  },
  {
    level: 'APPLY',
    keywords: ['apply', 'demonstrate', 'solve', 'use', 'implement', 'execute', 'carry out', 'practice', 'calculate', 'complete', 'show', 'modify', 'operate', 'experiment'],
    weight: 3,
  },
  {
    level: 'ANALYZE',
    keywords: ['analyze', 'examine', 'investigate', 'categorize', 'differentiate', 'distinguish', 'organize', 'deconstruct', 'attribute', 'outline', 'structure', 'integrate', 'compare', 'contrast'],
    weight: 4,
  },
  {
    level: 'EVALUATE',
    keywords: ['evaluate', 'judge', 'critique', 'justify', 'assess', 'defend', 'support', 'argue', 'prioritize', 'recommend', 'rate', 'select', 'validate', 'appraise'],
    weight: 5,
  },
  {
    level: 'CREATE',
    keywords: ['create', 'design', 'develop', 'formulate', 'construct', 'invent', 'compose', 'generate', 'produce', 'plan', 'devise', 'synthesize', 'build', 'author'],
    weight: 6,
  },
];

export function getBloomsWeight(level: BloomsLevel): number {
  const mapping = BLOOMS_KEYWORD_MAP.find(m => m.level === level);
  return mapping?.weight ?? 1;
}

export function bloomsToDOK(bloomsLevel: BloomsLevel): WebbDOKLevel {
  const mapping: Record<BloomsLevel, WebbDOKLevel> = {
    REMEMBER: 1,
    UNDERSTAND: 2,
    APPLY: 2,
    ANALYZE: 3,
    EVALUATE: 3,
    CREATE: 4,
  };
  return mapping[bloomsLevel];
}

export function dokToBlooms(dokLevel: WebbDOKLevel): BloomsLevel[] {
  return WEBB_DOK_DESCRIPTORS[dokLevel].bloomsMapping;
}
