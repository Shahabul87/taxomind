import { MarketAnalysisEngine } from '@/sam/engines/business/sam-market-engine';
import { BloomsAnalysisEngine } from '@/sam/engines/educational/sam-blooms-engine';
import { AdvancedExamEngine } from '@/sam/engines/educational/sam-exam-engine';
import { CourseGuideEngine } from '@/sam/engines/educational/sam-course-guide-engine';
import { SAMTrendsEngine } from '@/sam/engines/advanced/sam-trends-engine';
import { SAMNewsEngine } from '@/sam/engines/content/sam-news-engine';
import { SAMResearchEngine } from '@/sam/engines/advanced/sam-research-engine';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface SAMEngineContext {
  userId: string;
  courseId?: string;
  role: 'ADMIN' | 'USER';
  enginePreferences?: {
    enableMarketAnalysis?: boolean;
    enableBloomsTracking?: boolean;
    enableAdaptiveLearning?: boolean;
    enableCourseGuide?: boolean;
    enableTrendsAnalysis?: boolean;
    enableNewsIntegration?: boolean;
    enableResearchAccess?: boolean;
  };
}

export interface IntegratedAnalysis {
  courseId: string;
  timestamp: Date;
  marketInsights?: any;
  bloomsProfile?: any;
  examRecommendations?: any;
  courseGuide?: any;
  studentProgress?: any;
  trendsAnalysis?: any;
  newsDigest?: any;
  researchPapers?: any;
  integratedRecommendations: IntegratedRecommendation[];
  actionPlan: ActionPlan;
}

export interface IntegratedRecommendation {
  source: 'market' | 'blooms' | 'exam' | 'guide' | 'integrated' | 'trends' | 'news' | 'research';
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  actions: string[];
  expectedImpact: string;
  dependencies?: string[];
}

export interface ActionPlan {
  immediate: ActionItem[];
  shortTerm: ActionItem[];
  longTerm: ActionItem[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  engineSource: string[];
  estimatedTime: string;
  requiredResources: string[];
  successMetrics: string[];
}

export class SAMEngineIntegration {
  private marketEngine: MarketAnalysisEngine;
  private bloomsEngine: BloomsAnalysisEngine;
  private examEngine: AdvancedExamEngine;
  private guideEngine: CourseGuideEngine;
  private trendsEngine: SAMTrendsEngine;
  private newsEngine: SAMNewsEngine;
  private researchEngine: SAMResearchEngine;

  constructor() {
    this.marketEngine = new MarketAnalysisEngine();
    this.bloomsEngine = new BloomsAnalysisEngine();
    this.examEngine = new AdvancedExamEngine();
    this.guideEngine = new CourseGuideEngine();
    this.trendsEngine = new SAMTrendsEngine();
    this.newsEngine = new SAMNewsEngine();
    this.researchEngine = new SAMResearchEngine();
  }

