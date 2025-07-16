import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import * as z from 'zod';

// Force Node.js runtime
export const runtime = 'nodejs';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Validation schema
const ContextAwareTutorRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  subject: z.string().optional(),
  learningStyle: z.string().optional(),
  questionContext: z.object({
    examId: z.string(),
    questionId: z.string(),
    difficulty: z.string(),
    bloomsLevel: z.string()
  }).optional()
});

interface StudentContext {
  performanceData: {
    overallScore: number;
    weakBloomsLevels: string[];
    strongBloomsLevels: string[];
    recentTrend: 'improving' | 'declining' | 'stable';
    consistency: number;
  };
  courseProgress: {
    completedSections: number;
    totalSections: number;
    currentChapter: string;
    currentSection: string;
  };
  learningStyle: string;
  recentActivity: {
    lastActiveDate: Date;
    studyFrequency: string;
    timeSpent: number;
  };
}

interface CourseContext {
  course: {
    title: string;
    description: string;
    category: string;
  };
  chapter: {
    title: string;
    description: string;
    learningOutcomes: string[];
  };
  section: {
    title: string;
    content: {
      videos: any[];
      blogs: any[];
      articles: any[];
      notes: any[];
      codeExplanations: any[];
    };
  };
  relatedContent: {
    previousSections: string[];
    upcomingTopics: string[];
    prerequisites: string[];
  };
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = await rateLimit(user.id, 100); // Higher limit for context-aware tutor
    if (!rateLimitResult.success) {
      return new NextResponse('Too many requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      });
    }

    // Parse and validate request
    const body = await req.json();
    const parseResult = ContextAwareTutorRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request format', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const { messages, courseId, chapterId, sectionId, subject, learningStyle, questionContext } = parseResult.data;

    // Gather student context
    const studentContext = await gatherStudentContext(user.id, courseId, sectionId);
    
    // Gather course context
    const courseContext = await gatherCourseContext(courseId, chapterId, sectionId);

    // Create enhanced system prompt
    const systemPrompt = createContextAwareSystemPrompt(
      studentContext,
      courseContext,
      subject,
      learningStyle,
      questionContext
    );

    // Call Anthropic Claude API with enhanced context
    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role as any,
        content: msg.content
      }))
    });

    const responseText = completion.content[0]?.type === 'text' 
      ? completion.content[0].text 
      : 'No response generated';

    // Log interaction for learning analytics
    await logTutorInteraction(user.id, {
      courseId,
      chapterId,
      sectionId,
      messageCount: messages.length,
      responseLength: responseText.length,
      questionContext
    });

    return NextResponse.json({
      id: completion.id,
      content: responseText,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      metadata: {
        tokensUsed: completion.usage?.input_tokens || 0,
        hasContext: !!(courseId && studentContext),
        contextScore: calculateContextScore(studentContext, courseContext)
      }
    });

  } catch (error: any) {
    console.error('Context-aware AI tutor error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}

async function gatherStudentContext(userId: string, courseId?: string, sectionId?: string): Promise<StudentContext | null> {
  if (!courseId) return null;

  try {
    // Get student's exam performance data
    const examAttempts = await db.userExamAttempt.findMany({
      where: {
        userId,
        Exam: courseId ? {
          section: {
            chapter: {
              courseId
            }
          }
        } : undefined
      },
      include: {
        UserAnswer: {
          include: {
            ExamQuestion: {
              select: {
                bloomsLevel: true,
                difficulty: true
              }
            }
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: 20 // Recent attempts
    });

    // Analyze performance patterns
    const scores = examAttempts.map(attempt => attempt.scorePercentage || 0);
    const overallScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

    // Analyze Bloom's levels performance
    const bloomsPerformance: { [key: string]: { correct: number; total: number } } = {};
    examAttempts.forEach(attempt => {
      attempt.UserAnswer.forEach(answer => {
        const bloomsLevel = answer.ExamQuestion.bloomsLevel || 'REMEMBER';
        if (!bloomsPerformance[bloomsLevel]) {
          bloomsPerformance[bloomsLevel] = { correct: 0, total: 0 };
        }
        bloomsPerformance[bloomsLevel].total++;
        if (answer.isCorrect) bloomsPerformance[bloomsLevel].correct++;
      });
    });

    const weakBloomsLevels = Object.entries(bloomsPerformance)
      .filter(([_, perf]) => perf.total > 0 && (perf.correct / perf.total) < 0.6)
      .map(([level, _]) => level);

    const strongBloomsLevels = Object.entries(bloomsPerformance)
      .filter(([_, perf]) => perf.total > 0 && (perf.correct / perf.total) > 0.8)
      .map(([level, _]) => level);

    // Calculate trend
    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (scores.length >= 3) {
      const recentAvg = scores.slice(0, 3).reduce((sum, score) => sum + score, 0) / 3;
      const olderAvg = scores.slice(-3).reduce((sum, score) => sum + score, 0) / 3;
      const improvement = recentAvg - olderAvg;
      if (improvement > 5) recentTrend = 'improving';
      else if (improvement < -5) recentTrend = 'declining';
    }

    // Get course progress
    const courseProgress = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            sections: {
              include: {
                user_progress: {
                  where: { userId }
                }
              }
            }
          }
        }
      }
    });

    const totalSections = courseProgress?.chapters.reduce((sum, chapter) => sum + chapter.sections.length, 0) || 0;
    const completedSections = courseProgress?.chapters.reduce((sum, chapter) => 
      sum + chapter.sections.filter(section => section.user_progress.some(p => p.isCompleted)).length, 0
    ) || 0;

    // Calculate consistency
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - overallScore, 2), 0) / scores.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance));

    return {
      performanceData: {
        overallScore,
        weakBloomsLevels,
        strongBloomsLevels,
        recentTrend,
        consistency
      },
      courseProgress: {
        completedSections,
        totalSections,
        currentChapter: '',
        currentSection: ''
      },
      learningStyle: 'adaptive',
      recentActivity: {
        lastActiveDate: examAttempts[0]?.startedAt || new Date(),
        studyFrequency: 'regular',
        timeSpent: examAttempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0)
      }
    };

  } catch (error) {
    console.error('Error gathering student context:', error);
    return null;
  }
}

