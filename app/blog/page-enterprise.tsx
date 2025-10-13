"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Search, TrendingUp, Clock, Eye, MessageCircle, ChevronRight, ChevronDown,
  Menu, Flame, Calendar, BookOpen, Filter, Grid3x3, List, Bookmark,
  Share2, X, SlidersHorizontal, Tag, User, Star, ThumbsUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// ============================================================================
// TYPES
// ============================================================================

interface Post {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  published: boolean | null;
  category: string | null;
  createdAt: string;
  views: number;
  comments: Array<{ id: string }>;
  user?: {
    name: string | null;
    image: string | null;
  };
  readingTime?: number;
  likes?: number;
  bookmarked?: boolean;
}

type ViewMode = 'grid' | 'list' | 'compact';
type SortBy = 'recent' | 'popular' | 'trending' | 'most-commented';

// ============================================================================
// ENHANCED POST CARD COMPONENTS
// ============================================================================

const EnhancedGridCard = ({ post }: { post: Post }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/blog/${post.id}`}>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-md hover:shadow-2xl transition-all duration-300 h-[480px]"
      >
        {/* Image Section */}
        <div className="relative h-52 overflow-hidden">
          <Image
            src={post.imageUrl || '/placeholder.svg'}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Category Badge */}
          {post.category && (
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 text-xs font-semibold bg-purple-600 text-white rounded-full backdrop-blur-sm">
                {post.category}
              </span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                // Handle bookmark
              }}
              className="p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
            >
              <Bookmark className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                // Handle share
              }}
              className="p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Reading Time Badge */}
          <div className="absolute bottom-3 right-3">
            <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
              <Clock className="w-3 h-3 text-white" />
              <span className="text-xs text-white font-medium">
                {post.readingTime || 5} min
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 flex flex-col h-[calc(480px-208px)]">
          {/* Author Info */}
          {post.user && (
            <div className="flex items-center gap-2 mb-3">
              <Image
                src={post.user.image || '/default-avatar.png'}
                alt={post.user.name || 'Author'}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {post.user.name}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {post.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 flex-grow">
            {post.description?.replace(/<[^>]*>/g, '') || 'Discover insights and knowledge in this article.'}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{post.views}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>{post.comments?.length || 0}</span>
              </div>
              {post.likes !== undefined && (
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  <span>{post.likes}</span>
                </div>
              )}
            </div>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </motion.article>
    </Link>
  );
};

const EnhancedListCard = ({ post }: { post: Post }) => {
  return (
    <Link href={`/blog/${post.id}`}>
      <motion.article
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 8 }}
        transition={{ duration: 0.3 }}
        className="group bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col md:flex-row"
      >
        {/* Image Section */}
        <div className="relative w-full md:w-80 h-48 md:h-auto flex-shrink-0">
          <Image
            src={post.imageUrl || '/placeholder.svg'}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 320px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />

          {post.category && (
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 text-xs font-semibold bg-purple-600 text-white rounded-full">
                {post.category}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Author & Date */}
          {post.user && (
            <div className="flex items-center gap-2 mb-3">
              <Image
                src={post.user.image || '/default-avatar.png'}
                alt={post.user.name || 'Author'}
                width={32}
                height={32}
                className="rounded-full"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {post.user.name}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {post.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 flex-grow">
            {post.description?.replace(/<[^>]*>/g, '') || 'Discover insights and knowledge in this article.'}
          </p>

          {/* Stats & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.readingTime || 5} min</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{post.views}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>{post.comments?.length || 0}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Bookmark className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
};

// ============================================================================
// FILTER SIDEBAR
// ============================================================================

const FilterSidebar = ({
  categories,
  selectedCategories,
  onCategoryToggle,
  onReset,
  isMobileOpen,
  onClose,
}: {
  categories: string[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  onReset: () => void;
  isMobileOpen: boolean;
  onClose: () => void;
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['categories']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const FilterContent = () => (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h3>
        <button
          onClick={onReset}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Reset All
        </button>
      </div>

      {/* Categories */}
      <div>
        <button
          onClick={() => toggleSection('categories')}
          className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-900 dark:text-white"
        >
          <span>Categories</span>
          {expandedSections.has('categories') ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.has('categories') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 mt-2"
            >
              {categories.filter(cat => cat !== 'All').map((category) => (
                <label key={category} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => onCategoryToggle(category)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {category}
                  </span>
                </label>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reading Time */}
      <div>
        <button
          onClick={() => toggleSection('reading-time')}
          className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-900 dark:text-white"
        >
          <span>Reading Time</span>
          {expandedSections.has('reading-time') ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.has('reading-time') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 mt-2"
            >
              {['< 5 min', '5-10 min', '10-15 min', '15+ min'].map((time) => (
                <label key={time} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {time}
                  </span>
                </label>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 h-screen sticky top-0 overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <FilterContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-bold">Filters</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// ============================================================================
// MAIN BLOG PAGE COMPONENT
// ============================================================================

export default function EnterpriseBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/posts/public');
        const data = await response.json();

        if (data.success && Array.isArray(data.posts)) {
          setPosts(data.posts);

          // Get unique categories
          const postCategories: string[] = Array.from(
            new Set(
              data.posts
                .map((post: Post) => post.category)
                .filter((cat: string | null): cat is string => Boolean(cat))
            )
          );
          setCategories(['All', ...postCategories]);
        } else {
          setError("Failed to load posts");
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filter and sort posts
  const filteredAndSortedPosts = posts
    .filter(post => {
      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(post.category || '')) {
        return false;
      }

      // Search filter
      if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !post.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.views - a.views;
        case 'trending':
          return b.views - a.views; // You could add more complex logic here
        case 'most-commented':
          return (b.comments?.length || 0) - (a.comments?.length || 0);
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md mx-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Failed to Load Posts
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Filter Sidebar */}
        <FilterSidebar
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          onReset={handleResetFilters}
          isMobileOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Title */}
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 dark:from-purple-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Discover Articles
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {filteredAndSortedPosts.length} articles available
                  </p>
                </div>

                {/* Search and Controls */}
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative flex-1 md:w-64">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="recent">Recent</option>
                    <option value="popular">Popular</option>
                    <option value="trending">Trending</option>
                    <option value="most-commented">Most Commented</option>
                  </select>

                  {/* View Mode */}
                  <div className="hidden md:flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="lg:hidden p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {selectedCategories.length > 0 && (
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Filters:</span>
                  {selectedCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      <span>{category}</span>
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                  <button
                    onClick={handleResetFilters}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Posts Grid/List */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedPosts.map((post) => (
                  <EnhancedGridCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredAndSortedPosts.map((post) => (
                  <EnhancedListCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {filteredAndSortedPosts.length === 0 && (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No articles found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Try adjusting your filters or search query
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
