"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSAMPageContext } from '@sam-ai/react';

interface CourseSamContextProps {
  course: {
    id: string;
    title: string;
    description?: string | null;
    whatYouWillLearn?: string[];
    isPublished?: boolean;
    categoryId?: string | null;
    price?: number | null;
    imageUrl?: string | null;
    chapters?: Array<{
      id: string;
      title: string;
      description?: string | null;
      isPublished?: boolean;
      isFree?: boolean;
      position?: number;
      sections?: Array<{
        id: string;
        title: string;
        isPublished?: boolean;
      }>;
    }>;
  };
}

export function CourseSamContext({ course }: CourseSamContextProps) {
  const { updatePage } = useSAMPageContext();
  const pathname = usePathname();

  useEffect(() => {
    if (!course?.id) return;

    updatePage({
      type: 'course-detail',
      path: pathname ?? `/courses/${course.id}`,
      entityId: course.id,
      metadata: {
        entityType: 'course',
        entityData: {
          title: course.title,
          description: course.description ?? null,
          whatYouWillLearn: course.whatYouWillLearn ?? [],
          learningObjectives: course.whatYouWillLearn ?? [],
          isPublished: course.isPublished ?? false,
          categoryId: course.categoryId ?? null,
          price: course.price ?? null,
          imageUrl: course.imageUrl ?? null,
          chapterCount: course.chapters?.length ?? 0,
          chapters: course.chapters?.map((chapter, index) => ({
            id: chapter.id,
            title: chapter.title || `Chapter ${index + 1}`,
            description: chapter.description ?? null,
            isPublished: chapter.isPublished ?? false,
            isFree: chapter.isFree,
            position: chapter.position ?? index,
            sectionCount: chapter.sections?.length ?? 0,
            sections: chapter.sections?.map((section) => ({
              id: section.id,
              title: section.title,
              isPublished: section.isPublished ?? false,
            })) ?? [],
          })) ?? [],
        },
        courseId: course.id,
        courseTitle: course.title,
      },
    });
  }, [course, pathname, updatePage]);

  return null;
}

export default CourseSamContext;
