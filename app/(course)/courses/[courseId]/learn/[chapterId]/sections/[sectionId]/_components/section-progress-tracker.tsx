"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLearningMode } from "../../../../_components/learning-mode-context";
import {
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  Award,
  Target,
  Zap,
  BookOpen,
  Video,
  Code2,
  Calculator,
  FileQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ContentProgress {
  videos: { total: number; completed: number };
  blogs: { total: number; completed: number };
  math: { total: number; completed: number };
  code: { total: number; completed: number };
  exams: { total: number; completed: number };
}

interface SectionProgressTrackerProps {
  section: any;
  sectionId: string;
  userProgress?: any;
  onComplete?: () => void;
}

export function SectionProgressTracker({
  section,
  sectionId,
  userProgress,
  onComplete,
}: SectionProgressTrackerProps) {
  const { canTrackProgress, user } = useLearningMode();
  const [progress, setProgress] = useState(0);
  const [contentProgress, setContentProgress] = useState<ContentProgress>({
    videos: { total: section.videos?.length || 0, completed: 0 },
    blogs: { total: section.blogs?.length || 0, completed: 0 },
    math: { total: section.mathExplanations?.length || 0, completed: 0 },
    code: { total: section.codeExplanations?.length || 0, completed: 0 },
    exams: { total: section.exams?.length || 0, completed: 0 },
  });

  // Load initial progress
  useEffect(() => {
    if (userProgress) {
      setProgress(userProgress.progressPercent || 0);

      // Parse completed items
      const completedItems = userProgress.completedItems || {};
      setContentProgress({
        videos: {
          total: section.videos?.length || 0,
          completed: completedItems.videos?.length || 0,
        },
        blogs: {
          total: section.blogs?.length || 0,
          completed: completedItems.blogs?.length || 0,
        },
        math: {
          total: section.mathExplanations?.length || 0,
          completed: completedItems.math?.length || 0,
        },
        code: {
          total: section.codeExplanations?.length || 0,
          completed: completedItems.code?.length || 0,
        },
        exams: {
          total: section.exams?.length || 0,
          completed: completedItems.exams?.length || 0,
        },
      });
    }
  }, [userProgress, section]);

  // Calculate overall progress
  const calculateProgress = () => {
    let totalItems = 0;
    let completedItems = 0;

    Object.values(contentProgress).forEach((category) => {
      totalItems += category.total;
      completedItems += category.completed;
    });

    if (totalItems === 0) return 0;
    return Math.round((completedItems / totalItems) * 100);
  };

  // Update progress
  useEffect(() => {
    const newProgress = calculateProgress();
    setProgress(newProgress);

    // Check for completion
    if (newProgress === 100 && canTrackProgress) {
      handleSectionComplete();
    }
  }, [contentProgress]);

  // Handle section completion
  const handleSectionComplete = async () => {
    if (!canTrackProgress || !user?.id) return;

    try {
      const response = await fetch(`/api/sections/${sectionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        toast.success("🎉 Section completed! Great job!");
        onComplete?.();
      }
    } catch (error) {
      console.error("Error marking section complete:", error);
    }
  };

  // Get progress color
  const getProgressColor = (value: number) => {
    if (value === 100) return "bg-green-500";
    if (value >= 75) return "bg-blue-500";
    if (value >= 50) return "bg-yellow-500";
    if (value >= 25) return "bg-orange-500";
    return "bg-gray-400";
  };

  // Get achievement level
  const getAchievementLevel = () => {
    if (progress === 100) return { icon: Award, label: "Completed", color: "text-green-500" };
    if (progress >= 75) return { icon: Zap, label: "Almost There", color: "text-blue-500" };
    if (progress >= 50) return { icon: TrendingUp, label: "Halfway", color: "text-yellow-500" };
    if (progress >= 25) return { icon: Target, label: "Getting Started", color: "text-orange-500" };
    return { icon: BookOpen, label: "Just Started", color: "text-gray-500" };
  };

  const achievement = getAchievementLevel();
  const AchievementIcon = achievement.icon;

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base text-slate-900 dark:text-slate-100">Section Progress</CardTitle>
            <CardDescription className="text-xs mt-1 text-slate-600 dark:text-slate-400">
              Track your learning journey
            </CardDescription>
          </div>
          <div className={cn("flex items-center gap-2", achievement.color)}>
            <AchievementIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{achievement.label}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-lg font-bold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Start</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Content Type Progress */}
        <div className="space-y-3">
          {contentProgress.videos.total > 0 && (
            <ProgressItem
              icon={Video}
              label="Videos"
              completed={contentProgress.videos.completed}
              total={contentProgress.videos.total}
              color="blue"
            />
          )}
          {contentProgress.blogs.total > 0 && (
            <ProgressItem
              icon={BookOpen}
              label="Articles"
              completed={contentProgress.blogs.completed}
              total={contentProgress.blogs.total}
              color="purple"
            />
          )}
          {contentProgress.math.total > 0 && (
            <ProgressItem
              icon={Calculator}
              label="Math"
              completed={contentProgress.math.completed}
              total={contentProgress.math.total}
              color="green"
            />
          )}
          {contentProgress.code.total > 0 && (
            <ProgressItem
              icon={Code2}
              label="Code"
              completed={contentProgress.code.completed}
              total={contentProgress.code.total}
              color="orange"
            />
          )}
          {contentProgress.exams.total > 0 && (
            <ProgressItem
              icon={FileQuestion}
              label="Exams"
              completed={contentProgress.exams.completed}
              total={contentProgress.exams.total}
              color="red"
            />
          )}
        </div>

        {/* Completion Status */}
        {progress === 100 ? (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
              Section Completed!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You&apos;ve mastered all the content in this section
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
            <p className="text-xs text-muted-foreground">
              Complete all content to finish this section
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Progress Item Component
interface ProgressItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  completed: number;
  total: number;
  color: "blue" | "purple" | "green" | "orange" | "red";
}

function ProgressItem({
  icon: Icon,
  label,
  completed,
  total,
  color,
}: ProgressItemProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isCompleted = completed === total;

  const colorClasses = {
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
    purple: "text-purple-500 bg-purple-50 dark:bg-purple-950/20",
    green: "text-green-500 bg-green-50 dark:bg-green-950/20",
    orange: "text-orange-500 bg-orange-50 dark:bg-orange-950/20",
    red: "text-red-500 bg-red-50 dark:bg-red-950/20",
  };

  return (
    <div className="flex items-center gap-3">
      <div className={cn("p-2 rounded-lg", colorClasses[color])}>
        <Icon className={cn("h-4 w-4", colorClasses[color].split(" ")[0])} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">
            {completed}/{total}
          </span>
        </div>
        <Progress value={percentage} className="h-1.5" />
      </div>
      {isCompleted && (
        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
      )}
    </div>
  );
}