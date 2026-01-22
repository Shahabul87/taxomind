import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import * as z from 'zod';
import { logger } from '@/lib/logger';
import { checkAIAccess, recordAIUsage, type AIFeatureType } from "@/lib/ai/subscription-enforcement";

// Force Node.js runtime for better compatibility
export const runtime = 'nodejs';

// Lazy initialize Anthropic client to avoid build-time environment variable errors
// Railway and other platforms don't expose secrets during Docker builds
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// Section content generation request schema
const SectionContentGenerationRequestSchema = z.object({
  sectionTitle: z.string().min(1, "Section title is required"),
  chapterTitle: z.string().min(1, "Chapter title is required"),
  courseId: z.string().min(1, "Course ID is required"),
  chapterId: z.string().min(1, "Chapter ID is required"),
  sectionId: z.string().min(1, "Section ID is required"),
  contentType: z.enum(['learningObjectives', 'description']),
  userPrompt: z.string().optional().transform(val => val === '' ? undefined : val),
  focusArea: z.string().optional().transform(val => val === '' ? undefined : val),
  existingContent: z.string().nullable().optional().transform(val => val === '' ? undefined : val),
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
    learningOutcomes: z.string().nullable().optional(),
    position: z.number().optional(),
  }).optional(),
  sectionContext: z.object({
    position: z.number().optional(),
    existingDescription: z.string().nullable().optional(),
    existingObjectives: z.string().nullable().optional(),
  }).optional(),
});

type SectionContentGenerationRequest = z.infer<typeof SectionContentGenerationRequestSchema>;

// System prompts for different content types
const SYSTEM_PROMPTS = {
  learningObjectives: `You are an expert educational designer specializing in creating clear, measurable learning objectives using Bloom's Taxonomy and SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound).

Your expertise includes:
- Using action verbs from Bloom's Taxonomy (Remember, Understand, Apply, Analyze, Evaluate, Create)
- Creating SMART learning objectives
- Ensuring objectives are measurable and student-focused
- Aligning objectives with content difficulty levels
- Formatting objectives clearly and professionally

You MUST respond with valid HTML formatted content using <ul> and <li> tags. Do not include any text outside the HTML.`,

  description: `You are an expert educational content writer who creates engaging, clear, and informative section descriptions that motivate students and set clear expectations.

Your expertise includes:
- Writing compelling hooks that capture attention
- Explaining content clearly and concisely
- Highlighting real-world relevance and practical applications
- Setting appropriate expectations for learning
- Using professional yet accessible language
- Maintaining student motivation and engagement

You MUST respond with valid HTML formatted content using <p> tags for paragraphs. Do not include any text outside the HTML.`
};

function buildContextSection(request: SectionContentGenerationRequest): string {
  let contextSection = '';

  if (request.courseContext) {
    const { title, description, whatYouWillLearn, courseGoals, difficulty, category } = request.courseContext;
    contextSection += '\n\n## COURSE CONTEXT (Use this to align section content):\n';

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
    const { description, learningOutcomes, position } = request.chapterContext;
    contextSection += '\n## CHAPTER CONTEXT:\n';

    if (position !== undefined) contextSection += `**Chapter Position**: Chapter ${position + 1}\n`;
    if (description) contextSection += `**Chapter Description**: ${description.substring(0, 300)}${description.length > 300 ? '...' : ''}\n`;
    if (learningOutcomes) contextSection += `**Chapter Learning Outcomes**: ${learningOutcomes.substring(0, 300)}${learningOutcomes.length > 300 ? '...' : ''}\n`;
  }

  if (request.sectionContext) {
    const { position, existingDescription, existingObjectives } = request.sectionContext;
    contextSection += '\n## SECTION CONTEXT:\n';

    if (position !== undefined) contextSection += `**Section Position**: Section ${position + 1}\n`;
    if (existingDescription && request.contentType === 'learningObjectives') {
      contextSection += `**Section Description**: ${existingDescription.substring(0, 300)}\n`;
    }
    if (existingObjectives && request.contentType === 'description') {
      contextSection += `**Existing Learning Objectives**: ${existingObjectives.substring(0, 300)}\n`;
    }
  }

  return contextSection;
}

