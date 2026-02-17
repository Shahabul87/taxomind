/**
 * Roadmap Generator — Stage 1 of Breadth-First Course Creation Pipeline
 *
 * Generates the COMPLETE course roadmap (all chapter titles + all section titles)
 * in a single AI call with optional self-review refinement.
 *
 * Think of it like a professor planning a full semester syllabus:
 * first outline ALL lecture titles, then write each module description.
 *
 * Flow:
 * 1. Build roadmap prompt from course context + blueprint + memory
 * 2. Single AI call to generate full roadmap
 * 3. Parse response with CourseRoadmapSchema
 * 4. Self-review: second AI call evaluates consistency, coverage, Bloom's
 * 5. If review score < 75 AND rounds < 2: refinement call, loop back
 * 6. Return finalized CourseRoadmap
 */

import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { CourseRoadmapSchema, RoadmapReviewSchema } from './response-schemas';
import { getCourseDesignExpertise } from './prompts';
import { sanitizeCourseContext, traceAICall } from './helpers';
import { buildMemoryRecallBlock } from './memory-recall';
import type { RecalledMemory } from './memory-recall';
import { validateBFRoadmap } from './bf-quality-gates';
import type {
  CourseContext,
  CourseRoadmap,
  RoadmapChapter,
  CourseBlueprintPlan,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const MAX_REFINEMENT_ROUNDS = 2;
const SELF_REVIEW_ACCEPT_THRESHOLD = 80;
const MAX_ROADMAP_GENERATION_RETRIES = 2;

// ============================================================================
// Roadmap Design Principles (injected into system prompt)
// ============================================================================

const ROADMAP_DESIGN_PRINCIPLES = `## ROADMAP DESIGN PRINCIPLES

### What is a Course Roadmap?
A roadmap is the COMPLETE SKELETON of a course — every chapter title and every section
title, designed as a coherent whole. Think of it like a professor planning an entire
semester syllabus before writing any lecture content.

### Roadmap Quality Criteria
1. **Coherent Progression**: Chapters build logically — each chapter&apos;s concepts are
   prerequisites for later chapters
2. **No Duplication**: No two chapters cover the same topic. No two section titles
   across the ENTIRE course are identical or near-identical
3. **Bloom&apos;s Progression**: Cognitive levels advance non-decreasingly across chapters
   (REMEMBER -> UNDERSTAND -> APPLY -> ANALYZE -> EVALUATE -> CREATE)
4. **ARROW Arc Per Chapter**: Each chapter&apos;s sections follow the ARROW framework
   (hook -> reverse-engineer -> intuition -> formalization -> failure -> practice -> reflection)
5. **Concept Coverage**: All course learning objectives are addressed by at least
   one chapter. The roadmap collectively covers what a student needs to master this
   subject at this difficulty level
6. **Specific Titles**: Section titles are outcome-oriented and specific, NOT generic
   ("Building REST APIs with Express.js" not "Introduction to APIs")
   NEVER use generic titles like "Section 1 of Chapter 1" or "Chapter N: Topic — Part N"

## ROADMAP GENERATION THINKING PROCESS

Before generating any titles, think through:

### 1. KNOWLEDGE DOMAIN MAPPING
- What are the 4-8 major knowledge domains this course covers?
- What is the dependency graph between them? (A requires B)
- Which domains are foundational (must come first)?

### 2. CHAPTER ARC DESIGN
For EACH chapter:
- What real-world APPLICATION makes this chapter irresistible? (ARROW Phase 1)
- What concepts MUST be introduced here vs later?
- What Bloom&apos;s level fits this position in the course?

### 3. SECTION ARC DESIGN (Per Chapter)
Sections within each chapter MUST follow the ARROW progression:
- Section 1: Hook + Application — the "why this matters" moment
- Sections 2-3: Reverse engineer + Intuition — build understanding
- Sections 3-4: Formalization + Theory — the rigorous treatment
- Section N-1: Failure analysis or practice — what breaks and why
- Section N: Reflection + Design challenge — connect the dots

### 4. CROSS-COURSE CONSISTENCY CHECK
Before finalizing:
- Are all course learning objectives covered?
- Do section titles across the ENTIRE course avoid duplication?
- Does Bloom&apos;s progression advance non-decreasingly?
- Are concepts introduced once and built upon later (spiral)?

### 5. COVERAGE VERIFICATION
Walk through each course learning objective and confirm at least one chapter covers it.
If any objective is orphaned, add or modify a chapter to address it.

### 6. DUPLICATION CHECK
Compare every pair of section titles across the ENTIRE course:
- If two titles share more than ~60% of their meaningful words, they are near-duplicates
- Fix by making each title specific to its unique angle (e.g., "Building REST APIs" vs "Testing REST APIs")
- Also check chapter titles — no two chapters should cover the same broad topic

### 7. TITLE QUALITY CHECK
Review every title for generic patterns to REJECT:
- "Introduction to X" → Replace with specific outcome: "How X Powers Modern Y"
- "Chapter N: Topic" → Replace with engaging, specific title
- "Part 1 / Part 2" → Each section must stand on its own with a unique angle
- Titles should tell students WHAT they will be able to DO, not just what they will read`;

const DIFFICULTY_ROADMAP_GUIDANCE: Record<string, string> = {
  beginner: `### DIFFICULTY: BEGINNER
- Include detailed vocabulary-building sections early in each chapter
- Maximize intuition-building: analogies, visual explanations, real-world parallels
- Maximum 3 new concepts per section — avoid cognitive overload
- Chapters should open with simple, relatable analogies before any abstraction
- Bloom&apos;s range: REMEMBER → APPLY (reach APPLY by final chapter at most)
- Sections titled with friendly, approachable language (avoid jargon in titles)
- Every chapter needs at least one "try it yourself" practice section`,
  intermediate: `### DIFFICULTY: INTERMEDIATE
- Balance theory and practice — each chapter has both conceptual and applied sections
- Include failure analysis sections (what goes wrong, common mistakes, debugging)
- Connect chapters to industry applications and real-world scenarios
- Bloom&apos;s range: UNDERSTAND → EVALUATE
- Introduce design trade-offs and decision-making frameworks
- Sections can assume foundational vocabulary — focus on depth over breadth`,
  advanced: `### DIFFICULTY: ADVANCED
- Push toward mastery with design challenges and capstone-style projects
- Fewer sections for basic intuition, more for deep application and analysis
- Include open-ended problems with real-world constraints
- Bloom&apos;s range: APPLY → CREATE
- Sections should challenge assumptions and explore edge cases
- Each chapter should have a synthesis or design challenge section`,
  expert: `### DIFFICULTY: EXPERT
- Focus on frontier knowledge, research-level understanding, and original thinking
- Include critical analysis of existing approaches and their limitations
- Design challenges should require novel solutions and creative problem-solving
- Bloom&apos;s range: ANALYZE → CREATE (start high, end at CREATE)
- Sections should assume deep background — focus on advancing the field
- Include meta-cognitive sections: reflect on thinking processes and strategies`,
};

// ============================================================================
// Prompt Builders
// ============================================================================

function buildRoadmapSystemPrompt(difficulty: string, variant?: string): string {
  const difficultyKey = difficulty.toLowerCase();
  const difficultyGuidance = DIFFICULTY_ROADMAP_GUIDANCE[difficultyKey] ?? DIFFICULTY_ROADMAP_GUIDANCE['intermediate'];

  return `${getCourseDesignExpertise(variant)}

${ROADMAP_DESIGN_PRINCIPLES}

${difficultyGuidance}`;
}

function buildRoadmapUserPrompt(
  courseContext: CourseContext,
  blueprintPlan: CourseBlueprintPlan | null,
  recalledMemory: RecalledMemory | null,
): string {
  const ctx = sanitizeCourseContext(courseContext);
  const totalSections = ctx.totalChapters * ctx.sectionsPerChapter;

  // Blueprint guidance (if available)
  let blueprintBlock = '';
  if (blueprintPlan) {
    blueprintBlock = `
## BLUEPRINT GUIDANCE (Suggested — you may adjust titles but respect the conceptual direction)
${blueprintPlan.chapterPlan.map(entry =>
  `Ch${entry.position}: "${entry.suggestedTitle}" [${entry.bloomsLevel}] — ${entry.primaryFocus}`
).join('\n')}
`;
  }

  // Memory recall (if available)
  const memoryBlock = recalledMemory ? buildMemoryRecallBlock(recalledMemory) : '';

  return `## COURSE CONTEXT
- **Title**: "${ctx.courseTitle}"
- **Description**: ${ctx.courseDescription}
- **Category**: ${ctx.courseCategory}${ctx.courseSubcategory ? ` > ${ctx.courseSubcategory}` : ''}
- **Target Audience**: ${ctx.targetAudience}
- **Difficulty**: ${ctx.difficulty}${ctx.duration ? `\n- **Target Duration**: ${ctx.duration}` : ''}
- **Course Learning Objectives**:
${ctx.courseLearningObjectives.map((obj, i) => `  ${i + 1}. ${obj}`).join('\n')}
- **Bloom&apos;s Focus Levels**: ${ctx.bloomsFocus.join(', ') || 'Auto-progressive'}
${blueprintBlock}${memoryBlock}
## YOUR TASK
Generate the COMPLETE roadmap for this course.
- EXACTLY ${ctx.totalChapters} chapters
- EXACTLY ${ctx.sectionsPerChapter} sections per chapter
- Total: ${totalSections} section titles

## THINKING PROCESS
1. What are the major knowledge domains this course must cover?
2. How should these domains be sequenced for progressive learning?
3. What Bloom&apos;s level fits each chapter position?
4. For each chapter: what ARROW-driven section arc makes pedagogical sense?
5. Self-check: are all course objectives addressed? Any gaps?

## OUTPUT (JSON)
Return a JSON object with this EXACT structure:
{
  "structuralReasoning": "2-4 sentence explanation of the course arc and sequencing rationale",
  "chapters": [
    {
      "position": 1,
      "title": "Specific, outcome-oriented chapter title",
      "focusSummary": "1-2 sentence focus description",
      "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
      "keyConcepts": ["concept1", "concept2", "concept3"],
      "sections": [
        {
          "position": 1,
          "title": "Specific section title",
          "arrowRole": "hook|reverse-engineer|intuition|formalization|failure-analysis|design-challenge|practice|reflection",
          "contentType": "video|reading|assignment|quiz|project|discussion"
        }
      ]
    }
  ]
}

Return ONLY valid JSON, no markdown formatting.`;
}

function buildSelfReviewPrompt(roadmapJson: string, courseContext: CourseContext): string {
  return `## TASK: Review This Course Roadmap

You are reviewing a course roadmap for "${courseContext.courseTitle}" (${courseContext.difficulty} level, ${courseContext.totalChapters} chapters).

## ROADMAP TO REVIEW
${roadmapJson}

## COURSE LEARNING OBJECTIVES (Must all be covered)
${courseContext.courseLearningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

## REVIEW CRITERIA
Review for these specific quality criteria:
1. DUPLICATE CHECK: Any overlapping chapter topics or near-identical section titles?
   Test this rigorously: compare every pair of section titles across the entire course.
   If two titles share more than ~60% of their meaningful words (ignoring short words like
   "the", "and", "to"), they are near-duplicates that MUST be fixed.
2. PROGRESSION CHECK: Do Bloom&apos;s levels advance non-decreasingly?
3. COVERAGE CHECK: Do chapters collectively cover ALL course objectives?
4. CONCEPT CHECK: Are keyConcepts unique across chapters (no repeated concepts)?
5. ARROW CHECK: Does each chapter&apos;s sections follow a valid ARROW arc?
6. SPECIFICITY CHECK: Are titles specific and outcome-oriented (not generic)?
   Reject: "Introduction to X", "Chapter N: Topic", "Part 1/Part 2", "Overview of X"
7. TITLE QUALITY: Do all titles tell students what they will DO or LEARN, not just what they will read?

Score 0-100 and list specific issues with types.

## OUTPUT (JSON)
{
  "overallScore": 85,
  "issues": [
    {
      "type": "duplicate_topic|bloom_regression|coverage_gap|concept_overlap|arrow_violation|title_generic",
      "description": "Specific description of the issue",
      "affectedChapters": [1, 3],
      "affectedSections": ["Section title 1"]
    }
  ],
  "verdict": "accept|refine"
}

Return ONLY valid JSON, no markdown formatting.`;
}

function buildRefinementPrompt(
  roadmapJson: string,
  issues: Array<{ type: string; description: string }>,
): string {
  return `## TASK: Fix Roadmap Issues

The following issues were found in the course roadmap:
${issues.map((i, idx) => `${idx + 1}. [${i.type}] ${i.description}`).join('\n')}

## CURRENT ROADMAP
${roadmapJson}

Fix ONLY the identified issues. Keep everything else unchanged.
Return the complete REVISED roadmap JSON in the same format.

Return ONLY valid JSON, no markdown formatting.`;
}

// ============================================================================
// Compact Roadmap Serializers
// ============================================================================

/**
 * ~300-500 tokens — used in Stage 2 (chapter detail generation).
 * Includes focus summary, concepts, and section titles with roles.
 */
export function buildCompactRoadmapBlock(roadmap: CourseRoadmap): string {
  return roadmap.chapters.map(ch =>
    `Ch${ch.position}: "${ch.title}" [${ch.bloomsLevel}] — ${ch.focusSummary}\n` +
    `  Concepts: ${ch.keyConcepts.join(', ')}\n` +
    `  Sections: ${ch.sections.map(s => `${s.position}."${s.title}" (${s.arrowRole ?? 'content'})`).join(' | ')}`
  ).join('\n\n');
}

/**
 * ~150-200 tokens — used in Stage 3 (section detail generation).
 * Minimal: just chapter titles and section titles.
 */
export function buildMinimalRoadmapBlock(roadmap: CourseRoadmap): string {
  return roadmap.chapters.map(ch =>
    `Ch${ch.position}: "${ch.title}" [${ch.bloomsLevel}] — ` +
    ch.sections.map(s => `"${s.title}"`).join(', ')
  ).join('\n');
}

// ============================================================================
// Main Entry Point
// ============================================================================

export interface GenerateRoadmapOptions {
  onSSEEvent?: (event: { type: string; data: Record<string, unknown> }) => void;
  runId?: string;
  maxRefinementRounds?: number;
  variant?: string;
}

/**
 * Generate a complete course roadmap (all chapter + section titles) in a single
 * AI call with self-review refinement loop.
 */
export async function generateCourseRoadmap(
  userId: string,
  courseContext: CourseContext,
  blueprintPlan: CourseBlueprintPlan | null,
  recalledMemory: RecalledMemory | null,
  options: GenerateRoadmapOptions = {},
): Promise<CourseRoadmap> {
  const { onSSEEvent, runId, maxRefinementRounds = MAX_REFINEMENT_ROUNDS, variant } = options;

  onSSEEvent?.({
    type: 'roadmap_generating',
    data: { message: 'Generating complete course roadmap...' },
  });

  // Step 1: Generate initial roadmap
  const systemPrompt = buildRoadmapSystemPrompt(courseContext.difficulty, variant);
  const userPrompt = buildRoadmapUserPrompt(courseContext, blueprintPlan, recalledMemory);

  let rawResponse = await traceAICall(
    { runId, stage: 0, label: 'Roadmap generation' },
    () => runSAMChatWithPreference({
      userId,
      capability: 'course',
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
      maxTokens: 4000,
      temperature: 0.7,
      extended: true,
    }),
  );

  let roadmap = parseRoadmapResponse(rawResponse, courseContext);

  // Retry on parse failure or generic titles (up to MAX_ROADMAP_GENERATION_RETRIES)
  if (!roadmap) {
    for (let retry = 0; retry < MAX_ROADMAP_GENERATION_RETRIES; retry++) {
      logger.info('[ROADMAP_GENERATOR] Retrying roadmap generation', { retry: retry + 1 });
      onSSEEvent?.({
        type: 'roadmap_retry',
        data: { message: `Retrying roadmap generation (attempt ${retry + 2})...`, retry: retry + 1 },
      });

      rawResponse = await traceAICall(
        { runId, stage: 0, label: `Roadmap generation retry ${retry + 1}` },
        () => runSAMChatWithPreference({
          userId,
          capability: 'course',
          messages: [{ role: 'user', content: `${userPrompt}\n\nIMPORTANT: Return ONLY valid JSON. Do NOT wrap in markdown code blocks. Every chapter and section MUST have a specific, descriptive title — NEVER use generic titles like "Section 1 of Chapter 1".` }],
          systemPrompt,
          maxTokens: 4000,
          temperature: 0.5, // Lower temperature for more reliable output
          extended: true,
        }),
      );

      roadmap = parseRoadmapResponse(rawResponse, courseContext);
      if (roadmap) break;
    }

    // Final fallback if all retries failed
    if (!roadmap) {
      logger.warn('[ROADMAP_GENERATOR] All roadmap generation attempts failed, using fallback');
      roadmap = buildFallbackRoadmap(courseContext);
      roadmap.isFallback = true;
    }
  }

  // Step 1.5: BF Quality Gate — structural validation before AI self-review
  const bfGateResult = validateBFRoadmap(roadmap, courseContext);
  if (!bfGateResult.passed) {
    logger.info('[ROADMAP_GENERATOR] BF quality gate found issues', {
      score: bfGateResult.score,
      errors: bfGateResult.errorCount,
      warnings: bfGateResult.warningCount,
    });

    // If structural issues exist and refinement feedback is available, do one refinement pass
    if (bfGateResult.refinementFeedback) {
      onSSEEvent?.({
        type: 'roadmap_refining',
        data: { message: `Fixing ${bfGateResult.errorCount} structural issues...`, issues: bfGateResult.errorCount },
      });

      const gateRefinementPrompt = buildRefinementPrompt(
        JSON.stringify(roadmap.chapters, null, 2),
        bfGateResult.checks
          .filter(c => !c.passed)
          .map(c => ({ type: c.name, description: c.message })),
      );

      const gateRefinedResponse = await traceAICall(
        { runId, stage: 0, label: 'Roadmap BF gate refinement' },
        () => runSAMChatWithPreference({
          userId,
          capability: 'course',
          messages: [{ role: 'user', content: gateRefinementPrompt }],
          systemPrompt,
          maxTokens: 4000,
          temperature: 0.5,
          extended: true,
        }),
      );

      const gateRefinedRoadmap = parseRoadmapResponse(gateRefinedResponse, courseContext);
      if (gateRefinedRoadmap) {
        roadmap = gateRefinedRoadmap;
        logger.info('[ROADMAP_GENERATOR] BF gate refinement applied successfully');
      }
    }
  }

  // Step 2: Self-review loop
  let selfReviewScore = 0;
  let refinementRounds = 0;

  for (let round = 0; round < maxRefinementRounds; round++) {
    onSSEEvent?.({
      type: 'roadmap_reviewing',
      data: { message: `Reviewing roadmap quality (round ${round + 1})...`, round: round + 1 },
    });

    const roadmapJson = JSON.stringify(roadmap.chapters, null, 2);
    const reviewPrompt = buildSelfReviewPrompt(roadmapJson, courseContext);

    const reviewResponse = await traceAICall(
      { runId, stage: 0, label: `Roadmap review round ${round + 1}` },
      () => runSAMChatWithPreference({
        userId,
        capability: 'course',
        messages: [{ role: 'user', content: reviewPrompt }],
        systemPrompt: 'You are a course quality reviewer. Evaluate the roadmap strictly.',
        maxTokens: 1500,
        temperature: 0.3,
        extended: true,
      }),
    );

    const review = parseReviewResponse(reviewResponse);
    selfReviewScore = review.overallScore;

    logger.info('[ROADMAP_GENERATOR] Self-review result', {
      round: round + 1,
      score: review.overallScore,
      verdict: review.verdict,
      issueCount: review.issues?.length ?? 0,
    });

    if (review.verdict === 'accept' || review.overallScore >= SELF_REVIEW_ACCEPT_THRESHOLD) {
      break;
    }

    // Refinement needed
    if (review.issues && review.issues.length > 0) {
      onSSEEvent?.({
        type: 'roadmap_refining',
        data: {
          message: `Refining roadmap (${review.issues.length} issues found)...`,
          issues: review.issues.length,
          round: round + 1,
        },
      });

      const refinementPrompt = buildRefinementPrompt(roadmapJson, review.issues);
      const refinedResponse = await traceAICall(
        { runId, stage: 0, label: `Roadmap refinement round ${round + 1}` },
        () => runSAMChatWithPreference({
          userId,
          capability: 'course',
          messages: [{ role: 'user', content: refinementPrompt }],
          systemPrompt,
          maxTokens: 4000,
          temperature: 0.5,
          extended: true,
        }),
      );

      const refinedRoadmap = parseRoadmapResponse(refinedResponse, courseContext);
      if (refinedRoadmap) {
        roadmap = refinedRoadmap;
      } else {
        logger.warn('[ROADMAP_GENERATOR] Refinement parse failed, keeping previous roadmap');
      }
      refinementRounds++;
    }
  }

  // If we never did a review (0 rounds completed), set a default score
  if (selfReviewScore === 0) {
    selfReviewScore = 80; // Assume reasonable quality without review
  }

  // Step 3: Independent critic review (multi-agent — separate AI persona)
  const criticReview = await reviewRoadmapWithCritic({
    userId,
    roadmap,
    courseContext,
    selfReviewScore,
    runId,
  });

  if (criticReview?.verdict === 'revise' && criticReview.actionableImprovements.length > 0) {
    onSSEEvent?.({
      type: 'roadmap_critic_refining',
      data: {
        message: `Independent reviewer found ${criticReview.actionableImprovements.length} improvement(s) — refining roadmap...`,
        improvements: criticReview.actionableImprovements.length,
      },
    });

    const criticIssues = criticReview.actionableImprovements.map(imp => ({
      type: 'critic_feedback' as const,
      description: imp,
    }));

    const roadmapJson = JSON.stringify(roadmap.chapters, null, 2);
    const criticRefinementPrompt = buildRefinementPrompt(roadmapJson, criticIssues);
    const criticRefinedResponse = await traceAICall(
      { runId, stage: 0, label: 'Roadmap critic-driven refinement' },
      () => runSAMChatWithPreference({
        userId,
        capability: 'course',
        messages: [{ role: 'user', content: criticRefinementPrompt }],
        systemPrompt: buildRoadmapSystemPrompt(courseContext.difficulty, variant),
        maxTokens: 4000,
        temperature: 0.5,
        extended: true,
      }),
    );

    const criticRefinedRoadmap = parseRoadmapResponse(criticRefinedResponse, courseContext);
    if (criticRefinedRoadmap) {
      roadmap = criticRefinedRoadmap;
      refinementRounds++;
      logger.info('[ROADMAP_GENERATOR] Critic-driven refinement applied', {
        improvementsAddressed: criticReview.actionableImprovements.length,
      });
    } else {
      logger.warn('[ROADMAP_GENERATOR] Critic refinement parse failed, keeping self-reviewed roadmap');
    }
  }

  const finalRoadmap: CourseRoadmap = {
    ...roadmap,
    selfReviewScore,
    refinementRounds,
  };

  logger.info('[ROADMAP_GENERATOR] Roadmap generation complete', {
    chapters: finalRoadmap.chapters.length,
    totalSections: finalRoadmap.chapters.reduce((s, ch) => s + ch.sections.length, 0),
    selfReviewScore,
    refinementRounds,
    criticVerdict: criticReview?.verdict ?? 'skipped',
  });

  return finalRoadmap;
}

// ============================================================================
// Response Parsers
// ============================================================================

function parseRoadmapResponse(
  rawResponse: string,
  courseContext: CourseContext,
): CourseRoadmap | null {
  try {
    // Extract JSON from potential markdown wrapping
    const jsonStr = extractJson(rawResponse);
    const parsed = JSON.parse(jsonStr);

    // Validate with Zod
    const validated = CourseRoadmapSchema.parse(parsed);

    // Enforce correct positions and fill optional fields
    const chapters: RoadmapChapter[] = validated.chapters.map((ch, idx) => ({
      position: idx + 1,
      title: ch.title,
      focusSummary: ch.focusSummary ?? `Focus area for chapter ${idx + 1}`,
      bloomsLevel: ch.bloomsLevel,
      keyConcepts: ch.keyConcepts ?? [],
      sections: ch.sections.map((sec, sIdx) => ({
        position: sIdx + 1,
        title: sec.title,
        arrowRole: sec.arrowRole,
        contentType: sec.contentType as CourseContext['preferredContentTypes'][number] | undefined,
      })),
    }));

    // Validate: reject if generic/placeholder titles were generated
    if (hasGenericTitles(chapters)) {
      logger.warn('[ROADMAP_GENERATOR] Parsed roadmap has generic titles, rejecting', {
        sampleTitles: chapters.flatMap(ch => ch.sections.map(s => s.title)).slice(0, 5),
      });
      return null;
    }

    return {
      chapters,
      selfReviewScore: 0,
      refinementRounds: 0,
      structuralReasoning: validated.structuralReasoning ?? '',
    };
  } catch (error) {
    logger.warn('[ROADMAP_GENERATOR] Failed to parse roadmap response', {
      error: error instanceof Error ? error.message : String(error),
      rawResponseLength: rawResponse.length,
      rawResponsePreview: rawResponse.slice(0, 500),
    });
    return null;
  }
}

function parseReviewResponse(rawResponse: string): {
  overallScore: number;
  issues?: Array<{ type: string; description: string }>;
  verdict: 'accept' | 'refine';
} {
  try {
    const jsonStr = extractJson(rawResponse);
    const parsed = JSON.parse(jsonStr);
    const validated = RoadmapReviewSchema.parse(parsed);
    return {
      overallScore: validated.overallScore,
      issues: validated.issues?.map(i => ({ type: i.type, description: i.description })),
      verdict: validated.verdict,
    };
  } catch {
    logger.warn('[ROADMAP_GENERATOR] Failed to parse review response, accepting roadmap');
    return { overallScore: 75, verdict: 'accept' };
  }
}

function extractJson(text: string): string {
  // Strategy 1: JSON in markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    const candidate = codeBlockMatch[1].trim();
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // Code block content isn't valid JSON, try repair
      const repaired = repairJson(candidate);
      try {
        JSON.parse(repaired);
        return repaired;
      } catch {
        // Fall through to other strategies
      }
    }
  }

  // Strategy 2: Find the outermost JSON object (balanced braces, string-aware)
  const firstBrace = text.indexOf('{');
  if (firstBrace !== -1) {
    let depth = 0;
    let lastBrace = -1;
    let inString = false;
    for (let i = firstBrace; i < text.length; i++) {
      const ch = text[i];
      // Toggle string state on unescaped quotes
      if (ch === '"' && (i === 0 || text[i - 1] !== '\\')) {
        inString = !inString;
        continue;
      }
      // Skip braces inside string literals
      if (inString) continue;
      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) {
          lastBrace = i;
          break;
        }
      }
    }
    if (lastBrace !== -1) {
      const candidate = text.slice(firstBrace, lastBrace + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        const repaired = repairJson(candidate);
        try {
          JSON.parse(repaired);
          return repaired;
        } catch {
          // Fall through
        }
      }
    }
  }

  // Strategy 3: Simple regex fallback
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return text;
}

