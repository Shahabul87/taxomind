var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/database-adapter.ts
var PrismaSAMAdapter = class {
  prisma;
  debug;
  constructor(config) {
    this.prisma = config.prisma;
    this.debug = config.debug ?? false;
  }
  // ============================================================================
  // USER OPERATIONS
  // ============================================================================
  async findUser(id, options) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: options?.select ? this.mapSelectFields(options.select) : void 0
    });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: {},
      createdAt: user.createdAt,
      updatedAt: user.createdAt
    };
  }
  async findUsers(filter, options) {
    const users = await this.prisma.user.findMany({
      where: this.buildUserFilter(filter),
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.orderBy ? this.mapOrderBy(options.orderBy) : void 0
    });
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: {},
      createdAt: user.createdAt,
      updatedAt: user.createdAt
    }));
  }
  async updateUser(id, data) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: data.name ?? void 0,
        email: data.email ?? void 0
      }
    });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: {},
      createdAt: user.createdAt,
      updatedAt: user.createdAt
    };
  }
  // ============================================================================
  // COURSE OPERATIONS
  // ============================================================================
  async findCourse(id, options) {
    const includeRelations = options?.include ?? {};
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        chapters: includeRelations.chapters ? {
          orderBy: { position: "asc" },
          include: {
            sections: includeRelations.sections ? { orderBy: { position: "asc" } } : false
          }
        } : false
      }
    });
    if (!course) return null;
    return this.mapCourse(course);
  }
  async findCourses(filter, options) {
    const courses = await this.prisma.course.findMany({
      where: this.buildCourseFilter(filter),
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.orderBy ? this.mapOrderBy(options.orderBy) : void 0
    });
    return courses.map((course) => this.mapCourse(course));
  }
  // ============================================================================
  // CHAPTER/SECTION OPERATIONS
  // ============================================================================
  async findChapter(id, options) {
    const includeRelations = options?.include ?? {};
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: {
        sections: includeRelations.sections ? { orderBy: { position: "asc" } } : false
      }
    });
    if (!chapter) return null;
    return this.mapChapter(chapter);
  }
  async findChaptersByCourse(courseId, options) {
    const chapters = await this.prisma.chapter.findMany({
      where: { courseId },
      take: options?.limit,
      skip: options?.offset,
      orderBy: { position: "asc" },
      include: options?.include?.sections ? { sections: { orderBy: { position: "asc" } } } : void 0
    });
    return chapters.map((chapter) => this.mapChapter(chapter));
  }
  async findSection(id) {
    const section = await this.prisma.section.findUnique({
      where: { id }
    });
    if (!section) return null;
    return this.mapSection(section);
  }
  async findSectionsByChapter(chapterId, options) {
    const sections = await this.prisma.section.findMany({
      where: { chapterId },
      take: options?.limit,
      skip: options?.offset,
      orderBy: { position: "asc" }
    });
    return sections.map((section) => this.mapSection(section));
  }
  // ============================================================================
  // QUESTION BANK OPERATIONS
  // ============================================================================
  async findQuestions(filter, options) {
    if (!this.prisma.questionBank) {
      this.logDebug("QuestionBank model not available");
      return [];
    }
    const questions = await this.prisma.questionBank.findMany({
      where: this.buildQuestionFilter(filter),
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.orderBy ? this.mapOrderBy(options.orderBy) : { createdAt: "desc" }
    });
    return questions.map((q) => this.mapQuestion(q));
  }
  async createQuestion(data) {
    if (!this.prisma.questionBank) {
      throw new Error("QuestionBank model not available in Prisma schema");
    }
    const question = await this.prisma.questionBank.create({
      data: {
        courseId: data.courseId,
        subject: "Course Content",
        topic: "General",
        question: data.question,
        questionType: this.mapQuestionType(data.questionType),
        bloomsLevel: this.mapBloomsLevel(data.bloomsLevel),
        difficulty: this.mapDifficulty(data.difficulty),
        correctAnswer: data.answer ? { answer: data.answer } : { answer: "" },
        options: data.options ? { options: data.options } : void 0,
        explanation: "",
        tags: [],
        metadata: { points: data.points }
      }
    });
    return this.mapQuestion(question);
  }
  async updateQuestion(id, data) {
    if (!this.prisma.questionBank) {
      throw new Error("QuestionBank model not available in Prisma schema");
    }
    const question = await this.prisma.questionBank.update({
      where: { id },
      data: {
        question: data.question,
        questionType: data.questionType ? this.mapQuestionType(data.questionType) : void 0,
        bloomsLevel: data.bloomsLevel ? this.mapBloomsLevel(data.bloomsLevel) : void 0,
        difficulty: data.difficulty ? this.mapDifficulty(data.difficulty) : void 0,
        correctAnswer: data.answer ? { answer: data.answer } : void 0,
        options: data.options ? { options: data.options } : void 0
      }
    });
    return this.mapQuestion(question);
  }
  async deleteQuestion(id) {
    if (!this.prisma.questionBank) {
      throw new Error("QuestionBank model not available in Prisma schema");
    }
    await this.prisma.questionBank.delete({
      where: { id }
    });
  }
  // ============================================================================
  // BLOOM'S PROGRESS OPERATIONS
  // ============================================================================
  async findBloomsProgress(userId, courseId) {
    if (!this.prisma.studentBloomsProgress) {
      this.logDebug("StudentBloomsProgress model not available");
      return null;
    }
    const progress = await this.prisma.studentBloomsProgress.findUnique({
      where: {
        userId_courseId: { userId, courseId }
      }
    });
    if (!progress) return null;
    return this.mapBloomsProgress(progress);
  }
  async upsertBloomsProgress(userId, courseId, data) {
    if (!this.prisma.studentBloomsProgress) {
      throw new Error("StudentBloomsProgress model not available in Prisma schema");
    }
    const bloomsScores = {
      remember: data.rememberScore ?? 0,
      understand: data.understandScore ?? 0,
      apply: data.applyScore ?? 0,
      analyze: data.analyzeScore ?? 0,
      evaluate: data.evaluateScore ?? 0,
      create: data.createScore ?? 0
    };
    const progress = await this.prisma.studentBloomsProgress.upsert({
      where: {
        userId_courseId: { userId, courseId }
      },
      create: {
        userId,
        courseId,
        bloomsScores,
        strengthAreas: { areas: [] },
        weaknessAreas: { areas: [] },
        progressHistory: { history: [] },
        lastAssessedAt: /* @__PURE__ */ new Date()
      },
      update: {
        bloomsScores,
        lastAssessedAt: data.lastAssessedAt ?? /* @__PURE__ */ new Date()
      }
    });
    return this.mapBloomsProgress(progress);
  }
  // ============================================================================
  // COGNITIVE PROGRESS OPERATIONS
  // ============================================================================
  async findCognitiveProgress(userId, skillType) {
    if (!this.prisma.cognitiveSkillProgress) {
      this.logDebug("CognitiveSkillProgress model not available");
      return null;
    }
    const progress = await this.prisma.cognitiveSkillProgress.findUnique({
      where: {
        userId_conceptId: { userId, conceptId: skillType }
      }
    });
    if (!progress) return null;
    return this.mapCognitiveProgress(progress);
  }
  async upsertCognitiveProgress(userId, skillType, data) {
    if (!this.prisma.cognitiveSkillProgress) {
      throw new Error("CognitiveSkillProgress model not available in Prisma schema");
    }
    const progress = await this.prisma.cognitiveSkillProgress.upsert({
      where: {
        userId_conceptId: { userId, conceptId: skillType }
      },
      create: {
        userId,
        conceptId: skillType,
        overallMastery: data.proficiencyLevel ?? 0,
        totalAttempts: data.totalAttempts ?? 0,
        lastAttemptDate: data.lastPracticedAt ?? /* @__PURE__ */ new Date()
      },
      update: {
        overallMastery: data.proficiencyLevel,
        totalAttempts: data.totalAttempts,
        lastAttemptDate: data.lastPracticedAt ?? /* @__PURE__ */ new Date()
      }
    });
    return this.mapCognitiveProgress(progress);
  }
  // ============================================================================
  // INTERACTION LOGGING
  // ============================================================================
  async logInteraction(data) {
    if (!this.prisma.sAMInteraction) {
      this.logDebug("SAMInteraction model not available - returning mock");
      return {
        id: `mock-${Date.now()}`,
        createdAt: /* @__PURE__ */ new Date(),
        ...data
      };
    }
    const interaction = await this.prisma.sAMInteraction.create({
      data: {
        userId: data.userId,
        interactionType: "CHAT_MESSAGE",
        context: {
          pageType: data.pageType,
          pagePath: data.pagePath,
          query: data.query,
          response: data.response,
          enginesUsed: data.enginesUsed,
          responseTimeMs: data.responseTimeMs,
          tokenCount: data.tokenCount,
          ...data.metadata ?? {}
        },
        duration: data.responseTimeMs,
        success: true
      }
    });
    return this.mapInteractionLog(interaction);
  }
  async findInteractions(userId, options) {
    if (!this.prisma.sAMInteraction) {
      return [];
    }
    const interactions = await this.prisma.sAMInteraction.findMany({
      where: { userId },
      take: options?.limit,
      skip: options?.offset,
      orderBy: { createdAt: "desc" }
    });
    return interactions.map((i) => this.mapInteractionLog(i));
  }
  async countInteractions(filter) {
    if (!this.prisma.sAMInteraction) {
      return 0;
    }
    return this.prisma.sAMInteraction.count({
      where: {
        userId: filter?.userId,
        createdAt: {
          gte: filter?.startDate,
          lte: filter?.endDate
        }
      }
    });
  }
  // ============================================================================
  // COURSE ANALYSIS OPERATIONS
  // ============================================================================
  async findCourseAnalysis(courseId) {
    if (!this.prisma.courseBloomsAnalysis) {
      return null;
    }
    const analysis = await this.prisma.courseBloomsAnalysis.findUnique({
      where: { courseId }
    });
    if (!analysis) return null;
    return this.mapCourseAnalysis(analysis);
  }
  async upsertCourseAnalysis(courseId, data) {
    if (!this.prisma.courseBloomsAnalysis) {
      throw new Error("CourseBloomsAnalysis model not available in Prisma schema");
    }
    const bloomsDistribution = {
      remember: data.rememberPercentage ?? 0,
      understand: data.understandPercentage ?? 0,
      apply: data.applyPercentage ?? 0,
      analyze: data.analyzePercentage ?? 0,
      evaluate: data.evaluatePercentage ?? 0,
      create: data.createPercentage ?? 0
    };
    const analysis = await this.prisma.courseBloomsAnalysis.upsert({
      where: { courseId },
      create: {
        courseId,
        bloomsDistribution,
        cognitiveDepth: data.overallScore ?? 0,
        learningPathway: { pathway: [] },
        skillsMatrix: { skills: [] },
        gapAnalysis: { gaps: data.gaps ?? [] },
        recommendations: { items: data.recommendations ?? [] }
      },
      update: {
        bloomsDistribution,
        cognitiveDepth: data.overallScore ?? void 0,
        gapAnalysis: data.gaps ? { gaps: data.gaps } : void 0,
        recommendations: data.recommendations ? { items: data.recommendations } : void 0,
        analyzedAt: /* @__PURE__ */ new Date()
      }
    });
    return this.mapCourseAnalysis(analysis);
  }
  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
  async beginTransaction() {
    return {
      id: `tx-${Date.now()}`,
      startedAt: /* @__PURE__ */ new Date()
    };
  }
  async commitTransaction() {
  }
  async rollbackTransaction() {
  }
  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================
  logDebug(message) {
    if (this.debug) {
      console.log(`[PrismaSAMAdapter] ${message}`);
    }
  }
  mapCourse(course) {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      categoryId: course.categoryId,
      userId: course.userId,
      isPublished: course.isPublished,
      chapters: course.chapters?.map((c) => this.mapChapter(c)),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };
  }
  mapChapter(chapter) {
    return {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      position: chapter.position,
      isPublished: chapter.isPublished,
      courseId: chapter.courseId,
      sections: chapter.sections?.map((s) => this.mapSection(s)),
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt
    };
  }
  mapSection(section) {
    return {
      id: section.id,
      title: section.title,
      description: section.description,
      content: null,
      position: section.position,
      isPublished: section.isPublished,
      chapterId: section.chapterId,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt
    };
  }
  mapQuestion(question) {
    const answer = question.correctAnswer;
    const opts = question.options;
    return {
      id: question.id,
      question: question.question,
      answer: answer?.answer ?? null,
      options: opts?.options ?? null,
      questionType: this.reverseQuestionType(question.questionType),
      bloomsLevel: this.reverseBloomsLevel(question.bloomsLevel),
      difficulty: this.reverseDifficulty(question.difficulty),
      points: 1,
      courseId: question.courseId ?? "",
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    };
  }
  mapBloomsProgress(progress) {
    const scores = progress.bloomsScores;
    return {
      id: progress.id,
      userId: progress.userId,
      courseId: progress.courseId ?? "",
      rememberScore: scores.remember ?? 0,
      understandScore: scores.understand ?? 0,
      applyScore: scores.apply ?? 0,
      analyzeScore: scores.analyze ?? 0,
      evaluateScore: scores.evaluate ?? 0,
      createScore: scores.create ?? 0,
      overallScore: ((scores.remember ?? 0) + (scores.understand ?? 0) + (scores.apply ?? 0) + (scores.analyze ?? 0) + (scores.evaluate ?? 0) + (scores.create ?? 0)) / 6,
      assessmentCount: 0,
      lastAssessedAt: progress.lastAssessedAt,
      updatedAt: progress.updatedAt
    };
  }
  mapCognitiveProgress(progress) {
    return {
      id: progress.id,
      userId: progress.userId,
      skillType: progress.conceptId,
      proficiencyLevel: progress.overallMastery,
      totalAttempts: progress.totalAttempts,
      successfulAttempts: 0,
      averageTimeSeconds: 0,
      lastPracticedAt: progress.lastAttemptDate ?? void 0,
      updatedAt: progress.updatedAt
    };
  }
  mapInteractionLog(interaction) {
    const ctx = interaction.context;
    return {
      id: interaction.id,
      userId: interaction.userId,
      sessionId: null,
      pageType: ctx.pageType ?? "unknown",
      pagePath: ctx.pagePath ?? "",
      query: ctx.query ?? "",
      response: ctx.response ?? "",
      enginesUsed: ctx.enginesUsed ?? [],
      responseTimeMs: ctx.responseTimeMs ?? interaction.duration ?? 0,
      tokenCount: ctx.tokenCount,
      metadata: ctx,
      createdAt: interaction.createdAt
    };
  }
  mapCourseAnalysis(analysis) {
    const dist = analysis.bloomsDistribution;
    const recs = analysis.recommendations;
    const gaps = analysis.gapAnalysis;
    return {
      id: analysis.id,
      courseId: analysis.courseId,
      rememberPercentage: dist.remember ?? 0,
      understandPercentage: dist.understand ?? 0,
      applyPercentage: dist.apply ?? 0,
      analyzePercentage: dist.analyze ?? 0,
      evaluatePercentage: dist.evaluate ?? 0,
      createPercentage: dist.create ?? 0,
      totalObjectives: 0,
      overallScore: analysis.cognitiveDepth,
      recommendations: recs.items,
      gaps: gaps.gaps,
      analyzedAt: analysis.analyzedAt
    };
  }
  buildUserFilter(filter) {
    return {
      id: filter.id,
      email: filter.email ?? void 0,
      name: filter.name ?? void 0
    };
  }
  buildCourseFilter(filter) {
    return {
      id: filter.id,
      title: filter.title ? { contains: filter.title, mode: "insensitive" } : void 0,
      userId: filter.userId,
      isPublished: filter.isPublished,
      categoryId: filter.categoryId ?? void 0
    };
  }
  buildQuestionFilter(filter) {
    return {
      id: filter.id,
      courseId: filter.courseId ?? void 0,
      bloomsLevel: filter.bloomsLevel ? this.mapBloomsLevel(filter.bloomsLevel) : void 0,
      difficulty: filter.difficulty ? this.mapDifficulty(filter.difficulty) : void 0,
      questionType: filter.questionType ? this.mapQuestionType(filter.questionType) : void 0
    };
  }
  mapSelectFields(select) {
    return Object.fromEntries(
      Object.entries(select).filter(([, v]) => v)
    );
  }
  mapOrderBy(orderBy) {
    return Object.entries(orderBy).map(([field, direction]) => ({
      [field]: direction
    }))[0];
  }
  mapQuestionType(type) {
    const map = {
      multiple_choice: "MULTIPLE_CHOICE",
      true_false: "TRUE_FALSE",
      short_answer: "SHORT_ANSWER",
      essay: "ESSAY",
      fill_blank: "FILL_IN_BLANK"
    };
    return map[type] ?? "MULTIPLE_CHOICE";
  }
  reverseQuestionType(type) {
    const map = {
      MULTIPLE_CHOICE: "multiple_choice",
      TRUE_FALSE: "true_false",
      SHORT_ANSWER: "short_answer",
      ESSAY: "essay",
      FILL_IN_BLANK: "fill_blank"
    };
    return map[type] ?? "multiple_choice";
  }
  mapBloomsLevel(level) {
    return level.toUpperCase();
  }
  reverseBloomsLevel(level) {
    return level.toLowerCase();
  }
  mapDifficulty(difficulty) {
    return difficulty.toUpperCase();
  }
  reverseDifficulty(difficulty) {
    return difficulty.toLowerCase();
  }
};
function createPrismaSAMAdapter(config) {
  return new PrismaSAMAdapter(config);
}

