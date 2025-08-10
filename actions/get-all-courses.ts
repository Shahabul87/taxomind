import { enterpriseDataAPI } from "@/lib/data-fetching/enterprise-data-api";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

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

// Function to strip HTML tags and get plain text
const extractTextFromHtml = (html: string | null): string => {
  if (!html) return '';
  
  // Remove HTML tags
  const text = html.replace(/<\/?[^>]+(>|$)/g, '');
  
  // Decode HTML entities
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

export const getCoursesForHomepage = async (): Promise<CourseWithProgressWithCategory[]> => {
  const user = await currentUser();

  try {

    // Use the enterprise API for safe data fetching
    const result = await enterpriseDataAPI.fetchCourses(
      { isPublished: true },
      { page: 1, pageSize: 20 },
      user?.id
    );

    if (!result.success) {
      logger.error("💥 [GET_COURSES] Enterprise API returned error:", result.error);
      return [];
    }

    const courses = result.data || [];

    // Process courses to ensure cleanDescription is populated
    const processedCourses: CourseWithProgressWithCategory[] = courses.map(course => {
      const cleanDescription = course.description ? extractTextFromHtml(course.description) : '';
      
      return {
        id: course.id,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        imageUrl: course.imageUrl,
        price: course.price,
        isPublished: course.isPublished,
        isFeatured: course.isFeatured,
        category: course.category,
        chapters: course.chapters || [],
        cleanDescription,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      };
    });

    })));

    return processedCourses;
  } catch (error) {
    logger.error("[GET_COURSES]", error);
    return [];
  }
};

