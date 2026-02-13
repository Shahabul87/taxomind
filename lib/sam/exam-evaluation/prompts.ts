/**
 * Exam Evaluation Prompts
 *
 * Stage-specific prompt builders for the 5-stage DIAGNOSE evaluation pipeline.
 * Each stage prompt combines the DIAGNOSE system prompt with stage-specific
 * instructions and structured output requirements.
 */

import type { BloomsLevel } from '@prisma/client';
import type {
  StagePrompt,
  EvaluationMode,
  AnswerDiagnosis,
  CognitiveProfile,
} from './agentic-types';
import {
  DIAGNOSE_SYSTEM_PROMPT,
  BLOOMS_RUBRICS,
  MISCONCEPTION_TAXONOMY,
  GAP_TO_ARROW_PHASES,
} from './diagnose-system-prompt';

// =============================================================================
// BASE SYSTEM PROMPT (with mode adjustments)
// =============================================================================

export function getEvaluatorBaseSystemPrompt(mode: EvaluationMode): string {
  const modeAdjustment = mode === 'quick_grade'
    ? '\n\nMODE: Quick Grade — Focus on scoring and brief feedback. Skip detailed gap-mapping and echo-back.'
    : mode === 'standard'
      ? '\n\nMODE: Standard — Provide full 7-layer analysis with moderate detail.'
      : '\n\nMODE: Deep Diagnostic — Provide maximum detail on all 7 layers. Include exhaustive gap-mapping, named misconceptions, and detailed improvement pathways.';

  return DIAGNOSE_SYSTEM_PROMPT + modeAdjustment;
}

// =============================================================================
// STAGE 2: PER-ANSWER DIAGNOSE EVALUATION
// =============================================================================

interface QuestionContext {
  stem: string;
  correctAnswer: string;
  bloomsLevel: BloomsLevel;
  questionType?: string;
  points?: number;
  explanation?: string;
  concept?: string;
  options?: Array<{ text: string; isCorrect: boolean; diagnosticNote?: string }>;
}

export function buildStage2Prompt(
  question: QuestionContext,
  studentAnswer: string,
  evaluationMode: EvaluationMode,
  previousDiagnoses: AnswerDiagnosis[]
): StagePrompt {
  const rubric = BLOOMS_RUBRICS[question.bloomsLevel];

  // Cross-reference patterns from previous diagnoses
  const crossRefSection = previousDiagnoses.length > 0
    ? buildCrossReferenceSection(previousDiagnoses)
    : '';

  const misconceptionList = Object.entries(MISCONCEPTION_TAXONOMY)
    .map(([code, entry]) => `${code}: ${entry.name} (${entry.category}) — ${entry.description}`)
    .join('\n');

  const userPrompt = `Evaluate this student answer using ALL 7 layers of the DIAGNOSE framework.

## Question
**Stem**: ${question.stem}
**Target Bloom&apos;s Level**: ${question.bloomsLevel} (${rubric.levelName})
**Correct Answer**: ${question.correctAnswer}
${question.explanation ? `**Explanation**: ${question.explanation}` : ''}
${question.concept ? `**Concept**: ${question.concept}` : ''}
${question.questionType ? `**Question Type**: ${question.questionType}` : ''}
${question.points ? `**Points**: ${question.points}` : ''}
${question.options ? `**Options**:\n${question.options.map((o) => `  - ${o.text} ${o.isCorrect ? '(CORRECT)' : ''} ${o.diagnosticNote ? `[Diagnostic: ${o.diagnosticNote}]` : ''}`).join('\n')}` : ''}

## Student Answer
${studentAnswer}

## Bloom&apos;s Level Rubric for ${rubric.levelName}
${Object.entries(rubric.levels).map(([range, desc]) => `Score ${range}: ${desc}`).join('\n')}

## Misconception Taxonomy (use these codes)
${misconceptionList}
${crossRefSection}

## Required Output Format
Respond with a JSON object containing ALL of the following fields:

{
  "targetBloomsLevel": "${question.bloomsLevel}",
  "demonstratedLevel": "BLOOM_LEVEL",
  "bloomsEvidence": "Evidence for the demonstrated level",
  "reasoningPath": "expert|valid_alternative|fragile|partial|wrong_model|guessing",
  "reasoningPathEvidence": "Evidence for the reasoning path classification",
  "forkPoint": "Where reasoning diverged (if applicable, null otherwise)",
  "factualAccuracy": true/false,
  "logicalAccuracy": true/false,
  "structuralAccuracy": true/false,
  "accuracyDetails": "Details about the triple accuracy assessment",
  "breakdownPoint": "The exact point where understanding breaks down (null if none)",
  "solidFoundation": ["What the student DOES understand well"],
  "breakdownType": "MISSING_KNOWLEDGE|WRONG_CONNECTION|OVER_SIMPLIFICATION|OVER_COMPLICATION|PROCEDURAL_ERROR|TRANSFER_FAILURE|null",
  "contaminatedSteps": ["Conclusions that are wrong BECAUSE of the breakdown"],
  "misconceptions": [
    {"id": "A1", "name": "DEFINITION_DRIFT", "category": "factual", "description": "Specific description of how this misconception manifests"}
  ],
  "currentState": "Where the student IS right now",
  "targetState": "Where they NEED to be",
  "interventionSteps": [
    {"step": 1, "action": "Specific action", "arrowPhase": "Acquire|Reinforce|Reflect|Optimize|Widen", "successCriteria": "How to verify this step is complete"}
  ],
  "verificationQuestion": "A question that would PROVE the gap is closed",
  "scores": {
    "factualAccuracyScore": 0-10,
    "logicalCoherenceScore": 0-10,
    "bloomsLevelMatchScore": 0-10,
    "depthScore": 0-10,
    "communicationScore": 0-10
  },
  "feedback": "Constructive feedback paragraph",
  "strengths": ["What the student did well"]
}

IMPORTANT: Respond ONLY with valid JSON. No markdown, no prose outside the JSON.`;

  return {
    systemPrompt: getEvaluatorBaseSystemPrompt(evaluationMode),
    userPrompt,
    maxTokens: evaluationMode === 'quick_grade' ? 1500 : 3000,
    temperature: 0.3,
  };
}

