'use client';

import { motion, useReducedMotion } from '@/components/lazy-motion';

/**
 * Neural Constellation — A living brain network with orbiting particles,
 * pulsing synapses, and organic hand-drawn path reveals.
 */

// Neural nodes positioned in a brain-like silhouette
const neurons = [
  { cx: 100, cy: 40, r: 5, delay: 0, orbit: true },
  { cx: 55, cy: 80, r: 4, delay: 0.15, orbit: false },
  { cx: 145, cy: 75, r: 4.5, delay: 0.2, orbit: true },
  { cx: 70, cy: 135, r: 5.5, delay: 0.35, orbit: false },
  { cx: 130, cy: 130, r: 5, delay: 0.4, orbit: true },
  { cx: 100, cy: 110, r: 6, delay: 0.25, orbit: false },
  { cx: 40, cy: 180, r: 4, delay: 0.55, orbit: true },
  { cx: 100, cy: 185, r: 5, delay: 0.6, orbit: false },
  { cx: 160, cy: 175, r: 4.5, delay: 0.65, orbit: true },
  { cx: 75, cy: 230, r: 4, delay: 0.8, orbit: false },
  { cx: 125, cy: 235, r: 4, delay: 0.85, orbit: true },
];

// Synaptic connections — organic curved paths between neurons
const synapses = [
  { d: 'M100,40 Q75,55 55,80', delay: 0.1 },
  { d: 'M100,40 Q125,50 145,75', delay: 0.15 },
  { d: 'M55,80 Q60,105 70,135', delay: 0.3 },
  { d: 'M55,80 Q80,90 100,110', delay: 0.25 },
  { d: 'M145,75 Q140,95 130,130', delay: 0.35 },
  { d: 'M145,75 Q125,90 100,110', delay: 0.3 },
  { d: 'M70,135 Q55,155 40,180', delay: 0.5 },
  { d: 'M70,135 Q85,120 100,110', delay: 0.4 },
  { d: 'M130,130 Q145,150 160,175', delay: 0.55 },
  { d: 'M130,130 Q115,120 100,110', delay: 0.45 },
  { d: 'M100,110 Q100,145 100,185', delay: 0.5 },
  { d: 'M40,180 Q55,205 75,230', delay: 0.7 },
  { d: 'M100,185 Q90,210 75,230', delay: 0.75 },
  { d: 'M100,185 Q110,210 125,235', delay: 0.78 },
  { d: 'M160,175 Q145,205 125,235', delay: 0.8 },
];

// Floating micro-particles that drift through the network
const particles = [
  { cx: 82, cy: 60, size: 2, driftX: 6, driftY: -8, dur: 5 },
  { cx: 120, cy: 95, size: 1.5, driftX: -5, driftY: 7, dur: 6 },
  { cx: 50, cy: 155, size: 2.5, driftX: 8, driftY: -5, dur: 4.5 },
  { cx: 150, cy: 150, size: 1.8, driftX: -7, driftY: -6, dur: 5.5 },
  { cx: 90, cy: 200, size: 2, driftX: 4, driftY: 8, dur: 7 },
  { cx: 110, cy: 65, size: 1.5, driftX: -4, driftY: 5, dur: 6.5 },
  { cx: 65, cy: 110, size: 2, driftX: 7, driftY: -3, dur: 5 },
  { cx: 140, cy: 200, size: 1.8, driftX: -6, driftY: 4, dur: 4 },
];

