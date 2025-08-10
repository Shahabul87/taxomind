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
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/logger';
import { 
  CheckCircle, XCircle, Clock, AlertTriangle, Search, Filter,
  FileText, Users, TrendingUp, Calendar, MessageCircle,
  Eye, Edit, MoreHorizontal, Download, RefreshCw, Plus,
  Workflow, ArrowRight, ArrowDown, Play, Pause, Settings
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  WorkflowInstance, 
  Workflow, 
  workflowEngine 
} from '@/lib/approval-workflows/workflow-engine';
import { useAuth } from '@/lib/auth/auth-context';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface WorkflowDashboardProps {
  viewMode?: 'personal' | 'admin';
  className?: string;
}

export function WorkflowDashboard({ 
  viewMode = 'personal',
  className 
}: WorkflowDashboardProps) {
  const { user } = useAuth();
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [showInstanceDialog, setShowInstanceDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [actionComment, setActionComment] = useState('');
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    instanceId: string;
    stepId: string;
    action: 'approve' | 'reject' | 'request_changes';
  } | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load workflows and instances
      const [workflowList, instanceList, analyticsData] = await Promise.all([
        workflowEngine.listWorkflows(),
        viewMode === 'admin' 
          ? Array.from((workflowEngine as any).instances.values())
          : workflowEngine.getUserInstances(user.id),
        workflowEngine.getWorkflowAnalytics()
      ]);

      setWorkflows(workflowList);
      setInstances(instanceList);
      setAnalytics(analyticsData);
    } catch (error) {
      toast.error('Failed to load workflow data');
      logger.error(error);
    } finally {
      setLoading(false);
    }
  }, [user, viewMode]);

  // Load data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter instances
  const filteredInstances = instances.filter(instance => {
    const matchesSearch = instance.contentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         instance.contentType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || instance.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || instance.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Group instances by status
  const pendingInstances = filteredInstances.filter(i => i.status === 'pending' || i.status === 'in_progress');
  const completedInstances = filteredInstances.filter(i => i.status === 'approved' || i.status === 'rejected');

  // Handle approval actions
  const handleAction = async (
    instanceId: string, 
    stepId: string, 
    action: 'approve' | 'reject' | 'request_changes'
  ) => {
    setPendingAction({ instanceId, stepId, action });
    setShowActionDialog(true);
  };

  const submitAction = async () => {
    if (!pendingAction || !user) return;

    try {
      await workflowEngine.processAction({
        instanceId: pendingAction.instanceId,
        stepId: pendingAction.stepId,
        action: pendingAction.action,
        userId: user.id,
        comment: actionComment || undefined
      });

      toast.success(`Action ${pendingAction.action} submitted successfully`);
      setShowActionDialog(false);
      setPendingAction(null);
      setActionComment('');
      loadData();
    } catch (error) {
      toast.error('Failed to submit action');
      logger.error(error);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render instance card
  const renderInstanceCard = (instance: WorkflowInstance) => {
    const workflow = workflows.find(w => w.id === instance.workflowId);
    const currentStep = workflow?.steps.find(s => s.id === instance.currentStepId);
    const isAssignedToUser = currentStep && user && 
      workflowEngine['isUserAssignee'](user.id, currentStep);

    return (
      <Card key={instance.id} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {instance.contentType.charAt(0).toUpperCase() + instance.contentType.slice(1)}
                <Badge className={`ml-2 ${getStatusColor(instance.status)}`}>
                  {instance.status}
                </Badge>
              </CardTitle>
              <CardDescription>
                ID: {instance.contentId} • Submitted {formatDistanceToNow(instance.submittedAt, { addSuffix: true })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(instance.priority)}>
                {instance.priority}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedInstance(instance);
                  setShowInstanceDialog(true);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Current Step */}
            {currentStep && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium">Current Step</div>
                  <div className="text-sm text-gray-600">{currentStep.name}</div>
                </div>
                {instance.dueDate && (
                  <div className="text-right">
                    <div className="text-sm font-medium">Due</div>
                    <div className="text-sm text-gray-600">
                      {format(instance.dueDate, 'MMM dd, HH:mm')}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{instance.completedSteps.length}/{workflow?.steps.length || 0} steps</span>
              </div>
              <Progress 
                value={(instance.completedSteps.length / (workflow?.steps.length || 1)) * 100} 
                className="h-2"
              />
            </div>

            {/* Actions */}
            {isAssignedToUser && instance.status === 'in_progress' && currentStep && (
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  onClick={() => handleAction(instance.id, currentStep.id, 'approve')}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(instance.id, currentStep.id, 'request_changes')}
                  className="flex-1"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Request Changes
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleAction(instance.id, currentStep.id, 'reject')}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render analytics charts
  const renderAnalytics = () => {
    if (!analytics) return null;

    const statusData = [
      { name: 'Approved', value: completedInstances.filter(i => i.status === 'approved').length, fill: '#10b981' },
      { name: 'Rejected', value: completedInstances.filter(i => i.status === 'rejected').length, fill: '#ef4444' },
      { name: 'Pending', value: pendingInstances.length, fill: '#f59e0b' }
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Approval Rate</CardTitle>
            <CardDescription>Overall workflow outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Volume Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Volume</CardTitle>
            <CardDescription>Daily submission volume (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.volumeByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Processing Time */}
        <Card>
          <CardHeader>
            <CardTitle>Average Processing Time</CardTitle>
            <CardDescription>Time to complete workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(analytics.averageProcessingTime / (1000 * 60 * 60))} hours
            </div>
            <p className="text-sm text-muted-foreground">
              Average time from submission to completion
            </p>
          </CardContent>
        </Card>

        {/* Bottlenecks */}
        <Card>
          <CardHeader>
            <CardTitle>Bottlenecks</CardTitle>
            <CardDescription>Steps taking the longest time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.bottlenecks.slice(0, 3).map((bottleneck: any, index: number) => (
                <div key={bottleneck.stepId} className="flex items-center justify-between">
                  <div className="text-sm font-medium">Step {index + 1}</div>
                  <div className="text-sm text-gray-600">
                    {Math.round(bottleneck.avgTime / (1000 * 60 * 60))}h avg
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {viewMode === 'admin' ? 'Workflow Management' : 'My Workflows'}
          </h1>
          <p className="text-muted-foreground">
            {viewMode === 'admin' 
              ? 'Manage and monitor all approval workflows'
              : 'Review pending approvals and track your submissions'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {viewMode === 'admin' && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInstances.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedInstances.filter(i => i.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedInstances.filter(i => i.status === 'rejected').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Rejected submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics ? Math.round(analytics.averageProcessingTime / (1000 * 60 * 60)) : 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              Processing time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingInstances.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedInstances.length})</TabsTrigger>
            {viewMode === 'admin' && (
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            )}
          </TabsList>
          
          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="pending" className="space-y-4">
          {pendingInstances.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending workflows</h3>
                  <p className="text-gray-500">
                    All workflows are up to date. Great work!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingInstances.map(renderInstanceCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedInstances.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed workflows</h3>
                  <p className="text-gray-500">
                    Completed workflows will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {completedInstances.map(renderInstanceCard)}
            </div>
          )}
        </TabsContent>

        {viewMode === 'admin' && (
          <TabsContent value="analytics" className="space-y-6">
            {renderAnalytics()}
          </TabsContent>
        )}
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.action === 'approve' && 'Approve Workflow'}
              {pendingAction?.action === 'reject' && 'Reject Workflow'}
              {pendingAction?.action === 'request_changes' && 'Request Changes'}
            </DialogTitle>
            <DialogDescription>
              Add a comment to explain your decision (optional).
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              placeholder="Add your comments here..."
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitAction}>
              {pendingAction?.action === 'approve' && 'Approve'}
              {pendingAction?.action === 'reject' && 'Reject'}
              {pendingAction?.action === 'request_changes' && 'Request Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instance Detail Dialog */}
      <Dialog open={showInstanceDialog} onOpenChange={setShowInstanceDialog}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Workflow Details</DialogTitle>
            <DialogDescription>
              {selectedInstance && `${selectedInstance.contentType} • ${selectedInstance.contentId}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInstance && (
            <ScrollArea className="flex-1 pr-6">
              <div className="space-y-6">
                {/* Instance Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Instance Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium">Status</div>
                        <Badge className={getStatusColor(selectedInstance.status)}>
                          {selectedInstance.status}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Priority</div>
                        <Badge className={getPriorityColor(selectedInstance.priority)}>
                          {selectedInstance.priority}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Submitted</div>
                        <div className="text-sm">{format(selectedInstance.submittedAt, 'PPpp')}</div>
                      </div>
                      {selectedInstance.completedAt && (
                        <div>
                          <div className="text-sm font-medium">Completed</div>
                          <div className="text-sm">{format(selectedInstance.completedAt, 'PPpp')}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* History */}
                <Card>
                  <CardHeader>
                    <CardTitle>History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedInstance.history.map((entry, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            {entry.action === 'approve' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {entry.action === 'reject' && <XCircle className="h-4 w-4 text-red-600" />}
                            {entry.action === 'submit' && <Play className="h-4 w-4 text-blue-600" />}
                            {entry.action === 'comment' && <MessageCircle className="h-4 w-4 text-gray-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}</div>
                            <div className="text-sm text-gray-600">
                              by {entry.userId} • {format(entry.timestamp, 'PPpp')}
                            </div>
                            {entry.comment && (
                              <div className="text-sm mt-1 p-2 bg-gray-50 rounded">
                                {entry.comment}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstanceDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}