"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  Target,
  Trophy,
  BarChart3,
  Play,
  ArrowRight,
  Video,
  FileText,
  Brain,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { DashboardHero } from "./dashboard-hero";
import { ProgressAnalytics } from "./progress-analytics";
import { AchievementsPanel } from "./achievements-panel";
import { CourseContentNavigation } from "../course-content-navigation";
import { LearningPath } from "../learning-path";
import { SmartSidebar } from "../smart-sidebar";
import { StreakTracker } from "../streak-tracker";
import { SmartPredictions } from "../smart-predictions";

interface Course {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: { name: string } | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: { Enrollment: number };
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
      user_progress: Array<{ isCompleted: boolean }>;
      videos: Array<{ id: string; title: string; duration?: number | null }>;
      blogs: Array<{ id: string; title: string }>;
      articles: Array<{ id: string; title: string }>;
      notes: Array<{ id: string; title: string }>;
      codeExplanations: Array<{ id: string; title: string }>;
    }>;
    user_progress: Array<{ isCompleted: boolean }>;
  }>;
}

interface User {
  id: string;
  name?: string | null;
  image?: string | null;
}

interface EnterpriseLearningDashboardProps {
  course: Course;
  user: User;
  progressPercentage: number;
  totalSections: number;
  completedSections: number;
}

type TabId = "overview" | "content" | "progress" | "achievements";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "content", label: "Course Content", icon: BookOpen },
  { id: "progress", label: "Learning Path", icon: Target },
  { id: "achievements", label: "Achievements", icon: Trophy },
];

export function EnterpriseLearningDashboard({
  course,
  user,
  progressPercentage,
  totalSections,
  completedSections,
}: EnterpriseLearningDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Find next incomplete section
  const findNextSection = () => {
    for (const chapter of course.chapters) {
      for (const section of chapter.sections) {
        if (!section.user_progress?.some((p) => p.isCompleted)) {
          return { chapter, section };
        }
      }
    }
    return null;
  };

  const nextSection = findNextSection();
  const isCompleted = progressPercentage === 100;

  // Calculate content stats
  const totalContent = course.chapters.reduce((acc, chapter) => {
    return (
      acc +
      chapter.sections.reduce((sectionAcc, section) => {
        return (
          sectionAcc +
          (section.videos?.length || 0) +
          (section.blogs?.length || 0) +
          (section.articles?.length || 0) +
          (section.notes?.length || 0) +
          (section.codeExplanations?.length || 0)
        );
      }, 0)
    );
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Cinematic Hero Section */}
      <DashboardHero
        course={course}
        user={user}
        progressPercentage={progressPercentage}
        completedSections={completedSections}
        totalSections={totalSections}
        nextSection={nextSection}
        streakDays={3} // This would come from actual data
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 -mt-8 relative z-20">
        {/* Quick Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Continue Learning Card */}
          {nextSection && !isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Link
                href={`/courses/${course.id}/learn/${nextSection.chapter.id}/sections/${nextSection.section.id}`}
              >
                <Card className="group bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Continue Learning</h3>
                        <p className="text-emerald-100 text-sm">
                          Pick up where you left off
                        </p>
                      </div>
                    </div>
                    <p className="text-white/90 text-sm mb-1 font-medium">
                      {nextSection.chapter.title}
                    </p>
                    <p className="text-emerald-100 text-sm truncate">
                      {nextSection.section.title}
                    </p>
                    <ArrowRight className="h-5 w-5 mt-3 group-hover:translate-x-2 transition-transform" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )}

          {/* Course Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 shadow-xl h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      Course Content
                    </h3>
                    <p className="text-slate-500 text-sm">Browse all chapters</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-slate-500 dark:text-slate-400">Chapters</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {course.chapters.length}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-slate-500 dark:text-slate-400">Content</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {totalContent}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Insights Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-xl h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI Insights</h3>
                    <p className="text-purple-100 text-sm">Personalized tips</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <Sparkles className="h-4 w-4 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-purple-100">
                    {progressPercentage < 25
                      ? "Great start! Focus on completing one section at a time."
                      : progressPercentage < 50
                        ? "You're building momentum! Keep your daily streak going."
                        : progressPercentage < 75
                          ? "Halfway there! Consider reviewing earlier sections."
                          : "Almost done! Push through to earn your certificate!"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    {/* Progress Analytics */}
                    <ProgressAnalytics
                      course={course}
                      progressPercentage={progressPercentage}
                      totalSections={totalSections}
                      completedSections={completedSections}
                    />

                    {/* Two Column Layout for Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Smart Predictions */}
                      <SmartPredictions
                        course={course as any}
                        userId={user.id}
                        progressPercentage={progressPercentage}
                        totalSections={totalSections}
                        completedSections={completedSections}
                      />

                      {/* Streak Tracker */}
                      <StreakTracker courseId={course.id} userId={user.id} />
                    </div>
                  </div>
                )}

                {activeTab === "content" && (
                  <CourseContentNavigation course={course as any} />
                )}

                {activeTab === "progress" && (
                  <LearningPath course={course as any} detailed />
                )}

                {activeTab === "achievements" && (
                  <AchievementsPanel
                    courseId={course.id}
                    userId={user.id}
                    progressPercentage={progressPercentage}
                    completedSections={completedSections}
                    totalSections={totalSections}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 hidden xl:block">
            <div className="sticky top-24">
              <SmartSidebar course={course as any} userId={user.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
