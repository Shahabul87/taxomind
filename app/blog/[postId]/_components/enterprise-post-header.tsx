"use client";

import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
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
  const [mounted, setMounted] = useState(false);
  const currentURL = typeof window !== 'undefined' ? window.location.href : '';

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (date: Date) => {
    if (!mounted) return '';
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
      {/* Premium/Featured Badges - Editorial Style */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 md:mb-6 blog-hero-reveal blog-delay-1">
        {isFeatured && (
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 rounded-full bg-gradient-to-r from-blog-gold/20 to-blog-primary/10 border border-blog-gold/30">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-blog-gold" />
            <span className="text-[10px] sm:text-xs font-semibold text-blog-gold font-[family-name:var(--font-ui)]">Featured</span>
          </div>
        )}
        {isPremium && (
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 rounded-full bg-gradient-to-r from-blog-primary/15 to-blog-accent/10 border border-blog-primary/25">
            <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-blog-primary" />
            <span className="text-[10px] sm:text-xs font-semibold text-blog-primary font-[family-name:var(--font-ui)]">Premium</span>
          </div>
        )}
      </div>

      {/* Main Header Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="space-y-3 sm:space-y-4 md:space-y-6"
      >
        {/* Category and Metadata Bar - Editorial */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm blog-content-reveal blog-delay-2">
          <Link href="/" className="flex-shrink-0" aria-label="Go to homepage">
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blog-text-muted hover:text-blog-primary cursor-pointer transition-colors" />
          </Link>
          {category && (
            <Badge variant="secondary" className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 md:px-3 md:py-1 text-[10px] sm:text-xs flex-shrink-0 bg-blog-primary/10 text-blog-primary border-blog-primary/20 hover:bg-blog-primary/20 transition-colors">
              <Hash className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
              <span className="truncate max-w-[100px] sm:max-w-none font-[family-name:var(--font-ui)]">{category}</span>
            </Badge>
          )}
          {difficulty && (
            <Badge className={cn("px-1.5 py-0.5 sm:px-2 sm:py-0.5 md:px-3 md:py-1 text-[10px] sm:text-xs flex-shrink-0 font-[family-name:var(--font-ui)]", getDifficultyColor(difficulty))}>
              <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
              <span className="hidden xs:inline">{difficulty}</span>
              <span className="xs:hidden">{difficulty.charAt(0)}</span>
            </Badge>
          )}
          <div className="flex items-center gap-0.5 sm:gap-1 text-blog-text-muted flex-shrink-0 font-[family-name:var(--font-ui)]">
            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">{language}</span>
            <span className="sm:hidden text-[10px]">{language.substring(0, 2)}</span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 text-blog-text-muted flex-shrink-0 font-[family-name:var(--font-ui)]">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs">{formatDate(createdAt)}</span>
          </div>
          {updatedAt && (
            <div className="hidden lg:flex items-center gap-1 text-blog-text-muted font-[family-name:var(--font-ui)]">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">Updated {formatDate(updatedAt)}</span>
            </div>
          )}
        </div>

        {/* Title - Editorial Typography */}
        <div className="space-y-2 sm:space-y-3 md:space-y-4 blog-content-reveal blog-delay-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-blog-text dark:text-white leading-[1.15] sm:leading-[1.1] tracking-tight font-[family-name:var(--font-display)]">
            {title}
          </h1>
          {description && (
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blog-text-muted dark:text-gray-300 leading-relaxed font-[family-name:var(--font-body)]">
              {description}
            </p>
          )}
        </div>

        {/* Author Section - Editorial */}
        <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 py-3 sm:py-4 md:py-6 border-y border-blog-border dark:border-gray-700 blog-content-reveal blog-delay-4">
          {/* Author Info */}
          <div className="flex items-start justify-between gap-2 sm:gap-3 md:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Avatar className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 border-2 border-blog-border dark:border-gray-700 flex-shrink-0 ring-2 ring-blog-primary/10">
                <AvatarImage src={authorImage || undefined} alt={authorName || 'Author'} />
                <AvatarFallback className="bg-gradient-to-br from-blog-primary to-blog-accent text-white text-xs sm:text-sm md:text-base font-[family-name:var(--font-display)]">
                  {authorName?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <p className="text-sm sm:text-base md:text-lg font-semibold text-blog-text dark:text-white truncate font-[family-name:var(--font-display)]">
                    {authorName || 'Anonymous'}
                  </p>
                  {isVerified && (
                    <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-blog-accent flex-shrink-0" />
                  )}
                </div>
                <p className="text-[10px] sm:text-xs md:text-sm text-blog-text-muted dark:text-gray-400 truncate font-[family-name:var(--font-ui)]">{authorRole}</p>
              </div>
            </div>
            <Button
              variant={isFollowing ? "secondary" : "default"}
              size="sm"
              onClick={() => setIsFollowing(!isFollowing)}
              className={cn(
                "flex-shrink-0 text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 h-7 sm:h-8 md:h-9 font-bold font-[family-name:var(--font-ui)]",
                !isFollowing && "bg-gradient-to-r from-blog-primary to-blog-primary-dark hover:from-blog-primary-dark hover:to-blog-primary text-white"
              )}
            >
              <span className="hidden xs:inline">{isFollowing ? 'Following' : 'Follow'}</span>
              <span className="xs:hidden">{isFollowing ? '✓' : '+'}</span>
            </Button>
          </div>

          {/* Engagement Stats - Editorial */}
          <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 md:gap-6 text-[10px] sm:text-xs md:text-sm font-[family-name:var(--font-ui)]">
            <div className="flex items-center gap-1 sm:gap-1.5 text-blog-text-muted dark:text-gray-400">
              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span className="font-medium">{formatNumber(viewCount)}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-blog-text-muted dark:text-gray-400">
              <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span className="font-medium">{readingTime} min</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-blog-text-muted dark:text-gray-400">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span className="font-medium">{formatNumber(shareCount)}</span>
            </div>
          </div>
        </div>

        {/* Action Bar - Editorial Style */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 blog-content-reveal blog-delay-5">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide -mx-1 px-1">
            <Button
              variant={isLiked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              className={cn(
                "gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0 text-[10px] sm:text-xs md:text-sm h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 font-[family-name:var(--font-ui)] transition-all",
                isLiked ? "bg-blog-primary hover:bg-blog-primary-dark text-white border-blog-primary" : "border-blog-border hover:border-blog-primary hover:text-blog-primary"
              )}
            >
              <Heart className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4", isLiked && "fill-current")} />
              <span>{formatNumber(localLikeCount)}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0 text-[10px] sm:text-xs md:text-sm h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 font-[family-name:var(--font-ui)] border-blog-border hover:border-blog-accent hover:text-blog-accent transition-all"
            >
              <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              <span>{formatNumber(commentCount)}</span>
            </Button>

            <Button
              variant={isBookmarked ? "default" : "outline"}
              size="sm"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={cn(
                "flex-shrink-0 h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 transition-all",
                isBookmarked ? "bg-blog-gold hover:bg-blog-gold/90 text-white border-blog-gold" : "border-blog-border hover:border-blog-gold hover:text-blog-gold"
              )}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this article"}
            >
              <Bookmark className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4", isBookmarked && "fill-current")} />
            </Button>

            {mounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0 text-[10px] sm:text-xs md:text-sm h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 font-[family-name:var(--font-ui)] border-blog-border hover:border-blog-accent hover:text-blog-accent transition-all"
                    aria-label="Share this article"
                  >
                    <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Share</span>
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
            )}
          </div>

          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 h-8 sm:h-9 md:h-10 w-8 sm:w-9 md:w-10 p-0"
                  aria-label="More options"
                >
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
          )}
        </div>

        {/* Tags Section - Editorial */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2 sm:pt-3 md:pt-4 blog-content-reveal blog-delay-6">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 md:px-3 md:py-1 text-[10px] sm:text-xs border-blog-border text-blog-text-muted hover:bg-blog-primary/10 hover:border-blog-primary hover:text-blog-primary dark:hover:bg-blog-primary/20 cursor-pointer transition-all font-[family-name:var(--font-ui)]"
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