function buildLearningObjectivesPrompt(request: SectionContentGenerationRequest): string {
  const focusText = request.focusArea ? `\n**Focus Area**: ${request.focusArea}` : '';
  const userInstructions = request.userPrompt ? `\n**Special Instructions**: ${request.userPrompt}` : '';
  const contextSection = buildContextSection(request);

  return `Create comprehensive, measurable learning objectives for the following section:

**Section Title**: ${request.sectionTitle}
**Chapter**: ${request.chapterTitle}${focusText}${userInstructions}
${contextSection}
**Requirements**:

1. **Use Bloom's Taxonomy Verbs**:
   - Remember: Define, List, Recall, Identify, Name
   - Understand: Explain, Describe, Summarize, Interpret, Compare
   - Apply: Implement, Use, Execute, Solve, Demonstrate
   - Analyze: Differentiate, Organize, Examine, Compare, Contrast
   - Evaluate: Judge, Critique, Assess, Evaluate, Justify
   - Create: Design, Construct, Create, Develop, Formulate

2. **SMART Criteria**:
   - Specific: Clearly define what students will learn
   - Measurable: Use action verbs that can be assessed
   - Achievable: Appropriate for the section scope
   - Relevant: Aligned with section content
   - Time-bound: Achievable within the section duration

3. **Format Requirements**:
   - Create 3-5 distinct learning objectives
   - Start each with an action verb
   - Be specific about what students will be able to do
   - Use HTML <ul> and <li> tags for formatting
   - Keep each objective to 1-2 sentences maximum

4. **Language Style**:
   - Use "students will be able to" or similar phrasing
   - Be clear and direct
   - Avoid vague terms like "understand" alone (combine with specific outcomes)
   - Use professional educational language

**Example Format**:
<ul>
<li>Explain the fundamental principles of [topic] and their applications in [context]</li>
<li>Apply [concept] to solve real-world problems in [domain]</li>
<li>Analyze the relationship between [A] and [B] to identify key patterns</li>
<li>Evaluate different approaches to [problem] and justify the optimal solution</li>
<li>Create a functional [project/solution] demonstrating mastery of [skills]</li>
</ul>

Respond ONLY with the HTML-formatted learning objectives. No additional text or explanations.`;
}

function buildDescriptionPrompt(request: SectionContentGenerationRequest): string {
  const focusText = request.focusArea ? `\n**Focus Area**: ${request.focusArea}` : '';
  const userInstructions = request.userPrompt ? `\n**Special Instructions**: ${request.userPrompt}` : '';
  const contextSection = buildContextSection(request);

  return `Create a comprehensive, engaging description for the following section:

**Section Title**: ${request.sectionTitle}
**Chapter**: ${request.chapterTitle}${focusText}${userInstructions}
${contextSection}
**Requirements**:

1. **Structure** (4 paragraphs):

   **Paragraph 1 - Hook** (1-2 sentences):
   - Start with an engaging question, fact, or statement
   - Capture student interest immediately
   - Connect to real-world relevance or curiosity

   **Paragraph 2 - Overview** (2-3 sentences):
   - Explain what the section covers
   - Outline main topics and concepts
   - Set clear expectations for content

   **Paragraph 3 - Why It Matters** (1-2 sentences):
   - Explain real-world applications
   - Show practical relevance
   - Motivate learning with benefits

   **Paragraph 4 - What to Expect** (1-2 sentences):
   - Describe learning activities (videos, examples, practice)
   - Mention any hands-on components
   - Set expectations for engagement level

2. **Content Guidelines**:
   - Total length: 150-250 words
   - Tone: Professional yet accessible and encouraging
   - Avoid jargon unless necessary (and explain if used)
   - Use active voice
   - Focus on student benefits and outcomes

3. **Format Requirements**:
   - Use HTML <p> tags for each paragraph
   - No bullet points or lists
   - Clear paragraph breaks
   - Professional formatting

**Example Structure**:
<p>Have you ever wondered how [intriguing question or scenario]? This section explores [topic] and reveals [interesting aspect].</p>
<p>In this section, you'll dive into [main topics]. We'll cover [key concept 1], explore [key concept 2], and understand [key concept 3]. By breaking down these components systematically, you'll gain a comprehensive understanding of [overall topic].</p>
<p>Understanding [topic] is crucial because [real-world application]. Whether you're [use case 1] or [use case 2], these skills will [practical benefit].</p>
<p>Throughout this section, you'll engage with [content type 1], work through [content type 2], and apply your knowledge through [hands-on activity]. By the end, you'll be able to confidently [specific outcome].</p>

Respond ONLY with the HTML-formatted description. No additional text or explanations.`;
}

