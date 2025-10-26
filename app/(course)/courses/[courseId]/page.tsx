import { notFound } from "next/navigation";
import { Metadata } from "next";

import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { currentUser } from '@/lib/auth';
import CourseCard from "./course-feature";
import { CourseTabsDemo } from "./course-tab-demo";
// Course page uses a dedicated enterprise footer (no logo icon)
import { CourseFooterEnterprise } from "./_components/course-footer-enterprise";
import { CourseContent } from "./course-content";
import ConditionalHeader from "@/app/(homepage)/user-header";
import { CourseCardsCarousel } from "./course-card-carousel";
import GradientHeading from "./_components/gradient-heading";
import { CourseReviews } from "./_components/course-reviews";
import { EnrollButton } from "./_components/enroll-button";
import { CourseOutcomes } from "./_components/course-outcomes";
import { CoursePageTabs } from "./_components/course-page-tabs";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type CourseReview = {
  id: string;
  rating: number;
  comment: string;
  courseId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

type Props = {
  params: Promise<{ courseId: string }>
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const courseId = await Promise.resolve(params.courseId);

  const course = await db.course.findUnique({
    where: {
      id: courseId,
    }
  });

  const title = course?.title ?? "Course Details | SkillHub";
  const description = course?.description ?? "Learn new skills with our detailed courses";
  const image = (course as any)?.imageUrl || (course as any)?.image || "/logo.png";
  const url = `/courses/${courseId}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: [{ url: image }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image]
    }
  };
}

const CourseIdPage = async (props: {params: Promise<{ courseId: string; }>}): Promise<JSX.Element> => {
  const params = await props.params;
  const courseId = await Promise.resolve(params.courseId);

  const course = await db.course.findUnique({
    where: {
      id: courseId,
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
      reviews: true,
      chapters: {
        where: {
          isPublished: true,
        },
        orderBy: {
          position: "asc",
        },
        include: {
          sections: true,
        },
      },
      _count: {
        select: {
          Enrollment: true,
        },
      },
    },
  });

  const user = await currentUser();

  if (!course) return notFound();

  // Check if user is enrolled in this course
  let enrollment = null;
  if (user?.id) {
    try {
      enrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: courseId,
          },
        },
      });
    } catch (error: unknown) {
      logger.error("Error checking enrollment:", error);
    }
  }

  const chapters = course?.chapters ?? [];

  // Fetch initial reviews with error handling
  let reviews: CourseReview[] = [];
  try {
    reviews = await db.courseReview.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error: unknown) {
    logger.error("Error fetching reviews:", error);
    // Continue with empty reviews array
  }

  // JSON-LD Course schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: 'SkillHub',
      sameAs: 'https://taxomind.com'
    },
    image: (course as any)?.imageUrl || (course as any)?.image || undefined,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: course.difficulty || 'All Levels',
      startDate: course.createdAt?.toISOString?.() || undefined,
      endDate: course.updatedAt?.toISOString?.() || undefined
    },
    aggregateRating: (course.reviews?.length || 0) > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: Number(((course.reviews || []).reduce((a, r) => a + (r.rating || 0), 0) / (course.reviews || []).length).toFixed(1)),
      reviewCount: (course.reviews || []).length
    } : undefined,
    offers: (course as any)?.price ? {
      '@type': 'Offer',
      price: (course as any)?.price,
      priceCurrency: (course as any)?.currency || 'USD',
      availability: 'https://schema.org/InStock'
    } : undefined
  };

  return (
    <div className="relative pt-4 md:pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Fixed Theme Toggle Button - Top Right Corner */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <CourseCard
        course={course as any}
        userId={user?.id}
        isEnrolled={!!enrollment}
      />

      <div className="mt-12">
        <CoursePageTabs
          course={course as any}
          chapters={chapters}
          courseId={courseId}
          initialReviews={reviews}
          isEnrolled={!!enrollment}
          userId={user?.id}
        />
      </div>

      <CourseFooterEnterprise />
    </div>
  )
}
 
export default CourseIdPage;
