import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { runSAMChat } from '@/lib/sam/ai-provider';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const timeframe = searchParams.get('timeframe') || '7_days'; // '7_days', '30_days', '90_days', 'all_time'
    const metric = searchParams.get('metric') || 'overview'; // 'overview', 'engagement', 'performance', 'at_risk'

    let insights;

    switch (metric) {
      case 'overview':
        insights = await generateOverviewInsights(courseId, timeframe);
        break;
      case 'engagement':
        insights = await generateEngagementInsights(courseId, timeframe);
        break;
      case 'performance':
        insights = await generatePerformanceInsights(courseId, timeframe);
        break;
      case 'at_risk':
        insights = await generateAtRiskInsights(courseId, timeframe);
        break;
      case 'learning_patterns':
        insights = await generateLearningPatternInsights(courseId, timeframe);
        break;
      case 'content_effectiveness':
        insights = await generateContentEffectivenessInsights(courseId, timeframe);
        break;
      default:
        return NextResponse.json({ error: 'Invalid metric type' }, { status: 400 });
    }

    return NextResponse.json({
      insights,
      courseId,
      timeframe,
      metric,
      generatedAt: new Date().toISOString(),
      teacherId: user.id
    });

  } catch (error) {
    logger.error('Teacher insights error:', error);
    return NextResponse.json(
      { error: 'Failed to generate teacher insights' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      action, 
      courseId, 
      studentId, 
      interventionType, 
      customQuery 
    } = await request.json();

    let result;

    switch (action) {
      case 'generate_intervention':
        result = await generateStudentIntervention(studentId, courseId, interventionType);
        break;
      case 'analyze_content':
        result = await analyzeContentEffectiveness(courseId);
        break;
      case 'custom_insight':
        result = await generateCustomInsight(customQuery, courseId);
        break;
      case 'export_report':
        result = await exportInsightsReport(courseId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      result,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Teacher insights action error:', error);
    return NextResponse.json(
      { error: 'Failed to process teacher insights action' },
      { status: 500 }
    );
  }
}

async function runTeacherInsightsChat(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number; model?: string }
): Promise<string> {
  return runSAMChat({
    model: options?.model ?? 'claude-sonnet-4-5-20250929',
    maxTokens: options?.maxTokens ?? 1500,
    temperature: options?.temperature ?? 0.7,
    systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
}

async function generateOverviewInsights(courseId: string | null, timeframe: string) {
  const { startDate, previousStartDate, endDate } = getTimeframeRange(timeframe);
  const enrollmentWhere = courseId ? { courseId } : {};

  const totalStudents = await db.enrollment.count({ where: enrollmentWhere });

  const activityWhere = {
    ...(courseId ? { courseId } : {}),
    ...(startDate ? { createdAt: { gte: startDate, lte: endDate } } : {}),
  };

  const activeUsers = await db.learningActivityLog.groupBy({
    by: ['userId'],
    where: activityWhere,
  });

  const previousActivityCount = await db.learningActivityLog.count({
    where: {
      ...(courseId ? { courseId } : {}),
      ...(previousStartDate && startDate ? { createdAt: { gte: previousStartDate, lt: startDate } } : {}),
    },
  });

  const currentActivityCount = await db.learningActivityLog.count({ where: activityWhere });

  const avgTimeSpent = await db.learningActivityLog.aggregate({
    where: activityWhere,
    _avg: { duration: true },
  });

  const examStats = await db.userExamAttempt.aggregate({
    where: {
      ...(startDate ? { createdAt: { gte: startDate, lte: endDate } } : {}),
      ...(courseId
        ? {
            Exam: {
              is: {
                section: {
                  is: {
                    chapter: {
                      is: { courseId },
                    },
                  },
                },
              },
            },
          }
        : {}),
    },
    _avg: { scorePercentage: true },
  });

  const performanceByUser = await db.userExamAttempt.groupBy({
    by: ['userId'],
    where: {
      ...(startDate ? { createdAt: { gte: startDate, lte: endDate } } : {}),
      ...(courseId
        ? {
            Exam: {
              is: {
                section: {
                  is: {
                    chapter: {
                      is: { courseId },
                    },
                  },
                },
              },
            },
          }
        : {}),
    },
    _avg: { scorePercentage: true },
  });

  const userIds = performanceByUser.map((entry) => entry.userId);
  const users = userIds.length
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      })
    : [];

  const userMap = new Map(users.map((user) => [user.id, user.name ?? 'Unknown']));
  const sortedPerformance = performanceByUser
    .map((entry) => ({
      userId: entry.userId,
      score: entry._avg.scorePercentage ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  const topPerformers = sortedPerformance.slice(0, 3).map((entry) => ({
    name: userMap.get(entry.userId) ?? 'Unknown',
    score: Math.round(entry.score),
    progress: 100,
  }));

  const strugglingStudents = sortedPerformance.slice(-2).map((entry) => ({
    name: userMap.get(entry.userId) ?? 'Unknown',
    score: Math.round(entry.score),
    progress: Math.max(0, Math.round(entry.score)),
    risk: entry.score < 70 ? 'high' : 'medium',
  }));

  const activitySamples = await db.learningActivityLog.findMany({
    where: activityWhere,
    select: { createdAt: true, contentType: true },
    take: 200,
  });

  const mostActiveHours = summarizeActiveHours(activitySamples.map((log) => log.createdAt));
  const contentTypes = activitySamples.map((log) => log.contentType).filter(Boolean) as string[];
  const contentTypeRank = rankByCount(contentTypes);

  const completionAnalytics = courseId
    ? await db.courseCompletionAnalytics.findUnique({
        where: { courseId },
        select: { completionRate: true },
      })
    : null;

  // Check if this is an empty course (no students or activity)
  const hasRealData = totalStudents > 0 || activeUsers.length > 0;

  // Demo data for new teachers with no students yet
  const demoData = {
    totalStudents: 24,
    activeStudents: 18,
    completionRate: 72,
    averageScore: 78,
    engagementRate: 75,
    timeSpent: 2.3,
    mostActiveHours: ['10:00 AM', '2:00 PM', '7:00 PM'],
    topPerformers: [
      { name: 'Demo Student A', score: 95, progress: 100 },
      { name: 'Demo Student B', score: 91, progress: 100 },
      { name: 'Demo Student C', score: 88, progress: 100 },
    ],
    strugglingStudents: [
      { name: 'Demo Student X', score: 58, progress: 58, risk: 'high' },
      { name: 'Demo Student Y', score: 65, progress: 65, risk: 'medium' },
    ],
    contentPerformance: {
      bestChapters: ['Introduction', 'Core Concepts'],
      challengingChapters: ['Advanced Topics'],
      mostEngaging: 'Video',
      leastEngaging: 'Quiz',
    },
    trends: {
      engagement: { direction: 'up' as const, change: 12 },
      completion: { direction: 'up' as const, change: 5 },
      scores: { direction: 'stable' as const, change: 0 },
    },
    isDemo: true,
    demoMessage: 'This is sample data. Real analytics will appear once students enroll and start learning.',
  };

  const courseData = hasRealData ? {
    totalStudents,
    activeStudents: activeUsers.length,
    completionRate: completionAnalytics?.completionRate ?? 0,
    averageScore: Math.round(examStats._avg.scorePercentage ?? 0),
    engagementRate: totalStudents ? Math.round((activeUsers.length / totalStudents) * 100) : 0,
    timeSpent: Math.round(((avgTimeSpent._avg.duration ?? 0) / 3600) * 10) / 10,
    mostActiveHours,
    topPerformers,
    strugglingStudents,
    contentPerformance: {
      bestChapters: [],
      challengingChapters: [],
      mostEngaging: contentTypeRank[0]?.label ?? 'N/A',
      leastEngaging: contentTypeRank[contentTypeRank.length - 1]?.label ?? 'N/A',
    },
    trends: {
      engagement: calculateTrend(currentActivityCount, previousActivityCount),
      completion: { direction: 'stable' as const, change: 0 },
      scores: { direction: 'stable' as const, change: 0 },
    },
    isDemo: false,
  } : demoData;

  const systemPrompt = `You are SAM, an AI teaching assistant analyzing class performance data. Generate comprehensive insights for a teacher about their class performance.
${courseData.isDemo ? '\n**NOTE: This is DEMO DATA - the teacher has no enrolled students yet. Provide general guidance and tips.**\n' : ''}
**Class Data:**
${JSON.stringify(courseData, null, 2)}

**Timeframe:** ${timeframe}

Provide actionable insights including:
- Key performance highlights
- Areas of concern
- Specific recommendations
- Student intervention suggestions
- Content optimization ideas
- Engagement strategies

Make the insights practical and actionable for teachers.`;

  const analysisText = await runTeacherInsightsChat(
    systemPrompt,
    'Generate comprehensive class overview insights for this teacher.',
    { maxTokens: 1500, temperature: 0.7 }
  );

  return {
    type: 'overview',
    summary: analysisText,
    metrics: courseData,
    isDemo: courseData.isDemo,
    recommendations: extractRecommendations(analysisText),
    alerts: courseData.isDemo
      ? [
          {
            type: 'info',
            message: 'Viewing demo data - no students enrolled yet',
            action: 'Share your course link to start getting real analytics',
          },
        ]
      : courseData.strugglingStudents.length
        ? courseData.strugglingStudents.map((student) => ({
            type: 'warning',
            message: `${student.name} may need extra support`,
            action: 'Schedule an intervention or check-in',
          }))
        : [
            {
              type: 'info',
              message: 'No high-risk students detected in this timeframe',
              action: 'Continue monitoring engagement',
            },
          ],
    quickActions: [
      'Schedule one-on-one meetings',
      'Create additional practice materials',
      'Send encouraging messages',
      'Adjust pacing for difficult topics'
    ]
  };
}

async function generateEngagementInsights(courseId: string | null, timeframe: string) {
  const { startDate, previousStartDate, endDate } = getTimeframeRange(timeframe);
  const activityWhere = {
    ...(courseId ? { courseId } : {}),
    ...(startDate ? { createdAt: { gte: startDate, lte: endDate } } : {}),
  };

  const activityLogs = await db.learningActivityLog.findMany({
    where: activityWhere,
    select: { userId: true, createdAt: true, contentType: true },
  });

  const overallEngagement = activityLogs.length;
  const peakHours = summarizeActiveHours(activityLogs.map((log) => log.createdAt));
  const contentTypes = activityLogs.map((log) => log.contentType).filter(Boolean) as string[];
  const engagementByContent = buildContentEngagement(contentTypes);

  const engagementByUser = rankByCount(activityLogs.map((log) => log.userId));
  const userIds = engagementByUser.map((entry) => entry.label);
  const users = userIds.length
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, lastLoginAt: true },
      })
    : [];

  const userMap = new Map(users.map((user) => [user.id, user]));
  const studentEngagement = engagementByUser.slice(0, 4).map((entry) => ({
    name: userMap.get(entry.label)?.name ?? 'Unknown',
    engagement: entry.count,
    lastActive: userMap.get(entry.label)?.lastLoginAt
      ? new Date(userMap.get(entry.label)?.lastLoginAt as Date).toLocaleDateString()
      : 'unknown',
  }));

  const previousCount = await db.learningActivityLog.count({
    where: {
      ...(courseId ? { courseId } : {}),
      ...(previousStartDate && startDate ? { createdAt: { gte: previousStartDate, lt: startDate } } : {}),
    },
  });
  const engagementTrends = calculateTrend(activityLogs.length, previousCount);

  const mockEngagementData = {
    overallEngagement,
    dailyEngagement: buildDailyEngagement(activityLogs.map((log) => log.createdAt)),
    peakHours,
    engagementByContent,
    studentEngagement,
    engagementTrends: {
      weekOverWeek: engagementTrends.change,
      monthOverMonth: engagementTrends.change,
      dropoffPoints: [],
      highEngagementTriggers: [],
    },
  };

  const systemPrompt = `You are SAM, an AI teaching assistant analyzing student engagement data. Generate detailed engagement insights for a teacher.

**Engagement Data:**
${JSON.stringify(mockEngagementData, null, 2)}

**Timeframe:** ${timeframe}

Provide insights on:
- Engagement patterns and trends
- Content type effectiveness
- Student participation levels
- Optimal timing for activities
- Strategies to boost engagement
- Early warning signs for disengagement

Focus on actionable recommendations to improve student engagement.`;

  const analysisText = await runTeacherInsightsChat(
    systemPrompt,
    'Analyze the engagement patterns and provide actionable insights.',
    { maxTokens: 1200, temperature: 0.7 }
  );

  return {
    type: 'engagement',
    summary: analysisText,
    metrics: mockEngagementData,
    recommendations: extractRecommendations(analysisText),
    engagementStrategies: [
      'Add more interactive elements to low-engagement content',
      'Schedule live sessions during peak hours',
      'Create discussion prompts for reading materials',
      'Implement gamification for assignments'
    ],
    alerts: mockEngagementData.studentEngagement
      .filter((student: any) => student.engagement < 10)
      .map((student: any) => ({
        type: 'warning',
        message: `${student.name} has low engagement`,
        action: 'Send check-in message',
      }))
      .concat(
        Object.keys(mockEngagementData.engagementByContent).length
          ? [
              {
                type: 'info',
                message: 'Content engagement varies by format',
                action: 'Double down on the highest performing formats',
              },
            ]
          : []
      ),
  };
}

async function generatePerformanceInsights(courseId: string | null, timeframe: string) {
  const { startDate, endDate } = getTimeframeRange(timeframe);
  const attempts = await db.userExamAttempt.findMany({
    where: {
      ...(startDate ? { createdAt: { gte: startDate, lte: endDate } } : {}),
      ...(courseId
        ? {
            Exam: {
              is: {
                section: {
                  is: {
                    chapter: {
                      is: { courseId },
                    },
                  },
                },
              },
            },
          }
        : {}),
    },
    select: {
      scorePercentage: true,
      Exam: {
        select: {
          section: {
            select: { chapterId: true },
          },
        },
      },
    },
  });

  const scores = attempts.map((attempt) => attempt.scorePercentage ?? 0);
  const classAverage = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;

  const gradeDistribution = buildGradeDistribution(scores);
  const performanceByChapter = buildChapterPerformance(attempts);

  const mockPerformanceData = {
    classAverage,
    gradeDistribution,
    performanceByChapter,
    skillsAnalysis: {
      strongest: [],
      weakest: [],
      improving: [],
    },
    learningOutcomes: {
      met: 0,
      partiallyMet: 0,
      notMet: 0,
    },
    assessmentPerformance: {},
  };

  const systemPrompt = `You are SAM, an AI teaching assistant analyzing student performance data. Generate detailed performance insights for a teacher.

**Performance Data:**
${JSON.stringify(mockPerformanceData, null, 2)}

**Timeframe:** ${timeframe}

Provide insights on:
- Overall class performance trends
- Individual student progress
- Content difficulty analysis
- Skill development patterns
- Learning outcome achievement
- Assessment effectiveness

Focus on data-driven recommendations for improving student outcomes.`;

  const analysisText = await runTeacherInsightsChat(
    systemPrompt,
    'Analyze the performance data and provide actionable insights.',
    { maxTokens: 1200, temperature: 0.7 }
  );

  return {
    type: 'performance',
    summary: analysisText,
    metrics: mockPerformanceData,
    recommendations: extractRecommendations(analysisText),
    interventions: [
      'Provide additional support for Technical Implementation',
      'Create remedial materials for struggling students',
      'Offer advanced challenges for high performers',
      'Review assessment methods for better alignment'
    ],
    learningPathAdjustments: [
      'Add more scaffolding for advanced topics',
      'Provide prerequisite review materials',
      'Create alternative assessment formats',
      'Implement peer tutoring program'
    ]
  };
}

async function generateAtRiskInsights(courseId: string | null, timeframe: string) {
  const { startDate, endDate } = getTimeframeRange(timeframe);
  const enrollments = await db.enrollment.findMany({
    where: courseId ? { courseId } : {},
    select: { userId: true },
  });

  const userIds = Array.from(new Set(enrollments.map((item) => item.userId)));

  const activityAgg = await db.learningActivityLog.groupBy({
    by: ['userId'],
    where: {
      userId: { in: userIds },
      ...(courseId ? { courseId } : {}),
      ...(startDate ? { createdAt: { gte: startDate, lte: endDate } } : {}),
    },
    _max: { createdAt: true },
  });

  const scoresAgg = await db.userExamAttempt.groupBy({
    by: ['userId'],
    where: {
      userId: { in: userIds },
      ...(startDate ? { createdAt: { gte: startDate, lte: endDate } } : {}),
      ...(courseId
        ? {
            Exam: {
              is: {
                section: {
                  is: {
                    chapter: {
                      is: { courseId },
                    },
                  },
                },
              },
            },
          }
        : {}),
    },
    _avg: { scorePercentage: true },
  });

  const userMap = new Map(
    (
      await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      })
    ).map((user) => [user.id, user.name ?? 'Unknown'])
  );

  const lastActiveMap = new Map(activityAgg.map((item) => [item.userId, item._max.createdAt]));
  const scoreMap = new Map(scoresAgg.map((item) => [item.userId, item._avg.scorePercentage ?? 0]));

  const atRiskStudents = userIds
    .map((id) => {
      const lastActive = lastActiveMap.get(id);
      const score = scoreMap.get(id) ?? 0;
      const inactive = !lastActive;
      const lowScore = score > 0 && score < 70;

      let risk: 'high' | 'medium' | 'low' = 'low';
      if (inactive || score < 60) risk = 'high';
      else if (lowScore) risk = 'medium';

      const factors = [];
      if (inactive) factors.push('inactivity');
      if (lowScore) factors.push('low_scores');

      return {
        name: userMap.get(id) ?? 'Unknown',
        risk,
        factors,
        lastActive: lastActive ? new Date(lastActive).toDateString() : 'unknown',
        averageScore: Math.round(score),
        interventionSuggestions: risk === 'high'
          ? ['immediate_contact', 'academic_support']
          : risk === 'medium'
            ? ['check_in_meeting', 'study_resources']
            : [],
      };
    })
    .filter((student) => student.risk !== 'low');

  const riskLevels = atRiskStudents.reduce(
    (acc, student) => {
      acc[student.risk] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );

  const mockAtRiskData = {
    totalAtRisk: atRiskStudents.length,
    riskLevels,
    riskFactors: {
      lowEngagement: atRiskStudents.filter((student) => student.factors.includes('inactivity')).length,
      poorPerformance: atRiskStudents.filter((student) => student.factors.includes('low_scores')).length,
      missedDeadlines: 0,
      inactivity: atRiskStudents.filter((student) => student.factors.includes('inactivity')).length,
    },
    atRiskStudents,
    earlyWarningSignals: [
      'Students inactive for 3+ days',
      'Score drops of 10+ points',
      'Engagement below 50%',
    ],
    interventionSuccess: {
      contacted: 0,
      improved: 0,
      stillStruggling: 0,
    },
  };

  const systemPrompt = `You are SAM, an AI teaching assistant analyzing at-risk student data. Generate insights to help teachers identify and support struggling students.

**At-Risk Data:**
${JSON.stringify(mockAtRiskData, null, 2)}

**Timeframe:** ${timeframe}

Provide insights on:
- Risk identification patterns
- Early warning systems
- Intervention effectiveness
- Individual student needs
- Proactive support strategies
- Resource allocation

Focus on prevention and early intervention strategies.`;

  const analysisText = await runTeacherInsightsChat(
    systemPrompt,
    'Analyze at-risk student patterns and provide intervention strategies.',
    { maxTokens: 1200, temperature: 0.7 }
  );

  return {
    type: 'at_risk',
    summary: analysisText,
    metrics: mockAtRiskData,
    recommendations: extractRecommendations(analysisText),
    immediateActions: mockAtRiskData.atRiskStudents.length
      ? mockAtRiskData.atRiskStudents.slice(0, 4).map((student: any) => `Check in with ${student.name}`)
      : ['Monitor engagement and performance trends'],
    preventionStrategies: [
      'Implement weekly check-ins',
      'Create peer support groups',
      'Provide flexible deadline options',
      'Offer multiple support channels'
    ]
  };
}

