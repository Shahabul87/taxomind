'use client';

import { motion } from 'framer-motion';

export default function AxisLines() {
  return (
    <motion.svg
      className="absolute left-0 top-1/2 hidden -translate-y-1/2 md:block"
      width="200"
      height="80"
      viewBox="0 0 200 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {/* Horizontal axis */}
      <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      {/* Tick marks */}
      {[0, 40, 80, 120, 160, 200].map((x) => (
        <line key={x} x1={x} y1="36" x2={x} y2="44" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      ))}
    </motion.svg>
  );
}
