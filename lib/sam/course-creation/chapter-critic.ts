/**
 * Chapter Critic — Multi-Agent Review for Course Creation
 *
 * Provides a SEPARATE AI persona (reviewer, not creator) that critiques
 * generated chapters. This creates multi-agent collaboration where:
 * - Generator AI produces content
 * - Critic AI evaluates content from an independent perspective
 *
 * The critic checks:
 * - ARROW framework compliance
 * - Bloom's taxonomy alignment
 * - Concept prerequisite flow
 * - Content specificity (not generic)
 * - Overlap with prior chapters
 *
 * Falls back to rule-based approval if AI call fails (graceful degradation).
 * Single call per chapter, 12-second timeout.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { traceAICall, sanitizeCourseContext } from './helpers';
import type {
  GeneratedChapter,
  GeneratedSection,
  SectionDetails,
  CourseContext,
  CompletedChapter,
  ConceptTracker,
} from './types';

// ============================================================================
// Types
// ============================================================================

export type CriticVerdict = 'approve' | 'revise' | 'reject';

export interface ChapterCritique {
  /** Overall verdict */
  verdict: CriticVerdict;
  /** Confidence in the verdict (0-100) */
  confidence: number;
  /** Summary reasoning */
  reasoning: string;
  /** ARROW framework compliance score (0-100) */
  arrowCompliance: number;
  /** Bloom's alignment score (0-100) */
  bloomsAlignment: number;
  /** Concept prerequisite flow score (0-100) */
  conceptFlow: number;
  /** Content specificity score (0-100) */
  specificity: number;
  /** Actionable improvements for revision */
  actionableImprovements: string[];
}

export interface SectionCritique {
  verdict: CriticVerdict;
  confidence: number;
  reasoning: string;
  topicRelevance: number;
  contentTypeAppropriate: number;
  uniqueness: number;
  conceptProgression: number;
  actionableImprovements: string[];
}

export interface DetailsCritique {
  verdict: CriticVerdict;
  confidence: number;
  reasoning: string;
  motivationClarity: number;
  intuitionClarity: number;
  equationIntuitionQuality: number;
  visualizationQuality: number;
  exampleConcreteness: number;
  misconceptionRepairQuality: number;
  actionableImprovements: string[];
}

// ============================================================================
// Constants
// ============================================================================

/** Timeout for critic AI call (ms) — 12s allows real AI critique; 5s was too aggressive */
const CRITIC_TIMEOUT_MS = 12_000;

/** Timeout for section/details critic AI call (ms) */
const STAGE_CRITIC_TIMEOUT_MS = 8_000;

/** Minimum confidence to act on a 'revise' verdict */
const MIN_REVISE_CONFIDENCE = 60;

/** Borderline quality range — only fire Stage 2/3 critics within this range (cost optimization) */
const BORDERLINE_MIN = 45;
const BORDERLINE_MAX = 58;

// ============================================================================
// Critic Persona
// ============================================================================

const COURSE_CRITIC_PERSONA = `You are a COURSE QUALITY REVIEWER — a separate expert from the content creator.
Your role is to critically evaluate a generated chapter from an INDEPENDENT perspective.

You are NOT the creator. You are the reviewer. Be honest, specific, and constructive.

## Evaluation Dimensions

1. **ARROW Framework Compliance** (0-100):
   - Does the chapter structure follow Application → Reverse-Engineer → Intuition → Formalization flow?
   - Are there clear hooks, walkthroughs, and practice elements implied by the objectives?
   - Score 80+ if ARROW phases are well-represented in objectives and topics.

2. **Bloom's Alignment** (0-100):
   - Do ALL learning objectives use verbs appropriate for the stated Bloom's level?
   - Is the cognitive complexity consistent across objectives?
   - Score 80+ if objectives clearly match the target Bloom's level.

3. **Concept Prerequisite Flow** (0-100):
   - Do the key topics build on previously covered concepts?
   - Are there any concepts referenced that lack prerequisites?
   - Score 80+ if the concept chain is logical and well-ordered.

4. **Content Specificity** (0-100):
   - Are topics concrete and specific (named technologies, real examples)?
   - Or are they vague and generic ("introduction to concepts")?
   - Score 80+ if topics are clearly actionable and specific.

## Response Format

Return ONLY a JSON object (no markdown, no explanation outside JSON):
{
  "verdict": "approve" | "revise" | "reject",
  "confidence": <0-100>,
  "reasoning": "<2-3 sentence summary>",
  "arrowCompliance": <0-100>,
  "bloomsAlignment": <0-100>,
  "conceptFlow": <0-100>,
  "specificity": <0-100>,
  "actionableImprovements": ["<specific improvement 1>", "<specific improvement 2>"]
}

## Verdict Guidelines

- **approve**: All dimensions >= 70, no critical issues
- **revise**: 1-2 dimensions < 70, or specific improvements would meaningfully enhance quality
- **reject**: Multiple dimensions < 50, fundamentally flawed structure (rare)

Be specific in actionableImprovements — tell the creator exactly what to fix.`;

