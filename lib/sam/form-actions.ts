/**
 * SAM Form Actions System
 * Intelligent form field detection and population
 */

// ============================================================================
// TYPES
// ============================================================================

export interface FormFieldInfo {
  name: string;
  type: string;
  value: unknown;
  label?: string;
  placeholder?: string;
  required?: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface FormAction {
  id: string;
  type: 'fill' | 'clear' | 'validate' | 'submit' | 'focus';
  field?: string;
  value?: unknown;
  label: string;
  description?: string;
}

export interface FormFillSuggestion {
  field: string;
  suggestedValue: unknown;
  confidence: number;
  reasoning: string;
}

export interface FormAnalysis {
  formId: string;
  formName: string;
  fields: FormFieldInfo[];
  completeness: number;
  suggestions: FormFillSuggestion[];
  actions: FormAction[];
}

// ============================================================================
// FORM FIELD DETECTION
// ============================================================================

/**
 * Detect and analyze form fields on the current page
 */
export function detectFormFields(): Record<string, FormFieldInfo> {
  if (typeof document === 'undefined') {
    return {};
  }

  const fields: Record<string, FormFieldInfo> = {};
  const forms = document.querySelectorAll<HTMLFormElement>('form');

  forms.forEach(form => {
    const elements = form.elements;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

      if (!element.name) continue;
      if (['submit', 'button', 'hidden', 'reset'].includes(element.type)) continue;

      fields[element.name] = {
        name: element.name,
        type: element.type || 'text',
        value: element.value,
        label: getFieldLabel(element),
        placeholder: (element as HTMLInputElement).placeholder,
        required: element.required,
        validation: getFieldValidation(element),
      };
    }
  });

  return fields;
}

/**
 * Get the label for a form field
 */
function getFieldLabel(element: HTMLElement): string | undefined {
  const name = (element as HTMLInputElement).name;

  // Try to find associated label
  if (name && typeof document !== 'undefined') {
    const label = document.querySelector(`label[for="${name}"]`);
    if (label) return label.textContent?.trim();
  }

  // Check for parent label
  const parentLabel = element.closest('label');
  if (parentLabel) {
    const clone = parentLabel.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('input, textarea, select').forEach(input => input.remove());
    return clone.textContent?.trim();
  }

  // Fallback: format field name
  return formatFieldName(name);
}

/**
 * Format a field name to a readable label
 */
function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, c => c.toUpperCase());
}

/**
 * Extract validation rules from a form field
 */
function getFieldValidation(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): FormFieldInfo['validation'] {
  const validation: FormFieldInfo['validation'] = {};

  if ('minLength' in element && element.minLength > 0) {
    validation.minLength = element.minLength;
  }

  if ('maxLength' in element && element.maxLength > 0 && element.maxLength < 524288) {
    validation.maxLength = element.maxLength;
  }

  if ('pattern' in element && element.pattern) {
    validation.pattern = element.pattern;
  }

  return Object.keys(validation).length > 0 ? validation : undefined;
}

// ============================================================================
// FORM ACTIONS GENERATION
// ============================================================================

/**
 * Generate intelligent form fill suggestions based on context
 */
