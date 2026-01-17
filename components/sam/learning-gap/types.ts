/**
 * Learning Gap Dashboard Types
 *
 * TypeScript interfaces for all gap-related data structures.
 */

// ============================================================================
// SEVERITY & STATUS TYPES
// ============================================================================

export type GapSeverity = 'critical' | 'moderate' | 'minor';
export type GapStatus = 'active' | 'resolving' | 'resolved';
export type DecayRiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type TrendDirection = 'improving' | 'stable' | 'declining';

// ============================================================================
// LEARNING GAP DATA
// ============================================================================

export interface LearningGapEvidence {
  type: 'assessment' | 'practice' | 'quiz' | 'activity';
  score: number;
  expectedScore: number;
  date: string;
  source: string;
}

export interface GapAction {
  id: string;
  type: 'review' | 'practice' | 'tutorial' | 'assessment';
  title: string;
  description: string;
  estimatedTime: number; // minutes
  priority: 'high' | 'medium' | 'low';
  resourceUrl?: string;
}

export interface LearningGapData {
  id: string;
  skillId: string;
  skillName: string;
  topicId?: string;
  topicName?: string;
  severity: GapSeverity;
  status: GapStatus;
  gapScore: number; // 0-100, higher = worse gap
  masteryLevel: number; // current mastery percentage
  targetMasteryLevel: number; // expected/target mastery
  evidence: LearningGapEvidence[];
  suggestedActions: GapAction[];
  detectedAt: string;
  lastUpdated: string;
  resolvedAt?: string;
}

// ============================================================================
// SKILL DECAY DATA
// ============================================================================

export interface DecayPrediction {
  date: string;
  predictedMastery: number;
  confidence: number;
}

export interface SkillDecayData {
  skillId: string;
  skillName: string;
  currentMastery: number;
  riskLevel: DecayRiskLevel;
  daysSinceLastPractice: number;
  decayRate: number; // percentage per day
  predictedDecayDate: string; // when mastery drops below threshold
  predictions: DecayPrediction[];
  lastPracticedAt: string;
  reviewDeadline?: string;
}

// ============================================================================
// TREND ANALYSIS DATA
// ============================================================================

export interface TrendMetricPoint {
  date: string;
  value: number;
}

export interface TrendMetric {
  id: string;
  name: string;
  description: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  direction: TrendDirection;
  dataPoints: TrendMetricPoint[];
  unit?: string;
}

export interface TrendInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  metric: string;
  impact: 'high' | 'medium' | 'low';
}

export interface TrendAnalysisData {
  period: 'week' | 'month' | 'quarter';
  metrics: TrendMetric[];
  insights: TrendInsight[];
  overallDirection: TrendDirection;
  learningVelocity: number; // topics/skills mastered per week
  gapClosureRate: number; // gaps closed per week
}

// ============================================================================
// RECOMMENDATION DATA
// ============================================================================

export interface GapRecommendation {
  id: string;
  gapId: string;
  type: 'content' | 'practice' | 'review' | 'assessment' | 'tutor';
  title: string;
  description: string;
  reason: string;
  expectedImpact: number; // percentage improvement
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // minutes
  priority: 'high' | 'medium' | 'low';
  resourceUrl?: string;
  resourceType?: 'video' | 'article' | 'quiz' | 'exercise' | 'session';
  prerequisites?: string[];
}

// ============================================================================
// COMPARISON DATA
// ============================================================================

export interface ComparisonMetric {
  id: string;
  name: string;
  userValue: number;
  peerAverage: number;
  peerMedian: number;
  targetValue: number;
  percentile: number; // user's percentile among peers
  unit?: string;
}

export interface ComparisonInsight {
  id: string;
  type: 'strength' | 'weakness' | 'opportunity';
  title: string;
  description: string;
  metric: string;
  gap: number; // difference from target or peer average
}

export interface ComparisonData {
  userId: string;
  peerGroupSize: number;
  peerGroupDescription: string;
  metrics: ComparisonMetric[];
  insights: ComparisonInsight[];
  overallPercentile: number;
  strengthAreas: string[];
  improvementAreas: string[];
}

// ============================================================================
// AGGREGATE DASHBOARD DATA
// ============================================================================

export interface GapSummary {
  total: number;
  critical: number;
  moderate: number;
  minor: number;
  resolvedThisWeek: number;
  newThisWeek: number;
}

export interface LearningGapDashboardData {
  gaps: LearningGapData[];
  decayData: SkillDecayData[];
  trends: TrendAnalysisData;
  recommendations: GapRecommendation[];
  comparison: ComparisonData;
  summary: GapSummary;
  lastUpdated: string;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface LearningGapDashboardProps {
  className?: string;
}

export interface GapOverviewWidgetProps {
  gaps: LearningGapData[];
  summary: GapSummary;
  onGapClick?: (gap: LearningGapData) => void;
  className?: string;
}

export interface SkillDecayTrackerProps {
  decayData: SkillDecayData[];
  onReviewClick?: (skillId: string) => void;
  className?: string;
}

export interface TrendAnalysisChartProps {
  trends: TrendAnalysisData;
  className?: string;
}

export interface PersonalizedRecommendationsProps {
  recommendations: GapRecommendation[];
  onActionClick?: (recommendation: GapRecommendation) => void;
  className?: string;
}

export interface ComparisonViewProps {
  comparison: ComparisonData;
  className?: string;
}
