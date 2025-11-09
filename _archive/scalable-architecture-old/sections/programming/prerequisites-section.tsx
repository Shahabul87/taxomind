'use client';

/**
 * Prerequisites Section - Programming Category
 */

import { GraduationCap, CheckCircle } from 'lucide-react';
import type { ProgrammingSectionProps } from '../../../_types/section.types';

export function PrerequisitesSection({ course, prerequisites = [] }: ProgrammingSectionProps) {
  // Demo prerequisites
  const items = prerequisites.length > 0 ? prerequisites : [
    'Basic understanding of HTML and CSS',
    'Familiarity with JavaScript fundamentals',
    'A computer with internet connection',
    'Willingness to learn and practice',
  ];

  return (
    <section className="py-16 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 mb-6">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Prerequisites
            </h2>

            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
              Everything you need to know before starting this course
            </p>

            <ul className="space-y-4">
              {items.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Visual */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-8 border-2 border-blue-200 dark:border-blue-800">
              <div className="space-y-4">
                <div className="h-3 bg-blue-300 dark:bg-blue-700 rounded w-3/4"></div>
                <div className="h-3 bg-blue-200 dark:bg-blue-800 rounded w-1/2"></div>
                <div className="h-3 bg-blue-300 dark:bg-blue-700 rounded w-5/6"></div>
                <div className="h-3 bg-blue-200 dark:bg-blue-800 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
