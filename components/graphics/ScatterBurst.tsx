'use client';

import { motion } from 'framer-motion';

export default function ScatterBurst() {
  const particles = [
    { x: 10, y: 10, delay: 0.4 },
    { x: 30, y: 5, delay: 0.5 },
    { x: 20, y: 25, delay: 0.6 },
    { x: 45, y: 15, delay: 0.7 },
    { x: 35, y: 35, delay: 0.8 },
    { x: 50, y: 30, delay: 0.9 },
  ];

  return (
    <svg
      className="absolute -right-10 -top-5 hidden lg:block"
      width="60"
      height="50"
      viewBox="0 0 60 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {particles.map((particle, i) => (
        <motion.circle
          key={i}
          cx={particle.x}
          cy={particle.y}
          r="3"
          fill="#fb923c"
          opacity="0.7"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.7 }}
          transition={{ duration: 0.5, delay: particle.delay }}
        />
      ))}
    </svg>
  );
}
