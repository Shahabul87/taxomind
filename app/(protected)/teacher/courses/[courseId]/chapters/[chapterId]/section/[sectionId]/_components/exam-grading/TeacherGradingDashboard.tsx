"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Brain,
  Sparkles,
  ChevronRight,
  ChevronDown,
  MessageCircle,
  Send,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Save,
  RotateCcw,
  Filter,
  Search,
  SortAsc,
  LayoutGrid,
  List,
  Check,
  X,
  BookOpen,
  GraduationCap,
  Target,
  Award,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BloomsLevel, EvaluationType } from "@prisma/client";
import { BLOOMS_COLORS, BLOOMS_LABELS } from "./types";
import { toast } from "sonner";

// ==========================================
// Types
// ==========================================

interface GradingQueueItem {
  attemptId: string;
  studentId: string;
  studentName: string;
  studentImage?: string;
  studentEmail: string;
  examId: string;
  examTitle: string;
  courseId?: string;
  courseName?: string;
  chapterName?: string;
  sectionName?: string;
  submittedAt: string;
  questionsToReview: number;
  flaggedForReview: number;
  autoScore: number;
  status: "pending" | "needs_review" | "completed";
}

interface AnswerForGrading {
  id: string;
  questionId: string;
  question: {
    id: string;
    question: string;
    questionType: string;
    bloomsLevel: BloomsLevel;
    difficulty: string;
    points: number;
    correctAnswer: string;
    explanation?: string;
  };
  studentAnswer: string;
  currentScore: number;
  maxScore: number;
  evaluationType: EvaluationType;
  aiEvaluation?: AIEvaluation;
  status: "pending" | "approved" | "modified";
  teacherScore?: number;
  teacherFeedback?: string;
}

interface AIEvaluation {
  accuracy: number;
  completeness: number;
  relevance: number;
  depth: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  confidence: number;
  flaggedForReview: boolean;
}

interface SAMGradingAssistance {
  suggestedScore: number;
  maxScore: number;
  confidence: number;
  reasoning: string;
  rubricAlignment: { criterionName: string; score: number; maxScore: number; justification: string }[];
  keyStrengths: string[];
  keyWeaknesses: string[];
  suggestedFeedback: string;
  flaggedIssues: string[];
  teacherTips: string[];
}

interface TeacherGradingDashboardProps {
  courseId?: string;
  onClose?: () => void;
}

