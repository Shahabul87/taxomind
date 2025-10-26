'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';

interface EnergyCoinProps {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'filled' | 'empty';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: { width: 80, height: 80, radius: 36, boltScale: 0.8 },
  md: { width: 100, height: 100, radius: 45, boltScale: 1 },
  lg: { width: 120, height: 120, radius: 54, boltScale: 1.2 },
};

export default function EnergyCoin({ size = 'md', tone = 'filled', className = '', label }: EnergyCoinProps) {
  const shouldReduceMotion = useReducedMotion();
  const { width, height, radius, boltScale } = sizeMap[size];

  const floatVariants: Variants = {
    initial: { y: 0 },
    animate: shouldReduceMotion
      ? { y: 0 }
      : {
          y: [0, -10, 0],
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: [0.42, 0, 0.58, 1],
          },
        },
  };

  const scaleVariants: Variants = {
    hidden: { scale: 0.96, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={floatVariants}
      initial="initial"
      animate="animate"
      aria-hidden="true"
    >
      <motion.svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        variants={scaleVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* Main circle with gradient */}
        <defs>
          <linearGradient id={`energy-gradient-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#84cc16" stopOpacity="1" />
            <stop offset="100%" stopColor="#65a30d" stopOpacity="1" />
          </linearGradient>
          <radialGradient id={`gloss-${size}`} cx="30%" cy="30%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Main filled circle */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill={tone === 'filled' ? `url(#energy-gradient-${size})` : 'none'}
          stroke={tone === 'empty' ? '#d4d4d8' : 'none'}
          strokeWidth={tone === 'empty' ? 2 : 0}
        />

        {/* Glossy highlight ring */}
        {tone === 'filled' && (
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            fill={`url(#gloss-${size})`}
            opacity="0.6"
          />
        )}

        {/* Lightning bolt icon or label text */}
        {label ? (
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#18181b"
            fontSize={size === 'sm' ? '12' : size === 'md' ? '14' : '16'}
            fontWeight="700"
            className="select-none"
          >
            {label}
          </text>
        ) : (
          <g transform={`translate(${width / 2 - 12 * boltScale}, ${height / 2 - 16 * boltScale}) scale(${boltScale})`}>
            <path
              d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
              fill={tone === 'filled' ? '#18181b' : '#d4d4d8'}
              stroke={tone === 'filled' ? '#18181b' : '#d4d4d8'}
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </g>
        )}
      </motion.svg>
    </motion.div>
  );
}
