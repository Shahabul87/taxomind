'use client';

/**
 * Case Studies Section - Business Category
 *
 * Real-world business case studies and scenarios
 */

import { Briefcase, TrendingUp, Users, Award } from 'lucide-react';
import type { BaseSectionProps } from '../../../_types/section.types';

export function CaseStudiesSection({ course }: BaseSectionProps) {
  const caseStudies = [
    {
      company: 'Tech Startup Growth',
      industry: 'Technology',
      icon: TrendingUp,
      challenge: 'Scale from 10 to 500 employees in 18 months',
      outcome: '300% revenue growth, successful Series B funding',
      metrics: { revenue: '+300%', team: '500+', funding: '$50M' },
    },
    {
      company: 'Retail Transformation',
      industry: 'E-commerce',
      icon: Briefcase,
      challenge: 'Digital transformation of traditional retail business',
      outcome: 'Successful omnichannel strategy, 5x online sales',
      metrics: { online: '5x', stores: '200+', satisfaction: '94%' },
    },
    {
      company: 'Global Expansion',
      industry: 'SaaS',
      icon: Users,
      challenge: 'Enter 15 new international markets',
      outcome: 'Successful market entry, $100M ARR milestone',
      metrics: { markets: '15', arr: '$100M', customers: '10K+' },
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Real-World Case Studies
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Learn from actual business challenges and proven strategies from successful companies
          </p>
        </div>

        {/* Case Studies */}
        <div className="space-y-6">
          {caseStudies.map((study, index) => {
            const IconComponent = study.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Left: Company Info */}
                  <div className="md:col-span-1">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                          {study.company}
                        </h3>
                        <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full">
                          {study.industry}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Challenge & Outcome */}
                  <div className="md:col-span-1 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                        CHALLENGE
                      </h4>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {study.challenge}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                        OUTCOME
                      </h4>
                      <p className="text-slate-700 dark:text-slate-300">
                        {study.outcome}
                      </p>
                    </div>
                  </div>

                  {/* Right: Metrics */}
                  <div className="md:col-span-1">
                    <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">
                      KEY METRICS
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(study.metrics).map(([key, value], i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg"
                        >
                          <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                            {key}
                          </span>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
          <Award className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">10+ In-Depth Case Studies</h3>
          <p className="text-blue-100 max-w-2xl mx-auto">
            Analyze real business scenarios, develop strategic solutions, and learn from
            success stories across various industries
          </p>
        </div>
      </div>
    </section>
  );
}