// =============================================================================
// STAGE 3: ECHO-BACK TEACHING
// =============================================================================

export function buildStage3Prompt(
  question: QuestionContext,
  studentAnswer: string,
  diagnosis: AnswerDiagnosis
): StagePrompt {
  const userPrompt = `Generate an Echo-Back Teaching response for this student answer.

Echo-Back Teaching is a 6-step pedagogical technique that mirrors the student&apos;s thinking
back to them, then guides them to the expert approach.

## Question
**Stem**: ${question.stem}
**Correct Answer**: ${question.correctAnswer}
**Target Level**: ${question.bloomsLevel}

## Student Answer
${studentAnswer}

## Diagnosis Summary
- Demonstrated Level: ${diagnosis.demonstratedLevel} (Gap: ${diagnosis.bloomsGap})
- Reasoning Path: ${diagnosis.reasoningPath}
- Triple Accuracy: F=${diagnosis.factualAccuracy} L=${diagnosis.logicalAccuracy} S=${diagnosis.structuralAccuracy} → ${diagnosis.tripleAccuracyDiagnosis}
- Breakdown Point: ${diagnosis.breakdownPoint ?? 'None identified'}
- Misconceptions: ${diagnosis.misconceptions.map((m) => m.name).join(', ') || 'None'}

## Required Output Format
Respond with a JSON object:

{
  "hereIsWhatYouDid": "Mirror the student&apos;s approach WITHOUT judgment. Show them their thinking path as you understand it. Start with: 'Here&apos;s what I see you did...'",
  "hereIsWhereItBroke": "Identify the EXACT point where their reasoning diverged from the correct path. Be specific. Start with: 'The issue appears at...'",
  "hereIsHowExpertThinks": "Walk through how an expert would approach this, step by step. Connect to their existing solid foundation. Start with: 'An expert in this area would...'",
  "keyInsight": "One sentence that captures the essential insight they need. This should be memorable and actionable.",
  "patternRecognition": "Help them see if this type of error occurs in other contexts. Connect to broader patterns.",
  "practiceQuestion": "A follow-up question that would SPECIFICALLY test whether they&apos;ve fixed this gap."
}

Tone: Be a supportive diagnostic mentor, not a judge. Acknowledge what they got RIGHT first.
IMPORTANT: Respond ONLY with valid JSON. No markdown, no prose.`;

  return {
    systemPrompt: DIAGNOSE_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 2000,
    temperature: 0.4,
  };
}

