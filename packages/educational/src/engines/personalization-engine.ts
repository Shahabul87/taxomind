/**
 * @sam-ai/educational - PersonalizationEngine
 * Advanced learning personalization engine with cognitive profiling
 */

import type { SAMConfig, SAMDatabaseAdapter } from '@sam-ai/core';
import type {
  PersonalizationEngineConfig,
  LearningBehavior,
  LearningStyle,
  LearningStyleProfile,
  OptimizedContent,
  ContentAdaptation,
  EmotionalState,
  EmotionIndicator,
  MotivationProfile,
  MotivationFactor,
  PersonalizedPath,
  LearningNode,
  LearningEdge,
  AlternativePath,
  PersonalizationContext,
  PersonalizationResult,
  PersonalizationInsight,
  StudentProfileInput,
  LearningHistory,
  Interaction,
  StudentInfo,
  ContentRecommendation,
} from '../types';

// ============================================================================
// LEARNING STYLE KEYWORDS
// ============================================================================

const LEARNING_STYLE_INDICATORS: Record<LearningStyle, string[]> = {
  visual: ['diagram', 'chart', 'graph', 'picture', 'video', 'infographic', 'color', 'map'],
  auditory: ['podcast', 'lecture', 'discussion', 'audio', 'verbal', 'speak', 'listen'],
  kinesthetic: ['hands-on', 'practice', 'simulation', 'experiment', 'build', 'interactive'],
  'reading-writing': ['text', 'notes', 'read', 'write', 'article', 'document', 'list'],
  mixed: [],
};

// ============================================================================
// PERSONALIZATION ENGINE IMPLEMENTATION
// ============================================================================

export class PersonalizationEngine {
  private config: SAMConfig;
  private database?: SAMDatabaseAdapter;
  private logger: SAMConfig['logger'];
  private learningStyleCache = new Map<string, LearningStyleProfile>();
  private emotionalStateCache = new Map<string, EmotionalState>();

  constructor(engineConfig: PersonalizationEngineConfig) {
    this.config = engineConfig.samConfig;
    this.database = engineConfig.database ?? engineConfig.samConfig.database;
    this.logger = this.config.logger ?? console;
  }

  // ============================================================================
  // LEARNING STYLE DETECTION
  // ============================================================================

  async detectLearningStyle(behavior: LearningBehavior): Promise<LearningStyleProfile> {
    this.logger?.info?.('[PersonalizationEngine] Detecting learning style');

    // Check cache first
    const cached = this.learningStyleCache.get(behavior.userId);
    if (cached) {
      return cached;
    }

    // Analyze behavior patterns
    const styleStrengths = this.analyzeStyleStrengths(behavior);
    const sortedStyles = Object.entries(styleStrengths)
      .sort(([, a], [, b]) => b - a) as [LearningStyle, number][];

    const primaryStyle = sortedStyles[0][0];
    const secondaryStyle = sortedStyles[1]?.[1] > 0.2 ? sortedStyles[1][0] : undefined;

    // Generate evidence factors
    const evidenceFactors = this.generateEvidenceFactors(behavior, primaryStyle);

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(behavior, styleStrengths);

    const profile: LearningStyleProfile = {
      primaryStyle,
      secondaryStyle,
      styleStrengths: styleStrengths as Record<LearningStyle, number>,
      evidenceFactors,
      confidence,
    };

    // Cache and store
    this.learningStyleCache.set(behavior.userId, profile);
    await this.storeLearningStyleProfile(behavior.userId, profile);

    return profile;
  }

