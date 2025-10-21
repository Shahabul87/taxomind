"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Clock, ExternalLink, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface RedirectStat {
  from: string;
  to: string;
  accessCount: number;
  lastAccessed: string | null;
  daysUntilRemoval: number;
}

interface MonitoringData {
  stats: {
    totalRedirects: number;
    redirects: RedirectStat[];
  };
  safeToRemove: RedirectStat[];
}

export function RedirectMonitorWidget() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/monitoring/redirect-stats');
      if (!response.ok) throw new Error('Failed to fetch monitoring data');

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      toast.error('Failed to load redirect monitoring data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Loading Redirect Monitoring...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { stats, safeToRemove } = data;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Post Routes Migration Monitor
          </span>
          <Badge variant="outline" className="ml-2">
            {stats?.totalRedirects || 0} Total Redirects
          </Badge>
        </CardTitle>
        <CardDescription>
          Tracking redirect usage from old /post/* routes to new /teacher/posts/* routes
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Redirect Statistics */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Redirects</h3>

          {stats?.redirects?.map((redirect) => (
            <div key={redirect.from} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    {redirect.from}
                  </span>
                  <ExternalLink className="h-3 w-3 text-gray-400" />
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    {redirect.to}
                  </span>
                </div>
                <Badge variant={redirect.accessCount > 50 ? "destructive" : "secondary"}>
                  {redirect.accessCount} hits
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>
                  Last accessed: {
                    redirect.lastAccessed
                      ? new Date(redirect.lastAccessed).toLocaleDateString()
                      : 'Never'
                  }
                </span>
                <span>
                  Remove in: {redirect.daysUntilRemoval} days
                </span>
              </div>

              <Progress
                value={Math.max(0, Math.min(100, (90 - redirect.daysUntilRemoval) / 90 * 100))}
                className="h-1"
              />
            </div>
          ))}
        </div>

        {/* Safe to Remove Section */}
        {safeToRemove && safeToRemove.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  Safe to Remove
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  The following redirects have minimal usage and can be safely removed:
                </p>
                <ul className="mt-2 space-y-1">
                  {safeToRemove.map((redirect) => (
                    <li key={redirect.from} className="text-sm font-mono text-green-600 dark:text-green-400">
                      {redirect.from} ({redirect.accessCount} total hits)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Migration Status */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Migration Timeline
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>✅ Migration completed: January 17, 2025</li>
                <li>📊 Monitoring period: 3 months</li>
                <li>🗑️ Redirect removal: April 17, 2025</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMonitoringData}
          >
            Refresh Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href="/docs/POST_ROUTES_MIGRATION.md" target="_blank">
              View Documentation
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}