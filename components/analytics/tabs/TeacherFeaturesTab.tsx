// Teacher Features Tab - Classroom management and teaching insights

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { logger } from '@/lib/logger';
import { 
  Users, BarChart, Eye, Shuffle, CheckCircle, Network,
  Activity, Video, Brain, AlertTriangle, TrendingUp
} from 'lucide-react';

interface TeacherFeaturesProps {
  analytics?: any;
  performance?: any;
}

// Helper function to get feature gradient colors for teacher tools
const getTeacherFeatureGradient = (color: string) => {
  const gradients: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-violet-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-amber-500',
    indigo: 'from-indigo-500 to-blue-500',
    pink: 'from-pink-500 to-rose-500',
    emerald: 'from-emerald-500 to-teal-500',
    red: 'from-red-500 to-orange-500'
  };
  return gradients[color] || 'from-gray-500 to-gray-600';
};

export function TeacherFeaturesTab({ analytics, performance }: TeacherFeaturesProps) {
  const [featuresData, setFeaturesData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeacherFeatures();
  }, []);

  const fetchTeacherFeatures = async () => {
    try {
      // Fetch teacher-specific feature data
      const response = await fetch('/api/analytics/real-time');
      const data = await response.json();
      setFeaturesData(data);
      setIsLoading(false);
    } catch (error: any) {
      logger.error('Failed to fetch teacher features:', error);
      setIsLoading(false);
    }
  };

  const teacherFeatures = [
    {
      id: 1,
      name: 'Real-time Analytics Dashboard',
      description: 'Monitor class performance and engagement in real-time',
      icon: <BarChart className="h-5 w-5" />,
      status: 'active',
      progress: 94,
      benefit: 'Immediate classroom insights',
      color: 'blue',
      metrics: { activeStudents: 24, avgEngagement: 87 }
    },
    {
      id: 2,
      name: 'Content Reordering Engine',
      description: 'AI-powered adaptive content sequencing for your curriculum',
      icon: <Shuffle className="h-5 w-5" />,
      status: 'active',
      progress: 81,
      benefit: 'Optimize learning flow',
      color: 'purple',
      metrics: { contentAdaptations: 12, effectivenessGain: 15 }
    },
    {
      id: 3,
      name: 'Prerequisite Tracking',
      description: 'Track student readiness and knowledge dependencies',
      icon: <CheckCircle className="h-5 w-5" />,
      status: 'active',
      progress: 76,
      benefit: 'Ensure learning readiness',
      color: 'green',
      metrics: { studentsReady: 89, prerequisiteGaps: 3 }
    },
    {
      id: 4,
      name: 'Knowledge Graph',
      description: 'Visualize curriculum relationships and learning pathways',
      icon: <Network className="h-5 w-5" />,
      status: 'active',
      progress: 83,
      benefit: 'Map learning connections',
      color: 'orange',
      metrics: { concepts: 156, connections: 342 }
    },
    {
      id: 5,
      name: 'Student Interaction Tracking',
      description: 'Monitor student engagement and participation patterns',
      icon: <Users className="h-5 w-5" />,
      status: 'active',
      progress: 91,
      benefit: 'Understand student behavior',
      color: 'indigo',
      metrics: { interactions: 1247, engagementTrend: '+12%' }
    },
    {
      id: 6,
      name: 'Video Analytics',
      description: 'Analyze video content engagement and learning outcomes',
      icon: <Video className="h-5 w-5" />,
      status: 'active',
      progress: 68,
      benefit: 'Optimize video content',
      color: 'pink',
      metrics: { videosAnalyzed: 23, avgWatchTime: '78%' }
    },
    {
      id: 7,
      name: 'ML Prediction Service',
      description: 'Identify at-risk students and predict learning outcomes',
      icon: <Brain className="h-5 w-5" />,
      status: 'active',
      progress: 87,
      benefit: 'Proactive interventions',
      color: 'emerald',
      metrics: { predictions: 156, accuracy: 89 }
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading teaching features...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-teal-50/30 to-cyan-50/40 dark:from-emerald-950/20 dark:via-teal-950/15 dark:to-cyan-950/20 p-6 space-y-6">
      {/* Header with Glass Effect */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 text-transparent bg-clip-text">Teaching Intelligence Tools</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">AI-powered insights to enhance your teaching effectiveness</p>
          </div>
          <Badge variant="secondary" className="text-sm bg-emerald-100/80 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-700/50">
            {teacherFeatures.filter(f => f.status === 'active').length} Active Tools
          </Badge>
        </div>
      </div>

      {/* Class Overview with Glass Effect */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-6">
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 dark:from-emerald-400/20 dark:to-teal-400/20">
              <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Class Performance Overview</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Real-time insights into your classroom effectiveness
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50">
            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 dark:from-emerald-400 dark:to-green-300 text-transparent bg-clip-text">24</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Active Students</div>
          </div>
          <div className="text-center p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 text-transparent bg-clip-text">87%</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Avg Engagement</div>
          </div>
          <div className="text-center p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-500 dark:from-purple-400 dark:to-violet-300 text-transparent bg-clip-text">94%</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Completion Rate</div>
          </div>
          <div className="text-center p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl border border-orange-200/50 dark:border-orange-700/50">
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 dark:from-orange-400 dark:to-amber-300 text-transparent bg-clip-text">3</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">At-Risk Students</div>
          </div>
        </div>
      </div>

      {/* Teacher Features Grid with Glass Effect */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teacherFeatures.map((feature) => (
          <div key={feature.id} className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300 p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${getTeacherFeatureGradient(feature.color)} shadow-sm`}>
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">{feature.name}</h4>
                    <Badge 
                      variant={feature.status === 'active' ? 'default' : 'secondary'}
                      className={`mt-1 ${feature.status === 'active' ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200/50 dark:bg-emerald-900/80 dark:text-emerald-300 dark:border-emerald-700/50' : 'bg-amber-100/80 text-amber-700 border-amber-200/50 dark:bg-amber-900/80 dark:text-amber-300 dark:border-amber-700/50'}`}
                    >
                      {feature.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Feature Utilization</span>
                  <span className="font-medium text-slate-900 dark:text-white">{feature.progress}%</span>
                </div>
                <div className="w-full bg-slate-200/50 dark:bg-slate-700/50 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${getTeacherFeatureGradient(feature.color)} transition-all duration-300`}
                    style={{ width: `${feature.progress}%` }}
                  />
                </div>
              </div>

              {/* Feature-specific metrics */}
              <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {Object.entries(feature.metrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm bg-teal-50/50 dark:bg-teal-900/20 p-3 rounded-lg border border-teal-200/50 dark:border-teal-700/50">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">{feature.benefit}</span>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300"
                onClick={() => {

                }}
              >
                Open Tool
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts & Recommendations with Glass Effect */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-6">
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500/20 to-amber-500/20 dark:from-orange-400/20 dark:to-amber-400/20">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Recommendations</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Smart insights to improve your teaching</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl border border-orange-200/50 dark:border-orange-700/50">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">3 students showing signs of difficulty</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Consider providing additional support for Chapter 5 concepts</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
            <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Video engagement increased by 15%</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Your recent interactive elements are working well</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions with Glass Effect */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Teaching Tools</h3>
          <p className="text-slate-600 dark:text-slate-400">Quick access to your most-used features</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20 transition-all duration-300">
            <Eye className="h-4 w-4 mr-2" />
            Monitor Class
          </Button>
          <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-purple-50/80 dark:hover:bg-purple-900/20 transition-all duration-300">
            <Shuffle className="h-4 w-4 mr-2" />
            Reorder Content
          </Button>
          <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 transition-all duration-300">
            <Users className="h-4 w-4 mr-2" />
            View Student Progress
          </Button>
          <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-cyan-50/80 dark:hover:bg-cyan-900/20 transition-all duration-300">
            <Brain className="h-4 w-4 mr-2" />
            Generate Predictions
          </Button>
        </div>
      </div>
    </div>
  );
}