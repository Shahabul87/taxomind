'use client';

import Image from 'next/image';
import { motion } from '@/components/lazy-motion';
import type { ImagePresentationProps } from './image-presentation';

export function StackedLayersImage({ imageUrl, title, theme, shouldAnimate }: ImagePresentationProps) {
  const { colors } = theme;
  const FallbackIcon = theme.fallbackIcon;

  return (
    <div className="relative">
      {/* Offset background cards */}
      <motion.div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-${theme.glowColors[0]}/20 to-${theme.glowColors[1]}/10 border border-${colors.imageBorder}`}
        style={{ transform: 'rotate(3deg) translate(8px, -8px)' }}
        animate={shouldAnimate ? { rotate: [3, 2.5, 3] } : undefined}
        transition={shouldAnimate ? { duration: 6, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
      <motion.div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-${theme.glowColors[1]}/15 to-${theme.glowColors[0]}/5 border border-${colors.imageBorder}`}
        style={{ transform: 'rotate(-2deg) translate(-6px, -4px)' }}
        animate={shouldAnimate ? { rotate: [-2, -1.5, -2] } : undefined}
        transition={shouldAnimate ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />

      {/* Main image */}
      <div className="relative z-10">
        {imageUrl ? (
          <div className={`relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-${colors.imageBorder}`}>
            <Image
              src={imageUrl}
              alt={title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-${colors.imageOverlay} via-transparent to-transparent`} />

            {/* Stats overlay bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md border-t border-white/10 px-4 py-2.5 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/80 font-medium">
                {theme.stats[0].label} &middot; {theme.stats[1].label}
              </span>
            </div>
          </div>
        ) : (
          <div className={`relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-${colors.imageBorder} bg-gradient-to-br ${theme.fallbackGradient ?? 'from-slate-800 to-slate-700'} flex items-center justify-center`}>
            <FallbackIcon className={`h-24 w-24 text-${colors.instructorText}/50`} />
            {/* Stats overlay bar on fallback too */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md border-t border-white/10 px-4 py-2.5 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/80 font-medium">
                {theme.stats[0].label} &middot; {theme.stats[1].label}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Glow Elements */}
      <motion.div
        className={`absolute -right-4 -top-4 w-24 h-24 bg-${theme.glowColors[0]}/20 rounded-full blur-2xl z-0`}
        animate={shouldAnimate ? { y: [0, -15, 0] } : undefined}
        transition={shouldAnimate ? { duration: 6, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
      <motion.div
        className={`absolute -left-4 -bottom-4 w-32 h-32 bg-${theme.glowColors[1]}/20 rounded-full blur-2xl z-0`}
        animate={shouldAnimate ? { y: [0, 10, 0] } : undefined}
        transition={shouldAnimate ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
    </div>
  );
}
