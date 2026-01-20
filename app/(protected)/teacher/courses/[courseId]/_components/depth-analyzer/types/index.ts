/**
 * Type definitions for Course Depth Analyzer
 * Extracted from course-depth-analyzer.tsx for modularity
 */

// ============================================
// Phase 1-4 Enhanced Analysis Types
// ============================================

export interface QMComplianceData {
  overallScore: number;
  essentialsMet: boolean;
  essentialsCount: { met: number; total: number };
  qmCertifiable: boolean;
  categoryScores: Record<string, { earned: number; max: number; percentage: number }>;
  topRecommendations: Array<{
    standardId: string;
    priority: string;
    title: string;
    description: string;
    isEssential: boolean;
    actionSteps: string[];
  }>;
  standardsEvaluated: number;
  standardsMet: number;
}

export interface OLCComplianceData {
  overallScore: number;
  qualityLevel: string;
  categoryScores: Record<string, { earned: number; max: number; percentage: number }>;
  strengths: string[];
  areasForImprovement: string[];
  topRecommendations: Array<{
    indicatorId: string;
    category: string;
    priority: string;
    currentLevel: number;
    targetLevel: number;
    actionSteps: string[];
  }>;
}

export interface DistributionAnalysisData {
  courseType: string;
  detectedType: string;
  typeConfidence: number;
  alignmentScore: number;
  cognitiveRigorScore: number;
  balanceAssessment: {
    type: string;
    lowerOrder: number;
    middleOrder: number;
    higherOrder: number;
    idealRatio: { lower: number; middle: number; higher: number };
    deviation: number;
    recommendation: string;
  };
  levelAnalysis: Array<{
    level: string;
    actual: number;
    target: number;
    deviation: number;
    status: string;
    percentile: number;
    actionRequired: boolean;
    suggestedActions: string[];
  }>;
  dokAnalysis: {
    distribution: Record<string, number>;
    alignmentScore: number;
    dominantLevel: number;
    strategicThinkingPercent: number;
    recommendations: string[];
  };
  topRecommendations: Array<{
    priority: string;
    level: string;
    type: string;
    description: string;
    actionSteps: string[];
    researchSupport: string;
    estimatedImpact: string;
  }>;
  researchBasis: {
    citation: string;
    applicability: string;
    limitations: string[];
  };
}

export interface DeepContentAnalysisData {
  bloomsDistribution: Record<string, number>;
  dokDistribution: Record<string, number>;
  weightedBloomsDistribution: Record<string, number>;
  overallConfidence: number;
  analysisMethod: string;
  contentCoverage: {
    totalSources: number;
    analyzedSources: number;
    skippedSources: number;
    totalWords: number;
    totalSentences: number;
    averageWordsPerSentence: number;
    contentTypes: Record<string, number>;
  };
  contextDistribution: Record<string, number>;
  contentGaps: Array<{
    type: string;
    level?: string;
    context?: string;
    severity: string;
    description: string;
    recommendation: string;
  }>;
  topRecommendations: string[];
  verbFrequencySummary: Array<{
    verb: string;
    count: number;
    level: string;
  }>;
  researchBasis: {
    framework: string;
    citation: string;
    methodology: string;
  };
}

export interface TranscriptAnalysisData {
  totalVideos: number;
  videosWithTranscripts: number;
  videosAnalyzed: number;
  videosMissingTranscripts: number;
  transcriptCoveragePercent: number;
  totalWordCount: number;
  averageConfidence: number;
  qualityDistribution: Record<string, number>;
  recommendations: string[];
}

export interface ComplianceSummary {
  qmScore: number;
  olcScore: number;
  combinedScore: number;
  qmCertifiable: boolean;
  olcQualityLevel: string;
}

// ============================================
// Core Analysis Types
// ============================================

export interface SMARTCriteria {
  specific: { score: number; feedback: string };
  measurable: { score: number; feedback: string };
  achievable: { score: number; feedback: string };
  relevant: { score: number; feedback: string };
  timeBound: { score: number; feedback: string };
}

export interface ObjectiveAnalysis {
  objective: string;
  bloomsLevel: string;
  actionVerb?: string;
  smartCriteria?: SMARTCriteria;
  clarityScore?: number;
  verbStrength?: 'weak' | 'moderate' | 'strong';
  suggestions: string[];
  improvedVersion?: string;
}

export interface ChapterAnalysisItem {
  chapterTitle: string;
  bloomsLevel: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
}

// Alias for backwards compatibility
export type ChapterAnalysis = ChapterAnalysisItem;

export interface Gap {
  level: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  type: 'content' | 'structure' | 'activity' | 'assessment' | 'objectives';
  category?: string;
  title: string;
  description: string;
  impact?: string;
  effort?: 'low' | 'medium' | 'high';
  examples: string[];
  actionSteps?: string[];
}

export interface BloomsInsights {
  dominantLevel: string;
  missingLevels: string[];
  balanceScore: number;
  improvementSuggestions: string[];
}

