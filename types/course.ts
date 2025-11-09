import { Course, Category, Prisma, User, Purchase, Enrollment } from '@prisma/client';
import { LucideIcon } from 'lucide-react';

/**
 * Course with all necessary relations for the teacher dashboard
 */
export type CourseWithRelations = Course & {
  category: Pick<Category, 'name'> | null;
  _count: {
    Purchase: number;
    chapters: number;
  };
};

/**
 * Serialized version of CourseWithRelations for client components
 * Converts ALL Date objects to ISO strings for proper serialization
 */
export type SerializedCourseWithRelations = Omit<CourseWithRelations, 'createdAt' | 'updatedAt' | 'dealEndDate'> & {
  createdAt: string;
  updatedAt: string;
  dealEndDate: string | null;
};

/**
 * Enhanced course with analytics and performance metrics
 */
export interface CourseEnhanced extends CourseWithRelations {
  analytics: CourseAnalytics;
  performance: CoursePerformance;
  projections: CourseProjections;
  reviews?: CourseReviewSummary;
}

/**
 * Serialized version of CourseEnhanced for client components
 * Converts ALL Date objects to ISO strings for proper serialization
 */
export interface SerializedCourseEnhanced extends Omit<CourseWithRelations, 'createdAt' | 'updatedAt' | 'dealEndDate'> {
  createdAt: string;
  updatedAt: string;
  dealEndDate: string | null;
  analytics: CourseAnalytics;
  performance: CoursePerformance;
  projections: CourseProjections;
  reviews?: CourseReviewSummary;
}

/**
 * Course analytics data
 */
export interface CourseAnalytics {
  enrollmentTrend: TrendData[];
  completionRate: number;
  avgTimeToComplete: number;
  studentSatisfaction: number;
  revenueMetrics: RevenueMetrics;
  engagementScore: number;
  retentionRate: number;
}

/**
 * Course performance metrics
 */
export interface CoursePerformance {
  currentRevenue: number;
  previousRevenue: number;
  growthRate: number;
  averageRating: number;
  totalReviews: number;
  completionTrend: 'up' | 'down' | 'stable';
  enrollmentVelocity: number;
}

/**
 * Course projections
 */
export interface CourseProjections {
  estimatedRevenue30Days: number;
  estimatedEnrollments30Days: number;
  growthPotentialScore: number;
  marketDemandScore: number;
}

/**
 * Course review summary
 */
export interface CourseReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  recentReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    userName: string;
    createdAt: Date;
  }>;
}

/**
 * Trend data for analytics
 */
export interface TrendData {
  date: string;
  value: number;
  label?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Revenue metrics
 */
export interface RevenueMetrics {
  total: number;
  monthly: number;
  weekly: number;
  daily: number;
  perStudent: number;
  growth: number;
  projectedMonthly: number;
}

/**
 * Time series data for charts
 */
export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
  category?: string;
}

/**
 * Category revenue breakdown
 */
export interface CategoryRevenue {
  category: string;
  revenue: number;
  percentage: number;
  courseCount: number;
  enrollmentCount: number;
}

/**
 * Statistics for the teacher courses dashboard
 */
export interface CourseStats {
  total: number;
  published: number;
  draft: number;
  totalEnrollments: number;
  totalRevenue: number;
}

/**
 * Enhanced dashboard statistics with analytics
 */
export interface EnhancedDashboardStats extends CourseStats {
  analytics: AnalyticsMetrics;
  recentActivity: RecentActivity[];
  insights: DashboardInsight[];
  performanceIndicators: PerformanceIndicator[];
}

/**
 * Analytics metrics for dashboard
 */
export interface AnalyticsMetrics {
  revenue: {
    total: number;
    growth: number;
    chart: TimeSeriesData[];
    breakdown: CategoryRevenue[];
    trend: 'up' | 'down' | 'stable';
  };
  engagement: {
    activeStudents: number;
    avgCompletionRate: number;
    topPerformingCourses: SerializedCourseEnhanced[];
    engagementTrend: TrendData[];
  };
  performance: {
    avgRating: number;
    totalReviews: number;
    nps: number;
    satisfactionTrend: TrendData[];
  };
  growth: {
    newEnrollments: number;
    churnRate: number;
    retentionRate: number;
    growthRate: number;
  };
}

/**
 * Recent activity item
 */
export interface RecentActivity {
  id: string;
  type: 'enrollment' | 'review' | 'completion' | 'payment';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Dashboard insight
 */
export interface DashboardInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'critical';
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
  priority: number;
}

/**
 * Performance indicator
 */
export interface PerformanceIndicator {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  status: 'excellent' | 'good' | 'needs-attention' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

/**
 * Props for the CoursesDashboard component
 */
export interface CoursesDashboardProps {
  courses: SerializedCourseWithRelations[];
  stats: CourseStats;
}

/**
 * Course data for the data table with minimal relations
 */
export interface CourseTableData {
  id: string;
  title: string;
  category: { name: string } | null;
  price: number | null;
  isPublished: boolean;
  createdAt: string | Date; // Support both for compatibility
}

/**
 * Query parameters for course filtering and pagination
 */
export interface CourseQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
  status: 'all' | 'published' | 'draft';
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'title' | 'createdAt' | 'price';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated course response
 */
export interface PaginatedCourseResponse {
  courses: CourseWithRelations[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Bulk operation request
 */
export interface BulkCourseOperation {
  courseIds: string[];
  action: 'delete' | 'publish' | 'unpublish';
}

/**
 * Audit log entry for course operations
 */
export interface CourseAuditLog {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH' | 'BULK_DELETE' | 'BULK_PUBLISH';
  courseId?: string;
  courseIds?: string[];
  userId: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Advanced filter configuration
 */
export interface CourseFilters {
  search?: string;
  status?: CourseStatus[];
  categories?: string[];
  priceRange?: [number, number];
  dateRange?: DateRange;
  performance?: PerformanceFilter;
  rating?: RatingFilter;
  enrollmentRange?: [number, number];
  tags?: string[];
  instructor?: string;
}

/**
 * Course status
 */
export type CourseStatus = 'published' | 'draft' | 'archived' | 'pending_review';

/**
 * Date range filter
 */
export interface DateRange {
  from: Date;
  to: Date;
  preset?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';
}

/**
 * Performance filter
 */
export interface PerformanceFilter {
  minRevenue?: number;
  maxRevenue?: number;
  minEnrollments?: number;
  maxEnrollments?: number;
  completionRate?: { min: number; max: number };
  engagementScore?: { min: number; max: number };
}

/**
 * Rating filter
 */
export interface RatingFilter {
  min: number;
  max: number;
  includeUnrated?: boolean;
}

/**
 * Filter preset configuration
 */
export interface FilterPreset {
  id: string;
  name: string;
  icon: LucideIcon;
  description?: string;
  filters: CourseFilters;
  isDefault?: boolean;
  isCustom?: boolean;
  createdBy?: string;
  createdAt?: Date;
  color?: string;
}

/**
 * Sorting configuration
 */
export interface SortingState {
  column: string;
  direction: 'asc' | 'desc';
}

/**
 * Pagination state
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Selection state
 */
export interface SelectionState {
  selectedIds: Set<string>;
  selectAll: boolean;
}

/**
 * View mode
 */
export type ViewMode = 'table' | 'grid' | 'kanban' | 'analytics';

/**
 * Table column configuration
 */
export interface TableColumn {
  id: string;
  label: string;
  accessor?: string;
  visible: boolean;
  sortable: boolean;
  filterable: boolean;
  width?: number;
  pinned?: 'left' | 'right' | false;
  renderCell?: (row: CourseWithRelations) => React.ReactNode;
}

/**
 * Teacher dashboard state
 */
export interface TeacherDashboardState {
  filters: CourseFilters;
  sorting: SortingState;
  pagination: PaginationState;
  selection: SelectionState;
  view: ViewMode;
  analytics: AnalyticsMetrics;
  columnConfig: TableColumn[];
  filterPresets: FilterPreset[];
  activePresetId?: string;
}

/**
 * Export configuration
 */
export interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  columns: string[];
  filters?: CourseFilters;
  includeAnalytics?: boolean;
  includeCharts?: boolean;
  dateRange?: DateRange;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors?: Array<{
    courseId: string;
    error: string;
  }>;
  timestamp: Date;
}

/**
 * Real-time update event
 */
export interface CourseUpdateEvent {
  type: 'COURSE_UPDATE' | 'ENROLLMENT' | 'REVIEW' | 'PAYMENT';
  courseId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

/**
 * AI suggestion for filters
 */
export interface FilterSuggestion {
  id: string;
  label: string;
  description: string;
  filters: Partial<CourseFilters>;
  confidence: number;
  reason: string;
}
