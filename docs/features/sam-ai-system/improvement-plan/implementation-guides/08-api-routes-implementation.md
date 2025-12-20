# SAM API Routes - Implementation Guide

## Overview

This guide provides complete implementation details for the three API routes required by the Hybrid SAM system. These routes handle Bloom's Taxonomy analysis, contextual help, and general Q&A conversations.

**Created**: January 2025
**Status**: 📋 Implementation Required
**Routes**: 3 API endpoints

## API Routes Overview

| Route | Method | Purpose | Called By |
|-------|--------|---------|-----------|
| `/api/sam/analyze-course-draft` | POST | Analyze entire course for Bloom's distribution | CourseCreationContext (auto, 2s debounce) |
| `/api/sam/contextual-help` | POST | Provide field-specific suggestions | SAMContextualPanel quick actions |
| `/api/sam/chat` | POST | Handle general Q&A conversations | FloatingSAM chat widget |

## Prerequisites

### 1. OpenAI SDK (or Alternative AI Provider)
```bash
npm install openai
# OR
npm install @anthropic-ai/sdk
```

### 2. Environment Variables
```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key_here
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Existing SAM Infrastructure
- BloomsAnalysisEngine (existing at `/sam-ai-tutor/engines/educational/sam-blooms-engine.ts`)
- SAM base engine classes
- Prisma schema with BloomsLevel enum

## Route 1: POST /api/sam/analyze-course-draft

### Purpose
Analyzes entire course draft and returns Bloom's Taxonomy distribution, cognitive depth score, and balance assessment.

### File Location
`app/api/sam/analyze-course-draft/route.ts`

### Request Interface
```typescript
interface AnalyzeCourseRequest {
  courseData: {
    title?: string;
    description?: string;
    learningObjectives?: string[];
    chapters?: ChapterData[];
  };
}
```

### Response Interface
```typescript
interface AnalyzeCourseResponse {
  courseLevel: {
    distribution: {
      REMEMBER: number;      // Percentage (0-100)
      UNDERSTAND: number;
      APPLY: number;
      ANALYZE: number;
      EVALUATE: number;
      CREATE: number;
    };
    cognitiveDepth: number;  // 0-100 score
    balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
  };
  recommendations?: {
    contentAdjustments?: ContentRecommendation[];
    assessmentChanges?: AssessmentRecommendation[];
    activitySuggestions?: ActivitySuggestion[];
  };
}
```

### Implementation

```typescript
// app/api/sam/analyze-course-draft/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BloomsAnalysisEngine } from '@/sam-ai-tutor/engines/educational/sam-blooms-engine';
import { detectBloomsLevelFromText } from '@/sam-ai-tutor/lib/context/course-creation-context';
import { BloomsLevel } from '@prisma/client';

interface CourseData {
  title?: string;
  description?: string;
  learningObjectives?: string[];
  chapters?: Array<{
    title?: string;
    description?: string;
    sections?: Array<{
      title?: string;
      content?: string;
    }>;
  }>;
}

interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

