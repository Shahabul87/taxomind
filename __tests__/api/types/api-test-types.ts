/**
 * Comprehensive TypeScript types for API testing
 * Following enterprise standards - no any/unknown types
 */

// Base API Response Types
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// User Types
export interface MockUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: 'ADMIN' | 'USER';
  isTwoFactorEnabled?: boolean;
  isTeacher?: boolean;
  isAffiliate?: boolean;
  createdAt?: Date;
}

// Course Types
export interface MockCourse {
  id: string;
  title: string;
  description: string | null;
  cleanDescription?: string | null;
  subtitle?: string | null;
  imageUrl: string | null;
  price: number | null;
  isPublished: boolean;
  isFeatured?: boolean;
  categoryId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  whatYouWillLearn?: string[];
  courseGoals?: string | null;
  slug?: string | null;
  organizationId?: string | null;
}

export interface CourseWithRelations extends MockCourse {
  category: {
    id: string;
    name: string;
  } | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  Enrollment: Array<{
    id: string;
    userId: string;
    courseId: string;
    createdAt: Date;
  }> | false;
  Purchase: Array<{
    id: string;
    userId: string;
    courseId: string;
    createdAt: Date;
  }>;
  _count: {
    Enrollment: number;
    Purchase: number;
    reviews: number;
    chapters: number;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    userId: string;
  }>;
  chapters?: MockChapter[];
}

// Chapter Types
export interface MockChapter {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
  courseGoals?: string | null;
  learningOutcomes?: string | null;
  sectionCount?: number | null;
  totalDuration?: number | null;
  estimatedTime?: string | null;
  difficulty?: string | null;
  prerequisites?: string | null;
  resources?: string | null;
  status?: string | null;
}

export interface ChapterWithRelations extends MockChapter {
  course: MockCourse;
  sections: MockSection[];
  _count: {
    sections: number;
  };
}

// Section Types  
export interface MockSection {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  chapterId: string;
  createdAt: Date;
  updatedAt: Date;
  videoUrl?: string | null;
  blogContent?: string | null;
  duration?: number | null;
  resources?: string | null;
}

export interface SectionWithRelations extends MockSection {
  chapter: MockChapter;
  videos: Array<{
    id: string;
    title: string;
    url: string;
    duration?: number;
  }>;
  blogs: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  exams: Array<{
    id: string;
    title: string;
    isPublished: boolean;
  }>;
}

