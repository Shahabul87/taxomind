// Admin Features Tab - System-wide management and infrastructure with Enterprise Features

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, Database, Wifi, Link, Shield, AlertCircle,
  CheckCircle, XCircle, Activity, Server, Cpu, HardDrive,
  Building2, Users, BookOpen, Lock, Target, BarChart3
} from 'lucide-react';
import { EnterpriseAdminTab } from '@/components/enterprise/EnterpriseAdminTab';

interface AdminFeaturesProps {
  analytics?: any;
  performance?: any;
}

export function AdminFeaturesTab({ analytics, performance }: AdminFeaturesProps) {
  const [systemData, setSystemData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      // Fetch system-wide data
      const response = await fetch('/api/system/health?detailed=true');
      const data = await response.json();
      setSystemData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch system data:', error);
      setIsLoading(false);
    }
  };

  const adminFeatures = [
    {
      id: 1,
      name: 'ML Training Pipeline',
      description: 'Manage machine learning model training and optimization',
      icon: <Cpu className="h-5 w-5" />,
      status: 'active',
      progress: 87,
      benefit: 'Automated model improvements',
      color: 'blue',
      metrics: { 
        modelsTraining: 2, 
        completedJobs: 15, 
        avgAccuracy: 94.2,
        lastTraining: '2 hours ago'
      }
    },
    {
      id: 2,
      name: 'External Platform Integrations',
      description: 'Manage connections with external learning platforms',
      icon: <Link className="h-5 w-5" />,
      status: 'active',
      progress: 76,
      benefit: 'Seamless data integration',
      color: 'green',
      metrics: { 
        activeIntegrations: 5, 
        syncStatus: 'healthy', 
        lastSync: '15 mins ago',
        dataVolume: '2.1GB'
      }
    },
    {
      id: 3,
      name: 'System Health Monitoring',
      description: 'Monitor infrastructure performance and system health',
      icon: <Activity className="h-5 w-5" />,
      status: 'active',
      progress: 95,
      benefit: 'Proactive issue detection',
      color: 'purple',
      metrics: { 
        uptime: '99.9%', 
        responseTime: '120ms', 
        errorRate: '0.1%',
        activeServices: 18
      }
    }
  ];

  const systemHealth = {
    database: true,
    redis: true,
    application: true,
    monitoring: true
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Enterprise Tab */}
      <EnterpriseAdminTab analytics={analytics} performance={performance} />
      
      {/* Legacy System Administration - Enhanced */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Server className="h-6 w-6 text-blue-600" />
              System Infrastructure
            </h2>
            <p className="text-muted-foreground">Advanced system management and intelligent features</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {adminFeatures.filter(f => f.status === 'active').length} Active Systems
          </Badge>
        </div>

      {/* System Health Overview */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-red-600" />
            <span>System Health Status</span>
          </CardTitle>
          <CardDescription>
            Real-time monitoring of critical system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {systemHealth.database ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
              <div className="text-sm font-medium">Database</div>
              <div className="text-xs text-muted-foreground">PostgreSQL</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {systemHealth.redis ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
              <div className="text-sm font-medium">Cache</div>
              <div className="text-xs text-muted-foreground">Redis</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {systemHealth.application ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
              <div className="text-sm font-medium">Application</div>
              <div className="text-xs text-muted-foreground">Next.js</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {systemHealth.monitoring ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
              <div className="text-sm font-medium">Monitoring</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminFeatures.map((feature) => (
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
                  <span>System Health</span>
                  <span className="font-medium">{feature.progress}%</span>
                </div>
                <Progress value={feature.progress} className="h-2" />
              </div>

              {/* Feature-specific metrics */}
              <div className="space-y-2">
                {Object.entries(feature.metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">{feature.benefit}</span>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  console.log(`Managing ${feature.name}...`);
                }}
              >
                Manage
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <span>System Alerts</span>
          </CardTitle>
          <CardDescription>Recent system notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">ML Model Training Completed</p>
                <p className="text-xs text-muted-foreground">Content recommendation model achieved 94.2% accuracy</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">System Update Available</p>
                <p className="text-xs text-muted-foreground">Platform update v2.1.0 includes performance improvements</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">High Memory Usage</p>
                <p className="text-xs text-muted-foreground">Server memory usage at 78% - consider scaling</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-blue-500" />
              <span>Server Resources</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU Usage</span>
                  <span>45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory</span>
                  <span>78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-green-500" />
              <span>Database</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Connections</span>
                <span>24/100</span>
              </div>
              <div className="flex justify-between">
                <span>Query Time</span>
                <span>12ms</span>
              </div>
              <div className="flex justify-between">
                <span>Cache Hit</span>
                <span>94%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Wifi className="h-5 w-5 text-purple-500" />
              <span>Network</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Bandwidth</span>
                <span>124 Mbps</span>
              </div>
              <div className="flex justify-between">
                <span>Latency</span>
                <span>23ms</span>
              </div>
              <div className="flex justify-between">
                <span>Requests/min</span>
                <span>2,341</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>System Management</CardTitle>
          <CardDescription>Administrative tools and system controls</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
            <Button variant="outline" size="sm">
              <Database className="h-4 w-4 mr-2" />
              Database Management
            </Button>
            <Button variant="outline" size="sm">
              <Cpu className="h-4 w-4 mr-2" />
              ML Pipeline Control
            </Button>
            <Button variant="outline" size="sm">
              <HardDrive className="h-4 w-4 mr-2" />
              Backup & Recovery
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}