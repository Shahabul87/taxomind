import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Get user's progress alerts
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const severity = searchParams.get('severity');
    const alertType = searchParams.get('alertType');
    const unresolved = searchParams.get('unresolved') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {
      userId: session.user.id
    };

    if (courseId) {
      whereClause.courseId = courseId;
    }

    if (severity) {
      whereClause.severity = severity;
    }

    if (alertType) {
      whereClause.alertType = alertType;
    }

    if (unresolved) {
      whereClause.resolvedAt = null;
    }

    const alerts = await db.progressAlert.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        },
        chapter: {
          select: {
            id: true,
            title: true
          }
        },
        interventionActions: {
          select: {
            id: true,
            actionType: true,
            triggered: true,
            completed: true,
            effectivenesScore: true
          }
        }
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    const totalAlerts = await db.progressAlert.count({
      where: whereClause
    });

    // Get summary statistics
    const alertStats = await db.progressAlert.groupBy({
      by: ['alertType', 'severity'],
      where: {
        userId: session.user.id,
        resolvedAt: null
      },
      _count: {
        id: true
      }
    });

    const summary = {
      total: totalAlerts,
      unresolved: alerts.filter(a => !a.resolvedAt).length,
      critical: alerts.filter(a => a.severity === 'CRITICAL' && !a.resolvedAt).length,
      high: alerts.filter(a => a.severity === 'HIGH' && !a.resolvedAt).length,
      medium: alerts.filter(a => a.severity === 'MEDIUM' && !a.resolvedAt).length,
      low: alerts.filter(a => a.severity === 'LOW' && !a.resolvedAt).length,
      byType: alertStats.reduce((acc, stat) => {
        acc[stat.alertType] = (acc[stat.alertType] || 0) + stat._count.id;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      success: true,
      alerts,
      summary,
      hasMore: offset + limit < totalAlerts
    });

  } catch (error) {
    console.error("Get progress alerts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress alerts" },
      { status: 500 }
    );
  }
}

// Create a manual progress alert
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      courseId,
      chapterId,
      alertType,
      severity,
      message,
      aiSuggestion,
      actionRequired,
      metadata
    } = await req.json();

    if (!courseId || !alertType || !severity || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user has access to the course
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    const alert = await db.progressAlert.create({
      data: {
        userId: session.user.id,
        courseId,
        chapterId,
        alertType,
        severity,
        message,
        aiSuggestion: aiSuggestion || "No specific suggestion available.",
        actionRequired: actionRequired || false,
        metadata: metadata || {}
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        },
        chapter: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Create intervention actions if required
    if (actionRequired) {
      await createInterventionActions(alert);
    }

    return NextResponse.json({
      success: true,
      alert
    });

  } catch (error) {
    console.error("Create progress alert error:", error);
    return NextResponse.json(
      { error: "Failed to create progress alert" },
      { status: 500 }
    );
  }
}

async function createInterventionActions(alert: any) {
  try {
    const interventions = [];

    // Determine appropriate interventions based on alert type and severity
    switch (alert.alertType) {
      case 'STRUGGLING':
        if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
          // Immediate AI tutor intervention
          interventions.push({
            actionType: 'AI_TUTOR',
            actionData: {
              message: 'You seem to be having difficulty with this content. Would you like me to help explain it differently?',
              priority: 'HIGH',
              suggestedActions: ['review_prerequisites', 'alternative_explanation', 'practice_exercises']
            }
          });

          // Email notification to instructor (if applicable)
          interventions.push({
            actionType: 'EMAIL',
            actionData: {
              to: 'instructor',
              subject: 'Student Struggling Alert',
              template: 'student_struggling',
              data: {
                studentName: alert.user?.name,
                courseName: alert.course?.title,
                chapterName: alert.chapter?.title,
                alertMessage: alert.message
              }
            }
          });
        }

        // Content recommendation
        interventions.push({
          actionType: 'CONTENT_RECOMMENDATION',
          actionData: {
            type: 'remedial',
            topics: alert.metadata?.strugglingAreas || [],
            difficulty: 'beginner'
          }
        });
        break;

      case 'AT_RISK':
        // Motivational notification
        interventions.push({
          actionType: 'NOTIFICATION',
          actionData: {
            type: 'motivation',
            message: 'Don\'t give up! You\'re making progress. Let\'s get back on track together.',
            actions: ['resume_learning', 'get_help', 'adjust_schedule']
          }
        });
        break;

      case 'INACTIVE':
        // Re-engagement notification
        interventions.push({
          actionType: 'NOTIFICATION',
          actionData: {
            type: 'reengagement',
            message: 'We miss you! Your learning journey is waiting. Ready to continue?',
            actions: ['continue_course', 'review_progress', 'set_reminder']
          }
        });
        break;

      case 'MILESTONE':
        // Celebration notification
        interventions.push({
          actionType: 'NOTIFICATION',
          actionData: {
            type: 'celebration',
            message: 'Congratulations! You\'ve reached an important milestone. Keep up the great work!',
            actions: ['share_achievement', 'continue_learning', 'set_new_goal']
          }
        });
        break;
    }

    // Create intervention action records
    for (const intervention of interventions) {
      await db.interventionAction.create({
        data: {
          alertId: alert.id,
          actionType: intervention.actionType,
          actionData: intervention.actionData,
          triggered: false,
          completed: false
        }
      });
    }

  } catch (error) {
    console.error("Error creating intervention actions:", error);
  }
}