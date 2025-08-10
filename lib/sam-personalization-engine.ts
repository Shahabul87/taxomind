import { db } from "@/lib/db";
import { openai } from "@/lib/openai";
import { anthropic } from "@/lib/anthropic";
import { logger } from '@/lib/logger';

// Types for Advanced Personalization Engine
export interface LearningBehavior {
  userId: string;
  sessionPatterns: SessionPattern[];
  contentInteractions: ContentInteraction[];
  assessmentHistory: AssessmentRecord[];
  timePreferences: TimePreference[];
  deviceUsage: DeviceUsage[];
}

export interface SessionPattern {
  startTime: Date;
  endTime: Date;
  duration: number;
  activeDuration: number;
  contentViewed: number;
  assessmentsTaken: number;
  notesCreated: number;
  focusScore: number;
}

export interface ContentInteraction {
  contentId: string;
  contentType: string;
  interactionType: string;
  timestamp: Date;
  duration: number;
  completionRate: number;
  repeatViews: number;
  engagementScore: number;
}

export interface AssessmentRecord {
  assessmentId: string;
  score: number;
  timeSpent: number;
  attempts: number;
  mistakePatterns: string[];
  strengthAreas: string[];
}

export interface TimePreference {
  dayOfWeek: number;
  hourOfDay: number;
  productivity: number;
  preferenceStrength: number;
}

export interface DeviceUsage {
  deviceType: string;
  usagePercentage: number;
  averageSessionDuration: number;
  preferredForType: string[];
}

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing' | 'mixed';

export interface LearningStyleProfile {
  primaryStyle: LearningStyle;
  secondaryStyle?: LearningStyle;
  styleStrengths: Record<LearningStyle, number>;
  evidenceFactors: string[];
  confidence: number;
}

export interface OptimizedContent {
  originalContent: any;
  adaptations: ContentAdaptation[];
  presentationOrder: string[];
  emphasizedElements: string[];
  simplifiedConcepts: string[];
  additionalExplanations: string[];
}

export interface ContentAdaptation {
  type: 'visual' | 'audio' | 'interactive' | 'text' | 'example';
  content: any;
  reason: string;
  expectedImpact: number;
}

export interface EmotionalState {
  currentEmotion: 'motivated' | 'frustrated' | 'confused' | 'confident' | 'anxious' | 'neutral';
  confidence: number;
  indicators: EmotionIndicator[];
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

export interface EmotionIndicator {
  type: string;
  value: any;
  weight: number;
  timestamp: Date;
}

export interface MotivationProfile {
  intrinsicFactors: MotivationFactor[];
  extrinsicFactors: MotivationFactor[];
  currentLevel: number;
  triggers: string[];
  barriers: string[];
  sustainabilityScore: number;
}

export interface MotivationFactor {
  factor: string;
  strength: number;
  type: 'positive' | 'negative';
  evidence: string[];
}

export interface PersonalizedPath {
  pathId: string;
  userId: string;
  startPoint: LearningNode;
  targetOutcome: string;
  nodes: LearningNode[];
  edges: LearningEdge[];
  estimatedDuration: number;
  difficultyProgression: number[];
  alternativePaths: AlternativePath[];
}

export interface LearningNode {
  id: string;
  type: 'content' | 'assessment' | 'project' | 'review' | 'break';
  content: any;
  estimatedTime: number;
  difficulty: number;
  prerequisites: string[];
  outcomes: string[];
}

export interface LearningEdge {
  from: string;
  to: string;
  condition?: string;
  weight: number;
}

export interface AlternativePath {
  reason: string;
  nodes: string[];
  benefit: string;
  tradeoff: string;
}

export interface PersonalizationContext {
  userId: string;
  currentContent?: any;
  learningGoals?: string[];
  timeConstraints?: TimeConstraint[];
  preferenceOverrides?: Record<string, any>;
}

export interface TimeConstraint {
  type: 'daily' | 'weekly' | 'deadline';
  value: number;
  unit: string;
  flexibility: number;
}

export interface PersonalizationResult {
  recommendations: Recommendation[];
  adaptations: any[];
  insights: Insight[];
  confidence: number;
}

export interface Recommendation {
  type: string;
  content: any;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  expectedImpact: string;
  implementation: string;
}

export interface Insight {
  category: string;
  finding: string;
  evidence: string[];
  actionable: boolean;
  suggestion?: string;
}

export class SAMPersonalizationEngine {
  private static instance: SAMPersonalizationEngine;
  private learningStyleCache = new Map<string, LearningStyleProfile>();
  private emotionalStateCache = new Map<string, EmotionalState>();
  
  static getInstance(): SAMPersonalizationEngine {
    if (!this.instance) {
      this.instance = new SAMPersonalizationEngine();
    }
    return this.instance;
  }

  // Detect Learning Style
  async detectLearningStyle(behavior: LearningBehavior): Promise<LearningStyleProfile> {
    try {
      // Check cache
      if (this.learningStyleCache.has(behavior.userId)) {
        const cached = this.learningStyleCache.get(behavior.userId)!;
        if (this.isCacheValid(cached)) {
          return cached;
        }
      }

      // Analyze content interactions
      const interactionAnalysis = this.analyzeInteractionPatterns(behavior.contentInteractions);
      
      // Analyze assessment performance
      const assessmentAnalysis = this.analyzeAssessmentPatterns(behavior.assessmentHistory);
      
      // Analyze session behavior
      const sessionAnalysis = this.analyzeSessionPatterns(behavior.sessionPatterns);
      
      // Combine analyses to determine learning style
      const styleStrengths = this.calculateStyleStrengths(
        interactionAnalysis,
        assessmentAnalysis,
        sessionAnalysis
      );
      
      // Determine primary and secondary styles
      const sortedStyles = Object.entries(styleStrengths)
        .sort(([, a], [, b]) => b - a);
      
      const primaryStyle = sortedStyles[0][0] as LearningStyle;
      const secondaryStyle = sortedStyles[1][1] > 0.3 ? sortedStyles[1][0] as LearningStyle : undefined;
      
      // Calculate confidence
      const confidence = this.calculateStyleConfidence(styleStrengths, behavior);
      
      const profile: LearningStyleProfile = {
        primaryStyle,
        secondaryStyle,
        styleStrengths: styleStrengths as Record<LearningStyle, number>,
        evidenceFactors: this.gatherEvidenceFactors(interactionAnalysis, assessmentAnalysis),
        confidence
      };
      
      // Cache the profile
      this.learningStyleCache.set(behavior.userId, profile);
      
      // Store in database
      await this.storeLearningStyleProfile(behavior.userId, profile);
      
      return profile;
    } catch (error) {
      logger.error('Error detecting learning style:', error);
      throw new Error('Failed to detect learning style');
    }
  }