// src/sample-store.ts
var PrismaSampleStore = class {
  prisma;
  tableName;
  constructor(config) {
    this.prisma = config.prisma;
    this.tableName = config.tableName ?? "calibrationSample";
  }
  async save(sample) {
    await this.prisma[this.tableName].create({
      data: {
        id: sample.id,
        evaluationId: sample.evaluationId,
        aiScore: sample.aiScore,
        humanScore: sample.humanScore,
        aiFeedback: sample.aiFeedback,
        humanFeedback: sample.humanFeedback,
        adjustmentReason: sample.adjustmentReason,
        context: sample.context,
        evaluatedAt: sample.evaluatedAt,
        reviewedAt: sample.reviewedAt,
        reviewerId: sample.reviewerId,
        versionInfo: sample.versionInfo,
        tags: sample.tags ?? []
      }
    });
  }
  async get(id) {
    const result = await this.prisma[this.tableName].findUnique({
      where: { id }
    });
    return result ? this.mapToSample(result) : null;
  }
  async getRecentWithHumanReview(limit) {
    const results = await this.prisma[this.tableName].findMany({
      where: { humanScore: { not: null } },
      orderBy: { reviewedAt: "desc" },
      take: limit
    });
    return results.map((r) => this.mapToSample(r));
  }
  async getPendingReview(limit) {
    const results = await this.prisma[this.tableName].findMany({
      where: { humanScore: null },
      orderBy: { evaluatedAt: "desc" },
      take: limit
    });
    return results.map((r) => this.mapToSample(r));
  }
  async getByDateRange(start, end) {
    const results = await this.prisma[this.tableName].findMany({
      where: {
        evaluatedAt: { gte: start, lte: end }
      },
      orderBy: { evaluatedAt: "desc" }
    });
    return results.map((r) => this.mapToSample(r));
  }
  async getByContentType(contentType, limit) {
    const results = await this.prisma[this.tableName].findMany({
      where: {
        context: { path: ["contentType"], equals: contentType }
      },
      orderBy: { evaluatedAt: "desc" },
      take: limit
    });
    return results.map((r) => this.mapToSample(r));
  }
  async updateWithReview(id, review) {
    const result = await this.prisma[this.tableName].update({
      where: { id },
      data: {
        humanScore: review.score,
        humanFeedback: review.feedback,
        adjustmentReason: review.reason,
        reviewedAt: /* @__PURE__ */ new Date(),
        reviewerId: review.reviewerId
      }
    });
    return this.mapToSample(result);
  }
  async getStatistics() {
    const [totalSamples, reviewedSamples, avgAiScore, avgHumanScore] = await Promise.all([
      this.prisma[this.tableName].count(),
      this.prisma[this.tableName].count({ where: { humanScore: { not: null } } }),
      this.prisma[this.tableName].aggregate({ _avg: { aiScore: true } }),
      this.prisma[this.tableName].aggregate({
        _avg: { humanScore: true },
        where: { humanScore: { not: null } }
      })
    ]);
    return {
      totalSamples,
      reviewedSamples,
      averageAiScore: avgAiScore._avg.aiScore ?? 0,
      averageHumanScore: avgHumanScore._avg.humanScore ?? void 0,
      byContentType: {},
      bySubject: {}
    };
  }
  async pruneOldSamples(olderThanDays) {
    const cutoff = /* @__PURE__ */ new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const result = await this.prisma[this.tableName].deleteMany({
      where: { evaluatedAt: { lt: cutoff } }
    });
    return result.count;
  }
  mapToSample(result) {
    return {
      id: result.id,
      evaluationId: result.evaluationId,
      aiScore: result.aiScore,
      humanScore: result.humanScore ?? void 0,
      aiFeedback: result.aiFeedback,
      humanFeedback: result.humanFeedback ?? void 0,
      adjustmentReason: result.adjustmentReason ?? void 0,
      context: result.context,
      evaluatedAt: result.evaluatedAt,
      reviewedAt: result.reviewedAt ?? void 0,
      reviewerId: result.reviewerId ?? void 0,
      versionInfo: result.versionInfo,
      tags: result.tags ?? void 0
    };
  }
};
function createPrismaSampleStore(config) {
  return new PrismaSampleStore(config);
}

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
  async get(studentId) {
    const result = await this.prisma[this.profileTableName].findUnique({
      where: { id: studentId },
      include: { masteryRecords: true, pathways: true }
    });
    return result ? this.mapToProfile(result) : null;
  }
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
  async updateMastery(studentId, update) {
    const scorePercent = update.score / update.maxScore * 100;
    const existing = await this.prisma[this.masteryTableName].findUnique({
      where: { studentId_topicId: { studentId, topicId: update.topicId } }
    });
    if (existing) {
      const newAssessmentCount = existing.assessmentCount + 1;
      const newAverageScore = (existing.averageScore * existing.assessmentCount + scorePercent) / newAssessmentCount;
      const result = await this.prisma[this.masteryTableName].update({
        where: { studentId_topicId: { studentId, topicId: update.topicId } },
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
  async getMastery(studentId, topicId) {
    const result = await this.prisma[this.masteryTableName].findUnique({
      where: { studentId_topicId: { studentId, topicId } }
    });
    return result ? this.mapToMastery(result) : null;
  }
  async updatePathway(studentId, pathwayId, adjustment) {
    const pathway = await this.prisma[this.pathwayTableName].findUnique({
      where: { id: pathwayId }
    });
    if (!pathway || pathway.studentId !== studentId) {
      throw new Error(`Pathway not found: ${pathwayId}`);
    }
    let steps = pathway.steps;
    switch (adjustment.type) {
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
      default:
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
  async getActivePathways(studentId) {
    const results = await this.prisma[this.pathwayTableName].findMany({
      where: { studentId, status: "active" }
    });
    return results.map((r) => this.mapToPathway(r));
  }
  async updateMetrics(studentId, metrics) {
    const profile = await this.prisma[this.profileTableName].findUnique({
      where: { id: studentId }
    });
    if (!profile) {
      throw new Error(`Student profile not found: ${studentId}`);
    }
    const updatedMetrics = { ...profile.performanceMetrics, ...metrics };
    await this.prisma[this.profileTableName].update({
      where: { id: studentId },
      data: { performanceMetrics: updatedMetrics, updatedAt: /* @__PURE__ */ new Date() }
    });
    return updatedMetrics;
  }
  async getKnowledgeGaps(studentId) {
    const results = await this.prisma[this.masteryTableName].findMany({
      where: { studentId, level: { in: ["novice", "beginner"] } },
      select: { topicId: true }
    });
    return results.map((r) => r.topicId);
  }
  async delete(studentId) {
    await this.prisma[this.profileTableName].delete({ where: { id: studentId } });
  }
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
function createPrismaStudentProfileStore(config) {
  return new PrismaStudentProfileStore(config);
}

// src/memory-store.ts
var PrismaMemoryStore = class {
  prisma;
  tableName;
  constructor(config) {
    this.prisma = config.prisma;
    this.tableName = config.tableName ?? "memoryEntry";
  }
  async save(entry) {
    await this.prisma[this.tableName].upsert({
      where: { id: entry.id },
      create: entry,
      update: { ...entry, updatedAt: /* @__PURE__ */ new Date() }
    });
  }
  async get(id) {
    return this.prisma[this.tableName].findUnique({ where: { id } });
  }
  async getByStudent(studentId, options) {
    return this.prisma[this.tableName].findMany({
      where: {
        studentId,
        type: options?.type,
        OR: [{ expiresAt: null }, { expiresAt: { gt: /* @__PURE__ */ new Date() } }]
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 100
    });
  }
  async search(studentId, query) {
    return this.prisma[this.tableName].findMany({
      where: {
        studentId,
        content: { contains: query, mode: "insensitive" },
        OR: [{ expiresAt: null }, { expiresAt: { gt: /* @__PURE__ */ new Date() } }]
      },
      orderBy: { importance: "desc" },
      take: 20
    });
  }
  async delete(id) {
    await this.prisma[this.tableName].delete({ where: { id } });
  }
  async pruneExpired() {
    const result = await this.prisma[this.tableName].deleteMany({
      where: { expiresAt: { lt: /* @__PURE__ */ new Date() } }
    });
    return result.count;
  }
};
function createPrismaMemoryStore(config) {
  return new PrismaMemoryStore(config);
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = /* @__PURE__ */ Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// ../agentic/dist/index.mjs
import crypto2 from "crypto";
var GoalPrioritySchema = external_exports.enum(["low", "medium", "high", "critical"]);
var GoalStatusSchema = external_exports.enum(["draft", "active", "paused", "completed", "abandoned"]);
var SubGoalTypeSchema = external_exports.enum(["learn", "practice", "assess", "review", "reflect", "create"]);
var PlanStatusSchema = external_exports.enum(["draft", "active", "paused", "completed", "failed", "cancelled"]);
var StepStatusSchema = external_exports.enum(["pending", "in_progress", "completed", "failed", "skipped", "blocked"]);
var MasteryLevelSchema = external_exports.enum(["novice", "beginner", "intermediate", "advanced", "expert"]);
var GoalContextSchema = external_exports.object({
  courseId: external_exports.string().optional(),
  chapterId: external_exports.string().optional(),
  sectionId: external_exports.string().optional(),
  topicIds: external_exports.array(external_exports.string()).optional(),
  skillIds: external_exports.array(external_exports.string()).optional()
});
var CreateGoalInputSchema = external_exports.object({
  userId: external_exports.string().min(1),
  title: external_exports.string().min(1).max(500),
  description: external_exports.string().max(2e3).optional(),
  targetDate: external_exports.date().optional(),
  priority: GoalPrioritySchema.optional().default("medium"),
  context: GoalContextSchema.partial().optional(),
  currentMastery: MasteryLevelSchema.optional(),
  targetMastery: MasteryLevelSchema.optional(),
  tags: external_exports.array(external_exports.string()).optional()
});
var UpdateGoalInputSchema = external_exports.object({
  title: external_exports.string().min(1).max(500).optional(),
  description: external_exports.string().max(2e3).optional(),
  targetDate: external_exports.date().optional(),
  priority: GoalPrioritySchema.optional(),
  status: GoalStatusSchema.optional(),
  context: GoalContextSchema.partial().optional(),
  targetMastery: MasteryLevelSchema.optional(),
  tags: external_exports.array(external_exports.string()).optional()
});
var DecompositionOptionsSchema = external_exports.object({
  maxSubGoals: external_exports.number().int().min(1).max(20).optional().default(10),
  minSubGoals: external_exports.number().int().min(1).max(10).optional().default(2),
  includeAssessments: external_exports.boolean().optional().default(true),
  includeReviews: external_exports.boolean().optional().default(true),
  preferredLearningStyle: external_exports.string().optional(),
  availableTimePerDay: external_exports.number().int().min(5).max(480).optional(),
  targetCompletionDate: external_exports.date().optional()
});
var SubGoalAISchema = external_exports.object({
  title: external_exports.string(),
  description: external_exports.string().optional(),
  type: external_exports.enum(["learn", "practice", "assess", "review", "reflect", "create"]),
  estimatedMinutes: external_exports.number().int().min(5).max(240),
  difficulty: external_exports.enum(["easy", "medium", "hard"]),
  prerequisites: external_exports.array(external_exports.number().int()).default([]),
  // indices of prerequisite sub-goals
  successCriteria: external_exports.array(external_exports.string()).default([])
});
var DecompositionAIResponseSchema = external_exports.object({
  subGoals: external_exports.array(SubGoalAISchema).min(1).max(20),
  overallDifficulty: external_exports.enum(["easy", "medium", "hard"]),
  reasoning: external_exports.string().optional()
});
var PermissionLevel = {
  READ: "read",
  WRITE: "write",
  EXECUTE: "execute",
  ADMIN: "admin"
};
var AuditLogLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical"
};
var ToolCategorySchema = external_exports.enum([
  "content",
  "assessment",
  "communication",
  "analytics",
  "system",
  "external"
]);
var PermissionLevelSchema = external_exports.enum(["read", "write", "execute", "admin"]);
var ConfirmationTypeSchema = external_exports.enum(["none", "implicit", "explicit", "critical"]);
var ToolExecutionStatusSchema = external_exports.enum([
  "pending",
  "awaiting_confirmation",
  "executing",
  "success",
  "failed",
  "denied",
  "cancelled",
  "timeout"
]);
var RateLimitSchema = external_exports.object({
  maxCalls: external_exports.number().int().min(1),
  windowMs: external_exports.number().int().min(1e3),
  scope: external_exports.enum(["global", "user", "session"])
});
var ToolExampleSchema = external_exports.object({
  name: external_exports.string().min(1),
  description: external_exports.string(),
  input: external_exports.unknown(),
  expectedOutput: external_exports.unknown().optional()
});
var RegisterToolInputSchema = external_exports.object({
  name: external_exports.string().min(1).max(100),
  description: external_exports.string().min(1).max(1e3),
  category: ToolCategorySchema,
  version: external_exports.string().regex(/^\d+\.\d+\.\d+$/),
  requiredPermissions: external_exports.array(PermissionLevelSchema).min(1),
  confirmationType: ConfirmationTypeSchema,
  timeoutMs: external_exports.number().int().min(1e3).max(3e5).optional(),
  maxRetries: external_exports.number().int().min(0).max(5).optional(),
  rateLimit: RateLimitSchema.optional(),
  tags: external_exports.array(external_exports.string()).optional(),
  examples: external_exports.array(ToolExampleSchema).optional(),
  enabled: external_exports.boolean().optional().default(true)
});
var InvokeToolInputSchema = external_exports.object({
  toolId: external_exports.string().min(1),
  input: external_exports.unknown(),
  sessionId: external_exports.string().min(1),
  skipConfirmation: external_exports.boolean().optional(),
  metadata: external_exports.record(external_exports.unknown()).optional()
});
var UserRole = {
  STUDENT: "student",
  MENTOR: "mentor",
  INSTRUCTOR: "instructor",
  ADMIN: "admin"
};
var DEFAULT_ROLE_PERMISSIONS = [
  {
    role: UserRole.STUDENT,
    defaultPermissions: {
      global: [PermissionLevel.READ],
      byCategory: {
        content: [PermissionLevel.READ],
        assessment: [PermissionLevel.READ, PermissionLevel.EXECUTE],
        communication: [PermissionLevel.READ, PermissionLevel.WRITE],
        analytics: [PermissionLevel.READ]
      }
    }
  },
  {
    role: UserRole.MENTOR,
    defaultPermissions: {
      global: [PermissionLevel.READ, PermissionLevel.EXECUTE],
      byCategory: {
        content: [PermissionLevel.READ, PermissionLevel.WRITE],
        assessment: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE],
        communication: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE],
        analytics: [PermissionLevel.READ, PermissionLevel.EXECUTE],
        system: [PermissionLevel.READ]
      }
    }
  },
  {
    role: UserRole.INSTRUCTOR,
    defaultPermissions: {
      global: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE],
      byCategory: {
        content: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE],
        assessment: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE],
        communication: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE],
        analytics: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE],
        system: [PermissionLevel.READ, PermissionLevel.EXECUTE],
        external: [PermissionLevel.READ, PermissionLevel.EXECUTE]
      }
    }
  },
  {
    role: UserRole.ADMIN,
    defaultPermissions: {
      global: [
        PermissionLevel.READ,
        PermissionLevel.WRITE,
        PermissionLevel.EXECUTE,
        PermissionLevel.ADMIN
      ]
    }
  }
];
var LOG_LEVEL_ORDER = {
  [AuditLogLevel.DEBUG]: 0,
  [AuditLogLevel.INFO]: 1,
  [AuditLogLevel.WARNING]: 2,
  [AuditLogLevel.ERROR]: 3,
  [AuditLogLevel.CRITICAL]: 4
};
var ContentGenerationRequestSchema = external_exports.object({
  type: external_exports.enum(["explanation", "example", "quiz", "summary", "hint", "feedback"]),
  topic: external_exports.string().min(1),
  context: external_exports.object({
    courseId: external_exports.string().optional(),
    chapterId: external_exports.string().optional(),
    sectionId: external_exports.string().optional(),
    learningObjective: external_exports.string().optional()
  }).optional(),
  difficulty: external_exports.enum(["beginner", "intermediate", "advanced"]).optional(),
  format: external_exports.enum(["markdown", "html", "plain"]).optional(),
  maxLength: external_exports.number().int().min(50).max(1e4).optional(),
  style: external_exports.enum(["formal", "casual", "technical"]).optional(),
  includeExamples: external_exports.boolean().optional(),
  targetAudience: external_exports.string().optional()
});
var ContentRecommendationRequestSchema = external_exports.object({
  userId: external_exports.string().min(1),
  currentContext: external_exports.object({
    courseId: external_exports.string().optional(),
    chapterId: external_exports.string().optional(),
    sectionId: external_exports.string().optional(),
    currentTopic: external_exports.string().optional()
  }),
  learningGoals: external_exports.array(external_exports.string()).optional(),
  maxRecommendations: external_exports.number().int().min(1).max(20).optional(),
  includeExternal: external_exports.boolean().optional()
});
var StudySessionRequestSchema = external_exports.object({
  userId: external_exports.string().min(1),
  goalId: external_exports.string().optional(),
  duration: external_exports.number().int().min(15).max(480),
  topics: external_exports.array(external_exports.string()).optional(),
  preferredTime: external_exports.object({
    start: external_exports.string().regex(/^\d{2}:\d{2}$/),
    end: external_exports.string().regex(/^\d{2}:\d{2}$/)
  }).optional(),
  breakInterval: external_exports.number().int().min(15).max(120).optional(),
  breakDuration: external_exports.number().int().min(5).max(30).optional()
});
var ReminderRequestSchema = external_exports.object({
  userId: external_exports.string().min(1),
  type: external_exports.enum(["study", "assessment", "deadline", "check_in", "custom"]),
  message: external_exports.string().min(1).max(500),
  scheduledFor: external_exports.coerce.date(),
  recurring: external_exports.object({
    frequency: external_exports.enum(["daily", "weekly", "monthly"]),
    until: external_exports.coerce.date().optional()
  }).optional(),
  channels: external_exports.array(external_exports.enum(["email", "push", "in_app"])).optional()
});
var NotificationRequestSchema = external_exports.object({
  userId: external_exports.string().min(1),
  type: external_exports.enum([
    "achievement",
    "reminder",
    "progress_update",
    "feedback",
    "recommendation",
    "alert",
    "system"
  ]),
  title: external_exports.string().min(1).max(100),
  body: external_exports.string().min(1).max(500),
  priority: external_exports.enum(["low", "normal", "high", "urgent"]),
  channels: external_exports.array(external_exports.enum(["email", "push", "in_app", "sms"])).optional(),
  data: external_exports.record(external_exports.unknown()).optional(),
  expiresAt: external_exports.coerce.date().optional(),
  actionUrl: external_exports.string().url().optional(),
  actionLabel: external_exports.string().max(50).optional()
});
var ProgressReportRequestSchema = external_exports.object({
  userId: external_exports.string().min(1),
  period: external_exports.enum(["daily", "weekly", "monthly"]),
  includeComparison: external_exports.boolean().optional(),
  includeGoals: external_exports.boolean().optional(),
  includeRecommendations: external_exports.boolean().optional()
});
var VectorSearchOptionsSchema = external_exports.object({
  topK: external_exports.number().min(1).max(100),
  minScore: external_exports.number().min(0).max(1).optional(),
  maxDistance: external_exports.number().min(0).optional(),
  filter: external_exports.object({
    sourceTypes: external_exports.array(external_exports.string()).optional(),
    userIds: external_exports.array(external_exports.string()).optional(),
    courseIds: external_exports.array(external_exports.string()).optional(),
    tags: external_exports.array(external_exports.string()).optional(),
    dateRange: external_exports.object({
      start: external_exports.date().optional(),
      end: external_exports.date().optional()
    }).optional()
  }).optional(),
  includeMetadata: external_exports.boolean().optional()
});
var GraphQueryOptionsSchema = external_exports.object({
  maxDepth: external_exports.number().min(1).max(10).optional(),
  relationshipTypes: external_exports.array(external_exports.string()).optional(),
  entityTypes: external_exports.array(external_exports.string()).optional(),
  minWeight: external_exports.number().min(0).max(1).optional(),
  limit: external_exports.number().min(1).max(1e3).optional(),
  direction: external_exports.enum(["outgoing", "incoming", "both"]).optional()
});
var RetrievalQuerySchema = external_exports.object({
  query: external_exports.string().min(1),
  userId: external_exports.string().optional(),
  courseId: external_exports.string().optional(),
  memoryTypes: external_exports.array(external_exports.string()).optional(),
  sourceTypes: external_exports.array(external_exports.string()).optional(),
  timeRange: external_exports.object({
    start: external_exports.date().optional(),
    end: external_exports.date().optional()
  }).optional(),
  limit: external_exports.number().min(1).max(100).optional(),
  minRelevance: external_exports.number().min(0).max(1).optional(),
  includeRelated: external_exports.boolean().optional(),
  hybridSearch: external_exports.boolean().optional()
});
var rnds8Pool = new Uint8Array(256);
var poolPtr = rnds8Pool.length;
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
var native_default = {
  randomUUID: crypto2.randomUUID
};
var ContentChangeEventSchema = external_exports.object({
  id: external_exports.string().min(1),
  entityType: external_exports.enum([
    "course",
    "chapter",
    "section",
    "lesson",
    "quiz",
    "resource",
    "user_note",
    "conversation"
  ]),
  entityId: external_exports.string().min(1),
  changeType: external_exports.enum(["create", "update", "delete", "bulk_update"]),
  timestamp: external_exports.date(),
  metadata: external_exports.object({
    courseId: external_exports.string().optional(),
    chapterId: external_exports.string().optional(),
    sectionId: external_exports.string().optional(),
    userId: external_exports.string().optional(),
    previousHash: external_exports.string().optional(),
    newHash: external_exports.string().optional(),
    fieldsChanged: external_exports.array(external_exports.string()).optional(),
    batchId: external_exports.string().optional()
  })
});
var MemoryLifecycleConfigSchema = external_exports.object({
  autoReindexEnabled: external_exports.boolean().default(true),
  debounceMs: external_exports.number().min(0).default(5e3),
  maxBatchSize: external_exports.number().min(1).max(1e3).default(100),
  maxConcurrentJobs: external_exports.number().min(1).max(50).default(5),
  retry: external_exports.object({
    maxAttempts: external_exports.number().min(1).max(10).default(3),
    backoffMs: external_exports.number().min(100).max(6e4).default(1e3),
    backoffMultiplier: external_exports.number().min(1).max(10).default(2)
  }),
  priorityRules: external_exports.array(external_exports.any()).default([]),
  entityConfigs: external_exports.record(external_exports.any()).default({})
});
var DEFAULT_CONFIG2 = {
  enabled: true,
  scheduleIntervalMs: 6 * 60 * 60 * 1e3,
  // 6 hours
  staleRelationshipAgeMs: 7 * 24 * 60 * 60 * 1e3,
  // 7 days
  entityTypes: ["concept", "topic", "skill", "course", "chapter", "section"],
  incrementalMode: true,
  batchSize: 100,
  minRelationshipConfidence: 0.5
};
var NormalizedMemoryContextSchema = external_exports.object({
  id: external_exports.string().min(1),
  userId: external_exports.string().min(1),
  courseId: external_exports.string().optional(),
  generatedAt: external_exports.date(),
  generationTimeMs: external_exports.number().min(0),
  segments: external_exports.array(
    external_exports.object({
      type: external_exports.string(),
      title: external_exports.string(),
      items: external_exports.array(external_exports.any()),
      relevanceScore: external_exports.number().min(0).max(1),
      priority: external_exports.number()
    })
  ),
  relevanceScore: external_exports.number().min(0).max(1),
  sources: external_exports.array(
    external_exports.object({
      type: external_exports.string(),
      id: external_exports.string(),
      name: external_exports.string().optional(),
      url: external_exports.string().optional()
    })
  ),
  strategies: external_exports.array(
    external_exports.object({
      type: external_exports.string(),
      durationMs: external_exports.number(),
      resultsCount: external_exports.number(),
      avgRelevance: external_exports.number()
    })
  ),
  metadata: external_exports.object({
    query: external_exports.string().optional(),
    totalItemsFound: external_exports.number(),
    filteredItems: external_exports.number(),
    estimatedTokens: external_exports.number(),
    truncated: external_exports.boolean(),
    custom: external_exports.record(external_exports.unknown()).optional()
  })
});
var MemoryNormalizerConfigSchema = external_exports.object({
  maxItems: external_exports.number().min(1).max(1e3),
  maxItemsPerSegment: external_exports.number().min(1).max(100),
  maxContentLength: external_exports.number().min(100).max(1e4),
  minRelevanceScore: external_exports.number().min(0).max(1),
  includeSummaries: external_exports.boolean(),
  maxSummaryLength: external_exports.number().min(50).max(1e3),
  segmentPriority: external_exports.array(external_exports.string()),
  tokenBudget: external_exports.number().min(100).max(1e5),
  charsPerToken: external_exports.number().min(1).max(10)
});
var BaseJobSchema = external_exports.object({
  id: external_exports.string().min(1),
  type: external_exports.enum([
    "reindex",
    "kg_refresh",
    "embedding_generation",
    "content_analysis",
    "memory_cleanup",
    "notification",
    "scheduled_task",
    "custom"
  ]),
  status: external_exports.enum([
    "pending",
    "queued",
    "active",
    "completed",
    "failed",
    "cancelled",
    "delayed",
    "paused"
  ]),
  priority: external_exports.number().min(0).max(100),
  data: external_exports.unknown(),
  result: external_exports.unknown().optional(),
  error: external_exports.string().optional(),
  attempts: external_exports.number().min(0),
  maxAttempts: external_exports.number().min(1),
  createdAt: external_exports.date(),
  updatedAt: external_exports.date(),
  scheduledFor: external_exports.date(),
  startedAt: external_exports.date().optional(),
  completedAt: external_exports.date().optional(),
  progress: external_exports.number().min(0).max(100).optional()
});
var JobQueueConfigSchema = external_exports.object({
  name: external_exports.string().min(1),
  concurrency: external_exports.number().min(1).max(100),
  defaultPriority: external_exports.number().min(0).max(100),
  defaultMaxAttempts: external_exports.number().min(1).max(10),
  retryDelayMs: external_exports.number().min(100).max(36e5),
  retryBackoffMultiplier: external_exports.number().min(1).max(10),
  jobTimeoutMs: external_exports.number().min(1e3).max(36e5),
  cleanupAfterMs: external_exports.number().min(6e4),
  persistJobs: external_exports.boolean()
});
var WorkerConfigSchema = external_exports.object({
  id: external_exports.string().min(1),
  queues: external_exports.array(external_exports.string().min(1)),
  concurrency: external_exports.number().min(1).max(50),
  pollIntervalMs: external_exports.number().min(100).max(6e4),
  maxJobsPerCycle: external_exports.number().min(1).max(1e3),
  gracefulShutdown: external_exports.boolean(),
  shutdownTimeoutMs: external_exports.number().min(1e3).max(3e5)
});
var LearningPlanInputSchema = external_exports.object({
  userId: external_exports.string().min(1),
  goalTitle: external_exports.string().min(1).max(200),
  goalDescription: external_exports.string().min(1).max(1e3),
  targetDate: external_exports.date().optional(),
  courseId: external_exports.string().optional(),
  chapterId: external_exports.string().optional(),
  currentLevel: external_exports.enum(["beginner", "intermediate", "advanced"]),
  targetLevel: external_exports.enum(["beginner", "intermediate", "advanced", "mastery"]),
  preferredDailyMinutes: external_exports.number().min(5).max(480),
  preferredDaysPerWeek: external_exports.number().min(1).max(7),
  constraints: external_exports.array(
    external_exports.object({
      type: external_exports.enum(["time", "content", "pace", "style"]),
      description: external_exports.string(),
      value: external_exports.unknown()
    })
  ).optional()
});
var ProgressUpdateSchema = external_exports.object({
  planId: external_exports.string().min(1),
  date: external_exports.date(),
  completedActivities: external_exports.array(external_exports.string()),
  actualMinutes: external_exports.number().min(0),
  notes: external_exports.string().max(1e3).optional(),
  emotionalState: external_exports.string().optional(),
  difficultyFeedback: external_exports.enum(["too_easy", "just_right", "too_hard"]).optional()
});
var CheckInResponseSchema = external_exports.object({
  checkInId: external_exports.string().min(1),
  respondedAt: external_exports.date(),
  answers: external_exports.array(
    external_exports.object({
      questionId: external_exports.string().min(1),
      answer: external_exports.union([external_exports.string(), external_exports.array(external_exports.string()), external_exports.number(), external_exports.boolean()])
    })
  ),
  selectedActions: external_exports.array(external_exports.string()),
  feedback: external_exports.string().max(1e3).optional(),
  emotionalState: external_exports.string().optional()
});
var BehaviorEventSchema = external_exports.object({
  userId: external_exports.string().min(1),
  sessionId: external_exports.string().min(1),
  timestamp: external_exports.date(),
  type: external_exports.string(),
  data: external_exports.record(external_exports.unknown()),
  pageContext: external_exports.object({
    url: external_exports.string(),
    courseId: external_exports.string().optional(),
    chapterId: external_exports.string().optional(),
    sectionId: external_exports.string().optional(),
    contentType: external_exports.string().optional(),
    timeOnPage: external_exports.number().optional(),
    scrollDepth: external_exports.number().optional()
  }),
  emotionalSignals: external_exports.array(
    external_exports.object({
      type: external_exports.string(),
      intensity: external_exports.number().min(0).max(1),
      source: external_exports.enum(["text", "behavior", "timing", "pattern"]),
      timestamp: external_exports.date()
    })
  ).optional()
});
var ConfidenceLevel = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  UNCERTAIN: "uncertain"
};
var ConfidenceFactorType = {
  KNOWLEDGE_COVERAGE: "knowledge_coverage",
  SOURCE_RELIABILITY: "source_reliability",
  COMPLEXITY_MATCH: "complexity_match",
  CONTEXT_RELEVANCE: "context_relevance",
  HISTORICAL_ACCURACY: "historical_accuracy",
  CONCEPT_CLARITY: "concept_clarity",
  PREREQUISITE_KNOWLEDGE: "prerequisite_knowledge",
  AMBIGUITY_LEVEL: "ambiguity_level"
};
var ConfidenceInputSchema = external_exports.object({
  responseId: external_exports.string().min(1),
  userId: external_exports.string().min(1),
  sessionId: external_exports.string().min(1),
  responseText: external_exports.string().min(1),
  responseType: external_exports.enum([
    "explanation",
    "answer",
    "hint",
    "feedback",
    "assessment",
    "recommendation",
    "clarification"
  ]),
  topic: external_exports.string().optional(),
  context: external_exports.object({
    courseId: external_exports.string().optional(),
    chapterId: external_exports.string().optional(),
    sectionId: external_exports.string().optional(),
    questionText: external_exports.string().optional(),
    studentLevel: external_exports.string().optional(),
    previousAttempts: external_exports.number().optional(),
    relatedConcepts: external_exports.array(external_exports.string()).optional()
  }).optional(),
  sources: external_exports.array(
    external_exports.object({
      id: external_exports.string(),
      type: external_exports.string(),
      title: external_exports.string(),
      url: external_exports.string().optional(),
      reliability: external_exports.number().min(0).max(1),
      lastVerified: external_exports.date().optional()
    })
  ).optional()
});
var VerificationInputSchema = external_exports.object({
  responseId: external_exports.string().min(1),
  userId: external_exports.string().min(1),
  responseText: external_exports.string().min(1),
  claims: external_exports.array(external_exports.string()).optional(),
  sources: external_exports.array(
    external_exports.object({
      id: external_exports.string(),
      type: external_exports.string(),
      title: external_exports.string(),
      url: external_exports.string().optional(),
      reliability: external_exports.number().min(0).max(1),
      lastVerified: external_exports.date().optional()
    })
  ).optional(),
  context: external_exports.object({
    courseId: external_exports.string().optional(),
    chapterId: external_exports.string().optional(),
    sectionId: external_exports.string().optional(),
    questionText: external_exports.string().optional(),
    studentLevel: external_exports.string().optional(),
    previousAttempts: external_exports.number().optional(),
    relatedConcepts: external_exports.array(external_exports.string()).optional()
  }).optional(),
  strictMode: external_exports.boolean().optional()
});
var StudentFeedbackSchema = external_exports.object({
  responseId: external_exports.string().min(1),
  userId: external_exports.string().min(1),
  helpful: external_exports.boolean(),
  rating: external_exports.number().min(1).max(5).optional(),
  clarity: external_exports.number().min(1).max(5).optional(),
  comment: external_exports.string().max(1e3).optional(),
  didUnderstand: external_exports.boolean(),
  needMoreHelp: external_exports.boolean(),
  askedFollowUp: external_exports.boolean().optional(),
  triedAgain: external_exports.boolean().optional(),
  succeededAfter: external_exports.boolean().optional()
});
var DEFAULT_FACTOR_WEIGHTS = {
  [ConfidenceFactorType.KNOWLEDGE_COVERAGE]: 0.2,
  [ConfidenceFactorType.SOURCE_RELIABILITY]: 0.18,
  [ConfidenceFactorType.COMPLEXITY_MATCH]: 0.15,
  [ConfidenceFactorType.CONTEXT_RELEVANCE]: 0.12,
  [ConfidenceFactorType.HISTORICAL_ACCURACY]: 0.12,
  [ConfidenceFactorType.CONCEPT_CLARITY]: 0.1,
  [ConfidenceFactorType.PREREQUISITE_KNOWLEDGE]: 0.08,
  [ConfidenceFactorType.AMBIGUITY_LEVEL]: 0.05
};
var CritiqueDimension = {
  ACCURACY: "accuracy",
  CLARITY: "clarity",
  COMPLETENESS: "completeness",
  PEDAGOGY: "pedagogy",
  ENGAGEMENT: "engagement",
  SAFETY: "safety",
  RELEVANCE: "relevance",
  STRUCTURE: "structure"
};
var DEFAULT_DIMENSION_WEIGHTS = {
  [CritiqueDimension.ACCURACY]: 0.2,
  [CritiqueDimension.CLARITY]: 0.15,
  [CritiqueDimension.COMPLETENESS]: 0.15,
  [CritiqueDimension.PEDAGOGY]: 0.15,
  [CritiqueDimension.ENGAGEMENT]: 0.1,
  [CritiqueDimension.SAFETY]: 0.1,
  [CritiqueDimension.RELEVANCE]: 0.1,
  [CritiqueDimension.STRUCTURE]: 0.05
};
var SelfCritiqueInputSchema = external_exports.object({
  responseId: external_exports.string().min(1),
  userId: external_exports.string().min(1),
  sessionId: external_exports.string().min(1),
  responseText: external_exports.string().min(10),
  responseType: external_exports.enum([
    "explanation",
    "answer",
    "hint",
    "feedback",
    "assessment",
    "recommendation",
    "clarification"
  ]),
  topic: external_exports.string().optional(),
  context: external_exports.object({
    courseId: external_exports.string().optional(),
    chapterId: external_exports.string().optional(),
    sectionId: external_exports.string().optional(),
    questionText: external_exports.string().optional(),
    studentLevel: external_exports.string().optional(),
    previousAttempts: external_exports.number().optional(),
    relatedConcepts: external_exports.array(external_exports.string()).optional()
  }).optional(),
  targetAudience: external_exports.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  learningObjectives: external_exports.array(external_exports.string()).optional(),
  enabledDimensions: external_exports.array(
    external_exports.enum([
      "accuracy",
      "clarity",
      "completeness",
      "pedagogy",
      "engagement",
      "safety",
      "relevance",
      "structure"
    ])
  ).optional(),
  passThreshold: external_exports.number().min(0).max(100).optional(),
  iteration: external_exports.number().int().positive().optional(),
  previousScore: external_exports.number().min(0).max(100).optional()
});
var SelfCritiqueLoopInputSchema = SelfCritiqueInputSchema.extend({
  maxIterations: external_exports.number().int().min(1).max(10).optional(),
  minImprovement: external_exports.number().min(0).max(100).optional()
});
var AssessmentSource = /* @__PURE__ */ ((AssessmentSource2) => {
  AssessmentSource2["QUIZ"] = "quiz";
  AssessmentSource2["EXERCISE"] = "exercise";
  AssessmentSource2["PROJECT"] = "project";
  AssessmentSource2["PEER_REVIEW"] = "peer_review";
  AssessmentSource2["SELF_ASSESSMENT"] = "self_assessment";
  AssessmentSource2["AI_EVALUATION"] = "ai_evaluation";
  return AssessmentSource2;
})(AssessmentSource || {});
var LearningSessionInputSchema = external_exports.object({
  userId: external_exports.string().min(1),
  topicId: external_exports.string().min(1),
  startTime: external_exports.date().optional(),
  duration: external_exports.number().min(0).optional(),
  activitiesCompleted: external_exports.number().min(0).optional(),
  questionsAnswered: external_exports.number().min(0).optional(),
  correctAnswers: external_exports.number().min(0).optional(),
  conceptsCovered: external_exports.array(external_exports.string()).optional(),
  focusScore: external_exports.number().min(0).max(1).optional()
});
var SkillAssessmentInputSchema = external_exports.object({
  userId: external_exports.string().min(1),
  skillId: external_exports.string().min(1),
  skillName: external_exports.string().min(1).optional(),
  score: external_exports.number().min(0).max(100),
  maxScore: external_exports.number().min(1).optional().default(100),
  source: external_exports.nativeEnum(AssessmentSource),
  duration: external_exports.number().min(0).optional(),
  questionsAnswered: external_exports.number().min(0).optional(),
  correctAnswers: external_exports.number().min(0).optional(),
  evidence: external_exports.array(
    external_exports.object({
      type: external_exports.string(),
      description: external_exports.string(),
      score: external_exports.number().optional(),
      timestamp: external_exports.date(),
      weight: external_exports.number().min(0).max(1)
    })
  ).optional()
});
var RecommendationFeedbackSchema = external_exports.object({
  recommendationId: external_exports.string().min(1),
  userId: external_exports.string().min(1),
  isHelpful: external_exports.boolean(),
  rating: external_exports.number().min(1).max(5).optional(),
  comment: external_exports.string().optional(),
  timeSpent: external_exports.number().min(0).optional(),
  completed: external_exports.boolean().optional()
});
var InterventionSurface = {
  TOAST: "toast",
  MODAL: "modal",
  SIDEBAR: "sidebar",
  INLINE: "inline",
  FLOATING: "floating",
  BANNER: "banner",
  ASSISTANT_PANEL: "assistant_panel",
  DASHBOARD_WIDGET: "dashboard_widget"
};
var SAMWebSocketEventSchema = external_exports.object({
  type: external_exports.string(),
  payload: external_exports.unknown(),
  timestamp: external_exports.date(),
  eventId: external_exports.string().min(1),
  userId: external_exports.string().optional(),
  sessionId: external_exports.string().optional()
});
var ConnectionConfigSchema = external_exports.object({
  url: external_exports.string().url(),
  maxReconnectAttempts: external_exports.number().min(0).max(20),
  reconnectDelay: external_exports.number().min(100).max(6e4),
  heartbeatInterval: external_exports.number().min(5e3).max(3e5),
  idleTimeout: external_exports.number().min(1e4).max(6e5),
  awayTimeout: external_exports.number().min(6e4).max(36e5),
  autoReconnect: external_exports.boolean(),
  authToken: external_exports.string().optional()
});
var PushDeliveryRequestSchema = external_exports.object({
  id: external_exports.string().min(1),
  userId: external_exports.string().min(1),
  event: SAMWebSocketEventSchema,
  priority: external_exports.enum(["critical", "high", "normal", "low"]),
  channels: external_exports.array(external_exports.enum(["websocket", "sse", "push_notification", "email", "in_app"])),
  fallbackChannels: external_exports.array(external_exports.enum(["websocket", "sse", "push_notification", "email", "in_app"])).optional(),
  expiresAt: external_exports.date().optional(),
  metadata: external_exports.record(external_exports.unknown()).optional()
});
var DEFAULT_DISPLAY_CONFIGS = {
  // Proactive events
  intervention: {
    surface: InterventionSurface.MODAL,
    position: "center",
    dismissible: true,
    blocking: false,
    priority: 80,
    animation: "fade"
  },
  checkin: {
    surface: InterventionSurface.SIDEBAR,
    position: "right",
    dismissible: true,
    blocking: false,
    priority: 70,
    animation: "slide"
  },
  recommendation: {
    surface: InterventionSurface.TOAST,
    position: "bottom-right",
    duration: 1e4,
    dismissible: true,
    blocking: false,
    priority: 40,
    animation: "slide"
  },
  step_completed: {
    surface: InterventionSurface.TOAST,
    position: "top",
    duration: 5e3,
    dismissible: true,
    blocking: false,
    priority: 50,
    animation: "bounce",
    sound: true
  },
  goal_progress: {
    surface: InterventionSurface.TOAST,
    position: "bottom-right",
    duration: 8e3,
    dismissible: true,
    blocking: false,
    priority: 45,
    animation: "slide"
  },
  nudge: {
    surface: InterventionSurface.FLOATING,
    position: "bottom-right",
    duration: 6e3,
    dismissible: true,
    blocking: false,
    priority: 30,
    animation: "fade"
  },
  celebration: {
    surface: InterventionSurface.MODAL,
    position: "center",
    duration: 5e3,
    dismissible: true,
    blocking: true,
    priority: 90,
    animation: "bounce",
    sound: true
  },
  // System events
  presence_update: {
    surface: InterventionSurface.TOAST,
    position: "top",
    duration: 3e3,
    dismissible: true,
    blocking: false,
    priority: 20,
    animation: "fade"
  },
  session_sync: {
    surface: InterventionSurface.BANNER,
    position: "top",
    dismissible: true,
    blocking: false,
    priority: 60,
    animation: "slide"
  },
  // Client events (typically not displayed)
  activity: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0
  },
  heartbeat: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0
  },
  acknowledge: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0
  },
  dismiss: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0
  },
  respond: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0
  },
  subscribe: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0
  },
  unsubscribe: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0
  },
  // System events
  connected: {
    surface: InterventionSurface.TOAST,
    position: "bottom",
    duration: 2e3,
    dismissible: true,
    blocking: false,
    priority: 10,
    animation: "fade"
  },
  disconnected: {
    surface: InterventionSurface.BANNER,
    position: "top",
    dismissible: false,
    blocking: false,
    priority: 95,
    animation: "slide"
  },
  error: {
    surface: InterventionSurface.TOAST,
    position: "top",
    duration: 8e3,
    dismissible: true,
    blocking: false,
    priority: 85,
    animation: "slide"
  },
  reconnecting: {
    surface: InterventionSurface.BANNER,
    position: "top",
    dismissible: false,
    blocking: false,
    priority: 90,
    animation: "fade"
  }
};
var AnalyticsPeriod = {
  HOUR: "hour",
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  QUARTER: "quarter",
  ALL_TIME: "all_time"
};
var LearningEventSchema = external_exports.object({
  userId: external_exports.string().min(1),
  sessionId: external_exports.string().min(1),
  eventType: external_exports.enum([
    "question_asked",
    "explanation_provided",
    "hint_given",
    "feedback_delivered",
    "assessment_completed",
    "concept_introduced",
    "practice_session",
    "review_session",
    "error_correction",
    "strategy_applied"
  ]),
  courseId: external_exports.string().optional(),
  sectionId: external_exports.string().optional(),
  topic: external_exports.string().optional(),
  duration: external_exports.number().optional(),
  outcome: external_exports.enum(["success", "partial", "failure"]).optional(),
  confidence: external_exports.number().min(0).max(1).optional(),
  strategyId: external_exports.string().optional(),
  strategyApplied: external_exports.string().optional(),
  responseQuality: external_exports.number().min(0).max(100).optional(),
  studentSatisfaction: external_exports.number().min(1).max(5).optional(),
  metadata: external_exports.record(external_exports.unknown()).optional().default({})
});
var GetInsightsSchema = external_exports.object({
  userId: external_exports.string().optional(),
  type: external_exports.enum([
    "optimization",
    "warning",
    "recommendation",
    "trend",
    "anomaly",
    "correlation",
    "prediction"
  ]).optional(),
  priority: external_exports.enum(["critical", "high", "medium", "low", "info"]).optional(),
  limit: external_exports.number().int().min(1).max(100).optional().default(20),
  activeOnly: external_exports.boolean().optional().default(true)
});
var GetAnalyticsSchema = external_exports.object({
  userId: external_exports.string().optional(),
  period: external_exports.enum(["hour", "day", "week", "month", "quarter", "all_time"]).optional().default("week"),
  includePatterns: external_exports.boolean().optional().default(true),
  includeStrategies: external_exports.boolean().optional().default(true),
  includeTrends: external_exports.boolean().optional().default(true)
});

