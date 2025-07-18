import { CourseCardHome } from "@/components/course-card-home";

// Helper function to extract text from HTML
const extractTextFromHtml = (html: string | null): string => {
  if (!html) return '';
  // Remove HTML tags
  return html.replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

type CourseWithProgressWithCategory = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  category: any;
  chapters: { id: string }[];
  cleanDescription?: string;
  createdAt: Date;
  updatedAt: Date;
};

interface FeaturedCoursesProps {
  courses: CourseWithProgressWithCategory[];
}

export const FeaturedCoursesSection = ({ courses }: FeaturedCoursesProps) => {
  // Process courses to ensure cleanDescription
  const processedCourses = courses.map(course => {
    let description = course.cleanDescription;
    
    // If cleanDescription is missing but description exists, extract it
    if (!description && course.description) {
      description = extractTextFromHtml(course.description);
    }
    
    return {
      ...course,
      processedDescription: description || "No description available"
    };
  });

  console.log("Featured courses processed:", processedCourses.map(c => ({
    id: c.id,
    title: c.title.substring(0, 20),
    description: c.processedDescription?.substring(0, 30)
  })));

  return (
    <div className="px-4 py-16 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8 lg:py-20">
      {/* Elegant Featured Courses Section */}
      <div className="max-w-xl mb-10 md:mx-auto sm:text-center lg:max-w-2xl md:mb-12">
        <div className="relative">
          <h2 className="max-w-lg mb-6 font-sans text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:mx-auto">
            <span className="relative inline-block">
              <span className="relative bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Featured Courses
              </span>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600/40 to-blue-600/40 transform -skew-x-12" />
            </span>
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-300 md:text-lg font-medium">
            Explore our most popular courses and start learning today
          </p>
        </div>
      </div>
      <div className="grid gap-5 mb-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {processedCourses.map((course) => (
          <CourseCardHome
            key={course.id}
            id={course.id}
            title={course.title}
            cleanDescription={course.processedDescription}
            imageUrl={course.imageUrl!}
            chaptersLength={course.chapters?.length || 0}
            price={course.price!}
            category={course?.category?.name || ""}
          />
        ))}
      </div>
    </div>
  );
}; 