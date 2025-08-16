import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import anthropic from '@/lib/anthropic-client';
import { logger } from '@/lib/logger';
import { withAuth, withAdminAuth, withOwnership, withPublicAPI } from '@/lib/api/with-api-auth';

// Bloom's Taxonomy levels and verbs'
const BLOOMS_TAXONOMY = {
  remember: ["identify", "recognize", "recall", "list", "describe", "name", "find", "match", "define", "label"],
  understand: ["explain", "summarize", "classify", "discuss", "interpret", "paraphrase", "compare", "distinguish", "predict", "translate"],
  apply: ["implement", "use", "execute", "solve", "demonstrate", "operate", "carry out", "practice", "illustrate", "calculate"],
  analyze: ["differentiate", "organize", "attribute", "compare", "deconstruct", "examine", "test", "criticize", "question", "investigate"],
  evaluate: ["judge", "critique", "justify", "defend", "appraise", "argue", "assess", "prioritize", "rate", "select"],
  create: ["design", "consexport const POST = withAuth(async (request, context) => {"
  // Build system prompt based on context
    const systemPrompt = `You are SAM, an intelligent AI course assistant specializing in educational content creation. Your primary goal is to help create high-quality, relevant course content.

COURSE CONTEXT:

FORM INTERACTION CAPABILITIES:

BLOOM'S TAXONOMY EXPERTISE:'
- Remember, Understand, Apply, Analyze, Evaluate, Create

CONTENT GENERATION RULES:
2. Use the learning objectives as your guide for content creation
3. Follow educational best practices and logical progression
4. When creating chapters, ensure they build upon each other systematically
5. Generate exactly the number of items requested, no more, no less
6. Focus on quality and relevance over quantity

RESPONSE FORMAT:
- Be specific and actionable
- Provide detailed, relevant content
- When generating chapters, include meaningful descriptions
- Ensure all content supports the overall course goals

Always prioritize educational value and relevance to the specific course topic.`;

    // Process based on intent
    let userPrompt = message;
    let expectedAction = null;

      case 'generate_objectives':
        expectedAction = 'update_objectives';
        1. Are specific and measurable
        2. Cover all Bloom's taxonomy levels'
        4. Build on each other progressively
        5. Use action verbs from Bloom's taxonomy`;'
        break;

      case 'generate_chapters':
        expectedAction = 'update_chapters';
        // Extract the number of chapters from the message
        const numberMatch = message.match(/(\d+)\s*chapters?/i);
        const requestedNumber = numberMatch ? parseInt(numberMatch[1]) : 5;
        

COURSE CONTEXT:

STRICT REQUIREMENTS:
2. Each chapter MUST follow format: "Chapter X: [Specific Title]"
4. Each chapter MUST support the learning objectives above
5. Chapters MUST follow logical progression from basic to advanced
6. Include 2-3 sentence descriptions for each chapter
7. Number chapters sequentially (1, 2, 3, etc.)

EXAMPLE FORMAT:
Chapter 1: Introduction to [Course Topic]
This chapter introduces the fundamental concepts of [course topic]. Students will learn the basic terminology and core principles.

Chapter 2: [Next Logical Topic]
Building on the foundation, this chapter covers [specific content]. Students will explore [relevant details].

IMPORTANT: 
- Use the learning objectives as your guide
- Make each chapter title specific and descriptive
- Ensure progression builds knowledge systematically

Generate the chapters now:`;
        break;

      case 'delete_chapters':
        expectedAction = 'delete_chapters';
        break;

      case 'blooms_analysis':
        break;

      case 'improve_content':
        break;

    // Generate response using Anthropic
    const messages = [
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
    ];

      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages

    const aiContent = response.content[0];
      throw new Error('Unexpected response type from Anthropic API');
    
    const aiResponse = aiContent.text || "I couldn't generate a response.";'

    // Generate action based on intent
    let action = null;
    let suggestions = [];

      // Extract objectives from response
      const objectives = extractLearningObjectives(aiResponse);
          type: 'update_objectives',
      suggestions = [
        "Review the generated objectives",
        "Generate more objectives",
        "Apply different Bloom's levels",'
        "Create matching chapters"
      ];
      // Extract the number of chapters from the original message
      const numberMatch = message.match(/(\d+)\s*chapters?/i);
      const requestedNumber = numberMatch ? parseInt(numberMatch[1]) : 5;
      
      // Extract chapters from response
      const chapters = extractChapters(aiResponse, requestedNumber);

          type: 'update_chapters',

      suggestions = [
        "Review the chapter structure",
        "Add more chapters",
        "Create sections for each chapter",
        "Generate learning objectives"
      ];
      // Extract chapter IDs to delete from response
      const chaptersToDelete = extractChaptersToDelete(aiResponse, context.chapters);
          type: 'delete_chapters',
      suggestions = [
        "Generate new chapters",
        "Review remaining chapters",
        "Update course structure",
        "Add learning objectives"
      ];
      // General suggestions based on context
        suggestions.push("Generate learning objectives");
        suggestions.push("Create course chapters");
        suggestions.push("Improve course completeness");
      suggestions.push("Analyze course structure");

      response: aiResponse,
      suggestions,
      action,
        intent,
        processingTime: Date.now(),
        confidence: 0.95
}, {
  rateLimit: { requests: 25, window: 60000 },
  auditLog: false
}); catch (error: any) {
    logger.error('Intelligent SAM API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Helper function to extract learning objectives from AI response
function extractLearningObjectives(response: string): string[] {
  const objectives: string[] = [];
  
  // Try to extract numbered list
  const lines = response.split('\n');
  const objectivePattern = /^\d+\.\s*(.+)/;
  const bulletPattern = /^[\•\-\*]\s*(.+)/;
  
  for (const line of lines) {
    const numberedMatch = line.match(objectivePattern);
    const bulletMatch = line.match(bulletPattern);
    
    if (numberedMatch) {
      objectives.push(numberedMatch[1].trim());
    } else if (bulletMatch) {
      objectives.push(bulletMatch[1].trim());
    }
  }
  
  // Ensure objectives start with action verbs
  return objectives.filter(obj => {
    const firstWord = obj.split(' ')[0].toLowerCase();
    return Object.values(BLOOMS_TAXONOMY).some(verbs => 
      verbs.includes(firstWord)
    );
  }).slice(0, 15); // Limit to 15 objectives
}

// Helper function to extract chapters from AI response
function extractChapters(response: string, requestedNumber?: number): any[] {
  const chapters: any[] = [];
  
  // Extract chapters with titles and descriptions
  const lines = response.split('\n');
  let currentChapter: any = null;
  let position = 1;
  
  for (const line of lines) {
    // Match chapter titles (e.g., "Chapter 1: Title" or "1. Title")
    const chapterMatch = line.match(/^(?:Chapter\s+)?(\d+)[\.:]\s*(.+)/i);
    
    if (chapterMatch) {
      // Save previous chapter if exists
      if (currentChapter) {
        chapters.push(currentChapter);
      }
      
      const chapterNumber = parseInt(chapterMatch[1]);
      const chapterTitle = chapterMatch[2].trim();
      
      // Stop if we already have the requested number
      if (requestedNumber && chapters.length >= requestedNumber) {
        break;
      }
      
      // Ensure proper formatting: "Chapter X: Title"
      const formattedTitle = chapterTitle.startsWith('Chapter ') ? 
        chapterTitle : 
        `Chapter ${chapterNumber}: ${chapterTitle}`;
      
      currentChapter = {
        title: formattedTitle,
        description: '',
        position: position,
        isPublished: false,
        isFree: position === 1, // First chapter is free
        sections: []
      };
      position++;
    } else if (currentChapter && line.trim() && !line.match(/^[\•\-\*]/)) {
      // Add to description if we have a current chapter
      if (currentChapter.description.length < 200) {
        currentChapter.description += (currentChapter.description ? ' ' : '') + line.trim();
      }
    }
  }
  
  // Add the last chapter if it exists and we haven't reached the limit'
  if (currentChapter && (!requestedNumber || chapters.length < requestedNumber)) {
    chapters.push(currentChapter);
  }
  
  // Ensure we return exactly the requested number
  const finalChapters = chapters.slice(0, requestedNumber || 10);
  
  console.log(`Extracted ${finalChapters.length} chapters (requested: ${requestedNumber || 'default'})`);
  console.log('Chapter titles:', finalChapters.map(ch => ch.title));
  
  return finalChapters;
}

// Helper function to extract chapters to delete from AI response
function extractChaptersToDelete(response: string, existingChapters: any[]): string[] {
  const chapterIds: string[] = [];
  const lines = response.split('\n');
  
  for (const line of lines) {
    // Look for chapter references by title or number
    const chapterMatch = line.match(/(?:Chapter\s+)?(\d+)[\.:]\s*(.+)/i);
    if (chapterMatch) {
      const chapterNum = parseInt(chapterMatch[1]);
      const chapterTitle = chapterMatch[2].trim();
      
      // Find matching existing chapter
      const existingChapter = existingChapters.find(ch => 
        ch.title.toLowerCase().includes(chapterTitle.toLowerCase()) ||
        ch.position === chapterNum
      );
      
      if (existingChapter) {
        chapterIds.push(existingChapter.id);
      }
    }
    
    // Look for "all chapters" or similar phrases
    if (line.toLowerCase().includes('all chapters') || 
        line.toLowerCase().includes('every chapter') ||
        line.toLowerCase().includes('delete all')) {
      return existingChapters.map(ch => ch.id);
    }
  }
  
  // If no specific chapters found, try to match by keywords
  if (chapterIds.length === 0) {
    const keywords = ['delete', 'remove', 'clear'];
    for (const keyword of keywords) {
      if (response.toLowerCase().includes(keyword)) {
        // If user says "delete chapters" without specifics, suggest confirmation
        break;
      }
    }
  }
  
  return chapterIds;
}