async function generateLearningPatternInsights(courseId: string | null, timeframe: string) {
  const { startDate, endDate } = getTimeframeRange(timeframe);
  const activityLogs = await db.learningActivityLog.findMany({
    where: {
      ...(courseId ? { courseId } : {}),
      ...(startDate ? { createdAt: { gte: startDate, lte: endDate } } : {}),
    },
    select: { createdAt: true, contentType: true },
  });

  const mockPatternData = {
    learningStyles: {},
    studyPatterns: buildStudyPatternDistribution(activityLogs.map((log) => log.createdAt)),
    contentPreferences: buildContentEngagement(
      activityLogs.map((log) => log.contentType).filter(Boolean) as string[]
    ),
    pacePreferences: {},
    collaborationStyles: {},
  };

  const systemPrompt = `You are SAM, an AI teaching assistant analyzing learning patterns. Generate insights about how students learn best.

**Learning Pattern Data:**
${JSON.stringify(mockPatternData, null, 2)}

**Timeframe:** ${timeframe}

Provide insights on:
- Dominant learning styles
- Optimal study times
- Content format preferences
- Pacing needs
- Collaboration preferences
- Personalization opportunities

Focus on how to adapt teaching methods to match student learning patterns.`;

  const analysisText = await runTeacherInsightsChat(
    systemPrompt,
    'Analyze learning patterns and suggest teaching adaptations.',
    { maxTokens: 1000, temperature: 0.7 }
  );

  return {
    type: 'learning_patterns',
    summary: analysisText,
    metrics: mockPatternData,
    recommendations: extractRecommendations(analysisText),
    adaptationStrategies: [
      'Provide multiple content formats for different learning styles',
      'Schedule key activities during peak engagement hours',
      'Create flexible pacing options',
      'Offer both independent and collaborative learning paths'
    ]
  };
}

