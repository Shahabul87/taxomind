'use client';

/**
 * SAM AI Intervention System Demo
 * Admin dashboard page following existing design patterns
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Target,
  Trophy,
  Coffee,
  BookOpen,
  Flame,
  Bell,
  MessageSquare,
  ChevronRight,
  Play,
  Eye,
  Layers,
  Settings2,
  Moon,
  Sun,
  Pause,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InterventionProvider, useInterventionContext } from '@/components/sam/interventions';
import { InterventionInline } from '@/components/sam/interventions/InterventionInline';
import type {
  InterventionPayload,
  InterventionSurface,
  InterventionType,
} from '@/components/sam/interventions/types';
import { cn } from '@/lib/utils';

// ============================================================================
// SAMPLE INTERVENTIONS
// ============================================================================

const sampleInterventions: Record<
  string,
  { payload: InterventionPayload; description: string }
> = {
  celebration: {
    payload: {
      type: 'celebration',
      title: 'Achievement Unlocked! 🎉',
      message:
        'Congratulations! You&apos;ve completed the Advanced JavaScript module with flying colors. Your dedication to learning is inspiring!',
      surface: 'modal',
      theme: 'celebration',
      actions: [
        { id: 'share', label: 'Share Achievement', variant: 'primary' },
        { id: 'continue', label: 'Continue Learning', variant: 'secondary' },
      ],
      metadata: {
        celebrationType: 'module_completion',
        progress: 100,
      },
    },
    description: 'Modal celebration for major achievements',
  },
  goal_progress: {
    payload: {
      type: 'goal_progress',
      title: 'Goal Progress Update',
      message:
        'You&apos;re 75% through your weekly learning goal. Just 2 more lessons to go!',
      surface: 'toast',
      theme: 'success',
      actions: [{ id: 'view', label: 'View Goal', variant: 'primary' }],
      metadata: {
        progress: 75,
        goalId: 'weekly-goal-1',
      },
    },
    description: 'Toast notification for goal tracking',
  },
  nudge: {
    payload: {
      type: 'nudge',
      title: 'Time to Learn! 💡',
      message:
        'You haven&apos;t visited in 2 days. Ready to pick up where you left off?',
      surface: 'banner',
      theme: 'info',
      actions: [
        { id: 'resume', label: 'Resume Learning', variant: 'primary' },
        { id: 'later', label: 'Remind Later', variant: 'ghost' },
      ],
      metadata: {
        nudgeType: 'return_engagement',
      },
    },
    description: 'Banner nudge for re-engagement',
  },
  streak_alert: {
    payload: {
      type: 'streak_alert',
      title: 'Streak in Danger! 🔥',
      message:
        'Your 12-day learning streak is at risk. Complete a lesson today to keep it alive!',
      surface: 'toast',
      theme: 'warning',
      actions: [{ id: 'save', label: 'Save My Streak', variant: 'primary' }],
      metadata: {
        streakDays: 12,
      },
    },
    description: 'Urgent streak warning toast',
  },
  break_suggestion: {
    payload: {
      type: 'break_suggestion',
      title: 'Time for a Break ☕',
      message:
        'You&apos;ve been studying for 45 minutes. A short break can help consolidate your learning.',
      surface: 'toast',
      theme: 'info',
      actions: [
        { id: 'break', label: 'Take a Break', variant: 'primary' },
        { id: 'continue', label: 'Keep Going', variant: 'ghost' },
      ],
    },
    description: 'Wellness-focused break reminder',
  },
  recommendation: {
    payload: {
      type: 'recommendation',
      title: 'Recommended for You ✨',
      message:
        'Based on your progress, we think you&apos;d excel at "Advanced React Patterns". Ready to level up?',
      surface: 'inline',
      theme: 'default',
      actions: [
        { id: 'enroll', label: 'Start Course', variant: 'primary' },
        { id: 'preview', label: 'Preview', variant: 'secondary' },
      ],
      metadata: {
        courseId: 'react-patterns-101',
      },
    },
    description: 'Personalized course recommendation',
  },
  step_completed: {
    payload: {
      type: 'step_completed',
      title: 'Step Completed! ✅',
      message:
        'Great job finishing "Introduction to Variables". You&apos;re making excellent progress!',
      surface: 'toast',
      theme: 'success',
      actions: [{ id: 'next', label: 'Next Step', variant: 'primary' }],
      metadata: {
        progress: 33,
        stepId: 'step-1',
      },
    },
    description: 'Step completion confirmation',
  },
  checkin: {
    payload: {
      type: 'checkin',
      title: 'How&apos;s it going? 👋',
      message:
        'We noticed you&apos;ve been on this quiz for a while. Need any help or want some hints?',
      surface: 'modal',
      theme: 'default',
      requireInteraction: true,
      actions: [
        { id: 'hint', label: 'Give me a Hint', variant: 'primary' },
        { id: 'ok', label: 'I&apos;m Good!', variant: 'secondary' },
      ],
    },
    description: 'Supportive check-in modal',
  },
};

// ============================================================================
// INTERVENTION TYPE CARD
// ============================================================================

interface InterventionTypeCardProps {
  type: string;
  payload: InterventionPayload;
  description: string;
  onTrigger: () => void;
  isActive: boolean;
}

function InterventionTypeCard({
  type,
  payload,
  description,
  onTrigger,
  isActive,
}: InterventionTypeCardProps) {
  const typeIcons: Record<InterventionType, React.ReactNode> = {
    nudge: <Zap className="w-5 h-5" />,
    celebration: <Trophy className="w-5 h-5" />,
    recommendation: <BookOpen className="w-5 h-5" />,
    goal_progress: <Target className="w-5 h-5" />,
    step_completed: <Sparkles className="w-5 h-5" />,
    checkin: <MessageSquare className="w-5 h-5" />,
    intervention: <Bell className="w-5 h-5" />,
    streak_alert: <Flame className="w-5 h-5" />,
    break_suggestion: <Coffee className="w-5 h-5" />,
  };

  const surfaceGradients: Record<InterventionSurface, string> = {
    banner: 'from-cyan-500 to-blue-500',
    toast: 'from-emerald-500 to-teal-500',
    modal: 'from-fuchsia-500 to-pink-500',
    inline: 'from-amber-500 to-orange-500',
  };

  const surfaceLabels: Record<InterventionSurface, string> = {
    banner: 'Banner',
    toast: 'Toast',
    modal: 'Modal',
    inline: 'Inline',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'group relative overflow-hidden border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300',
          'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm',
          isActive && 'ring-2 ring-blue-500/50'
        )}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  'bg-gradient-to-br',
                  surfaceGradients[payload.surface || 'toast'],
                  'text-white shadow-md'
                )}
              >
                {typeIcons[payload.type]}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                  {type.replace('_', ' ')}
                </h3>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mt-1',
                    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  )}
                >
                  <Layers className="w-3 h-3" />
                  {surfaceLabels[payload.surface || 'toast']}
                </span>
              </div>
            </div>

            <Button
              size="sm"
              onClick={onTrigger}
              className={cn(
                'bg-gradient-to-r',
                surfaceGradients[payload.surface || 'toast'],
                'text-white shadow-md hover:shadow-lg transition-all'
              )}
            >
              <Play className="w-3 h-3 mr-1" />
              Trigger
            </Button>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            {description}
          </p>

          {/* Preview */}
          <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 mb-1">
              <Eye className="w-3 h-3" />
              PREVIEW
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1">
              {payload.title}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// INLINE PREVIEW SECTION
