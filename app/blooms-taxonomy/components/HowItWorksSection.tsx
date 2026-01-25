"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { EngineDemo } from "./ui/EngineDemo";

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300 font-medium">Try It Now</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Analyze Any Content Instantly
          </h2>

          <p className="text-gray-400 max-w-2xl mx-auto">
            Paste any educational text to see how our engine detects cognitive levels in real-time.
          </p>
        </motion.div>

        {/* Interactive Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <EngineDemo />
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-3 gap-4 mt-8"
        >
          <div className="text-center py-4 px-2 bg-white/5 border border-white/10 rounded-xl">
            <div className="text-2xl font-bold text-green-400">&lt;10ms</div>
            <div className="text-xs text-gray-500 mt-1">Analysis Speed</div>
          </div>
          <div className="text-center py-4 px-2 bg-white/5 border border-white/10 rounded-xl">
            <div className="text-2xl font-bold text-purple-400">120+</div>
            <div className="text-xs text-gray-500 mt-1">Cognitive Verbs</div>
          </div>
          <div className="text-center py-4 px-2 bg-white/5 border border-white/10 rounded-xl">
            <div className="text-2xl font-bold text-blue-400">6</div>
            <div className="text-xs text-gray-500 mt-1">Taxonomy Levels</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
