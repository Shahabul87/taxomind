/**
 * @sam-ai/educational - Achievement Engine
 *
 * Portable gamification engine for tracking achievements, challenges, and points.
 * Provides comprehensive progress tracking, badge unlocking, and level progression.
 */
// Default achievements
const DEFAULT_ACHIEVEMENTS = [
    {
        id: 'first_course_created',
        name: 'Course Creator',
        description: 'Create your first course',
        icon: 'BookOpen',
        category: 'teaching',
        points: 100,
        badgeType: 'ACHIEVEMENT',
        level: 1,
    },
    {
        id: 'first_chapter_completed',
        name: 'Chapter Master',
        description: 'Complete your first chapter',
        icon: 'CheckCircle',
        category: 'learning',
        points: 50,
        badgeType: 'ACHIEVEMENT',
        level: 1,
    },
    {
        id: 'ai_assistant_used',
        name: 'AI Explorer',
        description: 'Use SAM AI assistant for the first time',
        icon: 'Brain',
        category: 'creativity',
        points: 25,
        badgeType: 'ACHIEVEMENT',
        level: 1,
    },
    {
        id: 'streak_7_days',
        name: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        icon: 'Flame',
        category: 'consistency',
        points: 150,
        badgeType: 'STREAK',
        level: 2,
    },
    {
        id: 'streak_30_days',
        name: 'Monthly Master',
        description: 'Maintain a 30-day learning streak',
        icon: 'Trophy',
        category: 'consistency',
        points: 500,
        badgeType: 'STREAK',
        level: 3,
        unlockConditions: {
            prerequisiteAchievements: ['streak_7_days'],
        },
    },
    {
        id: 'collaboration_first',
        name: 'Team Player',
        description: 'Participate in a group discussion',
        icon: 'Users',
        category: 'collaboration',
        points: 75,
        badgeType: 'ACHIEVEMENT',
        level: 1,
    },
    {
        id: 'content_creator_10',
        name: 'Prolific Creator',
        description: 'Create 10 pieces of content',
        icon: 'Edit',
        category: 'teaching',
        points: 200,
        badgeType: 'ACHIEVEMENT',
        level: 2,
    },
    {
        id: 'mastery_quiz_perfect',
        name: 'Perfect Score',
        description: 'Score 100% on a quiz',
        icon: 'Star',
        category: 'mastery',
        points: 100,
        badgeType: 'ACHIEVEMENT',
        level: 2,
    },
];
// Default challenges
const DEFAULT_CHALLENGES = [
    {
        id: 'daily_learning',
        name: 'Daily Learner',
        description: 'Complete at least one lesson today',
        icon: 'Calendar',
        difficulty: 'easy',
        duration: 1,
        category: 'daily',
        points: 20,
        requirements: {
            type: 'form_completion',
            target: 1,
        },
        rewards: {
            points: 20,
        },
    },
    {
        id: 'weekly_creator',
        name: 'Weekly Creator',
        description: 'Create 5 pieces of content this week',
        icon: 'Edit',
        difficulty: 'medium',
        duration: 7,
        category: 'weekly',
        points: 100,
        requirements: {
            type: 'create_content',
            target: 5,
        },
        rewards: {
            points: 100,
            badges: ['weekly_creator_badge'],
        },
    },
    {
        id: 'ai_explorer_week',
        name: 'AI Explorer Week',
        description: 'Use AI assistance 10 times this week',
        icon: 'Brain',
        difficulty: 'medium',
        duration: 7,
        category: 'weekly',
        points: 75,
        requirements: {
            type: 'use_ai',
            target: 10,
        },
        rewards: {
            points: 75,
        },
    },
    {
        id: 'monthly_mastery',
        name: 'Monthly Mastery',
        description: 'Complete 30 lessons in a month',
        icon: 'Trophy',
        difficulty: 'hard',
        duration: 30,
        category: 'monthly',
        points: 300,
        bonusMultiplier: 1.5,
        requirements: {
            type: 'form_completion',
            target: 30,
        },
        rewards: {
            points: 300,
            badges: ['monthly_master_badge'],
            specialRewards: ['custom_avatar_frame'],
        },
    },
    {
        id: 'collaboration_master',
        name: 'Collaboration Master',
        description: 'Participate in 20 group activities',
        icon: 'Users',
        difficulty: 'hard',
        duration: 30,
        category: 'monthly',
        points: 250,
        requirements: {
            type: 'collaboration',
            target: 20,
        },
        rewards: {
            points: 250,
            badges: ['collaboration_master_badge'],
        },
    },
];
// Level thresholds
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, 15000];
// Streak action types
const STREAK_ACTIONS = ['content_created', 'ai_assistance_used', 'form_completed', 'suggestion_applied'];
// Streak type mapping
const STREAK_TYPE_MAP = {
    'content_created': 'CONTENT_CREATION',
    'ai_assistance_used': 'DAILY_INTERACTION',
    'form_completed': 'FORM_COMPLETION',
    'suggestion_applied': 'DAILY_INTERACTION',
};
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
export class AchievementEngine {
    config;
    achievements;
    challenges;
    database;
    constructor(config) {
        this.config = config;
        this.achievements = config.achievements ?? DEFAULT_ACHIEVEMENTS;
        this.challenges = config.challenges ?? DEFAULT_CHALLENGES;
        this.database = config.database;
    }
    /**
     * Track user action and check for achievement unlocks
     */
    async trackProgress(userId, action, metadata = {}, context) {
        try {
            // Get current user stats
            const userStats = await this.database.getUserStats(userId, context?.courseId);
            const currentLevel = this.calculateLevel(userStats.points);
            // Record the interaction
            await this.database.recordInteraction({
                userId,
                interactionType: action,
                context: JSON.stringify({ action, metadata, context }),
                result: JSON.stringify(metadata),
                courseId: context?.courseId,
                chapterId: context?.chapterId,
                sectionId: context?.sectionId,
            });
            let totalPointsAwarded = 0;
            const achievementsUnlocked = [];
            const challengesCompleted = [];
            // Get user's current achievements
            const existingBadges = await this.database.getUserBadges(userId);
            const achievementIds = existingBadges.map(a => a.description);
            // Check for achievement unlocks
            for (const achievement of this.achievements) {
                if (achievementIds.includes(achievement.id))
                    continue;
                // Check prerequisites
                if (achievement.unlockConditions?.prerequisiteAchievements) {
                    const hasPrerequisites = achievement.unlockConditions.prerequisiteAchievements.every((prereq) => achievementIds.includes(prereq));
                    if (!hasPrerequisites)
                        continue;
                }
                // Check achievement progress
                const progress = await this.database.checkAchievementProgress(achievement.id, userId);
                if (progress.completed) {
                    // Unlock achievement
                    await this.database.unlockBadge(userId, {
                        badgeType: achievement.badgeType ?? 'ACHIEVEMENT',
                        level: achievement.level ?? 1,
                        description: achievement.id,
                        requirements: {
                            achievementId: achievement.id,
                            unlockedAction: action,
                            context,
                        },
                        courseId: context?.courseId,
                        chapterId: context?.chapterId,
                    });
                    // Award points
                    await this.database.awardPoints(userId, {
                        points: achievement.points,
                        reason: `Achievement unlocked: ${achievement.name}`,
                        source: 'achievement',
                        courseId: context?.courseId,
                        chapterId: context?.chapterId,
                        sectionId: context?.sectionId,
                    });
                    totalPointsAwarded += achievement.points;
                    achievementsUnlocked.push(achievement);
                }
            }
            // Check active challenges
            const activeChallenges = await this.getActiveChallenges(userId);
            for (const challenge of activeChallenges) {
                const completed = await this.checkChallengeCompletion(userId, challenge, action);
                if (completed) {
                    await this.completeChallenge(userId, challenge, context);
                    challengesCompleted.push(challenge);
                    totalPointsAwarded += challenge.rewards.points;
                }
            }
            // Update streaks based on action
            if (this.isStreakAction(action)) {
                await this.database.updateStreak(userId, {
                    streakType: this.getStreakType(action),
                    currentStreak: (userStats.streak ?? 0) + 1,
                    longestStreak: Math.max(userStats.streak ?? 0, (userStats.streak ?? 0) + 1),
                    courseId: context?.courseId,
                });
            }
            // Check for level up
            const newTotalPoints = userStats.points + totalPointsAwarded;
            const newLevel = this.calculateLevel(newTotalPoints);
            const levelUp = newLevel > currentLevel ? { oldLevel: currentLevel, newLevel } : undefined;
            // Award level up bonus
            if (levelUp) {
                const levelUpBonus = newLevel * 50;
                await this.database.awardPoints(userId, {
                    points: levelUpBonus,
                    reason: `Level up bonus: Level ${newLevel}`,
                    source: 'level_up',
                    courseId: context?.courseId,
                });
                totalPointsAwarded += levelUpBonus;
            }
            return {
                pointsAwarded: totalPointsAwarded,
                achievementsUnlocked,
                challengesCompleted,
                levelUp,
            };
        }
        catch (error) {
            console.error('Error tracking achievement progress:', error);
            return {
                pointsAwarded: 0,
                achievementsUnlocked: [],
                challengesCompleted: [],
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
            return this.challenges.filter(challenge => userChallenges.activeChallenges.includes(challenge.id));
        }
        catch (error) {
            console.error('Error getting active challenges:', error);
            return [];
        }
    }
    /**
     * Start a challenge for user
     */
    async startChallenge(userId, challengeId) {
        try {
            const challenge = this.challenges.find(c => c.id === challengeId);
            if (!challenge)
                return false;
            const userChallenges = await this.database.getUserChallenges(userId);
            const activeChallenges = userChallenges?.activeChallenges ?? [];
            if (activeChallenges.includes(challengeId)) {
                return false; // Already active
            }
            await this.database.updateUserChallenges(userId, {
                activeChallenges: [...activeChallenges, challengeId],
                challengeStartDate: new Date(),
            });
            // Record the challenge start
            await this.database.recordInteraction({
                userId,
                interactionType: 'CHALLENGE_STARTED',
                context: JSON.stringify({ challengeId, challenge }),
                result: JSON.stringify({ started: true }),
            });
            return true;
        }
        catch (error) {
            console.error('Error starting challenge:', error);
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
                expert: 8,
            };
            return this.challenges.filter(challenge => {
                // Don't show completed or active challenges
                if (completedChallenges.includes(challenge.id) || activeChallenges.includes(challenge.id)) {
                    return false;
                }
                // Check level requirements
                return userLevel >= levelRequirements[challenge.difficulty];
            });
        }
        catch (error) {
            console.error('Error getting available challenges:', error);
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
            // Get recommendations (achievements close to unlocking)
            const achievementIds = badges.map(a => a.description);
            const recommendations = this.achievements
                .filter(a => !achievementIds.includes(a.id))
                .slice(0, 3);
            return {
                level: currentLevel,
                totalPoints: userStats.points,
                pointsToNextLevel: Math.max(0, pointsToNextLevel),
                totalAchievements: badges.length,
                completedChallenges: (userChallenges?.completedChallenges ?? []).length,
                activeChallenges: (userChallenges?.activeChallenges ?? []).length,
                recommendations,
            };
        }
        catch (error) {
            console.error('Error getting user achievement summary:', error);
            return {
                level: 1,
                totalPoints: 0,
                pointsToNextLevel: 100,
                totalAchievements: 0,
                completedChallenges: 0,
                activeChallenges: 0,
                recommendations: [],
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
        if (level <= 0)
            return 0;
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
            const interactions = await this.database.getInteractionsSince(userId, timeframe.start, requirements.type);
            const currentProgress = interactions.length + (requirements.type === action ? 1 : 0);
            return currentProgress >= requirements.target;
        }
        catch (error) {
            console.error('Error checking challenge completion:', error);
            return false;
        }
    }
    async completeChallenge(userId, challenge, context) {
        try {
            const userChallenges = await this.database.getUserChallenges(userId);
            const activeChallenges = (userChallenges?.activeChallenges ?? [])
                .filter(id => id !== challenge.id);
            const completedChallenges = [
                ...(userChallenges?.completedChallenges ?? []),
                challenge.id,
            ];
            await this.database.updateUserChallenges(userId, {
                activeChallenges,
                completedChallenges,
            });
            // Award points
            await this.database.awardPoints(userId, {
                points: challenge.rewards.points,
                reason: `Challenge completed: ${challenge.name}`,
                source: 'challenge',
                courseId: context?.courseId,
                chapterId: context?.chapterId,
                sectionId: context?.sectionId,
            });
            // Award any special badges
            if (challenge.rewards.badges) {
                for (const badgeId of challenge.rewards.badges) {
                    await this.database.unlockBadge(userId, {
                        badgeType: 'ACHIEVEMENT',
                        level: 2,
                        description: badgeId,
                        requirements: { challengeId: challenge.id },
                        courseId: context?.courseId,
                    });
                }
            }
            // Record completion
            await this.database.recordInteraction({
                userId,
                interactionType: 'CHALLENGE_COMPLETED',
                context: JSON.stringify({ challengeId: challenge.id, challenge }),
                result: JSON.stringify({ completed: true, rewards: challenge.rewards }),
                courseId: context?.courseId,
            });
        }
        catch (error) {
            console.error('Error completing challenge:', error);
        }
    }
    isStreakAction(action) {
        return STREAK_ACTIONS.includes(action);
    }
    getStreakType(action) {
        return STREAK_TYPE_MAP[action] ?? 'DAILY_INTERACTION';
    }
    getChallengeTimeframe(challenge) {
        const now = new Date();
        const start = new Date(now.getTime() - challenge.duration * 24 * 60 * 60 * 1000);
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
}
/**
 * Factory function to create an AchievementEngine instance
 */
export function createAchievementEngine(config) {
    return new AchievementEngine(config);
}
