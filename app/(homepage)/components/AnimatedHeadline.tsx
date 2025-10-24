"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface AnimatedHeadlineProps {
  isInView: boolean;
}

export const AnimatedHeadline: React.FC<AnimatedHeadlineProps> = ({ isInView }) => {
  const shouldReduceMotion = useReducedMotion();

  // Split text into words for animation
  const line1 = "AI-Powered Learning";
  const line2 = "Through Bloom's Taxonomy";

  const line1Words = line1.split(" ");
  const line2Words = line2.split(" ");

  // Container animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  // Word animation with slide up effect
  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      rotateX: -90,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 100,
      },
    },
  };

  // Word animation for gradient line (simplified from character-level)
  const gradientWordVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        damping: 15,
        stiffness: 100,
      },
    },
  };

  // Gradient wave animation for second line
  const gradientContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.5,
      },
    },
  };

  if (shouldReduceMotion) {
    return (
      <h1 className="text-[clamp(2rem,4.5vw,4.5rem)] font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white max-w-4xl">
        {line1}
        <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 animate-gradient-x">
          {line2}
        </span>
      </h1>
    );
  }

  return (
    <h1 className="relative text-[clamp(2rem,4.5vw,4.5rem)] font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white max-w-4xl">
      {/* First Line - Word by word reveal */}
      <motion.span
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="inline-block"
      >
        {line1Words.map((word, wordIndex) => (
          <motion.span
            key={`word-${wordIndex}`}
            variants={wordVariants}
            className="inline-block mr-3"
            style={{ transformOrigin: "bottom", willChange: 'transform, opacity' }}
          >
            {word}
          </motion.span>
        ))}
      </motion.span>

      {/* Second Line - Simplified word-level animation instead of character-level */}
      <motion.span
        variants={gradientContainerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="block mt-2"
      >
        {/* Animate "Through" as a word */}
        <motion.span
          variants={gradientWordVariants}
          className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 mr-2"
          style={{ transformOrigin: "bottom", willChange: 'transform, opacity' }}
        >
          Through
        </motion.span>
        {/* Animate "Bloom's Taxonomy" as a complete phrase */}
        <motion.span
          variants={gradientWordVariants}
          className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 whitespace-nowrap"
          style={{ transformOrigin: "bottom", willChange: 'transform, opacity', hyphens: "none", wordBreak: "keep-all" }}
        >
          Bloom&apos;s Taxonomy
        </motion.span>
      </motion.span>

      {/* Animated gradient shimmer effect */}
      <motion.span
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10 pointer-events-none"
        aria-hidden="true"
        style={{ willChange: 'transform, opacity' }}
        initial={{ x: "-100%", opacity: 0 }}
        animate={
          isInView
            ? {
                x: "100%",
                opacity: [0, 1, 0],
              }
            : { x: "-100%", opacity: 0 }
        }
        transition={{
          duration: 1.5,
          delay: 1.2,
          ease: "easeInOut",
        }}
      />
    </h1>
  );
};
