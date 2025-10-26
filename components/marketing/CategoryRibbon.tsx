'use client';

import { Brain, BarChart3, Code2, FlaskConical, CircuitBoard } from 'lucide-react';

const categories = [
  { id: 'math', label: 'Math', icon: Brain },
  { id: 'data', label: 'Data Analysis', icon: BarChart3 },
  { id: 'cs', label: 'Computer Science', icon: CircuitBoard },
  { id: 'programming', label: 'Programming & AI', icon: Code2 },
  { id: 'science', label: 'Science & Engineering', icon: FlaskConical },
];

export default function CategoryRibbon() {
  return (
    <nav
      role="navigation"
      aria-label="Category navigation"
      className="sticky bottom-0 z-40 w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto md:justify-center">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                className="group inline-flex shrink-0 snap-start items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-all hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`Explore ${category.label}`}
              >
                <Icon className="h-4 w-4 transition-colors group-hover:text-primary" aria-hidden="true" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
