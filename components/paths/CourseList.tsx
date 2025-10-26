import type { CourseItem } from '@/lib/paths/data';
import { ChevronRight } from 'lucide-react';

interface CourseListProps {
  heading: string;
  courses: CourseItem[];
  moreCount: number;
  moreHref?: string;
}

export default function CourseList({ heading, courses, moreCount, moreHref = '#' }: CourseListProps) {
  return (
    <div>
      {/* Section heading */}
      <h3 className="mb-6 text-xl font-semibold text-foreground">{heading}</h3>

      {/* Course list */}
      <ul className="space-y-3">
        {courses.map((course) => (
          <li key={course.id}>
            <a
              href={course.href || '#'}
              className="group flex items-center gap-3 rounded-lg py-2 pr-2 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {/* Icon */}
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center text-muted-foreground"
                aria-hidden="true"
              >
                {course.icon}
              </span>

              {/* Title */}
              <span className="text-sm font-medium text-foreground group-hover:text-brand">
                {course.title}
              </span>

              {/* Chevron on hover */}
              <ChevronRight
                className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            </a>
          </li>
        ))}
      </ul>

      {/* Additional courses link */}
      {moreCount > 0 && (
        <a
          href={moreHref}
          className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          + {moreCount} additional course{moreCount !== 1 ? 's' : ''}
        </a>
      )}
    </div>
  );
}
