"use client";

import { useEffect, useState, useRef } from "react";
import { Search, TrendingUp, Clock, Eye, MessageCircle, ChevronRight, ChevronDown, Menu, Flame, Calendar } from "lucide-react";
import MyPostCard from "./blog-card";
import CompactCard from "./components/compact-card";
import WideCard from "./components/wide-card";
import Link from "next/link";

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
  };
}

interface CardPost {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  published: boolean | null;
  category: string | null;
  createdAt: string;
  comments: {
    length: number;
  };
  views?: number;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [showTabMenu, setShowTabMenu] = useState(false);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [excitingPosts, setExcitingPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [visibleTabs, setVisibleTabs] = useState<string[]>([]);
  const [hiddenTabs, setHiddenTabs] = useState<string[]>([]);

  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState('3.5rem');
  const [contentTopPadding, setContentTopPadding] = useState('6.75rem');

  // Calculate which tabs fit in the available space
  const calculateVisibleTabs = () => {
    if (!tabsContainerRef.current || categories.length === 0) return;

    const container = tabsContainerRef.current;
    const containerWidth = container.clientWidth;
    const moreButtonWidth = 120; // Approximate width of "More" button
    const availableWidth = containerWidth - moreButtonWidth;

    let totalWidth = 0;
    let visibleCount = 0;

    // Calculate approximate width for each tab (rough estimation)
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      // Approximate tab width: padding (24px) + text width + border
      const estimatedWidth = category.length * 8 + 48; // 8px per character + padding
      
      if (totalWidth + estimatedWidth <= availableWidth) {
        totalWidth += estimatedWidth;
        visibleCount++;
      } else {
        break;
      }
    }

    // If all tabs fit, show all and no "More" button
    if (visibleCount >= categories.length) {
      setVisibleTabs(categories);
      setHiddenTabs([]);
    } else {
      // Ensure at least 2 tabs are visible, rest go to "More"
      const minVisible = Math.max(2, Math.min(visibleCount, categories.length - 1));
      setVisibleTabs(categories.slice(0, minVisible));
      setHiddenTabs(categories.slice(minVisible));
    }
  };