export interface AssessmentQuality {
  overallScore?: number;
  questionVariety?: { score: number };
  difficultyProgression?: { score: number };
  bloomsCoverage?: { score: number };
  feedbackQuality?: { score: number };
}

export interface Scores {
  depth: number;
  balance: number;
  complexity: number;
  completeness: number;
}

export interface ImprovementPlan {
  immediate: Recommendation[];
  shortTerm: Recommendation[];
  longTerm: Recommendation[];
  timeline: string;
}

export interface AnalysisData {
  overallDistribution: Record<string, number>;
  bloomsDistribution: Record<string, number>;
  chapterAnalysis: ChapterAnalysisItem[];
  objectivesAnalysis: ObjectiveAnalysis[];
  scores: Scores;
  gaps: Gap[];
  recommendations: Recommendation[];
  insights?: string[];
  improvementPlan?: ImprovementPlan;
  samEngineResults?: {
    bloomsAnalysis?: unknown;
    marketAnalysis?: unknown;
    qualityAnalysis?: unknown;
    completionAnalysis?: unknown;
  };
  bloomsInsights?: BloomsInsights;
  assessmentQuality?: AssessmentQuality;
  dokDistribution?: Record<string, number>;
  courseType?: string;
  courseTypeMatch?: number;
  objectiveDeduplication?: unknown;
  learningPathway?: unknown;
  metadata?: unknown;
  // Additional properties for depth analysis
  averageDepth?: number;
  dominantLevel?: string;
  cognitiveBalance?: string;
  depthTrend?: string;
  overallScore?: number;
}

export interface EnhancedAnalysisResponse {
  success: boolean;
  enhanced: boolean;
  analysisMethod: string;
  cached?: boolean;
  analysis: AnalysisData;
  deterministic?: unknown;
  standards?: {
    engineVersion: string;
    rulesEvaluated: number;
    rulesPassed: number;
    rulesFailed: number;
    overallScore: number;
    categoryScores: Record<string, { earned: number; max: number; percentage: number }>;
    prioritizedRecommendations: unknown[];
    researchCitations: string[];
  };
  qmCompliance?: QMComplianceData;
  olcCompliance?: OLCComplianceData;
  complianceSummary?: {
    qmScore: number;
    olcScore: number;
    combinedScore: number;
    qmCertifiable: boolean;
    olcQualityLevel: string;
    criticalIssues: unknown[];
  };
  distributionAnalysis?: DistributionAnalysisData;
  deepContentAnalysis?: DeepContentAnalysisData;
  transcriptAnalysis?: TranscriptAnalysisData;
}

// ============================================
// Component Props Types
// ============================================

export interface CourseData {
  title: string;
  description?: string;
  whatYouWillLearn?: string[];
  chapters: unknown[];
}

/** Data passed to onAnalysisComplete callback */
export interface AnalysisCompleteData {
  courseId: string;
  courseTitle: string;
  cognitiveDepth: number;
  analyzedAt: Date;
}

export interface CourseDepthAnalyzerProps {
  courseId: string;
  courseData: CourseData;
  completionStatus?: unknown;
  /** Auto-load saved analysis when component mounts (e.g., from Recent Analyses) */
  autoLoadSaved?: boolean;
  /** Callback when analysis completes - used to update parent state */
  onAnalysisComplete?: (data: AnalysisCompleteData) => void;
}

// ============================================
// Analysis State Type
// ============================================

export interface AnalysisState {
  isAnalyzing: boolean;
  analysisData: AnalysisData | null;
  hasInitialAnalysis: boolean;
  isCached: boolean;
  isCheckingSaved: boolean;
  hasSavedAnalysis: boolean;
  savedAnalysisDate: Date | null;
  isStale: boolean;
  isEnhanced: boolean;
  qmCompliance: QMComplianceData | null;
  olcCompliance: OLCComplianceData | null;
  distributionAnalysis: DistributionAnalysisData | null;
  deepContentAnalysis: DeepContentAnalysisData | null;
  transcriptAnalysis: TranscriptAnalysisData | null;
  complianceSummary: ComplianceSummary | null;
}

// ============================================
// Utility Types
// ============================================

export type TabValue = 'overview' | 'standards' | 'deep-analysis' | 'chapters' | 'objectives' | 'recommendations';

export interface ScoreMetric {
  label: string;
  score: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'cyan' | 'emerald' | 'amber';
  delay: number;
}

export interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'emerald' | 'violet' | 'amber';
  description: string;
}

// ============================================
// Phase 5-7: Enhanced Depth Analysis Types
// Multi-Framework, Alignment, Evidence Integration
// ============================================

// Framework Types
export type FrameworkType = 'blooms' | 'dok' | 'solo' | 'fink' | 'marzano';

export interface SOLODistribution {
  prestructural: number;
  unistructural: number;
  multistructural: number;
  relational: number;
  extended_abstract: number;
}

export interface FinkDistribution {
  foundational_knowledge: number;
  application: number;
  integration: number;
  human_dimension: number;
  caring: number;
  learning_how_to_learn: number;
}

