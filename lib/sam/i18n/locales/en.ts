/**
 * English (en) Translation Dictionary
 *
 * Default language. All keys defined here serve as the canonical set
 * that other locales should translate.
 */

import type { TranslationDictionary } from '../types';

const en: TranslationDictionary = {
  // =========================================================================
  // MODE GREETINGS (all 30 modes)
  // =========================================================================

  // General
  'mode.general-assistant.greeting': "I'm your General Assistant. How can I help you?",

  // Content & Creation
  'mode.content-creator.greeting': "I'm now working as your Content Creator. What would you like me to create?",
  'mode.adaptive-content.greeting': "I'm in Adaptive Content mode. I'll personalize content to your learning level.",
  'mode.microlearning.greeting': "I'm in Microlearning mode. I'll create bite-sized learning modules for you.",
  'mode.multimedia.greeting': 'I\'m in Multimedia Creator mode. Describe what multimedia content you need.',

  // Analysis & Taxonomy
  'mode.blooms-analyzer.greeting': "I'm in Bloom's Taxonomy Analyzer mode. Share any text and I'll analyze its cognitive levels.",
  'mode.depth-analysis.greeting': "I'm in Depth Analysis mode. I'll provide multi-framework analysis of your content.",
  'mode.cognitive-load.greeting': "I'm analyzing cognitive load. Share your learning material.",
  'mode.alignment-checker.greeting': "I'm in Alignment Checker mode. I'll verify alignment between objectives, content, and assessments.",
  'mode.scaffolding.greeting': "I'm in Scaffolding Evaluator mode. I'll analyze how well your content supports learners.",
  'mode.zpd-evaluator.greeting': "I'm in ZPD Evaluator mode. I'll assess content difficulty relative to learner capability.",

  // Learning & Coaching
  'mode.learning-coach.greeting': "I'm your Learning Coach. What are you working on?",
  'mode.socratic-tutor.greeting': "I'm in Socratic Tutor mode. What concept shall we explore together?",
  'mode.study-planner.greeting': 'I\'m your Study Planner. What do you need to learn and by when?',
  'mode.mastery-tracker.greeting': "I'm tracking your mastery. Let me review your progress.",
  'mode.spaced-repetition.greeting': "I'm in Spaced Repetition mode. I'll optimize your review schedule for long-term retention.",
  'mode.metacognition.greeting': "I'm your Metacognition Coach. Let's reflect on how you learn best.",
  'mode.skill-tracker.greeting': "I'm in Skill Tracker mode. I'll map your competencies and identify growth areas.",

  // Assessment & Evaluation
  'mode.exam-builder.greeting': "I'm in Exam Builder mode. Tell me what assessment you need.",
  'mode.practice-problems.greeting': 'I\'m in Practice Problems mode. What topic should I create problems for?',
  'mode.evaluation.greeting': "I'm in Evaluation mode. Share an answer and I'll assess it.",
  'mode.integrity-checker.greeting': "I'm in Integrity Checker mode. I'll review content for academic integrity concerns.",

  // Research & Resources
  'mode.research-assistant.greeting': 'I\'m in Research mode. What topic would you like me to investigate?',
  'mode.resource-finder.greeting': 'I\'m in Resource Finder mode. What learning resources are you looking for?',
  'mode.trends-analyzer.greeting': 'I\'m in Trends Analyzer mode. What educational trends should I analyze?',

  // Course Design
  'mode.course-architect.greeting': "I'm your Course Architect. Describe the course you'd like to design.",
  'mode.knowledge-graph.greeting': "I'm in Knowledge Graph mode. I'll map concept relationships and prerequisites.",
  'mode.competency-mapper.greeting': "I'm in Competency Mapper mode. I'll map skills to curriculum objectives.",

  // Insights & Analytics
  'mode.analytics.greeting': 'I\'m in Learning Analytics mode. What learning data should I analyze?',
  'mode.predictive.greeting': "I'm in Predictive Outcomes mode. I'll forecast learning outcomes based on current data.",
  'mode.market-analysis.greeting': 'I\'m in Market Analysis mode. What educational market data should I analyze?',
  'mode.collaboration.greeting': "I'm in Collaboration Insights mode. I'll analyze group learning dynamics.",

  // =========================================================================
  // DEGRADED MODE RESPONSES
  // =========================================================================
  'degraded.GREETING': "Hi! I'm running in limited mode right now, but I'm still here to help with basic questions.",
  'degraded.QUESTION': "I'm experiencing connectivity issues. Based on your page context, I can offer limited assistance.",
  'degraded.TOOL_REQUEST': 'Tool execution is temporarily unavailable. Please try again shortly.',
  'degraded.CONTENT_GENERATE': 'Content generation is briefly offline. I can still help with simple questions.',
  'degraded.ASSESSMENT': 'Assessment features are temporarily limited. Try again in a moment.',
  'degraded.DEFAULT': "I'm temporarily operating with reduced capabilities. Basic assistance is still available.",

  // =========================================================================
  // SYSTEM MESSAGES
  // =========================================================================
  'system.welcome': 'Welcome to SAM AI Tutor!',
  'system.error.generic': 'Something went wrong. Please try again.',
  'system.error.timeout': 'The request took too long. Please try again.',
  'system.error.rateLimit': "You're sending messages too quickly. Please wait a moment.",
  'system.retry': 'Try again',
  'system.getHelp': 'Get help',
  'system.processing': 'Thinking...',
  'system.streaming': 'Responding...',

  // =========================================================================
  // UI LABELS
  // =========================================================================
  'ui.modeDropdown.smartAuto': 'Smart Auto',
  'ui.modeDropdown.smartAutoDesc': 'Automatically selects the best mode',
  'ui.modeDropdown.recent': 'Recent',
  'ui.modeDropdown.favorites': 'Favorites',
  'ui.modeDropdown.searchPlaceholder': 'Search modes...',
  'ui.chat.inputPlaceholder': 'Ask SAM anything...',
  'ui.chat.send': 'Send',
  'ui.suggestions.modeSwitchPrefix': 'Switch to',
  'ui.suggestions.modeSwitchConfirm': 'Switch',
};

export default en;
