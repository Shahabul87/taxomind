/**
 * Category-Specific Layout Configuration
 *
 * Maps course categories to their unique layout variants
 */

export type CategoryLayoutVariant =
  | 'programming'
  | 'ai-ml'
  | 'design'
  | 'business'
  | 'data-science'
  | 'marketing'
  | 'math'
  | 'default';

export type CategoryLayoutConfig = {
  variant: CategoryLayoutVariant;
  heroStyle: 'code-focused' | 'visual-rich' | 'data-driven' | 'standard';
  showLiveDemo?: boolean;
  showCodePreview?: boolean;
  showProjectGallery?: boolean;
  showCaseStudies?: boolean;
  customSections?: string[];
  tabOrder?: string[];
  accentColor: string;
  iconStyle: 'technical' | 'creative' | 'professional';
  defaultBadges?: string[];
};

/**
 * Category name patterns for automatic detection
 */
const CATEGORY_PATTERNS: Record<string, CategoryLayoutVariant> = {
  // Programming & Development
  'programming': 'programming',
  'web development': 'programming',
  'mobile development': 'programming',
  'software': 'programming',
  'coding': 'programming',
  'javascript': 'programming',
  'python': 'programming',
  'java': 'programming',
  'react': 'programming',
  'node': 'programming',

  // AI & Machine Learning
  'artificial intelligence': 'ai-ml',
  'ai': 'ai-ml',
  'machine learning': 'ai-ml',
  'deep learning': 'ai-ml',
  'neural networks': 'ai-ml',
  'nlp': 'ai-ml',
  'computer vision': 'ai-ml',

  // Data Science
  'data science': 'data-science',
  'data analysis': 'data-science',
  'statistics': 'data-science',
  'analytics': 'data-science',
  'big data': 'data-science',

  // Design
  'design': 'design',
  'ui/ux': 'design',
  'graphic design': 'design',
  'web design': 'design',
  'product design': 'design',
  'figma': 'design',

  // Business
  'business': 'business',
  'management': 'business',
  'entrepreneurship': 'business',
  'leadership': 'business',
  'finance': 'business',

  // Marketing
  'marketing': 'marketing',
  'digital marketing': 'marketing',
  'seo': 'marketing',
  'social media': 'marketing',
  'content marketing': 'marketing',

  // Mathematics
  'math': 'math',
  'mathematics': 'math',
  'algebra': 'math',
  'calculus': 'math',
  'geometry': 'math',
  'trigonometry': 'math',
  'linear algebra': 'math',
  'discrete math': 'math',
  'probability': 'math',
  'number theory': 'math',
};

/**
 * Layout configurations for each category variant
 */
export const CATEGORY_LAYOUTS: Record<CategoryLayoutVariant, CategoryLayoutConfig> = {
  programming: {
    variant: 'programming',
    heroStyle: 'code-focused',
    showLiveDemo: true,
    showCodePreview: true,
    tabOrder: ['overview', 'curriculum', 'projects', 'code-playground', 'reviews'],
    accentColor: 'from-blue-600 to-cyan-600',
    iconStyle: 'technical',
    customSections: ['tech-stack', 'code-examples', 'prerequisites'],
    defaultBadges: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
  },

  'ai-ml': {
    variant: 'ai-ml',
    heroStyle: 'data-driven',
    showProjectGallery: true,
    showCodePreview: true,
    tabOrder: ['overview', 'curriculum', 'datasets', 'models', 'projects', 'reviews'],
    accentColor: 'from-purple-600 to-pink-600',
    iconStyle: 'technical',
    customSections: ['algorithms', 'datasets', 'model-architecture'],
    defaultBadges: ['CNN', 'RNN', 'Transformers', 'BERT'],
  },

  'data-science': {
    variant: 'data-science',
    heroStyle: 'data-driven',
    showProjectGallery: true,
    tabOrder: ['overview', 'curriculum', 'datasets', 'visualizations', 'reviews'],
    accentColor: 'from-green-600 to-teal-600',
    iconStyle: 'technical',
    customSections: ['tools', 'datasets', 'analytics-projects'],
    defaultBadges: ['CNN', 'RNN', 'Transformers', 'BERT'],
  },

  design: {
    variant: 'design',
    heroStyle: 'visual-rich',
    showProjectGallery: true,
    tabOrder: ['overview', 'curriculum', 'portfolio', 'case-studies', 'reviews'],
    accentColor: 'from-pink-600 to-rose-600',
    iconStyle: 'creative',
    customSections: ['design-tools', 'portfolio-examples', 'design-principles'],
    defaultBadges: ['Figma', 'Adobe XD', 'Sketch', 'Framer'],
  },

  business: {
    variant: 'business',
    heroStyle: 'standard',
    showCaseStudies: true,
    tabOrder: ['overview', 'curriculum', 'case-studies', 'resources', 'reviews'],
    accentColor: 'from-indigo-600 to-blue-600',
    iconStyle: 'professional',
    customSections: ['business-tools', 'frameworks', 'real-world-applications'],
  },

  marketing: {
    variant: 'marketing',
    heroStyle: 'visual-rich',
    showCaseStudies: true,
    tabOrder: ['overview', 'curriculum', 'campaigns', 'analytics', 'reviews'],
    accentColor: 'from-orange-600 to-red-600',
    iconStyle: 'professional',
    customSections: ['marketing-tools', 'campaign-examples', 'metrics'],
  },

  math: {
    variant: 'math',
    heroStyle: 'data-driven',
    showProjectGallery: true,
    tabOrder: ['overview', 'curriculum', 'problems', 'formulas', 'reviews'],
    accentColor: 'from-amber-600 to-orange-600',
    iconStyle: 'technical',
    customSections: ['formulas', 'problem-sets', 'theorems', 'proofs'],
    defaultBadges: ['Calculus', 'Linear Algebra', 'Statistics', 'Proofs'],
  },

  default: {
    variant: 'default',
    heroStyle: 'standard',
    tabOrder: ['overview', 'curriculum', 'reviews'],
    accentColor: 'from-slate-600 to-gray-600',
    iconStyle: 'professional',
  },
};

/**
 * Determines the layout variant based on category name
 */
export function getCategoryLayout(categoryName?: string | null): CategoryLayoutConfig {
  if (!categoryName) return CATEGORY_LAYOUTS.default;

  const normalizedCategory = categoryName.toLowerCase().trim();

  // Try exact match first
  if (normalizedCategory in CATEGORY_PATTERNS) {
    const variant = CATEGORY_PATTERNS[normalizedCategory];
    return CATEGORY_LAYOUTS[variant];
  }

  // Try partial match
  for (const [pattern, variant] of Object.entries(CATEGORY_PATTERNS)) {
    if (normalizedCategory.includes(pattern) || pattern.includes(normalizedCategory)) {
      return CATEGORY_LAYOUTS[variant];
    }
  }

  return CATEGORY_LAYOUTS.default;
}

/**
 * Get accent gradient classes for a category
 */
export function getCategoryAccentGradient(categoryName?: string | null): string {
  const layout = getCategoryLayout(categoryName);
  return `bg-gradient-to-r ${layout.accentColor}`;
}

/**
 * Get custom sections for a category
 */
export function getCategorySections(categoryName?: string | null): string[] {
  const layout = getCategoryLayout(categoryName);
  return layout.customSections || [];
}
