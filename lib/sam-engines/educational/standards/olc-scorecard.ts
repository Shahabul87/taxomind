/**
 * OLC Quality Scorecard for Online Programs
 * Online Learning Consortium Standards Implementation
 *
 * Citation: Online Learning Consortium. (2020). OLC Quality Scorecard Suite.
 * URL: https://onlinelearningconsortium.org/consult/olc-quality-scorecard-suite/
 *
 * Scoring Levels:
 * - 0: Deficient - No evidence
 * - 1: Developing - Minimal evidence
 * - 2: Accomplished - Adequate evidence
 * - 3: Exemplary - Comprehensive evidence
 */

import type { CourseAnalysisInput } from '../analyzers/deterministic-rubric-engine';

// ═══════════════════════════════════════════════════════════════
// OLC TYPES AND INTERFACES
// ═══════════════════════════════════════════════════════════════

export type OLCCategory =
  | 'CourseDevelopment'
  | 'CourseStructure'
  | 'TeachingAndLearning'
  | 'LearnerSupport'
  | 'EvaluationAndAssessment'
  | 'AccessibilityAndUsability';

export interface OLCIndicator {
  id: string;
  category: OLCCategory;
  indicator: string;
  scoringLevels: {
    0: string; // Deficient
    1: string; // Developing
    2: string; // Accomplished
    3: string; // Exemplary
  };
  evidence: string[];
  automatedEvaluation: boolean;
}

export interface OLCIndicatorResult {
  indicatorId: string;
  category: OLCCategory;
  score: 0 | 1 | 2 | 3;
  levelDescription: string;
  notes?: string;
  evidence?: string[];
}

export interface OLCEvaluationResult {
  overallScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  qualityLevel: 'Deficient' | 'Developing' | 'Accomplished' | 'Exemplary';
  categoryScores: Record<OLCCategory, { earned: number; max: number; percentage: number }>;
  indicatorResults: OLCIndicatorResult[];
  strengths: string[];
  areasForImprovement: string[];
  recommendations: OLCRecommendation[];
  timestamp: string;
}

export interface OLCRecommendation {
  indicatorId: string;
  category: OLCCategory;
  priority: 'critical' | 'high' | 'medium' | 'low';
  currentLevel: string;
  targetLevel: string;
  actionSteps: string[];
}

// ═══════════════════════════════════════════════════════════════
// OLC INDICATORS DEFINITION
// ═══════════════════════════════════════════════════════════════

