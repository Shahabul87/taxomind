'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface BrandSectionProps {
  showText?: boolean;
  className?: string;
}

export function BrandSection({ showText = true, className }: BrandSectionProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className ?? ''}`}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative h-8 w-8 overflow-hidden rounded-full bg-white dark:bg-slate-900 shadow-md ring-2 ring-purple-500/20"
      >
        <Image
          src="/taxomind-logo.png"
          alt="Taxomind Logo"
          width={32}
          height={32}
          className="h-full w-full object-cover"
          priority
        />
      </motion.div>
      {showText && (
        <span className="hidden lg:inline-block text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          TaxoMind
        </span>
      )}
    </Link>
  );
}
