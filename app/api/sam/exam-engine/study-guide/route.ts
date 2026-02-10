import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { BloomsLevel } from '@prisma/client';
import { logger } from '@/lib/logger';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      courseId,
      examId,
      focusAreas,
      includeWeakAreas = true,
    } = await request.json();

    if (!courseId && !examId) {
      return NextResponse.json(
        { error: 'Either Course ID or Exam ID is required' },
        { status: 400 }
      );
    }

    // Get student's performance data
    const studentData = await getStudentPerformanceData(user.id, courseId, examId);

    // Generate personalized study guide
    const studyGuide = await generatePersonalizedStudyGuide(
      user.id,
      studentData,
      focusAreas,
      includeWeakAreas
    );

    // Save study guide for future reference
    await saveStudyGuide(user.id, courseId, examId, studyGuide);

    return NextResponse.json({
      success: true,
      data: studyGuide,
      metadata: {
        userId: user.id,
        courseId,
        examId,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error('Generate study guide error:', error);
    return NextResponse.json(
      { error: 'Failed to generate study guide' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const examId = searchParams.get('examId');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get user's study guides
    const where: any = { userId: user.id };
    if (examId) where.examId = examId;

    const studyGuides = await db.studyGuide.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const filteredGuides = courseId
      ? studyGuides.filter((guide) => {
          if (!guide.basedOnPerformance || typeof guide.basedOnPerformance !== 'object') {
            return false;
          }
          const basedOn = guide.basedOnPerformance as Record<string, unknown>;
          return basedOn.courseId === courseId;
        })
      : studyGuides;

    const parsedGuides = filteredGuides.map((guide) => {
      let structuredContent: any = null;
      if (guide.content) {
        try {
          structuredContent = JSON.parse(guide.content);
        } catch {
          structuredContent = null;
        }
      }
      return {
        ...guide,
        structuredContent,
      };
    });

    return NextResponse.json({
      success: true,
      data: parsedGuides,
    });

  } catch (error) {
    logger.error('Get study guides error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve study guides' },
      { status: 500 }
    );
  }
}

async function getStudentPerformanceData(
  userId: string,
  courseId: string | null,
  examId: string | null
): Promise<any> {
  const data: any = {
    bloomsProgress: null,
    examPerformance: null,
    weakAreas: [],
    strongAreas: [],
    recentActivity: [],
  };

  // Get Bloom's progress
  if (courseId) {
    const progress = await db.studentBloomsProgress.findUnique({
      where: {
        userId_courseId: { userId, courseId } as any,
      },
    });

    if (progress) {
      data.bloomsProgress = progress.bloomsScores;
      data.weakAreas = progress.weaknessAreas;
      data.strongAreas = progress.strengthAreas;
    }
  }

  // Get exam performance
  if (examId) {
    const attempts = await db.userExamAttempt.findMany({
      where: {
        userId,
        examId,
        status: 'SUBMITTED',
      },
      orderBy: { submittedAt: 'desc' },
      take: 5,
      include: {
        UserAnswer: {
          include: {
            ExamQuestion: {
              select: {
                bloomsLevel: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });

    if (attempts.length > 0) {
      data.examPerformance = analyzeExamPerformance(attempts);
    }
  }

  // Get recent learning activity
  const recentMetrics = await db.bloomsPerformanceMetric.findMany({
    where: {
      userId,
      ...(courseId && { courseId }),
    },
    orderBy: { recordedAt: 'desc' },
    take: 20,
  });

  data.recentActivity = recentMetrics;

  return data;
}

function analyzeExamPerformance(attempts: any[]): any {
  const performance = {
    avgScore: 0,
    improvement: 0,
    weakTopics: [] as string[],
    strongTopics: [] as string[],
    bloomsPerformance: {} as Record<BloomsLevel, number>,
  };

  // Calculate average score
  const scores = attempts.map(a => a.scorePercentage || 0);
  performance.avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  // Calculate improvement
  if (scores.length > 1) {
    performance.improvement = scores[0] - scores[scores.length - 1];
  }

  // Analyze by Bloom's level
  const bloomsLevels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  bloomsLevels.forEach(level => {
    performance.bloomsPerformance[level] = 0;
  });

  const topicPerformance: Record<string, { correct: number; total: number }> = {};

  attempts.forEach(attempt => {
    attempt.UserAnswer.forEach((aq: any) => {
      const level = aq.ExamQuestion.bloomsLevel as BloomsLevel;
      if (level && bloomsLevels.includes(level)) {
        if (!performance.bloomsPerformance[level]) {
          performance.bloomsPerformance[level] = 0;
        }
        performance.bloomsPerformance[level] += aq.isCorrect ? 1 : 0;
      }

      // Track topic performance (tags not available in ExamQuestion)
      // aq.ExamQuestion.tags?.forEach((tag: string) => {
      //   if (!topicPerformance[tag]) {
      //     topicPerformance[tag] = { correct: 0, total: 0 };
      //   }
      //   topicPerformance[tag].total++;
      //   if (aq.isCorrect) {
      //     topicPerformance[tag].correct++;
      //   }
      // });
    });
  });

  // Identify weak and strong topics
  Object.entries(topicPerformance).forEach(([topic, perf]) => {
    const accuracy = perf.correct / perf.total;
    if (accuracy < 0.5) {
      performance.weakTopics.push(topic);
    } else if (accuracy > 0.8) {
      performance.strongTopics.push(topic);
    }
  });

  return performance;
}

async function generatePersonalizedStudyGuide(
  userId: string,
  studentData: any,
  focusAreas: string[] | null,
  includeWeakAreas: boolean
): Promise<any> {
  const systemPrompt = `You are SAM, an expert educational tutor specializing in personalized study guidance. Create a comprehensive study guide based on the student's performance data.

**Student Performance Data:**
${JSON.stringify(studentData, null, 2)}

**Focus Areas Requested:**
${focusAreas?.join(', ') || 'General improvement'}

**Guidelines:**
1. Prioritize weak areas if includeWeakAreas is true
2. Build on existing strengths
3. Provide specific, actionable recommendations
4. Suggest resources and practice activities
5. Create a structured learning path
6. Include time estimates for each activity`;

  const userPrompt = `Generate a personalized study guide that includes:
1. Priority topics to focus on
2. Recommended learning activities for each Bloom's level
3. Practice questions or exercises
4. Resource recommendations (videos, articles, practice sets)
5. A suggested study schedule
6. Tips for improvement based on performance patterns`;

  const guideText = await runSAMChatWithPreference({
    userId,
    capability: 'analysis',
    maxTokens: 3000,
    temperature: 0.7,
    systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return parseStudyGuide(guideText, studentData);
}

function parseStudyGuide(guideText: string, studentData: any): any {
  // Parse the AI response into structured format
  const guide = {
    overview: '',
    priorityTopics: [] as any[],
    learningActivities: {} as Record<BloomsLevel, any[]>,
    practiceQuestions: [] as any[],
    resources: [] as any[],
    studySchedule: {} as any,
    improvementTips: [] as string[],
    estimatedTime: 0,
  };

  // Extract sections from the guide text
  const sections = guideText.split(/\n#{1,2}\s+/).filter(s => s.trim());

  sections.forEach(section => {
    const lines = section.split('\n').filter(l => l.trim());
    const title = lines[0]?.toLowerCase();

    if (title.includes('overview') || title.includes('summary')) {
      guide.overview = lines.slice(1).join(' ');
    } else if (title.includes('priority') || title.includes('focus')) {
      guide.priorityTopics = extractListItems(lines.slice(1));
    } else if (title.includes('activities')) {
      guide.learningActivities = extractActivitiesByLevel(lines.slice(1));
    } else if (title.includes('practice') || title.includes('questions')) {
      guide.practiceQuestions = extractListItems(lines.slice(1));
    } else if (title.includes('resource')) {
      guide.resources = extractResources(lines.slice(1));
    } else if (title.includes('schedule')) {
      guide.studySchedule = extractSchedule(lines.slice(1));
    } else if (title.includes('tips') || title.includes('improvement')) {
      guide.improvementTips = extractListItems(lines.slice(1));
    }
  });

  // Add weak areas if not already included
  if (studentData.weakAreas && studentData.weakAreas.length > 0) {
    studentData.weakAreas.forEach((area: string) => {
      if (!guide.priorityTopics.some(t => t.includes(area))) {
        guide.priorityTopics.push({
          topic: area,
          priority: 'high',
          reason: 'Identified as weak area in assessments',
        });
      }
    });
  }

  // Estimate total time
  guide.estimatedTime = calculateEstimatedTime(guide);

  return guide;
}

function extractListItems(lines: string[]): any[] {
  return lines
    .filter(line => line.match(/^[-*•]\s+/) || line.match(/^\d+\.\s+/))
    .map(line => line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim());
}

function extractActivitiesByLevel(lines: string[]): Record<BloomsLevel, any[]> {
  const activities: Record<BloomsLevel, any[]> = {} as any;
  let currentLevel: BloomsLevel | null = null;

  lines.forEach(line => {
    const bloomsLevels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    
    const foundLevel = bloomsLevels.find(level => 
      line.toUpperCase().includes(level)
    );

    if (foundLevel) {
      currentLevel = foundLevel;
      activities[currentLevel] = [];
    } else if (currentLevel && line.trim()) {
      activities[currentLevel].push(line.trim());
    }
  });

  return activities;
}

function extractResources(lines: string[]): any[] {
  return lines.map(line => {
    const parts = line.split(':');
    return {
      type: parts[0]?.trim() || 'General',
      title: parts[1]?.trim() || line,
      description: parts[2]?.trim() || '',
    };
  });
}

function extractSchedule(lines: string[]): any {
  const schedule: any = {};
  let currentDay = '';

  lines.forEach(line => {
    if (line.match(/day\s+\d+/i) || line.match(/week\s+\d+/i)) {
      currentDay = line.trim();
      schedule[currentDay] = [];
    } else if (currentDay && line.trim()) {
      schedule[currentDay].push(line.trim());
    }
  });

  return schedule;
}

function calculateEstimatedTime(guide: any): number {
  let totalMinutes = 0;

  // Estimate time for priority topics (30 min each)
  totalMinutes += guide.priorityTopics.length * 30;

  // Estimate time for activities (20 min each)
  Object.values(guide.learningActivities).forEach((activities: any) => {
    totalMinutes += activities.length * 20;
  });

  // Estimate time for practice questions (15 min each)
  totalMinutes += guide.practiceQuestions.length * 15;

  return totalMinutes;
}

async function saveStudyGuide(
  userId: string,
  courseId: string | null,
  examId: string | null,
  guide: any
): Promise<void> {
  try {
    const focusAreas = Array.isArray(guide.priorityTopics)
      ? guide.priorityTopics.map((item: any) => item?.topic ?? item).filter(Boolean)
      : [];

    const targetBloomsLevels = guide.learningActivities
      ? Object.keys(guide.learningActivities)
      : [];

    const title = examId
      ? 'Exam Study Guide'
      : courseId
        ? 'Course Study Guide'
        : 'Personalized Study Guide';

    await db.studyGuide.create({
      data: {
        userId,
        examId: examId || null,
        sectionId: null,
        title,
        content: JSON.stringify(guide),
        focusAreas,
        practiceQuestions: guide.practiceQuestions ?? [],
        resources: guide.resources ?? [],
        basedOnPerformance: {
          courseId,
          examId,
          generatedAt: new Date().toISOString(),
        },
        targetBloomsLevels,
      },
    });
  } catch (error) {
    logger.error('Error saving study guide:', error);
  }
}
