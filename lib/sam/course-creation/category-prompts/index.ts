/**
 * Category-Specific Prompt Enhancers
 *
 * Public API for the category prompt system.
 * Import from this file in orchestrator.ts and prompts.ts.
 */

export {
  getCategoryEnhancer,
  getCategoryEnhancers,
  getCategoryEnhancersWithAIFallback,
  blendEnhancers,
  composeCategoryPrompt,
  listCategoryEnhancers,
} from './registry';
export type { CategoryPromptEnhancer, ComposedCategoryPrompt } from './types';
