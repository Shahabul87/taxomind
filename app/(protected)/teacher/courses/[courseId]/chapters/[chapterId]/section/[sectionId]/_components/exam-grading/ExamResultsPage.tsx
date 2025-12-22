"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  Brain,
  Sparkles,
  ChevronRight,
  ChevronDown,
  MessageCircle,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Send,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { BloomsLevel, EvaluationType } from "@prisma/client";
import { BLOOMS_COLORS, BLOOMS_LABELS } from "./types";

// ==========================================
// Types
// ==========================================

interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  status: string;
  scorePercentage: number;
  isPassed: boolean;
  passingScore: number;
  startedAt: string;
  submittedAt: string | null;
  timeSpent: number | null;
  totalQuestions: number;
  correctAnswers: number;
  totalPoints: number;
  maxPoints: number;
  answers: AnswerResult[];
  bloomsBreakdown: BloomsBreakdown;
  cognitiveProfile: CognitiveProfile;
  learningPath: LearningRecommendation[];
  student: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  course?: {
    id: string;
    title: string;
  };
}

interface AnswerResult {
  id: string;
  questionId: string;
  question: {
    id: string;
    question: string;
    questionType: string;
    bloomsLevel: BloomsLevel;
    difficulty: string;
    points: number;
    correctAnswer?: string;
    explanation?: string;
    options?: { id: string; text: string; isCorrect: boolean }[];
  };
  studentAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  evaluationType: EvaluationType;
  feedback: string;
  aiEvaluation?: AIEvaluation;
}

interface AIEvaluation {
  accuracy: number;
  completeness: number;
  relevance: number;
  depth: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
  demonstratedLevel: BloomsLevel;
  targetLevel: BloomsLevel;
  conceptsUnderstood: string[];
  misconceptions: Misconception[];
  knowledgeGaps: string[];
  confidence: number;
  flaggedForReview: boolean;
}

interface Misconception {
  concept: string;
  incorrectUnderstanding: string;
  correctUnderstanding: string;
  remediation: string;
}

interface BloomsBreakdown {
  REMEMBER: LevelPerformance;
  UNDERSTAND: LevelPerformance;
  APPLY: LevelPerformance;
  ANALYZE: LevelPerformance;
  EVALUATE: LevelPerformance;
  CREATE: LevelPerformance;
}

interface LevelPerformance {
  questionsCount: number;
  correctCount: number;
  scorePercentage: number;
  averageTime: number;
}

interface CognitiveProfile {
  overallMastery: number;
  strengths: BloomsLevel[];
  weaknesses: BloomsLevel[];
  recommendedFocus: BloomsLevel[];
}

interface LearningRecommendation {
  type: "review" | "practice" | "advance" | "remediate";
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  bloomsLevel: BloomsLevel;
  relatedConcepts: string[];
  estimatedTime: number;
}

