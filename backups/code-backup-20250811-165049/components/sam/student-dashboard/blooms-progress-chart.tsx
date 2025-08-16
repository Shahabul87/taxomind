'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Brain, Target, Trophy, TrendingUp } from 'lucide-react';
import { BloomsLevel } from '@prisma/client';

interface BloomsProgressChartProps {
  bloomsScores: Record<BloomsLevel, number>;
  strengthAreas: string[];
  weaknessAreas: string[];
  overallLevel?: number;
}

export function BloomsProgressChart({
  bloomsScores,
  strengthAreas,
  weaknessAreas,
  overallLevel = 0,
}: BloomsProgressChartProps) {
  // Prepare data for radar chart
  const chartData = [
    { level: 'Remember', score: bloomsScores.REMEMBER || 0, fullMark: 100 },
    { level: 'Understand', score: bloomsScores.UNDERSTAND || 0, fullMark: 100 },
    { level: 'Apply', score: bloomsScores.APPLY || 0, fullMark: 100 },
    { level: 'Analyze', score: bloomsScores.ANALYZE || 0, fullMark: 100 },
    { level: 'Evaluate', score: bloomsScores.EVALUATE || 0, fullMark: 100 },
    { level: 'Create', score: bloomsScores.CREATE || 0, fullMark: 100 },
  ];

  const getBloomsLevelDescription = (level: string): string => {
    const descriptions: Record<string, string> = {
      REMEMBER: 'Recall facts and basic concepts',
      UNDERSTAND: 'Explain ideas or concepts',
      APPLY: 'Use information in new situations',
      ANALYZE: 'Draw connections among ideas',
      EVALUATE: 'Justify a stand or decision',
      CREATE: 'Produce new or original work',
    };
    return descriptions[level] || '';
  };

  const getBloomsLevelIcon = (level: string) => {
    switch (level) {
      case 'REMEMBER':
        return '🧠';
      case 'UNDERSTAND':
        return '💡';
      case 'APPLY':
        return '⚙️';
      case 'ANALYZE':
        return '🔍';
      case 'EVALUATE':
        return '⚖️';
      case 'CREATE':
        return '🎨';
      default:
        return '📚';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Cognitive Development Overview
          </CardTitle>
          <CardDescription>
            Your progress across Bloom&apos;s Taxonomy levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Cognitive Level</span>
              <span className="text-2xl font-bold">{overallLevel.toFixed(0)}%</span>
            </div>
            <Progress value={overallLevel} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Bloom&apos;s Taxonomy Profile</CardTitle>
          <CardDescription>
            Visual representation of your cognitive skill distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="level" className="text-xs" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.5}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Individual Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Progress by Level</CardTitle>
          <CardDescription>
            Track your mastery of each cognitive level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(bloomsScores).map(([level, score]) => (
              <div key={level} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getBloomsLevelIcon(level)}</span>
                    <div>
                      <p className="font-medium">{level.charAt(0) + level.slice(1).toLowerCase()}</p>
                      <p className="text-xs text-gray-500">
                        {getBloomsLevelDescription(level)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{score.toFixed(0)}%</span>
                </div>
                <Progress 
                  value={score} 
                  className="h-2"
                  style={{
                    '--progress-background': score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444',
                  } as React.CSSProperties}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-green-600" />
              Your Strengths
            </CardTitle>
            <CardDescription>
              Areas where you excel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {strengthAreas.length > 0 ? (
              <ul className="space-y-2">
                {strengthAreas.map((area, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm">
                      {area.charAt(0) + area.slice(1).toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                Keep practicing to identify your strengths!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              Areas for Improvement
            </CardTitle>
            <CardDescription>
              Focus on these areas to grow
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weaknessAreas.length > 0 ? (
              <ul className="space-y-2">
                {weaknessAreas.map((area, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-orange-600">!</span>
                    <span className="text-sm">
                      {area.charAt(0) + area.slice(1).toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                You&apos;re doing great! Keep up the good work.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}