/** Attempt common JSON repairs: trailing commas, unquoted keys */
function repairJson(text: string): string {
  let repaired = text;
  // Remove trailing commas before } or ]
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');
  // Remove JavaScript-style comments
  repaired = repaired.replace(/\/\/[^\n]*/g, '');
  return repaired;
}

/** Check if a roadmap has generic/placeholder titles that indicate a parsing or generation failure */
function hasGenericTitles(chapters: RoadmapChapter[]): boolean {
  const genericPatterns = [
    /^Section \d+ of Chapter \d+$/i,
    /^Chapter \d+:.*Part \d+$/i,
    /^Chapter \d+$/i,
    /^Section \d+$/i,
  ];

  for (const ch of chapters) {
    for (const sec of ch.sections) {
      if (genericPatterns.some(pattern => pattern.test(sec.title))) {
        return true;
      }
    }
    if (genericPatterns.some(pattern => pattern.test(ch.title))) {
      return true;
    }
  }
  return false;
}

// ============================================================================
// Roadmap Critic — Multi-Agent Review
// ============================================================================

/** Timeout for roadmap critic AI call (ms) */
const ROADMAP_CRITIC_TIMEOUT_MS = 15_000;

/** Borderline quality range — only fire critic when self-review score is borderline */
const ROADMAP_CRITIC_BORDERLINE_MIN = 70;
const ROADMAP_CRITIC_BORDERLINE_MAX = 88;

