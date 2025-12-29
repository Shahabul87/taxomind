/**
 * Specialized Database Adapters for SAM Engines
 *
 * These adapters map the specialized database interfaces from @sam-ai/educational
 * to the Taxomind Prisma schema. Each engine has its own adapter interface.
 */


import type {
  TrendsDatabaseAdapter,
  CourseGuideDatabaseAdapter,
  CourseGuideInput,
  SimilarCourse,
  MarketDatabaseAdapter,
  MarketCourseData,
  StoredMarketAnalysis,
  CompetitorAnalysis,
  CollaborationDatabaseAdapter,
  CollaborationSession,
  CollaborationAnalytics,
  CollaborationContribution,
  InnovationDatabaseAdapter,
  CognitiveFitness,
  FitnessSession,
  FitnessMilestone,
  LearningDNA,
  StudyBuddy,
  BuddyInteraction,
  QuantumPath,
  PathObservation,
  InnovationLearningData,
} from '@sam-ai/educational';

// Use a generic type for Prisma client to support extended clients
// This allows both regular PrismaClient and extended versions (with metrics, etc.)
type PrismaLike = {
  sAMInteraction: any;
  course: any;
  user: any;
  enrollment: any;
  userBadge: any;
  sAMLearningProfile: any;
  courseMarketAnalysis: any;
  courseCompetitor: any;
  collaborationSession: any;
  collaborationContribution: any;
  collaborationAnalytics: any;
  cognitiveFitnessAssessment: any;
  learningDNA: any;
  studyBuddy: any;
  buddyInteraction: any;
  organizationUser: any;
};

// ============================================================================
// TRENDS DATABASE ADAPTER
// ============================================================================

export class PrismaTrendsDatabaseAdapter implements TrendsDatabaseAdapter {
  constructor(private prisma: PrismaLike) {}

  async createInteraction(data: {
    userId: string;
    interactionType: string;
    context?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.sAMInteraction.create({
      data: {
        userId: data.userId,
        interactionType: 'LEARNING_ASSISTANCE', // Using valid enum value
        context: {
          type: 'TREND_ANALYSIS',
          subType: data.interactionType,
          ...data.context,
        },
        success: true,
      },
    });
  }
}

// ============================================================================
// COURSE GUIDE DATABASE ADAPTER
// ============================================================================

export class PrismaCourseGuideDatabaseAdapter implements CourseGuideDatabaseAdapter {
  constructor(private prisma: PrismaLike) {}

  async getCourse(courseId: string): Promise<CourseGuideInput | null> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            sections: {
              include: {
                exams: { select: { id: true } },
                Question: { select: { id: true } },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        Enrollment: true,
        reviews: { select: { rating: true } },
        Purchase: { select: { createdAt: true } },
      },
    });

    if (!course) return null;

    return {
      id: course.id,
      title: course.title,
      price: course.price ?? undefined,
      chapters: course.chapters.map((ch: any) => ({
        id: ch.id,
        sections: ch.sections.map((s: any) => ({
          id: s.id,
          exams: s.exams.map((e: any) => ({ id: e.id })),
          questions: s.Question.map((q: any) => ({ id: q.id })),
        })),
      })),
      enrollments: course.Enrollment.map((e: any) => ({
        userId: e.userId,
        // Progress not available directly on Enrollment
        progress: undefined,
      })),
      reviews: course.reviews.map((r: any) => ({
        rating: r.rating,
      })),
      purchases: course.Purchase.map((p: any) => ({
        createdAt: p.createdAt,
      })),
    };
  }

  async getRecentInteractionCount(courseId: string, days: number): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.sAMInteraction.count({
      where: {
        courseId,
        createdAt: { gte: since },
      },
    });
  }

  async findCompetitors(courseId: string): Promise<SimilarCourse[]> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { category: true },
    });

    if (!course || !course.categoryId) return [];

    // Find courses in the same category
    const similarCourses = await this.prisma.course.findMany({
      where: {
        categoryId: course.categoryId,
        id: { not: courseId },
        isPublished: true,
      },
      include: {
        Enrollment: true,
        reviews: { select: { rating: true } },
      },
      take: 5,
    });

    return similarCourses.map((c: any) => ({
      id: c.id,
      title: c.title,
      similarity: 0.8, // Same category = high similarity
      enrollment: c.Enrollment.length,
      rating:
        c.reviews.length > 0
          ? c.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / c.reviews.length
          : 0,
      price: c.price ?? 0,
      strengths: [], // Would need more analysis
    }));
  }
}

