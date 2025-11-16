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

    // SIMPLIFIED: Split into focused queries to avoid serialization issues
    // Query 1: Get section with its direct relations only
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
        videos: {
          select: {
            id: true,
            title: true,
            url: true,
            duration: true,
            thumbnail: true,
            description: true,
            position: true,
          },
        },
        blogs: {
          select: {
            id: true,
            title: true,
            url: true,
            description: true,
            author: true,
            position: true,
            thumbnail: true,
          },
        },
        articles: {
          select: {
            id: true,
            title: true,
            content: true,
            url: true,
            source: true,
            summary: true,
          },
        },
        notes: {
          select: {
            id: true,
            title: true,
            content: true,
            position: true,
            isImportant: true,
            category: true,
          },
        },
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
          select: {
            id: true,
            title: true,
            position: true,
            isPublished: true,
            isFree: true,
            courseId: true,
            createdAt: true,
            updatedAt: true,
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

    // Query 2: Get chapter sections separately (lightweight)
    const chapterSections = await db.section.findMany({
      where: {
        chapterId: params.chapterId,
      },
      orderBy: {
        position: "asc",
      },
      select: {
        id: true,
        title: true,
        position: true,
        isPublished: true,
        isFree: true,
        videoUrl: true,
        // Only include counts, not full relations
        _count: {
          select: {
            videos: true,
            blogs: true,
            articles: true,
            notes: true,
            codeExplanations: true,
            mathExplanations: true,
          },
        },
      },
    });

    // Construct the section data with simplified structure
    const section: SectionData = {
      ...sectionData,
      videos: (sectionData.videos || []).filter((v): v is typeof v & { url: string } => v.url !== null),
      blogs: (sectionData.blogs || []).filter((b): b is typeof b & { url: string | null } => b.url !== null),
      articles: (sectionData.articles || []).filter((a): a is typeof a & { url: string | null } => a.url !== null),
      notes: sectionData.notes || [],
      codeExplanations: sectionData.codeExplanations || [],
      mathExplanations: sectionData.mathExplanations || [],
      chapter: {
        ...sectionData.chapter,
        course: sectionData.chapter.course,
        // Use the lightweight sections from separate query
        sections: chapterSections.map(s => ({
          ...s,
          description: null,
          learningObjectives: null,
          videos: [],
          blogs: [],
          articles: [],
          notes: [],
          codeExplanations: [],
          mathExplanations: [],
          chapterId: params.chapterId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      },
    };

    // Deep-serialize all Date instances to ISO strings to satisfy RSC serialization in production
    const serializeDates = (value: unknown): any => {
      if (value instanceof Date) return value.toISOString();
      if (Array.isArray(value)) return value.map(serializeDates);
      if (value && typeof value === 'object') {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(value as Record<string, any>)) {
          out[k] = serializeDates(v);
        }
        return out;
      }
      return value;
    };

    const serializedSection = serializeDates(section) as SectionData;

    return (
      <EnterpriseSectionPageClient
        section={serializedSection}
        chapter={serializedSection.chapter}
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
