"use client";

import { DataTable } from "./data-table";
import { columns } from "./column";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { CoursesDashboardProps, CourseFilters } from "@/types/course";
import { AnalyticsSection } from "./analytics-section";
import { FilterPresets } from "./filter-presets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Props interface now imported from types file

export const CoursesDashboard = ({ courses, stats }: CoursesDashboardProps) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<CourseFilters>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'courses'>('overview');

  // Listen to sidebar state changes
  useEffect(() => {
    const handleSidebarChange = (event: CustomEvent) => {
      setSidebarExpanded(event.detail.expanded);
    };

    window.addEventListener('sidebar-state-change', handleSidebarChange as EventListener);

    return () => {
      window.removeEventListener('sidebar-state-change', handleSidebarChange as EventListener);
    };
  }, []);

  const handleFilterPresetSelected = (filters: CourseFilters) => {
    setActiveFilters(filters);
  };

  return (
    <motion.div
      className="space-y-4 sm:space-y-6 p-2 sm:p-0"
      animate={{
        paddingLeft: sidebarExpanded ? "1rem" : "0.5rem",
        paddingRight: sidebarExpanded ? "1rem" : "0.5rem",
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Header */}
      <div className="rounded-3xl border bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 md:p-6" data-tour="course-creation-header">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent tracking-tight">
              Courses Dashboard
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Comprehensive analytics, management, and insights
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/teacher/create" className="w-full sm:w-auto">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg w-full sm:w-auto transition-all duration-200">
                <Plus className="h-4 w-4" />
                <span className="text-sm">Create Course</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-1 rounded-xl h-auto">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-lg text-xs sm:text-sm px-3 py-2.5"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-lg text-xs sm:text-sm px-3 py-2.5"
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="courses"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-lg text-xs sm:text-sm px-3 py-2.5"
          >
            <span className="hidden sm:inline">All Courses</span>
            <span className="sm:hidden">Courses</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Quick Stats + Analytics */}
          <AnalyticsSection courses={courses} />

          {/* Filter Presets */}
          <FilterPresets onPresetSelected={handleFilterPresetSelected} />

          {/* Recent Courses Table (limited) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={cn(
              "rounded-3xl overflow-hidden",
              "bg-white/80 dark:bg-slate-800/80",
              "border border-slate-200/50 dark:border-slate-700/50",
              "shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300"
            )}
          >
            <div className="p-5 md:p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Courses</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('courses')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm transition-all duration-200"
              >
                View All →
              </Button>
            </div>
            <div className="overflow-x-auto">
              <DataTable columns={columns} data={courses.slice(0, 5)} serverMode={false} />
            </div>
          </motion.div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <AnalyticsSection courses={courses} />
        </TabsContent>

        {/* All Courses Tab */}
        <TabsContent value="courses" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Filter Presets */}
          <FilterPresets onPresetSelected={handleFilterPresetSelected} />

          {/* Full Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={cn(
              "rounded-3xl overflow-hidden",
              "bg-white/80 dark:bg-slate-800/80",
              "border border-slate-200/50 dark:border-slate-700/50",
              "shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300"
            )}
          >
            <div className="overflow-x-auto">
              <DataTable columns={columns} data={courses} serverMode={false} />
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}; 
