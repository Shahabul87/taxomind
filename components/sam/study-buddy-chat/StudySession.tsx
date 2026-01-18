'use client';

/**
 * StudySession Component
 *
 * Manages collaborative study sessions with shared goals,
 * timers, progress tracking, and resource sharing.
 *
 * @module components/sam/study-buddy-chat/StudySession
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  Target,
  Users,
  BookOpen,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Share2,
  ExternalLink,
  Timer,
  Trophy,
  Flame,
  Zap,
  Coffee,
  ChevronRight,
  MoreVertical,
  Edit2,
  Copy,
  Link2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Types
export type SessionStatus = 'idle' | 'active' | 'paused' | 'break' | 'completed';

export interface SessionGoal {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
}

export interface SessionResource {
  id: string;
  title: string;
  url: string;
  type: 'link' | 'document' | 'video' | 'note';
  addedBy: string;
  addedAt: Date;
}

export interface SessionParticipant {
  id: string;
  name: string;
  avatar?: string;
  isActive: boolean;
  currentFocus?: string;
  timeContributed: number; // in seconds
}

export interface StudySessionData {
  id: string;
  title: string;
  description?: string;
  status: SessionStatus;
  startedAt?: Date;
  duration: number; // total active time in seconds
  breakDuration: number; // total break time in seconds
  goals: SessionGoal[];
  resources: SessionResource[];
  participants: SessionParticipant[];
  pomodoroCount: number;
  pomodoroLength: number; // in minutes
  breakLength: number; // in minutes
}

export interface StudySessionProps {
  className?: string;
  session: StudySessionData;
  currentUserId: string;
  onStatusChange: (status: SessionStatus) => Promise<void>;
  onAddGoal: (text: string) => Promise<void>;
  onToggleGoal: (goalId: string) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onAddResource: (resource: Omit<SessionResource, 'id' | 'addedAt'>) => Promise<void>;
  onDeleteResource: (resourceId: string) => Promise<void>;
  onEndSession: () => Promise<void>;
  compact?: boolean;
}

export function StudySession({
  className,
  session,
  currentUserId,
  onStatusChange,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
  onAddResource,
  onDeleteResource,
  onEndSession,
  compact = false,
}: StudySessionProps) {
  const [newGoal, setNewGoal] = useState('');
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [showAddResource, setShowAddResource] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(session.duration);
  const [pomodoroTime, setPomodoroTime] = useState(session.pomodoroLength * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (session.goals.length === 0) return 0;
    const completed = session.goals.filter((g) => g.completed).length;
    return Math.round((completed / session.goals.length) * 100);
  }, [session.goals]);

  // Timer effect
  useEffect(() => {
    if (session.status === 'active' || session.status === 'break') {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
        setPomodoroTime((prev) => {
          if (prev <= 1) {
            // Pomodoro complete
            if (session.status === 'active') {
              toast.success('Pomodoro complete! Time for a break 🎉');
              onStatusChange('break');
              return session.breakLength * 60;
            } else {
              toast.success('Break over! Ready to focus? 💪');
              onStatusChange('active');
              return session.pomodoroLength * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session.status, session.pomodoroLength, session.breakLength, onStatusChange]);

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle add goal
  const handleAddGoal = useCallback(async () => {
    if (!newGoal.trim()) return;
    await onAddGoal(newGoal.trim());
    setNewGoal('');
  }, [newGoal, onAddGoal]);

  // Handle add resource
  const handleAddResource = useCallback(async () => {
    if (!newResourceTitle.trim() || !newResourceUrl.trim()) return;
    await onAddResource({
      title: newResourceTitle.trim(),
      url: newResourceUrl.trim(),
      type: 'link',
      addedBy: currentUserId,
    });
    setNewResourceTitle('');
    setNewResourceUrl('');
    setShowAddResource(false);
  }, [newResourceTitle, newResourceUrl, currentUserId, onAddResource]);

  // Reset pomodoro
  const handleResetPomodoro = useCallback(() => {
    setPomodoroTime(session.pomodoroLength * 60);
  }, [session.pomodoroLength]);

  // Get status config
  const getStatusConfig = (status: SessionStatus) => {
    switch (status) {
      case 'active':
        return {
          label: 'Studying',
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          icon: BookOpen,
        };
      case 'paused':
        return {
          label: 'Paused',
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          icon: Pause,
        };
      case 'break':
        return {
          label: 'Break Time',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          icon: Coffee,
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          icon: Trophy,
        };
      default:
        return {
          label: 'Ready',
          color: 'text-zinc-400',
          bgColor: 'bg-zinc-500/10',
          icon: Clock,
        };
    }
  };

  const statusConfig = getStatusConfig(session.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Session Header Card */}
      <Card className="border-zinc-800/60 bg-gradient-to-br from-zinc-900/95 to-zinc-950/95">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  statusConfig.bgColor
                )}
              >
                <StatusIcon className={cn('h-6 w-6', statusConfig.color)} />
              </div>
              <div>
                <CardTitle className="text-lg text-zinc-100">
                  {session.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'border-transparent px-2 py-0 text-[10px]',
                      statusConfig.bgColor,
                      statusConfig.color
                    )}
                  >
                    {statusConfig.label}
                  </Badge>
                  <span className="text-xs text-zinc-600">
                    {session.participants.length} participants
                  </span>
                </CardDescription>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border-zinc-800 bg-zinc-900"
              >
                <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit session
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/study/${session.id}`
                    );
                    toast.success('Session link copied!');
                  }}
                  className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Copy invite link
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  onClick={onEndSession}
                  className="text-rose-400 focus:bg-zinc-800 focus:text-rose-300"
                >
                  <Square className="mr-2 h-4 w-4" />
                  End session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Timer Section */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-4">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5" />

            <div className="relative flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">
                  {session.status === 'break' ? 'Break Time' : 'Pomodoro Timer'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      'font-mono text-4xl font-bold tabular-nums',
                      session.status === 'break'
                        ? 'text-blue-400'
                        : 'text-indigo-400'
                    )}
                  >
                    {formatTime(pomodoroTime)}
                  </span>
                  <span className="text-sm text-zinc-600">remaining</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {session.status === 'idle' && (
                  <Button
                    onClick={() => onStatusChange('active')}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500"
                  >
                    <Play className="h-4 w-4" />
                    Start
                  </Button>
                )}
                {session.status === 'active' && (
                  <Button
                    onClick={() => onStatusChange('paused')}
                    variant="outline"
                    className="gap-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                )}
                {session.status === 'paused' && (
                  <Button
                    onClick={() => onStatusChange('active')}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500"
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                )}
                {session.status === 'break' && (
                  <Button
                    onClick={() => onStatusChange('active')}
                    className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500"
                  >
                    <Zap className="h-4 w-4" />
                    End Break
                  </Button>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleResetPomodoro}
                        className="h-9 w-9 text-zinc-400 hover:text-zinc-100"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset timer</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Session Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-zinc-100">
                  {formatTime(elapsedTime)}
                </p>
                <p className="text-xs text-zinc-500">Total Time</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-zinc-100">
                  {session.pomodoroCount}
                </p>
                <p className="text-xs text-zinc-500">Pomodoros</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-zinc-100">
                  {completionPercentage}%
                </p>
                <p className="text-xs text-zinc-500">Complete</p>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {session.participants.slice(0, 5).map((p) => (
                <TooltipProvider key={p.id}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar
                        className={cn(
                          'h-8 w-8 border-2',
                          p.isActive ? 'border-emerald-500' : 'border-zinc-700'
                        )}
                      >
                        <AvatarImage src={p.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-xs text-white">
                          {p.name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-zinc-400">
                        {p.isActive ? 'Active' : 'Away'} •{' '}
                        {formatTime(p.timeContributed)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {session.participants.length > 5 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-800 text-xs text-zinc-400">
                  +{session.participants.length - 5}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-zinc-700/50 text-zinc-400 hover:text-zinc-100"
            >
              <Share2 className="h-3.5 w-3.5" />
              Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Goals Card */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-sm text-zinc-100">
                Session Goals
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 px-2 py-0 text-xs text-emerald-400"
            >
              {session.goals.filter((g) => g.completed).length}/{session.goals.length}
            </Badge>
          </div>
          <Progress
            value={completionPercentage}
            className="h-1.5 bg-zinc-800"
          />
        </CardHeader>

        <CardContent className="space-y-2">
          {/* Add goal input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a goal for this session..."
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
              className="h-9 border-zinc-800/60 bg-zinc-900/50 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
            <Button
              onClick={handleAddGoal}
              disabled={!newGoal.trim()}
              size="sm"
              className="h-9 shrink-0 bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Goals list */}
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {session.goals.map((goal) => (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg p-2 transition-colors',
                    goal.completed
                      ? 'bg-emerald-500/5'
                      : 'hover:bg-zinc-800/30'
                  )}
                >
                  <Checkbox
                    checked={goal.completed}
                    onCheckedChange={() => onToggleGoal(goal.id)}
                    className={cn(
                      'h-5 w-5',
                      goal.completed
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-zinc-700'
                    )}
                  />
                  <span
                    className={cn(
                      'flex-1 text-sm',
                      goal.completed
                        ? 'text-zinc-500 line-through'
                        : 'text-zinc-300'
                    )}
                  >
                    {goal.text}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteGoal(goal.id)}
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>

            {session.goals.length === 0 && (
              <div className="py-6 text-center">
                <Target className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
                <p className="text-sm text-zinc-500">
                  Add goals to track your progress
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resources Card */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-400" />
              <CardTitle className="text-sm text-zinc-100">
                Shared Resources
              </CardTitle>
            </div>
            <Dialog open={showAddResource} onOpenChange={setShowAddResource}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 border-zinc-700/50 text-xs text-zinc-400 hover:text-zinc-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="border-zinc-800 bg-zinc-900">
                <DialogHeader>
                  <DialogTitle className="text-zinc-100">
                    Add Resource
                  </DialogTitle>
                  <DialogDescription className="text-zinc-500">
                    Share a helpful resource with your study buddies
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-zinc-300">
                      Title
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., React Documentation"
                      value={newResourceTitle}
                      onChange={(e) => setNewResourceTitle(e.target.value)}
                      className="border-zinc-800 bg-zinc-900/50 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url" className="text-zinc-300">
                      URL
                    </Label>
                    <Input
                      id="url"
                      placeholder="https://..."
                      value={newResourceUrl}
                      onChange={(e) => setNewResourceUrl(e.target.value)}
                      className="border-zinc-800 bg-zinc-900/50 text-zinc-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAddResource(false)}
                    className="text-zinc-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddResource}
                    disabled={!newResourceTitle.trim() || !newResourceUrl.trim()}
                    className="bg-blue-600 text-white hover:bg-blue-500"
                  >
                    Add Resource
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {session.resources.length === 0 ? (
            <div className="py-6 text-center">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
              <p className="text-sm text-zinc-500">
                Share helpful resources with your team
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {session.resources.map((resource) => (
                <div
                  key={resource.id}
                  className="group flex items-center justify-between rounded-lg border border-zinc-800/40 bg-zinc-900/30 p-3 transition-colors hover:bg-zinc-800/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <ExternalLink className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-zinc-200 hover:text-blue-400"
                      >
                        {resource.title}
                      </a>
                      <p className="text-xs text-zinc-600">
                        Added by {resource.addedBy}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(resource.url);
                              toast.success('URL copied!');
                            }}
                            className="h-7 w-7 text-zinc-500 hover:text-zinc-100"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy URL</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteResource(resource.id)}
                      className="h-7 w-7 text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default StudySession;