export const OLC_INDICATORS: OLCIndicator[] = [
  // ─────────────────────────────────────────────────────────────
  // Course Development
  // ─────────────────────────────────────────────────────────────
  {
    id: 'CD-1',
    category: 'CourseDevelopment',
    indicator: 'Course development is guided by an instructional design model.',
    scoringLevels: {
      0: 'No evidence of instructional design',
      1: 'Basic structure present',
      2: 'Clear learning objectives and assessments aligned',
      3: 'Full backward design with Bloom\'s Taxonomy integration',
    },
    evidence: [
      'Learning objectives follow Bloom\'s Taxonomy',
      'Backward design principles applied',
      'Clear alignment between objectives, activities, assessments',
    ],
    automatedEvaluation: true,
  },
  {
    id: 'CD-2',
    category: 'CourseDevelopment',
    indicator: 'Learning objectives describe measurable outcomes.',
    scoringLevels: {
      0: 'Objectives missing or not measurable',
      1: 'Some objectives are measurable',
      2: 'Most objectives are measurable',
      3: 'All objectives are measurable with SMART criteria',
    },
    evidence: [
      'All objectives use action verbs',
      'Outcomes can be assessed',
      'SMART criteria applied',
    ],
    automatedEvaluation: true,
  },
  {
    id: 'CD-3',
    category: 'CourseDevelopment',
    indicator: 'Course is designed to encourage active learning.',
    scoringLevels: {
      0: 'Passive content delivery only',
      1: 'Limited interactive elements',
      2: 'Multiple opportunities for active learning',
      3: 'Comprehensive active learning strategy throughout',
    },
    evidence: [
      'Interactive assessments',
      'Hands-on activities',
      'Discussion opportunities',
      'Project-based learning',
    ],
    automatedEvaluation: true,
  },
  {
    id: 'CD-4',
    category: 'CourseDevelopment',
    indicator: 'Course includes variety of instructional materials.',
    scoringLevels: {
      0: 'Single format only',
      1: 'Two different formats',
      2: 'Multiple formats with good variety',
      3: 'Comprehensive multimedia approach',
    },
    evidence: [
      'Video content',
      'Text materials',
      'Interactive elements',
      'Supplementary resources',
    ],
    automatedEvaluation: true,
  },
  {
    id: 'CD-5',
    category: 'CourseDevelopment',
    indicator: 'Course applies principles of cognitive load management.',
    scoringLevels: {
      0: 'Overwhelming content structure',
      1: 'Basic chunking applied',
      2: 'Well-organized content with clear progression',
      3: 'Optimal cognitive load design with scaffolding',
    },
    evidence: [
      'Content chunked appropriately',
      'Clear learning progression',
      'Scaffolded complexity',
    ],
    automatedEvaluation: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Course Structure
  // ─────────────────────────────────────────────────────────────
  {
    id: 'CS-1',
    category: 'CourseStructure',
    indicator: 'Course is organized into logical modules or units.',
    scoringLevels: {
      0: 'No organization evident',
      1: 'Basic organization',
      2: 'Clear modular structure',
      3: 'Exemplary organization with learning pathways',
    },
    evidence: [
      'Chapters/modules present',
      'Logical sequence',
      'Clear navigation',
    ],
    automatedEvaluation: true,
  },
  {
    id: 'CS-2',
    category: 'CourseStructure',
    indicator: 'Course content is chunked into manageable segments.',
    scoringLevels: {
      0: 'Monolithic content blocks',
      1: 'Some chunking evident',
      2: 'Appropriate content segments',
      3: 'Optimal micro-learning structure',
    },
    evidence: [
      'Sections within chapters',
      'Manageable lesson lengths',
      'Clear topic boundaries',
    ],
    automatedEvaluation: true,
  },
  {
    id: 'CS-3',
    category: 'CourseStructure',
    indicator: 'Course components are consistent in structure.',
    scoringLevels: {
      0: 'Inconsistent structure throughout',
      1: 'Some consistency',
      2: 'Mostly consistent structure',
      3: 'Highly consistent and predictable structure',
    },
    evidence: [
      'Consistent chapter format',
      'Predictable section layout',
      'Uniform naming conventions',
    ],
    automatedEvaluation: true,
  },
  {
    id: 'CS-4',
    category: 'CourseStructure',
    indicator: 'Course includes clear introduction and overview.',
    scoringLevels: {
      0: 'No introduction or overview',
      1: 'Basic title only',
      2: 'Description with overview',
      3: 'Comprehensive introduction with goals and expectations',
    },
    evidence: [
      'Course description present',
      'Learning objectives stated',
      'Course structure outlined',
    ],
    automatedEvaluation: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Teaching and Learning
  // ─────────────────────────────────────────────────────────────
  {
    id: 'TL-1',
    category: 'TeachingAndLearning',
    indicator: 'Learning objectives are appropriate to the course level.',
    scoringLevels: {
      0: 'Objectives do not match course level',
      1: 'Some alignment with course level',
      2: 'Good alignment with appropriate challenge',
      3: 'Excellent alignment with progressive complexity',
    },
    evidence: [
      'Bloom\'s levels appropriate',
      'Progressive difficulty',
      'Suitable for target audience',
    ],
    automatedEvaluation: true,
  },
  {
    id: 'TL-2',
    category: 'TeachingAndLearning',
    indicator: 'Course uses varied instructional methods.',
    scoringLevels: {
      0: 'Single instructional method',
      1: 'Two methods used',
      2: 'Multiple methods with variety',
      3: 'Comprehensive multimodal instruction',
    },
    evidence: [
      'Different content types',
      'Various learning activities',
      'Multiple engagement strategies',
    ],
    automatedEvaluation: true,
  },
  {
    id: 'TL-3',
    category: 'TeachingAndLearning',
    indicator: 'Course provides opportunities for practice and application.',
    scoringLevels: {
      0: 'No practice opportunities',
      1: 'Minimal practice activities',
      2: 'Regular practice opportunities',
      3: 'Extensive practice with real-world application',
    },
    evidence: [
      'Practice assessments',
      'Application exercises',
      'Hands-on activities',
    ],
    automatedEvaluation: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Evaluation and Assessment
  // ─────────────────────────────────────────────────────────────
  {
    id: 'EA-1',
    category: 'EvaluationAndAssessment',
    indicator: 'Assessments align with learning objectives.',
    scoringLevels: {
      0: 'No alignment evident',
      1: 'Partial alignment',
      2: 'Good alignment for most objectives',
      3: 'Complete alignment with all objectives assessed',
    },
    evidence: [
      'Assessment-objective mapping',
      'Coverage of all objectives',
      'Appropriate assessment methods',
    ],
    automatedEvaluation: true,
  },
  {
    id: 'EA-2',
    category: 'EvaluationAndAssessment',
    indicator: 'Course includes variety of assessment types.',
    scoringLevels: {
      0: 'Single assessment type',
      1: 'Two assessment types',
      2: 'Multiple assessment types',
      3: 'Comprehensive assessment strategy',
    },
    evidence: [
      'Quizzes',
      'Projects/Assignments',
      'Practical assessments',
      'Formative and summative',
    ],
    automatedEvaluation: true,
  },
  {
    id: 'EA-3',
    category: 'EvaluationAndAssessment',
    indicator: 'Formative assessments provide feedback for improvement.',
    scoringLevels: {
      0: 'No formative assessments',
      1: 'Formative assessments without feedback',
      2: 'Formative assessments with basic feedback',
      3: 'Comprehensive formative assessment with detailed feedback',
    },
    evidence: [
      'Practice quizzes',
      'Immediate feedback',
      'Explanations provided',
    ],
    automatedEvaluation: true,
  },
  {
    id: 'EA-4',
    category: 'EvaluationAndAssessment',
    indicator: 'Clear criteria provided for assessments.',
    scoringLevels: {
      0: 'No criteria provided',
      1: 'Basic criteria mentioned',
      2: 'Clear criteria for most assessments',
      3: 'Detailed rubrics and criteria for all assessments',
    },
    evidence: [
      'Question explanations',
      'Scoring criteria',
      'Expected outcomes',
    ],
    automatedEvaluation: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Accessibility and Usability
  // ─────────────────────────────────────────────────────────────
  {
    id: 'AU-1',
    category: 'AccessibilityAndUsability',
    indicator: 'Course navigation is intuitive and consistent.',
    scoringLevels: {
      0: 'Confusing navigation',
      1: 'Basic navigation',
      2: 'Clear and consistent navigation',
      3: 'Intuitive navigation with multiple pathways',
    },
    evidence: [
      'Clear structure',
      'Consistent layout',
      'Logical flow',
    ],
    automatedEvaluation: true,
  },
  {
    id: 'AU-2',
    category: 'AccessibilityAndUsability',
    indicator: 'Course provides accessible multimedia content.',
    scoringLevels: {
      0: 'Multimedia not accessible',
      1: 'Some accessibility features',
      2: 'Most content accessible',
      3: 'Fully accessible with multiple formats',
    },
    evidence: [
      'Video content present',
      'Alternative formats',
      'Accessible design',
    ],
    automatedEvaluation: true,
  },
  {
    id: 'AU-3',
    category: 'AccessibilityAndUsability',
    indicator: 'Content is readable and well-formatted.',
    scoringLevels: {
      0: 'Poor formatting and readability',
      1: 'Basic formatting',
      2: 'Good readability',
      3: 'Excellent formatting with visual hierarchy',
    },
    evidence: [
      'Clear descriptions',
      'Organized content',
      'Professional presentation',
    ],
    automatedEvaluation: true,
  },
];

// ═══════════════════════════════════════════════════════════════
// OLC EVALUATOR CLASS
// ═══════════════════════════════════════════════════════════════

export class OLCEvaluator {
  private readonly VERSION = '1.0.0';

  /**
   * Evaluate course against OLC Quality Scorecard
   */
  evaluate(courseData: CourseAnalysisInput): OLCEvaluationResult {
    const results: OLCIndicatorResult[] = [];
    let totalEarned = 0;
    let totalMax = 0;

    // Initialize category scores
    const categoryScores: Record<OLCCategory, { earned: number; max: number; percentage: number }> = {
      'CourseDevelopment': { earned: 0, max: 0, percentage: 0 },
      'CourseStructure': { earned: 0, max: 0, percentage: 0 },
      'TeachingAndLearning': { earned: 0, max: 0, percentage: 0 },
      'LearnerSupport': { earned: 0, max: 0, percentage: 0 },
      'EvaluationAndAssessment': { earned: 0, max: 0, percentage: 0 },
      'AccessibilityAndUsability': { earned: 0, max: 0, percentage: 0 },
    };

    // Evaluate each indicator
    for (const indicator of OLC_INDICATORS) {
      const result = indicator.automatedEvaluation
        ? this.evaluateIndicator(indicator, courseData)
        : this.createManualReviewResult(indicator);

      results.push(result);

      totalEarned += result.score;
      totalMax += 3; // Max score per indicator is 3

      // Update category scores
      const cat = categoryScores[indicator.category];
      cat.earned += result.score;
      cat.max += 3;
    }

    // Calculate category percentages
    for (const cat of Object.values(categoryScores)) {
      cat.percentage = cat.max > 0 ? Math.round((cat.earned / cat.max) * 100) : 0;
    }

    const percentageScore = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
    const qualityLevel = this.determineQualityLevel(percentageScore);

    // Generate strengths and areas for improvement
    const strengths = this.identifyStrengths(results);
    const areasForImprovement = this.identifyAreasForImprovement(results);
    const recommendations = this.generateRecommendations(results);

    return {
      overallScore: totalEarned,
      maxPossibleScore: totalMax,
      percentageScore,
      qualityLevel,
      categoryScores,
      indicatorResults: results,
      strengths,
      areasForImprovement,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get OLC evaluator version
   */
  getVersion(): string {
    return this.VERSION;
  }

  /**
   * Get all OLC indicators
   */
  getIndicators(): OLCIndicator[] {
    return [...OLC_INDICATORS];
  }

  // ═══════════════════════════════════════════════════════════════
  // INDIVIDUAL INDICATOR EVALUATORS
  // ═══════════════════════════════════════════════════════════════

  private evaluateIndicator(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    switch (indicator.id) {
      // Course Development
      case 'CD-1':
        return this.evaluateCD1_InstructionalDesign(indicator, data);
      case 'CD-2':
        return this.evaluateCD2_MeasurableObjectives(indicator, data);
      case 'CD-3':
        return this.evaluateCD3_ActiveLearning(indicator, data);
      case 'CD-4':
        return this.evaluateCD4_MaterialVariety(indicator, data);
      case 'CD-5':
        return this.evaluateCD5_CognitiveLoad(indicator, data);

      // Course Structure
      case 'CS-1':
        return this.evaluateCS1_LogicalOrganization(indicator, data);
      case 'CS-2':
        return this.evaluateCS2_ContentChunking(indicator, data);
      case 'CS-3':
        return this.evaluateCS3_Consistency(indicator, data);
      case 'CS-4':
        return this.evaluateCS4_Introduction(indicator, data);

      // Teaching and Learning
      case 'TL-1':
        return this.evaluateTL1_ObjectiveLevel(indicator, data);
      case 'TL-2':
        return this.evaluateTL2_InstructionalMethods(indicator, data);
      case 'TL-3':
        return this.evaluateTL3_PracticeOpportunities(indicator, data);

      // Evaluation and Assessment
      case 'EA-1':
        return this.evaluateEA1_AssessmentAlignment(indicator, data);
      case 'EA-2':
        return this.evaluateEA2_AssessmentVariety(indicator, data);
      case 'EA-3':
        return this.evaluateEA3_FormativeAssessment(indicator, data);
      case 'EA-4':
        return this.evaluateEA4_ClearCriteria(indicator, data);

      // Accessibility and Usability
      case 'AU-1':
        return this.evaluateAU1_Navigation(indicator, data);
      case 'AU-2':
        return this.evaluateAU2_AccessibleMultimedia(indicator, data);
      case 'AU-3':
        return this.evaluateAU3_Readability(indicator, data);

      default:
        return this.createManualReviewResult(indicator);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Course Development Evaluators
  // ─────────────────────────────────────────────────────────────

  private evaluateCD1_InstructionalDesign(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    let score = 0;

    // Check for objectives
    if (data.objectives.length >= 1) score++;

    // Check for activities aligned with objectives
    const totalSections = data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0);
    if (totalSections >= data.objectives.length && data.objectives.length > 0) score++;

    // Check for assessments aligned with objectives
    if (data.assessments.length >= Math.ceil(data.objectives.length * 0.5)) score++;

    return this.createResult(indicator, score as 0 | 1 | 2 | 3);
  }

  private evaluateCD2_MeasurableObjectives(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    const measurablePattern = /\b(define|identify|list|explain|demonstrate|analyze|evaluate|create|design|develop|implement|calculate|compare|apply|solve)\b/gi;

    if (data.objectives.length === 0) {
      return this.createResult(indicator, 0, 'No objectives defined');
    }

    const measurableCount = data.objectives.filter(obj => {
      measurablePattern.lastIndex = 0;
      return measurablePattern.test(obj);
    }).length;

    const ratio = measurableCount / data.objectives.length;

    let score: 0 | 1 | 2 | 3;
    if (ratio >= 0.9) score = 3;
    else if (ratio >= 0.7) score = 2;
    else if (ratio >= 0.4) score = 1;
    else score = 0;

    return this.createResult(indicator, score, `${Math.round(ratio * 100)}% measurable`);
  }

  private evaluateCD3_ActiveLearning(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    let elements = 0;

    // Check for quizzes/interactive assessments
    if (data.assessments.some(a => a.type === 'quiz' || a.type === 'practice')) elements++;

    // Check for projects/assignments
    if (data.assessments.some(a => a.type === 'project' || a.type === 'assignment')) elements++;

    // Check for video content (interactive viewing)
    if (data.chapters.some(ch => ch.sections?.some(s => s.videoUrl))) elements++;

    // Check for multiple assessments (learning progression)
    if (data.assessments.length >= 3) elements++;

    let score: 0 | 1 | 2 | 3;
    if (elements >= 4) score = 3;
    else if (elements >= 3) score = 2;
    else if (elements >= 1) score = 1;
    else score = 0;

    return this.createResult(indicator, score, `${elements} active learning elements`);
  }

  private evaluateCD4_MaterialVariety(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    const formats = new Set<string>();

    if (data.chapters.some(ch => ch.sections?.some(s => s.videoUrl))) formats.add('video');
    if (data.chapters.some(ch => ch.sections?.some(s => s.description && s.description.length > 50))) formats.add('text');
    if ((data.attachments?.length ?? 0) > 0) formats.add('attachments');
    if (data.assessments.length > 0) formats.add('assessments');
    if (data.description && data.description.length > 100) formats.add('introduction');

    let score: 0 | 1 | 2 | 3;
    if (formats.size >= 4) score = 3;
    else if (formats.size >= 3) score = 2;
    else if (formats.size >= 2) score = 1;
    else score = 0;

    return this.createResult(indicator, score, `${formats.size} material types`, Array.from(formats));
  }

  private evaluateCD5_CognitiveLoad(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    // Check content chunking
    const avgSectionsPerChapter = data.chapters.length > 0
      ? data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0) / data.chapters.length
      : 0;

    let score = 0;

    // Good chunking: 2-5 sections per chapter
    if (avgSectionsPerChapter >= 2 && avgSectionsPerChapter <= 5) score++;

    // Chapters have outcomes (scaffolding)
    const chaptersWithOutcomes = data.chapters.filter(ch => ch.learningOutcome && ch.learningOutcome.length > 10).length;
    if (chaptersWithOutcomes >= data.chapters.length * 0.5) score++;

    // Progressive structure (chapters exist)
    if (data.chapters.length >= 3) score++;

    return this.createResult(indicator, Math.min(score, 3) as 0 | 1 | 2 | 3);
  }

  // ─────────────────────────────────────────────────────────────
  // Course Structure Evaluators
  // ─────────────────────────────────────────────────────────────

  private evaluateCS1_LogicalOrganization(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    let score = 0;

    if (data.chapters.length >= 1) score++;
    if (data.chapters.length >= 3) score++;
    if (data.chapters.every(ch => ch.title && ch.title.length > 3)) score++;

    return this.createResult(indicator, Math.min(score, 3) as 0 | 1 | 2 | 3);
  }

  private evaluateCS2_ContentChunking(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    const totalSections = data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0);

    let score: 0 | 1 | 2 | 3;
    if (totalSections >= data.chapters.length * 2 && data.chapters.length >= 3) score = 3;
    else if (totalSections >= data.chapters.length) score = 2;
    else if (totalSections >= 1) score = 1;
    else score = 0;

    return this.createResult(indicator, score, `${totalSections} sections across ${data.chapters.length} chapters`);
  }

  private evaluateCS3_Consistency(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    if (data.chapters.length < 2) {
      return this.createResult(indicator, 1, 'Not enough chapters to evaluate consistency');
    }

    const sectionCounts = data.chapters.map(ch => ch.sections?.length ?? 0);
    const avg = sectionCounts.reduce((a, b) => a + b, 0) / sectionCounts.length;
    const variance = sectionCounts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / sectionCounts.length;

    let score: 0 | 1 | 2 | 3;
    if (variance < 2) score = 3;
    else if (variance < 4) score = 2;
    else if (variance < 8) score = 1;
    else score = 0;

    return this.createResult(indicator, score, `Variance: ${variance.toFixed(1)}`);
  }

  private evaluateCS4_Introduction(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    let score = 0;

    if (data.title && data.title.length >= 10) score++;
    if (data.description && data.description.length >= 100) score++;
    if (data.objectives.length >= 1) score++;

    return this.createResult(indicator, Math.min(score, 3) as 0 | 1 | 2 | 3);
  }

  // ─────────────────────────────────────────────────────────────
  // Teaching and Learning Evaluators
  // ─────────────────────────────────────────────────────────────

  private evaluateTL1_ObjectiveLevel(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    const bloomsPatterns = {
      'REMEMBER': /\b(define|list|name|recall|identify)\b/gi,
      'UNDERSTAND': /\b(explain|summarize|interpret|classify|compare)\b/gi,
      'APPLY': /\b(apply|demonstrate|solve|use|implement)\b/gi,
      'ANALYZE': /\b(analyze|examine|differentiate|organize)\b/gi,
      'EVALUATE': /\b(evaluate|judge|critique|justify)\b/gi,
      'CREATE': /\b(create|design|develop|formulate|construct)\b/gi,
    };

    const levels = new Set<string>();
    for (const obj of data.objectives) {
      for (const [level, pattern] of Object.entries(bloomsPatterns)) {
        pattern.lastIndex = 0;
        if (pattern.test(obj)) levels.add(level);
      }
    }

    let score: 0 | 1 | 2 | 3;
    if (levels.size >= 4) score = 3;
    else if (levels.size >= 3) score = 2;
    else if (levels.size >= 2) score = 1;
    else score = 0;

    return this.createResult(indicator, score, `${levels.size} Bloom's levels`, Array.from(levels));
  }

  private evaluateTL2_InstructionalMethods(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    const methods = new Set<string>();

    if (data.chapters.some(ch => ch.sections?.some(s => s.videoUrl))) methods.add('video');
    if (data.chapters.some(ch => ch.sections?.some(s => s.description))) methods.add('text');
    if (data.assessments.some(a => a.type === 'quiz')) methods.add('quiz');
    if (data.assessments.some(a => a.type === 'project' || a.type === 'assignment')) methods.add('project');
    if ((data.attachments?.length ?? 0) > 0) methods.add('resources');

    let score: 0 | 1 | 2 | 3;
    if (methods.size >= 4) score = 3;
    else if (methods.size >= 3) score = 2;
    else if (methods.size >= 2) score = 1;
    else score = 0;

    return this.createResult(indicator, score, `${methods.size} methods`, Array.from(methods));
  }

  private evaluateTL3_PracticeOpportunities(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    const practiceCount = data.assessments.filter(
      a => a.type === 'quiz' || a.type === 'practice'
    ).length;

    const projectCount = data.assessments.filter(
      a => a.type === 'project' || a.type === 'assignment'
    ).length;

    const totalPractice = practiceCount + projectCount;

    let score: 0 | 1 | 2 | 3;
    if (totalPractice >= 5) score = 3;
    else if (totalPractice >= 3) score = 2;
    else if (totalPractice >= 1) score = 1;
    else score = 0;

    return this.createResult(indicator, score, `${totalPractice} practice opportunities`);
  }

  // ─────────────────────────────────────────────────────────────
  // Evaluation and Assessment Evaluators
  // ─────────────────────────────────────────────────────────────

  private evaluateEA1_AssessmentAlignment(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    if (data.objectives.length === 0) {
      return this.createResult(indicator, 0, 'No objectives to align with');
    }

    const ratio = data.assessments.length / data.objectives.length;

    let score: 0 | 1 | 2 | 3;
    if (ratio >= 1) score = 3;
    else if (ratio >= 0.5) score = 2;
    else if (ratio >= 0.25) score = 1;
    else score = 0;

    return this.createResult(indicator, score, `${data.assessments.length} assessments for ${data.objectives.length} objectives`);
  }

  private evaluateEA2_AssessmentVariety(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    const types = new Set(data.assessments.map(a => a.type));

    let score: 0 | 1 | 2 | 3;
    if (types.size >= 4) score = 3;
    else if (types.size >= 3) score = 2;
    else if (types.size >= 2) score = 1;
    else score = types.size > 0 ? 1 : 0;

    return this.createResult(indicator, score, `${types.size} assessment types`, Array.from(types));
  }

  private evaluateEA3_FormativeAssessment(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    const formativeAssessments = data.assessments.filter(
      a => a.type === 'quiz' || a.type === 'practice'
    );

    const withFeedback = formativeAssessments.filter(
      a => a.questions?.some(q => q.explanation || q.feedback)
    ).length;

    let score: 0 | 1 | 2 | 3;
    if (withFeedback >= 3) score = 3;
    else if (withFeedback >= 2) score = 2;
    else if (formativeAssessments.length >= 1) score = 1;
    else score = 0;

    return this.createResult(indicator, score, `${withFeedback} assessments with feedback`);
  }

  private evaluateEA4_ClearCriteria(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    const assessmentsWithCriteria = data.assessments.filter(
      a => a.questions?.some(q => q.explanation)
    ).length;

    const ratio = data.assessments.length > 0
      ? assessmentsWithCriteria / data.assessments.length
      : 0;

    let score: 0 | 1 | 2 | 3;
    if (ratio >= 0.8) score = 3;
    else if (ratio >= 0.5) score = 2;
    else if (ratio >= 0.25) score = 1;
    else score = 0;

    return this.createResult(indicator, score, `${Math.round(ratio * 100)}% with criteria`);
  }

  // ─────────────────────────────────────────────────────────────
  // Accessibility and Usability Evaluators
  // ─────────────────────────────────────────────────────────────

  private evaluateAU1_Navigation(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    let score = 0;

    // Clear chapter structure
    if (data.chapters.length >= 1) score++;

    // All chapters titled
    if (data.chapters.every(ch => ch.title && ch.title.length > 3)) score++;

    // Sections present
    const hasSections = data.chapters.some(ch => (ch.sections?.length ?? 0) > 0);
    if (hasSections) score++;

    return this.createResult(indicator, Math.min(score, 3) as 0 | 1 | 2 | 3);
  }

  private evaluateAU2_AccessibleMultimedia(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    const videoCount = data.chapters.reduce(
      (count, ch) => count + (ch.sections?.filter(s => s.videoUrl).length ?? 0),
      0
    );

    const hasTextAlternatives = data.chapters.some(
      ch => ch.sections?.some(s => s.description && s.description.length > 50)
    );

    let score: 0 | 1 | 2 | 3;
    if (videoCount >= 3 && hasTextAlternatives) score = 3;
    else if (videoCount >= 1 && hasTextAlternatives) score = 2;
    else if (videoCount >= 1 || hasTextAlternatives) score = 1;
    else score = 0;

    return this.createResult(indicator, score, `${videoCount} videos, text alternatives: ${hasTextAlternatives}`);
  }

  private evaluateAU3_Readability(indicator: OLCIndicator, data: CourseAnalysisInput): OLCIndicatorResult {
    let score = 0;

    // Course description
    if (data.description && data.description.length >= 100) score++;

    // Chapter outcomes
    const chaptersWithOutcomes = data.chapters.filter(
      ch => ch.learningOutcome && ch.learningOutcome.length > 20
    ).length;
    if (chaptersWithOutcomes >= data.chapters.length * 0.5) score++;

    // Section descriptions
    const sectionsWithDesc = data.chapters.reduce(
      (count, ch) => count + (ch.sections?.filter(s => s.description && s.description.length > 10).length ?? 0),
      0
    );
    if (sectionsWithDesc >= 3) score++;

    return this.createResult(indicator, Math.min(score, 3) as 0 | 1 | 2 | 3);
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════

  private createResult(
    indicator: OLCIndicator,
    score: 0 | 1 | 2 | 3,
    notes?: string,
    evidence?: string[]
  ): OLCIndicatorResult {
    return {
      indicatorId: indicator.id,
      category: indicator.category,
      score,
      levelDescription: indicator.scoringLevels[score],
      notes,
      evidence,
    };
  }

  private createManualReviewResult(indicator: OLCIndicator): OLCIndicatorResult {
    return {
      indicatorId: indicator.id,
      category: indicator.category,
      score: 0,
      levelDescription: 'Manual review required',
      notes: 'This indicator requires manual evaluation',
    };
  }

  private determineQualityLevel(percentage: number): OLCEvaluationResult['qualityLevel'] {
    if (percentage >= 85) return 'Exemplary';
    if (percentage >= 70) return 'Accomplished';
    if (percentage >= 50) return 'Developing';
    return 'Deficient';
  }

  private identifyStrengths(results: OLCIndicatorResult[]): string[] {
    return results
      .filter(r => r.score >= 2)
      .map(r => {
        const indicator = OLC_INDICATORS.find(i => i.id === r.indicatorId);
        return indicator ? `${indicator.indicator} (${r.levelDescription})` : '';
      })
      .filter(s => s.length > 0)
      .slice(0, 5);
  }

  private identifyAreasForImprovement(results: OLCIndicatorResult[]): string[] {
    return results
      .filter(r => r.score <= 1)
      .map(r => {
        const indicator = OLC_INDICATORS.find(i => i.id === r.indicatorId);
        return indicator ? indicator.indicator : '';
      })
      .filter(s => s.length > 0)
      .slice(0, 5);
  }

  private generateRecommendations(results: OLCIndicatorResult[]): OLCRecommendation[] {
    const recommendations: OLCRecommendation[] = [];

    for (const result of results) {
      if (result.score < 3) {
        const indicator = OLC_INDICATORS.find(i => i.id === result.indicatorId);
        if (!indicator) continue;

        const targetScore = Math.min(result.score + 1, 3) as 0 | 1 | 2 | 3;

        recommendations.push({
          indicatorId: indicator.id,
          category: indicator.category,
          priority: result.score === 0 ? 'critical' : result.score === 1 ? 'high' : 'medium',
          currentLevel: indicator.scoringLevels[result.score],
          targetLevel: indicator.scoringLevels[targetScore],
          actionSteps: indicator.evidence,
        });
      }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations.slice(0, 10);
  }
}

// Export singleton instance
export const olcEvaluator = new OLCEvaluator();
