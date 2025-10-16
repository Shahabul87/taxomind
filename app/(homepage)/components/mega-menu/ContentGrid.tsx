"use client"

/**
 * ContentGrid Component
 * Dynamic content grid with hero card + mini cards
 * Shows 1 featured hero + 5 mini cards + concept chips
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import type { ContentGridProps } from '../../types/mega-menu-types';

export const ContentGrid: React.FC<ContentGridProps> = ({
  items,
  topic,
  seeAllHref,
  conceptChips = [],
  onItemClick,
  onSeeAllClick,
  variant = 'rich',
  isLoading = false,
  error = null,
}) => {
  // Separate hero and mini cards
  const heroCard = items.find(item => item.isFeatured) || items[0];
  const miniCards = items.filter(item => item !== heroCard).slice(0, 5);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 animate-pulse">
        <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            Failed to load content
          </h3>
          <p className="text-xs text-slate-600 dark:text-gray-400">
            {error.message || 'Please try again later'}
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            No content yet
          </h3>
          <p className="text-xs text-slate-600 dark:text-gray-400">
            Check back soon for updates
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Hero Card */}
      {heroCard && (
        <Link
          href={heroCard.href}
          onClick={() => onItemClick?.(heroCard)}
          className="group block relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:shadow-lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            {/* Image */}
            {heroCard.image && variant === 'rich' && (
              <div className="relative h-32 sm:h-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                <Image
                  src={heroCard.image}
                  alt={heroCard.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, 320px"
                />
                {heroCard.tag && (
                  <span className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded-md bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm">
                    {heroCard.tag}
                  </span>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
                  Featured
                </span>
                {heroCard.readingTime && (
                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-500">
                    <Clock className="w-3 h-3" />
                    {heroCard.readingTime}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {heroCard.title}
              </h3>
              {heroCard.description && (
                <p className="text-sm text-slate-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {heroCard.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Accent Border Top */}
          <div
            className="absolute top-0 inset-x-0 h-1"
            style={{ backgroundColor: topic.accentHex }}
            aria-hidden="true"
          />
        </Link>
      )}

      {/* Mini Cards Grid */}
      {miniCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {miniCards.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => onItemClick?.(item)}
              className="group flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
            >
              {/* Icon or Image */}
              {item.image && variant === 'rich' ? (
                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div
                  className="w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${topic.accentHex}15` }}
                >
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: topic.accentHex }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-1">
                  {item.title}
                </h4>
                {item.readingTime && (
                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-500">
                    <Clock className="w-3 h-3" />
                    {item.readingTime}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* See All Link */}
      <Link
        href={seeAllHref}
        onClick={onSeeAllClick}
        className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm font-medium text-slate-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-all group"
      >
        <span>See all in {topic.label}</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Concept Chips */}
      {conceptChips.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          {conceptChips.map((chip) => (
            <Link
              key={chip.id}
              href={chip.href}
              className="px-3 py-1 text-xs font-medium rounded-full border transition-all hover:scale-105"
              style={{
                borderColor: chip.accentColor || topic.accentHex,
                color: chip.accentColor || topic.accentHex,
              }}
            >
              #{chip.label}
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
};
