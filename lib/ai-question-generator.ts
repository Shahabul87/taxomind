/**
 * Sophisticated AI Question Generator with Deep Bloom's Taxonomy Integration
 * 
 * This module provides advanced pedagogically-aware question generation
 * that leverages cognitive science principles and educational best practices.
 */

import { BloomsLevel, QuestionType, ExamQuestion } from '@prisma/client';

// Enhanced Bloom's Taxonomy Framework with Cognitive Load Theory
export interface BloomsTaxonomyLevel {
  level: BloomsLevel;
  description: string;
  cognitiveLoad: number; // 1-5 scale
  verbs: string[];
  questionStarters: string[];
  assessmentFocus: string;
  prerequisites: BloomsLevel[];
  typicalQuestionTypes: QuestionType[];
}

export const ENHANCED_BLOOMS_FRAMEWORK: Record<BloomsLevel, BloomsTaxonomyLevel> = {
  REMEMBER: {
    level: 'REMEMBER',
    description: 'Recall and retrieve relevant knowledge from long-term memory',
    cognitiveLoad: 1,
    verbs: ['define', 'identify', 'list', 'name', 'recall', 'recognize', 'retrieve', 'state', 'describe', 'match'],
    questionStarters: ['What is...?', 'Who...?', 'When...?', 'Where...?', 'Which...?', 'How many...?'],
    assessmentFocus: 'Factual knowledge, terminology, basic concepts, specific details',
    prerequisites: [],
    typicalQuestionTypes: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK']
  },
  UNDERSTAND: {
    level: 'UNDERSTAND',
    description: 'Construct meaning from messages through interpreting, exemplifying, classifying, summarizing, inferring, comparing, and explaining',
    cognitiveLoad: 2,
    verbs: ['explain', 'interpret', 'summarize', 'paraphrase', 'classify', 'compare', 'exemplify', 'infer', 'translate', 'illustrate'],
    questionStarters: ['How would you explain...?', 'What does this mean...?', 'Why is...?', 'How are these similar/different...?'],
    assessmentFocus: 'Comprehension, interpretation, translation between formats',
    prerequisites: ['REMEMBER'],
    typicalQuestionTypes: ['SHORT_ANSWER', 'MULTIPLE_CHOICE', 'ESSAY']
  },
  APPLY: {
    level: 'APPLY',
    description: 'Carry out or use a procedure in a given situation',
    cognitiveLoad: 3,
    verbs: ['apply', 'execute', 'implement', 'use', 'demonstrate', 'solve', 'construct', 'change', 'operate', 'practice'],
    questionStarters: ['How would you use...?', 'What would happen if...?', 'How would you solve...?', 'Can you apply...?'],
    assessmentFocus: 'Procedural knowledge, skill application, problem-solving in familiar contexts',
    prerequisites: ['REMEMBER', 'UNDERSTAND'],
    typicalQuestionTypes: ['SHORT_ANSWER', 'ESSAY', 'MULTIPLE_CHOICE']
  },
  ANALYZE: {
    level: 'ANALYZE',
    description: 'Break material into constituent parts and determine how parts relate to one another and to overall structure',
    cognitiveLoad: 4,
    verbs: ['analyze', 'differentiate', 'organize', 'attribute', 'deconstruct', 'compare', 'contrast', 'examine', 'investigate', 'categorize'],
    questionStarters: ['What are the components...?', 'How do these relate...?', 'What evidence supports...?', 'What patterns...?'],
    assessmentFocus: 'Relationships, cause-and-effect, evidence evaluation, pattern recognition',
    prerequisites: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
    typicalQuestionTypes: ['ESSAY', 'SHORT_ANSWER', 'MULTIPLE_CHOICE']
  },
  EVALUATE: {
    level: 'EVALUATE',
    description: 'Make judgments based on criteria and standards through checking and critiquing',
    cognitiveLoad: 5,
    verbs: ['evaluate', 'judge', 'critique', 'assess', 'defend', 'justify', 'support', 'argue', 'prioritize', 'recommend'],
    questionStarters: ['How would you evaluate...?', 'What is your opinion...?', 'How would you prioritize...?', 'What criteria...?'],
    assessmentFocus: 'Critical thinking, judgment, decision-making, criteria-based evaluation',
    prerequisites: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE'],
    typicalQuestionTypes: ['ESSAY', 'SHORT_ANSWER']
  },
  CREATE: {
    level: 'CREATE',
    description: 'Put elements together to form a coherent or functional whole; reorganize into a new pattern or structure',
    cognitiveLoad: 5,
    verbs: ['create', 'design', 'construct', 'plan', 'produce', 'invent', 'develop', 'formulate', 'build', 'generate'],
    questionStarters: ['How would you design...?', 'What would you create...?', 'Can you formulate...?', 'How would you improve...?'],
    assessmentFocus: 'Original thinking, innovation, synthesis, creative problem-solving',
    prerequisites: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE'],
    typicalQuestionTypes: ['ESSAY', 'SHORT_ANSWER']
  }
};

