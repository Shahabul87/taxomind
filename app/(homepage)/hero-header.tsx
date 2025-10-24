"use client";

import React from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { Brain, ArrowRight, Play, Zap, Shield, Award, Users, Activity, Lightbulb, BookOpen, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BrainIllustration } from "./components/BrainIllustration";
import { AnimatedHeadline } from "./components/AnimatedHeadline";

interface HeroHeaderProps {
  variant?: "default" | "compact";
  showBrainIllustration?: boolean;
}

interface FeaturePillProps {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  color: "purple" | "blue" | "emerald";
}

const FeaturePill: React.FC<FeaturePillProps> = ({ icon: Icon, text, color }) => {
  const shouldReduceMotion = useReducedMotion();

  const colorClasses = {
    purple: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
    blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
  };

  return (
    <motion.div
      className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border ${colorClasses[color]} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
      style={{ willChange: 'transform' }}
      whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" aria-hidden="true" />
      <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{text}</span>
    </motion.div>
  );
};

export default function HeroHeader({
  variant = "default",
  showBrainIllustration = true,
}: HeroHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = React.useRef<HTMLDivElement | null>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });

  const brandBadgeAnimation = shouldReduceMotion
    ? { transition: { duration: 0.01 } }
    : {
        initial: { scale: 0, rotate: -180 },
        animate: isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 },
        transition: { type: "spring" as const, duration: 0.8 },
      };

  const headlineAnimation = shouldReduceMotion
    ? { transition: { duration: 0.01 } }
    : {
        initial: { opacity: 0, y: 20 },
        animate: isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
        transition: { duration: 0.6, delay: 0.2 },
      };

  const descriptionAnimation = shouldReduceMotion
    ? { transition: { duration: 0.01 } }
    : {
        initial: { opacity: 0 },
        animate: isInView ? { opacity: 1 } : { opacity: 0 },
        transition: { duration: 0.8, delay: 0.4 },
      };

  const ctaButtonsAnimation = shouldReduceMotion
    ? { transition: { duration: 0.01 } }
    : {
        initial: { opacity: 0, y: 20 },
        animate: isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
        transition: { duration: 0.6, delay: 0.5 },
      };

  const brainSVGAnimation = shouldReduceMotion
    ? { transition: { duration: 0.01 } }
    : {
        initial: { opacity: 0, x: 50, scale: 0.95 },
        animate: isInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 50, scale: 0.95 },
        transition: { duration: 0.8, delay: 0.3, ease: "easeOut" as const },
      };

  const floatingStatsAnimation = shouldReduceMotion
    ? {}
    : {
        animate: { y: [0, -10, 0] },
        transition: { duration: 3, repeat: Infinity },
      };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-10 sm:py-12 md:py-16 lg:py-20"
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 xl:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* LEFT COLUMN - Content */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 pr-0 lg:pr-2">
            {/* Learning Journey Flow: Create → Learn → Share */}
            <motion.div
              className="inline-flex items-center gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4"
              style={{ willChange: 'transform' }}
              {...brandBadgeAnimation}
            >
              {/* Create */}
              <motion.div 
                className="relative flex flex-col items-center gap-1.5 sm:gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ y: -6 }}
              >
                <motion.div 
                  className="relative group"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}
                >
                  {/* Multiple glow layers for 3D effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 opacity-40 blur-xl" aria-hidden="true" />
                  <div className="absolute -inset-1.5 rounded-full bg-purple-500/30 blur-lg" aria-hidden="true" />
                  
                  {/* 3D Shadow layers */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent to-purple-900/40 translate-y-1" aria-hidden="true" />
                  
                  {/* Main badge with 3D depth */}
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-400 via-purple-600 to-purple-800 shadow-[0_15px_40px_-10px_rgba(168,85,247,0.6)] flex items-center justify-center ring-3 ring-purple-300/30 dark:ring-purple-600/30 group-hover:shadow-[0_20px_50px_-10px_rgba(168,85,247,0.8)] transition-all duration-300" aria-hidden="true">
                    {/* Inner highlight for 3D effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
                    <Lightbulb className="relative w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)]" />
                  </div>
                </motion.div>
                <span className="text-[10px] sm:text-xs md:text-sm font-bold tracking-wide text-purple-800 dark:text-purple-300 uppercase drop-shadow-sm">Create</span>
              </motion.div>

              {/* Thicker Arrow 1 */}
              <motion.div 
                className="flex items-center gap-0.5 mx-0.5"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="w-6 sm:w-8 md:w-10 h-1 sm:h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-400 dark:to-indigo-400 rounded-full relative shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 blur-md opacity-60" />
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400 drop-shadow-lg" strokeWidth={3} aria-hidden="true" />
              </motion.div>

              {/* Learn */}
              <motion.div 
                className="relative flex flex-col items-center gap-1.5 sm:gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                whileHover={{ y: -6 }}
              >
                <motion.div 
                  className="relative group"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" as const, delay: 0.5 }}
                >
                  {/* Multiple glow layers for 3D effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 opacity-40 blur-xl" aria-hidden="true" />
                  <div className="absolute -inset-1.5 rounded-full bg-indigo-500/30 blur-lg" aria-hidden="true" />
                  
                  {/* 3D Shadow layers */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent to-indigo-900/40 translate-y-1" aria-hidden="true" />
                  
                  {/* Main badge with 3D depth */}
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-indigo-400 via-indigo-600 to-indigo-800 shadow-[0_15px_40px_-10px_rgba(99,102,241,0.6)] flex items-center justify-center ring-3 ring-indigo-300/30 dark:ring-indigo-600/30 group-hover:shadow-[0_20px_50px_-10px_rgba(99,102,241,0.8)] transition-all duration-300" aria-hidden="true">
                    {/* Inner highlight for 3D effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
                    <Brain className="relative w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)]" />
                  </div>
                </motion.div>
                <span className="text-[10px] sm:text-xs md:text-sm font-bold tracking-wide text-indigo-800 dark:text-indigo-300 uppercase drop-shadow-sm">Learn</span>
              </motion.div>

              {/* Thicker Arrow 2 */}
              <motion.div 
                className="flex items-center gap-0.5 mx-0.5"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <div className="w-6 sm:w-8 md:w-10 h-1 sm:h-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 dark:from-indigo-400 dark:to-blue-400 rounded-full relative shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 blur-md opacity-60" />
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400 drop-shadow-lg" strokeWidth={3} aria-hidden="true" />
              </motion.div>

              {/* Share */}
              <motion.div 
                className="relative flex flex-col items-center gap-1.5 sm:gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                whileHover={{ y: -6 }}
              >
                <motion.div 
                  className="relative group"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const, delay: 1 }}
                >
                  {/* Multiple glow layers for 3D effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-40 blur-xl" aria-hidden="true" />
                  <div className="absolute -inset-1.5 rounded-full bg-blue-500/30 blur-lg" aria-hidden="true" />
                  
                  {/* 3D Shadow layers */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent to-blue-900/40 translate-y-1" aria-hidden="true" />
                  
                  {/* Main badge with 3D depth */}
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 shadow-[0_15px_40px_-10px_rgba(59,130,246,0.6)] flex items-center justify-center ring-3 ring-blue-300/30 dark:ring-blue-600/30 group-hover:shadow-[0_20px_50px_-10px_rgba(59,130,246,0.8)] transition-all duration-300" aria-hidden="true">
                    {/* Inner highlight for 3D effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
                    <Share2 className="relative w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)]" />
                  </div>
                </motion.div>
                <span className="text-[10px] sm:text-xs md:text-sm font-bold tracking-wide text-blue-800 dark:text-blue-300 uppercase drop-shadow-sm">Share</span>
              </motion.div>
            </motion.div>

            {/* Headline with Animation */}
            <AnimatedHeadline isInView={isInView} />

            {/* Description */}
            <motion.p
              className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-gray-300 max-w-2xl leading-relaxed"
              style={{ willChange: 'opacity' }}
              {...descriptionAnimation}
            >
              Master every cognitive level with AI-driven personalization. From remembering facts to creating
              original work, our platform adapts to your learning journey across all 6 stages of Bloom&apos;s
              Taxonomy.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-row gap-2 sm:gap-3 md:gap-4 w-full md:w-auto"
              style={{ willChange: 'transform, opacity' }}
              {...ctaButtonsAnimation}
            >
              <Link href="/auth/register" className="flex-1 md:flex-initial">
                <Button
                  size="lg"
                  className="w-full group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-h-[48px] md:min-h-[44px] text-sm sm:text-base font-semibold focus-visible:ring-4 focus-visible:ring-purple-500 focus-visible:ring-offset-2 px-4 sm:px-6"
                  aria-label="Start your learning journey - Register now"
                >
                  <span className="hidden sm:inline">Start Your Journey</span>
                  <span className="sm:hidden">Get Started</span>
                  <ArrowRight className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/features" className="flex-1 md:flex-initial">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 min-h-[48px] md:min-h-[44px] text-sm sm:text-base font-semibold focus-visible:ring-4 focus-visible:ring-purple-500 focus-visible:ring-offset-2 px-4 sm:px-6"
                  aria-label="Watch product demo video"
                >
                  <Play className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">Watch Demo</span>
                  <span className="sm:hidden">Demo</span>
                </Button>
              </Link>
            </motion.div>

            {/* Feature Pills */}
            <motion.div
              className="flex flex-wrap gap-2 sm:gap-3 pt-3 sm:pt-4"
              style={{ willChange: 'opacity' }}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              role="list"
              aria-label="Key platform features"
            >
              <FeaturePill icon={Brain} text="6 Cognitive Levels" color="purple" />
              <FeaturePill icon={Zap} text="AI-Adaptive Paths" color="blue" />
              <FeaturePill icon={Shield} text="Research-Backed" color="emerald" />
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 sm:pt-6 opacity-60"
              style={{ willChange: 'opacity' }}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 0.6 } : { opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              role="list"
              aria-label="Trust indicators"
            >
              <div className="flex items-center gap-2" role="listitem">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" aria-hidden="true" />
                <span className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 whitespace-nowrap">Award Winning</span>
              </div>
              <div className="flex items-center gap-2" role="listitem">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" aria-hidden="true" />
                <span className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 whitespace-nowrap">10K+ Learners</span>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN - Brain SVG */}
          {showBrainIllustration && (
            <div className="lg:col-span-5 flex items-center justify-center mt-8 lg:mt-0">
              <motion.div
                className="relative w-full max-w-[400px] sm:max-w-[500px] lg:max-w-[600px] aspect-square"
                style={{ willChange: 'transform, opacity' }}
                {...brainSVGAnimation}
              >
                {/* Background Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 dark:from-purple-500/20 dark:to-blue-500/20 blur-3xl rounded-full" aria-hidden="true" />

                {/* Brain SVG Component */}
                <BrainIllustration />

                {/* Floating Stats */}
                <motion.div
                  className="absolute top-6 sm:top-10 right-0 sm:right-0 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border border-purple-200 dark:border-purple-500/30"
                  style={{ willChange: 'transform' }}
                  {...floatingStatsAnimation}
                  role="status"
                  aria-live="polite"
                  aria-label="AI analysis status indicator"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                      AI Analyzing...
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
