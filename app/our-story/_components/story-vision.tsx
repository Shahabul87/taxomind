'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useInView } from '@/components/lazy-motion';
import GlobeJourneySvg from './svg-animations/globe-journey-svg';

export default function StoryVision() {
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

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-28 md:py-32 bg-white dark:bg-slate-950 overflow-hidden"
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — SVG */}
          <motion.div
            className="flex items-center justify-center order-2 lg:order-1"
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
              <GlobeJourneySvg />
            </div>
          </motion.div>

          {/* Right — Content */}
          <div className="space-y-6 order-1 lg:order-2">
            <motion.span
              className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-violet-600 dark:text-violet-400"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              The Vision
            </motion.span>

            <motion.h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.1 }}
            >
              Learning Should Never Feel Like{' '}
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                Wandering in the Dark
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
                I wanted to build a platform where students can create their own
                courses, learn from them systematically, and share that knowledge
                with others who have the same hunger to grow. College never makes
                you skilled&mdash;it helps you evolve <em>if</em> you learn how
                to learn. Building real skill takes focus, discipline, and years.
              </p>
              <p>
                TaxoMind is the intelligent companion I wished I had. As a
                self-learner, as an engineer, and as a teacher&mdash;my ambition
                has always been caring and sharing for others. For learning, for
                growing, and for evolving. In this distracted world, you need
                discipline to reach the next level.
              </p>
            </motion.div>

            {/* Audience tags */}
            <motion.div
              className="flex flex-wrap gap-2 pt-2"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.3 }}
            >
              {[
                'Self-Learners',
                'Career Changers',
                'Students',
                'Engineers',
                'Lifelong Learners',
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
