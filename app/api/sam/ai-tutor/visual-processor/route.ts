import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

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
      processingType,
      visualData,
      learningContext,
      generationRequest 
    } = await request.json();

    let result;

    switch (processingType) {
      case 'image_analysis':
        result = await analyzeImageForLearning(visualData, learningContext);
        break;
      case 'diagram_generation':
        result = await generateLearningDiagram(generationRequest, learningContext);
        break;
      case 'concept_visualization':
        result = await generateConceptVisualization(generationRequest, learningContext);
        break;
      case 'interactive_annotation':
        result = await createInteractiveAnnotation(visualData, learningContext);
        break;
      case 'visual_quiz_creation':
        result = await createVisualQuiz(visualData, learningContext);
        break;
      case 'infographic_generation':
        result = await generateInfographic(generationRequest, learningContext);
        break;
      case 'mind_map_creation':
        result = await createMindMap(generationRequest, learningContext);
        break;
      case 'flowchart_generation':
        result = await generateFlowchart(generationRequest, learningContext);
        break;
      default:
        return NextResponse.json({ error: 'Unknown processing type' }, { status: 400 });
    }

    return NextResponse.json({
      result,
      processingType,
      timestamp: new Date().toISOString(),
      learningApplications: generateLearningApplications(result, processingType)
    });

  } catch (error) {
    logger.error('Visual processor error:', error);
    return NextResponse.json(
      { error: 'Failed to process visual content' },
      { status: 500 }
    );
  }
}

async function analyzeImageForLearning(
  visualData: any,
  learningContext: any
): Promise<any> {
  const { imageDescription, imageUrl, subject, learningObjectives } = visualData;
  
  const systemPrompt = `You are SAM, an AI tutor analyzing images for educational purposes. Extract maximum learning value from visual content.

**Image Context:**
- Description: ${imageDescription}
- Subject: ${subject}
- Learning objectives: ${learningObjectives}

**Learning Context:**
- Student level: ${learningContext.level}
- Learning style: ${learningContext.visualLearning}
- Current topic: ${learningContext.currentTopic}

Provide comprehensive analysis including:
1. Key visual elements and their educational significance
2. Learning opportunities within the image
3. Discussion questions based on visual content
4. Connections to curriculum concepts
5. Interactive activities using this image
6. Assessment opportunities
7. Accessibility considerations
8. Related visual resources`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    temperature: 0.7,
    messages: [
      { role: 'user', content: `System Instructions: ${systemPrompt}` },
      { role: 'user', content: `Analyze this educational image: ${imageDescription}` }
    ]
  });

  const aiResponse = response.content[0];
  const analysisText = aiResponse.type === 'text' ? aiResponse.text : '';

  return {
    type: 'image_analysis',
    visualElements: extractVisualElements(analysisText),
    learningOpportunities: extractLearningOpportunities(analysisText),
    discussionQuestions: extractDiscussionQuestions(analysisText),
    curriculumConnections: extractCurriculumConnections(analysisText),
    interactiveActivities: extractInteractiveActivities(analysisText),
    assessmentOpportunities: extractAssessmentOpportunities(analysisText),
    accessibilityConsiderations: extractAccessibilityConsiderations(analysisText),
    relatedResources: extractRelatedResources(analysisText),
    fullAnalysis: analysisText
  };
}

async function generateLearningDiagram(
  generationRequest: any,
  learningContext: any
): Promise<any> {
  const { concept, diagramType, complexity, audience } = generationRequest;
  
  const systemPrompt = `You are SAM, an AI tutor creating educational diagrams. Design clear, informative visual representations that enhance learning.

**Diagram Request:**
- Concept: ${concept}
- Diagram type: ${diagramType}
- Complexity level: ${complexity}
- Target audience: ${audience}

**Learning Context:**
- Subject area: ${learningContext.subject}
- Learning objectives: ${learningContext.objectives}
- Visual learning preferences: ${learningContext.visualPreferences}

Create a detailed diagram specification including:
1. Visual structure and layout
2. Key elements and their relationships
3. Color coding and visual hierarchy
4. Labels and annotations
5. Interactive elements suggestions
6. Learning progression indicators
7. Accessibility features
8. Implementation guidelines`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    temperature: 0.7,
    messages: [
      { role: 'user', content: `System Instructions: ${systemPrompt}` },
      { role: 'user', content: `Create a ${diagramType} diagram for "${concept}" at ${complexity} complexity level for ${audience}` }
    ]
  });

  const aiResponse = response.content[0];
  const specificationText = aiResponse.type === 'text' ? aiResponse.text : '';

  return {
    type: 'diagram_specification',
    diagramType,
    concept,
    visualStructure: extractVisualStructure(specificationText),
    keyElements: extractKeyElements(specificationText),
    colorCoding: extractColorCoding(specificationText),
    labels: extractLabels(specificationText),
    interactiveElements: extractInteractiveElements(specificationText),
    progressionIndicators: extractProgressionIndicators(specificationText),
    accessibilityFeatures: extractAccessibilityFeatures(specificationText),
    implementationGuidelines: extractImplementationGuidelines(specificationText),
    // SVG or Canvas instructions for rendering
    renderingInstructions: generateRenderingInstructions(specificationText, diagramType),
    fullSpecification: specificationText
  };
}