// Question Pattern Templates for Each Bloom's Level
export interface QuestionPattern {
  bloomsLevel: BloomsLevel;
  questionType: QuestionType;
  template: string;
  cognitiveMarkers: string[];
  assessmentCriteria: string[];
}

export const QUESTION_PATTERNS: QuestionPattern[] = [
  // REMEMBER Level Patterns
  {
    bloomsLevel: 'REMEMBER',
    questionType: 'MULTIPLE_CHOICE',
    template: 'What is the definition of {concept}?',
    cognitiveMarkers: ['definition', 'identification', 'recall'],
    assessmentCriteria: ['Accurate recall', 'Precise terminology']
  },
  {
    bloomsLevel: 'REMEMBER',
    questionType: 'TRUE_FALSE',
    template: '{factual_statement} is true/false.',
    cognitiveMarkers: ['factual knowledge', 'basic concepts'],
    assessmentCriteria: ['Factual accuracy', 'Clear understanding']
  },
  
  // UNDERSTAND Level Patterns
  {
    bloomsLevel: 'UNDERSTAND',
    questionType: 'SHORT_ANSWER',
    template: 'Explain in your own words what {concept} means and why it is important.',
    cognitiveMarkers: ['explanation', 'interpretation', 'significance'],
    assessmentCriteria: ['Clear explanation', 'Personal understanding', 'Contextual awareness']
  },
  {
    bloomsLevel: 'UNDERSTAND',
    questionType: 'MULTIPLE_CHOICE',
    template: 'Which of the following best explains why {phenomenon} occurs?',
    cognitiveMarkers: ['causation', 'reasoning', 'comprehension'],
    assessmentCriteria: ['Logical reasoning', 'Cause-effect understanding']
  },
  
  // APPLY Level Patterns
  {
    bloomsLevel: 'APPLY',
    questionType: 'SHORT_ANSWER',
    template: 'Given the scenario: {scenario}, how would you apply {concept} to solve this problem?',
    cognitiveMarkers: ['application', 'problem-solving', 'transfer'],
    assessmentCriteria: ['Correct application', 'Contextual adaptation', 'Practical implementation']
  },
  {
    bloomsLevel: 'APPLY',
    questionType: 'ESSAY',
    template: 'Demonstrate how you would use {principle} to address {real_world_situation}.',
    cognitiveMarkers: ['demonstration', 'practical use', 'implementation'],
    assessmentCriteria: ['Appropriate method selection', 'Execution accuracy', 'Real-world relevance']
  },
  
  // ANALYZE Level Patterns
  {
    bloomsLevel: 'ANALYZE',
    questionType: 'ESSAY',
    template: 'Compare and contrast {concept_a} and {concept_b}, analyzing their relationship to {broader_context}.',
    cognitiveMarkers: ['comparison', 'relationship analysis', 'pattern recognition'],
    assessmentCriteria: ['Systematic comparison', 'Relationship identification', 'Evidence-based reasoning']
  },
  {
    bloomsLevel: 'ANALYZE',
    questionType: 'SHORT_ANSWER',
    template: 'What evidence supports the claim that {claim}? What might contradict it?',
    cognitiveMarkers: ['evidence evaluation', 'critical examination', 'contradiction analysis'],
    assessmentCriteria: ['Evidence identification', 'Balanced analysis', 'Critical thinking']
  },
  
  // EVALUATE Level Patterns
  {
    bloomsLevel: 'EVALUATE',
    questionType: 'ESSAY',
    template: 'Evaluate the effectiveness of {approach/method} for {purpose}. What criteria would you use?',
    cognitiveMarkers: ['evaluation', 'criteria establishment', 'judgment'],
    assessmentCriteria: ['Clear criteria', 'Balanced judgment', 'Evidence-based evaluation']
  },
  {
    bloomsLevel: 'EVALUATE',
    questionType: 'SHORT_ANSWER',
    template: 'Which solution would you recommend for {problem} and why? Consider multiple perspectives.',
    cognitiveMarkers: ['recommendation', 'justification', 'perspective-taking'],
    assessmentCriteria: ['Sound reasoning', 'Multiple perspectives', 'Clear justification']
  },
  
  // CREATE Level Patterns
  {
    bloomsLevel: 'CREATE',
    questionType: 'ESSAY',
    template: 'Design a {solution/system/approach} that addresses {complex_problem}. Explain your rationale.',
    cognitiveMarkers: ['design', 'innovation', 'synthesis'],
    assessmentCriteria: ['Originality', 'Feasibility', 'Integration of concepts', 'Innovation']
  },
  {
    bloomsLevel: 'CREATE',
    questionType: 'SHORT_ANSWER',
    template: 'Propose a new way to {improve/solve/approach} {situation} using principles from {domain}.',
    cognitiveMarkers: ['proposal', 'innovation', 'synthesis'],
    assessmentCriteria: ['Novel approach', 'Principle integration', 'Creative thinking']
  }
];

