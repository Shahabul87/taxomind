'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function ScienceGeo() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex h-full items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {/* Main hexagon */}
        <motion.polygon
          points="100,20 160,55 160,125 100,160 40,125 40,55"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground/60"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 1.2 }}
        />

        {/* Inner lines */}
        <motion.line
          x1="100"
          y1="20"
          x2="100"
          y2="160"
          stroke="currentColor"
          strokeWidth="1"
          className="text-muted-foreground"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: 0.3 }}
        />
        <motion.line
          x1="40"
          y1="55"
          x2="160"
          y2="125"
          stroke="currentColor"
          strokeWidth="1"
          className="text-muted-foreground"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: 0.4 }}
        />
        <motion.line
          x1="40"
          y1="125"
          x2="160"
          y2="55"
          stroke="currentColor"
          strokeWidth="1"
          className="text-muted-foreground"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: 0.5 }}
        />

        {/* Rotating marker at center */}
        <motion.g
          initial={{ rotate: 0 }}
          animate={{ rotate: shouldReduceMotion ? 0 : 360 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 8,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ transformOrigin: '100px 90px' }}
        >
          <circle cx="100" cy="90" r="8" fill="currentColor" className="text-brand" />
          <line
            x1="100"
            y1="90"
            x2="100"
            y2="70"
            stroke="currentColor"
            strokeWidth="2"
            className="text-brand"
          />
        </motion.g>

        {/* Vertex nodes */}
        {[
          [100, 20],
          [160, 55],
          [160, 125],
          [100, 160],
          [40, 125],
          [40, 55],
        ].map(([cx, cy], index) => (
          <motion.circle
            key={index}
            cx={cx}
            cy={cy}
            r="4"
            fill="currentColor"
            className="text-purple-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: 0.6 + index * 0.1 }}
          />
        ))}
      </svg>
    </div>
  );
}
