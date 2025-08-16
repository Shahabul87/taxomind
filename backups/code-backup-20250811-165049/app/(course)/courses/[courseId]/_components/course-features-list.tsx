"use client";

import React from 'react';

interface CourseFeaturesListProps {
  features?: string[];
}

export const CourseFeaturesList = ({ features }: CourseFeaturesListProps) => {
  const defaultFeatures = [
    'Lifetime Access',
    'Mobile & Desktop Access',
    'Certificate of Completion',
    'Downloadable Resources',
  ];

  const featuresList = features || defaultFeatures;

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Course Features</h3>
      <ul className="space-y-3">
        {featuresList.map((feature, index) => (
          <li key={index} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}; 