export interface MarzanoDistribution {
  retrieval: number;
  comprehension: number;
  analysis: number;
  knowledge_utilization: number;
  metacognition: number;
  self_system: number;
}

export interface FrameworkAnalysis {
  framework: FrameworkType;
  distribution: Record<string, number>;
  dominantLevel: string;
  balanceScore: number;
  alignmentWithIdeal: number;
  confidence: number;
  levelAnalysis?: Array<{
    level: string;
    percentage: number;
    deviation: number;
    status: 'under' | 'on-target' | 'over';
    recommendation?: string;
  }>;
}

export interface FrameworkRecommendation {
  framework: FrameworkType;
  type: 'add_content' | 'reduce_content' | 'rebalance' | 'align_assessments';
  priority: 'high' | 'medium' | 'low';
  level?: string;
  description: string;
  actionItems?: string[];
}

export interface MultiFrameworkResult {
  primary: FrameworkAnalysis;
  secondary: FrameworkAnalysis[];
  crossFrameworkAlignment: number;
  recommendations: FrameworkRecommendation[];
  compositeScore: number;
  compositeMethod: 'weighted_average' | 'min_score' | 'custom';
  courseType?: string;
  metadata: {
    analysisVersion: string;
    analyzedAt: Date;
    frameworksUsed: FrameworkType[];
    totalContentAnalyzed: number;
  };
}

// Alignment Matrix Types
export interface LinkedSection {
  sectionId: string;
  sectionTitle: string;
  alignmentScore: number;
  matchedKeywords: string[];
}

export interface LinkedAssessment {
  assessmentId: string;
  assessmentTitle: string;
  alignmentScore: number;
  questionsAligned: number;
  totalQuestions: number;
}

export interface ObjectiveAlignmentItem {
  objectiveId: string;
  objectiveText: string;
  linkedSections: LinkedSection[];
  linkedAssessments: LinkedAssessment[];
  overallAlignment: number;
  gaps: string[];
}

export interface AlignmentGapItem {
  type: 'missing_content' | 'missing_assessment' | 'weak_alignment' | 'orphan_content';
  severity: 'critical' | 'high' | 'medium' | 'low';
  objectiveId?: string;
  sectionId?: string;
  assessmentId?: string;
  description: string;
  recommendation: string;
}

export interface AlignmentMatrixData {
  courseId: string;
  objectives: ObjectiveAlignmentItem[];
  gaps: AlignmentGapItem[];
  summary: {
    totalObjectives: number;
    objectivesCovered: number;
    objectivesWithGaps: number;
    overallAlignmentScore: number;
    contentCoverage: number;
    assessmentCoverage: number;
  };
  analyzedAt: Date;
}

// Evidence Tracker Types
export interface EvidenceItem {
  id: string;
  sourceType: 'objective' | 'section' | 'assessment' | 'transcript' | 'attachment';
  sourceId: string;
  sourceTitle: string;
  text: string;
  level: string;
  framework: FrameworkType;
  confidence: number;
  position?: {
    start: number;
    end: number;
    lineNumber?: number;
  };
  keywords: string[];
  context?: string;
}

export interface ConfidenceDistribution {
  high: number;   // >= 0.8
  medium: number; // >= 0.5 && < 0.8
  low: number;    // < 0.5
}

export interface EvidenceByFramework {
  framework: FrameworkType;
  count: number;
  avgConfidence: number;
  topLevel: string;
}

export interface EvidenceData {
  courseId: string;
  totalEvidence: number;
  avgConfidence: number;
  confidenceDistribution: ConfidenceDistribution;
  evidenceByFramework: EvidenceByFramework[];
  evidenceBySource: Record<string, number>;
  topEvidence: EvidenceItem[];
  analyzedAt: Date;
}

// Content Ingestion Types
export interface ContentExtractionResult {
  attachmentId: string;
  attachmentName: string;
  contentType: string;
  status: 'completed' | 'failed' | 'skipped';
  extractedText?: string;
  wordCount?: number;
  pageCount?: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface ContentIngestionData {
  courseId: string;
  totalAttachments: number;
  successfulExtractions: number;
  failedExtractions: number;
  results: ContentExtractionResult[];
  totalWords: number;
  ingestedAt: Date;
}

// LLM Analysis Types
export interface LLMAnalysisResult {
  analysisType: 'blooms' | 'dok' | 'multi-framework' | 'alignment' | 'recommendations';
  provider: 'openai' | 'anthropic' | 'deepseek';
  result: unknown;
  confidence?: number;
  processingTime?: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// Extended Analysis State
export interface EnhancedAnalysisState extends AnalysisState {
  multiFrameworkData: MultiFrameworkResult | null;
  alignmentMatrix: AlignmentMatrixData | null;
  evidenceData: EvidenceData | null;
  contentIngestion: ContentIngestionData | null;
  llmAnalysis: LLMAnalysisResult | null;
  isLoadingMultiFramework: boolean;
  isLoadingAlignment: boolean;
  isLoadingEvidence: boolean;
  isLoadingIngestion: boolean;
  isLoadingLLM: boolean;
}
