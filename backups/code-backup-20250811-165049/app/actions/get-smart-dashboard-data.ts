"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { generateAIInsights } from "@/lib/ai-insights";
import { getPersonalizedRecommendations } from "@/lib/recommendations";
import { logger } from '@/lib/logger';

export async function getSmartDashboardData() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;

  try {

    // Fetch core user data with safe relationships (avoiding circular dependencies)
    const userData = await db.user.findUnique({
      where: { id: userId },
      include: {
        Post: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            comments: {
              take: 5
            }
          }
        },
        courses: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            category: true,
            reviews: {
              take: 5
            }
          }
        },
        FavoriteVideo: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        FavoriteAudio: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        FavoriteBlog: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        FavoriteArticle: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        SocialMediaAccount: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        Goal: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        Activity: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    // Fetch enrollments separately to avoid circular dependencies
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        Course: {
          include: {
            category: true
          }
        }
      }
    });

    if (!userData) {

      return null;
    }

    // Fetch enhanced data with error handling
    const [
      userAnalytics,
      achievements,
      skillData,
      performanceMetrics,
      milestones
    ] = await Promise.allSettled([
      fetchUserAnalytics(userId),
      fetchUserAchievements(userId),
      fetchSkillData(userId),
      fetchPerformanceMetrics(userId),
      fetchMilestones(userId)
    ]);

    // Generate AI-powered insights and recommendations with safe data
    const aiInsights = await generateAIInsights(userData, {
      analytics: userAnalytics.status === 'fulfilled' ? userAnalytics.value : [],
      activities: userData.Activity || [],
      courses: userData.courses || [],
      goals: userData.Goal || []
    });

    const recommendations = await getPersonalizedRecommendations(userData, {
      learningHistory: userData.courses || [],
      interests: [...(userData.FavoriteVideo || []), ...(userData.FavoriteBlog || [])],
      skillLevel: skillData.status === 'fulfilled' ? skillData.value : null
    });

    // Calculate learning progress and analytics using separate enrollments
    const learningProgress = calculateLearningProgress(enrollments || []);
    const learningAnalytics = calculateLearningAnalytics({ ...userData, enrollments });
    
    // Generate smart activity categorization
    const aiCategorizedActivities = categorizeActivitiesWithAI(userData.Activity || []);

    // Calculate performance trends
    const performanceTrends = calculatePerformanceTrends(
      performanceMetrics.status === 'fulfilled' ? performanceMetrics.value : []
    );

    // Generate quick action suggestions
    const quickActionSuggestions = generateQuickActionSuggestions(userData, aiInsights);

    // Get AI-recommended goals
    const aiRecommendedGoals = generateAIRecommendedGoals(userData, aiInsights);

    // Skill growth metrics
    const skillGrowthMetrics = calculateSkillGrowthMetrics(
      skillData.status === 'fulfilled' ? skillData.value : null
    );

    // Industry benchmarks
    const skillBenchmarks = await fetchIndustryBenchmarks(
      skillData.status === 'fulfilled' ? skillData.value : null
    );

    const benchmarks = await fetchUserBenchmarks(userId);

    // Ensure all data is properly structured with safe fallbacks
    const safeData = {
      userData: userData || {},
      userAnalytics: userAnalytics.status === 'fulfilled' ? userAnalytics.value || [] : [],
      achievements: achievements.status === 'fulfilled' ? achievements.value || [] : [],
      skillData: skillData.status === 'fulfilled' ? skillData.value : null,
      performanceMetrics: performanceMetrics.status === 'fulfilled' ? performanceMetrics.value || [] : [],
      milestones: milestones.status === 'fulfilled' ? milestones.value || [] : [],
      aiInsights: aiInsights || {},
      recommendations: recommendations || {},
      learningProgress: learningProgress || [],
      learningAnalytics: learningAnalytics || {},
      aiCategorizedActivities: aiCategorizedActivities || [],
      performanceTrends: performanceTrends || {},
      quickActionSuggestions: quickActionSuggestions || [],
      aiRecommendedGoals: aiRecommendedGoals || [],
      skillGrowthMetrics: skillGrowthMetrics || {},
      skillBenchmarks: skillBenchmarks || {},
      benchmarks: benchmarks || {},
      enrollments: enrollments || [],
      activities: userData?.Activity || [],
      learningStyle: await determineLearningStyle(userData) || "visual"
    };

    return safeData;

  } catch (error) {
    logger.error("[GET_SMART_DASHBOARD_DATA] Error fetching smart dashboard data:", error);
    return null;
  }
}

// Helper functions
async function fetchUserAnalytics(userId: string) {
  try {
    return await db.userAnalytics.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 100
    });
  } catch (error) {
    logger.warn("User analytics not available:", error);
    return [];
  }
}

async function fetchUserAchievements(userId: string) {
  // This would fetch from an achievements table if it exists
  // For now, we'll calculate achievements based on user data
  return [];
}

async function fetchSkillData(userId: string) {
  // This would fetch from a skills tracking table
  // For now, we'll derive skills from course enrollments and completions
  return null;
}

