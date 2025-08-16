"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'next-auth';
import { logger } from '@/lib/logger';
import {
  Brain, Target, TrendingUp, AlertTriangle, CheckCircle,
  BookOpen, Lightbulb, Users, Star, ArrowRight, BarChart3,
  PieChart, Map, Route, Zap, Award, Clock, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BloomsTaxonomyMap } from './BloomsTaxonomyMap';
import { CognitiveMindMap } from './CognitiveMindMap';
import { LearningPathRecommendations } from './LearningPathRecommendations';
import { StrengthWeaknessAnalysis } from './StrengthWeaknessAnalysis';

interface CognitiveAnalyticsProps {
  user: User;
  className?: string;
}

interface BloomsLevel {
  level: string;
  description: string;
  score: number;
  maxScore: number;
  questions: number;
  correct: number;
  color: string;
  improvements: string[];
  examples: string[];
}

interface CognitiveProfile {
  overallScore: number;
  bloomsLevels: BloomsLevel[];
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

export function CognitiveAnalytics({ user, className }: CognitiveAnalyticsProps) {
  const [cognitiveData, setCognitiveData] = useState<CognitiveProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchCognitiveData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, this would fetch from your cognitive analytics API
        // For now, we'll use comprehensive mock data based on realistic Bloom's Taxonomy analysis
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        
        const mockCognitiveProfile: CognitiveProfile = {
          overallScore: 78,
          bloomsLevels: [
            {
              level: "Remember",
              description: "Recalling facts and basic concepts",
              score: 92,
              maxScore: 100,
              questions: 45,
              correct: 41,
              color: "from-emerald-500 to-emerald-600",
              improvements: [
                "Excellent factual recall abilities",
                "Strong foundation in basic concepts",
                "Consistent performance across topics"
              ],
              examples: ["Historical dates", "Scientific formulas", "Vocabulary terms"]
            },
            {
              level: "Understand",
              description: "Explaining ideas and concepts",
              score: 85,
              maxScore: 100,
              questions: 38,
              correct: 32,
              color: "from-blue-500 to-blue-600",
              improvements: [
                "Good comprehension of material",
                "Able to explain concepts in own words",
                "Can summarize key points effectively"
              ],
              examples: ["Concept explanations", "Process descriptions", "Cause-effect relationships"]
            },
            {
              level: "Apply",
              description: "Using information in new situations",
              score: 74,
              maxScore: 100,
              questions: 32,
              correct: 24,
              color: "from-cyan-500 to-cyan-600",
              improvements: [
                "Room for improvement in practical application",
                "Need more practice with problem-solving",
                "Focus on real-world scenarios"
              ],
              examples: ["Math problems", "Code implementation", "Case studies"]
            },
            {
              level: "Analyze",
              description: "Drawing connections and identifying patterns",
              score: 68,
              maxScore: 100,
              questions: 28,
              correct: 19,
              color: "from-amber-500 to-yellow-500",
              improvements: [
                "Developing analytical thinking skills",
                "Need practice breaking down complex problems",
                "Focus on pattern recognition"
              ],
              examples: ["Data interpretation", "Argument evaluation", "System analysis"]
            },
            {
              level: "Evaluate",
              description: "Making judgments and assessing ideas",
              score: 62,
              maxScore: 100,
              questions: 22,
              correct: 14,
              color: "from-pink-500 to-rose-500",
              improvements: [
                "Critical thinking needs development",
                "Practice evaluating different perspectives",
                "Work on judgment and decision-making"
              ],
              examples: ["Solution assessment", "Quality evaluation", "Comparative analysis"]
            },
            {
              level: "Create",
              description: "Producing new or original work",
              score: 55,
              maxScore: 100,
              questions: 18,
              correct: 10,
              color: "from-violet-500 to-purple-500",
              improvements: [
                "Creativity and innovation need focus",
                "Practice original problem-solving",
                "Develop synthesis skills"
              ],
              examples: ["Project design", "Creative solutions", "Original research"]
            }
          ],
          strengths: [
            "Strong foundational knowledge (Remember & Understand)",
            "Excellent memory and recall abilities",
            "Good comprehension of complex concepts",
            "Consistent learning patterns",
            "High engagement with course materials"
          ],
          weaknesses: [
            "Higher-order thinking skills need development",
            "Creative problem-solving requires practice",
            "Critical evaluation skills need improvement",
            "Application of knowledge to new contexts",
            "Synthesis and innovation capabilities"
          ],
          learningStyle: "Visual-Analytical",
          cognitiveGrowth: 23,
          recommendedFocus: [
            "Analytical thinking exercises",
            "Creative problem-solving activities",
            "Critical evaluation practice",
            "Real-world application projects"
          ],
          nextMilestones: [
            "Achieve 80% in Application level",
            "Improve Analysis skills by 15%",
            "Develop creative thinking abilities",
            "Master critical evaluation techniques"
          ],
          studyEfficiency: 82,
          retentionRate: 88,
          conceptualUnderstanding: 79,
          applicationSkills: 71
        };

        setCognitiveData(mockCognitiveProfile);
      } catch (error: any) {
        logger.error('Error fetching cognitive data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCognitiveData();
  }, [user.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-gray-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-6 max-w-md">
            <p className="text-slate-900 dark:text-white font-semibold text-lg mb-2">Analyzing your cognitive patterns...</p>
            <p className="text-slate-600 dark:text-slate-400">Processing learning data through Bloom&apos;s Taxonomy framework</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cognitiveData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-gray-900 dark:to-slate-800 flex items-center justify-center p-6">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl w-fit mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Cognitive Analysis Unavailable
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Complete some assessments to unlock your cognitive analysis and personalized learning recommendations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-gray-900 dark:to-slate-800 p-6 ${className || ''}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Elegant Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm mb-4">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cognitive Analytics</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Your Learning Intelligence Profile
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Advanced cognitive analysis based on Bloom&apos;s Taxonomy framework to understand your learning patterns and optimize your educational journey
          </p>
        </motion.div>

        {/* Cognitive Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between mb-8">
            <div className="flex items-center gap-4 mb-4 lg:mb-0">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Cognitive Development Analysis</h3>
                <p className="text-slate-600 dark:text-slate-400">Based on Bloom&apos;s Taxonomy Assessment</p>
              </div>
            </div>
            <div className="text-center lg:text-right">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {cognitiveData.overallScore}%
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">Overall Cognitive Score</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Study Efficiency", value: cognitiveData.studyEfficiency, icon: Target, color: "from-emerald-400 to-teal-400", bgColor: "from-emerald-50 to-teal-50", textColor: "text-emerald-700" },
              { label: "Retention Rate", value: cognitiveData.retentionRate, icon: Activity, color: "from-blue-400 to-cyan-400", bgColor: "from-blue-50 to-cyan-50", textColor: "text-blue-700" },
              { label: "Understanding", value: cognitiveData.conceptualUnderstanding, icon: Lightbulb, color: "from-amber-400 to-orange-400", bgColor: "from-amber-50 to-orange-50", textColor: "text-amber-700" },
              { label: "Application", value: cognitiveData.applicationSkills, icon: Zap, color: "from-purple-400 to-pink-400", bgColor: "from-purple-50 to-pink-50", textColor: "text-purple-700" }
            ].map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={`group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all duration-300`}
                >
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${metric.color} opacity-20 rounded-bl-2xl`}></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 bg-gradient-to-br ${metric.color} rounded-lg shadow-sm`}>
                        <IconComponent className="w-4 h-4 text-blue-50" />
                      </div>
                      <span className={`text-sm font-medium ${metric.textColor}`}>{metric.label}</span>
                    </div>
                    <div className={`text-2xl font-bold ${metric.textColor}`}>{metric.value}%</div>
                    <div className="mt-2">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <motion.div 
                          className={`h-2 bg-gradient-to-r ${metric.color} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.value}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                        ></motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Elegant Cognitive Analysis Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-1 rounded-2xl">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-xl"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Bloom&apos;s Analysis</span>
              </TabsTrigger>
              <TabsTrigger 
                value="mindmap" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-xl"
              >
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">Cognitive Map</span>
              </TabsTrigger>
              <TabsTrigger 
                value="strengths" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-xl"
              >
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Strengths & Gaps</span>
              </TabsTrigger>
              <TabsTrigger 
                value="pathway" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-xl"
              >
                <Route className="w-4 h-4" />
                <span className="hidden sm:inline">Learning Path</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <BloomsTaxonomyMap levels={cognitiveData.bloomsLevels} />
              </motion.div>
            </TabsContent>

            <TabsContent value="mindmap" className="mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <CognitiveMindMap cognitiveData={cognitiveData} />
              </motion.div>
            </TabsContent>

            <TabsContent value="strengths" className="mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <StrengthWeaknessAnalysis cognitiveData={cognitiveData} />
              </motion.div>
            </TabsContent>

            <TabsContent value="pathway" className="mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <LearningPathRecommendations cognitiveData={cognitiveData} />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}