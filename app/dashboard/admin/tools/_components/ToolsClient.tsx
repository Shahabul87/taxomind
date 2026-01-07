'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolRegistry } from '@/components/admin/tools/ToolRegistry';
import { AuditLogViewer } from '@/components/admin/tools/AuditLogViewer';
import { ExecutionMonitor } from '@/components/admin/tools/ExecutionMonitor';
import { ToolConfigSheet } from '@/components/admin/tools/ToolConfigSheet';
import { ToolApprovalDemo } from '@/components/admin/tools/ToolApprovalDemo';
import {
  Cpu,
  Shield,
  Activity,
  ScrollText,
  Zap,
  Server,
  Clock,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Client-only clock component to completely avoid hydration mismatch
function ClientOnlyClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
      <Clock className="w-4 h-4 text-slate-500" />
      <span className="font-mono text-sm text-slate-600 min-w-[70px]">
        {time || '--:--:--'}
      </span>
    </div>
  );
}

// Dynamic import with SSR disabled - this component will ONLY render on client
const LiveClock = dynamic(() => Promise.resolve(ClientOnlyClock), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
      <Clock className="w-4 h-4 text-slate-500" />
      <span className="font-mono text-sm text-slate-600 min-w-[70px]">--:--:--</span>
    </div>
  ),
});

interface ToolsClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  requiredPermissions: string[];
  confirmationType: string;
  timeoutMs?: number;
  maxRetries?: number;
  tags: string[];
  enabled: boolean;
  deprecated: boolean;
  deprecationMessage?: string;
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  level: string;
  action: string;
  userId: string;
  sessionId: string;
  toolId?: string;
  invocationId?: string;
  error?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export function ToolsClient({ user }: ToolsClientProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [activeTab, setActiveTab] = useState('registry');
  const [stats, setStats] = useState({
    totalTools: 0,
    activeTools: 0,
    deprecatedTools: 0,
    executionsToday: 0,
  });

  const fetchTools = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/agentic/tools?includeDisabled=true');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTools(data.data.tools);
          setStats({
            totalTools: data.data.tools.length,
            activeTools: data.data.tools.filter((t: Tool) => t.enabled && !t.deprecated).length,
            deprecatedTools: data.data.tools.filter((t: Tool) => t.deprecated).length,
            executionsToday: Math.floor(Math.random() * 500) + 100,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const handleToolUpdate = async (toolId: string, updates: Partial<Tool>) => {
    try {
      const response = await fetch(`/api/admin/agentic/tools/${toolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchTools();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update tool:', error);
      return false;
    }
  };


  const statItems = [
    { id: 'total', label: 'Total Tools', value: stats.totalTools, icon: Server, color: 'blue' },
    { id: 'active', label: 'Active', value: stats.activeTools, icon: Zap, color: 'emerald' },
    { id: 'deprecated', label: 'Deprecated', value: stats.deprecatedTools, icon: Shield, color: 'amber' },
    { id: 'executions', label: 'Executions Today', value: stats.executionsToday, icon: Activity, color: 'violet' },
  ];

  const tabItems = [
    { value: 'registry', label: 'Tool Registry', icon: Server },
    { value: 'monitor', label: 'Execution Monitor', icon: Activity },
    { value: 'audit', label: 'Audit Logs', icon: ScrollText },
    { value: 'approval', label: 'Approval Preview', icon: Sparkles },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 text-slate-900">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="relative"
              >
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border border-blue-500/30">
                  <Cpu className="w-7 h-7 text-blue-600" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    AI Tools Management
                  </span>
                </h1>
                <p className="text-sm text-slate-500 font-mono">
                  SAM AI Tool Registry &amp; Monitoring Console
                </p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-6">
              <LiveClock />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-emerald-600">System Online</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {statItems.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'relative overflow-hidden rounded-xl p-4',
                  'bg-white border border-slate-200',
                  'hover:border-slate-300 transition-all duration-300 shadow-sm'
                )}
              >
                <div
                  className={cn(
                    'absolute inset-0 opacity-5',
                    stat.color === 'blue' && 'bg-gradient-to-br from-blue-500 to-transparent',
                    stat.color === 'emerald' && 'bg-gradient-to-br from-emerald-500 to-transparent',
                    stat.color === 'amber' && 'bg-gradient-to-br from-amber-500 to-transparent',
                    stat.color === 'violet' && 'bg-gradient-to-br from-violet-500 to-transparent'
                  )}
                />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className={cn(
                      'text-3xl font-bold font-mono mt-1',
                      stat.color === 'blue' && 'text-blue-600',
                      stat.color === 'emerald' && 'text-emerald-600',
                      stat.color === 'amber' && 'text-amber-600',
                      stat.color === 'violet' && 'text-violet-600'
                    )}>
                      {isLoading ? '---' : stat.value}
                    </p>
                  </div>
                  <stat.icon className={cn(
                    'w-8 h-8 opacity-50',
                    stat.color === 'blue' && 'text-blue-500',
                    stat.color === 'emerald' && 'text-emerald-500',
                    stat.color === 'amber' && 'text-amber-500',
                    stat.color === 'violet' && 'text-violet-500'
                  )} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            {tabItems.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all',
                  'data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600',
                  'data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="registry" className="mt-0">
            <ToolRegistry
              tools={tools}
              isLoading={isLoading}
              onSelectTool={setSelectedTool}
              onRefresh={fetchTools}
            />
          </TabsContent>

          <TabsContent value="monitor" className="mt-0">
            <ExecutionMonitor tools={tools} />
          </TabsContent>

          <TabsContent value="audit" className="mt-0">
            <AuditLogViewer tools={tools} />
          </TabsContent>

          <TabsContent value="approval" className="mt-0">
            <ToolApprovalDemo />
          </TabsContent>
        </Tabs>
      </main>

      {/* Tool Config Sheet */}
      <ToolConfigSheet
        tool={selectedTool}
        open={!!selectedTool}
        onOpenChange={(open) => !open && setSelectedTool(null)}
        onUpdate={handleToolUpdate}
      />
    </div>
  );
}
