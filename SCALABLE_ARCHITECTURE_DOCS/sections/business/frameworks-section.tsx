'use client';

/**
 * Frameworks Section - Business Category
 *
 * Strategic business frameworks and methodologies
 */

import { Target, Layers, GitBranch, PieChart } from 'lucide-react';
import type { BaseSectionProps } from '../../../_types/section.types';

export function FrameworksSection({ course }: BaseSectionProps) {
  const frameworks = [
    {
      name: 'SWOT Analysis',
      icon: Target,
      description: 'Identify Strengths, Weaknesses, Opportunities, and Threats',
      applications: ['Strategic Planning', 'Market Analysis', 'Competitive Positioning'],
      color: 'from-blue-600 to-cyan-600',
    },
    {
      name: 'Porter&apos;s Five Forces',
      icon: Layers,
      description: 'Analyze competitive forces shaping your industry',
      applications: ['Industry Analysis', 'Competitive Strategy', 'Market Entry'],
      color: 'from-purple-600 to-pink-600',
    },
    {
      name: 'Business Model Canvas',
      icon: PieChart,
      description: 'Design and visualize your business model',
      applications: ['Startup Planning', 'Innovation', 'Value Proposition'],
      color: 'from-green-600 to-emerald-600',
    },
    {
      name: 'OKR Framework',
      icon: GitBranch,
      description: 'Set and track Objectives and Key Results',
      applications: ['Goal Setting', 'Performance Management', 'Team Alignment'],
      color: 'from-orange-600 to-red-600',
    },
  ];

  return (
    <section className="py-16 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Strategic Business Frameworks
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Master proven frameworks used by Fortune 500 companies and top consultants
          </p>
        </div>

        {/* Frameworks Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {frameworks.map((framework, index) => {
            const IconComponent = framework.icon;
            return (
              <div
                key={index}
                className="group bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 rounded-2xl p-8 border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${framework.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {framework.name}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {framework.description}
                    </p>
                  </div>
                </div>

                {/* Applications */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
                    APPLICATIONS
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {framework.applications.map((app, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg border border-slate-200 dark:border-slate-600"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Frameworks List */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">
            Also Learn These Essential Frameworks
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              'McKinsey 7S Framework',
              'Ansoff Matrix',
              'BCG Matrix',
              'Value Chain Analysis',
              'PESTEL Analysis',
              'Blue Ocean Strategy',
              'Lean Canvas',
              'Growth-Share Matrix',
              'Balanced Scorecard',
            ].map((framework, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-2 h-2 rounded-full bg-white" />
                <span className="text-sm font-medium">{framework}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              15+
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Frameworks
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
              50+
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Templates
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              30+
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Examples
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-600 dark:text-pink-400 mb-1">
              100%
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Practical
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
