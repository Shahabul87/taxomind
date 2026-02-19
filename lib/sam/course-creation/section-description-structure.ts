/**
 * Section Description Structure Validator
 *
 * Shared structural checks for Stage 3 section descriptions.
 * Enforces a strict six-part pedagogical anatomy.
 */

export const REQUIRED_SECTION_DESCRIPTION_HEADINGS = [
  'Why It Was Developed',
  'Core Intuition',
  'Equation Intuition',
  'Step-by-Step Visualization',
  'Concrete Example',
  'Common Confusion + Fix',
] as const;

export const MIN_WORDS_PER_SECTION_DESCRIPTION_BLOCK = 80;

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

export function analyzeSectionDescriptionStructure(html: string): SectionDescriptionStructureAnalysis {
  const expected = REQUIRED_SECTION_DESCRIPTION_HEADINGS.map(normalizeHeading);
  const blocks = parseSectionBlocks(html);
  const actual = blocks.map((block) => block.normalizedHeading);
  const issues: string[] = [];

  const missingHeadings = REQUIRED_SECTION_DESCRIPTION_HEADINGS.filter((heading) => {
    return !actual.includes(normalizeHeading(heading));
  });
  const unexpectedHeadings = blocks
    .map((block) => block.heading)
    .filter((heading) => !expected.includes(normalizeHeading(heading)));

  if (blocks.length !== REQUIRED_SECTION_DESCRIPTION_HEADINGS.length) {
    issues.push(
      `Description must contain exactly ${REQUIRED_SECTION_DESCRIPTION_HEADINGS.length} <h2> sections; found ${blocks.length}.`,
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
        `Heading order must be exactly: ${REQUIRED_SECTION_DESCRIPTION_HEADINGS.join(' -> ')}`,
      );
    }
  }

  const blockByHeading = new Map<string, ParsedSectionBlock>();
  for (const block of blocks) {
    blockByHeading.set(block.normalizedHeading, block);
  }

  const sectionWordCounts: Record<string, number> = {};
  for (const heading of REQUIRED_SECTION_DESCRIPTION_HEADINGS) {
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
    isValid: issues.length === 0,
    headingsInOrder: blocks.map((block) => block.heading),
    missingHeadings,
    unexpectedHeadings,
    issues,
    sectionWordCounts,
    semanticChecks: {
      hasMotivationProblem,
      hasCoreMentalModel,
      hasEquationIntuitionCompliance,
      hasStepwiseVisualization,
      hasConcreteExample,
      hasMisconceptionAndFix,
    },
  };
}
