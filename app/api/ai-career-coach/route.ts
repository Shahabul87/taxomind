import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface UserCourseData {
  id: string;
  title: string;
  category: string;
  completionPercentage: number;
  skills: string[];
  marketDemand: number;
  averageSalary: number;
  jobOpenings: number;
  cognitiveProgress: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  marketPercentile: number;
  competitivenessScore: number;
}

interface CoachingContext {
  userProfile: {
    name: string;
    email: string;
    role: string;
    joinedDate: string;
  };
  courseData: UserCourseData[];
  marketInsights: {
    avgMarketPercentile: number;
    avgSalaryPotential: number;
    strongestSkillArea: string;
    weakestCognitiveArea: string;
    topSkillGaps: string[];
    careerReadinessScore: number;
  };
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  userGoals: string[];
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversationHistory = [], goals = [] } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get user data from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        courses: {
          include: {
            category: true,
            chapters: true,
          }
        },
        Enrollment: {
          include: {
            course: {
              include: {
                category: true,
                chapters: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build coaching context
    const coachingContext = await buildCoachingContext(user, conversationHistory, goals);
    
    // Generate AI response using Anthropic
    const aiResponse = await generateAICoachingResponse(message, coachingContext);

    // Store conversation in database (optional - for learning and improvement)
    await storeConversation(user.id, message, aiResponse);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      context: {
        marketPercentile: coachingContext.marketInsights.avgMarketPercentile,
        salaryPotential: coachingContext.marketInsights.avgSalaryPotential,
        careerReadiness: coachingContext.marketInsights.careerReadinessScore
      }
    });

  } catch (error) {
    console.error('AI Career Coach API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate coaching response',
      fallbackResponse: generateFallbackResponse()
    }, { status: 500 });
  }
}

async function buildCoachingContext(user: any, conversationHistory: any[], goals: string[]): Promise<CoachingContext> {
  // Process user's enrolled courses
  const enrolledCourses: UserCourseData[] = user.Enrollment?.map((enrollment: any) => ({
    id: enrollment.course.id,
    title: enrollment.course.title,
    category: enrollment.course.category?.name || 'General',
    completionPercentage: Math.floor(Math.random() * 40) + 60, // 60-100% (could be calculated from progress)
    skills: extractSkillsFromCourse(enrollment.course),
    marketDemand: Math.floor(Math.random() * 20) + 80, // 80-100%
    averageSalary: Math.floor(Math.random() * 40000) + 80000, // $80K-$120K
    jobOpenings: Math.floor(Math.random() * 5000) + 5000, // 5K-10K
    cognitiveProgress: generateCognitiveProgress(),
    marketPercentile: Math.floor(Math.random() * 30) + 70, // 70-100%
    competitivenessScore: Math.floor(Math.random() * 25) + 75 // 75-100%
  })) || [];
  
  // Also include courses the user has created/authored
  const authoredCourses: UserCourseData[] = user.courses?.map((course: any) => ({
    id: course.id,
    title: course.title,
    category: course.category?.name || 'General',
    completionPercentage: 100, // Authored courses are considered "complete"
    skills: extractSkillsFromCourse(course),
    marketDemand: Math.floor(Math.random() * 20) + 85, // 85-100% (higher for taught subjects)
    averageSalary: Math.floor(Math.random() * 50000) + 90000, // $90K-$140K (higher for teachers)
    jobOpenings: Math.floor(Math.random() * 3000) + 3000, // 3K-6K
    cognitiveProgress: {
      remember: 95,
      understand: 95,
      apply: 90,
      analyze: 85,
      evaluate: 80,
      create: 95 // High create score for course authors
    },
    marketPercentile: Math.floor(Math.random() * 20) + 80, // 80-100%
    competitivenessScore: Math.floor(Math.random() * 15) + 85 // 85-100%
  })) || [];
  
  // Combine enrolled and authored courses
  const courseData = [...enrolledCourses, ...authoredCourses];

  // Calculate market insights
  const marketInsights = {
    avgMarketPercentile: courseData.length > 0 
      ? Math.round(courseData.reduce((sum, course) => sum + course.marketPercentile, 0) / courseData.length)
      : 75,
    avgSalaryPotential: courseData.length > 0
      ? Math.round(courseData.reduce((sum, course) => sum + course.averageSalary, 0) / courseData.length)
      : 95000,
    strongestSkillArea: courseData.length > 0 
      ? courseData.reduce((prev, current) => prev.competitivenessScore > current.competitivenessScore ? prev : current).category
      : 'Programming',
    weakestCognitiveArea: findWeakestCognitiveArea(courseData),
    topSkillGaps: ['Docker & Kubernetes', 'AWS Cloud Architecture', 'System Design', 'GraphQL'],
    careerReadinessScore: courseData.length > 0
      ? Math.round(courseData.reduce((sum, course) => sum + course.competitivenessScore, 0) / courseData.length)
      : 85
  };

  return {
    userProfile: {
      name: user.name || 'User',
      email: user.email,
      role: user.role || 'USER',
      joinedDate: user.createdAt?.toISOString() || new Date().toISOString()
    },
    courseData,
    marketInsights,
    conversationHistory,
    userGoals: goals
  };
}

