"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { logger } from '@/lib/logger';
import {
  Tag,
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  Share2,
  Link2,
  Check,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  Linkedin as LinkedinIcon,
  Mail,
  MessageSquare as WhatsAppIcon,
  Bookmark,
  BookmarkCheck,
  Printer,
  ChevronRight,
  TrendingUp,
  Award,
  Globe,
  Sparkles,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from "next-themes";

interface PostHeaderDetailsEnterpriseV2Props {
  title: string;
  category: string | null | undefined;
  authorName: string | null | undefined;
  createdAt: Date;
  updatedAt?: Date | null;
  description?: string | null;
  imageUrl?: string | null;
  readingTime?: number;
  viewCount?: number;
  commentCount?: number;
  featured?: boolean;
}

export const PostHeaderDetailsEnterpriseV2 = ({
  title,
  category,
  authorName,
  createdAt,
  updatedAt,
  description,
  imageUrl,
  readingTime = 5,
  viewCount = 0,
  commentCount = 0,
  featured = false
}: PostHeaderDetailsEnterpriseV2Props) => {
  const [copied, setCopied] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const currentURL = typeof window !== 'undefined' ? window.location.href : '';
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 200;
      setIsScrolled(scrolled);

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const trackLength = documentHeight - windowHeight;
      const progress = Math.min((scrollTop / trackLength) * 100, 100);
      setReadingProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formattedDate = useMemo(() => {
    return new Date(createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [createdAt]);

  const shareLinks = [
    {
      name: "Twitter",
      icon: TwitterIcon,
      color: "text-[#1DA1F2] dark:text-[#1DA1F2]/90",
      hoverColor: "hover:bg-[#1DA1F2]/10",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentURL)}`,
    },
    {
      name: "Facebook",
      icon: FacebookIcon,
      color: "text-[#1877F2] dark:text-[#1877F2]/90",
      hoverColor: "hover:bg-[#1877F2]/10",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentURL)}`,
    },
    {
      name: "LinkedIn",
      icon: LinkedinIcon,
      color: "text-[#0A66C2] dark:text-[#0A66C2]/90",
      hoverColor: "hover:bg-[#0A66C2]/10",
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentURL)}&title=${encodeURIComponent(title)}`,
    },
    {
      name: "WhatsApp",
      icon: WhatsAppIcon,
      color: "text-[#25D366] dark:text-[#25D366]/90",
      hoverColor: "hover:bg-[#25D366]/10",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + currentURL)}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "text-gray-600 dark:text-gray-400",
      hoverColor: "hover:bg-gray-100 dark:hover:bg-gray-700",
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

  const handlePrint = () => {
    window.print();
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      {/* Theme Switcher - Top Right Corner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed top-6 right-6 z-50"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className="w-11 h-11 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
                aria-label="Toggle theme"
              >
                {mounted && (
                  <>
                    {theme === 'dark' ? (
                      <Sun className="w-5 h-5 text-amber-500 group-hover:rotate-90 transition-transform duration-300" />
                    ) : (
                      <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
                    )}
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Switch to {theme === 'dark' ? 'light' : 'dark'} mode</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>

      {/* Main Header Container */}
      <div className="relative mb-10">
        {/* Breadcrumb Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 mb-6 text-sm"
        >
          <Link
            href="/"
            className="text-gray-500 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Globe className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" />
          <Link
            href="/blog"
            className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
          >
            Blog
          </Link>
          {category && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" />
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">{category}</span>
            </>
          )}
        </motion.nav>

        {/* Category Badge with Featured Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center gap-3 mb-6"
        >
          {category && (
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
              <Tag className="w-3.5 h-3.5 mr-2" />
              {category}
            </span>
          )}
          {featured && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
              <Award className="w-3.5 h-3.5 mr-1.5" />
              Featured
            </span>
          )}
        </motion.div>

        {/* Post Title - More Elegant Typography */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 text-gray-900 dark:text-gray-50 leading-[1.15] tracking-tight"
        >
          {title || "Untitled Post"}
        </motion.h1>

        {/* Description - Softer, More Readable */}
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-4xl font-light"
          >
            {description}
          </motion.p>
        )}

        {/* Featured Image Integration */}
        {imageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden mb-8 shadow-2xl"
          >
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </motion.div>
        )}

        {/* Author and Metadata Section - Refined */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8"
        >
          {/* Left Side - Author Info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
              {authorName ? authorName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {authorName || "Unknown Author"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Author
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formattedDate}
                </span>
                {updatedAt && (
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Updated
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Stats and Actions */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Reading Stats - Softer Colors */}
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                      <Clock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      <span className="font-medium">{readingTime} min</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reading time</p>
                  </TooltipContent>
                </Tooltip>

                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                      <Eye className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      <span className="font-medium">{viewCount.toLocaleString()}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Views</p>
                  </TooltipContent>
                </Tooltip>

                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                      <MessageCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                      <span className="font-medium">{commentCount}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Comments</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Action Buttons - Refined */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                {/* Bookmark Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleBookmark}
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                        isBookmarked
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                          : "bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400"
                      )}
                      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-5 h-5" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isBookmarked ? 'Saved' : 'Save'}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Print Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handlePrint}
                      className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
                      aria-label="Print article"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Print</p>
                  </TooltipContent>
                </Tooltip>

                {/* Share Button */}
                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setIsShareOpen(!isShareOpen)}
                        className={cn(
                          "flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-medium transition-all duration-200",
                          isShareOpen
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                            : "bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400"
                        )}
                        aria-label="Share article"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Share</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Share Dropdown */}
                  <AnimatePresence>
                    {isShareOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-20 min-w-[280px]"
                      >
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          Share this article
                        </p>
                        <TooltipProvider>
                          <div className="flex items-center gap-2 mb-3">
                            {shareLinks.map((platform) => {
                              const Icon = platform.icon;
                              return (
                                <Tooltip key={platform.name}>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={platform.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={cn(
                                        "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                                        "bg-gray-50 dark:bg-gray-700/50",
                                        platform.hoverColor
                                      )}
                                      aria-label={`Share on ${platform.name}`}
                                    >
                                      <Icon className={`w-5 h-5 ${platform.color}`} />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">
                                    <p>{platform.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>

                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={copyToClipboard}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                            >
                              <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                <Link2 className="w-4 h-4" />
                                <span className="font-medium">Copy link</span>
                              </span>
                              {copied ? (
                                <Check className="w-4 h-4 text-green-500 dark:text-green-400" />
                              ) : null}
                            </button>
                          </div>
                        </TooltipProvider>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Background Overlay */}
                  {isShareOpen && (
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsShareOpen(false)}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </TooltipProvider>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Single Elegant Divider Line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent mb-10"
      />

      {/* Floating Progress Bar Header */}
      <AnimatePresence>
        {isScrolled && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-lg"
          >
            {/* Reading Progress Bar */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-150" style={{ width: `${readingProgress}%` }} />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {category && (
                    <span className="hidden md:inline-flex text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-100 dark:border-indigo-900/50">
                      {category}
                    </span>
                  )}
                  <h2 className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                    {title}
                  </h2>
                  <span className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    {readingTime} min
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleBookmark}
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                      isBookmarked
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                    )}
                    aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsShareOpen(!isShareOpen)}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
                    aria-label="Share article"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PostHeaderDetailsEnterpriseV2;

