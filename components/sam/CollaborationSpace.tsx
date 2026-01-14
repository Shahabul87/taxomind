'use client';

/**
 * CollaborationSpace Component
 *
 * Real-time collaborative workspace for group learning and projects.
 *
 * Features:
 * - Real-time document collaboration
 * - Group whiteboard
 * - Video/voice chat integration
 * - Task management
 * - Activity feed
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Users,
  MessageSquare,
  FileText,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Share2,
  Settings,
  RefreshCw,
  Loader2,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Sparkles,
  PenTool,
  Layers,
  Send,
  MoreHorizontal,
  Edit3,
  Trash2,
  ExternalLink,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type ResourceType = 'document' | 'whiteboard' | 'presentation' | 'code';
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  isOnline: boolean;
  isActive: boolean;
  lastSeen?: string;
}

interface SharedResource {
  id: string;
  name: string;
  type: ResourceType;
  lastModified: string;
  modifiedBy: string;
  version: number;
  collaborators: number;
}

interface CollaborativeTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
}

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  target: string;
  timestamp: string;
}

interface CollaborationSession {
  id: string;
  name: string;
  description: string;
  collaborators: Collaborator[];
  resources: SharedResource[];
  tasks: CollaborativeTask[];
  activities: ActivityItem[];
  createdAt: string;
  isLive: boolean;
}

interface CollaborationSpaceProps {
  className?: string;
  compact?: boolean;
  sessionId?: string;
  onJoinSession?: (sessionId: string) => void;
  onCreateResource?: (type: ResourceType) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RESOURCE_TYPE_CONFIG = {
  document: { icon: FileText, color: 'text-blue-500 bg-blue-500/10', label: 'Document' },
  whiteboard: { icon: PenTool, color: 'text-green-500 bg-green-500/10', label: 'Whiteboard' },
  presentation: { icon: Layers, color: 'text-purple-500 bg-purple-500/10', label: 'Presentation' },
  code: { icon: FileText, color: 'text-orange-500 bg-orange-500/10', label: 'Code' },
};

const TASK_STATUS_CONFIG = {
  todo: { color: 'bg-gray-500/10 text-gray-600', label: 'To Do' },
  in_progress: { color: 'bg-blue-500/10 text-blue-600', label: 'In Progress' },
  review: { color: 'bg-yellow-500/10 text-yellow-600', label: 'Review' },
  done: { color: 'bg-green-500/10 text-green-600', label: 'Done' },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function CollaboratorAvatars({ collaborators, max = 5 }: { collaborators: Collaborator[]; max?: number }) {
  const online = collaborators.filter((c) => c.isOnline);
  const displayed = collaborators.slice(0, max);
  const overflow = collaborators.length - max;

  return (
    <TooltipProvider>
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {displayed.map((collaborator) => (
            <Tooltip key={collaborator.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="w-8 h-8 border-2 border-background">
                    <AvatarImage src={collaborator.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {collaborator.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {collaborator.isOnline && (
                    <span className={cn(
                      'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background',
                      collaborator.isActive ? 'bg-green-500' : 'bg-yellow-500'
                    )} />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{collaborator.name} ({collaborator.role})</p>
                <p className="text-xs text-muted-foreground">
                  {collaborator.isOnline ? (collaborator.isActive ? 'Active now' : 'Idle') : 'Offline'}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        {overflow > 0 && (
          <span className="ml-2 text-xs text-muted-foreground">+{overflow} more</span>
        )}
        <Badge variant="secondary" className="ml-3 text-xs">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-1" />
          {online.length} online
        </Badge>
      </div>
    </TooltipProvider>
  );
}

function ResourceCard({
  resource,
  onOpen,
}: {
  resource: SharedResource;
  onOpen?: () => void;
}) {
  const config = RESOURCE_TYPE_CONFIG[resource.type];
  const Icon = config.icon;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:shadow-md transition-all cursor-pointer"
      onClick={onOpen}
    >
      <div className={cn('p-2 rounded-lg', config.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm truncate block">{resource.name}</span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>v{resource.version}</span>
          <span>•</span>
          <span>by {resource.modifiedBy}</span>
          <span>•</span>
          <span>{resource.collaborators} editing</span>
        </div>
      </div>
      <Button variant="ghost" size="sm">
        <ExternalLink className="w-4 h-4" />
      </Button>
    </div>
  );
}

function TaskCard({ task }: { task: CollaborativeTask }) {
  const statusConfig = TASK_STATUS_CONFIG[task.status];

  const priorityColors = {
    high: 'border-l-red-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-blue-500',
  };

  return (
    <div className={cn(
      'p-3 rounded-lg bg-muted/30 border-l-4',
      priorityColors[task.priority]
    )}>
      <div className="flex items-start gap-2">
        <button className="mt-0.5">
          {task.status === 'done' ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Circle className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <span className={cn(
            'font-medium text-sm',
            task.status === 'done' && 'line-through text-muted-foreground'
          )}>
            {task.title}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={cn('text-xs', statusConfig.color)}>
              {statusConfig.label}
            </Badge>
            {task.assigneeName && (
              <span className="text-xs text-muted-foreground">
                @{task.assigneeName}
              </span>
            )}
            {task.dueDate && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50">
          <Avatar className="w-6 h-6">
            <AvatarImage src={activity.userAvatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {activity.userName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{activity.userName}</span>{' '}
              <span className="text-muted-foreground">{activity.action}</span>{' '}
              <span className="font-medium">{activity.target}</span>
            </p>
            <span className="text-xs text-muted-foreground">
              {new Date(activity.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function QuickActions({ onCreateResource }: { onCreateResource?: (type: ResourceType) => void }) {
  const actions = [
    { type: 'document' as ResourceType, label: 'New Doc', icon: FileText },
    { type: 'whiteboard' as ResourceType, label: 'Whiteboard', icon: PenTool },
    { type: 'presentation' as ResourceType, label: 'Slides', icon: Layers },
  ];

  return (
    <div className="flex gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.type}
            variant="outline"
            size="sm"
            onClick={() => onCreateResource?.(action.type)}
            className="gap-1"
          >
            <Icon className="w-3 h-3" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CollaborationSpace({
  className,
  compact = false,
  sessionId,
  onJoinSession,
  onCreateResource,
}: CollaborationSpaceProps) {
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const isLoadingRef = useRef(false);

  const fetchSession = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (sessionId) params.append('sessionId', sessionId);

      const res = await fetch(`/api/sam/agentic/collaboration?action=get-session&${params}`);

      if (!res.ok) throw new Error('Failed to fetch collaboration session');

      const result = await res.json();
      if (result.success) {
        setSession(result.data.session);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading collaboration space...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchSession}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 mb-4">
            <Users className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="font-semibold mb-1">Start Collaborating</h3>
          <p className="text-sm text-muted-foreground max-w-[280px] mb-4">
            Create or join a collaboration space to work together in real-time.
          </p>
          <div className="flex gap-2">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Space
            </Button>
            <Button variant="outline">
              Join Space
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{session.name}</CardTitle>
                {session.isLive && (
                  <Badge className="bg-red-500/10 text-red-600 text-xs">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-1 animate-pulse" />
                    Live
                  </Badge>
                )}
              </div>
              <CardDescription>{session.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Video className="w-4 h-4 mr-1" />
              Meet
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Collaborators */}
        <CollaboratorAvatars collaborators={session.collaborators} />

        {/* Quick Actions */}
        <QuickActions onCreateResource={onCreateResource} />

        {/* Shared Resources */}
        {session.resources.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Shared Resources
              <Badge variant="secondary" className="text-xs">{session.resources.length}</Badge>
            </h4>
            <div className="space-y-2">
              {session.resources.slice(0, compact ? 2 : 4).map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        )}

        {/* Tasks */}
        {!compact && session.tasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Tasks
              </h4>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </Button>
            </div>
            <div className="space-y-2">
              {session.tasks.slice(0, 3).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Activity Feed */}
        {!compact && session.activities.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Activity
            </h4>
            <ActivityFeed activities={session.activities.slice(0, 5)} />
          </div>
        )}

        {/* Chat Input */}
        <div className="flex gap-2 pt-2 border-t">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Send a message to the team..."
            className="flex-1"
          />
          <Button size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default CollaborationSpace;
