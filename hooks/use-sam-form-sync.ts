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

import { useEffect } from 'react';
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

  useEffect(() => {
    // Register the form with SAM
    registerForm(formId, {
      purpose: options.formName || formId,
      pageUrl: pathname,
      formType: (options.metadata?.formType as string) || 'react-hook-form',
      ...options.metadata,
    });

    logger.info(`[useSAMFormSync] Form registered: ${formId}`);

    // Watch all form fields and sync to registry
    const subscription = watch((data, { name, type }) => {
      // Update only the changed field for better performance
      if (name && type) {
        updateFormField(formId, name, {
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
            updateFormField(formId, fieldName, {
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
      unregisterForm(formId);
      logger.info(`[useSAMFormSync] Form unregistered: ${formId}`);
    };
    // Only re-run if formId or pathname changes - options are only used during registration
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Register the form
    registerForm(formId, {
      purpose: options.formName || formId,
      pageUrl: pathname,
      formType: (options.metadata?.formType as string) || 'react-hook-form-debounced',
      ...options.metadata,
    });

    logger.info(`[useSAMFormSyncDebounced] Form registered: ${formId} (debounce: ${debounceMs}ms)`);

    // Watch with debouncing
    const subscription = watch((data) => {
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

        updateMultipleFields(formId, fields);
        logger.debug(`[useSAMFormSyncDebounced] Batch update: ${Object.keys(fields).length} fields`);
      }, debounceMs);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      unregisterForm(formId);
      logger.info(`[useSAMFormSyncDebounced] Form unregistered: ${formId}`);
    };
    // Only re-run if formId, pathname, or debounceMs changes - options are only used during registration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, pathname, debounceMs]);
}
