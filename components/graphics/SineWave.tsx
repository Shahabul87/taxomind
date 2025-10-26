'use client';

import { motion, type Variants } from 'framer-motion';

export default function SineWave() {
  const pathVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 0.5,
      transition: { duration: 1.5, delay: 0.5, ease: [0.42, 0, 0.58, 1] },
    },
  };

  return (
    <svg
      className="absolute -right-10 bottom-10 hidden lg:block"
      width="120"
      height="60"
      viewBox="0 0 120 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <motion.path
        d="M0,30 Q15,10 30,30 T60,30 T90,30 T120,30"
        stroke="#3b82f6"
        strokeWidth="2"
        fill="none"
        variants={pathVariants}
        initial="hidden"
        animate="visible"
      />
      <motion.circle
        cx="90"
        cy="30"
        r="4"
        fill="#3b82f6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1.5 }}
      />
    </svg>
  );
}
