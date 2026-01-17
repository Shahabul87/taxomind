/**
 * @sam-ai/agentic - CrossSessionContext
 * Maintain context across user sessions for continuity
 */
import { v4 as uuidv4 } from 'uuid';
// ============================================================================
// DEFAULT VALUES
// ============================================================================
const DEFAULT_PREFERENCES = {
    learningStyle: 'mixed',
    preferredPace: 'moderate',
    preferredContentTypes: ['text', 'interactive', 'quiz'],
    preferredSessionLength: 30,
    notificationPreferences: {
        enabled: true,
        channels: ['in_app'],
        frequency: 'daily',
    },
    accessibilitySettings: {
        fontSize: 'medium',
        highContrast: false,
        reduceMotion: false,
        screenReaderOptimized: false,
        captionsEnabled: false,
    },
};
const DEFAULT_INSIGHTS = {
    strengths: [],
    weaknesses: [],
    recommendedTopics: [],
    masteredConcepts: [],
    strugglingConcepts: [],
    averageSessionDuration: 0,
    totalLearningTime: 0,
    completionRate: 0,
    engagementScore: 0,
};
const DEFAULT_STATE = {
    recentConcepts: [],
    pendingQuestions: [],
    activeArtifacts: [],
    sessionCount: 0,
};
// ============================================================================
// IN-MEMORY CONTEXT STORE
// ============================================================================
export class InMemoryContextStore {
    contexts = new Map();
    getKey(userId, courseId) {
        return courseId ? `${userId}:${courseId}` : userId;
    }
    async get(userId, courseId) {
        const key = this.getKey(userId, courseId);
        return this.contexts.get(key) ?? null;
    }
    async create(context) {
        const now = new Date();
        const newContext = {
            ...context,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
        };
        const key = this.getKey(context.userId, context.courseId);
        this.contexts.set(key, newContext);
        return newContext;
    }
    async update(id, updates) {
        for (const [key, context] of this.contexts) {
            if (context.id === id) {
                const updated = {
                    ...context,
                    ...updates,
                    id: context.id,
                    createdAt: context.createdAt,
                    updatedAt: new Date(),
                };
                this.contexts.set(key, updated);
                return updated;
            }
        }
        throw new Error(`Context not found: ${id}`);
    }
    async delete(id) {
        for (const [key, context] of this.contexts) {
            if (context.id === id) {
                return this.contexts.delete(key);
            }
        }
        return false;
    }
    async addHistoryEntry(id, entry) {
        for (const [key, context] of this.contexts) {
            if (context.id === id) {
                const newEntry = {
                    ...entry,
                    timestamp: new Date(),
                };
                context.history.push(newEntry);
                context.updatedAt = new Date();
                this.contexts.set(key, context);
                return;
            }
        }
        throw new Error(`Context not found: ${id}`);
    }
    async getRecentHistory(id, limit) {
        for (const context of this.contexts.values()) {
            if (context.id === id) {
                return context.history.slice(-limit).reverse();
            }
        }
        return [];
    }
    // Utility for testing
    clear() {
        this.contexts.clear();
    }
}
// ============================================================================
// CROSS SESSION CONTEXT MANAGER
// ============================================================================
export class CrossSessionContext {
    store;
    logger;
    maxHistoryEntries;
    defaultSessionLength;
    constructor(config = {}) {
        this.store = config.contextStore ?? new InMemoryContextStore();
        this.logger = config.logger ?? console;
        this.maxHistoryEntries = config.maxHistoryEntries ?? 1000;
        this.defaultSessionLength = config.defaultSessionLength ?? 30;
    }
    // ============================================================================
    // SESSION MANAGEMENT
    // ============================================================================
    /**
     * Get or create context for a user
     */
    async getOrCreateContext(userId, courseId) {
        let context = await this.store.get(userId, courseId);
        if (!context) {
            this.logger.debug('Creating new session context', { userId, courseId });
            context = await this.store.create({
                userId,
                courseId,
                lastActiveAt: new Date(),
                currentState: {
                    ...DEFAULT_STATE,
                    recentConcepts: [],
                    pendingQuestions: [],
                    activeArtifacts: [],
                },
                history: [],
                preferences: { ...DEFAULT_PREFERENCES },
                insights: {
                    ...DEFAULT_INSIGHTS,
                    strengths: [],
                    weaknesses: [],
                    recommendedTopics: [],
                    masteredConcepts: [],
                    strugglingConcepts: [],
                },
            });
        }
        return context;
    }
    /**
     * Start a new session
     */
    async startSession(userId, courseId, sessionId) {
        const context = await this.getOrCreateContext(userId, courseId);
        // Update state
        const updatedState = {
            ...context.currentState,
            sessionCount: context.currentState.sessionCount + 1,
        };
        // Add history entry
        await this.addHistoryEntry(context.id, {
            action: 'session_start',
            data: { sessionId },
            sessionId,
        });
        const updated = await this.store.update(context.id, {
            currentState: updatedState,
            lastActiveAt: new Date(),
        });
        this.logger.info('Session started', {
            userId,
            courseId,
            sessionCount: updatedState.sessionCount,
        });
        return updated;
    }
    /**
     * End current session
     */
    async endSession(userId, courseId, options) {
        const context = await this.getOrCreateContext(userId, courseId);
        // Update insights with session duration
        if (options?.duration) {
            const insights = { ...context.insights };
            const totalSessions = context.currentState.sessionCount;
            insights.totalLearningTime += options.duration;
            insights.averageSessionDuration =
                (insights.averageSessionDuration * (totalSessions - 1) + options.duration) /
                    totalSessions;
            await this.store.update(context.id, { insights });
        }
        await this.addHistoryEntry(context.id, {
            action: 'session_end',
            data: { duration: options?.duration },
            sessionId: options?.sessionId,
        });
        const updated = await this.store.update(context.id, {
            lastActiveAt: new Date(),
        });
        this.logger.info('Session ended', {
            userId,
            courseId,
            duration: options?.duration,
        });
        return updated;
    }
    // ============================================================================
    // CONTEXT STATE MANAGEMENT
    // ============================================================================
    /**
     * Update current topic
     */
    async setCurrentTopic(userId, topic, courseId) {
        const context = await this.getOrCreateContext(userId, courseId);
        const updatedState = {
            ...context.currentState,
            currentTopic: topic,
            recentConcepts: this.addToRecentList(context.currentState.recentConcepts, topic, 10),
        };
        await this.addHistoryEntry(context.id, {
            action: 'topic_change',
            data: { previousTopic: context.currentState.currentTopic, newTopic: topic },
        });
        return this.store.update(context.id, {
            currentState: updatedState,
            lastActiveAt: new Date(),
        });
    }
    /**
     * Set current learning goal
     */
    async setCurrentGoal(userId, goal, courseId) {
        const context = await this.getOrCreateContext(userId, courseId);
        const updatedState = {
            ...context.currentState,
            currentGoal: goal,
        };
        await this.addHistoryEntry(context.id, {
            action: 'goal_set',
            data: { goal },
        });
        return this.store.update(context.id, {
            currentState: updatedState,
            lastActiveAt: new Date(),
        });
    }
    /**
     * Mark goal as completed
     */
    async completeGoal(userId, courseId) {
        const context = await this.getOrCreateContext(userId, courseId);
        if (!context.currentState.currentGoal) {
            return context;
        }
        await this.addHistoryEntry(context.id, {
            action: 'goal_completed',
            data: { goal: context.currentState.currentGoal },
        });
        const updatedState = {
            ...context.currentState,
            currentGoal: undefined,
        };
        return this.store.update(context.id, {
            currentState: updatedState,
            lastActiveAt: new Date(),
        });
    }
    /**
     * Record learned concept
     */
    async recordConceptLearned(userId, concept, courseId) {
        const context = await this.getOrCreateContext(userId, courseId);
        const insights = { ...context.insights };
        if (!insights.masteredConcepts.includes(concept)) {
            insights.masteredConcepts.push(concept);
        }
        // Remove from struggling if present
        insights.strugglingConcepts = insights.strugglingConcepts.filter((c) => c !== concept);
        const updatedState = {
            ...context.currentState,
            recentConcepts: this.addToRecentList(context.currentState.recentConcepts, concept, 10),
        };
        await this.addHistoryEntry(context.id, {
            action: 'concept_learned',
            data: { concept },
        });
        return this.store.update(context.id, {
            currentState: updatedState,
            insights,
            lastActiveAt: new Date(),
        });
    }
    /**
     * Record question asked
     */
    async recordQuestion(userId, question, courseId) {
        const context = await this.getOrCreateContext(userId, courseId);
        const updatedState = {
            ...context.currentState,
            pendingQuestions: this.addToRecentList(context.currentState.pendingQuestions, question, 5),
        };
        await this.addHistoryEntry(context.id, {
            action: 'question_asked',
            data: { question },
        });
        return this.store.update(context.id, {
            currentState: updatedState,
            lastActiveAt: new Date(),
        });
    }
    /**
     * Record artifact creation
     */
    async recordArtifact(userId, artifactId, artifactType, courseId) {
        const context = await this.getOrCreateContext(userId, courseId);
        const updatedState = {
            ...context.currentState,
            activeArtifacts: this.addToRecentList(context.currentState.activeArtifacts, artifactId, 10),
        };
        await this.addHistoryEntry(context.id, {
            action: 'artifact_created',
            data: { artifactId, artifactType },
        });
        return this.store.update(context.id, {
            currentState: updatedState,
            lastActiveAt: new Date(),
        });
    }
    /**
     * Update emotional state
     */
    async updateEmotionalState(userId, state, courseId) {
        const context = await this.getOrCreateContext(userId, courseId);
        const updatedState = {
            ...context.currentState,
            emotionalState: state,
        };
        return this.store.update(context.id, {
            currentState: updatedState,
            lastActiveAt: new Date(),
        });
    }
    /**
     * Update focus level (0-100)
     */
    async updateFocusLevel(userId, level, courseId) {
        const context = await this.getOrCreateContext(userId, courseId);
        const updatedState = {
            ...context.currentState,
            focusLevel: Math.max(0, Math.min(100, level)),
        };
        return this.store.update(context.id, {
            currentState: updatedState,
            lastActiveAt: new Date(),
        });
    }
    // ============================================================================
    // PREFERENCES MANAGEMENT
    // ============================================================================
    /**
     * Update user preferences
     */
    async updatePreferences(userId, preferences, courseId) {
        const context = await this.getOrCreateContext(userId, courseId);
        const updatedPreferences = {
            ...context.preferences,
            ...preferences,
            notificationPreferences: {
                ...context.preferences.notificationPreferences,
                ...preferences.notificationPreferences,
            },
            accessibilitySettings: {
                ...context.preferences.accessibilitySettings,
                ...preferences.accessibilitySettings,
            },
        };
        await this.addHistoryEntry(context.id, {
            action: 'preference_updated',
            data: { changes: preferences },
        });
        return this.store.update(context.id, {
            preferences: updatedPreferences,
            lastActiveAt: new Date(),
        });
    }
    /**
     * Set learning style
     */
    async setLearningStyle(userId, style, courseId) {
        return this.updatePreferences(userId, { learningStyle: style }, courseId);
    }
    /**
     * Set preferred content types
     */
    async setPreferredContentTypes(userId, types, courseId) {
        return this.updatePreferences(userId, { preferredContentTypes: types }, courseId);
    }
    // ============================================================================
    // INSIGHTS MANAGEMENT
    // ============================================================================
    /**
     * Update learning insights
     */
    async updateInsights(userId, insights, courseId) {
        const context = await this.getOrCreateContext(userId, courseId);
        const updatedInsights = {
            ...context.insights,
            ...insights,
        };
        await this.addHistoryEntry(context.id, {
            action: 'insight_generated',
            data: { insights },
        });
        return this.store.update(context.id, {
            insights: updatedInsights,
            lastActiveAt: new Date(),
        });
    }
    /**
     * Add strength
     */
    async addStrength(userId, strength, courseId) {
        const context = await this.getOrCreateContext(userId, courseId);
        const strengths = [...new Set([...context.insights.strengths, strength])];
        return this.updateInsights(userId, { strengths }, courseId);
    }
    /**
     * Add weakness
     */
    async addWeakness(userId, weakness, courseId) {
        const context = await this.getOrCreateContext(userId, courseId);
        const weaknesses = [...new Set([...context.insights.weaknesses, weakness])];
        return this.updateInsights(userId, { weaknesses }, courseId);
    }
    /**
     * Record struggling concept
     */
    async recordStruggle(userId, concept, courseId) {
        const context = await this.getOrCreateContext(userId, courseId);
        const strugglingConcepts = [...new Set([...context.insights.strugglingConcepts, concept])];
        return this.updateInsights(userId, { strugglingConcepts }, courseId);
    }
    /**
     * Update engagement score
     */
    async updateEngagementScore(userId, score, courseId) {
        return this.updateInsights(userId, { engagementScore: Math.max(0, Math.min(100, score)) }, courseId);
    }
    // ============================================================================
    // HISTORY & ANALYTICS
    // ============================================================================
    /**
     * Get recent history entries
     */
    async getRecentHistory(userId, limit = 20, courseId) {
        const context = await this.store.get(userId, courseId);
        if (!context)
            return [];
        return this.store.getRecentHistory(context.id, limit);
    }
    /**
     * Get history by action type
     */
    async getHistoryByAction(userId, action, limit = 20, courseId) {
        const context = await this.store.get(userId, courseId);
        if (!context)
            return [];
        return context.history
            .filter((entry) => entry.action === action)
            .slice(-limit)
            .reverse();
    }
    /**
     * Get session summary
     */
    async getSessionSummary(userId, courseId) {
        const context = await this.store.get(userId, courseId);
        if (!context) {
            return {
                userId,
                courseId,
                exists: false,
                totalSessions: 0,
                totalLearningTime: 0,
                averageSessionDuration: 0,
                lastActiveAt: null,
                currentState: null,
                masteredConceptCount: 0,
                strugglingConceptCount: 0,
                engagementScore: 0,
            };
        }
        return {
            userId,
            courseId,
            exists: true,
            totalSessions: context.currentState.sessionCount,
            totalLearningTime: context.insights.totalLearningTime,
            averageSessionDuration: context.insights.averageSessionDuration,
            lastActiveAt: context.lastActiveAt,
            currentState: context.currentState,
            masteredConceptCount: context.insights.masteredConcepts.length,
            strugglingConceptCount: context.insights.strugglingConcepts.length,
            engagementScore: context.insights.engagementScore,
        };
    }
    /**
     * Get context for AI prompting
     */
    async getContextForPrompt(userId, courseId) {
        const context = await this.store.get(userId, courseId);
        if (!context) {
            return {
                hasContext: false,
                learningStyle: 'mixed',
                preferredPace: 'moderate',
                currentTopic: null,
                currentGoal: null,
                recentConcepts: [],
                pendingQuestions: [],
                strengths: [],
                weaknesses: [],
                emotionalState: null,
                focusLevel: null,
                sessionCount: 0,
            };
        }
        return {
            hasContext: true,
            learningStyle: context.preferences.learningStyle,
            preferredPace: context.preferences.preferredPace,
            currentTopic: context.currentState.currentTopic ?? null,
            currentGoal: context.currentState.currentGoal ?? null,
            recentConcepts: context.currentState.recentConcepts,
            pendingQuestions: context.currentState.pendingQuestions,
            strengths: context.insights.strengths,
            weaknesses: context.insights.weaknesses,
            emotionalState: context.currentState.emotionalState ?? null,
            focusLevel: context.currentState.focusLevel ?? null,
            sessionCount: context.currentState.sessionCount,
        };
    }
    // ============================================================================
    // UTILITIES
    // ============================================================================
    addToRecentList(list, item, maxSize) {
        // Remove if exists
        const filtered = list.filter((i) => i !== item);
        // Add to beginning
        filtered.unshift(item);
        // Trim to max size
        return filtered.slice(0, maxSize);
    }
    async addHistoryEntry(contextId, entry) {
        await this.store.addHistoryEntry(contextId, entry);
    }
    /**
     * Delete context for a user
     */
    async deleteContext(userId, courseId) {
        const context = await this.store.get(userId, courseId);
        if (!context)
            return false;
        return this.store.delete(context.id);
    }
    /**
     * Get max history entries configuration
     */
    getMaxHistoryEntries() {
        return this.maxHistoryEntries;
    }
    /**
     * Get default session length configuration
     */
    getDefaultSessionLength() {
        return this.defaultSessionLength;
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createCrossSessionContext(config) {
    return new CrossSessionContext(config);
}
//# sourceMappingURL=cross-session-context.js.map