async function generateContentEffectivenessInsights(courseId: string | null, timeframe: string) {
  const { startDate, endDate } = getTimeframeRange(timeframe);
  const activityLogs = await db.learningActivityLog.findMany({
    where: {
      ...(courseId ? { courseId } : {}),
      ...(startDate ? { createdAt: { gte: startDate, lte: endDate } } : {}),
    },
    select: { contentType: true, score: true },
  });

  const contentRatings = buildContentRatings(activityLogs);

  const mockContentData = {
    contentRatings,
    topPerforming: [],
    needsImprovement: [],
    contentGaps: [],
  };

  const systemPrompt = `You are SAM, an AI teaching assistant analyzing content effectiveness. Generate insights about how well different content types are working.

**Content Effectiveness Data:**
${JSON.stringify(mockContentData, null, 2)}

**Timeframe:** ${timeframe}

Provide insights on:
- Content performance by type
- Student engagement patterns
- Learning effectiveness measures
- Content optimization opportunities
- Gap analysis
- Improvement recommendations

Focus on data-driven content optimization strategies.`;

  const analysisText = await runTeacherInsightsChat(
    systemPrompt,
    'Analyze content effectiveness and provide optimization suggestions.',
    { maxTokens: 1000, temperature: 0.7 }
  );

  return {
    type: 'content_effectiveness',
    summary: analysisText,
    metrics: mockContentData,
    recommendations: extractRecommendations(analysisText),
    optimizationActions: [
      'Add interactive elements to low-performing content',
      'Create supplementary materials for difficult topics',
      'Redesign theoretical content with more examples',
      'Implement better assessment alignment'
    ]
  };
}

