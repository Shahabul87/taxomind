/**
 * Form Sync Wrapper Component
 *
 * This component wraps any form to automatically synchronize its state
 * with the global form registry, enabling SAM AI Assistant to have
 * real-time awareness of form data.
 *
 * Usage:
 * <FormSyncWrapper formId="unique-form-id" formName="Course Creation">
 *   <input name="title" />
 *   <textarea name="description" />
 * </FormSyncWrapper>
 */

"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { useFormRegistry } from '@/lib/stores/form-registry-store';
import { usePathname } from 'next/navigation';
import { logger } from '@/lib/logger';

interface FormSyncWrapperProps {
  formId: string;
  formName?: string;
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  metadata?: Record<string, any>;
  syncStrategy?: 'immediate' | 'debounced';
  debounceDelay?: number;
}

export function FormSyncWrapper({
  formId,
  formName,
  children,
  className,
  onSubmit,
  metadata = {},
  syncStrategy = 'immediate',
  debounceDelay = 300,
}: FormSyncWrapperProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const pathname = usePathname();
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const {
    registerForm,
    updateFormField,
    unregisterForm,
    setFormSubmitting,
    touchField,
  } = useFormRegistry();

  // Register form on mount
  useEffect(() => {
    registerForm(formId, {
      purpose: formName || formId,
      pageUrl: pathname,
      formType: metadata.formType || 'generic',
      ...metadata,
    });

    logger.info(`[FormSyncWrapper] Form registered: ${formId}`);

    return () => {
      unregisterForm(formId);
      logger.info(`[FormSyncWrapper] Form unregistered: ${formId}`);
    };
  }, [formId, formName, pathname, metadata, registerForm, unregisterForm]);

  // Sync field value to registry
  const syncFieldToRegistry = useCallback((element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
    if (!element.name) return;

    // Get field metadata
    const fieldType = element.type || element.tagName.toLowerCase();
    const isCheckbox = fieldType === 'checkbox';
    const isRadio = fieldType === 'radio';
    const isSelect = element.tagName.toLowerCase() === 'select';

    // Get the actual value based on field type
    let value: any = element.value;
    if (isCheckbox) {
      value = (element as HTMLInputElement).checked;
    } else if (isRadio) {
      value = (element as HTMLInputElement).checked ? element.value : undefined;
    } else if (isSelect && (element as HTMLSelectElement).multiple) {
      value = Array.from((element as HTMLSelectElement).selectedOptions).map(opt => opt.value);
    }

    // Get label from various sources
    let label = '';
    const elementWithLabels = element as any;
    if (elementWithLabels.labels && elementWithLabels.labels.length > 0) {
      label = elementWithLabels.labels[0].textContent?.trim() || '';
    } else {
      // Try to find label by for attribute
      const labelElement = document.querySelector(`label[for="${element.id}"]`);
      if (labelElement) {
        label = labelElement.textContent?.trim() || '';
      } else {
        // Check if element is inside a label
        const parentLabel = element.closest('label');
        if (parentLabel) {
          label = parentLabel.textContent?.trim() || '';
        }
      }
    }

    // Get placeholder and readOnly - only input and textarea have these properties
    const placeholder = element instanceof HTMLSelectElement
      ? undefined
      : element.placeholder;

    const readOnly = element instanceof HTMLSelectElement
      ? false
      : element.readOnly;

    // Update the form registry
    updateFormField(formId, element.name, {
      value,
      type: fieldType,
      label: label || element.getAttribute('aria-label') || placeholder || element.name,
      placeholder,
      required: element.required,
      disabled: element.disabled,
      readOnly,
    });

    logger.debug(`[FormSyncWrapper] Field synced: ${element.name} = ${value}`);
  }, [formId, updateFormField]);

  // Handle input changes
  const handleFieldChange = useCallback((event: Event) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

    if (!target.name) return;

    // Handle different sync strategies
    if (syncStrategy === 'debounced') {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        syncFieldToRegistry(target);
      }, debounceDelay);
    } else {
      // Immediate sync
      syncFieldToRegistry(target);
    }
  }, [syncStrategy, debounceDelay, syncFieldToRegistry]);

  // Handle field focus (touch tracking)
  const handleFieldFocus = useCallback((event: Event) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (target.name) {
      touchField(formId, target.name);
    }
  }, [formId, touchField]);

  // Setup event listeners
  useEffect(() => {
    if (!formRef.current) return;

    const form = formRef.current;

    // Add event listeners for real-time sync
    form.addEventListener('input', handleFieldChange, true);
    form.addEventListener('change', handleFieldChange, true);
    form.addEventListener('focusin', handleFieldFocus, true);

    // Initial sync of all existing field values
    const syncAllFields = () => {
      const fields = form.querySelectorAll('input, textarea, select');
      fields.forEach((field) => {
        const element = field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if (element.name && (element.value || element.type === 'checkbox')) {
          syncFieldToRegistry(element);
        }
      });
    };

    // Sync immediately
    syncAllFields();

    // Also sync after a small delay to catch any React-rendered fields
    const initialSyncTimer = setTimeout(syncAllFields, 100);

    // Mutation observer to catch dynamically added fields
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const fields = element.querySelectorAll?.('input, textarea, select') || [];

            // Check if the added node itself is a field
            if (element.tagName && ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
              syncFieldToRegistry(element as any);
            }

            // Check children
            fields.forEach((field) => {
              const fieldElement = field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
              if (fieldElement.name) {
                syncFieldToRegistry(fieldElement);
              }
            });
          }
        });
      });
    });

    // Start observing the form for changes
    observer.observe(form, {
      childList: true,
      subtree: true,
    });

    return () => {
      // Cleanup
      form.removeEventListener('input', handleFieldChange, true);
      form.removeEventListener('change', handleFieldChange, true);
      form.removeEventListener('focusin', handleFieldFocus, true);
      observer.disconnect();
      clearTimeout(initialSyncTimer);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [handleFieldChange, handleFieldFocus, syncFieldToRegistry]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    // Mark form as submitting
    setFormSubmitting(formId, true);

    // Call original onSubmit if provided
    if (onSubmit) {
      onSubmit(e);
    }

    // Reset submitting state after a delay
    setTimeout(() => {
      setFormSubmitting(formId, false);
    }, 1000);
  }, [formId, onSubmit, setFormSubmitting]);

  return (
    <form
      ref={formRef}
      className={className}
      onSubmit={handleSubmit}
      data-sam-form-id={formId}
      data-sam-form-name={formName}
      data-sam-sync="active"
    >
      {children}
    </form>
  );
}

