"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StepComponentProps, COURSE_CATEGORIES, COURSE_INTENTS } from '../../types/sam-creator.types';

export function CourseBasicsStep({ formData, setFormData, validationErrors }: StepComponentProps) {


  return (
    <div className="space-y-6">

      {/* Course Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Course Title *</Label>
        <Input
          id="title"
          placeholder="e.g., Complete Web Development Bootcamp"
          value={formData.courseTitle}
          onChange={(e) => setFormData(prev => ({ ...prev, courseTitle: e.target.value }))}
          className="bg-white/50 dark:bg-slate-900/50 border-white/20 min-h-[44px] sm:min-h-[36px] touch-manipulation"
        />
      </div>

      {/* Course Overview */}
      <div className="space-y-2">
        <Label htmlFor="overview">Course Overview *</Label>
        <Textarea
          id="overview"
          placeholder="Describe what students will learn and achieve in this course..."
          value={formData.courseShortOverview}
          onChange={(e) => setFormData(prev => ({ ...prev, courseShortOverview: e.target.value }))}
          className="min-h-[120px] sm:min-h-[100px] bg-white/50 dark:bg-slate-900/50 border-white/20 touch-manipulation"
        />
      </div>

      {/* Category and Subcategory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Course Category *</Label>
          <Select
            value={formData.courseCategory}
            onValueChange={(value) => {
              setFormData(prev => ({ ...prev, courseCategory: value, courseSubcategory: '' }));
            }}
          >
            <SelectTrigger className="bg-white/50 dark:bg-slate-900/50 border-white/20 min-h-[44px] sm:min-h-[36px] touch-manipulation">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {COURSE_CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.courseCategory && (
          <div className="space-y-2">
            <Label>Subcategory</Label>
            <Select
              value={formData.courseSubcategory}
              onValueChange={(value) => setFormData(prev => ({ ...prev, courseSubcategory: value }))}
            >
              <SelectTrigger className="bg-white/50 dark:bg-slate-900/50 border-white/20 min-h-[44px] sm:min-h-[36px] touch-manipulation">
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                {COURSE_CATEGORIES
                  .find(cat => cat.value === formData.courseCategory)
                  ?.subcategories?.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  )) || []}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Course Intent */}
      <div className="space-y-2">
        <Label>Course Intent</Label>
        <Select
          value={formData.courseIntent}
          onValueChange={(value) => setFormData(prev => ({ ...prev, courseIntent: value }))}
        >
          <SelectTrigger className="bg-white/50 dark:bg-slate-900/50 border-white/20 min-h-[44px] sm:min-h-[36px] touch-manipulation">
            <SelectValue placeholder="What's the main purpose of this course?" />
          </SelectTrigger>
          <SelectContent>
            {COURSE_INTENTS.map((intent) => (
              <SelectItem key={intent} value={intent}>
                {intent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}