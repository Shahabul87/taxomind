'use client';

/**
 * Tech Stack Section - Programming Category
 *
 * Displays technologies and tools covered in the course
 */

import { Code2, CheckCircle2 } from 'lucide-react';
import type { BaseCourse } from '../../../_types/course.types';

interface TechStackSectionProps {
  course: BaseCourse;
  techStack?: string[];
}

export function TechStackSection({ course, techStack = [] }: TechStackSectionProps) {
  // Demo tech stack (in real implementation, fetch from course.metadata or database)
  const technologies = techStack.length > 0 ? techStack : [
    'React 19',
    'TypeScript',
    'Next.js 15',
    'Tailwind CSS',
    'Node.js',
    'PostgreSQL',
    'Prisma ORM',
    'Git & GitHub',
  ];

  return (
    <section className="py-12 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 mb-4">
            <Code2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Technologies You&apos;ll Master
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Build real-world projects with modern technologies and industry-standard tools
          </p>
        </div>

        {/* Tech Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {technologies.map((tech, index) => (
            <div
              key={index}
              className="group relative bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {tech}
                  </h3>
                </div>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-cyan-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            All technologies are taught with hands-on projects and real-world applications
          </p>
        </div>
      </div>
    </section>
  );
}