// Export a non-wrapper version for existing forms
export function useSyncExistingForm(formId: string, formElement: HTMLFormElement | null) {
  const pathname = usePathname();
  const {
    registerForm,
    updateFormField,
    unregisterForm,
    touchField,
  } = useFormRegistry();

  useEffect(() => {
    if (!formElement) return;

    // Register the form
    registerForm(formId, {
      purpose: formElement.getAttribute('data-purpose') || formId,
      pageUrl: pathname,
      formType: 'existing',
    });

    const syncField = (element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
      if (!element.name) return;

      const value = element.type === 'checkbox'
        ? (element as HTMLInputElement).checked
        : element.value;

      // Get placeholder and readOnly - only input and textarea have these properties
      const elemPlaceholder = element instanceof HTMLSelectElement
        ? undefined
        : element.placeholder;

      const elemReadOnly = element instanceof HTMLSelectElement
        ? false
        : element.readOnly;

      updateFormField(formId, element.name, {
        value,
        type: element.type || element.tagName.toLowerCase(),
        placeholder: elemPlaceholder,
        required: element.required,
        disabled: element.disabled,
        readOnly: elemReadOnly,
      });
    };

    const handleChange = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (target.name) {
        syncField(target);
      }
    };

    const handleFocus = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (target.name) {
        touchField(formId, target.name);
      }
    };

    // Initial sync
    const fields = formElement.querySelectorAll('input, textarea, select');
    fields.forEach((field) => {
      syncField(field as any);
    });

    // Add listeners
    formElement.addEventListener('input', handleChange, true);
    formElement.addEventListener('change', handleChange, true);
    formElement.addEventListener('focusin', handleFocus, true);

    return () => {
      formElement.removeEventListener('input', handleChange, true);
      formElement.removeEventListener('change', handleChange, true);
      formElement.removeEventListener('focusin', handleFocus, true);
      unregisterForm(formId);
    };
  }, [formId, formElement, pathname, registerForm, updateFormField, unregisterForm, touchField]);
}