// ==========================================
// Animation Variants
// ==========================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ==========================================
// Sub Components
// ==========================================

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  trend?: { value: number; direction: "up" | "down" };
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            {trend && (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.direction === "up" ? "text-emerald-500" : "text-red-500"
                )}
              >
                {trend.direction === "up" ? "+" : "-"}{trend.value}%
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QueueItemCard({
  item,
  isSelected,
  onSelect,
}: {
  item: GradingQueueItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={cn(
        "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
        isSelected
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
      )}
    >
      <div className="flex items-center gap-4">
        <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
          <AvatarImage src={item.studentImage} />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-medium">
            {item.studentName?.slice(0, 2).toUpperCase() || "ST"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-900 dark:text-white truncate">
              {item.studentName}
            </h4>
            {item.flaggedForReview > 0 && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {item.flaggedForReview} flagged
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
            {item.examTitle}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(item.submittedAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {item.questionsToReview} to review
            </span>
          </div>
        </div>

        <div className="text-right">
          <div
            className={cn(
              "text-2xl font-bold",
              item.autoScore >= 70
                ? "text-emerald-600 dark:text-emerald-400"
                : item.autoScore >= 50
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400"
            )}
          >
            {item.autoScore}%
          </div>
          <div className="text-xs text-slate-500">AI Score</div>
        </div>

        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>
    </motion.div>
  );
}

function AnswerGradingCard({
  answer,
  onScoreChange,
  onFeedbackChange,
  onApprove,
  onRequestSAMHelp,
  samAssistance,
  isSAMLoading,
}: {
  answer: AnswerForGrading;
  onScoreChange: (answerId: string, score: number) => void;
  onFeedbackChange: (answerId: string, feedback: string) => void;
  onApprove: (answerId: string) => void;
  onRequestSAMHelp: (answer: AnswerForGrading) => void;
  samAssistance?: SAMGradingAssistance;
  isSAMLoading: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localScore, setLocalScore] = useState(answer.teacherScore ?? answer.currentScore);
  const [localFeedback, setLocalFeedback] = useState(answer.teacherFeedback ?? "");
  const [isEditing, setIsEditing] = useState(false);

  const bloomsColor = BLOOMS_COLORS[answer.question.bloomsLevel];

  const handleSaveChanges = useCallback(() => {
    onScoreChange(answer.id, localScore);
    onFeedbackChange(answer.id, localFeedback);
    setIsEditing(false);
    toast.success("Score updated successfully");
  }, [answer.id, localScore, localFeedback, onScoreChange, onFeedbackChange]);

  const handleApplySAMSuggestion = useCallback(() => {
    if (samAssistance) {
      setLocalScore(samAssistance.suggestedScore);
      setLocalFeedback(samAssistance.suggestedFeedback);
      toast.success("SAM suggestion applied");
    }
  }, [samAssistance]);

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "rounded-xl border-2 transition-all duration-300 overflow-hidden",
        answer.status === "approved"
          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
          : answer.status === "modified"
            ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20"
            : answer.aiEvaluation?.flaggedForReview
              ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm",
            answer.status === "approved"
              ? "bg-emerald-500 text-white"
              : answer.status === "modified"
                ? "bg-blue-500 text-white"
                : answer.aiEvaluation?.flaggedForReview
                  ? "bg-amber-500 text-white"
                  : "bg-slate-400 text-white"
          )}
        >
          {answer.status === "approved" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : answer.status === "modified" ? (
            <Edit3 className="w-5 h-5" />
          ) : answer.aiEvaluation?.flaggedForReview ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <Clock className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={cn("text-xs", bloomsColor.bg, bloomsColor.text)}>
              {BLOOMS_LABELS[answer.question.bloomsLevel]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {answer.question.questionType.replace("_", " ")}
            </Badge>
            {answer.aiEvaluation && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  answer.aiEvaluation.confidence >= 80
                    ? "text-emerald-600 border-emerald-300"
                    : answer.aiEvaluation.confidence >= 60
                      ? "text-amber-600 border-amber-300"
                      : "text-red-600 border-red-300"
                )}
              >
                <Brain className="w-3 h-3 mr-1" />
                {answer.aiEvaluation.confidence}% confidence
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-1">
            {answer.question.question}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {localScore}/{answer.maxScore}
            </div>
            <div className="text-xs text-slate-500">
              {answer.status === "modified" && "Modified"}
              {answer.status === "approved" && "Approved"}
              {answer.status === "pending" && "Pending"}
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4 border-t border-slate-200 dark:border-slate-700">
              {/* Question & Answers Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Question */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Question
                  </h4>
                  <p className="text-slate-900 dark:text-white">{answer.question.question}</p>
                </div>

                {/* Expected Answer */}
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                    Expected Answer
                  </h4>
                  <p className="text-emerald-900 dark:text-emerald-100">
                    {answer.question.correctAnswer}
                  </p>
                </div>
              </div>

              {/* Student Answer */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
                  Student Answer
                </h4>
                <p className="text-blue-900 dark:text-blue-100">
                  {answer.studentAnswer || "No answer provided"}
                </p>
              </div>

              {/* AI Evaluation */}
              {answer.aiEvaluation && (
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      AI Evaluation
                    </h4>
                    <span className="text-xs text-purple-600 dark:text-purple-400">
                      Score: {answer.currentScore}/{answer.maxScore}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "Accuracy", value: answer.aiEvaluation.accuracy },
                      { label: "Completeness", value: answer.aiEvaluation.completeness },
                      { label: "Relevance", value: answer.aiEvaluation.relevance },
                      { label: "Depth", value: answer.aiEvaluation.depth },
                    ].map((metric) => (
                      <div key={metric.label} className="bg-white dark:bg-slate-800 rounded-lg p-2">
                        <div className="text-xs text-slate-500 mb-1">{metric.label}</div>
                        <div className="flex items-center gap-2">
                          <Progress value={metric.value} className="flex-1 h-1.5" />
                          <span className="text-xs font-medium text-purple-600">{metric.value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-purple-900 dark:text-purple-100">
                    {answer.aiEvaluation.feedback}
                  </p>
                </div>
              )}

              {/* SAM Assistance */}
              {samAssistance && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      SAM Grading Assistant
                    </h4>
                    <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {samAssistance.confidence}% confident
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {samAssistance.suggestedScore}/{samAssistance.maxScore}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Suggested Score
                        </div>
                        <div className="text-xs text-slate-500">{samAssistance.reasoning}</div>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleApplySAMSuggestion}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        Apply
                      </Button>
                    </div>

                    {samAssistance.keyStrengths.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-emerald-600 mb-1">Strengths</h5>
                        <ul className="space-y-1">
                          {samAssistance.keyStrengths.map((strength, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                              <ThumbsUp className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {samAssistance.keyWeaknesses.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-amber-600 mb-1">Weaknesses</h5>
                        <ul className="space-y-1">
                          {samAssistance.keyWeaknesses.map((weakness, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                              <ThumbsDown className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {samAssistance.teacherTips.length > 0 && (
                      <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                        <h5 className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          Tips for Grading
                        </h5>
                        <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                          {samAssistance.teacherTips.map((tip, i) => (
                            <li key={i}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Grading Controls */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Your Grade
                  </h4>
                  <div className="flex items-center gap-2">
                    {!samAssistance && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRequestSAMHelp(answer)}
                        disabled={isSAMLoading}
                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      >
                        {isSAMLoading ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-1" />
                        )}
                        Ask SAM
                      </Button>
                    )}
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? (
                        <>
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                        Score: {localScore}/{answer.maxScore}
                      </label>
                      <Slider
                        value={[localScore]}
                        onValueChange={(value) => setLocalScore(value[0])}
                        max={answer.maxScore}
                        step={0.5}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                        Feedback to Student
                      </label>
                      <Textarea
                        value={localFeedback}
                        onChange={(e) => setLocalFeedback(e.target.value)}
                        placeholder="Add feedback for the student..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveChanges} className="bg-emerald-600 hover:bg-emerald-700">
                        <Save className="w-4 h-4 mr-1" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {localScore}/{answer.maxScore}
                      </div>
                      {localFeedback && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {localFeedback}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => onApprove(answer.id)}
                      disabled={answer.status === "approved"}
                      className={cn(
                        answer.status === "approved"
                          ? "bg-emerald-600"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      )}
                    >
                      {answer.status === "approved" ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Approved
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve Grade
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==========================================
// Main Component
// ==========================================

export function TeacherGradingDashboard({ courseId, onClose }: TeacherGradingDashboardProps) {
  const [queue, setQueue] = useState<GradingQueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GradingQueueItem | null>(null);
  const [answers, setAnswers] = useState<AnswerForGrading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("submitted");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [samAssistanceMap, setSamAssistanceMap] = useState<Record<string, SAMGradingAssistance>>({});
  const [loadingSAM, setLoadingSAM] = useState<string | null>(null);

  // Fetch grading queue
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (courseId) params.append("courseId", courseId);

        const response = await fetch(`/api/exams/grading-queue?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setQueue(data.queue);
        }
      } catch (error) {
        console.error("Error fetching grading queue:", error);
        toast.error("Failed to load grading queue");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueue();
  }, [courseId]);

  // Fetch answers for selected attempt
  useEffect(() => {
    if (!selectedItem) {
      setAnswers([]);
      return;
    }

    const fetchAnswers = async () => {
      try {
        const response = await fetch(`/api/exams/results/${selectedItem.attemptId}`);
        const data = await response.json();

        if (data.success) {
          setAnswers(
            data.result.answers.map((a: any) => ({
              id: a.id,
              questionId: a.questionId,
              question: a.question,
              studentAnswer: a.studentAnswer,
              currentScore: a.pointsEarned,
              maxScore: a.maxPoints,
              evaluationType: a.evaluationType,
              aiEvaluation: a.aiEvaluation,
              status: a.evaluationType === "TEACHER_GRADED" ? "approved" : "pending",
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching answers:", error);
        toast.error("Failed to load answers");
      }
    };

    fetchAnswers();
  }, [selectedItem]);

  // Filter and sort queue
  const filteredQueue = useMemo(() => {
    return queue
      .filter((item) => {
        const matchesSearch =
          item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.examTitle.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "flagged" && item.flaggedForReview > 0) ||
          item.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "score_low":
            return a.autoScore - b.autoScore;
          case "score_high":
            return b.autoScore - a.autoScore;
          case "flagged":
            return b.flaggedForReview - a.flaggedForReview;
          default:
            return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        }
      });
  }, [queue, searchTerm, filterStatus, sortBy]);

  // Handlers
  const handleScoreChange = useCallback(async (answerId: string, score: number) => {
    setAnswers((prev) =>
      prev.map((a) =>
        a.id === answerId ? { ...a, teacherScore: score, status: "modified" } : a
      )
    );
  }, []);

  const handleFeedbackChange = useCallback((answerId: string, feedback: string) => {
    setAnswers((prev) =>
      prev.map((a) =>
        a.id === answerId ? { ...a, teacherFeedback: feedback, status: "modified" } : a
      )
    );
  }, []);

  const handleApprove = useCallback(async (answerId: string) => {
    const answer = answers.find((a) => a.id === answerId);
    if (!answer) return;

    try {
      const response = await fetch("/api/exams/grading-queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answerId,
          newScore: answer.teacherScore ?? answer.currentScore,
          feedback: answer.teacherFeedback,
          reason: "Teacher approved",
        }),
      });

      if (response.ok) {
        setAnswers((prev) =>
          prev.map((a) => (a.id === answerId ? { ...a, status: "approved" } : a))
        );
        toast.success("Answer approved");
      }
    } catch (error) {
      console.error("Error approving answer:", error);
      toast.error("Failed to approve answer");
    }
  }, [answers]);

  const handleRequestSAMHelp = useCallback(async (answer: AnswerForGrading) => {
    setLoadingSAM(answer.id);

    try {
      const response = await fetch("/api/exams/sam-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grading-assistance",
          data: {
            questionText: answer.question.question,
            expectedAnswer: answer.question.correctAnswer,
            studentAnswer: answer.studentAnswer,
            rubric: {
              criteria: ["Accuracy", "Completeness", "Understanding", "Clarity"],
              maxScore: answer.maxScore,
            },
            bloomsLevel: answer.question.bloomsLevel,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSamAssistanceMap((prev) => ({
          ...prev,
          [answer.id]: data.assistance,
        }));
      }
    } catch (error) {
      console.error("Error getting SAM assistance:", error);
      toast.error("Failed to get SAM assistance");
    } finally {
      setLoadingSAM(null);
    }
  }, []);

  const handleBulkApprove = useCallback(async () => {
    const pendingIds = answers.filter((a) => a.status === "pending").map((a) => a.id);

    if (pendingIds.length === 0) {
      toast.info("No pending answers to approve");
      return;
    }

    try {
      const response = await fetch("/api/exams/grading-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk-approve",
          answerIds: pendingIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnswers((prev) => prev.map((a) => ({ ...a, status: "approved" })));
        toast.success(`${data.count} answers approved`);
      }
    } catch (error) {
      console.error("Error bulk approving:", error);
      toast.error("Failed to approve answers");
    }
  }, [answers]);

  // Stats
  const stats = useMemo(() => {
    const total = queue.length;
    const flagged = queue.filter((q) => q.flaggedForReview > 0).length;
    const avgScore = queue.length > 0
      ? Math.round(queue.reduce((sum, q) => sum + q.autoScore, 0) / queue.length)
      : 0;
    const totalQuestions = queue.reduce((sum, q) => sum + q.questionsToReview, 0);

    return { total, flagged, avgScore, totalQuestions };
  }, [queue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />

      <motion.div
        className="container mx-auto px-4 py-8 max-w-7xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Grading Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Review and grade student exam submissions with SAM AI assistance
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Submissions"
            value={stats.total}
            color="bg-indigo-500"
          />
          <StatCard
            icon={AlertTriangle}
            label="Flagged"
            value={stats.flagged}
            color="bg-amber-500"
          />
          <StatCard
            icon={Target}
            label="Avg Score"
            value={`${stats.avgScore}%`}
            color="bg-emerald-500"
          />
          <StatCard
            icon={BookOpen}
            label="Questions"
            value={stats.totalQuestions}
            color="bg-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue Panel */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  Grading Queue
                </CardTitle>
                <CardDescription>
                  {filteredQueue.length} submissions to review
                </CardDescription>

                {/* Search & Filters */}
                <div className="space-y-3 pt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="flex-1">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="flagged">Flagged</SelectItem>
                        <SelectItem value="needs_review">Needs Review</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="flex-1">
                        <SortAsc className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="score_low">Score (Low)</SelectItem>
                        <SelectItem value="score_high">Score (High)</SelectItem>
                        <SelectItem value="flagged">Flagged First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  </div>
                ) : filteredQueue.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No submissions to review</p>
                  </div>
                ) : (
                  filteredQueue.map((item) => (
                    <QueueItemCard
                      key={item.attemptId}
                      item={item}
                      isSelected={selectedItem?.attemptId === item.attemptId}
                      onSelect={() => setSelectedItem(item)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Grading Panel */}
          <div className="lg:col-span-2">
            {selectedItem ? (
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={selectedItem.studentImage} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                          {selectedItem.studentName?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{selectedItem.studentName}</CardTitle>
                        <CardDescription>{selectedItem.examTitle}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkApprove}
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve All
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {answers.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                  ) : (
                    answers.map((answer) => (
                      <AnswerGradingCard
                        key={answer.id}
                        answer={answer}
                        onScoreChange={handleScoreChange}
                        onFeedbackChange={handleFeedbackChange}
                        onApprove={handleApprove}
                        onRequestSAMHelp={handleRequestSAMHelp}
                        samAssistance={samAssistanceMap[answer.id]}
                        isSAMLoading={loadingSAM === answer.id}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm h-full min-h-[400px] flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">Select a Submission</h3>
                  <p className="text-sm">Choose a student submission from the queue to start grading</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