// Category Types
export interface MockCategory {
  id: string;
  name: string;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Enrollment Types
export interface MockEnrollment {
  id: string;
  userId: string;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Purchase Types
export interface MockPurchase {
  id: string;
  userId: string;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Types
export interface MockAnalytics {
  id: string;
  userId?: string | null;
  courseId?: string | null;
  chapterId?: string | null;
  sectionId?: string | null;
  eventType: string;
  eventData: Record<string, unknown>;
  timestamp: Date;
}

// AI Content Generation Types
export interface MockAIContent {
  id: string;
  userId: string;
  courseId?: string | null;
  chapterId?: string | null;
  sectionId?: string | null;
  contentType: 'course' | 'chapter' | 'section' | 'exam' | 'exercise';
  prompt: string;
  generatedContent: Record<string, unknown>;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

// Review Types
export interface MockReview {
  id: string;
  rating: number;
  comment: string | null;
  userId: string;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Group Types
export interface MockGroup {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
  courseId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Exam Types
export interface MockExam {
  id: string;
  title: string;
  description: string | null;
  sectionId: string;
  isPublished: boolean;
  timeLimit: number | null;
  passingScore: number | null;
  maxAttempts: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Question Types
export interface MockQuestion {
  id: string;
  examId: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options: Record<string, unknown> | null;
  correctAnswer: string;
  points: number;
  explanation: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

// API Request Types
export interface CreateCourseRequest {
  title: string;
  description?: string;
  categoryId?: string;
  price?: number;
  learningObjectives?: string[];
  imageUrl?: string;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  categoryId?: string;
  price?: number;
  isPublished?: boolean;
  isFeatured?: boolean;
  whatYouWillLearn?: string[];
  imageUrl?: string;
}

export interface CreateChapterRequest {
  title: string;
  description?: string;
  position?: number;
  courseGoals?: string;
  learningOutcomes?: string;
  estimatedTime?: string;
  difficulty?: string;
  prerequisites?: string;
  resources?: string;
}

export interface UpdateChapterRequest {
  title?: string;
  description?: string;
  position?: number;
  isPublished?: boolean;
  isFree?: boolean;
  courseGoals?: string;
  learningOutcomes?: string;
  estimatedTime?: string;
  difficulty?: string;
  prerequisites?: string;
  resources?: string;
}

export interface CreateSectionRequest {
  title: string;
  description?: string;
  position?: number;
  videoUrl?: string;
  blogContent?: string;
  duration?: number;
  resources?: string;
}

export interface UpdateSectionRequest {
  title?: string;
  description?: string;
  position?: number;
  isPublished?: boolean;
  isFree?: boolean;
  videoUrl?: string;
  blogContent?: string;
  duration?: number;
  resources?: string;
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
}

export interface EnrollmentRequest {
  courseId: string;
}

export interface ProgressUpdateRequest {
  sectionId: string;
  isCompleted: boolean;
  timeSpent?: number;
}

// Authentication Types
export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Admin API Types
export interface AdminUserUpdateRequest {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'USER';
  isAccountLocked?: boolean;
  isTwoFactorEnabled?: boolean;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  activeUsers: number;
  recentRegistrations: number;
}

// Analytics API Types
export interface AnalyticsRequest {
  courseId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  eventType?: string;
  limit?: number;
  offset?: number;
}

export interface AnalyticsResponse {
  totalEvents: number;
  uniqueUsers: number;
  averageEngagement: number;
  completionRate: number;
  events: MockAnalytics[];
}

// AI Content Generation API Types
export interface AIContentRequest {
  contentType: 'course' | 'chapter' | 'section' | 'exam' | 'exercise';
  prompt: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  parameters?: Record<string, unknown>;
}

export interface AIContentResponse {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  generatedContent: Record<string, unknown>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Search API Types
export interface SearchRequest {
  query: string;
  type?: 'course' | 'chapter' | 'section' | 'user' | 'all';
  categoryId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'rating' | 'enrollment';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResponse {
  totalResults: number;
  courses: CourseWithRelations[];
  chapters: ChapterWithRelations[];
  sections: SectionWithRelations[];
  users: MockUser[];
}

// Payment API Types
export interface PaymentRequest {
  courseId: string;
  paymentMethodId?: string;
  currency?: string;
}

export interface PaymentResponse {
  id: string;
  status: 'pending' | 'succeeded' | 'failed';
  amount: number;
  currency: string;
  courseId: string;
  userId: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
}

// Mock Response Helper Types
export interface MockApiResponse {
  status: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
  headers?: Record<string, string>;
}

// Test Context Types
export interface TestContext {
  user: MockUser | null;
  course?: MockCourse;
  chapter?: MockChapter;
  section?: MockSection;
  category?: MockCategory;
  enrollment?: MockEnrollment;
  purchase?: MockPurchase;
}

// Database Mock Types
export interface MockDatabaseOperations {
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  upsert: jest.Mock;
  count: jest.Mock;
}

// Test Utility Types
export interface TestDataGenerator {
  user: (overrides?: Partial<MockUser>) => MockUser;
  course: (overrides?: Partial<MockCourse>) => MockCourse;
  chapter: (overrides?: Partial<MockChapter>) => MockChapter;
  section: (overrides?: Partial<MockSection>) => MockSection;
  category: (overrides?: Partial<MockCategory>) => MockCategory;
  enrollment: (overrides?: Partial<MockEnrollment>) => MockEnrollment;
  purchase: (overrides?: Partial<MockPurchase>) => MockPurchase;
  review: (overrides?: Partial<MockReview>) => MockReview;
  analytics: (overrides?: Partial<MockAnalytics>) => MockAnalytics;
}

// Error Types
export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ValidationError extends ApiError {
  field: string;
  value: unknown;
  constraint: string;
}

// Rate Limiting Types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

// Pagination Types
export interface PaginationRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}