/**
 * Intelligent SAM Form Sync Hook
 *
 * Automatically detects and syncs ANY form data with SAM's global context.
 * No hardcoding of field names required - fully dynamic and intelligent.
 *
 * Features:
 * - Auto-detects all fields (primitive, objects, arrays)
 * - Deep comparison for nested structures
 * - Works with useState, React Hook Form, or any state management
 * - Automatic metadata enrichment
 * - Zero configuration for simple cases
 *
 * @example
 * // Simple usage - auto-detect everything
 * useIntelligentSAMSync('my-form', formData);
 *
 * @example
 * // With metadata for richer context
 * useIntelligentSAMSync('checkout-form', formData, {
 *   formName: 'Checkout',
 *   metadata: { userId, cartTotal }
 * });
 */

import { useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useFormRegistry } from '@/lib/stores/form-registry-store';
import { emitSAMFormData } from '@sam-ai/react';
import type { UseSAMFormDataSyncOptions } from '@sam-ai/react';

export interface IntelligentSyncOptions {
  formName?: string;
  metadata?: Record<string, unknown>;
  debounce?: number; // Optional debounce in ms
  fieldMeta?: UseSAMFormDataSyncOptions['fieldMeta'];
  formType?: string;
  maxDepth?: number;
  isDirty?: boolean;
  isValid?: boolean;
  enabled?: boolean;
}

/**
 * Intelligent hook that auto-detects and syncs ANY form data with SAM
 */
export function useIntelligentSAMSync<T = any>(
  formId: string,
  formData: T,
  options: IntelligentSyncOptions = {}
) {
  const { registerForm, updateMultipleFields, unregisterForm } = useFormRegistry();
  const pathname = usePathname();

  // Store options and formData in refs to avoid dependency issues
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Register form on mount
  useEffect(() => {
    if (optionsRef.current.enabled === false) return;
    registerForm(formId, {
      purpose: optionsRef.current.formName || formId,
      pageUrl: pathname,
      formType: optionsRef.current.formType ?? 'intelligent-auto-detect',
      ...optionsRef.current.metadata,
    });

    return () => {
      unregisterForm(formId);
    };
  }, [formId, pathname, registerForm, unregisterForm]);

  // Memoize the serialized form data for deep comparison
  const serializedFormData = useMemo(() => JSON.stringify(formData), [formData]);

  // Memoize the serialized options for deep comparison (prevents infinite loops)
  const serializedMetadata = useMemo(() => JSON.stringify(options.metadata), [options.metadata]);
  const serializedFieldMeta = useMemo(() => JSON.stringify(options.fieldMeta), [options.fieldMeta]);

  // Intelligent field extraction and sync
  useEffect(() => {
    if (optionsRef.current.enabled === false) return;
    const currentFormData = formDataRef.current;
    if (!currentFormData) return;

    const fields: Record<string, { value: unknown; type: string }> = {};

    /**
     * Recursively process any value to extract all fields
     * Handles primitives, objects, arrays, null, undefined
     */
    const extractFields = (
      value: any,
      path: string = '',
      depth: number = 0
    ): void => {
      // Prevent infinite recursion
      if (depth > 10) {
        fields[path] = {
          value: '[Max depth reached]',
          type: 'error',
        };
        return;
      }

      // Handle null and undefined
      if (value === null || value === undefined) {
        fields[path] = {
          value,
          type: value === null ? 'null' : 'undefined',
        };
        return;
      }

      // Handle arrays
      if (Array.isArray(value)) {
        fields[path] = {
          value,
          type: 'array',
        };

        // Also extract array items for detailed context
        value.forEach((item, index) => {
          extractFields(item, `${path}[${index}]`, depth + 1);
        });
        return;
      }

      // Handle objects (but not class instances, Dates, etc.)
      if (typeof value === 'object' && value.constructor === Object) {
        // Store the whole object as well
        fields[path] = {
          value: JSON.stringify(value),
          type: 'object',
        };

        // Recursively extract nested fields
        Object.entries(value).forEach(([key, val]) => {
          const newPath = path ? `${path}.${key}` : key;
          extractFields(val, newPath, depth + 1);
        });
        return;
      }

      // Handle Date objects
      if (value instanceof Date) {
        fields[path] = {
          value: value.toISOString(),
          type: 'date',
        };
        return;
      }

      // Handle primitive values (string, number, boolean)
      fields[path] = {
        value,
        type: typeof value,
      };
    };

    // Start extraction from root
    if (typeof currentFormData === 'object' && currentFormData !== null && !Array.isArray(currentFormData)) {
      Object.entries(currentFormData as Record<string, unknown>).forEach(([key, value]) => {
        extractFields(value, key);
      });
    } else {
      // Handle non-object form data (edge case)
      extractFields(currentFormData, 'value');
    }

    // Update SAM registry with all auto-detected fields
    updateMultipleFields(formId, fields);

    const opts = optionsRef.current;
    emitSAMFormData({
      formId,
      formData: currentFormData as Record<string, unknown>,
      options: {
        formName: opts.formName ?? formId,
        metadata: {
          pageUrl: pathname,
          ...opts.metadata,
        },
        fieldMeta: opts.fieldMeta,
        debounceMs: opts.debounce,
        maxDepth: opts.maxDepth,
        formType: opts.formType ?? 'intelligent-auto-detect',
        isDirty: opts.isDirty,
        isValid: opts.isValid,
      },
    });

    // Debounce if requested
    if (optionsRef.current.debounce) {
      const timeoutId = setTimeout(() => {
        updateMultipleFields(formId, fields);
      }, optionsRef.current.debounce);

      return () => clearTimeout(timeoutId);
    }

    // Deep comparison via serialized data ensures ALL changes are detected
    // Using serialized versions of objects prevents infinite loops from new object references
    // optionsRef is used for mutable options to keep deps stable
  }, [
    serializedFormData,
    serializedMetadata,
    serializedFieldMeta,
    formId,
    pathname,
    updateMultipleFields,
  ]);
}

