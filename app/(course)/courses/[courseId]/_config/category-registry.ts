/**
 * Category Component Registry
 *
 * Build-safe component resolution for category-specific heroes.
 * Now uses the unified BaseHero + HeroThemeConfig system.
 *
 * ✅ PRODUCTION-SAFE: All imports are known at build time
 * ✅ TYPE-SAFE: Full TypeScript support
 */

import { BaseHero } from '../_components/category-heroes/base-hero';
import { HERO_THEMES } from './hero-themes';
import type { CategoryLayoutVariant } from './category-layouts';
import type { HeroThemeConfig } from './hero-themes';

export { BaseHero };

/**
 * Get the theme config for a category variant
 */
export function getHeroTheme(variant: CategoryLayoutVariant): HeroThemeConfig {
  return HERO_THEMES[variant] ?? HERO_THEMES.default;
}

/**
 * Check if a hero theme exists for a variant
 */
export function hasHeroTheme(variant: CategoryLayoutVariant): boolean {
  return variant in HERO_THEMES;
}

/**
 * Get all available category variants
 */
export function getAvailableVariants(): CategoryLayoutVariant[] {
  return Object.keys(HERO_THEMES) as CategoryLayoutVariant[];
}