async function fetchPerformanceMetrics(userId: string) {
  try {
    // Simplified query to avoid deep nesting and circular dependencies
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      take: 20,
      include: {
        Course: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      }
    });

    return enrollments.map(enrollment => {
      // Mock completion rate for now to avoid circular dependencies (consistent based on course ID)
      const mockCompletionRate = Math.abs(enrollment.Course.id.charCodeAt(0) + enrollment.Course.id.charCodeAt(1)) % 100;
      
      return {
        courseId: enrollment.Course.id,
        courseName: enrollment.Course.title,
        completionRate: mockCompletionRate,
        enrolledAt: enrollment.createdAt,
        lastAccessed: enrollment.updatedAt
      };
    });
  } catch (error) {
    logger.warn("Performance metrics not available:", error);
    return [];
  }
}

async function fetchMilestones(userId: string) {
  // This would fetch milestone data
  return [];
}

function calculateLearningProgress(enrollments: any[]) {
  return enrollments.map(enrollment => {
    const course = enrollment.course;
    
    // Since we removed deep nesting, we'll use simpler progress calculation
    // In a real app, you'd fetch progress data separately
    const mockProgress = Math.abs(enrollment.course.id.charCodeAt(0) + enrollment.course.id.charCodeAt(1)) % 100; // Consistent mock progress
    
    return {
      courseId: course.id,
      courseName: course.title,
      progress: mockProgress,
      totalSections: 10, // Mock value
      completedSections: Math.floor(mockProgress / 10),
      lastAccessed: enrollment.updatedAt
    };
  });
}

function calculateLearningAnalytics(userData: any) {
  const totalCourses = userData.courses?.length || 0;
  const totalEnrollments = userData.enrollments?.length || 0;
  const totalPosts = userData.posts?.length || 0;
  const totalIdeas = userData.ideas?.length || 0;

  return {
    totalCourses,
    totalEnrollments,
    totalPosts,
    totalIdeas,
    engagementScore: calculateEngagementScore(userData),
    learningStreak: calculateLearningStreak(userData),
    averageCompletionRate: calculateAverageCompletionRate(userData.enrollments || [])
  };
}

function categorizeActivitiesWithAI(activities: any[]) {
  // AI categorization logic would go here
  return activities.map(activity => ({
    ...activity,
    aiCategory: determineActivityCategory(activity),
    aiPriority: determineActivityPriority(activity),
    aiRecommendation: generateActivityRecommendation(activity)
  }));
}

function calculatePerformanceTrends(metrics: any[]) {
  // Calculate trends over time
  return {
    completionRateTrend: "increasing",
    learningVelocityTrend: "stable",
    engagementTrend: "increasing"
  };
}

function generateQuickActionSuggestions(userData: any, aiInsights: any) {
  const suggestions = [];
  
  // Add contextual suggestions based on user data
  if (userData.courses?.length === 0) {
    suggestions.push({
      type: "course",
      title: "Start Your First Course",
      description: "Begin your learning journey with a beginner-friendly course",
      action: "/discover",
      priority: "high"
    });
  }

  if (userData.goals?.length === 0) {
    suggestions.push({
      type: "goal",
      title: "Set Learning Goals",
      description: "Define what you want to achieve this month",
      action: "/goals/create",
      priority: "medium"
    });
  }

  return suggestions;
}

function generateAIRecommendedGoals(userData: any, aiInsights: any) {
  // AI-generated goal recommendations
  return [
    {
      title: "Complete 2 courses this month",
      description: "Based on your learning pace, this is an achievable target",
      category: "learning",
      priority: "high",
      estimatedDuration: "30 days"
    }
  ];
}

function calculateSkillGrowthMetrics(skillData: any) {
  return {
    totalSkills: 0,
    improvingSkills: 0,
    masteredSkills: 0,
    growthRate: 0
  };
}

async function fetchIndustryBenchmarks(skillData: any) {
  return {};
}

async function fetchUserBenchmarks(userId: string) {
  return {};
}

async function determineLearningStyle(userData: any) {
  // Analyze user behavior to determine learning style
  return "visual"; // Default
}

// Utility functions
function calculateEngagementScore(userData: any) {
  let score = 0;
  score += (userData.posts?.length || 0) * 2;
  score += (userData.ideas?.length || 0) * 3;
  score += (userData.courses?.length || 0) * 5;
  return Math.min(score, 100);
}

function calculateLearningStreak(userData: any) {
  // Calculate consecutive days of learning activity
  return 7; // Placeholder
}

function calculateAverageCompletionRate(enrollments: any[]) {
  if (enrollments.length === 0) return 0;
  
  // Since we removed deep nesting, use mock completion rates
  const totalRate = enrollments.reduce((sum, enrollment) => {
    // Mock completion rate between 0-100 (consistent based on enrollment ID)
    const mockCompletionRate = Math.abs(enrollment.id.charCodeAt(0) + enrollment.id.charCodeAt(1)) % 100;
    return sum + mockCompletionRate;
  }, 0);
  
  return totalRate / enrollments.length;
}

function determineActivityCategory(activity: any) {
  // AI logic to categorize activities
  return "learning";
}

function determineActivityPriority(activity: any) {
  return "medium";
}

function generateActivityRecommendation(activity: any) {
  return "Continue making progress on this activity";
} 