// Adaptive Content Service - Main interface for dynamic content reordering

import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { ContentReorderingEngine } from './reordering-engine';
import { logger } from '@/lib/logger';
import {
  ContentItem,
  StudentProfile,
  ReorderingStrategy,
  ReorderingRequest,
  ReorderingResult,
  ContentSequence,
  ReorderingAnalytics,
  ContentType,
  AdaptationRecord,
  StudentFeedback,
  ReorderingAlgorithm
} from './types';

export class AdaptiveContentService {
  private reorderingEngine: ContentReorderingEngine;
  private sequenceCache = new Map<string, ContentSequence>();

  constructor() {
    this.reorderingEngine = new ContentReorderingEngine();
  }

  // Main method to get adaptive content sequence
  async getAdaptiveContentSequence(
    request: ReorderingRequest,
    useCache = true
  ): Promise<ReorderingResult> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    if (useCache) {
      const cached = await this.loadSequenceFromCache(cacheKey);
      if (cached) {
        return this.convertSequenceToResult(cached);
      }
    }

    // Get original content
    const originalContent = await this.getOriginalContent(request);
    
    // Get student profile
    const studentProfile = await this.getStudentProfile(request.studentId, request.courseId);
    
    // Select optimal reordering strategy
    const strategy = await this.selectOptimalStrategy(studentProfile, request);
    
    // Perform reordering
    const result = await this.reorderingEngine.reorderContent(
      request,
      originalContent,
      studentProfile,
      strategy
    );

    // Cache the result
    if (useCache) {
      await this.saveSequenceToCache(cacheKey, result.sequence);
    }

    // Record the adaptation
    await this.recordAdaptation(result);

