/**
 * SAM Mode Registry
 *
 * All 30 mode definitions covering SAM's full engine landscape.
 * Each mode specifies its engine pipeline, system prompt addition,
 * greeting message, and allowed tool categories.
 */

import type { SAMMode, SAMModeId } from './types';
import { getTranslation } from '@/lib/sam/i18n';

const MODES: Record<SAMModeId, SAMMode> = {
  // =========================================================================
  // GENERAL
  // =========================================================================
  'general-assistant': {
    id: 'general-assistant',
    label: 'General Assistant',
    category: 'general',
    greeting: "I'm your General Assistant. How can I help you?",
    enginePreset: ['response'],
    systemPromptAddition: '',
    allowedToolCategories: ['external', 'content', 'system', 'communication'],
    engineConfig: { adaptationStrategy: 'auto', outputFormat: 'conversational', contentFocus: 'general' },
  },

  // =========================================================================
  // CONTENT & CREATION
  // =========================================================================
  'content-creator': {
    id: 'content-creator',
    label: 'Content Creator',
    category: 'content',
    greeting: "I'm now working as your Content Creator. What would you like me to create?",
    enginePreset: ['blooms', 'content', 'response'],
    systemPromptAddition:
      'You are in Content Creator mode. Focus on generating high-quality educational content. ' +
      'Apply Bloom\'s Taxonomy to ensure appropriate cognitive levels. ' +
      'Structure content with clear learning objectives and assessments.',
    allowedToolCategories: ['content', 'external'],
    engineConfig: { outputFormat: 'structured', bloomsAlignment: true, contentFocus: 'creation' },
  },
  'adaptive-content': {
    id: 'adaptive-content',
    label: 'Adaptive Content',
    category: 'content',
    greeting: "I'm in Adaptive Content mode. I'll personalize content to your learning level.",
    enginePreset: ['personalization', 'content', 'response'],
    systemPromptAddition:
      'You are in Adaptive Content mode. Tailor all content to the learner\'s current level, ' +
      'preferences, and learning style. Adjust complexity dynamically.',
    allowedToolCategories: ['content', 'external'],
    engineConfig: { adaptationStrategy: 'learner-level', contentFocus: 'personalized', adjustDifficulty: true },
  },
  'microlearning': {
    id: 'microlearning',
    label: 'Microlearning Generator',
    category: 'content',
    greeting: "I'm in Microlearning mode. I'll create bite-sized learning modules for you.",
    enginePreset: ['content', 'response'],
    systemPromptAddition:
      'You are in Microlearning mode. Create focused, bite-sized learning modules (3-5 min). ' +
      'Each module should cover one concept with a clear objective and a quick check.',
    allowedToolCategories: ['content'],
    engineConfig: { maxResponseLength: 'short', outputFormat: 'structured', contentFocus: 'explanation' },
  },
  'multimedia': {
    id: 'multimedia',
    label: 'Multimedia Creator',
    category: 'content',
    greeting: "I'm in Multimedia Creator mode. Describe what multimedia content you need.",
    enginePreset: ['content', 'response'],
    systemPromptAddition:
      'You are in Multimedia Creator mode. Help design multimedia learning experiences ' +
      'including text, suggested visuals, interactive elements, and assessment activities.',
    allowedToolCategories: ['content', 'external'],
    engineConfig: { outputFormat: 'structured', contentFocus: 'multimedia-suggestions' },
  },

  // =========================================================================
  // ANALYSIS & TAXONOMY
  // =========================================================================
  'blooms-analyzer': {
    id: 'blooms-analyzer',
    label: "Bloom's Analyzer",
    category: 'analysis',
    greeting: "I'm in Bloom's Taxonomy Analyzer mode. Share any text and I'll analyze its cognitive levels.",
    enginePreset: ['blooms', 'response'],
    systemPromptAddition:
      'You are in Bloom\'s Taxonomy Analyzer mode. Analyze all content through the lens of ' +
      'Bloom\'s six cognitive levels (Remember, Understand, Apply, Analyze, Evaluate, Create). ' +
      'Provide detailed distribution analysis and recommendations for cognitive balance.',
    allowedToolCategories: ['external'],
    engineConfig: { analysisDepth: 'comprehensive', outputFormat: 'structured', showDistribution: true },
  },
  'depth-analysis': {
    id: 'depth-analysis',
    label: 'Depth Analysis',
    category: 'analysis',
    greeting: "I'm in Depth Analysis mode. I'll provide multi-framework analysis of your content.",
    enginePreset: ['blooms', 'content', 'response'],
    systemPromptAddition:
      'You are in Depth Analysis mode. Provide comprehensive multi-framework analysis ' +
      'using Bloom\'s Taxonomy, Webb\'s Depth of Knowledge, and SOLO Taxonomy. ' +
      'Compare findings across frameworks for actionable insights.',
    allowedToolCategories: ['external'],
    engineConfig: { multiFramework: true, frameworks: ['blooms', 'webbs', 'solo'], showComparison: true },
  },
  'cognitive-load': {
    id: 'cognitive-load',
    label: 'Cognitive Load Analyzer',
    category: 'analysis',
    greeting: "I'm analyzing cognitive load. Share your learning material.",
    enginePreset: ['blooms', 'response'],
    systemPromptAddition:
      'You are in Cognitive Load Analyzer mode. Evaluate intrinsic, extraneous, and germane ' +
      'cognitive load in learning materials. Suggest restructuring to optimize cognitive resources.',
    allowedToolCategories: ['external'],
    engineConfig: { splitAttention: true, redundancy: true, optimizeSuggestions: true },
  },
  'alignment-checker': {
    id: 'alignment-checker',
    label: 'Alignment Checker',
    category: 'analysis',
    greeting: "I'm in Alignment Checker mode. I'll verify alignment between objectives, content, and assessments.",
    enginePreset: ['blooms', 'content', 'response'],
    systemPromptAddition:
      'You are in Alignment Checker mode. Verify constructive alignment between learning objectives, ' +
      'instructional activities, and assessment tasks. Identify misalignments and suggest corrections.',
    allowedToolCategories: ['external'],
    engineConfig: { checkAlignment: true, showMatrix: true, suggestCorrections: true },
  },
  'scaffolding': {
    id: 'scaffolding',
    label: 'Scaffolding Evaluator',
    category: 'analysis',
    greeting: "I'm in Scaffolding Evaluator mode. I'll analyze how well your content supports learners.",
    enginePreset: ['blooms', 'personalization', 'response'],
    systemPromptAddition:
      'You are in Scaffolding Evaluator mode. Analyze instructional scaffolding: ' +
      'prerequisite support, guided practice, gradual release of responsibility, and differentiation.',
    allowedToolCategories: ['external'],
    engineConfig: { evaluatePrerequisites: true, gradualRelease: true, differentiationLevel: 'adaptive' },
  },
  'zpd-evaluator': {
    id: 'zpd-evaluator',
    label: 'ZPD Evaluator',
    category: 'analysis',
    greeting: "I'm in ZPD Evaluator mode. I'll assess content difficulty relative to learner capability.",
    enginePreset: ['personalization', 'response'],
    systemPromptAddition:
      'You are in Zone of Proximal Development (ZPD) Evaluator mode. Assess whether content ' +
      'falls within the learner\'s ZPD. Identify what support is needed to bridge skill gaps.',
    allowedToolCategories: ['external'],
    engineConfig: { zpdMapping: true, supportSuggestions: true, difficultyCalibration: true },
  },

  // =========================================================================
  // LEARNING & COACHING
  // =========================================================================
  'learning-coach': {
    id: 'learning-coach',
    label: 'Learning Coach',
    category: 'learning',
    greeting: "I'm your Learning Coach. What are you working on?",
    enginePreset: ['blooms', 'personalization', 'response'],
    systemPromptAddition:
      'You are in Learning Coach mode. Provide personalized guidance based on the learner\'s ' +
      'current progress, strengths, and areas for improvement. Be encouraging but honest.',
    allowedToolCategories: ['content', 'external', 'system'],
    engineConfig: { adaptationStrategy: 'pace', encouragementLevel: 'high', includeReflection: true },
  },
  'socratic-tutor': {
    id: 'socratic-tutor',
    label: 'Socratic Tutor',
    category: 'learning',
    greeting: "I'm in Socratic Tutor mode. What concept shall we explore together?",
    enginePreset: ['blooms', 'response'],
    systemPromptAddition:
      'You are in Socratic Tutor mode. Guide learning through questions rather than direct answers. ' +
      'Use the Socratic method: ask probing questions, challenge assumptions, and help learners ' +
      'discover understanding through their own reasoning.',
    allowedToolCategories: ['external'],
    engineConfig: { questioningStyle: 'guided', maxDirectAnswers: 0, scaffoldingLevel: 'adaptive' },
  },
  'study-planner': {
    id: 'study-planner',
    label: 'Study Planner',
    category: 'learning',
    greeting: "I'm your Study Planner. What do you need to learn and by when?",
    enginePreset: ['personalization', 'response'],
    systemPromptAddition:
      'You are in Study Planner mode. Help create structured, time-bound study plans. ' +
      'Consider available time, learning goals, difficulty levels, and optimal session lengths.',
    allowedToolCategories: ['system', 'communication'],
    engineConfig: { planFormat: 'weekly', includeBreaks: true, adaptToSchedule: true },
  },
  'mastery-tracker': {
    id: 'mastery-tracker',
    label: 'Mastery Tracker',
    category: 'learning',
    greeting: "I'm tracking your mastery. Let me review your progress.",
    enginePreset: ['personalization', 'response'],
    systemPromptAddition:
      'You are in Mastery Tracker mode. Monitor and report on skill mastery levels. ' +
      'Track progress toward competency thresholds and recommend focused practice areas.',
    allowedToolCategories: ['system'],
    engineConfig: { showProgressChart: true, identifyGaps: true, suggestReview: true },
  },
  'spaced-repetition': {
    id: 'spaced-repetition',
    label: 'Spaced Repetition',
    category: 'learning',
    greeting: "I'm in Spaced Repetition mode. I'll optimize your review schedule for long-term retention.",
    enginePreset: ['personalization', 'response'],
    systemPromptAddition:
      'You are in Spaced Repetition mode. Apply evidence-based spacing algorithms to optimize ' +
      'review timing. Schedule reviews at increasing intervals based on retention strength.',
    allowedToolCategories: ['system', 'communication'],
    engineConfig: { algorithm: 'sm2', showSchedule: true, adaptDifficulty: true },
  },
  'metacognition': {
    id: 'metacognition',
    label: 'Metacognition Coach',
    category: 'learning',
    greeting: "I'm your Metacognition Coach. Let's reflect on how you learn best.",
    enginePreset: ['personalization', 'response'],
    systemPromptAddition:
      'You are in Metacognition Coach mode. Help learners develop self-awareness about their ' +
      'learning processes. Guide reflection on strategies, self-monitoring, and self-regulation.',
    allowedToolCategories: ['external'],
    engineConfig: { reflectionPrompts: true, selfAssessment: true, strategyCoaching: true },
  },
  'skill-tracker': {
    id: 'skill-tracker',
    label: 'Skill Tracker',
    category: 'learning',
    greeting: "I'm in Skill Tracker mode. I'll map your competencies and identify growth areas.",
    enginePreset: ['personalization', 'response'],
    systemPromptAddition:
      'You are in Skill Tracker mode. Map and track skill development across competency frameworks. ' +
      'Identify skill gaps and recommend learning paths to fill them.',
    allowedToolCategories: ['system'],
    engineConfig: { showCompetencyMap: true, identifyStrengths: true, careerAlignment: true },
  },

  // =========================================================================
  // ASSESSMENT & EVALUATION
  // =========================================================================
  'exam-builder': {
    id: 'exam-builder',
    label: 'Exam Builder',
    category: 'assessment',
    greeting: "I'm in Exam Builder mode. Tell me what assessment you need.",
    enginePreset: ['blooms', 'assessment', 'response'],
    systemPromptAddition:
      'You are in Exam Builder mode. Create well-structured assessments with questions targeting ' +
      'specific Bloom\'s levels. Include rubrics, answer keys, and difficulty distribution.',
    allowedToolCategories: ['content'],
    engineConfig: { rubricGeneration: true, bloomsAlignment: true, difficultySpread: true },
  },
  'practice-problems': {
    id: 'practice-problems',
    label: 'Practice Problems',
    category: 'assessment',
    greeting: "I'm in Practice Problems mode. What topic should I create problems for?",
    enginePreset: ['blooms', 'content', 'response'],
    systemPromptAddition:
      'You are in Practice Problems mode. Generate progressive practice problems that build ' +
      'from basic recall to higher-order thinking. Include worked examples and hints.',
    allowedToolCategories: ['content'],
    engineConfig: { adaptiveDifficulty: true, hintSystem: true, stepByStep: true },
  },
  'evaluation': {
    id: 'evaluation',
    label: 'Answer Evaluator',
    category: 'assessment',
    greeting: "I'm in Evaluation mode. Share an answer and I'll assess it.",
    enginePreset: ['blooms', 'response'],
    systemPromptAddition:
      'You are in Answer Evaluator mode. Assess student responses against rubrics and learning objectives. ' +
      'Provide constructive feedback with specific improvement suggestions.',
    allowedToolCategories: ['external'],
    engineConfig: { detailedFeedback: true, rubricBased: true, improvementSuggestions: true },
  },
  'integrity-checker': {
    id: 'integrity-checker',
    label: 'Integrity Checker',
    category: 'assessment',
    greeting: "I'm in Integrity Checker mode. I'll review content for academic integrity concerns.",
    enginePreset: ['content', 'response'],
    systemPromptAddition:
      'You are in Integrity Checker mode. Analyze content for potential academic integrity concerns ' +
      'including originality, proper attribution, and assessment security.',
    allowedToolCategories: ['external'],
    engineConfig: { checkPatterns: true, sourceSuggestions: true, educationalGuidance: true },
  },

  // =========================================================================
  // RESEARCH & RESOURCES
  // =========================================================================
  'research-assistant': {
    id: 'research-assistant',
    label: 'Research Assistant',
    category: 'research',
    greeting: "I'm in Research mode. What topic would you like me to investigate?",
    enginePreset: ['content', 'response'],
    systemPromptAddition:
      'You are in Research Assistant mode. Help find, synthesize, and organize research information. ' +
      'Cite sources, evaluate credibility, and present findings in structured format.',
    allowedToolCategories: ['external', 'content'],
    engineConfig: { maxResponseLength: 'long', outputFormat: 'prose', contentFocus: 'resources' },
  },
  'resource-finder': {
    id: 'resource-finder',
    label: 'Resource Finder',
    category: 'research',
    greeting: "I'm in Resource Finder mode. What learning resources are you looking for?",
    enginePreset: ['content', 'response'],
    systemPromptAddition:
      'You are in Resource Finder mode. Help discover and recommend relevant learning resources ' +
      'including articles, videos, courses, and tools matched to learning objectives.',
    allowedToolCategories: ['external'],
    engineConfig: { outputFormat: 'bullet-points', contentFocus: 'resources' },
  },
  'trends-analyzer': {
    id: 'trends-analyzer',
    label: 'Trends Analyzer',
    category: 'research',
    greeting: "I'm in Trends Analyzer mode. What educational trends should I analyze?",
    enginePreset: ['content', 'response'],
    systemPromptAddition:
      'You are in Trends Analyzer mode. Identify and analyze trends in education, technology, ' +
      'and learning methodologies. Provide data-driven insights.',
    allowedToolCategories: ['external'],
    engineConfig: { timeRange: 'yearly', visualize: true, predictive: true },
  },

  // =========================================================================
  // COURSE DESIGN
  // =========================================================================
  'course-architect': {
    id: 'course-architect',
    label: 'Course Architect',
    category: 'course-design',
    greeting: "I'm your Course Architect. Describe the course you'd like to design.",
    enginePreset: ['blooms', 'content', 'personalization', 'response'],
    systemPromptAddition:
      'You are in Course Architect mode. Design comprehensive course structures with aligned ' +
      'objectives, content sequences, assessments, and learning activities. Apply backward design.',
    allowedToolCategories: ['content', 'external'],
    engineConfig: { backwardDesign: true, alignmentMatrix: true, pacing: true },
  },
  'knowledge-graph': {
    id: 'knowledge-graph',
    label: 'Knowledge Graph',
    category: 'course-design',
    greeting: "I'm in Knowledge Graph mode. I'll map concept relationships and prerequisites.",
    enginePreset: ['content', 'response'],
    systemPromptAddition:
      'You are in Knowledge Graph mode. Map conceptual relationships, prerequisites, and ' +
      'learning dependencies. Identify optimal learning sequences based on concept hierarchy.',
    allowedToolCategories: ['external'],
    engineConfig: { outputFormat: 'structured', contentFocus: 'relationships' },
  },
  'competency-mapper': {
    id: 'competency-mapper',
    label: 'Competency Mapper',
    category: 'course-design',
    greeting: "I'm in Competency Mapper mode. I'll map skills to curriculum objectives.",
    enginePreset: ['blooms', 'content', 'response'],
    systemPromptAddition:
      'You are in Competency Mapper mode. Map competencies, skills, and outcomes to curriculum ' +
      'elements. Ensure comprehensive coverage with no gaps in skill development.',
    allowedToolCategories: ['content'],
    engineConfig: { frameworkAlignment: true, careerMapping: true, progressTracking: true },
  },
  'skill-roadmap-builder': {
    id: 'skill-roadmap-builder',
    label: 'Skill Roadmap Builder',
    category: 'course-design',
    greeting:
      "I'm ready to help you build a personalized skill development roadmap! " +
      "Tell me what skill you'd like to master, and I'll guide you through creating " +
      'a structured learning path with courses, projects, and milestones.',
    enginePreset: ['blooms', 'personalization', 'content', 'response'],
    systemPromptAddition:
      'You are in Skill Roadmap Builder mode with access to the sam-skill-roadmap-generator tool. ' +
      'When a user wants to create a skill roadmap, use the tool to conversationally collect information. ' +
      'The tool will guide you through gathering: 1) Skill name, 2) Current proficiency level (NOVICE to STRATEGIST), ' +
      '3) Target level, 4) Hours per week available, 5) Learning style preference (STRUCTURED, PROJECT_BASED, MIXED), ' +
      '6) Whether to include assessments, 7) Whether to prioritize quick wins. ' +
      "Present the tool's options in a friendly, conversational way. " +
      'When the tool returns triggerGeneration: true, inform the user that roadmap generation is starting. ' +
      "Apply Bloom's Taxonomy principles to explain the learning progression.",
    allowedToolCategories: ['content', 'external', 'system'],
    engineConfig: {
      bloomsAlignment: true,
      adaptationStrategy: 'learner-level',
      outputFormat: 'structured',
      contentFocus: 'creation',
      scaffoldingLevel: 'adaptive',
      showProgressChart: true,
      identifyGaps: true,
      careerAlignment: true,
      backwardDesign: true,
      pacing: true,
    },
  },

  // =========================================================================
  // INSIGHTS & ANALYTICS
  // =========================================================================
  'analytics': {
    id: 'analytics',
    label: 'Learning Analytics',
    category: 'insights',
    greeting:
      "I'm in Learning Analytics mode. I can show you detailed insights about your learning progress, " +
      "study patterns, and skill development. Just say 'show my analytics' or tell me what you'd like to explore!",
    enginePreset: ['personalization', 'response'],
    systemPromptAddition:
      'You are in Learning Analytics mode with access to the sam-learning-analytics tool. ' +
      'When a user wants to see their analytics, progress, or learning data, use the tool to conversationally collect preferences. ' +
      'The tool will guide you through gathering: 1) Scope (course, skills, goals, or comprehensive), ' +
      '2) Specific course (if applicable), 3) Time range (7d, 30d, 90d, or all time), ' +
      '4) Metric focus (progress, time, mastery, engagement, or all), 5) Whether to include AI recommendations. ' +
      "Present the tool's options in a friendly, conversational way. " +
      'When the tool returns triggerGeneration: true, inform the user that analytics generation is starting. ' +
      'Provide actionable insights and explain trends in an encouraging, supportive manner.',
    allowedToolCategories: ['external', 'content'],
    engineConfig: { showCharts: true, comparativeAnalysis: true, trendDetection: true },
  },
  'predictive': {
    id: 'predictive',
    label: 'Predictive Outcomes',
    category: 'insights',
    greeting: "I'm in Predictive Outcomes mode. I'll forecast learning outcomes based on current data.",
    enginePreset: ['personalization', 'response'],
    systemPromptAddition:
      'You are in Predictive Outcomes mode. Use available data to predict learning outcomes, ' +
      'identify at-risk learners, and recommend early interventions.',
    allowedToolCategories: ['external'],
    engineConfig: { riskAssessment: true, earlyWarning: true, interventionSuggestions: true },
  },
  'market-analysis': {
    id: 'market-analysis',
    label: 'Market Analysis',
    category: 'insights',
    greeting: "I'm in Market Analysis mode. What educational market data should I analyze?",
    enginePreset: ['content', 'response'],
    systemPromptAddition:
      'You are in Market Analysis mode. Analyze educational market trends, competition, ' +
      'and opportunities for course positioning and content strategy.',
    allowedToolCategories: ['external'],
    engineConfig: { jobMarketData: true, skillDemand: true, salaryInsights: true },
  },
  'collaboration': {
    id: 'collaboration',
    label: 'Collaboration Insights',
    category: 'insights',
    greeting: "I'm in Collaboration Insights mode. I'll analyze group learning dynamics.",
    enginePreset: ['personalization', 'response'],
    systemPromptAddition:
      'You are in Collaboration Insights mode. Analyze collaborative learning patterns, ' +
      'group dynamics, and social learning effectiveness. Suggest improvements for group work.',
    allowedToolCategories: ['external'],
    engineConfig: { groupMetrics: true, peerMatching: true, contributionTracking: true },
  },
};

/** Get a mode by ID */
export function getModeById(modeId: string): SAMMode | undefined {
  return MODES[modeId as SAMModeId];
}

/** Get all modes */
export function getAllModes(): SAMMode[] {
  return Object.values(MODES);
}

/** Get modes by category */
export function getModesByCategory(category: string): SAMMode[] {
  return Object.values(MODES).filter((m) => m.category === category);
}

/**
 * Get a localized greeting for a mode.
 *
 * Resolution:
 * 1. i18n translation via greetingKey (if locale loaded)
 * 2. i18n translation via convention `mode.{modeId}.greeting`
 * 3. Fallback to mode.greeting (English hardcoded string)
 */
export function getLocalizedGreeting(modeId: string, locale?: string): string {
  const mode = MODES[modeId as SAMModeId];
  if (!mode) return '';

  // Try explicit greetingKey first, then convention-based key
  const key = mode.greetingKey ?? `mode.${modeId}.greeting`;
  const translated = getTranslation(key, locale, mode.greeting);
  return translated;
}
