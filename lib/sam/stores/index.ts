/**
 * SAM AI Store Adapters
 * Provides database persistence for @sam-ai/agentic package
 */

// Goal Store
export { PrismaGoalStore, createPrismaGoalStore } from './prisma-goal-store';

// SubGoal Store
export {
  PrismaSubGoalStore,
  createPrismaSubGoalStore,
} from './prisma-subgoal-store';

// Plan Store
export { PrismaPlanStore, createPrismaPlanStore } from './prisma-plan-store';

// Proactive Intervention Stores
export {
  PrismaBehaviorEventStore,
  createPrismaBehaviorEventStore,
} from './prisma-behavior-store';

export {
  PrismaPatternStore,
  createPrismaPatternStore,
} from './prisma-pattern-store';

export {
  PrismaInterventionStore,
  createPrismaInterventionStore,
} from './prisma-intervention-store';

export {
  PrismaCheckInStore,
  createPrismaCheckInStore,
} from './prisma-checkin-store';

// Tool Registry Store
export { PrismaToolStore, createPrismaToolStore } from './prisma-tool-store';

// Analytics Stores
export {
  PrismaLearningSessionStore,
  PrismaTopicProgressStore,
  PrismaLearningGapStore,
  PrismaSkillAssessmentStore,
  PrismaRecommendationStore,
  PrismaContentStore,
  createPrismaLearningSessionStore,
  createPrismaTopicProgressStore,
  createPrismaLearningGapStore,
  createPrismaSkillAssessmentStore,
  createPrismaRecommendationStore,
  createPrismaContentStore,
} from './prisma-analytics-stores';

// Memory Stores
export {
  PrismaVectorAdapter,
  PrismaKnowledgeGraphStore,
  PrismaSessionContextStore,
  createPrismaVectorAdapter,
  createPrismaKnowledgeGraphStore,
  createPrismaSessionContextStore,
} from './prisma-memory-stores';

// Learning Path Stores
export {
  PrismaSkillStore,
  createPrismaSkillStore,
} from './prisma-skill-store';

export {
  PrismaLearningPathStore,
  createPrismaLearningPathStore,
} from './prisma-learning-path-store';

export {
  PrismaCourseGraphStore,
  createPrismaCourseGraphStore,
} from './prisma-course-graph-store';

// Multi-Session Learning Plan Store
export {
  PrismaLearningPlanStore,
  createPrismaLearningPlanStore,
} from './prisma-learning-plan-store';

// Tutoring Session Store (Cross-Session Continuity)
export {
  PrismaTutoringSessionStore,
  createPrismaTutoringSessionStore,
} from './prisma-tutoring-session-store';

// SkillBuildTrack Store (Skill Development & Tracking)
export {
  PrismaSkillBuildTrackStore,
  createPrismaSkillBuildTrackStore,
} from './prisma-skill-build-track-store';

// =============================================================================
// PHASE 6: EDUCATIONAL ENGINE STORES
// =============================================================================

// Microlearning Store
export {
  PrismaMicrolearningStore,
  createPrismaMicrolearningStore,
  type Microlesson,
  type MicrolessonContent,
  type CreateMicrolessonInput,
  type MicrolearningStore,
} from './prisma-microlearning-store';

// Metacognition Store
export {
  PrismaMetacognitionStore,
  createPrismaMetacognitionStore,
  type MetacognitionSession,
  type MetacognitionResponse,
  type MetacognitionAnalysis,
  type CreateMetacognitionInput,
  type MetacognitionStore,
} from './prisma-metacognition-store';

// Competency Store
export {
  PrismaCompetencyStore,
  createPrismaCompetencyStore,
  type CompetencyAssessment,
  type CompetencyData,
  type CareerPath,
  type CreateCompetencyInput,
  type CompetencyStore,
} from './prisma-competency-store';

// Peer Learning Store
export {
  PrismaPeerLearningStore,
  createPrismaPeerLearningStore,
  type PeerLearningActivity,
  type ActivityOutcomes,
  type CreatePeerActivityInput,
  type PeerLearningStore,
} from './prisma-peer-learning-store';

// Integrity Store
export {
  PrismaIntegrityStore,
  createPrismaIntegrityStore,
  type IntegrityCheck,
  type PlagiarismMatch,
  type AIIndicator,
  type ConsistencyAnalysis,
  type CreateIntegrityCheckInput,
  type IntegrityStore,
} from './prisma-integrity-store';

// Multimodal Store
export {
  PrismaMultimodalStore,
  createPrismaMultimodalStore,
  type MultimodalInput,
  type InputAnalysis,
  type CreateMultimodalInput as CreateMultimodalInputType,
  type MultimodalStore,
} from './prisma-multimodal-store';
