'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  User,
  Zap,
  AlertTriangle,
  RefreshCw,
  Terminal,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tool } from '@/app/dashboard/admin/tools/_components/ToolsClient';

interface ExecutionMonitorProps {
  tools: Tool[];
}

interface Execution {
  id: string;
  toolId: string;
  toolName: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  input?: string;
  output?: string;
  error?: string;
}

// Simulated real-time data for demonstration
const generateMockExecution = (tools: Tool[]): Execution => {
  const tool = tools[Math.floor(Math.random() * tools.length)] || {
    id: 'mock',
    name: 'Mock Tool',
  };
  const statuses: Execution['status'][] = ['pending', 'running', 'completed', 'failed'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    id: Math.random().toString(36).slice(2),
    toolId: tool.id,
    toolName: tool.name,
    userId: `user_${Math.random().toString(36).slice(2, 10)}`,
    status,
    startedAt: new Date(Date.now() - Math.random() * 60000),
    completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
    duration: status === 'completed' ? Math.floor(Math.random() * 5000) + 100 : undefined,
  };
};

export function ExecutionMonitor({ tools }: ExecutionMonitorProps) {
  const [isLive, setIsLive] = useState(true);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [stats, setStats] = useState({
    activeExecutions: 0,
    completedToday: 0,
    failedToday: 0,
    avgDuration: 0,
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive || tools.length === 0) return;

    const interval = setInterval(() => {
      const newExecution = generateMockExecution(tools);
      setExecutions((prev) => [newExecution, ...prev].slice(0, 50));

      // Update stats
      setStats((prev) => ({
        activeExecutions: Math.floor(Math.random() * 10) + 1,
        completedToday: prev.completedToday + (newExecution.status === 'completed' ? 1 : 0),
        failedToday: prev.failedToday + (newExecution.status === 'failed' ? 1 : 0),
        avgDuration: Math.floor(Math.random() * 1500) + 500,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive, tools]);

  // Initialize with some mock data
  useEffect(() => {
    if (tools.length > 0) {
      const initialExecutions = Array.from({ length: 10 }, () => generateMockExecution(tools));
      setExecutions(initialExecutions);
      setStats({
        activeExecutions: 3,
        completedToday: 127,
        failedToday: 4,
        avgDuration: 842,
      });
    }
  }, [tools]);

  const getStatusConfig = (status: Execution['status']) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100', label: 'Pending' };
      case 'running':
        return { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Running' };
      case 'completed':
        return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Completed' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Failed' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Status Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-3 h-3 rounded-full',
              isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            )} />
            <span className={cn(
              'text-sm font-medium',
              isLive ? 'text-emerald-600' : 'text-slate-500'
            )}>
              {isLive ? 'Live Monitoring' : 'Paused'}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <span className="text-sm text-slate-500">
            {executions.length} recent executions
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className={cn(
              'border-slate-200',
              isLive
                ? 'text-amber-600 hover:text-amber-500 hover:bg-amber-50'
                : 'text-emerald-600 hover:text-emerald-500 hover:bg-emerald-50'
            )}
          >
            {isLive ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Resume
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (tools.length > 0) {
                const newExecutions = Array.from({ length: 10 }, () => generateMockExecution(tools));
                setExecutions(newExecutions);
              }
            }}
            className="border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Executions', value: stats.activeExecutions, icon: Activity, color: 'blue' },
          { label: 'Completed Today', value: stats.completedToday, icon: CheckCircle, color: 'emerald' },
          { label: 'Failed Today', value: stats.failedToday, icon: AlertTriangle, color: 'red' },
          { label: 'Avg Duration', value: `${stats.avgDuration}ms`, icon: Clock, color: 'violet' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'relative overflow-hidden rounded-xl p-4',
              'bg-white border border-slate-200 shadow-sm'
            )}
          >
            <div
              className={cn(
                'absolute inset-0 opacity-5',
                stat.color === 'blue' && 'bg-gradient-to-br from-blue-500 to-transparent',
                stat.color === 'emerald' && 'bg-gradient-to-br from-emerald-500 to-transparent',
                stat.color === 'red' && 'bg-gradient-to-br from-red-500 to-transparent',
                stat.color === 'violet' && 'bg-gradient-to-br from-violet-500 to-transparent'
              )}
            />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className={cn(
                  'text-2xl font-bold font-mono mt-1',
                  stat.color === 'blue' && 'text-blue-600',
                  stat.color === 'emerald' && 'text-emerald-600',
                  stat.color === 'red' && 'text-red-600',
                  stat.color === 'violet' && 'text-violet-600'
                )}>
                  {stat.value}
                </p>
              </div>
              <stat.icon className={cn(
                'w-6 h-6 opacity-50',
                stat.color === 'blue' && 'text-blue-500',
                stat.color === 'emerald' && 'text-emerald-500',
                stat.color === 'red' && 'text-red-500',
                stat.color === 'violet' && 'text-violet-500'
              )} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Execution Feed */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-slate-700">Execution Feed</span>
          {isLive && (
            <span className="ml-auto text-xs text-slate-500">Auto-updating...</span>
          )}
        </div>

        <div
          ref={scrollRef}
          className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 bg-white"
        >
          <AnimatePresence initial={false}>
            {executions.map((execution, index) => {
              const statusConfig = getStatusConfig(execution.status);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={execution.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors',
                    index === 0 && isLive && 'bg-blue-50/50'
                  )}
                >
                  {/* Status Icon */}
                  <div className={cn('p-2 rounded-lg', statusConfig.bg)}>
                    <StatusIcon className={cn(
                      'w-4 h-4',
                      statusConfig.color,
                      execution.status === 'running' && 'animate-pulse'
                    )} />
                  </div>

                  {/* Tool Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-800 truncate">
                        {execution.toolName}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          execution.status === 'completed' && 'border-emerald-500/30 text-emerald-600',
                          execution.status === 'failed' && 'border-red-500/30 text-red-600',
                          execution.status === 'running' && 'border-blue-500/30 text-blue-600',
                          execution.status === 'pending' && 'border-slate-500/30 text-slate-500'
                        )}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {execution.userId.slice(0, 12)}...
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {execution.startedAt.toLocaleTimeString()}
                      </span>
                      {execution.duration && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {execution.duration}ms
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Live Indicator for running */}
                  {execution.status === 'running' && (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {executions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-slate-100 mb-4">
                <Activity className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-700">No executions yet</h3>
              <p className="text-sm text-slate-500 mt-1">
                Tool executions will appear here in real-time
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tool Usage Chart Placeholder */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <span className="text-sm font-medium text-slate-700">Tool Usage Distribution</span>
        </div>
        <div className="p-4 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tools.slice(0, 8).map((tool, index) => {
              const usage = Math.floor(Math.random() * 100);
              const colors = ['blue', 'emerald', 'violet', 'amber', 'cyan', 'rose', 'indigo', 'teal'];
              const color = colors[index % colors.length];

              return (
                <div key={tool.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 truncate">{tool.name}</span>
                    <span className="text-slate-500 font-mono">{usage}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${usage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={cn(
                        'h-full rounded-full',
                        color === 'cyan' && 'bg-cyan-500',
                        color === 'emerald' && 'bg-emerald-500',
                        color === 'violet' && 'bg-violet-500',
                        color === 'amber' && 'bg-amber-500',
                        color === 'blue' && 'bg-blue-500',
                        color === 'rose' && 'bg-rose-500',
                        color === 'indigo' && 'bg-indigo-500',
                        color === 'teal' && 'bg-teal-500'
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
