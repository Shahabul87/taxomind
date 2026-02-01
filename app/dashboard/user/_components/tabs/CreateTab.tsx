'use client';

import { Wand2 } from 'lucide-react';
import { SAMContextTracker } from '@/components/sam/SAMContextTracker';
import {
  ContentGenerationStudio,
  CourseGuideBuilder,
  DepthAnalyzer,
  CreatorBusinessSuite,
} from '@/components/sam/creator-studio';
import { ResourceIntelligenceContent } from '@/components/sam/resource-intelligence-content';
import { MultimediaLibrary } from '@/components/sam/MultimediaLibrary';

interface CreateTabProps {
  userId: string;
}

export function CreateTab({ userId }: CreateTabProps) {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/30 dark:from-slate-900 dark:via-violet-900/10 dark:to-purple-900/10">
      {/* SAM Context Tracker - Invisible, syncs page context */}
      <SAMContextTracker />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Wand2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Creator Studio
              </h1>
              <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                AI-powered tools to create courses, assessments, and learning content
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* Content Generation Studio - Full AI Content Creation */}
        {/* ============================================================= */}

        <div className="mb-6 sm:mb-8">
          <ContentGenerationStudio />
        </div>

        {/* ============================================================= */}
        {/* Course Guide & Depth Analysis - Side by Side */}
        {/* ============================================================= */}

        <div className="mb-4 sm:mb-6 md:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Course Guide Builder */}
          <CourseGuideBuilder />

          {/* Content Depth Analyzer */}
          <DepthAnalyzer />
        </div>

        <div className="mb-6 sm:mb-8">
          <CreatorBusinessSuite />
        </div>

        {/* ============================================================= */}
        {/* Resource Intelligence - Discover External Learning Resources */}
        {/* ============================================================= */}

        <div className="mb-6 sm:mb-8">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-800/50">
            <ResourceIntelligenceContent
              courseId=""
              chapterId=""
              sectionId=""
              sectionTitle="Learning Resources"
              courseTitle="My Learning Journey"
            />
          </div>
        </div>

        {/* ============================================================= */}
        {/* Multimedia Library - AI-Generated Media Assets */}
        {/* ============================================================= */}

        <div className="mb-6 sm:mb-8">
          <MultimediaLibrary
            userId={userId}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
