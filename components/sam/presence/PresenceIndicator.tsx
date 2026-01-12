'use client';

/**
 * PresenceIndicator
 *
 * Shows user's current presence status with visual indicator.
 * Can be used in headers, profiles, and user lists.
 *
 * Features:
 * - Status dot indicator
 * - Tooltip with status details
 * - Multiple display sizes
 * - Manual status override
 */

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Circle,
  Clock,
  Moon,
  BookOpen,
  Coffee,
  BellOff,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { PresenceStatus } from '@sam-ai/agentic';

// ============================================================================
// TYPES
// ============================================================================

interface PresenceIndicatorProps {
  /** Current status */
  status?: PresenceStatus;
  /** Size of indicator */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Show text label */
  showLabel?: boolean;
  /** Enable dropdown to change status */
  allowChange?: boolean;
  /** Callback when status changes */
  onStatusChange?: (status: PresenceStatus) => void;
  /** Additional class name */
  className?: string;
  /** Show as badge style */
  asBadge?: boolean;
  /** Last activity timestamp */
  lastActivityAt?: Date | null;
  /** Custom label */
  label?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<
  PresenceStatus,
  {
    icon: typeof Circle;
    label: string;
    color: string;
    bgColor: string;
    dotColor: string;
    description: string;
  }
> = {
  online: {
    icon: Circle,
    label: 'Online',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    dotColor: 'bg-green-500',
    description: 'Active and available',
  },
  idle: {
    icon: Clock,
    label: 'Idle',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    dotColor: 'bg-amber-500',
    description: 'Away from keyboard',
  },
  away: {
    icon: Moon,
    label: 'Away',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900',
    dotColor: 'bg-gray-400',
    description: 'Currently away',
  },
  studying: {
    icon: BookOpen,
    label: 'Studying',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    dotColor: 'bg-blue-500',
    description: 'Focused on learning',
  },
  on_break: {
    icon: Coffee,
    label: 'On Break',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    dotColor: 'bg-orange-500',
    description: 'Taking a break',
  },
  do_not_disturb: {
    icon: BellOff,
    label: 'Do Not Disturb',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    dotColor: 'bg-red-500',
    description: 'Notifications muted',
  },
  offline: {
    icon: WifiOff,
    label: 'Offline',
    color: 'text-gray-400 dark:text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-900',
    dotColor: 'bg-gray-400',
    description: 'Not connected',
  },
};

const SIZE_CONFIG = {
  xs: { dot: 'h-2 w-2', text: 'text-xs', icon: 'h-3 w-3' },
  sm: { dot: 'h-2.5 w-2.5', text: 'text-sm', icon: 'h-3.5 w-3.5' },
  md: { dot: 'h-3 w-3', text: 'text-sm', icon: 'h-4 w-4' },
  lg: { dot: 'h-4 w-4', text: 'text-base', icon: 'h-5 w-5' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatLastActivity(date: Date | null): string {
  if (!date) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PresenceIndicator({
  status = 'online',
  size = 'sm',
  showLabel = false,
  allowChange = false,
  onStatusChange,
  className,
  asBadge = false,
  lastActivityAt,
  label: customLabel,
}: PresenceIndicatorProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  // Statuses that can be manually set
  const manualStatuses: PresenceStatus[] = [
    'online',
    'studying',
    'on_break',
    'do_not_disturb',
  ];

  // Status indicator content
  const indicator = useMemo(() => {
    if (asBadge) {
      return (
        <Badge
          variant="outline"
          className={cn(
            'gap-1.5',
            config.color,
            config.bgColor,
            sizeConfig.text
          )}
        >
          <span
            className={cn(
              'rounded-full',
              config.dotColor,
              sizeConfig.dot
            )}
          />
          {customLabel || config.label}
        </Badge>
      );
    }

    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span
          className={cn(
            'rounded-full ring-2 ring-white dark:ring-gray-900',
            config.dotColor,
            sizeConfig.dot
          )}
        />
        {showLabel && (
          <span className={cn(sizeConfig.text, config.color)}>
            {customLabel || config.label}
          </span>
        )}
      </div>
    );
  }, [asBadge, config, sizeConfig, showLabel, customLabel, className]);

  // Tooltip content
  const tooltipContent = (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Icon className={cn(sizeConfig.icon, config.color)} />
        <span className="font-medium">{config.label}</span>
      </div>
      <p className="text-xs text-gray-500">{config.description}</p>
      {lastActivityAt && (
        <p className="text-xs text-gray-400">
          Last active: {formatLastActivity(lastActivityAt)}
        </p>
      )}
    </div>
  );

  // If can change status, wrap in dropdown
  if (allowChange && onStatusChange) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="cursor-pointer hover:opacity-80 transition-opacity">
            {indicator}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {manualStatuses.map((s) => {
            const sConfig = STATUS_CONFIG[s];
            const SIcon = sConfig.icon;
            return (
              <DropdownMenuItem
                key={s}
                onClick={() => onStatusChange(s)}
                className={cn(
                  'gap-2',
                  status === s && 'bg-gray-100 dark:bg-gray-800'
                )}
              >
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    sConfig.dotColor
                  )}
                />
                <span className={sConfig.color}>{sConfig.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Otherwise, show tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('inline-flex', className)}>{indicator}</div>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default PresenceIndicator;
