"use client";

import { motion } from "framer-motion";
import { BookOpen, Award, Zap, CheckCircle2 } from "lucide-react";

export function MyCoursesLoading() {
  return (
    <div className="w-full py-8">
      {/* Header Skeleton */}
      <div className="relative py-16 mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-indigo-900/90">
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="h-12 bg-gray-700/50 rounded-lg mx-auto mb-4 w-96 animate-pulse"></div>
          <div className="h-6 bg-gray-700/30 rounded-lg mx-auto w-2/3 animate-pulse"></div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {[
          { icon: BookOpen, color: "blue" },
          { icon: CheckCircle2, color: "green" },
          { icon: Award, color: "purple" },
          { icon: Zap, color: "amber" }
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-${item.color}-900/50`}>
                <item.icon className={`w-5 h-5 text-${item.color}-400`} />
              </div>
              <div className="h-4 bg-gray-700/50 rounded w-16 animate-pulse"></div>
            </div>
            <div className="h-8 bg-gray-700/50 rounded mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-700/30 rounded w-24 animate-pulse"></div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden">
        {/* Tab Navigation Skeleton */}
        <div className="flex border-b border-gray-800/50 p-4">
          <div className="h-10 bg-gray-700/50 rounded w-40 mr-4 animate-pulse"></div>
          <div className="h-10 bg-gray-700/30 rounded w-40 animate-pulse"></div>
          <div className="flex-1"></div>
          <div className="h-10 bg-gray-700/30 rounded w-64 animate-pulse"></div>
        </div>

        {/* Course Cards Skeleton */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden"
              >
                {/* Course Image Skeleton */}
                <div className="h-48 bg-gray-700/50 animate-pulse"></div>
                
                {/* Course Content Skeleton */}
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-700/50 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-700/30 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-700/30 rounded w-1/2 animate-pulse"></div>
                  
                  {/* Progress Bar Skeleton */}
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-700/30 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-700/30 rounded w-16 animate-pulse"></div>
                  </div>
                  
                  {/* Action Button Skeleton */}
                  <div className="h-10 bg-gray-700/50 rounded animate-pulse"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 