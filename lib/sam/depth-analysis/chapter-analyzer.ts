/**
 * Agentic Depth Analysis - Per-Chapter Analyzer
 *
 * Analyzes a single chapter through up to 5 stages depending on mode.
 * Each stage produces framework results and issues.
 *
 * Stages:
 * 1. Structural Analysis (rule-based, fast)
 * 2. Cognitive Depth (AI-powered, multi-framework)
 * 3. Pedagogical Quality (AI-powered, Gagne + alignment)
 * 4. Content Flow + Prerequisites (AI-powered)
 * 5. Assessment + Accessibility (AI + rule-based)
 */

import { logger } from '@/lib/logger';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import {
  initializeChapterSubGoal,
  completeChapterSubGoal,
} from './analysis-controller';
import { persistQualityPatternsBackground } from './memory-persistence';
import { generateIssueFingerprint } from './orchestrator';
import { evaluateBloomsRuleBased } from './framework-evaluators';
import { buildCognitiveDepthPrompt, buildPedagogicalPrompt, buildFlowAnalysisPrompt } from './prompts/system-prompt';
import type {
  AnalysisStepContext,
  ChapterAnalysisResult,
  SectionAnalysisResult,
  AnalysisIssue,
  BloomsDistribution,
  GagneEventCheck,
  FrameworkScores,
  SSEEmitter,
  BloomsLevel,
  IssueSeverity,
  StageDataSource,
} from './types';
import { BLOOMS_DEPTH_WEIGHTS } from './types';

// =============================================================================
// MAIN ENTRY
// =============================================================================

