import { Suspense } from "react";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { CoursesPageClient } from "./_components/courses-page-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: 'Courses | Taxomind - Explore Our Course Catalog',
  description: 'Browse our comprehensive catalog of expert-led courses. Learn at your own pace with AI-powered adaptive learning, personalized recommendations, and industry-recognized certificates.'
};

async function getInitialData() {
  try {
    const user = await currentUser();

    // Get initial courses
    const courses = await db.course.findMany({
      where: {
        isPublished: true,
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        chapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
            sections: {
              select: {
                id: true,
                duration: true,
              }
            }
          },
        },
        Enrollment: {
          select: {
            userId: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            Enrollment: true,
            reviews: true,
            chapters: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12, // Initial page size
    });

    // Get total count
    const totalCourses = await db.course.count({
      where: {
        isPublished: true,
      },
    });

    // Get categories for filters
    const categories = await db.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            courses: {
              where: { isPublished: true },
            },
          },
        },
      },
    });

    // Transform courses to match frontend expectations
    const transformedCourses = courses.map((course) => {
      // Calculate average rating
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
        : 0;

      // Calculate total duration from video sections
      const totalDuration = course.chapters.reduce((sum, chapter) => {
        const chapterDuration = chapter.sections.reduce(
          (sectionSum, section) => sectionSum + (section.duration || 0),
          0
        );
        return sum + chapterDuration;
      }, 0);

      // Determine badges
      const badges: Array<"New" | "Bestseller" | "Hot" | "Updated" | "Featured"> = [];
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(course.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceCreated <= 30) badges.push("New");
      if (course._count.Enrollment > 100) badges.push("Bestseller");
      if (avgRating >= 4.5 && course._count.reviews >= 10) badges.push("Hot");

      // Check if user is enrolled
      const isEnrolled = user
        ? course.Enrollment.some((e) => e.userId === user.id)
        : false;

      // Calculate lessons count (sections in all chapters)
      const lessonsCount = course.chapters.reduce(
        (sum, chapter) => sum + chapter.sections.length,
        0
      );

      return {
        id: course.id,
        title: course.title,
        description: course.description || "",
        imageUrl: course.imageUrl || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgICAgPGRlZnM+CiAgICAgICAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNjM2NkYxO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojQTg1NUY3O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICAgIDwvZGVmcz4KICAgICAgPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9InVybCgjZ3JhZDEpIi8+CiAgICAgIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSI0MCIgZm9udC13ZWlnaHQ9ImJvbGQiPgogICAgICAgIENvdXJzZQogICAgICA8L3RleHQ+CiAgICA8L3N2Zz4=",
        price: course.price || 0,
        category: {
          id: course.category?.id || "",
          name: course.category?.name || "Uncategorized",
        },
        chaptersCount: course._count.chapters,
        lessonsCount,
        duration: Math.round(totalDuration / 60), // Convert to minutes
        difficulty: "Beginner" as const, // Default - would come from course settings
        instructor: course.user
          ? {
              id: course.user.id,
              name: course.user.name || "Unknown Instructor",
              avatar: course.user.image || undefined,
            }
          : undefined,
        rating: avgRating,
        reviewsCount: course._count.reviews,
        enrolledCount: course._count.Enrollment,
        completionRate: 75, // Default - would calculate from enrollment progress
        hasCertificate: true, // Default - would come from course settings
        hasExercises: true, // Default - would come from course settings
        badges,
        isEnrolled,
        isWishlisted: false, // Would need wishlist table
        lastUpdated: course.updatedAt,
      };
    });

    // Build filter options
    const filterOptions = {
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        count: cat._count.courses,
      })),
      priceRanges: [
        { label: "Free", min: 0, max: 0 },
        { label: "$0 - $50", min: 0, max: 50 },
        { label: "$50 - $100", min: 50, max: 100 },
        { label: "$100 - $200", min: 100, max: 200 },
        { label: "$200+", min: 200, max: 99999 },
      ],
      difficulties: [
        { value: "Beginner", label: "Beginner", count: 45 },
        { value: "Intermediate", label: "Intermediate", count: 32 },
        { value: "Advanced", label: "Advanced", count: 18 },
        { value: "Expert", label: "Expert", count: 7 },
      ],
      durations: [
        { label: "< 2 hours", min: 0, max: 120 },
        { label: "2-5 hours", min: 120, max: 300 },
        { label: "5-10 hours", min: 300, max: 600 },
        { label: "10+ hours", min: 600, max: 99999 },
      ],
      ratings: [
        { value: 4.5, label: "4.5 & up" },
        { value: 4, label: "4.0 & up" },
        { value: 3.5, label: "3.5 & up" },
        { value: 3, label: "3.0 & up" },
      ],
      features: [
        { value: "certificate", label: "Certificate of Completion" },
        { value: "subtitles", label: "Subtitles Available" },
        { value: "exercises", label: "Practice Exercises" },
        { value: "downloadable", label: "Downloadable Resources" },
        { value: "mobile", label: "Mobile Access" },
      ],
    };

    return {
      courses: transformedCourses,
      filterOptions,
      totalCourses,
      userId: user?.id,
    };
  } catch (error) {
    console.error("Error fetching initial courses data:", error);
    return {
      courses: [],
      filterOptions: {
        categories: [],
        priceRanges: [],
        difficulties: [],
        durations: [],
        ratings: [],
        features: [],
      },
      totalCourses: 0,
      userId: null,
    };
  }
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Skeleton */}
      <div className="pt-14 xl:pt-16">
        <Skeleton className="h-[400px] w-full" />
      </div>

      {/* Stats Bar Skeleton */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar Skeleton */}
          <div className="hidden lg:block w-80">
            <Skeleton className="h-96" />
          </div>

          {/* Grid Skeleton */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function CoursesPage() {
  const initialData = await getInitialData();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CoursesPageClient
        initialCourses={initialData.courses}
        filterOptions={initialData.filterOptions}
        totalCourses={initialData.totalCourses}
        userId={initialData.userId || undefined}
      />
    </Suspense>
  );
}

