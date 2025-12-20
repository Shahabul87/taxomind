"use client";

import React from 'react';
// Re-export the redesigned component
export { SamAssistantPanelRedesigned as SamAssistantPanel } from './sam-assistant-panel-redesigned';

// Keep old exports for backward compatibility
export { ConfidenceIndicator, CompactConfidenceIndicator } from './ConfidenceIndicator';
export { SuggestionHistory, CompactSuggestionHistory } from './SuggestionHistory';
export { SAMBottomSheet, SAMBottomSheetTrigger } from './SAMBottomSheet';

// Legacy component (kept for reference, not exported)
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SamSuggestion } from '../../types/sam-creator.types';
import { SamLoadingState } from '@/components/sam/sam-loading-state';
import { Bot, MessageCircle, ThumbsUp, AlertTriangle, Info, Lightbulb, Zap, Sparkles, RefreshCw, ChevronRight, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SamAssistantPanelProps {
  suggestion: SamSuggestion | null;
  isLoading: boolean;
  onRefresh: () => void;
  onApplySuggestion?: () => void;
  className?: string;
}

const getSuggestionIcon = (type: SamSuggestion['type']) => {
  switch (type) {
    case 'encouragement': return Heart;
    case 'warning': return AlertTriangle;
    case 'tip': return Lightbulb;
    case 'validation': return ThumbsUp;
    default: return MessageCircle;
  }
};

const getSuggestionColors = (type: SamSuggestion['type']) => {
  switch (type) {
    case 'encouragement': 
      return {
        bg: 'from-pink-50/90 via-rose-50/70 to-red-50/80 dark:from-pink-900/25 dark:via-rose-900/20 dark:to-red-900/25',
        border: 'border-pink-200/60 dark:border-pink-700/40',
        icon: 'text-pink-600 dark:text-pink-400',
        accent: 'bg-pink-500'
      };
    case 'warning':
      return {
        bg: 'from-amber-50/90 via-yellow-50/70 to-orange-50/80 dark:from-amber-900/25 dark:via-yellow-900/20 dark:to-orange-900/25',
        border: 'border-amber-200/60 dark:border-amber-700/40',
        icon: 'text-amber-600 dark:text-amber-400',
        accent: 'bg-amber-500'
      };
    case 'tip':
      return {
        bg: 'from-blue-50/90 via-cyan-50/70 to-indigo-50/80 dark:from-blue-900/25 dark:via-cyan-900/20 dark:to-indigo-900/25',
        border: 'border-blue-200/60 dark:border-blue-700/40',
        icon: 'text-blue-600 dark:text-blue-400',
        accent: 'bg-blue-500'
      };
    case 'validation':
      return {
        bg: 'from-emerald-50/90 via-green-50/70 to-teal-50/80 dark:from-emerald-900/25 dark:via-green-900/20 dark:to-teal-900/25',
        border: 'border-emerald-200/60 dark:border-emerald-700/40',
        icon: 'text-emerald-600 dark:text-emerald-400',
        accent: 'bg-emerald-500'
      };
    default:
      return {
        bg: 'from-slate-50/90 via-gray-50/70 to-zinc-50/80 dark:from-slate-900/25 dark:via-gray-900/20 dark:to-zinc-900/25',
        border: 'border-slate-200/60 dark:border-slate-700/40',
        icon: 'text-slate-600 dark:text-slate-400',
        accent: 'bg-slate-500'
      };
  }
};

// Legacy component - not exported (use SamAssistantPanelRedesigned instead)
function LegacySamAssistantPanel({ 
  suggestion, 
  isLoading, 
  onRefresh, 
  onApplySuggestion,
  className 
}: SamAssistantPanelProps) {
  if (isLoading) {
    return (
      <Card className={cn(
        "p-5 bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/70 dark:from-indigo-900/30 dark:via-purple-900/25 dark:to-pink-900/30 border-indigo-200/60 dark:border-indigo-700/40 shadow-lg backdrop-blur-sm",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
              <Sparkles className="h-2.5 w-2.5 text-white animate-spin" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Sam is thinking...
              </h4>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Analyzing your course content...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!suggestion) {
    return (
      <Card className={cn(
        "p-5 bg-gradient-to-br from-slate-50/80 via-indigo-50/40 to-purple-50/60 dark:from-slate-900/30 dark:via-indigo-900/20 dark:to-purple-900/25 border-slate-200/60 dark:border-slate-700/40 shadow-md backdrop-blur-sm",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-slate-400 to-gray-500 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-base bg-gradient-to-r from-slate-700 to-gray-700 dark:from-slate-300 dark:to-gray-300 bg-clip-text text-transparent">
                Sam AI Assistant
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Ready to help with your course creation
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-8 w-8 p-0 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 border border-indigo-200/50 dark:border-indigo-700/30 text-indigo-600 dark:text-indigo-400 hover:from-indigo-200 hover:to-purple-200 dark:hover:from-indigo-900/60 dark:hover:to-purple-900/60 transition-all duration-200"
          >
            <Zap className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/30">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="h-3 w-3" />
            <span>Click the ⚡ button to get personalized suggestions</span>
          </div>
        </div>
      </Card>
    );
  }

  const Icon = getSuggestionIcon(suggestion.type);
  const colors = getSuggestionColors(suggestion.type);

  return (
    <Card className={cn(
      `relative p-5 bg-gradient-to-br ${colors.bg} ${colors.border} shadow-lg backdrop-blur-sm overflow-hidden`,
      "transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-xl",
      className
    )}>
      {/* Background accent */}
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full",
        colors.accent
      )} />
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10" />
      </div>
      
      <div className="relative flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <div className={cn(
            "w-12 h-12 rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-700/60 flex items-center justify-center shadow-lg",
            colors.border
          )}>
            <Icon className={cn("h-5 w-5", colors.icon)} />
          </div>
          
          {/* Confidence indicator */}
          <div className={cn(
            "absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md",
            colors.accent
          )}>
            {Math.round(suggestion.confidence * 100)}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-bold text-base capitalize">
                  {suggestion.type === 'encouragement' ? '💝 Amazing progress!' : 
                   suggestion.type === 'warning' ? '⚠️ Quick heads up' :
                   suggestion.type === 'tip' ? '💡 Pro tip for you' :
                   suggestion.type === 'validation' ? '✅ Looks great!' : '🤖 Sam suggests'}
                </h4>
              </div>
              
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {suggestion.message}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className={cn(
                "h-8 w-8 p-0 rounded-full border transition-all duration-200 flex-shrink-0",
                "bg-white/60 dark:bg-slate-800/60 border-white/40 dark:border-slate-700/40",
                "hover:bg-white/80 dark:hover:bg-slate-800/80 hover:scale-105",
                colors.icon
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {suggestion.actionable && suggestion.action && (
            <div className="mt-4 pt-3 border-t border-white/30 dark:border-slate-700/40">
              <Button
                size="sm"
                onClick={suggestion.action || onApplySuggestion}
                className={cn(
                  "w-full justify-between font-medium transition-all duration-200",
                  "bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300",
                  "hover:bg-white/90 dark:hover:bg-slate-800/90 hover:scale-[1.02]",
                  "border border-white/50 dark:border-slate-700/50 shadow-md"
                )}
              >
                <span>Apply this suggestion</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}