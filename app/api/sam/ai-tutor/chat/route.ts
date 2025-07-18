import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { currentUser } from '@/lib/auth';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      message, 
      context,
      conversationHistory = []
    } = await request.json();

    const {
      pageData,
      learningContext,
      gamificationState,
      tutorPersonality,
      emotion
    } = context;

    // Build context-aware system prompt
    const systemPrompt = buildSystemPrompt(learningContext, tutorPersonality, pageData);
    
    // Build conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-5).map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.7,
      messages: messages as any
    });

    const aiResponse = response.content[0];
    const responseText = aiResponse.type === 'text' ? aiResponse.text : '';

    // Parse response for actions and suggestions
    const parsedResponse = parseAIResponse(responseText, learningContext, pageData);

    // Determine appropriate emotional tone
    const responseEmotion = determineResponseEmotion(emotion, message, learningContext);

    return NextResponse.json({
      response: parsedResponse.content,
      emotion: responseEmotion,
      suggestions: parsedResponse.suggestions,
      action: parsedResponse.action,
      metadata: {
        processingTime: Date.now(),
        contextUsed: {
          userRole: learningContext.userRole,
          pageType: pageData.pageType,
          emotionDetected: emotion
        }
      }
    });

  } catch (error) {
    console.error('SAM AI Tutor chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(learningContext: any, tutorPersonality: any, pageData: any): string {
  const basePrompt = `You are SAM (Smart Assistant Module), an advanced AI tutor and teaching assistant. You are intelligent, helpful, and adaptive to different learning styles and contexts.

**Your Core Identity:**
- You are encouraging, supportive, and patient
- You adapt your teaching style to the user's needs
- You use pedagogical best practices
- You maintain a ${tutorPersonality.tone} tone
- You prefer ${tutorPersonality.teachingMethod} teaching methods
- You respond in a ${tutorPersonality.responseStyle} style

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

**Your Role as Teaching Assistant:**
- Help teachers create engaging content
- Assist with course design and structure
- Generate assessment materials
- Provide student insights and analytics
- Help with administrative tasks
- Suggest pedagogical improvements
- Automate repetitive tasks

**Guidelines:**
- Focus on educational best practices
- Suggest evidence-based teaching methods
- Help with content creation and curation
- Provide actionable student insights
- Assist with form filling and data entry
- Offer creative teaching ideas`;
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
      "Generate course content",
      "Create assessment questions",
      "Analyze student performance"
    );
  }
  
  // Add page-specific suggestions
  if (pageData.pageType === 'create' || pageData.pageType === 'edit') {
    suggestions.push("Help me fill out this form");
  }
  
  return suggestions;
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