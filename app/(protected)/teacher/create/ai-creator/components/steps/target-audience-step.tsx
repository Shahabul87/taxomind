"use client";

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { StepComponentProps, DIFFICULTY_OPTIONS, DURATION_OPTIONS, TARGET_AUDIENCES } from '../../types/sam-creator.types';
import { ValidationMessageComponent } from '@/components/ui/validation-message';
import { RealTimeValidator } from '@/lib/course-analytics';

export function TargetAudienceStep({ formData, setFormData, validationErrors }: StepComponentProps) {
  const [customAudience, setCustomAudience] = useState('');
  
  // Real-time validation
  const audienceValidation = RealTimeValidator.validateAudienceAlignment(formData.targetAudience, formData.difficulty);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Target Audience */}
      <div className="space-y-2.5">
        <Label className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <span>Target Audience</span>
          <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.targetAudience}
          onValueChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value }))}
        >
          <SelectTrigger className="h-12 sm:h-11 bg-white/80 dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 text-sm sm:text-base px-4 touch-manipulation shadow-sm hover:shadow-md">
            <SelectValue placeholder="Who is this course for?" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-xl">
            {TARGET_AUDIENCES.map((audience) => (
              <SelectItem key={audience} value={audience} className="text-sm sm:text-base py-2.5">
                {audience}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {audienceValidation && (
          <ValidationMessageComponent validation={audienceValidation} compact />
        )}
      </div>

      {/* Custom Audience Description */}
      {formData.targetAudience === 'Custom (describe below)' && (
        <div className="space-y-2.5">
          <Label htmlFor="customAudience" className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">Describe Your Target Audience</Label>
          <Textarea
            id="customAudience"
            placeholder="Describe the specific audience for your course..."
            value={customAudience}
            onChange={(e) => setCustomAudience(e.target.value)}
            className="min-h-[120px] sm:min-h-[100px] bg-white/80 dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 text-sm sm:text-base px-4 py-3 touch-manipulation shadow-sm hover:shadow-md resize-none"
          />
        </div>
      )}

      {/* Difficulty Level */}
      <div className="space-y-3">
        <Label className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <span>Difficulty Level</span>
          <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DIFFICULTY_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={cn(
                "p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md",
                formData.difficulty === option.value
                  ? "bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20 border-purple-400 dark:border-purple-500 ring-2 ring-purple-500/30 dark:ring-purple-400/30 scale-[1.02]"
                  : "bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-purple-300 dark:hover:border-purple-600"
              )}
              onClick={() => setFormData(prev => ({ ...prev, difficulty: option.value as any }))}
            >
              <div className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100 mb-1.5">{option.label}</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {option.description}
              </div>
            </div>
          ))}
        </div>
        {audienceValidation && (
          <ValidationMessageComponent validation={audienceValidation} compact />
        )}
      </div>

      {/* Estimated Duration */}
      <div className="space-y-2.5">
        <Label className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">Estimated Duration</Label>
        <Select
          value={formData.duration}
          onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
        >
          <SelectTrigger className="h-12 sm:h-11 bg-white/80 dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 text-sm sm:text-base px-4 touch-manipulation shadow-sm hover:shadow-md">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-xl">
            {DURATION_OPTIONS.map((duration) => (
              <SelectItem key={duration} value={duration} className="text-sm sm:text-base py-2.5">
                {duration}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audience Alignment Tips */}
      {formData.targetAudience && formData.difficulty && (
        <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/60 dark:from-blue-900/30 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-blue-200/50 dark:border-blue-700/30 shadow-sm">
          <h4 className="text-sm sm:text-base font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span>Audience & Difficulty Alignment</span>
          </h4>
          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
            {formData.difficulty === 'BEGINNER' && formData.targetAudience.includes('Complete beginners') && 
              "Perfect match! Your beginner-level course aligns well with complete beginners."
            }
            {formData.difficulty === 'INTERMEDIATE' && formData.targetAudience.includes('basic foundational') && 
              "Great alignment! Intermediate difficulty suits students with basic knowledge."
            }
            {formData.difficulty === 'ADVANCED' && formData.targetAudience.includes('Experienced practitioners') && 
              "Excellent match! Advanced content is perfect for experienced learners."
            }
            {formData.difficulty === 'BEGINNER' && formData.targetAudience.includes('Experienced practitioners') && 
              "Consider reviewing: Beginner content might be too basic for experienced practitioners."
            }
            {formData.difficulty === 'ADVANCED' && formData.targetAudience.includes('Complete beginners') && 
              "Consider reviewing: Advanced content might be challenging for complete beginners."
            }
          </p>
        </div>
      )}
    </div>
  );
}