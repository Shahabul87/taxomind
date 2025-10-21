"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TimeSeriesData } from "@/types/course";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RevenueChartProps {
  data: TimeSeriesData[];
  title?: string;
  description?: string;
  type?: 'line' | 'area';
  showLegend?: boolean;
  isLoading?: boolean;
  height?: number;
}

export const RevenueChart = ({
  data,
  title = "Revenue Trend",
  description = "Last 30 days revenue performance",
  type = 'area',
  showLegend = true,
  isLoading = false,
  height = 300,
}: RevenueChartProps) => {
  // Transform data for recharts
  const chartData = data.map((item) => ({
    date: item.label || new Date(item.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    revenue: item.value,
    timestamp: item.timestamp,
  }));

  // Calculate summary stats
  const totalRevenue = data.reduce((sum, item) => sum + item.value, 0);
  const avgRevenue = totalRevenue / data.length;
  const lastValue = data[data.length - 1]?.value || 0;
  const previousValue = data[data.length - 2]?.value || 0;
  const changePercent = previousValue > 0
    ? ((lastValue - previousValue) / previousValue) * 100
    : 0;

  if (isLoading) {
    return (
      <Card className="border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {data.date}
          </p>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            ${data.revenue.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base sm:text-lg">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <span className="truncate">{title}</span>
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400 mt-1 text-xs sm:text-sm">
                {description}
              </CardDescription>
            </div>

            {/* Summary Stats */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                changePercent >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}>
                {changePercent >= 0 ? "↑" : "↓"}
                <span>{Math.abs(changePercent).toFixed(1)}%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">vs previous</p>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-3 sm:mt-4">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Avg/Day</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  ${avgRevenue.toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
          <ResponsiveContainer width="100%" height={height}>
            {type === 'area' ? (
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  className="dark:stroke-gray-700"
                />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  style={{ fontSize: '10px' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: '10px' }}
                  tickLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
              </AreaChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  className="dark:stroke-gray-700"
                />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  style={{ fontSize: '10px' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: '10px' }}
                  tickLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Revenue"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};
