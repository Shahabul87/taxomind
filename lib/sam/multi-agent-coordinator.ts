/**
 * SAM Multi-Agent Coordinator
 *
 * Enables collaborative decision-making between specialized SAM agents.
 * Coordinates pedagogy, safety, quality, and learning path agents to
 * produce unified, high-quality educational responses.
 *
 * Features:
 * - Agent registration and lifecycle management
 * - Parallel and sequential execution modes
 * - Priority-based conflict resolution
 * - Consensus building for controversial decisions
 * - Audit trail for agent interactions
 */

import { logger } from '@/lib/logger';
import { getTaxomindContext, getStore, getObservabilityStores } from './taxomind-context';
import {
  createConfidenceScorer,
  createQualityTracker,
  type ConfidenceScorer,
  type QualityTracker,
  ConfidenceLevel,
} from '@sam-ai/agentic';
import type { SAMContext, SAMConfig } from '@sam-ai/core';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Agent type categories
 */
export enum AgentType {
  PEDAGOGY = 'pedagogy',
  SAFETY = 'safety',
  QUALITY = 'quality',
  LEARNING_PATH = 'learning_path',
  MEMORY = 'memory',
  ASSESSMENT = 'assessment',
  CONTENT = 'content',
  PERSONALIZATION = 'personalization',
}

/**
 * Agent execution priority (lower number = higher priority)
 */
export enum AgentPriority {
  CRITICAL = 0,   // Safety checks - must run first and can veto
  HIGH = 1,       // Quality gates - should influence final output
  MEDIUM = 2,     // Core educational agents
  LOW = 3,        // Enhancement agents
  BACKGROUND = 4, // Analytics and logging agents
}

/**
 * Agent status
 */
export enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

/**
 * Decision type for agent recommendations
 */
export enum DecisionType {
  APPROVE = 'approve',
  MODIFY = 'modify',
  REJECT = 'reject',
  DEFER = 'defer',
}

/**
 * Conflict resolution strategy
 */
export enum ConflictResolution {
  PRIORITY = 'priority',        // Higher priority agent wins
  CONSENSUS = 'consensus',      // Majority vote
  WEIGHTED = 'weighted',        // Weighted by confidence
  CONSERVATIVE = 'conservative', // Most restrictive wins
  PERMISSIVE = 'permissive',    // Least restrictive wins
}

/**
 * Agent input data
 */
export interface AgentInput {
  query: string;
  context: Partial<SAMContext>;
  previousDecisions?: AgentDecision[];
  metadata?: Record<string, unknown>;
}

/**
 * Agent decision output
 */
export interface AgentDecision {
  agentId: string;
  agentType: AgentType;
  decision: DecisionType;
  confidence: number;
  reasoning: string;
  modifications?: ContentModification[];
  warnings?: Warning[];
  suggestions?: Suggestion[];
  metadata?: Record<string, unknown>;
  executionTimeMs: number;
  timestamp: Date;
}

/**
 * Content modification recommendation
 */
export interface ContentModification {
  type: 'add' | 'remove' | 'replace' | 'reorder';
  target: string;
  content?: string;
  reason: string;
  priority: 'required' | 'recommended' | 'optional';
}

/**
 * Warning from an agent
 */
export interface Warning {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  action?: string;
}

/**
 * Suggestion from an agent
 */
export interface Suggestion {
  type: string;
  content: string;
  rationale: string;
  confidence: number;
}

/**
 * Registered agent definition
 */
export interface RegisteredAgent {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  priority: AgentPriority;
  enabled: boolean;
  dependencies: string[];
  conflictsWith: string[];
  executor: AgentExecutor;
  status: AgentStatus;
  lastExecutionMs?: number;
  errorCount: number;
}

/**
 * Agent executor function
 */
export type AgentExecutor = (input: AgentInput) => Promise<AgentDecision>;

/**
 * Coordination result
 */
