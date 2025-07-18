"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CourseStructurePreview } from "@/components/course-creation/course-structure-preview";
import { StreamingGenerationModal } from "@/components/course-creation/streaming-generation-modal";
import { ContentOptimizer } from "@/components/course-creation/content-optimizer";
import { ProgressiveDisclosurePanel } from "@/components/course-creation/progressive-disclosure-panel";
import { useProgressiveCourseCreation } from "@/hooks/use-progressive-course-creation";
import { trackAIFeatureUsage, trackFormProgress, trackGenerationStart, trackGenerationEnd } from "@/lib/analytics-tracker";
import { 
  Bot, 
  ArrowRight, 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Clock, 
  Target, 
  Lightbulb,
  CheckCircle,
  Sparkles,
  Brain,
  Loader2,
  MessageCircle,
  ThumbsUp,
  AlertTriangle,
  Info,
  Zap,
  Settings,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CourseCreationRequest {
  courseTitle: string;
  courseShortOverview: string; // Changed from courseDescription
  courseCategory: string; // New
  courseSubcategory?: string; // New
  courseIntent: string; // New
  targetAudience: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  chapterCount: number;
  sectionsPerChapter: number;
  courseGoals: string[];
  includeAssessments: boolean;
  bloomsFocus: string[];
  preferredContentTypes: string[];
  // Rich context fields for Sam's knowledge enrichment
  studentBackground: string;
  prerequisites: string[];
  realWorldApplications: string[];
  careerOutcomes: string[];
  industryContext: string;
  toolsAndTechnologies: string[];
  commonChallenges: string[];
  successMetrics: string[];
}

interface SamCourseCreatorModalProps {
  open: boolean;
  onClose: () => void;
  onCourseGenerated?: (courseData: any) => void;
}

interface SamSuggestion {
  message: string;
  type: 'encouragement' | 'suggestion' | 'validation' | 'warning' | 'tip';
  actionable: boolean;
  confidence: number;
  action?: () => void;
  autoApplyable?: boolean;
}

const DIFFICULTY_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner', description: 'No prior experience required' },
  { value: 'INTERMEDIATE', label: 'Intermediate', description: 'Some basic knowledge expected' },
  { value: 'ADVANCED', label: 'Advanced', description: 'Comprehensive background needed' }
];

const DURATION_OPTIONS = [
  '2-3 weeks', '4-6 weeks', '2-3 months', '6 months', '1 year'
];

const BLOOMS_LEVELS = [
  { value: 'REMEMBER', label: 'Remember', description: 'Recall facts and basic concepts' },
  { value: 'UNDERSTAND', label: 'Understand', description: 'Explain ideas and concepts' },
  { value: 'APPLY', label: 'Apply', description: 'Use information in new situations' },
  { value: 'ANALYZE', label: 'Analyze', description: 'Draw connections among ideas' },
  { value: 'EVALUATE', label: 'Evaluate', description: 'Justify decisions and actions' },
  { value: 'CREATE', label: 'Create', description: 'Produce new or original work' }
];

const COURSE_CATEGORIES = [
  {
    value: 'technology',
    label: 'Technology',
    subcategories: ['Web Development', 'Mobile Development', 'Data Science', 'AI/Machine Learning', 'DevOps', 'Cybersecurity']
  },
  {
    value: 'business',
    label: 'Business',
    subcategories: ['Marketing', 'Sales', 'Management', 'Finance', 'Entrepreneurship', 'Project Management']
  },
  {
    value: 'creative',
    label: 'Creative',
    subcategories: ['Graphic Design', 'Photography', 'Writing', 'Video Production', 'UI/UX Design', 'Art']
  },
  {
    value: 'personal',
    label: 'Personal Development',
    subcategories: ['Productivity', 'Leadership', 'Communication', 'Time Management', 'Career Development']
  },
  {
    value: 'health',
    label: 'Health & Wellness',
    subcategories: ['Fitness', 'Nutrition', 'Mental Health', 'Yoga', 'Meditation']
  },
  {
    value: 'education',
    label: 'Education & Teaching',
    subcategories: ['K-12 Education', 'Higher Education', 'Corporate Training', 'Online Teaching']
  }
];

const COURSE_INTENTS = [
  { value: 'skill-development', label: '🎯 Skill Development', description: 'Learn practical, hands-on skills' },
  { value: 'certification-prep', label: '📜 Certification Prep', description: 'Prepare for industry certifications' },
  { value: 'career-change', label: '🚀 Career Change', description: 'Transition to a new field' },
  { value: 'professional-growth', label: '📈 Professional Growth', description: 'Advance in current career' },
  { value: 'project-based', label: '🛠️ Project-Based', description: 'Build specific projects/portfolio' },
  { value: 'academic', label: '🔬 Academic Learning', description: 'Comprehensive theoretical knowledge' }
];

const TARGET_AUDIENCES = [
  'Complete beginners with no experience',
  'Professionals looking to upskill',
  'Students/graduates entering the field',
  'Experienced practitioners wanting specialization',
  'Career changers from other industries',
  'Custom (describe below)'
];

const CONTENT_TYPES = [
  { value: 'video', label: 'Video Lectures', icon: '🎥' },
  { value: 'reading', label: 'Reading Materials', icon: '📚' },
  { value: 'interactive', label: 'Interactive Exercises', icon: '💡' },
  { value: 'assessments', label: 'Quizzes & Tests', icon: '✅' },
  { value: 'projects', label: 'Hands-on Projects', icon: '🛠️' },
  { value: 'discussions', label: 'Discussion Forums', icon: '💬' }
];

