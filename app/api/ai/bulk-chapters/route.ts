import { runSAMChatWithMetadata, handleAIAccessError } from '@/lib/sam/ai-provider';
import { NextRequest, NextResponse } from 'next/server';
import { getCombinedSession } from '@/lib/auth/combined-session';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import {
  ChapterGenerationRequestSchema,
  ChapterGenerationResponseSchema,
  type ChapterGenerationResponse,
  CourseDifficulty
} from '@/lib/ai-course-types';
import * as z from 'zod';

// Force Node.js runtime for better compatibility
export const runtime = 'nodejs';

// Bulk chapter generation request schema
const BulkChapterGenerationRequestSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  chapterCount: z.number().min(2).max(20),
  difficulty: z.nativeEnum(CourseDifficulty),
  targetDuration: z.string().min(1, "Target duration is required"),
  focusAreas: z.array(z.string()).default([]),
  includeKeywords: z.string().optional(),
  additionalInstructions: z.string().optional()
});

type BulkChapterGenerationRequest = z.infer<typeof BulkChapterGenerationRequestSchema>;

const BULK_CHAPTER_SYSTEM_PROMPT = `You are an expert curriculum designer specializing in creating comprehensive course structures. You excel at breaking down complex topics into logical, progressive chapter sequences that build upon each other systematically.

Your expertise includes:
- Creating logical learning progressions that scaffold knowledge effectively
- Designing chapter sequences that maintain engagement and momentum
- Balancing different learning objectives across multiple chapters
- Ensuring each chapter contributes to overall course goals
- Creating realistic time estimates and difficulty progressions

You MUST respond with a valid JSON array containing chapter objects that match the expected schema. Do not include any text outside the JSON array.`;

function buildBulkChapterPrompt(courseData: any, request: BulkChapterGenerationRequest): string {
  const focusAreasText = request.focusAreas.length > 0 
    ? `\n**Focus Areas**: ${request.focusAreas.join(", ")}`
    : '';
  
  const keywordsText = request.includeKeywords 
    ? `\n**Keywords to Include**: ${request.includeKeywords}`
    : '';
  
  const additionalText = request.additionalInstructions 
    ? `\n**Additional Instructions**: ${request.additionalInstructions}`
    : '';

  return `Create a comprehensive ${request.chapterCount}-chapter course structure for the following course:

**Course Title**: ${courseData.title}
**Course Description**: ${courseData.description}
**Course Learning Objectives**: 
${courseData.whatYouWillLearn?.map((obj: string, idx: number) => `${idx + 1}. ${obj}`).join('\n') || 'General course learning objectives'}
**Difficulty Level**: ${request.difficulty}
**Target Duration per Chapter**: ${request.targetDuration}${focusAreasText}${keywordsText}${additionalText}

Design ${request.chapterCount} chapters that:

1. **Follow Logical Progression**:
   - Start with foundational concepts
   - Build complexity gradually
   - Create clear dependencies between chapters
   - Culminate in advanced applications or synthesis

2. **Maintain Learning Momentum**:
   - Each chapter should feel achievable yet challenging
   - Include variety in content types and activities
   - Build on previous learning while introducing new concepts
   - Create clear milestones and achievements

3. **Cover Complete Learning Arc**:
   - Introduction and motivation (early chapters)
   - Core concept development (middle chapters)
   - Application and mastery (later chapters)
   - Integration and assessment (final chapters)

4. **Chapter Structure Guidelines**:
   - Each chapter should have 4-7 sections
   - Include variety in content types (video, article, exercise, assessment)
   - Provide realistic time estimates
   - Create specific, measurable learning outcomes
   - Include prerequisite information

**Difficulty Calibration for ${request.difficulty}**:
${request.difficulty === CourseDifficulty.BEGINNER 
  ? '- Focus on foundational concepts with extensive examples\n- Provide guided practice and step-by-step instructions\n- Use clear, accessible language\n- Include more supportive content and scaffolding'
  : request.difficulty === CourseDifficulty.INTERMEDIATE 
  ? '- Build on established foundations with deeper exploration\n- Include more complex problem-solving scenarios\n- Balance guided and independent practice\n- Introduce advanced concepts with proper context'
  : '- Assume strong foundational knowledge\n- Focus on advanced applications and edge cases\n- Include challenging, open-ended problems\n- Emphasize critical thinking and original analysis'
}

**Content Distribution Guidelines**:
- **Videos**: 20-30% (demonstrations, explanations, introductions)
- **Articles**: 30-40% (detailed content, references, deep dives)
- **Exercises**: 25-35% (hands-on practice, skill building)
- **Assessments**: 10-15% (knowledge validation, progress tracking)

Respond with a JSON array of exactly ${request.chapterCount} chapter objects, each matching this structure:
{
  "title": "string",
  "description": "string",
  "learningOutcomes": ["string"],
  "prerequisites": "string",
  "estimatedTime": "string",
  "difficulty": "string",
  "sections": [
    {
      "title": "string",
      "description": "string",
      "type": "video|article|blog|exercise|assessment",
      "estimatedTime": "string",
      "learningObjectives": ["string"],
      "keyPoints": ["string"]
    }
  ],
  "assessmentSuggestions": [
    {
      "type": "string",
      "description": "string",
      "estimatedTime": "string"
    }
  ]
}`;
}