async function generateStudentIntervention(studentId: string, courseId: string, interventionType: string) {
  // Mock intervention generation
  const interventionStrategies = {
    academic_support: {
      title: 'Academic Support Plan',
      actions: [
        'Schedule one-on-one tutoring sessions',
        'Provide additional practice materials',
        'Create personalized study schedule',
        'Connect with academic support services'
      ],
      timeline: '2 weeks',
      followUp: 'Weekly check-ins'
    },
    engagement_boost: {
      title: 'Engagement Enhancement Plan',
      actions: [
        'Identify preferred learning styles',
        'Provide alternative content formats',
        'Create peer study groups',
        'Implement gamification elements'
      ],
      timeline: '1 week',
      followUp: 'Daily engagement monitoring'
    },
    motivation_support: {
      title: 'Motivation Support Plan',
      actions: [
        'Set achievable short-term goals',
        'Provide positive reinforcement',
        'Connect learning to personal interests',
        'Celebrate small wins'
      ],
      timeline: '3 weeks',
      followUp: 'Bi-weekly motivation sessions'
    }
  };

  return {
    studentId,
    courseId,
    interventionType,
    strategy: interventionStrategies[interventionType as keyof typeof interventionStrategies] || interventionStrategies.academic_support,
    priority: 'high',
    estimatedImpact: 'high',
    resourcesNeeded: ['tutor time', 'additional materials', 'tracking system'],
    successMetrics: ['improved scores', 'increased engagement', 'better attendance']
  };
}

