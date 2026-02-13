/**
 * Exam Generation Prompts
 *
 * Stage-specific prompt builders for the 5-stage agentic exam pipeline.
 * Each stage prompt combines the gold standard system prompt with
 * stage-specific instructions and structured output requirements.
 */

import type { BloomsLevel } from '@prisma/client';
import type {
  StagePrompt,
  ExamBuilderParams,
  DecomposedConcept,
  PlannedQuestion,
  GeneratedQuestion,
} from './agentic-types';
import { BLOOM_EXAM_SYSTEM_PROMPT, BLOOM_LEVEL_REASONING } from './bloom-system-prompt';
import {
  BLOOM_DISTRIBUTION_PROFILES,
  QUESTION_TYPE_MATRIX,
  BLOOMS_LEVEL_CONFIG,
} from './helpers';

// =============================================================================
// STAGE 1: TOPIC DECOMPOSITION
// =============================================================================

/**
 * Break the exam topic into 5-15 concepts with prerequisites and misconceptions.
 */
export function buildStage1Prompt(params: ExamBuilderParams): StagePrompt {
  const subtopicGuidance =
    params.subtopics === 'auto'
      ? 'Decompose the topic into its essential subtopics automatically.'
      : `Focus on these specific subtopics: ${params.subtopics.join(', ')}`;

  const userPrompt = `Decompose the following exam topic into 5-15 key concepts for a ${params.studentLevel}-level ${params.examPurpose} exam.

Topic: ${params.topic}
${subtopicGuidance}
Student Level: ${params.studentLevel}
Exam Purpose: ${params.examPurpose}
Question Count: ${params.questionCount}

For each concept, provide:
1. name: A concise concept name
2. description: What this concept covers (1-2 sentences)
3. prerequisites: Other concepts the student must understand first (by name)
4. commonMisconceptions: 2-3 common mistakes or misunderstandings students have
5. importance: "core" (must test), "supporting" (should test if room), or "advanced" (stretch goal)

Ensure concepts are ordered from foundational to advanced.
Ensure at least 3 concepts are marked "core".

Respond with a JSON array of concept objects. No markdown, no prose.

Example format:
[
  {
    "name": "Neural Network Architecture",
    "description": "The structure of layers, neurons, and connections in a neural network",
    "prerequisites": [],
    "commonMisconceptions": [
      "All neural networks have the same architecture",
      "More layers always means better performance"
    ],
    "importance": "core"
  }
]`;

  return {
    systemPrompt: BLOOM_EXAM_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 3000,
    temperature: 0.4,
  };
}

// =============================================================================
// STAGE 2: BLOOM'S DISTRIBUTION PLANNING
// =============================================================================

/**
 * Plan which questions to generate: concept x Bloom&apos;s level x format.
 */
export function buildStage2Prompt(
  params: ExamBuilderParams,
  concepts: DecomposedConcept[]
): StagePrompt {
  // Resolve distribution profile
  const profile =
    params.bloomsDistribution !== 'auto'
      ? params.bloomsDistribution
      : BLOOM_DISTRIBUTION_PROFILES[params.examPurpose];

  const profileStr = Object.entries(profile)
    .map(([level, pct]) => `${level}: ${pct}%`)
    .join(', ');

  const conceptList = concepts
    .map(
      (c) =>
        `- ${c.name} (${c.importance}): ${c.description}`
    )
    .join('\n');

  const formatList = params.questionFormats.join(', ');

  const typeMatrixStr = Object.entries(QUESTION_TYPE_MATRIX)
    .map(([level, formats]) => `${level}: ${formats.join(', ')}`)
    .join('\n');

  const userPrompt = `Create a question distribution plan for a ${params.questionCount}-question ${params.examPurpose} exam.

Target Bloom&apos;s Distribution: ${profileStr}
Available Question Formats: ${formatList}
Student Level: ${params.studentLevel}

Concepts to cover:
${conceptList}

Question Type Matrix (recommended formats per Bloom&apos;s level):
${typeMatrixStr}

Rules:
1. Every "core" concept must have at least 1 question
2. Higher Bloom&apos;s levels should use appropriate formats (e.g., CREATE -> design_problem)
3. Total questions must equal exactly ${params.questionCount}
4. Distribute difficulty 1-5 to create a progressive difficulty curve
5. Match question format to both the Bloom&apos;s level AND the available formats

For each planned question, provide:
- concept: Which concept this tests
- bloomsLevel: REMEMBER | UNDERSTAND | APPLY | ANALYZE | EVALUATE | CREATE
- questionFormat: ${formatList}
- difficulty: 1-5
- estimatedTimeSeconds: Expected time for a prepared student
- points: Weighted by Bloom&apos;s complexity

Respond with a JSON array of planned question objects. No markdown, no prose.`;

  return {
    systemPrompt: BLOOM_EXAM_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 3000,
    temperature: 0.3,
  };
}

