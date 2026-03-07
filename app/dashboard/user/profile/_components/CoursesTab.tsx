'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ProfileEmptyState } from './ProfileEmptyState';
import type { EnrolledCourse } from './types';

type CourseFilter = 'all' | 'in-progress' | 'completed';

interface CoursesTabProps {
  courses: EnrolledCourse[];
}

function isPlaceholderUrl(url: string) {
  return !url || url.startsWith('/api/placeholder');
}

export function CoursesTab({ courses }: CoursesTabProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<CourseFilter>('all');

  const filteredCourses = courses.filter((course) => {
    if (filter === 'in-progress') return course.progress > 0 && course.progress < 100;
    if (filter === 'completed') return course.progress === 100;
    return true;
  });

  const filters: { value: CourseFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  if (courses.length === 0) {
    return (
      <Card className="rounded-xl sm:rounded-2xl">
        <CardContent className="p-0">
          <ProfileEmptyState
            icon={BookOpen}
            title="No courses enrolled"
            description="Start your learning journey by enrolling in a course that interests you."
            actionLabel="Browse Courses"
            onAction={() => router.push('/search')}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col xs:flex-row justify-between items-stretch xs:items-center gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          My Courses
        </h2>
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value)}
              className="text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3 whitespace-nowrap"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {filteredCourses.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="overflow-hidden hover:shadow-lg transition-shadow rounded-xl sm:rounded-2xl"
            >
              <div className="relative h-40 xs:h-44 sm:h-48 bg-gradient-to-br from-indigo-200/60 to-blue-200/60 dark:from-indigo-900/40 dark:to-blue-900/40">
                {!isPlaceholderUrl(course.thumbnail) && (
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                  <Badge
                    variant="secondary"
                    className="mb-1.5 sm:mb-2 text-[9px] xs:text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                  >
                    {course.progress}% Complete
                  </Badge>
                  <h3 className="font-bold text-sm xs:text-base sm:text-lg text-white break-words line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 mt-0.5 sm:mt-1 break-words">
                    by {course.instructor}
                  </p>
                </div>
              </div>
              <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
                <div className="space-y-2.5 sm:space-y-3">
                  <Progress value={course.progress} className="h-1.5 sm:h-2" />
                  <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                    <span>
                      {course.completedChapters}/{course.totalChapters} chapters
                    </span>
                    <span className="ml-2 flex-shrink-0">{course.lastAccessed}</span>
                  </div>
                  <Button
                    className="w-full h-9 sm:h-10 text-xs sm:text-sm"
                    onClick={() => router.push(`/courses/${course.id}`)}
                  >
                    Continue Learning
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-xl sm:rounded-2xl">
          <CardContent className="p-0">
            <ProfileEmptyState
              icon={BookOpen}
              title={`No ${filter === 'completed' ? 'completed' : 'in-progress'} courses`}
              description={
                filter === 'completed'
                  ? 'Complete a course to see it here. Keep going!'
                  : 'Start a course to track your progress.'
              }
              actionLabel="View All"
              onAction={() => setFilter('all')}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
