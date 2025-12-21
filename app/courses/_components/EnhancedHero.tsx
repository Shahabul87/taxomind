"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Globe2,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EnhancedHeroProps {
  statistics: {
    totalCourses: number;
    totalEnrollments: number;
    averageRating: number;
  };
}

export function EnhancedHero({ statistics }: EnhancedHeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      tag: "Transform Your Career",
      title: "Master In-Demand Skills with Expert-Led Courses",
      subtitle: "Join 50,000+ professionals advancing their careers through world-class online learning",
      gradient: "from-blue-600 via-indigo-600 to-purple-600",
      features: ["AI-Powered Learning", "Industry Certificates", "Lifetime Access"]
    },
    {
      id: 2,
      tag: "Learn From The Best",
      title: "World-Class Instructors, Real-World Projects",
      subtitle: "Learn from industry leaders and work on hands-on projects that matter",
      gradient: "from-emerald-600 via-teal-600 to-cyan-600",
      features: ["Expert Instructors", "Practical Projects", "Career Support"]
    },
    {
      id: 3,
      tag: "Enterprise Ready",
      title: "Empower Your Team with Skills That Drive Results",
      subtitle: "Trusted by Fortune 500 companies to upskill their workforce",
      gradient: "from-purple-600 via-pink-600 to-rose-600",
      features: ["Team Licenses", "Custom Content", "Analytics Dashboard"]
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlideData = slides[currentSlide];

  return (
    <section className="relative min-h-[60vh] xs:min-h-[65vh] sm:min-h-[70vh] md:min-h-[80vh] lg:min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Static Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 xs:w-80 xs:h-80 sm:w-96 sm:h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 xs:w-80 xs:h-80 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 xs:w-80 xs:h-80 sm:w-96 sm:h-96 bg-pink-500/10 rounded-full blur-3xl" />

        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:2rem_2rem] xs:bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]" />
      </div>

      <div className="relative container mx-auto px-3 xs:px-4 sm:px-6 py-12 xs:py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-6 xs:gap-8 sm:gap-10 md:gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-8"
          >
            {/* Tag Badge */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Badge className="bg-white/10 backdrop-blur-md border-white/20 text-white px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 text-xs xs:text-sm">
                  <Sparkles className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 mr-1.5 xs:mr-2" />
                  {currentSlideData.tag}
                </Badge>
              </motion.div>
            </AnimatePresence>

            {/* Main Heading */}
            <AnimatePresence mode="wait">
              <motion.h1
                key={`title-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight break-words"
              >
                <span className={cn(
                  "bg-gradient-to-r bg-clip-text text-transparent",
                  currentSlideData.gradient
                )}>
                  {currentSlideData.title.split(' ').slice(0, 3).join(' ')}
                </span>
                {' '}
                <span className="text-white">
                  {currentSlideData.title.split(' ').slice(3).join(' ')}
                </span>
              </motion.h1>
            </AnimatePresence>

            {/* Subtitle */}
            <AnimatePresence mode="wait">
              <motion.p
                key={`subtitle-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-sm xs:text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl break-words"
              >
                {currentSlideData.subtitle}
              </motion.p>
            </AnimatePresence>

            {/* Feature Pills */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`features-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap gap-2 xs:gap-2.5 sm:gap-3"
              >
                {currentSlideData.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 xs:gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2"
                  >
                    <CheckCircle2 className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs xs:text-sm text-white font-medium break-words">{feature}</span>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap gap-2.5 xs:gap-3 sm:gap-4"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl px-4 xs:px-6 sm:px-8 py-3 xs:py-4 sm:py-6 text-sm xs:text-base sm:text-lg group w-full xs:w-auto"
                asChild
              >
                <Link href="/auth/register">
                  Start Learning Free
                  <ArrowRight className="ml-1.5 xs:ml-2 w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 px-4 xs:px-6 sm:px-8 py-3 xs:py-4 sm:py-6 text-sm xs:text-base sm:text-lg group w-full xs:w-auto"
                asChild
              >
                <Link href="#demo">
                  <Play className="mr-1.5 xs:mr-2 w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
                  Watch Demo
                </Link>
              </Button>
            </motion.div>

            {/* Live Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap gap-4 xs:gap-5 sm:gap-6 pt-3 xs:pt-4"
            >
              <div className="flex items-center gap-1.5 xs:gap-2">
                <div className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Users className="w-5 h-5 xs:w-5.5 xs:h-5.5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xl xs:text-2xl font-bold text-white">
                    {statistics.totalEnrollments > 0
                      ? `${statistics.totalEnrollments.toLocaleString()}+`
                      : "Growing"}
                  </p>
                  <p className="text-xs xs:text-sm text-slate-400">Active Learners</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 xs:gap-2">
                <div className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <TrendingUp className="w-5 h-5 xs:w-5.5 xs:h-5.5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xl xs:text-2xl font-bold text-white">
                    {statistics.totalCourses > 0
                      ? `${statistics.totalCourses}+`
                      : "Coming"}
                  </p>
                  <p className="text-xs xs:text-sm text-slate-400">Expert Courses</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 xs:gap-2">
                <div className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Award className="w-5 h-5 xs:w-5.5 xs:h-5.5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xl xs:text-2xl font-bold text-white">
                    {statistics.averageRating > 0
                      ? `${statistics.averageRating.toFixed(1)}★`
                      : "New ★"}
                  </p>
                  <p className="text-xs xs:text-sm text-slate-400">Average Rating</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Visual Element */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block relative"
          >
            <div className="relative">
              {/* Floating Cards */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-72"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Advanced React</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">By Sarah Johnson</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">4.9★</span>
                  </div>
                  <Badge className="bg-emerald-500 text-white">Bestseller</Badge>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-20 left-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-64"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold text-slate-900 dark:text-white">12,450</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Enrolled this week</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-1/2 -right-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-2xl p-6 w-56 text-white"
              >
                <Globe2 className="w-8 h-8 mb-3" />
                <p className="font-bold text-2xl mb-1">150+</p>
                <p className="text-sm opacity-90">Countries Worldwide</p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/30"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
