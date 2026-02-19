import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface UserPattern {
  sessionId: string;
  userId?: string;
  patterns: {
    preferredContentTypes: string[];
    typicalChapterCount: number;
    favoriteDifficulty: string;
    commonCategories: string[];
    timeSpentPerStep: Record<number, number>;
    completionRate: number;
    skipPatterns: string[];
    helpRequestFrequency: number;
  };
  adaptations: {
    showAdvancedOptions: boolean;
    skipBasicHelp: boolean;
    autoFillSuggestions: boolean;
    customizeInterface: boolean;
    enableQuickMode: boolean;
  };
}

interface StepSuggestion {
  type: 'auto_fill' | 'skip_optional' | 'show_advanced' | 'simplify' | 'guidance';
  message: string;
  action?: () => void;
  confidence: number;
}

interface CourseFormData {
  preferredContentTypes?: string[];
  chapterCount?: number;
  difficulty?: string;
  courseCategory?: string;
}

interface ProgressiveDisclosureState {
  currentStep: number;
  userExperience: 'beginner' | 'intermediate' | 'expert';
  showAdvancedOptions: boolean;
  simplifiedMode: boolean;
  autoSuggestions: boolean;
  quickMode: boolean;
  adaptiveHelp: boolean;
}

export const useProgressiveCourseCreation = (userId?: string) => {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [userPattern, setUserPattern] = useState<UserPattern | null>(null);
  const [disclosureState, setDisclosureState] = useState<ProgressiveDisclosureState>({
    currentStep: 1,
    userExperience: 'beginner',
    showAdvancedOptions: false,
    simplifiedMode: true,
    autoSuggestions: true,
    quickMode: false,
    adaptiveHelp: true
  });
  const [stepSuggestions, setStepSuggestions] = useState<StepSuggestion[]>([]);
  const [timeSpent, setTimeSpent] = useState<Record<number, number>>({});
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());

  // Adapt interface based on user patterns
  const adaptInterface = useCallback((patterns: UserPattern) => {
    const experience = determineUserExperience(patterns);
    
    setDisclosureState(prev => ({
      ...prev,
      userExperience: experience,
      showAdvancedOptions: experience !== 'beginner',
      simplifiedMode: experience === 'beginner',
      quickMode: patterns.adaptations.enableQuickMode,
      autoSuggestions: patterns.adaptations.autoFillSuggestions
    }));
  }, []);

  // Save patterns to localStorage and optionally to API
  const savePatterns = useCallback(async (patterns: UserPattern) => {
    try {
      // Save to localStorage
      localStorage.setItem(`courseCreationPatterns_${userId || 'anonymous'}`, JSON.stringify(patterns));
      
      // Save to API if user is logged in
      if (userId) {
        await fetch(`/api/user/patterns/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(patterns),
        });
      }
    } catch (error: unknown) {
      logger.error('Failed to save user patterns:', error instanceof Error ? error.message : String(error));
    }
  }, [userId]);

  // Generate contextual suggestions for upcoming steps
  const generateStepSuggestions = useCallback((nextStep: number, _currentFormData?: CourseFormData) => {
    if (!userPattern) return;

    const suggestions: StepSuggestion[] = [];
    
    // Auto-fill suggestions based on patterns
    if (userPattern.adaptations.autoFillSuggestions) {
      switch (nextStep) {
        case 2:
          if (userPattern.patterns.typicalChapterCount > 0) {
            suggestions.push({
              type: 'auto_fill',
              message: `Based on your previous courses, would you like ${userPattern.patterns.typicalChapterCount} chapters?`,
              confidence: 0.8,
              action: () => {
                // Auto-fill chapter count
              }
            });
          }
          break;
          
        case 3:
          if (userPattern.patterns.preferredContentTypes.length > 0) {
            suggestions.push({
              type: 'auto_fill',
              message: `Auto-select your usual content types: ${userPattern.patterns.preferredContentTypes.join(', ')}?`,
              confidence: 0.9,
              action: () => {
                // Auto-select content types
              }
            });
          }
          break;
          
        case 4:
          if (userPattern.patterns.favoriteDifficulty) {
            suggestions.push({
              type: 'auto_fill',
              message: `Set difficulty to ${userPattern.patterns.favoriteDifficulty} (your usual choice)?`,
              confidence: 0.7
            });
          }
          break;
      }
    }

    // Show advanced options for experienced users
    if (disclosureState.userExperience !== 'beginner' && !disclosureState.showAdvancedOptions) {
      suggestions.push({
        type: 'show_advanced',
        message: 'Show advanced options for more customization?',
        confidence: 0.6,
        action: () => {
          setDisclosureState(prev => ({ ...prev, showAdvancedOptions: true }));
        }
      });
    }

    // Simplify for beginners who seem overwhelmed
    if (disclosureState.userExperience === 'beginner' && userPattern.patterns.helpRequestFrequency > 3) {
      suggestions.push({
        type: 'simplify',
        message: 'Would you like to use simplified mode with fewer options?',
        confidence: 0.8,
        action: () => {
          setDisclosureState(prev => ({ ...prev, simplifiedMode: true, showAdvancedOptions: false }));
        }
      });
    }

    // Quick mode for experienced users
    if (disclosureState.userExperience === 'expert' && !disclosureState.quickMode) {
      const avgTime = Object.values(userPattern.patterns.timeSpentPerStep).reduce((a, b) => a + b, 0) / Object.keys(userPattern.patterns.timeSpentPerStep).length;
      if (avgTime < 45000) { // Less than 45 seconds per step
        suggestions.push({
          type: 'guidance',
          message: 'Enable quick mode for faster course creation?',
          confidence: 0.9,
          action: () => {
            setDisclosureState(prev => ({ ...prev, quickMode: true }));
          }
        });
      }
    }

    setStepSuggestions(suggestions);
  }, [userPattern, disclosureState]);

  // Initialize user patterns from localStorage or API
  useEffect(() => {
    const initializePatterns = async () => {
      try {
        // Try to load from localStorage first
        const savedPatterns = localStorage.getItem(`courseCreationPatterns_${userId || 'anonymous'}`);
        if (savedPatterns) {
          const patterns = JSON.parse(savedPatterns);
          setUserPattern(patterns);
          adaptInterface(patterns);
        } else if (userId) {
          // Load from API if user is logged in
          const response = await fetch(`/api/user/patterns/${userId}`);
          if (response.ok) {
            const patterns = await response.json();
            setUserPattern(patterns);
            adaptInterface(patterns);
          }
        }
      } catch (error: unknown) {
        logger.error('Failed to initialize user patterns:', error instanceof Error ? error.message : String(error));
      }
    };

    initializePatterns();
  }, [userId, adaptInterface]);

  // Determine user experience level
  const determineUserExperience = (patterns: UserPattern): 'beginner' | 'intermediate' | 'expert' => {
    const indicators = {
      coursesCreated: patterns.patterns.completionRate > 0.8 ? 2 : patterns.patterns.completionRate > 0.5 ? 1 : 0,
      avgTimePerStep: Object.values(patterns.patterns.timeSpentPerStep).reduce((avg, time, _, arr) => avg + time / arr.length, 0),
      helpRequests: patterns.patterns.helpRequestFrequency,
      advancedFeatureUsage: patterns.adaptations.showAdvancedOptions ? 1 : 0
    };

    const score = indicators.coursesCreated * 3 + 
                  (indicators.avgTimePerStep < 60 ? 2 : indicators.avgTimePerStep < 120 ? 1 : 0) +
                  (indicators.helpRequests < 2 ? 2 : indicators.helpRequests < 5 ? 1 : 0) +
                  indicators.advancedFeatureUsage;

    if (score >= 7) return 'expert';
    if (score >= 4) return 'intermediate';
    return 'beginner';
  };

  // Track step completion and time
  const completeStep = useCallback((step: number, formData?: CourseFormData) => {
    const now = Date.now();
    const timeOnStep = now - stepStartTime;
    
    setTimeSpent(prev => ({
      ...prev,
      [step]: timeOnStep
    }));

    // Update user patterns
    if (userPattern) {
      const updatedPattern = {
        ...userPattern,
        patterns: {
          ...userPattern.patterns,
          timeSpentPerStep: {
            ...userPattern.patterns.timeSpentPerStep,
            [step]: timeOnStep
          }
        }
      };
      
      // Analyze form data for patterns
      if (formData) {
        updatePatternsFromFormData(updatedPattern, formData);
      }
      
      setUserPattern(updatedPattern);
      savePatterns(updatedPattern);
    }

    setStepStartTime(now);
    
    // Generate suggestions for next step
    generateStepSuggestions(step + 1, formData);
  }, [stepStartTime, userPattern, generateStepSuggestions, savePatterns]);

  // Update patterns based on form data
  const updatePatternsFromFormData = (pattern: UserPattern, formData: CourseFormData) => {
    if (formData.preferredContentTypes && formData.preferredContentTypes.length > 0) {
      pattern.patterns.preferredContentTypes = formData.preferredContentTypes;
    }
    
    if (formData.chapterCount) {
      pattern.patterns.typicalChapterCount = formData.chapterCount;
    }
    
    if (formData.difficulty) {
      pattern.patterns.favoriteDifficulty = formData.difficulty;
    }
    
    if (formData.courseCategory) {
      if (!pattern.patterns.commonCategories.includes(formData.courseCategory)) {
        pattern.patterns.commonCategories.push(formData.courseCategory);
      }
    }
  };



  // Manual interface adjustments
  const toggleAdvancedOptions = useCallback(() => {
    setDisclosureState(prev => {
      const newState = { ...prev, showAdvancedOptions: !prev.showAdvancedOptions };
      
      // Update user patterns
      if (userPattern) {
        const updatedPattern = {
          ...userPattern,
          adaptations: {
            ...userPattern.adaptations,
            showAdvancedOptions: newState.showAdvancedOptions
          }
        };
        setUserPattern(updatedPattern);
        savePatterns(updatedPattern);
      }
      
      return newState;
    });
  }, [userPattern, savePatterns]);

  const toggleQuickMode = useCallback(() => {
    setDisclosureState(prev => {
      const newState = { ...prev, quickMode: !prev.quickMode };
      
      if (userPattern) {
        const updatedPattern = {
          ...userPattern,
          adaptations: {
            ...userPattern.adaptations,
            enableQuickMode: newState.quickMode
          }
        };
        setUserPattern(updatedPattern);
        savePatterns(updatedPattern);
      }
      
      return newState;
    });
  }, [userPattern, savePatterns]);

  const dismissSuggestion = useCallback((suggestionIndex: number) => {
    setStepSuggestions(prev => prev.filter((_, index) => index !== suggestionIndex));
  }, []);

  const applySuggestion = useCallback((suggestionIndex: number) => {
    const suggestion = stepSuggestions[suggestionIndex];
    if (suggestion.action) {
      suggestion.action();
    }
    dismissSuggestion(suggestionIndex);
  }, [stepSuggestions, dismissSuggestion]);

  // Get smart defaults based on patterns
  const getSmartDefaults = useCallback((formType: string) => {
    if (!userPattern) return {};
    
    switch (formType) {
      case 'courseStructure':
        return {
          chapterCount: userPattern.patterns.typicalChapterCount || 5,
          difficulty: userPattern.patterns.favoriteDifficulty || 'BEGINNER',
          preferredContentTypes: userPattern.patterns.preferredContentTypes.length > 0 
            ? userPattern.patterns.preferredContentTypes 
            : ['video', 'reading']
        };
      case 'category':
        return {
          suggestedCategories: userPattern.patterns.commonCategories.slice(0, 3)
        };
      default:
        return {};
    }
  }, [userPattern]);

  // Initialize default pattern for new users
  useEffect(() => {
    if (!userPattern) {
      const defaultPattern: UserPattern = {
        sessionId,
        userId,
        patterns: {
          preferredContentTypes: [],
          typicalChapterCount: 0,
          favoriteDifficulty: '',
          commonCategories: [],
          timeSpentPerStep: {},
          completionRate: 0,
          skipPatterns: [],
          helpRequestFrequency: 0
        },
        adaptations: {
          showAdvancedOptions: false,
          skipBasicHelp: false,
          autoFillSuggestions: true,
          customizeInterface: false,
          enableQuickMode: false
        }
      };
      setUserPattern(defaultPattern);
    }
  }, [sessionId, userId, userPattern]);

  return {
    disclosureState,
    stepSuggestions,
    userPattern,
    timeSpent,
    completeStep,
    toggleAdvancedOptions,
    toggleQuickMode,
    dismissSuggestion,
    applySuggestion,
    getSmartDefaults,
    generateStepSuggestions
  };
};