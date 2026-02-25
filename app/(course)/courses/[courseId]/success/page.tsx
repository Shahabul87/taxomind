"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Play,
  BookOpen,
  Clock,
  Users,
  Star,
  Trophy,
  Rocket,
  Calendar,
  Target,
  Sparkles,
  ArrowRight,
  Gift,
  Zap,
  Award,
  ChevronRight,
  Share2,
  Download,
  Bell,
  MessageCircle,
  GraduationCap,
  TrendingUp,
  Flame,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

interface CourseData {
  id: string;
  title: string;
  imageUrl: string | null;
  user: {
    name: string | null;
    image: string | null;
  };
  chapters: Array<{
    id: string;
    title: string;
    sections: Array<{ id: string }>;
  }>;
  _count: {
    Enrollment: number;
  };
}

interface EnrollmentData {
  Course: CourseData;
}

export default function CourseSuccessPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courseId, setCourseId] = useState<string>("");
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [animationStep, setAnimationStep] = useState(0);

  // Get window size for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Stop confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Animation sequence
  useEffect(() => {
    const timers = [
      setTimeout(() => setAnimationStep(1), 300),
      setTimeout(() => setAnimationStep(2), 600),
      setTimeout(() => setAnimationStep(3), 900),
      setTimeout(() => setAnimationStep(4), 1200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Fetch enrollment data
  useEffect(() => {
    const fetchData = async () => {
      const resolvedParams = await params;
      setCourseId(resolvedParams.courseId);

      const isSuccess = searchParams.get("success") === "1";
      if (!isSuccess) {
        router.push(`/courses/${resolvedParams.courseId}`);
        return;
      }

      try {
        const sessionId = searchParams.get("session_id");
        const url = sessionId
          ? `/api/courses/${resolvedParams.courseId}/enrollment?session_id=${sessionId}`
          : `/api/courses/${resolvedParams.courseId}/enrollment`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setEnrollment(data);
        }
      } catch (error) {
        console.error("Error fetching enrollment:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [params, searchParams, router]);

  if (isLoading) {
    return <SuccessPageSkeleton />;
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading your enrollment...</h1>
          <p className="text-slate-600">Please wait while we confirm your enrollment.</p>
        </div>
      </div>
    );
  }

  const { Course: course } = enrollment;
  const firstChapter = course.chapters[0];
  const totalChapters = course.chapters.length;
  const totalSections = course.chapters.reduce(
    (acc, ch) => acc + ch.sections.length,
    0
  );
  const estimatedHours = Math.ceil(totalSections * 0.3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.1}
          colors={["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]}
        />
      )}

      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Celebration Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-10"
        >
          {/* Animated Success Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative inline-flex mb-6"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
              </motion.div>
            </div>
            {/* Sparkles */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-8 h-8 text-amber-400" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: animationStep >= 1 ? 1 : 0, y: animationStep >= 1 ? 0 : 20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <PartyPopper className="w-8 h-8 text-amber-500" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent">
                Enrollment Successful!
              </h1>
              <PartyPopper className="w-8 h-8 text-amber-500 scale-x-[-1]" />
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Your learning adventure begins now
            </p>
          </motion.div>

          {/* Achievement Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: animationStep >= 2 ? 1 : 0, scale: animationStep >= 2 ? 1 : 0.8 }}
            transition={{ duration: 0.4 }}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full border border-amber-200 dark:border-amber-700"
          >
            <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              +100 XP Earned for Enrollment!
            </span>
          </motion.div>
        </motion.div>

        {/* Course Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: animationStep >= 2 ? 1 : 0, y: animationStep >= 2 ? 0 : 30 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card className="overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl shadow-indigo-500/10">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Course Image */}
                <div className="relative md:w-64 h-48 md:h-auto flex-shrink-0">
                  {course.imageUrl ? (
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                      <GraduationCap className="w-16 h-16 text-white/80" />
                    </div>
                  )}
                  {/* Overlay Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-emerald-500 text-white border-0 shadow-lg">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Enrolled
                    </Badge>
                  </div>
                </div>

                {/* Course Info */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {course.title}
                      </h2>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          {course.user.image ? (
                            <Image
                              src={course.user.image}
                              alt={course.user.name || "Instructor"}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                {course.user.name?.charAt(0) || "I"}
                              </span>
                            </div>
                          )}
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            by {course.user.name || "Instructor"}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                            {course._count.Enrollment.toLocaleString()} students
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-full">
                          <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            {totalChapters} chapters
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-full">
                          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            ~{estimatedHours}h total
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: animationStep >= 3 ? 1 : 0, y: animationStep >= 3 ? 0 : 30 }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-2 gap-6 mb-8"
        >
          {/* Start Learning Card */}
          <Card className="group overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 border-0 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6 relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "24px 24px"
                }} />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Rocket className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Start Learning</h3>
                    <p className="text-white/80 text-sm">Begin your journey now</p>
                  </div>
                </div>

                <p className="text-white/90 mb-5">
                  {firstChapter
                    ? `Ready to dive into "${firstChapter.title}"?`
                    : "Your course is ready to begin!"}
                </p>

                <Link href={`/courses/${course.id}/learn`}>
                  <Button
                    size="lg"
                    className="w-full bg-white text-indigo-600 hover:bg-white/90 font-semibold shadow-lg group-hover:shadow-xl transition-all"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Course
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
              <div className="absolute -top-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </CardContent>
          </Card>

          {/* My Courses Card */}
          <Card className="group overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    My Courses
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    View all enrolled courses
                  </p>
                </div>
              </div>

              <p className="text-slate-700 dark:text-slate-300 mb-5">
                Access your complete course library and track progress across all courses.
              </p>

              <Link href="/dashboard/user/my-courses">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 font-semibold"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  View My Courses
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Learning Roadmap */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: animationStep >= 4 ? 1 : 0, y: animationStep >= 4 ? 0 : 30 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl flex items-center justify-center">
                  <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Your Learning Roadmap
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Follow these steps to maximize your learning
                  </p>
                </div>
              </div>

              <div className="space-y-0">
                {[
                  {
                    icon: Calendar,
                    title: "Set Your Learning Schedule",
                    description: "Dedicate 30 minutes daily for consistent progress and better retention.",
                    color: "indigo",
                    badge: "Day 1",
                  },
                  {
                    icon: Target,
                    title: "Complete Your First Chapter",
                    description: "Finish the introduction to unlock achievements and build momentum.",
                    color: "purple",
                    badge: "Week 1",
                  },
                  {
                    icon: MessageCircle,
                    title: "Join the Community",
                    description: "Connect with fellow learners, ask questions, and share insights.",
                    color: "pink",
                    badge: "Ongoing",
                  },
                  {
                    icon: Award,
                    title: "Earn Your Certificate",
                    description: "Complete all chapters to receive your course completion certificate.",
                    color: "emerald",
                    badge: "Final Goal",
                  },
                ].map((step, index) => (
                  <div key={index} className="relative flex gap-4">
                    {/* Timeline Line */}
                    {index !== 3 && (
                      <div className="absolute left-5 top-12 w-0.5 h-16 bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800" />
                    )}

                    {/* Icon */}
                    <div className={cn(
                      "relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      step.color === "indigo" && "bg-indigo-100 dark:bg-indigo-900/50",
                      step.color === "purple" && "bg-purple-100 dark:bg-purple-900/50",
                      step.color === "pink" && "bg-pink-100 dark:bg-pink-900/50",
                      step.color === "emerald" && "bg-emerald-100 dark:bg-emerald-900/50",
                    )}>
                      <step.icon className={cn(
                        "w-5 h-5",
                        step.color === "indigo" && "text-indigo-600 dark:text-indigo-400",
                        step.color === "purple" && "text-purple-600 dark:text-purple-400",
                        step.color === "pink" && "text-pink-600 dark:text-pink-400",
                        step.color === "emerald" && "text-emerald-600 dark:text-emerald-400",
                      )} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-8">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {step.title}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {step.badge}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: animationStep >= 4 ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
            <Share2 className="w-4 h-4 mr-2" />
            Share Achievement
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
            <Bell className="w-4 h-4 mr-2" />
            Set Reminder
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
        </motion.div>

        {/* Support Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: animationStep >= 4 ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-6 text-sm text-slate-500 dark:text-slate-500"
        >
          Need help?{" "}
          <Link href="/support" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Contact Support
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function SuccessPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Skeleton */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 animate-pulse" />
          <div className="h-10 w-80 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto mb-3 animate-pulse" />
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mx-auto animate-pulse" />
        </div>

        {/* Course Card Skeleton */}
        <div className="h-48 bg-white/80 dark:bg-slate-800/80 rounded-2xl mb-8 animate-pulse" />

        {/* Action Cards Skeleton */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
          <div className="h-48 bg-white/80 dark:bg-slate-800/80 rounded-2xl animate-pulse" />
        </div>

        {/* Roadmap Skeleton */}
        <div className="h-80 bg-white/80 dark:bg-slate-800/80 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
