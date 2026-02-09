'use client';

import { motion, useReducedMotion } from '@/components/lazy-motion';

/**
 * Living Taxonomy Pyramid — Each level builds with energy flowing upward.
 * Features: staggered level reveals with glow, ascending energy particles,
 * a scanning beam that climbs the pyramid, and pulsing highlight on the active level.
 */

const levels = [
  { label: 'Create', y: 18, w: 58, h: 30, color: '#7C3AED', glow: '#A78BFA', delay: 1.5 },
  { label: 'Evaluate', y: 56, w: 88, h: 30, color: '#8B5CF6', glow: '#C4B5FD', delay: 1.2 },
  { label: 'Analyze', y: 94, w: 118, h: 30, color: '#6366F1', glow: '#A5B4FC', delay: 0.9 },
  { label: 'Apply', y: 132, w: 148, h: 30, color: '#3B82F6', glow: '#93C5FD', delay: 0.6 },
  { label: 'Understand', y: 170, w: 178, h: 30, color: '#2563EB', glow: '#60A5FA', delay: 0.3 },
  { label: 'Remember', y: 208, w: 208, h: 30, color: '#1E40AF', glow: '#3B82F6', delay: 0 },
];

// Energy particles that float upward through the pyramid
const energyParticles = [
  { startX: 110, startY: 240, endY: 10, delay: 0, dur: 4, size: 2 },
  { startX: 140, startY: 245, endY: 15, delay: 0.8, dur: 4.5, size: 1.5 },
  { startX: 125, startY: 248, endY: 8, delay: 1.5, dur: 3.8, size: 2.5 },
  { startX: 155, startY: 242, endY: 12, delay: 2.2, dur: 5, size: 1.8 },
  { startX: 95, startY: 246, endY: 14, delay: 3, dur: 4.2, size: 2 },
  { startX: 130, startY: 250, endY: 5, delay: 0.5, dur: 3.5, size: 1.5 },
  { startX: 100, startY: 244, endY: 18, delay: 1.8, dur: 4.8, size: 2.2 },
  { startX: 160, startY: 240, endY: 10, delay: 2.8, dur: 3.6, size: 1.8 },
];