export const SamCourseCreatorModal = ({ 
  open, 
  onClose, 
  onCourseGenerated 
}: SamCourseCreatorModalProps) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<CourseCreationRequest>({
    courseTitle: '',
    courseShortOverview: '',
    courseCategory: '',
    courseSubcategory: '',
    courseIntent: '',
    targetAudience: '',
    difficulty: 'BEGINNER',
    duration: '4-6 weeks',
    chapterCount: 5,
    sectionsPerChapter: 3,
    courseGoals: [],
    includeAssessments: true,
    bloomsFocus: ['UNDERSTAND', 'APPLY'],
    preferredContentTypes: ['video', 'reading', 'assessments'],
    // Rich context fields initialization
    studentBackground: '',
    prerequisites: [],
    realWorldApplications: [],
    careerOutcomes: [],
    industryContext: '',
    toolsAndTechnologies: [],
    commonChallenges: [],
    successMetrics: []
  });
  const [customAudience, setCustomAudience] = useState('');
  const [currentGoal, setCurrentGoal] = useState('');
  
  // Rich context input states
  const [currentPrerequisite, setCurrentPrerequisite] = useState('');
  const [currentApplication, setCurrentApplication] = useState('');
  const [currentOutcome, setCurrentOutcome] = useState('');
  const [currentTool, setCurrentTool] = useState('');
  const [currentChallenge, setCurrentChallenge] = useState('');
  const [currentMetric, setCurrentMetric] = useState('');
  
  // Enhanced AI state
  const [samSuggestion, setSamSuggestion] = useState<SamSuggestion | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [samGreeting, setSamGreeting] = useState('');
  const [showStreamingModal, setShowStreamingModal] = useState(false);
  const [showContentOptimizer, setShowContentOptimizer] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [overviewSuggestions, setOverviewSuggestions] = useState<string[]>([]);
  const [isLoadingTitleSuggestions, setIsLoadingTitleSuggestions] = useState(false);
  const [isLoadingOverviewSuggestions, setIsLoadingOverviewSuggestions] = useState(false);
  
  // Ref to track suggestion state and prevent infinite loops
  const lastSuggestionRef = useRef<string>('');
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const formDataRef = useRef(formData);
  
  // Progressive disclosure
  const {
    disclosureState,
    stepSuggestions,
    timeSpent,
    completeStep,
    toggleAdvancedOptions,
    toggleQuickMode,
    dismissSuggestion,
    applySuggestion,
    getSmartDefaults
  } = useProgressiveCourseCreation();

  const totalSteps = 5; // Increased to include rich context step
  
  // Update formDataRef when formData changes
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Calculate course score
  const calculateCourseScore = useCallback(() => {
    let score = 0;
    let maxScore = 100;
    
    // Title quality (15 points)
    if (formData.courseTitle.length > 10) score += 15;
    else if (formData.courseTitle.length > 5) score += 10;
    else if (formData.courseTitle.length > 0) score += 5;
    
    // Overview quality (20 points)
    if (formData.courseShortOverview.length > 100) score += 20;
    else if (formData.courseShortOverview.length > 50) score += 15;
    else if (formData.courseShortOverview.length > 20) score += 10;
    else if (formData.courseShortOverview.length > 0) score += 5;
    
    // Category selection (10 points)
    if (formData.courseCategory) score += 10;
    
    // Intent clarity (10 points)
    if (formData.courseIntent) score += 10;
    
    // Target audience (10 points)
    if (formData.targetAudience) score += 10;
    
    // Learning objectives (15 points)
    if (formData.courseGoals.length >= 3) score += 15;
    else if (formData.courseGoals.length >= 2) score += 10;
    else if (formData.courseGoals.length >= 1) score += 5;
    
    // Bloom's taxonomy (10 points)
    if (formData.bloomsFocus.length >= 2) score += 10;
    else if (formData.bloomsFocus.length >= 1) score += 5;
    
    // Content types (5 points)
    if (formData.preferredContentTypes.length >= 2) score += 5;
    
    // Rich context (5 points)
    if (formData.studentBackground || formData.prerequisites.length > 0 || 
        formData.realWorldApplications.length > 0 || formData.industryContext) {
      score += 5;
    }
    
    return Math.min(score, maxScore);
  }, [formData]);

  const courseScore = calculateCourseScore();
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };
  
  // Enhanced AI functions
  const applySamSuggestion = useCallback((suggestion: SamSuggestion) => {
    // Example auto-apply logic - extend based on suggestion types
    if (suggestion.type === 'suggestion' && suggestion.autoApplyable) {
      // Apply smart defaults
      const defaults = getSmartDefaults('courseStructure');
      setFormData(prev => ({ 
        ...prev, 
        ...defaults,
        difficulty: defaults.difficulty as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' || prev.difficulty
      }));
      
      setSamSuggestion({
        ...suggestion,
        type: 'validation',
        message: "I've applied some smart defaults based on your course type!"
      });
    }
  }, [getSmartDefaults]);

  const getSamSuggestion = useCallback(async (context: string) => {
    if (isLoadingSuggestion) return;
    
    // Use current form data from ref
    const currentFormData = formDataRef.current;
    
    // Create a unique key for this suggestion request
    const suggestionKey = `${context}-${step}-${currentFormData.courseTitle}-${currentFormData.courseShortOverview}`;
    
    // Prevent duplicate requests
    if (lastSuggestionRef.current === suggestionKey) {
      return;
    }
    
    lastSuggestionRef.current = suggestionKey;
    setIsLoadingSuggestion(true);
    
    try {
      trackAIFeatureUsage('sam_suggestions', { context, step });
      
      const response = await fetch('/api/sam/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context,
          userInput: currentFormData,
          step,
          userExperience: disclosureState.userExperience
        }),
      });

      if (response.ok) {
        const suggestion = await response.json();
        setSamSuggestion({
          ...suggestion,
          action: suggestion.autoApplyable ? () => applySamSuggestion(suggestion) : undefined
        });
      }
    } catch (error) {
      console.error('Error getting Sam suggestion:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, [step, disclosureState.userExperience, applySamSuggestion, isLoadingSuggestion]);

  const validateForm = useCallback(async () => {
    if (isValidating) return;
    
    setIsValidating(true);
    try {
      const response = await fetch('/api/sam/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: formDataRef.current,
          step,
          userExperience: disclosureState.userExperience
        }),
      });

      if (response.ok) {
        const validation = await response.json();
        setValidationErrors(validation.errors || {});
        
        // Show validation suggestions as Sam messages
        if (validation.suggestions?.length > 0) {
          setSamSuggestion(validation.suggestions[0]);
        }
      }
    } catch (error) {
      console.error('Error validating form:', error);
    } finally {
      setIsValidating(false);
    }
  }, [step, disclosureState.userExperience, isValidating]);

  // Generate title suggestions
  const generateTitleSuggestions = useCallback(async (currentTitle: string) => {
    if (!currentTitle || currentTitle.length < 3 || isLoadingTitleSuggestions) return;
    
    setIsLoadingTitleSuggestions(true);
    try {
      const response = await fetch('/api/sam/title-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentTitle,
          category: formData.courseCategory,
          intent: formData.courseIntent,
          difficulty: formData.difficulty,
          targetAudience: formData.targetAudience
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTitleSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error generating title suggestions:', error);
    } finally {
      setIsLoadingTitleSuggestions(false);
    }
  }, [formData.courseCategory, formData.courseIntent, formData.difficulty, formData.targetAudience, isLoadingTitleSuggestions]);

  // Generate overview suggestions
  const generateOverviewSuggestions = useCallback(async (currentTitle: string) => {
    if (!currentTitle || currentTitle.length < 3 || isLoadingOverviewSuggestions) return;
    
    setIsLoadingOverviewSuggestions(true);
    try {
      const response = await fetch('/api/sam/overview-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: currentTitle,
          category: formData.courseCategory,
          intent: formData.courseIntent,
          difficulty: formData.difficulty,
          targetAudience: formData.targetAudience,
          currentOverview: formData.courseShortOverview
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOverviewSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error generating overview suggestions:', error);
    } finally {
      setIsLoadingOverviewSuggestions(false);
    }
  }, [formData.courseCategory, formData.courseIntent, formData.difficulty, formData.targetAudience, formData.courseShortOverview, isLoadingOverviewSuggestions]);

  // Debounced title suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.courseTitle && formData.courseTitle.length >= 5) {
        generateTitleSuggestions(formData.courseTitle);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [formData.courseTitle, generateTitleSuggestions]);

  // Debounced overview suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.courseTitle && formData.courseTitle.length >= 5) {
        generateOverviewSuggestions(formData.courseTitle);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [formData.courseTitle, generateOverviewSuggestions]);

  
  // Initialize Sam greeting
  useEffect(() => {
    if (open && !samGreeting) {
      const greetings = [
        "Hi there! I'm Sam, your AI Teaching Assistant. Let's create an amazing course together! 🎓",
        "Hello! I'm Sam, and I'm excited to help you build a fantastic learning experience! ✨",
        "Welcome! I'm Sam, your AI course creation partner. Ready to make something incredible? 🚀"
      ];
      setSamGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
    }
  }, [open, samGreeting]);
  
  // Trigger contextual suggestions based on form changes
  useEffect(() => {
    // Clear previous timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    
    suggestionTimeoutRef.current = setTimeout(() => {
      if (isLoadingSuggestion) return; // Prevent multiple requests
      
      const currentFormData = formDataRef.current;
      
      if (step === 1 && currentFormData.courseTitle && currentFormData.courseTitle.length > 5) {
        getSamSuggestion('title_analysis');
      } else if (step === 1 && currentFormData.courseShortOverview && currentFormData.courseShortOverview.length > 50) {
        getSamSuggestion('overview_feedback');
      } else if (step === 2 && currentFormData.targetAudience && currentFormData.difficulty) {
        getSamSuggestion('audience_alignment');
      } else if (step === 4 && currentFormData.bloomsFocus.length > 0) {
        getSamSuggestion('bloom_taxonomy_help');
      } else if (step === 5 && (currentFormData.studentBackground || currentFormData.prerequisites.length > 0)) {
        getSamSuggestion('context_enrichment');
      }
    }, 2000); // Increased debounce time to prevent rapid requests
    
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, [formData.courseTitle, formData.courseShortOverview, formData.targetAudience, formData.difficulty, formData.bloomsFocus, formData.studentBackground, formData.prerequisites, step, isLoadingSuggestion, getSamSuggestion]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!open) {
      // Reset suggestion state
      lastSuggestionRef.current = '';
      setSamSuggestion(null);
      setIsLoadingSuggestion(false);
      
      // Clear any pending timeouts
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
        suggestionTimeoutRef.current = null;
      }
    }
  }, [open]);

  const handleNext = () => {
    if (step < totalSteps) {
      // Track step completion
      completeStep(step, formDataRef.current);
      trackFormProgress(`step_${step}`, totalSteps, step);
      
      setStep(step + 1);
      // Clear previous suggestion when moving to next step
      setSamSuggestion(null);
      setValidationErrors({});
      
      // Get encouragement for the new step
      setTimeout(() => getSamSuggestion('general_encouragement'), 500);
      
      // Auto-validate new step if needed
      setTimeout(() => validateForm(), 1000);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const addGoal = () => {
    if (currentGoal.trim() && formData.courseGoals.length < 5) {
      setFormData(prev => ({
        ...prev,
        courseGoals: [...prev.courseGoals, currentGoal.trim()]
      }));
      setCurrentGoal('');
    }
  };

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      courseGoals: prev.courseGoals.filter((_, i) => i !== index)
    }));
  };

  // Rich context management functions
  const addPrerequisite = () => {
    if (currentPrerequisite.trim() && formData.prerequisites.length < 8) {
      setFormData(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, currentPrerequisite.trim()]
      }));
      setCurrentPrerequisite('');
    }
  };

  const removePrerequisite = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index)
    }));
  };

  const addApplication = () => {
    if (currentApplication.trim() && formData.realWorldApplications.length < 6) {
      setFormData(prev => ({
        ...prev,
        realWorldApplications: [...prev.realWorldApplications, currentApplication.trim()]
      }));
      setCurrentApplication('');
    }
  };

  const removeApplication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      realWorldApplications: prev.realWorldApplications.filter((_, i) => i !== index)
    }));
  };

  const addOutcome = () => {
    if (currentOutcome.trim() && formData.careerOutcomes.length < 6) {
      setFormData(prev => ({
        ...prev,
        careerOutcomes: [...prev.careerOutcomes, currentOutcome.trim()]
      }));
      setCurrentOutcome('');
    }
  };

  const removeOutcome = (index: number) => {
    setFormData(prev => ({
      ...prev,
      careerOutcomes: prev.careerOutcomes.filter((_, i) => i !== index)
    }));
  };

  const addTool = () => {
    if (currentTool.trim() && formData.toolsAndTechnologies.length < 10) {
      setFormData(prev => ({
        ...prev,
        toolsAndTechnologies: [...prev.toolsAndTechnologies, currentTool.trim()]
      }));
      setCurrentTool('');
    }
  };

  const removeTool = (index: number) => {
    setFormData(prev => ({
      ...prev,
      toolsAndTechnologies: prev.toolsAndTechnologies.filter((_, i) => i !== index)
    }));
  };

  const addChallenge = () => {
    if (currentChallenge.trim() && formData.commonChallenges.length < 6) {
      setFormData(prev => ({
        ...prev,
        commonChallenges: [...prev.commonChallenges, currentChallenge.trim()]
      }));
      setCurrentChallenge('');
    }
  };

  const removeChallenge = (index: number) => {
    setFormData(prev => ({
      ...prev,
      commonChallenges: prev.commonChallenges.filter((_, i) => i !== index)
    }));
  };

  const addMetric = () => {
    if (currentMetric.trim() && formData.successMetrics.length < 5) {
      setFormData(prev => ({
        ...prev,
        successMetrics: [...prev.successMetrics, currentMetric.trim()]
      }));
      setCurrentMetric('');
    }
  };

  const removeMetric = (index: number) => {
    setFormData(prev => ({
      ...prev,
      successMetrics: prev.successMetrics.filter((_, i) => i !== index)
    }));
  };

  const toggleBloomsLevel = (level: string) => {
    setFormData(prev => ({
      ...prev,
      bloomsFocus: prev.bloomsFocus.includes(level)
        ? prev.bloomsFocus.filter(l => l !== level)
        : [...prev.bloomsFocus, level]
    }));
  };

  const toggleContentType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      preferredContentTypes: prev.preferredContentTypes.includes(type)
        ? prev.preferredContentTypes.filter(t => t !== type)
        : [...prev.preferredContentTypes, type]
    }));
  };

  const generateCourse = async () => {
    // Use streaming generation for better UX
    const courseRequirements = {
      ...formData,
      // Use custom audience if selected
      targetAudience: formData.targetAudience === 'Custom (describe below)' ? customAudience : formData.targetAudience,
      // Convert short overview to description for now - will be enhanced by AI later
      courseDescription: formData.courseShortOverview
    };

    // Track generation start
    const genId = trackGenerationStart('blueprint', {
      inputComplexity: formData.chapterCount > 8 ? 'high' : formData.chapterCount > 5 ? 'medium' : 'low',
      inputData: courseRequirements
    });
    setGenerationId(genId);

    // Show streaming modal
    setShowStreamingModal(true);
    trackAIFeatureUsage('streaming_generation');
  };

  const handleStreamingComplete = (blueprint: any) => {
    setShowStreamingModal(false);
    
    if (generationId) {
      trackGenerationEnd(generationId, {
        success: true,
        duration: Date.now(),
        outputQuality: 85, // Could be calculated based on blueprint completeness
        outputSize: JSON.stringify(blueprint).length
      });
    }

    toast.success("Course blueprint generated successfully!");
    onCourseGenerated?.(blueprint);
    onClose();
  };

  const handleStreamingError = () => {
    setShowStreamingModal(false);
    
    if (generationId) {
      trackGenerationEnd(generationId, {
        success: false,
        duration: Date.now(),
        errorType: 'generation_failed'
      });
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.courseTitle.trim().length > 0 &&
               formData.courseShortOverview.trim().length >= 50 &&
               formData.courseCategory &&
               formData.courseIntent &&
               formData.targetAudience;
      case 2:
        return formData.targetAudience.trim();
      case 3:
        return formData.courseGoals.length > 0;
      case 4:
        return formData.bloomsFocus.length > 0 && formData.preferredContentTypes.length > 0;
      case 5:
        // Rich context step - optional but encourage at least some information
        return formData.studentBackground.trim().length > 0 ||
               formData.prerequisites.length > 0 ||
               formData.realWorldApplications.length > 0 ||
               formData.industryContext.trim().length > 0;
      default:
        return false;
    }
  };

  const getOverviewPlaceholder = (category: string) => {
    switch(category) {
      case 'technology':
        return "Describe the tech stack, what students will build, problems they'll solve, and career outcomes they can expect...";
      case 'business':
        return "Explain business challenges this course solves, skills students will gain, and real-world applications...";
      case 'creative':
        return "Detail creative techniques taught, portfolio pieces students will create, and artistic growth they'll achieve...";
      case 'personal':
        return "Describe personal growth outcomes, skills for better life/career, and transformation students will experience...";
      case 'health':
        return "Explain health improvements, lifestyle changes, and wellness goals students will achieve...";
      case 'education':
        return "Detail teaching methods, educational outcomes, and how this will improve students' teaching abilities...";
      default:
        return "Briefly describe what students will learn, what problem this course solves, and the main outcome they'll achieve...";
    }
  };

  const getSelectedCategory = () => {
    return COURSE_CATEGORIES.find(cat => cat.value === formData.courseCategory);
  };
  
  // Enhanced Sam Suggestion Component
  const SamSuggestionBox = () => {
    if (!samSuggestion && !isLoadingSuggestion) return null;
    
    const getSuggestionIcon = (type: string) => {
      switch (type) {
        case 'encouragement': return <ThumbsUp className="h-4 w-4" />;
        case 'suggestion': return <Lightbulb className="h-4 w-4" />;
        case 'validation': return <CheckCircle className="h-4 w-4" />;
        case 'warning': return <AlertTriangle className="h-4 w-4" />;
        case 'tip': return <Info className="h-4 w-4" />;
        default: return <MessageCircle className="h-4 w-4" />;
      }
    };
    
    const getSuggestionColor = (type: string) => {
      switch (type) {
        case 'encouragement': return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/10 dark:border-green-800 dark:text-green-300';
        case 'suggestion': return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-300';
        case 'validation': return 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/10 dark:border-emerald-800 dark:text-emerald-300';
        case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/10 dark:border-amber-800 dark:text-amber-300';
        case 'tip': return 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/10 dark:border-purple-800 dark:text-purple-300';
        default: return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/10 dark:border-gray-800 dark:text-gray-300';
      }
    };
    
    return (
      <Alert className={cn(
        "mb-6 transition-all duration-300",
        samSuggestion ? getSuggestionColor(samSuggestion.type) : "bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/10 dark:border-purple-800 dark:text-purple-300"
      )}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-1.5 rounded-full bg-white/50 dark:bg-black/20">
            {isLoadingSuggestion ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : samSuggestion ? (
              getSuggestionIcon(samSuggestion.type)
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Sam</span>
                {samSuggestion?.confidence && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {Math.round(samSuggestion.confidence * 100)}% confident
                  </Badge>
                )}
                {isValidating && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Checking...
                  </Badge>
                )}
              </div>
              {samSuggestion?.action && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={samSuggestion.action}
                  className="h-6 px-2 text-xs"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Apply
                </Button>
              )}
            </div>
            <AlertDescription className="text-sm leading-relaxed">
              {isLoadingSuggestion ? "Let me think about this..." : samSuggestion?.message}
            </AlertDescription>
            
            {/* Show validation errors */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="mt-2 text-xs space-y-1">
                {Object.entries(validationErrors).map(([field, error]) => (
                  <div key={field} className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{field}: {error}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Alert>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Bot className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <span className="text-xl font-semibold">AI Course Creator with Sam</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                  {samGreeting || "Let me help you create an amazing course structure"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStep(1);
                setFormData({
                  courseTitle: '',
                  courseShortOverview: '',
                  courseCategory: '',
                  courseSubcategory: '',
                  courseIntent: '',
                  targetAudience: '',
                  difficulty: 'BEGINNER',
                  duration: '4-6 weeks',
                  chapterCount: 5,
                  sectionsPerChapter: 3,
                  courseGoals: [],
                  includeAssessments: true,
                  bloomsFocus: ['UNDERSTAND', 'APPLY'],
                  preferredContentTypes: ['video', 'reading', 'assessments'],
                  studentBackground: '',
                  prerequisites: [],
                  realWorldApplications: [],
                  careerOutcomes: [],
                  industryContext: '',
                  toolsAndTechnologies: [],
                  commonChallenges: [],
                  successMetrics: []
                });
                setCustomAudience('');
                setCurrentGoal('');
                setCurrentPrerequisite('');
                setCurrentApplication('');
                setCurrentOutcome('');
                setCurrentTool('');
                setCurrentChallenge('');
                setCurrentMetric('');
                setSamSuggestion(null);
                setValidationErrors({});
              }}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Start Over
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* Sam's contextual suggestions */}
          <SamSuggestionBox />

          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  stepNumber === step 
                    ? "bg-purple-600 text-white" 
                    : stepNumber < step 
                      ? "bg-green-500 text-white" 
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                )}>
                  {stepNumber < step ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 5 && (
                  <div className={cn(
                    "w-12 h-0.5 mx-2 transition-colors",
                    stepNumber < step ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Course Score Visual Interface */}
          <div className={cn(
            "mb-4 p-4 rounded-lg border-2 transition-all duration-300",
            getScoreColor(courseScore)
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white/50">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Course Quality Score</h3>
                  <p className="text-xs opacity-80">Based on completeness and quality</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{courseScore}/100</div>
                <div className="text-sm font-medium">{getScoreLabel(courseScore)}</div>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="w-full bg-white/30 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500 bg-current"
                  style={{ width: `${courseScore}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1 opacity-70">
                <span>Incomplete</span>
                <span>Ready to Generate</span>
              </div>
            </div>
          </div>

          {/* Enhanced Features Bar */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Settings className="h-4 w-4" />
              <span>Advanced AI Features:</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowContentOptimizer(true);
                  trackAIFeatureUsage('content_optimizer');
                }}
                disabled={!formData.courseTitle || !formData.courseShortOverview}
                className="text-xs"
                data-ai-feature="content_optimizer"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Optimize Content
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  validateForm();
                  trackAIFeatureUsage('smart_validation');
                }}
                disabled={isValidating}
                className="text-xs"
                data-ai-feature="smart_validation"
              >
                {isValidating ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                Smart Check
              </Button>
            </div>
          </div>

          {/* Three-column layout: Form + Preview + AI Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[500px]">
            {/* Form Content */}
            <div className="lg:col-span-2 overflow-y-auto pr-2">
              <div className="min-h-[400px]">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  🧠 Let&apos;s build your course foundation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Tell me about your course idea so I can help you create something amazing!
                </p>
              </div>

              <div className="space-y-6">
                {/* Course Title */}
                <div>
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Complete React Development Bootcamp"
                    value={formData.courseTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, courseTitle: e.target.value }))}
                    className="mt-1"
                  />
                  
                  {/* Title Suggestions */}
                  {(titleSuggestions.length > 0 || isLoadingTitleSuggestions) && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                        <Sparkles className="h-4 w-4" />
                        <span className="font-medium text-sm">Sam&apos;s Title Suggestions</span>
                        {isLoadingTitleSuggestions && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                      </div>
                      {isLoadingTitleSuggestions ? (
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          Generating better title suggestions...
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {titleSuggestions.slice(0, 3).map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => setFormData(prev => ({ ...prev, courseTitle: suggestion }))}
                              className="w-full text-left p-2 text-sm bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Course Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Course Category *</Label>
                    <Select 
                      value={formData.courseCategory} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, courseCategory: value, courseSubcategory: '' }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSE_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.courseCategory && (
                    <div>
                      <Label>Subcategory</Label>
                      <Select 
                        value={formData.courseSubcategory || ''} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, courseSubcategory: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSelectedCategory()?.subcategories.map((sub) => (
                            <SelectItem key={sub} value={sub}>
                              {sub}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Course Short Overview */}
                <div>
                  <Label htmlFor="overview">Course Short Overview *</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Sam will generate your full course description from this overview
                  </p>
                  <Textarea
                    id="overview"
                    placeholder={getOverviewPlaceholder(formData.courseCategory)}
                    value={formData.courseShortOverview}
                    onChange={(e) => setFormData(prev => ({ ...prev, courseShortOverview: e.target.value }))}
                    className="mt-1 min-h-[120px]"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className={cn(
                      "text-xs",
                      formData.courseShortOverview.length < 50 ? "text-red-500" : "text-green-600"
                    )}>
                      {formData.courseShortOverview.length < 50 
                        ? `Need ${50 - formData.courseShortOverview.length} more characters`
                        : "Good length!"
                      }
                    </span>
                    <span className="text-xs text-gray-400">
                      {formData.courseShortOverview.length}/300
                    </span>
                  </div>
                  
                  {/* Overview Suggestions */}
                  {(overviewSuggestions.length > 0 || isLoadingOverviewSuggestions) && (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                        <Lightbulb className="h-4 w-4" />
                        <span className="font-medium text-sm">Sam&apos;s Overview Suggestions</span>
                        {isLoadingOverviewSuggestions && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                      </div>
                      {isLoadingOverviewSuggestions ? (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Crafting compelling overview suggestions...
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {overviewSuggestions.slice(0, 2).map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => setFormData(prev => ({ ...prev, courseShortOverview: suggestion }))}
                              className="w-full text-left p-3 text-sm bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Target Audience */}
                <div>
                  <Label>Target Audience *</Label>
                  <Select 
                    value={formData.targetAudience} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, targetAudience: value }));
                      if (value !== 'Custom (describe below)') {
                        setCustomAudience('');
                      }
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Who is this course for?" />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_AUDIENCES.map((audience) => (
                        <SelectItem key={audience} value={audience}>
                          {audience}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {formData.targetAudience === 'Custom (describe below)' && (
                    <Textarea
                      placeholder="Describe your target audience in detail..."
                      value={customAudience}
                      onChange={(e) => setCustomAudience(e.target.value)}
                      className="mt-2 min-h-[80px]"
                    />
                  )}
                </div>

                {/* Course Intent */}
                <div>
                  <Label className="text-base font-medium">Course Intent *</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    What&apos;s the primary goal of this course?
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {COURSE_INTENTS.map((intent) => (
                      <div
                        key={intent.value}
                        onClick={() => setFormData(prev => ({ ...prev, courseIntent: intent.value }))}
                        className={cn(
                          "p-3 rounded-lg border-2 cursor-pointer transition-all",
                          formData.courseIntent === intent.value
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                        )}
                      >
                        <div className="font-medium text-sm">{intent.label}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {intent.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Difficulty and Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Difficulty Level</Label>
                    <Select 
                      value={formData.difficulty} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Course Duration</Label>
                    <Select 
                      value={formData.duration} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((duration) => (
                          <SelectItem key={duration} value={duration}>
                            {duration}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Sam's Understanding Preview */}
                {formData.courseTitle && formData.courseCategory && formData.courseIntent && (
                  <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 mb-2">
                      <Bot className="h-4 w-4" />
                      <span className="font-medium">Sam&apos;s Understanding</span>
                    </div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      I see you&apos;re creating a <strong>{getSelectedCategory()?.label}</strong> course 
                      {formData.courseSubcategory && `in ${formData.courseSubcategory} `}
                      for <strong>{formData.targetAudience}</strong> focused on{' '}
                      <strong>{COURSE_INTENTS.find(i => i.value === formData.courseIntent)?.label.replace(/�[�-�]|�[�-�]|�[�-�]|�[�-�]/g, '').trim()}</strong>. 
                      In the next step, I&apos;ll help generate detailed learning objectives based on this foundation!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Who is your target audience?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Understanding your students helps me create better content
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Textarea
                    id="audience"
                    placeholder="e.g., Beginner programmers with basic HTML/CSS knowledge, working professionals looking to switch careers, college students..."
                    value={formData.targetAudience}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="mt-1 min-h-[120px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Number of Chapters</Label>
                    <Select 
                      value={formData.chapterCount.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, chapterCount: parseInt(value) }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map((count) => (
                          <SelectItem key={count} value={count.toString()}>
                            {count} chapters
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Sections per Chapter</Label>
                    <Select 
                      value={formData.sectionsPerChapter.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, sectionsPerChapter: parseInt(value) }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 7, 8].map((count) => (
                          <SelectItem key={count} value={count.toString()}>
                            {count} sections
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                    <Lightbulb className="h-4 w-4" />
                    <span className="font-medium">Course Structure Preview</span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Your course will have <strong>{formData.chapterCount} chapters</strong> with{' '}
                    <strong>{formData.sectionsPerChapter} sections each</strong>, totaling{' '}
                    <strong>{formData.chapterCount * formData.sectionsPerChapter} lessons</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  What are your learning objectives?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Define what students should achieve by the end of your course
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Add Learning Objectives (up to 5)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="e.g., Build responsive web applications using React"
                      value={currentGoal}
                      onChange={(e) => setCurrentGoal(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                    />
                    <Button 
                      type="button" 
                      onClick={addGoal}
                      disabled={!currentGoal.trim() || formData.courseGoals.length >= 5}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {formData.courseGoals.length > 0 && (
                  <div className="space-y-2">
                    <Label>Current Objectives:</Label>
                    {formData.courseGoals.map((goal, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Target className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="flex-1 text-sm">{goal}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGoal(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="assessments"
                    checked={formData.includeAssessments}
                    onChange={(e) => setFormData(prev => ({ ...prev, includeAssessments: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="assessments" className="text-sm">
                    Include assessments and quizzes for each chapter
                  </Label>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Customize your course approach
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Let&apos;s tailor the learning experience for your students
                </p>
              </div>

              <div className="space-y-6">
                {/* Bloom's Taxonomy Focus */}
                <div>
                  <Label className="text-base font-medium">Bloom&apos;s Taxonomy Focus</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Select the cognitive levels you want to emphasize in your course
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {BLOOMS_LEVELS.map((level) => (
                      <div
                        key={level.value}
                        onClick={() => toggleBloomsLevel(level.value)}
                        className={cn(
                          "p-3 rounded-lg border-2 cursor-pointer transition-all",
                          formData.bloomsFocus.includes(level.value)
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Brain className={cn(
                            "h-4 w-4",
                            formData.bloomsFocus.includes(level.value)
                              ? "text-purple-600"
                              : "text-gray-400"
                          )} />
                          <span className="font-medium">{level.label}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {level.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Content Types */}
                <div>
                  <Label className="text-base font-medium">Preferred Content Types</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Choose the types of content you want to include
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CONTENT_TYPES.map((type) => (
                      <div
                        key={type.value}
                        onClick={() => toggleContentType(type.value)}
                        className={cn(
                          "p-3 rounded-lg border-2 cursor-pointer transition-all text-center",
                          formData.preferredContentTypes.includes(type.value)
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                        )}
                      >
                        <div className="text-lg mb-1">{type.icon}</div>
                        <div className="text-sm font-medium">{type.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Additional Course Details
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Provide more context to enhance your course content and assessments
                </p>
              </div>

              <div className="space-y-6">
                {/* Course Scoring Dashboard */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700/30">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-3">
                    <Target className="h-5 w-5" />
                    <span className="font-medium">Course Quality Score</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{Math.round((formData.courseTitle?.length || 0) / 50 * 100)}%</div>
                      <div className="text-gray-600">Title Quality</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {formData.courseShortOverview ? Math.round((formData.courseShortOverview.length / 200) * 100) : 0}
                      </div>
                      <div className="text-gray-600">Description</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{formData.courseGoals.length * 20}</div>
                      <div className="text-gray-600">Objectives</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {Math.round(((formData.prerequisites.length + formData.realWorldApplications.length + formData.careerOutcomes.length) / 15) * 100)}
                      </div>
                      <div className="text-gray-600">Context Depth</div>
                    </div>
                  </div>
                </div>

                {/* Student Background */}
                <div>
                  <Label htmlFor="studentBackground">Student Background & Context</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Describe your typical student&apos;s current situation, experience level, and motivations
                  </p>
                  <Textarea
                    id="studentBackground"
                    placeholder="e.g., Working professionals with 2-3 years experience, frustrated with current tools, wanting to advance their careers in tech industry..."
                    value={formData.studentBackground}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentBackground: e.target.value }))}
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                {/* Prerequisites */}
                <div>
                  <Label>Prerequisites & Required Knowledge (up to 8)</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    What should students know before taking this course?
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="e.g., Basic HTML/CSS knowledge"
                      value={currentPrerequisite}
                      onChange={(e) => setCurrentPrerequisite(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addPrerequisite()}
                    />
                    <Button 
                      type="button" 
                      onClick={addPrerequisite}
                      disabled={!currentPrerequisite.trim() || formData.prerequisites.length >= 8}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {formData.prerequisites.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.prerequisites.map((prereq, index) => (
                        <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                          {prereq}
                          <button
                            onClick={() => removePrerequisite(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Industry Context */}
                <div>
                  <Label htmlFor="industryContext">Industry Context & Market Relevance</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Describe the industry landscape, current trends, and why this knowledge is valuable
                  </p>
                  <Textarea
                    id="industryContext"
                    placeholder="e.g., With the rise of remote work, companies are looking for developers who can build responsive, accessible web applications. This skillset is in high demand with average salaries of $75k-120k..."
                    value={formData.industryContext}
                    onChange={(e) => setFormData(prev => ({ ...prev, industryContext: e.target.value }))}
                    className="mt-1 min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Real World Applications */}
                  <div>
                    <Label>Real-World Applications (up to 6)</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      How will students use this knowledge in practice?
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="e.g., Build e-commerce platforms"
                        value={currentApplication}
                        onChange={(e) => setCurrentApplication(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addApplication()}
                        className="text-sm"
                      />
                      <Button 
                        type="button" 
                        onClick={addApplication}
                        disabled={!currentApplication.trim() || formData.realWorldApplications.length >= 6}
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                    
                    {formData.realWorldApplications.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                        {formData.realWorldApplications.map((app, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <span className="flex-1">{app}</span>
                            <button
                              onClick={() => removeApplication(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Career Outcomes */}
                  <div>
                    <Label>Career Outcomes (up to 6)</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      What career opportunities will this unlock?
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="e.g., Frontend Developer role"
                        value={currentOutcome}
                        onChange={(e) => setCurrentOutcome(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addOutcome()}
                        className="text-sm"
                      />
                      <Button 
                        type="button" 
                        onClick={addOutcome}
                        disabled={!currentOutcome.trim() || formData.careerOutcomes.length >= 6}
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                    
                    {formData.careerOutcomes.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                        {formData.careerOutcomes.map((outcome, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <span className="flex-1">{outcome}</span>
                            <button
                              onClick={() => removeOutcome(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tools and Technologies */}
                  <div>
                    <Label>Tools & Technologies (up to 10)</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Specific tools, frameworks, and technologies covered
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="e.g., React, VS Code, Git"
                        value={currentTool}
                        onChange={(e) => setCurrentTool(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTool()}
                        className="text-sm"
                      />
                      <Button 
                        type="button" 
                        onClick={addTool}
                        disabled={!currentTool.trim() || formData.toolsAndTechnologies.length >= 10}
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                    
                    {formData.toolsAndTechnologies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {formData.toolsAndTechnologies.map((tool, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tool}
                            <button
                              onClick={() => removeTool(index)}
                              className="ml-1 text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Common Challenges */}
                  <div>
                    <Label>Common Challenges & Pain Points (up to 6)</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      What problems do students typically face?
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="e.g., Understanding state management"
                        value={currentChallenge}
                        onChange={(e) => setCurrentChallenge(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addChallenge()}
                        className="text-sm"
                      />
                      <Button 
                        type="button" 
                        onClick={addChallenge}
                        disabled={!currentChallenge.trim() || formData.commonChallenges.length >= 6}
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                    
                    {formData.commonChallenges.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                        {formData.commonChallenges.map((challenge, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                            <span className="flex-1">{challenge}</span>
                            <button
                              onClick={() => removeChallenge(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Success Metrics */}
                <div>
                  <Label>Success Metrics & Outcomes (up to 5)</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    How will students know they&apos;ve mastered this material?
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="e.g., Can build a portfolio website from scratch"
                      value={currentMetric}
                      onChange={(e) => setCurrentMetric(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addMetric()}
                    />
                    <Button 
                      type="button" 
                      onClick={addMetric}
                      disabled={!currentMetric.trim() || formData.successMetrics.length >= 5}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {formData.successMetrics.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {formData.successMetrics.map((metric, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                          <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <span className="flex-1 text-sm">{metric}</span>
                          <button
                            onClick={() => removeMetric(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sam's Knowledge Preview */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 mb-3">
                    <Brain className="h-5 w-5" />
                    <span className="font-medium">Sam&apos;s Enhanced Understanding</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{formData.prerequisites.length}</div>
                      <div className="text-gray-600">Prerequisites</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{formData.realWorldApplications.length}</div>
                      <div className="text-gray-600">Applications</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{formData.careerOutcomes.length}</div>
                      <div className="text-gray-600">Career Paths</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{formData.toolsAndTechnologies.length}</div>
                      <div className="text-gray-600">Tools</div>
                    </div>
                  </div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-3">
                    With this rich context, I can now generate industry-relevant content, practical projects, and career-focused assessments that truly serve your students&apos; goals!
                  </p>
                </div>
              </div>
            </div>
          )}
              </div>
            </div>
            
            {/* Preview Panel */}
            <div className="hidden lg:block lg:col-span-1">
              <CourseStructurePreview 
                data={formData} 
                currentStep={step}
                className="sticky top-0"
              />
            </div>

            {/* Progressive Disclosure Panel */}
            <div className="hidden lg:block lg:col-span-1">
              <ProgressiveDisclosurePanel
                disclosureState={disclosureState}
                stepSuggestions={stepSuggestions}
                timeSpent={timeSpent}
                onToggleAdvancedOptions={toggleAdvancedOptions}
                onToggleQuickMode={toggleQuickMode}
                onApplySuggestion={applySuggestion}
                onDismissSuggestion={dismissSuggestion}
                className="sticky top-0"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <Button
            variant="ghost"
            onClick={step === 1 ? onClose : handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={generateCourse}
              disabled={!canProceed() || isGenerating}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              data-ai-feature="streaming_generation"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Course...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Course with Sam
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>

      {/* Enhanced Streaming Generation Modal */}
      <StreamingGenerationModal
        isOpen={showStreamingModal}
        onClose={() => setShowStreamingModal(false)}
        onComplete={handleStreamingComplete}
        formData={{
          ...formData,
          targetAudience: formData.targetAudience === 'Custom (describe below)' ? customAudience : formData.targetAudience,
          courseDescription: formData.courseShortOverview
        }}
      />

      {/* Content Optimizer Modal */}
      {showContentOptimizer && (
        <Dialog open={showContentOptimizer} onOpenChange={setShowContentOptimizer}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Content Optimizer</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto">
              <ContentOptimizer
                content={{
                  title: formData.courseTitle,
                  description: formData.courseShortOverview,
                  learningObjectives: formData.courseGoals,
                  targetAudience: formData.targetAudience,
                  category: formData.courseCategory,
                  difficulty: formData.difficulty,
                  courseIntent: formData.courseIntent
                }}
                onApplyOptimizations={(optimizations) => {
                  if (optimizations.title) {
                    setFormData(prev => ({ ...prev, courseTitle: optimizations.title }));
                  }
                  if (optimizations.description) {
                    setFormData(prev => ({ ...prev, courseShortOverview: optimizations.description }));
                  }
                  if (optimizations.learningObjectives) {
                    setFormData(prev => ({ ...prev, courseGoals: optimizations.learningObjectives }));
                  }
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};