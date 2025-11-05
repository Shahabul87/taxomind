'use client';

/**
 * Model Architecture Section - AI/ML Category
 */

import { Brain, Layers, Cpu } from 'lucide-react';
import type { AIMLSectionProps } from '../../../_types/section.types';

export function ModelArchitectureSection({ course, models = [] }: AIMLSectionProps) {
  // Demo models
  const modelsList = models.length > 0 ? models : [
    { name: 'CNN', description: 'Convolutional Neural Networks', icon: Layers },
    { name: 'RNN', description: 'Recurrent Neural Networks', icon: Brain },
    { name: 'Transformers', description: 'Attention-based Models', icon: Cpu },
    { name: 'BERT', description: 'Bidirectional Encoder Representations', icon: Layers },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Model Architectures Covered
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Master cutting-edge AI architectures and understand how they work under the hood
          </p>
        </div>

        {/* Models Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modelsList.map((model, index) => {
            const IconComponent = typeof model === 'string' ? Brain : model.icon;
            const modelName = typeof model === 'string' ? model : model.name;
            const modelDesc = typeof model === 'string' ? '' : model.description;

            return (
              <div
                key={index}
                className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {modelName}
                </h3>
                {modelDesc && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {modelDesc}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Learn theory, implementation, and real-world applications of each architecture
          </p>
        </div>
      </div>
    </section>
  );
}