export async function analyzeChapter(
  context: AnalysisStepContext,
  emitSSE: SSEEmitter,
  goalId: string
): Promise<ChapterAnalysisResult> {
  const { chapterNumber, chapterId, chapterTitle, chapterContent, mode } = context;

  // Create SubGoal for this chapter
  const subGoalId = await initializeChapterSubGoal(goalId, chapterNumber, chapterTitle);

  const sections: SectionAnalysisResult[] = [];
  const issues: AnalysisIssue[] = [];
  let bloomsDist: BloomsDistribution = {
    REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0,
  };
  let frameworkScores: FrameworkScores = {};
  let gagneCompliance: GagneEventCheck[] = [];
  let constructiveAlignmentScore = 0;

  // Track which stages used AI vs fallback (transparency)
  let cognitiveSource: 'ai' | 'ai+rules' | 'rule-based' | 'skipped' = 'skipped';
  let pedagogicalSource: 'ai' | 'skipped' | 'failed' = 'skipped';
  let flowSource: 'ai' | 'skipped' | 'failed' = 'skipped';

  // Stage 1: Structural Analysis (always runs, rule-based)
  emitSSE('stage_start', { stage: 1, name: 'Structural Analysis', chapterNumber });
  const structuralResult = runStructuralAnalysis(context);
  issues.push(...structuralResult.issues);
  const structuralScore = structuralResult.score;
  emitSSE('framework_result', {
    chapterNumber,
    framework: 'structural',
    score: structuralScore,
    issueCount: structuralResult.issues.length,
  });

  // Empty chapter fast path
  if (chapterContent.totalWordCount < 50) {
    issues.push({
      fingerprint: generateIssueFingerprint('STRUCTURE', chapterId, 'empty'),
      chapterId,
      chapterTitle,
      chapterPosition: chapterContent.position,
      type: 'STRUCTURE',
      severity: 'CRITICAL',
      framework: 'structural',
      title: 'Empty or near-empty chapter',
      description: `Chapter "${chapterTitle}" has only ${chapterContent.totalWordCount} words. Minimum recommended is 500 words per chapter.`,
      fix: {
        action: 'Add content',
        what: 'Add substantive content to this chapter',
        why: 'Empty chapters provide no learning value and break content flow',
        how: 'Add sections with reading material, examples, and exercises',
      },
    });

    await completeChapterSubGoal(subGoalId);
    return buildResult(
      context, sections, issues, bloomsDist, frameworkScores, gagneCompliance, constructiveAlignmentScore,
      structuralScore, 0, 0, 0, 0,
      { structural: 'rule-based', cognitive: 'skipped', pedagogical: 'skipped', flow: 'skipped', assessment: 'rule-based', confidence: 0.3 }
    );
  }

  // Stage 2: Cognitive Depth (AI-powered) - runs in quick+ modes
  if (['quick', 'standard', 'deep', 'comprehensive'].includes(mode)) {
    emitSSE('stage_start', { stage: 2, name: 'Cognitive Depth Analysis', chapterNumber });
    try {
      const cognitiveResult = await runCognitiveAnalysis(context);
      bloomsDist = cognitiveResult.bloomsDistribution;
      frameworkScores = { ...frameworkScores, ...cognitiveResult.frameworkScores };
      issues.push(...cognitiveResult.issues);
      sections.push(...cognitiveResult.sections);

      emitSSE('framework_result', {
        chapterNumber,
        framework: 'cognitive',
        bloomsDistribution: bloomsDist,
        score: cognitiveResult.cognitiveScore,
        issueCount: cognitiveResult.issues.length,
      });
      cognitiveSource = 'ai';
    } catch (error) {
      logger.warn('[ChapterAnalyzer] Cognitive analysis failed, using rule-based fallback', {
        chapterNumber, error: error instanceof Error ? error.message : error,
      });
      cognitiveSource = 'rule-based';

      // Use @sam-ai/pedagogy rule-based Bloom's analysis (more accurate than keyword counting)
      const allContent = chapterContent.sections.map(s => s.content).join('\n\n');
      const allObjectives = chapterContent.sections.flatMap(s => s.learningObjectives);
      const ruleResult = await evaluateBloomsRuleBased(allContent, allObjectives);
      bloomsDist = ruleResult.distribution;
      frameworkScores.blooms = ruleResult.alignmentScore;

      // Populate section results from content data (so downstream has section-level info)
      for (const sec of chapterContent.sections) {
        sections.push({
          sectionId: sec.id,
          sectionTitle: sec.title,
          sectionPosition: sec.position,
          bloomsLevel: ruleResult.dominantLevel,
          gagneEvents: [],
          contentWordCount: sec.wordCount,
          estimatedTimeMinutes: Math.max(1, Math.round(sec.wordCount / 200)),
          issues: [],
          frameworkScores: { blooms: ruleResult.alignmentScore },
        });
      }

      issues.push({
        fingerprint: generateIssueFingerprint('DEPTH', chapterId, 'cognitive-fallback'),
        chapterId, chapterTitle, chapterPosition: chapterContent.position,
        type: 'DEPTH', severity: 'INFO', framework: 'system',
        title: 'AI cognitive analysis unavailable',
        description: 'AI-powered cognitive depth analysis was unavailable for this chapter. Results are based on automated verb analysis and may be less accurate. Consider re-running the analysis.',
      });
    }
  }

  // Stage 3: Pedagogical Quality (AI-powered) - runs in standard+ modes
  let pedagogicalScore = 0;
  if (['standard', 'deep', 'comprehensive'].includes(mode)) {
    emitSSE('stage_start', { stage: 3, name: 'Pedagogical Quality', chapterNumber });
    try {
      const pedagogicalResult = await runPedagogicalAnalysis(context);
      gagneCompliance = pedagogicalResult.gagneEvents;
      constructiveAlignmentScore = pedagogicalResult.alignmentScore;
      pedagogicalScore = pedagogicalResult.score;
      frameworkScores.gagne = pedagogicalResult.gagneScore;
      issues.push(...pedagogicalResult.issues);

      emitSSE('framework_result', {
        chapterNumber,
        framework: 'pedagogical',
        gagneEvents: gagneCompliance,
        alignmentScore: constructiveAlignmentScore,
        score: pedagogicalScore,
      });
      pedagogicalSource = 'ai';
    } catch (error) {
      logger.warn('[ChapterAnalyzer] Pedagogical analysis failed', { chapterNumber, error: error instanceof Error ? error.message : error });
      pedagogicalSource = 'failed';

      issues.push({
        fingerprint: generateIssueFingerprint('PEDAGOGICAL', chapterId, 'pedagogical-failed'),
        chapterId, chapterTitle, chapterPosition: chapterContent.position,
        type: 'PEDAGOGICAL', severity: 'INFO', framework: 'system',
        title: 'Pedagogical analysis unavailable',
        description: 'AI-powered pedagogical quality analysis (Gagne events, constructive alignment) could not be completed for this chapter.',
      });
    }
  }

  // Stage 4: Content Flow (AI-powered) - runs in deep+ modes
  let flowScore = 0;
  if (['deep', 'comprehensive'].includes(mode)) {
    emitSSE('stage_start', { stage: 4, name: 'Content Flow Analysis', chapterNumber });
    try {
      const flowResult = await runFlowAnalysis(context);
      flowScore = flowResult.score;
      issues.push(...flowResult.issues);

      emitSSE('framework_result', {
        chapterNumber,
        framework: 'flow',
        score: flowScore,
        prerequisites: flowResult.prerequisites,
      });
      flowSource = 'ai';
    } catch (error) {
      logger.warn('[ChapterAnalyzer] Flow analysis failed', { chapterNumber, error: error instanceof Error ? error.message : error });
      flowSource = 'failed';

      issues.push({
        fingerprint: generateIssueFingerprint('FLOW', chapterId, 'flow-failed'),
        chapterId, chapterTitle, chapterPosition: chapterContent.position,
        type: 'FLOW', severity: 'INFO', framework: 'system',
        title: 'Content flow analysis unavailable',
        description: 'AI-powered content flow and prerequisite analysis could not be completed for this chapter.',
      });
    }
  }

  // Stage 5: Assessment + Accessibility - runs in deep+ modes
  let assessmentScore = 0;
  if (['deep', 'comprehensive'].includes(mode)) {
    emitSSE('stage_start', { stage: 5, name: 'Assessment & Accessibility', chapterNumber });
    const accessResult = runAccessibilityAnalysis(context);
    assessmentScore = accessResult.score;
    issues.push(...accessResult.issues);

    emitSSE('framework_result', {
      chapterNumber,
      framework: 'assessment',
      score: assessmentScore,
      readabilityScore: accessResult.readabilityScore,
    });
  }

  // Complete SubGoal
  await completeChapterSubGoal(subGoalId);

  // Fire-and-forget: persist quality patterns
  const dataSource: StageDataSource = {
    structural: 'rule-based',
    cognitive: cognitiveSource,
    pedagogical: pedagogicalSource,
    flow: flowSource,
    assessment: 'rule-based',
    confidence: cognitiveSource === 'ai' ? 0.85 : 0.5,
  };

  const result = buildResult(
    context, sections, issues, bloomsDist, frameworkScores,
    gagneCompliance, constructiveAlignmentScore,
    structuralScore,
    frameworkScores.blooms ?? computeBloomsScore(bloomsDist),
    pedagogicalScore, flowScore, assessmentScore,
    dataSource
  );

  persistQualityPatternsBackground(
    context.userId, context.courseId, result, 'General'
  );

  return result;
}

