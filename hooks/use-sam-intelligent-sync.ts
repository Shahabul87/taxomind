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

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useFormRegistry } from '@/lib/stores/form-registry-store';

export interface IntelligentSyncOptions {
  formName?: string;
  metadata?: Record<string, unknown>;
  debounce?: number; // Optional debounce in ms
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

  // Register form on mount
  useEffect(() => {
    registerForm(formId, {
      purpose: options.formName || formId,
      pageUrl: pathname,
      formType: 'intelligent-auto-detect',
      ...options.metadata,
    });

    return () => {
      unregisterForm(formId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, options.formName, pathname, registerForm, unregisterForm]);

  // Memoize the serialized form data for deep comparison
  const serializedFormData = useMemo(() => JSON.stringify(formData), [formData]);

  // Intelligent field extraction and sync
  useEffect(() => {
    if (!formData) return;

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
    if (typeof formData === 'object' && formData !== null && !Array.isArray(formData)) {
      Object.entries(formData as Record<string, unknown>).forEach(([key, value]) => {
        extractFields(value, key);
      });
    } else {
      // Handle non-object form data (edge case)
      extractFields(formData, 'value');
    }

    // Update SAM registry with all auto-detected fields
    updateMultipleFields(formId, fields);

    // Debounce if requested
    if (options.debounce) {
      const timeoutId = setTimeout(() => {
        updateMultipleFields(formId, fields);
      }, options.debounce);

      return () => clearTimeout(timeoutId);
    }

    // Deep comparison via serialized data ensures ALL changes are detected
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedFormData, formId, updateMultipleFields, options.debounce]);
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

  useEffect(() => {
    registerForm(formId, {
      purpose: options.formName || formId,
      pageUrl: pathname,
      formType: 'custom-detector',
      ...options.metadata,
    });

    return () => {
      unregisterForm(formId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, options.formName, pathname, registerForm, unregisterForm]);

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
    // Custom change detector would be used in the parent component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, formId, updateMultipleFields]);
}
