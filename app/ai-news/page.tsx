"use client"

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, 
  Clock, 
  TrendingUp,
  Eye,
  Share,
  Bookmark,
  ExternalLink,
  Filter,
  Search,
  Bell,
  Globe,
  Zap,
  Star,
  MessageSquare,
  ThumbsUp,
  Calendar,
  Tag,
  Users,
  Brain,
  Sparkles,
  Rocket,
  AlertCircle,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  Download,
  MoreHorizontal,
  Award,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
  // Ranking properties
  rankingScore?: number;
  trendingStatus?: 'hot' | 'rising' | 'steady' | 'new';
  qualityBadges?: string[];
}

interface NewsCategory {
  name: string;
  count: number;
  color: string;
  icon: any;
  description: string;
}

export default function AINewsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImportance, setSelectedImportance] = useState<string>('all');
  const [isAutoRefresh, setIsAutoRefresh] = useState(false); // Manual refresh by default
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useRealData, setUseRealData] = useState(false); // Toggle for real/demo data

  // Fetch news from API
  const fetchNews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Set environment variable for real data if toggled
      if (useRealData && typeof window !== 'undefined') {
        localStorage.setItem('useRealNews', 'true');
      } else if (typeof window !== 'undefined') {
        localStorage.removeItem('useRealNews');
      }
      
      const response = await fetch(`/api/sam/ai-news${useRealData ? '?realtime=true' : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      
      const data = await response.json();
      setNewsArticles(data.news || []);
      setLastUpdated(new Date());
      
      // Update the real data toggle based on response
      if (data.source === 'real') {
        setUseRealData(true);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setError('Failed to load news. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [useRealData]);

  // Fetch news on mount and when auto-refresh is enabled
  useEffect(() => {
    fetchNews();
    
    // Auto-refresh every 5 minutes
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
      color: 'text-red-400', 
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
      color: 'text-purple-400', 
      icon: Zap, 
      description: 'Technical innovations and advancements' 
    },
    { 
      name: 'Education', 
      count: 178, 
      color: 'text-yellow-400', 
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

  const quickStats = [
    { label: 'Today\'s Articles', value: newsArticles.length.toString(), icon: Newspaper, color: 'text-blue-400' },
    { label: 'Breaking News', value: newsArticles.filter(a => a.category === 'breakthrough').length.toString(), icon: AlertCircle, color: 'text-red-400' },
    { label: 'High Impact', value: newsArticles.filter(a => a.impactLevel === 'critical' || a.impactLevel === 'high').length.toString(), icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'News Sources', value: new Set(newsArticles.map(a => a.source.name)).size.toString(), icon: Globe, color: 'text-purple-400' }
  ];

  const filteredArticles = newsArticles.filter(article => {
    const displayCategory = categoryMappings[article.category] || article.category;
    const matchesCategory = selectedCategory === 'all' || displayCategory === selectedCategory;
    const matchesImportance = selectedImportance === 'all' || article.impactLevel === selectedImportance.toLowerCase();
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesImportance && matchesSearch;
  });

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16 sm:pt-20">
      {/* Hero Section */}
      <motion.div 
        className="relative overflow-hidden bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-emerald-900/20 py-12 sm:py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 backdrop-blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            className="inline-flex items-center space-x-2 bg-blue-500/10 rounded-full px-6 py-2 border border-blue-500/20 mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Newspaper className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 font-medium">AI News Intelligence</span>
          </motion.div>

          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-white">Stay Informed with</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              AI News Feed
            </span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 px-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Curated AI news from top sources worldwide. Get real-time updates on breakthroughs, 
            research, and industry developments that matter to your learning journey.
          </motion.p>

          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {quickStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-2xl sm:text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-gray-400 text-xs sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Filters and Controls */}
        <motion.div
          className="mb-8 space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            
            {/* Search and Filters */}
            <div className="flex flex-1 gap-4 max-w-2xl">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search news, topics, or sources..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {newsCategories.map(category => (
                  <option key={category.name} value={category.name}>{category.name}</option>
                ))}
              </select>

              <select
                value={selectedImportance}
                onChange={(e) => setSelectedImportance(e.target.value)}
                className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                {importanceOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Updated {formatTimeAgo(lastUpdated)}</span>
              </div>
              
              <button
                onClick={() => setUseRealData(!useRealData)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-colors ${
                  useRealData 
                    ? 'bg-emerald-600 border-emerald-500 text-white' 
                    : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:text-white'
                }`}
              >
                {useRealData ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-sm">{useRealData ? 'Real News' : 'Demo News'}</span>
              </button>
              
              <button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-colors ${
                  isAutoRefresh 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:text-white'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isAutoRefresh ? 'bg-white animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm">Auto-refresh</span>
              </button>

              <Button 
                onClick={fetchNews} 
                variant="outline" 
                size="sm" 
                className="border-slate-700 text-gray-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
              
              <Button variant="outline" size="sm" className="border-slate-700 text-gray-300">
                <Bell className="w-4 h-4 mr-2" />
                Alerts
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Category Sidebar */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">News Categories</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left p-3 rounded-xl transition-colors ${
                    selectedCategory === 'all' 
                      ? 'bg-slate-700/50 border border-slate-600' 
                      : 'hover:bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">All News</span>
                    <span className="text-sm text-gray-400">{newsArticles.length}</span>
                  </div>
                </button>

                {newsCategories.map((category, index) => (
                  <motion.button
                    key={category.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      selectedCategory === category.name 
                        ? 'bg-slate-700/50 border border-slate-600' 
                        : 'hover:bg-slate-700/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-1">
                      <category.icon className={`w-4 h-4 ${category.color}`} />
                      <span className="text-white font-medium">{category.name}</span>
                      <span className="text-sm text-gray-400 ml-auto">{category.count}</span>
                    </div>
                    <p className="text-xs text-gray-400 pl-7">{category.description}</p>
                  </motion.button>
                ))}
              </div>
            </Card>

            {/* Trending Topics */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Trending Topics</h3>
              <div className="space-y-3">
                {['GPT-5', 'AI Education', 'Machine Learning', 'Neural Networks', 'EdTech'].map((topic, index) => (
                  <div key={topic} className="flex items-center justify-between p-2 hover:bg-slate-700/30 rounded-lg cursor-pointer">
                    <span className="text-gray-300">{topic}</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Main News Feed */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading latest AI news...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Error loading news</h3>
                  <p className="text-gray-400 mb-4">{error}</p>
                  <Button onClick={fetchNews} variant="outline" className="border-slate-700">
                    Try Again
                  </Button>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredArticles.map((article, index) => (
                    <motion.div
                      key={article.articleId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl p-6 hover:bg-slate-800/60 transition-colors group">
                        <div className="flex items-start space-x-4">
                          
                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                {/* Trending indicator */}
                                {article.trendingStatus === 'hot' && (
                                  <span className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                    <Zap className="w-3 h-3" />
                                    <span>HOT</span>
                                  </span>
                                )}
                                {article.trendingStatus === 'rising' && (
                                  <span className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>RISING</span>
                                  </span>
                                )}
                                {article.trendingStatus === 'new' && (
                                  <span className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    <Sparkles className="w-3 h-3" />
                                    <span>NEW</span>
                                  </span>
                                )}
                                
                                <span className={`text-xs px-2 py-1 rounded-full border ${getImportanceColor(article.impactLevel)}`}>
                                  {article.impactLevel.toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-400">{categoryMappings[article.category] || article.category}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-400">{formatTimeAgo(new Date(article.publishDate))}</span>
                              </div>
                              
                              {/* Ranking score */}
                              {article.rankingScore && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">Score:</span>
                                  <span className="text-sm font-semibold text-emerald-400">{article.rankingScore}</span>
                                </div>
                              )}
                            </div>
                          
                          <a 
                            href={article.articleUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block mb-3"
                          >
                            <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {article.title}
                            </h3>
                          </a>
                          
                          <p className="text-gray-300 mb-4 line-clamp-3">{article.summary}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {article.tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className="text-xs bg-slate-700/50 text-gray-300 px-2 py-1 rounded-full">
                                #{tag}
                              </span>
                            ))}
                            
                            {/* Quality badges */}
                            {article.qualityBadges && article.qualityBadges.map((badge, badgeIndex) => (
                              <span key={`badge-${badgeIndex}`} className="flex items-center space-x-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">
                                <Award className="w-3 h-3" />
                                <span>{badge}</span>
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <a 
                                href={article.source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-blue-400 transition-colors"
                              >
                                {article.source.name}
                              </a>
                              {article.author && (
                                <>
                                  <span>•</span>
                                  <span>{article.author}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{article.readingTime} min read</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button className={`p-2 rounded-lg transition-colors ${
                                article.isLiked ? 'bg-red-500/20 text-red-400' : 'hover:bg-slate-700 text-gray-400'
                              }`}>
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button className={`p-2 rounded-lg transition-colors ${
                                article.isBookmarked ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-slate-700 text-gray-400'
                              }`}>
                                <Bookmark className="w-4 h-4" />
                              </button>
                              <button className="p-2 rounded-lg hover:bg-slate-700 text-gray-400 transition-colors">
                                <Share className="w-4 h-4" />
                              </button>
                              <a 
                                href={article.articleUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg hover:bg-slate-700 text-blue-400 transition-colors"
                                title="Read full article"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                </AnimatePresence>
              )}

              {filteredArticles.length === 0 && (
                <div className="text-center py-12">
                  <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
                  <p className="text-gray-400">Try adjusting your filters or search query</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}