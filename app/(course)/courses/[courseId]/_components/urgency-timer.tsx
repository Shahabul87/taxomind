"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame, Users } from 'lucide-react';

interface UrgencyTimerProps {
  dealEndDate?: Date | null;
  spotsRemaining?: number | null;
  showFlashSale?: boolean;
}

export const UrgencyTimer = ({
  dealEndDate,
  spotsRemaining,
  showFlashSale = false,
}: UrgencyTimerProps): JSX.Element | null => {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!dealEndDate) return;

    const calculateTimeRemaining = (): void => {
      const now = new Date().getTime();
      const end = new Date(dealEndDate).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeRemaining(null);
        return;
      }

      setTimeRemaining({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [dealEndDate]);

  // Don't render if no urgency indicators
  if (!timeRemaining && !spotsRemaining && !showFlashSale) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Flash Sale Badge */}
      {showFlashSale && (
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'reverse',
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-bold text-sm shadow-lg"
        >
          <Flame className="w-4 h-4" />
          <span>FLASH SALE</span>
        </motion.div>
      )}

      {/* Countdown Timer */}
      {timeRemaining && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-semibold text-red-900 dark:text-red-100">
              {timeRemaining.days > 0
                ? `${timeRemaining.days} day${timeRemaining.days > 1 ? 's' : ''} left at this price!`
                : 'Last chance at this price!'}
            </span>
          </div>

          {/* Timer Display */}
          <div className="flex items-center gap-2">
            {timeRemaining.days > 0 && (
              <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg px-3 py-2 min-w-[60px]">
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {timeRemaining.days}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {timeRemaining.days === 1 ? 'Day' : 'Days'}
                </span>
              </div>
            )}

            <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg px-3 py-2 min-w-[60px]">
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {String(timeRemaining.hours).padStart(2, '0')}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">Hours</span>
            </div>

            <span className="text-red-600 dark:text-red-400 font-bold">:</span>

            <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg px-3 py-2 min-w-[60px]">
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {String(timeRemaining.minutes).padStart(2, '0')}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">Mins</span>
            </div>

            <span className="text-red-600 dark:text-red-400 font-bold">:</span>

            <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg px-3 py-2 min-w-[60px]">
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {String(timeRemaining.seconds).padStart(2, '0')}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">Secs</span>
            </div>
          </div>
        </div>
      )}

      {/* Limited Spots */}
      {spotsRemaining !== null && spotsRemaining !== undefined && spotsRemaining > 0 && spotsRemaining <= 20 && (
        <motion.div
          animate={{
            scale: spotsRemaining <= 5 ? [1, 1.02, 1] : 1,
          }}
          transition={{
            duration: 1.5,
            repeat: spotsRemaining <= 5 ? Number.POSITIVE_INFINITY : 0,
            repeatType: 'reverse',
          }}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${
            spotsRemaining <= 5
              ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800'
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-800'
          }`}
        >
          <Users
            className={`w-5 h-5 ${
              spotsRemaining <= 5
                ? 'text-red-600 dark:text-red-400'
                : 'text-orange-600 dark:text-orange-400'
            }`}
          />
          <span
            className={`text-sm font-semibold ${
              spotsRemaining <= 5
                ? 'text-red-900 dark:text-red-100'
                : 'text-orange-900 dark:text-orange-100'
            }`}
          >
            Only {spotsRemaining} spot{spotsRemaining > 1 ? 's' : ''} left!
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};
