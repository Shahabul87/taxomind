"use client";

import { motion } from "framer-motion";
import {
  Clock,
  ExternalLink,
  ThumbsUp,
  Bookmark,
  Share2,
  Zap,
  TrendingUp,
  Sparkles,
  Award,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsArticle {
  articleId: string;
  title: string;
  summary: string;
  content: string;
  articleUrl: string;
  source: {
    name: string;
    url: string;
  };
  author?: string;
  publishDate: Date;
  category: string;
  tags: string[];
  readingTime: number;
  relevanceScore: number;
  impactLevel: 'critical' | 'high' | 'medium' | 'low';
  images?: {
    url: string;
    caption: string;
  }[];
  isBookmarked?: boolean;
  isLiked?: boolean;
  rankingScore?: number;
  trendingStatus?: 'hot' | 'rising' | 'steady' | 'new';
  qualityBadges?: string[];
}

interface NewsCardProps {
  article: NewsArticle;
  index: number;
  categoryMapping: Record<string, string>;
}

export function NewsCard({ article, index, categoryMapping }: NewsCardProps) {

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const articleDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - articleDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getImpactConfig = (impact: string) => {
    const configs: Record<string, { bg: string; text: string; border: string; label: string }> = {
      critical: {
        bg: 'bg-rose-50 dark:bg-rose-500/10',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-500/30',
        label: 'CRITICAL'
      },
      high: {
        bg: 'bg-orange-50 dark:bg-orange-500/10',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-500/30',
        label: 'HIGH'
      },
      medium: {
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-500/30',
        label: 'MEDIUM'
      },
      low: {
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-500/30',
        label: 'LOW'
      }
    };
    return configs[impact] || configs.medium;
  };

  const getTrendingConfig = (status?: string) => {
    const configs: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string; text: string; label: string }> = {
      hot: {
        icon: Zap,
        bg: 'bg-rose-500',
        text: 'text-white',
        label: 'HOT'
      },
      rising: {
        icon: TrendingUp,
        bg: 'bg-orange-500',
        text: 'text-white',
        label: 'RISING'
      },
      new: {
        icon: Sparkles,
        bg: 'bg-blue-500',
        text: 'text-white',
        label: 'NEW'
      }
    };
    return status ? configs[status] : null;
  };

  const impactConfig = getImpactConfig(article.impactLevel);
  const trendingConfig = getTrendingConfig(article.trendingStatus);
  const displayCategory = categoryMapping[article.category] || article.category;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-300"
    >
      {/* Gradient accent on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative p-5 sm:p-6">
        {/* Top Row - Meta Info */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Trending Badge */}
          {trendingConfig && (
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold",
              trendingConfig.bg,
              trendingConfig.text
            )}>
              <trendingConfig.icon className="w-3 h-3" />
              {trendingConfig.label}
            </span>
          )}

          {/* Impact Badge */}
          <span className={cn(
            "inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border",
            impactConfig.bg,
            impactConfig.text,
            impactConfig.border
          )}>
            {impactConfig.label}
          </span>

          {/* Category */}
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {displayCategory}
          </span>

          {/* Time */}
          <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(article.publishDate)}
          </span>

          {/* Ranking Score */}
          {article.rankingScore && (
            <span className="ml-auto hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Score:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{article.rankingScore}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <a
          href={article.articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block group/title mb-3"
        >
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors line-clamp-2">
            {article.title}
          </h3>
        </a>

        {/* Summary */}
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-4 line-clamp-2">
          {article.summary}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {article.tags.slice(0, 4).map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              #{tag}
            </span>
          ))}

          {/* Quality Badges */}
          {article.qualityBadges?.slice(0, 2).map((badge, badgeIndex) => (
            <span
              key={`badge-${badgeIndex}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-500/30"
            >
              <Award className="w-3 h-3" />
              {badge}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50">
          {/* Source Info */}
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <a
              href={article.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {article.source.name}
            </a>
            {article.author && (
              <>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="text-slate-500 dark:text-slate-400">{article.author}</span>
              </>
            )}
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>{article.readingTime} min read</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              className={cn(
                "p-2 rounded-lg transition-all",
                article.isLiked
                  ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
              )}
              aria-label="Like article"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              className={cn(
                "p-2 rounded-lg transition-all",
                article.isBookmarked
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
              )}
              aria-label="Bookmark article"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
              aria-label="Share article"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <a
              href={article.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
              aria-label="Open article in new tab"
            >
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
