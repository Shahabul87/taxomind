"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DEFAULT_MASTERY_TRACKER_CONFIG: () => DEFAULT_MASTERY_TRACKER_CONFIG,
  DEFAULT_MEMORY_INTEGRATION_CONFIG: () => DEFAULT_MEMORY_INTEGRATION_CONFIG,
  DEFAULT_PATHWAY_CALCULATOR_CONFIG: () => DEFAULT_PATHWAY_CALCULATOR_CONFIG,
  DEFAULT_SPACED_REPETITION_CONFIG: () => DEFAULT_SPACED_REPETITION_CONFIG,
  EvaluationMemoryIntegrationImpl: () => EvaluationMemoryIntegrationImpl,
  InMemoryMemoryStore: () => InMemoryMemoryStore,
  InMemoryReviewScheduleStore: () => InMemoryReviewScheduleStore,
  InMemoryStudentProfileStore: () => InMemoryStudentProfileStore,
  MasteryTracker: () => MasteryTracker,
  PathwayCalculator: () => PathwayCalculator,
  PrismaStudentProfileStore: () => PrismaStudentProfileStore,
  SpacedRepetitionScheduler: () => SpacedRepetitionScheduler,
  buildMemorySummary: () => buildMemorySummary,
  createEvaluationMemoryIntegration: () => createEvaluationMemoryIntegration,
  createInMemoryMemoryStore: () => createInMemoryMemoryStore,
  createInMemoryReviewScheduleStore: () => createInMemoryReviewScheduleStore,
  createInMemoryStudentProfileStore: () => createInMemoryStudentProfileStore,
  createMasteryTracker: () => createMasteryTracker,
  createPathwayCalculator: () => createPathwayCalculator,
  createPrismaStudentProfileStore: () => createPrismaStudentProfileStore,
  createSpacedRepetitionScheduler: () => createSpacedRepetitionScheduler,
  getDefaultMemoryStore: () => getDefaultMemoryStore,
  getDefaultReviewScheduleStore: () => getDefaultReviewScheduleStore,
  getDefaultStudentProfileStore: () => getDefaultStudentProfileStore,
  resetDefaultMemoryStore: () => resetDefaultMemoryStore,
  resetDefaultReviewScheduleStore: () => resetDefaultReviewScheduleStore,
  resetDefaultStudentProfileStore: () => resetDefaultStudentProfileStore
});
module.exports = __toCommonJS(index_exports);

// src/types.ts
var DEFAULT_SPACED_REPETITION_CONFIG = {
  initialIntervalDays: 1,
  minEasinessFactor: 1.3,
  maxIntervalDays: 365,
  goodScoreThreshold: 70,
  easyScoreThreshold: 90,
  urgentThresholdDays: 7
};
var DEFAULT_MEMORY_INTEGRATION_CONFIG = {
  updateMasteryOnEvaluation: true,
  adjustPathwayOnEvaluation: true,
  updateSpacedRepetition: true,
  storeInMemory: true,
  spacedRepetitionConfig: DEFAULT_SPACED_REPETITION_CONFIG,
  masteryImprovementThreshold: 70,
  remediationThreshold: 50,
  skipAheadThreshold: 90
};

