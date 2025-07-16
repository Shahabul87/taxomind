"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bug, 
  RefreshCw, 
  User, 
  Database, 
  Link as LinkIcon, 
  Settings,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface DebugData {
  environment: {
    nodeEnv: string;
    timestamp: string;
    debugMode: string;
  };
  session: any;
  user: any;
  profileLinks: any[];
  socialMediaAccounts: any[];
  database: any;
  requestInfo: any;
  error: string | null;
}

interface UserDebugPanelProps {
  className?: string;
  defaultOpen?: boolean;
}

export function UserDebugPanel({ className = "", defaultOpen = false }: UserDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [testData, setTestData] = useState({ platform: "Twitter", url: "https://twitter.com/test" });
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const fetchDebugData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/debug/user');
      setDebugData(response.data);
      setLastFetch(new Date());
      toast.success('Debug data refreshed');
    } catch (error) {
      console.error('Failed to fetch debug data:', error);
      toast.error('Failed to fetch debug data');
    } finally {
      setIsLoading(false);
    }
  };

  const performAction = async (action: string, data?: any) => {
    try {
      const response = await axios.post('/api/debug/user', { action, data });
      toast.success(`Action "${action}" completed successfully`);
      
      // Refresh data after action
      await fetchDebugData();
      
      return response.data;
    } catch (error) {
      console.error(`Action "${action}" failed:`, error);
      toast.error(`Action "${action}" failed`);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatJson = (obj: any) => JSON.stringify(obj, null, 2);

  useEffect(() => {
    if (isOpen && !debugData) {
      fetchDebugData();
    }
  }, [isOpen, debugData]); // Added missing dependency

  // Only show in development or if explicitly enabled
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isExplicitlyEnabled = typeof window !== 'undefined' && window.localStorage.getItem('debug-mode') === 'true';
  
  if (!isDevelopment && !isExplicitlyEnabled) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg"
          size="sm"
        >
          <Bug className="w-4 h-4 mr-2" />
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-[600px] max-h-[80vh] ${className}`}>
      <Card className="bg-slate-900 border-orange-600 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-orange-400 flex items-center gap-2 text-lg">
              <Bug className="w-5 h-5" />
              User Debug Panel
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={fetchDebugData}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="border-orange-600 text-orange-400 hover:bg-orange-950"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {lastFetch && (
            <p className="text-xs text-slate-400">
              Last updated: {lastFetch.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>

        <CardContent className="max-h-[60vh] overflow-y-auto">
          {!debugData ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2 text-orange-400" />
              <span className="text-slate-400">Loading debug data...</span>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="session" className="text-xs">Session</TabsTrigger>
                <TabsTrigger value="data" className="text-xs">Data</TabsTrigger>
                <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3 mt-4">
                {/* Environment */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Environment
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Mode:</span>{" "}
                      <Badge variant={debugData.environment.nodeEnv === 'development' ? 'default' : 'destructive'}>
                        {debugData.environment.debugMode}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-slate-400">Database:</span>{" "}
                      <Badge variant={debugData.database?.status === 'connected' ? 'default' : 'destructive'}>
                        {debugData.database?.status || 'unknown'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-800 p-2 rounded">
                      <div className="text-slate-400">User ID:</div>
                      <div className="text-white font-mono text-xs break-all">
                        {debugData.session?.user?.id || 'Not logged in'}
                      </div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded">
                      <div className="text-slate-400">Profile Links:</div>
                      <div className="text-white font-bold">
                        {debugData.user?.counts?.profileLinks || 0}
                      </div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded">
                      <div className="text-slate-400">Social Accounts:</div>
                      <div className="text-white font-bold">
                        {debugData.user?.counts?.socialAccounts || 0}
                      </div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded">
                      <div className="text-slate-400">Posts:</div>
                      <div className="text-white font-bold">
                        {debugData.user?.counts?.posts || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Errors */}
                {debugData.error && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Error
                    </h3>
                    <div className="bg-red-950 border border-red-600 p-2 rounded text-xs text-red-200">
                      {debugData.error}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="session" className="space-y-3 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Session Data</h3>
                    <Button
                      onClick={() => copyToClipboard(formatJson(debugData.session), 'Session')}
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedItem === 'Session' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  <pre className="text-xs bg-slate-800 p-3 rounded overflow-x-auto text-green-400 font-mono">
                    {formatJson(debugData.session)}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="data" className="space-y-3 mt-4">
                {/* Profile Links */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Profile Links ({debugData.profileLinks.length})
                    </h3>
                    <Button
                      onClick={() => copyToClipboard(formatJson(debugData.profileLinks), 'Profile Links')}
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedItem === 'Profile Links' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  {debugData.profileLinks.length > 0 ? (
                    <div className="space-y-1">
                      {debugData.profileLinks.map((link, index) => (
                        <div key={index} className="bg-slate-800 p-2 rounded text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-400">{link.platform}</span>
                            <span className="text-slate-400">{new Date(link.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-slate-300 break-all">{link.url}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs italic">No profile links found</div>
                  )}
                </div>

                {/* User Counts */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Data Counts
                  </h3>
                  <pre className="text-xs bg-slate-800 p-3 rounded text-blue-400 font-mono">
                    {formatJson(debugData.user?.counts || {})}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="actions" className="space-y-3 mt-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Test Actions</h3>
                  
                  {/* Test Profile Link */}
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Test Add Profile Link</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Platform"
                        value={testData.platform}
                        onChange={(e) => setTestData(prev => ({ ...prev, platform: e.target.value }))}
                        className="text-xs bg-slate-800 border-slate-600"
                      />
                      <Input
                        placeholder="URL"
                        value={testData.url}
                        onChange={(e) => setTestData(prev => ({ ...prev, url: e.target.value }))}
                        className="text-xs bg-slate-800 border-slate-600"
                      />
                    </div>
                    <Button
                      onClick={() => performAction('test-profile-link', testData)}
                      size="sm"
                      className="w-full text-xs"
                      variant="outline"
                    >
                      Add Test Profile Link
                    </Button>
                  </div>

                  {/* Other Actions */}
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      onClick={() => performAction('refresh-session')}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      Refresh Session
                    </Button>
                    
                    {debugData.environment.nodeEnv === 'development' && (
                      <Button
                        onClick={() => performAction('clear-profile-links')}
                        size="sm"
                        variant="destructive"
                        className="text-xs"
                      >
                        Clear All Profile Links
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-800 p-2 rounded">
                    <Info className="w-3 h-3 inline mr-1" />
                    Actions will automatically refresh the debug data
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 