import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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

async function generateOverviewInsights(courseId: string | null, timeframe: string) {
  // Mock data - in production, this would query actual database
  const mockData = {
    totalStudents: 45,
    activeStudents: 38,
    completionRate: 76,
    averageScore: 83,
    engagementRate: 82,
    timeSpent: 24.5, // hours per student
    mostActiveHours: ['14:00-16:00', '19:00-21:00'],
    topPerformers: [
      { name: 'Sarah Johnson', score: 97, progress: 100 },
      { name: 'Mike Chen', score: 95, progress: 98 },
      { name: 'Elena Rodriguez', score: 92, progress: 95 }
    ],
    strugglingStudents: [
      { name: 'John Smith', score: 65, progress: 45, risk: 'high' },
      { name: 'Lisa Brown', score: 72, progress: 60, risk: 'medium' }
    ],
    contentPerformance: {
      bestChapters: ['Introduction to AI', 'Machine Learning Basics'],
      challengingChapters: ['Neural Networks', 'Deep Learning'],
      mostEngaging: 'Interactive Coding Examples',
      leastEngaging: 'Theoretical Concepts'
    },
    trends: {
      engagement: { direction: 'up', change: 12 },
      completion: { direction: 'up', change: 8 },
      scores: { direction: 'stable', change: 2 }
    }
  };

  const systemPrompt = `You are SAM, an AI teaching assistant analyzing class performance data. Generate comprehensive insights for a teacher about their class performance.

**Class Data:**
${JSON.stringify(mockData, null, 2)}

**Timeframe:** ${timeframe}

Provide actionable insights including:
- Key performance highlights
- Areas of concern
- Specific recommendations
- Student intervention suggestions
- Content optimization ideas
- Engagement strategies

Make the insights practical and actionable for teachers.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1500,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Generate comprehensive class overview insights for this teacher.' }
    ]
  });

  const aiResponse = response.content[0];
  const analysisText = aiResponse.type === 'text' ? aiResponse.text : '';

  return {
    type: 'overview',
    summary: analysisText,
    metrics: mockData,
    recommendations: extractRecommendations(analysisText),
    alerts: [
      {
        type: 'warning',
        message: '2 students are at risk of falling behind',
        action: 'Schedule intervention meetings'
      },
      {
        type: 'info',
        message: 'Neural Networks chapter has low completion rate',
        action: 'Consider adding more examples'
      }
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
  const mockEngagementData = {
    overallEngagement: 78,
    dailyEngagement: [65, 72, 80, 75, 82, 68, 45], // Mon-Sun
    peakHours: ['14:00-16:00', '19:00-21:00'],
    engagementByContent: {
      videos: 85,
      quizzes: 92,
      discussions: 64,
      assignments: 71,
      reading: 58
    },
    studentEngagement: [
      { name: 'Sarah J.', engagement: 95, lastActive: '2 hours ago' },
      { name: 'Mike C.', engagement: 88, lastActive: '1 day ago' },
      { name: 'Elena R.', engagement: 82, lastActive: '3 hours ago' },
      { name: 'John S.', engagement: 45, lastActive: '5 days ago' }
    ],
    engagementTrends: {
      weekOverWeek: 8, // % increase
      monthOverMonth: 15,
      dropoffPoints: ['Chapter 3 Quiz', 'Assignment 2'],
      highEngagementTriggers: ['Interactive demos', 'Peer discussions']
    }
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

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1200,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analyze the engagement patterns and provide actionable insights.' }
    ]
  });

  const aiResponse = response.content[0];
  const analysisText = aiResponse.type === 'text' ? aiResponse.text : '';

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
    alerts: [
      {
        type: 'warning',
        message: 'John S. hasn\'t been active for 5 days',
        action: 'Send check-in message'
      },
      {
        type: 'info',
        message: 'Quiz engagement is highest among all content types',
        action: 'Consider adding more interactive quizzes'
      }
    ]
  };
}

async function generatePerformanceInsights(courseId: string | null, timeframe: string) {
  const mockPerformanceData = {
    classAverage: 83.2,
    gradeDistribution: {
      'A': 22, 'B': 35, 'C': 28, 'D': 12, 'F': 3
    },
    performanceByChapter: [
      { chapter: 'Introduction', average: 91, completion: 98 },
      { chapter: 'Basics', average: 87, completion: 94 },
      { chapter: 'Intermediate', average: 79, completion: 87 },
      { chapter: 'Advanced', average: 72, completion: 78 }
    ],
    skillsAnalysis: {
      strongest: ['Problem Solving', 'Critical Thinking'],
      weakest: ['Technical Implementation', 'Complex Analysis'],
      improving: ['Communication', 'Collaboration']
    },
    learningOutcomes: {
      met: 78,
      partiallyMet: 18,
      notMet: 4
    },
    assessmentPerformance: {
      quizzes: 86,
      assignments: 81,
      projects: 79,
      finalExam: 83
    }
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

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1200,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analyze the performance data and provide actionable insights.' }
    ]
  });

  const aiResponse = response.content[0];
  const analysisText = aiResponse.type === 'text' ? aiResponse.text : '';

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
  const mockAtRiskData = {
    totalAtRisk: 8,
    riskLevels: {
      high: 3,
      medium: 5,
      low: 12
    },
    riskFactors: {
      lowEngagement: 6,
      poorPerformance: 4,
      missedDeadlines: 7,
      inactivity: 3
    },
    atRiskStudents: [
      {
        name: 'John Smith',
        risk: 'high',
        factors: ['inactivity', 'missed_deadlines', 'low_scores'],
        lastActive: '5 days ago',
        averageScore: 58,
        interventionSuggestions: ['immediate_contact', 'academic_support', 'counseling']
      },
      {
        name: 'Lisa Brown',
        risk: 'medium',
        factors: ['low_engagement', 'declining_scores'],
        lastActive: '2 days ago',
        averageScore: 72,
        interventionSuggestions: ['check_in_meeting', 'study_resources', 'peer_support']
      }
    ],
    earlyWarningSignals: [
      'Students inactive for 3+ days',
      'Score drops of 15+ points',
      'Missed 2+ consecutive assignments',
      'Engagement below 50%'
    ],
    interventionSuccess: {
      contacted: 12,
      improved: 8,
      stillStruggling: 4
    }
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

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1200,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analyze at-risk student patterns and provide intervention strategies.' }
    ]
  });

  const aiResponse = response.content[0];
  const analysisText = aiResponse.type === 'text' ? aiResponse.text : '';

  return {
    type: 'at_risk',
    summary: analysisText,
    metrics: mockAtRiskData,
    recommendations: extractRecommendations(analysisText),
    immediateActions: [
      'Contact John Smith immediately - high risk',
      'Schedule check-in with Lisa Brown',
      'Send engagement survey to class',
      'Review early warning system triggers'
    ],
    preventionStrategies: [
      'Implement weekly check-ins',
      'Create peer support groups',
      'Provide flexible deadline options',
      'Offer multiple support channels'
    ]
  };
}

async function generateLearningPatternInsights(courseId: string | null, timeframe: string) {
  const mockPatternData = {
    learningStyles: {
      visual: 35,
      auditory: 28,
      kinesthetic: 22,
      reading: 15
    },
    studyPatterns: {
      earlyMorning: 18,
      midday: 32,
      evening: 38,
      lateNight: 12
    },
    contentPreferences: {
      videos: 78,
      interactive: 82,
      reading: 45,
      discussions: 67
    },
    pacePreferences: {
      selfPaced: 42,
      structured: 35,
      accelerated: 23
    },
    collaborationStyles: {
      independent: 40,
      smallGroups: 35,
      peerToPeer: 25
    }
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

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analyze learning patterns and suggest teaching adaptations.' }
    ]
  });

  const aiResponse = response.content[0];
  const analysisText = aiResponse.type === 'text' ? aiResponse.text : '';

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
  const mockContentData = {
    contentRatings: {
      videos: { engagement: 85, effectiveness: 82, completion: 78 },
      quizzes: { engagement: 92, effectiveness: 88, completion: 95 },
      readings: { engagement: 58, effectiveness: 72, completion: 65 },
      assignments: { engagement: 71, effectiveness: 79, completion: 83 }
    },
    topPerforming: [
      { title: 'Interactive Demo: AI Basics', type: 'video', rating: 4.8 },
      { title: 'Quick Knowledge Check', type: 'quiz', rating: 4.7 },
      { title: 'Hands-on Project', type: 'assignment', rating: 4.6 }
    ],
    needsImprovement: [
      { title: 'Theoretical Foundations', type: 'reading', rating: 3.2 },
      { title: 'Complex Algorithm Overview', type: 'video', rating: 3.4 },
      { title: 'Advanced Concepts Quiz', type: 'quiz', rating: 3.5 }
    ],
    contentGaps: [
      'More practical examples needed',
      'Better visual aids for complex topics',
      'Interactive elements missing in readings',
      'Assessment alignment issues'
    ]
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

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analyze content effectiveness and provide optimization suggestions.' }
    ]
  });

  const aiResponse = response.content[0];
  const analysisText = aiResponse.type === 'text' ? aiResponse.text : '';

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

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 800,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query }
    ]
  });

  const aiResponse = response.content[0];
  const analysisText = aiResponse.type === 'text' ? aiResponse.text : '';

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