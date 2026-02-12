/**
 * General (Fallback) Category Prompt Enhancer
 *
 * Used when no domain-specific enhancer matches the course category.
 * Provides minimal but useful domain-neutral guidance that complements
 * the core pedagogical framework in prompts.ts.
 */

import type { CategoryPromptEnhancer } from './types';

export const generalEnhancer: CategoryPromptEnhancer = {
  categoryId: 'general',
  displayName: 'General (Default)',
  matchesCategories: [], // Matches nothing — used as explicit fallback

  domainExpertise: `You are also a versatile educator experienced across multiple disciplines, capable of adapting your teaching approach to the specific subject matter and audience needs.`,

  teachingMethodology: `## GENERAL TEACHING METHODOLOGY
- Start each chapter with a motivating question or real-world scenario
- Alternate between theory and practice — never have more than 2 consecutive theory sections
- Include examples from the learner's likely professional context
- Use analogies to connect new concepts to familiar experiences
- Provide opportunities for active engagement in every section`,

  bloomsInDomain: {
    REMEMBER: {
      means: 'Recall key terminology, facts, definitions, and frameworks',
      exampleObjectives: [
        'List the key concepts and terminology introduced in this chapter',
        'Identify the main frameworks and their components',
      ],
      exampleActivities: [
        'Terminology matching exercise',
        'Key concept identification from examples',
      ],
    },
    APPLY: {
      means: 'Use learned concepts and frameworks to address real scenarios',
      exampleObjectives: [
        'Apply the framework to analyze a real-world scenario',
        'Use the techniques learned to solve a practical problem',
      ],
      exampleActivities: [
        'Case study analysis with guided questions',
        'Practice exercise applying the technique to a new context',
      ],
    },
    CREATE: {
      means: 'Produce original work that synthesizes course concepts',
      exampleObjectives: [
        'Design an original solution or plan using course concepts',
        'Create a deliverable that demonstrates mastery of the topic',
      ],
      exampleActivities: [
        'Capstone project combining multiple chapter concepts',
        'Portfolio piece demonstrating real-world application',
      ],
    },
  },

  contentTypeGuidance: `## GENERAL CONTENT TYPE GUIDANCE
- Balance theory (reading/video) with practice (assignment/project) at roughly 40/60
- Use video for demonstrations and visual concepts
- Use reading for in-depth conceptual material
- Use assignments for hands-on practice and skill building
- Use projects for synthesis and real-world application
- Use quizzes sparingly for knowledge verification checkpoints`,

  qualityCriteria: `## GENERAL QUALITY CRITERIA
- Every chapter should clearly answer "Why does this matter to the learner?"
- Every section should have a clear, single learning outcome
- Content should be specific to the course topic, not generic filler
- Examples should be relevant to the target audience's context
- Activities should produce observable evidence of learning`,

  chapterSequencingAdvice: `## GENERAL CHAPTER SEQUENCING
- Start with foundational concepts that later chapters build upon
- Progress from simple/concrete to complex/abstract
- Place practice-heavy chapters after theory-heavy ones
- End with synthesis chapters that integrate multiple concepts
- Ensure every chapter has clear prerequisites from earlier chapters`,

  activityExamples: {
    video: 'Concept demonstration with real-world examples and visual aids.',
    reading: 'In-depth exploration with examples, case studies, and reflection questions.',
    assignment: 'Hands-on practice exercise applying the chapter concepts to a realistic scenario.',
    quiz: 'Knowledge check with concept verification and scenario-based questions.',
    project: 'Multi-concept integration project producing a real deliverable.',
    discussion: 'Peer discussion on application of concepts to different contexts.',
  },
};
