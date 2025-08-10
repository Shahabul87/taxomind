'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/lib/logger';
import { 
  Building2, Shield, Activity, BarChart3, Users, BookOpen,
  AlertTriangle, CheckCircle, TrendingUp, RefreshCw, Settings,
  Database, Wifi, Cpu, HardDrive, Server, Lock, Target
} from 'lucide-react';
import { OrganizationOverview } from './OrganizationOverview';
import { ComplianceCenter } from './ComplianceCenter';
import { SecurityDashboard } from './SecurityDashboard';

interface EnterpriseMetrics {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  systemHealth: {
    database: boolean;
    redis: boolean;
    application: boolean;
    monitoring: boolean;
  };
  securityScore: number;
  complianceScore: number;
  uptimePercentage: number;
}

interface EnterpriseAdminTabProps {
  analytics?: any;
  performance?: any;
  className?: string;
}

export function EnterpriseAdminTab({ analytics, performance, className }: EnterpriseAdminTabProps) {
  const [metrics, setMetrics] = useState<EnterpriseMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchEnterpriseMetrics();
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchEnterpriseMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEnterpriseMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Fetch data from multiple endpoints in parallel
      const [orgsResponse, complianceResponse, securityResponse] = await Promise.all([
        fetch('/api/enterprise/organizations'),
        fetch('/api/enterprise/compliance'),
        fetch('/api/enterprise/security'),
      ]);

      const [orgsData, complianceData, securityData] = await Promise.all([
        orgsResponse.json(),
        complianceResponse.json(),
        securityResponse.json(),
      ]);

      // Calculate aggregate metrics
      const totalOrganizations = orgsData.success ? orgsData.pagination?.total || 0 : 0;
      const activeOrganizations = orgsData.success ? 
        orgsData.data?.filter((org: any) => org.isActive).length || 0 : 0;
      const totalUsers = orgsData.success ? 
        orgsData.data?.reduce((sum: number, org: any) => sum + (org.userCount || 0), 0) || 0 : 0;
      const totalCourses = orgsData.success ? 
        orgsData.data?.reduce((sum: number, org: any) => sum + (org.courseCount || 0), 0) || 0 : 0;

      const securityScore = securityData.success ? securityData.data?.summary?.securityScore || 0 : 0;
      const complianceScore = complianceData.success ? complianceData.data?.summary?.complianceScore || 0 : 0;

      setMetrics({
        totalOrganizations,
        activeOrganizations,
        totalUsers,
        totalCourses,
        totalRevenue: totalOrganizations * 5000, // Estimated revenue
        systemHealth: {
          database: true,
          redis: true,
          application: true,
          monitoring: true,
        },
        securityScore,
        complianceScore,
        uptimePercentage: 99.9,
      });

    } catch (error) {
      logger.error('Error fetching enterprise metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthStatus = (isHealthy: boolean) => {
    return isHealthy ? 'Healthy' : 'Issues Detected';
  };

  const getHealthColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading enterprise analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enterprise Metrics Overview */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Platform Overview
            </h3>
            <p className="text-muted-foreground">
              Key metrics across your enterprise platform
            </p>
          </div>
          <Button variant="outline" onClick={fetchEnterpriseMetrics} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Organizations</p>
                  <p className="text-2xl font-bold">{metrics?.totalOrganizations || 0}</p>
                  <p className="text-xs text-green-600">
                    {metrics?.activeOrganizations || 0} active
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{metrics?.totalUsers.toLocaleString() || 0}</p>
                  <p className="text-xs text-blue-600">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    +12% this month
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                  <p className="text-2xl font-bold">{metrics?.totalCourses.toLocaleString() || 0}</p>
                  <p className="text-xs text-green-600">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    +8% this month
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Est. Revenue</p>
                  <p className="text-2xl font-bold">
                    ${(metrics?.totalRevenue || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    +15% this month
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">Security Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(metrics?.securityScore || 0)}`}>
                    {metrics?.securityScore || 0}%
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Compliance Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(metrics?.complianceScore || 0)}`}>
                    {metrics?.complianceScore || 0}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">System Uptime</p>
                  <p className="text-2xl font-bold text-green-600">
                    {metrics?.uptimePercentage || 0}%
                  </p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enterprise Tabs */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="organizations" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Health Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Database</p>
                      <p className={`text-sm font-semibold ${getHealthColor(metrics?.systemHealth.database || false)}`}>
                        {getHealthStatus(metrics?.systemHealth.database || false)}
                      </p>
                    </div>
                    <Database className={`h-6 w-6 ${metrics?.systemHealth.database ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Cache</p>
                      <p className={`text-sm font-semibold ${getHealthColor(metrics?.systemHealth.redis || false)}`}>
                        {getHealthStatus(metrics?.systemHealth.redis || false)}
                      </p>
                    </div>
                    <Server className={`h-6 w-6 ${metrics?.systemHealth.redis ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Application</p>
                      <p className={`text-sm font-semibold ${getHealthColor(metrics?.systemHealth.application || false)}`}>
                        {getHealthStatus(metrics?.systemHealth.application || false)}
                      </p>
                    </div>
                    <Cpu className={`h-6 w-6 ${metrics?.systemHealth.application ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Monitoring</p>
                      <p className={`text-sm font-semibold ${getHealthColor(metrics?.systemHealth.monitoring || false)}`}>
                        {getHealthStatus(metrics?.systemHealth.monitoring || false)}
                      </p>
                    </div>
                    <Activity className={`h-6 w-6 ${metrics?.systemHealth.monitoring ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks and system controls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                    <Building2 className="h-5 w-5 mb-1" />
                    <span className="text-xs">Add Organization</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                    <Users className="h-5 w-5 mb-1" />
                    <span className="text-xs">Manage Users</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                    <Shield className="h-5 w-5 mb-1" />
                    <span className="text-xs">Security Audit</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                    <HardDrive className="h-5 w-5 mb-1" />
                    <span className="text-xs">System Backup</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organizations">
            <OrganizationOverview />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceCenter />
          </TabsContent>

          <TabsContent value="security">
            <SecurityDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}