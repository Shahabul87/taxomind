'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useInView } from '@/components/lazy-motion';
import { Lightbulb } from 'lucide-react';
import BloomPyramidMiniSvg from './svg-animations/bloom-pyramid-mini-svg';

export default function StoryEureka() {
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
              <BloomPyramidMiniSvg />
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
              The Breakthrough
            </motion.span>

            <motion.h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.1 }}
            >
              The Missing Piece Was a{' '}
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                68-Year-Old Framework
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
                In my teaching career at KUET, I gave many seminars on Bloom&apos;s
                Taxonomy&mdash;a framework published in 1956 that maps human cognition
                into six levels: Remember, Understand, Apply, Analyze, Evaluate, and
                Create.
              </p>
              <p>
                It explained everything I&apos;d lived through. Most online courses
                only train you to <em>remember</em> and <em>understand</em>. They
                never guide you to <em>apply</em>, <em>analyze</em>, or{' '}
                <em>create</em>. That&apos;s why I felt hollow for years&mdash;I was
                trapped at the bottom of the pyramid, and no platform even knew it.
              </p>
            </motion.div>

            {/* Key Insight Box */}
            <motion.div
              className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 border border-violet-200/50 dark:border-violet-700/50"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.3 }}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    The Key Insight
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    What if a platform could evaluate your cognitive level in
                    real-time and guide you through all six stages&mdash;adapting
                    to where you actually are, not where a pre-recorded video
                    assumes you are?
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
