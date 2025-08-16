"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, Plus, Compass } from "lucide-react";

export const MyGroupsHero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-pink-400 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-400 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center mb-6 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium"
          >
            <Users className="w-4 h-4 mr-2" />
            <span>Community Connection</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
          >
            Your Community{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">
              Ecosystem
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-white/80 mb-10 max-w-3xl mx-auto"
          >
            Discover, manage, and engage with all your groups in one place. Connect with your communities, track upcoming events, and never miss important discussions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/groups/create">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 1)" }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-lg bg-white text-purple-600 font-medium flex items-center justify-center shadow-lg shadow-purple-700/30 hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Group
              </motion.button>
            </Link>
            <Link href="/groups">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-lg bg-white/10 backdrop-blur-sm text-white font-medium flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <Compass className="w-5 h-5 mr-2" />
                Explore Groups
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" className="w-full h-auto fill-gray-50 dark:fill-gray-900 transform translate-y-1">
          <path d="M0,64L80,58.7C160,53,320,43,480,42.7C640,43,800,53,960,58.7C1120,64,1280,64,1360,64L1440,64L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z" />
        </svg>
      </div>
    </div>
  );
}; 