"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { StepComponentProps, COURSE_CATEGORIES } from '../../types/sam-creator.types';
import { EnhancedInput, EnhancedTextarea, FormFieldWrapper } from '../ui/FormField';
import { Layers, Lightbulb, Sparkles, Wand2, ArrowRight, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

// Dynamic imports with SSR disabled to fix Radix UI hydration mismatch
// See: https://github.com/radix-ui/primitives/issues/3700
const SAMTitleGeneratorModal = dynamic(
  () => import('@/components/ai/sam-title-generator-modal').then(mod => mod.SAMTitleGeneratorModal),
  { ssr: false }
);
const SAMOverviewGeneratorModal = dynamic(
  () => import('@/components/ai/sam-overview-generator-modal').then(mod => mod.SAMOverviewGeneratorModal),
  { ssr: false }
);

export function CourseBasicsStep({ formData, setFormData, validationErrors }: StepComponentProps) {
  const categoryIsValid = !!formData.courseCategory;

  return (
    <div className="space-y-6">
      {/* Course Title */}
      <div className="space-y-3 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
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
              difficulty={formData.difficulty}
              onSelectTitle={(title) => setFormData(prev => ({ ...prev, courseTitle: title }))}
              disabled={!formData.courseTitle || formData.courseTitle.length < 5}
            />
          </div>
      </div>

      {/* Course Overview */}
      <div className="space-y-3 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
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
              difficulty={formData.difficulty}
              onSelectOverview={(overview) => setFormData(prev => ({ ...prev, courseShortOverview: overview }))}
              disabled={!formData.courseTitle || formData.courseTitle.length < 5}
            />
          </div>
      </div>

      {/* Category Section */}
      <div className="space-y-5 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
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

      {/* Pro Tips - Collapsible */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 w-full p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors text-left group">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Pro Tips</span>
            <ChevronDown className="h-4 w-4 ml-auto text-amber-400 transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-2 space-y-2">
            {[
              "Use specific, outcome-focused titles that tell learners what they&apos;ll achieve",
              "Write overviews that highlight the transformation students will experience",
              "Choose categories that match where your ideal students would search"
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
                <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0 text-amber-500" />
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
