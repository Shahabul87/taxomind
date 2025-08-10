"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Bug, RefreshCw } from "lucide-react";
import { logger } from '@/lib/logger';

interface DebugCalendarProps {
  userId: string;
}

export function DebugCalendar({ userId }: DebugCalendarProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/debug/calendar-status');
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      setDebugInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      logger.error("Debug calendar error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  if (loading && !debugInfo) {
    return (
      <div className="text-center p-4 text-sm text-gray-500 animate-pulse">
        Loading calendar diagnostics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
        <p className="text-red-500 text-sm">Failed to load diagnostics: {error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchDebugInfo} 
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!debugInfo) {
    return null;
  }

  const hasAuthIssue = debugInfo.auth.status !== "success" || !debugInfo.auth.hasSession;
  const hasDbIssue = debugInfo.database.status !== "connected" || !debugInfo.database.connectionTest;

  return (
    <Card className="p-3 text-xs border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 text-amber-800 dark:text-amber-400 font-medium">
          <Bug className="h-3.5 w-3.5" />
          <span>Calendar Diagnostics</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={fetchDebugInfo}
          className="h-6 w-6 text-amber-600 dark:text-amber-400"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-2 text-gray-700 dark:text-gray-300">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div>User ID:</div>
          <div className="font-mono">{userId || 'N/A'}</div>
          
          <div>Session:</div>
          <div className={hasAuthIssue ? "text-red-500" : "text-green-600 dark:text-green-400"}>
            {debugInfo.auth.hasSession ? "Valid" : "Missing"}
          </div>
          
          <div>Database:</div>
          <div className={hasDbIssue ? "text-red-500" : "text-green-600 dark:text-green-400"}>
            {debugInfo.database.status}
          </div>
          
          <div>Event Count:</div>
          <div>{debugInfo.database.eventCount}</div>
        </div>
        
        {(hasAuthIssue || hasDbIssue) && (
          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded-sm text-red-700 dark:text-red-400">
            {hasAuthIssue && <p>⚠️ Authentication issue detected</p>}
            {hasDbIssue && <p>⚠️ Database connectivity issue detected</p>}
          </div>
        )}
      </div>
    </Card>
  );
} 