// src/self-evaluation-store.ts
var mapConfidenceScore = (record) => ({
  id: record.id,
  responseId: record.responseId,
  userId: record.userId,
  sessionId: record.sessionId,
  overallScore: record.overallScore,
  level: record.level,
  factors: record.factors ?? [],
  responseType: record.responseType,
  topic: record.topic ?? void 0,
  complexity: record.complexity,
  shouldVerify: record.shouldVerify,
  suggestedDisclaimer: record.suggestedDisclaimer ?? void 0,
  alternativeApproaches: record.alternativeApproaches ?? void 0,
  scoredAt: record.scoredAt
});
var mapVerificationResult = (record) => ({
  id: record.id,
  responseId: record.responseId,
  userId: record.userId,
  status: record.status,
  overallAccuracy: record.overallAccuracy,
  factChecks: record.factChecks ?? [],
  totalClaims: record.totalClaims,
  verifiedClaims: record.verifiedClaims,
  contradictedClaims: record.contradictedClaims,
  sourceValidations: record.sourceValidations ?? [],
  issues: record.issues ?? [],
  corrections: record.corrections ?? void 0,
  verifiedAt: record.verifiedAt,
  expiresAt: record.expiresAt ?? void 0
});
var mapQualityRecord = (record) => ({
  id: record.id,
  responseId: record.responseId,
  userId: record.userId,
  sessionId: record.sessionId,
  metrics: record.metrics ?? [],
  overallQuality: record.overallQuality,
  confidenceScore: record.confidenceScore ?? void 0,
  confidenceAccuracy: record.confidenceAccuracy ?? void 0,
  studentFeedback: record.studentFeedback ?? void 0,
  expertReview: record.expertReview ?? void 0,
  learningOutcome: record.learningOutcome ?? void 0,
  recordedAt: record.recordedAt,
  updatedAt: record.updatedAt
});
var mapCalibrationData = (record) => ({
  id: record.id,
  userId: record.userId ?? void 0,
  topic: record.topic ?? void 0,
  totalResponses: record.totalResponses,
  expectedAccuracy: record.expectedAccuracy,
  actualAccuracy: record.actualAccuracy,
  calibrationError: record.calibrationError,
  byConfidenceLevel: record.byConfidenceLevel ?? [],
  adjustmentFactor: record.adjustmentFactor,
  adjustmentDirection: record.adjustmentDirection,
  periodStart: record.periodStart,
  periodEnd: record.periodEnd,
  calculatedAt: record.calculatedAt
});
var mapSelfCritique = (record) => ({
  id: record.id,
  responseId: record.responseId,
  userId: record.userId,
  overallScore: record.overallScore,
  dimensionScores: record.dimensionScores ?? [],
  findings: record.findings ?? [],
  criticalFindings: record.criticalFindings,
  majorFindings: record.majorFindings,
  minorFindings: record.minorFindings,
  improvements: record.improvements ?? [],
  topImprovements: record.topImprovements ?? [],
  iteration: record.iteration,
  previousScore: record.previousScore ?? void 0,
  scoreImprovement: record.scoreImprovement ?? void 0,
  passed: record.passed,
  passThreshold: record.passThreshold,
  requiresRevision: record.requiresRevision,
  critiquedAt: record.critiquedAt,
  processingTimeMs: record.processingTimeMs
});
var PrismaConfidenceScoreStore = class {
  constructor(config) {
    this.config = config;
  }
  async get(id) {
    const record = await this.config.prisma.sAMSelfEvaluationScore.findUnique({
      where: { id }
    });
    return record ? mapConfidenceScore(record) : null;
  }
  async getByResponse(responseId) {
    const record = await this.config.prisma.sAMSelfEvaluationScore.findFirst({
      where: { responseId },
      orderBy: { scoredAt: "desc" }
    });
    return record ? mapConfidenceScore(record) : null;
  }
  async getByUser(userId, limit) {
    const records = await this.config.prisma.sAMSelfEvaluationScore.findMany({
      where: { userId },
      orderBy: { scoredAt: "desc" },
      take: limit
    });
    return records.map(mapConfidenceScore);
  }
  async create(score) {
    const record = await this.config.prisma.sAMSelfEvaluationScore.create({
      data: {
        userId: score.userId,
        sessionId: score.sessionId,
        responseId: score.responseId,
        responseType: score.responseType,
        overallScore: score.overallScore,
        level: score.level,
        factors: score.factors,
        topic: score.topic ?? null,
        complexity: score.complexity,
        shouldVerify: score.shouldVerify,
        suggestedDisclaimer: score.suggestedDisclaimer ?? null,
        alternativeApproaches: score.alternativeApproaches ?? [],
        scoredAt: score.scoredAt,
        metadata: null
      }
    });
    return mapConfidenceScore(record);
  }
  async getAverageByTopic(topic, since) {
    const records = await this.config.prisma.sAMSelfEvaluationScore.findMany({
      where: {
        topic,
        ...since ? { scoredAt: { gte: since } } : {}
      },
      select: { overallScore: true }
    });
    if (records.length === 0) return 0;
    const total = records.reduce((sum, record) => sum + record.overallScore, 0);
    return total / records.length;
  }
  async getDistribution(userId) {
    const records = await this.config.prisma.sAMSelfEvaluationScore.findMany({
      where: userId ? { userId } : {},
      select: { level: true }
    });
    const distribution = Object.values(ConfidenceLevel).reduce(
      (acc, level) => {
        acc[level] = 0;
        return acc;
      },
      {}
    );
    for (const record of records) {
      const level = record.level;
      distribution[level] = (distribution[level] ?? 0) + 1;
    }
    return distribution;
  }
};
var PrismaVerificationResultStore = class {
  constructor(config) {
    this.config = config;
  }
  async get(id) {
    const record = await this.config.prisma.sAMVerificationResult.findUnique({
      where: { id }
    });
    return record ? mapVerificationResult(record) : null;
  }
  async getByResponse(responseId) {
    const record = await this.config.prisma.sAMVerificationResult.findFirst({
      where: { responseId },
      orderBy: { verifiedAt: "desc" }
    });
    return record ? mapVerificationResult(record) : null;
  }
  async getByUser(userId, limit) {
    const records = await this.config.prisma.sAMVerificationResult.findMany({
      where: { userId },
      orderBy: { verifiedAt: "desc" },
      take: limit
    });
    return records.map(mapVerificationResult);
  }
  async create(result) {
    const record = await this.config.prisma.sAMVerificationResult.create({
      data: {
        userId: result.userId,
        responseId: result.responseId,
        status: result.status,
        overallAccuracy: result.overallAccuracy,
        factChecks: result.factChecks,
        totalClaims: result.totalClaims,
        verifiedClaims: result.verifiedClaims,
        contradictedClaims: result.contradictedClaims,
        sourceValidations: result.sourceValidations,
        issues: result.issues,
        corrections: result.corrections ?? null,
        verifiedAt: result.verifiedAt,
        expiresAt: result.expiresAt ?? null
      }
    });
    return mapVerificationResult(record);
  }
  async update(id, updates) {
    const record = await this.config.prisma.sAMVerificationResult.update({
      where: { id },
      data: {
        status: updates.status,
        overallAccuracy: updates.overallAccuracy,
        factChecks: updates.factChecks,
        totalClaims: updates.totalClaims,
        verifiedClaims: updates.verifiedClaims,
        contradictedClaims: updates.contradictedClaims,
        sourceValidations: updates.sourceValidations,
        issues: updates.issues,
        corrections: updates.corrections ?? null,
        verifiedAt: updates.verifiedAt,
        expiresAt: updates.expiresAt ?? null
      }
    });
    return mapVerificationResult(record);
  }
  async getIssuesByType(type, since) {
    const records = await this.config.prisma.sAMVerificationResult.findMany({
      where: since ? { verifiedAt: { gte: since } } : {},
      select: { issues: true }
    });
    const issues = [];
    for (const record of records) {
      const recordIssues = record.issues ?? [];
      for (const issue of recordIssues) {
        if (issue.type === type) {
          issues.push(issue);
        }
      }
    }
    return issues;
  }
};
var PrismaQualityRecordStore = class {
  constructor(config) {
    this.config = config;
  }
  async get(id) {
    const record = await this.config.prisma.sAMQualityRecord.findUnique({
      where: { id }
    });
    return record ? mapQualityRecord(record) : null;
  }
  async getByResponse(responseId) {
    const record = await this.config.prisma.sAMQualityRecord.findFirst({
      where: { responseId },
      orderBy: { recordedAt: "desc" }
    });
    return record ? mapQualityRecord(record) : null;
  }
  async getByUser(userId, limit) {
    const records = await this.config.prisma.sAMQualityRecord.findMany({
      where: { userId },
      orderBy: { recordedAt: "desc" },
      take: limit
    });
    return records.map(mapQualityRecord);
  }
  async create(record) {
    const created = await this.config.prisma.sAMQualityRecord.create({
      data: {
        userId: record.userId,
        sessionId: record.sessionId,
        responseId: record.responseId,
        metrics: record.metrics,
        overallQuality: record.overallQuality,
        confidenceScore: record.confidenceScore ?? null,
        confidenceAccuracy: record.confidenceAccuracy ?? null,
        studentFeedback: record.studentFeedback ?? null,
        expertReview: record.expertReview ?? null,
        learningOutcome: record.learningOutcome ?? null,
        recordedAt: record.recordedAt
      }
    });
    return mapQualityRecord(created);
  }
  async update(id, updates) {
    const record = await this.config.prisma.sAMQualityRecord.update({
      where: { id },
      data: {
        metrics: updates.metrics,
        overallQuality: updates.overallQuality,
        confidenceScore: updates.confidenceScore ?? null,
        confidenceAccuracy: updates.confidenceAccuracy ?? null,
        studentFeedback: updates.studentFeedback ?? null,
        expertReview: updates.expertReview ?? null,
        learningOutcome: updates.learningOutcome ?? null
      }
    });
    return mapQualityRecord(record);
  }
  async recordFeedback(responseId, feedback) {
    const existing = await this.config.prisma.sAMQualityRecord.findFirst({
      where: { responseId }
    });
    if (!existing) return;
    await this.config.prisma.sAMQualityRecord.update({
      where: { id: existing.id },
      data: {
        studentFeedback: feedback
      }
    });
  }
  async recordOutcome(responseId, outcome) {
    const existing = await this.config.prisma.sAMQualityRecord.findFirst({
      where: { responseId }
    });
    if (!existing) return;
    await this.config.prisma.sAMQualityRecord.update({
      where: { id: existing.id },
      data: {
        learningOutcome: outcome
      }
    });
  }
  async getSummary(userId, periodStart, periodEnd) {
    const now = /* @__PURE__ */ new Date();
    const start = periodStart ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
    const end = periodEnd ?? now;
    const records = await this.config.prisma.sAMQualityRecord.findMany({
      where: {
        ...userId ? { userId } : {},
        recordedAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: { recordedAt: "desc" }
    });
    const mapped = records.map(mapQualityRecord);
    const totalResponses = mapped.length;
    const averageQuality = totalResponses > 0 ? mapped.reduce((sum, r) => sum + r.overallQuality, 0) / totalResponses : 0;
    const averageConfidence = totalResponses > 0 ? mapped.reduce((sum, r) => sum + (r.confidenceScore ?? 0), 0) / totalResponses : 0;
    return {
      userId,
      periodStart: start,
      periodEnd: end,
      totalResponses,
      averageQuality,
      averageConfidence,
      calibrationScore: 1,
      byResponseType: {},
      byTopic: {},
      byComplexity: {},
      qualityTrend: "stable",
      confidenceTrend: "stable",
      improvementAreas: [],
      strengths: []
    };
  }
};
var PrismaCalibrationStore = class {
  constructor(config) {
    this.config = config;
  }
  async get(id) {
    const record = await this.config.prisma.sAMCalibrationData.findUnique({
      where: { id }
    });
    return record ? mapCalibrationData(record) : null;
  }
  async getLatest(userId, topic) {
    const record = await this.config.prisma.sAMCalibrationData.findFirst({
      where: {
        ...userId ? { userId } : {},
        ...topic ? { topic } : {}
      },
      orderBy: { calculatedAt: "desc" }
    });
    return record ? mapCalibrationData(record) : null;
  }
  async create(data) {
    const record = await this.config.prisma.sAMCalibrationData.create({
      data: {
        userId: data.userId ?? null,
        topic: data.topic ?? null,
        totalResponses: data.totalResponses,
        expectedAccuracy: data.expectedAccuracy,
        actualAccuracy: data.actualAccuracy,
        calibrationError: data.calibrationError,
        byConfidenceLevel: data.byConfidenceLevel,
        adjustmentFactor: data.adjustmentFactor,
        adjustmentDirection: data.adjustmentDirection,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        calculatedAt: data.calculatedAt
      }
    });
    return mapCalibrationData(record);
  }
  async getHistory(userId, limit) {
    const records = await this.config.prisma.sAMCalibrationData.findMany({
      where: userId ? { userId } : {},
      orderBy: { calculatedAt: "desc" },
      take: limit
    });
    return records.map(mapCalibrationData);
  }
};
var PrismaSelfCritiqueStore = class {
  constructor(config) {
    this.config = config;
  }
  async get(id) {
    const record = await this.config.prisma.sAMSelfCritique.findUnique({
      where: { id }
    });
    return record ? mapSelfCritique(record) : null;
  }
  async getByResponse(responseId) {
    const records = await this.config.prisma.sAMSelfCritique.findMany({
      where: { responseId },
      orderBy: { critiquedAt: "desc" }
    });
    return records.map(mapSelfCritique);
  }
  async getByUser(userId, limit) {
    const records = await this.config.prisma.sAMSelfCritique.findMany({
      where: { userId },
      orderBy: { critiquedAt: "desc" },
      take: limit
    });
    return records.map(mapSelfCritique);
  }
  async create(result) {
    const record = await this.config.prisma.sAMSelfCritique.create({
      data: {
        userId: result.userId,
        responseId: result.responseId,
        overallScore: result.overallScore,
        dimensionScores: result.dimensionScores,
        findings: result.findings,
        criticalFindings: result.criticalFindings,
        majorFindings: result.majorFindings,
        minorFindings: result.minorFindings,
        improvements: result.improvements,
        topImprovements: result.topImprovements,
        iteration: result.iteration,
        previousScore: result.previousScore ?? null,
        scoreImprovement: result.scoreImprovement ?? null,
        passed: result.passed,
        passThreshold: result.passThreshold,
        requiresRevision: result.requiresRevision,
        critiquedAt: result.critiquedAt,
        processingTimeMs: result.processingTimeMs
      }
    });
    return mapSelfCritique(record);
  }
  async update(id, updates) {
    const record = await this.config.prisma.sAMSelfCritique.update({
      where: { id },
      data: {
        overallScore: updates.overallScore,
        dimensionScores: updates.dimensionScores,
        findings: updates.findings,
        criticalFindings: updates.criticalFindings,
        majorFindings: updates.majorFindings,
        minorFindings: updates.minorFindings,
        improvements: updates.improvements,
        topImprovements: updates.topImprovements,
        iteration: updates.iteration,
        previousScore: updates.previousScore ?? null,
        scoreImprovement: updates.scoreImprovement ?? null,
        passed: updates.passed,
        passThreshold: updates.passThreshold,
        requiresRevision: updates.requiresRevision,
        critiquedAt: updates.critiquedAt,
        processingTimeMs: updates.processingTimeMs
      }
    });
    return mapSelfCritique(record);
  }
  async getLoopResult(responseId) {
    const records = await this.config.prisma.sAMSelfCritique.findMany({
      where: { responseId },
      orderBy: { iteration: "asc" }
    });
    if (records.length === 0) return null;
    const critiques = records.map(mapSelfCritique);
    const firstCritique = critiques[0];
    const lastCritique = critiques[critiques.length - 1];
    const iterations = critiques.map((critique, index) => ({
      iteration: critique.iteration,
      originalResponse: "",
      // Not stored in DB
      improvedResponse: "",
      // Not stored in DB
      critique,
      improvements: critique.improvements?.map((s) => s.description) ?? [],
      converged: index === critiques.length - 1 && critique.passed,
      reason: critique.passed ? "Passed quality threshold" : void 0
    }));
    const allFindings = critiques.flatMap((c) => c.findings ?? []);
    const resolvedFindings = allFindings.filter((f) => f.severity === "minor");
    const unresolvedFindings = allFindings.filter((f) => f.severity !== "minor");
    return {
      responseId,
      userId: firstCritique.userId,
      finalResponse: "",
      // Not stored in DB
      finalScore: lastCritique.overallScore,
      passed: lastCritique.passed,
      iterations,
      totalIterations: records.length,
      maxIterationsReached: records.length >= 3,
      // Assume max is 3
      initialScore: firstCritique.overallScore,
      scoreImprovement: lastCritique.overallScore - firstCritique.overallScore,
      improvementPercentage: firstCritique.overallScore > 0 ? (lastCritique.overallScore - firstCritique.overallScore) / firstCritique.overallScore * 100 : 0,
      allFindings,
      resolvedFindings,
      unresolvedFindings,
      totalProcessingTimeMs: critiques.reduce((sum, c) => sum + c.processingTimeMs, 0),
      averageIterationTimeMs: critiques.length > 0 ? critiques.reduce((sum, c) => sum + c.processingTimeMs, 0) / critiques.length : 0,
      startedAt: firstCritique.critiquedAt,
      completedAt: lastCritique.critiquedAt
    };
  }
  async saveLoopResult(result) {
    for (const iteration of result.iterations) {
      const existing = await this.config.prisma.sAMSelfCritique.findFirst({
        where: {
          responseId: result.responseId,
          iteration: iteration.iteration
        }
      });
      if (!existing) {
        await this.create(iteration.critique);
      }
    }
  }
};
function createPrismaSelfEvaluationStores(config) {
  return {
    confidenceScore: new PrismaConfidenceScoreStore(config),
    verificationResult: new PrismaVerificationResultStore(config),
    qualityRecord: new PrismaQualityRecordStore(config),
    calibration: new PrismaCalibrationStore(config),
    selfCritique: new PrismaSelfCritiqueStore(config)
  };
}

// src/meta-learning-store.ts
var mapPattern = (record) => ({
  id: record.id,
  category: record.category,
  name: record.name,
  description: record.description,
  confidence: record.confidence,
  confidenceScore: record.confidenceScore,
  occurrenceCount: record.occurrenceCount,
  sampleSize: record.sampleSize,
  significanceLevel: record.significanceLevel,
  contexts: record.contexts ?? [],
  triggers: record.triggers ?? [],
  outcomes: record.outcomes ?? [],
  successRate: record.successRate,
  avgImpact: record.avgImpact,
  consistency: record.consistency,
  firstObserved: record.firstObserved,
  lastObserved: record.lastObserved,
  trend: record.trend
});
var mapInsight = (record) => ({
  id: record.id,
  type: record.type,
  priority: record.priority,
  title: record.title,
  description: record.description,
  evidence: record.evidence ?? [],
  recommendations: record.recommendations ?? [],
  confidence: record.confidence,
  expectedImpact: record.expectedImpact,
  affectedAreas: record.affectedAreas ?? [],
  timeframe: record.timeframe,
  generatedAt: record.generatedAt,
  validUntil: record.validUntil ?? void 0
});
var mapStrategy = (record) => ({
  id: record.id,
  name: record.name,
  description: record.description,
  effectivenessScore: record.effectivenessScore,
  successRate: record.successRate,
  engagementImpact: record.engagementImpact,
  bestFor: record.bestFor ?? [],
  notRecommendedFor: record.notRecommendedFor ?? [],
  usageCount: record.usageCount,
  lastUsed: record.lastUsed,
  trend: record.trend,
  avgOutcome: record.avgOutcome,
  stdDevOutcome: record.stdDevOutcome
});
var mapEvent = (record) => ({
  id: record.id,
  userId: record.userId,
  sessionId: record.sessionId,
  eventType: record.eventType,
  timestamp: record.timestamp,
  courseId: record.courseId ?? void 0,
  sectionId: record.sectionId ?? void 0,
  topic: record.topic ?? void 0,
  duration: record.duration ?? void 0,
  outcome: record.outcome,
  confidence: record.confidence ?? void 0,
  strategyId: record.strategyId ?? void 0,
  strategyApplied: record.strategyApplied ?? void 0,
  responseQuality: record.responseQuality ?? void 0,
  studentSatisfaction: record.studentSatisfaction ?? void 0,
  metadata: record.metadata ?? {}
});
var PrismaLearningPatternStore = class {
  constructor(config) {
    this.config = config;
  }
  async get(id) {
    const record = await this.config.prisma.sAMLearningPattern.findUnique({
      where: { id }
    });
    return record ? mapPattern(record) : null;
  }
  async getByCategory(category) {
    const records = await this.config.prisma.sAMLearningPattern.findMany({
      where: { category },
      orderBy: { lastObserved: "desc" }
    });
    return records.map(mapPattern);
  }
  async getHighConfidence(minConfidence = 0.7) {
    const records = await this.config.prisma.sAMLearningPattern.findMany({
      where: { confidenceScore: { gte: minConfidence } },
      orderBy: { confidenceScore: "desc" }
    });
    return records.map(mapPattern);
  }
  async create(pattern) {
    const record = await this.config.prisma.sAMLearningPattern.create({
      data: {
        category: pattern.category,
        name: pattern.name,
        description: pattern.description,
        confidence: pattern.confidence,
        confidenceScore: pattern.confidenceScore,
        occurrenceCount: pattern.occurrenceCount,
        sampleSize: pattern.sampleSize,
        significanceLevel: pattern.significanceLevel,
        contexts: pattern.contexts,
        triggers: pattern.triggers,
        outcomes: pattern.outcomes,
        successRate: pattern.successRate,
        avgImpact: pattern.avgImpact,
        consistency: pattern.consistency,
        firstObserved: pattern.firstObserved,
        lastObserved: pattern.lastObserved,
        trend: pattern.trend
      }
    });
    return mapPattern(record);
  }
  async update(id, updates) {
    const record = await this.config.prisma.sAMLearningPattern.update({
      where: { id },
      data: {
        category: updates.category,
        name: updates.name,
        description: updates.description,
        confidence: updates.confidence,
        confidenceScore: updates.confidenceScore,
        occurrenceCount: updates.occurrenceCount,
        sampleSize: updates.sampleSize,
        significanceLevel: updates.significanceLevel,
        contexts: updates.contexts,
        triggers: updates.triggers,
        outcomes: updates.outcomes,
        successRate: updates.successRate,
        avgImpact: updates.avgImpact,
        consistency: updates.consistency,
        firstObserved: updates.firstObserved,
        lastObserved: updates.lastObserved,
        trend: updates.trend
      }
    });
    return mapPattern(record);
  }
  async getRecent(limit = 10) {
    const records = await this.config.prisma.sAMLearningPattern.findMany({
      orderBy: { lastObserved: "desc" },
      take: limit
    });
    return records.map(mapPattern);
  }
};
var PrismaMetaLearningInsightStore = class {
  constructor(config) {
    this.config = config;
  }
  async get(id) {
    const record = await this.config.prisma.sAMMetaLearningInsight.findUnique({
      where: { id }
    });
    return record ? mapInsight(record) : null;
  }
  async getByType(type) {
    const records = await this.config.prisma.sAMMetaLearningInsight.findMany({
      where: { type },
      orderBy: { generatedAt: "desc" }
    });
    return records.map(mapInsight);
  }
  async getByPriority(priority) {
    const records = await this.config.prisma.sAMMetaLearningInsight.findMany({
      where: { priority },
      orderBy: { generatedAt: "desc" }
    });
    return records.map(mapInsight);
  }
  async getActive() {
    const now = /* @__PURE__ */ new Date();
    const records = await this.config.prisma.sAMMetaLearningInsight.findMany({
      where: {
        processedAt: null,
        OR: [{ validUntil: null }, { validUntil: { gt: now } }]
      },
      orderBy: { generatedAt: "desc" }
    });
    return records.map(mapInsight);
  }
  async create(insight) {
    const record = await this.config.prisma.sAMMetaLearningInsight.create({
      data: {
        type: insight.type,
        priority: insight.priority,
        title: insight.title,
        description: insight.description,
        evidence: insight.evidence ?? [],
        recommendations: insight.recommendations ?? [],
        confidence: insight.confidence,
        expectedImpact: insight.expectedImpact,
        affectedAreas: insight.affectedAreas ?? [],
        timeframe: insight.timeframe,
        generatedAt: insight.generatedAt,
        validUntil: insight.validUntil ?? null
      }
    });
    return mapInsight(record);
  }
  async markProcessed(id) {
    await this.config.prisma.sAMMetaLearningInsight.update({
      where: { id },
      data: { processedAt: /* @__PURE__ */ new Date() }
    });
  }
};
var PrismaLearningStrategyStore = class {
  constructor(config) {
    this.config = config;
  }
  async get(id) {
    const record = await this.config.prisma.sAMLearningStrategy.findUnique({
      where: { id }
    });
    return record ? mapStrategy(record) : null;
  }
  async getAll() {
    const records = await this.config.prisma.sAMLearningStrategy.findMany({
      orderBy: { effectivenessScore: "desc" }
    });
    return records.map(mapStrategy);
  }
  async getTopPerforming(limit = 5) {
    const records = await this.config.prisma.sAMLearningStrategy.findMany({
      orderBy: { effectivenessScore: "desc" },
      take: limit
    });
    return records.map(mapStrategy);
  }
  async create(strategy) {
    const record = await this.config.prisma.sAMLearningStrategy.create({
      data: {
        name: strategy.name,
        description: strategy.description,
        effectivenessScore: strategy.effectivenessScore,
        successRate: strategy.successRate,
        engagementImpact: strategy.engagementImpact,
        bestFor: strategy.bestFor,
        notRecommendedFor: strategy.notRecommendedFor,
        usageCount: strategy.usageCount,
        lastUsed: strategy.lastUsed,
        trend: strategy.trend,
        avgOutcome: strategy.avgOutcome,
        stdDevOutcome: strategy.stdDevOutcome
      }
    });
    return mapStrategy(record);
  }
  async update(id, updates) {
    const record = await this.config.prisma.sAMLearningStrategy.update({
      where: { id },
      data: {
        name: updates.name,
        description: updates.description,
        effectivenessScore: updates.effectivenessScore,
        successRate: updates.successRate,
        engagementImpact: updates.engagementImpact,
        bestFor: updates.bestFor,
        notRecommendedFor: updates.notRecommendedFor,
        usageCount: updates.usageCount,
        lastUsed: updates.lastUsed,
        trend: updates.trend,
        avgOutcome: updates.avgOutcome,
        stdDevOutcome: updates.stdDevOutcome
      }
    });
    return mapStrategy(record);
  }
  async recordUsage(id, outcome) {
    const strategy = await this.config.prisma.sAMLearningStrategy.findUnique({
      where: { id }
    });
    if (!strategy) {
      throw new Error(`Strategy not found: ${id}`);
    }
    const newUsageCount = strategy.usageCount + 1;
    const newAvgOutcome = (strategy.avgOutcome * strategy.usageCount + outcome) / newUsageCount;
    await this.config.prisma.sAMLearningStrategy.update({
      where: { id },
      data: {
        usageCount: newUsageCount,
        avgOutcome: newAvgOutcome,
        lastUsed: /* @__PURE__ */ new Date()
      }
    });
  }
};
var PrismaLearningEventStore = class {
  constructor(config) {
    this.config = config;
  }
  async get(id) {
    const record = await this.config.prisma.sAMLearningEvent.findUnique({
      where: { id }
    });
    return record ? mapEvent(record) : null;
  }
  async getByUser(userId, since) {
    const records = await this.config.prisma.sAMLearningEvent.findMany({
      where: {
        userId,
        ...since ? { timestamp: { gte: since } } : {}
      },
      orderBy: { timestamp: "desc" }
    });
    return records.map(mapEvent);
  }
  async create(event) {
    const record = await this.config.prisma.sAMLearningEvent.create({
      data: {
        userId: event.userId,
        sessionId: event.sessionId,
        eventType: event.eventType,
        timestamp: event.timestamp,
        courseId: event.courseId ?? null,
        sectionId: event.sectionId ?? null,
        topic: event.topic ?? null,
        duration: event.duration ?? null,
        outcome: event.outcome ?? null,
        confidence: event.confidence ?? null,
        strategyId: event.strategyId ?? null,
        strategyApplied: event.strategyApplied ?? null,
        responseQuality: event.responseQuality ?? null,
        studentSatisfaction: event.studentSatisfaction ?? null,
        metadata: event.metadata ?? {}
      }
    });
    return mapEvent(record);
  }
  async getBySession(sessionId) {
    const records = await this.config.prisma.sAMLearningEvent.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" }
    });
    return records.map(mapEvent);
  }
  async getStats(userId, period) {
    let since;
    if (period) {
      const now = /* @__PURE__ */ new Date();
      switch (period) {
        case AnalyticsPeriod.HOUR:
          since = new Date(now.getTime() - 60 * 60 * 1e3);
          break;
        case AnalyticsPeriod.DAY:
          since = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
          break;
        case AnalyticsPeriod.WEEK:
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
          break;
        case AnalyticsPeriod.MONTH:
          since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
          break;
        case AnalyticsPeriod.QUARTER:
          since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1e3);
          break;
        case AnalyticsPeriod.ALL_TIME:
          break;
      }
    }
    const records = await this.config.prisma.sAMLearningEvent.findMany({
      where: {
        ...userId ? { userId } : {},
        ...since ? { timestamp: { gte: since } } : {}
      }
    });
    const eventsByType = {};
    let totalDuration = 0;
    let durationCount = 0;
    let successCount = 0;
    let outcomeCount = 0;
    let totalQuality = 0;
    let qualityCount = 0;
    for (const record of records) {
      const eventType = record.eventType;
      eventsByType[eventType] = (eventsByType[eventType] ?? 0) + 1;
      if (record.duration !== null) {
        totalDuration += record.duration;
        durationCount++;
      }
      if (record.outcome !== null) {
        outcomeCount++;
        if (record.outcome === "success" || record.outcome === "completed") {
          successCount++;
        }
      }
      const metadata = record.metadata;
      if (metadata?.quality !== void 0 && typeof metadata.quality === "number") {
        totalQuality += metadata.quality;
        qualityCount++;
      }
    }
    return {
      totalEvents: records.length,
      eventsByType,
      avgDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      successRate: outcomeCount > 0 ? successCount / outcomeCount : 0,
      avgQuality: qualityCount > 0 ? totalQuality / qualityCount : 0
    };
  }
};
function createPrismaMetaLearningStores(config) {
  return {
    learningPattern: new PrismaLearningPatternStore(config),
    metaLearningInsight: new PrismaMetaLearningInsightStore(config),
    learningStrategy: new PrismaLearningStrategyStore(config),
    learningEvent: new PrismaLearningEventStore(config)
  };
}

