/**
 * Quality Gate Pipeline
 *
 * Orchestrates all quality gates, runs them in parallel/sequential,
 * calculates weighted scores, and handles enhancement attempts.
 */

import type {
  QualityGate,
  QualityGatePipelineConfig,
  GeneratedContent,
  ValidationResult,
  GateResult,
  GateIssue,
  ValidationMetadata,
} from './types';
import { DEFAULT_PIPELINE_CONFIG } from './types';
import { CompletenessGate } from './completeness-gate';
import { ExampleQualityGate } from './example-quality-gate';
import { DifficultyMatchGate } from './difficulty-gate';
import { StructureGate } from './structure-gate';
import { DepthGate } from './depth-gate';

/**
 * Content Quality Gate Pipeline
 *
 * Validates AI-generated content through multiple quality gates.
 * Gates run in parallel by default and results are aggregated.
 */
export class ContentQualityGatePipeline {
  private gates: Map<string, QualityGate>;
  private config: Required<QualityGatePipelineConfig>;
  private iterationCount: number = 0;

  constructor(config?: Partial<QualityGatePipelineConfig>) {
    this.config = {
      ...DEFAULT_PIPELINE_CONFIG,
      ...config,
    } as Required<QualityGatePipelineConfig>;

    this.gates = new Map();
    this.initializeDefaultGates();
  }

  /**
   * Initialize default quality gates
   */
  private initializeDefaultGates(): void {
    const defaultGates: QualityGate[] = [
      new CompletenessGate(),
      new ExampleQualityGate(),
      new DifficultyMatchGate(),
      new StructureGate(),
      new DepthGate(),
    ];

    for (const gate of defaultGates) {
      this.gates.set(gate.name, gate);
    }
  }

  /**
   * Add a custom gate to the pipeline
   */
  addGate(gate: QualityGate): void {
    this.gates.set(gate.name, gate);
  }

  /**
   * Remove a gate from the pipeline
   */
  removeGate(gateName: string): boolean {
    return this.gates.delete(gateName);
  }

  /**
   * Get a gate by name
   */
  getGate(gateName: string): QualityGate | undefined {
    return this.gates.get(gateName);
  }

  /**
   * Get all gate names
   */
  getGateNames(): string[] {
    return Array.from(this.gates.keys());
  }

  /**
   * Validate content through all quality gates
   */
  async validate(content: GeneratedContent): Promise<ValidationResult> {
    const startTime = Date.now();
    this.iterationCount = 0;

    return this.validateWithRetry(content, startTime);
  }

  /**
   * Validate with retry/enhancement logic
   */
  private async validateWithRetry(
    content: GeneratedContent,
    startTime: number
  ): Promise<ValidationResult> {
    this.iterationCount++;

    // Get applicable gates
    const applicableGates = this.getApplicableGates(content);

    // Run gates (parallel or sequential)
    const gateResults = await this.runGates(applicableGates, content);

    // Calculate overall score
    const overallScore = this.calculateWeightedScore(gateResults);

    // Identify failed gates and critical issues
    const failedGates = gateResults
      .filter((r) => !r.passed)
      .map((r) => r.gateName);

    const criticalIssues = gateResults.flatMap((r) =>
      r.issues.filter((i) => i.severity === 'critical')
    );

    // Aggregate suggestions
    const allSuggestions = [...new Set(gateResults.flatMap((r) => r.suggestions))];

    // Determine if passed
    const passed =
      overallScore >= this.config.threshold && criticalIssues.length === 0;

    // Build result
    const result: ValidationResult = {
      passed,
      overallScore,
      content,
      gateResults,
      failedGates,
      iterations: this.iterationCount,
      totalProcessingTimeMs: Date.now() - startTime,
      allSuggestions,
      criticalIssues,
      metadata: this.buildMetadata(passed, overallScore, criticalIssues),
    };

    // Attempt enhancement if not passed and within iteration limit
    if (
      !passed &&
      this.config.enableEnhancement &&
      this.iterationCount < this.config.maxIterations
    ) {
      const enhancedContent = await this.enhanceContent(content, gateResults);
      if (enhancedContent) {
        return this.validateWithRetry(enhancedContent, startTime);
      }
    }

    return result;
  }

  /**
   * Get gates applicable to the content type
   */
  private getApplicableGates(content: GeneratedContent): QualityGate[] {
    return Array.from(this.gates.values()).filter((gate) => {
      // Check if gate is enabled
      if (
        this.config.enabledGates &&
        this.config.enabledGates.length > 0 &&
        !this.config.enabledGates.includes(gate.name)
      ) {
        return false;
      }

      // Check if gate is disabled
      if (
        this.config.disabledGates &&
        this.config.disabledGates.includes(gate.name)
      ) {
        return false;
      }

      // Check if gate applies to this content type
      return gate.applicableTypes.includes(content.type);
    });
  }

