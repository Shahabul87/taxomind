/**
 * Quality Matters (QM) Higher Education Rubric Evaluator
 * 7th Edition Standards Implementation
 *
 * Citation: Quality Matters. (2023). Higher Education Rubric, 7th Edition.
 * URL: https://www.qualitymatters.org/qa-resources/rubric-standards/higher-ed-rubric
 *
 * QM Scoring System:
 * - 3 points: Met (meets standard)
 * - 2 points: Minor issues (meets with minor concerns)
 * - 1 point: Significant issues (does not meet)
 * - 0 points: Not applicable or not evaluated
 *
 * Essential Standards must score 3 to achieve QM certification
 */

import type { CourseAnalysisInput } from '../analyzers/deterministic-rubric-engine';

// ═══════════════════════════════════════════════════════════════
// QM TYPES AND INTERFACES
// ═══════════════════════════════════════════════════════════════

export type QMGeneralStandard =
  | '1' // Course Overview and Introduction
  | '2' // Learning Objectives
  | '3' // Assessment and Measurement
  | '4' // Instructional Materials
  | '5' // Learning Activities and Learner Interaction
  | '6' // Course Technology
  | '7' // Learner Support
  | '8'; // Accessibility and Usability

export interface QMStandard {
  id: string;
  generalStandard: QMGeneralStandard;
  description: string;
  points: 3 | 2 | 1;
  essential: boolean;
  annotation: string;
  checkCriteria: string[];
  automatedCheckPossible: boolean;
}

export interface QMStandardResult {
  standardId: string;
  status: 'met' | 'partially_met' | 'not_met' | 'manual_review_required' | 'not_evaluated';
  score: 0 | 1 | 2 | 3;
  maxScore: number;
  notes?: string;
  evidence?: string[];
  recommendations?: string[];
}

export interface QMEvaluationResult {
  overallScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  essentialsMet: boolean;
  essentialsCount: { met: number; total: number };
  qmCertifiable: boolean;
  standardResults: QMStandardResult[];
  categoryScores: Record<QMGeneralStandard, { earned: number; max: number; percentage: number }>;
  recommendations: QMRecommendation[];
  timestamp: string;
}

export interface QMRecommendation {
  standardId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionSteps: string[];
  isEssential: boolean;
}

// ═══════════════════════════════════════════════════════════════
// QM STANDARDS DEFINITION (Subset for automated evaluation)
// ═══════════════════════════════════════════════════════════════

