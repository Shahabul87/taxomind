import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import * as z from 'zod';
import { logger } from '@/lib/logger';

// Force Node.js runtime for better compatibility
export const runtime = 'nodejs';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Lesson content generation request schema
const LessonGeneratorRequestSchema = z.object({
  sectionTitle: z.string().min(1, "Section title is required"),
  chapterTitle: z.string().optional(),
  courseTitle: z.string().optional(),
  contentType: z.enum(["article", "blog", "study_guide", "lesson_plan", "tutorial"]).default("article"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  targetAudience: z.string().optional(),
  learningObjectives: z.array(z.string()).optional(),
  estimatedTime: z.string().optional(),
  includeExamples: z.boolean().default(true),
  includeExercises: z.boolean().default(true),
  includeResources: z.boolean().default(true),
  tone: z.enum(["professional", "casual", "academic", "conversational"]).default("professional"),
  userPrompt: z.string().optional(),
});

type LessonGeneratorRequest = z.infer<typeof LessonGeneratorRequestSchema>;

const LESSON_GENERATOR_SYSTEM_PROMPT = `You are an expert educational content creator and instructional designer specializing in creating engaging, comprehensive lesson content. You have extensive experience in online education, content structuring, and making complex topics accessible to learners.

Your expertise includes:
- Writing clear, engaging educational content that maintains learner attention
- Structuring information for optimal learning and retention
- Creating practical examples and real-world applications
- Designing exercises that reinforce key concepts
- Adapting content for different learning styles and difficulty levels
- Including relevant resources and further reading recommendations

You MUST respond with ONLY valid HTML content formatted for educational delivery. Do not include any prefixes, explanations, or additional text outside the HTML.`;

function buildLessonGeneratorPrompt(request: LessonGeneratorRequest): string {
  const contextInfo = [
    request.courseTitle && `course: ${request.courseTitle}`,
    request.chapterTitle && `Chapter: ${request.chapterTitle}`,
    `Section: ${request.sectionTitle}`
  ].filter(Boolean).join('\n');

  const audienceText = request.targetAudience ? `\n**Target Audience**: ${request.targetAudience}` : '';
  const objectivesText = request.learningObjectives?.length ? 
    `\n**Learning Objectives**: ${request.learningObjectives.join(', ')}` : '';
  const timeText = request.estimatedTime ? `\n**Estimated Time**: ${request.estimatedTime}` : '';
  const userInstructions = request.userPrompt ? `\n**Special Instructions**: ${request.userPrompt}` : '';

  const contentTypeInstructions = {
    article: "Create a comprehensive educational article with clear sections, explanations, and examples",
    blog: "Write an engaging blog-style lesson that's conversational yet informative",
    study_guide: "Develop a structured study guide with key points, summaries, and review sections",
    lesson_plan: "Create a detailed lesson plan with activities, discussions, and assessments",
    tutorial: "Build a step-by-step tutorial with practical instructions and examples"
  };

  return `Create comprehensive ${request.contentType} content for: "${request.sectionTitle}"

${contextInfo}${audienceText}${objectivesText}${timeText}${userInstructions}

**Content Requirements**:

1. **Content Type**: ${contentTypeInstructions[request.contentType]}
2. **Difficulty Level**: ${request.difficulty} - adjust complexity and terminology accordingly
3. **Tone**: ${request.tone} - maintain this tone throughout the content
4. **Examples**: ${request.includeExamples ? 'Include relevant, practical examples' : 'Focus on concepts without extensive examples'}
5. **Exercises**: ${request.includeExercises ? 'Include practice exercises and activities' : 'Focus on content delivery without exercises'}
6. **Resources**: ${request.includeResources ? 'Include additional resources and references' : 'Keep content self-contained'}

**Content Structure Guidelines**:

For ${request.contentType}:
${request.contentType === 'article' ? `
- Start with an engaging introduction that hooks the reader
- Use clear headings and subheadings (H2, H3 tags)
- Include practical examples and case studies
- Break up text with bullet points and numbered lists
- End with a summary of key takeaways
` : request.contentType === 'blog' ? `
- Begin with a compelling hook or question
- Use conversational language while maintaining educational value
- Include personal insights or industry perspectives
- Use engaging subheadings and short paragraphs
- Include actionable tips and recommendations
` : request.contentType === 'study_guide' ? `
- Create clear sections for different topics
- Use bullet points for key concepts
- Include definitions and terminology
- Add review questions or checkpoints
- Provide summary boxes for important information
` : request.contentType === 'lesson_plan' ? `
- Include lesson overview and objectives
- Break down into timed segments or activities
- Add discussion prompts and questions
- Include assessment or reflection activities
- Provide instructor notes where relevant
` : `
- Start with clear learning goals
- Break down into sequential steps
- Include screenshots or code examples where applicable
- Add troubleshooting tips
- End with practice exercises or next steps
`}

**HTML Formatting Requirements**:
- Use semantic HTML tags (h1, h2, h3, p, ul, ol, li, strong, em)
- Apply consistent styling with classes:
  - Main headings: <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
  - Section headings: <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
  - Subsection headings: <h3 class="text-xl font-medium text-gray-700 dark:text-gray-300 mb-3">
  - Paragraphs: <p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
  - Lists: <ul class="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
  - Important text: <strong class="font-semibold text-gray-900 dark:text-white">
  - Code: <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
  - Code blocks: <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">
  - Callout boxes: <div class="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 p-4 mb-4">

**Content Guidelines**:
- Make content engaging and easy to follow
- Use clear, concise language appropriate for the difficulty level
- Include practical applications and real-world relevance
- Break complex concepts into digestible chunks
- Use visual hierarchy with proper heading structure
- Ensure content flows logically from introduction to conclusion

Generate the ${request.contentType} content in HTML format:`;
}

// Generate mock lesson content for fallback
function generateMockLessonContent(request: LessonGeneratorRequest): string {
  const title = request.sectionTitle;
  const mockContent = `
<div class="lesson-content">
  <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">${title}</h1>
  
  <div class="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 p-4 mb-6">
    <h3 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Learning Objectives</h3>
    <ul class="list-disc pl-6 text-blue-700 dark:text-blue-300">
      ${request.learningObjectives?.map(obj => `<li>${obj}</li>`).join('') || 
        `<li>Understand the key concepts of ${title}</li>
         <li>Apply the knowledge in practical scenarios</li>
         <li>Master the fundamental principles</li>`}
    </ul>
  </div>

  <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Introduction</h2>
  <p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
    Welcome to this comprehensive lesson on ${title}. This ${request.contentType} will guide you through 
    the essential concepts, practical applications, and key insights you need to master this topic.
  </p>

  <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Key Concepts</h2>
  <p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
    Understanding ${title} requires a solid foundation in several key areas. Let's explore these fundamental concepts:
  </p>

  <ul class="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
    <li><strong class="font-semibold text-gray-900 dark:text-white">Concept 1:</strong> Fundamental principles and core understanding</li>
    <li><strong class="font-semibold text-gray-900 dark:text-white">Concept 2:</strong> Practical applications and real-world usage</li>
    <li><strong class="font-semibold text-gray-900 dark:text-white">Concept 3:</strong> Advanced techniques and best practices</li>
  </ul>

  ${request.includeExamples ? `
  <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Practical Examples</h2>
  <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-4">
    <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Example 1: Basic Implementation</h3>
    <p class="text-gray-700 dark:text-gray-300 mb-2">
      Here's a practical example of how to apply ${title} in a real-world scenario:
    </p>
    <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm"><code>// Example code or implementation
const example = "${title.toLowerCase().replace(/\s+/g, '_')}";
console.log("Understanding " + example);</code></pre>
  </div>
  ` : ''}

  <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Deep Dive</h2>
  <p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
    Now that we've covered the basics, let's dive deeper into the advanced aspects of ${title}. 
    This section will help you develop a more comprehensive understanding and practical expertise.
  </p>

  ${request.includeExercises ? `
  <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Practice Exercises</h2>
  <div class="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 p-4 mb-4">
    <h3 class="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">Exercise 1: Apply Your Knowledge</h3>
    <p class="text-green-700 dark:text-green-300 mb-2">
      Try implementing what you've learned about ${title}:
    </p>
    <ol class="list-decimal pl-6 text-green-700 dark:text-green-300">
      <li>Review the key concepts covered in this lesson</li>
      <li>Apply the techniques to a sample problem</li>
      <li>Validate your solution against best practices</li>
    </ol>
  </div>
  ` : ''}

  <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Summary</h2>
  <p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
    In this lesson, you've learned about the fundamental aspects of ${title}. You should now have 
    a solid understanding of the key concepts, practical applications, and implementation strategies.
  </p>

  <div class="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-4">
    <h3 class="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Key Takeaways</h3>
    <ul class="list-disc pl-6 text-yellow-700 dark:text-yellow-300">
      <li>Master the fundamental principles of ${title}</li>
      <li>Apply concepts in practical, real-world scenarios</li>
      <li>Continue practicing and refining your skills</li>
    </ul>
  </div>

  ${request.includeResources ? `
  <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Additional Resources</h2>
  <ul class="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">
    <li><a href="#" class="text-blue-600 dark:text-blue-400 hover:underline">Further Reading on ${title}</a></li>
    <li><a href="#" class="text-blue-600 dark:text-blue-400 hover:underline">Advanced Techniques and Best Practices</a></li>
    <li><a href="#" class="text-blue-600 dark:text-blue-400 hover:underline">Community Discussion and Support</a></li>
  </ul>
  ` : ''}
</div>`;

  return mockContent.trim();
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = LessonGeneratorRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request format', 
          details: parseResult.error.errors 
        },
        { status: 400 }
      );
    }

    const lessonRequest = parseResult.data;

    // Check if ANTHROPIC_API_KEY is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('ANTHROPIC_API_KEY not configured, using mock response');
      const mockContent = generateMockLessonContent(lessonRequest);
      return NextResponse.json({ success: true, content: mockContent });
    }

    // Generate lesson content using Anthropic Claude
    try {
      const prompt = buildLessonGeneratorPrompt(lessonRequest);
      
      const completion = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 6000,
        temperature: 0.7,
        system: LESSON_GENERATOR_SYSTEM_PROMPT,
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

      return NextResponse.json({ 
        success: true, 
        content: responseText.trim(),
        metadata: {
          tokensUsed: completion.usage?.input_tokens || 0,
          model: 'claude-3-5-sonnet-20241022',
          generatedAt: new Date().toISOString(),
          contentType: lessonRequest.contentType,
          difficulty: lessonRequest.difficulty
        }
      });

    } catch (apiError: any) {
      logger.error('Anthropic API error:', apiError);
      
      // Fall back to mock response for API errors
      const mockContent = generateMockLessonContent(lessonRequest);
      return NextResponse.json({ 
        success: true, 
        content: mockContent,
        warning: 'AI service temporarily unavailable, using template response'
      });
    }

  } catch (error: any) {
    logger.error('Lesson generator error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}