// ============================================================================
// Public API
// ============================================================================

/**
 * Review a generated chapter with an independent critic AI persona.
 *
 * Returns null if quality score is outside borderline range (cost optimization).
 * Same gate as Stage 2/3 critics — only fires when quality is borderline (55-70).
 *
 * Makes a single AI call with a 12-second timeout.
 * Falls back to rule-based approval on failure.
 */
export async function reviewChapterWithCritic(params: {
  userId: string;
  chapter: GeneratedChapter;
  courseContext: CourseContext;
  priorChapters: CompletedChapter[];
  conceptTracker: ConceptTracker;
  qualityScore: number;
  runId?: string;
}): Promise<ChapterCritique | null> {
  const { userId, chapter, courseContext, priorChapters, conceptTracker, qualityScore, runId } = params;

  // Only fire for borderline quality (cost optimization — same gate as Stage 2/3 critics)
  if (qualityScore < BORDERLINE_MIN || qualityScore > BORDERLINE_MAX) {
    return null;
  }

  try {
    const critique = await withTimeout(
      doReviewChapter(userId, chapter, courseContext, priorChapters, conceptTracker, runId),
      CRITIC_TIMEOUT_MS,
    );

    logger.info('[ChapterCritic] Review complete', {
      chapter: chapter.position,
      verdict: critique.verdict,
      confidence: critique.confidence,
      arrowCompliance: critique.arrowCompliance,
      bloomsAlignment: critique.bloomsAlignment,
    });

    return critique;
  } catch (error) {
    logger.warn('[ChapterCritic] AI review failed, using rule-based fallback', {
      chapter: chapter.position,
      error: error instanceof Error ? error.message : String(error),
    });

    return buildRuleBasedCritique(chapter, courseContext, priorChapters, conceptTracker);
  }
}

// ============================================================================
// Internal
// ============================================================================

async function doReviewChapter(
  userId: string,
  chapter: GeneratedChapter,
  courseContext: CourseContext,
  priorChapters: CompletedChapter[],
  conceptTracker: ConceptTracker,
  runId?: string,
): Promise<ChapterCritique> {
  // Sanitize user-controlled fields before prompt interpolation
  const ctx = sanitizeCourseContext(courseContext);

  // Build context for the critic
  const priorChapterSummary = priorChapters.length > 0
    ? priorChapters.map(ch =>
      `Ch${ch.position}: "${ch.title}" (${ch.bloomsLevel}) — ${ch.learningObjectives.slice(0, 3).join('; ')}`
    ).join('\n')
    : 'No prior chapters (this is the first chapter)';

  const priorConcepts = Array.from(conceptTracker.concepts.keys()).slice(0, 20);

  const userPrompt = `## Chapter to Review

**Chapter ${chapter.position}: "${chapter.title}"**
- Bloom's Level: ${chapter.bloomsLevel}
- Description: ${chapter.description}
- Learning Objectives:
${chapter.learningObjectives.map(obj => `  - ${obj}`).join('\n')}
- Key Topics: ${chapter.keyTopics.join(', ')}
- Prerequisites: ${chapter.prerequisites || 'None specified'}
- Estimated Time: ${chapter.estimatedTime}

## Course Context

- Title: "${ctx.courseTitle}"
- Category: ${ctx.courseCategory}
- Difficulty: ${ctx.difficulty}
- Target Audience: ${ctx.targetAudience}
- Total Chapters: ${ctx.totalChapters}

## Prior Chapters

${priorChapterSummary}

## Concepts Already Covered

${priorConcepts.length > 0 ? priorConcepts.join(', ') : 'None yet (first chapter)'}

Review this chapter and return your critique as JSON.`;

  const responseText = await traceAICall(
    { runId, stage: 'critic', chapter: chapter.position, label: `Critic Ch${chapter.position}` },
    () => runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt: COURSE_CRITIC_PERSONA,
      maxTokens: 1000,
      temperature: 0.3,
    }),
  );

  return parseCriticResponse(responseText, chapter);
}

