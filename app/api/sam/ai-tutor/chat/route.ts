import { NextRequest, NextResponse } from 'next/server';
import { runSAMChat } from '@/lib/sam/ai-provider';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createUnifiedBloomsEngine } from '@sam-ai/educational';
import type { UnifiedBloomsResult } from '@sam-ai/educational';
import { getSAMConfig, getDatabaseAdapter } from '@/lib/adapters';
import {
  getMemoryContext,
  formatMemoryForPrompt,
  processChatWithMemory,
  type MemoryContext,
} from '@/lib/sam/services/chat-memory-integration';

let unifiedBloomsEngine: ReturnType<typeof createUnifiedBloomsEngine> | null = null;

function getUnifiedBloomsEngine() {
  if (!unifiedBloomsEngine) {
    unifiedBloomsEngine = createUnifiedBloomsEngine({
      samConfig: getSAMConfig(),
      database: getDatabaseAdapter(),
      defaultMode: 'standard',
      confidenceThreshold: 0.7,
      enableCache: true,
      cacheTTL: 900,
    });
  }
  return unifiedBloomsEngine;
}

function formatFieldValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ');
  if (value === null || value === undefined) return '';
  return String(value);
}

function buildBloomsAnalysisContent(
  message: string,
  context: {
    pageData?: Record<string, any>;
    learningContext?: Record<string, any>;
  }
): string {
  const parts: string[] = [];
  const pageData = context.pageData ?? {};
  const learningContext = context.learningContext ?? {};

  if (message?.trim()) {
    parts.push(`User message: ${message}`);
  }

  if (pageData.pageType) parts.push(`Page type: ${pageData.pageType}`);
  if (pageData.title) parts.push(`Page title: ${pageData.title}`);
  if (pageData.pageUrl) parts.push(`Page url: ${pageData.pageUrl}`);

  if (learningContext.userRole) parts.push(`User role: ${learningContext.userRole}`);
  if (learningContext.currentCourse?.title) {
    parts.push(`Course: ${learningContext.currentCourse.title}`);
  }
  if (learningContext.currentChapter?.title) {
    parts.push(`Chapter: ${learningContext.currentChapter.title}`);
  }

  if (Array.isArray(pageData.forms) && pageData.forms.length > 0) {
    const formLines = pageData.forms
      .filter((field: any) => field && field.value !== undefined && field.value !== null)
      .slice(0, 30)
      .map((field: any) => {
        const label = field.label || field.name || 'Field';
        const value = formatFieldValue(field.value);
        return value ? `${label}: ${value}` : '';
      })
      .filter(Boolean);

    if (formLines.length > 0) {
      parts.push(`Form data:\n${formLines.join('\n')}`);
    }
  }

  const links = Array.isArray(pageData.links)
    ? pageData.links
    : Array.isArray(pageData.pageLinks)
      ? pageData.pageLinks
      : [];

  if (links.length > 0) {
    const linkLines = links
      .slice(0, 20)
      .map((link: any) => {
        if (typeof link === 'string') return link;
        if (link?.href && link?.text) return `${link.text} (${link.href})`;
        if (link?.href) return link.href;
        return '';
      })
      .filter(Boolean);

    if (linkLines.length > 0) {
      parts.push(`Page links:\n${linkLines.join('\n')}`);
    }
  }

  return parts.join('\n');
}

