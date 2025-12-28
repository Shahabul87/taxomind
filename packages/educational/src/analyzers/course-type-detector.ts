/**
 * Course Type Detector
 * Automatically detects course type and provides adaptive Bloom's targets
 */

import type { BloomsLevel } from '@sam-ai/core';
import {
  CourseType,
  CourseTypeProfile,
  COURSE_TYPE_PROFILES,
  BloomsDistribution,
  WebbDOKDistribution,
} from '../types/depth-analysis.types';

export interface CourseMetadata {
  title: string;
  description: string;
  category: string;
  learningObjectives: string[];
  prerequisites: string[];
  targetAudience: string;
  chaptersCount: number;
  averageSectionDuration: number;
  hasProjects: boolean;
  hasAssessments: boolean;
  hasCodingExercises: boolean;
}

export interface CourseTypeDetectionResult {
  detectedType: CourseType;
  confidence: number;
  alternativeTypes: Array<{ type: CourseType; confidence: number }>;
  profile: CourseTypeProfile;
  idealDistribution: BloomsDistribution;
  idealDOKDistribution: WebbDOKDistribution;
  recommendations: string[];
}

export interface DistributionComparison {
  currentDistribution: BloomsDistribution;
  idealDistribution: BloomsDistribution;
  gapAnalysis: Record<BloomsLevel, { current: number; ideal: number; gap: number; action: string }>;
  alignmentScore: number;
  priority: BloomsLevel[];
}

export class CourseTypeDetector {
  private readonly TYPE_KEYWORDS: Record<CourseType, string[]> = {
    foundational: [
      'introduction', 'basics', 'fundamentals', 'beginner', 'getting started',
      'primer', 'essentials', 'overview', '101', 'first steps', 'learn',
    ],
    intermediate: [
      'intermediate', 'practical', 'hands-on', 'applied', 'skills',
      'building', 'developing', 'next level', 'beyond basics',
    ],
    advanced: [
      'advanced', 'expert', 'deep dive', 'mastery', 'complex',
      'specialized', 'in-depth', 'comprehensive', 'senior',
    ],
    professional: [
      'professional', 'enterprise', 'industry', 'career', 'certification',
      'workplace', 'business', 'corporate', 'leadership',
    ],
    creative: [
      'creative', 'design', 'art', 'innovation', 'portfolio',
      'create', 'build', 'make', 'craft', 'project-based',
    ],
    technical: [
      'technical', 'coding', 'programming', 'development', 'engineering',
      'implementation', 'system', 'software', 'data', 'algorithm',
    ],
    theoretical: [
      'theory', 'concept', 'research', 'academic', 'scientific',
      'principles', 'framework', 'methodology', 'analysis',
    ],
  };

  private readonly CATEGORY_TYPE_MAPPING: Record<string, CourseType[]> = {
    'Technology': ['technical', 'intermediate', 'advanced'],
    'Programming': ['technical', 'intermediate'],
    'Data Science': ['technical', 'advanced', 'theoretical'],
    'Business': ['professional', 'intermediate'],
    'Marketing': ['professional', 'creative'],
    'Design': ['creative', 'intermediate'],
    'Art': ['creative', 'foundational'],
    'Science': ['theoretical', 'advanced'],
    'Mathematics': ['theoretical', 'technical'],
    'Language': ['foundational', 'intermediate'],
    'Personal Development': ['foundational', 'professional'],
    'Health & Fitness': ['foundational', 'intermediate'],
    'Music': ['creative', 'foundational'],
    'Photography': ['creative', 'technical'],
    'Writing': ['creative', 'foundational'],
  };