// src/journey-timeline-store.ts
var mapEvent2 = (record) => ({
  id: record.id,
  type: record.type,
  timestamp: record.timestamp,
  data: record.data ?? {},
  impact: record.impact ?? {},
  relatedEntities: record.relatedEntities ?? []
});
var mapMilestone = (record) => ({
  id: record.id,
  type: record.type,
  title: record.title,
  description: record.description,
  achievedAt: record.achievedAt ?? void 0,
  progress: record.progress,
  requirements: record.requirements ?? [],
  rewards: record.rewards ?? []
});
var mapTimeline = (record) => ({
  id: record.id,
  userId: record.userId,
  courseId: record.courseId ?? void 0,
  events: (record.events ?? []).map(mapEvent2),
  milestones: (record.milestones ?? []).map(mapMilestone),
  currentPhase: record.currentPhase,
  statistics: record.statistics ?? {
    totalEvents: 0,
    totalMilestones: 0,
    milestonesAchieved: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    currentLevel: 1,
    averageDailyProgress: 0,
    completionRate: 0,
    engagementScore: 0
  },
  createdAt: record.createdAt,
  updatedAt: record.updatedAt
});
var PrismaJourneyTimelineStore = class {
  constructor(config) {
    this.config = config;
  }
  async getById(id) {
    const record = await this.config.prisma.sAMJourneyTimeline.findUnique({
      where: { id },
      include: { events: true, milestones: true }
    });
    return record ? mapTimeline(record) : null;
  }
  async get(userId, courseId) {
    const record = await this.config.prisma.sAMJourneyTimeline.findFirst({
      where: {
        userId,
        ...courseId ? { courseId } : {}
      },
      include: { events: true, milestones: true },
      orderBy: { updatedAt: "desc" }
    });
    return record ? mapTimeline(record) : null;
  }
  async create(timeline) {
    const record = await this.config.prisma.sAMJourneyTimeline.create({
      data: {
        userId: timeline.userId,
        courseId: timeline.courseId ?? null,
        currentPhase: timeline.currentPhase,
        statistics: timeline.statistics
      }
    });
    const events = await Promise.all(
      (timeline.events ?? []).map(
        (event) => this.config.prisma.sAMJourneyEvent.create({
          data: {
            timelineId: record.id,
            type: event.type,
            timestamp: event.timestamp,
            data: event.data,
            impact: event.impact,
            relatedEntities: event.relatedEntities ?? []
          }
        })
      )
    );
    const milestones = await Promise.all(
      (timeline.milestones ?? []).map(
        (milestone) => this.config.prisma.sAMJourneyMilestone.create({
          data: {
            timelineId: record.id,
            type: milestone.type,
            title: milestone.title,
            description: milestone.description,
            achievedAt: milestone.achievedAt ?? null,
            progress: milestone.progress,
            requirements: milestone.requirements,
            rewards: milestone.rewards
          }
        })
      )
    );
    return mapTimeline({ ...record, events, milestones });
  }
  async update(id, updates) {
    await this.config.prisma.sAMJourneyTimeline.update({
      where: { id },
      data: {
        courseId: updates.courseId ?? void 0,
        currentPhase: updates.currentPhase,
        statistics: updates.statistics
      }
    });
    const record = await this.config.prisma.sAMJourneyTimeline.findUnique({
      where: { id },
      include: { events: true, milestones: true }
    });
    if (!record) {
      throw new Error(`Timeline not found: ${id}`);
    }
    return mapTimeline(record);
  }
  async delete(id) {
    try {
      await this.config.prisma.sAMJourneyTimeline.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
  async addEvent(id, event) {
    const record = await this.config.prisma.sAMJourneyEvent.create({
      data: {
        timelineId: id,
        type: event.type,
        timestamp: event.timestamp,
        data: event.data,
        impact: event.impact,
        relatedEntities: event.relatedEntities ?? []
      }
    });
    return mapEvent2(record);
  }
  async getEvents(id, options) {
    const records = await this.config.prisma.sAMJourneyEvent.findMany({
      where: {
        timelineId: id,
        ...options?.types ? { type: { in: options.types } } : {}
      },
      orderBy: { timestamp: "desc" },
      skip: options?.offset ?? 0,
      take: options?.limit ?? 100
    });
    return records.map(mapEvent2);
  }
  async updateMilestone(_timelineId, milestoneId, updates) {
    const record = await this.config.prisma.sAMJourneyMilestone.update({
      where: { id: milestoneId },
      data: {
        type: updates.type,
        title: updates.title,
        description: updates.description,
        achievedAt: updates.achievedAt ?? void 0,
        progress: updates.progress,
        requirements: updates.requirements,
        rewards: updates.rewards
      }
    });
    return mapMilestone(record);
  }
};
function createPrismaJourneyTimelineStore(config) {
  return new PrismaJourneyTimelineStore(config);
}

// src/review-schedule-store.ts
var PrismaReviewScheduleStore = class {
  prisma;
  tableName;
  constructor(config) {
    this.prisma = config.prisma;
    this.tableName = config.tableName ?? "reviewSchedule";
  }
  async save(entry) {
    await this.prisma[this.tableName].upsert({
      where: { studentId_topicId: { studentId: entry.studentId, topicId: entry.topicId } },
      create: entry,
      update: { ...entry, updatedAt: /* @__PURE__ */ new Date() }
    });
  }
  async get(studentId, topicId) {
    return this.prisma[this.tableName].findUnique({
      where: { studentId_topicId: { studentId, topicId } }
    });
  }
  async getDueReviews(studentId, limit) {
    return this.prisma[this.tableName].findMany({
      where: {
        studentId,
        nextReviewAt: { lte: /* @__PURE__ */ new Date() }
      },
      orderBy: { nextReviewAt: "asc" },
      take: limit ?? 20
    });
  }
  async getAllForStudent(studentId) {
    return this.prisma[this.tableName].findMany({
      where: { studentId },
      orderBy: { nextReviewAt: "asc" }
    });
  }
  async delete(studentId, topicId) {
    await this.prisma[this.tableName].delete({
      where: { studentId_topicId: { studentId, topicId } }
    });
  }
};
function createPrismaReviewScheduleStore(config) {
  return new PrismaReviewScheduleStore(config);
}

// src/golden-test-store.ts
var PrismaGoldenTestStore = class {
  prisma;
  tableName;
  constructor(config) {
    this.prisma = config.prisma;
    this.tableName = config.tableName ?? "goldenTestCase";
  }
  async save(testCase) {
    await this.prisma[this.tableName].upsert({
      where: { id: testCase.id },
      create: testCase,
      update: { ...testCase, updatedAt: /* @__PURE__ */ new Date() }
    });
  }
  async get(id) {
    return this.prisma[this.tableName].findUnique({ where: { id } });
  }
  async getByCategory(category) {
    return this.prisma[this.tableName].findMany({
      where: { category, isActive: true },
      orderBy: { name: "asc" }
    });
  }
  async getActive() {
    return this.prisma[this.tableName].findMany({
      where: { isActive: true },
      orderBy: { category: "asc" }
    });
  }
  async search(query) {
    return this.prisma[this.tableName].findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { has: query } }
        ]
      },
      take: 50
    });
  }
  async delete(id) {
    await this.prisma[this.tableName].delete({ where: { id } });
  }
  async count() {
    return this.prisma[this.tableName].count({ where: { isActive: true } });
  }
};
function createPrismaGoldenTestStore(config) {
  return new PrismaGoldenTestStore(config);
}

