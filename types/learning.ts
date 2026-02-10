import { Prisma } from '@prisma/client';

/**
 * User with basic relations for learning interface
 */
export type UserWithRelations = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  isTwoFactorEnabled?: boolean;
  isOAuth?: boolean;
};

/**
 * Section with all learning-related data
 */
export type SectionWithProgress = Prisma.SectionGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
    learningObjectives: true;
    videoUrl: true;
    type: true;
    duration: true;
    position: true;
    isPublished: true;
    isFree: true;
    isPreview: true;
    completionStatus: true;
    resourceUrls: true;
    chapterId: true;
    createdAt: true;
    updatedAt: true;
    user_progress: true;
    videos: true;
    blogs: true;
    articles: true;
    notes: true;
    codeExplanations: true;
    mathExplanations: true;
    exams: true;
  };
}>;

/**
 * Chapter with all sections and their progress
 */
export type ChapterWithSections = Prisma.ChapterGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
    position: true;
    isPublished: true;
    sections: {
      select: {
        id: true;
        title: true;
        description: true;
        learningObjectives: true;
        videoUrl: true;
        type: true;
        duration: true;
        position: true;
        isPublished: true;
        isFree: true;
        isPreview: true;
        completionStatus: true;
        resourceUrls: true;
        chapterId: true;
        createdAt: true;
        updatedAt: true;
        user_progress: true;
        videos: true;
        blogs: true;
        articles: true;
        notes: true;
        codeExplanations: true;
        mathExplanations: true;
        exams: true;
      };
    };
  };
}>;

/**
 * Course with chapters and sections
 */
export type CourseWithChapters = Prisma.CourseGetPayload<{
  include: {
    chapters: {
      include: {
        sections: {
          select: {
            id: true;
            title: true;
            description: true;
            learningObjectives: true;
            videoUrl: true;
            type: true;
            duration: true;
            position: true;
            isPublished: true;
            isFree: true;
            isPreview: true;
            completionStatus: true;
            resourceUrls: true;
            chapterId: true;
            createdAt: true;
            updatedAt: true;
            user_progress: true;
            videos: true;
            blogs: true;
            articles: true;
            notes: true;
            codeExplanations: true;
            mathExplanations: true;
            exams: true;
          };
        };
      };
    };
  };
}>;

/**
 * User progress with all tracking data
 * Uses full model since getUserProgress returns without select
 */
export type UserProgressData = Prisma.user_progressGetPayload<{}>;

/**
 * Enrollment data
 */
export type EnrollmentData = Prisma.EnrollmentGetPayload<{
  select: {
    id: true;
    userId: true;
    courseId: true;
    enrolledAt: true;
    status: true;
  };
}>;

/**
 * Next chapter section helper type
 */
export interface NextChapterSection {
  section: SectionWithProgress;
  chapter: ChapterWithSections;
}
