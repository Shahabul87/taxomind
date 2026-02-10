import { NextRequest, NextResponse } from 'next/server';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

async function runAIAnalysis(
  userId: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  return await runSAMChatWithPreference({
    userId,
    capability: 'analysis',
    maxTokens,
    temperature: 0.7,
    systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      contentType, 
      contentData, 
      analysisType,
      learningContext,
      userRole 
    } = await request.json();

    let analysis;
    
    switch (contentType) {
      case 'video':
        analysis = await analyzeVideoContent(user.id, contentData, analysisType, learningContext);
        break;
      case 'text':
        analysis = await analyzeTextContent(user.id, contentData, analysisType, learningContext);
        break;
      case 'code':
        analysis = await analyzeCodeContent(user.id, contentData, analysisType, learningContext);
        break;
      case 'image':
        analysis = await analyzeImageContent(user.id, contentData, analysisType, learningContext);
        break;
      case 'pdf':
        analysis = await analyzePDFContent(user.id, contentData, analysisType, learningContext);
        break;
      case 'quiz':
        analysis = await analyzeQuizContent(user.id, contentData, analysisType, learningContext);
        break;
      case 'webpage':
        analysis = await analyzeWebpageContent(user.id, contentData, analysisType, learningContext);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }

    return NextResponse.json({
      analysis,
      contentType,
      analysisType,
      timestamp: new Date().toISOString(),
      suggestions: generateContentSuggestions(analysis, contentType, userRole)
    });

  } catch (error) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error('Content analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}

async function analyzeVideoContent(
  userId: string,
  contentData: any,
  analysisType: string,
  learningContext: any
): Promise<any> {
  const { url, title, description, duration, transcript } = contentData;
  
  const systemPrompt = `You are SAM, an AI tutor analyzing video content for educational purposes. 
  
  **Analysis Type**: ${analysisType}
  **Learning Context**: ${JSON.stringify(learningContext)}
  
  Provide comprehensive analysis including:
  - Key concepts and topics covered
  - Learning objectives alignment
  - Difficulty level assessment
  - Engagement factors
  - Interactive elements suggestions
  - Study questions generation
  - Timestamp-based chapter suggestions
  - Accessibility considerations`;

  const analysisText = await runAIAnalysis(
    userId,
    systemPrompt,
    `Analyze this video content:
Title: ${title}
Description: ${description}
Duration: ${duration}
Transcript: ${transcript || 'No transcript available'}
URL: ${url}`,
    2000
  );

  return {
    type: 'video',
    keyTopics: extractKeyTopics(analysisText),
    difficultyLevel: extractDifficultyLevel(analysisText),
    learningObjectives: extractLearningObjectives(analysisText),
    studyQuestions: extractStudyQuestions(analysisText),
    interactiveElements: extractInteractiveElements(analysisText),
    chapters: extractChapterSuggestions(analysisText),
    engagementFactors: extractEngagementFactors(analysisText),
    accessibilityNotes: extractAccessibilityNotes(analysisText),
    fullAnalysis: analysisText
  };
}

async function analyzeTextContent(
  userId: string,
  contentData: any,
  analysisType: string,
  learningContext: any
): Promise<any> {
  const { content, title, type, wordCount } = contentData;
  
  const systemPrompt = `You are SAM, an AI tutor analyzing text content for educational purposes.
  
  **Analysis Type**: ${analysisType}
  **Learning Context**: ${JSON.stringify(learningContext)}
  
  Analyze the text for:
  - Reading level and complexity
  - Key concepts and vocabulary
  - Learning objectives
  - Comprehension questions
  - Summary suggestions
  - Related topics
  - Interactive activities
  - Assessment opportunities`;

  const analysisText = await runAIAnalysis(
    userId,
    systemPrompt,
    `Analyze this text content:
Title: ${title}
Type: ${type}
Word Count: ${wordCount}
Content: ${content.substring(0, 2000)}...`,
    1500
  );

  return {
    type: 'text',
    readingLevel: extractReadingLevel(analysisText),
    keyVocabulary: extractKeyVocabulary(analysisText),
    mainConcepts: extractMainConcepts(analysisText),
    comprehensionQuestions: extractComprehensionQuestions(analysisText),
    summaryPoints: extractSummaryPoints(analysisText),
    relatedTopics: extractRelatedTopics(analysisText),
    interactiveActivities: extractInteractiveActivities(analysisText),
    assessmentOpportunities: extractAssessmentOpportunities(analysisText),
    fullAnalysis: analysisText
  };
}

async function analyzeCodeContent(
  userId: string,
  contentData: any,
  analysisType: string,
  learningContext: any
): Promise<any> {
  const { code, language, title, description } = contentData;
  
  const systemPrompt = `You are SAM, an AI tutor analyzing code content for educational purposes.
  
  **Analysis Type**: ${analysisType}
  **Learning Context**: ${JSON.stringify(learningContext)}
  **Programming Language**: ${language}
  
  Analyze the code for:
  - Code complexity and structure
  - Key programming concepts
  - Learning objectives
  - Code quality and best practices
  - Potential improvements
  - Interactive exercises
  - Debug challenges
  - Step-by-step explanations`;

  const analysisText = await runAIAnalysis(
    userId,
    systemPrompt,
    `Analyze this code:
Title: ${title}
Language: ${language}
Description: ${description}
Code:
\`\`\`${language}
${code}
\`\`\``,
    1500
  );

  return {
    type: 'code',
    complexity: extractCodeComplexity(analysisText),
    concepts: extractProgrammingConcepts(analysisText),
    bestPractices: extractBestPractices(analysisText),
    improvements: extractCodeImprovements(analysisText),
    exercises: extractCodeExercises(analysisText),
    debugChallenges: extractDebugChallenges(analysisText),
    stepByStep: extractStepByStepExplanation(analysisText),
    fullAnalysis: analysisText
  };
}

async function analyzeImageContent(
  userId: string,
  contentData: any,
  analysisType: string,
  learningContext: any
): Promise<any> {
  const { url, title, description, altText } = contentData;
  
  // For image analysis, we'll use the description and alt text
  // In a real implementation, you'd use vision AI models
  const systemPrompt = `You are SAM, an AI tutor analyzing image content for educational purposes.
  
  **Analysis Type**: ${analysisType}
  **Learning Context**: ${JSON.stringify(learningContext)}
  
  Based on the image description and context, provide:
  - Educational value assessment
  - Key visual concepts
  - Learning objectives
  - Discussion questions
  - Interactive activities
  - Accessibility considerations
  - Related visual aids suggestions`;

  const analysisText = await runAIAnalysis(
    userId,
    systemPrompt,
    `Analyze this image content:
Title: ${title}
Description: ${description}
Alt Text: ${altText}
URL: ${url}`,
    1000
  );

  return {
    type: 'image',
    educationalValue: extractEducationalValue(analysisText),
    visualConcepts: extractVisualConcepts(analysisText),
    discussionQuestions: extractDiscussionQuestions(analysisText),
    interactiveActivities: extractInteractiveActivities(analysisText),
    accessibilityNotes: extractAccessibilityNotes(analysisText),
    relatedVisualAids: extractRelatedVisualAids(analysisText),
    fullAnalysis: analysisText
  };
}

async function analyzePDFContent(
  userId: string,
  contentData: any,
  analysisType: string,
  learningContext: any
): Promise<any> {
  const { title, description, pageCount, extractedText } = contentData;
  
  const systemPrompt = `You are SAM, an AI tutor analyzing PDF document content for educational purposes.
  
  **Analysis Type**: ${analysisType}
  **Learning Context**: ${JSON.stringify(learningContext)}
  
  Analyze the PDF for:
  - Document structure and organization
  - Key concepts and topics
  - Learning objectives
  - Study guide creation
  - Chapter summaries
  - Interactive elements
  - Assessment opportunities
  - Note-taking suggestions`;

  const analysisText = await runAIAnalysis(
    userId,
    systemPrompt,
    `Analyze this PDF content:
Title: ${title}
Description: ${description}
Page Count: ${pageCount}
Extracted Text: ${extractedText?.substring(0, 2000) || 'No text extracted'}...`,
    1500
  );

  return {
    type: 'pdf',
    structure: extractDocumentStructure(analysisText),
    keyTopics: extractKeyTopics(analysisText),
    studyGuide: extractStudyGuide(analysisText),
    chapterSummaries: extractChapterSummaries(analysisText),
    noteTakingSuggestions: extractNoteTakingSuggestions(analysisText),
    fullAnalysis: analysisText
  };
}

async function analyzeQuizContent(
  userId: string,
  contentData: any,
  analysisType: string,
  learningContext: any
): Promise<any> {
  const { questions, title, description, totalPoints } = contentData;
  
  const systemPrompt = `You are SAM, an AI tutor analyzing quiz content for educational purposes.
  
  **Analysis Type**: ${analysisType}
  **Learning Context**: ${JSON.stringify(learningContext)}
  
  Analyze the quiz for:
  - Bloom's taxonomy distribution
  - Difficulty balance
  - Concept coverage
  - Question quality
  - Improvement suggestions
  - Study recommendations
  - Adaptive hints
  - Learning objectives alignment`;

  const analysisText = await runAIAnalysis(
    userId,
    systemPrompt,
    `Analyze this quiz content:
Title: ${title}
Description: ${description}
Total Points: ${totalPoints}
Questions: ${JSON.stringify(questions).substring(0, 1500)}...`,
    1500
  );

  return {
    type: 'quiz',
    bloomsTaxonomy: extractBloomsTaxonomy(analysisText),
    difficultyBalance: extractDifficultyBalance(analysisText),
    conceptCoverage: extractConceptCoverage(analysisText),
    questionQuality: extractQuestionQuality(analysisText),
    studyRecommendations: extractStudyRecommendations(analysisText),
    adaptiveHints: extractAdaptiveHints(analysisText),
    fullAnalysis: analysisText
  };
}

async function analyzeWebpageContent(
  userId: string,
  contentData: any,
  analysisType: string,
  learningContext: any
): Promise<any> {
  const { url, title, description, content, links } = contentData;
  
  const systemPrompt = `You are SAM, an AI tutor analyzing webpage content for educational purposes.
  
  **Analysis Type**: ${analysisType}
  **Learning Context**: ${JSON.stringify(learningContext)}
  
  Analyze the webpage for:
  - Educational value
  - Key concepts
  - Credibility assessment
  - Learning objectives
  - Interactive elements
  - Related resources
  - Study activities
  - Critical thinking questions`;

  const analysisText = await runAIAnalysis(
    userId,
    systemPrompt,
    `Analyze this webpage content:
URL: ${url}
Title: ${title}
Description: ${description}
Content: ${content?.substring(0, 2000) || 'No content available'}...
Links: ${JSON.stringify(links).substring(0, 500)}...`,
    1500
  );

  return {
    type: 'webpage',
    educationalValue: extractEducationalValue(analysisText),
    credibilityScore: extractCredibilityScore(analysisText),
    keyTopics: extractKeyTopics(analysisText),
    studyActivities: extractStudyActivities(analysisText),
    criticalThinkingQuestions: extractCriticalThinkingQuestions(analysisText),
    relatedResources: extractRelatedResources(analysisText),
    fullAnalysis: analysisText
  };
}

function generateContentSuggestions(
  analysis: any,
  contentType: string,
  userRole: string
): string[] {
  const suggestions = [];
  
  if (userRole === 'student') {
    suggestions.push(
      "Ask questions about confusing concepts",
      "Request practice exercises",
      "Get study tips for this content",
      "Create flashcards from key terms"
    );
  } else if (userRole === 'teacher') {
    suggestions.push(
      "Generate assessment questions",
      "Create interactive activities",
      "Develop discussion prompts",
      "Design homework assignments"
    );
  }
  
  // Content-specific suggestions
  switch (contentType) {
    case 'video':
      suggestions.push("Create video chapters", "Generate transcript quiz");
      break;
    case 'code':
      suggestions.push("Create coding challenges", "Generate debug exercises");
      break;
    case 'text':
      suggestions.push("Create summary notes", "Generate reading guide");
      break;
  }
  
  return suggestions.slice(0, 4);
}

// Helper functions to extract specific information from AI analysis
function extractKeyTopics(text: string): string[] {
  // Simple extraction - in production, use more sophisticated NLP
  const topicRegex = /(?:key topics?|main concepts?|topics covered):\s*([^.]+)/i;
  const match = text.match(topicRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractDifficultyLevel(text: string): string {
  const difficultyRegex = /(?:difficulty|level):\s*(beginner|intermediate|advanced)/i;
  const match = text.match(difficultyRegex);
  return match ? match[1].toLowerCase() : 'intermediate';
}

function extractLearningObjectives(text: string): string[] {
  const objectiveRegex = /(?:learning objectives?|objectives?):\s*([^.]+)/i;
  const match = text.match(objectiveRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractStudyQuestions(text: string): string[] {
  const questionRegex = /(?:study questions?|questions?):\s*([^.]+)/i;
  const match = text.match(questionRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractInteractiveElements(text: string): string[] {
  const interactiveRegex = /(?:interactive elements?|activities?):\s*([^.]+)/i;
  const match = text.match(interactiveRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractChapterSuggestions(text: string): string[] {
  const chapterRegex = /(?:chapters?|sections?):\s*([^.]+)/i;
  const match = text.match(chapterRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractEngagementFactors(text: string): string[] {
  const engagementRegex = /(?:engagement factors?|engaging elements?):\s*([^.]+)/i;
  const match = text.match(engagementRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractAccessibilityNotes(text: string): string[] {
  const accessibilityRegex = /(?:accessibility|accessible):\s*([^.]+)/i;
  const match = text.match(accessibilityRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

// Additional helper functions for other content types
function extractReadingLevel(text: string): string {
  const levelRegex = /(?:reading level|grade level):\s*([^.]+)/i;
  const match = text.match(levelRegex);
  return match ? match[1].trim() : 'intermediate';
}

function extractKeyVocabulary(text: string): string[] {
  const vocabRegex = /(?:key vocabulary|vocabulary):\s*([^.]+)/i;
  const match = text.match(vocabRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractMainConcepts(text: string): string[] {
  const conceptRegex = /(?:main concepts?|key concepts?):\s*([^.]+)/i;
  const match = text.match(conceptRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractComprehensionQuestions(text: string): string[] {
  const questionRegex = /(?:comprehension questions?|questions?):\s*([^.]+)/i;
  const match = text.match(questionRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractSummaryPoints(text: string): string[] {
  const summaryRegex = /(?:summary points?|key points?):\s*([^.]+)/i;
  const match = text.match(summaryRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractRelatedTopics(text: string): string[] {
  const relatedRegex = /(?:related topics?|related concepts?):\s*([^.]+)/i;
  const match = text.match(relatedRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractInteractiveActivities(text: string): string[] {
  const activityRegex = /(?:interactive activities?|activities?):\s*([^.]+)/i;
  const match = text.match(activityRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractAssessmentOpportunities(text: string): string[] {
  const assessmentRegex = /(?:assessment opportunities?|assessments?):\s*([^.]+)/i;
  const match = text.match(assessmentRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractCodeComplexity(text: string): string {
  const complexityRegex = /(?:complexity|difficulty):\s*(low|medium|high|simple|complex)/i;
  const match = text.match(complexityRegex);
  return match ? match[1].toLowerCase() : 'medium';
}

function extractProgrammingConcepts(text: string): string[] {
  const conceptRegex = /(?:programming concepts?|concepts?):\s*([^.]+)/i;
  const match = text.match(conceptRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractBestPractices(text: string): string[] {
  const practiceRegex = /(?:best practices?|practices?):\s*([^.]+)/i;
  const match = text.match(practiceRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractCodeImprovements(text: string): string[] {
  const improvementRegex = /(?:improvements?|suggestions?):\s*([^.]+)/i;
  const match = text.match(improvementRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractCodeExercises(text: string): string[] {
  const exerciseRegex = /(?:exercises?|practice problems?):\s*([^.]+)/i;
  const match = text.match(exerciseRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractDebugChallenges(text: string): string[] {
  const debugRegex = /(?:debug challenges?|debugging?):\s*([^.]+)/i;
  const match = text.match(debugRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractStepByStepExplanation(text: string): string[] {
  const stepRegex = /(?:step by step|steps?):\s*([^.]+)/i;
  const match = text.match(stepRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractEducationalValue(text: string): string {
  const valueRegex = /(?:educational value|value):\s*([^.]+)/i;
  const match = text.match(valueRegex);
  return match ? match[1].trim() : 'moderate';
}

function extractVisualConcepts(text: string): string[] {
  const visualRegex = /(?:visual concepts?|concepts?):\s*([^.]+)/i;
  const match = text.match(visualRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractDiscussionQuestions(text: string): string[] {
  const discussionRegex = /(?:discussion questions?|questions?):\s*([^.]+)/i;
  const match = text.match(discussionRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractRelatedVisualAids(text: string): string[] {
  const visualAidRegex = /(?:visual aids?|related visuals?):\s*([^.]+)/i;
  const match = text.match(visualAidRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractDocumentStructure(text: string): string[] {
  const structureRegex = /(?:document structure|structure):\s*([^.]+)/i;
  const match = text.match(structureRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractStudyGuide(text: string): string[] {
  const guideRegex = /(?:study guide|guide):\s*([^.]+)/i;
  const match = text.match(guideRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractChapterSummaries(text: string): string[] {
  const summaryRegex = /(?:chapter summaries?|summaries?):\s*([^.]+)/i;
  const match = text.match(summaryRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractNoteTakingSuggestions(text: string): string[] {
  const noteRegex = /(?:note taking|notes?):\s*([^.]+)/i;
  const match = text.match(noteRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractBloomsTaxonomy(text: string): any {
  // Simple extraction - in production, use more sophisticated analysis
  return {
    knowledge: 0.2,
    comprehension: 0.3,
    application: 0.25,
    analysis: 0.15,
    synthesis: 0.05,
    evaluation: 0.05
  };
}

function extractDifficultyBalance(text: string): any {
  return {
    easy: 0.3,
    medium: 0.5,
    hard: 0.2
  };
}

function extractConceptCoverage(text: string): string[] {
  const coverageRegex = /(?:concept coverage|concepts covered):\s*([^.]+)/i;
  const match = text.match(coverageRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractQuestionQuality(text: string): string {
  const qualityRegex = /(?:question quality|quality):\s*([^.]+)/i;
  const match = text.match(qualityRegex);
  return match ? match[1].trim() : 'good';
}

function extractStudyRecommendations(text: string): string[] {
  const recRegex = /(?:study recommendations?|recommendations?):\s*([^.]+)/i;
  const match = text.match(recRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractAdaptiveHints(text: string): string[] {
  const hintRegex = /(?:adaptive hints?|hints?):\s*([^.]+)/i;
  const match = text.match(hintRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractCredibilityScore(text: string): number {
  const credRegex = /(?:credibility|reliability):\s*([0-9.]+)/i;
  const match = text.match(credRegex);
  return match ? parseFloat(match[1]) : 0.7;
}

function extractStudyActivities(text: string): string[] {
  const activityRegex = /(?:study activities?|activities?):\s*([^.]+)/i;
  const match = text.match(activityRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractCriticalThinkingQuestions(text: string): string[] {
  const thinkingRegex = /(?:critical thinking|thinking questions?):\s*([^.]+)/i;
  const match = text.match(thinkingRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractRelatedResources(text: string): string[] {
  const resourceRegex = /(?:related resources?|resources?):\s*([^.]+)/i;
  const match = text.match(resourceRegex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}