export default function BrainNetworkSvg() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 200 280"
      className="w-full h-full"
      aria-hidden="true"
    >
      <defs>
        {/* Primary gradient — violet to blue */}
        <linearGradient id="bn-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>

        {/* Warm accent gradient for firing synapses */}
        <linearGradient id="bn-grad-fire" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>

        {/* Radial glow for neurons */}
        <radialGradient id="bn-neuron-glow">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </radialGradient>

        {/* Soft outer glow filter */}
        <filter id="bn-glow-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Intense glow for active neurons */}
        <filter id="bn-glow-intense" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0.2  0 1 0 0 0.1  0 0 1 0 0.4  0 0 0 1.5 0"
            result="colorBlur"
          />
          <feMerge>
            <feMergeNode in="colorBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Layer 1: Ambient particles (floating dust) ── */}
      {particles.map((p, i) => (
        <motion.circle
          key={`particle-${i}`}
          cx={p.cx}
          cy={p.cy}
          r={p.size}
          fill="#A78BFA"
          initial={{ opacity: 0 }}
          animate={
            shouldReduceMotion
              ? { opacity: 0.3 }
              : {
                  opacity: [0, 0.4, 0.2, 0.5, 0],
                  x: [0, p.driftX * 0.5, p.driftX, p.driftX * 0.3, 0],
                  y: [0, p.driftY * 0.5, p.driftY, p.driftY * 0.3, 0],
                }
          }
          transition={{
            duration: p.dur,
            delay: 1.5 + i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* ── Layer 2: Synaptic connections — hand-drawn path reveals ── */}
      {synapses.map((s, i) => (
        <motion.path
          key={`synapse-${i}`}
          d={s.d}
          fill="none"
          stroke="url(#bn-grad-fire)"
          strokeWidth="1.2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.35 }}
          transition={{
            pathLength: {
              duration: shouldReduceMotion ? 0 : 0.8,
              delay: shouldReduceMotion ? 0 : s.delay,
              ease: [0.65, 0, 0.35, 1],
            },
            opacity: {
              duration: shouldReduceMotion ? 0 : 0.4,
              delay: shouldReduceMotion ? 0 : s.delay,
            },
          }}
        />
      ))}

      {/* ── Layer 3: Signal pulses traveling along synapses ── */}
      {!shouldReduceMotion &&
        synapses
          .filter((_, i) => i % 3 === 0)
          .map((s, i) => (
            <g key={`signal-${i}`}>
              <circle
                cx="0"
                cy="0"
                r="2"
                fill="#C084FC"
                filter="url(#bn-glow-soft)"
                opacity="0.8"
              >
                <animateMotion
                  dur="2s"
                  begin={`${2 + i * 1.5}s`}
                  repeatCount="indefinite"
                  path={s.d}
                />
                <animate
                  attributeName="opacity"
                  values="0;0.9;0.9;0"
                  dur="2s"
                  begin={`${2 + i * 1.5}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}

      {/* ── Layer 4: Neuron nodes ── */}
      {neurons.map((n, i) => (
        <g key={`neuron-group-${i}`}>
          {/* Ambient glow behind each neuron */}
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.6,
              delay: shouldReduceMotion ? 0 : n.delay + 0.1,
              ease: 'easeOut',
            }}
            style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
          >
            <circle
              cx={n.cx}
              cy={n.cy}
              r={n.r * 3.5}
              fill="url(#bn-neuron-glow)"
            />
          </motion.g>

          {/* Core neuron */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.5,
              delay: shouldReduceMotion ? 0 : n.delay,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
          >
            <circle
              cx={n.cx}
              cy={n.cy}
              r={n.r}
              fill="url(#bn-grad-main)"
              filter="url(#bn-glow-intense)"
            />
          </motion.g>

          {/* Orbiting ring for selected neurons */}
          {n.orbit && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={
                shouldReduceMotion
                  ? { opacity: 0.3 }
                  : { opacity: 0.3, rotate: 360 }
              }
              transition={{
                opacity: {
                  duration: 0.5,
                  delay: n.delay + 0.5,
                },
                rotate: {
                  duration: 12 + i * 2,
                  repeat: Infinity,
                  ease: 'linear',
                },
              }}
              style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
            >
              <circle
                cx={n.cx}
                cy={n.cy}
                r={n.r + 4}
                fill="none"
                stroke="#A78BFA"
                strokeWidth="0.8"
                strokeDasharray="2 4"
              />
            </motion.g>
          )}

          {/* Heartbeat pulse ring */}
          <motion.g
            initial={{ scale: 1, opacity: 0 }}
            animate={
              shouldReduceMotion
                ? { scale: 1, opacity: 0 }
                : {
                    scale: [1, 2.2, 3],
                    opacity: [0.6, 0.2, 0],
                  }
            }
            transition={{
              duration: 3,
              delay: n.delay + 2 + i * 0.5,
              repeat: Infinity,
              repeatDelay: 4 + i * 0.7,
              ease: 'easeOut',
            }}
            style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
          >
            <circle
              cx={n.cx}
              cy={n.cy}
              r={n.r}
              fill="none"
              stroke="#C084FC"
              strokeWidth="1.5"
            />
          </motion.g>
        </g>
      ))}

      {/* ── Layer 5: Central brain silhouette outline (very subtle) ── */}
      <motion.path
        d="M100,20 C65,20 35,55 35,95 C35,130 50,160 40,190 C35,205 45,230 65,245 C75,252 90,260 100,260 C110,260 125,252 135,245 C155,230 165,205 160,190 C150,160 165,130 165,95 C165,55 135,20 100,20Z"
        fill="none"
        stroke="url(#bn-grad-main)"
        strokeWidth="0.6"
        strokeDasharray="3 6"
        opacity="0.15"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 3,
          delay: shouldReduceMotion ? 0 : 0.5,
          ease: [0.65, 0, 0.35, 1],
        }}
      />
    </svg>
  );
}
