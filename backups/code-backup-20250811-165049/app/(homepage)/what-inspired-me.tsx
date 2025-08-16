"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Heart, Star } from 'lucide-react';

export const WhatInspiredMe = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
            What Inspired Me
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto text-lg">
            The journey that led me to create this platform and share knowledge with the world
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-purple-500/10 shadow-lg"
          >
            <div className="rounded-full w-12 h-12 bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6">
              <Lightbulb className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">The Spark</h3>
            <p className="text-gray-300">
              It all began with a desire to solve real-world problems and make knowledge accessible to everyone, regardless of background or circumstance.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-purple-500/10 shadow-lg"
          >
            <div className="rounded-full w-12 h-12 bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6">
              <Heart className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">The Passion</h3>
            <p className="text-gray-300">
              A genuine love for teaching and sharing knowledge drives this platform. Every course is crafted with care to ensure learners receive the best possible experience.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-purple-500/10 shadow-lg"
          >
            <div className="rounded-full w-12 h-12 bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6">
              <Star className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">The Vision</h3>
            <p className="text-gray-300">
              Looking to the future, I aim to build a community of learners and educators who collaborate to create meaningful educational experiences for all.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}; 