async function generateConceptVisualization(
  generationRequest: any,
  learningContext: any
): Promise<any> {
  const { concepts, visualizationType, relationships, learningGoals } = generationRequest;
  
  const systemPrompt = `You are SAM, an AI tutor creating concept visualizations. Transform abstract concepts into clear, engaging visual representations.

**Visualization Request:**
- Concepts: ${concepts.join(', ')}
- Visualization type: ${visualizationType}
- Relationships: ${relationships}
- Learning goals: ${learningGoals}

**Learning Context:**
- Subject: ${learningContext.subject}
- Student level: ${learningContext.level}
- Learning style: ${learningContext.learningStyle}

Create a comprehensive visualization plan including:
1. Visual metaphors and analogies
2. Spatial organization and layout
3. Relationship indicators
4. Progressive disclosure levels
5. Interactive exploration paths
6. Memory aids and mnemonics
7. Assessment integration
8. Customization options`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    temperature: 0.7,
    messages: [
      { role: 'user', content: `System Instructions: ${systemPrompt}` },
      { role: 'user', content: `Create a ${visualizationType} visualization for concepts: ${concepts.join(', ')}` }
    ]
  });

  const aiResponse = response.content[0];
  const visualizationText = aiResponse.type === 'text' ? aiResponse.text : '';

  return {
    type: 'concept_visualization',
    visualizationType,
    concepts,
    visualMetaphors: extractVisualMetaphors(visualizationText),
    spatialOrganization: extractSpatialOrganization(visualizationText),
    relationshipIndicators: extractRelationshipIndicators(visualizationText),
    progressiveDisclosure: extractProgressiveDisclosure(visualizationText),
    explorationPaths: extractExplorationPaths(visualizationText),
    memoryAids: extractMemoryAids(visualizationText),
    assessmentIntegration: extractAssessmentIntegration(visualizationText),
    customizationOptions: extractCustomizationOptions(visualizationText),
    renderingPlan: generateVisualizationRenderingPlan(visualizationText, visualizationType),
    fullPlan: visualizationText
  };
}

async function createInteractiveAnnotation(
  visualData: any,
  learningContext: any
): Promise<any> {
  const { imageDescription, learningObjectives, interactionTypes } = visualData;
  
  const systemPrompt = `You are SAM, an AI tutor creating interactive annotations for educational images. Design engaging, educational overlays that enhance learning.

**Image Context:**
- Description: ${imageDescription}
- Learning objectives: ${learningObjectives}
- Desired interactions: ${interactionTypes}

**Learning Context:**
- Subject: ${learningContext.subject}
- Student level: ${learningContext.level}
- Learning preferences: ${learningContext.preferences}

Create interactive annotation plan including:
1. Hotspot placement and content
2. Progressive reveal sequences
3. Quiz integration points
4. Contextual explanations
5. Related concept connections
6. Accessibility features
7. Assessment opportunities
8. Engagement mechanics`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1200,
    temperature: 0.7,
    messages: [
      { role: 'user', content: `System Instructions: ${systemPrompt}` },
      { role: 'user', content: `Create interactive annotations for: ${imageDescription}` }
    ]
  });

  const aiResponse = response.content[0];
  const annotationText = aiResponse.type === 'text' ? aiResponse.text : '';

  return {
    type: 'interactive_annotation',
    hotspots: extractHotspots(annotationText),
    progressiveReveal: extractProgressiveReveal(annotationText),
    quizIntegration: extractQuizIntegration(annotationText),
    contextualExplanations: extractContextualExplanations(annotationText),
    conceptConnections: extractConceptConnections(annotationText),
    accessibilityFeatures: extractAccessibilityFeatures(annotationText),
    assessmentOpportunities: extractAssessmentOpportunities(annotationText),
    engagementMechanics: extractEngagementMechanics(annotationText),
    implementationGuide: extractImplementationGuide(annotationText),
    fullPlan: annotationText
  };
}

