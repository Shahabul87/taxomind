'use client';

import { motion, useReducedMotion } from 'framer-motion';
import AxisLines from '@/components/graphics/AxisLines';
import BarChart from '@/components/graphics/BarChart';
import ScatterBurst from '@/components/graphics/ScatterBurst';
import SineWave from '@/components/graphics/SineWave';
import FloatingCards from '@/components/graphics/FloatingCards';

export default function Hero() {
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

  const buttonVariants = {
    rest: { scale: 1, y: 0 },
    hover: {
      scale: shouldReduceMotion ? 1 : 1.01,
      y: shouldReduceMotion ? 0 : -2,
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.98 },
  };

  return (
    <section className="container relative mx-auto flex flex-1 flex-col items-center justify-center px-4 py-12 md:py-20">
      {/* Ornaments - positioned absolutely around headline */}
      <div className="relative">
        <AxisLines />
        <BarChart />
        <ScatterBurst />
        <SineWave />
        <FloatingCards />

        {/* Headline */}
        <motion.div
          className="relative z-10 text-center"
          variants={headlineVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="mb-2 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl xl:text-[clamp(4rem,12vw,10rem)]"
            variants={headlineVariants}
          >
            <motion.span className="block" variants={headlineVariants}>
              Learn
            </motion.span>
            <motion.span className="block" variants={headlineVariants}>
              by doing
            </motion.span>
          </motion.h1>
        </motion.div>
      </div>

      {/* Subcopy */}
      <motion.p
        className="mt-8 max-w-2xl text-center text-base text-muted-foreground sm:text-lg md:mt-12 md:text-xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.4 }}
      >
        Interactive problem solving that&apos;s effective and fun.
        <br />
        Get smarter in 15 minutes a day.
      </motion.p>

      {/* CTA Button */}
      <motion.a
        href="/get-started"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg ring-offset-background transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:mt-12"
        variants={buttonVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        role="button"
        aria-label="Get started with Brillia"
      >
        Get started
      </motion.a>
    </section>
  );
}
