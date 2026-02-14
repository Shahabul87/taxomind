/**
 * Category-Specific Hero Components
 *
 * Data-driven hero using BaseHero + theme configuration
 */

import { BaseHero } from './base-hero';
import { HERO_THEMES } from '../../_config/hero-themes';
import { getCategoryLayout } from '../../_config/category-layouts';
import type { BaseCourse } from '../../_types/course.types';

interface CategoryHeroProps {
  course: BaseCourse;
  categoryName?: string | null;
}

/**
 * Main CategoryHero component that selects the appropriate hero based on category
 */
export function CategoryHero({ course, categoryName }: CategoryHeroProps) {
  const layout = getCategoryLayout(categoryName);
  const theme = HERO_THEMES[layout.variant] ?? HERO_THEMES.default;

  return <BaseHero course={course} theme={theme} />;
}

export { BaseHero } from './base-hero';
