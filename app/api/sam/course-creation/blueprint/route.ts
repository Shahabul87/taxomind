/**
 * Course Blueprint Generation API
 *
 * Generates a teacher-reviewable blueprint (chapter titles, section titles,
 * key topics) for Step 4 of the AI course creator wizard.
 *
 * The teacher edits key topics, then the approved blueprint replaces heavy
 * ARROW prompts during generation — yielding ~60% fewer prompt tokens per call.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { runSAMChatWithPreference, withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getCategoryEnhancers, blendEnhancers, composeCategoryPrompt } from '@/lib/sam/course-creation/category-prompts';
import { sanitizeCourseContext } from '@/lib/sam/course-creation/helpers';
import type { CourseContext } from '@/lib/sam/course-creation/types';

export const runtime = 'nodejs';
export const maxDuration = 120; // Vercel/serverless max; local timeout handles scaling

// =============================================================================
// VALIDATION
// =============================================================================

const BlueprintRequestSchema = z.object({
  courseTitle: z.string().min(3).max(200),
  courseShortOverview: z.string().min(10).max(2000),
  category: z.string().max(100),
  subcategory: z.string().max(100).optional(),
  targetAudience: z.string().min(3).max(200),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  duration: z.string().max(50).optional(),
  courseGoals: z.array(z.string().max(500)).min(1).max(20),
  bloomsFocus: z.array(z.string()).min(1),
  chapterCount: z.number().int().min(1).max(20),
  sectionsPerChapter: z.number().int().min(1).max(10),
});

// =============================================================================
// BLOOM'S DISTRIBUTION
// =============================================================================

const BLOOMS_ORDER = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as const;

/**
 * Pre-compute a Bloom's level for each chapter, ensuring progressive escalation.
 *
 * Algorithm:
 * 1. Sort the teacher-selected Bloom's levels by taxonomy order.
 * 2. Divide chapters into equal-ish bands — one band per level.
 * 3. Assign earlier chapters to lower bands, later chapters to higher bands.
 *
 * Example: 5 chapters with [APPLY, ANALYZE] → [APPLY, APPLY, ANALYZE, ANALYZE, ANALYZE]
 * Example: 6 chapters with [UNDERSTAND, APPLY, EVALUATE] → [UNDERSTAND, UNDERSTAND, APPLY, APPLY, EVALUATE, EVALUATE]
 */
function computeBloomsDistribution(
  bloomsFocus: string[],
  chapterCount: number,
): string[] {
  // Sort selected levels by taxonomy order
  const sorted = [...bloomsFocus].sort(
    (a, b) => BLOOMS_ORDER.indexOf(a as typeof BLOOMS_ORDER[number]) - BLOOMS_ORDER.indexOf(b as typeof BLOOMS_ORDER[number]),
  );

  // Deduplicate while preserving order
  const uniqueLevels = Array.from(new Set(sorted));

  if (uniqueLevels.length === 0) {
    return Array(chapterCount).fill('UNDERSTAND');
  }

  if (uniqueLevels.length === 1) {
    return Array(chapterCount).fill(uniqueLevels[0]);
  }

  // Distribute chapters across levels proportionally
  // Earlier chapters get lower levels, later chapters get higher levels
  const distribution: string[] = [];
  const bandSize = chapterCount / uniqueLevels.length;

  for (let i = 0; i < chapterCount; i++) {
    const bandIndex = Math.min(
      Math.floor(i / bandSize),
      uniqueLevels.length - 1,
    );
    distribution.push(uniqueLevels[bandIndex]);
  }

  return distribution;
}

/**
 * Format per-chapter Bloom's assignments as an explicit instruction block.
 */
function formatBloomsAssignments(distribution: string[]): string {
  return distribution
    .map((level, i) => `- Chapter ${i + 1}: **${level}**`)
    .join('\n');
}

// =============================================================================
// TYPES
// =============================================================================

interface BlueprintSection {
  position: number;
  title: string;
  keyTopics: string[];
}

