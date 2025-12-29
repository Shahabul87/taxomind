"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StepComponentProps, COURSE_CATEGORIES, COURSE_INTENTS } from '../../types/sam-creator.types';
import { EnhancedInput, EnhancedTextarea, FormFieldWrapper } from '../ui/FormField';
import { BookOpen, Layers, Target, Lightbulb, CheckCircle2, Sparkles, Wand2, ArrowRight } from 'lucide-react';
import { SAMTitleGeneratorModal } from '@/components/ai/sam-title-generator-modal';
import { SAMOverviewGeneratorModal } from '@/components/ai/sam-overview-generator-modal';

export function CourseBasicsStep({ formData, setFormData, validationErrors }: StepComponentProps) {
  const titleIsValid = (formData.courseTitle?.length || 0) >= 10;
  const overviewIsValid = (formData.courseShortOverview?.length || 0) >= 50;
  const categoryIsValid = !!formData.courseCategory;

  const completedFields = [titleIsValid, overviewIsValid, categoryIsValid].filter(Boolean).length;
  const totalRequired = 3;
  const progressPercentage = (completedFields / totalRequired) * 100;

  return (
    <div className="space-y-8">
      {/* Premium Progress Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-slate-50/60 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900/50 border border-indigo-200/30 dark:border-indigo-800/30 p-5">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-indigo-500/30 blur-md -z-10" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                Course Foundation
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Define the core identity of your course
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Animated step indicators */}
            <div className="flex items-center gap-1.5">
              {[titleIsValid, overviewIsValid, categoryIsValid].map((isValid, i) => (
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
              "bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Course Title - Premium Card */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative space-y-3 p-5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-700/30 backdrop-blur-sm transition-all duration-300 group-hover:border-indigo-300/50 dark:group-hover:border-indigo-700/50 group-hover:shadow-lg group-hover:shadow-indigo-500/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
              <Wand2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Required • Step 1 of 3
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

          {/* AI Title Generator Button */}
          <div className="flex justify-end mt-3">
            <SAMTitleGeneratorModal
              currentTitle={formData.courseTitle || ''}
              courseOverview={formData.courseShortOverview}
              courseCategory={formData.courseCategory}
              courseSubcategory={formData.courseSubcategory}
              courseIntent={formData.courseIntent}
              targetAudience={formData.targetAudience}
              onSelectTitle={(title) => setFormData(prev => ({ ...prev, courseTitle: title }))}
              disabled={!formData.courseTitle || formData.courseTitle.length < 5}
            />
          </div>
        </div>
      </div>

      {/* Course Overview - Premium Card */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative space-y-3 p-5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-700/30 backdrop-blur-sm transition-all duration-300 group-hover:border-purple-300/50 dark:group-hover:border-purple-700/50 group-hover:shadow-lg group-hover:shadow-purple-500/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Required • Step 2 of 3
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

          {/* AI Overview Generator Button */}
          <div className="flex justify-end mt-3">
            <SAMOverviewGeneratorModal
              courseTitle={formData.courseTitle || ''}
              currentOverview={formData.courseShortOverview}
              courseCategory={formData.courseCategory}
              courseSubcategory={formData.courseSubcategory}
              courseIntent={formData.courseIntent}
              targetAudience={formData.targetAudience}
              onSelectOverview={(overview) => setFormData(prev => ({ ...prev, courseShortOverview: overview }))}
              disabled={!formData.courseTitle || formData.courseTitle.length < 5}
            />
          </div>
        </div>
      </div>

      {/* Category Section - Premium Card */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative space-y-5 p-5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-700/30 backdrop-blur-sm transition-all duration-300 group-hover:border-emerald-300/50 dark:group-hover:border-emerald-700/50 group-hover:shadow-lg group-hover:shadow-emerald-500/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
              <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Required • Step 3 of 3
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormFieldWrapper
              label="Course category"
              required
              tooltip="Select the primary category that best matches your course content. This helps students find your course."
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
                <SelectContent className="rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="p-1">
                    {COURSE_CATEGORIES.map((category) => (
                      <SelectItem
                        key={category.value}
                        value={category.value}
                        className="text-sm sm:text-base py-3 px-3 cursor-pointer rounded-lg transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/30 focus:bg-emerald-50 dark:focus:bg-emerald-950/30 my-0.5"
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
                              className="text-sm sm:text-base py-2.5 px-3 cursor-pointer rounded-lg transition-all hover:bg-indigo-50 dark:hover:bg-indigo-950/30 my-0.5"
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
      </div>

      {/* Course Intent - Optional Section */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative space-y-3 p-5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-700/30 backdrop-blur-sm transition-all duration-300 group-hover:border-amber-300/50 dark:group-hover:border-amber-700/50 group-hover:shadow-lg group-hover:shadow-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Optional • Enhance AI Recommendations
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
      </div>

      {/* Pro Tips Card - Premium Design */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-yellow-50/60 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/20 border border-amber-200/50 dark:border-amber-800/30 p-5">
        {/* Decorative sparkles */}
        <div className="absolute top-3 right-3 text-amber-400/40">
          <Sparkles className="h-20 w-20" />
        </div>

        <div className="relative flex items-start gap-4">
          <div className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-amber-900 dark:text-amber-100 mb-3">
              Pro Tips for a Great Foundation
            </h4>
            <ul className="space-y-3">
              {[
                "Use specific, outcome-focused titles that tell learners what they'll achieve",
                "Write overviews that highlight the transformation students will experience",
                "Choose categories that match where your ideal students would search"
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-amber-800 dark:text-amber-200">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-amber-200/80 dark:bg-amber-800/50 flex items-center justify-center">
                      <ArrowRight className="h-3 w-3 text-amber-700 dark:text-amber-300" />
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
