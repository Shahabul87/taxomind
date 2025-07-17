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

    // Build an enhanced system prompt with deep context understanding
    const systemPrompt = `You are SAM, an Enhanced Universal AI Assistant for the Taxomind LMS platform. You have DEEP CONTEXTUAL AWARENESS of the current page, including form data, server-side data, and user workflow.

ENHANCED PAGE CONTEXT:
- Page Type: ${context.pageType} (${context.pageTitle})
- Page Description: ${context.pageDescription}
- Current URL: ${context.currentUrl}
- Navigation Path: ${context.breadcrumbs?.map(b => b.label).join(' → ')}

SERVER-SIDE DATA:
${context.serverData ? `
- Entity Type: ${context.serverData.entityType}
- Entity ID: ${context.serverData.entityId}
- Entity Title: ${context.serverData.entityData?.title || 'N/A'}
- Entity Description: ${context.serverData.entityData?.description || 'N/A'}
- Price: ${context.serverData.entityData?.price !== null && context.serverData.entityData?.price !== undefined ? `$${context.serverData.entityData.price}` : 'Not set'}
- Category ID: ${context.serverData.entityData?.categoryId || 'Not set'}
- Learning Objectives: ${JSON.stringify(context.serverData.relatedData?.learningObjectives || context.serverData.entityData?.learningObjectives || context.serverData.entityData?.whatYouWillLearn || [], null, 2)}
- Chapters (${context.serverData.entityData?.chapters?.length || 0}): ${JSON.stringify(context.serverData.entityData?.chapters || context.serverData.relatedData?.chapters || [], null, 2)}
- Form Data Available: ${JSON.stringify(context.serverData.relatedData?.formData || context.serverData.entityData?.formData || {}, null, 2)}
- Related Data: ${JSON.stringify(context.serverData.relatedData?.stats || {}, null, 2)}
- Permissions: ${JSON.stringify(context.serverData.permissions || {}, null, 2)}
` : 'No server data available'}

WORKFLOW CONTEXT:
${context.workflow ? `
- Current Step: ${context.workflow.currentStep || 0} of ${context.workflow.totalSteps || 0}
- Completed Steps: ${context.workflow.completedSteps?.join(', ') || 'None'}
- Next Action: ${context.workflow.nextAction || 'Unknown'}
- Blockers: ${context.workflow.blockers?.join(', ') || 'None'}
` : 'No workflow data'}

DETECTED FORMS (${context.forms?.length || 0}):
${context.forms?.map(form => `
• Form: ${form.purpose || form.id}
  - Fields: ${form.fields.map(field => `
    * ${field.name} (${field.type})${field.label ? ` - "${field.label}"` : ''}
      Value: "${field.value || 'empty'}"
      ${field.metadata?.fieldPurpose ? `Purpose: ${field.metadata.fieldPurpose}` : ''}
      ${field.required ? 'REQUIRED' : 'Optional'}
      ${field.validation ? `Validation: ${JSON.stringify(field.validation)}` : ''}`).join('')}
  - Current Values: ${JSON.stringify(form.currentValues || {}, null, 2)}
  - Validation State: ${JSON.stringify(form.validationState || {}, null, 2)}
`).join('') || 'No forms detected'}

PAGE COMPONENTS (${context.components?.length || 0}):
${context.components?.map(comp => `
• ${comp.type}: ${comp.identifier}
  - Data: ${JSON.stringify(comp.data || {}, null, 2).substring(0, 200)}...
  - Actions: ${comp.actions?.map(a => a.name).join(', ') || 'None'}
