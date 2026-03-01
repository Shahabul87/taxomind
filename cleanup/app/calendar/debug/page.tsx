"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { logger } from '@/lib/logger';

export default function CalendarDebugPage() {
  const { data: session, status } = useSession();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/debug/calendar");
        const data = await response.json();
        setDebugInfo(data);
      } catch (err) {
        setError("Failed to load debug information");
        logger.error('Failed to load debug information:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDebugInfo();
  }, []);

  const testCalendarEndpoint = async () => {
    try {
      setTestLoading(true);
      const userId = session?.user?.id;
      
      if (!userId) {
        setTestResult({
          success: false,
          error: "No user ID available. Please sign in."
        });
        return;
      }
      
      const response = await fetch(`/api/calendar/events?userId=${userId}`);
      const data = await response.json();
      setTestResult({
        status: response.status,
        statusText: response.statusText,
        data
      });
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error"
      });
    } finally {
      setTestLoading(false);
    }
  };

  const renderStatus = (value: boolean | null) => {
    if (value === null) return "⚪ Unknown";
    return value ? "🟢 Success" : "🔴 Failed";
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Calendar Debug Page</h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
        <p>Session status: <span className="font-mono">{status}</span></p>
        <p>User ID: <span className="font-mono">{session?.user?.id || "Not authenticated"}</span></p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">System Diagnostic</h2>
        {loading ? (
          <p>Loading diagnostic information...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="space-y-4">
            <p>Authentication: {renderStatus(debugInfo?.status?.isAuthenticated)}</p>
            <p>Database Connection: {renderStatus(debugInfo?.status?.dbConnected)}</p>
            <p>Calendar Events: {debugInfo?.status?.eventCount !== null ? debugInfo.status.eventCount : "Unknown"}</p>
            {debugInfo?.error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                <p className="text-red-500 font-semibold">Error: {debugInfo.error}</p>
              </div>
            )}
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60 text-sm">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Test Calendar API</h2>
        <button
          onClick={testCalendarEndpoint}
          disabled={testLoading || !session?.user?.id}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {testLoading ? "Testing..." : "Test Calendar API"}
        </button>

        {testResult && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60 text-sm">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 