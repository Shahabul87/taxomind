/**
 * Computer Adaptive Testing (CAT) with Item Response Theory (IRT) Engine
 *
 * Implements sophisticated adaptive testing algorithms:
 * - 3-Parameter Logistic (3PL) IRT Model
 * - Maximum Information Selection
 * - Expected A-Posteriori (EAP) ability estimation
 * - Variable-length stopping rules
 * - Content balancing with Bloom's taxonomy
 *
 * Standards: IRT psychometric theory, CAT best practices
 */

// IRT Parameter Types
export interface IRTParameters {
  a: number; // Discrimination parameter (0.5 - 2.5 typical)
  b: number; // Difficulty parameter (-3 to +3 logits)
  c: number; // Guessing parameter (0 - 0.35 typical)
}

export interface CATItem {
  id: string;
  irt: IRTParameters;
  content: {
    bloomsLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
    topic: string;
    subtopic?: string;
  };
  exposure: {
    count: number;
    rate: number;
    lastUsed?: Date;
  };
  statistics: {
    totalAttempts: number;
    correctResponses: number;
    averageTime: number; // seconds
  };
}

export interface CATResponse {
  itemId: string;
  response: 0 | 1; // 0 = incorrect, 1 = correct
  responseTime: number; // milliseconds
  timestamp: Date;
}

export interface AbilityEstimate {
  theta: number; // Ability estimate (-4 to +4 logits)
  se: number; // Standard error
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number; // e.g., 0.95 for 95% CI
  };
}

export interface CATState {
  sessionId: string;
  examId: string;
  userId: string;
  startTime: Date;
  currentAbility: AbilityEstimate;
  responses: CATResponse[];
  administeredItems: string[];
  contentBalance: Record<string, number>;
  bloomsBalance: Record<string, number>;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'TERMINATED';
  terminationReason?: string;
}

export interface CATConfig {
  // Item bank
  itemBank: CATItem[];

  // Stopping rules
  minItems: number;
  maxItems: number;
  sePrecisionThreshold: number; // Stop when SE below this (e.g., 0.3)
  maxTimeMinutes: number;

  // Content balancing
  bloomsDistribution?: Record<string, number>; // Target percentages
  topicDistribution?: Record<string, number>;

  // Exposure control
  maxExposureRate: number; // e.g., 0.3 = 30% max exposure
  enableExposureControl: boolean;

  // Initial ability
  initialTheta: number;
  initialSE: number;

  // Quadrature points for EAP estimation
  quadraturePoints: number;
  quadratureRange: [number, number];
}

// Default CAT configuration
export const defaultCATConfig: Partial<CATConfig> = {
  minItems: 10,
  maxItems: 50,
  sePrecisionThreshold: 0.3,
  maxTimeMinutes: 60,
  maxExposureRate: 0.3,
  enableExposureControl: true,
  initialTheta: 0,
  initialSE: 1.5,
  quadraturePoints: 41,
  quadratureRange: [-4, 4],
};

/**
 * 3-Parameter Logistic (3PL) IRT Model
 */
export class ThreePLModel {
  /**
   * Calculate probability of correct response given ability and item parameters
   * P(θ) = c + (1-c) / (1 + exp(-Da(θ-b)))
   * where D = 1.7 (scaling constant to approximate normal ogive)
   */
  static probability(theta: number, item: IRTParameters): number {
    const D = 1.7; // Scaling constant
    const { a, b, c } = item;

    const exponent = -D * a * (theta - b);
    const logistic = 1 / (1 + Math.exp(exponent));

    return c + (1 - c) * logistic;
  }

  /**
   * Calculate Fisher Information at given ability level
   * I(θ) = D²a²[(P(θ)-c)²/((1-c)²P(θ))]Q(θ)
   * where Q(θ) = 1 - P(θ)
   */
  static information(theta: number, item: IRTParameters): number {
    const D = 1.7;
    const { a, c } = item;

    const p = this.probability(theta, item);
    const q = 1 - p;

    if (p <= c || p >= 1) return 0;

    const numerator = Math.pow(D * a, 2) * Math.pow(p - c, 2);
    const denominator = Math.pow(1 - c, 2) * p;

    return (numerator / denominator) * q;
  }