interface BlueprintChapter {
  position: number;
  title: string;
  goal: string;
  bloomsLevel: string;
  sections: BlueprintSection[];
}

interface BlueprintResponse {
  chapters: BlueprintChapter[];
  confidence: number;
  riskAreas: string[];
}

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const rateLimitResponse = await withRateLimit(request, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    // Auth
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Subscription gate
    const gateResult = await withSubscriptionGate(user.id, { category: 'generation' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    // Validate body
    const body = await request.json();
    const parseResult = BlueprintRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parseResult.data;

    // Resolve domain expertise
    const matchedEnhancers = getCategoryEnhancers(data.category, data.subcategory);
    const enhancer = matchedEnhancers.length >= 2
      ? blendEnhancers(matchedEnhancers[0], matchedEnhancers[1])
      : matchedEnhancers[0];

    // Sanitize for prompt injection
    const ctx = sanitizeCourseContext({
      courseTitle: data.courseTitle,
      courseDescription: data.courseShortOverview,
      courseCategory: data.category,
      courseSubcategory: data.subcategory,
      targetAudience: data.targetAudience,
      difficulty: data.difficulty.toLowerCase() as CourseContext['difficulty'],
      courseLearningObjectives: data.courseGoals,
      totalChapters: data.chapterCount,
      sectionsPerChapter: data.sectionsPerChapter,
      bloomsFocus: data.bloomsFocus as CourseContext['bloomsFocus'],
      learningObjectivesPerChapter: 5,
      learningObjectivesPerSection: 3,
    });

    // Compose the full domain prompt (expertise + methodology + Bloom's + activities)
    const composed = enhancer ? composeCategoryPrompt(enhancer) : null;

    // Build rich system prompt with ARROW framework identity and domain expertise
    const systemPrompt = `You are SAM, an expert-level course architect. You design pedagogically-sound course blueprints using the ARROW framework (Application-first, Reverse-engineer, Reason, Originate, Wire).

## YOUR BLUEPRINT DESIGN PRINCIPLES
- NEVER start chapters with "Introduction to X" or "Overview of X" — open with real-world hooks
- Follow Bloom's Taxonomy progression: early chapters at lower levels (REMEMBER/UNDERSTAND), later chapters at higher levels (ANALYZE/EVALUATE/CREATE)
- Ensure logical concept flow: each chapter builds on the previous, with prerequisites taught before dependents
- Section titles must be specific and descriptive — never "Section 1.1" or "Getting Started"
- Every key topic must be a concrete concept, technique, or skill — never vague terms like "basics" or "fundamentals"
- Flag areas where students typically struggle as risk areas needing careful scaffolding

## BLOOM'S TAXONOMY REFERENCE
- REMEMBER: Recall facts, define terms, list components
- UNDERSTAND: Explain concepts, interpret meaning, classify patterns
- APPLY: Use procedures, implement solutions, demonstrate techniques
- ANALYZE: Break down systems, compare approaches, identify relationships
- EVALUATE: Judge quality, assess trade-offs, defend design decisions
- CREATE: Design systems, develop solutions, produce original work

The teacher will review and edit this blueprint before content generation begins.
${composed?.expertiseBlock ?? ''}`;

    // Build domain-specific pedagogy and section guidance blocks
    const bloomsGuidanceBlock = composed?.chapterGuidanceBlock
      ? `\n## Domain-Specific Pedagogy\n${composed.chapterGuidanceBlock}`
      : '';

    const sectionGuidanceBlock = composed?.sectionGuidanceBlock
      ? `\n## Section-Level Domain Guidance\n${composed.sectionGuidanceBlock}`
      : '';

    // Pre-compute Bloom's distribution: explicit per-chapter level assignments
    const bloomsDistribution = computeBloomsDistribution(data.bloomsFocus, data.chapterCount);
    const bloomsAssignmentBlock = formatBloomsAssignments(bloomsDistribution);

    const userPrompt = `Design a detailed blueprint for this course.

## REQUIRED OUTPUT FORMAT (Return ONLY valid JSON — no markdown fences)

CRITICAL: Every chapter MUST contain EXACTLY ${ctx.sectionsPerChapter} sections. Every section MUST have a descriptive title AND 3-5 keyTopics. Do NOT omit sections or leave keyTopics empty.

{
  "chapters": [
    {
      "position": 1,
      "title": "Why Neural Networks Fail — Building Intuition Before Math",
      "goal": "Students build mental models for how neural networks learn by diagnosing real failure cases",
      "bloomsLevel": "UNDERSTAND",
      "sections": [
        {
          "position": 1,
          "title": "The Overfit Restaurant — When Your Model Memorizes the Menu",
          "keyTopics": ["training vs generalization", "overfitting visual patterns", "validation set purpose"]
        },
        {
          "position": 2,
          "title": "Gradient Descent as Hill Walking — Finding the Valley in the Dark",
          "keyTopics": ["loss landscape visualization", "learning rate effects", "local minima intuition"]
        }
      ]
    }
  ],
  "confidence": 85,
  "riskAreas": ["Students may confuse overfitting with underfitting without explicit side-by-side comparison"]
}

## COURSE DETAILS

Title: ${ctx.courseTitle}
Overview: ${ctx.courseDescription}
Category: ${ctx.courseCategory}${ctx.courseSubcategory ? ` > ${ctx.courseSubcategory}` : ''}
Target Audience: ${ctx.targetAudience}
Difficulty: ${ctx.difficulty}
${data.duration ? `Duration: ${data.duration}` : ''}
Chapters: ${ctx.totalChapters}
Sections per Chapter: ${ctx.sectionsPerChapter}

Learning Objectives:
${ctx.courseLearningObjectives.map((g, i) => `${i + 1}. ${g}`).join('\n')}

## BLOOM'S LEVEL ASSIGNMENTS (MANDATORY — use EXACTLY these levels)

Each chapter MUST use the assigned Bloom's level below. This ensures proper cognitive progression from foundational to higher-order thinking:

${bloomsAssignmentBlock}

Bloom's Focus Levels: ${data.bloomsFocus.join(', ')}
${bloomsGuidanceBlock}
${sectionGuidanceBlock}

## SECTION REQUIREMENTS (MOST IMPORTANT)

Each section MUST have:
1. A creative, descriptive title using metaphor, analogy, or a concrete hook — NOT a dry label
2. EXACTLY 3-5 keyTopics — each a specific concept, technique, or skill students will learn
3. keyTopics must be concrete (e.g., "gradient descent convergence criteria") NOT generic (e.g., "basics")

BAD section titles (NEVER generate these):
- "Hyperparameter Tuning as a Grid Search" — too literal, reads like a textbook heading
- "Introduction to Neural Networks" — forbidden "Introduction to X" pattern
- "Advanced Topics in ML" — vague, no specific hook
- "Working with Data" — generic, says nothing specific

GOOD section titles (follow these patterns):
- "The Overfit Restaurant — When Your Model Memorizes the Menu" — metaphor + specific concept
- "Gradient Descent as Hill Walking — Finding the Valley in the Dark" — analogy + visual hook
- "The Bias-Variance Tightrope — Why Perfect Training Scores Lie" — tension + insight
- "Feature Engineering Detective Work — Finding Signals in Noisy Data" — action + specificity

## CHAPTER REQUIREMENTS

Each chapter MUST have:
1. A descriptive title that hooks the reader (use the same creative patterns as section titles)
2. A one-sentence goal describing what students achieve
3. The EXACT Bloom's level assigned above (see BLOOM'S LEVEL ASSIGNMENTS)
4. EXACTLY ${ctx.sectionsPerChapter} sections (see section requirements above)

Ensure logical concept flow: earlier chapters introduce foundations, later chapters build complexity.
Flag any areas where students typically struggle as risks.

Generate the COMPLETE JSON now with ALL ${ctx.totalChapters} chapters, each containing ${ctx.sectionsPerChapter} sections with full keyTopics.`;

    // AI call with timeout — generous buffer for AI response time
    const totalSections = data.chapterCount * data.sectionsPerChapter;
    const BLUEPRINT_TIMEOUT_MS = Math.min(120_000, 50_000 + totalSections * 2500);

    // Adaptive maxTokens capped at 8192 for cross-provider compatibility
    // Base: JSON overhead + riskAreas + confidence
    // Per chapter: ~200 tokens (title + goal + bloomsLevel + rationale)
    // Per section: ~100 tokens (title + 3-5 keyTopics)
    const blueprintMaxTokens = Math.min(8192, 1500 + data.chapterCount * 200 + totalSections * 100);

    const aiPromise = runSAMChatWithPreference({
      userId: user.id,
      capability: 'course',
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
      maxTokens: blueprintMaxTokens,
      temperature: 0.6,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Blueprint generation timed out')), BLUEPRINT_TIMEOUT_MS);
    });

    let responseText: string;
    const aiStartTime = Date.now();
    try {
      responseText = await Promise.race([aiPromise, timeoutPromise]);
      logger.info('[BLUEPRINT_ROUTE] AI call succeeded', {
        elapsed: `${Date.now() - aiStartTime}ms`,
        responseLength: responseText.length,
        timeout: BLUEPRINT_TIMEOUT_MS,
      });
    } catch (aiError) {
      // Timeout or AI error — use heuristic fallback
      const elapsed = Date.now() - aiStartTime;
      const errMsg = aiError instanceof Error ? aiError.message : 'Unknown AI error';
      logger.warn('[BLUEPRINT_ROUTE] AI call failed, using heuristic fallback', {
        error: errMsg,
        elapsed: `${elapsed}ms`,
        timeout: BLUEPRINT_TIMEOUT_MS,
        totalSections,
        maxTokens: blueprintMaxTokens,
      });
      const fallback = buildHeuristicBlueprint(data);
      return NextResponse.json({ success: true, blueprint: fallback });
    }

    // Parse response — enforce pre-computed Bloom's distribution
    let blueprint = parseBlueprintResponse(responseText, data, bloomsDistribution);
    if (!blueprint) {
      logger.warn('[BLUEPRINT_ROUTE] Failed to parse AI response, using heuristic', {
        responseLength: responseText.length,
        responsePreview: responseText.slice(0, 500),
      });
      const fallback = buildHeuristicBlueprint(data);
      return NextResponse.json({ success: true, blueprint: fallback });
    }

    // Post-parse validation: fill incomplete sections with domain-aware heuristics
    // instead of retrying the entire AI call (eliminates double-wait)
    const incompleteSections = blueprint.chapters.filter(ch =>
      ch.sections.some(sec => sec.keyTopics.length === 0 || sec.title.startsWith('Section '))
    );

    if (incompleteSections.length > 0) {
      logger.warn('[BLUEPRINT_ROUTE] Incomplete sections detected, filling with heuristics', {
        incompleteChapters: incompleteSections.length,
        maxTokensUsed: blueprintMaxTokens,
        responseLength: responseText.length,
      });

      // Fill missing sections using domain-aware heuristics
      blueprint = fillIncompleteSections(blueprint, data, enhancer?.chapterSequencingAdvice);
    }

    logger.info('[BLUEPRINT_ROUTE] Blueprint generated', {
      chapters: blueprint.chapters.length,
      confidence: blueprint.confidence,
      maxTokens: blueprintMaxTokens,
      responseLength: responseText.length,
    });

    return NextResponse.json({ success: true, blueprint });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[BLUEPRINT_ROUTE] Error:', { error: msg });
    return NextResponse.json(
      { success: false, error: 'Failed to generate blueprint' },
      { status: 500 },
    );
  }
}

// =============================================================================
// RESPONSE PARSER
// =============================================================================

function parseBlueprintResponse(
  text: string,
  data: z.infer<typeof BlueprintRequestSchema>,
  bloomsDistribution?: string[],
): BlueprintResponse | null {
  try {
    // Strip <think>...</think> blocks (reasoning models)
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');

    cleaned = cleaned
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim();

    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    if (!Array.isArray(parsed.chapters)) return null;

    const validBloomsLevels = new Set(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']);

    const chapters: BlueprintChapter[] = [];
    for (let i = 0; i < data.chapterCount; i++) {
      const raw = (parsed.chapters as Array<Record<string, unknown>>)[i];
      if (!raw) {
        chapters.push(buildFallbackChapter(i + 1, data));
        continue;
      }

      // Enforce the pre-computed Bloom's distribution if available
      // This ensures progressive escalation even if the AI model ignored the instruction
      const assignedLevel = bloomsDistribution?.[i];
      const aiLevel = typeof raw.bloomsLevel === 'string' && validBloomsLevels.has(raw.bloomsLevel)
        ? raw.bloomsLevel
        : null;
      const bloomsLevel = assignedLevel ?? aiLevel ?? 'UNDERSTAND';

      const sections: BlueprintSection[] = [];
      const rawSections = Array.isArray(raw.sections) ? raw.sections as Array<Record<string, unknown>> : [];

      for (let j = 0; j < data.sectionsPerChapter; j++) {
        const rawSec = rawSections[j];
        if (!rawSec) {
          sections.push({ position: j + 1, title: `Section ${i + 1}.${j + 1}`, keyTopics: [] });
          continue;
        }
        sections.push({
          position: j + 1,
          title: typeof rawSec.title === 'string' ? rawSec.title : `Section ${i + 1}.${j + 1}`,
          keyTopics: Array.isArray(rawSec.keyTopics)
            ? (rawSec.keyTopics as string[]).filter(t => typeof t === 'string').slice(0, 7)
            : [],
        });
      }

      chapters.push({
        position: i + 1,
        title: typeof raw.title === 'string' ? raw.title : `Chapter ${i + 1}`,
        goal: typeof raw.goal === 'string' ? raw.goal : '',
        bloomsLevel,
        sections,
      });
    }

    const confidence = typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(100, Math.round(parsed.confidence)))
      : 70;

    const riskAreas = Array.isArray(parsed.riskAreas)
      ? (parsed.riskAreas as string[]).filter(r => typeof r === 'string').slice(0, 10)
      : [];

    return { chapters, confidence, riskAreas };
  } catch {
    return null;
  }
}

// =============================================================================
// PROGRESSIVE ENHANCEMENT (Replaces synchronous retry)
// =============================================================================

/**
 * Fill incomplete sections with domain-aware heuristic content instead of
 * retrying the entire AI call. Uses the chapter's goal and key topics
 * from other sections to generate plausible section titles and key topics.
 */
function fillIncompleteSections(
  blueprint: BlueprintResponse,
  data: z.infer<typeof BlueprintRequestSchema>,
  _chapterSequencingAdvice?: string,
): BlueprintResponse {
  const filledChapters = blueprint.chapters.map(ch => {
    const filledSections = ch.sections.map(sec => {
      const needsTitle = sec.title.startsWith('Section ');
      const needsTopics = sec.keyTopics.length === 0;

      if (!needsTitle && !needsTopics) return sec;

      // Derive context from the chapter's other sections and goal
      const existingTopics = ch.sections
        .filter(s => s.keyTopics.length > 0)
        .flatMap(s => s.keyTopics);

      const chapterGoalWords = ch.goal.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const courseGoalWords = data.courseGoals
        .join(' ')
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 4);

      // Generate section title from chapter context
      const sectionTitle = needsTitle
        ? generateHeuristicSectionTitle(ch.title, sec.position, data.sectionsPerChapter, existingTopics)
        : sec.title;

      // Generate key topics from chapter context
      const keyTopics = needsTopics
        ? generateHeuristicKeyTopics(ch.title, sectionTitle, chapterGoalWords, courseGoalWords, sec.position)
        : sec.keyTopics;

      return { ...sec, title: sectionTitle, keyTopics };
    });

    return { ...ch, sections: filledSections };
  });

  // Reduce confidence since some sections were heuristically filled
  const filledConfidence = Math.max(30, blueprint.confidence - 15);
  const riskAreas = [
    ...blueprint.riskAreas,
    'Some sections were filled with heuristic key topics — please review and adjust.',
  ];

  return { chapters: filledChapters, confidence: filledConfidence, riskAreas };
}

