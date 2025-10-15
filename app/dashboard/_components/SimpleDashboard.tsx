"use client";

import { useState } from "react";
import { User } from "next-auth";
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
  Award
} from "lucide-react";
import Link from "next/link";

// Import existing dashboard components
import { LearnerDashboard } from "./LearnerDashboard";
import { TeacherDashboard } from "./TeacherDashboard";
import { AffiliateDashboard } from "./AffiliateDashboard";

interface SimpleDashboardProps {
  user: User & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
}

export function SimpleDashboard({ user }: SimpleDashboardProps) {
  const [activeTab, setActiveTab] = useState("learning");

  // Student-only view (no teacher capabilities)
  if (!user.isTeacher && !user.isAffiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Welcome back, {user.name}!</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Continue your learning journey
            </p>
          </div>

          <LearnerDashboard user={user} />

          {/* Become an Instructor CTA */}
          <Card className="mt-8 shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
            <CardHeader className="border-b border-gray-200/70 dark:border-gray-800/70">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                Share Your Knowledge
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400 mt-1">
                Have expertise to share? Become an instructor and start teaching on Taxomind.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Link href="/become-instructor">
                <Button className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700">
                  Become an Instructor
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Teacher view (with tabs for learning and teaching)
  if (user.isTeacher && !user.isAffiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Welcome back, {user.name}!</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Manage your courses and continue learning
            </p>
          </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              My Learning
            </TabsTrigger>
            <TabsTrigger value="teaching" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              My Teaching
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learning" className="space-y-6">
            <LearnerDashboard user={user} />
          </TabsContent>

          <TabsContent value="teaching" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Instructor Dashboard</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Create and manage your courses
                </p>
              </div>
              <Link href="/teacher/create">
                <Button className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Course
                </Button>
              </Link>
            </div>
            <TeacherDashboard user={user} />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    );
  }

  // Affiliate view (with tabs for learning and affiliate)
  if (user.isAffiliate && !user.isTeacher) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Welcome back, {user.name}!</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Track your earnings and continue learning
            </p>
          </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              My Learning
            </TabsTrigger>
            <TabsTrigger value="affiliate" className="flex items-center gap-2">
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
        </div>
      </div>
    );
  }

  // Teacher + Affiliate view (all capabilities)
  if (user.isTeacher && user.isAffiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Welcome back, {user.name}!</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Your complete dashboard for learning, teaching, and earning
            </p>
          </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-[600px]">
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              My Learning
            </TabsTrigger>
            <TabsTrigger value="teaching" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              My Teaching
            </TabsTrigger>
            <TabsTrigger value="affiliate" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Affiliate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learning" className="space-y-6">
            <LearnerDashboard user={user} />
          </TabsContent>

          <TabsContent value="teaching" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Instructor Dashboard</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Create and manage your courses
                </p>
              </div>
              <Link href="/teacher/create">
                <Button className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
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
        </div>
      </div>
    );
  }

  // Default fallback (should not reach here)
  return <LearnerDashboard user={user} />;
}