  /**
   * Detect course type based on metadata
   */
  detectCourseType(metadata: CourseMetadata): CourseTypeDetectionResult {
    const scores: Record<CourseType, number> = {
      foundational: 0,
      intermediate: 0,
      advanced: 0,
      professional: 0,
      creative: 0,
      technical: 0,
      theoretical: 0,
    };

    // Analyze title and description
    this.analyzeText(metadata.title, scores, 3);
    this.analyzeText(metadata.description, scores, 2);

    // Analyze learning objectives
    for (const objective of metadata.learningObjectives) {
      this.analyzeText(objective, scores, 1);
    }

    // Analyze target audience
    this.analyzeText(metadata.targetAudience, scores, 2);

    // Category-based scoring
    this.scoreByCategoryMapping(metadata.category, scores);

    // Structural indicators
    this.scoreByStructure(metadata, scores);

    // Action verb analysis in objectives
    this.scoreByActionVerbs(metadata.learningObjectives, scores);

    // Calculate total and normalize
    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
    const normalizedScores: Array<{ type: CourseType; confidence: number }> = [];

    for (const [type, score] of Object.entries(scores)) {
      normalizedScores.push({
        type: type as CourseType,
        confidence: totalScore > 0 ? Math.round((score / totalScore) * 100) : 0,
      });
    }

    // Sort by confidence
    normalizedScores.sort((a, b) => b.confidence - a.confidence);

    const detectedType = normalizedScores[0].type;
    const confidence = normalizedScores[0].confidence;
    const profile = COURSE_TYPE_PROFILES[detectedType];

    return {
      detectedType,
      confidence,
      alternativeTypes: normalizedScores.slice(1, 3),
      profile,
      idealDistribution: profile.idealBloomsDistribution,
      idealDOKDistribution: profile.idealDOKDistribution,
      recommendations: this.generateTypeRecommendations(detectedType, confidence),
    };
  }

  /**
   * Compare current distribution with ideal for course type
   */
  compareWithIdeal(
    currentDistribution: BloomsDistribution,
    courseType: CourseType
  ): DistributionComparison {
    const idealDistribution = COURSE_TYPE_PROFILES[courseType].idealBloomsDistribution;

    const gapAnalysis: Record<BloomsLevel, { current: number; ideal: number; gap: number; action: string }> = {} as Record<BloomsLevel, { current: number; ideal: number; gap: number; action: string }>;

    const levels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    const priorities: Array<{ level: BloomsLevel; absGap: number }> = [];

    for (const level of levels) {
      const current = currentDistribution[level];
      const ideal = idealDistribution[level];
      const gap = ideal - current;
      const absGap = Math.abs(gap);

      let action: string;
      if (gap > 10) {
        action = `Increase ${level.toLowerCase()} content significantly (+${Math.round(gap)}%)`;
      } else if (gap > 5) {
        action = `Add more ${level.toLowerCase()} activities (+${Math.round(gap)}%)`;
      } else if (gap < -10) {
        action = `Reduce ${level.toLowerCase()} content (${Math.round(gap)}%)`;
      } else if (gap < -5) {
        action = `Consider reducing ${level.toLowerCase()} activities (${Math.round(gap)}%)`;
      } else {
        action = 'Maintain current level';
      }

      gapAnalysis[level] = { current, ideal, gap, action };
      priorities.push({ level, absGap });
    }

    // Sort priorities by absolute gap
    priorities.sort((a, b) => b.absGap - a.absGap);
    const priority = priorities.map(p => p.level);

    // Calculate alignment score (100 - average absolute gap)
    const totalAbsGap = priorities.reduce((sum, p) => sum + p.absGap, 0);
    const avgAbsGap = totalAbsGap / levels.length;
    const alignmentScore = Math.max(0, Math.round(100 - avgAbsGap));

    return {
      currentDistribution,
      idealDistribution,
      gapAnalysis,
      alignmentScore,
      priority,
    };
  }

  /**
   * Get adaptive targets based on current state and course type
   */
  getAdaptiveTargets(
    currentDistribution: BloomsDistribution,
    courseType: CourseType,
    improvementRate: number = 0.3
  ): BloomsDistribution {
    const idealDistribution = COURSE_TYPE_PROFILES[courseType].idealBloomsDistribution;
    const adaptiveTargets: BloomsDistribution = {} as BloomsDistribution;

    const levels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

    for (const level of levels) {
      const current = currentDistribution[level];
      const ideal = idealDistribution[level];
      const gap = ideal - current;

      // Move toward ideal by improvement rate
      adaptiveTargets[level] = Math.round(current + gap * improvementRate);
    }

    // Ensure percentages sum to 100
    const total = Object.values(adaptiveTargets).reduce((sum, v) => sum + v, 0);
    if (total !== 100) {
      const adjustment = (100 - total) / levels.length;
      for (const level of levels) {
        adaptiveTargets[level] = Math.round(adaptiveTargets[level] + adjustment);
      }
    }

    return adaptiveTargets;
  }

