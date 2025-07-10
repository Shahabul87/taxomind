/**
 * Advanced Question Quality Validation System
 * 
 * This module provides comprehensive validation for exam questions,
 * ensuring they meet pedagogical standards and align with Bloom's taxonomy.
 */

import { BloomsLevel, QuestionType } from '@prisma/client';
import { ENHANCED_BLOOMS_FRAMEWORK, EnhancedQuestion, QuestionValidation } from './ai-question-generator';

export interface ValidationCriteria {
  bloomsAlignment: number; // 0-1 score
  clarityScore: number; // 0-1 score
  difficultyAlignment: number; // 0-1 score
  cognitiveLoadAppropriate: boolean;
  grammarScore: number; // 0-1 score
  biasScore: number; // 0-1 score (lower is better)
  accessibility: number; // 0-1 score
}

export interface DetailedValidationResult extends QuestionValidation {
  criteria: ValidationCriteria;
  overallScore: number; // 0-100
  qualityLevel: 'poor' | 'fair' | 'good' | 'excellent';
  specificIssues: ValidationIssue[];
  improvementSuggestions: ImprovementSuggestion[];
}

export interface ValidationIssue {
  type: 'critical' | 'warning' | 'suggestion';
  category: 'blooms' | 'clarity' | 'difficulty' | 'grammar' | 'bias' | 'accessibility';
  message: string;
  impact: number; // 0-1 impact on overall quality
}

export interface ImprovementSuggestion {
  category: string;
  suggestion: string;
  example?: string;
  priority: 'high' | 'medium' | 'low';
}

// Bloom's level action verbs for validation
const BLOOMS_ACTION_VERBS = {
  REMEMBER: [
    'define', 'describe', 'identify', 'label', 'list', 'match', 'name', 'recall', 
    'recognize', 'reproduce', 'select', 'state', 'who', 'what', 'when', 'where'
  ],
  UNDERSTAND: [
    'classify', 'compare', 'contrast', 'demonstrate', 'explain', 'extend', 
    'illustrate', 'infer', 'interpret', 'outline', 'relate', 'rephrase', 
    'show', 'summarize', 'translate', 'why', 'how'
  ],
  APPLY: [
    'apply', 'build', 'choose', 'construct', 'develop', 'experiment', 'identify',
    'interview', 'make use of', 'model', 'organize', 'plan', 'select', 'solve',
    'utilize', 'what would happen if'
  ],
  ANALYZE: [
    'analyze', 'break down', 'compare', 'contrast', 'diagram', 'differentiate',
    'discriminate', 'distinguish', 'examine', 'experiment', 'identify', 'illustrate',
    'infer', 'outline', 'relate', 'select', 'separate', 'what evidence'
  ],
  EVALUATE: [
    'appraise', 'argue', 'assess', 'attach', 'choose', 'compare', 'defend',
    'estimate', 'evaluate', 'judge', 'predict', 'rate', 'score', 'select',
    'support', 'value', 'which is better', 'justify'
  ],
  CREATE: [
    'adapt', 'build', 'change', 'choose', 'combine', 'compile', 'compose',
    'construct', 'create', 'delete', 'design', 'develop', 'discuss', 'elaborate',
    'estimate', 'formulate', 'happen', 'imagine', 'improve', 'invent', 'make up',
    'maximize', 'minimize', 'modify', 'original', 'plan', 'predict', 'propose',
    'solve', 'suppose', 'test', 'theory'
  ]
};

// Common ambiguous words that reduce clarity
const AMBIGUOUS_WORDS = [
  'some', 'many', 'few', 'several', 'often', 'sometimes', 'usually', 'frequently',
  'occasionally', 'rarely', 'seldom', 'most', 'least', 'better', 'worse',
  'good', 'bad', 'big', 'small', 'long', 'short', 'easy', 'hard'
];

// Potentially biased language patterns
const BIAS_PATTERNS = [
  // Gender bias
  /\b(he|his|him)\b(?!\s+(or|\/)\s+(she|her))/gi,
  /\bmankind\b/gi,
  /\bmanpower\b/gi,
  
  // Cultural bias
  /\bamerican\s+way\b/gi,
  /\bwestern\s+civilization\b/gi,
  
  // Ability bias
  /\bnormal\s+person\b/gi,
  /\bhandicapped\b/gi,
  
  // Age bias
  /\bold\s+people\b/gi,
  /\byoung\s+people\b/gi
];

export class QuestionValidator {
  private static instance: QuestionValidator;
  
  private constructor() {}
  
  public static getInstance(): QuestionValidator {
    if (!QuestionValidator.instance) {
      QuestionValidator.instance = new QuestionValidator();
    }
    return QuestionValidator.instance;
  }
  