async function analyzeContentEffectiveness(courseId: string) {
  // Mock content analysis
  return {
    courseId,
    overallEffectiveness: 78,
    recommendations: [
      'Add more interactive elements to theoretical content',
      'Provide multiple content formats for different learning styles',
      'Implement better assessment alignment',
      'Create more engaging introductory materials'
    ],
    contentGaps: [
      'Visual aids for complex concepts',
      'Practical examples for abstract topics',
      'Interactive practice opportunities',
      'Real-world application scenarios'
    ],
    optimizationPriority: 'high'
  };
}

async function generateCustomInsight(query: string, courseId: string) {
  const systemPrompt = `You are SAM, an AI teaching assistant. A teacher has asked a specific question about their course or students. Provide a helpful, data-driven response.

**Teacher Query:** ${query}
**Course ID:** ${courseId}

Provide practical, actionable insights based on educational best practices and data analysis principles.`;

  const analysisText = await runTeacherInsightsChat(
    systemPrompt,
    query,
    { maxTokens: 800, temperature: 0.7 }
  );

  return {
    query,
    response: analysisText,
    recommendations: extractRecommendations(analysisText),
    followUpQuestions: [
      'Would you like more specific data on this topic?',
      'Should I generate an action plan based on this insight?',
      'Would you like me to analyze related metrics?'
    ]
  };
}

