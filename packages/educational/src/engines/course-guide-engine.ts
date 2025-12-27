/**
 * @sam-ai/educational - Course Guide Engine
 *
 * Portable course analytics engine for teacher insights
 * Calculates depth, engagement, and market acceptance metrics
 */

import type {
  CourseGuideEngineConfig,
  CourseGuideDatabaseAdapter,
  CourseGuideInput,
  CourseGuideMetrics,
  CourseGuideDepthMetrics,
  CourseGuideEngagementMetrics,
  CourseGuideMarketMetrics,
  TeacherInsights,
  CourseGuideInsightItem,
  CourseGuideActionItem,
  CourseComparison,
  SimilarCourse,
  CourseGuideResponse,
  CourseGuideContentRecommendation,
  CourseGuideEngagementRecommendation,
  MarketingRecommendation,
  CourseSuccessPrediction,
  CourseGuideEngine as ICourseGuideEngine,
} from '../types';

export class CourseGuideEngine implements ICourseGuideEngine {
  private databaseAdapter?: CourseGuideDatabaseAdapter;

  constructor(config: CourseGuideEngineConfig = {}) {
    this.databaseAdapter = config.databaseAdapter;
  }

  async generateCourseGuide(
    courseId: string,
    includeComparison = true,
    includeProjections = true
  ): Promise<CourseGuideResponse> {
    if (!this.databaseAdapter) {
      throw new Error('Database adapter is required for course guide generation');
    }

    const course = await this.databaseAdapter.getCourse(courseId);

    if (!course) {
      throw new Error('Course not found');
    }

    // Calculate all metrics
    const metrics = await this.calculateMetrics(course);

    // Generate insights
    const insights = await this.generateInsights(course, metrics);

    // Get course comparison if requested
    const comparison = includeComparison
      ? await this.generateComparison(course)
      : this.getDefaultComparison(courseId);

    // Generate recommendations
    const recommendations = this.generateRecommendations(course, metrics, insights);

    // Generate success prediction if requested
    const successPrediction = includeProjections
      ? await this.predictSuccess(course, metrics)
      : this.getDefaultPrediction();

    return {
      courseId,
      courseTitle: course.title,
      metrics,
      insights,
      comparison,
      recommendations,
      successPrediction,
    };
  }

  async calculateMetrics(course: CourseGuideInput): Promise<CourseGuideMetrics> {
    const depth = this.calculateDepthMetrics(course);
    const engagement = await this.calculateEngagementMetrics(course);
    const marketAcceptance = this.calculateMarketAcceptanceMetrics(course);

    return {
      depth,
      engagement,
      marketAcceptance,
    };
  }

  private calculateDepthMetrics(course: CourseGuideInput): CourseGuideDepthMetrics {
    const totalSections = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.length,
      0
    );
    const totalExams = course.chapters.reduce(
      (sum, ch) =>
        sum + ch.sections.reduce((s, sec) => s + sec.exams.length, 0),
      0
    );
    const totalQuestions = course.chapters.reduce(
      (sum, ch) =>
        sum + ch.sections.reduce((s, sec) => s + sec.questions.length, 0),
      0
    );

    const contentRichness = Math.min(
      ((totalSections * 10) + (totalExams * 20) + (totalQuestions * 5)) / 10,
      100
    );

    const topicCoverage = Math.min(course.chapters.length * 15, 100);

    const assessmentQuality =
      totalExams > 0 ? Math.min((totalQuestions / totalExams) * 10, 100) : 0;

    const learningPathClarity = course.chapters.every(
      (ch) => ch.sections.length > 0
    )
      ? 80
      : 50;

    const overallDepth =
      (contentRichness + topicCoverage + assessmentQuality + learningPathClarity) / 4;