async function gatherCourseContext(courseId?: string, chapterId?: string, sectionId?: string): Promise<CourseContext | null> {
  if (!courseId) return null;

  try {
    const courseData = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            sections: {
              include: {
                videos: true,
                blogs: true,
                articles: true,
                notes: true,
                codeExplanations: true
              }
            }
          }
        }
      }
    });

    if (!courseData) return null;

    const currentChapter = chapterId ? courseData.chapters.find(ch => ch.id === chapterId) : null;
    const currentSection = sectionId && currentChapter ? 
      currentChapter.sections.find(sec => sec.id === sectionId) : null;

    return {
      course: {
        title: courseData.title,
        description: courseData.description || '',
        category: courseData.categoryId || 'general'
      },
      chapter: currentChapter ? {
        title: currentChapter.title,
        description: currentChapter.description || '',
        learningOutcomes: currentChapter.learningOutcomes ? [currentChapter.learningOutcomes] : []
      } : {
        title: '',
        description: '',
        learningOutcomes: []
      },
      section: currentSection ? {
        title: currentSection.title,
        content: {
          videos: currentSection.videos,
          blogs: currentSection.blogs,
          articles: currentSection.articles,
          notes: currentSection.notes,
          codeExplanations: currentSection.codeExplanations
        }
      } : {
        title: '',
        content: {
          videos: [],
          blogs: [],
          articles: [],
          notes: [],
          codeExplanations: []
        }
      },
      relatedContent: {
        previousSections: [],
        upcomingTopics: [],
        prerequisites: []
      }
    };

  } catch (error) {
    console.error('Error gathering course context:', error);
    return null;
  }
}