async function createVisualQuiz(
  visualData: any,
  learningContext: any
): Promise<any> {
  const { imageDescription, subject, difficulty, questionTypes } = visualData;
  
  const systemPrompt = `You are SAM, an AI tutor creating visual-based quiz questions. Design engaging, educational assessments that test visual comprehension and concept understanding.

**Visual Content:**
- Description: ${imageDescription}
- Subject: ${subject}
- Difficulty: ${difficulty}
- Question types: ${questionTypes}

**Learning Context:**
- Learning objectives: ${learningContext.objectives}
- Student level: ${learningContext.level}
- Assessment goals: ${learningContext.assessmentGoals}

Create visual quiz including:
1. Multiple choice questions with visual elements
2. Annotation-based questions
3. Comparison and contrast questions
4. Sequence and process questions
5. Critical thinking questions
6. Application questions
7. Accessibility adaptations
8. Feedback and explanations`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    temperature: 0.7,
    messages: [
      { role: 'user', content: `System Instructions: ${systemPrompt}` },
      { role: 'user', content: `Create a visual quiz for: ${imageDescription}` }
    ]
  });

  const aiResponse = response.content[0];
  const quizText = aiResponse.type === 'text' ? aiResponse.text : '';

  return {
    type: 'visual_quiz',
    questions: extractQuizQuestions(quizText),
    visualElements: extractVisualQuizElements(quizText),
    difficultyProgression: extractDifficultyProgression(quizText),
    feedbackMessages: extractFeedbackMessages(quizText),
    accessibilityAdaptations: extractAccessibilityAdaptations(quizText),
    scoringRubric: extractScoringRubric(quizText),
    learningObjectiveMapping: extractLearningObjectiveMapping(quizText),
    fullQuiz: quizText
  };
}

async function generateInfographic(
  generationRequest: any,
  learningContext: any
): Promise<any> {
  const { topic, dataPoints, style, audience } = generationRequest;
  
  const systemPrompt = `You are SAM, an AI tutor creating educational infographics. Design visually appealing, informative graphics that make complex information accessible.

**Infographic Request:**
- Topic: ${topic}
- Data points: ${dataPoints}
- Style: ${style}
- Audience: ${audience}

**Learning Context:**
- Subject area: ${learningContext.subject}
- Learning objectives: ${learningContext.objectives}
- Visual preferences: ${learningContext.visualPreferences}

Create infographic specification including:
1. Information hierarchy and flow
2. Visual design elements
3. Color scheme and typography
4. Icon and illustration suggestions
5. Data visualization components
6. Interactive elements
7. Accessibility considerations
8. Learning enhancement features`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    temperature: 0.7,
    messages: [
      { role: 'user', content: `System Instructions: ${systemPrompt}` },
      { role: 'user', content: `Create an infographic about "${topic}" for ${audience}` }
    ]
  });

  const aiResponse = response.content[0];
  const infographicText = aiResponse.type === 'text' ? aiResponse.text : '';

  return {
    type: 'infographic_specification',
    topic,
    informationHierarchy: extractInformationHierarchy(infographicText),
    visualDesign: extractVisualDesign(infographicText),
    colorScheme: extractColorScheme(infographicText),
    iconSuggestions: extractIconSuggestions(infographicText),
    dataVisualization: extractDataVisualization(infographicText),
    interactiveElements: extractInteractiveElements(infographicText),
    accessibilityFeatures: extractAccessibilityFeatures(infographicText),
    learningEnhancements: extractLearningEnhancements(infographicText),
    layoutSpecification: generateLayoutSpecification(infographicText),
    fullSpecification: infographicText
  };
}

async function createMindMap(
  generationRequest: any,
  learningContext: any
): Promise<any> {
  const { centralConcept, relatedConcepts, depth, connections } = generationRequest;
  
  const systemPrompt = `You are SAM, an AI tutor creating educational mind maps. Design comprehensive visual knowledge maps that show relationships and enhance understanding.

**Mind Map Request:**
- Central concept: ${centralConcept}
- Related concepts: ${relatedConcepts}
- Depth level: ${depth}
- Connection types: ${connections}

**Learning Context:**
- Subject: ${learningContext.subject}
- Learning objectives: ${learningContext.objectives}
- Student level: ${learningContext.level}

Create mind map specification including:
1. Central node design and content
2. Branch structure and hierarchy
3. Node content and organization
4. Visual connectors and relationships
5. Color coding system
6. Progressive disclosure levels
7. Interactive exploration features
8. Assessment integration points`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    temperature: 0.7,
    messages: [
      { role: 'user', content: `System Instructions: ${systemPrompt}` },
      { role: 'user', content: `Create a mind map for "${centralConcept}" with ${depth} levels of depth` }
    ]
  });

  const aiResponse = response.content[0];
  const mindMapText = aiResponse.type === 'text' ? aiResponse.text : '';

  return {
    type: 'mind_map_specification',
    centralConcept,
    centralNode: extractCentralNode(mindMapText),
    branchStructure: extractBranchStructure(mindMapText),
    nodeContent: extractNodeContent(mindMapText),
    connections: extractConnections(mindMapText),
    colorCoding: extractColorCoding(mindMapText),
    progressiveDisclosure: extractProgressiveDisclosure(mindMapText),
    interactiveFeatures: extractInteractiveFeatures(mindMapText),
    assessmentIntegration: extractAssessmentIntegration(mindMapText),
    renderingInstructions: generateMindMapRenderingInstructions(mindMapText),
    fullSpecification: mindMapText
  };
}

