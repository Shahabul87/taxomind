/**
 * Content & Adaptive Learning Hub Components
 *
 * Phase 4 of the engine merge plan - integrating ContentGenerationEngine,
 * AdaptiveContentEngine, SocraticTeachingEngine, and MicrolearningEngine
 * into a cohesive personalized learning hub.
 *
 * @module components/sam/content-adaptive-hub
 */

export { ContentAdaptiveHub } from "./ContentAdaptiveHub";
export type { ContentAdaptiveHubProps } from "./ContentAdaptiveHub";

// Re-export related components for convenience
export { ContentGenerationStudio } from "../creator-studio/ContentGenerationStudio";
export { AdaptiveContentWidget } from "../AdaptiveContentWidget";
export { SocraticDialogueWidget } from "../SocraticDialogueWidget";
export { MicrolearningWidget } from "../MicrolearningWidget";
