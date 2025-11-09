'use client';

/**
 * Visualization Section - Data Science Category
 *
 * Data visualization techniques and best practices
 */

import { BarChart3, PieChart, TrendingUp, Activity } from 'lucide-react';
import type { BaseSectionProps } from '../../../_types/section.types';

export function VisualizationSection({ course }: BaseSectionProps) {
  const chartTypes = [
    {
      name: 'Statistical Charts',
      icon: BarChart3,
      color: 'from-blue-600 to-cyan-600',
      types: [
        'Bar Charts',
        'Histograms',
        'Box Plots',
        'Scatter Plots',
        'Line Charts',
        'Heat Maps',
      ],
      useCase: 'Compare distributions and relationships',
    },
    {
      name: 'Analytical Charts',
      icon: TrendingUp,
      color: 'from-purple-600 to-pink-600',
      types: [
        'Time Series',
        'Trend Lines',
        'Regression Plots',
        'Residual Plots',
        'ROC Curves',
        'Confusion Matrix',
      ],
      useCase: 'Analyze trends and model performance',
    },
    {
      name: 'Categorical Data',
      icon: PieChart,
      color: 'from-green-600 to-emerald-600',
      types: [
        'Pie Charts',
        'Donut Charts',
        'Tree Maps',
        'Sunburst Charts',
        'Sankey Diagrams',
        'Network Graphs',
      ],
      useCase: 'Visualize proportions and hierarchies',
    },
    {
      name: 'Advanced Visuals',
      icon: Activity,
      color: 'from-orange-600 to-red-600',
      types: [
        '3D Plots',
        'Interactive Dashboards',
        'Geographic Maps',
        'Animation',
        'Word Clouds',
        'Pair Plots',
      ],
      useCase: 'Create impactful data stories',
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
            Data Visualization Mastery
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Transform complex data into clear, compelling visual stories
          </p>
        </div>

        {/* Chart Types */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {chartTypes.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {category.useCase}
                    </p>
                  </div>
                </div>

                {/* Types */}
                <div className="grid grid-cols-2 gap-3">
                  {category.types.map((type, typeIndex) => (
                    <div
                      key={typeIndex}
                      className="flex items-center gap-2 p-3 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-700 dark:to-blue-900/20 rounded-lg hover:scale-105 transition-transform duration-300"
                    >
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${category.color}`} />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Best Practices */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">
            Visualization Best Practices
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-xl p-6">
              <h4 className="font-bold mb-3">Choose the Right Chart</h4>
              <p className="text-sm text-blue-100">
                Match visualization type to data structure and story you want to tell
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <h4 className="font-bold mb-3">Design for Clarity</h4>
              <p className="text-sm text-blue-100">
                Use color, labels, and annotations to guide viewer attention
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <h4 className="font-bold mb-3">Tell a Story</h4>
              <p className="text-sm text-blue-100">
                Combine visuals with narrative to create compelling data stories
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            24+ chart types • Python, R, and Tableau tutorials • Interactive dashboards
          </p>
        </div>
      </div>
    </section>
  );
}
