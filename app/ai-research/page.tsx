"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  TrendingUp,
  Star,
  Download,
  ExternalLink,
  Eye,
  Quote,
  Award,
  Brain,
  Lightbulb,
  Microscope,
  Zap,
  Clock,
  ChevronRight,
  Share,
  Bookmark,
  MessageSquare,
  ThumbsUp,
  Building2,
  Sparkles,
  ChevronDown,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrentUser } from '@/hooks/use-current-user';
import { UserMenu } from '@/app/(homepage)/_components/user-menu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { getFallbackImageUrl } from '@/lib/cloudinary-utils';
import { HomeFooter } from '@/app/(homepage)/HomeFooter';

type SortOption = 'relevance' | 'citations' | 'recent' | 'impact';

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
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface ResearchMetrics {
  totalPapers: number;
  citationsThisMonth: number;
  topInstitutions: string[];
  emergingTopics: string[];
}

export default function AIResearchPage() {
  const user = useCurrentUser();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
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
      color: 'text-violet-600 dark:text-violet-400',
      icon: Brain,
      description: 'Core ML algorithms and methodologies'
    },
    {
      name: 'Natural Language Processing',
      count: 892,
      growth: 18.7,
      color: 'text-indigo-600 dark:text-indigo-400',
      icon: MessageSquare,
      description: 'Language understanding and generation'
    },
    {
      name: 'Computer Vision',
      count: 634,
      growth: 15.2,
      color: 'text-purple-600 dark:text-purple-400',
      icon: Eye,
      description: 'Visual recognition and analysis'
    },
    {
      name: 'Educational AI',
      count: 456,
      growth: 45.8,
      color: 'text-amber-600 dark:text-amber-400',
      icon: Lightbulb,
      description: 'AI applications in education'
    },
    {
      name: 'AI Ethics',
      count: 287,
      growth: 32.1,
      color: 'text-rose-600 dark:text-rose-400',
      icon: Shield,
      description: 'Responsible AI development'
    },
    {
      name: 'Robotics',
      count: 189,
      growth: 12.8,
      color: 'text-indigo-600 dark:text-indigo-400',
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

  const sortOptions: { value: SortOption; label: string }[] = [
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
    { label: 'Research Papers', value: '15.4K', color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-50 dark:bg-violet-500/10' },
    { label: 'Citations', value: '892K', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { label: 'Institutions', value: '450+', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-500/10' },
    { label: 'Impact Score', value: '8.7', color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-50 dark:bg-violet-500/10' }
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
      case 'Beginner': return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'Intermediate': return 'bg-amber-500/20 text-amber-700 dark:text-amber-400';
      case 'Advanced': return 'bg-orange-500/20 text-orange-700 dark:text-orange-400';
      case 'Expert': return 'bg-red-500/20 text-red-700 dark:text-red-400';
      default: return 'bg-slate-500/20 text-slate-700 dark:text-slate-400';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50 pt-4 pb-12 sm:pt-6 sm:pb-16 md:pb-20">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-100/60 dark:bg-violet-500/5 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-indigo-100/60 dark:bg-indigo-500/5 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
          <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-purple-100/40 dark:bg-purple-500/5 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
          <div
            className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgb(0 0 0) 1px, transparent 1px),
                linear-gradient(to bottom, rgb(0 0 0) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Navigation Bar */}
        <div className="relative z-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              <Link
                href="/"
                className="flex items-center gap-2.5 group"
                aria-label="Go to Taxomind home page"
              >
                <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md transition-transform group-hover:scale-105">
                  <Image
                    src="/taxomind-logo.png"
                    alt="Taxomind Logo"
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                    priority
                    onError={(e) => {
                      e.currentTarget.src = getFallbackImageUrl('default');
                    }}
                  />
                </div>
                <span className="font-bold text-lg text-slate-900 dark:text-white">
                  Taxomind
                </span>
              </Link>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                {user ? (
                  <UserMenu user={user} />
                ) : (
                  <Link href="/auth/login">
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm font-medium px-4"
                    >
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <motion.div
          className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 md:pt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 dark:bg-white/10 border border-slate-800 dark:border-white/20 mb-6 sm:mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Microscope className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-white dark:text-slate-200">
                AI Research Intelligence
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-4 sm:mb-6"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="block">Academic</span>
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                Research Hub
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Explore cutting-edge AI research papers, discover breakthrough innovations,
              and stay at the forefront of artificial intelligence advancement.
            </motion.p>

            {/* Stats Grid */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {globalStats.map((stat) => (
                <motion.div
                  key={stat.label}
                  className="group relative bg-white dark:bg-slate-800/50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300"
                  whileHover={{ y: -2 }}
                >
                  <div className={`text-2xl sm:text-3xl font-bold ${stat.color} mb-1`}>
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Main Content */}
      <main id="main-content" className="bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

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
                  <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search papers, authors, institutions, or keywords..."
                    className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm sm:text-base transition-all"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={() => setIsAdvancedSearch(!isAdvancedSearch)}
                  className="w-full sm:w-auto border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Advanced
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isAdvancedSearch ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {/* Sort */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full sm:w-auto bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm sm:text-base"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-6 bg-white dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm sm:text-base"
                      >
                        <option value="all">All Categories</option>
                        {researchCategories.map(category => (
                          <option key={category.name} value={category.name}>{category.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Difficulty</label>
                      <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm sm:text-base"
                      >
                        {difficultyOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Publication Year</label>
                      <select className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm sm:text-base">
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
              <Card className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl p-4 sm:p-6 shadow-sm dark:shadow-none">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">Research Areas</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left p-2 sm:p-3 rounded-xl transition-colors border ${
                      selectedCategory === 'all'
                        ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-400'
                        : 'bg-white hover:bg-slate-50 border-slate-200 dark:bg-transparent dark:hover:bg-slate-700/30 dark:border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm sm:text-base">All Research</span>
                      <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{researchPapers.length}</span>
                    </div>
                  </button>

                  {researchCategories.map((category, index) => {
                    const Icon = category.icon;
                    return (
                      <motion.button
                        key={category.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        onClick={() => setSelectedCategory(category.name)}
                        className={`w-full text-left p-2 sm:p-3 rounded-xl transition-colors border ${
                          selectedCategory === category.name
                            ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30'
                            : 'bg-white hover:bg-slate-50 border-slate-200 dark:bg-transparent dark:hover:bg-slate-700/30 dark:border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
                          <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${category.color}`} />
                          <span className="text-slate-900 dark:text-white font-medium text-sm sm:text-base">{category.name}</span>
                          <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 ml-auto">{category.count}</span>
                        </div>
                        <div className="flex items-center justify-between pl-5 sm:pl-7">
                          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{category.description}</p>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">+{category.growth}%</span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </Card>

              {/* Top Institutions */}
              <Card className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl p-4 sm:p-6 shadow-sm dark:shadow-none">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">Top Institutions</h3>
                <div className="space-y-3">
                  {researchMetrics.topInstitutions.map((institution, index) => (
                    <div key={institution} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg cursor-pointer">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 text-sm sm:text-base">{institution}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Emerging Topics */}
              <Card className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl p-4 sm:p-6 shadow-sm dark:shadow-none">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">Emerging Topics</h3>
                <div className="space-y-2">
                  {researchMetrics.emergingTopics.map((topic) => (
                    <div key={topic} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg cursor-pointer">
                      <span className="text-slate-700 dark:text-slate-300 text-sm sm:text-base">{topic}</span>
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-violet-600 dark:text-violet-400" />
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
                      <Card className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl p-4 sm:p-6 hover:bg-white dark:hover:bg-slate-800/60 transition-colors group cursor-pointer shadow-sm dark:shadow-none">
                        <div className="space-y-3 sm:space-y-4">

                          {/* Header */}
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
                            <div className="flex-1 w-full">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(paper.difficulty)}`}>
                                  {paper.difficulty}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{paper.category}</span>
                                <span className="text-xs text-slate-400 hidden sm:inline">&bull;</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(paper.publishedDate)}</span>
                              </div>

                              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
                                {paper.title}
                              </h3>

                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3">
                                <span className="break-words">{paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 ? ' et al.' : ''}</span>
                                <span className="hidden sm:inline">&bull;</span>
                                <span className="break-words">{paper.institution}</span>
                                <span className="hidden sm:inline">&bull;</span>
                                <span>{paper.venue}</span>
                              </div>
                            </div>

                            <div className="text-center sm:text-right sm:ml-6 flex-shrink-0">
                              <div className="flex items-center justify-center sm:justify-end space-x-1 mb-1">
                                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400" />
                                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{paper.impactScore}</span>
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Impact Score</div>
                            </div>
                          </div>

                          {/* Abstract */}
                          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base line-clamp-2 sm:line-clamp-3">{paper.abstract}</p>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {paper.tags.slice(0, 4).map((tag, tagIndex) => (
                              <span key={tagIndex} className="text-xs bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300 px-2 py-1 rounded-full">
                                #{tag}
                              </span>
                            ))}
                            {paper.tags.length > 4 && (
                              <span className="text-xs text-slate-500 dark:text-slate-500">+{paper.tags.length - 4}</span>
                            )}
                          </div>

                          {/* Metrics and Actions */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700/50 gap-3 sm:gap-0">
                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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
                                paper.isLiked ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'hover:bg-slate-100 text-slate-500 dark:hover:bg-slate-700 dark:text-slate-400'
                              }`}>
                                <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                              <button className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                                paper.isBookmarked ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'hover:bg-slate-100 text-slate-500 dark:hover:bg-slate-700 dark:text-slate-400'
                              }`}>
                                <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                              <button className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
                                <Share className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                              <button className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
                                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                              <button className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
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
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 px-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700"
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No papers found</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                      Try adjusting your search criteria or filters to find more papers
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
}
