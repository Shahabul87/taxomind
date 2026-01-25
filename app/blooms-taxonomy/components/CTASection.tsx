"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export const CTASection = () => {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-300 font-medium">Ready to Start?</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Start Learning Smarter Today
          </h2>

          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
            Join thousands of learners using AI-powered cognitive science to master any subject.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/courses">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-semibold text-base hover:bg-gray-100 transition-colors"
              >
                Browse Courses
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>

            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 text-white font-semibold text-base border border-white/20 hover:bg-white/20 transition-colors"
              >
                View Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Free to start. No credit card required.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