export const QM_STANDARDS: QMStandard[] = [
  // ─────────────────────────────────────────────────────────────
  // General Standard 1: Course Overview and Introduction
  // ─────────────────────────────────────────────────────────────
  {
    id: '1.1',
    generalStandard: '1',
    description: 'Instructions make clear how to get started and where to find various course components.',
    points: 3,
    essential: true,
    annotation: 'Clear navigation and course organization',
    checkCriteria: [
      'Course has description',
      'Course has organized chapters',
      'Clear section titles'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '1.2',
    generalStandard: '1',
    description: 'Learners are introduced to the purpose and structure of the course.',
    points: 3,
    essential: false,
    annotation: 'Course introduction explains goals',
    checkCriteria: [
      'Description explains purpose',
      'Learning objectives stated',
      'Course structure outlined'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '1.3',
    generalStandard: '1',
    description: 'Communication expectations for online discussions, email, and other forms of interaction are clearly stated.',
    points: 2,
    essential: false,
    annotation: 'Communication guidelines present',
    checkCriteria: [
      'Communication expectations stated',
      'Response time expectations',
      'Interaction guidelines'
    ],
    automatedCheckPossible: false,
  },
  {
    id: '1.4',
    generalStandard: '1',
    description: 'Course and institutional policies with which the learner is expected to comply are clearly stated.',
    points: 2,
    essential: false,
    annotation: 'Policies accessible',
    checkCriteria: [
      'Academic integrity policy',
      'Grading policy',
      'Late work policy'
    ],
    automatedCheckPossible: false,
  },
  {
    id: '1.5',
    generalStandard: '1',
    description: 'Minimum technology requirements are clearly stated and instructions for obtaining the technologies are provided.',
    points: 2,
    essential: false,
    annotation: 'Tech requirements documented',
    checkCriteria: [
      'Technology requirements listed',
      'Software needs identified',
      'Hardware recommendations'
    ],
    automatedCheckPossible: false,
  },
  {
    id: '1.6',
    generalStandard: '1',
    description: 'Computer skills and digital literacy skills expected of the learner are clearly stated.',
    points: 1,
    essential: false,
    annotation: 'Prerequisite skills noted',
    checkCriteria: [
      'Digital literacy expectations',
      'Computer skills needed',
      'Prerequisite knowledge'
    ],
    automatedCheckPossible: false,
  },
  {
    id: '1.7',
    generalStandard: '1',
    description: 'Expectations for prerequisite knowledge in the discipline and/or any required competencies are clearly stated.',
    points: 1,
    essential: false,
    annotation: 'Prerequisites documented',
    checkCriteria: [
      'Prior knowledge requirements',
      'Prerequisite courses',
      'Competency expectations'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '1.8',
    generalStandard: '1',
    description: 'The self-introduction by the instructor is appropriate and available online.',
    points: 1,
    essential: false,
    annotation: 'Instructor introduction present',
    checkCriteria: [
      'Instructor bio available',
      'Contact information',
      'Professional background'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '1.9',
    generalStandard: '1',
    description: 'Learners are asked to introduce themselves to the class.',
    points: 1,
    essential: false,
    annotation: 'Student introductions encouraged',
    checkCriteria: [
      'Introduction activity',
      'Community building',
      'Peer interaction'
    ],
    automatedCheckPossible: false,
  },

  // ─────────────────────────────────────────────────────────────
  // General Standard 2: Learning Objectives (Competencies)
  // ─────────────────────────────────────────────────────────────
  {
    id: '2.1',
    generalStandard: '2',
    description: 'The course learning objectives, or course/program competencies, describe outcomes that are measurable.',
    points: 3,
    essential: true,
    annotation: 'Objectives use measurable action verbs',
    checkCriteria: [
      'Objectives use action verbs',
      'Outcomes are assessable',
      'Clear performance criteria'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '2.2',
    generalStandard: '2',
    description: 'The module/unit learning objectives or competencies describe outcomes that are measurable and consistent with the course-level objectives or competencies.',
    points: 3,
    essential: true,
    annotation: 'Module objectives align with course objectives',
    checkCriteria: [
      'Module objectives present',
      'Alignment with course goals',
      'Measurable outcomes'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '2.3',
    generalStandard: '2',
    description: 'Learning objectives or competencies are stated clearly, are written from the learner\'s perspective, and are prominently located in the course.',
    points: 3,
    essential: false,
    annotation: 'Learner-centered language used',
    checkCriteria: [
      'Learner-focused language',
      'Prominently displayed',
      'Clear and concise'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '2.4',
    generalStandard: '2',
    description: 'The relationship between learning objectives or competencies and learning activities is clearly stated.',
    points: 3,
    essential: false,
    annotation: 'Objectives linked to activities',
    checkCriteria: [
      'Activities support objectives',
      'Clear connections',
      'Logical progression'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '2.5',
    generalStandard: '2',
    description: 'The learning objectives or competencies are suited to the level of the course.',
    points: 3,
    essential: false,
    annotation: 'Appropriate cognitive level',
    checkCriteria: [
      'Bloom\'s levels appropriate',
      'Difficulty matches course level',
      'Progressive complexity'
    ],
    automatedCheckPossible: true,
  },

  // ─────────────────────────────────────────────────────────────
  // General Standard 3: Assessment and Measurement
  // ─────────────────────────────────────────────────────────────
  {
    id: '3.1',
    generalStandard: '3',
    description: 'The assessments measure the achievement of the stated learning objectives or competencies.',
    points: 3,
    essential: true,
    annotation: 'Assessments aligned with objectives',
    checkCriteria: [
      'Assessment-objective alignment',
      'Coverage of all objectives',
      'Valid measurement'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '3.2',
    generalStandard: '3',
    description: 'The course grading policy is stated clearly at the beginning of the course.',
    points: 3,
    essential: true,
    annotation: 'Grading criteria transparent',
    checkCriteria: [
      'Grading scale defined',
      'Weight distribution clear',
      'Criteria explained'
    ],
    automatedCheckPossible: false,
  },
  {
    id: '3.3',
    generalStandard: '3',
    description: 'Specific and descriptive criteria are provided for the evaluation of learners\' work and are tied to the course grading policy.',
    points: 3,
    essential: true,
    annotation: 'Rubrics or criteria provided',
    checkCriteria: [
      'Detailed rubrics',
      'Clear expectations',
      'Feedback criteria'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '3.4',
    generalStandard: '3',
    description: 'The assessments used are sequenced, varied, and suited to the level of the course.',
    points: 2,
    essential: false,
    annotation: 'Assessment variety and sequence',
    checkCriteria: [
      'Multiple assessment types',
      'Logical sequence',
      'Appropriate difficulty'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '3.5',
    generalStandard: '3',
    description: 'The course provides learners with multiple opportunities to track their learning progress with timely feedback.',
    points: 2,
    essential: false,
    annotation: 'Progress tracking enabled',
    checkCriteria: [
      'Formative assessments',
      'Feedback mechanisms',
      'Progress indicators'
    ],
    automatedCheckPossible: true,
  },

  // ─────────────────────────────────────────────────────────────
  // General Standard 4: Instructional Materials
  // ─────────────────────────────────────────────────────────────
  {
    id: '4.1',
    generalStandard: '4',
    description: 'The instructional materials contribute to the achievement of the stated learning objectives or competencies.',
    points: 3,
    essential: true,
    annotation: 'Materials support objectives',
    checkCriteria: [
      'Content aligns with objectives',
      'Relevant resources',
      'Sufficient coverage'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '4.2',
    generalStandard: '4',
    description: 'The relationship between the use of instructional materials in the course and completing learning activities is clearly explained.',
    points: 3,
    essential: false,
    annotation: 'Material purpose explained',
    checkCriteria: [
      'Instructions for materials',
      'Clear connections',
      'Usage guidance'
    ],
    automatedCheckPossible: false,
  },
  {
    id: '4.3',
    generalStandard: '4',
    description: 'The course models the academic integrity expected of learners by providing both source references and permissions for use of instructional materials.',
    points: 2,
    essential: false,
    annotation: 'Citations and permissions',
    checkCriteria: [
      'Source citations',
      'Copyright compliance',
      'Attribution present'
    ],
    automatedCheckPossible: false,
  },
  {
    id: '4.4',
    generalStandard: '4',
    description: 'The instructional materials represent up-to-date theory and practice in the discipline.',
    points: 2,
    essential: false,
    annotation: 'Current content',
    checkCriteria: [
      'Recent materials',
      'Current best practices',
      'Relevant examples'
    ],
    automatedCheckPossible: false,
  },
  {
    id: '4.5',
    generalStandard: '4',
    description: 'A variety of instructional materials are used in the course.',
    points: 2,
    essential: false,
    annotation: 'Material diversity',
    checkCriteria: [
      'Multiple formats',
      'Video content',
      'Written materials',
      'Interactive elements'
    ],
    automatedCheckPossible: true,
  },

  // ─────────────────────────────────────────────────────────────
  // General Standard 5: Learning Activities and Learner Interaction
  // ─────────────────────────────────────────────────────────────
  {
    id: '5.1',
    generalStandard: '5',
    description: 'The learning activities promote the achievement of the stated learning objectives or competencies.',
    points: 3,
    essential: true,
    annotation: 'Activities support objectives',
    checkCriteria: [
      'Activity-objective alignment',
      'Meaningful activities',
      'Skill development'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '5.2',
    generalStandard: '5',
    description: 'Learning activities provide opportunities for interaction that support active learning.',
    points: 3,
    essential: false,
    annotation: 'Active learning opportunities',
    checkCriteria: [
      'Interactive elements',
      'Hands-on activities',
      'Engagement opportunities'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '5.3',
    generalStandard: '5',
    description: 'The instructor\'s plan for interacting with learners during the course is clearly stated.',
    points: 2,
    essential: false,
    annotation: 'Interaction plan defined',
    checkCriteria: [
      'Communication schedule',
      'Feedback timing',
      'Support availability'
    ],
    automatedCheckPossible: false,
  },
  {
    id: '5.4',
    generalStandard: '5',
    description: 'The requirements for learner interaction are clearly stated.',
    points: 2,
    essential: false,
    annotation: 'Interaction requirements clear',
    checkCriteria: [
      'Participation expectations',
      'Collaboration requirements',
      'Discussion guidelines'
    ],
    automatedCheckPossible: false,
  },

  // ─────────────────────────────────────────────────────────────
  // General Standard 8: Accessibility and Usability
  // ─────────────────────────────────────────────────────────────
  {
    id: '8.1',
    generalStandard: '8',
    description: 'Course navigation facilitates ease of use.',
    points: 3,
    essential: true,
    annotation: 'Easy navigation',
    checkCriteria: [
      'Clear structure',
      'Consistent layout',
      'Logical organization'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '8.2',
    generalStandard: '8',
    description: 'The course design facilitates readability.',
    points: 3,
    essential: false,
    annotation: 'Readable design',
    checkCriteria: [
      'Clear formatting',
      'Appropriate fonts',
      'Visual hierarchy'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '8.3',
    generalStandard: '8',
    description: 'The course provides accessible text and images in files, documents, LMS pages, and web pages.',
    points: 3,
    essential: true,
    annotation: 'Accessible content',
    checkCriteria: [
      'Alt text for images',
      'Structured headings',
      'Readable documents'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '8.4',
    generalStandard: '8',
    description: 'The course provides accessible video and audio content.',
    points: 3,
    essential: false,
    annotation: 'Accessible multimedia',
    checkCriteria: [
      'Captions available',
      'Transcripts provided',
      'Audio descriptions'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '8.5',
    generalStandard: '8',
    description: 'Course multimedia facilitate ease of use.',
    points: 2,
    essential: false,
    annotation: 'User-friendly multimedia',
    checkCriteria: [
      'Proper file formats',
      'Reasonable file sizes',
      'Playback controls'
    ],
    automatedCheckPossible: true,
  },
  {
    id: '8.6',
    generalStandard: '8',
    description: 'Vendor accessibility statements are provided for all technologies required in the course.',
    points: 2,
    essential: false,
    annotation: 'Tech accessibility documented',
    checkCriteria: [
      'VPAT available',
      'Accessibility statements',
      'Compliance documentation'
    ],
    automatedCheckPossible: false,
  },
];

// ═══════════════════════════════════════════════════════════════
// MEASURABLE VERB PATTERNS
// ═══════════════════════════════════════════════════════════════

const MEASURABLE_VERBS_PATTERN =
  /\b(define|identify|list|name|recall|recognize|state|explain|summarize|interpret|classify|compare|contrast|describe|discuss|predict|apply|demonstrate|solve|use|implement|calculate|execute|analyze|examine|differentiate|organize|evaluate|judge|critique|justify|assess|create|design|develop|formulate|construct|compose|plan)\b/gi;

const LEARNER_CENTERED_PATTERN =
  /\b(you will|learners? will|students? will|be able to|can|will be able|upon completion|by the end|after completing)\b/i;

// ═══════════════════════════════════════════════════════════════
// QM EVALUATOR CLASS
// ═══════════════════════════════════════════════════════════════

export class QMEvaluator {
  private readonly VERSION = '1.0.0';

  /**
   * Evaluate course against QM Higher Education Rubric (7th Edition)
   */
  evaluate(courseData: CourseAnalysisInput): QMEvaluationResult {
    const results: QMStandardResult[] = [];
    let totalPoints = 0;
    let earnedPoints = 0;
    let essentialsMet = 0;
    let essentialsTotal = 0;

    // Initialize category scores
    const categoryScores: Record<QMGeneralStandard, { earned: number; max: number; percentage: number }> = {
      '1': { earned: 0, max: 0, percentage: 0 },
      '2': { earned: 0, max: 0, percentage: 0 },
      '3': { earned: 0, max: 0, percentage: 0 },
      '4': { earned: 0, max: 0, percentage: 0 },
      '5': { earned: 0, max: 0, percentage: 0 },
      '6': { earned: 0, max: 0, percentage: 0 },
      '7': { earned: 0, max: 0, percentage: 0 },
      '8': { earned: 0, max: 0, percentage: 0 },
    };

    // Evaluate each standard
    for (const standard of QM_STANDARDS) {
      if (standard.essential) {
        essentialsTotal++;
      }

      let evaluation: QMStandardResult;

      if (!standard.automatedCheckPossible) {
        evaluation = {
          standardId: standard.id,
          status: 'manual_review_required',
          score: 0,
          maxScore: standard.points,
          notes: `Manual review required: ${standard.annotation}`,
        };
      } else {
        evaluation = this.evaluateStandard(standard, courseData);
      }

      results.push(evaluation);

      // Update totals
      totalPoints += standard.points;
      earnedPoints += evaluation.score;

      // Update category scores
      const cat = categoryScores[standard.generalStandard];
      cat.max += standard.points;
      cat.earned += evaluation.score;

      // Check essentials
      if (standard.essential && evaluation.score >= 3) {
        essentialsMet++;
      }
    }

    // Calculate category percentages
    for (const cat of Object.values(categoryScores)) {
      cat.percentage = cat.max > 0 ? Math.round((cat.earned / cat.max) * 100) : 0;
    }

    const percentageScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const allEssentialsMet = essentialsMet === essentialsTotal;
    const qmCertifiable = allEssentialsMet && percentageScore >= 85;

    // Generate recommendations for failed/partial standards
    const recommendations = this.generateRecommendations(results);

    return {
      overallScore: earnedPoints,
      maxPossibleScore: totalPoints,
      percentageScore,
      essentialsMet: allEssentialsMet,
      essentialsCount: { met: essentialsMet, total: essentialsTotal },
      qmCertifiable,
      standardResults: results,
      categoryScores,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get the QM evaluator version
   */
  getVersion(): string {
    return this.VERSION;
  }

  /**
   * Get all QM standards for reference
   */
  getStandards(): QMStandard[] {
    return [...QM_STANDARDS];
  }

  /**
   * Get essential standards only
   */
  getEssentialStandards(): QMStandard[] {
    return QM_STANDARDS.filter(s => s.essential);
  }

  // ═══════════════════════════════════════════════════════════════
  // INDIVIDUAL STANDARD EVALUATORS
  // ═══════════════════════════════════════════════════════════════

  private evaluateStandard(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    switch (standard.id) {
      // Standard 1: Course Overview
      case '1.1':
        return this.evaluate1_1_CourseNavigation(standard, data);
      case '1.2':
        return this.evaluate1_2_CourseIntroduction(standard, data);
      case '1.7':
        return this.evaluate1_7_Prerequisites(standard, data);
      case '1.8':
        return this.evaluate1_8_InstructorIntro(standard, data);

      // Standard 2: Learning Objectives
      case '2.1':
        return this.evaluate2_1_MeasurableObjectives(standard, data);
      case '2.2':
        return this.evaluate2_2_ModuleObjectives(standard, data);
      case '2.3':
        return this.evaluate2_3_LearnerCenteredObjectives(standard, data);
      case '2.4':
        return this.evaluate2_4_ObjectiveActivityAlignment(standard, data);
      case '2.5':
        return this.evaluate2_5_ObjectiveLevel(standard, data);

      // Standard 3: Assessment
      case '3.1':
        return this.evaluate3_1_AssessmentAlignment(standard, data);
      case '3.3':
        return this.evaluate3_3_EvaluationCriteria(standard, data);
      case '3.4':
        return this.evaluate3_4_AssessmentVariety(standard, data);
      case '3.5':
        return this.evaluate3_5_ProgressTracking(standard, data);

      // Standard 4: Instructional Materials
      case '4.1':
        return this.evaluate4_1_MaterialsAlignment(standard, data);
      case '4.5':
        return this.evaluate4_5_MaterialVariety(standard, data);

      // Standard 5: Learning Activities
      case '5.1':
        return this.evaluate5_1_ActivityAlignment(standard, data);
      case '5.2':
        return this.evaluate5_2_ActiveLearning(standard, data);

      // Standard 8: Accessibility
      case '8.1':
        return this.evaluate8_1_Navigation(standard, data);
      case '8.2':
        return this.evaluate8_2_Readability(standard, data);
      case '8.3':
        return this.evaluate8_3_AccessibleContent(standard, data);
      case '8.4':
        return this.evaluate8_4_AccessibleMultimedia(standard, data);
      case '8.5':
        return this.evaluate8_5_MultimediaUsability(standard, data);

      default:
        return {
          standardId: standard.id,
          status: 'not_evaluated',
          score: 0,
          maxScore: standard.points,
          notes: 'Standard not implemented for automated evaluation',
        };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Standard 1 Evaluators
  // ─────────────────────────────────────────────────────────────

  private evaluate1_1_CourseNavigation(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    let score = 0;
    const evidence: string[] = [];

    // Check for course description
    if (data.description && data.description.length >= 50) {
      score++;
      evidence.push('Course has description');
    }

    // Check for organized chapters
    if (data.chapters.length >= 1) {
      score++;
      evidence.push(`Course has ${data.chapters.length} chapters`);
    }

    // Check for clear section titles
    const sectionsWithTitles = data.chapters.reduce((count, ch) =>
      count + (ch.sections?.filter(s => s.title && s.title.length > 5).length ?? 0), 0);
    if (sectionsWithTitles >= 3) {
      score++;
      evidence.push(`${sectionsWithTitles} sections with clear titles`);
    }

    return {
      standardId: standard.id,
      status: score >= 3 ? 'met' : score >= 2 ? 'partially_met' : 'not_met',
      score: Math.min(score, 3) as 0 | 1 | 2 | 3,
      maxScore: standard.points,
      evidence,
      notes: `Navigation score: ${score}/3`,
    };
  }

  private evaluate1_2_CourseIntroduction(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    let score = 0;
    const evidence: string[] = [];

    // Check description length/quality
    if (data.description && data.description.length >= 100) {
      score++;
      evidence.push('Detailed course description present');
    }

    // Check for learning objectives
    if (data.objectives.length >= 1) {
      score++;
      evidence.push(`${data.objectives.length} learning objectives defined`);
    }

    // Check for course structure (chapters)
    if (data.chapters.length >= 3) {
      score++;
      evidence.push('Course structure with multiple chapters');
    }

    return {
      standardId: standard.id,
      status: score >= 3 ? 'met' : score >= 2 ? 'partially_met' : 'not_met',
      score: Math.min(score, 3) as 0 | 1 | 2 | 3,
      maxScore: standard.points,
      evidence,
    };
  }

  private evaluate1_7_Prerequisites(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    // Check if description mentions prerequisites
    const prereqKeywords = /\b(prerequisite|prior knowledge|required knowledge|background|experience required|before taking)\b/i;
    const hasPrereqs = data.description ? prereqKeywords.test(data.description) : false;

    return {
      standardId: standard.id,
      status: hasPrereqs ? 'met' : 'not_met',
      score: hasPrereqs ? 1 : 0,
      maxScore: standard.points,
      notes: hasPrereqs ? 'Prerequisites mentioned' : 'No prerequisite information found',
    };
  }

  private evaluate1_8_InstructorIntro(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    // Check if course has image (indicator of professional setup)
    const hasImage = Boolean(data.imageUrl);

    return {
      standardId: standard.id,
      status: hasImage ? 'partially_met' : 'not_met',
      score: hasImage ? 1 : 0,
      maxScore: standard.points,
      notes: hasImage ? 'Course image present (proxy for instructor presence)' : 'No instructor introduction indicators',
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Standard 2 Evaluators (Learning Objectives)
  // ─────────────────────────────────────────────────────────────

  private evaluate2_1_MeasurableObjectives(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    if (data.objectives.length === 0) {
      return {
        standardId: standard.id,
        status: 'not_met',
        score: 0,
        maxScore: standard.points,
        notes: 'No learning objectives defined',
        recommendations: ['Add measurable learning objectives using action verbs'],
      };
    }

    const measurableCount = data.objectives.filter(obj => {
      MEASURABLE_VERBS_PATTERN.lastIndex = 0;
      return MEASURABLE_VERBS_PATTERN.test(obj);
    }).length;

    const ratio = measurableCount / data.objectives.length;

    let score: 0 | 1 | 2 | 3;
    let status: QMStandardResult['status'];

    if (ratio >= 0.9) {
      score = 3;
      status = 'met';
    } else if (ratio >= 0.7) {
      score = 2;
      status = 'partially_met';
    } else if (ratio >= 0.5) {
      score = 1;
      status = 'partially_met';
    } else {
      score = 0;
      status = 'not_met';
    }

    return {
      standardId: standard.id,
      status,
      score,
      maxScore: standard.points,
      notes: `${Math.round(ratio * 100)}% of objectives (${measurableCount}/${data.objectives.length}) use measurable verbs`,
      evidence: [`Measurable objectives: ${measurableCount}`, `Total objectives: ${data.objectives.length}`],
    };
  }

  private evaluate2_2_ModuleObjectives(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    const chaptersWithOutcomes = data.chapters.filter(
      ch => ch.learningOutcome && ch.learningOutcome.length > 10
    ).length;

    const ratio = data.chapters.length > 0 ? chaptersWithOutcomes / data.chapters.length : 0;

    let score: 0 | 1 | 2 | 3;
    if (ratio >= 0.8) score = 3;
    else if (ratio >= 0.5) score = 2;
    else if (ratio >= 0.25) score = 1;
    else score = 0;

    return {
      standardId: standard.id,
      status: score >= 3 ? 'met' : score >= 1 ? 'partially_met' : 'not_met',
      score,
      maxScore: standard.points,
      notes: `${chaptersWithOutcomes}/${data.chapters.length} chapters have learning outcomes`,
    };
  }

  private evaluate2_3_LearnerCenteredObjectives(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    if (data.objectives.length === 0) {
      return {
        standardId: standard.id,
        status: 'not_met',
        score: 0,
        maxScore: standard.points,
        notes: 'No objectives to evaluate',
      };
    }

    const learnerCenteredCount = data.objectives.filter(obj =>
      LEARNER_CENTERED_PATTERN.test(obj)
    ).length;

    const ratio = learnerCenteredCount / data.objectives.length;

    let score: 0 | 1 | 2 | 3;
    if (ratio >= 0.8) score = 3;
    else if (ratio >= 0.5) score = 2;
    else if (ratio >= 0.25) score = 1;
    else score = 0;

    return {
      standardId: standard.id,
      status: score >= 3 ? 'met' : score >= 1 ? 'partially_met' : 'not_met',
      score,
      maxScore: standard.points,
      notes: `${Math.round(ratio * 100)}% of objectives use learner-centered language`,
    };
  }

  private evaluate2_4_ObjectiveActivityAlignment(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    // Check if there are both objectives and activities (sections)
    const hasObjectives = data.objectives.length > 0;
    const totalSections = data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0);

    let score: 0 | 1 | 2 | 3;

    if (hasObjectives && totalSections >= data.objectives.length) {
      score = 3;
    } else if (hasObjectives && totalSections >= 1) {
      score = 2;
    } else if (hasObjectives || totalSections >= 1) {
      score = 1;
    } else {
      score = 0;
    }

    return {
      standardId: standard.id,
      status: score >= 3 ? 'met' : score >= 1 ? 'partially_met' : 'not_met',
      score,
      maxScore: standard.points,
      notes: `${data.objectives.length} objectives, ${totalSections} learning activities`,
    };
  }

  private evaluate2_5_ObjectiveLevel(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    // Check for variety in Bloom's levels
    const levels = new Set<string>();
    const bloomsPatterns: Record<string, RegExp> = {
      'REMEMBER': /\b(define|list|name|recall|identify|recognize|state)\b/gi,
      'UNDERSTAND': /\b(explain|summarize|interpret|classify|compare|describe)\b/gi,
      'APPLY': /\b(apply|demonstrate|solve|use|implement|calculate)\b/gi,
      'ANALYZE': /\b(analyze|examine|differentiate|organize|deconstruct)\b/gi,
      'EVALUATE': /\b(evaluate|judge|critique|justify|assess)\b/gi,
      'CREATE': /\b(create|design|develop|formulate|construct)\b/gi,
    };

    for (const obj of data.objectives) {
      for (const [level, pattern] of Object.entries(bloomsPatterns)) {
        pattern.lastIndex = 0;
        if (pattern.test(obj)) {
          levels.add(level);
        }
      }
    }

    let score: 0 | 1 | 2 | 3;
    if (levels.size >= 4) score = 3;
    else if (levels.size >= 3) score = 2;
    else if (levels.size >= 2) score = 1;
    else score = 0;

    return {
      standardId: standard.id,
      status: score >= 3 ? 'met' : score >= 1 ? 'partially_met' : 'not_met',
      score,
      maxScore: standard.points,
      notes: `Objectives span ${levels.size} Bloom's Taxonomy levels`,
      evidence: Array.from(levels),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Standard 3 Evaluators (Assessment)
  // ─────────────────────────────────────────────────────────────

  private evaluate3_1_AssessmentAlignment(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    if (data.objectives.length === 0) {
      return {
        standardId: standard.id,
        status: 'not_met',
        score: 0,
        maxScore: standard.points,
        notes: 'No objectives defined for alignment check',
      };
    }

    const assessmentCount = data.assessments.length;
    const objectiveCount = data.objectives.length;

    // Simple ratio check - ideally at least 1 assessment per 2 objectives
    const ratio = objectiveCount > 0 ? assessmentCount / objectiveCount : 0;

    let score: 0 | 1 | 2 | 3;
    if (ratio >= 0.5) score = 3;
    else if (ratio >= 0.3) score = 2;
    else if (assessmentCount >= 1) score = 1;
    else score = 0;

    return {
      standardId: standard.id,
      status: score >= 3 ? 'met' : score >= 1 ? 'partially_met' : 'not_met',
      score,
      maxScore: standard.points,
      notes: `${assessmentCount} assessments for ${objectiveCount} objectives (ratio: ${ratio.toFixed(2)})`,
    };
  }

  private evaluate3_3_EvaluationCriteria(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    // Check if assessments have explanations/feedback
    const assessmentsWithFeedback = data.assessments.filter(a =>
      a.questions?.some(q => q.explanation || q.feedback)
    ).length;

    const ratio = data.assessments.length > 0 ? assessmentsWithFeedback / data.assessments.length : 0;

    let score: 0 | 1 | 2 | 3;
    if (ratio >= 0.8) score = 3;
    else if (ratio >= 0.5) score = 2;
    else if (ratio >= 0.25) score = 1;
    else score = 0;

    return {
      standardId: standard.id,
      status: score >= 3 ? 'met' : score >= 1 ? 'partially_met' : 'not_met',
      score,
      maxScore: standard.points,
      notes: `${assessmentsWithFeedback}/${data.assessments.length} assessments have evaluation criteria`,
    };
  }

  private evaluate3_4_AssessmentVariety(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    const types = new Set(data.assessments.map(a => a.type));

    let score: 0 | 1 | 2;
    if (types.size >= 3) score = 2;
    else if (types.size >= 2) score = 1;
    else score = 0;

    return {
      standardId: standard.id,
      status: score >= 2 ? 'met' : score >= 1 ? 'partially_met' : 'not_met',
      score,
      maxScore: standard.points,
      notes: `${types.size} different assessment types used`,
      evidence: Array.from(types),
    };
  }

  private evaluate3_5_ProgressTracking(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    // Check for formative assessments (quizzes, practice)
    const formativeCount = data.assessments.filter(
      a => a.type === 'quiz' || a.type === 'practice'
    ).length;

    let score: 0 | 1 | 2;
    if (formativeCount >= 3) score = 2;
    else if (formativeCount >= 1) score = 1;
    else score = 0;

    return {
      standardId: standard.id,
      status: score >= 2 ? 'met' : score >= 1 ? 'partially_met' : 'not_met',
      score,
      maxScore: standard.points,
      notes: `${formativeCount} formative assessments for progress tracking`,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Standard 4 Evaluators (Instructional Materials)
  // ─────────────────────────────────────────────────────────────

  private evaluate4_1_MaterialsAlignment(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    // Check if there's content to support objectives
    const hasContent = data.chapters.length > 0;
    const hasObjectives = data.objectives.length > 0;
    const totalSections = data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0);

    let score: 0 | 1 | 2 | 3;
    if (hasContent && hasObjectives && totalSections >= data.objectives.length) {
      score = 3;
    } else if (hasContent && totalSections >= 3) {
      score = 2;
    } else if (hasContent) {
      score = 1;
    } else {
      score = 0;
    }

    return {
      standardId: standard.id,
      status: score >= 3 ? 'met' : score >= 1 ? 'partially_met' : 'not_met',
      score,
      maxScore: standard.points,
      notes: `${totalSections} content sections supporting ${data.objectives.length} objectives`,
    };
  }

  private evaluate4_5_MaterialVariety(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    const materialTypes = new Set<string>();

    // Check for video content
    const hasVideo = data.chapters.some(ch =>
      ch.sections?.some(s => s.videoUrl)
    );
    if (hasVideo) materialTypes.add('video');

    // Check for text content (descriptions)
    const hasText = data.chapters.some(ch =>
      ch.sections?.some(s => s.description && s.description.length > 50)
    );
    if (hasText) materialTypes.add('text');

    // Check for attachments
    if ((data.attachments?.length ?? 0) > 0) {
      materialTypes.add('attachments');
    }

    // Check for assessments (interactive)
    if (data.assessments.length > 0) {
      materialTypes.add('interactive');
    }

    let score: 0 | 1 | 2;
    if (materialTypes.size >= 3) score = 2;
    else if (materialTypes.size >= 2) score = 1;
    else score = 0;

    return {
      standardId: standard.id,
      status: score >= 2 ? 'met' : score >= 1 ? 'partially_met' : 'not_met',
      score,
      maxScore: standard.points,
      notes: `${materialTypes.size} different material types`,
      evidence: Array.from(materialTypes),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Standard 5 Evaluators (Learning Activities)
  // ─────────────────────────────────────────────────────────────

  private evaluate5_1_ActivityAlignment(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    const totalSections = data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0);
    const objectiveCount = data.objectives.length;

    let score: 0 | 1 | 2 | 3;
    if (totalSections >= objectiveCount && objectiveCount > 0) {
      score = 3;
    } else if (totalSections >= Math.ceil(objectiveCount * 0.5)) {
      score = 2;
    } else if (totalSections >= 1) {
      score = 1;
    } else {
      score = 0;
    }

    return {
      standardId: standard.id,
      status: score >= 3 ? 'met' : score >= 1 ? 'partially_met' : 'not_met',
      score,
      maxScore: standard.points,
      notes: `${totalSections} activities for ${objectiveCount} objectives`,
    };
  }

  private evaluate5_2_ActiveLearning(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    // Check for interactive elements
    const hasQuizzes = data.assessments.some(a => a.type === 'quiz' || a.type === 'practice');
    const hasProjects = data.assessments.some(a => a.type === 'project' || a.type === 'assignment');
    const hasVideos = data.chapters.some(ch => ch.sections?.some(s => s.videoUrl));

    const activeElements = [hasQuizzes, hasProjects, hasVideos].filter(Boolean).length;

    let score: 0 | 1 | 2 | 3;
    if (activeElements >= 3) score = 3;
    else if (activeElements >= 2) score = 2;
    else if (activeElements >= 1) score = 1;
    else score = 0;

    return {
      standardId: standard.id,
      status: score >= 3 ? 'met' : score >= 1 ? 'partially_met' : 'not_met',
      score,
      maxScore: standard.points,
      notes: `${activeElements} types of active learning elements`,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Standard 8 Evaluators (Accessibility)
  // ─────────────────────────────────────────────────────────────

  private evaluate8_1_Navigation(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    let score = 0;

    // Check for logical chapter organization
    if (data.chapters.length >= 1) score++;

    // Check for clear titles
    const titledChapters = data.chapters.filter(ch => ch.title && ch.title.length > 5).length;
    if (titledChapters === data.chapters.length && data.chapters.length > 0) score++;

    // Check for consistent section structure
    const avgSections = data.chapters.length > 0
      ? data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0) / data.chapters.length
      : 0;
    if (avgSections >= 1) score++;

    return {
      standardId: standard.id,
      status: score >= 3 ? 'met' : score >= 2 ? 'partially_met' : 'not_met',
      score: Math.min(score, 3) as 0 | 1 | 2 | 3,
      maxScore: standard.points,
      notes: `Navigation score: ${score}/3`,
    };
  }

  private evaluate8_2_Readability(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    let score = 0;

    // Check description quality
    if (data.description && data.description.length >= 100) score++;

    // Check chapter descriptions
    const chaptersWithDesc = data.chapters.filter(ch =>
      ch.learningOutcome && ch.learningOutcome.length > 20
    ).length;
    if (chaptersWithDesc >= data.chapters.length * 0.5) score++;

    // Check section descriptions
    const sectionsWithDesc = data.chapters.reduce((count, ch) =>
      count + (ch.sections?.filter(s => s.description && s.description.length > 10).length ?? 0), 0);
    const totalSections = data.chapters.reduce((sum, ch) => sum + (ch.sections?.length ?? 0), 0);
    if (sectionsWithDesc >= totalSections * 0.3) score++;

    return {
      standardId: standard.id,
      status: score >= 3 ? 'met' : score >= 2 ? 'partially_met' : 'not_met',
      score: Math.min(score, 3) as 0 | 1 | 2 | 3,
      maxScore: standard.points,
      notes: `Readability score: ${score}/3`,
    };
  }

  private evaluate8_3_AccessibleContent(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    // Check if course image exists (alt text would be with it)
    const hasImage = Boolean(data.imageUrl);

    // Check for text-based content
    const hasTextContent = data.chapters.some(ch =>
      ch.sections?.some(s => s.description && s.description.length > 50)
    );

    let score: 0 | 1 | 2 | 3;
    if (hasImage && hasTextContent) score = 3;
    else if (hasTextContent) score = 2;
    else if (hasImage) score = 1;
    else score = 0;

    return {
      standardId: standard.id,
      status: score >= 3 ? 'met' : score >= 1 ? 'partially_met' : 'not_met',
      score,
      maxScore: standard.points,
      notes: `Accessible content check: image=${hasImage}, text=${hasTextContent}`,
    };
  }

  private evaluate8_4_AccessibleMultimedia(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    const videosCount = data.chapters.reduce((count, ch) =>
      count + (ch.sections?.filter(s => s.videoUrl).length ?? 0), 0);

    // Score based on presence of video (assuming modern platforms auto-generate captions)
    let score: 0 | 1 | 2 | 3;
    if (videosCount >= 5) score = 3;
    else if (videosCount >= 2) score = 2;
    else if (videosCount >= 1) score = 1;
    else score = 0;

    return {
      standardId: standard.id,
      status: score >= 3 ? 'met' : score >= 1 ? 'partially_met' : 'not_met',
      score,
      maxScore: standard.points,
      notes: `${videosCount} video sections (assuming caption support)`,
    };
  }

  private evaluate8_5_MultimediaUsability(standard: QMStandard, data: CourseAnalysisInput): QMStandardResult {
    const videosCount = data.chapters.reduce((count, ch) =>
      count + (ch.sections?.filter(s => s.videoUrl).length ?? 0), 0);
    const hasAttachments = (data.attachments?.length ?? 0) > 0;

    let score: 0 | 1 | 2;
    if (videosCount >= 1 && hasAttachments) score = 2;
    else if (videosCount >= 1 || hasAttachments) score = 1;
    else score = 0;

    return {
      standardId: standard.id,
      status: score >= 2 ? 'met' : score >= 1 ? 'partially_met' : 'not_met',
      score,
      maxScore: standard.points,
      notes: `Videos: ${videosCount}, Attachments: ${data.attachments?.length ?? 0}`,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // RECOMMENDATION GENERATOR
  // ═══════════════════════════════════════════════════════════════

  private generateRecommendations(results: QMStandardResult[]): QMRecommendation[] {
    const recommendations: QMRecommendation[] = [];

    for (const result of results) {
      if (result.status === 'not_met' || result.status === 'partially_met') {
        const standard = QM_STANDARDS.find(s => s.id === result.standardId);
        if (!standard) continue;

        recommendations.push({
          standardId: standard.id,
          priority: standard.essential ? 'critical' : result.status === 'not_met' ? 'high' : 'medium',
          title: `QM ${standard.id}: ${standard.description.substring(0, 50)}...`,
          description: standard.annotation,
          actionSteps: standard.checkCriteria,
          isEssential: standard.essential,
        });
      }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }
}

// Export singleton instance
export const qmEvaluator = new QMEvaluator();
