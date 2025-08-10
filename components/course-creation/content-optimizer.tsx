"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logger } from '@/lib/logger';
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  ArrowRight,
  Loader2,
  Zap,
  BarChart3,
  Lightbulb,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OptimizationResult {
  originalScore: number;
  optimizedScore: number;
  improvements: {
    title?: {
      original: string;
      optimized: string;
      improvements: string[];
      seoKeywords: string[];
    };
    description?: {
      original: string;
      optimized: string;
      improvements: string[];
      readabilityScore: number;
    };
    learningObjectives?: {
      original: string[];
      optimized: string[];
      improvements: string[];
      bloomsAlignment: Record<string, number>;
    };
  };
  analytics: {
    readabilityImprovement: number;
    seoScoreImprovement: number;
    engagementPotential: number;
    marketingAppeal: number;
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    action: string;
    impact: string;
  }[];
}

interface ContentOptimizerProps {
  content: {
    title?: string;
    description?: string;
    learningObjectives?: string[];
    targetAudience?: string;
    category?: string;
    difficulty?: string;
    courseIntent?: string;
  };
  onApplyOptimizations?: (optimizations: any) => void;
  className?: string;
}

export const ContentOptimizer = ({
  content = {},
  onApplyOptimizations,
  className
}: ContentOptimizerProps) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['seo', 'engagement', 'clarity']);

  const optimizationGoals = [
    { id: 'seo', label: 'SEO Optimization', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'engagement', label: 'Engagement', icon: <Zap className="h-4 w-4" /> },
    { id: 'clarity', label: 'Clarity', icon: <Target className="h-4 w-4" /> },
    { id: 'conversion', label: 'Conversion', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'educational_quality', label: 'Educational Quality', icon: <Star className="h-4 w-4" /> }
  ];

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const runOptimization = async (type: 'title' | 'description' | 'learning_objectives' | 'comprehensive') => {
    if (selectedGoals.length === 0) {
      toast.error("Please select at least one optimization goal");
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await fetch('/api/ai/content-optimizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          content,
          optimizationGoals: selectedGoals
        }),
      });

      if (!response.ok) {
        throw new Error('Optimization failed');
      }

      const result = await response.json();
      setOptimizationResult(result);
      toast.success("Content optimization complete!");
    } catch (error) {
      logger.error('Optimization error:', error);
      toast.error("Failed to optimize content. Please try again.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const applyOptimization = (field: string, value: any) => {
    if (onApplyOptimizations) {
      onApplyOptimizations({ [field]: value });
      toast.success(`${field} optimization applied!`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getScoreImprovement = () => {
    if (!optimizationResult) return 0;
    return optimizationResult.optimizedScore - optimizationResult.originalScore;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          AI Content Optimizer
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Optimization Goals Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Optimization Goals
          </h4>
          <div className="flex flex-wrap gap-2">
            {optimizationGoals.map((goal) => (
              <Button
                key={goal.id}
                variant={selectedGoals.includes(goal.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleGoal(goal.id)}
                className="text-xs"
              >
                {goal.icon}
                {goal.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runOptimization('title')}
            disabled={isOptimizing || !content.title}
            className="text-xs"
          >
            {isOptimizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Target className="h-3 w-3" />}
            Title
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => runOptimization('description')}
            disabled={isOptimizing || !content.description}
            className="text-xs"
          >
            {isOptimizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Target className="h-3 w-3" />}
            Description
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => runOptimization('learning_objectives')}
            disabled={isOptimizing || !content.learningObjectives?.length}
            className="text-xs"
          >
            {isOptimizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Target className="h-3 w-3" />}
            Objectives
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => runOptimization('comprehensive')}
            disabled={isOptimizing}
            className="text-xs bg-purple-600 hover:bg-purple-700"
          >
            {isOptimizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            All
          </Button>
        </div>

        {/* Optimization Results */}
        {optimizationResult && (
          <div className="space-y-4">
            {/* Score Improvement */}
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    Quality Score: {optimizationResult.originalScore} → {optimizationResult.optimizedScore}
                  </span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    +{getScoreImprovement()} points
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>

            {/* Analytics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  +{optimizationResult.analytics.readabilityImprovement}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Readability</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  +{optimizationResult.analytics.seoScoreImprovement}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">SEO Score</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  {optimizationResult.analytics.engagementPotential}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Engagement</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  {optimizationResult.analytics.marketingAppeal}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Appeal</div>
              </div>
            </div>

            {/* Improvements Tabs */}
            <Tabs defaultValue="improvements" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="improvements">Optimizations</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="improvements" className="space-y-4">
                {/* Title Optimization */}
                {optimizationResult.improvements.title && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900 dark:text-white">Title Optimization</h5>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyOptimization('title', optimizationResult.improvements.title!.optimized)}
                      >
                        Apply
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded border border-red-200 dark:border-red-800">
                        <div className="text-xs text-red-600 dark:text-red-400 mb-1">Original:</div>
                        <div className="text-sm text-red-800 dark:text-red-300">{optimizationResult.improvements.title.original}</div>
                      </div>
                      
                      <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded border border-green-200 dark:border-green-800">
                        <div className="text-xs text-green-600 dark:text-green-400 mb-1">Optimized:</div>
                        <div className="text-sm text-green-800 dark:text-green-300 font-medium">{optimizationResult.improvements.title.optimized}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Improvements:</div>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {optimizationResult.improvements.title.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {optimizationResult.improvements.title.seoKeywords.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">SEO Keywords:</div>
                        <div className="flex flex-wrap gap-1">
                          {optimizationResult.improvements.title.seoKeywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Description Optimization */}
                {optimizationResult.improvements.description && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900 dark:text-white">Description Optimization</h5>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyOptimization('description', optimizationResult.improvements.description!.optimized)}
                      >
                        Apply
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded border border-red-200 dark:border-red-800 max-h-32 overflow-y-auto">
                        <div className="text-xs text-red-600 dark:text-red-400 mb-1">Original:</div>
                        <div className="text-sm text-red-800 dark:text-red-300">{optimizationResult.improvements.description.original}</div>
                      </div>
                      
                      <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded border border-green-200 dark:border-green-800 max-h-32 overflow-y-auto">
                        <div className="text-xs text-green-600 dark:text-green-400 mb-1">Optimized:</div>
                        <div className="text-sm text-green-800 dark:text-green-300 font-medium">{optimizationResult.improvements.description.optimized}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Improvements:</div>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {optimizationResult.improvements.description.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Readability Score:</span>
                      <Badge variant="secondary">
                        {optimizationResult.improvements.description.readabilityScore}/100
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Learning Objectives Optimization */}
                {optimizationResult.improvements.learningObjectives && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900 dark:text-white">Learning Objectives Optimization</h5>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyOptimization('learningObjectives', optimizationResult.improvements.learningObjectives!.optimized)}
                      >
                        Apply
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Optimized Objectives:</div>
                      <ul className="space-y-2">
                        {optimizationResult.improvements.learningObjectives.optimized.map((objective, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Target className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-800 dark:text-gray-200">{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {Object.keys(optimizationResult.improvements.learningObjectives.bloomsAlignment).length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Bloom&apos;s Taxonomy Distribution:</div>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(optimizationResult.improvements.learningObjectives.bloomsAlignment).map(([level, percentage]) => (
                            <div key={level} className="text-center">
                              <div className="text-xs font-medium text-gray-900 dark:text-white">{level}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">{percentage}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-3">
                {optimizationResult.recommendations.map((rec, index) => (
                  <Alert key={index} className={cn("py-3", getPriorityColor(rec.priority))}>
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {rec.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {rec.priority} priority
                          </Badge>
                        </div>
                        <AlertDescription className="text-sm font-medium mb-1">
                          {rec.action}
                        </AlertDescription>
                        <div className="text-xs opacity-80">
                          Expected impact: {rec.impact}
                        </div>
                      </div>
                    </div>
                  </Alert>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};