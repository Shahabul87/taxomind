'use client';

import Image from 'next/image';
import { Shield } from 'lucide-react';
import { motion } from '@/components/lazy-motion';
import type { ImagePresentationProps } from './image-presentation';

export function ExecutiveCardImage({ imageUrl, title, theme, shouldAnimate }: ImagePresentationProps) {
  const { colors } = theme;
  const FallbackIcon = theme.fallbackIcon;

  return (
    <div className="relative">
      {/* Outer gold-accented frame */}
      <div
        className="relative rounded-xl p-1 border border-amber-600/20"
        style={{
          boxShadow: '0 25px 50px -12px rgba(180, 83, 9, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div className="relative rounded-lg overflow-hidden">
          {imageUrl ? (
            <div className="relative aspect-video">
              <Image
                src={imageUrl}
                alt={title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-t from-${colors.imageOverlay} via-transparent to-transparent`} />
            </div>
          ) : (
            <div className={`relative aspect-video bg-gradient-to-br ${theme.fallbackGradient ?? 'from-slate-900 to-slate-800'} flex flex-col items-center justify-center gap-3`}>
              <FallbackIcon className={`h-24 w-24 text-${colors.instructorText}/50`} />
              {/* Gold accent line */}
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            </div>
          )}

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-md border-t border-amber-600/15 px-4 py-2.5 text-center">
            <span className="text-[10px] text-amber-200/60 font-semibold uppercase tracking-[0.2em]">
              Professional Certificate
            </span>
          </div>
        </div>

        {/* Seal badge at top-right */}
        <motion.div
          className="absolute -top-4 -right-4 w-14 h-14 rounded-full border-2 border-amber-500/30 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center shadow-lg z-10"
          initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
          transition={shouldAnimate ? { duration: 0.5, delay: 0.3, ease: 'easeOut' } : undefined}
        >
          <Shield className="h-6 w-6 text-amber-400/80" />
        </motion.div>
      </div>

      {/* NO float animation for business - stability = trust */}

      {/* Warm glow (subtle, not animated) */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
      <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl" />
    </div>
  );
}