function createContextAwareSystemPrompt(
  studentContext: StudentContext | null,
  courseContext: CourseContext | null,
  subject?: string,
  learningStyle?: string,
  questionContext?: any
): string {
  let prompt = `You are an advanced AI tutor with deep contextual awareness of the student's learning journey, performance patterns, and course content. You provide personalized, adaptive instruction that meets each student exactly where they are in their learning process.

## CORE PRINCIPLES:
1. **Personalized Learning**: Adapt your teaching style to the student's demonstrated strengths and weaknesses
2. **Contextual Awareness**: Reference specific course content, previous lessons, and upcoming topics
3. **Performance-Driven**: Use student's assessment history to identify knowledge gaps and learning patterns
4. **Scaffolded Support**: Provide appropriate level of challenge based on current understanding
5. **Metacognitive Development**: Help students understand their own learning process

## TEACHING APPROACH:
- Use Socratic questioning to guide discovery
- Provide concrete examples from course materials
- Connect new concepts to previously mastered content
- Offer multiple explanations for different learning styles
- Encourage reflection and self-assessment`;

  if (studentContext) {
    prompt += `

## STUDENT PERFORMANCE PROFILE:
- **Overall Academic Performance**: ${studentContext.performanceData.overallScore.toFixed(1)}% average score
- **Learning Trend**: Currently ${studentContext.performanceData.recentTrend}
- **Consistency**: ${studentContext.performanceData.consistency.toFixed(1)}% performance stability
- **Strong Cognitive Areas**: ${studentContext.performanceData.strongBloomsLevels.join(', ') || 'Building foundation'}
- **Growth Areas**: ${studentContext.performanceData.weakBloomsLevels.join(', ') || 'Well-rounded performance'}
- **Course Progress**: ${studentContext.courseProgress.completedSections}/${studentContext.courseProgress.totalSections} sections completed
- **Study Patterns**: ${studentContext.recentActivity.studyFrequency} frequency, ${Math.round(studentContext.recentActivity.timeSpent / 3600)} hours total

## ADAPTIVE INSTRUCTION GUIDELINES:
${studentContext.performanceData.recentTrend === 'declining' ? 
  '- PRIORITY: Rebuild confidence with supportive scaffolding and review of fundamentals' :
  studentContext.performanceData.recentTrend === 'improving' ?
  '- Build on momentum with appropriately challenging questions and concepts' :
  '- Maintain steady progress with balanced challenge and support'
}

${studentContext.performanceData.weakBloomsLevels.length > 0 ? 
  `- Focus on strengthening: ${studentContext.performanceData.weakBloomsLevels.map(level => level.toLowerCase()).join(', ')} thinking skills` :
  '- Continue developing across all cognitive levels'
}

${studentContext.performanceData.consistency < 70 ? 
  '- Emphasize consistent study strategies and knowledge retention techniques' :
  '- Leverage consistent performance patterns to tackle advanced concepts'
}`;
  }

  if (courseContext) {
    prompt += `

## COURSE CONTEXT:
- **Course**: ${courseContext.course.title}
- **Current Chapter**: ${courseContext.chapter.title}
- **Current Section**: ${courseContext.section.title}
- **Learning Objectives**: ${courseContext.chapter.learningOutcomes.join('; ') || 'Mastery of core concepts'}

## AVAILABLE COURSE MATERIALS:
- Videos: ${courseContext.section.content.videos.length} available
- Reading Materials: ${courseContext.section.content.blogs.length + courseContext.section.content.articles.length} items
- Code Examples: ${courseContext.section.content.codeExplanations.length} explanations
- Notes: ${courseContext.section.content.notes.length} student notes

## CONTENT INTEGRATION STRATEGY:
- Reference specific course materials when explaining concepts
- Build connections between current section and previous learning
- Preview upcoming topics to maintain learning momentum
- Use course-specific examples and terminology`;
  }

  if (questionContext) {
    prompt += `

## IMMEDIATE QUESTION CONTEXT:
- **Question Difficulty**: ${questionContext.difficulty}
- **Cognitive Level**: ${questionContext.bloomsLevel}
- **Assessment Context**: Part of structured evaluation

## QUESTION SUPPORT APPROACH:
- Provide hints rather than direct answers
- Guide thinking process step-by-step
- Connect to relevant course concepts
- Encourage self-reflection on reasoning`;
  }

  prompt += `

## RESPONSE GUIDELINES:
1. **Personalize**: Address the student's specific learning profile and needs
2. **Contextualize**: Reference course content and learning objectives
3. **Scaffold**: Provide appropriate level of support based on performance data
4. **Encourage**: Maintain positive, growth-oriented tone
5. **Connect**: Link new learning to previous knowledge and future applications
6. **Assess**: Include questions to check understanding and encourage reflection

Remember: You're not just answering questionsyou're actively facilitating deep, meaningful learning that builds on the student's unique strengths and addresses their specific areas for growth.`;

  return prompt;
}

async function logTutorInteraction(userId: string, interactionData: any) {
  try {
    // In a real implementation, you might log this to a dedicated table
    // For now, we'll skip logging to avoid unnecessary database writes
    console.log('Tutor interaction logged for user:', userId);
  } catch (error) {
    console.error('Error logging tutor interaction:', error);
  }
}

function calculateContextScore(studentContext: StudentContext | null, courseContext: CourseContext | null): number {
  let score = 0;
  
  if (studentContext) {
    score += 50; // Base score for having student context
    if (studentContext.performanceData.overallScore > 0) score += 20;
    if (studentContext.courseProgress.completedSections > 0) score += 15;
  }
  
  if (courseContext) {
    score += 30; // Base score for having course context
    if (courseContext.section.content.videos.length > 0) score += 5;
    if (courseContext.section.content.blogs.length > 0) score += 5;
  }
  
  return Math.min(100, score);
}