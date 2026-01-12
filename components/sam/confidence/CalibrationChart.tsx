'use client';

/**
 * CalibrationChart
 *
 * Visualizes AI confidence calibration over time.
 * Shows how well AI confidence correlates with actual accuracy.
 *
 * Features:
 * - Calibration curve visualization
 * - Reliability diagram
 * - Accuracy vs confidence breakdown
 * - Historical trends
 * - Calibration score
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  BarChart3,
  LineChart,
  Info,
  Calendar,
  RefreshCw,
  Loader2,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface CalibrationChartProps {
  className?: string;
  /** Calibration data */
  data: CalibrationData;
  /** Time period */
  period?: 'day' | 'week' | 'month' | 'all';
  /** Callback when period changes */
  onPeriodChange?: (period: 'day' | 'week' | 'month' | 'all') => void;
  /** Callback for refresh */
  onRefresh?: () => Promise<void>;
  /** Show detailed breakdown */
  showBreakdown?: boolean;
  /** Loading state */
  isLoading?: boolean;
}

interface CalibrationData {
  /** Overall calibration score (0-1, closer to 1 is better) */
  calibrationScore: number;
  /** Trend compared to previous period */
  trend: 'improving' | 'stable' | 'declining';
  /** Trend percentage */
  trendPercentage: number;
  /** Confidence buckets with accuracy */
  buckets: CalibrationBucket[];
  /** Total samples */
  totalSamples: number;
  /** Historical data points */
  history?: HistoryPoint[];
  /** Last updated */
  lastUpdated: string;
}

interface CalibrationBucket {
  /** Confidence range label (e.g., "80-90%") */
  label: string;
  /** Lower bound of range (0-1) */
  rangeMin: number;
  /** Upper bound of range (0-1) */
  rangeMax: number;
  /** Predicted confidence (mean of bucket) */
  predictedConfidence: number;
  /** Actual accuracy observed */
  actualAccuracy: number;
  /** Number of samples in bucket */
  sampleCount: number;
}

