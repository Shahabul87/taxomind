// Dynamic Content Reordering Engine

import { 
  ContentItem, 
  StudentProfile, 
  ReorderingStrategy, 
  ContentSequence, 
  ContentAdaptation, 
  AdaptationType, 
  AdaptationReason, 
  ReorderingRequest, 
  ReorderingResult,
  ReorderingRationale,
  KeyFactor,
  Tradeoff,
  EstimatedImpact,
  AlternativeSequence,
  ReorderingAlgorithm
} from './types';

export class ContentReorderingEngine {
  
  // Main reordering method
  async reorderContent(
    request: ReorderingRequest,
    originalContent: ContentItem[],
    studentProfile: StudentProfile,
    strategy: ReorderingStrategy
  ): Promise<ReorderingResult> {
    
    // Validate input
    if (!originalContent.length) {
      throw new Error('No content items provided for reordering');
    }

    console.log(`Reordering ${originalContent.length} items using ${strategy.algorithm} strategy`);

    // Apply the specified reordering algorithm
    const reorderedContent = await this.applyReorderingAlgorithm(
      originalContent,
      studentProfile,
      strategy,
      request
    );

    // Create adaptations record
    const adaptations = this.createAdaptations(originalContent, reorderedContent);

    // Generate sequence
    const sequence: ContentSequence = {
      id: `seq_${request.studentId}_${Date.now()}`,
      studentId: request.studentId,
      courseId: request.courseId,
      originalSequence: originalContent,
      adaptedSequence: reorderedContent,
      strategy,
      adaptations,
      performance: {
        completionRate: 0,
        averageEngagementScore: 0,
        totalTime: 0,
        dropoffPoints: [],
        satisfactionScore: 0,
        adaptationEffectiveness: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Generate rationale
    const rationale = this.generateRationale(strategy, studentProfile, adaptations);

    // Estimate impact
    const estimatedImpact = this.estimateImpact(
      originalContent,
      reorderedContent,
      studentProfile,
      strategy
    );

    // Generate alternatives
    const alternatives = await this.generateAlternatives(
      originalContent,
      studentProfile,
      request,
      strategy
    );

    return {
      sequence,
      rationale,
      estimatedImpact,
      alternatives
    };
  }

  // Apply specific reordering algorithm
  private async applyReorderingAlgorithm(
    content: ContentItem[],
    profile: StudentProfile,
    strategy: ReorderingStrategy,
    request: ReorderingRequest
  ): Promise<ContentItem[]> {
    
    switch (strategy.algorithm) {
      case 'difficulty_adaptive':
        return this.applyDifficultyAdaptiveReordering(content, profile, strategy);
      
      case 'engagement_optimized':
        return this.applyEngagementOptimizedReordering(content, profile, strategy);
      
      case 'time_constrained':
        return this.applyTimeConstrainedReordering(content, profile, strategy, request);
      
      case 'learning_style_matched':
        return this.applyLearningStyleMatchedReordering(content, profile, strategy);
      
      case 'prerequisite_optimized':
        return this.applyPrerequisiteOptimizedReordering(content, profile, strategy);
      
      case 'spaced_repetition':
        return this.applySpacedRepetitionReordering(content, profile, strategy);
      
      case 'cognitive_load_balanced':
        return this.applyCognitiveLoadBalancedReordering(content, profile, strategy);
      
      case 'performance_based':
        return this.applyPerformanceBasedReordering(content, profile, strategy);
      
      case 'hybrid_multi_factor':
        return this.applyHybridMultiFactorReordering(content, profile, strategy);
      
      default:
        throw new Error(`Unsupported reordering algorithm: ${strategy.algorithm}`);
    }
  }

  // Difficulty Adaptive Reordering
  private applyDifficultyAdaptiveReordering(
    content: ContentItem[],
    profile: StudentProfile,
    strategy: ReorderingStrategy
  ): ContentItem[] {
    const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const targetDifficulty = profile.preferences.difficultyPreference;
    const targetIndex = difficultyLevels.indexOf(targetDifficulty);

    return content.slice().sort((a, b) => {
      const aIndex = difficultyLevels.indexOf(a.metadata.difficulty);
      const bIndex = difficultyLevels.indexOf(b.metadata.difficulty);
      
      // Prefer content matching student's difficulty preference
      const aDistance = Math.abs(aIndex - targetIndex);
      const bDistance = Math.abs(bIndex - targetIndex);
      
      if (aDistance !== bDistance) {
        return aDistance - bDistance;
      }
      
      // Secondary sort by engagement score
      return b.adaptiveFactors.engagementScore - a.adaptiveFactors.engagementScore;
    }).map((item, index) => ({
      ...item,
      currentPosition: index
    }));
  }

  // Engagement Optimized Reordering
  private applyEngagementOptimizedReordering(
    content: ContentItem[],
    profile: StudentProfile,
    strategy: ReorderingStrategy
  ): ContentItem[] {
    const engagementWeight = strategy.parameters.weights.engagement;
    const contentTypePrefs = profile.preferences.contentTypePreference;

    return content.slice().sort((a, b) => {
      // Calculate engagement score based on content type preference and historical data
      const aEngagementScore = (
        a.adaptiveFactors.engagementScore * engagementWeight +
        (contentTypePrefs[a.type] || 0.5) * 100 * (1 - engagementWeight)
      );
      
      const bEngagementScore = (
        b.adaptiveFactors.engagementScore * engagementWeight +
        (contentTypePrefs[b.type] || 0.5) * 100 * (1 - engagementWeight)
      );

      return bEngagementScore - aEngagementScore;
    }).map((item, index) => ({
      ...item,
      currentPosition: index
    }));
  }

  // Time Constrained Reordering
  private applyTimeConstrainedReordering(
    content: ContentItem[],
    profile: StudentProfile,
    strategy: ReorderingStrategy,
    request: ReorderingRequest
  ): ContentItem[] {
    const availableTime = request.context.sessionTime;
    const priorityContent: ContentItem[] = [];
    const remainingContent: ContentItem[] = [];
    let accumulatedTime = 0;

    // Sort by importance and time efficiency
    const sortedContent = content.slice().sort((a, b) => {
      const aEfficiency = a.adaptiveFactors.engagementScore / a.metadata.duration;
      const bEfficiency = b.adaptiveFactors.engagementScore / b.metadata.duration;
      return bEfficiency - aEfficiency;
    });

    // Select content that fits within time constraint
    for (const item of sortedContent) {
      if (accumulatedTime + item.metadata.duration <= availableTime) {
        priorityContent.push(item);
        accumulatedTime += item.metadata.duration;
      } else {
        remainingContent.push(item);
      }
    }

    // Combine priority content first, then remaining
    const reordered = [...priorityContent, ...remainingContent];
    
    return reordered.map((item, index) => ({
      ...item,
      currentPosition: index
    }));
  }

  // Learning Style Matched Reordering
  private applyLearningStyleMatchedReordering(
    content: ContentItem[],
    profile: StudentProfile,
    strategy: ReorderingStrategy
  ): ContentItem[] {
    const learningStyle = profile.learningStyle;
    
    // Content type to learning style mapping
    const contentStyleMapping = {
      'video': learningStyle.visual * 0.6 + learningStyle.auditory * 0.4,
      'text': learningStyle.reading * 0.8 + learningStyle.visual * 0.2,
      'interactive': learningStyle.kinesthetic * 0.7 + learningStyle.visual * 0.3,
      'quiz': learningStyle.kinesthetic * 0.5 + learningStyle.reading * 0.5,
      'assignment': learningStyle.kinesthetic * 0.6 + learningStyle.reading * 0.4,
      'document': learningStyle.reading * 0.9 + learningStyle.visual * 0.1,
      'discussion': learningStyle.auditory * 0.5 + learningStyle.reading * 0.5,
      'exercise': learningStyle.kinesthetic * 0.8 + learningStyle.visual * 0.2
    };

    return content.slice().sort((a, b) => {
      const aStyleMatch = contentStyleMapping[a.type] || 0.5;
      const bStyleMatch = contentStyleMapping[b.type] || 0.5;
      
      // Combine style match with engagement score
      const aScore = aStyleMatch * 0.7 + (a.adaptiveFactors.engagementScore / 100) * 0.3;
      const bScore = bStyleMatch * 0.7 + (b.adaptiveFactors.engagementScore / 100) * 0.3;
      
      return bScore - aScore;
    }).map((item, index) => ({
      ...item,
      currentPosition: index
    }));
  }

  // Prerequisite Optimized Reordering
  private applyPrerequisiteOptimizedReordering(
    content: ContentItem[],
    profile: StudentProfile,
    strategy: ReorderingStrategy
  ): ContentItem[] {
    const prerequisiteWeight = strategy.parameters.weights.prerequisite;
    
    // Build prerequisite graph
    const prerequisiteMap = new Map<string, string[]>();
    content.forEach(item => {
      prerequisiteMap.set(item.id, item.metadata.prerequisites);
    });

    // Topological sort based on prerequisites
    const visited = new Set<string>();
    const temp = new Set<string>();
    const result: ContentItem[] = [];

    const visit = (itemId: string) => {
      if (temp.has(itemId)) {
        // Circular dependency detected - use original order
        return;
      }
      if (visited.has(itemId)) {
        return;
      }

      temp.add(itemId);
      const prerequisites = prerequisiteMap.get(itemId) || [];
      
      prerequisites.forEach(prereqId => {
        const prereqItem = content.find(item => item.id === prereqId);
        if (prereqItem) {
          visit(prereqId);
        }
      });

      temp.delete(itemId);
      visited.add(itemId);
      
      const item = content.find(item => item.id === itemId);
      if (item) {
        result.push(item);
      }
    };

    // Visit all items
    content.forEach(item => {
      if (!visited.has(item.id)) {
        visit(item.id);
      }
    });

    return result.map((item, index) => ({
      ...item,
      currentPosition: index
    }));
  }

  // Spaced Repetition Reordering
  private applySpacedRepetitionReordering(
    content: ContentItem[],
    profile: StudentProfile,
    strategy: ReorderingStrategy
  ): ContentItem[] {
    // Simple spaced repetition - interleave review content
    const newContent: ContentItem[] = [];
    const reviewContent: ContentItem[] = [];

    content.forEach(item => {
      if (item.adaptiveFactors.replayRate > 0.3) {
        reviewContent.push(item);
      } else {
        newContent.push(item);
      }
    });

    // Interleave new and review content
    const result: ContentItem[] = [];
    const maxLength = Math.max(newContent.length, reviewContent.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < newContent.length) {
        result.push(newContent[i]);
      }
      if (i < reviewContent.length && result.length < content.length) {
        result.push(reviewContent[i]);
      }
    }

    return result.map((item, index) => ({
      ...item,
      currentPosition: index
    }));
  }

  // Cognitive Load Balanced Reordering
  private applyCognitiveLoadBalancedReordering(
    content: ContentItem[],
    profile: StudentProfile,
    strategy: ReorderingStrategy
  ): ContentItem[] {
    const maxCognitiveLoad = strategy.parameters.constraints.maxCognitiveLoad;
    const cognitiveLoadValues = { 'low': 1, 'medium': 2, 'high': 3 };
    
    // Alternate between high and low cognitive load items
    const lowLoad = content.filter(item => item.metadata.cognitiveLoad === 'low');
    const mediumLoad = content.filter(item => item.metadata.cognitiveLoad === 'medium');
    const highLoad = content.filter(item => item.metadata.cognitiveLoad === 'high');

    const result: ContentItem[] = [];
    const maxItems = Math.max(lowLoad.length, mediumLoad.length, highLoad.length);
    
    for (let i = 0; i < maxItems; i++) {
      // Add low load item first
      if (i < lowLoad.length) {
        result.push(lowLoad[i]);
      }
      // Then medium load
      if (i < mediumLoad.length) {
        result.push(mediumLoad[i]);
      }
      // Then high load (if allowed)
      if (i < highLoad.length && maxCognitiveLoad === 'high') {
        result.push(highLoad[i]);
      }
    }

    return result.map((item, index) => ({
      ...item,
      currentPosition: index
    }));
  }

  // Performance Based Reordering
  private applyPerformanceBasedReordering(
    content: ContentItem[],
    profile: StudentProfile,
    strategy: ReorderingStrategy
  ): ContentItem[] {
    const strugglingAreas = profile.performance.strugglingAreas;
    const strengths = profile.performance.strengths;

    return content.slice().sort((a, b) => {
      // Prioritize struggling areas
      const aStruggling = a.metadata.concepts.some(concept => 
        strugglingAreas.includes(concept)
      );
      const bStruggling = b.metadata.concepts.some(concept => 
        strugglingAreas.includes(concept)
      );

      if (aStruggling && !bStruggling) return -1;
      if (!aStruggling && bStruggling) return 1;

      // Secondary sort by success rate
      return a.adaptiveFactors.successRate - b.adaptiveFactors.successRate;
    }).map((item, index) => ({
      ...item,
      currentPosition: index
    }));
  }

  // Hybrid Multi-Factor Reordering
  private applyHybridMultiFactorReordering(
    content: ContentItem[],
    profile: StudentProfile,
    strategy: ReorderingStrategy
  ): ContentItem[] {
    const weights = strategy.parameters.weights;
    
    return content.slice().sort((a, b) => {
      // Calculate composite score for each item
      const aScore = this.calculateCompositeScore(a, profile, weights);
      const bScore = this.calculateCompositeScore(b, profile, weights);
      
      return bScore - aScore;
    }).map((item, index) => ({
      ...item,
      currentPosition: index
    }));
  }

  // Calculate composite score for multi-factor reordering
  private calculateCompositeScore(
    item: ContentItem,
    profile: StudentProfile,
    weights: any
  ): number {
    let score = 0;

    // Difficulty factor
    const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const targetDifficultyIndex = difficultyLevels.indexOf(profile.preferences.difficultyPreference);
    const itemDifficultyIndex = difficultyLevels.indexOf(item.metadata.difficulty);
    const difficultyScore = 1 - (Math.abs(targetDifficultyIndex - itemDifficultyIndex) / 3);
    score += difficultyScore * weights.difficulty;

    // Engagement factor
    const engagementScore = item.adaptiveFactors.engagementScore / 100;
    score += engagementScore * weights.engagement;

    // Learning style factor
    const contentTypePreference = profile.preferences.contentTypePreference[item.type] || 0.5;
    score += contentTypePreference * weights.learningStyle;

    // Performance factor
    const performanceScore = item.adaptiveFactors.successRate;
    score += performanceScore * weights.performance;

    // Time constraint factor
    const timeEfficiency = 1 / (item.metadata.duration / 60); // Inverse of duration in hours
    score += timeEfficiency * weights.timeConstraint;

    // Cognitive load factor
    const cognitiveLoadValues = { 'low': 1, 'medium': 0.7, 'high': 0.4 };
    const cognitiveScore = cognitiveLoadValues[item.metadata.cognitiveLoad];
    score += cognitiveScore * weights.cognitiveLoad;

    // Novelty factor
    const noveltyScore = 1 - item.adaptiveFactors.replayRate;
    score += noveltyScore * weights.novelty;

    return score;
  }

  // Create adaptations record
  private createAdaptations(
    original: ContentItem[],
    reordered: ContentItem[]
  ): ContentAdaptation[] {
    const adaptations: ContentAdaptation[] = [];

    reordered.forEach((item, newIndex) => {
      const originalIndex = original.findIndex(orig => orig.id === item.id);
      
      if (originalIndex !== newIndex) {
        adaptations.push({
          contentId: item.id,
          adaptationType: 'reorder',
          originalPosition: originalIndex,
          newPosition: newIndex,
          reason: {
            primary: 'preference_alignment',
            description: `Reordered based on student learning preferences and performance patterns`,
            data: {
              originalPosition: originalIndex,
              newPosition: newIndex,
              positionChange: newIndex - originalIndex
            }
          },
          confidence: 0.8,
          expectedImpact: {
            engagement: 0.15,
            completion: 0.10,
            comprehension: 0.08,
            time: -0.05,
            satisfaction: 0.12
          },
          timestamp: new Date()
        });
      }
    });

    return adaptations;
  }

  // Generate rationale for reordering
  private generateRationale(
    strategy: ReorderingStrategy,
    profile: StudentProfile,
    adaptations: ContentAdaptation[]
  ): ReorderingRationale {
    const keyFactors: KeyFactor[] = [
      {
        factor: 'Learning Style Preference',
        importance: 0.8,
        influence: 0.6,
        description: `Optimized for ${profile.learningStyle.visual > 0.6 ? 'visual' : 'mixed'} learning style`
      },
      {
        factor: 'Difficulty Progression',
        importance: 0.7,
        influence: 0.5,
        description: `Matched to ${profile.preferences.difficultyPreference} difficulty preference`
      },
      {
        factor: 'Engagement History',
        importance: 0.6,
        influence: 0.4,
        description: `Based on ${profile.performance.averageEngagementScore.toFixed(1)}% average engagement`
      }
    ];

    const tradeoffs: Tradeoff[] = [
      {
        aspect: 'Content Flow',
        benefit: 'Better engagement alignment',
        cost: 'Slight deviation from original sequence',
        netImpact: 0.3
      },
      {
        aspect: 'Learning Efficiency',
        benefit: 'Reduced cognitive load',
        cost: 'May skip some prerequisites',
        netImpact: 0.2
      }
    ];

    return {
      strategy: strategy.name,
      keyFactors,
      tradeoffs,
      confidence: 0.85
    };
  }

  // Estimate impact of reordering
  private estimateImpact(
    original: ContentItem[],
    reordered: ContentItem[],
    profile: StudentProfile,
    strategy: ReorderingStrategy
  ): EstimatedImpact {
    // Calculate expected improvements based on alignment with student profile
    const baseEngagement = profile.performance.averageEngagementScore;
    const baseCompletion = profile.performance.averageCompletionRate;
    
    return {
      completionProbability: Math.min(1, baseCompletion + 0.15),
      engagementScore: Math.min(100, baseEngagement + 12),
      learningEfficiency: 0.75,
      timeToCompletion: reordered.reduce((sum, item) => sum + item.metadata.duration, 0),
      retentionProbability: Math.min(1, profile.performance.retentionRate + 0.08)
    };
  }

  // Generate alternative sequences
  private async generateAlternatives(
    original: ContentItem[],
    profile: StudentProfile,
    request: ReorderingRequest,
    currentStrategy: ReorderingStrategy
  ): Promise<AlternativeSequence[]> {
    const alternatives: AlternativeSequence[] = [];
    
    // Generate alternative using different algorithms
    const alternativeAlgorithms: ReorderingAlgorithm[] = [
      'difficulty_adaptive',
      'engagement_optimized',
      'time_constrained'
    ];

    for (const algorithm of alternativeAlgorithms) {
      if (algorithm !== currentStrategy.algorithm) {
        const alternativeStrategy: ReorderingStrategy = {
          ...currentStrategy,
          algorithm,
          name: `Alternative ${algorithm.replace('_', ' ')}`
        };

        const alternativeSequence = await this.applyReorderingAlgorithm(
          original,
          profile,
          alternativeStrategy,
          request
        );

        const score = this.calculateSequenceScore(alternativeSequence, profile);

        alternatives.push({
          sequence: alternativeSequence,
          strategy: algorithm,
          score,
          description: `Alternative approach using ${algorithm.replace('_', ' ')} optimization`
        });
      }
    }

    return alternatives.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  // Calculate sequence score
  private calculateSequenceScore(sequence: ContentItem[], profile: StudentProfile): number {
    let score = 0;
    const weights = {
      engagement: 0.3,
      difficulty: 0.25,
      learningStyle: 0.25,
      performance: 0.2
    };

    sequence.forEach(item => {
      score += this.calculateCompositeScore(item, profile, weights);
    });

    return score / sequence.length;
  }
}