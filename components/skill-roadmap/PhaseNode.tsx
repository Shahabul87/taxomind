'use client';

import { cn } from '@/lib/utils';

interface PhaseNodeProps {
  order: number;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  /** Center X in SVG coordinate space */
  cx: number;
  /** Center Y in SVG coordinate space */
  cy: number;
}

// Node visual config by status
const STATUS_CONFIG: Record<string, { fill: string; stroke: string }> = {
  COMPLETED: { fill: '#10b981', stroke: '#059669' },
  IN_PROGRESS: { fill: '#8b5cf6', stroke: '#7c3aed' },
  AVAILABLE: { fill: '#3b82f6', stroke: '#2563eb' },
  LOCKED: { fill: '#94a3b8', stroke: '#64748b' },
  SKIPPED: { fill: '#94a3b8', stroke: '#64748b' },
};

/**
 * Individual milestone node rendered on the SVG timeline path.
 *
 * Status-based visuals:
 * - COMPLETED: green ring + checkmark
 * - IN_PROGRESS: animated violet glow + number
 * - AVAILABLE: blue pulse glow + number
 * - LOCKED: gray + lock icon
 * - SKIPPED: gray + number
 */
export function PhaseNode({ order, status, cx, cy }: PhaseNodeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.LOCKED;
  const isActive = status === 'IN_PROGRESS' || status === 'AVAILABLE';

  return (
    <g>
      {/* Outer glow for active states */}
      {isActive && (
        <circle cx={cx} cy={cy} r="14" fill={config.fill} opacity="0.2">
          <animate
            attributeName="r"
            values="14;18;14"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.2;0.05;0.2"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Main circle */}
      <circle
        cx={cx}
        cy={cy}
        r="10"
        fill={config.fill}
        stroke={config.stroke}
        strokeWidth="2"
      />

      {/* Inner icon / label */}
      {status === 'COMPLETED' && (
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="10"
        >
          &#x2713;
        </text>
      )}

      {status === 'LOCKED' && (
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="8"
        >
          &#x1F512;
        </text>
      )}

      {status !== 'COMPLETED' && status !== 'LOCKED' && (
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="10"
          fontWeight="bold"
        >
          {order}
        </text>
      )}
    </g>
  );
}
