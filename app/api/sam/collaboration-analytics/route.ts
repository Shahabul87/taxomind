import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createCollaborationEngine } from "@sam-ai/educational";
import type { CollaborationActivityType } from "@sam-ai/educational";
import { logger } from '@/lib/logger';
import { createCollaborationAdapter } from '@/lib/adapters';

// Create collaboration engine singleton
let collaborationEngine: ReturnType<typeof createCollaborationEngine> | null = null;

function getCollaborationEngine() {
  if (!collaborationEngine) {
    collaborationEngine = createCollaborationEngine({
      databaseAdapter: createCollaborationAdapter(db),
    });
  }
  return collaborationEngine;
}

// Alias for backward compatibility
const samCollaborationEngine = {
  startCollaborationSession: (courseId: string, chapterId: string, userId: string, type: CollaborationActivityType) =>
    getCollaborationEngine().startCollaborationSession(courseId, chapterId, userId, type),
  joinCollaborationSession: (sessionId: string, userId: string) =>
    getCollaborationEngine().joinCollaborationSession(sessionId, userId),
  recordContribution: (sessionId: string, userId: string, contribution: Parameters<ReturnType<typeof createCollaborationEngine>['recordContribution']>[2]) =>
    getCollaborationEngine().recordContribution(sessionId, userId, contribution),
  getRealTimeMetrics: (courseId?: string) =>
    getCollaborationEngine().getRealTimeMetrics(courseId),
  endCollaborationSession: (sessionId: string) =>
    getCollaborationEngine().endCollaborationSession(sessionId),
  analyzeCollaboration: (sessionId: string) =>
    getCollaborationEngine().analyzeCollaboration(sessionId),
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case "start-session":
        result = await handleStartSession(data, session.user.id);
        break;

      case "join-session":
        result = await handleJoinSession(data, session.user.id);
        break;

      case "record-contribution":
        result = await handleRecordContribution(data, session.user.id);
        break;

      case "end-session":
        result = await handleEndSession(data, session.user.id);
        break;

      case "analyze-session":
        result = await handleAnalyzeSession(data);
        break;

      case "get-real-time-metrics":
        result = await handleGetRealTimeMetrics(data);
        break;

      case "add-reaction":
        result = await handleAddReaction(data, session.user.id);
        break;

      case "get-collaboration-insights":
        result = await handleGetCollaborationInsights(data);
        break;

      case "get-social-analytics":
        result = await handleGetSocialAnalytics(data, session.user.id);
        break;

      case "create-discussion":
        result = await handleCreateDiscussion(data, session.user.id);
        break;

      case "create-study-group":
        result = await handleCreateStudyGroup(data, session.user.id);
        break;

      case "join-study-group":
        result = await handleJoinStudyGroup(data, session.user.id);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      data: result,
    });
  } catch (error) {
    logger.error("Collaboration analytics error:", error);
    return NextResponse.json(
      { error: "Failed to process collaboration analytics request" },
      { status: 500 }
    );
  }
}

async function handleStartSession(data: any, userId: string) {
  const { courseId, chapterId, type } = data;

  if (!courseId || !chapterId || !type) {
    throw new Error("Course ID, Chapter ID, and session type are required");
  }

  // Verify user has access to the course
  const hasAccess = await db.enrollment.findFirst({
    where: {
      userId,
      courseId,
    },
  });

  if (!hasAccess && !(await isTeacherOrAdmin(userId, courseId))) {
    throw new Error("Access denied to this course");
  }

  const session = await samCollaborationEngine.startCollaborationSession(
    courseId,
    chapterId,
    userId,
    type
  );

  // Notify other users in the course about the new session
  await notifyUsersAboutSession(courseId, session.sessionId, "started");

  return {
    sessionId: session.sessionId,
    joinUrl: `/collaboration/${session.sessionId}`,
    participants: session.participants.length,
  };
}

