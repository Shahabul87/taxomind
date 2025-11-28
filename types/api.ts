/**
 * Comprehensive TypeScript Type Definitions for Taxomind API
 * Replaces all 'any' types with proper type definitions
 */

import { 
  User, 
  Course, 
  Chapter, 
  Section, 
  user_progress, 
  Purchase, 
  Enrollment,
  Category,
  UserExamAttempt,
  ExamQuestion,
  UserAnswer,
  Exam,
  // Review,
  Post,
  // PostChapter,
  // Profile,
  Subscription,
  ProfileLink,
  FavoriteArticle,
  FavoriteVideo,
  FavoriteAudio,
  FavoriteBlog,
  // CourseTemplate,
  // SecurityAlert,
  Notification,
  AuditLog,
  Bill,
  // Payment
} from '@prisma/client';

// ============================================================================
// Core API Types
// ============================================================================

export interface APIError extends Error {
  statusCode?: number;
  details?: unknown;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Authentication & User Types
// ============================================================================

// NOTE: Users don't have roles - Admin auth is completely separate (AdminAccount model)
// isTeacher determines if user can create courses
export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  isTeacher?: boolean;
  image?: string | null;
  emailVerified?: Date | null;
  isTwoFactorEnabled?: boolean;
}

export interface SessionUser extends AuthUser {
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthSession {
  user: SessionUser;
  expires: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  code?: string; // 2FA code
  redirectTo?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface UserWithRelations extends User {
  accounts?: Array<{
    provider: string;
    providerAccountId: string;
  }>;
  twoFactorConfirmation?: {
    id: string;
    userId: string;
  } | null;
  // profile?: Profile | null;
  subscriptions?: Subscription[];
  profileLinks?: ProfileLink[];
}

// ============================================================================
// Course & Learning Types
// ============================================================================

export interface CourseWithRelations extends Course {
  category?: Category | null;
  user?: Pick<User, 'id' | 'name' | 'image'>;
  chapters?: ChapterWithRelations[];
  Purchase?: Purchase[];
  Enrollment?: Enrollment[];
  // reviews?: Review[];
  _count?: {
    Purchase: number;
    Enrollment: number;
    reviews: number;
    chapters: number;
  };
}

export interface ChapterWithRelations extends Chapter {
  course?: Course;
  sections?: SectionWithRelations[];
  userProgress?: user_progress[];
  _count?: {
    sections: number;
  };
}

export interface SectionWithRelations extends Omit<Section, 'duration' | 'videoUrl'> {
  duration?: number | null;
  chapter?: ChapterWithRelations;
  userProgress?: user_progress[];
  videoUrl?: string | null;
  content?: string | null;
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  completedSections: number;
  totalSections: number;
  progressPercentage: number;
  lastAccessedAt: Date;
  chapters: Array<{
    chapterId: string;
    completedSections: number;
    totalSections: number;
  }>;
}

// ============================================================================
// Exam & Assessment Types
// ============================================================================

export interface ExamAttemptWithRelations extends UserExamAttempt {
  user?: User;
  Exam?: ExamWithRelations;
  answers?: ExamAnswerWithRelations[];
}

export interface ExamWithRelations extends Omit<Exam, 'attempts'> {
  section?: SectionWithRelations;
  questions?: ExamQuestionWithRelations[];
  attempts?: UserExamAttempt[];
}

export interface ExamQuestionWithRelations extends Omit<ExamQuestion, 'bloomsLevel' | 'difficulty'> {
  exam?: Exam;
  answers?: UserAnswer[];
  bloomsLevel?: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface ExamAnswerWithRelations extends Omit<UserAnswer, 'isCorrect'> {
  question?: ExamQuestionWithRelations;
  attempt?: UserExamAttempt;
  isCorrect?: boolean;
  timeTaken?: number;
}

export interface BloomsAnalysis {
  level: string;
  score: number;
  total: number;
  percentage: number;
  rank: 'excellent' | 'good' | 'average' | 'needs-improvement';
}

export interface DifficultyBreakdown {
  easy: number;
  medium: number;
  hard: number;
  [key: string]: number;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface StudentAnalytics {
  studentId: string;
  courseId: string;
  overallScore: number;
  examsTaken: number;
  averageTime: number;
  improvementTrend: number;
  consistency: number;
  lastActivity: Date;
  bloomsPerformance: Record<string, BloomsAnalysis>;
  difficultyPerformance: DifficultyBreakdown;
  learningVelocity: number;
  retentionRate: number;
}

export interface CourseAnalytics {
  courseId: string;
  totalStudents: number;
  averageProgress: number;
  completionRate: number;
  averageScore: number;
  engagementRate: number;
  revenue: number;
  rating: number;
  reviewCount: number;
  chapterAnalytics: Array<{
    chapterId: string;
    completionRate: number;
    averageScore: number;
    averageTime: number;
  }>;
}

export interface TeacherAnalytics {
  teacherId: string;
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  engagementRate: number;
  coursePerformance: CourseAnalytics[];
  studentProgress: StudentAnalytics[];
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: 'course' | 'chapter' | 'section' | 'exam' | 'post' | 'comment';
  entityId: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================================
// Template & Content Types
// ============================================================================

export interface TemplateWithRelations { // extends CourseTemplate {
  id: string;
  name: string;
  description?: string;
  category?: Category;
  creator?: User;
  usageCount?: number;
  rating?: number;
  tags?: string[];
}

export interface ContentVersion {
  id: string;
  contentType: 'course' | 'chapter' | 'section' | 'post';
  contentId: string;
  version: number;
  changes: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  isPublished: boolean;
}

// ============================================================================
// Social & Profile Types
// ============================================================================

export interface ProfileWithRelations { // extends Profile {
  id: string;
  userId: string;
  user?: User;
  subscriptions?: Subscription[];
  profileLinks?: ProfileLink[];
  favoriteArticles?: FavoriteArticle[];
  favoriteVideos?: FavoriteVideo[];
  favoriteAudios?: FavoriteAudio[];
  favoriteBlogs?: FavoriteBlog[];
}

export interface SocialMetadata {
  platform: 'linkedin' | 'twitter' | 'github' | 'facebook' | 'instagram';
  username?: string;
  profileUrl?: string;
  followers?: number;
  following?: number;
  verified?: boolean;
  bio?: string;
  avatarUrl?: string;
}

export interface PostWithRelations extends Post {
  user?: User;
  // chapters?: PostChapter[];
  comments?: Array<{
    id: string;
    content: string;
    userId: string;
    user?: User;
    createdAt: Date;
    replies?: Array<{
      id: string;
      content: string;
      userId: string;
      user?: User;
      createdAt: Date;
    }>;
  }>;
  reactions?: Array<{
    userId: string;
    type: 'like' | 'love' | 'insightful' | 'helpful';
  }>;
  _count?: {
    comments: number;
    reactions: number;
    views: number;
  };
}

// ============================================================================
// Security & Compliance Types
// ============================================================================

export interface SecurityAlertData {
  type: 'suspicious_login' | 'password_change' | 'role_change' | 'data_breach' | 'rate_limit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, unknown>;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface ComplianceReport {
  reportType: 'gdpr' | 'ccpa' | 'hipaa' | 'sox';
  status: 'compliant' | 'non-compliant' | 'partial';
  issues: Array<{
    area: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }>;
  generatedAt: Date;
  validUntil: Date;
}

// ============================================================================
// Financial Types
// ============================================================================

export interface BillWithRelations { // extends Bill {
  id: string;
  userId: string;
  amount: number;
  user?: User;
  // payments?: Payment[];
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export interface PaymentData {
  billId: string;
  amount: number;
  method: 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'bank_transfer';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  metadata?: Record<string, unknown>;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  pendingPayments: number;
  averageTransactionValue: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
  topCourses: Array<{
    courseId: string;
    title: string;
    revenue: number;
    purchases: number;
  }>;
}

// ============================================================================
// AI & SAM Engine Types
// ============================================================================

export interface AIContentRequest {
  type: 'course' | 'chapter' | 'section' | 'question' | 'explanation';
  prompt: string;
  context?: Record<string, unknown>;
  parameters?: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    length?: 'short' | 'medium' | 'long';
    style?: 'formal' | 'casual' | 'technical';
    bloomsLevel?: string;
  };
}

export interface AIContentResponse {
  content: string;
  metadata?: {
    model: string;
    tokens: number;
    processingTime: number;
    confidence?: number;
  };
  suggestions?: string[];
  relatedTopics?: string[];
}

export interface SAMAnalysis {
  bloomsLevel: string;
  cognitiveLoad: number;
  difficulty: number;
  concepts: string[];
  prerequisites: string[];
  learningObjectives: string[];
  estimatedTime: number;
  recommendations: Array<{
    type: 'content' | 'pedagogy' | 'assessment';
    suggestion: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface NotificationData {
  userId: string;
  type: 'course_update' | 'new_enrollment' | 'exam_result' | 'comment_reply' | 'payment_received' | 'system_alert';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitInfo {
  endpoint: string;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

// ============================================================================
// Helper Types for Common Patterns
// ============================================================================

export type AsyncFunction<T = void> = () => Promise<T>;
export type ErrorHandler = (error: APIError) => void;
export type SuccessHandler<T> = (data: T) => void;

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

export interface BatchOperation<T> {
  items: T[];
  operation: 'create' | 'update' | 'delete';
  options?: {
    skipValidation?: boolean;
    returnErrors?: boolean;
  };
}

// ============================================================================
// Form Data Types
// ============================================================================

export interface CourseFormData {
  title: string;
  description: string;
  imageUrl?: string;
  price?: number;
  categoryId: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tags?: string[];
  isPublished?: boolean;
}

export interface ChapterFormData {
  title: string;
  description?: string;
  position: number;
  isFree?: boolean;
  isPublished?: boolean;
}

export interface SectionFormData {
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  position: number;
  isPublished?: boolean;
}

export interface ProfileUpdateData {
  name?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: Record<string, string>;
  preferences?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    theme?: 'light' | 'dark' | 'system';
    language?: string;
  };
}

// ============================================================================
// Export utility type helpers
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncReturnType<T extends (...args: never[]) => Promise<unknown>> = 
  T extends (...args: never[]) => Promise<infer R> ? R : never;

// Type guard functions
export function isAPIError(error: unknown): error is APIError {
  return error instanceof Error && 'statusCode' in error;
}

export function isAuthUser(user: unknown): user is AuthUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'email' in user
  );
}

export function hasRelations<T extends Record<string, unknown>>(
  obj: T,
  relations: Array<keyof T>
): boolean {
  return relations.every(relation => relation in obj);
}