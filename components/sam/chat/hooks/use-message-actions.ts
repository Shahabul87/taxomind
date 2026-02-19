import { useCallback, useState } from 'react';
import type { FormFieldInfo } from '@/lib/sam/form-actions';
import { executeFormFill } from '@/lib/sam/form-actions';

interface UseMessageActionsOptions {
  fillField: (field: string, value: unknown) => boolean;
}

interface UseMessageActionsReturn {
  copiedMessageId: string | null;
  insertedMessageId: string | null;
  handleCopyContent: (messageId: string, content: string) => Promise<void>;
  handleInsertContent: (
    messageId: string,
    content: string,
    targetField?: string
  ) => void;
  isInsertableContent: (content: string, userQuery?: string) => boolean;
  detectTargetField: (
    userQuery: string,
    detectedForms: Record<string, FormFieldInfo>
  ) => string | null;
}

export function useMessageActions(
  options: UseMessageActionsOptions
): UseMessageActionsReturn {
  const { fillField } = options;

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [insertedMessageId, setInsertedMessageId] = useState<string | null>(null);

  const handleCopyContent = useCallback(
    async (messageId: string, content: string) => {
      try {
        await navigator.clipboard.writeText(content);
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
      } catch (err) {
        console.error('[SAM] Failed to copy:', err);
      }
    },
    []
  );

  const handleInsertContent = useCallback(
    (messageId: string, content: string, targetField?: string) => {
      const win = window as Window & typeof globalThis & { samFormInteractions?: Record<string, (...args: unknown[]) => void>; chapterFormInteractions?: Record<string, (...args: unknown[]) => void> };
      const formInteractions = win.samFormInteractions || win.chapterFormInteractions;

      if (formInteractions && targetField) {
        const fieldActions: Record<string, string> = {
          title: 'updateTitle',
          description: 'updateDescription',
          content: 'updateContent',
          whatYouWillLearn: 'updateLearningOutcomes',
          courseGoals: 'updateCourseGoals',
          prerequisites: 'updatePrerequisites',
          subtitle: 'updateSubtitle',
        };

        const actionName = fieldActions[targetField];
        if (actionName && formInteractions[actionName]) {
          formInteractions[actionName](content);
          setInsertedMessageId(messageId);
          setTimeout(() => setInsertedMessageId(null), 2000);
          return;
        }
      }

      // Fallback: try direct DOM insertion
      if (targetField) {
        const success =
          fillField(targetField, content) || executeFormFill(targetField, content);
        if (success) {
          setInsertedMessageId(messageId);
          setTimeout(() => setInsertedMessageId(null), 2000);
          return;
        }
      }

      // If no target field, try to find a suitable textarea/input
      const focusedElement = document.activeElement;
      if (
        focusedElement &&
        (focusedElement.tagName === 'TEXTAREA' ||
          focusedElement.tagName === 'INPUT')
      ) {
        (focusedElement as HTMLInputElement | HTMLTextAreaElement).value =
          content;
        focusedElement.dispatchEvent(new Event('input', { bubbles: true }));
        focusedElement.dispatchEvent(new Event('change', { bubbles: true }));
        setInsertedMessageId(messageId);
        setTimeout(() => setInsertedMessageId(null), 2000);
        return;
      }

      // Last resort: copy to clipboard
      handleCopyContent(messageId, content);
    },
    [fillField, handleCopyContent]
  );

  return {
    copiedMessageId,
    insertedMessageId,
    handleCopyContent,
    handleInsertContent,
    isInsertableContent,
    detectTargetField,
  };
}

// =============================================================================
// Helper functions (moved from SAMAssistant.tsx)
// =============================================================================

function isInsertableContent(content: string, userQuery?: string): boolean {
  if (!content || content.length < 20) return false;

  const conversationalPhrases = [
    'I can help',
    "I'll help",
    'Would you like',
    'Let me know',
    'I apologize',
    'something went wrong',
    'I understand you',
    "Hello! I'm SAM",
    "Hi! I'm SAM",
    'How can I assist',
    'What would you like',
  ];

  const lowerContent = content.toLowerCase();
  const startsWithConversational = conversationalPhrases.some((phrase) =>
    lowerContent.startsWith(phrase.toLowerCase())
  );

  if (startsWithConversational && content.length < 200) return false;

  if (userQuery) {
    const lowerQuery = userQuery.toLowerCase();
    const generationKeywords = [
      'generate',
      'create',
      'write',
      'make',
      'produce',
      'suggest',
      'give me',
      'provide',
      'draft',
      'compose',
      'improve',
      'enhance',
      'rewrite',
      'expand',
      'develop',
    ];
    if (generationKeywords.some((kw) => lowerQuery.includes(kw))) {
      return true;
    }
  }

  return content.length > 100;
}

function detectTargetField(
  userQuery: string,
  detectedForms: Record<string, FormFieldInfo>
): string | null {
  if (!userQuery) return null;

  const lowerQuery = userQuery.toLowerCase();

  const fieldPatterns: Record<string, string[]> = {
    title: ['title', 'heading', 'name'],
    description: ['description', 'desc', 'summary', 'about', 'overview'],
    content: ['content', 'body', 'text', 'material'],
    whatYouWillLearn: [
      'learn',
      'outcomes',
      'objectives',
      'goals',
      'what you will learn',
    ],
    courseGoals: ['goals', 'course goals'],
    prerequisites: ['prerequisites', 'requirements', 'before you start'],
    subtitle: ['subtitle', 'tagline'],
  };

  for (const [fieldName, patterns] of Object.entries(fieldPatterns)) {
    if (patterns.some((pattern) => lowerQuery.includes(pattern))) {
      if (detectedForms[fieldName]) {
        return fieldName;
      }
      const matchedField = Object.keys(detectedForms).find((key) =>
        key.toLowerCase().includes(fieldName.toLowerCase())
      );
      if (matchedField) return matchedField;
      return fieldName;
    }
  }

  return null;
}
