"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { CategoryRevenue } from "@/types/course";
import { motion } from "framer-motion";
import { PieChart as PieIcon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryBreakdownChartProps {
  data: CategoryRevenue[];
  title?: string;
  description?: string;
  isLoading?: boolean;
  height?: number;
}

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#14b8a6', // teal
];

export const CategoryBreakdownChart = ({
  data,
  title = "Revenue by Category",
  description = "Course category performance",
  isLoading = false,
  height = 300,
}: CategoryBreakdownChartProps) => {
  // Sort by revenue descending
  const sortedData = [...data].sort((a, b) => b.revenue - a.revenue);

  // Take top categories (limit to avoid clutter)
  const topCategories = sortedData.slice(0, 6);

  // Group remaining as "Other" if necessary
  const hasOthers = sortedData.length > 6;
  const othersRevenue = sortedData
    .slice(6)
    .reduce((sum, cat) => sum + cat.revenue, 0);

  const chartData = hasOthers
    ? [
        ...topCategories.map((cat) => ({
          name: cat.category,
          value: cat.revenue,
          percentage: cat.percentage,
          courses: cat.courseCount,
          enrollments: cat.enrollmentCount,
        })),
        {
          name: 'Other',
          value: othersRevenue,
          percentage: (othersRevenue / sortedData.reduce((sum, c) => sum + c.revenue, 0)) * 100,
          courses: sortedData.slice(6).reduce((sum, c) => sum + c.courseCount, 0),
          enrollments: sortedData.slice(6).reduce((sum, c) => sum + c.enrollmentCount, 0),
        },
      ]
    : topCategories.map((cat) => ({
        name: cat.category,
        value: cat.revenue,
        percentage: cat.percentage,
        courses: cat.courseCount,
        enrollments: cat.enrollmentCount,
      }));

  if (isLoading) {
    return (
      <Card className="border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="w-full h-[300px]" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
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
            {data.name}
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              ${data.value.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {data.percentage.toFixed(1)}% of total
            </p>
            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{data.courses} course{data.courses !== 1 ? 's' : ''}</span>
              <span>{data.enrollments} student{data.enrollments !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate top category
  const topCategory = chartData[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="p-4 sm:p-5 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base sm:text-lg">
                <PieIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <span className="truncate">{title}</span>
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400 mt-1 text-xs sm:text-sm">
                {description}
              </CardDescription>
            </div>
          </div>

          {/* Top Category Badge */}
          {topCategory && (
            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <p className="text-xs sm:text-sm font-medium text-indigo-900 dark:text-indigo-100 truncate">
                  Top: {topCategory.name}
                </p>
              </div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 truncate">
                {topCategory.percentage.toFixed(1)}% (${topCategory.value.toLocaleString()})
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Pie Chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percentage }) => `${percentage.toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(value) => (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="space-y-2 sm:space-y-3">
              <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3 px-2 sm:px-0">
                Category Details
              </p>
              {chartData.map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={cn(
                    "flex items-center justify-between p-2.5 sm:p-3 rounded-lg",
                    "bg-gray-50 dark:bg-gray-800/50",
                    "border border-gray-200 dark:border-gray-700",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    "transition-colors duration-200"
                  )}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                        {category.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                        {category.courses} courses • {category.enrollments} students
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                        {category.courses}c • {category.enrollments}s
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                      ${category.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {category.percentage.toFixed(1)}%
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
