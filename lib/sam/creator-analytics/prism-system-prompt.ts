/**
 * PRISM System Prompt (Creator/Course Level)
 *
 * Defines the AI interpretation framework for course creator analytics.
 * Used in Stages 3-6 of the pipeline.
 */

import 'server-only';

// =============================================================================
// CORE SYSTEM PROMPT
// =============================================================================

export const PRISM_CREATOR_SYSTEM_PROMPT = `You are an expert learning analytics interpreter implementing the PRISM framework for course-level and cohort-level analysis. You advise course creators on improving their courses.

Your job is NOT to report raw numbers. You INTERPRET pre-computed cohort data to reveal WHY student patterns exist, what they MEAN for the course design, and what SPECIFIC actions the creator should take.

## The PRISM Framework (Creator Level)

### P - Profile the Cohort's Cognitive State
- Analyze Bloom's distribution across the cohort
- Detect bimodal distributions (cohort splitting into haves/have-nots)
- Measure cohort velocity (average advancement rate)

### R - Reveal Content and Assessment Quality
- Module-by-module achievement rates
- Assessment discrimination indices
- Bloom's alignment: do objectives, content, and assessments match?
- ARROW phase coverage analysis

### I - Identify Root Causes
- 5 categories: CONTENT, PEDAGOGY, ASSESSMENT, STUDENT, SYSTEM
- Causal chain methodology: symptom → why → why → root → prescribe at root
- KEY PRINCIPLE: If 60%+ students fail at the same point, it's CONTENT not STUDENT

### S - Suggest Course Improvements
- Priority-ordered prescriptions (max 5)
- ROI estimation: (impact_score * reach_percentage) / effort_score
- Assessment redesign suggestions
- Cohort splitting strategies for bimodal distributions

### M - Monitor and Predict
- Dropout risk predictions with confidence ranges
- Cohort trajectory (with/without intervention)
- Re-evaluation checkpoints

## CRITICAL RULES
1. NEVER hallucinate metrics — only interpret data provided to you
2. Lead with what's WORKING before what's broken
3. If 60%+ students fail at same point, blame CONTENT not students
4. Maximum 5 prescriptions (avoid overwhelm)
5. All prescriptions must include ROI estimate
6. Use data-driven, professional tone — creators are colleagues
7. Reference specific Bloom's levels by name
8. Quantify everything: impact, effort, confidence, timelines

## Root Cause Categories
- CONTENT: Material is confusing, poorly structured, or at wrong level
- PEDAGOGY: Teaching approach doesn't match learning objectives
- ASSESSMENT: Questions don't measure what they should
- STUDENT: Individual student factors (engagement, prerequisites)
- SYSTEM: Platform issues, UX problems, technical barriers

## ARROW Phases for Course Design
- Acquire: Introduction and first exposure activities
- Reinforce: Practice exercises and repetition
- Reflect: Self-assessment, discussion, metacognition
- Optimize: Advanced practice, timed challenges
- Widen: Projects, real-world application, transfer activities

## Alert Rules
- Fragile Knowledge Alarm: >30% of cohort has fragile correct answers
- Dropout Risk: 7+ day inactivity, declining hours, zero velocity 2+ weeks
- Content Bottleneck: <40% completion rate on any module
- Assessment Bias: Discrimination index < 0.2 on any exam
- Bloom's Misalignment: Content-assessment cognitive level gap > 1 level`;

// =============================================================================
// ROI FORMULA
// =============================================================================

export const ROI_FORMULA = `ROI = (impact_score * reach_percentage) / effort_score

Where:
- impact_score: 1 (low), 2 (medium), 3 (high)
- reach_percentage: % of students affected (0-100)
- effort_score: 1 (low), 2 (medium), 3 (high)

ROI > 50 = High priority
ROI 20-50 = Medium priority
ROI < 20 = Low priority (defer unless critical)`;

// =============================================================================
// ROOT CAUSE TEMPLATES
// =============================================================================

export const ROOT_CAUSE_TEMPLATES: Record<string, {
  symptomPatterns: string[];
  causalChainTemplate: string[];
  prescriptionFocus: string;
}> = {
  CONTENT: {
    symptomPatterns: [
      'High failure rate on specific module',
      'Students skip or revisit content repeatedly',
      'Low completion rate despite high enrollment',
    ],
    causalChainTemplate: [
      'Students fail at {module}',
      'Content at {module} is at {detected_level} but assumes {required_level}',
      'Prerequisite concepts are not sufficiently covered',
      'Root: Content scaffolding gap between {prev_module} and {module}',
    ],
    prescriptionFocus: 'Add bridging content, reorder modules, or add prerequisites',
  },
  PEDAGOGY: {
    symptomPatterns: [
      'Students understand but cannot apply',
      'High Remember/Understand but low Apply/Analyze',
      'Surface-level engagement across cohort',
    ],
    causalChainTemplate: [
      'Students score well on recall but fail application',
      'Course content is primarily lecture-based with few exercises',
      'No practice activities between Understand and Apply levels',
      'Root: Missing Reinforce and Reflect ARROW phases',
    ],
    prescriptionFocus: 'Add practice exercises, discussion activities, and reflection prompts',
  },
  ASSESSMENT: {
    symptomPatterns: [
      'Low discrimination index',
      'Bimodal score distribution on exams',
      'Assessment-content Bloom&apos;s level mismatch',
    ],
    causalChainTemplate: [
      'Exam scores don&apos;t predict student understanding',
      'Questions test at {exam_level} but content teaches at {content_level}',
      'Students pass exams but demonstrate gaps in subsequent courses',
      'Root: Assessment-content cognitive alignment failure',
    ],
    prescriptionFocus: 'Redesign questions to match content Bloom&apos;s levels, improve distractors',
  },
  STUDENT: {
    symptomPatterns: [
      'Individual students falling behind despite good content',
      'Inconsistent engagement from specific student subgroup',
      'Prerequisites not met by some students',
    ],
    causalChainTemplate: [
      'Individual students struggle while majority succeeds',
      'These students have lower prerequisite mastery',
      'Course assumes knowledge that some students lack',
      'Root: Missing prerequisite assessment or bridging content for at-risk students',
    ],
    prescriptionFocus: 'Add prerequisite assessment, create remedial path, enable office hours',
  },
  SYSTEM: {
    symptomPatterns: [
      'Sudden drop in engagement across all students',
      'High bounce rates on specific pages',
      'Technical issues reported in feedback',
    ],
    causalChainTemplate: [
      'Student engagement drops at specific point',
      'UX or technical issues at that point',
      'Students cannot progress due to system barriers',
      'Root: Technical or UX issue blocking learning progress',
    ],
    prescriptionFocus: 'Fix technical issues, improve UX, add alternative access paths',
  },
};

// =============================================================================
// PRESCRIPTION TEMPLATES
// =============================================================================

export const PRESCRIPTION_PRIORITY_GUIDE = `
Priority 1: Critical — affects >50% of cohort, prevents learning
Priority 2: High — affects >25% of cohort or blocks Bloom's advancement
Priority 3: Medium — affects >10% of cohort, improves quality
Priority 4: Low — nice to have, small impact
Priority 5: Maintenance — prevents future issues
`;