  /**
   * Calculate log-likelihood of response pattern
   */
  static logLikelihood(
    theta: number,
    responses: { item: IRTParameters; response: 0 | 1 }[]
  ): number {
    let ll = 0;

    for (const { item, response } of responses) {
      const p = this.probability(theta, item);
      const safeP = Math.max(0.0001, Math.min(0.9999, p));

      if (response === 1) {
        ll += Math.log(safeP);
      } else {
        ll += Math.log(1 - safeP);
      }
    }

    return ll;
  }
}

/**
 * CAT Ability Estimator using Expected A-Posteriori (EAP) method
 */
export class EAPEstimator {
  private quadPoints: number[];
  private quadWeights: number[];
  private priorMean: number;
  private priorSD: number;

  constructor(
    numPoints: number = 41,
    range: [number, number] = [-4, 4],
    priorMean: number = 0,
    priorSD: number = 1
  ) {
    this.priorMean = priorMean;
    this.priorSD = priorSD;

    // Generate Gaussian quadrature points and weights
    const { points, weights } = this.gaussHermiteQuadrature(numPoints, range);
    this.quadPoints = points;
    this.quadWeights = weights;
  }

  /**
   * Estimate ability using EAP method
   */
  estimate(
    responses: { item: IRTParameters; response: 0 | 1 }[]
  ): AbilityEstimate {
    // If no responses, return prior
    if (responses.length === 0) {
      return {
        theta: this.priorMean,
        se: this.priorSD,
        confidenceInterval: {
          lower: this.priorMean - 1.96 * this.priorSD,
          upper: this.priorMean + 1.96 * this.priorSD,
          level: 0.95,
        },
      };
    }

    // Calculate posterior at each quadrature point
    const posteriors: number[] = [];
    let totalPosterior = 0;

    for (let i = 0; i < this.quadPoints.length; i++) {
      const theta = this.quadPoints[i];
      const weight = this.quadWeights[i];

      // Prior (normal distribution)
      const prior = this.normalPDF(theta, this.priorMean, this.priorSD);

      // Likelihood
      let likelihood = 1;
      for (const { item, response } of responses) {
        const p = ThreePLModel.probability(theta, item);
        likelihood *= response === 1 ? p : 1 - p;
      }

      // Posterior (proportional to prior × likelihood)
      const posterior = prior * likelihood * weight;
      posteriors.push(posterior);
      totalPosterior += posterior;
    }

    // Normalize posteriors
    const normalizedPosteriors = posteriors.map((p) => p / totalPosterior);

    // Calculate EAP estimate (expected value of posterior)
    let thetaEAP = 0;
    for (let i = 0; i < this.quadPoints.length; i++) {
      thetaEAP += this.quadPoints[i] * normalizedPosteriors[i];
    }

    // Calculate posterior variance and SE
    let variance = 0;
    for (let i = 0; i < this.quadPoints.length; i++) {
      variance +=
        Math.pow(this.quadPoints[i] - thetaEAP, 2) * normalizedPosteriors[i];
    }
    const se = Math.sqrt(variance);

    // 95% confidence interval
    const z95 = 1.96;

    return {
      theta: thetaEAP,
      se,
      confidenceInterval: {
        lower: thetaEAP - z95 * se,
        upper: thetaEAP + z95 * se,
        level: 0.95,
      },
    };
  }