// src/presence-store.ts
function mapRecordToPresence(record) {
  return {
    userId: record.userId,
    connectionId: record.connectionId || "",
    status: record.status,
    lastActivityAt: record.lastActivityAt,
    connectedAt: record.connectedAt || record.createdAt,
    metadata: {
      deviceType: record.deviceType,
      browser: record.browser || void 0,
      os: record.os || void 0,
      location: {
        pageUrl: record.pageUrl || void 0,
        courseId: record.courseId || void 0,
        chapterId: record.chapterId || void 0,
        sectionId: record.sectionId || void 0
      },
      sessionContext: {
        planId: record.planId || void 0,
        stepId: record.stepId || void 0,
        goalId: record.goalId || void 0
      }
    },
    subscriptions: record.subscriptions
  };
}
function mapPresenceToData(presence) {
  return {
    connectionId: presence.connectionId || null,
    status: presence.status,
    lastActivityAt: presence.lastActivityAt,
    connectedAt: presence.connectedAt,
    deviceType: presence.metadata.deviceType,
    browser: presence.metadata.browser || null,
    os: presence.metadata.os || null,
    pageUrl: presence.metadata.location?.pageUrl || null,
    courseId: presence.metadata.location?.courseId || null,
    chapterId: presence.metadata.location?.chapterId || null,
    sectionId: presence.metadata.location?.sectionId || null,
    planId: presence.metadata.sessionContext?.planId || null,
    stepId: presence.metadata.sessionContext?.stepId || null,
    goalId: presence.metadata.sessionContext?.goalId || null,
    subscriptions: presence.subscriptions
  };
}
var PrismaPresenceStore = class {
  prisma;
  constructor(config) {
    this.prisma = config.prisma;
  }
  async get(userId) {
    const record = await this.prisma.sAMUserPresence.findUnique({
      where: { userId }
    });
    if (!record) return null;
    return mapRecordToPresence(record);
  }
  async getByConnection(connectionId) {
    const record = await this.prisma.sAMUserPresence.findUnique({
      where: { connectionId }
    });
    if (!record) return null;
    return mapRecordToPresence(record);
  }
  async set(presence) {
    const data = mapPresenceToData(presence);
    await this.prisma.sAMUserPresence.upsert({
      where: { userId: presence.userId },
      create: {
        userId: presence.userId,
        ...data
      },
      update: data
    });
  }
  async update(userId, updates) {
    const existing = await this.get(userId);
    if (!existing) return null;
    const merged = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        ...updates.metadata || {},
        location: {
          ...existing.metadata.location,
          ...updates.metadata?.location || {}
        },
        sessionContext: {
          ...existing.metadata.sessionContext,
          ...updates.metadata?.sessionContext || {}
        }
      }
    };
    const data = mapPresenceToData(merged);
    const record = await this.prisma.sAMUserPresence.update({
      where: { userId },
      data
    });
    return mapRecordToPresence(record);
  }
  async delete(userId) {
    try {
      await this.prisma.sAMUserPresence.delete({
        where: { userId }
      });
      return true;
    } catch {
      return false;
    }
  }
  async deleteByConnection(connectionId) {
    try {
      await this.prisma.sAMUserPresence.delete({
        where: { connectionId }
      });
      return true;
    } catch {
      return false;
    }
  }
  async getOnline() {
    const records = await this.prisma.sAMUserPresence.findMany({
      where: {
        OR: [
          { status: "ONLINE" },
          { status: "STUDYING" },
          { status: "IDLE" }
        ]
      }
    });
    return records.map(mapRecordToPresence);
  }
  async getByStatus(status) {
    const records = await this.prisma.sAMUserPresence.findMany({
      where: {
        status: status.toUpperCase()
      }
    });
    return records.map(mapRecordToPresence);
  }
  async cleanup(olderThan) {
    const result = await this.prisma.sAMUserPresence.deleteMany({
      where: {
        status: "OFFLINE",
        lastActivityAt: {
          lt: olderThan
        }
      }
    });
    return result.count;
  }
};
function createPrismaPresenceStore(config) {
  return new PrismaPresenceStore(config);
}