// Advanced Question Generation Interface
export interface QuestionGenerationRequest {
  sectionTitle: string;
  chapterTitle?: string;
  courseTitle?: string;
  learningObjectives: string[];
  bloomsDistribution: Partial<Record<BloomsLevel, number>>;
  questionCount: number;
  targetAudience: 'beginner' | 'intermediate' | 'advanced';
  cognitiveLoadLimit: number; // Maximum cognitive load (1-5)
  prerequisiteKnowledge: string[];
  assessmentPurpose: 'formative' | 'summative' | 'diagnostic';
  contextualScenarios?: string[];
  userPrompt?: string;
}

export interface EnhancedQuestion {
  id: string;
  bloomsLevel: BloomsLevel;
  questionType: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  cognitiveLoad: number;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  assessmentCriteria: string[];
  prerequisites: string[];
  learningObjective: string;
  timeEstimate: number; // in minutes
  tags: string[];
}

// Pedagogical Validation System
export interface QuestionValidation {
  isValid: boolean;
  bloomsAlignment: number; // 0-1 score
  cognitiveLoadAppropriate: boolean;
  clarityScore: number; // 0-1 score
  difficultyAlignment: number; // 0-1 score
  suggestions: string[];
  pedagogicalWarnings: string[];
}

export class AdvancedQuestionGenerator {
  private static instance: AdvancedQuestionGenerator;
  
  private constructor() {}
  
  public static getInstance(): AdvancedQuestionGenerator {
    if (!AdvancedQuestionGenerator.instance) {
      AdvancedQuestionGenerator.instance = new AdvancedQuestionGenerator();
    }
    return AdvancedQuestionGenerator.instance;
  }
  
  /**
   * Generate sophisticated AI prompts with deep pedagogical awareness
   */
  public generateAdvancedPrompt(request: QuestionGenerationRequest): string {
    const bloomsContext = this.buildBloomsContext(request.bloomsDistribution);
    const prerequisiteContext = this.buildPrerequisiteContext(request.prerequisiteKnowledge);
    const audienceContext = this.buildAudienceContext(request.targetAudience);
    
    return `You are an expert educational assessment designer with deep knowledge of cognitive science, learning theory, and Bloom's taxonomy. Create pedagogically sophisticated exam questions that accurately assess student learning at specific cognitive levels.

**EDUCATIONAL CONTEXT:**
course: ${request.courseTitle || 'Not specified'}
Chapter: ${request.chapterTitle || 'Not specified'}
Section: ${request.sectionTitle}
Assessment Purpose: ${request.assessmentPurpose}
Target Audience: ${request.targetAudience}

**LEARNING OBJECTIVES:**
${request.learningObjectives.map(obj => `- ${obj}`).join('\n')}

**COGNITIVE REQUIREMENTS:**
${bloomsContext}
Maximum Cognitive Load: ${request.cognitiveLoadLimit}/5
${prerequisiteContext}
${audienceContext}

**BLOOM'S TAXONOMY SPECIFICATIONS:**
${this.generateBloomsSpecifications(request.bloomsDistribution)}

**QUESTION GENERATION REQUIREMENTS:**
1. Generate exactly ${request.questionCount} questions
2. Distribute questions according to specified Bloom's levels
3. Each question must clearly target ONE specific cognitive level
4. Include precise cognitive load assessment for each question
5. Ensure questions build on prerequisite knowledge appropriately
6. Provide detailed pedagogical rationale for each question

**PEDAGOGICAL QUALITY STANDARDS:**
- Questions must be unambiguous and clearly worded
- Multiple choice distractors must be plausible but clearly incorrect
- Assessment criteria must align with cognitive level expectations
- Questions should promote meaningful learning, not rote memorization
- Include metacognitive elements where appropriate

**RESPONSE FORMAT:**
Return a JSON array where each question follows this enhanced structure:
{
  "id": "unique_identifier",
  "bloomsLevel": "specific_blooms_level",
  "questionType": "question_type",
  "question": "clearly_worded_question",
  "options": ["array_for_multiple_choice"] // if applicable,
  "correctAnswer": "answer_text",
  "explanation": "detailed_pedagogical_explanation",
  "cognitiveLoad": cognitive_load_score_1_to_5,
  "difficulty": "easy|medium|hard",
  "points": point_value,
  "assessmentCriteria": ["criteria_for_evaluation"],
  "prerequisites": ["required_knowledge"],
  "learningObjective": "targeted_learning_objective",
  "timeEstimate": estimated_minutes,
  "tags": ["relevant_topic_tags"],
  "pedagogicalRationale": "why_this_question_is_educationally_valuable"
}

${request.userPrompt ? `\n**ADDITIONAL INSTRUCTIONS:**\n${request.userPrompt}` : ''}

Create questions that not only assess knowledge but promote deep learning and critical thinking.`;
  }
  