async function exportInsightsReport(courseId: string) {
  // Mock report generation
  return {
    courseId,
    reportType: 'comprehensive',
    generatedAt: new Date().toISOString(),
    sections: [
      'Executive Summary',
      'Student Performance Analysis',
      'Engagement Metrics',
      'At-Risk Student Report',
      'Content Effectiveness Analysis',
      'Recommendations & Action Items'
    ],
    format: 'pdf',
    downloadUrl: `/api/reports/teacher-insights-${courseId}-${Date.now()}.pdf`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}

// Helper function to extract recommendations from AI response
function extractRecommendations(text: string): string[] {
  const recommendationRegex = /(?:recommend|suggest|consider|should|try):\s*([^.!?]+)/gi;
  const matches = text.match(recommendationRegex);
  return matches ? matches.map(m => m.replace(/(?:recommend|suggest|consider|should|try):\s*/i, '').trim()).slice(0, 5) : [];
}

function getTimeframeRange(timeframe: string): { startDate: Date | null; previousStartDate: Date | null; endDate: Date } {
  const endDate = new Date();
  let days = 0;
  switch (timeframe) {
    case '7_days':
      days = 7;
      break;
    case '30_days':
      days = 30;
      break;
    case '90_days':
      days = 90;
      break;
    case 'all_time':
    default:
      return { startDate: null, previousStartDate: null, endDate };
  }
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
  return { startDate, previousStartDate, endDate };
}

function calculateTrend(current: number, previous: number) {
  if (previous === 0) {
    return { direction: current > 0 ? 'up' : 'stable', change: current > 0 ? 100 : 0 };
  }
  const change = Math.round(((current - previous) / previous) * 100);
  let direction: 'up' | 'down' | 'stable' = 'stable';
  if (change > 5) direction = 'up';
  else if (change < -5) direction = 'down';
  return { direction, change };
}

function summarizeActiveHours(dates: Date[]): string[] {
  if (!dates.length) return [];
  const hourCounts = new Map<number, number>();
  dates.forEach((date) => {
    const hour = date.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  });
  const topHours = Array.from(hourCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([hour]) => {
      const start = hour.toString().padStart(2, '0');
      const end = ((hour + 2) % 24).toString().padStart(2, '0');
      return `${start}:00-${end}:00`;
    });
  return topHours;
}

function rankByCount(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));
}