export function generateFormSuggestions(
  fields: Record<string, FormFieldInfo>,
  context: {
    pageType: string;
    entityId?: string;
    userIntent?: string;
    existingContent?: Record<string, unknown>;
  }
): FormFillSuggestion[] {
  const suggestions: FormFillSuggestion[] = [];

  for (const [fieldName, fieldInfo] of Object.entries(fields)) {
    // Skip already filled fields
    if (fieldInfo.value && String(fieldInfo.value).trim()) continue;

    const suggestion = generateFieldSuggestion(fieldName, fieldInfo, context);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Generate a suggestion for a specific field
 */
function generateFieldSuggestion(
  fieldName: string,
  fieldInfo: FormFieldInfo,
  context: {
    pageType: string;
    entityId?: string;
    userIntent?: string;
    existingContent?: Record<string, unknown>;
  }
): FormFillSuggestion | null {
  const lowerName = fieldName.toLowerCase();
  const lowerLabel = (fieldInfo.label || '').toLowerCase();

  // Title fields
  if (lowerName.includes('title') || lowerLabel.includes('title')) {
    return {
      field: fieldName,
      suggestedValue: null, // Will be filled by AI
      confidence: 0.8,
      reasoning: 'Title field detected - AI can generate an engaging title',
    };
  }

  // Description fields
  if (lowerName.includes('description') || lowerLabel.includes('description')) {
    return {
      field: fieldName,
      suggestedValue: null,
      confidence: 0.85,
      reasoning: 'Description field detected - AI can generate comprehensive content',
    };
  }

  // Learning outcomes/objectives
  if (lowerName.includes('outcome') || lowerName.includes('objective') ||
      lowerLabel.includes('outcome') || lowerLabel.includes('objective')) {
    return {
      field: fieldName,
      suggestedValue: null,
      confidence: 0.9,
      reasoning: 'Learning objectives field - AI can generate Bloom\'s-aligned outcomes',
    };
  }

  // Content fields
  if (lowerName.includes('content') || lowerName.includes('body') ||
      lowerLabel.includes('content') || lowerLabel.includes('body')) {
    return {
      field: fieldName,
      suggestedValue: null,
      confidence: 0.75,
      reasoning: 'Content field detected - AI can generate educational content',
    };
  }

  return null;
}

/**
 * Generate form actions based on current state
 */
export function generateFormActions(
  fields: Record<string, FormFieldInfo>,
  suggestions: FormFillSuggestion[]
): FormAction[] {
  const actions: FormAction[] = [];
  const fieldCount = Object.keys(fields).length;
  const filledCount = Object.values(fields).filter(f => f.value && String(f.value).trim()).length;

  // Add fill actions for empty required fields
  for (const [fieldName, fieldInfo] of Object.entries(fields)) {
    if (fieldInfo.required && (!fieldInfo.value || !String(fieldInfo.value).trim())) {
      actions.push({
        id: `fill-${fieldName}`,
        type: 'fill',
        field: fieldName,
        label: `Fill ${fieldInfo.label || formatFieldName(fieldName)}`,
        description: 'Generate content for this required field',
      });
    }
  }

  // Add suggestion-based actions
  for (const suggestion of suggestions.slice(0, 3)) {
    const fieldInfo = fields[suggestion.field];
    if (!actions.find(a => a.field === suggestion.field)) {
      actions.push({
        id: `suggest-${suggestion.field}`,
        type: 'fill',
        field: suggestion.field,
        label: `Generate ${fieldInfo?.label || formatFieldName(suggestion.field)}`,
        description: suggestion.reasoning,
      });
    }
  }

  // Add clear action if form has content
  if (filledCount > 0) {
    actions.push({
      id: 'clear-all',
      type: 'clear',
      label: 'Clear All Fields',
      description: `Clear all ${filledCount} filled fields`,
    });
  }

  // Add validate action
  if (filledCount > 0) {
    actions.push({
      id: 'validate-form',
      type: 'validate',
      label: 'Validate Form',
      description: 'Check all fields for completeness and quality',
    });
  }

  // Add submit action if form is complete enough
  const completeness = fieldCount > 0 ? (filledCount / fieldCount) * 100 : 0;
  if (completeness >= 80) {
    actions.push({
      id: 'submit-form',
      type: 'submit',
      label: 'Submit Form',
      description: `Form is ${Math.round(completeness)}% complete`,
    });
  }

  return actions;
}

// ============================================================================
// FORM ANALYSIS
// ============================================================================

/**
 * Analyze a form and generate a complete analysis
 */
export function analyzeForm(
  formId: string,
  formName: string,
  context: {
    pageType: string;
    entityId?: string;
    userIntent?: string;
    existingContent?: Record<string, unknown>;
  }
): FormAnalysis {
  const fields = detectFormFields();
  const fieldArray = Object.values(fields);
  const filledCount = fieldArray.filter(f => f.value && String(f.value).trim()).length;
  const completeness = fieldArray.length > 0 ? (filledCount / fieldArray.length) * 100 : 0;

  const suggestions = generateFormSuggestions(fields, context);
  const actions = generateFormActions(fields, suggestions);

  return {
    formId,
    formName,
    fields: fieldArray,
    completeness: Math.round(completeness),
    suggestions,
    actions,
  };
}

// ============================================================================
// FORM FILL EXECUTION
// ============================================================================

/**
 * Execute a form fill action
 */
export function executeFormFill(fieldName: string, value: unknown): boolean {
  if (typeof document === 'undefined') return false;

  const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    `[name="${fieldName}"]`
  );

  if (!element) return false;

  // Set value
  element.value = String(value);

  // Dispatch events to trigger React state updates
  const inputEvent = new Event('input', { bubbles: true });
  const changeEvent = new Event('change', { bubbles: true });

  element.dispatchEvent(inputEvent);
  element.dispatchEvent(changeEvent);

  // Focus the element
  element.focus();

  return true;
}

/**
 * Execute multiple form fills
 */
export function executeMultipleFormFills(fills: Record<string, unknown>): {
  success: string[];
  failed: string[];
} {
  const success: string[] = [];
  const failed: string[] = [];

  for (const [fieldName, value] of Object.entries(fills)) {
    if (executeFormFill(fieldName, value)) {
      success.push(fieldName);
    } else {
      failed.push(fieldName);
    }
  }

  return { success, failed };
}

/**
 * Clear all form fields
 */
export function clearFormFields(): number {
  if (typeof document === 'undefined') return 0;

  let clearedCount = 0;
  const forms = document.querySelectorAll<HTMLFormElement>('form');

  forms.forEach(form => {
    const elements = form.elements;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

      if (!element.name) continue;
      if (['submit', 'button', 'hidden', 'reset'].includes(element.type)) continue;

      if (element.value) {
        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        clearedCount++;
      }
    }
  });

  return clearedCount;
}

// ============================================================================
// WINDOW INTEGRATION
// ============================================================================

/**
 * Register form interactions on window for SAM access
 */
export function registerFormInteractions(interactions: Record<string, (value: unknown) => void>): void {
  if (typeof window === 'undefined') return;

  (window as unknown as { samFormInteractions?: Record<string, (value: unknown) => void> }).samFormInteractions = interactions;
}

/**
 * Get registered form interactions
 */
export function getFormInteractions(): Record<string, (value: unknown) => void> | undefined {
  if (typeof window === 'undefined') return undefined;

  return (window as unknown as { samFormInteractions?: Record<string, (value: unknown) => void> }).samFormInteractions;
}
