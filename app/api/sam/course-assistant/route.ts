import { NextRequest, NextResponse } from 'next/server';
import { runSAMChat } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { SAMGuards } from '@/lib/premium';

// Course Assistant is a premium-only feature
export const POST = SAMGuards.courseCreation(async (request, context) => {
  try {
    const {
      message,
      courseContext,
      conversationHistory = [],
      selectedContext
    } = await request.json();

    if (!message || !courseContext) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate context-aware response
    const response = await generateSamResponse({
      message,
      courseContext,
      conversationHistory,
      selectedContext,
      userId: context.userId
    });

    return NextResponse.json({
      response: response.content,
      suggestions: response.suggestions,
      data: response.data,
      timestamp: new Date().toISOString(),
      isPremium: context.isPremium
    });
  } catch (error) {
    logger.error('Error in SAM course assistant:', error);
    return NextResponse.json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});

async function generateSamResponse({
  message,
  courseContext,
  conversationHistory,
  selectedContext,
  userId
}: {
  message: string;
  courseContext: any;
  conversationHistory: any[];
  selectedContext?: string;
  userId: string;
}) {
  
  // Build comprehensive context for SAM
  const contextPrompt = buildContextPrompt(courseContext, selectedContext);
  
  // Build conversation history
  const historyContext = conversationHistory.length > 0 
    ? conversationHistory.map(msg => `${msg.type === 'user' ? 'Teacher' : 'SAM'}: ${msg.content}`).join('\n')
    : 'This is the start of our conversation.';

  const prompt = `I am SAM, an intelligent course management assistant specializing in educational design, content optimization, and learning analytics. I'm currently helping a teacher manage their course with full contextual awareness.

COURSE CONTEXT:
${contextPrompt}

CONVERSATION HISTORY:
${historyContext}

CURRENT TEACHER MESSAGE: "${message}"

TASK: Provide a helpful, specific, and actionable response based on the complete course context. I should:

1. **Acknowledge the specific course context** - Reference actual data from their course
2. **Provide actionable insights** - Give specific recommendations based on their current state
3. **Use educational expertise** - Apply pedagogical best practices and learning science
4. **Be encouraging yet honest** - Support their efforts while pointing out areas for improvement
5. **Offer concrete next steps** - Suggest specific actions they can take

RESPONSE GUIDELINES:
- Use the teacher's actual course data in my response (chapter count, completion status, etc.)
- Provide 2-4 specific, actionable suggestions
- Keep responses conversational but professional
- Focus on immediate value and practical advice
- Reference their course health score (${courseContext.healthScore}%) when relevant

Return the response as a JSON object with:
{
  "content": "Main response content",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "data": { "any additional structured data if relevant" }
}`;

  try {
    const content = await runSAMChat({
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });
    
    try {
      const parsed = JSON.parse(content);
      return {
        content: parsed.content,
        suggestions: parsed.suggestions || [],
        data: parsed.data || null
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        content: content || generateFallbackResponse(message, courseContext),
        suggestions: generateFallbackSuggestions(courseContext),
        data: null
      };
    }
  } catch (error) {
    logger.error('Error calling Anthropic API:', error);
    return {
      content: generateFallbackResponse(message, courseContext),
      suggestions: generateFallbackSuggestions(courseContext),
      data: null
    };
  }
}

function buildContextPrompt(courseContext: any, selectedContext?: string) {
  return `
**COURSE OVERVIEW:**
- Title: "${courseContext.title}"
- Category: ${courseContext.category || 'Uncategorized'}
- Status: ${courseContext.isPublished ? 'Published' : 'Draft'}
- Health Score: ${courseContext.healthScore}%
- Completion: ${Math.round(courseContext.completionPercentage)}%

**COURSE STRUCTURE:**
- Chapters: ${courseContext.totalChapters} (${courseContext.publishedChapters} published)
- Sections: ${courseContext.totalSections} (${courseContext.publishedSections} published)
- Learning Objectives: ${courseContext.objectiveCount}
- Attachments: ${courseContext.attachmentCount}

**COMPLETION STATUS:**
- Completed Sections: ${courseContext.completedSections.join(', ')}
- Pending Sections: ${courseContext.pendingSections.join(', ')}

**COURSE HEALTH ANALYSIS:**
${generateHealthAnalysis(courseContext)}

**FOCUS AREA:** ${selectedContext || 'General course management'}

**AVAILABLE ACTIONS:**
I can help with: course structure optimization, content improvement, student engagement strategies, learning objective enhancement, analytics insights, publishing readiness, and general course management advice.`;
}

function generateHealthAnalysis(context: any) {
  const issues = [];
  const strengths = [];
  
  // Analyze completion status
  if (context.completionPercentage < 50) {
    issues.push("Course setup is less than 50% complete");
  } else if (context.completionPercentage < 80) {
    issues.push("Course setup needs finishing touches");
  } else {
    strengths.push("Course setup is nearly complete");
  }
  
  // Analyze content depth
  if (context.totalChapters < 3) {
    issues.push("Consider adding more chapters for comprehensive coverage");
  } else if (context.totalChapters > 15) {
    issues.push("Course might be too long - consider breaking into multiple courses");
  } else {
    strengths.push("Good chapter count for effective learning");
  }
  
  // Analyze learning objectives
  if (context.objectiveCount < 3) {
    issues.push("Add more learning objectives for clarity");
  } else if (context.objectiveCount > 10) {
    issues.push("Consider consolidating learning objectives");
  } else {
    strengths.push("Good number of learning objectives");
  }
  
  // Analyze publishing status
  if (!context.isPublished && context.completionPercentage > 80) {
    issues.push("Course is ready for publishing consideration");
  }
  
  return `
**Strengths:** ${strengths.length > 0 ? strengths.join('; ') : 'Course has potential for improvement'}
**Areas for Improvement:** ${issues.length > 0 ? issues.join('; ') : 'Course is in good shape'}`;
}

function generateFallbackResponse(message: string, context: any): string {
  const messageType = detectMessageType(message);
  
  switch (messageType) {
    case 'analytics':
      return `Based on your course "${context.title}" with ${context.totalChapters} chapters and a ${context.healthScore}% health score, I can see areas for improvement. Your course completion is at ${Math.round(context.completionPercentage)}%, which is ${context.completionPercentage > 80 ? 'excellent' : context.completionPercentage > 60 ? 'good' : 'needs attention'}.`;
    
    case 'structure':
      return `Your course structure shows ${context.totalChapters} chapters with ${context.totalSections} sections total. ${context.publishedChapters} chapters are published out of ${context.totalChapters}. This ${context.totalChapters < 5 ? 'might benefit from additional content' : context.totalChapters > 12 ? 'is quite comprehensive' : 'looks well-structured'}.`;
    
    case 'objectives':
      return `You have ${context.objectiveCount} learning objectives defined. ${context.objectiveCount < 3 ? 'Consider adding more specific objectives' : context.objectiveCount > 8 ? 'You might want to consolidate some objectives' : 'This is a good number for clear learning outcomes'}.`;
    
    default:
      return `I'm here to help with your course "${context.title}". With a ${context.healthScore}% health score and ${Math.round(context.completionPercentage)}% completion, there are several ways I can assist you in optimizing your course content and structure.`;
  }
}

function generateFallbackSuggestions(context: any): string[] {
  const suggestions = [];
  
  if (context.completionPercentage < 100) {
    suggestions.push("Complete remaining course sections");
  }
  
  if (context.objectiveCount < 5) {
    suggestions.push("Add more specific learning objectives");
  }
  
  if (context.totalChapters < 5) {
    suggestions.push("Consider adding more chapters");
  }
  
  if (!context.isPublished && context.completionPercentage > 80) {
    suggestions.push("Review course for publishing");
  }
  
  if (context.attachmentCount === 0) {
    suggestions.push("Add supporting resources and attachments");
  }
  
  suggestions.push("Analyze course structure and flow");
  
  return suggestions.slice(0, 4); // Limit to 4 suggestions
}

function detectMessageType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('analytic') || lowerMessage.includes('performance') || lowerMessage.includes('data')) {
    return 'analytics';
  }
  
  if (lowerMessage.includes('structure') || lowerMessage.includes('chapter') || lowerMessage.includes('section')) {
    return 'structure';
  }
  
  if (lowerMessage.includes('objective') || lowerMessage.includes('goal') || lowerMessage.includes('outcome')) {
    return 'objectives';
  }
  
  if (lowerMessage.includes('engage') || lowerMessage.includes('student') || lowerMessage.includes('learner')) {
    return 'engagement';
  }
  
  return 'general';
}