function parseCriticResponse(responseText: string, chapter: GeneratedChapter): ChapterCritique {
  // Extract JSON from response (may have markdown fences)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in critic response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  const verdict = parseVerdict(parsed.verdict);
  const confidence = clamp(Number(parsed.confidence) || 70, 0, 100);
  const arrowCompliance = clamp(Number(parsed.arrowCompliance) || 70, 0, 100);
  const bloomsAlignment = clamp(Number(parsed.bloomsAlignment) || 70, 0, 100);
  const conceptFlow = clamp(Number(parsed.conceptFlow) || 70, 0, 100);
  const specificity = clamp(Number(parsed.specificity) || 70, 0, 100);
  const reasoning = String(parsed.reasoning || `Chapter ${chapter.position} review complete`);
  const actionableImprovements = Array.isArray(parsed.actionableImprovements)
    ? (parsed.actionableImprovements as unknown[]).map(String).slice(0, 5)
    : [];

  // Override: don't act on low-confidence revise verdicts
  const effectiveVerdict = verdict === 'revise' && confidence < MIN_REVISE_CONFIDENCE
    ? 'approve'
    : verdict;

  return {
    verdict: effectiveVerdict,
    confidence,
    reasoning,
    arrowCompliance,
    bloomsAlignment,
    conceptFlow,
    specificity,
    actionableImprovements,
  };
}

function parseVerdict(raw: unknown): CriticVerdict {
  const value = String(raw).toLowerCase().trim();
  if (value === 'approve' || value === 'revise' || value === 'reject') {
    return value;
  }
  return 'approve'; // Default to approve on unparseable verdict
}

/**
 * Rule-based fallback when AI critic is unavailable.
 *
 * Checks basic structural quality without an AI call.
 */
function buildRuleBasedCritique(
  chapter: GeneratedChapter,
  courseContext: CourseContext,
  priorChapters: CompletedChapter[],
  conceptTracker: ConceptTracker,
): ChapterCritique {
  const improvements: string[] = [];
  let arrowCompliance = 75;
  let bloomsAlignment = 75;
  let conceptFlow = 80;
  let specificity = 75;

  // Check learning objectives count
  if (chapter.learningObjectives.length < 3) {
    improvements.push(`Add more learning objectives (currently ${chapter.learningObjectives.length}, recommend 4-6)`);
    bloomsAlignment -= 15;
  }

  // Check key topics count
  if (chapter.keyTopics.length < 2) {
    improvements.push('Add more key topics to ensure comprehensive coverage');
    specificity -= 15;
  }

  // Check for generic titles
  const genericPatterns = /^(introduction|overview|basics|getting started|conclusion)/i;
  if (genericPatterns.test(chapter.title) && chapter.position > 1 && chapter.position < courseContext.totalChapters) {
    improvements.push('Chapter title is too generic — use a more specific, content-rich title');
    specificity -= 10;
  }

  // Check concept overlap with prior chapters
  if (priorChapters.length > 0) {
    const priorTopics = new Set(priorChapters.flatMap(ch => ch.keyTopics.map(t => t.toLowerCase())));
    const overlapping = chapter.keyTopics.filter(t => priorTopics.has(t.toLowerCase()));
    if (overlapping.length > chapter.keyTopics.length * 0.5) {
      improvements.push(`High topic overlap with prior chapters: ${overlapping.join(', ')}`);
      conceptFlow -= 15;
    }
  }

  // Check prerequisites reference
  if (chapter.position > 1 && !chapter.prerequisites) {
    improvements.push('Chapter should reference prerequisites from prior chapters');
    conceptFlow -= 10;
  }

  // Check description length
  if (chapter.description.length < 50) {
    improvements.push('Chapter description is too brief — expand with specific learning context');
    arrowCompliance -= 10;
  }

  const scores = [arrowCompliance, bloomsAlignment, conceptFlow, specificity];
  const allAbove70 = scores.every(s => s >= 70);
  const anyBelow50 = scores.some(s => s < 50);

  const verdict: CriticVerdict = anyBelow50
    ? 'reject'
    : !allAbove70
      ? 'revise'
      : 'approve';

  return {
    verdict: improvements.length === 0 ? 'approve' : verdict,
    confidence: 65, // Rule-based is less confident than AI
    reasoning: improvements.length === 0
      ? `Chapter ${chapter.position} passes basic structural quality checks`
      : `Chapter ${chapter.position} has ${improvements.length} area(s) for improvement`,
    arrowCompliance: clamp(arrowCompliance, 0, 100),
    bloomsAlignment: clamp(bloomsAlignment, 0, 100),
    conceptFlow: clamp(conceptFlow, 0, 100),
    specificity: clamp(specificity, 0, 100),
    actionableImprovements: improvements,
  };
}

