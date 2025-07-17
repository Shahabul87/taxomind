import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import anthropic from '@/lib/anthropic-client';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, context, conversationHistory } = await req.json();

    // Extract chapter context if available
    const chapterContext = extractChapterContext(context);
    
    // Build comprehensive system prompt with chapter context
    const systemPrompt = `You are SAM, a Universal AI Assistant for the Taxomind LMS platform. You have COMPLETE awareness of the current page and can interact with ALL elements on it.

CURRENT PAGE ANALYSIS:
- Page Title: ${context.pageTitle}
- Page Description: ${context.pageDescription}
- Current URL: ${context.currentUrl}
- Breadcrumbs: ${context.breadcrumbs.join(' → ')}

${chapterContext ? `
CHAPTER CONTEXT:
- Chapter Title: ${chapterContext.title}
- Chapter Description: ${chapterContext.description}
- Course Context: ${chapterContext.courseInfo}
- Learning Focus: ${chapterContext.learningFocus}
` : ''}

DETECTED FORMS (${context.forms.length}):
${context.forms.map(form => `
• Form ID: ${form.id}${form.dataForm ? ` (data-form: ${form.dataForm})` : ''}
  Fields: ${form.fields.map(field => `
    - ${field.name} (${field.type})${field.label ? ` | Label: ${field.label}` : ''}${field.placeholder ? ` | Placeholder: ${field.placeholder}` : ''}${field.required ? ' | REQUIRED' : ''}${field.currentValue ? ` | Current: ${field.currentValue}` : ''}`).join('')}