// =============================================================================
// STAGE 3: QUESTION GENERATION (per question)
// =============================================================================

/**
 * Generate a single question with full pedagogical metadata.
 */
export function buildStage3Prompt(
  params: ExamBuilderParams,
  plan: PlannedQuestion,
  concept: DecomposedConcept,
  previousQuestions: GeneratedQuestion[],
  questionIndex: number,
  totalQuestions: number
): StagePrompt {
  const config = BLOOMS_LEVEL_CONFIG[plan.bloomsLevel];
  const levelReasoning = BLOOM_LEVEL_REASONING[plan.bloomsLevel];

  // Cross-reference previous questions for independence
  const previousStemSummary = previousQuestions
    .slice(-5) // last 5 for context
    .map((q) => `- [${q.bloomsLevel}] ${q.stem.slice(0, 80)}...`)
    .join('\n');

  const formatInstructions = getFormatInstructions(plan.questionFormat);

  const userPrompt = `Generate question ${questionIndex + 1} of ${totalQuestions} for this exam.

Topic: ${params.topic}
Concept: ${concept.name} — ${concept.description}
Common Misconceptions: ${concept.commonMisconceptions.join('; ') || 'None identified'}
Prerequisites: ${concept.prerequisites.join(', ') || 'None'}

Target Bloom&apos;s Level: ${plan.bloomsLevel}
Question Format: ${plan.questionFormat}
Difficulty: ${plan.difficulty}/5
Student Level: ${params.studentLevel}
Points: ${plan.points}
Estimated Time: ${plan.estimatedTimeSeconds} seconds

Level-Specific Reasoning:
${levelReasoning}

Signal Verbs to Use: ${config.signalVerbs.join(', ')}
Distractor Logic for ${plan.bloomsLevel}: ${config.distractorLogic.join('; ')}

${formatInstructions}

${
  previousStemSummary
    ? `IMPORTANT - Previous Questions (do NOT duplicate or leak answers):
${previousStemSummary}

Ensure this question:
- Tests a DIFFERENT aspect of "${concept.name}" than previous questions
- Does NOT reveal answers to any previous question
- Does NOT require information from previous questions`
    : ''
}

Self-Validation Checklist (verify before responding):
1. Does this question ACTUALLY require ${plan.bloomsLevel}-level thinking?
2. Could a student answer through mere recall if this is tagged ${plan.bloomsLevel}?
3. Are the signal verbs consistent with ${plan.bloomsLevel}?
4. Does the reasoning trace show ${plan.bloomsLevel}-level cognitive operations?
5. Are distractors diagnostically meaningful?

Respond with a single JSON object (not an array). No markdown, no prose.

{
  "stem": "<question text using appropriate signal verbs>",
  "bloomsLevel": "${plan.bloomsLevel}",
  "concept": "${concept.name}",
  "questionType": "${plan.questionFormat}",
  "difficulty": ${plan.difficulty},
  "points": ${plan.points},
  "estimatedTimeSeconds": ${plan.estimatedTimeSeconds},
  ${plan.questionFormat === 'mcq' ? '"options": [{"text": "<option>", "isCorrect": true/false, "diagnosticNote": "<what selecting this reveals>"}],' : ''}
  "correctAnswer": "<correct answer or model response>",
  "reasoningTrace": "<step-by-step correct thinking at ${plan.bloomsLevel} level>",
  "diagnosticNotes": "<what wrong answers reveal about understanding>",
  "explanation": "<full explanation>",
  "hint": "<nudge without revealing answer>",
  "remediationSuggestion": "<what to study if wrong>",
  "cognitiveSkills": ["<skill1>", "<skill2>"],
  "relatedConcepts": ["<concept1>"],
  "signalVerbs": ["<verb1>", "<verb2>"]
}`;

  return {
    systemPrompt: BLOOM_EXAM_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 2000,
    temperature: 0.5,
  };
}