// ============================================================================
// Stage 2 Critic — Section Review
// ============================================================================

const SECTION_CRITIC_PERSONA = `You are a SECTION QUALITY REVIEWER for an AI course generator.
Evaluate whether a generated section fits well within its chapter structure.

## Evaluation Dimensions (0-100 each)

1. **Topic Relevance**: Does the section topic align with the chapter objectives and key topics?
2. **Content Type Appropriate**: Is the chosen content type (video, text, quiz) suitable for this topic and Bloom&apos;s level?
3. **Uniqueness**: Does this section avoid duplicating prior sections in the same chapter?
4. **Concept Progression**: Does this section build logically on earlier sections in the chapter?

## Response Format

Return ONLY JSON (no markdown fences):
{
  "verdict": "approve" | "revise" | "reject",
  "confidence": <0-100>,
  "reasoning": "<1-2 sentence summary>",
  "topicRelevance": <0-100>,
  "contentTypeAppropriate": <0-100>,
  "uniqueness": <0-100>,
  "conceptProgression": <0-100>,
  "actionableImprovements": ["<specific improvement>", ...]
}

Be concise and specific. Max 3 improvements.`;

/**
 * Review a generated section with an independent critic.
 * Returns null if quality score is outside borderline range (cost optimization).
 */
export async function reviewSectionWithCritic(params: {
  userId: string;
  section: GeneratedSection;
  chapter: GeneratedChapter;
  priorSections: GeneratedSection[];
  qualityScore: number;
  courseContext: CourseContext;
  runId?: string;
}): Promise<SectionCritique | null> {
  const { userId, section, chapter, priorSections, qualityScore, courseContext, runId } = params;

  // Only fire for borderline quality (cost optimization)
  if (qualityScore < BORDERLINE_MIN || qualityScore > BORDERLINE_MAX) {
    return null;
  }

  try {
    const critique = await withTimeout(
      doReviewSection(userId, section, chapter, priorSections, courseContext, runId),
      STAGE_CRITIC_TIMEOUT_MS,
    );

    logger.info('[SectionCritic] Review complete', {
      chapter: chapter.position,
      section: section.position,
      verdict: critique.verdict,
      confidence: critique.confidence,
    });

    return critique;
  } catch (error) {
    logger.warn('[SectionCritic] AI review failed, using rule-based fallback', {
      section: section.position,
      error: error instanceof Error ? error.message : String(error),
    });

    return buildRuleBasedSectionCritique(section, chapter, priorSections);
  }
}

async function doReviewSection(
  userId: string,
  section: GeneratedSection,
  chapter: GeneratedChapter,
  priorSections: GeneratedSection[],
  courseContext: CourseContext,
  runId?: string,
): Promise<SectionCritique> {
  // Sanitize user-controlled fields before prompt interpolation
  const ctx = sanitizeCourseContext(courseContext);

  const priorSectionSummary = priorSections.length > 0
    ? priorSections.map(s => `S${s.position}: "${s.title}" (${s.contentType})`).join('\n')
    : 'No prior sections (this is the first)';

  const userPrompt = `## Section to Review

**Chapter ${chapter.position}: "${chapter.title}"** (${chapter.bloomsLevel})
**Section ${section.position}: "${section.title}"**
- Content Type: ${section.contentType}
- Topic Focus: ${section.topicFocus}
- Duration: ${section.estimatedDuration}
- Course: "${ctx.courseTitle}" (${ctx.difficulty})

**Chapter Key Topics**: ${chapter.keyTopics.join(', ')}
**Chapter Objectives**: ${chapter.learningObjectives.slice(0, 3).join('; ')}

## Prior Sections in This Chapter

${priorSectionSummary}

Review this section and return your critique as JSON.`;

  const responseText = await traceAICall(
    { runId, stage: 'section-critic', chapter: chapter.position, section: section.position, label: `SectionCritic Ch${chapter.position}S${section.position}` },
    () => runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt: SECTION_CRITIC_PERSONA,
      maxTokens: 800,
      temperature: 0.3,
    }),
  );

  return parseSectionCriticResponse(responseText, section);
}