export interface CoordinationResult {
  success: boolean;
  finalDecision: DecisionType;
  confidence: number;
  reasoning: string;
  content?: string;
  modifications: ContentModification[];
  warnings: Warning[];
  suggestions: Suggestion[];
  agentDecisions: AgentDecision[];
  conflicts: ConflictRecord[];
  executionOrder: string[];
  totalExecutionTimeMs: number;
  metadata: {
    agentsRun: number;
    agentsSkipped: number;
    agentsFailed: number;
    conflictsResolved: number;
    consensusReached: boolean;
  };
}

/**
 * Conflict record
 */
export interface ConflictRecord {
  agentA: string;
  agentB: string;
  issue: string;
  resolution: ConflictResolution;
  winner?: string;
  reasoning: string;
  timestamp: Date;
}

/**
 * Coordinator configuration
 */
export interface MultiAgentCoordinatorConfig {
  /** Default conflict resolution strategy */
  defaultConflictResolution: ConflictResolution;
  /** Maximum parallel agents */
  maxParallelAgents: number;
  /** Timeout per agent (ms) */
  agentTimeoutMs: number;
  /** Minimum consensus threshold (0-1) */
  consensusThreshold: number;
  /** Enable audit logging */
  enableAuditLog: boolean;
  /** Maximum retries per agent */
  maxAgentRetries: number;
  /** Safety agent can veto */
  safetyVetoEnabled: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_COORDINATOR_CONFIG: MultiAgentCoordinatorConfig = {
  defaultConflictResolution: ConflictResolution.WEIGHTED,
  maxParallelAgents: 4,
  agentTimeoutMs: 5000,
  consensusThreshold: 0.6,
  enableAuditLog: true,
  maxAgentRetries: 2,
  safetyVetoEnabled: true,
};

// ============================================================================
// MULTI-AGENT COORDINATOR
// ============================================================================

/**
 * Multi-Agent Coordinator
 * Orchestrates multiple specialized agents for collaborative decision-making
 */
export class MultiAgentCoordinator {
  private config: MultiAgentCoordinatorConfig;
  private agents: Map<string, RegisteredAgent> = new Map();
  private executionOrder: string[] = [];
  private auditLog: CoordinationResult[] = [];
  private confidenceScorer: ConfidenceScorer;
  private qualityTracker: QualityTracker;

  constructor(config: Partial<MultiAgentCoordinatorConfig> = {}) {
    this.config = { ...DEFAULT_COORDINATOR_CONFIG, ...config };

    // Initialize support services
    this.confidenceScorer = createConfidenceScorer({ logger });
    this.qualityTracker = createQualityTracker({ logger });

    logger.info('[MultiAgentCoordinator] Initialized', {
      config: this.config,
    });
  }

  // ---------------------------------------------------------------------------
  // Agent Registration
  // ---------------------------------------------------------------------------

  /**
   * Register an agent with the coordinator
   */
  registerAgent(params: {
    id: string;
    type: AgentType;
    name: string;
    description: string;
    priority: AgentPriority;
    executor: AgentExecutor;
    dependencies?: string[];
    conflictsWith?: string[];
  }): void {
    if (this.agents.has(params.id)) {
      logger.warn('[MultiAgentCoordinator] Agent already registered, replacing', {
        agentId: params.id,
      });
    }

    const agent: RegisteredAgent = {
      id: params.id,
      type: params.type,
      name: params.name,
      description: params.description,
      priority: params.priority,
      enabled: true,
      dependencies: params.dependencies ?? [],
      conflictsWith: params.conflictsWith ?? [],
      executor: params.executor,
      status: AgentStatus.IDLE,
      errorCount: 0,
    };

    this.agents.set(params.id, agent);
    this.recalculateExecutionOrder();

    logger.info('[MultiAgentCoordinator] Agent registered', {
      agentId: params.id,
      type: params.type,
      priority: params.priority,
    });
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): boolean {
    const removed = this.agents.delete(agentId);
    if (removed) {
      this.recalculateExecutionOrder();
      logger.info('[MultiAgentCoordinator] Agent unregistered', { agentId });
    }
    return removed;
  }

