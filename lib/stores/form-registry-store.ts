/**
 * Global Form Registry Store
 *
 * This store enables SAM AI Assistant to have 100% context awareness
 * of all form data in real-time by creating a bridge between React
 * form state and the SAM assistant.
 *
 * Features:
 * - Real-time form state synchronization
 * - Support for all form libraries (React Hook Form, Formik, etc.)
 * - Type-safe form field tracking
 * - Performance optimized with event-driven updates
 */

import { create, StateCreator } from 'zustand';
import { logger } from '@/lib/logger';

export interface FormField {
  name: string;
  value: any;
  type: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  errors?: string[];
  touched?: boolean;
  dirty?: boolean;
}

export interface FormState {
  formId: string;
  formName?: string;
  fields: Record<string, FormField>;
  isDirty: boolean;
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string[]>;
  touchedFields: Set<string>;
  lastUpdated: Date;
  metadata?: {
    purpose?: string;
    pageUrl?: string;
    formType?: string;
    [key: string]: any;
  };
}

interface FormRegistryStore {
  // State
  forms: Record<string, FormState>;
  activeFormId: string | null;

  // Form Management
  registerForm: (formId: string, metadata?: FormState['metadata']) => void;
  unregisterForm: (formId: string) => void;
  setActiveForm: (formId: string | null) => void;

  // Field Updates
  updateFormField: (
    formId: string,
    fieldName: string,
    updates: Partial<FormField>
  ) => void;
  updateMultipleFields: (
    formId: string,
    fields: Record<string, Partial<FormField>>
  ) => void;
  setFieldValue: (formId: string, fieldName: string, value: any) => void;
  setFieldError: (formId: string, fieldName: string, error: string | string[]) => void;
  touchField: (formId: string, fieldName: string) => void;

  // Form State
  setFormSubmitting: (formId: string, isSubmitting: boolean) => void;
  setFormValid: (formId: string, isValid: boolean) => void;
  resetForm: (formId: string) => void;

  // Getters
  getFormData: (formId: string) => FormState | undefined;
  getActiveFormData: () => FormState | undefined;
  getAllFormsData: () => Record<string, FormState>;
  getFormValues: (formId: string) => Record<string, any>;
  getFieldValue: (formId: string, fieldName: string) => any;

  // Utilities
  isFormDirty: (formId: string) => boolean;
  hasFormErrors: (formId: string) => boolean;
  getFormErrors: (formId: string) => Record<string, string[]>;

  // Event Handlers for SAM (removed to avoid circular reference)
}

