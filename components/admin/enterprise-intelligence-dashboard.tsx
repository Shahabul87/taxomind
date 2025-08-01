"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  TrendingUp,
  AlertTriangle,
  Activity,
  BarChart3,
  Brain,
  DollarSign,
  Users,
  BookOpen,
  Zap,
  Eye,
  Lock,
  Globe,
  Target,
  Cpu,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Sparkles,
  LineChart,
  PieChart,
  Calendar,
  FileText,
  Award,
  Settings,
  Gauge,
  RefreshCw,
  Download,
  Filter,
  Search,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  Star,
  Bookmark,
  Share2,
  MessageSquare,
  Bell,
  Home,
  Package,
  ShoppingCart,
  CreditCard,
  TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";

// Advanced chart components
import {
  ClientLineChart,
  ClientBarChart,
  ClientPieChart,
  ClientAreaChart,
  ClientHeatmapChart,
  ClientRadialChart,
  ClientTreemapChart
} from "@/components/charts/client-charts";

interface EnterpriseIntelligenceProps {
  className?: string;
}

interface SecurityMetrics {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  activeThreats: number;
  blockedAttacks: number;
  vulnerabilities: number;
  complianceScore: number;
  lastScan: Date;
  securityIncidents: {
    id: string;
    type: string;
    severity: string;
    description: string;
    timestamp: Date;
    status: 'resolved' | 'investigating' | 'pending';
  }[];
}

interface PerformanceMetrics {
  systemHealth: number;
  responseTime: number;
  uptime: number;
  errorRate: number;
  throughput: number;
  serverLoad: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  regions: {
    name: string;
    latency: number;
    status: 'healthy' | 'warning' | 'critical';
  }[];
}

interface PredictiveAnalytics {
  userGrowthForecast: {
    period: string;
    predicted: number;
    confidence: number;
  }[];
  revenueProjections: {
    month: string;
    projected: number;
    actual?: number;
  }[];
  riskAssessments: {
    category: string;
    risk: number;
    impact: string;
    likelihood: string;
    mitigation: string;
  }[];
  trends: {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
    prediction: string;
  }[];
}

interface BusinessIntelligence {
  kpis: {
    name: string;
    value: number;
    target: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    change: number;
  }[];
  customerSegments: {
    segment: string;
    count: number;
    revenue: number;
    growth: number;
  }[];
  productPerformance: {
    product: string;
    usage: number;
    satisfaction: number;
    retention: number;
  }[];
  marketAnalysis: {
    metric: string;
    value: number;
    benchmark: number;
    position: string;
  }[];
}

