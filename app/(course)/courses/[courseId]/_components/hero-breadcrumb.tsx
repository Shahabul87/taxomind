"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface HeroBreadcrumbProps {
  items: BreadcrumbItem[];
}

export const HeroBreadcrumb = ({ items }: HeroBreadcrumbProps): JSX.Element => {
  const [isRTL, setIsRTL] = React.useState(false);
  React.useEffect(() => {
    try { setIsRTL(typeof document !== 'undefined' && document.dir === 'rtl'); } catch {}
  }, []);
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-2 mb-4"
      aria-label="Breadcrumb"
    >
      {/* Home Icon */}
      <Link
        href="/"
        className="text-white/80 hover:text-white transition-colors duration-200"
        aria-label="Home"
      >
        <Home className="w-4 h-4" aria-hidden="true" />
      </Link>

      {/* Breadcrumb Items */}
      {items.map((item: BreadcrumbItem, index: number) => (
        <React.Fragment key={index}>
          {isRTL ? (
            <ChevronLeft className="w-4 h-4 text-white/60" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/60" />
          )}
          {index === items.length - 1 ? (
            // Last item - current page (not clickable)
            <span className="text-white font-medium text-sm truncate max-w-[250px] sm:max-w-[300px]" aria-current="page">
              {item.label}
            </span>
          ) : (
            // Other items - clickable links
            <Link
              href={item.href}
              className="text-white/80 hover:text-white transition-colors duration-200 text-sm truncate max-w-[180px] sm:max-w-[220px]"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </motion.nav>
  );
};
