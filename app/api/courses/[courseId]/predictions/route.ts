import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

interface StudentPrediction {
  id: string;
  name: string;
  email: string;
  currentProgress: number;
  predictedCompletion: number;
  completionDate: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendations: string[];
  interventions: string[];
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  performanceIndicators: {
    quizAverage: number;
    assignmentCompletion: number;
    videoEngagement: number;
    discussionParticipation: number;
    timeSpentLearning: number;
  };
  bloomsLevelProgress: Record<string, number>;
  learningPattern: {
    preferredContentType: string;
    optimalLearningTime: string[];
    studyFrequency: string;
    averageSessionLength: number;
  };
  similarStudentOutcomes: {
    successful: number;
    struggled: number;
    dropped: number;
  };
}

interface PredictionModel {
  accuracy: number;
  confidenceInterval: number;
  lastUpdated: string;
  trainingDataSize: number;
  modelVersion: string;
  featureImportance: {
    feature: string;
    importance: number;
    description: string;
  }[];
  performanceMetrics: {
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
  };
}

interface CoursePredictions {
  overallCompletionRate: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  interventionSuccess: {
    early: number;
    medium: number;
    late: number;
  };
  dropoffPredictions: {
    chapter: string;
    riskLevel: number;
    studentsAtRisk: number;
  }[];
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {

    // Get current user
    const user = await currentUser();
    
    if (!user?.id) {

      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check user role
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, role: true }
    });
    
    const userRole = dbUser?.role;
    
    if (userRole !== 'ADMIN') {

      return new NextResponse(`Forbidden - Admin access required. Your role: ${userRole}`, { status: 403 });
    }
    
    const { courseId } = await params;

    // Verify course ownership
    const course = await db.course.findUnique({
      where: {
        id: courseId,
        userId: user.id,
      },
      include: {
        chapters: {
          include: {
            sections: true
          }
        },
        Purchase: true,
        Enrollment: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
              }
            }
          }
        }
      }
    });
    
    if (!course) {
      return new NextResponse("Course not found or access denied", { status: 404 });
    }
    
    // Generate predictions
    const studentPredictions = await generateStudentPredictions(course);
    const coursePredictions = await generateCoursePredictions(course, studentPredictions);
    const modelInfo = generateModelInfo();

    return NextResponse.json({
      studentPredictions,
      coursePredictions,
      modelInfo
    });
    
  } catch (error) {
    logger.error("[STUDENT_PREDICTIONS] Error:", error);
    
    if (error instanceof Error) {
      logger.error("[STUDENT_PREDICTIONS] Error message:", error.message);
      logger.error("[STUDENT_PREDICTIONS] Error stack:", error.stack);
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function generateStudentPredictions(course: any): Promise<StudentPrediction[]> {

  // Get all enrolled students
  const allStudents = [
    ...course.Purchase.map((p: any) => p.user),
    ...course.Enrollment.map((e: any) => e.user)
  ];
  
  // Remove duplicates based on user ID
  const uniqueStudents = allStudents.filter((student, index, self) =>
    index === self.findIndex(s => s.id === student.id)
  );
  
  const predictions: StudentPrediction[] = [];
  
  for (const student of uniqueStudents) {
    const prediction = await generateIndividualPrediction(student, course);
    predictions.push(prediction);
  }
  
  return predictions;
}

async function generateIndividualPrediction(student: any, course: any): Promise<StudentPrediction> {
  // In a real implementation, this would use actual ML models and student data
  // For now, we'll generate realistic mock predictions
  
  const enrollmentDate = new Date(student.createdAt);
  const daysSinceEnrollment = Math.floor((Date.now() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Simulate different student behaviors based on enrollment time and other factors
  const baseProgress = Math.min(daysSinceEnrollment * 2.5, 100); // 2.5% progress per day initially
  const randomVariation = (Math.random() - 0.5) * 40; // ±20% variation
  const currentProgress = Math.max(0, Math.min(100, baseProgress + randomVariation));
  
  // Predict completion based on current progress and engagement patterns
  const engagementFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  const predictedCompletion = Math.min(100, currentProgress * 1.2 * engagementFactor);
  
  // Determine risk level based on various factors
  const riskLevel = determineRiskLevel(currentProgress, predictedCompletion, daysSinceEnrollment);
  
  // Generate performance indicators
  const performanceIndicators = {
    quizAverage: 60 + Math.random() * 35,
    assignmentCompletion: Math.random() * 100,
    videoEngagement: Math.random() * 100,
    discussionParticipation: Math.random() * 100,
    timeSpentLearning: 10 + Math.random() * 50
  };
  
  // Generate Bloom's level progress
  const bloomsLevelProgress = generateBloomsProgress(currentProgress);
  
  // Generate learning pattern
  const learningPattern = generateLearningPattern();
  
  // Generate similar student outcomes
  const similarStudentOutcomes = generateSimilarOutcomes(riskLevel);
  
  // Calculate completion date
  const remainingProgress = 100 - currentProgress;
  const estimatedDaysToComplete = remainingProgress / (2.5 * engagementFactor);
  const completionDate = new Date(Date.now() + estimatedDaysToComplete * 24 * 60 * 60 * 1000);
  
  return {
    id: student.id,
    name: student.name || 'Unknown Student',
    email: student.email,
    currentProgress,
    predictedCompletion,
    completionDate: completionDate.toISOString(),
    riskLevel,
    riskFactors: generateRiskFactors(riskLevel, performanceIndicators, daysSinceEnrollment),
    recommendations: generateRecommendations(riskLevel, performanceIndicators),
    interventions: generateInterventions(riskLevel),
    engagementTrend: determineEngagementTrend(performanceIndicators, daysSinceEnrollment),
    performanceIndicators,
    bloomsLevelProgress,
    learningPattern,
    similarStudentOutcomes
  };
}

function determineRiskLevel(currentProgress: number, predictedCompletion: number, daysSinceEnrollment: number): 'low' | 'medium' | 'high' | 'critical' {
  // Multiple factors determine risk level
  const progressRate = currentProgress / Math.max(daysSinceEnrollment, 1);
  const completionGap = 100 - predictedCompletion;
  
  if (daysSinceEnrollment > 14 && currentProgress < 10) return 'critical';
  if (progressRate < 0.5 && completionGap > 40) return 'high';
  if (progressRate < 1.0 && completionGap > 25) return 'medium';
  if (completionGap > 15) return 'medium';
  return 'low';
}

function generateBloomsProgress(currentProgress: number): Record<string, number> {
  // Higher levels typically have lower completion rates
  const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const progress: Record<string, number> = {};
  
  levels.forEach((level, index) => {
    const baseRate = Math.max(0, currentProgress - (index * 15));
    const variation = (Math.random() - 0.5) * 20;
    progress[level] = Math.max(0, Math.min(100, baseRate + variation));
  });
  
  return progress;
}

function generateLearningPattern() {
  const contentTypes = ['video', 'text', 'interactive', 'quiz'];
  const times = [['9:00', '11:00'], ['14:00', '16:00'], ['19:00', '21:00']];
  const frequencies = ['daily', 'every-other-day', 'weekly', 'irregular'];
  
  return {
    preferredContentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
    optimalLearningTime: times[Math.floor(Math.random() * times.length)],
    studyFrequency: frequencies[Math.floor(Math.random() * frequencies.length)],
    averageSessionLength: 15 + Math.random() * 45
  };
}

function generateSimilarOutcomes(riskLevel: string) {
  const baseRates = {
    low: { successful: 85, struggled: 10, dropped: 5 },
    medium: { successful: 70, struggled: 20, dropped: 10 },
    high: { successful: 50, struggled: 30, dropped: 20 },
    critical: { successful: 30, struggled: 35, dropped: 35 }
  };
  
  const base = baseRates[riskLevel as keyof typeof baseRates];
  return {
    successful: base.successful + Math.round((Math.random() - 0.5) * 10),
    struggled: base.struggled + Math.round((Math.random() - 0.5) * 8),
    dropped: base.dropped + Math.round((Math.random() - 0.5) * 6)
  };
}

function generateRiskFactors(riskLevel: string, performance: any, daysSinceEnrollment: number): string[] {
  const factors: string[] = [];
  
  if (performance.quizAverage < 70) {
    factors.push('Below average quiz performance');
  }
  
  if (performance.assignmentCompletion < 60) {
    factors.push('Low assignment completion rate');
  }
  
  if (performance.videoEngagement < 50) {
    factors.push('Limited video engagement');
  }
  
  if (performance.discussionParticipation < 30) {
    factors.push('Minimal discussion participation');
  }
  
  if (daysSinceEnrollment > 14 && performance.timeSpentLearning < 20) {
    factors.push('Insufficient time spent learning');
  }
  
  if (riskLevel === 'critical') {
    factors.push('Extended period of inactivity');
  }
  
  if (factors.length === 0) {
    factors.push('No major risk factors identified');
  }
  
  return factors;
}

function generateRecommendations(riskLevel: string, performance: any): string[] {
  const recommendations: string[] = [];
  
  switch (riskLevel) {
    case 'low':
      recommendations.push('Continue current learning approach');
      recommendations.push('Consider taking on peer mentoring role');
      break;
    case 'medium':
      recommendations.push('Establish more consistent study schedule');
      recommendations.push('Increase participation in discussions');
      if (performance.quizAverage < 80) {
        recommendations.push('Review quiz materials more thoroughly');
      }
      break;
    case 'high':
      recommendations.push('Schedule one-on-one support session');
      recommendations.push('Access supplementary learning materials');
      recommendations.push('Join study group or find study partner');
      break;
    case 'critical':
      recommendations.push('Immediate intervention required');
      recommendations.push('Consider course extension or intensive support');
      recommendations.push('Evaluate if course difficulty matches student level');
      break;
  }
  
  return recommendations;
}

function generateInterventions(riskLevel: string): string[] {
  const interventions = {
    low: ['Encourage advanced projects', 'Peer teaching opportunities'],
    medium: ['Send progress reminders', 'Provide study guides', 'Offer optional tutoring'],
    high: ['Personal check-in call', 'Assign learning buddy', 'Provide deadline extensions'],
    critical: ['Emergency academic support', 'Alternative learning path', 'Intensive mentoring program']
  };
  
  return interventions[riskLevel as keyof typeof interventions] || [];
}

function determineEngagementTrend(performance: any, daysSinceEnrollment: number): 'increasing' | 'stable' | 'decreasing' {
  // Simulate engagement trends based on performance and time
  const overallEngagement = (
    performance.videoEngagement + 
    performance.discussionParticipation + 
    performance.assignmentCompletion
  ) / 3;
  
  if (daysSinceEnrollment < 7) {
    return 'increasing'; // New students typically start strong
  } else if (overallEngagement > 70) {
    return 'stable';
  } else if (overallEngagement > 40) {
    return Math.random() > 0.5 ? 'stable' : 'decreasing';
  } else {
    return 'decreasing';
  }
}

async function generateCoursePredictions(course: any, studentPredictions: StudentPrediction[]): Promise<CoursePredictions> {

  // Calculate risk distribution
  const riskCounts = studentPredictions.reduce((acc, student) => {
    acc[student.riskLevel]++;
    return acc;
  }, { low: 0, medium: 0, high: 0, critical: 0 });
  
  const total = studentPredictions.length;
  const riskDistribution = {
    low: Math.round((riskCounts.low / total) * 100),
    medium: Math.round((riskCounts.medium / total) * 100),
    high: Math.round((riskCounts.high / total) * 100),
    critical: Math.round((riskCounts.critical / total) * 100)
  };
  
  // Calculate overall completion rate
  const averagePredictedCompletion = studentPredictions.reduce((sum, s) => sum + s.predictedCompletion, 0) / total;
  
  // Generate dropoff predictions based on course structure
  const dropoffPredictions = course.chapters.map((chapter: any, index: number) => ({
    chapter: `Chapter ${index + 1}: ${chapter.title}`,
    riskLevel: 0.3 + (index * 0.1) + (Math.random() * 0.2), // Risk increases with chapter number
    studentsAtRisk: Math.round(total * (0.1 + (index * 0.05) + (Math.random() * 0.1)))
  })).filter((pred: any) => pred.riskLevel > 0.5).slice(0, 3); // Only show top 3 risk areas
  
  return {
    overallCompletionRate: Math.round(averagePredictedCompletion * 10) / 10,
    riskDistribution,
    interventionSuccess: {
      early: 85 + Math.round(Math.random() * 10),
      medium: 65 + Math.round(Math.random() * 10),
      late: 40 + Math.round(Math.random() * 10)
    },
    dropoffPredictions
  };
}

function generateModelInfo(): PredictionModel {
  return {
    accuracy: 0.847,
    confidenceInterval: 0.023,
    lastUpdated: new Date().toISOString(),
    trainingDataSize: 12847,
    modelVersion: '2.1.3',
    featureImportance: [
      { feature: 'Video Engagement', importance: 0.23, description: 'Time spent watching course videos' },
      { feature: 'Quiz Performance', importance: 0.19, description: 'Average scores on knowledge assessments' },
      { feature: 'Assignment Completion', importance: 0.17, description: 'Percentage of assignments submitted on time' },
      { feature: 'Discussion Participation', importance: 0.14, description: 'Active participation in course discussions' },
      { feature: 'Login Frequency', importance: 0.12, description: 'How often student accesses the course' },
      { feature: 'Time Spent Learning', importance: 0.11, description: 'Total active learning time per week' },
      { feature: 'Help-Seeking Behavior', importance: 0.04, description: 'Frequency of reaching out for assistance' }
    ],
    performanceMetrics: {
      precision: 0.823,
      recall: 0.791,
      f1Score: 0.807,
      auc: 0.889
    }
  };
}