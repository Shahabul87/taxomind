"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StepComponentProps, DIFFICULTY_OPTIONS, DURATION_OPTIONS, TARGET_AUDIENCES, COURSE_INTENTS } from '../../types/sam-creator.types';
import { ValidationMessageComponent } from '@/components/ui/validation-message';
import { RealTimeValidator } from '@/lib/course-analytics';
import { FormFieldWrapper, EnhancedTextarea } from '../ui/FormField';
import {
  Users,
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
  Star,
  ChevronDown
} from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

const DIFFICULTY_ICONS = {
  BEGINNER: { icon: BookOpen, color: 'emerald', label: 'Foundation', gradient: 'from-emerald-500 to-teal-500' },
  INTERMEDIATE: { icon: TrendingUp, color: 'amber', label: 'Growth', gradient: 'from-amber-500 to-orange-500' },
  ADVANCED: { icon: Zap, color: 'rose', label: 'Mastery', gradient: 'from-rose-500 to-red-500' }
};

export function TargetAudienceStep({ formData, setFormData, validationErrors }: StepComponentProps) {
  // Real-time validation
  const audienceValidation = RealTimeValidator.validateAudienceAlignment(formData.targetAudience, formData.difficulty);

  const audienceIsValid = !!formData.targetAudience;

  // Alignment check
  const hasAlignmentWarning =
    (formData.difficulty === 'BEGINNER' && formData.targetAudience?.includes('Experienced')) ||
    (formData.difficulty === 'ADVANCED' && formData.targetAudience?.includes('beginners'));

  return (
    <div className="space-y-6">
      {/* Target Audience Selection */}
      <div className="space-y-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
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

      {/* Difficulty Level */}
      <div className="space-y-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
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

      {/* Estimated Duration */}
      <div className="space-y-3 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
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

      {/* Course Intent - Optional */}
      <div className="space-y-3 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
            <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Optional &bull; Enhance AI Recommendations
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
              <SelectValue placeholder="What&apos;s the main purpose of this course?" />
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

      {/* Pro Tips - Collapsible */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 w-full p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-left group">
            <Lightbulb className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Pro Tips</span>
            <ChevronDown className="h-4 w-4 ml-auto text-blue-400 transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-2 space-y-2">
            {[
              "Be specific about prerequisites - what should learners already know?",
              "Match difficulty to realistic learner expectations for better completion",
              "Consider duration carefully - shorter courses often have higher completion rates"
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
                <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0 text-blue-500" />
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
