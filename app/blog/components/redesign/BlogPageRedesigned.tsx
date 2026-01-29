"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, Search, TrendingUp, Clock, Star,
  ChevronUp, Grid3X3, List, Newspaper,
  GitBranch, Map, Menu, X
} from 'lucide-react';

// Import all our redesigned components
import { HeroSection } from './hero/HeroSection';
import { AnimatedBackground } from './hero/AnimatedBackground';
import { CategoryNav } from './navigation/CategoryNav';
import { FilterPanel } from './navigation/FilterPanel';
import { ViewModeSwitcher, type ViewMode } from './navigation/ViewModeSwitcher';
import { InfiniteScrollSection } from './sections/InfiniteScrollSection';
import { FeaturedCard } from './cards/FeaturedCard';
import { StandardCard } from './cards/StandardCard';
import { CompactCard } from './cards/CompactCard';
 

// Type definitions
interface Post {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  createdAt: string;
  views: number;
  readingTime?: string;
  user?: {
    name: string | null;
    image?: string | null;
  };
  comments?: { length: number };
  tags?: string[];
}

interface Category {
  id: string;
  name: string;
  count: number;
  trending?: boolean;
}

interface BlogPageProps {
  initialPosts?: Post[];
  featuredPosts?: Post[];
  categories?: Category[];
  trendingPosts?: Post[];
}

