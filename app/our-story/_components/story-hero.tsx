'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useInView } from '@/components/lazy-motion';
import { ChevronDown } from 'lucide-react';
import BrainNetworkSvg from './svg-animations/brain-network-svg';

export default function StoryHero() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' });

  const fadeInUp = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-50/50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/20"
    >
      {/* ── Atmospheric background layers ── */}
      <div className="absolute inset-0" aria-hidden="true">
        {/* Primary blob */}
        <div className="absolute top-10 left-[10%] w-72 h-72 sm:w-[28rem] sm:h-[28rem] rounded-full bg-violet-300/20 dark:bg-violet-800/30 mix-blend-multiply dark:mix-blend-screen filter blur-3xl motion-safe:animate-blob motion-reduce:animate-none" />
        {/* Secondary blob — offset timing */}
        <div
          className="absolute top-32 right-[8%] w-80 h-80 sm:w-[30rem] sm:h-[30rem] rounded-full bg-blue-300/20 dark:bg-blue-800/25 mix-blend-multiply dark:mix-blend-screen filter blur-3xl motion-safe:animate-blob motion-reduce:animate-none"
          style={{ animationDelay: '2s' }}
        />
        {/* Tertiary accent blob */}
        <div
          className="absolute bottom-20 left-1/3 w-60 h-60 rounded-full bg-indigo-300/15 dark:bg-indigo-800/20 mix-blend-multiply dark:mix-blend-screen filter blur-3xl motion-safe:animate-blob motion-reduce:animate-none"
          style={{ animationDelay: '4s' }}
        />
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/50 dark:to-slate-950/60" />
      </div>

      <div className="container relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 md:py-32 text-center">
        {/* Badge */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-blue-100 dark:from-violet-900/40 dark:to-blue-900/40 border border-violet-200/50 dark:border-violet-700/50 text-sm font-medium text-violet-700 dark:text-violet-300 shadow-sm shadow-violet-200/50 dark:shadow-violet-900/30">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            From Struggle to Solution
          </span>
        </motion.div>

        {/* SVG illustration — enlarged and more prominent */}
        <motion.div
          className="mx-auto w-36 h-44 sm:w-44 sm:h-52 mb-10"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={
            isInView
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.85 }
          }
          transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: 0.15, ease: 'easeOut' }}
        >
          <BrainNetworkSvg />
        </motion.div>

        {/* Headline — tighter tracking, stronger gradient */}
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white mb-6"
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ delay: 0.25 }}
        >
          I Spent 16 Years Learning the Hard Way{' '}
          <span className="bg-gradient-to-r from-violet-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
            So You Don&apos;t Have To
          </span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-14"
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ delay: 0.35 }}
        >
          Engineer, teacher, self-learner&mdash;one person&apos;s 16-year
          struggle to master AI and mathematics led to building the learning
          platform he wished existed all along.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.7 }}
        >
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">
            Read the journey
          </span>
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [0, 6, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <ChevronDown className="w-5 h-5 text-violet-500 dark:text-violet-400" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
