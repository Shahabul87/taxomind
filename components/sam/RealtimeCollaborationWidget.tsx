"use client";

/**
 * RealtimeCollaborationWidget
 *
 * Dashboard widget for real-time collaboration features via WebSocket.
 * Uses the useRealtime hook from @sam-ai/react package.
 *
 * Displays connection status, active users, and real-time events.
 */

import { useState, useEffect, useCallback } from "react";
import { useRealtime } from "@sam-ai/react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Users,
  Activity,
  Clock,
  Zap,
  MessageSquare,
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
} from "lucide-react";
import type { SAMWebSocketEvent } from "@sam-ai/agentic";

interface RealtimeCollaborationWidgetProps {
  compact?: boolean;
  showEvents?: boolean;
  maxEvents?: number;
  className?: string;
}

interface RecentEvent {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
}

const CONNECTION_STATUS_CONFIG = {
  disconnected: {
    label: "Disconnected",
    color: "text-slate-500",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    icon: WifiOff,
  },
  connecting: {
    label: "Connecting",
    color: "text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: Loader2,
  },
  connected: {
    label: "Connected",
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    icon: Wifi,
  },
  reconnecting: {
    label: "Reconnecting",
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    icon: RefreshCw,
  },
  failed: {
    label: "Failed",
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: AlertCircle,
  },
};