export function BlogPageRedesigned({
  initialPosts = [],
  featuredPosts = [],
  categories = [],
  trendingPosts = []
}: BlogPageProps) {
  // State management
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeCategory, setActiveCategory] = useState('all');
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [filters, setFilters] = useState<{
    dateRange?: 'today' | 'week' | 'month' | 'year' | 'all';
    sortBy?: 'latest' | 'popular' | 'trending' | 'mostCommented';
    authors?: string[];
    tags?: string[];
  }>({
    dateRange: 'all',
    sortBy: 'latest'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(initialPosts.length || 0);
  const [feedKey, setFeedKey] = useState<string>('init');
  const [availableAuthors, setAvailableAuthors] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  

  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  // Mock categories if not provided
  const defaultCategories: Category[] = useMemo(() => {
    // Prefer dynamically fetched categories
    const fromAPI = availableCategories && availableCategories.length > 0
      ? availableCategories
      : (categories && categories.length > 0 ? categories : []);

    if (fromAPI.length > 0) {
      // Filter out any existing 'all' category to prevent duplicates
      const filteredCategories = fromAPI.filter(c => c.id !== 'all' && c.name !== 'All');
      const total = filteredCategories.reduce((sum, c) => sum + (c.count || 0), 0);
      // Mark top 2 as trending for UX highlight
      const sorted = [...filteredCategories].sort((a, b) => (b.count || 0) - (a.count || 0));
      const trendingNames = new Set(sorted.slice(0, 2).map(c => c.name));
      const normalized = filteredCategories.map(c => ({ ...c, trending: trendingNames.has(c.name) }));
      return [{ id: 'all', name: 'All', count: total }, ...normalized];
    }

    // Fallback static
    return [
      { id: 'all', name: 'All', count: 156 },
      { id: 'web-development', name: 'Web Development', count: 45, trending: true },
      { id: 'ai-ml', name: 'AI & ML', count: 32 },
      { id: 'design', name: 'Design', count: 28 },
      { id: 'database', name: 'Database', count: 21 },
      { id: 'cloud-computing', name: 'Cloud Computing', count: 18 },
      { id: 'security', name: 'Security', count: 12 }
    ];
  }, [availableCategories, categories]);

  const defaultCategoriesRef = useRef(defaultCategories);
  defaultCategoriesRef.current = defaultCategories;

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // URL sync
    const params = new URLSearchParams(window.location.search);
    if (query) params.set('q', query); else params.delete('q');
    router.push(`/blog${params.toString() ? `?${params.toString()}` : ''}`);
  }, [router]);

  // Load more posts for infinite scroll
  const loadMorePosts = useCallback(async (page: number): Promise<Post[]> => {
    // Build query params
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '9');
    if (searchQuery) params.set('q', searchQuery);
    // Single category from activeCategory id
    const selectedCategoryName = defaultCategories.find(c => c.id === activeCategory)?.name;
    if (selectedCategoryName && selectedCategoryName !== 'All') {
      params.set('category', selectedCategoryName);
    }
    if (filters.sortBy) params.set('sort', filters.sortBy);
    if (filters.dateRange) params.set('dateRange', filters.dateRange);
    if (filters.authors && filters.authors.length > 0) params.set('authors', filters.authors.join(','));
    if (filters.tags && filters.tags.length > 0) params.set('tags', filters.tags.join(','));

    const res = await fetch(`/api/public/posts?${params.toString()}`);
    const data = await res.json();
    if (res.ok && data?.data) {
      if (typeof data.data.totalCount === 'number') {
        setTotalCount(data.data.totalCount);
      }
      return data.data.posts as Post[];
    }
    return [];
  }, [searchQuery, activeCategory, filters.sortBy, filters.dateRange, filters.authors, filters.tags, defaultCategories]);

  // Filter posts based on category (by name) and search
  const filteredPosts = posts.filter(post => {
    const selectedName = defaultCategories.find(c => c.id === activeCategory)?.name;
    if (activeCategory !== 'all' && selectedName && post.category !== selectedName) return false;
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filters.authors && filters.authors.length > 0) {
      if (!post.user?.name || !filters.authors.includes(post.user.name)) return false;
    }
    if (filters.tags && filters.tags.length > 0) {
      const postTags = (post as any).tags as string[] | undefined;
      if (!postTags || !filters.tags.some(t => postTags.includes(t))) return false;
    }
    return true;
  });

  // Initialize from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(searchParamsRef.current?.toString());
    const q = params.get('q') || '';
    const cat = params.get('category') || '';
    const sort = params.get('sort') as 'latest' | 'popular' | 'trending' | 'mostCommented' | undefined;
    const dateRange = params.get('dateRange') as 'today' | 'week' | 'month' | 'year' | 'all' | undefined;
    const authors = params.get('authors');
    const tags = params.get('tags');

    if (q) setSearchQuery(q);
    if (sort) setFilters(prev => ({ ...prev, sortBy: sort }));
    if (dateRange) setFilters(prev => ({ ...prev, dateRange }));
    if (authors) setFilters(prev => ({ ...prev, authors: authors.split(',') }));
    if (tags) setFilters(prev => ({ ...prev, tags: tags.split(',') }));
    if (cat) {
      const id = defaultCategoriesRef.current.find(c => c.name === cat)?.id || 'all';
      setActiveCategory(id);
    }
  }, []);

  // Fetch first page when filters/search/category change
  useEffect(() => {
    const fetchFirst = async () => {
      const firstPage = await loadMorePosts(1);
      setPosts(firstPage);
      setFeedKey(
        JSON.stringify({
          q: searchQuery,
          cat: activeCategory,
          sort: filters.sortBy,
          dr: filters.dateRange
        })
      );
      setInitialLoaded(true);
    };
    fetchFirst().catch(() => {});
  }, [searchQuery, activeCategory, filters.sortBy, filters.dateRange, filters.authors, filters.tags, loadMorePosts]);

  // Fetch available authors/tags for filter UI
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch('/api/public/posts/filters');
        const data = await res.json();
        if (res.ok && data?.data) {
          if (Array.isArray(data.data.authors)) setAvailableAuthors(data.data.authors);
          if (Array.isArray(data.data.tags)) setAvailableTags(data.data.tags);
          if (Array.isArray(data.data.categories)) {
            const mapped: Category[] = data.data.categories.map((c: any) => ({
              id: String(c.name || 'uncategorized').toLowerCase().replace(/\s+/g, '-'),
              name: c.name || 'Uncategorized',
              count: Number(c.count || 0),
            }));
            setAvailableCategories(mapped);
          }
        }
      } catch {}
    };
    fetchFilters();
  }, []);

  // Analytics tracker
  const track = useCallback(async (event: string, properties?: Record<string, any>) => {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, properties, page: 'blog' })
      });
    } catch {}
  }, []);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    const name = defaultCategories.find(c => c.id === categoryId)?.name;
    track('category_change', { categoryId, categoryName: name });
  }, [defaultCategories, track]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    track('view_mode_change', { mode });
  }, [track]);

  const onFiltersChangeTracked = useCallback((next: typeof filters) => {
    setFilters(next);
    track('filters_apply', next as any);
  }, [track]);

  

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <AnimatedBackground />
      </div>

      {/* Sticky Header Bar */}
      <motion.header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-gray-200 dark:border-gray-800'
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo / Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Blog
              </h1>
            </div>

            {/* Desktop Navigation Controls */}
            <div className="hidden lg:flex items-center gap-4">
              <ViewModeSwitcher
                currentMode={viewMode}
                onModeChange={handleViewModeChange}
                variant="compact"
              />

              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
                {Object.keys(filters).length > 2 && (
                  <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded text-xs font-semibold">
                    {Object.keys(filters).length - 2}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 lg:hidden overflow-y-auto"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold">Menu</h2>
                      <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">View Mode</h3>
                        <ViewModeSwitcher
                          currentMode={viewMode}
                          onModeChange={handleViewModeChange}
                          variant="expanded"
                        />
                      </div>

                      <button
                        onClick={() => {
                          setIsFilterOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium"
                      >
                        <Filter className="w-4 h-4" />
                        Open Filters
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <HeroSection
          featuredPosts={featuredPosts.length > 0 ? featuredPosts : posts.slice(0, 3)}
          onSearch={handleSearch}
        />

        {/* Category Navigation */}
        <section className="container mx-auto px-4 py-8">
          <CategoryNav
            categories={defaultCategories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            variant="pills"
          />
        </section>

        {/* Quick Stats Bar */}
        <section className="container mx-auto px-4 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Trending</p>
                  <p className="text-xl font-bold">12 Posts</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">New Today</p>
                  <p className="text-xl font-bold">5 Posts</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Star className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Featured</p>
                  <p className="text-xl font-bold">3 Posts</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Search className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Posts</p>
                  <p className="text-xl font-bold">{totalCount}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Content Area with Sidebar */}
        <section className="container mx-auto px-4 pb-20">
          <div className="flex gap-8">
            {/* Main Posts Section with Infinite Scroll */}
            <div className={viewMode === 'grid' ? 'flex-1' : 'w-full'}>
              <InfiniteScrollSection
                key={feedKey}
                initialPosts={(initialLoaded ? filteredPosts : posts)}
                viewMode={viewMode}
                loadMorePosts={loadMorePosts}
                hasMore={true}
              />
              {/* Pagination removed to restore original infinite-scroll design */}
            </div>

            {/* Trending Sidebar - Static but only visible in grid mode on desktop */}
            {viewMode === 'grid' && (
              <aside className="hidden xl:block w-80 flex-shrink-0">
                <div className="sticky top-24">
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-red-500" />
                        Trending Now
                      </h3>
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-semibold animate-pulse">
                        LIVE
                      </span>
                    </div>
                    <div className="space-y-3">
                      {(trendingPosts.length > 0 ? trendingPosts : posts.slice(0, 5)).map((post, index) => (
                        <CompactCard
                          key={post.id}
                          post={post}
                          variant="minimal"
                          index={index}
                        />
                      ))}
                    </div>

                    {/* View All Trending Link */}
                    <motion.button
                      whileHover={{ x: 3 }}
                      className="mt-4 w-full text-center py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                    >
                      View All Trending →
                    </motion.button>
                  </motion.div>
                </div>
              </aside>
            )}
          </div>
        </section>
      </main>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFiltersChange={onFiltersChangeTracked}
        availableAuthors={availableAuthors}
        availableTags={availableTags}
        variant="slide"
      />

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {isScrolled && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 left-8 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow z-40"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
