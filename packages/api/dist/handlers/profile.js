/**
 * @sam-ai/api - Profile Handler
 * Handles user profile and learning preference requests
 */
/**
 * Create success response
 */
function createSuccessResponse(data, status = 200) {
    return {
        status,
        body: {
            success: true,
            data,
        },
        headers: {
            'Content-Type': 'application/json',
        },
    };
}
/**
 * Create error response
 */
function createErrorResponse(status, code, message, details) {
    return {
        status,
        body: {
            success: false,
            error: {
                code,
                message,
                details,
            },
        },
        headers: {
            'Content-Type': 'application/json',
        },
    };
}
/**
 * Default profile data
 */
function getDefaultProfile(userId, handlerContext) {
    return {
        id: userId,
        name: handlerContext?.user?.name ?? 'User',
        role: handlerContext?.user?.role ?? 'student',
        preferences: {
            learningStyle: 'visual',
            tone: 'friendly',
            difficulty: 'medium',
        },
        progress: {
            coursesCompleted: 0,
            totalTimeSpent: 0,
            averageScore: 0,
        },
    };
}
/**
 * Convert storage data to profile format
 */
function storageToProfileFormat(userId, stored, handlerContext) {
    return {
        id: userId,
        name: handlerContext?.user?.name ?? 'User',
        role: handlerContext?.user?.role ?? 'student',
        preferences: {
            learningStyle: stored.learningStyle ?? 'visual',
            tone: stored.preferredTone ?? 'friendly',
            difficulty: 'medium', // Not in LearningProfileData
        },
        progress: {
            coursesCompleted: 0, // Not in LearningProfileData
            totalTimeSpent: 0, // Not in LearningProfileData
            averageScore: 0, // Not in LearningProfileData
        },
    };
}
/**
 * Create profile handler
 */
export function createProfileHandler(config) {
    const storage = config.storage;
    return async (request, handlerContext) => {
        const body = request.body;
        // Validate user ID
        if (!body.userId) {
            return createErrorResponse(400, 'INVALID_REQUEST', 'User ID is required');
        }
        try {
            switch (body.action) {
                case 'get':
                    return await handleGet(body.userId, handlerContext, storage);
                case 'update':
                    return await handleUpdate(body.userId, body.payload, handlerContext, storage);
                case 'get-learning-style':
                    return await handleGetLearningStyle(body.userId, storage);
                case 'get-progress':
                    return await handleGetProgress(body.userId, storage);
                default:
                    return createErrorResponse(400, 'INVALID_ACTION', `Unknown action: ${body.action}`);
            }
        }
        catch (error) {
            console.error('[SAM Profile Handler] Error:', error);
            if (error instanceof Error) {
                return createErrorResponse(500, 'PROFILE_ERROR', process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'An error occurred processing profile request');
            }
            return createErrorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
        }
    };
}
/**
 * Handle get profile
 */
async function handleGet(userId, handlerContext, storage) {
    let profile = getDefaultProfile(userId, handlerContext);
    let analytics;
    if (storage?.getLearningProfile) {
        const stored = await storage.getLearningProfile(userId);
        if (stored) {
            profile = storageToProfileFormat(userId, stored, handlerContext);
            analytics = {
                strongAreas: stored.strengths ?? [],
                weakAreas: stored.weaknesses ?? [],
                recommendations: generateLearningStyleRecommendations(stored.learningStyle ?? 'visual'),
            };
        }
    }
    const response = {
        profile,
        analytics,
    };
    return createSuccessResponse(response);
}
/**
 * Handle update profile
 */
async function handleUpdate(userId, payload, handlerContext, storage) {
    // Get current profile
    let profile = getDefaultProfile(userId, handlerContext);
    if (storage?.getLearningProfile) {
        const stored = await storage.getLearningProfile(userId);
        if (stored) {
            profile = storageToProfileFormat(userId, stored, handlerContext);
        }
    }
    // Apply updates
    if (payload?.preferences) {
        profile.preferences = {
            ...profile.preferences,
            ...payload.preferences,
        };
    }
    if (payload?.learningStyle) {
        profile.preferences.learningStyle = payload.learningStyle;
    }
    // Save if storage available
    if (storage?.updateLearningProfile) {
        await storage.updateLearningProfile(userId, {
            learningStyle: profile.preferences.learningStyle,
            preferredTone: profile.preferences.tone,
        });
    }
    const response = {
        profile,
    };
    return createSuccessResponse(response);
}
/**
 * Handle get learning style
 */
async function handleGetLearningStyle(userId, storage) {
    let learningStyle = 'visual';
    let details = {};
    if (storage?.getLearningProfile) {
        const stored = await storage.getLearningProfile(userId);
        if (stored) {
            learningStyle = stored.learningStyle ?? 'visual';
            details = {
                dominantStyle: stored.learningStyle ?? 'visual',
                strongAreas: stored.strengths ?? [],
                weakAreas: stored.weaknesses ?? [],
                recommendations: generateLearningStyleRecommendations(learningStyle),
            };
        }
    }
    return createSuccessResponse({
        learningStyle,
        details,
    });
}
/**
 * Handle get progress
 */
async function handleGetProgress(userId, storage) {
    const progress = {
        coursesCompleted: 0,
        totalTimeSpent: 0,
        averageScore: 0,
        currentStreak: 0,
        totalPoints: 0,
    };
    // Get gamification data for streak and points
    if (storage?.getGamificationData) {
        const gamification = await storage.getGamificationData(userId);
        if (gamification) {
            progress.currentStreak = gamification.currentStreak;
            progress.totalPoints = gamification.points;
        }
    }
    return createSuccessResponse({
        progress,
        insights: generateProgressInsights(progress),
    });
}
/**
 * Generate learning style recommendations
 */
function generateLearningStyleRecommendations(style) {
    const recommendations = {
        visual: [
            'Use diagrams and flowcharts to understand concepts',
            'Color-code your notes for better retention',
            'Watch video tutorials alongside reading materials',
        ],
        auditory: [
            'Listen to podcasts and audio explanations',
            'Read content aloud to improve retention',
            'Participate in group discussions',
        ],
        kinesthetic: [
            'Practice with hands-on exercises',
            'Take breaks to move around while studying',
            'Use interactive simulations when available',
        ],
        reading: [
            'Take detailed written notes',
            'Create summaries of key concepts',
            'Read multiple sources on the same topic',
        ],
    };
    return recommendations[style] ?? recommendations.visual ?? [];
}
/**
 * Generate progress insights
 */
function generateProgressInsights(progress) {
    const insights = [];
    if (progress.coursesCompleted > 0) {
        insights.push(`You have completed ${progress.coursesCompleted} course${progress.coursesCompleted > 1 ? 's' : ''}`);
    }
    if (progress.averageScore >= 80) {
        insights.push('Great job! Your average score is above 80%');
    }
    else if (progress.averageScore >= 60) {
        insights.push('Good progress! Consider reviewing challenging topics');
    }
    if (progress.currentStreak >= 7) {
        insights.push(`Amazing ${progress.currentStreak}-day learning streak!`);
    }
    else if (progress.currentStreak >= 3) {
        insights.push(`Nice ${progress.currentStreak}-day streak! Keep it going!`);
    }
    if (progress.totalTimeSpent > 3600) {
        const hours = Math.floor(progress.totalTimeSpent / 3600);
        insights.push(`You have invested ${hours} hour${hours > 1 ? 's' : ''} in learning`);
    }
    return insights;
}
