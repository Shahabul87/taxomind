/**
 * React.memo Optimizations for Expensive Components
 * Phase 3.2: Performance optimizations using React.memo, useMemo, and useCallback
 * Part of Enterprise Code Quality Plan Phase 3
 */

import React, { memo, useMemo, useCallback, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Types for component props
interface BaseComponentProps {
  children?: React.ReactNode;
  className?: string;
}

interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  [key: string]: any;
}

interface MetricCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  description?: string;
  loading?: boolean;
}

interface ChartComponentProps extends BaseComponentProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  colors?: string[];
  loading?: boolean;
}

interface UserProgressProps extends BaseComponentProps {
  userId: string;
  courseId?: string;
  progress: number;
  chapters: Array<{
    id: string;
    title: string;
    completed: boolean;
    progress: number;
  }>;
  loading?: boolean;
}

interface CourseListProps extends BaseComponentProps {
  courses: Array<{
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    progress?: number;
    enrolled: boolean;
    price?: number;
  }>;
  onCourseClick?: (courseId: string) => void;
  loading?: boolean;
}

// Memoized metric card component
export const OptimizedMetricCard = memo<MetricCardProps>(({
  title,
  value,
  change,
  icon,
  description,
  loading = false,
  className = '',
}) => {
  // Memoize formatted value to prevent recalculation
  const formattedValue = useMemo(() => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  }, [value]);

  // Memoize change indicator
  const changeIndicator = useMemo(() => {
    if (change === undefined) return null;
    
    const isPositive = change > 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const symbol = isPositive ? '+' : '';
    
    return (
      <span className={`text-sm ${color}`}>
        {symbol}{change.toFixed(1)}%
      </span>
    );
  }, [change]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[120px] mb-2" />
          <Skeleton className="h-3 w-[150px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        <div className="flex items-center space-x-2">
          {changeIndicator}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedMetricCard.displayName = 'OptimizedMetricCard';

// Memoized line chart component
export const OptimizedLineChart = memo<ChartComponentProps>(({
  data,
  width = 400,
  height = 300,
  colors = ['#8884d8'],
  loading = false,
  className = '',
}) => {
  // Memoize chart configuration
  const chartConfig = useMemo(() => ({
    width,
    height,
    data,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  }), [data, width, height]);

  // Memoize data keys for lines
  const dataKeys = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(key => 
      key !== 'name' && key !== 'date' && typeof data[0][key] === 'number'
    );
  }, [data]);

  if (loading) {
    return <Skeleton className={`w-full ${className}`} style={{ height }} />;
  }

  if (data.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center text-muted-foreground ${className}`}
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <LineChart {...chartConfig}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        {dataKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
});

OptimizedLineChart.displayName = 'OptimizedLineChart';

// Memoized area chart component
export const OptimizedAreaChart = memo<ChartComponentProps>(({
  data,
  height = 300,
  colors = ['#8884d8'],
  loading = false,
  className = '',
}) => {
  const dataKeys = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(key => 
      key !== 'name' && key !== 'date' && typeof data[0][key] === 'number'
    );
  }, [data]);

  if (loading) {
    return <Skeleton className={`w-full ${className}`} style={{ height }} />;
  }

  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        {dataKeys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="1"
            stroke={colors[index % colors.length]}
            fill={colors[index % colors.length]}
            fillOpacity={0.6}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
});

OptimizedAreaChart.displayName = 'OptimizedAreaChart';

// Memoized pie chart component
export const OptimizedPieChart = memo<ChartComponentProps>(({
  data,
  height = 300,
  colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'],
  loading = false,
  className = '',
}) => {
  // Memoize pie data with colors
  const pieData = useMemo(() => {
    return data.map((entry, index) => ({
      ...entry,
      fill: colors[index % colors.length],
    }));
  }, [data, colors]);

  if (loading) {
    return <Skeleton className={`w-full ${className}`} style={{ height }} />;
  }

  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
});

OptimizedPieChart.displayName = 'OptimizedPieChart';

// Memoized user progress component
export const OptimizedUserProgress = memo<UserProgressProps>(({
  userId,
  courseId,
  progress,
  chapters,
  loading = false,
  className = '',
}) => {
  // Memoize progress calculations
  const progressStats = useMemo(() => {
    const completedChapters = chapters.filter(chapter => chapter.completed).length;
    const totalChapters = chapters.length;
    const averageProgress = chapters.reduce((sum, chapter) => sum + chapter.progress, 0) / totalChapters || 0;

    return {
      completedChapters,
      totalChapters,
      averageProgress,
      progressPercentage: (completedChapters / totalChapters) * 100,
    };
  }, [chapters]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-2 w-[80px] ml-auto" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Course Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Completed</span>
            <div className="font-medium">
              {progressStats.completedChapters} / {progressStats.totalChapters} chapters
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Average</span>
            <div className="font-medium">{progressStats.averageProgress.toFixed(1)}%</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Chapter Progress</h4>
          {chapters.map((chapter) => (
            <div key={chapter.id} className="flex items-center space-x-2">
              <Badge 
                variant={chapter.completed ? "default" : "secondary"}
                className="w-4 h-4 p-0"
              >
                {chapter.completed ? "✓" : "○"}
              </Badge>
              <span className="text-sm flex-1 truncate">{chapter.title}</span>
              <div className="w-20">
                <Progress value={chapter.progress} className="h-1" />
              </div>
              <span className="text-xs text-muted-foreground w-8">
                {chapter.progress}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedUserProgress.displayName = 'OptimizedUserProgress';

// Memoized course list component
export const OptimizedCourseList = memo<CourseListProps>(({
  courses,
  onCourseClick,
  loading = false,
  className = '',
}) => {
  // Memoize click handlers to prevent recreation
  const handleCourseClick = useCallback((courseId: string) => {
    onCourseClick?.(courseId);
  }, [onCourseClick]);

  // Memoize course items
  const courseItems = useMemo(() => {
    return courses.map((course) => (
      <MemoizedCourseItem
        key={course.id}
        course={course}
        onClick={handleCourseClick}
      />
    ));
  }, [courses, handleCourseClick]);

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-8 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {courseItems}
    </div>
  );
});

OptimizedCourseList.displayName = 'OptimizedCourseList';

// Individual course item component (memoized separately for better performance)
const MemoizedCourseItem = memo<{
  course: CourseListProps['courses'][0];
  onClick: (courseId: string) => void;
}>(({ course, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(course.id);
  }, [course.id, onClick]);

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleClick}>
      <CardContent className="p-4">
        {course.thumbnail && (
          <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h3 className="font-semibold mb-2 line-clamp-2">{course.title}</h3>
        {course.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {course.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Badge variant={course.enrolled ? "default" : "outline"}>
            {course.enrolled ? "Enrolled" : "Available"}
          </Badge>
          {course.price !== undefined && (
            <span className="font-medium">
              {course.price === 0 ? "Free" : `$${course.price}`}
            </span>
          )}
        </div>
        {course.progress !== undefined && course.enrolled && (
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
});

MemoizedCourseItem.displayName = 'MemoizedCourseItem';

// Higher-order component for memoization with custom comparison
export function withOptimizedMemo<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  const MemoizedComponent = memo(Component, propsAreEqual);
  MemoizedComponent.displayName = `Optimized(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

// Custom comparison functions for complex objects
export const compareProps = {
  // Compare arrays by length and item IDs
  shallowCompareArrays: <T extends { id: string },>(
    prevArray: T[],
    nextArray: T[]
  ): boolean => {
    if (prevArray.length !== nextArray.length) return false;
    return prevArray.every((item, index) => item.id === nextArray[index].id);
  },

  // Compare objects by specific keys
  compareByKeys: <T extends object,>(keys: (keyof T)[]) => 
    (prevProps: T, nextProps: T): boolean => {
      return keys.every(key => prevProps[key] === nextProps[key]);
    },

  // Deep comparison for complex nested objects
  deepCompare: <T,>(prev: T, next: T): boolean => {
    return JSON.stringify(prev) === JSON.stringify(next);
  },
};

// All components are already exported individually above