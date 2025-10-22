"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Flame, Star, Calendar } from 'lucide-react';

interface HeroBadgeSystemProps {
  badges: {
    isBestseller?: boolean;
    isHotAndNew?: boolean;
    isHighestRated?: boolean;
    lastUpdated?: string;
  };
}

export const HeroBadgeSystem = ({ badges }: HeroBadgeSystemProps): JSX.Element => {
  const badgeList: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    bgColor: string;
    borderColor: string;
    iconColor: string;
  }> = [];

  // Bestseller badge (if in top 10% of category)
  if (badges.isBestseller) {
    badgeList.push({
      id: 'bestseller',
      label: 'Bestseller',
      icon: <TrendingUp className="w-3 h-3" aria-hidden="true" />,
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-400/50',
      iconColor: 'text-amber-300',
    });
  }

  // Hot & New badge (if < 30 days old)
  if (badges.isHotAndNew) {
    badgeList.push({
      id: 'hot-new',
      label: 'Hot & New',
      icon: <Flame className="w-3 h-3" aria-hidden="true" />,
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-400/50',
      iconColor: 'text-orange-300',
    });
  }

  // Highest Rated badge (if rating > 4.7)
  if (badges.isHighestRated) {
    badgeList.push({
      id: 'highest-rated',
      label: 'Highest Rated',
      icon: <Star className="w-3 h-3" aria-hidden="true" />,
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-400/50',
      iconColor: 'text-purple-300',
    });
  }

  // Updated badge (show last update month/year)
  if (badges.lastUpdated) {
    badgeList.push({
      id: 'updated',
      label: `Updated ${badges.lastUpdated}`,
      icon: <Calendar className="w-3 h-3" aria-hidden="true" />,
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-400/50',
      iconColor: 'text-blue-300',
    });
  }

  if (badgeList.length === 0) {
    return <></>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="flex flex-wrap items-center gap-2 mb-3"
    >
      {badgeList.map((badge: {
        id: string;
        label: string;
        icon: React.ReactNode;
        bgColor: string;
        borderColor: string;
        iconColor: string;
      }, index: number) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + index * 0.1, duration: 0.3 }}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
            ${badge.bgColor} backdrop-blur-md border ${badge.borderColor}
            text-white text-xs font-semibold shadow-lg
          `}
        >
          <span className={badge.iconColor}>{badge.icon}</span>
          <span>{badge.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
};
