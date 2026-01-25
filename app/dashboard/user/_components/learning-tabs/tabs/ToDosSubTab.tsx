'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, isToday, isTomorrow, isPast, startOfDay, endOfDay } from 'date-fns';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Calendar,
  BookOpen,
  Target,
  PlayCircle,
  FileText,
  HelpCircle,
  Loader2,
  ChevronRight,
  AlertCircle,
  Sparkles,
  CalendarClock,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User as NextAuthUser } from 'next-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AddLearningTodoModal, type LearningTodoData } from '../../modals/AddLearningTodoModal';

// Types
interface DashboardTodo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  completedAt: string | null;
  dueDate: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  taskType: string;
  estimatedMinutes: number | null;
  tags: string[];
  course: { id: string; title: string } | null;
  chapter: { id: string; title: string; position: number } | null;
}

interface StudySession {
  id: string;
  title: string;
  startTime: string;
  duration: number;
  status: string;
  course: { id: string; title: string; imageUrl?: string } | null;
  studyPlan: { id: string; title: string } | null;
}

interface StudyPlanTask {
  id: string;
  goalId: string;
  title: string;
  status: string;
  type: string;
  estimatedMinutes: number;
  difficulty: string;
  completedAt: string | null;
  dayNumber: number;
  weekNumber: number;
  weekTitle: string;
  scheduledDate: string;
  studyPlan: { id: string; title: string } | null;
}

interface ToDosSubTabProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
  };
  onCreateStudyPlan?: () => void;
}

// Task type icons
const TASK_TYPE_ICONS: Record<string, React.ElementType> = {
  STUDY: BookOpen,
  PRACTICE: Target,
  REVIEW: Clock,
  QUIZ: HelpCircle,
  WATCH: PlayCircle,
  READ: FileText,
  ASSIGNMENT: FileText,
};

