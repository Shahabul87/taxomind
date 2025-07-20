import { samMasterIntegration } from './sam-master-integration';

/**
 * Enhanced SAM Context Integration
 * This integrates all 5 engines into SAM's existing context system
 */
export async function enhanceSAMContext(
  existingContext: any,
  userId: string,
  courseId: string | null,
  interactionType: string
) {
  try {
    // Get enhanced context from master integration
    const enhancedContext = await samMasterIntegration.getSAMContext(
      userId,
      courseId,
      interactionType,
      existingContext.query || existingContext.message
    );

    // Merge with existing context
    return {
      ...existingContext,
      engineInsights: enhancedContext.engineInsights,
      personalizedRecommendations: enhancedContext.recommendations,
      userLearningProfile: enhancedContext.engineInsights.learningProfile,
      courseMetrics: {
        marketPosition: enhancedContext.engineInsights.marketAnalysis?.position,
        cognitiveDepth: enhancedContext.engineInsights.bloomsAnalysis?.courseLevel?.cognitiveDepth,
        successProbability: enhancedContext.engineInsights.courseGuide?.successProbability,
      },
      suggestedActions: generateSuggestedActions(enhancedContext),
    };
  } catch (error) {
    console.error('Error enhancing SAM context:', error);
    // Return existing context if enhancement fails
    return existingContext;
  }
}

/**
 * Process SAM query with full engine integration
 */
export async function processSAMQueryWithEngines(
  userId: string,
  courseId: string | null,
  query: string,
  interactionType: string,
  existingContext?: any
) {
  try {
    // Get response from master integration
    const response = await samMasterIntegration.processSAMQuery(
      userId,
      courseId,
      query,
      interactionType
    );

    // Enhance with existing SAM capabilities
    return {
      ...response,
      // Preserve existing SAM features
      emotionalSupport: existingContext?.emotionalSupport,
      conversationHistory: existingContext?.conversationHistory,
      // Add engine-powered enhancements
      enginePowered: true,
      insights: response.insights,
      recommendations: response.suggestions,
      nextSteps: response.actions,
    };
  } catch (error) {
    console.error('Error processing SAM query with engines:', error);
    throw error;
  }
}

/**
 * Generate suggested actions based on enhanced context
 */
function generateSuggestedActions(context: any) {
  const actions = [];
  const { user, engineInsights, recommendations } = context;

  // For students
  if (user.role === 'USER') {
    // Progress tracking action
    actions.push({
      id: 'view-progress',
      label: 'View My Learning Progress',
      description: 'See your Bloom\'s taxonomy progress and cognitive development',
      // Route will be implemented later by the user
      route: null,
      priority: 'medium',
    });

    // Weak area improvement
    if (engineInsights.bloomsAnalysis?.studentProgress?.weaknessAreas?.length > 0) {
      const weakArea = engineInsights.bloomsAnalysis.studentProgress.weaknessAreas[0];
      actions.push({
        id: 'improve-weak-area',
        label: `Improve ${weakArea} Skills`,
        description: 'Focus on your weakest cognitive area',
        // Route will be implemented later by the user
        route: null,
        priority: 'high',
      });
    }

    // Study guide
    if (context.course?.id) {
      actions.push({
        id: 'generate-study-guide',
        label: 'Get Personalized Study Guide',
        description: 'AI-generated guide based on your progress',
        action: async () => {
          const response = await fetch('/api/sam/exam-engine/study-guide', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseId: context.course.id,
              includeWeakAreas: true,
            }),
          });
          return response.json();
        },
        priority: 'medium',
      });
    }
  }

  // For teachers/admins
  if (user.role === 'ADMIN' && context.course?.id) {
    // Critical actions from course guide
    if (engineInsights.courseGuide?.criticalActions > 0) {
      actions.push({
        id: 'view-critical-actions',
        label: `Address ${engineInsights.courseGuide.criticalActions} Critical Actions`,
        description: 'Immediate improvements needed for your course',
        // Route will be implemented later by the user
        route: null,
        priority: 'critical',
      });
    }

    // Market improvement
    if (engineInsights.marketAnalysis?.position === 'follower') {
      actions.push({
        id: 'improve-market-position',
        label: 'Improve Market Position',
        description: 'Your course is behind competitors',
        // Route will be implemented later by the user
        route: null,
        priority: 'high',
      });
    }

    // Content depth
    if (engineInsights.courseGuide?.metrics?.depth?.overallDepth < 60) {
      actions.push({
        id: 'enhance-content',
        label: 'Enhance Course Content',
        description: 'Add more comprehensive content',
        // Route will be implemented later by the user
        route: null,
        priority: 'high',
      });
    }

    // Run analysis
    actions.push({
      id: 'run-full-analysis',
      label: 'Run Complete AI Analysis',
      description: 'Get insights from all 5 engines',
      action: async () => {
        const response = await fetch('/api/sam/integrated-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: context.course.id,
            userId: user.id,
            analysisDepth: 'comprehensive',
          }),
        });
        return response.json();
      },
      priority: 'low',
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return actions.sort((a, b) => 
    priorityOrder[a.priority as keyof typeof priorityOrder] - 
    priorityOrder[b.priority as keyof typeof priorityOrder]
  );
}

/**
 * Get contextual help based on engine insights
 */
export function getContextualHelp(engineInsights: any, userRole: string) {
  const help = [];

  if (userRole === 'USER') {
    // Learning style help
    if (engineInsights.learningProfile?.learningStyle) {
      help.push({
        topic: 'Learning Style',
        content: `You learn best through ${engineInsights.learningProfile.learningStyle} methods. Try to use materials that match this style.`,
      });
    }

    // Progress help
    if (engineInsights.bloomsAnalysis?.studentProgress) {
      const progress = engineInsights.bloomsAnalysis.studentProgress;
      help.push({
        topic: 'Your Progress',
        content: `You're strong in ${progress.strengthAreas.join(', ')} but need work on ${progress.weaknessAreas.join(', ')}.`,
      });
    }
  }

  if (userRole === 'ADMIN') {
    // Course improvement help
    if (engineInsights.courseGuide?.metrics) {
      const metrics = engineInsights.courseGuide.metrics;
      help.push({
        topic: 'Course Metrics',
        content: `Depth: ${metrics.depth?.overallDepth}%, Engagement: ${metrics.engagement?.overallEngagement}%, Market: ${metrics.marketAcceptance?.overallAcceptance}%`,
      });
    }

    // Market position help
    if (engineInsights.marketAnalysis?.position) {
      help.push({
        topic: 'Market Position',
        content: `Your course is in a ${engineInsights.marketAnalysis.position} position with ${engineInsights.marketAnalysis.growthPotential}% growth potential.`,
      });
    }
  }

  return help;
}

/**
 * Export integration functions for SAM to use
 */
export const samEngineIntegration = {
  enhanceContext: enhanceSAMContext,
  processQuery: processSAMQueryWithEngines,
  getContextualHelp,
  
  // Direct access to specific engines if needed
  async getMarketInsights(courseId: string) {
    const context = await samMasterIntegration.getSAMContext('system', courseId, 'MARKET_ANALYSIS');
    return context.engineInsights.marketAnalysis;
  },
  
  async getStudentProgress(userId: string, courseId: string) {
    const context = await samMasterIntegration.getSAMContext(userId, courseId, 'PROGRESS_CHECK');
    return context.engineInsights.bloomsAnalysis?.studentProgress;
  },
  
  async getCourseGuide(courseId: string) {
    const context = await samMasterIntegration.getSAMContext('system', courseId, 'COURSE_GUIDE');
    return context.engineInsights.courseGuide;
  },
};