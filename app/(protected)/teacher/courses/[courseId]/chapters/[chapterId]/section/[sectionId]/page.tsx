import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Suspense } from "react";
import { EnterpriseSectionPageClient } from "./_components/enterprise-section-page-client";
import { logger } from '@/lib/logger';
import { z } from "zod";
import { type SectionData } from "./_components/enterprise-section-types";
import { SectionLoadingSkeleton } from "./_components/section-loading-skeleton";

// Disable caching for this page to ensure fresh data after mutations
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Input validation schema
const SectionPageParamsSchema = z.object({
  courseId: z.string().uuid("Invalid course ID format"),
  chapterId: z.string().uuid("Invalid chapter ID format"),
  sectionId: z.string().uuid("Invalid section ID format"),
});

// Async data fetching component (Server Component)
async function SectionContent(props: {
  params: { courseId: string; chapterId: string; sectionId: string }
}) {
  const { params } = props;

  try {
    const user = await currentUser();

    if (!user?.id) {
      redirect("/");
    }

    // OPTIMIZED: Single query with authorization check built-in
    const sectionData = await db.section.findFirst({
    where: {
      id: params.sectionId,
      chapterId: params.chapterId,
      chapter: {
        courseId: params.courseId,
        course: {
          userId: user.id,
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

    if (!sectionData) {
      logger.error("Section not found or user unauthorized");
      redirect("/teacher/courses");
    }

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

    return (
      <EnterpriseSectionPageClient
        section={section}
        chapter={section.chapter}
        params={params}
      />
    );
  } catch (error) {
    // Log detailed error for debugging (shows in server logs)
    console.error("❌ SectionContent Error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      params,
    });
    logger.error("Section page error", { error, params });

    // Re-throw to let error.tsx handle it
    throw error;
  }
}

// Main page component
const SectionIdPage = async (
  props: {
    params: Promise<{ courseId: string; chapterId: string; sectionId: string }>
  }
) => {
  const rawParams = await props.params;

  // Validate input parameters
  try {
    const validatedParams = SectionPageParamsSchema.parse(rawParams);

    // Wrap async content in Suspense for proper Next.js 15 streaming
    // error.tsx handles Server Component errors automatically
    return (
      <Suspense fallback={<SectionLoadingSkeleton />}>
        <SectionContent params={validatedParams} />
      </Suspense>
    );
  } catch (error) {
    console.error("Invalid section page parameters:", error);
    redirect("/teacher/courses");
  }
}

export default SectionIdPage;
