/**
 * DIAGNOSE Framework System Prompt
 *
 * Full system prompt for the 7-layer cognitive diagnostic evaluation.
 * Includes: misconception taxonomy, reasoning path signals, triple accuracy
 * matrix, Bloom&apos;s rubrics, ARROW phase prescriptions, and anti-patterns.
 *
 * Based on the DIAGNOSE + Echo-Back model:
 *   D - Detect Bloom&apos;s Level
 *   I - Identify Reasoning Path
 *   A - Assess Triple Accuracy
 *   G - Gap-Map Breakdown
 *   N - Name Misconception
 *   O - Outline Improvement
 *   S - Score Multidimensional
 *   E - Echo-Back Teaching
 */

import type { BloomsLevel } from '@prisma/client';
import type {
  MisconceptionEntry,
  MisconceptionCategory,
  ReasoningPath,
  TripleAccuracyDiagnosis,
} from './agentic-types';

// =============================================================================
// MAIN SYSTEM PROMPT
// =============================================================================

export const DIAGNOSE_SYSTEM_PROMPT = `You are a cognitive diagnostic evaluator implementing the DIAGNOSE framework.

Your job is NOT to simply grade answers right or wrong. You reverse-engineer the student&apos;s THINKING PROCESS to diagnose cognitive gaps at specific Bloom&apos;s Taxonomy levels.

## The 7-Layer DIAGNOSE Framework

For EACH answer, you evaluate through ALL 7 layers:

### Layer 1: D - Detect Bloom&apos;s Level
Compare the TARGET Bloom&apos;s level of the question with the level the student ACTUALLY demonstrated.
- Bloom&apos;s Gap = Target Level - Demonstrated Level
- Even a "correct" answer may demonstrate a LOWER Bloom&apos;s level than intended.
- A student may EXCEED the target level (negative gap = positive sign).

### Layer 2: I - Identify Reasoning Path
Classify HOW the student arrived at their answer:
- **expert**: Systematic, well-structured reasoning matching domain conventions
- **valid_alternative**: Correct but non-standard approach that still demonstrates understanding
- **fragile**: Correct answer but reasoning shows shaky foundations (DANGEROUS - can mask gaps)
- **partial**: Started correctly but diverged at a specific fork point
- **wrong_model**: Applied an incorrect mental model or framework consistently
- **guessing**: No evidence of structured reasoning

### Layer 3: A - Assess Triple Accuracy
Evaluate three independent accuracy dimensions:
- **Factual Accuracy**: Are the facts, definitions, and data points correct?
- **Logical Accuracy**: Is the reasoning chain valid? Do conclusions follow from premises?
- **Structural Accuracy**: Is the answer organized at the appropriate Bloom&apos;s level?

The combination produces a diagnosis (see Triple Accuracy Matrix).

### Layer 4: G - Gap-Map Breakdown
Trace the student&apos;s reasoning to the EXACT point where it breaks down:
- Identify the solid foundation (what they DO understand)
- Find the breakdown point (where understanding fails)
- Classify the breakdown type (missing knowledge, wrong connection, oversimplification, etc.)
- List contaminated steps (conclusions that are wrong BECAUSE of the breakdown)

### Layer 5: N - Name Misconception
Identify specific misconceptions from the taxonomy. Name them precisely.
Every misconception has a code (A1-D5), name, category, and description.

### Layer 6: O - Outline Improvement
Create a concrete improvement pathway:
- Current state: Where the student IS right now
- Target state: Where they NEED to be
- Intervention steps: Specific actions with ARROW phase labels
- Verification question: A question that would PROVE the gap is closed

### Layer 7: S - Score Multidimensional
Score across 5 dimensions (each /10):
- Factual Accuracy (20% weight)
- Logical Coherence (25% weight)
- Bloom&apos;s Level Match (25% weight)
- Depth of Understanding (20% weight)
- Communication Quality (10% weight)

## Scoring Rules
- NEVER give a score based solely on correctness. A correct answer with fragile reasoning should score LOWER than expected.
- The composite score is weighted: (factual * 0.20) + (logical * 0.25) + (blooms * 0.25) + (depth * 0.20) + (communication * 0.10)
- A "correct" answer with wrong reasoning path should NOT score above 7/10.
- A "wrong" answer with expert-level reasoning should NOT score below 3/10.

## Bloom&apos;s Level Rubric
- REMEMBER: Can recall facts, definitions, lists. Signal verbs: define, list, recall, identify.
- UNDERSTAND: Can explain concepts in own words, compare/contrast. Signal verbs: explain, summarize, interpret.
- APPLY: Can use knowledge in new situations. Signal verbs: apply, demonstrate, solve, use.
- ANALYZE: Can break down concepts, find patterns, compare components. Signal verbs: analyze, compare, differentiate, examine.
- EVALUATE: Can justify decisions, critique arguments, assess validity. Signal verbs: evaluate, justify, argue, critique.
- CREATE: Can synthesize new solutions, design systems, propose theories. Signal verbs: create, design, construct, propose.

## Tone Guidelines
- Be precise but not cold. You are a diagnostic specialist, not a judge.
- Use evidence from the student&apos;s answer to support every claim.
- When identifying gaps, frame them as growth opportunities.
- Always acknowledge what the student does WELL before addressing gaps.
- Never be condescending or dismissive.`;

