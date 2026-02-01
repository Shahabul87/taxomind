import { useEffect, useState } from 'react';
import {
  detectFormFields,
  generateFormSuggestions,
  executeFormFill,
  type FormFieldInfo,
  type FormFillSuggestion,
} from '@/lib/sam/form-actions';
import { useSAMFormAutoFill } from '@sam-ai/react';
import type { PageContext } from '../types';

interface UseFormDetectionOptions {
  isOpen: boolean;
  pathname?: string | null;
  pageContext: PageContext;
}

interface UseFormDetectionReturn {
  detectedForms: Record<string, FormFieldInfo>;
  formSuggestions: FormFillSuggestion[];
  hasDetectedForms: boolean;
  fillField: (field: string, value: unknown) => boolean;
  executeFormAction: (action: string, payload: Record<string, unknown>) => void;
}

export function useFormDetection(options: UseFormDetectionOptions): UseFormDetectionReturn {
  const { isOpen, pathname, pageContext } = options;

  const [detectedForms, setDetectedForms] = useState<Record<string, FormFieldInfo>>({});
  const [formSuggestions, setFormSuggestions] = useState<FormFillSuggestion[]>([]);

  const { fillField: samFillField } = useSAMFormAutoFill({ triggerEvents: true });

  // Detect forms on the page when SAM opens
  useEffect(() => {
    if (isOpen && typeof document !== 'undefined') {
      const fields = detectFormFields();
      setDetectedForms(fields);

      if (Object.keys(fields).length > 0) {
        const suggestions = generateFormSuggestions(fields, {
          pageType: pageContext.pageType,
          entityId: pageContext.entityId,
        });
        setFormSuggestions(suggestions);
      }
    }
  }, [isOpen, pathname, pageContext.pageType, pageContext.entityId]);

  const fillField = (field: string, value: unknown): boolean => {
    const filled = samFillField(field, value);
    if (!filled) {
      return executeFormFill(field, value);
    }
    return filled;
  };

  const executeFormAction = (action: string, payload: Record<string, unknown>) => {
    const formInteractions = (
      window as unknown as { chapterFormInteractions?: Record<string, (value: unknown) => void> }
    ).chapterFormInteractions;
    const samFormInteractions = (
      window as unknown as { samFormInteractions?: Record<string, (value: unknown) => void> }
    ).samFormInteractions;

    const interactions = samFormInteractions || formInteractions;

    if (interactions) {
      switch (action) {
        case 'update_chapter_title':
        case 'update_title':
          interactions.updateTitle?.(payload.title || payload.value);
          break;
        case 'update_chapter_description':
        case 'update_description':
          interactions.updateDescription?.(payload.value);
          break;
        case 'update_learning_outcomes':
          interactions.updateLearningOutcomes?.(payload.outcomes);
          break;
        case 'create_sections':
          interactions.createSections?.(payload.sections);
          break;
        case 'publish_chapter':
        case 'publish':
          interactions.publish?.(undefined);
          break;
        case 'unpublish_chapter':
        case 'unpublish':
          interactions.unpublish?.(undefined);
          break;
        case 'update_chapter_access':
          interactions.updateAccess?.(payload.isFree);
          break;
        case 'submit':
          interactions.submit?.(undefined);
          break;
      }
    }
  };

  return {
    detectedForms,
    formSuggestions,
    hasDetectedForms: Object.keys(detectedForms).length > 0,
    fillField,
    executeFormAction,
  };
}
