'use client';

/**
 * Tools Section - Marketing Category
 *
 * Essential marketing tools and platforms
 */

import { BarChart3, Mail, Palette, Search } from 'lucide-react';
import type { BaseSectionProps } from '../../../_types/section.types';

export function ToolsSection({ course }: BaseSectionProps) {
  const toolCategories = [
    {
      category: 'Analytics &amp; Data',
      icon: BarChart3,
      color: 'from-blue-600 to-cyan-600',
      tools: [
        { name: 'Google Analytics', type: 'Web Analytics' },
        { name: 'Mixpanel', type: 'Product Analytics' },
        { name: 'Tableau', type: 'Data Visualization' },
        { name: 'Hotjar', type: 'User Behavior' },
      ],
    },
    {
      category: 'Email &amp; Automation',
      icon: Mail,
      color: 'from-purple-600 to-pink-600',
      tools: [
        { name: 'HubSpot', type: 'Marketing Automation' },
        { name: 'Mailchimp', type: 'Email Campaigns' },
        { name: 'ActiveCampaign', type: 'CRM & Email' },
        { name: 'Zapier', type: 'Workflow Automation' },
      ],
    },
    {
      category: 'Design &amp; Content',
      icon: Palette,
      color: 'from-orange-600 to-red-600',
      tools: [
        { name: 'Canva', type: 'Graphic Design' },
        { name: 'Adobe Creative Cloud', type: 'Professional Design' },
        { name: 'Figma', type: 'UI/UX Design' },
        { name: 'Loom', type: 'Video Recording' },
      ],
    },
    {
      category: 'SEO &amp; Advertising',
      icon: Search,
      color: 'from-green-600 to-emerald-600',
      tools: [
        { name: 'SEMrush', type: 'SEO Suite' },
        { name: 'Ahrefs', type: 'Backlink Analysis' },
        { name: 'Google Ads', type: 'PPC Advertising' },
        { name: 'Facebook Ads Manager', type: 'Social Ads' },
      ],
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Essential Marketing Tools
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Master industry-standard tools used by top marketing teams worldwide
          </p>
        </div>

        {/* Tool Categories */}
        <div className="grid md:grid-cols-2 gap-8">
          {toolCategories.map((category, catIndex) => {
            const IconComponent = category.icon;
            return (
              <div
                key={catIndex}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {/* Category Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {category.category}
                  </h3>
                </div>

                {/* Tools List */}
                <div className="space-y-3">
                  {category.tools.map((tool, toolIndex) => (
                    <div
                      key={toolIndex}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-blue-900/20 rounded-lg hover:scale-105 transition-transform duration-300"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {tool.name}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {tool.type}
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${category.color}`} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Features */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">
            What You&apos;ll Learn
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">16+</div>
              <div className="text-blue-100">Marketing Tools</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-blue-100">Video Tutorials</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Hands-On Practice</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Step-by-step tutorials with real campaign examples for each tool
          </p>
        </div>
      </div>
    </section>
  );
}
