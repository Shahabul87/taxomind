"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  StepComponentProps,
  DIFFICULTY_OPTIONS,
  DURATION_OPTIONS,
  TARGET_AUDIENCES,
  COURSE_INTENTS,
  COURSE_CATEGORIES,
  BLOOMS_LEVELS,
  CONTENT_TYPES,
} from '../../types/sam-creator.types';
import { ValidationMessageComponent } from '@/components/ui/validation-message';
import { RealTimeValidator } from '@/lib/course-analytics';
import { EnhancedInput, EnhancedTextarea, FormFieldWrapper } from '../ui/FormField';
import {
  BookOpen,
  Target,
  Brain,
  CheckCircle2,
  Info,
  Lightbulb,
  Plus,
  X,
  GripVertical,
  Layers,
  FileText,
  ClipboardCheck,
  Sparkles,
  Wand2,
  Users,
  Clock,
  Zap,
  TrendingUp,
  UserCheck,
  Star,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Settings2,
} from 'lucide-react';
import { getMinimumSectionsForDifficulty, getTemplateForDifficulty } from '@/lib/sam/course-creation/chapter-templates';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

// Dynamic imports with SSR disabled to fix Radix UI hydration mismatch
const SAMTitleGeneratorModal = dynamic(
  () => import('@/components/ai/sam-title-generator-modal').then(mod => mod.SAMTitleGeneratorModal),
  { ssr: false }
);
const SAMOverviewGeneratorModal = dynamic(
  () => import('@/components/ai/sam-overview-generator-modal').then(mod => mod.SAMOverviewGeneratorModal),
  { ssr: false }
);
const SAMLearningObjectivesGeneratorModal = dynamic(
  () => import('@/components/ai/sam-learning-objectives-generator-modal').then(mod => mod.SAMLearningObjectivesGeneratorModal),
  { ssr: false }
);

const DIFFICULTY_ICONS = {
  BEGINNER: { icon: BookOpen, color: 'emerald', label: 'Foundation', gradient: 'from-emerald-500 to-teal-500' },
  INTERMEDIATE: { icon: TrendingUp, color: 'amber', label: 'Growth', gradient: 'from-amber-500 to-orange-500' },
  ADVANCED: { icon: Zap, color: 'rose', label: 'Mastery', gradient: 'from-rose-500 to-red-500' },
};