export type RoadmapCriticVerdict = 'approve' | 'revise';

export interface RoadmapCritique {
  verdict: RoadmapCriticVerdict;
  confidence: number;
  reasoning: string;
  conceptCoverage: number;
  bloomsProgression: number;
  arrowArcCompliance: number;
  titleSpecificity: number;
  sectionUniqueness: number;
  actionableImprovements: string[];
}

const ROADMAP_CRITIC_PERSONA = `You are a COURSE ROADMAP REVIEWER — an independent expert evaluating a course roadmap.
You are NOT the roadmap creator. You provide honest, specific, constructive criticism.

## Evaluation Dimensions (0-100 each)

1. **Concept Coverage** (0-100):
   - Do the chapters collectively cover ALL course learning objectives?
   - Are there major knowledge gaps or orphaned objectives?
   - Score 80+ if all objectives are addressed by at least one chapter.

2. **Bloom's Progression** (0-100):
   - Do Bloom's levels advance non-decreasingly across chapters?
   - Is the progression appropriate for the course difficulty?
   - Score 80+ if progression is smooth and well-calibrated.

3. **ARROW Arc Compliance** (0-100):
   - Does each chapter's sections follow a valid ARROW arc?
   - Are there chapters missing a hook, practice, or reflection section?
   - Score 80+ if most chapters have well-structured ARROW arcs.

4. **Title Specificity** (0-100):
   - Are chapter and section titles specific, outcome-oriented, and concrete?
   - Or are they vague ("Introduction to X", "Advanced Topics")?
   - Score 80+ if titles clearly describe what students will learn or do.

5. **Section Uniqueness** (0-100):
   - Are section titles across the ENTIRE course unique (no duplicates)?
   - Are there near-identical sections in different chapters?
   - Score 80+ if all section titles are distinct and non-overlapping.

## Response Format

Return ONLY a JSON object (no markdown, no explanation outside JSON):
{
  "verdict": "approve" | "revise",
  "confidence": <0-100>,
  "reasoning": "<2-3 sentence summary>",
  "conceptCoverage": <0-100>,
  "bloomsProgression": <0-100>,
  "arrowArcCompliance": <0-100>,
  "titleSpecificity": <0-100>,
  "sectionUniqueness": <0-100>,
  "actionableImprovements": ["<specific improvement 1>", "<specific improvement 2>"]
}

## Verdict Guidelines

- **approve**: All dimensions >= 75, no critical structural issues
- **revise**: 1+ dimensions < 75, or specific improvements would meaningfully enhance quality

Be specific in actionableImprovements — tell the creator exactly what to fix (which chapter/section).`;

