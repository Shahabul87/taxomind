import { runSAMChatWithMetadata, handleAIAccessError } from '@/lib/sam/ai-provider';
import { NextRequest, NextResponse } from 'next/server';
import { getCombinedSession } from '@/lib/auth/combined-session';
import * as z from 'zod';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

// Force Node.js runtime for better compatibility
export const runtime = 'nodejs';

// Chapter content generation request schema - with full context support
const ChapterContentRequestSchema = z.object({
  chapterTitle: z.string().min(1, "Chapter title is required"),
  type: z.enum(["description", "objectives"]),
  userPrompt: z.string().optional(),
  focusArea: z.string().optional(),
  // Rich context fields
  courseContext: z.object({
    title: z.string().optional(),
    description: z.string().nullable().optional(),
    whatYouWillLearn: z.array(z.string()).optional(),
    courseGoals: z.string().nullable().optional(),
    difficulty: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
  }).optional(),
  chapterContext: z.object({
    description: z.string().nullable().optional(),
    position: z.number().optional(),
    existingObjectives: z.string().nullable().optional(),
  }).optional(),
});

type ChapterContentRequest = z.infer<typeof ChapterContentRequestSchema>;

const CHAPTER_CONTENT_SYSTEM_PROMPT = `You are an expert educational content creator who specializes in developing clear, engaging chapter content for online courses. You understand how to create content that facilitates effective learning and student engagement.

Your expertise includes:
- Creating compelling chapter descriptions that motivate students
- Writing clear, measurable learning objectives using action verbs
- Structuring content for optimal learning progression
- Making complex topics accessible and engaging
- Understanding different learning styles and cognitive load

You MUST respond with ONLY the requested content type (description OR learning objectives) without any additional formatting, headers, or explanations. The content should be ready to use directly in the course.`;

function buildChapterContentPrompt(request: ChapterContentRequest): string {
  const focusText = request.focusArea ? `\n**Focus Area**: ${request.focusArea}` : '';
  const userInstructions = request.userPrompt ? `\n**Special Instructions**: ${request.userPrompt}` : '';

  // Build rich context section
  let contextSection = '';

  if (request.courseContext) {
    const { title, description, whatYouWillLearn, courseGoals, difficulty, category } = request.courseContext;
    contextSection += '\n\n## COURSE CONTEXT (Use this to align chapter content):\n';

    if (title) contextSection += `**Course Title**: ${title}\n`;
    if (category) contextSection += `**Category**: ${category}\n`;
    if (difficulty) contextSection += `**Difficulty Level**: ${difficulty}\n`;
    if (description) contextSection += `**Course Description**: ${description.substring(0, 500)}${description.length > 500 ? '...' : ''}\n`;
    if (courseGoals) contextSection += `**Course Goals**: ${courseGoals}\n`;
    if (whatYouWillLearn && whatYouWillLearn.length > 0) {
      contextSection += `**Course Learning Outcomes**:\n${whatYouWillLearn.slice(0, 5).map((obj, i) => `  ${i + 1}. ${obj}`).join('\n')}\n`;
    }
  }

  if (request.chapterContext) {
    const { description, position, existingObjectives } = request.chapterContext;
    contextSection += '\n## CHAPTER CONTEXT:\n';

    if (position !== undefined) contextSection += `**Chapter Position**: Chapter ${position + 1}\n`;
    if (description) contextSection += `**Chapter Description**: ${description.substring(0, 300)}${description.length > 300 ? '...' : ''}\n`;
    if (existingObjectives && request.type === 'description') {
      contextSection += `**Existing Learning Objectives**: ${existingObjectives.substring(0, 300)}\n`;
    }
  }

  if (request.type === "description") {
    return `Create a comprehensive, engaging chapter description for the following chapter:

**Chapter Title**: ${request.chapterTitle}${focusText}${userInstructions}${contextSection}

**Requirements for Chapter Description**:
1. **Length**: 2-4 paragraphs (200-400 words)
2. **Structure**:
   - Opening: Hook the reader and explain what they'll learn
   - Body: Describe key concepts, skills, and knowledge they'll gain
   - Conclusion: Explain how this chapter fits into the bigger picture
3. **Tone**: Engaging, motivational, and clear
4. **Content**:
   - Explain what students will learn and why it matters
   - Describe practical applications and real-world relevance
   - Build excitement and motivation for learning
   - **IMPORTANT**: Connect to the course objectives and goals provided above
5. **Format**: Use HTML formatting for better readability (paragraphs, bold text, etc.)

**Writing Guidelines**:
- Use active voice and engaging language
- Include specific benefits students will gain
- Make it scannable with clear paragraph breaks
- Avoid jargon unless explained
- Show the practical value of the content
- **Reference the course context** when explaining how this chapter contributes to overall learning

Generate ONLY the chapter description content, ready to use directly in the course.`;
  } else {
    return `Create clear, measurable learning objectives for the following chapter:

**Chapter Title**: ${request.chapterTitle}${focusText}${userInstructions}${contextSection}

**Requirements for Learning Objectives**:
1. **Format**: Use HTML unordered list format (<ul><li>...)</li></ul>)
2. **Quantity**: 4-6 specific learning objectives
3. **Structure**: Each objective should follow the format "Students will be able to..."
4. **Action Verbs**: Use measurable action verbs from Bloom's taxonomy:
   - Knowledge: define, identify, list, name, recognize
   - Comprehension: explain, describe, summarize, interpret
   - Application: apply, demonstrate, use, solve, implement
   - Analysis: analyze, compare, examine, evaluate
   - Synthesis: create, design, develop, formulate
   - Evaluation: assess, critique, judge, recommend

5. **Alignment**:
   - **CRITICAL**: Align with the course learning outcomes provided above
   - Each chapter objective should contribute to overall course goals
   - Consider the chapter's position in the course progression
   - Build upon concepts from earlier chapters (if applicable)

6. **Specificity**: Each objective should be:
   - Specific and clear
   - Measurable and observable
   - Achievable within the chapter scope
   - Relevant to the chapter content and course goals
   - Appropriately challenging for the course difficulty level

**Content Guidelines**:
- Start each objective with "Students will be able to..."
- Use one action verb per objective
- Be specific about what exactly students will achieve
- Include both knowledge and skills where appropriate
- Progress from basic to advanced concepts
- Ensure objectives align with both the chapter title AND course objectives

**Example Format**:
<ul>
<li>Students will be able to define and explain the key concepts of [topic]</li>
<li>Students will be able to apply [specific technique] to solve [type of problem]</li>
<li>Students will be able to analyze and compare different [approaches/methods]</li>
</ul>

Generate ONLY the learning objectives in HTML list format, ready to use directly in the course.`;
  }
}