function buildContentEngagement(contentTypes: string[]) {
  const ranked = rankByCount(contentTypes);
  const result: Record<string, number> = {};
  ranked.forEach((entry) => {
    result[entry.label] = entry.count;
  });
  return result;
}

function buildContentRatings(
  logs: Array<{ contentType: string | null; score: number | null }>
) {
  const ratings: Record<string, { engagement: number; effectiveness: number; completion: number }> = {};
  logs.forEach((log) => {
    if (!log.contentType) return;
    if (!ratings[log.contentType]) {
      ratings[log.contentType] = { engagement: 0, effectiveness: 0, completion: 0 };
    }
    ratings[log.contentType].engagement += 1;
    if (typeof log.score === 'number') {
      ratings[log.contentType].effectiveness += log.score;
      ratings[log.contentType].completion += log.score >= 70 ? 1 : 0;
    }
  });

  Object.keys(ratings).forEach((key) => {
    const base = ratings[key];
    base.effectiveness = base.engagement ? Math.round(base.effectiveness / base.engagement) : 0;
    base.completion = base.engagement ? Math.round((base.completion / base.engagement) * 100) : 0;
  });
  return ratings;
}

function buildStudyPatternDistribution(dates: Date[]) {
  const buckets = { earlyMorning: 0, midday: 0, evening: 0, lateNight: 0 };
  dates.forEach((date) => {
    const hour = date.getHours();
    if (hour < 8) buckets.earlyMorning += 1;
    else if (hour < 16) buckets.midday += 1;
    else if (hour < 22) buckets.evening += 1;
    else buckets.lateNight += 1;
  });
  return buckets;
}