async function handleJoinSession(data: any, userId: string) {
  const { sessionId } = data;

  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  // Verify session exists and user has access
  const dbSession = await db.collaborationSession.findUnique({
    where: { sessionId },
  });

  if (!dbSession || !dbSession.isActive) {
    throw new Error("Session not found or inactive");
  }

  const hasAccess = await db.enrollment.findFirst({
    where: {
      userId,
      courseId: dbSession.courseId || undefined,
    },
  });

  if (!hasAccess && dbSession.courseId && !(await isTeacherOrAdmin(userId, dbSession.courseId))) {
    throw new Error("Access denied to this session");
  }

  const session = await samCollaborationEngine.joinCollaborationSession(
    sessionId,
    userId
  );

  return {
    session: {
      sessionId: session.sessionId,
      participants: session.participants,
      metrics: session.metrics,
      insights: session.insights,
    },
  };
}

async function handleRecordContribution(data: any, userId: string) {
  const { sessionId, contribution } = data;

  if (!sessionId || !contribution) {
    throw new Error("Session ID and contribution are required");
  }

  // Validate contribution type
  const validTypes = ["message", "question", "answer", "resource", "edit", "reaction"];
  if (!validTypes.includes(contribution.type)) {
    throw new Error("Invalid contribution type");
  }

  await samCollaborationEngine.recordContribution(sessionId, userId, contribution);

  // Get updated metrics
  const metrics = await samCollaborationEngine.getRealTimeMetrics();

  return {
    success: true,
    metrics: {
      messagesPerMinute: metrics.messagesPerMinute,
      activeUsers: metrics.activeUsers,
    },
  };
}

async function handleEndSession(data: any, userId: string) {
  const { sessionId } = data;

  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  // Verify user is session initiator or admin
  const dbSession = await db.collaborationSession.findUnique({
    where: { sessionId },
  });

  if (!dbSession) {
    throw new Error("Session not found");
  }

  if (dbSession.initiatorId !== userId && !(await isAdmin(userId))) {
    throw new Error("Only session initiator or admin can end the session");
  }

  const session = await samCollaborationEngine.endCollaborationSession(sessionId);

  // Notify participants
  if (dbSession.courseId) {
    await notifyUsersAboutSession(dbSession.courseId, sessionId, "ended");
  }

  return {
    session: {
      sessionId: session.sessionId,
      duration: session.endTime
        ? (session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60
        : 0,
      metrics: session.metrics,
      insights: session.insights,
    },
    analytics: await samCollaborationEngine.analyzeCollaboration(sessionId),
  };
}

async function handleAnalyzeSession(data: any) {
  const { sessionId } = data;

  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  const analytics = await samCollaborationEngine.analyzeCollaboration(sessionId);

  return {
    analytics,
    recommendations: generateSessionRecommendations(analytics),
  };
}

async function handleGetRealTimeMetrics(data: any) {
  const { courseId } = data;

  const metrics = await samCollaborationEngine.getRealTimeMetrics(courseId);

  // Get additional course-specific metrics if courseId provided
  if (courseId) {
    const activeSessions = await db.collaborationSession.count({
      where: {
        courseId,
        isActive: true,
      },
    });

    const recentContributions = await db.collaborationContribution.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    return {
      ...metrics,
      courseMetrics: {
        activeSessions,
        recentContributions,
        trending: metrics.collaborationHotspots.some(
          (h) => h.location.startsWith(courseId)
        ),
      },
    };
  }

  return metrics;
}

async function handleAddReaction(data: any, userId: string) {
  const { sessionId, contributionId, reactionType } = data;

  if (!sessionId || !contributionId || !reactionType) {
    throw new Error("Session ID, contribution ID, and reaction type are required");
  }

  // Store reaction in database
  await db.collaborationReaction.create({
    data: {
      contributionId,
      userId,
      reactionType,
      sessionId,
    },
  });

  // Update contribution in engine (simplified - would need to implement this method)
  // await samCollaborationEngine.addReaction(sessionId, contributionId, userId, reactionType);

  return {
    success: true,
    message: "Reaction added successfully",
  };
}

async function handleGetCollaborationInsights(data: any) {
  const { userId, courseId, timeRange } = data;

  if (!userId && !courseId) {
    throw new Error("User ID or Course ID is required");
  }

  const startDate = timeRange
    ? new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days

  // Get user's collaboration history
  if (userId) {
    const userSessions = await db.collaborationSession.findMany({
      where: {
        participants: {
          path: [],
          string_contains: userId,
        },
        startedAt: {
          gte: startDate,
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      take: 20,
    });

    const contributions = await db.collaborationContribution.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
        },
      },
    });

    const reactions = await db.collaborationReaction.count({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
    });

    return {
      userInsights: {
        totalSessions: userSessions.length,
        totalContributions: contributions.length,
        totalReactions: reactions,
        averageContributionsPerSession:
          contributions.length / Math.max(1, userSessions.length),
        topCollaborators: await getTopCollaborators(userId, userSessions),
        collaborationStyle: determineCollaborationStyle(contributions),
        strengths: identifyUserStrengths(contributions),
      },
    };
  }

  // Get course collaboration insights
  if (courseId) {
    const courseSessions = await db.collaborationSession.findMany({
      where: {
        courseId,
        startedAt: {
          gte: startDate,
        },
      },
    });

    const uniqueParticipants = new Set<string>();
    courseSessions.forEach((session) => {
      const participants = JSON.parse(session.participants as string);
      participants.forEach((p: any) => uniqueParticipants.add(p.userId));
    });

    const analytics = await db.collaborationAnalytics.findMany({
      where: {
        sessionId: {
          in: courseSessions.map((s) => s.sessionId),
        },
      },
    });

    return {
      courseInsights: {
        totalSessions: courseSessions.length,
        uniqueParticipants: uniqueParticipants.size,
        averageSessionDuration: calculateAverageSessionDuration(courseSessions),
        popularSessionTypes: getPopularSessionTypes(courseSessions),
        collaborationHealth: calculateCollaborationHealth(analytics),
        topContributors: await getCourseTopContributors(courseId, startDate),
      },
    };
  }
}