  /**
   * Run gates on content
   */
  private async runGates(
    gates: QualityGate[],
    content: GeneratedContent
  ): Promise<GateResult[]> {
    if (this.config.parallel) {
      // Run in parallel with timeout
      const promises = gates.map((gate) =>
        this.runGateWithTimeout(gate, content)
      );
      return Promise.all(promises);
    } else {
      // Run sequentially
      const results: GateResult[] = [];
      for (const gate of gates) {
        const result = await this.runGateWithTimeout(gate, content);
        results.push(result);

        // Early exit if critical failure
        if (result.issues.some((i) => i.severity === 'critical')) {
          break;
        }
      }
      return results;
    }
  }

  /**
   * Run a single gate with timeout
   */
  private async runGateWithTimeout(
    gate: QualityGate,
    content: GeneratedContent
  ): Promise<GateResult> {
    const gateTimeout = this.config.timeoutMs / this.gates.size;

    try {
      const resultPromise = gate.evaluate(content);
      const timeoutPromise = new Promise<GateResult>((_, reject) =>
        setTimeout(() => reject(new Error('Gate timeout')), gateTimeout)
      );

      const result = await Promise.race([resultPromise, timeoutPromise]);

      // Apply custom weight if configured
      if (this.config.gateWeights?.[gate.name]) {
        result.weight = this.config.gateWeights[gate.name];
      }

      return result;
    } catch (error) {
      // Return a failed result on error
      return {
        gateName: gate.name,
        passed: false,
        score: 0,
        weight: gate.defaultWeight,
        issues: [
          {
            severity: 'high',
            description: `Gate failed to evaluate: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        suggestions: [],
        processingTimeMs: gateTimeout,
        metadata: { error: true },
      };
    }
  }

  /**
   * Calculate weighted overall score
   */
  private calculateWeightedScore(results: GateResult[]): number {
    if (results.length === 0) return 100;

    let totalWeight = 0;
    let weightedSum = 0;

    for (const result of results) {
      weightedSum += result.score * result.weight;
      totalWeight += result.weight;
    }

    return Math.round((weightedSum / totalWeight) * 10) / 10;
  }

  /**
   * Attempt to enhance content based on gate failures
   */
  private async enhanceContent(
    content: GeneratedContent,
    results: GateResult[]
  ): Promise<GeneratedContent | null> {
    // Get gates that support enhancement
    const failedResults = results.filter((r) => !r.passed);

    for (const result of failedResults) {
      const gate = this.gates.get(result.gateName);
      if (gate?.enhance) {
        try {
          const enhanced = await gate.enhance(content, result.issues);
          if (enhanced.content !== content.content) {
            return enhanced;
          }
        } catch {
          // Enhancement failed, continue to next gate
        }
      }
    }

    // No enhancement available
    return null;
  }

  /**
   * Build validation metadata
   */
  private buildMetadata(
    passed: boolean,
    score: number,
    criticalIssues: GateIssue[]
  ): ValidationMetadata {
    let reason: string;

    if (passed) {
      reason = 'All quality gates passed';
    } else if (criticalIssues.length > 0) {
      reason = `Critical issues found: ${criticalIssues.map((i) => i.description).join('; ')}`;
    } else {
      reason = `Overall score ${score} is below threshold ${this.config.threshold}`;
    }

    return {
      timestamp: new Date().toISOString(),
      config: this.config,
      enhancementAttempted: this.iterationCount > 1,
      reason,
    };
  }

  /**
   * Quick validation - runs only essential gates
   */
  async quickValidate(content: GeneratedContent): Promise<{
    passed: boolean;
    score: number;
    criticalIssues: GateIssue[];
  }> {
    const essentialGates = ['CompletenessGate', 'StructureGate'];
    const gates = Array.from(this.gates.values()).filter((g) =>
      essentialGates.includes(g.name)
    );

    const results = await this.runGates(gates, content);
    const score = this.calculateWeightedScore(results);
    const criticalIssues = results.flatMap((r) =>
      r.issues.filter((i) => i.severity === 'critical')
    );

    return {
      passed: score >= this.config.threshold && criticalIssues.length === 0,
      score,
      criticalIssues,
    };
  }

  /**
   * Get pipeline statistics
   */
  getStats(): {
    gateCount: number;
    gateNames: string[];
    config: QualityGatePipelineConfig;
  } {
    return {
      gateCount: this.gates.size,
      gateNames: Array.from(this.gates.keys()),
      config: this.config,
    };
  }

  /**
   * Update pipeline configuration
   */
  updateConfig(config: Partial<QualityGatePipelineConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}

/**
 * Factory function to create a ContentQualityGatePipeline
 */
export function createQualityGatePipeline(
  config?: Partial<QualityGatePipelineConfig>
): ContentQualityGatePipeline {
  return new ContentQualityGatePipeline(config);
}

/**
 * Validate content using default pipeline configuration
 */
export async function validateContent(
  content: GeneratedContent,
  config?: Partial<QualityGatePipelineConfig>
): Promise<ValidationResult> {
  const pipeline = createQualityGatePipeline(config);
  return pipeline.validate(content);
}

/**
 * Quick validation for content
 */
export async function quickValidateContent(
  content: GeneratedContent
): Promise<{ passed: boolean; score: number; criticalIssues: GateIssue[] }> {
  const pipeline = createQualityGatePipeline({
    parallel: true,
    enableEnhancement: false,
  });
  return pipeline.quickValidate(content);
}