// =============================================================================
// STAGE 4: EXAM ASSEMBLY & BALANCING
// =============================================================================

/**
 * Validate the assembled exam against 7 balance checks.
 */
export function buildStage4Prompt(
  params: ExamBuilderParams,
  questions: GeneratedQuestion[],
  concepts: DecomposedConcept[]
): StagePrompt {
  const questionSummary = questions
    .map(
      (q, i) =>
        `${i + 1}. [${q.bloomsLevel}] [${q.questionType}] [Diff:${q.difficulty}] ${q.stem.slice(0, 100)}... (Concept: ${q.concept})`
    )
    .join('\n');

  const conceptNames = concepts.map((c) => c.name).join(', ');
  const totalTime = questions.reduce((s, q) => s + q.estimatedTimeSeconds, 0);
  const totalPoints = questions.reduce((s, q) => s + q.points, 0);

  const userPrompt = `Validate this assembled exam against 7 balance checks.

Exam: ${params.topic} (${params.examPurpose} exam)
Questions: ${questions.length}
Time Limit: ${params.timeLimit ? `${params.timeLimit} minutes` : 'unlimited'}
Total Estimated Time: ${Math.round(totalTime / 60)} minutes
Total Points: ${totalPoints}
Concepts: ${conceptNames}

Question Listing:
${questionSummary}

Perform these 7 validation checks:

1. **conceptCoverage**: Does every concept have at least 1 question?
2. **bloomsDistributionMatch**: Does the actual Bloom&apos;s distribution match the planned profile? Calculate the deviation percentage.
3. **difficultyCurve**: Do questions progress from accessible to challenging? (early questions should be easier)
4. **answerIndependence**: Can any question&apos;s stem or options leak the answer to another question? List any leaks.
5. **timeBudget**: Does the total estimated time fit within the exam duration? (totalMinutes vs limitMinutes)
6. **formatVariety**: Is there variety in question formats, or are they all the same type?
7. **cognitiveLoadBalance**: Are there 2+ CREATE or EVALUATE questions back-to-back? (should be spaced out)

Respond with a single JSON object:
{
  "conceptCoverage": { "passed": true/false, "message": "<detail>" },
  "bloomsDistributionMatch": { "passed": true/false, "deviation": <number>, "message": "<detail>" },
  "difficultyCurve": { "passed": true/false, "message": "<detail>" },
  "answerIndependence": { "passed": true/false, "leaks": ["<leak description>"], "message": "<detail>" },
  "timeBudget": { "passed": true/false, "totalMinutes": <number>, "limitMinutes": <number|null>, "message": "<detail>" },
  "formatVariety": { "passed": true/false, "message": "<detail>" },
  "cognitiveLoadBalance": { "passed": true/false, "message": "<detail>" }
}

No markdown, no prose.`;

  return {
    systemPrompt: BLOOM_EXAM_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 2000,
    temperature: 0.2,
  };
}

// =============================================================================
// STAGE 5: RUBRIC & ANSWER KEY
// =============================================================================

/**
 * Generate cognitive profile template and remediation map.
 */
