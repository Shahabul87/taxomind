import { Suspense } from 'react';
import { Metadata } from 'next';
import { currentUser } from '@/lib/auth';

// New architecture imports
import { getCourseData, getEnrollmentStatus } from './_lib/data-fetchers';
import { generateCourseMetadata, generateCourseJsonLd, generateBreadcrumbJsonLd, generateFAQJsonLd } from './_lib/metadata-generator';
import { getCategoryLayout } from './_config/category-layouts';

// Component imports
import { CourseFooterEnterprise } from './_components/course-footer-enterprise';
import { CoursePageTabs } from './_components/course-page-tabs';
import { SimilarCoursesSection } from './_components/similar-courses-section';
import { MobileEnrollBar } from './_components/mobile-enroll-bar';
import { StickyMiniHeader } from './_components/sticky-mini-header';
import { HeroWrapper } from './_components/hero-wrapper';
import { CourseSamContext } from './_components/course-sam-context';

type Props = {
  params: Promise<{ courseId: string }>;
};

/**
 * Generate metadata for SEO using new metadata generator
 */
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  return generateCourseMetadata(params.courseId);
}

/**
 * Main Course Page Component (Server Component)
 * Uses new scalable architecture with category-specific rendering
 */
const CourseIdPage = async (props: { params: Promise<{ courseId: string }> }): Promise<JSX.Element> => {
  const params = await props.params;
  const courseId = params.courseId;

  // Parallel data fetching for optimal performance
  const [course, user] = await Promise.all([
    getCourseData(courseId),
    currentUser(),
  ]);

  // Check enrollment status
  const enrollment = await getEnrollmentStatus(user?.id, courseId);

  // Get category-specific configuration
  const categoryLayout = getCategoryLayout(course.category?.name);

  // Generate structured data for SEO
  const jsonLd = generateCourseJsonLd(course);
  const breadcrumbLd = generateBreadcrumbJsonLd(course);
  const faqLd = generateFAQJsonLd(course);

  // Get category-specific props for hero
  const getCategorySpecificProps = () => {
    switch (categoryLayout.variant) {
      case 'programming':
        return { techStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'] };
      case 'ai-ml':
      case 'data-science':
        return { models: ['CNN', 'RNN', 'Transformers', 'BERT'] };
      case 'design':
        return { tools: ['Figma', 'Adobe XD', 'Sketch', 'Framer'] };
      case 'math':
        return { topics: ['Calculus', 'Linear Algebra', 'Statistics', 'Proofs'] };
      default:
        return {};
    }
  };

  const samCourseContext = {
    id: course.id,
    title: course.title,
    description: course.description ?? null,
    whatYouWillLearn: course.whatYouWillLearn ?? [],
    isPublished: course.isPublished ?? false,
    categoryId: course.categoryId ?? null,
    price: course.price ?? null,
    imageUrl: course.imageUrl ?? null,
    chapters: (course.chapters || []).map((chapter: any, index: number) => ({
      id: chapter.id,
      title: chapter.title || `Chapter ${index + 1}`,
      description: chapter.description ?? null,
      isPublished: chapter.isPublished ?? false,
      isFree: chapter.isFree ?? false,
      position: chapter.position ?? index,
      sections: (chapter.sections || []).map((section: any) => ({
        id: section.id,
        title: section.title,
        isPublished: section.isPublished ?? false,
      })),
    })),
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 overflow-x-hidden">
      <CourseSamContext course={samCourseContext} />
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      {/* Sticky Mini Header */}
      <StickyMiniHeader
        course={course as any}
        isEnrolled={!!enrollment}
      />

      {/* Category-Specific Hero - Using Client Wrapper for Enrollment */}
      <HeroWrapper
        variant={categoryLayout.variant}
        course={course}
        isEnrolled={!!enrollment}
        userId={user?.id}
        categorySpecificProps={getCategorySpecificProps()}
      />

      {/* Mobile Enroll Bar */}
      <MobileEnrollBar
        course={course as any}
        isEnrolled={!!enrollment}
      />

      {/* Tabs Section with Streaming */}
      <div className="relative z-30 -mt-16 sm:-mt-20 md:-mt-24">
        <Suspense fallback={<div className="h-96 animate-pulse bg-white/50 dark:bg-slate-800/50 rounded-2xl" />}>
          <CoursePageTabs
            course={course as any}
            chapters={(course.chapters || []) as any}
            courseId={courseId}
            initialReviews={(course.reviews || []) as any}
            isEnrolled={!!enrollment}
            userId={user?.id}
          />
        </Suspense>
      </div>

      {/* Similar Courses with Streaming */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-transparent" />}>
        <SimilarCoursesSection
          courseId={courseId}
          categoryId={course.categoryId}
        />
      </Suspense>

      <CourseFooterEnterprise />
    </div>
  );
};

export default CourseIdPage;
