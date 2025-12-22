"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Bot,
  BookOpen,
  Sparkles,
  Clock,
  Palette,
  Layers,
  Wand2,
  Brain,
  ArrowRight,
  CheckCircle2,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseCreatorSelectionProps {
  onSelectClassic: () => void;
  onSelectAI: () => void;
  onBack: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    } as const,
  },
};

const featureVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
    },
  }),
};

export const CourseCreatorSelection = ({
  onSelectClassic,
  onSelectAI,
}: CourseCreatorSelectionProps) => {
  const manualFeatures = [
    { icon: Palette, text: "Complete creative control" },
    { icon: Layers, text: "Custom curriculum structure" },
    { icon: Clock, text: "Work at your own pace" },
  ];

  const aiFeatures = [
    { icon: Brain, text: "AI-powered structure generation" },
    { icon: Wand2, text: "Bloom's taxonomy alignment" },
    { icon: Zap, text: "Intelligent recommendations" },
  ];

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8 lg:p-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <motion.div
          className="text-center mb-8 sm:mb-10 md:mb-12"
          variants={itemVariants}
        >
          <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 tracking-tight">
            How would you like to create?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Choose your path to crafting exceptional learning experiences
          </p>
        </motion.div>

        {/* Creator Options Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* Manual Creator Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative"
          >
            <div
              onClick={onSelectClassic}
              className={cn(
                "relative overflow-hidden rounded-2xl sm:rounded-3xl cursor-pointer",
                "bg-gradient-to-br from-slate-50 via-white to-blue-50/50",
                "dark:from-slate-800/80 dark:via-slate-800/60 dark:to-blue-900/20",
                "border-2 border-slate-200/60 dark:border-slate-700/50",
                "hover:border-blue-400/60 dark:hover:border-blue-500/50",
                "shadow-lg hover:shadow-2xl hover:shadow-blue-500/10",
                "transition-all duration-300"
              )}
            >
              {/* Decorative Background Pattern */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid-manual" width="32" height="32" patternUnits="userSpaceOnUse">
                      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-manual)" className="text-blue-600"/>
                </svg>
              </div>

              {/* Content */}
              <div className="relative p-5 sm:p-6 md:p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-5 sm:mb-6">
                  <motion.div
                    className={cn(
                      "p-3 sm:p-4 rounded-xl sm:rounded-2xl",
                      "bg-gradient-to-br from-blue-500 to-indigo-600",
                      "shadow-lg shadow-blue-500/25",
                      "group-hover:shadow-xl group-hover:shadow-blue-500/30",
                      "transition-shadow duration-300"
                    )}
                    whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.5 } }}
                  >
                    <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                  </motion.div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-blue-200/50 dark:border-blue-700/30">
                    <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Flexible</span>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="mb-5 sm:mb-6">
                  <h3 className="font-[var(--font-display)] text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">
                    Manual Creator
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    Take full control of your course design. Perfect for educators who want to craft every detail with precision and care.
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                  {manualFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.text}
                      custom={index}
                      variants={featureVariants}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-shrink-0 p-1.5 rounded-lg bg-blue-100/80 dark:bg-blue-900/30">
                        <feature.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300">
                        {feature.text}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.button
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 px-5",
                    "rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base",
                    "bg-gradient-to-r from-blue-600 to-indigo-600",
                    "hover:from-blue-700 hover:to-indigo-700",
                    "text-white shadow-lg shadow-blue-500/25",
                    "hover:shadow-xl hover:shadow-blue-500/30",
                    "transition-all duration-300"
                  )}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Start Manual Creation
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* AI Creator Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative"
          >
            {/* Premium Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <motion.div
                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white text-xs font-semibold shadow-lg shadow-purple-500/30"
                animate={{
                  boxShadow: [
                    "0 10px 25px -5px rgba(139, 92, 246, 0.3)",
                    "0 10px 35px -5px rgba(139, 92, 246, 0.5)",
                    "0 10px 25px -5px rgba(139, 92, 246, 0.3)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI-Powered
                </span>
              </motion.div>
            </div>

            <div
              onClick={onSelectAI}
              className={cn(
                "relative overflow-hidden rounded-2xl sm:rounded-3xl cursor-pointer",
                "bg-gradient-to-br from-violet-50 via-purple-50/80 to-fuchsia-50/50",
                "dark:from-violet-900/30 dark:via-purple-900/20 dark:to-fuchsia-900/10",
                "border-2 border-purple-200/60 dark:border-purple-700/40",
                "hover:border-purple-400/60 dark:hover:border-purple-500/50",
                "shadow-lg hover:shadow-2xl hover:shadow-purple-500/10",
                "transition-all duration-300"
              )}
            >
              {/* Animated Gradient Background */}
              <div className="absolute inset-0 opacity-20 dark:opacity-30">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-fuchsia-500/20"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundSize: "200% 200%" }}
                />
              </div>

              {/* Floating Particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-purple-400/40 dark:bg-purple-400/30"
                    initial={{
                      x: Math.random() * 100 + "%",
                      y: "100%",
                      opacity: 0
                    }}
                    animate={{
                      y: "-20%",
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 4 + Math.random() * 2,
                      repeat: Infinity,
                      delay: i * 0.8,
                    }}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="relative p-5 sm:p-6 md:p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-5 sm:mb-6">
                  <motion.div
                    className={cn(
                      "p-3 sm:p-4 rounded-xl sm:rounded-2xl",
                      "bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600",
                      "shadow-lg shadow-purple-500/25",
                      "group-hover:shadow-xl group-hover:shadow-purple-500/30",
                      "transition-shadow duration-300"
                    )}
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Bot className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                  </motion.div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/40 border border-purple-200/50 dark:border-purple-700/30">
                    <Zap className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Fast</span>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="mb-5 sm:mb-6">
                  <h3 className="font-[var(--font-display)] text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">
                    AI Creator
                    <span className="ml-2 text-purple-600 dark:text-purple-400">SAM</span>
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    Let our AI assistant generate a complete course structure. Powered by pedagogical best practices and cognitive science.
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                  {aiFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.text}
                      custom={index}
                      variants={featureVariants}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-shrink-0 p-1.5 rounded-lg bg-purple-100/80 dark:bg-purple-900/30">
                        <feature.icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300">
                        {feature.text}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.button
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 px-5",
                    "rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base",
                    "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600",
                    "hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700",
                    "text-white shadow-lg shadow-purple-500/25",
                    "hover:shadow-xl hover:shadow-purple-500/30",
                    "transition-all duration-300"
                  )}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                  Start with AI Assistant
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Comparison Footer */}
        <motion.div
          variants={itemVariants}
          className="mt-6 sm:mt-8 md:mt-10"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-800/50 border border-slate-200/50 dark:border-slate-700/30">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Both methods are fully customizable</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-300 dark:bg-slate-600" />
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Edit anytime after creation</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-300 dark:bg-slate-600" />
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Enterprise-grade quality</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