async function generateFlowchart(
  generationRequest: any,
  learningContext: any
): Promise<any> {
  const { process, steps, decisionPoints, flowType } = generationRequest;
  
  const systemPrompt = `You are SAM, an AI tutor creating educational flowcharts. Design clear, logical visual processes that enhance understanding of sequences and decisions.

**Flowchart Request:**
- Process: ${process}
- Steps: ${steps}
- Decision points: ${decisionPoints}
- Flow type: ${flowType}

**Learning Context:**
- Subject: ${learningContext.subject}
- Learning objectives: ${learningContext.objectives}
- Complexity level: ${learningContext.complexity}

Create flowchart specification including:
1. Process flow structure
2. Step definitions and content
3. Decision point logic
4. Visual design elements
5. Interactive features
6. Error handling paths
7. Learning checkpoints
8. Assessment opportunities`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    temperature: 0.7,
    messages: [
      { role: 'user', content: `System Instructions: ${systemPrompt}` },
      { role: 'user', content: `Create a ${flowType} flowchart for the process: "${process}"` }
    ]
  });

  const aiResponse = response.content[0];
  const flowchartText = aiResponse.type === 'text' ? aiResponse.text : '';

  return {
    type: 'flowchart_specification',
    process,
    flowStructure: extractFlowStructure(flowchartText),
    stepDefinitions: extractStepDefinitions(flowchartText),
    decisionLogic: extractDecisionLogic(flowchartText),
    visualDesign: extractVisualDesign(flowchartText),
    interactiveFeatures: extractInteractiveFeatures(flowchartText),
    errorHandling: extractErrorHandling(flowchartText),
    learningCheckpoints: extractLearningCheckpoints(flowchartText),
    assessmentOpportunities: extractAssessmentOpportunities(flowchartText),
    renderingInstructions: generateFlowchartRenderingInstructions(flowchartText),
    fullSpecification: flowchartText
  };
}

function generateLearningApplications(
  result: any,
  processingType: string
): string[] {
  const applications = [];
  
  switch (processingType) {
    case 'image_analysis':
      applications.push(
        "Use for visual comprehension exercises",
        "Create discussion prompts",
        "Develop observation skills",
        "Generate assessment questions"
      );
      break;
    case 'diagram_generation':
      applications.push(
        "Explain complex concepts visually",
        "Create study guides",
        "Support different learning styles",
        "Enhance memory retention"
      );
      break;
    case 'concept_visualization':
      applications.push(
        "Show relationships between ideas",
        "Create interactive learning paths",
        "Support conceptual understanding",
        "Enable self-paced exploration"
      );
      break;
    case 'interactive_annotation':
      applications.push(
        "Create engaging content exploration",
        "Add contextual learning layers",
        "Enable deeper investigation",
        "Support inquiry-based learning"
      );
      break;
    case 'visual_quiz_creation':
      applications.push(
        "Assess visual comprehension",
        "Create engaging assessments",
        "Test analytical skills",
        "Provide immediate feedback"
      );
      break;
    case 'infographic_generation':
      applications.push(
        "Present complex data simply",
        "Create engaging summaries",
        "Support visual learners",
        "Enable quick information access"
      );
      break;
    case 'mind_map_creation':
      applications.push(
        "Organize knowledge structures",
        "Show concept relationships",
        "Support brainstorming",
        "Create study aids"
      );
      break;
    case 'flowchart_generation':
      applications.push(
        "Explain processes step-by-step",
        "Show decision paths",
        "Support logical thinking",
        "Create problem-solving guides"
      );
      break;
    default:
      applications.push(
        "Enhance visual learning",
        "Create engaging content",
        "Support comprehension",
        "Enable interactive exploration"
      );
  }
  
  return applications;
}

