"use client";

import { useState } from 'react';
import { Calendar, RefreshCw, Share2, ChevronDown, ChevronUp, Link2, Check } from "lucide-react";
import { SocialMediaShareButtons } from './social-media-sharing-buttons';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';

interface BlogPostInfoProps {
  title: string;
  createdAt: Date;
  updatedAt?: Date | null;
}

export const BlogPostInfo = ({ title, createdAt, updatedAt }: BlogPostInfoProps) => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const currentURL = typeof window !== 'undefined' ? window.location.href : '';

  const formattedDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center 
      mb-8 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl 
      p-4 sm:p-5 md:p-6 lg:p-8
      border border-gray-200 dark:border-gray-700/50 
      backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300
      gap-4 lg:gap-8"
    >
      {/* Metadata Section */}
      <div className="w-full lg:w-auto">
        <div className="space-y-3 md:space-y-4">
          {/* Created Date */}
          <div className="group flex items-center text-gray-600 dark:text-gray-400 
            hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            <Calendar className="w-5 h-5 md:w-6 md:h-6 mr-3 text-blue-500 dark:text-blue-400
              group-hover:text-blue-600 dark:group-hover:text-blue-300" 
            />
            <span className="text-base md:text-xl lg:text-2xl font-medium">
              Published: {formattedDate(createdAt)}
            </span>
          </div>

          {/* Updated Date */}
          {updatedAt && (
            <div className="group flex items-center text-gray-600 dark:text-gray-400
              hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
            >
              <RefreshCw className="w-5 h-5 md:w-6 md:h-6 mr-3 text-purple-500 dark:text-purple-400
                group-hover:text-purple-600 dark:group-hover:text-purple-300" 
              />
              <span className="text-base md:text-xl lg:text-2xl font-medium">
                Updated: {formattedDate(updatedAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Divider for mobile */}
      <div className="block lg:hidden w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />

      {/* Share Section */}
      <div className="w-full lg:w-auto">
        <div className="relative">
          {/* Main Share Button */}
          <motion.button
            onClick={() => setIsShareOpen(!isShareOpen)}
            className="flex items-center gap-2 px-5 py-3 
              bg-gradient-to-r from-blue-500/80 to-purple-500/80 
              hover:from-blue-500/90 hover:to-purple-500/90
              text-white rounded-full
              shadow-md hover:shadow-lg 
              transition-all duration-300"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Share this article</span>
            {isShareOpen ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1" />
            )}
          </motion.button>

          {/* Dropdown with Share Options */}
          <AnimatePresence>
            {isShareOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute z-50 right-0 mt-2 w-full min-w-[300px] 
                  bg-white dark:bg-gray-800 
                  border border-gray-200 dark:border-gray-700
                  rounded-xl shadow-lg overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      Share this article
                    </h3>
                    <button 
                      onClick={() => setIsShareOpen(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* URL Display with Copy Button */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 
                      p-3 rounded-lg text-sm truncate
                      border border-gray-100 dark:border-gray-800">
                      <p className="text-gray-600 dark:text-gray-300 truncate">
                        {currentURL}
                      </p>
                    </div>
                    <motion.button
                      onClick={copyToClipboard}
                      className={`p-3 rounded-lg transition-all duration-200 
                        ${copied 
                          ? 'text-green-500 bg-green-50 dark:text-green-300 dark:bg-green-900/20' 
                          : 'text-gray-500 bg-gray-50 dark:text-gray-300 dark:bg-gray-900/50'
                        } 
                        border border-gray-100 dark:border-gray-800`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <AnimatePresence mode="wait">
                        {copied ? (
                          <motion.div
                            key="check"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                          >
                            <Check className="w-5 h-5" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="link"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                          >
                            <Link2 className="w-5 h-5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                  
                  <SocialMediaShareButtons postTitle={title} currentURL={currentURL} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}; 