  /**
   * Validate question alignment with Bloom's taxonomy
   */
  public validateQuestionAlignment(question: EnhancedQuestion): QuestionValidation {
    const bloomsLevel = ENHANCED_BLOOMS_FRAMEWORK[question.bloomsLevel];
    const suggestions: string[] = [];
    const warnings: string[] = [];
    
    // Check Bloom's alignment
    let bloomsAlignment = 0;
    const questionText = question.question.toLowerCase();
    const bloomsVerbs = bloomsLevel.verbs.filter(verb => 
      questionText.includes(verb.toLowerCase())
    );
    bloomsAlignment = Math.min(1, bloomsVerbs.length / 3);
    
    if (bloomsAlignment < 0.3) {
      suggestions.push(`Consider using Bloom's level-appropriate verbs: ${bloomsLevel.verbs.slice(0, 5).join(', ')}`);
    }
    
    // Check cognitive load appropriateness
    const cognitiveLoadAppropriate = question.cognitiveLoad <= bloomsLevel.cognitiveLoad;
    if (!cognitiveLoadAppropriate) {
      warnings.push(`Cognitive load (${question.cognitiveLoad}) exceeds level expectation (${bloomsLevel.cognitiveLoad})`);
    }
    
    // Check clarity (basic heuristics)
    const clarityScore = this.assessQuestionClarity(question.question);
    if (clarityScore < 0.7) {
      suggestions.push('Consider making the question more specific and unambiguous');
    }
    
    // Check difficulty alignment
    const difficultyAlignment = this.assessQuestionDifficultyAlignment(question);
    if (difficultyAlignment < 0.7) {
      suggestions.push('Question difficulty may not align with cognitive complexity');
    }
    
    return {
      isValid: bloomsAlignment > 0.5 && cognitiveLoadAppropriate && clarityScore > 0.6,
      bloomsAlignment,
      cognitiveLoadAppropriate,
      clarityScore,
      difficultyAlignment,
      suggestions,
      pedagogicalWarnings: warnings
    };
  }
  
