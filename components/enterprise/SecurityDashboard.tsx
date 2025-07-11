'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, Clock,
  Eye, Search, RefreshCw, Activity, TrendingUp, TrendingDown,
  Lock, Unlock, UserX, Bug, Zap, Target, Server
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SecurityEvent {
  id: string;
  eventType: string;
  severity: string;
  source?: string;
  description: string;
  details?: any;
  affectedUsers?: string[];
  mitigationActions?: string[];
  status: string;
  resolvedAt?: string;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface SecuritySummary {
  totalEvents: number;
  statusBreakdown: { status: string; count: number }[];
  severityBreakdown: { severity: string; count: number }[];
  eventTypeBreakdown: { eventType: string; count: number }[];
  recentCritical: SecurityEvent[];
  openCritical: number;
  securityScore: number;
}

interface SecurityDashboardProps {
  className?: string;
}

export function SecurityDashboard({ className }: SecurityDashboardProps) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    fetchSecurityData();
  }, [search, eventTypeFilter, statusFilter, severityFilter]);

  const fetchSecurityData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(eventTypeFilter !== 'all' && { eventType: eventTypeFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(severityFilter !== 'all' && { severity: severityFilter }),
      });

      const response = await fetch(`/api/enterprise/security?${params}`);
      const data = await response.json();

      if (data.success) {
        setEvents(data.data.events);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'DISMISSED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'INVESTIGATING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'OPEN': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
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

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'UNAUTHORIZED_ACCESS': return <Lock className="h-4 w-4 text-red-600" />;
      case 'SUSPICIOUS_ACTIVITY': return <Eye className="h-4 w-4 text-yellow-600" />;
      case 'DATA_BREACH': return <Shield className="h-4 w-4 text-red-600" />;
      case 'POLICY_VIOLATION': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'SYSTEM_INTRUSION': return <Server className="h-4 w-4 text-red-600" />;
      case 'MALWARE_DETECTION': return <Bug className="h-4 w-4 text-red-600" />;
      case 'AUTHENTICATION_FAILURE': return <UserX className="h-4 w-4 text-yellow-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'DISMISSED': return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'INVESTIGATING': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'OPEN': return <AlertTriangle className="h-4 w-4 text-red-600" />;
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

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading security data...</p>
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
              <Shield className="h-6 w-6 text-red-600" />
              Security Command Center
            </h2>
            <p className="text-muted-foreground">
              Monitor threats, incidents, and security posture across the platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchSecurityData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Target className="h-4 w-4 mr-2" />
              Incident Response
            </Button>
          </div>
        </div>

        {/* Security Score */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Security Posture Score
              </h3>
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold ${getSecurityScoreColor(summary?.securityScore || 0)}`}>
                  {summary?.securityScore || 0}%
                </div>
                <div className="flex items-center gap-2">
                  {(summary?.securityScore || 0) >= 80 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {(summary?.securityScore || 0) >= 80 ? 'Secure' : 'At Risk'}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-32 h-32">
              <Progress 
                value={summary?.securityScore || 0} 
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
                <Shield className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Open</p>
                  <p className="text-2xl font-bold text-red-600">
                    {summary?.openCritical || 0}
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
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary?.statusBreakdown.find(s => s.status === 'RESOLVED')?.count || 0}
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
                  <p className="text-sm text-muted-foreground">Investigating</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {summary?.statusBreakdown.find(s => s.status === 'INVESTIGATING')?.count || 0}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Security Details */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8">
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events">Security Events</TabsTrigger>
            <TabsTrigger value="threats">Threat Analysis</TabsTrigger>
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
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="UNAUTHORIZED_ACCESS">Unauthorized Access</SelectItem>
                  <SelectItem value="SUSPICIOUS_ACTIVITY">Suspicious Activity</SelectItem>
                  <SelectItem value="DATA_BREACH">Data Breach</SelectItem>
                  <SelectItem value="POLICY_VIOLATION">Policy Violation</SelectItem>
                  <SelectItem value="SYSTEM_INTRUSION">System Intrusion</SelectItem>
                  <SelectItem value="MALWARE_DETECTION">Malware Detection</SelectItem>
                  <SelectItem value="AUTHENTICATION_FAILURE">Auth Failure</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="DISMISSED">Dismissed</SelectItem>
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
                          {getEventTypeIcon(event.eventType)}
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {event.eventType.replace(/_/g, ' ')}
                          </h3>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                          {event.source && (
                            <Badge variant="outline">
                              {event.source}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{event.organization?.name || 'Global'}</span>
                          <span>•</span>
                          <span>{formatDate(event.createdAt)}</span>
                          {event.affectedUsers && event.affectedUsers.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{event.affectedUsers.length} users affected</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(event.status)}>
                          {getStatusIcon(event.status)}
                          <span className="ml-1">{event.status}</span>
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

          <TabsContent value="threats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary?.eventTypeBreakdown.map((eventType) => (
                <Card key={eventType.eventType} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getEventTypeIcon(eventType.eventType)}
                        <h3 className="font-semibold">{eventType.eventType.replace(/_/g, ' ')}</h3>
                      </div>
                      <span className="text-2xl font-bold">{eventType.count}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Incidents</span>
                        <span>{eventType.count}</span>
                      </div>
                      <Progress 
                        value={(eventType.count / (summary?.totalEvents || 1)) * 100} 
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
                    <Activity className="h-5 w-5 text-blue-600" />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary?.statusBreakdown.map((status) => (
                      <div key={status.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status.status)}
                          <span className="text-sm">{status.status}</span>
                        </div>
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
                    <Zap className="h-5 w-5 text-red-600" />
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