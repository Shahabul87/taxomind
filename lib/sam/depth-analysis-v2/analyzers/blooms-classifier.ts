/**
 * Bloom's Taxonomy Classifier (Step 2)
 *
 * Classifies course content by cognitive level using Bloom's Taxonomy.
 * Uses AI when enabled, falls back to keyword-based classification.
 */

import {
  BLOOMS_DEPTH_WEIGHTS,
  type CourseInput,
  type BloomsAnalysisResult,
  type ChapterBloomsResult,
  type SectionBloomsResult,
  type BloomsDistribution,
  type BloomsLevel,
} from '../types';

/** Ordered Bloom's levels for gap calculation */
const BLOOMS_KEYWORDS_ORDER: BloomsLevel[] = [
  'REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE',
];

// Bloom's taxonomy keywords for rule-based classification
const BLOOMS_KEYWORDS: Record<BloomsLevel, string[]> = {
  REMEMBER: [
    'define',
    'list',
    'recall',
    'identify',
    'name',
    'recognize',
    'label',
    'state',
    'describe',
    'match',
    'select',
    'memorize',
    'repeat',
    'duplicate',
  ],
  UNDERSTAND: [
    'explain',
    'summarize',
    'interpret',
    'classify',
    'compare',
    'contrast',
    'discuss',
    'distinguish',
    'paraphrase',
    'predict',
    'translate',
    'illustrate',
    'infer',
  ],
  APPLY: [
    'apply',
    'demonstrate',
    'implement',
    'solve',
    'use',
    'execute',
    'practice',
    'calculate',
    'complete',
    'illustrate',
    'show',
    'operate',
    'experiment',
  ],
  ANALYZE: [
    'analyze',
    'differentiate',
    'organize',
    'examine',
    'investigate',
    'categorize',
    'compare',
    'contrast',
    'deconstruct',
    'outline',
    'structure',
    'integrate',
    'attribute',
  ],
  EVALUATE: [
    'evaluate',
    'judge',
    'critique',
    'assess',
    'justify',
    'argue',
    'defend',
    'support',
    'appraise',
    'prioritize',
    'rate',
    'recommend',
    'decide',
  ],
  CREATE: [
    'create',
    'design',
    'develop',
    'construct',
    'produce',
    'invent',
    'compose',
    'generate',
    'plan',
    'formulate',
    'hypothesize',
    'build',
    'write',
  ],
};

// Level weights for scoring (higher = more cognitive depth)
const LEVEL_WEIGHTS: Record<BloomsLevel, number> = {
  REMEMBER: 1,
  UNDERSTAND: 2,
  APPLY: 3,
  ANALYZE: 4,
  EVALUATE: 5,
  CREATE: 6,
};

/**
 * Create an empty Bloom's distribution
 */
function createEmptyDistribution(): BloomsDistribution {
  return {
    REMEMBER: 0,
    UNDERSTAND: 0,
    APPLY: 0,
    ANALYZE: 0,
    EVALUATE: 0,
    CREATE: 0,
  };
}

/**
 * Normalize distribution to percentages (must sum to 100).
 *
 * When no Bloom's keywords are found (total === 0), returns all zeros
 * instead of a fake balanced distribution. This honestly signals
 * "no classifiable educational content" rather than masking empty content.
 */
function normalizeDistribution(distribution: BloomsDistribution): BloomsDistribution {
  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
  if (total === 0) {
    return createEmptyDistribution();
  }

  const normalized = { ...distribution };
  for (const level of Object.keys(normalized) as BloomsLevel[]) {
    normalized[level] = Math.round((distribution[level] / total) * 100);
  }

  // Ensure sum is exactly 100
  const sum = Object.values(normalized).reduce((s, v) => s + v, 0);
  if (sum !== 100) {
    normalized.UNDERSTAND += 100 - sum; // Adjust most common level
  }

  return normalized;
}

/**
 * Classify text content by Bloom's level using keyword matching
 */
