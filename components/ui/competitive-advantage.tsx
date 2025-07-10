"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  X,
  Crown,
  Zap,
  Brain,
  Target,
  BarChart3,
  Users,
  Award,
  Star,
  TrendingUp,
  Shield,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CompetitiveAdvantageProps {
  variant?: 'landing' | 'sales' | 'dashboard';
  showPricing?: boolean;
  className?: string;
}

interface ComparisonFeature {
  category: string;
  features: {
    name: string;
    description: string;
    alamLMS: 'yes' | 'premium' | 'no';
    competitor1: 'yes' | 'premium' | 'no';
    competitor2: 'yes' | 'premium' | 'no';
    competitor3: 'yes' | 'premium' | 'no';
    isUnique?: boolean;
  }[];
}

const COMPARISON_DATA: ComparisonFeature[] = [
  {
    category: 'AI-Powered Education',
    features: [
      {
        name: 'Native Bloom\'s Taxonomy Integration',
        description: 'Built-in cognitive learning progression tracking and assessment design',
        alamLMS: 'yes',
        competitor1: 'no',
        competitor2: 'no',
        competitor3: 'no',
        isUnique: true
      },
      {
        name: 'AI Question Generation by Cognitive Level',
        description: 'Automatically generate questions targeting specific Bloom\'s levels',
        alamLMS: 'yes',
        competitor1: 'no',
        competitor2: 'premium',
        competitor3: 'no',
        isUnique: true
      },
      {
        name: 'Cognitive Gap Analysis',
        description: 'Identify knowledge gaps across cognitive skill levels',
        alamLMS: 'yes',
        competitor1: 'no',
        competitor2: 'no',
        competitor3: 'no',
        isUnique: true
      },
      {
        name: 'Smart Content Generation',
        description: 'AI-powered course content creation with pedagogical alignment',
        alamLMS: 'yes',
        competitor1: 'premium',
        competitor2: 'yes',
        competitor3: 'premium'
      },
      {
        name: 'Intelligent Assessment Design',
        description: 'Automatically balance assessments across cognitive complexity levels',
        alamLMS: 'yes',
        competitor1: 'no',
        competitor2: 'no',
        competitor3: 'no',
        isUnique: true
      }
    ]
  },
  {
    category: 'Advanced Analytics',
    features: [
      {
        name: 'Cognitive Progression Analytics',
        description: 'Track student development across Bloom\'s taxonomy levels',
        alamLMS: 'yes',
        competitor1: 'no',
        competitor2: 'no',
        competitor3: 'no',
        isUnique: true
      },
      {
        name: 'Predictive Learning Analytics',
        description: 'AI-powered predictions for student success and risk factors',
        alamLMS: 'yes',
        competitor1: 'premium',
        competitor2: 'premium',
        competitor3: 'yes'
      },
      {
        name: 'Real-time Performance Dashboards',
        description: 'Live analytics with actionable insights for educators',
        alamLMS: 'yes',
        competitor1: 'yes',
        competitor2: 'yes',
        competitor3: 'yes'
      },
      {
        name: 'Cross-Course Benchmarking',
        description: 'Compare performance and effectiveness across different courses',
        alamLMS: 'yes',
        competitor1: 'no',
        competitor2: 'premium',
        competitor3: 'no'
      }
    ]
  },
  {
    category: 'User Experience',
    features: [
      {
        name: 'Progressive Feature Disclosure',
        description: 'Intelligent UI that reveals features based on user expertise',
        alamLMS: 'yes',
        competitor1: 'no',
        competitor2: 'no',
        competitor3: 'no',
        isUnique: true
      },
      {
        name: 'Smart Educational Presets',
        description: 'Pre-configured course templates for different subjects and levels',
        alamLMS: 'yes',
        competitor1: 'yes',
        competitor2: 'yes',
        competitor3: 'premium'
      },
      {
        name: 'Adaptive Interface',
        description: 'Interface adapts to user role and experience level',
        alamLMS: 'yes',
        competitor1: 'no',
        competitor2: 'no',
        competitor3: 'no',
        isUnique: true
      },
      {
        name: 'Mobile-First Design',
        description: 'Optimized for mobile learning and teaching',
        alamLMS: 'yes',
        competitor1: 'yes',
        competitor2: 'yes',
        competitor3: 'yes'
      }
    ]
  }
];

const COMPETITORS = [
  { name: 'Alam LMS', color: 'bg-purple-600', isUs: true },
  { name: 'Canvas', color: 'bg-gray-400', isUs: false },
  { name: 'Moodle', color: 'bg-gray-400', isUs: false },
  { name: 'Blackboard', color: 'bg-gray-400', isUs: false }
];