  /**
   * Comprehensive question validation
   */
  public validateQuestion(question: EnhancedQuestion | any): DetailedValidationResult {
    const criteria = this.assessValidationCriteria(question);
    const issues = this.identifyIssues(question, criteria);
    const suggestions = this.generateImprovementSuggestions(question, criteria, issues);
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(criteria);
    const qualityLevel = this.determineQualityLevel(overallScore);
    
    // Determine if question is valid (passing threshold)
    const isValid = overallScore >= 70 && criteria.bloomsAlignment >= 0.6;
    
    return {
      isValid,
      bloomsAlignment: criteria.bloomsAlignment,
      cognitiveLoadAppropriate: criteria.cognitiveLoadAppropriate,
      clarityScore: criteria.clarityScore,
      difficultyAlignment: criteria.difficultyAlignment,
      suggestions: suggestions.map(s => s.suggestion),
      pedagogicalWarnings: issues.filter(i => i.type === 'critical').map(i => i.message),
      criteria,
      overallScore,
      qualityLevel,
      specificIssues: issues,
      improvementSuggestions: suggestions
    };
  }
  
  /**
   * Assess all validation criteria
   */
  private assessValidationCriteria(question: any): ValidationCriteria {
    return {
      bloomsAlignment: this.assessBloomsAlignment(question),
      clarityScore: this.assessClarity(question),
      difficultyAlignment: this.assessDifficultyAlignment(question),
      cognitiveLoadAppropriate: this.assessCognitiveLoad(question),
      grammarScore: this.assessGrammar(question),
      biasScore: this.assessBias(question),
      accessibility: this.assessAccessibility(question)
    };
  }
  
  /**
   * Assess Bloom's taxonomy alignment
   */
  private assessBloomsAlignment(question: any): number {
    if (!question.bloomsLevel || !question.question) return 0;
    
    const targetLevel = question.bloomsLevel as BloomsLevel;
    const questionText = question.question.toLowerCase();
    const expectedVerbs = BLOOMS_ACTION_VERBS[targetLevel] || [];
    
    // Check for appropriate action verbs
    let verbScore = 0;
    const foundVerbs = expectedVerbs.filter(verb => 
      questionText.includes(verb.toLowerCase())
    );
    verbScore = Math.min(1, foundVerbs.length / 3);
    
    // Check question type appropriateness
    const framework = ENHANCED_BLOOMS_FRAMEWORK[targetLevel];
    let typeScore = 0;
    if (framework.typicalQuestionTypes.includes(question.questionType)) {
      typeScore = 1;
    } else {
      typeScore = 0.5; // Partial credit for unusual but potentially valid combinations
    }
    
    // Check cognitive complexity in question structure
    let complexityScore = this.assessCognitiveComplexity(questionText, targetLevel);
    
    // Weighted average
    return (verbScore * 0.4 + typeScore * 0.3 + complexityScore * 0.3);
  }
  
  /**
   * Assess cognitive complexity of question text
   */
  private assessCognitiveComplexity(questionText: string, targetLevel: BloomsLevel): number {
    const text = questionText.toLowerCase();
    
    // Complexity indicators for each level
    const complexityIndicators = {
      REMEMBER: ['what is', 'who is', 'when did', 'where is', 'which', 'define'],
      UNDERSTAND: ['explain', 'why', 'how', 'what does this mean', 'in your own words'],
      APPLY: ['solve', 'use', 'apply', 'demonstrate', 'show how', 'given'],
      ANALYZE: ['compare', 'contrast', 'analyze', 'examine', 'what evidence', 'relationship'],
      EVALUATE: ['evaluate', 'assess', 'judge', 'critique', 'recommend', 'justify'],
      CREATE: ['design', 'create', 'develop', 'propose', 'formulate', 'construct']
    };
    
    const indicators = complexityIndicators[targetLevel] || [];
    const foundIndicators = indicators.filter(indicator => text.includes(indicator));
    
    return Math.min(1, foundIndicators.length / Math.max(1, indicators.length * 0.3));
  }
  
