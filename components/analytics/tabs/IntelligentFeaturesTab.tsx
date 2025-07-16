// AI Features Hub - User-focused AI tools and capabilities for enhanced learning

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { 
  Brain, Sparkles, BookOpen, Target, TrendingUp, Zap,
  MessageSquare, PenTool, Lightbulb, Users, Clock, Star,
  BarChart3, Rocket, Shield, ChevronRight, Play, Pause
} from 'lucide-react';

interface IntelligentFeaturesProps {
  analytics?: any;
  performance?: any;
}

interface AIFeature {
  id: number;
  category: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  status: 'available' | 'premium' | 'coming-soon';
  userBenefit: string;
  actionText: string;
  metrics?: { [key: string]: string | number };
  gradient: string;
}

export function IntelligentFeaturesTab({ analytics, performance }: IntelligentFeaturesProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const aiFeatures: AIFeature[] = [
    // Learning Enhancement
    {
      id: 1,
      category: 'Learning Enhancement',
      name: 'AI Study Assistant',
      icon: <Brain className="h-6 w-6" />,
      description: 'Get personalized study recommendations and explanations',
      status: 'available',
      userBenefit: 'Improve understanding by 40% with AI-powered explanations',
      actionText: 'Start Studying',
      metrics: { 'Sessions Today': 12, 'Questions Answered': 847 },
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      id: 2,
      category: 'Learning Enhancement',
      name: 'Smart Note Generator',
      icon: <PenTool className="h-6 w-6" />,
      description: 'Automatically generate structured notes from course content',
      status: 'available',
      userBenefit: 'Save 2+ hours per week with automated note-taking',
      actionText: 'Generate Notes',
      metrics: { 'Notes Created': 234, 'Time Saved': '18 hrs' },
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      id: 3,
      category: 'Learning Enhancement',
      name: 'Adaptive Learning Path',
      icon: <Target className="h-6 w-6" />,
      description: 'Personalized curriculum that adapts to your learning style',
      status: 'available',
      userBenefit: 'Learn 60% faster with personalized pacing',
      actionText: 'View My Path',
      metrics: { 'Completion Rate': '87%', 'Efficiency Boost': '+60%' },
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      id: 4,
      category: 'Learning Enhancement',
      name: 'Knowledge Mapping',
      icon: <Lightbulb className="h-6 w-6" />,
      description: 'Visual knowledge graphs showing concept relationships',
      status: 'available',
      userBenefit: 'Better retention through visual learning connections',
      actionText: 'Explore Map',
      metrics: { 'Concepts Mapped': 1247, 'Connections': 3891 },
      gradient: 'from-amber-500 to-orange-600'
    },

    // Content Creation
    {
      id: 5,
      category: 'Content Creation',
      name: 'AI Content Generator',
      icon: <Sparkles className="h-6 w-6" />,
      description: 'Create course materials, quizzes, and assignments with AI',
      status: 'available',
      userBenefit: 'Generate professional content in minutes',
      actionText: 'Create Content',
      metrics: { 'Content Generated': 156, 'Quality Score': '96%' },
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      id: 6,
      category: 'Content Creation',
      name: 'Smart Quiz Builder',
      icon: <BookOpen className="h-6 w-6" />,
      description: 'Automatically generate quizzes from your study materials',
      status: 'available',
      userBenefit: 'Create engaging assessments instantly',
      actionText: 'Build Quiz',
      metrics: { 'Quizzes Created': 89, 'Avg Score': '92%' },
      gradient: 'from-indigo-500 to-purple-600'
    },
    {
      id: 7,
      category: 'Content Creation',
      name: 'Presentation Designer',
      icon: <Star className="h-6 w-6" />,
      description: 'AI-powered slide generation with smart layouts',
      status: 'premium',
      userBenefit: 'Create professional presentations effortlessly',
      actionText: 'Upgrade to Access',
      metrics: { 'Templates': 50, 'Design Themes': 12 },
      gradient: 'from-rose-500 to-pink-600'
    },
    {
      id: 8,
      category: 'Content Creation',
      name: 'Video Script Writer',
      icon: <Play className="h-6 w-6" />,
      description: 'Generate engaging video scripts for educational content',
      status: 'coming-soon',
      userBenefit: 'Streamline video content creation workflow',
      actionText: 'Coming Soon',
      metrics: { 'ETA': 'Q2 2025', 'Beta Users': 127 },
      gradient: 'from-teal-500 to-cyan-600'
    },

    // Productivity
    {
      id: 9,
      category: 'Productivity',
      name: 'Smart Scheduler',
      icon: <Clock className="h-6 w-6" />,
      description: 'AI-optimized study schedules based on your goals',
      status: 'available',
      userBenefit: 'Optimize your time with intelligent scheduling',
      actionText: 'Schedule Study',
      metrics: { 'Time Saved': '5 hrs/week', 'Goals Met': '94%' },
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      id: 10,
      category: 'Productivity',
      name: 'Focus Tracker',
      icon: <Target className="h-6 w-6" />,
      description: 'Monitor and improve your learning focus with AI insights',
      status: 'available',
      userBenefit: 'Increase focus time by 45% with smart tracking',
      actionText: 'Start Tracking',
      metrics: { 'Avg Focus': '78 min', 'Improvement': '+45%' },
      gradient: 'from-orange-500 to-red-600'
    },
    {
      id: 11,
      category: 'Productivity',
      name: 'Task Prioritizer',
      icon: <TrendingUp className="h-6 w-6" />,
      description: 'AI-powered task prioritization for maximum impact',
      status: 'available',
      userBenefit: 'Complete high-impact tasks 3x faster',
      actionText: 'Prioritize Tasks',
      metrics: { 'Tasks Completed': 342, 'Efficiency': '+73%' },
      gradient: 'from-violet-500 to-purple-600'
    },
    {
      id: 12,
      category: 'Productivity',
      name: 'Progress Predictor',
      icon: <BarChart3 className="h-6 w-6" />,
      description: 'Predict your learning outcomes and adjust strategies',
      status: 'premium',
      userBenefit: 'Achieve goals 2x faster with predictive insights',
      actionText: 'Upgrade to Access',
      metrics: { 'Accuracy': '91%', 'Goal Success': '+85%' },
      gradient: 'from-slate-500 to-gray-600'
    },

    // Collaboration
    {
      id: 13,
      category: 'Collaboration',
      name: 'AI Study Groups',
      icon: <Users className="h-6 w-6" />,
      description: 'Form optimal study groups with AI-matched learners',
      status: 'available',
      userBenefit: 'Learn 3x better with AI-matched study partners',
      actionText: 'Find Groups',
      metrics: { 'Active Groups': 89, 'Success Rate': '92%' },
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      id: 14,
      category: 'Collaboration',
      name: 'Smart Discussions',
      icon: <MessageSquare className="h-6 w-6" />,
      description: 'AI-moderated discussions with intelligent prompts',
      status: 'available',
      userBenefit: 'Deeper insights through guided discussions',
      actionText: 'Join Discussion',
      metrics: { 'Active Threads': 156, 'Engagement': '+67%' },
      gradient: 'from-green-500 to-blue-600'
    },
    {
      id: 15,
      category: 'Collaboration',
      name: 'Peer Review AI',
      icon: <Shield className="h-6 w-6" />,
      description: 'AI-enhanced peer reviews with quality insights',
      status: 'coming-soon',
      userBenefit: 'Get better feedback with AI-enhanced reviews',
      actionText: 'Coming Soon',
      metrics: { 'ETA': 'Q3 2025', 'Beta Interest': 245 },
      gradient: 'from-red-500 to-pink-600'
    },
    {
      id: 16,
      category: 'Collaboration',
      name: 'Knowledge Sharing',
      icon: <Rocket className="h-6 w-6" />,
      description: 'AI-curated knowledge sharing recommendations',
      status: 'premium',
      userBenefit: 'Accelerate learning through smart knowledge sharing',
      actionText: 'Upgrade to Access',
      metrics: { 'Shared Items': 1234, 'Impact Score': '8.9/10' },
      gradient: 'from-purple-500 to-indigo-600'
    }
  ];

  const categories = ['Learning Enhancement', 'Content Creation', 'Productivity', 'Collaboration'];
  
  const filteredFeatures = selectedCategory === 'all' 
    ? aiFeatures 
    : aiFeatures.filter(f => f.category === selectedCategory);

  const availableFeatures = aiFeatures.filter(f => f.status === 'available').length;
  const premiumFeatures = aiFeatures.filter(f => f.status === 'premium').length;
  const comingSoonFeatures = aiFeatures.filter(f => f.status === 'coming-soon').length;


  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-pink-900/20">
      <div className="space-y-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8"
        >
          <div className="text-center space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full text-white font-medium">
              <Sparkles className="h-5 w-5" />
              <span>AI-Powered Learning Hub</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Supercharge Your Learning
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Unlock the power of artificial intelligence to accelerate your learning journey, create better content, and achieve your goals faster than ever before.
            </p>
            
            {/* Feature Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="text-3xl font-bold text-green-600">{availableFeatures}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Available Features</div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="text-3xl font-bold text-amber-600">{premiumFeatures}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Premium Features</div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="text-3xl font-bold text-blue-600">{comingSoonFeatures}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Coming Soon</div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Category Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-2"
        >
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory('all')}
              className={`${selectedCategory === 'all' 
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              } transition-all duration-200`}
            >
              All Features
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'ghost'}
                onClick={() => setSelectedCategory(category)}
                className={`${selectedCategory === category 
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                } transition-all duration-200`}
              >
                {category}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredFeatures.map((feature, index) => (
            <AIFeatureCard 
              key={feature.id} 
              feature={feature} 
              index={index}
              isHovered={hoveredFeature === feature.id}
              onHover={setHoveredFeature}
            />
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8"
        >
          <div className="text-center space-y-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Ready to Transform Your Learning?
            </h3>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Join thousands of learners who are already using AI to accelerate their growth and achieve their goals faster.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg"
                  onClick={() => alert('Feature coming soon!')}
                >
                  <Rocket className="h-5 w-5 mr-2" />
                  Get Started with AI
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-violet-200 hover:bg-violet-50 dark:border-violet-700 dark:hover:bg-violet-900/20"
                  onClick={() => alert('Tutorial coming soon!')}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Watch Tutorial
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// AI Feature Card Component
function AIFeatureCard({ 
  feature, 
  index, 
  isHovered, 
  onHover 
}: { 
  feature: AIFeature; 
  index: number; 
  isHovered: boolean; 
  onHover: (id: number | null) => void; 
}) {
  const statusConfig = {
    available: {
      badge: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      actionButton: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white',
      border: 'border-green-200/50 dark:border-green-700/50'
    },
    premium: {
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
      actionButton: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white',
      border: 'border-amber-200/50 dark:border-amber-700/50'
    },
    'coming-soon': {
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      actionButton: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white cursor-not-allowed',
      border: 'border-blue-200/50 dark:border-blue-700/50'
    }
  };

  const config = statusConfig[feature.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => onHover(feature.id)}
      onHoverEnd={() => onHover(null)}
      className={`group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border ${config.border} shadow-sm hover:shadow-xl transition-all duration-300`}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      
      {/* Card Content */}
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
            <div className="text-white">
              {feature.icon}
            </div>
          </div>
          <Badge className={`${config.badge} font-medium`}>
            {feature.status === 'coming-soon' ? 'Soon' : feature.status}
          </Badge>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-violet-600 group-hover:to-purple-600 transition-all duration-300">
            {feature.name}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {feature.description}
          </p>
        </div>

        {/* User Benefit */}
        <div className="bg-slate-50/80 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            💡 {feature.userBenefit}
          </p>
        </div>

        {/* Metrics */}
        {feature.metrics && (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(feature.metrics).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-white">{value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{key}</div>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <motion.div 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          className="pt-2"
        >
          <Button 
            className={`w-full ${config.actionButton} shadow-md group-hover:shadow-lg transition-all duration-300`}
            disabled={feature.status === 'coming-soon'}
            onClick={() => {
              if (feature.status === 'premium') {
                alert('Premium feature - Upgrade your plan to access this feature!');
              } else if (feature.status === 'available') {
                alert(`Launching ${feature.name}...`);
              }
            }}
          >
            {feature.actionText}
            {feature.status === 'available' && <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />}
          </Button>
        </motion.div>
      </div>

      {/* Hover Effect Indicator */}
      <motion.div 
        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient}`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}