  async performIntegratedAnalysis(
    context: SAMEngineContext,
    analysisDepth: 'basic' | 'detailed' | 'comprehensive' = 'detailed'
  ): Promise<IntegratedAnalysis> {
    if (!context.courseId) {
      throw new Error('Course ID is required for integrated analysis');
    }

    // Run all analyses in parallel
    const [
      marketAnalysis, 
      bloomsAnalysis, 
      courseGuide,
      trendsAnalysis,
      newsDigest,
      researchPapers
    ] = await Promise.all([
      context.enginePreferences?.enableMarketAnalysis !== false
        ? this.marketEngine.analyzeCourse(context.courseId, 'comprehensive')
        : null,
      context.enginePreferences?.enableBloomsTracking !== false
        ? this.bloomsEngine.analyzeCourse(context.courseId, analysisDepth)
        : null,
      context.enginePreferences?.enableCourseGuide !== false && context.role === 'ADMIN'
        ? this.guideEngine.generateCourseGuide(context.courseId)
        : null,
      context.enginePreferences?.enableTrendsAnalysis !== false
        ? this.getTrendsForCourse(context.courseId)
        : null,
      context.enginePreferences?.enableNewsIntegration !== false
        ? this.getRelevantNews(context.courseId)
        : null,
      context.enginePreferences?.enableResearchAccess !== false
        ? this.getRelatedResearch(context.courseId)
        : null,
    ]);

    // Get student progress if applicable
    const studentProgress = context.role === 'USER'
      ? await this.getStudentProgress(context.userId, context.courseId)
      : null;

    // Generate exam recommendations based on analyses
    const examRecommendations = await this.generateExamRecommendations(
      context.courseId,
      bloomsAnalysis,
      studentProgress
    );

    // Integrate all insights
    const integratedRecommendations = this.integrateRecommendations(
      marketAnalysis,
      bloomsAnalysis,
      examRecommendations,
      courseGuide,
      studentProgress,
      trendsAnalysis,
      newsDigest,
      researchPapers
    );

    // Create action plan
    const actionPlan = this.createActionPlan(integratedRecommendations);

    // Store the integrated analysis
    await this.storeIntegratedAnalysis(context, {
      marketAnalysis,
      bloomsAnalysis,
      examRecommendations,
      courseGuide,
      integratedRecommendations,
    });

    return {
      courseId: context.courseId,
      timestamp: new Date(),
      marketInsights: marketAnalysis,
      bloomsProfile: bloomsAnalysis,
      examRecommendations,
      courseGuide,
      studentProgress,
      trendsAnalysis,
      newsDigest,
      researchPapers,
      integratedRecommendations,
      actionPlan,
    };
  }

