"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { useSession } from "next-auth/react";
import {
  Calendar,
  Clock,
  Eye,
  Share2,
  Bookmark,
  Heart,
  MessageCircle,
  TrendingUp,
  Award,
  Hash,
  BarChart3,
  Users,
  BookOpen,
  Timer,
  ChevronRight,
  Sparkles,
  Globe,
  Shield,
  Star,
  ThumbsUp,
  Copy,
  Check,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Link2,
  MoreHorizontal,
  Download,
  Flag,
  Bell,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface EnterprisePostHeaderProps {
  postId: string;
  title: string;
  description?: string | null;
  category: string | null | undefined;
  authorName: string | null | undefined;
  authorImage?: string | null;
  authorRole?: string | null;
  authorBio?: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
  readingTime?: number;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  hasUserReacted?: boolean;
  tags?: string[];
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  language?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
}

export const EnterprisePostHeader = ({
  postId,
  title,
  description,
  category,
  authorName,
  authorImage,
  authorRole = "Content Creator",
  authorBio,
  createdAt,
  updatedAt,
  readingTime = 5,
  viewCount = 0,
  likeCount = 0,
  commentCount = 0,
  shareCount = 0,
  hasUserReacted = false,
  tags = [],
  difficulty,
  language = "English",
  isVerified = false,
  isFeatured = false,
  isPremium = false,
}: EnterprisePostHeaderProps) => {
  const [isLiked, setIsLiked] = useState(hasUserReacted);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(likeCount);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentURL = typeof window !== 'undefined' ? window.location.href : '';

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const { data: session } = useSession();

  // Track view on mount
  useEffect(() => {
    const trackView = async () => {
      try {
        await axios.post(`/api/posts/${postId}/views`);
      } catch (error) {
        console.error("Failed to track view:", error);
      }
    };
    trackView();
  }, [postId]);

  const handleLike = async () => {
    if (!session) {
      toast.error("Please sign in to react");
      return;
    }

    if (isSubmitting) return;

    const previousLiked = isLiked;
    const previousCount = localLikeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLocalLikeCount(isLiked ? localLikeCount - 1 : localLikeCount + 1);
    setIsSubmitting(true);

    try {
      await axios.post(`/api/posts/${postId}/reactions`, { type: "LOVE" });
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked);
      setLocalLikeCount(previousCount);
      toast.error("Failed to update reaction");
      console.error("Failed to react:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareOptions = [
    { name: 'Twitter', icon: Twitter, color: 'hover:text-[#1DA1F2]', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentURL)}` },
    { name: 'Facebook', icon: Facebook, color: 'hover:text-[#1877F2]', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentURL)}` },
    { name: 'LinkedIn', icon: Linkedin, color: 'hover:text-[#0A66C2]', url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentURL)}&title=${encodeURIComponent(title)}` },
    { name: 'Email', icon: Mail, color: 'hover:text-purple-600', url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(currentURL)}` },
  ];

  const getDifficultyColor = (level?: string) => {
    switch(level) {
      case 'Beginner': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Intermediate': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Advanced': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Expert': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="relative">
      {/* Premium/Featured Badges */}
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        {isFeatured && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Featured</span>
          </motion.div>
        )}
        {isPremium && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20"
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Premium</span>
          </motion.div>
        )}
      </div>

      {/* Main Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4 sm:space-y-6"
      >
        {/* Category and Metadata Bar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <Link href="/">
            <Home className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors" />
          </Link>
          {category && (
            <Badge variant="secondary" className="px-2 py-0.5 sm:px-3 sm:py-1 text-xs">
              <Hash className="w-3 h-3 mr-1" />
              {category}
            </Badge>
          )}
          {difficulty && (
            <Badge className={cn("px-2 py-0.5 sm:px-3 sm:py-1 text-xs", getDifficultyColor(difficulty))}>
              <TrendingUp className="w-3 h-3 mr-1" />
              {difficulty}
            </Badge>
          )}
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">{language}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{formatDate(createdAt)}</span>
          </div>
          {updatedAt && (
            <div className="hidden md:flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated {formatDate(updatedAt)}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Author Section */}
        <div className="flex flex-col gap-4 sm:gap-6 py-4 sm:py-6 border-y border-gray-200 dark:border-gray-700">
          {/* Author Info */}
          <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 border-2 border-gray-200 dark:border-gray-700 flex-shrink-0">
                <AvatarImage src={authorImage || undefined} alt={authorName || 'Author'} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-sm sm:text-base">
                  {authorName?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {authorName || 'Anonymous'}
                  </h3>
                  {isVerified && (
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{authorRole}</p>
              </div>
            </div>
            <Button
              variant={isFollowing ? "secondary" : "default"}
              size="sm"
              onClick={() => setIsFollowing(!isFollowing)}
              className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4"
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          </div>

          {/* Engagement Stats - Mobile Optimized */}
          <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium">{formatNumber(viewCount)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium">{readingTime} min</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium">{formatNumber(shareCount)}</span>
            </div>
          </div>
        </div>

        {/* Action Bar - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Button
              variant={isLiked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              className="gap-1.5 sm:gap-2 flex-shrink-0 text-xs sm:text-sm"
            >
              <Heart className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isLiked && "fill-current")} />
              <span>{formatNumber(localLikeCount)}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 sm:gap-2 flex-shrink-0 text-xs sm:text-sm"
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{formatNumber(commentCount)}</span>
            </Button>

            <Button
              variant={isBookmarked ? "default" : "outline"}
              size="sm"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="flex-shrink-0"
            >
              <Bookmark className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isBookmarked && "fill-current")} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 flex-shrink-0 text-xs sm:text-sm">
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Share</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Share this article</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {shareOptions.map((option) => (
                  <DropdownMenuItem key={option.name} asChild>
                    <a
                      href={option.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <option.icon className={cn("w-4 h-4", option.color)} />
                      <span>{option.name}</span>
                    </a>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={copyToClipboard} className="gap-3">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy link</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-3">
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3">
                <Bell className="w-4 h-4" />
                <span>Get notifications</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3">
                <Flag className="w-4 h-4" />
                <span>Report content</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags Section */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 sm:pt-4">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="px-2 py-0.5 sm:px-3 sm:py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EnterprisePostHeader;
