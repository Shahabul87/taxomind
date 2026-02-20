"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { StepComponentProps, BLOOMS_LEVELS, CONTENT_TYPES } from '../../types/sam-creator.types';
import { FormFieldWrapper } from '../ui/FormField';
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
  ChevronDown
} from 'lucide-react';
import { getMinimumSectionsForDifficulty, getTemplateForDifficulty } from '@/lib/sam/course-creation/chapter-templates';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

// Dynamic import with SSR disabled to fix Radix UI hydration mismatch
// See: https://github.com/radix-ui/primitives/issues/3700
const SAMLearningObjectivesGeneratorModal = dynamic(
  () => import('@/components/ai/sam-learning-objectives-generator-modal').then(mod => mod.SAMLearningObjectivesGeneratorModal),
  { ssr: false }
);

export function CourseStructureStep({ formData, setFormData, validationErrors }: StepComponentProps) {
  const [newGoal, setNewGoal] = useState('');
  const chapterTemplate = getTemplateForDifficulty(formData.difficulty?.toLowerCase() ?? 'intermediate');
  const minimumSections = getMinimumSectionsForDifficulty(formData.difficulty?.toLowerCase() ?? 'intermediate');

  useEffect(() => {
    if (formData.sectionsPerChapter >= minimumSections) return;
    setFormData(prev => ({
      ...prev,
      sectionsPerChapter: minimumSections,
    }));
  }, [formData.sectionsPerChapter, minimumSections, setFormData]);

  const addGoal = (goal: string) => {
    if (goal.trim() && Array.isArray(formData.courseGoals) && !formData.courseGoals.includes(goal.trim())) {
      setFormData(prev => ({
        ...prev,
        courseGoals: [...(prev.courseGoals || []), goal.trim()]
      }));
      setNewGoal('');
    }
  };

  const addMultipleGoals = (goals: string[]) => {
    const existingGoals = formData.courseGoals || [];
    const newGoals = goals.filter(goal =>
      goal.trim() && !existingGoals.includes(goal.trim())
    );
    if (newGoals.length > 0) {
      setFormData(prev => ({
        ...prev,
        courseGoals: [...(prev.courseGoals || []), ...newGoals]
      }));
    }
  };

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      courseGoals: Array.isArray(prev.courseGoals) ? prev.courseGoals.filter((_, i) => i !== index) : []
    }));
  };

  const toggleBloomsLevel = (level: string) => {
    setFormData(prev => ({
      ...prev,
      bloomsFocus: Array.isArray(prev.bloomsFocus)
        ? (prev.bloomsFocus.includes(level)
          ? prev.bloomsFocus.filter(l => l !== level)
          : [...prev.bloomsFocus, level])
        : [level]
    }));
  };

  const toggleContentType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      preferredContentTypes: Array.isArray(prev.preferredContentTypes)
        ? (prev.preferredContentTypes.includes(type)
          ? prev.preferredContentTypes.filter(t => t !== type)
          : [...prev.preferredContentTypes, type])
        : [type]
    }));
  };

  const goalsIsValid = Array.isArray(formData.courseGoals) && formData.courseGoals.length >= 2;
  const bloomsIsValid = Array.isArray(formData.bloomsFocus) && formData.bloomsFocus.length >= 2;
  const totalLessons = formData.chapterCount * formData.sectionsPerChapter;

  return (
    <div className="space-y-6">
      {/* Course Structure Sliders */}
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
            {chapterTemplate.displayName} requires at least {minimumSections} sections to preserve all required pedagogy. Your selection of {formData.sectionsPerChapter} sections remains authoritative above that minimum.
          </div>
        </div>
      </div>

      {/* Learning Objectives Count Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Learning Objectives per Chapter */}
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

        {/* Learning Objectives per Section */}
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
        <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400 text-center space-y-1">
          <div>
            AI will make <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.chapterCount + totalLessons + totalLessons}</span> generation calls
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            {formData.chapterCount} chapters (description + objectives) + {totalLessons} sections + {totalLessons} section details (description, objectives &amp; guidelines)
          </div>
        </div>
      </div>

      {/* Bloom's Taxonomy Focus Section — select cognitive levels BEFORE generating objectives */}
      <FormFieldWrapper
        label="Bloom&apos;s Taxonomy focus"
        required
        tooltip="Select cognitive levels to target. Higher levels (Analyze, Evaluate, Create) lead to deeper learning but require more foundational knowledge first. Select these BEFORE generating learning objectives so the AI uses them as context."
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
      </FormFieldWrapper>

      {/* Learning Objectives Section — generated AFTER Bloom's levels are selected */}
      <FormFieldWrapper
        label="Learning objectives"
        required
        tooltip="What will students be able to do after completing this course? Use action verbs like 'Build', 'Create', 'Analyze', 'Design'. The AI generator uses your Bloom&apos;s Taxonomy selection above for better-aligned objectives."
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
            {/* AI Learning Objectives Generator Button */}
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

      {/* Content Types */}
      <FormFieldWrapper
        label="Preferred content types"
        tooltip="Select the types of content you want to include. Mix different types for varied learning experiences."
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

      {/* Tips - Collapsible */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 w-full p-3 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/30 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors text-left group">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-700 dark:text-violet-300">Pro Tips</span>
            <ChevronDown className="h-4 w-4 ml-auto text-violet-400 transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-2 space-y-2">
            {[
              "Start with concrete, measurable objectives using action verbs",
              "Build from lower Bloom\u2019s levels (Remember, Understand) to higher ones (Analyze, Create)",
              "Mix content types to accommodate different learning styles"
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-violet-700 dark:text-violet-300">
                <Target className="h-3 w-3 mt-1 flex-shrink-0 text-violet-500" />
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
