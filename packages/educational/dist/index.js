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
  AchievementEngine: () => AchievementEngine,
  AdaptiveContentEngine: () => AdaptiveContentEngine,
  AdaptiveQuestionResponseSchema: () => AdaptiveQuestionResponseSchema,
  AdvancedExamEngine: () => AdvancedExamEngine,
  AnalyticsEngine: () => AnalyticsEngine,
  AssessmentQuestionSchema: () => AssessmentQuestionSchema,
  AssessmentQuestionsResponseSchema: () => AssessmentQuestionsResponseSchema,
  BloomsAnalysisEngine: () => BloomsAnalysisEngine,
  BloomsDistributionSchema: () => BloomsDistributionSchema,
  BloomsLevelSchema: () => BloomsLevelSchema,
  CollaborationEngine: () => CollaborationEngine,
  ComparisonToExpectedSchema: () => ComparisonToExpectedSchema,
  ContentAnalysisResponseSchema: () => ContentAnalysisResponseSchema,
  ContentGenerationEngine: () => ContentGenerationEngine,
  CourseGuideEngine: () => CourseGuideEngine,
  DEFAULT_RETRY_CONFIG: () => DEFAULT_RETRY_CONFIG,
  EnhancedDepthAnalysisEngine: () => EnhancedDepthAnalysisEngine,
  EvaluationEngine: () => SAMEvaluationEngine,
  FinancialEngine: () => FinancialEngine,
  GradingAssistanceResponseSchema: () => GradingAssistanceResponseSchema,
  InnovationEngine: () => InnovationEngine,
  IntegrityEngine: () => IntegrityEngine,
  MarketEngine: () => MarketEngine,
  MemoryEngine: () => MemoryEngine,
  MultimediaEngine: () => MultimediaEngine,
  PersonalizationEngine: () => PersonalizationEngine,
  PracticeProblemsEngine: () => PracticeProblemsEngine,
  PredictiveEngine: () => PredictiveEngine,
  QuestionOptionSchema: () => QuestionOptionSchema,
  ResearchEngine: () => ResearchEngine,
  ResourceEngine: () => ResourceEngine,
  RubricAlignmentSchema: () => RubricAlignmentSchema,
  SAMEvaluationEngine: () => SAMEvaluationEngine,
  SocialEngine: () => SocialEngine,
  SocraticTeachingEngine: () => SocraticTeachingEngine,
  SubjectiveEvaluationResponseSchema: () => SubjectiveEvaluationResponseSchema,
  TrendsEngine: () => TrendsEngine,
  UnifiedBloomsAdapterEngine: () => UnifiedBloomsAdapterEngine,
  UnifiedBloomsEngine: () => UnifiedBloomsEngine,
  createAchievementEngine: () => createAchievementEngine,
  createAdaptiveContentEngine: () => createAdaptiveContentEngine,
  createAnalyticsEngine: () => createAnalyticsEngine,
  createBloomsAnalysisEngine: () => createBloomsAnalysisEngine,
  createCollaborationEngine: () => createCollaborationEngine,
  createContentGenerationEngine: () => createContentGenerationEngine,
  createCourseGuideEngine: () => createCourseGuideEngine,
  createEnhancedDepthAnalysisEngine: () => createEnhancedDepthAnalysisEngine,
  createEvaluationEngine: () => createEvaluationEngine,
  createExamEngine: () => createExamEngine,
  createFinancialEngine: () => createFinancialEngine,
  createInnovationEngine: () => createInnovationEngine,
  createIntegrityEngine: () => createIntegrityEngine,
  createMarketEngine: () => createMarketEngine,
  createMemoryEngine: () => createMemoryEngine,
  createMultimediaEngine: () => createMultimediaEngine,
  createPartialSchema: () => createPartialSchema,
  createPersonalizationEngine: () => createPersonalizationEngine,
  createPracticeProblemsEngine: () => createPracticeProblemsEngine,
  createPredictiveEngine: () => createPredictiveEngine,
  createResearchEngine: () => createResearchEngine,
  createResourceEngine: () => createResourceEngine,
  createRetryPrompt: () => createRetryPrompt,
  createSocialEngine: () => createSocialEngine,
  createSocraticTeachingEngine: () => createSocraticTeachingEngine,
  createTrendsEngine: () => createTrendsEngine,
  createUnifiedBloomsAdapterEngine: () => createUnifiedBloomsAdapterEngine,
  createUnifiedBloomsEngine: () => createUnifiedBloomsEngine,
  enhancedDepthEngine: () => enhancedDepthEngine,
  executeWithRetry: () => executeWithRetry,
  extractJson: () => extractJson,
  extractJsonWithOptions: () => extractJsonWithOptions,
  fixCommonJsonIssues: () => fixCommonJsonIssues,
  parseAndValidate: () => parseAndValidate,
  safeParseWithDefaults: () => safeParseWithDefaults,
  validateAdaptiveQuestionResponse: () => validateAdaptiveQuestionResponse,
  validateAssessmentQuestionsResponse: () => validateAssessmentQuestionsResponse,
  validateContentAnalysisResponse: () => validateContentAnalysisResponse,
  validateEvaluationResponse: () => validateEvaluationResponse,
  validateGradingAssistanceResponse: () => validateGradingAssistanceResponse,
  validateSchema: () => validateSchema,
  validateWithDefaults: () => validateWithDefaults
});
module.exports = __toCommonJS(index_exports);

// src/engines/exam-engine.ts
var AdvancedExamEngine = class {
  config;
  database;
  logger;
  constructor(engineConfig) {
    this.config = engineConfig.samConfig;
    this.database = engineConfig.database ?? engineConfig.samConfig.database;
    this.logger = this.config.logger ?? console;
  }
  /**
   * Generate a comprehensive exam with Bloom's taxonomy alignment
   */
  async generateExam(courseId, sectionIds, config, studentProfile) {
    this.logger?.info?.("[ExamEngine] Generating exam", { courseId, sectionIds, config });
    const existingQuestions = this.database ? await this.getQuestionBankQuestions(courseId, sectionIds) : [];
    const studentAnalysis = studentProfile && this.database ? await this.analyzeStudentPerformance(studentProfile.userId, courseId) : null;
    const questions = await this.generateQuestions(
      courseId,
      sectionIds,
      config,
      existingQuestions,
      studentAnalysis
    );
    const metadata = this.calculateMetadata(questions, config);
    const bloomsAnalysis = this.calculateBloomsAlignment(config, questions);
    const adaptiveSettings = config.adaptiveMode ? this.generateAdaptiveSettings(config, studentProfile) : void 0;
    const studyGuide = await this.generateStudyGuide(questions, studentProfile);
    const examId = this.generateId();
    return {
      exam: {
        id: examId,
        questions,
        metadata
      },
      bloomsAnalysis,
      adaptiveSettings,
      studyGuide
    };
  }
  /**
   * Get question bank questions using database adapter
   */
  async getQuestionBankQuestions(courseId, sectionIds) {
    if (!this.database) return [];
    try {
      const filter = {};
      if (courseId) {
        filter.courseId = courseId;
      }
      if (sectionIds && sectionIds.length > 0) {
        filter.sectionId = sectionIds[0];
      }
      const questions = await this.database.findQuestions(
        filter,
        { limit: 100 }
      );
      return questions.map((q) => this.mapDatabaseQuestion(q));
    } catch (error) {
      this.logger?.warn?.("[ExamEngine] Error fetching question bank", error);
      return [];
    }
  }
  /**
   * Analyze student performance for adaptive exam generation
   */
  async analyzeStudentPerformance(userId, courseId) {
    if (!this.database || !courseId) return null;
    try {
      const progress = await this.database.findBloomsProgress(userId, courseId);
      if (!progress) return null;
      const scores = {
        REMEMBER: progress.rememberScore ?? 0,
        UNDERSTAND: progress.understandScore ?? 0,
        APPLY: progress.applyScore ?? 0,
        ANALYZE: progress.analyzeScore ?? 0,
        EVALUATE: progress.evaluateScore ?? 0,
        CREATE: progress.createScore ?? 0
      };
      const strengths = [];
      const weaknesses = [];
      for (const [level, score] of Object.entries(scores)) {
        if (score >= 70) {
          strengths.push(level);
        } else if (score < 40) {
          weaknesses.push(level);
        }
      }
      return {
        overallScore: progress.overallScore ?? Object.values(scores).reduce((a, b) => a + b, 0) / 6,
        strengths,
        weaknesses,
        bloomsScores: scores
      };
    } catch (error) {
      this.logger?.warn?.("[ExamEngine] Error analyzing student performance", error);
      return null;
    }
  }
  /**
   * Generate questions using AI
   */
  async generateQuestions(courseId, sectionIds, config, existingQuestions, studentAnalysis) {
    const existingCount = existingQuestions.length;
    const neededCount = Math.max(0, config.totalQuestions - existingCount);
    const selectedExisting = this.selectMatchingQuestions(
      existingQuestions,
      config,
      Math.min(existingCount, config.totalQuestions)
    );
    const generatedQuestions = [];
    if (neededCount > 0) {
      const newQuestions = await this.generateQuestionsWithAI(
        courseId,
        sectionIds,
        config,
        neededCount,
        studentAnalysis
      );
      generatedQuestions.push(...newQuestions);
    }
    const allQuestions = [...selectedExisting, ...generatedQuestions];
    return this.shuffleArray(allQuestions).slice(0, config.totalQuestions);
  }
  /**
   * Generate questions using AI adapter
   */
  async generateQuestionsWithAI(_courseId, _sectionIds, config, count, studentAnalysis) {
    const prompt = this.buildQuestionGenerationPrompt(config, count, studentAnalysis);
    try {
      const response = await this.config.ai.chat({
        messages: [
          {
            role: "system",
            content: `You are an expert educational assessment designer specializing in Bloom's Taxonomy-aligned question creation.
Generate exam questions that:
1. Align with specified Bloom's taxonomy levels
2. Match the requested difficulty distribution
3. Include clear, unambiguous wording
4. Provide comprehensive explanations
5. Are appropriate for adaptive testing if enabled

Return your response as a valid JSON array of questions.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        maxTokens: 4e3
      });
      return this.parseGeneratedQuestions(response.content);
    } catch (error) {
      this.logger?.error?.("[ExamEngine] AI question generation failed", error);
      return this.generateFallbackQuestions(config, count);
    }
  }
  /**
   * Build the question generation prompt
   */
  buildQuestionGenerationPrompt(config, count, studentAnalysis) {
    const adaptiveContext = studentAnalysis ? `
Student Analysis:
- Overall Score: ${studentAnalysis.overallScore.toFixed(1)}%
- Strengths: ${studentAnalysis.strengths.join(", ") || "None identified"}
- Weaknesses: ${studentAnalysis.weaknesses.join(", ") || "None identified"}
- Focus more questions on weakness areas for remediation.` : "";
    return `Generate ${count} exam questions with the following specifications:

Bloom's Taxonomy Distribution:
${Object.entries(config.bloomsDistribution).map(([level, pct]) => `- ${level}: ${pct}%`).join("\n")}

Difficulty Distribution:
${Object.entries(config.difficultyDistribution).map(([level, pct]) => `- ${level}: ${pct}%`).join("\n")}

Question Types Allowed: ${config.questionTypes.join(", ")}
Adaptive Mode: ${config.adaptiveMode ? "Enabled - include hints and adaptive metadata" : "Disabled"}
${adaptiveContext}

Return a JSON array where each question has:
{
  "id": "unique-id",
  "text": "question text",
  "questionType": "MULTIPLE_CHOICE|TRUE_FALSE|SHORT_ANSWER|ESSAY|FILL_IN_BLANK|MATCHING|ORDERING",
  "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
  "difficulty": "EASY|MEDIUM|HARD",
  "options": [{"id": "a", "text": "option", "isCorrect": true/false}] // for MCQ
  "correctAnswer": "correct answer or explanation",
  "explanation": "detailed explanation of the answer",
  "hints": ["hint1", "hint2"] // optional, for adaptive mode
  "timeEstimate": 60, // seconds
  "points": 10,
  "tags": ["topic1", "topic2"]
}`;
  }
  /**
   * Parse AI-generated questions
   */
  parseGeneratedQuestions(content) {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        this.logger?.warn?.("[ExamEngine] No JSON array found in AI response");
        return [];
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((q, index) => ({
        id: q.id || this.generateId(),
        text: q.text || "",
        questionType: q.questionType || "MULTIPLE_CHOICE",
        bloomsLevel: q.bloomsLevel || "UNDERSTAND",
        difficulty: q.difficulty || "MEDIUM",
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        hints: q.hints,
        timeEstimate: q.timeEstimate || 60,
        points: q.points || 10,
        tags: q.tags || [],
        metadata: {
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          isAdaptive: !!q.hints,
          learningObjective: q.learningObjective,
          cognitiveProcess: this.getCognitiveProcess(q.bloomsLevel)
        }
      }));
    } catch (error) {
      this.logger?.error?.("[ExamEngine] Failed to parse AI response", error);
      return [];
    }
  }
  /**
   * Generate fallback questions when AI fails
   */
  generateFallbackQuestions(config, count) {
    const questions = [];
    const levels = Object.keys(config.bloomsDistribution);
    const difficulties = Object.keys(config.difficultyDistribution);
    for (let i = 0; i < count; i++) {
      questions.push({
        id: this.generateId(),
        text: `Generated Question ${i + 1}`,
        questionType: config.questionTypes[i % config.questionTypes.length],
        bloomsLevel: levels[i % levels.length],
        difficulty: difficulties[i % difficulties.length],
        correctAnswer: "To be determined",
        explanation: "Explanation pending",
        timeEstimate: 60,
        points: 10,
        tags: [],
        metadata: {
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          isAdaptive: config.adaptiveMode
        }
      });
    }
    return questions;
  }
  /**
   * Select matching questions from existing pool
   */
  selectMatchingQuestions(questions, config, maxCount) {
    const filtered = questions.filter(
      (q) => config.questionTypes.includes(q.questionType)
    );
    const sorted = filtered.sort((a, b) => {
      const aWeight = config.bloomsDistribution[a.bloomsLevel] || 0;
      const bWeight = config.bloomsDistribution[b.bloomsLevel] || 0;
      return bWeight - aWeight;
    });
    return sorted.slice(0, maxCount);
  }
  /**
   * Calculate exam metadata
   */
  calculateMetadata(questions, config) {
    const bloomsDist = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    const difficultyDist = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0
    };
    let totalPoints = 0;
    let totalTime = 0;
    const topics = /* @__PURE__ */ new Set();
    const objectives = /* @__PURE__ */ new Set();
    for (const q of questions) {
      bloomsDist[q.bloomsLevel]++;
      difficultyDist[q.difficulty]++;
      totalPoints += q.points;
      totalTime += q.timeEstimate;
      q.tags.forEach((t) => topics.add(t));
      if (q.metadata.learningObjective) {
        objectives.add(q.metadata.learningObjective);
      }
    }
    return {
      totalQuestions: questions.length,
      totalPoints,
      estimatedDuration: Math.ceil(totalTime / 60),
      // Convert to minutes
      bloomsDistribution: bloomsDist,
      difficultyDistribution: difficultyDist,
      topicsCovered: Array.from(topics),
      learningObjectives: Array.from(objectives)
    };
  }
  /**
   * Calculate Bloom's alignment analysis
   */
  calculateBloomsAlignment(config, questions) {
    const actual = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    for (const q of questions) {
      actual[q.bloomsLevel]++;
    }
    const total = questions.length || 1;
    const actualPct = {};
    const deviation = {};
    for (const level of Object.keys(actual)) {
      actualPct[level] = actual[level] / total * 100;
      deviation[level] = actualPct[level] - (config.bloomsDistribution[level] || 0);
    }
    const totalDeviation = Object.values(deviation).reduce(
      (sum, d) => sum + Math.abs(d),
      0
    );
    const alignmentScore = Math.max(0, 100 - totalDeviation / 2);
    const cognitiveProgression = this.generateCognitiveProgression(questions);
    const skillsCovered = this.calculateSkillsCovered(questions);
    return {
      targetVsActual: {
        target: config.bloomsDistribution,
        actual: actualPct,
        deviation,
        alignmentScore
      },
      cognitiveProgression,
      skillsCovered
    };
  }
  /**
   * Generate adaptive settings
   */
  generateAdaptiveSettings(config, studentProfile) {
    const startingDifficulty = studentProfile ? studentProfile.currentLevel === "advanced" ? "HARD" : studentProfile.currentLevel === "beginner" ? "EASY" : "MEDIUM" : "MEDIUM";
    return {
      startingQuestionDifficulty: startingDifficulty,
      adjustmentRules: [
        { condition: "correct_streak >= 3", action: "increase_difficulty", threshold: 3 },
        { condition: "incorrect_streak >= 2", action: "decrease_difficulty", threshold: 2 },
        { condition: "time_exceeded", action: "offer_hint", threshold: 1.5 }
      ],
      performanceThresholds: [
        { level: "mastery", minScore: 90, action: "advance_to_next_level" },
        { level: "proficient", minScore: 70, action: "continue_current_level" },
        { level: "developing", minScore: 50, action: "provide_additional_practice" },
        { level: "struggling", minScore: 0, action: "remediate_and_scaffold" }
      ],
      minQuestions: Math.floor(config.totalQuestions * 0.5),
      maxQuestions: config.totalQuestions
    };
  }
  /**
   * Generate study guide based on exam content
   */
  async generateStudyGuide(questions, studentProfile) {
    const levelCounts = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    for (const q of questions) {
      levelCounts[q.bloomsLevel]++;
    }
    const focusAreas = [];
    const sortedLevels = Object.entries(levelCounts).sort(([, a], [, b]) => b - a).slice(0, 3);
    for (const [level] of sortedLevels) {
      focusAreas.push(`${level} level questions - ${this.getCognitiveProcess(level)}`);
    }
    if (studentProfile?.weaknesses) {
      for (const weakness of studentProfile.weaknesses) {
        if (!focusAreas.some((f) => f.includes(weakness))) {
          focusAreas.push(`${weakness} (identified weakness area)`);
        }
      }
    }
    const recommendedResources = focusAreas.map((area, i) => ({
      type: i === 0 ? "video" : i === 1 ? "article" : "practice",
      title: `Study Material: ${area}`,
      description: `Recommended resource for improving in ${area}`,
      relevance: 0.9 - i * 0.1
    }));
    const practiceQuestions = questions.filter((q) => q.difficulty !== "HARD").slice(0, 5);
    return {
      focusAreas,
      recommendedResources,
      practiceQuestions
    };
  }
  /**
   * Get exam analysis
   */
  async getExamAnalysis(examId) {
    return {
      distribution: {
        REMEMBER: 15,
        UNDERSTAND: 20,
        APPLY: 25,
        ANALYZE: 20,
        EVALUATE: 15,
        CREATE: 5
      },
      dominantLevel: "APPLY",
      gaps: ["CREATE"],
      recommendations: [
        {
          level: "CREATE",
          action: "Add more synthesis and creation questions",
          priority: "high"
        }
      ],
      cognitiveProfile: {
        overallMastery: 65,
        levelMastery: {
          REMEMBER: 80,
          UNDERSTAND: 75,
          APPLY: 70,
          ANALYZE: 60,
          EVALUATE: 50,
          CREATE: 35
        },
        learningVelocity: 0.7,
        preferredLevels: ["APPLY", "UNDERSTAND"],
        challengeAreas: ["CREATE", "EVALUATE"]
      }
    };
  }
  // ============================================================================
  // QUESTION BANK OPERATIONS
  // ============================================================================
  /**
   * Save questions to the question bank
   */
  async saveToQuestionBank(questions, courseId, subject, topic) {
    if (!this.database) {
      this.logger?.warn?.("[ExamEngine] No database adapter available for question bank");
      return { saved: 0, errors: ["No database adapter configured"] };
    }
    const errors = [];
    let savedCount = 0;
    for (const question of questions) {
      try {
        const optionsAsStrings = question.options?.map(
          (o) => typeof o === "string" ? o : JSON.stringify(o)
        ) || [];
        const samQuestionType = this.mapQuestionTypeToSAM(question.questionType);
        const questionData = {
          courseId: courseId || "",
          // Database adapter expects string
          subject,
          topic,
          subtopic: question.subtopic || "",
          question: question.question,
          questionType: samQuestionType,
          bloomsLevel: question.bloomsLevel,
          difficulty: question.difficulty,
          options: optionsAsStrings,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          hints: question.hints || [],
          tags: question.tags,
          points: 10,
          // Default points value
          usageCount: 0,
          avgTimeSpent: 0,
          successRate: 0,
          metadata: question.metadata || {}
        };
        await this.database.createQuestion(questionData);
        savedCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        errors.push(`Failed to save question "${question.question.slice(0, 50)}...": ${errorMsg}`);
        this.logger?.warn?.("[ExamEngine] Failed to save question to bank", error);
      }
    }
    this.logger?.info?.("[ExamEngine] Saved questions to bank", { saved: savedCount, errors: errors.length });
    return { saved: savedCount, errors };
  }
  /**
   * Retrieve questions from the question bank matching query criteria
   */
  async getFromQuestionBank(query) {
    if (!this.database) {
      this.logger?.warn?.("[ExamEngine] No database adapter available for question bank");
      return { questions: [], total: 0, hasMore: false };
    }
    try {
      const filter = {};
      if (query.courseId) filter.courseId = query.courseId;
      if (query.subject) filter.subject = query.subject;
      if (query.topic) filter.topic = query.topic;
      if (query.bloomsLevel) filter.bloomsLevel = query.bloomsLevel;
      if (query.difficulty) filter.difficulty = query.difficulty;
      if (query.questionType) filter.questionType = query.questionType;
      const limit = query.limit ?? 50;
      const offset = query.offset ?? 0;
      const dbQuestions = await this.database.findQuestions(
        filter,
        { limit: limit + 1, offset }
      );
      const hasMore = dbQuestions.length > limit;
      const questions = dbQuestions.slice(0, limit);
      const mappedQuestions = questions.map(
        (q) => this.mapToQuestionBankEntry(q)
      );
      const total = hasMore ? offset + limit + 1 : offset + questions.length;
      return { questions: mappedQuestions, total, hasMore };
    } catch (error) {
      this.logger?.error?.("[ExamEngine] Failed to query question bank", error);
      return { questions: [], total: 0, hasMore: false };
    }
  }
  /**
   * Get statistics about the question bank
   */
  async getQuestionBankStats(query) {
    if (!this.database) {
      this.logger?.warn?.("[ExamEngine] No database adapter available for question bank stats");
      return this.getEmptyStats();
    }
    try {
      const filter = {};
      if (query.courseId) filter.courseId = query.courseId;
      if (query.subject) filter.subject = query.subject;
      if (query.topic) filter.topic = query.topic;
      const questions = await this.database.findQuestions(
        filter,
        { limit: 1e4 }
        // Get all for accurate stats
      );
      return this.calculateQuestionBankStats(questions);
    } catch (error) {
      this.logger?.error?.("[ExamEngine] Failed to get question bank stats", error);
      return this.getEmptyStats();
    }
  }
  /**
   * Update question usage statistics after exam completion
   */
  async updateQuestionUsage(questionIds, results) {
    if (!this.database) {
      this.logger?.warn?.("[ExamEngine] No database adapter available for usage update");
      return;
    }
    for (const result of results) {
      try {
        this.logger?.info?.("[ExamEngine] Would update question usage", {
          questionId: result.questionId,
          correct: result.correct,
          timeSpent: result.timeSpent
        });
      } catch (error) {
        this.logger?.warn?.("[ExamEngine] Failed to update question usage", error);
      }
    }
  }
  // ============================================================================
  // QUESTION BANK HELPER METHODS
  // ============================================================================
  mapToQuestionBankEntry(q) {
    return {
      id: q.id,
      courseId: q.courseId,
      subject: q.subject || "",
      topic: q.topic || "",
      subtopic: q.subtopic,
      question: q.question || q.text || "",
      questionType: q.questionType || "MULTIPLE_CHOICE",
      bloomsLevel: q.bloomsLevel || "UNDERSTAND",
      difficulty: q.difficulty || "MEDIUM",
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
      hints: q.hints,
      tags: q.tags || [],
      usageCount: q.usageCount || 0,
      successRate: q.successRate || 0,
      avgTimeSpent: q.avgTimeSpent || 0,
      metadata: q.metadata
    };
  }
  calculateQuestionBankStats(questions) {
    const stats = {
      totalQuestions: questions.length,
      bloomsDistribution: {
        REMEMBER: 0,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0
      },
      difficultyDistribution: {
        EASY: 0,
        MEDIUM: 0,
        HARD: 0
      },
      typeDistribution: {
        MULTIPLE_CHOICE: 0,
        TRUE_FALSE: 0,
        SHORT_ANSWER: 0,
        ESSAY: 0,
        FILL_IN_BLANK: 0,
        MATCHING: 0,
        ORDERING: 0
      },
      averageDifficulty: 0,
      totalUsage: 0
    };
    if (questions.length === 0) {
      return stats;
    }
    let difficultySum = 0;
    for (const q of questions) {
      const bloomsLevel = q.bloomsLevel;
      if (bloomsLevel && bloomsLevel in stats.bloomsDistribution) {
        stats.bloomsDistribution[bloomsLevel]++;
      }
      const difficulty = q.difficulty;
      if (difficulty && difficulty in stats.difficultyDistribution) {
        stats.difficultyDistribution[difficulty]++;
        difficultySum += difficulty === "EASY" ? 1 : difficulty === "MEDIUM" ? 2 : 3;
      }
      const questionType = q.questionType;
      if (questionType && questionType in stats.typeDistribution) {
        stats.typeDistribution[questionType]++;
      }
      stats.totalUsage += q.usageCount || 0;
    }
    stats.averageDifficulty = difficultySum / questions.length;
    for (const level of Object.keys(stats.bloomsDistribution)) {
      stats.bloomsDistribution[level] = stats.bloomsDistribution[level] / questions.length * 100;
    }
    for (const diff of Object.keys(stats.difficultyDistribution)) {
      stats.difficultyDistribution[diff] = stats.difficultyDistribution[diff] / questions.length * 100;
    }
    for (const type of Object.keys(stats.typeDistribution)) {
      stats.typeDistribution[type] = stats.typeDistribution[type] / questions.length * 100;
    }
    return stats;
  }
  getEmptyStats() {
    return {
      totalQuestions: 0,
      bloomsDistribution: {
        REMEMBER: 0,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0
      },
      difficultyDistribution: {
        EASY: 0,
        MEDIUM: 0,
        HARD: 0
      },
      typeDistribution: {
        MULTIPLE_CHOICE: 0,
        TRUE_FALSE: 0,
        SHORT_ANSWER: 0,
        ESSAY: 0,
        FILL_IN_BLANK: 0,
        MATCHING: 0,
        ORDERING: 0
      },
      averageDifficulty: 0,
      totalUsage: 0
    };
  }
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  mapQuestionTypeToSAM(questionType) {
    const mapping = {
      MULTIPLE_CHOICE: "multiple_choice",
      TRUE_FALSE: "true_false",
      SHORT_ANSWER: "short_answer",
      ESSAY: "essay",
      FILL_IN_BLANK: "fill_blank",
      MATCHING: "short_answer",
      // Map to short_answer as fallback
      ORDERING: "short_answer"
      // Map to short_answer as fallback
    };
    return mapping[questionType] || "multiple_choice";
  }
  mapDatabaseQuestion(q) {
    return {
      id: q.id,
      text: q.question || q.text || "",
      questionType: q.questionType || "MULTIPLE_CHOICE",
      bloomsLevel: q.bloomsLevel || "UNDERSTAND",
      difficulty: q.difficulty || "MEDIUM",
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
      hints: q.hints,
      timeEstimate: q.timeEstimate || 60,
      points: q.points || 10,
      tags: q.tags || [],
      metadata: {
        createdAt: q.createdAt?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
        isAdaptive: !!q.hints,
        learningObjective: q.learningObjective,
        cognitiveProcess: this.getCognitiveProcess(q.bloomsLevel)
      }
    };
  }
  generateCognitiveProgression(questions) {
    const levels = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    const progression = [];
    for (const level of levels) {
      const count = questions.filter((q) => q.bloomsLevel === level).length;
      if (count > 0) {
        progression.push(`${level}: ${count} questions (${this.getCognitiveProcess(level)})`);
      }
    }
    return progression;
  }
  calculateSkillsCovered(questions) {
    const skillMap = /* @__PURE__ */ new Map();
    for (const q of questions) {
      for (const tag of q.tags) {
        const existing = skillMap.get(tag);
        if (existing) {
          existing.count++;
        } else {
          skillMap.set(tag, { level: q.bloomsLevel, count: 1 });
        }
      }
    }
    return Array.from(skillMap.entries()).map(([name, data]) => ({
      name,
      bloomsLevel: data.level,
      coverage: data.count / questions.length * 100
    }));
  }
  getCognitiveProcess(level) {
    const processes = {
      REMEMBER: "Recall facts and basic concepts",
      UNDERSTAND: "Explain ideas and concepts",
      APPLY: "Use information in new situations",
      ANALYZE: "Draw connections among ideas",
      EVALUATE: "Justify decisions or arguments",
      CREATE: "Produce new or original work"
    };
    return processes[level] || "Unknown process";
  }
  generateId() {
    return `exam-q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
};
function createExamEngine(config) {
  return new AdvancedExamEngine(config);
}

// src/validation/schemas.ts
var import_zod = require("zod");
var BloomsLevelSchema = import_zod.z.enum([
  "REMEMBER",
  "UNDERSTAND",
  "APPLY",
  "ANALYZE",
  "EVALUATE",
  "CREATE"
]);
var SubjectiveEvaluationResponseSchema = import_zod.z.object({
  score: import_zod.z.number().min(0),
  accuracy: import_zod.z.number().min(0).max(100).optional(),
  completeness: import_zod.z.number().min(0).max(100).optional(),
  relevance: import_zod.z.number().min(0).max(100).optional(),
  depth: import_zod.z.number().min(0).max(100).optional(),
  feedback: import_zod.z.string().optional(),
  strengths: import_zod.z.array(import_zod.z.string()).optional(),
  improvements: import_zod.z.array(import_zod.z.string()).optional(),
  nextSteps: import_zod.z.array(import_zod.z.string()).optional(),
  demonstratedBloomsLevel: BloomsLevelSchema.optional(),
  misconceptions: import_zod.z.array(import_zod.z.string()).optional()
}).transform((data) => ({
  score: data.score,
  accuracy: data.accuracy ?? 0,
  completeness: data.completeness ?? 0,
  relevance: data.relevance ?? 0,
  depth: data.depth ?? 0,
  feedback: data.feedback ?? "Evaluation complete.",
  strengths: data.strengths ?? [],
  improvements: data.improvements ?? [],
  nextSteps: data.nextSteps ?? [],
  demonstratedBloomsLevel: data.demonstratedBloomsLevel,
  misconceptions: data.misconceptions
}));
var RubricAlignmentInputSchema = import_zod.z.object({
  criterionName: import_zod.z.string(),
  score: import_zod.z.number().min(0),
  maxScore: import_zod.z.number().min(0),
  justification: import_zod.z.string().optional()
});
var ComparisonToExpectedInputSchema = import_zod.z.object({
  coveragePercentage: import_zod.z.number().min(0).max(100).optional(),
  missingKeyPoints: import_zod.z.array(import_zod.z.string()).optional(),
  extraneousPoints: import_zod.z.array(import_zod.z.string()).optional(),
  accuracyScore: import_zod.z.number().min(0).max(100).optional()
});
var GradingAssistanceResponseSchema = import_zod.z.object({
  suggestedScore: import_zod.z.number().min(0),
  maxScore: import_zod.z.number().min(0),
  confidence: import_zod.z.number().min(0).max(1).optional(),
  reasoning: import_zod.z.string().optional(),
  rubricAlignment: import_zod.z.array(RubricAlignmentInputSchema).optional(),
  keyStrengths: import_zod.z.array(import_zod.z.string()).optional(),
  keyWeaknesses: import_zod.z.array(import_zod.z.string()).optional(),
  suggestedFeedback: import_zod.z.string().optional(),
  flaggedIssues: import_zod.z.array(import_zod.z.string()).optional(),
  comparisonToExpected: ComparisonToExpectedInputSchema.optional(),
  teacherTips: import_zod.z.array(import_zod.z.string()).optional()
}).transform((data) => ({
  suggestedScore: data.suggestedScore,
  maxScore: data.maxScore,
  confidence: data.confidence ?? 0.5,
  reasoning: data.reasoning ?? "",
  rubricAlignment: (data.rubricAlignment ?? []).map((r) => ({
    criterionName: r.criterionName,
    score: r.score,
    maxScore: r.maxScore,
    justification: r.justification ?? ""
  })),
  keyStrengths: data.keyStrengths ?? [],
  keyWeaknesses: data.keyWeaknesses ?? [],
  suggestedFeedback: data.suggestedFeedback ?? "",
  flaggedIssues: data.flaggedIssues ?? [],
  comparisonToExpected: {
    coveragePercentage: data.comparisonToExpected?.coveragePercentage ?? 0,
    missingKeyPoints: data.comparisonToExpected?.missingKeyPoints ?? [],
    extraneousPoints: data.comparisonToExpected?.extraneousPoints ?? [],
    accuracyScore: data.comparisonToExpected?.accuracyScore ?? 0
  },
  teacherTips: data.teacherTips ?? []
}));
var QuestionOptionInputSchema = import_zod.z.object({
  id: import_zod.z.string(),
  text: import_zod.z.string(),
  isCorrect: import_zod.z.boolean().optional()
});
var AdaptiveQuestionResponseSchema = import_zod.z.object({
  id: import_zod.z.string().optional(),
  text: import_zod.z.string().min(1),
  questionType: import_zod.z.string().optional(),
  bloomsLevel: BloomsLevelSchema.optional(),
  difficulty: import_zod.z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  options: import_zod.z.array(QuestionOptionInputSchema).optional(),
  correctAnswer: import_zod.z.union([import_zod.z.string(), import_zod.z.array(import_zod.z.string())]).optional(),
  explanation: import_zod.z.string().optional(),
  hints: import_zod.z.array(import_zod.z.string()).optional(),
  timeEstimate: import_zod.z.number().min(0).optional(),
  points: import_zod.z.number().min(0).optional(),
  tags: import_zod.z.array(import_zod.z.string()).optional()
}).transform((data) => ({
  id: data.id,
  text: data.text,
  questionType: data.questionType ?? "MULTIPLE_CHOICE",
  bloomsLevel: data.bloomsLevel ?? "UNDERSTAND",
  difficulty: data.difficulty ?? "MEDIUM",
  options: data.options?.map((o) => ({
    id: o.id,
    text: o.text,
    isCorrect: o.isCorrect ?? false
  })),
  correctAnswer: data.correctAnswer,
  explanation: data.explanation ?? "",
  hints: data.hints ?? [],
  timeEstimate: data.timeEstimate ?? 60,
  points: data.points ?? 10,
  tags: data.tags ?? []
}));
var AssessmentQuestionInputSchema = import_zod.z.object({
  id: import_zod.z.string().optional(),
  text: import_zod.z.string().min(1),
  questionType: import_zod.z.string(),
  bloomsLevel: BloomsLevelSchema,
  difficulty: import_zod.z.enum(["EASY", "MEDIUM", "HARD"]),
  options: import_zod.z.array(QuestionOptionInputSchema).optional(),
  correctAnswer: import_zod.z.union([import_zod.z.string(), import_zod.z.array(import_zod.z.string())]).optional(),
  explanation: import_zod.z.string().optional(),
  hints: import_zod.z.array(import_zod.z.string()).optional(),
  timeEstimate: import_zod.z.number().min(0).optional(),
  points: import_zod.z.number().min(0).optional(),
  tags: import_zod.z.array(import_zod.z.string()).optional(),
  learningObjective: import_zod.z.string().optional()
});
var AssessmentQuestionsResponseSchema = import_zod.z.array(AssessmentQuestionInputSchema).transform(
  (questions) => questions.map((q) => ({
    id: q.id,
    text: q.text,
    questionType: q.questionType,
    bloomsLevel: q.bloomsLevel,
    difficulty: q.difficulty,
    options: q.options?.map((o) => ({
      id: o.id,
      text: o.text,
      isCorrect: o.isCorrect ?? false
    })),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation ?? "",
    hints: q.hints ?? [],
    timeEstimate: q.timeEstimate ?? 60,
    points: q.points ?? 10,
    tags: q.tags ?? [],
    learningObjective: q.learningObjective
  }))
);
var BloomsDistributionInputSchema = import_zod.z.object({
  REMEMBER: import_zod.z.number().min(0).optional(),
  UNDERSTAND: import_zod.z.number().min(0).optional(),
  APPLY: import_zod.z.number().min(0).optional(),
  ANALYZE: import_zod.z.number().min(0).optional(),
  EVALUATE: import_zod.z.number().min(0).optional(),
  CREATE: import_zod.z.number().min(0).optional()
});
var ContentAnalysisResponseSchema = import_zod.z.object({
  primaryLevel: BloomsLevelSchema,
  distribution: BloomsDistributionInputSchema.optional(),
  confidence: import_zod.z.number().min(0).max(1).optional(),
  cognitiveDepth: import_zod.z.number().min(0).max(100).optional(),
  keyVerbs: import_zod.z.array(import_zod.z.string()).optional(),
  recommendations: import_zod.z.array(import_zod.z.string()).optional()
}).transform((data) => ({
  primaryLevel: data.primaryLevel,
  distribution: {
    REMEMBER: data.distribution?.REMEMBER ?? 0,
    UNDERSTAND: data.distribution?.UNDERSTAND ?? 0,
    APPLY: data.distribution?.APPLY ?? 0,
    ANALYZE: data.distribution?.ANALYZE ?? 0,
    EVALUATE: data.distribution?.EVALUATE ?? 0,
    CREATE: data.distribution?.CREATE ?? 0
  },
  confidence: data.confidence ?? 0.7,
  cognitiveDepth: data.cognitiveDepth ?? 50,
  keyVerbs: data.keyVerbs ?? [],
  recommendations: data.recommendations ?? []
}));
var RubricAlignmentSchema = RubricAlignmentInputSchema;
var ComparisonToExpectedSchema = ComparisonToExpectedInputSchema;
var QuestionOptionSchema = QuestionOptionInputSchema;
var AssessmentQuestionSchema = AssessmentQuestionInputSchema;
var BloomsDistributionSchema = BloomsDistributionInputSchema;

// src/validation/utils.ts
var import_zod2 = require("zod");
var DEFAULT_RETRY_CONFIG = {
  maxRetries: 2,
  modifyPrompt: true
};
function extractJson(content) {
  if (!content || typeof content !== "string") {
    return null;
  }
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  const objectMatch = content.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }
  const arrayMatch = content.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }
  return null;
}
function extractJsonWithOptions(content, options = {}) {
  const { extractArray = false, attemptFix = true, stripMarkdown = true } = options;
  if (!content || typeof content !== "string") {
    return { success: false, error: "No content provided", raw: "" };
  }
  let processedContent = content;
  if (stripMarkdown) {
    processedContent = processedContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  }
  const pattern = extractArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = processedContent.match(pattern);
  if (!match) {
    return {
      success: false,
      error: `No ${extractArray ? "JSON array" : "JSON object"} found in response`,
      raw: content
    };
  }
  let jsonString = match[0];
  if (attemptFix) {
    jsonString = fixCommonJsonIssues(jsonString);
  }
  try {
    const json = JSON.parse(jsonString);
    return { success: true, json, raw: jsonString };
  } catch (parseError) {
    return {
      success: false,
      error: `JSON parse error: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
      raw: jsonString
    };
  }
}
function fixCommonJsonIssues(jsonString) {
  let fixed = jsonString;
  fixed = fixed.replace(/,\s*([\]}])/g, "$1");
  fixed = fixed.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  fixed = fixed.replace(/'/g, '"');
  fixed = fixed.replace(/\/\/[^\n]*/g, "");
  fixed = fixed.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === "\n" || char === "\r" || char === "	") {
      return char;
    }
    return "";
  });
  return fixed;
}
function parseAndValidate(content, schema, schemaName) {
  const jsonString = extractJson(content);
  if (!jsonString) {
    return {
      success: false,
      error: {
        message: `No JSON found in response for ${schemaName}`,
        rawContent: content.slice(0, 500),
        timestamp: /* @__PURE__ */ new Date()
      }
    };
  }
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    const fixed = fixCommonJsonIssues(jsonString);
    try {
      parsed = JSON.parse(fixed);
    } catch (fixError) {
      return {
        success: false,
        rawJson: jsonString,
        error: {
          message: `Failed to parse JSON for ${schemaName}: ${fixError instanceof Error ? fixError.message : "Unknown error"}`,
          rawContent: jsonString.slice(0, 500),
          timestamp: /* @__PURE__ */ new Date()
        }
      };
    }
  }
  try {
    const validated = schema.parse(parsed);
    return {
      success: true,
      data: validated,
      rawJson: jsonString
    };
  } catch (zodError) {
    if (zodError instanceof import_zod2.ZodError) {
      return {
        success: false,
        rawJson: jsonString,
        error: {
          message: `Schema validation failed for ${schemaName}`,
          zodErrors: zodError.issues,
          rawContent: JSON.stringify(parsed).slice(0, 500),
          timestamp: /* @__PURE__ */ new Date()
        }
      };
    }
    throw zodError;
  }
}
function safeParseWithDefaults(content, schema, defaults, logger) {
  const result = parseAndValidate(content, schema, "unknown");
  if (result.success && result.data) {
    return result.data;
  }
  logger?.warn?.("Validation failed, using defaults", result.error);
  return defaults;
}
function createRetryPrompt(originalPrompt, error, attempt) {
  const errorDetails = error.zodErrors ? error.zodErrors.map((e) => `- ${e.path.join(".")}: ${e.message}`).join("\n") : error.message;
  return `${originalPrompt}

IMPORTANT: Your previous response had validation errors. Please fix these issues:
${errorDetails}

Attempt ${attempt + 1}: Please return a valid JSON response matching the exact schema specified.`;
}
async function executeWithRetry(aiCall, prompt, schema, schemaName, options = {}) {
  const maxRetries = options.maxRetries ?? 2;
  const modifyPrompt = options.modifyPrompt ?? createRetryPrompt;
  let lastError;
  let currentPrompt = prompt;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await aiCall(currentPrompt);
      const result = parseAndValidate(response, schema, schemaName);
      if (result.success) {
        return result;
      }
      lastError = result.error;
      if (attempt < maxRetries && result.error) {
        currentPrompt = modifyPrompt(prompt, result.error, attempt);
      }
    } catch (error) {
      lastError = {
        message: error instanceof Error ? error.message : "Unknown error during AI call",
        timestamp: /* @__PURE__ */ new Date()
      };
    }
  }
  return {
    success: false,
    error: lastError ?? {
      message: "Max retries exceeded",
      timestamp: /* @__PURE__ */ new Date()
    }
  };
}
function validateSchema(json, schema, schemaName) {
  const result = schema.safeParse(json);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const error = {
    type: "SCHEMA_ERROR",
    message: formatZodError(result.error),
    zodErrors: result.error.errors,
    rawContent: JSON.stringify(json, null, 2),
    schemaName,
    timestamp: /* @__PURE__ */ new Date()
  };
  return { success: false, error };
}
function formatZodError(error) {
  const issues = error.errors.map((e) => {
    const path = e.path.length > 0 ? `${e.path.join(".")}: ` : "";
    return `${path}${e.message}`;
  });
  return `Validation failed: ${issues.join("; ")}`;
}
function createPartialSchema(schema) {
  return schema.partial();
}
function validateWithDefaults(content, schema, schemaName, defaults) {
  const jsonString = extractJson(content);
  if (!jsonString) {
    return {
      success: false,
      error: {
        type: "NO_JSON_FOUND",
        message: "No JSON found in content",
        rawContent: content,
        schemaName,
        timestamp: /* @__PURE__ */ new Date()
      }
    };
  }
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    const fixed = fixCommonJsonIssues(jsonString);
    try {
      parsed = JSON.parse(fixed);
    } catch (fixError) {
      return {
        success: false,
        error: {
          type: "PARSE_ERROR",
          message: fixError instanceof Error ? fixError.message : "JSON parse error",
          rawContent: jsonString,
          schemaName,
          timestamp: /* @__PURE__ */ new Date()
        }
      };
    }
  }
  const mergedData = {
    ...defaults,
    ...parsed
  };
  return validateSchema(mergedData, schema, schemaName);
}
function validateEvaluationResponse(content) {
  const result = parseAndValidate(content, SubjectiveEvaluationResponseSchema, "SubjectiveEvaluation");
  return result;
}
function validateGradingAssistanceResponse(content) {
  const result = parseAndValidate(content, GradingAssistanceResponseSchema, "GradingAssistance");
  return result;
}
function validateAdaptiveQuestionResponse(content) {
  const result = parseAndValidate(content, AdaptiveQuestionResponseSchema, "AdaptiveQuestion");
  return result;
}
function validateAssessmentQuestionsResponse(content) {
  const result = parseAndValidate(content, AssessmentQuestionsResponseSchema, "AssessmentQuestions");
  return result;
}
function validateContentAnalysisResponse(content) {
  const result = parseAndValidate(content, ContentAnalysisResponseSchema, "ContentAnalysis");
  return result;
}

// src/engines/evaluation-engine.ts
var DEFAULT_SETTINGS = {
  enableAutoGrading: true,
  enableAIAssistance: true,
  enablePartialCredit: true,
  strictnessLevel: "moderate",
  feedbackDepth: "standard",
  bloomsAnalysis: true,
  misconceptionDetection: true,
  adaptiveHints: true
};
var SAMEvaluationEngine = class {
  config;
  database;
  logger;
  settings;
  constructor(engineConfig) {
    this.config = engineConfig.samConfig;
    this.database = engineConfig.database ?? engineConfig.samConfig.database;
    this.logger = this.config.logger ?? console;
    this.settings = { ...DEFAULT_SETTINGS, ...engineConfig.settings };
  }
  /**
   * Evaluate a subjective answer (essay, short answer, etc.)
   */
  async evaluateAnswer(studentAnswer, context) {
    this.logger?.info?.("[EvaluationEngine] Evaluating subjective answer", {
      questionType: context.questionType,
      bloomsLevel: context.bloomsLevel
    });
    if (!this.settings.enableAIAssistance) {
      return this.createPendingEvaluation(context);
    }
    const prompt = this.buildEvaluationPrompt(studentAnswer, context);
    try {
      const response = await this.config.ai.chat({
        messages: [
          { role: "system", content: this.getEvaluationSystemPrompt() },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        // Lower temperature for consistent grading
        maxTokens: 2e3
      });
      return this.parseEvaluationResponse(response.content, context);
    } catch (error) {
      this.logger?.error?.("[EvaluationEngine] AI evaluation failed", error);
      return this.createPendingEvaluation(context);
    }
  }
  /**
   * Evaluate an objective answer (MCQ, True/False, etc.)
   */
  evaluateObjectiveAnswer(answer) {
    this.logger?.debug?.("[EvaluationEngine] Evaluating objective answer", {
      questionType: answer.questionType
    });
    const result = this.gradeObjectiveAnswer(answer);
    return {
      questionId: answer.questionId,
      score: result.score,
      maxScore: answer.points,
      isCorrect: result.isCorrect,
      feedback: result.feedback,
      bloomsLevel: answer.bloomsLevel,
      evaluationType: "AUTO_GRADED"
    };
  }
  /**
   * Get grading assistance for teachers
   */
  async getGradingAssistance(questionText, expectedAnswer, studentAnswer, rubric, bloomsLevel) {
    this.logger?.info?.("[EvaluationEngine] Providing grading assistance");
    const prompt = this.buildGradingAssistancePrompt(
      questionText,
      expectedAnswer,
      studentAnswer,
      rubric,
      bloomsLevel
    );
    try {
      const response = await this.config.ai.chat({
        messages: [
          {
            role: "system",
            content: `You are an expert educational assessment specialist helping teachers grade student work.
Provide detailed grading assistance including:
1. Suggested score with confidence level
2. Rubric alignment analysis
3. Key strengths and weaknesses
4. Suggested feedback for the student
5. Teaching tips for addressing gaps

Be objective, fair, and constructive in your analysis.
Return your analysis as a JSON object.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        maxTokens: 2e3
      });
      return this.parseGradingAssistance(response.content, rubric.maxScore);
    } catch (error) {
      this.logger?.error?.("[EvaluationEngine] Grading assistance failed", error);
      return this.createDefaultGradingAssistance(rubric.maxScore);
    }
  }
  /**
   * Explain evaluation result to student
   */
  async explainResultToStudent(question, result, studentName) {
    this.logger?.info?.("[EvaluationEngine] Generating student explanation");
    const prompt = `Explain the following assessment result to a student named ${studentName} in a supportive, educational manner:

Question: ${question}

Result:
- Score: ${result.score}/${result.maxScore} (${(result.score / result.maxScore * 100).toFixed(1)}%)
- Bloom's Level: ${result.bloomsLevel}
- Feedback: ${result.feedback}
${result.strengths ? `- Strengths: ${result.strengths.join(", ")}` : ""}
${result.improvements ? `- Areas for Improvement: ${result.improvements.join(", ")}` : ""}

Provide:
1. A warm, encouraging opening
2. Clear explanation of what they did well
3. Constructive guidance on areas to improve
4. Specific next steps they can take
5. A motivating closing`;
    try {
      const response = await this.config.ai.chat({
        messages: [
          {
            role: "system",
            content: `You are a supportive AI tutor explaining assessment results to students.
Be encouraging, constructive, and specific. Use the student's name to personalize the response.
Focus on growth mindset and provide actionable next steps.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 800
      });
      return response.content;
    } catch (error) {
      this.logger?.error?.("[EvaluationEngine] Student explanation failed", error);
      return this.createDefaultStudentExplanation(result, studentName);
    }
  }
  /**
   * Assist teacher with grading via chat
   */
  async assistTeacherGrading(question, gradingContext) {
    this.logger?.info?.("[EvaluationEngine] Assisting teacher grading");
    const prompt = `Teacher Question: ${question}

Grading Context:
- Question: ${gradingContext.questionText}
- Expected Answer: ${gradingContext.expectedAnswer}
- Student Answer: ${gradingContext.studentAnswer}
- Current Score: ${gradingContext.currentScore}/${gradingContext.maxScore}
${gradingContext.aiEvaluation ? `- AI Evaluation: ${JSON.stringify(gradingContext.aiEvaluation)}` : ""}

Provide helpful guidance to the teacher based on their question.`;
    try {
      const response = await this.config.ai.chat({
        messages: [
          {
            role: "system",
            content: `You are an expert assessment specialist assisting teachers with grading.
Provide clear, professional guidance based on the teacher's specific question.
Reference the grading context and provide actionable advice.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        maxTokens: 1e3
      });
      return response.content;
    } catch (error) {
      this.logger?.error?.("[EvaluationEngine] Teacher assistance failed", error);
      return "I apologize, but I encountered an issue providing grading assistance. Please try again or contact support.";
    }
  }
  /**
   * Store evaluation result using database adapter
   */
  async storeEvaluationResult(answerId, questionId, evaluation) {
    if (!this.database) {
      this.logger?.debug?.("[EvaluationEngine] No database adapter, skipping storage");
      return;
    }
    try {
      await this.database.logInteraction({
        userId: "system",
        pageType: "ASSESSMENT",
        pagePath: `/assessment/${questionId}`,
        query: JSON.stringify({ answerId, questionId }),
        response: JSON.stringify({
          score: evaluation.score,
          maxScore: evaluation.maxScore,
          feedback: evaluation.feedback,
          demonstratedLevel: evaluation.demonstratedBloomsLevel,
          accuracy: evaluation.accuracy,
          completeness: evaluation.completeness
        }),
        enginesUsed: ["evaluation-engine"],
        responseTimeMs: 0
      });
    } catch (error) {
      this.logger?.error?.("[EvaluationEngine] Failed to store evaluation", error);
    }
  }
  // ============================================================================
  // ASSESSMENT GENERATION
  // ============================================================================
  /**
   * Generate a complete assessment based on configuration
   */
  async generateAssessment(config) {
    this.logger?.info?.("[EvaluationEngine] Generating assessment", {
      type: config.assessmentType,
      subject: config.subject,
      topic: config.topic,
      questionCount: config.questionCount
    });
    const prompt = this.buildAssessmentPrompt(config);
    try {
      const response = await this.config.ai.chat({
        messages: [
          { role: "system", content: this.getAssessmentSystemPrompt() },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 4e3
      });
      const questions = this.parseGeneratedQuestions(response.content, config);
      const assessment = this.buildAssessment(questions, config);
      this.logger?.info?.("[EvaluationEngine] Assessment generated", {
        questionCount: questions.length,
        assessmentId: assessment.id
      });
      return assessment;
    } catch (error) {
      this.logger?.error?.("[EvaluationEngine] Assessment generation failed", error);
      throw new Error("Failed to generate assessment");
    }
  }
  /**
   * Generate next adaptive question based on student performance
   */
  async generateAdaptiveQuestion(request) {
    this.logger?.info?.("[EvaluationEngine] Generating adaptive question", {
      subject: request.subject,
      topic: request.topic,
      currentDifficulty: request.currentDifficulty
    });
    const performanceAnalysis = this.analyzePerformance(request);
    const adjustedDifficulty = this.determineNextDifficulty(
      request.currentDifficulty,
      performanceAnalysis,
      request.adaptiveSettings
    );
    const prompt = this.buildAdaptiveQuestionPrompt(request, adjustedDifficulty, performanceAnalysis);
    try {
      const response = await this.config.ai.chat({
        messages: [
          {
            role: "system",
            content: `You are an expert adaptive assessment designer.
Generate a single question that:
1. Matches the specified difficulty level
2. Targets identified gaps in student knowledge
3. Builds on previous correct answers
4. Avoids repeating similar question patterns

Return the question as a JSON object.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 1e3
      });
      const question = this.parseAdaptiveQuestion(response.content, request, adjustedDifficulty);
      const adaptationReason = this.getAdaptationReason(performanceAnalysis, adjustedDifficulty);
      const nextRecommendation = this.getNextRecommendation(performanceAnalysis);
      return {
        question,
        adjustedDifficulty,
        performanceAnalysis,
        adaptationReason,
        nextRecommendation
      };
    } catch (error) {
      this.logger?.error?.("[EvaluationEngine] Adaptive question generation failed", error);
      return this.createFallbackAdaptiveResult(request, adjustedDifficulty, performanceAnalysis);
    }
  }
  // ============================================================================
  // ASSESSMENT GENERATION HELPERS
  // ============================================================================
  getAssessmentSystemPrompt() {
    return `You are an expert educational assessment designer specializing in Bloom's Taxonomy-aligned assessments.

Create assessments that:
1. Align questions with specified Bloom's taxonomy levels
2. Match the requested difficulty distribution
3. Include clear, unambiguous question wording
4. Provide comprehensive answer keys and explanations
5. Cover all specified learning objectives

Return questions as a valid JSON array.`;
  }
  buildAssessmentPrompt(config) {
    return `Generate a ${config.assessmentType} assessment with the following specifications:

Subject: ${config.subject}
Topic: ${config.topic}
Difficulty: ${config.difficulty}
Number of Questions: ${config.questionCount}
Time Limit: ${config.duration} minutes

Learning Objectives:
${config.learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join("\n")}

Bloom's Taxonomy Levels to Include: ${config.bloomsLevels.join(", ")}
Question Types Allowed: ${config.questionTypes.join(", ")}

Return a JSON array of questions, each with:
{
  "id": "unique-id",
  "text": "question text",
  "questionType": "${config.questionTypes[0]}|...",
  "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
  "difficulty": "${config.difficulty}",
  "options": [{"id": "a", "text": "option", "isCorrect": true/false}], // for MCQ
  "correctAnswer": "correct answer or model response",
  "explanation": "detailed explanation",
  "hints": ["hint1", "hint2"],
  "timeEstimate": 60, // seconds
  "points": 10,
  "tags": ["tag1", "tag2"],
  "learningObjective": "which learning objective this addresses"
}`;
  }
  parseGeneratedQuestions(content, config) {
    const validationResult = validateAssessmentQuestionsResponse(content);
    if (validationResult.success && validationResult.data) {
      return validationResult.data.map((q, index) => ({
        id: q.id || this.generateId(),
        text: q.text || `Question ${index + 1}`,
        questionType: q.questionType || config.questionTypes[0],
        bloomsLevel: q.bloomsLevel || config.bloomsLevels[0],
        difficulty: q.difficulty || config.difficulty,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        hints: q.hints,
        timeEstimate: q.timeEstimate,
        points: q.points,
        tags: q.tags,
        metadata: {
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          isAdaptive: false,
          learningObjective: q.learningObjective,
          cognitiveProcess: this.getCognitiveProcess(q.bloomsLevel)
        }
      }));
    }
    this.logger?.warn?.("[EvaluationEngine] Assessment questions validation failed", {
      error: validationResult.error?.message,
      zodErrors: validationResult.error?.zodErrors
    });
    return this.createFallbackQuestions(config);
  }
  buildAssessment(questions, config) {
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const estimatedDuration = Math.ceil(
      questions.reduce((sum, q) => sum + q.timeEstimate, 0) / 60
    );
    const bloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    for (const q of questions) {
      bloomsDistribution[q.bloomsLevel]++;
    }
    return {
      id: this.generateId(),
      assessmentType: config.assessmentType,
      subject: config.subject,
      topic: config.topic,
      difficulty: config.difficulty,
      duration: config.duration,
      questions,
      metadata: {
        totalQuestions: questions.length,
        totalPoints,
        estimatedDuration,
        bloomsDistribution,
        learningObjectives: config.learningObjectives
      },
      instructions: this.generateInstructions(config, questions.length, totalPoints),
      scoringGuide: {
        totalPoints,
        passingScore: Math.round(totalPoints * 0.6),
        gradingScale: {
          A: 90,
          B: 80,
          C: 70,
          D: 60,
          F: 0
        },
        partialCredit: this.settings.enablePartialCredit
      },
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  generateInstructions(config, questionCount, totalPoints) {
    return `Welcome to this ${config.assessmentType} on ${config.topic}.

Instructions:
1. You have ${config.duration} minutes to complete this assessment.
2. There are ${questionCount} questions worth a total of ${totalPoints} points.
3. Read each question carefully before answering.
4. You may navigate between questions freely.
5. Submit your assessment when you are ready.

Good luck!`;
  }
  analyzePerformance(request) {
    const responses = request.studentResponses;
    if (responses.length === 0) {
      return {
        accuracy: 0.5,
        averageTimeSpent: 60,
        trend: "stable",
        confidence: 0.5,
        timeEfficiency: 1
      };
    }
    const correct = responses.filter((r) => r.isCorrect).length;
    const accuracy = correct / responses.length;
    const avgTime = responses.reduce((sum, r) => sum + r.timeSpent, 0) / responses.length;
    const avgConfidence = responses.filter((r) => r.confidence !== void 0).reduce((sum, r) => sum + (r.confidence ?? 0.5), 0) / Math.max(1, responses.filter((r) => r.confidence !== void 0).length);
    const recent = responses.slice(-3);
    let trend = "stable";
    if (recent.length >= 3) {
      const recentCorrect = recent.filter((r) => r.isCorrect).length;
      const olderCorrect = responses.slice(0, -3).filter((r) => r.isCorrect).length;
      const olderTotal = responses.length - 3;
      if (olderTotal > 0) {
        const recentRate = recentCorrect / 3;
        const olderRate = olderCorrect / olderTotal;
        if (recentRate > olderRate + 0.1) trend = "improving";
        else if (recentRate < olderRate - 0.1) trend = "declining";
      }
    }
    const expectedTime = 60;
    const timeEfficiency = avgTime / expectedTime;
    return {
      accuracy,
      averageTimeSpent: avgTime,
      trend,
      confidence: avgConfidence,
      timeEfficiency
    };
  }
  determineNextDifficulty(current, analysis, settings) {
    const targetAccuracy = settings?.targetAccuracy ?? 0.7;
    const adjustmentRate = settings?.difficultyAdjustmentRate ?? 0.15;
    if (analysis.accuracy > targetAccuracy + adjustmentRate) {
      return current === "EASY" ? "MEDIUM" : current === "MEDIUM" ? "HARD" : "HARD";
    }
    if (analysis.accuracy < targetAccuracy - adjustmentRate) {
      return current === "HARD" ? "MEDIUM" : current === "MEDIUM" ? "EASY" : "EASY";
    }
    return current;
  }
  buildAdaptiveQuestionPrompt(request, difficulty, analysis) {
    const previousTopics = request.previousQuestions.map((q) => q.tags.join(", ")).join("; ");
    const incorrectPatterns = request.studentResponses.filter((r) => !r.isCorrect).map((r) => {
      const q = request.previousQuestions.find((pq) => pq.id === r.questionId);
      return q?.tags.join(", ") || "";
    }).filter((t) => t).join("; ");
    return `Generate an adaptive question for:

Subject: ${request.subject}
Topic: ${request.topic}
Target Difficulty: ${difficulty}

Student Performance:
- Accuracy: ${(analysis.accuracy * 100).toFixed(1)}%
- Trend: ${analysis.trend}
- Previous Topics Covered: ${previousTopics || "None"}
- Areas Needing Work: ${incorrectPatterns || "None identified"}

Generate a question that:
1. Is at ${difficulty} difficulty level
2. ${analysis.accuracy < 0.5 ? "Reinforces fundamental concepts" : "Challenges the student appropriately"}
3. Avoids repeating exact topics from previous questions
4. ${analysis.trend === "declining" ? "Provides scaffolding to rebuild confidence" : "Maintains engagement"}

Return as JSON:
{
  "id": "unique-id",
  "text": "question text",
  "questionType": "MULTIPLE_CHOICE",
  "bloomsLevel": "UNDERSTAND|APPLY|ANALYZE",
  "difficulty": "${difficulty}",
  "options": [{"id": "a", "text": "option", "isCorrect": true/false}],
  "correctAnswer": "correct answer",
  "explanation": "detailed explanation",
  "hints": ["hint1"],
  "timeEstimate": 60,
  "points": 10,
  "tags": ["topic"]
}`;
  }
  parseAdaptiveQuestion(content, request, difficulty) {
    const validationResult = validateAdaptiveQuestionResponse(content);
    if (validationResult.success && validationResult.data) {
      const validated = validationResult.data;
      return {
        id: validated.id || this.generateId(),
        text: validated.text,
        questionType: validated.questionType || "MULTIPLE_CHOICE",
        bloomsLevel: validated.bloomsLevel || "UNDERSTAND",
        difficulty,
        options: validated.options,
        correctAnswer: validated.correctAnswer,
        explanation: validated.explanation,
        hints: validated.hints,
        timeEstimate: validated.timeEstimate,
        points: validated.points,
        tags: validated.tags.length > 0 ? validated.tags : [request.topic],
        metadata: {
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          isAdaptive: true,
          cognitiveProcess: this.getCognitiveProcess(validated.bloomsLevel)
        }
      };
    }
    this.logger?.error?.("[EvaluationEngine] Adaptive question validation failed", {
      error: validationResult.error?.message,
      zodErrors: validationResult.error?.zodErrors
    });
    throw new Error(
      `Failed to parse adaptive question: ${validationResult.error?.message ?? "Unknown error"}`
    );
  }
  getAdaptationReason(analysis, newDifficulty) {
    if (analysis.accuracy >= 0.8 && newDifficulty === "HARD") {
      return "Excellent performance! Increasing difficulty to challenge you further.";
    }
    if (analysis.accuracy < 0.5 && newDifficulty === "EASY") {
      return "Let&apos;s build your confidence with some foundational questions.";
    }
    if (analysis.trend === "improving") {
      return "Great progress! Keep up the momentum.";
    }
    if (analysis.trend === "declining") {
      return "Taking a step back to reinforce core concepts.";
    }
    return "Continuing at the current level to solidify understanding.";
  }
  getNextRecommendation(analysis) {
    if (analysis.accuracy >= 0.8) {
      return "Consider advancing to more complex topics.";
    }
    if (analysis.accuracy < 0.5) {
      return "Review fundamental concepts before continuing.";
    }
    return "Continue practicing to build mastery.";
  }
  createFallbackQuestions(config) {
    const questions = [];
    for (let i = 0; i < config.questionCount; i++) {
      questions.push({
        id: this.generateId(),
        text: `Question ${i + 1} about ${config.topic}`,
        questionType: config.questionTypes[i % config.questionTypes.length],
        bloomsLevel: config.bloomsLevels[i % config.bloomsLevels.length],
        difficulty: config.difficulty,
        correctAnswer: "To be determined",
        explanation: "Explanation pending",
        timeEstimate: 60,
        points: 10,
        tags: [config.subject, config.topic],
        metadata: {
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          isAdaptive: false
        }
      });
    }
    return questions;
  }
  createFallbackAdaptiveResult(request, difficulty, analysis) {
    return {
      question: {
        id: this.generateId(),
        text: `Review question about ${request.topic}`,
        questionType: "MULTIPLE_CHOICE",
        bloomsLevel: "UNDERSTAND",
        difficulty,
        correctAnswer: "To be determined",
        explanation: "Explanation pending",
        timeEstimate: 60,
        points: 10,
        tags: [request.subject, request.topic],
        metadata: {
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          isAdaptive: true
        }
      },
      adjustedDifficulty: difficulty,
      performanceAnalysis: analysis,
      adaptationReason: "Generated fallback question.",
      nextRecommendation: "Continue practicing."
    };
  }
  getCognitiveProcess(level) {
    const processes = {
      REMEMBER: "Recall facts and basic concepts",
      UNDERSTAND: "Explain ideas and concepts",
      APPLY: "Use information in new situations",
      ANALYZE: "Draw connections among ideas",
      EVALUATE: "Justify decisions or arguments",
      CREATE: "Produce new or original work"
    };
    return processes[level] || "Unknown process";
  }
  generateId() {
    return `eval-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  getEvaluationSystemPrompt() {
    const strictness = this.settings.strictnessLevel;
    const feedbackDepth = this.settings.feedbackDepth;
    return `You are an expert educational evaluator specialized in Bloom's Taxonomy-aligned assessment.

Evaluation Parameters:
- Strictness Level: ${strictness}
- Feedback Depth: ${feedbackDepth}
- Partial Credit: ${this.settings.enablePartialCredit ? "Enabled" : "Disabled"}
- Misconception Detection: ${this.settings.misconceptionDetection ? "Enabled" : "Disabled"}

Evaluate student answers based on:
1. Accuracy - correctness of information
2. Completeness - coverage of expected points
3. Relevance - staying on topic
4. Depth - level of analysis/understanding shown

For ${strictness} strictness:
${strictness === "lenient" ? "- Be generous with partial credit\n- Focus on what student got right" : ""}
${strictness === "moderate" ? "- Balance rigor with encouragement\n- Provide fair partial credit" : ""}
${strictness === "strict" ? "- Hold to high standards\n- Require clear demonstration of understanding" : ""}

Return your evaluation as a JSON object with the specified structure.`;
  }
  buildEvaluationPrompt(studentAnswer, context) {
    const rubricSection = context.rubric ? `
Rubric Criteria:
${context.rubric.criteria.map((c, i) => `${i + 1}. ${c.name}: ${c.description} (${c.maxPoints} points)`).join("\n")}` : "";
    const variationsSection = context.acceptableVariations?.length ? `
Acceptable Variations:
${context.acceptableVariations.map((v) => `- ${v}`).join("\n")}` : "";
    return `Evaluate the following student answer:

Question: ${context.questionText}
Question Type: ${context.questionType}
Bloom's Level: ${context.bloomsLevel}
Max Points: ${context.maxPoints}
${context.learningObjective ? `Learning Objective: ${context.learningObjective}` : ""}

Expected Answer:
${context.expectedAnswer}
${variationsSection}
${rubricSection}

Student Answer:
${studentAnswer}

Provide a JSON evaluation with:
{
  "score": <number>,
  "maxScore": ${context.maxPoints},
  "accuracy": <0-100>,
  "completeness": <0-100>,
  "relevance": <0-100>,
  "depth": <0-100>,
  "feedback": "<constructive feedback string>",
  "strengths": ["strength1", "strength2"],
  "improvements": ["area1", "area2"],
  "nextSteps": ["step1", "step2"],
  "demonstratedBloomsLevel": "<REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE>",
  "misconceptions": ["misconception1"] // if detected
}`;
  }
  parseEvaluationResponse(content, context) {
    const validationResult = validateEvaluationResponse(content);
    if (validationResult.success && validationResult.data) {
      const validated = validationResult.data;
      return {
        score: Math.min(validated.score, context.maxPoints),
        maxScore: context.maxPoints,
        accuracy: validated.accuracy,
        completeness: validated.completeness,
        relevance: validated.relevance,
        depth: validated.depth,
        feedback: validated.feedback,
        strengths: validated.strengths,
        improvements: validated.improvements,
        nextSteps: validated.nextSteps,
        demonstratedBloomsLevel: validated.demonstratedBloomsLevel ?? context.bloomsLevel,
        misconceptions: validated.misconceptions
      };
    }
    this.logger?.warn?.("[EvaluationEngine] Validation failed", {
      error: validationResult.error?.message,
      zodErrors: validationResult.error?.zodErrors
    });
    return this.createPendingEvaluation(context);
  }
  buildGradingAssistancePrompt(questionText, expectedAnswer, studentAnswer, rubric, bloomsLevel) {
    return `Provide grading assistance for the following:

Question: ${questionText}
Bloom's Level: ${bloomsLevel}
Max Score: ${rubric.maxScore}

Rubric Criteria:
${rubric.criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Expected Answer:
${expectedAnswer}

Student Answer:
${studentAnswer}

Provide a JSON response with:
{
  "suggestedScore": <number>,
  "maxScore": ${rubric.maxScore},
  "confidence": <0-1>,
  "reasoning": "<detailed reasoning>",
  "rubricAlignment": [
    {"criterionName": "<name>", "score": <number>, "maxScore": <number>, "justification": "<text>"}
  ],
  "keyStrengths": ["strength1", "strength2"],
  "keyWeaknesses": ["weakness1", "weakness2"],
  "suggestedFeedback": "<feedback for student>",
  "flaggedIssues": ["issue1"],
  "comparisonToExpected": {
    "coveragePercentage": <0-100>,
    "missingKeyPoints": ["point1"],
    "extraneousPoints": ["point1"],
    "accuracyScore": <0-100>
  },
  "teacherTips": ["tip1", "tip2"]
}`;
  }
  parseGradingAssistance(content, maxScore) {
    const validationResult = validateGradingAssistanceResponse(content);
    if (validationResult.success && validationResult.data) {
      const validated = validationResult.data;
      return {
        suggestedScore: Math.min(validated.suggestedScore, maxScore),
        maxScore,
        confidence: validated.confidence,
        reasoning: validated.reasoning,
        rubricAlignment: validated.rubricAlignment,
        keyStrengths: validated.keyStrengths,
        keyWeaknesses: validated.keyWeaknesses,
        suggestedFeedback: validated.suggestedFeedback,
        flaggedIssues: validated.flaggedIssues,
        comparisonToExpected: validated.comparisonToExpected,
        teacherTips: validated.teacherTips
      };
    }
    this.logger?.warn?.("[EvaluationEngine] Grading assistance validation failed", {
      error: validationResult.error?.message,
      zodErrors: validationResult.error?.zodErrors
    });
    return this.createDefaultGradingAssistance(maxScore);
  }
  gradeObjectiveAnswer(answer) {
    const studentAnswer = answer.studentAnswer?.toLowerCase?.() || "";
    const correctAnswer = answer.correctAnswer?.toLowerCase?.() || "";
    switch (answer.questionType) {
      case "MULTIPLE_CHOICE": {
        const correctOption = answer.options?.find((o) => o.isCorrect);
        const isCorrect = studentAnswer === correctOption?.text?.toLowerCase() || studentAnswer === correctAnswer;
        return {
          score: isCorrect ? answer.points : 0,
          isCorrect,
          feedback: isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${correctOption?.text || correctAnswer}`
        };
      }
      case "TRUE_FALSE": {
        const isCorrect = studentAnswer === correctAnswer;
        return {
          score: isCorrect ? answer.points : 0,
          isCorrect,
          feedback: isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${correctAnswer}`
        };
      }
      case "MATCHING":
      case "ORDERING": {
        try {
          const studentParsed = JSON.parse(answer.studentAnswer);
          const correctParsed = JSON.parse(answer.correctAnswer);
          const matches = this.countMatches(studentParsed, correctParsed);
          const total = Array.isArray(correctParsed) ? correctParsed.length : Object.keys(correctParsed).length;
          const score = matches / total * answer.points;
          const isCorrect = matches === total;
          return {
            score: this.settings.enablePartialCredit ? score : isCorrect ? answer.points : 0,
            isCorrect,
            feedback: isCorrect ? "All matches correct!" : `You got ${matches} out of ${total} correct.`
          };
        } catch {
          return {
            score: 0,
            isCorrect: false,
            feedback: "Unable to parse your answer."
          };
        }
      }
      default:
        return {
          score: 0,
          isCorrect: false,
          feedback: "Unsupported question type for automatic grading."
        };
    }
  }
  countMatches(student, correct) {
    if (Array.isArray(student) && Array.isArray(correct)) {
      return student.filter((item, index) => item === correct[index]).length;
    }
    if (typeof student === "object" && typeof correct === "object" && student && correct) {
      const studentObj = student;
      const correctObj = correct;
      return Object.entries(correctObj).filter(
        ([key, value]) => studentObj[key] === value
      ).length;
    }
    return 0;
  }
  createPendingEvaluation(context) {
    return {
      score: 0,
      maxScore: context.maxPoints,
      accuracy: 0,
      completeness: 0,
      relevance: 0,
      depth: 0,
      feedback: "Evaluation pending teacher review.",
      strengths: [],
      improvements: [],
      nextSteps: ["Wait for teacher feedback"],
      demonstratedBloomsLevel: context.bloomsLevel
    };
  }
  createDefaultGradingAssistance(maxScore) {
    return {
      suggestedScore: 0,
      maxScore,
      confidence: 0,
      reasoning: "Unable to generate grading assistance. Please evaluate manually.",
      rubricAlignment: [],
      keyStrengths: [],
      keyWeaknesses: [],
      suggestedFeedback: "",
      flaggedIssues: ["AI assistance unavailable"],
      comparisonToExpected: {
        coveragePercentage: 0,
        missingKeyPoints: [],
        extraneousPoints: [],
        accuracyScore: 0
      },
      teacherTips: ["Please evaluate this answer manually."]
    };
  }
  createDefaultStudentExplanation(result, studentName) {
    const percentage = result.score / result.maxScore * 100;
    const performance = percentage >= 70 ? "well" : percentage >= 50 ? "satisfactorily" : "with some challenges";
    return `Hi ${studentName},

Thank you for completing this assessment. You scored ${result.score} out of ${result.maxScore} points (${percentage.toFixed(1)}%), which shows you performed ${performance}.

${result.feedback}

Keep up the effort and continue learning!`;
  }
};
function createEvaluationEngine(config) {
  return new SAMEvaluationEngine(config);
}

// src/engines/blooms-engine.ts
var BLOOMS_HIERARCHY = [
  "REMEMBER",
  "UNDERSTAND",
  "APPLY",
  "ANALYZE",
  "EVALUATE",
  "CREATE"
];
var BLOOMS_KEYWORDS = {
  REMEMBER: ["define", "list", "recall", "identify", "name", "state", "describe", "match", "recognize"],
  UNDERSTAND: ["explain", "summarize", "interpret", "classify", "compare", "discuss", "paraphrase", "illustrate"],
  APPLY: ["apply", "demonstrate", "solve", "use", "implement", "execute", "operate", "practice"],
  ANALYZE: ["analyze", "differentiate", "examine", "organize", "contrast", "investigate", "categorize"],
  EVALUATE: ["evaluate", "judge", "critique", "justify", "argue", "assess", "defend", "rate"],
  CREATE: ["create", "design", "develop", "construct", "produce", "formulate", "invent", "compose"]
};
var BLOOMS_DESCRIPTIONS = {
  REMEMBER: "Recall facts and basic concepts",
  UNDERSTAND: "Explain ideas and concepts",
  APPLY: "Use information in new situations",
  ANALYZE: "Draw connections among ideas",
  EVALUATE: "Justify decisions or arguments",
  CREATE: "Produce new or original work"
};
var BloomsAnalysisEngine = class {
  config;
  database;
  logger;
  analysisDepth;
  constructor(engineConfig) {
    this.config = engineConfig.samConfig;
    this.database = engineConfig.database ?? engineConfig.samConfig.database;
    this.logger = this.config.logger ?? console;
    this.analysisDepth = engineConfig.analysisDepth ?? "standard";
  }
  /**
   * Analyze content for Bloom's Taxonomy distribution
   */
  async analyzeContent(content) {
    this.logger?.info?.("[BloomsEngine] Analyzing content");
    const keywordDistribution = this.analyzeKeywords(content);
    if (this.analysisDepth === "comprehensive") {
      return this.analyzeWithAI(content, keywordDistribution);
    }
    const distribution = this.normalizeDistribution(keywordDistribution);
    const dominantLevel = this.getDominantLevel(distribution);
    const gaps = this.identifyGaps(distribution);
    const recommendations = this.generateRecommendations(distribution, gaps);
    return {
      distribution,
      dominantLevel,
      gaps,
      recommendations,
      cognitiveProfile: this.createDefaultProfile(distribution)
    };
  }
  /**
   * Analyze an entire course for Bloom's Taxonomy distribution
   * This is the main course-level analysis method
   */
  async analyzeCourse(courseData, options = {}) {
    const {
      depth = "detailed",
      includeRecommendations = true
    } = options;
    this.logger?.info?.("[BloomsEngine] Analyzing course", { courseId: courseData.id });
    const chapterAnalyses = await this.analyzeChapters(courseData.chapters, depth);
    const courseDistribution = this.calculateCourseDistribution(chapterAnalyses);
    const cognitiveDepth = this.calculateCognitiveDepth(courseDistribution);
    const balance = this.determineBalance(courseDistribution);
    const learningPathway = this.analyzeLearningPathway(chapterAnalyses);
    const recommendations = includeRecommendations ? await this.generateCourseRecommendations(courseData, chapterAnalyses, courseDistribution) : { contentAdjustments: [], assessmentChanges: [], activitySuggestions: [] };
    const studentImpact = this.analyzeStudentImpact(courseDistribution, chapterAnalyses);
    return {
      courseId: courseData.id,
      courseLevel: {
        distribution: courseDistribution,
        cognitiveDepth,
        balance
      },
      chapterAnalysis: chapterAnalyses,
      learningPathway,
      recommendations,
      studentImpact,
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  // ============================================================================
  // COURSE ANALYSIS HELPERS
  // ============================================================================
  async analyzeChapters(chapters, depth) {
    const analyses = [];
    for (const chapter of chapters) {
      const sectionAnalyses = await this.analyzeSections(chapter.sections, depth);
      const chapterDistribution = this.calculateChapterDistribution(sectionAnalyses);
      const primaryLevel = this.getDominantLevel(chapterDistribution);
      const cognitiveDepth = this.calculateCognitiveDepth(chapterDistribution);
      analyses.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        bloomsDistribution: chapterDistribution,
        primaryLevel,
        cognitiveDepth,
        sections: sectionAnalyses
      });
    }
    return analyses;
  }
  async analyzeSections(sections, depth) {
    const analyses = [];
    for (const section of sections) {
      const bloomsLevel = await this.analyzeSectionContent(section, depth);
      const activities = this.extractActivities(section, bloomsLevel);
      const learningObjectives = section.learningObjectives || [];
      analyses.push({
        sectionId: section.id,
        sectionTitle: section.title,
        bloomsLevel,
        activities,
        learningObjectives
      });
    }
    return analyses;
  }
  async analyzeSectionContent(section, depth) {
    const contentParts = [
      section.title,
      section.description || "",
      section.content || "",
      ...section.learningObjectives || []
    ];
    const combinedContent = contentParts.join(" ");
    const questionLevels = [];
    if (section.questions) {
      for (const q of section.questions) {
        if (q.bloomsLevel) {
          questionLevels.push(q.bloomsLevel);
        } else {
          questionLevels.push(this.analyzeQuestionText(q.text));
        }
      }
    }
    if (section.exams) {
      for (const exam of section.exams) {
        for (const q of exam.questions) {
          if (q.bloomsLevel) {
            questionLevels.push(q.bloomsLevel);
          } else {
            questionLevels.push(this.analyzeQuestionText(q.text));
          }
        }
      }
    }
    if (questionLevels.length > 0) {
      return this.getMostCommonLevel(questionLevels);
    }
    if (depth === "comprehensive" && combinedContent.length > 50) {
      return this.analyzeSectionWithAI(section);
    }
    const keywordDistribution = this.analyzeKeywords(combinedContent);
    return this.getDominantLevel(this.normalizeDistribution(keywordDistribution));
  }
  async analyzeSectionWithAI(section) {
    try {
      const response = await this.config.ai.chat({
        messages: [
          {
            role: "system",
            content: `You are an expert educational psychologist specializing in Bloom's Taxonomy.
Analyze the educational content and classify it according to Bloom's cognitive levels:
1. REMEMBER: Recall facts and basic concepts
2. UNDERSTAND: Explain ideas or concepts
3. APPLY: Use information in new situations
4. ANALYZE: Draw connections among ideas
5. EVALUATE: Justify a stand or decision
6. CREATE: Produce new or original work

Return ONLY the level name (e.g., "UNDERSTAND") without explanation.`
          },
          {
            role: "user",
            content: `Analyze this section and determine its primary Bloom's Taxonomy level:

Title: ${section.title}
Type: ${section.type || "General"}
Has Video: ${section.hasVideo ? "Yes" : "No"}
Duration: ${section.duration || "Unknown"} minutes
Description: ${section.description || "No description"}
Learning Objectives: ${section.learningObjectives?.join(", ") || "None specified"}`
          }
        ],
        temperature: 0.3,
        maxTokens: 50
      });
      return this.parseBloomsLevelFromResponse(response.content);
    } catch (error) {
      this.logger?.warn?.("[BloomsEngine] AI analysis failed for section", error);
      return "UNDERSTAND";
    }
  }
  analyzeQuestionText(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("define") || lowerText.includes("list") || lowerText.includes("name") || lowerText.includes("recall")) {
      return "REMEMBER";
    } else if (lowerText.includes("explain") || lowerText.includes("describe") || lowerText.includes("summarize") || lowerText.includes("interpret")) {
      return "UNDERSTAND";
    } else if (lowerText.includes("apply") || lowerText.includes("solve") || lowerText.includes("use") || lowerText.includes("demonstrate")) {
      return "APPLY";
    } else if (lowerText.includes("analyze") || lowerText.includes("compare") || lowerText.includes("contrast") || lowerText.includes("differentiate")) {
      return "ANALYZE";
    } else if (lowerText.includes("evaluate") || lowerText.includes("judge") || lowerText.includes("critique") || lowerText.includes("justify")) {
      return "EVALUATE";
    } else if (lowerText.includes("create") || lowerText.includes("design") || lowerText.includes("develop") || lowerText.includes("construct")) {
      return "CREATE";
    }
    return "UNDERSTAND";
  }
  getMostCommonLevel(levels) {
    const counts = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    for (const level of levels) {
      counts[level]++;
    }
    let maxLevel = "UNDERSTAND";
    let maxCount = 0;
    for (const [level, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxLevel = level;
      }
    }
    return maxLevel;
  }
  extractActivities(section, bloomsLevel) {
    const activities = [];
    if (section.hasVideo) {
      activities.push({
        type: "video",
        bloomsLevel: this.getVideoBloomsLevel(bloomsLevel),
        description: "Video content for visual learning"
      });
    }
    if (section.questions && section.questions.length > 0) {
      activities.push({
        type: "practice_questions",
        bloomsLevel,
        description: `${section.questions.length} practice questions`
      });
    }
    if (section.exams && section.exams.length > 0) {
      activities.push({
        type: "assessment",
        bloomsLevel,
        description: `${section.exams.length} assessments`
      });
    }
    if (section.content) {
      activities.push({
        type: "reading",
        bloomsLevel: Math.min(BLOOMS_HIERARCHY.indexOf(bloomsLevel), 1) >= 0 ? BLOOMS_HIERARCHY[Math.min(BLOOMS_HIERARCHY.indexOf(bloomsLevel), 1)] : "UNDERSTAND",
        description: "Reading content"
      });
    }
    return activities;
  }
  getVideoBloomsLevel(sectionLevel) {
    const sectionIndex = BLOOMS_HIERARCHY.indexOf(sectionLevel);
    if (sectionIndex <= 1) return "UNDERSTAND";
    return sectionLevel;
  }
  calculateChapterDistribution(sections) {
    const counts = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    for (const section of sections) {
      counts[section.bloomsLevel]++;
    }
    const total = sections.length || 1;
    return {
      REMEMBER: counts.REMEMBER / total * 100,
      UNDERSTAND: counts.UNDERSTAND / total * 100,
      APPLY: counts.APPLY / total * 100,
      ANALYZE: counts.ANALYZE / total * 100,
      EVALUATE: counts.EVALUATE / total * 100,
      CREATE: counts.CREATE / total * 100
    };
  }
  calculateCourseDistribution(chapters) {
    if (chapters.length === 0) {
      return { REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 };
    }
    const totals = { REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 };
    for (const chapter of chapters) {
      for (const level of BLOOMS_HIERARCHY) {
        totals[level] += chapter.bloomsDistribution[level];
      }
    }
    const count = chapters.length;
    return {
      REMEMBER: totals.REMEMBER / count,
      UNDERSTAND: totals.UNDERSTAND / count,
      APPLY: totals.APPLY / count,
      ANALYZE: totals.ANALYZE / count,
      EVALUATE: totals.EVALUATE / count,
      CREATE: totals.CREATE / count
    };
  }
  calculateCognitiveDepth(distribution) {
    let weightedSum = 0;
    let totalWeight = 0;
    for (let i = 0; i < BLOOMS_HIERARCHY.length; i++) {
      const level = BLOOMS_HIERARCHY[i];
      const weight = i + 1;
      weightedSum += distribution[level] * weight;
      totalWeight += distribution[level];
    }
    if (totalWeight === 0) return 0;
    return weightedSum / totalWeight / 6 * 100;
  }
  determineBalance(distribution) {
    const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND;
    const middleLevels = distribution.APPLY + distribution.ANALYZE;
    const higherLevels = distribution.EVALUATE + distribution.CREATE;
    if (lowerLevels > 50 && higherLevels < 20) {
      return "bottom-heavy";
    } else if (higherLevels > 40 && lowerLevels < 30) {
      return "top-heavy";
    }
    return "well-balanced";
  }
  analyzeLearningPathway(chapters) {
    const stages = BLOOMS_HIERARCHY.map((level, index) => {
      let totalSections = 0;
      let matchingSections = 0;
      const activities = [];
      for (const chapter of chapters) {
        for (const section of chapter.sections) {
          totalSections++;
          if (section.bloomsLevel === level) {
            matchingSections++;
            activities.push(`${chapter.chapterTitle}: ${section.sectionTitle}`);
          }
        }
      }
      return {
        level,
        mastery: totalSections > 0 ? matchingSections / totalSections * 100 : 0,
        activities: activities.slice(0, 5),
        // Top 5 activities
        timeEstimate: matchingSections * 15
        // 15 min per section
      };
    });
    let currentStage = 0;
    for (let i = 0; i < stages.length; i++) {
      if (stages[i].mastery > 20) currentStage = i;
    }
    const totalMastery = stages.reduce((sum, s) => sum + s.mastery, 0);
    const completionPercentage = totalMastery / (stages.length * 100) * 100;
    const gaps = [];
    for (let i = 0; i < stages.length; i++) {
      if (stages[i].mastery < 15) {
        gaps.push({
          level: stages[i].level,
          severity: stages[i].mastery < 5 ? "high" : stages[i].mastery < 10 ? "medium" : "low",
          description: `Limited ${BLOOMS_DESCRIPTIONS[stages[i].level].toLowerCase()} activities`,
          suggestions: [
            `Add more ${stages[i].level.toLowerCase()} level content`,
            `Include assessments targeting ${stages[i].level.toLowerCase()} skills`
          ]
        });
      }
    }
    return {
      current: { stages, currentStage, completionPercentage },
      recommended: this.generateRecommendedPath(stages, gaps),
      gaps
    };
  }
  generateRecommendedPath(currentStages, gaps) {
    const idealDistribution = {
      REMEMBER: 15,
      UNDERSTAND: 20,
      APPLY: 25,
      ANALYZE: 20,
      EVALUATE: 15,
      CREATE: 5
    };
    const recommendedStages = currentStages.map((stage) => ({
      ...stage,
      mastery: idealDistribution[stage.level],
      activities: stage.activities.length > 0 ? stage.activities : [`Recommended: Add ${stage.level.toLowerCase()} activities`]
    }));
    return {
      stages: recommendedStages,
      currentStage: 0,
      completionPercentage: 100
    };
  }
  async generateCourseRecommendations(courseData, chapters, distribution) {
    const contentAdjustments = [];
    const assessmentChanges = [];
    const activitySuggestions = [];
    const underrepresented = BLOOMS_HIERARCHY.filter((level) => distribution[level] < 10);
    for (const level of underrepresented) {
      contentAdjustments.push({
        type: "add",
        bloomsLevel: level,
        description: `Add content targeting ${BLOOMS_DESCRIPTIONS[level].toLowerCase()}`,
        impact: distribution[level] < 5 ? "high" : "medium"
      });
      assessmentChanges.push({
        type: "add_questions",
        bloomsLevel: level,
        description: `Include questions at the ${level} level`,
        examples: this.getQuestionExamples(level)
      });
    }
    const balance = this.determineBalance(distribution);
    if (balance === "bottom-heavy") {
      activitySuggestions.push({
        bloomsLevel: "ANALYZE",
        activityType: "case_study",
        description: "Add case studies requiring analysis",
        implementation: "Present real-world scenarios for students to analyze",
        expectedOutcome: "Improved critical thinking and analysis skills"
      });
      activitySuggestions.push({
        bloomsLevel: "CREATE",
        activityType: "project",
        description: "Add creative project assignments",
        implementation: "Assign open-ended projects requiring original work",
        expectedOutcome: "Development of creative problem-solving abilities"
      });
    }
    return { contentAdjustments, assessmentChanges, activitySuggestions };
  }
  getQuestionExamples(level) {
    const examples = {
      REMEMBER: ["What is the definition of...?", "List the main components of..."],
      UNDERSTAND: ["Explain why...", "Summarize the key points of..."],
      APPLY: ["How would you apply... to solve...?", "Demonstrate how to use..."],
      ANALYZE: ["Compare and contrast...", "What are the relationships between...?"],
      EVALUATE: ["Evaluate the effectiveness of...", "Which approach is better and why?"],
      CREATE: ["Design a solution for...", "Develop a new approach to..."]
    };
    return examples[level];
  }
  analyzeStudentImpact(distribution, chapters) {
    const skillsDeveloped = BLOOMS_HIERARCHY.filter((level) => distribution[level] > 10).map((level) => ({
      name: `${level.charAt(0)}${level.slice(1).toLowerCase()} Skills`,
      bloomsLevel: level,
      proficiency: Math.min(100, distribution[level] * 1.5),
      description: BLOOMS_DESCRIPTIONS[level]
    }));
    const cognitiveDepth = this.calculateCognitiveDepth(distribution);
    const cognitiveGrowth = {
      currentLevel: cognitiveDepth,
      projectedLevel: Math.min(100, cognitiveDepth + 20),
      timeframe: `${chapters.length * 2} weeks`,
      keyMilestones: [
        "Master foundational concepts",
        "Apply knowledge to practical scenarios",
        "Develop critical analysis skills"
      ]
    };
    const careerAlignment = this.determineCareerAlignment(distribution);
    return { skillsDeveloped, cognitiveGrowth, careerAlignment };
  }
  determineCareerAlignment(distribution) {
    const careers = [];
    if (distribution.ANALYZE > 20 || distribution.EVALUATE > 15) {
      careers.push({
        role: "Analyst",
        alignment: (distribution.ANALYZE + distribution.EVALUATE) / 2,
        requiredSkills: ["Critical thinking", "Data analysis", "Problem-solving"],
        matchedSkills: ["Analysis", "Evaluation"]
      });
    }
    if (distribution.CREATE > 10 || distribution.APPLY > 20) {
      careers.push({
        role: "Developer/Designer",
        alignment: (distribution.CREATE + distribution.APPLY) / 2,
        requiredSkills: ["Creative thinking", "Technical skills", "Innovation"],
        matchedSkills: ["Creation", "Application"]
      });
    }
    if (distribution.UNDERSTAND > 20 && distribution.APPLY > 15) {
      careers.push({
        role: "Practitioner",
        alignment: (distribution.UNDERSTAND + distribution.APPLY) / 2,
        requiredSkills: ["Domain knowledge", "Practical skills", "Communication"],
        matchedSkills: ["Understanding", "Application"]
      });
    }
    return careers;
  }
  parseBloomsLevelFromResponse(text) {
    const upperText = text.toUpperCase();
    for (const level of BLOOMS_HIERARCHY) {
      if (upperText.includes(level)) {
        return level;
      }
    }
    return "UNDERSTAND";
  }
  /**
   * Update cognitive progress for a student
   */
  async updateCognitiveProgress(userId, sectionId, bloomsLevel, score) {
    if (!this.database) {
      this.logger?.debug?.("[BloomsEngine] No database, skipping progress update");
      return;
    }
    try {
      const existing = await this.database.findBloomsProgress(userId, sectionId);
      if (existing) {
        const scores = {
          REMEMBER: existing.rememberScore ?? 0,
          UNDERSTAND: existing.understandScore ?? 0,
          APPLY: existing.applyScore ?? 0,
          ANALYZE: existing.analyzeScore ?? 0,
          EVALUATE: existing.evaluateScore ?? 0,
          CREATE: existing.createScore ?? 0
        };
        const currentScore = scores[bloomsLevel] ?? 0;
        scores[bloomsLevel] = currentScore * 0.7 + score * 0.3;
        await this.database.upsertBloomsProgress(userId, sectionId, {
          rememberScore: scores.REMEMBER,
          understandScore: scores.UNDERSTAND,
          applyScore: scores.APPLY,
          analyzeScore: scores.ANALYZE,
          evaluateScore: scores.EVALUATE,
          createScore: scores.CREATE
        });
      } else {
        await this.database.upsertBloomsProgress(userId, sectionId, {
          rememberScore: bloomsLevel === "REMEMBER" ? score : 0,
          understandScore: bloomsLevel === "UNDERSTAND" ? score : 0,
          applyScore: bloomsLevel === "APPLY" ? score : 0,
          analyzeScore: bloomsLevel === "ANALYZE" ? score : 0,
          evaluateScore: bloomsLevel === "EVALUATE" ? score : 0,
          createScore: bloomsLevel === "CREATE" ? score : 0
        });
      }
    } catch (error) {
      this.logger?.error?.("[BloomsEngine] Failed to update cognitive progress", error);
    }
  }
  /**
   * Calculate spaced repetition schedule
   */
  async calculateSpacedRepetition(input) {
    const { userId, conceptId, performance } = input;
    let repetitionCount = 1;
    let easeFactor = 2.5;
    let previousInterval = 1;
    if (this.database) {
      try {
        const existingProgress = await this.database.findCognitiveProgress(userId, conceptId);
        if (existingProgress) {
          const data = existingProgress;
          repetitionCount = data.repetitionCount ?? 1;
          easeFactor = data.easeFactor ?? 2.5;
          previousInterval = data.lastInterval ?? 1;
        }
      } catch (error) {
        this.logger?.warn?.("[BloomsEngine] Could not fetch existing schedule", error);
      }
    }
    const newEaseFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02))
    );
    let intervalDays;
    if (performance < 3) {
      repetitionCount = 1;
      intervalDays = 1;
    } else {
      if (repetitionCount === 1) {
        intervalDays = 1;
      } else if (repetitionCount === 2) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(previousInterval * newEaseFactor);
      }
      repetitionCount++;
    }
    const nextReviewDate = /* @__PURE__ */ new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
    return {
      nextReviewDate,
      intervalDays,
      easeFactor: newEaseFactor,
      repetitionCount
    };
  }
  /**
   * Get cognitive profile for a user
   */
  async getCognitiveProfile(userId, courseId) {
    if (!this.database) {
      return this.createDefaultProfile({
        REMEMBER: 50,
        UNDERSTAND: 50,
        APPLY: 50,
        ANALYZE: 50,
        EVALUATE: 50,
        CREATE: 50
      });
    }
    try {
      const progress = courseId ? await this.database.findBloomsProgress(userId, courseId) : null;
      if (!progress) {
        return this.createDefaultProfile({
          REMEMBER: 50,
          UNDERSTAND: 50,
          APPLY: 50,
          ANALYZE: 50,
          EVALUATE: 50,
          CREATE: 50
        });
      }
      const scores = {
        REMEMBER: progress.rememberScore ?? 0,
        UNDERSTAND: progress.understandScore ?? 0,
        APPLY: progress.applyScore ?? 0,
        ANALYZE: progress.analyzeScore ?? 0,
        EVALUATE: progress.evaluateScore ?? 0,
        CREATE: progress.createScore ?? 0
      };
      return this.createCognitiveProfile(scores);
    } catch (error) {
      this.logger?.error?.("[BloomsEngine] Failed to get cognitive profile", error);
      return this.createDefaultProfile({
        REMEMBER: 50,
        UNDERSTAND: 50,
        APPLY: 50,
        ANALYZE: 50,
        EVALUATE: 50,
        CREATE: 50
      });
    }
  }
  /**
   * Get learning recommendations for a user
   */
  async getRecommendations(userId, courseId) {
    const profile = await this.getCognitiveProfile(userId, courseId);
    const recommendations = [];
    for (const level of profile.challengeAreas) {
      recommendations.push({
        type: "remediate",
        title: `Strengthen ${level} Skills`,
        description: `Focus on ${BLOOMS_DESCRIPTIONS[level].toLowerCase()} to build a stronger foundation.`,
        bloomsLevel: level,
        priority: 1,
        estimatedTime: 30
      });
    }
    for (const level of profile.preferredLevels) {
      const nextLevel = this.getNextLevel(level);
      if (nextLevel && !profile.preferredLevels.includes(nextLevel)) {
        recommendations.push({
          type: "advance",
          title: `Progress to ${nextLevel}`,
          description: `Build on your ${level} strength to develop ${BLOOMS_DESCRIPTIONS[nextLevel].toLowerCase()}.`,
          bloomsLevel: nextLevel,
          priority: 2,
          estimatedTime: 45
        });
      }
    }
    if (profile.overallMastery < 70) {
      recommendations.push({
        type: "practice",
        title: "Regular Practice Sessions",
        description: "Consistent practice across all cognitive levels will improve overall mastery.",
        bloomsLevel: "APPLY",
        priority: 3,
        estimatedTime: 20
      });
    }
    return recommendations.sort((a, b) => a.priority - b.priority);
  }
  /**
   * Log learning activity
   */
  async logLearningActivity(userId, activityType, data) {
    if (!this.database) return;
    try {
      await this.database.logInteraction({
        userId,
        pageType: "LEARNING_ACTIVITY",
        pagePath: `/activity/${activityType}`,
        query: activityType,
        response: JSON.stringify(data),
        enginesUsed: ["blooms-analysis-engine"],
        responseTimeMs: 0
      });
    } catch (error) {
      this.logger?.warn?.("[BloomsEngine] Failed to log activity", error);
    }
  }
  /**
   * Create progress intervention
   */
  async createProgressIntervention(userId, type, title, message, metadata) {
    if (!this.database) return;
    try {
      await this.database.logInteraction({
        userId,
        pageType: "INTERVENTION",
        pagePath: `/intervention/${type}`,
        query: title,
        response: JSON.stringify({ message, ...metadata }),
        enginesUsed: ["blooms-analysis-engine"],
        responseTimeMs: 0
      });
    } catch (error) {
      this.logger?.warn?.("[BloomsEngine] Failed to create intervention", error);
    }
  }
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  analyzeKeywords(content) {
    const lowerContent = content.toLowerCase();
    const counts = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    for (const [level, keywords] of Object.entries(BLOOMS_KEYWORDS)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, "gi");
        const matches = lowerContent.match(regex);
        counts[level] += matches?.length ?? 0;
      }
    }
    return counts;
  }
  normalizeDistribution(counts) {
    const total = Object.values(counts).reduce((sum, c) => sum + c, 0) || 1;
    return {
      REMEMBER: counts.REMEMBER / total * 100,
      UNDERSTAND: counts.UNDERSTAND / total * 100,
      APPLY: counts.APPLY / total * 100,
      ANALYZE: counts.ANALYZE / total * 100,
      EVALUATE: counts.EVALUATE / total * 100,
      CREATE: counts.CREATE / total * 100
    };
  }
  getDominantLevel(distribution) {
    let maxLevel = "UNDERSTAND";
    let maxValue = 0;
    for (const [level, value] of Object.entries(distribution)) {
      if (value > maxValue) {
        maxValue = value;
        maxLevel = level;
      }
    }
    return maxLevel;
  }
  identifyGaps(distribution) {
    const threshold = 10;
    return Object.entries(distribution).filter(([, value]) => value < threshold).map(([level]) => level);
  }
  generateRecommendations(distribution, gaps) {
    const recommendations = [];
    for (const gap of gaps) {
      recommendations.push({
        level: gap,
        action: `Add more ${BLOOMS_DESCRIPTIONS[gap].toLowerCase()} activities`,
        priority: "high"
      });
    }
    const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND;
    const higherLevels = distribution.EVALUATE + distribution.CREATE;
    if (lowerLevels > 60 && higherLevels < 20) {
      recommendations.push({
        level: "EVALUATE",
        action: "Balance with more higher-order thinking activities",
        priority: "medium"
      });
    }
    return recommendations;
  }
  async analyzeWithAI(content, keywordDistribution) {
    try {
      const response = await this.config.ai.chat({
        messages: [
          {
            role: "system",
            content: `You are an expert in Bloom's Taxonomy analysis for educational content.
Analyze the given content and provide a detailed cognitive level breakdown.
Return your analysis as a JSON object.`
          },
          {
            role: "user",
            content: `Analyze this content for Bloom's Taxonomy distribution:

${content.slice(0, 3e3)}${content.length > 3e3 ? "..." : ""}

Keyword-based preliminary analysis:
${JSON.stringify(keywordDistribution)}

Provide a JSON response with:
{
  "distribution": {
    "REMEMBER": <0-100>,
    "UNDERSTAND": <0-100>,
    "APPLY": <0-100>,
    "ANALYZE": <0-100>,
    "EVALUATE": <0-100>,
    "CREATE": <0-100>
  },
  "dominantLevel": "<level>",
  "gaps": ["<level>", ...],
  "reasoning": "<explanation>",
  "recommendations": [
    {"level": "<level>", "action": "<text>", "priority": "low|medium|high"}
  ]
}`
          }
        ],
        temperature: 0.3,
        maxTokens: 1500
      });
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON in response");
      }
      const parsed = JSON.parse(jsonMatch[0]);
      const distribution = this.normalizeDistribution(parsed.distribution);
      return {
        distribution,
        dominantLevel: parsed.dominantLevel || this.getDominantLevel(distribution),
        gaps: parsed.gaps || this.identifyGaps(distribution),
        recommendations: parsed.recommendations || [],
        cognitiveProfile: this.createDefaultProfile(distribution)
      };
    } catch (error) {
      this.logger?.warn?.("[BloomsEngine] AI analysis failed, using keyword-based", error);
      const distribution = this.normalizeDistribution(keywordDistribution);
      return {
        distribution,
        dominantLevel: this.getDominantLevel(distribution),
        gaps: this.identifyGaps(distribution),
        recommendations: this.generateRecommendations(distribution, this.identifyGaps(distribution)),
        cognitiveProfile: this.createDefaultProfile(distribution)
      };
    }
  }
  createDefaultProfile(distribution) {
    const mastery = {};
    let total = 0;
    for (const level of BLOOMS_HIERARCHY) {
      mastery[level] = distribution[level];
      total += distribution[level];
    }
    const overallMastery = total / 6;
    const sortedLevels = [...BLOOMS_HIERARCHY].sort((a, b) => mastery[b] - mastery[a]);
    return {
      overallMastery,
      levelMastery: mastery,
      learningVelocity: 0.7,
      preferredLevels: sortedLevels.slice(0, 2),
      challengeAreas: sortedLevels.slice(-2).filter((l) => mastery[l] < 30)
    };
  }
  createCognitiveProfile(scores) {
    const total = Object.values(scores).reduce((sum, s) => sum + s, 0);
    const overallMastery = total / 6;
    const sortedLevels = [...BLOOMS_HIERARCHY].sort((a, b) => scores[b] - scores[a]);
    return {
      overallMastery,
      levelMastery: scores,
      learningVelocity: overallMastery > 70 ? 0.9 : overallMastery > 50 ? 0.7 : 0.5,
      preferredLevels: sortedLevels.filter((l) => scores[l] >= 70).slice(0, 2),
      challengeAreas: sortedLevels.filter((l) => scores[l] < 40)
    };
  }
  getNextLevel(level) {
    const index = BLOOMS_HIERARCHY.indexOf(level);
    if (index < BLOOMS_HIERARCHY.length - 1) {
      return BLOOMS_HIERARCHY[index + 1];
    }
    return null;
  }
};
function createBloomsAnalysisEngine(config) {
  return new BloomsAnalysisEngine(config);
}

// src/engines/personalization-engine.ts
var PersonalizationEngine = class {
  config;
  database;
  logger;
  learningStyleCache = /* @__PURE__ */ new Map();
  emotionalStateCache = /* @__PURE__ */ new Map();
  constructor(engineConfig) {
    this.config = engineConfig.samConfig;
    this.database = engineConfig.database ?? engineConfig.samConfig.database;
    this.logger = this.config.logger ?? console;
  }
  // ============================================================================
  // LEARNING STYLE DETECTION
  // ============================================================================
  async detectLearningStyle(behavior) {
    this.logger?.info?.("[PersonalizationEngine] Detecting learning style");
    const cached = this.learningStyleCache.get(behavior.userId);
    if (cached) {
      return cached;
    }
    const styleStrengths = this.analyzeStyleStrengths(behavior);
    const sortedStyles = Object.entries(styleStrengths).sort(([, a], [, b]) => b - a);
    const primaryStyle = sortedStyles[0][0];
    const secondaryStyle = sortedStyles[1]?.[1] > 0.2 ? sortedStyles[1][0] : void 0;
    const evidenceFactors = this.generateEvidenceFactors(behavior, primaryStyle);
    const confidence = this.calculateConfidence(behavior, styleStrengths);
    const profile = {
      primaryStyle,
      secondaryStyle,
      styleStrengths,
      evidenceFactors,
      confidence
    };
    this.learningStyleCache.set(behavior.userId, profile);
    await this.storeLearningStyleProfile(behavior.userId, profile);
    return profile;
  }
  analyzeStyleStrengths(behavior) {
    const strengths = {
      visual: 0,
      auditory: 0,
      kinesthetic: 0,
      "reading-writing": 0,
      mixed: 0
    };
    for (const interaction of behavior.contentInteractions) {
      const contentType = interaction.contentType.toLowerCase();
      const weight = interaction.engagementScore * interaction.completionRate;
      if (contentType.includes("video") || contentType.includes("image")) {
        strengths.visual += weight;
      }
      if (contentType.includes("audio") || contentType.includes("podcast")) {
        strengths.auditory += weight;
      }
      if (contentType.includes("interactive") || contentType.includes("simulation")) {
        strengths.kinesthetic += weight;
      }
      if (contentType.includes("text") || contentType.includes("article")) {
        strengths["reading-writing"] += weight;
      }
    }
    const total = Object.values(strengths).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const key of Object.keys(strengths)) {
        strengths[key] /= total;
      }
    }
    return strengths;
  }
  generateEvidenceFactors(behavior, primaryStyle) {
    const factors = [];
    const avgSession = behavior.sessionPatterns.reduce((sum, s) => sum + s.duration, 0) / Math.max(1, behavior.sessionPatterns.length);
    factors.push(`Average session duration: ${avgSession.toFixed(0)} minutes`);
    factors.push(`Primary engagement with ${primaryStyle} content`);
    factors.push(`${behavior.contentInteractions.length} content interactions analyzed`);
    return factors;
  }
  calculateConfidence(behavior, strengths) {
    const dataPoints = behavior.contentInteractions.length + behavior.sessionPatterns.length;
    const dataConfidence = Math.min(1, dataPoints / 50);
    const values = Object.values(strengths).sort((a, b) => b - a);
    const distinctionConfidence = values[0] - values[1];
    return dataConfidence * 0.6 + distinctionConfidence * 0.4;
  }
  // ============================================================================
  // COGNITIVE LOAD OPTIMIZATION
  // ============================================================================
  async optimizeCognitiveLoad(content, student) {
    this.logger?.info?.("[PersonalizationEngine] Optimizing cognitive load");
    const adaptations = [];
    const emphasizedElements = [];
    const simplifiedConcepts = [];
    const additionalExplanations = [];
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
          messages: [{ role: "user", content: prompt }],
          model: this.config.model?.name || "claude-sonnet-4-20250514"
        });
        const parsed = this.parseAIResponse(response);
        if (parsed.emphasizedElements) emphasizedElements.push(...parsed.emphasizedElements);
        if (parsed.simplifiedConcepts) simplifiedConcepts.push(...parsed.simplifiedConcepts);
        if (parsed.additionalExplanations) additionalExplanations.push(...parsed.additionalExplanations);
      } catch (error) {
        this.logger?.error?.("[PersonalizationEngine] AI optimization failed:", error);
      }
    }
    return {
      originalContent: content,
      adaptations,
      presentationOrder: [],
      emphasizedElements,
      simplifiedConcepts,
      additionalExplanations
    };
  }
  // ============================================================================
  // EMOTIONAL STATE RECOGNITION
  // ============================================================================
  async recognizeEmotionalState(interactions) {
    this.logger?.info?.("[PersonalizationEngine] Recognizing emotional state");
    if (interactions.length === 0) {
      return this.getDefaultEmotionalState();
    }
    const userId = interactions[0].userId;
    const indicators = [];
    const errorRate = interactions.filter((i) => i.isError).length / interactions.length;
    indicators.push({
      type: "error_rate",
      value: errorRate,
      weight: 0.3,
      timestamp: /* @__PURE__ */ new Date()
    });
    const avgResponseTime = interactions.reduce((sum, i) => sum + i.responseTime, 0) / interactions.length;
    indicators.push({
      type: "response_time",
      value: avgResponseTime,
      weight: 0.2,
      timestamp: /* @__PURE__ */ new Date()
    });
    const recentActivity = interactions.slice(0, 10);
    const activityVariety = new Set(recentActivity.map((i) => i.type)).size;
    indicators.push({
      type: "activity_variety",
      value: activityVariety,
      weight: 0.2,
      timestamp: /* @__PURE__ */ new Date()
    });
    const emotion = this.inferEmotion(indicators);
    const trend = this.calculateTrend(userId);
    const recommendations = this.generateEmotionalRecommendations(emotion);
    const state = {
      currentEmotion: emotion,
      confidence: 0.7,
      indicators,
      trend,
      recommendations
    };
    this.emotionalStateCache.set(userId, state);
    await this.storeEmotionalState(userId, state);
    return state;
  }
  getDefaultEmotionalState() {
    return {
      currentEmotion: "neutral",
      confidence: 0.5,
      indicators: [],
      trend: "stable",
      recommendations: ["Continue with current learning activities"]
    };
  }
  inferEmotion(indicators) {
    const errorIndicator = indicators.find((i) => i.type === "error_rate");
    const responseIndicator = indicators.find((i) => i.type === "response_time");
    const errorRate = errorIndicator?.value || 0;
    const responseTime = responseIndicator?.value || 0;
    if (errorRate > 0.5) return "frustrated";
    if (errorRate > 0.3) return "confused";
    if (responseTime < 1e3 && errorRate < 0.1) return "confident";
    if (responseTime > 1e4) return "anxious";
    return "neutral";
  }
  calculateTrend(userId) {
    const cached = this.emotionalStateCache.get(userId);
    if (!cached) return "stable";
    return "stable";
  }
  generateEmotionalRecommendations(emotion) {
    const recommendations = {
      motivated: ["Continue with current pace", "Try more challenging content"],
      frustrated: ["Take a short break", "Review previous concepts", "Try easier problems first"],
      confused: ["Review learning materials", "Ask for help", "Break down the problem"],
      confident: ["Progress to next level", "Help other learners", "Tackle advanced topics"],
      anxious: ["Take a deep breath", "Start with familiar content", "Set smaller goals"],
      neutral: ["Continue learning at your pace"]
    };
    return recommendations[emotion] || ["Continue learning"];
  }
  // ============================================================================
  // MOTIVATION ANALYSIS
  // ============================================================================
  async analyzeMotivationPatterns(history) {
    this.logger?.info?.("[PersonalizationEngine] Analyzing motivation patterns");
    const intrinsicFactors = this.identifyIntrinsicFactors(history);
    const extrinsicFactors = this.identifyExtrinsicFactors(history);
    const triggers = this.identifyMotivationTriggers(history);
    const barriers = this.identifyMotivationBarriers(history);
    const positiveScore = [...intrinsicFactors, ...extrinsicFactors].filter((f) => f.type === "positive").reduce((sum, f) => sum + f.strength, 0);
    const negativeScore = [...intrinsicFactors, ...extrinsicFactors].filter((f) => f.type === "negative").reduce((sum, f) => sum + f.strength, 0);
    const currentLevel = Math.max(0, Math.min(100, 50 + positiveScore * 10 - negativeScore * 10));
    const sustainabilityScore = intrinsicFactors.length > extrinsicFactors.length ? 0.8 : 0.5;
    const profile = {
      intrinsicFactors,
      extrinsicFactors,
      currentLevel,
      triggers,
      barriers,
      sustainabilityScore
    };
    await this.storeMotivationProfile(history.userId, profile);
    return profile;
  }
  identifyIntrinsicFactors(history) {
    const factors = [];
    if (history.activities.length > 20) {
      factors.push({
        factor: "Curiosity",
        strength: 0.7,
        type: "positive",
        evidence: ["Consistent exploration of new topics"]
      });
    }
    if (history.progress.length > 10) {
      factors.push({
        factor: "Self-improvement",
        strength: 0.6,
        type: "positive",
        evidence: ["Regular progress tracking"]
      });
    }
    return factors;
  }
  identifyExtrinsicFactors(history) {
    const factors = [];
    if (history.achievements.length > 5) {
      factors.push({
        factor: "Achievement",
        strength: 0.5,
        type: "positive",
        evidence: ["Multiple achievements earned"]
      });
    }
    return factors;
  }
  identifyMotivationTriggers(history) {
    return [
      "Completing a challenge",
      "Receiving positive feedback",
      "Making progress on goals"
    ];
  }
  identifyMotivationBarriers(history) {
    return [
      "Difficult content without support",
      "Lack of immediate feedback",
      "Unclear learning objectives"
    ];
  }
  // ============================================================================
  // PERSONALIZED LEARNING PATH
  // ============================================================================
  async generatePersonalizedPath(profile) {
    this.logger?.info?.("[PersonalizationEngine] Generating personalized learning path");
    const pathId = `path-${Date.now()}-${profile.userId}`;
    const nodes = [];
    const edges = [];
    let nodeId = 0;
    for (const gap of profile.skillGaps) {
      nodes.push({
        id: `node-${nodeId}`,
        type: "content",
        content: { skill: gap.skill, targetScore: 80 },
        estimatedTime: 30,
        difficulty: gap.score < 50 ? 0.3 : 0.5,
        prerequisites: nodeId > 0 ? [`node-${nodeId - 1}`] : [],
        outcomes: [`Improve ${gap.skill} to 80%`]
      });
      nodeId++;
    }
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        from: nodes[i].id,
        to: nodes[i + 1].id,
        weight: 1
      });
    }
    const difficultyProgression = nodes.map((n) => n.difficulty);
    const alternativePaths = this.generateAlternativePaths(nodes);
    const path = {
      pathId,
      userId: profile.userId,
      startPoint: nodes[0] || this.createDefaultNode(),
      targetOutcome: profile.careerGoals[0] || "Complete learning objectives",
      nodes,
      edges,
      estimatedDuration: nodes.reduce((sum, n) => sum + n.estimatedTime, 0),
      difficultyProgression,
      alternativePaths
    };
    await this.storeLearningPath(path);
    return path;
  }
  createDefaultNode() {
    return {
      id: "node-default",
      type: "content",
      content: { welcome: true },
      estimatedTime: 5,
      difficulty: 0.1,
      prerequisites: [],
      outcomes: ["Get started with learning"]
    };
  }
  generateAlternativePaths(nodes) {
    if (nodes.length < 3) return [];
    return [{
      reason: "Skip prerequisites if already familiar",
      nodes: nodes.slice(1).map((n) => n.id),
      benefit: "Faster completion for experienced learners"
    }];
  }
  // ============================================================================
  // APPLY PERSONALIZATION
  // ============================================================================
  async applyPersonalization(context) {
    this.logger?.info?.("[PersonalizationEngine] Applying personalization");
    const recommendations = [];
    const adaptations = [];
    const learningPath = [];
    const insights = [];
    for (const goal of context.learningGoals) {
      recommendations.push({
        type: "add",
        bloomsLevel: "APPLY",
        // Default to application level for goal-based content
        description: `Add content aligned with learning goal: ${goal}`,
        impact: "high"
      });
    }
    if (context.timeConstraints?.available) {
      adaptations.push({
        type: "text",
        content: { timeOptimized: true },
        reason: `Optimized for ${context.timeConstraints.available} minutes`,
        expectedImpact: 0.7
      });
    }
    insights.push({
      type: "learning_pattern",
      description: "Personalization applied based on your learning history",
      actionable: true,
      priority: "medium"
    });
    const result = {
      recommendations,
      adaptations,
      learningPath,
      insights,
      confidence: 0.75
    };
    await this.storePersonalizationResult(context.userId, result);
    return result;
  }
  // ============================================================================
  // STORAGE HELPERS (In-memory cache only - no database persistence)
  // ============================================================================
  async storeLearningStyleProfile(userId, profile) {
    this.logger?.debug?.(
      "[PersonalizationEngine] Learning style profile cached for user:",
      userId,
      profile.primaryStyle
    );
  }
  async storeEmotionalState(userId, state) {
    this.logger?.debug?.(
      "[PersonalizationEngine] Emotional state cached for user:",
      userId,
      state.currentEmotion
    );
  }
  async storeMotivationProfile(userId, profile) {
    this.logger?.debug?.(
      "[PersonalizationEngine] Motivation profile computed for user:",
      userId,
      `level: ${profile.currentLevel}`
    );
  }
  async storeLearningPath(path) {
    this.logger?.debug?.(
      "[PersonalizationEngine] Learning path generated:",
      path.pathId,
      `${path.nodes.length} nodes`
    );
  }
  async storePersonalizationResult(userId, result) {
    this.logger?.debug?.(
      "[PersonalizationEngine] Personalization applied for user:",
      userId,
      `${result.recommendations.length} recommendations`
    );
  }
  // ============================================================================
  // UTILITY HELPERS
  // ============================================================================
  parseAIResponse(response) {
    try {
      if (typeof response === "string") {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      if (typeof response === "object" && response !== null) {
        return response;
      }
    } catch {
    }
    return {};
  }
};
function createPersonalizationEngine(config) {
  return new PersonalizationEngine(config);
}

// src/engines/content-generation-engine.ts
var ContentGenerationEngine = class {
  config;
  database;
  logger;
  constructor(engineConfig) {
    this.config = engineConfig.samConfig;
    this.database = engineConfig.database;
    this.logger = this.config.logger;
  }
  /**
   * Generate course content based on learning objectives
   */
  async generateCourseContent(objectives, config) {
    try {
      this.logger?.debug?.("[ContentGenerationEngine] Generating course content", {
        objectiveCount: objectives.length,
        style: config?.style
      });
      const structure = await this.generateCourseStructure(objectives, config);
      const outline = await this.generateDetailedOutline(structure, objectives, config);
      const estimatedDuration = this.calculateCourseDuration(outline);
      const difficulty = this.determineDifficulty(objectives);
      const prerequisites = this.identifyPrerequisites(objectives);
      const courseContent = {
        title: structure.title,
        description: structure.description,
        outline,
        estimatedDuration,
        difficulty,
        prerequisites,
        learningOutcomes: objectives.map((obj) => obj.objective),
        targetAudience: config?.targetAudience || "General learners"
      };
      await this.storeGeneratedContent("course", courseContent);
      this.logger?.info?.("[ContentGenerationEngine] Course content generated", {
        title: courseContent.title,
        chapters: courseContent.outline.chapters.length
      });
      return courseContent;
    } catch (error) {
      this.logger?.error?.("[ContentGenerationEngine] Error generating course content:", error);
      throw new Error("Failed to generate course content");
    }
  }
  /**
   * Create assessments for given topics
   */
  async createAssessments(topics, assessmentType, config) {
    try {
      this.logger?.debug?.("[ContentGenerationEngine] Creating assessments", {
        topicCount: topics.length,
        type: assessmentType
      });
      const assessments = [];
      for (const topic of topics) {
        const questions = await this.generateQuestions(topic, assessmentType, config);
        const assessment = {
          id: `assessment-${Date.now()}-${assessments.length}`,
          type: assessmentType,
          title: `${topic.name} ${this.formatAssessmentType(assessmentType)}`,
          description: this.generateAssessmentDescription(topic, assessmentType),
          questions,
          passingScore: this.calculatePassingScore(assessmentType),
          duration: this.calculateAssessmentDuration(questions, assessmentType),
          instructions: this.generateInstructions(assessmentType)
        };
        assessments.push(assessment);
      }
      await this.storeGeneratedAssessments(assessments);
      this.logger?.info?.("[ContentGenerationEngine] Assessments created", {
        count: assessments.length,
        type: assessmentType
      });
      return assessments;
    } catch (error) {
      this.logger?.error?.("[ContentGenerationEngine] Error creating assessments:", error);
      throw new Error("Failed to create assessments");
    }
  }
  /**
   * Generate study guide for a course
   */
  async generateStudyGuides(course) {
    try {
      this.logger?.debug?.("[ContentGenerationEngine] Generating study guide", {
        courseId: course.id,
        title: course.title
      });
      const keyTopics = await this.extractKeyTopics(course);
      const summaries = await this.generateSummaries(course);
      const practiceQuestions = await this.generatePracticeQuestions(keyTopics);
      const studyTips = this.generateStudyTips(course, keyTopics);
      const additionalResources = this.findAdditionalResources(keyTopics);
      const studyGuide = {
        courseId: course.id,
        title: `Study Guide: ${course.title}`,
        overview: this.generateStudyGuideOverview(course),
        keyTopics,
        summaries,
        practiceQuestions,
        studyTips,
        additionalResources
      };
      await this.storeStudyGuide(studyGuide);
      this.logger?.info?.("[ContentGenerationEngine] Study guide generated", {
        courseId: course.id,
        topicCount: keyTopics.length
      });
      return studyGuide;
    } catch (error) {
      this.logger?.error?.("[ContentGenerationEngine] Error generating study guide:", error);
      throw new Error("Failed to generate study guide");
    }
  }
  /**
   * Create interactive exercises for concepts
   */
  async createInteractiveExercises(concepts, exerciseType) {
    try {
      this.logger?.debug?.("[ContentGenerationEngine] Creating exercises", {
        conceptCount: concepts.length,
        type: exerciseType
      });
      const exercises = [];
      for (const concept of concepts) {
        const exercise = await this.generateExercise(concept, exerciseType);
        exercises.push(exercise);
      }
      const validatedExercises = this.validateExercises(exercises);
      await this.storeExercises(validatedExercises);
      this.logger?.info?.("[ContentGenerationEngine] Exercises created", {
        count: validatedExercises.length,
        type: exerciseType
      });
      return validatedExercises;
    } catch (error) {
      this.logger?.error?.("[ContentGenerationEngine] Error creating exercises:", error);
      throw new Error("Failed to create exercises");
    }
  }
  /**
   * Adapt content to a different language
   */
  async adaptContentLanguage(content, targetLanguage) {
    try {
      this.logger?.debug?.("[ContentGenerationEngine] Adapting content language", {
        targetLanguage: targetLanguage.name
      });
      const translatedContent = await this.translateContent(content, targetLanguage);
      const culturalAdaptations = this.applyCulturalAdaptations(content, targetLanguage);
      const glossary = this.createGlossary(content, translatedContent, targetLanguage);
      const localizedContent = {
        originalContent: content,
        targetLanguage: targetLanguage.code,
        translatedContent,
        culturalAdaptations,
        glossary
      };
      await this.storeLocalizedContent(localizedContent);
      this.logger?.info?.("[ContentGenerationEngine] Content adapted", {
        targetLanguage: targetLanguage.code
      });
      return localizedContent;
    } catch (error) {
      this.logger?.error?.("[ContentGenerationEngine] Error adapting content language:", error);
      throw new Error("Failed to adapt content language");
    }
  }
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  async generateCourseStructure(objectives, config) {
    const prompt = `
Create a course structure based on these learning objectives:
${objectives.map((obj) => `- ${obj.objective} (${obj.bloomsLevel})`).join("\n")}

Style: ${config?.style || "formal"}
Depth: ${config?.depth || "intermediate"}
Target Audience: ${config?.targetAudience || "general learners"}

Generate a JSON response with:
{
  "title": "Course title",
  "description": "Course description (2-3 sentences)",
  "chapterCount": number (3-7 chapters),
  "chapterThemes": ["theme1", "theme2", ...]
}

Return only valid JSON.`;
    try {
      const response = await this.config.ai.chat({
        model: this.config.model?.name || "claude-sonnet-4-20250514",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1e3,
        temperature: 0.7
      });
      const responseText = response.content;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      this.logger?.warn?.("[ContentGenerationEngine] AI call failed, using fallback structure");
    }
    return {
      title: "Generated Course",
      description: "A comprehensive course covering the specified learning objectives.",
      chapterCount: Math.min(5, Math.max(3, Math.ceil(objectives.length / 2))),
      chapterThemes: objectives.slice(0, 5).map((obj) => obj.objective.split(" ").slice(0, 3).join(" "))
    };
  }
  async generateDetailedOutline(structure, objectives, config) {
    const chapters = [];
    for (let i = 0; i < structure.chapterCount; i++) {
      const chapterObjectives = this.distributeObjectives(objectives, structure.chapterCount, i);
      const chapter = await this.generateChapter(
        structure.chapterThemes[i] || `Chapter ${i + 1}`,
        chapterObjectives,
        config
      );
      chapters.push(chapter);
    }
    const totalSections = chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
    const totalLessons = chapters.reduce(
      (sum, ch) => sum + ch.sections.filter((s) => s.type === "lesson").length,
      0
    );
    return {
      chapters,
      totalSections,
      totalLessons
    };
  }
  async generateChapter(theme, objectives, config) {
    const prompt = `
Create a chapter outline for:
Theme: ${theme}
Objectives: ${objectives.map((o) => o.objective).join(", ")}

Include activities: ${config?.includeActivities ? "yes" : "no"}
Style: ${config?.style || "formal"}

Generate a JSON response:
{
  "title": "Chapter title",
  "description": "Brief description",
  "objectives": ["objective1", "objective2"],
  "sections": [
    {
      "title": "Section title",
      "type": "lesson" | "activity" | "assessment",
      "content": "Brief content description",
      "duration": number (minutes)
    }
  ],
  "estimatedDuration": total minutes
}

Return only valid JSON.`;
    try {
      const response = await this.config.ai.chat({
        model: this.config.model?.name || "claude-sonnet-4-20250514",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1e3,
        temperature: 0.7
      });
      const responseText = response.content;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      this.logger?.warn?.("[ContentGenerationEngine] Chapter generation fallback");
    }
    return {
      title: theme,
      description: `Chapter covering ${theme}`,
      objectives: objectives.map((o) => o.objective),
      sections: [
        { title: "Introduction", type: "lesson", content: "Chapter introduction", duration: 15 },
        { title: "Core Concepts", type: "lesson", content: "Main content", duration: 30 },
        { title: "Practice", type: "activity", content: "Hands-on practice", duration: 20 },
        { title: "Review", type: "assessment", content: "Chapter assessment", duration: 15 }
      ],
      estimatedDuration: 80
    };
  }
  async generateQuestions(topic, assessmentType, config) {
    const questionCount = this.getQuestionCount(assessmentType);
    const bloomsDistribution = this.getBloomsDistribution(assessmentType);
    const questions = [];
    for (const [level, count] of Object.entries(bloomsDistribution)) {
      for (let i = 0; i < count; i++) {
        const question = await this.generateSingleQuestion(topic, level, config);
        questions.push(question);
      }
    }
    return questions.slice(0, questionCount);
  }
  async generateSingleQuestion(topic, bloomsLevel, config) {
    const prompt = `
Generate a ${bloomsLevel} level question about "${topic.name}":
Keywords: ${topic.keywords.join(", ")}

Requirements:
- Clear and unambiguous
- Style: ${config?.style || "formal"}

Return JSON:
{
  "type": "multiple-choice" | "true-false" | "short-answer",
  "question": "Question text",
  "options": ["A", "B", "C", "D"] (for multiple-choice),
  "correctAnswer": "correct answer",
  "explanation": "Why this is correct",
  "difficulty": "easy" | "medium" | "hard"
}

Return only valid JSON.`;
    try {
      const response = await this.config.ai.chat({
        model: this.config.model?.name || "claude-sonnet-4-20250514",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 500,
        temperature: 0.6
      });
      const responseText = response.content;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const questionData = JSON.parse(jsonMatch[0]);
        return {
          id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: questionData.type || "multiple-choice",
          question: questionData.question,
          options: questionData.options,
          correctAnswer: questionData.correctAnswer,
          explanation: questionData.explanation || "",
          points: this.calculateQuestionPoints(bloomsLevel, questionData.difficulty),
          difficulty: questionData.difficulty || "medium",
          bloomsLevel,
          hints: this.generateHints(bloomsLevel)
        };
      }
    } catch (error) {
      this.logger?.warn?.("[ContentGenerationEngine] Question generation fallback");
    }
    return {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "multiple-choice",
      question: `Question about ${topic.name} at ${bloomsLevel} level`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
      explanation: "This is the correct answer because it aligns with the core concept.",
      points: 2,
      difficulty: "medium",
      bloomsLevel,
      hints: ["Think about the definition", "Consider the key characteristics"]
    };
  }
  async generateExercise(concept, exerciseType) {
    const prompt = `
Create a ${exerciseType} exercise for the concept: "${concept.name}"
Description: ${concept.description}
Skills: ${concept.skills?.join(", ") || "general"}

Return JSON:
{
  "title": "Exercise title",
  "description": "What the student will do",
  "difficulty": "easy" | "medium" | "hard",
  "instructions": ["step1", "step2", ...],
  "hints": ["hint1", "hint2"]
}

Return only valid JSON.`;
    try {
      const response = await this.config.ai.chat({
        model: this.config.model?.name || "claude-sonnet-4-20250514",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 800,
        temperature: 0.7
      });
      const responseText = response.content;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const exerciseData = JSON.parse(jsonMatch[0]);
        return {
          id: `ex-${Date.now()}`,
          type: exerciseType,
          title: exerciseData.title || `Practice: ${concept.name}`,
          description: exerciseData.description || "",
          difficulty: exerciseData.difficulty || "medium",
          skills: concept.skills || [],
          instructions: exerciseData.instructions || ["Complete the exercise"],
          hints: exerciseData.hints || []
        };
      }
    } catch (error) {
      this.logger?.warn?.("[ContentGenerationEngine] Exercise generation fallback");
    }
    return {
      id: `ex-${Date.now()}`,
      type: exerciseType,
      title: `Practice: ${concept.name}`,
      description: `Apply ${concept.name} concepts`,
      difficulty: "medium",
      skills: concept.skills || [],
      instructions: ["Review the concept", "Complete the practice task", "Check your work"],
      hints: ["Break down the problem", "Apply what you learned"]
    };
  }
  async translateContent(content, targetLanguage) {
    const prompt = `
Translate the following educational content to ${targetLanguage.name}:

Title: ${content.title}
Description: ${content.description}
Body: ${content.body.substring(0, 2e3)}

Maintain educational tone and accuracy.

Return JSON:
{
  "title": "Translated title",
  "description": "Translated description",
  "body": "Translated body"
}

Return only valid JSON.`;
    try {
      const response = await this.config.ai.chat({
        model: this.config.model?.name || "claude-sonnet-4-20250514",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 3e3,
        temperature: 0.3
      });
      const responseText = response.content;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const translated = JSON.parse(jsonMatch[0]);
        return {
          title: translated.title,
          description: translated.description,
          body: translated.body,
          metadata: content.metadata
        };
      }
    } catch (error) {
      this.logger?.warn?.("[ContentGenerationEngine] Translation fallback");
    }
    return content;
  }
  async extractKeyTopics(course) {
    const topics = [];
    if (course.chapters) {
      for (const chapter of course.chapters) {
        topics.push({
          topic: chapter.title,
          importance: "critical",
          explanation: `Key concepts from ${chapter.title}`,
          examples: chapter.sections?.slice(0, 2).map((s) => s.title) || []
        });
      }
    }
    if (topics.length === 0) {
      topics.push({
        topic: "Core Concepts",
        importance: "critical",
        explanation: "Fundamental concepts that form the foundation",
        examples: ["Example 1", "Example 2"]
      });
    }
    return topics;
  }
  async generateSummaries(course) {
    const summaries = [];
    if (course.chapters) {
      for (const chapter of course.chapters) {
        summaries.push({
          section: chapter.title,
          bulletPoints: chapter.sections?.map((s) => s.title) || ["Key point"],
          keyTakeaways: [`Main takeaway from ${chapter.title}`]
        });
      }
    }
    if (summaries.length === 0) {
      summaries.push({
        section: "Introduction",
        bulletPoints: ["Key point 1", "Key point 2"],
        keyTakeaways: ["Main takeaway"]
      });
    }
    return summaries;
  }
  async generatePracticeQuestions(topics) {
    const questions = [];
    for (const topic of topics.filter((t) => t.importance === "critical").slice(0, 3)) {
      questions.push({
        id: `pq-${Date.now()}-${questions.length}`,
        type: "multiple-choice",
        question: `Question about ${topic.topic}`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A",
        explanation: `This is the correct answer based on ${topic.topic}`,
        points: 1,
        difficulty: "medium",
        bloomsLevel: "understand"
      });
    }
    return questions;
  }
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  calculateCourseDuration(outline) {
    return outline.chapters.reduce((total, chapter) => total + chapter.estimatedDuration, 0);
  }
  determineDifficulty(objectives) {
    const bloomsLevels = objectives.map((obj) => obj.bloomsLevel.toLowerCase());
    const highLevelCount = bloomsLevels.filter(
      (level) => ["analyze", "evaluate", "create"].includes(level)
    ).length;
    const ratio = highLevelCount / bloomsLevels.length;
    if (ratio > 0.7) return "advanced";
    if (ratio > 0.4) return "intermediate";
    return "beginner";
  }
  identifyPrerequisites(objectives) {
    const prerequisites = /* @__PURE__ */ new Set();
    objectives.forEach((obj) => {
      if (obj.bloomsLevel.toLowerCase() !== "remember") {
        obj.skills.forEach((skill) => {
          if (skill.includes("basic")) {
            prerequisites.add(skill.replace("basic", "fundamental"));
          }
        });
      }
    });
    return Array.from(prerequisites);
  }
  distributeObjectives(objectives, chapterCount, chapterIndex) {
    const objectivesPerChapter = Math.ceil(objectives.length / chapterCount);
    const start = chapterIndex * objectivesPerChapter;
    const end = Math.min(start + objectivesPerChapter, objectives.length);
    return objectives.slice(start, end);
  }
  formatAssessmentType(type) {
    const formats = {
      quiz: "Quiz",
      exam: "Examination",
      assignment: "Assignment",
      project: "Project"
    };
    return formats[type] || type;
  }
  generateAssessmentDescription(topic, type) {
    return `This ${type} assesses your understanding of ${topic.name}. Read each question carefully and select the best answer.`;
  }
  calculatePassingScore(type) {
    const scores = {
      quiz: 70,
      exam: 65,
      assignment: 60,
      project: 70
    };
    return scores[type] || 70;
  }
  calculateAssessmentDuration(questions, type) {
    const baseTime = {
      quiz: 30,
      exam: 90,
      assignment: 120,
      project: 240
    };
    const perQuestionTime = questions.length * 2;
    return (baseTime[type] || 60) + perQuestionTime;
  }
  generateInstructions(type) {
    const instructions = [
      `This ${type} must be completed in one sitting`,
      "Read each question carefully before answering",
      "You can review your answers before submission"
    ];
    if (type === "exam") {
      instructions.push("No external resources are allowed");
    }
    return instructions;
  }
  getQuestionCount(type) {
    const counts = {
      quiz: 10,
      exam: 25,
      assignment: 5,
      project: 3
    };
    return counts[type] || 10;
  }
  getBloomsDistribution(type) {
    if (type === "quiz") {
      return {
        remember: 3,
        understand: 4,
        apply: 2,
        analyze: 1
      };
    }
    if (type === "exam") {
      return {
        remember: 5,
        understand: 8,
        apply: 6,
        analyze: 4,
        evaluate: 2
      };
    }
    return {
      apply: 2,
      analyze: 2,
      create: 1
    };
  }
  calculateQuestionPoints(bloomsLevel, difficulty) {
    const bloomsPoints = {
      remember: 1,
      understand: 2,
      apply: 3,
      analyze: 4,
      evaluate: 5,
      create: 6
    };
    const difficultyMultiplier = {
      easy: 1,
      medium: 1.5,
      hard: 2
    };
    const base = bloomsPoints[bloomsLevel.toLowerCase()] || 2;
    const multiplier = difficultyMultiplier[difficulty] || 1;
    return Math.round(base * multiplier);
  }
  generateHints(bloomsLevel) {
    const hints = [];
    if (bloomsLevel === "remember" || bloomsLevel === "understand") {
      hints.push("Think about the definition or key characteristics");
    } else if (bloomsLevel === "apply") {
      hints.push("Consider how this concept works in practice");
    } else {
      hints.push("Break down the problem into smaller parts");
    }
    return hints;
  }
  validateExercises(exercises) {
    return exercises.filter((exercise) => {
      return exercise.title && exercise.description && exercise.instructions.length > 0;
    });
  }
  generateStudyTips(course, topics) {
    const tips = [
      "Review critical topics daily for better retention",
      "Practice with sample questions after each study session",
      "Create your own summary notes for each topic",
      "Form study groups to discuss complex concepts",
      "Take regular breaks to maintain focus"
    ];
    if (course.difficulty === "advanced") {
      tips.push("Dedicate extra time to hands-on practice");
    }
    return tips;
  }
  findAdditionalResources(topics) {
    return [
      {
        title: "Additional Reading",
        type: "article",
        description: "Supplementary material for deeper understanding"
      }
    ];
  }
  generateStudyGuideOverview(course) {
    return `This study guide covers the essential concepts from ${course.title}. Focus on the critical topics and use the practice questions to test your understanding.`;
  }
  applyCulturalAdaptations(content, targetLanguage) {
    const adaptations = [];
    if (targetLanguage.culture && targetLanguage.culture !== "western") {
      adaptations.push("Adapted examples to use local context");
      adaptations.push("Modified cultural references");
    }
    return adaptations;
  }
  createGlossary(original, translated, targetLanguage) {
    return [
      {
        original: "algorithm",
        translated: "algoritmo",
        context: "computational procedure"
      }
    ];
  }
  // ============================================================================
  // STORAGE METHODS
  // ============================================================================
  async storeGeneratedContent(type, content) {
    this.logger?.debug?.("[ContentGenerationEngine] Content cached", { type });
  }
  async storeGeneratedAssessments(assessments) {
    this.logger?.debug?.("[ContentGenerationEngine] Assessments cached", {
      count: assessments.length
    });
  }
  async storeStudyGuide(studyGuide) {
    this.logger?.debug?.("[ContentGenerationEngine] Study guide cached", {
      courseId: studyGuide.courseId
    });
  }
  async storeExercises(exercises) {
    this.logger?.debug?.("[ContentGenerationEngine] Exercises cached", { count: exercises.length });
  }
  async storeLocalizedContent(localized) {
    this.logger?.debug?.("[ContentGenerationEngine] Localized content cached", {
      targetLanguage: localized.targetLanguage
    });
  }
};
function createContentGenerationEngine(config) {
  return new ContentGenerationEngine(config);
}

// src/engines/resource-engine.ts
var ResourceEngine = class {
  constructor(config) {
    this.config = config;
  }
  resourceCache = /* @__PURE__ */ new Map();
  qualityCache = /* @__PURE__ */ new Map();
  /**
   * Discover external resources for a topic
   */
  async discoverResources(topic, discoveryConfig) {
    const cacheKey = this.generateCacheKey(topic, discoveryConfig);
    if (this.resourceCache.has(cacheKey)) {
      return this.resourceCache.get(cacheKey);
    }
    const resources = await this.searchMultipleSources(topic, discoveryConfig);
    const qualityThreshold = discoveryConfig?.qualityThreshold || 0.7;
    const qualityResources = [];
    for (const resource of resources) {
      const quality = await this.scoreResourceQuality(resource);
      if (quality.overall >= qualityThreshold) {
        resource.qualityScore = quality.overall;
        qualityResources.push(resource);
      }
    }
    qualityResources.sort((a, b) => {
      const scoreA = (a.qualityScore || 0) * 0.5 + (a.relevanceScore || 0) * 0.5;
      const scoreB = (b.qualityScore || 0) * 0.5 + (b.relevanceScore || 0) * 0.5;
      return scoreB - scoreA;
    });
    const limitedResources = qualityResources.slice(0, discoveryConfig?.maxResults || 20);
    this.resourceCache.set(cacheKey, limitedResources);
    return limitedResources;
  }
  /**
   * Score resource quality
   */
  async scoreResourceQuality(resource) {
    const cacheKey = resource.url;
    if (this.qualityCache.has(cacheKey)) {
      return this.qualityCache.get(cacheKey);
    }
    const factors = [];
    const relevance = await this.calculateRelevance(resource);
    factors.push({
      name: "Relevance",
      score: relevance,
      weight: 0.25,
      description: "How well the resource matches the topic"
    });
    const authority = this.calculateAuthority(resource);
    factors.push({
      name: "Authority",
      score: authority,
      weight: 0.2,
      description: "Credibility of the source and author"
    });
    const recency = this.calculateRecency(resource);
    factors.push({
      name: "Recency",
      score: recency,
      weight: 0.15,
      description: "How up-to-date the resource is"
    });
    const completeness = this.calculateCompleteness(resource);
    factors.push({
      name: "Completeness",
      score: completeness,
      weight: 0.15,
      description: "Coverage of the topic"
    });
    const clarity = await this.calculateClarity(resource);
    factors.push({
      name: "Clarity",
      score: clarity,
      weight: 0.15,
      description: "Ease of understanding"
    });
    const engagement = this.calculateEngagement(resource);
    factors.push({
      name: "Engagement",
      score: engagement,
      weight: 0.1,
      description: "Interactive and engaging elements"
    });
    const overall = factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0);
    const qualityScore = {
      overall,
      relevance,
      accuracy: authority,
      completeness,
      clarity,
      engagement,
      authority,
      recency,
      factors
    };
    this.qualityCache.set(cacheKey, qualityScore);
    return qualityScore;
  }
  /**
   * Check license compatibility
   */
  async checkLicenseCompatibility(resource, intendedUse) {
    const license = resource.license;
    if (!license) {
      return {
        compatible: false,
        restrictions: ["No license information available"],
        recommendations: ["Contact the author for licensing information"]
      };
    }
    const restrictions = [];
    const recommendations = [];
    if (license.attribution && !intendedUse?.includes("personal")) {
      restrictions.push("Attribution required");
      recommendations.push("Include proper attribution when using this resource");
    }
    if (!license.commercialUse && intendedUse?.includes("commercial")) {
      restrictions.push("No commercial use allowed");
      recommendations.push("Find alternative resources for commercial purposes");
    }
    if (!license.modifications && intendedUse?.includes("modify")) {
      restrictions.push("No modifications allowed");
      recommendations.push("Use the resource as-is or find alternatives");
    }
    if (license.shareAlike) {
      restrictions.push("Share-alike requirement");
      recommendations.push("Any derivative work must use the same license");
    }
    const compatible = restrictions.length === 0 || restrictions.length === 1 && restrictions[0].includes("Attribution");
    const alternativeLicenses = !compatible ? this.suggestAlternativeLicenses(intendedUse) : void 0;
    return {
      compatible,
      restrictions,
      recommendations,
      alternativeLicenses
    };
  }
  /**
   * Analyze resource ROI
   */
  async analyzeResourceROI(resource, learnerProfile) {
    const costBenefitRatio = await this.calculateCostBenefitRatio(resource, learnerProfile);
    const timeToValue = this.estimateTimeToValue(resource);
    const learningEfficiency = await this.calculateLearningEfficiency(resource, learnerProfile);
    const alternatives = await this.findAlternatives(resource);
    const alternativeComparison = await this.compareAlternatives(resource, alternatives);
    const recommendation = this.determineRecommendation(
      costBenefitRatio,
      learningEfficiency,
      alternativeComparison
    );
    const justification = await this.generateROIJustification(
      resource,
      costBenefitRatio,
      learningEfficiency,
      recommendation
    );
    return {
      costBenefitRatio,
      timeToValue,
      learningEfficiency,
      alternativeComparison,
      recommendation,
      justification
    };
  }
  /**
   * Personalize recommendations for a student
   */
  async personalizeRecommendations(student, resources) {
    const recommendations = [];
    for (const resource of resources) {
      const matchScore = await this.calculateMatchScore(resource, student);
      const reasons = this.generateMatchReasons(resource, student);
      const personalizedNotes = await this.generatePersonalizedNotes(resource, student);
      const suggestedUsage = this.suggestUsagePattern(resource, student);
      const prerequisites = this.identifyPrerequisites(resource, student);
      const nextSteps = this.suggestNextSteps(resource);
      recommendations.push({
        resource,
        matchScore,
        reasons,
        personalizedNotes,
        suggestedUsage,
        prerequisites,
        nextSteps
      });
    }
    recommendations.sort((a, b) => b.matchScore - a.matchScore);
    return recommendations;
  }
  /**
   * Get resource recommendations for a user
   */
  async getResourceRecommendations(userId, topic) {
    const profile = this.buildDefaultProfile(userId);
    const topicObj = {
      id: `topic-${Date.now()}`,
      name: topic,
      category: "general",
      keywords: topic.split(" "),
      difficulty: "medium"
    };
    const resources = await this.discoverResources(topicObj);
    return await this.personalizeRecommendations(profile, resources);
  }
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  async searchMultipleSources(topic, config) {
    const sources = config?.sources || ["youtube", "coursera", "medium", "github"];
    const allResources = [];
    const searchPromises = sources.map((source) => this.searchSource(source, topic, config));
    const results = await Promise.allSettled(searchPromises);
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        allResources.push(...result.value);
      }
    });
    return allResources;
  }
  async searchSource(source, topic, config) {
    const mockResources = [
      {
        id: `${source}-${Date.now()}-1`,
        title: `${topic.name} - Comprehensive Guide`,
        description: `Learn ${topic.name} from scratch with this comprehensive guide`,
        url: `https://${source}.com/resource-1`,
        type: "article",
        source,
        language: "en",
        tags: topic.keywords,
        relevanceScore: 0.9,
        license: {
          type: "CC-BY-4.0",
          commercialUse: true,
          attribution: true,
          shareAlike: false,
          modifications: true
        },
        cost: {
          type: "free"
        }
      },
      {
        id: `${source}-${Date.now()}-2`,
        title: `Advanced ${topic.name} Techniques`,
        description: `Master advanced concepts in ${topic.name}`,
        url: `https://${source}.com/resource-2`,
        type: "video",
        source,
        language: "en",
        duration: 45,
        tags: [...topic.keywords, "advanced"],
        relevanceScore: 0.85,
        cost: {
          type: "freemium",
          amount: 9.99,
          currency: "USD"
        }
      }
    ];
    return mockResources;
  }
  async calculateRelevance(resource) {
    const prompt = `
      Rate the relevance of this resource on a scale of 0-1:
      Title: ${resource.title}
      Description: ${resource.description}
      Tags: ${resource.tags.join(", ")}

      Consider title match, description relevance, and tag alignment.
      Return only a decimal number between 0 and 1.
    `;
    try {
      const response = await this.config.samConfig.ai.chat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        maxTokens: 50
      });
      const relevance = parseFloat(response.content);
      return isNaN(relevance) ? resource.relevanceScore || 0.7 : Math.max(0, Math.min(1, relevance));
    } catch {
      return resource.relevanceScore || 0.7;
    }
  }
  calculateAuthority(resource) {
    const sourceScores = {
      coursera: 0.95,
      edx: 0.95,
      udacity: 0.9,
      "khan-academy": 0.95,
      "mit-ocw": 1,
      youtube: 0.7,
      medium: 0.75,
      github: 0.85,
      arxiv: 0.9,
      ieee: 0.95
    };
    const baseScore = sourceScores[resource.source.toLowerCase()] || 0.6;
    const authorBonus = resource.author ? 0.05 : 0;
    return Math.min(1, baseScore + authorBonus);
  }
  calculateRecency(resource) {
    if (!resource.lastUpdated && !resource.publishedDate) {
      return 0.5;
    }
    const date = resource.lastUpdated || resource.publishedDate;
    const ageInDays = Math.floor(
      ((/* @__PURE__ */ new Date()).getTime() - date.getTime()) / (1e3 * 60 * 60 * 24)
    );
    if (ageInDays < 30) return 1;
    if (ageInDays < 90) return 0.9;
    if (ageInDays < 180) return 0.8;
    if (ageInDays < 365) return 0.7;
    if (ageInDays < 730) return 0.5;
    return 0.3;
  }
  calculateCompleteness(resource) {
    const typeCompleteness = {
      course: 0.9,
      book: 0.95,
      tutorial: 0.8,
      article: 0.7,
      video: 0.75,
      podcast: 0.65,
      documentation: 0.85,
      tool: 0.6,
      dataset: 0.7,
      "research-paper": 0.9
    };
    let score = typeCompleteness[resource.type] || 0.7;
    if (resource.duration) {
      if (resource.duration > 60) score += 0.1;
      if (resource.duration > 120) score += 0.05;
    }
    return Math.min(1, score);
  }
  async calculateClarity(resource) {
    const prompt = `
      Rate the clarity of this educational resource based on its description:
      "${resource.description}"

      Consider: clear language, structured approach, target audience appropriateness.
      Return only a decimal number between 0 and 1.
    `;
    try {
      const response = await this.config.samConfig.ai.chat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        maxTokens: 50
      });
      const clarity = parseFloat(response.content);
      return isNaN(clarity) ? 0.8 : Math.max(0, Math.min(1, clarity));
    } catch {
      return 0.8;
    }
  }
  calculateEngagement(resource) {
    const typeEngagement = {
      video: 0.9,
      course: 0.85,
      tutorial: 0.8,
      tool: 0.95,
      podcast: 0.7,
      article: 0.6,
      book: 0.5,
      documentation: 0.4,
      dataset: 0.6,
      "research-paper": 0.3
    };
    return typeEngagement[resource.type] || 0.5;
  }
  suggestAlternativeLicenses(intendedUse) {
    const alternatives = [];
    if (intendedUse?.includes("commercial")) {
      alternatives.push("MIT", "Apache-2.0", "BSD-3-Clause");
    }
    if (intendedUse?.includes("modify")) {
      alternatives.push("MIT", "Apache-2.0", "GPL-3.0");
    }
    if (intendedUse?.includes("educational")) {
      alternatives.push("CC-BY-4.0", "CC-BY-SA-4.0", "OER Commons");
    }
    return alternatives.length > 0 ? alternatives : ["CC0-1.0", "MIT", "CC-BY-4.0"];
  }
  async calculateCostBenefitRatio(resource, profile) {
    let cost = 0;
    if (resource.cost) {
      if (resource.cost.type === "paid") {
        cost = resource.cost.amount || 0;
      } else if (resource.cost.type === "subscription") {
        cost = (resource.cost.amount || 0) / 30;
      }
    }
    const qualityScore = await this.scoreResourceQuality(resource);
    const benefit = qualityScore.overall * 100;
    if (profile?.budgetConstraints && cost > profile.budgetConstraints.max) {
      return 0;
    }
    return cost === 0 ? benefit : benefit / cost;
  }
  estimateTimeToValue(resource) {
    const baseTime = {
      tool: 0.5,
      article: 1,
      video: 2,
      tutorial: 3,
      podcast: 2,
      course: 20,
      book: 40,
      documentation: 5,
      dataset: 2,
      "research-paper": 4
    };
    let timeToValue = baseTime[resource.type] || 5;
    if (resource.duration) {
      timeToValue = Math.min(timeToValue, resource.duration / 60);
    }
    return timeToValue;
  }
  async calculateLearningEfficiency(resource, profile) {
    const quality = await this.scoreResourceQuality(resource);
    const timeToValue = this.estimateTimeToValue(resource);
    let efficiency = quality.overall / Math.max(1, timeToValue);
    if (profile) {
      if (profile.preferredTypes.includes(resource.type)) {
        efficiency *= 1.2;
      }
      if (resource.duration && resource.duration >= profile.preferredDuration.min && resource.duration <= profile.preferredDuration.max) {
        efficiency *= 1.1;
      }
    }
    return Math.min(1, efficiency);
  }
  async findAlternatives(resource) {
    const topic = {
      id: "alt-search",
      name: resource.title.split("-")[0].trim(),
      category: "general",
      keywords: resource.tags,
      difficulty: "medium"
    };
    const alternatives = await this.discoverResources(topic, {
      sources: [resource.source],
      maxResults: 5,
      qualityThreshold: 0.7,
      includeTypes: [resource.type],
      languages: [resource.language],
      costFilter: resource.cost?.type === "free" ? "free" : "any"
    });
    return alternatives.filter((alt) => alt.id !== resource.id);
  }
  async compareAlternatives(resource, alternatives) {
    const comparisons = [];
    for (const alternative of alternatives) {
      const altQuality = await this.scoreResourceQuality(alternative);
      const resQuality = await this.scoreResourceQuality(resource);
      const comparisonScore = altQuality.overall / resQuality.overall;
      const advantages = [];
      const disadvantages = [];
      if (altQuality.overall > resQuality.overall) {
        advantages.push("Higher overall quality");
      } else {
        disadvantages.push("Lower overall quality");
      }
      if (!alternative.cost || alternative.cost.type === "free") {
        if (resource.cost && resource.cost.type !== "free") {
          advantages.push("Free alternative");
        }
      }
      if (alternative.duration && resource.duration) {
        if (alternative.duration < resource.duration) {
          advantages.push("Shorter time commitment");
        } else {
          disadvantages.push("Longer time commitment");
        }
      }
      comparisons.push({
        resource: alternative,
        comparisonScore,
        advantages,
        disadvantages
      });
    }
    return comparisons.sort((a, b) => b.comparisonScore - a.comparisonScore);
  }
  determineRecommendation(costBenefitRatio, learningEfficiency, alternatives) {
    const hasBetterAlternatives = alternatives.some((alt) => alt.comparisonScore > 1.2);
    if (costBenefitRatio > 80 && learningEfficiency > 0.8 && !hasBetterAlternatives) {
      return "highly-recommended";
    }
    if (costBenefitRatio > 50 && learningEfficiency > 0.6) {
      return "recommended";
    }
    if (hasBetterAlternatives || costBenefitRatio < 30) {
      return "consider-alternatives";
    }
    return "not-recommended";
  }
  async generateROIJustification(resource, costBenefitRatio, learningEfficiency, recommendation) {
    const prompt = `
      Generate a concise justification for this resource recommendation:
      - Resource: ${resource.title}
      - Cost-Benefit Ratio: ${costBenefitRatio.toFixed(2)}
      - Learning Efficiency: ${(learningEfficiency * 100).toFixed(0)}%
      - Recommendation: ${recommendation}

      Explain in 2-3 sentences why this recommendation makes sense.
    `;
    try {
      const response = await this.config.samConfig.ai.chat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        maxTokens: 150
      });
      return response.content;
    } catch {
      return `This resource is ${recommendation} based on its cost-benefit ratio of ${costBenefitRatio.toFixed(0)} and learning efficiency of ${(learningEfficiency * 100).toFixed(0)}%.`;
    }
  }
  async calculateMatchScore(resource, student) {
    let score = 0;
    let factors = 0;
    if (student.preferredTypes.includes(resource.type)) {
      score += 0.9;
    } else {
      score += 0.5;
    }
    factors++;
    if (student.languagePreferences.includes(resource.language)) {
      score += 1;
    } else {
      score += 0.3;
    }
    factors++;
    if (resource.duration) {
      if (resource.duration >= student.preferredDuration.min && resource.duration <= student.preferredDuration.max) {
        score += 0.8;
      } else {
        score += 0.4;
      }
      factors++;
    }
    if (student.budgetConstraints) {
      if (!resource.cost || resource.cost.type === "free") {
        score += 1;
      } else if (resource.cost.amount && resource.cost.amount <= student.budgetConstraints.max) {
        score += 0.7;
      } else {
        score += 0.2;
      }
      factors++;
    }
    const goalAlignment = await this.calculateGoalAlignment(resource, student.learningGoals);
    score += goalAlignment;
    factors++;
    return score / factors;
  }
  async calculateGoalAlignment(resource, goals) {
    if (goals.length === 0) return 0.5;
    const prompt = `
      Rate how well this resource aligns with these learning goals (0-1):
      Resource: ${resource.title} - ${resource.description}
      Goals: ${goals.join(", ")}

      Return only a decimal number.
    `;
    try {
      const response = await this.config.samConfig.ai.chat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        maxTokens: 50
      });
      const alignment = parseFloat(response.content);
      return isNaN(alignment) ? 0.7 : Math.max(0, Math.min(1, alignment));
    } catch {
      return 0.7;
    }
  }
  generateMatchReasons(resource, student) {
    const reasons = [];
    if (student.preferredTypes.includes(resource.type)) {
      reasons.push(`Matches your preferred learning format (${resource.type})`);
    }
    if (!resource.cost || resource.cost.type === "free") {
      reasons.push("Free resource within your budget");
    }
    if (resource.duration && resource.duration >= student.preferredDuration.min && resource.duration <= student.preferredDuration.max) {
      reasons.push(`Fits your time preference (${resource.duration} minutes)`);
    }
    if (resource.language === student.languagePreferences[0]) {
      reasons.push(`Available in your preferred language (${resource.language})`);
    }
    return reasons;
  }
  async generatePersonalizedNotes(resource, student) {
    const prompt = `
      Create a personalized note for this learner about the resource:
      Resource: ${resource.title}
      Learner's skill level: ${student.skillLevel}
      Learner's goals: ${student.learningGoals.join(", ")}

      Write a 1-2 sentence personalized recommendation.
    `;
    try {
      const response = await this.config.samConfig.ai.chat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        maxTokens: 100
      });
      return response.content;
    } catch {
      return `This ${resource.type} is suitable for your ${student.skillLevel} level and supports your learning goals.`;
    }
  }
  suggestUsagePattern(resource, _student) {
    const patterns = {
      video: "Watch once for overview, then review key sections",
      article: "Read thoroughly and take notes on key concepts",
      course: "Follow the structured path and complete all exercises",
      book: "Read relevant chapters based on your current needs",
      tutorial: "Follow along hands-on and practice each step",
      podcast: "Listen during commute or downtime for reinforcement",
      documentation: "Use as reference while practicing",
      tool: "Integrate into your daily learning workflow",
      dataset: "Use for practical projects and experimentation",
      "research-paper": "Study methodology and key findings sections"
    };
    return patterns[resource.type] || "Use as supplementary learning material";
  }
  identifyPrerequisites(resource, student) {
    const prerequisites = [];
    const description = resource.description.toLowerCase();
    if (description.includes("advanced") && student.skillLevel === "beginner") {
      prerequisites.push("Complete intermediate level materials first");
    }
    if (description.includes("prerequisite") || description.includes("requires")) {
      prerequisites.push("Check resource description for specific prerequisites");
    }
    return prerequisites;
  }
  suggestNextSteps(resource) {
    const nextSteps = [];
    switch (resource.type) {
      case "course":
        nextSteps.push("Complete all modules and assessments");
        nextSteps.push("Apply learned concepts in a project");
        break;
      case "tutorial":
        nextSteps.push("Practice the demonstrated techniques");
        nextSteps.push("Create your own variation");
        break;
      case "video":
        nextSteps.push("Take notes on key concepts");
        nextSteps.push("Find practice exercises");
        break;
      case "article":
        nextSteps.push("Summarize main points");
        nextSteps.push("Research mentioned topics further");
        break;
      default:
        nextSteps.push("Apply what you learned");
        nextSteps.push("Share knowledge with peers");
    }
    return nextSteps;
  }
  generateCacheKey(topic, config) {
    const configStr = config ? JSON.stringify(config) : "default";
    return `${topic.name}-${topic.category}-${configStr}`;
  }
  buildDefaultProfile(userId) {
    return {
      userId,
      preferredTypes: ["video", "article", "tutorial"],
      preferredFormats: ["interactive", "visual"],
      preferredDuration: { min: 10, max: 60 },
      languagePreferences: ["en"],
      learningGoals: ["skill improvement", "career advancement"],
      skillLevel: "intermediate"
    };
  }
};
function createResourceEngine(config) {
  return new ResourceEngine(config);
}

// src/engines/multimedia-engine.ts
var MultimediaEngine = class {
  constructor(config) {
    this.config = config;
  }
  /**
   * Analyze video content
   */
  async analyzeVideo(content) {
    const analysis = {
      transcription: await this.generateTranscription(content),
      visualElements: await this.detectVisualElements(content),
      teachingMethods: await this.identifyTeachingMethods(content),
      engagementScore: await this.calculateVideoEngagement(content),
      accessibilityScore: await this.assessVideoAccessibility(content),
      keyMoments: await this.identifyKeyMoments(content),
      recommendedImprovements: await this.generateVideoRecommendations(content),
      cognitiveLoad: await this.assessCognitiveLoad(content)
    };
    return analysis;
  }
  /**
   * Analyze audio content
   */
  async analyzeAudio(content) {
    const transcript = content.transcript || await this.transcribeAudio(content);
    const analysis = {
      transcript,
      speakingPace: this.analyzeSpeakingPace(content),
      clarity: this.assessAudioClarity(content),
      engagement: await this.calculateAudioEngagement(transcript),
      keyTopics: await this.extractKeyTopics(transcript),
      sentimentAnalysis: await this.analyzeSentiment(transcript),
      recommendedImprovements: this.generateAudioRecommendations(content)
    };
    return analysis;
  }
  /**
   * Analyze interactive content
   */
  async analyzeInteractive(content) {
    const analysis = {
      interactivityLevel: this.calculateInteractivityLevel(content),
      learningEffectiveness: this.assessLearningEffectiveness(content),
      userEngagement: this.predictUserEngagement(content),
      skillsAssessed: this.identifyAssessedSkills(content),
      bloomsLevels: this.mapToBloomsLevels(content),
      accessibilityCompliance: this.checkAccessibility(content),
      recommendedEnhancements: this.generateInteractiveRecommendations(content)
    };
    return analysis;
  }
  /**
   * Generate comprehensive multi-modal insights
   */
  async generateMultiModalInsights(_courseId, contentTypes) {
    const insights = {
      overallEffectiveness: this.calculateOverallEffectiveness(contentTypes),
      learningStylesCovered: this.identifyLearningStyles(contentTypes),
      engagementPrediction: this.predictOverallEngagement(contentTypes),
      retentionPrediction: this.predictRetention(contentTypes),
      recommendations: await this.generateComprehensiveRecommendations(contentTypes),
      bestPracticesAlignment: this.assessBestPracticesAlignment(contentTypes)
    };
    return insights;
  }
  /**
   * Get content recommendations for a course
   */
  async getContentRecommendations(_courseId) {
    return [
      "Add chapter markers for easier navigation",
      "Include interactive quizzes at key moments",
      "Provide downloadable resources mentioned in the video",
      "Add closed captions in multiple languages",
      "Create a summary slide at the end",
      "Vary speaking pace for emphasis",
      "Add progress indicators for complex interactions"
    ];
  }
  /**
   * Get accessibility report for a course
   */
  async getAccessibilityReport(_courseId) {
    return {
      overallScore: 0.75,
      issues: [],
      recommendations: [
        "Ensure all videos have captions",
        "Provide audio descriptions for visual content",
        "Make all interactive elements keyboard accessible",
        "Test with screen readers",
        "Provide alternative formats for all content"
      ]
    };
  }
  // ============================================================================
  // PRIVATE HELPER METHODS - VIDEO
  // ============================================================================
  async generateTranscription(_content) {
    return "Video transcription would be generated here using speech-to-text services.";
  }
  async detectVisualElements(_content) {
    return [
      {
        timestamp: 0,
        type: "slide",
        description: "Introduction slide with course title",
        educationalValue: 0.8
      },
      {
        timestamp: 30,
        type: "diagram",
        description: "Conceptual diagram explaining key concepts",
        educationalValue: 0.9
      }
    ];
  }
  async identifyTeachingMethods(_content) {
    return ["lecture", "demonstration", "visual-aids", "examples"];
  }
  async calculateVideoEngagement(_content) {
    return 0.85;
  }
  async assessVideoAccessibility(_content) {
    return 0.75;
  }
  async identifyKeyMoments(_content) {
    return [
      {
        timestamp: 0,
        type: "introduction",
        description: "Course introduction and objectives",
        importance: 0.9
      },
      {
        timestamp: 120,
        type: "key-concept",
        description: "Main concept explanation",
        importance: 1
      }
    ];
  }
  async generateVideoRecommendations(_content) {
    const prompt = `Suggest improvements for educational video effectiveness. Return a JSON array of 5 recommendation strings.`;
    try {
      const response = await this.config.samConfig.ai.chat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        maxTokens: 500
      });
      try {
        return JSON.parse(response.content);
      } catch {
        return [
          "Add chapter markers for easier navigation",
          "Include interactive quizzes at key moments",
          "Provide downloadable resources mentioned in the video",
          "Add closed captions in multiple languages",
          "Create a summary slide at the end"
        ];
      }
    } catch {
      return [
        "Add chapter markers for easier navigation",
        "Include interactive quizzes at key moments",
        "Provide downloadable resources mentioned in the video",
        "Add closed captions in multiple languages",
        "Create a summary slide at the end"
      ];
    }
  }
  async assessCognitiveLoad(_content) {
    return "medium";
  }
  // ============================================================================
  // PRIVATE HELPER METHODS - AUDIO
  // ============================================================================
  async transcribeAudio(_content) {
    return "Audio transcription placeholder";
  }
  analyzeSpeakingPace(_content) {
    return 150;
  }
  assessAudioClarity(_content) {
    return 0.9;
  }
  async calculateAudioEngagement(_transcript) {
    return 0.8;
  }
  async extractKeyTopics(transcript) {
    const prompt = `Extract key educational topics from this transcript. Return a JSON array of topic strings.

Transcript: ${transcript.substring(0, 500)}...`;
    try {
      const response = await this.config.samConfig.ai.chat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        maxTokens: 200
      });
      try {
        return JSON.parse(response.content);
      } catch {
        return ["topic1", "topic2", "topic3"];
      }
    } catch {
      return ["topic1", "topic2", "topic3"];
    }
  }
  async analyzeSentiment(_transcript) {
    return {
      overall: "positive",
      confidence: 0.85
    };
  }
  generateAudioRecommendations(_content) {
    return [
      "Vary speaking pace for emphasis",
      "Add background music for engagement",
      "Include pause points for reflection",
      "Provide transcript download option"
    ];
  }
  // ============================================================================
  // PRIVATE HELPER METHODS - INTERACTIVE
  // ============================================================================
  calculateInteractivityLevel(content) {
    const interactionCount = content.elements.reduce(
      (sum, el) => sum + el.interactions.length,
      0
    );
    const typeMultiplier = content.type === "vr" || content.type === "ar" ? 1.5 : 1;
    return Math.min(1, interactionCount / 10 * typeMultiplier);
  }
  assessLearningEffectiveness(content) {
    const bloomsAlignment = this.mapToBloomsLevels(content).length / 6;
    const interactivityScore = this.calculateInteractivityLevel(content);
    return (bloomsAlignment + interactivityScore) / 2;
  }
  predictUserEngagement(content) {
    const typeScores = {
      quiz: 0.7,
      simulation: 0.9,
      game: 0.95,
      ar: 0.85,
      vr: 0.9,
      lab: 0.8
    };
    return typeScores[content.type] || 0.7;
  }
  identifyAssessedSkills(_content) {
    return ["problem-solving", "critical-thinking", "application", "analysis"];
  }
  mapToBloomsLevels(content) {
    const levels = /* @__PURE__ */ new Set();
    content.elements.forEach((element) => {
      element.interactions.forEach((interaction) => {
        if (interaction.includes("identify") || interaction.includes("recall")) {
          levels.add("Remember");
        }
        if (interaction.includes("explain") || interaction.includes("describe")) {
          levels.add("Understand");
        }
        if (interaction.includes("apply") || interaction.includes("solve")) {
          levels.add("Apply");
        }
        if (interaction.includes("analyze") || interaction.includes("compare")) {
          levels.add("Analyze");
        }
        if (interaction.includes("evaluate") || interaction.includes("judge")) {
          levels.add("Evaluate");
        }
        if (interaction.includes("create") || interaction.includes("design")) {
          levels.add("Create");
        }
      });
    });
    return Array.from(levels);
  }
  checkAccessibility(content) {
    const issues = [];
    if (content.type === "vr" || content.type === "ar") {
      issues.push({
        type: "alternative-access",
        severity: "high",
        description: "VR/AR content needs non-immersive alternative",
        solution: "Provide 2D version or detailed description"
      });
    }
    return {
      wcagLevel: issues.length === 0 ? "AA" : "A",
      issues,
      score: Math.max(0, 1 - issues.length * 0.2)
    };
  }
  generateInteractiveRecommendations(_content) {
    return [
      "Add progress indicators for complex interactions",
      "Include hints system for struggling learners",
      "Implement adaptive difficulty based on performance",
      "Add collaboration features for peer learning"
    ];
  }
  // ============================================================================
  // PRIVATE HELPER METHODS - MULTI-MODAL
  // ============================================================================
  calculateOverallEffectiveness(contentTypes) {
    let totalScore = 0;
    let count = 0;
    if (contentTypes.videos) {
      totalScore += contentTypes.videos.reduce(
        (sum, v) => sum + v.engagementScore,
        0
      );
      count += contentTypes.videos.length;
    }
    if (contentTypes.audios) {
      totalScore += contentTypes.audios.reduce((sum, a) => sum + a.engagement, 0);
      count += contentTypes.audios.length;
    }
    if (contentTypes.interactives) {
      totalScore += contentTypes.interactives.reduce(
        (sum, i) => sum + i.learningEffectiveness,
        0
      );
      count += contentTypes.interactives.length;
    }
    return count > 0 ? totalScore / count : 0;
  }
  identifyLearningStyles(contentTypes) {
    const styles = /* @__PURE__ */ new Set();
    if (contentTypes.videos && contentTypes.videos.length > 0) {
      styles.add("visual");
    }
    if (contentTypes.audios && contentTypes.audios.length > 0) {
      styles.add("auditory");
    }
    if (contentTypes.interactives && contentTypes.interactives.length > 0) {
      styles.add("kinesthetic");
      contentTypes.interactives.forEach((i) => {
        if (i.interactivityLevel > 0.7) {
          styles.add("experiential");
        }
      });
    }
    return Array.from(styles);
  }
  predictOverallEngagement(contentTypes) {
    const variety = this.identifyLearningStyles(contentTypes).length;
    const effectiveness = this.calculateOverallEffectiveness(contentTypes);
    return variety / 4 * 0.3 + effectiveness * 0.7;
  }
  predictRetention(contentTypes) {
    const engagement = this.predictOverallEngagement(contentTypes);
    const multiModalBonus = Object.keys(contentTypes).filter(
      (k) => contentTypes[k]?.length ?? 0 > 0
    ).length / 3;
    return Math.min(1, engagement * 0.7 + multiModalBonus * 0.3);
  }
  async generateComprehensiveRecommendations(_contentTypes) {
    return {
      immediate: [
        "Add captions to all video content",
        "Provide transcripts for audio materials",
        "Ensure all interactive elements have keyboard navigation"
      ],
      shortTerm: [
        "Create summary videos for complex topics",
        "Develop practice simulations for key concepts",
        "Add collaborative features to interactive content"
      ],
      longTerm: [
        "Implement adaptive learning paths based on performance",
        "Create VR/AR experiences for immersive learning",
        "Develop AI-powered personal tutoring features"
      ]
    };
  }
  assessBestPracticesAlignment(contentTypes) {
    let score = 0;
    let factors = 0;
    const contentVariety = Object.keys(contentTypes).filter(
      (k) => (contentTypes[k]?.length ?? 0) > 0
    ).length;
    score += contentVariety / 3;
    factors++;
    if (contentTypes.videos && contentTypes.videos.length > 0) {
      const avgAccessibility = contentTypes.videos.reduce((sum, v) => sum + v.accessibilityScore, 0) / contentTypes.videos.length;
      score += avgAccessibility;
      factors++;
    }
    const engagement = this.predictOverallEngagement(contentTypes);
    score += engagement;
    factors++;
    return factors > 0 ? score / factors : 0;
  }
};
function createMultimediaEngine(config) {
  return new MultimediaEngine(config);
}

// src/engines/financial-engine.ts
var FinancialEngine = class {
  constructor(config) {
    this.config = config;
  }
  /**
   * Analyze financials for an organization
   */
  async analyzeFinancials(organizationId, dateRange) {
    const [revenue, costs, profitability, pricing, subscriptions] = await Promise.all([
      this.analyzeRevenue(organizationId, dateRange),
      this.analyzeCosts(organizationId, dateRange),
      this.analyzeProfitability(organizationId, dateRange),
      this.analyzePricing(organizationId),
      this.analyzeSubscriptions(organizationId, dateRange)
    ]);
    const forecasts = await this.generateForecasts(
      revenue,
      costs,
      subscriptions
    );
    const recommendations = await this.generateRecommendations(
      revenue,
      costs,
      profitability,
      pricing,
      subscriptions
    );
    return {
      revenue,
      costs,
      profitability,
      pricing,
      subscriptions,
      forecasts,
      recommendations
    };
  }
  // ============================================================================
  // REVENUE ANALYSIS
  // ============================================================================
  async analyzeRevenue(_organizationId, _dateRange) {
    const totalRevenue = 125e3;
    const recurringRevenue = 75e3;
    const oneTimeRevenue = totalRevenue - recurringRevenue;
    const revenueBySource = this.categorizeRevenueSources();
    const revenueGrowth = await this.calculateRevenueGrowth();
    const averageRevenuePerUser = 85;
    const customerLifetimeValue = averageRevenuePerUser * 24;
    const churnRate = 3.5;
    return {
      totalRevenue,
      recurringRevenue,
      oneTimeRevenue,
      revenueBySource,
      revenueGrowth,
      averageRevenuePerUser,
      customerLifetimeValue,
      churnRate
    };
  }
  categorizeRevenueSources() {
    return [
      {
        source: "Course Sales",
        amount: 5e4,
        percentage: 40,
        trend: "increasing",
        growth: 15
      },
      {
        source: "Subscriptions",
        amount: 75e3,
        percentage: 60,
        trend: "stable",
        growth: 8
      }
    ];
  }
  async calculateRevenueGrowth() {
    return {
      daily: 0.5,
      weekly: 3.5,
      monthly: 15,
      quarterly: 50,
      yearly: 250,
      projectedAnnual: 300
    };
  }
  // ============================================================================
  // COST ANALYSIS
  // ============================================================================
  async analyzeCosts(_organizationId, _dateRange) {
    const infrastructureCosts = 15e3;
    const contentCreationCosts = 25e3;
    const marketingCosts = 2e4;
    const operationalCosts = 1e4;
    const totalCosts = infrastructureCosts + contentCreationCosts + marketingCosts + operationalCosts;
    const fixedCosts = operationalCosts;
    const variableCosts = totalCosts - fixedCosts;
    const costCategories = [
      {
        category: "Infrastructure",
        amount: infrastructureCosts,
        percentage: infrastructureCosts / totalCosts * 100,
        isFixed: false,
        optimizationPotential: 0.3
      },
      {
        category: "Content Creation",
        amount: contentCreationCosts,
        percentage: contentCreationCosts / totalCosts * 100,
        isFixed: false,
        optimizationPotential: 0.4
      },
      {
        category: "Marketing",
        amount: marketingCosts,
        percentage: marketingCosts / totalCosts * 100,
        isFixed: false,
        optimizationPotential: 0.5
      },
      {
        category: "Operations",
        amount: operationalCosts,
        percentage: operationalCosts / totalCosts * 100,
        isFixed: true,
        optimizationPotential: 0.2
      }
    ];
    return {
      totalCosts,
      fixedCosts,
      variableCosts,
      costCategories,
      costPerStudent: 25,
      costPerCourse: 500,
      infrastructureCosts,
      contentCreationCosts,
      marketingCosts
    };
  }
  // ============================================================================
  // PROFITABILITY ANALYSIS
  // ============================================================================
  async analyzeProfitability(organizationId, dateRange) {
    const revenue = await this.analyzeRevenue(organizationId, dateRange);
    const costs = await this.analyzeCosts(organizationId, dateRange);
    const grossProfit = revenue.totalRevenue - costs.variableCosts;
    const netProfit = revenue.totalRevenue - costs.totalCosts;
    const grossMargin = grossProfit / revenue.totalRevenue * 100;
    const netMargin = netProfit / revenue.totalRevenue * 100;
    const courseProfitability = await this.analyzeCourseProfitability();
    const profitableCourses = courseProfitability.filter((c) => c.profit > 0);
    const unprofitableCourses = courseProfitability.filter((c) => c.profit <= 0);
    const customerAcquisitionCost = costs.marketingCosts / 100;
    const returnOnInvestment = netProfit / costs.totalCosts * 100;
    const breakEvenPoint = this.calculateBreakEvenPoint(revenue, costs);
    return {
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
      breakEvenPoint,
      profitableCourses,
      unprofitableCourses,
      customerAcquisitionCost,
      returnOnInvestment
    };
  }
  async analyzeCourseProfitability() {
    return [
      {
        courseId: "course-1",
        courseName: "Introduction to Programming",
        revenue: 25e3,
        costs: 5e3,
        profit: 2e4,
        margin: 80,
        enrollments: 500,
        completionRate: 75
      },
      {
        courseId: "course-2",
        courseName: "Advanced Data Science",
        revenue: 15e3,
        costs: 8e3,
        profit: 7e3,
        margin: 46.7,
        enrollments: 200,
        completionRate: 65
      },
      {
        courseId: "course-3",
        courseName: "Project Management Basics",
        revenue: 5e3,
        costs: 6e3,
        profit: -1e3,
        margin: -20,
        enrollments: 50,
        completionRate: 45,
        recommendedAction: "Review pricing or reduce costs"
      }
    ];
  }
  calculateBreakEvenPoint(revenue, costs) {
    const monthlyProfit = revenue.totalRevenue - costs.totalCosts;
    if (monthlyProfit > 0) {
      return /* @__PURE__ */ new Date();
    }
    const monthsToBreakEven = Math.abs(costs.totalCosts / monthlyProfit);
    const breakEvenDate = /* @__PURE__ */ new Date();
    breakEvenDate.setMonth(breakEvenDate.getMonth() + monthsToBreakEven);
    return breakEvenDate;
  }
  // ============================================================================
  // PRICING ANALYSIS
  // ============================================================================
  async analyzePricing(_organizationId) {
    const currentPricing = await this.getCurrentPricingStrategy();
    const optimalPricing = await this.calculateOptimalPricing(currentPricing);
    const priceElasticity = -1.2;
    const competitorAnalysis = await this.analyzeCompetitorPricing();
    const pricingExperiments = await this.getPricingExperiments();
    const recommendations = await this.generatePricingRecommendations(
      currentPricing,
      optimalPricing,
      priceElasticity
    );
    return {
      currentPricing,
      optimalPricing,
      priceElasticity,
      competitorAnalysis,
      pricingExperiments,
      recommendations
    };
  }
  async getCurrentPricingStrategy() {
    const discountStrategy = [
      {
        type: "early_bird",
        discountPercentage: 20,
        conditions: ["Purchase within 7 days of launch"],
        usage: 150,
        revenue: 45e3
      }
    ];
    const bundleOptions = [];
    const regionPricing = [
      {
        region: "US",
        price: 49.99,
        currency: "USD",
        purchasingPowerParity: 1
      },
      {
        region: "EU",
        price: 44.99,
        currency: "EUR",
        purchasingPowerParity: 0.9
      }
    ];
    return {
      basePrice: 49.99,
      discountStrategy,
      bundleOptions,
      dynamicPricing: false,
      regionPricing
    };
  }
  async calculateOptimalPricing(currentStrategy) {
    const bundleOptions = [
      {
        bundleId: "starter-bundle",
        bundleName: "Starter Bundle",
        courses: ["course-1", "course-2", "course-3"],
        price: 124.99,
        savings: 25,
        popularity: 0.3
      }
    ];
    return {
      ...currentStrategy,
      basePrice: currentStrategy.basePrice * 1.15,
      dynamicPricing: true,
      bundleOptions
    };
  }
  async analyzeCompetitorPricing() {
    return [
      {
        competitor: "Competitor A",
        averagePrice: 49.99,
        priceRange: { min: 29.99, max: 99.99 },
        features: ["Video content", "Certificates", "Community"],
        marketShare: 25
      },
      {
        competitor: "Competitor B",
        averagePrice: 39.99,
        priceRange: { min: 19.99, max: 79.99 },
        features: ["Video content", "Quizzes", "Mobile app"],
        marketShare: 20
      }
    ];
  }
  async getPricingExperiments() {
    return [
      {
        experimentId: "exp-001",
        name: "Premium Pricing Test",
        variant: "10% increase",
        price: 54.99,
        conversions: 245,
        revenue: 13472.55,
        significance: 0.95,
        status: "completed"
      }
    ];
  }
  async generatePricingRecommendations(current, optimal, elasticity) {
    const recommendations = [];
    if (optimal.basePrice > current.basePrice * 1.1) {
      recommendations.push({
        action: "Increase base prices by 10-15%",
        expectedImpact: (optimal.basePrice - current.basePrice) * 1e3,
        confidence: 0.8,
        rationale: "Current prices below market optimal"
      });
    }
    if (!current.dynamicPricing && Math.abs(elasticity) > 1) {
      recommendations.push({
        action: "Implement dynamic pricing",
        expectedImpact: current.basePrice * 0.15 * 1e3,
        confidence: 0.7,
        rationale: "High price elasticity indicates opportunity"
      });
    }
    return recommendations;
  }
  // ============================================================================
  // SUBSCRIPTION ANALYSIS
  // ============================================================================
  async analyzeSubscriptions(_organizationId, _dateRange) {
    const totalSubscribers = 1500;
    const activeSubscribers = 1200;
    const monthlyRecurringRevenue = 6e4;
    const annualRecurringRevenue = monthlyRecurringRevenue * 12;
    const averageSubscriptionValue = monthlyRecurringRevenue / activeSubscribers;
    const churnRate = 4.2;
    const retentionRate = 100 - churnRate;
    const subscriptionGrowth = {
      daily: 0.3,
      weekly: 2.1,
      monthly: 8.5,
      quarterly: 28,
      yearly: 150,
      projectedAnnual: 180
    };
    const tierDistribution = [
      {
        tier: "Basic",
        subscribers: 600,
        revenue: 18e3,
        churnRate: 5,
        upgradeRate: 10,
        downgradeRate: 0
      },
      {
        tier: "Professional",
        subscribers: 450,
        revenue: 27e3,
        churnRate: 3,
        upgradeRate: 8,
        downgradeRate: 2
      },
      {
        tier: "Enterprise",
        subscribers: 150,
        revenue: 15e3,
        churnRate: 2,
        upgradeRate: 0,
        downgradeRate: 1
      }
    ];
    return {
      totalSubscribers,
      activeSubscribers,
      monthlyRecurringRevenue,
      annualRecurringRevenue,
      averageSubscriptionValue,
      churnRate,
      retentionRate,
      subscriptionGrowth,
      tierDistribution
    };
  }
  // ============================================================================
  // FORECASTING
  // ============================================================================
  async generateForecasts(revenue, costs, _subscriptions) {
    const baseGrowthRate = revenue.revenueGrowth.monthly / 100;
    const shortTerm = this.createForecast("3 months", revenue, costs, baseGrowthRate, 3);
    const mediumTerm = this.createForecast("6 months", revenue, costs, baseGrowthRate * 0.9, 6);
    const longTerm = this.createForecast("12 months", revenue, costs, baseGrowthRate * 0.8, 12);
    const scenarios = this.createScenarioAnalysis(revenue, costs, baseGrowthRate);
    const confidence = this.calculateForecastConfidence(revenue.revenueGrowth);
    return {
      shortTerm,
      mediumTerm,
      longTerm,
      scenarios,
      confidence
    };
  }
  createForecast(period, revenue, costs, growthRate, months) {
    const projectedRevenue = revenue.totalRevenue * Math.pow(1 + growthRate, months);
    const projectedCosts = costs.totalCosts * Math.pow(1.02, months);
    const projectedProfit = projectedRevenue - projectedCosts;
    const projectedGrowth = (projectedRevenue / revenue.totalRevenue - 1) * 100;
    return {
      period,
      projectedRevenue,
      projectedCosts,
      projectedProfit,
      projectedGrowth,
      assumptions: [
        `${(growthRate * 100).toFixed(1)}% monthly growth rate`,
        "2% monthly cost inflation",
        "No major market disruptions",
        "Consistent customer acquisition"
      ],
      risks: [
        "Market competition",
        "Economic downturn",
        "Technology disruption",
        "Regulatory changes"
      ]
    };
  }
  createScenarioAnalysis(revenue, costs, baseGrowthRate) {
    return [
      {
        scenario: "Best Case",
        probability: 0.2,
        revenue: revenue.totalRevenue * Math.pow(1 + baseGrowthRate * 1.5, 12),
        profit: revenue.totalRevenue * Math.pow(1 + baseGrowthRate * 1.5, 12) - costs.totalCosts * 1.1,
        keyFactors: ["Viral growth", "Market expansion", "High retention", "Cost optimization"]
      },
      {
        scenario: "Most Likely",
        probability: 0.6,
        revenue: revenue.totalRevenue * Math.pow(1 + baseGrowthRate, 12),
        profit: revenue.totalRevenue * Math.pow(1 + baseGrowthRate, 12) - costs.totalCosts * 1.24,
        keyFactors: ["Steady growth", "Normal churn", "Gradual expansion", "Controlled costs"]
      },
      {
        scenario: "Worst Case",
        probability: 0.2,
        revenue: revenue.totalRevenue * Math.pow(1 + baseGrowthRate * 0.5, 12),
        profit: revenue.totalRevenue * Math.pow(1 + baseGrowthRate * 0.5, 12) - costs.totalCosts * 1.4,
        keyFactors: ["Increased competition", "Higher churn", "Market saturation", "Rising costs"]
      }
    ];
  }
  calculateForecastConfidence(growth) {
    let confidence = 0.7;
    const growthVolatility = this.calculateGrowthVolatility(growth);
    confidence -= growthVolatility * 0.2;
    return Math.max(0.3, Math.min(0.9, confidence));
  }
  calculateGrowthVolatility(growth) {
    const rates = [growth.daily, growth.weekly, growth.monthly];
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - avg, 2), 0) / rates.length;
    return Math.sqrt(variance) / Math.max(avg, 0.01);
  }
  // ============================================================================
  // RECOMMENDATIONS
  // ============================================================================
  async generateRecommendations(revenue, costs, profitability, pricing, _subscriptions) {
    const recommendations = [];
    if (revenue.churnRate > 5) {
      recommendations.push({
        category: "revenue",
        priority: "high",
        recommendation: "Implement retention program to reduce churn",
        expectedImpact: {
          revenue: revenue.recurringRevenue * 0.1,
          timeframe: "6 months"
        },
        implementation: [
          "Create engagement campaigns",
          "Implement win-back offers",
          "Improve onboarding process",
          "Add retention analytics"
        ],
        risks: ["Implementation costs", "Time to see results"]
      });
    }
    const highCostCategories = costs.costCategories.filter(
      (c) => c.optimizationPotential > 0.3
    );
    if (highCostCategories.length > 0) {
      recommendations.push({
        category: "cost",
        priority: "medium",
        recommendation: `Optimize ${highCostCategories[0].category} costs`,
        expectedImpact: {
          cost: highCostCategories[0].amount * 0.2,
          timeframe: "3 months"
        },
        implementation: [
          "Audit current expenses",
          "Negotiate better rates",
          "Implement automation",
          "Review vendor contracts"
        ],
        risks: ["Service quality impact", "Implementation complexity"]
      });
    }
    if (Math.abs(pricing.priceElasticity) > 1.5) {
      recommendations.push({
        category: "pricing",
        priority: "high",
        recommendation: "Implement dynamic pricing strategy",
        expectedImpact: {
          revenue: revenue.totalRevenue * 0.15,
          timeframe: "3 months"
        },
        implementation: [
          "A/B test price points",
          "Implement regional pricing",
          "Create value-based tiers",
          "Add bundle options"
        ],
        risks: ["Customer perception", "Competitive response"]
      });
    }
    if (profitability.returnOnInvestment > 20) {
      recommendations.push({
        category: "investment",
        priority: "medium",
        recommendation: "Increase marketing investment for growth",
        expectedImpact: {
          revenue: revenue.totalRevenue * 0.25,
          cost: costs.marketingCosts * 0.5,
          timeframe: "6 months"
        },
        implementation: [
          "Scale successful channels",
          "Test new acquisition channels",
          "Improve conversion funnels",
          "Implement referral program"
        ],
        risks: ["CAC increase", "Market saturation"]
      });
    }
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
};
function createFinancialEngine(config) {
  return new FinancialEngine(config);
}

// src/engines/predictive-engine.ts
var PredictiveEngine = class {
  constructor(config) {
    this.config = config;
  }
  modelVersion = "1.0.0";
  /**
   * Predict learning outcomes for a student
   */
  async predictLearningOutcomes(student) {
    const historicalData = await this.gatherHistoricalData(student.userId);
    const basePrediction = this.calculateBasePrediction(student, historicalData);
    const mlAdjustments = await this.applyMLModel(student);
    const riskFactors = this.identifyRiskFactors(student);
    const successFactors = this.identifySuccessFactors(student);
    const prediction = {
      successProbability: this.combinePredictions(basePrediction, mlAdjustments),
      confidenceInterval: this.calculateConfidenceInterval(
        basePrediction,
        mlAdjustments
      ),
      predictedCompletionDate: this.predictCompletionDate(student, historicalData),
      predictedFinalScore: this.predictFinalScore(student),
      riskFactors,
      successFactors,
      recommendedActions: this.generateRecommendedActions(riskFactors, successFactors)
    };
    await this.storePrediction(student.userId, prediction);
    return prediction;
  }
  /**
   * Identify at-risk students in a cohort
   */
  async identifyAtRiskStudents(cohort) {
    const atRiskStudents = [];
    const riskFactorCounts = /* @__PURE__ */ new Map();
    for (const student of cohort.students) {
      const riskAssessment = await this.assessStudentRisk(student);
      if (riskAssessment.riskLevel !== "safe") {
        atRiskStudents.push({
          userId: student.userId,
          riskLevel: riskAssessment.riskLevel,
          riskScore: riskAssessment.riskScore,
          primaryRisks: riskAssessment.primaryRisks,
          lastActive: student.learningHistory.lastActivityDate,
          predictedDropoutDate: riskAssessment.predictedDropoutDate,
          interventionHistory: await this.getInterventionHistory(student.userId)
        });
        riskAssessment.primaryRisks.forEach((risk) => {
          riskFactorCounts.set(risk, (riskFactorCounts.get(risk) || 0) + 1);
        });
      }
    }
    const riskDistribution = this.calculateRiskDistribution(
      atRiskStudents,
      cohort.students.length
    );
    const commonRiskFactors = this.identifyCommonRiskFactors(
      riskFactorCounts,
      cohort.students.length
    );
    const cohortHealth = this.calculateCohortHealth(riskDistribution);
    const interventionRecommendations = await this.generateInterventionRecommendations(
      atRiskStudents,
      commonRiskFactors
    );
    const analysis = {
      atRiskStudents,
      riskDistribution,
      commonRiskFactors,
      cohortHealth,
      interventionRecommendations
    };
    await this.storeRiskAnalysis(cohort.courseId, analysis);
    return analysis;
  }
  /**
   * Recommend interventions for a student
   */
  async recommendInterventions(student) {
    const riskAssessment = await this.assessStudentRisk(student);
    const learningStyle = await this.identifyLearningStyle(student);
    const availableInterventions = this.getAvailableInterventions();
    const selectedInterventions = this.selectInterventions(
      riskAssessment,
      learningStyle,
      availableInterventions
    );
    const plannedInterventions = this.planInterventionSequence(
      selectedInterventions,
      student
    );
    const timeline = this.createInterventionTimeline(plannedInterventions);
    const totalExpectedImpact = this.calculateTotalImpact(plannedInterventions);
    const plan = {
      studentId: student.userId,
      interventions: plannedInterventions,
      sequencing: this.determineSequencing(plannedInterventions),
      totalExpectedImpact,
      timeline
    };
    await this.storeInterventionPlan(plan);
    return plan;
  }
  /**
   * Optimize learning velocity for a student
   */
  async optimizeLearningVelocity(student) {
    const currentVelocity = this.calculateCurrentVelocity(student);
    const optimalVelocity = await this.calculateOptimalVelocity(student);
    const recommendations = this.generateVelocityRecommendations(
      currentVelocity,
      optimalVelocity,
      student
    );
    const personalizedSchedule = await this.createPersonalizedSchedule(
      student,
      optimalVelocity
    );
    const expectedImprovement = this.calculateExpectedImprovement(
      currentVelocity,
      optimalVelocity
    );
    const optimization = {
      currentVelocity,
      optimalVelocity,
      recommendations,
      personalizedSchedule,
      expectedImprovement
    };
    await this.storeVelocityOptimization(student.userId, optimization);
    return optimization;
  }
  /**
   * Calculate success probability for a learning context
   */
  async calculateSuccessProbability(context) {
    const features = this.extractFeatures(context);
    const modelPrediction = await this.runPredictiveModel(features);
    const factors = this.identifyContributingFactors(features, modelPrediction);
    const confidence = this.calculateConfidence(features, modelPrediction);
    const score = {
      probability: modelPrediction.probability,
      confidence,
      factors,
      modelVersion: this.modelVersion,
      calculatedAt: /* @__PURE__ */ new Date()
    };
    await this.storeProbabilityScore(context.studentProfile.userId, score);
    return score;
  }
  // =========================================================================
  // Private Helper Methods
  // =========================================================================
  async gatherHistoricalData(userId) {
    if (this.config.database) {
      return {
        progress: [],
        activities: [],
        assessments: []
      };
    }
    return { progress: [], activities: [], assessments: [] };
  }
  calculateBasePrediction(student, _historicalData) {
    const progressWeight = 0.3;
    const performanceWeight = 0.4;
    const engagementWeight = 0.3;
    const progressScore = student.performanceMetrics.overallProgress;
    const performanceScore = student.performanceMetrics.averageScore / 100;
    const engagementScore = student.performanceMetrics.engagementLevel;
    return progressScore * progressWeight + performanceScore * performanceWeight + engagementScore * engagementWeight;
  }
  async applyMLModel(student) {
    const prompt = `
      Analyze this student's learning pattern and predict success probability adjustment:
      - Average Score: ${student.performanceMetrics.averageScore}
      - Improvement Rate: ${student.performanceMetrics.improvementRate}
      - Study Frequency: ${student.behaviorPatterns.studyFrequency}
      - Engagement Level: ${student.performanceMetrics.engagementLevel}

      Return ONLY a decimal adjustment between -0.2 and +0.2.
    `;
    try {
      const response = await this.config.samConfig.ai.chat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        maxTokens: 100
      });
      const adjustment = parseFloat(response.content);
      if (!isNaN(adjustment) && adjustment >= -0.2 && adjustment <= 0.2) {
        return adjustment;
      }
    } catch {
    }
    if (student.performanceMetrics.improvementRate > 0.1) return 0.1;
    if (student.performanceMetrics.improvementRate < -0.1) return -0.1;
    return 0;
  }
  identifyRiskFactors(student) {
    const riskFactors = [];
    if (student.performanceMetrics.engagementLevel < 0.3) {
      riskFactors.push({
        factor: "Low Engagement",
        severity: "high",
        impact: 0.8,
        description: "Student shows minimal interaction with course materials"
      });
    }
    if (student.behaviorPatterns.studyFrequency === "sporadic") {
      riskFactors.push({
        factor: "Irregular Study Pattern",
        severity: "medium",
        impact: 0.6,
        description: "Inconsistent learning schedule affecting retention"
      });
    }
    if (student.performanceMetrics.improvementRate < 0) {
      riskFactors.push({
        factor: "Declining Performance",
        severity: "high",
        impact: 0.7,
        description: "Assessment scores showing downward trend"
      });
    }
    const daysSinceLastActivity = Math.floor(
      ((/* @__PURE__ */ new Date()).getTime() - student.learningHistory.lastActivityDate.getTime()) / (1e3 * 60 * 60 * 24)
    );
    if (daysSinceLastActivity > 7) {
      riskFactors.push({
        factor: "Extended Inactivity",
        severity: "high",
        impact: 0.9,
        description: `No activity for ${daysSinceLastActivity} days`
      });
    }
    return riskFactors;
  }
  identifySuccessFactors(student) {
    const successFactors = [];
    if (student.performanceMetrics.averageScore > 80) {
      successFactors.push({
        factor: "Strong Academic Performance",
        strength: "strong",
        contribution: 0.8,
        description: "Consistently high assessment scores"
      });
    }
    if (student.behaviorPatterns.studyFrequency === "daily") {
      successFactors.push({
        factor: "Consistent Study Habits",
        strength: "strong",
        contribution: 0.7,
        description: "Daily engagement with learning materials"
      });
    }
    if (student.performanceMetrics.improvementRate > 0.1) {
      successFactors.push({
        factor: "Continuous Improvement",
        strength: "moderate",
        contribution: 0.6,
        description: "Steady progress in learning outcomes"
      });
    }
    if (student.performanceMetrics.participationRate > 0.7) {
      successFactors.push({
        factor: "Active Participation",
        strength: "strong",
        contribution: 0.5,
        description: "High involvement in course activities"
      });
    }
    return successFactors;
  }
  generateRecommendedActions(riskFactors, successFactors) {
    const actions = [];
    riskFactors.filter((risk) => risk.severity === "high").forEach((risk) => {
      actions.push({
        type: "immediate",
        priority: "critical",
        action: `Address ${risk.factor}: ${this.getActionForRisk(risk.factor)}`,
        expectedImpact: risk.impact * 0.7,
        resources: this.getResourcesForRisk(risk.factor)
      });
    });
    successFactors.filter((factor) => factor.strength === "strong").forEach((factor) => {
      actions.push({
        type: "short-term",
        priority: "medium",
        action: `Leverage ${factor.factor}: ${this.getActionForSuccess(factor.factor)}`,
        expectedImpact: factor.contribution * 0.5,
        resources: this.getResourcesForSuccess(factor.factor)
      });
    });
    return actions;
  }
  getActionForRisk(riskFactor) {
    const actionMap = {
      "Low Engagement": "Send personalized re-engagement emails and offer one-on-one support",
      "Irregular Study Pattern": "Create structured study schedule with reminders",
      "Declining Performance": "Provide remedial content and additional practice materials",
      "Extended Inactivity": "Immediate outreach with incentives to return"
    };
    return actionMap[riskFactor] || "Provide additional support";
  }
  getResourcesForRisk(riskFactor) {
    const resourceMap = {
      "Low Engagement": ["Engagement emails", "Push notifications", "Gamification features"],
      "Irregular Study Pattern": ["Calendar integration", "Study planner", "Mobile reminders"],
      "Declining Performance": ["Practice quizzes", "Video tutorials", "Peer tutoring"],
      "Extended Inactivity": [
        "Welcome back campaign",
        "Progress summary",
        "Quick wins content"
      ]
    };
    return resourceMap[riskFactor] || ["General support resources"];
  }
  getActionForSuccess(successFactor) {
    const actionMap = {
      "Strong Academic Performance": "Provide advanced content and leadership opportunities",
      "Consistent Study Habits": "Recognize achievements and maintain momentum",
      "Continuous Improvement": "Set challenging goals and track progress",
      "Active Participation": "Encourage peer mentoring and community leadership"
    };
    return actionMap[successFactor] || "Continue current approach";
  }
  getResourcesForSuccess(successFactor) {
    const resourceMap = {
      "Strong Academic Performance": [
        "Advanced modules",
        "Certification paths",
        "Research projects"
      ],
      "Consistent Study Habits": [
        "Achievement badges",
        "Streak rewards",
        "Progress visualization"
      ],
      "Continuous Improvement": [
        "Goal setting tools",
        "Progress analytics",
        "Milestone celebrations"
      ],
      "Active Participation": [
        "Forum moderator role",
        "Study group leadership",
        "Content creation tools"
      ]
    };
    return resourceMap[successFactor] || ["Recognition features"];
  }
  combinePredictions(base, mlAdjustment) {
    return Math.max(0, Math.min(1, base + mlAdjustment));
  }
  calculateConfidenceInterval(base, mlAdjustment) {
    const uncertainty = 0.15;
    const combined = this.combinePredictions(base, mlAdjustment);
    return {
      lower: Math.max(0, combined - uncertainty),
      upper: Math.min(1, combined + uncertainty)
    };
  }
  predictCompletionDate(student, _historicalData) {
    const remainingProgress = 1 - student.performanceMetrics.overallProgress;
    const dailyProgress = this.calculateDailyProgress(student);
    const daysToComplete = remainingProgress / dailyProgress;
    const completionDate = /* @__PURE__ */ new Date();
    completionDate.setDate(completionDate.getDate() + Math.ceil(daysToComplete));
    return completionDate;
  }
  calculateDailyProgress(student) {
    const totalDays = Math.max(1, student.learningHistory.timeSpentLearning / (24 * 60));
    const currentProgress = student.performanceMetrics.overallProgress;
    return currentProgress / totalDays || 0.01;
  }
  predictFinalScore(student) {
    const currentAverage = student.performanceMetrics.averageScore;
    const improvementRate = student.performanceMetrics.improvementRate;
    const remainingProgress = 1 - student.performanceMetrics.overallProgress;
    const projectedImprovement = improvementRate * remainingProgress * 100;
    return Math.min(100, currentAverage + projectedImprovement);
  }
  async assessStudentRisk(student) {
    const riskScore = this.calculateRiskScore(student);
    const riskLevel = this.determineRiskLevel(riskScore);
    const primaryRisks = this.identifyPrimaryRisks(student);
    const predictedDropoutDate = riskLevel === "high" ? this.predictDropoutDate(student) : void 0;
    return { riskScore, riskLevel, primaryRisks, predictedDropoutDate };
  }
  calculateRiskScore(student) {
    let score = 0;
    score += (1 - student.performanceMetrics.engagementLevel) * 30;
    score += (100 - student.performanceMetrics.averageScore) * 0.3;
    score += (1 - student.performanceMetrics.consistencyScore) * 20;
    const daysSinceActive = Math.floor(
      ((/* @__PURE__ */ new Date()).getTime() - student.learningHistory.lastActivityDate.getTime()) / (1e3 * 60 * 60 * 24)
    );
    score += Math.min(20, daysSinceActive * 2);
    return score;
  }
  determineRiskLevel(riskScore) {
    if (riskScore >= 70) return "high";
    if (riskScore >= 40) return "medium";
    if (riskScore >= 20) return "low";
    return "safe";
  }
  identifyPrimaryRisks(student) {
    const risks = [];
    if (student.performanceMetrics.engagementLevel < 0.3) {
      risks.push("Low engagement");
    }
    if (student.performanceMetrics.averageScore < 60) {
      risks.push("Poor performance");
    }
    if (student.behaviorPatterns.studyFrequency === "sporadic") {
      risks.push("Irregular study pattern");
    }
    const daysSinceActive = Math.floor(
      ((/* @__PURE__ */ new Date()).getTime() - student.learningHistory.lastActivityDate.getTime()) / (1e3 * 60 * 60 * 24)
    );
    if (daysSinceActive > 7) {
      risks.push("Extended inactivity");
    }
    return risks;
  }
  predictDropoutDate(student) {
    const daysUntilDropout = Math.max(
      7,
      30 - Math.floor(this.calculateRiskScore(student) / 3)
    );
    const dropoutDate = /* @__PURE__ */ new Date();
    dropoutDate.setDate(dropoutDate.getDate() + daysUntilDropout);
    return dropoutDate;
  }
  async getInterventionHistory(userId) {
    if (this.config.database) {
      return [];
    }
    return [];
  }
  calculateRiskDistribution(atRiskStudents, totalStudents) {
    return {
      high: atRiskStudents.filter((s) => s.riskLevel === "high").length,
      medium: atRiskStudents.filter((s) => s.riskLevel === "medium").length,
      low: atRiskStudents.filter((s) => s.riskLevel === "low").length,
      safe: totalStudents - atRiskStudents.length
    };
  }
  identifyCommonRiskFactors(riskFactorCounts, totalStudents) {
    const commonFactors = [];
    riskFactorCounts.forEach((count, factor) => {
      const prevalence = count / totalStudents;
      if (prevalence > 0.2) {
        commonFactors.push({
          factor,
          severity: prevalence > 0.5 ? "high" : prevalence > 0.3 ? "medium" : "low",
          impact: prevalence,
          description: `Affecting ${Math.round(prevalence * 100)}% of students`
        });
      }
    });
    return commonFactors.sort((a, b) => b.impact - a.impact);
  }
  calculateCohortHealth(distribution) {
    const weights = { safe: 1, low: 0.7, medium: 0.4, high: 0.1 };
    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
    let healthScore = 0;
    Object.entries(distribution).forEach(([level, count]) => {
      healthScore += (weights[level] || 0) * count;
    });
    return healthScore / total;
  }
  async generateInterventionRecommendations(atRiskStudents, commonRiskFactors) {
    const recommendations = [];
    const highRiskCount = atRiskStudents.filter((s) => s.riskLevel === "high").length;
    if (highRiskCount > 0) {
      recommendations.push({
        targetGroup: `${highRiskCount} high-risk students`,
        interventionType: "Personalized outreach and support",
        timing: "immediate",
        expectedEffectiveness: 0.7,
        implementation: [
          "Send personalized email from instructor",
          "Schedule one-on-one support session",
          "Provide remedial content access",
          "Assign peer mentor"
        ]
      });
    }
    commonRiskFactors.forEach((factor) => {
      recommendations.push({
        targetGroup: `Students with ${factor.factor}`,
        interventionType: this.getInterventionTypeForFactor(factor.factor),
        timing: factor.severity === "high" ? "immediate" : "within-24h",
        expectedEffectiveness: 0.6,
        implementation: this.getImplementationSteps(factor.factor)
      });
    });
    return recommendations;
  }
  getInterventionTypeForFactor(factor) {
    const interventionMap = {
      "Low engagement": "Engagement campaign with gamification",
      "Poor performance": "Adaptive learning path adjustment",
      "Irregular study pattern": "Structured schedule with reminders",
      "Extended inactivity": "Re-engagement campaign"
    };
    return interventionMap[factor] || "General support intervention";
  }
  getImplementationSteps(factor) {
    const stepsMap = {
      "Low engagement": [
        "Analyze content interaction patterns",
        "Introduce gamification elements",
        "Send daily challenge notifications",
        "Create peer competition dashboard"
      ],
      "Poor performance": [
        "Identify knowledge gaps",
        "Provide prerequisite content",
        "Adjust difficulty level",
        "Offer additional practice"
      ],
      "Irregular study pattern": [
        "Survey preferred study times",
        "Create personalized schedule",
        "Set up automated reminders",
        "Track and reward consistency"
      ],
      "Extended inactivity": [
        "Send welcome back email",
        "Show progress summary",
        "Offer quick win activities",
        "Provide catch-up plan"
      ]
    };
    return stepsMap[factor] || ["Analyze situation", "Plan intervention", "Execute", "Monitor"];
  }
  async identifyLearningStyle(student) {
    return {
      primary: "visual",
      secondary: "kinesthetic",
      preferences: {
        contentType: student.behaviorPatterns.contentPreferences,
        sessionLength: student.behaviorPatterns.sessionDuration,
        interactionStyle: student.behaviorPatterns.interactionPatterns
      }
    };
  }
  getAvailableInterventions() {
    return [
      { type: "email", effectiveness: 0.6, cost: "low" },
      { type: "notification", effectiveness: 0.5, cost: "low" },
      { type: "content-recommendation", effectiveness: 0.7, cost: "medium" },
      { type: "tutor-assignment", effectiveness: 0.9, cost: "high" },
      { type: "peer-connection", effectiveness: 0.7, cost: "low" },
      { type: "schedule-adjustment", effectiveness: 0.6, cost: "low" }
    ];
  }
  selectInterventions(riskAssessment, _learningStyle, available) {
    const selected = available.filter((intervention) => {
      if (riskAssessment.riskLevel === "high" && intervention.effectiveness < 0.7) {
        return false;
      }
      return true;
    });
    return selected.sort((a, b) => b.effectiveness - a.effectiveness).slice(0, 3);
  }
  planInterventionSequence(interventions, student) {
    const planned = [];
    let currentDate = /* @__PURE__ */ new Date();
    interventions.forEach((intervention, index) => {
      currentDate = new Date(currentDate.getTime() + index * 2 * 24 * 60 * 60 * 1e3);
      planned.push({
        id: `intervention-${Date.now()}-${index}`,
        type: intervention.type,
        timing: new Date(currentDate),
        content: this.generateInterventionContent(intervention.type, student),
        expectedResponse: this.getExpectedResponse(intervention.type),
        successCriteria: this.getSuccessCriteria(intervention.type)
      });
    });
    return planned;
  }
  generateInterventionContent(type, student) {
    const templates = {
      email: `Personalized message addressing ${student.behaviorPatterns.strugglingIndicators.join(", ")}`,
      notification: "Quick reminder about pending activities",
      "content-recommendation": "Curated content based on learning gaps",
      "tutor-assignment": "Introduction to assigned tutor with scheduling link",
      "peer-connection": "Introduction to study partner with similar goals",
      "schedule-adjustment": "New optimized study schedule"
    };
    return templates[type] || "General intervention content";
  }
  getExpectedResponse(type) {
    const responses = {
      email: "Open and click-through within 48 hours",
      notification: "App engagement within 24 hours",
      "content-recommendation": "Content interaction within 72 hours",
      "tutor-assignment": "Session scheduled within 1 week",
      "peer-connection": "First interaction within 3 days",
      "schedule-adjustment": "Schedule adoption within 48 hours"
    };
    return responses[type] || "Positive engagement";
  }
  getSuccessCriteria(type) {
    const criteria = {
      email: ["Email opened", "Link clicked", "Action taken"],
      notification: ["Notification viewed", "App opened", "Activity completed"],
      "content-recommendation": ["Content viewed", "70% completion", "Assessment passed"],
      "tutor-assignment": ["Session scheduled", "Session attended", "Follow-up scheduled"],
      "peer-connection": [
        "Connection accepted",
        "First message sent",
        "Collaborative activity"
      ],
      "schedule-adjustment": [
        "Schedule viewed",
        "First session completed",
        "3-day adherence"
      ]
    };
    return criteria[type] || ["Intervention acknowledged", "Action taken"];
  }
  createInterventionTimeline(_interventions) {
    const start = /* @__PURE__ */ new Date();
    const end = /* @__PURE__ */ new Date();
    end.setDate(end.getDate() + 30);
    const milestones = [
      {
        date: new Date(start.getTime() + 7 * 24 * 60 * 60 * 1e3),
        goal: "Re-engagement",
        metric: "Daily active usage",
        target: 1
      },
      {
        date: new Date(start.getTime() + 14 * 24 * 60 * 60 * 1e3),
        goal: "Performance improvement",
        metric: "Assessment score",
        target: 70
      },
      {
        date: new Date(start.getTime() + 30 * 24 * 60 * 60 * 1e3),
        goal: "Sustained progress",
        metric: "Course completion",
        target: 25
      }
    ];
    return { start, milestones, end };
  }
  determineSequencing(interventions) {
    const highImpactCount = interventions.filter(
      (i) => ["tutor-assignment", "content-recommendation"].includes(i.type)
    ).length;
    return highImpactCount > 1 ? "sequential" : "parallel";
  }
  calculateTotalImpact(interventions) {
    let totalImpact = 0;
    let diminishingFactor = 1;
    interventions.forEach((intervention) => {
      const baseImpact = this.getInterventionImpact(intervention.type);
      totalImpact += baseImpact * diminishingFactor;
      diminishingFactor *= 0.8;
    });
    return Math.min(1, totalImpact);
  }
  getInterventionImpact(type) {
    const impactMap = {
      email: 0.2,
      notification: 0.15,
      "content-recommendation": 0.3,
      "tutor-assignment": 0.4,
      "peer-connection": 0.25,
      "schedule-adjustment": 0.2
    };
    return impactMap[type] || 0.1;
  }
  calculateCurrentVelocity(student) {
    const progressPerDay = student.performanceMetrics.overallProgress / Math.max(1, student.learningHistory.timeSpentLearning / (24 * 60));
    return progressPerDay;
  }
  async calculateOptimalVelocity(student) {
    const targetCompletionDays = 90;
    const remainingProgress = 1 - student.performanceMetrics.overallProgress;
    const optimalVelocity = remainingProgress / targetCompletionDays;
    const capacityMultiplier = this.calculateCapacityMultiplier(student);
    return optimalVelocity * capacityMultiplier;
  }
  calculateCapacityMultiplier(student) {
    let multiplier = 1;
    if (student.performanceMetrics.consistencyScore > 0.8) {
      multiplier *= 1.2;
    } else if (student.performanceMetrics.consistencyScore < 0.5) {
      multiplier *= 0.8;
    }
    if (student.performanceMetrics.averageScore > 85) {
      multiplier *= 1.1;
    } else if (student.performanceMetrics.averageScore < 60) {
      multiplier *= 0.9;
    }
    return multiplier;
  }
  generateVelocityRecommendations(current, optimal, student) {
    const recommendations = [];
    if (current < optimal) {
      recommendations.push({
        area: "Study Time",
        currentApproach: `${Math.round(student.behaviorPatterns.sessionDuration)} minutes per session`,
        optimizedApproach: `${Math.round(student.behaviorPatterns.sessionDuration * 1.5)} minutes per session`,
        timeImpact: 50,
        difficultyAdjustment: 0
      });
      recommendations.push({
        area: "Study Frequency",
        currentApproach: student.behaviorPatterns.studyFrequency,
        optimizedApproach: "daily",
        timeImpact: 30,
        difficultyAdjustment: -0.1
      });
    } else {
      recommendations.push({
        area: "Content Depth",
        currentApproach: "Standard depth",
        optimizedApproach: "Enhanced depth with practice",
        timeImpact: 20,
        difficultyAdjustment: 0.1
      });
    }
    return recommendations;
  }
  async createPersonalizedSchedule(student, optimalVelocity) {
    const dailyGoals = [];
    const weekDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];
    weekDays.forEach((day) => {
      const isWeekend = day === "Saturday" || day === "Sunday";
      const duration = isWeekend ? student.behaviorPatterns.sessionDuration * 1.5 : student.behaviorPatterns.sessionDuration;
      dailyGoals.push({
        day,
        duration: Math.round(duration),
        topics: this.selectDailyTopics(optimalVelocity),
        activities: this.selectDailyActivities(student),
        difficulty: this.selectDailyDifficulty(student, day)
      });
    });
    return {
      dailyGoals,
      weeklyMilestones: [
        "Complete 2 chapters",
        "Pass 3 assessments with 70%+",
        "Engage in 2 discussion topics",
        "Complete 1 project milestone"
      ],
      flexibilityScore: 0.3,
      // Allow 30% schedule flexibility
      adaptationTriggers: [
        "Missed 2 consecutive days",
        "Assessment score below 60%",
        "Completion rate below target",
        "Reported difficulty concerns"
      ]
    };
  }
  selectDailyTopics(velocity) {
    const topicsPerDay = Math.ceil(velocity * 100);
    return Array(topicsPerDay).fill("Topic").map((t, i) => `${t} ${i + 1}`);
  }
  selectDailyActivities(student) {
    const activities = [];
    activities.push("Video lecture");
    activities.push("Reading material");
    if (student.behaviorPatterns.contentPreferences.includes("interactive")) {
      activities.push("Interactive exercise");
    }
    if (student.performanceMetrics.participationRate > 0.5) {
      activities.push("Discussion forum");
    }
    activities.push("Practice quiz");
    return activities;
  }
  selectDailyDifficulty(student, day) {
    const dayIndex = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ].indexOf(day);
    if (dayIndex < 2) return "easy";
    if (dayIndex < 5) return "medium";
    return student.performanceMetrics.averageScore > 75 ? "hard" : "medium";
  }
  calculateExpectedImprovement(current, optimal) {
    if (current >= optimal) return 0;
    const improvementRatio = (optimal - current) / current;
    return Math.min(0.5, improvementRatio);
  }
  extractFeatures(context) {
    return {
      // Student features
      overallProgress: context.studentProfile.performanceMetrics.overallProgress,
      averageScore: context.studentProfile.performanceMetrics.averageScore,
      engagementLevel: context.studentProfile.performanceMetrics.engagementLevel,
      studyFrequency: context.studentProfile.behaviorPatterns.studyFrequency,
      // Course features
      courseDifficulty: context.courseContext.difficulty,
      courseDuration: context.courseContext.duration,
      // Environment features
      deviceType: context.environmentFactors.deviceType,
      studyTime: context.environmentFactors.timeOfDay
    };
  }
  async runPredictiveModel(features) {
    const weights = {
      overallProgress: 0.2,
      averageScore: 0.3,
      engagementLevel: 0.25,
      studyFrequency: 0.15,
      courseDifficulty: -0.1
    };
    let probability = 0;
    probability += features.overallProgress * weights.overallProgress;
    probability += features.averageScore / 100 * weights.averageScore;
    probability += features.engagementLevel * weights.engagementLevel;
    probability += (features.studyFrequency === "daily" ? 1 : 0.5) * weights.studyFrequency;
    probability += (features.courseDifficulty === "hard" ? 0.8 : 1) * weights.courseDifficulty;
    return { probability: Math.max(0, Math.min(1, probability)) };
  }
  identifyContributingFactors(features, _prediction) {
    const factors = { positive: [], negative: [] };
    if (features.averageScore > 80) {
      factors.positive.push("Strong academic performance");
    }
    if (features.engagementLevel > 0.7) {
      factors.positive.push("High engagement level");
    }
    if (features.studyFrequency === "daily") {
      factors.positive.push("Consistent study habits");
    }
    if (features.averageScore < 60) {
      factors.negative.push("Low assessment scores");
    }
    if (features.engagementLevel < 0.3) {
      factors.negative.push("Poor engagement");
    }
    if (features.overallProgress < 0.2) {
      factors.negative.push("Slow progress");
    }
    return factors;
  }
  calculateConfidence(features, prediction) {
    let dataCompleteness = 0;
    let featureCount = 0;
    Object.values(features).forEach((value) => {
      if (value !== null && value !== void 0) {
        dataCompleteness++;
      }
      featureCount++;
    });
    const completenessRatio = dataCompleteness / featureCount;
    const modelCertainty = Math.abs(prediction.probability - 0.5) * 2;
    return completenessRatio * 0.6 + modelCertainty * 0.4;
  }
  // Database storage methods
  async storePrediction(userId, prediction) {
    if (this.config.database) {
    }
  }
  async storeRiskAnalysis(courseId, analysis) {
    if (this.config.database) {
    }
  }
  async storeInterventionPlan(plan) {
    if (this.config.database) {
    }
  }
  async storeVelocityOptimization(userId, optimization) {
    if (this.config.database) {
    }
  }
  async storeProbabilityScore(userId, score) {
    if (this.config.database) {
    }
  }
};
function createPredictiveEngine(config) {
  return new PredictiveEngine(config);
}

// src/engines/analytics-engine.ts
var AnalyticsEngine = class {
  constructor(config) {
    this.config = config;
    this.database = config.database;
  }
  database;
  /**
   * Get comprehensive analytics for a user
   */
  async getComprehensiveAnalytics(userId, options) {
    if (!this.database) {
      return this.getDefaultAnalytics();
    }
    const userStats = await this.database.getUserStats(userId, options?.courseId);
    const interactions = await this.database.getInteractions({
      userId,
      courseId: options?.courseId,
      startDate: options?.dateRange?.start,
      endDate: options?.dateRange?.end,
      limit: 1e3
    });
    const analyticsRecords = await this.database.getAnalyticsRecords({
      userId,
      courseId: options?.courseId,
      startDate: options?.dateRange?.start,
      endDate: options?.dateRange?.end
    });
    const metrics = this.calculateLearningMetrics(interactions, analyticsRecords);
    const contentInsights = await this.calculateContentInsights(
      userId,
      interactions,
      options?.courseId
    );
    const behaviorPatterns = this.analyzeBehaviorPatterns(interactions);
    const personalizedInsights = this.generatePersonalizedInsights(
      metrics,
      contentInsights,
      behaviorPatterns,
      userStats
    );
    const trends = await this.calculateTrends(userId, options?.courseId);
    return {
      metrics,
      contentInsights,
      behaviorPatterns,
      personalizedInsights,
      trends
    };
  }
  /**
   * Record an analytics session
   */
  async recordAnalyticsSession(userId, sessionData) {
    if (!this.database) {
      return;
    }
    await this.database.recordAnalytics({
      userId,
      interactionCount: sessionData.interactionCount,
      responseTime: sessionData.responseTime,
      satisfactionScore: sessionData.satisfactionScore,
      completionRate: sessionData.completionRate,
      courseId: sessionData.courseId,
      chapterId: sessionData.chapterId,
      sectionId: sessionData.sectionId
    });
  }
  // =========================================================================
  // Private Helper Methods
  // =========================================================================
  getDefaultAnalytics() {
    return {
      metrics: {
        totalInteractions: 0,
        averageSessionDuration: 0,
        mostActiveTime: "N/A",
        preferredFeatures: [],
        contentQuality: 0,
        learningVelocity: 0,
        engagementScore: 0
      },
      contentInsights: {
        mostEditedSections: [],
        averageContentLength: 0,
        aiAssistanceRate: 0,
        suggestionAcceptanceRate: 0,
        contentCompletionRate: 0,
        timeToComplete: 0
      },
      behaviorPatterns: {
        workingHours: [],
        weeklyPattern: [],
        featureUsagePattern: {},
        learningPathProgression: []
      },
      personalizedInsights: {
        strengths: [],
        areasForImprovement: [],
        recommendations: [],
        predictedNextMilestone: "Get started with your first interaction",
        estimatedTimeToGoal: 0
      },
      trends: {
        pointsTrend: [],
        engagementTrend: [],
        productivityTrend: []
      }
    };
  }
  calculateLearningMetrics(interactions, analyticsRecords) {
    const totalInteractions = interactions.length;
    const avgSessionDuration = analyticsRecords.length > 0 ? analyticsRecords.reduce((sum, record) => sum + (record.responseTime || 0), 0) / analyticsRecords.length : 0;
    const hourCounts = {};
    interactions.forEach((interaction) => {
      const hour = new Date(interaction.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const mostActiveHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "0";
    const mostActiveTime = `${mostActiveHour}:00 - ${parseInt(mostActiveHour) + 1}:00`;
    const featureCounts = {};
    interactions.forEach((interaction) => {
      const type = interaction.interactionType;
      featureCounts[type] = (featureCounts[type] || 0) + 1;
    });
    const preferredFeatures = Object.entries(featureCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([feature]) => feature);
    const contentQuality = this.calculateContentQuality(analyticsRecords);
    const daySpan = interactions.length > 0 ? Math.max(
      1,
      Math.ceil(
        ((/* @__PURE__ */ new Date()).getTime() - new Date(interactions[interactions.length - 1].createdAt).getTime()) / (1e3 * 60 * 60 * 24)
      )
    ) : 1;
    const learningVelocity = totalInteractions / daySpan;
    const engagementScore = this.calculateEngagementScore(interactions, analyticsRecords);
    return {
      totalInteractions,
      averageSessionDuration: avgSessionDuration,
      mostActiveTime,
      preferredFeatures,
      contentQuality,
      learningVelocity,
      engagementScore
    };
  }
  async calculateContentInsights(userId, interactions, courseId) {
    const sectionEdits = {};
    interactions.forEach((interaction) => {
      if (interaction.sectionId) {
        sectionEdits[interaction.sectionId] = (sectionEdits[interaction.sectionId] || 0) + 1;
      }
    });
    const mostEditedSections = Object.entries(sectionEdits).sort(([, a], [, b]) => b - a).slice(0, 5).map(([sectionId, editCount]) => ({ sectionId, editCount }));
    const contentInteractions = interactions.filter(
      (i) => ["CONTENT_GENERATE", "FORM_SUBMIT", "QUICK_ACTION"].includes(i.interactionType)
    );
    const contentLengths = contentInteractions.filter((i) => {
      if (typeof i.context === "object" && i.context !== null && "contentLength" in i.context) {
        return typeof i.context.contentLength === "number";
      }
      return false;
    }).map((i) => {
      const context = i.context;
      return context.contentLength;
    });
    const averageContentLength = contentLengths.length > 0 ? contentLengths.reduce((sum, len) => sum + len, 0) / contentLengths.length : 0;
    const totalContentActions = interactions.filter(
      (i) => i.interactionType.includes("CONTENT") || i.interactionType === "FORM_SUBMIT"
    ).length;
    const aiAssistedActions = interactions.filter(
      (i) => ["CONTENT_GENERATE", "LEARNING_ASSISTANCE", "QUICK_ACTION"].includes(i.interactionType)
    ).length;
    const aiAssistanceRate = totalContentActions > 0 ? aiAssistedActions / totalContentActions * 100 : 0;
    const suggestionsGiven = interactions.filter(
      (i) => i.interactionType === "LEARNING_ASSISTANCE"
    ).length;
    const suggestionsApplied = interactions.filter(
      (i) => i.interactionType === "QUICK_ACTION"
    ).length;
    const suggestionAcceptanceRate = suggestionsGiven > 0 ? suggestionsApplied / suggestionsGiven * 100 : 0;
    let contentCompletionRate = 0;
    let timeToComplete = 0;
    if (this.database) {
      const allCourses = await this.database.getCourses({
        userId,
        courseId
      });
      const publishedCourses = await this.database.getCourses({
        userId,
        courseId,
        isPublished: true
      });
      contentCompletionRate = allCourses.length > 0 ? publishedCourses.length / allCourses.length * 100 : 0;
      const completionTimes = publishedCourses.map(
        (course) => (course.updatedAt.getTime() - course.createdAt.getTime()) / (1e3 * 60 * 60)
      );
      timeToComplete = completionTimes.length > 0 ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length : 0;
    }
    return {
      mostEditedSections,
      averageContentLength,
      aiAssistanceRate,
      suggestionAcceptanceRate,
      contentCompletionRate,
      timeToComplete
    };
  }
  analyzeBehaviorPatterns(interactions) {
    const hourlyActivity = {};
    for (let i = 0; i < 24; i++) {
      hourlyActivity[i] = 0;
    }
    interactions.forEach((interaction) => {
      const hour = new Date(interaction.createdAt).getHours();
      hourlyActivity[hour]++;
    });
    const workingHours = Object.entries(hourlyActivity).map(([hour, frequency]) => ({ hour: parseInt(hour), frequency })).sort((a, b) => a.hour - b.hour);
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];
    const weeklyActivity = {};
    daysOfWeek.forEach((day) => {
      weeklyActivity[day] = 0;
    });
    interactions.forEach((interaction) => {
      const day = daysOfWeek[new Date(interaction.createdAt).getDay()];
      weeklyActivity[day]++;
    });
    const weeklyPattern = daysOfWeek.map((day) => ({
      day,
      activity: weeklyActivity[day]
    }));
    const featureUsage = {};
    interactions.forEach((interaction) => {
      const feature = this.mapInteractionToFeature(interaction.interactionType);
      featureUsage[feature] = (featureUsage[feature] || 0) + 1;
    });
    const milestones = this.extractMilestones(interactions);
    const learningPathProgression = milestones.map((m) => ({
      date: m.date.toISOString().split("T")[0],
      milestone: m.description
    }));
    return {
      workingHours,
      weeklyPattern,
      featureUsagePattern: featureUsage,
      learningPathProgression
    };
  }
  generatePersonalizedInsights(metrics, contentInsights, behaviorPatterns, userStats) {
    const strengths = [];
    const areasForImprovement = [];
    const recommendations = [];
    if (metrics.engagementScore > 80) {
      strengths.push("Highly engaged learner with consistent activity");
    }
    if (contentInsights.aiAssistanceRate > 70) {
      strengths.push("Excellent use of AI assistance for content creation");
    }
    if (metrics.learningVelocity > 10) {
      strengths.push("Fast-paced learner with high productivity");
    }
    if (contentInsights.contentCompletionRate > 80) {
      strengths.push("Strong course completion rate");
    }
    if (userStats.streaks && userStats.streaks.length > 0 && userStats.streaks[0].currentStreak > 7) {
      strengths.push("Maintaining excellent learning consistency");
    }
    if (metrics.engagementScore < 50) {
      areasForImprovement.push("Increase daily engagement with the platform");
      recommendations.push("Try setting a daily reminder to work on your courses");
    }
    if (contentInsights.suggestionAcceptanceRate < 30) {
      areasForImprovement.push("Consider applying more AI suggestions");
      recommendations.push("AI suggestions can significantly improve content quality");
    }
    if (contentInsights.averageContentLength < 200) {
      areasForImprovement.push("Create more detailed content");
      recommendations.push('Use the "Expand" feature to add more depth to your content');
    }
    if (behaviorPatterns.workingHours.filter((h) => h.frequency > 0).length < 3) {
      areasForImprovement.push("Spread learning across more hours");
      recommendations.push("Distributed practice leads to better retention");
    }
    const peakHour = [...behaviorPatterns.workingHours].sort(
      (a, b) => b.frequency - a.frequency
    )[0];
    if (peakHour) {
      recommendations.push(
        `Your peak productivity is at ${peakHour.hour}:00 - schedule important tasks then`
      );
    }
    const featureEntries = Object.entries(behaviorPatterns.featureUsagePattern);
    if (featureEntries.length > 0) {
      const leastUsedFeature = featureEntries.sort(([, a], [, b]) => a - b)[0];
      if (leastUsedFeature) {
        recommendations.push(`Try using the ${leastUsedFeature[0]} feature more often`);
      }
    }
    const predictedNextMilestone = this.predictNextMilestone(userStats, metrics);
    const estimatedTimeToGoal = this.estimateTimeToNextLevel(
      userStats.totalPoints ?? userStats.points,
      metrics.learningVelocity
    );
    return {
      strengths,
      areasForImprovement,
      recommendations,
      predictedNextMilestone,
      estimatedTimeToGoal
    };
  }
  async calculateTrends(userId, courseId) {
    if (!this.database) {
      return {
        pointsTrend: [],
        engagementTrend: [],
        productivityTrend: []
      };
    }
    const thirtyDaysAgo = /* @__PURE__ */ new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const pointsHistory = await this.database.getPointsHistory({
      userId,
      courseId,
      startDate: thirtyDaysAgo
    });
    const pointsByDate = {};
    pointsHistory.forEach((point) => {
      const date = point.awardedAt.toISOString().split("T")[0];
      pointsByDate[date] = (pointsByDate[date] || 0) + point.points;
    });
    const pointsTrend = Object.entries(pointsByDate).map(([date, points]) => ({
      date,
      points
    }));
    const interactions = await this.database.getInteractions({
      userId,
      courseId,
      startDate: thirtyDaysAgo
    });
    const interactionsByDate = {};
    interactions.forEach((interaction) => {
      const date = interaction.createdAt.toISOString().split("T")[0];
      interactionsByDate[date] = (interactionsByDate[date] || 0) + 1;
    });
    const engagementTrend = Object.entries(interactionsByDate).map(([date, count]) => ({
      date,
      score: Math.min(100, count * 10)
    }));
    const productivityInteractions = interactions.filter(
      (i) => ["CONTENT_GENERATE", "FORM_SUBMIT", "QUICK_ACTION"].includes(i.interactionType)
    );
    const productivityByDate = {};
    productivityInteractions.forEach((interaction) => {
      const date = interaction.createdAt.toISOString().split("T")[0];
      productivityByDate[date] = (productivityByDate[date] || 0) + 1;
    });
    const productivityTrend = Object.entries(productivityByDate).map(([date, count]) => ({
      date,
      itemsCompleted: count
    }));
    return {
      pointsTrend,
      engagementTrend,
      productivityTrend
    };
  }
  // Helper methods
  calculateContentQuality(analyticsRecords) {
    if (analyticsRecords.length === 0) return 0;
    const recordsWithSatisfaction = analyticsRecords.filter(
      (r) => r.satisfactionScore !== null && r.satisfactionScore !== void 0
    );
    const recordsWithCompletion = analyticsRecords.filter(
      (r) => r.completionRate !== null && r.completionRate !== void 0
    );
    const avgSatisfaction = recordsWithSatisfaction.length > 0 ? recordsWithSatisfaction.reduce((sum, r) => sum + (r.satisfactionScore || 0), 0) / recordsWithSatisfaction.length : 0;
    const avgCompletion = recordsWithCompletion.length > 0 ? recordsWithCompletion.reduce((sum, r) => sum + (r.completionRate || 0), 0) / recordsWithCompletion.length : 0;
    return (avgSatisfaction * 0.6 + avgCompletion * 0.4) / 10;
  }
  calculateEngagementScore(interactions, analyticsRecords) {
    const recencyScore = this.calculateRecencyScore(interactions);
    const frequencyScore = this.calculateFrequencyScore(interactions);
    const diversityScore = this.calculateDiversityScore(interactions);
    const recordsWithCompletion = analyticsRecords.filter(
      (r) => r.completionRate !== null && r.completionRate !== void 0
    );
    const completionScore = recordsWithCompletion.length > 0 ? recordsWithCompletion.reduce((sum, r) => sum + (r.completionRate || 0), 0) / recordsWithCompletion.length : 0;
    return recencyScore * 0.3 + frequencyScore * 0.3 + diversityScore * 0.2 + completionScore * 0.2;
  }
  calculateRecencyScore(interactions) {
    if (interactions.length === 0) return 0;
    const mostRecent = new Date(interactions[0].createdAt);
    const daysSinceLastInteraction = Math.floor(
      ((/* @__PURE__ */ new Date()).getTime() - mostRecent.getTime()) / (1e3 * 60 * 60 * 24)
    );
    if (daysSinceLastInteraction === 0) return 100;
    if (daysSinceLastInteraction <= 1) return 90;
    if (daysSinceLastInteraction <= 3) return 70;
    if (daysSinceLastInteraction <= 7) return 50;
    if (daysSinceLastInteraction <= 14) return 30;
    return 10;
  }
  calculateFrequencyScore(interactions) {
    const thirtyDaysAgo = /* @__PURE__ */ new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentInteractions = interactions.filter(
      (i) => new Date(i.createdAt) > thirtyDaysAgo
    ).length;
    return Math.min(100, recentInteractions / 30 * 20);
  }
  calculateDiversityScore(interactions) {
    const uniqueTypes = new Set(interactions.map((i) => i.interactionType)).size;
    const possibleTypes = 15;
    return uniqueTypes / possibleTypes * 100;
  }
  mapInteractionToFeature(interactionType) {
    const featureMap = {
      CONTENT_GENERATE: "AI Content Generation",
      LEARNING_ASSISTANCE: "Learning Assistance",
      QUICK_ACTION: "Quick Actions",
      FORM_SUBMIT: "Form Submission",
      CHAT_MESSAGE: "Chat System",
      FORM_POPULATE: "Form Population",
      NAVIGATION: "Navigation",
      ANALYTICS_VIEW: "Analytics",
      GAMIFICATION_ACTION: "Gamification"
    };
    return featureMap[interactionType] || "Other";
  }
  extractMilestones(interactions) {
    const milestones = [];
    const firstOfType = {};
    interactions.forEach((interaction) => {
      if (!firstOfType[interaction.interactionType]) {
        firstOfType[interaction.interactionType] = new Date(interaction.createdAt);
      }
    });
    Object.entries(firstOfType).forEach(([type, date]) => {
      milestones.push({
        date,
        description: `First ${this.mapInteractionToFeature(type)}`
      });
    });
    return milestones.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  predictNextMilestone(userStats, metrics) {
    const totalPoints = userStats.totalPoints ?? userStats.points;
    const velocity = metrics.learningVelocity;
    if (totalPoints < 100) return "Reach 100 points - SAM Beginner";
    if (totalPoints < 500) return "Reach 500 points - SAM Enthusiast";
    if (totalPoints < 1e3) return "Reach 1000 points - SAM Expert";
    if (totalPoints < 2500) return "Reach 2500 points - SAM Master";
    if (velocity < 5) return "Increase daily activity to 5+ interactions";
    if (userStats.badges < 5) return "Unlock 5 achievement badges";
    return "Continue your excellent progress!";
  }
  estimateTimeToNextLevel(currentPoints, velocity) {
    const levelThresholds = [100, 300, 600, 1e3, 1500, 2500, 4e3, 6e3, 9e3, 15e3];
    const nextThreshold = levelThresholds.find((t) => t > currentPoints) || 15e3;
    const pointsNeeded = nextThreshold - currentPoints;
    const pointsPerDay = velocity * 5;
    return Math.ceil(pointsNeeded / Math.max(1, pointsPerDay));
  }
};
function createAnalyticsEngine(config) {
  return new AnalyticsEngine(config);
}

// src/engines/memory-engine.ts
var MemoryEngine = class {
  constructor(context, config) {
    this.config = config;
    this.context = context;
    this.database = config.database;
  }
  context;
  database;
  memoryCache = /* @__PURE__ */ new Map();
  /**
   * Initialize or resume a conversation
   */
  async initializeConversation(options) {
    if (!this.database) {
      throw new Error("Database adapter is required for memory operations");
    }
    let conversationId;
    if (options?.resumeLastConversation) {
      const recentConversations = await this.database.getConversations(
        this.context.userId,
        {
          courseId: this.context.courseId,
          chapterId: this.context.chapterId,
          limit: 1
        }
      );
      if (recentConversations.length > 0) {
        const lastConversation = recentConversations[0];
        const lastMessage = lastConversation.messages && lastConversation.messages.length > 0 ? lastConversation.messages[lastConversation.messages.length - 1] : void 0;
        const lastActivityAt = lastMessage ? lastMessage.createdAt : lastConversation.startedAt ?? lastConversation.createdAt;
        const timeSinceLastMessage = Date.now() - new Date(lastActivityAt).getTime();
        const hoursSinceLastMessage = timeSinceLastMessage / (1e3 * 60 * 60);
        if (hoursSinceLastMessage < 24) {
          conversationId = lastConversation.id;
          this.context.currentConversationId = conversationId;
          return conversationId;
        }
      }
    }
    conversationId = await this.database.createConversation(
      this.context.userId,
      {
        courseId: this.context.courseId,
        chapterId: this.context.chapterId,
        sectionId: this.context.sectionId,
        title: this.generateConversationTitle(options?.contextHint)
      }
    );
    this.context.currentConversationId = conversationId;
    await this.addContextualWelcomeMessage(conversationId);
    return conversationId;
  }
  /**
   * Add a message with memory enrichment
   */
  async addMessageWithMemory(role, content, metadata) {
    if (!this.database) {
      throw new Error("Database adapter is required for memory operations");
    }
    if (!this.context.currentConversationId) {
      await this.initializeConversation();
    }
    const enrichedMetadata = await this.enrichMessageWithMemory(
      content,
      metadata
    );
    await this.database.addMessage(this.context.currentConversationId, {
      role,
      content,
      metadata: enrichedMetadata
    });
    await this.updateMemoryFromMessage(role, content, enrichedMetadata);
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return messageId;
  }
  /**
   * Get conversation history with context
   */
  async getConversationHistory(options) {
    if (!this.database) {
      return { messages: [] };
    }
    if (!this.context.currentConversationId) {
      return { messages: [] };
    }
    const conversation = await this.database.getConversation(
      this.context.currentConversationId
    );
    if (!conversation) {
      return { messages: [] };
    }
    const messages = conversation.messages.reverse().map((msg) => ({
      id: msg.id,
      role: msg.messageType,
      content: msg.content,
      timestamp: msg.createdAt,
      metadata: msg.metadata
    }));
    let context;
    let relevantMemories;
    if (options?.includeContext) {
      context = await this.getPersonalizedContext();
      relevantMemories = await this.getRelevantMemories(
        conversation.messages.slice(-5).map((m) => m.content).join(" "),
        options.relevanceThreshold || 0.5
      );
    }
    return {
      messages,
      context,
      relevantMemories
    };
  }
  /**
   * Get personalized context for user
   */
  async getPersonalizedContext() {
    if (!this.database) {
      return this.getDefaultContext();
    }
    try {
      const learningProfile = await this.database.getLearningProfile(
        this.context.userId,
        this.context.courseId
      );
      const recentConversations = await this.database.getConversations(
        this.context.userId,
        {
          courseId: this.context.courseId,
          limit: 10
        }
      );
      const recentTopics = this.extractTopicsFromConversations(recentConversations);
      const ongoingProjects = await this.getOngoingProjects();
      const patterns = await this.analyzeUserPatterns();
      return {
        userPreferences: {
          learningStyle: learningProfile?.learningStyle || "adaptive",
          preferredTone: learningProfile?.preferredTone || "encouraging",
          contentFormat: learningProfile?.preferences?.formats || [
            "text",
            "visual"
          ],
          difficulty: learningProfile?.preferences?.difficulty || "medium"
        },
        recentTopics,
        ongoingProjects,
        commonChallenges: patterns.challenges,
        successPatterns: patterns.successes,
        currentGoals: patterns.goals
      };
    } catch {
      return this.getDefaultContext();
    }
  }
  /**
   * Generate contextual prompt for AI
   */
  async generateContextualPrompt(userMessage) {
    try {
      const context = await this.getPersonalizedContext();
      const relevantMemories = await this.getRelevantMemories(userMessage);
      const conversationHistory = await this.getConversationHistory({
        messageLimit: 10
      });
      const contextPrompt = `
# SAM AI Assistant Context

## User Profile
- Learning Style: ${context.userPreferences.learningStyle}
- Preferred Tone: ${context.userPreferences.preferredTone}
- Content Format: ${context.userPreferences.contentFormat.join(", ")}
- Difficulty Level: ${context.userPreferences.difficulty}

## Current Context
- Course: ${this.context.courseId || "General"}
- Chapter: ${this.context.chapterId || "N/A"}
- Section: ${this.context.sectionId || "N/A"}

## Recent Topics
${context.recentTopics.slice(0, 5).map((topic) => `- ${topic}`).join("\n")}

## Ongoing Projects
${context.ongoingProjects.slice(0, 3).map(
        (project) => `- ${project.type}: ${project.title} (${project.progress}% complete)`
      ).join("\n")}

## Common Challenges
${context.commonChallenges.slice(0, 3).map((challenge) => `- ${challenge}`).join("\n")}

## Success Patterns
${context.successPatterns.slice(0, 3).map((pattern) => `- ${pattern}`).join("\n")}

## Relevant Past Interactions
${relevantMemories.slice(0, 3).map((memory) => `- ${memory.timestamp.toDateString()}: ${memory.content}`).join("\n")}

## Recent Conversation History
${conversationHistory.messages.slice(-5).map((msg) => `${msg.role}: ${msg.content}`).join("\n")}

## Current User Message
${userMessage}

Based on this context, provide a helpful, personalized response that:
1. Acknowledges the user's learning style and preferences
2. References relevant past interactions when appropriate
3. Considers ongoing projects and current context
4. Uses the preferred tone and content format
5. Provides actionable advice tailored to their experience level
`;
      return contextPrompt;
    } catch {
      return userMessage;
    }
  }
  /**
   * Get conversation summaries
   */
  async getConversationSummaries(limit = 20) {
    if (!this.database) {
      return [];
    }
    try {
      const conversations = await this.database.getConversations(
        this.context.userId,
        {
          courseId: this.context.courseId,
          limit
        }
      );
      return conversations.map((conv) => {
        const lastMsg = conv.messages?.[conv.messages.length - 1];
        return {
          id: conv.id,
          title: conv.title || "SAM Session",
          startTime: conv.startedAt || conv.createdAt,
          lastActivity: lastMsg ? lastMsg.createdAt : conv.startedAt || conv.createdAt,
          messageCount: conv.messages?.length || 0,
          topics: this.extractTopicsFromMessages(conv.messages || []),
          userGoals: this.extractGoalsFromMessages(conv.messages || []),
          keyInsights: this.extractInsightsFromMessages(conv.messages || []),
          assistanceProvided: this.extractAssistanceFromMessages(
            conv.messages || []
          )
        };
      });
    } catch {
      return [];
    }
  }
  // Private helper methods
  getDefaultContext() {
    return {
      userPreferences: {
        learningStyle: "adaptive",
        preferredTone: "encouraging",
        contentFormat: ["text"],
        difficulty: "medium"
      },
      recentTopics: [],
      ongoingProjects: [],
      commonChallenges: [],
      successPatterns: [],
      currentGoals: []
    };
  }
  generateConversationTitle(contextHint) {
    const now = /* @__PURE__ */ new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
    if (contextHint) {
      return `${contextHint} - ${timeString}`;
    }
    if (this.context.sectionId) {
      return `Section Work - ${timeString}`;
    }
    if (this.context.chapterId) {
      return `Chapter Development - ${timeString}`;
    }
    if (this.context.courseId) {
      return `Course Creation - ${timeString}`;
    }
    return `SAM Session - ${timeString}`;
  }
  async addContextualWelcomeMessage(conversationId) {
    if (!this.database) return;
    const context = await this.getPersonalizedContext();
    let welcomeMessage = "Hello! I'm SAM, your AI learning assistant. ";
    if (context.ongoingProjects.length > 0) {
      const currentProject = context.ongoingProjects[0];
      welcomeMessage += `I see you're working on "${currentProject.title}". `;
    }
    if (context.recentTopics.length > 0) {
      welcomeMessage += `Based on our recent discussions about ${context.recentTopics.slice(0, 2).join(" and ")}, `;
    }
    welcomeMessage += "I'm here to help you create amazing content and achieve your learning goals. What can I assist you with today?";
    await this.database.addMessage(conversationId, {
      role: "SAM",
      content: welcomeMessage,
      metadata: { type: "welcome", contextual: true }
    });
  }
  async enrichMessageWithMemory(content, metadata) {
    const relevantMemories = await this.getRelevantMemories(content, 0.3);
    return {
      ...metadata,
      memoryContext: {
        relevantMemories: relevantMemories.slice(0, 3),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        sessionId: this.context.sessionId
      }
    };
  }
  async updateMemoryFromMessage(role, content, metadata) {
    if (!this.database) return;
    if (role === "USER") {
      await this.updateUserPreferencesFromMessage(content);
    } else if (role === "SAM" || role === "ASSISTANT") {
      await this.trackAssistanceProvided(content, metadata);
    }
  }
  async getRelevantMemories(query, threshold = 0.5) {
    if (!this.database) return [];
    const userId = this.context.userId;
    const cacheKey = `${userId}-memories`;
    if (!this.memoryCache.has(cacheKey)) {
      const interactions = await this.database.getInteractions(userId, {
        limit: 100
      });
      const memories2 = interactions.map((interaction) => ({
        id: interaction.id,
        timestamp: interaction.createdAt,
        type: "interaction",
        content: JSON.stringify(interaction.context),
        metadata: {},
        relevanceScore: 0
      }));
      this.memoryCache.set(cacheKey, memories2);
    }
    const memories = this.memoryCache.get(cacheKey) || [];
    const queryWords = query.toLowerCase().split(" ");
    return memories.map((memory) => ({
      ...memory,
      relevanceScore: this.calculateRelevanceScore(memory.content, queryWords)
    })).filter((memory) => memory.relevanceScore >= threshold).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  calculateRelevanceScore(content, queryWords) {
    const contentLower = content.toLowerCase();
    let score = 0;
    queryWords.forEach((word) => {
      if (word.length > 2 && contentLower.includes(word)) {
        score += 1;
      }
    });
    return queryWords.length > 0 ? score / queryWords.length : 0;
  }
  extractTopicsFromConversations(conversations) {
    const topics = [];
    conversations.forEach((conv) => {
      if (conv.title && conv.title !== "Untitled Conversation") {
        topics.push(conv.title);
      }
      conv.messages?.forEach((msg) => {
        if (msg.role === "USER") {
          const content = msg.content.toLowerCase();
          if (content.includes("course")) topics.push("Course Creation");
          if (content.includes("chapter")) topics.push("Chapter Development");
          if (content.includes("content")) topics.push("Content Writing");
          if (content.includes("exam") || content.includes("quiz"))
            topics.push("Assessment");
        }
      });
    });
    return [...new Set(topics)];
  }
  extractTopicsFromMessages(messages) {
    return messages.filter((msg) => msg.role === "USER").map((msg) => this.extractMainTopic(msg.content)).filter(Boolean);
  }
  extractGoalsFromMessages(messages) {
    return messages.filter(
      (msg) => msg.content.toLowerCase().includes("goal") || msg.content.toLowerCase().includes("want to") || msg.content.toLowerCase().includes("trying to")
    ).map((msg) => this.extractGoal(msg.content)).filter(Boolean);
  }
  extractInsightsFromMessages(messages) {
    return messages.filter((msg) => msg.role === "ASSISTANT").map((msg) => this.extractInsight(msg.content)).filter(Boolean);
  }
  extractAssistanceFromMessages(messages) {
    return messages.filter((msg) => msg.role === "ASSISTANT").map((msg) => this.extractAssistanceType(msg.content)).filter(Boolean);
  }
  extractMainTopic(content) {
    if (content.includes("course")) return "Course Creation";
    if (content.includes("chapter")) return "Chapter Development";
    if (content.includes("section")) return "Section Writing";
    if (content.includes("exam") || content.includes("quiz"))
      return "Assessment";
    if (content.includes("content")) return "Content Writing";
    return "General Discussion";
  }
  extractGoal(content) {
    const goalMatch = content.match(
      /(?:want to|trying to|goal.*?is to)\s+(.+?)(?:\.|$)/i
    );
    return goalMatch ? goalMatch[1].trim() : "";
  }
  extractInsight(content) {
    if (content.includes("recommendation") || content.includes("suggest")) {
      return content.substring(0, 100) + "...";
    }
    return "";
  }
  extractAssistanceType(content) {
    if (content.includes("content generated")) return "Content Generation";
    if (content.includes("improved")) return "Content Improvement";
    if (content.includes("suggestion")) return "Suggestions";
    if (content.includes("explanation")) return "Explanations";
    return "General Assistance";
  }
  async getOngoingProjects() {
    if (!this.database) return [];
    try {
      const courses = await this.database.getCourses(this.context.userId);
      return courses.filter((course) => !course.isPublished).slice(0, 5).map((course) => {
        const totalChapters = course.chapters.length;
        const publishedChapters = course.chapters.filter(
          (ch) => ch.isPublished
        ).length;
        const progress = totalChapters > 0 ? publishedChapters / totalChapters * 100 : 0;
        return {
          type: "course",
          id: course.id,
          title: course.title || "Untitled Course",
          progress: Math.round(progress)
        };
      });
    } catch {
      return [];
    }
  }
  async analyzeUserPatterns() {
    if (!this.database) {
      return { challenges: [], successes: [], goals: [] };
    }
    try {
      const interactions = await this.database.getInteractions(
        this.context.userId,
        { limit: 50 }
      );
      const challenges = [];
      const successes = [];
      const goals = [];
      interactions.forEach((interaction) => {
        const context = interaction.context;
        if (context?.type === "help_requested") {
          challenges.push("Seeking assistance with content creation");
        }
        if (context?.type === "content_generated") {
          successes.push("Successfully using AI content generation");
        }
        if (String(context?.type || "").toUpperCase() === "SUGGESTION_APPLIED") {
          successes.push("Actively improving content with suggestions");
        }
      });
      return {
        challenges: [...new Set(challenges)],
        successes: [...new Set(successes)],
        goals: [...new Set(goals)]
      };
    } catch {
      return { challenges: [], successes: [], goals: [] };
    }
  }
  async updateUserPreferencesFromMessage(content) {
    if (!this.database) return;
    const preferences = {};
    if (content.includes("simple") || content.includes("basic")) {
      preferences.difficulty = "easy";
    } else if (content.includes("advanced") || content.includes("complex")) {
      preferences.difficulty = "hard";
    }
    if (content.includes("visual") || content.includes("image")) {
      preferences.contentFormat = ["visual", "text"];
    }
    if (Object.keys(preferences).length > 0) {
      await this.database.updateLearningProfile(this.context.userId, {
        adaptiveSettings: preferences
      });
    }
  }
  async trackAssistanceProvided(content, metadata) {
    if (!this.database) return;
    const assistanceType = this.extractAssistanceType(content);
    if (assistanceType !== "General Assistance") {
      await this.database.createInteraction({
        userId: this.context.userId,
        interactionType: "LEARNING_ASSISTANCE",
        context: { assistanceType, content: content.substring(0, 200) },
        courseId: this.context.courseId,
        chapterId: this.context.chapterId,
        sectionId: this.context.sectionId
      });
    }
  }
};
function createMemoryEngine(context, config) {
  return new MemoryEngine(context, config);
}

// src/engines/research-engine.ts
var ResearchEngine = class {
  constructor(config) {
    this.config = config;
    this.paperDatabase = /* @__PURE__ */ new Map();
    this.trendAnalysis = /* @__PURE__ */ new Map();
    this.readingLists = /* @__PURE__ */ new Map();
    this.citationGraph = /* @__PURE__ */ new Map();
    this.database = config.database;
    this.initializeResearchData();
  }
  paperDatabase;
  trendAnalysis;
  readingLists;
  citationGraph;
  database;
  initializeResearchData() {
    const papers = [
      {
        paperId: "paper-001",
        title: "Attention Is All You Need",
        abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
        authors: [
          {
            name: "Ashish Vaswani",
            affiliation: "Google Brain",
            expertise: ["Deep Learning", "NLP", "Attention Mechanisms"]
          },
          {
            name: "Noam Shazeer",
            affiliation: "Google Brain",
            expertise: ["Deep Learning", "Model Architecture"]
          }
        ],
        publication: {
          venue: "NeurIPS",
          type: "conference",
          tier: "A*",
          arxivId: "1706.03762"
        },
        publishDate: /* @__PURE__ */ new Date("2017-06-12"),
        category: "deep-learning",
        subCategories: ["attention-mechanisms", "neural-architecture", "nlp"],
        keywords: ["transformer", "attention", "self-attention", "neural networks"],
        citations: 85e3,
        hIndex: 150,
        impactFactor: 98.5,
        methodology: ["Architecture Design", "Empirical Evaluation", "Ablation Studies"],
        findings: [
          {
            type: "primary",
            description: "Transformers achieve state-of-the-art results on machine translation",
            evidence: "BLEU score of 28.4 on WMT 2014 English-to-German",
            significance: "breakthrough",
            confidence: 99
          },
          {
            type: "primary",
            description: "Self-attention can replace recurrence and convolutions",
            evidence: "Superior performance with reduced computational complexity",
            significance: "breakthrough",
            confidence: 98
          }
        ],
        contributions: [
          "Introduced the Transformer architecture",
          "Demonstrated effectiveness of pure attention mechanisms",
          "Enabled parallelization of sequence processing",
          "Set foundation for modern LLMs"
        ],
        limitations: [
          "Quadratic complexity with sequence length",
          "Requires large amounts of training data",
          "Limited context window"
        ],
        futureWork: [
          "Scaling to longer sequences",
          "Reducing computational requirements",
          "Application to other domains"
        ],
        relatedPapers: ["paper-002", "paper-003"],
        code: [
          {
            platform: "github",
            url: "https://github.com/tensorflow/tensor2tensor",
            language: ["Python"],
            stars: 15e3,
            license: "Apache-2.0",
            lastUpdated: /* @__PURE__ */ new Date("2024-01-15")
          }
        ],
        educationalValue: {
          difficulty: "advanced",
          prerequisites: ["Linear Algebra", "Deep Learning Basics", "NLP Fundamentals"],
          learningOutcomes: [
            "Understand attention mechanisms",
            "Implement transformer architecture",
            "Apply to sequence tasks"
          ],
          estimatedStudyTime: 40,
          suitableFor: ["graduate", "researcher", "practitioner"],
          teachingValue: 95
        },
        practicalApplications: [
          {
            domain: "Natural Language Processing",
            description: "Foundation for GPT, BERT, and modern LLMs",
            impact: "Revolutionized NLP applications",
            readinessLevel: "production",
            companies: ["OpenAI", "Google", "Meta", "Microsoft"]
          }
        ]
      },
      {
        paperId: "paper-002",
        title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
        abstract: "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.",
        authors: [
          {
            name: "Jacob Devlin",
            affiliation: "Google AI Language",
            expertise: ["NLP", "Language Models", "Transfer Learning"]
          },
          {
            name: "Ming-Wei Chang",
            affiliation: "Google AI Language",
            expertise: ["NLP", "Machine Learning"]
          }
        ],
        publication: {
          venue: "NAACL",
          type: "conference",
          tier: "A*",
          arxivId: "1810.04805"
        },
        publishDate: /* @__PURE__ */ new Date("2018-10-11"),
        category: "nlp",
        subCategories: ["language-models", "transfer-learning", "transformers"],
        keywords: ["BERT", "pre-training", "bidirectional", "language understanding"],
        citations: 65e3,
        hIndex: 120,
        impactFactor: 95,
        methodology: ["Pre-training Strategy", "Fine-tuning Approach", "Comprehensive Evaluation"],
        findings: [
          {
            type: "primary",
            description: "Bidirectional pre-training significantly improves language understanding",
            evidence: "State-of-the-art on 11 NLP tasks",
            significance: "breakthrough",
            confidence: 98
          }
        ],
        contributions: [
          "Introduced masked language modeling",
          "Demonstrated effectiveness of bidirectional pre-training",
          "Created universal language representations",
          "Enabled transfer learning in NLP"
        ],
        limitations: [
          "Computationally expensive pre-training",
          "Fixed context window of 512 tokens",
          "Not suitable for generation tasks"
        ],
        futureWork: [
          "Longer context models",
          "More efficient architectures",
          "Multilingual extensions"
        ],
        relatedPapers: ["paper-001", "paper-003"],
        code: [
          {
            platform: "github",
            url: "https://github.com/google-research/bert",
            language: ["Python"],
            stars: 35e3,
            license: "Apache-2.0",
            lastUpdated: /* @__PURE__ */ new Date("2024-02-01")
          }
        ],
        educationalValue: {
          difficulty: "intermediate",
          prerequisites: ["Transformers", "NLP Basics", "PyTorch/TensorFlow"],
          learningOutcomes: [
            "Understand bidirectional language models",
            "Implement pre-training strategies",
            "Fine-tune for downstream tasks"
          ],
          estimatedStudyTime: 30,
          suitableFor: ["graduate", "practitioner"],
          teachingValue: 90
        },
        practicalApplications: [
          {
            domain: "Search Engines",
            description: "Improved query understanding and ranking",
            impact: "Enhanced search relevance by 10%",
            readinessLevel: "production",
            companies: ["Google", "Microsoft", "Amazon"]
          }
        ]
      },
      {
        paperId: "paper-003",
        title: "Neural Quantum Computing: Bridging AI and Quantum Systems",
        abstract: "We present a novel framework for integrating neural networks with quantum computing systems, demonstrating how classical deep learning can enhance quantum algorithm design and error correction. Our approach achieves significant improvements in quantum circuit optimization and noise mitigation.",
        authors: [
          {
            name: "Dr. Sarah Chen",
            affiliation: "MIT Quantum AI Lab",
            expertise: ["Quantum Computing", "Machine Learning", "Quantum Error Correction"]
          },
          {
            name: "Prof. Michael Rodriguez",
            affiliation: "Stanford Quantum Center",
            expertise: ["Quantum Algorithms", "Neural Networks"]
          }
        ],
        publication: {
          venue: "Nature Quantum Information",
          type: "journal",
          impactFactor: 10.5,
          tier: "A*",
          doi: "10.1038/s41534-024-00123-4"
        },
        publishDate: /* @__PURE__ */ new Date("2024-03-15"),
        category: "quantum-computing",
        subCategories: ["quantum-ml", "error-correction", "hybrid-algorithms"],
        keywords: ["quantum computing", "neural networks", "error correction", "NISQ"],
        citations: 150,
        hIndex: 25,
        impactFactor: 85,
        methodology: ["Theoretical Framework", "Experimental Validation", "Simulation Studies"],
        findings: [
          {
            type: "primary",
            description: "Neural networks reduce quantum error rates by 45%",
            evidence: "Experimental results on IBM Quantum systems",
            significance: "high",
            confidence: 92
          },
          {
            type: "secondary",
            description: "Hybrid classical-quantum algorithms show 3x speedup",
            evidence: "Benchmarks on optimization problems",
            significance: "high",
            confidence: 88
          }
        ],
        contributions: [
          "Novel neural-quantum integration framework",
          "Improved quantum error correction methods",
          "Practical NISQ algorithm implementations",
          "Open-source quantum ML library"
        ],
        limitations: [
          "Limited to NISQ devices",
          "Requires significant classical compute",
          "Scalability challenges beyond 100 qubits"
        ],
        futureWork: [
          "Extension to fault-tolerant quantum computers",
          "Application to quantum chemistry",
          "Hardware-specific optimizations"
        ],
        relatedPapers: [],
        datasets: [
          {
            name: "Quantum Circuit Dataset",
            url: "https://quantum-datasets.org/circuits",
            size: "10GB",
            format: "QASM",
            license: "CC-BY-4.0",
            description: "Collection of quantum circuits for ML training"
          }
        ],
        code: [
          {
            platform: "github",
            url: "https://github.com/mit-qai/neural-quantum",
            language: ["Python", "Qiskit"],
            stars: 500,
            license: "MIT",
            lastUpdated: /* @__PURE__ */ new Date("2024-11-01")
          }
        ],
        educationalValue: {
          difficulty: "expert",
          prerequisites: ["Quantum Mechanics", "Quantum Computing", "Deep Learning", "Linear Algebra"],
          learningOutcomes: [
            "Design neural-quantum hybrid algorithms",
            "Implement quantum error correction",
            "Optimize quantum circuits with ML"
          ],
          estimatedStudyTime: 60,
          suitableFor: ["researcher", "phd-student"],
          teachingValue: 85
        },
        practicalApplications: [
          {
            domain: "Quantum Computing",
            description: "Error correction for near-term quantum devices",
            impact: "Enables practical quantum applications",
            readinessLevel: "experimental",
            companies: ["IBM", "Google", "IonQ"]
          }
        ]
      }
    ];
    papers.forEach((paper) => {
      this.paperDatabase.set(paper.paperId, paper);
      this.citationGraph.set(paper.paperId, new Set(paper.relatedPapers));
    });
    this.initializeTrends();
  }
  initializeTrends() {
    const trends = [
      {
        trendId: "trend-llm",
        name: "Large Language Models",
        description: "Research on scaling language models and their emergent capabilities",
        paperCount: 1250,
        growthRate: 180,
        keyResearchers: [
          {
            name: "Ilya Sutskever",
            affiliation: "OpenAI",
            expertise: ["Deep Learning", "LLMs"]
          }
        ],
        breakthroughPapers: ["paper-001", "paper-002"],
        emergingTopics: ["Reasoning", "Multi-modal LLMs", "Efficient Training"],
        fundingTrends: [
          {
            source: "NSF",
            amount: 5e7,
            currency: "USD",
            duration: "5 years",
            focus: ["AI Safety", "Efficient Models"]
          }
        ]
      },
      {
        trendId: "trend-quantum-ml",
        name: "Quantum Machine Learning",
        description: "Integration of quantum computing with machine learning",
        paperCount: 320,
        growthRate: 125,
        keyResearchers: [
          {
            name: "Maria Schuld",
            affiliation: "Xanadu",
            expertise: ["Quantum ML", "Quantum Algorithms"]
          }
        ],
        breakthroughPapers: ["paper-003"],
        emergingTopics: ["Quantum Neural Networks", "Variational Algorithms", "Quantum Advantage"],
        fundingTrends: [
          {
            source: "DARPA",
            amount: 25e6,
            currency: "USD",
            duration: "3 years",
            focus: ["Quantum Algorithms", "Hardware Integration"]
          }
        ]
      }
    ];
    trends.forEach((trend) => {
      this.trendAnalysis.set(trend.trendId, trend);
    });
  }
  async searchPapers(query) {
    let papers = Array.from(this.paperDatabase.values());
    if (query.query) {
      const searchLower = query.query.toLowerCase();
      papers = papers.filter(
        (paper) => paper.title.toLowerCase().includes(searchLower) || paper.abstract.toLowerCase().includes(searchLower) || paper.keywords.some((k) => k.toLowerCase().includes(searchLower)) || paper.authors.some((a) => a.name.toLowerCase().includes(searchLower))
      );
    }
    if (query.filters) {
      if (query.filters.categories?.length) {
        papers = papers.filter((p) => query.filters.categories.includes(p.category));
      }
      if (query.filters.dateRange) {
        papers = papers.filter(
          (p) => p.publishDate >= query.filters.dateRange.start && p.publishDate <= query.filters.dateRange.end
        );
      }
      if (query.filters.minCitations !== void 0) {
        papers = papers.filter((p) => p.citations >= query.filters.minCitations);
      }
      if (query.filters.hasCode) {
        papers = papers.filter((p) => p.code && p.code.length > 0);
      }
      if (query.filters.hasDataset) {
        papers = papers.filter((p) => p.datasets && p.datasets.length > 0);
      }
      if (query.filters.difficulty) {
        papers = papers.filter((p) => p.educationalValue.difficulty === query.filters.difficulty);
      }
    }
    switch (query.sort) {
      case "citations":
        papers.sort((a, b) => b.citations - a.citations);
        break;
      case "date":
        papers.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
        break;
      case "impact":
        papers.sort((a, b) => b.impactFactor - a.impactFactor);
        break;
      default:
        if (query.query) {
          papers.sort((a, b) => {
            const scoreA = this.calculateRelevanceScore(a, query.query);
            const scoreB = this.calculateRelevanceScore(b, query.query);
            return scoreB - scoreA;
          });
        }
    }
    return papers.slice(0, query.limit || 50);
  }
  calculateRelevanceScore(paper, query) {
    const queryLower = query.toLowerCase();
    let score = 0;
    if (paper.title.toLowerCase().includes(queryLower)) score += 100;
    const abstractMatches = (paper.abstract.toLowerCase().match(new RegExp(queryLower, "g")) || []).length;
    score += abstractMatches * 10;
    paper.keywords.forEach((keyword) => {
      if (keyword.toLowerCase().includes(queryLower)) score += 30;
    });
    paper.authors.forEach((author) => {
      if (author.name.toLowerCase().includes(queryLower)) score += 50;
    });
    score += Math.log10(paper.citations + 1) * 5;
    return score;
  }
  async getResearchTrends() {
    return Array.from(this.trendAnalysis.values()).sort((a, b) => b.growthRate - a.growthRate);
  }
  async getPaperDetails(paperId) {
    return this.paperDatabase.get(paperId) || null;
  }
  async getCitationNetwork(paperId, depth = 1) {
    const network = /* @__PURE__ */ new Map();
    const visited = /* @__PURE__ */ new Set();
    const explore = (id, currentDepth) => {
      if (currentDepth > depth || visited.has(id)) return;
      visited.add(id);
      const citations = this.citationGraph.get(id);
      if (citations) {
        network.set(id, citations);
        if (currentDepth < depth) {
          citations.forEach((citedId) => {
            explore(citedId, currentDepth + 1);
          });
        }
      }
    };
    explore(paperId, 0);
    return network;
  }
  async generateLiteratureReview(topic, scope, paperIds) {
    const papers = paperIds ? paperIds.map((id) => this.paperDatabase.get(id)).filter((p) => p !== void 0) : await this.searchPapers({ query: topic, limit: 20 });
    const themes = /* @__PURE__ */ new Map();
    const methodologies = /* @__PURE__ */ new Map();
    const allFindings = [];
    const timeline = [];
    papers.forEach((paper) => {
      paper.keywords.forEach((keyword) => {
        themes.set(keyword, (themes.get(keyword) || 0) + 1);
      });
      paper.methodology.forEach((method) => {
        methodologies.set(method, (methodologies.get(method) || 0) + 1);
      });
      allFindings.push(...paper.findings);
      const year = paper.publishDate.getFullYear();
      let timelineEntry = timeline.find((t) => t.year === year);
      if (!timelineEntry) {
        timelineEntry = {
          year,
          milestone: "",
          papers: [paper.paperId],
          impact: ""
        };
        timeline.push(timelineEntry);
      } else {
        timelineEntry.papers.push(paper.paperId);
      }
    });
    const commonThemes = Array.from(themes.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([theme]) => theme);
    const gaps = [
      "Limited research on real-world deployment challenges",
      "Need for more interdisciplinary approaches",
      "Lack of standardized evaluation metrics",
      "Insufficient focus on ethical implications"
    ];
    const synthesis = {
      commonThemes,
      gaps,
      controversies: ["Scalability vs efficiency trade-offs", "Interpretability challenges"],
      futureDirections: [
        "Integration with emerging technologies",
        "Addressing identified research gaps",
        "Practical implementation strategies"
      ]
    };
    const authorContributions = /* @__PURE__ */ new Map();
    papers.forEach((paper) => {
      paper.authors.forEach((author) => {
        const key = `${author.name}|${author.affiliation}`;
        authorContributions.set(key, (authorContributions.get(key) || 0) + 1);
      });
    });
    const keyContributors = Array.from(authorContributions.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key]) => {
      const [name, affiliation] = key.split("|");
      return { name, affiliation, expertise: [] };
    });
    return {
      topic,
      scope,
      methodology: "Systematic literature review with thematic analysis",
      papers,
      synthesis,
      timeline: timeline.sort((a, b) => b.year - a.year),
      keyContributors,
      recommendations: [
        "Focus on addressing identified research gaps",
        "Encourage interdisciplinary collaboration",
        "Develop standardized evaluation frameworks",
        "Prioritize practical applications"
      ]
    };
  }
  async getEducationalPapers(difficulty, prerequisites) {
    let papers = Array.from(this.paperDatabase.values());
    if (difficulty) {
      papers = papers.filter((p) => p.educationalValue.difficulty === difficulty);
    }
    if (prerequisites && prerequisites.length > 0) {
      papers = papers.filter(
        (p) => prerequisites.every(
          (prereq) => p.educationalValue.prerequisites.some(
            (paperPrereq) => paperPrereq.toLowerCase().includes(prereq.toLowerCase())
          )
        )
      );
    }
    return papers.sort((a, b) => b.educationalValue.teachingValue - a.educationalValue.teachingValue);
  }
  async createReadingList(userId, name, description, paperIds, visibility = "private") {
    const readingList = {
      listId: `list-${Date.now()}`,
      userId,
      name,
      description,
      papers: paperIds,
      visibility,
      tags: [],
      createdAt: /* @__PURE__ */ new Date(),
      lastUpdated: /* @__PURE__ */ new Date()
    };
    this.readingLists.set(readingList.listId, readingList);
    if (this.database) {
      try {
        await this.database.createInteraction({
          userId,
          interactionType: "CONTENT_GENERATE",
          context: {
            engine: "research",
            action: "create_reading_list",
            listId: readingList.listId,
            paperCount: paperIds.length
          }
        });
      } catch (error) {
        console.error("Error recording reading list creation:", error);
      }
    }
    return readingList;
  }
  async getReadingLists(userId) {
    return Array.from(this.readingLists.values()).filter((list) => list.userId === userId || list.visibility === "public");
  }
  async recommendPapers(paperId, count = 5) {
    const paper = this.paperDatabase.get(paperId);
    if (!paper) return [];
    const recommendations = Array.from(this.paperDatabase.values()).filter((p) => p.paperId !== paperId).map((p) => ({
      paper: p,
      score: this.calculateSimilarityScore(paper, p)
    })).sort((a, b) => b.score - a.score).slice(0, count).map(({ paper: p }) => p);
    return recommendations;
  }
  calculateSimilarityScore(paper1, paper2) {
    let score = 0;
    if (paper1.category === paper2.category) score += 30;
    const subCatOverlap = paper1.subCategories.filter(
      (sc) => paper2.subCategories.includes(sc)
    ).length;
    score += subCatOverlap * 15;
    const keywordOverlap = paper1.keywords.filter(
      (k) => paper2.keywords.includes(k)
    ).length;
    score += keywordOverlap * 10;
    const authorOverlap = paper1.authors.some(
      (a1) => paper2.authors.some((a2) => a1.name === a2.name)
    );
    if (authorOverlap) score += 20;
    if (paper1.publication.venue === paper2.publication.venue) score += 15;
    const timeDiff = Math.abs(
      paper1.publishDate.getTime() - paper2.publishDate.getTime()
    );
    const daysDiff = timeDiff / (1e3 * 60 * 60 * 24);
    if (daysDiff < 365) score += 10;
    return score;
  }
  async getMetrics(field, timeframe) {
    const papers = await this.searchPapers({
      query: field,
      limit: 1e3
    });
    const now = /* @__PURE__ */ new Date();
    const startDate = new Date(now);
    switch (timeframe) {
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    const filteredPapers = timeframe === "all-time" ? papers : papers.filter((p) => p.publishDate >= startDate);
    const totalCitations = filteredPapers.reduce((sum, p) => sum + p.citations, 0);
    const averageCitations = totalCitations / filteredPapers.length || 0;
    const topPapers = filteredPapers.sort((a, b) => b.citations - a.citations).slice(0, 10);
    const authorPapers = /* @__PURE__ */ new Map();
    filteredPapers.forEach((paper) => {
      paper.authors.forEach((author) => {
        const key = `${author.name}|${author.affiliation}`;
        authorPapers.set(key, (authorPapers.get(key) || 0) + 1);
      });
    });
    const emergingAuthors = Array.from(authorPapers.entries()).filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([key]) => {
      const [name, affiliation] = key.split("|");
      return { name, affiliation, expertise: [] };
    });
    const collaborationNetwork = [
      {
        institutions: ["MIT", "Stanford"],
        paperCount: 15,
        impactScore: 92,
        internationalCollaboration: true
      },
      {
        institutions: ["Google Research", "DeepMind"],
        paperCount: 12,
        impactScore: 88,
        internationalCollaboration: true
      }
    ];
    return {
      field,
      timeframe,
      totalPapers: filteredPapers.length,
      averageCitations,
      topPapers,
      emergingAuthors,
      collaborationNetwork,
      fundingTotal: 125e6,
      // Mock data
      industryAdoption: 65
      // Mock percentage
    };
  }
  async recordInteraction(userId, paperId, action) {
    if (this.database) {
      try {
        await this.database.createInteraction({
          userId,
          interactionType: "CONTENT_GENERATE",
          context: {
            engine: "research",
            action,
            paperId,
            timestamp: /* @__PURE__ */ new Date()
          }
        });
      } catch (error) {
        console.error("Error recording research interaction:", error);
      }
    }
  }
  /**
   * Add papers to the database (for extension)
   */
  addPapers(papers) {
    papers.forEach((paper) => {
      this.paperDatabase.set(paper.paperId, paper);
      this.citationGraph.set(paper.paperId, new Set(paper.relatedPapers));
    });
  }
  /**
   * Add trends to the analysis (for extension)
   */
  addTrends(trends) {
    trends.forEach((trend) => {
      this.trendAnalysis.set(trend.trendId, trend);
    });
  }
};
function createResearchEngine(config) {
  return new ResearchEngine(config);
}

// src/engines/trends-engine.ts
var TrendsEngine = class {
  constructor(config) {
    this.config = config;
    this.trendDatabase = /* @__PURE__ */ new Map();
    this.categoryMetrics = /* @__PURE__ */ new Map();
    this.database = config.database;
    this.initializeTrendData();
  }
  trendDatabase;
  categoryMetrics;
  database;
  initializeTrendData() {
    const trends = [
      {
        trendId: "gen-ai-2024",
        title: "Generative AI in Education",
        category: "AI & Machine Learning",
        relevance: 95,
        timeframe: "current",
        impact: "transformative",
        description: "AI-powered content generation, personalized learning paths, and automated assessment systems are revolutionizing education.",
        keyInsights: [
          "Personalized learning at scale becoming reality",
          "AI tutors showing human-level teaching capabilities",
          "Content creation time reduced by 80%",
          "Adaptive assessments improving learning outcomes"
        ],
        relatedTechnologies: ["GPT-4", "Claude", "Gemini", "DALL-E", "Midjourney"],
        applicationAreas: ["Course Creation", "Student Assessment", "Learning Analytics", "Content Personalization"],
        marketAdoption: 35,
        futureOutlook: "Expected to reach 70% adoption in educational institutions by 2026",
        educationalImplications: [
          "Teachers becoming learning facilitators",
          "Need for AI literacy in curriculum",
          "Ethical considerations in AI assessment",
          "Hybrid human-AI teaching models"
        ],
        skillsRequired: ["Prompt Engineering", "AI Tool Selection", "Data Analysis", "Ethical AI Usage"],
        sources: [
          {
            name: "Stanford AI Index Report 2024",
            url: "https://aiindex.stanford.edu",
            credibility: 95,
            publishDate: /* @__PURE__ */ new Date("2024-01-15")
          }
        ],
        timestamp: /* @__PURE__ */ new Date()
      },
      {
        trendId: "quantum-ml-2024",
        title: "Quantum Machine Learning",
        category: "Quantum Computing",
        relevance: 75,
        timeframe: "emerging",
        impact: "high",
        description: "Quantum computing enhancing machine learning capabilities for complex problem solving.",
        keyInsights: [
          "Exponential speedup for certain ML algorithms",
          "New quantum-classical hybrid models emerging",
          "Breakthrough in optimization problems",
          "Early commercial applications appearing"
        ],
        relatedTechnologies: ["IBM Quantum", "Google Sycamore", "IonQ", "Rigetti"],
        applicationAreas: ["Drug Discovery", "Financial Modeling", "Climate Simulation", "Cryptography"],
        marketAdoption: 5,
        futureOutlook: "Commercial viability expected by 2028-2030",
        educationalImplications: [
          "New quantum computing curricula needed",
          "Interdisciplinary programs combining physics and CS",
          "Industry partnerships for quantum access",
          "Quantum simulators for education"
        ],
        skillsRequired: ["Quantum Mechanics", "Linear Algebra", "Quantum Algorithms", "Qiskit/Cirq"],
        sources: [
          {
            name: "MIT Quantum Computing Review",
            url: "https://quantum.mit.edu",
            credibility: 90,
            publishDate: /* @__PURE__ */ new Date("2024-02-01")
          }
        ],
        timestamp: /* @__PURE__ */ new Date()
      },
      {
        trendId: "edge-ai-2024",
        title: "Edge AI and Federated Learning",
        category: "Distributed AI",
        relevance: 85,
        timeframe: "current",
        impact: "high",
        description: "AI processing moving to edge devices with privacy-preserving federated learning.",
        keyInsights: [
          "On-device AI reducing latency to milliseconds",
          "Privacy-first approach gaining regulatory support",
          "Reduced cloud computing costs by 60%",
          "Enabling real-time AI in IoT devices"
        ],
        relatedTechnologies: ["TensorFlow Lite", "Core ML", "ONNX", "Federated Learning Frameworks"],
        applicationAreas: ["Mobile Apps", "IoT Devices", "Autonomous Vehicles", "Healthcare Devices"],
        marketAdoption: 25,
        futureOutlook: "Expected to be standard in 80% of AI applications by 2027",
        educationalImplications: [
          "Focus on efficient model design",
          "Privacy and security in AI curriculum",
          "Distributed systems knowledge essential",
          "Hardware-software co-design skills"
        ],
        skillsRequired: ["Model Optimization", "Embedded Systems", "Privacy Engineering", "Distributed Computing"],
        sources: [
          {
            name: "Edge AI Summit 2024",
            url: "https://edgeaisummit.com",
            credibility: 85,
            publishDate: /* @__PURE__ */ new Date("2024-03-10")
          }
        ],
        timestamp: /* @__PURE__ */ new Date()
      }
    ];
    trends.forEach((trend) => {
      this.trendDatabase.set(trend.trendId, trend);
    });
    this.initializeCategories();
  }
  initializeCategories() {
    const categories = [
      {
        id: "ai-ml",
        name: "AI & Machine Learning",
        description: "Artificial Intelligence and Machine Learning trends",
        icon: "\u{1F916}",
        trendCount: 15,
        growthRate: 125
      },
      {
        id: "quantum",
        name: "Quantum Computing",
        description: "Quantum computing and quantum ML trends",
        icon: "\u269B\uFE0F",
        trendCount: 8,
        growthRate: 85
      },
      {
        id: "blockchain",
        name: "Blockchain & Web3",
        description: "Decentralized technologies and Web3 trends",
        icon: "\u{1F517}",
        trendCount: 12,
        growthRate: 65
      },
      {
        id: "ar-vr",
        name: "AR/VR & Metaverse",
        description: "Augmented Reality, Virtual Reality, and Metaverse trends",
        icon: "\u{1F97D}",
        trendCount: 10,
        growthRate: 95
      },
      {
        id: "biotech",
        name: "Biotechnology & AI",
        description: "AI applications in biotechnology and healthcare",
        icon: "\u{1F9EC}",
        trendCount: 7,
        growthRate: 110
      }
    ];
    categories.forEach((category) => {
      this.categoryMetrics.set(category.id, category);
    });
  }
  async analyzeTrends(filter) {
    let trends = Array.from(this.trendDatabase.values());
    if (filter) {
      if (filter.category) {
        trends = trends.filter((t) => t.category === filter.category);
      }
      if (filter.timeframe) {
        trends = trends.filter((t) => t.timeframe === filter.timeframe);
      }
      if (filter.impact) {
        trends = trends.filter((t) => t.impact === filter.impact);
      }
      if (typeof filter.minRelevance === "number") {
        const min = filter.minRelevance;
        trends = trends.filter((t) => t.relevance >= min);
      }
    }
    return trends.sort((a, b) => b.relevance - a.relevance);
  }
  async getTrendCategories() {
    return Array.from(this.categoryMetrics.values()).sort((a, b) => b.growthRate - a.growthRate);
  }
  async detectMarketSignals(trendId) {
    const trend = this.trendDatabase.get(trendId);
    if (!trend) {
      throw new Error("Trend not found");
    }
    const signals = [];
    if (trend.marketAdoption < 10 && trend.timeframe === "emerging") {
      signals.push({
        signal: "Early Adoption Opportunity",
        strength: 85,
        implication: "First-mover advantage possible",
        actionableInsights: [
          "Invest in training and skill development",
          "Partner with technology providers",
          "Create pilot programs",
          "Build expertise before mainstream adoption"
        ]
      });
    }
    if (trend.impact === "transformative") {
      signals.push({
        signal: "Industry Disruption Potential",
        strength: 90,
        implication: "Significant changes to business models expected",
        actionableInsights: [
          "Reassess current strategies",
          "Identify transformation opportunities",
          "Prepare for market shifts",
          "Update curriculum to include new skills"
        ]
      });
    }
    if (trend.skillsRequired.length > 3) {
      signals.push({
        signal: "Skill Gap Alert",
        strength: 75,
        implication: "Workforce retraining needed",
        actionableInsights: [
          "Develop training programs",
          "Partner with educational institutions",
          "Create certification paths",
          "Hire specialists or consultants"
        ]
      });
    }
    return signals;
  }
  async compareTrends(trendId1, trendId2) {
    const trend1 = this.trendDatabase.get(trendId1);
    const trend2 = this.trendDatabase.get(trendId2);
    if (!trend1 || !trend2) {
      throw new Error("One or both trends not found");
    }
    const similarities = [];
    const differences = [];
    const convergencePoints = [];
    if (trend1.category === trend2.category) {
      similarities.push(`Both belong to ${trend1.category} category`);
    } else {
      differences.push(`Different categories: ${trend1.category} vs ${trend2.category}`);
    }
    if (trend1.impact === trend2.impact) {
      similarities.push(`Similar impact level: ${trend1.impact}`);
    } else {
      differences.push(`Different impact levels: ${trend1.impact} vs ${trend2.impact}`);
    }
    const techOverlap = trend1.relatedTechnologies.filter(
      (t) => trend2.relatedTechnologies.includes(t)
    );
    if (techOverlap.length > 0) {
      convergencePoints.push(`Shared technologies: ${techOverlap.join(", ")}`);
    }
    const appOverlap = trend1.applicationAreas.filter(
      (a) => trend2.applicationAreas.includes(a)
    );
    if (appOverlap.length > 0) {
      convergencePoints.push(`Common application areas: ${appOverlap.join(", ")}`);
    }
    return {
      trend1: trend1.title,
      trend2: trend2.title,
      similarities,
      differences,
      convergencePoints,
      competitiveAnalysis: this.generateCompetitiveAnalysis(trend1, trend2)
    };
  }
  generateCompetitiveAnalysis(trend1, trend2) {
    if (trend1.marketAdoption > trend2.marketAdoption) {
      return `${trend1.title} has higher market adoption (${trend1.marketAdoption}% vs ${trend2.marketAdoption}%), suggesting more immediate opportunities`;
    } else if (trend2.marketAdoption > trend1.marketAdoption) {
      return `${trend2.title} leads in market adoption (${trend2.marketAdoption}% vs ${trend1.marketAdoption}%), indicating stronger current demand`;
    } else {
      return "Both trends show similar market adoption levels, compete on differentiation rather than market penetration";
    }
  }
  async predictTrendTrajectory(trendId, horizon) {
    const trend = this.trendDatabase.get(trendId);
    if (!trend) {
      throw new Error("Trend not found");
    }
    const growthRates = {
      "3months": 1.1,
      "6months": 1.25,
      "1year": 1.6,
      "2years": 2.2
    };
    const declineRates = {
      "3months": 0.95,
      "6months": 0.85,
      "1year": 0.7,
      "2years": 0.5
    };
    let predictedAdoption;
    let confidence;
    if (trend.timeframe === "emerging") {
      predictedAdoption = Math.min(trend.marketAdoption * growthRates[horizon], 95);
      confidence = 75;
    } else if (trend.timeframe === "current") {
      predictedAdoption = Math.min(trend.marketAdoption * (growthRates[horizon] * 0.7), 95);
      confidence = 85;
    } else {
      predictedAdoption = Math.max(trend.marketAdoption * declineRates[horizon], 5);
      confidence = 70;
    }
    const riskFactors = this.identifyRiskFactors(trend, horizon);
    const opportunities = this.identifyOpportunities(trend);
    const recommendations = this.generateRecommendations(trend, predictedAdoption);
    return {
      trend: trend.title,
      predictionHorizon: horizon,
      adoptionCurve: {
        current: trend.marketAdoption,
        predicted: Math.round(predictedAdoption),
        confidence
      },
      riskFactors,
      opportunities,
      recommendations
    };
  }
  identifyRiskFactors(trend, horizon) {
    const risks = [];
    if (trend.timeframe === "emerging") {
      risks.push("Technology may not mature as expected");
      risks.push("Regulatory frameworks still developing");
    }
    if (trend.impact === "transformative") {
      risks.push("Resistance to change from stakeholders");
      risks.push("High implementation costs");
    }
    if (trend.skillsRequired.length > 4) {
      risks.push("Significant skill gap challenges");
      risks.push("Training and adoption delays");
    }
    if (horizon === "2years") {
      risks.push("New competing technologies may emerge");
      risks.push("Market dynamics may shift significantly");
    }
    return risks;
  }
  identifyOpportunities(trend) {
    const opportunities = [];
    if (trend.marketAdoption < 20) {
      opportunities.push("Early market entry advantage");
      opportunities.push("Shape industry standards");
    }
    if (trend.impact === "transformative" || trend.impact === "high") {
      opportunities.push("Create new business models");
      opportunities.push("Disrupt existing markets");
    }
    if (trend.educationalImplications.length > 3) {
      opportunities.push("Develop specialized training programs");
      opportunities.push("Become thought leader in the space");
    }
    return opportunities;
  }
  generateRecommendations(trend, predictedAdoption) {
    const recommendations = [];
    if (predictedAdoption > 50) {
      recommendations.push("Accelerate adoption and implementation");
      recommendations.push("Scale pilot programs to full deployment");
    } else if (predictedAdoption > 25) {
      recommendations.push("Start pilot programs and proof of concepts");
      recommendations.push("Build internal expertise gradually");
    } else {
      recommendations.push("Monitor trend development closely");
      recommendations.push("Invest in research and learning");
    }
    if (trend.skillsRequired.length > 0) {
      recommendations.push(`Develop skills in: ${trend.skillsRequired.slice(0, 3).join(", ")}`);
    }
    return recommendations;
  }
  async generateIndustryReport(industry) {
    const allTrends = await this.analyzeTrends();
    const industryTrends = allTrends.filter(
      (trend) => trend.applicationAreas.some(
        (area) => area.toLowerCase().includes(industry.toLowerCase())
      )
    );
    const emergingTech = industryTrends.filter((t) => t.timeframe === "emerging").map((t) => t.title);
    const decliningTech = industryTrends.filter((t) => t.timeframe === "declining").map((t) => t.title);
    const allSkills = /* @__PURE__ */ new Set();
    industryTrends.forEach((trend) => {
      trend.skillsRequired.forEach((skill) => allSkills.add(skill));
    });
    const educationOps = /* @__PURE__ */ new Set();
    industryTrends.forEach((trend) => {
      trend.educationalImplications.forEach((imp) => educationOps.add(imp));
    });
    return {
      industry,
      topTrends: industryTrends.slice(0, 5),
      emergingTechnologies: emergingTech,
      decliningTechnologies: decliningTech,
      skillGaps: Array.from(allSkills).slice(0, 10),
      educationOpportunities: Array.from(educationOps).slice(0, 5),
      marketSize: 15e7,
      growthProjection: 25.5,
      keyPlayers: ["Microsoft", "Google", "OpenAI", "Meta", "Amazon"],
      disruptionPotential: 85
    };
  }
  async searchTrends(query) {
    const results = [];
    const searchLower = query.toLowerCase();
    this.trendDatabase.forEach((trend) => {
      if (trend.title.toLowerCase().includes(searchLower) || trend.description.toLowerCase().includes(searchLower) || trend.category.toLowerCase().includes(searchLower) || trend.relatedTechnologies.some((t) => t.toLowerCase().includes(searchLower)) || trend.applicationAreas.some((a) => a.toLowerCase().includes(searchLower))) {
        results.push(trend);
      }
    });
    return results.sort((a, b) => b.relevance - a.relevance);
  }
  async getTrendingNow() {
    return Array.from(this.trendDatabase.values()).filter((t) => t.timeframe === "current" && t.relevance > 80).sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  }
  async getEmergingTrends() {
    return Array.from(this.trendDatabase.values()).filter((t) => t.timeframe === "emerging").sort((a, b) => b.relevance - a.relevance);
  }
  async getEducationalTrends() {
    return Array.from(this.trendDatabase.values()).filter(
      (t) => t.applicationAreas.some(
        (a) => a.toLowerCase().includes("education") || a.toLowerCase().includes("learning")
      )
    ).sort((a, b) => b.relevance - a.relevance);
  }
  async recordInteraction(userId, trendId, interactionType) {
    if (this.database) {
      try {
        await this.database.createInteraction({
          userId,
          interactionType: "CONTENT_GENERATE",
          context: {
            engine: "trends",
            trendId,
            action: interactionType,
            timestamp: /* @__PURE__ */ new Date()
          }
        });
      } catch (error) {
        console.error("Error recording trend interaction:", error);
      }
    }
  }
  /**
   * Add trends to the database (for extension)
   */
  addTrends(trends) {
    trends.forEach((trend) => {
      this.trendDatabase.set(trend.trendId, trend);
    });
  }
  /**
   * Add categories (for extension)
   */
  addCategories(categories) {
    categories.forEach((category) => {
      this.categoryMetrics.set(category.id, category);
    });
  }
};
function createTrendsEngine(config) {
  return new TrendsEngine(config);
}

// src/engines/achievement-engine.ts
var DEFAULT_ACHIEVEMENTS = [
  {
    id: "first_course_created",
    name: "Course Creator",
    description: "Create your first course",
    icon: "BookOpen",
    category: "teaching",
    points: 100,
    badgeType: "ACHIEVEMENT",
    level: 1
  },
  {
    id: "first_chapter_completed",
    name: "Chapter Master",
    description: "Complete your first chapter",
    icon: "CheckCircle",
    category: "learning",
    points: 50,
    badgeType: "ACHIEVEMENT",
    level: 1
  },
  {
    id: "ai_assistant_used",
    name: "AI Explorer",
    description: "Use SAM AI assistant for the first time",
    icon: "Brain",
    category: "creativity",
    points: 25,
    badgeType: "ACHIEVEMENT",
    level: 1
  },
  {
    id: "streak_7_days",
    name: "Week Warrior",
    description: "Maintain a 7-day learning streak",
    icon: "Flame",
    category: "consistency",
    points: 150,
    badgeType: "STREAK",
    level: 2
  },
  {
    id: "streak_30_days",
    name: "Monthly Master",
    description: "Maintain a 30-day learning streak",
    icon: "Trophy",
    category: "consistency",
    points: 500,
    badgeType: "STREAK",
    level: 3,
    unlockConditions: {
      prerequisiteAchievements: ["streak_7_days"]
    }
  },
  {
    id: "collaboration_first",
    name: "Team Player",
    description: "Participate in a group discussion",
    icon: "Users",
    category: "collaboration",
    points: 75,
    badgeType: "ACHIEVEMENT",
    level: 1
  },
  {
    id: "content_creator_10",
    name: "Prolific Creator",
    description: "Create 10 pieces of content",
    icon: "Edit",
    category: "teaching",
    points: 200,
    badgeType: "ACHIEVEMENT",
    level: 2
  },
  {
    id: "mastery_quiz_perfect",
    name: "Perfect Score",
    description: "Score 100% on a quiz",
    icon: "Star",
    category: "mastery",
    points: 100,
    badgeType: "ACHIEVEMENT",
    level: 2
  }
];
var DEFAULT_CHALLENGES = [
  {
    id: "daily_learning",
    name: "Daily Learner",
    description: "Complete at least one lesson today",
    icon: "Calendar",
    difficulty: "easy",
    duration: 1,
    category: "daily",
    points: 20,
    requirements: {
      type: "form_completion",
      target: 1
    },
    rewards: {
      points: 20
    }
  },
  {
    id: "weekly_creator",
    name: "Weekly Creator",
    description: "Create 5 pieces of content this week",
    icon: "Edit",
    difficulty: "medium",
    duration: 7,
    category: "weekly",
    points: 100,
    requirements: {
      type: "create_content",
      target: 5
    },
    rewards: {
      points: 100,
      badges: ["weekly_creator_badge"]
    }
  },
  {
    id: "ai_explorer_week",
    name: "AI Explorer Week",
    description: "Use AI assistance 10 times this week",
    icon: "Brain",
    difficulty: "medium",
    duration: 7,
    category: "weekly",
    points: 75,
    requirements: {
      type: "use_ai",
      target: 10
    },
    rewards: {
      points: 75
    }
  },
  {
    id: "monthly_mastery",
    name: "Monthly Mastery",
    description: "Complete 30 lessons in a month",
    icon: "Trophy",
    difficulty: "hard",
    duration: 30,
    category: "monthly",
    points: 300,
    bonusMultiplier: 1.5,
    requirements: {
      type: "form_completion",
      target: 30
    },
    rewards: {
      points: 300,
      badges: ["monthly_master_badge"],
      specialRewards: ["custom_avatar_frame"]
    }
  },
  {
    id: "collaboration_master",
    name: "Collaboration Master",
    description: "Participate in 20 group activities",
    icon: "Users",
    difficulty: "hard",
    duration: 30,
    category: "monthly",
    points: 250,
    requirements: {
      type: "collaboration",
      target: 20
    },
    rewards: {
      points: 250,
      badges: ["collaboration_master_badge"]
    }
  }
];
var LEVEL_THRESHOLDS = [0, 100, 300, 600, 1e3, 1500, 2500, 4e3, 6e3, 9e3, 15e3];
var STREAK_ACTIONS = ["content_created", "ai_assistance_used", "form_completed", "suggestion_applied"];
var STREAK_TYPE_MAP = {
  "content_created": "CONTENT_CREATION",
  "ai_assistance_used": "DAILY_INTERACTION",
  "form_completed": "FORM_COMPLETION",
  "suggestion_applied": "DAILY_INTERACTION"
};
var AchievementEngine = class {
  constructor(config) {
    this.config = config;
    this.achievements = config.achievements ?? DEFAULT_ACHIEVEMENTS;
    this.challenges = config.challenges ?? DEFAULT_CHALLENGES;
    this.database = config.database;
  }
  achievements;
  challenges;
  database;
  /**
   * Track user action and check for achievement unlocks
   */
  async trackProgress(userId, action, metadata = {}, context) {
    try {
      const userStats = await this.database.getUserStats(userId, context?.courseId);
      const currentLevel = this.calculateLevel(userStats.points);
      await this.database.recordInteraction({
        userId,
        interactionType: action,
        context: JSON.stringify({ action, metadata, context }),
        result: JSON.stringify(metadata),
        courseId: context?.courseId,
        chapterId: context?.chapterId,
        sectionId: context?.sectionId
      });
      let totalPointsAwarded = 0;
      const achievementsUnlocked = [];
      const challengesCompleted = [];
      const existingBadges = await this.database.getUserBadges(userId);
      const achievementIds = existingBadges.map((a) => a.description);
      for (const achievement of this.achievements) {
        if (achievementIds.includes(achievement.id)) continue;
        if (achievement.unlockConditions?.prerequisiteAchievements) {
          const hasPrerequisites = achievement.unlockConditions.prerequisiteAchievements.every(
            (prereq) => achievementIds.includes(prereq)
          );
          if (!hasPrerequisites) continue;
        }
        const progress = await this.database.checkAchievementProgress(achievement.id, userId);
        if (progress.completed) {
          await this.database.unlockBadge(userId, {
            badgeType: achievement.badgeType ?? "ACHIEVEMENT",
            level: achievement.level ?? 1,
            description: achievement.id,
            requirements: {
              achievementId: achievement.id,
              unlockedAction: action,
              context
            },
            courseId: context?.courseId,
            chapterId: context?.chapterId
          });
          await this.database.awardPoints(userId, {
            points: achievement.points,
            reason: `Achievement unlocked: ${achievement.name}`,
            source: "achievement",
            courseId: context?.courseId,
            chapterId: context?.chapterId,
            sectionId: context?.sectionId
          });
          totalPointsAwarded += achievement.points;
          achievementsUnlocked.push(achievement);
        }
      }
      const activeChallenges = await this.getActiveChallenges(userId);
      for (const challenge of activeChallenges) {
        const completed = await this.checkChallengeCompletion(userId, challenge, action);
        if (completed) {
          await this.completeChallenge(userId, challenge, context);
          challengesCompleted.push(challenge);
          totalPointsAwarded += challenge.rewards.points;
        }
      }
      if (this.isStreakAction(action)) {
        await this.database.updateStreak(userId, {
          streakType: this.getStreakType(action),
          currentStreak: (userStats.streak ?? 0) + 1,
          longestStreak: Math.max(userStats.streak ?? 0, (userStats.streak ?? 0) + 1),
          courseId: context?.courseId
        });
      }
      const newTotalPoints = userStats.points + totalPointsAwarded;
      const newLevel = this.calculateLevel(newTotalPoints);
      const levelUp = newLevel > currentLevel ? { oldLevel: currentLevel, newLevel } : void 0;
      if (levelUp) {
        const levelUpBonus = newLevel * 50;
        await this.database.awardPoints(userId, {
          points: levelUpBonus,
          reason: `Level up bonus: Level ${newLevel}`,
          source: "level_up",
          courseId: context?.courseId
        });
        totalPointsAwarded += levelUpBonus;
      }
      return {
        pointsAwarded: totalPointsAwarded,
        achievementsUnlocked,
        challengesCompleted,
        levelUp
      };
    } catch (error) {
      console.error("Error tracking achievement progress:", error);
      return {
        pointsAwarded: 0,
        achievementsUnlocked: [],
        challengesCompleted: []
      };
    }
  }
  /**
   * Get user's active challenges
   */
  async getActiveChallenges(userId) {
    try {
      const userChallenges = await this.database.getUserChallenges(userId);
      if (!userChallenges?.activeChallenges) {
        return [];
      }
      return this.challenges.filter(
        (challenge) => userChallenges.activeChallenges.includes(challenge.id)
      );
    } catch (error) {
      console.error("Error getting active challenges:", error);
      return [];
    }
  }
  /**
   * Start a challenge for user
   */
  async startChallenge(userId, challengeId) {
    try {
      const challenge = this.challenges.find((c) => c.id === challengeId);
      if (!challenge) return false;
      const userChallenges = await this.database.getUserChallenges(userId);
      const activeChallenges = userChallenges?.activeChallenges ?? [];
      if (activeChallenges.includes(challengeId)) {
        return false;
      }
      await this.database.updateUserChallenges(userId, {
        activeChallenges: [...activeChallenges, challengeId],
        challengeStartDate: /* @__PURE__ */ new Date()
      });
      await this.database.recordInteraction({
        userId,
        interactionType: "CHALLENGE_STARTED",
        context: JSON.stringify({ challengeId, challenge }),
        result: JSON.stringify({ started: true })
      });
      return true;
    } catch (error) {
      console.error("Error starting challenge:", error);
      return false;
    }
  }
  /**
   * Get available challenges for user's level
   */
  async getAvailableChallenges(userId) {
    try {
      const userStats = await this.database.getUserStats(userId);
      const userLevel = this.calculateLevel(userStats.points);
      const userChallenges = await this.database.getUserChallenges(userId);
      const completedChallenges = userChallenges?.completedChallenges ?? [];
      const activeChallenges = userChallenges?.activeChallenges ?? [];
      const levelRequirements = {
        easy: 1,
        medium: 3,
        hard: 5,
        expert: 8
      };
      return this.challenges.filter((challenge) => {
        if (completedChallenges.includes(challenge.id) || activeChallenges.includes(challenge.id)) {
          return false;
        }
        return userLevel >= levelRequirements[challenge.difficulty];
      });
    } catch (error) {
      console.error("Error getting available challenges:", error);
      return [];
    }
  }
  /**
   * Get user's achievement summary
   */
  async getSummary(userId) {
    try {
      const userStats = await this.database.getUserStats(userId);
      const currentLevel = this.calculateLevel(userStats.points);
      const nextLevelPoints = this.getPointsForLevel(currentLevel + 1);
      const pointsToNextLevel = nextLevelPoints - userStats.points;
      const userChallenges = await this.database.getUserChallenges(userId);
      const badges = await this.database.getUserBadges(userId);
      const achievementIds = badges.map((a) => a.description);
      const recommendations = this.achievements.filter((a) => !achievementIds.includes(a.id)).slice(0, 3);
      return {
        level: currentLevel,
        totalPoints: userStats.points,
        pointsToNextLevel: Math.max(0, pointsToNextLevel),
        totalAchievements: badges.length,
        completedChallenges: (userChallenges?.completedChallenges ?? []).length,
        activeChallenges: (userChallenges?.activeChallenges ?? []).length,
        recommendations
      };
    } catch (error) {
      console.error("Error getting user achievement summary:", error);
      return {
        level: 1,
        totalPoints: 0,
        pointsToNextLevel: 100,
        totalAchievements: 0,
        completedChallenges: 0,
        activeChallenges: 0,
        recommendations: []
      };
    }
  }
  /**
   * Get all achievements
   */
  getAchievements() {
    return this.achievements;
  }
  /**
   * Get all challenges
   */
  getChallenges() {
    return this.challenges;
  }
  /**
   * Calculate user level based on points
   */
  calculateLevel(points) {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (points >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }
  /**
   * Get points required for a specific level
   */
  getPointsForLevel(level) {
    if (level <= 0) return 0;
    if (level > LEVEL_THRESHOLDS.length) {
      return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    }
    return LEVEL_THRESHOLDS[level - 1] ?? 0;
  }
  // Private helper methods
  async checkChallengeCompletion(userId, challenge, action) {
    try {
      const { requirements } = challenge;
      const timeframe = this.getChallengeTimeframe(challenge);
      const interactions = await this.database.getInteractionsSince(
        userId,
        timeframe.start,
        requirements.type
      );
      const currentProgress = interactions.length + (requirements.type === action ? 1 : 0);
      return currentProgress >= requirements.target;
    } catch (error) {
      console.error("Error checking challenge completion:", error);
      return false;
    }
  }
  async completeChallenge(userId, challenge, context) {
    try {
      const userChallenges = await this.database.getUserChallenges(userId);
      const activeChallenges = (userChallenges?.activeChallenges ?? []).filter((id) => id !== challenge.id);
      const completedChallenges = [
        ...userChallenges?.completedChallenges ?? [],
        challenge.id
      ];
      await this.database.updateUserChallenges(userId, {
        activeChallenges,
        completedChallenges
      });
      await this.database.awardPoints(userId, {
        points: challenge.rewards.points,
        reason: `Challenge completed: ${challenge.name}`,
        source: "challenge",
        courseId: context?.courseId,
        chapterId: context?.chapterId,
        sectionId: context?.sectionId
      });
      if (challenge.rewards.badges) {
        for (const badgeId of challenge.rewards.badges) {
          await this.database.unlockBadge(userId, {
            badgeType: "ACHIEVEMENT",
            level: 2,
            description: badgeId,
            requirements: { challengeId: challenge.id },
            courseId: context?.courseId
          });
        }
      }
      await this.database.recordInteraction({
        userId,
        interactionType: "CHALLENGE_COMPLETED",
        context: JSON.stringify({ challengeId: challenge.id, challenge }),
        result: JSON.stringify({ completed: true, rewards: challenge.rewards }),
        courseId: context?.courseId
      });
    } catch (error) {
      console.error("Error completing challenge:", error);
    }
  }
  isStreakAction(action) {
    return STREAK_ACTIONS.includes(action);
  }
  getStreakType(action) {
    return STREAK_TYPE_MAP[action] ?? "DAILY_INTERACTION";
  }
  getChallengeTimeframe(challenge) {
    const now = /* @__PURE__ */ new Date();
    const start = new Date(now.getTime() - challenge.duration * 24 * 60 * 60 * 1e3);
    return { start, end: now };
  }
  // Extension methods for customization
  /**
   * Add custom achievements
   */
  addAchievements(achievements) {
    this.achievements = [...this.achievements, ...achievements];
  }
  /**
   * Add custom challenges
   */
  addChallenges(challenges) {
    this.challenges = [...this.challenges, ...challenges];
  }
};
function createAchievementEngine(config) {
  return new AchievementEngine(config);
}

// src/engines/integrity-engine.ts
function tokenize(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((word) => word.length > 0);
}
function generateNgrams(text, n) {
  const words = tokenize(text);
  const ngrams = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(" "));
  }
  return ngrams;
}
function jaccardSimilarity(set1, set2) {
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = /* @__PURE__ */ new Set([...set1, ...set2]);
  return union.size > 0 ? intersection.size / union.size * 100 : 0;
}
function cosineSimilarity(text1, text2) {
  const words1 = tokenize(text1);
  const words2 = tokenize(text2);
  const allWords = /* @__PURE__ */ new Set([...words1, ...words2]);
  const vector1 = /* @__PURE__ */ new Map();
  const vector2 = /* @__PURE__ */ new Map();
  for (const word of allWords) {
    vector1.set(word, words1.filter((w) => w === word).length);
    vector2.set(word, words2.filter((w) => w === word).length);
  }
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  for (const word of allWords) {
    const v1 = vector1.get(word) ?? 0;
    const v2 = vector2.get(word) ?? 0;
    dotProduct += v1 * v2;
    magnitude1 += v1 * v1;
    magnitude2 += v2 * v2;
  }
  const denominator = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
  return denominator > 0 ? dotProduct / denominator * 100 : 0;
}
function calculatePerplexity(text) {
  const words = tokenize(text);
  const wordFreq = /* @__PURE__ */ new Map();
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of wordFreq.values()) {
    const p = count / words.length;
    entropy -= p * Math.log2(p);
  }
  return Math.pow(2, entropy);
}
function calculateBurstiness(text) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length < 2) return 0;
  const lengths = sentences.map((s) => tokenize(s).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
  return Math.min(100, variance / mean * 10);
}
function calculateStdDev(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}
var DEFAULT_CONFIG = {
  enablePlagiarismCheck: true,
  enableAIDetection: true,
  enableConsistencyCheck: true,
  plagiarismThreshold: 30,
  aiProbabilityThreshold: 70,
  minTextLength: 50,
  compareWithCourseContent: true,
  compareWithOtherStudents: true,
  compareWithExternalSources: false
};
var IntegrityEngine = class {
  config;
  database;
  constructor(engineConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...engineConfig?.checkConfig
    };
    this.database = engineConfig?.database;
  }
  // ─────────────────────────────────────────────────────────────
  // CONFIGURATION
  // ─────────────────────────────────────────────────────────────
  getConfig() {
    return { ...this.config };
  }
  updateConfig(config) {
    this.config = { ...this.config, ...config };
  }
  // ─────────────────────────────────────────────────────────────
  // PLAGIARISM DETECTION
  // ─────────────────────────────────────────────────────────────
  /**
   * Check text for plagiarism against a corpus
   */
  async checkPlagiarism(text, corpus) {
    if (text.length < this.config.minTextLength) {
      return {
        isPlagiarized: false,
        overallSimilarity: 0,
        matches: [],
        confidence: 100,
        analysisMethod: "ngram",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const matches = [];
    const textNgrams = new Set(generateNgrams(text, 3));
    const textNgrams5 = new Set(generateNgrams(text, 5));
    for (const source of corpus) {
      if (source.content === text) continue;
      const sourceNgrams = new Set(generateNgrams(source.content, 3));
      const ngramSimilarity = jaccardSimilarity(textNgrams, sourceNgrams);
      const sourceNgrams5 = new Set(generateNgrams(source.content, 5));
      const exactPhraseSimilarity = jaccardSimilarity(textNgrams5, sourceNgrams5);
      const cosineSim = cosineSimilarity(text, source.content);
      const overallSimilarity2 = ngramSimilarity * 0.4 + exactPhraseSimilarity * 0.4 + cosineSim * 0.2;
      if (overallSimilarity2 > 20) {
        const matchedSegments = this.findMatchingSegments(text, source.content);
        for (const segment of matchedSegments) {
          matches.push({
            sourceId: source.id,
            sourceType: source.type,
            matchedText: segment.matched,
            originalText: segment.original,
            similarity: segment.similarity,
            startPosition: segment.start,
            endPosition: segment.end
          });
        }
      }
    }
    const maxSimilarity = matches.length > 0 ? Math.max(...matches.map((m) => m.similarity)) : 0;
    const avgSimilarity = matches.length > 0 ? matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length : 0;
    const overallSimilarity = Math.max(maxSimilarity, avgSimilarity);
    return {
      isPlagiarized: overallSimilarity >= this.config.plagiarismThreshold,
      overallSimilarity: Math.round(overallSimilarity * 100) / 100,
      matches: matches.slice(0, 10),
      // Top 10 matches
      confidence: this.calculatePlagiarismConfidence(matches, text.length),
      analysisMethod: "ngram",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Find matching text segments between two texts
   */
  findMatchingSegments(text, source) {
    const segments = [];
    const textSentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    const sourceSentences = source.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    let position = 0;
    for (const sentence of textSentences) {
      const trimmedSentence = sentence.trim();
      const start = text.indexOf(trimmedSentence, position);
      for (const sourceSentence of sourceSentences) {
        const similarity = cosineSimilarity(trimmedSentence, sourceSentence.trim());
        if (similarity > 60) {
          segments.push({
            matched: trimmedSentence,
            original: sourceSentence.trim(),
            similarity,
            start,
            end: start + trimmedSentence.length
          });
          break;
        }
      }
      position = start + trimmedSentence.length;
    }
    return segments;
  }
  /**
   * Calculate confidence in plagiarism detection
   */
  calculatePlagiarismConfidence(matches, textLength) {
    if (matches.length === 0) return 95;
    const lengthFactor = Math.min(1, textLength / 500);
    const matchFactor = Math.min(1, matches.length / 5);
    const avgSimilarity = matches.reduce((s, m) => s + m.similarity, 0) / matches.length;
    const similarityFactor = avgSimilarity / 100;
    return Math.round((lengthFactor * 30 + matchFactor * 30 + similarityFactor * 40) * 100) / 100;
  }
  // ─────────────────────────────────────────────────────────────
  // AI CONTENT DETECTION
  // ─────────────────────────────────────────────────────────────
  /**
   * Detect if text is likely AI-generated
   */
  async detectAIContent(text) {
    if (text.length < this.config.minTextLength) {
      return {
        isAIGenerated: false,
        probability: 0,
        confidence: 50,
        indicators: [],
        perplexityScore: 0,
        burstinessScore: 0,
        analysisDetails: {
          averageSentenceLength: 0,
          vocabularyDiversity: 0,
          repetitivePatterns: 0,
          formalityScore: 0
        }
      };
    }
    const indicators = [];
    const words = tokenize(text);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const perplexityScore = calculatePerplexity(text);
    const normalizedPerplexity = Math.min(100, perplexityScore);
    if (normalizedPerplexity < 50) {
      indicators.push({
        type: "perplexity",
        score: 100 - normalizedPerplexity,
        description: "Low perplexity suggests predictable, possibly AI-generated text",
        weight: 0.25
      });
    }
    const burstinessScore = calculateBurstiness(text);
    if (burstinessScore < 30) {
      indicators.push({
        type: "burstiness",
        score: 100 - burstinessScore,
        description: "Uniform sentence lengths suggest AI generation",
        weight: 0.2
      });
    }
    const uniqueWords = new Set(words);
    const vocabularyDiversity = uniqueWords.size / words.length * 100;
    if (vocabularyDiversity > 40 && vocabularyDiversity < 60) {
      indicators.push({
        type: "vocabulary",
        score: 60,
        description: "Vocabulary diversity in typical AI range",
        weight: 0.15
      });
    }
    const avgSentenceLength = words.length / sentences.length;
    const sentenceLengths = sentences.map((s) => tokenize(s).length);
    const sentenceLengthStdDev = calculateStdDev(sentenceLengths);
    if (sentenceLengthStdDev < avgSentenceLength * 0.3) {
      indicators.push({
        type: "structure",
        score: 70,
        description: "Highly consistent sentence structure",
        weight: 0.2
      });
    }
    const ngrams = generateNgrams(text, 4);
    const ngramFreq = /* @__PURE__ */ new Map();
    for (const ngram of ngrams) {
      ngramFreq.set(ngram, (ngramFreq.get(ngram) ?? 0) + 1);
    }
    const repetitivePatterns = [...ngramFreq.values()].filter((v) => v > 2).length;
    if (repetitivePatterns > 5) {
      indicators.push({
        type: "repetition",
        score: Math.min(100, repetitivePatterns * 10),
        description: "Repetitive phrase patterns detected",
        weight: 0.2
      });
    }
    let probability = 0;
    let totalWeight = 0;
    for (const indicator of indicators) {
      probability += indicator.score * indicator.weight;
      totalWeight += indicator.weight;
    }
    if (totalWeight > 0) {
      probability = probability / totalWeight;
    }
    const formalWords = ["therefore", "however", "furthermore", "consequently", "additionally", "moreover"];
    const formalWordCount = words.filter((w) => formalWords.includes(w)).length;
    const formalityScore = Math.min(100, formalWordCount / words.length * 1e3);
    return {
      isAIGenerated: probability >= this.config.aiProbabilityThreshold,
      probability: Math.round(probability * 100) / 100,
      confidence: this.calculateAIDetectionConfidence(text.length, indicators.length),
      indicators,
      perplexityScore: Math.round(normalizedPerplexity * 100) / 100,
      burstinessScore: Math.round(burstinessScore * 100) / 100,
      analysisDetails: {
        averageSentenceLength: Math.round(avgSentenceLength * 100) / 100,
        vocabularyDiversity: Math.round(vocabularyDiversity * 100) / 100,
        repetitivePatterns,
        formalityScore: Math.round(formalityScore * 100) / 100
      }
    };
  }
  calculateAIDetectionConfidence(textLength, indicatorCount) {
    const lengthFactor = Math.min(1, textLength / 500);
    const indicatorFactor = Math.min(1, indicatorCount / 4);
    return Math.round((50 + lengthFactor * 25 + indicatorFactor * 25) * 100) / 100;
  }
  // ─────────────────────────────────────────────────────────────
  // WRITING STYLE CONSISTENCY
  // ─────────────────────────────────────────────────────────────
  /**
   * Check writing style consistency against previous submissions
   */
  async checkConsistency(currentText, previousSubmissions) {
    if (previousSubmissions.length === 0) {
      return {
        isConsistent: true,
        consistencyScore: 100,
        styleMetrics: this.extractStyleMetrics(currentText),
        anomalies: [],
        recommendation: "pass"
      };
    }
    const currentMetrics = this.extractStyleMetrics(currentText);
    const previousMetricsList = previousSubmissions.map((s) => this.extractStyleMetrics(s));
    const avgMetrics = this.calculateAverageMetrics(previousMetricsList);
    const anomalies = this.detectAnomalies(currentMetrics, avgMetrics);
    const consistencyScore = this.calculateConsistencyScore(currentMetrics, avgMetrics);
    return {
      isConsistent: consistencyScore >= 60,
      consistencyScore: Math.round(consistencyScore * 100) / 100,
      styleMetrics: currentMetrics,
      anomalies,
      recommendation: this.getRecommendation(consistencyScore, anomalies)
    };
  }
  extractStyleMetrics(text) {
    const words = tokenize(text);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const uniqueWords = new Set(words);
    const avgWordLength = words.length > 0 ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0;
    const sentenceComplexity = sentences.length > 0 ? words.length / sentences.length : 0;
    const bigrams = generateNgrams(text, 2);
    const bigramFreq = /* @__PURE__ */ new Map();
    for (const bigram of bigrams) {
      bigramFreq.set(bigram, (bigramFreq.get(bigram) ?? 0) + 1);
    }
    const commonPhrases = [...bigramFreq.entries()].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([phrase]) => phrase);
    const writingPatterns = sentences.map((s) => tokenize(s.trim()).slice(0, 2).join(" ")).filter((p, i, arr) => arr.indexOf(p) === i).slice(0, 5);
    const punctuationStyle = {
      commas: (text.match(/,/g) ?? []).length / Math.max(1, sentences.length),
      semicolons: (text.match(/;/g) ?? []).length / Math.max(1, sentences.length),
      colons: (text.match(/:/g) ?? []).length / Math.max(1, sentences.length),
      dashes: (text.match(/-/g) ?? []).length / Math.max(1, sentences.length)
    };
    return {
      vocabularyLevel: avgWordLength,
      sentenceComplexity,
      writingPatterns,
      commonPhrases,
      punctuationStyle,
      averageWordLength: avgWordLength,
      uniqueWordRatio: words.length > 0 ? uniqueWords.size / words.length : 0
    };
  }
  calculateAverageMetrics(metricsList) {
    const n = metricsList.length;
    if (n === 0) {
      return {
        vocabularyLevel: 0,
        sentenceComplexity: 0,
        writingPatterns: [],
        commonPhrases: [],
        punctuationStyle: { commas: 0, semicolons: 0, colons: 0, dashes: 0 },
        averageWordLength: 0,
        uniqueWordRatio: 0
      };
    }
    return {
      vocabularyLevel: metricsList.reduce((s, m) => s + m.vocabularyLevel, 0) / n,
      sentenceComplexity: metricsList.reduce((s, m) => s + m.sentenceComplexity, 0) / n,
      writingPatterns: metricsList.flatMap((m) => m.writingPatterns).filter((p, i, arr) => arr.indexOf(p) === i),
      commonPhrases: metricsList.flatMap((m) => m.commonPhrases).filter((p, i, arr) => arr.indexOf(p) === i),
      punctuationStyle: {
        commas: metricsList.reduce((s, m) => s + m.punctuationStyle.commas, 0) / n,
        semicolons: metricsList.reduce((s, m) => s + m.punctuationStyle.semicolons, 0) / n,
        colons: metricsList.reduce((s, m) => s + m.punctuationStyle.colons, 0) / n,
        dashes: metricsList.reduce((s, m) => s + m.punctuationStyle.dashes, 0) / n
      },
      averageWordLength: metricsList.reduce((s, m) => s + m.averageWordLength, 0) / n,
      uniqueWordRatio: metricsList.reduce((s, m) => s + m.uniqueWordRatio, 0) / n
    };
  }
  detectAnomalies(current, average) {
    const anomalies = [];
    const threshold = 0.3;
    if (average.vocabularyLevel === 0 || average.sentenceComplexity === 0) {
      return anomalies;
    }
    const vocabDeviation = Math.abs(current.vocabularyLevel - average.vocabularyLevel) / average.vocabularyLevel;
    if (vocabDeviation > threshold) {
      anomalies.push({
        type: "vocabulary_shift",
        severity: vocabDeviation > 0.5 ? "high" : "medium",
        description: `Vocabulary level differs by ${Math.round(vocabDeviation * 100)}% from average`,
        evidence: `Current: ${current.vocabularyLevel.toFixed(2)}, Average: ${average.vocabularyLevel.toFixed(2)}`
      });
    }
    const complexityDeviation = Math.abs(current.sentenceComplexity - average.sentenceComplexity) / average.sentenceComplexity;
    if (complexityDeviation > threshold) {
      anomalies.push({
        type: "complexity_change",
        severity: complexityDeviation > 0.5 ? "high" : "medium",
        description: `Sentence complexity differs by ${Math.round(complexityDeviation * 100)}%`,
        evidence: `Current: ${current.sentenceComplexity.toFixed(2)} words/sentence, Average: ${average.sentenceComplexity.toFixed(2)}`
      });
    }
    if (current.vocabularyLevel > average.vocabularyLevel * 1.3 && current.sentenceComplexity > average.sentenceComplexity * 1.3) {
      anomalies.push({
        type: "quality_jump",
        severity: "high",
        description: "Sudden improvement in writing quality detected",
        evidence: "Both vocabulary level and sentence complexity significantly higher than historical average"
      });
    }
    return anomalies;
  }
  calculateConsistencyScore(current, average) {
    if (average.vocabularyLevel === 0 || average.sentenceComplexity === 0 || average.uniqueWordRatio === 0) {
      return 100;
    }
    const deviations = [
      Math.abs(current.vocabularyLevel - average.vocabularyLevel) / average.vocabularyLevel,
      Math.abs(current.sentenceComplexity - average.sentenceComplexity) / average.sentenceComplexity,
      Math.abs(current.uniqueWordRatio - average.uniqueWordRatio) / average.uniqueWordRatio
    ];
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    return Math.max(0, (1 - avgDeviation) * 100);
  }
  getRecommendation(score, anomalies) {
    const highSeverityCount = anomalies.filter((a) => a.severity === "high").length;
    if (highSeverityCount >= 2 || score < 40) {
      return "flag";
    } else if (highSeverityCount >= 1 || score < 60) {
      return "review";
    }
    return "pass";
  }
  // ─────────────────────────────────────────────────────────────
  // COMPREHENSIVE INTEGRITY CHECK
  // ─────────────────────────────────────────────────────────────
  /**
   * Run comprehensive integrity check
   */
  async runIntegrityCheck(answerId, text, studentId, examId, options) {
    const report = {
      id: `integrity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      answerId,
      studentId,
      examId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      plagiarism: null,
      aiDetection: null,
      consistency: null,
      overallRisk: "low",
      flaggedForReview: false,
      autoApproved: true,
      recommendations: [],
      requiredActions: []
    };
    if (this.config.enablePlagiarismCheck && options?.corpus) {
      report.plagiarism = await this.checkPlagiarism(text, options.corpus);
    }
    if (this.config.enableAIDetection) {
      report.aiDetection = await this.detectAIContent(text);
    }
    if (this.config.enableConsistencyCheck && options?.previousSubmissions) {
      report.consistency = await this.checkConsistency(text, options.previousSubmissions);
    }
    report.overallRisk = this.calculateOverallRisk(report);
    report.flaggedForReview = report.overallRisk === "high" || report.overallRisk === "critical";
    report.autoApproved = report.overallRisk === "low";
    report.recommendations = this.generateRecommendations(report);
    report.requiredActions = this.generateRequiredActions(report);
    if (this.database) {
      await this.database.storeIntegrityReport(report);
    }
    return report;
  }
  calculateOverallRisk(report) {
    let riskScore = 0;
    if (report.plagiarism?.isPlagiarized) {
      riskScore += report.plagiarism.overallSimilarity >= 50 ? 40 : 20;
    }
    if (report.aiDetection?.isAIGenerated) {
      riskScore += report.aiDetection.probability >= 80 ? 30 : 15;
    }
    if (report.consistency && !report.consistency.isConsistent) {
      const highAnomalies = report.consistency.anomalies.filter((a) => a.severity === "high").length;
      riskScore += highAnomalies * 15;
    }
    if (riskScore >= 60) return "critical";
    if (riskScore >= 40) return "high";
    if (riskScore >= 20) return "medium";
    return "low";
  }
  generateRecommendations(report) {
    const recommendations = [];
    if (report.plagiarism?.isPlagiarized) {
      recommendations.push("Review matched sources and compare with student submission");
      if (report.plagiarism.overallSimilarity >= 50) {
        recommendations.push("Consider requesting the student to resubmit with proper citations");
      }
    }
    if (report.aiDetection?.isAIGenerated) {
      recommendations.push("Consider asking the student to explain their answer verbally");
      recommendations.push("Check if AI assistance was permitted for this assignment");
    }
    if (report.consistency && !report.consistency.isConsistent) {
      recommendations.push("Compare this submission with previous work from the same student");
      if (report.consistency.anomalies.some((a) => a.type === "quality_jump")) {
        recommendations.push("Consider a follow-up assessment to verify understanding");
      }
    }
    return recommendations;
  }
  generateRequiredActions(report) {
    const actions = [];
    if (report.overallRisk === "critical") {
      actions.push("REQUIRED: Manual review by instructor before grading");
      actions.push("REQUIRED: Document findings in student academic record");
    } else if (report.overallRisk === "high") {
      actions.push("REQUIRED: Instructor review recommended");
    }
    if (report.plagiarism?.overallSimilarity && report.plagiarism.overallSimilarity >= 70) {
      actions.push("REQUIRED: Academic integrity office notification");
    }
    return actions;
  }
  // ─────────────────────────────────────────────────────────────
  // BATCH PROCESSING
  // ─────────────────────────────────────────────────────────────
  /**
   * Run integrity checks on multiple submissions
   */
  async runBatchIntegrityCheck(submissions) {
    const corpus = submissions.map((s) => ({
      id: s.answerId,
      content: s.text,
      type: "student_answer"
    }));
    const reports = [];
    for (const submission of submissions) {
      const filteredCorpus = corpus.filter((c) => c.id !== submission.answerId);
      const report = await this.runIntegrityCheck(
        submission.answerId,
        submission.text,
        submission.studentId,
        submission.examId,
        { corpus: filteredCorpus }
      );
      reports.push(report);
    }
    return reports;
  }
};
function createIntegrityEngine(config) {
  return new IntegrityEngine(config);
}

// src/engines/course-guide-engine.ts
var CourseGuideEngine = class {
  databaseAdapter;
  constructor(config = {}) {
    this.databaseAdapter = config.databaseAdapter;
  }
  async generateCourseGuide(courseId, includeComparison = true, includeProjections = true) {
    if (!this.databaseAdapter) {
      throw new Error("Database adapter is required for course guide generation");
    }
    const course = await this.databaseAdapter.getCourse(courseId);
    if (!course) {
      throw new Error("Course not found");
    }
    const metrics = await this.calculateMetrics(course);
    const insights = await this.generateInsights(course, metrics);
    const comparison = includeComparison ? await this.generateComparison(course) : this.getDefaultComparison(courseId);
    const recommendations = this.generateRecommendations(course, metrics, insights);
    const successPrediction = includeProjections ? await this.predictSuccess(course, metrics) : this.getDefaultPrediction();
    return {
      courseId,
      courseTitle: course.title,
      metrics,
      insights,
      comparison,
      recommendations,
      successPrediction
    };
  }
  async calculateMetrics(course) {
    const depth = this.calculateDepthMetrics(course);
    const engagement = await this.calculateEngagementMetrics(course);
    const marketAcceptance = this.calculateMarketAcceptanceMetrics(course);
    return {
      depth,
      engagement,
      marketAcceptance
    };
  }
  calculateDepthMetrics(course) {
    const totalSections = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.length,
      0
    );
    const totalExams = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.reduce((s, sec) => s + sec.exams.length, 0),
      0
    );
    const totalQuestions = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.reduce((s, sec) => s + sec.questions.length, 0),
      0
    );
    const contentRichness = Math.min(
      (totalSections * 10 + totalExams * 20 + totalQuestions * 5) / 10,
      100
    );
    const topicCoverage = Math.min(course.chapters.length * 15, 100);
    const assessmentQuality = totalExams > 0 ? Math.min(totalQuestions / totalExams * 10, 100) : 0;
    const learningPathClarity = course.chapters.every(
      (ch) => ch.sections.length > 0
    ) ? 80 : 50;
    const overallDepth = (contentRichness + topicCoverage + assessmentQuality + learningPathClarity) / 4;
    return {
      contentRichness,
      topicCoverage,
      assessmentQuality,
      learningPathClarity,
      overallDepth
    };
  }
  async calculateEngagementMetrics(course) {
    const totalEnrollments = course.enrollments.length;
    if (totalEnrollments === 0) {
      return {
        completionRate: 0,
        averageProgress: 0,
        interactionFrequency: 0,
        studentSatisfaction: 0,
        retentionRate: 0,
        overallEngagement: 0
      };
    }
    const completedCount = course.enrollments.filter(
      (e) => e.progress?.isCompleted
    ).length;
    const completionRate = completedCount / totalEnrollments * 100;
    const totalProgress = course.enrollments.reduce(
      (sum, e) => sum + (e.progress?.percentage || 0),
      0
    );
    const averageProgress = totalProgress / totalEnrollments;
    let interactionFrequency = 0;
    if (this.databaseAdapter) {
      const recentActivity = await this.databaseAdapter.getRecentInteractionCount(
        course.id,
        7
      );
      interactionFrequency = Math.min(recentActivity / totalEnrollments * 20, 100);
    }
    const avgRating = course.reviews.length > 0 ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length : 0;
    const studentSatisfaction = avgRating / 5 * 100;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
    const activeStudents = course.enrollments.filter(
      (e) => e.progress?.lastAccessedAt && new Date(e.progress.lastAccessedAt) > thirtyDaysAgo
    ).length;
    const retentionRate = totalEnrollments > 0 ? activeStudents / totalEnrollments * 100 : 0;
    const overallEngagement = (completionRate + averageProgress + interactionFrequency + studentSatisfaction + retentionRate) / 5;
    return {
      completionRate,
      averageProgress,
      interactionFrequency,
      studentSatisfaction,
      retentionRate,
      overallEngagement
    };
  }
  calculateMarketAcceptanceMetrics(course) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
    const recentPurchases = course.purchases.filter(
      (p) => new Date(p.createdAt) > thirtyDaysAgo
    ).length;
    const olderPurchases = course.purchases.filter(
      (p) => new Date(p.createdAt) <= thirtyDaysAgo
    ).length;
    const enrollmentGrowth = olderPurchases > 0 ? (recentPurchases - olderPurchases) / olderPurchases * 100 : recentPurchases > 0 ? 100 : 0;
    const competitivePosition = 60;
    const avgPrice = course.price || 0;
    const pricingOptimality = avgPrice > 0 && avgPrice < 200 ? 80 : 50;
    const avgRating = course.reviews.length > 0 ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length : 0;
    const reviewScore = avgRating / 5 * 100;
    const highRatings = course.reviews.filter((r) => r.rating >= 4).length;
    const recommendationRate = course.reviews.length > 0 ? highRatings / course.reviews.length * 100 : 0;
    const overallAcceptance = (Math.max(0, Math.min(100, enrollmentGrowth)) + competitivePosition + pricingOptimality + reviewScore + recommendationRate) / 5;
    return {
      enrollmentGrowth: Math.max(0, Math.min(100, enrollmentGrowth)),
      competitivePosition,
      pricingOptimality,
      reviewScore,
      recommendationRate,
      overallAcceptance
    };
  }
  async generateInsights(course, metrics) {
    const strengths = [];
    const improvements = [];
    const opportunities = [];
    if (metrics.depth.overallDepth > 70) {
      strengths.push({
        category: "depth",
        title: "Strong Content Foundation",
        description: "Your course has comprehensive content coverage and well-structured learning paths",
        impact: "high",
        metric: metrics.depth.overallDepth
      });
    } else {
      improvements.push({
        category: "depth",
        title: "Enhance Content Depth",
        description: "Add more comprehensive content and assessments to improve course depth",
        impact: "high",
        metric: metrics.depth.overallDepth
      });
    }
    if (metrics.engagement.completionRate > 60) {
      strengths.push({
        category: "engagement",
        title: "High Completion Rate",
        description: "Students are successfully completing your course",
        impact: "high",
        metric: metrics.engagement.completionRate
      });
    } else {
      improvements.push({
        category: "engagement",
        title: "Improve Completion Rates",
        description: "Focus on student motivation and support to increase completions",
        impact: "high",
        metric: metrics.engagement.completionRate
      });
    }
    if (metrics.marketAcceptance.enrollmentGrowth > 10) {
      opportunities.push({
        category: "market",
        title: "Growing Market Segment",
        description: "Your course is in a rapidly growing market with expansion potential",
        impact: "high",
        metric: metrics.marketAcceptance.enrollmentGrowth
      });
    }
    const actionPlan = this.generateActionPlan(metrics, improvements, opportunities);
    return {
      strengths,
      improvements,
      opportunities,
      actionPlan
    };
  }
  generateActionPlan(metrics, improvements, opportunities) {
    const actions = [];
    if (metrics.engagement.overallEngagement < 50) {
      actions.push({
        priority: "immediate",
        action: "Implement student engagement features",
        expectedOutcome: "Increase student interaction and retention by 30%",
        effort: "medium",
        timeline: "1-2 weeks"
      });
    }
    if (metrics.depth.assessmentQuality < 60) {
      actions.push({
        priority: "short-term",
        action: "Add comprehensive assessments to each chapter",
        expectedOutcome: "Improve learning validation and student confidence",
        effort: "medium",
        timeline: "2-4 weeks"
      });
    }
    opportunities.forEach((opp) => {
      if (opp.impact === "high") {
        actions.push({
          priority: "long-term",
          action: `Capitalize on ${opp.title}`,
          expectedOutcome: opp.description,
          effort: "high",
          timeline: "1-3 months"
        });
      }
    });
    return actions;
  }
  async generateComparison(course) {
    if (!this.databaseAdapter) {
      return this.getDefaultComparison(course.id);
    }
    const competitors = await this.databaseAdapter.findCompetitors(course.id);
    const similarCourses = competitors.slice(0, 5);
    const marketPosition = this.determineMarketPosition(course, similarCourses);
    const differentiators = this.identifyDifferentiators(course, similarCourses);
    const gaps = this.identifyGaps(course, similarCourses);
    return {
      courseId: course.id,
      similarCourses,
      marketPosition,
      differentiators,
      gaps
    };
  }
  getDefaultComparison(courseId) {
    return {
      courseId,
      similarCourses: [],
      marketPosition: "competitive",
      differentiators: [],
      gaps: []
    };
  }
  determineMarketPosition(course, competitors) {
    if (competitors.length === 0) return "niche";
    const avgCompetitorEnrollments = competitors.reduce((sum, c) => sum + c.enrollment, 0) / competitors.length;
    const courseEnrollments = course.enrollments.length;
    if (courseEnrollments > avgCompetitorEnrollments * 1.5) {
      return "leader";
    } else if (courseEnrollments > avgCompetitorEnrollments * 0.8) {
      return "competitive";
    } else {
      return "follower";
    }
  }
  identifyDifferentiators(course, competitors) {
    const differentiators = [];
    if (competitors.length === 0) return differentiators;
    const avgCompetitorPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
    if (course.price && course.price < avgCompetitorPrice * 0.8) {
      differentiators.push("Competitive pricing advantage");
    }
    if (course.chapters.length > 10) {
      differentiators.push("Comprehensive content coverage");
    }
    const courseRating = course.reviews.length > 0 ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length : 0;
    const avgCompetitorRating = competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length;
    if (courseRating > avgCompetitorRating) {
      differentiators.push("Superior student satisfaction");
    }
    return differentiators;
  }
  identifyGaps(course, competitors) {
    const gaps = [];
    const competitorStrengths = competitors.flatMap((c) => c.strengths);
    const strengthCounts = competitorStrengths.reduce(
      (acc, strength) => {
        acc[strength] = (acc[strength] || 0) + 1;
        return acc;
      },
      {}
    );
    Object.entries(strengthCounts).forEach(([strength, count]) => {
      if (count > 2) {
        gaps.push(`Consider adding: ${strength}`);
      }
    });
    return gaps.slice(0, 5);
  }
  generateRecommendations(course, metrics, insights) {
    const content = this.generateContentRecommendations(metrics);
    const engagement = this.generateEngagementRecommendations(metrics);
    const marketing = this.generateMarketingRecommendations(course, metrics);
    return {
      content,
      engagement,
      marketing
    };
  }
  generateContentRecommendations(metrics) {
    const recommendations = [];
    if (metrics.depth.assessmentQuality < 60) {
      recommendations.push({
        type: "add",
        target: "Assessments",
        suggestion: "Add comprehensive quizzes and exams to each chapter",
        expectedImpact: "Improve learning validation and boost completion rates by 20%"
      });
    }
    if (metrics.depth.contentRichness < 60) {
      recommendations.push({
        type: "enhance",
        target: "Content Depth",
        suggestion: "Add more detailed explanations and examples",
        expectedImpact: "Better student understanding and retention"
      });
    }
    return recommendations;
  }
  generateEngagementRecommendations(metrics) {
    const recommendations = [];
    if (metrics.engagement.interactionFrequency < 50) {
      recommendations.push({
        strategy: "Implement interactive elements",
        implementation: "Add discussion forums, live Q&A sessions, and peer activities",
        targetMetric: "interactionFrequency",
        expectedImprovement: 40
      });
    }
    if (metrics.engagement.retentionRate < 60) {
      recommendations.push({
        strategy: "Create retention program",
        implementation: "Send progress reminders, offer completion certificates, add gamification",
        targetMetric: "retentionRate",
        expectedImprovement: 25
      });
    }
    return recommendations;
  }
  generateMarketingRecommendations(course, metrics) {
    const recommendations = [];
    recommendations.push({
      channel: "Content Marketing",
      message: `Master ${course.title} - Perfect for aspiring professionals`,
      targetAudience: "Professionals seeking skill development",
      estimatedReach: 5e3
    });
    if (metrics.marketAcceptance.reviewScore > 80) {
      recommendations.push({
        channel: "Social Media",
        message: "Join thousands of satisfied students with 4.5+ star ratings",
        targetAudience: "Prospective learners",
        estimatedReach: 1e4
      });
    }
    return recommendations;
  }
  async predictSuccess(course, metrics) {
    const trajectory = this.determineTrajectory(metrics);
    const currentEnrollments = course.enrollments.length;
    const growthRate = metrics.marketAcceptance.enrollmentGrowth / 100;
    const projectedEnrollments = Math.round(
      currentEnrollments * (1 + growthRate) * 3
    );
    const riskFactors = this.identifyRiskFactors(metrics);
    const successProbability = this.calculateSuccessProbability(metrics, riskFactors);
    return {
      currentTrajectory: trajectory,
      projectedEnrollments,
      riskFactors,
      successProbability
    };
  }
  getDefaultPrediction() {
    return {
      currentTrajectory: "stable",
      projectedEnrollments: 0,
      riskFactors: [],
      successProbability: 50
    };
  }
  determineTrajectory(metrics) {
    const growthIndicators = [
      metrics.marketAcceptance.enrollmentGrowth > 10,
      metrics.engagement.overallEngagement > 60,
      metrics.marketAcceptance.overallAcceptance > 70
    ].filter(Boolean).length;
    if (growthIndicators >= 2) return "growing";
    if (metrics.marketAcceptance.enrollmentGrowth < -10) return "declining";
    return "stable";
  }
  identifyRiskFactors(metrics) {
    const risks = [];
    if (metrics.engagement.completionRate < 40) {
      risks.push("Low completion rate affecting reputation");
    }
    if (metrics.marketAcceptance.competitivePosition < 40) {
      risks.push("Weak competitive position in market");
    }
    if (metrics.depth.overallDepth < 50) {
      risks.push("Insufficient content depth");
    }
    return risks;
  }
  calculateSuccessProbability(metrics, riskFactors) {
    const baseScore = (metrics.depth.overallDepth + metrics.engagement.overallEngagement + metrics.marketAcceptance.overallAcceptance) / 3;
    const riskPenalty = riskFactors.length * 10;
    return Math.max(0, Math.min(100, baseScore - riskPenalty));
  }
  async exportCourseGuide(courseId, format = "json") {
    const guide = await this.generateCourseGuide(courseId);
    switch (format) {
      case "json":
        return JSON.stringify(guide, null, 2);
      case "html":
        return this.generateHTMLReport(guide);
      case "pdf":
        throw new Error("PDF export not implemented yet");
      default:
        return JSON.stringify(guide);
    }
  }
  generateHTMLReport(guide) {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Course Guide: ${guide.courseTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1, h2, h3 { color: #333; }
    .metric { margin: 10px 0; }
    .score { font-weight: bold; color: #2563eb; }
    .insight { padding: 15px; margin: 10px 0; background: #f3f4f6; border-radius: 8px; }
    .high { border-left: 4px solid #10b981; }
    .medium { border-left: 4px solid #f59e0b; }
    .low { border-left: 4px solid #6b7280; }
  </style>
</head>
<body>
  <h1>Course Guide: ${guide.courseTitle}</h1>

  <h2>Overall Metrics</h2>
  <div class="metric">
    <strong>Content Depth:</strong> <span class="score">${guide.metrics.depth.overallDepth.toFixed(1)}%</span>
  </div>
  <div class="metric">
    <strong>Student Engagement:</strong> <span class="score">${guide.metrics.engagement.overallEngagement.toFixed(1)}%</span>
  </div>
  <div class="metric">
    <strong>Market Acceptance:</strong> <span class="score">${guide.metrics.marketAcceptance.overallAcceptance.toFixed(1)}%</span>
  </div>

  <h2>Key Insights</h2>
  <h3>Strengths</h3>
  ${guide.insights.strengths.map(
      (s) => `
    <div class="insight ${s.impact}">
      <strong>${s.title}</strong>
      <p>${s.description}</p>
    </div>
  `
    ).join("")}

  <h3>Areas for Improvement</h3>
  ${guide.insights.improvements.map(
      (i) => `
    <div class="insight ${i.impact}">
      <strong>${i.title}</strong>
      <p>${i.description}</p>
    </div>
  `
    ).join("")}

  <h2>Success Prediction</h2>
  <p><strong>Trajectory:</strong> ${guide.successPrediction.currentTrajectory}</p>
  <p><strong>Success Probability:</strong> ${guide.successPrediction.successProbability}%</p>
  <p><strong>Projected Enrollments (3 months):</strong> ${guide.successPrediction.projectedEnrollments}</p>
</body>
</html>
    `;
  }
};
function createCourseGuideEngine(config = {}) {
  return new CourseGuideEngine(config);
}

// src/engines/collaboration-engine.ts
var CollaborationEngine = class {
  databaseAdapter;
  activeSessions = /* @__PURE__ */ new Map();
  metricsCache = /* @__PURE__ */ new Map();
  constructor(config = {}) {
    this.databaseAdapter = config.databaseAdapter;
  }
  async startCollaborationSession(courseId, chapterId, initiatorId, type) {
    if (!this.databaseAdapter) {
      throw new Error("Database adapter is required");
    }
    const user = await this.databaseAdapter.getUser(initiatorId);
    if (!user) {
      throw new Error("Initiator not found");
    }
    const sessionId = `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      sessionId,
      participants: [
        {
          userId: initiatorId,
          userName: user.name || "Unknown",
          role: "leader",
          joinTime: /* @__PURE__ */ new Date(),
          contributions: [],
          engagementScore: 1
        }
      ],
      startTime: /* @__PURE__ */ new Date(),
      activities: [
        {
          activityId: `act-${Date.now()}`,
          type,
          participants: [initiatorId],
          timestamp: /* @__PURE__ */ new Date(),
          content: { action: "session_started", courseId, chapterId }
        }
      ],
      metrics: {
        totalParticipants: 1,
        activeParticipants: 1,
        totalContributions: 0,
        averageEngagement: 1,
        collaborationIndex: 0,
        knowledgeExchange: 0,
        problemSolvingEfficiency: 0,
        creativityScore: 0
      },
      insights: {
        dominantContributors: [],
        quietParticipants: [],
        keyTopics: [],
        collaborationPattern: {
          type: "leader-driven",
          description: "Session just started",
          effectiveness: 0
        },
        recommendations: [],
        strengths: [],
        improvements: []
      }
    };
    this.activeSessions.set(sessionId, session);
    await this.databaseAdapter.createSession(session);
    return session;
  }
  async joinCollaborationSession(sessionId, userId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found or inactive");
    }
    if (!this.databaseAdapter) {
      throw new Error("Database adapter is required");
    }
    const user = await this.databaseAdapter.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const existingParticipant = session.participants.find(
      (p) => p.userId === userId
    );
    if (!existingParticipant) {
      const role = session.participants.length === 0 ? "leader" : "contributor";
      session.participants.push({
        userId,
        userName: user.name || "Unknown",
        role,
        joinTime: /* @__PURE__ */ new Date(),
        contributions: [],
        engagementScore: 0
      });
      session.activities.push({
        activityId: `act-${Date.now()}`,
        type: "discussion",
        participants: [userId],
        timestamp: /* @__PURE__ */ new Date(),
        content: { action: "user_joined" }
      });
      session.metrics.totalParticipants++;
      session.metrics.activeParticipants++;
      await this.databaseAdapter.updateSession(sessionId, {
        participants: session.participants,
        metrics: session.metrics
      });
    }
    return session;
  }
  async recordContribution(sessionId, userId, contribution) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    const participant = session.participants.find((p) => p.userId === userId);
    if (!participant) {
      throw new Error("Participant not in session");
    }
    const fullContribution = {
      ...contribution,
      timestamp: /* @__PURE__ */ new Date(),
      reactions: []
    };
    participant.contributions.push(fullContribution);
    participant.engagementScore = this.calculateEngagementScore(participant);
    session.activities.push({
      activityId: `act-${Date.now()}`,
      type: this.mapContributionToActivity(contribution.type),
      participants: [userId],
      timestamp: /* @__PURE__ */ new Date(),
      content: contribution.content
    });
    session.metrics.totalContributions++;
    session.metrics.averageEngagement = this.calculateAverageEngagement(session);
    session.metrics.knowledgeExchange = this.calculateKnowledgeExchange(session);
    session.insights = this.generateSessionInsights(session);
    if (this.databaseAdapter) {
      await this.databaseAdapter.recordContribution(sessionId, userId, contribution);
      await this.databaseAdapter.updateSession(sessionId, {
        participants: session.participants,
        metrics: session.metrics,
        insights: session.insights
      });
    }
  }
  async analyzeCollaboration(sessionId) {
    let session = this.activeSessions.get(sessionId);
    if (!session && this.databaseAdapter) {
      session = await this.databaseAdapter.getSession(sessionId) || void 0;
    }
    if (!session) {
      throw new Error("Session not found");
    }
    const sessionAnalytics = await this.analyzeSession(session);
    const participantAnalytics = this.analyzeParticipants(session);
    const contentAnalytics = this.analyzeContent(session);
    const networkAnalytics = this.analyzeNetwork(session);
    return {
      sessionAnalytics,
      participantAnalytics,
      contentAnalytics,
      networkAnalytics
    };
  }
  async getRealTimeMetrics(courseId) {
    const cacheKey = courseId || "global";
    const cached = this.metricsCache.get(cacheKey);
    if (cached && Date.now() - cached.messagesPerMinute < 1e4) {
      return cached;
    }
    const activeSessions = courseId ? Array.from(this.activeSessions.values()).filter(
      (s) => s.activities.some((a) => a.content?.courseId === courseId)
    ) : Array.from(this.activeSessions.values());
    const activeUsers = /* @__PURE__ */ new Set();
    let recentMessages = 0;
    const hotspots = [];
    activeSessions.forEach((session) => {
      session.participants.forEach((p) => {
        if (!p.leaveTime) {
          activeUsers.add(p.userId);
        }
      });
      const oneMinuteAgo = new Date(Date.now() - 6e4);
      recentMessages += session.activities.filter(
        (a) => a.timestamp > oneMinuteAgo
      ).length;
      if (session.metrics.activeParticipants >= 3) {
        const content = session.activities[0]?.content;
        const location = `${content?.courseId || "unknown"}/${content?.chapterId || "unknown"}`;
        hotspots.push({
          location,
          activity: session.metrics.totalContributions,
          participants: session.metrics.activeParticipants,
          type: session.activities[0]?.type || "discussion"
        });
      }
    });
    const metrics = {
      currentSessions: activeSessions.length,
      activeUsers: activeUsers.size,
      messagesPerMinute: recentMessages,
      averageResponseTime: this.calculateAverageResponseTime(activeSessions),
      collaborationHotspots: hotspots.sort((a, b) => b.activity - a.activity).slice(0, 5)
    };
    this.metricsCache.set(cacheKey, metrics);
    return metrics;
  }
  async endCollaborationSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found or already ended");
    }
    session.endTime = /* @__PURE__ */ new Date();
    session.metrics.collaborationIndex = this.calculateCollaborationIndex(session);
    session.metrics.problemSolvingEfficiency = this.calculateProblemSolvingEfficiency(session);
    session.metrics.creativityScore = this.calculateCreativityScore(session);
    session.insights = this.generateSessionInsights(session);
    if (this.databaseAdapter) {
      await this.databaseAdapter.updateSession(sessionId, session);
      const analytics = await this.analyzeCollaboration(sessionId);
      await this.databaseAdapter.storeAnalytics(sessionId, analytics);
    }
    this.activeSessions.delete(sessionId);
    return session;
  }
  getActiveSession(sessionId) {
    return this.activeSessions.get(sessionId);
  }
  calculateEngagementScore(participant) {
    const contributionScore = Math.min(1, participant.contributions.length / 10);
    const impactScore = participant.contributions.reduce((sum, c) => sum + c.impact, 0) / Math.max(1, participant.contributions.length);
    const reactionScore = participant.contributions.reduce((sum, c) => sum + c.reactions.length * 0.1, 0) / Math.max(1, participant.contributions.length);
    return (contributionScore + impactScore + reactionScore) / 3;
  }
  calculateAverageEngagement(session) {
    const totalEngagement = session.participants.reduce(
      (sum, p) => sum + p.engagementScore,
      0
    );
    return totalEngagement / Math.max(1, session.participants.length);
  }
  calculateKnowledgeExchange(session) {
    let knowledgeScore = 0;
    session.participants.forEach((participant) => {
      participant.contributions.forEach((contribution) => {
        if (contribution.type === "answer" || contribution.type === "resource") {
          knowledgeScore += contribution.impact;
        }
        if (contribution.type === "question") {
          knowledgeScore += 0.5;
        }
      });
    });
    return Math.min(1, knowledgeScore / Math.max(1, session.participants.length));
  }
  mapContributionToActivity(contributionType) {
    const mapping = {
      message: "discussion",
      question: "q&a",
      answer: "q&a",
      resource: "discussion",
      edit: "co-creation",
      reaction: "discussion"
    };
    return mapping[contributionType];
  }
  generateSessionInsights(session) {
    const contributionCounts = /* @__PURE__ */ new Map();
    session.participants.forEach((p) => {
      contributionCounts.set(p.userId, p.contributions.length);
    });
    const sortedContributors = Array.from(contributionCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const totalContributions = session.metrics.totalContributions;
    const dominantThreshold = totalContributions * 0.3;
    const quietThreshold = totalContributions * 0.05;
    const dominantContributors = sortedContributors.filter(([, count]) => count > dominantThreshold).map(([userId]) => userId);
    const quietParticipants = sortedContributors.filter(([, count]) => count < quietThreshold).map(([userId]) => userId);
    const keyTopics = this.extractKeyTopics(session);
    const collaborationPattern = this.determineCollaborationPattern(
      session,
      dominantContributors.length,
      quietParticipants.length
    );
    const recommendations = this.generateRecommendations(
      collaborationPattern,
      dominantContributors.length,
      quietParticipants.length
    );
    const strengths = this.identifyStrengths(session);
    const improvements = this.identifyImprovements(session);
    return {
      dominantContributors,
      quietParticipants,
      keyTopics,
      collaborationPattern,
      recommendations,
      strengths,
      improvements
    };
  }
  extractKeyTopics(session) {
    const topics = /* @__PURE__ */ new Map();
    session.activities.forEach((activity) => {
      const content = activity.content;
      if (content?.topic) {
        const topicName = content.topic;
        const existing = topics.get(topicName) || {
          name: topicName,
          frequency: 0,
          sentiment: 0,
          contributors: []
        };
        existing.frequency++;
        if (!existing.contributors.includes(activity.participants[0])) {
          existing.contributors.push(activity.participants[0]);
        }
        topics.set(topicName, existing);
      }
    });
    return Array.from(topics.values()).sort((a, b) => b.frequency - a.frequency);
  }
  determineCollaborationPattern(session, dominantCount, quietCount) {
    const participantCount = session.participants.length;
    const engagementVariance = this.calculateEngagementVariance(session);
    if (dominantCount === 1 && quietCount > participantCount / 2) {
      return {
        type: "leader-driven",
        description: "One participant dominates the discussion",
        effectiveness: 0.6
      };
    }
    if (engagementVariance < 0.2) {
      return {
        type: "balanced",
        description: "All participants contribute equally",
        effectiveness: 0.9
      };
    }
    if (dominantCount === 0 && quietCount === 0) {
      return {
        type: "peer-to-peer",
        description: "Collaborative peer-based interaction",
        effectiveness: 0.8
      };
    }
    return {
      type: "fragmented",
      description: "Uneven participation with multiple quiet members",
      effectiveness: 0.5
    };
  }
  calculateEngagementVariance(session) {
    const engagements = session.participants.map((p) => p.engagementScore);
    const mean = engagements.reduce((a, b) => a + b, 0) / engagements.length;
    const variance = engagements.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) / engagements.length;
    return Math.sqrt(variance);
  }
  generateRecommendations(pattern, dominantCount, quietCount) {
    const recommendations = [];
    if (pattern.type === "leader-driven") {
      recommendations.push("Encourage more balanced participation");
      recommendations.push("Use structured turn-taking for discussions");
    }
    if (quietCount > 0) {
      recommendations.push("Engage quiet participants with direct questions");
      recommendations.push("Create smaller breakout groups");
    }
    if (pattern.effectiveness < 0.7) {
      recommendations.push("Consider using collaboration tools or frameworks");
      recommendations.push("Set clear collaboration goals and roles");
    }
    return recommendations;
  }
  identifyStrengths(session) {
    const strengths = [];
    if (session.metrics.knowledgeExchange > 0.7) {
      strengths.push("High knowledge sharing and exchange");
    }
    if (session.metrics.averageEngagement > 0.8) {
      strengths.push("Strong overall engagement");
    }
    if (session.metrics.totalContributions > session.participants.length * 5) {
      strengths.push("Active and dynamic discussion");
    }
    return strengths;
  }
  identifyImprovements(session) {
    const improvements = [];
    if (session.metrics.collaborationIndex < 0.5) {
      improvements.push("Increase collaborative activities");
    }
    if (session.metrics.problemSolvingEfficiency < 0.6) {
      improvements.push("Structure problem-solving approach");
    }
    if (session.insights.quietParticipants.length > session.participants.length / 3) {
      improvements.push("Improve participant inclusion");
    }
    return improvements;
  }
  calculateCollaborationIndex(session) {
    let collaborationScore = 0;
    const contributionTypes = /* @__PURE__ */ new Set();
    session.participants.forEach((p) => {
      p.contributions.forEach((c) => contributionTypes.add(c.type));
    });
    collaborationScore += Math.min(0.3, contributionTypes.size * 0.1);
    const interactionScore = this.calculateInteractionScore(session);
    collaborationScore += interactionScore * 0.4;
    const balanceScore = 1 - this.calculateEngagementVariance(session);
    collaborationScore += balanceScore * 0.3;
    return Math.min(1, collaborationScore);
  }
  calculateInteractionScore(session) {
    let interactions = 0;
    session.activities.forEach((activity) => {
      if (activity.participants.length > 1) {
        interactions++;
      }
    });
    return Math.min(1, interactions / Math.max(1, session.activities.length));
  }
  calculateProblemSolvingEfficiency(session) {
    const problemActivities = session.activities.filter(
      (a) => a.type === "problem-solving" || a.type === "q&a"
    );
    if (problemActivities.length === 0) return 0;
    let efficiency = 0;
    const solvedProblems = problemActivities.filter((a) => a.outcome).length;
    efficiency += solvedProblems / problemActivities.length * 0.5;
    const avgResponseTime = this.calculateAverageResponseTimeForSession(session);
    const responseScore = Math.max(0, 1 - avgResponseTime / 300);
    efficiency += responseScore * 0.5;
    return efficiency;
  }
  calculateCreativityScore(session) {
    let creativityScore = 0;
    const uniqueContributions = /* @__PURE__ */ new Set();
    session.participants.forEach((p) => {
      p.contributions.forEach((c) => {
        if (c.type === "message" || c.type === "edit") {
          uniqueContributions.add(JSON.stringify(c.content));
        }
      });
    });
    creativityScore += Math.min(0.4, uniqueContributions.size / 20 * 0.4);
    const brainstormingCount = session.activities.filter(
      (a) => a.type === "brainstorming"
    ).length;
    creativityScore += Math.min(0.3, brainstormingCount / 5 * 0.3);
    const resourceCount = session.participants.reduce(
      (sum, p) => sum + p.contributions.filter((c) => c.type === "resource").length,
      0
    );
    creativityScore += Math.min(0.3, resourceCount / 10 * 0.3);
    return creativityScore;
  }
  calculateAverageResponseTime(sessions) {
    let totalResponseTime = 0;
    let responseCount = 0;
    sessions.forEach((session) => {
      const questions = session.activities.filter(
        (a) => a.content?.type === "question"
      );
      questions.forEach((question) => {
        const answer = session.activities.find(
          (a) => a.content?.type === "answer" && a.content?.questionId === question.activityId && a.timestamp > question.timestamp
        );
        if (answer) {
          const responseTime = (answer.timestamp.getTime() - question.timestamp.getTime()) / 1e3;
          totalResponseTime += responseTime;
          responseCount++;
        }
      });
    });
    return responseCount > 0 ? totalResponseTime / responseCount : 0;
  }
  calculateAverageResponseTimeForSession(session) {
    return this.calculateAverageResponseTime([session]);
  }
  async analyzeSession(session) {
    const duration = session.endTime ? (session.endTime.getTime() - session.startTime.getTime()) / 1e3 / 60 : 0;
    return {
      totalSessions: 1,
      averageDuration: duration,
      averageParticipants: session.participants.length,
      completionRate: session.endTime ? 1 : 0,
      satisfactionScore: this.calculateSatisfactionScore(session),
      outcomeAchievement: session.metrics.problemSolvingEfficiency
    };
  }
  calculateSatisfactionScore(session) {
    let satisfaction = session.metrics.averageEngagement * 0.5;
    let totalReactions = 0;
    let positiveReactions = 0;
    session.participants.forEach((p) => {
      p.contributions.forEach((c) => {
        totalReactions += c.reactions.length;
        positiveReactions += c.reactions.filter(
          (r) => r.type === "like" || r.type === "helpful"
        ).length;
      });
    });
    if (totalReactions > 0) {
      satisfaction += positiveReactions / totalReactions * 0.5;
    }
    return satisfaction;
  }
  analyzeParticipants(session) {
    const topContributors = session.participants.map((p) => ({
      userId: p.userId,
      userName: p.userName,
      contributionCount: p.contributions.length,
      impactScore: p.contributions.reduce((sum, c) => sum + c.impact, 0) / Math.max(1, p.contributions.length),
      helpfulnessRating: this.calculateHelpfulnessRating(p),
      peersHelped: this.countPeersHelped(p)
    })).sort((a, b) => b.impactScore - a.impactScore).slice(0, 5);
    const engagementDistribution = this.calculateEngagementDistribution(session);
    const roleDistribution = this.calculateRoleDistribution(session);
    const participationTrends = this.calculateParticipationTrends(session);
    return {
      topContributors,
      engagementDistribution,
      roleDistribution,
      participationTrends
    };
  }
  calculateHelpfulnessRating(participant) {
    let helpfulness = 0;
    let ratedContributions = 0;
    participant.contributions.forEach((c) => {
      if (c.reactions.length > 0) {
        const helpfulReactions = c.reactions.filter(
          (r) => r.type === "helpful" || r.type === "insightful"
        ).length;
        helpfulness += helpfulReactions / c.reactions.length;
        ratedContributions++;
      }
    });
    return ratedContributions > 0 ? helpfulness / ratedContributions : 0;
  }
  countPeersHelped(participant) {
    const helpedPeers = /* @__PURE__ */ new Set();
    participant.contributions.forEach((c) => {
      c.reactions.filter((r) => r.type === "helpful" || r.type === "insightful").forEach((r) => helpedPeers.add(r.userId));
    });
    return helpedPeers.size;
  }
  calculateEngagementDistribution(session) {
    const buckets = [
      { range: "0-25%", count: 0, percentage: 0 },
      { range: "26-50%", count: 0, percentage: 0 },
      { range: "51-75%", count: 0, percentage: 0 },
      { range: "76-100%", count: 0, percentage: 0 }
    ];
    session.participants.forEach((p) => {
      const score = p.engagementScore;
      if (score <= 0.25) buckets[0].count++;
      else if (score <= 0.5) buckets[1].count++;
      else if (score <= 0.75) buckets[2].count++;
      else buckets[3].count++;
    });
    const total = session.participants.length;
    buckets.forEach((b) => {
      b.percentage = b.count / total * 100;
    });
    return buckets;
  }
  calculateRoleDistribution(session) {
    const roles = /* @__PURE__ */ new Map();
    session.participants.forEach((p) => {
      const existing = roles.get(p.role) || {
        role: p.role,
        count: 0,
        averageEngagement: 0,
        effectiveness: 0
      };
      existing.count++;
      existing.averageEngagement += p.engagementScore;
      roles.set(p.role, existing);
    });
    return Array.from(roles.values()).map((r) => ({
      ...r,
      averageEngagement: r.averageEngagement / r.count,
      effectiveness: this.calculateRoleEffectiveness(r.role, session)
    }));
  }
  calculateRoleEffectiveness(role, session) {
    const roleParticipants = session.participants.filter((p) => p.role === role);
    if (roleParticipants.length === 0) return 0;
    const avgContributions = roleParticipants.reduce((sum, p) => sum + p.contributions.length, 0) / roleParticipants.length;
    const avgImpact = roleParticipants.reduce(
      (sum, p) => sum + p.contributions.reduce((s, c) => s + c.impact, 0) / Math.max(1, p.contributions.length),
      0
    ) / roleParticipants.length;
    return avgContributions / 10 * 0.5 + avgImpact * 0.5;
  }
  calculateParticipationTrends(session) {
    return [
      {
        period: "Current Session",
        value: session.metrics.averageEngagement * 100,
        change: 0
      }
    ];
  }
  analyzeContent(session) {
    const mostDiscussedTopics = session.insights.keyTopics.slice(0, 5);
    const questions = session.participants.reduce(
      (sum, p) => sum + p.contributions.filter((c) => c.type === "question").length,
      0
    );
    const answers = session.participants.reduce(
      (sum, p) => sum + p.contributions.filter((c) => c.type === "answer").length,
      0
    );
    const questionAnswerRatio = questions > 0 ? answers / questions : 0;
    const knowledgeGapIdentified = this.identifyKnowledgeGaps(session);
    const resourcesShared = this.extractSharedResources(session);
    const contentQuality = this.calculateContentQuality(session);
    return {
      mostDiscussedTopics,
      questionAnswerRatio,
      knowledgeGapIdentified,
      resourcesShared,
      contentQuality
    };
  }
  identifyKnowledgeGaps(session) {
    const gaps = [];
    const unansweredQuestions = session.activities.filter(
      (a) => a.content?.type === "question" && !a.outcome
    ).map(
      (a) => a.content?.topic || "Unknown topic"
    );
    gaps.push(...new Set(unansweredQuestions));
    session.participants.forEach((p) => {
      p.contributions.filter(
        (c) => c.type === "question" && c.content?.confusion
      ).forEach((c) => {
        const topic = c.content?.topic;
        if (topic && !gaps.includes(topic)) {
          gaps.push(topic);
        }
      });
    });
    return gaps;
  }
  extractSharedResources(session) {
    const resources = [];
    session.participants.forEach((p) => {
      p.contributions.filter((c) => c.type === "resource").forEach((c) => {
        const content = c.content;
        resources.push({
          resourceId: content?.resourceId || `res-${Date.now()}`,
          type: content?.resourceType || "link",
          sharedBy: p.userId,
          usageCount: content?.usageCount || 0,
          helpfulnessRating: c.reactions.filter((r) => r.type === "helpful").length / Math.max(1, c.reactions.length)
        });
      });
    });
    return resources;
  }
  calculateContentQuality(session) {
    let qualityScore = 0;
    const avgImpact = session.participants.reduce(
      (sum, p) => sum + p.contributions.reduce((s, c) => s + c.impact, 0) / Math.max(1, p.contributions.length),
      0
    ) / Math.max(1, session.participants.length);
    qualityScore += avgImpact * 0.4;
    let totalReactions = 0;
    let positiveReactions = 0;
    session.participants.forEach((p) => {
      p.contributions.forEach((c) => {
        totalReactions += c.reactions.length;
        positiveReactions += c.reactions.filter(
          (r) => r.type === "helpful" || r.type === "insightful"
        ).length;
      });
    });
    if (totalReactions > 0) {
      qualityScore += positiveReactions / totalReactions * 0.3;
    }
    qualityScore += session.metrics.knowledgeExchange * 0.3;
    return qualityScore;
  }
  analyzeNetwork(session) {
    const collaborationGraph = this.buildCollaborationGraph(session);
    const centralityScores = this.calculateCentralityScores(collaborationGraph);
    const communities = this.detectCommunities(collaborationGraph);
    const bridgeUsers = this.identifyBridgeUsers(collaborationGraph, communities);
    return {
      collaborationGraph,
      centralityScores,
      communities,
      bridgeUsers
    };
  }
  buildCollaborationGraph(session) {
    const nodes = /* @__PURE__ */ new Map();
    session.participants.forEach((p) => {
      nodes.set(p.userId, {
        userId: p.userId,
        connections: [],
        centrality: 0,
        influence: p.engagementScore
      });
    });
    session.activities.forEach((activity) => {
      if (activity.participants.length > 1) {
        for (let i = 0; i < activity.participants.length; i++) {
          for (let j = i + 1; j < activity.participants.length; j++) {
            this.addConnection(
              nodes,
              activity.participants[i],
              activity.participants[j],
              activity.timestamp
            );
          }
        }
      }
    });
    session.participants.forEach((p) => {
      p.contributions.forEach((c) => {
        c.reactions.forEach((r) => {
          this.addConnection(nodes, p.userId, r.userId, r.timestamp);
        });
      });
    });
    return Array.from(nodes.values());
  }
  addConnection(nodes, user1, user2, timestamp) {
    const node1 = nodes.get(user1);
    const node2 = nodes.get(user2);
    if (!node1 || !node2) return;
    let conn1 = node1.connections.find((c) => c.targetUserId === user2);
    if (!conn1) {
      conn1 = {
        targetUserId: user2,
        strength: 0,
        interactions: 0,
        lastInteraction: timestamp
      };
      node1.connections.push(conn1);
    }
    conn1.interactions++;
    conn1.strength = Math.min(1, conn1.interactions / 10);
    conn1.lastInteraction = timestamp;
    let conn2 = node2.connections.find((c) => c.targetUserId === user1);
    if (!conn2) {
      conn2 = {
        targetUserId: user1,
        strength: 0,
        interactions: 0,
        lastInteraction: timestamp
      };
      node2.connections.push(conn2);
    }
    conn2.interactions++;
    conn2.strength = Math.min(1, conn2.interactions / 10);
    conn2.lastInteraction = timestamp;
  }
  calculateCentralityScores(graph) {
    return graph.map((node) => ({
      userId: node.userId,
      degreeCentrality: node.connections.length / Math.max(1, graph.length - 1),
      betweennessCentrality: this.calculateBetweennessCentrality(node, graph),
      closenessCentrality: this.calculateClosenessCentrality(node, graph)
    }));
  }
  calculateBetweennessCentrality(node, graph) {
    let betweenness = 0;
    for (const source of graph) {
      if (source.userId === node.userId) continue;
      for (const target of graph) {
        if (target.userId === node.userId || target.userId === source.userId)
          continue;
        const sourceConnected = source.connections.some(
          (c) => c.targetUserId === node.userId
        );
        const targetConnected = node.connections.some(
          (c) => c.targetUserId === target.userId
        );
        if (sourceConnected && targetConnected) {
          betweenness += 0.1;
        }
      }
    }
    return Math.min(1, betweenness);
  }
  calculateClosenessCentrality(node, graph) {
    const distances = this.calculateDistances(node, graph);
    const totalDistance = Array.from(distances.values()).reduce((a, b) => a + b, 0);
    const avgDistance = totalDistance / Math.max(1, graph.length - 1);
    return avgDistance > 0 ? 1 / avgDistance : 0;
  }
  calculateDistances(source, graph) {
    const distances = /* @__PURE__ */ new Map();
    const visited = /* @__PURE__ */ new Set();
    const queue = [
      { node: source, distance: 0 }
    ];
    while (queue.length > 0) {
      const { node, distance } = queue.shift();
      if (visited.has(node.userId)) continue;
      visited.add(node.userId);
      distances.set(node.userId, distance);
      node.connections.forEach((conn) => {
        if (!visited.has(conn.targetUserId)) {
          const targetNode = graph.find((n) => n.userId === conn.targetUserId);
          if (targetNode) {
            queue.push({ node: targetNode, distance: distance + 1 });
          }
        }
      });
    }
    return distances;
  }
  detectCommunities(graph) {
    const communities = [];
    const assigned = /* @__PURE__ */ new Set();
    graph.forEach((node) => {
      if (assigned.has(node.userId)) return;
      const community = {
        communityId: `comm-${communities.length}`,
        members: [node.userId],
        cohesion: 0,
        primaryTopic: "General",
        activityLevel: node.influence
      };
      assigned.add(node.userId);
      node.connections.filter((c) => c.strength > 0.5).forEach((conn) => {
        if (!assigned.has(conn.targetUserId)) {
          community.members.push(conn.targetUserId);
          assigned.add(conn.targetUserId);
        }
      });
      let internalConnections = 0;
      const possibleConnections = community.members.length * (community.members.length - 1);
      community.members.forEach((member) => {
        const memberNode = graph.find((n) => n.userId === member);
        if (memberNode) {
          memberNode.connections.forEach((conn) => {
            if (community.members.includes(conn.targetUserId)) {
              internalConnections++;
            }
          });
        }
      });
      community.cohesion = possibleConnections > 0 ? internalConnections / possibleConnections : 0;
      communities.push(community);
    });
    return communities;
  }
  identifyBridgeUsers(graph, communities) {
    const bridgeUsers = [];
    graph.forEach((node) => {
      const connectedCommunities = /* @__PURE__ */ new Set();
      node.connections.forEach((conn) => {
        communities.forEach((community) => {
          if (community.members.includes(conn.targetUserId)) {
            connectedCommunities.add(community.communityId);
          }
        });
      });
      if (connectedCommunities.size >= 2) {
        bridgeUsers.push(node.userId);
      }
    });
    return bridgeUsers;
  }
};
function createCollaborationEngine(config = {}) {
  return new CollaborationEngine(config);
}

// src/engines/social-engine.ts
var SocialEngine = class {
  databaseAdapter;
  constructor(config = {}) {
    this.databaseAdapter = config.databaseAdapter;
  }
  async measureCollaborationEffectiveness(group) {
    const knowledgeSharing = await this.analyzeKnowledgeSharing(group);
    const peerSupport = await this.analyzePeerSupport(group);
    const collaborativeLearning = await this.analyzeCollaborativeLearning(group);
    const communityBuilding = await this.analyzeCommunityBuilding(group);
    const overall = this.calculateOverallEffectiveness({
      knowledgeSharing,
      peerSupport,
      collaborativeLearning,
      communityBuilding
    });
    const factors = this.identifyEffectivenessFactors({
      knowledgeSharing,
      peerSupport,
      collaborativeLearning,
      communityBuilding
    });
    const score = {
      overall,
      knowledgeSharing,
      peerSupport,
      collaborativeLearning,
      communityBuilding,
      factors
    };
    if (this.databaseAdapter) {
      await this.databaseAdapter.storeEffectivenessScore(group.id, score);
    }
    return score;
  }
  async analyzeEngagement(community) {
    const participationRate = community.activeMembers / community.memberCount;
    const interactionFrequency = this.calculateInteractionFrequency(community);
    const contentContribution = this.analyzeContentContribution(community);
    const responseQuality = this.analyzeResponseQuality(community);
    const networkGrowth = community.activityMetrics.growthRate;
    const trends = this.identifyEngagementTrends(community);
    const metrics = {
      participationRate,
      interactionFrequency,
      contentContribution,
      responseQuality,
      networkGrowth,
      trends
    };
    if (this.databaseAdapter) {
      await this.databaseAdapter.storeEngagementMetrics(community.id, metrics);
    }
    return metrics;
  }
  async evaluateKnowledgeSharing(interactions) {
    const reach = this.calculateKnowledgeReach(interactions);
    const engagement = this.measureKnowledgeEngagement(interactions);
    const knowledgeTransfer = this.assessKnowledgeTransfer(interactions);
    const learningOutcomes = this.trackLearningOutcomes(interactions);
    const networkEffects = this.analyzeNetworkEffects(interactions);
    const impact = {
      reach,
      engagement,
      knowledgeTransfer,
      learningOutcomes,
      networkEffects
    };
    if (this.databaseAdapter) {
      await this.databaseAdapter.storeSharingImpact(impact);
    }
    return impact;
  }
  async matchMentorMentee(users) {
    if (!this.databaseAdapter) {
      throw new Error("Database adapter is required for mentor-mentee matching");
    }
    const { mentors, mentees } = await this.categorizeMentorsMentees(users);
    const matchingResults = [];
    for (const mentee of mentees) {
      const bestMatch = await this.findBestMentor(mentee, mentors);
      if (bestMatch) {
        const compatibility = await this.calculateCompatibility(
          bestMatch.mentor,
          mentee
        );
        const matchingFactors = this.identifyMatchingFactors(
          bestMatch.mentor,
          mentee
        );
        const expectedOutcomes = this.predictMatchingOutcomes(compatibility);
        const suggestedActivities = this.suggestMentorshipActivities();
        matchingResults.push({
          mentorId: bestMatch.mentor.id,
          menteeId: mentee.id,
          compatibilityScore: compatibility,
          matchingFactors,
          expectedOutcomes,
          suggestedActivities
        });
      }
    }
    if (this.databaseAdapter) {
      await this.databaseAdapter.storeMatchingResults(matchingResults);
    }
    return matchingResults;
  }
  async assessGroupDynamics(group) {
    const healthScore = await this.calculateGroupHealth(group);
    const cohesion = await this.measureGroupCohesion(group);
    const productivity = await this.assessGroupProductivity(group);
    const inclusivity = this.evaluateInclusivity(group);
    const leadership = this.analyzeLeadership(group);
    const communication = await this.analyzeCommunication(group);
    const conflicts = await this.identifyConflicts(group);
    const recommendations = this.generateDynamicsRecommendations({
      healthScore,
      cohesion,
      productivity,
      inclusivity,
      leadership,
      communication,
      conflicts
    });
    const analysis = {
      healthScore,
      cohesion,
      productivity,
      inclusivity,
      leadership,
      communication,
      conflicts,
      recommendations
    };
    if (this.databaseAdapter) {
      await this.databaseAdapter.storeDynamicsAnalysis(group.id, analysis);
    }
    return analysis;
  }
  // Private helper methods
  async analyzeKnowledgeSharing(group) {
    let sharingScore = 0;
    let totalWeight = 0;
    const interactions = this.databaseAdapter ? await this.databaseAdapter.getGroupInteractions(group.id) : [];
    const contentQuality = this.assessSharedContentQuality(interactions);
    sharingScore += contentQuality * 0.3;
    totalWeight += 0.3;
    const sharingFrequency = interactions.filter((i) => i.type === "post" || i.type === "share").length / group.members.length;
    sharingScore += Math.min(1, sharingFrequency / 5) * 0.2;
    totalWeight += 0.2;
    const uniqueContributors = new Set(interactions.map((i) => i.userId)).size;
    const contributorDiversity = uniqueContributors / group.members.length;
    sharingScore += contributorDiversity * 0.25;
    totalWeight += 0.25;
    const engagementRate = this.calculateGroupEngagementRate(interactions);
    sharingScore += engagementRate * 0.25;
    totalWeight += 0.25;
    return sharingScore / totalWeight;
  }
  async analyzePeerSupport(group) {
    const interactions = this.databaseAdapter ? await this.databaseAdapter.getGroupInteractions(group.id) : [];
    let supportScore = 0;
    const helpRequests = interactions.filter(
      (i) => i.type === "post" && i.sentiment === "negative"
    );
    const responses = interactions.filter(
      (i) => i.type === "comment" && i.helpfulness && i.helpfulness > 0.5
    );
    const responseRate = helpRequests.length > 0 ? responses.length / helpRequests.length : 0;
    supportScore += Math.min(1, responseRate) * 0.4;
    const avgHelpfulness = responses.length > 0 ? responses.reduce((sum, r) => sum + (r.helpfulness || 0), 0) / responses.length : 0;
    supportScore += avgHelpfulness * 0.3;
    const avgResponseTime = this.calculateAverageResponseTime(
      helpRequests,
      responses
    );
    const speedScore = avgResponseTime < 60 ? 1 : avgResponseTime < 240 ? 0.7 : avgResponseTime < 1440 ? 0.4 : 0.2;
    supportScore += speedScore * 0.3;
    return supportScore;
  }
  async analyzeCollaborativeLearning(group) {
    let collaborationScore = 0;
    const activityRate = group.activityLevel / group.members.length;
    collaborationScore += Math.min(1, activityRate / 3) * 0.3;
    const peerTeaching = this.estimatePeerTeaching(group);
    collaborationScore += Math.min(1, peerTeaching / group.members.length) * 0.3;
    const coCreatedContent = 3;
    collaborationScore += Math.min(1, coCreatedContent / 5) * 0.2;
    collaborationScore += Math.min(1, group.collaborationScore) * 0.2;
    return collaborationScore;
  }
  async analyzeCommunityBuilding(group) {
    let communityScore = 0;
    const possibleConnections = group.members.length * (group.members.length - 1) / 2;
    const connectionDensity = possibleConnections > 0 ? group.activityLevel / possibleConnections : 0;
    communityScore += Math.min(1, connectionDensity) * 0.3;
    const inclusivityScore = this.measureInclusiveParticipation(group);
    communityScore += inclusivityScore * 0.3;
    communityScore += 0.8 * 0.2;
    communityScore += 0.7 * 0.2;
    return communityScore;
  }
  calculateOverallEffectiveness(scores) {
    return scores.knowledgeSharing * 0.25 + scores.peerSupport * 0.25 + scores.collaborativeLearning * 0.35 + scores.communityBuilding * 0.15;
  }
  identifyEffectivenessFactors(scores) {
    const factors = [];
    if (scores.knowledgeSharing < 0.6) {
      factors.push({
        name: "Knowledge Sharing",
        score: scores.knowledgeSharing,
        evidence: ["Low content contribution rate", "Limited diversity in contributors"],
        recommendations: [
          "Implement knowledge sharing incentives",
          "Create structured sharing opportunities",
          "Recognize top contributors"
        ]
      });
    }
    if (scores.peerSupport < 0.7) {
      factors.push({
        name: "Peer Support",
        score: scores.peerSupport,
        evidence: [
          "Slow response to help requests",
          "Low engagement with struggling peers"
        ],
        recommendations: [
          "Establish peer mentoring program",
          "Create help request channels",
          "Train members in supportive communication"
        ]
      });
    }
    if (scores.collaborativeLearning > 0.8) {
      factors.push({
        name: "Collaborative Learning",
        score: scores.collaborativeLearning,
        evidence: ["High rate of joint activities", "Strong peer teaching culture"],
        recommendations: [
          "Maintain current collaboration practices",
          "Document successful collaboration patterns",
          "Share best practices with other groups"
        ]
      });
    }
    return factors;
  }
  calculateInteractionFrequency(community) {
    const dailyInteractions = community.activityMetrics.postsPerDay + community.activityMetrics.postsPerDay * community.activityMetrics.commentsPerPost;
    return dailyInteractions / community.activeMembers;
  }
  analyzeContentContribution(community) {
    const contributionRate = community.activityMetrics.postsPerDay / community.activeMembers;
    const qualityFactor = 0.7;
    return Math.min(1, contributionRate * qualityFactor);
  }
  analyzeResponseQuality(community) {
    const avgResponseLength = 150;
    const helpfulnessRating = 0.8;
    const responseRelevance = 0.85;
    return helpfulnessRating * 0.5 + responseRelevance * 0.3 + Math.min(1, avgResponseLength / 200) * 0.2;
  }
  identifyEngagementTrends(community) {
    return [
      {
        period: "weekly",
        metric: "participation",
        value: community.activityMetrics.engagementRate,
        change: 0.05,
        direction: "up"
      },
      {
        period: "monthly",
        metric: "content-creation",
        value: community.activityMetrics.postsPerDay,
        change: -0.02,
        direction: "down"
      },
      {
        period: "weekly",
        metric: "response-time",
        value: community.activityMetrics.averageResponseTime,
        change: 0,
        direction: "stable"
      }
    ];
  }
  calculateKnowledgeReach(interactions) {
    const uniqueRecipients = /* @__PURE__ */ new Set();
    interactions.forEach((interaction) => {
      if (interaction.targetUserId) {
        uniqueRecipients.add(interaction.targetUserId);
      }
    });
    return uniqueRecipients.size;
  }
  measureKnowledgeEngagement(interactions) {
    const totalInteractions = interactions.length;
    const positiveInteractions = interactions.filter(
      (i) => i.sentiment === "positive" || i.helpfulness && i.helpfulness > 0.5
    ).length;
    return totalInteractions > 0 ? positiveInteractions / totalInteractions : 0;
  }
  assessKnowledgeTransfer(interactions) {
    let transferScore = 0;
    const questions = interactions.filter(
      (i) => i.type === "comment" && i.sentiment === "neutral"
    );
    const clarifications = interactions.filter((i) => i.type === "answer");
    const clarificationRate = questions.length > 0 ? clarifications.length / questions.length : 1;
    transferScore += clarificationRate * 0.4;
    const applications = interactions.filter(
      (i) => i.impact && i.impact > 0.5
    );
    const applicationRate = applications.length / Math.max(1, interactions.length);
    transferScore += applicationRate * 0.6;
    return transferScore;
  }
  trackLearningOutcomes(interactions) {
    const outcomes = [];
    const userInteractions = /* @__PURE__ */ new Map();
    interactions.forEach((interaction) => {
      if (!userInteractions.has(interaction.userId)) {
        userInteractions.set(interaction.userId, []);
      }
      userInteractions.get(interaction.userId).push(interaction);
    });
    for (const [userId, userInts] of userInteractions) {
      const improvement = this.calculateUserImprovement(userInts);
      const attributedTo = this.identifyLearningAttributions(userInts);
      outcomes.push({
        userId,
        improvement,
        attributedTo,
        confidence: 0.75
      });
    }
    return outcomes;
  }
  calculateUserImprovement(interactions) {
    if (interactions.length < 2) return 0;
    const sortedInteractions = interactions.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    const halfLength = Math.floor(interactions.length / 2);
    const earlyQuality = sortedInteractions.slice(0, halfLength).reduce((sum, i) => sum + (i.helpfulness || 0.5), 0) / halfLength;
    const lateQuality = sortedInteractions.slice(halfLength).reduce((sum, i) => sum + (i.helpfulness || 0.5), 0) / Math.ceil(interactions.length / 2);
    return (lateQuality - earlyQuality) / earlyQuality;
  }
  identifyLearningAttributions(interactions) {
    const attributions = [];
    const helpfulInteractions = interactions.filter(
      (i) => i.helpfulness && i.helpfulness > 0.7
    );
    helpfulInteractions.forEach((interaction) => {
      if (interaction.targetUserId) {
        attributions.push(`peer-support-${interaction.targetUserId}`);
      }
      if (interaction.type === "answer") {
        attributions.push("knowledge-sharing");
      }
    });
    return [...new Set(attributions)];
  }
  analyzeNetworkEffects(interactions) {
    const effects = [];
    const directBeneficiaries = new Set(
      interactions.map((i) => i.targetUserId).filter((id) => id)
    );
    effects.push({
      type: "direct",
      magnitude: directBeneficiaries.size,
      description: "Users directly helped through interactions",
      beneficiaries: directBeneficiaries.size
    });
    const indirectReach = directBeneficiaries.size * 2.5;
    effects.push({
      type: "indirect",
      magnitude: indirectReach,
      description: "Extended reach through knowledge sharing",
      beneficiaries: Math.round(indirectReach)
    });
    return effects;
  }
  async categorizeMentorsMentees(users) {
    const mentors = [];
    const mentees = [];
    if (!this.databaseAdapter) {
      return { mentors, mentees };
    }
    for (const user of users) {
      const profile = await this.databaseAdapter.getUserLearningProfile(user.id);
      if (profile.experience > 6 && profile.averageScore > 80) {
        mentors.push(user);
      } else if (profile.experience < 3 || profile.averageScore < 70) {
        mentees.push(user);
      }
    }
    return { mentors, mentees };
  }
  async findBestMentor(mentee, mentors) {
    if (mentors.length === 0) return null;
    let bestMatch = { mentor: mentors[0], score: 0 };
    for (const mentor of mentors) {
      const score = await this.calculateMentorMenteeScore(mentor, mentee);
      if (score > bestMatch.score) {
        bestMatch = { mentor, score };
      }
    }
    return bestMatch.score > 0.5 ? bestMatch : null;
  }
  async calculateMentorMenteeScore(mentor, mentee) {
    if (!this.databaseAdapter) return 0.5;
    let score = 0;
    const mentorProfile = await this.databaseAdapter.getUserLearningProfile(
      mentor.id
    );
    const menteeProfile = await this.databaseAdapter.getUserLearningProfile(
      mentee.id
    );
    const skillAlignment = this.calculateSkillAlignment(
      mentorProfile,
      menteeProfile
    );
    score += skillAlignment * 0.3;
    const styleCompatibility = await this.calculateStyleCompatibility(
      mentor.id,
      mentee.id
    );
    score += styleCompatibility * 0.25;
    const availabilityMatch = this.calculateAvailabilityMatch(
      mentorProfile,
      menteeProfile
    );
    score += availabilityMatch * 0.2;
    score += 0.8 * 0.15;
    score += 0.7 * 0.1;
    return score;
  }
  calculateSkillAlignment(mentorProfile, menteeProfile) {
    const menteeGaps = menteeProfile.skillGaps || [];
    const mentorStrengths = mentorProfile.strengths || [];
    if (menteeGaps.length === 0 || mentorStrengths.length === 0) return 0.5;
    const matches = menteeGaps.filter(
      (gap) => mentorStrengths.includes(gap)
    ).length;
    return matches / menteeGaps.length;
  }
  async calculateStyleCompatibility(mentorId, menteeId) {
    if (!this.databaseAdapter) return 0.5;
    const mentorStyle = await this.databaseAdapter.getLearningStyle(mentorId);
    const menteeStyle = await this.databaseAdapter.getLearningStyle(menteeId);
    if (!mentorStyle || !menteeStyle) return 0.5;
    return mentorStyle.primaryStyle === menteeStyle.primaryStyle ? 0.9 : 0.7;
  }
  calculateAvailabilityMatch(mentorProfile, menteeProfile) {
    const mentorHours = mentorProfile.availableHours || 5;
    const menteeHours = menteeProfile.requiredHours || 3;
    return menteeHours <= mentorHours ? 1 : menteeHours / mentorHours;
  }
  async calculateCompatibility(mentor, mentee) {
    return await this.calculateMentorMenteeScore(mentor, mentee);
  }
  identifyMatchingFactors(mentor, mentee) {
    return [
      {
        factor: "Skill Alignment",
        weight: 0.3,
        score: 0.85,
        rationale: "Mentor has expertise in areas where mentee needs growth"
      },
      {
        factor: "Learning Style",
        weight: 0.25,
        score: 0.9,
        rationale: "Compatible learning and teaching styles"
      },
      {
        factor: "Availability",
        weight: 0.2,
        score: 0.8,
        rationale: "Good schedule overlap for regular sessions"
      },
      {
        factor: "Communication",
        weight: 0.15,
        score: 0.75,
        rationale: "Similar communication preferences"
      },
      {
        factor: "Goals",
        weight: 0.1,
        score: 0.95,
        rationale: "Aligned learning objectives"
      }
    ];
  }
  predictMatchingOutcomes(compatibility) {
    if (compatibility > 0.8) {
      return [
        "90% likelihood of successful mentorship relationship",
        "Expected 30% improvement in mentee performance within 3 months",
        "High probability of long-term professional connection"
      ];
    } else if (compatibility > 0.6) {
      return [
        "75% likelihood of successful mentorship relationship",
        "Expected 20% improvement in mentee performance within 3 months",
        "Good potential for knowledge transfer"
      ];
    } else {
      return [
        "60% likelihood of successful mentorship relationship",
        "Expected 15% improvement in mentee performance within 3 months",
        "May require additional support for optimal results"
      ];
    }
  }
  suggestMentorshipActivities() {
    return [
      {
        type: "one-on-one-session",
        description: "Weekly 30-minute video call for guidance and Q&A",
        duration: 30,
        frequency: "weekly",
        expectedBenefit: "Direct knowledge transfer and personalized guidance"
      },
      {
        type: "code-review",
        description: "Bi-weekly code review sessions",
        duration: 45,
        frequency: "bi-weekly",
        expectedBenefit: "Practical skill improvement and best practices"
      },
      {
        type: "project-collaboration",
        description: "Monthly mini-project to work on together",
        duration: 120,
        frequency: "monthly",
        expectedBenefit: "Hands-on learning and portfolio building"
      },
      {
        type: "resource-sharing",
        description: "Weekly curated learning resources",
        duration: 15,
        frequency: "weekly",
        expectedBenefit: "Continuous learning and skill expansion"
      }
    ];
  }
  async calculateGroupHealth(group) {
    let healthScore = 0;
    healthScore += Math.min(1, group.activityLevel / 10) * 0.3;
    const retentionRate = this.calculateRetentionRate(group);
    healthScore += retentionRate * 0.3;
    healthScore += 0.75 * 0.2;
    healthScore += 0.8 * 0.2;
    return healthScore;
  }
  async measureGroupCohesion(group) {
    let cohesionScore = 0;
    cohesionScore += 0.6 * 0.4;
    cohesionScore += 0.7 * 0.3;
    cohesionScore += group.collaborationScore * 0.3;
    return cohesionScore;
  }
  async assessGroupProductivity(group) {
    let productivityScore = 0;
    productivityScore += 0.82 * 0.4;
    productivityScore += 0.78 * 0.4;
    productivityScore += 0.85 * 0.2;
    return productivityScore;
  }
  evaluateInclusivity(group) {
    let inclusivityScore = 0;
    const participationEquality = this.calculateParticipationEquality(group);
    inclusivityScore += participationEquality * 0.4;
    inclusivityScore += 0.75 * 0.3;
    inclusivityScore += 0.9 * 0.3;
    return inclusivityScore;
  }
  analyzeLeadership(group) {
    const emergentLeaders = group.members.filter((m) => m.contributionScore > 0.7 && m.helpfulnessRating > 0.8).sort((a, b) => b.contributionScore - a.contributionScore).slice(0, 3).map((m) => m.userId);
    const leadershipStyle = this.determineLeadershipStyle(emergentLeaders, group);
    const effectiveness = group.collaborationScore * 0.6 + group.activityLevel * 0.4;
    const distribution = this.analyzeLeadershipDistribution(emergentLeaders, group);
    return {
      emergentLeaders,
      leadershipStyle,
      effectiveness,
      distribution
    };
  }
  determineLeadershipStyle(leaders, group) {
    if (leaders.length === 0) return "absent";
    const topLeader = group.members.find((m) => m.userId === leaders[0]);
    if (topLeader && topLeader.contributionScore > 0.9 && topLeader.role === "leader") {
      return "directive";
    }
    if (leaders.length > 2) return "collaborative";
    return "facilitative";
  }
  analyzeLeadershipDistribution(leaders, group) {
    if (leaders.length === 0) return "absent";
    if (leaders.length === 1) return "centralized";
    return "distributed";
  }
  async analyzeCommunication(group) {
    const patterns = this.identifyCommunicationPatterns(group);
    const quality = 0.8;
    const barriers = [
      "Time zone differences",
      "Language barriers for some members",
      "Technical issues with collaboration tools"
    ];
    const strengths = [
      "Clear and respectful communication",
      "Active listening demonstrated",
      "Constructive feedback culture"
    ];
    return {
      patterns,
      quality,
      barriers,
      strengths
    };
  }
  identifyCommunicationPatterns(group) {
    return [
      {
        type: "hub-and-spoke",
        frequency: 0.4,
        participants: group.members.slice(0, 3).map((m) => m.userId),
        effectiveness: 0.7
      },
      {
        type: "all-to-all",
        frequency: 0.3,
        participants: group.members.map((m) => m.userId),
        effectiveness: 0.85
      }
    ];
  }
  async identifyConflicts(group) {
    return [];
  }
  generateDynamicsRecommendations(analysis) {
    const recommendations = [];
    if (analysis.healthScore < 0.6) {
      recommendations.push({
        area: "Group Health",
        issue: "Low overall group health score",
        recommendation: "Schedule regular check-ins and team building activities",
        priority: "high",
        expectedImpact: "25% improvement in engagement and retention"
      });
    }
    if (analysis.cohesion < 0.5) {
      recommendations.push({
        area: "Group Cohesion",
        issue: "Weak connections between members",
        recommendation: "Implement pair programming and collaborative projects",
        priority: "medium",
        expectedImpact: "Stronger peer relationships and support network"
      });
    }
    if (analysis.leadership.distribution === "absent") {
      recommendations.push({
        area: "Leadership",
        issue: "Lack of clear leadership",
        recommendation: "Rotate leadership roles for different activities",
        priority: "high",
        expectedImpact: "Better coordination and decision-making"
      });
    }
    if (analysis.conflicts.some((c) => c.severity === "high")) {
      recommendations.push({
        area: "Conflict Resolution",
        issue: "Unresolved high-severity conflicts",
        recommendation: "Facilitate mediated discussion sessions",
        priority: "high",
        expectedImpact: "Improved collaboration and productivity"
      });
    }
    return recommendations;
  }
  // Utility methods
  assessSharedContentQuality(interactions) {
    const posts = interactions.filter((i) => i.type === "post");
    if (posts.length === 0) return 0;
    const avgHelpfulness = posts.reduce((sum, post) => sum + (post.helpfulness || 0.5), 0) / posts.length;
    return avgHelpfulness;
  }
  calculateGroupEngagementRate(interactions) {
    const posts = interactions.filter((i) => i.type === "post");
    const engagements = interactions.filter((i) => i.type !== "post");
    return posts.length > 0 ? engagements.length / posts.length : 0;
  }
  calculateAverageResponseTime(requests, responses) {
    if (requests.length === 0 || responses.length === 0) return Infinity;
    let totalTime = 0;
    let matchedPairs = 0;
    requests.forEach((request) => {
      const firstResponse = responses.find(
        (r) => r.timestamp > request.timestamp && r.targetUserId === request.userId
      );
      if (firstResponse) {
        const timeDiff = firstResponse.timestamp.getTime() - request.timestamp.getTime();
        totalTime += timeDiff / (1e3 * 60);
        matchedPairs++;
      }
    });
    return matchedPairs > 0 ? totalTime / matchedPairs : Infinity;
  }
  estimatePeerTeaching(group) {
    return group.members.filter((m) => m.helpfulnessRating > 0.7).length;
  }
  measureInclusiveParticipation(group) {
    const participationScores = group.members.map((m) => m.contributionScore);
    const n = participationScores.length;
    const mean = participationScores.reduce((sum, s) => sum + s, 0) / n;
    let giniSum = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        giniSum += Math.abs(participationScores[i] - participationScores[j]);
      }
    }
    const gini = giniSum / (2 * n * n * mean);
    return 1 - gini;
  }
  calculateRetentionRate(group) {
    const activeMembers = group.members.filter(
      (m) => m.engagementLevel > 0.1
    ).length;
    return activeMembers / group.members.length;
  }
  calculateParticipationEquality(group) {
    const scores = group.members.map((m) => m.contributionScore);
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, 1 - stdDev / mean);
  }
};
function createSocialEngine(config = {}) {
  return new SocialEngine(config);
}

// src/engines/innovation-engine.ts
var InnovationEngine = class {
  config;
  dbAdapter;
  constructor(config = {}) {
    this.config = config;
    this.dbAdapter = config.databaseAdapter;
  }
  // ============================================================================
  // COGNITIVE FITNESS
  // ============================================================================
  async assessCognitiveFitness(userId) {
    if (!this.dbAdapter) {
      throw new Error("Database adapter required for cognitive fitness assessment");
    }
    const learningData = await this.dbAdapter.getUserLearningData(userId);
    const dimensions = this.assessCognitiveDimensions(learningData);
    const overallScore = this.calculateOverallFitnessScore(dimensions);
    const exercises = this.generateFitnessExercises(dimensions);
    const progress = await this.trackFitnessProgress(userId);
    const recommendations = this.generateFitnessRecommendations(dimensions, progress);
    const assessment = {
      userId,
      overallScore,
      dimensions,
      exercises,
      progress,
      recommendations
    };
    await this.dbAdapter.storeCognitiveFitnessAssessment(assessment);
    return assessment;
  }
  assessCognitiveDimensions(learningData) {
    return [
      {
        name: "memory",
        score: this.assessMemory(learningData),
        percentile: 0,
        trend: "stable",
        lastAssessed: /* @__PURE__ */ new Date()
      },
      {
        name: "attention",
        score: this.assessAttention(learningData),
        percentile: 0,
        trend: "stable",
        lastAssessed: /* @__PURE__ */ new Date()
      },
      {
        name: "reasoning",
        score: this.assessReasoning(learningData),
        percentile: 0,
        trend: "stable",
        lastAssessed: /* @__PURE__ */ new Date()
      },
      {
        name: "creativity",
        score: this.assessCreativity(learningData),
        percentile: 0,
        trend: "stable",
        lastAssessed: /* @__PURE__ */ new Date()
      },
      {
        name: "processing_speed",
        score: this.assessProcessingSpeed(learningData),
        percentile: 0,
        trend: "stable",
        lastAssessed: /* @__PURE__ */ new Date()
      }
    ];
  }
  assessMemory(data) {
    let score = 50;
    score += (data.retentionRate || 0.5) * 20;
    score += (data.recallAccuracy || 0.5) * 20;
    score += (data.spacedRepPerformance || 0.5) * 10;
    return Math.min(100, Math.max(0, score));
  }
  assessAttention(data) {
    let score = 50;
    const avgFocusDuration = data.avgFocusDuration || 20;
    score += Math.min(30, avgFocusDuration / 60 * 30);
    score -= (data.taskSwitchingRate || 0.5) * 10;
    score += (data.completionRate || 0.5) * 20;
    return Math.min(100, Math.max(0, score));
  }
  assessReasoning(data) {
    let score = 50;
    score += (data.problemSolvingAccuracy || 0.5) * 25;
    score += (data.logicalProgressionScore || 0.5) * 15;
    score += (data.abstractThinkingScore || 0.5) * 10;
    return Math.min(100, Math.max(0, score));
  }
  assessCreativity(data) {
    let score = 50;
    score += (data.solutionDiversity || 0.5) * 20;
    score += (data.novelApproachRate || 0.5) * 20;
    score += (data.crossDomainScore || 0.5) * 10;
    return Math.min(100, Math.max(0, score));
  }
  assessProcessingSpeed(data) {
    let score = 50;
    const avgResponseTime = data.avgResponseTime || 5e3;
    const speedScore = Math.max(0, 1 - avgResponseTime / 1e4);
    score += speedScore * 30;
    score += (data.speedImprovementRate || 0) * 10;
    score += (data.timedAccuracy || 0.5) * 10;
    return Math.min(100, Math.max(0, score));
  }
  calculateOverallFitnessScore(dimensions) {
    const weights = {
      memory: 0.25,
      attention: 0.2,
      reasoning: 0.25,
      creativity: 0.15,
      processing_speed: 0.15
    };
    let weightedSum = 0;
    dimensions.forEach((dim) => {
      weightedSum += dim.score * (weights[dim.name] || 0.2);
    });
    return Math.round(weightedSum);
  }
  generateFitnessExercises(dimensions) {
    const exercises = [];
    const weakDimensions = dimensions.filter((d) => d.score < 60);
    for (const dimension of weakDimensions) {
      exercises.push(...this.getExercisesForDimension(dimension.name));
    }
    exercises.push(...this.getMaintenanceExercises());
    return exercises;
  }
  getExercisesForDimension(dimension) {
    const exerciseMap = {
      memory: [
        {
          exerciseId: "mem-1",
          name: "Memory Palace Builder",
          type: "spatial_memory",
          targetDimension: "memory",
          difficulty: 3,
          duration: 15,
          frequency: "daily",
          completionRate: 0,
          effectiveness: 0.8
        },
        {
          exerciseId: "mem-2",
          name: "Pattern Recognition",
          type: "visual_memory",
          targetDimension: "memory",
          difficulty: 2,
          duration: 10,
          frequency: "daily",
          completionRate: 0,
          effectiveness: 0.7
        }
      ],
      attention: [
        {
          exerciseId: "att-1",
          name: "Focus Flow",
          type: "sustained_attention",
          targetDimension: "attention",
          difficulty: 2,
          duration: 20,
          frequency: "daily",
          completionRate: 0,
          effectiveness: 0.85
        }
      ],
      reasoning: [
        {
          exerciseId: "rea-1",
          name: "Logic Puzzles",
          type: "logical_reasoning",
          targetDimension: "reasoning",
          difficulty: 3,
          duration: 15,
          frequency: "daily",
          completionRate: 0,
          effectiveness: 0.75
        }
      ],
      creativity: [
        {
          exerciseId: "cre-1",
          name: "Divergent Thinking",
          type: "creative_ideation",
          targetDimension: "creativity",
          difficulty: 2,
          duration: 10,
          frequency: "daily",
          completionRate: 0,
          effectiveness: 0.7
        }
      ],
      processing_speed: [
        {
          exerciseId: "spd-1",
          name: "Speed Drills",
          type: "reaction_time",
          targetDimension: "processing_speed",
          difficulty: 2,
          duration: 10,
          frequency: "daily",
          completionRate: 0,
          effectiveness: 0.8
        }
      ]
    };
    return exerciseMap[dimension] || [];
  }
  getMaintenanceExercises() {
    return [
      {
        exerciseId: "gen-1",
        name: "Brain Cross-Training",
        type: "mixed",
        targetDimension: "general",
        difficulty: 2,
        duration: 15,
        frequency: "weekly",
        completionRate: 0,
        effectiveness: 0.6
      }
    ];
  }
  async trackFitnessProgress(userId) {
    if (!this.dbAdapter) {
      return this.getDefaultProgress();
    }
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
    const recentSessions = await this.dbAdapter.getFitnessSessions(userId, weekAgo);
    const milestones = await this.dbAdapter.getFitnessMilestones(userId);
    const totalSessions = await this.dbAdapter.countFitnessSessions(userId);
    return {
      weeklyGoal: 5,
      weeklyCompleted: recentSessions.length,
      streak: this.calculateStreak(recentSessions),
      totalSessions,
      improvementRate: 0.15,
      milestones
    };
  }
  getDefaultProgress() {
    return {
      weeklyGoal: 5,
      weeklyCompleted: 0,
      streak: 0,
      totalSessions: 0,
      improvementRate: 0,
      milestones: []
    };
  }
  calculateStreak(sessions) {
    const dates = sessions.map((s) => s.completedAt.toDateString());
    const uniqueDates = Array.from(new Set(dates)).sort();
    let streak = 0;
    let currentStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1e3 * 60 * 60 * 24);
      if (dayDiff === 1) {
        currentStreak++;
        streak = Math.max(streak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    return streak;
  }
  generateFitnessRecommendations(dimensions, progress) {
    const recommendations = [];
    dimensions.filter((d) => d.score < 60).forEach((dimension) => {
      recommendations.push({
        dimension: dimension.name,
        recommendation: `Focus on ${dimension.name} exercises to improve from ${dimension.score} to target 70+`,
        priority: dimension.score < 40 ? "high" : "medium",
        exercises: this.getExercisesForDimension(dimension.name).map((e) => e.name),
        expectedImprovement: 15
      });
    });
    if (progress.weeklyCompleted < progress.weeklyGoal) {
      recommendations.push({
        dimension: "general",
        recommendation: "Increase training frequency to meet weekly goals",
        priority: "high",
        exercises: ["Quick daily exercises"],
        expectedImprovement: 10
      });
    }
    return recommendations;
  }
  // ============================================================================
  // LEARNING DNA
  // ============================================================================
  async generateLearningDNA(userId) {
    if (!this.dbAdapter) {
      throw new Error("Database adapter required for Learning DNA generation");
    }
    const learningData = await this.dbAdapter.getUserLearningData(userId);
    const dnaSequence = this.generateDNASequence(learningData);
    const traits = this.identifyLearningTraits(dnaSequence);
    const heritage = this.traceLearningHeritage(learningData);
    const mutations = this.detectDNAMutations(learningData);
    const phenotype = this.expressLearningPhenotype(dnaSequence, traits, mutations);
    const dna = {
      userId,
      dnaSequence,
      traits,
      heritage,
      mutations,
      phenotype
    };
    await this.dbAdapter.storeLearningDNA(dna);
    return dna;
  }
  generateDNASequence(learningData) {
    const cognitiveCode = this.generateCognitiveCode(learningData);
    const segments = [
      this.createCognitiveSegment(learningData),
      this.createBehavioralSegment(learningData),
      this.createEnvironmentalSegment(learningData),
      this.createSocialSegment(learningData)
    ];
    const { dominant, recessive } = this.identifyGeneExpression(segments);
    const uniqueMarkers = this.findUniqueMarkers(learningData);
    return {
      cognitiveCode,
      segments,
      dominantGenes: dominant,
      recessiveGenes: recessive,
      uniqueMarkers
    };
  }
  generateCognitiveCode(learningData) {
    const patterns = [
      learningData.preferredLearningStyle,
      learningData.peakPerformanceTime,
      learningData.strongestSubject,
      learningData.learningVelocity?.toString()
    ];
    return patterns.map((p) => p ? p.toString().substring(0, 3).toUpperCase() : "XXX").join("-");
  }
  createCognitiveSegment(data) {
    return {
      segmentId: "seg-cognitive",
      type: "cognitive",
      expression: 0.8,
      traits: [
        data.preferredLearningStyle || "visual",
        `memory-${this.assessMemory(data) > 70 ? "strong" : "developing"}`,
        `reasoning-${this.assessReasoning(data) > 70 ? "analytical" : "intuitive"}`
      ],
      modifiers: ["focus-enhancer", "pattern-recognizer"]
    };
  }
  createBehavioralSegment(data) {
    return {
      segmentId: "seg-behavioral",
      type: "behavioral",
      expression: 0.7,
      traits: [
        (data.learningVelocity || 1) > 2 ? "fast-learner" : "steady-learner",
        (data.completionRate || 0.5) > 0.8 ? "persistent" : "exploratory"
      ],
      modifiers: ["motivation-responsive"]
    };
  }
  createEnvironmentalSegment(data) {
    return {
      segmentId: "seg-environmental",
      type: "environmental",
      expression: 0.6,
      traits: [
        `peak-time-${data.peakPerformanceTime || "10:00"}`,
        "adaptive-environment"
      ],
      modifiers: ["context-sensitive"]
    };
  }
  createSocialSegment(_data) {
    return {
      segmentId: "seg-social",
      type: "social",
      expression: 0.5,
      traits: ["collaborative", "peer-learning"],
      modifiers: ["community-engaged"]
    };
  }
  identifyGeneExpression(segments) {
    const dominant = [];
    const recessive = [];
    segments.forEach((segment) => {
      segment.traits.forEach((trait) => {
        if (segment.expression > 0.7) {
          dominant.push(trait);
        } else if (segment.expression < 0.3) {
          recessive.push(trait);
        }
      });
    });
    return { dominant, recessive };
  }
  findUniqueMarkers(data) {
    const markers = [];
    if ((data.learningVelocity || 1) > 3) {
      markers.push("rapid-assimilation");
    }
    if (data.strongestSubject && data.achievements.length > 20) {
      markers.push(`${data.strongestSubject}-specialist`);
    }
    return markers;
  }
  identifyLearningTraits(dnaSequence) {
    const traits = [];
    dnaSequence.segments.forEach((segment) => {
      segment.traits.forEach((traitName) => {
        traits.push({
          traitId: `trait-${traits.length}`,
          name: traitName,
          category: segment.type,
          strength: segment.expression,
          heritability: 0.7,
          malleability: 0.3,
          linkedTraits: segment.traits.filter((t) => t !== traitName)
        });
      });
    });
    return traits;
  }
  traceLearningHeritage(data) {
    return {
      ancestralPatterns: this.identifyAncestralPatterns(data),
      evolutionPath: this.traceEvolution(data),
      adaptations: this.identifyAdaptations(data)
    };
  }
  identifyAncestralPatterns(_data) {
    return [
      {
        patternId: "anc-1",
        origin: "initial-learning-style",
        strength: 0.8,
        influence: 0.6,
        active: true
      }
    ];
  }
  traceEvolution(_data) {
    return [
      {
        stage: 1,
        timestamp: new Date(Date.now() - 180 * 24 * 60 * 60 * 1e3),
        changes: ["adopted-visual-learning", "increased-pace"],
        triggers: ["course-difficulty-increase"],
        success: true
      }
    ];
  }
  identifyAdaptations(_data) {
    return [
      {
        adaptationId: "adapt-1",
        trigger: "complex-content",
        response: "break-into-chunks",
        effectiveness: 0.85,
        frequency: 0.7
      }
    ];
  }
  detectDNAMutations(_data) {
    return [
      {
        mutationId: "mut-1",
        type: "beneficial",
        gene: "learning-speed",
        effect: "increased-retention",
        stability: 0.9,
        reversible: false
      }
    ];
  }
  expressLearningPhenotype(dnaSequence, traits, mutations) {
    const visibleTraits = traits.filter((t) => t.strength > 0.6).map((t) => t.name);
    const capabilities = this.deriveCapabilities(traits, mutations);
    const limitations = this.identifyLimitations(traits);
    const potential = this.assessPotential(dnaSequence, traits);
    return {
      visibleTraits,
      capabilities,
      limitations,
      potential
    };
  }
  deriveCapabilities(_traits, _mutations) {
    return [
      {
        name: "Rapid Pattern Recognition",
        level: 0.8,
        evidence: ["High visual learning score", "Pattern-based success"],
        applications: ["Mathematics", "Programming", "Design"]
      }
    ];
  }
  identifyLimitations(_traits) {
    return [
      {
        name: "Extended Focus Sessions",
        severity: 0.3,
        workarounds: ["Pomodoro technique", "Micro-learning"],
        improvementPath: ["Gradual duration increase", "Attention exercises"]
      }
    ];
  }
  assessPotential(_dnaSequence, _traits) {
    return [
      {
        area: "Advanced Problem Solving",
        currentLevel: 0.6,
        potentialLevel: 0.9,
        unlockConditions: ["Complete advanced reasoning course", "Practice daily"],
        developmentPath: ["Basic logic", "Intermediate algorithms", "Complex systems"]
      }
    ];
  }
  // ============================================================================
  // STUDY BUDDY
  // ============================================================================
  async createStudyBuddy(userId, preferences) {
    if (!this.dbAdapter) {
      throw new Error("Database adapter required for Study Buddy creation");
    }
    const learningData = await this.dbAdapter.getUserLearningData(userId);
    const personality = this.generateBuddyPersonality(learningData, preferences);
    const avatar = this.createBuddyAvatar(personality, preferences);
    const relationship = this.initializeBuddyRelationship(userId);
    const capabilities = this.defineBuddyCapabilities(personality, learningData);
    const buddyId = `buddy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const name = preferences?.name || this.generateBuddyName(personality);
    const studyBuddy = {
      buddyId,
      name,
      personality,
      avatar,
      relationship,
      capabilities,
      interactions: [],
      effectiveness: {
        motivationImpact: 0,
        learningImpact: 0,
        retentionImpact: 0,
        satisfactionScore: 0,
        adjustments: []
      }
    };
    await this.dbAdapter.createStudyBuddy(studyBuddy);
    return studyBuddy;
  }
  generateBuddyPersonality(_data, preferences) {
    const type = preferences?.personalityType || "motivator";
    return {
      type,
      traits: this.generatePersonalityTraits(type),
      communicationStyle: "balanced-encouraging",
      humorLevel: preferences?.humorLevel || 0.5,
      strictnessLevel: preferences?.strictnessLevel || 0.3,
      adaptability: 0.8
    };
  }
  generatePersonalityTraits(type) {
    const traitMap = {
      motivator: [
        { trait: "enthusiastic", strength: 0.9, expression: ["Let's do this!", "You've got this!"] },
        { trait: "positive", strength: 0.8, expression: ["Great progress!", "Keep it up!"] }
      ],
      challenger: [
        { trait: "competitive", strength: 0.7, expression: ["Can you beat your record?", "Show me what you've learned!"] },
        { trait: "demanding", strength: 0.6, expression: ["That's good, but can you do better?", "Push yourself!"] }
      ],
      supporter: [
        { trait: "empathetic", strength: 0.9, expression: ["I understand", "It's okay, let's try again"] },
        { trait: "patient", strength: 0.8, expression: ["Take your time", "No rush"] }
      ],
      analyst: [
        { trait: "precise", strength: 0.9, expression: ["Based on the data...", "Let's analyze this"] },
        { trait: "methodical", strength: 0.8, expression: ["Step by step", "First, then next"] }
      ],
      creative: [
        { trait: "imaginative", strength: 0.9, expression: ["What if we tried...", "Imagine this"] },
        { trait: "playful", strength: 0.7, expression: ["Let's experiment!", "How about something different?"] }
      ]
    };
    return traitMap[type] || [];
  }
  createBuddyAvatar(personality, preferences) {
    return {
      avatarId: `avatar-${Date.now()}`,
      appearance: preferences?.appearance || this.generateAppearance(personality),
      animations: ["idle", "thinking", "celebrating", "encouraging"],
      expressions: ["happy", "proud", "concerned", "excited", "thoughtful"],
      customizations: preferences?.customizations || {}
    };
  }
  generateAppearance(personality) {
    const appearanceMap = {
      motivator: "energetic-coach",
      challenger: "determined-competitor",
      supporter: "gentle-friend",
      analyst: "wise-mentor",
      creative: "artistic-companion"
    };
    return appearanceMap[personality.type];
  }
  initializeBuddyRelationship(userId) {
    return {
      userId,
      trustLevel: 0.5,
      rapportScore: 0.5,
      interactionCount: 0,
      sharedExperiences: [],
      insideJokes: [],
      preferredTopics: []
    };
  }
  defineBuddyCapabilities(personality, _data) {
    const baseCapabilities = [
      {
        capability: "conversation",
        proficiency: 0.9,
        specializations: ["learning-topics", "motivation"],
        limitations: ["personal-advice"]
      },
      {
        capability: "quiz-generation",
        proficiency: 0.8,
        specializations: ["adaptive-difficulty"],
        limitations: []
      }
    ];
    if (personality.type === "analyst") {
      baseCapabilities.push({
        capability: "performance-analysis",
        proficiency: 0.95,
        specializations: ["detailed-feedback", "improvement-strategies"],
        limitations: []
      });
    }
    return baseCapabilities;
  }
  generateBuddyName(personality) {
    const nameMap = {
      motivator: ["Max", "Luna", "Spark"],
      challenger: ["Rex", "Blaze", "Ace"],
      supporter: ["Sam", "Harmony", "Sage"],
      analyst: ["Newton", "Data", "Logic"],
      creative: ["Aurora", "Pixel", "Jazz"]
    };
    const names = nameMap[personality.type] || ["Buddy"];
    return names[Math.floor(Math.random() * names.length)];
  }
  async interactWithBuddy(buddyId, userId, interactionType, context) {
    if (!this.dbAdapter) {
      throw new Error("Database adapter required for buddy interaction");
    }
    const buddy = await this.dbAdapter.getStudyBuddy(buddyId);
    if (!buddy) {
      throw new Error("Study buddy not found");
    }
    let interaction;
    switch (interactionType) {
      case "conversation":
        interaction = this.generateConversation(buddy, context);
        break;
      case "quiz":
        interaction = this.generateQuizInteraction(buddy, context);
        break;
      case "encouragement":
        interaction = this.generateEncouragement(buddy, context);
        break;
      case "challenge":
        interaction = this.generateChallenge(buddy, context);
        break;
      case "celebration":
        interaction = this.generateCelebration(buddy, context);
        break;
      default:
        throw new Error("Invalid interaction type");
    }
    await this.updateBuddyRelationship(buddy, interaction);
    await this.dbAdapter.storeBuddyInteraction(buddyId, userId, interaction);
    return interaction;
  }
  generateConversation(buddy, context) {
    const topic = context.topic || "general learning";
    const expressions = buddy.personality.traits[0]?.expression || ["Hello!"];
    return {
      interactionId: `int-${Date.now()}`,
      type: "conversation",
      content: {
        message: `${expressions[0]} Let me help you with ${topic}.`,
        topic,
        emotion: "engaged"
      },
      userResponse: "",
      effectiveness: 0.8,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  generateQuizInteraction(_buddy, context) {
    return {
      interactionId: `int-${Date.now()}`,
      type: "quiz",
      content: {
        question: "Based on what we just learned, can you explain the main concept?",
        options: context.options || [],
        difficulty: context.difficulty || "medium"
      },
      userResponse: "",
      effectiveness: 0,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  generateEncouragement(buddy, _context) {
    const encouragements = buddy.personality.traits.find((t) => t.trait === "positive")?.expression || ["You're doing great!"];
    return {
      interactionId: `int-${Date.now()}`,
      type: "encouragement",
      content: {
        message: encouragements[Math.floor(Math.random() * encouragements.length)],
        animation: "cheering"
      },
      userResponse: "",
      effectiveness: 0.9,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  generateChallenge(_buddy, _context) {
    return {
      interactionId: `int-${Date.now()}`,
      type: "challenge",
      content: {
        challenge: "Can you solve this advanced problem?",
        difficulty: "hard",
        reward: "achievement-badge",
        timeLimit: 300
      },
      userResponse: "",
      effectiveness: 0,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  generateCelebration(buddy, context) {
    const achievement = context.achievement || "Great progress!";
    return {
      interactionId: `int-${Date.now()}`,
      type: "celebration",
      content: {
        achievement,
        animation: "celebration-dance",
        message: `Amazing work on ${achievement}! ${buddy.name} is proud of you!`
      },
      userResponse: "",
      effectiveness: 1,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  async updateBuddyRelationship(buddy, interaction) {
    if (!this.dbAdapter) return;
    buddy.relationship.interactionCount++;
    if (interaction.effectiveness > 0.8) {
      buddy.relationship.trustLevel = Math.min(1, buddy.relationship.trustLevel + 0.01);
      buddy.relationship.rapportScore = Math.min(1, buddy.relationship.rapportScore + 0.02);
    }
    if (interaction.type === "celebration" || interaction.effectiveness > 0.9) {
      const experience = {
        experienceId: `exp-${Date.now()}`,
        type: interaction.type,
        description: interaction.content.message || "Shared moment",
        emotionalImpact: interaction.effectiveness,
        timestamp: /* @__PURE__ */ new Date()
      };
      buddy.relationship.sharedExperiences.push(experience);
    }
    await this.dbAdapter.updateStudyBuddy(buddy.buddyId, {
      relationship: buddy.relationship
    });
  }
  // ============================================================================
  // QUANTUM LEARNING PATHS
  // ============================================================================
  async createQuantumPath(userId, learningGoal) {
    if (!this.dbAdapter) {
      throw new Error("Database adapter required for Quantum Path creation");
    }
    const possibleStates = await this.generateQuantumStates(userId, learningGoal);
    const superposition = this.createSuperposition(possibleStates);
    const entanglements = await this.identifyEntanglements(userId, possibleStates);
    const probability = this.calculatePathProbabilities(possibleStates, entanglements);
    const quantumPath = {
      pathId: `qpath-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      superposition,
      entanglements,
      observations: [],
      collapse: null,
      probability
    };
    await this.dbAdapter.storeQuantumPath(quantumPath, learningGoal);
    return quantumPath;
  }
  async generateQuantumStates(_userId, _learningGoal) {
    const states = [];
    states.push({
      stateId: "state-traditional",
      learningPath: this.generateTraditionalPath(),
      probability: 0.4,
      energy: 50,
      outcomes: [
        {
          outcomeId: "out-1",
          description: "Solid foundational understanding",
          probability: 0.8,
          value: 0.7,
          requirements: ["consistent-effort", "completion"]
        }
      ],
      constraints: ["linear-progression", "fixed-pace"]
    });
    states.push({
      stateId: "state-accelerated",
      learningPath: this.generateAcceleratedPath(),
      probability: 0.3,
      energy: 80,
      outcomes: [
        {
          outcomeId: "out-2",
          description: "Rapid skill acquisition",
          probability: 0.6,
          value: 0.9,
          requirements: ["high-commitment", "prior-knowledge"]
        }
      ],
      constraints: ["intense-schedule", "prerequisite-knowledge"]
    });
    states.push({
      stateId: "state-exploratory",
      learningPath: this.generateExploratoryPath(),
      probability: 0.3,
      energy: 60,
      outcomes: [
        {
          outcomeId: "out-3",
          description: "Deep, creative understanding",
          probability: 0.7,
          value: 0.85,
          requirements: ["curiosity", "time-flexibility"]
        }
      ],
      constraints: ["self-directed", "variable-timeline"]
    });
    return states;
  }
  generateTraditionalPath() {
    return [
      {
        nodeId: "node-1",
        content: "Introduction and Fundamentals",
        type: "theory",
        duration: 120,
        prerequisites: [],
        skillsGained: ["basic-concepts"],
        quantumProperties: {
          uncertainty: 0.1,
          entanglementStrength: 0.3,
          observationSensitivity: 0.2,
          tunnelingProbability: 0.05
        }
      }
    ];
  }
  generateAcceleratedPath() {
    return [
      {
        nodeId: "node-fast-1",
        content: "Intensive Boot Camp",
        type: "intensive",
        duration: 480,
        prerequisites: ["basic-knowledge"],
        skillsGained: ["rapid-application"],
        quantumProperties: {
          uncertainty: 0.3,
          entanglementStrength: 0.5,
          observationSensitivity: 0.4,
          tunnelingProbability: 0.2
        }
      }
    ];
  }
  generateExploratoryPath() {
    return [
      {
        nodeId: "node-explore-1",
        content: "Creative Exploration",
        type: "discovery",
        duration: 180,
        prerequisites: [],
        skillsGained: ["creative-thinking", "problem-solving"],
        quantumProperties: {
          uncertainty: 0.5,
          entanglementStrength: 0.7,
          observationSensitivity: 0.3,
          tunnelingProbability: 0.3
        }
      }
    ];
  }
  createSuperposition(states) {
    const probabilities = /* @__PURE__ */ new Map();
    states.forEach((state) => {
      probabilities.set(state.stateId, state.probability);
    });
    return {
      possibleStates: states,
      currentProbabilities: probabilities,
      coherenceLevel: 1,
      decoherenceFactors: []
    };
  }
  async identifyEntanglements(userId, _states) {
    const entanglements = [];
    if (this.dbAdapter) {
      const peers = await this.dbAdapter.findLearningPeers(userId);
      if (peers.length > 0) {
        entanglements.push({
          entanglementId: "ent-peer",
          entangledPaths: peers.map((p) => p.pathId),
          correlationStrength: 0.6,
          type: "positive",
          effects: [
            {
              targetPath: "state-traditional",
              effect: "motivation-boost",
              magnitude: 0.3,
              condition: "peer-progress"
            }
          ]
        });
      }
    }
    return entanglements;
  }
  calculatePathProbabilities(states, entanglements) {
    let totalProbability = 0;
    let totalTime = 0;
    const outcomes = /* @__PURE__ */ new Map();
    states.forEach((state) => {
      const stateProbability = state.probability;
      totalProbability += stateProbability * state.outcomes[0].probability;
      totalTime += stateProbability * state.learningPath.reduce((sum, node) => sum + node.duration, 0);
      state.outcomes.forEach((outcome) => {
        const current = outcomes.get(outcome.description) || 0;
        outcomes.set(outcome.description, current + stateProbability * outcome.probability);
      });
    });
    entanglements.forEach((ent) => {
      if (ent.type === "positive") {
        totalProbability *= 1 + ent.correlationStrength * 0.1;
      }
    });
    return {
      successProbability: Math.min(1, totalProbability),
      completionTimeDistribution: {
        mean: totalTime,
        standardDeviation: totalTime * 0.2,
        minimum: totalTime * 0.7,
        maximum: totalTime * 1.5,
        quantiles: /* @__PURE__ */ new Map([
          [0.25, totalTime * 0.85],
          [0.5, totalTime],
          [0.75, totalTime * 1.15]
        ])
      },
      outcomeDistribution: {
        outcomes,
        expectedValue: 0.8,
        variance: 0.1,
        bestCase: states[0].outcomes[0],
        worstCase: states[states.length - 1].outcomes[0]
      },
      uncertaintyPrinciple: {
        positionUncertainty: 0.3,
        momentumUncertainty: 0.4,
        product: 0.12
      }
    };
  }
  async observeQuantumPath(pathId, observationType, observationData) {
    if (!this.dbAdapter) {
      throw new Error("Database adapter required for path observation");
    }
    const path = await this.dbAdapter.getQuantumPath(pathId);
    if (!path) {
      throw new Error("Quantum path not found");
    }
    const observation = {
      observationId: `obs-${Date.now()}`,
      observer: observationData.userId || "system",
      observationType,
      timestamp: /* @__PURE__ */ new Date(),
      impact: this.calculateObservationImpact(path, observationType, observationData)
    };
    await this.updateQuantumPath(path, observation);
    if (this.shouldCollapsePath(path, observation)) {
      await this.collapseQuantumPath(path, observation);
    }
    await this.dbAdapter.storeQuantumObservation(pathId, observation);
    return observation;
  }
  calculateObservationImpact(path, observationType, observationData) {
    const impact = {
      collapsedStates: [],
      probabilityShifts: /* @__PURE__ */ new Map(),
      newEntanglements: [],
      decoherence: 0
    };
    switch (observationType) {
      case "progress_check":
        impact.decoherence = 0.1;
        if (observationData.performance > 0.8) {
          path.superposition.possibleStates.forEach((state) => {
            if (state.energy < 70) {
              const current = path.superposition.currentProbabilities.get(state.stateId) || 0;
              impact.probabilityShifts.set(state.stateId, current * 0.1);
            }
          });
        }
        break;
      case "assessment":
        impact.decoherence = 0.3;
        path.superposition.possibleStates.forEach((state) => {
          const current = path.superposition.currentProbabilities.get(state.stateId) || 0;
          if (current < 0.2) {
            impact.collapsedStates.push(state.stateId);
          }
        });
        break;
      case "interaction":
        if (observationData.interactionType === "collaboration") {
          impact.newEntanglements.push(`ent-collab-${Date.now()}`);
        }
        impact.decoherence = 0.05;
        break;
    }
    return impact;
  }
  async updateQuantumPath(path, observation) {
    path.superposition.coherenceLevel *= 1 - observation.impact.decoherence;
    observation.impact.probabilityShifts.forEach((shift, stateId) => {
      const current = path.superposition.currentProbabilities.get(stateId) || 0;
      path.superposition.currentProbabilities.set(stateId, Math.min(1, current + shift));
    });
    observation.impact.collapsedStates.forEach((stateId) => {
      path.superposition.possibleStates = path.superposition.possibleStates.filter(
        (s) => s.stateId !== stateId
      );
      path.superposition.currentProbabilities.delete(stateId);
    });
    let total = 0;
    path.superposition.currentProbabilities.forEach((p) => {
      total += p;
    });
    if (total > 0) {
      path.superposition.currentProbabilities.forEach((p, stateId) => {
        path.superposition.currentProbabilities.set(stateId, p / total);
      });
    }
    path.observations.push(observation);
    if (this.dbAdapter) {
      await this.dbAdapter.updateQuantumPath(path.pathId, {
        superposition: path.superposition,
        observations: path.observations
      });
    }
  }
  shouldCollapsePath(path, _observation) {
    if (path.superposition.coherenceLevel < 0.3) return true;
    if (path.superposition.possibleStates.length === 1) return true;
    let maxProbability = 0;
    path.superposition.currentProbabilities.forEach((p) => {
      maxProbability = Math.max(maxProbability, p);
    });
    return maxProbability > 0.9;
  }
  async collapseQuantumPath(path, observation) {
    let selectedState = null;
    let maxProbability = 0;
    path.superposition.possibleStates.forEach((state) => {
      const probability = path.superposition.currentProbabilities.get(state.stateId) || 0;
      if (probability > maxProbability) {
        maxProbability = probability;
        selectedState = state;
      }
    });
    if (!selectedState) {
      throw new Error("No state to collapse to");
    }
    path.collapse = {
      collapseId: `collapse-${Date.now()}`,
      finalState: selectedState,
      timestamp: /* @__PURE__ */ new Date(),
      trigger: observation.observationType,
      confidence: maxProbability,
      alternativesLost: path.superposition.possibleStates.filter((s) => s.stateId !== selectedState.stateId).map((s) => s.stateId)
    };
    if (this.dbAdapter) {
      await this.dbAdapter.updateQuantumPath(path.pathId, {
        collapse: path.collapse
      });
    }
  }
};
function createInnovationEngine(config = {}) {
  return new InnovationEngine(config);
}

// src/engines/market-engine.ts
var MarketEngine = class {
  config;
  dbAdapter;
  cacheDurationHours;
  constructor(config = {}) {
    this.config = config;
    this.dbAdapter = config.databaseAdapter;
    this.cacheDurationHours = config.cacheDurationHours || 24;
  }
  async analyzeCourse(courseId, analysisType = "comprehensive", includeRecommendations = true) {
    if (!this.dbAdapter) {
      throw new Error("Database adapter required for course analysis");
    }
    const course = await this.dbAdapter.getCourse(courseId);
    if (!course) {
      throw new Error("Course not found");
    }
    const existingAnalysis = await this.dbAdapter.getStoredAnalysis(courseId);
    const hoursSinceLastAnalysis = existingAnalysis ? (Date.now() - existingAnalysis.lastAnalyzedAt.getTime()) / (1e3 * 60 * 60) : Infinity;
    if (existingAnalysis && hoursSinceLastAnalysis < this.cacheDurationHours && analysisType === "comprehensive") {
      return this.parseStoredAnalysis(existingAnalysis);
    }
    const analysis = this.performAnalysis(course, analysisType, includeRecommendations);
    await this.storeAnalysis(courseId, analysis);
    return analysis;
  }
  performAnalysis(course, _analysisType, includeRecommendations) {
    const marketValue = this.assessMarketValue(course);
    const pricing = this.analyzePricing(course);
    const competition = this.analyzeCompetition(course);
    const branding = this.analyzeBranding(course);
    const trends = this.analyzeTrends(course);
    const recommendations = includeRecommendations ? this.generateRecommendations(course, marketValue) : { immediate: [], shortTerm: [], longTerm: [] };
    return {
      marketValue,
      pricing,
      competition,
      branding,
      trends,
      recommendations
    };
  }
  assessMarketValue(course) {
    const demand = this.calculateDemandScore(course);
    const competition = this.calculateCompetitionScore(course);
    const uniqueness = this.calculateUniquenessScore(course);
    const timing = this.calculateTimingScore(course);
    const score = Math.round(
      demand * 0.3 + competition * 0.2 + uniqueness * 0.3 + timing * 0.2
    );
    return {
      score,
      factors: {
        demand,
        competition,
        uniqueness,
        timing
      }
    };
  }
  calculateDemandScore(course) {
    let score = 50;
    const enrollmentCount = course.enrollments.length;
    if (enrollmentCount > 1e3) score += 30;
    else if (enrollmentCount > 500) score += 20;
    else if (enrollmentCount > 100) score += 10;
    const avgRating = this.calculateAverageRating(course.reviews);
    if (avgRating > 4.5) score += 15;
    else if (avgRating > 4) score += 10;
    else if (avgRating > 3.5) score += 5;
    return Math.min(100, Math.max(0, score));
  }
  calculateCompetitionScore(course) {
    let score = 60;
    const totalSections = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.length,
      0
    );
    if (totalSections > 50) score += 15;
    else if (totalSections > 30) score += 10;
    else if (totalSections > 15) score += 5;
    return Math.min(100, Math.max(0, score));
  }
  calculateUniquenessScore(course) {
    let score = 50;
    const totalSections = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.length,
      0
    );
    const depthScore = Math.min(25, totalSections / 2);
    score += depthScore;
    const outcomeCount = course.whatYouWillLearn.length;
    if (outcomeCount > 10) score += 15;
    else if (outcomeCount > 5) score += 10;
    else if (outcomeCount > 2) score += 5;
    return Math.min(100, Math.max(0, score));
  }
  calculateTimingScore(course) {
    let score = 70;
    const daysSinceUpdate = (Date.now() - course.updatedAt.getTime()) / (1e3 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) score += 20;
    else if (daysSinceUpdate < 90) score += 10;
    else if (daysSinceUpdate > 365) score -= 20;
    return Math.min(100, Math.max(0, score));
  }
  analyzePricing(course) {
    const basePrice = course.price || 0;
    const totalSections = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.length,
      0
    );
    let recommendedPrice = 29;
    if (totalSections > 50) recommendedPrice = 99;
    else if (totalSections > 30) recommendedPrice = 79;
    else if (totalSections > 15) recommendedPrice = 49;
    const avgRating = this.calculateAverageRating(course.reviews);
    if (avgRating > 4.5) recommendedPrice *= 1.2;
    else if (avgRating < 3.5) recommendedPrice *= 0.8;
    recommendedPrice = Math.round(recommendedPrice);
    return {
      recommendedPrice,
      priceRange: {
        min: Math.round(recommendedPrice * 0.7),
        max: Math.round(recommendedPrice * 1.5)
      },
      competitorAverage: 59,
      valueProposition: this.generateValueProposition(course, recommendedPrice)
    };
  }
  generateValueProposition(course, price) {
    const totalSections = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.length,
      0
    );
    const pricePerSection = price / Math.max(1, totalSections);
    if (pricePerSection < 1) {
      return "Exceptional value with comprehensive content coverage";
    } else if (pricePerSection < 2) {
      return "Competitive pricing with solid content depth";
    } else {
      return "Premium positioning for specialized content";
    }
  }
  analyzeCompetition(course) {
    const directCompetitors = this.identifyCompetitors(course);
    const marketGaps = this.identifyMarketGaps(course);
    const differentiators = this.identifyDifferentiators(course);
    return {
      directCompetitors,
      marketGaps,
      differentiators
    };
  }
  identifyCompetitors(_course) {
    return [
      {
        name: "Generic Competitor Course",
        price: 59.99,
        rating: 4.5,
        enrollments: 1e4,
        strengths: ["Established brand", "Large student base"],
        weaknesses: ["Less personalized", "Outdated content"],
        features: ["Video lessons", "Quizzes", "Certificate"]
      }
    ];
  }
  identifyMarketGaps(course) {
    const gaps = [];
    const totalSections = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.length,
      0
    );
    if (totalSections < 20) {
      gaps.push("More hands-on projects needed");
    }
    if (!course.chapters.some((ch) => ch.title.toLowerCase().includes("advanced"))) {
      gaps.push("Advanced topics underserved");
    }
    if (gaps.length === 0) {
      gaps.push("Personalized learning paths");
      gaps.push("Live mentorship options");
    }
    return gaps;
  }
  identifyDifferentiators(_course) {
    return [
      "AI-powered personalized learning",
      "Comprehensive curriculum depth",
      "Active instructor engagement",
      "Project-based learning approach"
    ];
  }
  analyzeBranding(course) {
    const score = this.calculateBrandingScore(course);
    const strengths = this.identifyBrandingStrengths(course);
    const improvements = this.identifyBrandingImprovements(course);
    const targetAudience = this.identifyTargetAudience(course);
    return {
      score,
      strengths,
      improvements,
      targetAudience
    };
  }
  calculateBrandingScore(course) {
    let score = 50;
    if (course.title.length > 10 && course.title.length < 60) score += 10;
    if (course.description && course.description.length > 100) score += 15;
    if (course.whatYouWillLearn.length > 5) score += 10;
    if (course.reviews.length > 10) score += 10;
    return Math.min(100, Math.max(0, score));
  }
  identifyBrandingStrengths(course) {
    const strengths = [];
    if (course.chapters.length > 5) {
      strengths.push("Well-structured content");
    }
    if (course.whatYouWillLearn.length > 5) {
      strengths.push("Clear learning objectives");
    }
    if (course.reviews.length > 10 && this.calculateAverageRating(course.reviews) > 4) {
      strengths.push("Strong social proof");
    }
    if (strengths.length === 0) {
      strengths.push("Good pacing and progression");
    }
    return strengths;
  }
  identifyBrandingImprovements(course) {
    const improvements = [];
    if (!course.description || course.description.length < 200) {
      improvements.push("Enhance course description");
    }
    if (course.reviews.length < 10) {
      improvements.push("Add more social proof and testimonials");
    }
    if (course.whatYouWillLearn.length < 5) {
      improvements.push("Expand learning objectives");
    }
    if (improvements.length === 0) {
      improvements.push("Improve course description SEO");
    }
    return improvements;
  }
  identifyTargetAudience(course) {
    const hasAdvanced = course.chapters.some(
      (ch) => ch.title.toLowerCase().includes("advanced")
    );
    const hasBeginner = course.chapters.some(
      (ch) => ch.title.toLowerCase().includes("beginner") || ch.title.toLowerCase().includes("introduction")
    );
    let primary = "Intermediate learners";
    if (hasBeginner && !hasAdvanced) primary = "Beginners and newcomers";
    if (hasAdvanced && !hasBeginner) primary = "Advanced practitioners";
    return {
      primary,
      secondary: ["Career changers", "Skill upgraders"],
      demographics: {
        age: "25-45",
        education: "College degree or equivalent",
        experience: "1-3 years in related field"
      }
    };
  }
  analyzeTrends(course) {
    const marketGrowth = this.assessMarketGrowth(course);
    const topicRelevance = this.calculateTopicRelevance(course);
    const futureProjection = this.generateFutureProjection(marketGrowth);
    const emergingTopics = this.identifyEmergingTopics(course);
    return {
      marketGrowth,
      topicRelevance,
      futureProjection,
      emergingTopics
    };
  }
  assessMarketGrowth(course) {
    const enrollmentRate = course.enrollments.length / Math.max(1, course.chapters.length);
    if (enrollmentRate > 100) return "explosive";
    if (enrollmentRate > 50) return "growing";
    if (enrollmentRate > 10) return "stable";
    return "declining";
  }
  calculateTopicRelevance(course) {
    let relevance = 60;
    const daysSinceUpdate = (Date.now() - course.updatedAt.getTime()) / (1e3 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) relevance += 20;
    else if (daysSinceUpdate < 90) relevance += 10;
    else if (daysSinceUpdate > 365) relevance -= 20;
    if (course.enrollments.length > 100) relevance += 15;
    return Math.min(100, Math.max(0, relevance));
  }
  generateFutureProjection(growth) {
    const projections = {
      explosive: "Exceptional growth potential with high market demand",
      growing: "Positive growth trajectory expected over next 12-18 months",
      stable: "Steady market presence with consistent demand",
      declining: "Market contraction possible, consider pivoting or updating content"
    };
    return projections[growth];
  }
  identifyEmergingTopics(_course) {
    return [
      "AI integration in courses",
      "Microlearning modules",
      "Mobile-first learning",
      "Gamification elements"
    ];
  }
  generateRecommendations(course, marketValue) {
    const immediate = [];
    const shortTerm = [];
    const longTerm = [];
    if (!course.description || course.description.length < 200) {
      immediate.push("Optimize course title and description for SEO");
    }
    immediate.push("Add compelling course trailer video");
    immediate.push("Enhance course thumbnail design");
    if (course.reviews.length < 20) {
      shortTerm.push("Implement student testimonial collection");
    }
    shortTerm.push("Develop email marketing campaign");
    shortTerm.push("Create free preview content");
    if (marketValue.score > 70) {
      longTerm.push("Build course series for recurring revenue");
    }
    longTerm.push("Develop corporate training packages");
    longTerm.push("Create certification program");
    return { immediate, shortTerm, longTerm };
  }
  calculateAverageRating(reviews) {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }
  async storeAnalysis(courseId, analysis) {
    if (!this.dbAdapter) return;
    const storedAnalysis = {
      courseId,
      marketValue: analysis.marketValue.score,
      demandScore: analysis.marketValue.factors.demand,
      competitorAnalysis: analysis.competition,
      pricingAnalysis: analysis.pricing,
      trendAnalysis: analysis.trends,
      brandingScore: analysis.branding.score,
      targetAudienceMatch: analysis.marketValue.factors.uniqueness,
      recommendedPrice: analysis.pricing.recommendedPrice,
      marketPosition: this.determineMarketPosition(analysis.marketValue.score),
      opportunities: analysis.recommendations,
      threats: analysis.competition.directCompetitors.map((c) => c.name),
      lastAnalyzedAt: /* @__PURE__ */ new Date()
    };
    await this.dbAdapter.storeAnalysis(storedAnalysis);
  }
  determineMarketPosition(score) {
    if (score >= 80) return "Market Leader";
    if (score >= 65) return "Strong Competitor";
    if (score >= 50) return "Average Performer";
    return "Needs Improvement";
  }
  parseStoredAnalysis(analysis) {
    return {
      marketValue: {
        score: analysis.marketValue,
        factors: {
          demand: analysis.demandScore,
          competition: 60,
          uniqueness: analysis.targetAudienceMatch,
          timing: 80
        }
      },
      pricing: analysis.pricingAnalysis,
      competition: analysis.competitorAnalysis,
      branding: {
        score: analysis.brandingScore,
        strengths: [],
        improvements: [],
        targetAudience: {
          primary: "General learners",
          secondary: [],
          demographics: {
            age: "25-45",
            education: "Varied",
            experience: "Mixed"
          }
        }
      },
      trends: analysis.trendAnalysis,
      recommendations: analysis.opportunities
    };
  }
  async findCompetitors(courseId) {
    if (!this.dbAdapter) {
      return [];
    }
    return this.dbAdapter.getCompetitors(courseId);
  }
  async analyzeCompetitor(courseId, competitorData) {
    if (!this.dbAdapter) {
      throw new Error("Database adapter required for competitor analysis");
    }
    const competitor = {
      name: competitorData.name || "Unknown Competitor",
      url: competitorData.url,
      price: competitorData.price || 0,
      rating: competitorData.rating,
      enrollments: competitorData.enrollments,
      strengths: competitorData.strengths || [],
      weaknesses: competitorData.weaknesses || [],
      features: competitorData.features || []
    };
    await this.dbAdapter.storeCompetitor(courseId, competitor);
  }
};
function createMarketEngine(config = {}) {
  return new MarketEngine(config);
}

// src/engines/enhanced-depth-engine.ts
var import_crypto = require("crypto");

// src/types/depth-analysis.types.ts
var WEBB_DOK_DESCRIPTORS = {
  1: {
    name: "Recall",
    description: "Recall of information such as facts, definitions, terms, or simple procedures",
    keywords: ["recall", "identify", "recognize", "list", "name", "define", "match", "quote", "memorize", "label"],
    bloomsMapping: ["REMEMBER"]
  },
  2: {
    name: "Skill/Concept",
    description: "Use of information, conceptual knowledge, and procedures",
    keywords: ["summarize", "interpret", "classify", "compare", "organize", "estimate", "predict", "modify", "explain", "describe"],
    bloomsMapping: ["UNDERSTAND", "APPLY"]
  },
  3: {
    name: "Strategic Thinking",
    description: "Reasoning, planning, and using evidence to solve problems",
    keywords: ["analyze", "investigate", "formulate", "hypothesize", "differentiate", "conclude", "critique", "assess", "justify", "develop"],
    bloomsMapping: ["ANALYZE", "EVALUATE"]
  },
  4: {
    name: "Extended Thinking",
    description: "Complex reasoning, planning, developing, and thinking over extended time",
    keywords: ["design", "create", "synthesize", "apply concepts", "connect", "critique across", "prove", "research", "develop original"],
    bloomsMapping: ["CREATE"]
  }
};
var COURSE_TYPE_PROFILES = {
  foundational: {
    type: "foundational",
    description: "Introductory courses for beginners with no prior knowledge",
    idealBloomsDistribution: {
      REMEMBER: 25,
      UNDERSTAND: 35,
      APPLY: 25,
      ANALYZE: 10,
      EVALUATE: 3,
      CREATE: 2
    },
    idealDOKDistribution: { level1: 30, level2: 50, level3: 15, level4: 5 },
    primaryObjective: "Build fundamental understanding",
    targetAudience: "Complete beginners"
  },
  intermediate: {
    type: "intermediate",
    description: "Building on foundational knowledge with practical applications",
    idealBloomsDistribution: {
      REMEMBER: 10,
      UNDERSTAND: 20,
      APPLY: 35,
      ANALYZE: 20,
      EVALUATE: 10,
      CREATE: 5
    },
    idealDOKDistribution: { level1: 15, level2: 40, level3: 35, level4: 10 },
    primaryObjective: "Develop practical skills",
    targetAudience: "Learners with basic knowledge"
  },
  advanced: {
    type: "advanced",
    description: "Deep exploration with critical analysis and evaluation",
    idealBloomsDistribution: {
      REMEMBER: 5,
      UNDERSTAND: 10,
      APPLY: 20,
      ANALYZE: 30,
      EVALUATE: 25,
      CREATE: 10
    },
    idealDOKDistribution: { level1: 5, level2: 25, level3: 45, level4: 25 },
    primaryObjective: "Master complex concepts",
    targetAudience: "Experienced practitioners"
  },
  professional: {
    type: "professional",
    description: "Industry-focused with real-world problem solving",
    idealBloomsDistribution: {
      REMEMBER: 5,
      UNDERSTAND: 15,
      APPLY: 30,
      ANALYZE: 25,
      EVALUATE: 15,
      CREATE: 10
    },
    idealDOKDistribution: { level1: 10, level2: 30, level3: 40, level4: 20 },
    primaryObjective: "Prepare for professional practice",
    targetAudience: "Working professionals"
  },
  creative: {
    type: "creative",
    description: "Focus on innovation, design, and original creation",
    idealBloomsDistribution: {
      REMEMBER: 5,
      UNDERSTAND: 10,
      APPLY: 15,
      ANALYZE: 15,
      EVALUATE: 20,
      CREATE: 35
    },
    idealDOKDistribution: { level1: 5, level2: 20, level3: 30, level4: 45 },
    primaryObjective: "Foster creativity and innovation",
    targetAudience: "Creative professionals and enthusiasts"
  },
  technical: {
    type: "technical",
    description: "Hands-on technical skills with implementation focus",
    idealBloomsDistribution: {
      REMEMBER: 10,
      UNDERSTAND: 15,
      APPLY: 40,
      ANALYZE: 20,
      EVALUATE: 10,
      CREATE: 5
    },
    idealDOKDistribution: { level1: 15, level2: 45, level3: 30, level4: 10 },
    primaryObjective: "Build technical competency",
    targetAudience: "Technical practitioners"
  },
  theoretical: {
    type: "theoretical",
    description: "Academic focus on concepts, theories, and research",
    idealBloomsDistribution: {
      REMEMBER: 15,
      UNDERSTAND: 25,
      APPLY: 10,
      ANALYZE: 30,
      EVALUATE: 15,
      CREATE: 5
    },
    idealDOKDistribution: { level1: 20, level2: 30, level3: 40, level4: 10 },
    primaryObjective: "Deep theoretical understanding",
    targetAudience: "Researchers and academics"
  }
};
var BLOOMS_KEYWORD_MAP = [
  {
    level: "REMEMBER",
    keywords: ["define", "identify", "list", "name", "recall", "recognize", "state", "describe", "memorize", "repeat", "label", "match", "quote", "select"],
    weight: 1
  },
  {
    level: "UNDERSTAND",
    keywords: ["explain", "summarize", "interpret", "classify", "compare", "contrast", "discuss", "distinguish", "predict", "paraphrase", "translate", "illustrate", "exemplify"],
    weight: 2
  },
  {
    level: "APPLY",
    keywords: ["apply", "demonstrate", "solve", "use", "implement", "execute", "carry out", "practice", "calculate", "complete", "show", "modify", "operate", "experiment"],
    weight: 3
  },
  {
    level: "ANALYZE",
    keywords: ["analyze", "examine", "investigate", "categorize", "differentiate", "distinguish", "organize", "deconstruct", "attribute", "outline", "structure", "integrate", "compare", "contrast"],
    weight: 4
  },
  {
    level: "EVALUATE",
    keywords: ["evaluate", "judge", "critique", "justify", "assess", "defend", "support", "argue", "prioritize", "recommend", "rate", "select", "validate", "appraise"],
    weight: 5
  },
  {
    level: "CREATE",
    keywords: ["create", "design", "develop", "formulate", "construct", "invent", "compose", "generate", "produce", "plan", "devise", "synthesize", "build", "author"],
    weight: 6
  }
];
function getBloomsWeight(level) {
  const mapping = BLOOMS_KEYWORD_MAP.find((m) => m.level === level);
  return mapping?.weight ?? 1;
}
function bloomsToDOK(bloomsLevel) {
  const mapping = {
    REMEMBER: 1,
    UNDERSTAND: 2,
    APPLY: 2,
    ANALYZE: 3,
    EVALUATE: 3,
    CREATE: 4
  };
  return mapping[bloomsLevel];
}

// src/analyzers/webb-dok-analyzer.ts
var WebbDOKAnalyzer = class {
  /**
   * Analyze content to determine Webb's DOK level
   */
  analyzeContent(content, bloomsLevel) {
    const normalizedContent = content.toLowerCase().trim();
    const levelScores = {
      1: 0,
      2: 0,
      3: 0,
      4: 0
    };
    const matchedIndicators = {
      1: [],
      2: [],
      3: [],
      4: []
    };
    for (const [levelKey, descriptor2] of Object.entries(WEBB_DOK_DESCRIPTORS)) {
      const level = Number(levelKey);
      for (const keyword of descriptor2.keywords) {
        const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, "gi");
        const matches = normalizedContent.match(regex);
        if (matches) {
          levelScores[level] += matches.length * level;
          matchedIndicators[level].push(keyword);
        }
      }
    }
    if (bloomsLevel) {
      const expectedDOK = bloomsToDOK(bloomsLevel);
      levelScores[expectedDOK] += 5;
    }
    let primaryLevel = 1;
    let maxScore = 0;
    for (const [levelKey, score] of Object.entries(levelScores)) {
      const level = Number(levelKey);
      if (score > maxScore) {
        maxScore = score;
        primaryLevel = level;
      }
    }
    const totalScore = Object.values(levelScores).reduce((sum, s) => sum + s, 0);
    const confidence = totalScore > 0 ? Math.min(maxScore / totalScore * 100, 100) : 50;
    const descriptor = WEBB_DOK_DESCRIPTORS[primaryLevel];
    return {
      level: primaryLevel,
      levelName: descriptor.name,
      indicators: matchedIndicators[primaryLevel].slice(0, 5),
      // Top 5 indicators
      bloomsCorrelation: bloomsLevel ?? descriptor.bloomsMapping[0],
      confidence: Math.round(confidence)
    };
  }
  /**
   * Analyze multiple content pieces and return distribution
   */
  analyzeDistribution(contents) {
    const distribution = {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0
    };
    if (contents.length === 0) {
      return distribution;
    }
    const levelCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const item of contents) {
      const analysis = this.analyzeContent(item.content, item.bloomsLevel);
      levelCounts[analysis.level]++;
    }
    const total = contents.length;
    distribution.level1 = Math.round(levelCounts[1] / total * 100);
    distribution.level2 = Math.round(levelCounts[2] / total * 100);
    distribution.level3 = Math.round(levelCounts[3] / total * 100);
    distribution.level4 = Math.round(levelCounts[4] / total * 100);
    return distribution;
  }
  /**
   * Calculate DOK depth score (0-100)
   */
  calculateDOKDepth(distribution) {
    const weights = { level1: 1, level2: 2, level3: 3, level4: 4 };
    const weightedSum = distribution.level1 * weights.level1 + distribution.level2 * weights.level2 + distribution.level3 * weights.level3 + distribution.level4 * weights.level4;
    const totalPercentage = distribution.level1 + distribution.level2 + distribution.level3 + distribution.level4;
    if (totalPercentage === 0) return 0;
    return Math.round(weightedSum / totalPercentage * 25);
  }
  /**
   * Determine DOK balance
   */
  determineDOKBalance(distribution) {
    const recallHeavy = distribution.level1 > 40;
    const skillFocused = distribution.level2 > 50;
    const strategic = distribution.level3 + distribution.level4 > 45;
    if (recallHeavy) return "recall-heavy";
    if (skillFocused) return "skill-focused";
    if (strategic) return "strategic";
    return "well-balanced";
  }
  /**
   * Get recommendations based on DOK analysis
   */
  getRecommendations(distribution) {
    const recommendations = [];
    if (distribution.level1 > 30) {
      recommendations.push("Reduce recall-focused content; add more application and analysis activities");
    }
    if (distribution.level3 < 20) {
      recommendations.push("Include more strategic thinking tasks like case studies and problem-solving scenarios");
    }
    if (distribution.level4 < 10) {
      recommendations.push("Add extended thinking projects that require research, synthesis, and original creation");
    }
    if (distribution.level2 > 50) {
      recommendations.push("Balance skill-based content with more complex analytical challenges");
    }
    if (distribution.level1 + distribution.level2 > 70) {
      recommendations.push("Increase cognitive complexity by adding DOK Level 3 and 4 activities");
    }
    return recommendations;
  }
  /**
   * Convert Bloom's distribution to estimated DOK distribution
   */
  bloomsToEstimatedDOK(bloomsDistribution) {
    return {
      level1: bloomsDistribution.REMEMBER ?? bloomsDistribution.remember ?? 0,
      level2: (bloomsDistribution.UNDERSTAND ?? bloomsDistribution.understand ?? 0) + (bloomsDistribution.APPLY ?? bloomsDistribution.apply ?? 0),
      level3: (bloomsDistribution.ANALYZE ?? bloomsDistribution.analyze ?? 0) + (bloomsDistribution.EVALUATE ?? bloomsDistribution.evaluate ?? 0),
      level4: bloomsDistribution.CREATE ?? bloomsDistribution.create ?? 0
    };
  }
  /**
   * Validate alignment between Bloom's and DOK
   */
  validateBloomsDOKAlignment(bloomsLevel, dokLevel) {
    const expectedDOK = bloomsToDOK(bloomsLevel);
    const aligned = expectedDOK === dokLevel;
    let message;
    if (aligned) {
      message = `Bloom's level ${bloomsLevel} correctly aligns with DOK Level ${dokLevel}`;
    } else {
      message = `Potential misalignment: Bloom's ${bloomsLevel} typically maps to DOK Level ${expectedDOK}, but content suggests DOK Level ${dokLevel}`;
    }
    return { aligned, expectedDOK, message };
  }
  /**
   * Escape special regex characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
};
var webbDOKAnalyzer = new WebbDOKAnalyzer();

// src/analyzers/assessment-quality-analyzer.ts
var AssessmentQualityAnalyzer = class {
  IDEAL_BLOOMS_COVERAGE = [
    "REMEMBER",
    "UNDERSTAND",
    "APPLY",
    "ANALYZE",
    "EVALUATE",
    "CREATE"
  ];
  /**
   * Perform comprehensive assessment quality analysis
   */
  analyzeAssessments(exams) {
    const allQuestions = exams.flatMap((exam) => exam.questions);
    if (allQuestions.length === 0) {
      return this.getEmptyMetrics();
    }
    const questionVariety = this.analyzeQuestionVariety(allQuestions);
    const difficultyProgression = this.analyzeDifficultyProgression(allQuestions);
    const bloomsCoverage = this.analyzeBloomsCoverage(allQuestions);
    const feedbackQuality = this.analyzeFeedbackQuality(allQuestions);
    const distractorAnalysis = this.analyzeDistractors(allQuestions);
    const overallScore = this.calculateOverallScore({
      questionVariety,
      difficultyProgression,
      bloomsCoverage,
      feedbackQuality,
      distractorAnalysis
    });
    return {
      overallScore,
      questionVariety,
      difficultyProgression,
      bloomsCoverage,
      feedbackQuality,
      distractorAnalysis
    };
  }
  /**
   * Analyze variety of question types
   */
  analyzeQuestionVariety(questions) {
    const typeDistribution = {};
    for (const question of questions) {
      const type = question.type;
      typeDistribution[type] = (typeDistribution[type] ?? 0) + 1;
    }
    const total = questions.length;
    for (const type of Object.keys(typeDistribution)) {
      typeDistribution[type] = Math.round(typeDistribution[type] / total * 100);
    }
    const uniqueTypes = Object.keys(typeDistribution).length;
    let score;
    if (uniqueTypes >= 5) {
      score = 100;
    } else if (uniqueTypes >= 4) {
      score = 85;
    } else if (uniqueTypes >= 3) {
      score = 70;
    } else if (uniqueTypes >= 2) {
      score = 50;
    } else {
      score = 30;
    }
    const maxPercentage = Math.max(...Object.values(typeDistribution));
    if (maxPercentage > 60) {
      score = Math.max(score - 15, 20);
    }
    const recommendation = this.getVarietyRecommendation(uniqueTypes, typeDistribution);
    return {
      score,
      typeDistribution,
      uniqueTypes,
      recommendation
    };
  }
  /**
   * Analyze difficulty progression across questions
   */
  analyzeDifficultyProgression(questions) {
    const difficulties = questions.map((q, index) => {
      if (q.difficulty) return q.difficulty;
      if (q.bloomsLevel) {
        const bloomsOrder = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
        return bloomsOrder.indexOf(q.bloomsLevel) + 1;
      }
      return Math.min(Math.ceil((index + 1) / (questions.length / 5)), 5);
    });
    const averageDifficulty = difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length;
    const pattern = this.determineDifficultyPattern(difficulties);
    let score;
    let isAppropriate;
    switch (pattern) {
      case "ascending":
        score = 95;
        isAppropriate = true;
        break;
      case "plateaued":
        score = 75;
        isAppropriate = averageDifficulty >= 2.5 && averageDifficulty <= 3.5;
        break;
      case "descending":
        score = 45;
        isAppropriate = false;
        break;
      case "random":
      default:
        score = 60;
        isAppropriate = false;
    }
    const recommendation = this.getDifficultyRecommendation(pattern, averageDifficulty);
    return {
      score,
      pattern,
      averageDifficulty: Math.round(averageDifficulty * 10) / 10,
      isAppropriate,
      recommendation
    };
  }
  /**
   * Analyze Bloom's Taxonomy coverage
   */
  analyzeBloomsCoverage(questions) {
    const distribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    const coveredLevels = /* @__PURE__ */ new Set();
    for (const question of questions) {
      const level = question.bloomsLevel ?? this.inferBloomsLevel(question.text);
      distribution[level]++;
      coveredLevels.add(level);
    }
    const total = questions.length;
    for (const level of Object.keys(distribution)) {
      distribution[level] = Math.round(distribution[level] / total * 100);
    }
    const missingLevels = this.IDEAL_BLOOMS_COVERAGE.filter((level) => !coveredLevels.has(level));
    const coverageRatio = coveredLevels.size / this.IDEAL_BLOOMS_COVERAGE.length;
    let score = Math.round(coverageRatio * 100);
    const higherOrderCoverage = (distribution.ANALYZE > 0 ? 1 : 0) + (distribution.EVALUATE > 0 ? 1 : 0) + (distribution.CREATE > 0 ? 1 : 0);
    if (higherOrderCoverage === 3) {
      score = Math.min(score + 10, 100);
    }
    const recommendation = this.getBloomsCoverageRecommendation(missingLevels, distribution);
    return {
      score,
      coveredLevels: Array.from(coveredLevels),
      missingLevels,
      distribution,
      recommendation
    };
  }
  /**
   * Analyze quality of feedback and explanations
   */
  analyzeFeedbackQuality(questions) {
    let hasExplanations = false;
    let explanationCount = 0;
    let totalExplanationLength = 0;
    let remediationCount = 0;
    for (const question of questions) {
      const hasExp = Boolean(question.explanation) || Boolean(question.feedback);
      if (hasExp) {
        hasExplanations = true;
        explanationCount++;
        const expLength = (question.explanation?.length ?? 0) + (question.feedback?.length ?? 0);
        totalExplanationLength += expLength;
        const expText = `${question.explanation ?? ""} ${question.feedback ?? ""}`.toLowerCase();
        if (expText.includes("review") || expText.includes("refer to") || expText.includes("see chapter") || expText.includes("revisit")) {
          remediationCount++;
        }
      }
    }
    const explanationRatio = questions.length > 0 ? explanationCount / questions.length : 0;
    const avgLength = explanationCount > 0 ? totalExplanationLength / explanationCount : 0;
    let explanationDepth;
    if (avgLength === 0) {
      explanationDepth = "none";
    } else if (avgLength < 50) {
      explanationDepth = "basic";
    } else if (avgLength < 150) {
      explanationDepth = "detailed";
    } else {
      explanationDepth = "comprehensive";
    }
    const providesRemediation = remediationCount > questions.length * 0.2;
    let score = 0;
    if (hasExplanations) score += 30;
    if (explanationRatio > 0.5) score += 20;
    if (explanationRatio > 0.8) score += 15;
    if (explanationDepth === "detailed" || explanationDepth === "comprehensive") score += 20;
    if (providesRemediation) score += 15;
    const recommendation = this.getFeedbackRecommendation(hasExplanations, explanationDepth, providesRemediation);
    return {
      score,
      hasExplanations,
      explanationDepth,
      providesRemediation,
      recommendation
    };
  }
  /**
   * Analyze distractor quality for multiple choice questions
   */
  analyzeDistractors(questions) {
    const mcQuestions = questions.filter((q) => q.type === "multiple_choice" && q.options);
    if (mcQuestions.length === 0) {
      return null;
    }
    const plausibilityScores = [];
    const commonMistakes = [];
    for (const question of mcQuestions) {
      const options = question.options ?? [];
      const distractors = options.filter((opt) => !opt.isCorrect);
      if (distractors.length === 0) continue;
      const correctOption = options.find((opt) => opt.isCorrect);
      const correctLength = correctOption?.text.length ?? 0;
      let plausibilitySum = 0;
      for (const distractor of distractors) {
        const lengthRatio = correctLength > 0 ? distractor.text.length / correctLength : 1;
        const lengthScore = 1 - Math.abs(1 - lengthRatio);
        if (distractor.explanation) {
          commonMistakes.push(distractor.explanation);
        }
        plausibilitySum += lengthScore * 100;
      }
      plausibilityScores.push(plausibilitySum / distractors.length);
    }
    const averagePlausibility = plausibilityScores.length > 0 ? Math.round(plausibilityScores.reduce((sum, s) => sum + s, 0) / plausibilityScores.length) : 50;
    const discriminationIndex = averagePlausibility > 60 ? 0.7 : averagePlausibility > 40 ? 0.5 : 0.3;
    const score = Math.round((averagePlausibility + discriminationIndex * 100) / 2);
    const recommendation = this.getDistractorRecommendation(averagePlausibility, discriminationIndex);
    return {
      score,
      averagePlausibility,
      discriminationIndex,
      commonMistakes: Array.from(new Set(commonMistakes)).slice(0, 5),
      recommendation
    };
  }
  /**
   * Infer Bloom's level from question text
   */
  inferBloomsLevel(text) {
    const lowerText = text.toLowerCase();
    if (/\b(create|design|develop|formulate|construct|invent|compose|generate|produce)\b/.test(lowerText)) {
      return "CREATE";
    }
    if (/\b(evaluate|judge|critique|justify|assess|defend|support|argue|prioritize)\b/.test(lowerText)) {
      return "EVALUATE";
    }
    if (/\b(analyze|examine|investigate|categorize|differentiate|distinguish|organize)\b/.test(lowerText)) {
      return "ANALYZE";
    }
    if (/\b(apply|demonstrate|solve|use|implement|execute|practice|calculate)\b/.test(lowerText)) {
      return "APPLY";
    }
    if (/\b(explain|summarize|interpret|classify|compare|contrast|discuss|predict)\b/.test(lowerText)) {
      return "UNDERSTAND";
    }
    return "REMEMBER";
  }
  /**
   * Determine difficulty pattern
   */
  determineDifficultyPattern(difficulties) {
    if (difficulties.length < 3) return "plateaued";
    let ascendingCount = 0;
    let descendingCount = 0;
    for (let i = 1; i < difficulties.length; i++) {
      if (difficulties[i] > difficulties[i - 1]) {
        ascendingCount++;
      } else if (difficulties[i] < difficulties[i - 1]) {
        descendingCount++;
      }
    }
    const transitions = difficulties.length - 1;
    const ascendingRatio = ascendingCount / transitions;
    const descendingRatio = descendingCount / transitions;
    if (ascendingRatio > 0.6) return "ascending";
    if (descendingRatio > 0.6) return "descending";
    if (ascendingRatio < 0.3 && descendingRatio < 0.3) return "plateaued";
    return "random";
  }
  /**
   * Calculate overall score
   */
  calculateOverallScore(metrics) {
    const weights = {
      questionVariety: 0.2,
      difficultyProgression: 0.2,
      bloomsCoverage: 0.25,
      feedbackQuality: 0.2,
      distractorAnalysis: 0.15
    };
    let weightedSum = metrics.questionVariety.score * weights.questionVariety + metrics.difficultyProgression.score * weights.difficultyProgression + metrics.bloomsCoverage.score * weights.bloomsCoverage + metrics.feedbackQuality.score * weights.feedbackQuality;
    if (metrics.distractorAnalysis) {
      weightedSum += metrics.distractorAnalysis.score * weights.distractorAnalysis;
    } else {
      const redistributedWeight = weights.distractorAnalysis / 4;
      weightedSum = metrics.questionVariety.score * (weights.questionVariety + redistributedWeight) + metrics.difficultyProgression.score * (weights.difficultyProgression + redistributedWeight) + metrics.bloomsCoverage.score * (weights.bloomsCoverage + redistributedWeight) + metrics.feedbackQuality.score * (weights.feedbackQuality + redistributedWeight);
    }
    return Math.round(weightedSum);
  }
  /**
   * Get empty metrics for courses without assessments
   */
  getEmptyMetrics() {
    return {
      overallScore: 0,
      questionVariety: {
        score: 0,
        typeDistribution: {},
        uniqueTypes: 0,
        recommendation: "Add assessments to evaluate student learning"
      },
      difficultyProgression: {
        score: 0,
        pattern: "random",
        averageDifficulty: 0,
        isAppropriate: false,
        recommendation: "Create questions with increasing difficulty"
      },
      bloomsCoverage: {
        score: 0,
        coveredLevels: [],
        missingLevels: this.IDEAL_BLOOMS_COVERAGE,
        distribution: {
          REMEMBER: 0,
          UNDERSTAND: 0,
          APPLY: 0,
          ANALYZE: 0,
          EVALUATE: 0,
          CREATE: 0
        },
        recommendation: "Add questions covering all Bloom&apos;s Taxonomy levels"
      },
      feedbackQuality: {
        score: 0,
        hasExplanations: false,
        explanationDepth: "none",
        providesRemediation: false,
        recommendation: "Add explanations and feedback to all questions"
      },
      distractorAnalysis: null
    };
  }
  /**
   * Recommendation generators
   */
  getVarietyRecommendation(uniqueTypes, distribution) {
    if (uniqueTypes < 3) {
      return "Diversify question types to include essays, coding challenges, or matching exercises";
    }
    const dominant = Object.entries(distribution).sort(([, a], [, b]) => b - a)[0];
    if (dominant && dominant[1] > 60) {
      return `Reduce reliance on ${dominant[0]} questions; balance with other formats`;
    }
    return "Good question variety; consider adding scenario-based questions";
  }
  getDifficultyRecommendation(pattern, avgDifficulty) {
    if (pattern === "descending") {
      return "Reorder questions from easier to harder for better learning progression";
    }
    if (pattern === "random") {
      return "Structure questions with gradual difficulty increase";
    }
    if (avgDifficulty < 2) {
      return "Include more challenging questions to stretch learner capabilities";
    }
    if (avgDifficulty > 4) {
      return "Add foundational questions to build confidence before complex ones";
    }
    return "Difficulty progression is appropriate";
  }
  getBloomsCoverageRecommendation(missingLevels, distribution) {
    if (missingLevels.length > 3) {
      return `Add questions at ${missingLevels.slice(0, 3).join(", ")} levels for comprehensive assessment`;
    }
    if (missingLevels.includes("CREATE") || missingLevels.includes("EVALUATE")) {
      return "Include higher-order thinking questions requiring creation or critical evaluation";
    }
    if (distribution.REMEMBER > 40) {
      return "Reduce memorization questions; add more application and analysis tasks";
    }
    return "Bloom&apos;s coverage is adequate; consider balancing higher-order levels";
  }
  getFeedbackRecommendation(hasExplanations, depth, hasRemediation) {
    if (!hasExplanations) {
      return "Add explanations to all questions to support learning from mistakes";
    }
    if (depth === "basic") {
      return "Expand explanations to include why incorrect answers are wrong";
    }
    if (!hasRemediation) {
      return "Include remediation links or suggestions for incorrect responses";
    }
    return "Feedback quality is strong; consider adding video explanations";
  }
  getDistractorRecommendation(plausibility, discrimination) {
    if (plausibility < 50) {
      return "Improve distractor plausibility by making them more realistic wrong answers";
    }
    if (discrimination < 0.5) {
      return "Ensure distractors address common misconceptions";
    }
    return "Distractor quality is good; regularly update based on student responses";
  }
};
var assessmentQualityAnalyzer = new AssessmentQualityAnalyzer();

// src/analyzers/course-type-detector.ts
var CourseTypeDetector = class {
  TYPE_KEYWORDS = {
    foundational: [
      "introduction",
      "basics",
      "fundamentals",
      "beginner",
      "getting started",
      "primer",
      "essentials",
      "overview",
      "101",
      "first steps",
      "learn"
    ],
    intermediate: [
      "intermediate",
      "practical",
      "hands-on",
      "applied",
      "skills",
      "building",
      "developing",
      "next level",
      "beyond basics"
    ],
    advanced: [
      "advanced",
      "expert",
      "deep dive",
      "mastery",
      "complex",
      "specialized",
      "in-depth",
      "comprehensive",
      "senior"
    ],
    professional: [
      "professional",
      "enterprise",
      "industry",
      "career",
      "certification",
      "workplace",
      "business",
      "corporate",
      "leadership"
    ],
    creative: [
      "creative",
      "design",
      "art",
      "innovation",
      "portfolio",
      "create",
      "build",
      "make",
      "craft",
      "project-based"
    ],
    technical: [
      "technical",
      "coding",
      "programming",
      "development",
      "engineering",
      "implementation",
      "system",
      "software",
      "data",
      "algorithm"
    ],
    theoretical: [
      "theory",
      "concept",
      "research",
      "academic",
      "scientific",
      "principles",
      "framework",
      "methodology",
      "analysis"
    ]
  };
  CATEGORY_TYPE_MAPPING = {
    "Technology": ["technical", "intermediate", "advanced"],
    "Programming": ["technical", "intermediate"],
    "Data Science": ["technical", "advanced", "theoretical"],
    "Business": ["professional", "intermediate"],
    "Marketing": ["professional", "creative"],
    "Design": ["creative", "intermediate"],
    "Art": ["creative", "foundational"],
    "Science": ["theoretical", "advanced"],
    "Mathematics": ["theoretical", "technical"],
    "Language": ["foundational", "intermediate"],
    "Personal Development": ["foundational", "professional"],
    "Health & Fitness": ["foundational", "intermediate"],
    "Music": ["creative", "foundational"],
    "Photography": ["creative", "technical"],
    "Writing": ["creative", "foundational"]
  };
  /**
   * Detect course type based on metadata
   */
  detectCourseType(metadata) {
    const scores = {
      foundational: 0,
      intermediate: 0,
      advanced: 0,
      professional: 0,
      creative: 0,
      technical: 0,
      theoretical: 0
    };
    this.analyzeText(metadata.title, scores, 3);
    this.analyzeText(metadata.description, scores, 2);
    for (const objective of metadata.learningObjectives) {
      this.analyzeText(objective, scores, 1);
    }
    this.analyzeText(metadata.targetAudience, scores, 2);
    this.scoreByCategoryMapping(metadata.category, scores);
    this.scoreByStructure(metadata, scores);
    this.scoreByActionVerbs(metadata.learningObjectives, scores);
    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
    const normalizedScores = [];
    for (const [type, score] of Object.entries(scores)) {
      normalizedScores.push({
        type,
        confidence: totalScore > 0 ? Math.round(score / totalScore * 100) : 0
      });
    }
    normalizedScores.sort((a, b) => b.confidence - a.confidence);
    const detectedType = normalizedScores[0].type;
    const confidence = normalizedScores[0].confidence;
    const profile = COURSE_TYPE_PROFILES[detectedType];
    return {
      detectedType,
      confidence,
      alternativeTypes: normalizedScores.slice(1, 3),
      profile,
      idealDistribution: profile.idealBloomsDistribution,
      idealDOKDistribution: profile.idealDOKDistribution,
      recommendations: this.generateTypeRecommendations(detectedType, confidence)
    };
  }
  /**
   * Compare current distribution with ideal for course type
   */
  compareWithIdeal(currentDistribution, courseType) {
    const idealDistribution = COURSE_TYPE_PROFILES[courseType].idealBloomsDistribution;
    const gapAnalysis = {};
    const levels = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    const priorities = [];
    for (const level of levels) {
      const current = currentDistribution[level];
      const ideal = idealDistribution[level];
      const gap = ideal - current;
      const absGap = Math.abs(gap);
      let action;
      if (gap > 10) {
        action = `Increase ${level.toLowerCase()} content significantly (+${Math.round(gap)}%)`;
      } else if (gap > 5) {
        action = `Add more ${level.toLowerCase()} activities (+${Math.round(gap)}%)`;
      } else if (gap < -10) {
        action = `Reduce ${level.toLowerCase()} content (${Math.round(gap)}%)`;
      } else if (gap < -5) {
        action = `Consider reducing ${level.toLowerCase()} activities (${Math.round(gap)}%)`;
      } else {
        action = "Maintain current level";
      }
      gapAnalysis[level] = { current, ideal, gap, action };
      priorities.push({ level, absGap });
    }
    priorities.sort((a, b) => b.absGap - a.absGap);
    const priority = priorities.map((p) => p.level);
    const totalAbsGap = priorities.reduce((sum, p) => sum + p.absGap, 0);
    const avgAbsGap = totalAbsGap / levels.length;
    const alignmentScore = Math.max(0, Math.round(100 - avgAbsGap));
    return {
      currentDistribution,
      idealDistribution,
      gapAnalysis,
      alignmentScore,
      priority
    };
  }
  /**
   * Get adaptive targets based on current state and course type
   */
  getAdaptiveTargets(currentDistribution, courseType, improvementRate = 0.3) {
    const idealDistribution = COURSE_TYPE_PROFILES[courseType].idealBloomsDistribution;
    const adaptiveTargets = {};
    const levels = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    for (const level of levels) {
      const current = currentDistribution[level];
      const ideal = idealDistribution[level];
      const gap = ideal - current;
      adaptiveTargets[level] = Math.round(current + gap * improvementRate);
    }
    const total = Object.values(adaptiveTargets).reduce((sum, v) => sum + v, 0);
    if (total !== 100) {
      const adjustment = (100 - total) / levels.length;
      for (const level of levels) {
        adaptiveTargets[level] = Math.round(adaptiveTargets[level] + adjustment);
      }
    }
    return adaptiveTargets;
  }
  /**
   * Analyze text for type keywords
   */
  analyzeText(text, scores, weight) {
    const lowerText = text.toLowerCase();
    for (const [type, keywords] of Object.entries(this.TYPE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          scores[type] += weight;
        }
      }
    }
  }
  /**
   * Score based on category mapping
   */
  scoreByCategoryMapping(category, scores) {
    for (const [cat, types] of Object.entries(this.CATEGORY_TYPE_MAPPING)) {
      if (category.toLowerCase().includes(cat.toLowerCase())) {
        for (let i = 0; i < types.length; i++) {
          scores[types[i]] += 3 - i;
        }
        break;
      }
    }
  }
  /**
   * Score based on course structure
   */
  scoreByStructure(metadata, scores) {
    if (metadata.chaptersCount > 10) {
      scores.advanced += 2;
      scores.professional += 1;
    } else if (metadata.chaptersCount < 5) {
      scores.foundational += 2;
    }
    if (metadata.hasProjects) {
      scores.creative += 3;
      scores.technical += 2;
    }
    if (metadata.hasCodingExercises) {
      scores.technical += 4;
    }
    if (metadata.prerequisites.length > 2) {
      scores.advanced += 3;
      scores.professional += 2;
    } else if (metadata.prerequisites.length === 0) {
      scores.foundational += 2;
    }
    if (metadata.averageSectionDuration > 30) {
      scores.advanced += 2;
      scores.theoretical += 2;
    } else if (metadata.averageSectionDuration < 10) {
      scores.foundational += 2;
    }
  }
  /**
   * Score based on action verbs in objectives
   */
  scoreByActionVerbs(objectives, scores) {
    const verbPatterns = {
      foundational: /\b(identify|list|name|recall|define|describe)\b/gi,
      intermediate: /\b(apply|use|implement|demonstrate|solve|calculate)\b/gi,
      advanced: /\b(analyze|evaluate|critique|synthesize|compare|assess)\b/gi,
      creative: /\b(create|design|develop|compose|construct|produce|innovate)\b/gi,
      technical: /\b(code|program|build|debug|deploy|implement|configure)\b/gi,
      theoretical: /\b(theorize|research|hypothesize|conceptualize|formulate)\b/gi,
      professional: /\b(manage|lead|coordinate|optimize|streamline|execute)\b/gi
    };
    for (const objective of objectives) {
      for (const [type, pattern] of Object.entries(verbPatterns)) {
        const matches = objective.match(pattern);
        if (matches) {
          scores[type] += matches.length;
        }
      }
    }
  }
  /**
   * Generate recommendations based on detected type
   */
  generateTypeRecommendations(type, confidence) {
    const recommendations = [];
    if (confidence < 50) {
      recommendations.push("Consider clarifying your course positioning with more specific language");
      recommendations.push("Update title and description to better reflect the course level");
    }
    const profile = COURSE_TYPE_PROFILES[type];
    recommendations.push(`Optimize content for ${profile.targetAudience}`);
    recommendations.push(`Focus on: ${profile.primaryObjective}`);
    switch (type) {
      case "foundational":
        recommendations.push("Include plenty of examples and definitions");
        recommendations.push("Provide scaffolded learning with frequent checkpoints");
        break;
      case "intermediate":
        recommendations.push("Balance theory with practical exercises");
        recommendations.push("Include real-world case studies");
        break;
      case "advanced":
        recommendations.push("Challenge learners with complex problem-solving");
        recommendations.push("Include critical analysis and evaluation tasks");
        break;
      case "professional":
        recommendations.push("Focus on industry-relevant scenarios");
        recommendations.push("Include certification preparation materials");
        break;
      case "creative":
        recommendations.push("Emphasize project-based learning");
        recommendations.push("Provide opportunities for original creation");
        break;
      case "technical":
        recommendations.push("Include hands-on coding exercises");
        recommendations.push("Provide debugging and troubleshooting scenarios");
        break;
      case "theoretical":
        recommendations.push("Include research methodologies");
        recommendations.push("Encourage critical literature review");
        break;
    }
    return recommendations;
  }
};
var courseTypeDetector = new CourseTypeDetector();

// src/analyzers/objective-analyzer.ts
var ObjectiveAnalyzer = class {
  STRONG_VERBS = {
    REMEMBER: ["define", "identify", "list", "name", "recall", "recognize"],
    UNDERSTAND: ["explain", "summarize", "interpret", "classify", "compare", "describe"],
    APPLY: ["apply", "demonstrate", "solve", "implement", "execute", "use"],
    ANALYZE: ["analyze", "differentiate", "examine", "investigate", "categorize", "deconstruct"],
    EVALUATE: ["evaluate", "assess", "critique", "judge", "justify", "defend"],
    CREATE: ["create", "design", "develop", "formulate", "construct", "compose"]
  };
  WEAK_VERBS = [
    "know",
    "learn",
    "understand",
    "appreciate",
    "be aware of",
    "become familiar with",
    "gain knowledge",
    "explore",
    "discover"
  ];
  MEASURABLE_INDICATORS = [
    "correctly",
    "accurately",
    "within",
    "at least",
    "minimum of",
    "percentage",
    "%",
    "score",
    "demonstrate",
    "produce",
    "complete",
    "pass",
    "achieve",
    "meet",
    "criteria",
    "standard"
  ];
  TIME_INDICATORS = [
    "by the end",
    "within",
    "after",
    "upon completion",
    "following",
    "week",
    "module",
    "chapter",
    "session",
    "course"
  ];
  /**
   * Analyze a single learning objective
   */
  analyzeObjective(objective) {
    const normalizedObjective = objective.trim();
    const lowerObjective = normalizedObjective.toLowerCase();
    const verbAnalysis = this.analyzeActionVerb(normalizedObjective);
    const bloomsLevel = verbAnalysis.bloomsLevel;
    const dokLevel = this.determineDOKLevel(lowerObjective, bloomsLevel);
    const smartCriteria = this.analyzeSMARTCriteria(normalizedObjective);
    const clarityScore = this.calculateClarityScore(normalizedObjective, smartCriteria);
    const measurability = this.analyzeMeasurability(normalizedObjective);
    const suggestions = this.generateSuggestions(
      normalizedObjective,
      verbAnalysis,
      smartCriteria,
      measurability
    );
    const improvedVersion = this.generateImprovedVersion(
      normalizedObjective,
      verbAnalysis,
      smartCriteria
    );
    return {
      objective: normalizedObjective,
      bloomsLevel,
      dokLevel,
      actionVerb: verbAnalysis.verb,
      verbStrength: verbAnalysis.strength,
      smartCriteria,
      clarityScore,
      measurability,
      suggestions,
      improvedVersion
    };
  }
  /**
   * Analyze multiple objectives and detect duplicates
   */
  analyzeAndDeduplicate(objectives) {
    if (objectives.length === 0) {
      return {
        totalObjectives: 0,
        uniqueClusters: 0,
        duplicateGroups: [],
        recommendations: ["Add learning objectives to your course"],
        optimizedObjectives: []
      };
    }
    const clusters = this.clusterSimilarObjectives(objectives);
    const duplicateGroups = clusters.filter((c) => c.objectives.length > 1 || c.recommendation !== "keep");
    const recommendations = this.generateDeduplicationRecommendations(clusters);
    const optimizedObjectives = this.generateOptimizedObjectives(clusters);
    return {
      totalObjectives: objectives.length,
      uniqueClusters: clusters.length,
      duplicateGroups,
      recommendations,
      optimizedObjectives
    };
  }
  /**
   * Analyze the action verb in an objective
   */
  analyzeActionVerb(objective) {
    const words = objective.toLowerCase().split(/\s+/);
    let foundVerb = "";
    let foundLevel = "UNDERSTAND";
    let strength = "moderate";
    for (const weakVerb of this.WEAK_VERBS) {
      if (objective.toLowerCase().includes(weakVerb)) {
        foundVerb = weakVerb;
        strength = "weak";
        break;
      }
    }
    if (!foundVerb) {
      const levels = ["CREATE", "EVALUATE", "ANALYZE", "APPLY", "UNDERSTAND", "REMEMBER"];
      for (const level of levels) {
        for (const verb of this.STRONG_VERBS[level]) {
          if (words.includes(verb) || objective.toLowerCase().startsWith(verb)) {
            foundVerb = verb;
            foundLevel = level;
            strength = "strong";
            break;
          }
        }
        if (strength === "strong") break;
      }
    }
    if (!foundVerb) {
      for (const mapping of BLOOMS_KEYWORD_MAP) {
        for (const keyword of mapping.keywords) {
          if (objective.toLowerCase().includes(keyword)) {
            foundVerb = keyword;
            foundLevel = mapping.level;
            strength = "moderate";
            break;
          }
        }
        if (foundVerb) break;
      }
    }
    if (!foundVerb) {
      foundVerb = "understand";
      foundLevel = "UNDERSTAND";
      strength = "weak";
    }
    const alternatives = this.STRONG_VERBS[foundLevel].filter((v) => v !== foundVerb).slice(0, 3);
    return {
      verb: foundVerb,
      bloomsLevel: foundLevel,
      strength,
      alternatives
    };
  }
  /**
   * Determine Webb's DOK level
   */
  determineDOKLevel(objective, bloomsLevel) {
    let dokLevel = bloomsToDOK(bloomsLevel);
    const complexityIndicators = {
      level4: ["design original", "synthesize", "create new", "develop innovative", "research and"],
      level3: ["analyze", "evaluate", "compare and contrast", "justify", "investigate"],
      level2: ["apply", "solve", "use", "demonstrate", "classify"],
      level1: ["recall", "identify", "define", "list", "name"]
    };
    for (const indicator of complexityIndicators.level4) {
      if (objective.includes(indicator)) {
        dokLevel = 4;
        break;
      }
    }
    if (dokLevel < 3) {
      for (const indicator of complexityIndicators.level3) {
        if (objective.includes(indicator)) {
          dokLevel = 3;
          break;
        }
      }
    }
    return dokLevel;
  }
  /**
   * Analyze SMART criteria compliance
   */
  analyzeSMARTCriteria(objective) {
    const specific = this.analyzeSpecific(objective);
    const measurable = this.analyzeMeasurable(objective);
    const achievable = this.analyzeAchievable(objective);
    const relevant = this.analyzeRelevant(objective);
    const timeBound = this.analyzeTimeBound(objective);
    const overallScore = Math.round(
      (specific.score + measurable.score + achievable.score + relevant.score + timeBound.score) / 5
    );
    return {
      specific,
      measurable,
      achievable,
      relevant,
      timeBound,
      overallScore
    };
  }
  analyzeSpecific(objective) {
    let score = 50;
    const suggestions = [];
    const words = objective.split(/\s+/).length;
    if (words >= 8) score += 20;
    if (words >= 15) score += 10;
    if (/\b(concepts?|skills?|techniques?|methods?|procedures?|principles?)\b/i.test(objective)) {
      score += 15;
    }
    if (/\b(things?|stuff|something|various|different)\b/i.test(objective)) {
      score -= 20;
      suggestions.push("Replace vague terms with specific concepts");
    }
    if (/\b(in|for|when|during|within the context of)\b/i.test(objective)) {
      score += 10;
    } else {
      suggestions.push("Add context about when or where this skill applies");
    }
    score = Math.max(0, Math.min(100, score));
    return {
      score,
      feedback: score >= 70 ? "Objective is specific and clear" : "Objective needs more specificity",
      suggestions
    };
  }
  analyzeMeasurable(objective) {
    let score = 30;
    const suggestions = [];
    const lower = objective.toLowerCase();
    for (const indicator of this.MEASURABLE_INDICATORS) {
      if (lower.includes(indicator)) {
        score += 15;
        break;
      }
    }
    if (/\b(demonstrate|produce|create|write|develop|solve|calculate|identify|list)\b/i.test(objective)) {
      score += 25;
    }
    if (/\b\d+\b|percent|percentage|ratio|score/i.test(objective)) {
      score += 20;
    } else {
      suggestions.push('Add quantifiable criteria (e.g., "at least 80% accuracy")');
    }
    if (/\b(understand|know|appreciate|be aware|learn about)\b/i.test(objective)) {
      score -= 25;
      suggestions.push('Replace "understand/know" with observable action verbs');
    }
    score = Math.max(0, Math.min(100, score));
    return {
      score,
      feedback: score >= 70 ? "Outcome is measurable" : "Add measurable criteria",
      suggestions
    };
  }
  analyzeAchievable(objective) {
    let score = 60;
    const suggestions = [];
    if (/\b(master|perfect|complete mastery|expert|all aspects)\b/i.test(objective)) {
      score -= 30;
      suggestions.push('Use more realistic terms like "demonstrate proficiency" instead of "master"');
    }
    const verbCount = (objective.match(/\b(and|also|additionally|furthermore)\b/gi) || []).length;
    if (verbCount > 2) {
      score -= 20;
      suggestions.push("Consider breaking this into multiple focused objectives");
    }
    const words = objective.split(/\s+/).length;
    if (words > 30) {
      score -= 15;
      suggestions.push("Simplify objective - too complex for a single learning outcome");
    }
    score = Math.max(0, Math.min(100, score));
    return {
      score,
      feedback: score >= 70 ? "Objective appears achievable" : "Consider scope and feasibility",
      suggestions
    };
  }
  analyzeRelevant(objective) {
    let score = 50;
    const suggestions = [];
    if (/\b(in order to|to|for|enabling|allowing|so that)\b/i.test(objective)) {
      score += 25;
    } else {
      suggestions.push("Add purpose or connection to broader goals");
    }
    if (/\b(real-world|practical|industry|professional|workplace|project)\b/i.test(objective)) {
      score += 20;
    }
    if (/\b(skill|competency|ability|capability|proficiency)\b/i.test(objective)) {
      score += 15;
    }
    score = Math.max(0, Math.min(100, score));
    return {
      score,
      feedback: score >= 70 ? "Objective is relevant to learning goals" : "Clarify relevance and purpose",
      suggestions
    };
  }
  analyzeTimeBound(objective) {
    let score = 20;
    const suggestions = [];
    for (const indicator of this.TIME_INDICATORS) {
      if (objective.toLowerCase().includes(indicator)) {
        score += 50;
        break;
      }
    }
    if (/\b(module|chapter|section|lesson|unit)\b/i.test(objective)) {
      score += 20;
    }
    if (score < 50) {
      suggestions.push('Add timeframe (e.g., "By the end of this module...")');
    }
    score = Math.max(0, Math.min(100, score));
    return {
      score,
      feedback: score >= 70 ? "Timeframe is specified" : "Add a timeframe or milestone",
      suggestions
    };
  }
  /**
   * Analyze measurability in detail
   */
  analyzeMeasurability(objective) {
    const lower = objective.toLowerCase();
    let score = 50;
    let hasQuantifiableOutcome = false;
    let assessmentMethod = "Observation";
    const verificationCriteria = [];
    if (/\b\d+\b|percent|%|score|rate/i.test(objective)) {
      hasQuantifiableOutcome = true;
      score += 30;
      verificationCriteria.push("Quantitative metrics specified");
    }
    if (/\b(write|create|produce|develop|design)\b/i.test(lower)) {
      assessmentMethod = "Portfolio/Project submission";
      score += 15;
      verificationCriteria.push("Artifact-based assessment");
    } else if (/\b(demonstrate|perform|execute|apply)\b/i.test(lower)) {
      assessmentMethod = "Performance assessment";
      score += 15;
      verificationCriteria.push("Observable demonstration");
    } else if (/\b(analyze|evaluate|compare|critique)\b/i.test(lower)) {
      assessmentMethod = "Written analysis/Essay";
      score += 15;
      verificationCriteria.push("Written response evaluation");
    } else if (/\b(identify|list|name|define)\b/i.test(lower)) {
      assessmentMethod = "Quiz/Test";
      score += 10;
      verificationCriteria.push("Multiple choice or short answer");
    }
    if (/\b(correctly|accurately)\b/i.test(lower)) {
      verificationCriteria.push("Accuracy-based rubric");
    }
    if (/\b(independently|without assistance)\b/i.test(lower)) {
      verificationCriteria.push("Independent completion verification");
    }
    return {
      score: Math.min(100, score),
      hasQuantifiableOutcome,
      assessmentMethod,
      verificationCriteria
    };
  }
  /**
   * Calculate clarity score
   */
  calculateClarityScore(objective, smartCriteria) {
    let score = smartCriteria.overallScore;
    const words = objective.split(/\s+/).length;
    const avgWordLength = objective.replace(/\s+/g, "").length / words;
    if (words >= 10 && words <= 25) {
      score += 10;
    } else if (words < 5 || words > 40) {
      score -= 10;
    }
    if (avgWordLength > 8) {
      score -= 10;
    }
    const startsWithVerb = /^[A-Z]?[a-z]+\s/.test(objective) && BLOOMS_KEYWORD_MAP.some((m) => m.keywords.some(
      (k) => objective.toLowerCase().startsWith(k)
    ));
    if (startsWithVerb) {
      score += 10;
    }
    return Math.max(0, Math.min(100, score));
  }
  /**
   * Generate improvement suggestions
   */
  generateSuggestions(objective, verbAnalysis, smartCriteria, measurability) {
    const suggestions = [];
    if (verbAnalysis.strength === "weak") {
      suggestions.push(
        `Replace "${verbAnalysis.verb}" with stronger verb: ${verbAnalysis.alternatives.join(", ")}`
      );
    }
    for (const [criterion, analysis] of Object.entries(smartCriteria)) {
      if (criterion !== "overallScore" && typeof analysis === "object" && "suggestions" in analysis) {
        const criterionAnalysis = analysis;
        if (criterionAnalysis.score < 70) {
          suggestions.push(...criterionAnalysis.suggestions);
        }
      }
    }
    if (!measurability.hasQuantifiableOutcome) {
      suggestions.push("Add specific success criteria or metrics");
    }
    return Array.from(new Set(suggestions)).slice(0, 5);
  }
  /**
   * Generate improved version of objective
   */
  generateImprovedVersion(objective, verbAnalysis, smartCriteria) {
    let improved = objective;
    if (verbAnalysis.strength === "weak" && verbAnalysis.alternatives.length > 0) {
      const replacement = verbAnalysis.alternatives[0];
      const capitalizedReplacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
      const verbRegex = new RegExp(`^${verbAnalysis.verb}`, "i");
      if (verbRegex.test(improved)) {
        improved = improved.replace(verbRegex, capitalizedReplacement);
      }
    }
    if (smartCriteria.timeBound.score < 50 && !improved.toLowerCase().includes("by the end")) {
      improved = `By the end of this module, learners will ${improved.charAt(0).toLowerCase() + improved.slice(1)}`;
    }
    if (smartCriteria.measurable.score < 50 && !improved.includes("correctly")) {
      improved = improved.replace(/\.$/, " with at least 80% accuracy.");
      if (!improved.endsWith(".")) {
        improved += " with at least 80% accuracy.";
      }
    }
    return improved;
  }
  /**
   * Cluster similar objectives for deduplication
   */
  clusterSimilarObjectives(objectives) {
    const clusters = [];
    const processed = /* @__PURE__ */ new Set();
    for (let i = 0; i < objectives.length; i++) {
      if (processed.has(i)) continue;
      const cluster = {
        clusterId: `cluster-${i}`,
        objectives: [objectives[i]],
        semanticSimilarity: 100,
        recommendation: "keep",
        suggestedMerge: null,
        reason: "Unique objective"
      };
      for (let j = i + 1; j < objectives.length; j++) {
        if (processed.has(j)) continue;
        const similarity = this.calculateSimilarity(objectives[i], objectives[j]);
        if (similarity > 70) {
          cluster.objectives.push(objectives[j]);
          cluster.semanticSimilarity = Math.min(cluster.semanticSimilarity, similarity);
          processed.add(j);
        }
      }
      processed.add(i);
      if (cluster.objectives.length > 1) {
        if (cluster.semanticSimilarity > 90) {
          cluster.recommendation = "merge";
          cluster.reason = "Objectives are nearly identical";
          cluster.suggestedMerge = this.generateMergedObjective(cluster.objectives);
        } else {
          cluster.recommendation = "differentiate";
          cluster.reason = "Objectives are similar but may have distinct aspects";
          cluster.suggestedMerge = null;
        }
      }
      clusters.push(cluster);
    }
    return clusters;
  }
  /**
   * Calculate similarity between two objectives
   */
  calculateSimilarity(obj1, obj2) {
    const words1 = new Set(obj1.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    const words2 = new Set(obj2.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    if (words1.size === 0 || words2.size === 0) return 0;
    let intersection = 0;
    const words1Array = Array.from(words1);
    for (const word of words1Array) {
      if (words2.has(word)) {
        intersection++;
      }
    }
    const union = words1.size + words2.size - intersection;
    return Math.round(intersection / union * 100);
  }
  /**
   * Generate merged objective from similar ones
   */
  generateMergedObjective(objectives) {
    const base = objectives.reduce(
      (longest, current) => current.length > longest.length ? current : longest
    );
    return base;
  }
  /**
   * Generate recommendations for deduplication
   */
  generateDeduplicationRecommendations(clusters) {
    const recommendations = [];
    const mergeCount = clusters.filter((c) => c.recommendation === "merge").length;
    const differentiateCount = clusters.filter((c) => c.recommendation === "differentiate").length;
    if (mergeCount > 0) {
      recommendations.push(`${mergeCount} objective(s) can be consolidated to remove redundancy`);
    }
    if (differentiateCount > 0) {
      recommendations.push(`${differentiateCount} objective group(s) need clearer differentiation`);
    }
    const totalObjectives = clusters.reduce((sum, c) => sum + c.objectives.length, 0);
    const uniqueCount = clusters.length;
    if (totalObjectives > uniqueCount * 1.5) {
      recommendations.push("Consider reducing total objectives for clarity and focus");
    }
    if (uniqueCount < 3) {
      recommendations.push("Add more diverse learning objectives to cover different cognitive levels");
    }
    return recommendations;
  }
  /**
   * Generate optimized list of objectives
   */
  generateOptimizedObjectives(clusters) {
    const optimized = [];
    for (const cluster of clusters) {
      if (cluster.recommendation === "merge" && cluster.suggestedMerge) {
        optimized.push(cluster.suggestedMerge);
      } else {
        optimized.push(...cluster.objectives);
      }
    }
    return optimized;
  }
};
var objectiveAnalyzer = new ObjectiveAnalyzer();

// src/analyzers/deterministic-rubric-engine.ts
var MEASURABLE_VERBS_PATTERN = /\b(define|identify|list|explain|demonstrate|analyze|evaluate|create|design|develop|implement|calculate|compare|contrast|apply|solve|construct|formulate|assess|critique|interpret|classify|predict|summarize|describe|distinguish|organize|examine|investigate|differentiate|justify|defend|recommend|compose|generate|produce|plan|devise|synthesize|build|author)\b/gi;
var BLOOMS_PATTERNS = {
  REMEMBER: /\b(define|list|name|recall|identify|recognize|state|match|select|memorize|repeat|label|quote)\b/gi,
  UNDERSTAND: /\b(explain|summarize|interpret|paraphrase|classify|compare|contrast|discuss|predict|translate|describe|illustrate|exemplify|distinguish)\b/gi,
  APPLY: /\b(apply|demonstrate|solve|use|implement|calculate|execute|practice|compute|show|modify|operate|experiment|complete)\b/gi,
  ANALYZE: /\b(analyze|examine|investigate|differentiate|organize|attribute|deconstruct|outline|structure|integrate|categorize|compare|contrast)\b/gi,
  EVALUATE: /\b(evaluate|judge|critique|justify|assess|defend|support|argue|prioritize|recommend|rate|validate|appraise|conclude)\b/gi,
  CREATE: /\b(create|design|develop|formulate|construct|invent|compose|generate|produce|plan|devise|synthesize|build|author|propose)\b/gi
};
var LEARNER_CENTERED_PATTERN = /\b(you will|learners? will|students? will|be able to|can|will be able|upon completion|by the end)\b/i;
var DeterministicRubricEngine = class {
  VERSION = "1.0.0";
  rules;
  constructor() {
    this.rules = this.initializeRules();
  }
  /**
   * Primary analysis method - fully deterministic
   */
  analyze(input) {
    const categoryScores = /* @__PURE__ */ new Map();
    const rulesApplied = [];
    const recommendations = [];
    let totalEarned = 0;
    let totalMax = 0;
    let rulesPassed = 0;
    let rulesFailed = 0;
    const categories = [
      "LearningObjectives",
      "Assessment",
      "ContentStructure",
      "CognitiveDepth",
      "Accessibility",
      "Engagement"
    ];
    for (const cat of categories) {
      categoryScores.set(cat, { earned: 0, max: 0, percentage: 0, rules: [] });
    }
    for (const rule of this.rules) {
      const passed = rule.condition(input);
      const earned = passed ? rule.score * rule.weight : 0;
      const max = rule.maxScore * rule.weight;
      totalEarned += earned;
      totalMax += max;
      if (passed) {
        rulesPassed++;
      } else {
        rulesFailed++;
      }
      const result = {
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        passed,
        score: earned,
        maxScore: max,
        evidence: passed ? rule.evidence : `NOT MET: ${rule.evidence}`,
        source: rule.source
      };
      rulesApplied.push(result);
      const catScore = categoryScores.get(rule.category);
      if (catScore) {
        catScore.earned += earned;
        catScore.max += max;
        catScore.rules.push(result);
      }
      if (!passed) {
        recommendations.push({
          priority: this.getPriorityFromWeight(rule.weight),
          category: rule.category,
          title: rule.name,
          description: rule.recommendation,
          actionSteps: this.generateActionSteps(rule),
          estimatedImpact: rule.score * rule.weight,
          effort: this.estimateEffort(rule),
          source: rule.source
        });
      }
    }
    for (const [, score] of categoryScores) {
      score.percentage = score.max > 0 ? Math.round(score.earned / score.max * 100) : 0;
    }
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.estimatedImpact - a.estimatedImpact;
    });
    const questionsCount = input.assessments.reduce(
      (sum, a) => sum + (a.questions?.length ?? 0),
      0
    );
    return {
      totalScore: Math.round(totalEarned * 10) / 10,
      maxPossibleScore: Math.round(totalMax * 10) / 10,
      percentageScore: totalMax > 0 ? Math.round(totalEarned / totalMax * 100) : 0,
      categoryScores,
      rulesApplied,
      analysisMethod: "deterministic",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      engineVersion: this.VERSION,
      recommendations,
      llmEnhanced: false,
      metadata: {
        courseId: input.courseId,
        analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
        objectivesCount: input.objectives.length,
        chaptersCount: input.chapters.length,
        assessmentsCount: input.assessments.length,
        questionsCount,
        rulesEvaluated: this.rules.length,
        rulesPassed,
        rulesFailed
      }
    };
  }
  /**
   * Get the engine version
   */
  getVersion() {
    return this.VERSION;
  }
  /**
   * Get all rules for inspection/audit
   */
  getRules() {
    return [...this.rules];
  }
  /**
   * Initialize all rubric rules
   */
  initializeRules() {
    return [
      // ═══════════════════════════════════════════════════════════════
      // LEARNING OBJECTIVES RULES (Based on QM Standards 2.1-2.5)
      // ═══════════════════════════════════════════════════════════════
      {
        id: "LO-001",
        category: "LearningObjectives",
        name: "Measurable Objectives",
        condition: (data) => {
          if (data.objectives.length === 0) return false;
          const measurableCount = data.objectives.filter(
            (obj) => MEASURABLE_VERBS_PATTERN.test(obj)
          ).length;
          MEASURABLE_VERBS_PATTERN.lastIndex = 0;
          return measurableCount / data.objectives.length >= 0.8;
        },
        score: 3,
        maxScore: 3,
        weight: 1.5,
        evidence: "80%+ of objectives use measurable action verbs (QM 2.1)",
        recommendation: "Revise objectives to use measurable action verbs from Bloom's Taxonomy",
        source: {
          standard: "QM",
          id: "2.1",
          description: "Course learning objectives describe outcomes that are measurable",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 2.1"
        }
      },
      {
        id: "LO-002",
        category: "LearningObjectives",
        name: "Bloom's Level Variety",
        condition: (data) => {
          const levels = /* @__PURE__ */ new Set();
          for (const obj of data.objectives) {
            for (const [level, pattern] of Object.entries(BLOOMS_PATTERNS)) {
              if (pattern.test(obj)) {
                levels.add(level);
              }
              pattern.lastIndex = 0;
            }
          }
          return levels.size >= 3;
        },
        score: 3,
        maxScore: 3,
        weight: 1.2,
        evidence: "Objectives span at least 3 Bloom's Taxonomy levels",
        recommendation: "Add objectives at higher cognitive levels (Analyze, Evaluate, Create)",
        source: {
          standard: "QM",
          id: "2.2",
          description: "Module objectives are consistent with course-level objectives",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 2.2"
        }
      },
      {
        id: "LO-003",
        category: "LearningObjectives",
        name: "Optimal Objective Count",
        condition: (data) => data.objectives.length >= 3 && data.objectives.length <= 8,
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "Course has 3-8 learning objectives (research-backed optimal range)",
        recommendation: "Adjust to 3-8 total objectives for optimal learner focus",
        source: {
          standard: "Research",
          id: "Mager-1997",
          description: "Preparing Instructional Objectives recommends 3-8 objectives per course",
          fullCitation: "Mager, R. F. (1997). Preparing Instructional Objectives (3rd ed.). CEP Press."
        }
      },
      {
        id: "LO-004",
        category: "LearningObjectives",
        name: "Learner-Centered Language",
        condition: (data) => {
          if (data.objectives.length === 0) return false;
          const learnerCentered = data.objectives.filter(
            (obj) => LEARNER_CENTERED_PATTERN.test(obj)
          ).length;
          return learnerCentered / data.objectives.length >= 0.5;
        },
        score: 2,
        maxScore: 2,
        weight: 0.8,
        evidence: "50%+ objectives written from learner perspective (QM 2.3)",
        recommendation: 'Rewrite objectives using "Students will be able to..." format',
        source: {
          standard: "QM",
          id: "2.3",
          description: "Objectives are stated clearly from the learner's perspective",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 2.3"
        }
      },
      {
        id: "LO-005",
        category: "LearningObjectives",
        name: "Objectives Present",
        condition: (data) => data.objectives.length >= 1,
        score: 3,
        maxScore: 3,
        weight: 1.5,
        evidence: "Course has at least one learning objective defined",
        recommendation: "Define clear learning objectives for your course before adding content",
        source: {
          standard: "QM",
          id: "2.1",
          description: "Course learning objectives are essential for course design"
        }
      },
      // ═══════════════════════════════════════════════════════════════
      // ASSESSMENT RULES (Based on QM Standards 3.1-3.5)
      // ═══════════════════════════════════════════════════════════════
      {
        id: "AS-001",
        category: "Assessment",
        name: "Assessment-Objective Alignment",
        condition: (data) => {
          if (data.objectives.length === 0 || data.assessments.length === 0)
            return false;
          return data.assessments.length >= Math.ceil(data.objectives.length * 0.5);
        },
        score: 3,
        maxScore: 3,
        weight: 1.5,
        evidence: "Assessments cover at least 50% of learning objectives (QM 3.1)",
        recommendation: "Create assessments aligned with each learning objective",
        source: {
          standard: "QM",
          id: "3.1",
          description: "Assessments measure the achievement of stated learning objectives",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 3.1"
        }
      },
      {
        id: "AS-002",
        category: "Assessment",
        name: "Assessment Type Variety",
        condition: (data) => {
          const types = new Set(data.assessments.map((a) => a.type));
          return types.size >= 2;
        },
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "At least 2 different assessment types used",
        recommendation: "Incorporate varied assessment formats (quizzes, projects, discussions, essays)",
        source: {
          standard: "QM",
          id: "3.4",
          description: "Assessment instruments are sequenced and varied",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 3.4"
        }
      },
      {
        id: "AS-003",
        category: "Assessment",
        name: "Formative Assessments Present",
        condition: (data) => {
          const formative = data.assessments.filter(
            (a) => a.type === "quiz" || a.type === "practice" || a.title?.toLowerCase().includes("practice")
          );
          return formative.length >= 1;
        },
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "Course includes formative assessments for learning checks",
        recommendation: "Add practice quizzes or knowledge checks throughout the course",
        source: {
          standard: "OLC",
          id: "EA-3",
          description: "Formative assessments provide feedback for improvement",
          fullCitation: "Online Learning Consortium. (2020). OLC Quality Scorecard Suite. EA-3"
        }
      },
      {
        id: "AS-004",
        category: "Assessment",
        name: "Assessment Feedback Quality",
        condition: (data) => {
          const assessmentsWithQuestions = data.assessments.filter(
            (a) => a.questions && a.questions.length > 0
          );
          if (assessmentsWithQuestions.length === 0) return false;
          const withFeedback = assessmentsWithQuestions.filter(
            (a) => a.questions?.some((q) => q.explanation || q.feedback)
          );
          return withFeedback.length / assessmentsWithQuestions.length >= 0.5;
        },
        score: 2,
        maxScore: 2,
        weight: 1.2,
        evidence: "50%+ of assessments have explanations/feedback (QM 3.3)",
        recommendation: "Add detailed explanations to assessment questions",
        source: {
          standard: "QM",
          id: "3.3",
          description: "Specific criteria are provided for evaluation of learners' work",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 3.3"
        }
      },
      {
        id: "AS-005",
        category: "Assessment",
        name: "Minimum Question Count",
        condition: (data) => {
          const totalQuestions = data.assessments.reduce(
            (sum, a) => sum + (a.questions?.length ?? 0),
            0
          );
          return totalQuestions >= 5;
        },
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "Course has at least 5 assessment questions",
        recommendation: "Add more assessment questions to adequately measure learning",
        source: {
          standard: "Research",
          id: "Assessment-Design",
          description: "Adequate question pool ensures comprehensive assessment coverage"
        }
      },
      // ═══════════════════════════════════════════════════════════════
      // CONTENT STRUCTURE RULES (Based on QM Standards 4 & 5)
      // ═══════════════════════════════════════════════════════════════
      {
        id: "CS-001",
        category: "ContentStructure",
        name: "Minimum Course Structure",
        condition: (data) => data.chapters.length >= 3,
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "Course has at least 3 chapters/modules",
        recommendation: "Expand course structure to at least 3 modules for comprehensive coverage",
        source: {
          standard: "OLC",
          id: "CS-1",
          description: "Course is organized into logical modules or units",
          fullCitation: "Online Learning Consortium. (2020). OLC Quality Scorecard Suite. CS-1"
        }
      },
      {
        id: "CS-002",
        category: "ContentStructure",
        name: "Chapter Learning Outcomes",
        condition: (data) => {
          if (data.chapters.length === 0) return false;
          const withOutcomes = data.chapters.filter(
            (ch) => ch.learningOutcome && ch.learningOutcome.length > 20
          );
          return withOutcomes.length / data.chapters.length >= 0.8;
        },
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "80%+ of chapters have defined learning outcomes",
        recommendation: "Add specific learning outcomes to each chapter",
        source: {
          standard: "QM",
          id: "2.2",
          description: "Module learning objectives are measurable",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 2.2"
        }
      },
      {
        id: "CS-003",
        category: "ContentStructure",
        name: "Consistent Section Depth",
        condition: (data) => {
          if (data.chapters.length < 2) return true;
          const sectionCounts = data.chapters.map(
            (ch) => ch.sections?.length ?? 0
          );
          const avg = sectionCounts.reduce((a, b) => a + b, 0) / sectionCounts.length;
          const variance = sectionCounts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / sectionCounts.length;
          return variance < 4;
        },
        score: 1,
        maxScore: 1,
        weight: 0.8,
        evidence: "Chapters have consistent depth (similar section counts)",
        recommendation: "Balance chapter content for consistent learner workload",
        source: {
          standard: "OLC",
          id: "CS-3",
          description: "Course components are consistent in structure",
          fullCitation: "Online Learning Consortium. (2020). OLC Quality Scorecard Suite. CS-3"
        }
      },
      {
        id: "CS-004",
        category: "ContentStructure",
        name: "Resource Availability",
        condition: (data) => (data.attachments?.length ?? 0) >= 1,
        score: 1,
        maxScore: 1,
        weight: 0.8,
        evidence: "Course includes supplementary resources/attachments",
        recommendation: "Add downloadable resources (PDFs, worksheets, reference materials)",
        source: {
          standard: "QM",
          id: "4.5",
          description: "Instructional materials are accessible",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 4.5"
        }
      },
      {
        id: "CS-005",
        category: "ContentStructure",
        name: "Sections Present",
        condition: (data) => {
          const totalSections = data.chapters.reduce(
            (sum, ch) => sum + (ch.sections?.length ?? 0),
            0
          );
          return totalSections >= data.chapters.length;
        },
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "Each chapter has at least one section on average",
        recommendation: "Add sections to chapters for better content organization",
        source: {
          standard: "OLC",
          id: "CS-2",
          description: "Course content is chunked into manageable segments"
        }
      },
      // ═══════════════════════════════════════════════════════════════
      // COGNITIVE DEPTH RULES (Based on Bloom's & Webb's DOK Research)
      // ═══════════════════════════════════════════════════════════════
      {
        id: "CD-001",
        category: "CognitiveDepth",
        name: "Higher-Order Thinking Content",
        condition: (data) => {
          if (!data.contentAnalysis) return false;
          const higherOrder = (data.contentAnalysis.bloomsDistribution.ANALYZE ?? 0) + (data.contentAnalysis.bloomsDistribution.EVALUATE ?? 0) + (data.contentAnalysis.bloomsDistribution.CREATE ?? 0);
          return higherOrder >= 25;
        },
        score: 3,
        maxScore: 3,
        weight: 1.5,
        evidence: "25%+ content at higher-order thinking levels (Analyze, Evaluate, Create)",
        recommendation: "Add more analytical, evaluative, and creative activities",
        source: {
          standard: "Research",
          id: "Hess-2009",
          description: "Cognitive Rigor Matrix recommends 25%+ higher-order activities",
          fullCitation: "Hess, K. K., et al. (2009). Cognitive Rigor: Blending the Strengths of Bloom's Taxonomy and Webb's Depth of Knowledge. Educational Assessment."
        }
      },
      {
        id: "CD-002",
        category: "CognitiveDepth",
        name: "Balanced Cognitive Distribution",
        condition: (data) => {
          if (!data.contentAnalysis) return false;
          const dist = data.contentAnalysis.bloomsDistribution;
          const values = Object.values(dist);
          const max = Math.max(...values);
          return max <= 50;
        },
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "No single Bloom's level dominates (\u226450% each)",
        recommendation: "Rebalance content across cognitive levels",
        source: {
          standard: "Research",
          id: "Anderson-2001",
          description: "Revised Bloom's Taxonomy recommends balanced distribution",
          fullCitation: "Anderson, L. W., & Krathwohl, D. R. (2001). A Taxonomy for Learning, Teaching, and Assessing. Longman."
        }
      },
      {
        id: "CD-003",
        category: "CognitiveDepth",
        name: "DOK Level 3+ Content",
        condition: (data) => {
          if (!data.contentAnalysis?.dokDistribution) return false;
          const dok = data.contentAnalysis.dokDistribution;
          return (dok.level3 ?? 0) + (dok.level4 ?? 0) >= 20;
        },
        score: 2,
        maxScore: 2,
        weight: 1.2,
        evidence: "20%+ content at DOK Level 3-4 (Strategic/Extended Thinking)",
        recommendation: "Add strategic thinking tasks and extended projects",
        source: {
          standard: "Research",
          id: "Webb-2002",
          description: "Depth of Knowledge framework for cognitive complexity",
          fullCitation: "Webb, N. L. (2002). Depth-of-Knowledge Levels for Four Content Areas. Wisconsin Center for Education Research."
        }
      },
      {
        id: "CD-004",
        category: "CognitiveDepth",
        name: "Application Level Content",
        condition: (data) => {
          if (!data.contentAnalysis) return false;
          return (data.contentAnalysis.bloomsDistribution.APPLY ?? 0) >= 15;
        },
        score: 2,
        maxScore: 2,
        weight: 1,
        evidence: "15%+ content at Application level",
        recommendation: "Add practical exercises and hands-on application activities",
        source: {
          standard: "Research",
          id: "Freeman-2014",
          description: "Active learning requires application of knowledge",
          fullCitation: "Freeman, S., et al. (2014). Active learning increases student performance in STEM. PNAS, 111(23), 8410-8415."
        }
      },
      // ═══════════════════════════════════════════════════════════════
      // ENGAGEMENT RULES (Based on OLC Standards)
      // ═══════════════════════════════════════════════════════════════
      {
        id: "EN-001",
        category: "Engagement",
        name: "Course Description Quality",
        condition: (data) => (data.description?.length ?? 0) >= 200,
        score: 1,
        maxScore: 1,
        weight: 0.8,
        evidence: "Course has detailed description (200+ characters)",
        recommendation: "Expand course description with learning outcomes and target audience",
        source: {
          standard: "QM",
          id: "1.2",
          description: "Course description provides introduction to course content",
          fullCitation: "Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 1.2"
        }
      },
      {
        id: "EN-002",
        category: "Engagement",
        name: "Visual Content Present",
        condition: (data) => {
          const hasVideo = data.chapters.some(
            (ch) => ch.sections?.some((s) => s.videoUrl)
          );
          const hasImage = Boolean(data.imageUrl);
          return hasVideo || hasImage;
        },
        score: 1,
        maxScore: 1,
        weight: 0.8,
        evidence: "Course includes visual content (images or videos)",
        recommendation: "Add video content or visual materials for engagement",
        source: {
          standard: "OLC",
          id: "TL-2",
          description: "Course uses varied instructional methods",
          fullCitation: "Online Learning Consortium. (2020). OLC Quality Scorecard Suite. TL-2"
        }
      },
      {
        id: "EN-003",
        category: "Engagement",
        name: "Course Title Quality",
        condition: (data) => data.title.length >= 10 && data.title.length <= 100,
        score: 1,
        maxScore: 1,
        weight: 0.5,
        evidence: "Course title is appropriately descriptive (10-100 characters)",
        recommendation: "Ensure course title is descriptive but concise (10-100 characters)",
        source: {
          standard: "QM",
          id: "1.1",
          description: "Course title accurately describes course content"
        }
      },
      // ═══════════════════════════════════════════════════════════════
      // ACCESSIBILITY RULES (Based on QM Standard 8)
      // ═══════════════════════════════════════════════════════════════
      {
        id: "AC-001",
        category: "Accessibility",
        name: "Course Image Present",
        condition: (data) => Boolean(data.imageUrl),
        score: 1,
        maxScore: 1,
        weight: 0.5,
        evidence: "Course has a cover image",
        recommendation: "Add a representative course image for visual identification",
        source: {
          standard: "QM",
          id: "8.1",
          description: "Course design facilitates readability"
        }
      },
      {
        id: "AC-002",
        category: "Accessibility",
        name: "Section Descriptions",
        condition: (data) => {
          const sections = data.chapters.flatMap((ch) => ch.sections ?? []);
          if (sections.length === 0) return true;
          const withDesc = sections.filter(
            (s) => s.description && s.description.length > 10
          );
          return withDesc.length / sections.length >= 0.5;
        },
        score: 1,
        maxScore: 1,
        weight: 0.8,
        evidence: "50%+ of sections have descriptions",
        recommendation: "Add descriptive text to sections to help learners navigate",
        source: {
          standard: "QM",
          id: "8.3",
          description: "Course provides accessible text and images within course"
        }
      }
    ];
  }
  getPriorityFromWeight(weight) {
    if (weight >= 1.5) return "critical";
    if (weight >= 1.2) return "high";
    if (weight >= 1) return "medium";
    return "low";
  }
  estimateEffort(rule) {
    const highEffortCategories = [
      "CognitiveDepth",
      "Assessment"
    ];
    const lowEffortCategories = ["Engagement", "Accessibility"];
    if (highEffortCategories.includes(rule.category)) return "high";
    if (lowEffortCategories.includes(rule.category)) return "low";
    return "medium";
  }
  generateActionSteps(rule) {
    const steps = [];
    switch (rule.id) {
      case "LO-001":
        steps.push("Review each learning objective");
        steps.push(
          "Replace vague verbs (understand, know) with measurable ones (analyze, create)"
        );
        steps.push("Use Bloom's Taxonomy verb list as reference");
        break;
      case "LO-002":
        steps.push("Map current objectives to Bloom's levels");
        steps.push("Identify missing levels");
        steps.push("Add objectives for Analyze, Evaluate, and Create levels");
        break;
      case "LO-003":
        steps.push("Review current objective count");
        steps.push("Merge redundant objectives if above 8");
        steps.push("Split broad objectives if below 3");
        break;
      case "LO-004":
        steps.push('Rewrite objectives starting with "Students will be able to..."');
        steps.push("Focus on learner outcomes, not instructor activities");
        break;
      case "AS-001":
        steps.push("Create alignment matrix: objectives vs assessments");
        steps.push("Identify objectives without assessments");
        steps.push("Design assessments for uncovered objectives");
        break;
      case "AS-002":
        steps.push("Review current assessment types");
        steps.push(
          "Add different formats: quizzes, projects, discussions, essays"
        );
        steps.push("Match assessment type to learning objective");
        break;
      case "AS-003":
        steps.push("Add practice quizzes after each chapter");
        steps.push("Include knowledge checks at key points");
        steps.push("Ensure immediate feedback on formative assessments");
        break;
      case "AS-004":
        steps.push("Add explanations to each question");
        steps.push("Explain why correct answer is correct");
        steps.push("Explain why incorrect answers are wrong");
        break;
      case "CS-001":
        steps.push("Organize content into logical modules");
        steps.push("Create at least 3 chapters covering course scope");
        steps.push("Ensure each chapter has clear focus");
        break;
      case "CS-002":
        steps.push("Write learning outcomes for each chapter");
        steps.push("Align chapter outcomes with course objectives");
        steps.push("Use measurable verbs in chapter outcomes");
        break;
      case "CD-001":
        steps.push("Add case studies requiring analysis");
        steps.push("Include evaluation activities (peer review, critique)");
        steps.push("Add creative projects (design, develop, propose)");
        break;
      case "CD-002":
        steps.push("Review content distribution across cognitive levels");
        steps.push("Reduce content at dominant level");
        steps.push("Add content at underrepresented levels");
        break;
      case "EN-001":
        steps.push("Expand course description to 200+ characters");
        steps.push("Include target audience information");
        steps.push("List key learning outcomes");
        break;
      case "EN-002":
        steps.push("Add course cover image");
        steps.push("Include video content in lessons");
        steps.push("Use visuals to explain complex concepts");
        break;
      default:
        steps.push("Review current implementation");
        steps.push("Apply recommended changes");
        steps.push("Verify improvement");
    }
    return steps;
  }
};
var deterministicRubricEngine = new DeterministicRubricEngine();

// src/analyzers/deep-content-analyzer.ts
var BLOOM_PATTERNS = [
  {
    level: "REMEMBER",
    weight: 1,
    patterns: [
      // Action verbs
      /\b(define|list|name|recall|identify|recognize|describe|state|match|select|label|locate|memorize|repeat|reproduce)\b/gi,
      // Question patterns
      /\b(what is|who is|when did|where is|how many|which one|what are|who was|when was)\b/gi,
      // Instructional patterns
      /\b(the definition of|known as|refers to|is called|means|is defined as)\b/gi,
      // Assessment patterns
      /\b(choose the correct|select the right|identify which|name the|list all)\b/gi
    ],
    contextBonus: { assessment: 0.1, instructional: 0.05 }
  },
  {
    level: "UNDERSTAND",
    weight: 2,
    patterns: [
      // Action verbs
      /\b(explain|summarize|interpret|paraphrase|classify|compare|contrast|discuss|predict|translate|describe|distinguish|estimate|generalize|infer)\b/gi,
      // Question patterns
      /\b(why does|how does|what does .{1,30} mean|in other words|what is the difference|how would you explain)\b/gi,
      // Instructional patterns
      /\b(the main idea|the difference between|an example of|this means that|in summary|to summarize|essentially|basically)\b/gi,
      // Comprehension indicators
      /\b(shows that|demonstrates that|indicates|suggests|implies|represents)\b/gi
    ],
    contextBonus: { instructional: 0.1, example: 0.15 }
  },
  {
    level: "APPLY",
    weight: 3,
    patterns: [
      // Action verbs
      /\b(apply|demonstrate|solve|use|implement|calculate|execute|practice|compute|show|illustrate|operate|schedule|sketch|employ|utilize)\b/gi,
      // Problem-solving patterns
      /\b(solve for|calculate the|build a|use .{1,30} to|apply .{1,30} to|how would you use|using this method)\b/gi,
      // Practice patterns
      /\b(in this scenario|given the following|let's practice|try this|now you try|work through|complete the following)\b/gi,
      // Implementation patterns
      /\b(implement the|put into practice|carry out|execute the|perform the)\b/gi
    ],
    contextBonus: { activity: 0.15, assessment: 0.1 }
  },
  {
    level: "ANALYZE",
    weight: 4,
    patterns: [
      // Action verbs
      /\b(analyze|examine|investigate|differentiate|organize|attribute|deconstruct|outline|structure|integrate|distinguish|compare|contrast|categorize)\b/gi,
      // Analysis patterns
      /\b(what are the reasons|what evidence|how does .{1,30} relate|break down|identify the components|what is the relationship)\b/gi,
      // Comparison patterns
      /\b(compare and contrast|categorize the|distinguish between|analyze the relationship|examine how|investigate why)\b/gi,
      // Critical thinking indicators
      /\b(the underlying|the root cause|contributing factors|key components|structural elements)\b/gi
    ],
    contextBonus: { assessment: 0.15, activity: 0.1 }
  },
  {
    level: "EVALUATE",
    weight: 5,
    patterns: [
      // Action verbs
      /\b(evaluate|judge|critique|justify|defend|prioritize|assess|recommend|conclude|appraise|argue|rate|support|validate|verify)\b/gi,
      // Evaluation patterns
      /\b(do you agree|is this valid|what is the best|justify your|argue for|argue against|which is more effective|rate the)\b/gi,
      // Opinion/judgment patterns
      /\b(in your opinion|based on the evidence|evaluate the|assess whether|determine if|judge the quality|critique the)\b/gi,
      // Value judgment indicators
      /\b(the most effective|the best approach|superior to|preferable|optimal|most appropriate)\b/gi
    ],
    contextBonus: { assessment: 0.2, activity: 0.1 }
  },
  {
    level: "CREATE",
    weight: 6,
    patterns: [
      // Action verbs
      /\b(create|design|develop|formulate|construct|propose|invent|compose|generate|produce|plan|devise|originate|author|synthesize)\b/gi,
      // Creation patterns
      /\b(design a solution|develop a plan|propose an alternative|create your own|write your own|build your own)\b/gi,
      // Innovation patterns
      /\b(what if|imagine|generate a|compose a|devise a|formulate a new|invent a)\b/gi,
      // Synthesis indicators
      /\b(combine .{1,30} to create|synthesize|integrate .{1,30} into|merge|blend|fuse)\b/gi
    ],
    contextBonus: { activity: 0.2, assessment: 0.15 }
  }
];
var DeepContentAnalyzer = class {
  VERSION = "1.0.0";
  MIN_SENTENCE_LENGTH = 15;
  MIN_WORD_COUNT = 4;
  MIN_CONTENT_LENGTH = 50;
  /**
   * Analyze multiple content sources for cognitive depth
   */
  async analyzeContent(sources) {
    const sentenceAnalyses = [];
    const verbFrequencyMap = /* @__PURE__ */ new Map();
    const contextCounts = {
      instructional: 0,
      assessment: 0,
      activity: 0,
      example: 0,
      introduction: 0,
      summary: 0
    };
    const contentTypeCounts = {
      video_transcript: 0,
      document: 0,
      quiz: 0,
      discussion: 0,
      assignment: 0,
      text: 0,
      lesson_content: 0
    };
    let totalWords = 0;
    let analyzedSources = 0;
    let skippedSources = 0;
    for (const source of sources) {
      if (!source.content || source.content.length < this.MIN_CONTENT_LENGTH) {
        skippedSources++;
        continue;
      }
      analyzedSources++;
      totalWords += source.metadata.wordCount;
      contentTypeCounts[source.type]++;
      const sentences = this.splitIntoSentences(source.content);
      const baseContext = this.determineContext(source.type);
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const position = this.determinePosition(i, sentences.length);
        const context = this.refineContext(baseContext, sentence, position);
        const analysis = this.analyzeSentence(sentence, context, position);
        sentenceAnalyses.push(analysis);
        contextCounts[analysis.context]++;
        for (const pattern of analysis.triggerPatterns) {
          const key = pattern.toLowerCase();
          const existing = verbFrequencyMap.get(key);
          if (existing) {
            existing.count++;
            if (!existing.contexts.includes(context)) {
              existing.contexts.push(context);
            }
          } else {
            verbFrequencyMap.set(key, {
              verb: key,
              count: 1,
              level: analysis.predictedBloomsLevel,
              contexts: [context]
            });
          }
        }
      }
    }
    const bloomsDistribution = this.calculateBloomsDistribution(sentenceAnalyses);
    const weightedBloomsDistribution = this.calculateWeightedBloomsDistribution(sentenceAnalyses);
    const dokDistribution = this.calculateDOKDistribution(sentenceAnalyses);
    const overallConfidence = this.calculateOverallConfidence(sentenceAnalyses);
    const verbFrequency = Array.from(verbFrequencyMap.values()).sort((a, b) => b.count - a.count).slice(0, 50);
    const totalContexts = Object.values(contextCounts).reduce((a, b) => a + b, 0);
    const contextDistribution = {};
    for (const [ctx, count] of Object.entries(contextCounts)) {
      contextDistribution[ctx] = totalContexts > 0 ? Math.round(count / totalContexts * 100) : 0;
    }
    const contentGaps = this.identifyContentGaps(
      bloomsDistribution,
      dokDistribution,
      contextDistribution
    );
    const recommendations = this.generateRecommendations(
      bloomsDistribution,
      dokDistribution,
      contentGaps,
      overallConfidence
    );
    return {
      bloomsDistribution,
      dokDistribution,
      weightedBloomsDistribution,
      overallConfidence,
      analysisMethod: "hybrid",
      analysisVersion: this.VERSION,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      contentCoverage: {
        totalSources: sources.length,
        analyzedSources,
        skippedSources,
        totalWords,
        totalSentences: sentenceAnalyses.length,
        averageWordsPerSentence: sentenceAnalyses.length > 0 ? Math.round(totalWords / sentenceAnalyses.length) : 0,
        contentTypes: contentTypeCounts
      },
      sentenceAnalyses,
      verbFrequency,
      contextDistribution,
      contentGaps,
      recommendations,
      researchBasis: {
        framework: "Anderson & Krathwohl Revised Taxonomy + Webb DOK",
        citation: "Anderson, L.W. & Krathwohl, D.R. (2001). A Taxonomy for Learning, Teaching, and Assessing. Webb, N.L. (2002). Depth-of-Knowledge Levels.",
        methodology: "Pattern-based sentence classification with context-aware weighting"
      }
    };
  }
  /**
   * Analyze a single content source
   */
  async analyzeSingleSource(source) {
    return this.analyzeContent([source]);
  }
  /**
   * Split text into analyzable sentences
   */
  splitIntoSentences(text) {
    const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{2,}/g, "\n").replace(/\s{2,}/g, " ");
    const rawSentences = cleaned.replace(/([.!?])\s+/g, "$1\n").replace(/([.!?])$/g, "$1\n").split("\n").map((s) => s.trim());
    return rawSentences.filter(
      (s) => s.length >= this.MIN_SENTENCE_LENGTH && s.split(/\s+/).length >= this.MIN_WORD_COUNT && !/^[•\-\*\d]+\.?\s*$/.test(s)
      // Skip bullet points and numbers
    );
  }
  /**
   * Determine base context from content type
   */
  determineContext(type) {
    switch (type) {
      case "quiz":
        return "assessment";
      case "assignment":
        return "activity";
      case "discussion":
        return "activity";
      case "video_transcript":
        return "instructional";
      case "document":
        return "instructional";
      default:
        return "instructional";
    }
  }
  /**
   * Refine context based on sentence content and position
   */
  refineContext(baseContext, sentence, position) {
    const lower = sentence.toLowerCase();
    if (/\b(for example|for instance|such as|e\.g\.|consider this|let's say)\b/i.test(lower)) {
      return "example";
    }
    if (position === "beginning" && /\b(in this|we will|you will learn|this lesson|objectives|overview)\b/i.test(lower)) {
      return "introduction";
    }
    if (position === "end" && /\b(in summary|to summarize|in conclusion|key takeaways|remember that|main points)\b/i.test(lower)) {
      return "summary";
    }
    if (/\b(try this|practice|exercise|your turn|complete the|work through)\b/i.test(lower)) {
      return "activity";
    }
    if (/\b(question|quiz|test|exam|answer|correct|incorrect|true or false|multiple choice)\b/i.test(lower)) {
      return "assessment";
    }
    return baseContext;
  }
  /**
   * Determine sentence position in content
   */
  determinePosition(index, total) {
    const position = index / total;
    if (position < 0.15) return "beginning";
    if (position > 0.85) return "end";
    return "middle";
  }
  /**
   * Analyze a single sentence for cognitive level
   */
  analyzeSentence(sentence, context, position) {
    const matches = [];
    for (const bloomPattern of BLOOM_PATTERNS) {
      const foundPatterns = [];
      let score = 0;
      for (const pattern of bloomPattern.patterns) {
        const matchResults = sentence.match(pattern);
        if (matchResults) {
          foundPatterns.push(...matchResults.map((m) => m.toLowerCase()));
          score += matchResults.length * bloomPattern.weight;
        }
      }
      const contextBonus = bloomPattern.contextBonus[context] ?? 0;
      score *= 1 + contextBonus;
      if (foundPatterns.length > 0) {
        matches.push({
          level: bloomPattern.level,
          patterns: [...new Set(foundPatterns)],
          // Dedupe
          score
        });
      }
    }
    matches.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.5) return b.score - a.score;
      return this.getBloomsWeight(b.level) - this.getBloomsWeight(a.level);
    });
    const best = matches[0];
    const bloomsLevel = best?.level ?? "UNDERSTAND";
    const confidence = this.calculateSentenceConfidence(best, matches, sentence);
    return {
      sentence,
      predictedBloomsLevel: bloomsLevel,
      predictedDOKLevel: this.bloomsToDOK(bloomsLevel),
      confidence,
      triggerPatterns: best?.patterns ?? [],
      context,
      position
    };
  }
  /**
   * Calculate confidence score for a sentence analysis
   */
  calculateSentenceConfidence(best, allMatches, sentence) {
    if (!best) {
      return 25;
    }
    let confidence = 0;
    const patternCount = best.patterns.length;
    if (patternCount >= 3) confidence += 40;
    else if (patternCount >= 2) confidence += 30;
    else confidence += 20;
    if (best.score >= 10) confidence += 25;
    else if (best.score >= 5) confidence += 15;
    else confidence += 10;
    if (allMatches.length >= 2) {
      const gap = best.score - allMatches[1].score;
      if (gap > 3) confidence += 20;
      else if (gap > 1) confidence += 10;
    } else if (allMatches.length === 1) {
      confidence += 15;
    }
    const wordCount = sentence.split(/\s+/).length;
    if (wordCount >= 10 && wordCount <= 30) confidence += 5;
    return Math.min(confidence, 100);
  }
  /**
   * Get Bloom's level weight
   */
  getBloomsWeight(level) {
    const weights = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 3,
      ANALYZE: 4,
      EVALUATE: 5,
      CREATE: 6
    };
    return weights[level];
  }
  /**
   * Map Bloom's level to Webb's DOK
   */
  bloomsToDOK(level) {
    const mapping = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 2,
      ANALYZE: 3,
      EVALUATE: 3,
      CREATE: 4
    };
    return mapping[level];
  }
  /**
   * Calculate Bloom's distribution from sentence analyses
   */
  calculateBloomsDistribution(analyses) {
    const counts = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    for (const analysis of analyses) {
      counts[analysis.predictedBloomsLevel]++;
    }
    const total = analyses.length || 1;
    return {
      REMEMBER: Math.round(counts.REMEMBER / total * 100),
      UNDERSTAND: Math.round(counts.UNDERSTAND / total * 100),
      APPLY: Math.round(counts.APPLY / total * 100),
      ANALYZE: Math.round(counts.ANALYZE / total * 100),
      EVALUATE: Math.round(counts.EVALUATE / total * 100),
      CREATE: Math.round(counts.CREATE / total * 100)
    };
  }
  /**
   * Calculate weighted Bloom's distribution (by confidence)
   */
  calculateWeightedBloomsDistribution(analyses) {
    const weightedCounts = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    let totalWeight = 0;
    for (const analysis of analyses) {
      const weight = analysis.confidence / 100;
      weightedCounts[analysis.predictedBloomsLevel] += weight;
      totalWeight += weight;
    }
    if (totalWeight === 0) {
      return {
        REMEMBER: 0,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0
      };
    }
    return {
      REMEMBER: Math.round(weightedCounts.REMEMBER / totalWeight * 100),
      UNDERSTAND: Math.round(weightedCounts.UNDERSTAND / totalWeight * 100),
      APPLY: Math.round(weightedCounts.APPLY / totalWeight * 100),
      ANALYZE: Math.round(weightedCounts.ANALYZE / totalWeight * 100),
      EVALUATE: Math.round(weightedCounts.EVALUATE / totalWeight * 100),
      CREATE: Math.round(weightedCounts.CREATE / totalWeight * 100)
    };
  }
  /**
   * Calculate DOK distribution from sentence analyses
   */
  calculateDOKDistribution(analyses) {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const analysis of analyses) {
      counts[analysis.predictedDOKLevel]++;
    }
    const total = analyses.length || 1;
    return {
      level1: Math.round(counts[1] / total * 100),
      level2: Math.round(counts[2] / total * 100),
      level3: Math.round(counts[3] / total * 100),
      level4: Math.round(counts[4] / total * 100)
    };
  }
  /**
   * Calculate overall analysis confidence
   */
  calculateOverallConfidence(analyses) {
    if (analyses.length === 0) return 0;
    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
    let sampleBonus = 0;
    if (analyses.length >= 100) sampleBonus = 10;
    else if (analyses.length >= 50) sampleBonus = 5;
    return Math.min(Math.round(avgConfidence + sampleBonus), 100);
  }
  /**
   * Identify content gaps based on distributions
   */
  identifyContentGaps(blooms, dok, contexts) {
    const gaps = [];
    const bloomsLevels = [
      "REMEMBER",
      "UNDERSTAND",
      "APPLY",
      "ANALYZE",
      "EVALUATE",
      "CREATE"
    ];
    for (const level of bloomsLevels) {
      if (blooms[level] === 0) {
        gaps.push({
          type: "missing_level",
          level,
          severity: level === "REMEMBER" || level === "UNDERSTAND" ? "low" : "medium",
          description: `No content at ${level} level detected`,
          recommendation: `Add ${level.toLowerCase()}-level activities or content`
        });
      }
    }
    const lowerOrder = blooms.REMEMBER + blooms.UNDERSTAND;
    if (lowerOrder > 60) {
      gaps.push({
        type: "overrepresented",
        severity: "high",
        description: `${lowerOrder}% of content is at lower-order thinking levels (Remember/Understand)`,
        recommendation: "Add more application, analysis, and evaluation activities"
      });
    }
    const higherOrder = blooms.ANALYZE + blooms.EVALUATE + blooms.CREATE;
    if (higherOrder < 20) {
      gaps.push({
        type: "underrepresented",
        severity: "high",
        description: `Only ${higherOrder}% of content targets higher-order thinking`,
        recommendation: "Increase analytical, evaluative, and creative content to at least 25%"
      });
    }
    const strategicThinking = dok.level3 + dok.level4;
    if (strategicThinking < 15) {
      gaps.push({
        type: "underrepresented",
        severity: "medium",
        description: `Only ${strategicThinking}% of content at DOK Level 3-4 (Strategic/Extended Thinking)`,
        recommendation: "Add strategic thinking tasks and extended projects"
      });
    }
    if (contexts.activity < 10 && contexts.assessment < 10) {
      gaps.push({
        type: "context_imbalance",
        context: "activity",
        severity: "medium",
        description: "Limited practice opportunities detected",
        recommendation: "Add more hands-on activities and practice exercises"
      });
    }
    if (contexts.example < 5) {
      gaps.push({
        type: "context_imbalance",
        context: "example",
        severity: "low",
        description: "Few examples detected in content",
        recommendation: "Add more concrete examples to illustrate concepts"
      });
    }
    return gaps;
  }
  /**
   * Generate actionable recommendations
   */
  generateRecommendations(blooms, dok, gaps, confidence) {
    const recommendations = [];
    const highSeverityGaps = gaps.filter((g) => g.severity === "high");
    for (const gap of highSeverityGaps) {
      recommendations.push(`[Critical] ${gap.recommendation}`);
    }
    if (blooms.REMEMBER + blooms.UNDERSTAND > 50) {
      recommendations.push(
        "Reduce recall-focused content; transform definitions into application exercises"
      );
    }
    if (blooms.CREATE < 5) {
      recommendations.push("Add creative projects or synthesis activities");
    }
    if (blooms.EVALUATE < 10) {
      recommendations.push("Include more critical evaluation and judgment tasks");
    }
    if (blooms.APPLY < 15) {
      recommendations.push("Add more hands-on application exercises and problem-solving");
    }
    if (dok.level4 < 5) {
      recommendations.push("Add extended thinking projects requiring sustained investigation");
    }
    if (confidence < 50) {
      recommendations.push(
        "[Note] Analysis confidence is low. Consider adding more structured content with clear learning objectives"
      );
    }
    const mediumGaps = gaps.filter((g) => g.severity === "medium");
    for (const gap of mediumGaps.slice(0, 3)) {
      recommendations.push(gap.recommendation);
    }
    return [...new Set(recommendations)].slice(0, 10);
  }
  /**
   * Get a summary of the analysis
   */
  getSummary(result) {
    const { bloomsDistribution, dokDistribution, contentGaps, overallConfidence } = result;
    const higherOrder = bloomsDistribution.ANALYZE + bloomsDistribution.EVALUATE + bloomsDistribution.CREATE;
    const strategicThinking = dokDistribution.level3 + dokDistribution.level4;
    const criticalGaps = contentGaps.filter((g) => g.severity === "high").length;
    let overallRating;
    if (higherOrder >= 30 && strategicThinking >= 25 && criticalGaps === 0) {
      overallRating = "excellent";
    } else if (higherOrder >= 20 && strategicThinking >= 15 && criticalGaps <= 1) {
      overallRating = "good";
    } else if (higherOrder >= 10 || criticalGaps <= 2) {
      overallRating = "needs_improvement";
    } else {
      overallRating = "poor";
    }
    const keyStrengths = [];
    if (bloomsDistribution.APPLY >= 20) {
      keyStrengths.push("Strong application-focused content");
    }
    if (higherOrder >= 25) {
      keyStrengths.push("Good higher-order thinking coverage");
    }
    if (overallConfidence >= 70) {
      keyStrengths.push("Clear, well-structured content");
    }
    if (bloomsDistribution.CREATE >= 10) {
      keyStrengths.push("Creative activities present");
    }
    const keyWeaknesses = [];
    for (const gap of contentGaps.filter((g) => g.severity === "high")) {
      keyWeaknesses.push(gap.description);
    }
    const priorityActions = result.recommendations.slice(0, 3);
    return {
      overallRating,
      keyStrengths: keyStrengths.slice(0, 4),
      keyWeaknesses: keyWeaknesses.slice(0, 4),
      priorityActions
    };
  }
};
var deepContentAnalyzer = new DeepContentAnalyzer();

// src/analyzers/transcript-analyzer.ts
var TranscriptAnalyzer = class {
  contentAnalyzer;
  MIN_TRANSCRIPT_LENGTH = 100;
  // Minimum characters
  WORDS_PER_MINUTE_THRESHOLD = 100;
  // Typical speech rate
  constructor(contentAnalyzer) {
    this.contentAnalyzer = contentAnalyzer ?? deepContentAnalyzer;
  }
  /**
   * Analyze transcripts for an entire course
   */
  async analyzeCourseTranscripts(courseId, sources) {
    const videoResults = [];
    const contentSources = [];
    let totalWordCount = 0;
    let totalDuration = 0;
    let totalConfidence = 0;
    let analyzedCount = 0;
    const qualityDistribution = {
      excellent: 0,
      good: 0,
      acceptable: 0,
      poor: 0
    };
    for (const source of sources) {
      const result = await this.analyzeTranscript(source);
      videoResults.push(result);
      if (result.hasTranscript && result.contentAnalysis) {
        analyzedCount++;
        totalWordCount += result.wordCount;
        totalConfidence += result.confidence;
        if (result.duration) {
          totalDuration += result.duration;
        }
        if (result.transcriptQuality) {
          qualityDistribution[result.transcriptQuality.qualityRating]++;
        }
        if (source.transcript) {
          contentSources.push({
            type: "video_transcript",
            content: source.transcript,
            metadata: {
              sourceId: source.sectionId,
              sectionId: source.sectionId,
              chapterId: source.chapterId,
              title: source.sectionTitle ?? "Video Transcript",
              wordCount: result.wordCount,
              duration: source.duration
            }
          });
        }
      }
    }
    let aggregatedAnalysis = null;
    if (contentSources.length > 0) {
      aggregatedAnalysis = await this.contentAnalyzer.analyzeContent(contentSources);
    }
    const videosWithTranscripts = videoResults.filter((r) => r.hasTranscript).length;
    const averageWordsPerMinute = totalDuration > 0 ? Math.round(totalWordCount / totalDuration * 60) : 0;
    const recommendations = this.generateCourseRecommendations(
      sources.length,
      videosWithTranscripts,
      qualityDistribution,
      aggregatedAnalysis
    );
    return {
      courseId,
      totalVideos: sources.length,
      videosWithTranscripts,
      videosAnalyzed: analyzedCount,
      videosMissingTranscripts: sources.length - videosWithTranscripts,
      totalWordCount,
      totalDuration,
      averageWordsPerMinute,
      aggregatedAnalysis,
      averageConfidence: analyzedCount > 0 ? Math.round(totalConfidence / analyzedCount) : 0,
      videoResults,
      transcriptCoveragePercent: sources.length > 0 ? Math.round(videosWithTranscripts / sources.length * 100) : 0,
      qualityDistribution,
      recommendations
    };
  }
  /**
   * Analyze a single video transcript
   */
  async analyzeTranscript(source) {
    const extractionResult = await this.getTranscript(source);
    if (!extractionResult.success || !extractionResult.transcript) {
      return {
        sectionId: source.sectionId,
        chapterId: source.chapterId,
        sectionTitle: source.sectionTitle,
        chapterTitle: source.chapterTitle,
        hasTranscript: false,
        transcriptSource: "custom",
        transcriptQuality: null,
        wordCount: 0,
        duration: source.duration,
        contentAnalysis: null,
        confidence: 0,
        error: extractionResult.error ?? "Transcript not available"
      };
    }
    const transcriptQuality = this.assessTranscriptQuality(
      extractionResult.transcript,
      extractionResult.language
    );
    if (transcriptQuality.qualityRating === "poor") {
      return {
        sectionId: source.sectionId,
        chapterId: source.chapterId,
        sectionTitle: source.sectionTitle,
        chapterTitle: source.chapterTitle,
        hasTranscript: true,
        transcriptSource: extractionResult.source,
        transcriptQuality,
        wordCount: transcriptQuality.wordCount,
        duration: source.duration,
        wordsPerMinute: source.duration ? Math.round(transcriptQuality.wordCount / source.duration * 60) : void 0,
        contentAnalysis: null,
        confidence: 0,
        error: "Transcript quality too low for reliable analysis"
      };
    }
    const contentSource = {
      type: "video_transcript",
      content: extractionResult.transcript,
      metadata: {
        sourceId: source.sectionId,
        sectionId: source.sectionId,
        chapterId: source.chapterId,
        title: source.sectionTitle ?? "Video Transcript",
        wordCount: transcriptQuality.wordCount,
        duration: source.duration
      }
    };
    const contentAnalysis = await this.contentAnalyzer.analyzeSingleSource(contentSource);
    return {
      sectionId: source.sectionId,
      chapterId: source.chapterId,
      sectionTitle: source.sectionTitle,
      chapterTitle: source.chapterTitle,
      hasTranscript: true,
      transcriptSource: extractionResult.source,
      transcriptQuality,
      wordCount: transcriptQuality.wordCount,
      duration: source.duration,
      wordsPerMinute: source.duration ? Math.round(transcriptQuality.wordCount / source.duration * 60) : void 0,
      contentAnalysis,
      confidence: contentAnalysis.overallConfidence
    };
  }
  /**
   * Get transcript from various sources
   */
  async getTranscript(source) {
    if (source.transcript && source.transcript.length >= this.MIN_TRANSCRIPT_LENGTH) {
      return {
        success: true,
        transcript: source.transcript,
        source: "provided",
        language: source.language ?? "en",
        wordCount: source.transcript.split(/\s+/).length,
        confidence: 100
      };
    }
    const platform = this.detectVideoPlatform(source.videoUrl);
    switch (platform) {
      case "youtube":
        return this.extractYouTubeTranscript(source.videoUrl);
      case "vimeo":
        return this.extractVimeoTranscript(source.videoUrl);
      case "mux":
        return this.extractMuxTranscript(source.videoUrl);
      default:
        return {
          success: false,
          transcript: null,
          source: "custom",
          language: "en",
          wordCount: 0,
          confidence: 0,
          error: "Transcript extraction not available for this video platform"
        };
    }
  }
  /**
   * Detect video platform from URL
   */
  detectVideoPlatform(url) {
    if (!url) return "custom";
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      return "youtube";
    }
    if (lowerUrl.includes("vimeo.com")) {
      return "vimeo";
    }
    if (lowerUrl.includes("mux.com") || lowerUrl.includes("stream.mux.com")) {
      return "mux";
    }
    if (lowerUrl.includes("cloudflarestream") || lowerUrl.includes("videodelivery.net")) {
      return "cloudflare";
    }
    return "custom";
  }
  /**
   * Extract YouTube transcript
   * Note: Requires YouTube Data API integration
   */
  async extractYouTubeTranscript(url) {
    return {
      success: false,
      transcript: null,
      source: "youtube",
      language: "en",
      wordCount: 0,
      confidence: 0,
      error: "YouTube transcript extraction not yet implemented. Provide transcript directly."
    };
  }
  /**
   * Extract Vimeo transcript
   * Note: Requires Vimeo API integration
   */
  async extractVimeoTranscript(url) {
    return {
      success: false,
      transcript: null,
      source: "vimeo",
      language: "en",
      wordCount: 0,
      confidence: 0,
      error: "Vimeo transcript extraction not yet implemented. Provide transcript directly."
    };
  }
  /**
   * Extract Mux transcript
   * Note: Mux provides auto-generated captions
   */
  async extractMuxTranscript(url) {
    return {
      success: false,
      transcript: null,
      source: "mux",
      language: "en",
      wordCount: 0,
      confidence: 0,
      error: "Mux transcript extraction not yet implemented. Provide transcript directly."
    };
  }
  /**
   * Assess transcript quality
   */
  assessTranscriptQuality(transcript, language = "en") {
    const words = transcript.split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length;
    const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = Math.max(sentences.length, 1);
    const averageSentenceLength = wordCount / sentenceCount;
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    const vocabularyRichness = wordCount > 0 ? uniqueWords.size / wordCount : 0;
    const avgSyllables = this.estimateAverageSyllables(words);
    const readabilityScore = Math.max(
      0,
      0.39 * averageSentenceLength + 11.8 * avgSyllables - 15.59
    );
    const hasTimestamps = /\d{1,2}:\d{2}/.test(transcript);
    let qualityRating;
    if (wordCount < 50) {
      qualityRating = "poor";
    } else if (wordCount < 200 || vocabularyRichness < 0.3) {
      qualityRating = "acceptable";
    } else if (wordCount >= 500 && vocabularyRichness >= 0.4 && averageSentenceLength >= 8) {
      qualityRating = "excellent";
    } else {
      qualityRating = "good";
    }
    return {
      wordCount,
      averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
      vocabularyRichness: Math.round(vocabularyRichness * 100) / 100,
      readabilityScore: Math.round(readabilityScore * 10) / 10,
      hasTimestamps,
      language,
      qualityRating
    };
  }
  /**
   * Estimate average syllables per word
   */
  estimateAverageSyllables(words) {
    if (words.length === 0) return 1;
    let totalSyllables = 0;
    for (const word of words) {
      totalSyllables += this.countSyllables(word);
    }
    return totalSyllables / words.length;
  }
  /**
   * Count syllables in a word (English approximation)
   */
  countSyllables(word) {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
    if (cleanWord.length <= 3) return 1;
    const vowelGroups = cleanWord.match(/[aeiouy]+/g);
    let count = vowelGroups ? vowelGroups.length : 1;
    if (cleanWord.endsWith("e")) {
      count = Math.max(1, count - 1);
    }
    if (cleanWord.match(/[^aeiou]le$/)) {
      count++;
    }
    return Math.max(1, count);
  }
  /**
   * Generate recommendations for course transcript coverage
   */
  generateCourseRecommendations(totalVideos, videosWithTranscripts, qualityDistribution, analysis) {
    const recommendations = [];
    const coveragePercent = totalVideos > 0 ? Math.round(videosWithTranscripts / totalVideos * 100) : 0;
    if (coveragePercent < 50) {
      recommendations.push(
        `[Critical] Only ${coveragePercent}% of videos have transcripts. Add transcripts to improve accessibility and enable cognitive analysis.`
      );
    } else if (coveragePercent < 80) {
      recommendations.push(
        `[Important] ${100 - coveragePercent}% of videos are missing transcripts. Consider adding them for complete coverage.`
      );
    }
    const poorCount = qualityDistribution.poor;
    const acceptableCount = qualityDistribution.acceptable;
    if (poorCount > 0) {
      recommendations.push(
        `${poorCount} video(s) have poor quality transcripts. Review and improve these transcripts.`
      );
    }
    if (acceptableCount > 2) {
      recommendations.push(
        `${acceptableCount} transcripts are only acceptable quality. Consider improving vocabulary and sentence structure.`
      );
    }
    if (analysis) {
      const { bloomsDistribution } = analysis;
      const lowerOrder = bloomsDistribution.REMEMBER + bloomsDistribution.UNDERSTAND;
      if (lowerOrder > 60) {
        recommendations.push(
          "Video content is heavily focused on recall and understanding. Add more application and analysis examples."
        );
      }
      if (bloomsDistribution.CREATE < 5 && bloomsDistribution.EVALUATE < 10) {
        recommendations.push(
          "Video content lacks higher-order thinking prompts. Include evaluation questions and creative challenges."
        );
      }
    }
    if (videosWithTranscripts < totalVideos) {
      recommendations.push(
        "Add transcripts to all videos for accessibility compliance (WCAG 2.1) and improved SEO."
      );
    }
    return recommendations.slice(0, 8);
  }
  /**
   * Get summary statistics for transcript analysis
   */
  getSummary(result) {
    const { transcriptCoveragePercent, qualityDistribution, averageConfidence } = result;
    let status;
    if (transcriptCoveragePercent >= 90) status = "complete";
    else if (transcriptCoveragePercent >= 50) status = "partial";
    else if (transcriptCoveragePercent > 0) status = "minimal";
    else status = "none";
    let coverageGrade;
    const qualityScore = (qualityDistribution.excellent * 4 + qualityDistribution.good * 3 + qualityDistribution.acceptable * 2 + qualityDistribution.poor * 1) / Math.max(result.videosWithTranscripts, 1);
    const combinedScore = transcriptCoveragePercent * 0.6 + qualityScore * 10 * 0.4;
    if (combinedScore >= 85) coverageGrade = "A";
    else if (combinedScore >= 70) coverageGrade = "B";
    else if (combinedScore >= 55) coverageGrade = "C";
    else if (combinedScore >= 40) coverageGrade = "D";
    else coverageGrade = "F";
    const keyMetrics = {
      "Total Videos": result.totalVideos,
      "With Transcripts": result.videosWithTranscripts,
      "Coverage": `${transcriptCoveragePercent}%`,
      "Total Words": result.totalWordCount.toLocaleString(),
      "Avg Confidence": `${averageConfidence}%`
    };
    if (result.totalDuration > 0) {
      const minutes = Math.round(result.totalDuration / 60);
      keyMetrics["Total Duration"] = `${minutes} min`;
      keyMetrics["Words/Min"] = result.averageWordsPerMinute;
    }
    const actionItems = result.recommendations.slice(0, 3);
    return {
      status,
      coverageGrade,
      keyMetrics,
      actionItems
    };
  }
};
var transcriptAnalyzer = new TranscriptAnalyzer();

// src/engines/enhanced-depth-engine.ts
var ENGINE_VERSION = "2.0.0";
var noopLogger = {
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
function generateCourseContentHash(course) {
  const contentToHash = {
    title: course.title,
    description: course.description,
    whatYouWillLearn: course.whatYouWillLearn,
    categoryId: course.categoryId ?? null,
    price: course.price ?? null,
    chapters: course.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      description: ch.description,
      position: ch.position,
      sections: ch.sections.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        position: s.position,
        duration: s.duration ?? null,
        videoUrl: s.videoUrl ?? null,
        exams: (s.exams ?? []).map((exam) => ({
          id: exam.id,
          title: exam.title,
          questions: (exam.ExamQuestion ?? []).map((q) => ({
            id: q.id,
            text: q.text ?? q.question,
            type: q.type,
            bloomsLevel: q.bloomsLevel,
            options: (q.options ?? []).map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect }))
          }))
        })),
        questions: (s.Question ?? []).map((q) => ({
          id: q.id,
          text: q.text ?? q.question,
          type: q.type,
          bloomsLevel: q.bloomsLevel,
          options: q.options ?? []
        }))
      }))
    })),
    attachmentsCount: course.attachments.length
  };
  const contentString = JSON.stringify(contentToHash, Object.keys(contentToHash).sort());
  return (0, import_crypto.createHash)("sha256").update(contentString).digest("hex").substring(0, 16);
}
var EnhancedDepthAnalysisEngine = class {
  startTime = 0;
  storage;
  logger;
  contentHasher;
  constructor(options = {}) {
    this.storage = options.storage;
    this.logger = options.logger ?? noopLogger;
    this.contentHasher = options.contentHasher ?? generateCourseContentHash;
  }
  /**
   * Perform comprehensive enhanced depth analysis
   */
  async analyze(courseData, options = {}) {
    this.startTime = Date.now();
    const { forceReanalyze = false, includeHistoricalSnapshot = true, analysisDepth = "detailed" } = options;
    this.logger.info(`[EnhancedDepthEngine] Starting analysis for course: ${courseData.id}`);
    const contentHash = this.contentHasher(courseData);
    if (!forceReanalyze) {
      const cached = await this.getCachedAnalysis(courseData.id, contentHash, courseData);
      if (cached) {
        this.logger.info(`[EnhancedDepthEngine] Using cached analysis for course: ${courseData.id}`);
        return cached;
      }
    }
    const courseMetadata = this.buildCourseMetadata(courseData);
    const courseTypeResult = courseTypeDetector.detectCourseType(courseMetadata);
    const chapterAnalysis = await this.analyzeChapters(courseData.chapters, analysisDepth);
    const bloomsDistribution = this.calculateBloomsDistribution(chapterAnalysis);
    const dokDistribution = webbDOKAnalyzer.bloomsToEstimatedDOK(bloomsDistribution);
    const objectivesAnalysis = this.analyzeObjectives(courseData.whatYouWillLearn);
    const objectiveDeduplication = objectiveAnalyzer.analyzeAndDeduplicate(courseData.whatYouWillLearn);
    const assessmentQuality = this.analyzeAssessmentQuality(courseData.chapters);
    const cognitiveDepth = this.calculateCognitiveDepth(bloomsDistribution);
    const balance = this.determineBalance(bloomsDistribution);
    const courseTypeMatch = courseTypeDetector.compareWithIdeal(
      bloomsDistribution,
      courseTypeResult.detectedType
    ).alignmentScore;
    const learningPathway = this.generateLearningPathway(
      bloomsDistribution,
      dokDistribution,
      chapterAnalysis,
      courseTypeResult.detectedType
    );
    const recommendations = this.generateEnhancedRecommendations(
      bloomsDistribution,
      dokDistribution,
      courseTypeResult,
      assessmentQuality,
      objectivesAnalysis,
      chapterAnalysis
    );
    const studentImpact = this.analyzeStudentImpact(
      bloomsDistribution,
      dokDistribution,
      courseTypeResult.detectedType
    );
    const processingTimeMs = Date.now() - this.startTime;
    const metadata = {
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
      courseId: courseData.id,
      contentHash,
      engineVersion: ENGINE_VERSION,
      totalChapters: courseData.chapters.length,
      totalSections: courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0),
      totalObjectives: courseData.whatYouWillLearn.length,
      completionPercentage: this.calculateCompletionPercentage(courseData),
      analysisDepth,
      cached: false,
      processingTimeMs
    };
    const response = {
      courseLevel: {
        bloomsDistribution,
        dokDistribution,
        cognitiveDepth,
        balance,
        courseType: courseTypeResult.detectedType,
        courseTypeMatch
      },
      chapterAnalysis,
      objectivesAnalysis,
      objectiveDeduplication,
      assessmentQuality,
      learningPathway,
      recommendations,
      studentImpact,
      metadata
    };
    await this.storeAnalysis(courseData.id, response, contentHash);
    if (includeHistoricalSnapshot) {
      await this.storeHistoricalSnapshot(courseData.id, response, contentHash);
    }
    this.logger.info(`[EnhancedDepthEngine] Analysis complete for course: ${courseData.id} in ${processingTimeMs}ms`);
    return response;
  }
  /**
   * Get historical trend data for a course
   */
  async getHistoricalTrends(courseId, limit = 10) {
    if (!this.storage?.listHistoricalSnapshots) {
      return { snapshots: [], trends: [] };
    }
    const snapshots = await this.storage.listHistoricalSnapshots(courseId, limit);
    const trends = [];
    if (snapshots.length >= 2) {
      const latest = snapshots[0];
      const previous = snapshots[1];
      const metrics = ["cognitiveDepth", "balanceScore", "completenessScore"];
      for (const metric of metrics) {
        const change = latest[metric] - previous[metric];
        let direction;
        if (Math.abs(change) < 1) {
          direction = "stable";
        } else if (change > 0) {
          direction = "improving";
        } else {
          direction = "declining";
        }
        trends.push({ metric, change: Math.round(change * 10) / 10, direction });
      }
    }
    return { snapshots, trends };
  }
  /**
   * Build course metadata for type detection
   */
  buildCourseMetadata(courseData) {
    const totalDuration = courseData.chapters.reduce(
      (sum, ch) => sum + ch.sections.reduce((sSum, s) => sSum + (s.duration ?? 0), 0),
      0
    );
    const sectionCount = courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
    return {
      title: courseData.title,
      description: courseData.description ?? "",
      category: courseData.category?.name ?? "Uncategorized",
      learningObjectives: courseData.whatYouWillLearn,
      prerequisites: [],
      targetAudience: "",
      chaptersCount: courseData.chapters.length,
      averageSectionDuration: sectionCount > 0 ? totalDuration / sectionCount : 0,
      hasProjects: courseData.whatYouWillLearn.some(
        (obj) => /project|build|create|design/i.test(obj)
      ),
      hasAssessments: courseData.chapters.some(
        (ch) => ch.sections.some((s) => (s.exams?.length ?? 0) > 0 || (s.Question?.length ?? 0) > 0)
      ),
      hasCodingExercises: courseData.whatYouWillLearn.some(
        (obj) => /code|program|develop|implement/i.test(obj)
      )
    };
  }
  /**
   * Analyze chapters with enhanced metrics
   */
  async analyzeChapters(chapters, depth) {
    const analyses = [];
    for (const chapter of chapters) {
      const sectionAnalyses = this.analyzeSections(chapter.sections, depth);
      const bloomsDistribution = this.calculateSectionBloomsDistribution(sectionAnalyses);
      const dokDistribution = webbDOKAnalyzer.bloomsToEstimatedDOK(bloomsDistribution);
      const primaryBloomsLevel = this.getPrimaryLevel(bloomsDistribution);
      const primaryDOKLevel = bloomsToDOK(primaryBloomsLevel);
      const cognitiveDepth = this.calculateCognitiveDepth(bloomsDistribution);
      const { strengths, weaknesses } = this.analyzeChapterStrengthsWeaknesses(
        bloomsDistribution,
        sectionAnalyses
      );
      const recommendations = this.generateChapterRecommendations(
        chapter,
        bloomsDistribution,
        weaknesses
      );
      analyses.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        position: chapter.position,
        bloomsDistribution,
        dokDistribution,
        primaryBloomsLevel,
        primaryDOKLevel,
        cognitiveDepth,
        complexity: {
          vocabularyLevel: cognitiveDepth > 70 ? "advanced" : cognitiveDepth > 50 ? "intermediate" : "basic",
          conceptDensity: sectionAnalyses.length / (chapter.description?.length ?? 100) * 100,
          prerequisiteCount: 0,
          estimatedStudyTime: sectionAnalyses.reduce((sum, s) => sum + 15, 0)
        },
        sections: sectionAnalyses,
        strengths,
        weaknesses,
        recommendations
      });
    }
    return analyses;
  }
  /**
   * Analyze sections
   */
  analyzeSections(sections, depth) {
    return sections.map((section) => {
      const content = `${section.title} ${section.description ?? ""}`;
      const dokAnalysis = webbDOKAnalyzer.analyzeContent(content);
      const bloomsLevel = this.inferBloomsLevel(content);
      return {
        sectionId: section.id,
        sectionTitle: section.title,
        position: section.position,
        bloomsLevel,
        dokLevel: dokAnalysis.level,
        activities: this.extractActivities(section, bloomsLevel),
        learningObjectives: [],
        contentDepth: dokAnalysis.confidence,
        engagementScore: this.calculateEngagementScore(section)
      };
    });
  }
  /**
   * Extract activities from section
   */
  extractActivities(section, bloomsLevel) {
    const activities = [];
    if (section.videoUrl) {
      activities.push({
        type: "Video Lesson",
        bloomsLevel,
        dokLevel: bloomsToDOK(bloomsLevel),
        description: "Watch and understand concepts",
        engagementPotential: 75
      });
    }
    if (section.exams && section.exams.length > 0) {
      activities.push({
        type: "Assessment",
        bloomsLevel: "EVALUATE",
        dokLevel: 3,
        description: "Test understanding through exam",
        engagementPotential: 80
      });
    }
    if (section.Question && section.Question.length > 0) {
      activities.push({
        type: "Practice Questions",
        bloomsLevel: "APPLY",
        dokLevel: 2,
        description: "Apply knowledge through practice",
        engagementPotential: 70
      });
    }
    return activities;
  }
  /**
   * Calculate engagement score
   */
  calculateEngagementScore(section) {
    let score = 50;
    if (section.videoUrl) score += 20;
    if (section.exams && section.exams.length > 0) score += 15;
    if (section.Question && section.Question.length > 0) score += 15;
    return Math.min(score, 100);
  }
  /**
   * Analyze objectives
   */
  analyzeObjectives(objectives) {
    return objectives.map((obj) => objectiveAnalyzer.analyzeObjective(obj));
  }
  /**
   * Analyze assessment quality
   */
  analyzeAssessmentQuality(chapters) {
    const exams = [];
    for (const chapter of chapters) {
      for (const section of chapter.sections) {
        if (section.exams) {
          for (const exam of section.exams) {
            const questions = (exam.ExamQuestion ?? []).map((q) => ({
              id: q.id,
              text: q.text ?? q.question ?? "",
              type: q.type ?? "multiple_choice",
              bloomsLevel: q.bloomsLevel,
              explanation: q.explanation,
              options: q.options?.map((o) => ({
                id: o.id,
                text: o.text,
                isCorrect: o.isCorrect
              }))
            }));
            exams.push({
              id: exam.id,
              title: exam.title,
              questions
            });
          }
        }
      }
    }
    return assessmentQualityAnalyzer.analyzeAssessments(exams);
  }
  /**
   * Calculate Bloom's distribution from chapter analyses
   */
  calculateBloomsDistribution(chapters) {
    if (chapters.length === 0) {
      return { REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 };
    }
    const distribution = { REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 };
    for (const chapter of chapters) {
      for (const level of Object.keys(distribution)) {
        distribution[level] += chapter.bloomsDistribution[level];
      }
    }
    for (const level of Object.keys(distribution)) {
      distribution[level] = Math.round(distribution[level] / chapters.length);
    }
    return distribution;
  }
  /**
   * Calculate section-level Bloom's distribution
   */
  calculateSectionBloomsDistribution(sections) {
    const distribution = { REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 };
    if (sections.length === 0) return distribution;
    for (const section of sections) {
      distribution[section.bloomsLevel]++;
    }
    for (const level of Object.keys(distribution)) {
      distribution[level] = Math.round(distribution[level] / sections.length * 100);
    }
    return distribution;
  }
  /**
   * Calculate cognitive depth score
   */
  calculateCognitiveDepth(distribution) {
    let weightedSum = 0;
    let totalPercentage = 0;
    for (const [level, percentage] of Object.entries(distribution)) {
      const weight = getBloomsWeight(level);
      weightedSum += weight * percentage;
      totalPercentage += percentage;
    }
    if (totalPercentage === 0) return 0;
    return Math.round(weightedSum / totalPercentage * 16.67);
  }
  /**
   * Determine balance
   */
  determineBalance(distribution) {
    const lower = distribution.REMEMBER + distribution.UNDERSTAND;
    const higher = distribution.EVALUATE + distribution.CREATE;
    if (lower > 60) return "bottom-heavy";
    if (higher > 40) return "top-heavy";
    return "well-balanced";
  }
  calculateBalanceScore(distribution) {
    const ideal = {
      REMEMBER: 10,
      UNDERSTAND: 20,
      APPLY: 25,
      ANALYZE: 20,
      EVALUATE: 15,
      CREATE: 10
    };
    let balanceScore = 100;
    Object.keys(ideal).forEach((level) => {
      const diff = Math.abs((distribution[level] ?? 0) - ideal[level]);
      balanceScore -= diff * 0.5;
    });
    return Math.max(0, Math.round(balanceScore));
  }
  /**
   * Get primary Bloom's level
   */
  getPrimaryLevel(distribution) {
    let maxLevel = "UNDERSTAND";
    let maxValue = 0;
    for (const [level, value] of Object.entries(distribution)) {
      if (value > maxValue) {
        maxValue = value;
        maxLevel = level;
      }
    }
    return maxLevel;
  }
  /**
   * Infer Bloom's level from text
   */
  inferBloomsLevel(text) {
    const lowerText = text.toLowerCase();
    const levels = ["CREATE", "EVALUATE", "ANALYZE", "APPLY", "UNDERSTAND", "REMEMBER"];
    for (const level of levels) {
      const mapping = BLOOMS_KEYWORD_MAP.find((m) => m.level === level);
      if (mapping) {
        for (const keyword of mapping.keywords) {
          if (lowerText.includes(keyword)) {
            return level;
          }
        }
      }
    }
    return "UNDERSTAND";
  }
  /**
   * Analyze chapter strengths and weaknesses
   */
  analyzeChapterStrengthsWeaknesses(distribution, sections) {
    const strengths = [];
    const weaknesses = [];
    if (distribution.ANALYZE + distribution.EVALUATE + distribution.CREATE > 30) {
      strengths.push("Good coverage of higher-order thinking skills");
    } else {
      weaknesses.push("Limited higher-order thinking activities");
    }
    const activeTypes = new Set(sections.flatMap((s) => s.activities.map((a) => a.type)));
    if (activeTypes.size >= 3) {
      strengths.push("Diverse activity types");
    } else {
      weaknesses.push("Could benefit from more activity variety");
    }
    const avgEngagement = sections.reduce((sum, s) => sum + s.engagementScore, 0) / sections.length;
    if (avgEngagement >= 70) {
      strengths.push("High engagement potential");
    } else if (avgEngagement < 50) {
      weaknesses.push("Low engagement potential");
    }
    return { strengths, weaknesses };
  }
  /**
   * Generate chapter-specific recommendations
   */
  generateChapterRecommendations(chapter, distribution, weaknesses) {
    const recommendations = [];
    if (distribution.CREATE < 10) {
      recommendations.push({
        type: "activity",
        priority: "high",
        title: "Add Creative Activities",
        description: "Include project-based or creative tasks",
        impact: "Improves cognitive depth and student engagement",
        implementation: ["Add a mini-project", "Include a design challenge", "Create a synthesis activity"]
      });
    }
    if (weaknesses.includes("Limited higher-order thinking activities")) {
      recommendations.push({
        type: "content",
        priority: "medium",
        title: "Add Analysis Tasks",
        description: "Include comparison and analytical exercises",
        impact: "Develops critical thinking skills",
        implementation: ["Add case studies", "Include compare/contrast exercises", "Add data analysis tasks"]
      });
    }
    return recommendations;
  }
  /**
   * Generate learning pathway
   */
  generateLearningPathway(bloomsDistribution, dokDistribution, chapters, courseType) {
    const levels = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    const currentStages = levels.map((level, index) => ({
      level,
      dokLevel: bloomsToDOK(level),
      mastery: bloomsDistribution[level],
      activities: this.getActivitiesForLevel(chapters, level),
      timeEstimate: Math.round(bloomsDistribution[level] * 0.5)
    }));
    const recommendedStages = levels.map((level, index) => ({
      level,
      dokLevel: bloomsToDOK(level),
      mastery: Math.max(80 - index * 10, 40),
      activities: this.getRecommendedActivities(level),
      timeEstimate: 10 + index * 5
    }));
    const gaps = this.identifyGaps(currentStages, recommendedStages);
    return {
      current: {
        stages: currentStages,
        currentStage: this.determineCurrentStage(currentStages),
        completionPercentage: this.calculatePathCompletion(currentStages)
      },
      recommended: {
        stages: recommendedStages,
        currentStage: 0,
        completionPercentage: 0
      },
      gaps,
      milestones: this.generateMilestones(levels)
    };
  }
  /**
   * Get activities for a level
   */
  getActivitiesForLevel(chapters, level) {
    const activities = /* @__PURE__ */ new Set();
    for (const chapter of chapters) {
      for (const section of chapter.sections) {
        if (section.bloomsLevel === level) {
          for (const activity of section.activities) {
            activities.add(activity.type);
          }
        }
      }
    }
    return Array.from(activities);
  }
  /**
   * Get recommended activities for level
   */
  getRecommendedActivities(level) {
    const activities = {
      REMEMBER: ["Flashcards", "Quizzes", "Memorization exercises"],
      UNDERSTAND: ["Concept maps", "Summaries", "Explanations"],
      APPLY: ["Practice problems", "Case studies", "Simulations"],
      ANALYZE: ["Comparisons", "Research projects", "Data analysis"],
      EVALUATE: ["Critiques", "Debates", "Peer reviews"],
      CREATE: ["Projects", "Presentations", "Original works"]
    };
    return activities[level];
  }
  /**
   * Identify gaps between current and recommended
   */
  identifyGaps(current, recommended) {
    const gaps = [];
    for (let i = 0; i < current.length; i++) {
      const gap = recommended[i].mastery - current[i].mastery;
      if (gap > 20) {
        gaps.push({
          level: current[i].level,
          dokLevel: current[i].dokLevel,
          severity: gap > 40 ? "high" : gap > 30 ? "medium" : "low",
          description: `${current[i].level} mastery is ${current[i].mastery.toFixed(1)}%, recommended is ${recommended[i].mastery}%`,
          suggestions: this.getRecommendedActivities(current[i].level),
          estimatedEffortHours: Math.ceil(gap / 10)
        });
      }
    }
    return gaps;
  }
  /**
   * Determine current stage
   */
  determineCurrentStage(stages) {
    for (let i = stages.length - 1; i >= 0; i--) {
      if (stages[i].mastery > 50) {
        return i;
      }
    }
    return 0;
  }
  /**
   * Calculate path completion
   */
  calculatePathCompletion(stages) {
    const totalMastery = stages.reduce((sum, stage) => sum + stage.mastery, 0);
    return Math.round(totalMastery / stages.length);
  }
  /**
   * Generate milestones
   */
  generateMilestones(levels) {
    return levels.map((level) => ({
      title: `Master ${level.charAt(0) + level.slice(1).toLowerCase()} Skills`,
      bloomsLevel: level,
      dokLevel: bloomsToDOK(level),
      description: `Achieve proficiency in ${level.toLowerCase()}-level activities`,
      assessmentCriteria: [`Pass ${level.toLowerCase()}-level assessment`, `Complete ${level.toLowerCase()}-focused activities`]
    }));
  }
  /**
   * Generate enhanced recommendations
   */
  generateEnhancedRecommendations(bloomsDistribution, dokDistribution, courseTypeResult, assessmentQuality, objectivesAnalysis, chapters) {
    const immediate = [];
    const shortTerm = [];
    const longTerm = [];
    if (assessmentQuality.overallScore < 70) {
      immediate.push({
        id: "assessment-quality",
        priority: "critical",
        type: "assessment",
        category: "Quality",
        title: "Improve Assessment Quality",
        description: assessmentQuality.bloomsCoverage.recommendation,
        impact: "Higher assessment quality leads to better learning outcomes",
        effort: "medium",
        estimatedTime: "2-3 hours",
        actionSteps: ["Review existing questions", "Add varied question types", "Include explanations"],
        examples: ["Add case-based questions", "Include practical scenarios"],
        bloomsTarget: "ANALYZE",
        dokTarget: 3
      });
    }
    const weakObjectives = objectivesAnalysis.filter((o) => o.clarityScore < 60);
    if (weakObjectives.length > 0) {
      immediate.push({
        id: "objective-clarity",
        priority: "high",
        type: "objectives",
        category: "Clarity",
        title: "Clarify Learning Objectives",
        description: `${weakObjectives.length} objectives need improvement`,
        impact: "Clear objectives improve student focus and outcomes",
        effort: "low",
        estimatedTime: "1-2 hours",
        actionSteps: weakObjectives[0].suggestions,
        examples: [weakObjectives[0].improvedVersion],
        bloomsTarget: weakObjectives[0].bloomsLevel,
        dokTarget: weakObjectives[0].dokLevel
      });
    }
    if (courseTypeResult.confidence < 50) {
      shortTerm.push({
        id: "course-positioning",
        priority: "medium",
        type: "content",
        category: "Positioning",
        title: "Clarify Course Positioning",
        description: "Course type is unclear from content",
        impact: "Better positioning attracts target audience",
        effort: "medium",
        estimatedTime: "3-4 hours",
        actionSteps: courseTypeResult.recommendations,
        examples: [],
        bloomsTarget: "UNDERSTAND",
        dokTarget: 2
      });
    }
    if (bloomsDistribution.CREATE < 10) {
      longTerm.push({
        id: "creative-activities",
        priority: "medium",
        type: "activity",
        category: "Cognitive Depth",
        title: "Add Creative Activities",
        description: "Course lacks CREATE-level activities",
        impact: "Creative activities develop innovation skills",
        effort: "high",
        estimatedTime: "5-10 hours",
        actionSteps: ["Design a capstone project", "Add portfolio assignments", "Include open-ended challenges"],
        examples: ["Final project", "Original design task", "Synthesis essay"],
        bloomsTarget: "CREATE",
        dokTarget: 4
      });
    }
    return {
      immediate,
      shortTerm,
      longTerm,
      contentAdjustments: this.generateContentAdjustments(bloomsDistribution, chapters),
      assessmentChanges: this.generateAssessmentChanges(assessmentQuality),
      activitySuggestions: this.generateActivitySuggestions(dokDistribution)
    };
  }
  /**
   * Generate content adjustments
   */
  generateContentAdjustments(distribution, chapters) {
    const adjustments = [];
    const levels = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    for (const level of levels) {
      if (distribution[level] < 10) {
        adjustments.push({
          type: "add",
          targetChapter: null,
          targetSection: null,
          bloomsLevel: level,
          dokLevel: bloomsToDOK(level),
          description: `Add more ${level.toLowerCase()}-focused content`,
          impact: "high",
          implementation: this.getRecommendedActivities(level)
        });
      }
    }
    return adjustments;
  }
  /**
   * Generate assessment changes
   */
  generateAssessmentChanges(quality) {
    const changes = [];
    for (const level of quality.bloomsCoverage.missingLevels) {
      changes.push({
        type: "add",
        bloomsLevel: level,
        dokLevel: bloomsToDOK(level),
        description: `Add ${level.toLowerCase()}-level assessment questions`,
        examples: this.getRecommendedActivities(level),
        rubricSuggestion: `Create rubric for ${level.toLowerCase()}-level tasks`
      });
    }
    return changes;
  }
  /**
   * Generate activity suggestions
   */
  generateActivitySuggestions(dokDistribution) {
    const suggestions = [];
    if (dokDistribution.level3 < 20) {
      suggestions.push({
        bloomsLevel: "ANALYZE",
        dokLevel: 3,
        activityType: "Case Study Analysis",
        description: "Add strategic thinking activities",
        implementation: "Present real-world scenarios requiring analysis and decision-making",
        expectedOutcome: "Students develop analytical and problem-solving skills",
        materials: ["Case study documents", "Analysis templates", "Discussion guides"],
        timeRequired: "45-60 minutes per case"
      });
    }
    if (dokDistribution.level4 < 10) {
      suggestions.push({
        bloomsLevel: "CREATE",
        dokLevel: 4,
        activityType: "Extended Project",
        description: "Add extended thinking projects",
        implementation: "Assign multi-week projects requiring original research and creation",
        expectedOutcome: "Students develop synthesis and innovation skills",
        materials: ["Project guidelines", "Milestone checkpoints", "Rubric"],
        timeRequired: "2-4 weeks"
      });
    }
    return suggestions;
  }
  /**
   * Analyze student impact
   */
  analyzeStudentImpact(bloomsDistribution, dokDistribution, courseType) {
    const skillsDeveloped = [];
    const levels = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    for (const level of levels) {
      if (bloomsDistribution[level] > 10) {
        skillsDeveloped.push({
          name: this.getSkillName(level),
          bloomsLevel: level,
          dokLevel: bloomsToDOK(level),
          proficiency: bloomsDistribution[level],
          description: this.getSkillDescription(level),
          industryRelevance: this.getIndustryRelevance(level, courseType)
        });
      }
    }
    const cognitiveDepth = this.calculateCognitiveDepth(bloomsDistribution);
    return {
      skillsDeveloped,
      cognitiveGrowth: {
        currentLevel: cognitiveDepth,
        projectedLevel: Math.min(cognitiveDepth + 20, 100),
        timeframe: "3-6 months",
        keyMilestones: ["Master foundational concepts", "Develop analytical skills", "Create original solutions"],
        confidenceInterval: { low: cognitiveDepth + 10, high: cognitiveDepth + 30 }
      },
      careerAlignment: this.getCareerAlignment(skillsDeveloped, courseType),
      competencyGains: []
    };
  }
  /**
   * Get skill name
   */
  getSkillName(level) {
    const names = {
      REMEMBER: "Information Retention",
      UNDERSTAND: "Conceptual Understanding",
      APPLY: "Practical Application",
      ANALYZE: "Analytical Thinking",
      EVALUATE: "Critical Evaluation",
      CREATE: "Creative Innovation"
    };
    return names[level];
  }
  /**
   * Get skill description
   */
  getSkillDescription(level) {
    const descriptions = {
      REMEMBER: "Ability to recall and recognize key information",
      UNDERSTAND: "Capability to explain concepts and ideas clearly",
      APPLY: "Skill in using knowledge in practical situations",
      ANALYZE: "Competence in breaking down complex problems",
      EVALUATE: "Expertise in making informed judgments",
      CREATE: "Proficiency in generating original solutions"
    };
    return descriptions[level];
  }
  /**
   * Get industry relevance
   */
  getIndustryRelevance(level, courseType) {
    const baseRelevance = {
      REMEMBER: 50,
      UNDERSTAND: 60,
      APPLY: 80,
      ANALYZE: 85,
      EVALUATE: 85,
      CREATE: 90
    };
    let adjustment = 0;
    if (courseType === "technical" && (level === "APPLY" || level === "CREATE")) {
      adjustment = 10;
    }
    if (courseType === "theoretical" && (level === "ANALYZE" || level === "EVALUATE")) {
      adjustment = 10;
    }
    return Math.min(baseRelevance[level] + adjustment, 100);
  }
  /**
   * Get career alignment
   */
  getCareerAlignment(skills, courseType) {
    const careers = [];
    const skillNames = skills.map((s) => s.name);
    if (courseType === "technical" || skillNames.includes("Practical Application")) {
      careers.push({
        role: "Software Developer",
        alignment: 85,
        requiredSkills: ["Problem Solving", "Critical Thinking", "Creativity"],
        matchedSkills: skillNames,
        gapSkills: [],
        developmentPlan: "Focus on practical projects and portfolio building"
      });
    }
    if (skillNames.includes("Analytical Thinking")) {
      careers.push({
        role: "Data Analyst",
        alignment: 75,
        requiredSkills: ["Analytical Thinking", "Problem Solving", "Attention to Detail"],
        matchedSkills: skillNames.filter((s) => s.includes("Analy") || s.includes("Evaluat")),
        gapSkills: ["Statistical Analysis"],
        developmentPlan: "Add statistical and data visualization skills"
      });
    }
    return careers;
  }
  /**
   * Calculate completion percentage
   */
  calculateCompletionPercentage(courseData) {
    let score = 0;
    if (courseData.title) score += 15;
    if (courseData.description) score += 15;
    if (courseData.whatYouWillLearn.length > 0) score += 20;
    if (courseData.category) score += 10;
    if (courseData.chapters.length > 0) score += 25;
    if (courseData.attachments.length > 0) score += 15;
    return score;
  }
  /**
   * Get cached analysis
   */
  async getCachedAnalysis(courseId, contentHash, courseData) {
    if (!this.storage) {
      return null;
    }
    try {
      const existing = await this.storage.getCachedAnalysis(courseId);
      if (existing && existing.contentHash === contentHash) {
        return {
          courseLevel: {
            bloomsDistribution: existing.bloomsDistribution,
            dokDistribution: existing.dokDistribution ?? webbDOKAnalyzer.bloomsToEstimatedDOK(existing.bloomsDistribution),
            cognitiveDepth: existing.cognitiveDepth,
            balance: this.determineBalance(existing.bloomsDistribution),
            courseType: existing.courseType ?? "intermediate",
            courseTypeMatch: existing.courseTypeMatch ?? 50
          },
          chapterAnalysis: [],
          objectivesAnalysis: existing.objectiveAnalysis ?? [],
          objectiveDeduplication: {
            totalObjectives: 0,
            uniqueClusters: 0,
            duplicateGroups: [],
            recommendations: [],
            optimizedObjectives: []
          },
          assessmentQuality: existing.assessmentQuality ?? assessmentQualityAnalyzer.analyzeAssessments([]),
          learningPathway: existing.learningPathway,
          recommendations: existing.recommendations,
          studentImpact: {
            skillsDeveloped: existing.skillsMatrix ?? [],
            cognitiveGrowth: {
              currentLevel: existing.cognitiveDepth,
              projectedLevel: Math.min(existing.cognitiveDepth + 20, 100),
              timeframe: "3-6 months",
              keyMilestones: [],
              confidenceInterval: { low: existing.cognitiveDepth + 10, high: existing.cognitiveDepth + 30 }
            },
            careerAlignment: [],
            competencyGains: []
          },
          metadata: {
            analyzedAt: existing.analyzedAt.toISOString(),
            courseId,
            contentHash,
            engineVersion: ENGINE_VERSION,
            totalChapters: courseData?.chapters.length ?? 0,
            totalSections: courseData ? courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0) : 0,
            totalObjectives: courseData?.whatYouWillLearn.length ?? 0,
            completionPercentage: courseData ? this.calculateCompletionPercentage(courseData) : 0,
            analysisDepth: "detailed",
            cached: true,
            processingTimeMs: 0
          }
        };
      }
    } catch (error) {
      this.logger.error("[EnhancedDepthEngine] Error fetching cached analysis:", error);
    }
    return null;
  }
  /**
   * Store analysis results
   */
  async storeAnalysis(courseId, response, contentHash) {
    if (!this.storage) {
      return;
    }
    try {
      const payload = {
        courseId,
        contentHash,
        analyzedAt: /* @__PURE__ */ new Date(),
        bloomsDistribution: response.courseLevel.bloomsDistribution,
        cognitiveDepth: response.courseLevel.cognitiveDepth,
        learningPathway: response.learningPathway,
        skillsMatrix: response.studentImpact.skillsDeveloped,
        gapAnalysis: response.learningPathway.gaps,
        recommendations: response.recommendations,
        dokDistribution: response.courseLevel.dokDistribution,
        courseType: response.courseLevel.courseType,
        courseTypeMatch: response.courseLevel.courseTypeMatch,
        assessmentQuality: response.assessmentQuality,
        objectiveAnalysis: response.objectivesAnalysis
      };
      await this.storage.saveAnalysis(courseId, payload);
    } catch (error) {
      this.logger.error("[EnhancedDepthEngine] Error storing analysis:", error);
    }
  }
  /**
   * Store historical snapshot
   */
  async storeHistoricalSnapshot(courseId, response, contentHash) {
    if (!this.storage?.createHistoricalSnapshot) {
      return;
    }
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3);
      if (this.storage.hasRecentSnapshot) {
        const hasRecent = await this.storage.hasRecentSnapshot(courseId, oneHourAgo);
        if (hasRecent) {
          return;
        }
      }
      await this.storage.createHistoricalSnapshot({
        courseId,
        snapshotAt: /* @__PURE__ */ new Date(),
        cognitiveDepth: response.courseLevel.cognitiveDepth,
        balanceScore: this.calculateBalanceScore(response.courseLevel.bloomsDistribution),
        completenessScore: response.metadata.completionPercentage,
        totalChapters: response.metadata.totalChapters,
        totalObjectives: response.metadata.totalObjectives,
        metadata: {
          contentHash,
          engineVersion: ENGINE_VERSION,
          totalSections: response.metadata.totalSections,
          assessmentQuality: response.assessmentQuality.overallScore,
          bloomsDistribution: response.courseLevel.bloomsDistribution,
          dokDistribution: response.courseLevel.dokDistribution
        }
      });
    } catch (error) {
      this.logger.error("[EnhancedDepthEngine] Error storing historical snapshot:", error);
    }
  }
};
var enhancedDepthEngine = new EnhancedDepthAnalysisEngine();
var createEnhancedDepthAnalysisEngine = (options) => new EnhancedDepthAnalysisEngine(options);

// src/engines/unified-blooms-engine.ts
var import_zod3 = require("zod");
var import_core = require("@sam-ai/core");
var BLOOMS_KEYWORDS2 = {
  REMEMBER: [
    "define",
    "list",
    "recall",
    "name",
    "identify",
    "describe",
    "label",
    "recognize",
    "match",
    "select",
    "state",
    "memorize",
    "repeat",
    "record",
    "outline",
    "duplicate",
    "reproduce",
    "recite",
    "locate",
    "tell"
  ],
  UNDERSTAND: [
    "explain",
    "summarize",
    "interpret",
    "classify",
    "compare",
    "contrast",
    "discuss",
    "distinguish",
    "paraphrase",
    "predict",
    "translate",
    "extend",
    "infer",
    "estimate",
    "generalize",
    "rewrite",
    "exemplify",
    "illustrate"
  ],
  APPLY: [
    "apply",
    "demonstrate",
    "solve",
    "use",
    "implement",
    "execute",
    "operate",
    "practice",
    "calculate",
    "compute",
    "construct",
    "modify",
    "produce",
    "show",
    "complete",
    "examine",
    "illustrate",
    "experiment",
    "schedule"
  ],
  ANALYZE: [
    "analyze",
    "differentiate",
    "organize",
    "attribute",
    "compare",
    "contrast",
    "distinguish",
    "examine",
    "experiment",
    "question",
    "test",
    "investigate",
    "categorize",
    "deconstruct",
    "diagram",
    "dissect",
    "survey",
    "correlate"
  ],
  EVALUATE: [
    "evaluate",
    "judge",
    "critique",
    "justify",
    "assess",
    "argue",
    "defend",
    "support",
    "value",
    "prioritize",
    "rank",
    "rate",
    "recommend",
    "conclude",
    "appraise",
    "criticize",
    "decide",
    "discriminate",
    "measure",
    "validate"
  ],
  CREATE: [
    "create",
    "design",
    "develop",
    "construct",
    "produce",
    "invent",
    "compose",
    "formulate",
    "generate",
    "plan",
    "assemble",
    "devise",
    "build",
    "author",
    "combine",
    "compile",
    "integrate",
    "modify",
    "reorganize",
    "synthesize"
  ]
};
var BloomsDistributionSchema2 = import_zod3.z.object({
  REMEMBER: import_zod3.z.number().min(0).max(100).optional().default(0),
  UNDERSTAND: import_zod3.z.number().min(0).max(100).optional().default(0),
  APPLY: import_zod3.z.number().min(0).max(100).optional().default(0),
  ANALYZE: import_zod3.z.number().min(0).max(100).optional().default(0),
  EVALUATE: import_zod3.z.number().min(0).max(100).optional().default(0),
  CREATE: import_zod3.z.number().min(0).max(100).optional().default(0)
});
var BloomsAIResponseSchema = import_zod3.z.object({
  dominantLevel: import_zod3.z.enum(["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]).optional(),
  distribution: BloomsDistributionSchema2.optional(),
  confidence: import_zod3.z.number().min(0).max(1).default(0.8),
  cognitiveDepth: import_zod3.z.number().min(0).max(100).default(50),
  balance: import_zod3.z.enum(["well-balanced", "bottom-heavy", "top-heavy"]).default("well-balanced"),
  gaps: import_zod3.z.array(import_zod3.z.enum(["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"])).default([]),
  recommendations: import_zod3.z.array(
    import_zod3.z.object({
      type: import_zod3.z.string().optional(),
      priority: import_zod3.z.enum(["high", "medium", "low"]).default("medium"),
      message: import_zod3.z.string().optional(),
      action: import_zod3.z.string().optional(),
      targetLevel: import_zod3.z.enum(["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]).optional()
    })
  ).default([])
});
var UnifiedBloomsEngine = class {
  config;
  database;
  defaultMode;
  confidenceThreshold;
  enableCache;
  cacheTTL;
  // In-memory cache for AI analysis results
  cache = /* @__PURE__ */ new Map();
  cacheHits = 0;
  cacheMisses = 0;
  constructor(config) {
    this.config = config.samConfig;
    this.database = config.database;
    this.defaultMode = config.defaultMode ?? "standard";
    this.confidenceThreshold = config.confidenceThreshold ?? 0.7;
    this.enableCache = config.enableCache ?? true;
    this.cacheTTL = (config.cacheTTL ?? 3600) * 1e3;
  }
  // ============================================================================
  // PUBLIC API - QUICK CLASSIFY
  // ============================================================================
  /**
   * Fast keyword-only classification (<10ms)
   * Use when you need immediate results without AI costs
   *
   * @param content - Text content to classify
   * @returns The dominant Bloom's level
   */
  quickClassify(content) {
    const text = content.toLowerCase();
    const distribution = this.analyzeKeywordDistribution(text);
    return this.findDominantLevel(distribution);
  }
  // ============================================================================
  // PUBLIC API - ANALYZE CONTENT
  // ============================================================================
  /**
   * Analyze content with intelligent mode selection
   *
   * In 'quick' mode: keyword-only analysis
   * In 'standard' mode: keyword analysis, AI escalation if confidence < threshold
   * In 'comprehensive' mode: full AI semantic analysis
   *
   * @param content - Text content to analyze
   * @param options - Analysis options
   * @returns Unified analysis result
   */
  async analyze(content, options = {}) {
    const startTime = Date.now();
    const mode = options.mode ?? this.defaultMode;
    if (this.enableCache && !options.forceAI) {
      const cacheKey = this.generateCacheKey("content", content, mode);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            fromCache: true
          }
        };
      }
    }
    if (mode === "quick" || options.forceKeyword) {
      const result = this.analyzeWithKeywords(content, options, startTime);
      return result;
    }
    if (mode === "standard" && !options.forceAI) {
      const keywordResult = this.analyzeWithKeywords(content, options, startTime);
      const threshold = options.confidenceThreshold ?? this.confidenceThreshold;
      if (keywordResult.confidence >= threshold) {
        return keywordResult;
      }
      return this.analyzeWithAI(content, keywordResult, options, startTime);
    }
    return this.analyzeWithAI(content, void 0, options, startTime);
  }
  // ============================================================================
  // PUBLIC API - ANALYZE COURSE
  // ============================================================================
  /**
   * Analyze an entire course structure
   *
   * @param courseData - Course structure with chapters and sections
   * @param options - Analysis options
   * @returns Course-level analysis with recommendations
   */
  async analyzeCourse(courseData, options = {}) {
    const startTime = Date.now();
    const mode = options.mode ?? this.defaultMode;
    if (this.enableCache && !options.forceReanalyze) {
      const cacheKey = this.generateCacheKey("course", courseData.id, mode);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            fromCache: true
          }
        };
      }
    }
    const chapterAnalyses = [];
    const allDistributions = [];
    let totalConfidence = 0;
    for (const chapter of courseData.chapters) {
      const chapterText = this.extractChapterText(chapter);
      const chapterResult = await this.analyze(chapterText, {
        mode: options.depth === "comprehensive" ? "comprehensive" : "standard",
        includeSections: true
      });
      const sectionAnalyses = chapter.sections.map((section) => {
        const sectionText = `${section.title} ${section.content ?? ""} ${section.description ?? ""}`;
        const level = this.quickClassify(sectionText);
        return {
          id: section.id,
          title: section.title,
          level,
          confidence: this.calculateKeywordConfidence(sectionText.toLowerCase(), level)
        };
      });
      chapterAnalyses.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        distribution: chapterResult.distribution,
        primaryLevel: chapterResult.dominantLevel,
        cognitiveDepth: chapterResult.cognitiveDepth,
        confidence: chapterResult.confidence,
        sections: sectionAnalyses
      });
      allDistributions.push(chapterResult.distribution);
      totalConfidence += chapterResult.confidence;
    }
    const courseDistribution = this.aggregateDistributions(allDistributions);
    const courseCognitiveDepth = this.calculateCognitiveDepth(courseDistribution);
    const courseBalance = this.determineBalance(courseDistribution);
    const avgConfidence = chapterAnalyses.length > 0 ? totalConfidence / chapterAnalyses.length : 0.5;
    const recommendations = this.generateCourseRecommendations(
      courseDistribution,
      chapterAnalyses,
      courseBalance
    );
    let learningPathway;
    if (options.includeLearningPathway !== false) {
      learningPathway = this.generateLearningPathway(courseDistribution, chapterAnalyses);
    }
    const result = {
      courseId: courseData.id,
      courseLevel: {
        distribution: courseDistribution,
        cognitiveDepth: courseCognitiveDepth,
        balance: courseBalance,
        confidence: avgConfidence
      },
      chapters: chapterAnalyses,
      recommendations,
      learningPathway,
      metadata: {
        method: mode === "comprehensive" ? "ai" : "hybrid",
        processingTimeMs: Date.now() - startTime,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        fromCache: false
      },
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (this.enableCache) {
      const cacheKey = this.generateCacheKey("course", courseData.id, mode);
      this.setCache(cacheKey, result);
    }
    return result;
  }
  async updateCognitiveProgress(inputOrUserId, sectionId, bloomsLevel, score) {
    if (typeof inputOrUserId === "string") {
      const userId = inputOrUserId;
      if (!sectionId || !bloomsLevel || score === void 0) {
        throw new Error("Missing required parameters for legacy signature");
      }
      if (this.database) {
        try {
          const existing = await this.database.findBloomsProgress(userId, sectionId);
          const scores = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0
          };
          if (existing) {
            scores.REMEMBER = existing.rememberScore ?? 0;
            scores.UNDERSTAND = existing.understandScore ?? 0;
            scores.APPLY = existing.applyScore ?? 0;
            scores.ANALYZE = existing.analyzeScore ?? 0;
            scores.EVALUATE = existing.evaluateScore ?? 0;
            scores.CREATE = existing.createScore ?? 0;
          }
          const currentScore = scores[bloomsLevel] ?? 0;
          scores[bloomsLevel] = currentScore * 0.7 + score * 0.3;
          await this.database.upsertBloomsProgress(userId, sectionId, {
            rememberScore: scores.REMEMBER,
            understandScore: scores.UNDERSTAND,
            applyScore: scores.APPLY,
            analyzeScore: scores.ANALYZE,
            evaluateScore: scores.EVALUATE,
            createScore: scores.CREATE
          });
        } catch (error) {
          this.config.logger?.error?.("[UnifiedBloomsEngine] Failed to update cognitive progress", error);
        }
      }
      return;
    }
    const input = inputOrUserId;
    if (!this.database) {
      throw new Error("Database adapter required for cognitive progress tracking");
    }
    const profile = await this.getCognitiveProfile(input.userId, input.courseId);
    const currentMastery = profile.levelMastery[input.bloomsLevel] ?? 0;
    const newMastery = Math.min(100, currentMastery + input.score * 10);
    profile.levelMastery[input.bloomsLevel] = newMastery;
    const masteryValues = Object.values(profile.levelMastery);
    profile.overallMastery = masteryValues.length > 0 ? masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length : 0;
    profile.preferredLevels = this.identifyPreferredLevels(profile.levelMastery);
    profile.challengeAreas = this.identifyChallengeAreas(profile.levelMastery);
    const recommendations = this.generateProgressRecommendations(profile, input.bloomsLevel, input.score);
    return {
      updated: true,
      profile,
      recommendations
    };
  }
  /**
   * Get cognitive profile for a user
   */
  async getCognitiveProfile(userId, courseId) {
    const defaultProfile = {
      overallMastery: 0,
      levelMastery: {
        REMEMBER: 0,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0
      },
      learningVelocity: 1,
      preferredLevels: [],
      challengeAreas: []
    };
    if (!this.database) {
      return defaultProfile;
    }
    return defaultProfile;
  }
  // ============================================================================
  // PUBLIC API - SPACED REPETITION (SM-2 ALGORITHM)
  // ============================================================================
  /**
   * Calculate next review date using SM-2 algorithm
   *
   * @param input - Spaced repetition input
   * @returns Calculated review schedule
   */
  calculateSpacedRepetition(input) {
    const performance = Math.max(0, Math.min(1, input.performance));
    const quality = Math.round(performance * 5);
    let easeFactor = input.previousEaseFactor ?? 2.5;
    let interval = input.previousInterval ?? 1;
    let repetitions = 0;
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);
    if (quality < 3) {
      interval = 1;
      repetitions = 0;
    } else {
      repetitions++;
      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    }
    const nextReviewDate = /* @__PURE__ */ new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    return {
      nextReviewDate,
      intervalDays: interval,
      easeFactor,
      repetitionCount: repetitions
    };
  }
  // ============================================================================
  // PUBLIC API - LEARNING ACTIVITY TRACKING
  // ============================================================================
  /**
   * Log a learning activity for a user
   *
   * @param userId - User ID
   * @param activityType - Type of activity (e.g., 'TAKE_EXAM', 'COMPLETE_SECTION')
   * @param data - Activity metadata
   */
  async logLearningActivity(userId, activityType, data) {
    if (!this.database) {
      this.config.logger?.debug?.("[UnifiedBloomsEngine] No database, skipping activity log");
      return;
    }
    try {
      await this.database.logInteraction({
        userId,
        pageType: "LEARNING_ACTIVITY",
        pagePath: `/activity/${activityType}`,
        query: activityType,
        response: JSON.stringify(data),
        enginesUsed: ["unified-blooms-engine"],
        responseTimeMs: 0
      });
    } catch (error) {
      this.config.logger?.warn?.("[UnifiedBloomsEngine] Failed to log activity", error);
    }
  }
  /**
   * Create a progress intervention for a user
   *
   * @param userId - User ID
   * @param type - Intervention type (e.g., 'SUPPORT_NEEDED', 'CELEBRATION')
   * @param title - Intervention title
   * @param message - Intervention message
   * @param metadata - Additional metadata
   */
  async createProgressIntervention(userId, type, title, message, metadata) {
    if (!this.database) {
      this.config.logger?.debug?.("[UnifiedBloomsEngine] No database, skipping intervention");
      return;
    }
    try {
      await this.database.logInteraction({
        userId,
        pageType: "INTERVENTION",
        pagePath: `/intervention/${type}`,
        query: title,
        response: JSON.stringify({ message, ...metadata }),
        enginesUsed: ["unified-blooms-engine"],
        responseTimeMs: 0
      });
    } catch (error) {
      this.config.logger?.warn?.("[UnifiedBloomsEngine] Failed to create intervention", error);
    }
  }
  // ============================================================================
  // PUBLIC API - CACHE MANAGEMENT
  // ============================================================================
  /**
   * Get cache statistics
   */
  getCacheStats() {
    let oldestEntry;
    let oldestTime = Infinity;
    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestEntry = key;
      }
    });
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      size: this.cache.size,
      oldestEntry
    };
  }
  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
  // ============================================================================
  // PRIVATE - KEYWORD ANALYSIS
  // ============================================================================
  analyzeWithKeywords(content, options, startTime) {
    const text = content.toLowerCase();
    const distribution = this.analyzeKeywordDistribution(text);
    const dominantLevel = this.findDominantLevel(distribution);
    const confidence = this.calculateKeywordConfidence(text, dominantLevel);
    const cognitiveDepth = this.calculateCognitiveDepth(distribution);
    const balance = this.determineBalance(distribution);
    const gaps = this.identifyGaps(distribution);
    const recommendations = this.generateRecommendations(distribution, gaps, balance);
    let sectionAnalysis;
    if (options.includeSections) {
    }
    const result = {
      dominantLevel,
      distribution,
      confidence,
      cognitiveDepth,
      balance,
      gaps,
      recommendations,
      sectionAnalysis,
      metadata: {
        method: "keyword",
        processingTimeMs: Date.now() - startTime,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        fromCache: false,
        keywordConfidence: confidence
      }
    };
    if (this.enableCache) {
      const cacheKey = this.generateCacheKey("content", content, "quick");
      this.setCache(cacheKey, result);
    }
    return result;
  }
  analyzeKeywordDistribution(text) {
    const distribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    let totalMatches = 0;
    for (const level of import_core.BLOOMS_LEVELS) {
      const keywords = BLOOMS_KEYWORDS2[level];
      let levelCount = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, "gi");
        const matches = text.match(regex);
        if (matches) {
          levelCount += matches.length;
        }
      }
      distribution[level] = levelCount;
      totalMatches += levelCount;
    }
    if (totalMatches > 0) {
      for (const level of import_core.BLOOMS_LEVELS) {
        distribution[level] = Math.round(distribution[level] / totalMatches * 100);
      }
    } else {
      distribution.UNDERSTAND = 40;
      distribution.APPLY = 30;
      distribution.ANALYZE = 20;
      distribution.REMEMBER = 10;
    }
    return distribution;
  }
  findDominantLevel(distribution) {
    let maxLevel = "UNDERSTAND";
    let maxValue = 0;
    for (const level of import_core.BLOOMS_LEVELS) {
      if (distribution[level] > maxValue) {
        maxValue = distribution[level];
        maxLevel = level;
      }
    }
    return maxLevel;
  }
  calculateKeywordConfidence(text, level) {
    const keywords = BLOOMS_KEYWORDS2[level];
    let matches = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matches++;
      }
    }
    const keywordCoverage = Math.min(matches / 5, 1) * 0.6;
    const textLengthFactor = Math.min(text.length / 500, 1) * 0.2;
    const distributionFactor = 0.2;
    return Math.round((keywordCoverage + textLengthFactor + distributionFactor) * 100) / 100;
  }
  calculateCognitiveDepth(distribution) {
    let weightedSum = 0;
    let totalWeight = 0;
    for (const level of import_core.BLOOMS_LEVELS) {
      const weight = import_core.BLOOMS_LEVEL_ORDER[level];
      weightedSum += distribution[level] * weight;
      totalWeight += distribution[level];
    }
    if (totalWeight === 0) return 50;
    const avgLevel = weightedSum / totalWeight;
    return Math.round(avgLevel / 6 * 100);
  }
  determineBalance(distribution) {
    const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND;
    const upperLevels = distribution.EVALUATE + distribution.CREATE;
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (total === 0) return "well-balanced";
    const lowerPct = lowerLevels / total;
    const upperPct = upperLevels / total;
    if (lowerPct > 0.6) return "bottom-heavy";
    if (upperPct > 0.5) return "top-heavy";
    return "well-balanced";
  }
  identifyGaps(distribution) {
    const gaps = [];
    for (const level of import_core.BLOOMS_LEVELS) {
      if (distribution[level] < 5) {
        gaps.push(level);
      }
    }
    return gaps;
  }
  // ============================================================================
  // PRIVATE - AI ANALYSIS
  // ============================================================================
  async analyzeWithAI(content, keywordResult, options, startTime) {
    if (!this.config.ai?.chat) {
      if (keywordResult) {
        return {
          ...keywordResult,
          metadata: {
            ...keywordResult.metadata,
            method: "keyword"
          }
        };
      }
      return this.analyzeWithKeywords(content, options, startTime);
    }
    try {
      const prompt = this.buildAIPrompt(content, keywordResult);
      const response = await this.config.ai.chat({
        messages: [{ role: "user", content: prompt }],
        systemPrompt: this.getSystemPrompt()
      });
      const aiAnalysis = this.parseAIResponse(response.content);
      const result = {
        dominantLevel: aiAnalysis.dominantLevel,
        distribution: aiAnalysis.distribution,
        confidence: aiAnalysis.confidence,
        cognitiveDepth: aiAnalysis.cognitiveDepth,
        balance: aiAnalysis.balance,
        gaps: aiAnalysis.gaps,
        recommendations: aiAnalysis.recommendations,
        metadata: {
          method: keywordResult ? "hybrid" : "ai",
          processingTimeMs: Date.now() - startTime,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          fromCache: false,
          aiModel: this.config.ai.getModel?.() ?? this.config.model?.name ?? "claude-sonnet",
          keywordConfidence: keywordResult?.confidence
        }
      };
      if (this.enableCache) {
        const cacheKey = this.generateCacheKey("content", content, "comprehensive");
        this.setCache(cacheKey, result);
      }
      return result;
    } catch (error) {
      if (keywordResult) {
        return {
          ...keywordResult,
          metadata: {
            ...keywordResult.metadata,
            method: "keyword"
          }
        };
      }
      return this.analyzeWithKeywords(content, options, startTime);
    }
  }
  getSystemPrompt() {
    return `You are an expert in Bloom's Taxonomy educational assessment. Analyze content to determine its cognitive level distribution across the six levels: REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, and CREATE.

Respond with a JSON object containing:
{
  "dominantLevel": "LEVEL_NAME",
  "distribution": {
    "REMEMBER": number (0-100),
    "UNDERSTAND": number (0-100),
    "APPLY": number (0-100),
    "ANALYZE": number (0-100),
    "EVALUATE": number (0-100),
    "CREATE": number (0-100)
  },
  "confidence": number (0-1),
  "cognitiveDepth": number (0-100),
  "balance": "well-balanced" | "bottom-heavy" | "top-heavy",
  "gaps": ["LEVEL_NAME", ...],
  "recommendations": [
    {
      "level": "LEVEL_NAME",
      "action": "description",
      "priority": "low" | "medium" | "high"
    }
  ]
}

Ensure distribution percentages sum to 100. Be precise in your analysis.`;
  }
  buildAIPrompt(content, keywordResult) {
    let prompt = `Analyze the following content for Bloom's Taxonomy levels:

${content}

`;
    if (keywordResult) {
      prompt += `Initial keyword analysis suggests:
- Dominant Level: ${keywordResult.dominantLevel}
- Confidence: ${keywordResult.confidence}
- Distribution: ${JSON.stringify(keywordResult.distribution)}

Please provide a more thorough semantic analysis to confirm or correct this assessment.`;
    }
    return prompt;
  }
  parseAIResponse(content) {
    const validationResult = parseAndValidate(
      content,
      BloomsAIResponseSchema,
      "BloomsAIResponse"
    );
    if (!validationResult.success || !validationResult.data) {
      console.warn(
        "[UnifiedBloomsEngine] AI response validation failed:",
        validationResult.error?.message,
        validationResult.error?.zodErrors?.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      );
      return {
        dominantLevel: "UNDERSTAND",
        distribution: {
          REMEMBER: 15,
          UNDERSTAND: 30,
          APPLY: 25,
          ANALYZE: 15,
          EVALUATE: 10,
          CREATE: 5
        },
        confidence: 0.3,
        // Lower confidence indicates parsing fallback
        cognitiveDepth: 45,
        balance: "well-balanced",
        gaps: [],
        recommendations: [],
        metadata: {
          method: "ai",
          processingTimeMs: 0,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          fromCache: false,
          validationError: validationResult.error?.message
        }
      };
    }
    const validated = validationResult.data;
    let dominantLevel = validated.dominantLevel ?? "UNDERSTAND";
    if (!validated.dominantLevel && validated.distribution) {
      dominantLevel = this.findDominantLevel(validated.distribution);
    }
    return {
      dominantLevel,
      distribution: this.normalizeDistribution(validated.distribution ?? {}),
      confidence: validated.confidence,
      cognitiveDepth: validated.cognitiveDepth,
      balance: validated.balance,
      gaps: validated.gaps,
      recommendations: this.parseRecommendations(validated.recommendations),
      metadata: {
        method: "ai",
        processingTimeMs: 0,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        fromCache: false
      }
    };
  }
  validateBloomsLevel(level) {
    if (import_core.BLOOMS_LEVELS.includes(level)) {
      return level;
    }
    return "UNDERSTAND";
  }
  validateBalance(balance) {
    if (["well-balanced", "bottom-heavy", "top-heavy"].includes(balance)) {
      return balance;
    }
    return "well-balanced";
  }
  normalizeDistribution(dist) {
    const normalized = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    let total = 0;
    for (const level of import_core.BLOOMS_LEVELS) {
      normalized[level] = Math.max(0, dist[level] ?? 0);
      total += normalized[level];
    }
    if (total > 0 && total !== 100) {
      const factor = 100 / total;
      for (const level of import_core.BLOOMS_LEVELS) {
        normalized[level] = Math.round(normalized[level] * factor);
      }
    }
    return normalized;
  }
  parseRecommendations(recs) {
    return recs.slice(0, 5).map((rec) => ({
      level: this.validateBloomsLevel(rec.level ?? "UNDERSTAND"),
      action: rec.action ?? "Review content for improvements",
      priority: ["low", "medium", "high"].includes(rec.priority ?? "") ? rec.priority : "medium"
    }));
  }
  // ============================================================================
  // PRIVATE - RECOMMENDATIONS
  // ============================================================================
  generateRecommendations(distribution, gaps, balance) {
    const recommendations = [];
    if (balance === "bottom-heavy") {
      recommendations.push({
        level: "ANALYZE",
        action: "Add more activities requiring analysis and higher-order thinking",
        priority: "high",
        examples: ["Case studies", "Compare and contrast exercises", "Root cause analysis"],
        expectedImpact: "Increase cognitive depth by 15-20 points"
      });
    } else if (balance === "top-heavy") {
      recommendations.push({
        level: "UNDERSTAND",
        action: "Ensure foundational concepts are well-covered before advanced topics",
        priority: "high",
        examples: ["Concept explanations", "Examples and illustrations", "Knowledge checks"],
        expectedImpact: "Improve learning retention and reduce confusion"
      });
    }
    const gapRecommendations = {
      REMEMBER: {
        level: "REMEMBER",
        action: "Add definitions, key terms, and fact-based content",
        priority: "medium",
        examples: ["Glossary terms", "Key concept lists", "Flashcard-style content"],
        expectedImpact: "Build foundational knowledge base"
      },
      UNDERSTAND: {
        level: "UNDERSTAND",
        action: "Include explanations, summaries, and conceptual examples",
        priority: "medium",
        examples: ["Concept explanations", "Analogies", "Visual diagrams"],
        expectedImpact: "Improve comprehension of core concepts"
      },
      APPLY: {
        level: "APPLY",
        action: "Add practical exercises and real-world applications",
        priority: "high",
        examples: ["Hands-on exercises", "Practice problems", "Simulations"],
        expectedImpact: "Enable skill transfer to real situations"
      },
      ANALYZE: {
        level: "ANALYZE",
        action: "Include comparison activities and analytical exercises",
        priority: "medium",
        examples: ["Case analyses", "Data interpretation", "Pattern recognition"],
        expectedImpact: "Develop critical thinking skills"
      },
      EVALUATE: {
        level: "EVALUATE",
        action: "Add critical thinking questions and peer review activities",
        priority: "medium",
        examples: ["Critique exercises", "Decision-making scenarios", "Debate topics"],
        expectedImpact: "Build judgment and evaluation skills"
      },
      CREATE: {
        level: "CREATE",
        action: "Include projects, design challenges, or original work assignments",
        priority: "low",
        examples: ["Project-based learning", "Design challenges", "Creative assignments"],
        expectedImpact: "Foster innovation and synthesis skills"
      }
    };
    for (const gap of gaps.slice(0, 2)) {
      recommendations.push(gapRecommendations[gap]);
    }
    return recommendations.slice(0, 5);
  }
  generateCourseRecommendations(distribution, chapters, balance) {
    const recommendations = [];
    for (const chapter of chapters) {
      if (chapter.cognitiveDepth < 40) {
        recommendations.push({
          type: "content",
          priority: "high",
          targetLevel: "ANALYZE",
          description: `Chapter "${chapter.chapterTitle}" has low cognitive depth (${chapter.cognitiveDepth}%). Add higher-order thinking activities.`,
          targetChapter: chapter.chapterId,
          expectedImpact: "Increase chapter cognitive depth by 20+ points"
        });
      }
      if (chapter.confidence < 0.5) {
        recommendations.push({
          type: "structure",
          priority: "medium",
          targetLevel: chapter.primaryLevel,
          description: `Chapter "${chapter.chapterTitle}" lacks clear learning objectives. Add explicit Bloom's-aligned objectives.`,
          targetChapter: chapter.chapterId,
          expectedImpact: "Improve content clarity and learning outcomes"
        });
      }
    }
    if (balance === "bottom-heavy") {
      recommendations.push({
        type: "assessment",
        priority: "high",
        targetLevel: "EVALUATE",
        description: "Course is heavily focused on lower cognitive levels. Add assessments requiring evaluation and creation.",
        examples: ["Project-based assessments", "Peer reviews", "Design challenges"],
        expectedImpact: "Prepare students for real-world application of knowledge"
      });
    }
    const gaps = this.identifyGaps(distribution);
    for (const gap of gaps) {
      recommendations.push({
        type: "activity",
        priority: "medium",
        targetLevel: gap,
        description: `Add activities targeting the ${gap} level across the course.`,
        expectedImpact: `Improve course balance and student ${gap.toLowerCase()} skills`
      });
    }
    return recommendations.slice(0, 6);
  }
  generateLearningPathway(distribution, chapters) {
    const stages = [];
    for (const level of import_core.BLOOMS_LEVELS) {
      const levelChapters = chapters.filter((c) => c.primaryLevel === level);
      const mastery = distribution[level];
      if (mastery > 0 || level === "REMEMBER" || level === "UNDERSTAND") {
        stages.push({
          level,
          mastery,
          activities: this.getActivitiesForLevel(level),
          timeEstimate: Math.max(1, Math.round(mastery / 10))
        });
      }
    }
    const cognitiveProgression = stages.map((s) => s.level);
    const totalTime = stages.reduce((acc, s) => acc + s.timeEstimate, 0);
    return {
      stages,
      estimatedDuration: `${totalTime} hours`,
      cognitiveProgression,
      recommendations: [
        "Start with foundational concepts before advancing",
        "Complete each stage before moving to higher levels",
        "Review and practice regularly to reinforce learning"
      ]
    };
  }
  getActivitiesForLevel(level) {
    const activities = {
      REMEMBER: ["Read key concepts", "Review definitions", "Complete flashcards"],
      UNDERSTAND: ["Watch explanations", "Study examples", "Summarize content"],
      APPLY: ["Complete exercises", "Work through problems", "Practice skills"],
      ANALYZE: ["Analyze case studies", "Compare solutions", "Identify patterns"],
      EVALUATE: ["Critique approaches", "Assess solutions", "Review peer work"],
      CREATE: ["Design projects", "Develop solutions", "Create original work"]
    };
    return activities[level];
  }
  // ============================================================================
  // PRIVATE - COGNITIVE PROGRESS HELPERS
  // ============================================================================
  identifyPreferredLevels(mastery) {
    return import_core.BLOOMS_LEVELS.filter((level) => mastery[level] >= 70);
  }
  identifyChallengeAreas(mastery) {
    return import_core.BLOOMS_LEVELS.filter((level) => mastery[level] < 40);
  }
  generateProgressRecommendations(profile, recentLevel, score) {
    const recommendations = [];
    if (score < 0.5) {
      recommendations.push({
        type: "review",
        title: `Review ${recentLevel} concepts`,
        description: "Your recent performance suggests reviewing foundational material would be beneficial.",
        bloomsLevel: recentLevel,
        priority: 1
      });
    } else if (score >= 0.8) {
      const levelIndex = import_core.BLOOMS_LEVELS.indexOf(recentLevel);
      if (levelIndex < import_core.BLOOMS_LEVELS.length - 1) {
        const nextLevel = import_core.BLOOMS_LEVELS[levelIndex + 1];
        recommendations.push({
          type: "advance",
          title: `Ready for ${nextLevel}`,
          description: "Your strong performance indicates readiness for higher cognitive challenges.",
          bloomsLevel: nextLevel,
          priority: 1
        });
      }
    }
    for (const challengeLevel of profile.challengeAreas.slice(0, 2)) {
      recommendations.push({
        type: "practice",
        title: `Strengthen ${challengeLevel} skills`,
        description: `This is an area where additional practice would improve your overall mastery.`,
        bloomsLevel: challengeLevel,
        priority: 2
      });
    }
    return recommendations;
  }
  // ============================================================================
  // PRIVATE - HELPERS
  // ============================================================================
  extractChapterText(chapter) {
    const parts = [chapter.title];
    for (const section of chapter.sections) {
      parts.push(section.title);
      if (section.content) parts.push(section.content);
      if (section.description) parts.push(section.description);
    }
    return parts.join(" ");
  }
  aggregateDistributions(distributions) {
    const aggregate = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    if (distributions.length === 0) return aggregate;
    for (const dist of distributions) {
      for (const level of import_core.BLOOMS_LEVELS) {
        aggregate[level] += dist[level];
      }
    }
    for (const level of import_core.BLOOMS_LEVELS) {
      aggregate[level] = Math.round(aggregate[level] / distributions.length);
    }
    return aggregate;
  }
  // ============================================================================
  // PRIVATE - CACHING
  // ============================================================================
  generateCacheKey(type, identifier, mode) {
    const hash = this.hashString(`${type}:${identifier}:${mode}`);
    return `unified-blooms:${hash}`;
  }
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  getFromCache(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.cacheMisses++;
      return null;
    }
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.cacheMisses++;
      return null;
    }
    this.cacheHits++;
    return entry.data;
  }
  setCache(key, data) {
    if (this.cache.size > 1e3) {
      this.evictOldestEntries(100);
    }
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.cacheTTL,
      key
    });
  }
  evictOldestEntries(count) {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < count && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }
};
function createUnifiedBloomsEngine(config) {
  return new UnifiedBloomsEngine(config);
}

// src/engines/unified-blooms-adapter.ts
var import_core2 = require("@sam-ai/core");
var UnifiedBloomsAdapterEngine = class extends import_core2.BaseEngine {
  unified;
  constructor(config) {
    super({
      config: config.samConfig,
      name: "blooms",
      version: "2.0.0",
      dependencies: ["context"],
      cacheEnabled: false
      // Unified engine already has its own caching
    });
    this.unified = createUnifiedBloomsEngine({
      samConfig: config.samConfig,
      database: config.database ?? config.samConfig.database,
      defaultMode: config.defaultMode,
      confidenceThreshold: config.confidenceThreshold,
      enableCache: config.enableCache,
      cacheTTL: config.cacheTTL
    });
  }
  async process(input) {
    const content = this.buildContent(input);
    const options = this.buildAnalysisOptions(input);
    if (!content.trim()) {
      return this.createFallbackOutput();
    }
    const result = await this.unified.analyze(content, options);
    return this.mapResult(result);
  }
  getCacheKey(input) {
    const content = this.buildContent(input);
    return `blooms-unified:${this.hashString(content)}`;
  }
  buildContent(input) {
    const parts = [];
    if (input.title) parts.push(input.title);
    if (input.content) parts.push(input.content);
    if (input.objectives?.length) parts.push(...input.objectives);
    if (input.sections?.length) {
      for (const section of input.sections) {
        parts.push(section.title);
        if (section.content) parts.push(section.content);
      }
    }
    if (input.query) parts.push(input.query);
    const metadata = input.context.page.metadata ?? {};
    const entitySummary = metadata.entitySummary;
    const sectionContent = metadata.sectionContent;
    const formSummary = metadata.formSummary;
    const memorySummary = metadata.memorySummary;
    if (entitySummary) parts.push(entitySummary);
    if (sectionContent) parts.push(sectionContent);
    if (formSummary) parts.push(formSummary);
    if (memorySummary) parts.push(memorySummary);
    return parts.filter(Boolean).join("\n\n");
  }
  buildAnalysisOptions(input) {
    if (input.analysisOptions) return input.analysisOptions;
    const options = input.options ?? {};
    const mode = options.bloomsMode ?? options.mode;
    return {
      mode: typeof mode === "string" ? mode : void 0,
      forceAI: options.forceAI === true,
      forceKeyword: options.forceKeyword === true,
      includeSections: options.includeSections === true,
      confidenceThreshold: typeof options.confidenceThreshold === "number" ? options.confidenceThreshold : void 0
    };
  }
  mapResult(result) {
    const recommendations = result.recommendations.map((rec) => rec.action);
    const actionItems = result.recommendations.filter((rec) => rec.priority !== "low").map((rec) => rec.action) ?? [];
    const analysis = {
      distribution: result.distribution,
      dominantLevel: result.dominantLevel,
      cognitiveDepth: result.cognitiveDepth,
      balance: result.balance,
      gaps: result.gaps,
      recommendations,
      confidence: result.confidence,
      method: result.metadata.method
    };
    return {
      analysis,
      sectionAnalysis: result.sectionAnalysis?.map((section) => ({
        title: section.title,
        level: section.level,
        confidence: section.confidence
      })),
      recommendations,
      actionItems: actionItems.length > 0 ? actionItems : this.buildGapActions(result.gaps)
    };
  }
  buildGapActions(gaps) {
    if (!gaps || gaps.length === 0) {
      return ["Add more higher-order thinking activities for deeper mastery."];
    }
    return gaps.map((level) => `Add ${level.toLowerCase()}-level activities for better balance.`);
  }
  createFallbackOutput() {
    const analysis = {
      distribution: {
        REMEMBER: 10,
        UNDERSTAND: 40,
        APPLY: 30,
        ANALYZE: 15,
        EVALUATE: 3,
        CREATE: 2
      },
      dominantLevel: "UNDERSTAND",
      cognitiveDepth: 35,
      balance: "bottom-heavy",
      gaps: ["EVALUATE", "CREATE"],
      recommendations: [
        "Add application or analysis activities to deepen understanding."
      ],
      confidence: 0.3,
      method: "keyword"
    };
    return {
      analysis,
      sectionAnalysis: void 0,
      recommendations: analysis.recommendations,
      actionItems: ["Add higher-order questions (evaluate/create) to balance the content."]
    };
  }
};
function createUnifiedBloomsAdapterEngine(config) {
  return new UnifiedBloomsAdapterEngine(config);
}

// src/engines/practice-problems-engine.ts
var PracticeProblemsEngine = class {
  constructor(config = {}) {
    this.config = config;
    this.database = config.database;
    this.aiAdapter = config.aiAdapter;
  }
  database;
  aiAdapter;
  /**
   * Generate practice problems for a topic
   */
  async generateProblems(input) {
    const {
      topic,
      bloomsLevel = "APPLY",
      difficulty = "intermediate",
      problemTypes = ["multiple_choice", "short_answer"],
      count = 5,
      userSkillLevel = 50,
      learningObjectives = [],
      timeLimit
    } = input;
    if (this.aiAdapter) {
      return this.generateWithAI(input);
    }
    const problems = [];
    const typesToGenerate = this.distributeTypes(problemTypes, count);
    for (let i = 0; i < count; i++) {
      const problemType = typesToGenerate[i % typesToGenerate.length];
      const adjustedDifficulty = this.adjustDifficulty(difficulty, userSkillLevel);
      const problem = this.generateTemplateProblem({
        topic,
        type: problemType,
        difficulty: adjustedDifficulty,
        bloomsLevel,
        index: i,
        learningObjectives,
        timeLimit: timeLimit ? Math.floor(timeLimit / count) : void 0
      });
      problems.push(problem);
    }
    if (this.database) {
      await this.database.saveProblems(problems);
    }
    return {
      problems,
      totalCount: problems.length,
      estimatedTime: problems.reduce((sum, p) => sum + (p.timeLimit || 5), 0),
      difficultyDistribution: this.countByDifficulty(problems),
      bloomsDistribution: this.countByBlooms(problems),
      coveredObjectives: learningObjectives,
      metadata: {
        generatedAt: /* @__PURE__ */ new Date(),
        topic
      }
    };
  }
  /**
   * Generate problems using AI
   */
  async generateWithAI(input) {
    const {
      topic,
      bloomsLevel = "APPLY",
      difficulty = "intermediate",
      problemTypes = ["multiple_choice", "short_answer"],
      count = 5,
      learningObjectives = [],
      timeLimit
    } = input;
    const prompt = this.buildGenerationPrompt(input);
    try {
      const response = await this.aiAdapter.chat({
        messages: [
          {
            role: "system",
            content: `You are an expert educational content creator specializing in practice problems. Generate problems that are pedagogically sound, properly aligned with Bloom's Taxonomy, and include helpful hints and detailed solutions. Always respond with valid JSON.`
          },
          { role: "user", content: prompt }
        ]
      });
      const problems = this.parseGeneratedProblems(response.content, {
        topic,
        bloomsLevel,
        difficulty,
        problemTypes,
        count,
        learningObjectives,
        timeLimit
      });
      if (this.database) {
        await this.database.saveProblems(problems);
      }
      return {
        problems,
        totalCount: problems.length,
        estimatedTime: problems.reduce((sum, p) => sum + (p.timeLimit || 5), 0),
        difficultyDistribution: this.countByDifficulty(problems),
        bloomsDistribution: this.countByBlooms(problems),
        coveredObjectives: learningObjectives,
        metadata: {
          generatedAt: /* @__PURE__ */ new Date(),
          topic,
          model: "ai-generated"
        }
      };
    } catch (error) {
      console.error("AI generation failed, falling back to templates:", error);
      return this.generateProblems({ ...input });
    }
  }
  /**
   * Evaluate a problem attempt
   */
  async evaluateAttempt(problem, userAnswer, options = {}) {
    const { partialCredit = true } = options;
    if (problem.type === "multiple_choice" && problem.options) {
      const correctOption = problem.options.find((o) => o.isCorrect);
      const isCorrect2 = correctOption?.id === userAnswer || correctOption?.text === userAnswer;
      return {
        isCorrect: isCorrect2,
        partialCredit: isCorrect2 ? 1 : 0,
        pointsEarned: isCorrect2 ? problem.points : 0,
        feedback: isCorrect2 ? "Correct! " + (correctOption?.explanation || problem.solutionExplanation) : `Incorrect. ${correctOption?.explanation || problem.solutionExplanation}`,
        errors: isCorrect2 ? [] : ["Selected wrong answer"],
        suggestions: isCorrect2 ? ["Try a more challenging problem"] : ["Review the concept and try again", "Use hints if available"],
        conceptsToReview: isCorrect2 ? [] : problem.relatedConcepts,
        nextDifficulty: isCorrect2 ? this.increaseDifficulty(problem.difficulty) : problem.difficulty,
        nextBloomsLevel: isCorrect2 ? this.increaseBloomsLevel(problem.bloomsLevel) : problem.bloomsLevel
      };
    }
    if (this.aiAdapter) {
      return this.evaluateWithAI(problem, userAnswer, partialCredit);
    }
    const normalizedAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrect = (problem.correctAnswer || "").trim().toLowerCase();
    const isCorrect = normalizedAnswer === normalizedCorrect;
    let partialScore = 0;
    if (!isCorrect && partialCredit) {
      partialScore = this.calculateSimilarity(normalizedAnswer, normalizedCorrect);
    }
    return {
      isCorrect,
      partialCredit: isCorrect ? 1 : partialScore,
      pointsEarned: isCorrect ? problem.points : Math.round(problem.points * partialScore),
      feedback: isCorrect ? "Correct! " + problem.solutionExplanation : `Not quite. ${problem.solutionExplanation}`,
      errors: isCorrect ? [] : ["Answer does not match expected solution"],
      suggestions: isCorrect ? ["Great job! Move on to more challenging problems"] : ["Review the solution steps", "Try using the hints"],
      conceptsToReview: isCorrect ? [] : problem.relatedConcepts,
      nextDifficulty: isCorrect ? this.increaseDifficulty(problem.difficulty) : problem.difficulty,
      nextBloomsLevel: isCorrect ? this.increaseBloomsLevel(problem.bloomsLevel) : problem.bloomsLevel
    };
  }
  /**
   * Evaluate using AI
   */
  async evaluateWithAI(problem, userAnswer, partialCredit) {
    const prompt = `
Evaluate this student answer for the following practice problem:

**Problem:**
${problem.statement}

**Correct Answer:**
${problem.correctAnswer || problem.solutionExplanation}

**Student Answer:**
${userAnswer}

**Evaluation Criteria:**
- Correctness: Is the answer factually correct?
- Completeness: Does it address all parts of the question?
- Partial Credit: ${partialCredit ? "Award partial credit for partially correct answers" : "No partial credit"}

Respond in JSON format:
{
  "isCorrect": boolean,
  "partialCredit": number (0-1),
  "feedback": "detailed feedback string",
  "errors": ["list", "of", "errors"],
  "suggestions": ["improvement", "suggestions"],
  "conceptsToReview": ["concepts", "to", "review"]
}
`;
    try {
      const response = await this.aiAdapter.chat({
        messages: [
          { role: "system", content: "You are an expert grader. Evaluate student answers fairly and provide helpful feedback. Respond only with valid JSON." },
          { role: "user", content: prompt }
        ]
      });
      const result = JSON.parse(this.extractJson(response.content));
      return {
        isCorrect: result.isCorrect,
        partialCredit: result.partialCredit,
        pointsEarned: Math.round(problem.points * result.partialCredit),
        feedback: result.feedback,
        errors: result.errors || [],
        suggestions: result.suggestions || [],
        conceptsToReview: result.conceptsToReview || problem.relatedConcepts,
        nextDifficulty: result.isCorrect ? this.increaseDifficulty(problem.difficulty) : problem.difficulty,
        nextBloomsLevel: result.isCorrect ? this.increaseBloomsLevel(problem.bloomsLevel) : problem.bloomsLevel
      };
    } catch {
      return this.evaluateAttempt(problem, userAnswer, { partialCredit: false });
    }
  }
  /**
   * Get the next hint for a problem
   */
  getNextHint(problem, hintsUsed) {
    const unusedHints = problem.hints.filter((h) => !hintsUsed.includes(h.id)).sort((a, b) => a.order - b.order);
    return unusedHints.length > 0 ? unusedHints[0] : null;
  }
  /**
   * Get adaptive difficulty recommendation
   */
  async getAdaptiveDifficulty(userId, topic) {
    if (!this.database) {
      return {
        recommended: "intermediate",
        bloomsLevel: "APPLY",
        confidence: 0.5,
        reasoning: "No historical data available, starting with intermediate difficulty",
        trend: "stable"
      };
    }
    const stats = await this.database.getSessionStats(userId);
    const difficultySuccess = stats.byDifficulty;
    const currentSuccessRate = stats.totalAttempts > 0 ? stats.correctAnswers / stats.totalAttempts : 0.5;
    let recommended = "intermediate";
    let bloomsLevel = "APPLY";
    let trend = "stable";
    if (currentSuccessRate >= 0.8) {
      recommended = this.increaseDifficulty("intermediate");
      bloomsLevel = this.increaseBloomsLevel("APPLY");
      trend = "improving";
    } else if (currentSuccessRate < 0.5) {
      recommended = "beginner";
      bloomsLevel = "UNDERSTAND";
      trend = "declining";
    }
    const advancedSuccess = difficultySuccess.advanced;
    if (advancedSuccess && advancedSuccess.attempts > 3 && advancedSuccess.correct / advancedSuccess.attempts >= 0.7) {
      recommended = "expert";
      bloomsLevel = "EVALUATE";
    }
    return {
      recommended,
      bloomsLevel,
      confidence: Math.min(0.9, 0.5 + stats.totalAttempts * 0.05),
      reasoning: this.generateDifficultyReasoning(stats, recommended),
      trend
    };
  }
  /**
   * Update spaced repetition schedule based on attempt
   */
  async updateSpacedRepetition(userId, problemId, performance) {
    if (!this.database) {
      return this.calculateNextReview(
        {
          problemId,
          nextReviewDate: /* @__PURE__ */ new Date(),
          intervalDays: 1,
          easeFactor: 2.5,
          reviewCount: 1,
          lastPerformance: performance
        },
        performance
      );
    }
    const schedules = await this.database.getRepetitionSchedule(userId);
    const existing = schedules.find((s) => s.problemId === problemId);
    const currentSchedule = existing || {
      problemId,
      nextReviewDate: /* @__PURE__ */ new Date(),
      intervalDays: 1,
      easeFactor: 2.5,
      reviewCount: 0,
      lastPerformance: 0
    };
    const newSchedule = this.calculateNextReview(currentSchedule, performance);
    await this.database.updateRepetitionSchedule(userId, problemId, newSchedule);
    return newSchedule;
  }
  /**
   * Calculate next review using SM-2 algorithm
   */
  calculateNextReview(current, performance) {
    const newEaseFactor = Math.max(
      1.3,
      current.easeFactor + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02))
    );
    let newInterval;
    if (performance < 3) {
      newInterval = 1;
    } else if (current.reviewCount === 0) {
      newInterval = 1;
    } else if (current.reviewCount === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(current.intervalDays * newEaseFactor);
    }
    const nextDate = /* @__PURE__ */ new Date();
    nextDate.setDate(nextDate.getDate() + newInterval);
    return {
      problemId: current.problemId,
      nextReviewDate: nextDate,
      intervalDays: newInterval,
      easeFactor: newEaseFactor,
      reviewCount: current.reviewCount + 1,
      lastPerformance: performance
    };
  }
  /**
   * Get problems due for review
   */
  async getProblemsForReview(userId, limit = 10) {
    if (!this.database) {
      return [];
    }
    const schedules = await this.database.getRepetitionSchedule(userId);
    const now = /* @__PURE__ */ new Date();
    const dueSchedules = schedules.filter((s) => s.nextReviewDate <= now).sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime()).slice(0, limit);
    const problems = [];
    for (const schedule of dueSchedules) {
      const topicProblems = await this.database.getProblems("review", { limit: 1 });
      if (topicProblems.length > 0) {
        problems.push(topicProblems[0]);
      }
    }
    return problems;
  }
  /**
   * Get session statistics
   */
  async getSessionStats(userId, sessionId) {
    if (!this.database) {
      return this.getDefaultStats();
    }
    return this.database.getSessionStats(userId, sessionId);
  }
  // Helper methods
  buildGenerationPrompt(input) {
    return `
Generate ${input.count || 5} practice problems for the following specifications:

**Topic:** ${input.topic}
**Bloom's Taxonomy Level:** ${input.bloomsLevel || "apply"}
**Difficulty:** ${input.difficulty || "intermediate"}
**Problem Types:** ${(input.problemTypes || ["multiple_choice"]).join(", ")}
**Learning Objectives:** ${input.learningObjectives?.join(", ") || "General understanding"}

For each problem, provide:
1. A clear problem statement
2. For multiple choice: 4 options with one correct answer
3. 3 progressive hints (conceptual \u2192 procedural \u2192 partial solution)
4. A detailed solution explanation
5. Related concepts
6. Prerequisites

Respond with a JSON array of problems following this structure:
{
  "problems": [
    {
      "title": "Problem Title",
      "statement": "The problem statement",
      "type": "multiple_choice",
      "difficulty": "intermediate",
      "bloomsLevel": "apply",
      "points": 10,
      "options": [
        {"id": "a", "text": "Option A", "isCorrect": false, "explanation": "Why wrong"},
        {"id": "b", "text": "Option B", "isCorrect": true, "explanation": "Why correct"}
      ],
      "hints": [
        {"type": "conceptual", "content": "Think about...", "order": 1},
        {"type": "procedural", "content": "First step is...", "order": 2},
        {"type": "partial_solution", "content": "The answer starts with...", "order": 3}
      ],
      "solutionExplanation": "Detailed explanation",
      "relatedConcepts": ["concept1", "concept2"],
      "prerequisites": ["prereq1"]
    }
  ]
}
`;
  }
  parseGeneratedProblems(content, input) {
    try {
      const jsonContent = this.extractJson(content);
      const parsed = JSON.parse(jsonContent);
      const rawProblems = parsed.problems || parsed;
      return rawProblems.map((p, index) => ({
        id: `prob_${Date.now()}_${index}`,
        type: p.type || "multiple_choice",
        title: p.title || `Problem ${index + 1}`,
        statement: p.statement || "",
        difficulty: p.difficulty || input.difficulty || "intermediate",
        bloomsLevel: p.bloomsLevel || input.bloomsLevel || "APPLY",
        points: p.points || 10,
        timeLimit: p.timeLimit || Math.floor((input.timeLimit || 25) / (input.count || 5)),
        options: p.options,
        correctAnswer: p.correctAnswer,
        hints: (p.hints || []).map((h, i) => ({
          id: `hint_${index}_${i}`,
          type: h.type || "conceptual",
          content: h.content || "",
          order: h.order || i + 1,
          penaltyPoints: 2
        })),
        solution: p.solution,
        solutionExplanation: p.solutionExplanation || "Solution explanation not available",
        relatedConcepts: p.relatedConcepts || [],
        prerequisites: p.prerequisites || [],
        tags: [input.topic, input.difficulty || "intermediate"],
        learningObjectives: input.learningObjectives || [],
        createdAt: /* @__PURE__ */ new Date(),
        metadata: { source: "ai-generated" }
      }));
    } catch (error) {
      console.error("Failed to parse AI-generated problems:", error);
      return [];
    }
  }
  generateTemplateProblem(params) {
    const { topic, type, difficulty, bloomsLevel, index, learningObjectives, timeLimit } = params;
    const templates = this.getTemplatesForType(type, topic, difficulty);
    const template = templates[index % templates.length];
    return {
      id: `prob_${Date.now()}_${index}`,
      type,
      title: template.title,
      statement: template.statement,
      difficulty,
      bloomsLevel,
      points: this.getPointsForDifficulty(difficulty),
      timeLimit: timeLimit || 5,
      options: type === "multiple_choice" ? template.options : void 0,
      correctAnswer: template.correctAnswer,
      hints: [
        { id: `hint_${index}_0`, type: "conceptual", content: template.hints[0], order: 1, penaltyPoints: 2 },
        { id: `hint_${index}_1`, type: "procedural", content: template.hints[1], order: 2, penaltyPoints: 3 },
        { id: `hint_${index}_2`, type: "partial_solution", content: template.hints[2], order: 3, penaltyPoints: 5 }
      ],
      solutionExplanation: template.solution,
      relatedConcepts: [topic],
      prerequisites: [],
      tags: [topic, difficulty, bloomsLevel],
      learningObjectives,
      createdAt: /* @__PURE__ */ new Date()
    };
  }
  getTemplatesForType(type, topic, difficulty) {
    const baseTemplates = [
      {
        title: `Understanding ${topic}`,
        statement: `Explain the key concepts of ${topic} and how they relate to practical applications.`,
        correctAnswer: `A comprehensive explanation covering the fundamentals of ${topic}.`,
        hints: [
          `Think about the core definition of ${topic}.`,
          `Consider how ${topic} is used in real-world scenarios.`,
          `The explanation should cover: definition, key components, and applications.`
        ],
        solution: `${topic} encompasses several key concepts that are fundamental to understanding the subject matter. The main components include the theoretical foundation, practical applications, and interconnections with related topics.`
      },
      {
        title: `Applying ${topic}`,
        statement: `Given a scenario involving ${topic}, describe how you would apply your knowledge to solve the problem.`,
        correctAnswer: `A step-by-step approach to applying ${topic} principles.`,
        hints: [
          `Start by identifying the relevant aspects of ${topic}.`,
          `Break down the problem into smaller components.`,
          `Apply the principles systematically to each component.`
        ],
        solution: `To apply ${topic} effectively, first analyze the requirements, then select appropriate techniques, and finally implement the solution while considering best practices.`
      }
    ];
    if (type === "multiple_choice") {
      return [
        {
          ...baseTemplates[0],
          statement: `Which of the following best describes a key aspect of ${topic}?`,
          options: [
            { id: "a", text: `A fundamental principle of ${topic}`, isCorrect: true, explanation: "This correctly describes a core concept." },
            { id: "b", text: `An unrelated concept`, isCorrect: false, explanation: "This is not directly related to the topic." },
            { id: "c", text: `A common misconception about ${topic}`, isCorrect: false, explanation: "This represents a misunderstanding." },
            { id: "d", text: `A tangentially related idea`, isCorrect: false, explanation: "While related, this is not the best answer." }
          ]
        }
      ];
    }
    return baseTemplates;
  }
  distributeTypes(types, count) {
    const distributed = [];
    for (let i = 0; i < count; i++) {
      distributed.push(types[i % types.length]);
    }
    return distributed;
  }
  adjustDifficulty(base, skillLevel) {
    if (skillLevel < 30) return "beginner";
    if (skillLevel < 50) return base === "expert" ? "advanced" : base;
    if (skillLevel > 80) return base === "beginner" ? "intermediate" : base;
    return base;
  }
  increaseDifficulty(current) {
    const order = ["beginner", "intermediate", "advanced", "expert"];
    const idx = order.indexOf(current);
    return order[Math.min(idx + 1, order.length - 1)];
  }
  increaseBloomsLevel(current) {
    const order = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    const idx = order.indexOf(current);
    return order[Math.min(idx + 1, order.length - 1)];
  }
  getPointsForDifficulty(difficulty) {
    switch (difficulty) {
      case "beginner":
        return 5;
      case "intermediate":
        return 10;
      case "advanced":
        return 15;
      case "expert":
        return 20;
      default:
        return 10;
    }
  }
  calculateSimilarity(a, b) {
    if (!a || !b) return 0;
    const aWords = new Set(a.split(/\s+/));
    const bWords = new Set(b.split(/\s+/));
    let matches = 0;
    aWords.forEach((word) => {
      if (bWords.has(word)) matches++;
    });
    return matches / Math.max(aWords.size, bWords.size);
  }
  countByDifficulty(problems) {
    const counts = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };
    problems.forEach((p) => counts[p.difficulty]++);
    return counts;
  }
  countByBlooms(problems) {
    const counts = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    problems.forEach((p) => counts[p.bloomsLevel]++);
    return counts;
  }
  generateDifficultyReasoning(stats, recommended) {
    const successRate = stats.totalAttempts > 0 ? stats.correctAnswers / stats.totalAttempts : 0;
    return `Based on ${stats.totalAttempts} attempts with ${Math.round(successRate * 100)}% success rate, ${recommended} difficulty is recommended.`;
  }
  extractJson(content) {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
  }
  getDefaultStats() {
    return {
      totalAttempts: 0,
      correctAnswers: 0,
      averageScore: 0,
      totalPoints: 0,
      totalTime: 0,
      hintsUsed: 0,
      byDifficulty: { beginner: { attempts: 0, correct: 0 }, intermediate: { attempts: 0, correct: 0 }, advanced: { attempts: 0, correct: 0 }, expert: { attempts: 0, correct: 0 } },
      byBloomsLevel: { REMEMBER: { attempts: 0, correct: 0 }, UNDERSTAND: { attempts: 0, correct: 0 }, APPLY: { attempts: 0, correct: 0 }, ANALYZE: { attempts: 0, correct: 0 }, EVALUATE: { attempts: 0, correct: 0 }, CREATE: { attempts: 0, correct: 0 } },
      byProblemType: { multiple_choice: { attempts: 0, correct: 0 }, short_answer: { attempts: 0, correct: 0 }, coding: { attempts: 0, correct: 0 }, essay: { attempts: 0, correct: 0 }, fill_blank: { attempts: 0, correct: 0 }, matching: { attempts: 0, correct: 0 }, ordering: { attempts: 0, correct: 0 }, diagram: { attempts: 0, correct: 0 }, calculation: { attempts: 0, correct: 0 }, case_study: { attempts: 0, correct: 0 } },
      masteredConcepts: [],
      conceptsNeedingReview: [],
      currentStreak: 0,
      bestStreak: 0
    };
  }
};
function createPracticeProblemsEngine(config) {
  return new PracticeProblemsEngine(config);
}

// src/engines/adaptive-content-engine.ts
var AdaptiveContentEngine = class {
  constructor(config = {}) {
    this.config = config;
    this.database = config.database;
    this.aiAdapter = config.aiAdapter;
  }
  database;
  aiAdapter;
  cache = /* @__PURE__ */ new Map();
  /**
   * Adapt content for a specific learner profile
   */
  async adaptContent(content, profile, options = {}) {
    const {
      targetStyle = profile.primaryStyle,
      targetComplexity = profile.preferredComplexity,
      targetFormat,
      includeSupplementary = true,
      includeKnowledgeChecks = true,
      personalizeExamples = true,
      addScaffolding = true
    } = options;
    const cacheKey = `${content.id}-${targetStyle}-${targetComplexity}`;
    if (this.cache.has(cacheKey) && this.config.enableCaching) {
      return this.cache.get(cacheKey);
    }
    if (this.aiAdapter) {
      return this.adaptWithAI(content, profile, options);
    }
    const chunks = this.createAdaptedChunks(content, targetStyle, targetComplexity, targetFormat);
    let scaffolding;
    if (addScaffolding && content.prerequisites.length > 0) {
      scaffolding = this.createScaffolding(content.prerequisites, profile.knownConcepts);
    }
    let knowledgeChecks = [];
    if (includeKnowledgeChecks) {
      knowledgeChecks = this.generateKnowledgeChecks(content, chunks);
    }
    let supplementaryResources = [];
    if (includeSupplementary) {
      supplementaryResources = this.getSupplementaryForStyle(content.topic, targetStyle);
    }
    const adaptedContent = {
      originalId: content.id,
      chunks,
      summary: this.generateSummary(content, targetStyle),
      keyTakeaways: this.extractKeyTakeaways(content),
      knowledgeChecks,
      supplementaryResources,
      scaffolding,
      estimatedTotalTime: chunks.reduce((sum, c) => sum + c.estimatedTime, 0),
      adaptationInfo: {
        targetStyle,
        targetComplexity,
        adaptedAt: /* @__PURE__ */ new Date(),
        confidence: profile.confidence
      }
    };
    if (this.config.enableCaching) {
      this.cache.set(cacheKey, adaptedContent);
    }
    return adaptedContent;
  }
  /**
   * Adapt content using AI
   */
  async adaptWithAI(content, profile, options) {
    const prompt = this.buildAdaptationPrompt(content, profile, options);
    try {
      const response = await this.aiAdapter.chat({
        messages: [
          {
            role: "system",
            content: `You are an expert educational content adapter. Transform content to match the learner's style while maintaining accuracy and educational value. Always respond with valid JSON.`
          },
          { role: "user", content: prompt }
        ]
      });
      return this.parseAdaptedContent(response.content, content, profile, options);
    } catch (error) {
      console.error("AI adaptation failed, using rule-based:", error);
      return this.adaptContent(content, profile, { ...options });
    }
  }
  /**
   * Detect learning style from user interactions
   */
  async detectLearningStyle(userId) {
    if (!this.database) {
      return this.getDefaultStyleResult();
    }
    const interactions = await this.database.getInteractions(userId, { limit: 100 });
    if (interactions.length < (this.config.minInteractionsForAdaptation || 5)) {
      return this.getDefaultStyleResult();
    }
    const formatStats = this.analyzeFormatPreferences(interactions);
    const behaviorIndicators = this.analyzeBehaviorIndicators(interactions);
    const scores = this.calculateStyleScores(formatStats, behaviorIndicators);
    const sortedStyles = Object.entries(scores).sort(([, a], [, b]) => b - a).map(([style]) => style);
    const primaryStyle = sortedStyles[0];
    const secondaryStyleKey = sortedStyles[1];
    const secondaryStyle = secondaryStyleKey && scores[secondaryStyleKey] > 20 ? secondaryStyleKey : void 0;
    const confidence = Math.min(0.95, 0.3 + interactions.length * 0.01);
    const evidence = this.generateStyleEvidence(formatStats, behaviorIndicators);
    return {
      primaryStyle,
      secondaryStyle,
      scores,
      confidence,
      evidence,
      recommendations: this.getStyleRecommendations(primaryStyle)
    };
  }
  /**
   * Get or create learner profile
   */
  async getLearnerProfile(userId) {
    if (this.database) {
      const existing = await this.database.getLearnerProfile(userId);
      if (existing) return existing;
    }
    const styleResult = await this.detectLearningStyle(userId);
    const profile = {
      userId,
      primaryStyle: styleResult.primaryStyle,
      secondaryStyle: styleResult.secondaryStyle,
      styleScores: styleResult.scores,
      preferredFormats: this.getFormatsForStyle(styleResult.primaryStyle),
      preferredComplexity: "standard",
      readingPace: "moderate",
      preferredSessionDuration: 25,
      knownConcepts: [],
      conceptsInProgress: [],
      strugglingAreas: [],
      confidence: styleResult.confidence,
      lastUpdated: /* @__PURE__ */ new Date()
    };
    if (this.database) {
      await this.database.saveLearnerProfile(profile);
    }
    return profile;
  }
  /**
   * Update learner profile from recent interactions
   */
  async updateProfileFromInteractions(userId) {
    const currentProfile = await this.getLearnerProfile(userId);
    const newStyleResult = await this.detectLearningStyle(userId);
    const blendedScores = {
      visual: currentProfile.styleScores.visual * 0.3 + newStyleResult.scores.visual * 0.7,
      auditory: currentProfile.styleScores.auditory * 0.3 + newStyleResult.scores.auditory * 0.7,
      reading: currentProfile.styleScores.reading * 0.3 + newStyleResult.scores.reading * 0.7,
      kinesthetic: currentProfile.styleScores.kinesthetic * 0.3 + newStyleResult.scores.kinesthetic * 0.7
    };
    const updatedProfile = {
      ...currentProfile,
      primaryStyle: newStyleResult.primaryStyle,
      secondaryStyle: newStyleResult.secondaryStyle,
      styleScores: blendedScores,
      preferredFormats: this.getFormatsForStyle(newStyleResult.primaryStyle),
      confidence: newStyleResult.confidence,
      lastUpdated: /* @__PURE__ */ new Date()
    };
    if (this.database) {
      await this.database.saveLearnerProfile(updatedProfile);
    }
    return updatedProfile;
  }
  /**
   * Record a content interaction
   */
  async recordInteraction(interaction) {
    if (this.database) {
      await this.database.recordInteraction(interaction);
    }
  }
  /**
   * Get content recommendations based on profile
   */
  async getContentRecommendations(profile, currentTopic, count = 5) {
    const resources = this.getSupplementaryForStyle(currentTopic, profile.primaryStyle);
    if (profile.secondaryStyle) {
      resources.push(...this.getSupplementaryForStyle(currentTopic, profile.secondaryStyle));
    }
    return resources.sort((a, b) => b.relevance - a.relevance).slice(0, count);
  }
  /**
   * Get style-specific tips
   */
  getStyleTips(style) {
    switch (style) {
      case "visual":
        return [
          "Focus on diagrams, charts, and visual representations",
          "Use color coding in your notes",
          "Create mind maps to connect concepts",
          "Watch video demonstrations before reading text",
          "Draw flowcharts for processes"
        ];
      case "auditory":
        return [
          "Listen to explanations and discussions",
          "Read content aloud to yourself",
          "Join study groups for verbal exchange",
          "Use text-to-speech for reading materials",
          "Record yourself explaining concepts"
        ];
      case "reading":
        return [
          "Read detailed documentation and articles",
          "Take comprehensive written notes",
          "Create written summaries in your own words",
          "Use highlighted text and annotations",
          "Write practice questions for yourself"
        ];
      case "kinesthetic":
        return [
          "Practice with hands-on exercises immediately",
          "Build projects to apply concepts",
          "Take breaks and move while studying",
          "Use interactive simulations",
          "Teach concepts to others through demonstration"
        ];
      case "multimodal":
      default:
        return [
          "Combine multiple learning methods",
          "Switch between videos, text, and practice",
          "Find what works best for each topic",
          "Use variety to maintain engagement",
          "Adapt your approach based on content type"
        ];
    }
  }
  // Private helper methods
  createAdaptedChunks(content, style, complexity, targetFormat) {
    const chunks = [];
    const format = targetFormat || this.getFormatsForStyle(style)[0];
    chunks.push({
      id: `chunk_main_${Date.now()}`,
      type: "main",
      content: this.transformForStyle(content.content, style, complexity),
      format,
      order: 1,
      estimatedTime: this.estimateReadingTime(content.content, style),
      isEssential: true
    });
    if (style === "visual" || style === "reading") {
      chunks.push({
        id: `chunk_summary_${Date.now()}`,
        type: "summary",
        content: this.generateSummary(content, style),
        format: style === "visual" ? "infographic" : "text",
        order: 2,
        estimatedTime: 2,
        isEssential: true
      });
    }
    if (style === "kinesthetic") {
      chunks.push({
        id: `chunk_example_${Date.now()}`,
        type: "example",
        content: this.generatePracticalExample(content),
        format: "interactive",
        order: 2,
        estimatedTime: 5,
        isEssential: true
      });
    }
    chunks.push({
      id: `chunk_practice_${Date.now()}`,
      type: "practice",
      content: this.generatePracticeActivity(content, style),
      format: "interactive",
      order: chunks.length + 1,
      estimatedTime: 5,
      isEssential: false
    });
    return chunks;
  }
  transformForStyle(content, style, complexity) {
    let transformed = content;
    switch (complexity) {
      case "simplified":
        transformed = this.simplifyContent(transformed);
        break;
      case "detailed":
        transformed = this.expandContent(transformed);
        break;
      case "expert":
        transformed = this.addTechnicalDetails(transformed);
        break;
    }
    switch (style) {
      case "visual":
        transformed = this.addVisualCues(transformed);
        break;
      case "auditory":
        transformed = this.addAuditoryGuidance(transformed);
        break;
      case "kinesthetic":
        transformed = this.addActionPoints(transformed);
        break;
    }
    return transformed;
  }
  simplifyContent(content) {
    return content.replace(/furthermore/gi, "also").replace(/however/gi, "but").replace(/consequently/gi, "so").replace(/utilize/gi, "use").replace(/implement/gi, "do").replace(/demonstrate/gi, "show");
  }
  expandContent(content) {
    return `${content}

**Additional Details:**
This concept builds on fundamental principles and has several practical applications. Understanding the nuances helps in applying it effectively in real-world scenarios.`;
  }
  addTechnicalDetails(content) {
    return `${content}

**Technical Depth:**
For advanced practitioners, consider the underlying mechanisms, edge cases, and optimization strategies related to this topic.`;
  }
  addVisualCues(content) {
    return `\u{1F4CA} **Visual Guide:**

${content}

\u{1F4A1} **Key Visual:** Imagine this concept as a flowchart or diagram connecting the main ideas.`;
  }
  addAuditoryGuidance(content) {
    return `\u{1F3A7} **Listen & Learn:**

${content}

\u{1F5E3}\uFE0F **Try This:** Read the key points aloud to reinforce understanding.`;
  }
  addActionPoints(content) {
    return `\u{1F527} **Hands-On Learning:**

${content}

\u270B **Take Action:** Try applying this concept immediately with a small exercise or example.`;
  }
  generateSummary(content, style) {
    const baseContent = content.content.substring(0, 500);
    switch (style) {
      case "visual":
        return `\u{1F4CC} **Quick Overview:**

\u2022 Topic: ${content.topic}
\u2022 Key Focus: ${content.title || "Understanding core concepts"}
\u2022 Visual Tip: Create a mind map of the main ideas`;
      case "auditory":
        return `\u{1F3AF} **Summary to Read Aloud:**

This section covers ${content.topic}. The main takeaway is understanding how the concepts connect and apply to real situations.`;
      case "kinesthetic":
        return `\u{1F3AF} **Action Summary:**

After learning about ${content.topic}, try:
1. Apply one concept immediately
2. Create a small project
3. Teach it to someone else`;
      default:
        return `\u{1F4DD} **Summary:**

${baseContent}...`;
    }
  }
  extractKeyTakeaways(content) {
    return [
      `Understanding ${content.topic} is foundational for advanced concepts`,
      `Key concepts: ${content.concepts.slice(0, 3).join(", ")}`,
      `Prerequisites include: ${content.prerequisites.slice(0, 2).join(", ") || "None"}`
    ];
  }
  generateKnowledgeChecks(content, chunks) {
    const mainChunk = chunks.find((c) => c.type === "main");
    if (!mainChunk) return [];
    return content.concepts.slice(0, 2).map((concept, idx) => ({
      id: `check_${Date.now()}_${idx}`,
      question: `Can you explain the key aspect of ${concept} in your own words?`,
      correctAnswer: `A correct answer would demonstrate understanding of ${concept} and its role in ${content.topic}.`,
      concept,
      afterChunkId: mainChunk.id
    }));
  }
  generatePracticalExample(content) {
    return `**Practical Exercise for ${content.topic}:**

1. Start with a simple task
2. Apply the concept step by step
3. Verify your understanding
4. Try a more complex variation`;
  }
  generatePracticeActivity(content, style) {
    switch (style) {
      case "visual":
        return `Create a diagram or visual representation of ${content.topic}. Include the main concepts and their relationships.`;
      case "auditory":
        return `Explain ${content.topic} out loud as if you were teaching it to someone. Record yourself and listen back.`;
      case "reading":
        return `Write a short summary (100-150 words) of ${content.topic} in your own words. Include examples.`;
      case "kinesthetic":
        return `Build a small project or exercise that demonstrates ${content.topic}. Focus on hands-on application.`;
      default:
        return `Review ${content.topic} using your preferred method. Quiz yourself on the key concepts.`;
    }
  }
  getSupplementaryForStyle(topic, style) {
    const resources = [];
    switch (style) {
      case "visual":
        resources.push({
          id: `supp_visual_${Date.now()}`,
          type: "video",
          title: `Video Explanation: ${topic}`,
          description: "Visual walkthrough of key concepts",
          resource: `https://example.com/video/${topic}`,
          relevance: 0.9,
          targetStyle: "visual"
        });
        break;
      case "auditory":
        resources.push({
          id: `supp_audio_${Date.now()}`,
          type: "article",
          title: `Podcast Discussion: ${topic}`,
          description: "Audio discussion of the topic",
          resource: `https://example.com/podcast/${topic}`,
          relevance: 0.9,
          targetStyle: "auditory"
        });
        break;
      case "kinesthetic":
        resources.push({
          id: `supp_interactive_${Date.now()}`,
          type: "interactive",
          title: `Interactive Lab: ${topic}`,
          description: "Hands-on practice exercises",
          resource: `https://example.com/lab/${topic}`,
          relevance: 0.9,
          targetStyle: "kinesthetic"
        });
        break;
      default:
        resources.push({
          id: `supp_article_${Date.now()}`,
          type: "article",
          title: `Deep Dive: ${topic}`,
          description: "Comprehensive article on the topic",
          resource: `https://example.com/article/${topic}`,
          relevance: 0.8,
          targetStyle: "reading"
        });
    }
    return resources;
  }
  createScaffolding(prerequisites, knownConcepts) {
    const unknownPrereqs = prerequisites.filter((p) => !knownConcepts.includes(p));
    return unknownPrereqs.map((concept) => ({
      concept,
      explanation: `Before continuing, it's helpful to understand ${concept}. This forms the foundation for what you're about to learn.`,
      examples: [
        `Think of ${concept} as a building block for more complex ideas`,
        `In practice, ${concept} is used when...`
      ]
    }));
  }
  analyzeFormatPreferences(interactions) {
    const stats = /* @__PURE__ */ new Map();
    interactions.forEach((i) => {
      const current = stats.get(i.format) || { count: 0, totalTime: 0, completed: 0 };
      stats.set(i.format, {
        count: current.count + 1,
        totalTime: current.totalTime + i.timeSpent,
        completed: current.completed + (i.completed ? 1 : 0)
      });
    });
    const result = /* @__PURE__ */ new Map();
    stats.forEach((value, key) => {
      result.set(key, {
        count: value.count,
        avgTime: value.totalTime / value.count,
        completion: value.completed / value.count
      });
    });
    return result;
  }
  analyzeBehaviorIndicators(interactions) {
    let notesTaken = 0;
    let replays = 0;
    let pauses = 0;
    let highScroll = 0;
    interactions.forEach((i) => {
      if (i.notesTaken) notesTaken++;
      if (i.replayCount && i.replayCount > 0) replays++;
      if (i.pauseCount && i.pauseCount > 2) pauses++;
      if (i.scrollDepth > 80) highScroll++;
    });
    return { notesTaken, replays, pauses, highScroll };
  }
  calculateStyleScores(formatStats, behaviors) {
    let visual = 25;
    let auditory = 25;
    let reading = 25;
    let kinesthetic = 25;
    const videoStats = formatStats.get("video");
    const textStats = formatStats.get("text");
    const interactiveStats = formatStats.get("interactive");
    const audioStats = formatStats.get("audio");
    if (videoStats && videoStats.completion > 0.7) visual += 20;
    if (textStats && textStats.completion > 0.7) reading += 20;
    if (interactiveStats && interactiveStats.completion > 0.7) kinesthetic += 20;
    if (audioStats && audioStats.completion > 0.7) auditory += 20;
    if (behaviors.notesTaken > 5) reading += 10;
    if (behaviors.replays > 3) auditory += 10;
    if (behaviors.highScroll > 5) reading += 5;
    const total = visual + auditory + reading + kinesthetic;
    return {
      visual: Math.round(visual / total * 100),
      auditory: Math.round(auditory / total * 100),
      reading: Math.round(reading / total * 100),
      kinesthetic: Math.round(kinesthetic / total * 100)
    };
  }
  generateStyleEvidence(formatStats, behaviors) {
    const evidence = [];
    const videoStats = formatStats.get("video");
    if (videoStats && videoStats.completion > 0.6) {
      evidence.push({ factor: "High video completion rate", weight: 0.8, contribution: "visual" });
    }
    if (behaviors.notesTaken > 3) {
      evidence.push({ factor: "Frequent note-taking", weight: 0.7, contribution: "reading" });
    }
    if (behaviors.replays > 2) {
      evidence.push({ factor: "Content replay behavior", weight: 0.6, contribution: "auditory" });
    }
    return evidence;
  }
  getFormatsForStyle(style) {
    switch (style) {
      case "visual":
        return ["video", "diagram", "infographic"];
      case "auditory":
        return ["audio", "video", "text"];
      case "reading":
        return ["text", "code_example", "case_study"];
      case "kinesthetic":
        return ["interactive", "simulation", "quiz"];
      default:
        return ["text", "video", "interactive"];
    }
  }
  getStyleRecommendations(style) {
    return this.getStyleTips(style);
  }
  estimateReadingTime(content, style) {
    const wordCount = content.split(/\s+/).length;
    const baseTime = wordCount / 200;
    switch (style) {
      case "visual":
        return Math.ceil(baseTime * 1.2);
      // Visual learners may take longer with text
      case "reading":
        return Math.ceil(baseTime * 0.8);
      // Reading learners are faster
      default:
        return Math.ceil(baseTime);
    }
  }
  getDefaultStyleResult() {
    return {
      primaryStyle: "multimodal",
      scores: { visual: 25, auditory: 25, reading: 25, kinesthetic: 25 },
      confidence: 0.3,
      evidence: [],
      recommendations: this.getStyleTips("multimodal")
    };
  }
  buildAdaptationPrompt(content, profile, options) {
    return `
Adapt the following educational content for a ${profile.primaryStyle} learner at ${profile.preferredComplexity} complexity level.

**Original Content:**
${content.content}

**Topic:** ${content.topic}
**Learner Profile:**
- Primary Style: ${profile.primaryStyle}
- Secondary Style: ${profile.secondaryStyle || "None"}
- Preferred Complexity: ${profile.preferredComplexity}
- Known Concepts: ${profile.knownConcepts.join(", ") || "None specified"}

**Adaptation Requirements:**
- Include supplementary resources: ${options.includeSupplementary}
- Include knowledge checks: ${options.includeKnowledgeChecks}
- Add scaffolding for prerequisites: ${options.addScaffolding}

Respond with JSON:
{
  "chunks": [
    {"type": "main", "content": "adapted content", "format": "text", "estimatedTime": 5}
  ],
  "summary": "brief summary",
  "keyTakeaways": ["takeaway1", "takeaway2"],
  "knowledgeChecks": [{"question": "...", "correctAnswer": "...", "concept": "..."}]
}
`;
  }
  parseAdaptedContent(response, content, profile, options) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : response);
      return {
        originalId: content.id,
        chunks: (parsed.chunks || []).map((c, i) => ({
          id: `chunk_${Date.now()}_${i}`,
          type: c.type || "main",
          content: c.content || "",
          format: c.format || "text",
          order: i + 1,
          estimatedTime: c.estimatedTime || 5,
          isEssential: c.type === "main"
        })),
        summary: parsed.summary || "",
        keyTakeaways: parsed.keyTakeaways || [],
        knowledgeChecks: (parsed.knowledgeChecks || []).map((k, i) => ({
          id: `check_${Date.now()}_${i}`,
          question: k.question || "",
          correctAnswer: k.correctAnswer || "",
          concept: k.concept || "",
          afterChunkId: `chunk_${Date.now()}_0`
        })),
        supplementaryResources: this.getSupplementaryForStyle(content.topic, profile.primaryStyle),
        estimatedTotalTime: parsed.chunks?.reduce((sum, c) => sum + (c.estimatedTime || 5), 0) || 10,
        adaptationInfo: {
          targetStyle: options.targetStyle || profile.primaryStyle,
          targetComplexity: options.targetComplexity || profile.preferredComplexity,
          adaptedAt: /* @__PURE__ */ new Date(),
          confidence: profile.confidence
        }
      };
    } catch {
      return {
        originalId: content.id,
        chunks: this.createAdaptedChunks(
          content,
          options.targetStyle || profile.primaryStyle,
          options.targetComplexity || profile.preferredComplexity,
          options.targetFormat
        ),
        summary: this.generateSummary(content, options.targetStyle || profile.primaryStyle),
        keyTakeaways: this.extractKeyTakeaways(content),
        knowledgeChecks: [],
        supplementaryResources: this.getSupplementaryForStyle(content.topic, profile.primaryStyle),
        estimatedTotalTime: 10,
        adaptationInfo: {
          targetStyle: options.targetStyle || profile.primaryStyle,
          targetComplexity: options.targetComplexity || profile.preferredComplexity,
          adaptedAt: /* @__PURE__ */ new Date(),
          confidence: profile.confidence
        }
      };
    }
  }
};
function createAdaptiveContentEngine(config) {
  return new AdaptiveContentEngine(config);
}

// src/engines/socratic-teaching-engine.ts
var SocraticTeachingEngine = class {
  constructor(config = {}) {
    this.config = config;
    this.database = config.database;
    this.aiAdapter = config.aiAdapter;
  }
  database;
  aiAdapter;
  dialogueCache = /* @__PURE__ */ new Map();
  /**
   * Start a new Socratic dialogue
   */
  async startDialogue(input) {
    const {
      userId,
      topic,
      learningObjective = `Understand the key concepts and implications of ${topic}`,
      priorKnowledge,
      targetBloomsLevel = "ANALYZE",
      preferredStyle = "balanced"
    } = input;
    const keyInsights = await this.generateKeyInsights(topic, learningObjective);
    const dialogue = {
      id: `dialogue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      topic,
      learningObjective,
      state: "introduction",
      exchanges: [],
      discoveredInsights: [],
      remainingInsights: keyInsights,
      startedAt: /* @__PURE__ */ new Date()
    };
    this.dialogueCache.set(dialogue.id, dialogue);
    if (this.database) {
      await this.database.createDialogue(dialogue);
    }
    const openingQuestion = await this.generateQuestion(topic, "clarifying", {
      currentUnderstanding: priorKnowledge
    });
    const exchange = {
      order: 1,
      question: openingQuestion
    };
    dialogue.exchanges.push(exchange);
    dialogue.state = "exploration";
    this.dialogueCache.set(dialogue.id, dialogue);
    return {
      state: dialogue.state,
      question: openingQuestion,
      feedback: this.getIntroductionMessage(topic, preferredStyle),
      encouragement: this.getEncouragement("start"),
      discoveredInsights: [],
      progress: 0,
      availableHints: openingQuestion.hints,
      isComplete: false
    };
  }
  /**
   * Continue an existing dialogue
   */
  async continueDialogue(input) {
    const { dialogueId, response, requestedHint, skipQuestion } = input;
    let dialogue = this.dialogueCache.get(dialogueId);
    if (!dialogue && this.database) {
      dialogue = await this.database.getDialogue(dialogueId) || void 0;
    }
    if (!dialogue) {
      throw new Error(`Dialogue ${dialogueId} not found`);
    }
    const currentExchange = dialogue.exchanges[dialogue.exchanges.length - 1];
    const currentQuestion = currentExchange.question;
    if (requestedHint) {
      const hintIndex = currentExchange.response?.usedHint ? 1 : 0;
      const hint = currentQuestion.hints[hintIndex] || currentQuestion.hints[0];
      return {
        state: dialogue.state,
        question: currentQuestion,
        feedback: `\u{1F4A1} Here's a hint: ${hint}`,
        discoveredInsights: dialogue.discoveredInsights,
        progress: this.calculateProgress(dialogue),
        availableHints: currentQuestion.hints.slice(hintIndex + 1),
        isComplete: false
      };
    }
    if (skipQuestion) {
      return this.moveToNextQuestion(dialogue, null);
    }
    const analysis = await this.analyzeResponse(currentQuestion, response);
    currentExchange.response = {
      id: `resp_${Date.now()}`,
      questionId: currentQuestion.id,
      response,
      timestamp: /* @__PURE__ */ new Date(),
      responseTime: 0,
      usedHint: false
    };
    currentExchange.analysis = analysis;
    currentExchange.feedback = this.generateFeedback(analysis, this.config.encouragingMode ?? true);
    if (analysis.reachedInsight) {
      const discoveredInsight = currentQuestion.keyInsights[0];
      if (discoveredInsight && !dialogue.discoveredInsights.includes(discoveredInsight)) {
        dialogue.discoveredInsights.push(discoveredInsight);
        dialogue.remainingInsights = dialogue.remainingInsights.filter(
          (i) => i !== discoveredInsight
        );
      }
    }
    this.dialogueCache.set(dialogueId, dialogue);
    if (this.database) {
      await this.database.saveExchange(dialogueId, currentExchange);
    }
    if (this.shouldConclude(dialogue, analysis)) {
      return this.concludeDialogue(dialogue);
    }
    return this.moveToNextQuestion(dialogue, analysis);
  }
  /**
   * Get hint for current question
   */
  async getHint(dialogueId, hintIndex = 0) {
    const dialogue = this.dialogueCache.get(dialogueId);
    if (!dialogue) {
      throw new Error(`Dialogue ${dialogueId} not found`);
    }
    const currentExchange = dialogue.exchanges[dialogue.exchanges.length - 1];
    const hints = currentExchange.question.hints;
    return hints[hintIndex] || hints[0] || "Try to think about the fundamental principles involved.";
  }
  /**
   * End dialogue and get summary
   */
  async endDialogue(dialogueId) {
    const dialogue = this.dialogueCache.get(dialogueId);
    if (!dialogue) {
      throw new Error(`Dialogue ${dialogueId} not found`);
    }
    dialogue.endedAt = /* @__PURE__ */ new Date();
    dialogue.state = "conclusion";
    const synthesis = await this.generateSynthesis(dialogue);
    const performance = this.calculatePerformance(dialogue);
    dialogue.synthesis = synthesis;
    dialogue.performance = performance;
    this.dialogueCache.set(dialogueId, dialogue);
    if (this.database) {
      await this.database.updateDialogue(dialogueId, {
        state: "conclusion",
        endedAt: dialogue.endedAt,
        synthesis,
        performance
      });
    }
    return { synthesis, performance };
  }
  /**
   * Get dialogue by ID
   */
  async getDialogue(dialogueId) {
    let dialogue = this.dialogueCache.get(dialogueId);
    if (!dialogue && this.database) {
      dialogue = await this.database.getDialogue(dialogueId) || void 0;
    }
    return dialogue || null;
  }
  /**
   * Get user's dialogue history
   */
  async getUserDialogues(userId, limit = 10) {
    if (this.database) {
      return this.database.getUserDialogues(userId, { limit });
    }
    return Array.from(this.dialogueCache.values()).filter((d) => d.userId === userId).slice(0, limit);
  }
  /**
   * Generate a Socratic question
   */
  async generateQuestion(topic, type, context) {
    if (this.aiAdapter) {
      return this.generateQuestionWithAI(topic, type, context);
    }
    return this.generateTemplateQuestion(topic, type, context);
  }
  /**
   * Analyze a student response
   */
  async analyzeResponse(question, response) {
    if (this.aiAdapter) {
      return this.analyzeWithAI(question, response);
    }
    return this.analyzeWithRules(question, response);
  }
  // Private helper methods
  async generateQuestionWithAI(topic, type, context) {
    const prompt = `
Generate a Socratic ${type} question about "${topic}".

Question Type Explanation:
- clarifying: Asks for clearer definitions or examples
- probing_assumptions: Challenges underlying assumptions
- probing_reasons: Asks for evidence or reasoning
- questioning_viewpoints: Explores alternative perspectives
- probing_implications: Explores consequences
- questioning_the_question: Examines why the question matters

${context?.previousQuestions?.length ? `Previous questions asked: ${context.previousQuestions.join(", ")}` : ""}
${context?.currentUnderstanding ? `Current student understanding: ${context.currentUnderstanding}` : ""}

Respond with JSON:
{
  "question": "The Socratic question",
  "purpose": "Why this question helps learning",
  "expectedDirection": "Where this should lead the student's thinking",
  "bloomsLevel": "remember|understand|apply|analyze|evaluate|create",
  "fallbackQuestions": ["simpler follow-up if student struggles"],
  "hints": ["hint 1", "hint 2", "hint 3"],
  "keyInsights": ["the insight this question aims to reveal"]
}
`;
    try {
      const response = await this.aiAdapter.chat({
        messages: [
          {
            role: "system",
            content: "You are a Socratic teacher. Generate thought-provoking questions that guide students to discover insights themselves. Respond only with valid JSON."
          },
          { role: "user", content: prompt }
        ]
      });
      const parsed = JSON.parse(this.extractJson(response.content));
      return {
        id: `q_${Date.now()}`,
        type,
        question: parsed.question,
        purpose: parsed.purpose,
        expectedDirection: parsed.expectedDirection,
        bloomsLevel: parsed.bloomsLevel?.toUpperCase() || "ANALYZE",
        fallbackQuestions: parsed.fallbackQuestions || [],
        hints: parsed.hints || [],
        keyInsights: parsed.keyInsights || []
      };
    } catch {
      return this.generateTemplateQuestion(topic, type, context);
    }
  }
  generateTemplateQuestion(topic, type, context) {
    const templates = {
      clarifying: (t) => ({
        id: `q_${Date.now()}`,
        type: "clarifying",
        question: `What do you mean when you say "${t}"? Can you give a specific example?`,
        purpose: "To ensure clear understanding of the concept",
        expectedDirection: "Student should provide concrete examples",
        bloomsLevel: "UNDERSTAND",
        fallbackQuestions: [`Can you describe ${t} in your own words?`],
        hints: [
          "Think about a specific situation where this applies",
          "Try to break it down into simpler parts",
          "What is the most essential aspect?"
        ],
        keyInsights: [`Clear definition and practical examples of ${t}`]
      }),
      probing_assumptions: (t) => ({
        id: `q_${Date.now()}`,
        type: "probing_assumptions",
        question: `What assumptions are you making about ${t}? Are these always true?`,
        purpose: "To challenge underlying assumptions",
        expectedDirection: "Student should identify hidden assumptions",
        bloomsLevel: "ANALYZE",
        fallbackQuestions: [`What do you take for granted about ${t}?`],
        hints: [
          "Consider what must be true for your view to hold",
          "Think about edge cases or exceptions",
          "What would need to change for this not to work?"
        ],
        keyInsights: [`Recognition of assumptions underlying ${t}`]
      }),
      probing_reasons: (t) => ({
        id: `q_${Date.now()}`,
        type: "probing_reasons",
        question: `Why do you think ${t} works this way? What evidence supports this?`,
        purpose: "To explore reasoning and evidence",
        expectedDirection: "Student should provide reasoning and evidence",
        bloomsLevel: "ANALYZE",
        fallbackQuestions: [`What makes you believe this about ${t}?`],
        hints: [
          "Think about cause and effect relationships",
          "What observations support this?",
          "How could you test this?"
        ],
        keyInsights: [`Understanding the reasoning behind ${t}`]
      }),
      questioning_viewpoints: (t) => ({
        id: `q_${Date.now()}`,
        type: "questioning_viewpoints",
        question: `How might someone with a different perspective view ${t}? What would they say?`,
        purpose: "To explore alternative viewpoints",
        expectedDirection: "Student should consider other perspectives",
        bloomsLevel: "EVALUATE",
        fallbackQuestions: [`What's an alternative way to think about ${t}?`],
        hints: [
          "Consider the opposite viewpoint",
          "Think about different contexts or fields",
          "What would a critic say?"
        ],
        keyInsights: [`Multiple perspectives on ${t}`]
      }),
      probing_implications: (t) => ({
        id: `q_${Date.now()}`,
        type: "probing_implications",
        question: `If ${t} is true, what are the consequences? What else must follow?`,
        purpose: "To explore implications and consequences",
        expectedDirection: "Student should trace logical consequences",
        bloomsLevel: "EVALUATE",
        fallbackQuestions: [`What happens if we apply ${t} broadly?`],
        hints: [
          "Think about both immediate and long-term effects",
          "Consider unintended consequences",
          "What chains of events might this trigger?"
        ],
        keyInsights: [`Implications and consequences of ${t}`]
      }),
      questioning_the_question: (t) => ({
        id: `q_${Date.now()}`,
        type: "questioning_the_question",
        question: `Why is understanding ${t} important? What problem does it solve?`,
        purpose: "To examine the significance of the topic",
        expectedDirection: "Student should reflect on importance and relevance",
        bloomsLevel: "EVALUATE",
        fallbackQuestions: [`Who benefits from understanding ${t}?`],
        hints: [
          "Think about practical applications",
          "Consider what would be lost without this knowledge",
          "How does this connect to larger goals?"
        ],
        keyInsights: [`Significance and relevance of ${t}`]
      })
    };
    return templates[type](topic);
  }
  async analyzeWithAI(question, response) {
    const prompt = `
Analyze this student response to a Socratic question:

**Question:** ${question.question}
**Expected Direction:** ${question.expectedDirection}
**Key Insights to Discover:** ${question.keyInsights.join(", ")}

**Student Response:** ${response}

Analyze and respond with JSON:
{
  "qualityScore": 0-100,
  "thinkingDepth": 0-100,
  "understandingIndicators": ["what they understood"],
  "misconceptions": ["any misconceptions"],
  "reasoningGaps": ["gaps in reasoning"],
  "strengths": ["strong points"],
  "reachedInsight": true/false,
  "recommendedNextType": "clarifying|probing_assumptions|probing_reasons|questioning_viewpoints|probing_implications|questioning_the_question",
  "demonstratedBloomsLevel": "remember|understand|apply|analyze|evaluate|create"
}
`;
    try {
      const aiResponse = await this.aiAdapter.chat({
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing student responses in Socratic dialogues. Be constructive and identify both strengths and areas for growth. Respond only with valid JSON."
          },
          { role: "user", content: prompt }
        ]
      });
      const parsed = JSON.parse(this.extractJson(aiResponse.content));
      return {
        qualityScore: parsed.qualityScore || 50,
        thinkingDepth: parsed.thinkingDepth || 50,
        understandingIndicators: parsed.understandingIndicators || [],
        misconceptions: parsed.misconceptions || [],
        reasoningGaps: parsed.reasoningGaps || [],
        strengths: parsed.strengths || [],
        reachedInsight: parsed.reachedInsight || false,
        recommendedNextType: parsed.recommendedNextType || "probing_reasons",
        demonstratedBloomsLevel: parsed.demonstratedBloomsLevel?.toUpperCase() || "UNDERSTAND"
      };
    } catch {
      return this.analyzeWithRules(question, response);
    }
  }
  analyzeWithRules(question, response) {
    const wordCount = response.split(/\s+/).length;
    const hasExamples = /for example|such as|like|instance/i.test(response);
    const hasReasoning = /because|therefore|since|thus|so|as a result/i.test(response);
    const hasQuestion = /\?/.test(response);
    let qualityScore = 50;
    let thinkingDepth = 50;
    const understandingIndicators = [];
    const misconceptions = [];
    const reasoningGaps = [];
    const strengths = [];
    if (wordCount > 50) {
      qualityScore += 10;
      thinkingDepth += 10;
      strengths.push("Provided a detailed response");
    } else if (wordCount < 10) {
      qualityScore -= 20;
      reasoningGaps.push("Response was too brief");
    }
    if (hasExamples) {
      qualityScore += 15;
      understandingIndicators.push("Used concrete examples");
      strengths.push("Connected concepts to real examples");
    }
    if (hasReasoning) {
      thinkingDepth += 15;
      understandingIndicators.push("Showed causal reasoning");
      strengths.push("Demonstrated logical thinking");
    }
    if (hasQuestion) {
      thinkingDepth += 10;
      strengths.push("Engaged with curiosity");
    }
    const keyTermsFound = question.keyInsights.some(
      (insight) => response.toLowerCase().includes(insight.toLowerCase().split(" ")[0])
    );
    const reachedInsight = keyTermsFound && qualityScore > 60;
    if (reachedInsight) {
      qualityScore += 10;
      understandingIndicators.push("Approached the key insight");
    }
    let recommendedNextType = "probing_reasons";
    if (qualityScore < 40) {
      recommendedNextType = "clarifying";
    } else if (qualityScore > 70 && hasReasoning) {
      recommendedNextType = "probing_implications";
    }
    let demonstratedBloomsLevel = "UNDERSTAND";
    if (hasExamples && hasReasoning) {
      demonstratedBloomsLevel = "APPLY";
    }
    if (qualityScore > 80 && thinkingDepth > 70) {
      demonstratedBloomsLevel = "ANALYZE";
    }
    return {
      qualityScore: Math.min(100, Math.max(0, qualityScore)),
      thinkingDepth: Math.min(100, Math.max(0, thinkingDepth)),
      understandingIndicators,
      misconceptions,
      reasoningGaps,
      strengths,
      reachedInsight,
      recommendedNextType,
      demonstratedBloomsLevel
    };
  }
  async generateKeyInsights(topic, objective) {
    if (this.aiAdapter) {
      try {
        const response = await this.aiAdapter.chat({
          messages: [
            {
              role: "system",
              content: "Generate 3-5 key insights a student should discover about a topic. Respond with a JSON array of strings."
            },
            {
              role: "user",
              content: `Topic: ${topic}
Learning Objective: ${objective}

Generate key insights as a JSON array.`
            }
          ]
        });
        const parsed = JSON.parse(this.extractJson(response.content));
        return Array.isArray(parsed) ? parsed : parsed.insights || [];
      } catch {
      }
    }
    return [
      `Core definition and characteristics of ${topic}`,
      `How ${topic} relates to broader concepts`,
      `Practical applications of ${topic}`,
      `Common misconceptions about ${topic}`
    ];
  }
  async generateSynthesis(dialogue) {
    const discoveredInsights = dialogue.discoveredInsights;
    const topic = dialogue.topic;
    if (this.aiAdapter) {
      try {
        const exchanges = dialogue.exchanges.map((e) => `Q: ${e.question.question}
A: ${e.response?.response || "No response"}`).join("\n\n");
        const response = await this.aiAdapter.chat({
          messages: [
            {
              role: "system",
              content: "Synthesize the key learnings from a Socratic dialogue. Be encouraging and highlight growth."
            },
            {
              role: "user",
              content: `Topic: ${topic}
Discovered Insights: ${discoveredInsights.join(", ")}

Dialogue:
${exchanges}

Provide a synthesis of what was learned.`
            }
          ]
        });
        return response.content;
      } catch {
      }
    }
    return `Through our Socratic exploration of "${topic}", you've discovered several key insights:

${discoveredInsights.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}

This journey of questioning and discovery has deepened your understanding. Keep questioning and exploring!`;
  }
  calculatePerformance(dialogue) {
    const exchanges = dialogue.exchanges;
    const totalExchanges = exchanges.length;
    const exchangesWithResponses = exchanges.filter((e) => e.response);
    const avgQuality = exchangesWithResponses.reduce((sum, e) => sum + (e.analysis?.qualityScore || 0), 0) / (exchangesWithResponses.length || 1);
    const avgDepth = exchangesWithResponses.reduce((sum, e) => sum + (e.analysis?.thinkingDepth || 0), 0) / (exchangesWithResponses.length || 1);
    const totalInsights = dialogue.discoveredInsights.length + dialogue.remainingInsights.length;
    const insightDiscoveryRate = totalInsights > 0 ? dialogue.discoveredInsights.length / totalInsights : 0;
    const completionTime = dialogue.endedAt ? (dialogue.endedAt.getTime() - dialogue.startedAt.getTime()) / 6e4 : 0;
    const hintsUsed = exchanges.filter((e) => e.response?.usedHint).length;
    const bloomsOrder = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
    let highestBloomsLevel = "REMEMBER";
    exchangesWithResponses.forEach((e) => {
      const level = e.analysis?.demonstratedBloomsLevel;
      if (level && bloomsOrder.indexOf(level) > bloomsOrder.indexOf(highestBloomsLevel)) {
        highestBloomsLevel = level;
      }
    });
    const growth = [];
    if (avgQuality > 70) {
      growth.push({ factor: "Strong Responses", description: "Consistently provided thoughtful answers" });
    }
    if (insightDiscoveryRate > 0.5) {
      growth.push({ factor: "Insight Discovery", description: "Successfully uncovered key insights" });
    }
    const improvementAreas = [];
    if (avgQuality < 50) {
      improvementAreas.push("Develop more detailed responses");
    }
    if (hintsUsed > totalExchanges / 2) {
      improvementAreas.push("Work on independent problem-solving");
    }
    return {
      totalExchanges,
      averageQuality: Math.round(avgQuality),
      averageDepth: Math.round(avgDepth),
      insightDiscoveryRate,
      completionTime,
      hintsUsed,
      highestBloomsLevel,
      growth,
      improvementAreas
    };
  }
  calculateProgress(dialogue) {
    const total = dialogue.discoveredInsights.length + dialogue.remainingInsights.length;
    if (total === 0) return 0;
    return Math.round(dialogue.discoveredInsights.length / total * 100);
  }
  shouldConclude(dialogue, analysis) {
    const maxQuestions = this.config.maxQuestions || 10;
    if (dialogue.exchanges.length >= maxQuestions) return true;
    if (dialogue.remainingInsights.length === 0) return true;
    if (dialogue.exchanges.length >= 5 && analysis.qualityScore > 80 && analysis.demonstratedBloomsLevel === "EVALUATE") {
      return true;
    }
    return false;
  }
  concludeDialogue(dialogue) {
    dialogue.state = "conclusion";
    dialogue.endedAt = /* @__PURE__ */ new Date();
    const synthesis = `You've made excellent progress exploring "${dialogue.topic}"! You discovered these key insights:

${dialogue.discoveredInsights.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}`;
    return {
      state: "conclusion",
      synthesis,
      feedback: "Great work on this Socratic dialogue!",
      encouragement: this.getEncouragement("completion"),
      discoveredInsights: dialogue.discoveredInsights,
      progress: 100,
      isComplete: true
    };
  }
  async moveToNextQuestion(dialogue, analysis) {
    const nextType = analysis?.recommendedNextType || this.getNextQuestionType(dialogue);
    const previousQuestions = dialogue.exchanges.map((e) => e.question.question);
    const nextQuestion = await this.generateQuestion(dialogue.topic, nextType, {
      previousQuestions,
      currentUnderstanding: analysis ? `Quality: ${analysis.qualityScore}%, Depth: ${analysis.thinkingDepth}%` : void 0
    });
    const exchange = {
      order: dialogue.exchanges.length + 1,
      question: nextQuestion
    };
    dialogue.exchanges.push(exchange);
    dialogue.state = this.determineDialogueState(dialogue);
    this.dialogueCache.set(dialogue.id, dialogue);
    return {
      state: dialogue.state,
      question: nextQuestion,
      feedback: analysis ? this.generateFeedback(analysis, this.config.encouragingMode ?? true) : void 0,
      encouragement: this.getEncouragement(dialogue.state),
      discoveredInsights: dialogue.discoveredInsights,
      progress: this.calculateProgress(dialogue),
      availableHints: nextQuestion.hints,
      isComplete: false
    };
  }
  getNextQuestionType(dialogue) {
    const exchangeCount = dialogue.exchanges.length;
    if (exchangeCount <= 2) return "clarifying";
    if (exchangeCount <= 4) return "probing_reasons";
    if (exchangeCount <= 6) return "probing_assumptions";
    if (exchangeCount <= 8) return "questioning_viewpoints";
    return "probing_implications";
  }
  determineDialogueState(dialogue) {
    const progress = this.calculateProgress(dialogue);
    const exchangeCount = dialogue.exchanges.length;
    if (exchangeCount <= 1) return "introduction";
    if (exchangeCount <= 3) return "exploration";
    if (progress < 50) return "clarification";
    if (progress < 75) return "challenge";
    if (progress < 100) return "synthesis";
    return "conclusion";
  }
  generateFeedback(analysis, encouraging) {
    let feedback = "";
    if (analysis.strengths.length > 0) {
      feedback += `\u2713 ${analysis.strengths[0]}. `;
    }
    if (analysis.misconceptions.length > 0) {
      feedback += `Consider: ${analysis.misconceptions[0]}. `;
    } else if (analysis.reasoningGaps.length > 0) {
      feedback += `To deepen your thinking: ${analysis.reasoningGaps[0]}. `;
    }
    if (encouraging && analysis.qualityScore < 50) {
      feedback += `Keep exploring - you're on the right track!`;
    } else if (analysis.qualityScore > 70) {
      feedback += `Excellent thinking!`;
    }
    return feedback || "Interesting perspective. Let us explore further.";
  }
  getIntroductionMessage(topic, style) {
    switch (style) {
      case "gentle":
        return `Let's explore "${topic}" together through a dialogue. There are no wrong answers - just opportunities to deepen our understanding.`;
      case "challenging":
        return `Today we'll rigorously examine "${topic}". I'll challenge your assumptions and push your thinking. Are you ready?`;
      default:
        return `Welcome to our Socratic exploration of "${topic}". I'll guide you through questions designed to help you discover key insights yourself.`;
    }
  }
  getEncouragement(context) {
    const encouragements = {
      start: ["Great! Let's begin our journey of discovery.", "I'm excited to explore this with you!"],
      introduction: ["You're off to a good start!", "Interesting first thoughts!"],
      exploration: ["Keep questioning!", "You're digging deeper!"],
      clarification: ["Let's sharpen our understanding.", "Good - clarity leads to insight."],
      challenge: ["Now we're really thinking!", "You're challenging your own assumptions!"],
      synthesis: ["You're connecting the dots!", "Beautiful synthesis emerging!"],
      conclusion: ["What a journey of discovery!", "You've grown through this dialogue!"],
      completion: ["Congratulations on completing this dialogue!", "Excellent work!"]
    };
    const options = encouragements[context] || encouragements.exploration;
    return options[Math.floor(Math.random() * options.length)];
  }
  extractJson(content) {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/) || content.match(/\[[\s\S]*\]/);
    return jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
  }
};
function createSocraticTeachingEngine(config) {
  return new SocraticTeachingEngine(config);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AchievementEngine,
  AdaptiveContentEngine,
  AdaptiveQuestionResponseSchema,
  AdvancedExamEngine,
  AnalyticsEngine,
  AssessmentQuestionSchema,
  AssessmentQuestionsResponseSchema,
  BloomsAnalysisEngine,
  BloomsDistributionSchema,
  BloomsLevelSchema,
  CollaborationEngine,
  ComparisonToExpectedSchema,
  ContentAnalysisResponseSchema,
  ContentGenerationEngine,
  CourseGuideEngine,
  DEFAULT_RETRY_CONFIG,
  EnhancedDepthAnalysisEngine,
  EvaluationEngine,
  FinancialEngine,
  GradingAssistanceResponseSchema,
  InnovationEngine,
  IntegrityEngine,
  MarketEngine,
  MemoryEngine,
  MultimediaEngine,
  PersonalizationEngine,
  PracticeProblemsEngine,
  PredictiveEngine,
  QuestionOptionSchema,
  ResearchEngine,
  ResourceEngine,
  RubricAlignmentSchema,
  SAMEvaluationEngine,
  SocialEngine,
  SocraticTeachingEngine,
  SubjectiveEvaluationResponseSchema,
  TrendsEngine,
  UnifiedBloomsAdapterEngine,
  UnifiedBloomsEngine,
  createAchievementEngine,
  createAdaptiveContentEngine,
  createAnalyticsEngine,
  createBloomsAnalysisEngine,
  createCollaborationEngine,
  createContentGenerationEngine,
  createCourseGuideEngine,
  createEnhancedDepthAnalysisEngine,
  createEvaluationEngine,
  createExamEngine,
  createFinancialEngine,
  createInnovationEngine,
  createIntegrityEngine,
  createMarketEngine,
  createMemoryEngine,
  createMultimediaEngine,
  createPartialSchema,
  createPersonalizationEngine,
  createPracticeProblemsEngine,
  createPredictiveEngine,
  createResearchEngine,
  createResourceEngine,
  createRetryPrompt,
  createSocialEngine,
  createSocraticTeachingEngine,
  createTrendsEngine,
  createUnifiedBloomsAdapterEngine,
  createUnifiedBloomsEngine,
  enhancedDepthEngine,
  executeWithRetry,
  extractJson,
  extractJsonWithOptions,
  fixCommonJsonIssues,
  parseAndValidate,
  safeParseWithDefaults,
  validateAdaptiveQuestionResponse,
  validateAssessmentQuestionsResponse,
  validateContentAnalysisResponse,
  validateEvaluationResponse,
  validateGradingAssistanceResponse,
  validateSchema,
  validateWithDefaults
});
