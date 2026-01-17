/**
 * @sam-ai/agentic - CrossSessionContext
 * Maintain context across user sessions for continuity
 */
import type { SessionContext, SessionContextStore, ContextState, ContextHistoryEntry, ContextAction, UserPreferences, LearningInsights, EmotionalState, LearningStyle, ContentType, MemoryLogger } from './types';
export interface CrossSessionContextConfig {
    contextStore?: SessionContextStore;
    logger?: MemoryLogger;
    maxHistoryEntries?: number;
    defaultSessionLength?: number;
    insightUpdateInterval?: number;
}
export declare class InMemoryContextStore implements SessionContextStore {
    private contexts;
    private getKey;
    get(userId: string, courseId?: string): Promise<SessionContext | null>;
    create(context: Omit<SessionContext, 'id' | 'createdAt' | 'updatedAt'>): Promise<SessionContext>;
    update(id: string, updates: Partial<SessionContext>): Promise<SessionContext>;
    delete(id: string): Promise<boolean>;
    addHistoryEntry(id: string, entry: Omit<ContextHistoryEntry, 'timestamp'>): Promise<void>;
    getRecentHistory(id: string, limit: number): Promise<ContextHistoryEntry[]>;
    clear(): void;
}
export declare class CrossSessionContext {
    private readonly store;
    private readonly logger;
    private readonly maxHistoryEntries;
    private readonly defaultSessionLength;
    constructor(config?: CrossSessionContextConfig);
    /**
     * Get or create context for a user
     */
    getOrCreateContext(userId: string, courseId?: string): Promise<SessionContext>;
    /**
     * Start a new session
     */
    startSession(userId: string, courseId?: string, sessionId?: string): Promise<SessionContext>;
    /**
     * End current session
     */
    endSession(userId: string, courseId?: string, options?: {
        sessionId?: string;
        duration?: number;
    }): Promise<SessionContext>;
    /**
     * Update current topic
     */
    setCurrentTopic(userId: string, topic: string, courseId?: string): Promise<SessionContext>;
    /**
     * Set current learning goal
     */
    setCurrentGoal(userId: string, goal: string, courseId?: string): Promise<SessionContext>;
    /**
     * Mark goal as completed
     */
    completeGoal(userId: string, courseId?: string): Promise<SessionContext>;
    /**
     * Record learned concept
     */
    recordConceptLearned(userId: string, concept: string, courseId?: string): Promise<SessionContext>;
    /**
     * Record question asked
     */
    recordQuestion(userId: string, question: string, courseId?: string): Promise<SessionContext>;
    /**
     * Record artifact creation
     */
    recordArtifact(userId: string, artifactId: string, artifactType: string, courseId?: string): Promise<SessionContext>;
    /**
     * Update emotional state
     */
    updateEmotionalState(userId: string, state: EmotionalState, courseId?: string): Promise<SessionContext>;
    /**
     * Update focus level (0-100)
     */
    updateFocusLevel(userId: string, level: number, courseId?: string): Promise<SessionContext>;
    /**
     * Update user preferences
     */
    updatePreferences(userId: string, preferences: Partial<UserPreferences>, courseId?: string): Promise<SessionContext>;
    /**
     * Set learning style
     */
    setLearningStyle(userId: string, style: LearningStyle, courseId?: string): Promise<SessionContext>;
    /**
     * Set preferred content types
     */
    setPreferredContentTypes(userId: string, types: ContentType[], courseId?: string): Promise<SessionContext>;
    /**
     * Update learning insights
     */
    updateInsights(userId: string, insights: Partial<LearningInsights>, courseId?: string): Promise<SessionContext>;
    /**
     * Add strength
     */
    addStrength(userId: string, strength: string, courseId?: string): Promise<SessionContext>;
    /**
     * Add weakness
     */
    addWeakness(userId: string, weakness: string, courseId?: string): Promise<SessionContext>;
    /**
     * Record struggling concept
     */
    recordStruggle(userId: string, concept: string, courseId?: string): Promise<SessionContext>;
    /**
     * Update engagement score
     */
    updateEngagementScore(userId: string, score: number, courseId?: string): Promise<SessionContext>;
    /**
     * Get recent history entries
     */
    getRecentHistory(userId: string, limit?: number, courseId?: string): Promise<ContextHistoryEntry[]>;
    /**
     * Get history by action type
     */
    getHistoryByAction(userId: string, action: ContextAction, limit?: number, courseId?: string): Promise<ContextHistoryEntry[]>;
    /**
     * Get session summary
     */
    getSessionSummary(userId: string, courseId?: string): Promise<SessionSummary>;
    /**
     * Get context for AI prompting
     */
    getContextForPrompt(userId: string, courseId?: string): Promise<ContextForPrompt>;
    private addToRecentList;
    private addHistoryEntry;
    /**
     * Delete context for a user
     */
    deleteContext(userId: string, courseId?: string): Promise<boolean>;
    /**
     * Get max history entries configuration
     */
    getMaxHistoryEntries(): number;
    /**
     * Get default session length configuration
     */
    getDefaultSessionLength(): number;
}
export interface SessionSummary {
    userId: string;
    courseId?: string;
    exists: boolean;
    totalSessions: number;
    totalLearningTime: number;
    averageSessionDuration: number;
    lastActiveAt: Date | null;
    currentState: ContextState | null;
    masteredConceptCount: number;
    strugglingConceptCount: number;
    engagementScore: number;
}
export interface ContextForPrompt {
    hasContext: boolean;
    learningStyle: LearningStyle;
    preferredPace: 'slow' | 'moderate' | 'fast';
    currentTopic: string | null;
    currentGoal: string | null;
    recentConcepts: string[];
    pendingQuestions: string[];
    strengths: string[];
    weaknesses: string[];
    emotionalState: EmotionalState | null;
    focusLevel: number | null;
    sessionCount: number;
}
export declare function createCrossSessionContext(config?: CrossSessionContextConfig): CrossSessionContext;
//# sourceMappingURL=cross-session-context.d.ts.map