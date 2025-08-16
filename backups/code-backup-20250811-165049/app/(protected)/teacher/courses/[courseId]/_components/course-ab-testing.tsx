"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart3,
  Target,
  Users,
  TrendingUp,
  Play,
  Pause,
  StopCircle,
  Settings,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  type: 'content' | 'layout' | 'interaction' | 'assessment';
  startDate: string;
  endDate?: string;
  participants: number;
  variants: {
    id: string;
    name: string;
    description: string;
    participants: number;
    conversionRate: number;
    engagementScore: number;
    completionRate: number;
  }[];
  results: {
    statisticalSignificance: number;
    confidenceInterval: number;
    recommendedAction: string;
    winner?: string;
  };
}

interface CourseABTestingProps {
  courseId: string;
  courseTitle: string;
}

export const CourseABTesting = ({ courseId, courseTitle }: CourseABTestingProps) => {
  const [tests, setTests] = useState<ABTest[]>([
    {
      id: 'test-1',
      name: 'Video vs Interactive Content',
      description: 'Testing whether interactive content performs better than traditional video lectures',
      status: 'running',
      type: 'content',
      startDate: '2024-01-15',
      participants: 120,
      variants: [
        {
          id: 'variant-a',
          name: 'Traditional Videos',
          description: 'Standard video lectures with slides',
          participants: 60,
          conversionRate: 73.2,
          engagementScore: 6.8,
          completionRate: 78.5
        },
        {
          id: 'variant-b',
          name: 'Interactive Content',
          description: 'Interactive simulations and exercises',
          participants: 60,
          conversionRate: 81.4,
          engagementScore: 8.2,
          completionRate: 85.1
        }
      ],
      results: {
        statisticalSignificance: 95.2,
        confidenceInterval: 3.1,
        recommendedAction: 'Implement interactive content',
        winner: 'variant-b'
      }
    },
    {
      id: 'test-2',
      name: 'Quiz Frequency Test',
      description: 'Testing optimal frequency of knowledge check quizzes',
      status: 'completed',
      type: 'assessment',
      startDate: '2024-01-01',
      endDate: '2024-01-30',
      participants: 180,
      variants: [
        {
          id: 'variant-a',
          name: 'Weekly Quizzes',
          description: 'One quiz per week',
          participants: 60,
          conversionRate: 68.3,
          engagementScore: 7.1,
          completionRate: 72.4
        },
        {
          id: 'variant-b',
          name: 'Bi-weekly Quizzes',
          description: 'One quiz every two weeks',
          participants: 60,
          conversionRate: 71.8,
          engagementScore: 7.5,
          completionRate: 76.2
        },
        {
          id: 'variant-c',
          name: 'After Each Section',
          description: 'Quiz after completing each section',
          participants: 60,
          conversionRate: 79.6,
          engagementScore: 8.0,
          completionRate: 82.1
        }
      ],
      results: {
        statisticalSignificance: 97.8,
        confidenceInterval: 2.8,
        recommendedAction: 'Implement section-based quizzes',
        winner: 'variant-c'
      }
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content': return <Eye className="h-4 w-4" />;
      case 'layout': return <Settings className="h-4 w-4" />;
      case 'interaction': return <Users className="h-4 w-4" />;
      case 'assessment': return <Target className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const TestCard = ({ test }: { test: ABTest }) => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getTypeIcon(test.type)}
            <div>
              <CardTitle className="text-lg">{test.name}</CardTitle>
              <CardDescription>{test.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(test.status)}>
              {test.status}
            </Badge>
            {test.status === 'running' && (
              <div className="flex gap-1">
                <Button size="sm" variant="outline">
                  <Pause className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <StopCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Test Overview */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{test.participants}</div>
              <div className="text-sm text-gray-600">Participants</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {test.results.statisticalSignificance}%
              </div>
              <div className="text-sm text-gray-600">Significance</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {test.results.confidenceInterval}%
              </div>
              <div className="text-sm text-gray-600">Confidence</div>
            </div>
          </div>

          {/* Variants Comparison */}
          <div className="space-y-3">
            <h4 className="font-medium">Variant Performance</h4>
            {test.variants.map((variant) => (
              <div key={variant.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium">{variant.name}</h5>
                    {test.results.winner === variant.id && (
                      <Badge className="bg-green-100 text-green-800">Winner</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {variant.participants} participants
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Conversion Rate</div>
                    <div className="font-medium">{variant.conversionRate}%</div>
                    <Progress value={variant.conversionRate} className="h-2 mt-1" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Engagement</div>
                    <div className="font-medium">{variant.engagementScore}/10</div>
                    <Progress value={variant.engagementScore * 10} className="h-2 mt-1" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Completion</div>
                    <div className="font-medium">{variant.completionRate}%</div>
                    <Progress value={variant.completionRate} className="h-2 mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Results and Recommendations */}
          {test.status === 'completed' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Recommendation:</strong> {test.results.recommendedAction}
              </AlertDescription>
            </Alert>
          )}

          {test.status === 'running' && test.results.statisticalSignificance > 95 && (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <strong>Early Indication:</strong> {test.results.recommendedAction} 
                (Statistical significance reached)
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            A/B Testing Dashboard
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Optimize course content through data-driven experimentation
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure Test
          </Button>
          <Button size="sm">
            <Play className="h-4 w-4 mr-2" />
            Start New Test
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Tests</p>
                <p className="text-2xl font-bold text-green-600">
                  {tests.filter(t => t.status === 'running').length}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Tests</p>
                <p className="text-2xl font-bold text-blue-600">
                  {tests.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-purple-600">
                  {tests.reduce((sum, test) => sum + test.participants, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Improvement</p>
                <p className="text-2xl font-bold text-orange-600">+12.3%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Test Results</h3>
        {tests.map((test) => (
          <TestCard key={test.id} test={test} />
        ))}
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Key Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Interactive content</strong> shows 8.2% higher completion rates and improved engagement scores compared to traditional video lectures.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Frequent assessments</strong> (after each section) lead to better knowledge retention and course completion rates.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                <strong>Next test recommendation:</strong> Experiment with gamification elements to further increase engagement and completion rates.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};