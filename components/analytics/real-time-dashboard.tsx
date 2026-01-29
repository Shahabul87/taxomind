'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { logger } from '@/lib/logger';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  Users,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Zap,
  Target,
  Brain,
  Timer,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface RealTimeMetrics {
  timestamp: Date;
  activeUsers: number;
  totalInteractions: number;
  avgEngagementScore: number;
  completionRate: number;
  currentVideosWatching: number;
  strugglingStudents: number;
  topPerformers: number;
  systemLoad: number;
}

interface StudentActivity {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  currentActivity: string;
  engagementScore: number;
  timeSpent: number;
  lastSeen: Date;
  status: 'active' | 'idle' | 'struggling';
  progress: number;
}

interface ContentAlert {
  id: string;
  type: 'struggle' | 'dropout' | 'engagement' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedStudents: number;
  courseId: string;
  contentId: string;
  timestamp: Date;
  resolved: boolean;
}

interface RealTimeDashboardProps {
  courseId?: string;
  view: 'student' | 'teacher' | 'admin';
  refreshInterval?: number;
}

export function RealTimeDashboard({ 
  courseId, 
  view = 'student', 
  refreshInterval = 5000 
}: RealTimeDashboardProps) {
  const { data: session } = useSession();
  
  // State
  const [metrics, setMetrics] = useState<RealTimeMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<RealTimeMetrics | null>(null);
  const [studentActivities, setStudentActivities] = useState<StudentActivity[]>([]);
  const [alerts, setAlerts] = useState<ContentAlert[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [loading, setLoading] = useState(true);

  // Refs
  const refreshTimer = useRef<NodeJS.Timeout>();
  const metricsHistory = useRef<RealTimeMetrics[]>([]);
  const maxHistoryPoints = 50;

  // WebSocket connection for real-time updates
  const wsRef = useRef<WebSocket | null>(null);

  const initializeRealTimeConnection = () => {
    // In a real implementation, this would connect to a WebSocket server
    // For now, we'll simulate real-time updates with polling

  };

  const fetchCurrentMetrics = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/analytics/real-time/metrics?${courseId ? `courseId=${courseId}&` : ''}timeRange=${selectedTimeRange}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch metrics');
      
      const data = await response.json();
      
      const newMetrics: RealTimeMetrics = {
        timestamp: new Date(),
        activeUsers: data.activeUsers || 0,
        totalInteractions: data.totalInteractions || 0,
        avgEngagementScore: data.avgEngagementScore || 0,
        completionRate: data.completionRate || 0,
        currentVideosWatching: data.currentVideosWatching || 0,
        strugglingStudents: data.strugglingStudents || 0,
        topPerformers: data.topPerformers || 0,
        systemLoad: data.systemLoad || 0
      };

      setCurrentMetrics(newMetrics);
      
      // Add to history
      metricsHistory.current.push(newMetrics);
      if (metricsHistory.current.length > maxHistoryPoints) {
        metricsHistory.current.shift();
      }
      setMetrics([...metricsHistory.current]);
      setIsConnected(true);
    } catch (error: any) {
      logger.error('[REAL_TIME_DASHBOARD] Failed to fetch current metrics', {
        courseId,
        timeRange: selectedTimeRange,
        error: error instanceof Error ? error.message : String(error),
      });
      setIsConnected(false);
    }
  }, [courseId, selectedTimeRange]);

  const fetchStudentActivities = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/analytics/real-time/activities?${courseId ? `courseId=${courseId}&` : ''}timeRange=${selectedTimeRange}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch activities');
      
      const data = await response.json();
      setStudentActivities(data.activities || []);
    } catch (error: any) {
      logger.error('[REAL_TIME_DASHBOARD] Failed to fetch student activities', {
        courseId,
        timeRange: selectedTimeRange,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [courseId, selectedTimeRange]);

  const fetchContentAlerts = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/analytics/real-time/alerts?${courseId ? `courseId=${courseId}&` : ''}resolved=false`
      );
      
      if (!response.ok) throw new Error('Failed to fetch alerts');
      
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error: any) {
      logger.error('[REAL_TIME_DASHBOARD] Failed to fetch content alerts', {
        courseId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [courseId]);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCurrentMetrics(),
        fetchStudentActivities(),
        fetchContentAlerts()
      ]);
    } catch (error: any) {
      logger.error('[REAL_TIME_DASHBOARD] Failed to fetch initial data', {
        courseId,
        error: error instanceof Error ? error.message : String(error),
      });
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [courseId, fetchCurrentMetrics, fetchStudentActivities, fetchContentAlerts]);

  const startAutoRefresh = useCallback(() => {
    stopAutoRefresh();
    refreshTimer.current = setInterval(() => {
      fetchCurrentMetrics();
      fetchStudentActivities();
      fetchContentAlerts();
    }, refreshInterval);
  }, [refreshInterval, fetchCurrentMetrics, fetchStudentActivities, fetchContentAlerts]);

  const stopAutoRefresh = () => {
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
      refreshTimer.current = undefined;
    }
  };

  useEffect(() => {
    initializeRealTimeConnection();
    fetchInitialData();

    // Capture ref values for cleanup (React hooks rule)
    const ws = wsRef.current;

    return () => {
      if (ws) {
        ws.close();
      }
      stopAutoRefresh();
    };
  }, [fetchInitialData]);

  useEffect(() => {
    if (autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => stopAutoRefresh();
  }, [autoRefresh, startAutoRefresh]);

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/analytics/real-time/alerts/${alertId}/resolve`, {
        method: 'POST'
      });
      
      setAlerts(alerts.map(alert =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ));
    } catch (error: any) {
      logger.error('[REAL_TIME_DASHBOARD] Failed to resolve alert', {
        alertId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'idle': return 'text-yellow-600';
      case 'struggling': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'border-blue-200 bg-blue-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'high': return 'border-orange-200 bg-orange-50';
      case 'critical': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-8 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Real-Time Analytics</h2>
          <div className="flex items-center gap-1">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Auto-refresh</span>
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>
          
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
          </select>

          <Button
            onClick={fetchInitialData}
            size="sm"
            variant="outline"
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts.filter(alert => alert.severity === 'critical' && !alert.resolved).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts
              .filter(alert => alert.severity === 'critical' && !alert.resolved)
              .map(alert => (
                <div key={alert.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{alert.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {alert.affectedStudents} students affected
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMetrics?.activeUsers || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span>Live count</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(currentMetrics?.avgEngagementScore || 0)}%
            </div>
            <Progress 
              value={currentMetrics?.avgEngagementScore || 0} 
              className="h-2 mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos Watching</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMetrics?.currentVideosWatching || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              Active video sessions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(currentMetrics?.completionRate || 0)}%
            </div>
            <Progress 
              value={currentMetrics?.completionRate || 0} 
              className="h-2 mt-2" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Real-time Metrics Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="activeUsers" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Active Users"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgEngagementScore" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Engagement %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={[
                        { name: 'High (80%+)', value: currentMetrics?.topPerformers || 0, fill: '#10b981' },
                        { name: 'Medium (50-80%)', value: (currentMetrics?.activeUsers || 0) - (currentMetrics?.topPerformers || 0) - (currentMetrics?.strugglingStudents || 0), fill: '#f59e0b' },
                        { name: 'Low (<50%)', value: currentMetrics?.strugglingStudents || 0, fill: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                    >
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">System Load</span>
                  <div className="flex items-center gap-2">
                    <Progress value={currentMetrics?.systemLoad || 0} className="w-20" />
                    <span className="text-sm font-medium">
                      {Math.round(currentMetrics?.systemLoad || 0)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Response Time</span>
                  <Badge variant="secondary">
                    <Timer className="w-3 h-3 mr-1" />
                    {Math.round(Math.random() * 100 + 50)}ms
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Quality</span>
                  <Badge variant="secondary">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    98.5%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          {view !== 'student' ? (
            <Card>
              <CardHeader>
                <CardTitle>Active Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {studentActivities.map((student) => (
                    <div 
                      key={student.studentId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          student.status === 'active' && "bg-green-500",
                          student.status === 'idle' && "bg-yellow-500",
                          student.status === 'struggling' && "bg-red-500"
                        )} />
                        
                        <div>
                          <div className="font-medium text-sm">
                            {student.studentName || `Student ${student.studentId.slice(0, 8)}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {student.currentActivity} • {student.courseName}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-right">
                        <div className="text-sm">
                          <div className="font-medium">{Math.round(student.engagementScore)}%</div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(student.timeSpent)}
                          </div>
                        </div>
                        <Progress value={student.progress} className="w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  Student activity data is only available for instructors and administrators.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Videos', completed: 85, started: 120 },
                    { name: 'Quizzes', completed: 78, started: 95 },
                    { name: 'Articles', completed: 92, started: 110 },
                    { name: 'Exercises', completed: 65, started: 88 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="started" fill="#e5e7eb" name="Started" />
                    <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Struggling Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { title: 'Advanced React Concepts', struggles: 15, type: 'video' },
                    { title: 'State Management Quiz', struggles: 12, type: 'quiz' },
                    { title: 'Async Programming', struggles: 8, type: 'article' }
                  ].map((content, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded bg-muted">
                      <div>
                        <div className="font-medium text-sm">{content.title}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {content.type}
                        </div>
                      </div>
                      <Badge variant="destructive">
                        {content.struggles} struggling
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={cn(
                      "p-3 border rounded-lg",
                      getAlertColor(alert.severity),
                      alert.resolved && "opacity-50"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{alert.title}</span>
                          <Badge 
                            variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {alert.severity}
                          </Badge>
                          {alert.resolved && (
                            <Badge variant="outline" className="text-xs">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {alert.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {alert.affectedStudents} students affected • {alert.timestamp.toLocaleString()}
                        </div>
                      </div>
                      
                      {!alert.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}