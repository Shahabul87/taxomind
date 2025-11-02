"use client";

import React, { useState } from "react";
import { CreateCourseInputSection } from "./create-course-input";
import { CourseCreatorSelection } from "./_components/course-creator-selection";
import { ArrowRight, BookOpen, Target, Lightbulb, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const CreateNewCoursePage = () => {
  const [creatorMode, setCreatorMode] = useState<'selection' | 'classic' | 'ai'>('selection');

  const handleSelectAI = () => {
    // Navigate to dedicated AI creator page
    window.location.href = '/teacher/create/ai-creator';
  };


  return (
    <section className="w-full max-w-6xl mx-auto">
      <div className="w-full">
        {/* Streamlined Header */}
        {creatorMode === 'selection' && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-400/10 dark:to-indigo-400/10 border border-blue-200/30 dark:border-blue-700/20">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  Choose Creation Method
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">Select your preferred approach</p>
              </div>
            </div>
          </div>
        )}

        {creatorMode === 'classic' && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-400/10 dark:to-indigo-400/10 border border-blue-200/30 dark:border-blue-700/20">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                    Course Details
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Set up the basics</p>
                </div>
              </div>
              <button
                onClick={() => setCreatorMode('selection')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50"
              >
                ← Back
              </button>
            </div>
            
            {/* Compact Process Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200/30 dark:border-blue-700/20">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Define Audience</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-200/30 dark:border-indigo-700/20">
                <Lightbulb className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Set Objectives</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-200/30 dark:border-purple-700/20">
                <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Create Content</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className={cn(
          "rounded-xl sm:rounded-2xl backdrop-blur-sm",
          "bg-white/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40"
        )}>
          {creatorMode === 'selection' && (
            <CourseCreatorSelection 
              onSelectClassic={() => setCreatorMode('classic')}
              onSelectAI={handleSelectAI}
              onBack={() => setCreatorMode('selection')}
            />
          )}
          
          {creatorMode === 'classic' && (
            <CreateCourseInputSection onBack={() => setCreatorMode('selection')} />
          )}
        </div>
      </div>
    </section>
  );
}