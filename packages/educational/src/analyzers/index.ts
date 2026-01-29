/**
 * Educational Analyzers - Index
 * Export all analyzer modules for easy importing
 */

export { WebbDOKAnalyzer, webbDOKAnalyzer } from './webb-dok-analyzer';
export { AssessmentQualityAnalyzer, assessmentQualityAnalyzer } from './assessment-quality-analyzer';
export type { ExamData, QuestionData, OptionData } from './assessment-quality-analyzer';
export { CourseTypeDetector, courseTypeDetector } from './course-type-detector';
export type { CourseMetadata, CourseTypeDetectionResult, DistributionComparison } from './course-type-detector';
export { ObjectiveAnalyzer, objectiveAnalyzer } from './objective-analyzer';
export type { ActionVerbAnalysis } from './objective-analyzer';

// Deterministic Rubric Engine - Phase 1 Implementation
export {
  DeterministicRubricEngine,
  deterministicRubricEngine,
  serializeAnalysisResult,
  calculateCourseTypeAlignment,
} from './deterministic-rubric-engine';
export type {
  ResearchCitation,
  RubricCategory,
  RubricRule,
  CourseAnalysisInput,
  ChapterInput,
  SectionInput,
  AssessmentInput,
  QuestionInput,
  OptionInput,
  AttachmentInput,
  ContentAnalysisInput,
  DeterministicAnalysisResult,
  CategoryScore,
  RuleResult,
  PrioritizedRecommendation,
  AnalysisMetadata,
} from './deterministic-rubric-engine';

// Deep Content Analyzer - Phase 4 Implementation
export {
  DeepContentAnalyzer,
  deepContentAnalyzer,
} from './deep-content-analyzer';
export type {
  ContentSourceType,
  ContentContext,
  WebbDOKLevel,
  ContentSource,
  SentenceLevelAnalysis,
  BloomsDistribution,
  WebbDOKDistribution,
  VerbFrequencyEntry,
  ContentCoverage,
  ContentGap,
  DeepContentAnalysisResult,
} from './deep-content-analyzer';

// Transcript Analyzer - Phase 4 Implementation
export {
  TranscriptAnalyzer,
  transcriptAnalyzer,
} from './transcript-analyzer';
export type {
  TranscriptSourceType,
  TranscriptSource,
  TranscriptExtractionResult,
  TranscriptQualityMetrics,
  TranscriptAnalysisResult,
  CourseTranscriptAnalysisResult,
} from './transcript-analyzer';

// ============================================================================
// VIDEO COGNITIVE ANALYZER - Phase 4: Multimedia Content Analysis
// ============================================================================

export {
  // Class
  VideoCognitiveAnalyzer,
  // Factory
  createVideoCognitiveAnalyzer,
} from './video-cognitive-analyzer';
export type {
  VideoSource,
  VideoMetadata,
  TranscriptSegment,
  TranscriptChunk,
  ChunkAnalysis,
  CognitiveTransition,
  PausePoint,
  VideoAnalysisResult,
  VideoAnalyzerConfig,
  TranscriptFetcher,
  ContentAnalyzer as VideoContentAnalyzer,
} from './video-cognitive-analyzer';

// ============================================================================
// IMAGE COGNITIVE ANALYZER - Phase 4: Multimedia Content Analysis
// ============================================================================

export {
  // Class
  ImageCognitiveAnalyzer,
  // Factory
  createImageCognitiveAnalyzer,
} from './image-cognitive-analyzer';
export type {
  ImageType,
  VisualComplexity,
  ImageMetadata,
  ExtractedTextRegion,
  VisualElement,
  ColorAnalysis,
  StructuralAnalysis,
  CognitiveAssessment,
  AccessibilityAssessment,
  ImageAnalysisResult,
  ImageAnalyzerConfig,
  VisionProvider,
  ContentAnalyzer as ImageContentAnalyzer,
} from './image-cognitive-analyzer';
