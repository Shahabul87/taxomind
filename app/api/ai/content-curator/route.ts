import { aiClient } from '@/lib/ai/enterprise-client';
import { handleAIAccessError } from '@/lib/ai/route-helper';
import { NextRequest, NextResponse } from 'next/server';
import { getCombinedSession } from '@/lib/auth/combined-session';
import { logger } from '@/lib/logger';
import {
  ContentCurationRequestSchema,
  ContentCurationResponseSchema,
  type ContentCurationRequest,
  type ContentCurationResponse,
  ContentType,
  CourseDifficulty
} from '@/lib/ai-course-types';


// Force Node.js runtime for better compatibility
export const runtime = 'nodejs';

// Rate limiting disabled for now

const CONTENT_CURATOR_SYSTEM_PROMPT = `You are an expert educational content curator and learning experience designer with deep knowledge of online educational resources, pedagogical best practices, and content quality assessment.

Your expertise includes:
- Identifying high-quality educational content across various platforms
- Assessing content for educational value, accuracy, and engagement
- Creating optimal learning sequences and content mixes
- Understanding different learning styles and preferences
- Balancing theoretical knowledge with practical application
- Generating realistic time estimates for content consumption

You specialize in finding and recommending:
- Educational videos (YouTube, Coursera, edX, etc.)
- Articles and tutorials from reputable sources
- Blog posts from industry experts and thought leaders
- Hands-on exercises and projects
- Assessment materials and practice questions

You MUST respond with a valid JSON object that exactly matches the expected schema. Do not include any text outside the JSON object.`;

function buildContentCurationPrompt(request: ContentCurationRequest): string {
  const contentTypesDescription = request.contentTypes.map(type => {
    switch (type) {
      case ContentType.VIDEO:
        return 'Educational videos (tutorials, lectures, demonstrations)';
      case ContentType.ARTICLE:
        return 'In-depth articles and comprehensive guides';
      case ContentType.BLOG:
        return 'Blog posts, case studies, and expert insights';
      case ContentType.EXERCISE:
        return 'Hands-on exercises, projects, and practical activities';
      case ContentType.ASSESSMENT:
        return 'Quizzes, tests, and knowledge validation activities';
      default:
        return type;
    }
  }).join(', ');

  const keywordsContext = request.keywords?.length 
    ? `\n**Keywords to focus on**: ${request.keywords.join(', ')}`
    : '';

  const timeContext = request.estimatedTime 
    ? `\n**Target section duration**: ${request.estimatedTime}`
    : '';

  return `Curate high-quality educational content for the following learning section:

**Section Topic**: ${request.sectionTopic}
**Target Audience**: ${request.targetAudience}
**Difficulty Level**: ${request.difficulty}
**Learning Objectives**: 
${request.learningObjectives.map(obj => `- ${obj}`).join('\n')}
**Requested Content Types**: ${contentTypesDescription}
${keywordsContext}
${timeContext}

Your task is to recommend specific, high-quality educational content that aligns with the learning objectives and provides optimal educational value.

**Content Curation Guidelines**:

1. **Quality Criteria**:
   - Educational value and accuracy
   - Clear explanations and good production quality
   - Up-to-date and relevant information
   - Appropriate difficulty level
   - Good user ratings and reviews (when applicable)

2. **Content Diversity**:
   - Mix of content creators and perspectives
   - Balance between theoretical and practical content
   - Variety of presentation styles and formats
   - Progressive difficulty within content types

3. **Platform Recommendations**:
   - **Videos**: YouTube educational channels, Coursera, edX, Khan Academy, Udemy
   - **Articles**: MDN, W3Schools, official documentation, academic publications
   - **Blogs**: Industry expert blogs, company engineering blogs, Medium publications
   - **Exercises**: Codecademy, freeCodeCamp, HackerRank, LeetCode, project tutorials

4. **Content Assessment**:
   - Quality Score (1-10): Overall content quality and production value
   - Relevance Score (1-10): How well it aligns with learning objectives
   - Provide reasoning for each recommendation

5. **Learning Path Design**:
   Create a logical sequence of learning activities that:
   - Starts with foundational concepts
   - Builds complexity gradually
   - Balances passive and active learning
   - Includes regular practice and reinforcement

**For each content recommendation, provide**:
- Specific title and description
- Realistic time estimates
- Quality and relevance scores with reasoning
- Relevant tags and keywords
- How it contributes to the learning objectives

**Additional Elements to Generate**:
- Study notes highlighting key concepts
- List of essential terms and concepts
- Practice questions for self-assessment
- Optimal content mix recommendations
- Step-by-step learning path

**Difficulty Calibration for ${request.difficulty}**:
${request.difficulty === CourseDifficulty.BEGINNER 
  ? '- Focus on introductory content with clear explanations\n- Include more guided tutorials and step-by-step instructions\n- Emphasize foundational concepts and basic applications'
  : request.difficulty === CourseDifficulty.INTERMEDIATE 
  ? '- Mix foundational reviews with more complex topics\n- Include real-world examples and case studies\n- Balance guided content with independent exploration'
  : '- Focus on advanced techniques and edge cases\n- Include expert-level discussions and analysis\n- Emphasize critical thinking and independent problem-solving'
}

Respond with a JSON object that matches this exact structure:
{
  "recommendedContent": {
    "videos": [
      {
        "title": "string",
        "description": "string",
        "url": "string (optional)",
        "platform": "string (optional)",
        "estimatedTime": "string",
        "difficulty": "string",
        "qualityScore": number (1-10),
        "relevanceScore": number (1-10),
        "tags": ["string"],
        "reasoning": "string"
      }
    ],
    "articles": [...],
    "blogs": [...],
    "exercises": [...]
  },
  "studyNotes": "string",
  "keyConcepts": ["string"],
  "practiceQuestions": ["string"],
  "contentMixRecommendation": {
    "totalItems": number,
    "videoPercentage": number,
    "articlePercentage": number,
    "blogPercentage": number,
    "exercisePercentage": number
  },
  "learningPath": [
    {
      "step": number,
      "activity": "string",
      "estimatedTime": "string",
      "contentType": "video|article|blog|exercise|assessment"
    }
  ]
}`;
}

