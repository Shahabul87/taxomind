'use client';

/**
 * Design Tools Section - Design Category
 */

import { Figma, Palette, Layers } from 'lucide-react';
import type { DesignSectionProps } from '../../../_types/section.types';

export function DesignToolsSection({ course, tools = [] }: DesignSectionProps) {
  // Demo tools
  const toolsList = tools.length > 0 ? tools : [
    { name: 'Figma', description: 'UI/UX Design & Prototyping', icon: Figma },
    { name: 'Adobe XD', description: 'Experience Design Platform', icon: Layers },
    { name: 'Sketch', description: 'Digital Design Toolkit', icon: Palette },
    { name: 'Framer', description: 'Interactive Design', icon: Layers },
  ];

  return (
    <section className="py-16 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 mb-6">
            <Figma className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Professional Design Tools
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
            Master industry-standard tools used by top design teams worldwide
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {toolsList.map((tool, index) => {
            const IconComponent = typeof tool === 'string' ? Palette : tool.icon;
            const toolName = typeof tool === 'string' ? tool : tool.name;
            const toolDesc = typeof tool === 'string' ? '' : tool.description;

            return (
              <div
                key={index}
                className="group flex gap-6 p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 rounded-2xl border-2 border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {toolName}
                  </h3>
                  {toolDesc && (
                    <p className="text-slate-600 dark:text-slate-400">
                      {toolDesc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12">
          <p className="text-slate-600 dark:text-slate-400">
            Hands-on tutorials and project files for each tool included
          </p>
        </div>
      </div>
    </section>
  );
}
