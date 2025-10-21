"use client";

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useCommerce } from '@/components/commerce/commerce-context';
import { Tag, TrendingDown } from 'lucide-react';

interface PricingDisplayProps {
  currentPrice: number | null;
  originalPrice?: number | null;
  currency?: string;
  locale?: string;
  compact?: boolean;
}

export const PricingDisplay = ({
  currentPrice,
  originalPrice,
  currency,
  locale,
  compact = false,
}: PricingDisplayProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  const commerce = useCommerce();
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
    const resolvedLocale =
      locale || commerce.locale || (typeof Intl !== 'undefined' ? Intl.NumberFormat().resolvedOptions().locale : 'en-US') || 'en-US';
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency: currency || commerce.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const isFree = currentPrice === null || currentPrice === 0;
  const hasDiscount = discountPercent > 0;

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
      className={compact ? 'space-y-2' : 'space-y-3'}
    >
      {/* Discount Badge */}
      {hasDiscount && (
        <motion.div
          initial={prefersReducedMotion ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 200, delay: 0.1 }}
          className={`inline-flex items-center gap-2 ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full font-bold shadow-lg`}
        >
          <Tag className="w-4 h-4" />
          <span>{discountPercent}% OFF</span>
        </motion.div>
      )}

      {/* Pricing */}
      <div className="flex items-baseline gap-3">
        {/* Current Price */}
        <div className={`${compact ? 'text-2xl md:text-3xl' : 'text-4xl'} font-bold ${isFree ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
          {formatPrice(currentPrice)}
        </div>

        {/* Original Price (strikethrough) */}
        {hasDiscount && originalPrice && (
          <div className={`${compact ? 'text-base md:text-lg' : 'text-xl'} text-gray-500 dark:text-gray-400 line-through`}>
            {formatPrice(originalPrice)}
          </div>
        )}
      </div>

      {/* Savings Amount */}
      {!compact && hasDiscount && savingsAmount > 0 && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.2 }}
          className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold"
        >
          <TrendingDown className="w-4 h-4" />
          <span>You save {formatPrice(savingsAmount)}</span>
        </motion.div>
      )}
    </motion.div>
  );
};
