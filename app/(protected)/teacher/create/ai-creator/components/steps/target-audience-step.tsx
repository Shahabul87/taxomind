"use client";

import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StepComponentProps, DIFFICULTY_OPTIONS, DURATION_OPTIONS, TARGET_AUDIENCES } from '../../types/sam-creator.types';
import { ValidationMessageComponent } from '@/components/ui/validation-message';
import { RealTimeValidator } from '@/lib/course-analytics';
import { FormFieldWrapper, EnhancedTextarea } from '../ui/FormField';
import {
  Users,
  GraduationCap,
  Clock,
  CheckCircle2,
  Lightbulb,
  AlertTriangle,
  Zap,
  BookOpen,
  Target,
  TrendingUp,
  Sparkles,
  ArrowRight,
  UserCheck,
  Star
} from 'lucide-react';

const DIFFICULTY_ICONS = {
  BEGINNER: { icon: BookOpen, color: 'emerald', label: 'Foundation', gradient: 'from-emerald-500 to-teal-500' },
  INTERMEDIATE: { icon: TrendingUp, color: 'amber', label: 'Growth', gradient: 'from-amber-500 to-orange-500' },
  ADVANCED: { icon: Zap, color: 'rose', label: 'Mastery', gradient: 'from-rose-500 to-red-500' }
};

