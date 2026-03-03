import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { analyticsEngine } from "@/lib/enterprise-analytics";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "platform";
    const entityId = searchParams.get("entityId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const granularity = searchParams.get("granularity") || "day";

    const timeRange = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate),
      granularity: granularity as any,
    } : undefined;

    let analytics;

    switch (type) {
      case "course":
        if (!entityId) {
          return new NextResponse("Course ID required", { status: 400 });
        }
        analytics = await analyticsEngine.getCourseAnalytics(entityId, timeRange);
        break;
      
      case "student":
        if (!entityId) {
          return new NextResponse("Student ID required", { status: 400 });
        }
        analytics = await analyticsEngine.getStudentAnalytics(entityId, timeRange);
        break;
      
      case "platform":
        analytics = await analyticsEngine.getPlatformAnalytics(timeRange);
        break;
      
      case "realtime":
        const dashboardId = searchParams.get("dashboardId") || "default";
        analytics = await analyticsEngine.getRealtimeMetrics(dashboardId);
        break;
      
      default:
        return new NextResponse("Invalid analytics type", { status: 400 });
    }

    return NextResponse.json(analytics);
  } catch (error) {
    logger.error("[ANALYTICS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "create_alert":
        const alert = await analyticsEngine.createAlert(data);
        return NextResponse.json(alert);
      
      case "get_predictions":
        const predictions = await analyticsEngine.getPredictions(data.type, data.entityId);
        return NextResponse.json(predictions);
      
      default:
        return new NextResponse("Invalid action", { status: 400 });
    }
  } catch (error) {
    logger.error("[ANALYTICS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}