'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

export default function MathAngles() {
  const shouldReduceMotion = useReducedMotion();
  const [angle, setAngle] = useState(60);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAngle(parseInt(e.target.value, 10));
  };

  // Calculate arc path for the angle
  const radius = 60;
  const centerX = 150;
  const centerY = 150;
  const angleRad = (angle * Math.PI) / 180;
  const arcEnd = {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY - radius * Math.sin(angleRad),
  };

  return (
    <div className="flex h-full items-center justify-center">
      <svg width="300" height="250" viewBox="0 0 300 250" className="w-full max-w-sm">
        {/* Base line (horizontal) */}
        <motion.line
          x1="50"
          y1="150"
          x2="250"
          y2="150"
          stroke="currentColor"
          strokeWidth="3"
          className="text-muted-foreground"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8 }}
        />

        {/* Angled line */}
        <motion.line
          x1={centerX}
          y1={centerY}
          x2={arcEnd.x}
          y2={arcEnd.y}
          stroke="currentColor"
          strokeWidth="3"
          className="text-brand"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: 0.2 }}
        />

        {/* Angle arc */}
        <motion.path
          d={`M ${centerX + radius} ${centerY} A ${radius} ${radius} 0 0 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-purple-500"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: 0.4 }}
        />

        {/* Colored wedge */}
        <motion.path
          d={`M ${centerX} ${centerY} L ${centerX + radius} ${centerY} A ${radius} ${radius} 0 0 1 ${arcEnd.x} ${arcEnd.y} Z`}
          fill="currentColor"
          className="text-purple-500/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: 0.6 }}
        />

        {/* Angle label */}
        <text
          x={centerX + 35}
          y={centerY - 10}
          className="fill-current text-sm font-semibold"
          textAnchor="middle"
        >
          {angle}°
        </text>

        {/* Slider knob (visual only) */}
        <circle
          cx={arcEnd.x}
          cy={arcEnd.y}
          r="6"
          fill="currentColor"
          className="cursor-pointer text-brand"
        />
      </svg>

      {/* Interactive slider */}
      <div className="absolute bottom-4 left-1/2 w-48 -translate-x-1/2">
        <input
          type="range"
          min="0"
          max="180"
          value={angle}
          onChange={handleSliderChange}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Adjust angle"
        />
      </div>
    </div>
  );
}