  /**
   * Normal probability density function
   */
  private normalPDF(x: number, mean: number, sd: number): number {
    const coefficient = 1 / (sd * Math.sqrt(2 * Math.PI));
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(sd, 2));
    return coefficient * Math.exp(exponent);
  }

  /**
   * Generate Gauss-Hermite quadrature points and weights
   * (Simplified uniform distribution for educational purposes)
   */
  private gaussHermiteQuadrature(
    numPoints: number,
    range: [number, number]
  ): { points: number[]; weights: number[] } {
    const points: number[] = [];
    const weights: number[] = [];

    const step = (range[1] - range[0]) / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const theta = range[0] + i * step;
      points.push(theta);
      // Approximate equal weights for uniform quadrature
      weights.push(step);
    }

    return { points, weights };
  }
}

/**
 * Item Selection Algorithm - Maximum Information with Exposure Control
 */
export class ItemSelector {
  /**
   * Select next item using Maximum Fisher Information criterion
   * with content balancing and exposure control
   */
  static selectNextItem(
    availableItems: CATItem[],
    currentAbility: number,
    state: CATState,
    config: CATConfig
  ): CATItem | null {
    if (availableItems.length === 0) return null;

    // Filter out already administered items
    let candidates = availableItems.filter(
      (item) => !state.administeredItems.includes(item.id)
    );

    if (candidates.length === 0) return null;

    // Apply exposure control
    if (config.enableExposureControl) {
      candidates = this.applyExposureControl(candidates, config.maxExposureRate);
    }

    if (candidates.length === 0) return null;

    // Apply content balancing
    candidates = this.applyContentBalancing(candidates, state, config);

    if (candidates.length === 0) {
      // Fall back to all non-administered items
      candidates = availableItems.filter(
        (item) => !state.administeredItems.includes(item.id)
      );
    }

    // Calculate information for each candidate
    const itemInfos = candidates.map((item) => ({
      item,
      information: ThreePLModel.information(currentAbility, item.irt),
    }));

    // Sort by information (descending)
    itemInfos.sort((a, b) => b.information - a.information);

    // Select top item (or randomly from top 5 to add variability)
    const topItems = itemInfos.slice(0, Math.min(5, itemInfos.length));
    const selectedIndex = Math.floor(Math.random() * topItems.length);

    return topItems[selectedIndex].item;
  }

  /**
   * Apply Sympson-Hetter exposure control
   */
  private static applyExposureControl(
    items: CATItem[],
    maxRate: number
  ): CATItem[] {
    return items.filter((item) => {
      // Random exposure control - item exposed with probability inversely related to exposure rate
      const exposureProb = Math.min(1, maxRate / Math.max(item.exposure.rate, 0.01));
      return Math.random() < exposureProb;
    });
  }

  /**
   * Apply content balancing based on Bloom's taxonomy and topics
   */
  private static applyContentBalancing(
    items: CATItem[],
    state: CATState,
    config: CATConfig
  ): CATItem[] {
    // Calculate current distribution
    const totalItems = state.administeredItems.length;

    // Bloom's balancing
    if (config.bloomsDistribution && totalItems > 0) {
      const underrepresented: string[] = [];

      for (const [level, targetPct] of Object.entries(config.bloomsDistribution)) {
        const currentCount = state.bloomsBalance[level] || 0;
        const currentPct = currentCount / totalItems;

        if (currentPct < targetPct * 0.8) {
          // Allow 20% deviation
          underrepresented.push(level);
        }
      }

      if (underrepresented.length > 0) {
        const filtered = items.filter((item) =>
          underrepresented.includes(item.content.bloomsLevel)
        );
        if (filtered.length > 0) return filtered;
      }
    }

    // Topic balancing
    if (config.topicDistribution && totalItems > 0) {
      const underrepresentedTopics: string[] = [];

      for (const [topic, targetPct] of Object.entries(config.topicDistribution)) {
        const currentCount = state.contentBalance[topic] || 0;
        const currentPct = currentCount / totalItems;

        if (currentPct < targetPct * 0.8) {
          underrepresentedTopics.push(topic);
        }
      }

      if (underrepresentedTopics.length > 0) {
        const filtered = items.filter((item) =>
          underrepresentedTopics.includes(item.content.topic)
        );
        if (filtered.length > 0) return filtered;
      }
    }

    return items;
  }
}

