/**
 * Course Guide Engine Types
 */

// ============================================================================
// COURSE GUIDE ENGINE TYPES
// ============================================================================

export interface CourseGuideEngineConfig {
  aiProvider?: 'openai' | 'anthropic';
  databaseAdapter?: CourseGuideDatabaseAdapter;
}

export interface CourseGuideDepthMetrics {
  contentRichness: number;
  topicCoverage: number;
  assessmentQuality: number;
  learningPathClarity: number;
  overallDepth: number;
}

export interface CourseGuideEngagementMetrics {
  completionRate: number;
  averageProgress: number;
  interactionFrequency: number;
  studentSatisfaction: number;
  retentionRate: number;
  overallEngagement: number;
}

export interface CourseGuideMarketMetrics {
  enrollmentGrowth: number;
  competitivePosition: number;
  pricingOptimality: number;
  reviewScore: number;
  recommendationRate: number;
  overallAcceptance: number;
}

export interface CourseGuideMetrics {
  depth: CourseGuideDepthMetrics;
  engagement: CourseGuideEngagementMetrics;
  marketAcceptance: CourseGuideMarketMetrics;
}

export interface CourseGuideInsightItem {
  category: 'depth' | 'engagement' | 'market';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  metric?: number;
}

export interface CourseGuideActionItem {
  priority: 'immediate' | 'short-term' | 'long-term';
  action: string;
  expectedOutcome: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
}

export interface TeacherInsights {
  strengths: CourseGuideInsightItem[];
  improvements: CourseGuideInsightItem[];
  opportunities: CourseGuideInsightItem[];
  actionPlan: CourseGuideActionItem[];
}

export interface SimilarCourse {
  id: string;
  title: string;
  similarity: number;
  enrollment: number;
  rating: number;
  price: number;
  strengths: string[];
}

export interface CourseComparison {
  courseId: string;
  similarCourses: SimilarCourse[];
  marketPosition: 'leader' | 'competitive' | 'follower' | 'niche';
  differentiators: string[];
  gaps: string[];
}

export interface CourseGuideContentRecommendation {
  type: 'add' | 'modify' | 'enhance';
  target: string;
  suggestion: string;
  expectedImpact: string;
}

export interface CourseGuideEngagementRecommendation {
  strategy: string;
  implementation: string;
  targetMetric: string;
  expectedImprovement: number;
}

export interface MarketingRecommendation {
  channel: string;
  message: string;
  targetAudience: string;
  estimatedReach: number;
}

export interface CourseSuccessPrediction {
  currentTrajectory: 'growing' | 'stable' | 'declining';
  projectedEnrollments: number;
  riskFactors: string[];
  successProbability: number;
}

export interface CourseGuideResponse {
  courseId: string;
  courseTitle: string;
  metrics: CourseGuideMetrics;
  insights: TeacherInsights;
  comparison: CourseComparison;
  recommendations: {
    content: CourseGuideContentRecommendation[];
    engagement: CourseGuideEngagementRecommendation[];
    marketing: MarketingRecommendation[];
  };
  successPrediction: CourseSuccessPrediction;
}

export interface CourseGuideInput {
  id: string;
  title: string;
  price?: number;
  chapters: CourseGuideChapter[];
  enrollments: CourseGuideEnrollment[];
  reviews: CourseGuideReview[];
  purchases: CourseGuidePurchase[];
}

export interface CourseGuideChapter {
  id: string;
  sections: CourseGuideSection[];
}

export interface CourseGuideSection {
  id: string;
  exams: Array<{ id: string }>;
  questions: Array<{ id: string }>;
}

export interface CourseGuideEnrollment {
  userId: string;
  progress?: {
    isCompleted?: boolean;
    percentage?: number;
    lastAccessedAt?: Date;
  };
}

export interface CourseGuideReview {
  rating: number;
}

export interface CourseGuidePurchase {
  createdAt: Date;
}

export interface CourseGuideDatabaseAdapter {
  getCourse(courseId: string): Promise<CourseGuideInput | null>;
  getRecentInteractionCount(courseId: string, days: number): Promise<number>;
  findCompetitors(courseId: string): Promise<SimilarCourse[]>;
}

export interface CourseGuideEngine {
  generateCourseGuide(
    courseId: string,
    includeComparison?: boolean,
    includeProjections?: boolean
  ): Promise<CourseGuideResponse>;

  calculateMetrics(course: CourseGuideInput): Promise<CourseGuideMetrics>;

  generateInsights(
    course: CourseGuideInput,
    metrics: CourseGuideMetrics
  ): Promise<TeacherInsights>;

  generateComparison(course: CourseGuideInput): Promise<CourseComparison>;

  predictSuccess(
    course: CourseGuideInput,
    metrics: CourseGuideMetrics
  ): Promise<CourseSuccessPrediction>;

  exportCourseGuide(
    courseId: string,
    format?: 'pdf' | 'html' | 'json'
  ): Promise<string | Buffer>;
}