// =============================================================================
// STAGE 1: STRUCTURAL ANALYSIS (rule-based)
// =============================================================================

function runStructuralAnalysis(context: AnalysisStepContext): {
  score: number;
  issues: AnalysisIssue[];
} {
  const { chapterContent, chapterId, chapterTitle } = context;
  const issues: AnalysisIssue[] = [];
  let score = 100;

  // Check section count
  if (chapterContent.sections.length === 0) {
    issues.push({
      fingerprint: generateIssueFingerprint('STRUCTURE', chapterId, 'no-sections'),
      chapterId, chapterTitle, chapterPosition: chapterContent.position,
      type: 'STRUCTURE', severity: 'CRITICAL', framework: 'structural',
      title: 'Chapter has no sections',
      description: `Chapter "${chapterTitle}" contains no sections.`,
      fix: { action: 'Add sections', what: 'Create at least 3 sections', why: 'Chapters need sections for structured learning', how: 'Add sections covering key topics' },
    });
    score -= 40;
  } else if (chapterContent.sections.length < 3) {
    issues.push({
      fingerprint: generateIssueFingerprint('STRUCTURE', chapterId, 'few-sections'),
      chapterId, chapterTitle, chapterPosition: chapterContent.position,
      type: 'STRUCTURE', severity: 'MODERATE', framework: 'structural',
      title: 'Too few sections',
      description: `Chapter has ${chapterContent.sections.length} section(s). Recommended minimum: 3.`,
    });
    score -= 15;
  }

  // Check for empty/thin sections
  for (const section of chapterContent.sections) {
    if (section.wordCount < 50) {
      issues.push({
        fingerprint: generateIssueFingerprint('CONTENT', chapterId, section.id, 'thin'),
        chapterId, chapterTitle, chapterPosition: chapterContent.position,
        sectionId: section.id, sectionTitle: section.title, sectionPosition: section.position,
        type: 'CONTENT', severity: section.wordCount < 10 ? 'CRITICAL' : 'MODERATE', framework: 'structural',
        title: `Thin section: "${section.title}"`,
        description: `Section has only ${section.wordCount} words. Minimum recommended: 200 words.`,
      });
      score -= 10;
    }

    // Check for missing learning objectives
    if (section.learningObjectives.length === 0) {
      issues.push({
        fingerprint: generateIssueFingerprint('OBJECTIVE', chapterId, section.id, 'no-objectives'),
        chapterId, chapterTitle, chapterPosition: chapterContent.position,
        sectionId: section.id, sectionTitle: section.title, sectionPosition: section.position,
        type: 'OBJECTIVE', severity: 'MINOR', framework: 'structural',
        title: `No learning objectives for "${section.title}"`,
        description: 'Section lacks explicit learning objectives.',
      });
      score -= 5;
    }
  }

  return { score: Math.max(0, Math.min(100, score)), issues };
}

