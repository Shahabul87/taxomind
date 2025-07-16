import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import anthropic from '@/lib/anthropic-client';

// Bloom's Taxonomy levels and verbs
const BLOOMS_TAXONOMY = {
  remember: ["identify", "recognize", "recall", "list", "describe", "name", "find", "match", "define", "label"],
  understand: ["explain", "summarize", "classify", "discuss", "interpret", "paraphrase", "compare", "distinguish", "predict", "translate"],
  apply: ["implement", "use", "execute", "solve", "demonstrate", "operate", "carry out", "practice", "illustrate", "calculate"],
  analyze: ["differentiate", "organize", "attribute", "compare", "deconstruct", "examine", "test", "criticize", "question", "investigate"],
  evaluate: ["judge", "critique", "justify", "defend", "appraise", "argue", "assess", "prioritize", "rate", "select"],
  create: ["design", "construct", "develop", "formulate", "build", "produce", "plan", "compose", "generate", "devise"]
};

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, intent, context, conversationHistory } = await req.json();

    // Build system prompt based on context
    const systemPrompt = `You are SAM, an intelligent AI course assistant specializing in educational content creation. Your primary goal is to help create high-quality, relevant course content.

COURSE CONTEXT:
- Course Title: "${context.title}"
- Course Description: "${context.description || 'Not provided'}"
- Category: ${context.category}
- Current Health Score: ${context.healthScore}%
- Existing Chapters: ${context.chapterCount} (${context.chapters.map((ch: any) => ch.title).join(', ') || 'None yet'})
- Learning Objectives: ${context.objectiveCount} objectives
- Learning Objectives Content: ${context.learningObjectives.length > 0 ? context.learningObjectives.join(', ') : 'No objectives set yet'}

FORM INTERACTION CAPABILITIES:
- Can update learning objectives: ${context.canUpdateObjectives}
- Can update chapters: ${context.canUpdateChapters}
- Can delete chapters: ${context.canDeleteChapters}
- Can update title: ${context.canUpdateTitle}
- Can update description: ${context.canUpdateDescription}

BLOOM'S TAXONOMY EXPERTISE:
- Remember, Understand, Apply, Analyze, Evaluate, Create
- Current distribution: ${JSON.stringify(context.bloomsDistribution)}

CONTENT GENERATION RULES:
1. Always generate content that is directly relevant to "${context.title}"
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

    switch (intent) {
      case 'generate_objectives':
        expectedAction = 'update_objectives';
        userPrompt = `${message}\n\nGenerate learning objectives that:
        1. Are specific and measurable
        2. Cover all Bloom's taxonomy levels
        3. Are relevant to "${context.title}"
        4. Build on each other progressively
        5. Use action verbs from Bloom's taxonomy`;
        break;

      case 'generate_chapters':
        expectedAction = 'update_chapters';
        // Extract the number of chapters from the message
        const numberMatch = message.match(/(\d+)\s*chapters?/i);
        const requestedNumber = numberMatch ? parseInt(numberMatch[1]) : 5;
        
        userPrompt = `TASK: Generate EXACTLY ${requestedNumber} course chapters for the following course.

COURSE CONTEXT:
- Course Title: "${context.title}"
- Course Description: "${context.description || 'No description provided'}"
- Learning Objectives: ${context.learningObjectives.length > 0 ? context.learningObjectives.join(', ') : 'No objectives set yet'}
- Current Chapters: ${context.chapterCount} (${context.chapters.map((ch: any) => ch.title).join(', ') || 'None yet'})

STRICT REQUIREMENTS:
1. Generate EXACTLY ${requestedNumber} chapters, no more, no less
2. Each chapter MUST follow format: "Chapter X: [Specific Title]"
3. Each chapter MUST be directly relevant to "${context.title}"
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
- Focus on "${context.title}" specifically
- Use the learning objectives as your guide
- Generate only ${requestedNumber} chapters
- Make each chapter title specific and descriptive
- Ensure progression builds knowledge systematically

Generate the chapters now:`;
        break;

      case 'delete_chapters':
        expectedAction = 'delete_chapters';
        userPrompt = `${message}\n\nIdentify which chapters to delete based on the user's request. Current chapters: ${context.chapters.map((ch: any) => `${ch.title} (ID: ${ch.id})`).join(', ')}`;
        break;

      case 'blooms_analysis':
        userPrompt = `${message}\n\nAnalyze the current Bloom's taxonomy distribution and provide specific recommendations.`;
        break;

      case 'improve_content':
        userPrompt = `${message}\n\nProvide specific, actionable improvements based on the current course state.`;
        break;
    }

    // Generate response using Anthropic
    const messages = [
      ...conversationHistory.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      { role: "user" as const, content: userPrompt }
    ];

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

    // Generate action based on intent
    let action = null;
    let suggestions = [];

    if (expectedAction === 'update_objectives' && context.canUpdateObjectives) {
      // Extract objectives from response
      const objectives = extractLearningObjectives(aiResponse);
      if (objectives.length > 0) {
        action = {
          type: 'update_objectives',
          data: { objectives }
        };
      }
      suggestions = [
        "Review the generated objectives",
        "Generate more objectives",
        "Apply different Bloom's levels",
        "Create matching chapters"
      ];
    } else if (expectedAction === 'update_chapters') {
      // Extract the number of chapters from the original message
      const numberMatch = message.match(/(\d+)\s*chapters?/i);
      const requestedNumber = numberMatch ? parseInt(numberMatch[1]) : 5;
      
      // Extract chapters from response
      const chapters = extractChapters(aiResponse, requestedNumber);
      console.log('API: Extracted chapters:', chapters);
      console.log('API: Requested number:', requestedNumber);
      console.log('API: Can update chapters:', context.canUpdateChapters);
      
      if (chapters.length > 0 && context.canUpdateChapters) {
        action = {
          type: 'update_chapters',
          data: { chapters }
        };
        console.log('API: Created update_chapters action');
      } else {
        console.log('API: No chapters extracted or cannot update chapters');
      }
      suggestions = [
        "Review the chapter structure",
        "Add more chapters",
        "Create sections for each chapter",
        "Generate learning objectives"
      ];
    } else if (expectedAction === 'delete_chapters') {
      // Extract chapter IDs to delete from response
      const chaptersToDelete = extractChaptersToDelete(aiResponse, context.chapters);
      if (chaptersToDelete.length > 0 && context.canDeleteChapters) {
        action = {
          type: 'delete_chapters',
          data: { chapterIds: chaptersToDelete }
        };
      }
      suggestions = [
        "Generate new chapters",
        "Review remaining chapters",
        "Update course structure",
        "Add learning objectives"
      ];
    } else {
      // General suggestions based on context
      if (context.objectiveCount === 0) {
        suggestions.push("Generate learning objectives");
      }
      if (context.chapterCount === 0) {
        suggestions.push("Create course chapters");
      }
      if (context.healthScore < 80) {
        suggestions.push("Improve course completeness");
      }
      suggestions.push("Analyze course structure");
    }

    return NextResponse.json({
      response: aiResponse,
      suggestions,
      action,
      metadata: {
        intent,
        processingTime: Date.now(),
        confidence: 0.95
      }
    });

  } catch (error) {
    console.error('Intelligent SAM API Error:', error);
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
  
  // Add the last chapter if it exists and we haven't reached the limit
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