// =============================================================================
// STAGE 4: COGNITIVE PROFILE GENERATION
// =============================================================================

export function buildStage4Prompt(
  diagnoses: AnswerDiagnosis[],
  examMetadata: { topic: string; examPurpose?: string; studentLevel?: string }
): StagePrompt {
  // Build per-level summary
  const levelSummaries: string[] = [];
  for (const level of ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as const) {
    const levelDiags = diagnoses.filter((d) => d.targetBloomsLevel === level);
    if (levelDiags.length === 0) {
      levelSummaries.push(`${level}: No questions at this level`);
      continue;
    }
    const avgScore = levelDiags.reduce((s, d) => s + d.scores.composite, 0) / levelDiags.length;
    const paths = levelDiags.map((d) => d.reasoningPath).join(', ');
    const gaps = levelDiags.map((d) => `gap=${d.bloomsGap}`).join(', ');
    levelSummaries.push(`${level}: ${levelDiags.length} questions, avg ${avgScore.toFixed(1)}/10, paths=[${paths}], ${gaps}`);
  }

  // Misconception summary
  const misconceptionCounts = new Map<string, number>();
  for (const d of diagnoses) {
    for (const m of d.misconceptions) {
      misconceptionCounts.set(m.name, (misconceptionCounts.get(m.name) ?? 0) + 1);
    }
  }
  const misconceptionSummary = Array.from(misconceptionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name} (${count}x)`)
    .join(', ') || 'None identified';

  // Fragile correct count
  const fragileCount = diagnoses.filter((d) => d.reasoningPath === 'fragile').length;

  const userPrompt = `Generate a Cognitive Profile Report for this exam attempt.

## Exam Context
Topic: ${examMetadata.topic}
${examMetadata.examPurpose ? `Purpose: ${examMetadata.examPurpose}` : ''}
${examMetadata.studentLevel ? `Student Level: ${examMetadata.studentLevel}` : ''}
Total Answers: ${diagnoses.length}

## Per-Level Analysis
${levelSummaries.join('\n')}

## Cross-Answer Patterns
- Fragile correct answers: ${fragileCount}
- Misconceptions found: ${misconceptionSummary}
- Reasoning path distribution: ${JSON.stringify(countPaths(diagnoses))}

## All Diagnoses Summary
${diagnoses.map((d, i) => `Q${i + 1}: ${d.targetBloomsLevel} → demonstrated ${d.demonstratedLevel}, gap=${d.bloomsGap}, path=${d.reasoningPath}, composite=${d.scores.composite}/10, triple=${d.tripleAccuracyDiagnosis}`).join('\n')}

## Required Output Format
Respond with a JSON object:

{
  "bloomsCognitiveMap": {
    "REMEMBER": {"score": 0-100, "status": "mastery|solid|developing|emerging|gap", "keyFinding": "One sentence summary"},
    "UNDERSTAND": {"score": 0-100, "status": "...", "keyFinding": "..."},
    "APPLY": {"score": 0-100, "status": "...", "keyFinding": "..."},
    "ANALYZE": {"score": 0-100, "status": "...", "keyFinding": "..."},
    "EVALUATE": {"score": 0-100, "status": "...", "keyFinding": "..."},
    "CREATE": {"score": 0-100, "status": "...", "keyFinding": "..."}
  },
  "cognitiveCeiling": "BLOOM_LEVEL (highest level with >= 80%)",
  "growthEdge": "BLOOM_LEVEL (next level to target)",
  "criticalGap": "BLOOM_LEVEL or null (level with most severe gap)",
  "thinkingPatternAnalysis": {
    "dominantStyle": "Name of dominant thinking style",
    "description": "Description of how the student typically approaches problems",
    "limitations": ["Specific limitations of this thinking style"]
  },
  "reasoningPathDistribution": {
    "expert": percentage,
    "valid_alternative": percentage,
    "fragile": percentage,
    "partial": percentage,
    "wrong_model": percentage,
    "guessing": percentage
  },
  "strengthMap": ["What the student does WELL (specific, evidence-based)"],
  "vulnerabilityMap": ["Where the student is FRAGILE (including correct but fragile answers)"],
  "misconceptionSummary": [
    {"id": "CODE", "name": "MISCONCEPTION_NAME", "frequency": count}
  ]
}

IMPORTANT: Respond ONLY with valid JSON.`;

  return {
    systemPrompt: DIAGNOSE_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 2500,
    temperature: 0.3,
  };
}

// =============================================================================
// STAGE 5: IMPROVEMENT ROADMAP
// =============================================================================

export function buildStage5Prompt(
  profile: CognitiveProfile,
  diagnoses: AnswerDiagnosis[],
  examMetadata: { topic: string }
): StagePrompt {
  // Build gap summary
  const gaps: string[] = [];
  for (const level of ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as const) {
    const entry = profile.bloomsCognitiveMap[level];
    if (entry.status === 'gap' || entry.status === 'emerging' || entry.status === 'developing') {
      gaps.push(`${level} (${entry.status}, score: ${entry.score}%): ${entry.keyFinding}`);
    }
  }

  // ARROW phase reference
  const arrowReference = Object.entries(GAP_TO_ARROW_PHASES)
    .slice(0, 12)
    .map(([type, phases]) => `${type} → ${phases.join(' → ')}`)
    .join('\n');

  // Verification questions from diagnoses
  const verificationQs = diagnoses
    .filter((d) => d.verificationQuestion.length > 10)
    .slice(0, 5)
    .map((d) => `[${d.targetBloomsLevel}] ${d.verificationQuestion}`);

  const userPrompt = `Generate an Improvement Roadmap based on the cognitive profile.

## Student Profile
Topic: ${examMetadata.topic}
Cognitive Ceiling: ${profile.cognitiveCeiling}
Growth Edge: ${profile.growthEdge}
${profile.criticalGap ? `Critical Gap: ${profile.criticalGap}` : ''}

## Identified Gaps
${gaps.length > 0 ? gaps.join('\n') : 'No significant gaps identified'}

## Vulnerabilities
${profile.vulnerabilityMap.join('\n')}

## Misconceptions
${profile.misconceptionSummary.map((m) => `${m.id}: ${m.name} (${m.frequency}x)`).join('\n') || 'None'}

## ARROW Phase Reference
${arrowReference}

## Existing Verification Questions
${verificationQs.join('\n') || 'None generated'}

## Required Output Format
Respond with a JSON object:

{
  "priorities": [
    {
      "priority": 1,
      "title": "Title of intervention (specific, actionable)",
      "arrowPhases": ["Acquire", "Reinforce"],
      "actions": ["Specific action 1", "Specific action 2", "Specific action 3"],
      "successMetric": "How to measure if this intervention worked"
    }
  ],
  "verificationQuestions": [
    {
      "forGap": "What gap this question tests",
      "question": "The verification question text"
    }
  ],
  "estimatedTimeToNextLevel": "Estimated time to reach growth edge (e.g., '2-3 weeks with daily practice')"
}

Order priorities by impact: fix the most fundamental gaps FIRST.
Limit to 5 priorities maximum.
Each priority should have specific, actionable steps.
IMPORTANT: Respond ONLY with valid JSON.`;

  return {
    systemPrompt: DIAGNOSE_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 2000,
    temperature: 0.4,
  };
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

function buildCrossReferenceSection(diagnoses: AnswerDiagnosis[]): string {
  if (diagnoses.length === 0) return '';

  const pathCounts: Record<string, number> = {};
  const misconceptionCounts: Record<string, number> = {};

  for (const d of diagnoses) {
    pathCounts[d.reasoningPath] = (pathCounts[d.reasoningPath] ?? 0) + 1;
    for (const m of d.misconceptions) {
      misconceptionCounts[m.name] = (misconceptionCounts[m.name] ?? 0) + 1;
    }
  }

  const parts: string[] = [
    '\n## Cross-Answer Pattern Context',
    `Previous answers analyzed: ${diagnoses.length}`,
    `Reasoning patterns so far: ${Object.entries(pathCounts).map(([p, c]) => `${p}(${c})`).join(', ')}`,
  ];

  if (Object.keys(misconceptionCounts).length > 0) {
    parts.push(`Recurring misconceptions: ${Object.entries(misconceptionCounts).map(([m, c]) => `${m}(${c})`).join(', ')}`);
  }

  parts.push('Look for PATTERNS — does this answer show the same reasoning tendencies?');

  return parts.join('\n');
}

function countPaths(diagnoses: AnswerDiagnosis[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const d of diagnoses) {
    counts[d.reasoningPath] = (counts[d.reasoningPath] ?? 0) + 1;
  }
  return counts;
}
