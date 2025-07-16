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
    <div className="space-y-6">
      {/* Target Audience */}
      <div className="space-y-2">
        <Label>Target Audience *</Label>
        <Select
          value={formData.targetAudience}
          onValueChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value }))}
        >
          <SelectTrigger className="bg-white/50 dark:bg-slate-900/50 border-white/20 min-h-[44px] sm:min-h-[36px] touch-manipulation">
            <SelectValue placeholder="Who is this course for?" />
          </SelectTrigger>
          <SelectContent>
            {TARGET_AUDIENCES.map((audience) => (
              <SelectItem key={audience} value={audience}>
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
        <div className="space-y-2">
          <Label htmlFor="customAudience">Describe Your Target Audience</Label>
          <Textarea
            id="customAudience"
            placeholder="Describe the specific audience for your course..."
            value={customAudience}
            onChange={(e) => setCustomAudience(e.target.value)}
            className="bg-white/50 dark:bg-slate-900/50 border-white/20 touch-manipulation min-h-[100px]"
          />
        </div>
      )}

      {/* Difficulty Level */}
      <div className="space-y-2">
        <Label>Difficulty Level *</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DIFFICULTY_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-all duration-200 backdrop-blur-sm",
                formData.difficulty === option.value
                  ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-300 dark:border-purple-600"
                  : "bg-white/30 dark:bg-slate-800/30 border-white/20 hover:bg-white/50 dark:hover:bg-slate-800/50"
              )}
              onClick={() => setFormData(prev => ({ ...prev, difficulty: option.value as any }))}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
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
      <div className="space-y-2">
        <Label>Estimated Duration</Label>
        <Select
          value={formData.duration}
          onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
        >
          <SelectTrigger className="bg-white/50 dark:bg-slate-900/50 border-white/20 min-h-[44px] sm:min-h-[36px] touch-manipulation">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((duration) => (
              <SelectItem key={duration} value={duration}>
                {duration}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audience Alignment Tips */}
      {formData.targetAudience && formData.difficulty && (
        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/30">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            💡 Audience & Difficulty Alignment
          </h4>
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
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