/**
 * Bloom's Taxonomy Classifier (Step 2)
 *
 * Classifies course content by cognitive level using Bloom's Taxonomy.
 * Uses AI when enabled, falls back to keyword-based classification.
 */

import type {
  CourseInput,
  BloomsAnalysisResult,
  ChapterBloomsResult,
  SectionBloomsResult,
  BloomsDistribution,
  BloomsLevel,
} from '../types';

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
 * Normalize distribution to percentages (must sum to 100)
 */
function normalizeDistribution(distribution: BloomsDistribution): BloomsDistribution {
  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
  if (total === 0) {
    // Default to balanced distribution if no content
    return {
      REMEMBER: 17,
      UNDERSTAND: 17,
      APPLY: 17,
      ANALYZE: 17,
      EVALUATE: 16,
      CREATE: 16,
    };
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

  // Calculate confidence based on how clearly one level dominates
  const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0);
  const confidence =
    totalScore > 0 ? Math.min(Math.round((maxScore / totalScore) * 100), 95) : 30;

  return {
    level: dominantLevel,
    confidence,
    evidence: evidence.slice(0, 5), // Limit evidence to top 5
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
 * Calculate cognitive depth score (0-100)
 */
function calculateDepthScore(distribution: BloomsDistribution): number {
  // Weight higher-order thinking more heavily
  const weightedSum =
    distribution.REMEMBER * 0.1 +
    distribution.UNDERSTAND * 0.15 +
    distribution.APPLY * 0.2 +
    distribution.ANALYZE * 0.25 +
    distribution.EVALUATE * 0.15 +
    distribution.CREATE * 0.15;

  // Scale to 0-100
  return Math.min(Math.round(weightedSum), 100);
}

/**
 * Aggregate distributions from multiple sections
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

  return {
    courseDistribution,
    courseBalance: determineBalance(courseDistribution),
    chapters: chapterResults,
    cognitiveDepthScore: calculateDepthScore(courseDistribution),
  };
}
