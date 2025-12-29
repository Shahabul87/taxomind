"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Trophy,
  Target,
  Clock,
  Users,
  Star,
  Sparkles,
  ChevronRight,
  Zap,
  BookOpen,
  BarChart3,
  Calendar,
  Award,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    sections: Array<{
      id: string;
      duration?: number | null;
      user_progress: Array<{ isCompleted: boolean }>;
    }>;
  }>;
}

interface DashboardHeroProps {
  course: Course;
  user: { id: string; name?: string | null; image?: string | null };
  progressPercentage: number;
  completedSections: number;
  totalSections: number;
  nextSection?: {
    chapter: { id: string; title: string };
    section: { id: string; title: string };
  } | null;
  streakDays?: number;
}

// Animated counter component
const AnimatedCounter = ({
  value,
  suffix = "",
  prefix = "",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 40;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}
      {count}
      {suffix}
    </span>
  );
};

export function DashboardHero({
  course,
  user,
  progressPercentage,
  completedSections,
  totalSections,
  nextSection,
  streakDays = 0,
}: DashboardHeroProps) {
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(true);

  // Parallax effects
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 1.1]);

  // Calculate estimated time remaining
  const remainingTime = course.chapters.reduce((acc, chapter) => {
    return (
      acc +
      chapter.sections.reduce((sectionAcc, section) => {
        if (!section.user_progress?.some((p) => p.isCompleted)) {
          return sectionAcc + (section.duration || 10);
        }
        return sectionAcc;
      }, 0)
    );
  }, 0);

  const isCompleted = progressPercentage === 100;

  // Listen for scroll to show/hide condensed header
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY < 200);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Background with Parallax */}
      <motion.div
        style={{ y: backgroundY, scale }}
        className="absolute inset-0 z-0"
      >
        {/* Course Image Background */}
        {course.imageUrl ? (
          <Image
            src={course.imageUrl}
            alt=""
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900" />
        )}

        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/90 to-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 via-transparent to-purple-900/50" />

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 min-h-[50vh] lg:min-h-[55vh]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Top Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-8"
          >
            <Link
              href={`/courses/${course.id}`}
              className="group flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Course</span>
            </Link>

            {course.category && (
              <Badge className="bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20">
                {course.category.name}
              </Badge>
            )}
          </motion.div>

          {/* Hero Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Welcome Message */}
              <div className="flex items-center gap-3">
                <span className="text-lg text-white/80">
                  Welcome back,{" "}
                  <span className="text-white font-semibold">
                    {user.name || "Learner"}
                  </span>
                </span>
                {streakDays > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white text-sm font-bold"
                  >
                    <Flame className="h-4 w-4" />
                    <span>{streakDays} day streak</span>
                  </motion.div>
                )}
              </div>

              {/* Course Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                {course.title}
              </h1>

              {/* Course Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90">
                  <Image
                    src={course.user.image || "/placeholder-avatar.png"}
                    alt={course.user.name || "Instructor"}
                    width={24}
                    height={24}
                    className="rounded-full ring-2 ring-white/30"
                  />
                  <span>{course.user.name}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90">
                  <Users className="h-4 w-4" />
                  <span>{course._count.Enrollment.toLocaleString()} students</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.chapters.length} chapters</span>
                </div>
              </div>

              {/* Continue Learning CTA */}
              {nextSection && !isCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="pt-4"
                >
                  <Link
                    href={`/courses/${course.id}/learn/${nextSection.chapter.id}/sections/${nextSection.section.id}`}
                  >
                    <Button
                      size="lg"
                      className="group bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 text-lg px-8"
                    >
                      <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                      Continue Learning
                      <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <p className="text-white/60 text-sm mt-3">
                    {nextSection.chapter.title} &bull;{" "}
                    {nextSection.section.title}
                  </p>
                </motion.div>
              )}

              {isCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl border border-yellow-500/30"
                >
                  <Trophy className="h-8 w-8 text-yellow-400" />
                  <div>
                    <p className="text-yellow-400 font-bold text-lg">
                      Course Completed!
                    </p>
                    <p className="text-white/70 text-sm">
                      Congratulations on finishing this course
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Right Content - Progress Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30 animate-pulse" />

                {/* Progress Card */}
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 lg:p-8">
                  {/* Progress Ring */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      {/* Background circle */}
                      <svg className="w-40 h-40 transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-white/10"
                        />
                        <motion.circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="url(#progressGradient)"
                          strokeWidth="12"
                          fill="none"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: "0 440" }}
                          animate={{
                            strokeDasharray: `${(progressPercentage / 100) * 440} 440`,
                          }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                        <defs>
                          <linearGradient
                            id="progressGradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                          >
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#14b8a6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Center content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl lg:text-5xl font-bold text-white">
                          <AnimatedCounter
                            value={Math.round(progressPercentage)}
                            suffix="%"
                          />
                        </span>
                        <span className="text-white/60 text-sm">Complete</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Target className="h-5 w-5 text-emerald-400" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {completedSections}
                      </p>
                      <p className="text-white/50 text-xs">Completed</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-blue-400" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {totalSections - completedSections}
                      </p>
                      <p className="text-white/50 text-xs">Remaining</p>
                    </div>
                  </div>

                  {/* Time Remaining */}
                  <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Time Remaining</p>
                      <p className="text-xl font-bold text-white">
                        {remainingTime > 60
                          ? `${Math.ceil(remainingTime / 60)}h ${remainingTime % 60}m`
                          : `${remainingTime}m`}
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-6 flex gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Certificates
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg
          viewBox="0 0 1440 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 50L48 45.7C96 41 192 33 288 35.3C384 37 480 50 576 58.3C672 67 768 70 864 65C960 60 1056 47 1152 43.3C1248 40 1344 47 1392 50L1440 53V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z"
            className="fill-slate-50 dark:fill-slate-900"
          />
        </svg>
      </div>
    </div>
  );
}
