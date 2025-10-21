"use client";

import { useEffect } from 'react';
import { useSAMGlobal } from '@/sam/components/global/sam-global-provider';

// Import the LearningContext type
interface LearningContext {
  courseId?: string;
  courseName?: string;
  chapterId?: string;
  chapterName?: string;
  sectionId?: string;
  sectionName?: string;
  subject?: string;
  topic?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  progress?: number;
  timeSpent?: number;
  lastActivity?: string;
  learningObjectives?: string[];
  prerequisites?: string[];
  nextSteps?: string[];
}

interface CoursePageContextInjectorProps {
  course?: {
    id: string;
    title: string;
    description?: string | null;
    whatYouWillLearn?: string[];
    isPublished: boolean;
    categoryId?: string | null;
    price?: number | null;
    imageUrl?: string | null;
    attachments?: Array<{
      id: string;
      name: string;
      url: string;
    }>;
    chapters?: Array<{
      id: string;
      title: string;
      description?: string | null;
      position: number;
      isPublished: boolean;
      isFree: boolean;
      sections?: Array<{
        id: string;
        title: string;
        description?: string | null;
        position: number;
        isPublished: boolean;
      }>;
    }>;
    category?: {
      id: string;
      name: string;
    };
    _count?: {
      chapters: number;
      enrollments: number;
      purchases: number;
    };
  };
  chapter?: {
    id: string;
    title: string;
    description?: string | null;
    position: number;
    isPublished: boolean;
    isFree: boolean;
    learningOutcomes?: string | null;
    videoUrl?: string | null;
    courseId: string;
    sections?: Array<{
      id: string;
      title: string;
      description?: string | null;
      position: number;
      isPublished: boolean;
    }>;
  };
  section?: {
    id: string;
    title: string;
    description?: string | null;
    position: number;
    isPublished: boolean;
    chapterId: string;
    videos?: Array<any>;
    blogs?: Array<any>;
    explanations?: Array<any>;
    exams?: Array<any>;
  };
  categories?: Array<{
    id: string;
    name: string;
  }>;
  completionStatus?: {
    titleDesc?: boolean;
    learningObj?: boolean;
    chapters?: boolean;
    price?: boolean;
    category?: boolean;
    image?: boolean;
    attachments?: boolean;
  };
}

export function CoursePageContextInjector({
  course,
  chapter,
  section,
  categories = [],
  completionStatus = {
}
}: CoursePageContextInjectorProps) {
  const { updateContext } = useSAMGlobal();

  useEffect(() => {
    // Determine the primary entity and build context
    let entityType: 'course' | 'chapter' | 'section' = 'course';
    let entityId = '';
    let entityData: any = {};
    let relatedData: any = {};
    let permissions: any = {};
    let workflow: any = {};

    if (section) {
      entityType = 'section';
      entityId = section.id;
      entityData = section;
      relatedData = {
        parent: { chapterId: section.chapterId },
        videos: section.videos || [],
        blogs: section.blogs || [],
        explanations: section.explanations || [],
        exams: section.exams || [],
        stats: {
          videoCount: section.videos?.length || 0,
          blogCount: section.blogs?.length || 0,
          explanationCount: section.explanations?.length || 0,
          examCount: section.exams?.length || 0
        }
      };
      permissions = {
        canEdit: true,
        canDelete: true,
        canPublish: !section.isPublished,
        canUnpublish: section.isPublished
      };
    } else if (chapter) {
      entityType = 'chapter';
      entityId = chapter.id;
      entityData = chapter;
      relatedData = {
        parent: { courseId: chapter.courseId },
        children: chapter.sections || [],
        stats: {
          sectionCount: chapter.sections?.length || 0,
          publishedSections: chapter.sections?.filter(s => s.isPublished).length || 0,
          hasVideo: Boolean(chapter.videoUrl),
          hasLearningOutcomes: Boolean(chapter.learningOutcomes)
        }
      };
      permissions = {
        canEdit: true,
        canDelete: true,
        canPublish: !chapter.isPublished,
        canUnpublish: chapter.isPublished
      };
    } else if (course) {
      entityType = 'course';
      entityId = course.id;
      entityData = course;
      relatedData = {
        children: course.chapters || [],
        attachments: course.attachments || [],
        category: course.category,
        categories: categories,
        stats: {
          chapterCount: course._count?.chapters || course.chapters?.length || 0,
          publishedChapters: course.chapters?.filter(c => c.isPublished).length || 0,
          enrollmentCount: course._count?.enrollments || 0,
          purchaseCount: course._count?.purchases || 0,
          hasLearningObjectives: Boolean(course.whatYouWillLearn?.length),
          hasImage: Boolean(course.imageUrl),
          hasCategory: Boolean(course.categoryId),
          hasPrice: Boolean(course.price),
          hasAttachments: Boolean(course.attachments?.length)
        }
      };
      permissions = {
        canEdit: true,
        canDelete: true,
        canPublish: !course.isPublished && isReadyToPublish(course, completionStatus),
        canUnpublish: course.isPublished
      };
      
      // Build workflow context for course
      workflow = buildCourseWorkflow(course, completionStatus);
    }

    // Build metadata with capabilities
    const capabilities = buildCapabilities(entityType, entityData, relatedData, permissions);

    // Inject comprehensive context based on LearningContext interface
    const contextUpdate: Partial<LearningContext> = {};
    
    if (course) {
      contextUpdate.courseId = course.id;
      contextUpdate.courseName = course.title;
      contextUpdate.subject = course.category?.name;
    }
    
    if (chapter) {
      contextUpdate.chapterId = chapter.id;
      contextUpdate.chapterName = chapter.title;
    }
    
    if (section) {
      contextUpdate.sectionId = section.id;
      contextUpdate.sectionName = section.title;
    }

    updateContext(contextUpdate);

  }, [course, chapter, section, categories, completionStatus, updateContext]);

  return null; // This component doesn't render anything
}

