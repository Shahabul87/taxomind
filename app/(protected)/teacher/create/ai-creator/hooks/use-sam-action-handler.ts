/**
 * SAM Action Handler Hook
 *
 * Processes actions returned by SAM API and applies them to the form/UI.
 * Supports form auto-fill, navigation, and course creation actions.
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { CourseCreationRequest } from '../types/sam-creator.types';

/**
 * Action types that SAM can return
 */
export interface SamAction {
  type:
    | 'form_populate'
    | 'course_creation_action'
    | 'navigation'
    | 'gamification_action'
    | 'form_update';
  details: {
    // form_populate
    formId?: string;
    data?: Record<string, unknown>;
    field?: string;
    value?: unknown;

    // course_creation_action
    action?: string;
    topic?: string;
    audience?: string;
    difficulty?: string;
    chapters?: number;
    level?: string;
    courseData?: string;
    bloomLevels?: string[];
    category?: string;
    apiEndpoint?: string;

    // navigation
    url?: string;
    description?: string;

    // gamification_action
    points?: number;
    reason?: string;
  };
}

/**
 * Result of processing an action
 */
export interface ActionResult {
  success: boolean;
  message: string;
  fieldsUpdated?: string[];
  actionType: string;
}

/**
 * Field mapping from SAM action fields to form fields
 */
const FIELD_MAPPING: Record<string, keyof CourseCreationRequest> = {
  // Direct mappings
  courseTitle: 'courseTitle',
  title: 'courseTitle',
  course_title: 'courseTitle',

  courseShortOverview: 'courseShortOverview',
  overview: 'courseShortOverview',
  description: 'courseShortOverview',
  course_description: 'courseShortOverview',

  courseCategory: 'courseCategory',
  category: 'courseCategory',

  courseSubcategory: 'courseSubcategory',
  subcategory: 'courseSubcategory',

  targetAudience: 'targetAudience',
  audience: 'targetAudience',
  target_audience: 'targetAudience',

  difficulty: 'difficulty',
  level: 'difficulty',
  difficulty_level: 'difficulty',

  courseGoals: 'courseGoals',
  goals: 'courseGoals',
  learning_objectives: 'courseGoals',
  objectives: 'courseGoals',

  bloomsFocus: 'bloomsFocus',
  blooms: 'bloomsFocus',
  blooms_focus: 'bloomsFocus',
  taxonomy: 'bloomsFocus',

  chapterCount: 'chapterCount',
  chapters: 'chapterCount',
  chapter_count: 'chapterCount',

  sectionsPerChapter: 'sectionsPerChapter',
  sections: 'sectionsPerChapter',
  sections_per_chapter: 'sectionsPerChapter',

  preferredContentTypes: 'preferredContentTypes',
  content_types: 'preferredContentTypes',
  contentTypes: 'preferredContentTypes',

  includeAssessments: 'includeAssessments',
  assessments: 'includeAssessments',
  include_assessments: 'includeAssessments',

  duration: 'duration',
  course_duration: 'duration',

  courseIntent: 'courseIntent',
  intent: 'courseIntent',
};

/**
 * Hook for handling SAM actions
 */
