'use client';

import { motion } from 'framer-motion';

export default function FloatingCards() {
  const cards = [
    { x: 0, y: 0, delay: 0.6, rotate: -5 },
    { x: 10, y: 8, delay: 0.7, rotate: 3 },
    { x: 5, y: 16, delay: 0.8, rotate: -2 },
  ];

  return (
    <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 md:block" aria-hidden="true">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          className="absolute h-12 w-16 rounded-md bg-white shadow-lg dark:bg-gray-800"
          style={{ left: card.x, top: card.y }}
          initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
          animate={{ opacity: 1, scale: 1, rotate: card.rotate }}
          transition={{ duration: 0.6, delay: card.delay }}
        />
      ))}
    </div>
  );
}
