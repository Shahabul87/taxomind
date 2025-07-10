"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ApprovalDashboardProps {
  data: any;
  onRefresh: () => void;
}

export function ApprovalDashboard({ data, onRefresh }: ApprovalDashboardProps) {
  const [timeRange, setTimeRange] = useState('7d');

  const getApprovalRate = () => {
    const total = data.workflowStats.APPROVED + data.workflowStats.REJECTED;
    if (total === 0) return 0;
    return (data.workflowStats.APPROVED / total) * 100;
  };

  const getAverageProcessingTime = () => {
    // Mock calculation - in real implementation, this would come from analytics
    return "2.5 hours";
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.overdueApprovals.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getApprovalRate().toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Processing</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {getAverageProcessingTime()}
            </div>
            <p className="text-xs text-muted-foreground">
              Average time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => {
              const count = data.pendingApprovals.filter((a: any) => a.priority === priority).length;
              const percentage = data.pendingApprovals.length > 0 ? (count / data.pendingApprovals.length) * 100 : 0;
              
              return (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={priority === 'URGENT' ? 'destructive' : 'secondary'}>
                      {priority}
                    </Badge>
                    <span className="text-sm">{count} items</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Progress value={percentage} className="h-2" />
                    <span className="text-xs text-muted-foreground">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentApprovals.slice(0, 5).map((approval: any) => (
              <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {approval.status === 'APPROVED' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {approval.version.title || `${approval.version.contentType} Version`}
                    </p>
                    <p className="text-xs text-gray-600">
                      {approval.status.toLowerCase()} {formatDistanceToNow(new Date(approval.reviewedAt))} ago
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {approval.version.contentType}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}