function parseSectionCriticResponse(responseText: string, section: GeneratedSection): SectionCritique {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in section critic response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  const verdict = parseVerdict(parsed.verdict);
  const confidence = clamp(Number(parsed.confidence) || 70, 0, 100);
  const topicRelevance = clamp(Number(parsed.topicRelevance) || 70, 0, 100);
  const contentTypeAppropriate = clamp(Number(parsed.contentTypeAppropriate) || 70, 0, 100);
  const uniqueness = clamp(Number(parsed.uniqueness) || 70, 0, 100);
  const conceptProgression = clamp(Number(parsed.conceptProgression) || 70, 0, 100);
  const reasoning = String(parsed.reasoning || `Section ${section.position} review complete`);
  const actionableImprovements = Array.isArray(parsed.actionableImprovements)
    ? (parsed.actionableImprovements as unknown[]).map(String).slice(0, 3)
    : [];

  const effectiveVerdict = verdict === 'revise' && confidence < MIN_REVISE_CONFIDENCE
    ? 'approve'
    : verdict;

  return {
    verdict: effectiveVerdict,
    confidence,
    reasoning,
    topicRelevance,
    contentTypeAppropriate,
    uniqueness,
    conceptProgression,
    actionableImprovements,
  };
}

function buildRuleBasedSectionCritique(
  section: GeneratedSection,
  chapter: GeneratedChapter,
  priorSections: GeneratedSection[],
): SectionCritique {
  const improvements: string[] = [];
  let topicRelevance = 75;
  let contentTypeAppropriate = 75;
  let uniqueness = 80;
  let conceptProgression = 75;

  // Check topic alignment with chapter
  const chapterTopicsLower = chapter.keyTopics.map(t => t.toLowerCase());
  const topicInChapter = chapterTopicsLower.some(t =>
    section.topicFocus.toLowerCase().includes(t) || t.includes(section.topicFocus.toLowerCase())
  );
  if (!topicInChapter && chapter.keyTopics.length > 0) {
    improvements.push(`Section topic "${section.topicFocus}" doesn&apos;t clearly map to chapter key topics`);
    topicRelevance -= 15;
  }

  // Check for duplicate titles
  const priorTitlesLower = priorSections.map(s => s.title.toLowerCase());
  if (priorTitlesLower.includes(section.title.toLowerCase())) {
    improvements.push('Section title duplicates a prior section');
    uniqueness -= 25;
  }

  const scores = [topicRelevance, contentTypeAppropriate, uniqueness, conceptProgression];
  const allAbove70 = scores.every(s => s >= 70);
  const anyBelow50 = scores.some(s => s < 50);

  const verdict: CriticVerdict = anyBelow50 ? 'reject' : !allAbove70 ? 'revise' : 'approve';

  return {
    verdict: improvements.length === 0 ? 'approve' : verdict,
    confidence: 60,
    reasoning: improvements.length === 0
      ? `Section ${section.position} passes basic quality checks`
      : `Section ${section.position} has ${improvements.length} area(s) for improvement`,
    topicRelevance: clamp(topicRelevance, 0, 100),
    contentTypeAppropriate: clamp(contentTypeAppropriate, 0, 100),
    uniqueness: clamp(uniqueness, 0, 100),
    conceptProgression: clamp(conceptProgression, 0, 100),
    actionableImprovements: improvements,
  };
}

/**
 * Build a feedback block from section critic results for injection into retry prompts.
 */
