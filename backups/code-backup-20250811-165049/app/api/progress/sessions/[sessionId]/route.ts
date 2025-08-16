import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ProgressTracker } from "@/lib/progress-tracking";
import { logger } from '@/lib/logger';

// Update learning session
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    const updateData = await req.json();

    // Return mock data since learningSession model doesn't exist
    const now = new Date();
    const mockUpdatedSession = {
      id: sessionId,
      userId: session.user.id,
      courseId: 'react-101',
      chapterId: 'chapter-1',
      startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      ...updateData,
      duration: updateData.duration || 30,
      updatedAt: now
    };

    return NextResponse.json({
      success: true,
      session: mockUpdatedSession
    });

    /* Original code - commented out until learningSession model is added to schema
    // Verify session belongs to user
    const learningSession = await db.learningSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id
      }
    });

    if (!learningSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Calculate additional metrics
    const now = new Date();
    const startTime = new Date(learningSession.startTime);
    const totalDuration = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60)); // minutes

    // Update session with new data
    const updatedSession = await db.learningSession.update({
      where: { id: sessionId },
      data: {
        ...updateData,
        duration: updateData.duration || totalDuration,
        updatedAt: now
      }
    });

    // Check for intervention triggers
    if (updateData.engagementScore < 30 || updateData.status === "STRUGGLING") {
      await triggerInterventionAlerts(updatedSession);
    }

    // Update learning metrics if session is completed
    if (updateData.status === "COMPLETED" || updateData.status === "ABANDONED") {
      await updateLearningMetrics(session.user.id, learningSession.courseId);
    }

    return NextResponse.json({
      success: true,
      session: updatedSession
    });
    */

  } catch (error) {
    logger.error("Update learning session error:", error);
    return NextResponse.json(
      { error: "Failed to update learning session" },
      { status: 500 }
    );
  }
}

// End learning session
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    const { finalData } = await req.json();

    // Return mock data since learningSession model doesn't exist
    const endTime = new Date();
    const mockFinalSession = {
      id: sessionId,
      userId: session.user.id,
      courseId: 'react-101',
      chapterId: 'chapter-1',
      startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      endTime,
      duration: 60,
      status: finalData?.status || "COMPLETED",
      ...finalData
    };

    return NextResponse.json({
      success: true,
      session: mockFinalSession
    });

    /* Original code - commented out until learningSession model is added to schema
    // Verify session belongs to user
    const learningSession = await db.learningSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id
      }
    });

    if (!learningSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Calculate final metrics
    const endTime = new Date();
    const startTime = new Date(learningSession.startTime);
    const totalDuration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Update session with final data
    const finalSession = await db.learningSession.update({
      where: { id: sessionId },
      data: {
        ...finalData,
        endTime,
        duration: finalData.duration || totalDuration,
        status: finalData.status || "COMPLETED"
      }
    });

    // Update learning metrics
    await updateLearningMetrics(session.user.id, learningSession.courseId);

    return NextResponse.json({
      success: true,
      session: finalSession
    });
    */

  } catch (error) {
    logger.error("End learning session error:", error);
    return NextResponse.json(
      { error: "Failed to end learning session" },
      { status: 500 }
    );
  }
}

// Commented out until progressAlert model is added to schema
/*
async function triggerInterventionAlerts(session: any) {
  try {
    const alerts = [];

    // Struggling detection
    if (session.engagementScore < 30) {
      const alert = await db.progressAlert.create({
        data: {
          userId: session.userId,
          courseId: session.courseId,
          chapterId: session.chapterId,
          alertType: "STRUGGLING",
          severity: "HIGH",
          message: "Student showing signs of struggle in current lesson",
          aiSuggestion: "Suggest taking a break or trying an alternative learning approach. Consider providing additional resources or connecting with a tutor.",
          actionRequired: true,
          metadata: {
            sessionId: session.id,
            engagementScore: session.engagementScore,
            strugglingIndicators: session.strugglingIndicators
          }
        }
      });
      alerts.push(alert);
    }

    // High pause count detection
    if (session.pauseCount > 10) {
      const alert = await db.progressAlert.create({
        data: {
          userId: session.userId,
          courseId: session.courseId,
          chapterId: session.chapterId,
          alertType: "STRUGGLING",
          severity: "MEDIUM",
          message: "Excessive pausing detected - content may be too challenging",
          aiSuggestion: "Recommend reviewing prerequisite material or slowing down the pace.",
          actionRequired: false,
          metadata: {
            sessionId: session.id,
            pauseCount: session.pauseCount
          }
        }
      });
      alerts.push(alert);
    }

    return alerts;
  } catch (error) {
    logger.error("Error creating intervention alerts:", error);
    return [];
  }
}
*/

