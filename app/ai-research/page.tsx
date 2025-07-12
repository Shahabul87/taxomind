"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen,
  FileText,
  Search,
  Filter,
  TrendingUp,
  Star,
  Download,
  ExternalLink,
  Users,
  Calendar,
  Tag,
  Eye,
  Quote,
  Award,
  Brain,
  Lightbulb,
  Microscope,
  Target,
  Zap,
  Clock,
  BarChart3,
  ArrowUpRight,
  ChevronRight,
  Share,
  Bookmark,
  MessageSquare,
  ThumbsUp,
  Globe,
  Building2,
  Sparkles,
  Play,
  ChevronDown,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ResearchPaper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  institution: string;
  publishedDate: Date;
  venue: string;
  citations: number;
  downloads: number;
  category: 'Machine Learning' | 'Natural Language Processing' | 'Computer Vision' | 'Robotics' | 'AI Ethics' | 'Educational AI';
  tags: string[];
  impactScore: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  pdfUrl?: string;
  isBookmarked: boolean;
  isLiked: boolean;
  readingTime: number;
}

interface ResearchCategory {
  name: string;
  count: number;
  growth: number;
  color: string;
  icon: any;
  description: string;
}

interface ResearchMetrics {
  totalPapers: number;
  citationsThisMonth: number;
  topInstitutions: string[];
  emergingTopics: string[];
}

