"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StepComponentProps } from '../../types/sam-creator.types';
import { Brain, Users, BookOpen, Target, Eye, ArrowRight, Trophy, Star, Sparkles, Clock, Coins, Zap, Layers, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CostEstimate } from '@/lib/sam/course-creation/cost-estimator';
import { formatEstimatedTime } from '@/lib/sam/course-creation/cost-estimator';
import { getTemplateForDifficulty } from '@/lib/sam/course-creation/chapter-templates';

export function AdvancedSettingsStep({ formData, setFormData, goToStep }: StepComponentProps) {
  // Format difficulty for display (capitalize properly)
  const formatDifficulty = (difficulty: string) => {
    const displayMap: Record<string, string> = {
      'BEGINNER': 'Beginner',
      'INTERMEDIATE': 'Intermediate',
      'ADVANCED': 'Advanced'
    };
    return displayMap[difficulty] || difficulty;
  };

  // Resolve Chapter DNA template based on difficulty
  const chapterTemplate = getTemplateForDifficulty(formData.difficulty.toLowerCase());
  const templateSections = chapterTemplate.sections;
  const effectiveSectionsPerChapter = chapterTemplate.totalSections;

  const isFormComplete =
    formData.courseTitle.length >= 10 &&
    formData.courseShortOverview.length >= 50 &&
    formData.courseCategory &&
    formData.targetAudience &&
    formData.courseGoals.length >= 2 &&
    formData.bloomsFocus.length >= 2;

  // =========================================================================
  // Cost Estimate
  // =========================================================================
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [costLoading, setCostLoading] = useState(false);
  const [costError, setCostError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track form values that affect cost in a ref for stable comparison
  const costParamsRef = useRef('');

  const fetchCostEstimate = useCallback(async (params: {
    totalChapters: number;
    sectionsPerChapter: number;
    difficulty: string;
    bloomsFocusCount: number;
    learningObjectivesPerChapter: number;
    learningObjectivesPerSection: number;
  }) => {
    setCostLoading(true);
    setCostError(false);
    try {
      const res = await fetch('/api/sam/course-creation/estimate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json() as { success: boolean; estimate?: CostEstimate };
      if (data.success && data.estimate) {
        setCostEstimate(data.estimate);
      } else {
        setCostError(true);
      }
    } catch {
      setCostError(true);
    } finally {
      setCostLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = {
      totalChapters: formData.chapterCount,
      sectionsPerChapter: effectiveSectionsPerChapter,
      difficulty: formData.difficulty.toLowerCase(),
      bloomsFocusCount: formData.bloomsFocus.length,
      learningObjectivesPerChapter: formData.learningObjectivesPerChapter,
      learningObjectivesPerSection: formData.learningObjectivesPerSection,
    };
    const key = JSON.stringify(params);

    // Skip if params haven't changed
    if (key === costParamsRef.current) return;
    costParamsRef.current = key;

    // Debounce 500ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCostEstimate(params);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    formData.chapterCount,
    formData.difficulty,
    formData.bloomsFocus.length,
    formData.learningObjectivesPerChapter,
    formData.learningObjectivesPerSection,
    effectiveSectionsPerChapter,
    fetchCostEstimate,
  ]);

  return (
    <div className="w-full">
      {/* Hero Section with Course Preview */}
      <Card className="p-4 sm:p-5 md:p-6 lg:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md mb-4 sm:mb-5 md:mb-6 rounded-xl sm:rounded-2xl">
        <div className="relative">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
              <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-slate-900 dark:text-slate-100" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-50">
                Course Preview
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Review your course details before generation
              </p>
            </div>
          </div>

          {/* Course Title & Overview */}
          <div className="mb-4 sm:mb-5 md:mb-6 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 break-words">
              {formData.courseTitle || 'Untitled Course'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed break-words">
              {formData.courseShortOverview || 'No description provided'}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">
                {formData.chapterCount}
              </div>
              <div className="text-[10px] xs:text-xs text-slate-600 dark:text-slate-400">
                Chapters
              </div>
            </div>
            
            <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">
                {formData.chapterCount * effectiveSectionsPerChapter}
              </div>
              <div className="text-[10px] xs:text-xs text-slate-600 dark:text-slate-400">
                Sections
              </div>
            </div>
            
            <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">
                {formData.courseGoals.length}
              </div>
              <div className="text-[10px] xs:text-xs text-slate-600 dark:text-slate-400">
                Objectives
              </div>
            </div>
            
            <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm overflow-hidden">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-xs sm:text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                {formatDifficulty(formData.difficulty)}
              </div>
              <div className="text-[10px] xs:text-xs text-slate-600 dark:text-slate-400">
                Level
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content - Course Details */}
      <div className="space-y-4 sm:space-y-5 md:space-y-6 mb-4 sm:mb-5 md:mb-6">
        {/* Course Information */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          {/* Basic Course Information */}
          <Card className="p-4 sm:p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-xl sm:rounded-2xl">
            <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-slate-900 dark:text-slate-100" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">Course Information</h3>
              </div>
              {goToStep && (
                <Button variant="ghost" size="sm" onClick={() => goToStep(1)}
                  className="text-xs text-slate-500 hover:text-indigo-600">
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <Label className="text-[10px] xs:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Category</Label>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {formData.courseCategory && (
                      <Badge className="backdrop-blur-sm bg-blue-600 border-2 border-blue-700 text-white font-semibold shadow-md text-xs sm:text-sm px-2.5 py-1">
                        {formData.courseCategory}
                      </Badge>
                    )}
                    {formData.courseSubcategory && (
                      <Badge variant="outline" className="backdrop-blur-sm bg-slate-100 dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-500 text-slate-800 dark:text-slate-100 font-medium text-xs sm:text-sm px-2.5 py-1">
                        {formData.courseSubcategory}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <Label className="text-[10px] xs:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Target Audience</Label>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 mt-2.5 break-words">
                    {formData.targetAudience || 'Not specified'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <Label className="text-[10px] xs:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Learning Intent</Label>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 mt-2.5 break-words">
                    {formData.courseIntent || 'Not specified'}
                  </p>
                </div>
                
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <Label className="text-[10px] xs:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Difficulty Level</Label>
                  <div className="flex items-center gap-2 mt-2.5">
                    <Badge className={cn(
                      "text-xs sm:text-sm px-2.5 py-1 border-2",
                      formData.difficulty === 'BEGINNER' && "bg-green-500/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600",
                      formData.difficulty === 'INTERMEDIATE' && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600",
                      formData.difficulty === 'ADVANCED' && "bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600"
                    )}>
                      {formatDifficulty(formData.difficulty)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Learning Objectives */}
          <Card className="p-4 sm:p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-xl sm:rounded-2xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-slate-900 dark:text-slate-100" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Learning Objectives ({formData.courseGoals.length})
                </h3>
              </div>
              {goToStep && (
                <Button variant="ghost" size="sm" onClick={() => goToStep(3)}
                  className="text-xs text-slate-500 hover:text-indigo-600">
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
              {formData.courseGoals.map((goal, index) => (
                <div key={index} className="p-3.5 sm:p-4 rounded-xl bg-white/70 dark:bg-slate-800/70 border-2 border-white/30 dark:border-slate-700/50 backdrop-blur-sm shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] xs:text-xs font-bold shadow-sm">
                      {index + 1}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words flex-1">
                      {goal}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          {/* Learning Framework */}
          <Card className="p-4 sm:p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-xl sm:rounded-2xl">
          <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-slate-900 dark:text-slate-100" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">Learning Framework</h3>
            </div>
            {goToStep && (
              <Button variant="ghost" size="sm" onClick={() => goToStep(3)}
                className="text-xs text-slate-500 hover:text-indigo-600">
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            )}
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <Label className="text-[10px] xs:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3 block">
                Bloom&apos;s Taxonomy Focus ({formData.bloomsFocus.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {formData.bloomsFocus.map((level) => (
                  <Badge key={level} className="bg-emerald-600 border-2 border-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md px-2.5 py-1">
                    {level}
                  </Badge>
                ))}
                {formData.bloomsFocus.length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No cognitive levels selected</p>
                )}
              </div>
            </div>
            
            <div className="p-3.5 sm:p-4 rounded-xl bg-white/60 dark:bg-slate-900/60 border-2 border-white/30 dark:border-slate-700/50 shadow-sm">
              <Label className="text-[10px] xs:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3 block">
                Content Types ({formData.preferredContentTypes.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {formData.preferredContentTypes.map((type) => (
                  <Badge key={type} variant="outline" className="bg-slate-200 dark:bg-slate-600 border-2 border-slate-400 dark:border-slate-500 text-slate-800 dark:text-slate-100 font-medium text-xs sm:text-sm px-2.5 py-1">
                    {type}
                  </Badge>
                ))}
                {formData.preferredContentTypes.length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No content types selected</p>
                )}
              </div>
            </div>
            
            <div className="p-3.5 sm:p-4 rounded-xl bg-white/60 dark:bg-slate-900/60 border-2 border-white/30 dark:border-slate-700/50 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <Label className="text-[10px] xs:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Include Assessments</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Quizzes, assignments, and progress tracking
                  </p>
                </div>
                <Switch
                  checked={formData.includeAssessments}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeAssessments: checked }))}
                  className="flex-shrink-0 sm:ml-3"
                />
              </div>
            </div>

            {/* Course Structure Summary */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-white/60 dark:bg-slate-900/60 border-2 border-white/30 dark:border-slate-700/50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-[10px] xs:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Course Structure
                </Label>
                <Badge className="bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-600 text-[10px] xs:text-xs px-2 py-0.5">
                  <Layers className="h-3 w-3 mr-1 inline" />
                  Chapter DNA
                </Badge>
              </div>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Chapters:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{formData.chapterCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Sections per Chapter:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{effectiveSectionsPerChapter}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Total Sections:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{formData.chapterCount * effectiveSectionsPerChapter}</span>
                </div>
              </div>

              {/* Chapter DNA Section Roles */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <Label className="text-[10px] xs:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                  {effectiveSectionsPerChapter}-Section Chapter DNA ({chapterTemplate.displayName})
                </Label>
                <div className={`grid grid-cols-2 ${effectiveSectionsPerChapter <= 8 ? 'sm:grid-cols-4' : 'sm:grid-cols-5'} gap-1.5`}>
                  {templateSections.map((sec, i) => (
                    <div
                      key={sec.role}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 w-3 text-center">{i + 1}</span>
                      <span className="text-[10px] xs:text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                        {sec.displayName.replace('THE ', '')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </Card>
        </div>
      </div>

      {/* Cost Estimate Preview */}
      <Card className="p-4 sm:p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-xl sm:rounded-2xl mb-4 sm:mb-5 md:mb-6">
        <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
              Generation Estimate
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Approximate cost and time for AI generation
            </p>
          </div>
        </div>

        {costLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        ) : costError ? (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
            Cost estimate unavailable
          </p>
        ) : costEstimate ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <div className="flex items-center justify-center mb-1.5">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-sm sm:text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">
                  {formatEstimatedTime(costEstimate.estimatedTimeSeconds)}
                </div>
                <div className="text-[10px] xs:text-xs text-slate-500 dark:text-slate-400">
                  Est. Time
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <div className="flex items-center justify-center mb-1.5">
                  <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-sm sm:text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">
                  {costEstimate.totalAICalls}
                </div>
                <div className="text-[10px] xs:text-xs text-slate-500 dark:text-slate-400">
                  AI Calls
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <div className="flex items-center justify-center mb-1.5">
                  <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-sm sm:text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">
                  ${costEstimate.estimatedCostUSD.toFixed(2)}
                </div>
                <div className="text-[10px] xs:text-xs text-slate-500 dark:text-slate-400">
                  Est. Cost
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <div className="flex items-center justify-center mb-1.5">
                  <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  {costEstimate.provider}
                </div>
                <div className="text-[10px] xs:text-xs text-slate-500 dark:text-slate-400">
                  Provider
                </div>
              </div>
            </div>

            <div className="text-[10px] xs:text-xs text-slate-400 dark:text-slate-500 text-center">
              Includes ~{costEstimate.breakdown.retryOverheadPercent}% retry overhead.
              Actual cost depends on AI response length and retries.
            </div>
          </div>
        ) : null}
      </Card>

      {/* Generation Status */}
      <Card className="p-4 sm:p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-xl sm:rounded-2xl">
        <div className="relative">
          <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
            <div className={cn(
              "p-2 sm:p-2.5 md:p-3 rounded-xl shadow-sm",
              isFormComplete
                ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200"
                : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-200"
            )}>
              {isFormComplete ? (
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 break-words">
                {isFormComplete ? 'Ready to Generate!' : 'Almost Ready...'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 break-words mt-1">
                {isFormComplete 
                  ? 'Your course information is complete and ready for AI generation.'
                  : 'Complete a few more fields to enable course generation.'}
              </p>
            </div>
          </div>
          
          {!isFormComplete && (
            <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-300 mb-2.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Complete these requirements:</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {formData.courseTitle.length < 10 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs text-amber-600 dark:text-amber-400">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                    <span className="break-words">Course title (at least 10 characters)</span>
                  </div>
                )}
                {formData.courseShortOverview.length < 50 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs text-amber-600 dark:text-amber-400">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                    <span className="break-words">Course overview (at least 50 characters)</span>
                  </div>
                )}
                {!formData.courseCategory && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs text-amber-600 dark:text-amber-400">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                    <span className="break-words">Course category</span>
                  </div>
                )}
                {!formData.targetAudience && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs text-amber-600 dark:text-amber-400">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                    <span className="break-words">Target audience</span>
                  </div>
                )}
                {formData.courseGoals.length < 2 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs text-amber-600 dark:text-amber-400">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                    <span className="break-words">At least 2 learning objectives</span>
                  </div>
                )}
                {formData.bloomsFocus.length < 2 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs text-amber-600 dark:text-amber-400">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                    <span className="break-words">At least 2 cognitive levels</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