const UNIQUE_FEATURES = [
  {
    title: 'Only LMS with Native Bloom\'s Taxonomy',
    description: 'Built from the ground up with cognitive learning theory',
    icon: <Brain className="w-6 h-6" />,
    color: 'bg-purple-500'
  },
  {
    title: 'AI-Powered Cognitive Assessment',
    description: 'Automatically generate questions across all thinking levels',
    icon: <Zap className="w-6 h-6" />,
    color: 'bg-blue-500'
  },
  {
    title: 'Progressive Feature Disclosure',
    description: 'Intelligent interface that adapts to user expertise',
    icon: <Target className="w-6 h-6" />,
    color: 'bg-green-500'
  }
];

const FeatureIcon = ({ 
  status, 
  isHighlight = false 
}: { 
  status: 'yes' | 'premium' | 'no'; 
  isHighlight?: boolean 
}) => {
  if (status === 'yes') {
    return (
      <CheckCircle 
        className={cn(
          'w-5 h-5',
          isHighlight ? 'text-purple-600' : 'text-green-600'
        )} 
      />
    );
  }
  if (status === 'premium') {
    return <Crown className="w-5 h-5 text-yellow-600" />;
  }
  return <X className="w-5 h-5 text-red-500" />;
};

export const CompetitiveAdvantage = ({
  variant = 'landing',
  showPricing = false,
  className
}: CompetitiveAdvantageProps) => {
  const [selectedCategory, setSelectedCategory] = useState(0);

  const getUniqueFeatureCount = () => {
    return COMPARISON_DATA.reduce((count, category) => {
      return count + category.features.filter(f => f.isUnique).length;
    }, 0);
  };

  return (
    <div className={cn('space-y-8', className)}>
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm font-medium"
        >
          <Crown className="w-4 h-4" />
          Industry Leader in Educational AI
        </motion.div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Why Educators Choose Alam LMS
        </h2>
        
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          The only learning management system with native Bloom's taxonomy integration, 
          powered by advanced AI for pedagogically sound education.
        </p>

        {/* Unique Features Count */}
        <div className="inline-flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-800 dark:text-purple-300">
              {getUniqueFeatureCount()} Exclusive Features
            </span>
          </div>
          <div className="w-px h-6 bg-purple-300 dark:bg-purple-700"></div>
          <span className="text-sm text-purple-600 dark:text-purple-400">
            Not available anywhere else
          </span>
        </div>
      </div>

      {/* Unique Features Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {UNIQUE_FEATURES.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0">
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                  Exclusive
                </Badge>
              </div>
              
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={cn('p-3 rounded-lg text-white', feature.color)}>
                    {feature.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Feature Comparison
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            See how Alam LMS compares to other leading platforms
          </p>
        </div>

        {/* Category Selector */}
        <div className="flex flex-wrap justify-center gap-2">
          {COMPARISON_DATA.map((category, index) => (
            <button
              key={category.category}
              onClick={() => setSelectedCategory(index)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedCategory === index
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {category.category}
            </button>
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-4 font-medium text-gray-900 dark:text-white">
                    Feature
                  </th>
                  {COMPETITORS.map((competitor) => (
                    <th key={competitor.name} className="text-center p-4">
                      <div className="flex flex-col items-center gap-2">
                        <div 
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center',
                            competitor.color
                          )}
                        >
                          {competitor.isUs ? (
                            <Crown className="w-4 h-4 text-white" />
                          ) : (
                            <span className="text-white text-xs font-bold">
                              {competitor.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className={cn(
                          'text-sm font-medium',
                          competitor.isUs 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-gray-600 dark:text-gray-400'
                        )}>
                          {competitor.name}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA[selectedCategory].features.map((feature, index) => (
                  <motion.tr
                    key={feature.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'border-b border-gray-100 dark:border-gray-700',
                      feature.isUnique && 'bg-purple-50/50 dark:bg-purple-900/10'
                    )}
                  >
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {feature.name}
                          </span>
                          {feature.isUnique && (
                            <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                              Unique
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <FeatureIcon status={feature.alamLMS} isHighlight={true} />
                    </td>
                    <td className="p-4 text-center">
                      <FeatureIcon status={feature.competitor1} />
                    </td>
                    <td className="p-4 text-center">
                      <FeatureIcon status={feature.competitor2} />
                    </td>
                    <td className="p-4 text-center">
                      <FeatureIcon status={feature.competitor3} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-gray-600 dark:text-gray-400">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-600" />
            <span className="text-gray-600 dark:text-gray-400">Premium Only</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-500" />
            <span className="text-gray-600 dark:text-gray-400">Not Available</span>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      {variant === 'landing' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center p-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl text-white"
        >
          <h3 className="text-2xl font-bold mb-4">
            Experience the Future of Educational Technology
          </h3>
          <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
            Join thousands of educators who are already using Alam LMS to create 
            more effective, pedagogically sound learning experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
              Schedule Demo
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};