// ============================================================================

function InlinePreviewSection() {
  const [inlineIntervention, setInlineIntervention] = useState<{
    id: string;
    intervention: InterventionPayload;
  } | null>(null);

  const triggerInlineDemo = () => {
    const intervention = sampleInterventions.recommendation.payload;
    const id = `inline-demo-${Date.now()}`;
    setInlineIntervention({ id, intervention });
  };

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
            <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold">Inline Interventions</span>
              <p className="text-sm font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                In-content nudges and contextual recommendations
              </p>
            </div>
          </CardTitle>
          <Button
            onClick={triggerInlineDemo}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Show Inline Demo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Inline preview area */}
        <div
          className={cn(
            'rounded-xl p-6 min-h-[180px]',
            'bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30',
            'border border-slate-200/50 dark:border-slate-700/50',
            'flex items-center justify-center'
          )}
        >
          <AnimatePresence mode="wait">
            {inlineIntervention ? (
              <InterventionInline
                key={inlineIntervention.id}
                intervention={{
                  ...inlineIntervention.intervention,
                  id: inlineIntervention.id,
                  eventId: inlineIntervention.id,
                  timestamp: new Date(),
                  viewed: false,
                  dismissed: false,
                }}
                variant="card"
                onDismiss={() => setInlineIntervention(null)}
                onView={() => {}}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-200/50 dark:bg-slate-700/50 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Click &quot;Show Inline Demo&quot; to preview
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DEMO CONTROLS
// ============================================================================

function DemoControls() {
  const { dismissAll, interventions, isPaused, pauseInterventions, resumeInterventions } =
    useInterventionContext();
  const activeCount = interventions.filter((i) => !i.dismissed).length;

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  isPaused
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-emerald-500 to-green-500'
                )}
              >
                {isPaused ? (
                  <Moon className="w-4 h-4 text-white" />
                ) : (
                  <Sun className="w-4 h-4 text-white" />
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {isPaused ? 'Paused' : 'Active'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={isPaused ? resumeInterventions : pauseInterventions}
              className="flex-1 sm:flex-initial"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={dismissAll}
              disabled={activeCount === 0}
              className="flex-1 sm:flex-initial text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950"
            >
              <X className="w-4 h-4 mr-2" />
              Dismiss All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN DEMO CONTENT
// ============================================================================

function DemoContent() {
  const { showIntervention } = useInterventionContext();
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const handleTrigger = (type: string, payload: InterventionPayload) => {
    setActiveType(type);
    showIntervention(payload);
    setTimeout(() => setActiveType(null), 500);
  };

  const filterBySurface = (surface: InterventionSurface | 'all') => {
    if (surface === 'all') {
      return Object.entries(sampleInterventions);
    }
    return Object.entries(sampleInterventions).filter(
      ([_, item]) => item.payload.surface === surface
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <motion.div
          className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  SAM Interventions
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Proactive engagement system demo
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              // Trigger a sequence of interventions
              Object.entries(sampleInterventions)
                .filter(([_, item]) => item.payload.surface !== 'inline')
                .slice(0, 3)
                .forEach(([_, { payload }], i) => {
                  setTimeout(() => showIntervention(payload), i * 1000);
                });
            }}
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-md w-full sm:w-auto"
          >
            <Zap className="w-4 h-4 mr-2" />
            Demo Sequence
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <DemoControls />
        </motion.div>

        {/* Intervention Grid with Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
              <TabsList className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm inline-flex min-w-full sm:min-w-0">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 text-xs sm:text-sm px-3 sm:px-4 py-2 flex-1 sm:flex-initial"
                >
                  All Types
                </TabsTrigger>
                <TabsTrigger
                  value="toast"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 text-xs sm:text-sm px-3 sm:px-4 py-2 flex-1 sm:flex-initial"
                >
                  Toast
                </TabsTrigger>
                <TabsTrigger
                  value="banner"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 text-xs sm:text-sm px-3 sm:px-4 py-2 flex-1 sm:flex-initial"
                >
                  Banner
                </TabsTrigger>
                <TabsTrigger
                  value="modal"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 text-xs sm:text-sm px-3 sm:px-4 py-2 flex-1 sm:flex-initial"
                >
                  Modal
                </TabsTrigger>
              </TabsList>
            </div>

            {['all', 'toast', 'banner', 'modal'].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filterBySurface(tab as InterventionSurface | 'all')
                    .filter(([_, item]) => item.payload.surface !== 'inline')
                    .map(([type, { payload, description }], index) => (
                      <motion.div
                        key={type}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * index }}
                      >
                        <InterventionTypeCard
                          type={type}
                          payload={payload}
                          description={description}
                          onTrigger={() => handleTrigger(type, payload)}
                          isActive={activeType === type}
                        />
                      </motion.div>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>

        {/* Inline Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <InlinePreviewSection />
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE EXPORT
// ============================================================================

export default function InterventionsDemoPage() {
  return (
    <InterventionProvider
      maxVisible={5}
      defaultAutoDismiss={true}
      defaultAutoDismissDelay={10000}
      soundEnabled={false}
      hapticEnabled={false}
    >
      <DemoContent />
    </InterventionProvider>
  );
}
