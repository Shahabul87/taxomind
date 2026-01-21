/**
 * Category-Specific Hero Components
 *
 * Dynamic hero components that adapt based on course category
 */

import { ProgrammingHero } from './programming-hero';
import { AIMLHero } from './ai-ml-hero';
import { DesignHero } from './design-hero';
import { MathHero } from './math-hero';
import { DefaultHero } from './default-hero';
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
  const variant = layout.variant;

  // Sample data for demonstration - in real app, fetch from course metadata
  const techStack = ['React', 'TypeScript', 'Node.js', 'PostgreSQL'];
  const models = ['CNN', 'RNN', 'Transformers', 'BERT'];
  const tools = ['Figma', 'Adobe XD', 'Sketch', 'Framer'];
  const mathTopics = ['Calculus', 'Linear Algebra', 'Statistics', 'Proofs'];

  switch (variant) {
    case 'programming':
      return <ProgrammingHero course={course} techStack={techStack} />;

    case 'ai-ml':
      return <AIMLHero course={course} models={models} />;

    case 'data-science':
      return <AIMLHero course={course} models={['Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow']} />;

    case 'design':
      return <DesignHero course={course} tools={tools} />;

    case 'math':
      return <MathHero course={course} topics={mathTopics} />;

    case 'business':
    case 'marketing':
    case 'default':
    default:
      return <DefaultHero course={course} />;
  }
}

// Export individual heroes for direct use if needed
export { ProgrammingHero, AIMLHero, DesignHero, MathHero, DefaultHero };
