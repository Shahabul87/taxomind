"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import {
  RechartsBarChart as BarChart,
  RechartsBar as Bar,
  RechartsXAxis as XAxis,
  RechartsYAxis as YAxis,
  RechartsCartesianGrid as CartesianGrid,
  RechartsTooltip as Tooltip,
  RechartsResponsiveContainer as ResponsiveContainer,
  RechartsLineChart as LineChart,
  RechartsLine as Line,
  RechartsPieChart as PieChart,
  RechartsPie as Pie,
  RechartsCell as Cell,
} from '@/components/lazy-imports';
import { DateRange } from 'react-day-picker';
import { addDays, subDays, format } from 'date-fns';
import { toast } from 'sonner';

export function ApprovalAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [contentType, setContentType] = useState<string>('all');

  const fetchAnalytics = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        ...(contentType !== 'all' && { contentType })
      });

      const response = await fetch(`/api/content-governance/analytics?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setAnalyticsData(data.analytics);
      } else {
        toast.error(data.error || 'Failed to fetch analytics');
      }
    } catch (error: any) {
      toast.error('Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, contentType]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, contentType, fetchAnalytics]);

  const prepareChartData = (analytics: any) => {
    if (!analytics || !analytics.analytics) return [];
    
    return analytics.analytics.map((item: any) => ({
      date: format(new Date(item.date), 'MMM dd'),
      total: item.totalApprovals,
      approved: item.approvedCount,
      rejected: item.rejectedCount,
      pending: item.pendingCount
    }));
  };

  const prepareProcessingTimeData = (analytics: any) => {
    if (!analytics || !analytics.analytics) return [];
    
    return analytics.analytics.map((item: any) => ({
      date: format(new Date(item.date), 'MMM dd'),
      avgTime: item.avgProcessingTime || 0,
      escalationRate: item.escalationRate || 0
    }));
  };

  const pieChartData = analyticsData?.summary ? [
    { name: 'Approved', value: analyticsData.summary._sum.approvedCount || 0, color: '#10b981' },
    { name: 'Rejected', value: analyticsData.summary._sum.rejectedCount || 0, color: '#ef4444' },
    { name: 'Pending', value: analyticsData.summary._sum.pendingCount || 0, color: '#f59e0b' }
  ] : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <DatePickerWithRange
            value={dateRange}
            onChange={setDateRange}
            className="w-[280px]"
          />
        </div>
        <Select value={contentType} onValueChange={setContentType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Content Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="course">Course</SelectItem>
            <SelectItem value="chapter">Chapter</SelectItem>
            <SelectItem value="section">Section</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="article">Article</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchAnalytics} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.summary?._sum?.totalApprovals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analyticsData?.summary?._sum?.totalApprovals > 0 
                ? ((analyticsData.summary._sum.approvedCount / analyticsData.summary._sum.totalApprovals) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analyticsData?.summary?._avg?.avgProcessingTime?.toFixed(1) || 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              Average time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Escalation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analyticsData?.summary?._avg?.escalationRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Escalated items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Approval Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareChartData(analyticsData)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="approved" fill="#10b981" name="Approved" />
                <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processing Time & Escalation Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={prepareProcessingTimeData(analyticsData)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="avgTime" 
                stroke="#3b82f6" 
                name="Avg. Time (hours)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="escalationRate" 
                stroke="#f59e0b" 
                name="Escalation Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}