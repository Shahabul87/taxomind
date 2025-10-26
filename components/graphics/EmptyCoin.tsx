'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface EmptyCoinProps {
  className?: string;
}

export default function EmptyCoin({ className = '' }: EmptyCoinProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ y: 0 }}
      animate={shouldReduceMotion ? {} : { y: [0, -8, 0] }}
      transition={shouldReduceMotion ? {} : {
        duration: 3.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: 'easeInOut',
        delay: 0.5,
      }}
      aria-hidden="true"
    >
      <motion.svg
        width="90"
        height="90"
        viewBox="0 0 90 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ scale: 0.96, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.4,
          ease: 'easeOut',
          delay: 0.2,
        }}
        viewport={{ once: true }}
      >
        {/* Empty circle with subtle stroke */}
        <circle cx="45" cy="45" r="40" fill="none" stroke="#e4e4e7" strokeWidth="2" opacity="0.6" />

        {/* Light bolt icon */}
        <g transform="translate(35, 29) scale(0.9)" opacity="0.4">
          <path
            d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
            fill="none"
            stroke="#a1a1aa"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>

        {/* Small day label */}
        <text x="45" y="78" textAnchor="middle" fill="#a1a1aa" fontSize="12" fontWeight="500">
          F
        </text>
      </motion.svg>
    </motion.div>
  );
}