// ============================================================================
// MARKET DATABASE ADAPTER
// ============================================================================

export class PrismaMarketDatabaseAdapter implements MarketDatabaseAdapter {
  constructor(private prisma: PrismaLike) {}

  async getCourse(courseId: string): Promise<MarketCourseData | null> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: { select: { id: true, name: true } },
        chapters: {
          include: {
            sections: { select: { id: true, title: true } },
          },
        },
        Purchase: { select: { id: true, userId: true } },
        Enrollment: { select: { id: true, userId: true } },
        reviews: { select: { id: true, rating: true, comment: true } },
      },
    });

    if (!course) return null;

    return {
      id: course.id,
      title: course.title,
      description: course.description ?? undefined,
      price: course.price ?? undefined,
      isPublished: course.isPublished,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      category: course.category ?? undefined,
      chapters: course.chapters.map((ch: any) => ({
        id: ch.id,
        title: ch.title,
        sections: ch.sections.map((s: any) => ({ id: s.id, title: s.title })),
      })),
      purchases: course.Purchase.map((p: any) => ({ id: p.id, userId: p.userId })),
      enrollments: course.Enrollment.map((e: any) => ({ id: e.id, userId: e.userId })),
      reviews: course.reviews.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment ?? undefined,
      })),
      whatYouWillLearn: course.whatYouWillLearn ?? [],
    };
  }

  async getStoredAnalysis(courseId: string): Promise<StoredMarketAnalysis | null> {
    const analysis = await this.prisma.courseMarketAnalysis.findUnique({
      where: { courseId },
    });

    if (!analysis) return null;

    return {
      courseId: analysis.courseId,
      marketValue: analysis.marketValue,
      demandScore: analysis.demandScore,
      competitorAnalysis: analysis.competitorAnalysis as unknown as StoredMarketAnalysis['competitorAnalysis'],
      pricingAnalysis: analysis.pricingAnalysis as unknown as StoredMarketAnalysis['pricingAnalysis'],
      trendAnalysis: analysis.trendAnalysis as unknown as StoredMarketAnalysis['trendAnalysis'],
      brandingScore: analysis.brandingScore,
      targetAudienceMatch: analysis.targetAudienceMatch,
      recommendedPrice: analysis.recommendedPrice,
      marketPosition: analysis.marketPosition,
      opportunities: analysis.opportunities as unknown as StoredMarketAnalysis['opportunities'],
      threats: analysis.threats as unknown as string[],
      lastAnalyzedAt: analysis.lastAnalyzedAt,
    };
  }

  async storeAnalysis(analysis: StoredMarketAnalysis): Promise<void> {
    await this.prisma.courseMarketAnalysis.upsert({
      where: { courseId: analysis.courseId },
      create: {
        courseId: analysis.courseId,
        marketValue: analysis.marketValue,
        demandScore: analysis.demandScore,
        competitorAnalysis: analysis.competitorAnalysis as object,
        pricingAnalysis: analysis.pricingAnalysis as object,
        trendAnalysis: analysis.trendAnalysis as object,
        brandingScore: analysis.brandingScore,
        targetAudienceMatch: analysis.targetAudienceMatch,
        recommendedPrice: analysis.recommendedPrice,
        marketPosition: analysis.marketPosition,
        opportunities: analysis.opportunities as object,
        threats: analysis.threats as object,
        lastAnalyzedAt: analysis.lastAnalyzedAt,
      },
      update: {
        marketValue: analysis.marketValue,
        demandScore: analysis.demandScore,
        competitorAnalysis: analysis.competitorAnalysis as object,
        pricingAnalysis: analysis.pricingAnalysis as object,
        trendAnalysis: analysis.trendAnalysis as object,
        brandingScore: analysis.brandingScore,
        targetAudienceMatch: analysis.targetAudienceMatch,
        recommendedPrice: analysis.recommendedPrice,
        marketPosition: analysis.marketPosition,
        opportunities: analysis.opportunities as object,
        threats: analysis.threats as object,
        lastAnalyzedAt: analysis.lastAnalyzedAt,
      },
    });
  }

  async getCompetitors(courseId: string): Promise<CompetitorAnalysis[]> {
    const competitors = await this.prisma.courseCompetitor.findMany({
      where: { courseId },
    });

    return competitors.map((c: any) => ({
      name: c.competitorName,
      url: c.competitorUrl ?? undefined,
      price: c.price,
      rating: c.rating ?? undefined,
      enrollments: c.enrollments ?? undefined,
      strengths: c.strengths as string[],
      weaknesses: c.weaknesses as string[],
      features: c.features as string[],
    }));
  }

  async storeCompetitor(
    courseId: string,
    competitor: CompetitorAnalysis
  ): Promise<void> {
    await this.prisma.courseCompetitor.create({
      data: {
        courseId,
        competitorName: competitor.name,
        competitorUrl: competitor.url,
        price: competitor.price,
        rating: competitor.rating,
        enrollments: competitor.enrollments,
        features: competitor.features,
        strengths: competitor.strengths,
        weaknesses: competitor.weaknesses,
      },
    });
  }
}

