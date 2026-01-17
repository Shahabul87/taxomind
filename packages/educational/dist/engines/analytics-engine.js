/**
 * @sam-ai/educational - Analytics Engine
 *
 * Comprehensive analytics engine for tracking learning metrics, content insights,
 * behavior patterns, and personalized insights.
 */
export class AnalyticsEngine {
    config;
    database;
    constructor(config) {
        this.config = config;
        this.database = config.database;
    }
    /**
     * Get comprehensive analytics for a user
     */
    async getComprehensiveAnalytics(userId, options) {
        if (!this.database) {
            return this.getDefaultAnalytics();
        }
        // Get basic stats
        const userStats = await this.database.getUserStats(userId, options?.courseId);
        // Get interactions for analysis
        const interactions = await this.database.getInteractions({
            userId,
            courseId: options?.courseId,
            startDate: options?.dateRange?.start,
            endDate: options?.dateRange?.end,
            limit: 1000,
        });
        // Get analytics records
        const analyticsRecords = await this.database.getAnalyticsRecords({
            userId,
            courseId: options?.courseId,
            startDate: options?.dateRange?.start,
            endDate: options?.dateRange?.end,
        });
        // Calculate all metrics
        const metrics = this.calculateLearningMetrics(interactions, analyticsRecords);
        const contentInsights = await this.calculateContentInsights(userId, interactions, options?.courseId);
        const behaviorPatterns = this.analyzeBehaviorPatterns(interactions);
        const personalizedInsights = this.generatePersonalizedInsights(metrics, contentInsights, behaviorPatterns, userStats);
        const trends = await this.calculateTrends(userId, options?.courseId);
        return {
            metrics,
            contentInsights,
            behaviorPatterns,
            personalizedInsights,
            trends,
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
            sectionId: sessionData.sectionId,
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
                mostActiveTime: 'N/A',
                preferredFeatures: [],
                contentQuality: 0,
                learningVelocity: 0,
                engagementScore: 0,
            },
            contentInsights: {
                mostEditedSections: [],
                averageContentLength: 0,
                aiAssistanceRate: 0,
                suggestionAcceptanceRate: 0,
                contentCompletionRate: 0,
                timeToComplete: 0,
            },
            behaviorPatterns: {
                workingHours: [],
                weeklyPattern: [],
                featureUsagePattern: {},
                learningPathProgression: [],
            },
            personalizedInsights: {
                strengths: [],
                areasForImprovement: [],
                recommendations: [],
                predictedNextMilestone: 'Get started with your first interaction',
                estimatedTimeToGoal: 0,
            },
            trends: {
                pointsTrend: [],
                engagementTrend: [],
                productivityTrend: [],
            },
        };
    }
    calculateLearningMetrics(interactions, analyticsRecords) {
        const totalInteractions = interactions.length;
        // Calculate average session duration from analytics
        const avgSessionDuration = analyticsRecords.length > 0
            ? analyticsRecords.reduce((sum, record) => sum + (record.responseTime || 0), 0) /
                analyticsRecords.length
            : 0;
        // Find most active hour
        const hourCounts = {};
        interactions.forEach((interaction) => {
            const hour = new Date(interaction.createdAt).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        const mostActiveHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || '0';
        const mostActiveTime = `${mostActiveHour}:00 - ${parseInt(mostActiveHour) + 1}:00`;
        // Calculate preferred features
        const featureCounts = {};
        interactions.forEach((interaction) => {
            const type = interaction.interactionType;
            featureCounts[type] = (featureCounts[type] || 0) + 1;
        });
        const preferredFeatures = Object.entries(featureCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([feature]) => feature);
        // Calculate content quality
        const contentQuality = this.calculateContentQuality(analyticsRecords);
        // Calculate learning velocity
        const daySpan = interactions.length > 0
            ? Math.max(1, Math.ceil((new Date().getTime() -
                new Date(interactions[interactions.length - 1].createdAt).getTime()) /
                (1000 * 60 * 60 * 24)))
            : 1;
        const learningVelocity = totalInteractions / daySpan;
        // Calculate engagement score
        const engagementScore = this.calculateEngagementScore(interactions, analyticsRecords);
        return {
            totalInteractions,
            averageSessionDuration: avgSessionDuration,
            mostActiveTime,
            preferredFeatures,
            contentQuality,
            learningVelocity,
            engagementScore,
        };
    }
    async calculateContentInsights(userId, interactions, courseId) {
        // Calculate most edited sections
        const sectionEdits = {};
        interactions.forEach((interaction) => {
            if (interaction.sectionId) {
                sectionEdits[interaction.sectionId] = (sectionEdits[interaction.sectionId] || 0) + 1;
            }
        });
        const mostEditedSections = Object.entries(sectionEdits)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([sectionId, editCount]) => ({ sectionId, editCount }));
        // Calculate average content length
        const contentInteractions = interactions.filter((i) => ['CONTENT_GENERATE', 'FORM_SUBMIT', 'QUICK_ACTION'].includes(i.interactionType));
        const contentLengths = contentInteractions
            .filter((i) => {
            if (typeof i.context === 'object' && i.context !== null && 'contentLength' in i.context) {
                return typeof i.context.contentLength === 'number';
            }
            return false;
        })
            .map((i) => {
            const context = i.context;
            return context.contentLength;
        });
        const averageContentLength = contentLengths.length > 0
            ? contentLengths.reduce((sum, len) => sum + len, 0) / contentLengths.length
            : 0;
        // Calculate AI assistance rate
        const totalContentActions = interactions.filter((i) => i.interactionType.includes('CONTENT') || i.interactionType === 'FORM_SUBMIT').length;
        const aiAssistedActions = interactions.filter((i) => ['CONTENT_GENERATE', 'LEARNING_ASSISTANCE', 'QUICK_ACTION'].includes(i.interactionType)).length;
        const aiAssistanceRate = totalContentActions > 0 ? (aiAssistedActions / totalContentActions) * 100 : 0;
        // Calculate suggestion acceptance rate
        const suggestionsGiven = interactions.filter((i) => i.interactionType === 'LEARNING_ASSISTANCE').length;
        const suggestionsApplied = interactions.filter((i) => i.interactionType === 'QUICK_ACTION').length;
        const suggestionAcceptanceRate = suggestionsGiven > 0 ? (suggestionsApplied / suggestionsGiven) * 100 : 0;
        // Get content completion data from database
        let contentCompletionRate = 0;
        let timeToComplete = 0;
        if (this.database) {
            const allCourses = await this.database.getCourses({
                userId,
                courseId,
            });
            const publishedCourses = await this.database.getCourses({
                userId,
                courseId,
                isPublished: true,
            });
            contentCompletionRate =
                allCourses.length > 0 ? (publishedCourses.length / allCourses.length) * 100 : 0;
            // Calculate average time to complete
            const completionTimes = publishedCourses.map((course) => (course.updatedAt.getTime() - course.createdAt.getTime()) / (1000 * 60 * 60));
            timeToComplete =
                completionTimes.length > 0
                    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
                    : 0;
        }
        return {
            mostEditedSections,
            averageContentLength,
            aiAssistanceRate,
            suggestionAcceptanceRate,
            contentCompletionRate,
            timeToComplete,
        };
    }
    analyzeBehaviorPatterns(interactions) {
        // Working hours analysis
        const hourlyActivity = {};
        for (let i = 0; i < 24; i++) {
            hourlyActivity[i] = 0;
        }
        interactions.forEach((interaction) => {
            const hour = new Date(interaction.createdAt).getHours();
            hourlyActivity[hour]++;
        });
        const workingHours = Object.entries(hourlyActivity)
            .map(([hour, frequency]) => ({ hour: parseInt(hour), frequency }))
            .sort((a, b) => a.hour - b.hour);
        // Weekly pattern analysis
        const daysOfWeek = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
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
            activity: weeklyActivity[day],
        }));
        // Feature usage pattern
        const featureUsage = {};
        interactions.forEach((interaction) => {
            const feature = this.mapInteractionToFeature(interaction.interactionType);
            featureUsage[feature] = (featureUsage[feature] || 0) + 1;
        });
        // Learning path progression
        const milestones = this.extractMilestones(interactions);
        const learningPathProgression = milestones.map((m) => ({
            date: m.date.toISOString().split('T')[0],
            milestone: m.description,
        }));
        return {
            workingHours,
            weeklyPattern,
            featureUsagePattern: featureUsage,
            learningPathProgression,
        };
    }
    generatePersonalizedInsights(metrics, contentInsights, behaviorPatterns, userStats) {
        const strengths = [];
        const areasForImprovement = [];
        const recommendations = [];
        // Analyze strengths
        if (metrics.engagementScore > 80) {
            strengths.push('Highly engaged learner with consistent activity');
        }
        if (contentInsights.aiAssistanceRate > 70) {
            strengths.push('Excellent use of AI assistance for content creation');
        }
        if (metrics.learningVelocity > 10) {
            strengths.push('Fast-paced learner with high productivity');
        }
        if (contentInsights.contentCompletionRate > 80) {
            strengths.push('Strong course completion rate');
        }
        if (userStats.streaks && userStats.streaks.length > 0 && userStats.streaks[0].currentStreak > 7) {
            strengths.push('Maintaining excellent learning consistency');
        }
        // Identify areas for improvement
        if (metrics.engagementScore < 50) {
            areasForImprovement.push('Increase daily engagement with the platform');
            recommendations.push('Try setting a daily reminder to work on your courses');
        }
        if (contentInsights.suggestionAcceptanceRate < 30) {
            areasForImprovement.push('Consider applying more AI suggestions');
            recommendations.push('AI suggestions can significantly improve content quality');
        }
        if (contentInsights.averageContentLength < 200) {
            areasForImprovement.push('Create more detailed content');
            recommendations.push('Use the "Expand" feature to add more depth to your content');
        }
        if (behaviorPatterns.workingHours.filter((h) => h.frequency > 0).length < 3) {
            areasForImprovement.push('Spread learning across more hours');
            recommendations.push('Distributed practice leads to better retention');
        }
        // Generate recommendations based on patterns
        const peakHour = [...behaviorPatterns.workingHours].sort((a, b) => b.frequency - a.frequency)[0];
        if (peakHour) {
            recommendations.push(`Your peak productivity is at ${peakHour.hour}:00 - schedule important tasks then`);
        }
        const featureEntries = Object.entries(behaviorPatterns.featureUsagePattern);
        if (featureEntries.length > 0) {
            const leastUsedFeature = featureEntries.sort(([, a], [, b]) => a - b)[0];
            if (leastUsedFeature) {
                recommendations.push(`Try using the ${leastUsedFeature[0]} feature more often`);
            }
        }
        // Predict next milestone
        const predictedNextMilestone = this.predictNextMilestone(userStats, metrics);
        // Estimate time to goal
        const estimatedTimeToGoal = this.estimateTimeToNextLevel(userStats.totalPoints ?? userStats.points, metrics.learningVelocity);
        return {
            strengths,
            areasForImprovement,
            recommendations,
            predictedNextMilestone,
            estimatedTimeToGoal,
        };
    }
    async calculateTrends(userId, courseId) {
        if (!this.database) {
            return {
                pointsTrend: [],
                engagementTrend: [],
                productivityTrend: [],
            };
        }
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // Get daily points
        const pointsHistory = await this.database.getPointsHistory({
            userId,
            courseId,
            startDate: thirtyDaysAgo,
        });
        // Group points by date
        const pointsByDate = {};
        pointsHistory.forEach((point) => {
            const date = point.awardedAt.toISOString().split('T')[0];
            pointsByDate[date] = (pointsByDate[date] || 0) + point.points;
        });
        const pointsTrend = Object.entries(pointsByDate).map(([date, points]) => ({
            date,
            points,
        }));
        // Get engagement trend
        const interactions = await this.database.getInteractions({
            userId,
            courseId,
            startDate: thirtyDaysAgo,
        });
        const interactionsByDate = {};
        interactions.forEach((interaction) => {
            const date = interaction.createdAt.toISOString().split('T')[0];
            interactionsByDate[date] = (interactionsByDate[date] || 0) + 1;
        });
        const engagementTrend = Object.entries(interactionsByDate).map(([date, count]) => ({
            date,
            score: Math.min(100, count * 10),
        }));
        // Get productivity trend
        const productivityInteractions = interactions.filter((i) => ['CONTENT_GENERATE', 'FORM_SUBMIT', 'QUICK_ACTION'].includes(i.interactionType));
        const productivityByDate = {};
        productivityInteractions.forEach((interaction) => {
            const date = interaction.createdAt.toISOString().split('T')[0];
            productivityByDate[date] = (productivityByDate[date] || 0) + 1;
        });
        const productivityTrend = Object.entries(productivityByDate).map(([date, count]) => ({
            date,
            itemsCompleted: count,
        }));
        return {
            pointsTrend,
            engagementTrend,
            productivityTrend,
        };
    }
    // Helper methods
    calculateContentQuality(analyticsRecords) {
        if (analyticsRecords.length === 0)
            return 0;
        const recordsWithSatisfaction = analyticsRecords.filter((r) => r.satisfactionScore !== null && r.satisfactionScore !== undefined);
        const recordsWithCompletion = analyticsRecords.filter((r) => r.completionRate !== null && r.completionRate !== undefined);
        const avgSatisfaction = recordsWithSatisfaction.length > 0
            ? recordsWithSatisfaction.reduce((sum, r) => sum + (r.satisfactionScore || 0), 0) /
                recordsWithSatisfaction.length
            : 0;
        const avgCompletion = recordsWithCompletion.length > 0
            ? recordsWithCompletion.reduce((sum, r) => sum + (r.completionRate || 0), 0) /
                recordsWithCompletion.length
            : 0;
        return (avgSatisfaction * 0.6 + avgCompletion * 0.4) / 10;
    }
    calculateEngagementScore(interactions, analyticsRecords) {
        const recencyScore = this.calculateRecencyScore(interactions);
        const frequencyScore = this.calculateFrequencyScore(interactions);
        const diversityScore = this.calculateDiversityScore(interactions);
        const recordsWithCompletion = analyticsRecords.filter((r) => r.completionRate !== null && r.completionRate !== undefined);
        const completionScore = recordsWithCompletion.length > 0
            ? recordsWithCompletion.reduce((sum, r) => sum + (r.completionRate || 0), 0) /
                recordsWithCompletion.length
            : 0;
        return recencyScore * 0.3 + frequencyScore * 0.3 + diversityScore * 0.2 + completionScore * 0.2;
    }
    calculateRecencyScore(interactions) {
        if (interactions.length === 0)
            return 0;
        const mostRecent = new Date(interactions[0].createdAt);
        const daysSinceLastInteraction = Math.floor((new Date().getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLastInteraction === 0)
            return 100;
        if (daysSinceLastInteraction <= 1)
            return 90;
        if (daysSinceLastInteraction <= 3)
            return 70;
        if (daysSinceLastInteraction <= 7)
            return 50;
        if (daysSinceLastInteraction <= 14)
            return 30;
        return 10;
    }
    calculateFrequencyScore(interactions) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentInteractions = interactions.filter((i) => new Date(i.createdAt) > thirtyDaysAgo).length;
        return Math.min(100, (recentInteractions / 30) * 20);
    }
    calculateDiversityScore(interactions) {
        const uniqueTypes = new Set(interactions.map((i) => i.interactionType)).size;
        const possibleTypes = 15; // Approximate number of interaction types
        return (uniqueTypes / possibleTypes) * 100;
    }
    mapInteractionToFeature(interactionType) {
        const featureMap = {
            CONTENT_GENERATE: 'AI Content Generation',
            LEARNING_ASSISTANCE: 'Learning Assistance',
            QUICK_ACTION: 'Quick Actions',
            FORM_SUBMIT: 'Form Submission',
            CHAT_MESSAGE: 'Chat System',
            FORM_POPULATE: 'Form Population',
            NAVIGATION: 'Navigation',
            ANALYTICS_VIEW: 'Analytics',
            GAMIFICATION_ACTION: 'Gamification',
        };
        return featureMap[interactionType] || 'Other';
    }
    extractMilestones(interactions) {
        const milestones = [];
        // Find first interactions of each type
        const firstOfType = {};
        interactions.forEach((interaction) => {
            if (!firstOfType[interaction.interactionType]) {
                firstOfType[interaction.interactionType] = new Date(interaction.createdAt);
            }
        });
        // Convert to milestones
        Object.entries(firstOfType).forEach(([type, date]) => {
            milestones.push({
                date,
                description: `First ${this.mapInteractionToFeature(type)}`,
            });
        });
        return milestones.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    predictNextMilestone(userStats, metrics) {
        const totalPoints = userStats.totalPoints ?? userStats.points;
        const velocity = metrics.learningVelocity;
        if (totalPoints < 100)
            return 'Reach 100 points - SAM Beginner';
        if (totalPoints < 500)
            return 'Reach 500 points - SAM Enthusiast';
        if (totalPoints < 1000)
            return 'Reach 1000 points - SAM Expert';
        if (totalPoints < 2500)
            return 'Reach 2500 points - SAM Master';
        if (velocity < 5)
            return 'Increase daily activity to 5+ interactions';
        if (userStats.badges < 5)
            return 'Unlock 5 achievement badges';
        return 'Continue your excellent progress!';
    }
    estimateTimeToNextLevel(currentPoints, velocity) {
        const levelThresholds = [100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, 15000];
        const nextThreshold = levelThresholds.find((t) => t > currentPoints) || 15000;
        const pointsNeeded = nextThreshold - currentPoints;
        const pointsPerDay = velocity * 5; // Rough estimate
        return Math.ceil(pointsNeeded / Math.max(1, pointsPerDay));
    }
}
/**
 * Factory function to create an AnalyticsEngine instance
 */
export function createAnalyticsEngine(config) {
    return new AnalyticsEngine(config);
}