export function CourseFundamentalsStep({ formData, setFormData, validationErrors }: StepComponentProps) {
  const [newGoal, setNewGoal] = useState('');
  const chapterTemplate = getTemplateForDifficulty(formData.difficulty?.toLowerCase() ?? 'intermediate');
  const minimumSections = getMinimumSectionsForDifficulty(formData.difficulty?.toLowerCase() ?? 'intermediate');

  // Enforce minimum sections when difficulty changes
  useEffect(() => {
    if (formData.sectionsPerChapter >= minimumSections) return;
    setFormData(prev => ({
      ...prev,
      sectionsPerChapter: minimumSections,
    }));
  }, [formData.sectionsPerChapter, minimumSections, setFormData]);

  // Real-time audience/difficulty alignment validation
  const audienceValidation = RealTimeValidator.validateAudienceAlignment(formData.targetAudience, formData.difficulty);
  const hasAlignmentWarning =
    (formData.difficulty === 'BEGINNER' && formData.targetAudience?.includes('Experienced')) ||
    (formData.difficulty === 'ADVANCED' && formData.targetAudience?.includes('beginners'));

  // Learning objectives helpers
  const addGoal = (goal: string) => {
    if (goal.trim() && Array.isArray(formData.courseGoals) && !formData.courseGoals.includes(goal.trim())) {
      setFormData(prev => ({
        ...prev,
        courseGoals: [...(prev.courseGoals || []), goal.trim()],
      }));
      setNewGoal('');
    }
  };

  const addMultipleGoals = (goals: string[]) => {
    const existingGoals = formData.courseGoals || [];
    const newGoals = goals.filter(goal => goal.trim() && !existingGoals.includes(goal.trim()));
    if (newGoals.length > 0) {
      setFormData(prev => ({
        ...prev,
        courseGoals: [...(prev.courseGoals || []), ...newGoals],
      }));
    }
  };

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      courseGoals: Array.isArray(prev.courseGoals) ? prev.courseGoals.filter((_, i) => i !== index) : [],
    }));
  };

  const toggleBloomsLevel = (level: string) => {
    setFormData(prev => ({
      ...prev,
      bloomsFocus: Array.isArray(prev.bloomsFocus)
        ? (prev.bloomsFocus.includes(level)
          ? prev.bloomsFocus.filter(l => l !== level)
          : [...prev.bloomsFocus, level])
        : [level],
    }));
  };

  const toggleContentType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      preferredContentTypes: Array.isArray(prev.preferredContentTypes)
        ? (prev.preferredContentTypes.includes(type)
          ? prev.preferredContentTypes.filter(t => t !== type)
          : [...prev.preferredContentTypes, type])
        : [type],
    }));
  };

  // Validation checks
  const goalsIsValid = Array.isArray(formData.courseGoals) && formData.courseGoals.length >= 2;
  const bloomsIsValid = Array.isArray(formData.bloomsFocus) && formData.bloomsFocus.length >= 2;
  const categoryIsValid = !!formData.courseCategory;
  const audienceIsValid = !!formData.targetAudience;
  const totalLessons = formData.chapterCount * formData.sectionsPerChapter;

  // Bloom&apos;s taxonomy recommendations
  const BLOOMS_ORDER_VALUES = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const recommendedBloomsForDifficulty: Record<string, string[]> = {
    BEGINNER: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
    INTERMEDIATE: ['UNDERSTAND', 'APPLY', 'ANALYZE'],
    ADVANCED: ['APPLY', 'ANALYZE', 'EVALUATE'],
  };
  const difficulty = (formData.difficulty || 'INTERMEDIATE').toUpperCase();
  const recommendedLevels = recommendedBloomsForDifficulty[difficulty] ?? recommendedBloomsForDifficulty['INTERMEDIATE'];

  // Cognitive gap detection
  const selectedIndices = (formData.bloomsFocus || [])
    .map(l => BLOOMS_ORDER_VALUES.indexOf(l))
    .filter(i => i >= 0)
    .sort((a, b) => a - b);
  const hasCognitiveGap = selectedIndices.length >= 2 && selectedIndices.some((idx, i) =>
    i > 0 && idx - selectedIndices[i - 1] > 1
  );
  const gapLevels = hasCognitiveGap
    ? selectedIndices.reduce<string[]>((gaps, idx, i) => {
        if (i > 0) {
          for (let g = selectedIndices[i - 1] + 1; g < idx; g++) {
            gaps.push(BLOOMS_ORDER_VALUES[g]);
          }
        }
        return gaps;
      }, [])
    : [];

  return (
    <div className="space-y-8">
      {/* ================================================================
          SECTION 1: Configuration Parameters
          ================================================================ */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
            <Settings2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Course Configuration
          </h3>
        </div>

        <div className="space-y-5">
          {/* Difficulty Level */}
          <div className="space-y-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Required
              </span>
            </div>

            <FormFieldWrapper
              label="Difficulty level"
              required
              tooltip="Choose the complexity level that matches your target audience&apos;s current knowledge and skills."
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                {DIFFICULTY_OPTIONS.map((option) => {
                  const config = DIFFICULTY_ICONS[option.value as keyof typeof DIFFICULTY_ICONS];
                  const IconComponent = config?.icon || Target;
                  const isSelected = formData.difficulty === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, difficulty: option.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' }))}
                      className={cn(
                        "group/card relative p-5 rounded-xl border-2 text-left transition-all duration-300",
                        "hover:shadow-xl hover:-translate-y-1",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                        "overflow-hidden",
                        isSelected ? [
                          "bg-gradient-to-br shadow-lg",
                          option.value === 'BEGINNER' && "from-emerald-50 via-green-50/80 to-teal-50/60 dark:from-emerald-950/60 dark:via-green-950/40 dark:to-teal-950/30 border-emerald-400 dark:border-emerald-500 focus-visible:ring-emerald-500",
                          option.value === 'INTERMEDIATE' && "from-amber-50 via-yellow-50/80 to-orange-50/60 dark:from-amber-950/60 dark:via-yellow-950/40 dark:to-orange-950/30 border-amber-400 dark:border-amber-500 focus-visible:ring-amber-500",
                          option.value === 'ADVANCED' && "from-rose-50 via-red-50/80 to-pink-50/60 dark:from-rose-950/60 dark:via-red-950/40 dark:to-pink-950/30 border-rose-400 dark:border-rose-500 focus-visible:ring-rose-500",
                        ] : [
                          "bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-700",
                          "hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-900",
                          "focus-visible:ring-indigo-500",
                        ]
                      )}
                    >
                      {isSelected && (
                        <div className={cn(
                          "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 -translate-y-1/2 translate-x-1/2",
                          option.value === 'BEGINNER' && "bg-emerald-400",
                          option.value === 'INTERMEDIATE' && "bg-amber-400",
                          option.value === 'ADVANCED' && "bg-rose-400",
                        )} />
                      )}
                      {isSelected && (
                        <div className={cn(
                          "absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center shadow-md",
                          option.value === 'BEGINNER' && "bg-gradient-to-br from-emerald-500 to-teal-500",
                          option.value === 'INTERMEDIATE' && "bg-gradient-to-br from-amber-500 to-orange-500",
                          option.value === 'ADVANCED' && "bg-gradient-to-br from-rose-500 to-red-500",
                        )}>
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div className="relative flex flex-col items-start gap-3">
                        <div className={cn(
                          "p-3 rounded-xl transition-all duration-300",
                          isSelected ? [
                            "shadow-md",
                            option.value === 'BEGINNER' && "bg-gradient-to-br from-emerald-500 to-teal-500 text-white",
                            option.value === 'INTERMEDIATE' && "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
                            option.value === 'ADVANCED' && "bg-gradient-to-br from-rose-500 to-red-500 text-white",
                          ] : "bg-slate-100 dark:bg-slate-800 group-hover/card:bg-slate-200 dark:group-hover/card:bg-slate-700"
                        )}>
                          <IconComponent className={cn(
                            "h-6 w-6 transition-colors",
                            isSelected ? "text-white" : "text-slate-500 dark:text-slate-400"
                          )} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-bold text-base text-slate-900 dark:text-slate-100">
                              {option.label}
                            </span>
                          </div>
                          <Badge className={cn(
                            "mb-2 text-[10px] font-bold px-2 py-0.5",
                            isSelected ? [
                              "border-0",
                              option.value === 'BEGINNER' && "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-200",
                              option.value === 'INTERMEDIATE' && "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-200",
                              option.value === 'ADVANCED' && "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200",
                            ] : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          )}>
                            {config?.label}
                          </Badge>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </FormFieldWrapper>
          </div>

          {/* Course Intent + Target Audience Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Course Intent */}
            <div className="space-y-3 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                  <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Optional
                </span>
              </div>
              <FormFieldWrapper
                label="Course intent"
                tooltip="What&apos;s the primary goal of this course? This helps tailor the course structure and content recommendations."
              >
                <Select
                  value={formData.courseIntent}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, courseIntent: value }))}
                >
                  <SelectTrigger className={cn(
                    "h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700",
                    "rounded-xl text-sm sm:text-base px-4 shadow-sm",
                    "transition-all duration-300",
                    "hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md",
                    "focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20",
                    formData.courseIntent && "border-amber-400 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-950/30"
                  )}>
                    <SelectValue placeholder="What&apos;s the main purpose?" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="p-1">
                      {COURSE_INTENTS.map((intent) => (
                        <SelectItem
                          key={intent}
                          value={intent}
                          className="text-sm sm:text-base py-3 px-3 cursor-pointer rounded-lg transition-all hover:bg-amber-50 dark:hover:bg-amber-950/30 my-0.5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-amber-100/50 dark:bg-amber-900/30">
                              <Target className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                            </div>
                            <span>{intent}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </FormFieldWrapper>
            </div>

            {/* Target Audience */}
            <div className="space-y-3 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                  <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Required
                </span>
              </div>
              <FormFieldWrapper
                label="Target audience"
                required
                tooltip="Select the primary audience for your course. This helps tailor content complexity, examples, and teaching approach."
              >
                <Select
                  value={formData.targetAudience}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    targetAudience: value,
                    customAudience: value === 'Custom (describe below)' ? prev.customAudience : '',
                  }))}
                >
                  <SelectTrigger className={cn(
                    "h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700",
                    "rounded-xl text-sm sm:text-base px-4 shadow-sm",
                    "transition-all duration-300",
                    "hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md",
                    "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
                    audienceIsValid && "border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/30"
                  )}>
                    <SelectValue placeholder="Who is this course for?" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="p-1">
                      {TARGET_AUDIENCES.map((audience) => (
                        <SelectItem
                          key={audience}
                          value={audience}
                          className="text-sm sm:text-base py-3 px-3 cursor-pointer rounded-lg transition-all hover:bg-purple-50 dark:hover:bg-purple-950/30 my-0.5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-purple-100/50 dark:bg-purple-900/30">
                              <Users className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                            </div>
                            <span>{audience}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
                {audienceValidation && (
                  <div className="mt-2">
                    <ValidationMessageComponent validation={audienceValidation} compact />
                  </div>
                )}
              </FormFieldWrapper>
            </div>
          </div>

          {/* Custom Audience Description */}
          {formData.targetAudience === 'Custom (describe below)' && (
            <div className="animate-slide-up">
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <EnhancedTextarea
                  label="Describe your target audience"
                  tooltip="Be specific about who your ideal learner is - their background, goals, and what they hope to achieve."
                  placeholder="Describe the specific audience for your course. Include their current skill level, professional background, and learning goals..."
                  value={formData.customAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, customAudience: e.target.value }))}
                  minChars={30}
                  showCharCount
                  className="min-h-[120px]"
                />
                {validationErrors.customAudience && (
                  <p className="mt-2 text-sm text-red-500">{validationErrors.customAudience}</p>
                )}
              </div>
            </div>
          )}

          {/* Category + Subcategory Row */}
          <div className="space-y-5 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Required
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormFieldWrapper
                label="Course category"
                required
                tooltip="Select the primary category that best matches your course content."
              >
                <Select
                  value={formData.courseCategory}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, courseCategory: value, courseSubcategory: '' }));
                  }}
                >
                  <SelectTrigger className={cn(
                    "h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700",
                    "rounded-xl text-sm sm:text-base px-4 shadow-sm",
                    "transition-all duration-300",
                    "hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md",
                    "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                    categoryIsValid && "border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/30"
                  )}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-900 max-h-[340px] overflow-hidden">
                    <div className="p-1">
                      {COURSE_CATEGORIES.map((category) => (
                        <SelectItem
                          key={category.value}
                          value={category.value}
                          className="text-sm sm:text-base py-3 px-3 cursor-pointer rounded-lg transition-all hover:bg-emerald-50 hover:text-slate-900 dark:hover:bg-emerald-950/30 dark:hover:text-slate-100 focus:bg-emerald-50 focus:text-slate-900 dark:focus:bg-emerald-950/30 dark:focus:text-slate-100 data-[highlighted]:bg-emerald-50 data-[highlighted]:text-slate-900 dark:data-[highlighted]:bg-emerald-950/30 dark:data-[highlighted]:text-slate-100 my-0.5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                              <Layers className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </div>
                            <span>{category.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </FormFieldWrapper>

              {formData.courseCategory && (
                <div className="animate-slide-up">
                  <FormFieldWrapper
                    label="Subcategory"
                    tooltip="Narrow down your course topic for better discoverability."
                  >
                    <Select
                      value={formData.courseSubcategory}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, courseSubcategory: value }))}
                    >
                      <SelectTrigger className={cn(
                        "h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700",
                        "rounded-xl text-sm sm:text-base px-4 shadow-sm",
                        "transition-all duration-300",
                        "hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md",
                        "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
                        formData.courseSubcategory && "border-indigo-400 dark:border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30"
                      )}>
                        <SelectValue placeholder="Select subcategory (optional)" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-900 max-h-[300px] overflow-hidden">
                        <div className="p-1">
                          {COURSE_CATEGORIES
                            .find(cat => cat.value === formData.courseCategory)
                            ?.subcategories?.map((sub) => (
                              <SelectItem
                                key={sub}
                                value={sub}
                                className="text-sm sm:text-base py-2.5 px-3 cursor-pointer rounded-lg transition-all hover:bg-indigo-50 hover:text-slate-900 dark:hover:bg-indigo-950/30 dark:hover:text-slate-100 focus:bg-indigo-50 focus:text-slate-900 dark:focus:bg-indigo-950/30 dark:focus:text-slate-100 data-[highlighted]:bg-indigo-50 data-[highlighted]:text-slate-900 dark:data-[highlighted]:bg-indigo-950/30 dark:data-[highlighted]:text-slate-100 my-0.5"
                              >
                                {sub}
                              </SelectItem>
                            )) || []}
                        </div>
                      </SelectContent>
                    </Select>
                  </FormFieldWrapper>
                </div>
              )}
            </div>
          </div>

          {/* Structure Sliders: Chapters + Sections per Chapter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Chapters Slider */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                  <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Number of chapters
                  </Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Main sections of your course
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {formData.chapterCount}
                  </span>
                </div>
              </div>
              <Slider
                value={[formData.chapterCount]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, chapterCount: value[0] }))}
                max={20}
                min={3}
                step={1}
                className="w-full mb-3"
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                <span>3 (Mini)</span>
                <span>10 (Standard)</span>
                <span>20 (Comprehensive)</span>
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
                <Lightbulb className="h-3 w-3 inline mr-1.5" />
                Recommended: 5-10 chapters for optimal learning progression
              </div>
            </div>

            {/* Sections Slider */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/50">
                  <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Sections per chapter
                  </Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Lessons within each chapter
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                    {formData.sectionsPerChapter}
                  </span>
                </div>
              </div>
              <Slider
                value={[formData.sectionsPerChapter]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, sectionsPerChapter: value[0] }))}
                max={8}
                min={minimumSections}
                step={1}
                className="w-full mb-3"
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                <span>{minimumSections} (Minimum)</span>
                <span>4 (Standard)</span>
                <span>8 (Detailed)</span>
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 p-2.5 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                <Lightbulb className="h-3 w-3 inline mr-1.5" />
                Recommended: 3-5 sections per chapter for digestible content
              </div>
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <Info className="h-3 w-3 inline mr-1.5" />
                {chapterTemplate.displayName} requires at least {minimumSections} sections to preserve all required pedagogy.
              </div>
            </div>
          </div>

          {/* Learning Objectives Count Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Objectives per Chapter */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                  <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Objectives per chapter
                  </Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Learning outcomes for each chapter
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formData.learningObjectivesPerChapter || 5}
                  </span>
                </div>
              </div>
              <Slider
                value={[formData.learningObjectivesPerChapter || 5]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, learningObjectivesPerChapter: value[0] }))}
                max={10}
                min={3}
                step={1}
                className="w-full mb-3"
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                <span>3 (Focused)</span>
                <span>5 (Standard)</span>
                <span>10 (Comprehensive)</span>
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                <Lightbulb className="h-3 w-3 inline mr-1.5" />
                Uses Bloom&apos;s Taxonomy verbs for measurable outcomes
              </div>
            </div>

            {/* Objectives per Section */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-900/50">
                  <FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Objectives per section
                  </Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Specific goals for each lesson
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {formData.learningObjectivesPerSection || 3}
                  </span>
                </div>
              </div>
              <Slider
                value={[formData.learningObjectivesPerSection || 3]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, learningObjectivesPerSection: value[0] }))}
                max={5}
                min={2}
                step={1}
                className="w-full mb-3"
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                <span>2 (Brief)</span>
                <span>3 (Standard)</span>
                <span>5 (Detailed)</span>
              </div>
              <div className="text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-200/50 dark:border-cyan-800/50">
                <Lightbulb className="h-3 w-3 inline mr-1.5" />
                Aligned with chapter&apos;s Bloom&apos;s level for consistency
              </div>
            </div>
          </div>

          {/* Bloom's Taxonomy Focus */}
          <FormFieldWrapper
            label="Bloom&apos;s Taxonomy focus"
            required
            tooltip="Select cognitive levels to target. Higher levels (Analyze, Evaluate, Create) lead to deeper learning but require more foundational knowledge first."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
              {BLOOMS_LEVELS.map((level) => {
                const isSelected = formData.bloomsFocus.includes(level.value);
                return (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => toggleBloomsLevel(level.value)}
                    className={cn(
                      "group relative p-4 rounded-xl border-2 text-left transition-all duration-300",
                      "hover:shadow-md hover:-translate-y-0.5",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500",
                      isSelected
                        ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/30 border-emerald-400 dark:border-emerald-600 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 mb-1.5 pr-6">
                      {level.label}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {level.description}
                    </p>
                  </button>
                );
              })}
            </div>
            {!bloomsIsValid && formData.bloomsFocus.length > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Select at least 2 cognitive levels for a balanced learning experience
              </p>
            )}

            {bloomsIsValid && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <span className="font-semibold">Recommended for {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}:</span>{' '}
                      {recommendedLevels.map(l => l.charAt(0) + l.slice(1).toLowerCase()).join(' → ')}
                    </p>
                    <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80">
                      Bloom&apos;s taxonomy is hierarchical — each level builds on the previous one for proper cognitive progression.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {hasCognitiveGap && (
              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      <span className="font-semibold">Cognitive gap detected:</span>{' '}
                      {gapLevels.map(l => l.charAt(0) + l.slice(1).toLowerCase()).join(', ')}{' '}
                      {gapLevels.length === 1 ? 'level is' : 'levels are'} missing between your selections.
                    </p>
                    <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
                      The AI will automatically fill this gap in the blueprint to maintain proper learning progression.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </FormFieldWrapper>

          {/* Alignment Feedback */}
          {formData.targetAudience && formData.difficulty && (
            <div className={cn(
              "relative overflow-hidden rounded-2xl border-2 p-5 transition-all duration-500 animate-slide-up",
              hasAlignmentWarning
                ? "bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-yellow-50/60 dark:from-amber-950/50 dark:via-orange-950/40 dark:to-yellow-950/30 border-amber-300/50 dark:border-amber-700/50"
                : "bg-gradient-to-br from-emerald-50/90 via-green-50/70 to-teal-50/60 dark:from-emerald-950/50 dark:via-green-950/40 dark:to-teal-950/30 border-emerald-300/50 dark:border-emerald-700/50"
            )}>
              <div className={cn(
                "absolute top-3 right-3 opacity-10",
                hasAlignmentWarning ? "text-amber-500" : "text-emerald-500"
              )}>
                {hasAlignmentWarning ? (
                  <AlertTriangle className="h-16 w-16" />
                ) : (
                  <Star className="h-16 w-16" />
                )}
              </div>
              <div className="relative flex items-start gap-4">
                <div className={cn(
                  "flex-shrink-0 p-2.5 rounded-xl shadow-md",
                  hasAlignmentWarning
                    ? "bg-gradient-to-br from-amber-500 to-orange-500"
                    : "bg-gradient-to-br from-emerald-500 to-teal-500"
                )}>
                  {hasAlignmentWarning ? (
                    <AlertTriangle className="h-5 w-5 text-white" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "text-base font-bold mb-1.5",
                    hasAlignmentWarning
                      ? "text-amber-900 dark:text-amber-100"
                      : "text-emerald-900 dark:text-emerald-100"
                  )}>
                    {hasAlignmentWarning ? 'Consider Reviewing Alignment' : 'Excellent Audience Match!'}
                  </h4>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    hasAlignmentWarning
                      ? "text-amber-800 dark:text-amber-200"
                      : "text-emerald-800 dark:text-emerald-200"
                  )}>
                    {hasAlignmentWarning
                      ? `The ${formData.difficulty.toLowerCase()} difficulty level may not be ideal for your selected audience. Consider adjusting for better learner outcomes.`
                      : `Your ${formData.difficulty.toLowerCase()}-level course aligns well with your target audience. This combination supports effective learning outcomes.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Course Preview Stats */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                  {formData.chapterCount}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Chapters</div>
              </div>
              <div className="border-x border-slate-200 dark:border-slate-700">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                  {totalLessons}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Total lessons</div>
              </div>
              <div className="border-r border-slate-200 dark:border-slate-700">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formData.chapterCount * (formData.learningObjectivesPerChapter || 5)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Chapter objectives</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                  ~{Math.round(totalLessons * 8)} min
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Est. study time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 2: AI-Generated Content
          ================================================================ */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/50">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
            Course Content
          </h3>
        </div>

        <div className="space-y-5">
          {/* Course Title */}
          <div className="space-y-3 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                <Wand2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Required
              </span>
            </div>
            <EnhancedInput
              label="Course title"
              required
              tooltip="Choose a clear, descriptive title that tells learners exactly what they&apos;ll learn. Great titles are specific and include the main skill or topic."
              placeholder="e.g., Complete Web Development Bootcamp 2024"
              value={formData.courseTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, courseTitle: e.target.value }))}
              error={validationErrors?.courseTitle}
              showCharCount
              minChars={10}
              maxChars={100}
              successMessage="Great title length!"
            />
            <div className="flex justify-end mt-3">
              <SAMTitleGeneratorModal
                currentTitle={formData.courseTitle || ''}
                courseOverview={formData.courseShortOverview}
                courseCategory={formData.courseCategory}
                courseSubcategory={formData.courseSubcategory}
                courseIntent={formData.courseIntent}
                targetAudience={formData.targetAudience}
                difficulty={formData.difficulty}
                onSelectTitle={(title) => setFormData(prev => ({ ...prev, courseTitle: title }))}
                disabled={!formData.courseTitle || formData.courseTitle.length < 5}
              />
            </div>
          </div>

          {/* Course Overview */}
          <div className="space-y-3 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                Required
              </span>
            </div>
            <EnhancedTextarea
              label="Course overview"
              required
              tooltip="Describe what students will learn, the skills they&apos;ll gain, and why this course is valuable. Be specific about outcomes."
              placeholder="Describe what students will learn and achieve in this course. Include the main topics, skills they'll develop, and the transformation they can expect..."
              value={formData.courseShortOverview}
              onChange={(e) => setFormData(prev => ({ ...prev, courseShortOverview: e.target.value }))}
              error={validationErrors?.courseShortOverview}
              showCharCount
              minChars={50}
              maxChars={500}
              successMessage="Excellent overview!"
              className="min-h-[160px]"
            />
            <div className="flex justify-end mt-3">
              <SAMOverviewGeneratorModal
                courseTitle={formData.courseTitle || ''}
                currentOverview={formData.courseShortOverview}
                courseCategory={formData.courseCategory}
                courseSubcategory={formData.courseSubcategory}
                courseIntent={formData.courseIntent}
                targetAudience={formData.targetAudience}
                difficulty={formData.difficulty}
                onSelectOverview={(overview) => setFormData(prev => ({ ...prev, courseShortOverview: overview }))}
                disabled={!formData.courseTitle || formData.courseTitle.length < 5}
              />
            </div>
          </div>

          {/* Learning Objectives */}
          <FormFieldWrapper
            label="Learning objectives"
            required
            tooltip="What will students be able to do after completing this course? Use action verbs like &apos;Build&apos;, &apos;Create&apos;, &apos;Analyze&apos;, &apos;Design&apos;. The AI generator uses your Bloom&apos;s Taxonomy selection above for better-aligned objectives."
          >
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Build responsive web applications using React"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addGoal(newGoal);
                    }
                  }}
                  className={cn(
                    "h-11 flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700",
                    "rounded-xl text-sm px-4 shadow-sm",
                    "transition-all duration-200",
                    "hover:border-emerald-300 dark:hover:border-emerald-600",
                    "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => addGoal(newGoal)}
                  disabled={!newGoal.trim()}
                  className={cn(
                    "h-11 px-4 rounded-xl font-semibold text-sm",
                    "bg-emerald-600 hover:bg-emerald-700 text-white",
                    "shadow-sm hover:shadow-md",
                    "transition-all duration-200 hover:-translate-y-0.5",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
                    "flex items-center gap-1.5"
                  )}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add</span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Press Enter or click Add to add each objective (minimum 2 required)
                </p>
                <SAMLearningObjectivesGeneratorModal
                  courseTitle={formData.courseTitle || ''}
                  courseOverview={formData.courseShortOverview}
                  courseCategory={formData.courseCategory}
                  courseSubcategory={formData.courseSubcategory}
                  courseIntent={formData.courseIntent}
                  targetAudience={formData.targetAudience}
                  difficulty={formData.difficulty}
                  bloomsFocus={formData.bloomsFocus}
                  existingObjectives={formData.courseGoals || []}
                  targetObjectiveCount={formData.learningObjectivesPerChapter || 5}
                  onAddObjectives={addMultipleGoals}
                  disabled={!formData.courseTitle || formData.courseTitle.length < 5}
                />
              </div>

              {formData.courseGoals.length > 0 && (
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Learning objectives ({formData.courseGoals.length})
                    </span>
                    {goalsIsValid && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {formData.courseGoals.map((goal, index) => (
                      <div
                        key={index}
                        className="group flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                      >
                        <div className="flex-shrink-0 flex items-center gap-2 pt-0.5">
                          <GripVertical className="h-4 w-4 text-slate-300 dark:text-slate-600 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {goal}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeGoal(index)}
                          className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Remove objective"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </FormFieldWrapper>
        </div>
      </div>

      {/* ================================================================
          SECTION 3: Additional Settings (Collapsible)
          ================================================================ */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-left group">
            <Settings2 className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Additional Settings</span>
            <Badge className="ml-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-0 text-[10px]">
              Optional
            </Badge>
            <ChevronDown className="h-4 w-4 ml-auto text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-4 space-y-5">
            {/* Duration */}
            <div className="space-y-3 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <FormFieldWrapper
                label="Estimated duration"
                tooltip="How long will it take to complete this course?"
              >
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger className={cn(
                    "h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700",
                    "rounded-xl text-sm sm:text-base px-4 shadow-sm",
                    "transition-all duration-300",
                    "hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md",
                    "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                    formData.duration && "border-blue-400 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-950/30"
                  )}>
                    <SelectValue placeholder="Select estimated duration" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="p-1">
                      {DURATION_OPTIONS.map((duration) => (
                        <SelectItem
                          key={duration}
                          value={duration}
                          className="text-sm sm:text-base py-2.5 px-3 cursor-pointer rounded-lg transition-all hover:bg-blue-50 dark:hover:bg-blue-950/30 my-0.5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-blue-100/50 dark:bg-blue-900/30">
                              <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                            </div>
                            <span>{duration}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </FormFieldWrapper>
            </div>

            {/* Content Types */}
            <FormFieldWrapper
              label="Preferred content types"
              tooltip="Select the types of content you want to include."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                {CONTENT_TYPES.map((type) => {
                  const isSelected = formData.preferredContentTypes.includes(type.value);
                  return (
                    <div
                      key={type.value}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleContentType(type.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleContentType(type.value);
                        }
                      }}
                      className={cn(
                        "group relative p-4 rounded-xl border-2 text-left transition-all duration-300 cursor-pointer",
                        "hover:shadow-md hover:-translate-y-0.5",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500",
                        isSelected
                          ? "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/30 border-blue-400 dark:border-blue-600 shadow-sm"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                            {type.label}
                          </div>
                        </div>
                        <div
                          className={cn(
                            "h-5 w-5 rounded-sm border shadow flex items-center justify-center transition-colors",
                            isSelected
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          )}
                        >
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </FormFieldWrapper>

            {/* Include Assessments */}
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50">
                  <ClipboardCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Include assessments
                  </Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Quizzes, assignments, and progress tracking
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.includeAssessments}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeAssessments: checked }))}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Pro Tips */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 w-full p-3 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/30 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors text-left group">
            <Lightbulb className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-700 dark:text-violet-300">Pro Tips</span>
            <ChevronDown className="h-4 w-4 ml-auto text-violet-400 transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-2 space-y-2">
            {[
              "Use specific, outcome-focused titles that tell learners what they&apos;ll achieve",
              "Match difficulty to realistic learner expectations for better completion",
              "Start with concrete, measurable objectives using action verbs",
              "Build from lower Bloom\u2019s levels (Remember, Understand) to higher ones (Analyze, Create)",
              "Mix content types to accommodate different learning styles",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-violet-700 dark:text-violet-300">
                <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0 text-violet-500" />
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
