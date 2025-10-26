'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Lightbulb, Brain, Share2 } from 'lucide-react';

export const ThemeWordBubbles: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      {/* Central arrangement of 3 bubbles */}
      <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
        {/* Background glow effect */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 blur-3xl rounded-full"
          aria-hidden="true"
        />

        {/* Create Bubble - Top */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: 0.2 }}
        >
          <motion.div
            className="relative group"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, -12, 0],
                  }
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{ scale: 1.05, y: -16 }}
          >
            {/* Multiple glow layers for depth */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 opacity-40 blur-2xl"
              aria-hidden="true"
            />
            <div
              className="absolute -inset-2 rounded-full bg-purple-500/30 blur-xl"
              aria-hidden="true"
            />

            {/* 3D Shadow */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent to-purple-900/40 translate-y-1.5"
              aria-hidden="true"
            />

            {/* Main bubble */}
            <div
              className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-400 via-purple-600 to-purple-800 shadow-[0_20px_50px_-10px_rgba(168,85,247,0.6)] flex items-center justify-center ring-4 ring-purple-300/30 dark:ring-purple-600/30 group-hover:shadow-[0_25px_60px_-10px_rgba(168,85,247,0.8)] transition-all duration-300"
              aria-hidden="true"
            >
              {/* Inner highlight */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
              <Lightbulb className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" />
            </div>
          </motion.div>
          <span className="text-base sm:text-lg md:text-xl font-bold tracking-wide text-purple-800 dark:text-purple-300 uppercase drop-shadow-sm">
            Create
          </span>
        </motion.div>

        {/* Learn Bubble - Bottom Left */}
        <motion.div
          className="absolute bottom-4 left-8 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: 0.4 }}
        >
          <motion.div
            className="relative group"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, -14, 0],
                  }
            }
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            whileHover={{ scale: 1.05, y: -18 }}
          >
            {/* Multiple glow layers */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 opacity-40 blur-2xl"
              aria-hidden="true"
            />
            <div
              className="absolute -inset-2 rounded-full bg-indigo-500/30 blur-xl"
              aria-hidden="true"
            />

            {/* 3D Shadow */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent to-indigo-900/40 translate-y-1.5"
              aria-hidden="true"
            />

            {/* Main bubble */}
            <div
              className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo-400 via-indigo-600 to-indigo-800 shadow-[0_20px_50px_-10px_rgba(99,102,241,0.6)] flex items-center justify-center ring-4 ring-indigo-300/30 dark:ring-indigo-600/30 group-hover:shadow-[0_25px_60px_-10px_rgba(99,102,241,0.8)] transition-all duration-300"
              aria-hidden="true"
            >
              {/* Inner highlight */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
              <Brain className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" />
            </div>
          </motion.div>
          <span className="text-base sm:text-lg md:text-xl font-bold tracking-wide text-indigo-800 dark:text-indigo-300 uppercase drop-shadow-sm">
            Learn
          </span>
        </motion.div>

        {/* Share Bubble - Bottom Right */}
        <motion.div
          className="absolute bottom-4 right-8 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: 0.6 }}
        >
          <motion.div
            className="relative group"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, -10, 0],
                  }
            }
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
            whileHover={{ scale: 1.05, y: -14 }}
          >
            {/* Multiple glow layers */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-40 blur-2xl"
              aria-hidden="true"
            />
            <div
              className="absolute -inset-2 rounded-full bg-blue-500/30 blur-xl"
              aria-hidden="true"
            />

            {/* 3D Shadow */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent to-blue-900/40 translate-y-1.5"
              aria-hidden="true"
            />

            {/* Main bubble */}
            <div
              className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 shadow-[0_20px_50px_-10px_rgba(59,130,246,0.6)] flex items-center justify-center ring-4 ring-blue-300/30 dark:ring-blue-600/30 group-hover:shadow-[0_25px_60px_-10px_rgba(59,130,246,0.8)] transition-all duration-300"
              aria-hidden="true"
            >
              {/* Inner highlight */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
              <Share2 className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" />
            </div>
          </motion.div>
          <span className="text-base sm:text-lg md:text-xl font-bold tracking-wide text-blue-800 dark:text-blue-300 uppercase drop-shadow-sm">
            Share
          </span>
        </motion.div>

        {/* Connecting lines/particles (optional decorative element) */}
        {!shouldReduceMotion && (
          <>
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 400 400"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Connecting line from Create to Learn */}
              <motion.line
                x1="200"
                y1="100"
                x2="120"
                y2="300"
                stroke="url(#lineGradient1)"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 1.5, delay: 0.8 }}
              />

              {/* Connecting line from Learn to Share */}
              <motion.line
                x1="120"
                y1="300"
                x2="280"
                y2="300"
                stroke="url(#lineGradient2)"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 1.5, delay: 1 }}
              />

              {/* Connecting line from Share to Create */}
              <motion.line
                x1="280"
                y1="300"
                x2="200"
                y2="100"
                stroke="url(#lineGradient3)"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 1.5, delay: 1.2 }}
              />

              <defs>
                <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
                <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
                <linearGradient id="lineGradient3" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
          </>
        )}
      </div>
    </div>
  );
};
