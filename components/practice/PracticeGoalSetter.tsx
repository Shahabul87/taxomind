'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  Plus,
  Clock,
  Calendar,
  Flame,
  Trophy,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit,
  TrendingUp,
  Zap,
  PartyPopper,
  BarChart3,
  PlusCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// ============================================================================
// TYPES
// ============================================================================

type GoalType = 'HOURS' | 'QUALITY_HOURS' | 'SESSIONS' | 'STREAK' | 'WEEKLY_HOURS';

interface PracticeGoal {
  id: string;
  title: string;
  description?: string | null;
  goalType: GoalType;
  targetValue: number;
  currentValue: number;
  skillId?: string | null;
  skillName?: string | null;
  deadline?: string | null;
  startDate: string;
  isCompleted: boolean;
  completedAt?: string | null;
  reminderEnabled: boolean;
  reminderFrequency?: string | null;
  progressPercentage: number;
  remaining: number;
  isOverdue: boolean;
  daysUntilDeadline?: number | null;
}

interface GoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  completionRate: number;
  byType: Record<string, number>;
  overdueCount: number;
  completionVelocity: number;
  progressDistribution: {
    notStarted: number;
    inProgress: number;
    halfwayThere: number;
    almostDone: number;
  };
}

interface PracticeGoalSetterProps {
  className?: string;
  compact?: boolean;
}

// ============================================================================
// QUICK GOAL TEMPLATES
// ============================================================================

