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
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryColor(item.category)} text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-slate-800 dark:text-slate-200">{item.title}</CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getImpactColor(item.impact)}>
                  {item.impact} impact
                </Badge>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    item.score >= 80 ? 'text-green-600' :
                    item.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {item.score}%
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Current Level</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{item.score}%</span>
                </div>
                <Progress value={item.score} className="h-2" />
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-purple-500" />
                  Action Steps
                </h4>
                <ul className="space-y-1">
                  {item.actions.map((action, idx) => (
                    <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Related Skills</h4>
                <div className="flex flex-wrap gap-2">
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
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-500 rounded-lg text-white">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-400">Cognitive Strengths</h3>
                  <p className="text-sm text-emerald-600 dark:text-emerald-500">{strengths.length} identified areas</p>
                </div>
              </div>
              <div className="space-y-2">
                {cognitiveData.strengths.slice(0, 3).map((strength, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-700 dark:text-emerald-300">{strength}</span>
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
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-500 rounded-lg text-white">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">Growth Areas</h3>
                  <p className="text-sm text-red-600 dark:text-red-500">{weaknesses.length} priority areas</p>
                </div>
              </div>
              <div className="space-y-2">
                {cognitiveData.weaknesses.slice(0, 3).map((weakness, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-red-500" />
                    <span className="text-red-700 dark:text-red-300">{weakness}</span>
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
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500 rounded-lg text-white">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400">Growth Rate</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-500">Cognitive development</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  +{cognitiveData.cognitiveGrowth}%
                </div>
                <p className="text-sm text-blue-500 dark:text-blue-500">This month</p>
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
          className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"
        >
          <Star className="w-6 h-6 text-emerald-500" />
          Cognitive Strengths - Leverage These Assets
        </motion.h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {strengths.map((item, index) => renderAnalysisCard(item, index))}
        </div>
      </div>

      {/* Detailed Weaknesses Analysis */}
      <div>
        <motion.h3 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"
        >
          <AlertTriangle className="w-6 h-6 text-red-500" />
          Priority Development Areas
        </motion.h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {weaknesses.map((item, index) => renderAnalysisCard(item, index + strengths.length))}
        </div>
      </div>

      {/* Opportunities Analysis */}
      <div>
        <motion.h3 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"
        >
          <Target className="w-6 h-6 text-blue-500" />
          Growth Opportunities
        </motion.h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {opportunities.map((item, index) => renderAnalysisCard(item, index + strengths.length + weaknesses.length))}
        </div>
      </div>

      {/* Action Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Brain className="w-6 h-6 text-purple-600" />
              Recommended Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Immediate Actions</h4>
                <ul className="space-y-2">
                  {cognitiveData.recommendedFocus.map((focus, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600 dark:text-slate-400">{focus}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Next Milestones</h4>
                <ul className="space-y-2">
                  {cognitiveData.nextMilestones.map((milestone, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Target className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600 dark:text-slate-400">{milestone}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="default" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Study Plan
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Track Progress
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                Find Study Partners
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}