// =============================================================================
// STAGE 2: COGNITIVE DEPTH ANALYSIS (AI-powered)
// =============================================================================

async function runCognitiveAnalysis(context: AnalysisStepContext): Promise<{
  bloomsDistribution: BloomsDistribution;
  frameworkScores: FrameworkScores;
  cognitiveScore: number;
  sections: SectionAnalysisResult[];
  issues: AnalysisIssue[];
}> {
  const { userId, chapterContent, chapterId, chapterTitle, frameworks } = context;

  const sectionSummaries = chapterContent.sections.map(s =>
    `Section ${s.position}: "${s.title}" (${s.wordCount} words)\nObjectives: ${s.learningObjectives.join(', ') || 'None'}\nContent preview: ${s.content.slice(0, 500)}`
  ).join('\n\n');

  const prompt = buildCognitiveDepthPrompt(chapterTitle, sectionSummaries, frameworks);

  const response = await withRetryableTimeout(
    () => runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 3000,
      temperature: 0.3,
    }),
    TIMEOUT_DEFAULTS.AI_ANALYSIS,
    'cognitive-depth-analysis'
  );

  // Parse AI response
  try {
    const parsed = parseJSONResponse(response);

    if (!parsed.bloomsDistribution || typeof parsed.bloomsDistribution !== 'object') {
      throw new Error('AI response missing bloomsDistribution field');
    }
    const bloomsDist = parsed.bloomsDistribution as BloomsDistribution;

    const issues: AnalysisIssue[] = [];
    const sections: SectionAnalysisResult[] = [];

    // Generate issues from Bloom's analysis
    if ((bloomsDist.EVALUATE ?? 0) + (bloomsDist.CREATE ?? 0) < 15) {
      issues.push({
        fingerprint: generateIssueFingerprint('DEPTH', chapterId, 'low-higher-order'),
        chapterId, chapterTitle, chapterPosition: chapterContent.position,
        type: 'DEPTH', severity: 'MODERATE', framework: 'blooms',
        title: 'Low higher-order thinking content',
        description: `Only ${(bloomsDist.EVALUATE ?? 0) + (bloomsDist.CREATE ?? 0)}% of content targets Evaluate/Create levels. Recommended: at least 20%.`,
        fix: {
          action: 'Add higher-order activities',
          what: 'Include evaluation and creation tasks',
          why: 'Higher-order thinking promotes deeper learning and transfer',
          how: 'Add case studies, design projects, or critical analysis exercises',
        },
      });
    }

    if ((bloomsDist.REMEMBER ?? 0) > 40) {
      issues.push({
        fingerprint: generateIssueFingerprint('DEPTH', chapterId, 'heavy-remember'),
        chapterId, chapterTitle, chapterPosition: chapterContent.position,
        type: 'DEPTH', severity: 'MODERATE', framework: 'blooms',
        title: 'Over-emphasis on recall/memorization',
        description: `${bloomsDist.REMEMBER}% of content is at Remember level. This is too high for meaningful learning.`,
      });
    }

    // Parse per-section results if provided
    if (parsed.sections && Array.isArray(parsed.sections)) {
      for (const secData of parsed.sections) {
        sections.push({
          sectionId: secData.sectionId ?? '',
          sectionTitle: secData.sectionTitle ?? '',
          sectionPosition: secData.position ?? 0,
          bloomsLevel: secData.bloomsLevel ?? 'UNDERSTAND',
          dokLevel: secData.dokLevel,
          gagneEvents: [],
          contentWordCount: secData.wordCount ?? 0,
          estimatedTimeMinutes: secData.estimatedMinutes ?? 10,
          issues: [],
          frameworkScores: secData.frameworkScores ?? {},
        });
      }
    }

    const cognitiveScore = computeBloomsScore(bloomsDist);

    return {
      bloomsDistribution: bloomsDist,
      frameworkScores: {
        blooms: cognitiveScore,
        dok: parsed.dokScore,
        solo: parsed.soloScore,
        fink: parsed.finkScore,
        marzano: parsed.marzanoScore,
      },
      cognitiveScore,
      sections,
      issues,
    };
  } catch (parseError) {
    logger.warn('[ChapterAnalyzer] Failed to parse cognitive analysis response, falling back to rule-based', { parseError });
    throw parseError;
  }
}

