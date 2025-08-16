"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Brain,
  TrendingUp,
  Lightbulb,
  Target,
  Clock,
  BookOpen,
  Award,
  ArrowRight,
  Sparkles,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

interface AIInsightsPanelProps {
  insights: any;
  learningData: any;
  userId: string;
}

export default function AIInsightsPanel({ 
  insights, 
  learningData, 
  userId 
}: AIInsightsPanelProps) {
  const primaryInsights = insights?.primaryInsights || [];
  const learningRecommendations = insights?.learningRecommendations || [];
  const performanceAnalysis = insights?.performanceAnalysis || {};
  const nextActions = insights?.nextActions || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Main AI Insights Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 border-purple-200/50 dark:border-purple-700/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">AI Learning Insights</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Personalized analysis of your learning journey
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Performance Analysis */}
          {performanceAnalysis && Object.keys(performanceAnalysis).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Learning Velocity</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Pace</span>
                    <span className="font-medium">{performanceAnalysis.learningVelocity || '85%'}</span>
                  </div>
                  <Progress value={parseInt(performanceAnalysis.learningVelocity) || 85} className="h-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {performanceAnalysis.velocityTrend || 'Steady improvement over last 7 days'}
                  </p>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Focus Score</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Concentration</span>
                    <span className="font-medium">{performanceAnalysis.focusScore || '92%'}</span>
                  </div>
                  <Progress value={parseInt(performanceAnalysis.focusScore) || 92} className="h-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {performanceAnalysis.focusTrend || 'Peak focus between 9-11 AM'}
                  </p>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Skill Growth</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>This Month</span>
                    <span className="font-medium">{performanceAnalysis.skillGrowth || '78%'}</span>
                  </div>
                  <Progress value={parseInt(performanceAnalysis.skillGrowth) || 78} className="h-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {performanceAnalysis.growthTrend || 'Strong progress in React & Next.js'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Primary Insights */}
          {primaryInsights.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                Key Insights
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {primaryInsights.slice(0, 4).map((insight: any, index: number) => (
                  <motion.div
                    key={`insight-${insight.title || index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/40 dark:bg-gray-800/40 rounded-lg p-3 border border-gray-200/30 dark:border-gray-700/30"
                  >
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded">
                        <Zap className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {insight.title || `Insight ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {insight.description || insight}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Recommendations */}
          {learningRecommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-green-600" />
                Recommended Actions
              </h4>
              <div className="space-y-2">
                {learningRecommendations.slice(0, 3).map((recommendation: any, index: number) => (
                  <motion.div
                    key={`recommendation-${recommendation.title || index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center justify-between bg-white/60 dark:bg-gray-800/60 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-green-100 dark:bg-green-900/50 rounded">
                        <ArrowRight className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {recommendation.title || recommendation}
                        </p>
                        {recommendation.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {recommendation.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {recommendation.action && (
                      <Button size="sm" variant="outline" className="text-xs">
                        {recommendation.action}
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Next Actions */}
          {nextActions.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                Next Steps for Today
              </h4>
              <div className="flex flex-wrap gap-2">
                {nextActions.slice(0, 3).map((action: any, index: number) => (
                  <Badge 
                    key={`action-${action.title || index}`}
                    variant="secondary" 
                    className="bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300"
                  >
                    {action.title || action}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 