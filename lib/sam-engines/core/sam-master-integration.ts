// @ts-nocheck
import { SAMEngineIntegration } from './sam-engine-integration';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * SAM Master Integration
 * This is the central hub that connects SAM AI tutor with all 5 engines
 * It provides context-aware responses by leveraging insights from all engines
 */
export class SAMMasterIntegration {
  private engineIntegration: SAMEngineIntegration;
  
  constructor() {
    this.engineIntegration = new SAMEngineIntegration();
  }

  /**
   * Get comprehensive context for SAM based on current interaction
   */
  async getSAMContext(
    userId: string,
    courseId: string | null,
    interactionType: string,
    query?: string
  ): Promise<SAMEnhancedContext> {
    // Get user basic info
    // NOTE: Users don't have roles - only AdminAccount has roles
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        isTeacher: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get engine insights based on interaction type
    // NOTE: Users don't have roles - all users in User table are regular users
    const engineInsights = await this.getRelevantEngineInsights(
      userId,
      courseId,
      interactionType,
      'USER' // Users don't have roles, default to 'USER'
    );

    // Get personalized recommendations
    const recommendations = await this.getPersonalizedRecommendations(
      userId,
      courseId,
      'USER', // Users don't have roles, default to 'USER'
      engineInsights
    );

    // Build enhanced context for SAM
    // NOTE: Users don't have roles - use isTeacher flag instead
    return {
      user: {
        id: user.id,
        name: user.name,
        isTeacher: user.isTeacher || false,
        learningProfile: engineInsights.learningProfile,
      },
      course: courseId ? await this.getCourseContext(courseId) : null,
      engineInsights,
      recommendations,
      conversationContext: {
        interactionType,
        query,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Get relevant insights from engines based on interaction type
   */
  private async getRelevantEngineInsights(
    userId: string,
    courseId: string | null,
    interactionType: string,
    userRole: string
  ): Promise<EngineInsights> {
    const insights: EngineInsights = {
      marketAnalysis: null,
      bloomsAnalysis: null,
      examInsights: null,
      courseGuide: null,
      learningProfile: null,
    };

    // Determine which engines to query based on interaction type
    const engineConfig = this.getEngineConfig(interactionType, userRole);

    if (courseId) {
      // Parallel fetch from relevant engines
      const promises = [];

      if (engineConfig.useMarketAnalysis && userRole === 'ADMIN') {
        promises.push(
          this.getMarketInsights(courseId).then(data => insights.marketAnalysis = data)
        );
      }

      if (engineConfig.useBloomsAnalysis) {
        promises.push(
          this.getBloomsInsights(courseId, userId).then(data => insights.bloomsAnalysis = data)
        );
      }

      if (engineConfig.useCourseGuide && userRole === 'ADMIN') {
        promises.push(
          this.getCourseGuideInsights(courseId).then(data => insights.courseGuide = data)
        );
      }

      await Promise.all(promises);
    }

    // Always get learning profile for students
    if (userRole === 'USER') {
      insights.learningProfile = await this.getLearningProfile(userId, courseId);
    }

    return insights;
  }

  /**
   * Determine which engines to use based on interaction type
   */
  private getEngineConfig(interactionType: string, userRole: string) {
    const configs: Record<string, any> = {
      'COURSE_HELP': {
        useMarketAnalysis: false,
        useBloomsAnalysis: true,
        useCourseGuide: true,
      },
      'CONTENT_GENERATED': {
        useMarketAnalysis: true,
        useBloomsAnalysis: true,
        useCourseGuide: true,
      },
      'QUESTION_ASKED': {
        useMarketAnalysis: false,
        useBloomsAnalysis: true,
        useCourseGuide: false,
      },
      'EXAM_HELP': {
        useMarketAnalysis: false,
        useBloomsAnalysis: true,
        useCourseGuide: false,
      },
      'PROGRESS_CHECK': {
        useMarketAnalysis: false,
        useBloomsAnalysis: true,
        useCourseGuide: false,
      },
    };

    return configs[interactionType] || {
      useMarketAnalysis: false,
      useBloomsAnalysis: true,
      useCourseGuide: false,
    };
  }

  /**
   * Get market analysis insights
   */
  private async getMarketInsights(courseId: string) {
    try {
      const analysis = await db.courseMarketAnalysis.findUnique({
        where: { courseId },
      });

      if (!analysis) return null;

      return {
        marketValue: analysis.marketValue,
        demandScore: analysis.demandScore,
        competitionLevel: (analysis.competitorAnalysis as any)?.competition ?? 0,
        growthPotential: (analysis.trendAnalysis as any)?.growthPotential ?? 0,
        position: analysis.marketPosition,
        lastUpdated: analysis.lastAnalyzedAt,
      };
    } catch (error: any) {
      logger.error('Error fetching market insights:', error);
      return null;
    }
  }

  /**
   * Get Bloom's taxonomy insights
   */
  private async getBloomsInsights(courseId: string, userId: string) {
    try {
      // Get course-level analysis
      const courseAnalysis = await db.courseBloomsAnalysis.findUnique({
        where: { courseId },
      });

      // Get student progress if applicable
      const studentProgress = await db.studentBloomsProgress.findUnique({
        where: {
          userId_courseId: { userId, courseId } as any,
        },
      });

      return {
        courseLevel: courseAnalysis ? {
          distribution: courseAnalysis.bloomsDistribution,
          cognitiveDepth: courseAnalysis.cognitiveDepth,
          gaps: courseAnalysis.gapAnalysis,
        } : null,
        studentProgress: studentProgress ? {
          bloomsScores: studentProgress.bloomsScores,
          strengthAreas: studentProgress.strengthAreas,
          weaknessAreas: studentProgress.weaknessAreas,
          lastAssessed: studentProgress.lastAssessedAt,
        } : null,
      };
    } catch (error: any) {
      logger.error('Error fetching Blooms insights:', error);
      return null;
    }
  }

  /**
   * Get course guide insights
   */
  private async getCourseGuideInsights(courseId: string) {
    try {
      // Get latest SAM interaction with course guide data
      const latestGuide = await db.sAMInteraction.findFirst({
        where: {
          courseId,
          context: {
            path: ['type'],
            equals: 'COURSE_GUIDE_GENERATED',
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!latestGuide?.context) return null;

      const result = latestGuide.context as any;
      return {
        metrics: result?.metrics ?? null,
        successProbability: result?.successProbability ?? null,
        criticalActions: result?.criticalActions ?? 0,
      };
    } catch (error: any) {
      logger.error('Error fetching course guide insights:', error);
      return null;
    }
  }

  /**
   * Get student learning profile
   */
  private async getLearningProfile(userId: string, courseId: string | null) {
    try {
      const cognitiveProfile = await db.studentCognitiveProfile.findUnique({
        where: { userId },
      });

      const recentMetrics = await db.bloomsPerformanceMetric.findMany({
        where: {
          userId,
          ...(courseId && { courseId }),
        },
        orderBy: { recordedAt: 'desc' },
        take: 5,
      });

      return {
        overallLevel: cognitiveProfile?.overallCognitiveLevel || 0,
        learningStyle: cognitiveProfile?.optimalLearningStyle || 'mixed',
        bloomsMastery: cognitiveProfile?.bloomsMastery || {},
        recentPerformance: recentMetrics.map(m => ({
          level: m.bloomsLevel,
          accuracy: m.accuracy,
          trend: m.improvementRate > 0 ? 'improving' : 'stable',
        })),
      };
    } catch (error: any) {
      logger.error('Error fetching learning profile:', error);
      return null;
    }
  }

  /**
   * Get course context
   */
  private async getCourseContext(courseId: string) {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: {
            chapters: true,
            Purchase: true,
            Enrollment: true,
          },
        },
      },
    });

    if (!course) return null;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      chapters: course._count.chapters,
      students: course._count.Purchase,
      Enrollment: course._count.Enrollment,
    };
  }

  /**
   * Generate personalized recommendations
   */
  private async getPersonalizedRecommendations(
    userId: string,
    courseId: string | null,
    userRole: string,
    insights: EngineInsights
  ): Promise<PersonalizedRecommendations> {
    const recommendations: PersonalizedRecommendations = {
      immediate: [],
      learning: [],
      content: [],
      strategy: [],
    };

    // For students
    if (userRole === 'USER' && insights.bloomsAnalysis?.studentProgress) {
      const progress = insights.bloomsAnalysis.studentProgress;
      
      // Focus on weak areas
      if (progress.weaknessAreas.length > 0) {
        recommendations.immediate.push({
          type: 'learning',
          priority: 'high',
          title: `Focus on ${progress.weaknessAreas[0]} skills`,
          description: 'This is your weakest area that needs improvement',
          action: 'Practice exercises targeting this cognitive level',
        });
      }

      // Learning style recommendation
      if (insights.learningProfile) {
        recommendations.learning.push({
          type: 'strategy',
          priority: 'medium',
          title: `Optimize for ${insights.learningProfile.learningStyle} learning`,
          description: 'Your learning style suggests specific approaches work best',
          action: 'Use recommended learning methods for better retention',
        });
      }
    }

    // For teachers
    if (userRole === 'ADMIN') {
      // Market positioning
      if (insights.marketAnalysis?.position === 'follower') {
        recommendations.strategy.push({
          type: 'market',
          priority: 'high',
          title: 'Improve market position',
          description: 'Your course is lagging behind competitors',
          action: 'Implement differentiation strategies',
        });
      }

      // Content depth
      if (insights.courseGuide?.metrics?.depth?.overallDepth < 60) {
        recommendations.content.push({
          type: 'content',
          priority: 'high',
          title: 'Enhance content depth',
          description: 'Course lacks comprehensive coverage',
          action: 'Add more detailed content and assessments',
        });
      }

      // Bloom's balance
      if (insights.bloomsAnalysis?.courseLevel?.gaps?.length > 0) {
        recommendations.content.push({
          type: 'cognitive',
          priority: 'medium',
          title: 'Address cognitive gaps',
          description: 'Some Bloom\'s levels are underrepresented',
          action: 'Add activities for missing cognitive levels',
        });
      }
    }

    return recommendations;
  }

  /**
   * Process SAM query with engine context
   */
  async processSAMQuery(
    userId: string,
    courseId: string | null,
    query: string,
    interactionType: string
  ): Promise<SAMResponse> {
    // Get enhanced context
    const context = await this.getSAMContext(userId, courseId, interactionType, query);

    // Determine response strategy based on context
    const responseStrategy = this.determineResponseStrategy(query, context);

    // Generate contextual response elements
    const responseElements = await this.generateResponseElements(
      responseStrategy,
      context
    );

    return {
      message: responseElements.message,
      suggestions: responseElements.suggestions,
      actions: responseElements.actions,
      insights: responseElements.insights,
      context: {
        engineData: context.engineInsights,
        recommendations: context.recommendations,
      },
    };
  }

  /**
   * Determine response strategy based on query and context
   */
  private determineResponseStrategy(query: string, context: SAMEnhancedContext) {
    const queryLower = query.toLowerCase();
    
    // Analyze query intent
    const intents = {
      progress: /progress|how am i doing|performance|score/i.test(query),
      help: /help|explain|understand|confused/i.test(query),
      recommendation: /recommend|suggest|should|what next/i.test(query),
      analysis: /analyze|analysis|insights|data/i.test(query),
      exam: /exam|test|quiz|assessment/i.test(query),
      content: /content|chapter|section|topic/i.test(query),
    };

    // Determine primary intent
    const primaryIntent = Object.entries(intents)
      .filter(([, matches]) => matches)
      .map(([intent]) => intent)[0] || 'general';

    return {
      primaryIntent,
      useEngineData: true,
      personalize: !context.user.isTeacher, // Personalize for students (non-teachers)
      includeRecommendations: intents.recommendation || intents.help,
      includeAnalytics: intents.analysis || intents.progress,
    };
  }

  /**
   * Generate response elements based on strategy
   */
  private async generateResponseElements(
    strategy: any,
    context: SAMEnhancedContext
  ) {
    const elements: any = {
      message: '',
      suggestions: [],
      actions: [],
      insights: [],
    };

    // Build personalized message
    if (strategy.personalize && context.engineInsights.learningProfile) {
      const profile = context.engineInsights.learningProfile;
      elements.message = `Based on your ${profile.learningStyle} learning style and current progress, `;
    }

    // Add intent-specific content
    switch (strategy.primaryIntent) {
      case 'progress':
        if (context.engineInsights.bloomsAnalysis?.studentProgress) {
          const progress = context.engineInsights.bloomsAnalysis.studentProgress;
          elements.message += `you're doing well in ${progress.strengthAreas.join(', ')} `;
          elements.message += `but need to focus on ${progress.weaknessAreas.join(', ')}.`;
          
          elements.insights.push({
            type: 'progress',
            data: progress.bloomsScores,
          });
        }
        break;

      case 'recommendation':
        if (context.recommendations.immediate.length > 0) {
          elements.message += 'I recommend focusing on: ';
          elements.suggestions = context.recommendations.immediate.map(r => ({
            title: r.title,
            description: r.description,
            priority: r.priority,
          }));
        }
        break;

      case 'analysis':
        // Show course analysis for teachers
        if (context.user.isTeacher && context.engineInsights.courseGuide) {
          const guide = context.engineInsights.courseGuide;
          elements.message += `Your course has ${guide.metrics?.depth?.overallDepth}% content depth `;
          elements.message += `with ${guide.successProbability}% success probability.`;

          elements.insights.push({
            type: 'metrics',
            data: guide.metrics,
          });
        }
        break;
    }

    // Add relevant actions
    if (strategy.includeRecommendations) {
      elements.actions = this.generateActions(context);
    }

    return elements;
  }

  /**
   * Generate actionable items based on context
   */
  private generateActions(context: SAMEnhancedContext) {
    const actions = [];

    // Actions for students (non-teachers)
    if (!context.user.isTeacher) {
      actions.push({
        label: 'View My Progress',
        route: '/student/sam-dashboard',
        icon: 'chart',
      });

      if (context.engineInsights.bloomsAnalysis?.studentProgress?.weaknessAreas.length > 0) {
        actions.push({
          label: 'Practice Weak Areas',
          route: `/practice?focus=${context.engineInsights.bloomsAnalysis.studentProgress.weaknessAreas[0]}`,
          icon: 'practice',
        });
      }
    }

    // Actions for teachers
    if (context.user.isTeacher && context.course) {
      actions.push({
        label: 'Run Full Analysis',
        route: `/teacher/courses/${context.course.id}/sam-analysis`,
        icon: 'analysis',
      });

      if (context.engineInsights.courseGuide?.criticalActions > 0) {
        actions.push({
          label: 'View Critical Actions',
          route: `/teacher/courses/${context.course.id}/sam-analysis?tab=recommendations`,
          icon: 'alert',
        });
      }
    }

    return actions;
  }
}

// Type definitions
// NOTE: Users don't have roles - use isTeacher flag instead
interface SAMEnhancedContext {
  user: {
    id: string;
    name: string | null;
    isTeacher: boolean;
    learningProfile: any;
  };
  course: any;
  engineInsights: EngineInsights;
  recommendations: PersonalizedRecommendations;
  conversationContext: {
    interactionType: string;
    query?: string;
    timestamp: Date;
  };
}

interface EngineInsights {
  marketAnalysis: any;
  bloomsAnalysis: any;
  examInsights: any;
  courseGuide: any;
  learningProfile: any;
}

interface PersonalizedRecommendations {
  immediate: Recommendation[];
  learning: Recommendation[];
  content: Recommendation[];
  strategy: Recommendation[];
}

interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
}

interface SAMResponse {
  message: string;
  suggestions: any[];
  actions: any[];
  insights: any[];
  context: any;
}

// Export singleton instance
export const samMasterIntegration = new SAMMasterIntegration();