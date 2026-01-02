"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Clock,
  Flame,
  RotateCcw,
  ChevronRight,
  Sparkles,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
  Zap,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ReviewEntry {
  id: string;
  topic: string;
  concept: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  masteryLevel: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
  courseId?: string;
  courseTitle?: string;
  nextReviewDate: string;
  lastReviewDate?: string;
}

interface ReviewQueueStats {
  totalItems: number;
  averageMastery: number;
  averageEaseFactor: number;
}

interface ReviewQueueDashboardProps {
  courseId?: string;
}

const QUALITY_RATINGS = [
  { value: 0, label: 'Complete Blackout', emoji: '😵', color: 'bg-red-500' },
  { value: 1, label: 'Wrong Answer', emoji: '😟', color: 'bg-red-400' },
  { value: 2, label: 'With Difficulty', emoji: '😐', color: 'bg-orange-400' },
  { value: 3, label: 'Correct with Effort', emoji: '🙂', color: 'bg-yellow-400' },
  { value: 4, label: 'Correct Easily', emoji: '😊', color: 'bg-green-400' },
  { value: 5, label: 'Perfect Recall', emoji: '🤩', color: 'bg-green-500' },
];

const PRIORITY_COLORS = {
  LOW: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  MEDIUM: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  CRITICAL: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export function ReviewQueueDashboard({ courseId }: ReviewQueueDashboardProps) {
  const [dueItems, setDueItems] = useState<ReviewEntry[]>([]);
  const [stats, setStats] = useState<ReviewQueueStats | null>(null);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [startTime, setStartTime] = useState<number | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId);
      params.append('limit', '20');

      const response = await fetch(`/api/sam/mentor/review-queue?${params}`);
      const data = await response.json();

      if (data.success) {
        setDueItems(data.data.dueNow || []);
        setStats(data.data.stats);
        setUpcomingCount(data.data.upcomingCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch review queue:', error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const startReview = () => {
    setIsReviewing(true);
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStats({ reviewed: 0, correct: 0 });
    setStartTime(Date.now());
  };

  const handleRating = async (quality: number) => {
    const currentItem = dueItems[currentIndex];
    if (!currentItem) return;

    const responseTime = startTime ? Date.now() - startTime : 0;

    try {
      await fetch('/api/sam/mentor/review-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId: currentItem.id,
          quality,
          responseTimeMs: responseTime,
        }),
      });

      setSessionStats(prev => ({
        reviewed: prev.reviewed + 1,
        correct: quality >= 3 ? prev.correct + 1 : prev.correct,
      }));

      // Move to next item
      if (currentIndex < dueItems.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
        setStartTime(Date.now());
      } else {
        // Session complete
        setIsReviewing(false);
        toast.success(`Review session complete! ${sessionStats.reviewed + 1} items reviewed.`);
        fetchQueue(); // Refresh queue
      }
    } catch (error) {
      toast.error('Failed to record review');
    }
  };

  const currentItem = dueItems[currentIndex];

  if (isLoading) {
    return (
      <Card className="border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <CardContent className="flex items-center justify-center py-20">
          <div className="animate-pulse text-slate-400">Loading review queue...</div>
        </CardContent>
      </Card>
    );
  }

  // Review Mode
  if (isReviewing && currentItem) {
    return (
      <div className="space-y-6">
        {/* Progress Header */}
        <Card className="border-0 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                  {currentIndex + 1} / {dueItems.length}
                </Badge>
                <div className="text-sm text-slate-300">
                  <span className="text-green-400">{sessionStats.correct}</span> correct
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReviewing(false)}
                className="text-slate-400 hover:text-white"
              >
                Exit Review
              </Button>
            </div>
            <Progress
              value={((currentIndex + 1) / dueItems.length) * 100}
              className="mt-3 h-1"
            />
          </CardContent>
        </Card>

        {/* Flashcard */}
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, rotateY: -90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden min-h-[400px]">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <CardTitle className="text-white">{currentItem.topic}</CardTitle>
                </div>
                <Badge className={cn("border", PRIORITY_COLORS[currentItem.priority])}>
                  {currentItem.priority}
                </Badge>
              </div>
              {currentItem.courseTitle && (
                <CardDescription className="text-slate-400">
                  {currentItem.courseTitle}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="py-12 px-8">
              <AnimatePresence mode="wait">
                {!showAnswer ? (
                  <motion.div
                    key="question"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <p className="text-xl text-white mb-8">{currentItem.concept}</p>
                    <Button
                      size="lg"
                      onClick={() => setShowAnswer(true)}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Show Answer
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="answer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div className="text-center">
                      <p className="text-sm text-slate-400 mb-2">Rate your recall</p>
                      <p className="text-lg text-white">{currentItem.concept}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {QUALITY_RATINGS.map((rating) => (
                        <button
                          key={rating.value}
                          onClick={() => handleRating(rating.value)}
                          className={cn(
                            "p-4 rounded-xl transition-all duration-200",
                            "border border-white/10 hover:border-white/30",
                            "bg-white/5 hover:bg-white/10",
                            "flex flex-col items-center gap-2"
                          )}
                        >
                          <span className="text-2xl">{rating.emoji}</span>
                          <span className="text-xs text-slate-400">{rating.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>

            {/* Mastery indicator */}
            <div className="px-6 pb-6">
              <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                <span>Current Mastery</span>
                <span>{Math.round(currentItem.masteryLevel * 100)}%</span>
              </div>
              <Progress value={currentItem.masteryLevel * 100} className="h-2" />
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Queue Overview Mode
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-300/70">Due Now</p>
                <p className="text-3xl font-bold text-white">{dueItems.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-900/30 to-orange-800/20 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-300/70">Coming Up</p>
                <p className="text-3xl font-bold text-white">{upcomingCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/20">
                <Calendar className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300/70">Avg Mastery</p>
                <p className="text-3xl font-bold text-white">
                  {stats ? Math.round(stats.averageMastery * 100) : 0}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/20">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300/70">Total Items</p>
                <p className="text-3xl font-bold text-white">{stats?.totalItems || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

        <CardHeader className="relative border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                <RotateCcw className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Review Queue</CardTitle>
                <CardDescription className="text-slate-400">
                  Spaced repetition for lasting knowledge
                </CardDescription>
              </div>
            </div>

            {dueItems.length > 0 && (
              <Button
                onClick={startReview}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Zap className="w-4 h-4 mr-2" />
                Start Review
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative p-6">
          {dueItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">All caught up!</h3>
              <p className="text-slate-400 max-w-sm mx-auto">
                No items due for review right now. Keep learning and new items will appear here.
              </p>
              {upcomingCount > 0 && (
                <p className="text-sm text-purple-400 mt-4">
                  {upcomingCount} items coming up in the next 24 hours
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {dueItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-4 rounded-xl transition-all duration-200",
                    "border border-white/10 hover:border-purple-500/30",
                    "bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white truncate">{item.topic}</h4>
                        <Badge className={cn("border text-xs", PRIORITY_COLORS[item.priority])}>
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-1">{item.concept}</p>
                      {item.courseTitle && (
                        <p className="text-xs text-slate-500 mt-1">{item.courseTitle}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-sm text-slate-400">
                        <Flame className={cn(
                          "w-4 h-4",
                          item.repetitions > 5 ? "text-orange-400" : "text-slate-500"
                        )} />
                        <span>{item.repetitions}x</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {Math.round(item.masteryLevel * 100)}% mastery
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Progress value={item.masteryLevel * 100} className="h-1" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