  /**
   * Assess question clarity
   */
  private assessClarity(question: any): number {
    const questionText = question.question || '';
    let score = 1.0;
    
    // Check length (too short or too long reduces clarity)
    if (questionText.length < 15) score -= 0.3;
    if (questionText.length > 500) score -= 0.2;
    
    // Check for question marks
    if (!questionText.includes('?') && !questionText.toLowerCase().includes('which')) {
      score -= 0.1;
    }
    
    // Check for ambiguous words
    const ambiguousCount = AMBIGUOUS_WORDS.filter(word => 
      questionText.toLowerCase().includes(word)
    ).length;
    score -= ambiguousCount * 0.1;
    
    // Check for multiple questions in one
    const questionCount = (questionText.match(/\?/g) || []).length;
    if (questionCount > 1) score -= 0.2;
    
    // Check for clear instruction verbs
    const hasInstructionVerb = /\b(define|explain|describe|analyze|evaluate|create|solve|identify|compare)\b/i.test(questionText);
    if (!hasInstructionVerb) score -= 0.15;
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Assess difficulty alignment
   */
  private assessDifficultyAlignment(question: any): number {
    if (!question.bloomsLevel || !question.difficulty) return 0.5;
    
    const framework = ENHANCED_BLOOMS_FRAMEWORK[question.bloomsLevel as BloomsLevel];
    const expectedCognitiveLoad = framework.cognitiveLoad;
    
    const difficultyMap = { easy: 1, medium: 3, hard: 5 };
    const actualDifficulty = difficultyMap[question.difficulty as keyof typeof difficultyMap];
    
    if (!actualDifficulty) return 0;
    
    // Calculate alignment score
    const difference = Math.abs(expectedCognitiveLoad - actualDifficulty);
    return Math.max(0, 1 - (difference / 4));
  }
  
  /**
   * Assess cognitive load appropriateness
   */
  private assessCognitiveLoad(question: any): boolean {
    if (!question.bloomsLevel) return false;
    
    const framework = ENHANCED_BLOOMS_FRAMEWORK[question.bloomsLevel as BloomsLevel];
    const maxExpectedLoad = framework.cognitiveLoad;
    const actualLoad = question.cognitiveLoad || maxExpectedLoad;
    
    return actualLoad <= maxExpectedLoad + 1; // Allow slight flexibility
  }
  
  /**
   * Assess grammar quality (basic checks)
   */
  private assessGrammar(question: any): number {
    const text = question.question || '';
    let score = 1.0;
    
    // Check for common grammar issues
    if (text.includes('  ')) score -= 0.1; // Double spaces
    if (!/^[A-Z]/.test(text.trim())) score -= 0.1; // Should start with capital
    if (text.includes('??')) score -= 0.2; // Double question marks
    if (/\b(your|you're)\b.*\b(your|you're)\b/i.test(text)) score -= 0.1; // Repeated words
    
    return Math.max(0, score);
  }
  
  /**
   * Assess potential bias
   */
  private assessBias(question: any): number {
    const text = question.question || '';
    let biasCount = 0;
    
    // Check for bias patterns
    BIAS_PATTERNS.forEach(pattern => {
      if (pattern.test(text)) biasCount++;
    });
    
    // Return bias score (0 = no bias, 1 = high bias)
    return Math.min(1, biasCount * 0.3);
  }
  
  /**
   * Assess accessibility
   */
  private assessAccessibility(question: any): number {
    const text = question.question || '';
    let score = 1.0;
    
    // Check for overly complex vocabulary
    const complexWords = text.split(' ').filter(word => word.length > 12);
    if (complexWords.length > 3) score -= 0.2;
    
    // Check for clear structure
    if (!text.includes('?') && !text.includes(':')) score -= 0.1;
    
    // Check for cultural references that might be exclusive
    const culturalRefs = ['american', 'western', 'christmas', 'halloween'];
    const foundRefs = culturalRefs.filter(ref => 
      text.toLowerCase().includes(ref)
    ).length;
    score -= foundRefs * 0.1;
    
    return Math.max(0, score);
  }
  
  /**
   * Identify specific issues
   */
  private identifyIssues(question: any, criteria: ValidationCriteria): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Bloom's alignment issues
    if (criteria.bloomsAlignment < 0.3) {
      issues.push({
        type: 'critical',
        category: 'blooms',
        message: `Question doesn't align with ${question.bloomsLevel} cognitive level`,
        impact: 0.4
      });
    } else if (criteria.bloomsAlignment < 0.6) {
      issues.push({
        type: 'warning',
        category: 'blooms',
        message: `Weak alignment with ${question.bloomsLevel} cognitive level`,
        impact: 0.2
      });
    }
    
    // Clarity issues
    if (criteria.clarityScore < 0.5) {
      issues.push({
        type: 'critical',
        category: 'clarity',
        message: 'Question is unclear or ambiguous',
        impact: 0.3
      });
    } else if (criteria.clarityScore < 0.7) {
      issues.push({
        type: 'warning',
        category: 'clarity',
        message: 'Question could be clearer',
        impact: 0.15
      });
    }
    
    // Difficulty alignment issues
    if (criteria.difficultyAlignment < 0.5) {
      issues.push({
        type: 'warning',
        category: 'difficulty',
        message: 'Difficulty level doesn\'t match cognitive complexity',
        impact: 0.2
      });
    }
    
    // Cognitive load issues
    if (!criteria.cognitiveLoadAppropriate) {
      issues.push({
        type: 'warning',
        category: 'blooms',
        message: 'Cognitive load exceeds level expectations',
        impact: 0.15
      });
    }
    
    // Bias issues
    if (criteria.biasScore > 0.3) {
      issues.push({
        type: 'warning',
        category: 'bias',
        message: 'Question may contain biased language',
        impact: 0.25
      });
    }
    
    // Accessibility issues
    if (criteria.accessibility < 0.6) {
      issues.push({
        type: 'suggestion',
        category: 'accessibility',
        message: 'Question could be more accessible to diverse learners',
        impact: 0.1
      });
    }
    
    return issues;
  }
  
