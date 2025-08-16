"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { logger } from '@/lib/logger';
import { 
  Brain,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Eye,
  Settings,
  Award,
  Lightbulb,
  BarChart3,
  Users,
  Clock,
  Zap,
  ArrowRight,
  Info,
  Layers,
  Route,
  MapPin,
  Flag,
  Star,
  RefreshCw,
  Download,
  Share,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CourseStructure {
  id: string;
  title: string;
  chapters: {
    id: string;
    title: string;
    bloomsLevel?: string;
    sections: {
      id: string;
      title: string;
      bloomsLevel?: string;
      contentType?: string;
      isPublished: boolean;
    }[];
  }[];
}

interface BloomsAnalysis {
  level: BloomsLevel;
  percentage: number;
  sectionCount: number;
  gaps: string[];
  recommendations: string[];
  progression: {
    current: number;
    optimal: number;
    difference: number;
  };
}

type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

interface BloomsProgressTrackerProps {
  courseId: string;
  courseStructure: CourseStructure;
  view?: 'teacher' | 'student';
}

const BLOOM_LEVELS = [
  {
    level: 'REMEMBER' as BloomsLevel,
    label: 'Remember',
    description: 'Recall facts and basic concepts',
    icon: BookOpen,
    color: '#3B82F6',
    optimalPercentage: 20,
    prerequisites: []
  },
  {
    level: 'UNDERSTAND' as BloomsLevel,
    label: 'Understand',
    description: 'Explain ideas and concepts',
    icon: Eye,
    color: '#10B981',
    optimalPercentage: 25,
    prerequisites: ['REMEMBER']
  },
  {
    level: 'APPLY' as BloomsLevel,
    label: 'Apply',
    description: 'Use information in new situations',
    icon: Settings,
    color: '#F59E0B',
    optimalPercentage: 20,
    prerequisites: ['REMEMBER', 'UNDERSTAND']
  },
  {
    level: 'ANALYZE' as BloomsLevel,
    label: 'Analyze',
    description: 'Draw connections among ideas',
    icon: Target,
    color: '#F97316',
    optimalPercentage: 15,
    prerequisites: ['REMEMBER', 'UNDERSTAND', 'APPLY']
  },
  {
    level: 'EVALUATE' as BloomsLevel,
    label: 'Evaluate',
    description: 'Justify decisions and actions',
    icon: Award,
    color: '#EF4444',
    optimalPercentage: 10,
    prerequisites: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE']
  },
  {
    level: 'CREATE' as BloomsLevel,
    label: 'Create',
    description: 'Produce new or original work',
    icon: Lightbulb,
    color: '#8B5CF6',
    optimalPercentage: 10,
    prerequisites: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE']
  }
];

export const BloomsTaxonomyProgressTracker = ({ 
  courseId, 
  courseStructure, 
  view = 'teacher' 
}: BloomsProgressTrackerProps) => {
  const [analysis, setAnalysis] = useState<BloomsAnalysis[]>([]);
  const [overallHealth, setOverallHealth] = useState<'excellent' | 'good' | 'needs-improvement' | 'poor'>('good');
  const [selectedLevel, setSelectedLevel] = useState<BloomsLevel | null>(null);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getContentTypeForLevel = useCallback((level: BloomsLevel): string => {
    const contentTypes = {
      REMEMBER: 'flashcards, quizzes, and fact-based exercises',
      UNDERSTAND: 'explanations, summaries, and concept mapping',
      APPLY: 'practice problems, simulations, and demonstrations',
      ANALYZE: 'case studies, comparisons, and investigation tasks',
      EVALUATE: 'critiques, assessments, and judgment exercises',
      CREATE: 'projects, designs, and original compositions'
    };
    
    return contentTypes[level];
  }, []);

  const generateGaps = useCallback((
    level: BloomsLevel, 
    current: number, 
    optimal: number, 
    structure: CourseStructure,
    currentAnalysis?: BloomsAnalysis[]
  ): string[] => {
    const gaps: string[] = [];
    
    if (current < optimal * 0.5) {
      gaps.push(`Significantly under-represented (${Math.round(current)}% vs ${optimal}% optimal)`);
    } else if (current < optimal * 0.8) {
      gaps.push(`Below optimal distribution (${Math.round(current)}% vs ${optimal}% optimal)`);
    }
    
    if (current > optimal * 1.5) {
      gaps.push(`Over-represented - consider balancing with other levels`);
    }
    
    // Check for prerequisite gaps - use currentAnalysis to avoid circular dependency
    if (currentAnalysis && currentAnalysis.length > 0) {
      const levelIndex = BLOOM_LEVELS.findIndex(l => l.level === level);
      if (levelIndex > 0) {
        const prerequisites = BLOOM_LEVELS[levelIndex].prerequisites;
        const currentLevelData = currentAnalysis.find(a => a.level === level);
        
        prerequisites.forEach(prereq => {
          const prereqData = currentAnalysis.find(a => a.level === prereq);
          if (prereqData && currentLevelData && prereqData.percentage < currentLevelData.percentage) {
            gaps.push(`Insufficient ${prereq.toLowerCase()} foundation for effective ${level.toLowerCase()} learning`);
          }
        });
      }
    }
    
    return gaps;
  }, []);

  const generateRecommendations = useCallback((
    level: BloomsLevel, 
    difference: number, 
    count: number, 
    total: number
  ): string[] => {
    const recommendations: string[] = [];
    
    if (difference < -10) {
      recommendations.push(`Add ${Math.ceil((Math.abs(difference) / 100) * total)} more ${level.toLowerCase()} sections`);
      recommendations.push(`Focus on ${getContentTypeForLevel(level)} activities`);
    } else if (difference < -5) {
      recommendations.push(`Consider adding 1-2 more ${level.toLowerCase()} activities`);
    }
    
    if (difference > 15) {
      recommendations.push(`Reduce emphasis on ${level.toLowerCase()} - move some content to other levels`);
      recommendations.push(`Balance with foundational or higher-order thinking activities`);
    }
    
    if (count === 0) {
      recommendations.push(`Missing ${level.toLowerCase()} level entirely - critical gap to address`);
      recommendations.push(`Start with basic ${getContentTypeForLevel(level)} exercises`);
    }
    
    return recommendations;
  }, [getContentTypeForLevel]);

  const analyzeBloomsDistribution = useCallback(() => {
    setIsLoading(true);
    
    try {
      const totalSections = courseStructure.chapters.reduce(
        (sum, chapter) => sum + chapter.sections.length, 
        0
      );
      
      if (totalSections === 0) {
        setAnalysis([]);
        setOverallHealth('poor');
        setIsLoading(false);
        return;
      }

      const bloomsCount: Record<BloomsLevel, number> = {
        REMEMBER: 0,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0
      };

      // Count sections by Bloom's level
      courseStructure.chapters.forEach(chapter => {
        chapter.sections.forEach(section => {
          const level = section.bloomsLevel as BloomsLevel;
          if (level && bloomsCount[level] !== undefined) {
            bloomsCount[level]++;
          } else {
            // Default to UNDERSTAND if no level specified
            bloomsCount.UNDERSTAND++;
          }
        });
      });

      // First pass: generate basic analysis without gaps (to avoid circular dependency)
      const basicAnalysis: BloomsAnalysis[] = BLOOM_LEVELS.map(levelInfo => {
        const count = bloomsCount[levelInfo.level];
        const percentage = (count / totalSections) * 100;
        const optimal = levelInfo.optimalPercentage;
        const difference = percentage - optimal;

        return {
          level: levelInfo.level,
          percentage,
          sectionCount: count,
          gaps: [], // Will be filled in second pass
          recommendations: generateRecommendations(levelInfo.level, difference, count, totalSections),
          progression: {
            current: percentage,
            optimal,
            difference
          }
        };
      });

      // Second pass: generate gaps using the basic analysis
      const finalAnalysis: BloomsAnalysis[] = basicAnalysis.map(levelData => ({
        ...levelData,
        gaps: generateGaps(levelData.level, levelData.percentage, levelData.progression.optimal, courseStructure, basicAnalysis)
      }));

      setAnalysis(finalAnalysis);
      
      // Calculate overall health
      const healthScore = calculateOverallHealth(finalAnalysis);
      setOverallHealth(healthScore);
      
    } catch (error) {
      logger.error('Error analyzing Bloom\'s distribution:', error);
    } finally {
      setIsLoading(false);
    }
  }, [courseStructure, generateRecommendations, generateGaps]);

  useEffect(() => {
    analyzeBloomsDistribution();
  }, [analyzeBloomsDistribution]);

  const calculateOverallHealth = (analysisData: BloomsAnalysis[]): 'excellent' | 'good' | 'needs-improvement' | 'poor' => {
    const totalDifference = analysisData.reduce((sum, item) => sum + Math.abs(item.progression.difference), 0);
    const avgDifference = totalDifference / analysisData.length;
    
    const missingLevels = analysisData.filter(item => item.sectionCount === 0).length;
    
    if (missingLevels > 2 || avgDifference > 20) return 'poor';
    if (missingLevels > 1 || avgDifference > 15) return 'needs-improvement';
    if (avgDifference > 8) return 'good';
    return 'excellent';
  };

  const getHealthColor = (health: typeof overallHealth) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const OverallHealthCard = () => (
    <Card className={cn("border-2", getHealthColor(overallHealth))}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Cognitive Balance Score
        </CardTitle>
        <CardDescription>
          Overall assessment of Bloom&apos;s taxonomy distribution in your course
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold capitalize">{overallHealth.replace('-', ' ')}</div>
            <div className="text-sm text-gray-600">
              {overallHealth === 'excellent' && 'Optimal cognitive progression'}
              {overallHealth === 'good' && 'Well-balanced with minor improvements possible'}
              {overallHealth === 'needs-improvement' && 'Some gaps need attention'}
              {overallHealth === 'poor' && 'Significant restructuring recommended'}
            </div>
          </div>
          <div className="text-right">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDetailedAnalysis(true)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Detailed Report
            </Button>
          </div>
        </div>
        
        {overallHealth !== 'excellent' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {overallHealth === 'poor' && 'Your course has significant cognitive gaps. Consider restructuring content to ensure proper learning progression.'}
              {overallHealth === 'needs-improvement' && 'Some cognitive levels are under or over-represented. Balance your content for better learning outcomes.'}
              {overallHealth === 'good' && 'Your course structure is solid with room for minor optimizations.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const BloomsLevelCard = ({ levelData }: { levelData: BloomsAnalysis }) => {
    const levelInfo = BLOOM_LEVELS.find(l => l.level === levelData.level)!;
    const IconComponent = levelInfo.icon;
    const isDeficient = levelData.progression.difference < -5;
    const isExcessive = levelData.progression.difference > 15;
    const isMissing = levelData.sectionCount === 0;

    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          isMissing && "border-red-200 bg-red-50/30",
          isDeficient && !isMissing && "border-yellow-200 bg-yellow-50/30",
          isExcessive && "border-orange-200 bg-orange-50/30",
          selectedLevel === levelData.level && "ring-2 ring-blue-500"
        )}
        onClick={() => setSelectedLevel(selectedLevel === levelData.level ? null : levelData.level)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${levelInfo.color}20` }}
              >
                <IconComponent 
                  className="h-5 w-5" 
                  style={{ color: levelInfo.color }}
                />
              </div>
              <div>
                <CardTitle className="text-lg">{levelInfo.label}</CardTitle>
                <CardDescription className="text-sm">
                  {levelInfo.description}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color: levelInfo.color }}>
                {Math.round(levelData.percentage)}%
              </div>
              <div className="text-xs text-gray-500">
                {levelData.sectionCount} sections
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Current vs Optimal</span>
                <span>{levelInfo.optimalPercentage}% optimal</span>
              </div>
              <Progress 
                value={levelData.percentage} 
                className="h-2"
                style={{ 
                  '--progress-foreground': levelInfo.color,
                } as React.CSSProperties}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>
                  {levelData.progression.difference > 0 ? '+' : ''}
                  {Math.round(levelData.progression.difference)}% difference
                </span>
                <span>
                  Target: {levelInfo.optimalPercentage}%
                </span>
              </div>
            </div>

            {(isMissing || isDeficient || isExcessive) && (
              <div className="space-y-2">
                {levelData.gaps.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-1">Issues:</div>
                    {levelData.gaps.slice(0, 2).map((gap, index) => (
                      <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        • {gap}
                      </div>
                    ))}
                  </div>
                )}
                
                {levelData.recommendations.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-1">Recommendations:</div>
                    {levelData.recommendations.slice(0, 1).map((rec, index) => (
                      <div key={index} className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        💡 {rec}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedLevel === levelData.level && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t pt-3 mt-3"
              >
                <div className="space-y-2">
                  <div className="text-sm font-medium">All Recommendations:</div>
                  {levelData.recommendations.map((rec, index) => (
                    <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                      {index + 1}. {rec}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const ProgressionPathway = () => {
    const pathwayData = BLOOM_LEVELS.map(level => {
      const analysisData = analysis.find(a => a.level === level.level);
      return {
        ...level,
        current: analysisData?.percentage || 0,
        status: analysisData?.sectionCount === 0 ? 'missing' :
                (analysisData?.progression?.difference ?? 0) < -5 ? 'deficient' :
                (analysisData?.progression?.difference ?? 0) > 15 ? 'excessive' : 'balanced'
      };
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-purple-600" />
            Cognitive Learning Pathway
          </CardTitle>
          <CardDescription>
            Visual representation of knowledge progression through Bloom&apos;s taxonomy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pathwayData.map((level, index) => {
              const IconComponent = level.icon;
              const isConnected = index < pathwayData.length - 1;
              
              return (
                <div key={level.level} className="relative">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div 
                        className={cn(
                          "p-3 rounded-full border-2",
                          level.status === 'missing' ? 'border-red-300 bg-red-50' :
                          level.status === 'deficient' ? 'border-yellow-300 bg-yellow-50' :
                          level.status === 'excessive' ? 'border-orange-300 bg-orange-50' :
                          'border-green-300 bg-green-50'
                        )}
                      >
                        <IconComponent 
                          className="h-6 w-6" 
                          style={{ color: level.color }}
                        />
                      </div>
                      {isConnected && (
                        <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700 mt-2" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold">{level.label}</div>
                          <div className="text-sm text-gray-600">{level.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold" style={{ color: level.color }}>
                            {Math.round(level.current)}%
                          </div>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "text-xs",
                              level.status === 'missing' ? 'border-red-300 text-red-700' :
                              level.status === 'deficient' ? 'border-yellow-300 text-yellow-700' :
                              level.status === 'excessive' ? 'border-orange-300 text-orange-700' :
                              'border-green-300 text-green-700'
                            )}
                          >
                            {level.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <Progress 
                        value={level.current} 
                        max={level.optimalPercentage * 2}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Optimal: {level.optimalPercentage}%</span>
                        <span>Current: {Math.round(level.current)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 animate-pulse text-blue-600" />
          <span>Analyzing cognitive progression...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-600" />
            Bloom&apos;s Taxonomy Progress Tracker
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Optimize cognitive learning progression in your course
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={analyzeBloomsDistribution}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <OverallHealthCard />

      <Tabs defaultValue="levels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="levels">Cognitive Levels</TabsTrigger>
          <TabsTrigger value="pathway">Learning Pathway</TabsTrigger>
        </TabsList>

        <TabsContent value="levels" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {analysis.map(levelData => (
              <BloomsLevelCard key={levelData.level} levelData={levelData} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pathway" className="space-y-4">
          <ProgressionPathway />
        </TabsContent>
      </Tabs>

      {/* Detailed Analysis Modal */}
      <Dialog open={showDetailedAnalysis} onOpenChange={setShowDetailedAnalysis}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detailed Bloom&apos;s Taxonomy Analysis</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* This would contain comprehensive analysis, recommendations, and action plans */}
            <div className="text-center py-8 text-gray-500">
              Detailed analysis and actionable recommendations would be displayed here
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};