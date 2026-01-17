/**
 * @sam-ai/react - useSAMForm Hook
 * Hook for form synchronization with SAM
 */
'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useSAMContext } from '../context/SAMContext';
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
export function useSAMForm() {
    const { context, updateForm, orchestrator } = useSAMContext();
    const [fields, setFields] = useState(context.form?.fields ?? {});
    // Sync local state with context
    useEffect(() => {
        if (context.form?.fields) {
            setFields(context.form.fields);
        }
    }, [context.form?.fields]);
    const updateFields = useCallback((newFields) => {
        setFields(newFields);
        updateForm(newFields);
    }, [updateForm]);
    const syncFormToSAM = useCallback((formElement) => {
        const formFields = extractFormFields(formElement);
        updateFields(formFields);
    }, [updateFields]);
    const autoFillField = useCallback((fieldName, value) => {
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
            const element = document.querySelector(`[name="${fieldName}"]`);
            if (element) {
                element.value = String(value);
                // Trigger change event
                element.dispatchEvent(new Event('change', { bubbles: true }));
                element.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }, [fields, updateFields]);
    const getFieldSuggestions = useCallback(async (fieldName) => {
        if (!orchestrator)
            return [];
        const field = fields[fieldName];
        if (!field)
            return [];
        try {
            const result = await orchestrator.orchestrate(context, `Suggest values for the ${field.label ?? fieldName} field`, { parallel: false });
            // Extract suggestions from response
            const suggestions = result.response.suggestions
                .filter((s) => s.type === 'quick-reply')
                .map((s) => s.text);
            return suggestions;
        }
        catch {
            return [];
        }
    }, [orchestrator, fields, context]);
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
function extractFormFields(formElement) {
    const fields = {};
    const elements = formElement.elements;
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (!element.name)
            continue;
        if (element.type === 'submit' || element.type === 'button')
            continue;
        const field = {
            name: element.name,
            type: detectFieldType(element),
            value: getFieldValue(element),
            label: getFieldLabel(element),
            placeholder: element.placeholder,
            required: element.required,
            disabled: element.disabled,
            readOnly: element.readOnly,
        };
        fields[element.name] = field;
    }
    return fields;
}
function detectFieldType(element) {
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
function getFieldValue(element) {
    if (element instanceof HTMLInputElement && element.type === 'checkbox') {
        return element.checked;
    }
    if (element instanceof HTMLInputElement && element.type === 'number') {
        return element.valueAsNumber;
    }
    return element.value;
}
function getFieldLabel(element) {
    // Try to find associated label
    const name = element.name;
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
        const clone = parentLabel.cloneNode(true);
        const inputs = clone.querySelectorAll('input, textarea, select');
        inputs.forEach((input) => input.remove());
        return clone.textContent?.trim();
    }
    return undefined;
}
/**
 * Hook for auto-syncing a form with SAM
 */
export function useSAMFormSync(options) {
    const { syncFormToSAM } = useSAMForm();
    const debounceRef = useRef(undefined);
    useEffect(() => {
        const form = typeof options.form === 'string'
            ? document.querySelector(options.form)
            : options.form;
        if (!form)
            return;
        // Initial sync
        syncFormToSAM(form);
        if (!options.autoSync)
            return;
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
