"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Video,
  FileText,
  Code2,
  Infinity,
  Smartphone,
  Award,
  ShieldCheck,
} from 'lucide-react';

interface CourseIncludesListProps {
  totalHours?: number;
  totalResources?: number;
  totalExercises?: number;
  hasLifetimeAccess?: boolean;
  hasMobileAccess?: boolean;
  hasCertificate?: boolean;
  hasMoneyBackGuarantee?: boolean;
}

export const CourseIncludesList = ({
  totalHours,
  totalResources,
  totalExercises,
  hasLifetimeAccess = true,
  hasMobileAccess = true,
  hasCertificate = true,
  hasMoneyBackGuarantee = true,
}: CourseIncludesListProps): JSX.Element => {
  interface IncludeItem {
    icon: React.ReactNode;
    label: string;
    show: boolean;
  }

  const includes: IncludeItem[] = [
    {
      icon: <Video className="w-5 h-5" />,
      label: totalHours
        ? `${totalHours} hour${totalHours > 1 ? 's' : ''} on-demand video`
        : 'On-demand video content',
      show: true,
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: totalResources
        ? `${totalResources} downloadable resource${totalResources > 1 ? 's' : ''}`
        : 'Downloadable resources',
      show: totalResources !== undefined && totalResources > 0,
    },
    {
      icon: <Code2 className="w-5 h-5" />,
      label: totalExercises
        ? `${totalExercises} coding exercise${totalExercises > 1 ? 's' : ''}`
        : 'Hands-on exercises',
      show: totalExercises !== undefined && totalExercises > 0,
    },
    {
      icon: <Infinity className="w-5 h-5" />,
      label: 'Full lifetime access',
      show: hasLifetimeAccess,
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      label: 'Access on mobile and TV',
      show: hasMobileAccess,
    },
    {
      icon: <Award className="w-5 h-5" />,
      label: 'Certificate of completion',
      show: hasCertificate,
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      label: '30-day money-back guarantee',
      show: hasMoneyBackGuarantee,
    },
  ];

  const visibleIncludes = includes.filter((item: IncludeItem) => item.show);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="space-y-3"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        This course includes:
      </h3>

      <div className="space-y-2.5">
        {visibleIncludes.map((item: IncludeItem, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="flex items-start gap-3 text-sm"
          >
            <div className="flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="text-gray-500 dark:text-gray-400">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
