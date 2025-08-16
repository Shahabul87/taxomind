import { useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: {
    type: 'error' | 'warning' | 'suggestion';
    message: string;
    field?: string;
  }[];
  suggestions: {
    type: 'improvement' | 'alternative' | 'enhancement';
    message: string;
    example?: string;
  }[];
  optimizedValue?: string;
}

interface ValidationRequest {
  field: 'courseTitle' | 'courseOverview' | 'targetAudience' | 'learningGoals' | 'courseStructure' | 'bloomsAlignment';
  value: any;
  context: {
    courseCategory?: string;
    courseSubcategory?: string;
    difficulty?: string;
    targetAudience?: string;
    courseIntent?: string;
    otherFields?: Record<string, any>;
  };
}

export interface ValidationState {
  [key: string]: {
    result: ValidationResult | null;
    isValidating: boolean;
    lastValidated: number;
  };
}

export const useSmartValidation = () => {
  const [validationState, setValidationState] = useState<ValidationState>({});
  const [isGlobalValidating, setIsGlobalValidating] = useState(false);
  const validationTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const validateField = useCallback(async (
    request: ValidationRequest,
    debounceMs: number = 1500
  ): Promise<ValidationResult | null> => {
    const fieldKey = `${request.field}_${JSON.stringify(request.value).substring(0, 50)}`;
    
    // Clear existing timer for this field
    if (validationTimers.current[request.field]) {
      clearTimeout(validationTimers.current[request.field]);
    }

    // Set loading state immediately
    setValidationState(prev => ({
      ...prev,
      [request.field]: {
        ...prev[request.field],
        isValidating: true
      }
    }));

    return new Promise((resolve) => {
      validationTimers.current[request.field] = setTimeout(async () => {
        try {
          const response = await fetch('/api/sam/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
          });

          if (!response.ok) {
            throw new Error('Validation request failed');
          }

          const result: ValidationResult = await response.json();
          
          setValidationState(prev => ({
            ...prev,
            [request.field]: {
              result,
              isValidating: false,
              lastValidated: Date.now()
            }
          }));

          resolve(result);
        } catch (error: any) {
          logger.error('Validation error:', error);
          
          // Set a basic "valid" state on error
          const fallbackResult: ValidationResult = {
            isValid: true,
            score: 70,
            issues: [],
            suggestions: []
          };
          
          setValidationState(prev => ({
            ...prev,
            [request.field]: {
              result: fallbackResult,
              isValidating: false,
              lastValidated: Date.now()
            }
          }));

          resolve(fallbackResult);
        }
      }, debounceMs);
    });
  }, []);

  const validateForm = useCallback(async (formData: any): Promise<ValidationState> => {
    setIsGlobalValidating(true);
    
    const validationPromises: Promise<any>[] = [];
    
    // Validate course title
    if (formData.courseTitle) {
      validationPromises.push(
        validateField({
          field: 'courseTitle',
          value: formData.courseTitle,
          context: {
            courseCategory: formData.courseCategory,
            courseSubcategory: formData.courseSubcategory,
            difficulty: formData.difficulty,
            targetAudience: formData.targetAudience,
            courseIntent: formData.courseIntent
          }
        }, 0) // No debounce for form validation
      );
    }

    // Validate course overview
    if (formData.courseShortOverview) {
      validationPromises.push(
        validateField({
          field: 'courseOverview',
          value: formData.courseShortOverview,
          context: {
            courseCategory: formData.courseCategory,
            targetAudience: formData.targetAudience,
            courseIntent: formData.courseIntent,
            difficulty: formData.difficulty
          }
        }, 0)
      );
    }

    // Validate target audience
    if (formData.targetAudience) {
      validationPromises.push(
        validateField({
          field: 'targetAudience',
          value: formData.targetAudience,
          context: {
            courseCategory: formData.courseCategory,
            difficulty: formData.difficulty,
            courseIntent: formData.courseIntent
          }
        }, 0)
      );
    }

    // Validate learning goals
    if (formData.courseGoals && formData.courseGoals.length > 0) {
      validationPromises.push(
        validateField({
          field: 'learningGoals',
          value: formData.courseGoals,
          context: {
            courseCategory: formData.courseCategory,
            difficulty: formData.difficulty,
            targetAudience: formData.targetAudience
          }
        }, 0)
      );
    }

    // Validate course structure
    if (formData.chapterCount && formData.sectionsPerChapter) {
      validationPromises.push(
        validateField({
          field: 'courseStructure',
          value: {
            chapterCount: formData.chapterCount,
            sectionsPerChapter: formData.sectionsPerChapter
          },
          context: {
            difficulty: formData.difficulty,
            courseCategory: formData.courseCategory,
            duration: formData.duration
          }
        }, 0)
      );
    }

    // Validate Bloom's alignment
    if (formData.bloomsFocus && formData.bloomsFocus.length > 0) {
      validationPromises.push(
        validateField({
          field: 'bloomsAlignment',
          value: formData.bloomsFocus,
          context: {
            difficulty: formData.difficulty,
            courseCategory: formData.courseCategory,
            courseIntent: formData.courseIntent
          }
        }, 0)
      );
    }

    await Promise.all(validationPromises);
    setIsGlobalValidating(false);
    
    return validationState;
  }, [validateField, validationState]);

  const clearValidation = useCallback((field?: string) => {
    if (field) {
      setValidationState(prev => {
        const newState = { ...prev };
        delete newState[field];
        return newState;
      });
      
      if (validationTimers.current[field]) {
        clearTimeout(validationTimers.current[field]);
        delete validationTimers.current[field];
      }
    } else {
      setValidationState({});
      Object.values(validationTimers.current).forEach(timer => clearTimeout(timer));
      validationTimers.current = {};
    }
  }, []);

  const getFieldValidation = useCallback((field: string) => {
    return validationState[field] || null;
  }, [validationState]);

  const getOverallScore = useCallback(() => {
    const validatedFields = Object.values(validationState).filter(
      state => state.result && !state.isValidating
    );
    
    if (validatedFields.length === 0) return 0;
    
    const totalScore = validatedFields.reduce(
      (sum, state) => sum + (state.result?.score || 0), 
      0
    );
    
    return Math.round(totalScore / validatedFields.length);
  }, [validationState]);

  const hasErrors = useCallback(() => {
    return Object.values(validationState).some(
      state => state.result && !state.result.isValid
    );
  }, [validationState]);

  const getAllIssues = useCallback(() => {
    const allIssues: ValidationResult['issues'] = [];
    
    Object.values(validationState).forEach(state => {
      if (state.result?.issues) {
        allIssues.push(...state.result.issues);
      }
    });
    
    return allIssues;
  }, [validationState]);

  const getAllSuggestions = useCallback(() => {
    const allSuggestions: ValidationResult['suggestions'] = [];
    
    Object.values(validationState).forEach(state => {
      if (state.result?.suggestions) {
        allSuggestions.push(...state.result.suggestions);
      }
    });
    
    return allSuggestions;
  }, [validationState]);

  return {
    validationState,
    isGlobalValidating,
    validateField,
    validateForm,
    clearValidation,
    getFieldValidation,
    getOverallScore,
    hasErrors,
    getAllIssues,
    getAllSuggestions
  };
};