import Link from "next/link";
import { ChevronRight, BookOpen, ArrowUpRight } from "lucide-react";

interface Course {
  id: string;
  title: string;
  imageUrl?: string | null;
  progress?: number;
  category?: {
    name: string;
    id?: string;
  } | null;
}

interface EnrolledCoursesProps {
  courses: Course[];
}

export default function EnrolledCourses({ courses }: EnrolledCoursesProps) {
  return (
    <DashboardSection title="Your Courses" viewAllLink="/dashboard/student">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {courses.length > 0 ? (
          courses.slice(0, 4).map((course: Course) => (
            <div 
              key={course.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500 relative overflow-hidden">
                {course.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={course.imageUrl} 
                    alt={course.title}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform"
                  />
                )}
                <div className="absolute bottom-2 left-3 bg-black/50 px-2 py-1 rounded text-xs text-white">
                  {course.category?.name || "Course"}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">{course.title}</h3>
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Progress: {course.progress || 0}%</div>
                  <Link 
                    href={`/courses/${course.id}`}
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium inline-flex items-center"
                  >
                    Continue <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-gray-900 dark:text-white font-medium">No courses enrolled yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1 mb-4">Browse our catalog to find courses that interest you</p>
            <Link
              href="/teacher/courses"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white shadow-sm text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              All Courses <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </DashboardSection>
  );
}

interface DashboardSectionProps {
  title: string;
  children: React.ReactNode;
  viewAllLink?: string;
}

const DashboardSection = ({ title, children, viewAllLink }: DashboardSectionProps) => {
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
        {viewAllLink && (
          <Link 
            href={viewAllLink}
            className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 inline-flex items-center"
          >
            View all <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}; 