'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function CSBlocks() {
  const shouldReduceMotion = useReducedMotion();

  const codeLines = [
    'function draw() {',
    '  circle(x, y, r)',
    '  rect(x2, y2, w)',
    '}',
  ];

  return (
    <div className="grid h-full grid-cols-2 gap-8 p-4">
      {/* Left: Code block */}
      <div className="flex flex-col justify-center">
        <div className="rounded-lg bg-muted/50 p-4 font-mono text-xs">
          {codeLines.map((line, index) => (
            <motion.div
              key={index}
              className="text-foreground/80"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: index * 0.1 }}
            >
              {line}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right: Generated shapes */}
      <div className="flex items-center justify-center">
        <svg width="150" height="150" viewBox="0 0 150 150">
          {/* Circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="25"
            fill="currentColor"
            className="text-blue-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: 0.4 }}
          />

          {/* Rectangle */}
          <motion.rect
            x="70"
            y="70"
            width="60"
            height="40"
            rx="4"
            fill="currentColor"
            className="text-purple-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: 0.6 }}
          />

          {/* Connecting line */}
          <motion.line
            x1="65"
            y1="65"
            x2="85"
            y2="85"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="text-muted-foreground"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: 0.8 }}
          />
        </svg>
      </div>
    </div>
  );
}