export function buildStage5Prompt(
  params: ExamBuilderParams,
  questions: GeneratedQuestion[],
  concepts: DecomposedConcept[]
): StagePrompt {
  const questionSummary = questions
    .map(
      (q) =>
        `- [${q.bloomsLevel}] "${q.stem.slice(0, 60)}..." (${q.points}pts, concept: ${q.concept})`
    )
    .join('\n');

  const bloomsLevels = [
    'REMEMBER',
    'UNDERSTAND',
    'APPLY',
    'ANALYZE',
    'EVALUATE',
    'CREATE',
  ] as const;

  const levelSummary = bloomsLevels
    .map((level) => {
      const qs = questions.filter((q) => q.bloomsLevel === level);
      return `${level}: ${qs.length} questions, ${qs.reduce((s, q) => s + q.points, 0)} points`;
    })
    .join('\n');

  const userPrompt = `Generate a Cognitive Profile Template for post-exam analysis.

Exam: ${params.topic} (${params.examPurpose})
Student Level: ${params.studentLevel}
Total Questions: ${questions.length}

Level Distribution:
${levelSummary}

Questions:
${questionSummary}

Generate:
1. **bloomsLevelScoring**: For each Bloom&apos;s level, list the question IDs and max points
2. **ceilingLevelThreshold**: The percentage (default 80%) a student needs at a level to be considered proficient
3. **growthEdgeLogic**: Explanation of how to determine the student&apos;s growth edge (highest proficient level)
4. **remediationMap**: For each Bloom&apos;s level, specific remediation advice for students who score below threshold

Respond with a single JSON object:
{
  "bloomsLevelScoring": {
    "REMEMBER": { "questionIds": ["eq-..."], "maxPoints": 0 },
    "UNDERSTAND": { "questionIds": ["eq-..."], "maxPoints": 0 },
    "APPLY": { "questionIds": ["eq-..."], "maxPoints": 0 },
    "ANALYZE": { "questionIds": ["eq-..."], "maxPoints": 0 },
    "EVALUATE": { "questionIds": ["eq-..."], "maxPoints": 0 },
    "CREATE": { "questionIds": ["eq-..."], "maxPoints": 0 }
  },
  "ceilingLevelThreshold": 80,
  "growthEdgeLogic": "<explanation>",
  "remediationMap": {
    "REMEMBER": "<specific advice for ${params.topic}>",
    "UNDERSTAND": "<specific advice>",
    "APPLY": "<specific advice>",
    "ANALYZE": "<specific advice>",
    "EVALUATE": "<specific advice>",
    "CREATE": "<specific advice>"
  }
}

No markdown, no prose.`;

  return {
    systemPrompt: BLOOM_EXAM_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 2000,
    temperature: 0.3,
  };
}

// =============================================================================
// FORMAT-SPECIFIC INSTRUCTIONS
// =============================================================================

function getFormatInstructions(format: string): string {
  switch (format) {
    case 'mcq':
      return `FORMAT: Multiple Choice Question
- Provide exactly 4 options with exactly ONE correct answer
- Each wrong option (distractor) MUST have a diagnosticNote explaining what misconception it targets
- Distractors should be plausible to students with partial understanding
- Avoid "all of the above" or "none of the above"`;

    case 'short_answer':
      return `FORMAT: Short Answer
- Question should require a 1-3 sentence response
- Provide the model correct answer
- Include key terms/concepts the answer must contain`;

    case 'long_answer':
      return `FORMAT: Long Answer / Essay
- Question should require a multi-paragraph response
- Provide model answer with key points that must be covered
- Include partial credit criteria in the explanation`;

    case 'design_problem':
      return `FORMAT: Design Problem
- Present a real-world scenario requiring a designed solution
- Specify constraints and requirements clearly
- Provide a model solution with evaluation criteria
- Include partial credit for intermediate steps`;

    case 'code_challenge':
      return `FORMAT: Code Challenge
- Present a programming problem with clear input/output specifications
- Provide a model solution
- Include test cases in the explanation
- Specify language-agnostic or target language`;

    default:
      return 'FORMAT: Open-ended question with clear answer expectations.';
  }
}
