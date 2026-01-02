/**
 * @sam-ai/agentic - Goal Decomposer Engine
 * Decomposes learning goals into actionable sub-goals with dependencies
 */

import { z } from 'zod';
import type { AIAdapter, SAMLogger } from '@sam-ai/core';
import {
  type LearningGoal,
  type SubGoal,
  type GoalDecomposition,
  type DependencyGraph,
  type DependencyEdge,
  type DecompositionOptions,
  type EffortEstimate,
  type EffortBreakdown,
  type EffortFactor,
  SubGoalType,
  StepStatus,
  DecompositionOptionsSchema,
} from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface GoalDecomposerConfig {
  aiAdapter: AIAdapter;
  logger?: SAMLogger;
  defaultOptions?: Partial<DecompositionOptions>;
}

const DEFAULT_OPTIONS: DecompositionOptions = {
  maxSubGoals: 10,
  minSubGoals: 2,
  includeAssessments: true,
  includeReviews: true,
};

// ============================================================================
// AI RESPONSE SCHEMAS
// ============================================================================

const SubGoalAISchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(['learn', 'practice', 'assess', 'review', 'reflect', 'create']),
  estimatedMinutes: z.number().int().min(5).max(240),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  prerequisites: z.array(z.number().int()).default([]), // indices of prerequisite sub-goals
  successCriteria: z.array(z.string()).default([]),
});

const DecompositionAIResponseSchema = z.object({
  subGoals: z.array(SubGoalAISchema).min(1).max(20),
  overallDifficulty: z.enum(['easy', 'medium', 'hard']),
  reasoning: z.string().optional(),
});

type DecompositionAIResponse = z.infer<typeof DecompositionAIResponseSchema>;

// ============================================================================
// GOAL DECOMPOSER ENGINE
// ============================================================================

export class GoalDecomposer {
  private readonly ai: AIAdapter;
  private readonly logger: SAMLogger;
  private readonly defaultOptions: DecompositionOptions;

  constructor(config: GoalDecomposerConfig) {
    this.ai = config.aiAdapter;
    this.logger = config.logger ?? console;
    this.defaultOptions = { ...DEFAULT_OPTIONS, ...config.defaultOptions };
  }

