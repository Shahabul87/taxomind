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
      <div className="rounded-xl border bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-gray-200/70 dark:border-gray-800/70 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 md:p-6" data-tour="course-creation-header">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent truncate">
              Courses Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">
              Comprehensive analytics, management, and insights
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:hidden">
              Manage your courses
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/teacher/create" className="w-full sm:w-auto">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700 w-full sm:w-auto h-8 sm:h-9">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Create Course</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-gray-200/70 dark:border-gray-800/70 h-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-xs sm:text-sm px-2 py-2 sm:py-2.5">
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-xs sm:text-sm px-2 py-2 sm:py-2.5">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="courses" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-xs sm:text-sm px-2 py-2 sm:py-2.5">
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
            transition={{ duration: 0.4 }}
            className={cn(
              "rounded-xl overflow-hidden",
              "bg-white/70 dark:bg-gray-900/70",
              "border border-gray-200/70 dark:border-gray-800/70",
              "shadow-md backdrop-blur-md"
            )}
          >
            <div className="p-3 sm:p-4 border-b border-gray-200/70 dark:border-gray-800/70 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Recent Courses</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('courses')}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
              >
                <span className="hidden sm:inline">View All →</span>
                <span className="sm:hidden">All →</span>
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
            transition={{ duration: 0.4 }}
            className={cn(
              "rounded-xl overflow-hidden",
              "bg-white/70 dark:bg-gray-900/70",
              "border border-gray-200/70 dark:border-gray-800/70",
              "shadow-md backdrop-blur-md"
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
