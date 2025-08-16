import Image from "next/image";
import Link from "next/link";
import { Clock, BookOpen, Users, Star, BarChart, Play } from "lucide-react";
import { TimeAgo } from "@/app/components/ui/time-ago";

interface CourseCardProps {
  course: any;
  type: "enrolled" | "created";
}

export const CourseCard = ({ course, type }: CourseCardProps) => {
  const isEnrolled = type === "enrolled";
  
  // Default image if none provided
  const imageUrl = course.imageUrl || "/images/course-placeholder.jpg";
  
  // Format date text
  const datePrefix = isEnrolled ? "Enrolled " : "Created ";
  
  // Determine the link based on course type and publication status
  const courseLink = isEnrolled
    ? `/courses/${course.id}`
    : course.isPublished
      ? `/teacher/courses/${course.id}`
      : `/teacher/courses/${course.id}`;
  
  // Get course stats based on type
  const stats = isEnrolled
    ? [
        {
          label: "Progress",
          value: `${course.completionPercentage}%`,
          icon: <BarChart className="w-3 h-3" />,
        },
        {
          label: "Chapters",
          value: course.totalChapters,
          icon: <BookOpen className="w-3 h-3" />,
        },
        {
          label: "Rating",
          value: course.averageRating.toFixed(1),
          icon: <Star className="w-3 h-3 text-yellow-400" />,
        },
      ]
    : [
        {
          label: "Students",
          value: course.totalEnrolled,
          icon: <Users className="w-3 h-3" />,
        },
        {
          label: "Chapters",
          value: course.totalChapters,
          icon: <BookOpen className="w-3 h-3" />,
        },
        {
          label: "Rating",
          value: course.averageRating.toFixed(1),
          icon: <Star className="w-3 h-3 text-yellow-400" />,
        },
      ];

  return (
    <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-xl overflow-hidden border border-gray-800/50 h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 group">
      {/* Course Image with Overlay */}
      <div className="relative h-44 w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
        
        {/* Course Status Badge */}
        {isEnrolled ? (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium bg-purple-600/80 text-white backdrop-blur-sm">
            {course.completionPercentage === 100 
              ? "Completed" 
              : course.completionPercentage > 0 
                ? "In Progress" 
                : "Not Started"}
          </div>
        ) : (
          <div className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm
            ${course.isPublished ? "bg-green-600/80 text-white" : "bg-amber-600/80 text-white"}`}>
            {course.isPublished ? "Published" : "Draft"}
          </div>
        )}
        
        {/* Continue / Edit Button */}
        <Link href={courseLink} className="absolute bottom-3 right-3">
          <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors group-hover:scale-110 transform duration-300">
            <Play className="h-4 w-4 fill-current" />
          </div>
        </Link>
        
        {/* Course Category */}
        {course.category && (
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md text-xs font-medium bg-gray-900/70 text-gray-300 backdrop-blur-sm border border-gray-800/50">
            {course.category.name}
          </div>
        )}
      </div>
      
      {/* Course Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-white font-semibold text-lg leading-tight line-clamp-2">
          {course.title}
        </h3>
        
        {/* Instructor or Date */}
        <div className="mt-2 text-gray-400 text-sm">
          {isEnrolled && course.instructor && (
            <div className="flex items-center gap-2">
              <div className="relative h-5 w-5 rounded-full overflow-hidden">
                {course.instructor.image ? (
                  <Image
                    src={course.instructor.image}
                    alt={course.instructor.name || "Instructor"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-xs">
                    {course.instructor.name ? course.instructor.name[0] : "?"}
                  </div>
                )}
              </div>
              <span className="truncate">{course.instructor.name}</span>
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            {datePrefix} 
            <TimeAgo date={isEnrolled ? course.enrolledAt : course.createdAt} />
          </div>
        </div>
        
        {/* Progress Bar (for enrolled courses) */}
        {isEnrolled && (
          <div className="mt-4 mb-3">
            <div className="relative h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                style={{ width: `${course.completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Course Stats */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-800/50">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center text-gray-400 text-xs">
              <div className="mr-1">{stat.icon}</div>
              <span className="text-gray-300 font-medium">{stat.value}</span>
              <span className="ml-1 text-gray-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 