function generateHeuristicSectionTitle(
  chapterTitle: string,
  sectionPosition: number,
  totalSections: number,
  existingTopics: string[],
): string {
  // Use section position to determine role in the chapter arc
  const ratio = (sectionPosition - 1) / (totalSections - 1 || 1);
  const chapterKeyword = chapterTitle.split(/[:\-—]/)[0].trim();

  if (ratio < 0.2) {
    return `Core Concepts Behind ${chapterKeyword}`;
  } else if (ratio < 0.5) {
    const topic = existingTopics[0] ?? chapterKeyword;
    return `How ${topic} Works in Practice`;
  } else if (ratio < 0.8) {
    return `Building with ${chapterKeyword}: Hands-On Techniques`;
  } else {
    return `${chapterKeyword}: Patterns, Trade-offs, and Best Practices`;
  }
}

function generateHeuristicKeyTopics(
  chapterTitle: string,
  sectionTitle: string,
  chapterGoalWords: string[],
  courseGoalWords: string[],
  sectionPosition: number,
): string[] {
  // Generate 3 plausible key topics from available context
  const chapterKeyword = chapterTitle.split(/[:\-—]/)[0].trim();
  const sectionKeyword = sectionTitle.split(/[:\-—]/)[0].trim();

  const topics: string[] = [];

  // Topic 1: From section title context
  topics.push(`${sectionKeyword} fundamentals and core patterns`);

  // Topic 2: From chapter goal words
  const goalWord = chapterGoalWords[sectionPosition % chapterGoalWords.length] ?? chapterKeyword.toLowerCase();
  topics.push(`Practical applications of ${goalWord}`);

  // Topic 3: From course goals
  const courseWord = courseGoalWords[sectionPosition % courseGoalWords.length] ?? 'problem-solving techniques';
  topics.push(`${courseWord} in the context of ${chapterKeyword}`);

  return topics;
}

