"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedContentProps {
  children: ReactNode;
}

export function AnimatedContent({ children }: AnimatedContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
} 