import { db } from '@/lib/db';
import { Anthropic } from '@anthropic-ai/sdk';
import { MarketAnalysisEngine } from './sam-market-engine';
import { BloomsAnalysisEngine } from './sam-blooms-engine';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface CourseGuideMetrics {
  depth: {
    contentRichness: number;
    topicCoverage: number;
    assessmentQuality: number;
    learningPathClarity: number;
    overallDepth: number;
  };
  engagement: {
    completionRate: number;
    averageProgress: number;
    interactionFrequency: number;
    studentSatisfaction: number;
    retentionRate: number;
    overallEngagement: number;
  };
  marketAcceptance: {
    enrollmentGrowth: number;
    competitivePosition: number;
    pricingOptimality: number;
    reviewScore: number;
    recommendationRate: number;
    overallAcceptance: number;
  };
}

export interface TeacherInsights {
  strengths: InsightItem[];
  improvements: InsightItem[];
  opportunities: InsightItem[];
  actionPlan: ActionItem[];
}

export interface InsightItem {
  category: 'depth' | 'engagement' | 'market';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  metric?: number;
}

export interface ActionItem {
  priority: 'immediate' | 'short-term' | 'long-term';
  action: string;
  expectedOutcome: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
}

export interface CourseComparison {
  courseId: string;
  similarCourses: SimilarCourse[];
  marketPosition: 'leader' | 'competitive' | 'follower' | 'niche';
  differentiators: string[];
  gaps: string[];
}

export interface SimilarCourse {
  id: string;
  title: string;
  similarity: number;
  Enrollment: number;
  rating: number;
  price: number;
  strengths: string[];
}

export interface CourseGuideResponse {
  courseId: string;
  courseTitle: string;
  metrics: CourseGuideMetrics;
  insights: TeacherInsights;
  comparison: CourseComparison;
  recommendations: {
    content: ContentRecommendation[];
    engagement: EngagementRecommendation[];
    marketing: MarketingRecommendation[];
  };
  successPrediction: {
    currentTrajectory: 'growing' | 'stable' | 'declining';
    projectedEnrollments: number;
    riskFactors: string[];
    successProbability: number;
  };
}

export interface ContentRecommendation {
  type: 'add' | 'modify' | 'enhance';
  target: string;
  suggestion: string;
  expectedImpact: string;
}

export interface EngagementRecommendation {
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

export class CourseGuideEngine {
  private marketEngine: MarketAnalysisEngine;
  private bloomsEngine: BloomsAnalysisEngine;

  constructor() {
    this.marketEngine = new MarketAnalysisEngine();
    this.bloomsEngine = new BloomsAnalysisEngine();
  }

  async generateCourseGuide(
    courseId: string,
    includeComparison = true,
    includeProjections = true
  ): Promise<CourseGuideResponse> {
    // Get comprehensive course data
    const course = await this.getCourseData(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    // Calculate all metrics
    const metrics = await this.calculateMetrics(course);
    
    // Get market and Bloom's analysis
    const [marketAnalysis, bloomsAnalysis] = await Promise.all([
      this.marketEngine.analyzeCourse(courseId, 'comprehensive', false),
      this.bloomsEngine.analyzeCourse(courseId, 'detailed', false),
    ]);

    // Generate insights
    const insights = await this.generateInsights(course, metrics, marketAnalysis, bloomsAnalysis);

    // Get course comparison if requested
    const comparison = includeComparison
      ? await this.generateComparison(course, marketAnalysis)
      : null;

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      course,
      metrics,
      insights,
      marketAnalysis,
      bloomsAnalysis
    );

    // Generate success prediction if requested
    const successPrediction = includeProjections
      ? await this.predictSuccess(course, metrics, marketAnalysis)
      : null;

    return {
      courseId,
      courseTitle: course.title,
      metrics,
      insights,
      comparison: comparison!,
      recommendations,
      successPrediction: successPrediction!,
    };
  }

