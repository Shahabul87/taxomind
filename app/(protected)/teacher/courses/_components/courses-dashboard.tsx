"use client";

import { DataTable } from "./data-table";
import { columns } from "./column";
import { cn } from "@/lib/utils";
import { FileText, Layers, Plus, BookMarked, DollarSign } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface CoursesDashboardProps {
  courses: any[];
  stats: {
    total: number;
    published: number;
    draft: number;
    totalEnrollments: number;
    totalRevenue: number;
  };
}

export const CoursesDashboard = ({ courses, stats }: CoursesDashboardProps) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

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

  return (
    <motion.div
      className="space-y-8"
      animate={{
        paddingLeft: sidebarExpanded ? "1rem" : "0.5rem",
        paddingRight: sidebarExpanded ? "1rem" : "0.5rem",
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      
      {/* Header glass shell */}
      <div className="mb-2 rounded-xl border bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-gray-200/70 dark:border-gray-800/70 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-6" data-tour="course-creation-header">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Courses</h1>
            <p className="text-gray-500 dark:text-gray-400">Create, organize, and track your courses</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/teacher/create">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700">
                <Plus className="h-4 w-4" />
                Create Course
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "bg-white/70 dark:bg-gray-900/70",
            "border border-gray-200/70 dark:border-gray-800/70",
            "rounded-xl shadow-md backdrop-blur-md",
            "p-5",
            "flex items-center gap-4"
          )}
        >
          <div className="p-2.5 rounded-lg text-white bg-gradient-to-br from-indigo-500 to-purple-500 ring-1 ring-white/20 dark:ring-white/10">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Courses</p>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={cn(
            "bg-white/70 dark:bg-gray-900/70",
            "border border-gray-200/70 dark:border-gray-800/70",
            "rounded-xl shadow-md backdrop-blur-md",
            "p-5",
            "flex items-center gap-4"
          )}
        >
          <div className="p-2.5 rounded-lg text-white bg-gradient-to-br from-indigo-500 to-purple-500 ring-1 ring-white/20 dark:ring-white/10">
            <BookMarked size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Published</p>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.published}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={cn(
            "bg-white/70 dark:bg-gray-900/70",
            "border border-gray-200/70 dark:border-gray-800/70",
            "rounded-xl shadow-md backdrop-blur-md",
            "p-5",
            "flex items-center gap-4"
          )}
        >
          <div className="p-2.5 rounded-lg text-white bg-gradient-to-br from-indigo-500 to-purple-500 ring-1 ring-white/20 dark:ring-white/10">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Drafts</p>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.draft}</h3>
          </div>
        </motion.div>


        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className={cn(
            "bg-white/70 dark:bg-gray-900/70",
            "border border-gray-200/70 dark:border-gray-800/70",
            "rounded-xl shadow-md backdrop-blur-md",
            "p-5",
            "flex items-center gap-4"
          )}
        >
          <div className="p-2.5 rounded-lg text-white bg-gradient-to-br from-indigo-500 to-purple-500 ring-1 ring-white/20 dark:ring-white/10">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
              ${stats.totalRevenue.toLocaleString()}
            </h3>
          </div>
        </motion.div>
      </div>

      {/* Insights (subtle) */}
      <div className="rounded-xl border border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Insights</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Suggestions to help you optimize</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs text-gray-700 dark:text-gray-300">Auto</Badge>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700 dark:text-gray-300">
          {stats.total === 0 ? (
            <p>Create your first course using the course creator.</p>
          ) : (
            <>
              <p>{stats.draft} draft{stats.draft === 1 ? '' : 's'} pending. Prioritize finishing high-enrollment topics.</p>
              <p>Revenue currently at ${stats.totalRevenue.toLocaleString()}. Review pricing for underperforming courses.</p>
              <p>{stats.published} published. Consider adding a short assessment to improve completion.</p>
            </>
          )}
        </div>
      </div>

      {/* Actions moved to header */}

      {/* Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className={cn(
          "rounded-xl overflow-hidden",
          "bg-white/70 dark:bg-gray-900/70",
          "border border-gray-200/70 dark:border-gray-800/70",
          "shadow-md backdrop-blur-md"
        )}
      >
        <DataTable columns={columns} data={courses} />
      </motion.div>
    </motion.div>
  );
}; 