// =============================================================================
// MISCONCEPTION TAXONOMY (19 named misconceptions, 4 categories)
// =============================================================================

export const MISCONCEPTION_TAXONOMY: Record<string, MisconceptionEntry> = {
  // Category A: Factual Misconceptions
  A1: {
    id: 'A1',
    name: 'DEFINITION_DRIFT',
    category: 'factual',
    description: 'Using a term with a subtly wrong definition that leads to incorrect conclusions',
  },
  A2: {
    id: 'A2',
    name: 'CONCEPT_SWAP',
    category: 'factual',
    description: 'Confusing two related but distinct concepts (e.g., precision vs accuracy)',
  },
  A3: {
    id: 'A3',
    name: 'OUTDATED_KNOWLEDGE',
    category: 'factual',
    description: 'Using information that was once correct but has been superseded',
  },
  A4: {
    id: 'A4',
    name: 'FABRICATED_FACT',
    category: 'factual',
    description: 'Stating something as fact that has no basis (confabulation)',
  },

  // Category B: Reasoning Misconceptions
  B1: {
    id: 'B1',
    name: 'CORRELATION_CAUSATION',
    category: 'reasoning',
    description: 'Treating correlation as evidence of causation',
  },
  B2: {
    id: 'B2',
    name: 'SINGLE_CAUSE_THINKING',
    category: 'reasoning',
    description: 'Attributing a multi-causal phenomenon to a single cause',
  },
  B3: {
    id: 'B3',
    name: 'BLACK_OR_WHITE',
    category: 'reasoning',
    description: 'Treating a spectrum as binary (all or nothing thinking)',
  },
  B4: {
    id: 'B4',
    name: 'SURVIVORSHIP_BIAS',
    category: 'reasoning',
    description: 'Drawing conclusions from successes while ignoring failures',
  },
  B5: {
    id: 'B5',
    name: 'AUTHORITY_ANCHORING',
    category: 'reasoning',
    description: 'Accepting claims based on source authority rather than evidence',
  },

  // Category C: Structural Misconceptions
  C1: {
    id: 'C1',
    name: 'PROCEDURE_WITHOUT_UNDERSTANDING',
    category: 'structural',
    description: 'Can follow steps mechanically but cannot explain WHY they work',
  },
  C2: {
    id: 'C2',
    name: 'UNDERSTAND_WITHOUT_TRANSFER',
    category: 'structural',
    description: 'Understands concept in original context but cannot apply to new situations',
  },
  C3: {
    id: 'C3',
    name: 'ANALYSIS_WITHOUT_EVALUATION',
    category: 'structural',
    description: 'Can break down components but cannot assess their relative importance',
  },
  C4: {
    id: 'C4',
    name: 'EVALUATION_WITHOUT_CREATION',
    category: 'structural',
    description: 'Can critique existing work but cannot synthesize new solutions',
  },
  C5: {
    id: 'C5',
    name: 'LOCAL_UNDERSTANDING',
    category: 'structural',
    description: 'Understands parts in isolation but misses how they connect as a system',
  },

  // Category D: Meta-Cognitive Misconceptions
  D1: {
    id: 'D1',
    name: 'ILLUSION_OF_UNDERSTANDING',
    category: 'meta_cognitive',
    description: 'Believes they understand deeply but actually have surface-level knowledge',
  },
  D2: {
    id: 'D2',
    name: 'EXPERTISE_BLIND_SPOT',
    category: 'meta_cognitive',
    description: 'Cannot identify what they don&apos;t know (unknown unknowns)',
  },
  D3: {
    id: 'D3',
    name: 'COMPLEXITY_WORSHIP',
    category: 'meta_cognitive',
    description: 'Equates complexity with correctness; overcomplicates simple concepts',
  },
  D4: {
    id: 'D4',
    name: 'SIMPLICITY_TRAP',
    category: 'meta_cognitive',
    description: 'Oversimplifies complex concepts, losing critical nuance',
  },
  D5: {
    id: 'D5',
    name: 'CONFIRMATION_SEEKING',
    category: 'meta_cognitive',
    description: 'Only considers evidence that supports existing beliefs',
  },
};

// =============================================================================
// REASONING PATH DETECTION SIGNALS
// =============================================================================

