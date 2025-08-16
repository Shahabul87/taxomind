"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  DollarSign,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Activity,
  Brain,
  Zap,
  Eye,
  Award,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnalyticsMetric, AnalyticsWidget } from '@/lib/enterprise-analytics';

interface MetricCardProps {
  metric: AnalyticsMetric;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, className }) => {
  const getIcon = () => {
    switch (metric.category) {
      case 'engagement': return <Users className="w-5 h-5" />;
      case 'performance': return <Target className="w-5 h-5" />;
      case 'business': return <DollarSign className="w-5 h-5" />;
      case 'ai': return <Brain className="w-5 h-5" />;
      case 'system': return <Activity className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up': return 'text-green-600 bg-green-50';
      case 'down': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              {getIcon()}
            </div>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {metric.name}
            </CardTitle>
          </div>
          {getTrendIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {metric.value.toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', getTrendColor())}>
              {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
            </Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              vs last {metric.period}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ChartWidgetProps {
  title: string;
  data: any[];
  type: 'line' | 'bar' | 'area' | 'pie';
  dataKey?: string;
  xAxisKey?: string;
  className?: string;
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({
  title,
  data,
  type,
  dataKey = 'value',
  xAxisKey = 'name',
  className,
}) => {
  const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={2} />
          </LineChart>
        );
      
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKey} fill={colors[0]} />
          </BarChart>
        );
      
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey={dataKey} stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
          </AreaChart>
        );
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {renderChart() as any}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface ProgressWidgetProps {
  title: string;
  items: Array<{
    label: string;
    value: number;
    total: number;
    color?: string;
  }>;
  className?: string;
}

export const ProgressWidget: React.FC<ProgressWidgetProps> = ({ title, items, className }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => {
            const percentage = (item.value / item.total) * 100;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {item.value}/{item.total}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                  style={{ '--progress-background': item.color || '#8b5cf6' } as any}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {percentage.toFixed(1)}% completed
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

interface AlertsWidgetProps {
  alerts: Array<{
    id: string;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    timestamp: Date;
  }>;
  className?: string;
}

export const AlertsWidget: React.FC<AlertsWidgetProps> = ({ alerts, className }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/10';
      case 'error': return 'border-red-400 bg-red-50 dark:bg-red-900/10';
      case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          System Alerts
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p>No active alerts</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={cn(
                  'border-l-4 p-3 rounded-r-lg',
                  getSeverityColor(alert.severity)
                )}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {alert.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface BloomsProgressWidgetProps {
  distribution: Record<string, number>;
  className?: string;
}

export const BloomsProgressWidget: React.FC<BloomsProgressWidgetProps> = ({ 
  distribution, 
  className 
}) => {
  const bloomsLevels = [
    { key: 'remember', label: 'Remember', color: '#ef4444' },
    { key: 'understand', label: 'Understand', color: '#f97316' },
    { key: 'apply', label: 'Apply', color: '#eab308' },
    { key: 'analyze', label: 'Analyze', color: '#22c55e' },
    { key: 'evaluate', label: 'Evaluate', color: '#3b82f6' },
    { key: 'create', label: 'Create', color: '#8b5cf6' },
  ];

  const data = bloomsLevels.map(level => ({
    name: level.label,
    value: distribution[level.key] || 0,
    fill: level.color,
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Bloom&apos;s Taxonomy Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={data}>
              <RadialBar
                minAngle={15}
                label={{ position: 'insideStart', fill: '#fff' }}
                background
                clockWise
                dataKey="value"
              />
              <Legend />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            {bloomsLevels.map(level => (
              <div key={level.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: level.color }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {level.label}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {(distribution[level.key] || 0).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface RealTimeWidgetProps {
  title: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  lastUpdate?: Date;
  className?: string;
}

export const RealTimeWidget: React.FC<RealTimeWidgetProps> = ({
  title,
  value,
  unit = '',
  trend = 'stable',
  lastUpdate,
  className,
}) => {
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLive(prev => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card className={cn('relative', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {title}
          </CardTitle>
          <div className="flex items-center gap-1">
            <div className={cn('w-2 h-2 rounded-full', isLive ? 'bg-green-500' : 'bg-gray-300')} />
            <span className="text-xs text-gray-500 dark:text-gray-400">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {value.toLocaleString()}
            </span>
            {unit && (
              <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>
            )}
          </div>
          {lastUpdate && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const AnalyticsWidgets = {
  MetricCard,
  ChartWidget,
  ProgressWidget,
  AlertsWidget,
  BloomsProgressWidget,
  RealTimeWidget,
};

export default AnalyticsWidgets;