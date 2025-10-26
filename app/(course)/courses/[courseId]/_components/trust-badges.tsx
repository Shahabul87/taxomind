"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CreditCard, Heart, Lock } from 'lucide-react';

interface TrustBadgesProps {
  averageRating?: number;
  reviewsCount?: number;
}

export const TrustBadges = ({ averageRating, reviewsCount }: TrustBadgesProps): JSX.Element => {
  // Format rating display
  const ratingText = averageRating && reviewsCount && reviewsCount > 0
    ? `${averageRating.toFixed(1)}/5 from ${reviewsCount} ${reviewsCount === 1 ? 'review' : 'reviews'}`
    : 'Highly rated course';

  const badges = [
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      label: '30-Day Guarantee',
      description: 'Money back if not satisfied',
    },
    {
      icon: <Lock className="w-5 h-5" />,
      label: 'Secure Checkout',
      description: 'SSL encrypted payment',
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      label: 'Payment Methods',
      description: 'All major cards accepted',
    },
    {
      icon: <Heart className="w-5 h-5" />,
      label: 'Satisfaction',
      description: ratingText,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="pt-6 border-t border-gray-200 dark:border-gray-700"
    >
      <div className="grid grid-cols-2 gap-3">
        {badges.map((badge: {
          icon: React.ReactNode;
          label: string;
          description: string;
        }, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="flex flex-col items-center text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-2">
              {badge.icon}
            </div>
            <div className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">
              {badge.label}
            </div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400">
              {badge.description}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Money-Back Guarantee Highlight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <p className="text-xs text-emerald-900 dark:text-emerald-100">
            <span className="font-semibold">Risk-free guarantee:</span> Full refund within 30 days if you&apos;re not completely satisfied
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
