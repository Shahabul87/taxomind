/**
 * SEO Configuration
 *
 * Category-specific SEO templates and configurations
 */

import type { CategoryLayoutVariant } from './category-layouts';

export interface CategorySEOConfig {
  // Title templates
  titleTemplate: string;
  titleSuffix: string;

  // Description templates
  descriptionTemplate: string;

  // Keywords
  defaultKeywords: string[];

  // OpenGraph
  ogImageTemplate?: string;
  ogType: string;

  // Twitter
  twitterCard: 'summary' | 'summary_large_image' | 'player';

  // Schema.org type
  schemaType: string;
}

/**
 * SEO configuration per category
 */
export const CATEGORY_SEO_CONFIG: Record<CategoryLayoutVariant, CategorySEOConfig> = {
  programming: {
    titleTemplate: '{courseTitle} - Master {category}',
    titleSuffix: 'Taxomind Programming',
    descriptionTemplate:
      'Learn {courseTitle} with hands-on coding exercises, real projects, and expert instruction. {enrollmentCount} students enrolled.',
    defaultKeywords: [
      'programming course',
      'coding tutorial',
      'software development',
      'web development',
      'learn to code',
      'online programming',
      'code bootcamp',
    ],
    ogImageTemplate: '/og/programming-course.png',
    ogType: 'article',
    twitterCard: 'summary_large_image',
    schemaType: 'Course',
  },

  'ai-ml': {
    titleTemplate: '{courseTitle} - AI & Machine Learning',
    titleSuffix: 'Taxomind AI Academy',
    descriptionTemplate:
      'Master {courseTitle} with cutting-edge AI/ML techniques, real datasets, and industry projects. {enrollmentCount} students enrolled.',
    defaultKeywords: [
      'artificial intelligence',
      'machine learning course',
      'deep learning',
      'neural networks',
      'AI tutorial',
      'data science',
      'ML algorithms',
    ],
    ogImageTemplate: '/og/ai-ml-course.png',
    ogType: 'article',
    twitterCard: 'summary_large_image',
    schemaType: 'Course',
  },

  'data-science': {
    titleTemplate: '{courseTitle} - Data Science & Analytics',
    titleSuffix: 'Taxomind Data Academy',
    descriptionTemplate:
      'Learn {courseTitle} with real-world datasets, statistical analysis, and visualization tools. {enrollmentCount} students enrolled.',
    defaultKeywords: [
      'data science course',
      'data analysis',
      'statistics',
      'analytics',
      'big data',
      'data visualization',
      'python data science',
    ],
    ogImageTemplate: '/og/data-science-course.png',
    ogType: 'article',
    twitterCard: 'summary_large_image',
    schemaType: 'Course',
  },

  design: {
    titleTemplate: '{courseTitle} - Professional Design',
    titleSuffix: 'Taxomind Design Studio',
    descriptionTemplate:
      'Master {courseTitle} with portfolio projects, design systems, and expert feedback. {enrollmentCount} students enrolled.',
    defaultKeywords: [
      'ui design course',
      'ux design',
      'graphic design',
      'product design',
      'design tutorial',
      'figma course',
      'design systems',
    ],
    ogImageTemplate: '/og/design-course.png',
    ogType: 'article',
    twitterCard: 'summary_large_image',
    schemaType: 'Course',
  },

  business: {
    titleTemplate: '{courseTitle} - Business & Strategy',
    titleSuffix: 'Taxomind Business School',
    descriptionTemplate:
      'Learn {courseTitle} with real case studies, frameworks, and actionable strategies. {enrollmentCount} students enrolled.',
    defaultKeywords: [
      'business course',
      'management',
      'entrepreneurship',
      'leadership',
      'business strategy',
      'MBA',
      'business skills',
    ],
    ogImageTemplate: '/og/business-course.png',
    ogType: 'article',
    twitterCard: 'summary_large_image',
    schemaType: 'Course',
  },

  marketing: {
    titleTemplate: '{courseTitle} - Digital Marketing',
    titleSuffix: 'Taxomind Marketing Academy',
    descriptionTemplate:
      'Master {courseTitle} with proven strategies, campaign examples, and analytics. {enrollmentCount} students enrolled.',
    defaultKeywords: [
      'marketing course',
      'digital marketing',
      'seo',
      'content marketing',
      'social media marketing',
      'email marketing',
      'marketing strategy',
    ],
    ogImageTemplate: '/og/marketing-course.png',
    ogType: 'article',
    twitterCard: 'summary_large_image',
    schemaType: 'Course',
  },

  math: {
    titleTemplate: '{courseTitle} - Mathematics',
    titleSuffix: 'Taxomind Math Academy',
    descriptionTemplate:
      'Master {courseTitle} with clear proofs, worked examples, and intuitive explanations. {enrollmentCount} students enrolled.',
    defaultKeywords: [
      'mathematics course',
      'math tutorial',
      'algebra',
      'calculus',
      'geometry',
      'linear algebra',
      'problem solving',
    ],
    ogImageTemplate: '/og/math-course.png',
    ogType: 'article',
    twitterCard: 'summary_large_image',
    schemaType: 'Course',
  },

  default: {
    titleTemplate: '{courseTitle}',
    titleSuffix: 'Taxomind',
    descriptionTemplate:
      'Learn {courseTitle} with expert instruction and practical exercises. {enrollmentCount} students enrolled.',
    defaultKeywords: [
      'online course',
      'education',
      'learning',
      'online learning',
      'e-learning',
      'tutorial',
      'training',
    ],
    ogImageTemplate: '/og/default-course.png',
    ogType: 'article',
    twitterCard: 'summary_large_image',
    schemaType: 'Course',
  },
};

/**
 * Get SEO config for a category
 */
export function getCategorySEOConfig(variant: CategoryLayoutVariant): CategorySEOConfig {
  return CATEGORY_SEO_CONFIG[variant] || CATEGORY_SEO_CONFIG.default;
}

/**
 * Generate title from template
 */
export function generateTitle(
  variant: CategoryLayoutVariant,
  courseTitle: string,
  category?: string
): string {
  const config = getCategorySEOConfig(variant);
  const title = config.titleTemplate
    .replace('{courseTitle}', courseTitle)
    .replace('{category}', category || '');

  return `${title} | ${config.titleSuffix}`;
}

/**
 * Generate description from template
 */
export function generateDescription(
  variant: CategoryLayoutVariant,
  courseTitle: string,
  enrollmentCount: number = 0
): string {
  const config = getCategorySEOConfig(variant);
  return config.descriptionTemplate
    .replace('{courseTitle}', courseTitle)
    .replace('{enrollmentCount}', enrollmentCount.toString());
}

/**
 * Get all keywords for a course
 */
export function getKeywords(
  variant: CategoryLayoutVariant,
  courseTitle: string,
  customKeywords: string[] = []
): string[] {
  const config = getCategorySEOConfig(variant);
  return [...config.defaultKeywords, courseTitle, ...customKeywords];
}