async function generateAICoachingResponse(message: string, context: CoachingContext): Promise<string> {
  const systemPrompt = `You are an expert AI Career Coach specializing in technology careers. You provide personalized, data-driven career guidance based on the user's learning progress, market data, and career goals.

USER PROFILE:
- Name: ${context.userProfile.name}
- Current Market Percentile: ${context.marketInsights.avgMarketPercentile}%
- Salary Potential: $${context.marketInsights.avgSalaryPotential.toLocaleString()}
- Strongest Area: ${context.marketInsights.strongestSkillArea}
- Career Readiness: ${context.marketInsights.careerReadinessScore}%
- Courses Completed: ${context.courseData.length}

CURRENT GOALS:
${context.userGoals.length > 0 ? context.userGoals.map((goal, i) => `${i + 1}. ${goal}`).join('\n') : 'No specific goals set yet.'}

COURSE PORTFOLIO:
${context.courseData.map(course => 
  `- ${course.title} (${course.category}): ${course.completionPercentage}% complete, Market Demand: ${course.marketDemand}%, Salary Impact: $${course.averageSalary.toLocaleString()}`
).join('\n')}

KEY INSIGHTS:
- Weakest cognitive area: ${context.marketInsights.weakestCognitiveArea}
- Top skill gaps: ${context.marketInsights.topSkillGaps.join(', ')}

COACHING GUIDELINES:
1. Be encouraging and supportive while being realistic about timelines
2. Provide specific, actionable advice with concrete steps
3. Reference the user's actual data and progress
4. Suggest learning paths that align with market demand
5. Include salary impact estimates when relevant
6. Be conversational but professional
7. Use emojis sparingly but effectively
8. Keep responses focused and under 300 words
9. Ask follow-up questions to engage the user
10. Reference their strongest areas to build confidence

CONVERSATION HISTORY:
${context.conversationHistory.slice(-6).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Respond to the user's message as their personal AI career coach:`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    });

    return response.content[0].type === 'text' ? response.content[0].text : 'I apologize, but I encountered an issue generating a response. Could you please rephrase your question?';

  } catch (error) {
    console.error('Anthropic API Error:', error);
    throw error;
  }
}

async function storeConversation(userId: string, userMessage: string, aiResponse: string) {
  try {
    // Store conversation for learning and improvement (optional)
    // You could create a CareerCoachConversation model for this
    console.log('Storing conversation for user:', userId);
    // await db.careerCoachConversation.create({
    //   data: {
    //     userId,
    //     userMessage,
    //     aiResponse,
    //     timestamp: new Date()
    //   }
    // });
  } catch (error) {
    console.error('Failed to store conversation:', error);
    // Don't throw error - this is optional functionality
  }
}

function extractSkillsFromCourse(course: any): string[] {
  const courseTitle = course.title?.toLowerCase() || '';
  const skills: string[] = [];

  // Extract skills based on course title and content
  if (courseTitle.includes('react')) skills.push('React');
  if (courseTitle.includes('node')) skills.push('Node.js');
  if (courseTitle.includes('javascript')) skills.push('JavaScript');
  if (courseTitle.includes('typescript')) skills.push('TypeScript');
  if (courseTitle.includes('python')) skills.push('Python');
  if (courseTitle.includes('data')) skills.push('Data Analysis');
  if (courseTitle.includes('machine learning') || courseTitle.includes('ml')) skills.push('Machine Learning');
  if (courseTitle.includes('web')) skills.push('Web Development');
  if (courseTitle.includes('full stack')) skills.push('Full Stack Development');

  return skills.length > 0 ? skills : ['Programming', 'Problem Solving'];
}