export default function BloomPyramidMiniSvg() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 260 280"
      className="w-full h-full"
      aria-hidden="true"
    >
      <defs>
        {/* Gradient for the scanning beam */}
        <linearGradient id="bp-scan-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" stopOpacity="0" />
          <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#C084FC" stopOpacity="0" />
        </linearGradient>

        {/* Glow filter for active elements */}
        <filter id="bp-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Strong glow for energy particles */}
        <filter id="bp-particle-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 0.5 0 0 0  0 0 1 0 0.3  0 0 0 2 0"
            result="colorBlur"
          />
          <feMerge>
            <feMergeNode in="colorBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Subtle pattern for pyramid surfaces */}
        <pattern id="bp-surface-pattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="0.5" fill="white" opacity="0.1" />
        </pattern>
      </defs>

      {/* ── Pyramid outline — subtle wireframe ── */}
      <motion.path
        d="M130,8 L30,243 L230,243 Z"
        fill="none"
        stroke="#7C3AED"
        strokeWidth="0.5"
        strokeDasharray="4 8"
        opacity="0.1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 2,
          ease: [0.65, 0, 0.35, 1],
        }}
      />

      {/* ── Taxonomy levels — staggered build-up from base ── */}
      {levels.map((level, i) => {
        const x = (260 - level.w) / 2;
        const isTopLevel = i === 0;

        return (
          <motion.g key={`level-${i}`}>
            {/* Level background with subtle depth */}
            <motion.rect
              x={x}
              y={level.y}
              width={level.w}
              height={level.h}
              rx={6}
              fill={level.color}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.6,
                delay: shouldReduceMotion ? 0 : level.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ transformOrigin: `${130}px ${level.y + level.h / 2}px` }}
            />

            {/* Surface texture overlay */}
            <motion.rect
              x={x}
              y={level.y}
              width={level.w}
              height={level.h}
              rx={6}
              fill="url(#bp-surface-pattern)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: shouldReduceMotion ? 0 : level.delay + 0.3,
              }}
            />

            {/* Left edge highlight (3D effect) */}
            <motion.rect
              x={x}
              y={level.y}
              width={3}
              height={level.h}
              rx={1.5}
              fill="white"
              opacity="0.15"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.4,
                delay: shouldReduceMotion ? 0 : level.delay + 0.2,
              }}
              style={{ transformOrigin: `${x}px ${level.y}px` }}
            />

            {/* Level label */}
            <motion.text
              x={130}
              y={level.y + level.h / 2 + 4}
              textAnchor="middle"
              fill="white"
              fontSize="11"
              fontWeight="600"
              letterSpacing="0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.3,
                delay: shouldReduceMotion ? 0 : level.delay + 0.4,
              }}
            >
              {level.label}
            </motion.text>

            {/* Glow ring on hover-like periodic pulse */}
            <motion.rect
              x={x - 2}
              y={level.y - 2}
              width={level.w + 4}
              height={level.h + 4}
              rx={8}
              fill="none"
              stroke={level.glow}
              strokeWidth="1.5"
              initial={{ opacity: 0 }}
              animate={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : {
                      opacity: isTopLevel
                        ? [0, 0.6, 0.3, 0.6, 0]
                        : [0, 0.3, 0],
                    }
              }
              transition={{
                duration: isTopLevel ? 3 : 4,
                delay: 3 + i * 0.8,
                repeat: Infinity,
                repeatDelay: isTopLevel ? 2 : 5,
                ease: 'easeInOut',
              }}
            />
          </motion.g>
        );
      })}

      {/* ── Ascending energy particles ── */}
      {energyParticles.map((p, i) => (
        <motion.g
          key={`energy-${i}`}
          initial={{ opacity: 0 }}
          animate={
            shouldReduceMotion
              ? { opacity: 0 }
              : {
                  opacity: [0, 0.8, 0.6, 0.8, 0],
                  x: [
                    0,
                    i % 2 === 0 ? 8 : -8,
                    i % 2 === 0 ? -5 : 5,
                    i % 2 === 0 ? 3 : -3,
                    0,
                  ],
                  y: [0, -60, -140, -200, p.endY - p.startY],
                  scale: [0.5, 1, 1.2, 0.8, 0],
                }
          }
          transition={{
            duration: p.dur,
            delay: 2.5 + p.delay,
            repeat: Infinity,
            repeatDelay: 2,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: `${p.startX}px ${p.startY}px` }}
        >
          <circle
            cx={p.startX}
            cy={p.startY}
            r={p.size}
            fill="#C084FC"
            filter="url(#bp-particle-glow)"
          />
        </motion.g>
      ))}

      {/* ── Scanning beam — climbs upward ── */}
      <motion.rect
        x={20}
        y={220}
        width={220}
        height={8}
        fill="url(#bp-scan-grad)"
        initial={{ y: 220, opacity: 0 }}
        animate={
          shouldReduceMotion
            ? { y: 18, opacity: 0.3 }
            : {
                y: [220, 170, 132, 94, 56, 18],
                opacity: [0, 0.5, 0.6, 0.7, 0.8, 1],
                scaleX: [1, 0.85, 0.7, 0.56, 0.42, 0.28],
              }
        }
        transition={{
          duration: shouldReduceMotion ? 0 : 3.5,
          delay: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: '130px 224px' }}
      />

      {/* ── Crown burst at the top — achievement marker ── */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={
          shouldReduceMotion
            ? { opacity: 0.6, scale: 1 }
            : {
                opacity: [0, 0, 0.8, 0.6, 0],
                scale: [0, 0, 1.2, 1, 0.8],
              }
        }
        transition={{
          duration: 4,
          delay: 5.5,
          repeat: Infinity,
          repeatDelay: 4,
        }}
        style={{ transformOrigin: '130px 8px' }}
      >
        {/* Star burst lines */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const len = 12;
          return (
            <line
              key={`burst-${angle}`}
              x1={130 + Math.cos(rad) * 6}
              y1={8 + Math.sin(rad) * 6}
              x2={130 + Math.cos(rad) * len}
              y2={8 + Math.sin(rad) * len}
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}
        <circle cx="130" cy="8" r="4" fill="#F59E0B" filter="url(#bp-glow)" />
      </motion.g>
    </svg>
  );
}
