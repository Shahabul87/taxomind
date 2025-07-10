"use client";

import { DataTable } from "./data-table";
import { columns } from "./column";
import { Course } from "@prisma/client";
import { cn } from "@/lib/utils";
import { BookOpen, FileText, Layers, Plus, BookMarked, Users, DollarSign, Brain, Sparkles, Target, TrendingUp, BarChart3, Lightbulb, FileQuestion, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { GuidedTour, TourStyles } from "@/components/ui/guided-tour";
import { aiCourseCreationTour } from "@/lib/tours/ai-course-creation-tour";
import { IntelligentOnboarding } from "@/components/ui/intelligent-onboarding";
import { useIntelligentOnboarding } from "@/hooks/use-intelligent-onboarding";
import { OnboardingTrigger } from "@/components/ui/onboarding-trigger";
import { useState } from "react";

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
  const [showTour, setShowTour] = useState(false);
  const {
    isOnboardingVisible,
    isOnboardingComplete,
    startOnboarding,
    completeOnboarding,
    skipOnboarding
  } = useIntelligentOnboarding({
    userRole: "TEACHER",
    autoStart: !showTour // Don't auto-start if tour is active
  });

  const handleStartTour = () => {
    setShowTour(true);
  };

  return (
    <div className="space-y-8">
      <TourStyles />
      {showTour && <GuidedTour config={aiCourseCreationTour} />}
      
      <IntelligentOnboarding
        userRole="TEACHER"
        isVisible={isOnboardingVisible}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />
      
      {/* Header with welcome message */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0" data-tour="course-creation-header">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Courses
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage and track all your courses in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OnboardingTrigger
            onClick={startOnboarding}
            isComplete={isOnboardingComplete}
          />
          <Button 
            onClick={handleStartTour}
            variant="outline" 
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/30"
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            AI Features Tour
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "bg-white dark:bg-gray-800",
            "border border-gray-100 dark:border-gray-700",
            "rounded-xl shadow-sm",
            "p-6",
            "flex items-center space-x-4"
          )}
        >
          <div className={cn(
            "p-3 rounded-full",
            "bg-blue-100 dark:bg-blue-900/30",
            "text-blue-600 dark:text-blue-400"
          )}>
            <Layers size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Courses</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={cn(
            "bg-white dark:bg-gray-800",
            "border border-gray-100 dark:border-gray-700",
            "rounded-xl shadow-sm",
            "p-6",
            "flex items-center space-x-4"
          )}
        >
          <div className={cn(
            "p-3 rounded-full",
            "bg-green-100 dark:bg-green-900/30",
            "text-green-600 dark:text-green-400"
          )}>
            <BookMarked size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Published</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.published}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={cn(
            "bg-white dark:bg-gray-800",
            "border border-gray-100 dark:border-gray-700",
            "rounded-xl shadow-sm",
            "p-6",
            "flex items-center space-x-4"
          )}
        >
          <div className={cn(
            "p-3 rounded-full",
            "bg-amber-100 dark:bg-amber-900/30",
            "text-amber-600 dark:text-amber-400"
          )}>
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Drafts</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.draft}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className={cn(
            "bg-white dark:bg-gray-800",
            "border border-gray-100 dark:border-gray-700",
            "rounded-xl shadow-sm",
            "p-6",
            "flex items-center space-x-4"
          )}
        >
          <div className={cn(
            "p-3 rounded-full",
            "bg-indigo-100 dark:bg-indigo-900/30",
            "text-indigo-600 dark:text-indigo-400"
          )}>
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Enrollments</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEnrollments}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className={cn(
            "bg-white dark:bg-gray-800",
            "border border-gray-100 dark:border-gray-700",
            "rounded-xl shadow-sm",
            "p-6",
            "flex items-center space-x-4"
          )}
        >
          <div className={cn(
            "p-3 rounded-full",
            "bg-emerald-100 dark:bg-emerald-900/30",
            "text-emerald-600 dark:text-emerald-400"
          )}>
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              ${stats.totalRevenue.toLocaleString()}
            </h3>
          </div>
        </motion.div>
      </div>

      {/* Smart AI Course Management Assistant */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-gradient-to-r from-indigo-200/50 via-purple-200/50 to-pink-200/50 dark:from-indigo-700/50 dark:via-purple-700/50 dark:to-pink-700/50 p-[1px] rounded-xl"
        data-tour="ai-management-hub"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Course Management Hub
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Intelligent insights and recommendations for your course portfolio
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200 ml-auto">
              Smart Analytics
            </Badge>
          </div>
          
          {/* Context-Aware Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-tour="contextual-suggestions">
            {/* Portfolio Analysis */}
            {stats.total === 0 ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1">
                      Start Your Teaching Journey
                    </h4>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
                      Create your first course with AI assistance! Our intelligent system will guide you through every step.
                    </p>
                    <Link href="/teacher/create">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" data-tour="ai-course-builder">
                        <Brain className="w-4 h-4 mr-1" />
                        AI Course Creator
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : stats.draft > stats.published ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-700">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                      Complete Your Draft Courses
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                      You have {stats.draft} draft courses ready to publish. AI can help finalize content and optimize for better engagement.
                    </p>
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-950/50 dark:hover:text-amber-200">
                      <Lightbulb className="w-4 h-4 mr-1" />
                      AI Publishing Assistant
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                      Optimize Your Portfolio
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Great progress! {stats.published} published courses. Use AI analytics to identify expansion opportunities and boost engagement.
                    </p>
                    <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/50 dark:hover:text-blue-200">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Portfolio Analytics
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Optimization */}
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-1">
                    Revenue Optimization
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                    Current revenue: ${stats.totalRevenue.toLocaleString()}. AI can suggest pricing strategies and content improvements to boost earnings.
                  </p>
                  <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950/50 dark:hover:text-purple-200">
                    <Target className="w-4 h-4 mr-1" />
                    Revenue Insights
                  </Button>
                </div>
              </div>
            </div>

            {/* Student Engagement */}
            <div className="p-4 bg-teal-50 dark:bg-teal-950/20 rounded-lg border border-teal-200 dark:border-teal-700">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-teal-800 dark:text-teal-200 mb-1">
                    Student Success Analytics
                  </h4>
                  <p className="text-sm text-teal-700 dark:text-teal-300 mb-3">
                    {stats.totalEnrollments} total enrollments. AI can analyze student patterns to improve course completion rates.
                  </p>
                  <Button size="sm" variant="outline" className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:border-teal-600 dark:text-teal-300 dark:hover:bg-teal-950/50 dark:hover:text-teal-200">
                    <FileQuestion className="w-4 h-4 mr-1" />
                    Engagement Analysis
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick AI Actions */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quick AI-powered actions for your course portfolio:
              </p>
              <div className="flex flex-wrap gap-2" data-tour="quick-ai-actions">
                <Link href="/teacher/create">
                  <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                    <Brain className="w-4 h-4 mr-1" />
                    AI Course Builder
                  </Button>
                </Link>
                <Button size="sm" variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 dark:border-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-200">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Content Optimizer
                </Button>
                <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950/50 dark:hover:text-purple-200">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Performance Insights
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Create Course Buttons - Desktop */}
      <div className="hidden md:flex justify-end gap-3">
        <Link href="/teacher/create/enhanced">
          <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" data-tour="ai-course-creation">
            <Sparkles className="h-5 w-5 mr-2" />
            AI-Enhanced Creator
          </Button>
        </Link>
        <Link href="/teacher/create">
          <Button size="lg" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/50 dark:hover:text-purple-200">
            <Plus className="h-5 w-5 mr-2" />
            Classic Creator
          </Button>
        </Link>
      </div>

      {/* Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className={cn(
          "rounded-xl overflow-hidden",
          "bg-white dark:bg-gray-800",
          "border border-gray-100 dark:border-gray-700",
          "shadow-sm"
        )}
      >
        <DataTable columns={columns} data={courses} />
      </motion.div>
    </div>
  );
}; 