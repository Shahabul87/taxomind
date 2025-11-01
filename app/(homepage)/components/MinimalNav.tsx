'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export const MinimalNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Trigger the slide animation after component mounts
    const timer = setTimeout(() => {
      setLogoLoaded(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${
          scrolled
            ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-md border-b border-gray-200/50 dark:border-gray-800/50'
            : 'bg-transparent'
        }
      `}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Section */}
          <Link href="/" className="flex items-center group">
            {/* Circular Logo Container with Overlap Animation */}
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: logoLoaded ? -8 : 0 }}
              transition={{
                duration: 0.6,
                ease: [0.34, 1.56, 0.64, 1],
                delay: 0.1,
              }}
              className="relative z-10"
            >
              {/* Full Round Circle */}
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden transition-transform group-hover:scale-110 group-hover:rotate-12 shadow-lg shadow-purple-500/30">
                {/* Gradient Background for Circle */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 opacity-90" />

                {/* Logo Image */}
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <Image
                    src="/taxomind-logo.png"
                    alt="Taxomind"
                    width={32}
                    height={32}
                    className="object-contain rounded-full"
                    priority
                  />
                </div>
              </div>
            </motion.div>

            {/* Taxomind Text with T overlap */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent pl-1"
            >
              Taxomind
            </motion.span>
          </Link>

          {/* Sign In Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Link
              href="/auth/login"
              className="
                inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5
                text-sm sm:text-base font-medium
                text-white bg-gradient-to-r from-purple-600 to-blue-600
                rounded-lg sm:rounded-xl
                shadow-lg shadow-purple-500/30
                hover:shadow-xl hover:shadow-purple-500/40
                hover:scale-105 active:scale-95
                transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2
                dark:focus-visible:ring-offset-slate-900
              "
            >
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Sign In</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};