    return result;
  }

  // Get original content items for the request scope
  private async getOriginalContent(request: ReorderingRequest): Promise<ContentItem[]> {
    let whereClause: any = {
      courseId: request.courseId
    };

    // Add scope filters
    if (request.chapterId) {
      whereClause.chapterId = request.chapterId;
    }
    if (request.sectionId) {
      whereClause.id = request.sectionId;
    }

    // Get sections from database
    const sections = await db.section.findMany({
      where: whereClause,
      orderBy: { position: 'asc' },
      include: {
        chapter: true
      }
    });

    // Convert to ContentItem format
    const contentItems: ContentItem[] = await Promise.all(sections.map(async (section, index) => ({
      id: section.id,
      type: this.mapSectionToContentType(section),
      title: section.title,
      description: (section as any).description || undefined,
      originalPosition: index,
      currentPosition: index,
      metadata: {
        difficulty: this.inferQuestionDifficulty(section),
        duration: section.duration || 30,
        cognitiveLoad: this.inferCognitiveLoad(section),
        bloomsLevel: this.inferBloomsLevel(section),
        learningObjectives: this.extractLearningObjectives(section),
        tags: [],
        prerequisites: [],
        concepts: this.extractConcepts(section)
      },
      adaptiveFactors: await this.calculateAdaptiveFactors(section.id, request.studentId),
      createdAt: section.createdAt,
      updatedAt: section.updatedAt
    })));

    return contentItems;
  }

  // Build student profile from historical data
  private async getStudentProfile(studentId: string, courseId: string): Promise<StudentProfile> {
    // Get student interactions
    const interactions = await db.sAMInteraction.findMany({
      where: { userId: studentId, courseId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Get learning metrics
    const metrics = await db.learning_metrics.findMany({
      where: { userId: studentId, courseId },
      orderBy: { createdAt: 'desc' },
      take: 7
    });

    // Get adaptation records
    const adaptationRecords = await this.getAdaptationHistory(studentId, courseId);

    // Build learning style from interactions
    const learningStyle = this.inferLearningStyle(interactions);
    
    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(interactions, metrics);
    
    // Infer preferences from behavior
    const preferences = this.inferPreferences(interactions, adaptationRecords);
    
    // Get current context
    const context = await this.getCurrentLearningContext(studentId, courseId);

    return {
      id: studentId,
      learningStyle,
      pace: this.inferLearningPace(interactions),
      preferences,
      performance,
      context,
      adaptationHistory: adaptationRecords
    };
  }

  // Select optimal reordering strategy based on student profile and context
  private async selectOptimalStrategy(
    profile: StudentProfile,
    request: ReorderingRequest
  ): Promise<ReorderingStrategy> {
    
    // Define available strategies
    const strategies: ReorderingStrategy[] = [
      {
        id: 'engagement_optimized',
        name: 'Engagement Optimized',
        description: 'Prioritizes content based on historical engagement patterns',
        algorithm: 'engagement_optimized',
        parameters: {
          weights: {
            difficulty: 0.2,
            engagement: 0.4,
            prerequisite: 0.1,
            learningStyle: 0.2,
            timeConstraint: 0.05,
            cognitiveLoad: 0.025,
            performance: 0.02,
            novelty: 0.005
          },
          constraints: {
            maxPositionShift: 3,
            preserveSequentialContent: true,
            respectHardPrerequisites: true,
            maintainOriginalFlow: 0.3,
            maxCognitiveLoad: 'high',
            sessionTimeLimit: request.context.sessionTime
          },
          optimization: {
            objective: 'maximize_engagement',
            iterations: 50,
            convergenceThreshold: 0.01
          }
        },
        applicabilityRules: [
          {
            condition: {
              field: 'averageEngagementScore',
              operator: 'less_than',
              value: 70,
              context: 'student'
            },
            weight: 0.8,
            description: 'Best for students with low engagement'
          }
        ],
        effectiveness: {
          completionImprovement: 15,
          engagementImprovement: 25,
          timeReduction: 5,
          studentSatisfaction: 4.2,
          usageFrequency: 12,
          successRate: 0.78
        }
      },
      {
        id: 'difficulty_adaptive',
        name: 'QuestionDifficulty Adaptive',
        description: 'Adjusts content order based on student ability and progress',
        algorithm: 'difficulty_adaptive',
        parameters: {
          weights: {
            difficulty: 0.4,
            engagement: 0.2,
            prerequisite: 0.2,
            learningStyle: 0.1,
            timeConstraint: 0.05,
            cognitiveLoad: 0.025,
            performance: 0.02,
            novelty: 0.005
          },
          constraints: {
            maxPositionShift: 5,
            preserveSequentialContent: false,
            respectHardPrerequisites: true,
            maintainOriginalFlow: 0.2,
            maxCognitiveLoad: 'medium',
            sessionTimeLimit: request.context.sessionTime
          },
          optimization: {
            objective: 'maximize_completion',
            iterations: 75,
            convergenceThreshold: 0.005
          }
        },
        applicabilityRules: [
          {
            condition: {
              field: 'strugglingAreas',
              operator: 'greater_than',
              value: 2,
              context: 'student'
            },
            weight: 0.9,
            description: 'Best for students struggling with difficulty progression'
          }
        ],
        effectiveness: {
          completionImprovement: 20,
          engagementImprovement: 10,
          timeReduction: 15,
          studentSatisfaction: 4.0,
          usageFrequency: 8,
          successRate: 0.82
        }
      }
    ];

    // Score each strategy for this student and context
    const strategyScores = strategies.map(strategy => ({
      strategy,
      score: this.calculateStrategyScore(strategy, profile, request)
    }));

    // Return the highest scoring strategy
    const bestStrategy = strategyScores.sort((a, b) => b.score - a.score)[0];
    return bestStrategy.strategy;
  }

  // Calculate how well a strategy fits the student profile and context
  private calculateStrategyScore(
    strategy: ReorderingStrategy,
    profile: StudentProfile,
    request: ReorderingRequest
  ): number {
    let score = 0;

    // Apply applicability rules
    for (const rule of strategy.applicabilityRules) {
      const conditionMet = this.evaluateCondition(rule.condition, profile, request);
      if (conditionMet) {
        score += rule.weight;
      }
    }

    // Context-based adjustments
    if (request.context.urgency === 'high') {
      // Prefer strategies that optimize for time
      if (strategy.algorithm === 'time_constrained') {
        score += 0.3;
      }
    }

    // Learning style alignment
    if (profile.learningStyle.visual > 0.7 && strategy.algorithm === 'learning_style_matched') {
      score += 0.2;
    }

    // Performance-based selection
    if (profile.performance.averageCompletionRate < 0.6) {
      if (strategy.algorithm === 'difficulty_adaptive') {
        score += 0.25;
      }
    }

    return score;
  }

  // Record adaptation for analytics and learning
  private async recordAdaptation(result: ReorderingResult): Promise<void> {
    try {
      // Save sequence to database
      await this.saveSequenceToDatabase(result.sequence);
      
      // Update analytics
      await this.updateReorderingAnalytics(result);

    } catch (error: any) {
      logger.error('Failed to record adaptation:', error);
    }
  }

  // Provide feedback on adaptation effectiveness
  async recordFeedback(
    sequenceId: string,
    feedback: StudentFeedback
  ): Promise<void> {
    try {
      // Update sequence performance
      const sequence = await this.getSequenceById(sequenceId);
      if (sequence) {
        sequence.performance.satisfactionScore = feedback.rating;
        sequence.updatedAt = new Date();
        
        await this.updateSequenceInDatabase(sequence);
      }

      // Learn from feedback for future adaptations
      await this.updateAdaptationLearning(sequenceId, feedback);
      
    } catch (error: any) {
      logger.error('Failed to record feedback:', error);
    }
  }

  // Get analytics for reordering effectiveness
  async getReorderingAnalytics(
    courseId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<ReorderingAnalytics> {
    const sequences = await this.getSequencesByTimeRange(courseId, timeRange);
    
    const totalAdaptations = sequences.reduce((sum, seq) => sum + seq.adaptations.length, 0);
    const successfulSequences = sequences.filter(seq => seq.performance.completionRate > 0.8);
    const successRate = sequences.length > 0 ? successfulSequences.length / sequences.length : 0;

    // Calculate average improvements
    const avgImprovement = {
      engagement: this.calculateAverageImprovement(sequences, 'engagement'),
      completion: this.calculateAverageImprovement(sequences, 'completion'),
      time: this.calculateAverageImprovement(sequences, 'time'),
      retention: this.calculateAverageImprovement(sequences, 'retention')
    };

    // Strategy effectiveness
    const strategyEffectiveness: Record<ReorderingAlgorithm, number> = {
      difficulty_adaptive: this.calculateStrategyEffectiveness(sequences, 'difficulty_adaptive'),
      engagement_optimized: this.calculateStrategyEffectiveness(sequences, 'engagement_optimized'),
      time_constrained: this.calculateStrategyEffectiveness(sequences, 'time_constrained'),
      learning_style_matched: this.calculateStrategyEffectiveness(sequences, 'learning_style_matched'),
      prerequisite_optimized: this.calculateStrategyEffectiveness(sequences, 'prerequisite_optimized'),
      spaced_repetition: this.calculateStrategyEffectiveness(sequences, 'spaced_repetition'),
      cognitive_load_balanced: this.calculateStrategyEffectiveness(sequences, 'cognitive_load_balanced'),
      performance_based: this.calculateStrategyEffectiveness(sequences, 'performance_based'),
      hybrid_multi_factor: this.calculateStrategyEffectiveness(sequences, 'hybrid_multi_factor')
    };

    return {
      totalAdaptations,
      successRate,
      averageImprovement: avgImprovement,
      strategyEffectiveness,
      studentSatisfaction: sequences.reduce((sum, seq) => sum + seq.performance.satisfactionScore, 0) / sequences.length,
      adoptionRate: 0.75, // Placeholder
      trends: [] // Calculated separately
    };
  }

  // Helper methods

  private generateCacheKey(request: ReorderingRequest): string {
    return `adaptive_sequence:${request.studentId}:${request.courseId}:${request.chapterId || 'all'}:${request.sectionId || 'all'}`;
  }

  private async loadSequenceFromCache(cacheKey: string): Promise<ContentSequence | null> {
    try {
      const cached = await redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error: any) {
      logger.error('Cache load error:', error);
      return null;
    }
  }

  private async saveSequenceToCache(cacheKey: string, sequence: ContentSequence): Promise<void> {
    try {
      await redis.setex(cacheKey, 1800, JSON.stringify(sequence)); // 30 minutes TTL
    } catch (error: any) {
      logger.error('Cache save error:', error);
    }
  }

  private convertSequenceToResult(sequence: ContentSequence): ReorderingResult {
    return {
      sequence,
      rationale: {
        strategy: sequence.strategy.name,
        keyFactors: [],
        tradeoffs: [],
        confidence: 0.8
      },
      estimatedImpact: {
        completionProbability: 0.8,
        engagementScore: 75,
        learningEfficiency: 0.75,
        timeToCompletion: sequence.adaptedSequence.reduce((sum, item) => sum + item.metadata.duration, 0),
        retentionProbability: 0.7
      }
    };
  }

  private mapSectionToContentType(section: any): ContentType {
    // Simple mapping based on section properties
    if (section.videoUrl) return 'video';
    if (section.isQuiz) return 'quiz';
    if (section.hasAssignment) return 'assignment';
    return 'text';
  }

  private inferQuestionDifficulty(section: any): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    // Simple inference - could be enhanced with ML
    if (section.position <= 3) return 'beginner';
    if (section.position <= 6) return 'intermediate';
    if (section.position <= 9) return 'advanced';
    return 'expert';
  }

  private inferCognitiveLoad(section: any): 'low' | 'medium' | 'high' {
    const duration = section.duration || 30;
    if (duration <= 20) return 'low';
    if (duration <= 45) return 'medium';
    return 'high';
  }

  private inferBloomsLevel(section: any): 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create' {
    // Placeholder implementation
    return 'understand';
  }

  private extractLearningObjectives(section: any): string[] {
    // Extract from description or predefined objectives
    return [];
  }

  private extractConcepts(section: any): string[] {
    // Extract key concepts from title and description
    return [section.title];
  }

  private async calculateAdaptiveFactors(sectionId: string, studentId: string): Promise<any> {
    const interactions = await db.sAMInteraction.findMany({
      where: { userId: studentId },
      take: 20
    });

    return {
      completionRate: 0.8,
      engagementScore: 75,
      difficultyRating: 0.6,
      timeToComplete: 30,
      struggleIndicators: [],
      successRate: 0.7,
      skipRate: 0.1,
      replayRate: 0.2,
      feedbackScore: 4.0
    };
  }

  private inferLearningStyle(interactions: any[]): any {
    // Placeholder implementation
    return {
      visual: 0.7,
      auditory: 0.3,
      kinesthetic: 0.5,
      reading: 0.6,
      sequential: 0.8,
      global: 0.2
    };
  }

  private calculatePerformanceMetrics(interactions: any[], metrics: any[]): any {
    // Placeholder implementation
    return {
      averageCompletionRate: 0.75,
      averageEngagementScore: 70,
      averageQuizScore: 78,
      learningVelocity: 2.5,
      retentionRate: 0.8,
      consistencyScore: 0.7,
      strugglingAreas: ['advanced-concepts'],
      strengths: ['basic-concepts']
    };
  }

  private inferPreferences(interactions: any[], adaptationRecords: AdaptationRecord[]): any {
    // Placeholder implementation
    return {
      contentTypePreference: {
        video: 0.8,
        text: 0.6,
        quiz: 0.7,
        assignment: 0.5,
        interactive: 0.9,
        document: 0.4,
        discussion: 0.3,
        exercise: 0.7
      },
      difficultyPreference: 'intermediate',
      sessionLength: 45,
      timeOfDay: [9, 10, 11, 14, 15, 16],
      breakFrequency: 25,
      interactivityLevel: 0.7
    };
  }

  private inferLearningPace(interactions: any[]): 'slow' | 'normal' | 'fast' | 'adaptive' {
    return 'normal';
  }

  private async getCurrentLearningContext(studentId: string, courseId: string): Promise<any> {
    // Placeholder implementation
    return {
      currentCourse: courseId,
      timeConstraints: {
        totalTimeAvailable: 120,
        sessionTimeLimit: 60,
        urgency: 'medium'
      },
      goals: [],
      distractions: 'medium',
      motivation: 'high',
      energy: 'medium',
      session: {
        startTime: new Date(),
        plannedDuration: 60,
        deviceType: 'desktop',
        location: 'home',
        networkQuality: 'good'
      }
    };
  }

  private async getAdaptationHistory(studentId: string, courseId: string): Promise<AdaptationRecord[]> {
    // Placeholder implementation
    return [];
  }

  private evaluateCondition(condition: any, profile: StudentProfile, request: ReorderingRequest): boolean {
    // Simple condition evaluation
    return true;
  }

  private async saveSequenceToDatabase(sequence: ContentSequence): Promise<void> {
    // Placeholder implementation

  }

  private async updateReorderingAnalytics(result: ReorderingResult): Promise<void> {
    // Placeholder implementation

  }

  private async getSequenceById(sequenceId: string): Promise<ContentSequence | null> {
    // Placeholder implementation
    return null;
  }

  private async updateSequenceInDatabase(sequence: ContentSequence): Promise<void> {
    // Placeholder implementation

  }

  private async updateAdaptationLearning(sequenceId: string, feedback: StudentFeedback): Promise<void> {
    // Placeholder implementation

  }

  private async getSequencesByTimeRange(courseId: string, timeRange: { start: Date; end: Date }): Promise<ContentSequence[]> {
    // Placeholder implementation
    return [];
  }

  private calculateAverageImprovement(sequences: ContentSequence[], metric: string): number {
    // Placeholder implementation
    return 10;
  }

  private calculateStrategyEffectiveness(sequences: ContentSequence[], algorithm: ReorderingAlgorithm): number {
    const strategySequences = sequences.filter(seq => seq.strategy.algorithm === algorithm);
    if (strategySequences.length === 0) return 0;
    
    return strategySequences.reduce((sum, seq) => sum + seq.performance.adaptationEffectiveness, 0) / strategySequences.length;
  }
}