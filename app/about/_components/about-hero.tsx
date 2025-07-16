"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { BackgroundSquares } from "./animated-background";
import { FounderAvatar, WavyBackground } from "./svg-illustrations";

export const AboutHero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent dark:from-purple-500/10" />
        <BackgroundSquares />
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <span className="inline-block py-1 px-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-sm font-medium mb-6">
              Our Story
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 tracking-tight"
          >
            Transforming Education for the Digital Age
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            We&rsquo;re on a mission to make quality education accessible to everyone, 
            empowering learners to master the skills that matter in today&rsquo;s world.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 md:w-16 md:h-16">
                <FounderAvatar />
              </div>
              <div className="text-left">
                <p className="text-gray-900 dark:text-white font-medium">John Doe</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Founder & CEO</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="relative w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 text-xs font-medium">12+</span>
                </div>
              </div>
              <div className="text-left">
                <p className="text-gray-900 dark:text-white font-medium">Years Experience</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">In Education</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="relative w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">50k+</span>
                </div>
              </div>
              <div className="text-left">
                <p className="text-gray-900 dark:text-white font-medium">Students</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Worldwide</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Wavy background */}
      <div className="absolute bottom-0 left-0 w-full">
        <WavyBackground />
      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
      >
        <span className="text-sm text-gray-500 dark:text-gray-400 mb-2">Discover our story</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <ChevronDown className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        </motion.div>
      </motion.div>
    </section>
  );
}; 