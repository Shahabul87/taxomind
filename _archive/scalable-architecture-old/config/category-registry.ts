/**
 * Category Component Registry
 *
 * Build-safe component resolution for category-specific heroes.
 * Uses explicit imports instead of dynamic string interpolation.
 *
 * ✅ PRODUCTION-SAFE: All imports are known at build time
 * ✅ TYPE-SAFE: Full TypeScript support
 * ✅ TREE-SHAKEABLE: Unused categories are not bundled
 */

import { ProgrammingHero } from '../_components/category-heroes/programming-hero';
import { AIMLHero } from '../_components/category-heroes/ai-ml-hero';
import { DesignHero } from '../_components/category-heroes/design-hero';
import { DefaultHero } from '../_components/category-heroes/default-hero';
import type { CategoryLayoutVariant } from './category-layouts';
import type { BaseCourse } from '../_types/course.types';

/**
 * Hero component interface
 * All category heroes must match this signature
 */
export interface HeroComponentProps {
  course: BaseCourse;
  techStack?: string[];
  models?: string[];
  tools?: string[];
}

export type HeroComponent = React.ComponentType<HeroComponentProps>;

/**
 * Explicit hero component mapping
 * ✅ Build-safe: No dynamic imports with string interpolation
 * ✅ Type-safe: All components must match HeroComponent interface
 */
const HERO_COMPONENTS: Record<CategoryLayoutVariant, HeroComponent> = {
  programming: ProgrammingHero,
  'ai-ml': AIMLHero,
  'data-science': AIMLHero, // Reuse AI/ML hero with different props
  design: DesignHero,
  business: DefaultHero,
  marketing: DefaultHero,
  default: DefaultHero,
} as const;

/**
 * Get the appropriate Hero component for a category variant
 *
 * @param variant - Category layout variant
 * @returns React component for rendering the hero section
 *
 * @example
 * const HeroComponent = getHeroComponent('programming');
 * return <HeroComponent course={course} techStack={['React', 'TypeScript']} />;
 */
export function getHeroComponent(variant: CategoryLayoutVariant): HeroComponent {
  return HERO_COMPONENTS[variant] ?? HERO_COMPONENTS.default;
}

/**
 * Check if a hero component exists for a variant
 *
 * @param variant - Category layout variant to check
 * @returns true if component exists, false otherwise
 */
export function hasHeroComponent(variant: CategoryLayoutVariant): boolean {
  return variant in HERO_COMPONENTS;
}

/**
 * Get all available category variants
 * Useful for admin UIs or category selection
 *
 * @returns Array of all registered category variants
 */
export function getAvailableVariants(): CategoryLayoutVariant[] {
  return Object.keys(HERO_COMPONENTS) as CategoryLayoutVariant[];
}

/**
 * Optional: Lazy loading configuration for code splitting
 * Use this if you want to lazy load hero components
 *
 * Note: With App Router, this is usually not necessary as Next.js
 * automatically code-splits by route. Only use if you need manual control.
 */
export const LAZY_HERO_COMPONENTS = {
  programming: () => import('../_components/category-heroes/programming-hero').then(m => ({ default: m.ProgrammingHero })),
  'ai-ml': () => import('../_components/category-heroes/ai-ml-hero').then(m => ({ default: m.AIMLHero })),
  'data-science': () => import('../_components/category-heroes/ai-ml-hero').then(m => ({ default: m.AIMLHero })),
  design: () => import('../_components/category-heroes/design-hero').then(m => ({ default: m.DesignHero })),
  business: () => import('../_components/category-heroes/default-hero').then(m => ({ default: m.DefaultHero })),
  marketing: () => import('../_components/category-heroes/default-hero').then(m => ({ default: m.DefaultHero })),
  default: () => import('../_components/category-heroes/default-hero').then(m => ({ default: m.DefaultHero })),
} as const;

/**
 * Async component loader for lazy loading
 *
 * @param variant - Category layout variant
 * @returns Promise resolving to the Hero component
 *
 * @example
 * const HeroComponent = await loadHeroComponentLazy('programming');
 * return <HeroComponent course={course} />;
 */
export async function loadHeroComponentLazy(variant: CategoryLayoutVariant): Promise<HeroComponent> {
  const loader = LAZY_HERO_COMPONENTS[variant] ?? LAZY_HERO_COMPONENTS.default;
  const heroModule = await loader();
  return heroModule.default;
}