// =============================================================================
// STAGE 3: PEDAGOGICAL QUALITY (AI-powered)
// =============================================================================

async function runPedagogicalAnalysis(context: AnalysisStepContext): Promise<{
  gagneEvents: GagneEventCheck[];
  alignmentScore: number;
  gagneScore: number;
  score: number;
  issues: AnalysisIssue[];
}> {
  const { userId, chapterContent, chapterId, chapterTitle } = context;

  const sectionSummaries = chapterContent.sections.map(s =>
    `"${s.title}": ${s.content.slice(0, 300)} | Objectives: ${s.learningObjectives.join(', ') || 'None'}`
  ).join('\n');

  const prompt = buildPedagogicalPrompt(chapterTitle, sectionSummaries);

  const response = await withRetryableTimeout(
    () => runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2500,
      temperature: 0.3,
    }),
    TIMEOUT_DEFAULTS.AI_ANALYSIS,
    'pedagogical-analysis'
  );

  try {
    const parsed = parseJSONResponse(response);

    const gagneEvents: GagneEventCheck[] = (parsed.gagneEvents ?? []).map((e: Record<string, unknown>) => ({
      event: e.event as string ?? '',
      present: e.present as boolean ?? false,
      quality: (e.quality as string ?? 'missing') as 'strong' | 'weak' | 'missing',
      evidence: e.evidence as string,
    }));

    const issues: AnalysisIssue[] = [];

    // Generate issues from missing Gagne events
    const missingEvents = gagneEvents.filter(e => !e.present || e.quality === 'missing');
    for (const event of missingEvents) {
      issues.push({
        fingerprint: generateIssueFingerprint('PEDAGOGICAL', chapterId, 'gagne', event.event),
        chapterId, chapterTitle, chapterPosition: chapterContent.position,
        type: 'PEDAGOGICAL', severity: 'MINOR', framework: 'gagne',
        title: `Missing Gagne event: ${event.event}`,
        description: `The instructional design event "${event.event}" is not present in this chapter.`,
      });
    }

    const alignmentScore = parsed.constructiveAlignmentScore ?? 70;
    if (alignmentScore < 60) {
      issues.push({
        fingerprint: generateIssueFingerprint('ASSESSMENT', chapterId, 'low-alignment'),
        chapterId, chapterTitle, chapterPosition: chapterContent.position,
        type: 'ASSESSMENT', severity: 'MODERATE', framework: 'constructive-alignment',
        title: 'Weak constructive alignment',
        description: `Objectives, content, and assessments are not well-aligned (score: ${alignmentScore}/100).`,
      });
    }

    const gagneScore = gagneEvents.length > 0
      ? Math.round((gagneEvents.filter(e => e.present && e.quality !== 'missing').length / gagneEvents.length) * 100)
      : 50;

    return {
      gagneEvents,
      alignmentScore,
      gagneScore,
      score: Math.round((gagneScore * 0.5 + alignmentScore * 0.5)),
      issues,
    };
  } catch (parseError) {
    logger.warn('[ChapterAnalyzer] Failed to parse pedagogical analysis response', { parseError });
    throw parseError;
  }
}

