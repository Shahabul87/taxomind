import Image from 'next/image';
import Link from 'next/link';
import {
  Clock,
  BookOpen,
  Users,
  Star,
  BarChart,
  Play,
  CheckCircle2,
  TrendingUp,
  Award,
  Calendar,
  Share2,
} from 'lucide-react';
import { TimeAgo } from '@/app/components/ui/time-ago';
import { cn } from '@/lib/utils';
import { ensureHttpsUrl, getFallbackImageUrl } from '@/lib/cloudinary-utils';
import { CourseShareDialog } from '@/components/course/course-share-dialog';

interface CourseCardProps {
  course: any;
  type: 'enrolled' | 'created';
}

export const CourseCard = ({ course, type }: CourseCardProps) => {
  const isEnrolled = type === 'enrolled';

  // Ensure image URL uses HTTPS and has proper fallback
  const imageUrl = ensureHttpsUrl(course.imageUrl) || getFallbackImageUrl('course');

  // Format date text
  const datePrefix = isEnrolled ? 'Enrolled ' : 'Created ';

  // Determine the link based on course type and publication status
  const courseLink = isEnrolled
    ? `/courses/${course.id}/learn`
    : course.isPublished
      ? `/teacher/courses/${course.id}`
      : `/teacher/courses/${course.id}`;

  // Status badge colors following analytics theme
  const getStatusBadge = () => {
    if (isEnrolled) {
      if (course.completionPercentage === 100) {
        return {
          text: 'Completed',
          bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
          icon: <CheckCircle2 className="w-3 h-3" />,
          borderColor: 'border-emerald-400/50',
        };
      } else if (course.completionPercentage > 0) {
        return {
          text: 'In Progress',
          bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          icon: <TrendingUp className="w-3 h-3" />,
          borderColor: 'border-blue-400/50',
        };
      } else {
        return {
          text: 'Not Started',
          bg: 'bg-gradient-to-r from-slate-500 to-slate-600',
          icon: <Play className="w-3 h-3" />,
          borderColor: 'border-slate-400/50',
        };
      }
    } else {
      return course.isPublished
        ? {
            text: 'Published',
            bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
            icon: <CheckCircle2 className="w-3 h-3" />,
            borderColor: 'border-emerald-400/50',
          }
        : {
            text: 'Draft',
            bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
            icon: null,
            borderColor: 'border-amber-400/50',
          };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <Link
      href={courseLink}
      className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 h-full flex flex-col transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-400/50 dark:hover:border-blue-500/50 cursor-pointer"
    >
      {/* Hover Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none z-10"></div>

      {/* Course Image with Enhanced Overlay */}
      <div className="relative h-36 sm:h-40 md:h-44 w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = getFallbackImageUrl('course');
          }}
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Top Badges Row */}
        <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 right-1.5 sm:right-2 flex items-start justify-between gap-1.5 sm:gap-2 z-20">
          {/* Status Badge */}
          <div
            className={cn(
              'px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold text-white backdrop-blur-md shadow-md border flex items-center gap-0.5 sm:gap-1 flex-shrink-0',
              statusBadge.bg,
              statusBadge.borderColor
            )}
          >
            {statusBadge.icon && <span className="flex-shrink-0">{statusBadge.icon}</span>}
            <span className="drop-shadow-sm whitespace-nowrap">{statusBadge.text}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Share Button - Only for created courses */}
            {!isEnrolled && (
              <div
                onClick={(e) => e.preventDefault()}
                className="flex-shrink-0"
              >
                <CourseShareDialog
                  courseId={course.id}
                  courseTitle={course.title}
                  courseSlug={course.slug}
                  isPublished={course.isPublished}
                  trigger={
                    <button
                      className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 backdrop-blur-md border border-white/50 dark:border-slate-700/50 shadow-md hover:bg-white hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors"
                      title="Share course"
                    >
                      <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  }
                />
              </div>
            )}

            {/* Category Badge */}
            {course.category && (
              <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-semibold bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white backdrop-blur-md border border-white/50 dark:border-slate-700/50 shadow-md truncate max-w-[40%] sm:max-w-none">
                {course.category.name}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Info on Image */}
        <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 right-1.5 sm:right-2 z-20">
          {/* Title on Image */}
          <h3 className="text-white font-bold text-sm sm:text-base md:text-lg leading-tight line-clamp-2 drop-shadow-lg mb-1.5 sm:mb-2">
            {course.title}
          </h3>

          {/* Quick Stats on Image */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-300 fill-yellow-300 flex-shrink-0" />
              <span className="text-white text-[10px] sm:text-xs font-bold">
                {(course.averageRating ?? 0).toFixed(1)}
              </span>
            </div>

            {isEnrolled ? (
              <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
                <BarChart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white flex-shrink-0" />
                <span className="text-white text-[10px] sm:text-xs font-bold">{course.completionPercentage}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
                <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white flex-shrink-0" />
                <span className="text-white text-[10px] sm:text-xs font-bold">{course.totalEnrolled}</span>
              </div>
            )}

            <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
              <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white flex-shrink-0" />
              <span className="text-white text-[10px] sm:text-xs font-bold">{course.totalChapters}</span>
            </div>
          </div>
        </div>

        {/* Play/Continue Button Overlay - Enhanced */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-30 bg-slate-900/20">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative p-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 backdrop-blur-sm border-2 border-white/40 text-white shadow-2xl transform scale-0 group-hover:scale-100 transition-transform duration-500">
              <Play className="h-5 w-5 fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Course Content - Compact */}
      <div className="flex flex-col flex-1 p-2.5 sm:p-3 relative z-20">
        {/* Instructor/Creator Info - Compact */}
        {isEnrolled && course.instructor && (
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 pb-1.5 sm:pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="relative h-6 w-6 sm:h-7 sm:w-7 rounded-full overflow-hidden ring-2 ring-blue-500/50 dark:ring-blue-400/50 shadow-sm flex-shrink-0">
              {course.instructor.image ? (
                <Image
                  src={ensureHttpsUrl(course.instructor.image) || getFallbackImageUrl('user')}
                  alt={course.instructor.name || 'Instructor'}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.src = getFallbackImageUrl('user');
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                  {course.instructor.name ? course.instructor.name[0] : '?'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Instructor
              </p>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-900 dark:text-white truncate">
                {course.instructor.name}
              </p>
            </div>
          </div>
        )}

        {/* Date Info */}
        <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">
          <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
          <span className="truncate">
            {datePrefix}
            <TimeAgo date={isEnrolled ? course.enrolledAt : course.createdAt} />
          </span>
        </div>

        {/* Progress Bar (for enrolled courses) - Compact */}
        {isEnrolled && (
          <div className="mb-2 sm:mb-3">
            <div className="flex items-center justify-between mb-0.5 sm:mb-1">
              <span className="text-[9px] sm:text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                Progress
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 dark:text-blue-400">
                {course.completionPercentage}%
              </span>
            </div>
            <div className="relative h-1.5 sm:h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${course.completionPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
              </div>
            </div>
          </div>
        )}

        {/* Compact Stats Row */}
        <div className="mt-auto pt-1.5 sm:pt-2 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 gap-0.5 sm:gap-1">
          {isEnrolled ? (
            <>
              <div className="flex flex-col items-center gap-0.5 flex-1 p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <BarChart className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-blue-500 dark:text-blue-400" />
                <span className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white">
                  {course.completionPercentage}%
                </span>
              </div>

              <div className="flex flex-col items-center gap-0.5 flex-1 p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-indigo-500 dark:text-indigo-400" />
                <span className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white">
                  {course.totalChapters}
                </span>
              </div>

              <div className="flex flex-col items-center gap-0.5 flex-1 p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
                <span className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white">
                  {(course.averageRating ?? 0).toFixed(1)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-0.5 flex-1 p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-blue-500 dark:text-blue-400" />
                <span className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white">
                  {course.totalEnrolled}
                </span>
              </div>

              <div className="flex flex-col items-center gap-0.5 flex-1 p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-indigo-500 dark:text-indigo-400" />
                <span className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white">
                  {course.totalChapters}
                </span>
              </div>

              <div className="flex flex-col items-center gap-0.5 flex-1 p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
                <span className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white">
                  {(course.averageRating ?? 0).toFixed(1)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};
