"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  User,
  Eye,
  Hash,
  Users,
  Rocket,
  Sparkles,
  ChevronRight,
  Flame,
  Crown,
  Zap,
  BookMarked,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { BlogPost, BlogStatistics } from "./types";

// ============================================================================
// Types
// ============================================================================

interface BlogSidebarProps {
  trendingPosts: BlogPost[];
  statistics?: BlogStatistics | null;
  categories: { id: string; name: string; count: number }[];
  onCategorySelect?: (categoryId: string) => void;
  className?: string;
  variant?: "desktop" | "mobile";
}

interface Author {
  id: string;
  name: string;
  image?: string | null;
  articleCount: number;
}

// ============================================================================
// Trending Posts Widget
// ============================================================================

function TrendingWidget({ posts }: { posts: BlogPost[] }) {
  const gradients = [
    "from-rose-500 via-pink-500 to-fuchsia-500",
    "from-violet-500 via-purple-500 to-indigo-500",
    "from-cyan-500 via-teal-500 to-emerald-500",
    "from-amber-500 via-orange-500 to-red-500",
    "from-blue-500 via-indigo-500 to-violet-500",
  ];

  if (posts.length === 0) {
    return null;
  }

  return (
    <Card className="group relative overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-2xl transition-all duration-500 hover:shadow-2xl hover:shadow-slate-300/50 dark:hover:shadow-slate-800/50">
      {/* Decorative gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="relative pb-4 border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2.5 text-slate-900 dark:text-white">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-500/20 blur-lg rounded-full" />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Flame className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Trending Now
            </span>
          </h3>
          <Badge className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-0 px-3 py-1.5 text-xs font-bold shadow-lg shadow-violet-500/25 animate-pulse">
            <Zap className="w-3 h-3 mr-1" />
            Hot
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative p-0">
        <ul className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
          {posts.slice(0, 5).map((post, index) => (
            <li key={post.id} className="group/item">
              <Link href={`/blog/${post.id}`} aria-label={`Read: ${post.title}`}>
                <div className="relative px-5 py-4 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-indigo-50/50 dark:hover:from-violet-950/20 dark:hover:to-indigo-950/20">
                  {/* Hover indicator */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover/item:h-8 bg-gradient-to-b from-violet-500 to-indigo-600 rounded-r-full transition-all duration-300" />

                  <div className="flex gap-4 items-start">
                    {/* Animated rank badge */}
                    <div className="relative flex-shrink-0">
                      <div className={cn(
                        "w-11 h-11 rounded-xl bg-gradient-to-br text-white flex items-center justify-center font-bold text-lg shadow-lg transition-all duration-300 group-hover/item:scale-110 group-hover/item:rotate-3",
                        gradients[index]
                      )}>
                        {index + 1}
                      </div>
                      {index === 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                          <Crown className="w-3 h-3 text-yellow-900" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold line-clamp-2 text-slate-900 dark:text-white group-hover/item:text-violet-600 dark:group-hover/item:text-violet-400 transition-colors duration-300 mb-2 leading-tight">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        {post.user.name && (
                          <>
                            <span className="flex items-center gap-1.5">
                              <User className="w-3 h-3" />
                              <span className="truncate max-w-[80px]">{post.user.name}</span>
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                          </>
                        )}
                        <span className="flex items-center gap-1.5 font-medium text-violet-600 dark:text-violet-400">
                          <Eye className="w-3 h-3" />
                          {post.views.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover/item:text-violet-500 group-hover/item:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Newsletter Widget
// ============================================================================

function NewsletterWidget({ subscriberCount }: { subscriberCount?: number }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubscribed(true);
    setIsSubmitting(false);
  };

  // Format subscriber count intelligently
  const formatSubscribers = (count?: number) => {
    if (!count || count < 100) return null; // Don&apos;t show if too low
    if (count >= 10000) return `${Math.floor(count / 1000)}K+`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`;
    return `${count}+`;
  };

  const displayCount = formatSubscribers(subscriberCount);

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-violet-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-violet-200/50 dark:border-violet-800/50 shadow-xl shadow-violet-200/30 dark:shadow-violet-900/30 rounded-2xl transition-all duration-500 hover:shadow-2xl">
      {/* Animated background orbs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-violet-400/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <CardContent className="relative p-6">
        {isSubscribed ? (
          <div className="text-center py-4 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              You&apos;re In!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Welcome to our community. Check your inbox for a confirmation.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-5">
              <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-500 mb-4 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform duration-300">
                <Rocket className="w-7 h-7 text-white" />
                <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping opacity-75" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Stay Updated
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Get the latest articles and insights delivered to your inbox weekly.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label htmlFor="newsletter-email-enhanced" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <Input
                  id="newsletter-email-enhanced"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  aria-label="Email address"
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-violet-200/50 dark:border-violet-700/50 focus:border-violet-400 dark:focus:border-violet-500 focus:ring-violet-400/20 h-12 pl-4 pr-4 text-base transition-all duration-300"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 group/btn"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Subscribing...
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 group-hover/btn:rotate-12 transition-transform duration-300" />
                    Subscribe Now
                  </>
                )}
              </Button>
            </form>

            {displayCount && (
              <p className="text-xs text-center mt-4 text-slate-500 dark:text-slate-400">
                Join <span className="font-semibold text-violet-600 dark:text-violet-400">{displayCount}</span> subscribers. No spam, unsubscribe anytime.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Popular Topics Widget (Dynamic)
// ============================================================================

function PopularTopicsWidget({
  categories,
  statistics,
  onCategorySelect
}: {
  categories: { id: string; name: string; count: number }[];
  statistics?: BlogStatistics | null;
  onCategorySelect?: (categoryId: string) => void;
}) {
  // Combine actual categories with popular categories from statistics
  const getTopics = () => {
    // Filter out "all" and get actual categories with posts
    const actualCategories = categories
      .filter(c => c.id !== "all" && c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // If we have popular categories from statistics, merge them
    if (statistics?.popularCategories && statistics.popularCategories.length > 0) {
      const statsCategories = statistics.popularCategories.slice(0, 8);
      const merged = [...actualCategories];

      statsCategories.forEach(sc => {
        if (!merged.find(m => m.name.toLowerCase() === sc.category.toLowerCase())) {
          merged.push({ id: sc.category.toLowerCase(), name: sc.category, count: sc.count });
        }
      });

      return merged.slice(0, 8);
    }

    return actualCategories;
  };

  const topics = getTopics();

  // Don&apos;t render if no topics
  if (topics.length === 0) {
    return null;
  }

  const gradients = [
    "hover:from-rose-500/10 hover:to-pink-500/10 hover:border-rose-300 dark:hover:border-rose-700",
    "hover:from-violet-500/10 hover:to-purple-500/10 hover:border-violet-300 dark:hover:border-violet-700",
    "hover:from-cyan-500/10 hover:to-teal-500/10 hover:border-cyan-300 dark:hover:border-cyan-700",
    "hover:from-amber-500/10 hover:to-orange-500/10 hover:border-amber-300 dark:hover:border-amber-700",
    "hover:from-emerald-500/10 hover:to-green-500/10 hover:border-emerald-300 dark:hover:border-emerald-700",
    "hover:from-blue-500/10 hover:to-indigo-500/10 hover:border-blue-300 dark:hover:border-blue-700",
    "hover:from-fuchsia-500/10 hover:to-pink-500/10 hover:border-fuchsia-300 dark:hover:border-fuchsia-700",
    "hover:from-lime-500/10 hover:to-green-500/10 hover:border-lime-300 dark:hover:border-lime-700",
  ];

  return (
    <Card className="group relative overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-2xl transition-all duration-500 hover:shadow-2xl">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-full blur-2xl" />

      <CardHeader className="relative">
        <h3 className="font-bold flex items-center gap-2.5 text-slate-900 dark:text-white">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Hash className="w-5 h-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Popular Topics
          </span>
        </h3>
      </CardHeader>

      <CardContent className="relative">
        <div className="flex flex-wrap gap-2">
          {topics.map((topic, index) => (
            <button
              key={topic.id}
              onClick={() => onCategorySelect?.(topic.id)}
              className={cn(
                "group/tag relative px-3 py-2 rounded-xl text-sm font-medium",
                "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-800/50",
                "border border-slate-200/80 dark:border-slate-600/80",
                "text-slate-700 dark:text-slate-300",
                "transition-all duration-300 hover:scale-105 hover:shadow-md",
                gradients[index % gradients.length]
              )}
            >
              <span className="relative z-10 flex items-center gap-1.5">
                {topic.name}
                {topic.count > 0 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                    ({topic.count})
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Top Contributors Widget (Dynamic)
// ============================================================================

function TopContributorsWidget({
  posts,
  statistics
}: {
  posts: BlogPost[];
  statistics?: BlogStatistics | null;
}) {
  // Extract unique authors from posts
  const getAuthors = (): Author[] => {
    const authorMap = new Map<string, Author>();

    posts.forEach(post => {
      if (post.user.name) {
        const existing = authorMap.get(post.user.name);
        if (existing) {
          existing.articleCount += 1;
        } else {
          authorMap.set(post.user.name, {
            id: post.user.name.toLowerCase().replace(/\s+/g, "-"),
            name: post.user.name,
            image: post.user.image || null,
            articleCount: 1,
          });
        }
      }
    });

    return Array.from(authorMap.values())
      .sort((a, b) => b.articleCount - a.articleCount)
      .slice(0, 5);
  };

  const authors = getAuthors();

  // Don&apos;t render if no real authors
  if (authors.length === 0) {
    return null;
  }

  const avatarGradients = [
    "from-rose-500 to-pink-600",
    "from-violet-500 to-purple-600",
    "from-cyan-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-emerald-500 to-green-600",
  ];

  return (
    <Card className="group relative overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-2xl transition-all duration-500 hover:shadow-2xl">
      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-full blur-2xl" />

      <CardHeader className="relative">
        <h3 className="font-bold flex items-center gap-2.5 text-slate-900 dark:text-white">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Users className="w-5 h-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Top Contributors
          </span>
        </h3>
      </CardHeader>

      <CardContent className="relative space-y-3">
        {authors.map((author, index) => (
          <div
            key={author.id}
            className="group/author flex items-center gap-3 p-2 -mx-2 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-indigo-50/50 dark:hover:from-violet-950/20 dark:hover:to-indigo-950/20 cursor-pointer"
          >
            <div className="relative">
              <Avatar className="w-11 h-11 ring-2 ring-white dark:ring-slate-700 shadow-md group-hover/author:ring-violet-300 dark:group-hover/author:ring-violet-700 transition-all duration-300">
                {author.image ? (
                  <AvatarImage src={author.image} alt={author.name} />
                ) : null}
                <AvatarFallback className={cn(
                  "bg-gradient-to-br text-white font-bold",
                  avatarGradients[index % avatarGradients.length]
                )}>
                  {author.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {index === 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-700">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover/author:text-violet-600 dark:group-hover/author:text-violet-400 transition-colors">
                {author.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <BookMarked className="w-3 h-3" />
                {author.articleCount} {author.articleCount === 1 ? "article" : "articles"}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs font-medium border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300 opacity-0 group-hover/author:opacity-100"
            >
              View
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Sidebar Component
// ============================================================================

export function BlogSidebarEnhanced({
  trendingPosts,
  statistics,
  categories,
  onCategorySelect,
  className,
  variant = "desktop",
}: BlogSidebarProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Trending Posts */}
      <TrendingWidget posts={trendingPosts} />

      {/* Newsletter */}
      <NewsletterWidget subscriberCount={statistics?.totalReaders} />

      {/* Popular Topics - Dynamic */}
      <PopularTopicsWidget
        categories={categories}
        statistics={statistics}
        onCategorySelect={onCategorySelect}
      />

      {/* Top Contributors - Dynamic from actual posts */}
      <TopContributorsWidget
        posts={trendingPosts}
        statistics={statistics}
      />
    </div>
  );
}

export { TrendingWidget, NewsletterWidget, PopularTopicsWidget, TopContributorsWidget };