// Helper functions to extract specific information from AI responses
function extractVisualElements(text: string): string[] {
  const elementRegex = /(?:visual elements?|elements?):\s*([^.!?]+)/gi;
  const matches = text.match(elementRegex);
  return matches ? matches.map(m => m.replace(/(?:visual elements?|elements?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractLearningOpportunities(text: string): string[] {
  const opportunityRegex = /(?:learning opportunities?|opportunities?):\s*([^.!?]+)/gi;
  const matches = text.match(opportunityRegex);
  return matches ? matches.map(m => m.replace(/(?:learning opportunities?|opportunities?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractDiscussionQuestions(text: string): string[] {
  const questionRegex = /(?:discussion questions?|questions?):\s*([^.!?]*\?)/gi;
  const matches = text.match(questionRegex);
  return matches ? matches.map(m => m.replace(/(?:discussion questions?|questions?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractCurriculumConnections(text: string): string[] {
  const connectionRegex = /(?:curriculum connections?|connections?):\s*([^.!?]+)/gi;
  const matches = text.match(connectionRegex);
  return matches ? matches.map(m => m.replace(/(?:curriculum connections?|connections?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractInteractiveActivities(text: string): string[] {
  const activityRegex = /(?:interactive activities?|activities?):\s*([^.!?]+)/gi;
  const matches = text.match(activityRegex);
  return matches ? matches.map(m => m.replace(/(?:interactive activities?|activities?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractAssessmentOpportunities(text: string): string[] {
  const assessmentRegex = /(?:assessment opportunities?|assessments?):\s*([^.!?]+)/gi;
  const matches = text.match(assessmentRegex);
  return matches ? matches.map(m => m.replace(/(?:assessment opportunities?|assessments?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractAccessibilityConsiderations(text: string): string[] {
  const accessibilityRegex = /(?:accessibility considerations?|accessibility?):\s*([^.!?]+)/gi;
  const matches = text.match(accessibilityRegex);
  return matches ? matches.map(m => m.replace(/(?:accessibility considerations?|accessibility?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractRelatedResources(text: string): string[] {
  const resourceRegex = /(?:related resources?|resources?):\s*([^.!?]+)/gi;
  const matches = text.match(resourceRegex);
  return matches ? matches.map(m => m.replace(/(?:related resources?|resources?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractVisualStructure(text: string): string {
  const structureRegex = /(?:visual structure|structure):\s*([^.!?]+)/i;
  const match = text.match(structureRegex);
  return match ? match[1].trim() : '';
}

function extractKeyElements(text: string): string[] {
  const elementRegex = /(?:key elements?|elements?):\s*([^.!?]+)/gi;
  const matches = text.match(elementRegex);
  return matches ? matches.map(m => m.replace(/(?:key elements?|elements?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractColorCoding(text: string): string[] {
  const colorRegex = /(?:color coding|colors?):\s*([^.!?]+)/gi;
  const matches = text.match(colorRegex);
  return matches ? matches.map(m => m.replace(/(?:color coding|colors?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractLabels(text: string): string[] {
  const labelRegex = /(?:labels?|annotations?):\s*([^.!?]+)/gi;
  const matches = text.match(labelRegex);
  return matches ? matches.map(m => m.replace(/(?:labels?|annotations?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractInteractiveElements(text: string): string[] {
  const interactiveRegex = /(?:interactive elements?|interactive?):\s*([^.!?]+)/gi;
  const matches = text.match(interactiveRegex);
  return matches ? matches.map(m => m.replace(/(?:interactive elements?|interactive?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractProgressionIndicators(text: string): string[] {
  const progressionRegex = /(?:progression indicators?|progression?):\s*([^.!?]+)/gi;
  const matches = text.match(progressionRegex);
  return matches ? matches.map(m => m.replace(/(?:progression indicators?|progression?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractAccessibilityFeatures(text: string): string[] {
  const accessibilityRegex = /(?:accessibility features?|accessibility?):\s*([^.!?]+)/gi;
  const matches = text.match(accessibilityRegex);
  return matches ? matches.map(m => m.replace(/(?:accessibility features?|accessibility?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractImplementationGuidelines(text: string): string[] {
  const guidelineRegex = /(?:implementation guidelines?|implementation?):\s*([^.!?]+)/gi;
  const matches = text.match(guidelineRegex);
  return matches ? matches.map(m => m.replace(/(?:implementation guidelines?|implementation?):\s*/i, '').trim()).slice(0, 5) : [];
}

function generateRenderingInstructions(text: string, diagramType: string): any {
  // Generate basic rendering instructions based on diagram type
  const baseInstructions = {
    type: diagramType,
    elements: extractKeyElements(text),
    connections: extractConnections(text),
    layout: extractLayout(text),
    styling: extractStyling(text)
  };
  
  return baseInstructions;
}

function extractConnections(text: string): string[] {
  const connectionRegex = /(?:connections?|relationships?):\s*([^.!?]+)/gi;
  const matches = text.match(connectionRegex);
  return matches ? matches.map(m => m.replace(/(?:connections?|relationships?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractLayout(text: string): string {
  const layoutRegex = /(?:layout|arrangement):\s*([^.!?]+)/i;
  const match = text.match(layoutRegex);
  return match ? match[1].trim() : 'hierarchical';
}

function extractStyling(text: string): any {
  return {
    colors: extractColorCoding(text),
    fonts: extractFonts(text),
    shapes: extractShapes(text),
    sizes: extractSizes(text)
  };
}

function extractFonts(text: string): string[] {
  const fontRegex = /(?:fonts?|typography):\s*([^.!?]+)/gi;
  const matches = text.match(fontRegex);
  return matches ? matches.map(m => m.replace(/(?:fonts?|typography):\s*/i, '').trim()).slice(0, 3) : [];
}

function extractShapes(text: string): string[] {
  const shapeRegex = /(?:shapes?|forms?):\s*([^.!?]+)/gi;
  const matches = text.match(shapeRegex);
  return matches ? matches.map(m => m.replace(/(?:shapes?|forms?):\s*/i, '').trim()).slice(0, 3) : [];
}

function extractSizes(text: string): string[] {
  const sizeRegex = /(?:sizes?|dimensions?):\s*([^.!?]+)/gi;
  const matches = text.match(sizeRegex);
  return matches ? matches.map(m => m.replace(/(?:sizes?|dimensions?):\s*/i, '').trim()).slice(0, 3) : [];
}

// Additional helper functions for other processing types...
function extractVisualMetaphors(text: string): string[] {
  const metaphorRegex = /(?:metaphors?|analogies?):\s*([^.!?]+)/gi;
  const matches = text.match(metaphorRegex);
  return matches ? matches.map(m => m.replace(/(?:metaphors?|analogies?):\s*/i, '').trim()).slice(0, 3) : [];
}

function extractSpatialOrganization(text: string): string {
  const spatialRegex = /(?:spatial organization|organization):\s*([^.!?]+)/i;
  const match = text.match(spatialRegex);
  return match ? match[1].trim() : '';
}

function extractRelationshipIndicators(text: string): string[] {
  const relationshipRegex = /(?:relationship indicators?|indicators?):\s*([^.!?]+)/gi;
  const matches = text.match(relationshipRegex);
  return matches ? matches.map(m => m.replace(/(?:relationship indicators?|indicators?):\s*/i, '').trim()).slice(0, 3) : [];
}

function extractProgressiveDisclosure(text: string): string[] {
  const disclosureRegex = /(?:progressive disclosure|disclosure):\s*([^.!?]+)/gi;
  const matches = text.match(disclosureRegex);
  return matches ? matches.map(m => m.replace(/(?:progressive disclosure|disclosure):\s*/i, '').trim()).slice(0, 3) : [];
}

function extractExplorationPaths(text: string): string[] {
  const pathRegex = /(?:exploration paths?|paths?):\s*([^.!?]+)/gi;
  const matches = text.match(pathRegex);
  return matches ? matches.map(m => m.replace(/(?:exploration paths?|paths?):\s*/i, '').trim()).slice(0, 3) : [];
}

function extractMemoryAids(text: string): string[] {
  const memoryRegex = /(?:memory aids?|mnemonics?):\s*([^.!?]+)/gi;
  const matches = text.match(memoryRegex);
  return matches ? matches.map(m => m.replace(/(?:memory aids?|mnemonics?):\s*/i, '').trim()).slice(0, 3) : [];
}

function extractAssessmentIntegration(text: string): string[] {
  const assessmentRegex = /(?:assessment integration|integration):\s*([^.!?]+)/gi;
  const matches = text.match(assessmentRegex);
  return matches ? matches.map(m => m.replace(/(?:assessment integration|integration):\s*/i, '').trim()).slice(0, 3) : [];
}

function extractCustomizationOptions(text: string): string[] {
  const customizationRegex = /(?:customization options?|customization):\s*([^.!?]+)/gi;
  const matches = text.match(customizationRegex);
  return matches ? matches.map(m => m.replace(/(?:customization options?|customization):\s*/i, '').trim()).slice(0, 3) : [];
}

function generateVisualizationRenderingPlan(text: string, visualizationType: string): any {
  return {
    type: visualizationType,
    structure: extractVisualStructure(text),
    elements: extractKeyElements(text),
    interactions: extractInteractiveElements(text),
    rendering: {
      technology: 'SVG',
      responsive: true,
      interactive: true,
      accessible: true
    }
  };
}

function generateMindMapRenderingInstructions(text: string): any {
  return {
    type: 'mind_map',
    centralNode: extractCentralNode(text),
    branches: extractBranchStructure(text),
    layout: 'radial',
    rendering: {
      technology: 'D3.js',
      interactive: true,
      zoomable: true,
      collapsible: true
    }
  };
}

function generateFlowchartRenderingInstructions(text: string): any {
  return {
    type: 'flowchart',
    flow: extractFlowStructure(text),
    nodes: extractStepDefinitions(text),
    layout: 'hierarchical',
    rendering: {
      technology: 'Mermaid',
      interactive: true,
      navigable: true,
      exportable: true
    }
  };
}

// Additional extraction functions...
function extractCentralNode(text: string): string {
  const centralRegex = /(?:central node|central concept):\s*([^.!?]+)/i;
  const match = text.match(centralRegex);
  return match ? match[1].trim() : '';
}

function extractBranchStructure(text: string): string[] {
  const branchRegex = /(?:branch structure|branches?):\s*([^.!?]+)/gi;
  const matches = text.match(branchRegex);
  return matches ? matches.map(m => m.replace(/(?:branch structure|branches?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractNodeContent(text: string): string[] {
  const nodeRegex = /(?:node content|nodes?):\s*([^.!?]+)/gi;
  const matches = text.match(nodeRegex);
  return matches ? matches.map(m => m.replace(/(?:node content|nodes?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractInteractiveFeatures(text: string): string[] {
  const featureRegex = /(?:interactive features?|features?):\s*([^.!?]+)/gi;
  const matches = text.match(featureRegex);
  return matches ? matches.map(m => m.replace(/(?:interactive features?|features?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractFlowStructure(text: string): string {
  const flowRegex = /(?:flow structure|structure):\s*([^.!?]+)/i;
  const match = text.match(flowRegex);
  return match ? match[1].trim() : '';
}

function extractStepDefinitions(text: string): string[] {
  const stepRegex = /(?:step definitions?|steps?):\s*([^.!?]+)/gi;
  const matches = text.match(stepRegex);
  return matches ? matches.map(m => m.replace(/(?:step definitions?|steps?):\s*/i, '').trim()).slice(0, 8) : [];
}

function extractDecisionLogic(text: string): string[] {
  const decisionRegex = /(?:decision logic|decisions?):\s*([^.!?]+)/gi;
  const matches = text.match(decisionRegex);
  return matches ? matches.map(m => m.replace(/(?:decision logic|decisions?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractVisualDesign(text: string): string {
  const designRegex = /(?:visual design|design):\s*([^.!?]+)/i;
  const match = text.match(designRegex);
  return match ? match[1].trim() : '';
}

function extractErrorHandling(text: string): string[] {
  const errorRegex = /(?:error handling|errors?):\s*([^.!?]+)/gi;
  const matches = text.match(errorRegex);
  return matches ? matches.map(m => m.replace(/(?:error handling|errors?):\s*/i, '').trim()).slice(0, 3) : [];
}

function extractLearningCheckpoints(text: string): string[] {
  const checkpointRegex = /(?:learning checkpoints?|checkpoints?):\s*([^.!?]+)/gi;
  const matches = text.match(checkpointRegex);
  return matches ? matches.map(m => m.replace(/(?:learning checkpoints?|checkpoints?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractHotspots(text: string): string[] {
  const hotspotRegex = /(?:hotspots?|hotspot placement):\s*([^.!?]+)/gi;
  const matches = text.match(hotspotRegex);
  return matches ? matches.map(m => m.replace(/(?:hotspots?|hotspot placement):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractProgressiveReveal(text: string): string[] {
  const revealRegex = /(?:progressive reveal|reveal):\s*([^.!?]+)/gi;
  const matches = text.match(revealRegex);
  return matches ? matches.map(m => m.replace(/(?:progressive reveal|reveal):\s*/i, '').trim()).slice(0, 3) : [];
}

function extractQuizIntegration(text: string): string[] {
  const quizRegex = /(?:quiz integration|quiz):\s*([^.!?]+)/gi;
  const matches = text.match(quizRegex);
  return matches ? matches.map(m => m.replace(/(?:quiz integration|quiz):\s*/i, '').trim()).slice(0, 3) : [];
}

function extractContextualExplanations(text: string): string[] {
  const explanationRegex = /(?:contextual explanations?|explanations?):\s*([^.!?]+)/gi;
  const matches = text.match(explanationRegex);
  return matches ? matches.map(m => m.replace(/(?:contextual explanations?|explanations?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractConceptConnections(text: string): string[] {
  const connectionRegex = /(?:concept connections?|connections?):\s*([^.!?]+)/gi;
  const matches = text.match(connectionRegex);
  return matches ? matches.map(m => m.replace(/(?:concept connections?|connections?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractEngagementMechanics(text: string): string[] {
  const engagementRegex = /(?:engagement mechanics?|mechanics?):\s*([^.!?]+)/gi;
  const matches = text.match(engagementRegex);
  return matches ? matches.map(m => m.replace(/(?:engagement mechanics?|mechanics?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractImplementationGuide(text: string): string[] {
  const guideRegex = /(?:implementation guide|guide):\s*([^.!?]+)/gi;
  const matches = text.match(guideRegex);
  return matches ? matches.map(m => m.replace(/(?:implementation guide|guide):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractQuizQuestions(text: string): string[] {
  const questionRegex = /(?:questions?|quiz questions?):\s*([^.!?]*\?)/gi;
  const matches = text.match(questionRegex);
  return matches ? matches.map(m => m.replace(/(?:questions?|quiz questions?):\s*/i, '').trim()).slice(0, 10) : [];
}

function extractVisualQuizElements(text: string): string[] {
  const elementRegex = /(?:visual elements?|quiz elements?):\s*([^.!?]+)/gi;
  const matches = text.match(elementRegex);
  return matches ? matches.map(m => m.replace(/(?:visual elements?|quiz elements?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractDifficultyProgression(text: string): string[] {
  const progressionRegex = /(?:difficulty progression|progression):\s*([^.!?]+)/gi;
  const matches = text.match(progressionRegex);
  return matches ? matches.map(m => m.replace(/(?:difficulty progression|progression):\s*/i, '').trim()).slice(0, 3) : [];
}

function extractFeedbackMessages(text: string): string[] {
  const feedbackRegex = /(?:feedback messages?|feedback):\s*([^.!?]+)/gi;
  const matches = text.match(feedbackRegex);
  return matches ? matches.map(m => m.replace(/(?:feedback messages?|feedback):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractAccessibilityAdaptations(text: string): string[] {
  const adaptationRegex = /(?:accessibility adaptations?|adaptations?):\s*([^.!?]+)/gi;
  const matches = text.match(adaptationRegex);
  return matches ? matches.map(m => m.replace(/(?:accessibility adaptations?|adaptations?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractScoringRubric(text: string): string[] {
  const rubricRegex = /(?:scoring rubric|rubric):\s*([^.!?]+)/gi;
  const matches = text.match(rubricRegex);
  return matches ? matches.map(m => m.replace(/(?:scoring rubric|rubric):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractLearningObjectiveMapping(text: string): string[] {
  const mappingRegex = /(?:learning objective mapping|mapping):\s*([^.!?]+)/gi;
  const matches = text.match(mappingRegex);
  return matches ? matches.map(m => m.replace(/(?:learning objective mapping|mapping):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractInformationHierarchy(text: string): string[] {
  const hierarchyRegex = /(?:information hierarchy|hierarchy):\s*([^.!?]+)/gi;
  const matches = text.match(hierarchyRegex);
  return matches ? matches.map(m => m.replace(/(?:information hierarchy|hierarchy):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractColorScheme(text: string): string[] {
  const schemeRegex = /(?:color scheme|colors?):\s*([^.!?]+)/gi;
  const matches = text.match(schemeRegex);
  return matches ? matches.map(m => m.replace(/(?:color scheme|colors?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractIconSuggestions(text: string): string[] {
  const iconRegex = /(?:icon suggestions?|icons?):\s*([^.!?]+)/gi;
  const matches = text.match(iconRegex);
  return matches ? matches.map(m => m.replace(/(?:icon suggestions?|icons?):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractDataVisualization(text: string): string[] {
  const dataRegex = /(?:data visualization|visualization):\s*([^.!?]+)/gi;
  const matches = text.match(dataRegex);
  return matches ? matches.map(m => m.replace(/(?:data visualization|visualization):\s*/i, '').trim()).slice(0, 5) : [];
}

function extractLearningEnhancements(text: string): string[] {
  const enhancementRegex = /(?:learning enhancements?|enhancements?):\s*([^.!?]+)/gi;
  const matches = text.match(enhancementRegex);
  return matches ? matches.map(m => m.replace(/(?:learning enhancements?|enhancements?):\s*/i, '').trim()).slice(0, 5) : [];
}

function generateLayoutSpecification(text: string): any {
  return {
    type: 'infographic',
    sections: extractInformationHierarchy(text),
    layout: extractLayout(text),
    dimensions: extractDimensions(text),
    responsive: true
  };
}

function extractDimensions(text: string): string {
  const dimensionRegex = /(?:dimensions?|size):\s*([^.!?]+)/i;
  const match = text.match(dimensionRegex);
  return match ? match[1].trim() : '800x600';
}