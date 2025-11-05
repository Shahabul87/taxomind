'use client';

/**
 * Strategies Section - Marketing Category
 *
 * Modern marketing strategies and tactics
 */

import { Target, TrendingUp, Users, Megaphone } from 'lucide-react';
import type { BaseSectionProps } from '../../../_types/section.types';

export function StrategiesSection({ course }: BaseSectionProps) {
  const strategies = [
    {
      name: 'Content Marketing',
      icon: Megaphone,
      description: 'Create valuable content that attracts and engages your audience',
      tactics: ['Blog Posts', 'Video Marketing', 'Podcasts', 'Infographics', 'E-books'],
      roi: '+300% Lead Generation',
      color: 'from-blue-600 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10',
    },
    {
      name: 'Social Media Marketing',
      icon: Users,
      description: 'Build brand awareness and engage with customers on social platforms',
      tactics: ['Instagram Ads', 'LinkedIn B2B', 'TikTok Growth', 'Community Building', 'Influencer Marketing'],
      roi: '+250% Engagement Rate',
      color: 'from-purple-600 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10',
    },
    {
      name: 'SEO &amp; SEM',
      icon: TrendingUp,
      description: 'Optimize for search engines and drive qualified traffic',
      tactics: ['Keyword Research', 'On-Page SEO', 'Link Building', 'Google Ads', 'Local SEO'],
      roi: '+400% Organic Traffic',
      color: 'from-green-600 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10',
    },
    {
      name: 'Email Marketing',
      icon: Target,
      description: 'Nurture leads and convert prospects with targeted email campaigns',
      tactics: ['Drip Campaigns', 'Segmentation', 'A/B Testing', 'Automation', 'Personalization'],
      roi: '+380% Conversion Rate',
      color: 'from-orange-600 to-red-600',
      bgColor: 'from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10',
    },
  ];

  return (
    <section className="py-16 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Proven Marketing Strategies
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Master data-driven marketing strategies that deliver measurable ROI
          </p>
        </div>

        {/* Strategies */}
        <div className="space-y-8">
          {strategies.map((strategy, index) => {
            const IconComponent = strategy.icon;
            return (
              <div
                key={index}
                className={`bg-gradient-to-br ${strategy.bgColor} rounded-2xl p-8 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300`}
              >
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Left: Strategy Info */}
                  <div className="md:col-span-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${strategy.color} flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                          {strategy.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {strategy.description}
                        </p>
                      </div>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${strategy.color} text-white rounded-lg text-sm font-semibold`}>
                      <TrendingUp className="w-4 h-4" />
                      {strategy.roi}
                    </div>
                  </div>

                  {/* Right: Tactics */}
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">
                      KEY TACTICS COVERED
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {strategy.tactics.map((tactic, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300 group"
                        >
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${strategy.color} group-hover:scale-150 transition-transform duration-300`} />
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {tactic}
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

        {/* Additional Strategies */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">
            Plus These Advanced Strategies
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              'Growth Hacking',
              'Conversion Rate Optimization',
              'Marketing Automation',
              'Affiliate Marketing',
              'Brand Positioning',
              'Customer Retention',
            ].map((strategy, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-2 h-2 rounded-full bg-white" />
                <span className="text-sm font-medium">{strategy}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
