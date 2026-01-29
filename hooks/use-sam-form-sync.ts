/**
 * SAM Form Sync Hook for React Hook Form
 *
 * This hook enables seamless integration between React Hook Form and SAM's
 * form registry system, providing real-time context awareness.
 *
 * Usage:
 * ```typescript
 * const { register, watch, handleSubmit } = useForm();
 * useSAMFormSync('my-form-id', watch);
 * ```
 */

import { useEffect, useRef } from 'react';
import { UseFormWatch, FieldValues } from 'react-hook-form';
import { useFormRegistry } from '@/lib/stores/form-registry-store';
import { usePathname } from 'next/navigation';
import { logger } from '@/lib/logger';

interface SAMFormSyncOptions {
  formName?: string;
  metadata?: Record<string, unknown>;
  debounce?: number;
}

/**
 * Synchronizes React Hook Form state with SAM's global form registry
 *
 * @param formId - Unique identifier for the form
 * @param watch - React Hook Form's watch function
 * @param options - Additional configuration options
 *
 * @example
 * ```typescript
 * function MyForm() {
 *   const { register, watch, handleSubmit } = useForm({
 *     defaultValues: { title: '', description: '' }
 *   });
 *
 *   // Enable SAM awareness with one line
 *   useSAMFormSync('course-form', watch, {
 *     formName: 'Create Course',
 *     metadata: { formType: 'course' }
 *   });
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <input {...register('title')} />
 *       <textarea {...register('description')} />
 *     </form>
 *   );
 * }
 * ```
 */
export function useSAMFormSync<TFieldValues extends FieldValues = FieldValues>(
  formId: string,
  watch: UseFormWatch<TFieldValues>,
  options: SAMFormSyncOptions = {}
) {
  const { registerForm, updateFormField, unregisterForm } = useFormRegistry();
  const pathname = usePathname();

  // Store callback/object deps in refs to keep the effect dependency array honest
  const watchRef = useRef(watch);
  watchRef.current = watch;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const registerFormRef = useRef(registerForm);
  registerFormRef.current = registerForm;

  const updateFormFieldRef = useRef(updateFormField);
  updateFormFieldRef.current = updateFormField;

  const unregisterFormRef = useRef(unregisterForm);
  unregisterFormRef.current = unregisterForm;

  useEffect(() => {
    const currentOptions = optionsRef.current;

    // Register the form with SAM
    registerFormRef.current(formId, {
      purpose: currentOptions.formName || formId,
      pageUrl: pathname,
      formType: (currentOptions.metadata?.formType as string) || 'react-hook-form',
      ...currentOptions.metadata,
    });

    logger.info(`[useSAMFormSync] Form registered: ${formId}`);

    // Watch all form fields and sync to registry
    const subscription = watchRef.current((data, { name, type }) => {
      // Update only the changed field for better performance
      if (name && type) {
        updateFormFieldRef.current(formId, name, {
          value: data[name],
          type: typeof data[name],
          touched: type === 'change',
          dirty: true,
        });

        logger.debug(`[useSAMFormSync] Field updated: ${name} = ${data[name]}`);
      } else {
        // Initial sync or full form update
        Object.entries(data).forEach(([fieldName, value]) => {
          if (value !== undefined) {
            updateFormFieldRef.current(formId, fieldName, {
              value,
              type: typeof value,
            });
          }
        });

        logger.debug(`[useSAMFormSync] Full form synced: ${formId}`);
      }
    });

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
      unregisterFormRef.current(formId);
      logger.info(`[useSAMFormSync] Form unregistered: ${formId}`);
    };
  }, [formId, pathname]);
}

/**
 * Alternative hook with debouncing for performance-critical forms
 *
 * @param formId - Unique identifier for the form
 * @param watch - React Hook Form's watch function
 * @param debounceMs - Debounce delay in milliseconds (default: 300ms)
 * @param options - Additional configuration options
 */
export function useSAMFormSyncDebounced<TFieldValues extends FieldValues = FieldValues>(
  formId: string,
  watch: UseFormWatch<TFieldValues>,
  debounceMs: number = 300,
  options: SAMFormSyncOptions = {}
) {
  const { registerForm, updateMultipleFields, unregisterForm } = useFormRegistry();
  const pathname = usePathname();

  // Store callback/object deps in refs to keep the effect dependency array honest
  const watchRef = useRef(watch);
  watchRef.current = watch;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const registerFormRef = useRef(registerForm);
  registerFormRef.current = registerForm;

  const updateMultipleFieldsRef = useRef(updateMultipleFields);
  updateMultipleFieldsRef.current = updateMultipleFields;

  const unregisterFormRef = useRef(unregisterForm);
  unregisterFormRef.current = unregisterForm;

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const currentOptions = optionsRef.current;

    // Register the form
    registerFormRef.current(formId, {
      purpose: currentOptions.formName || formId,
      pageUrl: pathname,
      formType: (currentOptions.metadata?.formType as string) || 'react-hook-form-debounced',
      ...currentOptions.metadata,
    });

    logger.info(`[useSAMFormSyncDebounced] Form registered: ${formId} (debounce: ${debounceMs}ms)`);

    // Watch with debouncing
    const subscription = watchRef.current((data) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        const fields: Record<string, { value: unknown; type: string }> = {};

        Object.entries(data).forEach(([fieldName, value]) => {
          if (value !== undefined) {
            fields[fieldName] = {
              value,
              type: typeof value,
            };
          }
        });

        updateMultipleFieldsRef.current(formId, fields);
        logger.debug(`[useSAMFormSyncDebounced] Batch update: ${Object.keys(fields).length} fields`);
      }, debounceMs);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      unregisterFormRef.current(formId);
      logger.info(`[useSAMFormSyncDebounced] Form unregistered: ${formId}`);
    };
  }, [formId, pathname, debounceMs]);
}
