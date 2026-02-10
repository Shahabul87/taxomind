import { runSAMChatWithMetadata, handleAIAccessError } from '@/lib/sam/ai-provider';
import { NextRequest, NextResponse } from 'next/server';
import { getCombinedSession } from '@/lib/auth/combined-session';
import { logger } from '@/lib/logger';
import {
  ChapterGenerationRequestSchema,
  ChapterGenerationResponseSchema,
  type ChapterGenerationRequest,
  type ChapterGenerationResponse,
  CourseDifficulty,
  ContentType
} from '@/lib/ai-course-types';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

// Force Node.js runtime for better compatibility
export const runtime = 'nodejs';

// Rate limiting disabled for now

const CHAPTER_GENERATOR_SYSTEM_PROMPT = `You are an expert curriculum designer specializing in creating detailed, pedagogically sound chapter structures for online courses. You understand how to break down complex topics into digestible learning units that build upon each other systematically.

Your expertise includes:
- Bloom's taxonomy and cognitive learning progression
- Optimal content sequencing and scaffolding
- Balancing different content types for maximum engagement
- Creating measurable learning objectives
- Designing effective assessments that align with objectives
- Estimating realistic completion times based on cognitive load

You MUST respond with a valid JSON object that exactly matches the expected schema. Do not include any text outside the JSON object.`;

