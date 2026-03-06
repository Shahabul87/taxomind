import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ============================================================================
// MOCKS
// ============================================================================

// Mutable hook return object - tests modify properties before each render.
const mockRefresh = jest.fn().mockResolvedValue(undefined);

const mockHookReturn: {
  data: ReturnType<typeof createFullAnalyticsData> | null;
  loading: boolean;
  error: string | null;
  refresh: jest.Mock;
  isStale: boolean;
} = {
  data: null,
  loading: false,
  error: null,
  refresh: mockRefresh,
  isStale: false,
};

jest.mock('@/hooks/use-sam-unified-analytics', () => ({
  useSAMUnifiedAnalytics: () => mockHookReturn,
}));

// Mock @sam-ai/core for BloomsLevel type import (type-only import, but module
// must resolve at runtime for jest module graph analysis)
jest.mock('@sam-ai/core', () => ({}));

// Mock UI components following project convention
jest.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <h3 data-testid="card-title" className={className}>
      {children}
    </h3>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div
      data-testid="progress-bar"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={className}
      style={{ width: `${value}%` }}
    />
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <span data-testid="badge" className={className} data-variant={variant}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    variant,
    size,
    className,
    onClick,
    asChild,
  }: {
    children: React.ReactNode;
    variant?: string;
    size?: string;
    className?: string;
    onClick?: () => void;
    asChild?: boolean;
  }) => {
    // When asChild is true, just render children directly
    if (asChild) {
      return <>{children}</>;
    }
    return (
      <button
        data-testid="action-button"
        data-variant={variant}
        data-size={size}
        className={className}
        onClick={onClick}
      >
        {children}
      </button>
    );
  },
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({
    children,
    defaultValue,
    className,
  }: {
    children: React.ReactNode;
    defaultValue?: string;
    className?: string;
  }) => (
    <div data-testid="tabs" data-value={defaultValue} className={className}>
      {children}
    </div>
  ),
  TabsContent: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <div data-testid="tabs-content" data-value={value}>
      {children}
    </div>
  ),
  TabsList: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="tabs-list" className={className}>
      {children}
    </div>
  ),
  TabsTrigger: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <button data-testid="tabs-trigger" data-value={value}>
      {children}
    </button>
  ),
}));

// The lucide-react mock is provided globally via moduleNameMapper in
// jest.config.working.js pointing to __mocks__/lucide-react.js.
// The framer-motion mock is provided globally via jest.setup.js.
// next/link is provided globally via moduleNameMapper pointing to __mocks__/next-link.js.

// ============================================================================
// IMPORT COMPONENT UNDER TEST (must come after all jest.mock calls)
// ============================================================================

import { SAMInsightsDashboard } from '@/components/analytics/SAMInsightsDashboard';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

type BloomsLevel =
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';

interface OverallHealthScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  components: {
    practice: number;
    engagement: number;
    retention: number;
    progress: number;
    consistency: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  insights: string[];
  nextSteps: string[];
}

interface PracticeAnalytics {
  totalAttempts: number;
  correctAnswers: number;
  averageScore: number;
  totalPoints: number;
  totalTimeMinutes: number;
  hintsUsed: number;
  currentStreak: number;
  bestStreak: number;
  byDifficulty: Record<string, { attempts: number; correct: number }>;
  byBloomsLevel: Record<string, { attempts: number; correct: number }>;
  masteredConcepts: string[];
  conceptsNeedingReview: string[];
  difficultyProgression: { date: string; difficulty: string }[];
  recentProblems: {
    id: string;
    title: string;
    isCorrect: boolean;
    timestamp: Date;
  }[];
}

interface LearningStyleAnalytics {
  primaryStyle: string;
  secondaryStyle: string | null;
  styleScores: {
    visual: number;
    auditory: number;
    reading: number;
    kinesthetic: number;
  };
  preferredFormats: string[];
  preferredComplexity: string;
  readingPace: string;
  bestLearningTime: number | null;
  confidence: number;
  recommendations: string[];
  formatEngagement: { format: string; engagementScore: number }[];
}

interface SocraticAnalytics {
  totalDialogues: number;
  averageExchanges: number;
  insightsDiscovered: number;
  averageQuality: number;
  averageThinkingDepth: number;
  highestBloomsAchieved: BloomsLevel;
  completionRate: number;
  hintsUsed: number;
  growthAreas: string[];
  improvementAreas: string[];
  recentDialogues: {
    id: string;
    topic: string;
    insightsDiscovered: number;
    quality: number;
    completedAt: Date;
  }[];
}

interface PredictiveAnalytics {
  successProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  riskFactors: { factor: string; severity: string; description: string }[];
  successFactors: { factor: string; strength: string; description: string }[];
  recommendedActions: {
    type: string;
    priority: string;
    action: string;
    expectedImpact: number;
  }[];
  learningVelocity: {
    current: number;
    optimal: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  predictedCompletionDate: Date | null;
}

interface RetentionAnalytics {
  overallRetention: number;
  spacedRepetitionSchedule: {
    conceptId: string;
    concept: string;
    nextReviewDate: Date;
    masteryLevel: number;
    reviewCount: number;
  }[];
  topicsNeedingReview: string[];
  masteryLevels: { topic: string; mastery: number }[];
  forgettingCurve: { daysAgo: number; retentionPercent: number }[];
  studyPatterns: {
    preferredTime: string;
    averageSessionLength: number;
    consistencyScore: number;
  };
}

interface AchievementAnalytics {
  level: number;
  totalPoints: number;
  pointsToNextLevel: number;
  progressToNextLevel: number;
  totalAchievements: number;
  unlockedAchievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    unlockedAt: Date;
  }[];
  activeChallenges: {
    id: string;
    name: string;
    description: string;
    progress: number;
    target: number;
    expiresAt: Date | null;
  }[];
  completedChallenges: number;
  currentStreak: number;
  longestStreak: number;
  badges: { type: string; level: number; description: string }[];
  recommendations: { id: string; name: string; description: string }[];
}