// =============================================================================
// STAGE 4: CONTENT FLOW (AI-powered)
// =============================================================================

async function runFlowAnalysis(context: AnalysisStepContext): Promise<{
  score: number;
  prerequisites: { concept: string; status: string }[];
  issues: AnalysisIssue[];
}> {
  const { userId, chapterContent, chapterId, chapterTitle, priorChapterResults } = context;

  const priorSummary = priorChapterResults.map(c =>
    `Chapter ${c.chapterNumber}: "${c.chapterTitle}" - Key concepts covered`
  ).join('\n');

  const currentContent = chapterContent.sections.map(s =>
    `"${s.title}": ${s.content.slice(0, 200)}`
  ).join('\n');

  const prompt = buildFlowAnalysisPrompt(chapterTitle, currentContent, priorSummary);

  const response = await withRetryableTimeout(
    () => runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2000,
      temperature: 0.3,
    }),
    TIMEOUT_DEFAULTS.AI_ANALYSIS,
    'flow-analysis'
  );

  try {
    const parsed = parseJSONResponse(response);
    const issues: AnalysisIssue[] = [];

    const prerequisites = (parsed.prerequisites ?? []) as { concept: string; status: string }[];
    const missingPrereqs = prerequisites.filter(p => p.status === 'MISSING');

    for (const prereq of missingPrereqs) {
      issues.push({
        fingerprint: generateIssueFingerprint('PREREQUISITE', chapterId, prereq.concept),
        chapterId, chapterTitle, chapterPosition: chapterContent.position,
        type: 'PREREQUISITE', severity: 'MODERATE', framework: 'flow',
        title: `Missing prerequisite: ${prereq.concept}`,
        description: `Concept "${prereq.concept}" is used but not introduced in prior chapters.`,
      });
    }

    return {
      score: parsed.flowScore ?? 70,
      prerequisites,
      issues,
    };
  } catch (parseError) {
    logger.warn('[ChapterAnalyzer] Failed to parse flow analysis response', { parseError });
    throw parseError;
  }
}