function classifyTextByKeywords(text: string): {
  level: BloomsLevel;
  confidence: number;
  evidence: string[];
} {
  const lowerText = text.toLowerCase();
  const scores: Record<BloomsLevel, number> = createEmptyDistribution();
  const evidence: string[] = [];

  // Count keyword matches for each level
  for (const [level, keywords] of Object.entries(BLOOMS_KEYWORDS) as [
    BloomsLevel,
    string[],
  ][]) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        scores[level] += matches.length * LEVEL_WEIGHTS[level];
        evidence.push(`Found "${keyword}" (${level})`);
      }
    }
  }

  // Find the dominant level
  let maxScore = 0;
  let dominantLevel: BloomsLevel = 'UNDERSTAND'; // Default
  for (const [level, score] of Object.entries(scores) as [BloomsLevel, number][]) {
    if (score > maxScore) {
      maxScore = score;
      dominantLevel = level;
    }
  }

  // Calculate confidence based on how clearly one level dominates.
  // When no keywords are found (totalScore === 0), confidence is 0 to
  // honestly signal "no classifiable content."
  const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0);
  const confidence =
    totalScore > 0 ? Math.min(Math.round((maxScore / totalScore) * 100), 95) : 0;

  return {
    level: dominantLevel,
    confidence,
    evidence: totalScore > 0 ? evidence.slice(0, 5) : ['No Bloom\'s taxonomy keywords found in content'],
  };
}

/**
 * Build distribution from text content
 */
function buildDistributionFromText(text: string): BloomsDistribution {
  const distribution = createEmptyDistribution();
  const lowerText = text.toLowerCase();

  // Count keyword matches weighted by level importance
  for (const [level, keywords] of Object.entries(BLOOMS_KEYWORDS) as [
    BloomsLevel,
    string[],
  ][]) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        distribution[level] += matches.length;
      }
    }
  }

  return normalizeDistribution(distribution);
}

/**
 * Classify a single section
 */
function classifySection(
  section: CourseInput['chapters'][0]['sections'][0],
  chapter: CourseInput['chapters'][0]
): SectionBloomsResult {
  // Combine all text content for analysis
  const textParts: string[] = [
    section.title,
    section.description || '',
    section.content || '',
    ...(section.objectives || []),
  ];
  const combinedText = textParts.join(' ');

  // Classify by keywords
  const classification = classifyTextByKeywords(combinedText);

  // Build distribution from content
  const distribution = buildDistributionFromText(combinedText);

  return {
    sectionId: section.id,
    sectionTitle: section.title,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    position: section.position,
    primaryLevel: classification.level,
    distribution,
    confidence: classification.confidence,
    evidence: classification.evidence,
  };
}

/**
 * Determine balance from distribution
 */
function determineBalance(
  distribution: BloomsDistribution
): 'well-balanced' | 'bottom-heavy' | 'top-heavy' {
  const lowerOrder =
    distribution.REMEMBER + distribution.UNDERSTAND + distribution.APPLY;
  const higherOrder =
    distribution.ANALYZE + distribution.EVALUATE + distribution.CREATE;

  if (Math.abs(lowerOrder - higherOrder) <= 20) {
    return 'well-balanced';
  }
  return lowerOrder > higherOrder ? 'bottom-heavy' : 'top-heavy';
}

/**
 * Calculate cognitive depth score (0-100) using the unified BLOOMS_DEPTH_WEIGHTS.
 *
 * The weighted sum of a percentage-based distribution (summing to 100) produces
 * values in the 5-20 range. We scale ×4 and clamp to [0, 100].
 */
function calculateDepthScore(distribution: BloomsDistribution): number {
  let weightedSum = 0;
  for (const level of Object.keys(BLOOMS_DEPTH_WEIGHTS) as BloomsLevel[]) {
    weightedSum += (distribution[level] || 0) * BLOOMS_DEPTH_WEIGHTS[level];
  }

  return Math.round(Math.min(100, Math.max(0, weightedSum * 4)));
}

/**
 * Aggregate distributions from multiple sections.
 *
 * If ALL input distributions are zero (no classifiable content),
 * returns all zeros rather than injecting a fake balanced distribution.
 */
