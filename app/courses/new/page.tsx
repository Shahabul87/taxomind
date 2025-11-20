import { Suspense } from "react";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { EnterpriseCoursesLanding } from "./_components/EnterpriseCoursesLanding";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: 'Discover World-Class Courses | Taxomind - Transform Your Career',
  description: 'Join 50,000+ learners mastering in-demand skills. Expert-led courses, AI-powered learning paths, and industry-recognized certificates. Start learning today.'
};

export const dynamic = 'force-dynamic';

async function getEnterpriseData() {
  try {
    const user = await currentUser();

    // Get featured courses
    const featuredCourses = await db.course.findMany({
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
      take: 24,
    });

    // Get categories with course counts
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
      orderBy: {
        name: 'asc',
      },
    });

    // Get top instructors (users with published courses)
    const topInstructors = await db.user.findMany({
      where: {
        courses: {
          some: {
            isPublished: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
        _count: {
          select: {
            courses: {
              where: { isPublished: true },
            },
          },
        },
        courses: {
          where: {
            isPublished: true,
          },
          select: {
            Enrollment: true,
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
      take: 8,
    });

    // Get platform statistics
    const totalCourses = await db.course.count({
      where: { isPublished: true },
    });

    const totalEnrollments = await db.enrollment.count();

    const totalReviews = await db.courseReview.count();

    const averageRating = await db.courseReview.aggregate({
      _avg: {
        rating: true,
      },
    });

    // Transform courses
    const transformedCourses = featuredCourses.map((course) => {
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
        : 0;

      const totalDuration = course.chapters.reduce((sum, chapter) => {
        const chapterDuration = chapter.sections.reduce(
          (sectionSum, section) => sectionSum + (section.duration || 0),
          0
        );
        return sum + chapterDuration;
      }, 0);

      const badges: Array<"New" | "Bestseller" | "Hot" | "Updated" | "Featured"> = [];
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(course.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceCreated <= 30) badges.push("New");
      if (course._count.Enrollment > 100) badges.push("Bestseller");
      if (avgRating >= 4.5 && course._count.reviews >= 10) badges.push("Hot");

      const isEnrolled = user
        ? course.Enrollment.some((e) => e.userId === user.id)
        : false;

      const lessonsCount = course.chapters.reduce(
        (sum, chapter) => sum + chapter.sections.length,
        0
      );

      return {
        id: course.id,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description || "",
        imageUrl: course.imageUrl || "",
        price: course.price || 0,
        category: {
          id: course.category?.id || "",
          name: course.category?.name || "Uncategorized",
        },
        chaptersCount: course._count.chapters,
        lessonsCount,
        duration: Math.round(totalDuration / 60),
        difficulty: (course.difficulty || "Beginner") as "Beginner" | "Intermediate" | "Advanced" | "Expert",
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
        badges,
        isEnrolled,
        createdAt: course.createdAt,
      };
    });

    // Transform instructors
    const transformedInstructors = topInstructors.map((instructor) => {
      const totalStudents = instructor.courses.reduce(
        (sum, course) => sum + course.Enrollment.length,
        0
      );

      const allReviews = instructor.courses.flatMap(course => course.reviews);
      const avgRating = allReviews.length > 0
        ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length
        : 0;

      return {
        id: instructor.id,
        name: instructor.name || "Unknown Instructor",
        avatar: instructor.image || undefined,
        email: instructor.email,
        coursesCount: instructor._count?.courses || 0,
        studentsCount: totalStudents,
        rating: avgRating,
        reviewsCount: allReviews.length,
      };
    });

    return {
      courses: transformedCourses,
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        count: cat._count?.courses || 0,
      })),
      instructors: transformedInstructors,
      statistics: {
        totalCourses,
        totalEnrollments,
        totalReviews,
        averageRating: averageRating._avg?.rating || 0,
      },
      userId: user?.id,
    };
  } catch (error) {
    console.error("Error fetching enterprise data:", error);
    return {
      courses: [],
      categories: [],
      instructors: [],
      statistics: {
        totalCourses: 0,
        totalEnrollments: 0,
        totalReviews: 0,
        averageRating: 0,
      },
      userId: null,
    };
  }
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-4 py-20">
        <div className="space-y-12">
          <Skeleton className="h-96 w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function NewCoursesPage() {
  const data = await getEnterpriseData();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <EnterpriseCoursesLanding
        courses={data.courses}
        categories={data.categories}
        instructors={data.instructors}
        statistics={data.statistics}
        userId={data.userId || undefined}
      />
    </Suspense>
  );
}