  // Optimize Cognitive Load
  async optimizeCognitiveLoad(
    content: any,
    student: Student
  ): Promise<OptimizedContent> {
    try {
      // Assess current cognitive load
      const currentLoad = await this.assessCognitiveLoad(content);
      
      // Get student's cognitive capacity
      const capacity = await this.getStudentCognitiveCapacity(student);
      
      // Determine necessary adaptations
      const adaptations: ContentAdaptation[] = [];
      
      if (currentLoad > capacity.maximum) {
        // Content is too complex - simplify
        adaptations.push(...await this.simplifyContent(content, capacity));
      } else if (currentLoad < capacity.optimal * 0.7) {
        // Content is too simple - enrich
        adaptations.push(...await this.enrichContent(content, capacity));
      }
      
      // Optimize presentation order
      const presentationOrder = this.optimizePresentationOrder(content, student);
      
      // Identify elements to emphasize
      const emphasizedElements = await this.identifyKeyElements(content, student);
      
      // Simplify complex concepts
      const simplifiedConcepts = await this.simplifyComplexConcepts(content, capacity);
      
      // Generate additional explanations
      const additionalExplanations = await this.generateExplanations(content, student);
      
      const optimizedContent: OptimizedContent = {
        originalContent: content,
        adaptations,
        presentationOrder,
        emphasizedElements,
        simplifiedConcepts,
        additionalExplanations
      };
      
      // Store optimization
      await this.storeContentOptimization(student.id, content.id, optimizedContent);
      
      return optimizedContent;
    } catch (error) {
      logger.error('Error optimizing cognitive load:', error);
      throw new Error('Failed to optimize cognitive load');
    }
  }

  // Recognize Emotional State
  async recognizeEmotionalState(interactions: Interaction[]): Promise<EmotionalState> {
    try {
      // Analyze recent interactions
      const recentInteractions = this.filterRecentInteractions(interactions);
      
      // Extract emotion indicators
      const indicators: EmotionIndicator[] = [];
      
      // Response time patterns
      const responseTimeIndicator = this.analyzeResponseTimes(recentInteractions);
      indicators.push(responseTimeIndicator);
      
      // Error patterns
      const errorPatternIndicator = this.analyzeErrorPatterns(recentInteractions);
      indicators.push(errorPatternIndicator);
      
      // Help-seeking behavior
      const helpSeekingIndicator = this.analyzeHelpSeeking(recentInteractions);
      indicators.push(helpSeekingIndicator);
      
      // Progress velocity
      const progressIndicator = this.analyzeProgressVelocity(recentInteractions);
      indicators.push(progressIndicator);
      
      // Session duration changes
      const sessionIndicator = this.analyzeSessionChanges(recentInteractions);
      indicators.push(sessionIndicator);
      
      // Determine current emotion
      const currentEmotion = await this.inferEmotion(indicators);
      
      // Calculate confidence
      const confidence = this.calculateEmotionConfidence(indicators);
      
      // Analyze trend
      const trend = this.analyzeEmotionalTrend(interactions);
      
      // Generate recommendations
      const recommendations = await this.generateEmotionalRecommendations(currentEmotion, indicators);
      
      const emotionalState: EmotionalState = {
        currentEmotion,
        confidence,
        indicators,
        trend,
        recommendations
      };
      
      // Cache emotional state
      this.emotionalStateCache.set(interactions[0].userId, emotionalState);
      
      // Store analysis
      await this.storeEmotionalStateAnalysis(interactions[0].userId, emotionalState);
      
      return emotionalState;
    } catch (error) {
      logger.error('Error recognizing emotional state:', error);
      throw new Error('Failed to recognize emotional state');
    }
  }

  // Analyze Motivation Patterns
  async analyzeMotivationPatterns(history: LearningHistory): Promise<MotivationProfile> {
    try {
      // Identify intrinsic motivation factors
      const intrinsicFactors = await this.identifyIntrinsicFactors(history);
      
      // Identify extrinsic motivation factors
      const extrinsicFactors = await this.identifyExtrinsicFactors(history);
      
      // Calculate current motivation level
      const currentLevel = this.calculateMotivationLevel(intrinsicFactors, extrinsicFactors);
      
      // Identify motivation triggers
      const triggers = await this.identifyMotivationTriggers(history);
      
      // Identify motivation barriers
      const barriers = await this.identifyMotivationBarriers(history);
      
      // Calculate sustainability score
      const sustainabilityScore = this.calculateSustainabilityScore(
        intrinsicFactors,
        extrinsicFactors,
        history
      );
      
      const profile: MotivationProfile = {
        intrinsicFactors,
        extrinsicFactors,
        currentLevel,
        triggers,
        barriers,
        sustainabilityScore
      };
      
      // Store motivation profile
      await this.storeMotivationProfile(history.userId, profile);
      
      return profile;
    } catch (error) {
      logger.error('Error analyzing motivation patterns:', error);
      throw new Error('Failed to analyze motivation patterns');
    }
  }

  // Generate Personalized Learning Path
  async generatePersonalizedPath(profile: StudentProfile): Promise<PersonalizedPath> {
    try {
      // Define learning objectives
      const objectives = await this.defineLearningObjectives(profile);
      
      // Create learning nodes
      const nodes = await this.createLearningNodes(objectives, profile);
      
      // Determine optimal sequencing
      const edges = this.createLearningEdges(nodes, profile);
      
      // Calculate difficulty progression
      const difficultyProgression = this.calculateDifficultyProgression(nodes, profile);
      
      // Estimate total duration
      const estimatedDuration = this.estimatePathDuration(nodes, profile);
      
      // Generate alternative paths
      const alternativePaths = await this.generateAlternativePaths(nodes, profile);
      
      const path: PersonalizedPath = {
        pathId: `path-${Date.now()}`,
        userId: profile.userId,
        startPoint: nodes[0],
        targetOutcome: objectives[objectives.length - 1],
        nodes,
        edges,
        estimatedDuration,
        difficultyProgression,
        alternativePaths
      };
      
      // Validate path
      const isValid = await this.validateLearningPath(path);
      if (!isValid) {
        throw new Error('Generated path is invalid');
      }
      
      // Store learning path
      await this.storeLearningPath(path);
      
      return path;
    } catch (error) {
      logger.error('Error generating personalized path:', error);
      throw new Error('Failed to generate personalized path');
    }
  }

  // Apply Personalization
  async applyPersonalization(context: PersonalizationContext): Promise<PersonalizationResult> {
    try {
      // Get user's complete profile
      const userProfile = await this.getUserCompleteProfile(context.userId);
      
      // Generate content recommendations
      const contentRecommendations = await this.generateContentRecommendations(
        userProfile,
        context
      );
      
      // Generate learning adaptations
      const adaptations = await this.generateAdaptations(userProfile, context);
      
      // Extract insights
      const insights = await this.extractPersonalizationInsights(userProfile, context);
      
      // Calculate overall confidence
      const confidence = this.calculatePersonalizationConfidence(
        userProfile,
        contentRecommendations,
        adaptations
      );
      
      const result: PersonalizationResult = {
        recommendations: contentRecommendations,
        adaptations,
        insights,
        confidence
      };
      
      // Store personalization result
      await this.storePersonalizationResult(context.userId, result);
      
      return result;
    } catch (error) {
      logger.error('Error applying personalization:', error);
      throw new Error('Failed to apply personalization');
    }
  }

