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
    <div className="space-y-6">
      {/* Course Structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <Label>Number of Chapters: {formData.chapterCount}</Label>
          </div>
          <Slider
            value={[formData.chapterCount]}
            onValueChange={(value) => setFormData(prev => ({ ...prev, chapterCount: value[0] }))}
            max={20}
            min={3}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Recommended: 5-10 chapters for optimal learning progression
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-600" />
            <Label>Sections per Chapter: {formData.sectionsPerChapter}</Label>
          </div>
          <Slider
            value={[formData.sectionsPerChapter]}
            onValueChange={(value) => setFormData(prev => ({ ...prev, sectionsPerChapter: value[0] }))}
            max={8}
            min={2}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Recommended: 3-5 sections per chapter for digestible content
          </div>
        </div>
      </div>

      {/* Learning Objectives Section */}
      <div className="space-y-3">
        <Label>Learning Objectives</Label>
        <Textarea
          placeholder="What will students be able to do after completing this course? (Press Enter to add each goal)"
          className="bg-white/50 dark:bg-slate-900/50 border-white/20 touch-manipulation min-h-[100px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const target = e.target as HTMLTextAreaElement;
              addGoal(target.value);
              target.value = '';
            }
          }}
        />
        
        {formData.courseGoals.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Goals:</div>
            <div className="flex flex-wrap gap-2">
              {formData.courseGoals.map((goal, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                  onClick={() => removeGoal(index)}
                >
                  {goal} ×
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bloom's Taxonomy Focus Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-green-600" />
          <Label>Bloom&rsquo;s Taxonomy Focus</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {BLOOMS_LEVELS.map((level) => (
            <div
              key={level.value}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all duration-200 backdrop-blur-sm",
                formData.bloomsFocus.includes(level.value)
                  ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-300 dark:border-green-600"
                  : "bg-white/30 dark:bg-slate-800/30 border-white/20 hover:bg-white/50 dark:hover:bg-slate-800/50"
              )}
              onClick={() => toggleBloomsLevel(level.value)}
            >
              <div className="font-medium text-sm">{level.label}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {level.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Types */}
      <div className="space-y-4">
        <Label>Preferred Content Types</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CONTENT_TYPES.map((type) => (
            <div
              key={type.value}
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-all duration-200 backdrop-blur-sm flex items-center gap-3",
                formData.preferredContentTypes.includes(type.value)
                  ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-300 dark:border-blue-600"
                  : "bg-white/30 dark:bg-slate-800/30 border-white/20 hover:bg-white/50 dark:hover:bg-slate-800/50"
              )}
              onClick={() => toggleContentType(type.value)}
            >
              <span className="text-lg">{type.icon}</span>
              <div>
                <div className="font-medium text-sm">{type.label}</div>
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
      <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/30">
        <div>
          <Label className="text-sm font-medium">Include Assessments</Label>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Quizzes, assignments, and progress tracking throughout the course
          </p>
        </div>
        <Switch
          checked={formData.includeAssessments}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeAssessments: checked }))}
        />
      </div>

      {/* Course Structure Preview */}
      <div className="p-4 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200/50 dark:border-purple-700/30">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-purple-600" />
          Course Structure Preview
        </h4>
        <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
          <div>📚 {formData.chapterCount} chapters × {formData.sectionsPerChapter} sections = {formData.chapterCount * formData.sectionsPerChapter} total lessons</div>
          <div>🎯 {formData.courseGoals.length} learning objectives defined</div>
          <div>🧠 {formData.bloomsFocus.length} cognitive levels targeted</div>
          <div>📝 {formData.preferredContentTypes.length} content types selected</div>
          {formData.includeAssessments && <div>✅ Assessments included for progress tracking</div>}
        </div>
      </div>
    </div>
  );
}