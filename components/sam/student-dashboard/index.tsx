'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BloomsProgressChart } from './blooms-progress-chart';
import { CognitivePerformanceMetrics } from './cognitive-performance-metrics';
import { LearningPathVisualization } from './learning-path-visualization';
import { SkillsInventory } from './skills-inventory';
import { Brain, BarChart3, Map, Sparkles, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';

interface StudentDashboardProps {
  userId: string;
  courseId?: string;
}

export function StudentDashboard({ userId, courseId }: StudentDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch student progress data
      const progressResponse = await fetch(
        `/api/sam/blooms-analysis/student?studentId=${userId}${courseId ? `&courseId=${courseId}` : ''}`
      );
      
      if (!progressResponse.ok) {
        throw new Error('Failed to fetch student progress');
      }
      
      const progressData = await progressResponse.json();
      setDashboardData(progressData.data);
      
    } catch (error) {
      logger.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, courseId, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData();
    toast({
      title: 'Refreshing',
      description: 'Updating your learning data...',
    });
  };

  const handleActivityClick = (activity: string) => {
    toast({
      title: 'Activity Selected',
      description: `Opening ${activity}...`,
    });
    // Navigate to the activity or open in modal
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading your learning dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">No data available yet. Start learning to see your progress!</p>
        </CardContent>
      </Card>
    );
  }

  const {
    studentProgress,
    cognitiveProfile,
    performanceMetrics,
    recentPerformance,
  } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Learning Dashboard</h1>
          <p className="text-gray-500">
            Track your cognitive development and learning progress
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Cognitive Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold">
                {cognitiveProfile?.overallCognitiveLevel?.toFixed(0) || 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Strongest Area</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-green-600" />
              <span className="text-lg font-medium">
                {studentProgress?.strengthAreas?.[0]?.charAt(0) + 
                 studentProgress?.strengthAreas?.[0]?.slice(1).toLowerCase() || 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Learning Style</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <span className="text-lg font-medium capitalize">
                {cognitiveProfile?.optimalLearningStyle || 'Mixed'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Activities Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Map className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold">
                {recentPerformance?.length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="path">Learning Path</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          {studentProgress && (
            <BloomsProgressChart
              bloomsScores={studentProgress.bloomsScores || {}}
              strengthAreas={studentProgress.strengthAreas || []}
              weaknessAreas={studentProgress.weaknessAreas || []}
              overallLevel={cognitiveProfile?.overallCognitiveLevel || 0}
            />
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {performanceMetrics && (
            <CognitivePerformanceMetrics
              performanceMetrics={performanceMetrics}
              recentPerformance={recentPerformance || []}
              learningTrajectory={cognitiveProfile?.learningTrajectory}
            />
          )}
        </TabsContent>

        <TabsContent value="path" className="space-y-4">
          {cognitiveProfile && (
            <LearningPathVisualization
              currentPath={{
                stages: buildLearningPathStages(studentProgress?.bloomsScores || {}),
                currentStage: getCurrentStage(studentProgress?.bloomsScores || {}),
                completionPercentage: cognitiveProfile.overallCognitiveLevel || 0,
              }}
              gaps={identifyLearningGaps(studentProgress)}
              onActivityClick={handleActivityClick}
            />
          )}
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          {cognitiveProfile && (
            <SkillsInventory
              skillsInventory={cognitiveProfile.skillsInventory || {
                criticalThinking: 0,
                creativity: 0,
                problemSolving: 0,
                comprehension: 0,
                retention: 0,
              }}
              performancePatterns={cognitiveProfile.performancePatterns}
              optimalLearningStyle={cognitiveProfile.optimalLearningStyle}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
function buildLearningPathStages(bloomsScores: any) {
  const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  
  return levels.map(level => ({
    level: level as any,
    mastery: bloomsScores[level] || 0,
    activities: getActivitiesForLevel(level),
    timeEstimate: 30 + (levels.indexOf(level) * 15),
  }));
}

function getCurrentStage(bloomsScores: any) {
  const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  
  for (let i = levels.length - 1; i >= 0; i--) {
    if ((bloomsScores[levels[i]] || 0) > 50) {
      return i;
    }
  }
  
  return 0;
}

function getActivitiesForLevel(level: string) {
  const activities: Record<string, string[]> = {
    REMEMBER: ['Flashcards', 'Quizzes', 'Memory Games'],
    UNDERSTAND: ['Concept Maps', 'Summaries', 'Discussions'],
    APPLY: ['Practice Problems', 'Case Studies', 'Simulations'],
    ANALYZE: ['Comparisons', 'Research', 'Data Analysis'],
    EVALUATE: ['Critiques', 'Debates', 'Reviews'],
    CREATE: ['Projects', 'Presentations', 'Original Work'],
  };
  
  return activities[level] || [];
}

function identifyLearningGaps(studentProgress: any) {
  if (!studentProgress) return [];
  
  const gaps = [];
  const weakAreas = studentProgress.weaknessAreas || [];
  
  weakAreas.forEach((area: string) => {
    gaps.push({
      level: area as any,
      severity: 'medium' as const,
      description: `Your ${area.toLowerCase()} skills need improvement`,
      suggestions: [
        `Practice more ${area.toLowerCase()}-focused activities`,
        `Review ${area.toLowerCase()} concepts`,
        `Complete ${area.toLowerCase()} assessments`,
      ],
    });
  });
  
  return gaps;
}