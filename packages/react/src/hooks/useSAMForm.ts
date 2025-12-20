/**
 * @sam-ai/react - useSAMForm Hook
 * Hook for form synchronization with SAM
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSAMContext } from '../context/SAMContext';
import type { SAMFormField } from '@sam-ai/core';
import type { UseSAMFormReturn, FormSyncOptions } from '../types';

/**
 * Hook for SAM form synchronization
 *
 * @example
 * ```tsx
 * function FormComponent() {
 *   const formRef = useRef<HTMLFormElement>(null);
 *   const { fields, syncFormToSAM, getFieldSuggestions } = useSAMForm();
 *
 *   useEffect(() => {
 *     if (formRef.current) {
 *       syncFormToSAM(formRef.current);
 *     }
 *   }, []);
 *
 *   return (
 *     <form ref={formRef}>
 *       <input name="title" placeholder="Course Title" />
 *       <textarea name="description" placeholder="Description" />
 *     </form>
 *   );
 * }
 * ```
 */
export function useSAMForm(): UseSAMFormReturn {
  const { context, updateForm, orchestrator } = useSAMContext();
  const [fields, setFields] = useState<Record<string, SAMFormField>>(
    context.form?.fields ?? {}
  );

  // Sync local state with context
  useEffect(() => {
    if (context.form?.fields) {
      setFields(context.form.fields);
    }
  }, [context.form?.fields]);

  const updateFields = useCallback(
    (newFields: Record<string, SAMFormField>) => {
      setFields(newFields);
      updateForm(newFields);
    },
    [updateForm]
  );

  const syncFormToSAM = useCallback(
    (formElement: HTMLFormElement) => {
      const formFields = extractFormFields(formElement);
      updateFields(formFields);
    },
    [updateFields]
  );

  const autoFillField = useCallback(
    (fieldName: string, value: unknown) => {
      // Update the field in state
      const updatedFields = {
        ...fields,
        [fieldName]: {
          ...fields[fieldName],
          value,
        },
      };
      updateFields(updatedFields);

      // Try to update the actual DOM element
      if (typeof document !== 'undefined') {
        const element = document.querySelector(`[name="${fieldName}"]`) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | null;
        if (element) {
          element.value = String(value);
          // Trigger change event
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    },
    [fields, updateFields]
  );

  const getFieldSuggestions = useCallback(
    async (fieldName: string): Promise<string[]> => {
      if (!orchestrator) return [];

      const field = fields[fieldName];
      if (!field) return [];

      try {
        const result = await orchestrator.orchestrate(
          context,
          `Suggest values for the ${field.label ?? fieldName} field`,
          { parallel: false }
        );

        // Extract suggestions from response
        const suggestions = result.response.suggestions
          .filter((s) => s.type === 'quick-reply')
          .map((s) => s.text);

        return suggestions;
      } catch {
        return [];
      }
    },
    [orchestrator, fields, context]
  );

  return {
    fields,
    updateFields,
    syncFormToSAM,
    autoFillField,
    getFieldSuggestions,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractFormFields(formElement: HTMLFormElement): Record<string, SAMFormField> {
  const fields: Record<string, SAMFormField> = {};

  const elements = formElement.elements;
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i] as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

    if (!element.name) continue;
    if (element.type === 'submit' || element.type === 'button') continue;

    const field: SAMFormField = {
      name: element.name,
      type: detectFieldType(element),
      value: getFieldValue(element),
      label: getFieldLabel(element),
      placeholder: (element as HTMLInputElement).placeholder,
      required: element.required,
      disabled: element.disabled,
      readOnly: (element as HTMLInputElement).readOnly,
    };

    fields[element.name] = field;
  }

  return fields;
}

function detectFieldType(element: HTMLElement): string {
  if (element instanceof HTMLTextAreaElement) {
    return 'textarea';
  }

  if (element instanceof HTMLSelectElement) {
    return 'select';
  }

  if (element instanceof HTMLInputElement) {
    return element.type || 'text';
  }

  return 'text';
}

function getFieldValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): unknown {
  if (element instanceof HTMLInputElement && element.type === 'checkbox') {
    return element.checked;
  }
  if (element instanceof HTMLInputElement && element.type === 'number') {
    return element.valueAsNumber;
  }
  return element.value;
}

function getFieldLabel(element: HTMLElement): string | undefined {
  // Try to find associated label
  const name = (element as HTMLInputElement).name;
  if (name && typeof document !== 'undefined') {
    const label = document.querySelector(`label[for="${name}"]`);
    if (label) {
      return label.textContent?.trim();
    }
  }

  // Try to find parent label
  const parentLabel = element.closest('label');
  if (parentLabel) {
    // Get text content excluding the input itself
    const clone = parentLabel.cloneNode(true) as HTMLElement;
    const inputs = clone.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => input.remove());
    return clone.textContent?.trim();
  }

  return undefined;
}

/**
 * Hook for auto-syncing a form with SAM
 */
export function useSAMFormSync(options: FormSyncOptions): void {
  const { syncFormToSAM } = useSAMForm();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const form =
      typeof options.form === 'string'
        ? document.querySelector<HTMLFormElement>(options.form)
        : options.form;

    if (!form) return;

    // Initial sync
    syncFormToSAM(form);

    if (!options.autoSync) return;

    const handleChange = () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        syncFormToSAM(form);
      }, options.debounceMs ?? 300);
    };

    form.addEventListener('input', handleChange);
    form.addEventListener('change', handleChange);

    return () => {
      form.removeEventListener('input', handleChange);
      form.removeEventListener('change', handleChange);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [options.form, options.autoSync, options.debounceMs, syncFormToSAM]);
}