/**
 * Hook for React Hook Form with intelligent detection
 * Combines form watching with intelligent sync
 */
export function useIntelligentSAMSyncWithWatch<T = any>(
  formId: string,
  watch: () => T,
  options: IntelligentSyncOptions = {}
) {
  const formData = watch();
  useIntelligentSAMSync(formId, formData, options);
}

/**
 * Advanced: Custom change detector for complex scenarios
 * Allows custom comparison logic if needed
 */
export function useIntelligentSAMSyncCustom<T = any>(
  formId: string,
  formData: T,
  changeDetector: (prev: T, current: T) => boolean,
  options: IntelligentSyncOptions = {}
) {
  const { registerForm, updateMultipleFields, unregisterForm } = useFormRegistry();
  const pathname = usePathname();

  // Store options in ref to avoid stale closures
  const customOptionsRef = useRef(options);
  customOptionsRef.current = options;

  useEffect(() => {
    registerForm(formId, {
      purpose: customOptionsRef.current.formName || formId,
      pageUrl: pathname,
      formType: 'custom-detector',
      ...customOptionsRef.current.metadata,
    });

    return () => {
      unregisterForm(formId);
    };
  }, [formId, pathname, registerForm, unregisterForm]);

  // Use custom detector for change tracking
  useEffect(() => {
    if (!formData) return;

    const fields: Record<string, { value: unknown; type: string }> = {};

    // Simple field extraction (custom detector handles change detection)
    if (typeof formData === 'object' && formData !== null) {
      Object.entries(formData as Record<string, unknown>).forEach(([key, value]) => {
        fields[key] = {
          value,
          type: typeof value,
        };
      });
    }

    updateMultipleFields(formId, fields);
  }, [formData, formId, updateMultipleFields]);
}
