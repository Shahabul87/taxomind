/**
 * Course Page Type Definitions
 * Shared types for course page components
 */

export interface BaseCourse {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  subtitle: string | null;
  difficulty: string | null;
  price: number | null;
  isPublished: boolean;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: string;
    name: string;
  } | null;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  chapters?: CourseChapter[];
  reviews?: CourseReview[];
  _count?: {
    Enrollment: number;
  };
}

export interface CourseChapter {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  sections?: ChapterSection[];
}

export interface ChapterSection {
  id: string;
  title: string;
  position: number;
  isPublished: boolean;
}

export interface CourseReview {
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
}

export interface EnrollmentStatus {
  userId: string;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}