  // Helper Methods
  private analyzeInteractionPatterns(interactions: ContentInteraction[]) {
    const patterns = {
      videoPreference: 0,
      textPreference: 0,
      interactivePreference: 0,
      audioPreference: 0,
      visualPreference: 0
    };
    
    interactions.forEach(interaction => {
      const weight = interaction.engagementScore * interaction.completionRate;
      
      switch (interaction.contentType.toLowerCase()) {
        case 'video':
          patterns.videoPreference += weight;
          patterns.visualPreference += weight * 0.8;
          patterns.audioPreference += weight * 0.5;
          break;
        case 'article':
        case 'document':
          patterns.textPreference += weight;
          break;
        case 'interactive':
        case 'simulation':
          patterns.interactivePreference += weight;
          patterns.visualPreference += weight * 0.6;
          break;
        case 'podcast':
        case 'audio':
          patterns.audioPreference += weight;
          break;
        case 'infographic':
        case 'diagram':
          patterns.visualPreference += weight;
          break;
      }
    });
    
    return patterns;
  }

  private analyzeAssessmentPatterns(assessments: AssessmentRecord[]) {
    const patterns = {
      performanceByType: new Map<string, number>(),
      mistakePatterns: new Map<string, number>(),
      strengthAreas: new Map<string, number>()
    };
    
    assessments.forEach(assessment => {
      // Aggregate performance by question types
      assessment.mistakePatterns.forEach(pattern => {
        patterns.mistakePatterns.set(
          pattern,
          (patterns.mistakePatterns.get(pattern) || 0) + 1
        );
      });
      
      assessment.strengthAreas.forEach(strength => {
        patterns.strengthAreas.set(
          strength,
          (patterns.strengthAreas.get(strength) || 0) + 1
        );
      });
    });
    
    return patterns;
  }

  private analyzeSessionPatterns(sessions: SessionPattern[]) {
    const patterns = {
      averageDuration: 0,
      focusConsistency: 0,
      optimalTimeOfDay: new Map<number, number>(),
      engagementByDuration: new Map<string, number>()
    };
    
    if (sessions.length === 0) return patterns;
    
    // Calculate averages
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    patterns.averageDuration = totalDuration / sessions.length;
    
    const totalFocus = sessions.reduce((sum, s) => sum + s.focusScore, 0);
    patterns.focusConsistency = totalFocus / sessions.length;
    
    // Analyze time preferences
    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      const score = session.focusScore * (session.activeDuration / session.duration);
      patterns.optimalTimeOfDay.set(
        hour,
        (patterns.optimalTimeOfDay.get(hour) || 0) + score
      );
    });
    
