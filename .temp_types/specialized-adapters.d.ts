/**
 * Specialized Database Adapters for SAM Engines
 *
 * These adapters map the specialized database interfaces from @sam-ai/educational
 * to the Taxomind Prisma schema. Each engine has its own adapter interface.
 */
import type { TrendsDatabaseAdapter, CourseGuideDatabaseAdapter, CourseGuideInput, SimilarCourse, MarketDatabaseAdapter, MarketCourseData, StoredMarketAnalysis, CompetitorAnalysis, CollaborationDatabaseAdapter, CollaborationSession, CollaborationAnalytics, CollaborationContribution, InnovationDatabaseAdapter, CognitiveFitness, FitnessSession, FitnessMilestone, LearningDNA, StudyBuddy, BuddyInteraction, QuantumPath, PathObservation, InnovationLearningData } from '@sam-ai/educational';
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
export declare class PrismaTrendsDatabaseAdapter implements TrendsDatabaseAdapter {
    private prisma;
    constructor(prisma: PrismaLike);
    createInteraction(data: {
        userId: string;
        interactionType: string;
        context?: Record<string, unknown>;
    }): Promise<void>;
}
export declare class PrismaCourseGuideDatabaseAdapter implements CourseGuideDatabaseAdapter {
    private prisma;
    constructor(prisma: PrismaLike);
    getCourse(courseId: string): Promise<CourseGuideInput | null>;
    getRecentInteractionCount(courseId: string, days: number): Promise<number>;
    findCompetitors(courseId: string): Promise<SimilarCourse[]>;
}
export declare class PrismaMarketDatabaseAdapter implements MarketDatabaseAdapter {
    private prisma;
    constructor(prisma: PrismaLike);
    getCourse(courseId: string): Promise<MarketCourseData | null>;
    getStoredAnalysis(courseId: string): Promise<StoredMarketAnalysis | null>;
    storeAnalysis(analysis: StoredMarketAnalysis): Promise<void>;
    getCompetitors(courseId: string): Promise<CompetitorAnalysis[]>;
    storeCompetitor(courseId: string, competitor: CompetitorAnalysis): Promise<void>;
}
export declare class PrismaCollaborationDatabaseAdapter implements CollaborationDatabaseAdapter {
    private prisma;
    constructor(prisma: PrismaLike);
    createSession(session: CollaborationSession): Promise<void>;
    updateSession(sessionId: string, session: Partial<CollaborationSession>): Promise<void>;
    getSession(sessionId: string): Promise<CollaborationSession | null>;
    getUser(userId: string): Promise<{
        id: string;
        name: string | null;
    } | null>;
    recordContribution(sessionId: string, userId: string, contribution: Omit<CollaborationContribution, 'timestamp' | 'reactions'>): Promise<void>;
    storeAnalytics(sessionId: string, analytics: CollaborationAnalytics): Promise<void>;
}
export declare class PrismaInnovationDatabaseAdapter implements InnovationDatabaseAdapter {
    private prisma;
    constructor(prisma: PrismaLike);
    getUserLearningData(userId: string): Promise<InnovationLearningData>;
    private calculateCompletionRate;
    storeCognitiveFitnessAssessment(assessment: CognitiveFitness): Promise<void>;
    getCognitiveFitnessAssessments(userId: string): Promise<CognitiveFitness[]>;
    getFitnessSessions(userId: string, since: Date): Promise<FitnessSession[]>;
    getFitnessMilestones(userId: string): Promise<FitnessMilestone[]>;
    countFitnessSessions(userId: string): Promise<number>;
    storeLearningDNA(dna: LearningDNA): Promise<void>;
    getLearningDNA(userId: string): Promise<LearningDNA | null>;
    createStudyBuddy(buddy: StudyBuddy): Promise<void>;
    getStudyBuddy(buddyId: string): Promise<StudyBuddy | null>;
    updateStudyBuddy(buddyId: string, data: Partial<StudyBuddy>): Promise<void>;
    storeBuddyInteraction(buddyId: string, userId: string, interaction: BuddyInteraction): Promise<void>;
    storeQuantumPath(path: QuantumPath, learningGoal: string): Promise<void>;
    private serializeSuperposition;
    private serializeProbability;
    private serializeEntanglements;
    getQuantumPath(pathId: string): Promise<QuantumPath | null>;
    updateQuantumPath(pathId: string, data: Partial<QuantumPath>): Promise<void>;
    storeQuantumObservation(pathId: string, observation: PathObservation): Promise<void>;
    getQuantumObservations(pathId: string): Promise<PathObservation[]>;
    findLearningPeers(userId: string): Promise<{
        pathId: string;
        userId: string;
    }[]>;
}
export declare function createTrendsAdapter(prisma: PrismaLike): TrendsDatabaseAdapter;
export declare function createCourseGuideAdapter(prisma: PrismaLike): CourseGuideDatabaseAdapter;
export declare function createMarketAdapter(prisma: PrismaLike): MarketDatabaseAdapter;
export declare function createCollaborationAdapter(prisma: PrismaLike): CollaborationDatabaseAdapter;
export declare function createInnovationAdapter(prisma: PrismaLike): InnovationDatabaseAdapter;
export {};