function buildChapterPrompt(request: ChapterGenerationRequest): string {
  const previousChaptersContext = request.previousChapters?.length 
    ? `\n**Previous Chapters Covered**:\n${request.previousChapters.map((chapter, idx) => `${idx + 1}. ${chapter}`).join('\n')}`
    : '\n**Note**: This is one of the first chapters in the course.';

  const durationGuidance = request.targetDuration 
    ? `Target chapter duration: ${request.targetDuration}`
    : 'Determine appropriate duration based on content complexity';

  return `Create a detailed chapter structure for the following specifications:

**Course Context**: ${request.courseContext}
**Chapter Topic**: ${request.chapterTopic}
**Chapter Position**: Chapter ${request.position}
**Difficulty Level**: ${request.difficulty}
**Learning Objectives**: 
${request.learningObjectives.map(obj => `- ${obj}`).join('\n')}
${previousChaptersContext}
${durationGuidance}

Design a comprehensive chapter that includes:

1. **Chapter Overview**:
   - Clear, engaging chapter title that reflects the content
   - Detailed description (100-200 words) explaining what students will learn
   - Specific, measurable learning outcomes (4-6 outcomes using action verbs)
   - Prerequisites and connections to previous learning
   - Realistic estimated completion time
   - Difficulty level appropriate for chapter position

2. **Section Structure** (4-7 sections recommended):
   Create sections that follow logical learning progression:
   - **Introduction/Overview Section**: Set context and activate prior knowledge
   - **Core Concept Sections**: Build understanding systematically
   - **Application/Practice Section**: Apply knowledge through exercises
   - **Assessment Section**: Validate learning and provide feedback

   For each section, specify:
   - Clear, descriptive title
   - Detailed description of section content
   - Content type (video, article, blog, exercise, assessment)
   - Estimated completion time (be realistic about cognitive load)
   - Specific learning objectives (2-3 per section)
   - Key points that will be covered

3. **Assessment Strategy**:
   Design assessments that:
   - Align with learning objectives
   - Test different cognitive levels (knowledge, comprehension, application)
   - Provide meaningful feedback
   - Include varied question types

**Content Type Guidelines**:
- **Videos**: Use for demonstrations, explanations, and complex concepts (5-20 minutes)
- **Articles**: For detailed explanations and reference material (10-30 minutes read)
- **Blogs**: For case studies, examples, and current trends (5-15 minutes read)
- **Exercises**: For hands-on practice and skill building (15-60 minutes)
- **Assessments**: For knowledge validation and feedback (10-30 minutes)

**Learning Design Principles**:
- Start with simpler concepts, build to complex applications
- Balance theory with practical application
- Include regular knowledge checks
- Provide varied content types to accommodate different learning styles
- Ensure each section builds logically on previous sections
- Include real-world examples and applications

**Difficulty Calibration**:
${request.difficulty === CourseDifficulty.BEGINNER 
  ? '- Focus on foundational concepts and basic applications\n- Provide extensive examples and guided practice\n- Use simple, clear language\n- Include more supportive content'
  : request.difficulty === CourseDifficulty.INTERMEDIATE 
  ? '- Build on established foundations\n- Include more complex problem-solving\n- Introduce advanced concepts with context\n- Balance guided and independent practice'
  : '- Assume strong foundational knowledge\n- Focus on advanced applications and edge cases\n- Include challenging, open-ended problems\n- Emphasize critical thinking and analysis'
}

Respond with a JSON object that matches this exact structure:
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

// Mock response for fallback
function generateMockResponse(request: ChapterGenerationRequest): ChapterGenerationResponse {
  const chapterNumber = request.position;
  const isIntroChapter = chapterNumber <= 2;
  
  return {
    title: `${isIntroChapter ? 'Introduction to' : 'Advanced'} ${request.chapterTopic}`,
    description: `This chapter provides a ${isIntroChapter ? 'foundational understanding' : 'deep dive'} into ${request.chapterTopic}. You'll learn key concepts, explore practical applications, and build the skills necessary to ${isIntroChapter ? 'get started' : 'master advanced techniques'} in this area.`,
    learningOutcomes: request.learningObjectives.length > 0 
      ? request.learningObjectives 
      : [
          `Understand the core concepts of ${request.chapterTopic}`,
          `Apply key principles in practical scenarios`,
          `Demonstrate proficiency through hands-on exercises`,
          `Analyze real-world examples and case studies`
        ],
    prerequisites: request.position > 1 
      ? `Completion of previous chapters in this course, particularly foundational concepts covered earlier.`
      : `Basic understanding of the subject area and course prerequisites.`,
    estimatedTime: request.targetDuration || `${4 + request.position}–${6 + request.position} hours`,
    difficulty: request.difficulty,
    sections: [
      {
        title: `Introduction to ${request.chapterTopic}`,
        description: `Overview of key concepts and learning objectives for this chapter.`,
        type: ContentType.VIDEO,
        estimatedTime: "20 minutes",
        learningObjectives: [
          "Understand chapter objectives and structure",
          "Preview key concepts to be covered"
        ],
        keyPoints: [
          "Chapter overview and roadmap",
          "Key terminology and definitions",
          "Learning objectives and outcomes"
        ]
      },
      {
        title: "Core Concepts and Principles",
        description: `Deep dive into the fundamental concepts of ${request.chapterTopic}.`,
        type: ContentType.ARTICLE,
        estimatedTime: "2 hours",
        learningObjectives: [
          "Master fundamental concepts and terminology",
          "Understand key principles and their relationships"
        ],
        keyPoints: [
          "Foundational theory and principles",
          "Key terminology and definitions", 
          "Conceptual frameworks and models"
        ]
      },
      {
        title: "Practical Applications and Examples",
        description: `Explore real-world applications and work through guided examples.`,
        type: ContentType.EXERCISE,
        estimatedTime: "1.5 hours",
        learningObjectives: [
          "Apply concepts to solve practical problems",
          "Work through guided examples and case studies"
        ],
        keyPoints: [
          "Step-by-step problem solving",
          "Real-world case studies",
          "Best practices and common pitfalls"
        ]
      },
      {
        title: "Knowledge Check and Review",
        description: `Test your understanding and review key concepts from this chapter.`,
        type: ContentType.ASSESSMENT,
        estimatedTime: "30 minutes",
        learningObjectives: [
          "Validate understanding of chapter concepts",
          "Identify areas for additional review"
        ],
        keyPoints: [
          "Self-assessment questions",
          "Knowledge validation",
          "Progress tracking"
        ]
      }
    ],
    assessmentSuggestions: [
      {
        type: "Multiple Choice Quiz",
        description: "Test understanding of key concepts and terminology",
        estimatedTime: "15 minutes"
      },
      {
        type: "Practical Exercise",
        description: "Apply learned concepts to solve a real-world problem",
        estimatedTime: "45 minutes"
      },
      {
        type: "Reflection Questions",
        description: "Critical thinking questions to deepen understanding",
        estimatedTime: "20 minutes"
      }
    ]
  };
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    // Check authentication - supports both user and admin auth
    const session = await getCombinedSession();
    if (!session.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = ChapterGenerationRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: parseResult.error.errors
        },
        { status: 400 }
      );
    }

    const chapterRequest = parseResult.data;

    // Generate chapter structure using AI
    try {
      const prompt = buildChapterPrompt(chapterRequest);

      const completion = await withRetryableTimeout(
        () => runSAMChatWithMetadata({
          maxTokens: 6000,
          temperature: 0.7,
          systemPrompt: CHAPTER_GENERATOR_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          extended: true,
          userId: session.userId,
          capability: 'course',
        }),
        TIMEOUT_DEFAULTS.AI_GENERATION,
        'chapter-generation'
      );

      // Extract and parse the response
      const responseText = completion.content;

      if (!responseText) {
        throw new Error('Empty response from AI model');
      }

      // Parse JSON response
      let aiResponse;
      try {
        // Clean the response to extract just the JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : responseText;
        aiResponse = JSON.parse(jsonString);
      } catch (parseError) {
        logger.error('Failed to parse AI response as JSON:', parseError);
        throw new Error('Invalid JSON response from AI model');
      }

      // Validate AI response against schema
      const validationResult = ChapterGenerationResponseSchema.safeParse(aiResponse);
      
      if (!validationResult.success) {
        logger.error('AI response validation failed:', validationResult.error);
        // Fall back to mock response if validation fails
        const mockResponse = generateMockResponse(chapterRequest);
        return NextResponse.json({ 
          success: true, 
          data: mockResponse,
          warning: 'AI response validation failed, using template response'
        });
      }

      return NextResponse.json({
        success: true,
        data: validationResult.data,
        metadata: {
          provider: completion.provider,
          model: completion.model,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (apiError: any) {
      logger.error('Anthropic API error:', apiError);
      
      // Fall back to mock response for API errors
      const mockResponse = generateMockResponse(chapterRequest);
      return NextResponse.json({ 
        success: true, 
        data: mockResponse,
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

    logger.error('Chapter generator error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}