// src/push-queue-store.ts
function mapRecordToRequest(record) {
  const eventPayload = record.eventPayload;
  return {
    id: record.id,
    userId: record.userId,
    event: {
      type: record.eventType,
      payload: eventPayload.payload,
      timestamp: new Date(eventPayload.timestamp),
      eventId: record.eventId,
      userId: record.userId
    },
    priority: record.priority.toLowerCase(),
    channels: record.channels.map((c) => c.toLowerCase()),
    fallbackChannels: record.fallbackChannels?.map((c) => c.toLowerCase()),
    expiresAt: record.expiresAt || void 0,
    metadata: record.metadata
  };
}
function mapPriorityToDb(priority) {
  return priority.toUpperCase();
}
function mapChannelToDb(channel) {
  return channel.toUpperCase().replace("-", "_");
}
var PrismaPushQueueStore = class {
  prisma;
  constructor(config) {
    this.prisma = config.prisma;
  }
  async enqueue(request) {
    await this.prisma.sAMPushQueue.create({
      data: {
        id: request.id,
        userId: request.userId,
        eventType: request.event.type,
        eventPayload: {
          type: request.event.type,
          payload: request.event.payload,
          timestamp: request.event.timestamp.toISOString(),
          eventId: request.event.eventId,
          userId: request.event.userId,
          sessionId: request.event.sessionId
        },
        eventId: request.event.eventId,
        priority: mapPriorityToDb(request.priority),
        channels: request.channels.map(mapChannelToDb),
        fallbackChannels: request.fallbackChannels?.map(mapChannelToDb) || [],
        status: "PENDING",
        attempts: 0,
        maxAttempts: 3,
        queuedAt: /* @__PURE__ */ new Date(),
        expiresAt: request.expiresAt || null,
        metadata: request.metadata || null
      }
    });
  }
  async dequeue(count) {
    const records = await this.prisma.sAMPushQueue.findMany({
      where: {
        status: "PENDING",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: /* @__PURE__ */ new Date() } }
        ]
      },
      orderBy: [
        { priority: "asc" },
        // CRITICAL < HIGH < NORMAL < LOW in enum order
        { queuedAt: "asc" }
      ],
      take: count
    });
    if (records.length === 0) {
      return [];
    }
    const ids = records.map((r) => r.id);
    await this.prisma.sAMPushQueue.updateMany({
      where: { id: { in: ids } },
      data: {
        status: "PROCESSING",
        processingAt: /* @__PURE__ */ new Date()
      }
    });
    return records.map(mapRecordToRequest);
  }
  async peek(count) {
    const records = await this.prisma.sAMPushQueue.findMany({
      where: {
        status: "PENDING",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: /* @__PURE__ */ new Date() } }
        ]
      },
      orderBy: [
        { priority: "asc" },
        { queuedAt: "asc" }
      ],
      take: count
    });
    return records.map(mapRecordToRequest);
  }
  async acknowledge(requestId, result) {
    const now = /* @__PURE__ */ new Date();
    const queueItem = await this.prisma.sAMPushQueue.update({
      where: { id: requestId },
      data: {
        status: result.success ? "DELIVERED" : "FAILED",
        deliveredVia: result.deliveredVia ? mapChannelToDb(result.deliveredVia) : null,
        deliveredAt: result.deliveredAt || now,
        acknowledgedAt: result.acknowledgedAt || null,
        error: result.error || null,
        lastAttemptAt: now
      }
    });
    const processingTimeMs = queueItem.processingAt ? now.getTime() - queueItem.processingAt.getTime() : null;
    await this.prisma.sAMPushDeliveryResult.create({
      data: {
        queueItemId: requestId,
        userId: result.userId,
        success: result.success,
        deliveredVia: result.deliveredVia ? mapChannelToDb(result.deliveredVia) : null,
        attemptedChannels: result.attemptedChannels.map(mapChannelToDb),
        error: result.error || null,
        deliveredAt: result.deliveredAt || now,
        acknowledgedAt: result.acknowledgedAt || null,
        processingTimeMs
      }
    });
  }
  async requeue(request) {
    const existing = await this.prisma.sAMPushQueue.findUnique({
      where: { id: request.id }
    });
    if (existing) {
      await this.prisma.sAMPushQueue.update({
        where: { id: request.id },
        data: {
          status: "PENDING",
          processingAt: null,
          attempts: existing.attempts + 1,
          lastAttemptAt: /* @__PURE__ */ new Date()
        }
      });
    } else {
      await this.enqueue(request);
    }
  }
  async getStats() {
    const [pending, processing, completed, failed] = await Promise.all([
      this.prisma.sAMPushQueue.count({ where: { status: "PENDING" } }),
      this.prisma.sAMPushQueue.count({ where: { status: "PROCESSING" } }),
      this.prisma.sAMPushQueue.count({ where: { status: "DELIVERED" } }),
      this.prisma.sAMPushQueue.count({ where: { status: "FAILED" } })
    ]);
    const avgResult = await this.prisma.sAMPushDeliveryResult.aggregate({
      _avg: { processingTimeMs: true }
    });
    const oldestPending = await this.prisma.sAMPushQueue.findMany({
      where: { status: "PENDING" },
      orderBy: { queuedAt: "asc" },
      take: 1,
      select: { queuedAt: true }
    });
    return {
      pending,
      processing,
      completed,
      failed,
      avgProcessingTimeMs: avgResult._avg.processingTimeMs || 0,
      oldestPendingAt: oldestPending[0]?.queuedAt
    };
  }
  async cleanup(olderThan) {
    const result = await this.prisma.sAMPushQueue.deleteMany({
      where: {
        OR: [
          { status: "DELIVERED", deliveredAt: { lt: olderThan } },
          { status: "FAILED", lastAttemptAt: { lt: olderThan } },
          { status: "EXPIRED", expiresAt: { lt: olderThan } }
        ]
      }
    });
    await this.prisma.sAMPushQueue.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: /* @__PURE__ */ new Date() }
      },
      data: {
        status: "EXPIRED"
      }
    });
    return result.count;
  }
  // ============================================================================
  // ADDITIONAL METHODS (not in interface but useful)
  // ============================================================================
  /**
   * Get queue items for a specific user
   */
  async getByUser(userId, status) {
    const records = await this.prisma.sAMPushQueue.findMany({
      where: {
        userId,
        ...status ? { status: status.toUpperCase() } : {}
      },
      orderBy: { queuedAt: "desc" }
    });
    return records.map(mapRecordToRequest);
  }
  /**
   * Get a specific queue item by ID
   */
  async get(id) {
    const record = await this.prisma.sAMPushQueue.findUnique({
      where: { id }
    });
    if (!record) return null;
    return mapRecordToRequest(record);
  }
  /**
   * Cancel a pending queue item
   */
  async cancel(id) {
    try {
      await this.prisma.sAMPushQueue.delete({
        where: { id, status: "PENDING" }
      });
      return true;
    } catch {
      return false;
    }
  }
};
function createPrismaPushQueueStore(config) {
  return new PrismaPushQueueStore(config);
}

