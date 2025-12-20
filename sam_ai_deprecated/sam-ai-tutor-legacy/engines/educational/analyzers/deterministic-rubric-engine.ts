/**
 * Deterministic Rubric Engine
 * Primary analysis engine - replaces LLM-first approach
 *
 * Design Principles:
 * - 100% reproducible results for same input
 * - Explicit rules with documented rationale
 * - Audit trail for every score component
 * - Research-backed scoring criteria
 *
 * Standards Alignment:
 * - Quality Matters Higher Education Rubric (7th Edition)
 * - OLC Quality Scorecard for Online Programs
 * - Bloom's Taxonomy (Anderson & Krathwohl, 2001)
 * - Webb's Depth of Knowledge (Webb, 2002)
 */

import {
  BloomsDistribution,
  WebbDOKDistribution,
  CourseType,
  COURSE_TYPE_PROFILES,
} from '../types/depth-analysis.types';
import { BloomsLevel } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════
// TYPES AND INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface ResearchCitation {
  standard: 'QM' | 'OLC' | 'Research' | 'ISTE';
  id: string;
  description: string;
  fullCitation?: string;
}

export type RubricCategory =
  | 'LearningObjectives'
  | 'Assessment'
  | 'ContentStructure'
  | 'CognitiveDepth'
  | 'Accessibility'
  | 'Engagement';

export interface RubricRule {
  id: string;
  category: RubricCategory;
  name: string;
  condition: (data: CourseAnalysisInput) => boolean;
  score: number;
  maxScore: number;
  weight: number;
  evidence: string;
  recommendation: string;
  source?: ResearchCitation;
}

export interface CourseAnalysisInput {
  courseId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  objectives: string[];
  chapters: ChapterInput[];
  assessments: AssessmentInput[];
  attachments?: AttachmentInput[];
  contentAnalysis?: ContentAnalysisInput;
  courseType?: CourseType;
}

export interface ChapterInput {
  id: string;
  title: string;
  position: number;
  learningOutcome?: string;
  sections?: SectionInput[];
}

export interface SectionInput {
  id: string;
  title: string;
  position: number;
  videoUrl?: string;
  description?: string;
}

export interface AssessmentInput {
  id: string;
  title?: string;
  type: 'quiz' | 'exam' | 'assignment' | 'project' | 'practice' | 'other';
  questions?: QuestionInput[];
}

export interface QuestionInput {
  id: string;
  text: string;
  type?: string;
  difficulty?: number;
  bloomsLevel?: BloomsLevel;
  explanation?: string;
  feedback?: string;
  options?: OptionInput[];
}

export interface OptionInput {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface AttachmentInput {
  id: string;
  name: string;
  url: string;
}

export interface ContentAnalysisInput {
  bloomsDistribution: BloomsDistribution;
  dokDistribution?: WebbDOKDistribution;
}

export interface DeterministicAnalysisResult {
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  categoryScores: Map<RubricCategory, CategoryScore>;
  rulesApplied: RuleResult[];
  analysisMethod: 'deterministic';
  timestamp: string;
  engineVersion: string;
  recommendations: PrioritizedRecommendation[];
  llmEnhanced: boolean;
  llmSuggestions?: string[];
  metadata: AnalysisMetadata;
}

export interface CategoryScore {
  earned: number;
  max: number;
  percentage: number;
  rules: RuleResult[];
}

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  category: RubricCategory;
  passed: boolean;
  score: number;
  maxScore: number;
  evidence: string;
  details?: string;
  source?: ResearchCitation;
}

export interface PrioritizedRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: RubricCategory;
  title: string;
  description: string;
  actionSteps: string[];
  estimatedImpact: number;
  effort: 'low' | 'medium' | 'high';
  source?: ResearchCitation;
}

export interface AnalysisMetadata {
  courseId: string;
  analyzedAt: string;
  objectivesCount: number;
  chaptersCount: number;
  assessmentsCount: number;
  questionsCount: number;
  rulesEvaluated: number;
  rulesPassed: number;
  rulesFailed: number;
}

// ═══════════════════════════════════════════════════════════════
// MEASURABLE VERBS PATTERNS (Bloom's Taxonomy)
// ═══════════════════════════════════════════════════════════════