export function RealtimeCollaborationWidget({
  compact = false,
  showEvents = true,
  maxEvents = 10,
  className = "",
}: RealtimeCollaborationWidgetProps) {
  const user = useCurrentUser();
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<number>(1);

  const {
    connectionState,
    isConnected,
    stats,
    error,
    connect,
    disconnect,
    subscribe,
    sendActivity,
  } = useRealtime({
    userId: user?.id,
    autoConnect: false, // Manual connect for dashboard widget
    reconnect: {
      enabled: true,
      maxAttempts: 3,
      delay: 2000,
    },
    onConnect: () => {
      addEvent("system", "Connected to real-time server");
    },
    onDisconnect: (reason) => {
      addEvent("system", `Disconnected: ${reason}`);
    },
    onError: (err) => {
      addEvent("error", err.message);
    },
    onMessage: (event) => {
      handleIncomingEvent(event);
    },
  });

  const addEvent = useCallback(
    (type: string, message: string) => {
      setRecentEvents((prev) => {
        const newEvent: RecentEvent = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type,
          message,
          timestamp: new Date(),
        };
        return [newEvent, ...prev].slice(0, maxEvents);
      });
    },
    [maxEvents]
  );

  const handleIncomingEvent = useCallback(
    (event: SAMWebSocketEvent) => {
      const payload = event.payload as unknown as Record<string, unknown>;
      switch (event.type) {
        case "presence_update":
          setOnlineUsers(typeof payload?.count === "number" ? payload.count : 1);
          break;
        case "nudge":
          addEvent("nudge", typeof payload?.message === "string" ? payload.message : "New nudge received");
          break;
        case "celebration":
          addEvent("celebration", typeof payload?.title === "string" ? payload.title : "Celebration!");
          break;
        case "recommendation":
          addEvent("recommendation", "New learning recommendation available");
          break;
        case "heartbeat":
          // Silently handle heartbeats
          break;
        default:
          if (event.type !== "connected") {
            addEvent(event.type, `Received ${event.type} event`);
          }
      }
    },
    [addEvent]
  );

  // Subscribe to presence updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribePresence = subscribe("presence_update", handleIncomingEvent);

    return () => {
      unsubscribePresence();
    };
  }, [isConnected, subscribe, handleIncomingEvent]);

  // Send activity when user interacts
  const handleSendActivity = useCallback(() => {
    if (isConnected) {
      sendActivity({
        type: "page_view",
        data: { page: "dashboard", timestamp: new Date().toISOString() },
      });
      addEvent("activity", "Activity sent");
    }
  }, [isConnected, sendActivity, addEvent]);

  const handleConnect = useCallback(() => {
    connect();
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Get status config
  const statusConfig = CONNECTION_STATUS_CONFIG[connectionState];
  const StatusIcon = statusConfig.icon;

  // Calculate signal strength based on latency
  const getSignalIcon = () => {
    if (!stats?.latencyMs) return Signal;
    if (stats.latencyMs < 100) return SignalHigh;
    if (stats.latencyMs < 300) return SignalMedium;
    return SignalLow;
  };
  const SignalIcon = getSignalIcon();

  if (compact) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-cyan-500" />
            Real-time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`rounded-full p-1.5 ${statusConfig.bgColor}`}>
                <StatusIcon
                  className={`h-3 w-3 ${statusConfig.color} ${
                    connectionState === "connecting" || connectionState === "reconnecting"
                      ? "animate-spin"
                      : ""
                  }`}
                />
              </div>
              <span className="text-sm font-medium">{statusConfig.label}</span>
            </div>
            {isConnected ? (
              <Badge variant="secondary" className="text-xs">
                <Users className="mr-1 h-3 w-3" />
                {onlineUsers}
              </Badge>
            ) : (
              <Button size="sm" variant="outline" onClick={handleConnect}>
                Connect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-500" />
          Real-time Collaboration
          <div className="ml-auto flex items-center gap-2">
            {isConnected && (
              <Badge variant="secondary" className="text-xs">
                <Users className="mr-1 h-3 w-3" />
                {onlineUsers} online
              </Badge>
            )}
            <div className={`rounded-full p-1 ${statusConfig.bgColor}`}>
              <StatusIcon
                className={`h-4 w-4 ${statusConfig.color} ${
                  connectionState === "connecting" || connectionState === "reconnecting"
                    ? "animate-spin"
                    : ""
                }`}
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error.message}
          </div>
        )}

        {/* Connection Status Card */}
        <div className={`rounded-lg border p-4 ${statusConfig.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon
                className={`h-6 w-6 ${statusConfig.color} ${
                  connectionState === "connecting" || connectionState === "reconnecting"
                    ? "animate-spin"
                    : ""
                }`}
              />
              <div>
                <p className="font-medium">{statusConfig.label}</p>
                {stats && isConnected && (
                  <p className="text-xs text-muted-foreground">
                    ID: {stats.connectionId?.slice(0, 8)}...
                  </p>
                )}
              </div>
            </div>
            {isConnected ? (
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" onClick={handleConnect}>
                <Zap className="mr-2 h-4 w-4" />
                Connect
              </Button>
            )}
          </div>
        </div>

        {/* Connection Stats */}
        {isConnected && stats && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
                    <SignalIcon className="mx-auto h-5 w-5 text-green-500" />
                    <p className="mt-1 text-lg font-semibold">{stats.latencyMs || 0}ms</p>
                    <p className="text-xs text-muted-foreground">Latency</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Current connection latency</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
              <MessageSquare className="mx-auto h-5 w-5 text-blue-500" />
              <p className="mt-1 text-lg font-semibold">{stats.messagesReceived}</p>
              <p className="text-xs text-muted-foreground">Received</p>
            </div>

            <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
              <Bell className="mx-auto h-5 w-5 text-purple-500" />
              <p className="mt-1 text-lg font-semibold">{stats.messagesSent}</p>
              <p className="text-xs text-muted-foreground">Sent</p>
            </div>
          </div>
        )}

        {/* Recent Events */}
        {showEvents && isConnected && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Recent Events</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSendActivity}
                className="text-xs"
              >
                Send Ping
              </Button>
            </div>
            <ScrollArea className="h-[150px] rounded-lg border bg-slate-50 p-2 dark:bg-slate-900">
              {recentEvents.length > 0 ? (
                <div className="space-y-2">
                  {recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <div className="mt-1">
                        {event.type === "system" && (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        )}
                        {event.type === "error" && (
                          <AlertCircle className="h-3 w-3 text-red-500" />
                        )}
                        {event.type === "nudge" && (
                          <Bell className="h-3 w-3 text-yellow-500" />
                        )}
                        {event.type === "celebration" && (
                          <Zap className="h-3 w-3 text-purple-500" />
                        )}
                        {event.type === "recommendation" && (
                          <MessageSquare className="h-3 w-3 text-blue-500" />
                        )}
                        {event.type === "activity" && (
                          <Activity className="h-3 w-3 text-cyan-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs">{event.message}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {event.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No events yet
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Connection Info */}
        {stats && isConnected && (
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                Connected since {stats.connectedAt.toLocaleTimeString()}
              </span>
            </div>
            {stats.reconnectCount > 0 && (
              <span>Reconnects: {stats.reconnectCount}</span>
            )}
          </div>
        )}

        {/* Not Connected State */}
        {!isConnected && connectionState !== "connecting" && connectionState !== "reconnecting" && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Connect to receive real-time updates and collaborate with others.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 mb-3">
              <li>• Live learning progress updates</li>
              <li>• Study buddy notifications</li>
              <li>• SAM AI proactive interventions</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RealtimeCollaborationWidget;
