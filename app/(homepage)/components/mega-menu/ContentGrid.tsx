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
          <p className="text-xs text-slate-600 dark:text-slate-300">
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
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Check back soon for updates
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Premium Hero Card with 3D Effect */}
      {heroCard && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        >
          <Link
            href={heroCard.href}
            onClick={() => onItemClick?.(heroCard)}
            className="group block relative overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/40 hover:border-slate-300/80 dark:hover:border-slate-600/60 transition-all duration-300 bg-white dark:bg-slate-800/40 hover:scale-[1.01]"
            style={{
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(0, 0, 0, 0.1), 0 8px 24px -4px rgba(0, 0, 0, 0.12), 0 16px 48px -8px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.06)';
            }}
          >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5">
            {/* Image with Premium Effects */}
            {heroCard.image && variant === 'rich' && (
              <div className="relative h-36 sm:h-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/80 dark:to-slate-800/60 ring-1 ring-slate-200/40 dark:ring-slate-700/30">
                {/* Image glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                
                <Image
                  src={heroCard.image}
                  alt={heroCard.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                  sizes="(max-width: 640px) 100vw, 320px"
                />
                {heroCard.tag && (
                  <span className="absolute top-3 left-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/98 dark:bg-slate-900/98 text-slate-900 dark:text-white backdrop-blur-md shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 z-20">
                    {heroCard.tag}
                  </span>
                )}
              </div>
            )}

            {/* Content with Enhanced Typography */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-400/40 shadow-sm">
                  Featured
                </span>
                {heroCard.readingTime && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {heroCard.readingTime}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2.5 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 tracking-tight leading-snug">
                {heroCard.title}
              </h3>
              {heroCard.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {heroCard.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-3 transition-all duration-200">
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

            {/* Premium Accent Border with Gradient */}
            <div
              className="absolute top-0 inset-x-0 h-[1px]"
              style={{ 
                background: `linear-gradient(90deg, transparent, ${topic.accentHex}90, ${topic.accentHex}, ${topic.accentHex}90, transparent)`,
              }}
              aria-hidden="true"
            />
            <div
              className="absolute top-0 inset-x-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ 
                background: `linear-gradient(90deg, transparent, ${topic.accentHex}60, ${topic.accentHex}, ${topic.accentHex}60, transparent)`,
                boxShadow: `0 1px 8px ${topic.accentHex}50`
              }}
              aria-hidden="true"
            />
          </Link>
        </motion.div>
      )}

      {/* Premium Mini Cards Grid with Staggered Animation */}
      {miniCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {miniCards.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + index * 0.05, ease: [0.4, 0, 0.2, 1] }}
            >
              <Link
                href={item.href}
                onClick={() => onItemClick?.(item)}
                className="group flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/40 hover:border-slate-300/80 dark:hover:border-slate-600/60 hover:bg-gradient-to-br hover:from-slate-50 hover:to-white dark:hover:from-slate-800/40 dark:hover:to-slate-800/20 transition-all duration-300 bg-white dark:bg-slate-800/25 hover:scale-[1.02]"
                style={{
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 4px 16px -4px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.03)';
                }}
              >
                {/* Icon or Image with 3D Effect */}
                {item.image && variant === 'rich' ? (
                  <div className="relative w-13 h-13 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/80 flex-shrink-0 ring-1 ring-slate-200/40 dark:ring-slate-700/30 group-hover:ring-slate-300/60 dark:group-hover:ring-slate-600/50 transition-all">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                      sizes="52px"
                    />
                  </div>
                ) : (
                  <div
                    className="relative w-13 h-13 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 duration-300"
                    style={{ 
                      backgroundColor: `${topic.accentHex}12`,
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    {/* Inner glow */}
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-md"
                      style={{ backgroundColor: `${topic.accentHex}30` }}
                    />
                    
                    <div
                      className="relative w-7 h-7 rounded-full shadow-sm ring-1 ring-white/20 dark:ring-white/10"
                      style={{ 
                        backgroundColor: topic.accentHex,
                        boxShadow: `0 2px 6px -2px ${topic.accentHex}60`
                      }}
                    />
                  </div>
                )}

                {/* Content with Enhanced Typography */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 mb-1.5 tracking-tight leading-snug">
                    {item.title}
                  </h4>
                  {item.readingTime && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <Clock className="w-3 h-3" />
                      {item.readingTime}
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Premium See All Link */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <Link
          href={seeAllHref}
          onClick={onSeeAllClick}
          className="flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl border-2 border-dashed border-slate-300/70 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-600/60 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/15 dark:hover:to-purple-900/15 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 group hover:scale-[1.01]"
          style={{
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
          }}
        >
          <span className="tracking-wide">See all in {topic.label}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </motion.div>

      {/* Premium Concept Chips */}
      {conceptChips.length > 0 && (
        <motion.div
          className="flex flex-wrap gap-2.5 pt-4 border-t border-slate-200/40 dark:border-slate-700/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          style={{
            borderImage: 'linear-gradient(to right, transparent, rgba(148, 163, 184, 0.2), transparent) 1',
          }}
        >
          {conceptChips.map((chip, index) => (
            <motion.div
              key={chip.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.45 + index * 0.03, ease: [0.4, 0, 0.2, 1] }}
            >
              <Link
                href={chip.href}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 hover:scale-105"
                style={{
                  borderColor: `${chip.accentColor || topic.accentHex}40`,
                  color: chip.accentColor || topic.accentHex,
                  backgroundColor: `${chip.accentColor || topic.accentHex}06`,
                  boxShadow: `0 1px 2px -1px ${chip.accentColor || topic.accentHex}20`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${chip.accentColor || topic.accentHex}12`;
                  e.currentTarget.style.borderColor = `${chip.accentColor || topic.accentHex}60`;
                  e.currentTarget.style.boxShadow = `0 2px 6px -2px ${chip.accentColor || topic.accentHex}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${chip.accentColor || topic.accentHex}06`;
                  e.currentTarget.style.borderColor = `${chip.accentColor || topic.accentHex}40`;
                  e.currentTarget.style.boxShadow = `0 1px 2px -1px ${chip.accentColor || topic.accentHex}20`;
                }}
              >
                #{chip.label}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};
