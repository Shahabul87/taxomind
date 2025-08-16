"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  LineChart, 
  Brain, 
  Sparkles, 
  Eye,
  Clock,
  Globe,
  Users,
  Award,
  Target,
  Zap,
  BookOpen,
  Lightbulb,
  Rocket,
  Search,
  Filter,
  Calendar,
  Star,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Download,
  Share
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TrendData {
  id: string;
  title: string;
  growth: number;
  category: 'Technology' | 'Education' | 'Industry' | 'Research';
  impact: 'High' | 'Medium' | 'Low';
  timeframe: '7d' | '30d' | '90d' | '1y';
  description: string;
  keywords: string[];
  sources: number;
}

interface TrendCategory {
  name: string;
  count: number;
  growth: number;
  color: string;
  icon: any;
}

export default function AITrendsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveUpdating, setIsLiveUpdating] = useState(true);

  const trendingTopics: TrendData[] = [
    {
      id: '1',
      title: 'Large Language Models in Education',
      growth: 156.7,
      category: 'Technology',
      impact: 'High',
      timeframe: '30d',
      description: 'Revolutionary impact of LLMs on personalized learning and content creation',
      keywords: ['GPT', 'ChatGPT', 'LLM', 'Education AI', 'Personalization'],
      sources: 1247
    },
    {
      id: '2',
      title: 'AI-Powered Assessment Tools',
      growth: 89.3,
      category: 'Education',
      impact: 'High',
      timeframe: '30d',
      description: 'Automated grading and intelligent assessment systems transforming evaluation',
      keywords: ['Assessment', 'Automated Grading', 'Evaluation AI', 'Testing'],
      sources: 892
    },
    {
      id: '3',
      title: 'Multimodal Learning Experiences',
      growth: 72.4,
      category: 'Technology',
      impact: 'Medium',
      timeframe: '30d',
      description: 'Integration of text, audio, video, and interactive elements in AI education',
      keywords: ['Multimodal', 'Interactive Learning', 'Media Integration'],
      sources: 634
    },
    {
      id: '4',
      title: 'AI Ethics in Educational Technology',
      growth: 45.8,
      category: 'Research',
      impact: 'High',
      timeframe: '30d',
      description: 'Growing focus on responsible AI implementation in learning environments',
      keywords: ['AI Ethics', 'Responsible AI', 'Privacy', 'Bias'],
      sources: 456
    },
    {
      id: '5',
      title: 'Adaptive Learning Algorithms',
      growth: 38.2,
      category: 'Technology',
      impact: 'Medium',
      timeframe: '30d',
      description: 'Advanced algorithms that adjust to individual learning patterns',
      keywords: ['Adaptive Learning', 'Algorithms', 'Personalization'],
      sources: 389
    },
    {
      id: '6',
      title: 'AI in Corporate Training',
      growth: -12.4,
      category: 'Industry',
      impact: 'Medium',
      timeframe: '30d',
      description: 'Enterprise adoption of AI for employee skill development',
      keywords: ['Corporate Training', 'Enterprise AI', 'Skill Development'],
      sources: 234
    }
  ];

  const trendCategories: TrendCategory[] = [
    { name: 'Technology', count: 324, growth: 23.5, color: 'text-purple-400', icon: Brain },
    { name: 'Education', count: 256, growth: 18.7, color: 'text-blue-400', icon: BookOpen },
    { name: 'Research', count: 189, growth: 15.2, color: 'text-emerald-400', icon: Lightbulb },
    { name: 'Industry', count: 145, growth: 8.9, color: 'text-yellow-400', icon: Rocket }
  ];

  const timeframeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];

  const globalStats = [
    { label: 'Active Trends', value: '1,247', icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Research Papers', value: '8,934', icon: BookOpen, color: 'text-blue-400' },
    { label: 'Industry Reports', value: '3,156', icon: BarChart3, color: 'text-purple-400' },
    { label: 'Expert Predictions', value: '542', icon: Target, color: 'text-yellow-400' }
  ];

  const filteredTrends = trendingTopics.filter(trend => {
    const matchesCategory = selectedCategory === 'all' || trend.category === selectedCategory;
    const matchesSearch = trend.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trend.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getTrendIcon = (growth: number) => {
    return growth > 0 ? TrendingUp : TrendingDown;
  };

  const getTrendColor = (growth: number) => {
    return growth > 0 ? 'text-emerald-400' : 'text-red-400';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-red-500/20 text-red-400';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'Low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16 sm:pt-20">
      {/* Hero Section */}
      <motion.div 
        className="relative overflow-hidden bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-emerald-900/20 py-12 sm:py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-emerald-500/10 backdrop-blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            className="inline-flex items-center space-x-2 bg-emerald-500/10 rounded-full px-6 py-2 border border-emerald-500/20 mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-300 font-medium">Live AI Trends Analysis</span>
          </motion.div>

          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-white">AI Education</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Trend Intelligence
            </span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 px-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Stay ahead with real-time insights into emerging AI technologies, educational innovations, 
            and industry developments shaping the future of learning.
          </motion.p>

          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {globalStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-2xl sm:text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-gray-400 text-xs sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        
        {/* Filters and Controls */}
        <motion.div
          className="mb-8 space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row flex-1 gap-4 max-w-2xl w-full">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search trends, keywords, or topics..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 text-sm sm:text-base"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm sm:text-base"
              >
                <option value="all">All Categories</option>
                {trendCategories.map(category => (
                  <option key={category.name} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>

            {/* Timeframe and Live Update */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
              <div className="flex bg-slate-800/50 rounded-xl border border-slate-700 w-full sm:w-auto overflow-hidden">
                {timeframeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedTimeframe(option.value as any)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors flex-1 sm:flex-none ${
                      selectedTimeframe === option.value 
                        ? 'bg-emerald-600 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setIsLiveUpdating(!isLiveUpdating)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-colors ${
                  isLiveUpdating 
                    ? 'bg-emerald-600 border-emerald-500 text-white' 
                    : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:text-white'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isLiveUpdating ? 'bg-white animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm">Live</span>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          
          {/* Category Overview */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Trend Categories</h3>
              <div className="space-y-4">
                {trendCategories.map((category, index) => (
                  <motion.div
                    key={category.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`p-4 rounded-xl transition-colors cursor-pointer ${
                      selectedCategory === category.name 
                        ? 'bg-slate-700/50 border border-slate-600' 
                        : 'bg-slate-700/20 hover:bg-slate-700/30'
                    }`}
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <category.icon className={`w-4 h-4 ${category.color}`} />
                        <span className="text-white font-medium">{category.name}</span>
                      </div>
                      <span className="text-sm text-gray-400">{category.count}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`text-sm font-medium ${getTrendColor(category.growth)}`}>
                        +{category.growth}%
                      </div>
                      <TrendingUp className={`w-3 h-3 ${getTrendColor(category.growth)}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Quick Insights */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Insights</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Large Language Models dominate education trends with 156% growth this month.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">AI assessment tools gaining traction in academic institutions worldwide.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Ethics and responsible AI implementation becoming priority focus areas.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Trends List */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Trending Topics</h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="border-slate-700 text-gray-300">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-700 text-gray-300">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {filteredTrends.map((trend, index) => {
                    const TrendIcon = getTrendIcon(trend.growth);
                    return (
                      <motion.div
                        key={trend.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: 0.1 * index }}
                        className="bg-slate-700/30 rounded-xl p-6 hover:bg-slate-700/40 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                                {trend.title}
                              </h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(trend.impact)}`}>
                                {trend.impact} Impact
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm mb-3">{trend.description}</p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {trend.keywords.map((keyword, keyIndex) => (
                                <span key={keyIndex} className="text-xs bg-slate-600/50 text-gray-300 px-2 py-1 rounded-full">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <span>{trend.sources} sources</span>
                              <span>•</span>
                              <span>{trend.category}</span>
                              <span>•</span>
                              <span>Last {trend.timeframe}</span>
                            </div>
                          </div>
                          
                          <div className="text-right ml-6">
                            <div className={`flex items-center space-x-1 text-lg font-bold ${getTrendColor(trend.growth)}`}>
                              <TrendIcon className="w-5 h-5" />
                              <span>{Math.abs(trend.growth)}%</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {trend.growth > 0 ? 'Growth' : 'Decline'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="w-full bg-slate-600 rounded-full h-2 mr-4">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(Math.abs(trend.growth), 100)}%` }}
                            ></div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {filteredTrends.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No trends found</h3>
                  <p className="text-gray-400">Try adjusting your filters or search query</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}