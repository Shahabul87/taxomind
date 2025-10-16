"use client"

/**
 * TopicRail Component
 * Left rail with vertical topic list and icons
 * Supports keyboard navigation and hover states
 */

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { TopicRailProps } from '../../types/mega-menu-types';

export const TopicRail: React.FC<TopicRailProps> = ({
  topics,
  activeTopic,
  onTopicSelect,
  onTopicHover,
  variant = 'rich',
  currentPathname,
}) => {
  const railRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Scroll active item into view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeTopic]);

  return (
    <div
      ref={railRef}
      className="flex flex-col space-y-1 min-w-[200px] max-w-[240px] pr-4 border-r border-slate-200 dark:border-slate-700"
      role="menubar"
      aria-label="Topics navigation"
      aria-orientation="vertical"
    >
      {topics.map((topic, index) => {
        const isActive = activeTopic === topic.slug;
        const isCurrentPage = currentPathname?.startsWith(`/${topic.slug}`);
        const Icon = topic.icon;

        return (
          <button
            key={topic.id}
            ref={isActive ? activeItemRef : null}
            onClick={() => onTopicSelect(topic.slug)}
            onMouseEnter={() => onTopicHover?.(topic.slug)}
            onFocus={() => onTopicSelect(topic.slug)}
            className={`
              group relative flex items-start gap-3 px-3 py-3 rounded-lg
              transition-all duration-200
              text-left w-full
              focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900
              ${isActive || isCurrentPage
                ? 'bg-slate-100 dark:bg-slate-800/70 text-slate-900 dark:text-white'
                : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }
            `}
            role="menuitem"
            aria-current={isCurrentPage ? 'page' : undefined}
            tabIndex={index === 0 || isActive ? 0 : -1}
          >
            {/* Accent Bar (Rich Variant) */}
            {variant === 'rich' && (isActive || isCurrentPage) && (
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                style={{ backgroundColor: topic.accentHex }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                aria-hidden="true"
              />
            )}

            {/* Icon */}
            <div
              className={`
                w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                transition-all duration-200
                ${isActive || isCurrentPage
                  ? `shadow-md dark:shadow-lg`
                  : 'group-hover:scale-105'
                }
              `}
              style={{
                backgroundColor: variant === 'rich'
                  ? `${topic.accentHex}${isActive ? '' : '15'}`
                  : 'rgba(148, 163, 184, 0.1)',
              }}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive || isCurrentPage
                    ? 'text-white'
                    : 'text-slate-600 dark:text-gray-400'
                }`}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold truncate">
                  {topic.label}
                </span>
                {topic.badge && (
                  <span
                    className={`
                      px-1.5 py-0.5 text-[10px] font-semibold rounded-md
                      ${topic.badge.variant === 'new' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : ''}
                      ${topic.badge.variant === 'ai' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-400/40' : ''}
                      ${topic.badge.variant === 'beta' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' : ''}
                      ${topic.badge.variant === 'pro' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' : ''}
                      ${topic.badge.className || ''}
                    `}
                  >
                    {topic.badge.text}
                  </span>
                )}
              </div>
              {topic.description && (
                <p className="text-xs text-slate-600 dark:text-gray-400 line-clamp-2">
                  {topic.description}
                </p>
              )}
            </div>

            {/* Hover Indicator */}
            <div
              className={`
                absolute right-2 top-1/2 -translate-y-1/2
                w-1 h-8 rounded-full
                transition-opacity duration-200
                ${isActive || isCurrentPage ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}
              `}
              style={{ backgroundColor: topic.accentHex }}
              aria-hidden="true"
            />
          </button>
        );
      })}

      {/* View All Link */}
      <Link
        href="/intelligent-lms"
        className="flex items-center justify-center gap-2 px-3 py-2 mt-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
      >
        <span>View All Features</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
};
