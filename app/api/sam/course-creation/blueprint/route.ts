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
import { runSAMChatWithMetadata, resolveAIModelInfo, withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getCategoryEnhancers, blendEnhancers, composeCategoryPrompt } from '@/lib/sam/course-creation/category-prompts';
import { sanitizeCourseContext } from '@/lib/sam/course-creation/helpers';
import type { CourseContext } from '@/lib/sam/course-creation/types';

export const runtime = 'nodejs';
export const maxDuration = 300; // Vercel/serverless max; local timeout handles scaling

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

  // Fill cognitive gaps: if non-adjacent levels are selected, insert missing
  // intermediate levels to maintain proper Bloom's progression.
  // E.g., [UNDERSTAND, ANALYZE] → [UNDERSTAND, APPLY, ANALYZE]
  const filledLevels: string[] = [];
  for (let i = 0; i < uniqueLevels.length; i++) {
    const currentIdx = BLOOMS_ORDER.indexOf(uniqueLevels[i] as typeof BLOOMS_ORDER[number]);
    if (i > 0) {
      const prevIdx = BLOOMS_ORDER.indexOf(uniqueLevels[i - 1] as typeof BLOOMS_ORDER[number]);
      for (let gapIdx = prevIdx + 1; gapIdx < currentIdx; gapIdx++) {
        filledLevels.push(BLOOMS_ORDER[gapIdx]);
      }
    }
    filledLevels.push(uniqueLevels[i]);
  }

  if (filledLevels.length === 1) {
    return Array(chapterCount).fill(filledLevels[0]);
  }

  // Distribute chapters across levels proportionally
  // Earlier chapters get lower levels, later chapters get higher levels
  const distribution: string[] = [];
  const bandSize = chapterCount / filledLevels.length;

  for (let i = 0; i < chapterCount; i++) {
    const bandIndex = Math.min(
      Math.floor(i / bandSize),
      filledLevels.length - 1,
    );
    distribution.push(filledLevels[bandIndex]);
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

    // =========================================================================
    // PRE-RESOLVE MODEL — adapt strategy before making the AI call
    // =========================================================================
    const { model: resolvedModel, isReasoningModel } = await resolveAIModelInfo({
      userId: user.id,
      capability: 'course',
    });

    logger.info('[BLUEPRINT_ROUTE] Model pre-resolved', {
      model: resolvedModel,
      isReasoningModel,
    });

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

    // Pre-compute Bloom's distribution: explicit per-chapter level assignments
    const bloomsDistribution = computeBloomsDistribution(data.bloomsFocus, data.chapterCount);
    const bloomsAssignmentBlock = formatBloomsAssignments(bloomsDistribution);

    // =========================================================================
    // PROMPT STRATEGY — "Simple prompt, smart parser"
    // =========================================================================
    // The model already knows how to design expert-level courses. A natural,
    // concise prompt produces better output than verbose format rules and
    // BAD/GOOD examples. We let the model do what it does best and handle
    // structure enforcement in the parser.
    // =========================================================================

    const { systemPrompt, userPrompt } = buildBlueprintPrompts(
      ctx, data, composed, bloomsAssignmentBlock, isReasoningModel,
    );

    // =========================================================================
    // MODEL-AWARE TIMEOUT & TOKEN SCALING
    // =========================================================================
    const totalSections = data.chapterCount * data.sectionsPerChapter;

    // Reasoning models: 2-4 min (reasoning tokens dominate). Regular: 30-90s.
    const BLUEPRINT_TIMEOUT_MS = isReasoningModel
      ? Math.min(300_000, 120_000 + totalSections * 5000) // 120s base + 5s/section, cap 5 min
      : Math.min(120_000, 45_000 + totalSections * 2500);  // 45s base + 2.5s/section, cap 2 min

    // Reasoning models: enterprise client already does 4x scaling, so we send a smaller
    // base value (the client will multiply by 4 and cap at 8192). Regular: direct budget.
    const blueprintMaxTokens = isReasoningModel
      ? Math.min(4096, 1500 + data.chapterCount * 150 + totalSections * 80)  // Pre-4x: client will scale to ~6000-8192
      : Math.min(8192, 2000 + data.chapterCount * 300 + totalSections * 150);

    logger.info('[BLUEPRINT_ROUTE] Strategy', {
      isReasoningModel,
      model: resolvedModel,
      timeout: BLUEPRINT_TIMEOUT_MS,
      maxTokens: blueprintMaxTokens,
      totalSections,
    });

    const aiPromise = runSAMChatWithMetadata({
      userId: user.id,
      capability: 'course',
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
      maxTokens: blueprintMaxTokens,
      temperature: isReasoningModel ? 0.3 : 0.6, // Lower temp for reasoning models = fewer reasoning branches
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Blueprint generation timed out')), BLUEPRINT_TIMEOUT_MS);
    });

    let responseText: string;
    const aiStartTime = Date.now();
    try {
      const aiResult = await Promise.race([aiPromise, timeoutPromise]);
      responseText = aiResult.content;
      logger.info('[BLUEPRINT_ROUTE] AI call succeeded', {
        elapsed: `${Date.now() - aiStartTime}ms`,
        responseLength: responseText.length,
        timeout: BLUEPRINT_TIMEOUT_MS,
        provider: aiResult.provider,
        model: aiResult.model,
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
        isReasoningModel,
        model: resolvedModel,
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
      isReasoningModel,
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
// PROMPT BUILDER — "Simple prompt, smart parser"
// =============================================================================

/**
 * Build prompts using a natural, concise approach.
 *
 * Key insight: The model already knows how to design expert-level courses.
 * A natural request like "Design a course on X with Y chapters" produces
 * better output than verbose FORMAT RULES and BAD/GOOD examples.
 *
 * We keep the prompt simple and let the parser handle structure enforcement.
 * For reasoning models, we use even less meta-instruction to reduce thinking time.
 */
function buildBlueprintPrompts(
  ctx: CourseContext,
  data: z.infer<typeof BlueprintRequestSchema>,
  composed: ReturnType<typeof composeCategoryPrompt> | null,
  bloomsAssignmentBlock: string,
  isReasoningModel: boolean,
): { systemPrompt: string; userPrompt: string } {
  // Minimal system prompt — just establish the role + inject domain expertise
  const systemPrompt = `You are a world-class course architect who designs rigorous, well-sequenced courses at MIT/Stanford quality. Return ONLY valid JSON — no markdown fences, no extra text.
${composed?.expertiseBlock ?? ''}`;

  // Domain pedagogy blocks (if available from loaded skill files)
  const bloomsGuidanceBlock = composed?.chapterGuidanceBlock ?? '';
  const sectionGuidanceBlock = composed?.sectionGuidanceBlock ?? '';

  // Natural, concise user prompt — mirrors how a human would ask
  const userPrompt = `I am creating a course on "${ctx.courseTitle}" with ${ctx.totalChapters} chapters and ${ctx.sectionsPerChapter} sections in each chapter.

COURSE DETAILS:
- Title: "${ctx.courseTitle}"
- Overview: ${ctx.courseDescription}
- Category: ${ctx.courseCategory}${ctx.courseSubcategory ? ` > ${ctx.courseSubcategory}` : ''}
- Audience: ${ctx.targetAudience}
- Difficulty: ${ctx.difficulty}
${data.duration ? `- Duration: ${data.duration}` : ''}

Learning Objectives:
${ctx.courseLearningObjectives.map((g, i) => `${i + 1}. ${g}`).join('\n')}

## STEP 1 — UNDERSTAND THE COURSE CONTEXT (Do this BEFORE generating the blueprint)

Before creating the blueprint, deeply analyze:
1. **Course Title**: Identify the core subject, scope, and domain from "${ctx.courseTitle}". Every chapter and section MUST directly serve this title.
2. **Course Description**: Read the overview above. The blueprint must holistically cover the main topics and ideas described in it.
3. **Learning Objectives**: Each objective listed above must be addressed by at least one chapter. Map objectives to chapters.
4. **Bloom&apos;s Focus**: The selected cognitive levels define the depth — structure chapter progression from foundational to advanced within the ${ctx.difficulty} level.

## STEP 2 — GENERATE THE BLUEPRINT

Based on your analysis above, create a full course blueprint with chapter titles, section titles, and 3-5 key topics for each section. For each chapter, tell me what the deeper insight or thesis is.

CRITICAL ALIGNMENT RULES:
- Every chapter title, section title, and key topic MUST be directly relevant to "${ctx.courseTitle}" — do NOT generate topics that belong to a different course
- Cover the most important and essential topics for this specific course at the ${ctx.difficulty} level — do NOT pad with filler or tangential content
- The blueprint should read as a coherent learning journey that a student would expect from a course titled "${ctx.courseTitle}"
- If a topic would surprise a student who enrolled based on the title and description, do NOT include it

BLOOM'S LEVEL FOR EACH CHAPTER (use exactly these):
${bloomsAssignmentBlock}
${bloomsGuidanceBlock ? `\n${bloomsGuidanceBlock}` : ''}${sectionGuidanceBlock ? `\n${sectionGuidanceBlock}` : ''}

${isReasoningModel ? '' : `QUALITY EXPECTATIONS:
- Chapter titles should list the 2-3 core technical keywords covered
- Section titles should name the exact concept with parenthetical context where helpful
- Key topics should be expert-level — things a domain expert would put on a university syllabus
- Include teaching depth notes in key topics like "(why it exists)", "(intuition first)"
- Include math notation in key topics where relevant
- Ensure prerequisites are taught BEFORE they are needed in later chapters
`}Return the result as this JSON structure:
{
  "chapters": [
    {
      "position": 1,
      "title": "Chapter title with core keywords",
      "goal": "The deeper insight or thesis this chapter reveals",
      "bloomsLevel": "UNDERSTAND",
      "sections": [
        {"position": 1, "title": "Exact concept name with context", "keyTopics": ["Topic 1 (teaching note)", "Topic 2", "Topic 3"]},
        {"position": 2, "title": "Next concept", "keyTopics": ["Topic 1", "Topic 2", "Topic 3"]}
      ]
    }
  ],
  "confidence": 85,
  "riskAreas": ["Areas where students typically struggle and why"]
}

Generate ALL ${ctx.totalChapters} chapters with ALL ${ctx.sectionsPerChapter} sections each. Every section must have 3-5 keyTopics.`;

  return { systemPrompt, userPrompt };
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