const MEASURABLE_VERBS_PATTERN =
  /\b(define|identify|list|explain|demonstrate|analyze|evaluate|create|design|develop|implement|calculate|compare|contrast|apply|solve|construct|formulate|assess|critique|interpret|classify|predict|summarize|describe|distinguish|organize|examine|investigate|differentiate|justify|defend|recommend|compose|generate|produce|plan|devise|synthesize|build|author)\b/gi;

const BLOOMS_PATTERNS: Record<BloomsLevel, RegExp> = {
  REMEMBER:
    /\b(define|list|name|recall|identify|recognize|state|match|select|memorize|repeat|label|quote)\b/gi,
  UNDERSTAND:
    /\b(explain|summarize|interpret|paraphrase|classify|compare|contrast|discuss|predict|translate|describe|illustrate|exemplify|distinguish)\b/gi,
  APPLY:
    /\b(apply|demonstrate|solve|use|implement|calculate|execute|practice|compute|show|modify|operate|experiment|complete)\b/gi,
  ANALYZE:
    /\b(analyze|examine|investigate|differentiate|organize|attribute|deconstruct|outline|structure|integrate|categorize|compare|contrast)\b/gi,
  EVALUATE:
    /\b(evaluate|judge|critique|justify|assess|defend|support|argue|prioritize|recommend|rate|validate|appraise|conclude)\b/gi,
  CREATE:
    /\b(create|design|develop|formulate|construct|invent|compose|generate|produce|plan|devise|synthesize|build|author|propose)\b/gi,
};

const LEARNER_CENTERED_PATTERN =
  /\b(you will|learners? will|students? will|be able to|can|will be able|upon completion|by the end)\b/i;

// ═══════════════════════════════════════════════════════════════
// DETERMINISTIC RUBRIC ENGINE CLASS
// ═══════════════════════════════════════════════════════════════

export class DeterministicRubricEngine {
  private readonly VERSION = '1.0.0';
  private rules: RubricRule[];

  constructor() {
    this.rules = this.initializeRules();
  }

  /**
   * Primary analysis method - fully deterministic
   */
  analyze(input: CourseAnalysisInput): DeterministicAnalysisResult {
    const categoryScores = new Map<RubricCategory, CategoryScore>();
    const rulesApplied: RuleResult[] = [];
    const recommendations: PrioritizedRecommendation[] = [];

    let totalEarned = 0;
    let totalMax = 0;
    let rulesPassed = 0;
    let rulesFailed = 0;

    // Initialize category scores
    const categories: RubricCategory[] = [
      'LearningObjectives',
      'Assessment',
      'ContentStructure',
      'CognitiveDepth',
      'Accessibility',
      'Engagement',
    ];

    for (const cat of categories) {
      categoryScores.set(cat, { earned: 0, max: 0, percentage: 0, rules: [] });
    }

    // Apply each rule
    for (const rule of this.rules) {
      const passed = rule.condition(input);
      const earned = passed ? rule.score * rule.weight : 0;
      const max = rule.maxScore * rule.weight;

      totalEarned += earned;
      totalMax += max;

      if (passed) {
        rulesPassed++;
      } else {
        rulesFailed++;
      }

      const result: RuleResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        passed,
        score: earned,
        maxScore: max,
        evidence: passed ? rule.evidence : `NOT MET: ${rule.evidence}`,
        source: rule.source,
      };

      rulesApplied.push(result);

      // Update category score
      const catScore = categoryScores.get(rule.category);
      if (catScore) {
        catScore.earned += earned;
        catScore.max += max;
        catScore.rules.push(result);
      }

      // Add recommendation if rule failed
      if (!passed) {
        recommendations.push({
          priority: this.getPriorityFromWeight(rule.weight),
          category: rule.category,
          title: rule.name,
          description: rule.recommendation,
          actionSteps: this.generateActionSteps(rule),
          estimatedImpact: rule.score * rule.weight,
          effort: this.estimateEffort(rule),
          source: rule.source,
        });
      }
    }

