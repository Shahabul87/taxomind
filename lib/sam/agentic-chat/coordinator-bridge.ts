/**
 * Coordinator Bridge
 *
 * Adapter between AgenticChatProcessor and the orphaned MultiAgentCoordinator.
 * Provides delegation logic, result mapping, and fallback handling.
 */

import { logger } from '@/lib/logger';
import {
  getMultiAgentCoordinator,
  AgentType,
  AgentPriority,
  DecisionType,
  createSafetyAgentExecutor,
  createQualityAgentExecutor,
  createPedagogyAgentExecutor,
  type CoordinationResult,
  type AgentInput,
} from '@/lib/sam/multi-agent-coordinator';
import type { ClassifiedIntent, AgenticChatData } from './types';

// =============================================================================
// TYPES
// =============================================================================

interface DelegationDecision {
  shouldDelegate: boolean;
  reason: string;
}

interface CoordinatorBridgeResult {
  success: boolean;
  content: string | null;
  suggestions: string[];
  warnings: string[];
  confidence: number;
  agentsUsed: number;
  executionTimeMs: number;
}

// =============================================================================
// COMPLEXITY CRITERIA
// =============================================================================

/**
 * Intent types that benefit from multi-agent coordination
 */
const COMPLEX_INTENTS = new Set([
  'content_generate',
  'assessment',
]);

/**
 * Keywords that signal cross-domain complexity
 */
const CROSS_DOMAIN_KEYWORDS = [
  'compare', 'analyze', 'evaluate', 'design', 'plan',
  'comprehensive', 'detailed', 'step by step', 'multiple',
];

// =============================================================================
// COORDINATOR BRIDGE
// =============================================================================

export class CoordinatorBridge {
  private initialized = false;

  /**
   * Determine whether the message should be delegated to the multi-agent coordinator
   */
  shouldDelegate(intent: ClassifiedIntent, message: string): DelegationDecision {
    // Complex intent types
    if (COMPLEX_INTENTS.has(intent.intent)) {
      return { shouldDelegate: true, reason: `Complex intent type: ${intent.intent}` };
    }

    // Cross-domain keyword detection
    const lowerMessage = message.toLowerCase();
    const matchedKeywords = CROSS_DOMAIN_KEYWORDS.filter((kw) => lowerMessage.includes(kw));
    if (matchedKeywords.length >= 2) {
      return {
        shouldDelegate: true,
        reason: `Cross-domain complexity: ${matchedKeywords.join(', ')}`,
      };
    }

    // Multi-tool queries (intent suggests multiple tools needed)
    if (intent.toolHints.length >= 2) {
      return { shouldDelegate: true, reason: 'Multiple tool hints detected' };
    }

    return { shouldDelegate: false, reason: 'Simple query - standard processing sufficient' };
  }

  /**
   * Delegate processing to the multi-agent coordinator
   */
  async delegateToCoordinator(
    message: string,
    context: {
      userId: string;
      courseId?: string;
      intent: ClassifiedIntent;
    }
  ): Promise<CoordinatorBridgeResult> {
    const startTime = Date.now();

    try {
      this.ensureInitialized();

      const coordinator = getMultiAgentCoordinator();
      const agentInput: AgentInput = {
        query: message,
        context: {
          user: {
            id: context.userId,
            role: 'student',
            preferences: {},
            capabilities: [],
          },
          page: {
            type: context.courseId ? 'course-detail' : 'dashboard',
            path: context.courseId ? `/courses/${context.courseId}` : '/dashboard',
            entityId: context.courseId,
            capabilities: [],
            breadcrumb: [],
          },
        },
        metadata: {
          intent: context.intent.intent,
          toolHints: context.intent.toolHints,
        },
      };

      const result = await coordinator.coordinate(agentInput);

      return this.mapCoordinatorResult(result, Date.now() - startTime);
    } catch (error) {
      logger.error('[CoordinatorBridge] Delegation failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        content: null,
        suggestions: [],
        warnings: ['Multi-agent coordination failed, using standard processing'],
        confidence: 0,
        agentsUsed: 0,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Map coordinator result to a format compatible with agentic chat data
   */
  private mapCoordinatorResult(
    result: CoordinationResult,
    executionTimeMs: number
  ): CoordinatorBridgeResult {
    const suggestions = result.suggestions.map((s) => s.content);
    const warnings = result.warnings.map((w) => `[${w.severity}] ${w.message}`);

    // Build content from modifications if available
    let content: string | null = null;
    if (result.content) {
      content = result.content;
    } else if (result.modifications.length > 0) {
      const requiredMods = result.modifications.filter((m) => m.priority === 'required');
      if (requiredMods.length > 0) {
        content = requiredMods.map((m) => m.content ?? m.reason).join('\n');
      }
    }

    return {
      success: result.success,
      content,
      suggestions,
      warnings,
      confidence: result.confidence,
      agentsUsed: result.metadata.agentsRun,
      executionTimeMs,
    };
  }

  /**
   * Ensure the coordinator has default agents registered
   */
  private ensureInitialized(): void {
    if (this.initialized) return;

    const coordinator = getMultiAgentCoordinator();

    // Register default agents if none exist
    if (coordinator.getAllAgents().length === 0) {
      coordinator.registerAgent({
        id: 'safety-agent',
        type: AgentType.SAFETY,
        name: 'Safety Agent',
        description: 'Checks content for safety and policy compliance',
        priority: AgentPriority.CRITICAL,
        executor: createSafetyAgentExecutor(),
      });

      coordinator.registerAgent({
        id: 'quality-agent',
        type: AgentType.QUALITY,
        name: 'Quality Agent',
        description: 'Evaluates content quality and suggests improvements',
        priority: AgentPriority.HIGH,
        executor: createQualityAgentExecutor(),
        dependencies: ['safety-agent'],
      });

      coordinator.registerAgent({
        id: 'pedagogy-agent',
        type: AgentType.PEDAGOGY,
        name: 'Pedagogy Agent',
        description: 'Ensures pedagogical best practices',
        priority: AgentPriority.MEDIUM,
        executor: createPedagogyAgentExecutor(),
        dependencies: ['safety-agent'],
      });

      logger.info('[CoordinatorBridge] Default agents registered');
    }

    this.initialized = true;
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let bridgeInstance: CoordinatorBridge | null = null;

export function getCoordinatorBridge(): CoordinatorBridge {
  if (!bridgeInstance) {
    bridgeInstance = new CoordinatorBridge();
  }
  return bridgeInstance;
}
