/**
 * @sam-ai/educational/depth-analysis
 *
 * Enhanced depth analysis engine, analyzers, standards, and types.
 */
export { EnhancedDepthAnalysisEngine, createEnhancedDepthAnalysisEngine, enhancedDepthEngine, generateCourseContentHash, } from './engines/enhanced-depth-engine';
export type { CourseData, ChapterData, SectionData, DepthAnalysisLogger, CourseDepthAnalysisCacheEntry, CourseDepthAnalysisHistoryEntry, CourseDepthAnalysisSnapshotInput, CourseDepthAnalysisStore, EnhancedDepthAnalysisEngineOptions, } from './engines/enhanced-depth-engine';
export type { BloomsDistribution, WebbDOKDistribution, EnhancedDepthAnalysisResponse, EnhancedChapterAnalysis, EnhancedSectionAnalysis, ObjectiveAnalysis, AssessmentQualityMetrics, EnhancedRecommendations, Recommendation, CourseType, LearningPathway, LearningGap, StudentImpactAnalysis, AnalysisMetadata, ObjectiveDeduplicationResult, WebbDOKLevel, } from './types/depth-analysis.types';
export { WebbDOKAnalyzer, webbDOKAnalyzer, } from './analyzers/webb-dok-analyzer';
export { AssessmentQualityAnalyzer, assessmentQualityAnalyzer, } from './analyzers/assessment-quality-analyzer';
export type { ExamData, QuestionData, OptionData } from './analyzers/assessment-quality-analyzer';
export { CourseTypeDetector, courseTypeDetector, } from './analyzers/course-type-detector';
export type { CourseMetadata, CourseTypeDetectionResult, DistributionComparison } from './analyzers/course-type-detector';
export { ObjectiveAnalyzer, objectiveAnalyzer, } from './analyzers/objective-analyzer';
export type { ActionVerbAnalysis } from './analyzers/objective-analyzer';
export { DeterministicRubricEngine, deterministicRubricEngine, serializeAnalysisResult, calculateCourseTypeAlignment, } from './analyzers/deterministic-rubric-engine';
export type { RubricCategory, RubricRule, CourseAnalysisInput, ChapterInput, SectionInput, AssessmentInput, QuestionInput, OptionInput, AttachmentInput, ContentAnalysisInput, DeterministicAnalysisResult, CategoryScore, RuleResult, PrioritizedRecommendation, } from './analyzers/deterministic-rubric-engine';
export { DeepContentAnalyzer, deepContentAnalyzer, } from './analyzers/deep-content-analyzer';
export type { ContentSourceType, ContentContext, ContentSource, SentenceLevelAnalysis, VerbFrequencyEntry, ContentCoverage, ContentGap, DeepContentAnalysisResult, } from './analyzers/deep-content-analyzer';
export { TranscriptAnalyzer, transcriptAnalyzer, } from './analyzers/transcript-analyzer';
export type { TranscriptSourceType, TranscriptSource, TranscriptExtractionResult, TranscriptQualityMetrics, TranscriptAnalysisResult, CourseTranscriptAnalysisResult, } from './analyzers/transcript-analyzer';
export { VALIDATED_DISTRIBUTIONS, getValidatedDistribution, getCitationString, getAllCitations, calculateDistributionAlignment, recommendDistribution, } from './standards/validated-distributions';
export type { ResearchCitation, ValidatedDistribution, } from './standards/validated-distributions';
export { QMEvaluator, qmEvaluator, QM_STANDARDS, } from './standards/qm-evaluator';
export type { QMGeneralStandard, QMStandard, QMStandardResult, QMEvaluationResult, QMRecommendation, } from './standards/qm-evaluator';
export { OLCEvaluator, olcEvaluator, OLC_INDICATORS, } from './standards/olc-scorecard';
export type { OLCCategory, OLCIndicator, OLCIndicatorResult, OLCEvaluationResult, OLCRecommendation, } from './standards/olc-scorecard';
export { DistributionAnalyzer, distributionAnalyzer, } from './standards/distribution-analyzer';
export type { BloomsLevel, DOKLevel, DistributionAnalysisResult, CognitiveRigorMatrix, CognitiveRigorCell, BalanceAssessment, LevelAnalysis, DOKAnalysis, StatisticalConfidence, DistributionRecommendation, ResearchBasis, } from './standards/distribution-analyzer';
//# sourceMappingURL=depth-analysis.d.ts.map