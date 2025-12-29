/**
 * SAM Form Context Utility
 *
 * Converts form data objects to SAM-expected form context format.
 * This enables SAM to have full awareness of form state during API calls.
 */

import type { FormField } from '@/lib/stores/form-registry-store';

/**
 * Form field configuration for type inference
 */
export interface FieldConfig {
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'checkbox' | 'multiselect';
  required?: boolean;
}

export type SamFieldMeta = Record<
  string,
  {
    label?: string;
    placeholder?: string;
    type?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
  }
>;

/**
 * Default field configurations for course creation wizard
 */
export const COURSE_WIZARD_FIELD_CONFIG: Record<string, FieldConfig> = {
  courseTitle: { label: 'Course Title', type: 'text', required: true },
  courseShortOverview: { label: 'Course Overview', type: 'textarea', required: true },
  courseCategory: { label: 'Category', type: 'select', required: true },
  courseSubcategory: { label: 'Subcategory', type: 'select' },
  courseIntent: { label: 'Course Intent', type: 'select' },
  targetAudience: { label: 'Target Audience', type: 'text', required: true },
  difficulty: { label: 'Difficulty Level', type: 'select', required: true },
  duration: { label: 'Course Duration', type: 'select' },
  chapterCount: { label: 'Number of Chapters', type: 'number' },
  sectionsPerChapter: { label: 'Sections per Chapter', type: 'number' },
  courseGoals: { label: 'Learning Objectives', type: 'multiselect', required: true },
  bloomsFocus: { label: 'Bloom\'s Focus Areas', type: 'multiselect', required: true },
  preferredContentTypes: { label: 'Content Types', type: 'multiselect' },
  includeAssessments: { label: 'Include Assessments', type: 'checkbox' },
};

export function getCourseWizardFieldMeta(): SamFieldMeta {
  return Object.fromEntries(
    Object.entries(COURSE_WIZARD_FIELD_CONFIG).map(([name, config]) => [
      name,
      {
        label: config.label,
        type: config.type,
        required: config.required,
      },
    ])
  );
}

/**
 * Converts a plain form data object to an array of SAM FormField objects
 *
 * @param formData - The form data object (e.g., from React Hook Form or useState)
 * @param fieldConfig - Optional field configurations for labels and types
 * @returns Array of FormField objects for SAM context
 *
 * @example
 * ```typescript
 * const formData = { courseTitle: 'My Course', difficulty: 'BEGINNER' };
 * const forms = formDataToSamContext(formData);
 * // Result: [
 * //   { name: 'courseTitle', value: 'My Course', type: 'text', label: 'Course Title', ... },
 * //   { name: 'difficulty', value: 'BEGINNER', type: 'select', label: 'Difficulty Level', ... }
 * // ]
 * ```
 */
export function formDataToSamContext(
  formData: Record<string, unknown>,
  fieldConfig: Record<string, FieldConfig> = COURSE_WIZARD_FIELD_CONFIG
): FormField[] {
  const fields: FormField[] = [];

  for (const [name, value] of Object.entries(formData)) {
    // Skip undefined or null values
    if (value === undefined || value === null) continue;

    // Get field config or use defaults
    const config = fieldConfig[name] || {
      label: formatFieldLabel(name),
      type: inferFieldType(value),
    };

    // Determine if field has meaningful content
    const hasValue = Array.isArray(value)
      ? value.length > 0
      : typeof value === 'string'
        ? value.trim().length > 0
        : value !== undefined && value !== null;

    fields.push({
      name,
      value,
      type: config.type,
      label: config.label,
      required: config.required ?? false,
      touched: hasValue,
      dirty: hasValue,
    });
  }

  return fields;
}

/**
 * Format a camelCase field name to a human-readable label
 */
function formatFieldLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Infer field type from value
 */
function inferFieldType(value: unknown): string {
  if (Array.isArray(value)) return 'multiselect';
  if (typeof value === 'boolean') return 'checkbox';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string' && value.length > 100) return 'textarea';
  return 'text';
}

/**
 * Creates a complete SAM context object with form data
 *
 * @param options - Configuration options
 * @returns Complete SAM context object ready for API calls
 */
export function createSamContext(options: {
  formData: Record<string, unknown>;
  pageType?: string;
  pageTitle?: string;
  userRole?: 'teacher' | 'student' | 'admin';
  currentStep?: number;
  totalSteps?: number;
  additionalContext?: Record<string, unknown>;
}) {
  const {
    formData,
    pageType = 'course_creation',
    pageTitle = 'AI Course Creator',
    userRole = 'teacher',
    currentStep,
    totalSteps,
    additionalContext = {},
  } = options;

  return {
    pageData: {
      pageType,
      title: pageTitle,
      forms: formDataToSamContext(formData),
    },
    learningContext: {
      userRole,
      courseCreationMode: pageType === 'course_creation',
      currentStep,
      totalSteps,
      ...additionalContext,
    },
    gamificationState: {},
    tutorPersonality: { tone: 'encouraging', teachingMethod: 'direct' },
    emotion: 'engaged',
  };
}

/**
 * Quick helper to get form summary for SAM messages
 */
export function getFormSummary(formData: Record<string, unknown>): string {
  const entries = Object.entries(formData)
    .filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      return true;
    })
    .map(([key, value]) => {
      const label = formatFieldLabel(key);
      const displayValue = Array.isArray(value)
        ? value.join(', ')
        : String(value);
      return `${label}: ${displayValue}`;
    });

  return entries.join('\n');
}