interface ExamResultsPageProps {
  result: ExamResult;
  isTeacher?: boolean;
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
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ==========================================
// Sub Components
// ==========================================

function ScoreCircle({ score, isPassed }: { score: number; isPassed: boolean }) {
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      className="relative w-40 h-40"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            {isPassed ? (
              <>
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </>
            )}
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn(
            "text-4xl font-bold",
            isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {score}%
        </motion.span>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Score</span>
      </div>
    </motion.div>
  );
}

function BloomsRadarChart({ breakdown }: { breakdown: BloomsBreakdown }) {
  const levels: BloomsLevel[] = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
  const centerX = 100;
  const centerY = 100;
  const maxRadius = 80;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / levels.length - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const points = levels.map((level, i) => getPoint(i, breakdown[level].scorePercentage));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Background rings */}
      {[20, 40, 60, 80, 100].map((percent) => (
        <polygon
          key={percent}
          points={levels.map((_, i) => {
            const p = getPoint(i, percent);
            return `${p.x},${p.y}`;
          }).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-slate-200 dark:text-slate-700"
        />
      ))}

      {/* Axis lines */}
      {levels.map((_, i) => {
        const p = getPoint(i, 100);
        return (
          <line
            key={i}
            x1={centerX}
            y1={centerY}
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            strokeWidth="1"
            className="text-slate-200 dark:text-slate-700"
          />
        );
      })}

      {/* Data polygon */}
      <motion.path
        d={pathD}
        fill="url(#radarGradient)"
        stroke="url(#radarStroke)"
        strokeWidth="2"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        style={{ transformOrigin: "center" }}
      />

      {/* Data points */}
      {points.map((point, i) => (
        <motion.circle
          key={levels[i]}
          cx={point.x}
          cy={point.y}
          r="4"
          className={cn("fill-current", BLOOMS_COLORS[levels[i]].text)}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.8 + i * 0.1 }}
        />
      ))}

      {/* Labels */}
      {levels.map((level, i) => {
        const labelPoint = getPoint(i, 120);
        return (
          <text
            key={level}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-medium fill-slate-600 dark:fill-slate-400"
          >
            {BLOOMS_LABELS[level]}
          </text>
        );
      })}

      <defs>
        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function QuestionCard({
  answer,
  index,
  isExpanded,
  onToggle,
  onAskSAM,
}: {
  answer: AnswerResult;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onAskSAM: (question: string, answer: AnswerResult) => void;
}) {
  const bloomsColor = BLOOMS_COLORS[answer.question.bloomsLevel];
  const [samQuestion, setSamQuestion] = useState("");

  const handleAskSAM = useCallback(() => {
    if (samQuestion.trim()) {
      onAskSAM(samQuestion, answer);
      setSamQuestion("");
    }
  }, [samQuestion, answer, onAskSAM]);

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "rounded-xl border-2 transition-all duration-300 overflow-hidden",
        answer.isCorrect
          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
          : "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
      )}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm",
            answer.isCorrect
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
          )}
        >
          {answer.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-slate-500">Question {index + 1}</span>
            <Badge className={cn("text-xs", bloomsColor.bg, bloomsColor.text)}>
              {BLOOMS_LABELS[answer.question.bloomsLevel]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {answer.question.questionType.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-1">
            {answer.question.question}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {answer.pointsEarned}/{answer.maxPoints}
            </div>
            <div className="text-xs text-slate-500">points</div>
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
              {/* Question Text */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Question</h4>
                <p className="text-slate-900 dark:text-white">{answer.question.question}</p>
              </div>

              {/* Student Answer */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Your Answer</h4>
                <p className="text-slate-900 dark:text-white">{answer.studentAnswer || "No answer provided"}</p>
              </div>

              {/* Correct Answer */}
              {answer.question.correctAnswer && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Correct Answer</h4>
                  <p className="text-emerald-900 dark:text-emerald-100">{answer.question.correctAnswer}</p>
                </div>
              )}

              {/* Feedback */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Feedback
                </h4>
                <p className="text-blue-900 dark:text-blue-100">{answer.feedback}</p>
              </div>

              {/* AI Evaluation Details */}
              {answer.aiEvaluation && (
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 space-y-4">
                  <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Analysis
                  </h4>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Accuracy", value: answer.aiEvaluation.accuracy },
                      { label: "Completeness", value: answer.aiEvaluation.completeness },
                      { label: "Relevance", value: answer.aiEvaluation.relevance },
                      { label: "Depth", value: answer.aiEvaluation.depth },
                    ].map((metric) => (
                      <div key={metric.label} className="bg-white dark:bg-slate-800 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">{metric.label}</div>
                        <div className="flex items-center gap-2">
                          <Progress value={metric.value} className="flex-1 h-2" />
                          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                            {metric.value}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Strengths */}
                  {answer.aiEvaluation.strengths.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">Strengths</h5>
                      <ul className="space-y-1">
                        {answer.aiEvaluation.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-purple-900 dark:text-purple-100">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {answer.aiEvaluation.improvements.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">Areas for Improvement</h5>
                      <ul className="space-y-1">
                        {answer.aiEvaluation.improvements.map((improvement, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-purple-900 dark:text-purple-100">
                            <TrendingUp className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Ask SAM Section */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Ask SAM for Help
                </h4>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask SAM to explain this answer, clarify concepts, or suggest how to improve..."
                    value={samQuestion}
                    onChange={(e) => setSamQuestion(e.target.value)}
                    className="min-h-[60px] resize-none bg-white dark:bg-slate-800"
                  />
                  <Button
                    onClick={handleAskSAM}
                    disabled={!samQuestion.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LearningPathCard({ recommendation }: { recommendation: LearningRecommendation }) {
  const bloomsColor = BLOOMS_COLORS[recommendation.bloomsLevel];
  const priorityColors = {
    HIGH: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
    MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  };

  const typeIcons = {
    remediate: AlertTriangle,
    review: BookOpen,
    practice: Target,
    advance: TrendingUp,
  };

  const Icon = typeIcons[recommendation.type];

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", bloomsColor.bg)}>
          <Icon className={cn("w-5 h-5", bloomsColor.text)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-900 dark:text-white">{recommendation.title}</h4>
            <Badge className={cn("text-xs", priorityColors[recommendation.priority])}>
              {recommendation.priority}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{recommendation.description}</p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>{recommendation.estimatedTime} min</span>
            <span className="mx-1">•</span>
            <Badge variant="outline" className={cn("text-xs", bloomsColor.text)}>
              {BLOOMS_LABELS[recommendation.bloomsLevel]}
            </Badge>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>
    </motion.div>
  );
}

// ==========================================
// SAM Chat Panel
// ==========================================

interface SAMMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function SAMChatPanel({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  messages: SAMMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}) {
  const [input, setInput] = useState("");

  const handleSend = useCallback(() => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput("");
    }
  }, [input, isLoading, onSendMessage]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-500 to-purple-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">SAM AI Tutor</h3>
                  <p className="text-xs text-white/80">Ask me about your exam results</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <GraduationCap className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Hi! I&apos;m SAM, your AI tutor. Ask me anything about your exam results or how to improve!
                </p>
              </div>
            )}
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl p-3 text-sm",
                    message.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm"
                  )}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-3 rounded-bl-sm">
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-slate-400"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 rounded-full bg-slate-400"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 rounded-full bg-slate-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask SAM a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="min-h-[44px] max-h-[120px] resize-none"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ==========================================
// Main Component
// ==========================================

export function ExamResultsPage({ result, isTeacher = false, onClose }: ExamResultsPageProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [samChatOpen, setSamChatOpen] = useState(false);
  const [samMessages, setSamMessages] = useState<SAMMessage[]>([]);
  const [isSamLoading, setIsSamLoading] = useState(false);

  const toggleQuestion = useCallback((questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

  const handleAskSAM = useCallback(async (question: string, answer: AnswerResult) => {
    setSamChatOpen(true);

    const userMessage: SAMMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setSamMessages((prev) => [...prev, userMessage]);
    setIsSamLoading(true);

    try {
      const response = await fetch("/api/exams/sam-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "explain-result",
          data: {
            question,
            questionResult: {
              questionId: answer.questionId,
              questionText: answer.question.question,
              questionType: answer.question.questionType,
              bloomsLevel: answer.question.bloomsLevel,
              studentAnswer: answer.studentAnswer,
              correctAnswer: answer.question.correctAnswer || "",
              isCorrect: answer.isCorrect,
              pointsEarned: answer.pointsEarned,
              maxPoints: answer.maxPoints,
              feedback: answer.feedback,
              evaluationType: answer.evaluationType,
              aiEvaluation: answer.aiEvaluation,
            },
          },
        }),
      });

      const data = await response.json();

      const assistantMessage: SAMMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.explanation || "I apologize, but I couldn't process that request. Please try again.",
        timestamp: new Date(),
      };

      setSamMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error asking SAM:", error);
      const errorMessage: SAMMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "I'm having trouble right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setSamMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSamLoading(false);
    }
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    const userMessage: SAMMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setSamMessages((prev) => [...prev, userMessage]);
    setIsSamLoading(true);

    try {
      // For general questions, we can use a simpler endpoint
      const response = await fetch("/api/exams/sam-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "explain-result",
          data: {
            question: message,
            questionResult: {
              questionId: "general",
              questionText: `Exam: ${result.examTitle}`,
              questionType: "general",
              bloomsLevel: "UNDERSTAND",
              studentAnswer: "",
              correctAnswer: "",
              isCorrect: result.isPassed,
              pointsEarned: result.totalPoints,
              maxPoints: result.maxPoints,
              feedback: `Score: ${result.scorePercentage}%`,
              evaluationType: "AUTO_GRADED",
            },
          },
        }),
      });

      const data = await response.json();

      const assistantMessage: SAMMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.explanation || "I apologize, but I couldn't process that request.",
        timestamp: new Date(),
      };

      setSamMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSamLoading(false);
    }
  }, [result]);

  const sortedAnswers = useMemo(() => {
    return [...result.answers].sort((a, b) => {
      // Sort incorrect answers first
      if (a.isCorrect !== b.isCorrect) {
        return a.isCorrect ? 1 : -1;
      }
      return 0;
    });
  }, [result.answers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />

      {/* Floating SAM Button */}
      <motion.button
        onClick={() => setSamChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg hover:shadow-xl flex items-center justify-center text-white transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* SAM Chat Panel */}
      <SAMChatPanel
        isOpen={samChatOpen}
        onClose={() => setSamChatOpen(false)}
        messages={samMessages}
        onSendMessage={handleSendMessage}
        isLoading={isSamLoading}
      />

      <motion.div
        className="container mx-auto px-4 py-8 max-w-6xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            {result.examTitle}
          </h1>
          {result.course && (
            <p className="text-slate-600 dark:text-slate-400">{result.course.title}</p>
          )}
        </motion.div>

        {/* Score Overview */}
        <motion.div variants={scaleIn} className="mb-8">
          <Card className="overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <ScoreCircle score={result.scorePercentage} isPassed={result.isPassed} />

                <div className="flex-1 text-center md:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mb-4"
                  >
                    {result.isPassed ? (
                      <Badge className="bg-emerald-500 text-white text-lg px-4 py-1">
                        <Trophy className="w-4 h-4 mr-2" />
                        Passed
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500 text-white text-lg px-4 py-1">
                        <Target className="w-4 h-4 mr-2" />
                        Keep Practicing
                      </Badge>
                    )}
                  </motion.div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {result.correctAnswers}/{result.totalQuestions}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Correct</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {result.totalPoints}/{result.maxPoints}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Points</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {result.passingScore}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Required</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {result.timeSpent || "—"} min
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Time</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cognitive Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bloom's Radar */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Cognitive Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square max-w-[300px] mx-auto">
                  <BloomsRadarChart breakdown={result.bloomsBreakdown} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bloom's Breakdown */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-blue-500" />
                  Performance by Level
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(Object.keys(result.bloomsBreakdown) as BloomsLevel[]).map((level) => {
                  const data = result.bloomsBreakdown[level];
                  const colors = BLOOMS_COLORS[level];

                  if (data.questionsCount === 0) return null;

                  return (
                    <div key={level} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", colors.bg, colors.text)}>
                            {BLOOMS_LABELS[level]}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {data.correctCount}/{data.questionsCount}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {data.scorePercentage}%
                        </span>
                      </div>
                      <Progress
                        value={data.scorePercentage}
                        className="h-2"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Learning Path */}
        {result.learningPath.length > 0 && (
          <motion.div variants={itemVariants} className="mb-8">
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Your Learning Path
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.learningPath.map((recommendation, index) => (
                    <LearningPathCard key={index} recommendation={recommendation} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Question Results */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Question Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedAnswers.map((answer, index) => (
                <QuestionCard
                  key={answer.id}
                  answer={answer}
                  index={result.answers.findIndex((a) => a.id === answer.id)}
                  isExpanded={expandedQuestions.has(answer.id)}
                  onToggle={() => toggleQuestion(answer.id)}
                  onAskSAM={handleAskSAM}
                />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