// Generate mock chapters for fallback
function generateMockChapters(courseData: any, request: BulkChapterGenerationRequest): ChapterGenerationResponse[] {
  const chapters: ChapterGenerationResponse[] = [];
  
  for (let i = 1; i <= request.chapterCount; i++) {
    const isIntro = i <= 2;
    const isAdvanced = i > request.chapterCount * 0.7;
    
    chapters.push({
      title: `Chapter ${i}: ${isIntro ? 'Introduction to' : isAdvanced ? 'Advanced' : 'Understanding'} ${courseData.title || 'Course Content'}`,
      description: `This chapter ${isIntro ? 'introduces fundamental concepts' : isAdvanced ? 'covers advanced topics' : 'explores core principles'} related to ${courseData.title || 'the course subject'}. Students will develop practical skills and theoretical understanding.`,
      learningOutcomes: [
        `Understand key concepts introduced in chapter ${i}`,
        `Apply learned principles to practical scenarios`,
        `Demonstrate proficiency through hands-on exercises`,
        `Analyze real-world examples and case studies`
      ],
      prerequisites: i > 1 ? `Completion of chapters 1-${i-1}` : 'Basic course prerequisites',
      estimatedTime: request.targetDuration,
      difficulty: request.difficulty,
      sections: [
        {
          title: `Chapter ${i} Introduction`,
          description: 'Overview and learning objectives for this chapter',
          type: 'video' as any,
          estimatedTime: '20 minutes',
          learningObjectives: ['Understand chapter structure and goals'],
          keyPoints: ['Chapter overview', 'Key concepts preview', 'Learning objectives']
        },
        {
          title: 'Core Concepts',
          description: 'Detailed exploration of fundamental principles',
          type: 'article' as any,
          estimatedTime: '1.5 hours',
          learningObjectives: ['Master fundamental concepts', 'Understand key relationships'],
          keyPoints: ['Theoretical foundations', 'Key terminology', 'Conceptual frameworks']
        },
        {
          title: 'Practical Application',
          description: 'Hands-on exercises and real-world examples',
          type: 'exercise' as any,
          estimatedTime: '1 hour',
          learningObjectives: ['Apply concepts practically', 'Solve real problems'],
          keyPoints: ['Guided practice', 'Problem-solving techniques', 'Best practices']
        },
        {
          title: 'Knowledge Assessment',
          description: 'Validate understanding and track progress',
          type: 'assessment' as any,
          estimatedTime: '30 minutes',
          learningObjectives: ['Demonstrate mastery', 'Identify learning gaps'],
          keyPoints: ['Knowledge validation', 'Progress tracking', 'Feedback']
        }
      ],
      assessmentSuggestions: [
        {
          type: 'Quiz',
          description: 'Multiple choice questions on key concepts',
          estimatedTime: '15 minutes'
        },
        {
          type: 'Exercise',
          description: 'Practical application of learned skills',
          estimatedTime: '30 minutes'
        }
      ]
    });
  }
  
  return chapters;
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
    const parseResult = BulkChapterGenerationRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: parseResult.error.errors
        },
        { status: 400 }
      );
    }

    const bulkRequest = parseResult.data;

    // Fetch course data - admins can access any course
      const course = await db.course.findUnique({
        where: session.isAdmin
          ? { id: bulkRequest.courseId }
          : { id: bulkRequest.courseId, userId },
      include: {
        chapters: true
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or access denied' },
        { status: 404 }
      );
    }

    // Generate chapters using AI
    try {
      const prompt = buildBulkChapterPrompt(course, bulkRequest);

      // Calculate appropriate max tokens based on chapter count
      // Each chapter with sections needs ~800-1200 tokens
      const tokensPerChapter = 1200;
      const baseTokens = 2000;
      const calculatedMaxTokens = Math.min(
        baseTokens + (bulkRequest.chapterCount * tokensPerChapter),
        16000
      );

      const completion = await withRetryableTimeout(
        () => runSAMChatWithMetadata({
          maxTokens: calculatedMaxTokens,
          temperature: 0.7,
          systemPrompt: BULK_CHAPTER_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          extended: true,
          userId,
          capability: 'course',
        }),
        TIMEOUT_DEFAULTS.AI_GENERATION,
        'bulk-chapters-generation'
      );

      // Extract and parse the response
      const responseText = completion.content;

      if (!responseText) {
        throw new Error('Empty response from AI model');
      }

      // Parse JSON response with recovery logic
      let aiResponse;
      try {
        // Clean the response to extract just the JSON array
        let jsonString = responseText.trim();

        // Remove any markdown code blocks
        jsonString = jsonString.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');

        // Try to find the JSON array
        const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }

        // Try to parse as-is first
        try {
          aiResponse = JSON.parse(jsonString);
        } catch (firstParseError) {
          // If parsing fails, try to recover truncated JSON
          logger.warn('Initial JSON parse failed, attempting recovery...');

          // Try to fix truncated JSON by closing brackets
          let recoveredJson = jsonString;

          // Count open brackets
          const openBrackets = (recoveredJson.match(/\[/g) || []).length;
          const closeBrackets = (recoveredJson.match(/\]/g) || []).length;
          const openBraces = (recoveredJson.match(/\{/g) || []).length;
          const closeBraces = (recoveredJson.match(/\}/g) || []).length;

          // Try to close open structures
          // First, handle any unclosed strings (find last unclosed quote)
          const lastQuoteIndex = recoveredJson.lastIndexOf('"');
          const beforeQuote = recoveredJson.substring(0, lastQuoteIndex + 1);
          const afterQuote = recoveredJson.substring(lastQuoteIndex + 1);

          // If there's content after the last quote that isn't a valid JSON token, truncate
          if (afterQuote && !afterQuote.match(/^[\s,\}\]\:]/)) {
            recoveredJson = beforeQuote + '"';
          }

          // Remove any trailing incomplete property (like `"title":` without value)
          recoveredJson = recoveredJson.replace(/,\s*"[^"]*"\s*:\s*$/, '');
          recoveredJson = recoveredJson.replace(/,\s*"[^"]*"\s*:\s*"[^"]*$/, '');

          // Close unclosed braces and brackets
          for (let i = 0; i < openBraces - closeBraces; i++) {
            recoveredJson += '}';
          }
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            recoveredJson += ']';
          }

          // Clean up any double commas or trailing commas before closing brackets
          recoveredJson = recoveredJson.replace(/,(\s*[\}\]])/g, '$1');
          recoveredJson = recoveredJson.replace(/,\s*,/g, ',');

          try {
            aiResponse = JSON.parse(recoveredJson);
            logger.info('Successfully recovered truncated JSON response');
          } catch (recoveryError) {
            // If recovery still fails, log and throw
            logger.error('JSON recovery failed:', recoveryError);
            logger.error('Original response (first 500 chars):', responseText.substring(0, 500));
            throw new Error('Invalid JSON response from AI model');
          }
        }
      } catch (parseError) {
        logger.error('Failed to parse AI response as JSON:', parseError);
        throw new Error('Invalid JSON response from AI model');
      }

      // Validate each chapter in the response
      const validatedChapters: ChapterGenerationResponse[] = [];
      
      if (Array.isArray(aiResponse)) {
        for (const chapter of aiResponse) {
          const validationResult = ChapterGenerationResponseSchema.safeParse(chapter);
          if (validationResult.success) {
            validatedChapters.push(validationResult.data);
          } else {
            logger.warn('Chapter validation failed:', validationResult.error);
          }
        }
      }

      // If we don't have enough valid chapters, fall back to mock
      if (validatedChapters.length < bulkRequest.chapterCount) {
        logger.warn('Insufficient valid chapters from AI, using mock response');
        const mockChapters = generateMockChapters(course, bulkRequest);
        return NextResponse.json({ 
          success: true, 
          data: mockChapters,
          warning: 'AI response incomplete, using template response'
        });
      }

      return NextResponse.json({
        success: true,
        data: validatedChapters.slice(0, bulkRequest.chapterCount),
        metadata: {
          provider: completion.provider,
          model: completion.model,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (apiError: unknown) {
      if (apiError instanceof OperationTimeoutError) {
        logger.error('Bulk chapters generation timed out:', { operation: apiError.operationName, timeoutMs: apiError.timeoutMs });
        return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
      }

      logger.error('Anthropic API error:', apiError);

      // Fall back to mock response for API errors
      const mockChapters = generateMockChapters(course, bulkRequest);
      return NextResponse.json({
        success: true,
        data: mockChapters,
        warning: 'AI service temporarily unavailable, using template response'
      });
    }

  } catch (error: unknown) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Bulk chapters generation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[BULK_CHAPTERS]', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
