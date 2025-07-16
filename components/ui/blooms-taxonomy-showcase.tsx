"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Target,
  TrendingUp,
  Award,
  BookOpen,
  Lightbulb,
  Puzzle,
  Eye,
  ChevronRight,
  Star,
  CheckCircle,
  Zap,
  Users,
  BarChart3,
  Trophy,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface BloomsTaxonomyShowcaseProps {
  variant?: 'landing' | 'dashboard' | 'modal';
  showCTA?: boolean;
  className?: string;
}

interface BloomsLevel {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  examples: string[];
  difficulty: number;
  usage: number;
}

const BLOOMS_LEVELS: BloomsLevel[] = [
  {
    id: 'remember',
    name: 'Remember',
    description: 'Recall facts and basic concepts',
    color: 'bg-red-500',
    icon: <Brain className="w-5 h-5" />,
    examples: ['Define', 'List', 'Identify', 'Name'],
    difficulty: 1,
    usage: 85
  },
  {
    id: 'understand',
    name: 'Understand',
    description: 'Explain ideas or concepts',
    color: 'bg-orange-500',
    icon: <BookOpen className="w-5 h-5" />,
    examples: ['Describe', 'Explain', 'Summarize', 'Compare'],
    difficulty: 2,
    usage: 78
  },
  {
    id: 'apply',
    name: 'Apply',
    description: 'Use information in new situations',
    color: 'bg-yellow-500',
    icon: <Target className="w-5 h-5" />,
    examples: ['Execute', 'Implement', 'Solve', 'Use'],
    difficulty: 3,
    usage: 72
  },
  {
    id: 'analyze',
    name: 'Analyze',
    description: 'Draw connections among ideas',
    color: 'bg-green-500',
    icon: <Puzzle className="w-5 h-5" />,
    examples: ['Differentiate', 'Organize', 'Relate', 'Compare'],
    difficulty: 4,
    usage: 65
  },
  {
    id: 'evaluate',
    name: 'Evaluate',
    description: 'Justify a stand or decision',
    color: 'bg-blue-500',
    icon: <Eye className="w-5 h-5" />,
    examples: ['Appraise', 'Argue', 'Defend', 'Judge'],
    difficulty: 5,
    usage: 58
  },
  {
    id: 'create',
    name: 'Create',
    description: 'Produce new or original work',
    color: 'bg-purple-500',
    icon: <Lightbulb className="w-5 h-5" />,
    examples: ['Design', 'Assemble', 'Construct', 'Develop'],
    difficulty: 6,
    usage: 42
  }
];

const FEATURES = [
  {
    title: 'AI-Powered Question Generation',
    description: 'Automatically generate questions aligned with specific Bloom\'s levels',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'text-blue-600'
  },
  {
    title: 'Cognitive Progression Tracking',
    description: 'Monitor student advancement through cognitive complexity levels',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'text-green-600'
  },
  {
    title: 'Intelligent Assessment Design',
    description: 'Create balanced assessments across all cognitive domains',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'text-purple-600'
  },
  {
    title: 'Learning Analytics',
    description: 'Gain insights into cognitive skill development patterns',
    icon: <Brain className="w-6 h-6" />,
    color: 'text-indigo-600'
  }
];

const BENEFITS = [
  'Ensure comprehensive cognitive development',
  'Align assessments with learning objectives',
  'Track student progress across skill levels',
  'Identify knowledge gaps automatically',
  'Create pedagogically sound curricula'
];

interface BloomsVisualizerProps {
  isActive: boolean;
}

const BloomsVisualizer = ({ isActive }: BloomsVisualizerProps) => {
  const [selectedLevel, setSelectedLevel] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setSelectedLevel((prev) => (prev + 1) % BLOOMS_LEVELS.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="relative">
      {/* Pyramid Structure */}
      <div className="flex flex-col items-center space-y-2">
        {BLOOMS_LEVELS.slice().reverse().map((level, index) => {
          const reverseIndex = BLOOMS_LEVELS.length - 1 - index;
          const isSelected = selectedLevel === reverseIndex;
          const width = `${20 + (index * 15)}%`;
          
          return (
            <motion.div
              key={level.id}
              className={cn(
                'relative flex items-center justify-center px-4 py-3 rounded-lg cursor-pointer transition-all duration-300',
                isSelected 
                  ? `${level.color} text-white shadow-lg scale-105`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
              style={{ width }}
              onClick={() => setSelectedLevel(reverseIndex)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                {level.icon}
                <span className="font-medium text-sm">{level.name}</span>
              </div>
              
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-64"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {level.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {level.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {level.examples.map((example) => (
                      <Badge key={example} variant="outline" className="text-xs">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export const BloomsTaxonomyShowcase = ({
  variant = 'dashboard',
  showCTA = false,
  className
}: BloomsTaxonomyShowcaseProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'benefits'>('overview');
  const [isVisualizerActive, setIsVisualizerActive] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm font-medium mb-4"
              >
                <Trophy className="w-4 h-4" />
                Industry-Leading Educational Technology
              </motion.div>
              
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Bloom&apos;s Taxonomy Integration
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                The only LMS platform with native Bloom&apos;s taxonomy support, ensuring pedagogically sound course design and assessment creation.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <BloomsVisualizer isActive={isVisualizerActive} />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Cognitive Learning Progression
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Our AI-powered system automatically categorizes and generates content across all six levels of Bloom&apos;s taxonomy, ensuring comprehensive cognitive development.
                </p>
                
                <div className="space-y-3">
                  {BLOOMS_LEVELS.slice(0, 3).map((level) => (
                    <div key={level.id} className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg text-white', level.color)}>
                        {level.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {level.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {level.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Powerful AI Features
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Advanced capabilities that transform how you create and deliver educational content
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg bg-gray-100 dark:bg-gray-800', feature.color)}>
                          {feature.icon}
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'benefits':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Educational Benefits
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Proven advantages for educators and students alike
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Key Benefits
                </h4>
                <div className="space-y-3">
                  {BENEFITS.map((benefit, index) => (
                    <motion.div
                      key={benefit}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Student Outcomes
                </h4>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-300">
                        25% improvement in critical thinking
                      </span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Students show measurable improvement in higher-order thinking skills
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800 dark:text-blue-300">
                        Better learning retention
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Structured cognitive progression leads to deeper understanding
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-800 dark:text-purple-300">
                        Enhanced engagement
                      </span>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-400">
                      Progressive complexity keeps students challenged and motivated
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Navigation Tabs */}
      <div className="flex items-center justify-center">
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: <Eye className="w-4 h-4" /> },
            { id: 'features', label: 'Features', icon: <Zap className="w-4 h-4" /> },
            { id: 'benefits', label: 'Benefits', icon: <Star className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Call to Action */}
      {showCTA && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              Start Free Trial
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" size="lg">
              Schedule Demo
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            No credit card required • 14-day free trial
          </p>
        </motion.div>
      )}
    </div>
  );
};