/**
 * Section Registry
 *
 * Type-safe mapping of section IDs to their components per category.
 * Build-safe with explicit imports.
 */

import type { CategoryLayoutVariant } from '../_config/category-layouts';
import type { CategorySections, SectionComponent, BaseSectionProps } from '../_types/section.types';

// Programming sections
import {
  TechStackSection,
  PrerequisitesSection,
  CodePlaygroundSection,
} from './category-sections/programming';

// AI/ML sections
import {
  ModelArchitectureSection,
  DatasetsSection,
  AlgorithmsSection,
} from './category-sections/ai-ml';

// Design sections
import {
  PortfolioSection,
  DesignToolsSection,
} from './category-sections/design';

// Business sections
import {
  CaseStudiesSection,
  FrameworksSection,
} from './category-sections/business';

// Marketing sections
import {
  StrategiesSection,
  ToolsSection,
} from './category-sections/marketing';

// Data Science sections
import {
  AnalyticsToolsSection,
  VisualizationSection,
} from './category-sections/data-science';

/**
 * Section registry per category
 * Maps section IDs to their React components
 */
const SECTION_REGISTRY: Record<CategoryLayoutVariant, CategorySections> = {
  programming: {
    'tech-stack': TechStackSection as SectionComponent<BaseSectionProps>,
    'prerequisites': PrerequisitesSection as SectionComponent<BaseSectionProps>,
    'code-playground': CodePlaygroundSection as SectionComponent<BaseSectionProps>,
  },

  'ai-ml': {
    'model-architecture': ModelArchitectureSection as SectionComponent<BaseSectionProps>,
    'datasets': DatasetsSection as SectionComponent<BaseSectionProps>,
    'algorithms': AlgorithmsSection as SectionComponent<BaseSectionProps>,
  },

  'data-science': {
    'analytics-tools': AnalyticsToolsSection as SectionComponent<BaseSectionProps>,
    'visualization': VisualizationSection as SectionComponent<BaseSectionProps>,
    'datasets': DatasetsSection as SectionComponent<BaseSectionProps>,
  },

  design: {
    'portfolio': PortfolioSection as SectionComponent<BaseSectionProps>,
    'design-tools': DesignToolsSection as SectionComponent<BaseSectionProps>,
  },

  business: {
    'case-studies': CaseStudiesSection as SectionComponent<BaseSectionProps>,
    'frameworks': FrameworksSection as SectionComponent<BaseSectionProps>,
  },

  marketing: {
    'strategies': StrategiesSection as SectionComponent<BaseSectionProps>,
    'tools': ToolsSection as SectionComponent<BaseSectionProps>,
  },

  math: {
    // No math-specific sections registered yet
  },

  default: {
    // No custom sections for default category
  },
};

/**
 * Get section component by category and section ID
 */
export function getSectionComponent(
  variant: CategoryLayoutVariant,
  sectionId: string
): SectionComponent<BaseSectionProps> | null {
  const categorySections = SECTION_REGISTRY[variant];
  return categorySections?.[sectionId] || null;
}

/**
 * Get all section IDs for a category
 */
export function getCategorySectionIds(variant: CategoryLayoutVariant): string[] {
  const categorySections = SECTION_REGISTRY[variant];
  return categorySections ? Object.keys(categorySections) : [];
}

/**
 * Check if a section exists for a category
 */
export function hasSectionComponent(
  variant: CategoryLayoutVariant,
  sectionId: string
): boolean {
  return getSectionComponent(variant, sectionId) !== null;
}

/**
 * Get all sections for a category as an array
 */
export function getCategorySections(variant: CategoryLayoutVariant): Array<{
  id: string;
  component: SectionComponent<BaseSectionProps>;
}> {
  const sectionIds = getCategorySectionIds(variant);
  return sectionIds
    .map((id) => {
      const component = getSectionComponent(variant, id);
      return component ? { id, component } : null;
    })
    .filter((section): section is { id: string; component: SectionComponent<BaseSectionProps> } =>
      section !== null
    );
}

/**
 * Section configuration per category
 * Defines which sections to show and in what order
 */
export const CATEGORY_SECTION_CONFIG: Record<CategoryLayoutVariant, string[]> = {
  programming: ['tech-stack', 'code-playground', 'prerequisites'],
  'ai-ml': ['model-architecture', 'algorithms', 'datasets'],
  'data-science': ['analytics-tools', 'visualization', 'datasets'],
  design: ['portfolio', 'design-tools'],
  business: ['case-studies', 'frameworks'],
  marketing: ['strategies', 'tools'],
  math: [],
  default: [],
};

/**
 * Get ordered section IDs for a category
 */
export function getOrderedSectionIds(variant: CategoryLayoutVariant): string[] {
  return CATEGORY_SECTION_CONFIG[variant] || [];
}
