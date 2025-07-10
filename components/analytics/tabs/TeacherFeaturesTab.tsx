// Teacher Features Tab - Classroom management and teaching insights

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, BarChart, Eye, Shuffle, CheckCircle, Network,
  Activity, Video, Brain, AlertTriangle, TrendingUp
} from 'lucide-react';

interface TeacherFeaturesProps {
  analytics?: any;
  performance?: any;
}

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
    } catch (error) {
      console.error('Failed to fetch teacher features:', error);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Teaching Intelligence Tools</h2>
          <p className="text-muted-foreground">AI-powered insights to enhance your teaching effectiveness</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {teacherFeatures.filter(f => f.status === 'active').length} Active Tools
        </Badge>
      </div>

      {/* Class Overview */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-600" />
            <span>Class Performance Overview</span>
          </CardTitle>
          <CardDescription>
            Real-time insights into your classroom effectiveness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">24</div>
              <div className="text-sm text-muted-foreground">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">87%</div>
              <div className="text-sm text-muted-foreground">Avg Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">94%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">3</div>
              <div className="text-sm text-muted-foreground">At-Risk Students</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teacherFeatures.map((feature) => (
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
                  <span>Feature Utilization</span>
                  <span className="font-medium">{feature.progress}%</span>
                </div>
                <Progress value={feature.progress} className="h-2" />
              </div>

              {/* Feature-specific metrics */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(feature.metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
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
                Open Tool
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>AI Recommendations</span>
          </CardTitle>
          <CardDescription>Smart insights to improve your teaching</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">3 students showing signs of difficulty</p>
                <p className="text-xs text-muted-foreground">Consider providing additional support for Chapter 5 concepts</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Video engagement increased by 15%</p>
                <p className="text-xs text-muted-foreground">Your recent interactive elements are working well</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Teaching Tools</CardTitle>
          <CardDescription>Quick access to your most-used features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Monitor Class
            </Button>
            <Button variant="outline" size="sm">
              <Shuffle className="h-4 w-4 mr-2" />
              Reorder Content
            </Button>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              View Student Progress
            </Button>
            <Button variant="outline" size="sm">
              <Brain className="h-4 w-4 mr-2" />
              Generate Predictions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}