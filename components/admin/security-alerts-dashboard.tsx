"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Shield, 
  Activity, 
  Users, 
  Clock,
  RefreshCw,
  Download,
  Eye,
  Ban
} from 'lucide-react';
import { toast } from 'sonner';

interface SecurityAlert {
  id: string;
  timestamp: string;
  eventType: string;
  severity: string;
  message: string;
  userEmail?: string;
  ipAddress?: string;
  riskScore: number;
}

interface AuthMetrics {
  totalLogins: number;
  failedLogins: number;
  successRate: string;
  suspiciousActivities: number;
  roleChanges: number;
  newRegistrations: number;
  timeWindow: string;
}

const SecurityAlertsDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<AuthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState(24);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSecurityData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      
      const [alertsResponse, metricsResponse] = await Promise.all([
        fetch(`/api/admin/security-alerts?timeWindow=${timeWindow}`),
        fetch(`/api/admin/security-alerts?timeWindow=${timeWindow}&type=metrics`)
      ]);

      if (!alertsResponse.ok || !metricsResponse.ok) {
        throw new Error('Failed to fetch security data');
      }

      const alertsData = await alertsResponse.json();
      const metricsData = await metricsResponse.json();

      setAlerts(alertsData.data || []);
      setMetrics(metricsData.data || null);
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setRefreshing(false);
    }
  }, [timeWindow]);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500';
      case 'ERROR':
        return 'bg-red-400';
      case 'WARNING':
        return 'bg-yellow-500';
      case 'INFO':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleForceLogout = async (alert: SecurityAlert) => {
    if (!alert.userEmail) {
      toast.error('No user email available for this alert');
      return;
    }

    try {
      const response = await fetch('/api/admin/security-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'force_logout',
          targetEmail: alert.userEmail,
          reason: `Security alert: ${alert.eventType}`
        })
      });

      if (response.ok) {
        toast.success(`Forced logout initiated for ${alert.userEmail}`);
        fetchSecurityData(true);
      } else {
        throw new Error('Failed to force logout');
      }
    } catch (error) {
      console.error('Error forcing logout:', error);
      toast.error('Failed to force logout');
    }
  };

  const handleMarkSuspicious = async (alert: SecurityAlert) => {
    if (!alert.userEmail) {
      toast.error('No user email available for this alert');
      return;
    }

    try {
      const response = await fetch('/api/admin/security-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_suspicious',
          targetEmail: alert.userEmail,
          reason: `Marked from alert: ${alert.eventType} - ${alert.message}`
        })
      });

      if (response.ok) {
        toast.success(`User ${alert.userEmail} marked as suspicious`);
        fetchSecurityData(true);
      } else {
        throw new Error('Failed to mark user as suspicious');
      }
    } catch (error) {
      console.error('Error marking user as suspicious:', error);
      toast.error('Failed to mark user as suspicious');
    }
  };

  const exportSecurityReport = async () => {
    try {
      const response = await fetch('/api/admin/audit-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_compliance_report',
          params: {
            type: 'SOC2',
            startDate: new Date(Date.now() - timeWindow * 60 * 60 * 1000),
            endDate: new Date()
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.report, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Security report exported successfully');
      } else {
        throw new Error('Failed to export report');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export security report');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading security data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Security Alerts Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor authentication events and security threats
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            value={timeWindow} 
            onChange={(e) => setTimeWindow(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            <option value={1}>Last Hour</option>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={168}>Last Week</option>
            <option value={720}>Last Month</option>
          </select>
          <Button 
            onClick={() => fetchSecurityData(true)} 
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportSecurityReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalLogins}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.failedLogins} failed attempts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.successRate}%</div>
              <p className="text-xs text-muted-foreground">
                Authentication success
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspicious Activities</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics.suspiciousActivities}
              </div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.newRegistrations}</div>
              <p className="text-xs text-muted-foreground">
                Registered accounts
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Security Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-green-500 mb-2" />
              <p className="text-muted-foreground">No security alerts in the selected time period</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline">{alert.eventType}</Badge>
                        <Badge 
                          variant={alert.severity === 'CRITICAL' ? 'destructive' : 'secondary'}
                        >
                          {alert.severity}
                        </Badge>
                        {alert.riskScore >= 70 && (
                          <Badge variant="destructive">High Risk</Badge>
                        )}
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {alert.userEmail && (
                          <span className="mr-4">User: {alert.userEmail}</span>
                        )}
                        {alert.ipAddress && (
                          <span className="mr-4">IP: {alert.ipAddress}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                    {alert.userEmail && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleMarkSuspicious(alert)}
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Mark Suspicious
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleForceLogout(alert)}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Force Logout
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Alert Details</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedAlert(null)}
              >
                Close
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Event Type</label>
                  <p>{selectedAlert.eventType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Severity</label>
                  <Badge className={getSeverityColor(selectedAlert.severity)}>
                    {selectedAlert.severity}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Risk Score</label>
                  <p className={`font-bold ${selectedAlert.riskScore >= 70 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {selectedAlert.riskScore}/100
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                  <p>{new Date(selectedAlert.timestamp).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedAlert.userEmail && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User Email</label>
                  <p>{selectedAlert.userEmail}</p>
                </div>
              )}
              
              {selectedAlert.ipAddress && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                  <p>{selectedAlert.ipAddress}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Message</label>
                <p className="bg-muted p-3 rounded text-sm">{selectedAlert.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityAlertsDashboard;