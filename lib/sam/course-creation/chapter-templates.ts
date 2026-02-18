/**
 * Chapter DNA Templates — Combined ARROW Course Format
 *
 * Level-specific section structures optimized for each difficulty:
 *   Beginner (8 sections): Intuition-heavy, analogy-rich, scaffolded exercises
 *   Intermediate (7 sections): Mechanism-focused, derive-from-scratch, lab exercises
 *   Advanced (8 sections): Research-grade, design & critique, first-principles reasoning
 *
 * Teaching philosophy: INTUITION FIRST — students feel the concept before seeing formulas.
 * Templates are deterministic (structure + rules); AI provides creative content.
 *
 * Beginner:
 *   1. THE HOOK          — Story/scenario
 *   2. THE INTUITION     — Plain-English def + analogy mapping + visual + "aha"
 *   3. THE WALKTHROUGH   — Step-by-step REAL numbers, pattern emerges
 *   4. THE FORMALIZATION — Name things already known, formula as TRANSLATION
 *   5. THE PLAYGROUND    — 3 exercises: guided → semi-guided → independent
 *   6. THE PITFALLS      — Named pitfalls, SAME analogy, misconception buster
 *   7. THE SUMMARY       — Key concepts + formula card + connections
 *   8. THE CHECKPOINT    — Self-assessment + metacognitive reflection
 *
 * Intermediate:
 *   1. THE PROVOCATION       — Challenge surface understanding
 *   2. THE INTUITION ENGINE  — 2-3 mental models + unifying insight
 *   3. THE DERIVATION        — Motivated math, English translations, intuition checks
 *   4. THE LABORATORY        — 5+ exercises: compute, predict-verify, diagnose, compare, design
 *   5. THE DEPTH DIVE        — Edge cases, breaking conditions, connections
 *   6. THE SYNTHESIS         — Insights + concept map + connections
 *   7. THE CHECKPOINT        — Self-assessment L4-L5 + confidence rating
 *
 * Advanced:
 *   1. THE OPEN QUESTION     — Intellectual puzzle, research framing
 *   2. THE INTUITION         — One POWERFUL analogy for counterintuitive ideas
 *   3. THE FIRST PRINCIPLES  — Problem → simplest → add complexity → formulation
 *   4. THE ANALYSIS          — Formal complexity + expressiveness + limitations
 *   5. THE DESIGN STUDIO     — 4+ challenges L4-L6: analyze, evaluate, create, critique
 *   6. THE FRONTIER          — Open questions + key papers + research project idea
 *   7. THE SYNTHESIS         — Design principles + concept map + connections
 *   8. THE CHECKPOINT        — Self-assessment L5-L6 + research readiness
 */

import type { BloomsLevel, ContentType } from './types';
import type { ComposedTemplatePrompt, TemplateSectionRole } from './types';
import { FEW_SHOT_EXAMPLES } from './few-shot-examples';

// ============================================================================
// Types
// ============================================================================

export interface TemplateSectionDef {
  position: number;
  role: TemplateSectionRole;
  displayName: string;
  purpose: string;
  contentType: ContentType;
  bloomsLevels: BloomsLevel[];
  wordCountRange: { min: number; max: number };
  formatRules: string[];
  htmlStructure: string;
  tone: string;
  exerciseGuidance?: string;
  consistencyRules: string[];
  /** Whether this section is required (always included) or optional (AI can exclude). Default: true */
  required: boolean;
  /** Gold-standard few-shot example for this section role (100-300 tokens). */
  exampleSnippet?: string;
}

export interface ChapterTemplate {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  displayName: string;
  totalSections: number;
  chapterWordRange: { min: number; max: number };
  teachingLaws: string[];
  sections: TemplateSectionDef[];
  exerciseTypes: string[];
  designPhilosophy: string;
  chapterChecklist: string[];
  estimatedTimePerChapter: string;
  explainToAFriend: string;
}

// ============================================================================
// 5 Unbreakable Teaching Laws (shared across all templates)
// ============================================================================

const TEACHING_LAWS: string[] = [
  'Never start with a definition — start with a story or question.',
  'Never introduce a formula before building intuition for it.',
  'Concrete → Visual → Abstract (always in this order).',
  'Always show what goes wrong before showing what goes right.',
  'Always end with the student doing something, not just reading.',
];

// ============================================================================
// 11 Universal Consistency Rules (from gold standard)
// ============================================================================

export const UNIVERSAL_CONSISTENCY_RULES: string[] = [
  'Every concept introduced MUST be used in at least one exercise within the same chapter.',
  'Every formula MUST have a plain-English translation immediately following it.',
  'Every "why" question raised MUST be answered within 2 sections.',
  'Analogies introduced in early sections MUST be referenced in later sections.',
  'Vocabulary introduced MUST be used consistently — never introduce synonyms without explanation.',
  'Difficulty MUST increase monotonically within each chapter (easy → hard).',
  'Every chapter MUST end with the student DOING something, not just reading.',
  'Code examples MUST be runnable — never use pseudo-code without a real equivalent.',
  'Every section MUST reference at least one element from a previous section (backward links).',
  'Visual descriptions MUST match the formal definitions exactly — no approximations.',
  'Self-assessment questions MUST test the actual content taught, not adjacent topics.',
];

// ============================================================================
// Beginner Sections (8 sections — intuition-heavy, analogy-rich)
// ============================================================================

function buildBeginnerSections(): TemplateSectionDef[] {
  return [
    {
      position: 1,
      role: 'HOOK',
      displayName: 'THE HOOK',
      purpose: 'Create curiosity with a real-world story or scenario that makes the topic irresistible.',
      contentType: 'reading',
      bloomsLevels: ['REMEMBER'],
      required: true,
      exampleSnippet: FEW_SHOT_EXAMPLES.beginner.HOOK,
      wordCountRange: { min: 150, max: 300 },
      formatRules: [
        'Write a real-world story or scenario featuring a character facing a problem.',
        'End with a provocative question: "What if you could...?" or "How does this work?"',
        'NO definitions, NO formulas, NO theory.',
        'Use vivid, specific details — names, places, numbers.',
        'The reader should feel "I NEED to understand this."',
      ],
      htmlStructure: '<h2>Story/scenario title</h2><p>Narrative...</p><p><strong>Question:</strong> What if...?</p>',
      tone: 'Curious, story-driven, conversational. Like the opening scene of a great documentary.',
      consistencyRules: [
        'Story character/scenario MUST reappear in THE WALKTHROUGH.',
        'Question raised MUST be answered by THE FORMALIZATION.',
        'No jargon — only everyday language.',
      ],
    },
    {
      position: 2,
      role: 'INTUITION',
      displayName: 'THE INTUITION',
      purpose: 'Build a mental model using ONE fully developed analogy with mapping table, visual description, and "aha" moment.',
      contentType: 'reading',
      bloomsLevels: ['UNDERSTAND'],
      required: true,
      exampleSnippet: FEW_SHOT_EXAMPLES.beginner.INTUITION,
      wordCountRange: { min: 250, max: 500 },
      formatRules: [
        'Start with "Think of it like..." framing — ONE primary analogy.',
        'Include an analogy mapping table: Left column = familiar concept, Right column = new concept.',
        'Include a visual description: "Picture this..." paragraph.',
        'End with the "aha" statement: one sentence that captures the core insight.',
        'Include a prediction question: "What do you think happens if...?"',
        'NO formal definitions yet — those come in THE FORMALIZATION.',
      ],
      htmlStructure: '<h2>Building Your Mental Model</h2><p>Think of it like...</p><table><tr><th>Familiar Concept</th><th>New Concept</th></tr><tr><td>...</td><td>...</td></tr></table><p><em>Picture this:</em> ...</p><blockquote><strong>Aha:</strong> [One-sentence insight]</blockquote><p>Prediction: What do you think happens if...?</p>',
      tone: 'Warm, exploratory, guiding. Like a mentor explaining over coffee.',
      consistencyRules: [
        'Analogy mapping table MUST be present with at least 3 rows.',
        'Visual description paragraph MUST be present.',
        '"Aha" statement MUST be present.',
        'Same analogy MUST be referenced in PITFALLS and SUMMARY.',
      ],
    },
    {
      position: 3,
      role: 'WALKTHROUGH',
      displayName: 'THE WALKTHROUGH',
      purpose: 'Step-by-step worked example with REAL numbers. Show 3-5 iterations until the pattern emerges.',
      contentType: 'reading',
      bloomsLevels: ['APPLY'],
      required: false,
      exampleSnippet: FEW_SHOT_EXAMPLES.beginner.WALKTHROUGH,
      wordCountRange: { min: 300, max: 500 },
      formatRules: [
        'Use the SAME scenario from THE HOOK with real numbers.',
        'Number every step explicitly.',
        'Show 3-5 iterations — let the PATTERN emerge naturally.',
        'Annotate each step: explain WHY, not just WHAT.',
        'After the pattern appears, state it explicitly: "Notice the pattern:..."',
        'End with: "Let&apos;s verify our answer..."',
      ],
      htmlStructure: '<h2>Worked Example</h2><p>Let&apos;s return to [HOOK scenario]...</p><h3>Iteration 1</h3><ol><li><strong>Step 1:</strong> [Input] → [Process] → [Output]</li></ol><h3>Iteration 2</h3><ol>...</ol><p><strong>The pattern:</strong> ...</p><p>Verification: ...</p>',
      tone: 'Methodical, patient, transparent. Like pair programming with an expert.',
      consistencyRules: [
        'Scenario MUST match THE HOOK story.',
        'Numbers MUST be realistic, not arbitrary.',
        'Pattern statement MUST foreshadow THE FORMALIZATION.',
      ],
    },
    {
      position: 4,
      role: 'FORMALIZATION',
      displayName: 'THE FORMALIZATION',
      purpose: 'Now name things the student already understands. Formula is a TRANSLATION of what they saw, not a revelation.',
      contentType: 'reading',
      bloomsLevels: ['UNDERSTAND'],
      required: true,
      exampleSnippet: FEW_SHOT_EXAMPLES.beginner.FORMALIZATION,
      wordCountRange: { min: 200, max: 400 },
      formatRules: [
        '"Remember the pattern you noticed? That pattern has a name:..."',
        'Definition → Formula/Syntax → Map back to the analogy from THE INTUITION.',
        'Every formula line MUST have a plain-English translation below it.',
        'Use $...$ for inline math and $$...$$ for display equations. Reserve <code> tags for programming code only.',
        'After each definition, show how it matches the worked example numbers.',
      ],
      htmlStructure: '<h2>Formal Definition</h2><p>Remember the pattern? It has a name: ...</p><h3>The Formula</h3><p>$$formula$$</p><p><em>In plain English:</em> ...</p><h3>Mapping to Our Example</h3><p>When we calculated [WALKTHROUGH value], we were doing: ...</p>',
      tone: 'Precise, structured, authoritative but accessible. "You already know this — now we give it a name."',
      consistencyRules: [
        'Every formula MUST have plain-English translation.',
        'MUST reference the analogy from THE INTUITION.',
        'MUST map back to WALKTHROUGH numbers.',
      ],
    },
    {
      position: 5,
      role: 'PLAYGROUND',
      displayName: 'THE PLAYGROUND',
      purpose: '3 progressive exercises with scaffolding removal: guided → semi-guided → independent.',
      contentType: 'assignment',
      bloomsLevels: ['APPLY'],
      required: false,
      exampleSnippet: FEW_SHOT_EXAMPLES.beginner.PLAYGROUND,
      wordCountRange: { min: 250, max: 450 },
      formatRules: [
        'Exactly 3 exercises with decreasing scaffolding.',
        'Exercise 1 (Guided): Full hints, step-by-step template provided, student fills in blanks.',
        'Exercise 2 (Semi-guided): Partial hints, student must figure out some steps.',
        'Exercise 3 (Independent): Just the problem — no scaffolding.',
        'Each exercise has: Prompt → Scaffolding/Hints → Expected Output.',
        'Use the SAME domain as THE HOOK scenario.',
      ],
      htmlStructure: '<h2>Practice Playground</h2><h3>Exercise 1: Guided</h3><p><strong>Task:</strong> ...</p><p><em>Template:</em> Step 1: ___, Step 2: ___</p><p><strong>Expected:</strong> ...</p><h3>Exercise 2: Semi-Guided</h3><p><strong>Task:</strong> ...</p><p><em>Hint:</em> ...</p><h3>Exercise 3: Independent</h3><p><strong>Task:</strong> ...</p>',
      tone: 'Encouraging, challenging, supportive. Celebrate progress.',
      exerciseGuidance: 'Scaffolding removal: Guided (fill-in-the-blanks) → Semi-guided (hints only) → Independent (problem only).',
      consistencyRules: [
        'All 3 exercises MUST use same domain as THE HOOK.',
        'Difficulty MUST increase monotonically.',
        'Guided exercise MUST be nearly trivial (confidence builder).',
        'Independent exercise MUST require full application of the formula.',
      ],
    },
    {
      position: 6,
      role: 'PITFALLS',
      displayName: 'THE PITFALLS',
      purpose: 'Common mistakes with named pitfalls, using the SAME analogy from INTUITION to explain why they fail.',
      contentType: 'reading',
      bloomsLevels: ['UNDERSTAND', 'APPLY'],
      required: false,
      exampleSnippet: FEW_SHOT_EXAMPLES.beginner.PITFALLS,
      wordCountRange: { min: 200, max: 350 },
      formatRules: [
        'Name each pitfall: "The [Name] Trap" — give it a memorable label.',
        'For each pitfall: WRONG example → Why it fails (using THE INTUITION analogy) → RIGHT example.',
        'Include one misconception buster: "Many people think X, but actually Y because..."',
        'Use warning callouts for critical pitfalls.',
        'Address the most common beginner mistake FIRST.',
      ],
      htmlStructure: '<h2>Common Pitfalls</h2><h3>The [Name] Trap</h3><p><strong>WRONG:</strong> ...</p><p><em>Why it fails (remember our analogy):</em> ...</p><p><strong>RIGHT:</strong> ...</p><h3>Misconception Buster</h3><p>Many people think... but actually...</p>',
      tone: 'Direct, protective, experienced. Like a senior developer reviewing code.',
      consistencyRules: [
        'Each pitfall MUST reference the analogy from THE INTUITION.',
        'Named pitfalls MUST use memorable labels.',
        'WRONG/RIGHT pairs MUST be concrete, not abstract.',
      ],
    },
    {
      position: 7,
      role: 'SUMMARY',
      displayName: 'THE SUMMARY',
      purpose: 'Recap with key concepts, formula card, backward connections to prior chapters, and forward preview.',
      contentType: 'reading',
      bloomsLevels: ['REMEMBER', 'UNDERSTAND'],
      required: true,
      wordCountRange: { min: 150, max: 300 },
      formatRules: [
        'Recap in 5-7 bullet points using "You can now..." framing.',
        'Include a formula/concept card: concise reference of key formulas and definitions.',
        'Backward connection: "Remember when..." — link to prior chapters.',
        'Forward preview: "In the next chapter, you will..." — preview what comes next.',
        'Reference key vocabulary from this chapter.',
      ],
      htmlStructure: '<h2>Summary</h2><ul><li>You can now...</li></ul><h3>Formula Card</h3><p><code>formula</code> = plain English</p><h3>Looking Back</h3><p>Remember when... This chapter extended that by...</p><h3>Looking Forward</h3><p>In the next chapter, you will...</p>',
      tone: 'Concise, confident, empowering. The reader should feel accomplished.',
      consistencyRules: [
        'Every concept from FORMALIZATION MUST appear in the summary.',
        'Backward connection MUST reference a specific prior chapter topic.',
        'Forward preview MUST be accurate (or generic if last chapter).',
      ],
    },
    {
      position: 8,
      role: 'CHECKPOINT',
      displayName: 'THE CHECKPOINT',
      purpose: 'Self-assessment with metacognitive reflection and confidence rating.',
      contentType: 'quiz',
      bloomsLevels: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
      required: true,
      wordCountRange: { min: 150, max: 250 },
      formatRules: [
        '3-5 self-assessment questions at appropriate Bloom&apos;s levels.',
        'Include metacognitive reflection: "Rate your confidence 1-5 on each skill."',
        'Mix question types: recall, application, and transfer.',
        'Provide brief answer guidance (not full solutions).',
        'End with: "If you scored below 3 on any skill, revisit..." with specific section references.',
      ],
      htmlStructure: '<h2>Self-Assessment</h2><ol><li>Question...</li></ol><h3>Confidence Check</h3><p>Rate your confidence 1-5 on:</p><ul><li>Skill 1: ___/5</li></ul><p><em>If below 3, revisit THE [SECTION].</em></p>',
      tone: 'Supportive, honest, growth-oriented. No judgment, only guidance.',
      consistencyRules: [
        'Questions MUST test actual content taught in this chapter.',
        'Confidence items MUST map to specific chapter sections.',
        '"Revisit" guidance MUST point to the correct section.',
      ],
    },
  ];
}

// ============================================================================
// Intermediate Sections (7 sections — mechanism-focused, derive-from-scratch)
// ============================================================================

function buildIntermediateSections(): TemplateSectionDef[] {
  return [
    {
      position: 1,
      role: 'PROVOCATION',
      displayName: 'THE PROVOCATION',
      purpose: 'Challenge surface-level understanding with a counterintuitive result or paradox.',
      contentType: 'reading',
      bloomsLevels: ['UNDERSTAND', 'ANALYZE'],
      required: false,
      exampleSnippet: FEW_SHOT_EXAMPLES.intermediate.PROVOCATION,
      wordCountRange: { min: 200, max: 400 },
      formatRules: [
        'Present a result that CONTRADICTS what the student thinks they know.',
        'Frame as: "Most people would say X. They&apos;re wrong. Here&apos;s why..."',
        'Show a concrete example where naive intuition fails.',
        'End with: "By the end of this chapter, you&apos;ll understand why."',
        'NO answers yet — just the provocation.',
      ],
      htmlStructure: '<h2>The Provocation</h2><p>Most people would say... They&apos;re wrong.</p><h3>The Counterintuitive Result</h3><p>Consider this example: ...</p><p><strong>By the end of this chapter, you&apos;ll understand why.</strong></p>',
      tone: 'Provocative, intellectually honest, respectful. Like a professor posing a challenge.',
      consistencyRules: [
        'The provocation MUST be answered by THE DERIVATION.',
        'The counterintuitive result MUST be real, not contrived.',
        'Student&apos;s naive intuition MUST be stated explicitly before being challenged.',
      ],
    },
    {
      position: 2,
      role: 'INTUITION_ENGINE',
      displayName: 'THE INTUITION ENGINE',
      purpose: 'Build 2-3 different mental models for the same concept, then reveal the unifying insight.',
      contentType: 'reading',
      bloomsLevels: ['UNDERSTAND', 'ANALYZE'],
      required: true,
      exampleSnippet: FEW_SHOT_EXAMPLES.intermediate.INTUITION_ENGINE,
      wordCountRange: { min: 400, max: 600 },
      formatRules: [
        'Present Mental Model 1: A concrete analogy or physical intuition.',
        'Present Mental Model 2: A different perspective (geometric, computational, etc.).',
        'Optional Mental Model 3: A domain-specific view if applicable.',
        'After all models: "The Unifying Insight" — one paragraph connecting all perspectives.',
        'Each model must explain the SAME concept from a different angle.',
        'Use comparison table: Model | Strengths | Limitations.',
      ],
      htmlStructure: '<h2>Multiple Perspectives</h2><h3>Mental Model 1: [Name]</h3><p>Think of it as...</p><h3>Mental Model 2: [Name]</h3><p>Alternatively, imagine...</p><h3>The Unifying Insight</h3><p>All these perspectives converge on one key idea: ...</p><table><tr><th>Model</th><th>Strengths</th><th>Limitations</th></tr></table>',
      tone: 'Intellectually engaging, multi-perspective, insightful. Like attending a seminar.',
      consistencyRules: [
        'At least 2 distinct mental models MUST be presented.',
        'Comparison table MUST be present.',
        'Unifying insight MUST connect all models.',
        'Mental models MUST be referenced in DEPTH_DIVE edge cases.',
      ],
    },
    {
      position: 3,
      role: 'DERIVATION',
      displayName: 'THE DERIVATION',
      purpose: 'Derive the key result from scratch with motivated math, English translations at each step, and intuition checks.',
      contentType: 'reading',
      bloomsLevels: ['APPLY', 'ANALYZE'],
      required: true,
      exampleSnippet: FEW_SHOT_EXAMPLES.intermediate.DERIVATION,
      wordCountRange: { min: 500, max: 800 },
      formatRules: [
        'Start with: "We want to find/prove/derive [goal]. Let&apos;s start from what we know."',
        'Number every derivation step.',
        'After EVERY mathematical/formal step, add: "In English: [plain language translation]".',
        'After every 2-3 steps, add an Intuition Check: "Does this match Mental Model [N]? Yes, because..."',
        'Resolve THE PROVOCATION: show exactly where naive intuition breaks down.',
        'End with the final result and "What this tells us is..."',
      ],
      htmlStructure: '<h2>Deriving [Result]</h2><p>Goal: We want to find...</p><h3>Step 1</h3><p><code>formal step</code></p><p><em>In English:</em> ...</p><h3>Intuition Check</h3><p>Does this match Mental Model 1? ...</p><h3>Step 2</h3><p>...</p><p><strong>Final Result:</strong> ...</p><p>What this tells us is: ...</p>',
      tone: 'Rigorous but accessible. Every step earns its place. Like a great textbook.',
      consistencyRules: [
        'Every formal step MUST have a plain-English translation.',
        'Intuition checks MUST reference mental models from INTUITION_ENGINE.',
        'The provocation from section 1 MUST be resolved.',
        'Derivation goal MUST be stated before step 1.',
      ],
    },
    {
      position: 4,
      role: 'LABORATORY',
      displayName: 'THE LABORATORY',
      purpose: '5+ exercises covering: compute, predict-verify, diagnose, compare, and design.',
      contentType: 'assignment',
      bloomsLevels: ['APPLY', 'ANALYZE'],
      required: false,
      exampleSnippet: FEW_SHOT_EXAMPLES.intermediate.LABORATORY,
      wordCountRange: { min: 400, max: 700 },
      formatRules: [
        'Exactly 5 exercises, each a different TYPE:',
        'Exercise 1 (Compute): Direct application of the derived formula.',
        'Exercise 2 (Predict-Verify): "Predict the result, then verify by computing."',
        'Exercise 3 (Diagnose): "Here&apos;s a wrong answer. Find and explain the error."',
        'Exercise 4 (Compare): "Compare approach A vs approach B. When is each better?"',
        'Exercise 5 (Design): "Design a solution for [novel scenario]."',
        'Each exercise has: Context → Task → Expected approach (not full solution).',
      ],
      htmlStructure: '<h2>Laboratory</h2><h3>Ex 1: Compute</h3><p><strong>Context:</strong> ... <strong>Task:</strong> ...</p><h3>Ex 2: Predict-Verify</h3><p>...</p><h3>Ex 3: Diagnose</h3><p><strong>The error:</strong> ... <strong>Find it:</strong> ...</p><h3>Ex 4: Compare</h3><p>...</p><h3>Ex 5: Design</h3><p>...</p>',
      tone: 'Lab-like: structured, precise, experimental. Encourage hypothesis-testing.',
      exerciseGuidance: '5 exercise types: Compute → Predict-Verify → Diagnose → Compare → Design. Increasing cognitive demand.',
      consistencyRules: [
        'All 5 exercise types MUST be present.',
        'Compute exercise MUST use the formula from DERIVATION.',
        'Diagnose exercise MUST feature a realistic error.',
        'Design exercise MUST require novel application.',
      ],
    },
    {
      position: 5,
      role: 'DEPTH_DIVE',
      displayName: 'THE DEPTH DIVE',
      purpose: 'Explore edge cases, breaking conditions, and surprising connections to other topics.',
      contentType: 'reading',
      bloomsLevels: ['ANALYZE', 'EVALUATE'],
      required: false,
      exampleSnippet: FEW_SHOT_EXAMPLES.intermediate.DEPTH_DIVE,
      wordCountRange: { min: 300, max: 500 },
      formatRules: [
        'Edge Cases: "What happens when [parameter] → [extreme]?"',
        'Breaking Conditions: "This approach FAILS when... Here&apos;s why."',
        'Surprising Connections: "This same pattern appears in [different field] because..."',
        'At least 2 edge cases with concrete examples.',
        'At least 1 breaking condition with explanation.',
        'At least 1 cross-topic connection.',
      ],
      htmlStructure: '<h2>Going Deeper</h2><h3>Edge Cases</h3><p>What happens when [X] → ∞? ...</p><h3>Breaking Conditions</h3><p>This fails when... because...</p><h3>Surprising Connections</h3><p>This same pattern appears in [field] because...</p>',
      tone: 'Investigative, curious, rigorous. Like a research discussion.',
      consistencyRules: [
        'Edge cases MUST reference the formula/model from DERIVATION.',
        'Breaking conditions MUST reference mental models from INTUITION_ENGINE.',
        'Connections MUST link to prior or upcoming chapters.',
      ],
    },
    {
      position: 6,
      role: 'SYNTHESIS',
      displayName: 'THE SYNTHESIS',
      purpose: 'Distill key insights, build a concept map, and connect backward/forward to the course arc.',
      contentType: 'reading',
      bloomsLevels: ['ANALYZE', 'EVALUATE'],
      required: true,
      wordCountRange: { min: 200, max: 350 },
      formatRules: [
        'Key Insights: 3-5 bullet points, each a non-obvious takeaway.',
        'Concept Map: Show relationships between concepts introduced in this chapter.',
        'Backward Connection: "This extends [prior chapter concept] by..."',
        'Forward Connection: "This enables [upcoming chapter concept] because..."',
        'Design Principle: One general principle extracted from this chapter.',
      ],
      htmlStructure: '<h2>Synthesis</h2><h3>Key Insights</h3><ul><li>Insight 1 (non-obvious)...</li></ul><h3>Concept Map</h3><p>A → depends on → B → enables → C</p><h3>Connections</h3><p>This extends... This enables...</p><h3>Design Principle</h3><p>"Always [principle]..."</p>',
      tone: 'Reflective, synthesizing, forward-looking. Higher-order thinking.',
      consistencyRules: [
        'Insights MUST be non-obvious (not restating definitions).',
        'Concept map MUST include all major concepts from this chapter.',
        'Backward connection MUST reference specific prior chapter.',
      ],
    },
    {
      position: 7,
      role: 'CHECKPOINT',
      displayName: 'THE CHECKPOINT',
      purpose: 'Self-assessment at ANALYZE/EVALUATE levels with metacognitive confidence rating.',
      contentType: 'quiz',
      bloomsLevels: ['ANALYZE', 'EVALUATE'],
      required: true,
      wordCountRange: { min: 200, max: 350 },
      formatRules: [
        '4-5 self-assessment questions at ANALYZE and EVALUATE Bloom&apos;s levels.',
        'Include at least 1 "explain why" question (not just "what").',
        'Include metacognitive reflection: "Rate your confidence 1-5 on each skill."',
        'Provide brief answer guidance (not full solutions).',
        'End with: "If you scored below 3, revisit THE [SECTION]..." with specific references.',
      ],
      htmlStructure: '<h2>Self-Assessment</h2><ol><li>[ANALYZE] Why does... rather than...?</li><li>[EVALUATE] Which approach is better when...?</li></ol><h3>Confidence Check</h3><p>Rate your confidence 1-5 on:</p><ul><li>Deriving the key result: ___/5</li></ul><p><em>If below 3, revisit THE DERIVATION.</em></p>',
      tone: 'Supportive, honest, growth-oriented. No judgment, only guidance.',
      consistencyRules: [
        'Questions MUST be at ANALYZE or EVALUATE level (not REMEMBER).',
        'Questions MUST test actual content from this chapter.',
        'Confidence items MUST map to specific chapter sections.',
        '"Revisit" guidance MUST point to the correct section.',
      ],
    },
  ];
}

// ============================================================================
// Advanced Sections (8 sections — research-grade, design & critique)
// ============================================================================

function buildAdvancedSections(): TemplateSectionDef[] {
  return [
    {
      position: 1,
      role: 'OPEN_QUESTION',
      displayName: 'THE OPEN QUESTION',
      purpose: 'Frame an intellectual puzzle or research-level question that motivates the chapter.',
      contentType: 'reading',
      bloomsLevels: ['ANALYZE', 'EVALUATE'],
      required: false,
      exampleSnippet: FEW_SHOT_EXAMPLES.advanced.OPEN_QUESTION,
      wordCountRange: { min: 250, max: 450 },
      formatRules: [
        'Pose an open, research-level question that has no trivially obvious answer.',
        'Frame the intellectual stakes: "This matters because..."',
        'Briefly sketch what a naive approach would be and why it&apos;s insufficient.',
        'Reference real-world systems, papers, or practitioners who face this problem.',
        'End with: "To answer this, we need to think from first principles."',
      ],
      htmlStructure: '<h2>The Open Question</h2><p><strong>Question:</strong> [Research-level question]</p><p><strong>Why it matters:</strong> ...</p><p><strong>The naive approach:</strong> ... (and why it fails)</p><p>To answer this, we need to think from first principles.</p>',
      tone: 'Intellectually provocative, research-oriented. Like a PhD seminar opening.',
      consistencyRules: [
        'Question MUST be genuinely open (no trivial answer).',
        'Naive approach MUST be stated before being dismissed.',
        'Question MUST be fully addressed by THE ANALYSIS and DESIGN_STUDIO.',
      ],
    },
    {
      position: 2,
      role: 'INTUITION',
      displayName: 'THE INTUITION',
      purpose: 'One POWERFUL analogy for genuinely counterintuitive aspects — brief but targeted.',
      contentType: 'reading',
      bloomsLevels: ['ANALYZE', 'EVALUATE'],
      required: true,
      exampleSnippet: FEW_SHOT_EXAMPLES.advanced.INTUITION,
      wordCountRange: { min: 200, max: 400 },
      formatRules: [
        'Identify the single most counterintuitive aspect of this chapter&apos;s topic.',
        'Provide ONE powerful analogy that makes it click.',
        'Keep it focused: this is a precision tool, not a lengthy exploration.',
        'Include a brief "Why this is counterintuitive" explanation.',
        'End with: "With this intuition in hand, let&apos;s build from first principles."',
      ],
      htmlStructure: '<h2>Intuition for the Counterintuitive</h2><p><strong>The counterintuitive part:</strong> ...</p><p><strong>The analogy:</strong> Think of it like...</p><p><em>Why this is counterintuitive:</em> Our default assumption is... but actually...</p><p>With this intuition, let&apos;s build from first principles.</p>',
      tone: 'Precise, insightful, efficient. Like a key insight from a survey paper.',
      consistencyRules: [
        'Analogy MUST target a genuinely counterintuitive aspect.',
        'MUST be brief and targeted — not a full mental model development.',
        'MUST bridge into FIRST_PRINCIPLES reasoning.',
      ],
    },
    {
      position: 3,
      role: 'FIRST_PRINCIPLES',
      displayName: 'THE FIRST PRINCIPLES',
      purpose: 'Build the solution from the simplest possible case, adding complexity layer by layer.',
      contentType: 'reading',
      bloomsLevels: ['ANALYZE', 'EVALUATE'],
      required: true,
      exampleSnippet: FEW_SHOT_EXAMPLES.advanced.FIRST_PRINCIPLES,
      wordCountRange: { min: 500, max: 800 },
      formatRules: [
        'Start with: "Let&apos;s strip the problem to its simplest form."',
        'Layer 1: The trivial case — solve it completely.',
        'Layer 2: Add one constraint — how does the solution change?',
        'Layer 3: Add another constraint — what breaks? What new structure emerges?',
        'Layer 4: The full problem — the complete formulation.',
        'At each layer, state what NEW INSIGHT the added complexity reveals.',
        'Mathematical formalism where appropriate, always with English translations.',
      ],
      htmlStructure: '<h2>From First Principles</h2><h3>Layer 1: The Simplest Case</h3><p>Strip everything away: ...</p><h3>Layer 2: Adding [Constraint]</h3><p>Now the solution must account for... New insight: ...</p><h3>Layer 3: Adding [Constraint]</h3><p>This breaks [previous assumption] because... The structure that emerges is...</p><h3>Layer 4: The Full Formulation</h3><p>Putting it all together: ...</p>',
      tone: 'Rigorous, layered, building. Like constructing a proof.',
      consistencyRules: [
        'At least 3 layers MUST be present.',
        'Each layer MUST add exactly one new constraint.',
        'New insight at each layer MUST be stated explicitly.',
        'Final formulation MUST address THE OPEN QUESTION.',
      ],
    },
    {
      position: 4,
      role: 'ANALYSIS',
      displayName: 'THE ANALYSIS',
      purpose: 'Formal analysis: complexity, expressiveness, limitations, and comparison to alternatives.',
      contentType: 'reading',
      bloomsLevels: ['ANALYZE', 'EVALUATE'],
      required: true,
      exampleSnippet: FEW_SHOT_EXAMPLES.advanced.ANALYSIS,
      wordCountRange: { min: 400, max: 700 },
      formatRules: [
        'Complexity Analysis: Time/space complexity or computational cost.',
        'Expressiveness: What can this approach express? What can&apos;t it?',
        'Limitations: Where does it fundamentally fail? Why?',
        'Comparison: How does it compare to alternative approaches?',
        'Trade-off Table: Approach | Strengths | Weaknesses | When to Use.',
        'Include formal notation where appropriate.',
      ],
      htmlStructure: '<h2>Formal Analysis</h2><h3>Complexity</h3><p>Time: O(...), Space: O(...)</p><h3>Expressiveness</h3><p>Can express: ... Cannot express: ...</p><h3>Limitations</h3><p>Fails when... because...</p><h3>Comparison</h3><table><tr><th>Approach</th><th>Strengths</th><th>Weaknesses</th><th>When to Use</th></tr></table>',
      tone: 'Analytical, precise, balanced. Like a systems paper evaluation section.',
      consistencyRules: [
        'Complexity analysis MUST be formal (big-O or equivalent).',
        'Limitations MUST be genuine, not straw-man.',
        'Trade-off table MUST compare at least 2 approaches.',
        'Analysis MUST inform the design choices in DESIGN_STUDIO.',
      ],
    },
    {
      position: 5,
      role: 'DESIGN_STUDIO',
      displayName: 'THE DESIGN STUDIO',
      purpose: '4+ challenges at L4-L6: analyze, evaluate, create, and critique.',
      contentType: 'assignment',
      bloomsLevels: ['ANALYZE', 'EVALUATE', 'CREATE'],
      required: false,
      exampleSnippet: FEW_SHOT_EXAMPLES.advanced.DESIGN_STUDIO,
      wordCountRange: { min: 500, max: 900 },
      formatRules: [
        'At least 4 challenges, each at a different cognitive level:',
        'Challenge 1 (Analyze): "Given [system], identify the design decisions and their trade-offs."',
        'Challenge 2 (Evaluate): "Critique [design]. What would you change and why?"',
        'Challenge 3 (Create): "Design a [system/algorithm/architecture] that satisfies [constraints]."',
        'Challenge 4 (Critique): "Review this [code/design]. Write a constructive critique."',
        'Each challenge has: Context → Constraints → Deliverable → Evaluation Criteria.',
        'Problems should be open-ended with multiple valid solutions.',
      ],
      htmlStructure: '<h2>Design Studio</h2><h3>Challenge 1: Analyze [System]</h3><p><strong>Context:</strong> ...</p><p><strong>Task:</strong> Identify...</p><p><strong>Deliverable:</strong> ...</p><h3>Challenge 2: Evaluate [Design]</h3><p>...</p><h3>Challenge 3: Create [Solution]</h3><p><strong>Constraints:</strong> ...</p><h3>Challenge 4: Critique [Work]</h3><p>...</p>',
      tone: 'Professional, design-oriented, open-ended. Like a senior architecture review.',
      exerciseGuidance: '4 challenge types: Analyze → Evaluate → Create → Critique. All at L4-L6 cognitive demand.',
      consistencyRules: [
        'All 4 challenge types (Analyze, Evaluate, Create, Critique) MUST be present.',
        'Create challenge MUST be open-ended with multiple valid solutions.',
        'Critique challenge MUST require constructive, specific feedback.',
        'Challenges MUST build on THE ANALYSIS trade-offs.',
      ],
    },
    {
      position: 6,
      role: 'FRONTIER',
      displayName: 'THE FRONTIER',
      purpose: 'Open research questions, key papers/resources, and a research project idea.',
      contentType: 'reading',
      bloomsLevels: ['EVALUATE', 'CREATE'],
      required: false,
      exampleSnippet: FEW_SHOT_EXAMPLES.advanced.FRONTIER,
      wordCountRange: { min: 300, max: 500 },
      formatRules: [
        'Open Questions: 2-3 genuinely unsolved or actively researched questions.',
        'Key Resources: 3-5 papers, books, or talks that go deeper.',
        'Research Project Idea: A concrete project the student could pursue.',
        'Frame open questions as opportunities, not roadblocks.',
        'Resources should be real and specific (titles, authors, years).',
      ],
      htmlStructure: '<h2>The Frontier</h2><h3>Open Questions</h3><ul><li>Why does [X] still fail at [Y]? (Active area since ~[year])</li></ul><h3>Key Resources</h3><ul><li>[Author], "[Title]" ([Year]) — [One-line description]</li></ul><h3>Research Project Idea</h3><p><strong>Project:</strong> [Concrete project description]</p><p><strong>Skills needed:</strong> ...</p><p><strong>Expected outcome:</strong> ...</p>',
      tone: 'Inspiring, forward-looking, research-oriented. Like a PhD advisor suggesting directions.',
      consistencyRules: [
        'Open questions MUST be genuinely unsolved or active research.',
        'Resources MUST be real (specific titles, authors, years).',
        'Research project MUST be concrete and actionable.',
        'MUST connect back to THE OPEN QUESTION from section 1.',
      ],
    },
    {
      position: 7,
      role: 'SYNTHESIS',
      displayName: 'THE SYNTHESIS',
      purpose: 'Extract design principles, build concept map, and connect to the broader course arc.',
      contentType: 'reading',
      bloomsLevels: ['EVALUATE', 'CREATE'],
      required: true,
      wordCountRange: { min: 250, max: 400 },
      formatRules: [
        'Design Principles: 3-5 general principles extracted from this chapter.',
        'Concept Map: Relationships between all major concepts in this chapter.',
        'Backward Connection: "This generalizes [prior chapter concept]..."',
        'Forward Connection: "This foundation enables [upcoming topic]..."',
        'Meta-reflection: "The key thinking strategy from this chapter is..."',
      ],
      htmlStructure: '<h2>Synthesis</h2><h3>Design Principles</h3><ul><li>"Always [principle] because [reasoning]."</li></ul><h3>Concept Map</h3><p>A → generalizes → B → enables → C</p><h3>Connections</h3><p>This generalizes... This enables...</p><h3>Thinking Strategy</h3><p>The key thinking strategy: ...</p>',
      tone: 'Reflective, meta-cognitive, principled. Higher-order synthesis.',
      consistencyRules: [
        'Design principles MUST be general (applicable beyond this chapter).',
        'Concept map MUST include all concepts from FIRST_PRINCIPLES layers.',
        'Thinking strategy MUST be a transferable skill.',
      ],
    },
    {
      position: 8,
      role: 'CHECKPOINT',
      displayName: 'THE CHECKPOINT',
      purpose: 'Self-assessment at EVALUATE/CREATE levels with research readiness reflection.',
      contentType: 'quiz',
      bloomsLevels: ['EVALUATE', 'CREATE'],
      required: true,
      wordCountRange: { min: 250, max: 400 },
      formatRules: [
        '4-5 self-assessment questions at EVALUATE and CREATE Bloom&apos;s levels.',
        'Include at least 1 "design" question: "How would you..."',
        'Include at least 1 "evaluate" question: "Critique this approach..."',
        'Metacognitive reflection: "Rate your confidence 1-5 on each competency."',
        'Research readiness: "Could you explain this to a colleague? Write a 2-sentence explanation."',
        'End with: "If below 3, revisit THE [SECTION]..." with specific references.',
      ],
      htmlStructure: '<h2>Self-Assessment</h2><ol><li>[EVALUATE] Critique this approach: ...</li><li>[CREATE] Design a solution for: ...</li></ol><h3>Confidence Check</h3><p>Rate 1-5:</p><ul><li>First-principles reasoning: ___/5</li><li>Design under constraints: ___/5</li></ul><h3>Research Readiness</h3><p>Explain this chapter&apos;s key concept in 2 sentences: ___</p><p><em>If below 3, revisit THE FIRST PRINCIPLES.</em></p>',
      tone: 'Supportive, honest, growth-oriented. Emphasize research readiness.',
      consistencyRules: [
        'Questions MUST be at EVALUATE or CREATE level.',
        'Questions MUST test actual content from this chapter.',
        'Research readiness prompt MUST be included.',
        '"Revisit" guidance MUST point to the correct section.',
      ],
    },
  ];
}

// ============================================================================
// Template Definitions
// ============================================================================

const BEGINNER_TEMPLATE: ChapterTemplate = {
  difficulty: 'beginner',
  displayName: 'Beginner Template',
  totalSections: 8,
  chapterWordRange: { min: 1500, max: 3000 },
  teachingLaws: TEACHING_LAWS,
  sections: buildBeginnerSections(),
  exerciseTypes: ['Guided', 'Semi-guided', 'Independent'],
  designPhilosophy: 'Target: Smart 14-year-old with zero prior knowledge. Tone: Warm, patient, uses everyday analogies. Analogy density: VERY HIGH — one fully-developed analogy per chapter with mapping table. Math level: Arithmetic only, no algebra unless chapter topic IS algebra. Pace: Slow, repeat key ideas in different words. Goal: Student can EXPLAIN the concept to a friend using the analogy.',
  chapterChecklist: [
    'Story from THE HOOK reappears in THE WALKTHROUGH with real numbers.',
    'Analogy from THE INTUITION is referenced in PITFALLS and SUMMARY.',
    'Every formula in FORMALIZATION has a plain-English translation.',
    'PLAYGROUND exercises use the same domain as THE HOOK.',
    'Difficulty increases monotonically: HOOK → PLAYGROUND.',
    'CHECKPOINT questions map to specific sections for "revisit" guidance.',
  ],
  estimatedTimePerChapter: '55-75 minutes',
  explainToAFriend: 'A smart 14-year-old with no prior knowledge of the topic.',
};

const INTERMEDIATE_TEMPLATE: ChapterTemplate = {
  difficulty: 'intermediate',
  displayName: 'Intermediate Template',
  totalSections: 7,
  chapterWordRange: { min: 2500, max: 4500 },
  teachingLaws: TEACHING_LAWS,
  sections: buildIntermediateSections(),
  exerciseTypes: ['Compute', 'Predict-verify', 'Diagnose', 'Compare', 'Design'],
  designPhilosophy: 'Target: CS undergraduate who knows the basics but not WHY things work. Tone: Intellectually engaging, challenges assumptions. Analogy density: MODERATE — 2-3 mental models per chapter, compared in a table. Math level: Algebra + basic calculus when needed, always with English translation. Pace: Moderate — move efficiently but pause for intuition checks. Goal: Student can DERIVE the key result from scratch and know WHEN it breaks.',
  chapterChecklist: [
    'THE PROVOCATION is resolved by THE DERIVATION.',
    'Every derivation step has a plain-English translation.',
    'Intuition checks in DERIVATION reference mental models from INTUITION_ENGINE.',
    'LABORATORY has all 5 exercise types (compute, predict-verify, diagnose, compare, design).',
    'DEPTH_DIVE edge cases reference the derived formula.',
    'SYNTHESIS insights are non-obvious (not restating definitions).',
    'CHECKPOINT questions are at ANALYZE/EVALUATE level (not REMEMBER).',
  ],
  estimatedTimePerChapter: '62-85 minutes',
  explainToAFriend: 'A CS undergraduate who has taken introductory courses.',
};

