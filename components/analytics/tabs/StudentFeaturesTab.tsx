// Student Features Tab - Personal learning features for students

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, BookOpen, Clock, Heart, Target, Briefcase, 
  TrendingUp, Zap, Activity, Star
} from 'lucide-react';

interface StudentFeaturesProps {
  analytics?: any;
  performance?: any;
}

export function StudentFeaturesTab({ analytics, performance }: StudentFeaturesProps) {
  const [featuresData, setFeaturesData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudentFeatures();
  }, []);

  const fetchStudentFeatures = async () => {
    try {
      // Fetch student-specific feature data
      const response = await fetch('/api/analytics/real-time');
      const data = await response.json();
      setFeaturesData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch student features:', error);
      setIsLoading(false);
    }
  };

  const studentFeatures = [
    {
      id: 1,
      name: 'Learning Analytics',
      description: 'Track your personal learning progress and achievements',
      icon: <TrendingUp className="h-5 w-5" />,
      status: 'active',
      progress: 85,
      benefit: 'Understand your learning patterns',
      color: 'blue'
    },
    {
      id: 2,
      name: 'Adaptive Learning Paths',
      description: 'AI-customized learning journey based on your pace and style',
      icon: <Brain className="h-5 w-5" />,
      status: 'active',
      progress: 78,
      benefit: 'Personalized curriculum adaptation',
      color: 'purple'
    },
    {
      id: 3,
      name: 'Spaced Repetition',
      description: 'Optimized review scheduling for better retention',
      icon: <Clock className="h-5 w-5" />,
      status: 'active',
      progress: 92,
      benefit: 'Improve long-term memory retention',
      color: 'green'
    },
    {
      id: 4,
      name: 'Microlearning',
      description: 'Bite-sized learning modules that fit your schedule',
      icon: <BookOpen className="h-5 w-5" />,
      status: 'active',
      progress: 67,
      benefit: 'Learn efficiently in short sessions',
      color: 'orange'
    },
    {
      id: 5,
      name: 'Cognitive Load Management',
      description: 'Adaptive difficulty based on your current capacity',
      icon: <Brain className="h-5 w-5" />,
      status: 'active',
      progress: 73,
      benefit: 'Prevent cognitive overload',
      color: 'indigo'
    },
    {
      id: 6,
      name: 'Emotion Detection',
      description: 'Real-time mood and engagement monitoring',
      icon: <Heart className="h-5 w-5" />,
      status: 'beta',
      progress: 56,
      benefit: 'Optimize learning based on emotions',
      color: 'pink'
    },
    {
      id: 7,
      name: 'Job Market Skills Mapping',
      description: 'Career guidance and skill gap analysis',
      icon: <Briefcase className="h-5 w-5" />,
      status: 'active',
      progress: 81,
      benefit: 'Align learning with career goals',
      color: 'emerald'
    },
    {
      id: 8,
      name: 'Predictive Analytics',
      description: 'AI predictions for your learning success',
      icon: <Target className="h-5 w-5" />,
      status: 'active',
      progress: 89,
      benefit: 'Proactive learning interventions',
      color: 'red'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your learning features...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Personal Learning Features</h2>
          <p className="text-muted-foreground">AI-powered tools to enhance your learning experience</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {studentFeatures.filter(f => f.status === 'active').length} Active Features
        </Badge>
      </div>

      {/* Learning Progress Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Overall Learning Enhancement</span>
          </CardTitle>
          <CardDescription>
            Your AI-powered learning features are boosting your educational experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">78%</div>
              <div className="text-sm text-muted-foreground">Learning Efficiency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">92%</div>
              <div className="text-sm text-muted-foreground">Retention Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">85%</div>
              <div className="text-sm text-muted-foreground">Engagement Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {studentFeatures.map((feature) => (
          <Card key={feature.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-${feature.color}-100 dark:bg-${feature.color}-900`}>
                    {feature.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.name}</CardTitle>
                    <Badge 
                      variant={feature.status === 'active' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {feature.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{feature.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Effectiveness</span>
                  <span className="font-medium">{feature.progress}%</span>
                </div>
                <Progress value={feature.progress} className="h-2" />
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-muted-foreground">{feature.benefit}</span>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  // Navigate to specific feature or show details
                  console.log(`Opening ${feature.name} details...`);
                }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your personal learning preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Optimize Learning Path
            </Button>
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4 mr-2" />
              Update Mood Preferences
            </Button>
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Schedule Study Sessions
            </Button>
            <Button variant="outline" size="sm">
              <Briefcase className="h-4 w-4 mr-2" />
              Review Career Goals
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}