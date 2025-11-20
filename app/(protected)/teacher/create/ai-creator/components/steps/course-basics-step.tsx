"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StepComponentProps, COURSE_CATEGORIES, COURSE_INTENTS } from '../../types/sam-creator.types';

export function CourseBasicsStep({ formData, setFormData, validationErrors }: StepComponentProps) {


  return (
    <div className="space-y-5 sm:space-y-6">

      {/* Course Title */}
      <div className="space-y-2.5">
        <Label htmlFor="title" className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <span>Course Title</span>
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Complete Web Development Bootcamp"
          value={formData.courseTitle}
          onChange={(e) => setFormData(prev => ({ ...prev, courseTitle: e.target.value }))}
          className="h-12 sm:h-11 bg-white/80 dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 text-base sm:text-base px-4 touch-manipulation shadow-sm hover:shadow-md placeholder:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {validationErrors?.courseTitle && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">{validationErrors.courseTitle}</p>
        )}
      </div>

      {/* Course Overview */}
      <div className="space-y-2.5">
        <Label htmlFor="overview" className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <span>Course Overview</span>
          <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="overview"
          placeholder="Describe what students will learn and achieve in this course..."
          value={formData.courseShortOverview}
          onChange={(e) => setFormData(prev => ({ ...prev, courseShortOverview: e.target.value }))}
          className="min-h-[140px] sm:min-h-[120px] bg-white/80 dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 text-base sm:text-base px-4 py-3 touch-manipulation shadow-sm hover:shadow-md resize-none placeholder:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {validationErrors?.courseShortOverview && (
          <p className="text-sm text-red-500 dark:text-red-400 mt-1.5">{validationErrors.courseShortOverview}</p>
        )}
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          {formData.courseShortOverview.length}/50 characters minimum
        </p>
      </div>

      {/* Category and Subcategory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <div className="space-y-2.5">
          <Label className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <span>Course Category</span>
            <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.courseCategory}
            onValueChange={(value) => {
              setFormData(prev => ({ ...prev, courseCategory: value, courseSubcategory: '' }));
            }}
          >
            <SelectTrigger className="h-12 sm:h-11 bg-white/80 dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 text-sm sm:text-base px-4 touch-manipulation shadow-sm hover:shadow-md">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-xl">
              {COURSE_CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value} className="text-sm sm:text-base py-2.5">
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.courseCategory && (
          <div className="space-y-2.5">
            <Label className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">Subcategory</Label>
            <Select
              value={formData.courseSubcategory}
              onValueChange={(value) => setFormData(prev => ({ ...prev, courseSubcategory: value }))}
            >
              <SelectTrigger className="h-12 sm:h-11 bg-white/80 dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 text-sm sm:text-base px-4 touch-manipulation shadow-sm hover:shadow-md">
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-xl">
                {COURSE_CATEGORIES
                  .find(cat => cat.value === formData.courseCategory)
                  ?.subcategories?.map((sub) => (
                    <SelectItem key={sub} value={sub} className="text-sm sm:text-base py-2.5">
                      {sub}
                    </SelectItem>
                  )) || []}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Course Intent */}
      <div className="space-y-2.5">
        <Label className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">Course Intent</Label>
        <Select
          value={formData.courseIntent}
          onValueChange={(value) => setFormData(prev => ({ ...prev, courseIntent: value }))}
        >
          <SelectTrigger className="h-12 sm:h-11 bg-white/80 dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 text-sm sm:text-base px-4 touch-manipulation shadow-sm hover:shadow-md">
            <SelectValue placeholder="What's the main purpose of this course?" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-xl">
            {COURSE_INTENTS.map((intent) => (
              <SelectItem key={intent} value={intent} className="text-sm sm:text-base py-2.5">
                {intent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}