/**
 * Webb's Depth of Knowledge (DOK) Analyzer
 * Provides complementary cognitive depth analysis alongside Bloom's Taxonomy
 */

import type { BloomsLevel } from '@sam-ai/core';
import {
  WebbDOKLevel,
  WebbDOKAnalysis,
  WebbDOKDistribution,
  WEBB_DOK_DESCRIPTORS,
  bloomsToDOK,
} from '../types/depth-analysis.types';

export class WebbDOKAnalyzer {
  /**
   * Analyze content to determine Webb's DOK level
   */
  analyzeContent(content: string, bloomsLevel?: BloomsLevel): WebbDOKAnalysis {
    const normalizedContent = content.toLowerCase().trim();

    // Score each DOK level based on keyword matches
    const levelScores: Record<WebbDOKLevel, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
    };

    const matchedIndicators: Record<WebbDOKLevel, string[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
    };

    // Analyze keywords for each DOK level
    for (const [levelKey, descriptor] of Object.entries(WEBB_DOK_DESCRIPTORS)) {
      const level = Number(levelKey) as WebbDOKLevel;

      for (const keyword of descriptor.keywords) {
        const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'gi');
        const matches = normalizedContent.match(regex);

        if (matches) {
          levelScores[level] += matches.length * level; // Weight by cognitive complexity
          matchedIndicators[level].push(keyword);
        }
      }
    }

    // If Bloom's level is provided, use it to influence the DOK determination
    if (bloomsLevel) {
      const expectedDOK = bloomsToDOK(bloomsLevel);
      levelScores[expectedDOK] += 5; // Boost expected level
    }

    // Determine the primary DOK level
    let primaryLevel: WebbDOKLevel = 1;
    let maxScore = 0;

    for (const [levelKey, score] of Object.entries(levelScores)) {
      const level = Number(levelKey) as WebbDOKLevel;
      if (score > maxScore) {
        maxScore = score;
        primaryLevel = level;
      }
    }

    // Calculate confidence based on score differential
    const totalScore = Object.values(levelScores).reduce((sum, s) => sum + s, 0);
    const confidence = totalScore > 0 ? Math.min((maxScore / totalScore) * 100, 100) : 50;

    const descriptor = WEBB_DOK_DESCRIPTORS[primaryLevel];

    return {
      level: primaryLevel,
      levelName: descriptor.name as WebbDOKAnalysis['levelName'],
      indicators: matchedIndicators[primaryLevel].slice(0, 5), // Top 5 indicators
      bloomsCorrelation: bloomsLevel ?? descriptor.bloomsMapping[0],
      confidence: Math.round(confidence),
    };
  }

  /**
   * Analyze multiple content pieces and return distribution
   */
  analyzeDistribution(contents: Array<{ content: string; bloomsLevel?: BloomsLevel }>): WebbDOKDistribution {
    const distribution: WebbDOKDistribution = {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
    };

    if (contents.length === 0) {
      return distribution;
    }

    const levelCounts: Record<WebbDOKLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

    for (const item of contents) {
      const analysis = this.analyzeContent(item.content, item.bloomsLevel);
      levelCounts[analysis.level]++;
    }

    const total = contents.length;
    distribution.level1 = Math.round((levelCounts[1] / total) * 100);
    distribution.level2 = Math.round((levelCounts[2] / total) * 100);
    distribution.level3 = Math.round((levelCounts[3] / total) * 100);
    distribution.level4 = Math.round((levelCounts[4] / total) * 100);

    return distribution;
  }

  /**
   * Calculate DOK depth score (0-100)
   */
  calculateDOKDepth(distribution: WebbDOKDistribution): number {
    const weights = { level1: 1, level2: 2, level3: 3, level4: 4 };

    const weightedSum =
      distribution.level1 * weights.level1 +
      distribution.level2 * weights.level2 +
      distribution.level3 * weights.level3 +
      distribution.level4 * weights.level4;

    const totalPercentage = distribution.level1 + distribution.level2 + distribution.level3 + distribution.level4;

    if (totalPercentage === 0) return 0;

    // Scale to 0-100 (max weighted average is 4, scale by 25)
    return Math.round((weightedSum / totalPercentage) * 25);
  }

  /**
   * Determine DOK balance
   */
  determineDOKBalance(distribution: WebbDOKDistribution): 'recall-heavy' | 'skill-focused' | 'strategic' | 'well-balanced' {
    const recallHeavy = distribution.level1 > 40;
    const skillFocused = distribution.level2 > 50;
    const strategic = distribution.level3 + distribution.level4 > 45;

    if (recallHeavy) return 'recall-heavy';
    if (skillFocused) return 'skill-focused';
    if (strategic) return 'strategic';

    return 'well-balanced';
  }

  /**
   * Get recommendations based on DOK analysis
   */
  getRecommendations(distribution: WebbDOKDistribution): string[] {
    const recommendations: string[] = [];

    if (distribution.level1 > 30) {
      recommendations.push('Reduce recall-focused content; add more application and analysis activities');
    }

    if (distribution.level3 < 20) {
      recommendations.push('Include more strategic thinking tasks like case studies and problem-solving scenarios');
    }

    if (distribution.level4 < 10) {
      recommendations.push('Add extended thinking projects that require research, synthesis, and original creation');
    }

    if (distribution.level2 > 50) {
      recommendations.push('Balance skill-based content with more complex analytical challenges');
    }

    if (distribution.level1 + distribution.level2 > 70) {
      recommendations.push('Increase cognitive complexity by adding DOK Level 3 and 4 activities');
    }

    return recommendations;
  }

  /**
   * Convert Bloom's distribution to estimated DOK distribution
   */
  bloomsToEstimatedDOK(bloomsDistribution: Record<string, number>): WebbDOKDistribution {
    return {
      level1: bloomsDistribution.REMEMBER ?? bloomsDistribution.remember ?? 0,
      level2: (bloomsDistribution.UNDERSTAND ?? bloomsDistribution.understand ?? 0) +
              (bloomsDistribution.APPLY ?? bloomsDistribution.apply ?? 0),
      level3: (bloomsDistribution.ANALYZE ?? bloomsDistribution.analyze ?? 0) +
              (bloomsDistribution.EVALUATE ?? bloomsDistribution.evaluate ?? 0),
      level4: bloomsDistribution.CREATE ?? bloomsDistribution.create ?? 0,
    };
  }

  /**
   * Validate alignment between Bloom's and DOK
   */
  validateBloomsDOKAlignment(
    bloomsLevel: BloomsLevel,
    dokLevel: WebbDOKLevel
  ): { aligned: boolean; expectedDOK: WebbDOKLevel; message: string } {
    const expectedDOK = bloomsToDOK(bloomsLevel);
    const aligned = expectedDOK === dokLevel;

    let message: string;
    if (aligned) {
      message = `Bloom's level ${bloomsLevel} correctly aligns with DOK Level ${dokLevel}`;
    } else {
      message = `Potential misalignment: Bloom's ${bloomsLevel} typically maps to DOK Level ${expectedDOK}, but content suggests DOK Level ${dokLevel}`;
    }

    return { aligned, expectedDOK, message };
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Export singleton instance
export const webbDOKAnalyzer = new WebbDOKAnalyzer();
