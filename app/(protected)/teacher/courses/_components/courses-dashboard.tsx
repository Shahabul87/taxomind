"use client";

import { DataTable } from "./data-table";
import { columns } from "./column";
import { cn } from "@/lib/utils";
import {
  Plus,
  Sparkles,
  LayoutGrid,
  BarChart3,
  BookOpen,
  ArrowRight,
  Zap,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { CoursesDashboardProps, CourseFilters } from "@/types/course";
import { AnalyticsSection } from "./analytics-section";
import { FilterPresets } from "./filter-presets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const CoursesDashboard = ({ courses, stats }: CoursesDashboardProps) => {
  const [activeFilters, setActiveFilters] = useState<CourseFilters>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'courses'>('overview');
  const containerRef = useRef<HTMLDivElement>(null);

  // Spotlight effect on mouse move
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      container.style.setProperty('--mouse-x', `${x}%`);
      container.style.setProperty('--mouse-y', `${y}%`);
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleFilterPresetSelected = (filters: CourseFilters) => {
    setActiveFilters(filters);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className="w-full min-h-screen teacher-mesh-bg teacher-spotlight"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="w-full space-y-6 lg:space-y-8 py-2">
        {/* Enterprise Header */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden"
        >
          <div className="teacher-card-premium p-6 sm:p-8 lg:p-10">
            {/* Decorative gradient orb */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-[hsl(var(--teacher-primary))] to-[hsl(var(--teacher-coral))] opacity-10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-gradient-to-br from-[hsl(var(--teacher-teal))] to-[hsl(var(--teacher-success))] opacity-10 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left: Title & Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-[hsl(var(--teacher-primary))] to-[hsl(280,70%,55%)] shadow-lg shadow-[hsl(var(--teacher-primary))]/20">
                    <LayoutGrid className="w-5 h-5 text-white" />
                  </div>
                  <span className="teacher-badge teacher-badge-primary">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Enterprise Dashboard
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[hsl(var(--teacher-text))]">
                  <span className="bg-gradient-to-r from-[hsl(var(--teacher-primary))] via-[hsl(280,70%,55%)] to-[hsl(var(--teacher-coral))] bg-clip-text text-transparent">
                    Course Studio
                  </span>
                </h1>

                <p className="mt-3 text-base sm:text-lg text-[hsl(var(--teacher-text-muted))] max-w-2xl leading-relaxed">
                  Comprehensive analytics, intelligent insights, and powerful course management
                </p>

                {/* Quick Stats Row */}
                <div className="flex flex-wrap items-center gap-4 mt-6">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--teacher-success-muted))] border border-[hsl(var(--teacher-success))]/20">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--teacher-success))] animate-pulse" />
                    <span className="text-sm font-medium text-[hsl(var(--teacher-success))]">
                      {stats.published} Published
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--teacher-coral-muted))] border border-[hsl(var(--teacher-coral))]/20">
                    <span className="text-sm font-medium text-[hsl(var(--teacher-coral))]">
                      {stats.draft} Drafts
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--teacher-primary-muted))] border border-[hsl(var(--teacher-primary))]/20">
                    <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--teacher-primary))]" />
                    <span className="text-sm font-medium text-[hsl(var(--teacher-primary))]">
                      {stats.totalEnrollments} Enrolled
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: CTA Button */}
              <div className="flex-shrink-0">
                <Link href="/teacher/create">
                  <Button
                    className={cn(
                      "group relative overflow-hidden",
                      "h-14 px-8 rounded-2xl",
                      "bg-gradient-to-r from-[hsl(var(--teacher-primary))] via-[hsl(280,70%,55%)] to-[hsl(var(--teacher-coral))]",
                      "text-white font-semibold text-base",
                      "shadow-xl shadow-[hsl(var(--teacher-primary))]/25",
                      "hover:shadow-2xl hover:shadow-[hsl(var(--teacher-primary))]/35",
                      "transition-all duration-300 hover:scale-[1.02]"
                    )}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <Plus className="w-5 h-5 mr-2" />
                    Create Course
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Premium Tabs Navigation */}
        <motion.div variants={itemVariants}>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as typeof activeTab)}
            className="w-full"
          >
            <div className="teacher-card-premium p-2">
              <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto gap-2">
                <TabsTrigger
                  value="overview"
                  className={cn(
                    "relative py-4 px-6 rounded-xl font-medium text-sm sm:text-base",
                    "transition-all duration-300",
                    "data-[state=inactive]:text-[hsl(var(--teacher-text-muted))]",
                    "data-[state=inactive]:hover:text-[hsl(var(--teacher-text))]",
                    "data-[state=inactive]:hover:bg-[hsl(var(--teacher-surface-hover))]",
                    "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--teacher-primary))] data-[state=active]:to-[hsl(280,70%,55%)]",
                    "data-[state=active]:text-white",
                    "data-[state=active]:shadow-lg data-[state=active]:shadow-[hsl(var(--teacher-primary))]/20"
                  )}
                >
                  <LayoutGrid className="w-4 h-4 mr-2 inline-block" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className={cn(
                    "relative py-4 px-6 rounded-xl font-medium text-sm sm:text-base",
                    "transition-all duration-300",
                    "data-[state=inactive]:text-[hsl(var(--teacher-text-muted))]",
                    "data-[state=inactive]:hover:text-[hsl(var(--teacher-text))]",
                    "data-[state=inactive]:hover:bg-[hsl(var(--teacher-surface-hover))]",
                    "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--teacher-teal))] data-[state=active]:to-[hsl(195,75%,45%)]",
                    "data-[state=active]:text-white",
                    "data-[state=active]:shadow-lg data-[state=active]:shadow-[hsl(var(--teacher-teal))]/20"
                  )}
                >
                  <BarChart3 className="w-4 h-4 mr-2 inline-block" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="courses"
                  className={cn(
                    "relative py-4 px-6 rounded-xl font-medium text-sm sm:text-base",
                    "transition-all duration-300",
                    "data-[state=inactive]:text-[hsl(var(--teacher-text-muted))]",
                    "data-[state=inactive]:hover:text-[hsl(var(--teacher-text))]",
                    "data-[state=inactive]:hover:bg-[hsl(var(--teacher-surface-hover))]",
                    "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--teacher-coral))] data-[state=active]:to-[hsl(35,85%,55%)]",
                    "data-[state=active]:text-white",
                    "data-[state=active]:shadow-lg data-[state=active]:shadow-[hsl(var(--teacher-coral))]/20"
                  )}
                >
                  <BookOpen className="w-4 h-4 mr-2 inline-block" />
                  <span className="hidden sm:inline">All Courses</span>
                  <span className="sm:hidden">Courses</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 lg:mt-8">
              <motion.div
                key="tab-overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6 lg:space-y-8"
              >
                {/* Analytics Section */}
                <AnalyticsSection courses={courses} />

                {/* Filter Presets */}
                <FilterPresets onPresetSelected={handleFilterPresetSelected} />

                {/* Recent Courses Table */}
                <div className="teacher-card-premium overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-[hsl(var(--teacher-border-subtle))]">
                    <div>
                      <h3 className="text-lg font-semibold text-[hsl(var(--teacher-text))]">
                        Recent Courses
                      </h3>
                      <p className="text-sm text-[hsl(var(--teacher-text-muted))] mt-1">
                        Your latest course activity
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setActiveTab('courses')}
                      className="text-[hsl(var(--teacher-primary))] hover:text-[hsl(var(--teacher-primary-hover))] hover:bg-[hsl(var(--teacher-primary-muted))] font-medium"
                    >
                      View All
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <DataTable columns={columns} data={courses.slice(0, 5)} serverMode={false} />
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6 lg:mt-8">
              <motion.div
                key="tab-analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6 lg:space-y-8"
              >
                <AnalyticsSection courses={courses} />
              </motion.div>
            </TabsContent>

            {/* All Courses Tab */}
            <TabsContent value="courses" className="mt-6 lg:mt-8">
              <motion.div
                key="tab-courses"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6 lg:space-y-8"
              >
                {/* Filter Presets */}
                <FilterPresets onPresetSelected={handleFilterPresetSelected} />

                {/* Full Table */}
                <div className="teacher-card-premium overflow-hidden">
                  <div className="flex items-center gap-3 p-6 border-b border-[hsl(var(--teacher-border-subtle))]">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[hsl(var(--teacher-coral))] to-[hsl(35,85%,55%)]">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[hsl(var(--teacher-text))]">
                        All Courses
                      </h3>
                      <p className="text-sm text-[hsl(var(--teacher-text-muted))]">
                        {courses.length} total courses
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <DataTable columns={columns} data={courses} serverMode={false} />
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  );
};
