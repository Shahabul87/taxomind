import { runSAMChatWithMetadata, handleAIAccessError } from '@/lib/sam/ai-provider';
import { NextRequest, NextResponse } from 'next/server';
import { getCombinedSession } from '@/lib/auth/combined-session';
import * as z from 'zod';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

// Force Node.js runtime for better compatibility
export const runtime = 'nodejs';

// Course content generation request schema
const CourseContentRequestSchema = z.object({
  courseTitle: z.string().min(1, "Course title is required"),
  type: z.enum(["description", "objectives"]),
  userPrompt: z.string().optional(),
  focusArea: z.string().optional()
});

type CourseContentRequest = z.infer<typeof CourseContentRequestSchema>;

const COURSE_CONTENT_SYSTEM_PROMPT = `You are an expert educational content creator who specializes in developing comprehensive course materials. You understand how to create compelling course descriptions and clear learning objectives that engage students and set proper expectations.

Your expertise includes:
- Writing engaging course descriptions that highlight value and outcomes
- Creating measurable, achievable learning objectives
- Understanding different learning styles and student needs
- Aligning content with educational best practices
- Making content accessible and motivating

You MUST respond with ONLY the requested content. Do not include any prefixes, explanations, or additional text.`;

function buildCourseContentPrompt(request: CourseContentRequest): string {
  const focusText = request.focusArea ? `\n**Focus Area**: ${request.focusArea}` : '';
  const userInstructions = request.userPrompt ? `\n**Instructions**: ${request.userPrompt}` : '';

  if (request.type === "description") {
    return `Create a compelling course description for: "${request.courseTitle}"${focusText}${userInstructions}

**Requirements for Course Description**:

1. **Engaging Opening**: Start with what students will achieve or problems they'll solve
2. **Clear Value Proposition**: Explain why this course matters and what makes it unique
3. **Learning Journey**: Describe what students will experience and learn
4. **Target Audience**: Make it clear who this course is for
5. **Outcomes Focus**: Emphasize practical results and skills gained

**Tone and Style**:
- Professional yet accessible
- Inspiring and motivational
- Clear and specific
- Action-oriented language
- 150-250 words typically

**Format**: Write as a cohesive, flowing description without bullet points or lists.

Generate the course description:`;
  } else {
    return `Create clear learning objectives for: "${request.courseTitle}"${focusText}${userInstructions}

**Requirements for Learning Objectives**:

1. **Measurable Outcomes**: Use action verbs (create, analyze, implement, design, etc.)
2. **Specific Skills**: Be precise about what students will be able to do
3. **Progressive Learning**: Show skill building from basic to advanced
4. **Practical Application**: Include real-world applications
5. **Clear Structure**: 4-8 well-defined objectives

**Format**: Provide as an HTML unordered list with proper formatting:
<ul class="list-disc pl-6 space-y-1 mb-3">
<li class="text-slate-800 dark:text-slate-200 leading-relaxed">Objective 1</li>
<li class="text-slate-800 dark:text-slate-200 leading-relaxed">Objective 2</li>
...
</ul>

Generate the learning objectives:`;
  }
}

// Generate mock content for fallback
function generateMockContent(request: CourseContentRequest): string {
  if (request.type === "description") {
    return `This comprehensive ${request.courseTitle} course is designed to provide students with practical skills and theoretical knowledge essential for success in today's dynamic environment. Through hands-on exercises, real-world projects, and expert guidance, learners will develop the confidence and competency needed to excel in their chosen field. The course combines interactive learning experiences with industry best practices, ensuring that students not only understand the concepts but can also apply them effectively. Whether you're a beginner looking to build foundational skills or an experienced professional seeking to enhance your expertise, this course offers valuable insights and practical tools that will advance your learning journey and career prospects.`;
  } else {
    return `<ul class="list-disc pl-6 space-y-1 mb-3">
<li class="text-slate-800 dark:text-slate-200 leading-relaxed">Master the fundamental concepts and principles of ${request.courseTitle}</li>
<li class="text-slate-800 dark:text-slate-200 leading-relaxed">Apply practical skills through hands-on projects and real-world scenarios</li>
<li class="text-slate-800 dark:text-slate-200 leading-relaxed">Develop critical thinking and problem-solving abilities</li>
<li class="text-slate-800 dark:text-slate-200 leading-relaxed">Build confidence in implementing learned concepts independently</li>
<li class="text-slate-800 dark:text-slate-200 leading-relaxed">Create portfolio-worthy projects demonstrating your expertise</li>
<li class="text-slate-800 dark:text-slate-200 leading-relaxed">Understand industry best practices and current trends</li>
</ul>`;
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Check authentication - supports both user and admin auth
    const session = await getCombinedSession();
    if (!session.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = CourseContentRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request format', 
          details: parseResult.error.errors 
        },
        { status: 400 }
      );
    }

    const contentRequest = parseResult.data;

    // Generate content using AI
    try {
      const prompt = buildCourseContentPrompt(contentRequest);

      const completion = await withRetryableTimeout(
        () => runSAMChatWithMetadata({
          maxTokens: 2000,
          temperature: 0.7,
          systemPrompt: COURSE_CONTENT_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          userId: session.userId,
          capability: 'course',
        }),
        TIMEOUT_DEFAULTS.AI_GENERATION,
        'course-content-generation'
      );

      const responseText = completion.content;

      if (!responseText) {
        throw new Error('Empty response from AI model');
      }

      return NextResponse.json({
        success: true,
        content: responseText.trim(),
        metadata: {
          provider: completion.provider,
          model: completion.model,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (apiError: any) {
      logger.error('Anthropic API error:', apiError);
      
      // Fall back to mock response for API errors
      const mockContent = generateMockContent(contentRequest);
      return NextResponse.json({ 
        success: true, 
        content: mockContent,
        warning: 'AI service temporarily unavailable, using template response'
      });
    }

  } catch (error: any) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('Course content generator error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}