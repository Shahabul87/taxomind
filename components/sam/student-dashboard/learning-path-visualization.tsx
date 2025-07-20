'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Circle, 
  Lock, 
  Brain, 
  BookOpen, 
  Lightbulb,
  Zap,
  Target,
  Sparkles
} from 'lucide-react';
import { BloomsLevel } from '@prisma/client';

interface CognitiveStage {
  level: BloomsLevel;
  mastery: number;
  activities: string[];
  timeEstimate: number;
}

interface LearningGap {
  level: BloomsLevel;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestions: string[];
}

interface LearningPathVisualizationProps {
  currentPath: {
    stages: CognitiveStage[];
    currentStage: number;
    completionPercentage: number;
  };
  recommendedPath?: {
    stages: CognitiveStage[];
    currentStage: number;
    completionPercentage: number;
  };
  gaps?: LearningGap[];
  onActivityClick?: (activity: string) => void;
}

export function LearningPathVisualization({
  currentPath,
  recommendedPath,
  gaps = [],
  onActivityClick,
}: LearningPathVisualizationProps) {
  const getLevelIcon = (level: BloomsLevel) => {
    const icons = {
      REMEMBER: Brain,
      UNDERSTAND: BookOpen,
      APPLY: Zap,
      ANALYZE: Lightbulb,
      EVALUATE: Target,
      CREATE: Sparkles,
    };
    return icons[level] || Brain;
  };

  const getLevelColor = (mastery: number) => {
    if (mastery >= 80) return 'text-green-600 border-green-600';
    if (mastery >= 60) return 'text-yellow-600 border-yellow-600';
    if (mastery >= 40) return 'text-orange-600 border-orange-600';
    return 'text-gray-400 border-gray-400';
  };

  const getStageStatus = (stageIndex: number, currentStage: number, mastery: number) => {
    if (stageIndex < currentStage) return 'completed';
    if (stageIndex === currentStage) return 'current';
    if (stageIndex === currentStage + 1 && mastery > 50) return 'available';
    return 'locked';
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Your Learning Journey</CardTitle>
          <CardDescription>
            Progress through Bloom&apos;s Taxonomy cognitive levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-lg font-bold">
                {currentPath.completionPercentage.toFixed(0)}%
              </span>
            </div>
            <Progress value={currentPath.completionPercentage} className="h-3" />
            <p className="text-sm text-gray-500">
              Currently focusing on: {currentPath.stages[currentPath.currentStage]?.level.charAt(0) + 
                currentPath.stages[currentPath.currentStage]?.level.slice(1).toLowerCase()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Learning Path */}
      <Card>
        <CardHeader>
          <CardTitle>Cognitive Development Path</CardTitle>
          <CardDescription>
            Master each level to unlock the next
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Path Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
            
            {/* Stages */}
            <div className="space-y-8">
              {currentPath.stages.map((stage, index) => {
                const Icon = getLevelIcon(stage.level);
                const status = getStageStatus(index, currentPath.currentStage, stage.mastery);
                const isLocked = status === 'locked';
                const isCurrent = status === 'current';
                const isCompleted = status === 'completed';
                
                return (
                  <div key={stage.level} className="relative flex gap-4">
                    {/* Stage Icon */}
                    <div className={`
                      relative z-10 w-16 h-16 rounded-full border-2 
                      flex items-center justify-center bg-white
                      ${getLevelColor(stage.mastery)}
                      ${isCurrent ? 'ring-4 ring-blue-100' : ''}
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-8 h-8" />
                      ) : isLocked ? (
                        <Lock className="w-6 h-6" />
                      ) : (
                        <Icon className="w-8 h-8" />
                      )}
                    </div>
                    
                    {/* Stage Content */}
                    <div className={`flex-1 ${isLocked ? 'opacity-50' : ''}`}>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">
                            {stage.level.charAt(0) + stage.level.slice(1).toLowerCase()}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={isCurrent ? 'default' : isCompleted ? 'secondary' : 'outline'}>
                              {stage.mastery.toFixed(0)}% Mastery
                            </Badge>
                            {isCurrent && (
                              <Badge variant="default" className="bg-blue-600">
                                Current
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <Progress 
                          value={stage.mastery} 
                          className="h-2 mb-3" 
                        />
                        
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            Estimated time: {stage.timeEstimate} minutes
                          </p>
                          
                          {stage.activities.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1">Activities:</p>
                              <div className="flex flex-wrap gap-2">
                                {stage.activities.map((activity, actIndex) => (
                                  <Button
                                    key={actIndex}
                                    variant="outline"
                                    size="sm"
                                    disabled={isLocked}
                                    onClick={() => onActivityClick?.(activity)}
                                    className="text-xs"
                                  >
                                    {activity}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Gaps */}
      {gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Areas for Improvement</CardTitle>
            <CardDescription>
              Focus on these areas to accelerate your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gaps.map((gap, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    gap.severity === 'high' ? 'border-red-200 bg-red-50' :
                    gap.severity === 'medium' ? 'border-orange-200 bg-orange-50' :
                    'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">
                      {gap.level.charAt(0) + gap.level.slice(1).toLowerCase()} Level
                    </h4>
                    <Badge 
                      variant={
                        gap.severity === 'high' ? 'destructive' :
                        gap.severity === 'medium' ? 'secondary' :
                        'outline'
                      }
                    >
                      {gap.severity} priority
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{gap.description}</p>
                  {gap.suggestions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1">Suggestions:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {gap.suggestions.map((suggestion, sugIndex) => (
                          <li key={sugIndex} className="flex items-start gap-1">
                            <span>•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended vs Current Path */}
      {recommendedPath && (
        <Card>
          <CardHeader>
            <CardTitle>Path Comparison</CardTitle>
            <CardDescription>
              Your progress vs recommended targets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentPath.stages.map((stage, index) => {
                const recommended = recommendedPath.stages[index];
                const difference = stage.mastery - recommended.mastery;
                
                return (
                  <div key={stage.level} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {stage.level.charAt(0) + stage.level.slice(1).toLowerCase()}
                      </span>
                      <span className={`text-sm ${
                        difference >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {difference >= 0 ? '+' : ''}{difference.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Progress value={stage.mastery} className="h-2" />
                      </div>
                      <span className="text-xs text-gray-500">vs</span>
                      <div className="flex-1">
                        <Progress 
                          value={recommended.mastery} 
                          className="h-2 opacity-50" 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}