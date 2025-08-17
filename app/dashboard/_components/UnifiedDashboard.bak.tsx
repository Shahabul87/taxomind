"use client";

import { useState, useEffect } from "react";
import { User } from "next-auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, 
  BookOpen, 
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Settings,
  ChevronRight,
  Plus,
  Play,
  Award,
  BarChart3,
  Package,
  Target,
  Zap,
  Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import axios from "axios";

// Import individual dashboard components
import { LearnerDashboard } from "./LearnerDashboard";
import { TeacherDashboard } from "./TeacherDashboard";
import { AffiliateDashboard } from "./AffiliateDashboard";

interface UnifiedDashboardProps {
  user: User & {
    isTeacher?: boolean;
    isAffiliate?: boolean;
    teacherActivatedAt?: Date;
    affiliateActivatedAt?: Date;
    affiliateCode?: string;
  };
}

export function UnifiedDashboard({ user }: UnifiedDashboardProps) {
  const [activeMode, setActiveMode] = useState<"learner" | "teacher" | "affiliate">("learner");
  const [isTeacher, setIsTeacher] = useState(user.isTeacher || false);
  const [isAffiliate, setIsAffiliate] = useState(user.isAffiliate || false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingType, setOnboardingType] = useState<"teacher" | "affiliate" | null>(null);

  // Determine available modes based on user flags
  const availableModes = [
    { id: "learner", label: "Student", icon: GraduationCap, available: true },
    { id: "teacher", label: "Instructor", icon: BookOpen, available: isTeacher },
    { id: "affiliate", label: "Affiliate", icon: DollarSign, available: isAffiliate },
  ];

  // Handle becoming a teacher
  const handleBecomeTeacher = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/user/become-teacher");
      if (response.data.success) {
        setIsTeacher(true);
        setActiveMode("teacher");
        toast.success("Welcome to the instructor community! You can now create courses.");
      }
    } catch (error) {
      toast.error("Failed to activate teacher mode");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle becoming an affiliate
  const handleBecomeAffiliate = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/user/become-affiliate");
      if (response.data.success) {
        setIsAffiliate(true);
        setActiveMode("affiliate");
        toast.success("Welcome to the affiliate program! Start earning by promoting courses.");
      }
    } catch (error) {
      toast.error("Failed to activate affiliate mode");
    } finally {
      setIsLoading(false);
    }
  };

  // Mode switcher animation
  const modeVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header with Mode Switcher */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* User Welcome */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Manage your learning journey, teaching, and earnings all in one place
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-2">
              {availableModes.map((mode) => {
                const Icon = mode.icon;
                const isActive = activeMode === mode.id;
                
                if (!mode.available) {
                  // Show activation button for unavailable modes
                  return (
                    <Button
                      key={mode.id}
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        if (mode.id === "teacher") {
                          setOnboardingType("teacher");
                          setShowOnboarding(true);
                        } else if (mode.id === "affiliate") {
                          setOnboardingType("affiliate");
                          setShowOnboarding(true);
                        }
                      }}
                      disabled={isLoading}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      Become {mode.label}
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  );
                }

                return (
                  <Button
                    key={mode.id}
                    variant={isActive ? "default" : "outline"}
                    className={cn(
                      "flex-1 transition-all",
                      isActive && "shadow-lg"
                    )}
                    onClick={() => setActiveMode(mode.id as any)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {mode.label} Mode
                    {isActive && <Badge className="ml-2" variant="secondary">Active</Badge>}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMode}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modeVariants}
          >
            {/* Conditional Dashboard Rendering */}
            {activeMode === "learner" && <LearnerDashboard user={user} />}
            {activeMode === "teacher" && isTeacher && <TeacherDashboard user={user} />}
            {activeMode === "affiliate" && isAffiliate && <AffiliateDashboard user={user} />}
          </motion.div>
        </AnimatePresence>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeMode === "learner" && (
                <>
                  <Button className="w-full justify-start" variant="ghost" asChild>
                    <Link href="/courses">
                      <Play className="h-4 w-4 mr-2" />
                      Browse Courses
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="ghost" asChild>
                    <Link href="/my-courses">
                      <BookOpen className="h-4 w-4 mr-2" />
                      My Learning
                    </Link>
                  </Button>
                </>
              )}
              {activeMode === "teacher" && (
                <>
                  <Button className="w-full justify-start" variant="ghost" asChild>
                    <Link href="/teacher/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Course
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="ghost" asChild>
                    <Link href="/teacher/courses">
                      <Package className="h-4 w-4 mr-2" />
                      Manage Courses
                    </Link>
                  </Button>
                </>
              )}
              {activeMode === "affiliate" && (
                <>
                  <Button className="w-full justify-start" variant="ghost" asChild>
                    <Link href="/affiliate/links">
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Links
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="ghost" asChild>
                    <Link href="/affiliate/earnings">
                      <DollarSign className="h-4 w-4 mr-2" />
                      View Earnings
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeMode === "learner" && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Courses Enrolled</span>
                    <span className="font-bold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Certificates Earned</span>
                    <span className="font-bold">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Learning Streak</span>
                    <span className="font-bold">7 days</span>
                  </div>
                </div>
              )}
              {activeMode === "teacher" && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Courses Created</span>
                    <span className="font-bold">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Total Students</span>
                    <span className="font-bold">234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Revenue</span>
                    <span className="font-bold">$3,456</span>
                  </div>
                </div>
              )}
              {activeMode === "affiliate" && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Referrals</span>
                    <span className="font-bold">45</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Conversions</span>
                    <span className="font-bold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Earnings</span>
                    <span className="font-bold">$567</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Achievements Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Star className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">First Course Complete</p>
                    <p className="text-xs text-slate-600">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">7-Day Streak</p>
                    <p className="text-xs text-slate-600">Today</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6"
          >
            {onboardingType === "teacher" && (
              <>
                <h2 className="text-2xl font-bold mb-4">Become an Instructor</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Share your knowledge with thousands of learners. Create courses, 
                  earn revenue, and build your teaching reputation.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Create unlimited courses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Set your own prices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Get detailed analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Earn 70% revenue share</span>
                  </li>
                </ul>
                <div className="flex gap-3">
                  <Button 
                    className="flex-1" 
                    onClick={handleBecomeTeacher}
                    disabled={isLoading}
                  >
                    {isLoading ? "Activating..." : "Start Teaching"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowOnboarding(false)}
                  >
                    Maybe Later
                  </Button>
                </div>
              </>
            )}
            {onboardingType === "affiliate" && (
              <>
                <h2 className="text-2xl font-bold mb-4">Join Affiliate Program</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Earn commissions by promoting courses. Get your unique referral 
                  link and start earning passive income.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>30% commission on sales</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Real-time tracking dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Monthly payouts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Marketing materials provided</span>
                  </li>
                </ul>
                <div className="flex gap-3">
                  <Button 
                    className="flex-1" 
                    onClick={handleBecomeAffiliate}
                    disabled={isLoading}
                  >
                    {isLoading ? "Activating..." : "Join Program"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowOnboarding(false)}
                  >
                    Maybe Later
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Add this import at the top
import { CheckCircle } from "lucide-react";