const QUICK_GOALS = [
  { title: '10 Hours Practice', goalType: 'HOURS' as GoalType, targetValue: 10 },
  { title: '25 Quality Hours', goalType: 'QUALITY_HOURS' as GoalType, targetValue: 25 },
  { title: '7-Day Streak', goalType: 'STREAK' as GoalType, targetValue: 7 },
  { title: '5 Sessions', goalType: 'SESSIONS' as GoalType, targetValue: 5 },
  { title: '5 Hours/Week', goalType: 'WEEKLY_HOURS' as GoalType, targetValue: 5 },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getGoalTypeIcon(type: GoalType) {
  switch (type) {
    case 'HOURS':
    case 'QUALITY_HOURS':
    case 'WEEKLY_HOURS':
      return <Clock className="h-4 w-4" />;
    case 'SESSIONS':
      return <Calendar className="h-4 w-4" />;
    case 'STREAK':
      return <Flame className="h-4 w-4" />;
    default:
      return <Target className="h-4 w-4" />;
  }
}

function getGoalTypeLabel(type: GoalType) {
  const labels: Record<GoalType, string> = {
    HOURS: 'hours',
    QUALITY_HOURS: 'quality hours',
    SESSIONS: 'sessions',
    STREAK: 'day streak',
    WEEKLY_HOURS: 'hours/week',
  };
  return labels[type] ?? type;
}

function triggerCelebration() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#22c55e', '#3b82f6', '#f59e0b'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#22c55e', '#3b82f6', '#f59e0b'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PracticeGoalSetter({ className, compact = false }: PracticeGoalSetterProps) {
  const [activeGoals, setActiveGoals] = useState<PracticeGoal[]>([]);
  const [completedGoals, setCompletedGoals] = useState<PracticeGoal[]>([]);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PracticeGoal | null>(null);
  const [progressGoal, setProgressGoal] = useState<PracticeGoal | null>(null);
  const [activeTab, setActiveTab] = useState('active');

  const isFetchingRef = useRef(false);

  // Fetch goals and stats
  const fetchGoals = useCallback(async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const [activeRes, completedRes, statsRes] = await Promise.all([
        fetch('/api/sam/practice/goals?status=active&limit=50'),
        fetch('/api/sam/practice/goals?status=completed&limit=10'),
        fetch('/api/sam/practice/goals/stats'),
      ]);

      const [activeData, completedData, statsData] = await Promise.all([
        activeRes.json(),
        completedRes.json(),
        statsRes.json(),
      ]);

      if (activeData.success) {
        setActiveGoals(activeData.data.goals);
      }
      if (completedData.success) {
        setCompletedGoals(completedData.data.goals);
      }
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Delete goal
  const handleDelete = async (goalId: string) => {
    try {
      const response = await fetch(`/api/sam/practice/goals/${goalId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Goal deleted');
        fetchGoals();
      } else {
        toast.error(result.error ?? 'Failed to delete goal');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  // Mark goal as complete
  const handleMarkComplete = async (goal: PracticeGoal) => {
    try {
      const response = await fetch(`/api/sam/practice/goals/${goal.id}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: goal.targetValue }),
      });
      const result = await response.json();

      if (result.success && result.data.wasCompleted) {
        triggerCelebration();
        toast.success(`Goal completed: ${goal.title}!`, {
          icon: <PartyPopper className="h-5 w-5 text-yellow-500" />,
        });
        fetchGoals();
      } else if (result.success) {
        toast.success('Progress updated');
        fetchGoals();
      } else {
        toast.error(result.error ?? 'Failed to update goal');
      }
    } catch (error) {
      console.error('Error completing goal:', error);
      toast.error('Failed to complete goal');
    }
  };

  // Create quick goal
  const handleQuickGoal = async (template: typeof QUICK_GOALS[0]) => {
    try {
      const response = await fetch('/api/sam/practice/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      const result = await response.json();

      if (result.success) {
        toast.success(`Goal created: ${template.title}`);
        fetchGoals();
      } else {
        toast.error(result.error ?? 'Failed to create goal');
      }
    } catch (error) {
      console.error('Error creating quick goal:', error);
      toast.error('Failed to create goal');
    }
  };

  // Edit goal
  const handleEdit = (goal: PracticeGoal) => {
    setEditingGoal(goal);
    setIsDialogOpen(true);
  };

  // Open progress dialog
  const handleOpenProgress = (goal: PracticeGoal) => {
    setProgressGoal(goal);
    setIsProgressDialogOpen(true);
  };

  // Render stats summary
  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-primary">{stats.activeGoals}</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completedGoals}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.completionRate.toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground">Success Rate</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.completionVelocity.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">Goals/Week</div>
        </div>
      </div>
    );
  };

  // Render goal card
  const renderGoalCard = (goal: PracticeGoal) => (
    <div
      key={goal.id}
      className={cn(
        'p-4 rounded-lg border transition-all hover:shadow-sm',
        goal.isCompleted && 'bg-green-50 border-green-200 dark:bg-green-950/20',
        goal.isOverdue && !goal.isCompleted && 'bg-red-50 border-red-200 dark:bg-red-950/20',
        !goal.isCompleted && !goal.isOverdue && 'hover:border-primary/50'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={cn(
            'p-1.5 rounded-md',
            goal.isCompleted ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
          )}>
            {getGoalTypeIcon(goal.goalType)}
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-medium truncate block">{goal.title}</span>
            {goal.skillName && (
              <span className="text-xs text-muted-foreground">{goal.skillName}</span>
            )}
          </div>
          {goal.isCompleted && (
            <Badge className="bg-green-500 shrink-0">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Done
            </Badge>
          )}
          {goal.isOverdue && !goal.isCompleted && (
            <Badge variant="destructive" className="shrink-0">
              <AlertCircle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!goal.isCompleted && (
              <>
                <DropdownMenuItem onClick={() => handleOpenProgress(goal)}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Update Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMarkComplete(goal)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => handleEdit(goal)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(goal.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {goal.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{goal.description}</p>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            {goal.currentValue.toFixed(goal.goalType.includes('HOURS') ? 1 : 0)} / {goal.targetValue}{' '}
            {getGoalTypeLabel(goal.goalType)}
          </span>
        </div>
        <Progress
          value={goal.progressPercentage}
          className={cn(
            'h-2',
            goal.isCompleted && '[&>div]:bg-green-500',
            goal.progressPercentage >= 90 && !goal.isCompleted && '[&>div]:bg-yellow-500'
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(goal.progressPercentage)}% complete</span>
          {goal.daysUntilDeadline !== undefined && goal.daysUntilDeadline !== null && (
            <span className={cn(goal.daysUntilDeadline < 0 && 'text-red-500')}>
              {goal.daysUntilDeadline > 0
                ? `${goal.daysUntilDeadline} days left`
                : goal.daysUntilDeadline === 0
                  ? 'Due today'
                  : `${Math.abs(goal.daysUntilDeadline)} days overdue`}
            </span>
          )}
        </div>
      </div>

      {/* Quick progress buttons for non-completed goals */}
      {!goal.isCompleted && goal.goalType !== 'STREAK' && (
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8"
            onClick={() => handleOpenProgress(goal)}
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1" />
            Add Progress
          </Button>
        </div>
      )}
    </div>
  );

  // Compact view for dashboard widget
  if (compact) {
    return (
      <Card className={cn('bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg', className)}>
        <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <Target className="h-4 w-4 text-primary" />
              Goals
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingGoal(null);
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : activeGoals.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground text-sm">
              <p>No active goals</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeGoals.slice(0, 3).map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleOpenProgress(goal)}
                >
                  {getGoalTypeIcon(goal.goalType)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{goal.title}</div>
                    <Progress value={goal.progressPercentage} className="h-1 mt-1" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(goal.progressPercentage)}%
                  </span>
                </div>
              ))}
              {activeGoals.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{activeGoals.length - 3} more
                </p>
              )}
            </div>
          )}
        </CardContent>

        <GoalDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          goal={editingGoal}
          onSuccess={() => {
            fetchGoals();
            setEditingGoal(null);
          }}
        />
        <ProgressDialog
          open={isProgressDialogOpen}
          onOpenChange={setIsProgressDialogOpen}
          goal={progressGoal}
          onSuccess={(wasCompleted) => {
            if (wasCompleted) triggerCelebration();
            fetchGoals();
          }}
        />
      </Card>
    );
  }

  // Full view
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Practice Goals
          </CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <Zap className="h-4 w-4 mr-1" />
                  Quick Goal
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {QUICK_GOALS.map((template) => (
                  <DropdownMenuItem
                    key={template.title}
                    onClick={() => handleQuickGoal(template)}
                  >
                    {getGoalTypeIcon(template.goalType)}
                    <span className="ml-2">{template.title}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              onClick={() => {
                setEditingGoal(null);
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Custom Goal
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {renderStats()}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="active" className="gap-2">
                  <Target className="h-4 w-4" />
                  Active ({activeGoals.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  Completed ({completedGoals.length})
                </TabsTrigger>
                {stats && stats.overdueCount > 0 && (
                  <TabsTrigger value="overdue" className="gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Overdue ({stats.overdueCount})
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="active">
                {activeGoals.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active goals</p>
                    <p className="text-sm">Create a goal to track your practice progress!</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {activeGoals.map(renderGoalCard)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed">
                {completedGoals.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No completed goals yet</p>
                    <p className="text-sm">Complete your first goal to see it here!</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {completedGoals.map(renderGoalCard)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="overdue">
                {activeGoals.filter((g) => g.isOverdue).length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                    <p>No overdue goals!</p>
                    <p className="text-sm">You&apos;re on track with all your deadlines.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {activeGoals.filter((g) => g.isOverdue).map(renderGoalCard)}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>

      <GoalDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        goal={editingGoal}
        onSuccess={() => {
          fetchGoals();
          setEditingGoal(null);
        }}
      />
      <ProgressDialog
        open={isProgressDialogOpen}
        onOpenChange={setIsProgressDialogOpen}
        goal={progressGoal}
        onSuccess={(wasCompleted) => {
          if (wasCompleted) triggerCelebration();
          fetchGoals();
        }}
      />
    </Card>
  );
}

// ============================================================================
// GOAL DIALOG (Create/Edit)
// ============================================================================

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: PracticeGoal | null;
  onSuccess?: () => void;
}

function GoalDialog({ open, onOpenChange, goal, onSuccess }: GoalDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalType: 'HOURS' as GoalType,
    targetValue: '',
    skillName: '',
    deadline: '',
    reminderEnabled: false,
    reminderFrequency: 'DAILY',
  });

  // Populate form when editing
  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description ?? '',
        goalType: goal.goalType,
        targetValue: goal.targetValue.toString(),
        skillName: goal.skillName ?? '',
        deadline: goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 16) : '',
        reminderEnabled: goal.reminderEnabled,
        reminderFrequency: goal.reminderFrequency ?? 'DAILY',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        goalType: 'HOURS',
        targetValue: '',
        skillName: '',
        deadline: '',
        reminderEnabled: false,
        reminderFrequency: 'DAILY',
      });
    }
  }, [goal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.targetValue) {
      toast.error('Title and target value are required');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        goalType: formData.goalType,
        targetValue: parseFloat(formData.targetValue),
        skillName: formData.skillName.trim() || undefined,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        reminderEnabled: formData.reminderEnabled,
        reminderFrequency: formData.reminderEnabled ? formData.reminderFrequency : undefined,
      };

      const url = goal ? `/api/sam/practice/goals/${goal.id}` : '/api/sam/practice/goals';
      const method = goal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(goal ? 'Goal updated!' : 'Goal created!');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error ?? 'Failed to save goal');
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Failed to save goal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {goal ? 'Edit Goal' : 'Create Practice Goal'}
          </DialogTitle>
          <DialogDescription>
            Set a custom target to track your practice progress
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-title">Title *</Label>
            <Input
              id="goal-title"
              placeholder="e.g., Complete 20 hours of React practice"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-description">Description</Label>
            <Textarea
              id="goal-description"
              placeholder="Describe your goal..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal-type">Goal Type</Label>
              <Select
                value={formData.goalType}
                onValueChange={(v) => setFormData({ ...formData, goalType: v as GoalType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOURS">Total Hours</SelectItem>
                  <SelectItem value="QUALITY_HOURS">Quality Hours</SelectItem>
                  <SelectItem value="SESSIONS">Sessions</SelectItem>
                  <SelectItem value="STREAK">Streak Days</SelectItem>
                  <SelectItem value="WEEKLY_HOURS">Weekly Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-target">Target Value *</Label>
              <Input
                id="goal-target"
                type="number"
                min="1"
                step={formData.goalType.includes('HOURS') ? '0.5' : '1'}
                placeholder="e.g., 20"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal-skill">Skill (Optional)</Label>
              <Input
                id="goal-skill"
                placeholder="e.g., React"
                value={formData.skillName}
                onChange={(e) => setFormData({ ...formData, skillName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-deadline">Deadline (Optional)</Label>
              <Input
                id="goal-deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="goal-reminder">Enable Reminders</Label>
              <Switch
                id="goal-reminder"
                checked={formData.reminderEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, reminderEnabled: checked })}
              />
            </div>
            {formData.reminderEnabled && (
              <div className="space-y-2">
                <Label>Reminder Frequency</Label>
                <Select
                  value={formData.reminderFrequency}
                  onValueChange={(v) => setFormData({ ...formData, reminderFrequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : goal ? (
                'Update Goal'
              ) : (
                'Create Goal'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// PROGRESS DIALOG (Update Progress)
// ============================================================================

interface ProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: PracticeGoal | null;
  onSuccess?: (wasCompleted: boolean) => void;
}

function ProgressDialog({ open, onOpenChange, goal, onSuccess }: ProgressDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'increment' | 'set'>('increment');
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) {
      setValue('');
      setMode('increment');
    }
  }, [open]);

  if (!goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      toast.error('Please enter a valid positive number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/sam/practice/goals/${goal.id}/progress`, {
        method: mode === 'increment' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'increment' ? { increment: numValue } : { value: numValue }
        ),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        onSuccess?.(result.data.wasCompleted);
      } else {
        toast.error(result.error ?? 'Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    } finally {
      setIsLoading(false);
    }
  };

  const getUnit = () => {
    switch (goal.goalType) {
      case 'HOURS':
      case 'QUALITY_HOURS':
      case 'WEEKLY_HOURS':
        return 'hours';
      case 'SESSIONS':
        return 'sessions';
      case 'STREAK':
        return 'days';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Update Progress
          </DialogTitle>
          <DialogDescription>{goal.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current progress display */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Current Progress</span>
              <span className="font-medium">
                {goal.currentValue.toFixed(goal.goalType.includes('HOURS') ? 1 : 0)} / {goal.targetValue} {getUnit()}
              </span>
            </div>
            <Progress value={goal.progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{Math.round(goal.progressPercentage)}% complete</span>
              <span>{goal.remaining.toFixed(1)} remaining</span>
            </div>
          </div>

          {/* Mode selection */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'increment' | 'set')}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="increment">Add Progress</TabsTrigger>
              <TabsTrigger value="set">Set Value</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="progress-value">
                {mode === 'increment' ? `Add ${getUnit()}` : `Set ${getUnit()} to`}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="progress-value"
                  type="number"
                  min="0"
                  step={goal.goalType.includes('HOURS') ? '0.25' : '1'}
                  placeholder={mode === 'increment' ? 'e.g., 1.5' : `e.g., ${goal.currentValue + 1}`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="flex-1"
                />
                <span className="flex items-center text-sm text-muted-foreground">{getUnit()}</span>
              </div>
              {mode === 'increment' && value && (
                <p className="text-xs text-muted-foreground">
                  New total: {(goal.currentValue + parseFloat(value || '0')).toFixed(1)} {getUnit()}
                </p>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !value}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Progress'
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PracticeGoalSetter;
