'use client';

/**
 * Datasets Section - AI/ML Category
 */

import { Database, Download, TrendingUp } from 'lucide-react';
import type { AIMLSectionProps } from '../../../_types/section.types';

export function DatasetsSection({ course, datasets = [] }: AIMLSectionProps) {
  // Demo datasets
  const datasetsList = datasets.length > 0 ? datasets : [
    { name: 'ImageNet', size: '14M images', type: 'Computer Vision' },
    { name: 'MNIST', size: '70K images', type: 'Handwriting Recognition' },
    { name: 'COCO', size: '330K images', type: 'Object Detection' },
    { name: 'WikiText', size: '100M tokens', type: 'NLP' },
  ];

  return (
    <section className="py-16 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Real-World Datasets
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Train models with industry-standard datasets used by leading AI companies
          </p>
        </div>

        {/* Datasets Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {datasetsList.map((dataset, index) => {
            const datasetName = typeof dataset === 'string' ? dataset : dataset.name;
            const datasetSize = typeof dataset === 'string' ? '' : dataset.size;
            const datasetType = typeof dataset === 'string' ? '' : dataset.type;

            return (
              <div
                key={index}
                className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                      {datasetName}
                    </h3>
                    {datasetType && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                        {datasetType}
                      </span>
                    )}
                  </div>
                  <Download className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>

                {datasetSize && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>{datasetSize}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Access to download links and preprocessing tutorials included
          </p>
        </div>
      </div>
    </section>
  );
}