// Generate mock content for fallback
function generateMockContent(request: ChapterContentRequest): string {
  if (request.type === "description") {
    return `<p>This chapter focuses on <strong>${request.chapterTitle}</strong>, providing students with essential knowledge and practical skills in this important area.</p>

<p>Throughout this chapter, you'll explore key concepts, learn practical applications, and gain hands-on experience that will enhance your understanding. The content is designed to be both informative and engaging, with real-world examples that demonstrate the relevance of these concepts.</p>

<p>By the end of this chapter, you'll have a solid foundation that prepares you for more advanced topics and practical application in your field of study.</p>`;
  } else {
    return `<ul>
<li>Students will be able to define and explain the key concepts related to ${request.chapterTitle}</li>
<li>Students will be able to apply the principles learned to practical scenarios</li>
<li>Students will be able to analyze and evaluate different approaches within this topic</li>
<li>Students will be able to demonstrate proficiency through hands-on exercises</li>
<li>Students will be able to connect this chapter's content to broader course objectives</li>
</ul>`;
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Check authentication - supports both user and admin auth
    const session = await getCombinedSession();
    const userId = session.userId;
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = ChapterContentRequestSchema.safeParse(body);
    
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
      const prompt = buildChapterContentPrompt(contentRequest);

      const completion = await withRetryableTimeout(
        () => runSAMChatWithMetadata({
          maxTokens: 2000,
          temperature: 0.7,
          systemPrompt: CHAPTER_CONTENT_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          userId,
          capability: 'course',
        }),
        TIMEOUT_DEFAULTS.AI_GENERATION,
        'chapter-content-generation'
      );

      // Extract the response
      const responseText = completion.content;

      if (!responseText) {
        throw new Error('Empty response from AI model');
      }

      // Clean and validate the response
      const cleanedContent = responseText.trim();
      
      // Basic validation - ensure we have actual content
      if (cleanedContent.length < 50) {
        throw new Error('Generated content too short');
      }

      return NextResponse.json({
        success: true,
        content: cleanedContent,
        metadata: {
          provider: completion.provider,
          model: completion.model,
          generatedAt: new Date().toISOString(),
          type: contentRequest.type
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

    logger.error('Chapter content generator error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}