/**
 * Review a generated roadmap with an independent critic AI persona.
 *
 * Returns null if self-review score is outside borderline range (cost optimization).
 * Makes a single AI call with a 15-second timeout.
 * Falls back to rule-based approval on failure.
 */
export async function reviewRoadmapWithCritic(params: {
  userId: string;
  roadmap: CourseRoadmap;
  courseContext: CourseContext;
  selfReviewScore: number;
  runId?: string;
}): Promise<RoadmapCritique | null> {
  const { userId, roadmap, courseContext, selfReviewScore, runId } = params;

  // Only fire for borderline quality (cost optimization)
  if (selfReviewScore < ROADMAP_CRITIC_BORDERLINE_MIN || selfReviewScore > ROADMAP_CRITIC_BORDERLINE_MAX) {
    return null;
  }

  try {
    const critique = await withCriticTimeout(
      doReviewRoadmap(userId, roadmap, courseContext, runId),
      ROADMAP_CRITIC_TIMEOUT_MS,
    );

    logger.info('[RoadmapCritic] Review complete', {
      verdict: critique.verdict,
      confidence: critique.confidence,
      conceptCoverage: critique.conceptCoverage,
      bloomsProgression: critique.bloomsProgression,
      titleSpecificity: critique.titleSpecificity,
    });

    return critique;
  } catch (error) {
    logger.warn('[RoadmapCritic] AI review failed, using rule-based fallback', {
      error: error instanceof Error ? error.message : String(error),
    });

    return buildRuleBasedRoadmapCritique(roadmap, courseContext);
  }
}

async function doReviewRoadmap(
  userId: string,
  roadmap: CourseRoadmap,
  courseContext: CourseContext,
  runId?: string,
): Promise<RoadmapCritique> {
  const ctx = sanitizeCourseContext(courseContext);

  const roadmapSummary = roadmap.chapters.map(ch =>
    `Ch${ch.position}: "${ch.title}" [${ch.bloomsLevel}]\n` +
    `  Focus: ${ch.focusSummary}\n` +
    `  Concepts: ${ch.keyConcepts.join(', ')}\n` +
    `  Sections: ${ch.sections.map(s => `${s.position}."${s.title}" (${s.arrowRole ?? 'content'})`).join(' | ')}`
  ).join('\n\n');

  const userPrompt = `## Roadmap to Review

**Course**: "${ctx.courseTitle}"
**Category**: ${ctx.courseCategory}
**Difficulty**: ${ctx.difficulty}
**Target Audience**: ${ctx.targetAudience}
**Total Chapters**: ${ctx.totalChapters}

## Course Learning Objectives (All MUST be covered)
${ctx.courseLearningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

## ROADMAP
${roadmapSummary}

Review this roadmap and return your critique as JSON.`;

  const responseText = await traceAICall(
    { runId, stage: 0, label: 'Roadmap critic review' },
    () => runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt: ROADMAP_CRITIC_PERSONA,
      maxTokens: 1200,
      temperature: 0.3,
    }),
  );

  return parseRoadmapCriticResponse(responseText);
}