interface HistoryPoint {
  date: string;
  calibrationScore: number;
  sampleCount: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CALIBRATION_THRESHOLDS = {
  excellent: 0.9,
  good: 0.8,
  fair: 0.7,
  poor: 0.6,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getCalibrationLabel(score: number): { label: string; color: string } {
  if (score >= CALIBRATION_THRESHOLDS.excellent) {
    return { label: 'Excellent', color: 'text-green-600' };
  }
  if (score >= CALIBRATION_THRESHOLDS.good) {
    return { label: 'Good', color: 'text-blue-600' };
  }
  if (score >= CALIBRATION_THRESHOLDS.fair) {
    return { label: 'Fair', color: 'text-amber-600' };
  }
  return { label: 'Needs Improvement', color: 'text-orange-600' };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function CalibrationBar({ bucket }: { bucket: CalibrationBucket }) {
  const difference = bucket.actualAccuracy - bucket.predictedConfidence;
  const absDifference = Math.abs(difference);
  const isOverconfident = difference < 0;
  const isUnderconfident = difference > 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{bucket.label}</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{bucket.sampleCount} samples</span>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              absDifference < 0.05
                ? 'text-green-600 bg-green-50'
                : isOverconfident
                ? 'text-amber-600 bg-amber-50'
                : 'text-blue-600 bg-blue-50'
            )}
          >
            {isOverconfident ? 'Over' : isUnderconfident ? 'Under' : 'Well'} calibrated
          </Badge>
        </div>
      </div>
      <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        {/* Perfect calibration line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
          style={{ left: `${bucket.predictedConfidence * 100}%` }}
        />
        {/* Predicted bar */}
        <motion.div
          className="absolute top-1 bottom-1 bg-blue-200 dark:bg-blue-800 rounded"
          initial={{ width: 0 }}
          animate={{ width: `${bucket.predictedConfidence * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {/* Actual bar */}
        <motion.div
          className={cn(
            'absolute top-1 bottom-1 rounded',
            bucket.actualAccuracy >= bucket.predictedConfidence
              ? 'bg-green-500'
              : 'bg-amber-500'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${bucket.actualAccuracy * 100}%` }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        />
        {/* Labels */}
        <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium">
          <span className="z-20 text-gray-700 dark:text-gray-300">
            Actual: {Math.round(bucket.actualAccuracy * 100)}%
          </span>
          <span className="z-20 text-gray-500">
            Expected: {Math.round(bucket.predictedConfidence * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function ReliabilityDiagram({ buckets }: { buckets: CalibrationBucket[] }) {
  const chartHeight = 200;
  const chartWidth = 300;
  const padding = 30;

  const points = buckets.map((bucket) => ({
    x: bucket.predictedConfidence,
    y: bucket.actualAccuracy,
    size: Math.sqrt(bucket.sampleCount) * 2,
  }));

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full max-w-[300px] mx-auto"
      >
        {/* Grid lines */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((v) => (
          <g key={v}>
            <line
              x1={padding}
              y1={chartHeight - padding - v * (chartHeight - 2 * padding)}
              x2={chartWidth - padding}
              y2={chartHeight - padding - v * (chartHeight - 2 * padding)}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeDasharray="4"
            />
            <line
              x1={padding + v * (chartWidth - 2 * padding)}
              y1={padding}
              x2={padding + v * (chartWidth - 2 * padding)}
              y2={chartHeight - padding}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeDasharray="4"
            />
          </g>
        ))}

        {/* Perfect calibration line */}
        <line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={padding}
          stroke="currentColor"
          strokeOpacity={0.3}
          strokeDasharray="6"
          strokeWidth={2}
        />

        {/* Data points */}
        {points.map((point, index) => (
          <motion.circle
            key={index}
            cx={padding + point.x * (chartWidth - 2 * padding)}
            cy={chartHeight - padding - point.y * (chartHeight - 2 * padding)}
            r={Math.min(point.size, 15)}
            fill="currentColor"
            className="text-blue-500"
            fillOpacity={0.6}
            initial={{ r: 0 }}
            animate={{ r: Math.min(point.size, 15) }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          />
        ))}

        {/* Axis labels */}
        <text
          x={chartWidth / 2}
          y={chartHeight - 5}
          textAnchor="middle"
          className="text-xs fill-gray-500"
        >
          Predicted Confidence
        </text>
        <text
          x={10}
          y={chartHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90, 10, ${chartHeight / 2})`}
          className="text-xs fill-gray-500"
        >
          Actual Accuracy
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-4 border-t-2 border-dashed border-gray-400" />
          <span>Perfect calibration</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500 opacity-60" />
          <span>Actual (size = samples)</span>
        </div>
      </div>
    </div>
  );
}

function TrendIndicator({ trend, percentage }: { trend: CalibrationData['trend']; percentage: number }) {
  const config = {
    improving: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    stable: { icon: Minus, color: 'text-gray-600', bg: 'bg-gray-50' },
    declining: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
  };

  const { icon: Icon, color, bg } = config[trend];

  return (
    <Badge variant="outline" className={cn('gap-1', color, bg)}>
      <Icon className="h-3 w-3" />
      {percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%
    </Badge>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CalibrationChart({
  className,
  data,
  period = 'week',
  onPeriodChange,
  onRefresh,
  showBreakdown = true,
  isLoading = false,
}: CalibrationChartProps) {
  const [activeTab, setActiveTab] = useState<'bars' | 'diagram'>('bars');

  const calibrationLabel = useMemo(
    () => getCalibrationLabel(data.calibrationScore),
    [data.calibrationScore]
  );

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-950/30">
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-base">Confidence Calibration</CardTitle>
              <CardDescription>
                How well AI confidence matches actual accuracy
              </CardDescription>
            </div>
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall score */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div>
            <div className="text-sm text-gray-500">Calibration Score</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {Math.round(data.calibrationScore * 100)}%
              </span>
              <span className={cn('text-sm font-medium', calibrationLabel.color)}>
                {calibrationLabel.label}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">vs last period</div>
            <TrendIndicator trend={data.trend} percentage={data.trendPercentage} />
          </div>
        </div>

        {/* Period selector */}
        {onPeriodChange && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div className="flex gap-1">
              {(['day', 'week', 'month', 'all'] as const).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onPeriodChange(p)}
                  className="h-7 text-xs capitalize"
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Visualization tabs */}
        {showBreakdown && data.buckets.length > 0 && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'bars' | 'diagram')}>
            <TabsList className="w-full">
              <TabsTrigger value="bars" className="flex-1 gap-1">
                <BarChart3 className="h-4 w-4" />
                Bar Chart
              </TabsTrigger>
              <TabsTrigger value="diagram" className="flex-1 gap-1">
                <LineChart className="h-4 w-4" />
                Reliability Diagram
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bars" className="mt-3 space-y-3">
              {data.buckets.map((bucket, index) => (
                <CalibrationBar key={index} bucket={bucket} />
              ))}
            </TabsContent>

            <TabsContent value="diagram" className="mt-3">
              <ReliabilityDiagram buckets={data.buckets} />
            </TabsContent>
          </Tabs>
        )}

        {/* Sample count */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            Based on {data.totalSamples.toLocaleString()} samples
          </div>
          <div>Updated: {formatDate(data.lastUpdated)}</div>
        </div>

        {/* Explanation tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Info className="h-3 w-3" />
                What is calibration?
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                Calibration measures how well the AI&apos;s confidence predictions match
                actual accuracy. A well-calibrated AI saying &quot;80% confident&quot; should
                be correct about 80% of the time.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

export default CalibrationChart;
