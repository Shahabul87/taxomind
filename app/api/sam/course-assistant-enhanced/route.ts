import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      message, 
      courseContext, 
      conversationHistory = [], 
      samMemoryContext 
    } = await request.json();

    if (!message || !courseContext) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Enhanced response using SAM memory context
    const response = await generateEnhancedSamResponse({
      message,
      courseContext,
      conversationHistory,
      samMemoryContext,
      userId: user.id
    });

    return NextResponse.json({ 
      response: response.content,
      suggestions: response.suggestions,
      actionsTaken: response.actionsTaken,
      data: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in enhanced SAM course assistant:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateEnhancedSamResponse({
  message,
  courseContext,
  conversationHistory,
  samMemoryContext,
  userId
}: {
  message: string;
  courseContext: any;
  conversationHistory: any[];
  samMemoryContext: any;
  userId: string;
}) {
  
  // Build comprehensive context including SAM memory
  const contextPrompt = buildEnhancedContextPrompt(courseContext, samMemoryContext);
  
  // Build conversation history with SAM memory
  const enhancedHistory = buildEnhancedConversationHistory(conversationHistory, samMemoryContext);

  // Detect if this is a blueprint generation request
  const isBlueprintRequest = detectBlueprintRequest(message);

  const prompt = `I am SAM, an advanced intelligent course management assistant with persistent memory and contextual awareness. I maintain continuity across all user interactions and remember the complete course creation journey.

ENHANCED CONTEXT WITH MEMORY:
${contextPrompt}

CONVERSATION HISTORY WITH MEMORY:
${enhancedHistory}

CURRENT MESSAGE: "${message}"

MY ENHANCED CAPABILITIES WITH MEMORY:
1. **Complete Contextual Memory** - I remember everything from the course creation wizard including target audience, difficulty, bloom's focus, and all previous interactions
2. **Content Generation & Synchronization** - I can generate chapters, sections, learning objectives and synchronize them with course forms in real-time
3. **Memory-Based Analysis** - I explain exactly how I know about course structure using my persistent memory context from the creation wizard
4. **Form Integration** - I can update course data directly and provide structured responses for form synchronization
5. **Intelligent Content Creation** - Generate educational content that aligns with original course intentions and current structure
6. **Contextual Q&A** - Answer questions about my knowledge and capabilities with specific reference to stored context and wizard data
7. **Real-time Form Updates** - When generating chapters or content, I provide structured data that can be immediately synchronized with course forms

${isBlueprintRequest ? `
BLUEPRINT GENERATION MODE:
Since this appears to be a blueprint generation request, I should:
1. Reference the original course creation wizard data
2. Analyze current course structure vs. original intentions
3. Provide systematic blueprint for enhancement
4. Include specific, actionable content suggestions
5. Maintain educational progression and Bloom's taxonomy alignment
` : ''}

RESPONSE GUIDELINES:
- **Use Memory Context**: Reference previous conversations and wizard data specifically
- **Be Specific**: Provide actionable suggestions based on actual course data
- **Maintain Continuity**: Acknowledge our shared history and context explicitly
- **Educational Focus**: Apply learning science and pedagogical best practices
- **Contextual Intelligence**: Adapt responses based on user's experience level and preferences
- **Form Synchronization**: When generating content, provide structured data for immediate form updates
- **Memory Explanation**: When asked about my knowledge, explain exactly how I know about the course (wizard data, previous interactions, etc.)

SPECIAL HANDLING FOR CONTEXT QUESTIONS:
If the user asks "How do you know about my course?" or similar context questions, I should:
1. Reference specific wizard data I have stored (target audience, difficulty, bloom's focus, etc.)
2. Mention the course creation journey we completed together
3. Reference current course state (chapters, sections, completion status)
4. Explain my persistent memory system and how I maintain context

SPECIAL HANDLING FOR CONTENT GENERATION:
If the user asks to "Generate X chapters" or similar content requests, I should:
1. Reference the original course creation wizard preferences
2. Generate content that aligns with the original target audience and difficulty
3. Provide structured data in the "data" field for form synchronization
4. Include Bloom's taxonomy alignment based on original preferences

Return response as JSON:
{
  "content": "Main response acknowledging memory context and providing specific guidance",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"],
  "actionsTaken": ["action1", "action2"],
  "data": { "any relevant structured data for form synchronization" }
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    
    try {
      const parsed = JSON.parse(content);
      return {
        content: parsed.content,
        suggestions: parsed.suggestions || [],
        actionsTaken: parsed.actionsTaken || [],
        data: parsed.data || null
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        content: content || generateMemoryBasedFallbackResponse(message, courseContext, samMemoryContext),
        suggestions: generateMemoryBasedSuggestions(courseContext, samMemoryContext),
        actionsTaken: [],
        data: null
      };
    }
  } catch (error) {
    logger.error('Error calling Anthropic API:', error);
    return {
      content: generateMemoryBasedFallbackResponse(message, courseContext, samMemoryContext),
      suggestions: generateMemoryBasedSuggestions(courseContext, samMemoryContext),
      actionsTaken: [],
      data: null
    };
  }
}

function buildEnhancedContextPrompt(courseContext: any, samMemoryContext: any) {
  const sections = [];
  
  // Current course state
  sections.push(`**CURRENT COURSE STATE:**
- Title: "${courseContext.courseTitle}"
- Status: ${courseContext.isPublished ? 'Published' : 'Draft'}
- Health Score: ${courseContext.healthScore}%
- Completion: ${Math.round(courseContext.completionPercentage)}%
- Structure: ${courseContext.totalChapters} chapters, ${courseContext.totalSections} sections
- Learning Objectives: ${courseContext.objectiveCount}
- Attachments: ${courseContext.attachmentCount}`);

  // Wizard context if available
  if (samMemoryContext.wizardContext) {
    sections.push(`**ORIGINAL COURSE CREATION CONTEXT:**
- Target Audience: ${samMemoryContext.wizardContext.targetAudience}
- Difficulty Level: ${samMemoryContext.wizardContext.difficulty}
- Learning Intent: ${samMemoryContext.wizardContext.originalIntent}
- Bloom's Focus: ${samMemoryContext.wizardContext.bloomsFocus?.join(', ')}
- Content Types: ${samMemoryContext.wizardContext.preferredContentTypes?.join(', ')}
- Generation Preferences: ${samMemoryContext.wizardContext.generationPreferences?.chapterCount} chapters, ${samMemoryContext.wizardContext.generationPreferences?.sectionsPerChapter} sections per chapter
- Include Assessments: ${samMemoryContext.wizardContext.generationPreferences?.includeAssessments ? 'Yes' : 'No'}`);
  }

  // Generated content context
  if (samMemoryContext.generatedContent) {
    sections.push(`**PREVIOUSLY GENERATED CONTENT:**
- Generation Method: ${samMemoryContext.generatedContent.generationMethod}
- Generated At: ${samMemoryContext.generatedContent.generatedAt}
- Enhanced Objectives: ${samMemoryContext.generatedContent.enhancedObjectives?.length || 0} objectives
- Generated Chapters: ${samMemoryContext.generatedContent.chapters?.length || 0} chapters`);
  }

  // User preferences
  if (samMemoryContext.userProfile) {
    sections.push(`**USER PREFERENCES & BEHAVIOR:**
- Experience Level: ${samMemoryContext.userProfile.experienceLevel || 'Unknown'}
- Communication Style: ${samMemoryContext.userProfile.communicationStyle || 'Not set'}
- Preferred Generation: ${samMemoryContext.userProfile.preferredGenerationMethod || 'Not set'}
- Last Active Section: ${samMemoryContext.userProfile.lastActiveSection || 'None'}`);
  }

  // Recent interactions summary
  if (samMemoryContext.conversationHistory && samMemoryContext.conversationHistory.length > 0) {
    const recentCount = Math.min(3, samMemoryContext.conversationHistory.length);
    sections.push(`**RECENT INTERACTION CONTEXT:**
${samMemoryContext.conversationHistory.slice(-recentCount).map((conv: any, i: number) => 
  `${i + 1}. ${conv.type === 'user' ? 'Teacher' : 'SAM'}: ${conv.content.substring(0, 100)}...`
).join('\n')}`);
  }

  return sections.join('\n\n');
}

function buildEnhancedConversationHistory(conversationHistory: any[], samMemoryContext: any) {
  const history = conversationHistory.slice(-5); // Recent conversation
  const memoryHistory = samMemoryContext.conversationHistory?.slice(-3) || []; // Memory context
  
  const combined = [
    ...memoryHistory.map((conv: any) => `[Memory] ${conv.type === 'user' ? 'Teacher' : 'SAM'}: ${conv.content}`),
    ...history.map((conv: any) => `[Current] ${conv.type === 'user' ? 'Teacher' : 'SAM'}: ${conv.content}`)
  ];
  
  return combined.length > 0 ? combined.join('\n') : 'This is the start of our enhanced conversation with memory context.';
}

function detectBlueprintRequest(message: string): boolean {
  const blueprintKeywords = [
    'blueprint', 'generate', 'create course', 'build course', 'course structure',
    'generate content', 'create chapters', 'build curriculum', 'course outline'
  ];
  
  const lowerMessage = message.toLowerCase();
  return blueprintKeywords.some(keyword => lowerMessage.includes(keyword));
}

function generateMemoryBasedFallbackResponse(message: string, courseContext: any, samMemoryContext: any): string {
  const isContextQuestion = message.toLowerCase().includes('how do you know') || 
                          message.toLowerCase().includes('how did you know') ||
                          message.toLowerCase().includes('course structure') ||
                          message.toLowerCase().includes('my course');
  
  if (isContextQuestion) {
    let response = `🧠 **Great question! Here's exactly how I know about your course structure:**\n\n`;
    
    if (samMemoryContext.wizardContext) {
      response += `📝 **From our Course Creation Wizard session:**\n`;
      response += `• Target Audience: ${samMemoryContext.wizardContext.targetAudience}\n`;
      response += `• Difficulty Level: ${samMemoryContext.wizardContext.difficulty}\n`;
      response += `• Bloom's Focus: ${samMemoryContext.wizardContext.bloomsFocus?.join(', ')}\n`;
      response += `• Planned Structure: ${samMemoryContext.wizardContext.generationPreferences?.chapterCount} chapters\n\n`;
    }
    
    response += `📊 **Current Course State (Real-time):**\n`;
    response += `• Course: "${courseContext.courseTitle}"\n`;
    response += `• Chapters: ${courseContext.totalChapters} created\n`;
    response += `• Sections: ${courseContext.totalSections} total\n`;
    response += `• Learning Objectives: ${courseContext.objectiveCount}\n`;
    response += `• Completion: ${Math.round(courseContext.completionPercentage)}%\n\n`;
    
    response += `🔄 **My Memory System:**\n`;
    response += `I maintain persistent context throughout your entire course creation journey, from initial planning to current management. This allows me to provide contextual assistance and generate content that aligns with your original vision!`;
    
    return response;
  }
  
  let response = `I'm here to help with your course "${courseContext.courseTitle}".`;
  
  if (samMemoryContext.wizardContext) {
    response += ` I remember we created this course together for ${samMemoryContext.wizardContext.targetAudience} at ${samMemoryContext.wizardContext.difficulty} level.`;
  }
  
  response += ` Your course currently has ${courseContext.totalChapters} chapters and is ${Math.round(courseContext.completionPercentage)}% complete.`;
  
  if (detectBlueprintRequest(message)) {
    response += ` I can help you generate a comprehensive blueprint based on ${samMemoryContext.wizardContext ? 'our original planning session and' : ''} your current course structure.`;
  }
  
  return response;
}

function generateMemoryBasedSuggestions(courseContext: any, samMemoryContext: any): string[] {
  const suggestions = [];
  
  if (samMemoryContext.wizardContext) {
    suggestions.push("Generate blueprint from wizard data");
    suggestions.push("Compare current vs original plan");
  }
  
  if (courseContext.completionPercentage < 100) {
    suggestions.push("Complete remaining sections");
  }
  
  if (courseContext.objectiveCount < 5) {
    suggestions.push("Enhance learning objectives");
  }
  
  if (!courseContext.isPublished && courseContext.completionPercentage > 80) {
    suggestions.push("Review for publishing");
  }
  
  suggestions.push("Analyze course structure");
  
  return suggestions.slice(0, 4);
}