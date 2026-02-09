'use client';

import { motion, useReducedMotion } from '@/components/lazy-motion';

/**
 * Knowledge Entropy — Scattered learning fragments drift apart,
 * connections break and reform, symbolizing the chaos of unstructured learning.
 * Features: floating content cards, breaking connection lines, orbital drift.
 */

interface Fragment {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  color: string;
  delay: number;
  drift: { x: number; y: number };
  rotate: number;
  icon: 'video' | 'book' | 'code' | 'quiz' | 'link' | 'doc';
}

const fragments: Fragment[] = [
  { x: 25, y: 30, w: 62, h: 52, rx: 10, color: '#8B5CF6', delay: 0, drift: { x: -15, y: -10 }, rotate: -5, icon: 'video' },
  { x: 120, y: 15, w: 58, h: 48, rx: 8, color: '#7C3AED', delay: 0.1, drift: { x: 10, y: -16 }, rotate: 4, icon: 'book' },
  { x: 210, y: 40, w: 60, h: 55, rx: 10, color: '#6366F1', delay: 0.2, drift: { x: 18, y: -6 }, rotate: -3, icon: 'code' },
  { x: 40, y: 120, w: 55, h: 50, rx: 9, color: '#3B82F6', delay: 0.3, drift: { x: -12, y: 8 }, rotate: 6, icon: 'quiz' },
  { x: 140, y: 110, w: 65, h: 52, rx: 10, color: '#2563EB', delay: 0.4, drift: { x: 6, y: 12 }, rotate: -4, icon: 'link' },
  { x: 230, y: 125, w: 50, h: 48, rx: 8, color: '#4F46E5', delay: 0.5, drift: { x: 14, y: 10 }, rotate: 3, icon: 'doc' },
  { x: 15, y: 210, w: 58, h: 50, rx: 9, color: '#A855F7', delay: 0.6, drift: { x: -10, y: 14 }, rotate: -6, icon: 'video' },
  { x: 110, y: 200, w: 60, h: 54, rx: 10, color: '#818CF8', delay: 0.7, drift: { x: 4, y: 18 }, rotate: 5, icon: 'book' },
  { x: 205, y: 215, w: 55, h: 48, rx: 8, color: '#60A5FA', delay: 0.8, drift: { x: 16, y: 12 }, rotate: -2, icon: 'code' },
];

// Broken connection attempts — dashed lines that flicker and fail
const brokenLinks = [
  { x1: 87, y1: 56, x2: 120, y2: 39, delay: 0.3 },
  { x1: 178, y1: 39, x2: 210, y2: 67, delay: 0.5 },
  { x1: 95, y1: 145, x2: 140, y2: 136, delay: 0.7 },
  { x1: 205, y1: 136, x2: 230, y2: 149, delay: 0.9 },
  { x1: 73, y1: 235, x2: 110, y2: 227, delay: 1.1 },
  { x1: 170, y1: 227, x2: 205, y2: 239, delay: 1.3 },
  { x1: 56, y1: 82, x2: 62, y2: 120, delay: 0.6 },
  { x1: 149, y1: 63, x2: 165, y2: 110, delay: 0.8 },
];

function FragmentIcon({ icon, x, y, color }: { icon: string; x: number; y: number; color: string }) {
  switch (icon) {
    case 'video':
      return (
        <g>
          <polygon points={`${x},${y - 5} ${x},${y + 5} ${x + 8},${y}`} fill={color} />
        </g>
      );
    case 'book':
      return (
        <g>
          <rect x={x - 4} y={y - 5} width={8} height={10} rx={1} fill="none" stroke={color} strokeWidth="1.5" />
          <line x1={x} y1={y - 5} x2={x} y2={y + 5} stroke={color} strokeWidth="1" />
        </g>
      );
    case 'code':
      return (
        <g>
          <text x={x} y={y + 3} textAnchor="middle" fill={color} fontSize="10" fontWeight="700" fontFamily="monospace">&lt;/&gt;</text>
        </g>
      );
    case 'quiz':
      return (
        <g>
          <text x={x} y={y + 4} textAnchor="middle" fill={color} fontSize="11" fontWeight="bold">?</text>
        </g>
      );
    case 'link':
      return (
        <g>
          <path d={`M${x - 4},${y} A4,4 0 1,1 ${x},${y - 4} M${x},${y} A4,4 0 1,1 ${x + 4},${y - 4}`} fill="none" stroke={color} strokeWidth="1.5" />
        </g>
      );
    case 'doc':
      return (
        <g>
          <rect x={x - 4} y={y - 5} width={8} height={10} rx={1} fill="none" stroke={color} strokeWidth="1.5" />
          <line x1={x - 2} y1={y - 2} x2={x + 2} y2={y - 2} stroke={color} strokeWidth="1" />
          <line x1={x - 2} y1={y + 1} x2={x + 1} y2={y + 1} stroke={color} strokeWidth="1" />
        </g>
      );
    default:
      return null;
  }
}