function isReadyToPublish(course: any, completionStatus: any): boolean {
  // Check if course meets minimum requirements for publishing
  return Boolean(
    course.title &&
    course.description &&
    course.categoryId &&
    (course.chapters?.length || 0) > 0 &&
    course.whatYouWillLearn?.length &&
    course.imageUrl
  );
}

function buildCourseWorkflow(course: any, completionStatus: any): any {
  const steps = [
    'Basic Info',
    'Learning Objectives', 
    'Chapters',
    'Pricing & Category',
    'Course Image',
    'Review & Publish'
  ];

  const completed: string[] = [];
  let currentStep = 0;
  let nextAction = '';

  // Check each step completion
  if (course.title && course.description) {
    completed.push('Basic Info');
    currentStep = Math.max(currentStep, 1);
  }

  if (course.whatYouWillLearn?.length) {
    completed.push('Learning Objectives');
    currentStep = Math.max(currentStep, 2);
  }

  if (course.chapters?.length) {
    completed.push('Chapters');
    currentStep = Math.max(currentStep, 3);
  }

  if (course.categoryId && (course.price !== null)) {
    completed.push('Pricing & Category');
    currentStep = Math.max(currentStep, 4);
  }

  if (course.imageUrl) {
    completed.push('Course Image');
    currentStep = Math.max(currentStep, 5);
  }

  if (completed.length === steps.length - 1) {
    currentStep = 5; // Ready for review
  }

  // Determine next action
  if (!course.title || !course.description) {
    nextAction = 'add-title-description';
  } else if (!course.whatYouWillLearn?.length) {
    nextAction = 'add-learning-objectives';
  } else if (!course.chapters?.length) {
    nextAction = 'create-first-chapter';
  } else if (!course.categoryId) {
    nextAction = 'set-category-price';
  } else if (!course.imageUrl) {
    nextAction = 'add-course-image';
  } else if (!course.isPublished) {
    nextAction = 'publish-course';
  }

  const blockers: string[] = [];
  if (!course.title) blockers.push('Course title is required');
  if (!course.description) blockers.push('Course description is required');
  if (!course.categoryId) blockers.push('Course category is required');
  if (!course.chapters?.length) blockers.push('At least one chapter is required');

  return {
    currentStep,
    totalSteps: steps.length,
    completedSteps: completed,
    nextAction,
    blockers,
    progress: Math.round((completed.length / (steps.length - 1)) * 100)
  };
}

function buildCapabilities(
  entityType: string, 
  entityData: any, 
  relatedData: any, 
  permissions: any
): string[] {
  const capabilities: string[] = [];

  // Common capabilities
  capabilities.push('content-generation', 'form-assistance', 'navigation');

  // Entity-specific capabilities
  switch (entityType) {
    case 'course':
      capabilities.push(
        'learning-objectives-generation',
        'course-structure-analysis',
        'chapter-creation',
        'title-generation',
        'description-improvement'
      );
      
      if (permissions.canPublish) {
        capabilities.push('course-publishing');
      }
      
      if (!entityData.whatYouWillLearn?.length) {
        capabilities.push('bloom-taxonomy-generation');
      }
      
      if (relatedData.stats.chapterCount === 0) {
        capabilities.push('course-outline-creation');
      }
      break;

    case 'chapter':
      capabilities.push(
        'section-creation',
        'learning-outcomes-generation',
        'chapter-content-generation',
        'video-management'
      );
      
      if (relatedData.stats.sectionCount === 0) {
        capabilities.push('section-outline-creation');
      }
      break;

    case 'section':
      capabilities.push(
        'video-content-creation',
        'blog-creation',
        'explanation-creation',
        'exam-creation',
        'resource-management'
      );
      break;
  }

  // Permission-based capabilities
  if (permissions.canEdit) {
    capabilities.push('content-editing', 'metadata-editing');
  }

  if (permissions.canDelete) {
    capabilities.push('content-deletion');
  }

  return [...new Set(capabilities)];
}

function buildRelatedPages(
  entityType: string,
  entityId: string,
  course?: any,
  chapter?: any
): Array<{ label: string; url: string }> {
  const pages: Array<{ label: string; url: string }> = [];

  if (entityType === 'section' && chapter && course) {
    pages.push(
      { label: 'Back to Chapter', url: `/teacher/courses/${course.id}/chapters/${chapter.id}` },
      { label: 'Back to Course', url: `/teacher/courses/${course.id}` }
    );
  } else if (entityType === 'chapter' && course) {
    pages.push(
      { label: 'Back to Course', url: `/teacher/courses/${course.id}` },
      { label: 'Course Analytics', url: `/teacher/courses/${course.id}/analytics` }
    );
  } else if (entityType === 'course') {
    pages.push(
      { label: 'All Courses', url: '/teacher/courses' },
      { label: 'Course Analytics', url: `/teacher/courses/${entityId}/analytics` },
      { label: 'Create New Course', url: '/teacher/create' }
    );
  }

  return pages;
}