// Generate mock content for fallback
function generateMockContent(
  type: 'learningObjectives' | 'description',
  request: SectionContentGenerationRequest
): string {
  const { sectionTitle, chapterTitle } = request;

  if (type === 'learningObjectives') {
    return `<ul>
<li>Understand the fundamental concepts and principles of ${sectionTitle}</li>
<li>Apply key techniques and methodologies covered in this section to practical scenarios</li>
<li>Analyze common challenges and evaluate different solution approaches</li>
<li>Create working examples that demonstrate mastery of ${sectionTitle}</li>
</ul>`;
  } else {
    return `<p>Welcome to ${sectionTitle}! This section provides a comprehensive exploration of key concepts that build upon the foundation established in ${chapterTitle}.</p>
<p>Throughout this section, you'll discover essential principles, explore practical applications, and develop hands-on skills. We'll cover core concepts step-by-step, ensuring you gain both theoretical understanding and practical competence.</p>
<p>Understanding ${sectionTitle} is crucial for mastering ${chapterTitle}. These concepts have real-world applications across various domains and will enhance your ability to solve complex problems effectively.</p>
<p>You'll engage with video lectures, work through practical examples, and apply your knowledge through interactive exercises. By the end of this section, you'll be able to confidently apply these principles in real-world contexts.</p>`;
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info('[SECTION_CONTENT] API endpoint called');

    // Check authentication
    const user = await currentUser();
    if (!user?.id) {
      logger.error('[SECTION_CONTENT] Unauthorized - no user');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    logger.info('[SECTION_CONTENT] User authenticated:', user.id);

    // Check subscription tier and usage limits
    const accessCheck = await checkAIAccess(user.id, "lesson");
    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          error: accessCheck.reason || "AI access denied",
          upgradeRequired: accessCheck.upgradeRequired,
          suggestedTier: accessCheck.suggestedTier,
          remainingMonthly: accessCheck.remainingMonthly,
          maintenanceMode: accessCheck.maintenanceMode,
        },
        { status: accessCheck.maintenanceMode ? 503 : 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    logger.info('[SECTION_CONTENT] Request body received:', {
      sectionTitle: body.sectionTitle,
      chapterTitle: body.chapterTitle,
      contentType: body.contentType
    });

    const parseResult = SectionContentGenerationRequestSchema.safeParse(body);

    if (!parseResult.success) {
      logger.error('[SECTION_CONTENT] Validation failed:', parseResult.error.errors);
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: parseResult.error.errors
        },
        { status: 400 }
      );
    }

    logger.info('[SECTION_CONTENT] Request validated successfully');

    const contentRequest = parseResult.data;

    logger.info('[SECTION_CONTENT] Checking section ownership:', {
      sectionId: contentRequest.sectionId,
      chapterId: contentRequest.chapterId,
      courseId: contentRequest.courseId,
      userId: user.id
    });

    // Verify section ownership with simpler query
    try {
      const section = await db.section.findUnique({
        where: {
          id: contentRequest.sectionId
        },
        include: {
          chapter: {
            include: {
              course: true
            }
          }
        }
      });

      if (!section) {
        logger.error('[SECTION_CONTENT] Section not found');
        return NextResponse.json(
          { error: 'Section not found' },
          { status: 404 }
        );
      }

      if (section.chapterId !== contentRequest.chapterId) {
        logger.error('[SECTION_CONTENT] Chapter ID mismatch');
        return NextResponse.json(
          { error: 'Invalid chapter ID' },
          { status: 400 }
        );
      }

      if (section.chapter.courseId !== contentRequest.courseId) {
        logger.error('[SECTION_CONTENT] Course ID mismatch');
        return NextResponse.json(
          { error: 'Invalid course ID' },
          { status: 400 }
        );
      }

      if (section.chapter.course.userId !== user.id) {
        logger.error('[SECTION_CONTENT] User does not own this course');
        return NextResponse.json(
          { error: 'Access denied - you do not own this course' },
          { status: 403 }
        );
      }

      logger.info('[SECTION_CONTENT] Section ownership verified successfully');
    } catch (dbError: any) {
      logger.error('[SECTION_CONTENT] Database error during ownership check:', dbError);
      return NextResponse.json(
        { error: 'Database error', message: dbError.message },
        { status: 500 }
      );
    }

    // Check if ANTHROPIC_API_KEY is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('ANTHROPIC_API_KEY not configured, using mock response');
      const mockContent = generateMockContent(contentRequest.contentType, contentRequest);
      return NextResponse.json({
        success: true,
        content: mockContent,
        warning: 'AI service not configured, using template response'
      });
    }

    // Generate content using Anthropic Claude
    try {
      const systemPrompt = SYSTEM_PROMPTS[contentRequest.contentType];
      const userPrompt = contentRequest.contentType === 'learningObjectives'
        ? buildLearningObjectivesPrompt(contentRequest)
        : buildDescriptionPrompt(contentRequest);

      const anthropic = getAnthropicClient();
      const completion = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
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

      // Clean the response to extract just the HTML
      let htmlContent = responseText.trim();

      // Remove any markdown code blocks if present
      htmlContent = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '');

      // Validate that we have HTML content
      if (!htmlContent.includes('<')) {
        logger.warn('AI response does not contain HTML, using mock response');
        const mockContent = generateMockContent(contentRequest.contentType, contentRequest);
        return NextResponse.json({
          success: true,
          content: mockContent,
          warning: 'AI response validation failed, using template response'
        });
      }

      // Record AI usage after successful response
      await recordAIUsage(user.id, "lesson", 1);

      return NextResponse.json({
        success: true,
        content: htmlContent,
        metadata: {
          tokensUsed: completion.usage?.input_tokens || 0,
          model: 'claude-sonnet-4-5-20250929',
          generatedAt: new Date().toISOString(),
          contentType: contentRequest.contentType
        }
      });

    } catch (apiError: any) {
      logger.error('Anthropic API error:', apiError);

      // Fall back to mock response for API errors
      const mockContent = generateMockContent(contentRequest.contentType, contentRequest);
      return NextResponse.json({
        success: true,
        content: mockContent,
        warning: 'AI service temporarily unavailable, using template response'
      });
    }

  } catch (error: any) {
    logger.error('Section content generator error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}
