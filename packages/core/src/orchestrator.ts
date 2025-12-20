/**
 * @sam-ai/core - Agent Orchestrator
 * Dependency-aware engine orchestration
 */

import type {
  SAMConfig,
  SAMContext,
  SAMLogger,
  EngineResult,
  OrchestrationResult,
  OrchestrationOptions,
  AggregatedResponse,
  OrchestrationMetadata,
  SAMSuggestion,
  SAMAction,
  SAMPageType,
} from './types';
import { BaseEngine } from './engines/base';
import { OrchestrationError } from './errors';

// ============================================================================
// TYPES
// ============================================================================

interface EngineRegistration {
  engine: BaseEngine;
  enabled: boolean;
}

interface ExecutionTier {
  engines: string[];
  parallel: boolean;
}

// ============================================================================
// ORCHESTRATOR
// ============================================================================

export class SAMAgentOrchestrator {
  private engines: Map<string, EngineRegistration> = new Map();
  private executionTiers: ExecutionTier[] = [];
  private readonly logger: SAMLogger;

  constructor(config: SAMConfig) {
    this.logger = config.logger ?? console;
  }

  // ============================================================================
  // ENGINE REGISTRATION
  // ============================================================================

  /**
   * Register an engine with the orchestrator
   */
  registerEngine(engine: BaseEngine, enabled = true): void {
    if (this.engines.has(engine.name)) {
      this.logger.warn(`[Orchestrator] Engine "${engine.name}" already registered, replacing`);
    }

    this.engines.set(engine.name, { engine, enabled });
    this.logger.debug(`[Orchestrator] Registered engine: ${engine.name} v${engine.version}`);

    // Recalculate execution order
    this.recalculateExecutionTiers();
  }

  /**
   * Unregister an engine
   */
  unregisterEngine(name: string): boolean {
    const removed = this.engines.delete(name);
    if (removed) {
      this.recalculateExecutionTiers();
      this.logger.debug(`[Orchestrator] Unregistered engine: ${name}`);
    }
    return removed;
  }