// Commented out until learningSession and learningMetrics models are added to schema
/*
async function updateLearningMetrics(userId: string, courseId: string) {
  try {
    // Get all sessions for this user and course
    const sessions = await db.learningSession.findMany({
      where: {
        userId,
        courseId
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Calculate overall progress
    const progress = await calculateOverallProgress(userId, courseId);
    
    // Calculate metrics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === "COMPLETED").length;
    const totalStudyTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const averageSessionDuration = totalSessions > 0 ? totalStudyTime / totalSessions : 0;
    const averageEngagementScore = totalSessions > 0 
      ? sessions.reduce((sum, s) => sum + s.engagementScore, 0) / totalSessions 
      : 0;

    // Calculate learning velocity (chapters per week)
    const recentSessions = sessions.filter(s => 
      new Date(s.startTime).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000)
    );
    const uniqueChapters = new Set(recentSessions.map(s => s.chapterId).filter(Boolean));
    const learningVelocity = uniqueChapters.size;

    // Determine engagement trend
    const engagementTrend = determineEngagementTrend(sessions);

    // Calculate risk score
    const riskScore = calculateRiskScore(sessions, progress, averageEngagementScore);

    // Identify struggling areas and strengths
    const strugglingAreas = sessions
      .filter(s => s.engagementScore < 50)
      .map(s => s.chapterId)
      .filter(Boolean);
    
    const strengths = sessions
      .filter(s => s.engagementScore > 80 && s.completionPercentage > 90)
      .map(s => s.chapterId)
      .filter(Boolean);

    // Predict completion date
    const remainingProgress = 100 - progress.percentage;
    const weeksToComplete = learningVelocity > 0 ? (remainingProgress / 10) / learningVelocity : 4;
    const predictedCompletionDate = new Date();
    predictedCompletionDate.setDate(predictedCompletionDate.getDate() + (weeksToComplete * 7));

    // Upsert learning metrics
    await db.learningMetrics.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      create: {
        userId,
        courseId,
        overallProgress: progress.percentage,
        learningVelocity,
        engagementTrend,
        strugglingAreas: [...new Set(strugglingAreas)],
        strengths: [...new Set(strengths)],
        predictedCompletionDate,
        riskScore,
        lastActivityDate: new Date(),
        averageSessionDuration,
        totalStudyTime,
        totalSessions,
        completedSessions,
        averageEngagementScore
      },
      update: {
        overallProgress: progress.percentage,
        learningVelocity,
        engagementTrend,
        strugglingAreas: [...new Set(strugglingAreas)],
        strengths: [...new Set(strengths)],
        predictedCompletionDate,
        riskScore,
        lastActivityDate: new Date(),
        averageSessionDuration,
        totalStudyTime,
        totalSessions,
        completedSessions,
        averageEngagementScore
      }
    });

  } catch (error) {
    logger.error("Error updating learning metrics:", error);
  }
}
*/

// Helper functions - keeping these as they might be useful later
async function calculateOverallProgress(userId: string, courseId: string) {
  // This would calculate actual progress based on user's course completion
  // For now, return mock data
  return { percentage: 65, completedChapters: 13, totalChapters: 20 };
}

function determineEngagementTrend(sessions: any[]): "IMPROVING" | "STABLE" | "DECLINING" {
  if (sessions.length < 3) return "STABLE";
  
  const recent = sessions.slice(-3);
  const older = sessions.slice(-6, -3);
  
  if (older.length === 0) return "STABLE";
  
  const recentAvg = recent.reduce((sum, s) => sum + s.engagementScore, 0) / recent.length;
  const olderAvg = older.reduce((sum, s) => sum + s.engagementScore, 0) / older.length;
  
  if (recentAvg > olderAvg + 10) return "IMPROVING";
  if (recentAvg < olderAvg - 10) return "DECLINING";
  return "STABLE";
}

function calculateRiskScore(sessions: any[], progress: any, avgEngagement: number): number {
  let riskScore = 0;
  
  // Low engagement increases risk
  if (avgEngagement < 50) riskScore += 30;
  else if (avgEngagement < 70) riskScore += 15;
  
  // Slow progress increases risk
  if (progress.percentage < 30 && sessions.length > 5) riskScore += 25;
  
  // Long gaps between sessions increase risk
  const lastSession = sessions[sessions.length - 1];
  if (lastSession) {
    const daysSinceLastSession = (Date.now() - new Date(lastSession.startTime).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastSession > 7) riskScore += 20;
    else if (daysSinceLastSession > 3) riskScore += 10;
  }
  
  return Math.min(riskScore, 100);
}