    return patterns;
  }

  private calculateStyleStrengths(
    interactionAnalysis: any,
    assessmentAnalysis: any,
    sessionAnalysis: any
  ): Record<string, number> {
    const strengths = {
      visual: 0,
      auditory: 0,
      kinesthetic: 0,
      'reading-writing': 0,
      mixed: 0
    };
    
    // Weight interaction preferences
    const totalInteractions = Object.values(interactionAnalysis).reduce(
      (sum: number, val: any) => sum + val,
      0
    ) as number;
    
    if (totalInteractions > 0) {
      strengths.visual += (interactionAnalysis.visualPreference + interactionAnalysis.videoPreference) / totalInteractions * 0.4;
      strengths.auditory += interactionAnalysis.audioPreference / totalInteractions * 0.4;
      strengths.kinesthetic += interactionAnalysis.interactivePreference / totalInteractions * 0.4;
      strengths['reading-writing'] += interactionAnalysis.textPreference / totalInteractions * 0.4;
    }
    
    // Consider session patterns
    if (sessionAnalysis.focusConsistency > 0.7) {
      // High focus consistency suggests good match with current content mix
      strengths.mixed += 0.2;
    }
    
    // Normalize strengths
    const total = Object.values(strengths).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      Object.keys(strengths).forEach(key => {
        strengths[key] = strengths[key] / total;
      });
    }
    
    return strengths;
  }

  private calculateStyleConfidence(
    styleStrengths: Record<string, number>,
    behavior: LearningBehavior
  ): number {
    // Base confidence on data quantity and consistency
    let confidence = 0;
    
    // Data quantity factor
    const interactionCount = behavior.contentInteractions.length;
    const sessionCount = behavior.sessionPatterns.length;
    const assessmentCount = behavior.assessmentHistory.length;
    
    const dataQuantityScore = Math.min(1, (interactionCount + sessionCount + assessmentCount) / 100);
    confidence += dataQuantityScore * 0.3;
    
    // Style clarity factor (how dominant is the primary style)
    const sortedStrengths = Object.values(styleStrengths).sort((a, b) => b - a);
    const clarityScore = sortedStrengths[0] - sortedStrengths[1];
    confidence += clarityScore * 0.4;
    
    // Consistency factor
    const consistencyScore = this.calculateBehaviorConsistency(behavior);
    confidence += consistencyScore * 0.3;
    
    return Math.min(1, confidence);
  }

  private calculateBehaviorConsistency(behavior: LearningBehavior): number {
    // Calculate consistency across different metrics
    if (behavior.sessionPatterns.length < 5) return 0.5;
    
    const focusScores = behavior.sessionPatterns.map(s => s.focusScore);
    const mean = focusScores.reduce((sum, score) => sum + score, 0) / focusScores.length;
    const variance = focusScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / focusScores.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation means higher consistency
    return Math.max(0, 1 - stdDev);
  }

  private gatherEvidenceFactors(
    interactionAnalysis: any,
    assessmentAnalysis: any
  ): string[] {
    const factors: string[] = [];
    
    // Add evidence based on strong preferences
    if (interactionAnalysis.videoPreference > interactionAnalysis.textPreference * 1.5) {
      factors.push('Strong preference for video content');
    }
    
    if (interactionAnalysis.interactivePreference > 0.3) {
      factors.push('High engagement with interactive elements');
    }
    
    if (assessmentAnalysis.strengthAreas.has('visual-problems')) {
      factors.push('Better performance on visual-based assessments');
    }
    
    return factors;
  }

  private async assessCognitiveLoad(content: any): Promise<number> {
    // Assess cognitive load of content
    let load = 0;
    
    // Complexity factors
    const wordCount = content.text?.split(' ').length || 0;
    load += Math.min(0.3, wordCount / 1000 * 0.3);
    
    // Concept density
    const concepts = content.concepts?.length || 0;
    load += Math.min(0.3, concepts / 10 * 0.3);
    
    // Multimedia elements
    const mediaElements = (content.videos?.length || 0) + (content.images?.length || 0);
    load += Math.min(0.2, mediaElements / 5 * 0.2);
    
    // Interactivity requirements
    const interactions = content.interactions?.length || 0;
    load += Math.min(0.2, interactions / 3 * 0.2);
    
    return load;
  }

  private async getStudentCognitiveCapacity(student: Student): Promise<any> {
    // Get student's cognitive capacity based on historical performance
    const recentPerformance = await db.user_progress.findMany({
      where: { userId: student.id },
      orderBy: { lastAccessedAt: 'desc' },
      take: 20
    });
    
    const avgScore = recentPerformance.reduce((sum, p) => sum + (p.quizScore || 0), 0) / 
                     recentPerformance.length;
    
    return {
      maximum: 0.8 + (avgScore / 100) * 0.2, // 0.8 to 1.0 based on performance
      optimal: 0.6 + (avgScore / 100) * 0.15, // 0.6 to 0.75
      minimum: 0.3
    };
  }

  private async simplifyContent(content: any, capacity: any): Promise<ContentAdaptation[]> {
    const adaptations: ContentAdaptation[] = [];
    
    // Break down complex concepts
    if (content.concepts?.length > 3) {
      adaptations.push({
        type: 'text',
        content: 'Concepts will be introduced one at a time with examples',
        reason: 'Reducing cognitive load by spacing concepts',
        expectedImpact: 0.3
      });
    }
    
    // Add visual aids
    adaptations.push({
      type: 'visual',
      content: 'Infographic summarizing key points',
      reason: 'Visual representation aids understanding',
      expectedImpact: 0.25
    });
    
    // Include practice breaks
    adaptations.push({
      type: 'interactive',
      content: 'Quick practice quiz after each section',
      reason: 'Reinforcement reduces cognitive strain',
      expectedImpact: 0.2
    });
    
    return adaptations;
  }

  private async enrichContent(content: any, capacity: any): Promise<ContentAdaptation[]> {
    const adaptations: ContentAdaptation[] = [];
    
    // Add challenging elements
    adaptations.push({
      type: 'interactive',
      content: 'Advanced problem-solving scenarios',
      reason: 'Increase engagement with appropriate challenge',
      expectedImpact: 0.3
    });
    
    // Include deeper analysis
    adaptations.push({
      type: 'text',
      content: 'Additional context and real-world applications',
      reason: 'Deepen understanding with practical examples',
      expectedImpact: 0.25
    });
    
    return adaptations;
  }

  private optimizePresentationOrder(content: any, student: Student): string[] {
    // Optimize based on student's learning style
    const order: string[] = [];
    
    // Start with overview
    order.push('overview');
    
    // Add content based on complexity
    if (content.sections) {
      const sortedSections = [...content.sections].sort((a, b) => 
        (a.complexity || 0) - (b.complexity || 0)
      );
      
      sortedSections.forEach(section => {
        order.push(section.id);
      });
    }
    
    // End with summary
    order.push('summary');
    
    return order;
  }

  private async identifyKeyElements(content: any, student: Student): Promise<string[]> {
    // Identify elements to emphasize based on student profile
    const keyElements: string[] = [];
    
    // Core concepts
    if (content.concepts) {
      keyElements.push(...content.concepts.slice(0, 3).map((c: any) => c.id));
    }
    
    // Learning objectives
    if (content.objectives) {
      keyElements.push(...content.objectives.map((o: any) => o.id));
    }
    
    return keyElements;
  }

  private async simplifyComplexConcepts(content: any, capacity: any): Promise<string[]> {
    const simplified: string[] = [];
    
    if (content.concepts) {
      content.concepts.forEach((concept: any) => {
        if (concept.complexity > capacity.optimal) {
          simplified.push(`${concept.name}: Broken into smaller sub-concepts with examples`);
        }
      });
    }
    
    return simplified;
  }

  private async generateExplanations(content: any, student: Student): Promise<string[]> {
    const explanations: string[] = [];
    
    // Generate explanations for difficult concepts
    const prompt = `
      Generate simple explanations for these concepts:
      ${content.concepts?.map((c: any) => c.name).join(', ')}
      
      Student level: ${student.level || 'intermediate'}
      Make explanations clear and concise.
    `;
    
    try {
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 500,
        temperature: 0.7,
        messages: [{
          role: "user",
          content: prompt
        }]
      });
      
      explanations.push(response.content[0].text || '');
    } catch (error) {
      explanations.push('Additional explanations will be provided during the lesson');
    }
    
    return explanations;
  }

  private filterRecentInteractions(interactions: Interaction[]): Interaction[] {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24); // Last 24 hours
    
    return interactions.filter(i => i.timestamp > cutoffTime);
  }

  private analyzeResponseTimes(interactions: Interaction[]): EmotionIndicator {
    const responseTimes = interactions
      .filter(i => i.responseTime !== undefined)
      .map(i => i.responseTime!);
    
    if (responseTimes.length === 0) {
      return {
        type: 'response-time',
        value: 'normal',
        weight: 0.1,
        timestamp: new Date()
      };
    }
    
    const avgResponseTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
    const recentAvg = responseTimes.slice(-5).reduce((sum, t) => sum + t, 0) / 
                      Math.min(5, responseTimes.length);
    
    let value = 'normal';
    let weight = 0.2;
    
    if (recentAvg > avgResponseTime * 1.5) {
      value = 'slow';
      weight = 0.3;
    } else if (recentAvg < avgResponseTime * 0.5) {
      value = 'fast';
      weight = 0.25;
    }
    
    return {
      type: 'response-time',
      value,
      weight,
      timestamp: new Date()
    };
  }

  private analyzeErrorPatterns(interactions: Interaction[]): EmotionIndicator {
    const errors = interactions.filter(i => i.isError);
    const errorRate = errors.length / Math.max(1, interactions.length);
    
    let value = 'normal';
    let weight = 0.3;
    
    if (errorRate > 0.4) {
      value = 'high-errors';
      weight = 0.4;
    } else if (errorRate < 0.1) {
      value = 'low-errors';
      weight = 0.2;
    }
    
    return {
      type: 'error-pattern',
      value,
      weight,
      timestamp: new Date()
    };
  }

  private analyzeHelpSeeking(interactions: Interaction[]): EmotionIndicator {
    const helpRequests = interactions.filter(i => 
      i.type === 'help-request' || i.type === 'hint-used'
    );
    
    const helpRate = helpRequests.length / Math.max(1, interactions.length);
    
    let value = 'normal';
    let weight = 0.25;
    
    if (helpRate > 0.3) {
      value = 'frequent-help';
      weight = 0.35;
    } else if (helpRate === 0 && interactions.length > 10) {
      value = 'no-help';
      weight = 0.2;
    }
    
    return {
      type: 'help-seeking',
      value,
      weight,
      timestamp: new Date()
    };
  }

  private analyzeProgressVelocity(interactions: Interaction[]): EmotionIndicator {
    // Analyze completion rate over time
    const completions = interactions.filter(i => i.type === 'completion');
    const timeSpan = interactions.length > 0 ? 
      (interactions[0].timestamp.getTime() - interactions[interactions.length - 1].timestamp.getTime()) / 
      (1000 * 60 * 60) : 1; // Hours
    
    const completionRate = completions.length / Math.max(1, timeSpan);
    
    let value = 'normal';
    let weight = 0.25;
    
    if (completionRate < 0.5) {
      value = 'slow-progress';
      weight = 0.3;
    } else if (completionRate > 2) {
      value = 'fast-progress';
      weight = 0.2;
    }
    
    return {
      type: 'progress-velocity',
      value,
      weight,
      timestamp: new Date()
    };
  }

  private analyzeSessionChanges(interactions: Interaction[]): EmotionIndicator {
    // Group interactions by session
    const sessions = this.groupInteractionsBySessions(interactions);
    
    if (sessions.length < 2) {
      return {
        type: 'session-pattern',
        value: 'insufficient-data',
        weight: 0.1,
        timestamp: new Date()
      };
    }
    
    const recentDuration = sessions[sessions.length - 1].duration;
    const avgDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
    
    let value = 'normal';
    let weight = 0.2;
    
    if (recentDuration < avgDuration * 0.5) {
      value = 'shortened-sessions';
      weight = 0.3;
    } else if (recentDuration > avgDuration * 1.5) {
      value = 'extended-sessions';
      weight = 0.25;
    }
    
    return {
      type: 'session-pattern',
      value,
      weight,
      timestamp: new Date()
    };
  }

  private groupInteractionsBySessions(interactions: Interaction[]): any[] {
    const sessions: any[] = [];
    let currentSession: any = null;
    
    interactions.forEach(interaction => {
      if (!currentSession || 
          interaction.timestamp.getTime() - currentSession.endTime > 30 * 60 * 1000) {
        // New session (30+ minute gap)
        if (currentSession) {
          sessions.push(currentSession);
        }
        currentSession = {
          startTime: interaction.timestamp.getTime(),
          endTime: interaction.timestamp.getTime(),
          interactions: [interaction]
        };
      } else {
        currentSession.endTime = interaction.timestamp.getTime();
        currentSession.interactions.push(interaction);
      }
    });
    
    if (currentSession) {
      sessions.push(currentSession);
    }
    
    return sessions.map(s => ({
      ...s,
      duration: (s.endTime - s.startTime) / (1000 * 60) // Minutes
    }));
  }

  private async inferEmotion(
    indicators: EmotionIndicator[]
  ): Promise<EmotionalState['currentEmotion']> {
    // Weight indicators to determine emotion
    const emotionScores = {
      motivated: 0,
      frustrated: 0,
      confused: 0,
      confident: 0,
      anxious: 0,
      neutral: 0
    };
    
    indicators.forEach(indicator => {
      const weight = indicator.weight;
      
      switch (indicator.type) {
        case 'response-time':
          if (indicator.value === 'slow') {
            emotionScores.confused += weight * 0.6;
            emotionScores.frustrated += weight * 0.4;
          } else if (indicator.value === 'fast') {
            emotionScores.confident += weight * 0.7;
            emotionScores.motivated += weight * 0.3;
          }
          break;
          
        case 'error-pattern':
          if (indicator.value === 'high-errors') {
            emotionScores.frustrated += weight * 0.7;
            emotionScores.anxious += weight * 0.3;
          } else if (indicator.value === 'low-errors') {
            emotionScores.confident += weight * 0.8;
          }
          break;
          
        case 'help-seeking':
          if (indicator.value === 'frequent-help') {
            emotionScores.confused += weight * 0.6;
            emotionScores.anxious += weight * 0.4;
          }
          break;
          
        case 'progress-velocity':
          if (indicator.value === 'slow-progress') {
            emotionScores.frustrated += weight * 0.5;
            emotionScores.anxious += weight * 0.5;
          } else if (indicator.value === 'fast-progress') {
            emotionScores.motivated += weight * 0.8;
            emotionScores.confident += weight * 0.2;
          }
          break;
          
        case 'session-pattern':
          if (indicator.value === 'shortened-sessions') {
            emotionScores.frustrated += weight * 0.6;
            emotionScores.anxious += weight * 0.4;
          } else if (indicator.value === 'extended-sessions') {
            emotionScores.motivated += weight * 0.7;
          }
          break;
      }
    });
    
    // Add neutral baseline
    emotionScores.neutral = 0.2;
    
    // Find dominant emotion
    const sortedEmotions = Object.entries(emotionScores)
      .sort(([, a], [, b]) => b - a);
    
    return sortedEmotions[0][0] as EmotionalState['currentEmotion'];
  }

  private calculateEmotionConfidence(indicators: EmotionIndicator[]): number {
    // Higher weights and more consistent indicators increase confidence
    const totalWeight = indicators.reduce((sum, i) => sum + i.weight, 0);
    const avgWeight = totalWeight / indicators.length;
    
    // Check consistency
    const values = indicators.map(i => i.value);
    const uniqueValues = new Set(values).size;
    const consistencyScore = 1 - (uniqueValues / values.length);
    
    return Math.min(1, avgWeight + consistencyScore * 0.3);
  }

  private analyzeEmotionalTrend(interactions: Interaction[]): 'improving' | 'stable' | 'declining' {
    // Analyze emotional indicators over time
    const timeWindows = this.createTimeWindows(interactions, 4); // 4 time windows
    
    if (timeWindows.length < 2) return 'stable';
    
    const windowScores = timeWindows.map(window => {
      const errors = window.filter(i => i.isError).length / window.length;
      const helps = window.filter(i => i.type === 'help-request').length / window.length;
      return 1 - (errors * 0.6 + helps * 0.4); // Higher score is better
    });
    
    const trend = this.calculateTrend(windowScores);
    
    if (trend > 0.1) return 'improving';
    if (trend < -0.1) return 'declining';
    return 'stable';
  }

  private createTimeWindows(interactions: Interaction[], count: number): Interaction[][] {
    const windows: Interaction[][] = [];
    const windowSize = Math.ceil(interactions.length / count);
    
    for (let i = 0; i < interactions.length; i += windowSize) {
      windows.push(interactions.slice(i, i + windowSize));
    }
    
    return windows;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    // Simple linear regression
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = values.reduce((sum, y, i) => sum + i * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private async generateEmotionalRecommendations(
    emotion: EmotionalState['currentEmotion'],
    indicators: EmotionIndicator[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    switch (emotion) {
      case 'frustrated':
        recommendations.push('Take a short break to reset focus');
        recommendations.push('Review previous successful completions for confidence');
        recommendations.push('Try easier practice problems before continuing');
        break;
        
      case 'confused':
        recommendations.push('Review fundamental concepts before proceeding');
        recommendations.push('Use available hints and explanations');
        recommendations.push('Consider reaching out to a tutor or peer');
        break;
        
      case 'anxious':
        recommendations.push('Practice relaxation techniques before studying');
        recommendations.push('Break down tasks into smaller, manageable steps');
        recommendations.push('Focus on progress made rather than remaining work');
        break;
        
      case 'confident':
        recommendations.push('Challenge yourself with advanced problems');
        recommendations.push('Help peers who might be struggling');
        recommendations.push('Explore related topics to deepen understanding');
        break;
        
      case 'motivated':
        recommendations.push('Maintain momentum with consistent study sessions');
        recommendations.push('Set ambitious but achievable goals');
        recommendations.push('Track your progress to stay motivated');
        break;
        
      default:
        recommendations.push('Continue with current learning approach');
        recommendations.push('Monitor your emotional state for changes');
    }
    
    return recommendations;
  }

  private async identifyIntrinsicFactors(history: any): Promise<MotivationFactor[]> {
    const factors: MotivationFactor[] = [];
    
    // Mastery orientation
    if (history.repeatAttempts?.filter((a: any) => a.improvement > 0).length > 5) {
      factors.push({
        factor: 'Mastery Orientation',
        strength: 0.8,
        type: 'positive',
        evidence: ['Multiple attempts show improvement focus', 'Persistence despite challenges']
      });
    }
    
    // Curiosity
    if (history.exploratoryActions?.length > 10) {
      factors.push({
        factor: 'Intellectual Curiosity',
        strength: 0.7,
        type: 'positive',
        evidence: ['Explores optional content', 'Asks questions beyond requirements']
      });
    }
    
    // Autonomy
    if (history.customPaths?.length > 0) {
      factors.push({
        factor: 'Autonomy Preference',
        strength: 0.6,
        type: 'positive',
        evidence: ['Creates custom learning paths', 'Self-directed learning choices']
      });
    }
    
    return factors;
  }

  private async identifyExtrinsicFactors(history: any): Promise<MotivationFactor[]> {
    const factors: MotivationFactor[] = [];
    
    // Achievement recognition
    if (history.badgesEarned?.length > 5) {
      factors.push({
        factor: 'Achievement Recognition',
        strength: 0.7,
        type: 'positive',
        evidence: ['Responds to badges and rewards', 'Completes challenges for recognition']
      });
    }
    
    // Social comparison
    if (history.leaderboardChecks?.length > 10) {
      factors.push({
        factor: 'Social Comparison',
        strength: 0.6,
        type: 'positive',
        evidence: ['Frequently checks leaderboard', 'Competitive behavior observed']
      });
    }
    
    // External pressure
    if (history.deadlineRushes?.length > 3) {
      factors.push({
        factor: 'Deadline Pressure',
        strength: 0.5,
        type: 'negative',
        evidence: ['Activity spikes near deadlines', 'Procrastination patterns']
      });
    }
    
    return factors;
  }

  private calculateMotivationLevel(
    intrinsic: MotivationFactor[],
    extrinsic: MotivationFactor[]
  ): number {
    let level = 0;
    
    // Intrinsic factors have higher weight
    intrinsic.forEach(factor => {
      if (factor.type === 'positive') {
        level += factor.strength * 0.6;
      } else {
        level -= factor.strength * 0.3;
      }
    });
    
    // Extrinsic factors have lower weight
    extrinsic.forEach(factor => {
      if (factor.type === 'positive') {
        level += factor.strength * 0.4;
      } else {
        level -= factor.strength * 0.5;
      }
    });
    
    return Math.max(0, Math.min(1, level));
  }

  private async identifyMotivationTriggers(history: any): Promise<string[]> {
    const triggers: string[] = [];
    
    if (history.activitySpikes?.some((spike: any) => spike.trigger === 'new-content')) {
      triggers.push('New content releases');
    }
    
    if (history.socialInteractions?.filter((i: any) => i.type === 'collaboration').length > 5) {
      triggers.push('Collaborative activities');
    }
    
    if (history.achievementMoments?.length > 10) {
      triggers.push('Achievement milestones');
    }
    
    if (history.feedbackResponses?.filter((f: any) => f.response === 'positive').length > 5) {
      triggers.push('Positive feedback');
    }
    
    return triggers;
  }

  private async identifyMotivationBarriers(history: any): Promise<string[]> {
    const barriers: string[] = [];
    
    if (history.abandonedSessions?.length > 5) {
      barriers.push('Technical difficulties or interruptions');
    }
    
    if (history.difficultySpikes?.filter((s: any) => s.abandoned).length > 3) {
      barriers.push('Sudden difficulty increases');
    }
    
    if (history.negativeFeedback?.length > 3) {
      barriers.push('Negative feedback experiences');
    }
    
    if (history.isolatedLearning?.duration > 30) {
      barriers.push('Lack of social interaction');
    }
    
    return barriers;
  }

  private calculateSustainabilityScore(
    intrinsic: MotivationFactor[],
    extrinsic: MotivationFactor[],
    history: any
  ): number {
    let score = 0;
    
    // Intrinsic motivation is more sustainable
    const intrinsicStrength = intrinsic
      .filter(f => f.type === 'positive')
      .reduce((sum, f) => sum + f.strength, 0);
    
    const extrinsicStrength = extrinsic
      .filter(f => f.type === 'positive')
      .reduce((sum, f) => sum + f.strength, 0);
    
    score += intrinsicStrength * 0.7;
    score += extrinsicStrength * 0.3;
    
    // Consistency factor
    if (history.consistencyScore > 0.7) {
      score += 0.2;
    }
    
    // Burnout risk reduction
    if (history.breaksTaken?.length > 10) {
      score += 0.1;
    }
    
    return Math.min(1, score);
  }

  private async defineLearningObjectives(profile: any): Promise<string[]> {
    // Define personalized learning objectives
    const objectives: string[] = [];
    
    if (profile.skillGaps?.length > 0) {
      objectives.push(...profile.skillGaps.map((gap: any) => `Master ${gap.skill}`));
    }
    
    if (profile.careerGoals?.length > 0) {
      objectives.push(...profile.careerGoals.map((goal: any) => `Prepare for ${goal}`));
    }
    
    objectives.push('Complete course with 80%+ mastery');
    
    return objectives;
  }

  private async createLearningNodes(
    objectives: string[],
    profile: any
  ): Promise<LearningNode[]> {
    const nodes: LearningNode[] = [];
    
    // Start node
    nodes.push({
      id: 'start',
      type: 'content',
      content: { title: 'Learning Path Overview', type: 'introduction' },
      estimatedTime: 10,
      difficulty: 0.2,
      prerequisites: [],
      outcomes: ['Understand learning path']
    });
    
    // Create nodes for each objective
    objectives.forEach((objective, index) => {
      // Content node
      nodes.push({
        id: `content-${index}`,
        type: 'content',
        content: { title: objective, type: 'lesson' },
        estimatedTime: 45,
        difficulty: 0.5 + index * 0.1,
        prerequisites: index > 0 ? [`content-${index - 1}`] : ['start'],
        outcomes: [objective]
      });
      
      // Practice node
      nodes.push({
        id: `practice-${index}`,
        type: 'assessment',
        content: { title: `Practice: ${objective}`, type: 'quiz' },
        estimatedTime: 20,
        difficulty: 0.5 + index * 0.1,
        prerequisites: [`content-${index}`],
        outcomes: [`Validate ${objective}`]
      });
      
      // Break node (every 2 objectives)
      if (index % 2 === 1) {
        nodes.push({
          id: `break-${index}`,
          type: 'break',
          content: { title: 'Refresh Break', type: 'break' },
          estimatedTime: 10,
          difficulty: 0,
          prerequisites: [],
          outcomes: ['Maintain focus']
        });
      }
    });
    
    // Final project
    nodes.push({
      id: 'final-project',
      type: 'project',
      content: { title: 'Capstone Project', type: 'project' },
      estimatedTime: 120,
      difficulty: 0.8,
      prerequisites: objectives.map((_, i) => `practice-${i}`),
      outcomes: ['Demonstrate mastery']
    });
    
    return nodes;
  }

  private createLearningEdges(
    nodes: LearningNode[],
    profile: any
  ): LearningEdge[] {
    const edges: LearningEdge[] = [];
    
    nodes.forEach(node => {
      if (node.prerequisites.length > 0) {
        node.prerequisites.forEach(prereq => {
          edges.push({
            from: prereq,
            to: node.id,
            weight: 1
          });
        });
      }
    });
    
    // Add alternative paths based on performance
    nodes
      .filter(n => n.type === 'assessment')
      .forEach((node, index) => {
        if (index < nodes.length - 2) {
          // Skip path if high performance
          edges.push({
            from: node.id,
            to: nodes[index + 2].id,
            condition: 'score > 90%',
            weight: 0.8
          });
        }
      });
    
    return edges;
  }

  private calculateDifficultyProgression(
    nodes: LearningNode[],
    profile: any
  ): number[] {
    return nodes
      .filter(n => n.type !== 'break')
      .map(n => n.difficulty);
  }

  private estimatePathDuration(
    nodes: LearningNode[],
    profile: any
  ): number {
    return nodes.reduce((total, node) => {
      let duration = node.estimatedTime;
      
      // Adjust based on student's pace
      if (profile.learningPace === 'slow') {
        duration *= 1.3;
      } else if (profile.learningPace === 'fast') {
        duration *= 0.8;
      }
      
      return total + duration;
    }, 0);
  }

  private async generateAlternativePaths(
    nodes: LearningNode[],
    profile: any
  ): Promise<AlternativePath[]> {
    const alternatives: AlternativePath[] = [];
    
    // Fast track
    const fastTrackNodes = nodes
      .filter(n => n.type !== 'break' && !n.id.includes('practice'))
      .map(n => n.id);
    
    alternatives.push({
      reason: 'Fast Track',
      nodes: fastTrackNodes,
      benefit: 'Complete 40% faster',
      tradeoff: 'Less practice opportunity'
    });
    
    // Thorough path
    const thoroughNodes = [...nodes.map(n => n.id)];
    nodes
      .filter(n => n.type === 'content')
      .forEach(node => {
        thoroughNodes.push(`review-${node.id}`);
      });
    
    alternatives.push({
      reason: 'Thorough Learning',
      nodes: thoroughNodes,
      benefit: 'Maximum retention',
      tradeoff: 'Takes 50% more time'
    });
    
    return alternatives;
  }

  private async validateLearningPath(path: PersonalizedPath): Promise<boolean> {
    // Validate path integrity
    const nodeIds = new Set(path.nodes.map(n => n.id));
    
    // Check all edges reference valid nodes
    for (const edge of path.edges) {
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
        return false;
      }
    }
    
    // Check path has start and end
    const hasStart = path.nodes.some(n => n.id === 'start' || n.prerequisites.length === 0);
    const hasEnd = path.nodes.some(n => n.outcomes.includes(path.targetOutcome));
    
    return hasStart && hasEnd;
  }

  private async getUserCompleteProfile(userId: string): Promise<any> {
    const [user, learningStyle, progress, achievements] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        include: {
          samLearningProfile: true,
          StudentCognitiveProfile: true
        }
      }),
      this.learningStyleCache.get(userId),
      db.user_progress.findMany({
        where: { userId },
        orderBy: { lastAccessedAt: 'desc' },
        take: 50
      }),
      db.user_achievements.findMany({
        where: { userId }
      })
    ]);
    
    return {
      user,
      learningStyle,
      progress,
      achievements,
      preferences: user?.samLearningProfile
    };
  }

  private async generateContentRecommendations(
    profile: any,
    context: PersonalizationContext
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Learning style-based recommendations
    if (profile.learningStyle?.primaryStyle === 'visual') {
      recommendations.push({
        type: 'content-format',
        content: 'Prioritize video content and infographics',
        priority: 'high',
        reason: 'Matches visual learning preference',
        expectedImpact: '25% better retention',
        implementation: 'Filter and sort content by visual elements'
      });
    }
    
    // Progress-based recommendations
    if (profile.progress?.length > 0) {
      const avgProgress = profile.progress.reduce((sum: number, p: any) => 
        sum + p.progressPercentage, 0) / profile.progress.length;
      
      if (avgProgress < 50) {
        recommendations.push({
          type: 'pacing',
          content: 'Reduce daily learning goals by 30%',
          priority: 'high',
          reason: 'Current pace may be too aggressive',
          expectedImpact: 'Improved completion rate',
          implementation: 'Adjust schedule and notifications'
        });
      }
    }
    
    // Time-based recommendations
    if (context.timeConstraints?.length > 0) {
      recommendations.push({
        type: 'scheduling',
        content: 'Micro-learning sessions of 15-20 minutes',
        priority: 'medium',
        reason: 'Limited time availability detected',
        expectedImpact: 'Better time utilization',
        implementation: 'Break content into smaller chunks'
      });
    }
    
    return recommendations;
  }

  private async generateAdaptations(
    profile: any,
    context: PersonalizationContext
  ): Promise<any[]> {
    const adaptations: any[] = [];
    
    // Difficulty adaptation
    if (profile.progress?.length > 5) {
      const recentScores = profile.progress
        .slice(0, 5)
        .map((p: any) => p.quizScore)
        .filter((s: any) => s !== null);
      
      const avgScore = recentScores.reduce((sum: number, s: number) => sum + s, 0) / recentScores.length;
      
      if (avgScore < 60) {
        adaptations.push({
          type: 'difficulty',
          adjustment: 'decrease',
          magnitude: 0.2,
          reason: 'Recent performance indicates struggle'
        });
      } else if (avgScore > 90) {
        adaptations.push({
          type: 'difficulty',
          adjustment: 'increase',
          magnitude: 0.15,
          reason: 'High performance allows for challenge'
        });
      }
    }
    
    // Content depth adaptation
    if (profile.user?.samLearningProfile?.responseStyle === 'CONCISE') {
      adaptations.push({
        type: 'content-depth',
        adjustment: 'summarize',
        magnitude: 0.3,
        reason: 'Preference for concise information'
      });
    }
    
    return adaptations;
  }

  private async extractPersonalizationInsights(
    profile: any,
    context: PersonalizationContext
  ): Promise<Insight[]> {
    const insights: Insight[] = [];
    
    // Learning pattern insights
    if (profile.learningStyle) {
      insights.push({
        category: 'learning-style',
        finding: `Primary learning style is ${profile.learningStyle.primaryStyle}`,
        evidence: profile.learningStyle.evidenceFactors,
        actionable: true,
        suggestion: 'Prioritize content matching this style'
      });
    }
    
    // Performance insights
    if (profile.progress?.length > 10) {
      const trend = this.calculatePerformanceTrend(profile.progress);
      insights.push({
        category: 'performance',
        finding: `Performance trend is ${trend}`,
        evidence: ['Based on last 10 assessments'],
        actionable: trend !== 'improving',
        suggestion: trend === 'declining' ? 'Review foundational concepts' : undefined
      });
    }
    
    // Engagement insights
    if (profile.achievements?.length > 0) {
      insights.push({
        category: 'engagement',
        finding: `High achievement motivation (${profile.achievements.length} badges)`,
        evidence: ['Regular achievement unlocking'],
        actionable: true,
        suggestion: 'Introduce more challenging achievements'
      });
    }
    
    return insights;
  }

  private calculatePerformanceTrend(progress: any[]): string {
    const scores = progress
      .map(p => p.quizScore)
      .filter(s => s !== null)
      .slice(0, 10);
    
    if (scores.length < 3) return 'insufficient-data';
    
    const trend = this.calculateTrend(scores);
    
    if (trend > 0.5) return 'improving';
    if (trend < -0.5) return 'declining';
    return 'stable';
  }

  private calculatePersonalizationConfidence(
    profile: any,
    recommendations: Recommendation[],
    adaptations: any[]
  ): number {
    let confidence = 0;
    
    // Data quality factor
    if (profile.progress?.length > 20) confidence += 0.3;
    else if (profile.progress?.length > 10) confidence += 0.2;
    else confidence += 0.1;
    
    // Profile completeness
    if (profile.learningStyle) confidence += 0.2;
    if (profile.preferences) confidence += 0.2;
    if (profile.achievements?.length > 5) confidence += 0.1;
    
    // Recommendation quality
    const highPriorityRecs = recommendations.filter(r => r.priority === 'high').length;
    confidence += Math.min(0.2, highPriorityRecs * 0.1);
    
    return Math.min(1, confidence);
  }

  private isCacheValid(profile: any): boolean {
    // Simple time-based validation (24 hours)
    if (!profile.timestamp) return false;
    const age = Date.now() - profile.timestamp;
    return age < 24 * 60 * 60 * 1000;
  }

  // Database storage methods
  private async storeLearningStyleProfile(userId: string, profile: LearningStyleProfile) {
    await db.learningStyleAnalysis.create({
      data: {
        userId,
        primaryStyle: profile.primaryStyle,
        secondaryStyle: profile.secondaryStyle,
        styleStrengths: JSON.stringify(profile.styleStrengths),
        evidenceFactors: profile.evidenceFactors,
        confidence: profile.confidence,
        analyzedAt: new Date()
      }
    });
  }

  private async storeContentOptimization(
    userId: string,
    contentId: string,
    optimization: OptimizedContent
  ) {
    await db.contentOptimization.create({
      data: {
        userId,
        contentId,
        adaptations: JSON.stringify(optimization.adaptations),
        presentationOrder: optimization.presentationOrder,
        optimizationData: JSON.stringify(optimization),
        createdAt: new Date()
      }
    });
  }

  private async storeEmotionalStateAnalysis(userId: string, state: EmotionalState) {
    await db.emotionalStateAnalysis.create({
      data: {
        userId,
        currentEmotion: state.currentEmotion,
        confidence: state.confidence,
        trend: state.trend,
        indicators: JSON.stringify(state.indicators),
        recommendations: state.recommendations,
        analyzedAt: new Date()
      }
    });
  }

  private async storeMotivationProfile(userId: string, profile: MotivationProfile) {
    await db.motivationProfile.create({
      data: {
        userId,
        intrinsicFactors: JSON.stringify(profile.intrinsicFactors),
        extrinsicFactors: JSON.stringify(profile.extrinsicFactors),
        currentLevel: profile.currentLevel,
        triggers: profile.triggers,
        barriers: profile.barriers,
        sustainabilityScore: profile.sustainabilityScore,
        analyzedAt: new Date()
      }
    });
  }

  private async storeLearningPath(path: PersonalizedPath) {
    await db.personalizedLearningPath.create({
      data: {
        pathId: path.pathId,
        userId: path.userId,
        targetOutcome: path.targetOutcome,
        nodes: JSON.stringify(path.nodes),
        edges: JSON.stringify(path.edges),
        estimatedDuration: path.estimatedDuration,
        alternativePaths: JSON.stringify(path.alternativePaths),
        createdAt: new Date()
      }
    });
  }

  private async storePersonalizationResult(userId: string, result: PersonalizationResult) {
    await db.personalizationResult.create({
      data: {
        userId,
        recommendations: JSON.stringify(result.recommendations),
        adaptations: JSON.stringify(result.adaptations),
        insights: JSON.stringify(result.insights),
        confidence: result.confidence,
        appliedAt: new Date()
      }
    });
  }
}

// Type definitions
interface Student {
  id: string;
  level?: string;
}

interface Interaction {
  userId: string;
  type: string;
  timestamp: Date;
  responseTime?: number;
  isError?: boolean;
  metadata?: any;
}

interface LearningHistory {
  userId: string;
  activities?: any[];
  achievements?: any[];
  progress?: any[];
}

interface StudentProfile {
  userId: string;
  skillGaps?: any[];
  careerGoals?: any[];
  learningPace?: string;
}

// Export singleton instance
export const samPersonalizationEngine = SAMPersonalizationEngine.getInstance();