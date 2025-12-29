/**
 * @sam-ai/react - useSAMFormDataSync Hook
 * Syncs structured form state (objects/arrays) into SAM form context.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSAMContext } from '../context/SAMContext';
import type { SAMFormField, SAMFormContext } from '@sam-ai/core';
import type { UseSAMFormDataSyncOptions, UseSAMFormDataSyncReturn } from '../types';

const DEFAULT_MAX_DEPTH = 6;

function formatLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function toFieldType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  return typeof value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && value?.constructor === Object;
}

function extractFields(
  value: unknown,
  fields: Record<string, SAMFormField>,
  fieldMeta: NonNullable<UseSAMFormDataSyncOptions['fieldMeta']>,
  path: string,
  depth: number,
  maxDepth: number
): void {
  if (depth > maxDepth) {
    fields[path] = {
      name: path,
      value: '[Max depth reached]',
      type: 'error',
      label: formatLabel(path),
    };
    return;
  }

  if (value === undefined) {
    fields[path] = {
      name: path,
      value: undefined,
      type: 'undefined',
      label: formatLabel(path),
    };
    return;
  }

  if (value === null) {
    fields[path] = {
      name: path,
      value: null,
      type: 'null',
      label: formatLabel(path),
    };
    return;
  }

  if (Array.isArray(value)) {
    fields[path] = {
      name: path,
      value,
      type: 'array',
      label: formatLabel(path),
    };

    value.forEach((item, index) => {
      extractFields(item, fields, fieldMeta, `${path}[${index}]`, depth + 1, maxDepth);
    });
    return;
  }

  if (value instanceof Date) {
    fields[path] = {
      name: path,
      value: value.toISOString(),
      type: 'date',
      label: formatLabel(path),
    };
    return;
  }

  if (isPlainObject(value)) {
    fields[path] = {
      name: path,
      value: JSON.stringify(value),
      type: 'object',
      label: formatLabel(path),
    };

    Object.entries(value).forEach(([key, nested]) => {
      const nextPath = path ? `${path}.${key}` : key;
      extractFields(nested, fields, fieldMeta, nextPath, depth + 1, maxDepth);
    });
    return;
  }

  const meta = fieldMeta[path] ?? {};

  fields[path] = {
    name: path,
    value,
    type: meta.type ?? toFieldType(value),
    label: meta.label ?? formatLabel(path),
    placeholder: meta.placeholder,
    required: meta.required,
    disabled: meta.disabled,
    readOnly: meta.readOnly,
  };
}

function buildFormContext(
  formId: string,
  formName: string,
  fields: Record<string, SAMFormField>,
  options: UseSAMFormDataSyncOptions
): SAMFormContext {
  return {
    formId,
    formName,
    fields,
    isDirty: options.isDirty ?? true,
    isSubmitting: false,
    isValid: options.isValid ?? true,
    errors: {},
    touchedFields: new Set<string>(),
    lastUpdated: new Date(),
    metadata: {
      formType: options.formType ?? 'data-sync',
      pageUrl: typeof window !== 'undefined' ? window.location.pathname : undefined,
      ...options.metadata,
    },
  };
}

export function useSAMFormDataSync<T = Record<string, unknown>>(
  formId: string,
  formData: T,
  options: UseSAMFormDataSyncOptions = {}
): UseSAMFormDataSyncReturn {
  const { context, updateContext } = useSAMContext();
  const latestOptionsRef = useRef(options);
  latestOptionsRef.current = options;

  // Use refs to avoid infinite loops (sync updates context which would retrigger itself)
  const contextRef = useRef(context);
  contextRef.current = context;

  const updateContextRef = useRef(updateContext);
  updateContextRef.current = updateContext;

  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;

  const serializedData = useMemo(() => JSON.stringify(formData), [formData]);
  const serializedOptions = useMemo(() => JSON.stringify({
    enabled: options.enabled,
    formName: options.formName,
    formType: options.formType,
    isDirty: options.isDirty,
    isValid: options.isValid,
    maxDepth: options.maxDepth,
  }), [options.enabled, options.formName, options.formType, options.isDirty, options.isValid, options.maxDepth]);

  const sync = useCallback(() => {
    const opts = latestOptionsRef.current;
    if (!opts.enabled && opts.enabled !== undefined) return;
    if (!formId) return;

    const currentFormData = formDataRef.current;
    const meta = opts.fieldMeta ?? {};
    const fields: Record<string, SAMFormField> = {};

    if (isPlainObject(currentFormData)) {
      Object.entries(currentFormData).forEach(([key, value]) => {
        extractFields(value, fields, meta, key, 0, maxDepth);
      });
    } else {
      extractFields(currentFormData, fields, meta, 'value', 0, maxDepth);
    }

    const formName = opts.formName ?? formId;
    const nextContext = buildFormContext(formId, formName, fields, opts);

    // Access current context via ref to avoid dependency cycle
    const currentForm = contextRef.current.form;
    updateContextRef.current({
      form: currentForm?.formId === formId
        ? { ...currentForm, ...nextContext, fields }
        : nextContext,
    });
  }, [formId, maxDepth]); // Minimal deps - uses refs for mutable values

  useEffect(() => {
    if (options.debounceMs && options.debounceMs > 0) {
      const timeoutId = setTimeout(sync, options.debounceMs);
      return () => clearTimeout(timeoutId);
    }
    sync();
  }, [serializedData, serializedOptions, options.debounceMs, sync]);

  return { sync };
}
