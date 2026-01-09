'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Search,
  RefreshCw,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  User,
  Cpu,
  Clock,
  FileJson,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tool, AuditEntry } from '@/app/dashboard/admin/tools/_components/ToolsClient';

interface AuditLogViewerProps {
  tools: Tool[];
}

const levelConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  warn: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
  debug: { icon: CheckCircle, color: 'text-slate-500', bg: 'bg-slate-100' },
};

const actionLabels: Record<string, { label: string; color: string }> = {
  tool_invoked: { label: 'Invoked', color: 'text-blue-600' },
  tool_completed: { label: 'Completed', color: 'text-emerald-600' },
  tool_failed: { label: 'Failed', color: 'text-red-600' },
  permission_granted: { label: 'Permission Granted', color: 'text-violet-600' },
  permission_denied: { label: 'Permission Denied', color: 'text-amber-600' },
  confirmation_requested: { label: 'Confirmation Requested', color: 'text-blue-600' },
  confirmation_approved: { label: 'Approved', color: 'text-emerald-600' },
  confirmation_denied: { label: 'Denied', color: 'text-red-600' },
};

export function AuditLogViewer({ tools }: AuditLogViewerProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [toolFilter, setToolFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const limit = 20;

  const fetchAuditLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', (page * limit).toString());

      if (levelFilter !== 'all') params.set('level', levelFilter);
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (toolFilter !== 'all') params.set('toolId', toolFilter);
      if (startDate) params.set('startDate', startDate.toISOString());
      if (endDate) params.set('endDate', endDate.toISOString());

      const response = await fetch(`/api/admin/agentic/tools/audit?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEntries(data.data.entries);
          setTotal(data.data.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, levelFilter, actionFilter, toolFilter, startDate, endDate]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const totalPages = Math.ceil(total / limit);

  const getToolName = (toolId: string | undefined) => {
    if (!toolId) return 'N/A';
    const tool = tools.find((t) => t.id === toolId);
    return tool?.name || toolId;
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by user ID, session, or invocation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[130px] bg-slate-50 border-slate-200 text-slate-700">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all" className="text-slate-700">All Levels</SelectItem>
            <SelectItem value="error" className="text-red-600">Error</SelectItem>
            <SelectItem value="warn" className="text-amber-600">Warning</SelectItem>
            <SelectItem value="info" className="text-blue-600">Info</SelectItem>
            <SelectItem value="debug" className="text-slate-500">Debug</SelectItem>
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 text-slate-700">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all" className="text-slate-700">All Actions</SelectItem>
            <SelectItem value="tool_invoked" className="text-slate-700">Invoked</SelectItem>
            <SelectItem value="tool_completed" className="text-slate-700">Completed</SelectItem>
            <SelectItem value="tool_failed" className="text-slate-700">Failed</SelectItem>
            <SelectItem value="confirmation_requested" className="text-slate-700">Confirmation Requested</SelectItem>
            <SelectItem value="confirmation_approved" className="text-slate-700">Approved</SelectItem>
            <SelectItem value="confirmation_denied" className="text-slate-700">Denied</SelectItem>
          </SelectContent>
        </Select>

        <Select value={toolFilter} onValueChange={setToolFilter}>
          <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 text-slate-700">
            <SelectValue placeholder="Tool" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all" className="text-slate-700">All Tools</SelectItem>
            {tools.map((tool) => (
              <SelectItem key={tool.id} value={tool.id} className="text-slate-700">
                {tool.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[130px] justify-start text-left font-normal',
                  'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100',
                  !startDate && 'text-slate-400'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'MMM d') : 'Start'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border-slate-200" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                className="text-slate-700"
              />
            </PopoverContent>
          </Popover>
          <span className="text-slate-400">-</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[130px] justify-start text-left font-normal',
                  'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100',
                  !endDate && 'text-slate-400'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'MMM d') : 'End'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border-slate-200" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                className="text-slate-700"
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAuditLogs}
          disabled={isLoading}
          className="border-slate-200 text-slate-600 hover:bg-slate-100"
        >
          <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing <span className="text-blue-600 font-mono">{entries.length}</span> of{' '}
          <span className="font-mono">{total}</span> entries
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-1">Level</div>
          <div className="col-span-2">Action</div>
          <div className="col-span-2">Tool</div>
          <div className="col-span-2">User</div>
          <div className="col-span-2">Session</div>
          <div className="col-span-1"></div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100 bg-white">
          {isLoading ? (
            <AuditLogSkeleton />
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-slate-100 mb-4">
                <FileJson className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-700">No audit entries found</h3>
              <p className="text-sm text-slate-500 mt-1">
                Try adjusting your filters or date range
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {entries.map((entry, index) => {
                const levelConf = levelConfig[entry.level] || levelConfig.info;
                const LevelIcon = levelConf.icon;
                const actionConf = actionLabels[entry.action] || { label: entry.action, color: 'text-slate-400' };
                const isExpanded = expandedEntry === entry.id;

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <div
                      onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                      className={cn(
                        'grid grid-cols-12 gap-4 px-4 py-3 cursor-pointer transition-colors',
                        'hover:bg-slate-50',
                        isExpanded && 'bg-blue-50/50'
                      )}
                    >
                      <div className="col-span-2 flex items-center">
                        <span className="text-sm font-mono text-slate-500">
                          {format(new Date(entry.timestamp), 'MMM d, HH:mm:ss')}
                        </span>
                      </div>
                      <div className="col-span-1 flex items-center">
                        <div className={cn('p-1.5 rounded-lg', levelConf.bg)}>
                          <LevelIcon className={cn('w-4 h-4', levelConf.color)} />
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className={cn('text-sm font-medium', actionConf.color)}>
                          {actionConf.label}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700 truncate">
                            {getToolName(entry.toolId)}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-500 font-mono truncate">
                            {entry.userId.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className="text-sm text-slate-500 font-mono truncate">
                          {entry.sessionId.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-100 bg-slate-50"
                        >
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                                  Full User ID
                                </p>
                                <p className="text-sm font-mono text-slate-700">{entry.userId}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                                  Full Session ID
                                </p>
                                <p className="text-sm font-mono text-slate-700">{entry.sessionId}</p>
                              </div>
                              {entry.invocationId && (
                                <div>
                                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                                    Invocation ID
                                  </p>
                                  <p className="text-sm font-mono text-slate-700">{entry.invocationId}</p>
                                </div>
                              )}
                              {entry.toolId && (
                                <div>
                                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                                    Tool ID
                                  </p>
                                  <p className="text-sm font-mono text-slate-700">{entry.toolId}</p>
                                </div>
                              )}
                            </div>

                            {entry.error && (
                              <div>
                                <p className="text-xs font-medium text-red-600 uppercase mb-1">
                                  Error Details
                                </p>
                                <pre className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm font-mono text-red-700 overflow-x-auto">
                                  {JSON.stringify(entry.error, null, 2)}
                                </pre>
                              </div>
                            )}

                            {entry.metadata && (
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                                  Metadata
                                </p>
                                <pre className="p-3 rounded-lg bg-white border border-slate-200 text-sm font-mono text-slate-600 overflow-x-auto">
                                  {JSON.stringify(entry.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            Previous
          </Button>
          <span className="text-sm text-slate-500">
            Page <span className="font-mono text-blue-600">{page + 1}</span> of{' '}
            <span className="font-mono">{totalPages}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function AuditLogSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3 animate-pulse">
          <div className="col-span-2">
            <div className="h-4 w-24 bg-slate-200 rounded" />
          </div>
          <div className="col-span-1">
            <div className="h-8 w-8 bg-slate-200 rounded-lg" />
          </div>
          <div className="col-span-2">
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>
          <div className="col-span-2">
            <div className="h-4 w-24 bg-slate-200 rounded" />
          </div>
          <div className="col-span-2">
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>
          <div className="col-span-2">
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>
          <div className="col-span-1" />
        </div>
      ))}
    </>
  );
}
