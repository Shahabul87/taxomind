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
      className="flex flex-col space-y-2 min-w-[200px] max-w-[240px] pr-5 border-r border-slate-200/40 dark:border-slate-700/30"
      style={{
        borderImage: 'linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.2), transparent) 1',
      }}
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
            onKeyDown={(e) => {
              const buttons = railRef.current?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]');
              if (!buttons || buttons.length === 0) return;
              const currentIndex = index;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = (currentIndex + 1) % buttons.length;
                buttons[next]?.focus();
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = (currentIndex - 1 + buttons.length) % buttons.length;
                buttons[prev]?.focus();
              }
              if (e.key === 'Home') {
                e.preventDefault();
                buttons[0]?.focus();
              }
              if (e.key === 'End') {
                e.preventDefault();
                buttons[buttons.length - 1]?.focus();
              }
            }}
            className={`
              group relative flex items-start gap-3 px-3.5 py-3.5 rounded-lg
              transition-all duration-200 ease-out
              text-left w-full
              focus:outline-none
              ${isActive || isCurrentPage
                ? 'bg-slate-50/60 dark:bg-slate-800/40 text-slate-900 dark:text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50/40 dark:hover:bg-slate-800/30'
              }
            `}
            style={isActive || isCurrentPage ? {
              borderLeft: `1px solid ${topic.accentHex}40`,
            } : {}}
            role="menuitem"
            aria-current={isCurrentPage ? 'page' : undefined}
            tabIndex={index === 0 || isActive ? 0 : -1}
          >
            {/* Icon Container */}
            <div
              className={`
                relative w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                transition-all duration-200
              `}
            >
              {/* Main icon container */}
              <div
                className="relative w-full h-full rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: isActive || isCurrentPage
                    ? `${topic.accentHex}20`
                    : variant === 'rich'
                    ? `${topic.accentHex}10`
                    : 'rgba(148, 163, 184, 0.08)',
                }}
              >
                <Icon
                  className={`relative w-5 h-5 transition-all duration-200 ${
                    isActive || isCurrentPage
                      ? 'text-slate-700 dark:text-slate-200'
                      : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                  }`}
                  {...((isActive || isCurrentPage) && {
                    style: { color: topic.accentHex } as React.CSSProperties
                  })}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-semibold tracking-wide truncate transition-colors duration-200 ${
                  isActive || isCurrentPage ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {topic.label}
                </span>
                {topic.badge && (
                  <span
                    className={`
                      px-1.5 py-0.5 text-[10px] font-semibold rounded-md transition-all duration-200
                      ${topic.badge.variant === 'new' ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm' : ''}
                      ${topic.badge.variant === 'ai' ? 'bg-violet-100 dark:bg-violet-500/25 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-400/50' : ''}
                      ${topic.badge.variant === 'beta' ? 'bg-blue-100 dark:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/50' : ''}
                      ${topic.badge.variant === 'pro' ? 'bg-amber-100 dark:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-400/50' : ''}
                      ${topic.badge.className || ''}
                    `}
                  >
                    {topic.badge.text}
                  </span>
                )}
              </div>
              {topic.description && (
                <p className={`text-xs leading-relaxed line-clamp-2 transition-colors duration-200 ${
                  isActive || isCurrentPage 
                    ? 'text-slate-600 dark:text-slate-400' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {topic.description}
                </p>
              )}
            </div>

            {/* Focus indicator */}
            <div
              className="absolute inset-0 rounded-lg opacity-0 group-focus-visible:opacity-100 transition-opacity ring-2 ring-offset-2 dark:ring-offset-slate-900"
              style={{ '--tw-ring-color': topic.accentHex } as React.CSSProperties}
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
