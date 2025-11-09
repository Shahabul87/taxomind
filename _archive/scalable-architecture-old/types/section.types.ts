/**
 * Section Component Type Definitions
 */

import type { BaseCourse } from './course.types';
import type { CategoryLayoutVariant } from '../_config/category-layouts';

/**
 * Base props that all section components receive
 */
export interface BaseSectionProps {
  course: BaseCourse;
  variant: CategoryLayoutVariant;
}

/**
 * Programming section props
 */
export interface ProgrammingSectionProps extends BaseSectionProps {
  techStack?: string[];
  prerequisites?: string[];
}

/**
 * AI/ML section props
 */
export interface AIMLSectionProps extends BaseSectionProps {
  models?: string[];
  datasets?: string[];
  algorithms?: string[];
}

/**
 * Design section props
 */
export interface DesignSectionProps extends BaseSectionProps {
  tools?: string[];
  portfolioItems?: string[];
}

/**
 * Section component type
 */
export type SectionComponent<P = BaseSectionProps> = React.ComponentType<P>;

/**
 * Section configuration
 */
export interface SectionConfig {
  id: string;
  component: SectionComponent<BaseSectionProps>;
  props?: Record<string, unknown>;
  enabled?: boolean;
}

/**
 * Section registry per category
 */
export type CategorySections = Record<string, SectionComponent<BaseSectionProps>>;
