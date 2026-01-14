"use client";

import { useState, useCallback, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  Target,
  Trophy,
  BarChart3,
  Play,
  ArrowRight,
  Brain,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { DashboardHero } from "./dashboard-hero";
import { ProgressAnalytics } from "./progress-analytics";
import { AchievementsPanel } from "./achievements-panel";
import { CourseContentNavigation } from "../course-content-navigation";
import { LearningPath } from "../learning-path";
import { SmartSidebar } from "../smart-sidebar";
import { LearningPathOptimizer } from "@/components/sam";
import { StreakTracker } from "../streak-tracker";
import { SmartPredictions } from "../smart-predictions";
import { SectionErrorBoundary } from "./learn-error-boundary";
import {
  ProgressAnalyticsSkeleton,
  AchievementsPanelSkeleton,
  CourseContentSkeleton,
  LearningPathSkeleton,
  SmartSidebarSkeleton,
  StreakTrackerSkeleton,
  SmartPredictionsSkeleton,
} from "./loading-skeletons";
import { MobileNavigationDrawer } from "./mobile-navigation-drawer";
import { useCurrentStreak } from "../../_hooks/use-streak-data";

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
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [announcement, setAnnouncement] = useState("");

  // Fetch real streak data
  const { currentStreak } = useCurrentStreak(course.id);

  // Keyboard navigation for tabs
  const handleTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      const tabCount = TABS.length;
      let newIndex: number | null = null;

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          newIndex = (currentIndex + 1) % tabCount;
          break;
        case "ArrowLeft":
          event.preventDefault();
          newIndex = (currentIndex - 1 + tabCount) % tabCount;
          break;
        case "Home":
          event.preventDefault();
          newIndex = 0;
          break;
        case "End":
          event.preventDefault();
          newIndex = tabCount - 1;
          break;
      }

      if (newIndex !== null) {
        tabsRef.current[newIndex]?.focus();
        setActiveTab(TABS[newIndex].id);
        setAnnouncement(`${TABS[newIndex].label} tab selected`);
      }
    },
    []
  );

  // Announce tab changes to screen readers
  const handleTabSelect = useCallback((tabId: TabId, label: string) => {
    setActiveTab(tabId);
    setAnnouncement(`${label} tab selected`);
  }, []);

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
      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Cinematic Hero Section */}
      <DashboardHero
        course={course}
        user={user}
        progressPercentage={progressPercentage}
        completedSections={completedSections}
        totalSections={totalSections}
        nextSection={nextSection}
        streakDays={currentStreak}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 -mt-8 relative z-20">
        {/* Quick Actions Row */}
        <section aria-label="Quick actions" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Continue Learning Card */}
          {nextSection && !isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Link
                href={`/courses/${course.id}/learn/${nextSection.chapter.id}/sections/${nextSection.section.id}`}
                aria-label={`Continue learning: ${nextSection.section.title} in ${nextSection.chapter.title}`}
                className="block focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 rounded-xl"
              >
                <Card className="group bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" aria-hidden="true">
                        <Play className="h-6 w-6" aria-hidden="true" />
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
                    <ArrowRight className="h-5 w-5 mt-3 group-hover:translate-x-2 transition-transform" aria-hidden="true" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )}

          {/* Course Stats Card */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            aria-labelledby="course-stats-heading"
          >
            <Card className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 shadow-xl h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center" aria-hidden="true">
                    <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 id="course-stats-heading" className="font-bold text-slate-900 dark:text-white">
                      Course Content
                    </h3>
                    <p className="text-slate-500 text-sm">Browse all chapters</p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <dt className="text-slate-500 dark:text-slate-400">Chapters</dt>
                    <dd className="text-xl font-bold text-slate-900 dark:text-white">
                      {course.chapters.length}
                    </dd>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <dt className="text-slate-500 dark:text-slate-400">Content</dt>
                    <dd className="text-xl font-bold text-slate-900 dark:text-white">
                      {totalContent}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </motion.article>

          {/* AI Insights Card */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            aria-labelledby="ai-insights-heading"
          >
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-xl h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center" aria-hidden="true">
                    <Brain className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 id="ai-insights-heading" className="font-bold text-lg">AI Insights</h3>
                    <p className="text-purple-100 text-sm">Personalized tips</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-lg" role="note">
                  <Sparkles className="h-4 w-4 text-yellow-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
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
          </motion.article>
        </section>

        {/* Navigation Tabs */}
        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
          aria-label="Course dashboard navigation"
        >
          <div
            role="tablist"
            aria-label="Dashboard sections"
            className="flex flex-wrap gap-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50"
          >
            {TABS.map((tab, index) => (
              <button
                key={tab.id}
                ref={(el) => { tabsRef.current[index] = el; }}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => handleTabSelect(tab.id, tab.label)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                <tab.icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.nav>

        {/* Main Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <main id="main-content" className="xl:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                role="tabpanel"
                id={`tabpanel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
                tabIndex={0}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="focus:outline-none"
              >
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    {/* Progress Analytics */}
                    <SectionErrorBoundary
                      componentName="ProgressAnalytics"
                      fallbackMessage="Failed to load progress analytics"
                    >
                      <Suspense fallback={<ProgressAnalyticsSkeleton />}>
                        <ProgressAnalytics
                          course={course}
                          progressPercentage={progressPercentage}
                          totalSections={totalSections}
                          completedSections={completedSections}
                        />
                      </Suspense>
                    </SectionErrorBoundary>

                    {/* Two Column Layout for Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Smart Predictions */}
                      <SectionErrorBoundary
                        componentName="SmartPredictions"
                        fallbackMessage="Failed to load predictions"
                      >
                        <Suspense fallback={<SmartPredictionsSkeleton />}>
                          <SmartPredictions courseId={course.id} />
                        </Suspense>
                      </SectionErrorBoundary>

                      {/* Streak Tracker */}
                      <SectionErrorBoundary
                        componentName="StreakTracker"
                        fallbackMessage="Failed to load streak tracker"
                      >
                        <Suspense fallback={<StreakTrackerSkeleton />}>
                          <StreakTracker courseId={course.id} userId={user.id} />
                        </Suspense>
                      </SectionErrorBoundary>
                    </div>
                  </div>
                )}

                {activeTab === "content" && (
                  <SectionErrorBoundary
                    componentName="CourseContentNavigation"
                    fallbackMessage="Failed to load course content"
                  >
                    <Suspense fallback={<CourseContentSkeleton />}>
                      <CourseContentNavigation course={course as any} />
                    </Suspense>
                  </SectionErrorBoundary>
                )}

                {activeTab === "progress" && (
                  <div className="space-y-8">
                    <SectionErrorBoundary
                      componentName="LearningPath"
                      fallbackMessage="Failed to load learning path"
                    >
                      <Suspense fallback={<LearningPathSkeleton />}>
                        <LearningPath course={course as any} detailed />
                      </Suspense>
                    </SectionErrorBoundary>

                    {/* AI-Powered Learning Path Optimizer */}
                    <SectionErrorBoundary
                      componentName="LearningPathOptimizer"
                      fallbackMessage="Failed to load AI path optimizer"
                    >
                      <LearningPathOptimizer
                        userId={user.id}
                        courseId={course.id}
                        className="w-full"
                      />
                    </SectionErrorBoundary>
                  </div>
                )}

                {activeTab === "achievements" && (
                  <SectionErrorBoundary
                    componentName="AchievementsPanel"
                    fallbackMessage="Failed to load achievements"
                  >
                    <Suspense fallback={<AchievementsPanelSkeleton />}>
                      <AchievementsPanel courseId={course.id} />
                    </Suspense>
                  </SectionErrorBoundary>
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Sidebar */}
          <aside
            className="xl:col-span-1 hidden xl:block"
            aria-label="Learning tools and quick navigation"
          >
            <div className="sticky top-24">
              <SectionErrorBoundary
                componentName="SmartSidebar"
                fallbackMessage="Failed to load sidebar"
              >
                <Suspense fallback={<SmartSidebarSkeleton />}>
                  <SmartSidebar course={course as any} userId={user.id} />
                </Suspense>
              </SectionErrorBoundary>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNavigationDrawer
        course={course as any}
        userId={user.id}
        currentSectionId={nextSection?.section.id}
        progressPercentage={progressPercentage}
        completedSections={completedSections}
        totalSections={totalSections}
      />
    </div>
  );
}
