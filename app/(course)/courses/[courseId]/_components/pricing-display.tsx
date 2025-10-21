"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Tag, TrendingDown } from 'lucide-react';

interface PricingDisplayProps {
  currentPrice: number | null;
  originalPrice?: number | null;
  currency?: string;
}

export const PricingDisplay = ({
  currentPrice,
  originalPrice,
  currency = 'USD',
}: PricingDisplayProps): JSX.Element => {
  // Calculate discount percentage
  const discountPercent = originalPrice && currentPrice && originalPrice > currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  // Calculate savings amount
  const savingsAmount = originalPrice && currentPrice && originalPrice > currentPrice
    ? originalPrice - currentPrice
    : 0;

  // Format price
  const formatPrice = (price: number | null): string => {
    if (price === null || price === 0) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  const isFree = currentPrice === null || currentPrice === 0;
  const hasDiscount = discountPercent > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      {/* Discount Badge */}
      {hasDiscount && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-bold shadow-lg"
        >
          <Tag className="w-4 h-4" />
          <span>{discountPercent}% OFF</span>
        </motion.div>
      )}

      {/* Pricing */}
      <div className="flex items-baseline gap-3">
        {/* Current Price */}
        <div className={`text-4xl font-bold ${isFree ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
          {formatPrice(currentPrice)}
        </div>

        {/* Original Price (strikethrough) */}
        {hasDiscount && originalPrice && (
          <div className="text-xl text-gray-500 dark:text-gray-400 line-through">
            {formatPrice(originalPrice)}
          </div>
        )}
      </div>

      {/* Savings Amount */}
      {hasDiscount && savingsAmount > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold"
        >
          <TrendingDown className="w-4 h-4" />
          <span>You save {formatPrice(savingsAmount)}</span>
        </motion.div>
      )}
    </motion.div>
  );
};
