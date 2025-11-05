/**
 * Dynamic Sections Component
 *
 * Renders category-specific sections based on the course category.
 * This is the key component that makes each category look different.
 */

import type { BaseCourse } from '../_types/course.types';
import type { CategoryLayoutVariant } from '../_config/category-layouts';
import { getCategorySections, getOrderedSectionIds } from './section-registry';

interface DynamicSectionsProps {
  course: BaseCourse;
  variant: CategoryLayoutVariant;
}

/**
 * Renders sections dynamically based on category variant
 */
export function DynamicSections({ course, variant }: DynamicSectionsProps) {
  // Get ordered section IDs for this category
  const sectionIds = getOrderedSectionIds(variant);

  // If no custom sections, return null
  if (sectionIds.length === 0) {
    return null;
  }

  // Get all sections for this category
  const sections = getCategorySections(variant);

  return (
    <div className="space-y-0">
      {sectionIds.map((sectionId) => {
        // Find the section component
        const section = sections.find((s) => s.id === sectionId);

        if (!section) {
          return null;
        }

        const SectionComponent = section.component;

        // Render the section with course data
        return (
          <SectionComponent
            key={sectionId}
            course={course}
            variant={variant}
          />
        );
      })}
    </div>
  );
}