    // Calculate category percentages
    for (const [, score] of categoryScores) {
      score.percentage =
        score.max > 0 ? Math.round((score.earned / score.max) * 100) : 0;
    }

    // Sort recommendations by priority and impact
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.estimatedImpact - a.estimatedImpact;
    });

    // Calculate total questions
    const questionsCount = input.assessments.reduce(
      (sum, a) => sum + (a.questions?.length ?? 0),
      0
    );

    return {
      totalScore: Math.round(totalEarned * 10) / 10,
      maxPossibleScore: Math.round(totalMax * 10) / 10,
      percentageScore:
        totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0,
      categoryScores,
      rulesApplied,
      analysisMethod: 'deterministic',
      timestamp: new Date().toISOString(),
      engineVersion: this.VERSION,
      recommendations,
      llmEnhanced: false,
      metadata: {
        courseId: input.courseId,
        analyzedAt: new Date().toISOString(),
        objectivesCount: input.objectives.length,
        chaptersCount: input.chapters.length,
        assessmentsCount: input.assessments.length,
        questionsCount,
        rulesEvaluated: this.rules.length,
        rulesPassed,
        rulesFailed,
      },
    };
  }

  /**
   * Get the engine version
   */
  getVersion(): string {
    return this.VERSION;
  }

  /**
   * Get all rules for inspection/audit
   */
  getRules(): RubricRule[] {
    return [...this.rules];
  }

  /**
   * Initialize all rubric rules
   */
  private initializeRules(): RubricRule[] {
    return [
      // ═══════════════════════════════════════════════════════════════
      // LEARNING OBJECTIVES RULES (Based on QM Standards 2.1-2.5)
      // ═══════════════════════════════════════════════════════════════
      {
        id: 'LO-001',
        category: 'LearningObjectives',
        name: 'Measurable Objectives',
        condition: (data) => {
          if (data.objectives.length === 0) return false;
          const measurableCount = data.objectives.filter((obj) =>
            MEASURABLE_VERBS_PATTERN.test(obj)
          ).length;
          // Reset lastIndex after test
          MEASURABLE_VERBS_PATTERN.lastIndex = 0;
          return measurableCount / data.objectives.length >= 0.8;
        },
        score: 3,
        maxScore: 3,
        weight: 1.5,
        evidence: '80%+ of objectives use measurable action verbs (QM 2.1)',
        recommendation:
          "Revise objectives to use measurable action verbs from Bloom's Taxonomy",
        source: {
          standard: 'QM',
          id: '2.1',
          description:
            'Course learning objectives describe outcomes that are measurable',
          fullCitation:
            'Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 2.1',
        },
      },
      {
        id: 'LO-002',
        category: 'LearningObjectives',
        name: "Bloom's Level Variety",
        condition: (data) => {
          const levels = new Set<string>();
          for (const obj of data.objectives) {
            for (const [level, pattern] of Object.entries(BLOOMS_PATTERNS)) {
              if (pattern.test(obj)) {
                levels.add(level);
              }
              pattern.lastIndex = 0; // Reset after test
            }
          }
          return levels.size >= 3;
        },
        score: 3,
        maxScore: 3,
        weight: 1.2,
        evidence: "Objectives span at least 3 Bloom's Taxonomy levels",
        recommendation:
          'Add objectives at higher cognitive levels (Analyze, Evaluate, Create)',
        source: {
          standard: 'QM',
          id: '2.2',
          description:
            'Module objectives are consistent with course-level objectives',
          fullCitation:
            'Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 2.2',
        },
      },
      {
        id: 'LO-003',
        category: 'LearningObjectives',
        name: 'Optimal Objective Count',
        condition: (data) =>
          data.objectives.length >= 3 && data.objectives.length <= 8,
        score: 2,
        maxScore: 2,
        weight: 1.0,
        evidence:
          'Course has 3-8 learning objectives (research-backed optimal range)',
        recommendation: 'Adjust to 3-8 total objectives for optimal learner focus',
        source: {
          standard: 'Research',
          id: 'Mager-1997',
          description:
            'Preparing Instructional Objectives recommends 3-8 objectives per course',
          fullCitation:
            'Mager, R. F. (1997). Preparing Instructional Objectives (3rd ed.). CEP Press.',
        },
      },
      {
        id: 'LO-004',
        category: 'LearningObjectives',
        name: 'Learner-Centered Language',
        condition: (data) => {
          if (data.objectives.length === 0) return false;
          const learnerCentered = data.objectives.filter((obj) =>
            LEARNER_CENTERED_PATTERN.test(obj)
          ).length;
          return learnerCentered / data.objectives.length >= 0.5;
        },
        score: 2,
        maxScore: 2,
        weight: 0.8,
        evidence: '50%+ objectives written from learner perspective (QM 2.3)',
        recommendation:
          'Rewrite objectives using "Students will be able to..." format',
        source: {
          standard: 'QM',
          id: '2.3',
          description:
            "Objectives are stated clearly from the learner's perspective",
          fullCitation:
            'Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 2.3',
        },
      },
      {
        id: 'LO-005',
        category: 'LearningObjectives',
        name: 'Objectives Present',
        condition: (data) => data.objectives.length >= 1,
        score: 3,
        maxScore: 3,
        weight: 1.5,
        evidence: 'Course has at least one learning objective defined',
        recommendation:
          'Define clear learning objectives for your course before adding content',
        source: {
          standard: 'QM',
          id: '2.1',
          description: 'Course learning objectives are essential for course design',
        },
      },

      // ═══════════════════════════════════════════════════════════════
      // ASSESSMENT RULES (Based on QM Standards 3.1-3.5)
      // ═══════════════════════════════════════════════════════════════
      {
        id: 'AS-001',
        category: 'Assessment',
        name: 'Assessment-Objective Alignment',
        condition: (data) => {
          if (data.objectives.length === 0 || data.assessments.length === 0)
            return false;
          return (
            data.assessments.length >= Math.ceil(data.objectives.length * 0.5)
          );
        },
        score: 3,
        maxScore: 3,
        weight: 1.5,
        evidence:
          'Assessments cover at least 50% of learning objectives (QM 3.1)',
        recommendation: 'Create assessments aligned with each learning objective',
        source: {
          standard: 'QM',
          id: '3.1',
          description:
            'Assessments measure the achievement of stated learning objectives',
          fullCitation:
            'Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 3.1',
        },
      },
      {
        id: 'AS-002',
        category: 'Assessment',
        name: 'Assessment Type Variety',
        condition: (data) => {
          const types = new Set(data.assessments.map((a) => a.type));
          return types.size >= 2;
        },
        score: 2,
        maxScore: 2,
        weight: 1.0,
        evidence: 'At least 2 different assessment types used',
        recommendation:
          'Incorporate varied assessment formats (quizzes, projects, discussions, essays)',
        source: {
          standard: 'QM',
          id: '3.4',
          description: 'Assessment instruments are sequenced and varied',
          fullCitation:
            'Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 3.4',
        },
      },
      {
        id: 'AS-003',
        category: 'Assessment',
        name: 'Formative Assessments Present',
        condition: (data) => {
          const formative = data.assessments.filter(
            (a) =>
              a.type === 'quiz' ||
              a.type === 'practice' ||
              a.title?.toLowerCase().includes('practice')
          );
          return formative.length >= 1;
        },
        score: 2,
        maxScore: 2,
        weight: 1.0,
        evidence: 'Course includes formative assessments for learning checks',
        recommendation:
          'Add practice quizzes or knowledge checks throughout the course',
        source: {
          standard: 'OLC',
          id: 'EA-3',
          description: 'Formative assessments provide feedback for improvement',
          fullCitation:
            'Online Learning Consortium. (2020). OLC Quality Scorecard Suite. EA-3',
        },
      },
      {
        id: 'AS-004',
        category: 'Assessment',
        name: 'Assessment Feedback Quality',
        condition: (data) => {
          const assessmentsWithQuestions = data.assessments.filter(
            (a) => a.questions && a.questions.length > 0
          );
          if (assessmentsWithQuestions.length === 0) return false;

          const withFeedback = assessmentsWithQuestions.filter((a) =>
            a.questions?.some((q) => q.explanation || q.feedback)
          );
          return withFeedback.length / assessmentsWithQuestions.length >= 0.5;
        },
        score: 2,
        maxScore: 2,
        weight: 1.2,
        evidence: '50%+ of assessments have explanations/feedback (QM 3.3)',
        recommendation: 'Add detailed explanations to assessment questions',
        source: {
          standard: 'QM',
          id: '3.3',
          description:
            "Specific criteria are provided for evaluation of learners' work",
          fullCitation:
            'Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 3.3',
        },
      },
      {
        id: 'AS-005',
        category: 'Assessment',
        name: 'Minimum Question Count',
        condition: (data) => {
          const totalQuestions = data.assessments.reduce(
            (sum, a) => sum + (a.questions?.length ?? 0),
            0
          );
          return totalQuestions >= 5;
        },
        score: 2,
        maxScore: 2,
        weight: 1.0,
        evidence: 'Course has at least 5 assessment questions',
        recommendation:
          'Add more assessment questions to adequately measure learning',
        source: {
          standard: 'Research',
          id: 'Assessment-Design',
          description:
            'Adequate question pool ensures comprehensive assessment coverage',
        },
      },

      // ═══════════════════════════════════════════════════════════════
      // CONTENT STRUCTURE RULES (Based on QM Standards 4 & 5)
      // ═══════════════════════════════════════════════════════════════
      {
        id: 'CS-001',
        category: 'ContentStructure',
        name: 'Minimum Course Structure',
        condition: (data) => data.chapters.length >= 3,
        score: 2,
        maxScore: 2,
        weight: 1.0,
        evidence: 'Course has at least 3 chapters/modules',
        recommendation:
          'Expand course structure to at least 3 modules for comprehensive coverage',
        source: {
          standard: 'OLC',
          id: 'CS-1',
          description: 'Course is organized into logical modules or units',
          fullCitation:
            'Online Learning Consortium. (2020). OLC Quality Scorecard Suite. CS-1',
        },
      },
      {
        id: 'CS-002',
        category: 'ContentStructure',
        name: 'Chapter Learning Outcomes',
        condition: (data) => {
          if (data.chapters.length === 0) return false;
          const withOutcomes = data.chapters.filter(
            (ch) => ch.learningOutcome && ch.learningOutcome.length > 20
          );
          return withOutcomes.length / data.chapters.length >= 0.8;
        },
        score: 2,
        maxScore: 2,
        weight: 1.0,
        evidence: '80%+ of chapters have defined learning outcomes',
        recommendation: 'Add specific learning outcomes to each chapter',
        source: {
          standard: 'QM',
          id: '2.2',
          description: 'Module learning objectives are measurable',
          fullCitation:
            'Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 2.2',
        },
      },
      {
        id: 'CS-003',
        category: 'ContentStructure',
        name: 'Consistent Section Depth',
        condition: (data) => {
          if (data.chapters.length < 2) return true;
          const sectionCounts = data.chapters.map(
            (ch) => ch.sections?.length ?? 0
          );
          const avg =
            sectionCounts.reduce((a, b) => a + b, 0) / sectionCounts.length;
          const variance =
            sectionCounts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) /
            sectionCounts.length;
          return variance < 4;
        },
        score: 1,
        maxScore: 1,
        weight: 0.8,
        evidence: 'Chapters have consistent depth (similar section counts)',
        recommendation: 'Balance chapter content for consistent learner workload',
        source: {
          standard: 'OLC',
          id: 'CS-3',
          description: 'Course components are consistent in structure',
          fullCitation:
            'Online Learning Consortium. (2020). OLC Quality Scorecard Suite. CS-3',
        },
      },
      {
        id: 'CS-004',
        category: 'ContentStructure',
        name: 'Resource Availability',
        condition: (data) => (data.attachments?.length ?? 0) >= 1,
        score: 1,
        maxScore: 1,
        weight: 0.8,
        evidence: 'Course includes supplementary resources/attachments',
        recommendation:
          'Add downloadable resources (PDFs, worksheets, reference materials)',
        source: {
          standard: 'QM',
          id: '4.5',
          description: 'Instructional materials are accessible',
          fullCitation:
            'Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 4.5',
        },
      },
      {
        id: 'CS-005',
        category: 'ContentStructure',
        name: 'Sections Present',
        condition: (data) => {
          const totalSections = data.chapters.reduce(
            (sum, ch) => sum + (ch.sections?.length ?? 0),
            0
          );
          return totalSections >= data.chapters.length;
        },
        score: 2,
        maxScore: 2,
        weight: 1.0,
        evidence: 'Each chapter has at least one section on average',
        recommendation: 'Add sections to chapters for better content organization',
        source: {
          standard: 'OLC',
          id: 'CS-2',
          description: 'Course content is chunked into manageable segments',
        },
      },

      // ═══════════════════════════════════════════════════════════════
      // COGNITIVE DEPTH RULES (Based on Bloom's & Webb's DOK Research)
      // ═══════════════════════════════════════════════════════════════
      {
        id: 'CD-001',
        category: 'CognitiveDepth',
        name: 'Higher-Order Thinking Content',
        condition: (data) => {
          if (!data.contentAnalysis) return false;
          const higherOrder =
            (data.contentAnalysis.bloomsDistribution.ANALYZE ?? 0) +
            (data.contentAnalysis.bloomsDistribution.EVALUATE ?? 0) +
            (data.contentAnalysis.bloomsDistribution.CREATE ?? 0);
          return higherOrder >= 25;
        },
        score: 3,
        maxScore: 3,
        weight: 1.5,
        evidence:
          '25%+ content at higher-order thinking levels (Analyze, Evaluate, Create)',
        recommendation:
          'Add more analytical, evaluative, and creative activities',
        source: {
          standard: 'Research',
          id: 'Hess-2009',
          description:
            'Cognitive Rigor Matrix recommends 25%+ higher-order activities',
          fullCitation:
            "Hess, K. K., et al. (2009). Cognitive Rigor: Blending the Strengths of Bloom's Taxonomy and Webb's Depth of Knowledge. Educational Assessment.",
        },
      },
      {
        id: 'CD-002',
        category: 'CognitiveDepth',
        name: 'Balanced Cognitive Distribution',
        condition: (data) => {
          if (!data.contentAnalysis) return false;
          const dist = data.contentAnalysis.bloomsDistribution;
          const values = Object.values(dist);
          const max = Math.max(...values);
          return max <= 50;
        },
        score: 2,
        maxScore: 2,
        weight: 1.0,
        evidence: "No single Bloom's level dominates (≤50% each)",
        recommendation: 'Rebalance content across cognitive levels',
        source: {
          standard: 'Research',
          id: 'Anderson-2001',
          description:
            "Revised Bloom's Taxonomy recommends balanced distribution",
          fullCitation:
            'Anderson, L. W., & Krathwohl, D. R. (2001). A Taxonomy for Learning, Teaching, and Assessing. Longman.',
        },
      },
      {
        id: 'CD-003',
        category: 'CognitiveDepth',
        name: 'DOK Level 3+ Content',
        condition: (data) => {
          if (!data.contentAnalysis?.dokDistribution) return false;
          const dok = data.contentAnalysis.dokDistribution;
          return (dok.level3 ?? 0) + (dok.level4 ?? 0) >= 20;
        },
        score: 2,
        maxScore: 2,
        weight: 1.2,
        evidence: '20%+ content at DOK Level 3-4 (Strategic/Extended Thinking)',
        recommendation: 'Add strategic thinking tasks and extended projects',
        source: {
          standard: 'Research',
          id: 'Webb-2002',
          description: 'Depth of Knowledge framework for cognitive complexity',
          fullCitation:
            'Webb, N. L. (2002). Depth-of-Knowledge Levels for Four Content Areas. Wisconsin Center for Education Research.',
        },
      },
      {
        id: 'CD-004',
        category: 'CognitiveDepth',
        name: 'Application Level Content',
        condition: (data) => {
          if (!data.contentAnalysis) return false;
          return (data.contentAnalysis.bloomsDistribution.APPLY ?? 0) >= 15;
        },
        score: 2,
        maxScore: 2,
        weight: 1.0,
        evidence: '15%+ content at Application level',
        recommendation:
          'Add practical exercises and hands-on application activities',
        source: {
          standard: 'Research',
          id: 'Freeman-2014',
          description: 'Active learning requires application of knowledge',
          fullCitation:
            'Freeman, S., et al. (2014). Active learning increases student performance in STEM. PNAS, 111(23), 8410-8415.',
        },
      },

      // ═══════════════════════════════════════════════════════════════
      // ENGAGEMENT RULES (Based on OLC Standards)
      // ═══════════════════════════════════════════════════════════════
      {
        id: 'EN-001',
        category: 'Engagement',
        name: 'Course Description Quality',
        condition: (data) => (data.description?.length ?? 0) >= 200,
        score: 1,
        maxScore: 1,
        weight: 0.8,
        evidence: 'Course has detailed description (200+ characters)',
        recommendation:
          'Expand course description with learning outcomes and target audience',
        source: {
          standard: 'QM',
          id: '1.2',
          description: 'Course description provides introduction to course content',
          fullCitation:
            'Quality Matters. (2023). Higher Education Rubric, 7th Edition. Standard 1.2',
        },
      },
      {
        id: 'EN-002',
        category: 'Engagement',
        name: 'Visual Content Present',
        condition: (data) => {
          const hasVideo = data.chapters.some((ch) =>
            ch.sections?.some((s) => s.videoUrl)
          );
          const hasImage = Boolean(data.imageUrl);
          return hasVideo || hasImage;
        },
        score: 1,
        maxScore: 1,
        weight: 0.8,
        evidence: 'Course includes visual content (images or videos)',
        recommendation: 'Add video content or visual materials for engagement',
        source: {
          standard: 'OLC',
          id: 'TL-2',
          description: 'Course uses varied instructional methods',
          fullCitation:
            'Online Learning Consortium. (2020). OLC Quality Scorecard Suite. TL-2',
        },
      },
      {
        id: 'EN-003',
        category: 'Engagement',
        name: 'Course Title Quality',
        condition: (data) =>
          data.title.length >= 10 && data.title.length <= 100,
        score: 1,
        maxScore: 1,
        weight: 0.5,
        evidence: 'Course title is appropriately descriptive (10-100 characters)',
        recommendation:
          'Ensure course title is descriptive but concise (10-100 characters)',
        source: {
          standard: 'QM',
          id: '1.1',
          description: 'Course title accurately describes course content',
        },
      },

      // ═══════════════════════════════════════════════════════════════
      // ACCESSIBILITY RULES (Based on QM Standard 8)
      // ═══════════════════════════════════════════════════════════════
      {
        id: 'AC-001',
        category: 'Accessibility',
        name: 'Course Image Present',
        condition: (data) => Boolean(data.imageUrl),
        score: 1,
        maxScore: 1,
        weight: 0.5,
        evidence: 'Course has a cover image',
        recommendation:
          'Add a representative course image for visual identification',
        source: {
          standard: 'QM',
          id: '8.1',
          description: 'Course design facilitates readability',
        },
      },
      {
        id: 'AC-002',
        category: 'Accessibility',
        name: 'Section Descriptions',
        condition: (data) => {
          const sections = data.chapters.flatMap((ch) => ch.sections ?? []);
          if (sections.length === 0) return true;
          const withDesc = sections.filter(
            (s) => s.description && s.description.length > 10
          );
          return withDesc.length / sections.length >= 0.5;
        },
        score: 1,
        maxScore: 1,
        weight: 0.8,
        evidence: '50%+ of sections have descriptions',
        recommendation:
          'Add descriptive text to sections to help learners navigate',
        source: {
          standard: 'QM',
          id: '8.3',
          description:
            'Course provides accessible text and images within course',
        },
      },
    ];
  }

  private getPriorityFromWeight(
    weight: number
  ): PrioritizedRecommendation['priority'] {
    if (weight >= 1.5) return 'critical';
    if (weight >= 1.2) return 'high';
    if (weight >= 1.0) return 'medium';
    return 'low';
  }

  private estimateEffort(rule: RubricRule): 'low' | 'medium' | 'high' {
    const highEffortCategories: RubricCategory[] = [
      'CognitiveDepth',
      'Assessment',
    ];
    const lowEffortCategories: RubricCategory[] = ['Engagement', 'Accessibility'];

    if (highEffortCategories.includes(rule.category)) return 'high';
    if (lowEffortCategories.includes(rule.category)) return 'low';
    return 'medium';
  }

  private generateActionSteps(rule: RubricRule): string[] {
    const steps: string[] = [];

    switch (rule.id) {
      case 'LO-001':
        steps.push('Review each learning objective');
        steps.push(
          'Replace vague verbs (understand, know) with measurable ones (analyze, create)'
        );
        steps.push("Use Bloom's Taxonomy verb list as reference");
        break;
      case 'LO-002':
        steps.push("Map current objectives to Bloom's levels");
        steps.push('Identify missing levels');
        steps.push('Add objectives for Analyze, Evaluate, and Create levels');
        break;
      case 'LO-003':
        steps.push('Review current objective count');
        steps.push('Merge redundant objectives if above 8');
        steps.push('Split broad objectives if below 3');
        break;
      case 'LO-004':
        steps.push('Rewrite objectives starting with "Students will be able to..."');
        steps.push('Focus on learner outcomes, not instructor activities');
        break;
      case 'AS-001':
        steps.push('Create alignment matrix: objectives vs assessments');
        steps.push('Identify objectives without assessments');
        steps.push('Design assessments for uncovered objectives');
        break;
      case 'AS-002':
        steps.push('Review current assessment types');
        steps.push(
          'Add different formats: quizzes, projects, discussions, essays'
        );
        steps.push('Match assessment type to learning objective');
        break;
      case 'AS-003':
        steps.push('Add practice quizzes after each chapter');
        steps.push('Include knowledge checks at key points');
        steps.push('Ensure immediate feedback on formative assessments');
        break;
      case 'AS-004':
        steps.push('Add explanations to each question');
        steps.push('Explain why correct answer is correct');
        steps.push('Explain why incorrect answers are wrong');
        break;
      case 'CS-001':
        steps.push('Organize content into logical modules');
        steps.push('Create at least 3 chapters covering course scope');
        steps.push('Ensure each chapter has clear focus');
        break;
      case 'CS-002':
        steps.push('Write learning outcomes for each chapter');
        steps.push('Align chapter outcomes with course objectives');
        steps.push('Use measurable verbs in chapter outcomes');
        break;
      case 'CD-001':
        steps.push('Add case studies requiring analysis');
        steps.push('Include evaluation activities (peer review, critique)');
        steps.push('Add creative projects (design, develop, propose)');
        break;
      case 'CD-002':
        steps.push('Review content distribution across cognitive levels');
        steps.push('Reduce content at dominant level');
        steps.push('Add content at underrepresented levels');
        break;
      case 'EN-001':
        steps.push('Expand course description to 200+ characters');
        steps.push('Include target audience information');
        steps.push('List key learning outcomes');
        break;
      case 'EN-002':
        steps.push('Add course cover image');
        steps.push('Include video content in lessons');
        steps.push('Use visuals to explain complex concepts');
        break;
      default:
        steps.push('Review current implementation');
        steps.push('Apply recommended changes');
        steps.push('Verify improvement');
    }

    return steps;
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Convert DeterministicAnalysisResult to a serializable object
 */
export function serializeAnalysisResult(
  result: DeterministicAnalysisResult
): Record<string, unknown> {
  return {
    ...result,
    categoryScores: Object.fromEntries(result.categoryScores),
  };
}

/**
 * Calculate course type alignment score
 */
export function calculateCourseTypeAlignment(
  actual: BloomsDistribution,
  courseType: CourseType
): number {
  const ideal = COURSE_TYPE_PROFILES[courseType].idealBloomsDistribution;
  let totalDiff = 0;

  for (const level of Object.keys(ideal) as BloomsLevel[]) {
    totalDiff += Math.abs((actual[level] ?? 0) - ideal[level]);
  }

  // Max possible difference is 200 (0-100 for each of 2 extremes)
  return Math.max(0, 100 - totalDiff / 2);
}

// Export singleton instance
export const deterministicRubricEngine = new DeterministicRubricEngine();
