// Admin Analytics Dashboard - System-wide management and infrastructure monitoring

'use client';

import { User } from "next-auth";
import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Loader2, RefreshCw, Shield, Server, Database, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

// Import admin-specific tabs
import { AdminFeaturesTab } from './tabs/AdminFeaturesTab';

interface AdminAnalyticsDashboardProps {
  user: User;
  className?: string;
}

export function AdminAnalyticsDashboard({ user, className }: AdminAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState('system-overview');
  const [systemData, setSystemData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      const response = await fetch('/api/system/health?detailed=true');
      const data = await response.json();
      setSystemData(data);
      setIsLoading(false);
    } catch (error) {
      logger.error('Failed to fetch system data:', error);
      setIsLoading(false);
    }
  };

  const handleRefreshAll = useCallback(() => {
    setIsLoading(true);
    fetchSystemData();
  }, []);

  if (isLoading) {
    return (
      <div className={cn("p-6 space-y-6 max-w-7xl mx-auto", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading system data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", className)}>
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-muted-foreground">System-wide management and infrastructure monitoring</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>3 Admin Tools</span>
              </Badge>
              <Button variant="outline" onClick={handleRefreshAll}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">System Status</p>
                  <p className="text-2xl font-bold">Healthy</p>
                </div>
                <Shield className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Server Uptime</p>
                  <p className="text-2xl font-bold">99.9%</p>
                </div>
                <Server className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Active Services</p>
                  <p className="text-2xl font-bold">18/18</p>
                </div>
                <Activity className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">DB Performance</p>
                  <p className="text-2xl font-bold">Fast</p>
                </div>
                <Database className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resource Usage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">CPU Usage</h3>
                  <span className="text-sm text-muted-foreground">45%</span>
                </div>
                <Progress value={45} className="h-3" />
                <p className="text-xs text-muted-foreground">Normal operating range</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Memory Usage</h3>
                  <span className="text-sm text-muted-foreground">62%</span>
                </div>
                <Progress value={62} className="h-3" />
                <p className="text-xs text-muted-foreground">Optimal performance</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Storage Usage</h3>
                  <span className="text-sm text-muted-foreground">34%</span>
                </div>
                <Progress value={34} className="h-3" />
                <p className="text-xs text-muted-foreground">Plenty of space available</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <TabsTrigger 
              value="system-overview" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              System Overview
            </TabsTrigger>
            <TabsTrigger 
              value="admin-tools" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              Admin Tools
            </TabsTrigger>
            <TabsTrigger 
              value="user-management" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              User Management
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              Security
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="system-overview" className="space-y-6 pt-6">
            <div className="grid gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Platform Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">1,247</div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">156</div>
                      <div className="text-sm text-muted-foreground">Active Courses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">89%</div>
                      <div className="text-sm text-muted-foreground">System Uptime</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">2.1GB</div>
                      <div className="text-sm text-muted-foreground">Data Processed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Recent System Events</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <Activity className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">ML Model Training Completed</p>
                        <p className="text-xs text-muted-foreground">Content recommendation model achieved 94.2% accuracy - 2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <Server className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Database Backup Completed</p>
                        <p className="text-xs text-muted-foreground">Scheduled backup completed successfully - 6 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">High Memory Usage Detected</p>
                        <p className="text-xs text-muted-foreground">Memory usage reached 78% - monitoring continues - 8 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="admin-tools" className="space-y-6 pt-6">
            <AdminFeaturesTab analytics={systemData} performance={null} />
          </TabsContent>
          
          <TabsContent value="user-management" className="space-y-6 pt-6">
            <div className="grid gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">User Statistics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">1,089</div>
                      <div className="text-sm text-muted-foreground">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">142</div>
                      <div className="text-sm text-muted-foreground">Teachers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">16</div>
                      <div className="text-sm text-muted-foreground">Admins</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6 pt-6">
            <div className="grid gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Security Overview</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Two-Factor Authentication</span>
                      <Badge variant="secondary">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>SSL Certificate</span>
                      <Badge variant="secondary">Valid</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Security Scan</span>
                      <Badge variant="secondary">2 days ago</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Failed Login Attempts (24h)</span>
                      <Badge variant="outline">12</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}