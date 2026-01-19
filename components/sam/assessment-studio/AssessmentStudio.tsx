"use client";

/**
 * AssessmentStudio
 *
 * A unified assessment hub that combines exam building, study guide generation,
 * and AI-powered exam feedback into a cohesive learning experience.
 *
 * Phase 1 of the engine merge plan - integrating ExamEngine and EvaluationEngine.
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  FileText,
  Sparkles,
  GraduationCap,
  ChevronRight,
  CheckCircle2,
  Clock,
  Brain,
  Target,
  Zap,
  PenTool,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import existing components
import { ExamBuilder } from "@/components/sam/exam-builder";
import { StudyGuideGenerator } from "@/components/sam/study-guide/StudyGuideGenerator";

export interface AssessmentStudioProps {
  courseId?: string;
  courseTitle?: string;
  sectionId?: string;
  userId?: string;
  compact?: boolean;
  className?: string;
  onExamCreated?: (examId: string) => void;
}

type StudioMode = "overview" | "exam-builder" | "study-guide";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
  color: string;
  bgColor: string;
  action: StudioMode;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "exam-builder",
    title: "Create Exam",
    description: "AI-powered exam generation with Bloom&apos;s Taxonomy alignment",
    icon: PenTool,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    action: "exam-builder",
  },
  {
    id: "study-guide",
    title: "Generate Study Guide",
    description: "Personalized study plan based on your learning progress",
    icon: BookOpen,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    action: "study-guide",
  },
];

export function AssessmentStudio({
  courseId = "",
  courseTitle = "My Course",
  sectionId,
  userId,
  compact = false,
  className,
  onExamCreated,
}: AssessmentStudioProps) {
  const [mode, setMode] = useState<StudioMode>("overview");
  const [examBuilderOpen, setExamBuilderOpen] = useState(false);
  const [studyGuideOpen, setStudyGuideOpen] = useState(false);

  const handleActionClick = useCallback((action: StudioMode) => {
    if (action === "exam-builder") {
      setExamBuilderOpen(true);
    } else if (action === "study-guide") {
      setStudyGuideOpen(true);
    } else {
      setMode(action);
    }
  }, []);

  const handleExamCreated = useCallback(
    (examId: string) => {
      setExamBuilderOpen(false);
      onExamCreated?.(examId);
    },
    [onExamCreated]
  );

  // Compact mode - just quick action buttons
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExamBuilderOpen(true)}
                className="gap-2"
              >
                <PenTool className="h-4 w-4 text-purple-500" />
                Create Exam
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              AI-powered exam generation with Bloom&apos;s Taxonomy alignment
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <StudyGuideGenerator
          courseId={courseId}
          courseTitle={courseTitle}
          sectionId={sectionId}
          userId={userId}
          variant="compact"
        />

        {/* Exam Builder Dialog */}
        <Dialog open={examBuilderOpen} onOpenChange={setExamBuilderOpen}>
          <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
            <ExamBuilder
              courseId={courseId}
              sectionIds={sectionId ? [sectionId] : undefined}
              onExamCreated={handleExamCreated}
              onClose={() => setExamBuilderOpen(false)}
              className="h-full"
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full mode - card with overview
  return (
    <Card className={cn("overflow-hidden border-slate-200 dark:border-slate-700", className)}>
      <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Assessment Studio
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
              Create exams, generate study guides, and track your progress
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
            <Target className="h-4 w-4 mx-auto text-purple-500 mb-1" />
            <p className="text-lg font-semibold text-slate-900 dark:text-white">6</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bloom&apos;s Levels</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
            <Brain className="h-4 w-4 mx-auto text-violet-500 mb-1" />
            <p className="text-lg font-semibold text-slate-900 dark:text-white">AI</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Adaptive</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
            <Zap className="h-4 w-4 mx-auto text-amber-500 mb-1" />
            <p className="text-lg font-semibold text-slate-900 dark:text-white">Fast</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Generation</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                onClick={() => handleActionClick(action.action)}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all text-left group"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", action.bgColor)}>
                  <Icon className={cn("h-6 w-6", action.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {action.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {action.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
              </motion.button>
            );
          })}
        </div>

        {/* Features List */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Features
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              "Bloom&apos;s Taxonomy",
              "Question Bank",
              "Adaptive Difficulty",
              "AI Feedback",
              "Study Plans",
            ].map((feature) => (
              <Badge
                key={feature}
                variant="outline"
                className="text-xs text-slate-600 dark:text-slate-300"
              >
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Exam Builder Dialog */}
      <Dialog open={examBuilderOpen} onOpenChange={setExamBuilderOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
          <ExamBuilder
            courseId={courseId}
            sectionIds={sectionId ? [sectionId] : undefined}
            onExamCreated={handleExamCreated}
            onClose={() => setExamBuilderOpen(false)}
            className="h-full"
          />
        </DialogContent>
      </Dialog>

      {/* Study Guide Sheet - Using the existing component */}
      <div className="hidden">
        <StudyGuideGenerator
          courseId={courseId}
          courseTitle={courseTitle}
          sectionId={sectionId}
          userId={userId}
          variant="button"
        />
      </div>
    </Card>
  );
}

export default AssessmentStudio;