export async function POST(request: NextRequest) {
  try {
    const { courseData } = await request.json() as { courseData: CourseData };

    // Validate minimum content
    if (!courseData.title && !courseData.description && !courseData.learningObjectives?.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_CONTENT',
            message: 'Not enough content to analyze. Please provide at least a title, description, or learning objectives.',
          },
        },
        { status: 400 }
      );
    }

    // Analyze all content for Bloom's levels
    const bloomsLevels: BloomsLevel[] = [];

    // Analyze title
    if (courseData.title) {
      const level = detectBloomsLevelFromText(courseData.title);
      if (level) bloomsLevels.push(level);
    }

    // Analyze description
    if (courseData.description) {
      const level = detectBloomsLevelFromText(courseData.description);
      if (level) bloomsLevels.push(level);
    }

    // Analyze learning objectives
    if (courseData.learningObjectives) {
      for (const objective of courseData.learningObjectives) {
        const level = detectBloomsLevelFromText(objective);
        if (level) bloomsLevels.push(level);
      }
    }

    // Analyze chapters and sections
    if (courseData.chapters) {
      for (const chapter of courseData.chapters) {
        if (chapter.title) {
          const level = detectBloomsLevelFromText(chapter.title);
          if (level) bloomsLevels.push(level);
        }
        if (chapter.description) {
          const level = detectBloomsLevelFromText(chapter.description);
          if (level) bloomsLevels.push(level);
        }
        if (chapter.sections) {
          for (const section of chapter.sections) {
            if (section.title) {
              const level = detectBloomsLevelFromText(section.title);
              if (level) bloomsLevels.push(level);
            }
            if (section.content) {
              const level = detectBloomsLevelFromText(section.content);
              if (level) bloomsLevels.push(level);
            }
          }
        }
      }
    }

    // Calculate distribution
    const distribution: BloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    const totalLevels = bloomsLevels.length;

    if (totalLevels === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_BLOOMS_DETECTED',
            message: 'Could not detect Bloom\'s levels. Try using more specific action verbs.',
          },
        },
        { status: 400 }
      );
    }

    // Count occurrences
    for (const level of bloomsLevels) {
      distribution[level]++;
    }

    // Convert to percentages
    for (const level in distribution) {
      distribution[level as BloomsLevel] = Math.round(
        (distribution[level as BloomsLevel] / totalLevels) * 100
      );
    }

    // Calculate cognitive depth (weighted average)
    const weights = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 3,
      ANALYZE: 4,
      EVALUATE: 5,
      CREATE: 6,
    };

    let cognitiveDepth = 0;
    for (const level in distribution) {
      cognitiveDepth += weights[level as BloomsLevel] * distribution[level as BloomsLevel];
    }
    cognitiveDepth = Math.round((cognitiveDepth / 600) * 100); // Normalize to 0-100

    // Determine balance
    const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND;
    const higherLevels = distribution.ANALYZE + distribution.EVALUATE + distribution.CREATE;

    let balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
    if (lowerLevels > 60) {
      balance = 'bottom-heavy';
    } else if (higherLevels > 60) {
      balance = 'top-heavy';
    } else {
      balance = 'well-balanced';
    }

    // Generate recommendations based on balance
    const recommendations = generateRecommendations(distribution, balance);

    return NextResponse.json({
      success: true,
      data: {
        courseLevel: {
          distribution,
          cognitiveDepth,
          balance,
        },
        recommendations,
      },
    });
  } catch (error) {
    console.error('Error analyzing course:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ANALYSIS_ERROR',
          message: 'Failed to analyze course. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  distribution: BloomsDistribution,
  balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy'
) {
  const recommendations = {
    contentAdjustments: [] as Array<{
      type: 'add' | 'modify' | 'remove';
      bloomsLevel: BloomsLevel;
      description: string;
      impact: 'low' | 'medium' | 'high';
    }>,
    assessmentChanges: [] as Array<{
      type: string;
      bloomsLevel: BloomsLevel;
      description: string;
      examples: string[];
    }>,
    activitySuggestions: [] as Array<{
      bloomsLevel: BloomsLevel;
      activityType: string;
      description: string;
      implementation: string;
      expectedOutcome: string;
    }>,
  };

  if (balance === 'bottom-heavy') {
    recommendations.contentAdjustments.push({
      type: 'add',
      bloomsLevel: 'ANALYZE',
      description: 'Add more analysis activities (compare, contrast, examine)',
      impact: 'high',
    });
    recommendations.contentAdjustments.push({
      type: 'add',
      bloomsLevel: 'CREATE',
      description: 'Include project-based learning where students create artifacts',
      impact: 'high',
    });

    recommendations.assessmentChanges.push({
      type: 'Case Study Analysis',
      bloomsLevel: 'ANALYZE',
      description: 'Add assessments that require students to analyze real-world scenarios',
      examples: [
        'Analyze a failed product launch and identify key mistakes',
        'Compare two competing solutions and evaluate trade-offs',
      ],
    });

    recommendations.activitySuggestions.push({
      bloomsLevel: 'CREATE',
      activityType: 'Project-Based Learning',
      description: 'Students design and build a complete solution',
      implementation: 'Provide project guidelines, rubric, and milestones',
      expectedOutcome: 'Students apply all learned concepts in a real-world project',
    });
  } else if (balance === 'top-heavy') {
    recommendations.contentAdjustments.push({
      type: 'add',
      bloomsLevel: 'UNDERSTAND',
      description: 'Add foundational explanations to support higher-order thinking',
      impact: 'medium',
    });
    recommendations.contentAdjustments.push({
      type: 'add',
      bloomsLevel: 'APPLY',
      description: 'Include practical exercises to bridge theory and advanced work',
      impact: 'medium',
    });
  }

  return recommendations;
}
```

### Example Request
```json
{
  "courseData": {
    "title": "Introduction to Web Development",
    "description": "Learn to build modern web applications using HTML, CSS, and JavaScript",
    "learningObjectives": [
      "Students will understand HTML structure",
      "Students will create responsive layouts with CSS",
      "Students will build interactive features with JavaScript"
    ]
  }
}
```

### Example Response
```json
{
  "success": true,
  "data": {
    "courseLevel": {
      "distribution": {
        "REMEMBER": 0,
        "UNDERSTAND": 33,
        "APPLY": 33,
        "ANALYZE": 0,
        "EVALUATE": 0,
        "CREATE": 33
      },
      "cognitiveDepth": 55,
      "balance": "well-balanced"
    },
    "recommendations": {
      "contentAdjustments": [],
      "assessmentChanges": [],
      "activitySuggestions": []
    }
  }
}
```

## Route 2: POST /api/sam/contextual-help

### Purpose
Provides AI-generated field-specific suggestions based on quick action prompts.

### File Location
`app/api/sam/contextual-help/route.ts`

### Request Interface
```typescript
interface ContextualHelpRequest {
  prompt: string;           // Quick action prompt
  fieldContext: {
    fieldName: string;
    fieldValue: string;
    fieldType: 'title' | 'description' | 'objective' | 'chapter' | 'section' | 'assessment';
    bloomsLevel?: BloomsLevel;
  };
}
```

### Response Interface
```typescript
interface ContextualHelpResponse {
  response: string;        // AI-generated suggestion
}
```

### Implementation

```typescript
// app/api/sam/contextual-help/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FieldContext {
  fieldName: string;
  fieldValue: string;
  fieldType: string;
  bloomsLevel?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, fieldContext } = await request.json() as {
      prompt: string;
      fieldContext: FieldContext;
    };

    // Validate input
    if (!prompt || !fieldContext) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Prompt and fieldContext are required',
          },
        },
        { status: 400 }
      );
    }

    // Build context-aware system prompt
    const systemPrompt = `You are SAM (Smart Adaptive Mentor), an AI teaching assistant specialized in educational content design and Bloom's Taxonomy.

Current Context:
- Field: ${fieldContext.fieldName}
- Field Type: ${fieldContext.fieldType}
- Current Content: "${fieldContext.fieldValue}"
- Current Bloom's Level: ${fieldContext.bloomsLevel || 'Not detected'}

Your role:
- Provide specific, actionable suggestions
- Use Bloom's Taxonomy to elevate content
- Focus on clarity, measurability, and engagement
- Provide 2-3 concrete examples when asked for suggestions
- Keep responses concise (2-4 sentences or 3 bullet points)

Bloom's Taxonomy Levels (low to high):
1. REMEMBER: recall facts (define, list, name, identify)
2. UNDERSTAND: explain concepts (describe, summarize, explain, interpret)
3. APPLY: use knowledge (apply, implement, solve, demonstrate)
4. ANALYZE: examine relationships (analyze, compare, contrast, examine)
5. EVALUATE: make judgments (evaluate, critique, justify, assess)
6. CREATE: produce new work (create, design, develop, compose)`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({
      success: true,
      data: {
        response,
      },
    });
  } catch (error) {
    console.error('Error getting contextual help:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Failed to get contextual help. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}
```

### Example Request
```json
{
  "prompt": "Suggest 3 engaging course titles based on the content I've entered",
  "fieldContext": {
    "fieldName": "course-title",
    "fieldValue": "Web Development",
    "fieldType": "title",
    "bloomsLevel": "UNDERSTAND"
  }
}
```

### Example Response
```json
{
  "success": true,
  "data": {
    "response": "Here are 3 course titles at the APPLY level or higher:\n\n1. \"Build Modern Web Applications from Scratch\" (APPLY/CREATE)\n2. \"Master Full-Stack Web Development: From Concept to Deployment\" (APPLY/CREATE)\n3. \"Create Professional Websites with HTML, CSS & JavaScript\" (CREATE)\n\nEach title emphasizes hands-on creation and application of skills rather than just understanding concepts."
  }
}
```

## Route 3: POST /api/sam/chat

### Purpose
Handles general Q&A conversations with full course context awareness.

### File Location
`app/api/sam/chat/route.ts`

### Request Interface
```typescript
interface ChatRequest {
  message: string;
  context: {
    courseData?: {
      title?: string;
      description?: string;
      learningObjectives?: string[];
      chapters?: ChapterData[];
    };
    currentField?: {
      fieldName: string;
      fieldValue: string;
      fieldType: string;
      bloomsLevel?: BloomsLevel;
    };
    bloomsAnalysis?: BloomsAnalysisResponse;
    conversationHistory: Message[];
  };
}
```

### Response Interface
```typescript
interface ChatResponse {
  response: string;
}
```

### Implementation

```typescript
// app/api/sam/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatContext {
  courseData?: {
    title?: string;
    description?: string;
    learningObjectives?: string[];
    chapters?: unknown[];
  };
  currentField?: {
    fieldName: string;
    fieldValue: string;
    fieldType: string;
    bloomsLevel?: string;
  };
  bloomsAnalysis?: {
    courseLevel: {
      distribution: Record<string, number>;
      cognitiveDepth: number;
      balance: string;
    };
  };
  conversationHistory: Message[];
}

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json() as {
      message: string;
      context: ChatContext;
    };

    // Validate input
    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Message is required',
          },
        },
        { status: 400 }
      );
    }

    // Build rich context for SAM
    let contextSummary = 'You are SAM (Smart Adaptive Mentor), an AI teaching assistant helping with course creation.\n\n';

    if (context.courseData) {
      contextSummary += 'Current Course:\n';
      if (context.courseData.title) {
        contextSummary += `- Title: "${context.courseData.title}"\n`;
      }
      if (context.courseData.description) {
        contextSummary += `- Description: "${context.courseData.description}"\n`;
      }
      if (context.courseData.learningObjectives?.length) {
        contextSummary += `- Learning Objectives (${context.courseData.learningObjectives.length}):\n`;
        context.courseData.learningObjectives.forEach((obj, i) => {
          contextSummary += `  ${i + 1}. ${obj}\n`;
        });
      }
    }

    if (context.currentField) {
      contextSummary += `\nCurrently Editing:\n`;
      contextSummary += `- Field: ${context.currentField.fieldName}\n`;
      contextSummary += `- Type: ${context.currentField.fieldType}\n`;
      contextSummary += `- Current Value: "${context.currentField.fieldValue}"\n`;
      if (context.currentField.bloomsLevel) {
        contextSummary += `- Bloom's Level: ${context.currentField.bloomsLevel}\n`;
      }
    }

    if (context.bloomsAnalysis) {
      contextSummary += `\nCourse Bloom's Analysis:\n`;
      contextSummary += `- Balance: ${context.bloomsAnalysis.courseLevel.balance}\n`;
      contextSummary += `- Cognitive Depth: ${context.bloomsAnalysis.courseLevel.cognitiveDepth}/100\n`;
      contextSummary += '- Distribution:\n';
      Object.entries(context.bloomsAnalysis.courseLevel.distribution).forEach(([level, percentage]) => {
        if (percentage > 0) {
          contextSummary += `  ${level}: ${percentage}%\n`;
        }
      });
    }

    // Build conversation messages
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: contextSummary },
    ];

    // Add conversation history (last 10 messages for context window)
    const recentHistory = context.conversationHistory?.slice(-10) || [];
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.8,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({
      success: true,
      data: {
        response,
      },
    });
  } catch (error) {
    console.error('Error in SAM chat:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CHAT_ERROR',
          message: 'Failed to process chat message. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}
```

### Example Request
```json
{
  "message": "How can I improve my course description?",
  "context": {
    "courseData": {
      "title": "Introduction to Web Development",
      "description": "Learn web development basics",
      "learningObjectives": [
        "Understand HTML and CSS",
        "Build simple websites"
      ]
    },
    "currentField": {
      "fieldName": "course-description",
      "fieldValue": "Learn web development basics",
      "fieldType": "description",
      "bloomsLevel": "UNDERSTAND"
    },
    "bloomsAnalysis": {
      "courseLevel": {
        "distribution": {
          "REMEMBER": 0,
          "UNDERSTAND": 67,
          "APPLY": 33,
          "ANALYZE": 0,
          "EVALUATE": 0,
          "CREATE": 0
        },
        "cognitiveDepth": 42,
        "balance": "bottom-heavy"
      }
    },
    "conversationHistory": [
      {
        "role": "assistant",
        "content": "Hi! I'm SAM, your AI teaching assistant. I'm aware of your course creation progress and can help with anything. What would you like to know?",
        "timestamp": "2025-01-19T10:00:00.000Z"
      }
    ]
  }
}
```

### Example Response
```json
{
  "success": true,
  "data": {
    "response": "Your course description is currently at the UNDERSTAND level, but I notice your overall course is bottom-heavy (67% UNDERSTAND). Here are 3 ways to improve:\n\n1. **Add specific outcomes**: Instead of 'Learn web development basics', say 'Build and deploy your own portfolio website using HTML, CSS, and JavaScript'\n\n2. **Elevate to APPLY level**: Mention hands-on projects students will create, like 'Create a responsive e-commerce site' or 'Develop interactive web forms'\n\n3. **Include higher-order thinking**: Add 'Analyze real-world websites and evaluate their design choices' to bring in ANALYZE level\n\nWould you like me to rewrite the description for you?"
  }
}
```

## Error Handling Best Practices

### 1. Validate Input
```typescript
if (!message || message.trim().length === 0) {
  return NextResponse.json(
    { success: false, error: { code: 'INVALID_INPUT', message: 'Message cannot be empty' } },
    { status: 400 }
  );
}
```

### 2. Handle API Errors
```typescript
try {
  const completion = await openai.chat.completions.create({...});
} catch (error) {
  if (error.code === 'insufficient_quota') {
    return NextResponse.json(
      { success: false, error: { code: 'QUOTA_EXCEEDED', message: 'API quota exceeded' } },
      { status: 429 }
    );
  }
  throw error;
}
```

### 3. Set Timeouts
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30 seconds

try {
  const completion = await openai.chat.completions.create(
    {...},
    { signal: controller.signal }
  );
} finally {
  clearTimeout(timeout);
}
```

## Testing API Routes

### Unit Test Example
```typescript
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('POST /api/sam/chat', () => {
  it('returns AI response for valid input', async () => {
    const request = new NextRequest('http://localhost:3000/api/sam/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Help me with my course',
        context: { courseData: { title: 'Test Course' } },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.response).toBeDefined();
    expect(typeof data.data.response).toBe('string');
  });

  it('returns error for missing message', async () => {
    const request = new NextRequest('http://localhost:3000/api/sam/chat', {
      method: 'POST',
      body: JSON.stringify({ message: '', context: {} }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_INPUT');
  });
});
```

## Performance Optimization

### 1. Caching (Optional)
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache analyze-course-draft results
const cacheKey = `blooms-analysis:${JSON.stringify(courseData)}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return NextResponse.json({ success: true, data: cached });
}

// ... perform analysis ...

await redis.set(cacheKey, result, { ex: 3600 }); // Cache for 1 hour
```

### 2. Rate Limiting
```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

const { success } = await ratelimit.limit(request.ip ?? 'anonymous');

if (!success) {
  return NextResponse.json(
    { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
    { status: 429 }
  );
}
```

## Deployment Checklist

- [ ] Set `OPENAI_API_KEY` environment variable
- [ ] Test all three routes with Postman/Thunder Client
- [ ] Implement rate limiting
- [ ] Add caching for repeated requests
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure CORS if needed
- [ ] Add request/response logging
- [ ] Test with real course data
- [ ] Monitor API usage and costs

## Alternative AI Providers

### Using Anthropic Claude
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: 'claude-3-opus-20240229',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: prompt },
  ],
});

const response = message.content[0].text;
```

### Using Local LLM (Ollama)
```typescript
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama2',
    prompt: systemPrompt + '\n\n' + prompt,
  }),
});

const data = await response.json();
const text = data.response;
```

## Troubleshooting

### API Key Not Working
**Check**:
- Is `.env.local` file in project root?
- Is `OPENAI_API_KEY` spelled correctly?
- Is server restarted after adding env variable?
- Run `console.log(process.env.OPENAI_API_KEY)` to verify

### Timeout Errors
**Solutions**:
- Reduce `max_tokens` parameter
- Implement request timeout with AbortController
- Use faster model (gpt-3.5-turbo instead of gpt-4)

### Rate Limit Errors
**Solutions**:
- Implement request caching
- Add rate limiting on client side
- Upgrade OpenAI plan
- Use batch processing for multiple requests

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Implementation Required
**Maintainer**: SAM AI Tutor Team
