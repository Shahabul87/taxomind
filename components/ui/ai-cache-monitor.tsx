"use client";

import { useState, useEffect } from 'react';
import {
  Database,
  Zap,
  Clock,
  TrendingUp,
  Activity,
  FileText,
  BarChart3,
  RefreshCw,
  Trash2,
  Settings
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAICache } from '@/lib/ai-cache-system';
import { cn } from '@/lib/utils';

interface AICacheMonitorProps {
  userId?: string;
  courseId?: string;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const MetricCard = ({ title, value, subtitle, icon, trend, color = 'blue' }: MetricCardProps): React.ReactElement => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
  };

  const trendIcons = {
    up: <TrendingUp className="w-3 h-3 text-green-500" />,
    down: <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />,
    neutral: <Activity className="w-3 h-3 text-gray-500" />
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-lg', colorClasses[color])}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">{title}</h3>
              {trend && trendIcons[trend]}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AICacheMonitor = ({ userId, courseId, className }: AICacheMonitorProps): React.ReactElement => {
  const { getStats, invalidate, invalidateByUser, invalidateByCourse } = useAICache();
  const [stats, setStats] = useState(() => getStats());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStats = async (): Promise<void> => {
    setIsRefreshing(true);
    // Simulate a small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 500));
    setStats(getStats());
    setIsRefreshing(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getStats]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const handleClearCache = async (type: 'all' | 'user' | 'course'): Promise<void> => {
    switch (type) {
      case 'all':
        invalidate();
        break;
      case 'user':
        if (userId) invalidateByUser(userId);
        break;
      case 'course':
        if (courseId) invalidateByCourse(courseId);
        break;
    }
    await refreshStats();
  };

  const getCacheEfficiency = (): { score: number; status: string; color: string } => {
    const { hitRate } = stats;
    const efficiencyLevels = [
      { threshold: 80, status: 'Excellent', color: 'green' },
      { threshold: 60, status: 'Good', color: 'blue' },
      { threshold: 40, status: 'Fair', color: 'yellow' },
      { threshold: 0, status: 'Poor', color: 'red' }
    ];
    
    const level = efficiencyLevels.find(l => hitRate >= l.threshold) ?? { status: 'Unknown', color: 'gray' };
    return { score: hitRate, status: level.status, color: level.color };
  };

  const efficiency = getCacheEfficiency();
  
  const getEfficiencyColor = (color: string): string => {
    const colorMap: Record<string, string> = {
      green: '#10b981',
      blue: '#3b82f6',
      yellow: '#f59e0b',
      red: '#ef4444'
    };
    return colorMap[color] ?? '#6b7280';
  };
  
  const getResponseTimeStatus = (time: number): string => {
    if (time < 1000) return 'Excellent';
    if (time < 3000) return 'Good';
    return 'Needs Improvement';
  };
  
  const getResponseTimeColor = (time: number): 'green' | 'yellow' | 'red' => {
    if (time < 1000) return 'green';
    if (time < 3000) return 'yellow';
    return 'red';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Cache Monitor
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and optimize AI API performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { refreshStats().catch(() => {}); }}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { handleClearCache('all').catch(() => {}); }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cache Hit Rate"
          value={`${stats.hitRate.toFixed(1)}%`}
          subtitle={efficiency.status}
          icon={<Zap className="w-5 h-5" />}
          color={efficiency.color as 'blue' | 'green' | 'yellow' | 'red' | 'purple'}
          trend={(() => {
            if (stats.hitRate > 50) return 'up';
            if (stats.hitRate > 25) return 'neutral';
            return 'down';
          })()}
        />
        
        <MetricCard
          title="Total Requests"
          value={formatNumber(stats.totalRequests)}
          subtitle={`${formatNumber(stats.totalHits)} hits, ${formatNumber(stats.totalMisses)} misses`}
          icon={<Activity className="w-5 h-5" />}
          color="blue"
        />
        
        <MetricCard
          title="Avg Response Time"
          value={`${stats.averageResponseTime.toFixed(0)}ms`}
          subtitle="Including cache hits"
          icon={<Clock className="w-5 h-5" />}
          color={getResponseTimeColor(stats.averageResponseTime)}
        />
        
        <MetricCard
          title="Memory Usage"
          value={formatBytes(stats.memoryUsage)}
          subtitle={`${stats.cacheSize} entries`}
          icon={<Database className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cache Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Cache Performance
                </CardTitle>
                <CardDescription>
                  Hit rate and response time metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Hit Rate</span>
                    <span className="font-medium">{stats.hitRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.hitRate} className="h-3" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Response Time Efficiency</span>
                    <span className="font-medium">
                      {getResponseTimeStatus(stats.averageResponseTime)}
                    </span>
                  </div>
                  <Progress 
                    value={Math.max(0, 100 - (stats.averageResponseTime / 50))} 
                    className="h-3" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tokens Saved */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Cost Savings
                </CardTitle>
                <CardDescription>
                  Estimated tokens and costs saved through caching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatNumber(stats.tokensSaved)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tokens saved
                  </p>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span>Estimated cost savings</span>
                    <span className="font-medium text-green-600">
                      ${((stats.tokensSaved / 1000) * 0.002).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cache Efficiency Score */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Efficiency Score</CardTitle>
                <CardDescription>
                  Overall performance rating based on hit rate and response time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2" style={{ color: getEfficiencyColor(efficiency.color) }}>
                    {efficiency.score.toFixed(0)}
                  </div>
                  <Badge className={cn(
                    'text-white',
                    efficiency.color === 'green' && 'bg-green-600',
                    efficiency.color === 'blue' && 'bg-blue-600',
                    efficiency.color === 'yellow' && 'bg-yellow-600',
                    efficiency.color === 'red' && 'bg-red-600'
                  )}>
                    {efficiency.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cache hits</span>
                    <span className="font-medium">{formatNumber(stats.totalHits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache misses</span>
                    <span className="font-medium">{formatNumber(stats.totalMisses)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache size</span>
                    <span className="font-medium">{stats.cacheSize} entries</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Optimization Tips
                </CardTitle>
                <CardDescription>
                  Recommendations to improve cache performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.hitRate < 50 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Low hit rate detected. Consider preloading common requests or increasing cache TTL.
                      </p>
                    </div>
                  )}
                  
                  {stats.averageResponseTime > 3000 && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        High response times detected. Consider optimizing API calls or increasing cache duration.
                      </p>
                    </div>
                  )}
                  
                  {stats.cacheSize > 800 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Cache size is getting large. Consider clearing old entries or reducing cache TTL.
                      </p>
                    </div>
                  )}
                  
                  {stats.hitRate >= 70 && stats.averageResponseTime < 2000 && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Great performance! Your cache is working efficiently.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cache Management Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Management</CardTitle>
                <CardDescription>
                  Clear cache data for different scopes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => { handleClearCache('all').catch(() => {}); }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Cache
                  </Button>
                  
                  {userId && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => { handleClearCache('user').catch(() => {}); }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear User Cache
                    </Button>
                  )}
                  
                  {courseId && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => { handleClearCache('course').catch(() => {}); }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Course Cache
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cache Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Statistics</CardTitle>
                <CardDescription>
                  Comprehensive cache metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total requests</span>
                    <span className="font-medium">{formatNumber(stats.totalRequests)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cache hits</span>
                    <span className="font-medium text-green-600">{formatNumber(stats.totalHits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cache misses</span>
                    <span className="font-medium text-red-600">{formatNumber(stats.totalMisses)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Hit rate</span>
                    <span className="font-medium">{stats.hitRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Miss rate</span>
                    <span className="font-medium">{stats.missRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cache size</span>
                    <span className="font-medium">{stats.cacheSize} entries</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Memory usage</span>
                    <span className="font-medium">{formatBytes(stats.memoryUsage)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tokens saved</span>
                    <span className="font-medium text-green-600">{formatNumber(stats.tokensSaved)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg response time</span>
                    <span className="font-medium">{stats.averageResponseTime.toFixed(0)}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};