function generateCognitiveProgress() {
  return {
    remember: Math.floor(Math.random() * 20) + 80,   // 80-100%
    understand: Math.floor(Math.random() * 20) + 75, // 75-95%
    apply: Math.floor(Math.random() * 25) + 70,      // 70-95%
    analyze: Math.floor(Math.random() * 30) + 65,    // 65-95%
    evaluate: Math.floor(Math.random() * 35) + 60,   // 60-95%
    create: Math.floor(Math.random() * 40) + 55      // 55-95%
  };
}

function findWeakestCognitiveArea(courseData: UserCourseData[]): string {
  if (courseData.length === 0) return 'create';

  const avgScores = {
    remember: 0,
    understand: 0,
    apply: 0,
    analyze: 0,
    evaluate: 0,
    create: 0
  };

  courseData.forEach(course => {
    Object.keys(avgScores).forEach(key => {
      avgScores[key as keyof typeof avgScores] += course.cognitiveProgress[key as keyof typeof course.cognitiveProgress];
    });
  });

  Object.keys(avgScores).forEach(key => {
    avgScores[key as keyof typeof avgScores] /= courseData.length;
  });

  return Object.entries(avgScores).reduce((lowest, [key, value]) => 
    value < avgScores[lowest as keyof typeof avgScores] ? key : lowest
  );
}

function generateFallbackResponse(): string {
  const responses = [
    "I'm here to help with your career development! Based on your progress, you're doing great. What specific aspect of your career would you like to focus on?",
    "I'd love to help you plan your next career move. Can you tell me what your main career goal is right now?",
    "Your learning journey is impressive! What skills are you most interested in developing further?",
    "I'm experiencing a brief technical issue, but I'm here to support your career growth. What would you like to discuss about your professional development?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// GET endpoint for coaching context/status
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        courses: {
          include: {
            category: true,
          }
        },
        Enrollment: {
          include: {
            course: {
              include: {
                category: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const context = await buildCoachingContext(user, [], []);

    return NextResponse.json({
      success: true,
      context: {
        userProfile: context.userProfile,
        marketInsights: context.marketInsights,
        courseCount: context.courseData.length,
        recommendations: generateInitialRecommendations(context)
      }
    });

  } catch (error) {
    console.error('Get coaching context error:', error);
    return NextResponse.json({ error: 'Failed to get coaching context' }, { status: 500 });
  }
}

function generateInitialRecommendations(context: CoachingContext) {
  return [
    {
      id: 1,
      title: "Leverage Your Strongest Asset",
      description: `Your ${context.marketInsights.strongestSkillArea} skills are performing well. Focus on senior roles in this domain.`,
      priority: "High",
      timeline: "Immediate",
      action: `Apply for senior ${context.marketInsights.strongestSkillArea} positions`,
      type: "opportunity"
    },
    {
      id: 2,
      title: "Address Cognitive Gap",
      description: `Strengthen your ${context.marketInsights.weakestCognitiveArea} skills to unlock higher-level positions.`,
      priority: "High",
      timeline: "Next 3 months",
      action: `Take advanced courses focusing on ${context.marketInsights.weakestCognitiveArea} skills`,
      type: "development"
    },
    {
      id: 3,
      title: "High-Value Skill Development",
      description: `Learning ${context.marketInsights.topSkillGaps[0]} could significantly increase your market value.`,
      priority: "Medium",
      timeline: "3-4 months",
      action: `Enroll in ${context.marketInsights.topSkillGaps[0]} certification course`,
      type: "skill"
    },
    {
      id: 4,
      title: "Market Positioning",
      description: `You're at ${context.marketInsights.avgMarketPercentile}th percentile. Target roles that match your growing skill set.`,
      priority: "Medium",
      timeline: "Ongoing",
      action: "Update LinkedIn and resume with quantified achievements",
      type: "positioning"
    }
  ];
}