  /**
   * Enable/disable an engine
   */
  setEngineEnabled(name: string, enabled: boolean): void {
    const registration = this.engines.get(name);
    if (registration) {
      registration.enabled = enabled;
      this.logger.debug(`[Orchestrator] Engine "${name}" ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Get registered engine names
   */
  getRegisteredEngines(): string[] {
    return Array.from(this.engines.keys());
  }

  /**
   * Get enabled engine names
   */
  getEnabledEngines(): string[] {
    return Array.from(this.engines.entries())
      .filter(([, reg]) => reg.enabled)
      .map(([name]) => name);
  }

  // ============================================================================
  // ORCHESTRATION
  // ============================================================================

  /**
   * Run all enabled engines in dependency order
   */
  async orchestrate(
    context: SAMContext,
    query?: string,
    options?: OrchestrationOptions
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const results: Record<string, EngineResult> = {};
    const enginesFailed: string[] = [];
    const enginesCached: string[] = [];

    this.logger.debug(`[Orchestrator] Starting orchestration with query: "${query?.substring(0, 50)}..."`);

    // Determine which engines to run
    const enginesToRun = this.getEnginesToRun(options?.engines);

    // Initialize all engines
    await this.initializeEngines(enginesToRun);

    // Execute engines in tiers
    for (const tier of this.executionTiers) {
      const tierEngines = tier.engines.filter((name) => enginesToRun.includes(name));

      if (tierEngines.length === 0) continue;

      if (tier.parallel) {
        // Execute tier in parallel
        const tierResults = await Promise.all(
          tierEngines.map((name) => this.executeEngine(name, context, query, results))
        );

        // Collect results
        for (const result of tierResults) {
          if (result) {
            results[result.engineName] = result;
            if (!result.success) enginesFailed.push(result.engineName);
            if (result.metadata.cached) enginesCached.push(result.engineName);
          }
        }
      } else {
        // Execute tier sequentially
        for (const name of tierEngines) {
          const result = await this.executeEngine(name, context, query, results);
          if (result) {
            results[result.engineName] = result;
            if (!result.success) enginesFailed.push(result.engineName);
            if (result.metadata.cached) enginesCached.push(result.engineName);
          }
        }
      }
    }

    // Aggregate results
    const response = this.aggregateResults(results, context, query);

    const metadata: OrchestrationMetadata = {
      totalExecutionTime: Date.now() - startTime,
      enginesExecuted: Object.keys(results),
      enginesFailed,
      enginesCached,
      parallelTiers: this.executionTiers.map((t) => t.engines),
    };

    this.logger.debug(
      `[Orchestrator] Completed in ${metadata.totalExecutionTime}ms. ` +
        `Executed: ${metadata.enginesExecuted.length}, Failed: ${enginesFailed.length}, Cached: ${enginesCached.length}`
    );

    return {
      success: enginesFailed.length === 0,
      results,
      response,
      metadata,
    };
  }

  /**
   * Run a single engine by name
   */
  async runEngine(
    name: string,
    context: SAMContext,
    query?: string,
    previousResults?: Record<string, EngineResult>
  ): Promise<EngineResult | null> {
    return this.executeEngine(name, context, query, previousResults ?? {});
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Execute a single engine
   */
  private async executeEngine(
    name: string,
    context: SAMContext,
    query: string | undefined,
    previousResults: Record<string, EngineResult>
  ): Promise<EngineResult | null> {
    const registration = this.engines.get(name);

    if (!registration || !registration.enabled) {
      return null;
    }

    try {
      const result = await registration.engine.execute({
        context,
        query,
        previousResults,
      });
      return result as EngineResult;
    } catch (error) {
      this.logger.error(`[Orchestrator] Engine "${name}" threw: ${(error as Error).message}`);
      return {
        engineName: name,
        success: false,
        data: null,
        metadata: {
          executionTime: 0,
          cached: false,
          version: registration.engine.version,
        },
        error: {
          code: 'ENGINE_ERROR',
          message: (error as Error).message,
          recoverable: true,
        },
      };
    }
  }

  /**
   * Initialize engines
   */
  private async initializeEngines(names: string[]): Promise<void> {
    const initPromises = names
      .map((name) => this.engines.get(name)?.engine)
      .filter((engine): engine is BaseEngine => engine !== undefined)
      .filter((engine) => !engine.isInitialized())
      .map((engine) => engine.initialize());

    await Promise.all(initPromises);
  }

  /**
   * Get list of engines to run based on options
   */
  private getEnginesToRun(requestedEngines?: string[]): string[] {
    const enabledEngines = this.getEnabledEngines();

    if (!requestedEngines || requestedEngines.length === 0) {
      return enabledEngines;
    }

    // Filter to only requested engines that are enabled
    return requestedEngines.filter((name) => enabledEngines.includes(name));
  }

  /**
   * Calculate execution tiers based on dependencies (topological sort)
   */
  private recalculateExecutionTiers(): void {
    const engines = Array.from(this.engines.entries())
      .filter(([, reg]) => reg.enabled)
      .map(([name, reg]) => ({
        name,
        dependencies: reg.engine.dependencies,
      }));

    const tiers: ExecutionTier[] = [];
    const scheduled = new Set<string>();
    const remaining = new Set(engines.map((e) => e.name));

    while (remaining.size > 0) {
      const tier: string[] = [];

      for (const engine of engines) {
        if (scheduled.has(engine.name)) continue;
        if (!remaining.has(engine.name)) continue;

        // Check if all dependencies are scheduled
        const depsScheduled = engine.dependencies.every(
          (dep) => scheduled.has(dep) || !remaining.has(dep)
        );

        if (depsScheduled) {
          tier.push(engine.name);
        }
      }

      if (tier.length === 0 && remaining.size > 0) {
        // Circular dependency detected
        throw new OrchestrationError(
          `Circular dependency detected among engines: ${Array.from(remaining).join(', ')}`
        );
      }

      for (const name of tier) {
        scheduled.add(name);
        remaining.delete(name);
      }

      if (tier.length > 0) {
        tiers.push({
          engines: tier,
          parallel: tier.length > 1, // Parallelize if multiple engines in tier
        });
      }
    }

    this.executionTiers = tiers;
    this.logger.debug(
      `[Orchestrator] Execution tiers: ${tiers.map((t) => `[${t.engines.join(', ')}]`).join(' -> ')}`
    );
  }

  /**
   * Aggregate results from all engines into a unified response
   */
  private aggregateResults(
    results: Record<string, EngineResult>,
    context: SAMContext,
    query?: string
  ): AggregatedResponse {
    // Check if we have a response engine result
    const responseEngine = results['response'];
    if (responseEngine?.success && responseEngine.data) {
      const data = responseEngine.data as unknown as AggregatedResponse;
      return {
        message: data.message || this.generateDefaultMessage(context, query),
        suggestions: data.suggestions || [],
        actions: data.actions || this.getPageActions(context.page.type),
        insights: data.insights || this.extractInsights(results),
        blooms: data.blooms,
      };
    }

    // Fallback aggregation
    return {
      message: this.generateDefaultMessage(context, query),
      suggestions: this.extractSuggestions(results),
      actions: this.getPageActions(context.page.type),
      insights: this.extractInsights(results),
      blooms: this.extractBloomsAnalysis(results),
    };
  }

  /**
   * Generate a default message based on context
   */
  private generateDefaultMessage(context: SAMContext, query?: string): string {
    if (query) {
      return `I've analyzed your request and prepared insights based on the current context.`;
    }

    const pageMessages: Record<SAMPageType, string> = {
      dashboard: "Welcome! I'm here to help you manage your courses and track your progress.",
      'courses-list': 'I can help you analyze your courses, create new ones, or find insights.',
      'course-detail': 'I can help you improve this course structure, generate content, or analyze its effectiveness.',
      'course-create': "Let's create an amazing course together. I'll guide you through the process.",
      'chapter-detail': 'I can help you develop this chapter, create assessments, or improve the content.',
      'section-detail': 'I can help you enhance this section with better content or assessments.',
      analytics: 'I can help you understand your analytics and provide actionable insights.',
      settings: 'I can help you configure your preferences and settings.',
      learning: 'I\'m here to help you learn! Ask me anything about the course material.',
      exam: 'I can help you prepare for this assessment or explain any concepts.',
      other: 'How can I assist you today?',
    };

    return pageMessages[context.page.type] || pageMessages.other;
  }

  /**
   * Extract suggestions from engine results
   */
  private extractSuggestions(results: Record<string, EngineResult>): SAMSuggestion[] {
    const suggestions: SAMSuggestion[] = [];
    let id = 0;

    for (const result of Object.values(results)) {
      if (!result.success || !result.data) continue;

      const data = result.data as Record<string, unknown>;

      if (Array.isArray(data.suggestions)) {
        for (const suggestion of data.suggestions) {
          if (typeof suggestion === 'string') {
            suggestions.push({
              id: `sug_${id++}`,
              label: suggestion.substring(0, 50),
              text: suggestion,
              type: 'quick-reply',
            });
          } else if (typeof suggestion === 'object' && suggestion !== null) {
            suggestions.push({
              ...(suggestion as SAMSuggestion),
              id: `sug_${id++}`,
            });
          }
        }
      }

      if (Array.isArray(data.recommendations)) {
        for (const rec of data.recommendations) {
          if (typeof rec === 'string') {
            suggestions.push({
              id: `sug_${id++}`,
              label: rec.substring(0, 50),
              text: rec,
              type: 'action',
            });
          }
        }
      }
    }

    // Deduplicate and limit
    const unique = suggestions.filter(
      (s, i, arr) => arr.findIndex((x) => x.text === s.text) === i
    );

    return unique.slice(0, 5);
  }

  /**
   * Get page-specific actions
   */
  private getPageActions(pageType: SAMPageType): SAMAction[] {
    const actionMap: Record<SAMPageType, SAMAction[]> = {
      dashboard: [
        { id: 'act_1', type: 'navigate', label: 'View Courses', payload: { path: '/teacher/courses' } },
        { id: 'act_2', type: 'analyze', label: 'Get Insights', payload: { type: 'overview' } },
      ],
      'courses-list': [
        { id: 'act_1', type: 'navigate', label: 'Create Course', payload: { path: '/teacher/create' } },
        { id: 'act_2', type: 'analyze', label: 'Analyze Courses', payload: { type: 'courses-overview' } },
      ],
      'course-detail': [
        { id: 'act_1', type: 'generate', label: 'Generate Chapters', payload: { type: 'chapters' } },
        { id: 'act_2', type: 'analyze', label: 'Analyze Structure', payload: { type: 'blooms' } },
      ],
      'course-create': [
        { id: 'act_1', type: 'generate', label: 'Generate Blueprint', payload: { type: 'blueprint' } },
        { id: 'act_2', type: 'analyze', label: 'Validate Structure', payload: { type: 'validation' } },
      ],
      'chapter-detail': [
        { id: 'act_1', type: 'generate', label: 'Generate Sections', payload: { type: 'sections' } },
        { id: 'act_2', type: 'generate', label: 'Create Assessment', payload: { type: 'assessment' } },
      ],
      'section-detail': [
        { id: 'act_1', type: 'generate', label: 'Enhance Content', payload: { type: 'content' } },
        { id: 'act_2', type: 'analyze', label: 'Analyze Blooms', payload: { type: 'blooms' } },
      ],
      analytics: [
        { id: 'act_1', type: 'analyze', label: 'Deep Analysis', payload: { type: 'comprehensive' } },
        { id: 'act_2', type: 'generate', label: 'Generate Report', payload: { type: 'report' } },
      ],
      settings: [],
      learning: [
        { id: 'act_1', type: 'custom', label: 'Explain This', payload: { type: 'explain' } },
        { id: 'act_2', type: 'custom', label: 'Quiz Me', payload: { type: 'quiz' } },
      ],
      exam: [
        { id: 'act_1', type: 'custom', label: 'Get Hint', payload: { type: 'hint' } },
        { id: 'act_2', type: 'custom', label: 'Explain Answer', payload: { type: 'explain' } },
      ],
      other: [],
    };

    return actionMap[pageType] || [];
  }

  /**
   * Extract insights from engine results
   */
  private extractInsights(results: Record<string, EngineResult>): Record<string, unknown> {
    const insights: Record<string, unknown> = {};

    for (const [name, result] of Object.entries(results)) {
      if (result.success && result.data) {
        insights[name] = result.data;
      }
    }

    return insights;
  }

  /**
   * Extract Bloom's analysis from results
   */
  private extractBloomsAnalysis(results: Record<string, EngineResult>): AggregatedResponse['blooms'] {
    const bloomsResult = results['blooms'];

    if (bloomsResult?.success && bloomsResult.data) {
      const data = bloomsResult.data as Record<string, unknown>;
      if (data.distribution && data.dominantLevel) {
        return data as unknown as AggregatedResponse['blooms'];
      }
    }

    return undefined;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createOrchestrator(config: SAMConfig): SAMAgentOrchestrator {
  return new SAMAgentOrchestrator(config);
}