const ADVANCED_TEMPLATE: ChapterTemplate = {
  difficulty: 'advanced',
  displayName: 'Advanced Template',
  totalSections: 8,
  chapterWordRange: { min: 3500, max: 6000 },
  teachingLaws: TEACHING_LAWS,
  sections: buildAdvancedSections(),
  exerciseTypes: ['Analysis', 'Evaluation', 'Creation', 'Critique'],
  designPhilosophy: 'Target: Graduate student or experienced practitioner seeking deep understanding. Tone: Collegial, research-oriented, intellectually honest about limitations. Analogy density: LOW but targeted — one powerful analogy only for genuinely counterintuitive ideas. Math level: Full formalism when needed, always motivated and translated. Pace: Efficient — assume strong foundations, focus on novel insights. Goal: Student can DESIGN novel solutions, CRITIQUE existing approaches, and identify RESEARCH DIRECTIONS.',
  chapterChecklist: [
    'THE OPEN QUESTION is genuinely open (not trivially answerable).',
    'THE INTUITION targets a specifically counterintuitive aspect.',
    'FIRST_PRINCIPLES has at least 3 layers of increasing complexity.',
    'THE ANALYSIS includes formal complexity analysis and trade-off table.',
    'DESIGN_STUDIO has all 4 challenge types (analyze, evaluate, create, critique).',
    'THE FRONTIER references real papers/resources with specific titles.',
    'CHECKPOINT includes research readiness assessment.',
  ],
  estimatedTimePerChapter: '83-115 minutes',
  explainToAFriend: 'A PhD student or senior engineer in a related field.',
};

const TEMPLATES: Record<string, ChapterTemplate> = {
  beginner: BEGINNER_TEMPLATE,
  intermediate: INTERMEDIATE_TEMPLATE,
  advanced: ADVANCED_TEMPLATE,
};

// ============================================================================
// Lookup Functions
// ============================================================================

/**
 * Get the chapter template for a given difficulty level.
 * Falls back to advanced for 'expert' and intermediate for unknown values.
 */
export function getTemplateForDifficulty(difficulty: string): ChapterTemplate {
  const normalized = difficulty.toLowerCase();
  if (normalized === 'expert') return TEMPLATES.advanced;
  return TEMPLATES[normalized] ?? TEMPLATES.intermediate;
}

/**
 * Get the template section definition for a specific position within a difficulty template.
 */
export function getTemplateSectionDef(difficulty: string, position: number): TemplateSectionDef {
  const template = getTemplateForDifficulty(difficulty);
  if (position < 1 || position > template.totalSections) {
    throw new Error(`Position ${position} out of range [1, ${template.totalSections}] for difficulty "${difficulty}"`);
  }
  const section = template.sections.find(s => s.position === position);
  if (!section) {
    throw new Error(`No template section at position ${position} for difficulty "${difficulty}"`);
  }
  return section;
}

// ============================================================================
// Prompt Block Composition
// ============================================================================

/**
 * Compose template constraint blocks for injection into Stage 1/2/3 prompts.
 * These blocks are additive — they layer on top of existing prompt content.
 */
