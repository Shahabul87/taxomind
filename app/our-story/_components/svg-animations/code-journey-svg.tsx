'use client';

import { motion, useReducedMotion } from '@/components/lazy-motion';

/**
 * Cinematic Terminal — A code editor with character-by-character typing,
 * syntax-highlighted code, a build progress bar, and a success output panel.
 * Features: typing cursor, line-by-line reveal, compile animation, status indicators.
 */

interface CodeLine {
  tokens: Array<{ text: string; color: string }>;
  delay: number;
}

const codeLines: CodeLine[] = [
  {
    tokens: [
      { text: 'const ', color: '#C084FC' },
      { text: 'sam', color: '#F9A8D4' },
      { text: ' = ', color: '#94A3B8' },
      { text: 'createAIMentor', color: '#60A5FA' },
      { text: '({', color: '#E2E8F0' },
    ],
    delay: 0.3,
  },
  {
    tokens: [
      { text: '  bloom', color: '#93C5FD' },
      { text: ': ', color: '#94A3B8' },
      { text: 'taxonomy', color: '#F9A8D4' },
      { text: '.allLevels', color: '#818CF8' },
      { text: ',', color: '#E2E8F0' },
    ],
    delay: 0.8,
  },
  {
    tokens: [
      { text: '  adaptive', color: '#93C5FD' },
      { text: ': ', color: '#94A3B8' },
      { text: 'true', color: '#34D399' },
      { text: ',', color: '#E2E8F0' },
    ],
    delay: 1.2,
  },
  {
    tokens: [
      { text: '  realTime', color: '#93C5FD' },
      { text: ': ', color: '#94A3B8' },
      { text: 'true', color: '#34D399' },
      { text: ',', color: '#E2E8F0' },
    ],
    delay: 1.5,
  },
  {
    tokens: [{ text: '});', color: '#C084FC' }],
    delay: 1.8,
  },
  { tokens: [], delay: 2.0 },
  {
    tokens: [
      { text: 'const ', color: '#C084FC' },
      { text: 'level', color: '#F9A8D4' },
      { text: ' = ', color: '#94A3B8' },
      { text: 'await ', color: '#C084FC' },
      { text: 'sam', color: '#F9A8D4' },
      { text: '.analyze', color: '#60A5FA' },
      { text: '(', color: '#E2E8F0' },
      { text: 'learner', color: '#FDE68A' },
      { text: ');', color: '#E2E8F0' },
    ],
    delay: 2.3,
  },
  {
    tokens: [
      { text: '// ', color: '#475569' },
      { text: '\u2192 Level: Apply \u2713', color: '#34D399' },
    ],
    delay: 2.8,
  },
];

