'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RadarChartProps {
  distribution: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  size?: number;
  className?: string;
  showLabels?: boolean;
  animated?: boolean;
}

const LEVELS = [
  { key: 'remember', label: 'Remember', color: '#8B5CF6', angle: -90 },
  { key: 'understand', label: 'Understand', color: '#06B6D4', angle: -30 },
  { key: 'apply', label: 'Apply', color: '#10B981', angle: 30 },
  { key: 'analyze', label: 'Analyze', color: '#F59E0B', angle: 90 },
  { key: 'evaluate', label: 'Evaluate', color: '#EF4444', angle: 150 },
  { key: 'create', label: 'Create', color: '#EC4899', angle: 210 },
] as const;

export function CognitiveRadarChart({
  distribution,
  size = 300,
  className,
  showLabels = true,
  animated = true,
}: RadarChartProps) {
  const center = size / 2;
  const maxRadius = (size / 2) - 40; // Leave room for labels

  // Calculate polygon points based on distribution
  const polygonPoints = useMemo(() => {
    return LEVELS.map((level) => {
      const value = distribution[level.key as keyof typeof distribution] || 0;
      const normalizedValue = Math.min(100, Math.max(0, value)) / 100;
      const radius = normalizedValue * maxRadius;
      const angleRad = (level.angle * Math.PI) / 180;
      const x = center + radius * Math.cos(angleRad);
      const y = center + radius * Math.sin(angleRad);
      return { x, y, value, ...level };
    });
  }, [distribution, center, maxRadius]);

  // Create SVG path from points
  const pathData = useMemo(() => {
    if (polygonPoints.length === 0) return '';
    const firstPoint = polygonPoints[0];
    let path = `M ${firstPoint.x} ${firstPoint.y}`;
    for (let i = 1; i < polygonPoints.length; i++) {
      path += ` L ${polygonPoints[i].x} ${polygonPoints[i].y}`;
    }
    path += ' Z';
    return path;
  }, [polygonPoints]);

  // Generate concentric circles for reference
  const circles = [0.25, 0.5, 0.75, 1].map((factor) => ({
    radius: maxRadius * factor,
    label: `${Math.round(factor * 100)}%`,
  }));

  // Generate axis lines
  const axisLines = LEVELS.map((level) => {
    const angleRad = (level.angle * Math.PI) / 180;
    return {
      x1: center,
      y1: center,
      x2: center + maxRadius * Math.cos(angleRad),
      y2: center + maxRadius * Math.sin(angleRad),
      ...level,
    };
  });

  return (
    <div className={cn('relative', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background gradient */}
        <defs>
          <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgb(139 92 246 / 0.05)" />
            <stop offset="100%" stopColor="rgb(139 92 246 / 0)" />
          </radialGradient>
          <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(139 92 246 / 0.6)" />
            <stop offset="50%" stopColor="rgb(6 182 212 / 0.6)" />
            <stop offset="100%" stopColor="rgb(16 185 129 / 0.6)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={maxRadius}
          fill="url(#radarBg)"
          className="dark:opacity-50"
        />

        {/* Concentric reference circles */}
        {circles.map((circle, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={circle.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-slate-200 dark:text-slate-700"
            strokeDasharray="4 4"
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((axis) => (
          <line
            key={axis.key}
            x1={axis.x1}
            y1={axis.y1}
            x2={axis.x2}
            y2={axis.y2}
            stroke="currentColor"
            strokeWidth="1"
            className="text-slate-300 dark:text-slate-600"
          />
        ))}

        {/* Data polygon */}
        <motion.path
          d={pathData}
          fill="url(#radarFill)"
          stroke="rgb(139 92 246)"
          strokeWidth="2"
          filter="url(#glow)"
          initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />

        {/* Data points */}
        {polygonPoints.map((point, i) => (
          <motion.g key={point.key}>
            <motion.circle
              cx={point.x}
              cy={point.y}
              r={6}
              fill={point.color}
              stroke="white"
              strokeWidth="2"
              filter="url(#glow)"
              initial={animated ? { opacity: 0, scale: 0 } : undefined}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            />
            {/* Value tooltip on hover would go here */}
          </motion.g>
        ))}

        {/* Labels */}
        {showLabels && axisLines.map((axis) => {
          const labelRadius = maxRadius + 25;
          const angleRad = (axis.angle * Math.PI) / 180;
          const x = center + labelRadius * Math.cos(angleRad);
          const y = center + labelRadius * Math.sin(angleRad);
          const value = distribution[axis.key as keyof typeof distribution] || 0;

          return (
            <g key={`label-${axis.key}`}>
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-600 dark:fill-slate-300 text-xs font-medium"
              >
                {axis.label}
              </text>
              <text
                x={x}
                y={y + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-400 dark:fill-slate-500 text-[10px]"
              >
                {Math.round(value)}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
