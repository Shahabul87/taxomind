"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface ConfidenceIndicatorProps {
  confidence: number; // 0-1 (will be converted to 0-100%)
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceIndicator({
  confidence,
  size = 'md',
  showLabel = true,
  className
}: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100);

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-16 h-16',
      strokeWidth: 4,
      fontSize: 'text-xs',
      radius: 28
    },
    md: {
      container: 'w-24 h-24',
      strokeWidth: 6,
      fontSize: 'text-sm',
      radius: 42
    },
    lg: {
      container: 'w-32 h-32',
      strokeWidth: 8,
      fontSize: 'text-base',
      radius: 56
    }
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on confidence level
  const getConfidenceColor = () => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getGradientColor = () => {
    if (percentage >= 80) return { from: '#10b981', to: '#059669' }; // emerald
    if (percentage >= 60) return { from: '#3b82f6', to: '#2563eb' }; // blue
    if (percentage >= 40) return { from: '#f59e0b', to: '#d97706' }; // amber
    return { from: '#ef4444', to: '#dc2626' }; // red
  };

  const gradientColors = getGradientColor();
  const gradientId = `confidence-gradient-${percentage}`;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <div className={cn('relative', config.container)}>
        {/* SVG Circle Progress */}
        <svg
          className="transform -rotate-90"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          {/* Gradient Definition */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientColors.from} />
              <stop offset="100%" stopColor={gradientColors.to} />
            </linearGradient>
          </defs>

          {/* Background Circle */}
          <circle
            cx="50"
            cy="50"
            r={config.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-slate-200 dark:text-slate-700"
          />

          {/* Progress Circle */}
          <circle
            cx="50"
            cy="50"
            r={config.radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.1))'
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'font-bold tabular-nums',
              config.fontSize,
              getConfidenceColor()
            )}
            aria-label={`Confidence: ${percentage}%`}
          >
            {percentage}%
          </span>
          {showLabel && size !== 'sm' && (
            <span className="text-[0.65rem] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Confidence
            </span>
          )}
        </div>
      </div>

      {/* Pulsing Ring for High Confidence */}
      {percentage >= 80 && (
        <div
          className={cn(
            'absolute inset-0 rounded-full animate-ping opacity-20',
            config.container
          )}
          style={{
            background: `radial-gradient(circle, ${gradientColors.from} 0%, transparent 70%)`
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// Compact version for inline display
export function CompactConfidenceIndicator({
  confidence,
  className
}: {
  confidence: number;
  className?: string;
}) {
  const percentage = Math.round(confidence * 100);

  const getColorClass = () => {
    if (percentage >= 80) return 'bg-emerald-500 text-emerald-50';
    if (percentage >= 60) return 'bg-blue-500 text-blue-50';
    if (percentage >= 40) return 'bg-amber-500 text-amber-50';
    return 'bg-rose-500 text-rose-50';
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold',
        getColorClass(),
        className
      )}
      role="status"
      aria-label={`Confidence: ${percentage}%`}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {percentage}%
    </div>
  );
}
