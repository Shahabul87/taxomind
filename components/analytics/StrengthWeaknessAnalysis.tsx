"use client";

import { motion } from 'framer-motion';
import { 
  Star, Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Brain, Lightbulb, Zap, Users, BookOpen, Award, ArrowRight, Plus,
  BarChart3, PieChart, Activity, Clock, Eye, MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CognitiveProfile {
  overallScore: number;
  bloomsLevels: any[];
  strengths: string[];
  weaknesses: string[];
  learningStyle: string;
  cognitiveGrowth: number;
  recommendedFocus: string[];
  nextMilestones: string[];
  studyEfficiency: number;
  retentionRate: number;
  conceptualUnderstanding: number;
  applicationSkills: number;
}

interface StrengthWeaknessAnalysisProps {
  cognitiveData: CognitiveProfile;
}

interface AnalysisItem {
  id: string;
  title: string;
  description: string;
  score: number;
  category: 'strength' | 'weakness' | 'opportunity';
  impact: 'high' | 'medium' | 'low';
  actions: string[];
  relatedSkills: string[];
}

export function StrengthWeaknessAnalysis({ cognitiveData }: StrengthWeaknessAnalysisProps) {
  // Generate detailed analysis items
  const analysisData: AnalysisItem[] = [
    // Strengths
    {
      id: 'memory-recall',
      title: 'Excellent Memory & Recall',
      description: 'Strong ability to remember and retrieve factual information and concepts',
      score: 92,
      category: 'strength',
      impact: 'high',
      actions: [
        'Use memory skills to support higher-order learning',
        'Help peers with study techniques',
        'Build complex knowledge on solid foundation'
      ],
      relatedSkills: ['Information retention', 'Pattern recognition', 'Factual knowledge']
    },
    {
      id: 'comprehension',
      title: 'Strong Comprehension Skills',
      description: 'Able to understand and explain complex concepts effectively',
      score: 85,
      category: 'strength',
      impact: 'high',
      actions: [
        'Leverage understanding for teaching others',
        'Connect concepts across subjects',
        'Build on comprehension for analysis skills'
      ],
      relatedSkills: ['Conceptual understanding', 'Explanation ability', 'Knowledge synthesis']
    },
    {
      id: 'learning-consistency',
      title: 'Consistent Learning Patterns',
      description: 'Maintains regular study habits and shows steady progress',
      score: 88,
      category: 'strength',
      impact: 'medium',
      actions: [
        'Maintain current study schedule',
        'Share study strategies with others',
        'Use consistency for challenging topics'
      ],
      relatedSkills: ['Time management', 'Self-discipline', 'Goal setting']
    },
    
    // Weaknesses/Opportunities
    {
      id: 'critical-thinking',
      title: 'Critical Evaluation Skills',
      description: 'Need to develop stronger critical thinking and evaluation abilities',
      score: 42,
      category: 'weakness',
      impact: 'high',
      actions: [
        'Practice analyzing arguments and evidence',
        'Compare multiple perspectives on topics',
        'Engage in debates and discussions'
      ],
      relatedSkills: ['Argument analysis', 'Evidence evaluation', 'Perspective taking']
    },
    {
      id: 'creative-problem-solving',
      title: 'Creative Problem Solving',
      description: 'Innovation and creative thinking skills need development',
      score: 38,
      category: 'weakness',
      impact: 'high',
      actions: [
        'Engage in brainstorming activities',
        'Try alternative solution approaches',
        'Practice design thinking methods'
      ],
      relatedSkills: ['Innovation', 'Original thinking', 'Solution generation']
    },
    {
      id: 'practical-application',
      title: 'Knowledge Application',
      description: 'Difficulty applying learned concepts to new situations',
      score: 56,
      category: 'opportunity',
      impact: 'medium',
      actions: [
        'Practice with real-world scenarios',
        'Work on case studies and simulations',
        'Connect theory to practical examples'
      ],
      relatedSkills: ['Transfer learning', 'Problem solving', 'Practical reasoning']
    }
  ];

  const strengths = analysisData.filter(item => item.category === 'strength');
  const weaknesses = analysisData.filter(item => item.category === 'weakness');
  const opportunities = analysisData.filter(item => item.category === 'opportunity');

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-800';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/20 dark:border-yellow-800';
      case 'low': return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/20 dark:border-green-800';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950/20 dark:border-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength': return Star;
      case 'weakness': return AlertTriangle;
      case 'opportunity': return Target;
      default: return Brain;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength': return 'from-emerald-500 to-green-600';
      case 'weakness': return 'from-red-500 to-orange-600';
      case 'opportunity': return 'from-blue-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const renderAnalysisCard = (item: AnalysisItem, index: number) => {
    const Icon = getCategoryIcon(item.category);
    
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-0">
              <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-r ${getCategoryColor(item.category)} text-white flex-shrink-0`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-slate-800 dark:text-slate-200 text-sm sm:text-base break-words">{item.title}</CardTitle>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed break-words">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <Badge className={`${getImpactColor(item.impact)} text-xs sm:text-sm`}>
                  {item.impact} impact
                </Badge>
                <div className="text-right">
                  <div className={`text-base sm:text-lg font-bold ${
                    item.score >= 80 ? 'text-green-600' :
                    item.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {item.score}%
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Current Level</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{item.score}%</span>
                </div>
                <Progress value={item.score} className="h-1.5 sm:h-2" />
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2 text-sm sm:text-base">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                  Action Steps
                </h4>
                <ul className="space-y-1.5">
                  {item.actions.map((action, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2 leading-relaxed break-words">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                      <span className="flex-1">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 text-sm sm:text-base">Related Skills</h4>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {item.relatedSkills.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl md:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-emerald-500 rounded-lg text-white flex-shrink-0">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-emerald-800 dark:text-emerald-400 break-words">Cognitive Strengths</h3>
                  <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-500">{strengths.length} identified areas</p>
                </div>
              </div>
              <div className="space-y-2">
                {cognitiveData.strengths.slice(0, 3).map((strength, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-emerald-700 dark:text-emerald-300 break-words leading-relaxed">{strength}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-red-500 rounded-lg text-white flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-red-800 dark:text-red-400 break-words">Growth Areas</h3>
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-500">{weaknesses.length} priority areas</p>
                </div>
              </div>
              <div className="space-y-2">
                {cognitiveData.weaknesses.slice(0, 3).map((weakness, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-red-700 dark:text-red-300 break-words leading-relaxed">{weakness}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-blue-500 rounded-lg text-white flex-shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-800 dark:text-blue-400 break-words">Growth Rate</h3>
                  <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-500">Cognitive development</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
                  +{cognitiveData.cognitiveGrowth}%
                </div>
                <p className="text-xs sm:text-sm text-blue-500 dark:text-blue-500">This month</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Strengths Analysis */}
      <div>
        <motion.h3 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 sm:mb-4 flex items-center gap-2 break-words"
        >
          <Star className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 flex-shrink-0" />
          <span>Cognitive Strengths - Leverage These Assets</span>
        </motion.h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {strengths.map((item, index) => renderAnalysisCard(item, index))}
        </div>
      </div>

      {/* Detailed Weaknesses Analysis */}
      <div>
        <motion.h3 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 sm:mb-4 flex items-center gap-2 break-words"
        >
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0" />
          <span>Priority Development Areas</span>
        </motion.h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {weaknesses.map((item, index) => renderAnalysisCard(item, index + strengths.length))}
        </div>
      </div>

      {/* Opportunities Analysis */}
      <div>
        <motion.h3 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 sm:mb-4 flex items-center gap-2 break-words"
        >
          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
          <span>Growth Opportunities</span>
        </motion.h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {opportunities.map((item, index) => renderAnalysisCard(item, index + strengths.length + weaknesses.length))}
        </div>
      </div>

      {/* Action Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl md:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-base sm:text-lg break-words">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0" />
              Recommended Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 sm:mb-3 text-sm sm:text-base">Immediate Actions</h4>
                <ul className="space-y-1.5 sm:space-y-2">
                  {cognitiveData.recommendedFocus.map((focus, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600 dark:text-slate-400 break-words leading-relaxed">{focus}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 sm:mb-3 text-sm sm:text-base">Next Milestones</h4>
                <ul className="space-y-1.5 sm:space-y-2">
                  {cognitiveData.nextMilestones.map((milestone, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                      <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600 dark:text-slate-400 break-words leading-relaxed">{milestone}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
              <Button variant="default" size="sm" className="gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm px-3 sm:px-4 touch-manipulation flex-1 sm:flex-none">
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Create Study Plan
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm px-3 sm:px-4 touch-manipulation flex-1 sm:flex-none">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Track Progress
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm px-3 sm:px-4 touch-manipulation flex-1 sm:flex-none">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Find Study Partners
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}