function parseRoadmapCriticResponse(responseText: string): RoadmapCritique {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in roadmap critic response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  const verdict = String(parsed.verdict).toLowerCase().trim() === 'revise' ? 'revise' as const : 'approve' as const;
  const confidence = clamp(Number(parsed.confidence) || 70, 0, 100);
  const conceptCoverage = clamp(Number(parsed.conceptCoverage) || 75, 0, 100);
  const bloomsProgression = clamp(Number(parsed.bloomsProgression) || 75, 0, 100);
  const arrowArcCompliance = clamp(Number(parsed.arrowArcCompliance) || 75, 0, 100);
  const titleSpecificity = clamp(Number(parsed.titleSpecificity) || 75, 0, 100);
  const sectionUniqueness = clamp(Number(parsed.sectionUniqueness) || 75, 0, 100);
  const reasoning = String(parsed.reasoning || 'Roadmap review complete');
  const actionableImprovements = Array.isArray(parsed.actionableImprovements)
    ? (parsed.actionableImprovements as unknown[]).map(String).slice(0, 5)
    : [];

  // Override: don't act on low-confidence revise verdicts
  const effectiveVerdict = verdict === 'revise' && confidence < 60
    ? 'approve'
    : verdict;

  return {
    verdict: effectiveVerdict,
    confidence,
    reasoning,
    conceptCoverage,
    bloomsProgression,
    arrowArcCompliance,
    titleSpecificity,
    sectionUniqueness,
    actionableImprovements,
  };
}

