'use client';

/**
 * Algorithms Section - AI/ML Category
 *
 * Showcases key AI/ML algorithms covered in the course
 */

import { Brain, Zap, TrendingUp, Network } from 'lucide-react';
import type { AIMLSectionProps } from '../../../_types/section.types';

export function AlgorithmsSection({ course }: AIMLSectionProps) {
  // AI/ML algorithms with categories
  const algorithmCategories = [
    {
      category: 'Supervised Learning',
      icon: Brain,
      color: 'from-purple-600 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10',
      algorithms: [
        'Linear Regression',
        'Logistic Regression',
        'Decision Trees',
        'Random Forest',
        'Support Vector Machines',
        'Neural Networks',
      ],
    },
    {
      category: 'Unsupervised Learning',
      icon: Network,
      color: 'from-blue-600 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10',
      algorithms: [
        'K-Means Clustering',
        'Hierarchical Clustering',
        'DBSCAN',
        'PCA (Principal Component Analysis)',
        'Autoencoders',
        'Anomaly Detection',
      ],
    },
    {
      category: 'Deep Learning',
      icon: Zap,
      color: 'from-orange-600 to-red-600',
      bgColor: 'from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10',
      algorithms: [
        'Convolutional Neural Networks',
        'Recurrent Neural Networks',
        'LSTM & GRU',
        'Transformers',
        'GANs (Generative Adversarial Networks)',
        'Reinforcement Learning',
      ],
    },
    {
      category: 'Optimization',
      icon: TrendingUp,
      color: 'from-green-600 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10',
      algorithms: [
        'Gradient Descent',
        'Stochastic Gradient Descent',
        'Adam Optimizer',
        'RMSprop',
        'Learning Rate Scheduling',
        'Batch Normalization',
      ],
    },
  ];

  return (
    <section className="py-16 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 mb-6">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            AI/ML Algorithms Mastery
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Learn and implement industry-standard machine learning algorithms from scratch
          </p>
        </div>

        {/* Algorithm Categories */}
        <div className="space-y-8">
          {algorithmCategories.map((category, catIndex) => {
            const IconComponent = category.icon;
            return (
              <div
                key={catIndex}
                className={`bg-gradient-to-br ${category.bgColor} rounded-2xl p-8 border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-300`}
              >
                {/* Category Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {category.category}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {category.algorithms.length} algorithms
                    </p>
                  </div>
                </div>

                {/* Algorithms Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.algorithms.map((algorithm, algIndex) => (
                    <div
                      key={algIndex}
                      className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 group"
                    >
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${category.color} group-hover:scale-150 transition-transform duration-300`} />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {algorithm}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Learning Path */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">Structured Learning Path</h3>
            <p className="text-purple-100 mb-6">
              Each algorithm includes theory, mathematical foundations, implementation from scratch,
              and real-world applications with production-ready code examples.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                <Brain className="w-4 h-4" />
                <span>Theory &amp; Math</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                <Zap className="w-4 h-4" />
                <span>Hands-on Coding</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                <TrendingUp className="w-4 h-4" />
                <span>Performance Tuning</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                <Network className="w-4 h-4" />
                <span>Real Projects</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              24+
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Algorithms Covered
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-600 dark:text-pink-400 mb-1">
              50+
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Coding Exercises
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              10+
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Real Projects
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
              100%
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              From Scratch
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