// Mock response for fallback
function generateMockResponse(request: ContentCurationRequest): ContentCurationResponse {
  const topic = request.sectionTopic;
  
  return {
    recommendedContent: {
      videos: [
        {
          title: `Complete ${topic} Tutorial for Beginners`,
          description: `Comprehensive video tutorial covering all essential aspects of ${topic} with practical examples and demonstrations.`,
          url: undefined,
          platform: "YouTube",
          estimatedTime: "45 minutes",
          difficulty: request.difficulty,
          qualityScore: 8.5,
          relevanceScore: 9.0,
          tags: [topic.toLowerCase(), "tutorial", "beginners", "comprehensive"],
          reasoning: "High-quality tutorial with clear explanations and practical examples, perfect for building foundational understanding."
        },
        {
          title: `Advanced ${topic} Techniques and Best Practices`,
          description: `Deep dive into advanced concepts and professional best practices for ${topic} implementation.`,
          url: undefined,
          platform: "Educational Platform",
          estimatedTime: "1 hour",
          difficulty: request.difficulty,
          qualityScore: 9.0,
          relevanceScore: 8.5,
          tags: [topic.toLowerCase(), "advanced", "best-practices", "professional"],
          reasoning: "Expert-level content that covers advanced techniques and industry best practices."
        }
      ],
      articles: [
        {
          title: `The Complete Guide to ${topic}`,
          description: `Comprehensive article covering theory, implementation, and real-world applications of ${topic}.`,
          url: undefined,
          platform: "Educational Website",
          estimatedTime: "30 minutes",
          difficulty: request.difficulty,
          qualityScore: 8.0,
          relevanceScore: 9.5,
          tags: [topic.toLowerCase(), "guide", "comprehensive", "theory"],
          reasoning: "Well-structured article that provides both theoretical foundation and practical insights."
        }
      ],
      blogs: [
        {
          title: `Real-World ${topic} Case Study`,
          description: `Industry case study showing how ${topic} is applied in professional environments with lessons learned.`,
          url: undefined,
          platform: "Industry Blog",
          estimatedTime: "20 minutes",
          difficulty: request.difficulty,
          qualityScore: 7.5,
          relevanceScore: 8.0,
          tags: [topic.toLowerCase(), "case-study", "real-world", "industry"],
          reasoning: "Provides valuable real-world context and practical application examples."
        }
      ],
      exercises: [
        {
          title: `Hands-on ${topic} Project`,
          description: `Step-by-step project that allows you to practice and apply ${topic} concepts in a practical setting.`,
          url: undefined,
          platform: "Coding Platform",
          estimatedTime: "2 hours",
          difficulty: request.difficulty,
          qualityScore: 8.5,
          relevanceScore: 9.0,
          tags: [topic.toLowerCase(), "project", "hands-on", "practice"],
          reasoning: "Provides essential hands-on practice to reinforce theoretical learning with practical application."
        }
      ]
    },
    studyNotes: `Key concepts for ${topic}:\n\n1. **Foundation**: Understanding the core principles and terminology\n2. **Application**: How to implement and use ${topic} effectively\n3. **Best Practices**: Industry standards and recommended approaches\n4. **Common Pitfalls**: What to avoid and how to troubleshoot issues\n5. **Advanced Techniques**: Professional-level methods and optimizations\n\nRemember to practice regularly and apply concepts to real-world scenarios for better retention.`,
    keyConcepts: [
      `Core principles of ${topic}`,
      "Implementation strategies",
      "Best practices and standards",
      "Common challenges and solutions",
      "Performance considerations",
      "Real-world applications"
    ],
    practiceQuestions: [
      `What are the fundamental principles of ${topic}?`,
      `How would you implement ${topic} in a real-world scenario?`,
      `What are the most common challenges when working with ${topic}?`,
      `How can you optimize performance when using ${topic}?`,
      `What are the best practices for ${topic} implementation?`
    ],
    contentMixRecommendation: {
      totalItems: 5,
      videoPercentage: 40,
      articlePercentage: 20,
      blogPercentage: 20,
      exercisePercentage: 20
    },
    learningPath: [
      {
        step: 1,
        activity: `Watch introduction video to understand ${topic} fundamentals`,
        estimatedTime: "45 minutes",
        contentType: ContentType.VIDEO
      },
      {
        step: 2,
        activity: `Read comprehensive guide for detailed understanding`,
        estimatedTime: "30 minutes",
        contentType: ContentType.ARTICLE
      },
      {
        step: 3,
        activity: `Review real-world case study for practical context`,
        estimatedTime: "20 minutes",
        contentType: ContentType.BLOG
      },
      {
        step: 4,
        activity: `Complete hands-on project to practice skills`,
        estimatedTime: "2 hours",
        contentType: ContentType.EXERCISE
      },
      {
        step: 5,
        activity: `Watch advanced techniques video for deeper knowledge`,
        estimatedTime: "1 hour",
        contentType: ContentType.VIDEO
      }
    ]
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - supports both user and admin auth
    const session = await getCombinedSession();
    if (!session.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Rate limiting disabled for now

    // Parse and validate request body
    const body = await request.json();
    const parseResult = ContentCurationRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request format', 
          details: parseResult.error.errors 
        },
        { status: 400 }
      );
    }

    const curationRequest = parseResult.data;

    // Generate content curation using AI
    try {
      const prompt = buildContentCurationPrompt(curationRequest);

      const completion = await aiClient.chat({
        userId: session.userId!,
        capability: 'analysis',
        maxTokens: 8000,
        temperature: 0.7,
        systemPrompt: CONTENT_CURATOR_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        extended: true,
      });

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
      const validationResult = ContentCurationResponseSchema.safeParse(aiResponse);
      
      if (!validationResult.success) {
        logger.error('AI response validation failed:', validationResult.error);
        // Fall back to mock response if validation fails
        const mockResponse = generateMockResponse(curationRequest);
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
      const mockResponse = generateMockResponse(curationRequest);
      return NextResponse.json({ 
        success: true, 
        data: mockResponse,
        warning: 'AI service temporarily unavailable, using template response'
      });
    }

  } catch (error: any) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('Content curator error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}