export function buildSectionCriticFeedbackBlock(critique: SectionCritique): string {
  return [
    '\n\n## INDEPENDENT SECTION REVIEWER FEEDBACK',
    '',
    `An independent reviewer scored your section and requests revision (confidence: ${critique.confidence}%).`,
    '',
    '### Required Improvements:',
    ...critique.actionableImprovements.map((imp, i) => `${i + 1}. ${imp}`),
    '',
    `Dimension Scores: TopicRelevance=${critique.topicRelevance}, ContentType=${critique.contentTypeAppropriate}, Uniqueness=${critique.uniqueness}, ConceptProgression=${critique.conceptProgression}`,
    '',
    'Address ALL reviewer feedback. Generate a substantially improved version.',
  ].join('\n');
}

// ============================================================================
// Stage 3 Critic — Details Review
// ============================================================================

const DETAILS_CRITIC_PERSONA = `You are a SECTION DETAILS REVIEWER for an AI course generator.
Evaluate whether generated section details follow the required professor-style explanation anatomy.

## Evaluation Dimensions (0-100 each)

1. **Motivation Clarity**: Does "Why It Was Developed" clearly explain the motivating problem/limitation?
2. **Intuition Clarity**: Does "Core Intuition" give a beginner-friendly mental model/analogy?
3. **Equation Intuition Quality**: Does "Equation Intuition" explain term meanings and equation shape (or clearly justify no equation)?
4. **Visualization Quality**: Does "Step-by-Step Visualization" provide a clear sequential mental walkthrough?
5. **Example Concreteness**: Does "Concrete Example" include a specific worked mini-scenario?
6. **Misconception Repair Quality**: Does "Common Confusion + Fix" include both misconception and correction?

## Response Format

Return ONLY JSON (no markdown fences):
{
  "verdict": "approve" | "revise" | "reject",
  "confidence": <0-100>,
  "reasoning": "<1-2 sentence summary>",
  "motivationClarity": <0-100>,
  "intuitionClarity": <0-100>,
  "equationIntuitionQuality": <0-100>,
  "visualizationQuality": <0-100>,
  "exampleConcreteness": <0-100>,
  "misconceptionRepairQuality": <0-100>,
  "actionableImprovements": ["<specific improvement>", ...]
}

Be concise and specific. Max 3 improvements.`;

/**
 * Review generated section details with an independent critic.
 * Returns null if quality score is outside borderline range (cost optimization).
 */
export async function reviewDetailsWithCritic(params: {
  userId: string;
  details: SectionDetails;
  section: GeneratedSection;
  chapter: GeneratedChapter;
  qualityScore: number;
  courseContext: CourseContext;
  runId?: string;
}): Promise<DetailsCritique | null> {
  const { userId, details, section, chapter, qualityScore, courseContext, runId } = params;

  // Only fire for borderline quality (cost optimization)
  if (qualityScore < BORDERLINE_MIN || qualityScore > BORDERLINE_MAX) {
    return null;
  }

  try {
    const critique = await withTimeout(
      doReviewDetails(userId, details, section, chapter, courseContext, runId),
      STAGE_CRITIC_TIMEOUT_MS,
    );

    logger.info('[DetailsCritic] Review complete', {
      chapter: chapter.position,
      section: section.position,
      verdict: critique.verdict,
      confidence: critique.confidence,
    });

    return critique;
  } catch (error) {
    logger.warn('[DetailsCritic] AI review failed, using rule-based fallback', {
      section: section.position,
      error: error instanceof Error ? error.message : String(error),
    });

    return buildRuleBasedDetailsCritique(details, section, chapter);
  }
}

async function doReviewDetails(
  userId: string,
  details: SectionDetails,
  section: GeneratedSection,
  chapter: GeneratedChapter,
  courseContext: CourseContext,
  runId?: string,
): Promise<DetailsCritique> {
  // Sanitize user-controlled fields before prompt interpolation
  const ctx = sanitizeCourseContext(courseContext);

  const userPrompt = `## Section Details to Review

**Chapter ${chapter.position}: "${chapter.title}"** (${chapter.bloomsLevel})
**Section ${section.position}: "${section.title}"** (${section.contentType})
**Course**: "${ctx.courseTitle}" (${ctx.difficulty})

### Description:
${details.description.slice(0, 500)}${details.description.length > 500 ? '...' : ''}

### Learning Objectives:
${details.learningObjectives.map(obj => `- ${obj}`).join('\n')}

### Key Concepts:
${(details.keyConceptsCovered ?? []).join(', ') || 'None specified'}

### Practical Activity:
${(details.practicalActivity ?? '').slice(0, 300) || 'None specified'}

Review these details and return your critique as JSON.`;

  const responseText = await traceAICall(
    { runId, stage: 'details-critic', chapter: chapter.position, section: section.position, label: `DetailsCritic Ch${chapter.position}S${section.position}` },
    () => runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt: DETAILS_CRITIC_PERSONA,
      maxTokens: 800,
      temperature: 0.3,
    }),
  );

  return parseDetailsCriticResponse(responseText, section);
}

function parseDetailsCriticResponse(responseText: string, section: GeneratedSection): DetailsCritique {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in details critic response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  const verdict = parseVerdict(parsed.verdict);
  const confidence = clamp(Number(parsed.confidence) || 70, 0, 100);
  const motivationClarity = clamp(Number(parsed.motivationClarity) || 70, 0, 100);
  const intuitionClarity = clamp(Number(parsed.intuitionClarity) || 70, 0, 100);
  const equationIntuitionQuality = clamp(Number(parsed.equationIntuitionQuality) || 70, 0, 100);
  const visualizationQuality = clamp(Number(parsed.visualizationQuality) || 70, 0, 100);
  const exampleConcreteness = clamp(Number(parsed.exampleConcreteness) || 70, 0, 100);
  const misconceptionRepairQuality = clamp(Number(parsed.misconceptionRepairQuality) || 70, 0, 100);
  const reasoning = String(parsed.reasoning || `Section ${section.position} details review complete`);
  const actionableImprovements = Array.isArray(parsed.actionableImprovements)
    ? (parsed.actionableImprovements as unknown[]).map(String).slice(0, 3)
    : [];

  const effectiveVerdict = verdict === 'revise' && confidence < MIN_REVISE_CONFIDENCE
    ? 'approve'
    : verdict;

  return {
    verdict: effectiveVerdict,
    confidence,
    reasoning,
    motivationClarity,
    intuitionClarity,
    equationIntuitionQuality,
    visualizationQuality,
    exampleConcreteness,
    misconceptionRepairQuality,
    actionableImprovements,
  };
}

