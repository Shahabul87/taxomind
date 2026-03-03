import { runSAMChatWithMetadata, handleAIAccessError } from '@/lib/sam/ai-provider';
import { NextRequest, NextResponse } from 'next/server';
import { getCombinedSession } from '@/lib/auth/combined-session';
import { db } from '@/lib/db';
import * as z from 'zod';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

// Force Node.js runtime for better compatibility
export const runtime = 'nodejs';

// Section generation request schema
const SectionGenerationRequestSchema = z.object({
  chapterTitle: z.string().min(1, "Chapter title is required"),
  courseId: z.string().min(1, "Course ID is required"),
  chapterId: z.string().min(1, "Chapter ID is required"),
  sectionCount: z.number().min(1).max(10).default(1),
  userPrompt: z.string().optional(),
  focusArea: z.string().optional()
});

type SectionGenerationRequest = z.infer<typeof SectionGenerationRequestSchema>;

const SECTION_GENERATION_SYSTEM_PROMPT = `You are an expert educational content structurer who specializes in breaking down chapters into logical, progressive sections that optimize learning. You understand how to create sections that build upon each other systematically and maintain student engagement.

Your expertise includes:
- Creating logical learning progressions within chapters
- Designing sections that scaffold knowledge effectively
- Balancing different types of content and activities
- Ensuring each section has clear purpose and outcomes
- Creating realistic time estimates for content consumption
- Understanding cognitive load and attention spans

You MUST respond with a valid JSON array containing section objects. Do not include any text outside the JSON array.`;

function buildSectionGenerationPrompt(request: SectionGenerationRequest): string {
  const focusText = request.focusArea ? `\n**Focus Area**: ${request.focusArea}` : '';
  const userInstructions = request.userPrompt ? `\n**Special Instructions**: ${request.userPrompt}` : '';

  return `Create a comprehensive ${request.sectionCount}-section structure for the following chapter:

**Chapter Title**: ${request.chapterTitle}${focusText}${userInstructions}

**Requirements for Section Structure**:

1. **Section Progression**:
   - Start with introduction/overview
   - Build complexity gradually
   - Include practical application
   - End with assessment/review
   - Create clear dependencies between sections

2. **Section Types to Include**:
   - **Introduction**: Set context and preview content
   - **Concept Sections**: Core knowledge and theory
   - **Application Section**: Hands-on practice and examples
   - **Assessment Section**: Knowledge validation

3. **Section Naming Guidelines**:
   - Clear, descriptive titles
   - Action-oriented when appropriate
   - Specific to the content covered
   - Student-friendly language
   - 3-8 words per title

4. **Content Distribution**:
   - Balance theory with practice
   - Include variety in content types
   - Ensure each section has clear purpose
   - Maintain appropriate scope per section
   - Consider optimal learning sequence

**Section Title Examples**:
- "Introduction to [Topic]"
- "Understanding [Key Concept]"
- "Practical Applications of [Topic]"
- "Hands-on Practice with [Tool/Method]"
- "Common Challenges and Solutions"
- "Real-world Examples and Case Studies"
- "Knowledge Check and Review"
- "Next Steps and Resources"

**Design Principles**:
- Each section should take 15-45 minutes to complete
- Sections should build logically on previous content
- Include both knowledge and application
- Make titles engaging and clear
- Consider different learning preferences
- Ensure sections have distinct purposes

Respond with a JSON array of exactly ${request.sectionCount} section objects, each with this structure:
{
  "title": "string (clear, engaging section title)",
  "description": "string (brief description of section content and purpose)",
  "estimatedTime": "string (realistic time estimate)",
  "contentType": "introduction|concept|application|assessment|review",
  "keyPoints": ["string (3-4 main points covered in this section)"]
}`;
}

// Generate mock sections for fallback
function generateMockSections(request: SectionGenerationRequest): any[] {
  const sections = [];
  const chapterTitle = request.chapterTitle;
  
  for (let i = 1; i <= request.sectionCount; i++) {
    let title, description, contentType;
    
    if (i === 1) {
      title = `Introduction to ${chapterTitle}`;
      description = "Overview and introduction to the chapter concepts";
      contentType = "introduction";
    } else if (i === request.sectionCount) {
      title = "Review and Assessment";
      description = "Knowledge check and review of chapter concepts";
      contentType = "assessment";
    } else if (i <= Math.ceil(request.sectionCount * 0.6)) {
      title = `Understanding ${chapterTitle} - Part ${i - 1}`;
      description = "Core concepts and theoretical knowledge";
      contentType = "concept";
    } else {
      title = `Practical Application of ${chapterTitle}`;
      description = "Hands-on practice and real-world examples";
      contentType = "application";
    }
    
    sections.push({
      title,
      description,
      estimatedTime: "20-30 minutes",
      contentType,
      keyPoints: [
        "Key concept or skill",
        "Practical application",
        "Important considerations",
        "Next steps"
      ]
    });
  }
  
  return sections;
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
    const parseResult = SectionGenerationRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: parseResult.error.errors
        },
        { status: 400 }
      );
    }

    const sectionRequest = parseResult.data;

    // Verify chapter ownership - admins can access any chapter
    const chapter = await db.chapter.findUnique({
      where: {
        id: sectionRequest.chapterId,
        courseId: sectionRequest.courseId,
      },
      include: {
        course: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!chapter || (!session.isAdmin && chapter.course.userId !== userId)) {
      return NextResponse.json(
        { error: 'Chapter not found or access denied' },
        { status: 404 }
      );
    }

    // Generate sections using AI
    try {
      const prompt = buildSectionGenerationPrompt(sectionRequest);

      const completion = await withRetryableTimeout(
        () => runSAMChatWithMetadata({
          maxTokens: 4000,
          temperature: 0.7,
          systemPrompt: SECTION_GENERATION_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          userId,
          capability: 'course',
        }),
        TIMEOUT_DEFAULTS.AI_ANALYSIS,
        'chapter-sections-generation'
      );

      // Extract and parse the response
      const responseText = completion.content;

      if (!responseText) {
        throw new Error('Empty response from AI model');
      }

      // Parse JSON response
      let aiSections;
      try {
        // Clean the response to extract just the JSON array
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : responseText;
        aiSections = JSON.parse(jsonString);
      } catch (parseError) {
        logger.error('Failed to parse AI response as JSON:', parseError);
        throw new Error('Invalid JSON response from AI model');
      }

      // Validate the response is an array with correct length
      if (!Array.isArray(aiSections) || aiSections.length !== sectionRequest.sectionCount) {
        logger.warn('AI response validation failed, using mock response');
        const mockSections = generateMockSections(sectionRequest);
        return NextResponse.json({ 
          success: true, 
          sections: mockSections,
          warning: 'AI response validation failed, using template response'
        });
      }

      return NextResponse.json({
        success: true,
        sections: aiSections,
        metadata: {
          provider: completion.provider,
          model: completion.model,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (apiError: unknown) {
      logger.error('Anthropic API error:', apiError);

      // Fall back to mock response for API errors
      const mockSections = generateMockSections(sectionRequest);
      return NextResponse.json({
        success: true,
        sections: mockSections,
        warning: 'AI service temporarily unavailable, using template response'
      });
    }

  } catch (error: unknown) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[CHAPTER_SECTIONS]', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
