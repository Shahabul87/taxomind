'use client';

// Re-export Framer Motion components and hooks
// NOTE: While we tried lazy loading, it caused component type issues
// Keeping direct exports for now, but animations are optimized via:
// 1. Reduced animation durations
// 2. Simpler transform values
// 3. Code splitting of page sections
export { motion, AnimatePresence, useReducedMotion, useInView } from 'framer-motion';
