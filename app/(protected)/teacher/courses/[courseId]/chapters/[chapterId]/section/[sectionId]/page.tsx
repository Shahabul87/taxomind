import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Suspense } from "react";
import { EnterpriseSectionPageClient } from "./_components/enterprise-section-page-client";
import { SectionErrorBoundary } from "./_components/section-error-boundary";
import { logger } from '@/lib/logger';
import { z } from "zod";
import { type SectionData } from "./_components/enterprise-section-types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Disable caching for this page to ensure fresh data after mutations
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Input validation schema
const SectionPageParamsSchema = z.object({
  courseId: z.string().uuid("Invalid course ID format"),
  chapterId: z.string().uuid("Invalid chapter ID format"),
  sectionId: z.string().uuid("Invalid section ID format"),
});

const SectionIdPage = async (
  props: {
    params: Promise<{ courseId: string; chapterId: string; sectionId: string }>
  }
) => {
  const rawParams = await props.params;
  const user = await currentUser();

  if (!user?.id) {
      return redirect("/");
    }

  // Validate input parameters
  let params: z.infer<typeof SectionPageParamsSchema>;
  try {
    params = SectionPageParamsSchema.parse(rawParams);
  } catch (error) {
    console.error("Invalid section page parameters:", error);
    return redirect("/teacher/courses");
  }

  // OPTIMIZED: Single query with authorization check built-in
  // Combines 3 separate queries into 1 for better performance
  const sectionData = await db.section.findFirst({
    where: {
      id: params.sectionId,
      chapterId: params.chapterId,
      chapter: {
        courseId: params.courseId,
        course: {
          userId: user.id, // Authorization: Verify user owns this course
        },
      },
    },
    include: {
      videos: true,
      blogs: true,
      articles: true,
      notes: true,
      codeExplanations: {
        select: {
          id: true,
          title: true,
          code: true,
          explanation: true,
        },
      },
      mathExplanations: {
        select: {
          id: true,
          title: true,
          content: true,
          latex: true,
          latexEquation: true,
          equation: true,
          imageUrl: true,
          mode: true,
          explanation: true,
          isPublished: true,
          position: true,
        },
      },
      chapter: {
        include: {
          sections: {
            orderBy: {
              position: "asc",
            },
            include: {
              videos: true,
              blogs: true,
              articles: true,
              notes: true,
              codeExplanations: true,
              mathExplanations: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              userId: true,
            },
          },
        },
      },
    },
  });

  // Authorization check: If no section found, user doesn't own this course
  if (!sectionData) {
    logger.error("Section not found or user unauthorized");
    return redirect("/teacher/courses");
  }

  // Extract data from optimized query and transform to match expected types
  const section: SectionData = {
    ...sectionData,
    videos: sectionData.videos.filter((v): v is typeof v & { url: string } => v.url !== null),
    chapter: {
      ...sectionData.chapter,
      sections: sectionData.chapter.sections.map(s => ({
        ...s,
        videos: (s.videos || []).filter((v): v is typeof v & { url: string } => v.url !== null),
        blogs: (s.blogs || []).filter((b): b is typeof b & { url: string } => b.url !== null),
        articles: (s.articles || []).filter((a): a is typeof a & { url: string } => a.url !== null),
        notes: s.notes || [],
      }))
    }
  };
  const chapter = section.chapter;

  // Wrap with error boundary and Suspense for enterprise-grade experience
  // Suspense boundary prevents React async cleanup errors in client components
  return (
    <SectionErrorBoundary>
      <Suspense fallback={<SectionPageLoadingSkeleton />}>
        <EnterpriseSectionPageClient
          section={section}
          chapter={chapter}
          params={params}
        />
      </Suspense>
    </SectionErrorBoundary>
  );
}

// Loading skeleton component for better UX during Suspense
const SectionPageLoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-800/70 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-64" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
        <div className="h-1 bg-gray-200/70 dark:bg-gray-800/70">
          <Skeleton className="h-full w-1/3" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Header Card */}
        <Card className="mb-6">
          <CardHeader className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Two Column Grid Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Interactive Materials Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SectionIdPage;