/**
 * CAT Stopping Rules
 */
export class StoppingRules {
  /**
   * Check if test should terminate
   */
  static shouldTerminate(
    state: CATState,
    config: CATConfig
  ): { terminate: boolean; reason?: string } {
    const itemCount = state.responses.length;

    // Minimum items not reached
    if (itemCount < config.minItems) {
      return { terminate: false };
    }

    // Maximum items reached
    if (itemCount >= config.maxItems) {
      return { terminate: true, reason: 'Maximum number of items reached' };
    }

    // Precision threshold met
    if (state.currentAbility.se <= config.sePrecisionThreshold) {
      return {
        terminate: true,
        reason: `Precision threshold reached (SE = ${state.currentAbility.se.toFixed(3)})`,
      };
    }

    // Time limit exceeded
    const elapsedMinutes =
      (Date.now() - state.startTime.getTime()) / (1000 * 60);
    if (elapsedMinutes >= config.maxTimeMinutes) {
      return { terminate: true, reason: 'Time limit exceeded' };
    }

    // Item bank exhausted
    const remainingItems = config.itemBank.filter(
      (item) => !state.administeredItems.includes(item.id)
    );
    if (remainingItems.length === 0) {
      return { terminate: true, reason: 'Item bank exhausted' };
    }

    return { terminate: false };
  }
}

/**
 * Main CAT Engine
 */
export class CATEngine {
  private config: CATConfig;
  private estimator: EAPEstimator;
  private state: CATState | null = null;

  constructor(config: CATConfig) {
    this.config = { ...defaultCATConfig, ...config } as CATConfig;
    this.estimator = new EAPEstimator(
      this.config.quadraturePoints,
      this.config.quadratureRange,
      this.config.initialTheta,
      this.config.initialSE
    );
  }

  /**
   * Start a new CAT session
   */
  startSession(params: { examId: string; userId: string }): CATState {
    const initialEstimate = this.estimator.estimate([]);

    this.state = {
      sessionId: this.generateSessionId(),
      examId: params.examId,
      userId: params.userId,
      startTime: new Date(),
      currentAbility: initialEstimate,
      responses: [],
      administeredItems: [],
      contentBalance: {},
      bloomsBalance: {},
      status: 'IN_PROGRESS',
    };

    return { ...this.state };
  }

  /**
   * Get next item to administer
   */
  getNextItem(): CATItem | null {
    if (!this.state || this.state.status !== 'IN_PROGRESS') {
      return null;
    }

    // Check stopping rules
    const { terminate, reason } = StoppingRules.shouldTerminate(
      this.state,
      this.config
    );

    if (terminate) {
      this.state.status = 'COMPLETED';
      this.state.terminationReason = reason;
      return null;
    }

    // Select next item
    return ItemSelector.selectNextItem(
      this.config.itemBank,
      this.state.currentAbility.theta,
      this.state,
      this.config
    );
  }

