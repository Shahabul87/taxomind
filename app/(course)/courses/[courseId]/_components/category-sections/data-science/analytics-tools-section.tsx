'use client';

/**
 * Analytics Tools Section - Data Science Category
 *
 * Data science tools and platforms
 */

import { Database, BarChart3, Code2, Cpu } from 'lucide-react';
import type { BaseSectionProps } from '../../../_types/section.types';

export function AnalyticsToolsSection({ course }: BaseSectionProps) {
  const toolCategories = [
    {
      category: 'Programming Languages',
      icon: Code2,
      color: 'from-blue-600 to-cyan-600',
      tools: [
        { name: 'Python', skills: ['NumPy', 'Pandas', 'Scikit-learn', 'TensorFlow'] },
        { name: 'R', skills: ['ggplot2', 'dplyr', 'tidyr', 'caret'] },
        { name: 'SQL', skills: ['PostgreSQL', 'MySQL', 'BigQuery', 'Snowflake'] },
      ],
    },
    {
      category: 'Visualization',
      icon: BarChart3,
      color: 'from-purple-600 to-pink-600',
      tools: [
        { name: 'Tableau', skills: ['Dashboards', 'Data Blending', 'Calculations'] },
        { name: 'Power BI', skills: ['DAX', 'Power Query', 'Visualizations'] },
        { name: 'Matplotlib/Seaborn', skills: ['Statistical Plots', 'Customization'] },
      ],
    },
    {
      category: 'Big Data',
      icon: Database,
      color: 'from-green-600 to-emerald-600',
      tools: [
        { name: 'Apache Spark', skills: ['PySpark', 'Spark SQL', 'MLlib'] },
        { name: 'Hadoop', skills: ['HDFS', 'MapReduce', 'Hive'] },
        { name: 'AWS/GCP/Azure', skills: ['Cloud Storage', 'Compute', 'Services'] },
      ],
    },
    {
      category: 'ML Platforms',
      icon: Cpu,
      color: 'from-orange-600 to-red-600',
      tools: [
        { name: 'Jupyter', skills: ['Notebooks', 'Kernels', 'Extensions'] },
        { name: 'MLflow', skills: ['Tracking', 'Projects', 'Models'] },
        { name: 'Kubernetes', skills: ['Deployment', 'Scaling', 'Monitoring'] },
      ],
    },
  ];

  return (
    <section className="py-16 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Data Science Tech Stack
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Master the complete toolkit used by professional data scientists
          </p>
        </div>

        {/* Tool Categories */}
        <div className="grid md:grid-cols-2 gap-8">
          {toolCategories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 rounded-2xl p-8 border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {category.category}
                  </h3>
                </div>

                {/* Tools */}
                <div className="space-y-4">
                  {category.tools.map((tool, toolIndex) => (
                    <div
                      key={toolIndex}
                      className="bg-white dark:bg-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                        {tool.name}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {tool.skills.map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Learning Path */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">
            Comprehensive Hands-On Training
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">12+</div>
              <div className="text-blue-100">Tools &amp; Platforms</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">30+</div>
              <div className="text-blue-100">Skills Covered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-blue-100">Practice Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Industry-Relevant</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