  private async getStudentProgress(userId: string, courseId: string): Promise<any> {
    const [bloomsProgress, cognitiveProfile, recentMetrics] = await Promise.all([
      db.studentBloomsProgress.findUnique({
        where: {
          userId_courseId: { userId, courseId } as any,
        },
      }),
      db.studentCognitiveProfile.findUnique({
        where: { userId },
      }),
      db.bloomsPerformanceMetric.findMany({
        where: { userId, courseId },
        orderBy: { recordedAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      bloomsProgress,
      cognitiveProfile,
      recentMetrics,
      learningPath: this.generatePersonalizedLearningPath(
        bloomsProgress,
        cognitiveProfile
      ),
    };
  }

  private generatePersonalizedLearningPath(
    bloomsProgress: any,
    cognitiveProfile: any
  ): any {
    if (!bloomsProgress || !cognitiveProfile) {
      return null;
    }

    const weakAreas = bloomsProgress.weaknessAreas || [];
    const learningStyle = cognitiveProfile.optimalLearningStyle || 'mixed';

    return {
      nextSteps: this.determineNextSteps(bloomsProgress.bloomsScores, weakAreas),
      recommendedActivities: this.getActivitiesForLearningStyle(learningStyle, weakAreas),
      estimatedTime: this.estimateLearningTime(weakAreas),
      milestones: this.generateMilestones(bloomsProgress.bloomsScores),
    };
  }

  private determineNextSteps(bloomsScores: any, weakAreas: string[]): string[] {
    const steps: string[] = [];
    const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

    // Find the lowest scoring level
    let lowestLevel: string | null = null;
    let lowestScore = 100;

    levels.forEach(level => {
      const score = bloomsScores?.[level] || 0;
      if (score < lowestScore) {
        lowestScore = score;
        lowestLevel = level;
      }
    });

    if (lowestLevel && lowestScore < 60) {
      const lvl = String(lowestLevel).toLowerCase();
      steps.push(`Focus on improving ${lvl} skills`);
    }

    weakAreas.forEach(area => {
      steps.push(`Practice ${area.toLowerCase()}-based activities`);
    });

    return steps;
  }

  private getActivitiesForLearningStyle(
    learningStyle: string,
    weakAreas: string[]
  ): any[] {
    const activities: any[] = [];
    const styleActivities: Record<string, string[]> = {
      visual: ['Watch video tutorials', 'Create mind maps', 'Use diagrams'],
      auditory: ['Listen to lectures', 'Participate in discussions', 'Record notes'],
      kinesthetic: ['Hands-on projects', 'Practice exercises', 'Lab work'],
      logical: ['Problem-solving', 'Case studies', 'Analytical tasks'],
      social: ['Group projects', 'Peer learning', 'Study groups'],
      solitary: ['Self-paced modules', 'Independent research', 'Reflection'],
      mixed: ['Variety of activities', 'Adaptive learning', 'Multi-modal content'],
    };

    const recommended = styleActivities[learningStyle] || styleActivities.mixed;
    
    recommended.forEach(activity => {
      activities.push({
        type: activity,
        targetAreas: weakAreas,
        duration: '30-45 minutes',
        frequency: 'Daily',
      });
    });

    return activities;
  }

  private estimateLearningTime(weakAreas: string[]): number {
    // Estimate 10 hours per weak area
    return weakAreas.length * 10;
  }

  private generateMilestones(bloomsScores: any): any[] {
    const milestones: any[] = [];
    const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

    levels.forEach((level, index) => {
      const currentScore = bloomsScores?.[level] || 0;
      
      if (currentScore < 100) {
        milestones.push({
          level,
          currentScore,
          targetScore: Math.min(currentScore + 20, 100),
          estimatedTime: `${(index + 1) * 2} weeks`,
          reward: `${level} Master Badge`,
        });
      }
    });

    return milestones;
  }

  private async generateExamRecommendations(
    courseId: string,
    bloomsAnalysis: any,
    studentProgress: any
  ): Promise<any> {
    if (!bloomsAnalysis) return null;

    const recommendations = {
      examConfiguration: {
        totalQuestions: 20,
        duration: 60,
        bloomsDistribution: this.calculateOptimalDistribution(
          bloomsAnalysis.courseLevel.distribution,
          studentProgress?.bloomsProgress?.weaknessAreas
        ),
        difficultyDistribution: {
          EASY: 30,
          MEDIUM: 50,
          HARD: 20,
        },
        adaptiveMode: !!studentProgress,
      },
      focusAreas: this.identifyExamFocusAreas(bloomsAnalysis, studentProgress),
      questionTypes: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'],
      studyGuideTopics: this.generateStudyTopics(bloomsAnalysis, studentProgress),
    };

    return recommendations;
  }

  private calculateOptimalDistribution(
    courseDistribution: any,
    weakAreas?: string[]
  ): any {
    const distribution = {
      REMEMBER: 15,
      UNDERSTAND: 20,
      APPLY: 25,
      ANALYZE: 20,
      EVALUATE: 15,
      CREATE: 5,
    };

    // Adjust for weak areas
    if (weakAreas) {
      weakAreas.forEach(area => {
        if (distribution[area as keyof typeof distribution]) {
          distribution[area as keyof typeof distribution] += 5;
        }
      });
    }

    // Normalize to 100%
    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
    Object.keys(distribution).forEach(key => {
      distribution[key as keyof typeof distribution] = 
        (distribution[key as keyof typeof distribution] / total) * 100;
    });

    return distribution;
  }

  private identifyExamFocusAreas(bloomsAnalysis: any, studentProgress: any): string[] {
    const areas: string[] = [];

    // Add weak areas from student progress
    if (studentProgress?.bloomsProgress?.weaknessAreas) {
      areas.push(...studentProgress.bloomsProgress.weaknessAreas);
    }

    // Add gaps from Bloom's analysis
    if (bloomsAnalysis?.learningPathway?.gaps) {
      bloomsAnalysis.learningPathway.gaps.forEach((gap: any) => {
        if (gap.severity === 'high') {
          areas.push(gap.level);
        }
      });
    }

    return [...new Set(areas)];
  }

  private generateStudyTopics(bloomsAnalysis: any, studentProgress: any): string[] {
    const topics: string[] = [];

    // Add topics from chapter analysis
    if (bloomsAnalysis?.chapterAnalysis) {
      bloomsAnalysis.chapterAnalysis.forEach((chapter: any) => {
        if (chapter.cognitiveDepth < 50) {
          topics.push(`Review: ${chapter.chapterTitle}`);
        }
      });
    }

    // Add personalized topics based on progress
    if (studentProgress?.bloomsProgress?.weaknessAreas) {
      studentProgress.bloomsProgress.weaknessAreas.forEach((area: string) => {
        topics.push(`Practice ${area.toLowerCase()} skills`);
      });
    }

    return topics;
  }

  private integrateRecommendations(
    marketAnalysis: any,
    bloomsAnalysis: any,
    examRecommendations: any,
    courseGuide: any,
    studentProgress: any,
    trendsAnalysis: any,
    newsDigest: any,
    researchPapers: any
  ): IntegratedRecommendation[] {
    const recommendations: IntegratedRecommendation[] = [];

    // Market-based recommendations
    if (marketAnalysis?.recommendations) {
      Object.entries(marketAnalysis.recommendations).forEach(([category, items]: [string, any]) => {
        if (Array.isArray(items)) {
          items.forEach(item => {
            recommendations.push({
              source: 'market',
              priority: this.determinePriority(item.impact),
              category,
              title: item.suggestion || item.strategy || 'Market Recommendation',
              description: item.rationale || item.description || '',
              actions: item.actions || [item.implementation],
              expectedImpact: item.expectedImpact || 'Improve market position',
            });
          });
        }
      });
    }

    // Bloom's-based recommendations
    if (bloomsAnalysis?.recommendations) {
      bloomsAnalysis.recommendations.contentAdjustments?.forEach((item: any) => {
        recommendations.push({
          source: 'blooms',
          priority: this.determinePriority(item.impact),
          category: 'content',
          title: `${item.type} - ${item.description}`,
          description: `Target: ${item.bloomsLevel}`,
          actions: [`Implement ${item.type} for ${item.targetChapter || 'all chapters'}`],
          expectedImpact: `Improve cognitive balance`,
        });
      });
    }

    // Trends-based recommendations
    if (trendsAnalysis?.relevantTrends) {
      trendsAnalysis.relevantTrends.forEach((trend: any) => {
        if (trend.impact === 'transformative' || trend.impact === 'high') {
          recommendations.push({
            source: 'trends',
            priority: trend.impact === 'transformative' ? 'high' : 'medium',
            category: 'innovation',
            title: `Incorporate ${trend.title} into curriculum`,
            description: trend.description,
            actions: trend.educationalImplications || ['Research trend applications', 'Update course content'],
            expectedImpact: `Stay ahead of industry trends and prepare students for future`,
          });
        }
      });
    }

    // News-based recommendations
    if (newsDigest?.educationalNews) {
      const criticalNews = newsDigest.educationalNews.filter((news: any) => 
        news.impactLevel === 'critical' || news.impactLevel === 'high'
      );
      
      criticalNews.forEach((news: any) => {
        recommendations.push({
          source: 'news',
          priority: news.impactLevel === 'critical' ? 'high' : 'medium',
          category: 'awareness',
          title: `Action required: ${news.title}`,
          description: news.summary,
          actions: news.keyTakeaways || ['Review news impact', 'Update teaching approach'],
          expectedImpact: 'Stay informed about industry developments',
        });
      });
    }

    // Research-based recommendations
    if (researchPapers?.relevantPapers) {
      researchPapers.relevantPapers
        .filter((paper: any) => paper.educationalValue.teachingValue > 80)
        .forEach((paper: any) => {
          recommendations.push({
            source: 'research',
            priority: 'medium',
            category: 'academic',
            title: `Implement findings from: ${paper.title}`,
            description: `High-value research with ${paper.citations} citations`,
            actions: paper.contributions.slice(0, 3),
            expectedImpact: 'Evidence-based teaching improvements',
          });
        });
    }

    // Integrated recommendations based on cross-analysis
    const integratedInsights = this.generateIntegratedInsights(
      marketAnalysis,
      bloomsAnalysis,
      courseGuide,
      studentProgress,
      trendsAnalysis,
      newsDigest,
      researchPapers
    );

    recommendations.push(...integratedInsights);

    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private determinePriority(impact: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (impact?.toLowerCase()) {
      case 'critical':
      case 'very high':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  }

  private generateIntegratedInsights(
    marketAnalysis: any,
    bloomsAnalysis: any,
    courseGuide: any,
    studentProgress: any,
    trendsAnalysis: any,
    newsDigest: any,
    researchPapers: any
  ): IntegratedRecommendation[] {
    const insights: IntegratedRecommendation[] = [];

    // Cross-reference market position with content depth
    if (marketAnalysis?.competition?.position === 'follower' && 
        bloomsAnalysis?.courseLevel?.balance === 'bottom-heavy') {
      insights.push({
        source: 'integrated',
        priority: 'critical',
        category: 'strategic',
        title: 'Differentiate Through Advanced Content',
        description: 'Your course is both behind competitors and lacks advanced content',
        actions: [
          'Add advanced modules with CREATE-level activities',
          'Introduce unique case studies and projects',
          'Partner with industry experts for exclusive content',
        ],
        expectedImpact: 'Move from follower to competitive position',
        dependencies: ['content', 'marketing'],
      });
    }

    // Student success correlation
    if (courseGuide?.metrics?.engagement?.completionRate < 50 &&
        bloomsAnalysis?.learningPathway?.gaps?.length > 2) {
      insights.push({
        source: 'integrated',
        priority: 'high',
        category: 'student-success',
        title: 'Address Learning Gaps to Improve Completion',
        description: 'Multiple learning gaps are causing low completion rates',
        actions: [
          'Redesign learning path for better progression',
          'Add bridging content between levels',
          'Implement adaptive learning features',
        ],
        expectedImpact: 'Increase completion rate by 30%',
        dependencies: ['content', 'technology'],
      });
    }

    // Cross-reference trends with research
    if (trendsAnalysis?.relevantTrends && researchPapers?.relevantPapers) {
      const emergingTrends = trendsAnalysis.relevantTrends.filter((t: any) => 
        t.timeframe === 'emerging' && t.relevance > 80
      );
      
      if (emergingTrends.length > 0) {
        insights.push({
          source: 'integrated',
          priority: 'high',
          category: 'innovation',
          title: 'Align Course with Emerging Research Trends',
          description: 'Strong correlation between emerging trends and recent research indicates opportunity for innovation',
          actions: [
            'Review emerging trend applications in education',
            'Incorporate research-backed methodologies',
            'Create experimental modules for early adoption',
            'Partner with researchers for content validation'
          ],
          expectedImpact: 'Position course as cutting-edge and research-backed',
          dependencies: ['research', 'content', 'partnerships'],
        });
      }
    }

    // News impact on course relevance
    if (newsDigest?.weeklyDigest && marketAnalysis) {
      const hasBreakingNews = newsDigest.weeklyDigest.topStories.some((story: any) => 
        story.impactLevel === 'critical'
      );
      
      if (hasBreakingNews && marketAnalysis.competition?.position !== 'leader') {
        insights.push({
          source: 'integrated',
          priority: 'critical',
          category: 'competitive',
          title: 'Urgent: Update Course Based on Industry Developments',
          description: 'Recent critical news requires immediate course updates to maintain relevance',
          actions: [
            'Review breaking news impact on course content',
            'Update modules affected by industry changes',
            'Communicate updates to current students',
            'Create supplementary content addressing changes'
          ],
          expectedImpact: 'Maintain course relevance and competitive edge',
          dependencies: ['content', 'communication'],
        });
      }
    }

    // Research-driven quality improvements
    if (researchPapers?.educationalPapers && bloomsAnalysis?.courseLevel) {
      const highValuePapers = researchPapers.educationalPapers.filter((p: any) => 
        p.educationalValue.teachingValue > 90
      );
      
      if (highValuePapers.length > 0 && bloomsAnalysis.courseLevel.overallScore < 70) {
        insights.push({
          source: 'integrated',
          priority: 'high',
          category: 'quality',
          title: 'Implement Research-Proven Teaching Methods',
          description: 'High-value educational research can significantly improve course quality',
          actions: [
            'Apply evidence-based teaching strategies',
            'Restructure content based on learning science',
            'Implement validated assessment methods',
            'Monitor improvement metrics'
          ],
          expectedImpact: 'Improve learning outcomes by 25-40%',
          dependencies: ['pedagogy', 'assessment', 'analytics'],
        });
      }
    }

    return insights;
  }

  private createActionPlan(recommendations: IntegratedRecommendation[]): ActionPlan {
    const immediate: ActionItem[] = [];
    const shortTerm: ActionItem[] = [];
    const longTerm: ActionItem[] = [];

    recommendations.forEach((rec, index) => {
      const actionItem: ActionItem = {
        id: `action_${index + 1}`,
        title: rec.title,
        description: rec.description,
        engineSource: [rec.source],
        estimatedTime: this.estimateTime(rec),
        requiredResources: this.identifyResources(rec),
        successMetrics: this.defineMetrics(rec),
      };

      if (rec.priority === 'critical') {
        immediate.push(actionItem);
      } else if (rec.priority === 'high') {
        shortTerm.push(actionItem);
      } else {
        longTerm.push(actionItem);
      }
    });

    return {
      immediate,
      shortTerm,
      longTerm,
    };
  }

  private estimateTime(recommendation: IntegratedRecommendation): string {
    const actionCount = recommendation.actions.length;
    
    if (recommendation.priority === 'critical') return '1-2 weeks';
    if (actionCount <= 2) return '2-3 weeks';
    if (actionCount <= 4) return '3-4 weeks';
    return '1-2 months';
  }

  private identifyResources(recommendation: IntegratedRecommendation): string[] {
    const resources: string[] = [];

    if (recommendation.category === 'content') {
      resources.push('Content creator', 'Subject matter expert');
    }
    if (recommendation.category === 'marketing') {
      resources.push('Marketing budget', 'Design assets');
    }
    if (recommendation.category === 'technology') {
      resources.push('Developer time', 'Technical infrastructure');
    }
    if (recommendation.actions.some(a => a.includes('AI'))) {
      resources.push('AI tools', 'API credits');
    }

    return resources;
  }

  private defineMetrics(recommendation: IntegratedRecommendation): string[] {
    const metrics: string[] = [];

    // Add specific metrics based on expected impact
    if (recommendation.expectedImpact.includes('enrollment')) {
      metrics.push('Monthly enrollment count', 'Conversion rate');
    }
    if (recommendation.expectedImpact.includes('completion')) {
      metrics.push('Course completion rate', 'Average progress');
    }
    if (recommendation.expectedImpact.includes('engagement')) {
      metrics.push('Daily active users', 'Session duration');
    }
    if (recommendation.expectedImpact.includes('market')) {
      metrics.push('Market share', 'Competitive ranking');
    }

    // Add default metric
    metrics.push('User satisfaction score');

    return metrics;
  }

  private async storeIntegratedAnalysis(
    context: SAMEngineContext,
    analysis: any
  ): Promise<void> {
    try {
      await db.sAMInteraction.create({
        data: {
          userId: context.userId,
          courseId: context.courseId,
          interactionType: 'CONTENT_GENERATE' as any,
          context: {
            type: 'INTEGRATED_ANALYSIS',
            engines: ['market', 'blooms', 'exam', 'guide'],
          },
        },
      });
    } catch (error: any) {
      logger.error('Error storing integrated analysis:', error);
    }
  }

  // Context-aware method for SAM integration
  async getSAMContext(
    userId: string,
    courseId: string,
    interactionType: string
  ): Promise<any> {
    const context: SAMEngineContext = {
      userId,
      courseId,
      role: await this.getUserRole(userId),
    };

    const analysis = await this.performIntegratedAnalysis(context, 'basic');
    
    // Return context-specific data for SAM
    return {
      userProfile: analysis.studentProgress || null,
      courseMetrics: {
        depth: analysis.courseGuide?.metrics?.depth?.overallDepth || 0,
        engagement: analysis.courseGuide?.metrics?.engagement?.overallEngagement || 0,
        marketPosition: analysis.marketInsights?.market?.position || 'unknown',
      },
      recommendations: analysis.integratedRecommendations.slice(0, 3),
      learningPath: analysis.studentProgress?.learningPath || null,
    };
  }

  private async getUserRole(userId: string): Promise<'ADMIN' | 'USER'> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    
    return user?.role === 'ADMIN' ? 'ADMIN' : 'USER';
  }

  // New engine integration methods
  private async getTrendsForCourse(courseId: string): Promise<any> {
    try {
      // Get course details to determine relevant trends
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { 
          title: true, 
          description: true, 
          categoryId: true,
          category: { select: { name: true } }
        }
      });

      if (!course) return null;

      // Search for relevant trends based on course topic
      const trends = await this.trendsEngine.searchTrends(
        course.category?.name || course.title
      );

      // Get educational trends
      const educationalTrends = await this.trendsEngine.getEducationalTrends();

      return {
        relevantTrends: trends.slice(0, 5),
        educationalTrends: educationalTrends.slice(0, 3),
        trendingNow: await this.trendsEngine.getTrendingNow()
      };
    } catch (error: any) {
      logger.error('Error getting trends for course:', error);
      return null;
    }
  }

  private async getRelevantNews(courseId: string): Promise<any> {
    try {
      // Get course details
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { 
          title: true, 
          description: true,
          category: { select: { name: true } }
        }
      });

      if (!course) return null;

      // Get educational news
      const educationalNews = await this.newsEngine.getEducationalNews();

      // Search for course-specific news
      const relevantNews = await this.newsEngine.searchNews(
        course.category?.name || course.title
      );

      // Get latest digest
      const digest = await this.newsEngine.getNewsDigest();

      return {
        educationalNews: educationalNews.slice(0, 5),
        courseRelatedNews: relevantNews.slice(0, 5),
        weeklyDigest: digest,
        trendingTopics: await this.newsEngine.getTrendingTopics()
      };
    } catch (error: any) {
      logger.error('Error getting news for course:', error);
      return null;
    }
  }

  private async getRelatedResearch(courseId: string): Promise<any> {
    try {
      // Get course details
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { 
          title: true, 
          description: true,
          category: { select: { name: true } }
        }
      });

      if (!course) return null;

      // Search for relevant research papers
      const papers = await this.researchEngine.searchPapers({
        query: course.category?.name || course.title,
        filters: {
          difficulty: 'intermediate'
        },
        sort: 'relevance',
        limit: 10
      });

      // Get educational papers
      const educationalPapers = await this.researchEngine.getEducationalPapers(
        'intermediate'
      );

      // Get research trends
      const trends = await this.researchEngine.getResearchTrends();

      return {
        relevantPapers: papers.slice(0, 5),
        educationalPapers: educationalPapers.slice(0, 3),
        researchTrends: trends.slice(0, 3)
      };
    } catch (error: any) {
      logger.error('Error getting research for course:', error);
      return null;
    }
  }
}