'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useInView } from '@/components/lazy-motion';
import FragmentedLearningSvg from './svg-animations/fragmented-learning-svg';

const stats = [
  { value: '73%', label: 'abandon courses midway' },
  { value: '5+', label: 'platforms, zero continuity' },
  { value: '12%', label: 'apply what they watched' },
];

export default function StoryProblem() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

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
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-28 md:py-32 bg-white dark:bg-slate-950 overflow-hidden"
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Content */}
          <div className="space-y-6">
            <motion.span
              className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-violet-600 dark:text-violet-400"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              The Problem
            </motion.span>

            <motion.h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.1 }}
            >
              Millions of Self-Learners Are Stuck in the{' '}
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                Same Trap
              </span>
            </motion.h2>

            <motion.div
              className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.2 }}
            >
              <p>
                I spent years jumping between edX courses, YouTube tutorials, and
                Stack Overflow threads&mdash;enrolling in Python and machine learning
                courses alongside my teaching job at KUET. But tracking progress was
                impossible. If one topic was better explained on one channel, another
                was better somewhere else. Nothing connected.
              </p>
              <p>
                Despite being first in my class, I started to feel hollow. I could
                solve problems mechanically but lacked the intuition behind concepts.
                I understood everything on the surface, but the real knowledge&mdash;the
                kind that lets you create and innovate&mdash;was missing. Years of
                learning, and I couldn&apos;t build anything real.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-3 gap-4 pt-4"
              variants={staggerContainer}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={fadeInUp}
                  className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                >
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right — SVG */}
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={
              isInView
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0.95 }
            }
            transition={{
              duration: shouldReduceMotion ? 0 : 0.5,
              delay: 0.2,
            }}
          >
            <div className="w-full max-w-xs sm:max-w-sm">
              <FragmentedLearningSvg />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
