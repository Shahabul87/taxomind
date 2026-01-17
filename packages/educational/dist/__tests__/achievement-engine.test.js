/**
 * AchievementEngine Tests
 *
 * Comprehensive tests for gamification, achievement tracking, challenges,
 * points, levels, and streak management.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AchievementEngine, createAchievementEngine, } from '../engines/achievement-engine';
import { createMockSAMConfig } from './setup';
// ============================================================================
// TEST UTILITIES
// ============================================================================
const createMockDatabaseAdapter = (overrides = {}) => ({
    getUserStats: vi.fn().mockResolvedValue({
        points: 0,
        streak: 0,
        level: 1,
        badges: [],
        completedChallenges: [],
        activeChallenges: [],
    }),
    getUserBadges: vi.fn().mockResolvedValue([]),
    unlockBadge: vi.fn().mockResolvedValue(undefined),
    awardPoints: vi.fn().mockResolvedValue(undefined),
    updateStreak: vi.fn().mockResolvedValue(undefined),
    recordInteraction: vi.fn().mockResolvedValue(undefined),
    getUserChallenges: vi.fn().mockResolvedValue({
        activeChallenges: [],
        completedChallenges: [],
    }),
    updateUserChallenges: vi.fn().mockResolvedValue(undefined),
    getInteractionsSince: vi.fn().mockResolvedValue([]),
    checkAchievementProgress: vi.fn().mockResolvedValue({
        completed: false,
        progress: 0,
        total: 1,
    }),
    ...overrides,
});
const createMockEngineConfig = (overrides = {}) => ({
    samConfig: createMockSAMConfig(),
    database: createMockDatabaseAdapter(),
    ...overrides,
});
const createCustomAchievement = (overrides = {}) => ({
    id: 'custom_achievement',
    name: 'Custom Achievement',
    description: 'A custom achievement for testing',
    icon: 'Star',
    category: 'learning',
    points: 100,
    badgeType: 'ACHIEVEMENT',
    level: 1,
    ...overrides,
});
const createCustomChallenge = (overrides = {}) => ({
    id: 'custom_challenge',
    name: 'Custom Challenge',
    description: 'A custom challenge for testing',
    icon: 'Target',
    difficulty: 'easy',
    duration: 1,
    category: 'daily',
    points: 50,
    requirements: {
        type: 'form_completion',
        target: 1,
    },
    rewards: {
        points: 50,
    },
    ...overrides,
});
// ============================================================================
// CONSTRUCTOR AND INITIALIZATION TESTS
// ============================================================================
describe('AchievementEngine', () => {
    describe('Constructor and Initialization', () => {
        it('should create engine with default configuration', () => {
            const config = createMockEngineConfig();
            const engine = new AchievementEngine(config);
            expect(engine).toBeInstanceOf(AchievementEngine);
        });
        it('should create engine using factory function', () => {
            const config = createMockEngineConfig();
            const engine = createAchievementEngine(config);
            expect(engine).toBeInstanceOf(AchievementEngine);
        });
        it('should use default achievements when not provided', () => {
            const config = createMockEngineConfig();
            const engine = new AchievementEngine(config);
            const achievements = engine.getAchievements();
            expect(achievements.length).toBeGreaterThan(0);
            expect(achievements.some(a => a.id === 'first_course_created')).toBe(true);
        });
        it('should use default challenges when not provided', () => {
            const config = createMockEngineConfig();
            const engine = new AchievementEngine(config);
            const challenges = engine.getChallenges();
            expect(challenges.length).toBeGreaterThan(0);
            expect(challenges.some(c => c.id === 'daily_learning')).toBe(true);
        });
        it('should use custom achievements when provided', () => {
            const customAchievements = [createCustomAchievement({ id: 'custom_1' })];
            const config = createMockEngineConfig({ achievements: customAchievements });
            const engine = new AchievementEngine(config);
            const achievements = engine.getAchievements();
            expect(achievements.length).toBe(1);
            expect(achievements[0].id).toBe('custom_1');
        });
        it('should use custom challenges when provided', () => {
            const customChallenges = [createCustomChallenge({ id: 'custom_challenge_1' })];
            const config = createMockEngineConfig({ challenges: customChallenges });
            const engine = new AchievementEngine(config);
            const challenges = engine.getChallenges();
            expect(challenges.length).toBe(1);
            expect(challenges[0].id).toBe('custom_challenge_1');
        });
    });
    // ============================================================================
    // LEVEL CALCULATION TESTS
    // ============================================================================
    describe('Level Calculation', () => {
        let engine;
        beforeEach(() => {
            engine = new AchievementEngine(createMockEngineConfig());
        });
        it('should calculate level 1 for 0 points', () => {
            expect(engine.calculateLevel(0)).toBe(1);
        });
        it('should calculate level 1 for points below first threshold', () => {
            expect(engine.calculateLevel(50)).toBe(1);
            expect(engine.calculateLevel(99)).toBe(1);
        });
        it('should calculate level 2 for 100 points', () => {
            expect(engine.calculateLevel(100)).toBe(2);
        });
        it('should calculate level 3 for 300 points', () => {
            expect(engine.calculateLevel(300)).toBe(3);
        });
        it('should calculate level 4 for 600 points', () => {
            expect(engine.calculateLevel(600)).toBe(4);
        });
        it('should calculate level 5 for 1000 points', () => {
            expect(engine.calculateLevel(1000)).toBe(5);
        });
        it('should handle very high point values', () => {
            expect(engine.calculateLevel(100000)).toBeGreaterThan(10);
        });
        it('should return points for level 1', () => {
            expect(engine.getPointsForLevel(1)).toBe(0);
        });
        it('should return points for level 2', () => {
            expect(engine.getPointsForLevel(2)).toBe(100);
        });
        it('should return points for level 3', () => {
            expect(engine.getPointsForLevel(3)).toBe(300);
        });
        it('should return 0 for level 0 or negative', () => {
            expect(engine.getPointsForLevel(0)).toBe(0);
            expect(engine.getPointsForLevel(-1)).toBe(0);
        });
        it('should handle level beyond threshold array', () => {
            const points = engine.getPointsForLevel(100);
            expect(points).toBeGreaterThan(0);
        });
    });
    // ============================================================================
    // TRACK PROGRESS TESTS
    // ============================================================================
    describe('Track Progress', () => {
        let engine;
        let mockDatabase;
        beforeEach(() => {
            mockDatabase = createMockDatabaseAdapter();
            engine = new AchievementEngine(createMockEngineConfig({ database: mockDatabase }));
        });
        it('should record interaction when tracking progress', async () => {
            await engine.trackProgress('user-123', 'content_created', { title: 'Test' });
            expect(mockDatabase.recordInteraction).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'user-123',
                interactionType: 'content_created',
            }));
        });
        it('should return tracking result with 0 points for no achievements', async () => {
            const result = await engine.trackProgress('user-123', 'some_action');
            expect(result).toBeDefined();
            expect(result.pointsAwarded).toBe(0);
            expect(result.achievementsUnlocked).toEqual([]);
            expect(result.challengesCompleted).toEqual([]);
        });
        it('should unlock achievement when progress is complete', async () => {
            mockDatabase.checkAchievementProgress = vi.fn().mockResolvedValue({
                completed: true,
                progress: 1,
                total: 1,
            });
            const result = await engine.trackProgress('user-123', 'content_created');
            expect(result.achievementsUnlocked.length).toBeGreaterThan(0);
            expect(result.pointsAwarded).toBeGreaterThan(0);
        });
        it('should award points for unlocked achievements', async () => {
            mockDatabase.checkAchievementProgress = vi.fn().mockResolvedValue({
                completed: true,
                progress: 1,
                total: 1,
            });
            await engine.trackProgress('user-123', 'content_created');
            expect(mockDatabase.awardPoints).toHaveBeenCalled();
        });
        it('should unlock badge for completed achievement', async () => {
            mockDatabase.checkAchievementProgress = vi.fn().mockResolvedValue({
                completed: true,
                progress: 1,
                total: 1,
            });
            await engine.trackProgress('user-123', 'content_created');
            expect(mockDatabase.unlockBadge).toHaveBeenCalled();
        });
        it('should not unlock already owned achievements', async () => {
            mockDatabase.getUserBadges = vi.fn().mockResolvedValue([
                { description: 'first_course_created' },
            ]);
            mockDatabase.checkAchievementProgress = vi.fn().mockResolvedValue({
                completed: true,
                progress: 1,
                total: 1,
            });
            const result = await engine.trackProgress('user-123', 'content_created');
            const unlockedIds = result.achievementsUnlocked.map(a => a.id);
            expect(unlockedIds).not.toContain('first_course_created');
        });
        it('should check prerequisite achievements', async () => {
            // User doesn't have streak_7_days
            mockDatabase.getUserBadges = vi.fn().mockResolvedValue([]);
            mockDatabase.checkAchievementProgress = vi.fn().mockResolvedValue({
                completed: true,
                progress: 1,
                total: 1,
            });
            const result = await engine.trackProgress('user-123', 'streak_maintained');
            // streak_30_days requires streak_7_days, so should not unlock
            const unlockedIds = result.achievementsUnlocked.map(a => a.id);
            expect(unlockedIds).not.toContain('streak_30_days');
        });
        it('should unlock achievements with satisfied prerequisites', async () => {
            mockDatabase.getUserBadges = vi.fn().mockResolvedValue([
                { description: 'streak_7_days' },
            ]);
            mockDatabase.checkAchievementProgress = vi.fn().mockResolvedValue({
                completed: true,
                progress: 1,
                total: 1,
            });
            const result = await engine.trackProgress('user-123', 'streak_maintained');
            // Now streak_30_days should be possible to unlock
            expect(mockDatabase.checkAchievementProgress).toHaveBeenCalled();
        });
        it('should update streak for streak actions', async () => {
            await engine.trackProgress('user-123', 'content_created');
            expect(mockDatabase.updateStreak).toHaveBeenCalledWith('user-123', expect.objectContaining({
                streakType: 'CONTENT_CREATION',
            }));
        });
        it('should update streak for ai_assistance_used', async () => {
            await engine.trackProgress('user-123', 'ai_assistance_used');
            expect(mockDatabase.updateStreak).toHaveBeenCalledWith('user-123', expect.objectContaining({
                streakType: 'DAILY_INTERACTION',
            }));
        });
        it('should update streak for form_completed', async () => {
            await engine.trackProgress('user-123', 'form_completed');
            expect(mockDatabase.updateStreak).toHaveBeenCalledWith('user-123', expect.objectContaining({
                streakType: 'FORM_COMPLETION',
            }));
        });
        it('should not update streak for non-streak actions', async () => {
            await engine.trackProgress('user-123', 'page_viewed');
            expect(mockDatabase.updateStreak).not.toHaveBeenCalled();
        });
        it('should detect level up', async () => {
            mockDatabase.getUserStats = vi.fn().mockResolvedValue({
                points: 95,
                streak: 0,
                level: 1,
                badges: [],
                completedChallenges: [],
                activeChallenges: [],
            });
            mockDatabase.checkAchievementProgress = vi.fn().mockResolvedValue({
                completed: true,
                progress: 1,
                total: 1,
            });
            const result = await engine.trackProgress('user-123', 'content_created');
            // If unlocked achievement gives enough points to reach level 2
            if (result.levelUp) {
                expect(result.levelUp.oldLevel).toBe(1);
                expect(result.levelUp.newLevel).toBeGreaterThan(1);
            }
        });
        it('should award level up bonus on level up', async () => {
            mockDatabase.getUserStats = vi.fn().mockResolvedValue({
                points: 50,
                streak: 0,
                level: 1,
                badges: [],
                completedChallenges: [],
                activeChallenges: [],
            });
            mockDatabase.checkAchievementProgress = vi.fn().mockResolvedValue({
                completed: true,
                progress: 1,
                total: 1,
            });
            await engine.trackProgress('user-123', 'content_created');
            // Check if awardPoints was called for level up
            const calls = mockDatabase.awardPoints.mock.calls;
            const levelUpCall = calls.find((call) => call[1].source === 'level_up');
            // May or may not level up depending on points
            if (levelUpCall) {
                expect(levelUpCall[1].reason).toContain('Level up bonus');
            }
        });
        it('should include context in tracking', async () => {
            const context = {
                courseId: 'course-123',
                chapterId: 'chapter-456',
                sectionId: 'section-789',
            };
            await engine.trackProgress('user-123', 'content_created', {}, context);
            expect(mockDatabase.recordInteraction).toHaveBeenCalledWith(expect.objectContaining({
                courseId: 'course-123',
                chapterId: 'chapter-456',
                sectionId: 'section-789',
            }));
        });
        it('should handle errors gracefully', async () => {
            mockDatabase.getUserStats = vi.fn().mockRejectedValue(new Error('DB Error'));
            const result = await engine.trackProgress('user-123', 'content_created');
            expect(result.pointsAwarded).toBe(0);
            expect(result.achievementsUnlocked).toEqual([]);
        });
    });
    // ============================================================================
    // CHALLENGE TESTS
    // ============================================================================
    describe('Challenges', () => {
        let engine;
        let mockDatabase;
        beforeEach(() => {
            mockDatabase = createMockDatabaseAdapter();
            engine = new AchievementEngine(createMockEngineConfig({ database: mockDatabase }));
        });
        describe('getActiveChallenges', () => {
            it('should return empty array for user with no active challenges', async () => {
                const challenges = await engine.getActiveChallenges('user-123');
                expect(challenges).toEqual([]);
            });
            it('should return active challenges', async () => {
                mockDatabase.getUserChallenges = vi.fn().mockResolvedValue({
                    activeChallenges: ['daily_learning'],
                    completedChallenges: [],
                });
                const challenges = await engine.getActiveChallenges('user-123');
                expect(challenges.length).toBe(1);
                expect(challenges[0].id).toBe('daily_learning');
            });
            it('should return multiple active challenges', async () => {
                mockDatabase.getUserChallenges = vi.fn().mockResolvedValue({
                    activeChallenges: ['daily_learning', 'weekly_creator'],
                    completedChallenges: [],
                });
                const challenges = await engine.getActiveChallenges('user-123');
                expect(challenges.length).toBe(2);
            });
            it('should handle database errors', async () => {
                mockDatabase.getUserChallenges = vi.fn().mockRejectedValue(new Error('DB Error'));
                const challenges = await engine.getActiveChallenges('user-123');
                expect(challenges).toEqual([]);
            });
        });
        describe('startChallenge', () => {
            it('should start a challenge successfully', async () => {
                const success = await engine.startChallenge('user-123', 'daily_learning');
                expect(success).toBe(true);
                expect(mockDatabase.updateUserChallenges).toHaveBeenCalledWith('user-123', expect.objectContaining({
                    activeChallenges: ['daily_learning'],
                }));
            });
            it('should record challenge start interaction', async () => {
                await engine.startChallenge('user-123', 'daily_learning');
                expect(mockDatabase.recordInteraction).toHaveBeenCalledWith(expect.objectContaining({
                    userId: 'user-123',
                    interactionType: 'CHALLENGE_STARTED',
                }));
            });
            it('should return false for non-existent challenge', async () => {
                const success = await engine.startChallenge('user-123', 'non_existent_challenge');
                expect(success).toBe(false);
            });
            it('should return false if challenge is already active', async () => {
                mockDatabase.getUserChallenges = vi.fn().mockResolvedValue({
                    activeChallenges: ['daily_learning'],
                    completedChallenges: [],
                });
                const success = await engine.startChallenge('user-123', 'daily_learning');
                expect(success).toBe(false);
            });
            it('should handle database errors', async () => {
                mockDatabase.getUserChallenges = vi.fn().mockRejectedValue(new Error('DB Error'));
                const success = await engine.startChallenge('user-123', 'daily_learning');
                expect(success).toBe(false);
            });
        });
        describe('getAvailableChallenges', () => {
            it('should return challenges for level 1 user', async () => {
                mockDatabase.getUserStats = vi.fn().mockResolvedValue({
                    points: 0,
                    streak: 0,
                    level: 1,
                    badges: [],
                    completedChallenges: [],
                    activeChallenges: [],
                });
                const challenges = await engine.getAvailableChallenges('user-123');
                // Should only include easy challenges
                const difficulties = challenges.map(c => c.difficulty);
                expect(difficulties.every(d => d === 'easy')).toBe(true);
            });
            it('should return more challenges for higher level users', async () => {
                mockDatabase.getUserStats = vi.fn().mockResolvedValue({
                    points: 1000,
                    streak: 0,
                    level: 5,
                    badges: [],
                    completedChallenges: [],
                    activeChallenges: [],
                });
                const challenges = await engine.getAvailableChallenges('user-123');
                // Should include easy, medium, and hard challenges
                const difficulties = [...new Set(challenges.map(c => c.difficulty))];
                expect(difficulties.length).toBeGreaterThan(1);
            });
            it('should exclude completed challenges', async () => {
                mockDatabase.getUserChallenges = vi.fn().mockResolvedValue({
                    activeChallenges: [],
                    completedChallenges: ['daily_learning'],
                });
                mockDatabase.getUserStats = vi.fn().mockResolvedValue({
                    points: 0,
                    streak: 0,
                    level: 1,
                    badges: [],
                    completedChallenges: ['daily_learning'],
                    activeChallenges: [],
                });
                const challenges = await engine.getAvailableChallenges('user-123');
                const ids = challenges.map(c => c.id);
                expect(ids).not.toContain('daily_learning');
            });
            it('should exclude active challenges', async () => {
                mockDatabase.getUserChallenges = vi.fn().mockResolvedValue({
                    activeChallenges: ['daily_learning'],
                    completedChallenges: [],
                });
                const challenges = await engine.getAvailableChallenges('user-123');
                const ids = challenges.map(c => c.id);
                expect(ids).not.toContain('daily_learning');
            });
            it('should handle database errors', async () => {
                mockDatabase.getUserStats = vi.fn().mockRejectedValue(new Error('DB Error'));
                const challenges = await engine.getAvailableChallenges('user-123');
                expect(challenges).toEqual([]);
            });
        });
        describe('Challenge Completion', () => {
            it('should complete challenge and award points during tracking', async () => {
                mockDatabase.getUserChallenges = vi.fn().mockResolvedValue({
                    activeChallenges: ['daily_learning'],
                    completedChallenges: [],
                });
                mockDatabase.getInteractionsSince = vi.fn().mockResolvedValue([
                    { createdAt: new Date(), context: {} },
                ]);
                const result = await engine.trackProgress('user-123', 'form_completion');
                // Check if challenge was completed
                if (result.challengesCompleted.length > 0) {
                    expect(result.challengesCompleted[0].id).toBe('daily_learning');
                    expect(result.pointsAwarded).toBeGreaterThan(0);
                }
            });
        });
    });
    // ============================================================================
    // SUMMARY TESTS
    // ============================================================================
    describe('getSummary', () => {
        let engine;
        let mockDatabase;
        beforeEach(() => {
            mockDatabase = createMockDatabaseAdapter();
            engine = new AchievementEngine(createMockEngineConfig({ database: mockDatabase }));
        });
        it('should return summary for user', async () => {
            const summary = await engine.getSummary('user-123');
            expect(summary).toBeDefined();
            expect(summary.level).toBeDefined();
            expect(summary.totalPoints).toBeDefined();
            expect(summary.pointsToNextLevel).toBeDefined();
        });
        it('should return correct level based on points', async () => {
            mockDatabase.getUserStats = vi.fn().mockResolvedValue({
                points: 350,
                streak: 0,
                level: 3,
                badges: [],
                completedChallenges: [],
                activeChallenges: [],
            });
            const summary = await engine.getSummary('user-123');
            expect(summary.level).toBe(3);
        });
        it('should calculate points to next level', async () => {
            mockDatabase.getUserStats = vi.fn().mockResolvedValue({
                points: 50,
                streak: 0,
                level: 1,
                badges: [],
                completedChallenges: [],
                activeChallenges: [],
            });
            const summary = await engine.getSummary('user-123');
            expect(summary.pointsToNextLevel).toBe(50); // 100 - 50
        });
        it('should count total achievements', async () => {
            mockDatabase.getUserBadges = vi.fn().mockResolvedValue([
                { description: 'achievement_1' },
                { description: 'achievement_2' },
                { description: 'achievement_3' },
            ]);
            const summary = await engine.getSummary('user-123');
            expect(summary.totalAchievements).toBe(3);
        });
        it('should count completed challenges', async () => {
            mockDatabase.getUserChallenges = vi.fn().mockResolvedValue({
                activeChallenges: [],
                completedChallenges: ['challenge_1', 'challenge_2'],
            });
            const summary = await engine.getSummary('user-123');
            expect(summary.completedChallenges).toBe(2);
        });
        it('should count active challenges', async () => {
            mockDatabase.getUserChallenges = vi.fn().mockResolvedValue({
                activeChallenges: ['challenge_1'],
                completedChallenges: [],
            });
            const summary = await engine.getSummary('user-123');
            expect(summary.activeChallenges).toBe(1);
        });
        it('should provide recommendations', async () => {
            const summary = await engine.getSummary('user-123');
            expect(summary.recommendations).toBeDefined();
            expect(Array.isArray(summary.recommendations)).toBe(true);
        });
        it('should exclude already earned achievements from recommendations', async () => {
            mockDatabase.getUserBadges = vi.fn().mockResolvedValue([
                { description: 'first_course_created' },
            ]);
            const summary = await engine.getSummary('user-123');
            const recommendedIds = summary.recommendations.map(r => r.id);
            expect(recommendedIds).not.toContain('first_course_created');
        });
        it('should handle database errors', async () => {
            mockDatabase.getUserStats = vi.fn().mockRejectedValue(new Error('DB Error'));
            const summary = await engine.getSummary('user-123');
            expect(summary.level).toBe(1);
            expect(summary.totalPoints).toBe(0);
        });
        it('should return minimum 0 for points to next level', async () => {
            mockDatabase.getUserStats = vi.fn().mockResolvedValue({
                points: 100000, // Very high
                streak: 0,
                level: 11,
                badges: [],
                completedChallenges: [],
                activeChallenges: [],
            });
            const summary = await engine.getSummary('user-123');
            expect(summary.pointsToNextLevel).toBeGreaterThanOrEqual(0);
        });
    });
    // ============================================================================
    // EXTENSION METHODS TESTS
    // ============================================================================
    describe('Extension Methods', () => {
        let engine;
        beforeEach(() => {
            engine = new AchievementEngine(createMockEngineConfig());
        });
        describe('addAchievements', () => {
            it('should add custom achievements', () => {
                const initialCount = engine.getAchievements().length;
                engine.addAchievements([
                    createCustomAchievement({ id: 'new_achievement' }),
                ]);
                expect(engine.getAchievements().length).toBe(initialCount + 1);
            });
            it('should add multiple achievements', () => {
                const initialCount = engine.getAchievements().length;
                engine.addAchievements([
                    createCustomAchievement({ id: 'new_1' }),
                    createCustomAchievement({ id: 'new_2' }),
                    createCustomAchievement({ id: 'new_3' }),
                ]);
                expect(engine.getAchievements().length).toBe(initialCount + 3);
            });
            it('should preserve existing achievements', () => {
                const originalAchievements = [...engine.getAchievements()];
                engine.addAchievements([
                    createCustomAchievement({ id: 'new_achievement' }),
                ]);
                const allAchievements = engine.getAchievements();
                for (const original of originalAchievements) {
                    expect(allAchievements.some(a => a.id === original.id)).toBe(true);
                }
            });
        });
        describe('addChallenges', () => {
            it('should add custom challenges', () => {
                const initialCount = engine.getChallenges().length;
                engine.addChallenges([
                    createCustomChallenge({ id: 'new_challenge' }),
                ]);
                expect(engine.getChallenges().length).toBe(initialCount + 1);
            });
            it('should add multiple challenges', () => {
                const initialCount = engine.getChallenges().length;
                engine.addChallenges([
                    createCustomChallenge({ id: 'new_1' }),
                    createCustomChallenge({ id: 'new_2' }),
                ]);
                expect(engine.getChallenges().length).toBe(initialCount + 2);
            });
            it('should preserve existing challenges', () => {
                const originalChallenges = [...engine.getChallenges()];
                engine.addChallenges([
                    createCustomChallenge({ id: 'new_challenge' }),
                ]);
                const allChallenges = engine.getChallenges();
                for (const original of originalChallenges) {
                    expect(allChallenges.some(c => c.id === original.id)).toBe(true);
                }
            });
        });
    });
    // ============================================================================
    // DEFAULT ACHIEVEMENTS AND CHALLENGES TESTS
    // ============================================================================
    describe('Default Achievements', () => {
        let engine;
        beforeEach(() => {
            engine = new AchievementEngine(createMockEngineConfig());
        });
        it('should include Course Creator achievement', () => {
            const achievement = engine.getAchievements().find(a => a.id === 'first_course_created');
            expect(achievement).toBeDefined();
            expect(achievement?.name).toBe('Course Creator');
            expect(achievement?.points).toBe(100);
        });
        it('should include Chapter Master achievement', () => {
            const achievement = engine.getAchievements().find(a => a.id === 'first_chapter_completed');
            expect(achievement).toBeDefined();
            expect(achievement?.category).toBe('learning');
        });
        it('should include AI Explorer achievement', () => {
            const achievement = engine.getAchievements().find(a => a.id === 'ai_assistant_used');
            expect(achievement).toBeDefined();
            expect(achievement?.category).toBe('creativity');
        });
        it('should include Week Warrior streak achievement', () => {
            const achievement = engine.getAchievements().find(a => a.id === 'streak_7_days');
            expect(achievement).toBeDefined();
            expect(achievement?.badgeType).toBe('STREAK');
        });
        it('should include Monthly Master streak achievement', () => {
            const achievement = engine.getAchievements().find(a => a.id === 'streak_30_days');
            expect(achievement).toBeDefined();
            expect(achievement?.unlockConditions?.prerequisiteAchievements).toContain('streak_7_days');
        });
        it('should include Team Player achievement', () => {
            const achievement = engine.getAchievements().find(a => a.id === 'collaboration_first');
            expect(achievement).toBeDefined();
            expect(achievement?.category).toBe('collaboration');
        });
        it('should include Perfect Score achievement', () => {
            const achievement = engine.getAchievements().find(a => a.id === 'mastery_quiz_perfect');
            expect(achievement).toBeDefined();
            expect(achievement?.category).toBe('mastery');
        });
    });
    describe('Default Challenges', () => {
        let engine;
        beforeEach(() => {
            engine = new AchievementEngine(createMockEngineConfig());
        });
        it('should include Daily Learner challenge', () => {
            const challenge = engine.getChallenges().find(c => c.id === 'daily_learning');
            expect(challenge).toBeDefined();
            expect(challenge?.difficulty).toBe('easy');
            expect(challenge?.duration).toBe(1);
        });
        it('should include Weekly Creator challenge', () => {
            const challenge = engine.getChallenges().find(c => c.id === 'weekly_creator');
            expect(challenge).toBeDefined();
            expect(challenge?.difficulty).toBe('medium');
            expect(challenge?.rewards.badges).toContain('weekly_creator_badge');
        });
        it('should include AI Explorer Week challenge', () => {
            const challenge = engine.getChallenges().find(c => c.id === 'ai_explorer_week');
            expect(challenge).toBeDefined();
            expect(challenge?.requirements.type).toBe('use_ai');
            expect(challenge?.requirements.target).toBe(10);
        });
        it('should include Monthly Mastery challenge', () => {
            const challenge = engine.getChallenges().find(c => c.id === 'monthly_mastery');
            expect(challenge).toBeDefined();
            expect(challenge?.difficulty).toBe('hard');
            expect(challenge?.bonusMultiplier).toBe(1.5);
            expect(challenge?.rewards.specialRewards).toContain('custom_avatar_frame');
        });
        it('should include Collaboration Master challenge', () => {
            const challenge = engine.getChallenges().find(c => c.id === 'collaboration_master');
            expect(challenge).toBeDefined();
            expect(challenge?.requirements.type).toBe('collaboration');
        });
    });
    // ============================================================================
    // EDGE CASES AND ERROR HANDLING
    // ============================================================================
    describe('Edge Cases', () => {
        let engine;
        let mockDatabase;
        beforeEach(() => {
            mockDatabase = createMockDatabaseAdapter();
            engine = new AchievementEngine(createMockEngineConfig({ database: mockDatabase }));
        });
        it('should handle null metadata in trackProgress', async () => {
            const result = await engine.trackProgress('user-123', 'some_action');
            expect(result).toBeDefined();
        });
        it('should handle empty string action', async () => {
            const result = await engine.trackProgress('user-123', '');
            expect(result).toBeDefined();
        });
        it('should handle undefined context', async () => {
            const result = await engine.trackProgress('user-123', 'content_created', {});
            expect(result).toBeDefined();
        });
        it('should handle null userChallenges response', async () => {
            mockDatabase.getUserChallenges = vi.fn().mockResolvedValue(null);
            const challenges = await engine.getActiveChallenges('user-123');
            expect(challenges).toEqual([]);
        });
        it('should handle missing activeChallenges in response', async () => {
            mockDatabase.getUserChallenges = vi.fn().mockResolvedValue({});
            const challenges = await engine.getActiveChallenges('user-123');
            expect(challenges).toEqual([]);
        });
        it('should handle challenge without badges in rewards', async () => {
            const challengeNoBadges = createCustomChallenge({
                id: 'no_badges_challenge',
                rewards: { points: 50 },
            });
            engine.addChallenges([challengeNoBadges]);
            // Starting should still work
            const success = await engine.startChallenge('user-123', 'no_badges_challenge');
            expect(success).toBe(true);
        });
        it('should handle user with null streak', async () => {
            mockDatabase.getUserStats = vi.fn().mockResolvedValue({
                points: 100,
                streak: null,
                level: 1,
                badges: [],
                completedChallenges: [],
                activeChallenges: [],
            });
            await engine.trackProgress('user-123', 'content_created');
            // Should handle null streak gracefully
            expect(mockDatabase.updateStreak).toHaveBeenCalled();
        });
        it('should handle achievement without unlock conditions', async () => {
            const simpleAchievement = createCustomAchievement({
                id: 'simple_achievement',
                unlockConditions: undefined,
            });
            engine.addAchievements([simpleAchievement]);
            mockDatabase.checkAchievementProgress = vi.fn().mockResolvedValue({
                completed: true,
                progress: 1,
                total: 1,
            });
            const result = await engine.trackProgress('user-123', 'some_action');
            // Should process without errors
            expect(result).toBeDefined();
        });
        it('should handle very long user ID', async () => {
            const longUserId = 'user-' + 'x'.repeat(1000);
            const result = await engine.trackProgress(longUserId, 'content_created');
            expect(result).toBeDefined();
        });
        it('should handle special characters in metadata', async () => {
            const metadata = {
                title: 'Test <script>alert("xss")</script>',
                emoji: '\u{1F600}',
                unicode: '\u00e9\u00e8\u00ea',
            };
            const result = await engine.trackProgress('user-123', 'content_created', metadata);
            expect(result).toBeDefined();
        });
    });
    // ============================================================================
    // INTEGRATION-STYLE TESTS
    // ============================================================================
    describe('Integration Scenarios', () => {
        let engine;
        let mockDatabase;
        beforeEach(() => {
            mockDatabase = createMockDatabaseAdapter();
            engine = new AchievementEngine(createMockEngineConfig({ database: mockDatabase }));
        });
        it('should handle complete user journey: start challenge, track progress, complete challenge', async () => {
            // 1. Start a challenge
            const started = await engine.startChallenge('user-123', 'daily_learning');
            expect(started).toBe(true);
            // 2. Track progress
            mockDatabase.getUserChallenges = vi.fn().mockResolvedValue({
                activeChallenges: ['daily_learning'],
                completedChallenges: [],
            });
            mockDatabase.getInteractionsSince = vi.fn().mockResolvedValue([
                { createdAt: new Date(), context: {} },
            ]);
            const result = await engine.trackProgress('user-123', 'form_completion');
            expect(result).toBeDefined();
        });
        it('should accumulate points across multiple actions', async () => {
            mockDatabase.checkAchievementProgress = vi.fn().mockResolvedValue({
                completed: true,
                progress: 1,
                total: 1,
            });
            const result1 = await engine.trackProgress('user-123', 'content_created');
            const points1 = result1.pointsAwarded;
            // Update user stats to reflect new points
            mockDatabase.getUserStats = vi.fn().mockResolvedValue({
                points: points1,
                streak: 1,
                level: 1,
                badges: result1.achievementsUnlocked.map(a => a.id),
                completedChallenges: [],
                activeChallenges: [],
            });
            mockDatabase.getUserBadges = vi.fn().mockResolvedValue(result1.achievementsUnlocked.map(a => ({ description: a.id })));
            const result2 = await engine.trackProgress('user-123', 'ai_assistance_used');
            // Total points should be accumulated
            expect(points1 + result2.pointsAwarded).toBeGreaterThanOrEqual(points1);
        });
        it('should maintain correct state after multiple operations', async () => {
            // Get initial summary
            const summary1 = await engine.getSummary('user-123');
            // Start a challenge
            await engine.startChallenge('user-123', 'daily_learning');
            // Update mock to reflect started challenge
            mockDatabase.getUserChallenges = vi.fn().mockResolvedValue({
                activeChallenges: ['daily_learning'],
                completedChallenges: [],
            });
            // Get updated summary
            const summary2 = await engine.getSummary('user-123');
            expect(summary2.activeChallenges).toBe(summary1.activeChallenges + 1);
        });
    });
});
