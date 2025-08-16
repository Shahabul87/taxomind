// Student Features Tab - Personal learning features for students

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { logger } from '@/lib/logger';
import { 
  Brain, BookOpen, Clock, Heart, Target, Briefcase, 
  TrendingUp, Zap, Activity, Star
} from 'lucide-react';

interface StudentFeaturesProps {
  analytics?: any;
  performance?: any;
}

// Helper function to get feature gradient colors
const getFeatureGradient = (color: string) => {
  const gradients: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600',
    emerald: 'from-emerald-500 to-emerald-600',
    red: 'from-red-500 to-red-600'
  };
  return gradients[color] || 'from-gray-500 to-gray-600';
};

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
    } catch (error: any) {
      logger.error('Failed to fetch student features:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-indigo-50/30 to-purple-50/40 dark:from-blue-950/20 dark:via-indigo-950/15 dark:to-purple-950/20 p-6 space-y-6">
      {/* Header with Glass Effect */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 text-transparent bg-clip-text">Your Personal Learning Features</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">AI-powered tools to enhance your learning experience</p>
          </div>
          <Badge variant="secondary" className="text-sm bg-blue-100/80 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50">
            {studentFeatures.filter(f => f.status === 'active').length} Active Features
          </Badge>
        </div>
      </div>

      {/* Learning Progress Overview with Glass Effect */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-6">
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20 dark:from-blue-400/20 dark:to-indigo-400/20">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Overall Learning Enhancement</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Your AI-powered learning features are boosting your educational experience
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 text-transparent bg-clip-text">78%</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Learning Efficiency</div>
          </div>
          <div className="text-center p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl border border-green-200/50 dark:border-green-700/50">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 dark:from-green-400 dark:to-emerald-300 text-transparent bg-clip-text">92%</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Retention Rate</div>
          </div>
          <div className="text-center p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 dark:from-purple-400 dark:to-indigo-300 text-transparent bg-clip-text">85%</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Engagement Score</div>
          </div>
        </div>
      </div>

      {/* Student Features Grid with Glass Effect */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {studentFeatures.map((feature) => (
          <div key={feature.id} className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300 p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${getFeatureGradient(feature.color)} shadow-sm`}>
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">{feature.name}</h4>
                    <Badge 
                      variant={feature.status === 'active' ? 'default' : 'secondary'}
                      className={`mt-1 ${feature.status === 'active' ? 'bg-green-100/80 text-green-700 border-green-200/50 dark:bg-green-900/80 dark:text-green-300 dark:border-green-700/50' : 'bg-amber-100/80 text-amber-700 border-amber-200/50 dark:bg-amber-900/80 dark:text-amber-300 dark:border-amber-700/50'}`}
                    >
                      {feature.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Effectiveness</span>
                  <span className="font-medium text-slate-900 dark:text-white">{feature.progress}%</span>
                </div>
                <div className="w-full bg-slate-200/50 dark:bg-slate-700/50 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${getFeatureGradient(feature.color)} transition-all duration-300`}
                    style={{ width: `${feature.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-slate-600 dark:text-slate-400">{feature.benefit}</span>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300"
                onClick={() => {

                }}
              >
                View Details
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions with Glass Effect */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Quick Actions</h3>
          <p className="text-slate-600 dark:text-slate-400">Manage your personal learning preferences</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 transition-all duration-300">
            <Zap className="h-4 w-4 mr-2" />
            Optimize Learning Path
          </Button>
          <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-pink-50/80 dark:hover:bg-pink-900/20 transition-all duration-300">
            <Heart className="h-4 w-4 mr-2" />
            Update Mood Preferences
          </Button>
          <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-green-50/80 dark:hover:bg-green-900/20 transition-all duration-300">
            <Clock className="h-4 w-4 mr-2" />
            Schedule Study Sessions
          </Button>
          <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-purple-50/80 dark:hover:bg-purple-900/20 transition-all duration-300">
            <Briefcase className="h-4 w-4 mr-2" />
            Review Career Goals
          </Button>
        </div>
      </div>
    </div>
  );
}