"use client";

import { useState } from "react";
import { User } from "next-auth";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  BookOpen,
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Play,
  Clock,
  Award,
  Sparkles,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Import existing dashboard components
import dynamic from "next/dynamic";
// Code-split heavy dashboards to reduce initial route payload
const LearnerDashboard = dynamic(
  () => import("./LearnerDashboard").then((m) => m.LearnerDashboard),
  { ssr: false, loading: () => <div className="sr-only">Loading learner dashboard…</div> }
);
const TeacherDashboard = dynamic(
  () => import("./TeacherDashboard").then((m) => m.TeacherDashboard),
  { ssr: false, loading: () => <div className="sr-only">Loading teacher dashboard…</div> }
);
const AffiliateDashboard = dynamic(
  () => import("./AffiliateDashboard").then((m) => m.AffiliateDashboard),
  { ssr: false, loading: () => <div className="sr-only">Loading affiliate dashboard…</div> }
);

interface SimpleDashboardProps {
  user: User & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
}

export function SimpleDashboard({ user }: SimpleDashboardProps) {
  const [activeTab, setActiveTab] = useState("learning");

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Student-only view (no teacher capabilities)
  if (!user.isTeacher && !user.isAffiliate) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Welcome Section */}
        <motion.div variants={itemVariants} className="mb-8 lg:mb-10">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  Welcome back, {user.name}!
                </h1>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-500" />
                </motion.div>
              </div>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                Continue your learning journey and unlock your potential
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <LearnerDashboard user={user} />
        </motion.div>

        {/* Become an Instructor CTA - Enhanced */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="mt-8 lg:mt-10 group relative overflow-hidden shadow-lg rounded-3xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 relative">
              <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white text-xl sm:text-2xl">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg group-hover:shadow-blue-500/50 transition-shadow">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Share Your Knowledge
                </span>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 mt-2 text-base">
                Have expertise to share? Become an instructor and start teaching on Taxomind.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-6 relative">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Create and sell your own courses
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    Earn revenue from your expertise
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    Join our community of educators
                  </li>
                </ul>
                <Link href="/become-instructor">
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg transition-all duration-200 group/btn px-6 py-5 text-base">
                    Become an Instructor
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // Teacher view (with tabs for learning and teaching)
  if (user.isTeacher && !user.isAffiliate) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Welcome Section */}
        <motion.div variants={itemVariants} className="mb-8 lg:mb-10">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  Welcome back, {user.name}!
                </h1>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <Award className="h-6 w-6 sm:h-7 sm:w-7 text-orange-500" />
                </motion.div>
              </div>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                Manage your courses and continue learning
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
            <TabsList className="grid grid-cols-2 w-full max-w-[450px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <TabsTrigger value="learning" className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-lg font-medium">
                <GraduationCap className="h-4 w-4" />
                My Learning
              </TabsTrigger>
              <TabsTrigger value="teaching" className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-lg font-medium">
                <BookOpen className="h-4 w-4" />
                My Teaching
              </TabsTrigger>
            </TabsList>

          <TabsContent value="learning" className="space-y-6">
            <LearnerDashboard user={user} />
          </TabsContent>

          <TabsContent value="teaching" className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-2xl border border-orange-200/50 dark:border-orange-700/30">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Instructor Dashboard</h2>
                <p className="text-base text-slate-600 dark:text-slate-300">
                  Create and manage your courses
                </p>
              </div>
              <Link href="/teacher/create" className="shrink-0">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-5 text-base group/btn">
                  <Plus className="h-5 w-5 mr-2 group-hover/btn:rotate-90 transition-transform" />
                  Create New Course
                </Button>
              </Link>
            </div>
            <TeacherDashboard user={user} />
          </TabsContent>
        </Tabs>
        </motion.div>
      </motion.div>
    );
  }

  // Affiliate view (with tabs for learning and affiliate)
  if (user.isAffiliate && !user.isTeacher) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Welcome Section */}
        <motion.div variants={itemVariants} className="mb-8 lg:mb-10">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  Welcome back, {user.name}!
                </h1>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-green-500" />
                </motion.div>
              </div>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                Track your earnings and continue learning
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
            <TabsList className="grid grid-cols-2 w-full max-w-[450px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <TabsTrigger value="learning" className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-lg font-medium">
                <GraduationCap className="h-4 w-4" />
                My Learning
              </TabsTrigger>
              <TabsTrigger value="affiliate" className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-lg font-medium">
                <DollarSign className="h-4 w-4" />
                Affiliate Dashboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="learning" className="space-y-6">
              <LearnerDashboard user={user} />
            </TabsContent>

            <TabsContent value="affiliate" className="space-y-6">
              <AffiliateDashboard user={user} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    );
  }

  // Teacher + Affiliate view (all capabilities)
  if (user.isTeacher && user.isAffiliate) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Welcome Section */}
        <motion.div variants={itemVariants} className="mb-8 lg:mb-10">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent">
                  Welcome back, {user.name}!
                </h1>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                >
                  <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-purple-500" />
                </motion.div>
              </div>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                Your complete dashboard for learning, teaching, and earning
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
            <TabsList className="grid grid-cols-3 w-full max-w-[650px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <TabsTrigger value="learning" className="flex items-center gap-2 px-3 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-lg font-medium text-sm">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">My Learning</span>
                <span className="sm:hidden">Learn</span>
              </TabsTrigger>
              <TabsTrigger value="teaching" className="flex items-center gap-2 px-3 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-lg font-medium text-sm">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">My Teaching</span>
                <span className="sm:hidden">Teach</span>
              </TabsTrigger>
              <TabsTrigger value="affiliate" className="flex items-center gap-2 px-3 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-lg font-medium text-sm">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Affiliate</span>
                <span className="sm:hidden">Earn</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="learning" className="space-y-6">
              <LearnerDashboard user={user} />
            </TabsContent>

            <TabsContent value="teaching" className="space-y-6 sm:space-y-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-2xl border border-orange-200/50 dark:border-orange-700/30">
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Instructor Dashboard</h2>
                  <p className="text-base text-slate-600 dark:text-slate-300">
                    Create and manage your courses
                  </p>
                </div>
                <Link href="/teacher/create" className="shrink-0">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-5 text-base group/btn">
                    <Plus className="h-5 w-5 mr-2 group-hover/btn:rotate-90 transition-transform" />
                    Create New Course
                  </Button>
                </Link>
              </div>
              <TeacherDashboard user={user} />
            </TabsContent>

            <TabsContent value="affiliate" className="space-y-6">
              <AffiliateDashboard user={user} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    );
  }

  // Default fallback (should not reach here)
  return <LearnerDashboard user={user} />;
}
