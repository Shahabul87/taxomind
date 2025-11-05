/**
 * Category Detection Module
 *
 * Intelligently detects the appropriate category variant for a course
 * based on multiple signals: explicit mapping, category name, metadata, and content.
 */

import type { CategoryLayoutVariant } from '../_config/category-layouts';
import type { BaseCourse } from '../_types/course.types';

/**
 * Category detection patterns
 * Maps keywords to category variants
 */
const CATEGORY_PATTERNS: Record<string, CategoryLayoutVariant> = {
  // Programming & Development
  programming: 'programming',
  'web development': 'programming',
  'mobile development': 'programming',
  'app development': 'programming',
  software: 'programming',
  coding: 'programming',
  javascript: 'programming',
  typescript: 'programming',
  python: 'programming',
  java: 'programming',
  'c++': 'programming',
  'c#': 'programming',
  ruby: 'programming',
  php: 'programming',
  go: 'programming',
  rust: 'programming',
  react: 'programming',
  angular: 'programming',
  vue: 'programming',
  node: 'programming',
  'next.js': 'programming',
  express: 'programming',
  django: 'programming',
  flask: 'programming',
  'spring boot': 'programming',

  // AI & Machine Learning
  'artificial intelligence': 'ai-ml',
  ai: 'ai-ml',
  'machine learning': 'ai-ml',
  'deep learning': 'ai-ml',
  'neural networks': 'ai-ml',
  nlp: 'ai-ml',
  'natural language processing': 'ai-ml',
  'computer vision': 'ai-ml',
  tensorflow: 'ai-ml',
  pytorch: 'ai-ml',
  keras: 'ai-ml',
  'ml models': 'ai-ml',

  // Data Science
  'data science': 'data-science',
  'data analysis': 'data-science',
  'data analytics': 'data-science',
  statistics: 'data-science',
  analytics: 'data-science',
  'big data': 'data-science',
  pandas: 'data-science',
  numpy: 'data-science',
  'data visualization': 'data-science',
  tableau: 'data-science',
  'power bi': 'data-science',
  sql: 'data-science',

  // Design
  design: 'design',
  'ui/ux': 'design',
  'ui design': 'design',
  'ux design': 'design',
  'user interface': 'design',
  'user experience': 'design',
  'graphic design': 'design',
  'web design': 'design',
  'product design': 'design',
  figma: 'design',
  sketch: 'design',
  'adobe xd': 'design',
  photoshop: 'design',
  illustrator: 'design',

  // Business
  business: 'business',
  management: 'business',
  entrepreneurship: 'business',
  leadership: 'business',
  finance: 'business',
  accounting: 'business',
  mba: 'business',
  strategy: 'business',
  'business strategy': 'business',
  'project management': 'business',

  // Marketing
  marketing: 'marketing',
  'digital marketing': 'marketing',
  seo: 'marketing',
  'search engine optimization': 'marketing',
  'social media': 'marketing',
  'content marketing': 'marketing',
  branding: 'marketing',
  'email marketing': 'marketing',
  'growth hacking': 'marketing',
};

/**
 * Detection confidence levels
 */
export interface DetectionResult {
  variant: CategoryLayoutVariant;
  confidence: number; // 0-1
  source: 'explicit' | 'category-name' | 'metadata' | 'content' | 'default';
}

/**
 * Detect category variant from course data
 *
 * Priority:
 * 1. Explicit mapping (if exists in future)
 * 2. Category name exact match
 * 3. Category name partial match
 * 4. Course title/description content analysis
 * 5. Default fallback
 */
export function detectCategoryVariant(course: BaseCourse): DetectionResult {
  // Priority 1: Explicit category mapping (for future use)
  // if (course.categoryVariant) {
  //   return {
  //     variant: course.categoryVariant,
  //     confidence: 1.0,
  //     source: 'explicit',
  //   };
  // }

  // Priority 2: Category name exact match
  if (course.category?.name) {
    const categoryName = course.category.name.toLowerCase().trim();

    // Exact match
    if (categoryName in CATEGORY_PATTERNS) {
      return {
        variant: CATEGORY_PATTERNS[categoryName],
        confidence: 0.95,
        source: 'category-name',
      };
    }

    // Partial match - check if category name contains any pattern
    for (const [pattern, variant] of Object.entries(CATEGORY_PATTERNS)) {
      if (
        categoryName.includes(pattern) ||
        pattern.includes(categoryName)
      ) {
        return {
          variant,
          confidence: 0.85,
          source: 'category-name',
        };
      }
    }
  }

  // Priority 3: Content analysis (title + description)
  const content = `${course.title} ${course.description || ''}`.toLowerCase();

  // Score each category based on keyword matches
  const scores: Record<CategoryLayoutVariant, number> = {
    programming: 0,
    'ai-ml': 0,
    'data-science': 0,
    design: 0,
    business: 0,
    marketing: 0,
    default: 0,
  };

  for (const [pattern, variant] of Object.entries(CATEGORY_PATTERNS)) {
    if (content.includes(pattern)) {
      scores[variant] += 1;
    }
  }

  // Find category with highest score
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore > 0) {
    const detectedVariant = Object.entries(scores).find(
      ([_, score]) => score === maxScore
    )?.[0] as CategoryLayoutVariant;

    if (detectedVariant) {
      return {
        variant: detectedVariant,
        confidence: Math.min(maxScore / 3, 0.7), // Cap at 0.7 for content-based
        source: 'content',
      };
    }
  }

  // Priority 4: Default fallback
  return {
    variant: 'default',
    confidence: 1.0,
    source: 'default',
  };
}

/**
 * Get category variant (convenience function)
 */
export function getCategoryVariant(course: BaseCourse): CategoryLayoutVariant {
  return detectCategoryVariant(course).variant;
}

/**
 * Check if detection confidence is high enough
 */
export function isHighConfidence(detection: DetectionResult): boolean {
  return detection.confidence >= 0.8;
}

/**
 * Get human-readable detection summary
 */
export function getDetectionSummary(detection: DetectionResult): string {
  const sourceMap = {
    explicit: 'explicitly set',
    'category-name': 'category name',
    metadata: 'course metadata',
    content: 'course content',
    default: 'default fallback',
  };

  return `Detected as "${detection.variant}" (${Math.round(detection.confidence * 100)}% confidence) from ${sourceMap[detection.source]}`;
}
