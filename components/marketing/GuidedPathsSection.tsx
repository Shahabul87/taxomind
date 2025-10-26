'use client';

import { useState } from 'react';
import { Calculator, BarChart3, Code2, FlaskConical, Brain, Database, Cpu, Atom } from 'lucide-react';
import CategoryTabs, { type CategoryTab } from './CategoryTabs';
import PathCard, { type PathCardProps } from './PathCard';

// Category definitions
const categories: CategoryTab[] = [
  { id: 'math', label: 'Math', icon: Calculator },
  { id: 'data', label: 'Data', icon: BarChart3 },
  { id: 'cs', label: 'Computer Science', icon: Cpu },
  { id: 'science', label: 'Science & Engineering', icon: FlaskConical },
];

// Course data by category
const coursesByCategory: Record<string, Omit<PathCardProps, 'href'>[]> = {
  math: [
    {
      title: 'Mathematical Thinking',
      description: 'Build problem-solving skills through puzzles and explore the core concepts behind mathematical reasoning.',
      icon: Brain,
      iconColor: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
      bgGradient: 'bg-gradient-to-br from-purple-500 to-pink-500',
      lessons: 62,
    },
    {
      title: 'Algebra Fundamentals',
      description: 'Master equations, functions, and graphs through interactive problem solving and real-world applications.',
      icon: Calculator,
      iconColor: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
      bgGradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      lessons: 48,
      isCompleted: true,
    },
    {
      title: 'Geometry & Spatial Reasoning',
      description: 'Develop visual thinking skills and explore shapes, transformations, and spatial relationships.',
      icon: Calculator,
      iconColor: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
      bgGradient: 'bg-gradient-to-br from-green-500 to-emerald-500',
      lessons: 54,
    },
  ],
  data: [
    {
      title: 'Data Analysis Foundations',
      description: 'Learn to extract insights from data using statistical methods and visualization techniques.',
      icon: BarChart3,
      iconColor: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
      bgGradient: 'bg-gradient-to-br from-orange-500 to-red-500',
      lessons: 45,
    },
    {
      title: 'Probability & Statistics',
      description: 'Understand randomness, distributions, and how to make predictions from uncertain data.',
      icon: Database,
      iconColor: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
      bgGradient: 'bg-gradient-to-br from-indigo-500 to-purple-500',
      lessons: 52,
    },
    {
      title: 'Data Visualization',
      description: 'Master the art of telling stories with data through charts, graphs, and interactive visualizations.',
      icon: BarChart3,
      iconColor: 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
      bgGradient: 'bg-gradient-to-br from-pink-500 to-rose-500',
      lessons: 38,
      isCompleted: true,
    },
  ],
  cs: [
    {
      title: 'Programming Fundamentals',
      description: 'Build a strong foundation in programming logic, algorithms, and computational thinking.',
      icon: Code2,
      iconColor: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
      bgGradient: 'bg-gradient-to-br from-cyan-500 to-blue-500',
      lessons: 58,
    },
    {
      title: 'Data Structures & Algorithms',
      description: 'Master essential computer science concepts and learn to write efficient, optimized code.',
      icon: Cpu,
      iconColor: 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
      bgGradient: 'bg-gradient-to-br from-violet-500 to-purple-500',
      lessons: 64,
    },
    {
      title: 'Artificial Intelligence',
      description: 'Explore machine learning, neural networks, and the mathematics behind modern AI systems.',
      icon: Brain,
      iconColor: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950 dark:text-fuchsia-400',
      bgGradient: 'bg-gradient-to-br from-fuchsia-500 to-pink-500',
      lessons: 72,
    },
  ],
  science: [
    {
      title: 'Physics Essentials',
      description: 'Understand the fundamental laws governing motion, energy, and the physical world around us.',
      icon: Atom,
      iconColor: 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
      bgGradient: 'bg-gradient-to-br from-teal-500 to-cyan-500',
      lessons: 56,
    },
    {
      title: 'Chemistry Foundations',
      description: 'Explore atoms, molecules, reactions, and the chemical principles that shape our world.',
      icon: FlaskConical,
      iconColor: 'bg-lime-100 text-lime-600 dark:bg-lime-950 dark:text-lime-400',
      bgGradient: 'bg-gradient-to-br from-lime-500 to-green-500',
      lessons: 48,
    },
    {
      title: 'Engineering Principles',
      description: 'Apply scientific knowledge to design solutions and solve real-world engineering challenges.',
      icon: Cpu,
      iconColor: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
      bgGradient: 'bg-gradient-to-br from-amber-500 to-orange-500',
      lessons: 60,
    },
  ],
};

export default function GuidedPathsSection() {
  const [activeCategory, setActiveCategory] = useState('math');

  const activeCourses = coursesByCategory[activeCategory] || [];

  return (
    <section className="relative overflow-hidden py-16 md:py-24" aria-labelledby="guided-paths-heading">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2
            id="guided-paths-heading"
            className="mb-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Guided paths for every journey
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            Follow structured learning paths designed to take you from fundamentals to mastery in your chosen field.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center">
          <CategoryTabs tabs={categories} activeTab={activeCategory} onTabChange={setActiveCategory} />
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeCourses.map((course, index) => (
            <PathCard key={`${activeCategory}-${index}`} {...course} href={`/courses/${activeCategory}-${index + 1}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