export function TargetAudienceStep({ formData, setFormData, validationErrors }: StepComponentProps) {
  const [customAudience, setCustomAudience] = useState('');

  // Real-time validation
  const audienceValidation = RealTimeValidator.validateAudienceAlignment(formData.targetAudience, formData.difficulty);

  const audienceIsValid = !!formData.targetAudience;
  const difficultyIsValid = !!formData.difficulty;
  const completedFields = [audienceIsValid, difficultyIsValid].filter(Boolean).length;
  const totalRequired = 2;
  const progressPercentage = (completedFields / totalRequired) * 100;

  // Alignment check
  const hasAlignmentWarning =
    (formData.difficulty === 'BEGINNER' && formData.targetAudience?.includes('Experienced')) ||
    (formData.difficulty === 'ADVANCED' && formData.targetAudience?.includes('beginners'));

  return (
    <div className="space-y-8">
      {/* Premium Progress Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50/80 via-indigo-50/40 to-slate-50/60 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-slate-900/50 border border-purple-200/30 dark:border-purple-800/30 p-5">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-indigo-400/20 to-purple-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
                <Users className="h-6 w-6 text-white" />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-purple-500/30 blur-md -z-10" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                Target Audience
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Define who will benefit most from your course
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Animated step indicators */}
            <div className="flex items-center gap-1.5">
              {[audienceIsValid, difficultyIsValid].map((isValid, i) => (
                <div
                  key={i}
                  className={cn(
                    "relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 transform",
                    isValid
                      ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 scale-100"
                      : "bg-white/60 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-700/50 scale-95"
                  )}
                >
                  {isValid ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                  {isValid && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Progress badge */}
            <Badge className={cn(
              "h-8 px-3 text-xs font-bold rounded-lg transition-all duration-300",
              completedFields === totalRequired
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg shadow-emerald-500/25"
                : "bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
            )}>
              {completedFields === totalRequired ? (
                <>
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Complete!
                </>
              ) : (
                `${completedFields}/${totalRequired}`
              )}
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative mt-5 h-1.5 bg-white/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out",
              "bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Target Audience Selection - Premium Card */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative space-y-4 p-5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-700/30 backdrop-blur-sm transition-all duration-300 group-hover:border-purple-300/50 dark:group-hover:border-purple-700/50 group-hover:shadow-lg group-hover:shadow-purple-500/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Required • Step 1 of 2
            </span>
          </div>

          <FormFieldWrapper
            label="Target audience"
            required
            tooltip="Select the primary audience for your course. This helps tailor content complexity, examples, and teaching approach."
          >
            <Select
              value={formData.targetAudience}
              onValueChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value }))}
            >
              <SelectTrigger className={cn(
                "h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700",
                "rounded-xl text-sm sm:text-base px-4 shadow-sm",
                "transition-all duration-300",
                "hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md",
                "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
                audienceIsValid && "border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/30"
              )}>
                <SelectValue placeholder="Who is this course designed for?" />
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
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-700/30 backdrop-blur-sm transition-all duration-300 group-hover:border-indigo-300/50 dark:group-hover:border-indigo-700/50 group-hover:shadow-lg group-hover:shadow-indigo-500/5">
              <EnhancedTextarea
                label="Describe your target audience"
                tooltip="Be specific about who your ideal learner is - their background, goals, and what they hope to achieve."
                placeholder="Describe the specific audience for your course. Include their current skill level, professional background, and learning goals..."
                value={customAudience}
                onChange={(e) => setCustomAudience(e.target.value)}
                minChars={30}
                showCharCount
                className="min-h-[120px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Difficulty Level - Premium Enhanced Cards */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative space-y-4 p-5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-700/30 backdrop-blur-sm transition-all duration-300 group-hover:border-indigo-300/50 dark:group-hover:border-indigo-700/50 group-hover:shadow-lg group-hover:shadow-indigo-500/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
              <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Required • Step 2 of 2
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
                        option.value === 'ADVANCED' && "from-rose-50 via-red-50/80 to-pink-50/60 dark:from-rose-950/60 dark:via-red-950/40 dark:to-pink-950/30 border-rose-400 dark:border-rose-500 focus-visible:ring-rose-500"
                      ] : [
                        "bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-700",
                        "hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-900",
                        "focus-visible:ring-indigo-500"
                      ]
                    )}
                  >
                    {/* Background decoration */}
                    {isSelected && (
                      <div className={cn(
                        "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 -translate-y-1/2 translate-x-1/2",
                        option.value === 'BEGINNER' && "bg-emerald-400",
                        option.value === 'INTERMEDIATE' && "bg-amber-400",
                        option.value === 'ADVANCED' && "bg-rose-400"
                      )} />
                    )}

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className={cn(
                        "absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center shadow-md",
                        option.value === 'BEGINNER' && "bg-gradient-to-br from-emerald-500 to-teal-500",
                        option.value === 'INTERMEDIATE' && "bg-gradient-to-br from-amber-500 to-orange-500",
                        option.value === 'ADVANCED' && "bg-gradient-to-br from-rose-500 to-red-500"
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
                          option.value === 'ADVANCED' && "bg-gradient-to-br from-rose-500 to-red-500 text-white"
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
                            option.value === 'ADVANCED' && "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200"
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
      </div>

      {/* Estimated Duration - Optional Premium Card */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative space-y-3 p-5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-700/30 backdrop-blur-sm transition-all duration-300 group-hover:border-blue-300/50 dark:group-hover:border-blue-700/50 group-hover:shadow-lg group-hover:shadow-blue-500/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Optional • Enhance Planning
            </span>
          </div>

          <FormFieldWrapper
            label="Estimated duration"
            tooltip="How long will it take to complete this course? This helps set learner expectations."
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
      </div>

      {/* Alignment Feedback Card */}
      {formData.targetAudience && formData.difficulty && (
        <div className={cn(
          "relative overflow-hidden rounded-2xl border-2 p-5 transition-all duration-500 animate-slide-up",
          hasAlignmentWarning
            ? "bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-yellow-50/60 dark:from-amber-950/50 dark:via-orange-950/40 dark:to-yellow-950/30 border-amber-300/50 dark:border-amber-700/50"
            : "bg-gradient-to-br from-emerald-50/90 via-green-50/70 to-teal-50/60 dark:from-emerald-950/50 dark:via-green-950/40 dark:to-teal-950/30 border-emerald-300/50 dark:border-emerald-700/50"
        )}>
          {/* Decorative icon */}
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

      {/* Pro Tips Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/70 to-violet-50/60 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-violet-950/20 border border-blue-200/50 dark:border-blue-800/30 p-5">
        {/* Decorative sparkles */}
        <div className="absolute top-3 right-3 text-blue-400/40">
          <Sparkles className="h-20 w-20" />
        </div>

        <div className="relative flex items-start gap-4">
          <div className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-blue-900 dark:text-blue-100 mb-3">
              Pro Tips for Your Target Audience
            </h4>
            <ul className="space-y-3">
              {[
                "Be specific about prerequisites - what should learners already know?",
                "Match difficulty to realistic learner expectations for better completion",
                "Consider duration carefully - shorter courses often have higher completion rates"
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-blue-800 dark:text-blue-200">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-blue-200/80 dark:bg-blue-800/50 flex items-center justify-center">
                      <ArrowRight className="h-3 w-3 text-blue-700 dark:text-blue-300" />
                    </div>
                  </div>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