export default function CodeJourneySvg() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 340 260"
      className="w-full h-full"
      aria-hidden="true"
    >
      <defs>
        {/* Editor background gradient */}
        <linearGradient id="cj-editor-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1035" />
          <stop offset="100%" stopColor="#0c0a1a" />
        </linearGradient>

        {/* Title bar gradient */}
        <linearGradient id="cj-titlebar" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>

        {/* Build progress gradient */}
        <linearGradient id="cj-progress" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>

        {/* Glow for success indicator */}
        <filter id="cj-success-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Subtle scan line effect */}
        <pattern id="cj-scanlines" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="4" y2="0" stroke="white" strokeWidth="0.3" opacity="0.03" />
        </pattern>
      </defs>

      {/* ── Editor window frame ── */}
      <rect x="10" y="10" width="320" height="240" rx="12" fill="url(#cj-editor-bg)" />

      {/* Scan lines overlay */}
      <rect x="10" y="10" width="320" height="240" rx="12" fill="url(#cj-scanlines)" />

      {/* ── Title bar ── */}
      <rect x="10" y="10" width="320" height="30" rx="12" fill="url(#cj-titlebar)" />
      <rect x="10" y="28" width="320" height="12" fill="url(#cj-titlebar)" />

      {/* Window controls */}
      <circle cx="28" cy="25" r="5" fill="#EF4444" opacity="0.9" />
      <circle cx="44" cy="25" r="5" fill="#F59E0B" opacity="0.9" />
      <circle cx="60" cy="25" r="5" fill="#22C55E" opacity="0.9" />

      {/* Close icon on red dot */}
      <line x1="25.5" y1="22.5" x2="30.5" y2="27.5" stroke="#7F1D1D" strokeWidth="1" opacity="0.6" />
      <line x1="30.5" y1="22.5" x2="25.5" y2="27.5" stroke="#7F1D1D" strokeWidth="1" opacity="0.6" />

      {/* File tab */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <rect x="130" y="14" width="80" height="22" rx="4" fill="#312E81" opacity="0.5" />
        <text x="170" y="29" textAnchor="middle" fill="#A5B4FC" fontSize="8.5" fontFamily="monospace">
          sam-mentor.ts
        </text>
      </motion.g>

      {/* ── Gutter (line numbers column) ── */}
      <rect x="10" y="40" width="24" height="210" fill="#0F0D1A" opacity="0.5" />

      {/* ── Code lines with token-level coloring ── */}
      {codeLines.map((line, lineIdx) => {
        let xOffset = 44;
        return (
          <motion.g key={`line-${lineIdx}`}>
            {/* Line number */}
            <motion.text
              x="22"
              y={58 + lineIdx * 22}
              textAnchor="middle"
              fill="#3B375A"
              fontSize="9"
              fontFamily="monospace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.15,
                delay: shouldReduceMotion ? 0 : line.delay,
              }}
            >
              {lineIdx + 1}
            </motion.text>

            {/* Active line highlight */}
            <motion.rect
              x="34"
              y={47 + lineIdx * 22}
              width="296"
              height={20}
              fill="#7C3AED"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0 }}
              transition={{
                delay: line.delay,
              }}
            />

            {/* Token-by-token rendering */}
            {line.tokens.map((token, tokenIdx) => {
              const currentX = xOffset;
              xOffset += token.text.length * 6.2;

              return (
                <motion.text
                  key={`token-${lineIdx}-${tokenIdx}`}
                  x={currentX}
                  y={58 + lineIdx * 22}
                  fill={token.color}
                  fontSize="10.5"
                  fontFamily="monospace"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.25,
                    delay: shouldReduceMotion ? 0 : line.delay + tokenIdx * 0.08,
                    ease: 'easeOut',
                  }}
                >
                  {token.text}
                </motion.text>
              );
            })}
          </motion.g>
        );
      })}

      {/* ── Blinking cursor ── */}
      <motion.rect
        x="44"
        y={48 + 7 * 22}
        width="2"
        height="14"
        rx="1"
        fill="#60A5FA"
        initial={{ opacity: 0 }}
        animate={
          shouldReduceMotion
            ? { opacity: 1 }
            : {
                opacity: [1, 1, 0, 0],
                x: [44, 174, 174, 174],
              }
        }
        transition={{
          opacity: {
            duration: 1,
            delay: 3.2,
            repeat: Infinity,
            times: [0, 0.49, 0.5, 1],
            ease: 'linear',
          },
          x: {
            duration: 2.8,
            delay: 0.3,
            ease: [0.65, 0, 0.35, 1],
          },
        }}
      />

      {/* ── Bottom status bar ── */}
      <rect x="10" y="232" width="320" height="18" rx="0" fill="#1E1B4B" opacity="0.8" />
      <rect x="10" y="238" width="320" height="12" rx="12" fill="#1E1B4B" opacity="0.8" />

      {/* Status bar content */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <text x="20" y="245" fill="#6366F1" fontSize="7.5" fontFamily="monospace">
          TypeScript
        </text>
        <text x="280" y="245" fill="#475569" fontSize="7.5" fontFamily="monospace">
          UTF-8
        </text>
      </motion.g>

      {/* ── Build progress bar (appears after code is typed) ── */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={
          shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: [0, 0, 1, 1, 0] }
        }
        transition={{
          duration: 4,
          delay: 3.5,
          repeat: Infinity,
          repeatDelay: 6,
        }}
      >
        <rect x="80" y="232" width="180" height="4" rx="2" fill="#1E1B4B" />
        <motion.rect
          x="80"
          y="232"
          height="4"
          rx="2"
          fill="url(#cj-progress)"
          initial={{ width: 0 }}
          animate={
            shouldReduceMotion
              ? { width: 180 }
              : { width: [0, 60, 100, 140, 180] }
          }
          transition={{
            duration: 2,
            delay: 4,
            repeat: Infinity,
            repeatDelay: 8,
            ease: 'easeOut',
          }}
        />
      </motion.g>

      {/* ── Success checkmark (after build completes) ── */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={
          shouldReduceMotion
            ? { opacity: 0 }
            : {
                opacity: [0, 0, 0, 1, 1, 0],
                scale: [0, 0, 0, 1.2, 1, 0.8],
              }
        }
        transition={{
          duration: 5,
          delay: 5.5,
          repeat: Infinity,
          repeatDelay: 5,
        }}
        style={{ transformOrigin: '308px 200px' }}
      >
        <circle cx="308" cy="200" r="10" fill="#22C55E" opacity="0.2" filter="url(#cj-success-glow)" />
        <circle cx="308" cy="200" r="7" fill="#22C55E" opacity="0.9" />
        <path
          d="M303,200 L306,203 L313,196"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* ── Ambient glow from code (reflection on "screen") ── */}
      <motion.rect
        x="34"
        y="40"
        width="296"
        height="192"
        fill="#7C3AED"
        opacity="0"
        initial={{ opacity: 0 }}
        animate={
          shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: [0, 0.02, 0, 0.015, 0] }
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </svg>
  );
}
