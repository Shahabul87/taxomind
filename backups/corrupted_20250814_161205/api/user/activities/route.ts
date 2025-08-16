import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const userId = session.user.id;
    
    // In a real app, this would fetch from the database
    // For now, we'll return sample activities
    const activities = createSampleActivities(userId);
    
    return NextResponse.json(activities);
  } catch (error: any) {
    logger.error("[USER_ACTIVITIES_GET]", error);
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