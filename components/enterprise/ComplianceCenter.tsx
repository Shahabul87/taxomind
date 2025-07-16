'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, Clock, 
  FileText, Download, Eye, Filter, Search, RefreshCw,
  Activity, TrendingUp, TrendingDown, BarChart3
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ComplianceEvent {
  id: string;
  eventType: string;
  complianceFramework: string;
  status: string;
  severity: string;
  details: any;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ComplianceSummary {
  totalEvents: number;
  statusBreakdown: { status: string; count: number }[];
  severityBreakdown: { severity: string; count: number }[];
  frameworkBreakdown: { framework: string; count: number }[];
  recentCritical: ComplianceEvent[];
  complianceScore: number;
}

interface ComplianceCenterProps {
  className?: string;
}

export function ComplianceCenter({ className }: ComplianceCenterProps) {
  const [events, setEvents] = useState<ComplianceEvent[]>([]);
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const fetchComplianceData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(frameworkFilter !== 'all' && { framework: frameworkFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(severityFilter !== 'all' && { severity: severityFilter }),
      });

      const response = await fetch(`/api/enterprise/compliance?${params}`);
      const data = await response.json();

      if (data.success) {
        setEvents(data.data.events);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search, frameworkFilter, statusFilter, severityFilter]);

  useEffect(() => {
    fetchComplianceData();
  }, [fetchComplianceData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'RESOLVED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'NON_COMPLIANT': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'PENDING_ACTION': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getFrameworkColor = (framework: string) => {
    switch (framework) {
      case 'GDPR': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'CCPA': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'FERPA': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'HIPAA': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'SOX': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'RESOLVED': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'NON_COMPLIANT': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'UNDER_REVIEW': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'PENDING_ACTION': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading compliance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Compliance Center
            </h2>
            <p className="text-muted-foreground">
              Monitor governance, compliance, and regulatory requirements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchComplianceData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Compliance Score */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Overall Compliance Score
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-blue-600">
                  {summary?.complianceScore || 0}%
                </div>
                <div className="flex items-center gap-2">
                  {(summary?.complianceScore || 0) >= 80 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {(summary?.complianceScore || 0) >= 80 ? 'Good' : 'Needs Attention'}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-32 h-32">
              <Progress 
                value={summary?.complianceScore || 0} 
                className="h-32 w-32 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{summary?.totalEvents || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Compliant</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary?.statusBreakdown.find(s => s.status === 'COMPLIANT')?.count || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Issues</p>
                  <p className="text-2xl font-bold text-red-600">
                    {summary?.severityBreakdown.find(s => s.severity === 'CRITICAL')?.count || 0}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Under Review</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {summary?.statusBreakdown.find(s => s.status === 'UNDER_REVIEW')?.count || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compliance Details */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8">
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events">Compliance Events</TabsTrigger>
            <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frameworks</SelectItem>
                  <SelectItem value="GDPR">GDPR</SelectItem>
                  <SelectItem value="CCPA">CCPA</SelectItem>
                  <SelectItem value="FERPA">FERPA</SelectItem>
                  <SelectItem value="HIPAA">HIPAA</SelectItem>
                  <SelectItem value="SOX">SOX</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="COMPLIANT">Compliant</SelectItem>
                  <SelectItem value="NON_COMPLIANT">Non-Compliant</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="PENDING_ACTION">Pending Action</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Events List */}
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {getStatusIcon(event.status)}
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {event.eventType.replace('_', ' ')}
                          </h3>
                          <Badge className={getFrameworkColor(event.complianceFramework)}>
                            {event.complianceFramework}
                          </Badge>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {event.organization?.name || 'Global'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(event.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(event.status)}>
                          {event.status.replace('_', ' ')}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="frameworks" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary?.frameworkBreakdown.map((framework) => (
                <Card key={framework.framework} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className={getFrameworkColor(framework.framework)}>
                        {framework.framework}
                      </Badge>
                      <span className="text-2xl font-bold">{framework.count}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Events</span>
                        <span>{framework.count}</span>
                      </div>
                      <Progress 
                        value={(framework.count / (summary?.totalEvents || 1)) * 100} 
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary?.statusBreakdown.map((status) => (
                      <div key={status.status} className="flex items-center justify-between">
                        <span className="text-sm">{status.status.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(status.count / (summary?.totalEvents || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{status.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-red-600" />
                    Severity Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary?.severityBreakdown.map((severity) => (
                      <div key={severity.severity} className="flex items-center justify-between">
                        <span className="text-sm">{severity.severity}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-600 h-2 rounded-full" 
                              style={{ width: `${(severity.count / (summary?.totalEvents || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{severity.count}</span>
                        </div>
                      </div>
                    ))}
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