// src/student-profile-store.ts
function calculateMasteryLevel(score) {
  if (score >= 90) return "expert";
  if (score >= 80) return "proficient";
  if (score >= 70) return "intermediate";
  if (score >= 50) return "beginner";
  return "novice";
}
function calculateTrend(currentScore, previousScore) {
  const difference = currentScore - previousScore;
  if (difference > 5) return "improving";
  if (difference < -5) return "declining";
  return "stable";
}
function calculateConfidence(assessmentCount) {
  return Math.min(0.95, 0.5 + assessmentCount * 0.05);
}
function createDefaultProfile(studentId, userId) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: studentId,
    userId,
    masteryByTopic: {},
    activePathways: [],
    cognitivePreferences: {
      learningStyles: ["visual", "reading"],
      contentLengthPreference: "moderate",
      pacePreference: "moderate",
      challengePreference: "moderate",
      examplesFirst: true
    },
    performanceMetrics: {
      overallAverageScore: 0,
      totalAssessments: 0,
      weeklyAssessments: 0,
      currentStreak: 0,
      longestStreak: 0,
      topicsMastered: 0,
      totalStudyTimeMinutes: 0,
      averageSessionDuration: 0,
      completionRate: 0
    },
    overallBloomsDistribution: {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    },
    knowledgeGaps: [],
    strengths: [],
    createdAt: now,
    lastActiveAt: now,
    updatedAt: now
  };
}
function createDefaultTopicMastery(topicId, update) {
  const scorePercent = update.score / update.maxScore * 100;
  return {
    topicId,
    level: calculateMasteryLevel(scorePercent),
    score: scorePercent,
    bloomsLevel: update.bloomsLevel,
    assessmentCount: 1,
    averageScore: scorePercent,
    lastAssessedAt: update.timestamp,
    trend: "stable",
    confidence: calculateConfidence(1)
  };
}
var InMemoryStudentProfileStore = class {
  profiles = /* @__PURE__ */ new Map();
  /**
   * Get a student profile
   */
  async get(studentId) {
    return this.profiles.get(studentId) ?? null;
  }
  /**
   * Create or update a student profile
   */
  async save(profile) {
    this.profiles.set(profile.id, { ...profile, updatedAt: /* @__PURE__ */ new Date() });
  }
  /**
   * Update mastery for a topic
   */
  async updateMastery(studentId, update) {
    let profile = this.profiles.get(studentId);
    if (!profile) {
      profile = createDefaultProfile(studentId, studentId);
      this.profiles.set(studentId, profile);
    }
    const existingMastery = profile.masteryByTopic[update.topicId];
    const scorePercent = update.score / update.maxScore * 100;
    if (existingMastery) {
      const newAssessmentCount = existingMastery.assessmentCount + 1;
      const newAverageScore = (existingMastery.averageScore * existingMastery.assessmentCount + scorePercent) / newAssessmentCount;
      const updatedMastery = {
        ...existingMastery,
        level: calculateMasteryLevel(newAverageScore),
        score: newAverageScore,
        bloomsLevel: this.higherBloomsLevel(
          existingMastery.bloomsLevel,
          update.bloomsLevel
        ),
        assessmentCount: newAssessmentCount,
        averageScore: newAverageScore,
        lastAssessedAt: update.timestamp,
        trend: calculateTrend(scorePercent, existingMastery.score),
        confidence: calculateConfidence(newAssessmentCount)
      };
      profile.masteryByTopic[update.topicId] = updatedMastery;
      profile.updatedAt = /* @__PURE__ */ new Date();
      profile.lastActiveAt = /* @__PURE__ */ new Date();
      this.updateOverallMetrics(profile);
      return updatedMastery;
    } else {
      const newMastery = createDefaultTopicMastery(update.topicId, update);
      profile.masteryByTopic[update.topicId] = newMastery;
      profile.updatedAt = /* @__PURE__ */ new Date();
      profile.lastActiveAt = /* @__PURE__ */ new Date();
      this.updateOverallMetrics(profile);
      return newMastery;
    }
  }
  /**
   * Get mastery for a topic
   */
  async getMastery(studentId, topicId) {
    const profile = this.profiles.get(studentId);
    return profile?.masteryByTopic[topicId] ?? null;
  }
  /**
   * Update learning pathway
   */
  async updatePathway(studentId, pathwayId, adjustment) {
    const profile = this.profiles.get(studentId);
    if (!profile) {
      throw new Error(`Student profile not found: ${studentId}`);
    }
    const pathwayIndex = profile.activePathways.findIndex(
      (p) => p.id === pathwayId
    );
    if (pathwayIndex === -1) {
      throw new Error(`Pathway not found: ${pathwayId}`);
    }
    const pathway = profile.activePathways[pathwayIndex];
    switch (adjustment.type) {
      case "skip_ahead":
        if (adjustment.newCurrentStepIndex !== void 0) {
          pathway.currentStepIndex = adjustment.newCurrentStepIndex;
        }
        break;
      case "add_remediation":
        if (adjustment.stepsToAdd) {
          pathway.steps.splice(
            pathway.currentStepIndex,
            0,
            ...adjustment.stepsToAdd
          );
        }
        break;
      case "reorder":
        if (adjustment.newOrder) {
          const stepMap = new Map(pathway.steps.map((s) => [s.id, s]));
          pathway.steps = adjustment.newOrder.map((id) => stepMap.get(id)).filter((s) => s !== void 0);
        }
        break;
      case "add_challenge":
        if (adjustment.stepsToAdd) {
          pathway.steps.splice(
            pathway.currentStepIndex + 1,
            0,
            ...adjustment.stepsToAdd
          );
        }
        break;
      case "no_change":
        break;
    }
    if (adjustment.stepsToRemove && adjustment.stepsToRemove.length > 0) {
      const removeSet = new Set(adjustment.stepsToRemove);
      pathway.steps = pathway.steps.filter((s) => !removeSet.has(s.id));
    }
    const completedSteps = pathway.steps.filter(
      (s) => s.status === "completed"
    ).length;
    pathway.progress = pathway.steps.length > 0 ? completedSteps / pathway.steps.length * 100 : 0;
    pathway.updatedAt = /* @__PURE__ */ new Date();
    profile.updatedAt = /* @__PURE__ */ new Date();
    return pathway;
  }
  /**
   * Get active pathways for a student
   */
  async getActivePathways(studentId) {
    const profile = this.profiles.get(studentId);
    return profile?.activePathways.filter((p) => p.status === "active") ?? [];
  }
  /**
   * Update performance metrics
   */
  async updateMetrics(studentId, metrics) {
    const profile = this.profiles.get(studentId);
    if (!profile) {
      throw new Error(`Student profile not found: ${studentId}`);
    }
    profile.performanceMetrics = {
      ...profile.performanceMetrics,
      ...metrics
    };
    profile.updatedAt = /* @__PURE__ */ new Date();
    return profile.performanceMetrics;
  }
  /**
   * Get knowledge gaps
   */
  async getKnowledgeGaps(studentId) {
    const profile = this.profiles.get(studentId);
    if (!profile) {
      return [];
    }
    const gaps = [];
    for (const [topicId, mastery] of Object.entries(profile.masteryByTopic)) {
      if (mastery.level === "novice" || mastery.level === "beginner") {
        gaps.push(topicId);
      }
    }
    return gaps;
  }
  /**
   * Delete a student profile
   */
  async delete(studentId) {
    this.profiles.delete(studentId);
  }
  /**
   * Compare Bloom's levels and return higher one
   */
  higherBloomsLevel(a, b) {
    const order = [
      "REMEMBER",
      "UNDERSTAND",
      "APPLY",
      "ANALYZE",
      "EVALUATE",
      "CREATE"
    ];
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    return indexA >= indexB ? a : b;
  }
  /**
   * Update overall metrics after mastery change
   */
  updateOverallMetrics(profile) {
    const masteryRecords = Object.values(profile.masteryByTopic);
    if (masteryRecords.length === 0) {
      return;
    }
    profile.performanceMetrics.overallAverageScore = masteryRecords.reduce((sum, m) => sum + m.averageScore, 0) / masteryRecords.length;
    profile.performanceMetrics.topicsMastered = masteryRecords.filter(
      (m) => m.level === "proficient" || m.level === "expert"
    ).length;
    const distribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    for (const mastery of masteryRecords) {
      distribution[mastery.bloomsLevel]++;
    }
    const total = masteryRecords.length;
    for (const level of Object.keys(distribution)) {
      distribution[level] = distribution[level] / total * 100;
    }
    profile.overallBloomsDistribution = distribution;
    profile.strengths = masteryRecords.filter((m) => m.level === "proficient" || m.level === "expert").map((m) => m.topicId);
    profile.knowledgeGaps = masteryRecords.filter((m) => m.level === "novice" || m.level === "beginner").map((m) => m.topicId);
  }
  /**
   * Clear all profiles (for testing)
   */
  clear() {
    this.profiles.clear();
  }
  /**
   * Get all profiles (for testing)
   */
  getAll() {
    return Array.from(this.profiles.values());
  }
};
var PrismaStudentProfileStore = class {
  prisma;
  profileTableName;
  masteryTableName;
  pathwayTableName;
  constructor(config) {
    this.prisma = config.prisma;
    this.profileTableName = config.profileTableName ?? "studentProfile";
    this.masteryTableName = config.masteryTableName ?? "topicMastery";
    this.pathwayTableName = config.pathwayTableName ?? "learningPathway";
  }
  /**
   * Get a student profile
   */
  async get(studentId) {
    const result = await this.prisma[this.profileTableName].findUnique({
      where: { id: studentId },
      include: {
        masteryRecords: true,
        pathways: true
      }
    });
    return result ? this.mapToProfile(result) : null;
  }
  /**
   * Create or update a student profile
   */
  async save(profile) {
    await this.prisma[this.profileTableName].upsert({
      where: { id: profile.id },
      create: {
        id: profile.id,
        userId: profile.userId,
        cognitivePreferences: profile.cognitivePreferences,
        performanceMetrics: profile.performanceMetrics,
        overallBloomsDistribution: profile.overallBloomsDistribution,
        knowledgeGaps: profile.knowledgeGaps,
        strengths: profile.strengths,
        createdAt: profile.createdAt,
        lastActiveAt: profile.lastActiveAt,
        updatedAt: /* @__PURE__ */ new Date()
      },
      update: {
        cognitivePreferences: profile.cognitivePreferences,
        performanceMetrics: profile.performanceMetrics,
        overallBloomsDistribution: profile.overallBloomsDistribution,
        knowledgeGaps: profile.knowledgeGaps,
        strengths: profile.strengths,
        lastActiveAt: profile.lastActiveAt,
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
  }
  /**
   * Update mastery for a topic
   */
  async updateMastery(studentId, update) {
    const scorePercent = update.score / update.maxScore * 100;
    const existing = await this.prisma[this.masteryTableName].findUnique({
      where: {
        studentId_topicId: {
          studentId,
          topicId: update.topicId
        }
      }
    });
    if (existing) {
      const newAssessmentCount = existing.assessmentCount + 1;
      const newAverageScore = (existing.averageScore * existing.assessmentCount + scorePercent) / newAssessmentCount;
      const result = await this.prisma[this.masteryTableName].update({
        where: {
          studentId_topicId: {
            studentId,
            topicId: update.topicId
          }
        },
        data: {
          level: calculateMasteryLevel(newAverageScore),
          score: newAverageScore,
          bloomsLevel: update.bloomsLevel,
          assessmentCount: newAssessmentCount,
          averageScore: newAverageScore,
          lastAssessedAt: update.timestamp,
          trend: calculateTrend(scorePercent, existing.score),
          confidence: calculateConfidence(newAssessmentCount)
        }
      });
      return this.mapToMastery(result);
    } else {
      const result = await this.prisma[this.masteryTableName].create({
        data: {
          studentId,
          topicId: update.topicId,
          level: calculateMasteryLevel(scorePercent),
          score: scorePercent,
          bloomsLevel: update.bloomsLevel,
          assessmentCount: 1,
          averageScore: scorePercent,
          lastAssessedAt: update.timestamp,
          trend: "stable",
          confidence: calculateConfidence(1)
        }
      });
      return this.mapToMastery(result);
    }
  }
  /**
   * Get mastery for a topic
   */
  async getMastery(studentId, topicId) {
    const result = await this.prisma[this.masteryTableName].findUnique({
      where: {
        studentId_topicId: {
          studentId,
          topicId
        }
      }
    });
    return result ? this.mapToMastery(result) : null;
  }
  /**
   * Update learning pathway
   */
  async updatePathway(studentId, pathwayId, adjustment) {
    const pathway = await this.prisma[this.pathwayTableName].findUnique({
      where: { id: pathwayId }
    });
    if (!pathway || pathway.studentId !== studentId) {
      throw new Error(`Pathway not found: ${pathwayId}`);
    }
    let steps = pathway.steps;
    switch (adjustment.type) {
      case "skip_ahead":
        break;
      case "add_remediation":
        if (adjustment.stepsToAdd) {
          steps = [
            ...steps.slice(0, pathway.currentStepIndex),
            ...adjustment.stepsToAdd,
            ...steps.slice(pathway.currentStepIndex)
          ];
        }
        break;
      case "add_challenge":
        if (adjustment.stepsToAdd) {
          steps = [
            ...steps.slice(0, pathway.currentStepIndex + 1),
            ...adjustment.stepsToAdd,
            ...steps.slice(pathway.currentStepIndex + 1)
          ];
        }
        break;
      case "reorder":
      case "no_change":
        break;
    }
    const result = await this.prisma[this.pathwayTableName].update({
      where: { id: pathwayId },
      data: {
        steps,
        currentStepIndex: adjustment.newCurrentStepIndex ?? pathway.currentStepIndex,
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    return this.mapToPathway(result);
  }
  /**
   * Get active pathways for a student
   */
  async getActivePathways(studentId) {
    const results = await this.prisma[this.pathwayTableName].findMany({
      where: {
        studentId,
        status: "active"
      }
    });
    return results.map((r) => this.mapToPathway(r));
  }
  /**
   * Update performance metrics
   */
  async updateMetrics(studentId, metrics) {
    const profile = await this.prisma[this.profileTableName].findUnique({
      where: { id: studentId }
    });
    if (!profile) {
      throw new Error(`Student profile not found: ${studentId}`);
    }
    const updatedMetrics = {
      ...profile.performanceMetrics,
      ...metrics
    };
    await this.prisma[this.profileTableName].update({
      where: { id: studentId },
      data: {
        performanceMetrics: updatedMetrics,
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    return updatedMetrics;
  }
  /**
   * Get knowledge gaps
   */
  async getKnowledgeGaps(studentId) {
    const results = await this.prisma[this.masteryTableName].findMany({
      where: {
        studentId,
        level: { in: ["novice", "beginner"] }
      },
      select: { topicId: true }
    });
    return results.map((r) => r.topicId);
  }
  /**
   * Delete a student profile
   */
  async delete(studentId) {
    await this.prisma[this.profileTableName].delete({
      where: { id: studentId }
    });
  }
  /**
   * Map database result to StudentProfile
   */
  mapToProfile(result) {
    const masteryByTopic = {};
    for (const m of result.masteryRecords ?? []) {
      masteryByTopic[m.topicId] = this.mapToMastery(m);
    }
    return {
      id: result.id,
      userId: result.userId,
      masteryByTopic,
      activePathways: (result.pathways ?? []).map((p) => this.mapToPathway(p)),
      cognitivePreferences: result.cognitivePreferences,
      performanceMetrics: result.performanceMetrics,
      overallBloomsDistribution: result.overallBloomsDistribution,
      knowledgeGaps: result.knowledgeGaps ?? [],
      strengths: result.strengths ?? [],
      createdAt: result.createdAt,
      lastActiveAt: result.lastActiveAt,
      updatedAt: result.updatedAt
    };
  }
  /**
   * Map database result to TopicMastery
   */
  mapToMastery(result) {
    return {
      topicId: result.topicId,
      level: result.level,
      score: result.score,
      bloomsLevel: result.bloomsLevel,
      assessmentCount: result.assessmentCount,
      averageScore: result.averageScore,
      lastAssessedAt: result.lastAssessedAt,
      trend: result.trend,
      confidence: result.confidence
    };
  }
  /**
   * Map database result to LearningPathway
   */
  mapToPathway(result) {
    return {
      id: result.id,
      studentId: result.studentId,
      courseId: result.courseId,
      steps: result.steps,
      currentStepIndex: result.currentStepIndex,
      progress: result.progress,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      status: result.status
    };
  }
};
function createInMemoryStudentProfileStore() {
  return new InMemoryStudentProfileStore();
}
function createPrismaStudentProfileStore(config) {
  return new PrismaStudentProfileStore(config);
}
var defaultProfileStore = null;
function getDefaultStudentProfileStore() {
  if (!defaultProfileStore) {
    defaultProfileStore = createInMemoryStudentProfileStore();
  }
  return defaultProfileStore;
}
function resetDefaultStudentProfileStore() {
  defaultProfileStore = null;
}

// src/mastery-tracker.ts
var DEFAULT_MASTERY_TRACKER_CONFIG = {
  recencyWeight: 0.7,
  minAssessmentsForStability: 3,
  levelThresholds: {
    beginner: 50,
    intermediate: 70,
    proficient: 80,
    expert: 90
  },
  bloomsWeights: {
    REMEMBER: 0.5,
    UNDERSTAND: 0.7,
    APPLY: 0.85,
    ANALYZE: 0.95,
    EVALUATE: 1,
    CREATE: 1.1
  },
  decayRatePerDay: 0.5,
  // 0.5% per day
  decayStartDays: 30
};
var MasteryTracker = class {
  config;
  profileStore;
  constructor(profileStore, config = {}) {
    this.config = { ...DEFAULT_MASTERY_TRACKER_CONFIG, ...config };
    this.profileStore = profileStore;
  }
  /**
   * Process an evaluation outcome and update mastery
   */
  async processEvaluation(outcome) {
    const previousMastery = await this.profileStore.getMastery(
      outcome.studentId,
      outcome.topicId
    );
    const bloomsWeight = this.config.bloomsWeights[outcome.bloomsLevel];
    const weightedScore = Math.min(100, outcome.score * bloomsWeight);
    const update = {
      topicId: outcome.topicId,
      bloomsLevel: outcome.bloomsLevel,
      score: weightedScore,
      maxScore: outcome.maxScore,
      timestamp: outcome.evaluatedAt,
      context: {
        courseId: outcome.courseId,
        chapterId: outcome.chapterId,
        sectionId: outcome.sectionId,
        assessmentType: outcome.assessmentType
      }
    };
    const currentMastery = await this.profileStore.updateMastery(
      outcome.studentId,
      update
    );
    const levelChanged = previousMastery ? previousMastery.level !== currentMastery.level : true;
    const scoreDifference = previousMastery ? currentMastery.score - previousMastery.score : currentMastery.score;
    const changeDirection = this.determineChangeDirection(
      previousMastery?.level,
      currentMastery.level
    );
    const isStable = currentMastery.assessmentCount >= this.config.minAssessmentsForStability;
    const recommendations = this.generateRecommendations(
      currentMastery,
      outcome,
      changeDirection
    );
    return {
      previousMastery: previousMastery ?? void 0,
      currentMastery,
      levelChanged,
      changeDirection,
      scoreDifference,
      isStable,
      recommendations
    };
  }
  /**
   * Get mastery for a topic
   */
  async getMastery(studentId, topicId) {
    return this.profileStore.getMastery(studentId, topicId);
  }
  /**
   * Calculate mastery level from score
   */
  calculateMasteryLevel(score) {
    const thresholds = this.config.levelThresholds;
    if (score >= thresholds.expert) return "expert";
    if (score >= thresholds.proficient) return "proficient";
    if (score >= thresholds.intermediate) return "intermediate";
    if (score >= thresholds.beginner) return "beginner";
    return "novice";
  }
  /**
   * Apply decay to unused topics
   */
  async applyDecay(studentId, topicId, currentDate = /* @__PURE__ */ new Date()) {
    const mastery = await this.profileStore.getMastery(studentId, topicId);
    if (!mastery) {
      return null;
    }
    const daysSinceLastAssessment = Math.floor(
      (currentDate.getTime() - mastery.lastAssessedAt.getTime()) / (1e3 * 60 * 60 * 24)
    );
    if (daysSinceLastAssessment <= this.config.decayStartDays) {
      return mastery;
    }
    const decayDays = daysSinceLastAssessment - this.config.decayStartDays;
    const decayAmount = decayDays * this.config.decayRatePerDay;
    const decayedScore = Math.max(0, mastery.score - decayAmount);
    if (decayedScore < mastery.score) {
      const update = {
        topicId,
        bloomsLevel: mastery.bloomsLevel,
        score: decayedScore,
        maxScore: 100,
        timestamp: currentDate
      };
      return this.profileStore.updateMastery(studentId, update);
    }
    return mastery;
  }
  /**
   * Get topics needing review (mastery below threshold)
   */
  async getTopicsNeedingReview(studentId, threshold = 70) {
    const profile = await this.profileStore.get(studentId);
    if (!profile) {
      return [];
    }
    return Object.values(profile.masteryByTopic).filter(
      (m) => m.score < threshold
    );
  }
  /**
   * Get mastery summary for a student
   */
  async getMasterySummary(studentId) {
    const profile = await this.profileStore.get(studentId);
    if (!profile) {
      return {
        totalTopics: 0,
        averageMastery: 0,
        levelDistribution: {
          novice: 0,
          beginner: 0,
          intermediate: 0,
          proficient: 0,
          expert: 0
        },
        bloomsDistribution: {
          REMEMBER: 0,
          UNDERSTAND: 0,
          APPLY: 0,
          ANALYZE: 0,
          EVALUATE: 0,
          CREATE: 0
        },
        recentTrend: "stable",
        topicsNeedingAttention: [],
        strengths: []
      };
    }
    const masteryRecords = Object.values(profile.masteryByTopic);
    const totalTopics = masteryRecords.length;
    if (totalTopics === 0) {
      return {
        totalTopics: 0,
        averageMastery: 0,
        levelDistribution: {
          novice: 0,
          beginner: 0,
          intermediate: 0,
          proficient: 0,
          expert: 0
        },
        bloomsDistribution: {
          REMEMBER: 0,
          UNDERSTAND: 0,
          APPLY: 0,
          ANALYZE: 0,
          EVALUATE: 0,
          CREATE: 0
        },
        recentTrend: "stable",
        topicsNeedingAttention: [],
        strengths: []
      };
    }
    const averageMastery = masteryRecords.reduce((sum, m) => sum + m.score, 0) / totalTopics;
    const levelDistribution = {
      novice: 0,
      beginner: 0,
      intermediate: 0,
      proficient: 0,
      expert: 0
    };
    for (const m of masteryRecords) {
      levelDistribution[m.level]++;
    }
    const bloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    for (const m of masteryRecords) {
      bloomsDistribution[m.bloomsLevel]++;
    }
    const recentRecords = masteryRecords.filter(
      (m) => m.lastAssessedAt.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1e3
    ).sort((a, b) => b.lastAssessedAt.getTime() - a.lastAssessedAt.getTime());
    let recentTrend = "stable";
    if (recentRecords.length >= 2) {
      const improvingCount = recentRecords.filter(
        (m) => m.trend === "improving"
      ).length;
      const decliningCount = recentRecords.filter(
        (m) => m.trend === "declining"
      ).length;
      if (improvingCount > decliningCount) {
        recentTrend = "improving";
      } else if (decliningCount > improvingCount) {
        recentTrend = "declining";
      }
    }
    const topicsNeedingAttention = masteryRecords.filter(
      (m) => m.level === "novice" || m.level === "beginner" || m.trend === "declining"
    ).map((m) => m.topicId);
    const strengths = masteryRecords.filter((m) => m.level === "expert" || m.level === "proficient").map((m) => m.topicId);
    return {
      totalTopics,
      averageMastery,
      levelDistribution,
      bloomsDistribution,
      recentTrend,
      topicsNeedingAttention,
      strengths
    };
  }
  /**
   * Determine change direction between mastery levels
   */
  determineChangeDirection(previous, current) {
    if (!previous) {
      return "unchanged";
    }
    const levels = [
      "novice",
      "beginner",
      "intermediate",
      "proficient",
      "expert"
    ];
    const prevIndex = levels.indexOf(previous);
    const currIndex = levels.indexOf(current);
    if (currIndex > prevIndex) return "improved";
    if (currIndex < prevIndex) return "declined";
    return "unchanged";
  }
  /**
   * Generate recommendations based on mastery
   */
  generateRecommendations(mastery, outcome, changeDirection) {
    const recommendations = [];
    if (mastery.level === "novice" || mastery.level === "beginner") {
      recommendations.push({
        type: "review_basics",
        message: `Consider reviewing foundational concepts for "${outcome.topicId}"`,
        priority: 1,
        action: "Review introductory materials and practice basic exercises"
      });
    }
    if (mastery.trend === "declining" || changeDirection === "declined") {
      recommendations.push({
        type: "practice_more",
        message: `Performance in "${outcome.topicId}" is declining. More practice recommended.`,
        priority: 2,
        action: "Schedule additional practice sessions"
      });
    }
    if ((mastery.level === "proficient" || mastery.level === "expert") && mastery.confidence > 0.7) {
      recommendations.push({
        type: "challenge_increase",
        message: `Ready for more challenging content in "${outcome.topicId}"`,
        priority: 3,
        action: "Explore advanced topics or higher Bloom's levels"
      });
    }
    if (mastery.level === "expert" && mastery.trend === "stable" && changeDirection === "unchanged") {
      recommendations.push({
        type: "maintain",
        message: `Excellent mastery of "${outcome.topicId}". Periodic review recommended.`,
        priority: 4,
        action: "Schedule periodic reviews to maintain mastery"
      });
    }
    if (changeDirection === "improved" && outcome.score >= 80) {
      recommendations.push({
        type: "advance_level",
        message: `Great improvement in "${outcome.topicId}"! Ready for the next level.`,
        priority: 2,
        action: "Move to more advanced content"
      });
    }
    return recommendations.sort((a, b) => a.priority - b.priority);
  }
};
function createMasteryTracker(profileStore, config) {
  return new MasteryTracker(profileStore, config);
}

// src/pathway-calculator.ts
var import_uuid = require("uuid");
var DEFAULT_PATHWAY_CALCULATOR_CONFIG = {
  skipAheadThreshold: 90,
  remediationThreshold: 50,
  maxSkipSteps: 3,
  maxRemediationSteps: 2,
  skipMasteryLevel: "proficient",
  bloomsProgression: [
    "REMEMBER",
    "UNDERSTAND",
    "APPLY",
    "ANALYZE",
    "EVALUATE",
    "CREATE"
  ]
};
var PathwayCalculator = class {
  config;
  profileStore;
  constructor(profileStore, config = {}) {
    this.config = { ...DEFAULT_PATHWAY_CALCULATOR_CONFIG, ...config };
    this.profileStore = profileStore;
  }
  /**
   * Calculate pathway adjustment based on evaluation outcome
   */
  async calculateAdjustment(studentId, pathwayId, outcome) {
    const pathways = await this.profileStore.getActivePathways(studentId);
    const pathway = pathways.find((p) => p.id === pathwayId);
    if (!pathway) {
      throw new Error(`Pathway not found: ${pathwayId}`);
    }
    const mastery = await this.profileStore.getMastery(
      studentId,
      outcome.topicId
    );
    const adjustmentType = this.determineAdjustmentType(outcome, mastery);
    let adjustment;
    let explanation;
    const stepsAdded = [];
    const stepsRemoved = [];
    const stepsSkipped = [];
    switch (adjustmentType) {
      case "skip_ahead": {
        const skipResult = this.calculateSkipAhead(pathway, outcome, mastery);
        adjustment = skipResult.adjustment;
        stepsSkipped.push(...skipResult.skippedSteps);
        explanation = `Excellent performance! Skipping ${stepsSkipped.length} steps.`;
        break;
      }
      case "add_remediation": {
        const remediationResult = this.calculateRemediation(
          pathway,
          outcome,
          mastery
        );
        adjustment = remediationResult.adjustment;
        stepsAdded.push(...remediationResult.addedSteps);
        explanation = `Adding ${stepsAdded.length} remediation steps to strengthen understanding.`;
        break;
      }
      case "add_challenge": {
        const challengeResult = this.calculateChallenge(
          pathway,
          outcome,
          mastery
        );
        adjustment = challengeResult.adjustment;
        stepsAdded.push(...challengeResult.addedSteps);
        explanation = `Adding ${stepsAdded.length} challenge steps to deepen learning.`;
        break;
      }
      default:
        adjustment = {
          type: "no_change",
          reason: "Performance within expected range"
        };
        explanation = "Pathway remains unchanged.";
    }
    const updatedPathway = this.applyAdjustment(pathway, adjustment);
    const newEstimatedTime = updatedPathway.steps.reduce(
      (sum, step) => sum + step.estimatedDuration,
      0
    );
    return {
      adjustment,
      updatedPathway,
      stepsAdded,
      stepsRemoved,
      stepsSkipped,
      newEstimatedTime,
      explanation
    };
  }
  /**
   * Recalculate entire pathway based on current mastery
   */
  async recalculatePathway(studentId, pathwayId) {
    const pathways = await this.profileStore.getActivePathways(studentId);
    const pathway = pathways.find((p) => p.id === pathwayId);
    if (!pathway) {
      throw new Error(`Pathway not found: ${pathwayId}`);
    }
    const masteryMap = /* @__PURE__ */ new Map();
    for (const step of pathway.steps) {
      const mastery = await this.profileStore.getMastery(
        studentId,
        step.topicId
      );
      if (mastery) {
        masteryMap.set(step.topicId, mastery);
      }
    }
    const updatedSteps = [];
    let currentStepIndex = 0;
    let foundCurrent = false;
    for (let i = 0; i < pathway.steps.length; i++) {
      const step = pathway.steps[i];
      const mastery = masteryMap.get(step.topicId);
      let newStatus = step.status;
      let masteryAchieved = step.masteryAchieved;
      if (mastery) {
        if (this.shouldMarkCompleted(mastery, step.targetBloomsLevel)) {
          newStatus = "completed";
          masteryAchieved = mastery.level;
        } else if (this.shouldSkip(mastery)) {
          newStatus = "skipped";
        }
      }
      if (!foundCurrent && newStatus !== "completed" && newStatus !== "skipped") {
        currentStepIndex = updatedSteps.length;
        newStatus = "in_progress";
        foundCurrent = true;
      }
      updatedSteps.push({
        ...step,
        status: newStatus,
        masteryAchieved
      });
    }
    const completedSteps = updatedSteps.filter(
      (s) => s.status === "completed" || s.status === "skipped"
    ).length;
    const progress = updatedSteps.length > 0 ? completedSteps / updatedSteps.length * 100 : 0;
    let status = pathway.status;
    if (completedSteps === updatedSteps.length) {
      status = "completed";
    }
    return {
      ...pathway,
      steps: updatedSteps,
      currentStepIndex,
      progress,
      status,
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Create a new pathway for a course
   */
  async createPathway(studentId, courseId, topics) {
    const steps = topics.map((topic, index) => ({
      id: (0, import_uuid.v4)(),
      topicId: topic.topicId,
      targetBloomsLevel: topic.targetBloomsLevel,
      order: index,
      status: index === 0 ? "in_progress" : "not_started",
      prerequisites: index > 0 ? [topics[index - 1].topicId] : [],
      estimatedDuration: topic.estimatedDuration
    }));
    const pathway = {
      id: (0, import_uuid.v4)(),
      studentId,
      courseId,
      steps,
      currentStepIndex: 0,
      progress: 0,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      status: "active"
    };
    return pathway;
  }
  /**
   * Determine adjustment type based on outcome
   */
  determineAdjustmentType(outcome, mastery) {
    const scorePercent = outcome.score / outcome.maxScore * 100;
    if (scorePercent >= this.config.skipAheadThreshold && mastery && this.masteryLevelIndex(mastery.level) >= this.masteryLevelIndex(this.config.skipMasteryLevel)) {
      return "skip_ahead";
    }
    if (scorePercent < this.config.remediationThreshold) {
      return "add_remediation";
    }
    if (scorePercent >= 80 && this.bloomsLevelIndex(outcome.bloomsLevel) >= 3) {
      return "add_challenge";
    }
    return "no_change";
  }
  /**
   * Calculate skip ahead adjustment
   */
  calculateSkipAhead(pathway, outcome, mastery) {
    const currentIndex = pathway.currentStepIndex;
    const remainingSteps = pathway.steps.slice(currentIndex + 1);
    const skippedSteps = [];
    let skipCount = 0;
    for (const step of remainingSteps) {
      if (skipCount >= this.config.maxSkipSteps) break;
      const stepBloomsIndex = this.bloomsLevelIndex(step.targetBloomsLevel);
      const masteryBloomsIndex = mastery ? this.bloomsLevelIndex(mastery.bloomsLevel) : -1;
      if (step.topicId === outcome.topicId || stepBloomsIndex <= masteryBloomsIndex) {
        skippedSteps.push(step);
        skipCount++;
      } else {
        break;
      }
    }
    const newIndex = currentIndex + skipCount + 1;
    return {
      adjustment: {
        type: "skip_ahead",
        reason: `Mastery demonstrated at ${mastery?.level} level`,
        newCurrentStepIndex: Math.min(newIndex, pathway.steps.length - 1)
      },
      skippedSteps
    };
  }
  /**
   * Calculate remediation adjustment
   */
  calculateRemediation(pathway, outcome, _mastery) {
    const currentStep = pathway.steps[pathway.currentStepIndex];
    const addedSteps = [];
    const currentBloomsIndex = this.bloomsLevelIndex(
      currentStep?.targetBloomsLevel ?? "REMEMBER"
    );
    const remediationLevels = this.config.bloomsProgression.slice(
      0,
      Math.max(0, currentBloomsIndex)
    );
    for (let i = 0; i < Math.min(remediationLevels.length, this.config.maxRemediationSteps); i++) {
      const level = remediationLevels[remediationLevels.length - 1 - i];
      addedSteps.push({
        id: (0, import_uuid.v4)(),
        topicId: outcome.topicId,
        targetBloomsLevel: level,
        order: pathway.currentStepIndex + i,
        status: "not_started",
        prerequisites: i > 0 ? [addedSteps[i - 1].topicId] : currentStep?.prerequisites ?? [],
        estimatedDuration: 15
        // Default remediation duration
      });
    }
    return {
      adjustment: {
        type: "add_remediation",
        reason: `Score ${outcome.score}% below threshold`,
        stepsToAdd: addedSteps
      },
      addedSteps
    };
  }
  /**
   * Calculate challenge adjustment
   */
  calculateChallenge(pathway, outcome, mastery) {
    const currentStep = pathway.steps[pathway.currentStepIndex];
    const addedSteps = [];
    const currentBloomsIndex = this.bloomsLevelIndex(
      mastery?.bloomsLevel ?? currentStep?.targetBloomsLevel ?? "REMEMBER"
    );
    const challengeLevels = this.config.bloomsProgression.slice(
      currentBloomsIndex + 1
    );
    if (challengeLevels.length > 0) {
      addedSteps.push({
        id: (0, import_uuid.v4)(),
        topicId: outcome.topicId,
        targetBloomsLevel: challengeLevels[0],
        order: pathway.currentStepIndex + 1,
        status: "not_started",
        prerequisites: [outcome.topicId],
        estimatedDuration: 20
        // Default challenge duration
      });
    }
    return {
      adjustment: {
        type: "add_challenge",
        reason: `High performance (${outcome.score}%) ready for challenge`,
        stepsToAdd: addedSteps
      },
      addedSteps
    };
  }
  /**
   * Apply adjustment to pathway
   */
  applyAdjustment(pathway, adjustment) {
    const updatedPathway = { ...pathway, steps: [...pathway.steps] };
    switch (adjustment.type) {
      case "skip_ahead":
        if (adjustment.newCurrentStepIndex !== void 0) {
          for (let i = updatedPathway.currentStepIndex; i < adjustment.newCurrentStepIndex; i++) {
            if (updatedPathway.steps[i]) {
              updatedPathway.steps[i] = {
                ...updatedPathway.steps[i],
                status: "skipped"
              };
            }
          }
          updatedPathway.currentStepIndex = adjustment.newCurrentStepIndex;
          if (updatedPathway.steps[updatedPathway.currentStepIndex]) {
            updatedPathway.steps[updatedPathway.currentStepIndex] = {
              ...updatedPathway.steps[updatedPathway.currentStepIndex],
              status: "in_progress"
            };
          }
        }
        break;
      case "add_remediation":
      case "add_challenge":
        if (adjustment.stepsToAdd && adjustment.stepsToAdd.length > 0) {
          updatedPathway.steps = [
            ...updatedPathway.steps.slice(0, updatedPathway.currentStepIndex),
            ...adjustment.stepsToAdd,
            ...updatedPathway.steps.slice(updatedPathway.currentStepIndex)
          ];
          updatedPathway.steps = updatedPathway.steps.map((step, index) => ({
            ...step,
            order: index
          }));
        }
        break;
      case "no_change":
        break;
    }
    if (adjustment.stepsToRemove && adjustment.stepsToRemove.length > 0) {
      const removeSet = new Set(adjustment.stepsToRemove);
      updatedPathway.steps = updatedPathway.steps.filter(
        (s) => !removeSet.has(s.id)
      );
    }
    const completedSteps = updatedPathway.steps.filter(
      (s) => s.status === "completed" || s.status === "skipped"
    ).length;
    updatedPathway.progress = updatedPathway.steps.length > 0 ? completedSteps / updatedPathway.steps.length * 100 : 0;
    updatedPathway.updatedAt = /* @__PURE__ */ new Date();
    return updatedPathway;
  }
  /**
   * Check if step should be marked completed based on mastery
   */
  shouldMarkCompleted(mastery, targetBloomsLevel) {
    const masteryBloomsIndex = this.bloomsLevelIndex(mastery.bloomsLevel);
    const targetBloomsIndex = this.bloomsLevelIndex(targetBloomsLevel);
    return masteryBloomsIndex >= targetBloomsIndex && (mastery.level === "proficient" || mastery.level === "expert");
  }
  /**
   * Check if step should be skipped based on mastery
   */
  shouldSkip(mastery) {
    return mastery.level === "expert" && mastery.confidence > 0.8 && mastery.assessmentCount >= 3;
  }
  /**
   * Get mastery level index
   */
  masteryLevelIndex(level) {
    const levels = [
      "novice",
      "beginner",
      "intermediate",
      "proficient",
      "expert"
    ];
    return levels.indexOf(level);
  }
  /**
   * Get Bloom's level index
   */
  bloomsLevelIndex(level) {
    return this.config.bloomsProgression.indexOf(level);
  }
};
function createPathwayCalculator(profileStore, config) {
  return new PathwayCalculator(profileStore, config);
}

// src/spaced-repetition.ts
var import_uuid2 = require("uuid");
var SpacedRepetitionScheduler = class {
  config;
  store;
  constructor(store, config = {}) {
    this.config = { ...DEFAULT_SPACED_REPETITION_CONFIG, ...config };
    this.store = store;
  }
  /**
   * Schedule a review based on evaluation outcome
   */
  async scheduleFromEvaluation(outcome) {
    const history = await this.store.getReviewHistory(
      outcome.studentId,
      outcome.topicId
    );
    const existingEntry = history.find((e) => e.status === "pending");
    const quality = this.calculateQuality(outcome.score);
    const { intervalDays, easinessFactor } = this.calculateNextInterval(
      existingEntry,
      quality
    );
    const nextReviewDate = /* @__PURE__ */ new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
    const priority = this.calculatePriority(outcome.score, intervalDays);
    if (existingEntry) {
      const updatedEntry = await this.store.updateReview(existingEntry.id, {
        scheduledFor: nextReviewDate,
        priority,
        intervalDays,
        easinessFactor,
        lastReviewedAt: outcome.evaluatedAt,
        lastReviewScore: outcome.score,
        successfulReviews: quality >= 3 ? existingEntry.successfulReviews + 1 : existingEntry.successfulReviews,
        isOverdue: false
      });
      return {
        entry: updatedEntry,
        daysUntilReview: intervalDays,
        isNew: false,
        quality,
        explanation: this.generateExplanation(quality, intervalDays, false)
      };
    } else {
      const newEntry = await this.store.scheduleReview({
        topicId: outcome.topicId,
        studentId: outcome.studentId,
        scheduledFor: nextReviewDate,
        priority,
        intervalDays,
        successfulReviews: quality >= 3 ? 1 : 0,
        easinessFactor,
        lastReviewedAt: outcome.evaluatedAt,
        lastReviewScore: outcome.score,
        isOverdue: false,
        status: "pending"
      });
      return {
        entry: newEntry,
        daysUntilReview: intervalDays,
        isNew: true,
        quality,
        explanation: this.generateExplanation(quality, intervalDays, true)
      };
    }
  }
  /**
   * Get pending reviews for a student
   */
  async getPendingReviews(studentId, limit) {
    const pending = await this.store.getPendingReviews(studentId, limit);
    const now = /* @__PURE__ */ new Date();
    return pending.map((entry) => ({
      ...entry,
      isOverdue: entry.scheduledFor < now
    }));
  }
  /**
   * Get overdue reviews for a student
   */
  async getOverdueReviews(studentId) {
    return this.store.getOverdueReviews(studentId);
  }
  /**
   * Complete a review
   */
  async completeReview(entryId, score) {
    const entry = await this.store.completeReview(entryId, score);
    const quality = this.calculateQuality(score);
    const { intervalDays, easinessFactor } = this.calculateNextInterval(
      entry,
      quality
    );
    const nextReviewDate = /* @__PURE__ */ new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
    const priority = this.calculatePriority(score, intervalDays);
    const nextEntry = await this.store.scheduleReview({
      topicId: entry.topicId,
      studentId: entry.studentId,
      scheduledFor: nextReviewDate,
      priority,
      intervalDays,
      successfulReviews: quality >= 3 ? entry.successfulReviews + 1 : entry.successfulReviews,
      easinessFactor,
      lastReviewedAt: /* @__PURE__ */ new Date(),
      lastReviewScore: score,
      isOverdue: false,
      status: "pending"
    });
    return {
      entry: nextEntry,
      daysUntilReview: intervalDays,
      isNew: false,
      quality,
      explanation: this.generateExplanation(quality, intervalDays, false)
    };
  }
  /**
   * Get review statistics for a student
   */
  async getReviewStats(studentId) {
    const pending = await this.store.getPendingReviews(studentId);
    const overdue = await this.store.getOverdueReviews(studentId);
    const now = /* @__PURE__ */ new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const dueToday = pending.filter(
      (e) => e.scheduledFor <= todayEnd && e.scheduledFor >= now
    );
    const thisWeekEnd = new Date(now);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
    const dueThisWeek = pending.filter(
      (e) => e.scheduledFor <= thisWeekEnd && e.scheduledFor > todayEnd
    );
    const avgEasiness = pending.length > 0 ? pending.reduce((sum, e) => sum + e.easinessFactor, 0) / pending.length : 2.5;
    const streakDays = 0;
    return {
      totalPending: pending.length,
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
      dueThisWeekCount: dueThisWeek.length,
      averageEasinessFactor: avgEasiness,
      streakDays,
      topicsByPriority: this.groupByPriority(pending)
    };
  }
  /**
   * Calculate quality score (0-5) from percentage score
   * SM-2 quality scale:
   * 5 - perfect response
   * 4 - correct response after hesitation
   * 3 - correct response with serious difficulty
   * 2 - incorrect response but easy to recall
   * 1 - incorrect response but remembered upon seeing
   * 0 - complete blackout
   */
  calculateQuality(score) {
    if (score >= this.config.easyScoreThreshold) return 5;
    if (score >= this.config.goodScoreThreshold) return 4;
    if (score >= 60) return 3;
    if (score >= 40) return 2;
    if (score >= 20) return 1;
    return 0;
  }
  /**
   * Calculate next interval using SM-2 algorithm
   */
  calculateNextInterval(existingEntry, quality) {
    let easinessFactor = existingEntry?.easinessFactor ?? 2.5;
    let intervalDays = this.config.initialIntervalDays;
    if (quality < 3) {
      intervalDays = this.config.initialIntervalDays;
    } else if (existingEntry) {
      const successfulReviews = existingEntry.successfulReviews + 1;
      if (successfulReviews === 1) {
        intervalDays = 1;
      } else if (successfulReviews === 2) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(existingEntry.intervalDays * easinessFactor);
      }
    }
    const efDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    easinessFactor = Math.max(
      this.config.minEasinessFactor,
      easinessFactor + efDelta
    );
    intervalDays = Math.min(intervalDays, this.config.maxIntervalDays);
    return { intervalDays, easinessFactor };
  }
  /**
   * Calculate review priority
   */
  calculatePriority(score, intervalDays) {
    if (score < 50) return "urgent";
    if (score < 70) return "high";
    if (intervalDays <= this.config.urgentThresholdDays) return "high";
    if (intervalDays <= 14) return "medium";
    return "low";
  }
  /**
   * Generate explanation for scheduling decision
   */
  generateExplanation(quality, intervalDays, isNew) {
    const qualityDesc = quality >= 4 ? "excellent" : quality >= 3 ? "good" : quality >= 2 ? "needs work" : "needs significant practice";
    const intervalDesc = intervalDays === 1 ? "tomorrow" : intervalDays < 7 ? `in ${intervalDays} days` : intervalDays < 30 ? `in ${Math.round(intervalDays / 7)} week(s)` : `in ${Math.round(intervalDays / 30)} month(s)`;
    if (isNew) {
      return `New topic scheduled for review ${intervalDesc} (${qualityDesc} initial performance).`;
    }
    if (quality < 3) {
      return `Review scheduled for ${intervalDesc} to reinforce learning (${qualityDesc} performance).`;
    }
    return `Next review scheduled ${intervalDesc} based on ${qualityDesc} performance.`;
  }
  /**
   * Group entries by priority
   */
  groupByPriority(entries) {
    const result = {
      urgent: [],
      high: [],
      medium: [],
      low: []
    };
    for (const entry of entries) {
      result[entry.priority].push(entry.topicId);
    }
    return result;
  }
};
var InMemoryReviewScheduleStore = class {
  entries = /* @__PURE__ */ new Map();
  /**
   * Get pending reviews for a student
   */
  async getPendingReviews(studentId, limit) {
    const pending = Array.from(this.entries.values()).filter((e) => e.studentId === studentId && e.status === "pending").sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
    return limit ? pending.slice(0, limit) : pending;
  }
  /**
   * Get overdue reviews
   */
  async getOverdueReviews(studentId) {
    const now = /* @__PURE__ */ new Date();
    return Array.from(this.entries.values()).filter(
      (e) => e.studentId === studentId && e.status === "pending" && e.scheduledFor < now
    ).sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  }
  /**
   * Schedule a review
   */
  async scheduleReview(entry) {
    const newEntry = {
      ...entry,
      id: (0, import_uuid2.v4)()
    };
    this.entries.set(newEntry.id, newEntry);
    return newEntry;
  }
  /**
   * Update a review entry
   */
  async updateReview(entryId, update) {
    const entry = this.entries.get(entryId);
    if (!entry) {
      throw new Error(`Review entry not found: ${entryId}`);
    }
    const updatedEntry = {
      ...entry,
      ...update
    };
    this.entries.set(entryId, updatedEntry);
    return updatedEntry;
  }
  /**
   * Complete a review
   */
  async completeReview(entryId, score, timestamp) {
    const entry = this.entries.get(entryId);
    if (!entry) {
      throw new Error(`Review entry not found: ${entryId}`);
    }
    const updatedEntry = {
      ...entry,
      status: "completed",
      lastReviewedAt: timestamp ?? /* @__PURE__ */ new Date(),
      lastReviewScore: score
    };
    this.entries.set(entryId, updatedEntry);
    return updatedEntry;
  }
  /**
   * Get review history for a topic
   */
  async getReviewHistory(studentId, topicId) {
    return Array.from(this.entries.values()).filter((e) => e.studentId === studentId && e.topicId === topicId).sort(
      (a, b) => (b.lastReviewedAt?.getTime() ?? 0) - (a.lastReviewedAt?.getTime() ?? 0)
    );
  }
  /**
   * Delete old completed reviews
   */
  async pruneCompleted(olderThanDays) {
    const cutoff = /* @__PURE__ */ new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    let deleted = 0;
    for (const [id, entry] of this.entries) {
      if (entry.status === "completed" && entry.lastReviewedAt && entry.lastReviewedAt < cutoff) {
        this.entries.delete(id);
        deleted++;
      }
    }
    return deleted;
  }
  /**
   * Clear all entries (for testing)
   */
  clear() {
    this.entries.clear();
  }
  /**
   * Get all entries (for testing)
   */
  getAll() {
    return Array.from(this.entries.values());
  }
};
function createSpacedRepetitionScheduler(store, config) {
  return new SpacedRepetitionScheduler(store, config);
}
function createInMemoryReviewScheduleStore() {
  return new InMemoryReviewScheduleStore();
}
var defaultReviewStore = null;
function getDefaultReviewScheduleStore() {
  if (!defaultReviewStore) {
    defaultReviewStore = createInMemoryReviewScheduleStore();
  }
  return defaultReviewStore;
}
function resetDefaultReviewScheduleStore() {
  defaultReviewStore = null;
}

// src/evaluation-memory-integration.ts
var import_uuid3 = require("uuid");
var InMemoryMemoryStore = class {
  entries = /* @__PURE__ */ new Map();
  /**
   * Store a memory entry
   */
  async store(entry) {
    const newEntry = {
      ...entry,
      id: (0, import_uuid3.v4)(),
      accessCount: 0
    };
    this.entries.set(newEntry.id, newEntry);
    return newEntry;
  }
  /**
   * Get a memory entry by ID
   */
  async get(entryId) {
    return this.entries.get(entryId) ?? null;
  }
  /**
   * Search memories by type
   */
  async getByType(studentId, type, limit) {
    const entries = Array.from(this.entries.values()).filter((e) => e.studentId === studentId && e.type === type).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return limit ? entries.slice(0, limit) : entries;
  }
  /**
   * Search memories by topic
   */
  async getByTopic(studentId, topicId, limit) {
    const entries = Array.from(this.entries.values()).filter(
      (e) => e.studentId === studentId && e.relatedTopics.includes(topicId)
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return limit ? entries.slice(0, limit) : entries;
  }
  /**
   * Get recent memories
   */
  async getRecent(studentId, limit) {
    const entries = Array.from(this.entries.values()).filter((e) => e.studentId === studentId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return limit ? entries.slice(0, limit) : entries;
  }
  /**
   * Get important memories
   */
  async getImportant(studentId, minImportance) {
    const importanceOrder = ["low", "medium", "high", "critical"];
    const minIndex = importanceOrder.indexOf(minImportance);
    return Array.from(this.entries.values()).filter(
      (e) => e.studentId === studentId && importanceOrder.indexOf(e.importance) >= minIndex
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  /**
   * Update access timestamp
   */
  async recordAccess(entryId) {
    const entry = this.entries.get(entryId);
    if (entry) {
      entry.lastAccessedAt = /* @__PURE__ */ new Date();
      entry.accessCount++;
    }
  }
  /**
   * Prune expired entries
   */
  async pruneExpired() {
    const now = /* @__PURE__ */ new Date();
    let deleted = 0;
    for (const [id, entry] of this.entries) {
      if (entry.ttlDays !== void 0) {
        const expiryDate = new Date(entry.createdAt);
        expiryDate.setDate(expiryDate.getDate() + entry.ttlDays);
        if (expiryDate < now) {
          this.entries.delete(id);
          deleted++;
        }
      }
    }
    return deleted;
  }
  /**
   * Delete entries for a student
   */
  async deleteForStudent(studentId) {
    let deleted = 0;
    for (const [id, entry] of this.entries) {
      if (entry.studentId === studentId) {
        this.entries.delete(id);
        deleted++;
      }
    }
    return deleted;
  }
  /**
   * Clear all entries (for testing)
   */
  clear() {
    this.entries.clear();
  }
  /**
   * Get all entries (for testing)
   */
  getAll() {
    return Array.from(this.entries.values());
  }
};
var defaultLogger = {
  debug: (msg, ctx) => console.debug(`[MemoryIntegration] ${msg}`, ctx),
  info: (msg, ctx) => console.info(`[MemoryIntegration] ${msg}`, ctx),
  warn: (msg, ctx) => console.warn(`[MemoryIntegration] ${msg}`, ctx),
  error: (msg, ctx) => console.error(`[MemoryIntegration] ${msg}`, ctx)
};
var EvaluationMemoryIntegrationImpl = class {
  config;
  profileStore;
  memoryStore;
  masteryTracker;
  pathwayCalculator;
  spacedRepetitionScheduler;
  logger;
  constructor(implConfig) {
    this.config = {
      ...DEFAULT_MEMORY_INTEGRATION_CONFIG,
      ...implConfig
    };
    this.profileStore = implConfig.profileStore;
    this.memoryStore = implConfig.memoryStore;
    this.logger = implConfig.logger ?? defaultLogger;
    this.masteryTracker = new MasteryTracker(this.profileStore, {
      levelThresholds: {
        beginner: this.config.remediationThreshold,
        intermediate: 70,
        proficient: this.config.masteryImprovementThreshold,
        expert: this.config.skipAheadThreshold
      }
    });
    this.pathwayCalculator = new PathwayCalculator(this.profileStore, {
      skipAheadThreshold: this.config.skipAheadThreshold,
      remediationThreshold: this.config.remediationThreshold
    });
    this.spacedRepetitionScheduler = new SpacedRepetitionScheduler(
      implConfig.reviewStore,
      this.config.spacedRepetitionConfig
    );
  }
  /**
   * Record an evaluation outcome
   */
  async recordEvaluationOutcome(outcome) {
    const result = {
      success: true,
      errors: []
    };
    this.logger.info("Recording evaluation outcome", {
      evaluationId: outcome.evaluationId,
      studentId: outcome.studentId,
      topicId: outcome.topicId,
      score: outcome.score
    });
    try {
      if (this.config.updateMasteryOnEvaluation) {
        const masteryResult = await this.masteryTracker.processEvaluation(outcome);
        result.newMasteryLevel = masteryResult.currentMastery.level;
        result.masteryChange = masteryResult.scoreDifference;
        this.logger.debug("Mastery updated", {
          level: result.newMasteryLevel,
          change: result.masteryChange
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown mastery error";
      result.errors?.push(`Mastery update failed: ${errorMessage}`);
      this.logger.error("Mastery update failed", { error: errorMessage });
    }
    try {
      if (this.config.adjustPathwayOnEvaluation && outcome.courseId) {
        const pathways = await this.profileStore.getActivePathways(
          outcome.studentId
        );
        const coursePathway = pathways.find(
          (p) => p.courseId === outcome.courseId
        );
        if (coursePathway) {
          const adjustmentResult = await this.pathwayCalculator.calculateAdjustment(
            outcome.studentId,
            coursePathway.id,
            outcome
          );
          result.pathwayAdjustments = [adjustmentResult.adjustment];
          this.logger.debug("Pathway adjusted", {
            type: adjustmentResult.adjustment.type,
            explanation: adjustmentResult.explanation
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown pathway error";
      result.errors?.push(`Pathway adjustment failed: ${errorMessage}`);
      this.logger.error("Pathway adjustment failed", { error: errorMessage });
    }
    try {
      if (this.config.updateSpacedRepetition) {
        const scheduleResult = await this.spacedRepetitionScheduler.scheduleFromEvaluation(outcome);
        result.spacedRepetitionUpdates = [
          {
            topicId: outcome.topicId,
            nextReviewDate: scheduleResult.entry.scheduledFor,
            priority: scheduleResult.entry.priority
          }
        ];
        this.logger.debug("Spaced repetition scheduled", {
          nextReview: scheduleResult.entry.scheduledFor,
          interval: scheduleResult.daysUntilReview
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown spaced repetition error";
      result.errors?.push(`Spaced repetition failed: ${errorMessage}`);
      this.logger.error("Spaced repetition failed", { error: errorMessage });
    }
    try {
      if (this.config.storeInMemory) {
        const memoryEntries = await this.createMemoryEntries(outcome, result);
        result.memoryEntriesCreated = memoryEntries.length;
        this.logger.debug("Memory entries created", {
          count: memoryEntries.length
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown memory error";
      result.errors?.push(`Memory storage failed: ${errorMessage}`);
      this.logger.error("Memory storage failed", { error: errorMessage });
    }
    result.success = !result.errors || result.errors.length === 0;
    this.logger.info("Evaluation outcome recorded", {
      success: result.success,
      newMasteryLevel: result.newMasteryLevel,
      memoryEntriesCreated: result.memoryEntriesCreated
    });
    return result;
  }
  /**
   * Get student profile
   */
  async getStudentProfile(studentId) {
    return this.profileStore.get(studentId);
  }
  /**
   * Get pending reviews for a student
   */
  async getPendingReviews(studentId) {
    return this.spacedRepetitionScheduler.getPendingReviews(studentId);
  }
  /**
   * Get relevant memories for context
   */
  async getRelevantMemories(studentId, topicId) {
    const topicMemories = await this.memoryStore.getByTopic(
      studentId,
      topicId,
      10
    );
    const importantMemories = await this.memoryStore.getImportant(
      studentId,
      "high"
    );
    const seenIds = /* @__PURE__ */ new Set();
    const combined = [];
    for (const memory of [...topicMemories, ...importantMemories]) {
      if (!seenIds.has(memory.id)) {
        seenIds.add(memory.id);
        combined.push(memory);
        await this.memoryStore.recordAccess(memory.id);
      }
    }
    return combined.slice(0, 20);
  }
  /**
   * Recalculate learning pathway
   */
  async recalculatePathway(studentId, pathwayId) {
    const recalculated = await this.pathwayCalculator.recalculatePathway(
      studentId,
      pathwayId
    );
    await this.profileStore.updatePathway(studentId, pathwayId, {
      type: "no_change",
      reason: "Full recalculation"
    });
    return recalculated;
  }
  /**
   * Get mastery summary for a student
   */
  async getMasterySummary(studentId) {
    return this.masteryTracker.getMasterySummary(studentId);
  }
  /**
   * Get review statistics
   */
  async getReviewStats(studentId) {
    return this.spacedRepetitionScheduler.getReviewStats(studentId);
  }
  /**
   * Create memory entries for an evaluation
   */
  async createMemoryEntries(outcome, result) {
    const entries = [];
    const evaluationMemory = await this.memoryStore.store({
      studentId: outcome.studentId,
      type: "EVALUATION_OUTCOME",
      content: {
        evaluationId: outcome.evaluationId,
        topicId: outcome.topicId,
        score: outcome.score,
        maxScore: outcome.maxScore,
        bloomsLevel: outcome.bloomsLevel,
        assessmentType: outcome.assessmentType,
        strengths: outcome.strengths,
        areasForImprovement: outcome.areasForImprovement,
        feedback: outcome.feedback
      },
      importance: this.calculateImportance(outcome),
      relatedTopics: [outcome.topicId],
      tags: [
        outcome.assessmentType,
        outcome.bloomsLevel,
        outcome.score >= 80 ? "success" : outcome.score >= 60 ? "progress" : "needs-work"
      ],
      createdAt: outcome.evaluatedAt,
      ttlDays: 365
      // Keep for 1 year
    });
    entries.push(evaluationMemory);
    if (result.newMasteryLevel && result.masteryChange && Math.abs(result.masteryChange) > 5) {
      const masteryMemory = await this.memoryStore.store({
        studentId: outcome.studentId,
        type: "MASTERY_UPDATE",
        content: {
          topicId: outcome.topicId,
          newLevel: result.newMasteryLevel,
          scoreChange: result.masteryChange
        },
        importance: Math.abs(result.masteryChange) > 10 ? "high" : "medium",
        relatedTopics: [outcome.topicId],
        tags: ["mastery", result.masteryChange > 0 ? "improvement" : "decline"],
        createdAt: /* @__PURE__ */ new Date(),
        ttlDays: 365
      });
      entries.push(masteryMemory);
    }
    if (outcome.score >= 90) {
      const milestoneMemory = await this.memoryStore.store({
        studentId: outcome.studentId,
        type: "LEARNING_MILESTONE",
        content: {
          topicId: outcome.topicId,
          achievement: "high_score",
          score: outcome.score,
          bloomsLevel: outcome.bloomsLevel
        },
        importance: "high",
        relatedTopics: [outcome.topicId],
        tags: ["milestone", "achievement", "high-score"],
        createdAt: /* @__PURE__ */ new Date(),
        ttlDays: void 0
        // Permanent
      });
      entries.push(milestoneMemory);
    }
    if (outcome.score < 50) {
      const struggleMemory = await this.memoryStore.store({
        studentId: outcome.studentId,
        type: "STRUGGLE_POINT",
        content: {
          topicId: outcome.topicId,
          score: outcome.score,
          areasForImprovement: outcome.areasForImprovement
        },
        importance: "high",
        relatedTopics: [outcome.topicId],
        tags: ["struggle", "needs-attention"],
        createdAt: /* @__PURE__ */ new Date(),
        ttlDays: 90
        // Keep for 90 days
      });
      entries.push(struggleMemory);
    }
    return entries;
  }
  /**
   * Calculate importance of an evaluation outcome
   */
  calculateImportance(outcome) {
    if (outcome.score >= 90) return "high";
    if (outcome.score < 50) return "high";
    const bloomsOrder = [
      "REMEMBER",
      "UNDERSTAND",
      "APPLY",
      "ANALYZE",
      "EVALUATE",
      "CREATE"
    ];
    const bloomsIndex = bloomsOrder.indexOf(outcome.bloomsLevel);
    if (bloomsIndex >= 4) return "high";
    if (bloomsIndex >= 2) return "medium";
    return "low";
  }
};
function createInMemoryMemoryStore() {
  return new InMemoryMemoryStore();
}
function createEvaluationMemoryIntegration(config) {
  return new EvaluationMemoryIntegrationImpl(config);
}
var defaultMemoryStore = null;
function getDefaultMemoryStore() {
  if (!defaultMemoryStore) {
    defaultMemoryStore = createInMemoryMemoryStore();
  }
  return defaultMemoryStore;
}
function resetDefaultMemoryStore() {
  defaultMemoryStore = null;
}

// src/memory-summary.ts
async function buildMemorySummary(options) {
  const { studentId, masteryTracker, spacedRepScheduler, maxTopics = 3 } = options;
  const [masterySummary, reviewStats] = await Promise.all([
    masteryTracker.getMasterySummary(studentId),
    spacedRepScheduler.getReviewStats(studentId)
  ]);
  const memoryLines = [];
  if (masterySummary.totalTopics > 0) {
    memoryLines.push(
      `Average mastery: ${Math.round(masterySummary.averageMastery)}% across ${masterySummary.totalTopics} topics (${masterySummary.recentTrend}).`
    );
  }
  if (masterySummary.strengths.length > 0) {
    memoryLines.push(
      `Strengths: ${masterySummary.strengths.slice(0, maxTopics).join(", ")}.`
    );
  }
  if (masterySummary.topicsNeedingAttention.length > 0) {
    memoryLines.push(
      `Needs attention: ${masterySummary.topicsNeedingAttention.slice(0, maxTopics).join(", ")}.`
    );
  }
  const reviewLines = [];
  if (reviewStats.totalPending > 0) {
    reviewLines.push(
      `Pending reviews: ${reviewStats.totalPending} (overdue: ${reviewStats.overdueCount}).`
    );
    reviewLines.push(
      `Due today: ${reviewStats.dueTodayCount}, due this week: ${reviewStats.dueThisWeekCount}.`
    );
  }
  const memorySummary = memoryLines.length > 0 ? memoryLines.join("\n") : void 0;
  const reviewSummary = reviewLines.length > 0 ? reviewLines.join("\n") : void 0;
  return {
    masterySummary,
    reviewStats,
    memorySummary,
    reviewSummary
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_MASTERY_TRACKER_CONFIG,
  DEFAULT_MEMORY_INTEGRATION_CONFIG,
  DEFAULT_PATHWAY_CALCULATOR_CONFIG,
  DEFAULT_SPACED_REPETITION_CONFIG,
  EvaluationMemoryIntegrationImpl,
  InMemoryMemoryStore,
  InMemoryReviewScheduleStore,
  InMemoryStudentProfileStore,
  MasteryTracker,
  PathwayCalculator,
  PrismaStudentProfileStore,
  SpacedRepetitionScheduler,
  buildMemorySummary,
  createEvaluationMemoryIntegration,
  createInMemoryMemoryStore,
  createInMemoryReviewScheduleStore,
  createInMemoryStudentProfileStore,
  createMasteryTracker,
  createPathwayCalculator,
  createPrismaStudentProfileStore,
  createSpacedRepetitionScheduler,
  getDefaultMemoryStore,
  getDefaultReviewScheduleStore,
  getDefaultStudentProfileStore,
  resetDefaultMemoryStore,
  resetDefaultReviewScheduleStore,
  resetDefaultStudentProfileStore
});
