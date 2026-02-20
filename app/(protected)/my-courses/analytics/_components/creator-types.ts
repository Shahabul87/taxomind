// Shared types for Creator Analytics Dashboard

export type CreatorTimeframe = "week" | "month" | "quarter" | "year" | "all";

export interface CoursePerformanceItem {
  courseId: string;
  courseTitle: string;
  learners: number;
  completionRate: number;
  averageRating: number;
  totalRatings: number;
  averageStudyTime: number;
  views: number;
  shares: number;
  createdAt: string;
  lastActivity: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
}

export interface CognitiveSkillsProgress {
  remember: number;
  understand: number;
  apply: number;
  analyze: number;
  evaluate: number;
  create: number;
}

export interface SectionEngagement {
  sectionTitle: string;
  courseTitle: string;
  engagementScore: number;
}

export interface DropoffPoint {
  sectionTitle: string;
  courseTitle: string;
  dropoffRate: number;
}

export interface StrugglingArea {
  area: string;
  courseTitle: string;
  strugglingPercentage: number;
}

export interface CountryData {
  country: string;
  count: number;
}

export interface LearnerInsights {
  demographics: {
    experienceLevels: Record<string, number>;
    mostActiveCountries: CountryData[];
    ageGroups: Record<string, number>;
  };
  engagementMetrics: {
    averageTimePerSection: number;
    mostPopularSections: SectionEngagement[];
    dropoffPoints: DropoffPoint[];
  };
  performanceData: {
    averageExamScores: number;
    cognitiveSkillsProgress: CognitiveSkillsProgress;
    commonStrugglingAreas: StrugglingArea[];
  };
}

export interface CommunityFeedbackItem {
  courseId: string;
  courseTitle: string;
  learnerName: string;
  rating: number;
  review: string;
  createdAt: string;
  helpful: boolean;
}

export type SuggestionType =
  | "content_improvement"
  | "new_course"
  | "engagement"
  | "difficulty_adjustment";

export type SuggestionPriority = "high" | "medium" | "low";

export interface SuggestionItem {
  type: SuggestionType;
  title: string;
  description: string;
  relatedCourse?: string;
  priority: SuggestionPriority;
  estimatedImpact: string;
}

export interface CreatorOverview {
  totalCourses: number;
  totalLearners: number;
  totalViews: number;
  averageRating: number;
  totalRatings: number;
  totalShares: number;
  totalCompletions: number;
  monthlyGrowth: number;
}

export interface CreatorAnalytics {
  overview: CreatorOverview;
  coursePerformance: CoursePerformanceItem[];
  learnerInsights: LearnerInsights;
  communityFeedback: CommunityFeedbackItem[];
  suggestions: SuggestionItem[];
}

// Props interfaces for sub-components

export interface CreatorKpiCardsProps {
  overview: CreatorOverview;
  onCardClick: (tab: string) => void;
}

export interface CreatorCoursesTabProps {
  courses: CoursePerformanceItem[];
}

export interface CreatorLearnersTabProps {
  learnerInsights: LearnerInsights;
  totalLearners: number;
}

export interface CreatorEngagementTabProps {
  engagementMetrics: LearnerInsights["engagementMetrics"];
}

export interface CreatorFeedbackTabProps {
  feedback: CommunityFeedbackItem[];
}

export interface CreatorSuggestionsTabProps {
  suggestions: SuggestionItem[];
}
