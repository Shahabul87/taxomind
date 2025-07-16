"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StepComponentProps } from '../../types/sam-creator.types';
import { Brain, Users, BookOpen, Target, Eye, ArrowRight, Trophy, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdvancedSettingsStep({ formData, setFormData }: StepComponentProps) {

  const isFormComplete = 
    formData.courseTitle.length >= 10 &&
    formData.courseShortOverview.length >= 50 &&
    formData.courseCategory &&
    formData.targetAudience &&
    formData.courseGoals.length >= 2 &&
    formData.bloomsFocus.length >= 2;

  return (
    <div className="w-full">
      {/* Hero Section with Course Preview */}
      <Card className="p-6 md:p-8 backdrop-blur-md bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-white/20 shadow-xl relative overflow-hidden mb-6">
        {/* Background Orbs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-xl transform -translate-x-12 translate-y-12"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Course Preview
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Review your course details before generation
              </p>
            </div>
          </div>

          {/* Course Title & Overview */}
          <div className="mb-6 p-4 rounded-xl bg-white/30 dark:bg-slate-800/30 border border-white/20 backdrop-blur-sm">
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {formData.courseTitle || 'Untitled Course'}
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {formData.courseShortOverview || 'No description provided'}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/20 backdrop-blur-sm text-center">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {formData.chapterCount}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Chapters
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/20 backdrop-blur-sm text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {formData.chapterCount * formData.sectionsPerChapter}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Sections
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/20 backdrop-blur-sm text-center">
              <div className="flex items-center justify-center mb-2">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {formData.courseGoals.length}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Objectives
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/20 backdrop-blur-sm text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {formData.difficulty}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Level
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content - Course Details */}
      <div className="space-y-6 mb-6">
        {/* Course Information */}
        <div className="space-y-6">
          {/* Basic Course Information */}
          <Card className="p-6 backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Course Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/20">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Category</Label>
                  <div className="flex gap-2 mt-2">
                    {formData.courseCategory && (
                      <Badge className="backdrop-blur-sm bg-blue-600 border border-blue-700 text-white font-semibold shadow-lg">
                        {formData.courseCategory}
                      </Badge>
                    )}
                    {formData.courseSubcategory && (
                      <Badge variant="outline" className="backdrop-blur-sm bg-slate-100 dark:bg-slate-700 border-slate-400 dark:border-slate-500 text-slate-800 dark:text-slate-100 font-medium">
                        {formData.courseSubcategory}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/20">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Target Audience</Label>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-2">
                    {formData.targetAudience || 'Not specified'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/20">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Learning Intent</Label>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-2">
                    {formData.courseIntent || 'Not specified'}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/20">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Difficulty Level</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={cn(
                      "text-xs",
                      formData.difficulty === 'BEGINNER' && "bg-green-500/20 text-green-700 dark:text-green-300 border-green-300",
                      formData.difficulty === 'INTERMEDIATE' && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-300",
                      formData.difficulty === 'ADVANCED' && "bg-red-500/20 text-red-700 dark:text-red-300 border-red-300"
                    )}>
                      {formData.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Learning Objectives */}
          <Card className="p-6 backdrop-blur-md bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-white/20 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
                <Target className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Learning Objectives ({formData.courseGoals.length})
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {formData.courseGoals.map((goal, index) => (
                <div key={index} className="p-4 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-white/20 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {goal}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          {/* Learning Framework */}
          <Card className="p-6 backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20">
              <Brain className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Learning Framework</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/20">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3 block">
                Bloom&apos;s Taxonomy Focus ({formData.bloomsFocus.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {formData.bloomsFocus.map((level) => (
                  <Badge key={level} className="bg-emerald-600 border border-emerald-700 text-white font-semibold text-xs shadow-lg">
                    {level}
                  </Badge>
                ))}
                {formData.bloomsFocus.length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No cognitive levels selected</p>
                )}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/20">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3 block">
                Content Types ({formData.preferredContentTypes.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {formData.preferredContentTypes.map((type) => (
                  <Badge key={type} variant="outline" className="bg-slate-200 dark:bg-slate-600 border-slate-400 dark:border-slate-500 text-slate-800 dark:text-slate-100 font-medium text-xs">
                    {type}
                  </Badge>
                ))}
                {formData.preferredContentTypes.length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No content types selected</p>
                )}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Include Assessments</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Quizzes, assignments, and progress tracking
                  </p>
                </div>
                <Switch
                  checked={formData.includeAssessments}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeAssessments: checked }))}
                  className="ml-3"
                />
              </div>
            </div>

            {/* Course Structure Summary */}
            <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-white/20">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3 block">
                Course Structure
              </Label>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Chapters:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{formData.chapterCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Sections per Chapter:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{formData.sectionsPerChapter}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Total Sections:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{formData.chapterCount * formData.sectionsPerChapter}</span>
                </div>
              </div>
            </div>
          </div>
          </Card>
        </div>
      </div>

      {/* Generation Status */}
      <Card className={cn(
        "p-6 backdrop-blur-md border border-white/20 shadow-xl relative overflow-hidden",
        isFormComplete 
          ? "bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10"
          : "bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10"
      )}>
        {/* Background Orb */}
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 rounded-full blur-xl transform translate-x-16 -translate-y-16",
          isFormComplete 
            ? "bg-gradient-to-br from-green-400/20 to-emerald-400/20"
            : "bg-gradient-to-br from-amber-400/20 to-orange-400/20"
        )}></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              "p-3 rounded-xl",
              isFormComplete 
                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                : "bg-gradient-to-r from-amber-500 to-orange-500"
            )}>
              {isFormComplete ? (
                <Trophy className="h-6 w-6 text-white" />
              ) : (
                <Sparkles className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {isFormComplete ? 'Ready to Generate!' : 'Almost Ready...'}
              </h4>
              <p className="text-slate-600 dark:text-slate-400">
                {isFormComplete 
                  ? 'Your course information is complete and ready for AI generation.'
                  : 'Complete a few more fields to enable course generation.'}
              </p>
            </div>
          </div>
          
          {!isFormComplete && (
            <div className="p-4 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/20 backdrop-blur-sm">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Complete these requirements:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {formData.courseTitle.length < 10 && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    Course title (at least 10 characters)
                  </div>
                )}
                {formData.courseShortOverview.length < 50 && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    Course overview (at least 50 characters)
                  </div>
                )}
                {!formData.courseCategory && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    Course category
                  </div>
                )}
                {!formData.targetAudience && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    Target audience
                  </div>
                )}
                {formData.courseGoals.length < 2 && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    At least 2 learning objectives
                  </div>
                )}
                {formData.bloomsFocus.length < 2 && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    At least 2 cognitive levels
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