export function composeTemplatePromptBlocks(
  template: ChapterTemplate,
  sectionPosition: number,
  options?: {
    totalSectionsOverride?: number;
    sectionDefOverride?: TemplateSectionDef;
    sequenceOverride?: TemplateSectionDef[];
  },
): ComposedTemplatePrompt {
  const effectiveTotalSections = Math.max(
    1,
    Math.min(options?.totalSectionsOverride ?? template.totalSections, template.sections.length),
  );
  const effectiveSequence = options?.sequenceOverride?.length
    ? options.sequenceOverride
    : template.sections.slice(0, effectiveTotalSections);

  const sectionDef = options?.sectionDefOverride
    ?? effectiveSequence.find(s => s.position === sectionPosition)
    ?? template.sections.find(s => s.position === sectionPosition);
  if (!sectionDef) {
    return { stage1Block: '', stage2Block: '', stage3Block: '', totalSections: effectiveTotalSections };
  }

  // Stage 1: Chapter-level awareness of section DNA
  const sectionList = effectiveSequence
    .map(s => `  ${s.position}. ${s.displayName} (${s.contentType}) — ${s.purpose.split('.')[0]}`)
    .join('\n');

  const stage1Block = `
## CHAPTER DNA TEMPLATE (${template.displayName})

${template.designPhilosophy}

This chapter MUST contain exactly ${effectiveTotalSections} sections following the Chapter DNA structure.
Design your chapter topics and learning arc to work with this fixed structure:

${sectionList}

**5 Unbreakable Teaching Laws:**
${template.teachingLaws.map((law, i) => `${i + 1}. ${law}`).join('\n')}

**Chapter Word Range:** ${template.chapterWordRange.min}-${template.chapterWordRange.max} words total.
**Estimated Time:** ${template.estimatedTimePerChapter}
**Exercise Types (for practice sections):** ${template.exerciseTypes.join(' → ')}
**Explain-to-a-Friend Test:** Could a student explain this chapter to ${template.explainToAFriend}?

**Chapter Checklist (verify ALL before finalizing):**
${template.chapterChecklist.map((item, i) => `${i + 1}. ${item}`).join('\n')}

**Universal Consistency Rules:**
${UNIVERSAL_CONSISTENCY_RULES.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

Your \`topicsToExpand\` should list 3-5 key concepts that will be woven through these ${effectiveTotalSections} sections.
They are NOT section titles — the section structure is fixed by the template.`;

  // Stage 2: Section role + format constraints
  const stage2Block = `
## CHAPTER DNA — SECTION ROLE

This is section ${sectionDef.position} of ${effectiveTotalSections}: **${sectionDef.displayName}**
**Role:** ${sectionDef.purpose}
**Fixed Content Type:** ${sectionDef.contentType}
**Bloom&apos;s Level:** ${sectionDef.bloomsLevels.join(', ')}
**Word Count Target:** ${sectionDef.wordCountRange.min}-${sectionDef.wordCountRange.max} words
**Tone:** ${sectionDef.tone}

The content type for this section is FIXED to "${sectionDef.contentType}" — do not change it.
The \`topicFocus\` should describe WHAT specific aspect of the chapter topic this section covers within its role as ${sectionDef.displayName}.

**Format Rules:**
${sectionDef.formatRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;

  // Stage 3: Section-type-specific content format rules
  const exerciseGuidance = sectionDef.exerciseGuidance
    ? `\n\n**Exercise Structure (${template.exerciseTypes.join(' → ')}):**\n${sectionDef.exerciseGuidance}`
    : '';

  const consistencyBlock = sectionDef.consistencyRules.length > 0
    ? `\n\n**Consistency Rules (MUST verify):**\n${sectionDef.consistencyRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
    : '';

  const exampleBlock = sectionDef.exampleSnippet
    ? `\n\n## GOLD STANDARD EXAMPLE\nThe following is an example of excellent ${sectionDef.displayName} content. Use it as a quality reference for tone, structure, and depth — but generate ORIGINAL content for the actual course topic.\n\n${sectionDef.exampleSnippet}`
    : '';

  const stage3Block = `
## CHAPTER DNA — CONTENT FORMAT FOR ${sectionDef.displayName}

**Section Type:** ${sectionDef.displayName} (Position ${sectionDef.position}/${effectiveTotalSections})
**Purpose:** ${sectionDef.purpose}
**Word Count:** ${sectionDef.wordCountRange.min}-${sectionDef.wordCountRange.max} words
**Bloom&apos;s Level:** ${sectionDef.bloomsLevels.join(', ')}

**Format Rules (MUST follow):**
${sectionDef.formatRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

**Expected HTML Structure:**
${sectionDef.htmlStructure}

**Tone/Style:** ${sectionDef.tone}
${exerciseGuidance}
${consistencyBlock}
${exampleBlock}

**Explain-to-a-Friend Test:** ${template.explainToAFriend}

**Teaching Laws (verify compliance):**
${template.teachingLaws.map((law, i) => `${i + 1}. ${law}`).join('\n')}

IMPORTANT: The description HTML must follow the format rules and HTML structure above.
Do NOT use the generic 5-h2 lesson structure — use the section-type-specific structure for ${sectionDef.displayName}.`;

  return { stage1Block, stage2Block, stage3Block, totalSections: effectiveTotalSections };
}

// ============================================================================
// Dynamic Section Selection
// ============================================================================

/** Minimum number of sections allowed per chapter (hard floor) */
const MIN_SECTIONS = 1;
/** Maximum number of sections allowed per chapter (hard ceiling) */
const MAX_SECTIONS = 10;

/**
 * Select which template sections to include for a chapter, based on
 * an optional AI-recommended count, Bloom's level, and complexity.
 *
 * Always includes all `required` sections. Fills the remaining count
 * from optional sections, ranked by relevance to the chapter's Bloom's level.
 *
 * @param template         The full chapter template for this difficulty
 * @param recommendedCount Optional AI-recommended section count (bounded 5-10)
 * @param chapterBloomsLevel The chapter's primary Bloom's level (for optional ranking)
 * @param chapterComplexity  Heuristic complexity of this chapter
 * @returns Selected sections with positions re-numbered 1..N
 */
export function selectTemplateSections(
  template: ChapterTemplate,
  recommendedCount: number | undefined,
  chapterBloomsLevel: BloomsLevel,
  chapterComplexity: 'low' | 'medium' | 'high' = 'medium',
): TemplateSectionDef[] {
  const requiredSections = template.sections.filter(s => s.required);
  const optionalSections = template.sections.filter(s => !s.required);

  // Determine target count
  let targetCount: number;
  if (recommendedCount !== undefined) {
    targetCount = Math.max(MIN_SECTIONS, Math.min(MAX_SECTIONS, recommendedCount));
  } else {
    // Complexity heuristic
    switch (chapterComplexity) {
      case 'low':
        targetCount = MIN_SECTIONS;
        break;
      case 'high':
        targetCount = Math.min(MAX_SECTIONS, template.totalSections);
        break;
      case 'medium':
      default:
        targetCount = template.totalSections; // Use template default
    }
  }

  // If target is at or below required count, just use required
  if (targetCount <= requiredSections.length) {
    return requiredSections
      .sort((a, b) => a.position - b.position)
      .slice(0, targetCount)
      .map((s, i) => ({ ...s, position: i + 1 }));
  }

  // Rank optional sections by relevance to Bloom's level
  const rankedOptional = [...optionalSections].sort((a, b) => {
    const aRelevance = a.bloomsLevels.includes(chapterBloomsLevel) ? 1 : 0;
    const bRelevance = b.bloomsLevels.includes(chapterBloomsLevel) ? 1 : 0;
    if (bRelevance !== aRelevance) return bRelevance - aRelevance;
    // Secondary sort: preserve original order
    return a.position - b.position;
  });

  const optionalToInclude = rankedOptional.slice(0, targetCount - requiredSections.length);

  // Merge required + selected optional, sorted by original position
  const selected = [...requiredSections, ...optionalToInclude]
    .sort((a, b) => a.position - b.position);

  // Re-number positions 1..N
  return selected.map((s, i) => ({ ...s, position: i + 1 }));
}

// ============================================================================
// Exports for external consumers
// ============================================================================

export { TEACHING_LAWS };
