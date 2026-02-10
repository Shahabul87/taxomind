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
  LogIn,
  Newspaper,
  FlaskConical,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion, useInView } from '@/components/lazy-motion';
import { useCurrentUser } from '@/hooks/use-current-user';
import { UserMenu } from '@/app/(homepage)/_components/user-menu';
import BloomsPyramid from './BloomsPyramid';

interface PlatformStats {
  activeLearnerDisplay: string;
  successRate: number;
}

/**
 * Home Hero Section — Vibrant design with animated Bloom's Taxonomy Pyramid
 *
 * Color System: Violet/Indigo vibrant palette
 * Theme: "Learn by Creating & Sharing" with energetic Framer-style aesthetics
 */
export default function HomeHeroSectionRedesigned() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' });
  const user = useCurrentUser();
  const [stats, setStats] = useState<PlatformStats>({
    activeLearnerDisplay: '0+',
    successRate: 0,
  });

  // Fetch platform stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/platform/stats');
        const data = await response.json();
        if (data.success && data.data) {
          setStats({
            activeLearnerDisplay: data.data.activeLearnerDisplay,
            successRate: data.data.successRate,
          });
        }
      } catch (error) {
        console.error('Failed to fetch platform stats:', error);
      }
    };
    fetchStats();
  }, []);

  const ctaLink = user ? '/dashboard/user' : '/auth/register';
  const ctaText = user ? 'Go to Dashboard' : 'Start Learning Free';

  const fadeInUp = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.3,
        ease: 'easeOut' as const,
      },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  return (
    <section
      ref={sectionRef}
      role="region"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-gradient-to-br from-violet-50/50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/20 min-h-screen flex items-center py-12 sm:py-16 md:py-20 lg:py-24"
    >
      {/* ─── Top Navigation ─── */}
      <div className="absolute top-3 left-0 right-0 z-50 sm:top-4">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left — Logo */}
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
              <span className="font-bold text-sm sm:text-base md:text-lg text-slate-900 dark:text-white">
                Taxomind
              </span>
            </Link>

            {/* Center — AI News & Research (Desktop) */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-2 absolute left-1/2 transform -translate-x-1/2">
              <Link
                href="/ai-news"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-800 transition-all group"
                aria-label="AI News"
              >
                <Newspaper className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  AI News
                </span>
              </Link>
              <Link
                href="/ai-research"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-800 transition-all group"
                aria-label="AI Research"
              >
                <FlaskConical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  AI Research
                </span>
              </Link>
              <Link
                href="/our-story"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-800 transition-all group"
                aria-label="Our Story"
              >
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Our Story
                </span>
              </Link>
            </div>

            {/* Center — AI News & Research (Mobile) */}
            <div className="flex sm:hidden items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
              <Link
                href="/ai-news"
                className="inline-flex items-center justify-center p-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
                aria-label="AI News"
              >
                <Newspaper className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </Link>
              <Link
                href="/ai-research"
                className="inline-flex items-center justify-center p-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
                aria-label="AI Research"
              >
                <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </Link>
              <Link
                href="/our-story"
                className="inline-flex items-center justify-center p-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
                aria-label="Our Story"
              >
                <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </Link>
            </div>

            {/* Right — User Menu / Sign In */}
            <div className="flex items-center">
              {user ? (
                <UserMenu user={user} />
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white transition-all font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg"
                  aria-label="Sign in to your account"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline-block">Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Animated Background Blobs ─── */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-20 left-10 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-violet-300/20 dark:bg-violet-800/30 mix-blend-multiply dark:mix-blend-screen filter blur-3xl motion-safe:animate-blob motion-reduce:animate-none" />
        <div
          className="absolute top-40 right-10 w-80 h-80 sm:w-[28rem] sm:h-[28rem] rounded-full bg-blue-300/20 dark:bg-blue-800/30 mix-blend-multiply dark:mix-blend-screen filter blur-3xl motion-safe:animate-blob motion-reduce:animate-none"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute -bottom-10 left-1/3 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-indigo-300/20 dark:bg-indigo-800/30 mix-blend-multiply dark:mix-blend-screen filter blur-3xl motion-safe:animate-blob motion-reduce:animate-none"
          style={{ animationDelay: '4s' }}
        />

        {/* Subtle dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* ─── Main Content ─── */}
      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-12">
          {/* ─── LEFT COLUMN ─── */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 md:space-y-8">
            {/* Create → Learn → Share flow badges */}
            <motion.div
              className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 md:gap-4 flex-wrap"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              style={{ willChange: 'transform, opacity' }}
            >
              {/* Create Badge */}
              <motion.div
                className="group relative flex flex-col items-center gap-1.5 sm:gap-2"
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-violet-600 opacity-30 blur-xl group-hover:opacity-50 transition-opacity"
                    aria-hidden="true"
                  />
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/25 flex items-center justify-center ring-2 ring-purple-300/50 dark:ring-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 transition-all">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
                    <Lightbulb className="relative w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white drop-shadow-md" />
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs md:text-sm font-bold tracking-wide text-purple-700 dark:text-purple-300 uppercase">
                  Create
                </span>
              </motion.div>

              {/* Arrow 1 */}
              <motion.div
                className="flex items-center gap-0.5 sm:gap-1 mb-4 sm:mb-6"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={
                  isInView
                    ? { opacity: 1, scaleX: 1 }
                    : { opacity: 0, scaleX: 0 }
                }
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="w-6 sm:w-8 md:w-12 h-0.5 sm:h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-sm" />
                <ArrowRight
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </motion.div>

              {/* Learn Badge */}
              <motion.div
                className="group relative flex flex-col items-center gap-1.5 sm:gap-2"
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 opacity-30 blur-xl group-hover:opacity-50 transition-opacity"
                    aria-hidden="true"
                  />
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 flex items-center justify-center ring-2 ring-blue-300/50 dark:ring-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
                    <Brain className="relative w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white drop-shadow-md" />
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs md:text-sm font-bold tracking-wide text-blue-700 dark:text-blue-300 uppercase">
                  Learn
                </span>
              </motion.div>

              {/* Arrow 2 */}
              <motion.div
                className="flex items-center gap-0.5 sm:gap-1 mb-4 sm:mb-6"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={
                  isInView
                    ? { opacity: 1, scaleX: 1 }
                    : { opacity: 0, scaleX: 0 }
                }
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="w-6 sm:w-8 md:w-12 h-0.5 sm:h-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full shadow-sm" />
                <ArrowRight
                  className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </motion.div>

              {/* Share Badge */}
              <motion.div
                className="group relative flex flex-col items-center gap-1.5 sm:gap-2"
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 opacity-30 blur-xl group-hover:opacity-50 transition-opacity"
                    aria-hidden="true"
                  />
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center ring-2 ring-emerald-300/50 dark:ring-emerald-500/30 group-hover:shadow-xl group-hover:shadow-emerald-500/40 transition-all">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
                    <Share2 className="relative w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white drop-shadow-md" />
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs md:text-sm font-bold tracking-wide text-emerald-700 dark:text-emerald-300 uppercase">
                  Share
                </span>
              </motion.div>
            </motion.div>

            {/* Main Headline with word-by-word slide-up reveal */}
            <div>
              <h1
                id="hero-heading"
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] sm:leading-[1.15] tracking-tight text-slate-900 dark:text-white text-center lg:text-left px-2 sm:px-0"
              >
                {/* "Learn by" — slides up from below its container */}
                <span className="block overflow-hidden">
                  <motion.span
                    className="block"
                    initial={{ y: '100%' }}
                    animate={
                      isInView ? { y: '0%' } : { y: '100%' }
                    }
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.6,
                      delay: 0.2,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    Learn by
                  </motion.span>
                </span>

                {/* "Creating & Sharing" — word-by-word slide-up reveal */}
                <span className="block" aria-label="Creating &amp; Sharing">
                  {[
                    { text: 'Creating', delay: 0.5 },
                    { text: '\u00A0&\u00A0', delay: 0.65 },
                    { text: 'Sharing', delay: 0.8 },
                  ].map((word) => (
                    <span
                      key={word.text}
                      className="inline-block overflow-hidden align-bottom"
                    >
                      <motion.span
                        className="inline-block bg-gradient-to-r from-violet-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent motion-safe:animate-gradient-x motion-reduce:animate-none"
                        style={{ backgroundSize: '200% auto' }}
                        initial={{ y: '110%' }}
                        animate={
                          isInView ? { y: '0%' } : { y: '110%' }
                        }
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : {
                                duration: 0.6,
                                delay: word.delay,
                                ease: [0.22, 1, 0.36, 1],
                              }
                        }
                      >
                        {word.text}
                      </motion.span>
                    </span>
                  ))}
                </span>
              </h1>
            </div>

            {/* Description */}
            <motion.p
              className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 text-center lg:text-left px-2 sm:px-0"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.3 }}
              style={{ willChange: 'transform, opacity' }}
            >
              Master every cognitive level through AI-powered personalization.
              Track your growth across all 6 stages of Bloom&apos;s
              Taxonomy—from remembering to creating.
            </motion.p>

            {/* Founder Story Link */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.35 }}
              className="flex justify-center lg:justify-start px-2 sm:px-0"
            >
              <Link
                href="/our-story"
                className="group inline-flex items-center gap-2 sm:gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-gradient-to-r from-rose-50 to-violet-50 dark:from-rose-950/30 dark:to-violet-950/30 border border-rose-200/60 dark:border-rose-800/40 hover:border-rose-300 dark:hover:border-rose-700 shadow-sm hover:shadow-md transition-all"
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 dark:text-rose-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-snug">
                  <span className="font-semibold text-slate-900 dark:text-white">Why I built TaxoMind</span>
                  <span className="hidden sm:inline">
                    {' '}&mdash; 16 years of struggle turned into a platform for every self-learner
                  </span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-500 dark:text-violet-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </Link>
            </motion.div>

            {/* Feature Pills */}
            <motion.div
              className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 px-2 sm:px-0"
              variants={staggerContainer}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              style={{ willChange: 'opacity' }}
            >
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
              >
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600 dark:text-violet-400" />
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  6 Cognitive Levels
                </span>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  AI Evaluation
                </span>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
              >
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Real-Time Tracking
                </span>
              </motion.div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 px-2 sm:px-0"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.4 }}
              style={{ willChange: 'transform, opacity' }}
            >
              <Link href={ctaLink} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full group bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-200 px-6 py-5 sm:px-8 sm:py-6 text-sm sm:text-base font-semibold rounded-xl"
                >
                  {ctaText}
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="/courses" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-2 border-violet-300 dark:border-violet-700 text-slate-700 dark:text-slate-300 hover:bg-violet-50 hover:text-violet-900 dark:hover:bg-violet-950/50 dark:hover:text-white backdrop-blur-sm px-6 py-5 sm:px-8 sm:py-6 text-sm sm:text-base font-semibold rounded-xl transition-all"
                >
                  Explore Courses
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators — hide stats when zero */}
            <motion.div
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-2 sm:pt-4 px-2 sm:px-0"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-500" />
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Research-Backed
                </span>
              </div>
              {stats.activeLearnerDisplay !== '0+' && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 dark:text-violet-500" />
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {stats.activeLearnerDisplay} Active Learners
                  </span>
                </div>
              )}
              {stats.successRate > 0 && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-500" />
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {stats.successRate}% Success Rate
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-500" />
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Bloom&apos;s Taxonomy
                </span>
              </div>
            </motion.div>
          </div>

          {/* ─── RIGHT COLUMN — Bloom's Pyramid ─── */}
          <div className="lg:col-span-5 flex items-center justify-center mt-4 sm:mt-6 lg:mt-0">
            <motion.div
              className="relative w-full max-w-xs sm:max-w-sm md:max-w-md"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={
                isInView
                  ? { scale: 1, opacity: 1 }
                  : { scale: 0.95, opacity: 0 }
              }
              transition={{
                duration: shouldReduceMotion ? 0 : 0.4,
                delay: 0.2,
                ease: 'easeOut',
              }}
              style={{ willChange: 'transform, opacity' }}
            >
              <BloomsPyramid />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
