'use client';

import EnergyCoin from '@/components/graphics/EnergyCoin';
import EmptyCoin from '@/components/graphics/EmptyCoin';
import SpeechBubble from '@/components/graphics/SpeechBubble';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import AxisLines from '@/components/graphics/AxisLines';
import BarChart from '@/components/graphics/BarChart';
import ScatterBurst from '@/components/graphics/ScatterBurst';
import SineWave from '@/components/graphics/SineWave';

export default function HomeHeroSection() {
  const shouldReduceMotion = useReducedMotion();

  const headlineVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.8,
        staggerChildren: shouldReduceMotion ? 0 : 0.2,
      },
    },
  };

  return (
    <section
      role="region"
      aria-labelledby="motivation-heading"
      className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 min-h-screen flex items-center py-24"
    >
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-70 animate-float-slow" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-70 animate-float-medium" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-300 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-70 animate-float-fast" />
      </div>

      {/* Subtle vignette overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-radial from-transparent via-transparent to-slate-100/50 dark:to-slate-950/50 opacity-40" aria-hidden="true" />

      <div className="container relative mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-12 lg:gap-16">
          {/* Left: Visual Cluster (Decorative) */}
          <div className="relative flex items-center justify-center md:col-span-5">
            <div className="relative h-[280px] w-full max-w-[400px] sm:h-[320px] md:h-[360px]">
              {/* Empty coin (background layer) */}
              <div className="absolute left-0 top-8 z-0 scale-90 opacity-60 sm:left-4 sm:top-12">
                <EmptyCoin />
              </div>

              {/* Large energy coin */}
              <div className="absolute left-12 top-0 z-10 sm:left-20 sm:top-4">
                <EnergyCoin size="lg" label="Create" />
              </div>

              {/* Medium energy coin */}
              <div className="absolute left-32 top-16 z-20 sm:left-44 sm:top-20">
                <EnergyCoin size="md" label="Learn" />
              </div>

              {/* Small energy coin */}
              <div className="absolute bottom-12 left-24 z-30 sm:bottom-16 sm:left-32">
                <EnergyCoin size="sm" label="Share" />
              </div>

              {/* Speech bubble notification */}
              <div className="absolute bottom-0 right-0 z-40 sm:bottom-4 sm:right-8">
                <SpeechBubble text="Track your cognitive level" tilt={-2} />
              </div>
            </div>
          </div>

          {/* Right: Copy Block with Ornaments */}
          <div className="md:col-span-7">
            <div className="relative">
              {/* SVG Ornaments positioned around headline */}
              <AxisLines />
              <BarChart />
              <ScatterBurst />
              <SineWave />

              {/* Headline */}
              <motion.div
                className="relative z-10 text-center md:text-left"
                variants={headlineVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.h2
                  id="motivation-heading"
                  className="mb-6 text-[clamp(2.25rem,4vw+1rem,5rem)] font-bold leading-[1.1] tracking-tight text-foreground"
                  variants={headlineVariants}
                >
                  <motion.span className="block relative z-10" variants={headlineVariants}>
                    Master Every
                  </motion.span>
                  <motion.span className="block relative inline-block z-10" variants={headlineVariants}>
                    Cognitive Level
                    {/* X-coordinate underline */}
                    <svg
                      className="absolute -bottom-2 -left-8 w-[120%] h-6 -z-10"
                      viewBox="0 0 480 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      {/* Horizontal line (X-axis) - thin and dimmer */}
                      <line
                        x1="0"
                        y1="12"
                        x2="480"
                        y2="12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-gray-400 dark:text-gray-600"
                      />
                      {/* Bigger vertical tick marks */}
                      <line x1="60" y1="6" x2="60" y2="18" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-600" />
                      <line x1="120" y1="6" x2="120" y2="18" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-600" />
                      <line x1="180" y1="6" x2="180" y2="18" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-600" />
                      <line x1="240" y1="6" x2="240" y2="18" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-600" />
                      <line x1="300" y1="6" x2="300" y2="18" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-600" />
                      <line x1="360" y1="6" x2="360" y2="18" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-600" />
                      <line x1="420" y1="6" x2="420" y2="18" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 dark:text-gray-600" />
                      {/* Arrow at the end */}
                      <path
                        d="M468 12 L474 9 L480 12 L474 15 Z"
                        fill="currentColor"
                        className="text-gray-400 dark:text-gray-600"
                      />
                    </svg>
                  </motion.span>
                </motion.h2>
              </motion.div>

              {/* Subcopy */}
              <motion.p
                className="text-lg leading-relaxed text-muted-foreground md:text-xl mb-8 text-center md:text-left max-w-prose mx-auto md:mx-0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.4 }}
              >
                Progress through all 6 stages of Bloom&apos;s Taxonomy with AI-powered personalization.
                From remembering facts to creating original work, track your cognitive growth across
                Remember, Understand, Apply, Analyze, Evaluate, and Create.
              </motion.p>

              {/* CTA Button */}
              <motion.div
                className="flex gap-4 justify-center md:justify-start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.6 }}
              >
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="group relative bg-gradient-to-b from-lime-400 to-lime-600 hover:from-lime-500 hover:to-lime-700 text-zinc-900 font-bold rounded-full px-8 shadow-[0_6px_0_0_#65a30d,0_8px_20px_0_rgba(132,204,22,0.4)] hover:shadow-[0_4px_0_0_#65a30d,0_6px_20px_0_rgba(132,204,22,0.5)] active:shadow-[0_2px_0_0_#65a30d,0_4px_15px_0_rgba(132,204,22,0.3)] hover:translate-y-[2px] active:translate-y-[4px] transition-all duration-150"
                  >
                    {/* Inner highlight for glossy effect */}
                    <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/30 to-transparent pointer-events-none" />
                    <span className="relative">Get Started</span>
                    <ArrowRight className="relative ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