  /**
   * Generate optimal Bloom's distribution for a given context
   */
  public generateOptimalBloomsDistribution(
    assessmentPurpose: QuestionGenerationRequest['assessmentPurpose'],
    targetAudience: QuestionGenerationRequest['targetAudience'],
    questionCount: number
  ): Record<BloomsLevel, number> {
    const distributions = {
      formative: {
        beginner: { REMEMBER: 0.4, UNDERSTAND: 0.4, APPLY: 0.2, ANALYZE: 0, EVALUATE: 0, CREATE: 0 },
        intermediate: { REMEMBER: 0.2, UNDERSTAND: 0.3, APPLY: 0.3, ANALYZE: 0.2, EVALUATE: 0, CREATE: 0 },
        advanced: { REMEMBER: 0.1, UNDERSTAND: 0.2, APPLY: 0.3, ANALYZE: 0.3, EVALUATE: 0.1, CREATE: 0 }
      },
      summative: {
        beginner: { REMEMBER: 0.3, UNDERSTAND: 0.3, APPLY: 0.3, ANALYZE: 0.1, EVALUATE: 0, CREATE: 0 },
        intermediate: { REMEMBER: 0.15, UNDERSTAND: 0.25, APPLY: 0.3, ANALYZE: 0.2, EVALUATE: 0.1, CREATE: 0 },
        advanced: { REMEMBER: 0.1, UNDERSTAND: 0.2, APPLY: 0.25, ANALYZE: 0.25, EVALUATE: 0.15, CREATE: 0.05 }
      },
      diagnostic: {
        beginner: { REMEMBER: 0.5, UNDERSTAND: 0.3, APPLY: 0.2, ANALYZE: 0, EVALUATE: 0, CREATE: 0 },
        intermediate: { REMEMBER: 0.3, UNDERSTAND: 0.3, APPLY: 0.2, ANALYZE: 0.2, EVALUATE: 0, CREATE: 0 },
        advanced: { REMEMBER: 0.2, UNDERSTAND: 0.2, APPLY: 0.2, ANALYZE: 0.2, EVALUATE: 0.1, CREATE: 0.1 }
      }
    };
    
    const distribution = distributions[assessmentPurpose][targetAudience];
    const result: Record<BloomsLevel, number> = {} as Record<BloomsLevel, number>;
    
    Object.entries(distribution).forEach(([level, percentage]) => {
      result[level as BloomsLevel] = Math.round(questionCount * percentage);
    });
    
    return result;
  }
  
  private buildBloomsContext(distribution: Partial<Record<BloomsLevel, number>>): string {
    const entries = Object.entries(distribution).filter(([_, count]) => count && count > 0);
    if (entries.length === 0) return 'No specific Bloom\'s distribution specified.';
    
    return 'Bloom\'s Level Distribution:\n' + 
      entries.map(([level, count]) => {
        const framework = ENHANCED_BLOOMS_FRAMEWORK[level as BloomsLevel];
        return `- ${level}: ${count} questions (${framework.description})`;
      }).join('\n');
  }
  
  private buildPrerequisiteContext(prerequisites: string[]): string {
    if (prerequisites.length === 0) return '';
    return `\n**PREREQUISITE KNOWLEDGE:**\n${prerequisites.map(p => `- ${p}`).join('\n')}`;
  }
  
  private buildAudienceContext(audience: string): string {
    const contexts = {
      beginner: 'Students new to the subject with limited background knowledge',
      intermediate: 'Students with basic understanding seeking to deepen knowledge',
      advanced: 'Experienced students ready for complex application and analysis'
    };
    return `\n**AUDIENCE CONTEXT:** ${contexts[audience as keyof typeof contexts]}`;
  }
  
  private generateBloomsSpecifications(distribution: Partial<Record<BloomsLevel, number>>): string {
    return Object.entries(distribution)
      .filter(([_, count]) => count && count > 0)
      .map(([level, count]) => {
        const framework = ENHANCED_BLOOMS_FRAMEWORK[level as BloomsLevel];
        return `**${level} Level (${count} questions):**
- Focus: ${framework.assessmentFocus}
- Key Verbs: ${framework.verbs.slice(0, 8).join(', ')}
- Question Starters: ${framework.questionStarters.slice(0, 3).join(', ')}
- Cognitive Load: ${framework.cognitiveLoad}/5`;
      }).join('\n\n');
  }
  
  private assessQuestionClarity(question: string): number {
    // Basic heuristics for question clarity
    let score = 1.0;
    
    // Penalize very long or very short questions
    if (question.length < 20 || question.length > 300) score -= 0.2;
    
    // Reward clear question structure
    if (question.includes('?')) score += 0.1;
    
    // Penalize ambiguous words
    const ambiguousWords = ['some', 'many', 'few', 'often', 'sometimes', 'usually'];
    const ambiguousCount = ambiguousWords.filter(word => 
      question.toLowerCase().includes(word)
    ).length;
    score -= ambiguousCount * 0.1;
    
    return Math.max(0, Math.min(1, score));
  }
  
  private assessQuestionDifficultyAlignment(question: EnhancedQuestion): number {
    const bloomsLevel = ENHANCED_BLOOMS_FRAMEWORK[question.bloomsLevel];
    const expectedCognitiveLoad = bloomsLevel.cognitiveLoad;
    
    // QuestionDifficulty should align with cognitive load
    const difficultyMap = { easy: 1, medium: 3, hard: 5 };
    const actualQuestionDifficulty = difficultyMap[question.difficulty];
    
    const alignment = 1 - Math.abs(expectedCognitiveLoad - actualQuestionDifficulty) / 5;
    return Math.max(0, alignment);
  }
}

export default AdvancedQuestionGenerator;