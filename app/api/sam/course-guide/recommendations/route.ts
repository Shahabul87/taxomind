import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { createCourseGuideEngine } from '@sam-ai/educational';
import { db } from '@/lib/db';
import { runSAMChat } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { createCourseGuideAdapter } from '@/lib/adapters';

// Create course guide engine singleton
let courseGuideEngine: ReturnType<typeof createCourseGuideEngine> | null = null;

function getCourseGuideEngine() {
  if (!courseGuideEngine) {
    courseGuideEngine = createCourseGuideEngine({
      aiProvider: 'anthropic',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      databaseAdapter: createCourseGuideAdapter(db as any),
    });
  }
  return courseGuideEngine;
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      courseId,
      focusArea = 'all', // 'content' | 'engagement' | 'marketing' | 'all'
      detailed = true,
    } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Check if user has access to the course
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { 
        userId: true,
        title: true,
        description: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate course guide to get current state
    const engine = getCourseGuideEngine();
    const guide = await engine.generateCourseGuide(courseId, false, false);

    // Generate detailed recommendations based on focus area
    const recommendations = await generateDetailedRecommendations(
      course,
      guide,
      focusArea,
      detailed
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
      metadata: {
        courseId,
        courseTitle: course.title,
        focusArea,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('Generate recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

async function generateDetailedRecommendations(
  course: any,
  guide: any,
  focusArea: string,
  detailed: boolean
): Promise<any> {
  const recommendations: any = {
    priority: [],
    content: [],
    engagement: [],
    marketing: [],
    implementation: [],
  };

  // Priority recommendations based on weakest areas
  const weakestArea = findWeakestArea(guide.metrics);
  recommendations.priority = await generatePriorityRecommendations(
    weakestArea,
    guide.metrics,
    course
  );

  // Generate specific recommendations based on focus area
  if (focusArea === 'all' || focusArea === 'content') {
    recommendations.content = await generateContentRecommendations(
      course,
      guide.metrics.depth,
      guide.insights,
      detailed
    );
  }

  if (focusArea === 'all' || focusArea === 'engagement') {
    recommendations.engagement = await generateEngagementRecommendations(
      course,
      guide.metrics.engagement,
      guide.insights,
      detailed
    );
  }

  if (focusArea === 'all' || focusArea === 'marketing') {
    recommendations.marketing = await generateMarketingRecommendations(
      course,
      guide.metrics.marketAcceptance,
      guide.comparison,
      detailed
    );
  }

  // Generate implementation roadmap
  recommendations.implementation = generateImplementationRoadmap(recommendations);

  return recommendations;
}

function findWeakestArea(metrics: any): string {
  const areas = [
    { name: 'depth', score: metrics.depth.overallDepth },
    { name: 'engagement', score: metrics.engagement.overallEngagement },
    { name: 'marketAcceptance', score: metrics.marketAcceptance.overallAcceptance },
  ];

  return areas.sort((a, b) => a.score - b.score)[0].name;
}

async function generatePriorityRecommendations(
  weakestArea: string,
  metrics: any,
  course: any
): Promise<any[]> {
  const priorities = [];

  switch (weakestArea) {
    case 'depth':
      priorities.push({
        urgency: 'high',
        action: 'Enhance Course Content Depth',
        reason: `Content depth score is only ${metrics.depth.overallDepth.toFixed(0)}%`,
        tasks: [
          'Add comprehensive assessments to each chapter',
          'Include practical exercises and case studies',
          'Create supplementary learning materials',
        ],
        expectedImpact: 'Increase student satisfaction and completion rates by 30%',
        timeframe: '2-3 weeks',
      });
      break;

    case 'engagement':
      priorities.push({
        urgency: 'high',
        action: 'Boost Student Engagement',
        reason: `Engagement score is only ${metrics.engagement.overallEngagement.toFixed(0)}%`,
        tasks: [
          'Implement interactive discussion forums',
          'Add gamification elements',
          'Create milestone rewards',
          'Send progress reminders',
        ],
        expectedImpact: 'Improve retention rate by 40%',
        timeframe: '1-2 weeks',
      });
      break;

    case 'marketAcceptance':
      priorities.push({
        urgency: 'high',
        action: 'Improve Market Position',
        reason: `Market acceptance is only ${metrics.marketAcceptance.overallAcceptance.toFixed(0)}%`,
        tasks: [
          'Optimize course pricing strategy',
          'Enhance course marketing materials',
          'Collect and showcase student testimonials',
          'Create free preview content',
        ],
        expectedImpact: 'Increase enrollments by 50%',
        timeframe: '2-4 weeks',
      });
      break;
  }

  return priorities;
}

async function generateContentRecommendations(
  course: any,
  depthMetrics: any,
  insights: any,
  detailed: boolean
): Promise<any[]> {
  const recommendations = [];

  if (depthMetrics.assessmentQuality < 60) {
    recommendations.push({
      type: 'assessment',
      priority: 'high',
      title: 'Improve Assessment Quality',
      description: 'Your course needs more comprehensive assessments',
      actions: detailed ? [
        'Add quiz after each major topic (5-10 questions)',
        'Create chapter-end comprehensive exams',
        'Include variety of question types (MCQ, true/false, short answer)',
        'Add instant feedback for wrong answers',
        'Create practice tests for certification preparation',
      ] : ['Add more assessments'],
      tools: ['Quiz builder', 'Question bank', 'AI question generator'],
      examples: detailed ? await generateAssessmentExamples(course) : [],
    });
  }

  if (depthMetrics.topicCoverage < 70) {
    recommendations.push({
      type: 'coverage',
      priority: 'medium',
      title: 'Expand Topic Coverage',
      description: 'Add more comprehensive coverage of subject matter',
      actions: detailed ? [
        'Identify and fill content gaps',
        'Add advanced topics for complete learners',
        'Include real-world applications',
        'Create bonus modules for deep dives',
      ] : ['Expand content coverage'],
      suggestedTopics: detailed ? await suggestAdditionalTopics(course) : [],
    });
  }

  return recommendations;
}

async function generateEngagementRecommendations(
  course: any,
  engagementMetrics: any,
  insights: any,
  detailed: boolean
): Promise<any[]> {
  const recommendations = [];

  if (engagementMetrics.completionRate < 50) {
    recommendations.push({
      type: 'completion',
      priority: 'high',
      title: 'Improve Course Completion Rate',
      description: `Only ${engagementMetrics.completionRate.toFixed(0)}% of students complete the course`,
      strategies: detailed ? [
        {
          name: 'Milestone Rewards',
          description: 'Celebrate progress at 25%, 50%, 75% completion',
          implementation: 'Add badges, certificates, or unlock bonus content',
        },
        {
          name: 'Progress Tracking',
          description: 'Visual progress indicators and achievement system',
          implementation: 'Add progress bars, streak counters, and daily goals',
        },
        {
          name: 'Community Support',
          description: 'Peer learning and accountability',
          implementation: 'Create study groups, peer challenges, and forums',
        },
      ] : ['Implement completion incentives'],
      expectedOutcome: 'Increase completion rate to 70%+',
    });
  }

  if (engagementMetrics.interactionFrequency < 40) {
    recommendations.push({
      type: 'interaction',
      priority: 'medium',
      title: 'Increase Student Interaction',
      description: 'Students are not actively engaging with course materials',
      tactics: detailed ? [
        'Add interactive elements (polls, quizzes, discussions)',
        'Create weekly live Q&A sessions',
        'Implement peer review assignments',
        'Add hands-on projects with instructor feedback',
        'Create study challenges and competitions',
      ] : ['Add interactive elements'],
      tools: ['Discussion forums', 'Live streaming', 'Collaboration tools'],
    });
  }

  return recommendations;
}

async function generateMarketingRecommendations(
  course: any,
  marketMetrics: any,
  comparison: any,
  detailed: boolean
): Promise<any[]> {
  const recommendations = [];

  if (marketMetrics.enrollmentGrowth < 20) {
    recommendations.push({
      type: 'growth',
      priority: 'high',
      title: 'Accelerate Enrollment Growth',
      description: 'Course enrollment growth is below market average',
      strategies: detailed ? [
        {
          channel: 'Content Marketing',
          tactics: [
            'Create free mini-course as lead magnet',
            'Write blog posts on course topics',
            'Guest post on relevant platforms',
            'Create YouTube tutorials',
          ],
          budget: '$500-1000/month',
          expectedROI: '3-5x',
        },
        {
          channel: 'Social Proof',
          tactics: [
            'Collect video testimonials',
            'Showcase success stories',
            'Display enrollment numbers',
            'Add instructor credentials',
          ],
          budget: '$0-200',
          expectedROI: '10x+',
        },
        {
          channel: 'Partnerships',
          tactics: [
            'Partner with industry influencers',
            'Affiliate program for students',
            'Corporate training packages',
            'Educational institution deals',
          ],
          budget: 'Revenue share',
          expectedROI: '5-10x',
        },
      ] : ['Implement growth marketing strategies'],
    });
  }

  if (comparison?.marketPosition === 'follower') {
    recommendations.push({
      type: 'positioning',
      priority: 'medium',
      title: 'Improve Market Position',
      description: 'Course is lagging behind competitors',
      differentiators: comparison?.differentiators || [],
      actions: detailed ? [
        'Highlight unique value propositions',
        'Add features competitors lack',
        'Improve pricing strategy',
        'Enhance course branding',
      ] : ['Differentiate from competitors'],
      competitiveAnalysis: detailed ? {
        yourStrengths: comparison?.differentiators || [],
        competitorStrengths: comparison?.gaps || [],
        opportunities: ['Fill market gaps', 'Target underserved segments'],
      } : null,
    });
  }

  return recommendations;
}

async function generateAssessmentExamples(course: any): Promise<any[]> {
  const systemPrompt = `You are SAM. Return ONLY valid JSON with 3 assessment examples for the course.

Schema:
[
  {
    "type": "multiple_choice|true_false|short_answer",
    "question": "string",
    "options": ["string", "..."] (only for multiple_choice),
    "correctAnswer": "string|boolean",
    "sampleAnswer": "string" (only for short_answer)
  }
]`;

  const prompt = `Course title: "${course.title}"
Course description: "${course.description || 'No description provided'}"
Generate 3 varied assessment examples.`;

  const responseText = await runSAMChat({
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 1000,
    temperature: 0.7,
    systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });

  const cleaned = responseText.replace(/```json/i, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fall through to fallback examples.
  }

  return [
    {
      type: 'multiple_choice',
      question: `Which statement best captures a core concept from "${course.title}"?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
    },
    {
      type: 'true_false',
      question: `True or false: "${course.title}" emphasizes practical application.`,
      correctAnswer: true,
    },
    {
      type: 'short_answer',
      question: `Explain one key idea from "${course.title}".`,
      sampleAnswer: 'A concise explanation that references the main concept.',
    },
  ];
}

async function suggestAdditionalTopics(course: any): Promise<string[]> {
  const systemPrompt = `Return ONLY valid JSON: an array of 5 topic strings that would improve the course coverage.`;
  const prompt = `Course title: "${course.title}"
Course description: "${course.description || 'No description provided'}"
Suggest 5 additional topics or sections to fill gaps.`;

  const responseText = await runSAMChat({
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 600,
    temperature: 0.6,
    systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });

  const cleaned = responseText.replace(/```json/i, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'string').slice(0, 5);
    }
  } catch {
    // Fall through to fallback.
  }

  return [
    'Advanced techniques and best practices',
    'Industry case studies and examples',
    'Common mistakes and how to avoid them',
    'Future trends and developments',
    'Practical project walkthroughs',
  ];
}

function generateImplementationRoadmap(recommendations: any): any[] {
  const roadmap = [];
  
  // Week 1-2: High priority items
  const highPriorityItems = [
    ...recommendations.priority,
    ...recommendations.content.filter((r: any) => r.priority === 'high'),
    ...recommendations.engagement.filter((r: any) => r.priority === 'high'),
    ...recommendations.marketing.filter((r: any) => r.priority === 'high'),
  ];

  if (highPriorityItems.length > 0) {
    roadmap.push({
      phase: 'Immediate Actions',
      timeline: 'Week 1-2',
      tasks: highPriorityItems.map((item: any) => ({
        task: item.title || item.action,
        effort: estimateEffort(item),
        impact: item.expectedImpact || 'High',
      })),
    });
  }

  // Week 3-4: Medium priority items
  const mediumPriorityItems = [
    ...recommendations.content.filter((r: any) => r.priority === 'medium'),
    ...recommendations.engagement.filter((r: any) => r.priority === 'medium'),
    ...recommendations.marketing.filter((r: any) => r.priority === 'medium'),
  ];

  if (mediumPriorityItems.length > 0) {
    roadmap.push({
      phase: 'Short-term Improvements',
      timeline: 'Week 3-4',
      tasks: mediumPriorityItems.map((item: any) => ({
        task: item.title,
        effort: estimateEffort(item),
        impact: 'Medium',
      })),
    });
  }

  // Month 2: Long-term strategic items
  roadmap.push({
    phase: 'Strategic Enhancements',
    timeline: 'Month 2',
    tasks: [
      {
        task: 'Measure impact of changes',
        effort: 'Low',
        impact: 'Critical for iteration',
      },
      {
        task: 'Plan next phase of improvements',
        effort: 'Medium',
        impact: 'Sets future direction',
      },
    ],
  });

  return roadmap;
}

function estimateEffort(item: any): string {
  const taskCount = item.tasks?.length || item.actions?.length || 1;
  
  if (taskCount <= 2) return 'Low';
  if (taskCount <= 4) return 'Medium';
  return 'High';
}
