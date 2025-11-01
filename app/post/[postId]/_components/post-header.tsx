"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { Calendar, Clock, Eye, MessageCircle, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthorSocialLinks } from "./author-social-links";

interface SocialLink {
  platform: "twitter" | "linkedin" | "github" | "email" | "website";
  url: string;
}

interface PostHeaderProps {
  title: string;
  subtitle?: string;
  coverImage?: string;
  author: {
    name: string;
    avatar?: string;
    bio?: string;
    id?: string;
    socialLinks?: SocialLink[];
  };
  publishDate: Date;
  updateDate?: Date;
  readingTime: number;
  category?: string;
  tags?: string[];
  viewCount: number;
  commentCount: number;
}

export function PostHeader({
  title,
  subtitle,
  coverImage,
  author,
  publishDate,
  updateDate,
  readingTime,
  category,
  tags = [],
  viewCount,
  commentCount,
}: PostHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();

  // Parallax effect for cover image
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <header className="relative w-full overflow-hidden">
      {/* Hero Section with Parallax Background */}
      <div className="relative h-[40vh] md:h-[60vh] w-full">
        {/* Background Image with Parallax */}
        {coverImage && mounted && (
          <motion.div
            style={{ y }}
            className="absolute inset-0 -z-10"
          >
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            {/* Enhanced Gradient Overlay with Indigo/Purple Theme */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/40 via-purple-900/60 to-slate-900/90" />
          </motion.div>
        )}

        {/* No cover image fallback with gradient background */}
        {!coverImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 dark:from-indigo-800 dark:via-purple-800 dark:to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
          </div>
        )}

        {/* Title Overlay with Enterprise Design */}
        <motion.div
          style={{ opacity }}
          className="absolute inset-0 flex items-end"
        >
          <div className="w-full px-4 md:px-8 lg:px-12 pb-8 md:pb-12">
            <div className="max-w-4xl mx-auto space-y-5">
              {/* Category Badge with Enterprise Styling */}
              {category && (
                <Badge className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-600 backdrop-blur-md text-white border-0 px-5 py-1.5 rounded-full shadow-lg ring-2 ring-white/20 text-sm font-semibold">
                  {category}
                </Badge>
              )}

              {/* Title with Enhanced Typography */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight">
                {title}
              </h1>

              {/* Subtitle/Description with Prominent Styling */}
              {subtitle && (
                <div className="max-w-3xl">
                  <p className="text-lg md:text-xl lg:text-2xl text-gray-100 leading-relaxed font-medium">
                    {subtitle}
                  </p>
                </div>
              )}

              {/* Metadata Bar with Enhanced Icons */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-100 pt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={publishDate.toISOString()}>
                    {formatDate(publishDate)}
                  </time>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span>{readingTime} min read</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Eye className="w-4 h-4" />
                  <span>{viewCount.toLocaleString()} views</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <MessageCircle className="w-4 h-4" />
                  <span>{commentCount} comments</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Author Card with Enterprise Glassmorphism */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200/70 dark:border-slate-800/70 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Author Info with Enhanced Design */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-md opacity-30" />
                <Avatar className="relative w-12 h-12 md:w-14 md:h-14 ring-2 ring-indigo-500/20 dark:ring-indigo-500/30 shadow-md">
                  <AvatarImage src={author.avatar} alt={author.name} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40">
                    <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-base">
                  {author.name}
                </p>
                {author.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                    {author.bio}
                  </p>
                )}
                {updateDate && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Updated {formatDate(updateDate)}
                  </p>
                )}
              </div>
            </div>

            {/* Social Links and Follow */}
            <AuthorSocialLinks
              authorId={author.id || ""}
              authorName={author.name}
              socialLinks={author.socialLinks}
            />
          </div>

          {/* Tags with Enhanced Styling */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-200/70 dark:border-slate-800/70">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 hover:shadow-sm transition-all duration-200"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 