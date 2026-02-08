'use client';

/**
 * EnrolledCoursesGrid
 *
 * Displays all enrolled courses in a responsive grid layout.
 * Each course card shows progress, time spent, and status.
 */

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Clock,
  Target,
  BookOpen,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Zap,
  Calendar,
  Filter,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  type EnrolledCourseAnalytics,
  formatStudyTime,
  getStatusColor,
  getStatusLabel,
  formatRelativeTime,
} from '@/hooks/use-enrolled-course-analytics';
import { useState, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface EnrolledCoursesGridProps {
  courses: EnrolledCourseAnalytics[];
  onSelectCourse: (courseId: string) => void;
  className?: string;
}

type SortOption = 'recent' | 'progress' | 'time' | 'name';
type FilterOption = 'all' | 'on_track' | 'needs_attention' | 'completed';

// ============================================================================
// COURSE CARD COMPONENT
// ============================================================================

interface CourseCardProps {
  course: EnrolledCourseAnalytics;
  onClick: () => void;
  index: number;
}

function CourseCard({ course, onClick, index }: CourseCardProps) {
  const statusIcon = {
    completed: <CheckCircle2 className="w-4 h-4" />,
    ahead: <TrendingUp className="w-4 h-4" />,
    on_track: <Zap className="w-4 h-4" />,
    behind: <AlertCircle className="w-4 h-4" />,
    needs_attention: <AlertCircle className="w-4 h-4" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className={cn(
          'group cursor-pointer overflow-hidden',
          'bg-white dark:bg-slate-800',
          'border border-slate-200 dark:border-slate-700',
          'hover:border-violet-300 dark:hover:border-violet-600',
          'hover:shadow-lg transition-all duration-200'
        )}
        onClick={onClick}
      >
        {/* Course Thumbnail */}
        <div className="relative h-36 bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-violet-300 dark:text-violet-700" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge
              variant="secondary"
              className={cn(
                'flex items-center gap-1 font-medium',
                getStatusColor(course.status)
              )}
            >
              {statusIcon[course.status]}
              {getStatusLabel(course.status)}
            </Badge>
          </div>

          {/* Progress Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50 dark:bg-slate-700/50">
            <div
              className={cn(
                'h-full transition-all',
                course.progress.overall >= 80 && 'bg-emerald-500',
                course.progress.overall >= 50 && course.progress.overall < 80 && 'bg-blue-500',
                course.progress.overall >= 25 && course.progress.overall < 50 && 'bg-amber-500',
                course.progress.overall < 25 && 'bg-slate-400'
              )}
              style={{ width: `${course.progress.overall}%` }}
            />
          </div>
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 mb-3 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {course.title}
          </h3>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded">
                <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {course.progress.overall}%
                </span>
                <span className="text-slate-500 dark:text-slate-400 ml-1 text-xs">
                  progress
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="p-1.5 bg-violet-50 dark:bg-violet-900/30 rounded">
                <Clock className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatStudyTime(course.timeSpent.totalMinutes)}
                </span>
                <span className="text-slate-500 dark:text-slate-400 ml-1 text-xs">
                  spent
                </span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>
                {course.progress.chaptersCompleted}/{course.progress.totalChapters} chapters
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatRelativeTime(course.lastActivityAt)}</span>
            </div>
          </div>

          {/* AI Risk Indicator */}
          {course.aiInsights.riskLevel !== 'low' && (
            <div
              className={cn(
                'mt-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2',
                course.aiInsights.riskLevel === 'high'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
              )}
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="line-clamp-1">
                {course.aiInsights.recommendation ?? 'Attention recommended'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyCoursesState() {
  return (
    <Card className="border-dashed border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
      <CardContent className="py-16">
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-violet-100 dark:bg-violet-900/30 rounded-full mb-4">
            <BookOpen className="w-10 h-10 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            No Courses Found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
            You haven&apos;t enrolled in any courses yet, or no courses match your current filter.
          </p>
          <Button asChild>
            <a href="/search">Browse Courses</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EnrolledCoursesGrid({
  courses,
  onSelectCourse,
  className,
}: EnrolledCoursesGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterBy !== 'all') {
      result = result.filter((course) => {
        switch (filterBy) {
          case 'completed':
            return course.status === 'completed';
          case 'on_track':
            return course.status === 'on_track' || course.status === 'ahead';
          case 'needs_attention':
            return course.status === 'needs_attention' || course.status === 'behind';
          default:
            return true;
        }
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return (
            new Date(b.lastActivityAt ?? b.enrolledAt).getTime() -
            new Date(a.lastActivityAt ?? a.enrolledAt).getTime()
          );
        case 'progress':
          return b.progress.overall - a.progress.overall;
        case 'time':
          return b.timeSpent.totalMinutes - a.timeSpent.totalMinutes;
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [courses, searchQuery, sortBy, filterBy]);

  // Count courses by status for filter badges
  const statusCounts = useMemo(() => {
    return {
      all: courses.length,
      on_track: courses.filter(
        (c) => c.status === 'on_track' || c.status === 'ahead'
      ).length,
      needs_attention: courses.filter(
        (c) => c.status === 'needs_attention' || c.status === 'behind'
      ).length,
      completed: courses.filter((c) => c.status === 'completed').length,
    };
  }, [courses]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {/* Filter Dropdown */}
          <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Courses ({statusCounts.all})
              </SelectItem>
              <SelectItem value="on_track">
                On Track ({statusCounts.on_track})
              </SelectItem>
              <SelectItem value="needs_attention">
                Needs Attention ({statusCounts.needs_attention})
              </SelectItem>
              <SelectItem value="completed">
                Completed ({statusCounts.completed})
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[140px]">
              <TrendingUp className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent Activity</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="time">Time Spent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <EmptyCoursesState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCourses.map((course, index) => (
            <CourseCard
              key={course.courseId}
              course={course}
              onClick={() => onSelectCourse(course.courseId)}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {filteredCourses.length > 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          Showing {filteredCourses.length} of {courses.length} courses
        </p>
      )}
    </div>
  );
}

export default EnrolledCoursesGrid;
