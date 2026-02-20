/**
 * Section Description Structure Validator
 *
 * Shared structural checks for Stage 3 section descriptions.
 * Enforces content-type-aware pedagogical anatomy:
 * - reading/video: 6-heading lesson structure
 * - assignment: task-oriented structure
 * - quiz: assessment-oriented structure
 * - project: brief-oriented structure
 * - discussion: dialogue-oriented structure
 */

import type { ContentType } from './types';

/** Standard 6-heading lesson structure for reading/video sections. */
export const READING_VIDEO_HEADINGS = [
  'Why It Was Developed',
  'Core Intuition',
  'Equation Intuition',
  'Step-by-Step Visualization',
  'Concrete Example',
  'Common Confusion + Fix',
] as const;

/** Task-oriented structure for assignment sections. */
export const ASSIGNMENT_HEADINGS = [
  'Problem Context',
  'Task Description',
  'Guided Steps',
  'Expected Outcome',
  'Common Mistakes',
  'Extension Challenge',
] as const;

/** Assessment-oriented structure for quiz sections. */
export const QUIZ_HEADINGS = [
  'Knowledge Areas Tested',
  'Question Types',
  'Difficulty Distribution',
  'Study Guide',
  'Self-Assessment Reflection',
] as const;

/** Brief-oriented structure for project sections. */
export const PROJECT_HEADINGS = [
  'Project Brief',
  'Requirements',
  'Resources',
  'Deliverables',
  'Evaluation Criteria',
  'Stretch Goals',
] as const;

/** Dialogue-oriented structure for discussion sections. */
export const DISCUSSION_HEADINGS = [
  'Discussion Context',
  'Guiding Questions',
  'Evidence Requirements',
  'Peer Engagement Rules',
  'Synthesis Prompt',
] as const;

/**
 * Legacy alias — kept for backward compatibility with imports that reference the
 * original constant name. Points to the reading/video heading set.
 */
export const REQUIRED_SECTION_DESCRIPTION_HEADINGS = READING_VIDEO_HEADINGS;

export const MIN_WORDS_PER_SECTION_DESCRIPTION_BLOCK = 50;

/**
 * Returns the required headings for a given content type.
 * Falls back to the standard reading/video headings when content type is unknown.
 */
export function getHeadingsForContentType(contentType?: ContentType | string): readonly string[] {
  switch (contentType) {
    case 'assignment':
      return ASSIGNMENT_HEADINGS;
    case 'quiz':
      return QUIZ_HEADINGS;
    case 'project':
      return PROJECT_HEADINGS;
    case 'discussion':
      return DISCUSSION_HEADINGS;
    case 'reading':
    case 'video':
    default:
      return READING_VIDEO_HEADINGS;
  }
}

interface ParsedSectionBlock {
  heading: string;
  normalizedHeading: string;
  htmlBody: string;
  plainText: string;
  wordCount: number;
}

export interface SectionDescriptionStructureAnalysis {
  isValid: boolean;
  headingsInOrder: string[];
  missingHeadings: string[];
  unexpectedHeadings: string[];
  issues: string[];
  sectionWordCounts: Record<string, number>;
  contentType?: ContentType | string;
  semanticChecks: {
    hasMotivationProblem: boolean;
    hasCoreMentalModel: boolean;
    hasEquationIntuitionCompliance: boolean;
    hasStepwiseVisualization: boolean;
    hasConcreteExample: boolean;
    hasMisconceptionAndFix: boolean;
  };
}

function normalizeHeading(value: string): string {
  return value
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9+\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, '\'')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(value: string): number {
  if (!value) return 0;
  return value.split(/\s+/).filter(Boolean).length;
}

function parseSectionBlocks(html: string): ParsedSectionBlock[] {
  const headingRegex = /<h2>\s*([^<]+?)\s*<\/h2>/gi;
  const matches = Array.from(html.matchAll(headingRegex));
  if (matches.length === 0) return [];

  const blocks: ParsedSectionBlock[] = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const heading = (match[1] ?? '').trim();
    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd = i < matches.length - 1
      ? (matches[i + 1].index ?? html.length)
      : html.length;
    const htmlBody = html.slice(bodyStart, bodyEnd).trim();
    const plainText = stripHtml(htmlBody);
    blocks.push({
      heading,
      normalizedHeading: normalizeHeading(heading),
      htmlBody,
      plainText,
      wordCount: countWords(plainText),
    });
  }

  return blocks;
}

/**
 * Runs semantic checks specific to reading/video content (the original 6-heading structure).
 */
