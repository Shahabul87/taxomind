'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useInView } from '@/components/lazy-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function StoryCta() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  const user = useCurrentUser();

  const ctaLink = user ? '/dashboard/user' : '/auth/register';
  const ctaText = user ? 'Go to Dashboard' : 'Start Learning Free';

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

  return (
    <section
      ref={sectionRef}
      className="relative py-24 sm:py-32 md:py-40 bg-gradient-to-br from-violet-50/50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/20 overflow-hidden"
    >
      {/* ── Atmospheric background ── */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-10 left-1/4 w-80 h-80 rounded-full bg-violet-300/15 dark:bg-violet-800/20 filter blur-3xl motion-safe:animate-blob motion-reduce:animate-none" />
        <div
          className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-blue-300/15 dark:bg-blue-800/20 filter blur-3xl motion-safe:animate-blob motion-reduce:animate-none"
          style={{ animationDelay: '3s' }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="container relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Decorative top element */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.5,
            ease: [0.34, 1.56, 0.64, 1],
          }}
        >
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent rounded-full" />
        </motion.div>

        <motion.h2
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight mb-5"
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          Your Learning Journey{' '}
          <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
            Starts Here
          </span>
        </motion.h2>

        <motion.p
          className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto mb-10 leading-relaxed"
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ delay: 0.1 }}
        >
          Join the platform built by someone who walked your path.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-6"
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ delay: 0.2 }}
        >
          <Link href={ctaLink} className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full group bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all px-8 py-6 text-base font-semibold rounded-xl"
            >
              {ctaText}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Link href="/courses" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full border-2 border-violet-300 dark:border-violet-700 text-slate-700 dark:text-slate-300 hover:bg-violet-50 hover:text-violet-900 dark:hover:bg-violet-950/50 dark:hover:text-white backdrop-blur-sm px-8 py-6 text-base font-semibold rounded-xl transition-all"
            >
              Explore Courses
            </Button>
          </Link>
        </motion.div>

        <motion.p
          className="text-sm text-slate-500 dark:text-slate-400"
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ delay: 0.3 }}
        >
          No credit card required. Free forever for self-learners.
        </motion.p>
      </div>
    </section>
  );
}
