"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

interface ReadingProgressBarProps {
  containerRef?: React.RefObject<HTMLElement>;
}

export const ReadingProgressBar = ({ containerRef }: ReadingProgressBarProps) => {
  const [isVisible, setIsVisible] = useState(false);

  // Use scroll progress from Framer Motion
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smooth spring animation for progress
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Show bar only after scrolling a bit
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      setIsVisible(scrolled > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Fixed Progress Bar at Top */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-[100] h-1 bg-blog-surface/50 dark:bg-slate-900/50"
      >
        {/* Gradient Progress */}
        <motion.div
          style={{ scaleX, transformOrigin: "0%" }}
          className="h-full bg-gradient-to-r from-blog-primary via-blog-accent to-blog-gold"
        />

        {/* Glow Effect */}
        <motion.div
          style={{ scaleX, transformOrigin: "0%" }}
          className="absolute top-0 h-full bg-gradient-to-r from-blog-primary via-blog-accent to-blog-gold opacity-50 blur-sm"
        />
      </motion.div>

      {/* Reading Progress Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          y: isVisible ? 0 : 20
        }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.div
          className="w-12 h-12 rounded-full bg-blog-surface dark:bg-slate-800 border border-blog-border dark:border-slate-700 shadow-lg flex items-center justify-center"
        >
          {/* Circular Progress */}
          <svg className="w-10 h-10 -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blog-border/30 dark:text-slate-700"
            />
            <motion.circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                pathLength: scrollYProgress,
                strokeDasharray: 1,
                strokeDashoffset: 0
              }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--blog-primary))" />
                <stop offset="50%" stopColor="hsl(var(--blog-accent))" />
                <stop offset="100%" stopColor="hsl(var(--blog-gold))" />
              </linearGradient>
            </defs>
          </svg>

          {/* Percentage Text */}
          <motion.span
            className="absolute text-[10px] font-bold text-blog-text dark:text-white font-blog-ui"
          >
            <ProgressPercentage progress={scrollYProgress} />
          </motion.span>
        </motion.div>
      </motion.div>
    </>
  );
};

// Separate component for percentage to avoid unnecessary re-renders
interface ProgressPercentageProps {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}

const ProgressPercentage = ({ progress }: ProgressPercentageProps) => {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    return progress.on("change", (latest) => {
      setPercentage(Math.round(latest * 100));
    });
  }, [progress]);

  return <>{percentage}%</>;
};

export default ReadingProgressBar;