function runReadingVideoSemanticChecks(
  blockByHeading: Map<string, ParsedSectionBlock>,
  issues: string[],
): SectionDescriptionStructureAnalysis['semanticChecks'] {
  const whyBlock = blockByHeading.get(normalizeHeading('Why It Was Developed'));
  const coreBlock = blockByHeading.get(normalizeHeading('Core Intuition'));
  const equationBlock = blockByHeading.get(normalizeHeading('Equation Intuition'));
  const stepBlock = blockByHeading.get(normalizeHeading('Step-by-Step Visualization'));
  const exampleBlock = blockByHeading.get(normalizeHeading('Concrete Example'));
  const confusionBlock = blockByHeading.get(normalizeHeading('Common Confusion + Fix'));

  const hasMotivationProblem = !!whyBlock
    && /(problem|limitation|challenge|pain|bottleneck|motivat|developed|before this)/i.test(whyBlock.plainText);
  const hasCoreMentalModel = !!coreBlock
    && /(mental model|think of|imagine|picture|intuition|analogy)/i.test(coreBlock.plainText);
  const hasStepwiseVisualization = !!stepBlock
    && /(step\s*\d+|first|second|third|next|then|finally|visualize|picture)/i.test(stepBlock.plainText);
  const hasConcreteExample = !!exampleBlock
    && /(\d|for example|consider|scenario|suppose|mini case|worked example)/i.test(exampleBlock.plainText);
  const hasMisconceptionAndFix = !!confusionBlock
    && /(confusion|misconception|common mistake|often think|trap)/i.test(confusionBlock.plainText)
    && /(fix|avoid|instead|correct|how to prevent|remember)/i.test(confusionBlock.plainText);

  if (whyBlock && !hasMotivationProblem) {
    issues.push('"Why It Was Developed" must describe the motivating problem or limitation.');
  }
  if (coreBlock && !hasCoreMentalModel) {
    issues.push('"Core Intuition" must include a beginner-friendly mental model or analogy.');
  }
  if (stepBlock && !hasStepwiseVisualization) {
    issues.push('"Step-by-Step Visualization" must describe a sequential mental walkthrough.');
  }
  if (exampleBlock && !hasConcreteExample) {
    issues.push('"Concrete Example" must include a worked mini-scenario with concrete details.');
  }
  if (confusionBlock && !hasMisconceptionAndFix) {
    issues.push('"Common Confusion + Fix" must include both a misconception and a clear correction.');
  }

  let hasEquationIntuitionCompliance = false;
  if (equationBlock) {
    const equationText = equationBlock.plainText;
    const hasEquationNotation = /(\$[^$]+\$|\$\$[\s\S]+?\$\$|\\frac|\\sum|\\int|\\lim|\\sqrt|=)/.test(
      equationBlock.htmlBody,
    );
    const hasNoMathRationale = /(no equation|equation is not required|without an equation|does not require an equation|non[- ]mathematical)/i
      .test(equationText);
    const hasTermMeaning = /(term|coefficient|numerator|denominator|variable|parameter|represents|means|controls|contributes|each part)/i
      .test(equationText);
    const hasShapeReason = /(shape|form|structure|arranged|why.*equation|because|balances|trade-?off|constructed)/i
      .test(equationText);

    if (hasEquationNotation) {
      hasEquationIntuitionCompliance = hasTermMeaning && hasShapeReason;
      if (!hasTermMeaning) {
        issues.push('"Equation Intuition" must explain what each equation term means.');
      }
      if (!hasShapeReason) {
        issues.push('"Equation Intuition" must explain why the equation has its structure.');
      }
    } else if (hasNoMathRationale) {
      hasEquationIntuitionCompliance = true;
    } else {
      issues.push(
        '"Equation Intuition" must either explain equation terms/shape or explicitly state why no equation is needed.',
      );
    }
  }

  return {
    hasMotivationProblem,
    hasCoreMentalModel,
    hasEquationIntuitionCompliance,
    hasStepwiseVisualization,
    hasConcreteExample,
    hasMisconceptionAndFix,
  };
}

/**
 * Runs lightweight semantic checks for non-reading/video content types.
 * These types have different heading structures, so the reading-specific
 * semantic checks are marked as passing by default.
 */
function runAlternativeSemanticChecks(
  blockByHeading: Map<string, ParsedSectionBlock>,
  contentType: string,
  issues: string[],
): SectionDescriptionStructureAnalysis['semanticChecks'] {
  // For non-reading content types, reading-specific semantic checks pass by default
  // since the headings are entirely different
  const checks: SectionDescriptionStructureAnalysis['semanticChecks'] = {
    hasMotivationProblem: true,
    hasCoreMentalModel: true,
    hasEquationIntuitionCompliance: true,
    hasStepwiseVisualization: true,
    hasConcreteExample: true,
    hasMisconceptionAndFix: true,
  };

  // Content-type-specific validations
  if (contentType === 'assignment') {
    const taskBlock = blockByHeading.get(normalizeHeading('Task Description'));
    if (taskBlock && taskBlock.wordCount < 30) {
      issues.push('"Task Description" must provide clear, actionable instructions (at least 30 words).');
    }
  } else if (contentType === 'quiz') {
    const areasBlock = blockByHeading.get(normalizeHeading('Knowledge Areas Tested'));
    if (areasBlock && !/\d/.test(areasBlock.plainText)) {
      issues.push('"Knowledge Areas Tested" should reference specific concepts or skills.');
    }
  } else if (contentType === 'project') {
    const briefBlock = blockByHeading.get(normalizeHeading('Project Brief'));
    if (briefBlock && briefBlock.wordCount < 30) {
      issues.push('"Project Brief" must provide a clear project description (at least 30 words).');
    }
  } else if (contentType === 'discussion') {
    const questionsBlock = blockByHeading.get(normalizeHeading('Guiding Questions'));
    if (questionsBlock && !/\?/.test(questionsBlock.plainText)) {
      issues.push('"Guiding Questions" must contain actual questions.');
    }
  }

  return checks;
}

