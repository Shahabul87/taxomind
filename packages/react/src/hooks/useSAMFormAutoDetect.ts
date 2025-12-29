/**
 * @sam-ai/react - useSAMFormAutoDetect Hook
 * Auto-detects the most relevant form on the page and syncs it into SAM context.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSAMContext } from '../context/SAMContext';
import type { SAMFormContext, SAMFormField } from '@sam-ai/core';
import type { UseSAMFormAutoDetectOptions, UseSAMFormAutoDetectReturn } from '../types';

function formatLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function detectFieldType(element: HTMLElement): string {
  if (element instanceof HTMLTextAreaElement) return 'textarea';
  if (element instanceof HTMLSelectElement) return 'select';
  if (element instanceof HTMLInputElement) return element.type || 'text';
  return 'text';
}

function getFieldLabel(element: HTMLElement): string | undefined {
  const name = (element as HTMLInputElement).name;

  if (name && typeof document !== 'undefined') {
    const label = document.querySelector(`label[for="${CSS.escape(name)}"]`);
    if (label) return label.textContent?.trim();
  }

  const parentLabel = element.closest('label');
  if (parentLabel) {
    const clone = parentLabel.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('input, textarea, select').forEach((input) => input.remove());
    return clone.textContent?.trim();
  }

  return name ? formatLabel(name) : undefined;
}

function getFieldValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): unknown {
  if (element instanceof HTMLInputElement && element.type === 'checkbox') {
    return element.checked;
  }
  if (element instanceof HTMLInputElement && element.type === 'number') {
    return element.valueAsNumber;
  }
  if (element instanceof HTMLSelectElement && element.multiple) {
    return Array.from(element.selectedOptions).map((option) => option.value);
  }
  return element.value;
}

function extractFormFields(
  form: HTMLFormElement,
  options: UseSAMFormAutoDetectOptions
): Record<string, SAMFormField> {
  const fields: Record<string, SAMFormField> = {};
  const elements = form.querySelectorAll('input, textarea, select');
  const maxFields = options.maxFields ?? 80;
  let count = 0;

  elements.forEach((element) => {
    if (count >= maxFields) return;
    const field = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (!field.name) return;
    if (!options.includeHidden && field.type === 'hidden') return;

    fields[field.name] = {
      name: field.name,
      type: detectFieldType(field),
      value: getFieldValue(field),
      label: getFieldLabel(field),
      placeholder: field instanceof HTMLSelectElement ? undefined : field.placeholder,
      required: field.required,
      disabled: field.disabled,
      readOnly: field instanceof HTMLSelectElement ? false : field.readOnly,
    };
    count += 1;
  });

  return fields;
}

function detectPrimaryForm(
  forms: HTMLFormElement[],
  preferFocused: boolean
): HTMLFormElement | null {
  if (!forms.length) return null;

  if (preferFocused && typeof document !== 'undefined') {
    const activeElement = document.activeElement;
    if (activeElement) {
      const activeForm = activeElement.closest('form');
      if (activeForm instanceof HTMLFormElement) return activeForm;
    }
  }

  return forms
    .slice()
    .sort((a, b) => b.elements.length - a.elements.length)[0];
}

function buildFormContext(
  form: HTMLFormElement,
  fields: Record<string, SAMFormField>,
  options: UseSAMFormAutoDetectOptions
): SAMFormContext {
  const formId =
    form.getAttribute('data-sam-form-id') ||
    form.id ||
    form.getAttribute('name') ||
    'sam-auto-form';

  const formName =
    form.getAttribute('data-sam-form-name') ||
    form.getAttribute('aria-label') ||
    formId;

  const hasValue = Object.values(fields).some((field) => {
    if (field.value === null || field.value === undefined) return false;
    if (typeof field.value === 'string') return field.value.trim().length > 0;
    if (Array.isArray(field.value)) return field.value.length > 0;
    return true;
  });

  return {
    formId,
    formName,
    fields,
    isDirty: hasValue,
    isSubmitting: false,
    isValid: true,
    errors: {},
    touchedFields: new Set<string>(),
    lastUpdated: new Date(),
    metadata: {
      formType: options.formType ?? 'auto-detect',
      pageUrl: typeof window !== 'undefined' ? window.location.pathname : undefined,
      ...options.metadata,
    },
  };
}

export function useSAMFormAutoDetect(
  options: UseSAMFormAutoDetectOptions = {}
): UseSAMFormAutoDetectReturn {
  const { context, updateContext } = useSAMContext();
  const [formContext, setFormContext] = useState<SAMFormContext | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const detectAndSync = useCallback(() => {
    if (options.enabled === false) return;
    if (typeof document === 'undefined') return;

    const selector = options.selector ?? 'form';
    const forms = Array.from(document.querySelectorAll<HTMLFormElement>(selector));

    if (!forms.length) return;

    const primaryForm = detectPrimaryForm(forms, options.preferFocused !== false);
    if (!primaryForm) return;

    const fields = extractFormFields(primaryForm, options);
    const nextContext = buildFormContext(primaryForm, fields, options);
    setFormContext(nextContext);

    const shouldUpdate =
      options.overrideExisting ||
      !context.form ||
      context.form.formId === nextContext.formId;

    if (shouldUpdate) {
      updateContext({ form: nextContext });
    }
  }, [context.form, options, updateContext]);

  useEffect(() => {
    if (options.enabled === false) return;
    if (typeof document === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const debounceMs = options.debounceMs ?? 300;

    const schedule = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        timeoutId = null;
        detectAndSync();
      }, debounceMs);
    };

    detectAndSync();

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });

    const onFocus = () => schedule();
    window.addEventListener('focusin', onFocus, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('focusin', onFocus, true);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [detectAndSync, options.debounceMs, options.enabled]);

  return { formContext, refresh: detectAndSync };
}