// src/observability-store.ts
var PrismaToolTelemetryStore = class {
  prisma;
  constructor(config) {
    this.prisma = config.prisma;
  }
  async recordExecution(event) {
    await this.prisma.sAMToolExecution.create({
      data: {
        id: event.executionId,
        toolId: event.toolId,
        toolName: event.toolName,
        userId: event.userId,
        sessionId: event.sessionId || null,
        planId: event.planId || null,
        stepId: event.stepId || null,
        status: event.status,
        startedAt: event.startedAt,
        completedAt: event.completedAt || null,
        durationMs: event.durationMs || null,
        confirmationRequired: event.confirmationRequired,
        confirmationGiven: event.confirmationGiven || null,
        inputSummary: event.inputSummary || null,
        outputSummary: event.outputSummary || null,
        errorCode: event.error?.code || null,
        errorMessage: event.error?.message || null,
        errorRetryable: event.error?.retryable || null,
        tags: event.tags || {}
      }
    });
  }
  async updateExecution(executionId, updates) {
    await this.prisma.sAMToolExecution.update({
      where: { id: executionId },
      data: {
        status: updates.status,
        completedAt: updates.completedAt,
        durationMs: updates.durationMs,
        confirmationGiven: updates.confirmationGiven,
        outputSummary: updates.outputSummary,
        errorCode: updates.error?.code,
        errorMessage: updates.error?.message,
        errorRetryable: updates.error?.retryable
      }
    });
  }
  async getExecution(executionId) {
    const record = await this.prisma.sAMToolExecution.findUnique({
      where: { id: executionId }
    });
    if (!record) return null;
    return this.mapRecordToEvent(record);
  }
  async getMetrics(periodStart, periodEnd, toolId) {
    const where = {
      createdAt: {
        gte: periodStart,
        lte: periodEnd
      }
    };
    if (toolId) {
      where.toolId = toolId;
    }
    const executions = await this.prisma.sAMToolExecution.findMany({
      where
    });
    const total = executions.length;
    const successes = executions.filter((e) => e.status === "success").length;
    const latencies = executions.filter((e) => e.durationMs !== null).map((e) => e.durationMs).sort((a, b) => a - b);
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    const p50 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.5)] : 0;
    const p95 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;
    const p99 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.99)] : 0;
    const withConfirmation = executions.filter((e) => e.confirmationRequired);
    const confirmedCount = withConfirmation.filter((e) => e.confirmationGiven === true).length;
    const failuresByCode = {};
    executions.filter((e) => e.status === "failed" && e.errorCode).forEach((e) => {
      const code = e.errorCode;
      failuresByCode[code] = (failuresByCode[code] || 0) + 1;
    });
    const executionsByTool = {};
    executions.forEach((e) => {
      executionsByTool[e.toolName] = (executionsByTool[e.toolName] || 0) + 1;
    });
    return {
      executionCount: total,
      successRate: total > 0 ? successes / total : 0,
      avgLatencyMs: avgLatency,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      confirmationRate: total > 0 ? withConfirmation.length / total : 0,
      confirmationAcceptRate: withConfirmation.length > 0 ? confirmedCount / withConfirmation.length : 0,
      failuresByCode,
      executionsByTool,
      periodStart,
      periodEnd
    };
  }
  /**
   * Query tool executions with filters
   */
  async queryExecutions(options) {
    const where = {};
    if (options.startTime || options.endTime) {
      where.createdAt = {};
      if (options.startTime) {
        where.createdAt.gte = options.startTime;
      }
      if (options.endTime) {
        where.createdAt.lte = options.endTime;
      }
    }
    if (options.toolId) {
      where.toolId = options.toolId;
    }
    if (options.toolName) {
      where.toolName = { contains: options.toolName, mode: "insensitive" };
    }
    if (options.userId) {
      where.userId = options.userId;
    }
    if (options.status) {
      where.status = options.status;
    }
    const records = await this.prisma.sAMToolExecution.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options.limit ?? 50,
      skip: options.offset ?? 0
    });
    return records.map((record) => this.mapRecordToEvent(record));
  }
  /**
   * Count tool executions matching filters
   */
  async countExecutions(options) {
    const where = {};
    if (options.startTime || options.endTime) {
      where.createdAt = {};
      if (options.startTime) {
        where.createdAt.gte = options.startTime;
      }
      if (options.endTime) {
        where.createdAt.lte = options.endTime;
      }
    }
    if (options.toolId) {
      where.toolId = options.toolId;
    }
    if (options.userId) {
      where.userId = options.userId;
    }
    if (options.status) {
      where.status = options.status;
    }
    return this.prisma.sAMToolExecution.count({ where });
  }
  mapRecordToEvent(record) {
    return {
      executionId: record.id,
      toolId: record.toolId,
      toolName: record.toolName,
      userId: record.userId,
      sessionId: record.sessionId || void 0,
      planId: record.planId || void 0,
      stepId: record.stepId || void 0,
      startedAt: record.startedAt || /* @__PURE__ */ new Date(),
      completedAt: record.completedAt || void 0,
      durationMs: record.durationMs || void 0,
      status: record.status,
      error: record.errorCode ? {
        code: record.errorCode,
        message: record.errorMessage || "Unknown error",
        retryable: record.errorRetryable || false
      } : void 0,
      confirmationRequired: record.confirmationRequired,
      confirmationGiven: record.confirmationGiven || void 0,
      inputSummary: record.inputSummary || void 0,
      outputSummary: record.outputSummary || void 0,
      tags: record.tags || void 0
    };
  }
};
var PrismaConfidenceCalibrationStore = class {
  prisma;
  constructor(config) {
    this.prisma = config.prisma;
  }
  async record(prediction) {
    await this.prisma.sAMConfidenceScore.create({
      data: {
        id: prediction.predictionId,
        userId: prediction.userId,
        sessionId: prediction.sessionId || null,
        responseId: prediction.responseId,
        responseType: prediction.responseType,
        predictedConfidence: prediction.predictedConfidence,
        factors: prediction.factors,
        predictedAt: prediction.predictedAt,
        accurate: prediction.actualOutcome?.accurate || null,
        userVerified: prediction.actualOutcome?.userVerified || null,
        verificationMethod: prediction.actualOutcome?.verificationMethod || null,
        qualityScore: prediction.actualOutcome?.qualityScore || null,
        outcomeRecordedAt: prediction.actualOutcome?.recordedAt || null,
        outcomeNotes: prediction.actualOutcome?.notes || null
      }
    });
  }
  async getById(predictionId) {
    const record = await this.prisma.sAMConfidenceScore.findUnique({
      where: { id: predictionId }
    });
    if (!record) return null;
    return {
      predictionId: record.id,
      userId: record.userId,
      sessionId: record.sessionId || void 0,
      responseId: record.responseId,
      responseType: record.responseType,
      predictedConfidence: record.predictedConfidence,
      factors: record.factors,
      predictedAt: record.predictedAt,
      actualOutcome: record.accurate !== null ? {
        accurate: record.accurate,
        userVerified: record.userVerified ?? false,
        verificationMethod: record.verificationMethod ?? "implicit",
        qualityScore: record.qualityScore ?? void 0,
        recordedAt: record.outcomeRecordedAt ?? /* @__PURE__ */ new Date(),
        notes: record.outcomeNotes ?? void 0
      } : void 0
    };
  }
  async recordOutcome(predictionId, outcome) {
    await this.prisma.sAMConfidenceScore.update({
      where: { id: predictionId },
      data: {
        accurate: outcome.accurate,
        userVerified: outcome.userVerified,
        verificationMethod: outcome.verificationMethod,
        qualityScore: outcome.qualityScore ?? null,
        outcomeRecordedAt: outcome.recordedAt,
        outcomeNotes: outcome.notes ?? null
      }
    });
  }
  async getCalibrationMetrics(periodStart, periodEnd) {
    const predictions = await this.prisma.sAMConfidenceScore.findMany({
      where: {
        predictedAt: {
          gte: periodStart,
          lte: periodEnd
        }
      }
    });
    const withOutcomes = predictions.filter((p) => p.accurate !== null);
    const avgPredicted = predictions.length > 0 ? predictions.reduce((sum, p) => sum + p.predictedConfidence, 0) / predictions.length : 0;
    const avgActual = withOutcomes.length > 0 ? withOutcomes.filter((p) => p.accurate).length / withOutcomes.length : 0;
    const buckets = this.calculateCalibrationBuckets(predictions);
    const byResponseType = this.calculateMetricsByType(predictions);
    const brierScore = withOutcomes.length > 0 ? withOutcomes.reduce((sum, p) => {
      const actual = p.accurate ? 1 : 0;
      return sum + Math.pow(p.predictedConfidence - actual, 2);
    }, 0) / withOutcomes.length : 0;
    return {
      predictionCount: predictions.length,
      outcomesRecorded: withOutcomes.length,
      avgPredictedConfidence: avgPredicted,
      avgActualAccuracy: avgActual,
      calibrationError: Math.abs(avgPredicted - avgActual),
      brierScore,
      calibrationBuckets: buckets,
      verificationOverrideRate: 0,
      byResponseType,
      periodStart,
      periodEnd
    };
  }
  calculateCalibrationBuckets(predictions) {
    const bucketRanges = [
      { start: 0, end: 0.2 },
      { start: 0.2, end: 0.4 },
      { start: 0.4, end: 0.6 },
      { start: 0.6, end: 0.8 },
      { start: 0.8, end: 1 }
    ];
    return bucketRanges.map(({ start, end }) => {
      const inBucket = predictions.filter(
        (p) => p.predictedConfidence >= start && p.predictedConfidence < end
      );
      const withOutcomes = inBucket.filter((p) => p.accurate !== null);
      const avgPredicted = inBucket.length > 0 ? inBucket.reduce((sum, p) => sum + p.predictedConfidence, 0) / inBucket.length : (start + end) / 2;
      const actualAccuracy = withOutcomes.length > 0 ? withOutcomes.filter((p) => p.accurate).length / withOutcomes.length : 0;
      return {
        rangeStart: start,
        rangeEnd: end,
        count: inBucket.length,
        avgPredicted,
        actualAccuracy,
        error: Math.abs(avgPredicted - actualAccuracy)
      };
    });
  }
  calculateMetricsByType(predictions) {
    const types = ["explanation", "answer", "recommendation", "assessment", "intervention", "tool_result"];
    const result = {};
    types.forEach((type) => {
      const ofType = predictions.filter((p) => p.responseType === type);
      const withOutcomes = ofType.filter((p) => p.accurate !== null);
      const avgPredicted = ofType.length > 0 ? ofType.reduce((sum, p) => sum + p.predictedConfidence, 0) / ofType.length : 0;
      const avgActual = withOutcomes.length > 0 ? withOutcomes.filter((p) => p.accurate).length / withOutcomes.length : 0;
      result[type] = {
        predictionCount: ofType.length,
        avgPredictedConfidence: avgPredicted,
        avgActualAccuracy: avgActual,
        calibrationError: Math.abs(avgPredicted - avgActual)
      };
    });
    return result;
  }
};
var PrismaMemoryQualityStore = class {
  prisma;
  constructor(config) {
    this.prisma = config.prisma;
  }
  async recordRetrieval(event) {
    await this.prisma.sAMMemoryRetrieval.create({
      data: {
        id: event.retrievalId,
        userId: event.userId,
        sessionId: event.sessionId || null,
        query: event.query,
        source: event.source,
        resultCount: event.resultCount,
        topRelevanceScore: event.topRelevanceScore,
        avgRelevanceScore: event.avgRelevanceScore,
        cacheHit: event.cacheHit,
        latencyMs: event.latencyMs,
        feedbackHelpful: event.userFeedback?.helpful || null,
        feedbackRating: event.userFeedback?.relevanceRating || null,
        feedbackComment: event.userFeedback?.comment || null,
        feedbackProvidedAt: event.userFeedback?.providedAt || null,
        metadata: event.metadata || {},
        timestamp: event.timestamp
      }
    });
  }
  async recordFeedback(retrievalId, helpful, rating, comment) {
    await this.prisma.sAMMemoryRetrieval.update({
      where: { id: retrievalId },
      data: {
        feedbackHelpful: helpful,
        feedbackRating: rating || null,
        feedbackComment: comment || null,
        feedbackProvidedAt: /* @__PURE__ */ new Date()
      }
    });
  }
  async getQualityMetrics(periodStart, periodEnd) {
    const retrievals = await this.prisma.sAMMemoryRetrieval.findMany({
      where: {
        timestamp: {
          gte: periodStart,
          lte: periodEnd
        }
      }
    });
    const total = retrievals.length;
    const cacheHits = retrievals.filter((r) => r.cacheHit).length;
    const withFeedback = retrievals.filter((r) => r.feedbackHelpful !== null);
    const positiveFeedback = withFeedback.filter((r) => r.feedbackHelpful).length;
    const emptyResults = retrievals.filter((r) => r.resultCount === 0).length;
    const avgRelevance = total > 0 ? retrievals.reduce((sum, r) => sum + r.avgRelevanceScore, 0) / total : 0;
    const relevanceScores = retrievals.map((r) => r.avgRelevanceScore).sort((a, b) => a - b);
    const medianRelevance = relevanceScores.length > 0 ? relevanceScores[Math.floor(relevanceScores.length / 2)] : 0;
    const latencies = retrievals.map((r) => r.latencyMs).sort((a, b) => a - b);
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    const p95Latency = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;
    const bySource = this.calculateSourceMetrics(retrievals);
    return {
      searchCount: total,
      avgRelevanceScore: avgRelevance,
      medianRelevanceScore: medianRelevance,
      cacheHitRate: total > 0 ? cacheHits / total : 0,
      avgLatencyMs: avgLatency,
      p95LatencyMs: p95Latency,
      emptyResultRate: total > 0 ? emptyResults / total : 0,
      positiveFeedbackRate: withFeedback.length > 0 ? positiveFeedback / withFeedback.length : 0,
      bySource,
      reindexQueueDepth: 0,
      periodStart,
      periodEnd
    };
  }
  calculateSourceMetrics(retrievals) {
    const sources = [
      "vector_search",
      "knowledge_graph",
      "session_context",
      "cross_session",
      "curriculum",
      "external"
    ];
    const result = {};
    sources.forEach((source) => {
      const ofSource = retrievals.filter((r) => r.source === source);
      const cacheHits = ofSource.filter((r) => r.cacheHit).length;
      result[source] = {
        searchCount: ofSource.length,
        avgRelevanceScore: ofSource.length > 0 ? ofSource.reduce((sum, r) => sum + r.avgRelevanceScore, 0) / ofSource.length : 0,
        avgLatencyMs: ofSource.length > 0 ? ofSource.reduce((sum, r) => sum + r.latencyMs, 0) / ofSource.length : 0,
        cacheHitRate: ofSource.length > 0 ? cacheHits / ofSource.length : 0
      };
    });
    return result;
  }
};
var PrismaPlanLifecycleStore = class {
  prisma;
  constructor(config) {
    this.prisma = config.prisma;
  }
  async recordEvent(event) {
    await this.prisma.sAMPlanLifecycleEvent.create({
      data: {
        id: event.eventId,
        planId: event.planId,
        userId: event.userId,
        eventType: event.eventType,
        stepId: event.stepId || null,
        previousState: event.previousState || null,
        newState: event.newState || null,
        metadata: event.metadata || {},
        timestamp: event.timestamp
      }
    });
  }
  async getEvents(planId, limit) {
    const records = await this.prisma.sAMPlanLifecycleEvent.findMany({
      where: { planId },
      orderBy: { timestamp: "desc" },
      take: limit
    });
    return records.map(this.mapRecordToEvent);
  }
  async getUserEvents(userId, periodStart, periodEnd) {
    const records = await this.prisma.sAMPlanLifecycleEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      orderBy: { timestamp: "desc" }
    });
    return records.map(this.mapRecordToEvent);
  }
  mapRecordToEvent(record) {
    return {
      eventId: record.id,
      planId: record.planId,
      userId: record.userId,
      eventType: record.eventType,
      stepId: record.stepId || void 0,
      previousState: record.previousState || void 0,
      newState: record.newState || void 0,
      metadata: record.metadata || void 0,
      timestamp: record.timestamp
    };
  }
};
var PrismaMetricsStore = class {
  prisma;
  constructor(config) {
    this.prisma = config.prisma;
  }
  async recordMetric(name, value, labels, userId, sessionId) {
    await this.prisma.sAMMetric.create({
      data: {
        name,
        value,
        labels: labels || {},
        userId: userId || null,
        sessionId: sessionId || null
      }
    });
  }
  async getMetrics(name, periodStart, periodEnd, userId) {
    const where = {
      name,
      timestamp: {
        gte: periodStart,
        lte: periodEnd
      }
    };
    if (userId) {
      where.userId = userId;
    }
    const records = await this.prisma.sAMMetric.findMany({
      where,
      orderBy: { timestamp: "asc" }
    });
    return records.map((r) => ({
      value: r.value,
      timestamp: r.timestamp,
      labels: r.labels || {}
    }));
  }
  async cleanup(olderThan) {
    const result = await this.prisma.sAMMetric.deleteMany({
      where: {
        timestamp: {
          lt: olderThan
        }
      }
    });
    return result.count;
  }
};
function createPrismaObservabilityStores(config) {
  return {
    toolTelemetry: new PrismaToolTelemetryStore(config),
    confidenceCalibration: new PrismaConfidenceCalibrationStore(config),
    memoryQuality: new PrismaMemoryQualityStore(config),
    planLifecycle: new PrismaPlanLifecycleStore(config),
    metrics: new PrismaMetricsStore(config)
  };
}