  /**
   * Enable or disable an agent
   */
  setAgentEnabled(agentId: string, enabled: boolean): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.enabled = enabled;
      this.recalculateExecutionOrder();
      logger.debug('[MultiAgentCoordinator] Agent status changed', {
        agentId,
        enabled,
      });
    }
  }

  /**
   * Get registered agent by ID
   */
  getAgent(agentId: string): RegisteredAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): RegisteredAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type: AgentType): RegisteredAgent[] {
    return this.getAllAgents().filter((a) => a.type === type);
  }

  // ---------------------------------------------------------------------------
  // Coordination
  // ---------------------------------------------------------------------------

  /**
   * Coordinate all enabled agents to make a decision
   */
  async coordinate(input: AgentInput): Promise<CoordinationResult> {
    const startTime = Date.now();
    const agentDecisions: AgentDecision[] = [];
    const conflicts: ConflictRecord[] = [];
    let agentsSkipped = 0;
    let agentsFailed = 0;

    logger.info('[MultiAgentCoordinator] Starting coordination', {
      query: input.query.substring(0, 100),
      enabledAgents: this.executionOrder.length,
    });

    // Execute agents in calculated order
    const executedAgents: string[] = [];

    for (const agentId of this.executionOrder) {
      const agent = this.agents.get(agentId);
      if (!agent || !agent.enabled) {
        agentsSkipped++;
        continue;
      }

      // Check if dependencies are satisfied
      const depsUnsatisfied = agent.dependencies.filter(
        (dep) => !executedAgents.includes(dep)
      );
      if (depsUnsatisfied.length > 0) {
        logger.warn('[MultiAgentCoordinator] Skipping agent due to unsatisfied dependencies', {
          agentId,
          missingDeps: depsUnsatisfied,
        });
        agentsSkipped++;
        continue;
      }

      // Execute agent
      try {
        agent.status = AgentStatus.RUNNING;
        const agentStart = Date.now();

        const decision = await this.executeAgentWithTimeout(
          agent,
          {
            ...input,
            previousDecisions: agentDecisions,
          }
        );

        agent.status = AgentStatus.COMPLETED;
        agent.lastExecutionMs = Date.now() - agentStart;

        agentDecisions.push(decision);
        executedAgents.push(agentId);

        // Check for safety veto
        if (
          this.config.safetyVetoEnabled &&
          agent.type === AgentType.SAFETY &&
          decision.decision === DecisionType.REJECT
        ) {
          logger.warn('[MultiAgentCoordinator] Safety agent vetoed', {
            agentId,
            reasoning: decision.reasoning,
          });

          // Early return with rejection
          return this.buildRejectionResult(
            agentDecisions,
            conflicts,
            executedAgents,
            Date.now() - startTime,
            { agentsRun: executedAgents.length, agentsSkipped, agentsFailed }
          );
        }

        // Detect conflicts with previous decisions
        const newConflicts = this.detectConflicts(decision, agentDecisions.slice(0, -1));
        conflicts.push(...newConflicts);

      } catch (error) {
        agent.status = AgentStatus.FAILED;
        agent.errorCount++;
        agentsFailed++;

        logger.error('[MultiAgentCoordinator] Agent execution failed', {
          agentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Resolve conflicts
    const resolvedConflicts = await this.resolveConflicts(conflicts, agentDecisions);
    conflicts.push(...resolvedConflicts);

    // Build final result
    const result = this.buildFinalResult(
      agentDecisions,
      conflicts,
      executedAgents,
      Date.now() - startTime,
      { agentsRun: executedAgents.length, agentsSkipped, agentsFailed }
    );

    // Record in audit log
    if (this.config.enableAuditLog) {
      this.auditLog.push(result);
      if (this.auditLog.length > 1000) {
        this.auditLog.shift(); // Keep last 1000 entries
      }
    }

    logger.info('[MultiAgentCoordinator] Coordination complete', {
      success: result.success,
      finalDecision: result.finalDecision,
      confidence: result.confidence,
      agentsRun: result.metadata.agentsRun,
      conflictsResolved: result.metadata.conflictsResolved,
      executionTimeMs: result.totalExecutionTimeMs,
    });

    return result;
  }

  /**
   * Execute specific agents only
   */
  async coordinateWithAgents(
    input: AgentInput,
    agentIds: string[]
  ): Promise<CoordinationResult> {
    const enabledAgents = this.getAllAgents().map((a) => a.id);
    const originalStates = new Map<string, boolean>();

    // Temporarily disable agents not in the list
    for (const agent of this.agents.values()) {
      originalStates.set(agent.id, agent.enabled);
      agent.enabled = agentIds.includes(agent.id);
    }

    try {
      return await this.coordinate(input);
    } finally {
      // Restore original states
      for (const [id, enabled] of originalStates) {
        const agent = this.agents.get(id);
        if (agent) {
          agent.enabled = enabled;
        }
      }
      this.recalculateExecutionOrder();
    }
  }

  // ---------------------------------------------------------------------------
  // Agent Execution
  // ---------------------------------------------------------------------------

  /**
   * Execute an agent with timeout
   */
  private async executeAgentWithTimeout(
    agent: RegisteredAgent,
    input: AgentInput
  ): Promise<AgentDecision> {
    const timeoutPromise = new Promise<AgentDecision>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Agent ${agent.id} timed out after ${this.config.agentTimeoutMs}ms`));
      }, this.config.agentTimeoutMs);
    });

    return Promise.race([
      agent.executor(input),
      timeoutPromise,
    ]);
  }

  // ---------------------------------------------------------------------------
  // Conflict Detection and Resolution
  // ---------------------------------------------------------------------------

  /**
   * Detect conflicts between a new decision and previous decisions
   */
  private detectConflicts(
    newDecision: AgentDecision,
    previousDecisions: AgentDecision[]
  ): ConflictRecord[] {
    const conflicts: ConflictRecord[] = [];
    const newAgent = this.agents.get(newDecision.agentId);

    if (!newAgent) return conflicts;

    for (const prevDecision of previousDecisions) {
      // Check if agents explicitly conflict
      if (newAgent.conflictsWith.includes(prevDecision.agentId)) {
        conflicts.push({
          agentA: prevDecision.agentId,
          agentB: newDecision.agentId,
          issue: 'Agents are marked as conflicting',
          resolution: this.config.defaultConflictResolution,
          reasoning: 'Explicit conflict declaration',
          timestamp: new Date(),
        });
        continue;
      }

      // Check for decision conflicts
      if (
        (newDecision.decision === DecisionType.APPROVE &&
          prevDecision.decision === DecisionType.REJECT) ||
        (newDecision.decision === DecisionType.REJECT &&
          prevDecision.decision === DecisionType.APPROVE)
      ) {
        conflicts.push({
          agentA: prevDecision.agentId,
          agentB: newDecision.agentId,
          issue: 'Conflicting approve/reject decisions',
          resolution: this.config.defaultConflictResolution,
          reasoning: `${prevDecision.agentId}: ${prevDecision.decision}, ${newDecision.agentId}: ${newDecision.decision}`,
          timestamp: new Date(),
        });
      }

      // Check for modification conflicts
      if (newDecision.modifications && prevDecision.modifications) {
        const conflictingMods = this.findConflictingModifications(
          newDecision.modifications,
          prevDecision.modifications
        );

        for (const conflict of conflictingMods) {
          conflicts.push({
            agentA: prevDecision.agentId,
            agentB: newDecision.agentId,
            issue: `Conflicting modifications on target: ${conflict}`,
            resolution: this.config.defaultConflictResolution,
            reasoning: 'Both agents want to modify the same target',
            timestamp: new Date(),
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Find conflicting modifications
   */
  private findConflictingModifications(
    modsA: ContentModification[],
    modsB: ContentModification[]
  ): string[] {
    const conflicts: string[] = [];

    for (const modA of modsA) {
      for (const modB of modsB) {
        if (modA.target === modB.target && modA.type !== modB.type) {
          conflicts.push(modA.target);
        }
      }
    }

    return conflicts;
  }

  /**
   * Resolve conflicts between agent decisions
   */
  private async resolveConflicts(
    conflicts: ConflictRecord[],
    decisions: AgentDecision[]
  ): Promise<ConflictRecord[]> {
    const resolvedConflicts: ConflictRecord[] = [];

    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict, decisions);
      resolvedConflicts.push(resolution);
    }

    return resolvedConflicts;
  }

  /**
   * Resolve a single conflict
   */
  private async resolveConflict(
    conflict: ConflictRecord,
    decisions: AgentDecision[]
  ): Promise<ConflictRecord> {
    const decisionA = decisions.find((d) => d.agentId === conflict.agentA);
    const decisionB = decisions.find((d) => d.agentId === conflict.agentB);
    const agentA = this.agents.get(conflict.agentA);
    const agentB = this.agents.get(conflict.agentB);

    if (!decisionA || !decisionB || !agentA || !agentB) {
      return {
        ...conflict,
        reasoning: 'Could not resolve - missing agent data',
      };
    }

    let winner: string | undefined;
    let reasoning: string;

    switch (conflict.resolution) {
      case ConflictResolution.PRIORITY:
        winner = agentA.priority <= agentB.priority ? conflict.agentA : conflict.agentB;
        reasoning = `Priority resolution: ${winner} has higher priority`;
        break;

      case ConflictResolution.WEIGHTED:
        winner = decisionA.confidence >= decisionB.confidence ? conflict.agentA : conflict.agentB;
        reasoning = `Weighted resolution: ${winner} has higher confidence (${Math.max(decisionA.confidence, decisionB.confidence).toFixed(2)})`;
        break;

      case ConflictResolution.CONSERVATIVE:
        // Most restrictive wins (reject > modify > approve)
        winner = this.getMoreRestrictiveAgent(decisionA, decisionB, conflict);
        reasoning = `Conservative resolution: ${winner} has more restrictive decision`;
        break;

      case ConflictResolution.PERMISSIVE:
        // Least restrictive wins (approve > modify > reject)
        winner = this.getLessRestrictiveAgent(decisionA, decisionB, conflict);
        reasoning = `Permissive resolution: ${winner} has less restrictive decision`;
        break;

      case ConflictResolution.CONSENSUS:
      default:
        // Use weighted confidence as tiebreaker
        winner = decisionA.confidence >= decisionB.confidence ? conflict.agentA : conflict.agentB;
        reasoning = `Consensus resolution: ${winner} selected based on confidence`;
        break;
    }

    return {
      ...conflict,
      winner,
      reasoning,
    };
  }

  /**
   * Get the more restrictive agent
   */
  private getMoreRestrictiveAgent(
    decisionA: AgentDecision,
    decisionB: AgentDecision,
    conflict: ConflictRecord
  ): string {
    const restrictiveness: Record<DecisionType, number> = {
      [DecisionType.REJECT]: 3,
      [DecisionType.MODIFY]: 2,
      [DecisionType.DEFER]: 1,
      [DecisionType.APPROVE]: 0,
    };

    const scoreA = restrictiveness[decisionA.decision];
    const scoreB = restrictiveness[decisionB.decision];

    return scoreA >= scoreB ? conflict.agentA : conflict.agentB;
  }

  /**
   * Get the less restrictive agent
   */
  private getLessRestrictiveAgent(
    decisionA: AgentDecision,
    decisionB: AgentDecision,
    conflict: ConflictRecord
  ): string {
    const restrictiveness: Record<DecisionType, number> = {
      [DecisionType.REJECT]: 3,
      [DecisionType.MODIFY]: 2,
      [DecisionType.DEFER]: 1,
      [DecisionType.APPROVE]: 0,
    };

    const scoreA = restrictiveness[decisionA.decision];
    const scoreB = restrictiveness[decisionB.decision];

    return scoreA <= scoreB ? conflict.agentA : conflict.agentB;
  }

  // ---------------------------------------------------------------------------
  // Result Building
  // ---------------------------------------------------------------------------

  /**
   * Build rejection result (safety veto)
   */
  private buildRejectionResult(
    decisions: AgentDecision[],
    conflicts: ConflictRecord[],
    executionOrder: string[],
    totalTimeMs: number,
    metadata: { agentsRun: number; agentsSkipped: number; agentsFailed: number }
  ): CoordinationResult {
    const safetyDecision = decisions.find(
      (d) => this.agents.get(d.agentId)?.type === AgentType.SAFETY && d.decision === DecisionType.REJECT
    );

    return {
      success: false,
      finalDecision: DecisionType.REJECT,
      confidence: safetyDecision?.confidence ?? 1.0,
      reasoning: safetyDecision?.reasoning ?? 'Safety veto - content rejected',
      modifications: [],
      warnings: safetyDecision?.warnings ?? [],
      suggestions: safetyDecision?.suggestions ?? [],
      agentDecisions: decisions,
      conflicts,
      executionOrder,
      totalExecutionTimeMs: totalTimeMs,
      metadata: {
        ...metadata,
        conflictsResolved: 0,
        consensusReached: false,
      },
    };
  }

  /**
   * Build final coordination result
   */
  private buildFinalResult(
    decisions: AgentDecision[],
    conflicts: ConflictRecord[],
    executionOrder: string[],
    totalTimeMs: number,
    metadata: { agentsRun: number; agentsSkipped: number; agentsFailed: number }
  ): CoordinationResult {
    // Calculate final decision based on weighted voting
    const { finalDecision, confidence, reasoning } = this.calculateFinalDecision(decisions, conflicts);

    // Aggregate modifications (applying conflict resolutions)
    const modifications = this.aggregateModifications(decisions, conflicts);

    // Aggregate warnings
    const warnings = decisions.flatMap((d) => d.warnings ?? []);

    // Aggregate suggestions
    const suggestions = this.aggregateSuggestions(decisions);

    // Check if consensus was reached
    const consensusReached = this.checkConsensus(decisions);

    return {
      success: finalDecision !== DecisionType.REJECT,
      finalDecision,
      confidence,
      reasoning,
      modifications,
      warnings,
      suggestions,
      agentDecisions: decisions,
      conflicts,
      executionOrder,
      totalExecutionTimeMs: totalTimeMs,
      metadata: {
        ...metadata,
        conflictsResolved: conflicts.filter((c) => c.winner).length,
        consensusReached,
      },
    };
  }

  /**
   * Calculate final decision from agent decisions
   */
  private calculateFinalDecision(
    decisions: AgentDecision[],
    conflicts: ConflictRecord[]
  ): { finalDecision: DecisionType; confidence: number; reasoning: string } {
    if (decisions.length === 0) {
      return {
        finalDecision: DecisionType.DEFER,
        confidence: 0,
        reasoning: 'No agent decisions available',
      };
    }

    // Count weighted votes
    const votes: Record<DecisionType, number> = {
      [DecisionType.APPROVE]: 0,
      [DecisionType.MODIFY]: 0,
      [DecisionType.REJECT]: 0,
      [DecisionType.DEFER]: 0,
    };

    let totalWeight = 0;

    for (const decision of decisions) {
      const agent = this.agents.get(decision.agentId);
      if (!agent) continue;

      // Weight by priority and confidence
      const priorityWeight = 1 / (agent.priority + 1);
      const weight = priorityWeight * decision.confidence;

      // Check if this agent lost any conflicts
      const lostConflict = conflicts.some((c) => c.winner && c.winner !== decision.agentId &&
        (c.agentA === decision.agentId || c.agentB === decision.agentId));

      if (!lostConflict) {
        votes[decision.decision] += weight;
        totalWeight += weight;
      }
    }

    // Determine winner
    let finalDecision = DecisionType.DEFER;
    let maxVotes = 0;

    for (const [decision, voteCount] of Object.entries(votes)) {
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        finalDecision = decision as DecisionType;
      }
    }

    const confidence = totalWeight > 0 ? maxVotes / totalWeight : 0;

    // Build reasoning
    const topContributors = decisions
      .filter((d) => d.decision === finalDecision)
      .slice(0, 3)
      .map((d) => `${d.agentId}: ${d.reasoning.substring(0, 50)}...`)
      .join('; ');

    return {
      finalDecision,
      confidence,
      reasoning: `${finalDecision} with ${(confidence * 100).toFixed(1)}% confidence. Key factors: ${topContributors}`,
    };
  }

  /**
   * Aggregate modifications from decisions
   */
  private aggregateModifications(
    decisions: AgentDecision[],
    conflicts: ConflictRecord[]
  ): ContentModification[] {
    const modifications: ContentModification[] = [];
    const usedTargets = new Set<string>();

    // Sort decisions by agent priority
    const sortedDecisions = [...decisions].sort((a, b) => {
      const agentA = this.agents.get(a.agentId);
      const agentB = this.agents.get(b.agentId);
      return (agentA?.priority ?? 999) - (agentB?.priority ?? 999);
    });

    for (const decision of sortedDecisions) {
      if (!decision.modifications) continue;

      // Check if this agent lost any conflicts
      const lostConflict = conflicts.some((c) =>
        c.winner && c.winner !== decision.agentId &&
        (c.agentA === decision.agentId || c.agentB === decision.agentId)
      );

      if (lostConflict) continue;

      for (const mod of decision.modifications) {
        // Avoid duplicate target modifications
        if (!usedTargets.has(mod.target)) {
          modifications.push(mod);
          usedTargets.add(mod.target);
        }
      }
    }

    return modifications;
  }

  /**
   * Aggregate suggestions from decisions
   */
  private aggregateSuggestions(decisions: AgentDecision[]): Suggestion[] {
    const allSuggestions = decisions.flatMap((d) => d.suggestions ?? []);

    // Deduplicate by content
    const unique: Suggestion[] = [];
    const seen = new Set<string>();

    for (const suggestion of allSuggestions) {
      const key = suggestion.content.toLowerCase().substring(0, 100);
      if (!seen.has(key)) {
        unique.push(suggestion);
        seen.add(key);
      }
    }

    // Sort by confidence and return top suggestions
    return unique
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  /**
   * Check if consensus was reached
   */
  private checkConsensus(decisions: AgentDecision[]): boolean {
    if (decisions.length < 2) return true;

    // Count decisions by type
    const decisionCounts: Record<DecisionType, number> = {
      [DecisionType.APPROVE]: 0,
      [DecisionType.MODIFY]: 0,
      [DecisionType.REJECT]: 0,
      [DecisionType.DEFER]: 0,
    };

    for (const decision of decisions) {
      decisionCounts[decision.decision]++;
    }

    // Check if any single decision has consensus
    const totalDecisions = decisions.length;
    for (const count of Object.values(decisionCounts)) {
      if (count / totalDecisions >= this.config.consensusThreshold) {
        return true;
      }
    }

    return false;
  }

  // ---------------------------------------------------------------------------
  // Execution Order Management
  // ---------------------------------------------------------------------------

  /**
   * Recalculate agent execution order based on dependencies and priorities
   */
  private recalculateExecutionOrder(): void {
    const enabledAgents = this.getAllAgents().filter((a) => a.enabled);

    // Topological sort with priority consideration
    const order: string[] = [];
    const scheduled = new Set<string>();
    const remaining = new Set(enabledAgents.map((a) => a.id));

    while (remaining.size > 0) {
      // Find agents whose dependencies are satisfied
      const ready = enabledAgents.filter((agent) => {
        if (scheduled.has(agent.id)) return false;
        if (!remaining.has(agent.id)) return false;
        return agent.dependencies.every(
          (dep) => scheduled.has(dep) || !remaining.has(dep)
        );
      });

      if (ready.length === 0 && remaining.size > 0) {
        logger.warn('[MultiAgentCoordinator] Circular dependency detected', {
          remaining: Array.from(remaining),
        });
        // Add remaining agents anyway to prevent infinite loop
        for (const id of remaining) {
          order.push(id);
        }
        break;
      }

      // Sort by priority and add to order
      ready.sort((a, b) => a.priority - b.priority);

      for (const agent of ready) {
        order.push(agent.id);
        scheduled.add(agent.id);
        remaining.delete(agent.id);
      }
    }

    this.executionOrder = order;

    logger.debug('[MultiAgentCoordinator] Execution order recalculated', {
      order: this.executionOrder,
    });
  }

  // ---------------------------------------------------------------------------
  // Utility Methods
  // ---------------------------------------------------------------------------

  /**
   * Get audit log
   */
  getAuditLog(limit?: number): CoordinationResult[] {
    const log = [...this.auditLog].reverse();
    return limit ? log.slice(0, limit) : log;
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  /**
   * Get agent statistics
   */
  getAgentStats(): Record<string, {
    executions: number;
    avgExecutionMs: number;
    errorRate: number;
  }> {
    const stats: Record<string, {
      executions: number;
      avgExecutionMs: number;
      errorRate: number;
    }> = {};

    for (const [id, agent] of this.agents) {
      const coordinations = this.auditLog.filter((r) =>
        r.agentDecisions.some((d) => d.agentId === id)
      );

      const executions = coordinations.length;
      const avgExecutionMs = executions > 0
        ? coordinations.reduce((sum, r) => {
            const decision = r.agentDecisions.find((d) => d.agentId === id);
            return sum + (decision?.executionTimeMs ?? 0);
          }, 0) / executions
        : 0;

      stats[id] = {
        executions,
        avgExecutionMs,
        errorRate: executions > 0 ? agent.errorCount / executions : 0,
      };
    }

    return stats;
  }

  /**
   * Get current configuration
   */
  getConfig(): MultiAgentCoordinatorConfig {
    return { ...this.config };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

let coordinatorInstance: MultiAgentCoordinator | null = null;

/**
 * Get the multi-agent coordinator singleton
 */
export function getMultiAgentCoordinator(
  config?: Partial<MultiAgentCoordinatorConfig>
): MultiAgentCoordinator {
  if (!coordinatorInstance) {
    coordinatorInstance = new MultiAgentCoordinator(config);
  }
  return coordinatorInstance;
}

/**
 * Create a new multi-agent coordinator instance
 * Use this for testing or isolated contexts
 */
export function createMultiAgentCoordinator(
  config?: Partial<MultiAgentCoordinatorConfig>
): MultiAgentCoordinator {
  return new MultiAgentCoordinator(config);
}

/**
 * Reset the coordinator singleton (for testing)
 */
export function resetMultiAgentCoordinator(): void {
  coordinatorInstance = null;
}

// ============================================================================
// PRE-BUILT AGENT EXECUTORS
// ============================================================================

/**
 * Create a safety agent executor
 */
export function createSafetyAgentExecutor(): AgentExecutor {
  return async (input: AgentInput): Promise<AgentDecision> => {
    const startTime = Date.now();

    // Simulate safety check
    const hasProblems = false; // In production, this would call @sam-ai/safety

    return {
      agentId: 'safety-agent',
      agentType: AgentType.SAFETY,
      decision: hasProblems ? DecisionType.REJECT : DecisionType.APPROVE,
      confidence: 0.95,
      reasoning: hasProblems ? 'Safety concerns detected' : 'Content passed safety checks',
      warnings: [],
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    };
  };
}

/**
 * Create a quality agent executor
 */
export function createQualityAgentExecutor(): AgentExecutor {
  return async (input: AgentInput): Promise<AgentDecision> => {
    const startTime = Date.now();

    // Simulate quality check
    const qualityScore = 0.85;

    return {
      agentId: 'quality-agent',
      agentType: AgentType.QUALITY,
      decision: qualityScore >= 0.7 ? DecisionType.APPROVE : DecisionType.MODIFY,
      confidence: qualityScore,
      reasoning: `Quality score: ${(qualityScore * 100).toFixed(0)}%`,
      suggestions: qualityScore < 0.9 ? [{
        type: 'improvement',
        content: 'Consider adding more examples',
        rationale: 'Examples improve understanding',
        confidence: 0.8,
      }] : [],
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    };
  };
}

/**
 * Create a pedagogy agent executor
 */
export function createPedagogyAgentExecutor(): AgentExecutor {
  return async (input: AgentInput): Promise<AgentDecision> => {
    const startTime = Date.now();

    return {
      agentId: 'pedagogy-agent',
      agentType: AgentType.PEDAGOGY,
      decision: DecisionType.APPROVE,
      confidence: 0.88,
      reasoning: 'Content aligns with pedagogical best practices',
      suggestions: [{
        type: 'scaffolding',
        content: 'Consider progressive disclosure of concepts',
        rationale: 'Gradual complexity increases retention',
        confidence: 0.75,
      }],
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    };
  };
}