  private analyzeStyleStrengths(behavior: LearningBehavior): Record<string, number> {
    const strengths: Record<string, number> = {
      visual: 0,
      auditory: 0,
      kinesthetic: 0,
      'reading-writing': 0,
      mixed: 0,
    };

    // Analyze content interactions
    for (const interaction of behavior.contentInteractions) {
      const contentType = interaction.contentType.toLowerCase();
      const weight = interaction.engagementScore * interaction.completionRate;

      if (contentType.includes('video') || contentType.includes('image')) {
        strengths.visual += weight;
      }
      if (contentType.includes('audio') || contentType.includes('podcast')) {
        strengths.auditory += weight;
      }
      if (contentType.includes('interactive') || contentType.includes('simulation')) {
        strengths.kinesthetic += weight;
      }
      if (contentType.includes('text') || contentType.includes('article')) {
        strengths['reading-writing'] += weight;
      }
    }

    // Normalize strengths
    const total = Object.values(strengths).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const key of Object.keys(strengths)) {
        strengths[key] /= total;
      }
    }

    return strengths;
  }

  private generateEvidenceFactors(behavior: LearningBehavior, primaryStyle: LearningStyle): string[] {
    const factors: string[] = [];

    const avgSession = behavior.sessionPatterns.reduce((sum, s) => sum + s.duration, 0) /
      Math.max(1, behavior.sessionPatterns.length);

    factors.push(`Average session duration: ${avgSession.toFixed(0)} minutes`);
    factors.push(`Primary engagement with ${primaryStyle} content`);
    factors.push(`${behavior.contentInteractions.length} content interactions analyzed`);

    return factors;
  }

  private calculateConfidence(behavior: LearningBehavior, strengths: Record<string, number>): number {
    // More data = higher confidence
    const dataPoints = behavior.contentInteractions.length + behavior.sessionPatterns.length;
    const dataConfidence = Math.min(1, dataPoints / 50);

    // Clearer distinction = higher confidence
    const values = Object.values(strengths).sort((a, b) => b - a);
    const distinctionConfidence = values[0] - values[1];

    return (dataConfidence * 0.6 + distinctionConfidence * 0.4);
  }

  // ============================================================================
  // COGNITIVE LOAD OPTIMIZATION
  // ============================================================================

  async optimizeCognitiveLoad(content: unknown, student: StudentInfo): Promise<OptimizedContent> {
    this.logger?.info?.('[PersonalizationEngine] Optimizing cognitive load');

    const adaptations: ContentAdaptation[] = [];
    const emphasizedElements: string[] = [];
    const simplifiedConcepts: string[] = [];
    const additionalExplanations: string[] = [];

    // Use AI to analyze content complexity if available
    if (this.config.ai) {
      try {
        const prompt = `Analyze this educational content and suggest:
1. Key elements to emphasize
2. Complex concepts that may need simplification
3. Areas where additional explanations would help

Content: ${JSON.stringify(content)}

Student profile: ${JSON.stringify(student.samLearningProfile || {})}

Respond in JSON format with keys: emphasizedElements, simplifiedConcepts, additionalExplanations`;

        const response = await this.config.ai.chat({
          messages: [{ role: 'user', content: prompt }],
          model: this.config.model?.name || 'claude-sonnet-4-20250514',
        });

        const parsed = this.parseAIResponse(response);
        if (parsed.emphasizedElements) emphasizedElements.push(...parsed.emphasizedElements);
        if (parsed.simplifiedConcepts) simplifiedConcepts.push(...parsed.simplifiedConcepts);
        if (parsed.additionalExplanations) additionalExplanations.push(...parsed.additionalExplanations);
      } catch (error) {
        this.logger?.error?.('[PersonalizationEngine] AI optimization failed:', error);
      }
    }

    return {
      originalContent: content,
      adaptations,
      presentationOrder: [],
      emphasizedElements,
      simplifiedConcepts,
      additionalExplanations,
    };
  }

  // ============================================================================
  // EMOTIONAL STATE RECOGNITION
  // ============================================================================

  async recognizeEmotionalState(interactions: Interaction[]): Promise<EmotionalState> {
    this.logger?.info?.('[PersonalizationEngine] Recognizing emotional state');

    if (interactions.length === 0) {
      return this.getDefaultEmotionalState();
    }

    const userId = interactions[0].userId;
    const indicators: EmotionIndicator[] = [];

    // Analyze error rates
    const errorRate = interactions.filter(i => i.isError).length / interactions.length;
    indicators.push({
      type: 'error_rate',
      value: errorRate,
      weight: 0.3,
      timestamp: new Date(),
    });

    // Analyze response times
    const avgResponseTime = interactions.reduce((sum, i) => sum + i.responseTime, 0) / interactions.length;
    indicators.push({
      type: 'response_time',
      value: avgResponseTime,
      weight: 0.2,
      timestamp: new Date(),
    });

    // Analyze activity patterns
    const recentActivity = interactions.slice(0, 10);
    const activityVariety = new Set(recentActivity.map(i => i.type)).size;
    indicators.push({
      type: 'activity_variety',
      value: activityVariety,
      weight: 0.2,
      timestamp: new Date(),
    });

    // Infer emotion based on indicators
    const emotion = this.inferEmotion(indicators);
    const trend = this.calculateTrend(userId);
    const recommendations = this.generateEmotionalRecommendations(emotion);

    const state: EmotionalState = {
      currentEmotion: emotion,
      confidence: 0.7,
      indicators,
      trend,
      recommendations,
    };

    // Cache and store
    this.emotionalStateCache.set(userId, state);
    await this.storeEmotionalState(userId, state);

    return state;
  }

  private getDefaultEmotionalState(): EmotionalState {
    return {
      currentEmotion: 'neutral',
      confidence: 0.5,
      indicators: [],
      trend: 'stable',
      recommendations: ['Continue with current learning activities'],
    };
  }

  private inferEmotion(indicators: EmotionIndicator[]): EmotionalState['currentEmotion'] {
    const errorIndicator = indicators.find(i => i.type === 'error_rate');
    const responseIndicator = indicators.find(i => i.type === 'response_time');

    const errorRate = (errorIndicator?.value as number) || 0;
    const responseTime = (responseIndicator?.value as number) || 0;

    if (errorRate > 0.5) return 'frustrated';
    if (errorRate > 0.3) return 'confused';
    if (responseTime < 1000 && errorRate < 0.1) return 'confident';
    if (responseTime > 10000) return 'anxious';

    return 'neutral';
  }

  private calculateTrend(userId: string): EmotionalState['trend'] {
    const cached = this.emotionalStateCache.get(userId);
    if (!cached) return 'stable';

    // Simple trend analysis based on previous state
    return 'stable';
  }

  private generateEmotionalRecommendations(emotion: EmotionalState['currentEmotion']): string[] {
    const recommendations: Record<EmotionalState['currentEmotion'], string[]> = {
      motivated: ['Continue with current pace', 'Try more challenging content'],
      frustrated: ['Take a short break', 'Review previous concepts', 'Try easier problems first'],
      confused: ['Review learning materials', 'Ask for help', 'Break down the problem'],
      confident: ['Progress to next level', 'Help other learners', 'Tackle advanced topics'],
      anxious: ['Take a deep breath', 'Start with familiar content', 'Set smaller goals'],
      neutral: ['Continue learning at your pace'],
    };

    return recommendations[emotion] || ['Continue learning'];
  }

  // ============================================================================
  // MOTIVATION ANALYSIS
  // ============================================================================

  async analyzeMotivationPatterns(history: LearningHistory): Promise<MotivationProfile> {
    this.logger?.info?.('[PersonalizationEngine] Analyzing motivation patterns');

    const intrinsicFactors = this.identifyIntrinsicFactors(history);
    const extrinsicFactors = this.identifyExtrinsicFactors(history);
    const triggers = this.identifyMotivationTriggers(history);
    const barriers = this.identifyMotivationBarriers(history);

    // Calculate current motivation level
    const positiveScore = [...intrinsicFactors, ...extrinsicFactors]
      .filter(f => f.type === 'positive')
      .reduce((sum, f) => sum + f.strength, 0);
    const negativeScore = [...intrinsicFactors, ...extrinsicFactors]
      .filter(f => f.type === 'negative')
      .reduce((sum, f) => sum + f.strength, 0);

    const currentLevel = Math.max(0, Math.min(100, 50 + positiveScore * 10 - negativeScore * 10));
    const sustainabilityScore = intrinsicFactors.length > extrinsicFactors.length ? 0.8 : 0.5;

    const profile: MotivationProfile = {
      intrinsicFactors,
      extrinsicFactors,
      currentLevel,
      triggers,
      barriers,
      sustainabilityScore,
    };

    await this.storeMotivationProfile(history.userId, profile);

    return profile;
  }

  private identifyIntrinsicFactors(history: LearningHistory): MotivationFactor[] {
    const factors: MotivationFactor[] = [];

    // Check for curiosity-driven learning
    if (history.activities.length > 20) {
      factors.push({
        factor: 'Curiosity',
        strength: 0.7,
        type: 'positive',
        evidence: ['Consistent exploration of new topics'],
      });
    }

    // Check for self-improvement motivation
    if (history.progress.length > 10) {
      factors.push({
        factor: 'Self-improvement',
        strength: 0.6,
        type: 'positive',
        evidence: ['Regular progress tracking'],
      });
    }

    return factors;
  }

  private identifyExtrinsicFactors(history: LearningHistory): MotivationFactor[] {
    const factors: MotivationFactor[] = [];

    // Check for achievement-driven learning
    if (history.achievements.length > 5) {
      factors.push({
        factor: 'Achievement',
        strength: 0.5,
        type: 'positive',
        evidence: ['Multiple achievements earned'],
      });
    }

    return factors;
  }

  private identifyMotivationTriggers(history: LearningHistory): string[] {
    return [
      'Completing a challenge',
      'Receiving positive feedback',
      'Making progress on goals',
    ];
  }

  private identifyMotivationBarriers(history: LearningHistory): string[] {
    return [
      'Difficult content without support',
      'Lack of immediate feedback',
      'Unclear learning objectives',
    ];
  }

  // ============================================================================
  // PERSONALIZED LEARNING PATH
  // ============================================================================

  async generatePersonalizedPath(profile: StudentProfileInput): Promise<PersonalizedPath> {
    this.logger?.info?.('[PersonalizationEngine] Generating personalized learning path');

    const pathId = `path-${Date.now()}-${profile.userId}`;
    const nodes: LearningNode[] = [];
    const edges: LearningEdge[] = [];

    // Create nodes based on skill gaps
    let nodeId = 0;
    for (const gap of profile.skillGaps) {
      nodes.push({
        id: `node-${nodeId}`,
        type: 'content',
        content: { skill: gap.skill, targetScore: 80 },
        estimatedTime: 30,
        difficulty: gap.score < 50 ? 0.3 : 0.5,
        prerequisites: nodeId > 0 ? [`node-${nodeId - 1}`] : [],
        outcomes: [`Improve ${gap.skill} to 80%`],
      });
      nodeId++;
    }

    // Add edges between consecutive nodes
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        from: nodes[i].id,
        to: nodes[i + 1].id,
        weight: 1,
      });
    }

    // Calculate difficulty progression
    const difficultyProgression = nodes.map(n => n.difficulty);

    // Generate alternative paths
    const alternativePaths = this.generateAlternativePaths(nodes);

    const path: PersonalizedPath = {
      pathId,
      userId: profile.userId,
      startPoint: nodes[0] || this.createDefaultNode(),
      targetOutcome: profile.careerGoals[0] || 'Complete learning objectives',
      nodes,
      edges,
      estimatedDuration: nodes.reduce((sum, n) => sum + n.estimatedTime, 0),
      difficultyProgression,
      alternativePaths,
    };

    await this.storeLearningPath(path);

    return path;
  }

  private createDefaultNode(): LearningNode {
    return {
      id: 'node-default',
      type: 'content',
      content: { welcome: true },
      estimatedTime: 5,
      difficulty: 0.1,
      prerequisites: [],
      outcomes: ['Get started with learning'],
    };
  }

  private generateAlternativePaths(nodes: LearningNode[]): AlternativePath[] {
    if (nodes.length < 3) return [];

    return [{
      reason: 'Skip prerequisites if already familiar',
      nodes: nodes.slice(1).map(n => n.id),
      benefit: 'Faster completion for experienced learners',
    }];
  }

  // ============================================================================
  // APPLY PERSONALIZATION
  // ============================================================================

  async applyPersonalization(context: PersonalizationContext): Promise<PersonalizationResult> {
    this.logger?.info?.('[PersonalizationEngine] Applying personalization');

    const recommendations: ContentRecommendation[] = [];
    const adaptations: ContentAdaptation[] = [];
    const learningPath: LearningNode[] = [];
    const insights: PersonalizationInsight[] = [];

    // Generate content recommendations based on learning goals
    for (const goal of context.learningGoals) {
      recommendations.push({
        type: 'add',
        bloomsLevel: 'APPLY', // Default to application level for goal-based content
        description: `Add content aligned with learning goal: ${goal}`,
        impact: 'high',
      });
    }

    // Add time-based adaptations
    if (context.timeConstraints?.available) {
      adaptations.push({
        type: 'text',
        content: { timeOptimized: true },
        reason: `Optimized for ${context.timeConstraints.available} minutes`,
        expectedImpact: 0.7,
      });
    }

    // Generate insights
    insights.push({
      type: 'learning_pattern',
      description: 'Personalization applied based on your learning history',
      actionable: true,
      priority: 'medium',
    });

    const result: PersonalizationResult = {
      recommendations,
      adaptations,
      learningPath,
      insights,
      confidence: 0.75,
    };

    await this.storePersonalizationResult(context.userId, result);

    return result;
  }

  // ============================================================================
  // STORAGE HELPERS (In-memory cache only - no database persistence)
  // ============================================================================

  private async storeLearningStyleProfile(userId: string, profile: LearningStyleProfile): Promise<void> {
    // Learning style profiles are cached in memory (this.learningStyleCache)
    // No database persistence - the cache is sufficient for session-level personalization
    this.logger?.debug?.(
      '[PersonalizationEngine] Learning style profile cached for user:',
      userId,
      profile.primaryStyle
    );
  }

  private async storeEmotionalState(userId: string, state: EmotionalState): Promise<void> {
    // Emotional states are cached in memory (this.emotionalStateCache)
    // No database persistence - emotional state is highly temporal
    this.logger?.debug?.(
      '[PersonalizationEngine] Emotional state cached for user:',
      userId,
      state.currentEmotion
    );
  }

  private async storeMotivationProfile(userId: string, profile: MotivationProfile): Promise<void> {
    // Motivation profiles are computed on-demand from learning history
    // No database persistence needed - can be recomputed
    this.logger?.debug?.(
      '[PersonalizationEngine] Motivation profile computed for user:',
      userId,
      `level: ${profile.currentLevel}`
    );
  }

  private async storeLearningPath(path: PersonalizedPath): Promise<void> {
    // Learning paths are generated dynamically based on current student profile
    // No database persistence - paths adapt to changing needs
    this.logger?.debug?.(
      '[PersonalizationEngine] Learning path generated:',
      path.pathId,
      `${path.nodes.length} nodes`
    );
  }

  private async storePersonalizationResult(userId: string, result: PersonalizationResult): Promise<void> {
    // Personalization results are applied immediately
    // No database persistence - results are contextual
    this.logger?.debug?.(
      '[PersonalizationEngine] Personalization applied for user:',
      userId,
      `${result.recommendations.length} recommendations`
    );
  }

  // ============================================================================
  // UTILITY HELPERS
  // ============================================================================

  private parseAIResponse(response: unknown): Record<string, string[]> {
    try {
      if (typeof response === 'string') {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      if (typeof response === 'object' && response !== null) {
        return response as Record<string, string[]>;
      }
    } catch {
      // Ignore parse errors
    }
    return {};
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPersonalizationEngine(config: PersonalizationEngineConfig): PersonalizationEngine {
  return new PersonalizationEngine(config);
}
