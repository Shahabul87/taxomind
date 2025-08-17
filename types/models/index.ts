/**
 * Database Model Types
 * Extended type definitions for Prisma models
 */

import { 
  User, 
  Course, 
  Chapter, 
  Section, 
  Enrollment, 
  Purchase,
  Category,
  Attachment,
  CourseReview,
  Post,
  Comment,
  Reply
} from '@prisma/client';

/**
 * Course with Relations
 */
export interface CourseWithRelations extends Course {
  user?: User;
  category?: Category | null;
  chapters?: ChapterWithRelations[];
  attachments?: Attachment[];
  purchases?: Purchase[];
  enrollments?: Enrollment[];
  reviews?: CourseReview[];
  _count?: {
    chapters: number;
    enrollments: number;
    purchases: number;
    reviews: number;
  };
}

/**
 * Chapter with Relations
 */
export interface ChapterWithRelations extends Chapter {
  course?: Course;
  sections?: SectionWithRelations[];
  userProgress?: any[]; // Define UserProgress type when available
  _count?: {
    sections: number;
    userProgress: number;
  };
}

/**
 * Section with Relations
 */
export interface SectionWithRelations extends Section {
  chapter?: Chapter;
  course?: Course;
  _count?: {
    userProgress: number;
  };
}

/**
 * User with Relations
 */
export interface UserWithRelations extends User {
  courses?: Course[];
  enrollments?: EnrollmentWithRelations[];
  purchases?: Purchase[];
  posts?: Post[];
  comments?: Comment[];
  _count?: {
    courses: number;
    enrollments: number;
    purchases: number;
  };
}

/**
 * Enrollment with Relations
 */
export interface EnrollmentWithRelations extends Enrollment {
  Course?: CourseWithRelations;
  User?: UserWithRelations;
}

/**
 * Post with Relations
 */
export interface PostWithRelations extends Post {
  author?: User;
  postChapters?: Array<{
    id: string;
    title: string;
    content?: string;
    position: number;
    postId: string;
  }>;
  comments?: CommentWithRelations[];
  _count?: {
    postChapters: number;
    comments: number;
  };
}

/**
 * PostChapter with Relations (removed - not in Prisma schema)
 */

/**
 * Comment with Relations
 */
export interface CommentWithRelations extends Comment {
  user?: User;
  post?: Post;
  replies?: ReplyWithRelations[];
  parentReply?: Reply | null;
  _count?: {
    replies: number;
  };
}

/**
 * Reply with Relations
 */
export interface ReplyWithRelations extends Reply {
  user?: User;
  comment?: Comment;
  parentReply?: Reply | null;
  childReplies?: Reply[];
}

/**
 * Course Query Options
 */
export interface CourseQueryOptions {
  includeUser?: boolean;
  includeCategory?: boolean;
  includeChapters?: boolean;
  includeAttachments?: boolean;
  includePurchases?: boolean;
  includeEnrollments?: boolean;
  includeReviews?: boolean;
  includeCounts?: boolean;
}

/**
 * Course Filter Options
 */
export interface CourseFilterOptions {
  categoryId?: string;
  userId?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  isFree?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  level?: string;
  language?: string;
}

/**
 * User Progress
 */
export interface UserProgress {
  id: string;
  userId: string;
  courseId: string;
  chapterId?: string;
  sectionId?: string;
  isCompleted: boolean;
  progress: number;
  lastAccessedAt: Date;
  completedAt?: Date | null;
}

/**
 * Learning Path
 */
export interface LearningPath {
  id: string;
  userId: string;
  title: string;
  description?: string;
  courses: Course[];
  targetCompletionDate?: Date;
  progress: number;
  isActive: boolean;
}

/**
 * Analytics Data
 */
export interface AnalyticsData {
  userId?: string;
  courseId?: string;
  totalViews: number;
  uniqueViews: number;
  averageProgress: number;
  completionRate: number;
  averageTimeSpent: number;
  lastUpdated: Date;
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  userId: string;
  type: 'course_update' | 'new_comment' | 'enrollment' | 'achievement' | 'system';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date | null;
}

/**
 * Achievement
 */
export interface Achievement {
  id: string;
  userId: string;
  type: string;
  name: string;
  description: string;
  iconUrl?: string;
  earnedAt: Date;
  courseId?: string;
  metadata?: Record<string, unknown>;
}