function buildDailyEngagement(dates: Date[]) {
  const dayCounts = Array(7).fill(0);
  dates.forEach((date) => {
    dayCounts[date.getDay()] += 1;
  });
  return dayCounts;
}

function buildGradeDistribution(scores: number[]) {
  const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  scores.forEach((score) => {
    if (score >= 90) distribution.A += 1;
    else if (score >= 80) distribution.B += 1;
    else if (score >= 70) distribution.C += 1;
    else if (score >= 60) distribution.D += 1;
    else distribution.F += 1;
  });
  return distribution;
}

function buildScoreDistribution(scores: number[]) {
  return {
    '90-100': scores.filter((score) => score >= 90).length,
    '80-89': scores.filter((score) => score >= 80 && score < 90).length,
    '70-79': scores.filter((score) => score >= 70 && score < 80).length,
    '60-69': scores.filter((score) => score >= 60 && score < 70).length,
    'below-60': scores.filter((score) => score < 60).length,
  };
}

function buildChapterPerformance(attempts: Array<{ scorePercentage: number | null; Exam?: { section?: { chapterId: string | null } } }>) {
  const chapterScores = new Map<string, { total: number; count: number }>();
  attempts.forEach((attempt) => {
    const chapterId = attempt.Exam?.section?.chapterId;
    if (!chapterId) return;
    const entry = chapterScores.get(chapterId) ?? { total: 0, count: 0 };
    entry.total += attempt.scorePercentage ?? 0;
    entry.count += 1;
    chapterScores.set(chapterId, entry);
  });

  return Array.from(chapterScores.entries()).map(([chapter, data]) => ({
    chapter,
    average: data.count ? Math.round(data.total / data.count) : 0,
    completion: data.count ? Math.min(100, Math.round((data.count / attempts.length) * 100)) : 0,
  }));
}
