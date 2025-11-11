import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import getAnthropicClient from '@/lib/anthropic-client';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, pageContext, pathname, conversationHistory } = await req.json();

    // Build context-aware system prompt
    const systemPrompt = `You are SAM, an intelligent context-aware AI assistant for teachers in the Taxomind LMS platform. You have full awareness of the current page context and can provide tailored assistance.

CURRENT PAGE CONTEXT:
- Page Name: ${pageContext.pageName}
- Page Type: ${pageContext.pageType}
- Current Route: ${pathname}
- Breadcrumbs: ${pageContext.breadcrumbs.join(' → ')}
- Available Capabilities: ${pageContext.capabilities.join(', ')}
- Data Context: ${JSON.stringify(pageContext.dataContext)}

PARENT CONTEXT:
${pageContext.parentContext ? `- Course ID: ${pageContext.parentContext.courseId || 'N/A'}
- Chapter ID: ${pageContext.parentContext.chapterId || 'N/A'}
- Section ID: ${pageContext.parentContext.sectionId || 'N/A'}
- Post ID: ${pageContext.parentContext.postId || 'N/A'}` : '- No parent context available'}

RESPONSE GUIDELINES:
1. Always respond in context of the current page the user is on
2. Provide specific, actionable advice relevant to the page type
3. Reference the current location in your responses when helpful
4. Suggest next steps that align with the user's current workflow
5. Use your capabilities to provide the most relevant assistance
6. If the user asks for navigation help, provide specific route information
7. When suggesting actions, consider the page context and available features

PAGE-SPECIFIC CAPABILITIES:
${getPageSpecificCapabilities(pageContext.pageType)}

NAVIGATION KNOWLEDGE:
- Teacher dashboard: /teacher
- Courses management: /teacher/courses
- Course creation: /teacher/create
- Analytics: /teacher/analytics
- Posts management: /teacher/posts or /teacher/allposts
- Templates: /teacher/templates
- Specific course editing: /teacher/courses/[courseId]
- Chapter editing: /teacher/courses/[courseId]/chapters/[chapterId]
- Section editing: /teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]

Always be helpful, specific, and contextually aware. Provide actionable advice that fits the user's current workflow and page context.`;

    // Generate response using Anthropic
    const messages = [
      ...conversationHistory.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      { role: "user" as const, content: message }
    ];

    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages
    });

    const aiContent = response.content[0];
    if (aiContent.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API');
    }
    
    const aiResponse = aiContent.text || "I couldn't generate a response.";

    // Generate contextual suggestions based on page type
    const suggestions = generateContextualSuggestions(pageContext.pageType, message);

    // Check if we need to generate any actions
    const action = generateAction(message, pageContext, aiResponse);

    return NextResponse.json({
      response: aiResponse,
      suggestions,
      action,
      metadata: {
        pageContext: pageContext.pageType,
        processingTime: Date.now(),
        confidence: 0.95
      }
    });

  } catch (error) {
    logger.error('Context-Aware SAM API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function getPageSpecificCapabilities(pageType: string): string {
  const capabilities: Record<string, string> = {
    'courses': `
- Course overview and analytics
- Course creation guidance
- Performance insights
- Bulk operations
- Student engagement analysis`,
    'course-detail': `
- Learning objectives generation
- Chapter creation and management
- Course structure analysis
- Content improvement suggestions
- Course analytics and insights`,
    'chapter-detail': `
- Section creation and management
- Content generation
- Assessment creation
- Chapter performance analysis
- Learning progression optimization`,
    'section-detail': `
- Video content management
- Blog post creation
- Exam and quiz creation
- Resource management
- Section-specific analytics`,
    'create': `
- Course planning and structure
- Target audience definition
- Learning path design
- Content strategy development
- Template selection guidance`,
    'analytics': `
- Performance insights and reporting
- Student analytics and tracking
- Course comparison and benchmarking
- Improvement recommendations
- Trend analysis`,
    'posts': `
- Content strategy development
- Post optimization
- Engagement improvement
- Content calendar planning
- SEO optimization`,
    'templates': `
- Template creation and design
- Template optimization
- Marketplace strategies
- Reusable component development
- Template performance analysis`,
    'other': `
- General navigation assistance
- Feature explanations
- Best practice guidance
- Platform orientation
- Workflow optimization`
  };

  return capabilities[pageType] || capabilities.other;
}

function generateContextualSuggestions(pageType: string, message: string): string[] {
  const suggestions: Record<string, string[]> = {
    'courses': [
      "Show course analytics",
      "Create a new course",
      "Improve course performance",
      "Analyze student engagement"
    ],
    'course-detail': [
      "Generate learning objectives",
      "Create new chapters",
      "Analyze course structure",
      "Improve content quality"
    ],
    'chapter-detail': [
      "Create chapter sections",
      "Generate content",
      "Add assessments",
      "Review chapter flow"
    ],
    'section-detail': [
      "Add video content",
      "Create blog post",
      "Design quiz",
      "Add resources"
    ],
    'create': [
      "Plan course structure",
      "Define target audience",
      "Design learning path",
      "Choose templates"
    ],
    'analytics': [
      "Show insights",
      "Compare performance",
      "Identify trends",
      "Get recommendations"
    ],
    'posts': [
      "Optimize content",
      "Improve engagement",
      "Plan content calendar",
      "SEO tips"
    ],
    'templates': [
      "Create template",
      "Optimize design",
      "Marketplace tips",
      "Reuse components"
    ],
    'other': [
      "Navigation help",
      "Feature overview",
      "Best practices",
      "Getting started"
    ]
  };

  return suggestions[pageType] || suggestions.other;
}

function generateAction(message: string, pageContext: any, aiResponse: string): any {
  const lowerMessage = message.toLowerCase();
  
  // Chapter-specific actions
  if (pageContext.pageType === 'chapter-detail') {
    // Form population actions
    if (lowerMessage.includes('title') && (lowerMessage.includes('generate') || lowerMessage.includes('create') || lowerMessage.includes('update'))) {
      // Extract suggested title from AI response
      const titleMatch = aiResponse.match(/(?:title|Title):\s*["']?([^"'\n]+)["']?/i);
      if (titleMatch) {
        return {
          type: 'form_update',
          details: {
            action: 'update_chapter_title',
            title: titleMatch[1].trim(),
            description: 'Update chapter title'
          }
        };
      }
    }
    
    if (lowerMessage.includes('description') && (lowerMessage.includes('generate') || lowerMessage.includes('create') || lowerMessage.includes('update'))) {
      // Extract suggested description from AI response
      const descMatch = aiResponse.match(/(?:description|Description):\s*["']?([^"'\n]+)["']?/i);
      if (descMatch) {
        return {
          type: 'form_update',
          details: {
            action: 'update_chapter_description',
            value: descMatch[1].trim(),
            description: 'Update chapter description'
          }
        };
      }
    }
    
    if (lowerMessage.includes('learning') && lowerMessage.includes('outcome') && (lowerMessage.includes('generate') || lowerMessage.includes('create'))) {
      // Extract learning outcomes from AI response
      const outcomes = extractLearningOutcomes(aiResponse);
      if (outcomes.length > 0) {
        return {
          type: 'form_update',
          details: {
            action: 'update_learning_outcomes',
            outcomes: outcomes.join('\n'),
            description: 'Update learning outcomes'
          }
        };
      }
    }
    
    if (lowerMessage.includes('section') && (lowerMessage.includes('create') || lowerMessage.includes('generate'))) {
      // Extract sections from AI response
      const sections = extractSections(aiResponse);
      if (sections.length > 0) {
        return {
          type: 'form_update',
          details: {
            action: 'create_sections',
            sections: sections,
            description: 'Create chapter sections'
          }
        };
      }
    }
    
    if (lowerMessage.includes('publish') && !lowerMessage.includes('unpublish')) {
      return {
        type: 'form_update',
        details: {
          action: 'publish_chapter',
          description: 'Publish chapter'
        }
      };
    }
    
    if (lowerMessage.includes('unpublish')) {
      return {
        type: 'form_update',
        details: {
          action: 'unpublish_chapter',
          description: 'Unpublish chapter'
        }
      };
    }
    
    if (lowerMessage.includes('free') || lowerMessage.includes('paid')) {
      return {
        type: 'form_update',
        details: {
          action: 'update_chapter_access',
          isFree: lowerMessage.includes('free'),
          description: `Make chapter ${lowerMessage.includes('free') ? 'free' : 'paid'}`
        }
      };
    }
  }
  
  // Navigation actions
  if (lowerMessage.includes('navigate') || lowerMessage.includes('go to')) {
    if (lowerMessage.includes('course')) {
      return {
        type: 'navigation',
        details: {
          url: '/teacher/courses',
          description: 'Courses page'
        }
      };
    }
    if (lowerMessage.includes('create')) {
      return {
        type: 'navigation',
        details: {
          url: '/teacher/create',
          description: 'Course creation page'
        }
      };
    }
    if (lowerMessage.includes('analytics')) {
      return {
        type: 'navigation',
        details: {
          url: '/teacher/analytics',
          description: 'Analytics dashboard'
        }
      };
    }
  }

  // Refresh actions
  if (lowerMessage.includes('refresh') || lowerMessage.includes('reload')) {
    return {
      type: 'page_action',
      details: {
        action: 'refresh',
        description: 'Refresh current page'
      }
    };
  }

  return null;
}

// Helper function to extract learning outcomes from AI response
function extractLearningOutcomes(response: string): string[] {
  const outcomes: string[] = [];
  
  // Try to extract numbered or bulleted list
  const lines = response.split('\n');
  const outcomePattern = /^(?:\d+\.|[\•\-\*])\s*(.+)/;
  
  for (const line of lines) {
    const match = line.match(outcomePattern);
    if (match && match[1].trim()) {
      outcomes.push(match[1].trim());
    }
  }
  
  return outcomes.slice(0, 10); // Limit to 10 outcomes
}

// Helper function to extract sections from AI response
function extractSections(response: string): Array<{title: string; description?: string}> {
  const sections: Array<{title: string; description?: string}> = [];
  
  // Try to extract section titles and descriptions
  const lines = response.split('\n');
  let currentSection: {title: string; description?: string} | null = null;
  
  for (const line of lines) {
    // Match section titles (e.g., "Section 1: Title" or "1. Title")
    const sectionMatch = line.match(/^(?:Section\s+)?(\d+)[\.:]\s*(.+)/i);
    
    if (sectionMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      
      currentSection = {
        title: sectionMatch[2].trim(),
        description: ''
      };
    } else if (currentSection && line.trim() && !line.match(/^[\•\-\*]/)) {
      // Add to description if we have a current section
      if (currentSection.description && currentSection.description.length < 200) {
        currentSection.description += ' ' + line.trim();
      } else if (!currentSection.description) {
        currentSection.description = line.trim();
      }
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections.slice(0, 10); // Limit to 10 sections
}