// ============================================================================
// COLLABORATION DATABASE ADAPTER
// ============================================================================

export class PrismaCollaborationDatabaseAdapter implements CollaborationDatabaseAdapter {
  constructor(private prisma: PrismaLike) {}

  async createSession(session: CollaborationSession): Promise<void> {
    await this.prisma.collaborationSession.create({
      data: {
        sessionId: session.sessionId,
        contentId: session.sessionId, // Using sessionId as contentId
        contentType: 'COURSE', // Default content type
        participants: session.participants as object,
        activeParticipants: session.participants
          .filter((p) => !p.leaveTime)
          .map((p) => p.userId) as object,
        startedAt: session.startTime,
        endedAt: session.endTime,
        activities: session.activities as object,
        metrics: session.metrics as object,
        insights: session.insights as object,
        isActive: !session.endTime,
      },
    });
  }

  async updateSession(
    sessionId: string,
    session: Partial<CollaborationSession>
  ): Promise<void> {
    await this.prisma.collaborationSession.update({
      where: { sessionId },
      data: {
        ...(session.participants && { participants: session.participants as object }),
        ...(session.endTime && {
          endedAt: session.endTime,
          isActive: false,
        }),
        ...(session.activities && { activities: session.activities as object }),
        ...(session.metrics && { metrics: session.metrics as object }),
        ...(session.insights && { insights: session.insights as object }),
      },
    });
  }

  async getSession(sessionId: string): Promise<CollaborationSession | null> {
    const session = await this.prisma.collaborationSession.findUnique({
      where: { sessionId },
      include: {
        contributions: true,
        reactions: true,
      },
    });

    if (!session) return null;

    return {
      sessionId: session.sessionId,
      participants: session.participants as unknown as CollaborationSession['participants'],
      startTime: session.startedAt,
      endTime: session.endedAt ?? undefined,
      activities: (session.activities as unknown as CollaborationSession['activities']) ?? [],
      metrics: session.metrics as unknown as CollaborationSession['metrics'],
      insights: session.insights as unknown as CollaborationSession['insights'],
    };
  }

  async getUser(userId: string): Promise<{ id: string; name: string | null } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });
    return user;
  }

  async recordContribution(
    sessionId: string,
    userId: string,
    contribution: Omit<CollaborationContribution, 'timestamp' | 'reactions'>
  ): Promise<void> {
    await this.prisma.collaborationContribution.create({
      data: {
        sessionId,
        userId,
        contributionType: contribution.type,
        content: contribution.content as object,
        impact: contribution.impact,
      },
    });
  }

  async storeAnalytics(
    sessionId: string,
    analytics: CollaborationAnalytics
  ): Promise<void> {
    const session = await this.prisma.collaborationSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    if (!session) return;

    await this.prisma.collaborationAnalytics.upsert({
      where: { sessionId: session.id },
      create: {
        sessionId: session.id,
        sessionAnalytics: analytics.sessionAnalytics as object,
        participantAnalytics: analytics.participantAnalytics as object,
        contentAnalytics: analytics.contentAnalytics as object,
        networkAnalytics: analytics.networkAnalytics as object,
      },
      update: {
        sessionAnalytics: analytics.sessionAnalytics as object,
        participantAnalytics: analytics.participantAnalytics as object,
        contentAnalytics: analytics.contentAnalytics as object,
        networkAnalytics: analytics.networkAnalytics as object,
      },
    });
  }
}