    return {
      contentRichness,
      topicCoverage,
      assessmentQuality,
      learningPathClarity,
      overallDepth,
    };
  }

  private async calculateEngagementMetrics(
    course: CourseGuideInput
  ): Promise<CourseGuideEngagementMetrics> {
    const totalEnrollments = course.enrollments.length;

    if (totalEnrollments === 0) {
      return {
        completionRate: 0,
        averageProgress: 0,
        interactionFrequency: 0,
        studentSatisfaction: 0,
        retentionRate: 0,
        overallEngagement: 0,
      };
    }

    // Completion rate
    const completedCount = course.enrollments.filter(
      (e) => e.progress?.isCompleted
    ).length;
    const completionRate = (completedCount / totalEnrollments) * 100;

    // Average progress
    const totalProgress = course.enrollments.reduce(
      (sum, e) => sum + (e.progress?.percentage || 0),
      0
    );
    const averageProgress = totalProgress / totalEnrollments;

    // Interaction frequency
    let interactionFrequency = 0;
    if (this.databaseAdapter) {
      const recentActivity = await this.databaseAdapter.getRecentInteractionCount(
        course.id,
        7
      );
      interactionFrequency = Math.min((recentActivity / totalEnrollments) * 20, 100);
    }

    // Student satisfaction (from reviews)
    const avgRating =
      course.reviews.length > 0
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
        : 0;
    const studentSatisfaction = (avgRating / 5) * 100;

    // Retention rate (students still active)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeStudents = course.enrollments.filter(
      (e) =>
        e.progress?.lastAccessedAt &&
        new Date(e.progress.lastAccessedAt) > thirtyDaysAgo
    ).length;
    const retentionRate =
      totalEnrollments > 0 ? (activeStudents / totalEnrollments) * 100 : 0;

    const overallEngagement =
      (completionRate +
        averageProgress +
        interactionFrequency +
        studentSatisfaction +
        retentionRate) /
      5;

    return {
      completionRate,
      averageProgress,
      interactionFrequency,
      studentSatisfaction,
      retentionRate,
      overallEngagement,
    };
  }

  private calculateMarketAcceptanceMetrics(
    course: CourseGuideInput
  ): CourseGuideMarketMetrics {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentPurchases = course.purchases.filter(
      (p) => new Date(p.createdAt) > thirtyDaysAgo
    ).length;
    const olderPurchases = course.purchases.filter(
      (p) => new Date(p.createdAt) <= thirtyDaysAgo
    ).length;

    const enrollmentGrowth =
      olderPurchases > 0
        ? ((recentPurchases - olderPurchases) / olderPurchases) * 100
        : recentPurchases > 0
        ? 100
        : 0;

    const competitivePosition = 60; // Default middle position

    const avgPrice = course.price || 0;
    const pricingOptimality = avgPrice > 0 && avgPrice < 200 ? 80 : 50;

    const avgRating =
      course.reviews.length > 0
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
        : 0;
    const reviewScore = (avgRating / 5) * 100;

    const highRatings = course.reviews.filter((r) => r.rating >= 4).length;
    const recommendationRate =
      course.reviews.length > 0
        ? (highRatings / course.reviews.length) * 100
        : 0;

    const overallAcceptance =
      (Math.max(0, Math.min(100, enrollmentGrowth)) +
        competitivePosition +
        pricingOptimality +
        reviewScore +
        recommendationRate) /
      5;

    return {
      enrollmentGrowth: Math.max(0, Math.min(100, enrollmentGrowth)),
      competitivePosition,
      pricingOptimality,
      reviewScore,
      recommendationRate,
      overallAcceptance,
    };
  }

  async generateInsights(
    course: CourseGuideInput,
    metrics: CourseGuideMetrics
  ): Promise<TeacherInsights> {
    const strengths: CourseGuideInsightItem[] = [];
    const improvements: CourseGuideInsightItem[] = [];
    const opportunities: CourseGuideInsightItem[] = [];

    // Analyze depth
    if (metrics.depth.overallDepth > 70) {
      strengths.push({
        category: 'depth',
        title: 'Strong Content Foundation',
        description:
          'Your course has comprehensive content coverage and well-structured learning paths',
        impact: 'high',
        metric: metrics.depth.overallDepth,
      });
    } else {
      improvements.push({
        category: 'depth',
        title: 'Enhance Content Depth',
        description:
          'Add more comprehensive content and assessments to improve course depth',
        impact: 'high',
        metric: metrics.depth.overallDepth,
      });
    }

    // Analyze engagement
    if (metrics.engagement.completionRate > 60) {
      strengths.push({
        category: 'engagement',
        title: 'High Completion Rate',
        description: 'Students are successfully completing your course',
        impact: 'high',
        metric: metrics.engagement.completionRate,
      });
    } else {
      improvements.push({
        category: 'engagement',
        title: 'Improve Completion Rates',
        description:
          'Focus on student motivation and support to increase completions',
        impact: 'high',
        metric: metrics.engagement.completionRate,
      });
    }

    // Market opportunities
    if (metrics.marketAcceptance.enrollmentGrowth > 10) {
      opportunities.push({
        category: 'market',
        title: 'Growing Market Segment',
        description:
          'Your course is in a rapidly growing market with expansion potential',
        impact: 'high',
        metric: metrics.marketAcceptance.enrollmentGrowth,
      });
    }

    const actionPlan = this.generateActionPlan(metrics, improvements, opportunities);

    return {
      strengths,
      improvements,
      opportunities,
      actionPlan,
    };
  }

  private generateActionPlan(
    metrics: CourseGuideMetrics,
    improvements: CourseGuideInsightItem[],
    opportunities: CourseGuideInsightItem[]
  ): CourseGuideActionItem[] {
    const actions: CourseGuideActionItem[] = [];

    if (metrics.engagement.overallEngagement < 50) {
      actions.push({
        priority: 'immediate',
        action: 'Implement student engagement features',
        expectedOutcome: 'Increase student interaction and retention by 30%',
        effort: 'medium',
        timeline: '1-2 weeks',
      });
    }

    if (metrics.depth.assessmentQuality < 60) {
      actions.push({
        priority: 'short-term',
        action: 'Add comprehensive assessments to each chapter',
        expectedOutcome: 'Improve learning validation and student confidence',
        effort: 'medium',
        timeline: '2-4 weeks',
      });
    }

    opportunities.forEach((opp) => {
      if (opp.impact === 'high') {
        actions.push({
          priority: 'long-term',
          action: `Capitalize on ${opp.title}`,
          expectedOutcome: opp.description,
          effort: 'high',
          timeline: '1-3 months',
        });
      }
    });

    return actions;
  }

  async generateComparison(course: CourseGuideInput): Promise<CourseComparison> {
    if (!this.databaseAdapter) {
      return this.getDefaultComparison(course.id);
    }

    const competitors = await this.databaseAdapter.findCompetitors(course.id);
    const similarCourses = competitors.slice(0, 5);

    const marketPosition = this.determineMarketPosition(course, similarCourses);
    const differentiators = this.identifyDifferentiators(course, similarCourses);
    const gaps = this.identifyGaps(course, similarCourses);

    return {
      courseId: course.id,
      similarCourses,
      marketPosition,
      differentiators,
      gaps,
    };
  }

  private getDefaultComparison(courseId: string): CourseComparison {
    return {
      courseId,
      similarCourses: [],
      marketPosition: 'competitive',
      differentiators: [],
      gaps: [],
    };
  }

  private determineMarketPosition(
    course: CourseGuideInput,
    competitors: SimilarCourse[]
  ): 'leader' | 'competitive' | 'follower' | 'niche' {
    if (competitors.length === 0) return 'niche';

    const avgCompetitorEnrollments =
      competitors.reduce((sum, c) => sum + c.enrollment, 0) / competitors.length;

    const courseEnrollments = course.enrollments.length;

    if (courseEnrollments > avgCompetitorEnrollments * 1.5) {
      return 'leader';
    } else if (courseEnrollments > avgCompetitorEnrollments * 0.8) {
      return 'competitive';
    } else {
      return 'follower';
    }
  }

  private identifyDifferentiators(
    course: CourseGuideInput,
    competitors: SimilarCourse[]
  ): string[] {
    const differentiators: string[] = [];

    if (competitors.length === 0) return differentiators;

    const avgCompetitorPrice =
      competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
    if (course.price && course.price < avgCompetitorPrice * 0.8) {
      differentiators.push('Competitive pricing advantage');
    }

    if (course.chapters.length > 10) {
      differentiators.push('Comprehensive content coverage');
    }

    const courseRating =
      course.reviews.length > 0
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
        : 0;
    const avgCompetitorRating =
      competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length;

    if (courseRating > avgCompetitorRating) {
      differentiators.push('Superior student satisfaction');
    }

    return differentiators;
  }

  private identifyGaps(
    course: CourseGuideInput,
    competitors: SimilarCourse[]
  ): string[] {
    const gaps: string[] = [];

    const competitorStrengths = competitors.flatMap((c) => c.strengths);
    const strengthCounts = competitorStrengths.reduce(
      (acc: Record<string, number>, strength) => {
        acc[strength] = (acc[strength] || 0) + 1;
        return acc;
      },
      {}
    );

    Object.entries(strengthCounts).forEach(([strength, count]) => {
      if (count > 2) {
        gaps.push(`Consider adding: ${strength}`);
      }
    });

    return gaps.slice(0, 5);
  }

  private generateRecommendations(
    course: CourseGuideInput,
    metrics: CourseGuideMetrics,
    insights: TeacherInsights
  ): CourseGuideResponse['recommendations'] {
    const content = this.generateContentRecommendations(metrics);
    const engagement = this.generateEngagementRecommendations(metrics);
    const marketing = this.generateMarketingRecommendations(course, metrics);

    return {
      content,
      engagement,
      marketing,
    };
  }

  private generateContentRecommendations(
    metrics: CourseGuideMetrics
  ): CourseGuideContentRecommendation[] {
    const recommendations: CourseGuideContentRecommendation[] = [];

    if (metrics.depth.assessmentQuality < 60) {
      recommendations.push({
        type: 'add',
        target: 'Assessments',
        suggestion: 'Add comprehensive quizzes and exams to each chapter',
        expectedImpact: 'Improve learning validation and boost completion rates by 20%',
      });
    }

    if (metrics.depth.contentRichness < 60) {
      recommendations.push({
        type: 'enhance',
        target: 'Content Depth',
        suggestion: 'Add more detailed explanations and examples',
        expectedImpact: 'Better student understanding and retention',
      });
    }

    return recommendations;
  }

  private generateEngagementRecommendations(
    metrics: CourseGuideMetrics
  ): CourseGuideEngagementRecommendation[] {
    const recommendations: CourseGuideEngagementRecommendation[] = [];

    if (metrics.engagement.interactionFrequency < 50) {
      recommendations.push({
        strategy: 'Implement interactive elements',
        implementation:
          'Add discussion forums, live Q&A sessions, and peer activities',
        targetMetric: 'interactionFrequency',
        expectedImprovement: 40,
      });
    }

    if (metrics.engagement.retentionRate < 60) {
      recommendations.push({
        strategy: 'Create retention program',
        implementation:
          'Send progress reminders, offer completion certificates, add gamification',
        targetMetric: 'retentionRate',
        expectedImprovement: 25,
      });
    }

    return recommendations;
  }

  private generateMarketingRecommendations(
    course: CourseGuideInput,
    metrics: CourseGuideMetrics
  ): MarketingRecommendation[] {
    const recommendations: MarketingRecommendation[] = [];

    recommendations.push({
      channel: 'Content Marketing',
      message: `Master ${course.title} - Perfect for aspiring professionals`,
      targetAudience: 'Professionals seeking skill development',
      estimatedReach: 5000,
    });

    if (metrics.marketAcceptance.reviewScore > 80) {
      recommendations.push({
        channel: 'Social Media',
        message: 'Join thousands of satisfied students with 4.5+ star ratings',
        targetAudience: 'Prospective learners',
        estimatedReach: 10000,
      });
    }

    return recommendations;
  }

  async predictSuccess(
    course: CourseGuideInput,
    metrics: CourseGuideMetrics
  ): Promise<CourseSuccessPrediction> {
    const trajectory = this.determineTrajectory(metrics);

    const currentEnrollments = course.enrollments.length;
    const growthRate = metrics.marketAcceptance.enrollmentGrowth / 100;
    const projectedEnrollments = Math.round(
      currentEnrollments * (1 + growthRate) * 3
    );

    const riskFactors = this.identifyRiskFactors(metrics);
    const successProbability = this.calculateSuccessProbability(metrics, riskFactors);

    return {
      currentTrajectory: trajectory,
      projectedEnrollments,
      riskFactors,
      successProbability,
    };
  }

  private getDefaultPrediction(): CourseSuccessPrediction {
    return {
      currentTrajectory: 'stable',
      projectedEnrollments: 0,
      riskFactors: [],
      successProbability: 50,
    };
  }

  private determineTrajectory(
    metrics: CourseGuideMetrics
  ): 'growing' | 'stable' | 'declining' {
    const growthIndicators = [
      metrics.marketAcceptance.enrollmentGrowth > 10,
      metrics.engagement.overallEngagement > 60,
      metrics.marketAcceptance.overallAcceptance > 70,
    ].filter(Boolean).length;

    if (growthIndicators >= 2) return 'growing';
    if (metrics.marketAcceptance.enrollmentGrowth < -10) return 'declining';
    return 'stable';
  }

  private identifyRiskFactors(metrics: CourseGuideMetrics): string[] {
    const risks: string[] = [];

    if (metrics.engagement.completionRate < 40) {
      risks.push('Low completion rate affecting reputation');
    }

    if (metrics.marketAcceptance.competitivePosition < 40) {
      risks.push('Weak competitive position in market');
    }

    if (metrics.depth.overallDepth < 50) {
      risks.push('Insufficient content depth');
    }

    return risks;
  }

  private calculateSuccessProbability(
    metrics: CourseGuideMetrics,
    riskFactors: string[]
  ): number {
    const baseScore =
      (metrics.depth.overallDepth +
        metrics.engagement.overallEngagement +
        metrics.marketAcceptance.overallAcceptance) /
      3;

    const riskPenalty = riskFactors.length * 10;

    return Math.max(0, Math.min(100, baseScore - riskPenalty));
  }

  async exportCourseGuide(
    courseId: string,
    format: 'pdf' | 'html' | 'json' = 'json'
  ): Promise<string | Buffer> {
    const guide = await this.generateCourseGuide(courseId);

    switch (format) {
      case 'json':
        return JSON.stringify(guide, null, 2);

      case 'html':
        return this.generateHTMLReport(guide);

      case 'pdf':
        throw new Error('PDF export not implemented yet');

      default:
        return JSON.stringify(guide);
    }
  }

  private generateHTMLReport(guide: CourseGuideResponse): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Course Guide: ${guide.courseTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1, h2, h3 { color: #333; }
    .metric { margin: 10px 0; }
    .score { font-weight: bold; color: #2563eb; }
    .insight { padding: 15px; margin: 10px 0; background: #f3f4f6; border-radius: 8px; }
    .high { border-left: 4px solid #10b981; }
    .medium { border-left: 4px solid #f59e0b; }
    .low { border-left: 4px solid #6b7280; }
  </style>
</head>
<body>
  <h1>Course Guide: ${guide.courseTitle}</h1>

  <h2>Overall Metrics</h2>
  <div class="metric">
    <strong>Content Depth:</strong> <span class="score">${guide.metrics.depth.overallDepth.toFixed(1)}%</span>
  </div>
  <div class="metric">
    <strong>Student Engagement:</strong> <span class="score">${guide.metrics.engagement.overallEngagement.toFixed(1)}%</span>
  </div>
  <div class="metric">
    <strong>Market Acceptance:</strong> <span class="score">${guide.metrics.marketAcceptance.overallAcceptance.toFixed(1)}%</span>
  </div>

  <h2>Key Insights</h2>
  <h3>Strengths</h3>
  ${guide.insights.strengths
    .map(
      (s) => `
    <div class="insight ${s.impact}">
      <strong>${s.title}</strong>
      <p>${s.description}</p>
    </div>
  `
    )
    .join('')}

  <h3>Areas for Improvement</h3>
  ${guide.insights.improvements
    .map(
      (i) => `
    <div class="insight ${i.impact}">
      <strong>${i.title}</strong>
      <p>${i.description}</p>
    </div>
  `
    )
    .join('')}

  <h2>Success Prediction</h2>
  <p><strong>Trajectory:</strong> ${guide.successPrediction.currentTrajectory}</p>
  <p><strong>Success Probability:</strong> ${guide.successPrediction.successProbability}%</p>
  <p><strong>Projected Enrollments (3 months):</strong> ${guide.successPrediction.projectedEnrollments}</p>
</body>
</html>
    `;
  }
}

/**
 * Factory function to create a CourseGuideEngine instance
 */
export function createCourseGuideEngine(
  config: CourseGuideEngineConfig = {}
): CourseGuideEngine {
  return new CourseGuideEngine(config);
}