function buildRuleBasedRoadmapCritique(
  roadmap: CourseRoadmap,
  courseContext: CourseContext,
): RoadmapCritique {
  const improvements: string[] = [];
  let conceptCoverage = 80;
  let bloomsProgression = 80;
  let arrowArcCompliance = 80;
  let titleSpecificity = 80;
  let sectionUniqueness = 80;

  // Check Bloom's progression (non-decreasing)
  const bloomsOrder = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  let prevBloomsIdx = 0;
  for (const ch of roadmap.chapters) {
    const idx = bloomsOrder.indexOf(ch.bloomsLevel);
    if (idx < prevBloomsIdx) {
      improvements.push(`Bloom's regression: Ch${ch.position} (${ch.bloomsLevel}) is lower than previous chapter`);
      bloomsProgression -= 15;
      break;
    }
    prevBloomsIdx = Math.max(prevBloomsIdx, idx);
  }

  // Check for duplicate section titles across the entire course
  const allSectionTitles = roadmap.chapters.flatMap(ch => ch.sections.map(s => s.title.toLowerCase()));
  const titleSet = new Set<string>();
  const duplicates: string[] = [];
  for (const t of allSectionTitles) {
    if (titleSet.has(t)) duplicates.push(t);
    titleSet.add(t);
  }
  if (duplicates.length > 0) {
    improvements.push(`Duplicate section titles found: ${duplicates.slice(0, 3).join(', ')}`);
    sectionUniqueness -= 15;
  }

  // Check ARROW arc: each chapter should have a hook and at least one practice/reflection
  for (const ch of roadmap.chapters) {
    const roles = ch.sections.map(s => s.arrowRole).filter(Boolean);
    if (roles.length > 0 && !roles.includes('hook')) {
      improvements.push(`Ch${ch.position} is missing a "hook" section`);
      arrowArcCompliance -= 10;
    }
  }

  // Check title specificity
  const vaguePrefixes = /^(introduction|overview|basics|getting started|summary|review|miscellaneous)/i;
  let vagueCount = 0;
  for (const ch of roadmap.chapters) {
    for (const s of ch.sections) {
      if (vaguePrefixes.test(s.title)) vagueCount++;
    }
  }
  if (vagueCount > 2) {
    improvements.push(`${vagueCount} sections have vague/generic titles — make them outcome-oriented`);
    titleSpecificity -= 10;
  }

  const scores = [conceptCoverage, bloomsProgression, arrowArcCompliance, titleSpecificity, sectionUniqueness];
  const allAbove75 = scores.every(s => s >= 75);

  return {
    verdict: allAbove75 && improvements.length === 0 ? 'approve' : 'revise',
    confidence: 60,
    reasoning: improvements.length === 0
      ? 'Roadmap passes basic structural quality checks'
      : `Roadmap has ${improvements.length} area(s) for improvement`,
    conceptCoverage: clamp(conceptCoverage, 0, 100),
    bloomsProgression: clamp(bloomsProgression, 0, 100),
    arrowArcCompliance: clamp(arrowArcCompliance, 0, 100),
    titleSpecificity: clamp(titleSpecificity, 0, 100),
    sectionUniqueness: clamp(sectionUniqueness, 0, 100),
    actionableImprovements: improvements,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function withCriticTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Roadmap critic timed out after ${ms}ms`)), ms);
    promise
      .then(result => { clearTimeout(timer); resolve(result); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

// ============================================================================
// Fallback Roadmap
// ============================================================================

/**
 * Map a chapter position to an appropriate Bloom's level based on difficulty.
 */
function mapPositionToBloom(
  index: number,
  totalChapters: number,
  difficulty: string,
): (typeof BLOOMS_LEVELS_CONST)[number] {
  const BLOOMS = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as const;
  const progress = totalChapters > 1 ? index / (totalChapters - 1) : 0;

  // Difficulty determines the range of Bloom's levels used
  const difficultyKey = difficulty.toLowerCase();
  let minIdx: number;
  let maxIdx: number;
  if (difficultyKey === 'beginner') { minIdx = 0; maxIdx = 2; }       // REMEMBER → APPLY
  else if (difficultyKey === 'advanced') { minIdx = 2; maxIdx = 5; }   // APPLY → CREATE
  else if (difficultyKey === 'expert') { minIdx = 3; maxIdx = 5; }     // ANALYZE → CREATE
  else { minIdx = 1; maxIdx = 4; }                                     // UNDERSTAND → EVALUATE

  const bloomsIdx = Math.min(
    Math.round(minIdx + progress * (maxIdx - minIdx)),
    BLOOMS.length - 1,
  );
  return BLOOMS[bloomsIdx];
}

const BLOOMS_LEVELS_CONST = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as const;

/**
 * Derive meaningful chapter topics from course objectives and title.
 * Distributes objectives across chapters and fills gaps with derived topics.
 */
function deriveChapterTopics(
  courseTitle: string,
  objectives: string[],
  totalChapters: number,
): string[] {
  const topics: string[] = [];

  if (objectives.length >= totalChapters) {
    // More objectives than chapters: use objectives as chapter titles
    for (let i = 0; i < totalChapters; i++) {
      topics.push(cleanObjectiveToTitle(objectives[i]));
    }
  } else {
    // Fewer objectives than chapters: distribute and derive extras
    // First chapters get objectives directly
    for (let i = 0; i < objectives.length; i++) {
      topics.push(cleanObjectiveToTitle(objectives[i]));
    }

    // Fill remaining with progression patterns
    const remaining = totalChapters - objectives.length;
    const titleWords = courseTitle.split(/\s+/).filter(w => w.length > 3);
    const coreTopic = titleWords.slice(0, 3).join(' ') || courseTitle;

    const progressionPatterns = [
      `Foundations of ${coreTopic}`,
      `Core Principles of ${coreTopic}`,
      `Applying ${coreTopic} in Practice`,
      `Advanced Patterns in ${coreTopic}`,
      `Troubleshooting and Debugging ${coreTopic}`,
      `Real-World ${coreTopic} Case Studies`,
      `Mastering ${coreTopic}`,
      `${coreTopic} Best Practices and Design Patterns`,
    ];

    for (let i = 0; i < remaining; i++) {
      topics.push(progressionPatterns[i % progressionPatterns.length]);
    }
  }

  return topics;
}

/**
 * Clean a learning objective string into a chapter title.
 * Removes leading verbs like "Understand", "Apply", etc. and capitalizes.
 */
function cleanObjectiveToTitle(objective: string): string {
  // Remove common leading Bloom's verbs
  const verbPattern = /^(understand|explain|apply|analyze|evaluate|create|design|develop|implement|demonstrate|identify|describe|build|master|learn)\s+/i;
  let cleaned = objective.replace(verbPattern, '').trim();

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Truncate if too long for a title
  if (cleaned.length > 80) {
    const cutoff = cleaned.lastIndexOf(' ', 77);
    cleaned = cleaned.slice(0, cutoff > 40 ? cutoff : 77).trim();
  }

  return cleaned;
}

/**
 * Generate ARROW-inspired section titles for a chapter topic.
 * Each section gets a specific pedagogical role instead of "Section N of Chapter N".
 */
function generateFallbackSectionTitles(
  chapterTopic: string,
  sectionCount: number,
): Array<{ position: number; title: string; arrowRole: (typeof ARROW_ROLES)[number]; contentType: undefined }> {
  // Short version of the topic for use in titles (first 4 meaningful words)
  const shortTopic = chapterTopic.split(/\s+/).filter(w => w.length > 2).slice(0, 4).join(' ') || chapterTopic;

  // ARROW-inspired section title templates
  const templates: Array<{ title: (topic: string) => string; role: (typeof ARROW_ROLES)[number] }> = [
    { title: (t) => `Why ${t} Matters`, role: 'hook' },
    { title: (t) => `How ${t} Works Under the Hood`, role: 'reverse-engineer' },
    { title: (t) => `${t} Through Concrete Examples`, role: 'intuition' },
    { title: (t) => `The Formal Framework of ${t}`, role: 'formalization' },
    { title: (t) => `Common Pitfalls When Working With ${t}`, role: 'failure-analysis' },
    { title: (t) => `Hands-On Practice With ${t}`, role: 'practice' },
    { title: (t) => `Designing Solutions Using ${t}`, role: 'design-challenge' },
    { title: (t) => `Reflecting on ${t} and Next Steps`, role: 'reflection' },
    { title: (t) => `Building Intuition for ${t}`, role: 'intuition' },
    { title: (t) => `${t} in Real-World Scenarios`, role: 'practice' },
  ];

  const sections: Array<{ position: number; title: string; arrowRole: (typeof ARROW_ROLES)[number]; contentType: undefined }> = [];

  for (let j = 0; j < sectionCount; j++) {
    const template = templates[j % templates.length];
    sections.push({
      position: j + 1,
      title: template.title(shortTopic),
      arrowRole: template.role,
      contentType: undefined,
    });
  }

  return sections;
}

const ARROW_ROLES = ['hook', 'reverse-engineer', 'intuition', 'formalization', 'failure-analysis', 'design-challenge', 'practice', 'reflection'] as const;

function buildFallbackRoadmap(courseContext: CourseContext): CourseRoadmap {
  const chapterTopics = deriveChapterTopics(
    courseContext.courseTitle,
    courseContext.courseLearningObjectives,
    courseContext.totalChapters,
  );

  const chapters: RoadmapChapter[] = chapterTopics.map((topic, i) => ({
    position: i + 1,
    title: topic,
    focusSummary: `Core concepts of ${topic.toLowerCase()}`,
    bloomsLevel: mapPositionToBloom(i, courseContext.totalChapters, courseContext.difficulty),
    keyConcepts: [],
    sections: generateFallbackSectionTitles(topic, courseContext.sectionsPerChapter),
  }));

  return {
    chapters,
    selfReviewScore: 40,
    refinementRounds: 0,
    structuralReasoning: 'Fallback roadmap generated from course objectives due to AI parsing failure',
  };
}
