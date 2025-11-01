"use client";

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { 
  Tag, 
  User as UserIcon, 
  Calendar, 
  RefreshCw, 
  Share2, 
  Link2, 
  Check,
  Twitter as TwitterIcon, 
  Facebook as FacebookIcon, 
  Linkedin as LinkedinIcon,
  Mail,
  MessageSquare as WhatsAppIcon,
  Bookmark
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PostHeaderDetailsProps {
  title: string;
  category: string | null | undefined;
  authorName: string | null | undefined;
  createdAt: Date;
  updatedAt?: Date | null;
}

export const PostHeaderDetails = ({
  title,
  category,
  authorName,
  createdAt,
  updatedAt
}: PostHeaderDetailsProps) => {
  const [copied, setCopied] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const currentURL = typeof window !== 'undefined' ? window.location.href : '';
  
  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 150);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formattedDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shareLinks = [
    {
      name: "Twitter",
      icon: TwitterIcon,
      color: "text-[#1DA1F2] dark:text-[#1DA1F2]/90",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentURL)}`,
    },
    {
      name: "Facebook",
      icon: FacebookIcon,
      color: "text-[#1877F2] dark:text-[#1877F2]/90",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentURL)}`,
    },
    {
      name: "LinkedIn",
      icon: LinkedinIcon,
      color: "text-[#0A66C2] dark:text-[#0A66C2]/90",
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentURL)}&title=${encodeURIComponent(title)}`,
    },
    {
      name: "WhatsApp",
      icon: WhatsAppIcon,
      color: "text-[#25D366] dark:text-[#25D366]/90",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + currentURL)}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "text-gray-600 dark:text-gray-400",
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(currentURL)}`,
    }
  ];

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
    <div className="mb-8">
      {/* Main Header Container */}
      <div className="relative mb-10">
        {/* Category Badge */}
        {category && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
              <Tag className="w-3.5 h-3.5 mr-1.5" />
              {category}
            </span>
          </motion.div>
        )}

        {/* Post Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-900 dark:text-white leading-tight"
        >
          {title || "Untitled Post"}
        </motion.h1>

        {/* Author and Date Info */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 mb-4"
        >
          <div className="flex items-center">
            <UserIcon className="w-4 h-4 mr-2 text-violet-600 dark:text-violet-400" />
            <span className="text-sm font-medium">{authorName || "Unknown Author"}</span>
          </div>
          
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-violet-600 dark:text-violet-400" />
            <span className="text-sm font-medium">Published: {formattedDate(createdAt)}</span>
          </div>
          
          {updatedAt && (
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-medium">Updated: {formattedDate(updatedAt)}</span>
            </div>
          )}
          
          {/* Share Button */}
          <div className="relative ml-auto">
            <button
              onClick={() => setIsShareOpen(!isShareOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors duration-200",
                isShareOpen 
                  ? "bg-violet-600 text-white" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300"
              )}
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            
            {/* Share Dropdown */}
            <AnimatePresence>
              {isShareOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 z-20 w-auto"
                >
                  <TooltipProvider>
                    <div className="flex items-center gap-2 mb-2">
                      {shareLinks.map((platform) => {
                        const Icon = platform.icon;
                        return (
                          <Tooltip key={platform.name}>
                            <TooltipTrigger asChild>
                              <a
                                href={platform.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                <Icon className={`w-4 h-4 ${platform.color}`} />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>Share on {platform.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={copyToClipboard}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-green-500 dark:text-green-400" />
                            ) : (
                              <Link2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>{copied ? 'Copied!' : 'Copy link'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Background Overlay - Close Share When Clicked Outside */}
            {isShareOpen && (
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsShareOpen(false)}
              />
            )}
          </div>
        </motion.div>
      </div>
     
      {/* Simple Divider */}
      <div className="w-full h-px bg-gray-200 dark:bg-gray-800/80 mb-8" />
      
      {/* Floating Mini Header When Scrolled */}
      <AnimatePresence>
        {isScrolled && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm"
          >
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate">
                {category && (
                  <span className="hidden sm:inline-flex text-xs px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                    {category}
                  </span>
                )}
                <h2 className="text-sm font-medium truncate text-gray-800 dark:text-white">
                  {title}
                </h2>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsShareOpen(!isShareOpen)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostHeaderDetails; 