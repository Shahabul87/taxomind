import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { 
  CourseGenerationRequestSchema, 
  CourseGenerationResponseSchema,
  type CourseGenerationRequest,
  type CourseGenerationResponse,
  CourseDifficulty,
  ContentType
} from '@/lib/ai-course-types';

// Force Node.js runtime for better compatibility
export const runtime = 'nodejs';

// Initialize Anthropic client (optional)
let anthropic: Anthropic | null = null;
try {
  if (process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
} catch (error) {
  logger.warn('Anthropic API not configured:', error);
}

const COURSE_PLANNER_SYSTEM_PROMPT = `You are an expert educational designer and curriculum developer with 20+ years of experience creating engaging, effective online courses. Your specialty is transforming learning goals into comprehensive, well-structured course plans that maximize student engagement and learning outcomes.

Your approach follows educational best practices:
- Constructivist learning principles
- Progressive skill building from foundational to advanced concepts
- Balanced content mix optimized for different learning styles
- Clear, measurable learning objectives
- Realistic time estimates based on cognitive load theory
- Industry-relevant, practical applications

You MUST respond with a valid JSON object that exactly matches the expected schema. Do not include any text outside the JSON object.`;

function buildCoursePrompt(request: CourseGenerationRequest): string {
  const contentPreferences = request.preferredContentTypes?.length 
    ? `Preferred content types: ${request.preferredContentTypes.join(', ')}`
    : 'Use a balanced mix of videos, articles, and hands-on exercises';
    
  const learningStyleNote = request.learningStyle 
    ? `Optimize for ${request.learningStyle} learning style`
    : '';

  return `Create a comprehensive course plan for the following requirements:

**Course Topic**: ${request.topic}
**Target Audience**: ${request.targetAudience}
**Duration**: ${request.duration}
**Difficulty Level**: ${request.difficulty}
**Learning Goals**: 
${request.learningGoals.map(goal => `- ${goal}`).join('\n')}

${request.description ? `**Additional Context**: ${request.description}` : ''}
${contentPreferences}
${learningStyleNote}

Generate a detailed course plan that includes:

1. **Course Overview**:
   - Compelling, SEO-friendly title (50-80 characters)
   - Engaging description (150-300 words) that clearly explains value proposition
   - Comprehensive course goals that align with learning objectives
   - Prerequisites and recommended background knowledge
   - Realistic estimated duration in hours
   - Clear target audience definition
   - "What you will learn" outcomes (5-8 specific, measurable outcomes)

2. **Chapter Structure** (4-8 chapters recommended):
   For each chapter, provide:
   - Clear, descriptive title
   - Detailed description explaining chapter focus
   - Specific learning objectives (3-5 per chapter)
   - Estimated completion time
   - Difficulty progression note
   - Prerequisites from previous chapters
   - Section breakdown with:
     * Section title and description
     * Content type (video, article, blog, exercise, assessment)
     * Estimated time per section
     * Specific learning objectives per section

3. **Course Structure Analysis**:
   - Total number of chapters and sections
   - Content mix percentages (video/article/exercise/assessment)
   - Difficulty progression explanation

Ensure the course structure follows these principles:
- Start with foundational concepts, build to advanced applications
- Balance theoretical knowledge with practical application
- Include regular assessment checkpoints
- Maintain engagement with varied content types
- Provide realistic time estimates (consider cognitive load)
- Include prerequisites and dependencies between concepts

Target ${request.difficulty === CourseDifficulty.BEGINNER ? 'beginners with no prior experience' : 
       request.difficulty === CourseDifficulty.INTERMEDIATE ? 'learners with basic foundation knowledge' : 
       'advanced practitioners looking to deepen expertise'}.

Respond with a JSON object that matches this exact structure:
{
  "title": "string",
  "description": "string",
  "courseGoals": "string",
  "prerequisites": ["string"],
  "estimatedDuration": number,
  "targetAudience": "string", 
  "difficulty": "${request.difficulty}",
  "chapters": [
    {
      "title": "string",
      "description": "string", 
      "learningObjectives": ["string"],
      "estimatedTime": "string",
      "difficulty": "string",
      "prerequisites": ["string"],
      "sections": [
        {
          "title": "string",
          "description": "string",
          "contentType": "video|article|blog|exercise|assessment",
          "estimatedTime": "string",
          "learningObjectives": ["string"]
        }
      ]
    }
  ],
  "whatYouWillLearn": ["string"],
  "courseStructure": {
    "totalChapters": number,
    "totalSections": number, 
    "contentMix": {
      "video": number,
      "article": number,
      "blog": number,
      "exercise": number,
      "assessment": number
    }
  }
}`;
}

// Mock response for fallback when API is unavailable
function generateMockResponse(request: CourseGenerationRequest): CourseGenerationResponse {
  return {
    title: `Complete ${request.topic} Mastery Course`,
    description: `A comprehensive ${request.difficulty} course designed for ${request.targetAudience}. This course covers all essential concepts and practical applications to help you master ${request.topic}. Through a carefully structured curriculum combining theory and hands-on practice, you'll build the skills needed to excel in this field.`,
    courseGoals: `By completing this course, you will have a solid understanding of ${request.topic} fundamentals and be able to apply these concepts in real-world scenarios. You'll gain practical experience through projects and exercises designed to reinforce key concepts.`,
    prerequisites: request.difficulty === CourseDifficulty.BEGINNER ? [] : [`Basic understanding of related concepts`, `Familiarity with fundamental principles`],
    estimatedDuration: request.difficulty === CourseDifficulty.BEGINNER ? 20 : 
                       request.difficulty === CourseDifficulty.INTERMEDIATE ? 30 : 40,
    targetAudience: request.targetAudience,
    difficulty: request.difficulty,
    chapters: [
      {
        title: `Introduction to ${request.topic}`,
        description: `Get started with the fundamentals and core concepts of ${request.topic}.`,
        learningObjectives: [
          `Understand basic principles and terminology`,
          `Identify key components and their relationships`,
          `Recognize common patterns and best practices`
        ],
        estimatedTime: "4-6 hours",
        difficulty: "Beginner",
        prerequisites: [],
        sections: [
          {
            title: "Course Overview and Objectives",
            description: "Introduction to the course structure and learning goals",
            contentType: ContentType.VIDEO,
            estimatedTime: "30 minutes",
            learningObjectives: ["Understand course structure", "Set learning expectations"]
          },
          {
            title: "Fundamental Concepts",
            description: "Core principles and terminology",
            contentType: ContentType.ARTICLE,
            estimatedTime: "2 hours",
            learningObjectives: ["Master key terminology", "Understand foundational concepts"]
          },
          {
            title: "Practical Exercise 1",
            description: "Hands-on practice with basic concepts",
            contentType: ContentType.EXERCISE,
            estimatedTime: "1.5 hours",
            learningObjectives: ["Apply learned concepts", "Build practical skills"]
          }
        ]
      },
      {
        title: `Advanced ${request.topic} Techniques`,
        description: `Dive deeper into advanced concepts and professional applications.`,
        learningObjectives: [
          `Master advanced techniques and methodologies`,
          `Solve complex problems using best practices`,
          `Implement professional-grade solutions`
        ],
        estimatedTime: "6-8 hours",
        difficulty: "Intermediate",
        prerequisites: ["Completion of Introduction chapter"],
        sections: [
          {
            title: "Advanced Concepts",
            description: "Deep dive into complex topics",
            contentType: ContentType.VIDEO,
            estimatedTime: "3 hours",
            learningObjectives: ["Understand advanced principles", "Learn complex problem-solving"]
          },
          {
            title: "Case Studies and Examples", 
            description: "Real-world applications and examples",
            contentType: ContentType.ARTICLE,
            estimatedTime: "2 hours",
            learningObjectives: ["Analyze real-world scenarios", "Learn from industry examples"]
          },
          {
            title: "Final Project",
            description: "Comprehensive project applying all learned concepts",
            contentType: ContentType.EXERCISE,
            estimatedTime: "3 hours",
            learningObjectives: ["Synthesize all learning", "Create portfolio-worthy work"]
          },
          {
            title: "Knowledge Assessment",
            description: "Test your understanding of advanced concepts",
            contentType: ContentType.ASSESSMENT,
            estimatedTime: "1 hour",
            learningObjectives: ["Validate learning outcomes", "Identify areas for improvement"]
          }
        ]
      }
    ],
    whatYouWillLearn: [
      `Master the fundamental principles of ${request.topic}`,
      `Apply concepts to solve real-world problems`,
      `Implement best practices and professional techniques`,
      `Build confidence through hands-on practice`,
      `Create portfolio-worthy projects`,
      `Understand industry standards and applications`
    ],
    courseStructure: {
      totalChapters: 2,
      totalSections: 7,
      contentMix: {
        video: 30,
        article: 30,
        blog: 10,
        exercise: 20,
        assessment: 10
      }
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Skip rate limiting for now to avoid Redis issues

    // Parse and validate request body
    const body = await request.json();
    const parseResult = CourseGenerationRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request format', 
          details: parseResult.error.errors 
        },
        { status: 400 }
      );
    }

    const courseRequest = parseResult.data;

    // Check if Anthropic API is configured
    if (!anthropic) {
      logger.warn('ANTHROPIC_API_KEY not configured, using mock response');
      const mockResponse = generateMockResponse(courseRequest);
      return NextResponse.json({ success: true, data: mockResponse });
    }

    // Generate course plan using Anthropic Claude
    try {
      const prompt = buildCoursePrompt(courseRequest);
      
      const completion = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        temperature: 0.7,
        system: COURSE_PLANNER_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      });

      // Extract and parse the response
      const responseText = completion.content[0]?.type === 'text' 
        ? completion.content[0].text 
        : '';

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
      const validationResult = CourseGenerationResponseSchema.safeParse(aiResponse);
      
      if (!validationResult.success) {
        logger.error('AI response validation failed:', validationResult.error);
        // Fall back to mock response if validation fails
        const mockResponse = generateMockResponse(courseRequest);
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
          tokensUsed: completion.usage?.input_tokens || 0,
          model: 'claude-3-5-sonnet-20241022',
          generatedAt: new Date().toISOString()
        }
      });

    } catch (apiError: any) {
      logger.error('Anthropic API error:', apiError);
      
      // Fall back to mock response for API errors
      const mockResponse = generateMockResponse(courseRequest);
      return NextResponse.json({ 
        success: true, 
        data: mockResponse,
        warning: 'AI service temporarily unavailable, using template response'
      });
    }

  } catch (error: any) {
    logger.error('Course planner error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}