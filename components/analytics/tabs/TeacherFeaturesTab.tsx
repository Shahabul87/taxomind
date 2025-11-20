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
      <div className="flex items-center justify-center py-8 sm:py-10 md:py-12 px-3 sm:px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-primary mx-auto mb-3 sm:mb-4"></div>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground break-words">Loading teaching features...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-teal-50/30 to-cyan-50/40 dark:from-emerald-950/20 dark:via-teal-950/15 dark:to-cyan-950/20 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
      {/* Header with Glass Effect */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl md:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 text-transparent bg-clip-text break-words">Teaching Intelligence Tools</h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 break-words leading-relaxed">AI-powered insights to enhance your teaching effectiveness</p>
          </div>
          <Badge variant="secondary" className="text-xs sm:text-sm bg-emerald-100/80 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-700/50 w-fit sm:w-auto flex-shrink-0">
            {teacherFeatures.filter(f => f.status === 'active').length} Active Tools
          </Badge>
        </div>
      </div>

      {/* Class Overview with Glass Effect */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-4 sm:p-5 md:p-6">
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-1.5 sm:mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 dark:from-emerald-400/20 dark:to-teal-400/20 flex-shrink-0">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white break-words">Class Performance Overview</h3>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 break-words leading-relaxed">
            Real-time insights into your classroom effectiveness
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="text-center p-3 sm:p-4 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-lg sm:rounded-xl border border-emerald-200/50 dark:border-emerald-700/50">
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 dark:from-emerald-400 dark:to-green-300 text-transparent bg-clip-text break-words">24</div>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 break-words">Active Students</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg sm:rounded-xl border border-blue-200/50 dark:border-blue-700/50">
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 text-transparent bg-clip-text break-words">87%</div>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 break-words">Avg Engagement</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg sm:rounded-xl border border-purple-200/50 dark:border-purple-700/50">
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-500 dark:from-purple-400 dark:to-violet-300 text-transparent bg-clip-text break-words">94%</div>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 break-words">Completion Rate</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg sm:rounded-xl border border-orange-200/50 dark:border-orange-700/50">
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 dark:from-orange-400 dark:to-amber-300 text-transparent bg-clip-text break-words">3</div>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 break-words">At-Risk Students</div>
          </div>
        </div>
      </div>

      {/* Teacher Features Grid with Glass Effect */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {teacherFeatures.map((feature) => (
          <div key={feature.id} className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300 p-4 sm:p-5 md:p-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r ${getTeacherFeatureGradient(feature.color)} shadow-sm flex-shrink-0`}>
                    <div className="text-white [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white break-words">{feature.name}</h4>
                    <Badge 
                      variant={feature.status === 'active' ? 'default' : 'secondary'}
                      className={`mt-1 text-[10px] sm:text-xs ${feature.status === 'active' ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200/50 dark:bg-emerald-900/80 dark:text-emerald-300 dark:border-emerald-700/50' : 'bg-amber-100/80 text-amber-700 border-amber-200/50 dark:bg-amber-900/80 dark:text-amber-300 dark:border-amber-700/50'}`}
                    >
                      {feature.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 break-words leading-relaxed">{feature.description}</p>
              
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-600 dark:text-slate-400 break-words">Feature Utilization</span>
                  <span className="font-medium text-slate-900 dark:text-white flex-shrink-0 ml-2">{feature.progress}%</span>
                </div>
                <div className="w-full bg-slate-200/50 dark:bg-slate-700/50 rounded-full h-1.5 sm:h-2">
                  <div 
                    className={`h-1.5 sm:h-2 rounded-full bg-gradient-to-r ${getTeacherFeatureGradient(feature.color)} transition-all duration-300`}
                    style={{ width: `${feature.progress}%` }}
                  />
                </div>
              </div>

              {/* Feature-specific metrics */}
              <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-2.5 sm:p-3 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50">
                <div className="grid grid-cols-1 gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  {Object.entries(feature.metrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <span className="text-slate-600 dark:text-slate-400 capitalize break-words">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="font-medium text-slate-900 dark:text-white flex-shrink-0 ml-2">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs sm:text-sm bg-teal-50/50 dark:bg-teal-900/20 p-2.5 sm:p-3 rounded-lg border border-teal-200/50 dark:border-teal-700/50">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-slate-600 dark:text-slate-400 break-words leading-relaxed">{feature.benefit}</span>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm touch-manipulation"
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
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-4 sm:p-5 md:p-6">
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-1.5 sm:mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-orange-500/20 to-amber-500/20 dark:from-orange-400/20 dark:to-amber-400/20 flex-shrink-0">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white break-words">AI Recommendations</h3>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 break-words leading-relaxed">Smart insights to improve your teaching</p>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg sm:rounded-xl border border-orange-200/50 dark:border-orange-700/50">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white break-words">3 students showing signs of difficulty</p>
              <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-1 break-words leading-relaxed">Consider providing additional support for Chapter 5 concepts</p>
            </div>
          </div>
          <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg sm:rounded-xl border border-blue-200/50 dark:border-blue-700/50">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white break-words">Video engagement increased by 15%</p>
              <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-1 break-words leading-relaxed">Your recent interactive elements are working well</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions with Glass Effect */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-4 sm:p-5 md:p-6">
        <div className="mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white break-words">Teaching Tools</h3>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 break-words leading-relaxed">Quick access to your most-used features</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20 transition-all duration-300 min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm touch-manipulation justify-start sm:justify-center">
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span className="break-words">Monitor Class</span>
          </Button>
          <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-purple-50/80 dark:hover:bg-purple-900/20 transition-all duration-300 min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm touch-manipulation justify-start sm:justify-center">
            <Shuffle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span className="break-words">Reorder Content</span>
          </Button>
          <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 transition-all duration-300 min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm touch-manipulation justify-start sm:justify-center">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span className="break-words">View Student Progress</span>
          </Button>
          <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-cyan-50/80 dark:hover:bg-cyan-900/20 transition-all duration-300 min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm touch-manipulation justify-start sm:justify-center">
            <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span className="break-words">Generate Predictions</span>
          </Button>
        </div>
      </div>
    </div>
  );
}