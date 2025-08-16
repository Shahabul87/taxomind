"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { logout } from "@/actions/logout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { logger } from '@/lib/logger';

export default function TestLogout() {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const router = useRouter();
  const user = useCurrentUser();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testServerActionLogout = async () => {
    try {
      setIsLoading(true);
      addLog("Starting server action logout...");
      
      const result = await logout();
      addLog(`Server action result: ${JSON.stringify(result)}`);
      
      if (result?.success) {
        addLog("Success! Redirecting...");
        router.push("/");
        router.refresh();
      } else {
        addLog("No success flag in result");
      }
    } catch (error: any) {
      addLog(`Server action error: ${error}`);
      logger.error("Server action logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const testClientSideLogout = async () => {
    try {
      setIsLoading(true);
      addLog("Starting client-side logout...");
      
      await signOut({ 
        callbackUrl: "/",
        redirect: true 
      });
      
      addLog("Client-side logout completed");
    } catch (error: any) {
      addLog(`Client-side error: ${error}`);
      logger.error("Client-side logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold mb-6">🔬 Logout Testing</h1>
        
        {/* User Status */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current User Status</h2>
          <p><strong>Logged in:</strong> {user ? "Yes" : "No"}</p>
          <p><strong>User ID:</strong> {user?.id || "None"}</p>
          <p><strong>Email:</strong> {user?.email || "None"}</p>
          <p><strong>Role:</strong> {user?.role || "None"}</p>
        </div>

        {/* Test Buttons */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Test Logout Methods</h2>
          
          <div className="space-y-3">
            <button
              onClick={testServerActionLogout}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? "Testing..." : "Test Server Action Logout"}
            </button>
            
            <button
              onClick={testClientSideLogout}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? "Testing..." : "Test Client-Side Logout"}
            </button>
            
            <button
              onClick={clearLogs}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 italic">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-sm font-mono bg-white p-2 rounded">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Manual Navigation */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Manual Navigation</h2>
          <div className="space-x-2">
            <button
              onClick={() => router.push("/")}
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Go to Home
            </button>
            <button
              onClick={() => router.push("/auth/login")}
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}