export const REASONING_PATH_SIGNALS: Record<ReasoningPath, string[]> = {
  expert: [
    'Uses domain-specific terminology correctly',
    'Shows systematic, step-by-step reasoning',
    'Considers edge cases or limitations',
    'References underlying principles',
    'Structures response at the appropriate Bloom&apos;s level',
  ],
  valid_alternative: [
    'Arrives at correct conclusion via non-standard route',
    'Uses analogies or alternative frameworks effectively',
    'Shows creative problem-solving',
    'May use informal but accurate reasoning',
  ],
  fragile: [
    'Correct answer but with weak justification',
    'Cannot explain WHY the answer is correct',
    'Would likely fail on a slightly modified version',
    'Uses memorized patterns without understanding',
    'Shows surface-level confidence masking shallow knowledge',
  ],
  partial: [
    'Starts with correct reasoning then diverges',
    'Identifies some components but misses key ones',
    'Has a clear fork point where reasoning goes wrong',
    'Shows understanding of prerequisites but not the target concept',
  ],
  wrong_model: [
    'Applies a framework that does not fit this problem',
    'Consistently reasons from an incorrect premise',
    'Shows internal logic but built on wrong foundation',
    'Confuses the domain or context of the question',
  ],
  guessing: [
    'No structured reasoning visible',
    'Answer contradicts itself',
    'Random or irrelevant information',
    'Very short or vague response with no justification',
    'Uses hedging language without substance',
  ],
};

// =============================================================================
// TRIPLE ACCURACY MATRIX
// =============================================================================

export const TRIPLE_ACCURACY_MATRIX: Record<TripleAccuracyDiagnosis, {
  factual: boolean;
  logical: boolean;
  structural: boolean;
  description: string;
}> = {
  MASTERY: {
    factual: true, logical: true, structural: true,
    description: 'Full mastery: facts correct, reasoning valid, structure matches target Bloom&apos;s level',
  },
  LEVEL_MISMATCH: {
    factual: true, logical: true, structural: false,
    description: 'Knows the material and reasons well, but responds at wrong cognitive level',
  },
  REASONING_GAP: {
    factual: true, logical: false, structural: true,
    description: 'Has the facts and structures answer correctly, but reasoning chain is flawed',
  },
  KNOWLEDGE_GAP: {
    factual: false, logical: true, structural: true,
    description: 'Reasons well and structures correctly, but starts from incorrect facts',
  },
  MEMORIZER: {
    factual: true, logical: false, structural: false,
    description: 'Has memorized facts but cannot reason with them or structure appropriately',
  },
  INTUITIVE_THINKER: {
    factual: false, logical: true, structural: false,
    description: 'Has good reasoning instincts but lacks factual grounding and structural awareness',
  },
  SHAPE_WITHOUT_SUBSTANCE: {
    factual: false, logical: false, structural: true,
    description: 'Knows what the answer SHOULD look like but lacks both facts and reasoning',
  },
  STARTING_POINT: {
    factual: false, logical: false, structural: false,
    description: 'Needs foundational work in all three dimensions',
  },
};

// =============================================================================
// BLOOM&apos;S RUBRICS (Level-specific scoring criteria)
// =============================================================================

export const BLOOMS_RUBRICS: Record<BloomsLevel, {
  levelName: string;
  levels: Record<string, string>;
}> = {
  REMEMBER: {
    levelName: 'Remember',
    levels: {
      '9-10': 'Accurate recall with precise terminology and complete details',
      '7-8': 'Mostly accurate recall with minor omissions',
      '5-6': 'Partial recall with some inaccuracies',
      '3-4': 'Vague recall with significant gaps',
      '1-2': 'Minimal recall; mostly incorrect or missing',
    },
  },
  UNDERSTAND: {
    levelName: 'Understand',
    levels: {
      '9-10': 'Clear explanation in own words with accurate paraphrasing and examples',
      '7-8': 'Good explanation with minor gaps in interpretation',
      '5-6': 'Basic understanding shown but relies on memorized phrasing',
      '3-4': 'Superficial understanding; cannot distinguish from recall',
      '1-2': 'No evidence of understanding beyond raw recall',
    },
  },
  APPLY: {
    levelName: 'Apply',
    levels: {
      '9-10': 'Correctly applies concepts to new situations with appropriate adaptations',
      '7-8': 'Applies concepts with minor errors in new contexts',
      '5-6': 'Can apply in familiar contexts but struggles with novel ones',
      '3-4': 'Attempts application but misapplies key concepts',
      '1-2': 'Cannot transfer knowledge to practical situations',
    },
  },
  ANALYZE: {
    levelName: 'Analyze',
    levels: {
      '9-10': 'Breaks down complex systems, identifies patterns, and examines relationships systematically',
      '7-8': 'Good analysis with minor gaps in pattern identification',
      '5-6': 'Basic analysis but misses important relationships',
      '3-4': 'Attempts analysis but confuses correlation and causation',
      '1-2': 'Cannot break concepts into components',
    },
  },
  EVALUATE: {
    levelName: 'Evaluate',
    levels: {
      '9-10': 'Provides well-justified critique with evidence-based reasoning and consideration of alternatives',
      '7-8': 'Good evaluation with minor gaps in justification',
      '5-6': 'Can state opinions but weak evidence base',
      '3-4': 'Expresses preferences without criteria or evidence',
      '1-2': 'Cannot distinguish between quality levels',
    },
  },
  CREATE: {
    levelName: 'Create',
    levels: {
      '9-10': 'Synthesizes novel solution that integrates multiple concepts with clear rationale',
      '7-8': 'Creates reasonable solution with minor gaps in integration',
      '5-6': 'Produces basic creation but heavily derivative',
      '3-4': 'Attempts creation but results are fragmented or non-functional',
      '1-2': 'Cannot produce original work beyond recombining given elements',
    },
  },
};

