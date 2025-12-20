/**
 * SAM AI Assistant Library
 * Central export for all SAM utilities
 */

// Engine Presets
export {
  ENGINE_PRESETS,
  getEnginePreset,
  detectGenerationIntent,
  detectAnalysisIntent,
  selectEngines,
  type EnginePresetName,
} from './engine-presets';

// Form Actions
export {
  detectFormFields,
  generateFormSuggestions,
  generateFormActions,
  analyzeForm,
  executeFormFill,
  executeMultipleFormFills,
  clearFormFields,
  registerFormInteractions,
  getFormInteractions,
  type FormFieldInfo,
  type FormAction,
  type FormFillSuggestion,
  type FormAnalysis,
} from './form-actions';

// Gamification
export {
  GamificationEngine,
  createGamificationEngine,
  createGamificationHooks,
  XP_VALUES,
  LEVELS,
  ACHIEVEMENTS_CONFIG,
  type UserProgress,
  type Achievement,
  type Badge,
  type UserStats,
  type XPEvent,
  type XPEventType,
  type LevelInfo,
  type GamificationEvent,
} from './gamification';

// Entity Context - For context awareness
export {
  buildEntityContext,
  buildFormSummary,
  fetchCourseContext,
  fetchChapterContext,
  fetchSectionContext,
  type CourseContext,
  type ChapterContext,
  type SectionContext,
  type EntityContext,
  type PageFormData,
} from './entity-context';
