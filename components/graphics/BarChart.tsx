'use client';

import { motion } from 'framer-motion';

export default function BarChart() {
  const bars = [
    { height: 40, delay: 0.3 },
    { height: 60, delay: 0.4 },
    { height: 35, delay: 0.5 },
    { height: 55, delay: 0.6 },
  ];

  return (
    <svg
      className="absolute -left-10 -top-20 hidden lg:block"
      width="60"
      height="80"
      viewBox="0 0 60 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {bars.map((bar, i) => (
        <motion.rect
          key={i}
          x={i * 15}
          y={80 - bar.height}
          width="10"
          height={bar.height}
          fill="#a855f7"
          opacity="0.6"
          rx="2"
          initial={{ scaleY: 0, originY: 1 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.6, delay: bar.delay, ease: 'easeOut' }}
        />
      ))}
    </svg>
  );
}