// ============================================================================
// INNOVATION DATABASE ADAPTER
// ============================================================================

export class PrismaInnovationDatabaseAdapter implements InnovationDatabaseAdapter {
  constructor(private prisma: PrismaLike) {}

  async getUserLearningData(userId: string): Promise<InnovationLearningData> {
    const [enrollments, activities, achievements, profile] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { userId },
      }),
      this.prisma.sAMInteraction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
      }),
      this.prisma.sAMLearningProfile.findUnique({
        where: { userId },
      }),
    ]);

    const progress = enrollments.map((e: any) => ({
      courseId: e.courseId,
      progressPercentage: 0, // Would need to query progress separately
    }));

    const activityData = activities.map((a: any) => ({
      timestamp: a.createdAt,
      contentType: a.interactionType,
      metadata: a.context as Record<string, unknown>,
    }));

    const achievementData = achievements.map((a: any) => ({
      name: a.badge.name,
      achievedAt: a.earnedAt,
    }));

    // Use preferences JSON field for additional data
    const preferences = (profile?.preferences as Record<string, unknown>) ?? {};

    return {
      userId,
      progress,
      activities: activityData,
      achievements: achievementData,
      retentionRate: (preferences.retentionRate as number) ?? 0.7,
      recallAccuracy: (preferences.recallAccuracy as number) ?? 0.75,
      spacedRepPerformance: (preferences.spacedRepPerformance as number) ?? 0.8,
      avgFocusDuration: (preferences.avgFocusDuration as number) ?? 30,
      taskSwitchingRate: 0.2,
      completionRate: this.calculateCompletionRate(progress),
      problemSolvingAccuracy: (preferences.problemSolvingAccuracy as number) ?? 0.7,
      logicalProgressionScore: 0.75,
      abstractThinkingScore: 0.7,
      solutionDiversity: 0.6,
      novelApproachRate: 0.4,
      crossDomainScore: 0.5,
      avgResponseTime: (preferences.avgResponseTime as number) ?? 60,
      speedImprovementRate: 0.1,
      timedAccuracy: 0.8,
      preferredLearningStyle: profile?.learningStyle ?? undefined,
      peakPerformanceTime: (preferences.peakPerformanceTime as string) ?? undefined,
      strongestSubject: (preferences.strongestSubject as string) ?? undefined,
      learningVelocity: (preferences.learningVelocity as number) ?? undefined,
    };
  }

  private calculateCompletionRate(
    progress: Array<{ progressPercentage?: number }>
  ): number {
    if (progress.length === 0) return 0;
    const completed = progress.filter(
      (p) => (p.progressPercentage ?? 0) >= 100
    ).length;
    return completed / progress.length;
  }

  async storeCognitiveFitnessAssessment(assessment: CognitiveFitness): Promise<void> {
    await this.prisma.cognitiveFitnessAssessment.create({
      data: {
        userId: assessment.userId,
        overallScore: assessment.overallScore,
        dimensions: assessment.dimensions as object,
        exercises: assessment.exercises as object,
        progress: assessment.progress as object,
        recommendations: assessment.recommendations as object,
      },
    });
  }

  async getCognitiveFitnessAssessments(userId: string): Promise<CognitiveFitness[]> {
    const assessments = await this.prisma.cognitiveFitnessAssessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return assessments.map((a: any) => ({
      userId: a.userId,
      overallScore: a.overallScore,
      dimensions: a.dimensions as unknown as CognitiveFitness['dimensions'],
      exercises: a.exercises as unknown as CognitiveFitness['exercises'],
      progress: a.progress as unknown as CognitiveFitness['progress'],
      recommendations: a.recommendations as unknown as CognitiveFitness['recommendations'],
    }));
  }

  async getFitnessSessions(userId: string, since: Date): Promise<FitnessSession[]> {
    // Using SAMInteraction as proxy for fitness sessions
    const interactions = await this.prisma.sAMInteraction.findMany({
      where: {
        userId,
        createdAt: { gte: since },
        interactionType: 'LEARNING_ASSISTANCE',
      },
    });

    return interactions.map((i: any) => ({
      sessionId: i.id,
      userId: i.userId,
      exerciseId: (i.context as { exerciseId?: string })?.exerciseId ?? 'general',
      completedAt: i.createdAt,
      duration: i.duration ?? 0,
      performance: (i.context as { performance?: number })?.performance ?? 0.5,
    }));
  }

  async getFitnessMilestones(userId: string): Promise<FitnessMilestone[]> {
    const badges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    });

    return badges.map((b: any) => ({
      name: b.badge.name,
      achievedAt: b.earnedAt,
      dimensionImproved: b.badge.category ?? 'general',
      improvementAmount: b.badge.points ?? 0,
    }));
  }

  async countFitnessSessions(userId: string): Promise<number> {
    return this.prisma.sAMInteraction.count({
      where: {
        userId,
        interactionType: 'LEARNING_ASSISTANCE',
      },
    });
  }

  async storeLearningDNA(dna: LearningDNA): Promise<void> {
    // LearningDNA doesn't have unique constraint on userId, so we use create
    // and let the caller handle duplicates
    await this.prisma.learningDNA.create({
      data: {
        userId: dna.userId,
        dnaSequence: dna.dnaSequence as object,
        traits: dna.traits as object,
        heritage: dna.heritage as object,
        mutations: dna.mutations as object,
        phenotype: dna.phenotype as object,
      },
    });
  }

  async getLearningDNA(userId: string): Promise<LearningDNA | null> {
    // Use findFirst since there's no unique constraint on userId
    const dna = await this.prisma.learningDNA.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!dna) return null;

    return {
      userId: dna.userId,
      dnaSequence: dna.dnaSequence as unknown as LearningDNA['dnaSequence'],
      traits: dna.traits as unknown as LearningDNA['traits'],
      heritage: dna.heritage as unknown as LearningDNA['heritage'],
      mutations: dna.mutations as unknown as LearningDNA['mutations'],
      phenotype: dna.phenotype as unknown as LearningDNA['phenotype'],
    };
  }

  async createStudyBuddy(buddy: StudyBuddy): Promise<void> {
    await this.prisma.studyBuddy.create({
      data: {
        buddyId: buddy.buddyId,
        userId: buddy.relationship.userId,
        name: buddy.name,
        personality: buddy.personality as object,
        avatar: buddy.avatar as object,
        relationship: buddy.relationship as object,
        capabilities: buddy.capabilities as object,
        effectiveness: buddy.effectiveness as object,
      },
    });
  }

  async getStudyBuddy(buddyId: string): Promise<StudyBuddy | null> {
    const buddy = await this.prisma.studyBuddy.findUnique({
      where: { buddyId },
      include: {
        interactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!buddy) return null;

    return {
      buddyId: buddy.buddyId,
      name: buddy.name,
      personality: buddy.personality as unknown as StudyBuddy['personality'],
      avatar: buddy.avatar as unknown as StudyBuddy['avatar'],
      relationship: buddy.relationship as unknown as StudyBuddy['relationship'],
      capabilities: buddy.capabilities as unknown as StudyBuddy['capabilities'],
      interactions: buddy.interactions.map((i: any) => ({
        interactionId: i.id,
        type: i.interactionType as BuddyInteraction['type'],
        content: i.content as Record<string, unknown>,
        userResponse: i.userResponse ?? '',
        effectiveness: i.effectiveness,
        timestamp: i.createdAt,
      })),
      effectiveness: buddy.effectiveness as unknown as StudyBuddy['effectiveness'],
    };
  }

  async updateStudyBuddy(
    buddyId: string,
    data: Partial<StudyBuddy>
  ): Promise<void> {
    await this.prisma.studyBuddy.update({
      where: { buddyId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.personality && { personality: data.personality as object }),
        ...(data.avatar && { avatar: data.avatar as object }),
        ...(data.relationship && { relationship: data.relationship as object }),
        ...(data.capabilities && { capabilities: data.capabilities as object }),
        ...(data.effectiveness && { effectiveness: data.effectiveness as object }),
      },
    });
  }

  async storeBuddyInteraction(
    buddyId: string,
    userId: string,
    interaction: BuddyInteraction
  ): Promise<void> {
    await this.prisma.buddyInteraction.create({
      data: {
        buddyId,
        userId,
        interactionType: interaction.type,
        content: interaction.content as object,
        userResponse: interaction.userResponse,
        effectiveness: interaction.effectiveness,
      },
    });
  }

  async storeQuantumPath(path: QuantumPath, learningGoal: string): Promise<void> {
    // Store in SAMInteraction as there's no dedicated QuantumPath table
    await this.prisma.sAMInteraction.create({
      data: {
        userId: path.userId,
        interactionType: 'LEARNING_ASSISTANCE',
        context: {
          type: 'QUANTUM_PATH',
          pathId: path.pathId,
          learningGoal,
          superposition: this.serializeSuperposition(path.superposition),
          entanglements: this.serializeEntanglements(path.entanglements),
          probability: this.serializeProbability(path.probability),
        },
        success: true,
      },
    });
  }

  private serializeSuperposition(
    superposition: QuantumPath['superposition']
  ): object {
    return {
      possibleStates: superposition.possibleStates,
      currentProbabilities: Object.fromEntries(
        superposition.currentProbabilities
      ),
      coherenceLevel: superposition.coherenceLevel,
      decoherenceFactors: superposition.decoherenceFactors,
    };
  }

  private serializeProbability(
    probability: QuantumPath['probability']
  ): object {
    return {
      successProbability: probability.successProbability,
      completionTimeDistribution: {
        ...probability.completionTimeDistribution,
        quantiles: Object.fromEntries(
          probability.completionTimeDistribution.quantiles
        ),
      },
      outcomeDistribution: {
        ...probability.outcomeDistribution,
        outcomes: Object.fromEntries(probability.outcomeDistribution.outcomes),
      },
      uncertaintyPrinciple: probability.uncertaintyPrinciple,
    };
  }

  private serializeEntanglements(
    entanglements: QuantumPath['entanglements']
  ): object[] {
    return entanglements.map((e) => ({
      entanglementId: e.entanglementId,
      entangledPaths: e.entangledPaths,
      correlationStrength: e.correlationStrength,
      type: e.type,
      effects: e.effects,
    }));
  }

  async getQuantumPath(pathId: string): Promise<QuantumPath | null> {
    const interactions = await this.prisma.sAMInteraction.findMany({
      where: {
        context: {
          path: ['type'],
          equals: 'QUANTUM_PATH',
        },
      },
      take: 100,
    });

    const interaction = interactions.find((i: any) => {
      const ctx = i.context as { pathId?: string };
      return ctx.pathId === pathId;
    });

    if (!interaction) return null;

    type SerializedQuantumContext = {
      pathId: string;
      superposition: {
        possibleStates: QuantumPath['superposition']['possibleStates'];
        currentProbabilities: Record<string, number>;
        coherenceLevel: number;
        decoherenceFactors: string[];
      };
      entanglements: QuantumPath['entanglements'];
      probability: {
        successProbability: number;
        completionTimeDistribution: {
          mean: number;
          standardDeviation: number;
          minimum: number;
          maximum: number;
          quantiles: Record<number, number>;
        };
        outcomeDistribution: {
          outcomes: Record<string, number>;
          expectedValue: number;
          variance: number;
          bestCase: QuantumPath['probability']['outcomeDistribution']['bestCase'];
          worstCase: QuantumPath['probability']['outcomeDistribution']['worstCase'];
        };
        uncertaintyPrinciple: QuantumPath['probability']['uncertaintyPrinciple'];
      };
    };
    const context = interaction.context as unknown as SerializedQuantumContext;

    return {
      pathId: context.pathId,
      userId: interaction.userId,
      superposition: {
        possibleStates: context.superposition.possibleStates,
        currentProbabilities: new Map(
          Object.entries(context.superposition.currentProbabilities)
        ),
        coherenceLevel: context.superposition.coherenceLevel,
        decoherenceFactors: context.superposition.decoherenceFactors,
      },
      entanglements: context.entanglements,
      observations: [],
      collapse: null,
      probability: {
        successProbability: context.probability.successProbability,
        completionTimeDistribution: {
          ...context.probability.completionTimeDistribution,
          quantiles: new Map(
            Object.entries(context.probability.completionTimeDistribution.quantiles).map(
              ([k, v]) => [Number(k), v]
            )
          ),
        },
        outcomeDistribution: {
          ...context.probability.outcomeDistribution,
          outcomes: new Map(
            Object.entries(context.probability.outcomeDistribution.outcomes)
          ),
        },
        uncertaintyPrinciple: context.probability.uncertaintyPrinciple,
      },
    };
  }

  async updateQuantumPath(
    pathId: string,
    data: Partial<QuantumPath>
  ): Promise<void> {
    // Find and update the interaction containing the quantum path
    const interactions = await this.prisma.sAMInteraction.findMany({
      where: {
        context: {
          path: ['type'],
          equals: 'QUANTUM_PATH',
        },
      },
      take: 100,
    });

    const interaction = interactions.find((i: any) => {
      const ctx = i.context as { pathId?: string };
      return ctx.pathId === pathId;
    });

    if (!interaction) return;

    const existingContext = interaction.context as Record<string, unknown>;
    const updatedContext = {
      ...existingContext,
      ...(data.superposition && {
        superposition: this.serializeSuperposition(data.superposition),
      }),
      ...(data.entanglements && {
        entanglements: this.serializeEntanglements(data.entanglements),
      }),
      ...(data.probability && {
        probability: this.serializeProbability(data.probability),
      }),
      ...(data.collapse && { collapse: data.collapse as object }),
    };

    await this.prisma.sAMInteraction.update({
      where: { id: interaction.id },
      data: {
        context: updatedContext as object,
      },
    });
  }

  async storeQuantumObservation(
    pathId: string,
    observation: PathObservation
  ): Promise<void> {
    await this.prisma.sAMInteraction.create({
      data: {
        userId: observation.observer,
        interactionType: 'LEARNING_ASSISTANCE',
        context: {
          type: 'QUANTUM_OBSERVATION',
          pathId,
          observation: {
            observationId: observation.observationId,
            observationType: observation.observationType,
            impact: {
              collapsedStates: observation.impact.collapsedStates,
              probabilityShifts: Object.fromEntries(
                observation.impact.probabilityShifts
              ),
              newEntanglements: observation.impact.newEntanglements,
              decoherence: observation.impact.decoherence,
            },
          },
        },
        success: true,
      },
    });
  }

  async getQuantumObservations(pathId: string): Promise<PathObservation[]> {
    const interactions = await this.prisma.sAMInteraction.findMany({
      where: {
        context: {
          path: ['type'],
          equals: 'QUANTUM_OBSERVATION',
        },
      },
      take: 100,
    });

    return interactions
      .filter((i: any) => {
        const ctx = i.context as { pathId?: string };
        return ctx.pathId === pathId;
      })
      .map((i: any) => {
        const ctx = i.context as {
          observation: {
            observationId: string;
            observationType: PathObservation['observationType'];
            impact: {
              collapsedStates: string[];
              probabilityShifts: Record<string, number>;
              newEntanglements: string[];
              decoherence: number;
            };
          };
        };
        return {
          observationId: ctx.observation.observationId,
          observer: i.userId,
          observationType: ctx.observation.observationType,
          timestamp: i.createdAt,
          impact: {
            collapsedStates: ctx.observation.impact.collapsedStates,
            probabilityShifts: new Map(
              Object.entries(ctx.observation.impact.probabilityShifts)
            ),
            newEntanglements: ctx.observation.impact.newEntanglements,
            decoherence: ctx.observation.impact.decoherence,
          },
        };
      });
  }

  async findLearningPeers(
    userId: string
  ): Promise<{ pathId: string; userId: string }[]> {
    // Find users with similar learning patterns
    const userProfile = await this.prisma.sAMLearningProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) return [];

    const similarProfiles = await this.prisma.sAMLearningProfile.findMany({
      where: {
        userId: { not: userId },
        learningStyle: userProfile.learningStyle,
      },
      take: 10,
    });

    return similarProfiles.map((p: any) => ({
      pathId: `path-${p.userId}`,
      userId: p.userId,
    }));
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createTrendsAdapter(prisma: PrismaLike): TrendsDatabaseAdapter {
  return new PrismaTrendsDatabaseAdapter(prisma);
}

export function createCourseGuideAdapter(
  prisma: PrismaLike
): CourseGuideDatabaseAdapter {
  return new PrismaCourseGuideDatabaseAdapter(prisma);
}

export function createMarketAdapter(prisma: PrismaLike): MarketDatabaseAdapter {
  return new PrismaMarketDatabaseAdapter(prisma);
}

export function createCollaborationAdapter(
  prisma: PrismaLike
): CollaborationDatabaseAdapter {
  return new PrismaCollaborationDatabaseAdapter(prisma);
}

export function createInnovationAdapter(
  prisma: PrismaLike
): InnovationDatabaseAdapter {
  return new PrismaInnovationDatabaseAdapter(prisma);
}
