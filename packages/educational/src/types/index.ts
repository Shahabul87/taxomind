/**
 * SAM AI Educational Package - Type Definitions
 * 
 * This barrel file re-exports all types from individual engine type files.
 * Import types from this file for a unified import experience.
 */

// Common types shared across engines
export * from './common';

// Engine interfaces
export * from './interfaces';

// Engine-specific types
export * from './exam.types';
export * from './evaluation.types';
export * from './blooms.types';
export * from './personalization.types';
export * from './content.types';
export * from './resource.types';
export * from './multimedia.types';
export * from './financial.types';
export * from './predictive.types';
export * from './analytics.types';
export * from './memory.types';
export * from './research.types';
export * from './trends.types';
export * from './achievement.types';
export * from './integrity.types';
export * from './course-guide.types';
export * from './collaboration.types';
export * from './social.types';
export * from './innovation.types';
export * from './market.types';
export * from './unified-blooms.types';

// Phase 2 Engines
export * from './practice-problems.types';
export * from './adaptive-content.types';
export * from './socratic-teaching.types';

// Knowledge Graph Engine (New)
export * from './knowledge-graph.types';

// Microlearning Engine (New)
export * from './microlearning.types';

// Metacognition Engine (New)
export * from './metacognition.types';

// Competency Engine (New)
export * from './competency.types';

// Peer Learning Engine (New)
export * from './peer-learning.types';

// Multimodal Input Engine (New)
export * from './multimodal-input.types';

// Note: depth-analysis.types are exported directly from the enhanced-depth-engine
// to avoid naming conflicts with blooms.types and other type files.