  private async getCourseData(courseId: string): Promise<any> {
    return db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            sections: {
              include: {
                exams: true,
                Question: true,
              },
            },
          },
        },
        Purchase: true,
        Enrollment: true,
        reviews: true,
        _count: {
          select: {
            Purchase: true,
            Enrollment: true,
            reviews: true,
            chapters: true,
          },
        },
      },
    });
  }

  private async calculateMetrics(course: any): Promise<CourseGuideMetrics> {
    const depth = this.calculateDepthMetrics(course);
    const engagement = await this.calculateEngagementMetrics(course);
    const marketAcceptance = this.calculateMarketAcceptanceMetrics(course);

    return {
      depth,
      engagement,
      marketAcceptance,
    };
  }

  private calculateDepthMetrics(course: any): CourseGuideMetrics['depth'] {
    // Content richness based on sections, videos, and assessments
    const totalSections = course.chapters.reduce(
      (sum: number, ch: any) => sum + ch.sections.length,
      0
    );
    const totalExams = course.chapters.reduce(
      (sum: number, ch: any) => sum + ch.sections.reduce(
        (s: number, sec: any) => s + sec.exams.length,
        0
      ),
      0
    );
    const totalQuestions = course.chapters.reduce(
      (sum: number, ch: any) => sum + ch.sections.reduce(
        (s: number, sec: any) => s + sec.Question.length,
        0
      ),
      0
    );

    const contentRichness = Math.min(
      ((totalSections * 10) + (totalExams * 20) + (totalQuestions * 5)) / 10,
      100
    );

    // Topic coverage based on variety
    const topicCoverage = Math.min((course.chapters.length * 15), 100);

    // Assessment quality
    const assessmentQuality = totalExams > 0
      ? Math.min((totalQuestions / totalExams) * 10, 100)
      : 0;

    // Learning path clarity
    const learningPathClarity = course.chapters.every((ch: any) => ch.sections.length > 0)
      ? 80
      : 50;

    const overallDepth = (
      contentRichness + topicCoverage + assessmentQuality + learningPathClarity
    ) / 4;

    return {
      contentRichness,
      topicCoverage,
      assessmentQuality,
      learningPathClarity,
      overallDepth,
    };
  }

  private async calculateEngagementMetrics(course: any): Promise<CourseGuideMetrics['engagement']> {
    const totalEnrollments = course.Enrollment.length;
    
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
    const completedCount = course.Enrollment.filter(
      (e: any) => e.progress?.isCompleted
    ).length;
    const completionRate = (completedCount / totalEnrollments) * 100;

    // Average progress
    const totalProgress = course.Enrollment.reduce(
      (sum: number, e: any) => sum + (e.progress?.percentage || 0),
      0
    );
    const averageProgress = totalProgress / totalEnrollments;

    // Interaction frequency (based on recent activity)
    const recentActivity = await db.sAMInteraction.count({
      where: {
        courseId: course.id,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });
    const interactionFrequency = Math.min((recentActivity / totalEnrollments) * 20, 100);

    // Student satisfaction (from reviews)
    const avgRating = course.reviews.length > 0
      ? course.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / course.reviews.length
      : 0;
    const studentSatisfaction = (avgRating / 5) * 100;

    // Retention rate (students still active)
    const activeStudents = course.Enrollment.filter(
      (e: any) => e.progress?.lastAccessedAt &&
        new Date(e.progress.lastAccessedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    const retentionRate = totalEnrollments > 0 ? (activeStudents / totalEnrollments) * 100 : 0;

    const overallEngagement = (
      completionRate + averageProgress + interactionFrequency + 
      studentSatisfaction + retentionRate
    ) / 5;

    return {
      completionRate,
      averageProgress,
      interactionFrequency,
      studentSatisfaction,
      retentionRate,
      overallEngagement,
    };
  }

  private calculateMarketAcceptanceMetrics(course: any): CourseGuideMetrics['marketAcceptance'] {
    // Enrollment growth (comparing recent vs older enrollments)
    const recentEnrollments = course.Purchase.filter(
      (p: any) => new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    const olderEnrollments = course.Purchase.filter(
      (p: any) => new Date(p.createdAt) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    
    const enrollmentGrowth = olderEnrollments > 0
      ? ((recentEnrollments - olderEnrollments) / olderEnrollments) * 100
      : recentEnrollments > 0 ? 100 : 0;

    // Competitive position (placeholder - would need market data)
    const competitivePosition = 60; // Default middle position

    // Pricing optimality
    const avgPrice = course.price || 0;
    const pricingOptimality = avgPrice > 0 && avgPrice < 200 ? 80 : 50;

    // Review score
    const avgRating = course.reviews.length > 0
      ? course.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / course.reviews.length
      : 0;
    const reviewScore = (avgRating / 5) * 100;

    // Recommendation rate (based on high ratings)
    const highRatings = course.reviews.filter((r: any) => r.rating >= 4).length;
    const recommendationRate = course.reviews.length > 0
      ? (highRatings / course.reviews.length) * 100
      : 0;

    const overallAcceptance = (
      Math.max(0, Math.min(100, enrollmentGrowth)) + 
      competitivePosition + 
      pricingOptimality + 
      reviewScore + 
      recommendationRate
    ) / 5;

    return {
      enrollmentGrowth: Math.max(0, Math.min(100, enrollmentGrowth)),
      competitivePosition,
      pricingOptimality,
      reviewScore,
      recommendationRate,
      overallAcceptance,
    };
  }

  private async generateInsights(
    course: any,
    metrics: CourseGuideMetrics,
    marketAnalysis: any,
    bloomsAnalysis: any
  ): Promise<TeacherInsights> {
    const strengths: InsightItem[] = [];
    const improvements: InsightItem[] = [];
    const opportunities: InsightItem[] = [];

    // Analyze depth strengths and weaknesses
    if (metrics.depth.overallDepth > 70) {
      strengths.push({
        category: 'depth',
        title: 'Strong Content Foundation',
        description: 'Your course has comprehensive content coverage and well-structured learning paths',
        impact: 'high',
        metric: metrics.depth.overallDepth,
      });
    } else {
      improvements.push({
        category: 'depth',
        title: 'Enhance Content Depth',
        description: 'Add more comprehensive content and assessments to improve course depth',
        impact: 'high',
        metric: metrics.depth.overallDepth,
      });
    }

    // Analyze engagement insights
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
        description: 'Focus on student motivation and support to increase completions',
        impact: 'high',
        metric: metrics.engagement.completionRate,
      });
    }

    // Market opportunities
    if (marketAnalysis.market?.growthRate > 10) {
      opportunities.push({
        category: 'market',
        title: 'Growing Market Segment',
        description: 'Your course is in a rapidly growing market with expansion potential',
        impact: 'high',
        metric: marketAnalysis.market.growthRate,
      });
    }

    // Generate action plan
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
    improvements: InsightItem[],
    opportunities: InsightItem[]
  ): ActionItem[] {
    const actions: ActionItem[] = [];

    // Immediate actions for critical improvements
    if (metrics.engagement.overallEngagement < 50) {
      actions.push({
        priority: 'immediate',
        action: 'Implement student engagement features',
        expectedOutcome: 'Increase student interaction and retention by 30%',
        effort: 'medium',
        timeline: '1-2 weeks',
      });
    }

    // Short-term actions
    if (metrics.depth.assessmentQuality < 60) {
      actions.push({
        priority: 'short-term',
        action: 'Add comprehensive assessments to each chapter',
        expectedOutcome: 'Improve learning validation and student confidence',
        effort: 'medium',
        timeline: '2-4 weeks',
      });
    }

    // Long-term strategic actions
    opportunities.forEach(opp => {
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

  private async generateComparison(
    course: any,
    marketAnalysis: any
  ): Promise<CourseComparison> {
    const competitors = await this.marketEngine.findCompetitors(course.id);
    
    const similarCourses: SimilarCourse[] = competitors.slice(0, 5).map((comp: any) => ({
      id: comp.id || comp.courseId || 'unknown',
      title: comp.title || comp.courseTitle || 'Unknown',
      similarity: comp.similarity ?? 0,
      Enrollment: comp.enrollments ?? comp.enrollmentCount ?? 0,
      rating: comp.rating ?? 0,
      price: comp.price ?? 0,
      strengths: comp.strengths ?? [],
    }));

    const marketPosition = this.determineMarketPosition(
      course,
      similarCourses,
      marketAnalysis
    );

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

  private determineMarketPosition(
    course: any,
    competitors: SimilarCourse[],
    marketAnalysis: any
  ): 'leader' | 'competitive' | 'follower' | 'niche' {
    const avgCompetitorEnrollments = competitors.reduce(
      (sum, c) => sum + c.Enrollment, 0
    ) / competitors.length;
    
    const courseEnrollments = course._count.Purchase;
    
    if (courseEnrollments > avgCompetitorEnrollments * 1.5) {
      return 'leader';
    } else if (courseEnrollments > avgCompetitorEnrollments * 0.8) {
      return 'competitive';
    } else if (marketAnalysis.market?.targetAudience?.includes('specialized')) {
      return 'niche';
    } else {
      return 'follower';
    }
  }

  private identifyDifferentiators(course: any, competitors: SimilarCourse[]): string[] {
    const differentiators: string[] = [];
    
    // Price differentiation
    const avgCompetitorPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
    if (course.price < avgCompetitorPrice * 0.8) {
      differentiators.push('Competitive pricing advantage');
    }
    
    // Content differentiation
    if (course._count.chapters > 10) {
      differentiators.push('Comprehensive content coverage');
    }
    
    // Rating differentiation
    const courseRating = course.reviews.length > 0
      ? course.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / course.reviews.length
      : 0;
    const avgCompetitorRating = competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length;
    
    if (courseRating > avgCompetitorRating) {
      differentiators.push('Superior student satisfaction');
    }
    
    return differentiators;
  }

  private identifyGaps(course: any, competitors: SimilarCourse[]): string[] {
    const gaps: string[] = [];
    
    // Identify common strengths in competitors that this course lacks
    const competitorStrengths = competitors.flatMap(c => c.strengths);
    const strengthCounts = competitorStrengths.reduce((acc: any, strength) => {
      acc[strength] = (acc[strength] || 0) + 1;
      return acc;
    }, {});
    
    // Find strengths that appear in multiple competitors
    Object.entries(strengthCounts).forEach(([strength, count]) => {
      if (count as number > 2) {
        gaps.push(`Consider adding: ${strength}`);
      }
    });
    
    return gaps.slice(0, 5); // Limit to top 5 gaps
  }

  private async generateRecommendations(
    course: any,
    metrics: CourseGuideMetrics,
    insights: TeacherInsights,
    marketAnalysis: any,
    bloomsAnalysis: any
  ): Promise<CourseGuideResponse['recommendations']> {
    const content = this.generateContentRecommendations(metrics, bloomsAnalysis);
    const engagement = this.generateEngagementRecommendations(metrics, insights);
    const marketing = await this.generateMarketingRecommendations(
      course,
      metrics,
      marketAnalysis
    );

    return {
      content,
      engagement,
      marketing,
    };
  }

  private generateContentRecommendations(
    metrics: CourseGuideMetrics,
    bloomsAnalysis: any
  ): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];

    // Check for content gaps
    if (metrics.depth.assessmentQuality < 60) {
      recommendations.push({
        type: 'add',
        target: 'Assessments',
        suggestion: 'Add comprehensive quizzes and exams to each chapter',
        expectedImpact: 'Improve learning validation and boost completion rates by 20%',
      });
    }

    // Check Bloom's balance
    if (bloomsAnalysis.courseLevel?.balance === 'bottom-heavy') {
      recommendations.push({
        type: 'enhance',
        target: 'Higher-order thinking activities',
        suggestion: 'Add more analysis, evaluation, and creation tasks',
        expectedImpact: 'Develop deeper understanding and critical thinking skills',
      });
    }

    return recommendations;
  }

  private generateEngagementRecommendations(
    metrics: CourseGuideMetrics,
    insights: TeacherInsights
  ): EngagementRecommendation[] {
    const recommendations: EngagementRecommendation[] = [];

    if (metrics.engagement.interactionFrequency < 50) {
      recommendations.push({
        strategy: 'Implement interactive elements',
        implementation: 'Add discussion forums, live Q&A sessions, and peer activities',
        targetMetric: 'interactionFrequency',
        expectedImprovement: 40,
      });
    }

    if (metrics.engagement.retentionRate < 60) {
      recommendations.push({
        strategy: 'Create retention program',
        implementation: 'Send progress reminders, offer completion certificates, add gamification',
        targetMetric: 'retentionRate',
        expectedImprovement: 25,
      });
    }

    return recommendations;
  }

  private async generateMarketingRecommendations(
    course: any,
    metrics: CourseGuideMetrics,
    marketAnalysis: any
  ): Promise<MarketingRecommendation[]> {
    const recommendations: MarketingRecommendation[] = [];

    // Target audience expansion
    if (marketAnalysis.market?.targetAudience) {
      recommendations.push({
        channel: 'Content Marketing',
        message: `Master ${course.title} - Perfect for ${marketAnalysis.market.targetAudience}`,
        targetAudience: marketAnalysis.market.targetAudience,
        estimatedReach: 5000,
      });
    }

    // Social proof marketing
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

  private async predictSuccess(
    course: any,
    metrics: CourseGuideMetrics,
    marketAnalysis: any
  ): Promise<CourseGuideResponse['successPrediction']> {
    // Determine trajectory
    const trajectory = this.determineTrajectory(metrics);
    
    // Project enrollments
    const currentEnrollments = course._count.Purchase;
    const growthRate = metrics.marketAcceptance.enrollmentGrowth / 100;
    const projectedEnrollments = Math.round(
      currentEnrollments * (1 + growthRate) * 3 // 3 months projection
    );

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(metrics, marketAnalysis);
    
    // Calculate success probability
    const successProbability = this.calculateSuccessProbability(metrics, riskFactors);

    return {
      currentTrajectory: trajectory,
      projectedEnrollments,
      riskFactors,
      successProbability,
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

  private identifyRiskFactors(
    metrics: CourseGuideMetrics,
    marketAnalysis: any
  ): string[] {
    const risks: string[] = [];

    if (metrics.engagement.completionRate < 40) {
      risks.push('Low completion rate affecting reputation');
    }

    if (metrics.marketAcceptance.competitivePosition < 40) {
      risks.push('Weak competitive position in market');
    }

    if (marketAnalysis.competition?.competitorCount > 10) {
      risks.push('High market competition');
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
    const baseScore = (
      metrics.depth.overallDepth +
      metrics.engagement.overallEngagement +
      metrics.marketAcceptance.overallAcceptance
    ) / 3;

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
        // This would require a PDF generation library
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
  ${guide.insights.strengths.map(s => `
    <div class="insight ${s.impact}">
      <strong>${s.title}</strong>
      <p>${s.description}</p>
    </div>
  `).join('')}
  
  <h3>Areas for Improvement</h3>
  ${guide.insights.improvements.map(i => `
    <div class="insight ${i.impact}">
      <strong>${i.title}</strong>
      <p>${i.description}</p>
    </div>
  `).join('')}
  
  <h2>Success Prediction</h2>
  <p><strong>Trajectory:</strong> ${guide.successPrediction.currentTrajectory}</p>
  <p><strong>Success Probability:</strong> ${guide.successPrediction.successProbability}%</p>
  <p><strong>Projected Enrollments (3 months):</strong> ${guide.successPrediction.projectedEnrollments}</p>
</body>
</html>
    `;
  }
}