export const EnterpriseIntelligenceDashboard = ({ className }: EnterpriseIntelligenceProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "security" | "performance" | "predictive" | "business">("overview");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "90d">("7d");
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [predictiveAnalytics, setPredictiveAnalytics] = useState<PredictiveAnalytics | null>(null);
  const [businessIntelligence, setBusinessIntelligence] = useState<BusinessIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  // Load enterprise intelligence data
  useEffect(() => {
    loadEnterpriseData();
  }, [timeRange, loadEnterpriseData]);

  // Auto-refresh mechanism
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadEnterpriseData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, timeRange, loadEnterpriseData]);

  const loadEnterpriseData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/sam/enterprise-intelligence", {
        action: "get-dashboard-data",
        data: {
          timeRange,
          metrics: ["security", "performance", "predictive", "business"]
        }
      });

      if (response.data.success) {
        const { security, performance, predictive, business } = response.data.data;
        setSecurityMetrics(security);
        setPerformanceMetrics(performance);
        setPredictiveAnalytics(predictive);
        setBusinessIntelligence(business);
      } else {
        // Use demo data as fallback
        setSecurityMetrics(getDemoSecurityMetrics());
        setPerformanceMetrics(getDemoPerformanceMetrics());
        setPredictiveAnalytics(getDemoPredictiveAnalytics());
        setBusinessIntelligence(getDemoBusinessIntelligence());
      }
    } catch (error) {
      console.error("Failed to load enterprise intelligence data:", error);
      // Use demo data as fallback
      setSecurityMetrics(getDemoSecurityMetrics());
      setPerformanceMetrics(getDemoPerformanceMetrics());
      setPredictiveAnalytics(getDemoPredictiveAnalytics());
      setBusinessIntelligence(getDemoBusinessIntelligence());
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <LineChart className="w-4 h-4 text-blue-600" />;
      default: return <LineChart className="w-4 h-4 text-gray-600" />;
    }
  };

  const renderOverviewDashboard = () => {
    if (!securityMetrics || !performanceMetrics || !businessIntelligence) return null;

    return (
      <div className="space-y-6">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">System Health</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {performanceMetrics.systemHealth}%
                  </p>
                </div>
                <div className="p-3 bg-green-200 dark:bg-green-800 rounded-full">
                  <Activity className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={performanceMetrics.systemHealth} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Security Score</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {securityMetrics.complianceScore}%
                  </p>
                </div>
                <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
              <div className="mt-4">
                <Badge className={cn("text-xs", getThreatLevelColor(securityMetrics.threatLevel))}>
                  {securityMetrics.threatLevel.toUpperCase()} THREAT
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Revenue Growth</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">+24.5%</p>
                </div>
                <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-purple-600 dark:text-purple-400">vs. last quarter</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Response Time</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {performanceMetrics.responseTime}ms
                  </p>
                </div>
                <div className="p-3 bg-orange-200 dark:bg-orange-800 rounded-full">
                  <Zap className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  {performanceMetrics.responseTime < 200 ? 'Excellent' : 
                   performanceMetrics.responseTime < 500 ? 'Good' : 'Needs attention'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Critical Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityMetrics.securityIncidents
                .filter(incident => incident.severity === 'high' || incident.severity === 'critical')
                .slice(0, 3)
                .map((incident) => (
                  <div key={incident.id} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{incident.description}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {incident.timestamp.toLocaleString()} • {incident.type}
                      </p>
                    </div>
                    <Badge variant={incident.status === 'resolved' ? 'default' : 'destructive'}>
                      {incident.status}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Real-time Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Live Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm">{performanceMetrics.serverLoad.cpu}%</span>
                </div>
                <Progress value={performanceMetrics.serverLoad.cpu} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm">{performanceMetrics.serverLoad.memory}%</span>
                </div>
                <Progress value={performanceMetrics.serverLoad.memory} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Disk Usage</span>
                  <span className="text-sm">{performanceMetrics.serverLoad.disk}%</span>
                </div>
                <Progress value={performanceMetrics.serverLoad.disk} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Global Infrastructure Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceMetrics.regions.map((region) => (
                  <div key={region.name} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full", {
                        'bg-green-500': region.status === 'healthy',
                        'bg-yellow-500': region.status === 'warning',
                        'bg-red-500': region.status === 'critical'
                      })} />
                      <span className="font-medium text-sm">{region.name}</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {region.latency}ms
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderSecurityDashboard = () => {
    if (!securityMetrics) return null;

    return (
      <div className="space-y-6">
        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{securityMetrics.activeThreats}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Threats</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{securityMetrics.blockedAttacks}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Blocked Attacks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Eye className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{securityMetrics.vulnerabilities}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vulnerabilities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{securityMetrics.complianceScore}%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Compliance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Recent Security Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityMetrics.securityIncidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", {
                      'bg-red-500': incident.severity === 'critical',
                      'bg-orange-500': incident.severity === 'high',
                      'bg-yellow-500': incident.severity === 'medium',
                      'bg-blue-500': incident.severity === 'low'
                    })} />
                    <div>
                      <p className="font-medium text-sm">{incident.description}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {incident.timestamp.toLocaleString()} • {incident.type}
                      </p>
                    </div>
                  </div>
                  <Badge variant={incident.status === 'resolved' ? 'default' : 'destructive'}>
                    {incident.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPerformanceDashboard = () => {
    if (!performanceMetrics) return null;

    return (
      <div className="space-y-6">
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Gauge className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{performanceMetrics.systemHealth}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">System Health</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{performanceMetrics.responseTime}ms</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Response Time</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">{performanceMetrics.uptime}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold">{performanceMetrics.errorRate}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Error Rate</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <p className="text-2xl font-bold">{performanceMetrics.throughput}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Throughput/sec</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Server Load Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              Server Load Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm">{performanceMetrics.serverLoad.cpu}%</span>
                  </div>
                  <Progress value={performanceMetrics.serverLoad.cpu} className="h-3" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm">{performanceMetrics.serverLoad.memory}%</span>
                  </div>
                  <Progress value={performanceMetrics.serverLoad.memory} className="h-3" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Disk Usage</span>
                    <span className="text-sm">{performanceMetrics.serverLoad.disk}%</span>
                  </div>
                  <Progress value={performanceMetrics.serverLoad.disk} className="h-3" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Network Usage</span>
                    <span className="text-sm">{performanceMetrics.serverLoad.network}%</span>
                  </div>
                  <Progress value={performanceMetrics.serverLoad.network} className="h-3" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPredictiveDashboard = () => {
    if (!predictiveAnalytics) return null;

    return (
      <div className="space-y-6">
        {/* Predictive Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                User Growth Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ClientLineChart
                  data={predictiveAnalytics.userGrowthForecast}
                  xDataKey="period"
                  lineDataKey="predicted"
                  color="#8b5cf6"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Revenue Projections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ClientAreaChart
                  data={predictiveAnalytics.revenueProjections}
                  xDataKey="month"
                  areaDataKey="projected"
                  color="#10b981"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Assessments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Risk Assessment Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictiveAnalytics.riskAssessments.map((risk, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{risk.category}</h4>
                    <Badge variant={risk.risk > 70 ? 'destructive' : risk.risk > 40 ? 'default' : 'secondary'}>
                      {risk.risk}% Risk
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Impact: </span>
                      <span className="text-gray-600 dark:text-gray-400">{risk.impact}</span>
                    </div>
                    <div>
                      <span className="font-medium">Likelihood: </span>
                      <span className="text-gray-600 dark:text-gray-400">{risk.likelihood}</span>
                    </div>
                    <div>
                      <span className="font-medium">Mitigation: </span>
                      <span className="text-gray-600 dark:text-gray-400">{risk.mitigation}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              AI-Powered Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictiveAnalytics.trends.map((trend, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  {getTrendIcon(trend.direction)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{trend.metric}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{trend.prediction}</p>
                  </div>
                  <Badge variant="outline">
                    {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}{Math.abs(trend.change)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderBusinessDashboard = () => {
    if (!businessIntelligence) return null;

    return (
      <div className="space-y-6">
        {/* KPI Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Key Performance Indicators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businessIntelligence.kpis.map((kpi, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{kpi.name}</h4>
                    {getTrendIcon(kpi.trend)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{kpi.value}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{kpi.unit}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Target: {kpi.target}{kpi.unit}</span>
                      <span className={cn(
                        kpi.change > 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {kpi.change > 0 ? '+' : ''}{kpi.change}%
                      </span>
                    </div>
                    <Progress value={(kpi.value / kpi.target) * 100} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Segments & Product Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Segments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {businessIntelligence.customerSegments.map((segment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div>
                      <p className="font-medium text-sm">{segment.segment}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {segment.count} customers • ${segment.revenue.toLocaleString()} revenue
                      </p>
                    </div>
                    <Badge variant={segment.growth > 0 ? 'default' : 'destructive'}>
                      {segment.growth > 0 ? '+' : ''}{segment.growth}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {businessIntelligence.productPerformance.map((product, index) => (
                  <div key={index} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{product.product}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs">{product.satisfaction}/5</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Usage: </span>
                        <span className="font-medium">{product.usage}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Retention: </span>
                        <span className="font-medium">{product.retention}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Competitive Market Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {businessIntelligence.marketAnalysis.map((metric, index) => (
                <div key={index} className="p-4 rounded-lg border text-center">
                  <h4 className="font-medium text-sm mb-2">{metric.metric}</h4>
                  <p className="text-2xl font-bold mb-1">{metric.value}%</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Benchmark: {metric.benchmark}%
                  </p>
                  <Badge variant={metric.value > metric.benchmark ? 'default' : 'secondary'}>
                    {metric.position}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading && !securityMetrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 animate-pulse text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading Enterprise Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enterprise Intelligence</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced analytics, security monitoring, and business insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label className="text-sm">Auto-refresh</Label>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadEnterpriseData()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Gauge className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="predictive">
            <Brain className="w-4 h-4 mr-2" />
            Predictive
          </TabsTrigger>
          <TabsTrigger value="business">
            <Target className="w-4 h-4 mr-2" />
            Business
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverviewDashboard()}
        </TabsContent>

        <TabsContent value="security">
          {renderSecurityDashboard()}
        </TabsContent>

        <TabsContent value="performance">
          {renderPerformanceDashboard()}
        </TabsContent>

        <TabsContent value="predictive">
          {renderPredictiveDashboard()}
        </TabsContent>

        <TabsContent value="business">
          {renderBusinessDashboard()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Demo data functions
function getDemoSecurityMetrics(): SecurityMetrics {
  const now = new Date();
  return {
    threatLevel: 'medium',
    activeThreats: 3,
    blockedAttacks: 247,
    vulnerabilities: 12,
    complianceScore: 94,
    lastScan: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    securityIncidents: [
      {
        id: '1',
        type: 'DDoS Attack',
        severity: 'high',
        description: 'Multiple failed login attempts detected from suspicious IP ranges',
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        status: 'investigating'
      },
      {
        id: '2',
        type: 'Malware Detection',
        severity: 'critical',
        description: 'Suspicious file upload patterns detected in course materials',
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        status: 'resolved'
      },
      {
        id: '3',
        type: 'Data Breach Attempt',
        severity: 'medium',
        description: 'Unauthorized API access attempt from foreign IP addresses',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        status: 'pending'
      }
    ]
  };
}

function getDemoPerformanceMetrics(): PerformanceMetrics {
  return {
    systemHealth: 94,
    responseTime: 185,
    uptime: 99.8,
    errorRate: 0.2,
    throughput: 1247,
    serverLoad: {
      cpu: 67,
      memory: 78,
      disk: 45,
      network: 23
    },
    regions: [
      { name: 'US East', latency: 45, status: 'healthy' },
      { name: 'US West', latency: 52, status: 'healthy' },
      { name: 'Europe', latency: 89, status: 'warning' },
      { name: 'Asia Pacific', latency: 134, status: 'healthy' },
      { name: 'South America', latency: 156, status: 'critical' }
    ]
  };
}

function getDemoPredictiveAnalytics(): PredictiveAnalytics {
  return {
    userGrowthForecast: [
      { period: 'Jan 2025', predicted: 1250, confidence: 89 },
      { period: 'Feb 2025', predicted: 1420, confidence: 87 },
      { period: 'Mar 2025', predicted: 1650, confidence: 85 },
      { period: 'Apr 2025', predicted: 1890, confidence: 82 },
      { period: 'May 2025', predicted: 2100, confidence: 78 },
      { period: 'Jun 2025', predicted: 2350, confidence: 75 }
    ],
    revenueProjections: [
      { month: 'Jan', projected: 45000 },
      { month: 'Feb', projected: 52000 },
      { month: 'Mar', projected: 58000 },
      { month: 'Apr', projected: 64000 },
      { month: 'May', projected: 71000 },
      { month: 'Jun', projected: 78000 }
    ],
    riskAssessments: [
      {
        category: 'Data Security',
        risk: 25,
        impact: 'High',
        likelihood: 'Low',
        mitigation: 'Enhanced encryption protocols'
      },
      {
        category: 'System Downtime',
        risk: 35,
        impact: 'Medium',
        likelihood: 'Medium',
        mitigation: 'Redundant infrastructure setup'
      },
      {
        category: 'Compliance Violations',
        risk: 15,
        impact: 'High',
        likelihood: 'Very Low',
        mitigation: 'Regular compliance audits'
      },
      {
        category: 'Talent Retention',
        risk: 45,
        impact: 'Medium',
        likelihood: 'Medium',
        mitigation: 'Improved compensation packages'
      }
    ],
    trends: [
      {
        metric: 'User Engagement',
        direction: 'up',
        change: 12,
        prediction: 'Expected to continue growing due to new features'
      },
      {
        metric: 'Course Completion Rate',
        direction: 'up',
        change: 8,
        prediction: 'AI-powered personalization improving outcomes'
      },
      {
        metric: 'Support Tickets',
        direction: 'down',
        change: -15,
        prediction: 'Better documentation reducing user confusion'
      },
      {
        metric: 'Revenue per User',
        direction: 'stable',
        change: 2,
        prediction: 'Stable growth with potential for premium features'
      }
    ]
  };
}

function getDemoBusinessIntelligence(): BusinessIntelligence {
  return {
    kpis: [
      { name: 'Monthly Recurring Revenue', value: 125000, target: 150000, unit: '$', trend: 'up', change: 12 },
      { name: 'Customer Acquisition Cost', value: 45, target: 40, unit: '$', trend: 'down', change: -8 },
      { name: 'Customer Lifetime Value', value: 1250, target: 1000, unit: '$', trend: 'up', change: 15 },
      { name: 'Churn Rate', value: 3.2, target: 5.0, unit: '%', trend: 'down', change: -22 },
      { name: 'Net Promoter Score', value: 67, target: 70, unit: '', trend: 'up', change: 5 },
      { name: 'Course Completion Rate', value: 78, target: 80, unit: '%', trend: 'up', change: 3 }
    ],
    customerSegments: [
      { segment: 'Enterprise', count: 45, revenue: 85000, growth: 22 },
      { segment: 'SMB', count: 234, revenue: 125000, growth: 15 },
      { segment: 'Individual', count: 1567, revenue: 45000, growth: 8 },
      { segment: 'Educational', count: 89, revenue: 35000, growth: -5 }
    ],
    productPerformance: [
      { product: 'Core LMS Platform', usage: 95, satisfaction: 4.3, retention: 92 },
      { product: 'AI Tutoring System', usage: 78, satisfaction: 4.6, retention: 89 },
      { product: 'Analytics Dashboard', usage: 65, satisfaction: 4.1, retention: 85 },
      { product: 'Mobile App', usage: 82, satisfaction: 4.4, retention: 88 }
    ],
    marketAnalysis: [
      { metric: 'Market Share', value: 12, benchmark: 15, position: 'Growing' },
      { metric: 'Customer Satisfaction', value: 87, benchmark: 82, position: 'Above Average' },
      { metric: 'Feature Completeness', value: 94, benchmark: 85, position: 'Industry Leader' },
      { metric: 'Price Competitiveness', value: 78, benchmark: 75, position: 'Competitive' }
    ]
  };
}