export function useSamActionHandler(
  setFormData: React.Dispatch<React.SetStateAction<CourseCreationRequest>>,
  options?: {
    onActionProcessed?: (result: ActionResult) => void;
    onNavigate?: (url: string) => void;
    onCourseCreationAction?: (action: string, details: Record<string, unknown>) => void;
  }
) {
  /**
   * Process a single field update
   */
  const processFieldUpdate = useCallback((
    field: string,
    value: unknown
  ): { fieldName: keyof CourseCreationRequest; value: unknown } | null => {
    // Normalize field name
    const normalizedField = field.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const mappedField = FIELD_MAPPING[field] || FIELD_MAPPING[normalizedField];

    if (!mappedField) {
      logger.warn(`[ActionHandler] Unknown field: ${field}`);
      return null;
    }

    // Type coercion based on field type
    let processedValue = value;

    switch (mappedField) {
      case 'chapterCount':
      case 'sectionsPerChapter':
        processedValue = typeof value === 'number' ? value : parseInt(String(value), 10) || 5;
        break;

      case 'includeAssessments':
        processedValue = value === true || value === 'true' || value === 'yes';
        break;

      case 'courseGoals':
      case 'bloomsFocus':
      case 'preferredContentTypes':
        if (typeof value === 'string') {
          processedValue = value.split(',').map(s => s.trim()).filter(Boolean);
        } else if (!Array.isArray(value)) {
          processedValue = [String(value)];
        }
        break;

      case 'difficulty':
        // Normalize difficulty levels
        const difficultyMap: Record<string, string> = {
          'easy': 'BEGINNER',
          'beginner': 'BEGINNER',
          'medium': 'INTERMEDIATE',
          'intermediate': 'INTERMEDIATE',
          'hard': 'ADVANCED',
          'advanced': 'ADVANCED',
          'expert': 'EXPERT',
        };
        processedValue = difficultyMap[String(value).toLowerCase()] || String(value).toUpperCase();
        break;
    }

    return { fieldName: mappedField, value: processedValue };
  }, []);

  /**
   * Handle form populate action
   */
  const handleFormPopulate = useCallback((details: SamAction['details']): ActionResult => {
    const fieldsUpdated: string[] = [];

    try {
      // Handle single field update
      if (details.field && details.value !== undefined) {
        const processed = processFieldUpdate(details.field, details.value);
        if (processed) {
          setFormData(prev => ({
            ...prev,
            [processed.fieldName]: processed.value,
          }));
          fieldsUpdated.push(processed.fieldName);
        }
      }

      // Handle multiple field updates from data object
      if (details.data && typeof details.data === 'object') {
        const updates: Partial<CourseCreationRequest> = {};

        for (const [field, value] of Object.entries(details.data)) {
          const processed = processFieldUpdate(field, value);
          if (processed) {
            (updates as Record<string, unknown>)[processed.fieldName] = processed.value;
            fieldsUpdated.push(processed.fieldName);
          }
        }

        if (Object.keys(updates).length > 0) {
          setFormData(prev => ({ ...prev, ...updates }));
        }
      }

      if (fieldsUpdated.length > 0) {
        const message = fieldsUpdated.length === 1
          ? `Updated ${fieldsUpdated[0]}`
          : `Updated ${fieldsUpdated.length} fields: ${fieldsUpdated.join(', ')}`;

        toast.success(`SAM auto-filled: ${message}`, {
          description: 'Review the changes and adjust if needed.',
          duration: 4000,
        });

        return {
          success: true,
          message,
          fieldsUpdated,
          actionType: 'form_populate',
        };
      }

      return {
        success: false,
        message: 'No fields were updated',
        actionType: 'form_populate',
      };
    } catch (error) {
      logger.error('[ActionHandler] Error in form populate:', error);
      return {
        success: false,
        message: 'Failed to update form fields',
        actionType: 'form_populate',
      };
    }
  }, [processFieldUpdate, setFormData]);

  /**
   * Handle course creation action
   */
  const handleCourseCreationAction = useCallback((details: SamAction['details']): ActionResult => {
    const { action, apiEndpoint, ...params } = details;

    if (!action) {
      return {
        success: false,
        message: 'No action specified',
        actionType: 'course_creation_action',
      };
    }

    // Notify parent component about the action
    if (options?.onCourseCreationAction) {
      options.onCourseCreationAction(action, { ...params, apiEndpoint });
    }

    // Show appropriate toast based on action type
    switch (action) {
      case 'generate_titles':
        toast.info('SAM suggests generating title ideas', {
          description: 'Click "Generate Titles" to get AI-powered suggestions.',
          action: {
            label: 'Generate',
            onClick: () => options?.onCourseCreationAction?.('generate_titles', params),
          },
        });
        break;

      case 'create_structure':
        toast.info('SAM suggests creating course structure', {
          description: `Ready to generate ${params.chapters || 5} chapters.`,
          action: {
            label: 'Create Structure',
            onClick: () => options?.onCourseCreationAction?.('create_structure', params),
          },
        });
        break;

      case 'learning_objectives':
        toast.info('SAM suggests generating learning objectives', {
          description: 'Create Bloom\'s-aligned objectives for your course.',
        });
        break;

      case 'quality_score':
        toast.info('SAM suggests running quality analysis', {
          description: 'Check your course for completeness and quality.',
        });
        break;

      case 'market_analysis':
        toast.info('SAM suggests market analysis', {
          description: 'Analyze the market potential for your course.',
        });
        break;

      default:
        toast.info(`SAM action: ${action}`, {
          description: 'A course creation action was suggested.',
        });
    }

    return {
      success: true,
      message: `Course creation action: ${action}`,
      actionType: 'course_creation_action',
    };
  }, [options]);

  /**
   * Handle navigation action
   */
  const handleNavigationAction = useCallback((details: SamAction['details']): ActionResult => {
    const { url, description } = details;

    if (!url) {
      return {
        success: false,
        message: 'No URL specified',
        actionType: 'navigation',
      };
    }

    if (options?.onNavigate) {
      toast.info(`SAM suggests navigating to: ${description || url}`, {
        action: {
          label: 'Go',
          onClick: () => options.onNavigate?.(url),
        },
      });

      return {
        success: true,
        message: `Navigation suggested: ${url}`,
        actionType: 'navigation',
      };
    }

    return {
      success: false,
      message: 'Navigation handler not available',
      actionType: 'navigation',
    };
  }, [options]);

  /**
   * Main action processor
   */
  const processAction = useCallback((action: SamAction | null | undefined): ActionResult | null => {
    if (!action || !action.type) {
      return null;
    }

    logger.info('[ActionHandler] Processing action:', { type: action.type, details: action.details });

    let result: ActionResult;

    switch (action.type) {
      case 'form_populate':
      case 'form_update':
        result = handleFormPopulate(action.details);
        break;

      case 'course_creation_action':
        result = handleCourseCreationAction(action.details);
        break;

      case 'navigation':
        result = handleNavigationAction(action.details);
        break;

      case 'gamification_action':
        // Log gamification but don't process (could be wired to a points system)
        result = {
          success: true,
          message: `Gamification: +${action.details.points || 10} points - ${action.details.reason || 'Good interaction'}`,
          actionType: 'gamification_action',
        };
        break;

      default:
        logger.warn('[ActionHandler] Unknown action type:', action.type);
        result = {
          success: false,
          message: `Unknown action type: ${action.type}`,
          actionType: String(action.type),
        };
    }

    // Notify parent of processed action
    if (options?.onActionProcessed) {
      options.onActionProcessed(result);
    }

    return result;
  }, [handleFormPopulate, handleCourseCreationAction, handleNavigationAction, options]);

  /**
   * Process multiple actions from API response
   */
  const processApiResponse = useCallback((response: {
    action?: SamAction | null;
    actions?: SamAction[];
  }): ActionResult[] => {
    const results: ActionResult[] = [];

    // Process single action
    if (response.action) {
      const result = processAction(response.action);
      if (result) results.push(result);
    }

    // Process array of actions
    if (response.actions && Array.isArray(response.actions)) {
      for (const action of response.actions) {
        const result = processAction(action);
        if (result) results.push(result);
      }
    }

    return results;
  }, [processAction]);

  return {
    processAction,
    processApiResponse,
    processFieldUpdate,
  };
}