// =============================================================================
// ARROW PHASE PRESCRIPTIONS (Gap type -> recommended learning phases)
// =============================================================================

/**
 * ARROW is a learning progression model:
 *   A - Acquire (initial exposure to concepts)
 *   R - Reinforce (practice and repetition)
 *   R - Reflect (metacognitive analysis)
 *   O - Optimize (efficiency and transfer)
 *   W - Widen (extend to new contexts)
 */
export const GAP_TO_ARROW_PHASES: Record<string, string[]> = {
  // Gap severity -> phases
  fundamental: ['Acquire', 'Reinforce'],
  struggling: ['Reinforce', 'Reflect'],
  close: ['Reflect', 'Optimize'],
  exceeded: ['Optimize', 'Widen'],

  // Breakdown types -> phases
  MISSING_KNOWLEDGE: ['Acquire', 'Reinforce'],
  WRONG_CONNECTION: ['Reflect', 'Reinforce'],
  OVER_SIMPLIFICATION: ['Reflect', 'Optimize'],
  OVER_COMPLICATION: ['Reflect', 'Optimize'],
  PROCEDURAL_ERROR: ['Reinforce', 'Reflect'],
  TRANSFER_FAILURE: ['Optimize', 'Widen'],

  // Reasoning path -> phases
  guessing: ['Acquire', 'Reinforce'],
  wrong_model: ['Acquire', 'Reflect'],
  partial: ['Reinforce', 'Reflect'],
  fragile: ['Reflect', 'Optimize'],
  valid_alternative: ['Optimize', 'Widen'],

  // Misconception categories -> phases
  factual: ['Acquire', 'Reinforce'],
  reasoning: ['Reflect', 'Reinforce'],
  structural: ['Reflect', 'Optimize'],
  meta_cognitive: ['Reflect', 'Widen'],
};

// =============================================================================
// EVALUATION ANTI-PATTERNS (10 things the evaluator NEVER does)
// =============================================================================

export const EVALUATION_ANTI_PATTERNS = [
  'NEVER grade based solely on correctness without analyzing reasoning',
  'NEVER give feedback that is vague or generic (e.g., "needs improvement")',
  'NEVER assume a correct answer means deep understanding',
  'NEVER ignore the reasoning path even for multiple-choice questions',
  'NEVER conflate different accuracy dimensions (factual vs logical vs structural)',
  'NEVER skip the gap-mapping step, even for high-scoring answers',
  'NEVER use scoring to punish rather than diagnose',
  'NEVER provide improvement pathways without specific, actionable steps',
  'NEVER ignore fragile correct answers (these are the most dangerous gaps)',
  'NEVER evaluate in isolation without considering cross-answer patterns',
];

// =============================================================================
// MISCONCEPTION CATEGORIES (for grouping)
// =============================================================================

export const MISCONCEPTION_CATEGORIES: Record<MisconceptionCategory, {
  label: string;
  codeRange: string;
  description: string;
}> = {
  factual: {
    label: 'Factual Misconceptions',
    codeRange: 'A1-A4',
    description: 'Errors in facts, definitions, and data',
  },
  reasoning: {
    label: 'Reasoning Misconceptions',
    codeRange: 'B1-B5',
    description: 'Errors in logic, causation, and inference',
  },
  structural: {
    label: 'Structural Misconceptions',
    codeRange: 'C1-C5',
    description: 'Errors in how knowledge is organized and connected',
  },
  meta_cognitive: {
    label: 'Meta-Cognitive Misconceptions',
    codeRange: 'D1-D5',
    description: 'Errors in self-awareness about own understanding',
  },
};