export default function FragmentedLearningSvg() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 300 300"
      className="w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <filter id="frag-shadow-v2" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#4338CA" floodOpacity="0.3" />
        </filter>

        <linearGradient id="frag-conn-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0.5" />
        </linearGradient>

        {/* Noise texture for cards */}
        <filter id="frag-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="3" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.05" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="overlay" />
        </filter>
      </defs>

      {/* ── Broken connection lines — flickering failures ── */}
      {brokenLinks.map((link, i) => (
        <motion.g key={`broken-${i}`}>
          {/* Static dashed line */}
          <motion.line
            x1={link.x1}
            y1={link.y1}
            x2={link.x2}
            y2={link.y2}
            stroke="url(#frag-conn-grad)"
            strokeWidth="2"
            strokeDasharray="3 5"
            strokeLinecap="round"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={
              shouldReduceMotion
                ? { opacity: 0.5, pathLength: 1 }
                : {
                    opacity: [0, 0.7, 0.3, 0.6, 0.2, 0],
                    pathLength: [0, 0.7, 0.3, 0.8, 0.4, 0],
                  }
            }
            transition={{
              duration: 4,
              delay: link.delay + 1,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeInOut',
            }}
          />

          {/* Red "X" failure spark at midpoint */}
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={
              shouldReduceMotion
                ? { opacity: 0 }
                : {
                    opacity: [0, 0, 0.8, 0],
                    scale: [0, 0, 1, 0.5],
                  }
            }
            transition={{
              duration: 4,
              delay: link.delay + 1,
              repeat: Infinity,
              repeatDelay: 2,
            }}
            style={{
              transformOrigin: `${(link.x1 + link.x2) / 2}px ${(link.y1 + link.y2) / 2}px`,
            }}
          >
            <line
              x1={(link.x1 + link.x2) / 2 - 3}
              y1={(link.y1 + link.y2) / 2 - 3}
              x2={(link.x1 + link.x2) / 2 + 3}
              y2={(link.y1 + link.y2) / 2 + 3}
              stroke="#EF4444"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1={(link.x1 + link.x2) / 2 + 3}
              y1={(link.y1 + link.y2) / 2 - 3}
              x2={(link.x1 + link.x2) / 2 - 3}
              y2={(link.y1 + link.y2) / 2 + 3}
              stroke="#EF4444"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </motion.g>
        </motion.g>
      ))}

      {/* ── Knowledge fragment cards ── */}
      {fragments.map((frag, i) => (
        <motion.g
          key={`frag-${i}`}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={
            shouldReduceMotion
              ? { opacity: 1, scale: 1 }
              : {
                  opacity: [0.85, 0.6, 0.85],
                  x: [0, frag.drift.x * 0.6, frag.drift.x, frag.drift.x * 0.4, 0],
                  y: [0, frag.drift.y * 0.6, frag.drift.y, frag.drift.y * 0.4, 0],
                  rotate: [0, frag.rotate, frag.rotate * 1.5, frag.rotate * 0.5, 0],
                  scale: [1, 0.97, 1.02, 0.98, 1],
                }
          }
          transition={{
            duration: shouldReduceMotion ? 0 : 7 + i * 0.5,
            delay: frag.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            transformOrigin: `${frag.x + frag.w / 2}px ${frag.y + frag.h / 2}px`,
          }}
        >
          {/* Card background */}
          <rect
            x={frag.x}
            y={frag.y}
            width={frag.w}
            height={frag.h}
            rx={frag.rx}
            fill={frag.color}
            opacity="0.22"
            filter="url(#frag-shadow-v2)"
          />

          {/* Card border */}
          <rect
            x={frag.x}
            y={frag.y}
            width={frag.w}
            height={frag.h}
            rx={frag.rx}
            fill="none"
            stroke={frag.color}
            strokeWidth="1.8"
            opacity="0.75"
          />

          {/* Icon — uses fragment color for universal visibility */}
          <FragmentIcon
            icon={frag.icon}
            x={frag.x + frag.w / 2}
            y={frag.y + frag.h / 2 - 6}
            color={frag.color}
          />

          {/* Simulated text lines */}
          <rect
            x={frag.x + 10}
            y={frag.y + frag.h / 2 + 6}
            width={frag.w - 20}
            height={2.5}
            rx={1.25}
            fill={frag.color}
            opacity="0.4"
          />
          <rect
            x={frag.x + 10}
            y={frag.y + frag.h / 2 + 12}
            width={frag.w - 28}
            height={2.5}
            rx={1.25}
            fill={frag.color}
            opacity="0.3"
          />
        </motion.g>
      ))}

      {/* ── Confusion particles — small dots orbiting chaotically ── */}
      {!shouldReduceMotion &&
        [
          { cx: 100, cy: 90, r: 80 },
          { cx: 200, cy: 180, r: 70 },
          { cx: 60, cy: 250, r: 50 },
        ].map((orbit, oi) =>
          [0, 1, 2].map((pi) => (
            <g key={`chaos-${oi}-${pi}`}>
              <circle
                cx="0"
                cy="0"
                r="1.5"
                fill="#F59E0B"
              >
                <animateMotion
                  dur={`${4 + oi}s`}
                  begin={`${pi * 1.2}s`}
                  repeatCount="indefinite"
                  path={`M${orbit.cx},${orbit.cy - orbit.r} A${orbit.r},${orbit.r} 0 1,${pi % 2} ${orbit.cx},${orbit.cy + orbit.r} A${orbit.r},${orbit.r} 0 1,${pi % 2} ${orbit.cx},${orbit.cy - orbit.r}`}
                />
                <animate
                  attributeName="opacity"
                  values="0;0.7;0.5;0.8;0"
                  dur={`${5 + oi}s`}
                  begin={`${pi * 1.5 + oi}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          )),
        )}

      {/* ── Subtle "?" watermark in center ── */}
      <motion.text
        x="150"
        y="165"
        textAnchor="middle"
        fill="#7C3AED"
        fontSize="48"
        fontWeight="800"
        opacity="0.08"
        initial={{ opacity: 0 }}
        animate={
          shouldReduceMotion
            ? { opacity: 0.08 }
            : { opacity: [0.05, 0.12, 0.05] }
        }
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        ?
      </motion.text>
    </svg>
  );
}
