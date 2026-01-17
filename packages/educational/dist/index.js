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
