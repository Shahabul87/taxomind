'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useInView } from '@/components/lazy-motion';
import { Brain, TrendingUp, BarChart3 } from 'lucide-react';
import CodeJourneySvg from './svg-animations/code-journey-svg';

const features = [
  {
    icon: <Brain className="w-5 h-5" />,
    title: 'SAM AI Mentor',
    description:
      'An intelligent companion that evaluates your cognitive level in real-time, guiding you through every stage of Bloom\u2019s Taxonomy.',
    gradient: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    borderColor: 'border-violet-200/60 dark:border-violet-700/40',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Adaptive Learning Paths',
    description:
      'Personalized roadmaps that evolve as you learn, ensuring you never plateau or wander without direction.',
    gradient: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200/60 dark:border-blue-700/40',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Real Mastery Tracking',
    description:
      'See exactly where you stand across all six cognitive levels. No vanity metrics\u2014just real progress you can feel.',
    gradient: 'from-indigo-500 to-violet-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200/60 dark:border-indigo-700/40',
  },
];

export default function StoryBuilding() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const fadeInUp = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
      },
    },
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-28 md:py-32 bg-slate-50 dark:bg-slate-900 overflow-hidden"
    >
      {/* Background accent */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-bl from-violet-100/30 dark:from-violet-900/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/3" />
      </div>

      <div className="container relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Content */}
          <div className="space-y-6">
            <motion.span
              className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-violet-600 dark:text-violet-400"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              The Build
            </motion.span>

            <motion.h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight"
              variants={fadeInUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.1 }}
            >
              From Vision to Code:{' '}
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                Built by a Learner, for Learners
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
                Web engineering was completely new territory. I came from an EEE
                background with just C. No single YouTube tutorial covered the full
                stack&mdash;I pieced it together from dozens of project-based courses,
                coding alongside my PhD research, coursework, and TA duties.
              </p>
              <p>
                The game changed when AI coding tools arrived&mdash;especially Claude
                Code from Anthropic. What once took weeks could be built in days.
                Sixteen years of engineering, mathematics, and teaching converged into
                a single platform.
              </p>
            </motion.div>

            {/* Feature cards */}
            <motion.div
              className="space-y-4 pt-2"
              variants={staggerContainer}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={fadeInUp}
                  className={`flex gap-4 p-4 rounded-xl ${feature.bgColor} border ${feature.borderColor} transition-shadow hover:shadow-md`}
                >
                  <div
                    className={`flex-shrink-0 p-2.5 rounded-lg bg-gradient-to-br ${feature.gradient} text-white shadow-sm`}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right — SVG with enhanced framing */}
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={
              isInView
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 0, scale: 0.92, y: 16 }
            }
            transition={{
              duration: shouldReduceMotion ? 0 : 0.6,
              delay: 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="relative w-full max-w-sm sm:max-w-md">
              {/* Ambient glow behind the editor */}
              <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/10 to-blue-500/10 dark:from-violet-500/5 dark:to-blue-500/5 rounded-3xl blur-xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-violet-500/10 dark:shadow-violet-900/20 border border-slate-200/80 dark:border-slate-700/50">
                <CodeJourneySvg />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