  /**
   * Record response to an item
   */
  recordResponse(itemId: string, response: 0 | 1, responseTime: number): AbilityEstimate {
    if (!this.state || this.state.status !== 'IN_PROGRESS') {
      throw new Error('No active CAT session');
    }

    // Find the item
    const item = this.config.itemBank.find((i) => i.id === itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found in item bank`);
    }

    // Record response
    const catResponse: CATResponse = {
      itemId,
      response,
      responseTime,
      timestamp: new Date(),
    };

    this.state.responses.push(catResponse);
    this.state.administeredItems.push(itemId);

    // Update content balance
    this.state.contentBalance[item.content.topic] =
      (this.state.contentBalance[item.content.topic] || 0) + 1;

    // Update Bloom's balance
    this.state.bloomsBalance[item.content.bloomsLevel] =
      (this.state.bloomsBalance[item.content.bloomsLevel] || 0) + 1;

    // Update item exposure statistics
    item.exposure.count++;
    item.exposure.rate = item.exposure.count / (item.statistics.totalAttempts + 1);
    item.exposure.lastUsed = new Date();
    item.statistics.totalAttempts++;
    if (response === 1) item.statistics.correctResponses++;
    item.statistics.averageTime =
      (item.statistics.averageTime * (item.statistics.totalAttempts - 1) +
        responseTime / 1000) /
      item.statistics.totalAttempts;

    // Re-estimate ability
    const responseData = this.state.responses.map((r) => {
      const respItem = this.config.itemBank.find((i) => i.id === r.itemId);
      return {
        item: respItem!.irt,
        response: r.response,
      };
    });

    this.state.currentAbility = this.estimator.estimate(responseData);

    return { ...this.state.currentAbility };
  }

  /**
   * Get current session state
   */
  getState(): CATState | null {
    return this.state ? { ...this.state } : null;
  }

  /**
   * Terminate session early
   */
  terminateSession(reason: string): CATState | null {
    if (!this.state) return null;

    this.state.status = 'TERMINATED';
    this.state.terminationReason = reason;

    return { ...this.state };
  }

  /**
   * Generate final score report
   */
  generateReport(): CATScoreReport | null {
    if (!this.state) return null;

    const ability = this.state.currentAbility;

    // Convert theta to scaled score (e.g., 0-100)
    const scaledScore = this.thetaToScaledScore(ability.theta);

    // Calculate performance by Bloom's level
    const bloomsPerformance: Record<string, { correct: number; total: number; percentage: number }> = {};

    for (const response of this.state.responses) {
      const item = this.config.itemBank.find((i) => i.id === response.itemId);
      if (!item) continue;

      const level = item.content.bloomsLevel;
      if (!bloomsPerformance[level]) {
        bloomsPerformance[level] = { correct: 0, total: 0, percentage: 0 };
      }

      bloomsPerformance[level].total++;
      if (response.response === 1) {
        bloomsPerformance[level].correct++;
      }
    }

    // Calculate percentages
    for (const level of Object.keys(bloomsPerformance)) {
      const data = bloomsPerformance[level];
      data.percentage = Math.round((data.correct / data.total) * 100);
    }

    // Calculate reliability (test information at theta)
    let totalInfo = 0;
    for (const response of this.state.responses) {
      const item = this.config.itemBank.find((i) => i.id === response.itemId);
      if (item) {
        totalInfo += ThreePLModel.information(ability.theta, item.irt);
      }
    }
    const reliability = 1 - 1 / Math.max(1, totalInfo);

    return {
      sessionId: this.state.sessionId,
      examId: this.state.examId,
      userId: this.state.userId,
      completedAt: new Date(),
      status: this.state.status,
      terminationReason: this.state.terminationReason,
      ability: {
        theta: ability.theta,
        se: ability.se,
        scaledScore,
        percentile: this.thetaToPercentile(ability.theta),
        confidenceInterval: ability.confidenceInterval,
      },
      itemsAdministered: this.state.responses.length,
      correctResponses: this.state.responses.filter((r) => r.response === 1).length,
      accuracy: Math.round(
        (this.state.responses.filter((r) => r.response === 1).length /
          this.state.responses.length) *
          100
      ),
      totalTimeSeconds: Math.round(
        (Date.now() - this.state.startTime.getTime()) / 1000
      ),
      averageResponseTime:
        this.state.responses.reduce((sum, r) => sum + r.responseTime, 0) /
        this.state.responses.length /
        1000,
      bloomsPerformance,
      reliability: Math.round(reliability * 100) / 100,
      classification: this.getPerformanceClassification(scaledScore),
    };
  }

  /**
   * Convert theta to scaled score (0-100)
   */
  private thetaToScaledScore(theta: number): number {
    // Linear transformation: theta -4 to +4 → score 0 to 100
    const score = ((theta + 4) / 8) * 100;
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Convert theta to percentile (assuming normal distribution)
   */
  private thetaToPercentile(theta: number): number {
    // Standard normal CDF approximation
    const z = theta; // theta is already in logit/z-score scale
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    const absZ = Math.abs(z);
    const t = 1 / (1 + p * absZ);
    const y =
      1 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ / 2);

    const cdf = 0.5 * (1 + sign * y);
    return Math.round(cdf * 100);
  }

  /**
   * Get performance classification based on scaled score
   */
  private getPerformanceClassification(
    scaledScore: number
  ): 'EXCELLENT' | 'PROFICIENT' | 'BASIC' | 'BELOW_BASIC' {
    if (scaledScore >= 85) return 'EXCELLENT';
    if (scaledScore >= 70) return 'PROFICIENT';
    if (scaledScore >= 50) return 'BASIC';
    return 'BELOW_BASIC';
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `cat_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * CAT Score Report
 */
export interface CATScoreReport {
  sessionId: string;
  examId: string;
  userId: string;
  completedAt: Date;
  status: CATState['status'];
  terminationReason?: string;
  ability: {
    theta: number;
    se: number;
    scaledScore: number;
    percentile: number;
    confidenceInterval: AbilityEstimate['confidenceInterval'];
  };
  itemsAdministered: number;
  correctResponses: number;
  accuracy: number;
  totalTimeSeconds: number;
  averageResponseTime: number;
  bloomsPerformance: Record<
    string,
    { correct: number; total: number; percentage: number }
  >;
  reliability: number;
  classification: 'EXCELLENT' | 'PROFICIENT' | 'BASIC' | 'BELOW_BASIC';
}

/**
 * Item Bank Calibration Utilities
 */
export class IRTCalibration {
  /**
   * Estimate IRT parameters from response data (simplified MML-EM)
   * Note: For production, use specialized software like BILOG-MG or flexMIRT
   */
  static estimateParameters(
    responses: { correct: number; total: number; averageAbility: number }[]
  ): IRTParameters {
    // Simplified estimation based on classical test theory
    // In production, use proper marginal maximum likelihood estimation

    const avgDifficulty = responses.reduce((sum, r, i) => {
      const pValue = r.correct / r.total;
      // Convert p-value to difficulty (logit)
      const difficulty = -Math.log(pValue / (1 - pValue + 0.001));
      return sum + difficulty;
    }, 0) / responses.length;

    // Estimate discrimination from point-biserial correlation
    const avgPValue = responses.reduce((sum, r) => sum + r.correct / r.total, 0) / responses.length;
    const discrimination = Math.min(2.5, Math.max(0.5, 1 + (0.5 - avgPValue) * 2));

    // Estimate guessing from lowest performance
    const minPValue = Math.min(...responses.map((r) => r.correct / r.total));
    const guessing = Math.max(0, Math.min(0.35, minPValue * 0.8));

    return {
      a: Math.round(discrimination * 100) / 100,
      b: Math.round(avgDifficulty * 100) / 100,
      c: Math.round(guessing * 100) / 100,
    };
  }

  /**
   * Validate IRT parameters are within acceptable ranges
   */
  static validateParameters(params: IRTParameters): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (params.a < 0.3 || params.a > 3.0) {
      issues.push(
        `Discrimination (a=${params.a}) outside typical range [0.3, 3.0]`
      );
    }

    if (params.b < -4 || params.b > 4) {
      issues.push(`Difficulty (b=${params.b}) outside typical range [-4, 4]`);
    }

    if (params.c < 0 || params.c > 0.4) {
      issues.push(`Guessing (c=${params.c}) outside typical range [0, 0.4]`);
    }

    return { valid: issues.length === 0, issues };
  }
}

// Export factory function
export function createCATEngine(config: CATConfig): CATEngine {
  return new CATEngine(config);
}
