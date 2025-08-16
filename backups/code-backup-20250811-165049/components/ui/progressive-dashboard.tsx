"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  Star, 
  Crown, 
  Zap, 
  Target, 
  BookOpen, 
  Users, 
  BarChart3, 
  Brain, 
  Settings,
  CheckCircle,
  Lock,
  ArrowRight,
  TrendingUp,
  Award,
  Lightbulb,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useProgressiveDisclosure } from "@/hooks/use-progressive-disclosure";
import { FeatureHint, FeatureProgressIndicator, FeatureShowcase } from "@/components/ui/feature-hint";

interface ProgressiveDashboardProps {
  className?: string;
}

export const ProgressiveDashboard = ({ className }: ProgressiveDashboardProps) => {
  const { 
    getUnlockedFeatures, 
    getNextFeatures, 
    getProgressStats, 
    userProgress 
  } = useProgressiveDisclosure();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const unlockedFeatures = getUnlockedFeatures();
  const nextFeatures = getNextFeatures();
  const stats = getProgressStats();

  const categories = [
    {
      id: 'ai',
      name: 'AI Assistance',
      icon: Brain,
      color: 'purple',
      description: 'Intelligent content generation and assistance'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: BarChart3,
      color: 'blue',
      description: 'Insights into student performance and learning'
    },
    {
      id: 'creation',
      name: 'Content Creation',
      icon: BookOpen,
      color: 'green',
      description: 'Tools for creating courses and assessments'
    },
    {
      id: 'assessment',
      name: 'Assessment',
      icon: Target,
      color: 'orange',
      description: 'Question creation and evaluation tools'
    },
    {
      id: 'collaboration',
      name: 'Collaboration',
      icon: Users,
      color: 'pink',
      description: 'Features for student engagement and interaction'
    }
  ];

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return <Zap className="w-4 h-4" />;
      case 'intermediate': return <Star className="w-4 h-4" />;
      case 'advanced': return <Crown className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50 border-green-200';
      case 'intermediate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'advanced': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ai': return 'purple';
      case 'analytics': return 'blue';
      case 'creation': return 'green';
      case 'assessment': return 'orange';
      case 'collaboration': return 'pink';
      default: return 'gray';
    }
  };

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' = 'bg') => {
    const colors = {
      purple: {
        bg: 'bg-purple-500',
        text: 'text-purple-600',
        border: 'border-purple-200'
      },
      blue: {
        bg: 'bg-blue-500',
        text: 'text-blue-600',
        border: 'border-blue-200'
      },
      green: {
        bg: 'bg-green-500',
        text: 'text-green-600',
        border: 'border-green-200'
      },
      orange: {
        bg: 'bg-orange-500',
        text: 'text-orange-600',
        border: 'border-orange-200'
      },
      pink: {
        bg: 'bg-pink-500',
        text: 'text-pink-600',
        border: 'border-pink-200'
      },
      gray: {
        bg: 'bg-gray-500',
        text: 'text-gray-600',
        border: 'border-gray-200'
      }
    };
    return colors[color as keyof typeof colors]?.[variant] || colors.gray[variant];
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Feature Discovery
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Unlock powerful features as you use the platform
            </p>
          </div>
          <Badge 
            variant="outline" 
            className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200"
          >
            Level: {stats.userLevel}
          </Badge>
        </div>
        
        <FeatureProgressIndicator />
      </div>

      {/* Category Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const categoryFeatures = unlockedFeatures.filter(f => f.category === category.id);
          const categoryNext = nextFeatures.filter(f => f.category === category.id);
          const unlockedCount = categoryFeatures.length;
          const totalCategoryFeatures = unlockedCount + categoryNext.length;
          const progress = totalCategoryFeatures > 0 ? (unlockedCount / totalCategoryFeatures) * 100 : 0;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  activeCategory === category.id && "ring-2 ring-blue-500"
                )}
                onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        `bg-${category.color}-100 dark:bg-${category.color}-900/20`
                      )}>
                        <category.icon className={cn("w-5 h-5", getColorClasses(category.color, 'text'))} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{category.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {unlockedCount} of {totalCategoryFeatures} unlocked
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight 
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        activeCategory === category.id && "rotate-90"
                      )} 
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {category.description}
                    </p>
                    {categoryNext.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Lightbulb className="w-3 h-3" />
                        <span>Next: {categoryNext[0].name}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Category View */}
      <AnimatePresence>
        {activeCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {(() => {
                    const category = categories.find(c => c.id === activeCategory);
                    const IconComponent = category?.icon;
                    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
                  })()}
                  {categories.find(c => c.id === activeCategory)?.name} Features
                </CardTitle>
                <CardDescription>
                  Explore available and upcoming features in this category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Unlocked Features */}
                  {unlockedFeatures.filter(f => f.category === activeCategory).length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Unlocked Features
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {unlockedFeatures
                          .filter(f => f.category === activeCategory)
                          .map((feature) => (
                            <motion.div
                              key={feature.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                            >
                              <div className="flex-shrink-0">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                  {feature.name}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 truncate">
                                  {feature.description}
                                </p>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", getDifficultyColor(feature.difficulty))}
                              >
                                {getDifficultyIcon(feature.difficulty)}
                                <span className="ml-1 capitalize">{feature.difficulty}</span>
                              </Badge>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Next Features */}
                  {nextFeatures.filter(f => f.category === activeCategory).length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Coming Next
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {nextFeatures
                          .filter(f => f.category === activeCategory)
                          .slice(0, 4)
                          .map((feature) => (
                            <motion.div
                              key={feature.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                            >
                              <div className="flex-shrink-0">
                                <Lock className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                  {feature.name}
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                                  {feature.description}
                                </p>
                                {feature.prerequisites && feature.prerequisites.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-blue-500">Requires:</span>
                                    {feature.prerequisites.slice(0, 2).map((prereq, idx) => (
                                      <Badge key={prereq} variant="outline" className="text-xs">
                                        {prereq}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", getDifficultyColor(feature.difficulty))}
                              >
                                {getDifficultyIcon(feature.difficulty)}
                                <span className="ml-1 capitalize">{feature.difficulty}</span>
                              </Badge>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Highlights */}
      {stats.unlockedFeatures > 3 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Great Progress!
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    You&apos;ve unlocked {stats.unlockedFeatures} features and discovered {stats.discoveredFeatures} total.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                  {stats.unlockProgress}%
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                  Platform Mastery
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Recommended Actions
          </CardTitle>
          <CardDescription>
            Take these actions to unlock more features and improve your experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* AI Features */}
            {stats.userLevel === 'beginner' && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <Brain className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Try AI Course Assistant
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Generate course content to unlock advanced features
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-600" />
              </div>
            )}

            {/* Analytics Features */}
            {stats.userLevel !== 'beginner' && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Explore Analytics
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Use advanced mode to access predictive insights
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </div>
            )}

            {/* Time Investment */}
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Spend More Time
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {Math.max(0, 30 - stats.totalTimeSpent)} more minutes to level up
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Showcase */}
      <FeatureShowcase maxFeatures={5} className="mt-6" />
    </div>
  );
};

export default ProgressiveDashboard;