// =============================================================================
// STAGE 5: ACCESSIBILITY (rule-based)
// =============================================================================

function runAccessibilityAnalysis(context: AnalysisStepContext): {
  score: number;
  readabilityScore: number;
  issues: AnalysisIssue[];
} {
  const { chapterContent, chapterId, chapterTitle } = context;
  const issues: AnalysisIssue[] = [];
  let score = 100;

  for (const section of chapterContent.sections) {
    // Simple readability: average sentence length
    const sentences = section.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0
      ? section.content.split(/\s+/).length / sentences.length
      : 0;

    if (avgSentenceLength > 25) {
      issues.push({
        fingerprint: generateIssueFingerprint('READABILITY', chapterId, section.id, 'long-sentences'),
        chapterId, chapterTitle, chapterPosition: chapterContent.position,
        sectionId: section.id, sectionTitle: section.title, sectionPosition: section.position,
        type: 'READABILITY', severity: 'MINOR', framework: 'accessibility',
        title: `Complex sentences in "${section.title}"`,
        description: `Average sentence length is ${Math.round(avgSentenceLength)} words. Recommended: under 20 words.`,
      });
      score -= 5;
    }

    // Check for very long paragraphs (walls of text)
    const paragraphs = section.content.split(/\n\n+/).filter(p => p.trim().length > 0);
    const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 150);
    if (longParagraphs.length > 0) {
      issues.push({
        fingerprint: generateIssueFingerprint('READABILITY', chapterId, section.id, 'long-paragraphs'),
        chapterId, chapterTitle, chapterPosition: chapterContent.position,
        sectionId: section.id, sectionTitle: section.title, sectionPosition: section.position,
        type: 'READABILITY', severity: 'MINOR', framework: 'accessibility',
        title: `Wall of text in "${section.title}"`,
        description: `${longParagraphs.length} paragraph(s) exceed 150 words. Break into smaller chunks.`,
      });
      score -= 3;
    }
  }

  // Compute rough Flesch-Kincaid approximation
  const allContent = chapterContent.sections.map(s => s.content).join(' ');
  const words = allContent.split(/\s+/).length;
  const sentences = allContent.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const readabilityScore = sentences > 0 ? Math.min(100, Math.max(0, 100 - (words / Math.max(sentences, 1) - 15) * 5)) : 50;

  return { score: Math.max(0, Math.min(100, score)), readabilityScore, issues };
}

// =============================================================================
// FALLBACK CLASSIFIERS
// =============================================================================

function runFallbackBloomsClassification(context: AnalysisStepContext): {
  bloomsDistribution: BloomsDistribution;
  score: number;
} {
  const allContent = context.chapterContent.sections.map(s => s.content.toLowerCase()).join(' ');

  const verbMap: Record<BloomsLevel, string[]> = {
    REMEMBER: ['define', 'list', 'recall', 'identify', 'name', 'state', 'recognize'],
    UNDERSTAND: ['explain', 'describe', 'summarize', 'interpret', 'classify', 'discuss'],
    APPLY: ['apply', 'demonstrate', 'implement', 'solve', 'use', 'execute', 'practice'],
    ANALYZE: ['analyze', 'compare', 'contrast', 'examine', 'differentiate', 'organize'],
    EVALUATE: ['evaluate', 'assess', 'judge', 'critique', 'justify', 'argue', 'defend'],
    CREATE: ['create', 'design', 'develop', 'construct', 'produce', 'build', 'compose'],
  };

  const counts: Record<BloomsLevel, number> = {
    REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0,
  };

  for (const [level, verbs] of Object.entries(verbMap) as [BloomsLevel, string[]][]) {
    for (const verb of verbs) {
      const regex = new RegExp(`\\b${verb}\\w*\\b`, 'gi');
      const matches = allContent.match(regex);
      counts[level] += matches?.length ?? 0;
    }
  }

  const total = Object.values(counts).reduce((sum, c) => sum + c, 0) || 1;
  const distribution: BloomsDistribution = {
    REMEMBER: Math.round((counts.REMEMBER / total) * 100),
    UNDERSTAND: Math.round((counts.UNDERSTAND / total) * 100),
    APPLY: Math.round((counts.APPLY / total) * 100),
    ANALYZE: Math.round((counts.ANALYZE / total) * 100),
    EVALUATE: Math.round((counts.EVALUATE / total) * 100),
    CREATE: Math.round((counts.CREATE / total) * 100),
  };

  return { bloomsDistribution: distribution, score: computeBloomsScore(distribution) };
}

