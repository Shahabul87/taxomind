'use client';

/**
 * NotificationHistory Component
 *
 * Displays historical notifications with advanced filtering by date,
 * type, and search. Includes export functionality and analytics.
 *
 * @module components/sam/notification-center/NotificationHistory
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Bell,
  MessageSquare,
  AlertCircle,
  Trophy,
  Sparkles,
  Search,
  Calendar,
  Filter,
  Download,
  ChevronDown,
  History,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Loader2,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

// Notification type configuration
const NOTIFICATION_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  SAM_CHECK_IN: {
    icon: MessageSquare,
    label: 'Check-in',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
  },
  SAM_INTERVENTION: {
    icon: AlertCircle,
    label: 'Intervention',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  SAM_MILESTONE: {
    icon: Trophy,
    label: 'Milestone',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  SAM_RECOMMENDATION: {
    icon: Sparkles,
    label: 'Recommendation',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
  },
};

// Date range presets
const DATE_PRESETS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
] as const;

interface NotificationHistoryProps {
  className?: string;
}

interface HistoricalNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  dismissedAt?: string | Date;
  feedback?: string;
  createdAt: string | Date;
  metadata?: Record<string, unknown>;
}

interface NotificationStats {
  total: number;
  byType: Record<string, number>;
  trend: number;
  averagePerDay: number;
}

export function NotificationHistory({ className }: NotificationHistoryProps) {
  const [notifications, setNotifications] = useState<HistoricalNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    Object.keys(NOTIFICATION_CONFIG)
  );
  const [isExporting, setIsExporting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load notification history
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/sam/agentic/notifications?limit=100&includeRead=true`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setNotifications(data.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to load notification history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let result = notifications;

    // Apply type filter
    if (selectedTypes.length < Object.keys(NOTIFICATION_CONFIG).length) {
      result = result.filter((n) => selectedTypes.includes(n.type));
    }

    // Apply date filter
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());
      result = result.filter((n) =>
        isWithinInterval(new Date(n.createdAt), { start: startDate, end: endDate })
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title?.toLowerCase().includes(query) ||
          n.message?.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications, selectedTypes, dateRange, searchQuery]);

  // Calculate statistics
  const stats = useMemo<NotificationStats>(() => {
    const byType: Record<string, number> = {};
    Object.keys(NOTIFICATION_CONFIG).forEach((type) => {
      byType[type] = filteredNotifications.filter((n) => n.type === type).length;
    });

    const days = dateRange === 'all' ? 365 : parseInt(dateRange);
    const averagePerDay = filteredNotifications.length / days;

    // Calculate trend (comparing to previous period)
    const midpoint = Math.floor(filteredNotifications.length / 2);
    const recentCount = filteredNotifications.slice(0, midpoint).length;
    const olderCount = filteredNotifications.slice(midpoint).length;
    const trend = olderCount > 0 ? ((recentCount - olderCount) / olderCount) * 100 : 0;

    return {
      total: filteredNotifications.length,
      byType,
      trend,
      averagePerDay,
    };
  }, [filteredNotifications, dateRange]);

  // Export notifications
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const exportData = filteredNotifications.map((n) => ({
        date: format(new Date(n.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        type: NOTIFICATION_CONFIG[n.type]?.label || n.type,
        title: n.title,
        message: n.message,
        status: n.isRead ? 'Read' : 'Unread',
        feedback: n.feedback || '',
      }));

      const csv = [
        ['Date', 'Type', 'Title', 'Message', 'Status', 'Feedback'].join(','),
        ...exportData.map((row) =>
          [
            row.date,
            row.type,
            `"${row.title.replace(/"/g, '""')}"`,
            `"${row.message.replace(/"/g, '""')}"`,
            row.status,
            row.feedback,
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `notifications-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Notifications exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export notifications');
    } finally {
      setIsExporting(false);
    }
  }, [filteredNotifications]);

  // Toggle type filter
  const toggleType = useCallback((type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, HistoricalNotification[]> = {};
    filteredNotifications.forEach((notification) => {
      const dateKey = format(new Date(notification.createdAt), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(notification);
    });
    return groups;
  }, [filteredNotifications]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-800/60 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">Total Notifications</p>
                <p className="text-2xl font-bold text-zinc-100">{stats.total}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Bell className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            {stats.trend !== 0 && (
              <div className="mt-2 flex items-center gap-1">
                {stats.trend > 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
                )}
                <span
                  className={cn(
                    'text-xs',
                    stats.trend > 0 ? 'text-emerald-400' : 'text-rose-400'
                  )}
                >
                  {Math.abs(stats.trend).toFixed(1)}% vs previous period
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">Daily Average</p>
                <p className="text-2xl font-bold text-zinc-100">
                  {stats.averagePerDay.toFixed(1)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500">notifications per day</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">Most Common</p>
                <p className="text-xl font-bold text-zinc-100">
                  {Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0]?.[0]
                    ? NOTIFICATION_CONFIG[
                        Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0][0]
                      ]?.label || 'None'
                    : 'None'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <Sparkles className="h-5 w-5 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">Time Period</p>
                <p className="text-xl font-bold text-zinc-100">
                  {DATE_PRESETS.find((p) => p.value === dateRange)?.label}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Calendar className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type Distribution */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-zinc-300">Type Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            {Object.entries(NOTIFICATION_CONFIG).map(([type, config]) => {
              const count = stats.byType[type] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const Icon = config.icon;

              return (
                <div
                  key={type}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-2 rounded-lg p-3 transition-all duration-200',
                    config.bgColor
                  )}
                  style={{
                    opacity: percentage > 0 ? 1 : 0.5,
                  }}
                >
                  <Icon className={cn('h-5 w-5', config.color)} />
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-100">{count}</p>
                    <p className="text-[10px] text-zinc-500">
                      {percentage.toFixed(0)}%
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'border-zinc-700/50 px-2 py-0 text-[10px]',
                      config.color
                    )}
                  >
                    {config.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            ref={searchInputRef}
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 border-zinc-800/60 bg-zinc-900/50 pl-9 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36 border-zinc-800/60 bg-zinc-900/50 text-zinc-300">
              <Calendar className="mr-2 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900">
              {DATE_PRESETS.map((preset) => (
                <SelectItem
                  key={preset.value}
                  value={preset.value}
                  className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                >
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-10 gap-2 border-zinc-800/60 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100',
                  selectedTypes.length < Object.keys(NOTIFICATION_CONFIG).length &&
                    'border-indigo-500/50 bg-indigo-500/10'
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                Types
                {selectedTypes.length < Object.keys(NOTIFICATION_CONFIG).length && (
                  <Badge className="ml-1 h-4 w-4 rounded-full bg-indigo-500 p-0 text-[10px]">
                    {selectedTypes.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 border-zinc-800 bg-zinc-900"
            >
              {Object.entries(NOTIFICATION_CONFIG).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => toggleType(type)}
                    className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                  >
                    <Icon className={cn('mr-2 h-4 w-4', config.color)} />
                    {config.label}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || filteredNotifications.length === 0}
            className="h-10 gap-2 border-zinc-800/60 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Export
          </Button>
        </div>
      </div>

      {/* Notification Timeline */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
                <History className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-sm text-zinc-100">Timeline</CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  {filteredNotifications.length} notifications
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <Loader2 className="mb-3 h-8 w-8 animate-spin" />
                <p className="text-sm">Loading history...</p>
              </div>
            ) : Object.keys(groupedNotifications).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50">
                  <FileText className="h-8 w-8" />
                </div>
                <p className="mb-1 text-sm font-medium text-zinc-400">No history found</p>
                <p className="text-xs">
                  {searchQuery || selectedTypes.length < 4
                    ? 'Try adjusting your filters'
                    : 'No notifications in this period'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedNotifications).map(([dateKey, items]) => (
                  <div key={dateKey}>
                    <div className="sticky top-0 z-10 mb-3 flex items-center gap-3 bg-zinc-900/95 py-2 backdrop-blur-sm">
                      <div className="h-px flex-1 bg-zinc-800/60" />
                      <Badge
                        variant="outline"
                        className="border-zinc-700/50 px-3 py-1 text-xs text-zinc-400"
                      >
                        {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
                      </Badge>
                      <div className="h-px flex-1 bg-zinc-800/60" />
                    </div>

                    <div className="relative space-y-2 pl-6">
                      <div className="absolute left-2 top-0 h-full w-px bg-zinc-800/60" />

                      {items.map((notification, index) => {
                        const config = NOTIFICATION_CONFIG[notification.type] || {
                          icon: Bell,
                          label: 'Notification',
                          color: 'text-zinc-400',
                          bgColor: 'bg-zinc-500/10',
                        };
                        const Icon = config.icon;

                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="relative"
                          >
                            <div
                              className={cn(
                                'absolute -left-[18px] flex h-4 w-4 items-center justify-center rounded-full',
                                config.bgColor
                              )}
                            >
                              <div className={cn('h-2 w-2 rounded-full', config.color.replace('text-', 'bg-'))} />
                            </div>

                            <div className="rounded-lg border border-zinc-800/40 bg-zinc-900/30 p-3 transition-all duration-200 hover:bg-zinc-800/30">
                              <div className="flex items-start gap-3">
                                <div
                                  className={cn(
                                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                                    config.bgColor
                                  )}
                                >
                                  <Icon className={cn('h-4 w-4', config.color)} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-sm font-medium text-zinc-200">
                                      {notification.title}
                                    </h4>
                                    <span className="shrink-0 text-[10px] text-zinc-600">
                                      {format(new Date(notification.createdAt), 'h:mm a')}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">
                                    {notification.message}
                                  </p>
                                  {notification.feedback && (
                                    <Badge
                                      variant="outline"
                                      className="mt-2 border-zinc-700/50 px-2 py-0 text-[10px] text-zinc-500"
                                    >
                                      Dismissed: {notification.feedback}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default NotificationHistory;