  /**
   * Decompose a learning goal into sub-goals
   */
  async decompose(
    goal: LearningGoal,
    options?: Partial<DecompositionOptions>
  ): Promise<GoalDecomposition> {
    const startTime = Date.now();
    const mergedOptions = this.mergeOptions(options);

    this.logger.debug?.(`[GoalDecomposer] Decomposing goal: ${goal.title}`);

    try {
      // Generate decomposition using AI
      const aiResponse = await this.generateDecomposition(goal, mergedOptions);

      // Convert AI response to SubGoals with proper IDs
      const subGoals = this.convertToSubGoals(goal.id, aiResponse.subGoals);

      // Build dependency graph
      const dependencies = this.buildDependencyGraph(subGoals, aiResponse.subGoals);

      // Calculate total duration
      const estimatedDuration = subGoals.reduce((sum, sg) => sum + sg.estimatedMinutes, 0);

      // Calculate confidence based on various factors
      const confidence = this.calculateConfidence(goal, subGoals, mergedOptions);

      const decomposition: GoalDecomposition = {
        goalId: goal.id,
        subGoals,
        dependencies,
        estimatedDuration,
        difficulty: aiResponse.overallDifficulty,
        confidence,
      };

      this.logger.debug?.(
        `[GoalDecomposer] Decomposed into ${subGoals.length} sub-goals in ${Date.now() - startTime}ms`
      );

      return decomposition;
    } catch (error) {
      this.logger.error?.(`[GoalDecomposer] Decomposition failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Validate a decomposition for logical consistency
   */
  validateDecomposition(decomposition: GoalDecomposition): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Check for circular dependencies
    const circularDeps = this.findCircularDependencies(decomposition.dependencies);
    if (circularDeps.length > 0) {
      issues.push({
        type: 'error',
        code: 'CIRCULAR_DEPENDENCY',
        message: `Circular dependencies detected: ${circularDeps.join(' -> ')}`,
      });
    }

    // Check for orphaned sub-goals (no path from start)
    const orphans = this.findOrphanedSubGoals(decomposition);
    if (orphans.length > 0) {
      issues.push({
        type: 'warning',
        code: 'ORPHANED_SUBGOALS',
        message: `Sub-goals with missing prerequisites: ${orphans.join(', ')}`,
      });
    }

    // Check for reasonable time distribution
    const timeIssues = this.validateTimeDistribution(decomposition);
    issues.push(...timeIssues);

    // Check for sub-goal type diversity
    const typeIssues = this.validateTypeDistribution(decomposition);
    issues.push(...typeIssues);

    return {
      valid: issues.filter((i) => i.type === 'error').length === 0,
      issues,
    };
  }

  /**
   * Estimate effort for a goal
   */
  async estimateEffort(goal: LearningGoal, decomposition?: GoalDecomposition): Promise<EffortEstimate> {
    const decomp = decomposition ?? (await this.decompose(goal));

    const breakdown: EffortBreakdown = {
      learning: 0,
      practice: 0,
      assessment: 0,
      review: 0,
      buffer: 0,
    };

    // Calculate breakdown by sub-goal type
    for (const subGoal of decomp.subGoals) {
      switch (subGoal.type) {
        case SubGoalType.LEARN:
          breakdown.learning += subGoal.estimatedMinutes;
          break;
        case SubGoalType.PRACTICE:
        case SubGoalType.CREATE:
          breakdown.practice += subGoal.estimatedMinutes;
          break;
        case SubGoalType.ASSESS:
          breakdown.assessment += subGoal.estimatedMinutes;
          break;
        case SubGoalType.REVIEW:
        case SubGoalType.REFLECT:
          breakdown.review += subGoal.estimatedMinutes;
          break;
      }
    }

    // Add buffer (15% of total)
    const subtotal = breakdown.learning + breakdown.practice + breakdown.assessment + breakdown.review;
    breakdown.buffer = Math.ceil(subtotal * 0.15);

    const factors = this.calculateEffortFactors(goal, decomp);

    // Apply factors to total
    let totalMinutes = subtotal + breakdown.buffer;
    for (const factor of factors) {
      totalMinutes = Math.ceil(totalMinutes * factor.impact);
    }

    return {
      totalMinutes,
      breakdown,
      confidence: decomp.confidence,
      factors,
    };
  }

  /**
   * Refine a decomposition based on feedback
   */
  async refineDecomposition(
    decomposition: GoalDecomposition,
    feedback: DecompositionFeedback
  ): Promise<GoalDecomposition> {
    this.logger.debug?.(`[GoalDecomposer] Refining decomposition based on feedback`);

    const refinedSubGoals = [...decomposition.subGoals];

    // Apply feedback adjustments
    if (feedback.adjustments) {
      for (const adjustment of feedback.adjustments) {
        const subGoalIndex = refinedSubGoals.findIndex((sg) => sg.id === adjustment.subGoalId);
        if (subGoalIndex >= 0) {
          refinedSubGoals[subGoalIndex] = {
            ...refinedSubGoals[subGoalIndex],
            ...adjustment.changes,
          };
        }
      }
    }

    // Add new sub-goals if requested
    if (feedback.addSubGoals) {
      for (const newSubGoal of feedback.addSubGoals) {
        refinedSubGoals.push({
          id: this.generateSubGoalId(),
          goalId: decomposition.goalId,
          status: StepStatus.PENDING,
          order: refinedSubGoals.length,
          ...newSubGoal,
        });
      }
    }

    // Remove sub-goals if requested
    if (feedback.removeSubGoalIds) {
      const idsToRemove = new Set(feedback.removeSubGoalIds);
      const filtered = refinedSubGoals.filter((sg) => !idsToRemove.has(sg.id));
      refinedSubGoals.length = 0;
      refinedSubGoals.push(...filtered);

      // Update order
      refinedSubGoals.forEach((sg, index) => {
        sg.order = index;
      });
    }

    // Recalculate dependencies
    const dependencies = this.rebuildDependencies(refinedSubGoals);

    // Recalculate estimated duration
    const estimatedDuration = refinedSubGoals.reduce((sum, sg) => sum + sg.estimatedMinutes, 0);

    return {
      ...decomposition,
      subGoals: refinedSubGoals,
      dependencies,
      estimatedDuration,
      confidence: decomposition.confidence * 0.9, // Slight confidence reduction after refinement
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private mergeOptions(options?: Partial<DecompositionOptions>): DecompositionOptions {
    const merged = { ...this.defaultOptions, ...options };
    return DecompositionOptionsSchema.parse(merged);
  }

  private async generateDecomposition(
    goal: LearningGoal,
    options: DecompositionOptions
  ): Promise<DecompositionAIResponse> {
    const prompt = this.buildDecompositionPrompt(goal, options);

    const response = await this.ai.chat({
      messages: [
        {
          role: 'system',
          content: `You are an expert learning curriculum designer. Decompose learning goals into actionable sub-goals.

Always respond with valid JSON matching this structure:
{
  "subGoals": [
    {
      "title": "Sub-goal title",
      "description": "Optional description",
      "type": "learn|practice|assess|review|reflect|create",
      "estimatedMinutes": 30,
      "difficulty": "easy|medium|hard",
      "prerequisites": [0, 1], // indices of prerequisite sub-goals (0-indexed)
      "successCriteria": ["Criterion 1", "Criterion 2"]
    }
  ],
  "overallDifficulty": "easy|medium|hard",
  "reasoning": "Brief explanation of decomposition strategy"
}

Important guidelines:
- Create ${options.minSubGoals}-${options.maxSubGoals} sub-goals
- Include a mix of learning types (learn, practice, assess, review)
- Set realistic time estimates (5-240 minutes per sub-goal)
- Define clear prerequisites to create a logical learning path
- Include success criteria for each sub-goal`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Extract JSON from response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return DecompositionAIResponseSchema.parse(parsed);
  }

  private buildDecompositionPrompt(goal: LearningGoal, options: DecompositionOptions): string {
    const parts: string[] = [
      `Decompose this learning goal into ${options.minSubGoals}-${options.maxSubGoals} actionable sub-goals:`,
      '',
      `Goal: ${goal.title}`,
    ];

    if (goal.description) {
      parts.push(`Description: ${goal.description}`);
    }

    if (goal.currentMastery) {
      parts.push(`Current mastery level: ${goal.currentMastery}`);
    }

    if (goal.targetMastery) {
      parts.push(`Target mastery level: ${goal.targetMastery}`);
    }

    if (goal.context.courseId) {
      parts.push(`Context: Part of a structured course`);
    }

    if (options.availableTimePerDay) {
      parts.push(`Available time per day: ${options.availableTimePerDay} minutes`);
    }

    if (options.targetCompletionDate) {
      const daysUntil = Math.ceil(
        (options.targetCompletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      parts.push(`Target completion: ${daysUntil} days from now`);
    }

    if (options.preferredLearningStyle) {
      parts.push(`Preferred learning style: ${options.preferredLearningStyle}`);
    }

    parts.push('');
    parts.push('Requirements:');
    if (options.includeAssessments) {
      parts.push('- Include assessment checkpoints');
    }
    if (options.includeReviews) {
      parts.push('- Include review/reflection steps');
    }

    return parts.join('\n');
  }

  private convertToSubGoals(
    goalId: string,
    aiSubGoals: z.infer<typeof SubGoalAISchema>[]
  ): SubGoal[] {
    return aiSubGoals.map((sg, index) => ({
      id: this.generateSubGoalId(),
      goalId,
      title: sg.title,
      description: sg.description,
      type: sg.type as SubGoalType,
      order: index,
      estimatedMinutes: sg.estimatedMinutes,
      difficulty: sg.difficulty,
      prerequisites: [], // Will be filled by buildDependencyGraph
      successCriteria: sg.successCriteria,
      status: StepStatus.PENDING,
    }));
  }

  private buildDependencyGraph(
    subGoals: SubGoal[],
    aiSubGoals: z.infer<typeof SubGoalAISchema>[]
  ): DependencyGraph {
    const nodes = subGoals.map((sg) => sg.id);
    const edges: DependencyEdge[] = [];

    // Map AI prerequisite indices to actual sub-goal IDs
    aiSubGoals.forEach((aiSg, index) => {
      const targetId = subGoals[index].id;

      for (const prereqIndex of aiSg.prerequisites) {
        if (prereqIndex >= 0 && prereqIndex < subGoals.length && prereqIndex !== index) {
          const fromId = subGoals[prereqIndex].id;
          edges.push({
            from: fromId,
            to: targetId,
            type: 'prerequisite',
          });

          // Also update the subGoal's prerequisites array
          subGoals[index].prerequisites.push(fromId);
        }
      }
    });

    return { nodes, edges };
  }

  private rebuildDependencies(subGoals: SubGoal[]): DependencyGraph {
    const nodes = subGoals.map((sg) => sg.id);
    const edges: DependencyEdge[] = [];
    const idSet = new Set(nodes);

    for (const sg of subGoals) {
      for (const prereqId of sg.prerequisites) {
        if (idSet.has(prereqId)) {
          edges.push({
            from: prereqId,
            to: sg.id,
            type: 'prerequisite',
          });
        }
      }
    }

    return { nodes, edges };
  }

  private calculateConfidence(
    goal: LearningGoal,
    subGoals: SubGoal[],
    options: DecompositionOptions
  ): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on goal specificity
    if (goal.description && goal.description.length > 50) {
      confidence += 0.05;
    }

    if (goal.context.courseId) {
      confidence += 0.05; // More context = higher confidence
    }

    if (goal.targetMastery && goal.currentMastery) {
      confidence += 0.05; // Clear progression target
    }

    // Adjust based on sub-goal count
    const count = subGoals.length;
    if (count >= options.minSubGoals! && count <= options.maxSubGoals!) {
      confidence += 0.05;
    } else {
      confidence -= 0.1;
    }

    // Check for type diversity
    const types = new Set(subGoals.map((sg) => sg.type));
    if (types.size >= 3) {
      confidence += 0.05;
    }

    return Math.min(1, Math.max(0, confidence));
  }

  private calculateEffortFactors(goal: LearningGoal, decomp: GoalDecomposition): EffortFactor[] {
    const factors: EffortFactor[] = [];

    // Mastery gap factor
    if (goal.currentMastery && goal.targetMastery) {
      const masteryLevels = ['novice', 'beginner', 'intermediate', 'advanced', 'expert'];
      const currentIdx = masteryLevels.indexOf(goal.currentMastery);
      const targetIdx = masteryLevels.indexOf(goal.targetMastery);
      const gap = targetIdx - currentIdx;

      if (gap >= 3) {
        factors.push({
          name: 'Large mastery gap',
          impact: 1.3,
          reason: 'Moving from novice to advanced requires extra time',
        });
      }
    }

    // Difficulty factor
    if (decomp.difficulty === 'hard') {
      factors.push({
        name: 'High difficulty',
        impact: 1.2,
        reason: 'Complex material requires additional processing time',
      });
    }

    // Low confidence adjustment
    if (decomp.confidence < 0.7) {
      factors.push({
        name: 'Uncertainty buffer',
        impact: 1.15,
        reason: 'Low decomposition confidence adds uncertainty',
      });
    }

    return factors;
  }

  private findCircularDependencies(graph: DependencyGraph): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycle: string[] = [];

    const dfs = (node: string, path: string[]): boolean => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const outEdges = graph.edges.filter((e) => e.from === node);
      for (const edge of outEdges) {
        if (!visited.has(edge.to)) {
          if (dfs(edge.to, path)) {
            return true;
          }
        } else if (recursionStack.has(edge.to)) {
          // Found cycle
          const cycleStart = path.indexOf(edge.to);
          cycle.push(...path.slice(cycleStart), edge.to);
          return true;
        }
      }

      path.pop();
      recursionStack.delete(node);
      return false;
    };

    for (const node of graph.nodes) {
      if (!visited.has(node)) {
        if (dfs(node, [])) {
          return cycle;
        }
      }
    }

    return [];
  }

  private findOrphanedSubGoals(decomp: GoalDecomposition): string[] {
    // Find sub-goals that have prerequisites that don't exist
    const nodeSet = new Set(decomp.dependencies.nodes);
    const orphans: string[] = [];

    for (const subGoal of decomp.subGoals) {
      for (const prereq of subGoal.prerequisites) {
        if (!nodeSet.has(prereq)) {
          orphans.push(subGoal.id);
          break;
        }
      }
    }

    return orphans;
  }

  private validateTimeDistribution(decomp: GoalDecomposition): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const total = decomp.estimatedDuration;

    // Check for extremely long sub-goals
    for (const sg of decomp.subGoals) {
      if (sg.estimatedMinutes > 180) {
        issues.push({
          type: 'warning',
          code: 'LONG_SUBGOAL',
          message: `Sub-goal "${sg.title}" may be too long (${sg.estimatedMinutes} min). Consider breaking it down.`,
        });
      }
    }

    // Check for very short total duration
    if (total < 30) {
      issues.push({
        type: 'warning',
        code: 'SHORT_DURATION',
        message: `Total estimated time (${total} min) seems too short for a learning goal.`,
      });
    }

    return issues;
  }

  private validateTypeDistribution(decomp: GoalDecomposition): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const typeCounts = new Map<string, number>();

    for (const sg of decomp.subGoals) {
      typeCounts.set(sg.type, (typeCounts.get(sg.type) || 0) + 1);
    }

    // Check for missing essential types
    if (!typeCounts.has('learn') && !typeCounts.has('practice')) {
      issues.push({
        type: 'warning',
        code: 'MISSING_LEARNING',
        message: 'Decomposition has no learn or practice activities.',
      });
    }

    // Check for imbalance
    const learnCount = typeCounts.get('learn') || 0;
    const practiceCount = typeCounts.get('practice') || 0;
    const assessCount = typeCounts.get('assess') || 0;

    if (learnCount > 0 && practiceCount === 0) {
      issues.push({
        type: 'info',
        code: 'NO_PRACTICE',
        message: 'Consider adding practice activities to reinforce learning.',
      });
    }

    if ((learnCount + practiceCount) > 3 && assessCount === 0) {
      issues.push({
        type: 'info',
        code: 'NO_ASSESSMENT',
        message: 'Consider adding assessment checkpoints to verify progress.',
      });
    }

    return issues;
  }

  private generateSubGoalId(): string {
    return `sg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
}

export interface DecompositionFeedback {
  adjustments?: SubGoalAdjustment[];
  addSubGoals?: Omit<SubGoal, 'id' | 'goalId' | 'status' | 'order'>[];
  removeSubGoalIds?: string[];
}

export interface SubGoalAdjustment {
  subGoalId: string;
  changes: Partial<SubGoal>;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createGoalDecomposer(config: GoalDecomposerConfig): GoalDecomposer {
  return new GoalDecomposer(config);
}