  /**
   * Analyze text for type keywords
   */
  private analyzeText(text: string, scores: Record<CourseType, number>, weight: number): void {
    const lowerText = text.toLowerCase();

    for (const [type, keywords] of Object.entries(this.TYPE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          scores[type as CourseType] += weight;
        }
      }
    }
  }

  /**
   * Score based on category mapping
   */
  private scoreByCategoryMapping(category: string, scores: Record<CourseType, number>): void {
    for (const [cat, types] of Object.entries(this.CATEGORY_TYPE_MAPPING)) {
      if (category.toLowerCase().includes(cat.toLowerCase())) {
        for (let i = 0; i < types.length; i++) {
          scores[types[i]] += 3 - i; // Primary type gets 3, secondary gets 2, etc.
        }
        break;
      }
    }
  }

  /**
   * Score based on course structure
   */
  private scoreByStructure(metadata: CourseMetadata, scores: Record<CourseType, number>): void {
    // More chapters suggest comprehensive coverage
    if (metadata.chaptersCount > 10) {
      scores.advanced += 2;
      scores.professional += 1;
    } else if (metadata.chaptersCount < 5) {
      scores.foundational += 2;
    }

    // Projects indicate creative/technical focus
    if (metadata.hasProjects) {
      scores.creative += 3;
      scores.technical += 2;
    }

    // Coding exercises indicate technical focus
    if (metadata.hasCodingExercises) {
      scores.technical += 4;
    }

    // Prerequisites indicate advanced level
    if (metadata.prerequisites.length > 2) {
      scores.advanced += 3;
      scores.professional += 2;
    } else if (metadata.prerequisites.length === 0) {
      scores.foundational += 2;
    }

    // Long average duration suggests depth
    if (metadata.averageSectionDuration > 30) {
      scores.advanced += 2;
      scores.theoretical += 2;
    } else if (metadata.averageSectionDuration < 10) {
      scores.foundational += 2;
    }
  }

  /**
   * Score based on action verbs in objectives
   */
  private scoreByActionVerbs(objectives: string[], scores: Record<CourseType, number>): void {
    const verbPatterns = {
      foundational: /\b(identify|list|name|recall|define|describe)\b/gi,
      intermediate: /\b(apply|use|implement|demonstrate|solve|calculate)\b/gi,
      advanced: /\b(analyze|evaluate|critique|synthesize|compare|assess)\b/gi,
      creative: /\b(create|design|develop|compose|construct|produce|innovate)\b/gi,
      technical: /\b(code|program|build|debug|deploy|implement|configure)\b/gi,
      theoretical: /\b(theorize|research|hypothesize|conceptualize|formulate)\b/gi,
      professional: /\b(manage|lead|coordinate|optimize|streamline|execute)\b/gi,
    };

    for (const objective of objectives) {
      for (const [type, pattern] of Object.entries(verbPatterns)) {
        const matches = objective.match(pattern);
        if (matches) {
          scores[type as CourseType] += matches.length;
        }
      }
    }
  }

  /**
   * Generate recommendations based on detected type
   */
  private generateTypeRecommendations(type: CourseType, confidence: number): string[] {
    const recommendations: string[] = [];

    if (confidence < 50) {
      recommendations.push('Consider clarifying your course positioning with more specific language');
      recommendations.push('Update title and description to better reflect the course level');
    }

    const profile = COURSE_TYPE_PROFILES[type];

    recommendations.push(`Optimize content for ${profile.targetAudience}`);
    recommendations.push(`Focus on: ${profile.primaryObjective}`);

    // Type-specific recommendations
    switch (type) {
      case 'foundational':
        recommendations.push('Include plenty of examples and definitions');
        recommendations.push('Provide scaffolded learning with frequent checkpoints');
        break;
      case 'intermediate':
        recommendations.push('Balance theory with practical exercises');
        recommendations.push('Include real-world case studies');
        break;
      case 'advanced':
        recommendations.push('Challenge learners with complex problem-solving');
        recommendations.push('Include critical analysis and evaluation tasks');
        break;
      case 'professional':
        recommendations.push('Focus on industry-relevant scenarios');
        recommendations.push('Include certification preparation materials');
        break;
      case 'creative':
        recommendations.push('Emphasize project-based learning');
        recommendations.push('Provide opportunities for original creation');
        break;
      case 'technical':
        recommendations.push('Include hands-on coding exercises');
        recommendations.push('Provide debugging and troubleshooting scenarios');
        break;
      case 'theoretical':
        recommendations.push('Include research methodologies');
        recommendations.push('Encourage critical literature review');
        break;
    }

    return recommendations;
  }
}

// Export singleton instance
export const courseTypeDetector = new CourseTypeDetector();
