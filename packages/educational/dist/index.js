/**
 * @sam-ai/educational
 *
 * Advanced educational engines for SAM AI Tutor
 * - Exam generation with Bloom's Taxonomy alignment
 * - AI-powered answer evaluation
 * - Cognitive progress tracking
 * - Spaced repetition scheduling
 *
 * @packageDocumentation
 */
// ============================================================================
// ENGINE EXPORTS
// ============================================================================
export { 
// Exam Engine
AdvancedExamEngine, createExamEngine, 
// Evaluation Engine
SAMEvaluationEngine, EvaluationEngine, createEvaluationEngine, 
// Blooms Analysis Engine
BloomsAnalysisEngine, createBloomsAnalysisEngine, 
// Personalization Engine
PersonalizationEngine, createPersonalizationEngine, 
// Content Generation Engine
ContentGenerationEngine, createContentGenerationEngine, 
// Resource Engine
ResourceEngine, createResourceEngine, 
// Multimedia Engine
MultimediaEngine, createMultimediaEngine, 
// Financial Engine
FinancialEngine, createFinancialEngine, 
// Predictive Engine
PredictiveEngine, createPredictiveEngine, 
// Analytics Engine
AnalyticsEngine, createAnalyticsEngine, 
// Memory Engine
MemoryEngine, createMemoryEngine, 
// Research Engine
ResearchEngine, createResearchEngine, 
// Trends Engine
TrendsEngine, createTrendsEngine, 
// Achievement Engine
AchievementEngine, createAchievementEngine, 
// Integrity Engine
IntegrityEngine, createIntegrityEngine, 
// Course Guide Engine
CourseGuideEngine, createCourseGuideEngine, 
// Enhanced Depth Analysis Engine
EnhancedDepthAnalysisEngine, createEnhancedDepthAnalysisEngine, enhancedDepthEngine, 
// Collaboration Engine
CollaborationEngine, createCollaborationEngine, 
// Social Engine
SocialEngine, createSocialEngine, 
// Innovation Engine
InnovationEngine, createInnovationEngine, 
// Market Engine
MarketEngine, createMarketEngine, 
// Unified Bloom's Engine (Priority 1: Unified Bloom's Engine)
UnifiedBloomsEngine, createUnifiedBloomsEngine, UnifiedBloomsAdapterEngine, createUnifiedBloomsAdapterEngine, 
// Phase 2 Engines - Practice Problems, Adaptive Content, Socratic Teaching
PracticeProblemsEngine, createPracticeProblemsEngine, AdaptiveContentEngine, createAdaptiveContentEngine, SocraticTeachingEngine, createSocraticTeachingEngine, 
// Knowledge Graph Engine (New)
KnowledgeGraphEngine, createKnowledgeGraphEngine, 
// Microlearning Engine (New)
MicrolearningEngine, createMicrolearningEngine, 
// Metacognition Engine (New)
MetacognitionEngine, createMetacognitionEngine, 
// Competency Engine (New)
CompetencyEngine, createCompetencyEngine, 
// Peer Learning Engine (New)
PeerLearningEngine, createPeerLearningEngine, 
// Multimodal Input Engine (New)
MultimodalInputEngine, createMultimodalInputEngine, 
// SkillBuildTrack Engine (New - January 2026)
SkillBuildTrackEngine, createSkillBuildTrackEngine, InMemorySkillBuildTrackStore, } from './engines';
// ============================================================================
// VALIDATION EXPORTS (Canonical validation stack for SAM AI)
// ============================================================================
export { 
// Schemas
BloomsLevelSchema, SubjectiveEvaluationResponseSchema, GradingAssistanceResponseSchema, RubricAlignmentSchema, ComparisonToExpectedSchema, AdaptiveQuestionResponseSchema, QuestionOptionSchema, AssessmentQuestionSchema, AssessmentQuestionsResponseSchema, BloomsDistributionSchema, ContentAnalysisResponseSchema, 
// JSON Extraction
extractJson, extractJsonWithOptions, fixCommonJsonIssues, 
// Core Validation
parseAndValidate, validateSchema, safeParseWithDefaults, 
// Retry Logic
createRetryPrompt, executeWithRetry, DEFAULT_RETRY_CONFIG, 
// Advanced Validation
createPartialSchema, validateWithDefaults, 
// Schema-Specific Validators
validateEvaluationResponse, validateGradingAssistanceResponse, validateAdaptiveQuestionResponse, validateAssessmentQuestionsResponse, validateContentAnalysisResponse, } from './validation';
// ============================================================================
// CONTENT INGESTION PIPELINE EXPORTS (Enhanced Depth Analysis - January 2026)
// ============================================================================
export { 
// Extractors
PDFExtractor, pdfExtractor, SlideExtractor, slideExtractor, TextExtractor, textExtractor, AttachmentRouter, attachmentRouter, contentTypeUtils, 
// Pipeline
ContentIngestionPipeline, createContentIngestionPipeline, PIPELINE_VERSION, 
// Store (for app-level usage)
PrismaContentSourceStore, createPrismaContentSourceStore, } from './ingestion';
// ============================================================================
// ALIGNMENT ENGINE EXPORTS (Enhanced Depth Analysis - January 2026)
// ============================================================================
export { 
// Engine
AlignmentEngine, createAlignmentEngine, 
// Store
PrismaAlignmentMatrixStore, createPrismaAlignmentMatrixStore, } from './alignment';
// ============================================================================
// EVIDENCE TRACKING EXPORTS (Enhanced Depth Analysis - January 2026)
// ============================================================================
export { 
// Service
EvidenceService, ConfidenceCalculator, KeywordAnalyzer, createEvidenceService, createConfidenceCalculator, createKeywordAnalyzer, EVIDENCE_SERVICE_VERSION, 
// Store
PrismaAnalysisEvidenceStore, createPrismaAnalysisEvidenceStore, } from './evidence';
// ============================================================================
// MULTI-FRAMEWORK EVALUATOR EXPORTS (Enhanced Depth Analysis - January 2026)
// ============================================================================
export { 
// Framework definitions
BLOOMS_FRAMEWORK, DOK_FRAMEWORK, SOLO_FRAMEWORK, FINK_FRAMEWORK, MARZANO_FRAMEWORK, FRAMEWORKS, COURSE_TYPE_FRAMEWORK_WEIGHTS, getFramework, getAllFrameworks, getFrameworkWeights, getIdealDistribution, getFrameworkLevel, getFrameworkMappings, 
// Multi-framework evaluator
MultiFrameworkEvaluator, createMultiFrameworkEvaluator, EVALUATOR_VERSION, } from './frameworks';
// ============================================================================
// PORTABLE LLM ADAPTER EXPORTS (Enhanced Depth Analysis - January 2026)
// ============================================================================
export { 
// Adapter
PortableDepthAnalysisLLMAdapter, createDepthAnalysisLLMAdapter, createQuickAdapter, ADAPTER_VERSION as LLM_ADAPTER_VERSION, 
// Prompts (for customization)
BLOOMS_CLASSIFICATION_PROMPT, DOK_CLASSIFICATION_PROMPT, MULTI_FRAMEWORK_PROMPT, KEYWORD_EXTRACTION_PROMPT, ALIGNMENT_ANALYSIS_PROMPT, RECOMMENDATION_PROMPT, 
// Parsers (for custom implementations)
parseBloomsResult, parseDOKResult, parseMultiFrameworkResult, parseKeywordResult, parseAlignmentResult, parseRecommendationResult, 
// Model tier mapping
MODEL_TIER_MAPPING, } from './llm-adapter';
// ============================================================================
// SEMANTIC BLOOM'S CLASSIFIER EXPORTS (Phase 2: Semantic Disambiguation)
// ============================================================================
export { 
// Classifier
SemanticBloomsClassifier, createSemanticBloomsClassifier, createSemanticBloomsClassifierWithProvider, 
// Reference Data
AMBIGUOUS_VERBS, REFERENCE_PHRASES, } from './semantic-blooms-classifier';
// ============================================================================
// BLOOM'S CALIBRATION EXPORTS (Phase 5: Confidence Calibration Learning Loop)
// ============================================================================
export { 
// Calibrator
BloomsCalibrator, createBloomsCalibrator, 
// Utility Functions
bloomsLevelToNumber, numberToBloomsLevel, hashContent, } from './calibration';
// ============================================================================
// MULTIMEDIA BLOOM'S ENGINE EXPORTS (Phase 4: Multimedia Content Analysis)
// ============================================================================
export { 
// Multimedia Bloom's Engine
MultimediaBloomsEngine, createMultimediaBloomsEngine, createContentAnalyzerFromEngine, } from './engines/multimedia-blooms-engine';
// ============================================================================
// VIDEO COGNITIVE ANALYZER EXPORTS (Phase 4: Multimedia Content Analysis)
// ============================================================================
export { 
// Video Analyzer
VideoCognitiveAnalyzer, createVideoCognitiveAnalyzer, } from './analyzers/video-cognitive-analyzer';
// ============================================================================
// IMAGE COGNITIVE ANALYZER EXPORTS (Phase 4: Multimedia Content Analysis)
// ============================================================================
export { 
// Image Analyzer
ImageCognitiveAnalyzer, createImageCognitiveAnalyzer, } from './analyzers/image-cognitive-analyzer';
