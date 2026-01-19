/**
 * Cognitive Analysis Hub Components
 *
 * Phase 2 of the engine merge plan - integrating CognitiveLoadEngine,
 * KnowledgeGraphEngine, and MetacognitionEngine into a cohesive hub.
 *
 * @module components/sam/cognitive-analysis-hub
 */

export { CognitiveAnalysisHub } from "./CognitiveAnalysisHub";
export type { CognitiveAnalysisHubProps } from "./CognitiveAnalysisHub";

// Re-export related components for convenience
export { CognitiveLoadMonitor } from "../CognitiveLoadMonitor";
export { MetacognitionPanel } from "../MetacognitionPanel";
export {
  EnhancedKnowledgeGraphExplorer,
  LearningPathBuilder,
  PrerequisiteAnalyzer,
} from "../knowledge-graph";
