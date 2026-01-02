"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  Play, 
  CheckCircle2, 
  User,
  Calendar,
  Target,
  BarChart3,
  ArrowRight,
  Star,
  Users,
  Award,
  ChevronRight,
  Video,
  FileText,
  Code,
  BookOpenCheck
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CourseContentNavigation } from "./course-content-navigation";
import { LearningStats } from "./learning-stats";
import { RecentActivity } from "./recent-activity";
import { LearningPath } from "./learning-path";
import { StreakTracker } from "./streak-tracker";
import { SmartPredictions } from "./smart-predictions";
import { SmartHeader } from "./smart-header";
import { SmartSidebar } from "./smart-sidebar";

interface Course {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: {
    name: string;
  } | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    Enrollment: number;
  };
  chapters: Array<{
    id: string;
    title: string;
    description?: string | null;
    position: number;
    sections: Array<{
      id: string;
      title: string;
      position: number;
      type?: string | null;
      duration?: number | null;
      user_progress: Array<{
        isCompleted: boolean;
      }>;
      videos: Array<{ id: string; title: string; duration?: number | null }>;
      blogs: Array<{ id: string; title: string }>;
      articles: Array<{ id: string; title: string }>;
      notes: Array<{ id: string; title: string }>;
      codeExplanations: Array<{ id: string; title: string }>;
    }>;
    user_progress: Array<{
      isCompleted: boolean;
    }>;
  }>;
}

interface User {
  id: string;
  name?: string | null;
  image?: string | null;
}

interface CourseLearningDashboardProps {
  course: Course;
  user: User;
  progressPercentage: number;
  totalSections: number;
  completedSections: number;
}

export const CourseLearningDashboard = ({
  course,
  user,
  progressPercentage,
  totalSections,
  completedSections
}: CourseLearningDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'progress'>('overview');

  // Find next incomplete section
  const findNextSection = () => {
    for (const chapter of course.chapters) {
      for (const section of chapter.sections) {
        if (!section.user_progress.some(p => p.isCompleted)) {
          return { chapter, section };
        }
      }
    }
    return null;
  };

  const nextSection = findNextSection();
  const isCompleted = progressPercentage === 100;

  // Calculate learning statistics
  const totalContent = course.chapters.reduce((acc, chapter) => {
    return acc + chapter.sections.reduce((sectionAcc, section) => {
      return sectionAcc + 
        section.videos.length + 
        section.blogs.length + 
        section.articles.length + 
        section.notes.length + 
        section.codeExplanations.length;
    }, 0);
  }, 0);

  const estimatedTime = course.chapters.reduce((acc, chapter) => {
    return acc + chapter.sections.reduce((sectionAcc, section) => {
      return sectionAcc + (section.duration || 10); // Default 10 minutes per section
    }, 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Smart Header */}
      <SmartHeader
        course={course}
        progressPercentage={progressPercentage}
        completedSections={completedSections}
        totalSections={totalSections}
        nextSection={nextSection}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Continue Learning */}
          {nextSection && (
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer">
              <Link href={`/courses/${course.id}/learn/${nextSection.chapter.id}/sections/${nextSection.section.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Continue Learning</h3>
                      <p className="text-emerald-100 text-sm">Pick up where you left off</p>
                    </div>
                  </div>
                  <p className="text-white/90 text-sm mb-2">{nextSection.chapter.title}</p>
                  <p className="text-emerald-100 text-sm">{nextSection.section.title}</p>
                  <ArrowRight className="w-5 h-5 mt-2 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Link>
            </Card>
          )}

          {/* Course Overview */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Course Content</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Browse all chapters</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Chapters</span>
                  <span className="font-medium">{course.chapters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Content</span>
                  <span className="font-medium">{totalContent} items</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Stats */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Your Stats</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Learning analytics</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Completed</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{completedSections}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining</span>
                  <span className="font-medium">{totalSections - completedSections}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="flex gap-1 p-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-200/50 dark:border-slate-700/50 w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpen },
              { id: 'content', label: 'Course Content', icon: Video },
              { id: 'progress', label: 'Learning Path', icon: Target }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Layout with Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content Area - Left (3/4 width) */}
          <div className="xl:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Main Content - Left Column */}
                  <div className="space-y-6">
                    {/* Smart Predictions - AI-Powered Learning Analytics */}
                    <SmartPredictions
                      courseId={course.id}
                    />

                    {/* Original Learning Stats */}
                    <LearningStats
                      course={course}
                      progressPercentage={progressPercentage}
                      totalSections={totalSections}
                      completedSections={completedSections}
                    />
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Streak Tracker - Gamification & Engagement */}
                    <StreakTracker
                      courseId={course.id}
                      userId={user.id}
                    />

                    {/* Original Recent Activity */}
                    <RecentActivity course={course as any} />

                    {/* Original Learning Path */}
                    <LearningPath course={course as any} />
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <CourseContentNavigation course={course as any} />
              )}

              {activeTab === 'progress' && (
                <LearningPath course={course as any} detailed />
              )}
            </motion.div>
          </div>

          {/* Smart Sidebar - Right (1/4 width) - Sticky */}
          <div className="xl:col-span-1 hidden xl:block">
            <div className="sticky top-24">
              <SmartSidebar
                course={course}
                userId={user.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 