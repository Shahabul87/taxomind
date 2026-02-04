'use client';

import { useState, useEffect } from 'react';
import { Brain, Search, Hammer, CheckCircle2, Cpu, Save, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GenerationProgress } from '@/hooks/use-skill-roadmap-journey';

interface RoadmapGeneratingViewProps {
  progress: GenerationProgress | null;
  error: string | null;
}

const STAGES = [
  { key: 'analyzing', label: 'Analyzing skill landscape', icon: Brain },
  { key: 'designing', label: 'AI designing learning phases', icon: Cpu },
  { key: 'parsing', label: 'Parsing roadmap structure', icon: FileJson },
  { key: 'matching', label: 'Matching platform courses', icon: Search },
  { key: 'building', label: 'Building your roadmap', icon: Hammer },
  { key: 'saving', label: 'Saving to your account', icon: Save },
  { key: 'complete', label: 'Roadmap ready!', icon: CheckCircle2 },
] as const;

const TIPS = [
  'Tip: You can change which AI provider builds your roadmaps in Settings > AI Providers.',
  'Tip: Each phase of your roadmap is matched against courses already on the platform.',
  'Tip: The AI analyzes skill dependencies to order phases optimally.',
  'Tip: Projects in each phase help you apply what you learn.',
  'Tip: You can adjust your weekly study hours after the roadmap is created.',
];

export function RoadmapGeneratingView({ progress, error }: RoadmapGeneratingViewProps) {
  const currentStageIdx = STAGES.findIndex(s => s.key === progress?.stage);
  const percent = progress?.percent ?? 0;
  const provider = progress?.provider;

  // Rotate tips while generating
  const [tipIndex, setTipIndex] = useState(0);
  const isGenerating = progress?.stage !== 'complete' && !error;

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-8">
      {/* Animated progress ring */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-200 dark:text-slate-700"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - percent / 100)}`}
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {percent}%
          </span>
        </div>
      </div>

      {/* Current stage message */}
      <div className="text-center space-y-1">
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
          {error ? error : (progress?.message ?? 'Preparing...')}
        </p>
        {provider && !error && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Provider: {provider.charAt(0).toUpperCase() + provider.slice(1)}
          </p>
        )}
      </div>

      {/* Stage progress list */}
      <div className="w-full max-w-sm space-y-3">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isComplete = idx < currentStageIdx || progress?.stage === 'complete';
          const isCurrent = idx === currentStageIdx && progress?.stage !== 'complete';

          return (
            <div
              key={stage.key}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-all duration-500',
                isComplete && 'bg-emerald-50 dark:bg-emerald-950/30',
                isCurrent && 'bg-violet-50 dark:bg-violet-950/30',
                !isComplete && !isCurrent && 'opacity-40'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg',
                isComplete && 'bg-emerald-100 dark:bg-emerald-900/50',
                isCurrent && 'bg-violet-100 dark:bg-violet-900/50 animate-pulse',
              )}>
                <Icon className={cn(
                  'h-4 w-4',
                  isComplete && 'text-emerald-600 dark:text-emerald-400',
                  isCurrent && 'text-violet-600 dark:text-violet-400',
                  !isComplete && !isCurrent && 'text-slate-400',
                )} />
              </div>
              <span className={cn(
                'text-sm font-medium',
                isComplete && 'text-emerald-700 dark:text-emerald-300',
                isCurrent && 'text-violet-700 dark:text-violet-300',
                !isComplete && !isCurrent && 'text-slate-500',
              )}>
                {stage.label}
              </span>
              {isComplete && (
                <CheckCircle2 className="h-4 w-4 ml-auto text-emerald-500" />
              )}
              {isCurrent && (
                <div className="ml-auto h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          );
        })}
      </div>

      {/* Animated tip */}
      {isGenerating && (
        <div className="w-full max-w-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center transition-opacity duration-500">
            {TIPS[tipIndex]}
          </p>
        </div>
      )}
    </div>
  );
}