async function analyzeBloomsForChat(
  message: string,
  context: {
    pageData?: Record<string, any>;
    learningContext?: Record<string, any>;
  }
): Promise<UnifiedBloomsResult | null> {
  const content = buildBloomsAnalysisContent(message, context);
  if (!content.trim()) return null;

  const truncated = content.length > 6000 ? `${content.slice(0, 6000)}...` : content;

  try {
    const engine = getUnifiedBloomsEngine();
    return await engine.analyze(truncated, {
      mode: 'standard',
      confidenceThreshold: 0.7,
    });
  } catch (error) {
    logger.warn('Blooms analysis failed for chat request.', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      message,
      context,
      conversationHistory = [],
      sessionId: providedSessionId,
    } = await request.json();

    // Generate or use provided session ID
    const sessionId = providedSessionId || `session_${user.id}_${Date.now()}`;
    const turnNumber = conversationHistory.length;

    // Destructure with defaults to prevent undefined errors
    const {
      pageData = {},
      learningContext = {},
      gamificationState = {},
      tutorPersonality = {
        tone: 'professional',
        teachingMethod: 'structured',
        responseStyle: 'concise',
      },
      emotion = 'neutral'
    } = context || {};

    // Retrieve memory context for personalization
    let memoryContext: MemoryContext | null = null;
    try {
      memoryContext = await getMemoryContext(user.id, message, {
        sessionId,
        courseId: learningContext.currentCourse?.id,
        maxMemories: 5,
        maxConversations: 3,
        minScore: 0.7,
      });
    } catch (memoryError) {
      logger.warn('[SAM Chat] Failed to retrieve memory context', { error: memoryError });
    }

    // Build context-aware system prompt with memory
    const baseSystemPrompt = buildSystemPrompt(learningContext, tutorPersonality, pageData);
    const memoryPromptAddition = memoryContext ? formatMemoryForPrompt(memoryContext) : '';
    const systemPrompt = baseSystemPrompt + memoryPromptAddition;

    // Build conversation history (exclude system message from messages array)
    const messages = [
      ...conversationHistory.slice(-5).map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const [responseText, bloomsAnalysis] = await Promise.all([
      // Call Anthropic API via centralized adapter
      runSAMChat({
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 2000,
      temperature: 0.7,
      systemPrompt,
      messages,
      }),
      analyzeBloomsForChat(message, { pageData, learningContext }),
    ]);

    // Parse response for actions and suggestions
    const parsedResponse = parseAIResponse(responseText, learningContext, pageData);

    // Determine appropriate emotional tone
    const responseEmotion = determineResponseEmotion(emotion, message, learningContext);

    // Store conversation and extract long-term memories (non-blocking)
    processChatWithMemory(
      user.id,
      sessionId,
      message,
      parsedResponse.content,
      turnNumber,
      {
        courseId: learningContext.currentCourse?.id,
        emotion,
        bloomsLevel: bloomsAnalysis?.dominantLevel,
      }
    ).catch((memoryStoreError) => {
      logger.warn('[SAM Chat] Failed to store memory', { error: memoryStoreError });
    });

    const bloomsInsights = bloomsAnalysis
      ? {
          dominantLevel: bloomsAnalysis.dominantLevel,
          distribution: bloomsAnalysis.distribution,
          cognitiveDepth: bloomsAnalysis.cognitiveDepth,
          balance: bloomsAnalysis.balance,
          confidence: bloomsAnalysis.confidence,
          gaps: bloomsAnalysis.gaps,
          recommendations: bloomsAnalysis.recommendations.map((rec) => ({
            level: rec.level,
            action: rec.action,
            priority: rec.priority,
          })),
        }
      : null;

    return NextResponse.json({
      response: parsedResponse.content,
      emotion: responseEmotion,
      suggestions: parsedResponse.suggestions,
      action: parsedResponse.action,
      blooms: bloomsInsights,
      insights: bloomsInsights ? { blooms: bloomsInsights } : undefined,
      sessionId, // Return session ID for client tracking
      metadata: {
        processingTime: Date.now(),
        contextUsed: {
          userRole: learningContext.userRole,
          pageType: pageData.pageType,
          emotionDetected: emotion,
          bloomsAnalyzed: Boolean(bloomsAnalysis),
          memoryContextUsed: Boolean(memoryContext?.relevantMemories.length),
          memoriesRetrieved: memoryContext?.relevantMemories.length ?? 0,
        }
      }
    });

  } catch (error) {
    logger.error('SAM AI Tutor chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(learningContext: any, tutorPersonality: any, pageData: any): string {
  // Ensure tutorPersonality has all required properties with defaults
  const personality = {
    tone: tutorPersonality?.tone || 'professional',
    teachingMethod: tutorPersonality?.teachingMethod || 'structured',
    responseStyle: tutorPersonality?.responseStyle || 'concise',
  };

  const basePrompt = `You are SAM (Smart Assistant Module), an advanced AI tutor and teaching assistant. You are intelligent, helpful, and adaptive to different learning styles and contexts.

**Your Core Identity:**
- You are encouraging, supportive, and patient
- You adapt your teaching style to the user's needs
- You use pedagogical best practices
- You maintain a ${personality.tone} tone
- You prefer ${personality.teachingMethod} teaching methods
- You respond in a ${personality.responseStyle} style

**Current Context:**
- User Role: ${learningContext.userRole || 'unknown'}
- Page Type: ${pageData.pageType || 'unknown'}
- Current Course: ${learningContext.currentCourse?.title || 'None'}
- Current Chapter: ${learningContext.currentChapter?.title || 'None'}
- Forms Available: ${pageData.forms?.length || 0}`;

  if (learningContext.userRole === 'student') {
    return `${basePrompt}

**Your Role as Learning Tutor:**
- Help students understand concepts through questioning
- Provide personalized explanations
- Generate practice problems and examples
- Offer motivation and encouragement
- Track learning progress and celebrate achievements
- Use the Socratic method when appropriate
- Adapt difficulty based on student responses

**Guidelines:**
- Ask guiding questions before giving direct answers
- Encourage critical thinking
- Provide examples and analogies
- Break complex topics into smaller parts
- Celebrate small wins and progress
- Be patient with mistakes and confusion`;
  } else if (learningContext.userRole === 'teacher') {
    return `${basePrompt}

**Your Role as Teaching Assistant & Course Creator:**
- Help teachers create engaging content
- Assist with course design and structure using Bloom's taxonomy
- Generate assessment materials and rubrics
- Provide student insights and analytics
- Help with administrative tasks
- Suggest pedagogical improvements
- Automate repetitive tasks
- **COURSE CREATION EXPERTISE**: Create comprehensive courses with quality scoring, market analysis, and structured learning paths

**Course Creation Capabilities:**
- **Title Generation**: Create compelling, SEO-optimized course titles with market analysis
- **Course Structure**: Design learning paths using Bloom's taxonomy (Remember → Understand → Apply → Analyze → Evaluate → Create)
- **Quality Scoring**: Evaluate course completeness, engagement, and pedagogical effectiveness
- **Learning Objectives**: Create SMART goals aligned with educational standards
- **Content Architecture**: Organize chapters, sections, and assessments logically
- **Target Audience Analysis**: Define learner personas and prerequisites
- **Market Research**: Analyze competitors and positioning strategies

**Available Actions for Course Creation:**
When users request course creation help, you can use these action commands:
- [ACTION:GENERATE_TITLES|topic|audience|difficulty] - Generate course titles
- [ACTION:CREATE_STRUCTURE|topic|chapters|level] - Design course architecture  
- [ACTION:QUALITY_SCORE|course_data] - Evaluate course quality
- [ACTION:LEARNING_OBJECTIVES|topic|bloom_levels] - Create learning goals
- [ACTION:MARKET_ANALYSIS|topic|category] - Research market positioning

**Guidelines:**
- Focus on educational best practices and evidence-based teaching methods
- Help with content creation and curation using pedagogical expertise
- Provide actionable student insights and course improvement recommendations
- Assist with form filling and data entry when needed
- Offer creative teaching ideas and innovative learning approaches
- **For course creation requests**: Guide users through a structured process, use quality scoring, and leverage market analysis
- **Always use action commands** when users need specific course creation functionality`;
  }

  return basePrompt;
}

function parseAIResponse(response: string, learningContext: any, pageData: any): any {
  // Extract action commands from response
  const actionRegex = /\[ACTION:([^\]]+)\]/g;
  const actions = [];
  let cleanResponse = response;
  
  let match;
  while ((match = actionRegex.exec(response)) !== null) {
    const actionText = match[1];
    actions.push(parseAction(actionText, learningContext, pageData));
    cleanResponse = cleanResponse.replace(match[0], '');
  }

  // Extract suggestions
  const suggestionRegex = /\[SUGGEST:([^\]]+)\]/g;
  const suggestions = [];
  
  while ((match = suggestionRegex.exec(response)) !== null) {
    suggestions.push(match[1]);
    cleanResponse = cleanResponse.replace(match[0], '');
  }

  // Generate contextual suggestions if none provided
  if (suggestions.length === 0) {
    suggestions.push(...generateContextualSuggestions(learningContext, pageData));
  }

  return {
    content: cleanResponse.trim(),
    suggestions: suggestions.slice(0, 3),
    action: actions.length > 0 ? actions[0] : null
  };
}

function parseAction(actionText: string, learningContext: any, pageData: any): any {
  const [type, ...params] = actionText.split('|');
  
  switch (type) {
    case 'POPULATE_FORM':
      return {
        type: 'form_populate',
        details: {
          formId: params[0],
          data: JSON.parse(params[1] || '{}')
        }
      };
    
    case 'AWARD_POINTS':
      return {
        type: 'gamification_action',
        details: {
          points: parseInt(params[0] || '10'),
          reason: params[1] || 'Good interaction'
        }
      };
    
    case 'NAVIGATE':
      return {
        type: 'navigation',
        details: {
          url: params[0]
        }
      };

    // COURSE CREATION ACTIONS
    case 'GENERATE_TITLES':
      return {
        type: 'course_creation_action',
        details: {
          action: 'generate_titles',
          topic: params[0],
          audience: params[1],
          difficulty: params[2],
          apiEndpoint: '/api/sam/title-suggestions'
        }
      };

    case 'CREATE_STRUCTURE':
      return {
        type: 'course_creation_action',
        details: {
          action: 'create_structure',
          topic: params[0],
          chapters: parseInt(params[1] || '5'),
          level: params[2],
          apiEndpoint: '/api/sam/generate-course-structure-complete'
        }
      };

    case 'QUALITY_SCORE':
      return {
        type: 'course_creation_action',
        details: {
          action: 'quality_score',
          courseData: params[0],
          apiEndpoint: '/api/sam/validate'
        }
      };

    case 'LEARNING_OBJECTIVES':
      return {
        type: 'course_creation_action',
        details: {
          action: 'learning_objectives',
          topic: params[0],
          bloomLevels: params[1]?.split(',') || ['UNDERSTAND', 'APPLY'],
          apiEndpoint: '/api/sam/learning-objectives'
        }
      };

    case 'MARKET_ANALYSIS':
      return {
        type: 'course_creation_action',
        details: {
          action: 'market_analysis',
          topic: params[0],
          category: params[1],
          apiEndpoint: '/api/sam/course-market-analysis'
        }
      };
    
    default:
      return null;
  }
}

function generateContextualSuggestions(learningContext: any, pageData: any): string[] {
  const suggestions = [];
  
  if (learningContext.userRole === 'student') {
    suggestions.push(
      "Can you explain this concept differently?",
      "Give me some practice problems",
      "How does this relate to real life?"
    );
  } else if (learningContext.userRole === 'teacher') {
    suggestions.push(
      "Create a new course with AI",
      "Generate course title ideas",
      "Design course structure",
      "Generate learning objectives",
      "Create assessment questions",
      "Analyze course market potential",
      "Generate course content",
      "Analyze student performance"
    );
  }
  
  // Add page-specific suggestions
  if (pageData.pageType === 'create' || pageData.pageType === 'edit') {
    suggestions.push("Help me fill out this form");
  }
  
  // Add course creation specific suggestions
  if (pageData.pageType === 'course_creation' || pageData.title?.includes('create')) {
    suggestions.push(
      "Help me brainstorm course ideas",
      "Generate compelling course titles",
      "Create course structure using Bloom's taxonomy",
      "Analyze target audience needs"
    );
  }
  
  return suggestions.slice(0, 3); // Limit to 3 suggestions
}

function determineResponseEmotion(
  userEmotion: string,
  message: string,
  learningContext: any
): string {
  // Respond appropriately to detected emotions
  switch (userEmotion) {
    case 'frustrated':
      return 'supportive';
    case 'confused':
      return 'thoughtful';
    case 'confident':
      return 'encouraging';
    case 'bored':
      return 'excited';
    case 'engaged':
      return 'encouraging';
    default:
      return 'supportive';
  }
}

// Helper function to detect if response should include actions
function shouldIncludeActions(message: string, learningContext: any): boolean {
  const actionKeywords = [
    'fill', 'populate', 'create', 'generate', 'help me with',
    'can you', 'please', 'make', 'write', 'build'
  ];
  
  return actionKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
}
