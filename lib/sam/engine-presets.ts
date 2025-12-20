/**
 * SAM Engine Presets
 * Different engine combinations for different use cases
 */

export type EnginePresetName =
  | 'quick'
  | 'standard'
  | 'full'
  | 'content'
  | 'learning'
  | 'assessment';

export const ENGINE_PRESETS: Record<EnginePresetName, string[]> = {
  // Quick chat - minimal engines for fast response
  // Use for: general questions, navigation, quick help
  quick: ['context', 'response'],

  // Standard chat - with Bloom's analysis
  // Use for: course/chapter pages, content discussions
  standard: ['context', 'blooms', 'response'],

  // Full analysis - all engines
  // Use for: detailed editing, comprehensive analysis
  full: ['context', 'blooms', 'content', 'personalization', 'response'],

  // Content focused - for content generation/analysis
  // Use for: generating chapters, sections, descriptions
  content: ['context', 'blooms', 'content', 'response'],

  // Learning focused - for student learning paths
  // Use for: learning pages, study assistance
  learning: ['context', 'blooms', 'personalization', 'response'],

  // Assessment focused - for quiz/exam generation
  // Use for: creating assessments, evaluating answers
  assessment: ['context', 'blooms', 'personalization', 'response'],
};

/**
 * Get the appropriate engine preset based on page type and context
 */
export function getEnginePreset(
  pageType: string,
  options?: {
    hasForm?: boolean;
    isGenerating?: boolean;
    isAnalyzing?: boolean;
  }
): string[] {
  const { hasForm, isGenerating, isAnalyzing } = options || {};

  // Full engines for pages with forms that need comprehensive analysis
  if (hasForm && ['section-detail', 'chapter-detail', 'course-detail'].includes(pageType)) {
    return ENGINE_PRESETS.full;
  }

  // Content generation needs content engine
  if (isGenerating) {
    return ENGINE_PRESETS.content;
  }

  // Deep analysis needs full engines
  if (isAnalyzing) {
    return ENGINE_PRESETS.full;
  }

  // Page-specific defaults
  switch (pageType) {
    case 'section-detail':
      return ENGINE_PRESETS.content;
    case 'chapter-detail':
      return ENGINE_PRESETS.standard;
    case 'course-detail':
    case 'course-create':
      return ENGINE_PRESETS.content;
    case 'learning':
      return ENGINE_PRESETS.learning;
    case 'exam':
    case 'assessment':
      return ENGINE_PRESETS.assessment;
    case 'dashboard':
    case 'courses-list':
      return ENGINE_PRESETS.quick;
    default:
      return ENGINE_PRESETS.quick;
  }
}

/**
 * Detect if the query suggests generation intent
 */
export function detectGenerationIntent(query: string): boolean {
  const generationKeywords = [
    'generate', 'create', 'write', 'draft', 'compose',
    'make', 'build', 'produce', 'develop', 'design'
  ];
  const lowerQuery = query.toLowerCase();
  return generationKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Detect if the query suggests analysis intent
 */
export function detectAnalysisIntent(query: string): boolean {
  const analysisKeywords = [
    'analyze', 'analysis', 'review', 'check', 'evaluate',
    'assess', 'examine', 'inspect', 'audit', 'blooms', 'bloom'
  ];
  const lowerQuery = query.toLowerCase();
  return analysisKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Smart engine selection based on query and page context
 */
export function selectEngines(
  pageType: string,
  query: string,
  hasForm: boolean
): string[] {
  const isGenerating = detectGenerationIntent(query);
  const isAnalyzing = detectAnalysisIntent(query);

  return getEnginePreset(pageType, {
    hasForm,
    isGenerating,
    isAnalyzing,
  });
}