function runFallbackCognitive(context: AnalysisStepContext): {
  bloomsDistribution: BloomsDistribution;
  frameworkScores: FrameworkScores;
  cognitiveScore: number;
  sections: SectionAnalysisResult[];
  issues: AnalysisIssue[];
} {
  const fallback = runFallbackBloomsClassification(context);
  return {
    bloomsDistribution: fallback.bloomsDistribution,
    frameworkScores: { blooms: fallback.score },
    cognitiveScore: fallback.score,
    sections: [],
    issues: [],
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function computeBloomsScore(dist: BloomsDistribution): number {
  let score = 0;
  for (const [level, weight] of Object.entries(BLOOMS_DEPTH_WEIGHTS)) {
    score += (dist[level as BloomsLevel] ?? 0) * weight;
  }
  return Math.min(100, Math.round(score));
}

function parseJSONResponse(response: string): Record<string, unknown> {
  // Try to extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Try with relaxed parsing
    }
  }

  // Try the whole response
  try {
    return JSON.parse(response);
  } catch {
    logger.warn('[ChapterAnalyzer] Could not parse JSON from AI response');
    return {};
  }
}

function buildResult(
  context: AnalysisStepContext,
  sections: SectionAnalysisResult[],
  issues: AnalysisIssue[],
  bloomsDist: BloomsDistribution,
  frameworkScores: FrameworkScores,
  gagneCompliance: GagneEventCheck[],
  constructiveAlignmentScore: number,
  structuralScore: number,
  cognitiveScore: number,
  pedagogicalScore: number,
  flowScore: number,
  assessmentScore: number,
  stageDataSource?: StageDataSource
): ChapterAnalysisResult {
  const overallScore = Math.round(
    structuralScore * 0.10 +
    cognitiveScore * 0.30 +
    pedagogicalScore * 0.20 +
    flowScore * 0.25 +
    assessmentScore * 0.15
  );

  // Analysis quality reflects how much was AI-analyzed vs fallback
  const aiStages = stageDataSource
    ? [stageDataSource.cognitive, stageDataSource.pedagogical, stageDataSource.flow].filter(s => s === 'ai').length
    : 0;
  const analysisQuality = stageDataSource
    ? Math.round(40 + (aiStages / 3) * 50 + (issues.length > 0 ? 10 : 0))
    : (issues.length > 0 ? 80 : 60);

  return {
    chapterNumber: context.chapterNumber,
    chapterId: context.chapterId,
    chapterTitle: context.chapterTitle,
    bloomsDistribution: bloomsDist,
    frameworkScores,
    gagneCompliance,
    constructiveAlignmentScore,
    prerequisites: [],
    sections,
    issues,
    overallScore,
    structuralScore,
    cognitiveScore,
    pedagogicalScore,
    flowScore,
    assessmentScore,
    contentHash: context.chapterContent.contentHash,
    analysisQuality,
    needsHealing: stageDataSource ? stageDataSource.cognitive !== 'ai' : false,
    dataSource: stageDataSource,
  };
}
