"use client";

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { logger } from '@/lib/logger';
import {
  Newspaper,
  AlertCircle,
  Brain,
  Rocket,
  Zap,
  Sparkles,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import redesigned components
import { AINewsNavbar } from './components/AINewsNavbar';
import { AINewsHero } from './components/AINewsHero';
import { AINewsFilterBar } from './components/AINewsFilterBar';
import { NewsCard } from './components/NewsCard';
import { AINewsSidebar } from './components/AINewsSidebar';

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

interface NewsCategory {
  name: string;
  count: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export default function AINewsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImportance, setSelectedImportance] = useState<string>('all');
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch news from API
  const fetchNews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/sam/ai-news');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data?.error?.message ?? `Failed to fetch news (${response.status})`;
        throw new Error(message);
      }

      setNewsArticles(data.news || []);
      setLastUpdated(new Date());
    } catch (fetchError: unknown) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Failed to load news. Please try again later.';
      logger.error('Error fetching news:', fetchError);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch news on mount and when auto-refresh is enabled
  useEffect(() => {
    fetchNews();

    if (isAutoRefresh) {
      const interval = setInterval(fetchNews, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAutoRefresh, fetchNews]);

  // Category mappings for display
  const categoryMappings: Record<string, string> = {
    'breakthrough': 'Breaking',
    'research': 'Research',
    'industry': 'Industry',
    'product-launch': 'Technology',
    'technology': 'Technology',
    'education': 'Education',
    'policy': 'Policy',
    'ethics': 'Ethics',
    'startup': 'Startup',
    'investment': 'Investment',
    'partnership': 'Partnership'
  };

  const newsCategories: NewsCategory[] = [
    {
      name: 'Breaking',
      count: 23,
      color: 'text-rose-400',
      icon: AlertCircle,
      description: 'Latest breaking news and announcements'
    },
    {
      name: 'Research',
      count: 156,
      color: 'text-blue-400',
      icon: Brain,
      description: 'Academic studies and research findings'
    },
    {
      name: 'Industry',
      count: 89,
      color: 'text-emerald-400',
      icon: Rocket,
      description: 'Business and industry developments'
    },
    {
      name: 'Technology',
      count: 234,
      color: 'text-violet-400',
      icon: Zap,
      description: 'Technical innovations and advancements'
    },
    {
      name: 'Education',
      count: 178,
      color: 'text-amber-400',
      icon: Sparkles,
      description: 'Educational applications and implementations'
    },
    {
      name: 'Policy',
      count: 67,
      color: 'text-orange-400',
      icon: Globe,
      description: 'Regulations and policy changes'
    }
  ];

  const importanceOptions = [
    { value: 'all', label: 'All Importance' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const trendingTopics = [
    'GPT-5',
    'AI Education',
    'Machine Learning',
    'Neural Networks',
    'EdTech'
  ];

  // Calculate stats
  const stats = {
    totalArticles: newsArticles.length,
    breakingNews: newsArticles.filter(a => a.category === 'breakthrough').length,
    highImpact: newsArticles.filter(a => a.impactLevel === 'critical' || a.impactLevel === 'high').length,
    sources: new Set(newsArticles.map(a => a.source.name)).size
  };

  // Calculate actual category counts from fetched articles
  const categoryCounts = newsArticles.reduce((acc, article) => {
    const displayCategory = categoryMappings[article.category] || article.category;
    acc[displayCategory] = (acc[displayCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter articles
  const filteredArticles = newsArticles.filter(article => {
    const displayCategory = categoryMappings[article.category] || article.category;
    const matchesCategory = selectedCategory === 'all' || displayCategory === selectedCategory;
    const matchesImportance = selectedImportance === 'all' || article.impactLevel === selectedImportance.toLowerCase();
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesImportance && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-slate-900 focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Floating Navbar - Appears on scroll */}
      <AINewsNavbar />

      {/* Hero Section */}
      <AINewsHero stats={stats} />

      {/* Filter Bar - Sticky */}
      <AINewsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedImportance={selectedImportance}
        onImportanceChange={setSelectedImportance}
        categories={newsCategories.map(c => ({ name: c.name, value: c.name.toLowerCase() }))}
        importanceOptions={importanceOptions}
        lastUpdated={lastUpdated}
        isAutoRefresh={isAutoRefresh}
        onAutoRefreshToggle={() => setIsAutoRefresh(!isAutoRefresh)}
        onRefresh={fetchNews}
        isLoading={isLoading}
      />

      {/* Main Content */}
      <main id="main-content" className="bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Sidebar - Desktop */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24">
                <AINewsSidebar
                  categories={newsCategories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  totalArticles={newsArticles.length}
                  trendingTopics={trendingTopics}
                  categoryCounts={categoryCounts}
                />
              </div>
            </div>

            {/* News Feed */}
            <div className="lg:col-span-9">
              {/* Mobile Category Pills */}
              <div className="lg:hidden mb-6 overflow-x-auto pb-2">
                <div className="flex gap-2 min-w-max">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    All
                  </button>
                  {newsCategories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        selectedCategory === category.name
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results Count */}
              {!isLoading && !error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between mb-6"
                >
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredArticles.length}</span> articles
                    {selectedCategory !== 'all' && (
                      <span> in <span className="font-semibold text-slate-900 dark:text-white">{selectedCategory}</span></span>
                    )}
                  </p>
                </motion.div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Loading latest AI news...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20 px-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error loading news</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-center mb-6 max-w-md">{error}</p>
                  <Button
                    onClick={fetchNews}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl"
                  >
                    Try Again
                  </Button>
                </motion.div>
              )}

              {/* News Articles */}
              {!isLoading && !error && (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {filteredArticles.map((article, index) => (
                      <NewsCard
                        key={article.articleId}
                        article={article}
                        index={index}
                        categoryMapping={categoryMappings}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && filteredArticles.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20 px-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                    <Newspaper className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No articles found</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                    Try adjusting your filters or search query to find more articles
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
