import { Suspense } from "react";
import { Metadata } from "next";
import Script from "next/script";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { CoursesPageClient } from "./_components/courses-page-client";
import { Skeleton } from "@/components/ui/skeleton";
import { logger } from "@/lib/logger";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taxomind.com';

export const metadata: Metadata = {
  title: 'Courses | Taxomind - Explore Our AI-Powered Course Catalog',
  description: 'Browse our growing catalog of courses. Learn at your own pace with AI-powered adaptive learning, personalized recommendations, and certificates of completion.',
  keywords: [
    'online courses',
    'AI-powered learning',
    'adaptive education',
    'professional development',
    'skill development',
    'online certification',
    'e-learning platform',
    'Taxomind courses',
  ],
  alternates: {
    canonical: '/courses',
  },
  openGraph: {
    title: 'Explore Our Course Catalog | Taxomind',
    description: 'Discover courses with AI-powered adaptive learning. Get personalized recommendations and earn certificates of completion.',
    url: `${baseUrl}/courses`,
    siteName: 'Taxomind',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og-courses.png`,
        width: 1200,
        height: 630,
        alt: 'Taxomind Course Catalog - AI-Powered Learning',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Our Course Catalog | Taxomind',
    description: 'Discover courses with AI-powered adaptive learning on Taxomind.',
    images: [`${baseUrl}/og-courses.png`],
    creator: '@taxomind',
    site: '@taxomind',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

export const dynamic = 'force-dynamic';

async function getInitialData() {
  try {
    logger.info('[CoursesPage] Starting data fetch');
    const user = await currentUser();
    logger.info('[CoursesPage] User auth complete', user ? `User ID: ${user.id}` : 'No user');

    // Get initial courses
    logger.info('[CoursesPage] Fetching courses from database');
    let courses;
    try {
      courses = await db.course.findMany({
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
        wishlists: user ? {
          where: { userId: user.id },
          select: { id: true },
          take: 1,
        } : false,
        _count: {
          select: {
            Enrollment: true,
            reviews: true,
            chapters: true,
            certifications: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12, // Initial page size
    });
      logger.info('[CoursesPage] Successfully fetched courses', courses.length);
    } catch (dbError) {
      logger.error('[CoursesPage] DATABASE ERROR - Course fetch failed:', dbError);
      logger.error('[CoursesPage] Error details:', {
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        name: dbError instanceof Error ? dbError.name : undefined,
      });
      throw new Error(`Failed to fetch courses: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
    }

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
    logger.info('[CoursesPage] Categories fetched:', categories.length);

    // Get real difficulty counts
    const difficultyCounts = await db.course.groupBy({
      by: ['difficulty'],
      where: { isPublished: true },
      _count: true,
    });
    const difficultyCountMap = new Map<string | null, number>();
    for (const group of difficultyCounts) {
      difficultyCountMap.set(group.difficulty, group._count);
    }
    // Courses with null difficulty are displayed as "Beginner"
    const beginnerCount = (difficultyCountMap.get("Beginner") ?? 0) + (difficultyCountMap.get(null) ?? 0);

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
        subtitle: course.subtitle,
        description: course.description || "",
        imageUrl: course.imageUrl || "/placeholder.svg",
        price: course.price || 0,
        category: {
          id: course.category?.id || "",
          name: course.category?.name || "Uncategorized",
        },
        chaptersCount: course._count.chapters,
        lessonsCount,
        duration: Math.round(totalDuration / 60), // Convert to minutes
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
        completionRate: 0,
        hasCertificate: course._count.certifications > 0,
        hasExercises: course.chapters.length > 0,
        badges,
        isEnrolled,
        isWishlisted: user ? (Array.isArray(course.wishlists) && course.wishlists.length > 0) : false,
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
        { value: "Beginner", label: "Beginner", count: beginnerCount },
        { value: "Intermediate", label: "Intermediate", count: difficultyCountMap.get("Intermediate") ?? 0 },
        { value: "Advanced", label: "Advanced", count: difficultyCountMap.get("Advanced") ?? 0 },
        { value: "Expert", label: "Expert", count: difficultyCountMap.get("Expert") ?? 0 },
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

    logger.info('[CoursesPage] Data ready', {
      coursesCount: transformedCourses.length,
      totalCourses,
      categoriesCount: categories.length,
      hasUser: !!user,
    });

    return {
      courses: transformedCourses,
      filterOptions,
      totalCourses,
      userId: user?.id,
      user: user ? {
        id: user.id,
        name: user.name || null,
        email: user.email || null,
        image: user.image || null,
        role: user.role || null,
      } : null,
    };
  } catch (error) {
    logger.error("[CoursesPage] FATAL ERROR - Data fetch failed:", error);
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
      user: null,
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

// Generate JSON-LD structured data for the courses page
function generateCoursesSchema(courses: Array<{
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  rating: number;
  reviewsCount: number;
  instructor?: { name: string };
  difficulty: string;
}>) {
  // ItemList schema for course catalog
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Taxomind Course Catalog',
    description: 'Browse our growing catalog of AI-powered courses',
    url: `${baseUrl}/courses`,
    numberOfItems: courses.length,
    itemListElement: courses.slice(0, 10).map((course, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Course',
        '@id': `${baseUrl}/courses/${course.id}`,
        name: course.title,
        description: course.description?.slice(0, 200) || course.title,
        url: `${baseUrl}/courses/${course.id}`,
        image: course.imageUrl?.startsWith('http')
          ? course.imageUrl
          : `${baseUrl}${course.imageUrl}`,
        provider: {
          '@type': 'Organization',
          name: 'Taxomind',
          sameAs: baseUrl,
        },
        ...(course.instructor?.name && {
          instructor: {
            '@type': 'Person',
            name: course.instructor.name,
          },
        }),
        ...(course.rating > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: course.rating.toFixed(1),
            ratingCount: course.reviewsCount.toString(),
            bestRating: '5',
            worstRating: '1',
          },
        }),
        offers: {
          '@type': 'Offer',
          price: course.price.toString(),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: `${baseUrl}/courses/${course.id}`,
        },
        educationalLevel: course.difficulty,
        inLanguage: 'en',
        isAccessibleForFree: course.price === 0,
      },
    })),
  };

  // CollectionPage schema
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Taxomind Course Catalog',
    description: 'Browse our growing catalog of courses with AI-powered adaptive learning.',
    url: `${baseUrl}/courses`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: courses.length,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Courses',
          item: `${baseUrl}/courses`,
        },
      ],
    },
  };

  return { itemListSchema, collectionPageSchema };
}

export default async function CoursesPage() {
  const initialData = await getInitialData();
  const { itemListSchema, collectionPageSchema } = generateCoursesSchema(initialData.courses);

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <Script
        id="courses-itemlist-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema),
        }}
      />
      <Script
        id="courses-collection-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionPageSchema),
        }}
      />

      <Suspense fallback={<LoadingSkeleton />}>
        <CoursesPageClient
          initialCourses={initialData.courses}
          filterOptions={initialData.filterOptions}
          totalCourses={initialData.totalCourses}
          userId={initialData.userId || undefined}
          user={initialData.user || undefined}
        />
      </Suspense>
    </>
  );
}