`).join('')}

AVAILABLE LINKS (${context.links.length}):
${context.links.slice(0, 10).map(link => `• ${link}`).join('\n')}

INTERACTIVE BUTTONS (${context.buttons.length}):
${context.buttons.map(btn => `• "${btn.text}"${btn.action ? ` (${btn.action})` : ''}`).join('\n')}

DATA ELEMENTS (${context.dataElements.length}):
${context.dataElements.map(el => `• ${el.type}: ${el.content.substring(0, 100)}...`).join('\n')}

UNIVERSAL CAPABILITIES:
1. FORM INTELLIGENCE:
   - Detect any form on any page
   - Generate appropriate content for any field type
   - Populate forms with relevant data
   - Submit forms automatically
   - Understand form validation requirements

2. CONTENT GENERATION:
   - Create contextually relevant content
   - Adapt to different content types (titles, descriptions, etc.)
   - Follow educational best practices
   - Use appropriate tone and language

3. PAGE INTERACTION:
   - Navigate to any available link
   - Click buttons and trigger actions
   - Analyze and interact with data elements
   - Perform page-specific operations

4. CONTEXT AWARENESS:
   - Understand the current page purpose
   - Recognize user workflow and intent
   - Provide relevant suggestions
   - Maintain conversation context

5. CHAPTER-SPECIFIC ABILITIES:
   - Generate learning objectives/outcomes using Bloom's taxonomy
   - Create chapter titles and descriptions
   - Generate chapter sections and content
   - Understand educational content structure
   - Apply pedagogical principles

LEARNING OBJECTIVES GENERATION:
When asked to generate learning objectives or outcomes for a chapter:
- ALWAYS use the specific CHAPTER CONTEXT provided above - especially the chapter title and description
- Use action verbs from Bloom's taxonomy (understand, analyze, apply, evaluate, create, etc.)
- Structure as "Students will be able to..." or "By the end of this chapter, learners will..."
- Make them specific, measurable, and directly relevant to the actual chapter title and content
- Include different cognitive levels (knowledge, comprehension, application, analysis, synthesis, evaluation)
- Format as HTML list items or clear bullet points
- Ensure they align EXACTLY with the chapter title and subject matter, not generic learning objectives
- Consider the course context and learning focus when generating objectives
- Generate 4-6 specific objectives that relate to the chapter's actual content

RESPONSE GUIDELINES:
- Always respond with full awareness of the current page
- Provide specific, actionable assistance
- When asked to generate content, create appropriate responses for the context
- When asked to populate forms, provide structured data
- When asked to perform actions, specify the exact action type
- Be proactive in suggesting relevant next steps
- Use your knowledge of educational content and LMS best practices

ACTION GENERATION:
When the user requests actions, generate appropriate action objects:
- form_populate: For filling forms with data
- form_submit: For submitting forms
- navigation: For navigating to other pages
- page_action: For clicking buttons or other interactions
- data_analysis: For analyzing page data

Always provide helpful, contextually aware responses that demonstrate your understanding of the current page and its capabilities.`;

    // Generate response using Anthropic
    const messages = [
      ...conversationHistory.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      { role: "user" as const, content: message }
    ];

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages
    });

    const aiContent = response.content[0];
    if (aiContent.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API');
    }
    
    const aiResponse = aiContent.text || "I couldn't generate a response.";

    // Generate contextual suggestions
    const suggestions = generateContextualSuggestions(context, message);

    // Generate actions based on message and context
    const action = generateUniversalAction(message, context, aiResponse);

    return NextResponse.json({
      response: aiResponse,
      suggestions,
      action,
      metadata: {
        pageTitle: context.pageTitle,
        formsCount: context.forms.length,
        buttonsCount: context.buttons.length,
        processingTime: Date.now(),
        confidence: 0.95
      }
    });

  } catch (error) {
    console.error('Universal SAM API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function generateContextualSuggestions(context: any, message: string): string[] {
  const suggestions = [];
  
  // Form-based suggestions
  if (context.forms.length > 0) {
    suggestions.push('Generate content for all forms');
    suggestions.push('Populate available forms');
    suggestions.push('Analyze form requirements');
  }
  
  // Button-based suggestions
  if (context.buttons.length > 0) {
    suggestions.push('Explain available actions');
    suggestions.push('Help with workflow');
  }
  
  // Data-based suggestions
  if (context.dataElements.length > 0) {
    suggestions.push('Analyze page data');
    suggestions.push('Summarize information');
  }
  
  // Navigation suggestions
  if (context.links.length > 0) {
    suggestions.push('Show navigation options');
    suggestions.push('Recommend next steps');
  }
  
  // Always available
  suggestions.push('Page overview');
  suggestions.push('Best practices');
  
  return suggestions.slice(0, 6); // Limit suggestions
}

function generateUniversalAction(message: string, context: any, aiResponse: string): any {
  const lowerMessage = message.toLowerCase();
  const chapterContext = extractChapterContext(context);
  
  // Chapter-specific learning objectives/outcomes
  if (lowerMessage.includes('learning') && (lowerMessage.includes('objectives') || lowerMessage.includes('outcomes'))) {
    // Find the learning outcomes form
    const learningOutcomesForm = context.forms.find((form: any) => 
      form.dataForm === 'chapter-learning-outcomes' || 
      form.id.includes('learning-outcomes') ||
      form.fields.some((field: any) => field.name === 'learningOutcomes')
    );
    
    if (learningOutcomesForm) {
      // Extract learning outcomes from AI response
      const outcomes = extractLearningOutcomes(aiResponse);
      if (outcomes.length > 0) {
        return {
          type: 'form_populate',
          details: {
            formId: learningOutcomesForm.dataForm || learningOutcomesForm.id,
            data: { learningOutcomes: outcomes.join('<br>') },
            description: `Generate context-aware learning objectives for: ${chapterContext?.title || 'this chapter'}`
          }
        };
      }
    }
  }
  
  // Chapter title generation
  if (lowerMessage.includes('chapter') && lowerMessage.includes('title') && (lowerMessage.includes('generate') || lowerMessage.includes('create'))) {
    const titleForm = context.forms.find((form: any) => 
      form.dataForm === 'chapter-title' || 
      form.fields.some((field: any) => field.name === 'title')
    );
    
    if (titleForm) {
      const titleMatch = aiResponse.match(/(?:title|Title):\s*["']?([^"'\n]+)["']?/i);
      if (titleMatch) {
        return {
          type: 'form_populate',
          details: {
            formId: titleForm.dataForm || titleForm.id,
            data: { title: titleMatch[1].trim() },
            description: 'Generate chapter title'
          }
        };
      }
    }
  }
  
  // Chapter description generation
  if (lowerMessage.includes('chapter') && lowerMessage.includes('description') && (lowerMessage.includes('generate') || lowerMessage.includes('create'))) {
    const descForm = context.forms.find((form: any) => 
      form.dataForm === 'chapter-description' || 
      form.fields.some((field: any) => field.name === 'description')
    );
    
    if (descForm) {
      const descMatch = aiResponse.match(/(?:description|Description):\s*["']?([^"'\n]+)["']?/i);
      if (descMatch) {
        return {
          type: 'form_populate',
          details: {
            formId: descForm.dataForm || descForm.id,
            data: { description: descMatch[1].trim() },
            description: 'Generate chapter description'
          }
        };
      }
    }
  }
  
  // Section creation for chapters
  if (lowerMessage.includes('section') && (lowerMessage.includes('create') || lowerMessage.includes('generate'))) {
    const sections = extractSections(aiResponse);
    if (sections.length > 0) {
      return {
        type: 'form_populate',
        details: {
          formId: 'chapter-sections',
          data: { sections: sections },
          description: 'Create chapter sections'
        }
      };
    }
  }
  
  // Form population actions
  if (lowerMessage.includes('populate') || lowerMessage.includes('fill')) {
    if (lowerMessage.includes('form')) {
      // Try to extract form data from AI response
      const formData = extractFormDataFromResponse(aiResponse, context.forms);
      if (formData.formId && Object.keys(formData.data).length > 0) {
        return {
          type: 'form_populate',
          details: {
            formId: formData.formId,
            data: formData.data,
            description: `Populate ${formData.formId} form`
          }
        };
      }
    }
  }
  
  // Form submission actions
  if (lowerMessage.includes('submit') && lowerMessage.includes('form')) {
    const formMatch = lowerMessage.match(/submit\s+(?:the\s+)?(?:form\s+)?(\w+|\S+)/i);
    if (formMatch && context.forms.length > 0) {
      const formId = context.forms[0].id; // Use first form if no specific form mentioned
      return {
        type: 'form_submit',
        details: {
          formId: formId,
          description: `Submit ${formId} form`
        }
      };
    }
  }
  
  // Content generation for specific forms
  if (lowerMessage.includes('generate') && context.forms.length > 0) {
    const formData = generateContextualFormData(context.forms[0], context);
    if (formData) {
      return {
        type: 'form_populate',
        details: {
          formId: context.forms[0].id,
          data: formData,
          description: `Generate content for ${context.forms[0].id}`
        }
      };
    }
  }
  
  // Navigation actions
  if (lowerMessage.includes('navigate') || lowerMessage.includes('go to')) {
    const linkMatch = extractNavigationTarget(lowerMessage, context.links);
    if (linkMatch) {
      return {
        type: 'navigation',
        details: {
          url: linkMatch,
          description: 'Navigate to page'
        }
      };
    }
  }
  
  // Button click actions
  if (lowerMessage.includes('click') || lowerMessage.includes('button')) {
    const buttonMatch = context.buttons.find(btn => 
      lowerMessage.includes(btn.text.toLowerCase())
    );
    if (buttonMatch) {
      return {
        type: 'page_action',
        details: {
          action: 'click',
          params: { 
            selector: `button:contains("${buttonMatch.text}")` 
          },
          description: `Click ${buttonMatch.text} button`
        }
      };
    }
  }
  
  // Data analysis actions
  if (lowerMessage.includes('analyze') || lowerMessage.includes('summary')) {
    return {
      type: 'data_analysis',
      details: {
        action: 'analyze',
        description: 'Analyze page data'
      }
    };
  }
  
  // Refresh actions
  if (lowerMessage.includes('refresh') || lowerMessage.includes('reload')) {
    return {
      type: 'page_action',
      details: {
        action: 'refresh',
        description: 'Refresh page'
      }
    };
  }
  
  return null;
}

function extractFormDataFromResponse(aiResponse: string, forms: any[]): { formId: string; data: Record<string, any> } {
  const result = { formId: '', data: {} };
  
  if (forms.length === 0) return result;
  
  // Use first form as target
  const targetForm = forms[0];
  result.formId = targetForm.id;
  
  // Extract common field patterns
  const patterns = [
    { regex: /title:\s*["']?([^"'\n]+)["']?/i, fields: ['title', 'name'] },
    { regex: /description:\s*["']?([^"'\n]+)["']?/i, fields: ['description', 'desc'] },
    { regex: /email:\s*["']?([^"'\n]+)["']?/i, fields: ['email'] },
    { regex: /url:\s*["']?([^"'\n]+)["']?/i, fields: ['url', 'link'] },
    { regex: /price:\s*["']?([^"'\n]+)["']?/i, fields: ['price', 'cost'] },
    { regex: /category:\s*["']?([^"'\n]+)["']?/i, fields: ['category'] },
  ];
  
  patterns.forEach(pattern => {
    const match = aiResponse.match(pattern.regex);
    if (match) {
      const value = match[1].trim();
      pattern.fields.forEach(fieldName => {
        if (targetForm.fields.find((f: any) => f.name === fieldName)) {
          result.data[fieldName] = value;
        }
      });
    }
  });
  
  return result;
}

function generateContextualFormData(form: any, context: any): Record<string, any> | null {
  if (!form || !form.fields) return null;
  
  const data: Record<string, any> = {};
  
  // Generate data based on page context and field types
  form.fields.forEach((field: any) => {
    const fieldName = field.name.toLowerCase();
    const fieldType = field.type;
    
    if (fieldName.includes('title') || fieldName.includes('name')) {
      data[field.name] = generateTitle(context);
    } else if (fieldName.includes('description') || fieldName.includes('desc')) {
      data[field.name] = generateDescription(context);
    } else if (fieldName.includes('email')) {
      data[field.name] = 'user@example.com';
    } else if (fieldName.includes('url') || fieldName.includes('link')) {
      data[field.name] = 'https://example.com';
    } else if (fieldType === 'checkbox') {
      data[field.name] = 'true';
    } else if (field.placeholder) {
      data[field.name] = field.placeholder.replace(/^e\.g\.\s*/, '');
    } else {
      data[field.name] = `Generated ${fieldName}`;
    }
  });
  
  return data;
}

function generateTitle(context: any): string {
  const pageTitle = context.pageTitle || 'Page';
  const templates = [
    `Enhanced ${pageTitle}`,
    `Advanced ${pageTitle}`,
    `Improved ${pageTitle}`,
    `Professional ${pageTitle}`,
    `Complete ${pageTitle}`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

function generateDescription(context: any): string {
  const pageTitle = context.pageTitle || 'content';
  return `This is a comprehensive description for ${pageTitle}. It provides detailed information about the features, benefits, and usage guidelines.`;
}

function extractNavigationTarget(message: string, links: string[]): string | null {
  // Simple pattern matching for navigation
  const patterns = [
    /go to (.+)/i,
    /navigate to (.+)/i,
    /visit (.+)/i,
    /open (.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const target = match[1].trim();
      // Try to find matching link
      const matchingLink = links.find(link => 
        link.toLowerCase().includes(target.toLowerCase()) ||
        target.toLowerCase().includes(link.split('/').pop()?.toLowerCase() || '')
      );
      if (matchingLink) return matchingLink;
    }
  }
  
  return null;
}

// Enhanced helper function to extract learning outcomes from AI response
function extractLearningOutcomes(response: string): string[] {
  const outcomes: string[] = [];
  
  // Try to extract numbered or bulleted list
  const lines = response.split('\n');
  const outcomePattern = /^(?:\d+\.|[•\-*])\s*(.+)/;
  
  for (const line of lines) {
    const match = line.match(outcomePattern);
    if (match && match[1].trim()) {
      outcomes.push(match[1].trim());
    }
  }
  
  // If no structured list found, try to extract sentences that sound like learning outcomes
  if (outcomes.length === 0) {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (lower.includes('will') || 
          lower.includes('able to') ||
          lower.includes('understand') ||
          lower.includes('learn') ||
          lower.includes('identify') ||
          lower.includes('demonstrate') ||
          lower.includes('apply') ||
          lower.includes('analyze') ||
          lower.includes('create') ||
          lower.includes('evaluate')) {
        outcomes.push(sentence.trim());
      }
    }
  }
  
  // If still no outcomes, try to extract key phrases from the response
  if (outcomes.length === 0) {
    const keyPhrases = response.match(/(?:Students will|Learners will|By the end|After completion|Participants will|You will)[^.!?]+/gi);
    if (keyPhrases) {
      keyPhrases.forEach(phrase => {
        outcomes.push(phrase.trim());
      });
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
    const sectionMatch = line.match(/^(?:Section\s+)?(\d+)[\.\:]?\s*(.+)/i);
    
    if (sectionMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      
      currentSection = {
        title: sectionMatch[2].trim(),
        description: ''
      };
    } else if (currentSection && line.trim() && !line.match(/^[•\-*]/)) {
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

// Helper function to extract chapter context from page data
function extractChapterContext(context: any): { title: string; description: string; courseInfo: string; learningFocus: string } | null {
  // Check if we're on a chapter page
  if (!context.currentUrl.includes('/chapters/')) {
    return null;
  }
  
  // Extract chapter title from page title or breadcrumbs
  let chapterTitle = '';
  if (context.pageTitle && context.pageTitle !== 'Unknown Page') {
    chapterTitle = context.pageTitle;
  } else if (context.breadcrumbs && context.breadcrumbs.length > 0) {
    chapterTitle = context.breadcrumbs[context.breadcrumbs.length - 1];
  }
  
  // Extract chapter description from page description or forms
  let chapterDescription = context.pageDescription || '';
  
  // Try to find chapter-specific data from forms
  const chapterTitleForm = context.forms.find((form: any) => 
    form.dataForm === 'chapter-title' || form.id.includes('title')
  );
  
  const chapterDescForm = context.forms.find((form: any) => 
    form.dataForm === 'chapter-description' || form.id.includes('description')
  );
  
  // Extract current values from form fields
  if (chapterTitleForm) {
    const titleField = chapterTitleForm.fields.find((field: any) => field.name === 'title');
    if (titleField && titleField.currentValue) {
      chapterTitle = titleField.currentValue;
    }
  }
  
  if (chapterDescForm) {
    const descField = chapterDescForm.fields.find((field: any) => field.name === 'description');
    if (descField && descField.currentValue) {
      chapterDescription = descField.currentValue;
    }
  }
  
  // Extract course context from breadcrumbs
  const courseInfo = context.breadcrumbs.length > 1 ? 
    context.breadcrumbs.slice(0, -1).join(' → ') : 
    'Course Content';
  
  // Determine learning focus based on chapter title and description
  let learningFocus = '';
  if (chapterTitle || chapterDescription) {
    const combined = `${chapterTitle} ${chapterDescription}`.toLowerCase();
    if (combined.includes('introduction') || combined.includes('overview')) {
      learningFocus = 'Foundational understanding and key concepts';
    } else if (combined.includes('practical') || combined.includes('hands-on') || combined.includes('exercise')) {
      learningFocus = 'Practical application and skill development';
    } else if (combined.includes('advanced') || combined.includes('complex')) {
      learningFocus = 'Advanced concepts and deep analysis';
    } else if (combined.includes('project') || combined.includes('case study')) {
      learningFocus = 'Project-based learning and real-world application';
    } else {
      learningFocus = 'Comprehensive understanding and skill mastery';
    }
  }
  
  return {
    title: chapterTitle || 'Chapter',
    description: chapterDescription || 'Chapter content',
    courseInfo,
    learningFocus
  };
}