// src/unified-factory.ts
function createSAMPrismaAdapters(config) {
  const { prisma, debug, modelNames = {} } = config;
  return {
    database: new PrismaSAMAdapter({ prisma, debug }),
    calibration: new PrismaSampleStore({
      prisma,
      tableName: modelNames.calibrationSample
    }),
    studentProfiles: new PrismaStudentProfileStore({
      prisma,
      profileTableName: modelNames.studentProfile,
      masteryTableName: modelNames.topicMastery,
      pathwayTableName: modelNames.learningPathway
    }),
    memory: new PrismaMemoryStore({
      prisma,
      tableName: modelNames.memoryEntry
    }),
    reviewSchedules: new PrismaReviewScheduleStore({
      prisma,
      tableName: modelNames.reviewSchedule
    }),
    goldenTests: new PrismaGoldenTestStore({
      prisma,
      tableName: modelNames.goldenTestCase
    })
  };
}

// src/schema-helpers.ts
var SAM_PRISMA_MODELS = {
  /**
   * Core models (required)
   */
  core: ["User", "Course", "Chapter", "Section"],
  /**
   * SAM-specific models (optional but recommended)
   */
  sam: [
    "SAMInteraction",
    "StudentBloomsProgress",
    "CognitiveSkillProgress",
    "CourseBloomsAnalysis",
    "QuestionBank"
  ],
  /**
   * Calibration models (for quality tracking)
   */
  calibration: ["CalibrationSample"],
  /**
   * Memory models (for adaptive learning)
   */
  memory: ["StudentProfile", "TopicMastery", "LearningPathway", "MemoryEntry", "ReviewSchedule"],
  /**
   * Version control models (for testing)
   */
  versionControl: ["GoldenTestCase"]
};
function generatePrismaSchema(options) {
  const { includeCalibration = true, includeMemory = true, includeVersionControl = false } = options ?? {};
  let schema = `
// ============================================================================
// SAM AI MODELS
// ============================================================================

// SAM Interaction Logging
model SAMInteraction {
  id              String   @id @default(cuid())
  userId          String
  interactionType String
  context         Json
  duration        Int?
  success         Boolean  @default(true)
  createdAt       DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
}

// Student Bloom's Progress
model StudentBloomsProgress {
  id              String   @id @default(cuid())
  userId          String
  courseId        String?
  bloomsScores    Json     // { remember, understand, apply, analyze, evaluate, create }
  strengthAreas   Json?
  weaknessAreas   Json?
  progressHistory Json?
  lastAssessedAt  DateTime
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course          Course?  @relation(fields: [courseId], references: [id], onDelete: SetNull)

  @@unique([userId, courseId])
}

// Cognitive Skill Progress
model CognitiveSkillProgress {
  id              String    @id @default(cuid())
  userId          String
  conceptId       String
  overallMastery  Float     @default(0)
  totalAttempts   Int       @default(0)
  lastAttemptDate DateTime?
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, conceptId])
}

// Course Bloom's Analysis
model CourseBloomsAnalysis {
  id                 String   @id @default(cuid())
  courseId           String   @unique
  bloomsDistribution Json     // { remember, understand, apply, analyze, evaluate, create }
  cognitiveDepth     Float    @default(0)
  learningPathway    Json?
  skillsMatrix       Json?
  gapAnalysis        Json?
  recommendations    Json?
  analyzedAt         DateTime @default(now())

  course             Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
}

// Question Bank
model QuestionBank {
  id            String   @id @default(cuid())
  courseId      String?
  subject       String
  topic         String
  question      String
  questionType  String   // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY, FILL_IN_BLANK
  bloomsLevel   String   // REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE
  difficulty    String   // EASY, MEDIUM, HARD
  correctAnswer Json
  options       Json?
  explanation   String?
  tags          String[] @default([])
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  course        Course?  @relation(fields: [courseId], references: [id], onDelete: SetNull)

  @@index([courseId])
  @@index([bloomsLevel])
  @@index([difficulty])
}
`;
  if (includeCalibration) {
    schema += `
// ============================================================================
// CALIBRATION MODELS
// ============================================================================

model CalibrationSample {
  id               String    @id @default(cuid())
  evaluationId     String
  aiScore          Float
  humanScore       Float?
  aiFeedback       String
  humanFeedback    String?
  adjustmentReason String?
  context          Json
  versionInfo      Json
  tags             String[]  @default([])
  evaluatedAt      DateTime
  reviewedAt       DateTime?
  reviewerId       String?

  @@index([evaluatedAt])
  @@index([humanScore])
}
`;
  }
  if (includeMemory) {
    schema += `
// ============================================================================
// MEMORY & ADAPTIVE LEARNING MODELS
// ============================================================================

model StudentProfile {
  id                        String     @id @default(cuid())
  userId                    String     @unique
  cognitivePreferences      Json
  performanceMetrics        Json
  overallBloomsDistribution Json
  knowledgeGaps             String[]   @default([])
  strengths                 String[]   @default([])
  createdAt                 DateTime   @default(now())
  lastActiveAt              DateTime   @default(now())
  updatedAt                 DateTime   @updatedAt

  user                      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  masteryRecords            TopicMastery[]
  pathways                  LearningPathway[]
}

model TopicMastery {
  id              String    @id @default(cuid())
  studentId       String
  topicId         String
  level           String    // novice, beginner, intermediate, proficient, expert
  score           Float
  bloomsLevel     String
  assessmentCount Int       @default(0)
  averageScore    Float
  lastAssessedAt  DateTime
  trend           String    // improving, stable, declining
  confidence      Float     @default(0.5)

  student         StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([studentId, topicId])
}

model LearningPathway {
  id               String    @id @default(cuid())
  studentId        String
  courseId         String
  steps            Json
  currentStepIndex Int       @default(0)
  progress         Float     @default(0)
  status           String    @default("active") // active, completed, paused
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  student          StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@index([status])
}

model MemoryEntry {
  id         String    @id @default(cuid())
  studentId  String
  type       String    // insight, preference, milestone, feedback, context
  importance String    // low, medium, high, critical
  content    String
  metadata   Json?
  expiresAt  DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([studentId])
  @@index([type])
  @@index([expiresAt])
}

model ReviewSchedule {
  id             String    @id @default(cuid())
  studentId      String
  topicId        String
  nextReviewAt   DateTime
  interval       Int       // days
  easeFactor     Float     @default(2.5)
  repetitions    Int       @default(0)
  lastReviewedAt DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@unique([studentId, topicId])
  @@index([nextReviewAt])
}
`;
  }
  if (includeVersionControl) {
    schema += `
// ============================================================================
// VERSION CONTROL MODELS
// ============================================================================

model GoldenTestCase {
  id             String   @id @default(cuid())
  name           String
  description    String?
  category       String
  input          Json
  expectedResult Json
  tags           String[] @default([])
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([category])
  @@index([isActive])
}
`;
  }
  return schema.trim();
}

// src/index.ts
var VERSION = "0.1.0";
export {
  PrismaCalibrationStore,
  PrismaConfidenceCalibrationStore,
  PrismaConfidenceScoreStore,
  PrismaGoldenTestStore,
  PrismaJourneyTimelineStore,
  PrismaLearningEventStore,
  PrismaLearningPatternStore,
  PrismaLearningStrategyStore,
  PrismaMemoryQualityStore,
  PrismaMemoryStore,
  PrismaMetaLearningInsightStore,
  PrismaMetricsStore,
  PrismaPlanLifecycleStore,
  PrismaPresenceStore,
  PrismaPushQueueStore,
  PrismaQualityRecordStore,
  PrismaReviewScheduleStore,
  PrismaSAMAdapter,
  PrismaSampleStore,
  PrismaSelfCritiqueStore,
  PrismaStudentProfileStore,
  PrismaToolTelemetryStore,
  PrismaVerificationResultStore,
  SAM_PRISMA_MODELS,
  VERSION,
  createPrismaGoldenTestStore,
  createPrismaJourneyTimelineStore,
  createPrismaMemoryStore,
  createPrismaMetaLearningStores,
  createPrismaObservabilityStores,
  createPrismaPresenceStore,
  createPrismaPushQueueStore,
  createPrismaReviewScheduleStore,
  createPrismaSAMAdapter,
  createPrismaSampleStore,
  createPrismaSelfEvaluationStores,
  createPrismaStudentProfileStore,
  createSAMPrismaAdapters,
  generatePrismaSchema
};