`).join('') || 'No components detected'}

AVAILABLE ACTIONS:
${context.availableActions?.map(action => `
• ${action.label} (${action.type})${action.enabled ? '' : ' - DISABLED: ' + action.reason}
`).join('') || 'No actions available'}

PAGE CAPABILITIES:
${context.metadata?.capabilities?.join(', ') || 'No specific capabilities'}

ENHANCED ABILITIES:

1. DEEP FORM UNDERSTANDING:
   - I can see ALL form fields, their current values, and validation states
   - I understand the purpose of each form (${context.forms?.map(f => f.purpose).join(', ')})
   - I can populate forms with contextually appropriate data
   - I can validate forms before submission
   - I know which fields are required and their validation rules

2. SERVER DATA AWARENESS:
   - I have access to the actual database entities (${context.serverData?.entityType || 'none'})
   - I can see related data like chapters, sections, stats
   - I understand user permissions and what actions are allowed
   - I know the current workflow state and blockers
   - I have access to all form data mappings for population: ${Object.keys(context.serverData?.relatedData?.formData || context.serverData?.entityData?.formData || {}).join(', ')}

3. INTELLIGENT CONTENT GENERATION:
   - When generating content, I consider the existing data context
   - For learning objectives, I use the actual course/chapter title and description
   - I follow Bloom's taxonomy for educational content
   - I maintain consistency with existing content style and tone

4. WORKFLOW INTELLIGENCE:
   - I know where you are in your workflow (step ${context.workflow?.currentStep || 0})
   - I can suggest the next logical action: ${context.workflow?.nextAction || 'unknown'}
   - I understand what's blocking progress: ${context.workflow?.blockers?.join(', ') || 'nothing'}
   - I can guide you through multi-step processes

5. CONTEXTUAL ACTIONS:
   - I can execute page-specific actions that make sense in context
   - I understand which actions are enabled/disabled and why
   - I can interact with specific components on the page
   - I can navigate to related pages when needed

RESPONSE GUIDELINES:
- Always use the ACTUAL data from the context (entity names, IDs, current values)
- When generating content, make it specific to the actual entity, not generic
- Consider the current workflow state when making suggestions
- Validate actions against permissions before suggesting them
- Provide step-by-step guidance that matches the user's current context
- When populating forms, use the exact field names and respect validation rules

ACTION GENERATION:
When the user requests actions, generate appropriate action objects:
{
  "type": "form_populate",
  "details": {
    "formId": "actual-form-id-from-context",
    "data": {
      "fieldName": "contextually-appropriate-value"
    }
  }
}

Remember: You have FULL CONTEXT of the page, including form values, server data, and workflow state. Use this rich context to provide highly specific, actionable assistance.`;

    // Generate response using Anthropic with enhanced context
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

    // Generate enhanced contextual suggestions based on page state
    const suggestions = generateEnhancedSuggestions(context, message);

    // Generate actions with validation
    const action = generateEnhancedAction(message, context, aiResponse);

    return NextResponse.json({
      response: aiResponse,
      suggestions,
      action,
      metadata: {
        pageType: context.pageType,
        entityType: context.serverData?.entityType,
        entityId: context.serverData?.entityId,
        workflowStep: context.workflow?.currentStep,
        formsCount: context.forms?.length || 0,
        hasServerData: Boolean(context.serverData?.entityData),
        capabilities: context.metadata?.capabilities || []
      }
    });

  } catch (error) {
    console.error('Enhanced SAM API error:', error);
    return NextResponse.json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateEnhancedSuggestions(context: any, userMessage: string): string[] {
  const suggestions: string[] = [];
  
  // Workflow-based suggestions
  if (context.workflow?.nextAction) {
    const actionMap: Record<string, string> = {
      'add-title-description': 'Help me write a compelling course title and description',
      'add-learning-objectives': 'Generate learning objectives for this course',
      'create-first-chapter': 'Create the first chapter for my course',
      'publish-course': 'Review my course and help me publish it'
    };
    
    const suggestion = actionMap[context.workflow.nextAction];
    if (suggestion) suggestions.push(suggestion);
  }
  
  // Form-based suggestions
  if (context.forms?.length > 0) {
    const emptyForms = context.forms.filter((f: any) => 
      Object.values(f.currentValues || {}).every(v => !v)
    );
    
    if (emptyForms.length > 0) {
      suggestions.push(`Fill out the ${emptyForms[0].purpose || 'form'} for me`);
    }
  }
  
  // Entity-specific suggestions
  if (context.serverData?.entityType === 'course') {
    if (!context.serverData.entityData?.whatYouWillLearn?.length) {
      suggestions.push('Generate learning objectives using Bloom\'s taxonomy');
    }
    
    const stats = context.serverData.relatedData?.stats;
    if (stats?.chapterCount === 0) {
      suggestions.push('Create a course outline with chapters');
    } else if (stats?.publishedChapters < stats?.chapterCount) {
      suggestions.push('Help me complete and publish my chapters');
    }
  }
  
  // Page type suggestions
  switch (context.pageType) {
    case 'create':
      suggestions.push('Guide me through creating this content step by step');
      break;
    case 'analytics':
      suggestions.push('Analyze my performance and suggest improvements');
      break;
    case 'list':
      suggestions.push('Help me organize and filter this data');
      break;
  }
  
  // Add general helpful suggestions
  suggestions.push('What should I do next?');
  suggestions.push('Analyze this page and suggest improvements');
  
  return [...new Set(suggestions)].slice(0, 5);
}

function generateEnhancedAction(message: string, context: any, aiResponse: string): any {
  const lowerMessage = message.toLowerCase();
  
  // Check for form population requests
  if (lowerMessage.includes('fill') || lowerMessage.includes('populate') || lowerMessage.includes('complete')) {
    // Find the most relevant form
    const targetForm = context.forms?.find((f: any) => 
      lowerMessage.includes(f.purpose?.toLowerCase()) ||
      lowerMessage.includes(f.id?.toLowerCase()) ||
      (f.purpose === 'learning-objectives' && lowerMessage.includes('objective')) ||
      (f.purpose === 'update-title' && lowerMessage.includes('title'))
    ) || context.forms?.[0];
    
    if (targetForm) {
      // Extract data from AI response
      const generatedData: Record<string, any> = {};
      
      // Smart data extraction based on form purpose
      if (targetForm.purpose === 'learning-objectives' && aiResponse.includes('<li>')) {
        // Extract learning objectives from HTML list
        const objectives = aiResponse.match(/<li>(.*?)<\/li>/g)?.map(li => 
          li.replace(/<\/?li>/g, '').trim()
        ) || [];
        
        if (objectives.length > 0) {
          generatedData.learningObjectives = objectives;
          generatedData.whatYouWillLearn = objectives.join('\n');
        }
      } else if (targetForm.purpose === 'update-title' && aiResponse.includes('"')) {
        // Extract title from quoted text
        const titleMatch = aiResponse.match(/"([^"]+)"/);
        if (titleMatch) {
          generatedData.title = titleMatch[1];
        }
      }
      
      // Map to actual form fields
      const formData: Record<string, any> = {};
      targetForm.fields.forEach((field: any) => {
        if (generatedData[field.name]) {
          formData[field.name] = generatedData[field.name];
        } else if (field.metadata?.fieldPurpose && generatedData[field.metadata.fieldPurpose]) {
          formData[field.name] = generatedData[field.metadata.fieldPurpose];
        }
      });
      
      if (Object.keys(formData).length > 0) {
        return {
          type: 'form_populate',
          details: {
            formId: targetForm.id,
            purpose: targetForm.purpose,
            data: formData,
            validate: true
          }
        };
      }
    }
  }
  
  // Check for navigation requests
  if (lowerMessage.includes('go to') || lowerMessage.includes('navigate') || lowerMessage.includes('open')) {
    const relatedPages = context.metadata?.relatedPages || [];
    const targetPage = relatedPages.find((page: any) => 
      lowerMessage.includes(page.label.toLowerCase())
    );
    
    if (targetPage) {
      return {
        type: 'navigation',
        details: {
          url: targetPage.url,
          description: targetPage.label
        }
      };
    }
  }
  
  // Check for workflow actions
  if (context.workflow?.nextAction && 
      (lowerMessage.includes('next') || lowerMessage.includes('continue'))) {
    return {
      type: 'workflow_action',
      details: {
        action: context.workflow.nextAction,
        step: context.workflow.currentStep
      }
    };
  }
  
  // Check for component interactions
  if (lowerMessage.includes('click') || lowerMessage.includes('press')) {
    const enabledActions = context.availableActions?.filter((a: any) => a.enabled) || [];
    const targetAction = enabledActions.find((action: any) => 
      lowerMessage.includes(action.label.toLowerCase())
    );
    
    if (targetAction) {
      return {
        type: 'page_action',
        details: {
          action: 'click',
          params: {
            actionId: targetAction.id,
            label: targetAction.label
          }
        }
      };
    }
  }
  
  return null;
}