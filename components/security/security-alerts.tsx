'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle2, 
  Clock, 
  Eye,
  Filter,
  RefreshCw,
  XCircle
} from 'lucide-react';

interface SecurityAlert {
  id: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  description: string;
  details: any;
  status: 'OPEN' | 'RESOLVED' | 'INVESTIGATING';
  createdAt: string;
  resolvedAt?: string;
}

interface AlertsResponse {
  success: boolean;
  events: SecurityAlert[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const SecurityAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    severity: 'all',
    status: 'all',
    eventType: 'all',
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  const loadAlerts = React.useCallback(async (offset = 0) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString(),
      });

      if (filters.severity !== 'all') params.append('severity', filters.severity);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.eventType !== 'all') params.append('eventType', filters.eventType);

      const response = await fetch(`/api/security/alerts?${params}`);
      const result: AlertsResponse = await response.json();

      if (result.success) {
        setAlerts(offset === 0 ? result.events : [...alerts, ...result.events]);
        setPagination(result.pagination);
      } else {
        toast.error('Failed to load security alerts');
      }
    } catch (error) {
      console.error('Failed to load security alerts:', error);
      toast.error('Failed to load security alerts');
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.limit, alerts]);

  // Load security alerts
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/security/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'RESOLVED',
          resolution: 'Resolved by user'
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Alert resolved successfully');
        setDetailsDialogOpen(false);
        loadAlerts(); // Reload alerts
      } else {
        toast.error('Failed to resolve alert');
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'HIGH': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'MEDIUM': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'LOW': return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'RESOLVED': return 'default';
      case 'INVESTIGATING': return 'secondary';
      case 'OPEN': return 'destructive';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getEventTypeDisplayName = (eventType: string) => {
    switch (eventType) {
      case 'FINGERPRINT_MISMATCH': return 'Device Change Detected';
      case 'SESSION_CREATED': return 'New Session';
      case 'SESSION_TERMINATED': return 'Session Ended';
      case 'DEVICE_TRUSTED': return 'Device Trusted';
      case 'DEVICE_TRUST_REVOKED': return 'Device Trust Revoked';
      default: return eventType.replace(/_/g, ' ');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <Select
                value={filters.severity}
                onValueChange={(value) => setFilters({ ...filters, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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
            
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <Select
                value={filters.eventType}
                onValueChange={(value) => setFilters({ ...filters, eventType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="FINGERPRINT_MISMATCH">Device Changes</SelectItem>
                  <SelectItem value="SESSION_CREATED">New Sessions</SelectItem>
                  <SelectItem value="SESSION_TERMINATED">Session Ended</SelectItem>
                  <SelectItem value="DEVICE_TRUSTED">Device Trusted</SelectItem>
                  <SelectItem value="DEVICE_TRUST_REVOKED">Trust Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {alerts.length} of {pagination.total} alerts
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAlerts(0)}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Alerts
          </CardTitle>
          <CardDescription>
            Monitor security events and potential threats to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && alerts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No security alerts found</p>
              <p className="text-sm">Your account security looks good!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{getEventTypeDisplayName(alert.eventType)}</p>
                        <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(alert.status)}>
                          {alert.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(alert.createdAt)}
                        </span>
                        {alert.resolvedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Resolved {formatDate(alert.resolvedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAlert(alert);
                      setDetailsDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              ))}
              
              {pagination.hasMore && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => loadAlerts(pagination.offset + pagination.limit)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlert && getSeverityIcon(selectedAlert.severity)}
              {selectedAlert && getEventTypeDisplayName(selectedAlert.eventType)}
            </DialogTitle>
            <DialogDescription>
              Detailed information about this security event
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <p className="text-sm text-muted-foreground">{selectedAlert.severity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm text-muted-foreground">{selectedAlert.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Source</label>
                  <p className="text-sm text-muted-foreground">{selectedAlert.source}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Occurred At</label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedAlert.createdAt)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <p className="text-sm text-muted-foreground">{selectedAlert.description}</p>
              </div>
              
              {selectedAlert.details && Object.keys(selectedAlert.details).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium mb-2 block">Additional Details</label>
                    <div className="bg-muted/50 p-3 rounded text-sm">
                      {selectedAlert.details.changes && (
                        <div className="mb-2">
                          <strong>Changes Detected:</strong>
                          <ul className="list-disc list-inside mt-1 text-muted-foreground">
                            {selectedAlert.details.changes.map((change: string, index: number) => (
                              <li key={index}>{change}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedAlert.details.similarity !== undefined && (
                        <div className="mb-2">
                          <strong>Device Similarity:</strong>
                          <span className="ml-2 text-muted-foreground">
                            {(selectedAlert.details.similarity * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                      {selectedAlert.details.deviceName && (
                        <div className="mb-2">
                          <strong>Device:</strong>
                          <span className="ml-2 text-muted-foreground">
                            {selectedAlert.details.deviceName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedAlert?.status === 'OPEN' && (
              <Button onClick={() => resolveAlert(selectedAlert.id)}>
                Mark as Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecurityAlerts;