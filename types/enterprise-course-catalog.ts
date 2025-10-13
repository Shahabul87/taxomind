/**
 * Enterprise Course Catalog Type Definitions
 *
 * This file contains all TypeScript interfaces and types for the enterprise
 * course catalog system, following strict type safety standards.
 */

// ============================================================================
// CORE COURSE TYPES
// ============================================================================

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'All Levels';
export type CourseBadge = 'Bestseller' | 'Hot & New' | 'Highest Rated' | 'Corporate Training' | 'Featured';
export type ViewMode = 'grid' | 'list' | 'compact';
export type SortBy = 'relevance' | 'newest' | 'popular' | 'rating' | 'price-asc' | 'price-desc';
export type DurationRange = '< 2h' | '2-5h' | '5-10h' | '10+ h';
export type UpdateRecency = '30d' | '60d' | '90d';

export interface CourseDuration {
  hours: number;
  minutes: number;
  formatted: string;
}

export interface CourseMetadata {
  level: CourseLevel;
  duration: CourseDuration;
  lastUpdated: Date;
  language: string;
  subtitles: string[];
  certificateAvailable: boolean;
}

export interface CourseInstructor {
  id: string;
  name: string;
  image: string | null;
  verified: boolean;
  rating: number;
  coursesCount: number;
  studentsCount: number;
  bio: string | null;
  credentials: string[];
}

export interface CourseCategory {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

export interface CourseEnrollments {
  total: number;
  recent: number; // Last 30 days
  trending: boolean;
  trendingScore: number; // 0-100
}

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface CourseRatings {
  average: number;
  count: number;
  distribution: RatingDistribution;
}

export interface CourseContent {
  chaptersCount: number;
  lecturesCount: number;
  quizzesCount: number;
  projectsCount: number;
  downloadableResources: number;
  articlesCount: number;
  totalDuration: CourseDuration;
}

export interface CourseFeatures {
  certificate: boolean;
  codingExercises: boolean;
  downloadableResources: boolean;
  mobileAccess: boolean;
  lifetimeAccess: boolean;
  moneyBackGuarantee: boolean;
  closedCaptions: boolean;
  offlineViewing: boolean;
}

export interface CoursePricing {
  current: number;
  original: number | null;
  discount: number | null; // Percentage
  discountEndsAt: Date | null;
  currency: string;
  isFree: boolean;
}

export interface CourseSEO {
  slug: string;
  keywords: string[];
  metaDescription: string;
  ogImage: string | null;
}

export interface CoursePreview {
  videoUrl: string | null;
  thumbnailUrl: string | null;
  intro: string;
  highlights: string[];
}

export interface LearningObjective {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface CourseRequirement {
  id: string;
  title: string;
  order: number;
}

export interface TargetAudience {
  id: string;
  description: string;
  order: number;
}

/**
 * Complete Enterprise Course Data Structure
 *
 * This interface represents the full course data with all enterprise features,
 * analytics, and metadata required for the marketplace.
 */
export interface EnterpriseCourse {
  // Core data from Prisma
  id: string;
  title: string;
  description: string | null;
  cleanDescription: string | null;
  imageUrl: string | null;
  price: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Enhanced metadata
  metadata: CourseMetadata;

  // Instructor information
  instructor: CourseInstructor;

  // Category and skills
  category: CourseCategory | null;
  skills: string[];

  // Enrollment and popularity
  enrollments: CourseEnrollments;

  // Ratings and reviews
  ratings: CourseRatings;

  // Content structure
  content: CourseContent;

  // Features and benefits
  features: CourseFeatures;

  // Badges and highlights
  badges: CourseBadge[];

  // Pricing information
  pricing: CoursePricing;

  // SEO and discovery
  seo: CourseSEO;

  // Preview content
  preview: CoursePreview;

  // Learning objectives
  learningObjectives: LearningObjective[];

  // Requirements
  requirements: CourseRequirement[];

  // Target audience
  targetAudience: TargetAudience[];

  // Completion metrics
  completionRate: number | null;
  averageCompletionTime: number | null; // in hours

  // Career outcomes
  careerOutcomes: string[];
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

export interface PriceRange {
  min: number;
  max: number;
}

export interface FeatureFilters {
  certificate: boolean;
  quizzes: boolean;
  codingExercises: boolean;
  downloadableResources: boolean;
  closedCaptions: boolean;
  mobileAccess: boolean;
}

/**
 * Complete filter state for course catalog
 */
export interface FilterState {
  // Search
  searchQuery: string;
  searchHistory: string[];

  // Categories
  selectedCategories: string[];

  // Price
  priceRange: PriceRange;
  freeOnly: boolean;

  // Level
  skillLevels: CourseLevel[];

  // Duration
  durationRanges: DurationRange[];

  // Rating
  minRating: 0 | 3 | 4 | 4.5;

  // Language
  languages: string[];

  // Features
  features: FeatureFilters;

  // Instructor
  instructorRating: number | null;

  // Freshness
  recentlyUpdated: UpdateRecency | null;

  // Sorting
  sortBy: SortBy;

  // View
  viewMode: ViewMode;

  // Pagination
  page: number;
  pageSize: number;
}

/**
 * Search suggestion from auto-complete
 */
export interface SearchSuggestion {
  type: 'course' | 'category' | 'instructor' | 'skill';
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  relevance: number;
}

/**
 * Search results from API
 */
export interface SearchResults {
  courses: EnterpriseCourse[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  suggestions: SearchSuggestion[];
  facets: SearchFacets;
}

export interface SearchFacets {
  categories: Array<{ id: string; name: string; count: number }>;
  levels: Array<{ level: CourseLevel; count: number }>;
  priceRanges: Array<{ range: string; count: number }>;
  languages: Array<{ language: string; count: number }>;
}

// ============================================================================
// RECOMMENDATION TYPES
// ============================================================================

export type RecommendationType =
  | 'personalized'
  | 'trending'
  | 'similar'
  | 'based_on_interests'
  | 'complete_learning_path'
  | 'students_also_bought';

export interface Recommendation {
  type: RecommendationType;
  title: string;
  description: string;
  courses: EnterpriseCourse[];
  reason: string | null; // Why this is recommended
  confidence: number; // 0-1
}

export interface UserPreferences {
  interests: string[];
  skillLevel: CourseLevel | null;
  learningGoals: string[];
  preferredLanguages: string[];
  priceRange: PriceRange | null;
  timeAvailability: string | null; // e.g., "2-3 hours/week"
}

// ============================================================================
// LEARNING PATH TYPES
// ============================================================================

export interface LearningPathStep {
  order: number;
  course: EnterpriseCourse;
  isCompleted: boolean;
  isOptional: boolean;
  prerequisites: string[]; // Course IDs
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  level: CourseLevel;
  totalDuration: CourseDuration;
  steps: LearningPathStep[];
  skillsYouWillGain: string[];
  careerOutcomes: string[];
  enrolledCount: number;
  completionRate: number;
  certificateAwarded: boolean;
}

export interface CourseBundle {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  courses: EnterpriseCourse[];
  originalPrice: number;
  bundlePrice: number;
  savingsPercentage: number;
  enrolledCount: number;
  validUntil: Date | null;
}

// ============================================================================
// SOCIAL PROOF TYPES
// ============================================================================

export interface SuccessStory {
  id: string;
  studentName: string;
  studentImage: string | null;
  studentRole: string;
  studentCompany: string | null;
  courseId: string;
  courseTitle: string;
  story: string;
  outcome: string;
  rating: number;
  date: Date;
}

export interface Testimonial {
  id: string;
  studentName: string;
  studentImage: string | null;
  studentRole: string | null;
  courseId: string;
  rating: number;
  comment: string;
  helpful: number;
  verified: boolean;
  date: Date;
}

export interface CompanyPartner {
  id: string;
  name: string;
  logo: string;
  description: string | null;
  employeesEnrolled: number;
}

export interface RealTimeActivity {
  type: 'enrollment' | 'completion' | 'review';
  studentName: string;
  courseTitle: string;
  timestamp: Date;
  location: string | null;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface CourseCardClickEvent {
  courseId: string;
  courseTitle: string;
  position: number;
  viewMode: ViewMode;
  source: string; // e.g., 'featured', 'recommended', 'search'
  timestamp: Date;
}

export interface FilterAppliedEvent {
  filterType: keyof FilterState;
  filterValue: string | number | boolean | string[];
  resultCount: number;
  timestamp: Date;
}

export interface SearchPerformedEvent {
  query: string;
  resultCount: number;
  selectedCourse: string | null;
  selectedPosition: number | null;
  timestamp: Date;
}

export interface ViewModeChangedEvent {
  fromMode: ViewMode;
  toMode: ViewMode;
  timestamp: Date;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface EnhancedCourseCardProps {
  course: EnterpriseCourse;
  viewMode: ViewMode;
  position: number;
  onCardClick?: (course: EnterpriseCourse) => void;
  onPreviewClick?: (course: EnterpriseCourse) => void;
  onAddToCart?: (courseId: string) => void;
  onAddToWishlist?: (courseId: string) => void;
}

export interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
  facets: SearchFacets | null;
  isLoading: boolean;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  placeholder?: string;
}

export interface HeroSectionProps {
  featuredCourses: EnterpriseCourse[];
  promotions: Promotion[];
  stats: PlatformStats;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
  discount: number | null;
  endsAt: Date | null;
  priority: number;
}

export interface PlatformStats {
  totalLearners: string; // Formatted string, e.g., "2M+"
  totalCourses: string; // Formatted string, e.g., "10K+"
  totalCountries: string; // Formatted string, e.g., "180+"
  avgRating: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface CoursesApiResponse {
  success: boolean;
  courses: EnterpriseCourse[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface RecommendationsApiResponse {
  success: boolean;
  recommendations: Recommendation[];
  error?: {
    code: string;
    message: string;
  };
}

export interface LearningPathsApiResponse {
  success: boolean;
  paths: LearningPath[];
  error?: {
    code: string;
    message: string;
  };
}

export interface BundlesApiResponse {
  success: boolean;
  bundles: CourseBundle[];
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard to check if a course has a preview video
 */
export const hasPreviewVideo = (course: EnterpriseCourse): boolean => {
  return course.preview.videoUrl !== null;
};

/**
 * Type guard to check if a course is on discount
 */
export const isDiscounted = (course: EnterpriseCourse): boolean => {
  return course.pricing.discount !== null && course.pricing.discount > 0;
};

/**
 * Type guard to check if a course is trending
 */
export const isTrending = (course: EnterpriseCourse): boolean => {
  return course.enrollments.trending;
};

/**
 * Type guard to check if a course is bestseller
 */
export const isBestseller = (course: EnterpriseCourse): boolean => {
  return course.badges.includes('Bestseller');
};
