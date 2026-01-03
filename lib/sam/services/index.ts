/**
 * SAM Services
 *
 * Core services for the SAM AI Mentor system.
 */

export {
  PgVectorSearchService,
  getPgVectorSearchService,
  type VectorSearchOptions,
  type VectorSearchResult,
  type LongTermMemorySearchResult,
  type ConversationMemorySearchResult,
  type EmbeddingInput,
  type LongTermMemoryInput,
  type ConversationMemoryInput,
  VectorSearchOptionsSchema,
} from './pgvector-search';

export {
  getMemoryContext,
  formatMemoryForPrompt,
  processChatWithMemory,
  storeConversationTurn,
  analyzeForMemoryExtraction,
  storeExtractedMemory,
  type MemoryContext,
  type ChatMemoryInput,
  type MemoryExtractionResult,
} from './chat-memory-integration';

export {
  buildCourseGraph,
  getUserSkillProfile,
  updateUserSkill,
  generateLearningPath,
  getRelatedConcepts,
  findConceptPath,
  type CourseGraphData,
  type ConceptNode,
  type PrerequisiteRelation,
  type UserSkillProfile,
  type UserSkill,
  type LearningPathRecommendation,
  type PathStep,
  type ConceptConnection,
} from './knowledge-graph-service';