export default function AIResearchPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'citations' | 'recent' | 'impact'>('relevance');
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);

  const researchPapers: ResearchPaper[] = [
    {
      id: '1',
      title: 'Attention Is All You Need: Transforming Educational AI with Self-Attention Mechanisms',
      abstract: 'We propose a novel architecture for educational AI systems based purely on attention mechanisms, dispensing with recurrence and convolutions entirely. Our model achieves superior performance on personalized learning tasks while being more parallelizable and requiring significantly less time to train.',
      authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones'],
      institution: 'Google Research',
      publishedDate: new Date('2023-12-15'),
      venue: 'NeurIPS 2023',
      citations: 15420,
      downloads: 89432,
      category: 'Natural Language Processing',
      tags: ['Transformer', 'Attention', 'Educational AI', 'Deep Learning'],
      impactScore: 9.7,
      difficulty: 'Advanced',
      isBookmarked: true,
      isLiked: false,
      readingTime: 25
    },
    {
      id: '2',
      title: 'Large Language Models as Educational Tutors: A Comprehensive Evaluation',
      abstract: 'This paper presents the first large-scale evaluation of LLMs as educational tutors across multiple subjects and grade levels. We analyze performance, bias, and learning outcomes in real educational settings.',
      authors: ['Dr. Sarah Chen', 'Prof. Michael Rodriguez', 'Dr. Amy Zhang'],
      institution: 'Stanford University',
      publishedDate: new Date('2024-01-08'),
      venue: 'ICML 2024',
      citations: 892,
      downloads: 12847,
      category: 'Educational AI',
      tags: ['LLM', 'Tutoring', 'Evaluation', 'Education'],
      impactScore: 8.9,
      difficulty: 'Intermediate',
      isBookmarked: false,
      isLiked: true,
      readingTime: 18
    },
    {
      id: '3',
      title: 'Federated Learning for Privacy-Preserving Educational Analytics',
      abstract: 'We introduce a federated learning framework that enables educational institutions to collaboratively train AI models while preserving student privacy and data sovereignty.',
      authors: ['Dr. Lisa Park', 'Prof. James Wilson', 'Dr. Maria Garcia'],
      institution: 'MIT CSAIL',
      publishedDate: new Date('2024-01-20'),
      venue: 'ICLR 2024',
      citations: 234,
      downloads: 5673,
      category: 'Machine Learning',
      tags: ['Federated Learning', 'Privacy', 'Analytics', 'Education'],
      impactScore: 7.8,
      difficulty: 'Advanced',
      isBookmarked: true,
      isLiked: false,
      readingTime: 22
    },
    {
      id: '4',
      title: 'Multimodal AI for Adaptive Learning: Combining Vision, Audio, and Text',
      abstract: 'This work explores the integration of computer vision, speech recognition, and natural language processing to create adaptive learning experiences that respond to multiple input modalities.',
      authors: ['Dr. Robert Kim', 'Dr. Jennifer Liu', 'Prof. David Brown'],
      institution: 'Carnegie Mellon University',
      publishedDate: new Date('2024-02-03'),
      venue: 'AAAI 2024',
      citations: 167,
      downloads: 3892,
      category: 'Computer Vision',
      tags: ['Multimodal', 'Adaptive Learning', 'Computer Vision', 'NLP'],
      impactScore: 7.2,
      difficulty: 'Expert',
      isBookmarked: false,
      isLiked: false,
      readingTime: 30
    },
    {
      id: '5',
      title: 'Ethical Considerations in AI-Powered Educational Assessment',
      abstract: 'We examine the ethical implications of using AI for student assessment, including bias, fairness, transparency, and the impact on student well-being and learning outcomes.',
      authors: ['Dr. Angela Davis', 'Prof. Thomas Anderson', 'Dr. Rachel Green'],
      institution: 'University of Oxford',
      publishedDate: new Date('2024-01-15'),
      venue: 'FAccT 2024',
      citations: 445,
      downloads: 7821,
      category: 'AI Ethics',
      tags: ['Ethics', 'Assessment', 'Bias', 'Fairness'],
      impactScore: 8.1,
      difficulty: 'Intermediate',
      isBookmarked: false,
      isLiked: true,
      readingTime: 15
    }
  ];

  const researchCategories: ResearchCategory[] = [
    {
      name: 'Machine Learning',
      count: 1247,
      growth: 23.5,
      color: 'text-purple-400',
      icon: Brain,
      description: 'Core ML algorithms and methodologies'
    },
    {
      name: 'Natural Language Processing',
      count: 892,
      growth: 18.7,
      color: 'text-blue-400',
      icon: MessageSquare,
      description: 'Language understanding and generation'
    },
    {
      name: 'Computer Vision',
      count: 634,
      growth: 15.2,
      color: 'text-emerald-400',
      icon: Eye,
      description: 'Visual recognition and analysis'
    },
    {
      name: 'Educational AI',
      count: 456,
      growth: 45.8,
      color: 'text-yellow-400',
      icon: Lightbulb,
      description: 'AI applications in education'
    },
    {
      name: 'AI Ethics',
      count: 287,
      growth: 32.1,
      color: 'text-red-400',
      icon: Shield,
      description: 'Responsible AI development'
    },
    {
      name: 'Robotics',
      count: 189,
      growth: 12.8,
      color: 'text-orange-400',
      icon: Zap,
      description: 'Autonomous systems and robotics'
    }
  ];

  const difficultyOptions = [
    { value: 'all', label: 'All Levels' },
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
    { value: 'Expert', label: 'Expert' }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'citations', label: 'Most Cited' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'impact', label: 'Impact Score' }
  ];

  const researchMetrics: ResearchMetrics = {
    totalPapers: 15420,
    citationsThisMonth: 89234,
    topInstitutions: ['Stanford', 'MIT', 'Google Research', 'OpenAI', 'DeepMind'],
    emergingTopics: ['Multimodal AI', 'Federated Learning', 'AI Safety', 'Quantum ML']
  };

  const globalStats = [
    { label: 'Research Papers', value: '15.4K', icon: FileText, color: 'text-blue-400' },
    { label: 'Citations', value: '892K', icon: Quote, color: 'text-emerald-400' },
    { label: 'Institutions', value: '450+', icon: Building2, color: 'text-purple-400' },
    { label: 'Impact Score', value: '8.7', icon: Award, color: 'text-yellow-400' }
  ];

  const filteredPapers = researchPapers.filter(paper => {
    const matchesCategory = selectedCategory === 'all' || paper.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || paper.difficulty === selectedDifficulty;
    const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         paper.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         paper.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400';
      case 'Advanced': return 'bg-orange-500/20 text-orange-400';
      case 'Expert': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16 sm:pt-20">
      {/* Hero Section */}
      <motion.div 
        className="relative overflow-hidden bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-blue-900/20 py-12 sm:py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 backdrop-blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            className="inline-flex items-center space-x-2 bg-indigo-500/10 rounded-full px-6 py-2 border border-indigo-500/20 mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Microscope className="w-5 h-5 text-indigo-400" />
            <span className="text-indigo-300 font-medium">AI Research Intelligence</span>
          </motion.div>

          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-white">Academic</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Research Hub
            </span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 px-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Explore cutting-edge AI research papers, discover breakthrough innovations, 
            and stay at the forefront of artificial intelligence advancement.
          </motion.p>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {globalStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        
        {/* Search and Filters */}
        <motion.div
          className="mb-6 sm:mb-8 space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            
            {/* Search */}
            <div className="flex flex-col sm:flex-row flex-1 gap-4 max-w-3xl w-full">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search papers, authors, institutions, or keywords..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 text-sm sm:text-base"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => setIsAdvancedSearch(!isAdvancedSearch)}
                className="w-full sm:w-auto border-slate-700 text-gray-300"
              >
                <Filter className="w-4 h-4 mr-2" />
                Advanced
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isAdvancedSearch ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {/* Sort and Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm sm:text-base"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Search */}
          <AnimatePresence>
            {isAdvancedSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-6 bg-slate-800/30 rounded-2xl border border-slate-700">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm sm:text-base"
                    >
                      <option value="all">All Categories</option>
                      {researchCategories.map(category => (
                        <option key={category.name} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Difficulty</label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm sm:text-base"
                    >
                      {difficultyOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Publication Year</label>
                    <select className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm sm:text-base">
                      <option value="all">All Years</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                      <option value="2021">2021</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          
          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            
            {/* Research Categories */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Research Areas</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left p-2 sm:p-3 rounded-xl transition-colors ${
                    selectedCategory === 'all' 
                      ? 'bg-slate-700/50 border border-slate-600' 
                      : 'hover:bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium text-sm sm:text-base">All Research</span>
                    <span className="text-xs sm:text-sm text-gray-400">{researchPapers.length}</span>
                  </div>
                </button>

                {researchCategories.map((category, index) => (
                  <motion.button
                    key={category.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full text-left p-2 sm:p-3 rounded-xl transition-colors ${
                      selectedCategory === category.name 
                        ? 'bg-slate-700/50 border border-slate-600' 
                        : 'hover:bg-slate-700/30'
                    }`}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
                      <category.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${category.color}`} />
                      <span className="text-white font-medium text-sm sm:text-base">{category.name}</span>
                      <span className="text-xs sm:text-sm text-gray-400 ml-auto">{category.count}</span>
                    </div>
                    <div className="flex items-center justify-between pl-5 sm:pl-7">
                      <p className="text-xs text-gray-400 hidden sm:block">{category.description}</p>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs text-emerald-400">+{category.growth}%</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </Card>

            {/* Top Institutions */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Top Institutions</h3>
              <div className="space-y-3">
                {researchMetrics.topInstitutions.map((institution, index) => (
                  <div key={institution} className="flex items-center justify-between p-2 hover:bg-slate-700/30 rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      <span className="text-gray-300 text-sm sm:text-base">{institution}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Emerging Topics */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Emerging Topics</h3>
              <div className="space-y-2">
                {researchMetrics.emergingTopics.map((topic, index) => (
                  <div key={topic} className="flex items-center justify-between p-2 hover:bg-slate-700/30 rounded-lg cursor-pointer">
                    <span className="text-gray-300 text-sm sm:text-base">{topic}</span>
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Research Papers */}
          <div className="lg:col-span-3">
            <div className="space-y-4 sm:space-y-6">
              <AnimatePresence>
                {filteredPapers.map((paper, index) => (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl p-4 sm:p-6 hover:bg-slate-800/60 transition-colors group cursor-pointer">
                      <div className="space-y-3 sm:space-y-4">
                        
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
                          <div className="flex-1 w-full">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(paper.difficulty)}`}>
                                {paper.difficulty}
                              </span>
                              <span className="text-xs text-gray-400">{paper.category}</span>
                              <span className="text-xs text-gray-400 hidden sm:inline">•</span>
                              <span className="text-xs text-gray-400">{formatDate(paper.publishedDate)}</span>
                            </div>
                            
                            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2">
                              {paper.title}
                            </h3>
                            
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400 mb-3">
                              <span className="break-words">{paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 ? ' et al.' : ''}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="break-words">{paper.institution}</span>
                              <span className="hidden sm:inline">•</span>
                              <span>{paper.venue}</span>
                            </div>
                          </div>
                          
                          <div className="text-center sm:text-right sm:ml-6 flex-shrink-0">
                            <div className="flex items-center justify-center sm:justify-end space-x-1 mb-1">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                              <span className="text-base sm:text-lg font-bold text-white">{paper.impactScore}</span>
                            </div>
                            <div className="text-xs text-gray-400">Impact Score</div>
                          </div>
                        </div>
                        
                        {/* Abstract */}
                        <p className="text-gray-300 text-sm sm:text-base line-clamp-2 sm:line-clamp-3">{paper.abstract}</p>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {paper.tags.slice(0, 4).map((tag, tagIndex) => (
                            <span key={tagIndex} className="text-xs bg-slate-700/50 text-gray-300 px-2 py-1 rounded-full">
                              #{tag}
                            </span>
                          ))}
                          {paper.tags.length > 4 && (
                            <span className="text-xs text-gray-500">+{paper.tags.length - 4}</span>
                          )}
                        </div>
                        
                        {/* Metrics and Actions */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 sm:pt-4 border-t border-slate-700/50 gap-3 sm:gap-0">
                          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Quote className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{paper.citations.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{paper.downloads.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{paper.readingTime} min</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <button className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                              paper.isLiked ? 'bg-red-500/20 text-red-400' : 'hover:bg-slate-700 text-gray-400'
                            }`}>
                              <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                              paper.isBookmarked ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-slate-700 text-gray-400'
                            }`}>
                              <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-700 text-gray-400 transition-colors">
                              <Share className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-700 text-gray-400 transition-colors">
                              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-700 text-gray-400 transition-colors">
                              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredPapers.length === 0 && (
                <div className="text-center py-8 sm:py-12">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No papers found</h3>
                  <p className="text-sm sm:text-base text-gray-400 px-4">Try adjusting your search criteria or filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}