  /**
   * Generate improvement suggestions
   */
  private generateImprovementSuggestions(
    question: any, 
    criteria: ValidationCriteria, 
    issues: ValidationIssue[]
  ): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Bloom's alignment suggestions
    if (criteria.bloomsAlignment < 0.6) {
      const framework = ENHANCED_BLOOMS_FRAMEWORK[question.bloomsLevel as BloomsLevel];
      suggestions.push({
        category: 'Bloom\'s Taxonomy',
        suggestion: `Use appropriate action verbs for ${question.bloomsLevel} level`,
        example: `Try verbs like: ${framework.verbs.slice(0, 3).join(', ')}`,
        priority: 'high'
      });
    }
    
    // Clarity suggestions
    if (criteria.clarityScore < 0.7) {
      suggestions.push({
        category: 'Clarity',
        suggestion: 'Make the question more specific and unambiguous',
        example: 'Avoid words like "some", "many", "often" - use specific quantities or clear criteria',
        priority: 'high'
      });
    }
    
    // Grammar suggestions
    if (criteria.grammarScore < 0.8) {
      suggestions.push({
        category: 'Grammar',
        suggestion: 'Review grammar and sentence structure',
        example: 'Ensure proper capitalization, punctuation, and sentence flow',
        priority: 'medium'
      });
    }
    
    // Bias suggestions
    if (criteria.biasScore > 0.2) {
      suggestions.push({
        category: 'Inclusivity',
        suggestion: 'Use more inclusive language',
        example: 'Replace gendered pronouns with "they/them" or use job titles instead',
        priority: 'medium'
      });
    }
    
    // Accessibility suggestions
    if (criteria.accessibility < 0.7) {
      suggestions.push({
        category: 'Accessibility',
        suggestion: 'Simplify language for broader accessibility',
        example: 'Use shorter sentences and common vocabulary where possible',
        priority: 'low'
      });
    }
    
    return suggestions;
  }
  
  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(criteria: ValidationCriteria): number {
    const weights = {
      bloomsAlignment: 0.3,
      clarityScore: 0.25,
      difficultyAlignment: 0.15,
      cognitiveLoad: 0.1,
      grammarScore: 0.1,
      biasScore: 0.05, // Negative impact
      accessibility: 0.05
    };
    
    const score = 
      criteria.bloomsAlignment * weights.bloomsAlignment +
      criteria.clarityScore * weights.clarityScore +
      criteria.difficultyAlignment * weights.difficultyAlignment +
      (criteria.cognitiveLoadAppropriate ? 1 : 0) * weights.cognitiveLoad +
      criteria.grammarScore * weights.grammarScore +
      (1 - criteria.biasScore) * weights.biasScore + // Invert bias score
      criteria.accessibility * weights.accessibility;
    
    return Math.round(score * 100);
  }
  
  /**
   * Determine quality level
   */
  private determineQualityLevel(score: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    return 'poor';
  }
  
  /**
   * Batch validate multiple questions
   */
  public validateQuestions(questions: any[]): DetailedValidationResult[] {
    return questions.map(question => this.validateQuestion(question));
  }
  
  /**
   * Get validation summary for a set of questions
   */
  public getValidationSummary(validationResults: DetailedValidationResult[]): {
    overallScore: number;
    validQuestions: number;
    totalQuestions: number;
    qualityDistribution: Record<string, number>;
    commonIssues: string[];
  } {
    const totalQuestions = validationResults.length;
    const validQuestions = validationResults.filter(r => r.isValid).length;
    const averageScore = validationResults.reduce((sum, r) => sum + r.overallScore, 0) / totalQuestions;
    
    const qualityDistribution = validationResults.reduce((dist, result) => {
      dist[result.qualityLevel] = (dist[result.qualityLevel] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);
    
    // Find most common issues
    const allIssues = validationResults.flatMap(r => r.specificIssues);
    const issueFrequency = allIssues.reduce((freq, issue) => {
      freq[issue.message] = (freq[issue.message] || 0) + 1;
      return freq;
    }, {} as Record<string, number>);
    
    const commonIssues = Object.entries(issueFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);
    
    return {
      overallScore: Math.round(averageScore),
      validQuestions,
      totalQuestions,
      qualityDistribution,
      commonIssues
    };
  }
}

export default QuestionValidator;