function aggregateDistributions(
  distributions: BloomsDistribution[]
): BloomsDistribution {
  if (distributions.length === 0) {
    return createEmptyDistribution();
  }

  const total = createEmptyDistribution();
  for (const dist of distributions) {
    for (const level of Object.keys(total) as BloomsLevel[]) {
      total[level] += dist[level];
    }
  }

  // If all distributions were zero, the total is still zero — return honestly
  const grandTotal = Object.values(total).reduce((sum, val) => sum + val, 0);
  if (grandTotal === 0) {
    return createEmptyDistribution();
  }

  // Average and normalize
  for (const level of Object.keys(total) as BloomsLevel[]) {
    total[level] = Math.round(total[level] / distributions.length);
  }

  return normalizeDistribution(total);
}

/**
 * Classify course content by Bloom's Taxonomy
 */
export async function classifyBlooms(
  course: CourseInput,
  aiEnabled: boolean = true
): Promise<BloomsAnalysisResult> {
  const chapterResults: ChapterBloomsResult[] = [];

  for (const chapter of course.chapters) {
    const sectionResults: SectionBloomsResult[] = [];

    // Classify each section
    for (const section of chapter.sections) {
      const sectionResult = classifySection(section, chapter);
      sectionResults.push(sectionResult);
    }

    // Aggregate chapter distribution from sections
    const sectionDistributions = sectionResults.map((s) => s.distribution);
    const chapterDistribution = aggregateDistributions(sectionDistributions);

    // Find primary level for chapter (most common among sections)
    const levelCounts: Record<BloomsLevel, number> = createEmptyDistribution();
    for (const section of sectionResults) {
      levelCounts[section.primaryLevel]++;
    }
    let primaryLevel: BloomsLevel = 'UNDERSTAND';
    let maxCount = 0;
    for (const [level, count] of Object.entries(levelCounts) as [
      BloomsLevel,
      number,
    ][]) {
      if (count > maxCount) {
        maxCount = count;
        primaryLevel = level;
      }
    }

    chapterResults.push({
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      position: chapter.position,
      primaryLevel,
      distribution: chapterDistribution,
      sectionResults,
      balance: determineBalance(chapterDistribution),
    });
  }

  // Aggregate course distribution from chapters
  const chapterDistributions = chapterResults.map((c) => c.distribution);
  const courseDistribution = aggregateDistributions(chapterDistributions);

  // Build Bloom's alignment: compare assigned level (from [LEVEL] prefix in objectives) vs actual
  const bloomsAlignment: BloomsAnalysisResult['bloomsAlignment'] = [];
  const bloomsLevelSet = new Set(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']);

  for (const chResult of chapterResults) {
    for (const secResult of chResult.sectionResults) {
      // Extract assigned level from objectives with [LEVEL] prefix pattern
      let assignedLevel: BloomsLevel | null = null;
      const chapter = course.chapters.find((c) => c.id === secResult.chapterId);
      const section = chapter?.sections.find((s) => s.id === secResult.sectionId);

      if (section?.objectives) {
        for (const obj of section.objectives) {
          const match = obj.match(/^\[(\w+)\]/);
          if (match && bloomsLevelSet.has(match[1].toUpperCase())) {
            assignedLevel = match[1].toUpperCase() as BloomsLevel;
            break;
          }
        }
      }

      if (assignedLevel) {
        const actualLevel = secResult.primaryLevel;
        const assignedIdx = BLOOMS_KEYWORDS_ORDER.indexOf(assignedLevel);
        const actualIdx = BLOOMS_KEYWORDS_ORDER.indexOf(actualLevel);
        const gap = Math.abs(assignedIdx - actualIdx);

        bloomsAlignment.push({
          sectionId: secResult.sectionId,
          sectionTitle: secResult.sectionTitle,
          chapterId: secResult.chapterId,
          assignedLevel,
          actualLevel,
          isAligned: gap <= 1,
          gap,
        });
      }
    }
  }

  return {
    courseDistribution,
    courseBalance: determineBalance(courseDistribution),
    chapters: chapterResults,
    cognitiveDepthScore: calculateDepthScore(courseDistribution),
    bloomsAlignment: bloomsAlignment.length > 0 ? bloomsAlignment : undefined,
  };
}