const storeImpl: StateCreator<FormRegistryStore> = (set, get) => ({
  // Initial State
  forms: {},
  activeFormId: null,

  // Form Management
  registerForm: (formId: string, metadata?: FormState['metadata']) => {
    logger.info(`[FormRegistry] Registering form: ${formId}`);

    set((state) => ({
      forms: {
        ...state.forms,
        [formId]: {
          formId,
          formName: metadata?.purpose || formId,
          fields: {},
          isDirty: false,
          isSubmitting: false,
          isValid: true,
          errors: {},
          touchedFields: new Set(),
          lastUpdated: new Date(),
          metadata
        },
      },
      activeFormId: formId // Auto-set as active when registered
    }));
  },

  unregisterForm: (formId: string) => {
    logger.info(`[FormRegistry] Unregistering form: ${formId}`);

    set((state) => {
      const { [formId]: removed, ...rest } = state.forms;
      return {
        forms: rest,
        activeFormId: state.activeFormId === formId ? null : state.activeFormId
      };
    });
  },

  setActiveForm: (formId: string | null) => {
    set({ activeFormId: formId });
  },

  // Field Updates
  updateFormField: (
    formId: string,
    fieldName: string,
    updates: Partial<FormField>
  ) => {
    set((state) => {
      const form = state.forms[formId];
      if (!form) {
        logger.warn(`[FormRegistry] Form ${formId} not found`);
        return state;
      }

      const existingField = form.fields[fieldName] || {
        name: fieldName,
        value: '',
        type: 'text',
      };

      const updatedField = { ...existingField, ...updates };

      // Mark field as dirty if value changed
      const isDirty = updatedField.value !== existingField.value;
      if (isDirty && updatedField.dirty === undefined) {
        updatedField.dirty = true;
      }

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            fields: {
              ...form.fields,
              [fieldName]: updatedField,
            },
            isDirty: isDirty || form.isDirty,
            lastUpdated: new Date(),
          },
        },
      };
    });
  },

  updateMultipleFields: (
    formId: string,
    fields: Record<string, Partial<FormField>>
  ) => {
    Object.entries(fields).forEach(([fieldName, updates]) => {
      get().updateFormField(formId, fieldName, updates);
    });
  },

  setFieldValue: (formId: string, fieldName: string, value: any) => {
    get().updateFormField(formId, fieldName, { value });
  },

  setFieldError: (formId: string, fieldName: string, error: string | string[]) => {
    const errors = Array.isArray(error) ? error : [error];
    get().updateFormField(formId, fieldName, {
      errors: errors.length > 0 ? errors : undefined
    });

    // Update form errors
    set((state) => {
      const form = state.forms[formId];
      if (!form) return state;

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            errors: {
              ...form.errors,
              [fieldName]: errors,
            },
            isValid: errors.length === 0 && !Object.values(form.errors).some(e => e.length > 0),
          },
        },
      };
    });
  },

  touchField: (formId: string, fieldName: string) => {
    set((state) => {
      const form = state.forms[formId];
      if (!form) return state;

      const newTouchedFields = new Set(form.touchedFields);
      newTouchedFields.add(fieldName);

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            touchedFields: newTouchedFields,
          },
        },
      };
    });

    get().updateFormField(formId, fieldName, { touched: true });
  },

  // Form State
  setFormSubmitting: (formId: string, isSubmitting: boolean) => {
    set((state) => {
      const form = state.forms[formId];
      if (!form) return state;

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            isSubmitting,
          },
        },
      };
    });
  },

  setFormValid: (formId: string, isValid: boolean) => {
    set((state) => {
      const form = state.forms[formId];
      if (!form) return state;

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            isValid,
          },
        },
      };
    });
  },

  resetForm: (formId: string) => {
    set((state) => {
      const form = state.forms[formId];
      if (!form) return state;

      // Reset all field values and states
      const resetFields: Record<string, FormField> = {};
      Object.entries(form.fields).forEach(([name, field]) => {
        resetFields[name] = {
          ...field,
          value: '',
          errors: undefined,
          touched: false,
          dirty: false,
        };
      });

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...form,
            fields: resetFields,
            isDirty: false,
            isSubmitting: false,
            isValid: true,
            errors: {},
            touchedFields: new Set(),
            lastUpdated: new Date(),
          },
        },
      };
    });
  },

  // Getters
  getFormData: (formId: string) => get().forms[formId],

  getActiveFormData: () => {
    const { activeFormId, forms } = get();
    return activeFormId ? forms[activeFormId] : undefined;
  },

  getAllFormsData: () => get().forms,

  getFormValues: (formId: string) => {
    const form = get().forms[formId];
    if (!form) return {};

    const values: Record<string, any> = {};
    Object.entries(form.fields).forEach(([name, field]) => {
      values[name] = field.value;
    });
    return values;
  },

  getFieldValue: (formId: string, fieldName: string) => {
    return get().forms[formId]?.fields[fieldName]?.value;
  },

  // Utilities
  isFormDirty: (formId: string) => {
    return get().forms[formId]?.isDirty || false;
  },

  hasFormErrors: (formId: string) => {
    const form = get().forms[formId];
    if (!form) return false;

    return Object.values(form.errors).some(errors => errors.length > 0);
  },

  getFormErrors: (formId: string) => {
    return get().forms[formId]?.errors || {};
  },
});

export const useFormRegistry = create<FormRegistryStore>(storeImpl);

// Debugging helpers for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).formRegistry = {
    getState: () => useFormRegistry.getState(),
    getForms: () => useFormRegistry.getState().getAllFormsData(),
    getForm: (id: string) => useFormRegistry.getState().getFormData(id),
    getValues: (id: string) => useFormRegistry.getState().getFormValues(id),
  };
}