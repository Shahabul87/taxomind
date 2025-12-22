"use client";

import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline, TrendIndicator } from "./sparkline";
import type { DashboardStats, Post } from "./types";

interface StatsCardsProps {
  stats: DashboardStats;
  posts: Post[];
}

// Generate sparkline data from posts
const generateSparklineData = (posts: Post[], metric: 'views' | 'comments' | 'likes'): number[] => {
  // Group posts by day for the last 7 days
  const now = new Date();
  const data: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));

    const dayPosts = posts.filter(post => {
      const postDate = new Date(post.createdAt);
      return postDate >= dayStart && postDate <= dayEnd;
    });

    if (metric === 'views') {
      data.push(dayPosts.reduce((sum, post) => sum + post.views, 0));
    } else if (metric === 'comments') {
      data.push(dayPosts.reduce((sum, post) => sum + post.comments.length, 0));
    } else if (metric === 'likes') {
      data.push(dayPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0));
    }
  }

  // If all zeros, return some sample data for visual interest
  if (data.every(d => d === 0)) {
    return [0, 1, 2, 1, 3, 2, 4];
  }

  return data;
};

// Calculate week-over-week change
const calculateTrend = (posts: Post[], metric: 'published' | 'views' | 'comments' | 'likes'): number => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeekPosts = posts.filter(post => new Date(post.createdAt) >= oneWeekAgo);
  const lastWeekPosts = posts.filter(post => {
    const date = new Date(post.createdAt);
    return date >= twoWeeksAgo && date < oneWeekAgo;
  });

  let thisWeekValue = 0;
  let lastWeekValue = 0;

  if (metric === 'published') {
    thisWeekValue = thisWeekPosts.filter(p => p.published).length;
    lastWeekValue = lastWeekPosts.filter(p => p.published).length;
  } else if (metric === 'views') {
    thisWeekValue = thisWeekPosts.reduce((sum, post) => sum + post.views, 0);
    lastWeekValue = lastWeekPosts.reduce((sum, post) => sum + post.views, 0);
  } else if (metric === 'comments') {
    thisWeekValue = thisWeekPosts.reduce((sum, post) => sum + post.comments.length, 0);
    lastWeekValue = lastWeekPosts.reduce((sum, post) => sum + post.comments.length, 0);
  } else if (metric === 'likes') {
    thisWeekValue = thisWeekPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
    lastWeekValue = lastWeekPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
  }

  if (lastWeekValue === 0) return thisWeekValue > 0 ? 100 : 0;
  return ((thisWeekValue - lastWeekValue) / lastWeekValue) * 100;
};

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  sparklineData?: number[];
  sparklineColor?: string;
  trend?: number;
  delay?: number;
}

const StatCard = ({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  sparklineData,
  sparklineColor = "#8b5cf6",
  trend = 0,
  delay = 0,
}: StatCardProps) => {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-slate-300/80 dark:hover:border-slate-600/80"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-100/50 dark:to-slate-700/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex justify-between items-start mb-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
          <div className={cn("p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110", iconBg)}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>

        {/* Value */}
        <motion.p
          className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.2, type: "spring" }}
        >
          {value.toLocaleString()}
        </motion.p>

        {/* Sparkline and trend row */}
        <div className="flex items-center justify-between gap-2">
          {/* Trend indicator */}
          <TrendIndicator value={trend} size="sm" />

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="flex-shrink-0">
              <Sparkline
                data={sparklineData}
                width={64}
                height={24}
                color={sparklineColor}
                strokeWidth={1.5}
                fillOpacity={0.2}
                showDots
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const StatsCards = ({ stats, posts }: StatsCardsProps) => {
  const viewsSparkline = generateSparklineData(posts, 'views');
  const commentsSparkline = generateSparklineData(posts, 'comments');
  const likesSparkline = generateSparklineData(posts, 'likes');

  const publishedTrend = calculateTrend(posts, 'published');
  const viewsTrend = calculateTrend(posts, 'views');
  const likesTrend = calculateTrend(posts, 'likes');
  const commentsTrend = calculateTrend(posts, 'comments');

  const statsConfig = [
    {
      label: "Published",
      value: stats.published,
      icon: <CheckCircle className="w-4 h-4" />,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      sparklineData: [stats.published > 0 ? stats.published - 1 : 0, stats.published],
      sparklineColor: "#10b981",
      trend: publishedTrend,
    },
    {
      label: "Drafts",
      value: stats.drafts,
      icon: <Clock className="w-4 h-4" />,
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      sparklineData: [stats.drafts > 0 ? stats.drafts - 1 : 0, stats.drafts],
      sparklineColor: "#f59e0b",
      trend: 0,
    },
    {
      label: "Views",
      value: stats.views,
      icon: <Eye className="w-4 h-4" />,
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      sparklineData: viewsSparkline,
      sparklineColor: "#3b82f6",
      trend: viewsTrend,
    },
    {
      label: "Likes",
      value: stats.likes,
      icon: <Heart className="w-4 h-4" />,
      iconBg: "bg-rose-100 dark:bg-rose-900/40",
      iconColor: "text-rose-600 dark:text-rose-400",
      sparklineData: likesSparkline,
      sparklineColor: "#f43f5e",
      trend: likesTrend,
    },
    {
      label: "Comments",
      value: stats.comments,
      icon: <MessageCircle className="w-4 h-4" />,
      iconBg: "bg-violet-100 dark:bg-violet-900/40",
      iconColor: "text-violet-600 dark:text-violet-400",
      sparklineData: commentsSparkline,
      sparklineColor: "#8b5cf6",
      trend: commentsTrend,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
      {statsConfig.map((stat, index) => (
        <StatCard
          key={stat.label}
          {...stat}
          delay={index * 0.08}
        />
      ))}
    </div>
  );
};
