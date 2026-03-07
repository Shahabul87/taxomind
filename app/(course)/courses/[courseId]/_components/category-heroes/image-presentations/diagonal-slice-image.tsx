'use client';

import Image from 'next/image';
import { Pen } from 'lucide-react';
import { motion } from '@/components/lazy-motion';
import type { ImagePresentationProps } from './image-presentation';

export function DiagonalSliceImage({ imageUrl, title, theme, shouldAnimate }: ImagePresentationProps) {
  const { colors } = theme;
  const FallbackIcon = theme.fallbackIcon;
  const clipPath = 'polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%)';

  return (
    <div className="relative">
      {/* Accent gradient strip behind image */}
      <div
        className={`absolute inset-0 translate-x-2 -translate-y-2 rounded-2xl bg-gradient-to-br ${theme.glowColors.accentGradient ?? `${theme.glowColors.topRight.replace('bg-', 'from-')} to-transparent`}`}
        style={{ clipPath }}
      />

      {/* Main image with diagonal clip */}
      {imageUrl ? (
        <div
          className={`relative aspect-video rounded-2xl overflow-hidden shadow-2xl border ${colors.imageBorder}`}
          style={{ clipPath }}
        >
          <Image
            src={imageUrl}
            alt={title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${colors.imageOverlay} via-transparent to-transparent`} />
        </div>
      ) : (
        <div
          className={`relative aspect-video rounded-2xl overflow-hidden shadow-2xl border ${colors.imageBorder} bg-gradient-to-br ${theme.fallbackGradient ?? 'from-slate-800 to-slate-700'} flex flex-col items-center justify-center`}
          style={{ clipPath }}
        >
          <FallbackIcon className={`h-24 w-24 ${colors.instructorTextHalf}`} />
          {/* Color swatches along bottom */}
          <div className="absolute bottom-4 left-1/4 right-1/4 flex gap-2 justify-center">
            <div className="w-6 h-6 rounded-full bg-pink-500/40 border border-pink-400/30" />
            <div className="w-6 h-6 rounded-full bg-purple-500/40 border border-purple-400/30" />
            <div className="w-6 h-6 rounded-full bg-rose-500/40 border border-rose-400/30" />
            <div className="w-6 h-6 rounded-full bg-fuchsia-500/40 border border-fuchsia-400/30" />
          </div>
        </div>
      )}

      {/* Floating icon circle at top-right */}
      <motion.div
        className={`absolute -top-3 -right-3 w-12 h-12 rounded-full ${theme.glowColors.iconCircleBg ?? `${theme.glowColors.topRight} ${colors.imageBorder}`} backdrop-blur-sm flex items-center justify-center z-10`}
        animate={shouldAnimate ? { y: [0, -6, 0] } : undefined}
        transition={shouldAnimate ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : undefined}
      >
        <Pen className={`h-5 w-5 ${colors.instructorText}`} />
      </motion.div>

      {/* Floating Glow Elements */}
      <motion.div
        className={`absolute -right-4 -top-4 w-24 h-24 ${theme.glowColors.topRight} rounded-full blur-2xl`}
        animate={shouldAnimate ? { y: [0, -15, 0] } : undefined}
        transition={shouldAnimate ? { duration: 6, repeat: Infinity, ease: 'easeInOut' } : undefined}
        aria-hidden="true"
      />
      <motion.div
        className={`absolute -left-4 -bottom-4 w-32 h-32 ${theme.glowColors.bottomLeft} rounded-full blur-2xl`}
        animate={shouldAnimate ? { y: [0, 10, 0] } : undefined}
        transition={shouldAnimate ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : undefined}
        aria-hidden="true"
      />
    </div>
  );
}
