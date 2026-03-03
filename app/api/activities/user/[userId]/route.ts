import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    
    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    
    // Get userId from params - properly awaited
    const { userId } = await params;
    
    // Verify user has access to these activities
    if (userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Get search params
    const { searchParams } = new URL(req.url);
    const types = searchParams.get('types')?.split(',') || [];
    const statuses = searchParams.get('status')?.split(',') || [];
    const priorities = searchParams.get('priority')?.split(',') || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search') || '';
    
    // For now, return sample data since the activity table doesn't exist yet
    const activities = createSampleActivities(userId);
    
    // Calculate stats for the sample data
    const completedCount = activities.filter(a => a.status === 'completed').length;
    const overdueCount = activities.filter(a => 
      a.status === 'overdue' || 
      (a.dueDate && new Date(a.dueDate) < new Date() && a.status !== 'completed')
    ).length;
    
    return NextResponse.json({
      activities,
      total: activities.length,
      completedCount,
      overdueCount,
    });
    
  } catch (error) {
    logger.error("[ACTIVITIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * Create sample activities for demonstration purposes
 */
const createSampleActivities = (userId: string) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const completedDate = new Date(yesterday);
  completedDate.setHours(completedDate.getHours() - 5);
  
  return [
    // Today's activities
    {
      id: "1",
      title: "Complete website homepage redesign",
      description: "Finish the responsive design for the website homepage and submit for review",
      type: "plan",
      status: "in-progress",
      priority: "high",
      createdAt: twoWeeksAgo.toISOString(),
      updatedAt: yesterday.toISOString(),
      dueDate: today.toISOString(),
      progress: 75,
      userId,
    },
    {
      id: "2",
      title: "Review new mind map feature",
      description: "Test the new mind map feature and provide feedback to the development team",
      type: "mind",
      status: "not-started",
      priority: "medium",
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
      dueDate: today.toISOString(),
      progress: 0,
      userId,
    },
    
    // Upcoming activities
    {
      id: "3",
      title: "Prepare script for product demo",
      description: "Write a script for the upcoming product demonstration video",
      type: "script",
      status: "not-started",
      priority: "high",
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
      dueDate: tomorrow.toISOString(),
      progress: 0,
      userId,
    },
    {
      id: "4",
      title: "Research AI integration options",
      description: "Research available AI solutions for integrating into our platform",
      type: "idea",
      status: "in-progress",
      priority: "medium",
      createdAt: twoWeeksAgo.toISOString(),
      updatedAt: yesterday.toISOString(),
      dueDate: nextWeek.toISOString(),
      progress: 30,
      userId,
    },
    
    // Completed activities
    {
      id: "5",
      title: "Renew premium subscription",
      description: "Renew the annual premium subscription for the design tools",
      type: "subscription",
      status: "completed",
      priority: "critical",
      createdAt: twoWeeksAgo.toISOString(),
      updatedAt: yesterday.toISOString(),
      completedDate: completedDate.toISOString(),
      progress: 100,
      userId,
    },
    {
      id: "6",
      title: "Pay hosting invoice",
      description: "Process payment for the monthly hosting services",
      type: "billing",
      status: "completed",
      priority: "high",
      createdAt: twoWeeksAgo.toISOString(),
      updatedAt: yesterday.toISOString(),
      completedDate: completedDate.toISOString(),
      progress: 100,
      userId,
    },
    
    // Overdue activities
    {
      id: "7",
      title: "Submit quarterly tax report",
      description: "Prepare and submit the quarterly tax report",
      type: "billing",
      status: "overdue",
      priority: "critical",
      createdAt: twoWeeksAgo.toISOString(),
      updatedAt: twoWeeksAgo.toISOString(),
      dueDate: yesterday.toISOString(),
      progress: 25,
      userId,
    },
  ];
}; 