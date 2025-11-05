'use client';

/**
 * Portfolio Section - Design Category
 */

import { Palette, ExternalLink } from 'lucide-react';
import type { DesignSectionProps } from '../../../_types/section.types';

export function PortfolioSection({ course, portfolioItems = [] }: DesignSectionProps) {
  // Demo portfolio items
  const items = portfolioItems.length > 0 ? portfolioItems : [
    'Mobile App Redesign',
    'E-commerce Website',
    'Brand Identity System',
    'Design System Documentation',
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 mb-4">
            <Palette className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Portfolio Projects
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Build a professional portfolio with real-world projects that showcase your skills
          </p>
        </div>

        {/* Portfolio Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <div
              key={index}
              className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* Image placeholder */}
              <div className="h-48 bg-gradient-to-br from-pink-400 to-rose-400 dark:from-pink-600 dark:to-rose-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {item}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Project {index + 1}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Each project includes step-by-step guidance and professional feedback
          </p>
        </div>
      </div>
    </section>
  );
}
