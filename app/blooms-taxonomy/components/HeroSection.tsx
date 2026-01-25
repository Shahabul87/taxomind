"use client";

import { motion } from "framer-motion";
import { Shield, ChevronDown } from "lucide-react";

export const HeroSection = () => {
  const scrollToDemo = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 mb-16">
      <div className="max-w-5xl mx-auto text-center">
        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
        >
          <Shield className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-300 font-medium">
            The Global Learning Standard Since 1956
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight"
        >
          Learn Smarter with <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
            Bloom&apos;s Taxonomy
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8"
        >
          Our AI analyzes your learning content and guides you from basic recall
          to creative mastery across 6 cognitive levels.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <button
            onClick={scrollToDemo}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-semibold text-base hover:bg-gray-100 transition-colors"
          >
            Try the Demo
          </button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-16"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center text-gray-500 cursor-pointer"
            onClick={scrollToDemo}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
