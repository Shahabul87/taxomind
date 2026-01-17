/**
 * @sam-ai/educational - Achievement Engine
 *
 * Portable gamification engine for tracking achievements, challenges, and points.
 * Provides comprehensive progress tracking, badge unlocking, and level progression.
 */
import type { AchievementEngineConfig, Achievement, Challenge, AchievementContext, AchievementTrackingResult, AchievementSummary, AchievementEngine as IAchievementEngine } from '../types';
/**
 * AchievementEngine - Gamification and progress tracking
 *
 * Features:
 * - Achievement tracking and unlocking
 * - Challenge management
 * - Points and level progression
 * - Streak tracking
 * - Badge awarding
 */
export declare class AchievementEngine implements IAchievementEngine {
    private config;
    private achievements;
    private challenges;
    private database;
    constructor(config: AchievementEngineConfig);
    /**
     * Track user action and check for achievement unlocks
     */
    trackProgress(userId: string, action: string, metadata?: Record<string, unknown>, context?: AchievementContext): Promise<AchievementTrackingResult>;
    /**
     * Get user's active challenges
     */
    getActiveChallenges(userId: string): Promise<Challenge[]>;
    /**
     * Start a challenge for user
     */
    startChallenge(userId: string, challengeId: string): Promise<boolean>;
    /**
     * Get available challenges for user's level
     */
    getAvailableChallenges(userId: string): Promise<Challenge[]>;
    /**
     * Get user's achievement summary
     */
    getSummary(userId: string): Promise<AchievementSummary>;
    /**
     * Get all achievements
     */
    getAchievements(): Achievement[];
    /**
     * Get all challenges
     */
    getChallenges(): Challenge[];
    /**
     * Calculate user level based on points
     */
    calculateLevel(points: number): number;
    /**
     * Get points required for a specific level
     */
    getPointsForLevel(level: number): number;
    private checkChallengeCompletion;
    private completeChallenge;
    private isStreakAction;
    private getStreakType;
    private getChallengeTimeframe;
    /**
     * Add custom achievements
     */
    addAchievements(achievements: Achievement[]): void;
    /**
     * Add custom challenges
     */
    addChallenges(challenges: Challenge[]): void;
}
/**
 * Factory function to create an AchievementEngine instance
 */
export declare function createAchievementEngine(config: AchievementEngineConfig): AchievementEngine;
//# sourceMappingURL=achievement-engine.d.ts.map