// Priority colors
const PRIORITY_STYLES = {
  LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

type FilterType = 'all' | 'today' | 'upcoming' | 'overdue';

export function ToDosSubTab({ user, onCreateStudyPlan }: ToDosSubTabProps) {
  const [todos, setTodos] = useState<DashboardTodo[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [studyPlanTasks, setStudyPlanTasks] = useState<StudyPlanTask[]>([]);
  const [hasStudyPlans, setHasStudyPlans] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [studyPlanTasksLoading, setStudyPlanTasksLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('today');
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [togglingStudyTaskIds, setTogglingStudyTaskIds] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Use ref for isLoading to access in stable callback
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  // Fetch todos
  const fetchTodos = useCallback(async () => {
    if (isLoadingRef.current && todos.length > 0) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard/todos?limit=100');
      if (res.ok) {
        const data = await res.json();
        setTodos(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [todos.length]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Fetch today's study sessions
  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch('/api/dashboard/sessions?upcoming=true&limit=10');
      if (res.ok) {
        const data = await res.json();
        // Filter for today's sessions
        const todaySessions = (data.data || []).filter((session: StudySession) => {
          const sessionDate = new Date(session.startTime);
          return isToday(sessionDate);
        });
        setSessions(todaySessions);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Fetch today's study plan tasks
  const fetchStudyPlanTasks = useCallback(async () => {
    setStudyPlanTasksLoading(true);
    try {
      const res = await fetch('/api/dashboard/study-plan-tasks');
      if (res.ok) {
        const data = await res.json();
        setStudyPlanTasks(data.data || []);
        setHasStudyPlans(data.meta?.hasStudyPlans ?? false);
      }
    } catch (error) {
      console.error('Failed to fetch study plan tasks:', error);
    } finally {
      setStudyPlanTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudyPlanTasks();
  }, [fetchStudyPlanTasks]);

  // Toggle study plan task completion
  const toggleStudyPlanTask = async (taskId: string, goalId: string, currentStatus: string) => {
    setTogglingStudyTaskIds((prev) => new Set(prev).add(taskId));
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    try {
      const res = await fetch(`/api/sam/agentic/goals/${goalId}/subgoals/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
        }),
      });

      if (res.ok) {
        // Update local state
        setStudyPlanTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toISOString() : null }
              : t
          )
        );
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('study-plan-task-updated'));
      }
    } catch (error) {
      console.error('Failed to toggle study plan task:', error);
    } finally {
      setTogglingStudyTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  // Toggle todo completion
  const toggleTodo = async (todoId: string) => {
    setTogglingIds((prev) => new Set(prev).add(todoId));

    try {
      const res = await fetch(`/api/dashboard/todos/${todoId}/toggle`, {
        method: 'PATCH',
      });

      if (res.ok) {
        const data = await res.json();
        setTodos((prev) =>
          prev.map((t) => (t.id === todoId ? { ...t, ...data.data } : t))
        );
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(todoId);
        return next;
      });
    }
  };

  // Filter todos
  const filterTodos = (todoList: DashboardTodo[]): DashboardTodo[] => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    switch (filter) {
      case 'today':
        return todoList.filter((t) => {
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          return due >= todayStart && due <= todayEnd;
        });
      case 'upcoming':
        return todoList.filter((t) => {
          if (!t.dueDate) return true; // No due date = upcoming
          const due = new Date(t.dueDate);
          return due > todayEnd;
        });
      case 'overdue':
        return todoList.filter((t) => {
          if (!t.dueDate || t.completed) return false;
          return isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate));
        });
      default:
        return todoList;
    }
  };

  const filteredTodos = filterTodos(todos);
  const pendingTodos = filteredTodos.filter((t) => !t.completed);
  const completedTodos = filteredTodos.filter((t) => t.completed);

  // Stats
  const todayTodos = todos.filter((t) => t.dueDate && isToday(new Date(t.dueDate)));
  const overdueTodos = todos.filter(
    (t) => t.dueDate && !t.completed && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
  );
  const completedToday = todayTodos.filter((t) => t.completed).length;

  // Format due date
  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(date)) return format(date, 'MMM d');
    return format(date, 'MMM d');
  };

  // Create new todo
  const handleCreateTodo = async (data: LearningTodoData) => {
    const response = await fetch('/api/dashboard/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        dueDate: data.dueDate?.toISOString(),
        priority: data.priority === 'URGENT' ? 'HIGH' : data.priority,
        taskType: data.taskType,
        courseId: data.courseId,
        chapterId: data.chapterId,
        estimatedMinutes: data.estimatedMinutes,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create todo');
    }

    // Refresh todos list
    setIsLoading(true);
    const res = await fetch('/api/dashboard/todos?limit=100');
    if (res.ok) {
      const refreshData = await res.json();
      setTodos(refreshData.data || []);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Quick Stats Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {todayTodos.length} today
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {completedToday}/{todayTodos.length} done
          </span>
        </div>

        {overdueTodos.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              {overdueTodos.length} overdue
            </span>
          </div>
        )}

        <div className="flex-1" />

        <Button
          size="sm"
          variant="outline"
          onClick={onCreateStudyPlan}
          className="gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">AI Study Plan</span>
        </Button>

        <Button size="sm" className="gap-1.5" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add Task</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList className="h-8">
          <TabsTrigger value="today" className="text-xs px-3 h-7">
            Today
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs px-3 h-7">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="overdue" className="text-xs px-3 h-7">
            Overdue
            {overdueTodos.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-[10px]">
                {overdueTodos.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs px-3 h-7">
            All
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Todo List */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>
              {filter === 'today' && "Today's Tasks"}
              {filter === 'upcoming' && 'Upcoming Tasks'}
              {filter === 'overdue' && 'Overdue Tasks'}
              {filter === 'all' && 'All Tasks'}
            </span>
            <span className="text-xs text-slate-500 font-normal">
              {pendingTodos.length} pending
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {filter === 'today' && 'No tasks for today'}
                {filter === 'upcoming' && 'No upcoming tasks'}
                {filter === 'overdue' && 'No overdue tasks - great job!'}
                {filter === 'all' && 'No tasks yet'}
              </p>
              <Button variant="link" size="sm" className="mt-2" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add your first task
              </Button>
            </div>
          ) : (
            <TooltipProvider delayDuration={300}>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Pending Tasks */}
                {pendingTodos.map((todo) => (
                  <TodoRow
                    key={todo.id}
                    todo={todo}
                    isToggling={togglingIds.has(todo.id)}
                    onToggle={() => toggleTodo(todo.id)}
                    formatDueDate={formatDueDate}
                  />
                ))}

                {/* Completed Tasks */}
                {completedTodos.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Completed ({completedTodos.length})
                      </span>
                    </div>
                    {completedTodos.map((todo) => (
                      <TodoRow
                        key={todo.id}
                        todo={todo}
                        isToggling={togglingIds.has(todo.id)}
                        onToggle={() => toggleTodo(todo.id)}
                        formatDueDate={formatDueDate}
                      />
                    ))}
                  </>
                )}
              </div>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      {/* Today's Study Plan Tasks */}
      {(studyPlanTasks.length > 0 || studyPlanTasksLoading || hasStudyPlans) && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>Today&apos;s Study Plan Tasks</span>
              {studyPlanTasks.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {studyPlanTasks.filter((t) => t.status === 'completed').length}/{studyPlanTasks.length} done
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {studyPlanTasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : studyPlanTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                  <Calendar className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No study tasks scheduled for today
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Check your study plan for upcoming sessions
                </p>
              </div>
            ) : (
              <TooltipProvider delayDuration={300}>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studyPlanTasks.map((task) => (
                    <StudyPlanTaskRow
                      key={task.id}
                      task={task}
                      isToggling={togglingStudyTaskIds.has(task.id)}
                      onToggle={() => toggleStudyPlanTask(task.id, task.goalId, task.status)}
                    />
                  ))}
                </div>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
      )}

      {/* Today's Study Sessions */}
      {(sessions.length > 0 || sessionsLoading) && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>Today&apos;s Study Sessions</span>
              {sessions.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {sessions.length} scheduled
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Learning Task Modal */}
      <AddLearningTodoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateTodo}
      />
    </div>
  );
}

// Todo Row Component
function TodoRow({
  todo,
  isToggling,
  onToggle,
  formatDueDate,
}: {
  todo: DashboardTodo;
  isToggling: boolean;
  onToggle: () => void;
  formatDueDate: (date: string | null) => string | null;
}) {
  const TaskIcon = TASK_TYPE_ICONS[todo.taskType] || BookOpen;
  const dueLabel = formatDueDate(todo.dueDate);
  const isOverdue =
    todo.dueDate && !todo.completed && isPast(new Date(todo.dueDate)) && !isToday(new Date(todo.dueDate));

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
        todo.completed && 'opacity-60'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        disabled={isToggling}
        className="flex-shrink-0"
      >
        {isToggling ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        ) : todo.completed ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors" />
        )}
      </button>

      {/* Task Icon */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex-shrink-0 h-7 w-7 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <TaskIcon className="h-3.5 w-3.5 text-slate-500" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {todo.taskType.charAt(0) + todo.taskType.slice(1).toLowerCase()}
        </TooltipContent>
      </Tooltip>

      {/* Title & Course */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate',
            todo.completed && 'line-through text-slate-500'
          )}
        >
          {todo.title}
        </p>
        {todo.course && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {todo.course.title}
          </p>
        )}
      </div>

      {/* Priority & Due Date */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {todo.estimatedMinutes && (
          <span className="text-xs text-slate-400 hidden sm:inline">
            {todo.estimatedMinutes}m
          </span>
        )}

        <Badge
          variant="secondary"
          className={cn('text-[10px] px-1.5 py-0', PRIORITY_STYLES[todo.priority])}
        >
          {todo.priority.charAt(0)}
        </Badge>

        {dueLabel && (
          <span
            className={cn(
              'text-xs',
              isOverdue
                ? 'text-red-600 dark:text-red-400 font-medium'
                : 'text-slate-500'
            )}
          >
            {dueLabel}
          </span>
        )}

        <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
      </div>
    </div>
  );
}

// Session Row Component
function SessionRow({ session }: { session: StudySession }) {
  const startTime = new Date(session.startTime);
  const endTime = new Date(startTime.getTime() + session.duration * 60000);
  const now = new Date();
  const isNow = now >= startTime && now <= endTime;
  const isPastSession = now > endTime;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
        isPastSession && 'opacity-60'
      )}
    >
      {/* Time indicator */}
      <div className="flex-shrink-0 w-16 text-center">
        <p className={cn(
          'text-sm font-medium',
          isNow ? 'text-teal-600 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'
        )}>
          {format(startTime, 'h:mm a')}
        </p>
        <p className="text-[10px] text-slate-400">
          {session.duration}m
        </p>
      </div>

      {/* Session icon */}
      <div className={cn(
        'flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center',
        isNow
          ? 'bg-teal-100 dark:bg-teal-900/50'
          : 'bg-slate-100 dark:bg-slate-800'
      )}>
        {isNow ? (
          <Play className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        ) : (
          <CalendarClock className="h-4 w-4 text-slate-500" />
        )}
      </div>

      {/* Title & Course */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          isPastSession && 'line-through text-slate-500'
        )}>
          {session.title}
        </p>
        {session.course && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {session.course.title}
          </p>
        )}
        {session.studyPlan && !session.course && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {session.studyPlan.title}
          </p>
        )}
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isNow && (
          <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 text-[10px]">
            Now
          </Badge>
        )}
        {isPastSession && (
          <Badge variant="secondary" className="text-[10px]">
            Done
          </Badge>
        )}
        <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
      </div>
    </div>
  );
}

// Study Plan Task Row Component
function StudyPlanTaskRow({
  task,
  isToggling,
  onToggle,
}: {
  task: StudyPlanTask;
  isToggling: boolean;
  onToggle: () => void;
}) {
  const isCompleted = task.status === 'completed';

  // Get task type icon
  const getTypeIcon = () => {
    switch (task.type.toLowerCase()) {
      case 'learn':
        return BookOpen;
      case 'practice':
        return Target;
      case 'review':
        return Clock;
      case 'assess':
        return HelpCircle;
      default:
        return BookOpen;
    }
  };

  const TypeIcon = getTypeIcon();

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
        isCompleted && 'opacity-60'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        disabled={isToggling}
        className="flex-shrink-0"
      >
        {isToggling ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        ) : isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 hover:text-purple-500 dark:hover:text-purple-400 transition-colors" />
        )}
      </button>

      {/* Day number */}
      <div className="flex-shrink-0 w-12 text-center">
        <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
          Day {task.dayNumber}
        </p>
      </div>

      {/* Task Type Icon */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex-shrink-0 h-7 w-7 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <TypeIcon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
        </TooltipContent>
      </Tooltip>

      {/* Title & Study Plan */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate',
            isCompleted && 'line-through text-slate-500'
          )}
        >
          {task.title}
        </p>
        {task.studyPlan && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {task.studyPlan.title}
          </p>
        )}
      </div>

      {/* Duration & Status */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 capitalize bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
        >
          {task.type}
        </Badge>

        <span className="text-xs text-slate-400 hidden sm:inline">
          {formatDuration(task.estimatedMinutes)}
        </span>

        {isCompleted && (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-[10px]">
            Done
          </Badge>
        )}

        <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
      </div>
    </div>
  );
}

export default ToDosSubTab;
