"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Shield, AlertTriangle, Eye, Download, Search, Filter,
  Calendar as CalendarIcon, Clock, User, Activity, Database,
  TrendingUp, BarChart3, PieChart, FileText, Settings,
  RefreshCw, ExternalLink, ChevronRight, Info, CheckCircle,
  XCircle, AlertCircle, Zap, Users, Lock, Globe
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RechartsPie, Cell, AreaChart, Area
} from 'recharts';
import { 
  AuditEvent, 
  AuditQuery, 
  ComplianceReport,
  auditSystem 
} from '@/lib/audit-logging/audit-system';
import { useAuth } from '@/lib/auth/auth-context';
import { toast } from 'sonner';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AuditDashboardProps {
  className?: string;
}

export function AuditDashboard({ className }: AuditDashboardProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [successFilter, setSuccessFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 50;

  // Load data
  useEffect(() => {
    loadAuditData();
  }, [dateRange, searchQuery, categoryFilter, severityFilter, userFilter, successFilter, currentPage]);

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadAuditData = async () => {
    try {
      setLoading(true);
      
      const queryParams: Partial<AuditQuery> = {
        startDate: startOfDay(dateRange.from),
        endDate: endOfDay(dateRange.to),
        page: currentPage,
        limit: pageSize
      };

      if (searchQuery) {
        queryParams.action = searchQuery;
      }
      if (categoryFilter !== 'all') {
        queryParams.category = categoryFilter;
      }
      if (severityFilter !== 'all') {
        queryParams.severity = severityFilter;
      }
      if (userFilter !== 'all') {
        queryParams.userId = userFilter;
      }
      if (successFilter !== 'all') {
        queryParams.success = successFilter === 'true';
      }

      const result = await auditSystem.query(queryParams);
      setEvents(result.events);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast.error('Failed to load audit data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const metricsData = await auditSystem.getAuditMetrics(
        startOfDay(dateRange.from),
        endOfDay(dateRange.to)
      );
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  // Generate compliance report
  const generateReport = async (type: 'GDPR' | 'SOX' | 'HIPAA' | 'FERPA') => {
    try {
      const report = await auditSystem.generateComplianceReport(
        type,
        dateRange.from,
        dateRange.to,
        user?.id || 'system'
      );
      
      // In a real implementation, this would download the report
      toast.success(`${type} compliance report generated`);
      console.log('Generated report:', report);
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    }
  };

  // Get status color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'bg-red-100 text-red-800';
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      case 'data': return 'bg-purple-100 text-purple-800';
      case 'business': return 'bg-green-100 text-green-800';
      case 'performance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Chart colors
  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];

  // Render event details
  const renderEventDetails = (event: AuditEvent) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium">Event ID</div>
          <div className="text-sm text-gray-600">{event.id}</div>
        </div>
        <div>
          <div className="text-sm font-medium">Timestamp</div>
          <div className="text-sm text-gray-600">
            {format(event.timestamp, 'PPpp')}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium">User ID</div>
          <div className="text-sm text-gray-600">{event.userId || 'System'}</div>
        </div>
        <div>
          <div className="text-sm font-medium">IP Address</div>
          <div className="text-sm text-gray-600">{event.ipAddress || 'N/A'}</div>
        </div>
        <div>
          <div className="text-sm font-medium">Session ID</div>
          <div className="text-sm text-gray-600">{event.sessionId}</div>
        </div>
        <div>
          <div className="text-sm font-medium">Success</div>
          <div className="flex items-center gap-1">
            {event.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">{event.success ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Action</div>
        <div className="text-sm bg-gray-50 p-2 rounded">{event.action}</div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Resource</div>
        <div className="text-sm bg-gray-50 p-2 rounded">
          {event.resource} {event.resourceId && `(${event.resourceId})`}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm font-medium">Category</div>
          <Badge className={getCategoryColor(event.category)}>
            {event.category}
          </Badge>
        </div>
        <div>
          <div className="text-sm font-medium">Severity</div>
          <Badge className={getSeverityColor(event.severity)}>
            {event.severity}
          </Badge>
        </div>
        <div>
          <div className="text-sm font-medium">Risk Level</div>
          <Badge className={getSeverityColor(event.risk_level)}>
            {event.risk_level}
          </Badge>
        </div>
      </div>

      {event.error_message && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Error Message</div>
          <div className="text-sm bg-red-50 p-2 rounded text-red-800">
            {event.error_message}
          </div>
        </div>
      )}

      {event.metadata && Object.keys(event.metadata).length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Metadata</div>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        </div>
      )}

      {(event.before || event.after) && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Data Changes</div>
          <div className="grid grid-cols-2 gap-4">
            {event.before && (
              <div>
                <div className="text-xs font-medium mb-1">Before</div>
                <pre className="text-xs bg-red-50 p-2 rounded overflow-auto">
                  {JSON.stringify(event.before, null, 2)}
                </pre>
              </div>
            )}
            {event.after && (
              <div>
                <div className="text-xs font-medium mb-1">After</div>
                <pre className="text-xs bg-green-50 p-2 rounded overflow-auto">
                  {JSON.stringify(event.after, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500">
        {event.sensitive && (
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Sensitive Data
          </div>
        )}
        {event.pii_involved && (
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            PII Involved
          </div>
        )}
        {event.duration && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {event.duration}ms
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system activity and security events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadAuditData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Range Picker */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-64">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                    />
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                    />
                  </div>
                </PopoverContent>
              </Popover>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search actions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={successFilter} onValueChange={setSuccessFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="true">Success</SelectItem>
                  <SelectItem value="false">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalEvents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics.errorRate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Failed operations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.riskScore.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Average risk level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Events</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.eventsByCategory.security || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Security-related events
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Events by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Events by Category</CardTitle>
                  <CardDescription>Distribution of audit events</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <RechartsPie
                        data={Object.entries(metrics.eventsByCategory).map(([name, value]) => ({ name, value }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {Object.entries(metrics.eventsByCategory).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </RechartsPie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Hourly Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Activity</CardTitle>
                  <CardDescription>Events throughout the day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={metrics.hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Active Users</CardTitle>
                  <CardDescription>Users with highest activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.topUsers.slice(0, 5).map((user: any, index: number) => (
                      <div key={user.userId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{user.userId}</span>
                        </div>
                        <span className="text-sm text-gray-600">{user.count} events</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Common Actions</CardTitle>
                  <CardDescription>Most frequent audit actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.topActions.slice(0, 5).map((action: any, index: number) => (
                      <div key={action.action} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{action.action}</span>
                        </div>
                        <span className="text-sm text-gray-600">{action.count} times</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {events.map((event) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-4">
                      <div 
                        className="flex items-center justify-between"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventDialog(true);
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {event.success ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="font-medium">{event.action}</span>
                            </div>
                            
                            <Badge className={getCategoryColor(event.category)}>
                              {event.category}
                            </Badge>
                            
                            <Badge className={getSeverityColor(event.severity)}>
                              {event.severity}
                            </Badge>
                            
                            {event.sensitive && (
                              <Badge variant="outline" className="border-red-300 text-red-600">
                                <Lock className="h-3 w-3 mr-1" />
                                Sensitive
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {event.userId || 'System'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(event.timestamp, 'MMM dd, HH:mm:ss')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Database className="h-3 w-3" />
                              {event.resource}
                            </div>
                            {event.ipAddress && (
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {event.ipAddress}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Severity Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Events by Severity</CardTitle>
                  <CardDescription>Security risk distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(metrics.eventsBySeverity).map(([name, value]) => ({ name, value }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Risk Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment</CardTitle>
                  <CardDescription>Current system risk level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Overall Risk Score</span>
                      <span className="font-bold">{metrics.riskScore.toFixed(1)}/5.0</span>
                    </div>
                    <Progress value={(metrics.riskScore / 5) * 100} className="h-3" />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Critical Events</div>
                        <div className="text-gray-600">{metrics.eventsBySeverity.critical || 0}</div>
                      </div>
                      <div>
                        <div className="font-medium">High Risk Events</div>
                        <div className="text-gray-600">{metrics.eventsBySeverity.high || 0}</div>
                      </div>
                      <div>
                        <div className="font-medium">Security Events</div>
                        <div className="text-gray-600">{metrics.eventsByCategory.security || 0}</div>
                      </div>
                      <div>
                        <div className="font-medium">Failed Operations</div>
                        <div className="text-gray-600">{(metrics.errorRate * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Generate Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Reports</CardTitle>
                <CardDescription>Generate audit reports for compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => generateReport('GDPR')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  GDPR Compliance Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => generateReport('SOX')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  SOX Compliance Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => generateReport('HIPAA')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  HIPAA Compliance Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => generateReport('FERPA')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  FERPA Compliance Report
                </Button>
              </CardContent>
            </Card>

            {/* Compliance Status */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>Current compliance health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>GDPR Compliance</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Good</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span>Data Retention</span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Review</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Security Monitoring</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Good</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span>Audit Coverage</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">95%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Event Detail Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Audit Event Details</DialogTitle>
            <DialogDescription>
              {selectedEvent && `Event ID: ${selectedEvent.id}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <ScrollArea className="flex-1 pr-6">
              {renderEventDetails(selectedEvent)}
            </ScrollArea>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}