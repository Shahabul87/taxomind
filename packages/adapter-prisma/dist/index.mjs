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
  PrismaGoldenTestStore,
  PrismaMemoryStore,
  PrismaReviewScheduleStore,
  PrismaSAMAdapter,
  PrismaSampleStore,
  PrismaStudentProfileStore,
  SAM_PRISMA_MODELS,
  VERSION,
  createPrismaGoldenTestStore,
  createPrismaMemoryStore,
  createPrismaReviewScheduleStore,
  createPrismaSAMAdapter,
  createPrismaSampleStore,
  createPrismaStudentProfileStore,
  createSAMPrismaAdapters,
  generatePrismaSchema
};
