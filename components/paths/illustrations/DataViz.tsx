'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

export default function DataViz() {
  const shouldReduceMotion = useReducedMotion();
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const data = [
    { label: 'Mon', value: 65 },
    { label: 'Tue', value: 80 },
    { label: 'Wed', value: 55 },
    { label: 'Thu', value: 90 },
    { label: 'Fri', value: 75 },
  ];

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="flex h-full items-end justify-center gap-4 p-8">
      {data.map((item, index) => {
        const heightPercent = (item.value / maxValue) * 100;
        const isHovered = hoveredBar === index;

        return (
          <div key={item.label} className="flex flex-col items-center gap-2">
            {/* Bar */}
            <div className="relative w-12" style={{ height: '150px' }}>
              <motion.div
                className={`absolute bottom-0 w-full rounded-t-lg transition-colors ${
                  isHovered ? 'bg-brand' : 'bg-blue-500'
                }`}
                style={{ height: `${heightPercent}%` }}
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              />

              {/* Value label on hover */}
              {isHovered && (
                <motion.div
                  className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-foreground px-2 py-1 text-xs font-semibold text-background"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {item.value}
                </motion.div>
              )}
            </div>

            {/* Label */}
            <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
