"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
  startOnView?: boolean;
}

export const AnimatedCounter = ({
  end,
  duration = 2,
  prefix = '',
  suffix = '',
  className = '',
  decimals = 0,
  startOnView = true
}: AnimatedCounterProps): JSX.Element => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    return decimals > 0
      ? latest.toFixed(decimals)
      : Math.round(latest).toLocaleString();
  });

  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (!startOnView || inView) {
      const controls = animate(count, end, {
        duration,
        ease: "easeOut",
        onUpdate: (latest) => {
          const formatted = decimals > 0
            ? latest.toFixed(decimals)
            : Math.round(latest).toLocaleString();
          setDisplayValue(formatted);
        }
      });

      return controls.stop;
    }
  }, [inView, end, duration, count, decimals, startOnView]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      {prefix}
      <span className="tabular-nums">{displayValue}</span>
      {suffix}
    </motion.span>
  );
};

// Specialized counter for ratings with star animation
export const AnimatedRatingCounter = ({
  rating,
  totalReviews
}: {
  rating: number;
  totalReviews: number;
}): JSX.Element => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [filledStars, setFilledStars] = useState(0);

  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => {
        setFilledStars(Math.round(rating));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [inView, rating]);

  return (
    <div ref={ref} className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.svg
            key={star}
            className="w-5 h-5"
            viewBox="0 0 24 24"
            initial={{ scale: 0, rotate: -180 }}
            animate={
              inView && star <= filledStars
                ? { scale: 1, rotate: 0 }
                : { scale: 1, rotate: 0 }
            }
            transition={{
              delay: star * 0.1,
              duration: 0.5,
              type: "spring",
              stiffness: 200,
            }}
          >
            <path
              fill={star <= filledStars ? "#facc15" : "transparent"}
              stroke={star <= filledStars ? "#facc15" : "rgba(255,255,255,0.3)"}
              strokeWidth="2"
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </motion.svg>
        ))}
      </div>
      <AnimatedCounter
        end={rating}
        decimals={1}
        className="text-2xl font-bold text-white"
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
        className="text-white/70 text-sm"
      >
        ({totalReviews.toLocaleString()} ratings)
      </motion.span>
    </div>
  );
};