/**
 * Analyzes a section description against the required heading structure.
 *
 * @param html - The HTML description to analyze
 * @param contentType - Optional content type to use content-type-specific headings.
 *   When omitted, defaults to reading/video (the original 6-heading structure)
 *   for backward compatibility.
 */
export function analyzeSectionDescriptionStructure(
  html: string,
  contentType?: ContentType | string,
): SectionDescriptionStructureAnalysis {
  const requiredHeadings = getHeadingsForContentType(contentType);
  const expected = requiredHeadings.map(normalizeHeading);
  const blocks = parseSectionBlocks(html);
  const actual = blocks.map((block) => block.normalizedHeading);
  const issues: string[] = [];

  const missingHeadings = [...requiredHeadings].filter((heading) => {
    return !actual.includes(normalizeHeading(heading));
  });
  const unexpectedHeadings = blocks
    .map((block) => block.heading)
    .filter((heading) => !expected.includes(normalizeHeading(heading)));

  if (blocks.length !== requiredHeadings.length) {
    issues.push(
      `Description must contain exactly ${requiredHeadings.length} <h2> sections; found ${blocks.length}.`,
    );
  }

  if (missingHeadings.length > 0) {
    issues.push(`Missing required headings: ${missingHeadings.join(', ')}`);
  }
  if (unexpectedHeadings.length > 0) {
    issues.push(`Unexpected headings: ${unexpectedHeadings.join(', ')}`);
  }

  if (actual.length === expected.length) {
    const orderMismatch = expected.some((heading, i) => actual[i] !== heading);
    if (orderMismatch) {
      issues.push(
        `Heading order must be exactly: ${[...requiredHeadings].join(' -> ')}`,
      );
    }
  }

  const blockByHeading = new Map<string, ParsedSectionBlock>();
  for (const block of blocks) {
    blockByHeading.set(block.normalizedHeading, block);
  }

  const sectionWordCounts: Record<string, number> = {};
  for (const heading of requiredHeadings) {
    const normalized = normalizeHeading(heading);
    const block = blockByHeading.get(normalized);
    if (!block) continue;
    sectionWordCounts[heading] = block.wordCount;
    if (block.wordCount < MIN_WORDS_PER_SECTION_DESCRIPTION_BLOCK) {
      issues.push(
        `"${heading}" must have at least ${MIN_WORDS_PER_SECTION_DESCRIPTION_BLOCK} words; found ${block.wordCount}.`,
      );
    }
  }

  // Run semantic checks based on content type
  const isReadingOrVideo = !contentType || contentType === 'reading' || contentType === 'video';
  const semanticChecks = isReadingOrVideo
    ? runReadingVideoSemanticChecks(blockByHeading, issues)
    : runAlternativeSemanticChecks(blockByHeading, contentType, issues);

  return {
    isValid: issues.length === 0,
    headingsInOrder: blocks.map((block) => block.heading),
    missingHeadings,
    unexpectedHeadings,
    issues,
    sectionWordCounts,
    contentType,
    semanticChecks,
  };
}

/**
 * Converts a structure analysis into a 0–100 quality score instead of binary pass/fail.
 * Higher score = better structural adherence. Used by scoreDetails() as a quality penalty.
 */
export function scoreSectionDescriptionStructure(analysis: SectionDescriptionStructureAnalysis): number {
  let score = 100;

  const requiredHeadings = getHeadingsForContentType(analysis.contentType);

  // Missing headings: proportional penalty (total 72 max for 6 headings)
  const perHeadingPenalty = Math.round(72 / requiredHeadings.length);
  score -= analysis.missingHeadings.length * perHeadingPenalty;

  // Unexpected headings: -5 each
  score -= analysis.unexpectedHeadings.length * 5;

  // Word count violations: proportional penalty per section
  for (const heading of requiredHeadings) {
    const wc = analysis.sectionWordCounts[heading] ?? 0;
    if (wc > 0 && wc < MIN_WORDS_PER_SECTION_DESCRIPTION_BLOCK) {
      score -= Math.round((1 - wc / MIN_WORDS_PER_SECTION_DESCRIPTION_BLOCK) * 10);
    }
  }

  // Semantic checks: penalty for each missing quality signal
  const sc = analysis.semanticChecks;
  if (!sc.hasMotivationProblem) score -= 5;
  if (!sc.hasCoreMentalModel) score -= 5;
  if (!sc.hasEquationIntuitionCompliance) score -= 3;
  if (!sc.hasStepwiseVisualization) score -= 5;
  if (!sc.hasConcreteExample) score -= 5;
  if (!sc.hasMisconceptionAndFix) score -= 5;

  return Math.max(0, score);
}
