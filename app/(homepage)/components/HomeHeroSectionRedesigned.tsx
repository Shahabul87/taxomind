'use client';

import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Brain,
  Lightbulb,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  Award,
  Zap,
  Activity,
  LogIn
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { UserMenu } from '@/app/(homepage)/_components/user-menu';

/**
 * Redesigned Home Hero Section
 * Color System: Based on analytics_page_color.md
 * Theme: "Learn by creating and sharing" with Bloom's Taxonomy cognitive tracking
 */

export default function HomeHeroSectionRedesigned() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' });
  const user = useCurrentUser();

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.6,
      },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const scaleIn = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.5,
      },
    },
  };

  return (
    <section
      ref={sectionRef}
      role="region"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 min-h-screen flex items-center py-16 sm:py-20 lg:py-24"
    >
      {/* Top Navigation - Taxomind Logo & Text (aligned with content) */}
      <div className="absolute top-4 left-0 right-0 z-50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 sm:gap-2 group transition-opacity hover:opacity-90"
            aria-label="Go to Taxomind home page"
          >
            <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden transition-transform group-hover:scale-110">
              <Image
                src="/taxomind-logo.png"
                alt="Taxomind Logo"
                width={28}
                height={28}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              Taxomind
            </span>
          </Link>
        </div>
      </div>

      <div className="absolute top-4 right-16 sm:right-20 z-50">
        {user ? (
          <UserMenu user={user} />
        ) : (
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white transition-all font-semibold text-sm shadow-md hover:shadow-lg"
            aria-label="Sign in to your account"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline-block">Sign In</span>
          </Link>
        )}
      </div>

      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 opacity-30" aria-hidden="true">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-200 dark:bg-indigo-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-purple-200 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">

          {/* LEFT COLUMN - Content */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">

            {/* Learning Journey Flow */}
            <motion.div
              className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              style={{ willChange: 'transform, opacity' }}
            >
              {/* Create Badge */}
              <motion.div
                className="group relative flex flex-col items-center gap-2"
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 opacity-20 blur-xl group-hover:opacity-40 transition-opacity" aria-hidden="true" />

                  {/* Main badge - Purple gradient */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg flex items-center justify-center ring-2 ring-purple-300/50 dark:ring-purple-500/30 group-hover:shadow-xl transition-all">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
                    <Lightbulb className="relative w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-md" />
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-wide text-purple-700 dark:text-purple-300 uppercase">Create</span>
              </motion.div>

              {/* Arrow 1 */}
              <motion.div
                className="flex items-center gap-1 mb-6"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="w-8 sm:w-12 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-sm" />
                <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} aria-hidden="true" />
              </motion.div>

              {/* Learn Badge */}
              <motion.div
                className="group relative flex flex-col items-center gap-2"
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 opacity-20 blur-xl group-hover:opacity-40 transition-opacity" aria-hidden="true" />

                  {/* Main badge - Blue to Indigo gradient */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg flex items-center justify-center ring-2 ring-blue-300/50 dark:ring-blue-500/30 group-hover:shadow-xl transition-all">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
                    <Brain className="relative w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-md" />
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-wide text-blue-700 dark:text-blue-300 uppercase">Learn</span>
              </motion.div>

              {/* Arrow 2 */}
              <motion.div
                className="flex items-center gap-1 mb-6"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="w-8 sm:w-12 h-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full shadow-sm" />
                <ArrowRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} aria-hidden="true" />
              </motion.div>

              {/* Share Badge */}
              <motion.div
                className="group relative flex flex-col items-center gap-2"
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 opacity-20 blur-xl group-hover:opacity-40 transition-opacity" aria-hidden="true" />

                  {/* Main badge - Emerald to Teal gradient */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg flex items-center justify-center ring-2 ring-emerald-300/50 dark:ring-emerald-500/30 group-hover:shadow-xl transition-all">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
                    <Share2 className="relative w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-md" />
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-wide text-emerald-700 dark:text-emerald-300 uppercase">Share</span>
              </motion.div>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.2 }}
              style={{ willChange: 'transform, opacity' }}
            >
              <h1
                id="hero-heading"
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white text-center lg:text-left"
              >
                <span className="block">Learn by</span>
                <span className="block bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  Creating & Sharing
                </span>
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p
              className="text-base sm:text-lg md:text-xl leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 text-center lg:text-left"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.3 }}
              style={{ willChange: 'transform, opacity' }}
            >
              Master every cognitive level through AI-powered personalization. Track your growth across all 6 stages of Bloom&apos;s Taxonomy—from remembering to creating.
            </motion.p>

            {/* Feature Pills */}
            <motion.div
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3"
              variants={staggerContainer}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              style={{ willChange: 'opacity' }}
            >
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
              >
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">6 Cognitive Levels</span>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Evaluation</span>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
              >
                <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Real-Time Tracking</span>
              </motion.div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.4 }}
              style={{ willChange: 'transform, opacity' }}
            >
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full group bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-6 text-base font-semibold rounded-xl"
                >
                  Start Learning Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="/courses" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800/50 dark:hover:text-white backdrop-blur-sm px-8 py-6 text-base font-semibold rounded-xl transition-all"
                >
                  Explore Courses
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 opacity-70"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Research-Backed</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">10K+ Active Learners</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">98% Success Rate</span>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN - Visual Representation */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <motion.div
              className="relative w-full max-w-md aspect-square"
              variants={scaleIn}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.3 }}
              style={{ willChange: 'transform, opacity' }}
            >
              {/* Center glassmorphism card */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full max-w-sm">
                  {/* Background glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl rounded-full" aria-hidden="true" />

                  {/* Main card */}
                  <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl rounded-3xl p-8">

                    {/* Bloom's Taxonomy Levels */}
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Bloom&apos;s Taxonomy</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Track Your Cognitive Growth</p>
                      </div>

                      {/* Level bars with gradients */}
                      {[
                        { level: 'Create', progress: 85, color: 'from-purple-500 to-purple-600' },
                        { level: 'Evaluate', progress: 72, color: 'from-indigo-500 to-indigo-600' },
                        { level: 'Analyze', progress: 68, color: 'from-blue-500 to-blue-600' },
                        { level: 'Apply', progress: 90, color: 'from-cyan-500 to-cyan-600' },
                        { level: 'Understand', progress: 95, color: 'from-emerald-500 to-emerald-600' },
                        { level: 'Remember', progress: 100, color: 'from-green-500 to-green-600' },
                      ].map((item, index) => (
                        <motion.div
                          key={item.level}
                          className="space-y-1.5"
                          initial={{ opacity: 0, x: -20 }}
                          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                        >
                          <div className="flex items-center justify-between">
                            <motion.span
                              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                              initial={{ opacity: 0 }}
                              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                              transition={{ delay: 0.5 + index * 0.1 }}
                            >
                              {item.level}
                            </motion.span>
                            <motion.span
                              className="text-xs font-bold text-slate-600 dark:text-slate-400"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                              transition={{ delay: 0.7 + index * 0.1, type: 'spring', stiffness: 200 }}
                            >
                              {item.progress}%
                            </motion.span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                            <motion.div
                              className={`h-full bg-gradient-to-r ${item.color} rounded-full relative`}
                              initial={{ width: 0 }}
                              animate={isInView ? { width: `${item.progress}%` } : { width: 0 }}
                              transition={{
                                duration: 1.5,
                                delay: 0.5 + index * 0.1,
                                ease: [0.4, 0, 0.2, 1]
                              }}
                            >
                              {/* Shimmer effect */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                initial={{ x: '-100%' }}
                                animate={isInView ? { x: '200%' } : { x: '-100%' }}
                                transition={{
                                  duration: 1.5,
                                  delay: 0.5 + index * 0.1,
                                  ease: 'easeInOut',
                                }}
                              />
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating AI indicator - Top Right */}
              <motion.div
                className="absolute top-4 right-4 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200 dark:border-purple-500/30 motion-safe:animate-float-slow motion-reduce:animate-none"
                // Use CSS animation to reduce JS overhead; keep FM for initial reveal
                initial={{ opacity: 0, y: -8 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.4 }}
                style={{ willChange: 'transform, opacity' }}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400 motion-safe:animate-pulse motion-reduce:animate-none" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">AI Analyzing</span>
                </div>
              </motion.div>

              {/* Floating How It Works indicator - Bottom Left */}
              <motion.div
                className="absolute -bottom-4 left-4 motion-safe:animate-float-slow motion-reduce:animate-none"
                // Use CSS animation to reduce JS overhead; keep FM for initial reveal
                initial={{ opacity: 0, y: 8 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.4, delay: 0.2 }}
                style={{ willChange: 'transform, opacity' }}
              >
                <Link
                  href="/blooms-taxonomy"
                  className="group inline-flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200 dark:border-blue-500/30 hover:border-blue-400 dark:hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer"
                  aria-label="Learn how Bloom's Taxonomy works"
                >
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 motion-safe:animate-pulse motion-reduce:animate-none group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    How It Works?
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