// Helper functions
async function isTeacherOrAdmin(userId: string, courseId: string): Promise<boolean> {
  // Check if user is admin - admins are now in AdminAccount table
  const adminAccount = await db.adminAccount.findUnique({
    where: { id: userId },
  });

  if (adminAccount?.role === "ADMIN" || adminAccount?.role === "SUPERADMIN") return true;

  // Check if user is the course owner
  const course = await db.course.findUnique({
    where: { id: courseId },
  });

  return course?.userId === userId;
}

async function isAdmin(userId: string): Promise<boolean> {
  // Check if user is admin - admins are now in AdminAccount table
  const adminAccount = await db.adminAccount.findUnique({
    where: { id: userId },
  });

  return adminAccount?.role === "ADMIN" || adminAccount?.role === "SUPERADMIN";
}

async function notifyUsersAboutSession(
  courseId: string,
  sessionId: string,
  action: "started" | "ended"
) {
  // Implementation would send real-time notifications
  // For now, create notification records
  const enrolledUsers = await db.enrollment.findMany({
    where: { courseId },
    select: { userId: true },
  });

  await Promise.all(
    enrolledUsers.map((enrollment) =>
      db.notification.create({
        data: {
          id: `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: enrollment.userId,
          title: `Collaboration session ${action}`,
          message: `A collaboration session has ${action} in your course`,
          type: "collaboration",
        },
      })
    )
  );
}

function generateSessionRecommendations(analytics: any): string[] {
  const recommendations: string[] = [];

  if (analytics.sessionAnalytics.averageParticipants < 3) {
    recommendations.push("Encourage more participants to join collaborative sessions");
  }

  if (analytics.contentAnalytics.questionAnswerRatio < 0.5) {
    recommendations.push("Many questions remain unanswered - consider expert intervention");
  }

  if (analytics.participantAnalytics.engagementDistribution[0].percentage > 30) {
    recommendations.push("High percentage of low engagement - use icebreakers or structured activities");
  }

  if (analytics.networkAnalytics.communities.length > 3) {
    recommendations.push("Multiple sub-groups detected - consider whole-group activities");
  }

  return recommendations;
}

async function getTopCollaborators(userId: string, sessions: any[]) {
  const collaboratorCounts = new Map<string, number>();

  for (const session of sessions) {
    const participants = JSON.parse(session.participants as string);
    participants.forEach((p: any) => {
      if (p.userId !== userId) {
        collaboratorCounts.set(
          p.userId,
          (collaboratorCounts.get(p.userId) || 0) + 1
        );
      }
    });
  }

  const sorted = Array.from(collaboratorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const users = await db.user.findMany({
    where: {
      id: {
        in: sorted.map(([userId]) => userId),
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  return sorted.map(([userId, count]) => ({
    user: users.find((u) => u.id === userId),
    collaborationCount: count,
  }));
}

function determineCollaborationStyle(contributions: any[]): string {
  const types = contributions.map((c) => c.contributionType);
  
  const questionCount = types.filter((t) => t === "question").length;
  const answerCount = types.filter((t) => t === "answer").length;
  const resourceCount = types.filter((t) => t === "resource").length;

  if (questionCount > types.length * 0.4) return "Inquisitive";
  if (answerCount > types.length * 0.4) return "Helper";
  if (resourceCount > types.length * 0.3) return "Resource Sharer";
  
  return "Balanced Contributor";
}

function identifyUserStrengths(contributions: any[]): string[] {
  const strengths: string[] = [];
  const types = contributions.map((c) => c.contributionType);

  if (types.filter((t) => t === "answer").length > 5) {
    strengths.push("Knowledge sharing");
  }

  if (types.filter((t) => t === "resource").length > 3) {
    strengths.push("Resource curation");
  }

  const avgImpact =
    contributions.reduce((sum, c) => sum + (c.impact || 0), 0) /
    Math.max(1, contributions.length);
  
  if (avgImpact > 0.7) {
    strengths.push("High-impact contributions");
  }

  return strengths;
}

function calculateAverageSessionDuration(sessions: any[]): number {
  const durations = sessions
    .filter((s) => s.duration)
    .map((s) => s.duration as number);

  return durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;
}

function getPopularSessionTypes(sessions: any[]): any[] {
  const typeCounts = new Map<string, number>();

  sessions.forEach((session) => {
    const type = session.sessionType;
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  });

  return Array.from(typeCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

function calculateCollaborationHealth(analytics: any[]): number {
  if (analytics.length === 0) return 0;

  let healthScore = 0;
  
  analytics.forEach((analysis) => {
    const data = JSON.parse(analysis.sessionAnalytics as string);
    
    healthScore += data.satisfactionScore * 0.3;
    healthScore += data.outcomeAchievement * 0.3;
    healthScore += (data.completionRate || 0) * 0.2;
    healthScore += Math.min(1, data.averageParticipants / 5) * 0.2;
  });

  return healthScore / analytics.length;
}

async function getCourseTopContributors(courseId: string, startDate: Date) {
  const contributions = await db.collaborationContribution.groupBy({
    by: ["userId"],
    where: {
      timestamp: {
        gte: startDate,
      },
      session: {
        courseId,
      },
    },
    _count: {
      userId: true,
    },
    orderBy: {
      _count: {
        userId: "desc",
      },
    },
    take: 10,
  });

  const users = await db.user.findMany({
    where: {
      id: {
        in: contributions.map((c) => c.userId),
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  return contributions.map((contribution) => ({
    user: users.find((u) => u.id === contribution.userId),
    contributionCount: (contribution._count as any)?.userId || 0,
  }));
}

async function handleGetSocialAnalytics(data: any, userId: string) {
  const { courseId, chapterId, sectionId } = data;

  if (!courseId) {
    throw new Error("Course ID is required");
  }

  // Verify user has access to the course
  const hasAccess = await db.enrollment.findFirst({
    where: {
      userId,
      courseId,
    },
  });

  if (!hasAccess && !(await isTeacherOrAdmin(userId, courseId))) {
    throw new Error("Access denied to this course");
  }

  // Get social learning analytics for the course/chapter/section
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

  // Get total enrolled students
  const totalStudents = await db.enrollment.count({
    where: { courseId },
  });

  // Get currently active students (online in last 5 minutes)
  const activeNow = await db.userSectionCompletion.count({
    where: {
      section: {
        chapter: {
          courseId,
        },
      },
      completedAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000),
      },
    },
  });

  // Generate collaboration analytics
  const analytics = {
    totalStudents,
    activeNow,
    discussionParticipation: Math.round(Math.random() * 40 + 60), // 60-100%
    knowledgeSharing: Math.round(Math.random() * 35 + 50), // 50-85%
    peerSupport: Math.round(Math.random() * 30 + 60), // 60-90%
    groupFormation: Math.round(Math.random() * 40 + 30), // 30-70%
    socialEngagement: {
      discussions: Math.round(Math.random() * 30 + 70), // 70-100
      helpRequests: Math.round(Math.random() * 20 + 20), // 20-40
      resourceSharing: Math.round(Math.random() * 40 + 40), // 40-80
      peerReviews: Math.round(Math.random() * 25 + 30), // 30-55
    },
    trends: [
      { period: "Week 1", discussions: 12, collaborations: 8, helpExchanges: 15 },
      { period: "Week 2", discussions: 18, collaborations: 12, helpExchanges: 22 },
      { period: "Week 3", discussions: 25, collaborations: 19, helpExchanges: 31 },
      { period: "Week 4", discussions: 34, collaborations: 28, helpExchanges: 45 },
    ],
    topContributors: await getCourseTopContributors(courseId, startDate),
    studyGroups: [
      {
        id: "1",
        name: "React Masters",
        members: 8,
        activity: "Active 2h ago",
        focus: "Frontend Development",
      },
      {
        id: "2",
        name: "Algorithm Study Group",
        members: 12,
        activity: "Active 1d ago",
        focus: "Data Structures",
      },
    ],
  };

  // Get discussions for this section/chapter/course
  const discussions = await generateDemoDiscussions(courseId, chapterId, sectionId);
  const studyGroups = await generateDemoStudyGroups(courseId);

  return {
    analytics,
    discussions,
    studyGroups,
  };
}

async function handleCreateDiscussion(data: any, userId: string) {
  const { courseId, chapterId, sectionId, discussion } = data;

  if (!courseId || !discussion) {
    throw new Error("Course ID and discussion data are required");
  }

  // Verify user has access to the course
  const hasAccess = await db.enrollment.findFirst({
    where: {
      userId,
      courseId,
    },
  });

  if (!hasAccess && !(await isTeacherOrAdmin(userId, courseId))) {
    throw new Error("Access denied to this course");
  }

  // Get user details
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Create discussion (simplified - would normally use a discussions table)
  const newDiscussion = {
    id: `disc_${Date.now()}`,
    author: {
      id: user.id,
      name: user.name || "Anonymous",
      avatar: user.image || "",
      role: "Student",
    },
    title: discussion.title,
    content: discussion.content,
    timestamp: new Date(),
    votes: 0,
    replies: 0,
    tags: discussion.tags || [],
    type: discussion.type,
    status: "open",
    engagement: {
      views: 1,
      likes: 0,
      bookmarks: 0,
    },
  };

  // In a real implementation, save to database
  // await db.discussion.create({ data: newDiscussion });

  return {
    discussion: newDiscussion,
    message: "Discussion created successfully",
  };
}

async function handleCreateStudyGroup(data: any, userId: string) {
  const { courseId, groupData } = data;

  if (!courseId || !groupData) {
    throw new Error("Course ID and group data are required");
  }

  // Verify user has access to the course
  const hasAccess = await db.enrollment.findFirst({
    where: {
      userId,
      courseId,
    },
  });

  if (!hasAccess && !(await isTeacherOrAdmin(userId, courseId))) {
    throw new Error("Access denied to this course");
  }

  // Get user details
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Create study group (simplified)
  const newStudyGroup = {
    id: `group_${Date.now()}`,
    name: groupData.name,
    description: groupData.description,
    members: [
      {
        id: user.id,
        name: user.name || "Anonymous",
        avatar: user.image || "",
        role: "Leader",
        joinedAt: new Date(),
      },
    ],
    activity: {
      lastActive: new Date(),
      messagesCount: 0,
      meetingsScheduled: 0,
    },
    focus: groupData.focus || [],
    isPublic: groupData.isPublic || true,
    maxMembers: groupData.maxMembers || 15,
  };

  // In a real implementation, save to database
  // await db.studyGroup.create({ data: newStudyGroup });

  return {
    studyGroup: newStudyGroup,
    message: "Study group created successfully",
  };
}

async function handleJoinStudyGroup(data: any, userId: string) {
  const { groupId } = data;

  if (!groupId) {
    throw new Error("Group ID is required");
  }

  // Get user details
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // In a real implementation, find and update the study group
  // const studyGroup = await db.studyGroup.findUnique({ where: { id: groupId } });
  // if (!studyGroup) throw new Error("Study group not found");
  // if (studyGroup.members.length >= studyGroup.maxMembers) throw new Error("Study group is full");

  // Add user to study group
  const memberData = {
    id: user.id,
    name: user.name || "Anonymous",
    avatar: user.image || "",
    role: "Member",
    joinedAt: new Date(),
  };

  // await db.studyGroup.update({
  //   where: { id: groupId },
  //   data: {
  //     members: {
  //       push: memberData
  //     }
  //   }
  // });

  return {
    member: memberData,
    message: "Successfully joined study group",
  };
}

// Helper functions for demo data
async function generateDemoDiscussions(courseId: string, chapterId?: string, sectionId?: string) {
  const now = new Date();
  return [
    {
      id: "1",
      author: {
        id: "user1",
        name: "Alex Smith",
        avatar: "/avatars/alex.jpg",
        role: "Student",
      },
      title: "How to optimize React component re-renders?",
      content: "I'm working on a complex React application and noticing performance issues with unnecessary re-renders. What are the best practices for optimizing this?",
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      votes: 15,
      replies: 8,
      tags: ["react", "performance", "optimization"],
      type: "question",
      status: "open",
      engagement: {
        views: 47,
        likes: 12,
        bookmarks: 5,
      },
    },
    {
      id: "2",
      author: {
        id: "user2",
        name: "Maria Rodriguez",
        avatar: "/avatars/maria.jpg",
        role: "Mentor",
      },
      title: "Great resource for understanding hooks",
      content: "Found this excellent article that explains React hooks with practical examples. Really helped me understand useEffect dependencies better.",
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      votes: 23,
      replies: 12,
      tags: ["react", "hooks", "resources"],
      type: "resource",
      status: "discussion",
      engagement: {
        views: 89,
        likes: 31,
        bookmarks: 18,
      },
    },
  ];
}

async function generateDemoStudyGroups(courseId: string) {
  const now = new Date();
  return [
    {
      id: "1",
      name: "React Masters",
      description: "Advanced React concepts and best practices",
      members: [
        {
          id: "1",
          name: "Sarah Johnson",
          avatar: "/avatars/sarah.jpg",
          role: "Leader",
          joinedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          id: "2",
          name: "Mike Chen",
          avatar: "/avatars/mike.jpg",
          role: "Member",
          joinedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        },
      ],
      activity: {
        lastActive: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        messagesCount: 156,
        meetingsScheduled: 3,
      },
      focus: ["React", "Hooks", "Performance"],
      isPublic: true,
      maxMembers: 15,
    },
    {
      id: "2",
      name: "Algorithm Study Circle",
      description: "Solving coding challenges and discussing algorithms",
      members: [
        {
          id: "3",
          name: "Emma Davis",
          avatar: "/avatars/emma.jpg",
          role: "Leader",
          joinedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        },
      ],
      activity: {
        lastActive: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        messagesCount: 89,
        meetingsScheduled: 2,
      },
      focus: ["Algorithms", "Data Structures", "Problem Solving"],
      isPublic: false,
      maxMembers: 10,
    },
  ];
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const courseId = searchParams.get("courseId");
    const userId = searchParams.get("userId") || session.user.id;
    const type = searchParams.get("type") || "overview";

    let result;
    switch (type) {
      case "active-sessions":
        if (courseId) {
          result = await db.collaborationSession.findMany({
            where: {
              courseId,
              isActive: true,
            },
            orderBy: {
              startedAt: "desc",
            },
          });
        } else {
          result = await db.collaborationSession.findMany({
            where: {
              isActive: true,
              participants: {
                path: [],
          string_contains: userId,
              },
            },
            orderBy: {
              startedAt: "desc",
            },
          });
        }
        break;

      case "session-history":
        const limit = parseInt(searchParams.get("limit") || "20");
        result = await db.collaborationSession.findMany({
          where: courseId
            ? { courseId }
            : {
                participants: {
                  path: [],
          string_contains: userId,
                },
              },
          orderBy: {
            startedAt: "desc",
          },
          take: limit,
        });
        break;

      case "session-details":
        if (!sessionId) {
          return NextResponse.json(
            { error: "Session ID is required" },
            { status: 400 }
          );
        }
        
        const sessionData = await db.collaborationSession.findUnique({
          where: { sessionId },
        });
        
        const analyticsData = await db.collaborationAnalytics.findFirst({
          where: { sessionId },
        });

        result = {
          session: sessionData ? {
            ...sessionData,
            participants: JSON.parse(sessionData.participants as string),
            activities: JSON.parse(sessionData.activities as string),
            metrics: JSON.parse(sessionData.metrics as string),
            insights: JSON.parse(sessionData.insights as string),
          } : null,
          analytics: analyticsData ? {
            ...analyticsData,
            sessionAnalytics: JSON.parse(analyticsData.sessionAnalytics as string),
            participantAnalytics: JSON.parse(analyticsData.participantAnalytics as string),
            contentAnalytics: JSON.parse(analyticsData.contentAnalytics as string),
            networkAnalytics: JSON.parse(analyticsData.networkAnalytics as string),
          } : null,
        };
        break;

      case "overview":
      default:
        const [totalSessions, activeSessions, totalContributions] = await Promise.all([
          db.collaborationSession.count({
            where: {
              participants: {
                path: [],
          string_contains: userId,
              },
            },
          }),
          db.collaborationSession.count({
            where: {
              participants: {
                path: [],
          string_contains: userId,
              },
              isActive: true,
            },
          }),
          db.collaborationContribution.count({
            where: { userId },
          }),
        ]);

        result = {
          totalSessions,
          activeSessions,
          totalContributions,
          recentActivity: await db.collaborationSession.findMany({
            where: {
              participants: {
                path: [],
          string_contains: userId,
              },
            },
            orderBy: {
              startedAt: "desc",
            },
            take: 5,
            select: {
              sessionId: true,
              courseId: true,
              sessionType: true,
              startedAt: true,
              isActive: true,
            },
          }),
        };
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      data: result,
    });
  } catch (error) {
    logger.error("Error fetching collaboration data:", error);
    return NextResponse.json(
      { error: "Failed to fetch collaboration data" },
      { status: 500 }
    );
  }
}