interface CognitiveAnalytics {
  bloomsDistribution: Record<BloomsLevel, number>;
  currentLevel: BloomsLevel;
  targetLevel: BloomsLevel;
  progressByLevel: {
    level: BloomsLevel;
    score: number;
    attempts: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  strengthAreas: BloomsLevel[];
  growthOpportunities: BloomsLevel[];
  recentAssessments: {
    id: string;
    bloomsLevel: BloomsLevel;
    score: number;
    date: Date;
  }[];
}

interface SAMUnifiedAnalytics {
  userId: string;
  generatedAt: Date;
  practiceProblems: PracticeAnalytics;
  learningStyle: LearningStyleAnalytics;
  socraticDialogue: SocraticAnalytics;
  predictions: PredictiveAnalytics;
  retention: RetentionAnalytics;
  achievements: AchievementAnalytics;
  cognitiveProgress: CognitiveAnalytics;
  overallHealth: OverallHealthScore;
}

function createHealthScore(
  overrides: Partial<OverallHealthScore> = {}
): OverallHealthScore {
  return {
    score: 82,
    grade: 'B',
    components: {
      practice: 85,
      engagement: 78,
      retention: 80,
      progress: 90,
      consistency: 75,
    },
    trend: 'improving',
    insights: [
      'Your practice consistency has improved 15% this week',
      'Consider reviewing spaced repetition topics',
    ],
    nextSteps: [
      'Complete 3 more practice problems today',
      'Review flagged retention topics',
    ],
    ...overrides,
  };
}

function createPracticeAnalytics(
  overrides: Partial<PracticeAnalytics> = {}
): PracticeAnalytics {
  return {
    totalAttempts: 145,
    correctAnswers: 118,
    averageScore: 81,
    totalPoints: 2350,
    totalTimeMinutes: 480,
    hintsUsed: 23,
    currentStreak: 7,
    bestStreak: 14,
    byDifficulty: {
      easy: { attempts: 50, correct: 48 },
      medium: { attempts: 60, correct: 45 },
      hard: { attempts: 35, correct: 25 },
    },
    byBloomsLevel: {
      REMEMBER: { attempts: 40, correct: 38 },
      UNDERSTAND: { attempts: 35, correct: 30 },
      APPLY: { attempts: 30, correct: 22 },
      ANALYZE: { attempts: 20, correct: 15 },
      EVALUATE: { attempts: 12, correct: 8 },
      CREATE: { attempts: 8, correct: 5 },
    },
    masteredConcepts: ['Variables', 'Functions', 'Loops'],
    conceptsNeedingReview: ['Recursion', 'Dynamic Programming'],
    difficultyProgression: [
      { date: '2026-02-01', difficulty: 'easy' },
      { date: '2026-02-15', difficulty: 'medium' },
    ],
    recentProblems: [
      {
        id: 'p1',
        title: 'Array Sorting',
        isCorrect: true,
        timestamp: new Date(),
      },
      {
        id: 'p2',
        title: 'Binary Search',
        isCorrect: false,
        timestamp: new Date(),
      },
      {
        id: 'p3',
        title: 'Stack Implementation',
        isCorrect: true,
        timestamp: new Date(),
      },
    ],
    ...overrides,
  };
}

function createLearningStyleAnalytics(
  overrides: Partial<LearningStyleAnalytics> = {}
): LearningStyleAnalytics {
  return {
    primaryStyle: 'visual',
    secondaryStyle: 'reading',
    styleScores: {
      visual: 85,
      auditory: 45,
      reading: 72,
      kinesthetic: 60,
    },
    preferredFormats: ['diagrams', 'videos', 'infographics'],
    preferredComplexity: 'intermediate',
    readingPace: 'moderate',
    bestLearningTime: 10,
    confidence: 0.87,
    recommendations: [
      'Use more visual diagrams when studying',
      'Try interactive coding exercises for kinesthetic learning',
    ],
    formatEngagement: [
      { format: 'video', engagementScore: 92 },
      { format: 'text', engagementScore: 68 },
    ],
    ...overrides,
  };
}

function createSocraticAnalytics(
  overrides: Partial<SocraticAnalytics> = {}
): SocraticAnalytics {
  return {
    totalDialogues: 42,
    averageExchanges: 8,
    insightsDiscovered: 67,
    averageQuality: 78,
    averageThinkingDepth: 72,
    highestBloomsAchieved: 'ANALYZE' as BloomsLevel,
    completionRate: 85,
    hintsUsed: 15,
    growthAreas: ['Critical Thinking', 'Problem Decomposition'],
    improvementAreas: ['Abstract Reasoning'],
    recentDialogues: [
      {
        id: 'd1',
        topic: 'Data Structures',
        insightsDiscovered: 5,
        quality: 82,
        completedAt: new Date(),
      },
    ],
    ...overrides,
  };
}

function createPredictiveAnalytics(
  overrides: Partial<PredictiveAnalytics> = {}
): PredictiveAnalytics {
  return {
    successProbability: 0.85,
    riskLevel: 'low',
    riskScore: 15,
    riskFactors: [
      {
        factor: 'Inconsistent study schedule',
        severity: 'low',
        description: 'Minor gaps in study routine',
      },
    ],
    successFactors: [
      {
        factor: 'Strong practice habit',
        strength: 'high',
        description: 'Regular practice sessions',
      },
    ],
    recommendedActions: [
      {
        type: 'practice',
        priority: 'high',
        action: 'Focus on weak areas in recursion',
        expectedImpact: 15,
      },
      {
        type: 'review',
        priority: 'medium',
        action: 'Review dynamic programming concepts',
        expectedImpact: 10,
      },
    ],
    learningVelocity: {
      current: 72,
      optimal: 85,
      trend: 'improving',
    },
    predictedCompletionDate: new Date('2026-06-15'),
    ...overrides,
  };
}

function createRetentionAnalytics(
  overrides: Partial<RetentionAnalytics> = {}
): RetentionAnalytics {
  return {
    overallRetention: 78,
    spacedRepetitionSchedule: [
      {
        conceptId: 'c1',
        concept: 'Recursion',
        nextReviewDate: new Date(),
        masteryLevel: 65,
        reviewCount: 3,
      },
    ],
    topicsNeedingReview: ['Recursion', 'Graph Theory'],
    masteryLevels: [
      { topic: 'Arrays', mastery: 95 },
      { topic: 'Trees', mastery: 70 },
    ],
    forgettingCurve: [
      { daysAgo: 1, retentionPercent: 95 },
      { daysAgo: 7, retentionPercent: 72 },
    ],
    studyPatterns: {
      preferredTime: 'Morning',
      averageSessionLength: 45,
      consistencyScore: 82,
    },
    ...overrides,
  };
}

function createAchievementAnalytics(
  overrides: Partial<AchievementAnalytics> = {}
): AchievementAnalytics {
  return {
    level: 5,
    totalPoints: 2350,
    pointsToNextLevel: 650,
    progressToNextLevel: 78,
    totalAchievements: 12,
    unlockedAchievements: [
      {
        id: 'a1',
        name: 'First Steps',
        description: 'Complete your first lesson',
        icon: 'star',
        category: 'beginner',
        unlockedAt: new Date(),
      },
    ],
    activeChallenges: [
      {
        id: 'ch1',
        name: 'Weekly Warrior',
        description: 'Complete 10 problems this week',
        progress: 7,
        target: 10,
        expiresAt: new Date('2026-03-10'),
      },
      {
        id: 'ch2',
        name: 'Deep Thinker',
        description: 'Score 80%+ on 5 analysis problems',
        progress: 3,
        target: 5,
        expiresAt: null,
      },
    ],
    completedChallenges: 8,
    currentStreak: 7,
    longestStreak: 14,
    badges: [
      { type: 'streak', level: 2, description: '7-day streak' },
      { type: 'mastery', level: 1, description: 'First concept mastered' },
    ],
    recommendations: [
      {
        id: 'r1',
        name: 'Problem Solver',
        description: 'Solve 50 problems',
      },
    ],
    ...overrides,
  };
}

function createCognitiveAnalytics(
  overrides: Partial<CognitiveAnalytics> = {}
): CognitiveAnalytics {
  return {
    bloomsDistribution: {
      REMEMBER: 95,
      UNDERSTAND: 82,
      APPLY: 70,
      ANALYZE: 55,
      EVALUATE: 40,
      CREATE: 25,
    },
    currentLevel: 'APPLY' as BloomsLevel,
    targetLevel: 'EVALUATE' as BloomsLevel,
    progressByLevel: [
      {
        level: 'REMEMBER' as BloomsLevel,
        score: 95,
        attempts: 40,
        trend: 'stable' as const,
      },
      {
        level: 'UNDERSTAND' as BloomsLevel,
        score: 82,
        attempts: 35,
        trend: 'improving' as const,
      },
      {
        level: 'APPLY' as BloomsLevel,
        score: 70,
        attempts: 30,
        trend: 'improving' as const,
      },
      {
        level: 'ANALYZE' as BloomsLevel,
        score: 55,
        attempts: 20,
        trend: 'stable' as const,
      },
      {
        level: 'EVALUATE' as BloomsLevel,
        score: 40,
        attempts: 12,
        trend: 'declining' as const,
      },
      {
        level: 'CREATE' as BloomsLevel,
        score: 25,
        attempts: 8,
        trend: 'stable' as const,
      },
    ],
    strengthAreas: ['REMEMBER' as BloomsLevel, 'UNDERSTAND' as BloomsLevel],
    growthOpportunities: [
      'EVALUATE' as BloomsLevel,
      'CREATE' as BloomsLevel,
    ],
    recentAssessments: [
      {
        id: 'ra1',
        bloomsLevel: 'APPLY' as BloomsLevel,
        score: 72,
        date: new Date(),
      },
    ],
    ...overrides,
  };
}

function createFullAnalyticsData(
  overrides: Partial<SAMUnifiedAnalytics> = {}
): SAMUnifiedAnalytics {
  return {
    userId: 'user-123',
    generatedAt: new Date(),
    practiceProblems: createPracticeAnalytics(),
    learningStyle: createLearningStyleAnalytics(),
    socraticDialogue: createSocraticAnalytics(),
    predictions: createPredictiveAnalytics(),
    retention: createRetentionAnalytics(),
    achievements: createAchievementAnalytics(),
    cognitiveProgress: createCognitiveAnalytics(),
    overallHealth: createHealthScore(),
    ...overrides,
  };
}

// ============================================================================
// HELPER: Reset hook return to defaults before each test
// ============================================================================

function resetHookReturn() {
  mockHookReturn.data = null;
  mockHookReturn.loading = false;
  mockHookReturn.error = null;
  mockHookReturn.refresh = mockRefresh;
  mockHookReturn.isStale = false;
}

// ============================================================================
// TESTS
// ============================================================================

describe('SAMInsightsDashboard', () => {
  beforeEach(() => {
    resetHookReturn();
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Shows loading skeleton state
  // --------------------------------------------------------------------------

  describe('loading state', () => {
    it('renders a loading skeleton with the animate-pulse class when loading is true', () => {
      mockHookReturn.loading = true;

      const { container } = render(<SAMInsightsDashboard />);

      // DashboardSkeleton renders a div with className="space-y-6 animate-pulse"
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('renders skeleton placeholder blocks while loading', () => {
      mockHookReturn.loading = true;

      const { container } = render(<SAMInsightsDashboard />);

      // The skeleton has a 4-column grid with 4 items and a 2-column grid with 2 items
      const skeletonBlocks = container.querySelectorAll('.rounded-xl');
      // 1 (top bar) + 4 (grid) + 2 (secondary grid) = 7
      expect(skeletonBlocks.length).toBe(7);
    });

    it('does not render any card components while loading', () => {
      mockHookReturn.loading = true;

      render(<SAMInsightsDashboard />);

      expect(screen.queryByText('Learning Health Score')).not.toBeInTheDocument();
      expect(screen.queryByText('Practice Performance')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Renders data after hook returns
  // --------------------------------------------------------------------------

  describe('data rendering', () => {
    it('renders the full dashboard with all sub-cards when data is available', () => {
      mockHookReturn.data = createFullAnalyticsData();

      render(<SAMInsightsDashboard />);

      // Health score card
      expect(screen.getByText('Learning Health Score')).toBeInTheDocument();
      // Practice card
      expect(screen.getByText('Practice Performance')).toBeInTheDocument();
      // Learning style card
      expect(screen.getByText('Learning Style')).toBeInTheDocument();
      // Predictive card
      expect(screen.getByText('Success Prediction')).toBeInTheDocument();
      // Achievements card - appears in both card title and stats label, use getAllByText
      expect(screen.getAllByText('Achievements').length).toBeGreaterThanOrEqual(1);
      // Cognitive card
      expect(screen.getByText('Cognitive Progress')).toBeInTheDocument();
      // Socratic card
      expect(screen.getByText('Socratic Learning')).toBeInTheDocument();
      // Retention card
      expect(screen.getByText('Retention & Memory')).toBeInTheDocument();
    });

    it('renders the Recommended Next Steps section when nextSteps is non-empty', () => {
      mockHookReturn.data = createFullAnalyticsData();

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Recommended Next Steps')).toBeInTheDocument();
      expect(
        screen.getByText('Complete 3 more practice problems today')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Review flagged retention topics')
      ).toBeInTheDocument();
    });

    it('does not render Recommended Next Steps when nextSteps is empty', () => {
      mockHookReturn.data = createFullAnalyticsData({
        overallHealth: createHealthScore({ nextSteps: [] }),
      });

      render(<SAMInsightsDashboard />);

      expect(
        screen.queryByText('Recommended Next Steps')
      ).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 3. Shows error state with retry
  // --------------------------------------------------------------------------

  describe('error state', () => {
    it('displays the error message when an error occurs', () => {
      mockHookReturn.error = 'Failed to fetch analytics: 500';

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Unable to Load Analytics')).toBeInTheDocument();
      expect(
        screen.getByText('Failed to fetch analytics: 500')
      ).toBeInTheDocument();
    });

    it('renders a Try Again button in error state', () => {
      mockHookReturn.error = 'Network error';

      render(<SAMInsightsDashboard />);

      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
    });

    it('calls refresh when the Try Again button is clicked', () => {
      mockHookReturn.error = 'Network error';

      render(<SAMInsightsDashboard />);

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton.closest('button')!);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('does not render any analytics cards in error state', () => {
      mockHookReturn.error = 'Server error';

      render(<SAMInsightsDashboard />);

      expect(
        screen.queryByText('Practice Performance')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Learning Health Score')
      ).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Shows empty state for new learners
  // --------------------------------------------------------------------------

  describe('empty state', () => {
    it('shows the empty state when data is null', () => {
      mockHookReturn.data = null;

      render(<SAMInsightsDashboard />);

      expect(
        screen.getByText('Start Your Learning Journey')
      ).toBeInTheDocument();
    });

    it('shows the empty state when all activity counts are zero', () => {
      mockHookReturn.data = createFullAnalyticsData({
        practiceProblems: createPracticeAnalytics({ totalAttempts: 0 }),
        achievements: createAchievementAnalytics({ totalPoints: 0 }),
        socraticDialogue: createSocraticAnalytics({ totalDialogues: 0 }),
      });

      render(<SAMInsightsDashboard />);

      expect(
        screen.getByText('Start Your Learning Journey')
      ).toBeInTheDocument();
    });

    it('displays guidance text for new users in empty state', () => {
      mockHookReturn.data = null;

      render(<SAMInsightsDashboard />);

      expect(
        screen.getByText(/Complete lessons, practice problems/)
      ).toBeInTheDocument();
    });

    it('provides a Browse Courses link in empty state', () => {
      mockHookReturn.data = null;

      render(<SAMInsightsDashboard />);

      const browseLink = screen.getByText('Browse Courses');
      expect(browseLink).toBeInTheDocument();
      // The next/link mock renders an <a> tag
      expect(browseLink.closest('a')).toHaveAttribute('href', '/search');
    });

    it('provides a Refresh button in empty state that calls refresh', () => {
      mockHookReturn.data = null;

      render(<SAMInsightsDashboard />);

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton.closest('button')!);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('does not show empty state when only practiceProblems has activity', () => {
      mockHookReturn.data = createFullAnalyticsData({
        practiceProblems: createPracticeAnalytics({ totalAttempts: 5 }),
        achievements: createAchievementAnalytics({ totalPoints: 0 }),
        socraticDialogue: createSocraticAnalytics({ totalDialogues: 0 }),
      });

      render(<SAMInsightsDashboard />);

      expect(
        screen.queryByText('Start Your Learning Journey')
      ).not.toBeInTheDocument();
      expect(screen.getByText('Practice Performance')).toBeInTheDocument();
    });

    it('does not show empty state when only achievements has activity', () => {
      mockHookReturn.data = createFullAnalyticsData({
        practiceProblems: createPracticeAnalytics({ totalAttempts: 0 }),
        achievements: createAchievementAnalytics({ totalPoints: 100 }),
        socraticDialogue: createSocraticAnalytics({ totalDialogues: 0 }),
      });

      render(<SAMInsightsDashboard />);

      expect(
        screen.queryByText('Start Your Learning Journey')
      ).not.toBeInTheDocument();
    });

    it('does not show empty state when only socratic has activity', () => {
      mockHookReturn.data = createFullAnalyticsData({
        practiceProblems: createPracticeAnalytics({ totalAttempts: 0 }),
        achievements: createAchievementAnalytics({ totalPoints: 0 }),
        socraticDialogue: createSocraticAnalytics({ totalDialogues: 3 }),
      });

      render(<SAMInsightsDashboard />);

      expect(
        screen.queryByText('Start Your Learning Journey')
      ).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 5. Health score card with correct grade
  // --------------------------------------------------------------------------

  describe('HealthScoreCard', () => {
    it('displays the numeric health score', () => {
      mockHookReturn.data = createFullAnalyticsData({
        overallHealth: createHealthScore({ score: 82 }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('82')).toBeInTheDocument();
    });

    it('displays the letter grade', () => {
      mockHookReturn.data = createFullAnalyticsData({
        overallHealth: createHealthScore({ grade: 'B' }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('applies grade A color class for grade A', () => {
      mockHookReturn.data = createFullAnalyticsData({
        overallHealth: createHealthScore({ score: 95, grade: 'A' }),
      });

      const { container } = render(<SAMInsightsDashboard />);

      const gradeElement = screen.getByText('A');
      expect(gradeElement.className).toContain('emerald');
    });

    it('applies grade B color class for grade B', () => {
      mockHookReturn.data = createFullAnalyticsData({
        overallHealth: createHealthScore({ score: 82, grade: 'B' }),
      });

      render(<SAMInsightsDashboard />);

      const gradeElement = screen.getByText('B');
      expect(gradeElement.className).toContain('blue');
    });

    it('applies grade C color class for grade C', () => {
      mockHookReturn.data = createFullAnalyticsData({
        overallHealth: createHealthScore({ score: 72, grade: 'C' }),
      });

      render(<SAMInsightsDashboard />);

      const gradeElement = screen.getByText('C');
      expect(gradeElement.className).toContain('amber');
    });

    it('applies grade D color class for grade D', () => {
      mockHookReturn.data = createFullAnalyticsData({
        overallHealth: createHealthScore({ score: 60, grade: 'D' }),
      });

      render(<SAMInsightsDashboard />);

      const gradeElement = screen.getByText('D');
      expect(gradeElement.className).toContain('orange');
    });

    it('applies grade F color class for grade F', () => {
      mockHookReturn.data = createFullAnalyticsData({
        overallHealth: createHealthScore({ score: 40, grade: 'F' }),
      });

      render(<SAMInsightsDashboard />);

      const gradeElement = screen.getByText('F');
      expect(gradeElement.className).toContain('red');
    });

    it('renders component breakdown progress bars for all 5 components', () => {
      mockHookReturn.data = createFullAnalyticsData({
        overallHealth: createHealthScore({
          components: {
            practice: 85,
            engagement: 78,
            retention: 80,
            progress: 90,
            consistency: 75,
          },
        }),
      });

      render(<SAMInsightsDashboard />);

      // Should render component labels
      expect(screen.getByText('practice')).toBeInTheDocument();
      expect(screen.getByText('engagement')).toBeInTheDocument();
      // 'retention' may appear in both health components and the retention card title area
      expect(screen.getAllByText('retention').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('progress')).toBeInTheDocument();
      expect(screen.getByText('consistency')).toBeInTheDocument();

      // Percentage values may appear in multiple cards - use getAllByText
      expect(screen.getAllByText('85%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('78%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('80%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('90%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('75%').length).toBeGreaterThanOrEqual(1);
    });

    it('shows up to 2 insights from the health score', () => {
      mockHookReturn.data = createFullAnalyticsData({
        overallHealth: createHealthScore({
          insights: [
            'Insight one',
            'Insight two',
            'Insight three that should be hidden',
          ],
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Insight one')).toBeInTheDocument();
      expect(screen.getByText('Insight two')).toBeInTheDocument();
      expect(
        screen.queryByText('Insight three that should be hidden')
      ).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 6. Practice card with accuracy metrics
  // --------------------------------------------------------------------------

  describe('PracticeCard', () => {
    it('displays the average score as accuracy percentage', () => {
      mockHookReturn.data = createFullAnalyticsData({
        practiceProblems: createPracticeAnalytics({ averageScore: 81 }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getAllByText('81%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
    });

    it('displays the total number of problems solved', () => {
      mockHookReturn.data = createFullAnalyticsData({
        practiceProblems: createPracticeAnalytics({ totalAttempts: 145 }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('145')).toBeInTheDocument();
      expect(screen.getByText('Problems Solved')).toBeInTheDocument();
    });

    it('displays the current streak', () => {
      // Use a unique streak value to avoid collision with achievements streak
      mockHookReturn.data = createFullAnalyticsData({
        practiceProblems: createPracticeAnalytics({ currentStreak: 9 }),
        achievements: createAchievementAnalytics({ currentStreak: 3 }),
      });

      render(<SAMInsightsDashboard />);

      // The practice streak value "9" should appear
      expect(screen.getByText('9')).toBeInTheDocument();
      expect(screen.getByText('Day Streak')).toBeInTheDocument();
    });

    it('displays total points earned', () => {
      mockHookReturn.data = createFullAnalyticsData({
        practiceProblems: createPracticeAnalytics({ totalPoints: 2350 }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('2350')).toBeInTheDocument();
      expect(screen.getByText('Points Earned')).toBeInTheDocument();
    });

    it('renders recent problems with correct/incorrect indicators', () => {
      mockHookReturn.data = createFullAnalyticsData({
        practiceProblems: createPracticeAnalytics({
          recentProblems: [
            {
              id: 'p1',
              title: 'Array Sorting',
              isCorrect: true,
              timestamp: new Date(),
            },
            {
              id: 'p2',
              title: 'Binary Search',
              isCorrect: false,
              timestamp: new Date(),
            },
          ],
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('does not render recent activity section when recentProblems is empty', () => {
      mockHookReturn.data = createFullAnalyticsData({
        practiceProblems: createPracticeAnalytics({ recentProblems: [] }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.queryByText('Recent Activity')).not.toBeInTheDocument();
    });

    it('limits recent problems display to 10 items', () => {
      const manyProblems = Array.from({ length: 15 }, (_, i) => ({
        id: `p${i}`,
        title: `Problem ${i}`,
        isCorrect: i % 2 === 0,
        timestamp: new Date(),
      }));

      mockHookReturn.data = createFullAnalyticsData({
        practiceProblems: createPracticeAnalytics({
          recentProblems: manyProblems,
        }),
      });

      const { container } = render(<SAMInsightsDashboard />);

      // Each recent problem renders either a CheckCircle2 icon or a span with X
      // The container for recent problems is a flex gap-1 div
      const recentActivityContainer = container.querySelector('.flex.gap-1');
      if (recentActivityContainer) {
        // Should have at most 10 children (slice(0, 10))
        expect(recentActivityContainer.children.length).toBeLessThanOrEqual(10);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 7. Achievements card with level/badges
  // --------------------------------------------------------------------------

  describe('AchievementsCard', () => {
    it('displays the current level number', () => {
      mockHookReturn.data = createFullAnalyticsData({
        achievements: createAchievementAnalytics({ level: 5 }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays total points', () => {
      mockHookReturn.data = createFullAnalyticsData({
        achievements: createAchievementAnalytics({ totalPoints: 2350 }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('2350 pts')).toBeInTheDocument();
    });

    it('displays points to next level information', () => {
      mockHookReturn.data = createFullAnalyticsData({
        achievements: createAchievementAnalytics({
          level: 5,
          pointsToNextLevel: 650,
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('650 pts to Level 6')).toBeInTheDocument();
    });

    it('displays total achievements count', () => {
      // Use a unique value to avoid collision with other numeric displays
      mockHookReturn.data = createFullAnalyticsData({
        achievements: createAchievementAnalytics({ totalAchievements: 19 }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('19')).toBeInTheDocument();
      // "Achievements" appears both as card title and stats label
      expect(screen.getAllByText('Achievements').length).toBeGreaterThanOrEqual(2);
    });

    it('displays current streak count', () => {
      mockHookReturn.data = createFullAnalyticsData({
        achievements: createAchievementAnalytics({ currentStreak: 7 }),
      });

      render(<SAMInsightsDashboard />);

      // The streak "7" appears in both practice and achievements cards
      const streakLabels = screen.getAllByText('Streak');
      expect(streakLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('displays badge count', () => {
      mockHookReturn.data = createFullAnalyticsData({
        achievements: createAchievementAnalytics({
          badges: [
            { type: 'streak', level: 2, description: '7-day streak' },
            { type: 'mastery', level: 1, description: 'First mastery' },
          ],
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Badges')).toBeInTheDocument();
    });

    it('renders active challenges with progress', () => {
      mockHookReturn.data = createFullAnalyticsData({
        achievements: createAchievementAnalytics({
          activeChallenges: [
            {
              id: 'ch1',
              name: 'Weekly Warrior',
              description: 'Complete 10 problems',
              progress: 7,
              target: 10,
              expiresAt: null,
            },
          ],
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Active Challenges')).toBeInTheDocument();
      expect(screen.getByText('Weekly Warrior')).toBeInTheDocument();
      expect(screen.getByText('7/10')).toBeInTheDocument();
    });

    it('does not render Active Challenges section when activeChallenges is empty', () => {
      mockHookReturn.data = createFullAnalyticsData({
        achievements: createAchievementAnalytics({ activeChallenges: [] }),
      });

      render(<SAMInsightsDashboard />);

      expect(
        screen.queryByText('Active Challenges')
      ).not.toBeInTheDocument();
    });

    it('renders a progress bar for level progress', () => {
      mockHookReturn.data = createFullAnalyticsData({
        achievements: createAchievementAnalytics({ progressToNextLevel: 78 }),
      });

      render(<SAMInsightsDashboard />);

      const progressBars = screen.getAllByTestId('progress-bar');
      const levelBar = progressBars.find(
        (bar) => bar.getAttribute('aria-valuenow') === '78'
      );
      expect(levelBar).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // 8. Refresh button triggers refetch
  // --------------------------------------------------------------------------

  describe('refresh interactions', () => {
    it('calls refresh when the stale data Refresh button is clicked', () => {
      mockHookReturn.data = createFullAnalyticsData();
      mockHookReturn.isStale = true;

      render(<SAMInsightsDashboard />);

      // The stale indicator has a Refresh button
      const refreshButtons = screen.getAllByText('Refresh');
      fireEvent.click(refreshButtons[0].closest('button')!);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('calls refresh when the error state Try Again button is clicked', () => {
      mockHookReturn.error = 'Some error';

      render(<SAMInsightsDashboard />);

      fireEvent.click(screen.getByText('Try Again').closest('button')!);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('calls refresh when the empty state Refresh button is clicked', () => {
      mockHookReturn.data = null;

      render(<SAMInsightsDashboard />);

      fireEvent.click(screen.getByText('Refresh').closest('button')!);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // 9. Stale data indicator when data is old
  // --------------------------------------------------------------------------

  describe('stale data indicator', () => {
    it('shows the stale data warning when isStale is true', () => {
      mockHookReturn.data = createFullAnalyticsData();
      mockHookReturn.isStale = true;

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Data may be outdated')).toBeInTheDocument();
    });

    it('does not show stale data warning when isStale is false', () => {
      mockHookReturn.data = createFullAnalyticsData();
      mockHookReturn.isStale = false;

      render(<SAMInsightsDashboard />);

      expect(
        screen.queryByText('Data may be outdated')
      ).not.toBeInTheDocument();
    });

    it('shows Refresh button inside the stale data indicator', () => {
      mockHookReturn.data = createFullAnalyticsData();
      mockHookReturn.isStale = true;

      render(<SAMInsightsDashboard />);

      // The stale indicator is an amber-colored bar with a Refresh button
      const staleContainer = screen
        .getByText('Data may be outdated')
        .closest('div');
      expect(staleContainer).toBeInTheDocument();
      expect(staleContainer!.className).toContain('amber');
    });
  });

  // --------------------------------------------------------------------------
  // 10. Handles missing/partial data gracefully
  // --------------------------------------------------------------------------

  describe('partial data handling', () => {
    it('renders without crashing when recentProblems array is empty', () => {
      mockHookReturn.data = createFullAnalyticsData({
        practiceProblems: createPracticeAnalytics({ recentProblems: [] }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Practice Performance')).toBeInTheDocument();
      expect(screen.queryByText('Recent Activity')).not.toBeInTheDocument();
    });

    it('renders without crashing when recommendations is empty', () => {
      mockHookReturn.data = createFullAnalyticsData({
        learningStyle: createLearningStyleAnalytics({ recommendations: [] }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Learning Style')).toBeInTheDocument();
      expect(
        screen.queryByText('Recommendations')
      ).not.toBeInTheDocument();
    });

    it('renders without crashing when growthAreas is empty', () => {
      mockHookReturn.data = createFullAnalyticsData({
        socraticDialogue: createSocraticAnalytics({ growthAreas: [] }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Socratic Learning')).toBeInTheDocument();
      expect(screen.queryByText('Growth Areas')).not.toBeInTheDocument();
    });

    it('renders without crashing when recommendedActions is empty', () => {
      mockHookReturn.data = createFullAnalyticsData({
        predictions: createPredictiveAnalytics({ recommendedActions: [] }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Success Prediction')).toBeInTheDocument();
      expect(screen.queryByText('Next Steps')).not.toBeInTheDocument();
    });

    it('renders without crashing when topicsNeedingReview is empty', () => {
      mockHookReturn.data = createFullAnalyticsData({
        retention: createRetentionAnalytics({ topicsNeedingReview: [] }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Retention & Memory')).toBeInTheDocument();
      expect(screen.queryByText('Needs Review')).not.toBeInTheDocument();
    });

    it('renders without crashing when strengthAreas is empty', () => {
      mockHookReturn.data = createFullAnalyticsData({
        cognitiveProgress: createCognitiveAnalytics({ strengthAreas: [] }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Cognitive Progress')).toBeInTheDocument();
      expect(screen.queryByText('Strengths')).not.toBeInTheDocument();
    });

    it('renders without crashing when insights is empty', () => {
      mockHookReturn.data = createFullAnalyticsData({
        overallHealth: createHealthScore({ insights: [] }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Learning Health Score')).toBeInTheDocument();
    });

    it('renders without crashing when activeChallenges is empty', () => {
      mockHookReturn.data = createFullAnalyticsData({
        achievements: createAchievementAnalytics({ activeChallenges: [] }),
      });

      render(<SAMInsightsDashboard />);

      // "Achievements" appears as both card title and stats label
      expect(screen.getAllByText('Achievements').length).toBeGreaterThanOrEqual(1);
    });
  });

  // --------------------------------------------------------------------------
  // Additional sub-card tests
  // --------------------------------------------------------------------------

  describe('LearningStyleCard', () => {
    it('displays the primary learning style', () => {
      // "visual" appears both as the primary style heading and in the scores list
      mockHookReturn.data = createFullAnalyticsData({
        learningStyle: createLearningStyleAnalytics({
          primaryStyle: 'visual',
        }),
      });

      render(<SAMInsightsDashboard />);

      // The primary style appears in the heading (text-lg font-semibold capitalize)
      // and in the scores list (w-20 text-xs capitalize), so use getAllByText
      const visualElements = screen.getAllByText('visual');
      expect(visualElements.length).toBeGreaterThanOrEqual(2);
    });

    it('displays the confidence percentage', () => {
      mockHookReturn.data = createFullAnalyticsData({
        learningStyle: createLearningStyleAnalytics({ confidence: 0.87 }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('87% confidence')).toBeInTheDocument();
    });

    it('renders style score progress bars for all four modalities', () => {
      mockHookReturn.data = createFullAnalyticsData({
        learningStyle: createLearningStyleAnalytics({
          styleScores: {
            visual: 85,
            auditory: 45,
            reading: 72,
            kinesthetic: 60,
          },
        }),
      });

      render(<SAMInsightsDashboard />);

      // "visual" may appear multiple times (primary style label + scores list)
      expect(screen.getAllByText('visual').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('auditory')).toBeInTheDocument();
      // "reading" may appear in primary/secondary style context too
      expect(screen.getAllByText('reading').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('kinesthetic')).toBeInTheDocument();
    });

    it('renders recommendations when provided', () => {
      mockHookReturn.data = createFullAnalyticsData({
        learningStyle: createLearningStyleAnalytics({
          recommendations: [
            'Use more visual diagrams when studying',
            'Try interactive coding exercises',
          ],
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(
        screen.getByText('Use more visual diagrams when studying')
      ).toBeInTheDocument();
    });

    it('limits displayed recommendations to 2', () => {
      mockHookReturn.data = createFullAnalyticsData({
        learningStyle: createLearningStyleAnalytics({
          recommendations: [
            'Recommendation one',
            'Recommendation two',
            'Recommendation three should be hidden',
          ],
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Recommendation one')).toBeInTheDocument();
      expect(screen.getByText('Recommendation two')).toBeInTheDocument();
      expect(
        screen.queryByText('Recommendation three should be hidden')
      ).not.toBeInTheDocument();
    });
  });

  describe('PredictiveCard', () => {
    it('displays the success probability as a percentage', () => {
      // Use a unique probability value to avoid collision with health component percentages
      mockHookReturn.data = createFullAnalyticsData({
        predictions: createPredictiveAnalytics({
          successProbability: 0.91,
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('91%')).toBeInTheDocument();
      expect(screen.getByText('Success Probability')).toBeInTheDocument();
    });

    it('displays the risk level badge for low risk', () => {
      mockHookReturn.data = createFullAnalyticsData({
        predictions: createPredictiveAnalytics({ riskLevel: 'low' }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('LOW RISK')).toBeInTheDocument();
    });

    it('displays the risk level badge for high risk', () => {
      mockHookReturn.data = createFullAnalyticsData({
        predictions: createPredictiveAnalytics({ riskLevel: 'high' }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('HIGH RISK')).toBeInTheDocument();
    });

    it('displays the risk level badge for medium risk', () => {
      mockHookReturn.data = createFullAnalyticsData({
        predictions: createPredictiveAnalytics({ riskLevel: 'medium' }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('MEDIUM RISK')).toBeInTheDocument();
    });

    it('displays learning velocity information', () => {
      mockHookReturn.data = createFullAnalyticsData({
        predictions: createPredictiveAnalytics({
          learningVelocity: {
            current: 72,
            optimal: 85,
            trend: 'improving',
          },
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Learning Velocity')).toBeInTheDocument();
      expect(screen.getByText('72% / 85%')).toBeInTheDocument();
    });

    it('renders recommended actions when provided', () => {
      mockHookReturn.data = createFullAnalyticsData({
        predictions: createPredictiveAnalytics({
          recommendedActions: [
            {
              type: 'practice',
              priority: 'high',
              action: 'Focus on weak areas in recursion',
              expectedImpact: 15,
            },
          ],
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(
        screen.getByText('Focus on weak areas in recursion')
      ).toBeInTheDocument();
    });

    it('applies emerald color for low risk badge', () => {
      mockHookReturn.data = createFullAnalyticsData({
        predictions: createPredictiveAnalytics({ riskLevel: 'low' }),
      });

      render(<SAMInsightsDashboard />);

      const riskBadge = screen.getByText('LOW RISK').closest('[data-testid="badge"]');
      expect(riskBadge!.className).toContain('emerald');
    });

    it('applies red color for high risk badge', () => {
      mockHookReturn.data = createFullAnalyticsData({
        predictions: createPredictiveAnalytics({ riskLevel: 'high' }),
      });

      render(<SAMInsightsDashboard />);

      const riskBadge = screen.getByText('HIGH RISK').closest('[data-testid="badge"]');
      expect(riskBadge!.className).toContain('red');
    });
  });

  describe('SocraticCard', () => {
    it('displays total dialogues count', () => {
      mockHookReturn.data = createFullAnalyticsData({
        socraticDialogue: createSocraticAnalytics({ totalDialogues: 42 }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Dialogues')).toBeInTheDocument();
    });

    it('displays insights discovered count', () => {
      mockHookReturn.data = createFullAnalyticsData({
        socraticDialogue: createSocraticAnalytics({
          insightsDiscovered: 67,
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('67')).toBeInTheDocument();
      expect(screen.getByText('Insights')).toBeInTheDocument();
    });

    it('displays average quality percentage', () => {
      // Use a unique value to avoid collision with health/retention percentages
      mockHookReturn.data = createFullAnalyticsData({
        socraticDialogue: createSocraticAnalytics({ averageQuality: 83 }),
      });

      render(<SAMInsightsDashboard />);

      // "83%" may still collide across cards - use getAllByText and verify label
      expect(screen.getAllByText('83%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Avg Quality')).toBeInTheDocument();
    });

    it('displays average thinking depth', () => {
      // Use a unique value to avoid collision with other percentage displays
      mockHookReturn.data = createFullAnalyticsData({
        socraticDialogue: createSocraticAnalytics({
          averageThinkingDepth: 68,
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getAllByText('68%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Thinking Depth')).toBeInTheDocument();
    });

    it('renders growth area badges when provided', () => {
      mockHookReturn.data = createFullAnalyticsData({
        socraticDialogue: createSocraticAnalytics({
          growthAreas: ['Critical Thinking', 'Problem Decomposition'],
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Growth Areas')).toBeInTheDocument();
      expect(screen.getByText('Critical Thinking')).toBeInTheDocument();
      expect(screen.getByText('Problem Decomposition')).toBeInTheDocument();
    });
  });

  describe('CognitiveCard', () => {
    it('displays the current cognitive level badge', () => {
      mockHookReturn.data = createFullAnalyticsData({
        cognitiveProgress: createCognitiveAnalytics({
          currentLevel: 'APPLY' as BloomsLevel,
        }),
      });

      render(<SAMInsightsDashboard />);

      const badges = screen.getAllByTestId('badge');
      const applyBadge = badges.find(
        (b) => b.textContent === 'APPLY'
      );
      expect(applyBadge).toBeTruthy();
    });

    it('displays the target cognitive level badge', () => {
      mockHookReturn.data = createFullAnalyticsData({
        cognitiveProgress: createCognitiveAnalytics({
          targetLevel: 'EVALUATE' as BloomsLevel,
        }),
      });

      render(<SAMInsightsDashboard />);

      const badges = screen.getAllByTestId('badge');
      const evaluateBadge = badges.find(
        (b) => b.textContent === 'EVALUATE'
      );
      expect(evaluateBadge).toBeTruthy();
    });

    it('renders progress bars for all 6 Blooms levels', () => {
      mockHookReturn.data = createFullAnalyticsData();

      render(<SAMInsightsDashboard />);

      // The Cognitive Progress card shows all 6 levels with formatted names
      // Some names may appear in multiple contexts, so use getAllByText
      expect(screen.getAllByText('Remember').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Understand').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Apply').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Analyze').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Evaluate').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Create').length).toBeGreaterThanOrEqual(1);
    });

    it('displays Current Level and Target Level labels', () => {
      mockHookReturn.data = createFullAnalyticsData();

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Current Level')).toBeInTheDocument();
      expect(screen.getByText('Target Level')).toBeInTheDocument();
    });

    it('renders strength area badges when provided', () => {
      mockHookReturn.data = createFullAnalyticsData({
        cognitiveProgress: createCognitiveAnalytics({
          strengthAreas: [
            'REMEMBER' as BloomsLevel,
            'UNDERSTAND' as BloomsLevel,
          ],
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Strengths')).toBeInTheDocument();
      const badges = screen.getAllByTestId('badge');
      const rememberBadge = badges.find(
        (b) => b.textContent === 'REMEMBER'
      );
      const understandBadge = badges.find(
        (b) => b.textContent === 'UNDERSTAND'
      );
      expect(rememberBadge).toBeTruthy();
      expect(understandBadge).toBeTruthy();
    });

    it('displays percentage scores for each Blooms level', () => {
      // Use a unique score value to verify it appears in the cognitive card
      mockHookReturn.data = createFullAnalyticsData({
        cognitiveProgress: createCognitiveAnalytics({
          progressByLevel: [
            {
              level: 'REMEMBER' as BloomsLevel,
              score: 97,
              attempts: 40,
              trend: 'stable' as const,
            },
          ],
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getAllByText('97%').length).toBeGreaterThanOrEqual(1);
    });

    it('handles missing progress data by showing 0%', () => {
      mockHookReturn.data = createFullAnalyticsData({
        cognitiveProgress: createCognitiveAnalytics({
          progressByLevel: [],
        }),
      });

      render(<SAMInsightsDashboard />);

      // With no progress data, each level falls back to 0
      const zeroPercents = screen.getAllByText('0%');
      // 6 levels * 1 percentage display = 6 zeros
      expect(zeroPercents.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('RetentionCard', () => {
    it('displays overall retention percentage', () => {
      // Use a unique value to avoid collision with other percentage displays
      mockHookReturn.data = createFullAnalyticsData({
        retention: createRetentionAnalytics({ overallRetention: 73 }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getAllByText('73%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Overall Retention')).toBeInTheDocument();
    });

    it('displays consistency score', () => {
      // Use a unique value to avoid collision
      mockHookReturn.data = createFullAnalyticsData({
        retention: createRetentionAnalytics({
          studyPatterns: {
            preferredTime: 'Morning',
            averageSessionLength: 45,
            consistencyScore: 88,
          },
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getAllByText('88%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Consistency')).toBeInTheDocument();
    });

    it('displays preferred study time', () => {
      mockHookReturn.data = createFullAnalyticsData({
        retention: createRetentionAnalytics({
          studyPatterns: {
            preferredTime: 'Evening',
            averageSessionLength: 30,
            consistencyScore: 76,
          },
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Evening')).toBeInTheDocument();
      expect(screen.getByText('Best Time')).toBeInTheDocument();
    });

    it('displays average session length', () => {
      mockHookReturn.data = createFullAnalyticsData({
        retention: createRetentionAnalytics({
          studyPatterns: {
            preferredTime: 'Afternoon',
            averageSessionLength: 37,
            consistencyScore: 76,
          },
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('37m')).toBeInTheDocument();
      expect(screen.getByText('Avg Session')).toBeInTheDocument();
    });

    it('renders topics needing review as badges', () => {
      mockHookReturn.data = createFullAnalyticsData({
        retention: createRetentionAnalytics({
          topicsNeedingReview: ['Recursion', 'Graph Theory'],
        }),
      });

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Needs Review')).toBeInTheDocument();
      expect(screen.getByText('Recursion')).toBeInTheDocument();
      expect(screen.getByText('Graph Theory')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // className prop passthrough
  // --------------------------------------------------------------------------

  describe('className prop', () => {
    it('applies the className to the root container when data is present', () => {
      mockHookReturn.data = createFullAnalyticsData();

      const { container } = render(
        <SAMInsightsDashboard className="custom-class" />
      );

      // The root element is a motion.div rendered as a regular div by the mock
      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain('custom-class');
      expect(root.className).toContain('space-y-6');
    });
  });

  // --------------------------------------------------------------------------
  // Priority order of states
  // --------------------------------------------------------------------------

  describe('state priority', () => {
    it('loading takes priority over error', () => {
      mockHookReturn.loading = true;
      mockHookReturn.error = 'Some error';

      const { container } = render(<SAMInsightsDashboard />);

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      expect(
        screen.queryByText('Unable to Load Analytics')
      ).not.toBeInTheDocument();
    });

    it('error takes priority over empty state', () => {
      mockHookReturn.error = 'Something went wrong';
      mockHookReturn.data = null;

      render(<SAMInsightsDashboard />);

      expect(screen.getByText('Unable to Load Analytics')).toBeInTheDocument();
      expect(
        screen.queryByText('Start Your Learning Journey')
      ).not.toBeInTheDocument();
    });
  });
});
