/**
 * @sam-ai/react - useSAMFormAutoFill Hook
 * Resolves fields by name/label and fills DOM inputs + SAM context.
 */
'use client';
import { useCallback } from 'react';
import { useSAMContext } from '../context/SAMContext';
function normalize(value) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
function getFieldCandidates(fields) {
    return Object.entries(fields);
}
function resolveFromContext(target, fields) {
    const normalizedTarget = normalize(target);
    const candidates = getFieldCandidates(fields);
    for (const [name, field] of candidates) {
        if (normalize(name) === normalizedTarget)
            return name;
        if (field.label && normalize(field.label) === normalizedTarget)
            return name;
        if (field.placeholder && normalize(field.placeholder) === normalizedTarget)
            return name;
    }
    for (const [name, field] of candidates) {
        if (normalize(name).includes(normalizedTarget))
            return name;
        if (field.label && normalize(field.label).includes(normalizedTarget))
            return name;
        if (field.placeholder && normalize(field.placeholder).includes(normalizedTarget))
            return name;
    }
    return null;
}
function findElementByField(fieldName) {
    if (typeof document === 'undefined')
        return null;
    return (document.querySelector(`[name="${CSS.escape(fieldName)}"]`) ||
        document.getElementById(fieldName));
}
function applyElementValue(element, value, triggerEvents) {
    if (element instanceof HTMLInputElement) {
        if (element.type === 'checkbox') {
            element.checked = Boolean(value);
        }
        else if (element.type === 'radio') {
            if (String(value) === element.value) {
                element.checked = true;
            }
        }
        else {
            element.value = String(value ?? '');
        }
    }
    else if (element instanceof HTMLTextAreaElement) {
        element.value = String(value ?? '');
    }
    else if (element instanceof HTMLSelectElement) {
        if (element.multiple && Array.isArray(value)) {
            const values = value.map(String);
            Array.from(element.options).forEach((option) => {
                option.selected = values.includes(option.value);
            });
        }
        else {
            element.value = String(value ?? '');
        }
    }
    if (triggerEvents) {
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }
}
export function useSAMFormAutoFill(options = {}) {
    const { context, updateContext } = useSAMContext();
    const resolveField = useCallback((target) => {
        if (!target)
            return null;
        const fields = context.form?.fields ?? {};
        const resolved = resolveFromContext(target, fields);
        if (resolved)
            return resolved;
        const element = findElementByField(target);
        if (element)
            return target;
        return null;
    }, [context.form?.fields]);
    const fillField = useCallback((target, value) => {
        const resolved = resolveField(target);
        if (!resolved)
            return false;
        const element = findElementByField(resolved);
        if (element) {
            applyElementValue(element, value, options.triggerEvents !== false);
        }
        if (context.form?.fields?.[resolved]) {
            const updatedFields = {
                ...context.form.fields,
                [resolved]: {
                    ...context.form.fields[resolved],
                    value,
                    dirty: true,
                },
            };
            updateContext({
                form: {
                    ...context.form,
                    fields: updatedFields,
                    lastUpdated: new Date(),
                },
            });
        }
        options.onFill?.(resolved, value);
        return true;
    }, [context.form, options, resolveField, updateContext]);
    return { fillField, resolveField };
}