function buildRuleBasedDetailsCritique(
  details: SectionDetails,
  section: GeneratedSection,
  _chapter: GeneratedChapter,
): DetailsCritique {
  const improvements: string[] = [];
  let motivationClarity = 75;
  let intuitionClarity = 75;
  let equationIntuitionQuality = 75;
  let visualizationQuality = 75;
  let exampleConcreteness = 75;
  let misconceptionRepairQuality = 75;

  const description = details.description;
  const hasHeading = (heading: string): boolean =>
    new RegExp(`<h2>\\s*${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</h2>`, 'i').test(description);
  const sectionText = (heading: string): string => {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`<h2>\\s*${escaped}\\s*</h2>([\\s\\S]*?)(?=<h2>|$)`, 'i');
    const match = description.match(regex);
    return (match?.[1] ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  if (!hasHeading('Why It Was Developed')) {
    improvements.push('Add the required <h2>Why It Was Developed</h2> section.');
    motivationClarity -= 25;
  } else if (!/(problem|limitation|challenge|motivated|developed)/i.test(sectionText('Why It Was Developed'))) {
    improvements.push('Strengthen the motivating problem/limitation in "Why It Was Developed".');
    motivationClarity -= 15;
  }

  if (!hasHeading('Core Intuition')) {
    improvements.push('Add the required <h2>Core Intuition</h2> section.');
    intuitionClarity -= 25;
  } else if (!/(mental model|analogy|think of|imagine)/i.test(sectionText('Core Intuition'))) {
    improvements.push('Include a beginner-friendly mental model or analogy in "Core Intuition".');
    intuitionClarity -= 15;
  }

  if (!hasHeading('Equation Intuition')) {
    improvements.push('Add the required <h2>Equation Intuition</h2> section.');
    equationIntuitionQuality -= 25;
  } else {
    const eqText = sectionText('Equation Intuition');
    const eqHasMath = /(\$[^$]+\$|\$\$[\s\S]+?\$\$|\\frac|\\sum|\\int|=)/.test(description);
    const eqExplainsTerms = /(term|coefficient|numerator|denominator|variable|represents|means)/i.test(eqText);
    const eqExplainsShape = /(shape|structure|form|because|why)/i.test(eqText);
    const eqNoMathRationale = /(no equation|equation is not required|does not require an equation)/i.test(eqText);
    if (eqHasMath && (!eqExplainsTerms || !eqExplainsShape)) {
      improvements.push('In "Equation Intuition", explain each term and why the equation has its structure.');
      equationIntuitionQuality -= 20;
    } else if (!eqHasMath && !eqNoMathRationale) {
      improvements.push('If no equation is needed, explicitly justify that in "Equation Intuition".');
      equationIntuitionQuality -= 15;
    }
  }

  if (!hasHeading('Step-by-Step Visualization')) {
    improvements.push('Add the required <h2>Step-by-Step Visualization</h2> section.');
    visualizationQuality -= 25;
  } else if (!/(step|first|second|third|next|then|finally|visualize)/i.test(sectionText('Step-by-Step Visualization'))) {
    improvements.push('Make "Step-by-Step Visualization" explicitly sequential.');
    visualizationQuality -= 15;
  }

  if (!hasHeading('Concrete Example')) {
    improvements.push('Add the required <h2>Concrete Example</h2> section.');
    exampleConcreteness -= 25;
  } else if (!/(\d|for example|scenario|suppose|worked example|mini)/i.test(sectionText('Concrete Example'))) {
    improvements.push('Use a concrete worked mini-scenario in "Concrete Example".');
    exampleConcreteness -= 15;
  }

  if (!hasHeading('Common Confusion + Fix')) {
    improvements.push('Add the required <h2>Common Confusion + Fix</h2> section.');
    misconceptionRepairQuality -= 25;
  } else {
    const confusionText = sectionText('Common Confusion + Fix');
    const hasMisconception = /(confusion|misconception|mistake|often think|trap)/i.test(confusionText);
    const hasFix = /(fix|avoid|instead|correct|remember)/i.test(confusionText);
    if (!hasMisconception || !hasFix) {
      improvements.push('"Common Confusion + Fix" must include both misconception and correction.');
      misconceptionRepairQuality -= 15;
    }
  }

  const scores = [
    motivationClarity,
    intuitionClarity,
    equationIntuitionQuality,
    visualizationQuality,
    exampleConcreteness,
    misconceptionRepairQuality,
  ];
  const allAbove70 = scores.every(s => s >= 70);
  const anyBelow50 = scores.some(s => s < 50);

  const verdict: CriticVerdict = anyBelow50 ? 'reject' : !allAbove70 ? 'revise' : 'approve';

  return {
    verdict: improvements.length === 0 ? 'approve' : verdict,
    confidence: 60,
    reasoning: improvements.length === 0
      ? `Section ${section.position} details pass basic quality checks`
      : `Section ${section.position} details have ${improvements.length} area(s) for improvement`,
    motivationClarity: clamp(motivationClarity, 0, 100),
    intuitionClarity: clamp(intuitionClarity, 0, 100),
    equationIntuitionQuality: clamp(equationIntuitionQuality, 0, 100),
    visualizationQuality: clamp(visualizationQuality, 0, 100),
    exampleConcreteness: clamp(exampleConcreteness, 0, 100),
    misconceptionRepairQuality: clamp(misconceptionRepairQuality, 0, 100),
    actionableImprovements: improvements,
  };
}

/**
 * Build a feedback block from details critic results for injection into retry prompts.
 */
export function buildDetailsCriticFeedbackBlock(critique: DetailsCritique): string {
  return [
    '\n\n## INDEPENDENT DETAILS REVIEWER FEEDBACK',
    '',
    `An independent reviewer scored your section details and requests revision (confidence: ${critique.confidence}%).`,
    '',
    '### Required Improvements:',
    ...critique.actionableImprovements.map((imp, i) => `${i + 1}. ${imp}`),
    '',
    `Dimension Scores: Motivation=${critique.motivationClarity}, Intuition=${critique.intuitionClarity}, Equation=${critique.equationIntuitionQuality}, Visualization=${critique.visualizationQuality}, Example=${critique.exampleConcreteness}, ConfusionFix=${critique.misconceptionRepairQuality}`,
    '',
    'Address ALL reviewer feedback. Generate a substantially improved version.',
  ].join('\n');
}

// ============================================================================
// Utilities
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Critic timed out after ${ms}ms`)), ms);
    promise
      .then(result => { clearTimeout(timer); resolve(result); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}