  // Handle responsive header height and tab calculation
  useEffect(() => {
    const updateLayout = () => {
      const isSmallScreen = window.innerWidth < 640; // sm breakpoint
      const newHeaderHeight = isSmallScreen ? '3.5rem' : '4rem';
      setHeaderHeight(newHeaderHeight);
      // Tab height is approximately 3rem (py-4 + text), so total is header + tabs with minimal gap
      setContentTopPadding(isSmallScreen ? '5.5rem' : '6rem');
      
      // Recalculate visible tabs on resize
      setTimeout(calculateVisibleTabs, 100); // Small delay to ensure DOM updates
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [categories]);

  // Fetch posts from API route
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/posts');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.posts)) {
          setPosts(data.posts);
          
          // Sort by date for recent posts
          const sortedByDate = [...data.posts].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setRecentPosts(sortedByDate.slice(0, 6));
          
          // Sort by views for popular posts
          const sortedByViews = [...data.posts].sort((a, b) => b.views - a.views);
          setPopularPosts(sortedByViews.slice(0, 5));
          
          // Mix of high views and recent for exciting posts
          const exciting = [...data.posts]
            .filter(post => post.views > 1000)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 4);
          setExcitingPosts(exciting);
          
          // Get unique categories from posts
          const postCategories = Array.from(new Set(data.posts.map((post: Post) => post.category).filter(Boolean)));
          
          // Combine with additional categories for demonstration
          const additionalCategories = [
            "Data Science",
            "Mobile Development", 
            "DevOps",
            "Blockchain",
            "Cloud Computing"
          ];
          
          const allCategories = [
            "All", 
            ...postCategories,
            ...additionalCategories.filter(cat => !postCategories.includes(cat))
          ];
          
          setCategories(allCategories);
          
          // Initial tab calculation will be handled by useEffect
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

  // Recalculate visible tabs when categories change
  useEffect(() => {
    if (categories.length > 0) {
      setTimeout(calculateVisibleTabs, 200); // Allow time for DOM to update
    }
  }, [categories]);

  // Transform posts for card component
  const transformPostForCard = (post: Post): CardPost => ({
    id: post.id,
    title: post.title,
    description: post.description,
    imageUrl: post.imageUrl,
    published: post.published,
    category: post.category,
    createdAt: post.createdAt,
    views: post.views,
    comments: {
      length: post.comments?.length || 0
    }
  });

  // Get posts for active category
  const getPostsByCategory = (category: string) => {
    if (category === "All") return posts;
    return posts.filter(post => post.category === category);
  };

  // Scroll to category section
  const scrollToCategory = (category: string) => {
    setActiveTab(category);
    if (category === "All") {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(`category-${category.replace(/\s+/g, '-').toLowerCase()}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle tab selection from dropdown
  const handleTabSelect = (category: string) => {
    setActiveTab(category);
    setShowTabMenu(false);
    scrollToCategory(category);
  };

  // Update active tab based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = categories.filter(cat => cat !== "All").map(category => {
        const element = document.getElementById(`category-${category.replace(/\s+/g, '-').toLowerCase()}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          return {
            category,
            top: rect.top,
            inView: rect.top <= 200 && rect.bottom >= 200
          };
        }
        return null;
      }).filter(Boolean);

      const currentSection = sections.find(section => section?.inView);
      if (currentSection) {
        setActiveTab(currentSection.category);
      } else if (window.scrollY < 500) {
        setActiveTab("All");
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Category Tabs - Positioned to connect seamlessly with header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed left-0 right-0 z-40" style={{top: headerHeight}}>
        <div className="w-full px-2 sm:px-3 md:px-4">
          <div ref={tabsContainerRef} className="flex items-center justify-between">
            <div ref={tabsRef} className="flex items-center space-x-1 overflow-hidden">
              {visibleTabs.map((category) => (
                <button
                  key={category}
                  onClick={() => scrollToCategory(category)}
                  className={`px-3 sm:px-4 md:px-6 py-3 md:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === category
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {hiddenTabs.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowTabMenu(!showTabMenu)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Menu className="w-4 h-4 mr-1" />
                  More
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showTabMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showTabMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {hiddenTabs.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleTabSelect(category)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-full py-2" style={{paddingTop: contentTopPadding}}>
        {/* 4-Column Layout for Main Page */}
        <section id="main-section" className="mb-8 md:mb-16 px-2 sm:px-3 md:px-4">
          <div className="grid grid-cols-12 gap-3 md:gap-4 lg:gap-6 xl:gap-8">
            {/* Left Column - Recent Posts */}
            <div className="col-span-12 md:col-span-4 lg:col-span-3 md:border-r border-gray-200 dark:border-gray-700 pr-3 md:pr-4 lg:pr-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
                <div className="flex items-center mb-4 md:mb-6 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-100 dark:border-purple-800/30">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 mr-3">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text">Recent Posts</h3>
                </div>
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.id}`} className="block group">
                      <div className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 line-clamp-2 mb-2">
                          {post.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          <span>{post.views} views</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle Section - Main Content */}
            <div className="col-span-12 md:col-span-8 lg:col-span-6 px-3 md:px-4 lg:px-6">
              <div className="mb-6 md:mb-8 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-100 via-blue-100 to-indigo-100 dark:from-purple-900/10 dark:via-blue-900/10 dark:to-indigo-900/10 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative p-6 md:p-8 rounded-2xl bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/30">
                  <div className="flex items-center mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 mr-4">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z\" />
                      </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400 text-transparent bg-clip-text">
                      Featured Articles
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 ml-12">
                    Browse through our most popular content
                  </p>
                </div>
              </div>

              {/* Featured Posts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {posts.slice(0, 6).map((post) => (
                  <CompactCard 
                    key={post.id}
                    post={transformPostForCard(post)} 
                  />
                ))}
              </div>
            </div>

            {/* Right Column - Popular & Trending */}
            <div className="col-span-12 md:col-span-12 lg:col-span-3 border-l border-gray-200 dark:border-gray-700 pl-3 md:pl-4 lg:pl-6 md:border-l-0 lg:border-l md:mt-8 lg:mt-0">
              <div className="space-y-4 md:space-y-6">
                {/* Most Viewed */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
                  <div className="flex items-center mb-4 md:mb-6 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800/30">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 mr-3">
                      <Eye className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text">Most Viewed</h3>
                  </div>
                  <div className="space-y-4">
                    {popularPosts.map((post, index) => (
                      <Link key={post.id} href={`/blog/${post.id}`} className="block group">
                        <div className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0">
                          <div className="flex items-start">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold flex items-center justify-center mr-3 mt-0.5">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 mb-1">
                                {post.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {post.views} views
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Trending */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
                  <div className="flex items-center mb-4 md:mb-6 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-100 dark:border-orange-800/30">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 mr-3">
                      <Flame className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 text-transparent bg-clip-text">Trending</h3>
                  </div>
                  <div className="space-y-4">
                    {excitingPosts.map((post) => (
                      <Link key={post.id} href={`/blog/${post.id}`} className="block group">
                        <div className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 line-clamp-2 mb-2">
                            {post.title}
                          </h4>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            <span>{post.views} views</span>
                            <span className="mx-1">•</span>
                            <span>{post.comments.length} comments</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Category Sections - Single Column Layout */}
        <div className="max-w-full px-2 sm:px-3 md:px-4">
          {categories.filter(cat => cat !== "All").map((category) => {
            const categoryPosts = getPostsByCategory(category);
            
            return (
              <section 
                key={category} 
                id={`category-${category.replace(/\s+/g, '-').toLowerCase()}`}
                className="scroll-mt-20 sm:scroll-mt-24 mb-12 md:mb-16 lg:mb-20"
              >
                {/* Category Header with Separator Line */}
                <div className="relative mb-6 md:mb-8 lg:mb-12">
                  <div className="h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-60"></div>
                  <div className="absolute inset-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-40 blur-sm"></div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 lg:mb-12 gap-4 sm:gap-0 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/10 dark:via-purple-900/10 dark:to-pink-900/10 rounded-2xl blur-xl opacity-40 -z-10"></div>
                  <div className="relative">
                    <div className="flex items-center mb-2 lg:mb-3">
                      <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mr-4 shadow-lg">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z\" />
                        </svg>
                      </div>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
                        {category}
                      </h2>
                    </div>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 ml-12 sm:ml-16">
                      {categoryPosts.length > 0 
                        ? `${categoryPosts.length} article${categoryPosts.length !== 1 ? 's' : ''} in this category`
                        : 'Explore articles in this category'
                      }
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-30"></div>
                    <span className="relative px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/40 dark:via-purple-900/40 dark:to-pink-900/40 text-indigo-700 dark:text-indigo-300 text-sm sm:text-base font-bold rounded-full border border-indigo-200 dark:border-indigo-700/50 shadow-lg">
                      {categoryPosts.length} articles
                    </span>
                  </div>
                </div>
                
                {/* Wide Cards for Category Pages */}
                {categoryPosts.length > 0 ? (
                  <div className="space-y-8">
                    {categoryPosts.map((post) => (
                      <WideCard 
                        key={post.id}
                        post={transformPostForCard(post)} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12 lg:py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 md:mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-400 dark:to-gray-200 text-transparent bg-clip-text mb-2">
                      No articles yet
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 md:mb-6 px-4">
                      Articles in the {category} category will appear here
                    </p>
                    <button 
                      onClick={() => scrollToCategory("All")}
                      className="px-4 py-2 sm:px-6 sm:py-3 bg-purple-600 text-white text-sm sm:text-base rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Browse All Articles
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}