"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, AlertCircle, CheckCircle, XCircle, TrendingUp, Users, FileText, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { ApprovalDashboard } from './_components/approval-dashboard';
import dynamic from 'next/dynamic';
const ApprovalAnalytics = dynamic(
  () => import('./_components/approval-analytics').then(mod => ({ default: mod.ApprovalAnalytics })),
  { ssr: false, loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" /> }
);
import { WorkflowTemplates } from './_components/workflow-templates';

interface DashboardData {
  pendingApprovals: any[];
  recentApprovals: any[];
  overdueApprovals: any[];
  workflowStats: Record<string, number>;
}

export default function ContentGovernanceDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/content-governance/dashboard');
      const data = await response.json();
      
      if (response.ok) {
        setDashboardData(data.dashboard);
      } else {
        toast.error(data.error || 'Failed to fetch dashboard data');
      }
    } catch (error: any) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Content Governance Dashboard</h1>
        <Button onClick={fetchDashboardData} variant="outline">
          Refresh
        </Button>
      </div>

      {dashboardData && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Approvals
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.pendingApprovals.length}</div>
                <p className="text-xs text-muted-foreground">
                  Waiting for your review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overdue Items
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{dashboardData.overdueApprovals.length}</div>
                <p className="text-xs text-muted-foreground">
                  Past due date
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Approved Today
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData.workflowStats.APPROVED || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Approved items
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Rejected Items
                </CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.workflowStats.REJECTED || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Rejected items
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
              <TabsTrigger value="recent">Recent Activity</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="templates">Workflow Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Pending Approvals ({dashboardData.pendingApprovals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.pendingApprovals.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No pending approvals
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData.pendingApprovals.map((approval) => (
                        <div
                          key={approval.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold">
                                {approval.version.title || `${approval.version.contentType} Version`}
                              </h3>
                              <p className="text-sm text-gray-600">
                                By {approval.version.author.name} • {formatDistanceToNow(new Date(approval.createdAt))} ago
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Badge className={getPriorityColor(approval.priority)}>
                                  {approval.priority}
                                </Badge>
                                <Badge variant="outline">
                                  {approval.version.contentType}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/content-governance/approval/${approval.id}`, '_blank')}
                              >
                                Review
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recent">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.recentApprovals.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No recent activity
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData.recentApprovals.map((approval) => (
                        <div
                          key={approval.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold">
                                {approval.version.title || `${approval.version.contentType} Version`}
                              </h3>
                              <p className="text-sm text-gray-600">
                                By {approval.version.author.name} • Reviewed {formatDistanceToNow(new Date(approval.reviewedAt))} ago
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Badge className={getStatusColor(approval.status)}>
                                  {approval.status}
                                </Badge>
                                <Badge variant="outline">
                                  {approval.version.contentType}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <ApprovalAnalytics />
            </TabsContent>

            <TabsContent value="templates">
              <WorkflowTemplates />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}