// =============================================================================
// HEURISTIC FALLBACK
// =============================================================================

function buildFallbackChapter(
  position: number,
  data: z.infer<typeof BlueprintRequestSchema>,
  assignedBloomsLevel?: string,
): BlueprintChapter {
  const goalIndex = Math.min(position - 1, data.courseGoals.length - 1);
  const goal = data.courseGoals[goalIndex] ?? '';

  const sections: BlueprintSection[] = [];
  for (let j = 0; j < data.sectionsPerChapter; j++) {
    sections.push({
      position: j + 1,
      title: `Section ${position}.${j + 1}`,
      keyTopics: [],
    });
  }

  return {
    position,
    title: `Chapter ${position}`,
    goal,
    bloomsLevel: assignedBloomsLevel ?? data.bloomsFocus[Math.min(position - 1, data.bloomsFocus.length - 1)] ?? 'UNDERSTAND',
    sections,
  };
}

function buildHeuristicBlueprint(data: z.infer<typeof BlueprintRequestSchema>): BlueprintResponse {
  const distribution = computeBloomsDistribution(data.bloomsFocus, data.chapterCount);
  const chapters: BlueprintChapter[] = [];
  for (let i = 0; i < data.chapterCount; i++) {
    chapters.push(buildFallbackChapter(i + 1, data, distribution[i]));
  }

  return {
    chapters,
    confidence: 30,
    riskAreas: ['Blueprint was generated using heuristics — AI generation was unavailable. Please review and add key topics manually.'],
  };
}
