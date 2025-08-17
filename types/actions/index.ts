/**
 * Type definitions for server actions and their return types
 */

import { Course, Post, User, Category, Enrollment, Purchase } from '@prisma/client';

/**
 * Standard action result with typed data and error
 */
export interface ActionResult<T> {
  data?: T;
  error?: string | null;
  success?: boolean;
}

/**
 * Async action result type
 */
export type AsyncActionResult<T> = Promise<ActionResult<T>>;

/**
 * Paginated action result
 */
export interface PaginatedActionResult<T> extends ActionResult<T[]> {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Course with relations for actions
 */
export interface CourseWithRelations extends Course {
  category: Category | null;
  user?: User;
  Purchase?: Purchase[];
  Enrollment?: Enrollment[];
  chapters?: Array<{
    id: string;
    title: string;
    position: number;
    isPublished: boolean;
    isFree: boolean;
    courseId: string;
    sections?: Array<{
      id: string;
      title: string;
      chapterId: string;
    }>;
  }>;
  _count?: {
    Purchase?: number;
    Enrollment?: number;
    reviews?: number;
    chapters?: number;
  };
}

/**
 * Post with relations for actions
 */
export interface PostWithRelations extends Post {
  user?: User;
  category?: {
    id: string;
    name: string;
  } | null;
  postchapters?: Array<{
    id: string;
    title: string;
    content?: string;
    position: number;
    postId: string;
  }>;
  _count?: {
    postchapters?: number;
    comments?: number;
    likes?: number;
  };
}

/**
 * Progress data structure
 */
export interface ProgressData {
  courseId: string;
  userId: string;
  percentage: number;
  isCompleted: boolean;
  lastAccessedAt?: Date;
  chapterProgress?: Array<{
    chapterId: string;
    isCompleted: boolean;
    percentage: number;
  }>;
  sectionProgress?: Array<{
    sectionId: string;
    isCompleted: boolean;
    percentage: number;
  }>;
}

/**
 * Dashboard course with progress
 */
export interface DashboardCourse extends CourseWithRelations {
  progress?: ProgressData | null;
  completedChapters?: number;
  totalChapters?: number;
}

/**
 * Simple post for optimized queries
 */
export interface SimplePost {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  isPublished: boolean;
  createdAt: Date;
  userId: string;
  categoryId?: string | null;
}

/**
 * Analytics data structure
 */
export interface AnalyticsData {
  totalRevenue: number;
  totalSales: number;
  totalStudents: number;
  courseMetrics: Array<{
    courseId: string;
    title: string;
    revenue: number;
    sales: number;
    students: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
  topCourses: Array<{
    id: string;
    title: string;
    revenue: number;
  }>;
}

/**
 * Search parameters for list actions
 */
export interface SearchParams {
  title?: string;
  categoryId?: string;
  sort?: 'newest' | 'oldest' | 'popular' | 'price';
  userId?: string;
  isPublished?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Get courses parameters
 */
export interface GetCoursesParams extends SearchParams {
  includeProgress?: boolean;
  includeEnrollments?: boolean;
  includePurchases?: boolean;
}

/**
 * Get posts parameters
 */
export interface GetPostsParams extends SearchParams {
  includeComments?: boolean;
  includeLikes?: boolean;
  includeChapters?: boolean;
}

/**
 * MFA setup result
 */
export interface MFASetupResult {
  success: boolean;
  secret?: string;
  qrCode?: string;
  backupCodes?: string[];
  error?: string;
}

/**
 * MFA verification result
 */
export interface MFAVerificationResult {
  success: boolean;
  verified: boolean;
  error?: string;
  remainingAttempts?: number;
}

/**
 * Admin action result
 */
export interface AdminActionResult<T = unknown> extends ActionResult<T> {
  auditLogId?: string;
  affectedCount?: number;
}

/**
 * Batch operation result
 */
export interface BatchActionResult<T = unknown> {
  success: boolean;
  results: Array<{
    id: string;
    success: boolean;
    data?: T;
    error?: string;
  }>;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

/**
 * Error types for actions
 */
export enum ActionErrorType {
  VALIDATION = 'VALIDATION',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE = 'DATABASE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Structured action error
 */
export interface ActionError {
  type: ActionErrorType;
  message: string;
  details?: Record<string, unknown>;
  code?: string;
  statusCode?: number;
}

/**
 * Type guard for action errors
 */
export function isActionError(error: unknown): error is ActionError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'type' in error &&
    'message' in error
  );
}

/**
 * Helper to create action results
 */
export function createActionResult<T>(
  data?: T,
  error?: string | null
): ActionResult<T> {
  return {
    data,
    error,
    success: !error
  };
}

/**
 * Helper to create action error
 */
export function createActionError(
  type: ActionErrorType,
  message: string,
  details?: Record<string, unknown>
): ActionError {
  return {
    type,
    message,
    details,
    code: type,
    statusCode: getStatusCodeForErrorType(type)
  };
}

/**
 * Get HTTP status code for error type
 */
function getStatusCodeForErrorType(type: ActionErrorType): number {
  switch (type) {
    case ActionErrorType.VALIDATION:
      return 400;
    case ActionErrorType.UNAUTHORIZED:
      return 401;
    case ActionErrorType.FORBIDDEN:
      return 403;
    case ActionErrorType.NOT_FOUND:
      return 404;
    case ActionErrorType.RATE_LIMIT:
      return 429;
    case ActionErrorType.DATABASE:
    case ActionErrorType.EXTERNAL_SERVICE:
      return 503;
    default:
      return 500;
  }
}