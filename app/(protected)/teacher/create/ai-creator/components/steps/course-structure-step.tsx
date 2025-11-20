"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { StepComponentProps, BLOOMS_LEVELS, CONTENT_TYPES } from '../../types/sam-creator.types';
import { BookOpen, Target, Brain } from 'lucide-react';

export function CourseStructureStep({ formData, setFormData, validationErrors }: StepComponentProps) {
  const addGoal = (goal: string) => {
    if (goal.trim() && Array.isArray(formData.courseGoals) && !formData.courseGoals.includes(goal.trim())) {
      setFormData(prev => ({
        ...prev,
        courseGoals: [...(prev.courseGoals || []), goal.trim()]
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

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Course Structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        <div className="space-y-3 sm:space-y-4 p-4 sm:p-5 bg-white/60 dark:bg-slate-800/60 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <Label className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
              Number of Chapters: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{formData.chapterCount}</span>
            </Label>
          </div>
          <Slider
            value={[formData.chapterCount]}
            onValueChange={(value) => setFormData(prev => ({ ...prev, chapterCount: value[0] }))}
            max={20}
            min={3}
            step={1}
            className="w-full"
          />
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg">
            💡 Recommended: 5-10 chapters for optimal learning progression
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4 p-4 sm:p-5 bg-white/60 dark:bg-slate-800/60 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <Label className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
              Sections per Chapter: <span className="text-purple-600 dark:text-purple-400 font-bold">{formData.sectionsPerChapter}</span>
            </Label>
          </div>
          <Slider
            value={[formData.sectionsPerChapter]}
            onValueChange={(value) => setFormData(prev => ({ ...prev, sectionsPerChapter: value[0] }))}
            max={8}
            min={2}
            step={1}
            className="w-full"
          />
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg">
            💡 Recommended: 3-5 sections per chapter for digestible content
          </div>
        </div>
      </div>

      {/* Learning Objectives Section */}
      <div className="space-y-3">
        <Label className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <span>Learning Objectives</span>
          <span className="text-red-500">*</span>
        </Label>
        <Textarea
          placeholder="What will students be able to do after completing this course? (Press Enter to add each goal)"
          className="min-h-[120px] sm:min-h-[100px] bg-white/80 dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 text-sm sm:text-base px-4 py-3 touch-manipulation shadow-sm hover:shadow-md resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const target = e.target as HTMLTextAreaElement;
              addGoal(target.value);
              target.value = '';
            }
          }}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">Press Enter to add each goal (minimum 2 required)</p>
        
        {formData.courseGoals.length > 0 && (
          <div className="space-y-2.5 mt-4">
            <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Current Goals ({formData.courseGoals.length}):</div>
            <div className="flex flex-wrap gap-2">
              {formData.courseGoals.map((goal, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 text-xs sm:text-sm px-3 py-1.5 border-2 border-transparent hover:border-red-300 dark:hover:border-red-700 rounded-lg"
                  onClick={() => removeGoal(index)}
                >
                  {goal} <span className="ml-1.5 text-red-500 font-bold">×</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bloom's Taxonomy Focus Section */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
          </div>
          <Label className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <span>Bloom&rsquo;s Taxonomy Focus</span>
            <span className="text-red-500">*</span>
          </Label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BLOOMS_LEVELS.map((level) => (
            <div
              key={level.value}
              className={cn(
                "p-3.5 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md",
                formData.bloomsFocus.includes(level.value)
                  ? "bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 border-green-400 dark:border-green-500 ring-2 ring-green-500/30 dark:ring-green-400/30 scale-[1.02]"
                  : "bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-green-300 dark:hover:border-green-600"
              )}
              onClick={() => toggleBloomsLevel(level.value)}
            >
              <div className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100 mb-1.5">{level.label}</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {level.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Types */}
      <div className="space-y-3 sm:space-y-4">
        <Label className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">Preferred Content Types</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CONTENT_TYPES.map((type) => (
            <div
              key={type.value}
              className={cn(
                "p-3.5 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 backdrop-blur-sm flex items-center gap-3 shadow-sm hover:shadow-md",
                formData.preferredContentTypes.includes(type.value)
                  ? "bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-indigo-500/20 border-blue-400 dark:border-blue-500 ring-2 ring-blue-500/30 dark:ring-blue-400/30 scale-[1.02]"
                  : "bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-blue-300 dark:hover:border-blue-600"
              )}
              onClick={() => toggleContentType(type.value)}
            >
              <span className="text-xl sm:text-2xl">{type.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100">{type.label}</div>
              </div>
              <Checkbox
                checked={formData.preferredContentTypes.includes(type.value)}
                className="ml-auto"
                disabled
              />
            </div>
          ))}
        </div>
      </div>

      {/* Include Assessments */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/60 dark:from-blue-900/30 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-blue-200/50 dark:border-blue-700/30 shadow-sm">
        <div className="flex-1">
          <Label className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">Include Assessments</Label>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5">
            Quizzes, assignments, and progress tracking throughout the course
          </p>
        </div>
        <Switch
          checked={formData.includeAssessments}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeAssessments: checked }))}
          className="flex-shrink-0"
        />
      </div>

      {/* Course Structure Preview */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-purple-50/80 via-indigo-50/60 to-blue-50/60 dark:from-purple-900/30 dark:via-indigo-900/20 dark:to-blue-900/20 rounded-xl border-2 border-purple-200/50 dark:border-purple-700/30 shadow-sm">
        <h4 className="text-sm sm:text-base font-semibold mb-3.5 flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
          Course Structure Preview
        </h4>
        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-base">📚</span>
            <span>{formData.chapterCount} chapters × {formData.sectionsPerChapter} sections = <strong>{formData.chapterCount * formData.sectionsPerChapter} total lessons</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <span><strong>{formData.courseGoals.length}</strong> learning objectives defined</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🧠</span>
            <span><strong>{formData.bloomsFocus.length}</strong> cognitive levels targeted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">📝</span>
            <span><strong>{formData.preferredContentTypes.length}</strong> content types selected</span>
          </div>
          {formData.includeAssessments && (
            <div className="flex items-center gap-2">
              <span className="text-base">✅</span>
              <span>Assessments included for progress tracking</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}