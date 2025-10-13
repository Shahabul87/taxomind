import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Suspense } from "react";
import { EnterpriseSectionPageClient } from "./_components/enterprise-section-page-client";
import { SectionErrorBoundary } from "./_components/section-error-boundary";
import { SectionLoadingSkeleton } from "./_components/section-loading-skeleton";
import { logger } from '@/lib/logger';
import { z } from "zod";
import { type SectionData } from "./_components/enterprise-section-types";

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
          heading: true,
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
          equation: true,
          imageUrl: true,
          mode: true,
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
        videos: s.videos.filter((v): v is typeof v & { url: string } => v.url !== null)
      }))
    }
  };
  const chapter = section.chapter;

  // Wrap with error boundary and suspense for enterprise-grade experience
  return (
    <SectionErrorBoundary>
      <Suspense fallback={<SectionLoadingSkeleton />}>
        <EnterpriseSectionPageClient
          section={section}
          chapter={chapter}
          params={params}
        />
      </Suspense>
    </SectionErrorBoundary>
  );
}

export default SectionIdPage;
