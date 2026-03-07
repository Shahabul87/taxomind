'use client';

import Image from 'next/image';
import { motion } from '@/components/lazy-motion';
import type { ImagePresentationProps } from './image-presentation';

export function TiltImage({ imageUrl, title, theme, shouldAnimate }: ImagePresentationProps) {
  const { colors } = theme;
  const FallbackIcon = theme.fallbackIcon;

  return (
    <div className="relative">
      {/* 3D Perspective wrapper */}
      <div style={{ perspective: '1200px' }}>
        <motion.div
          className="relative"
          initial={shouldAnimate ? { rotateY: -8, rotateX: 4 } : undefined}
          whileHover={shouldAnimate ? { rotateY: -2, rotateX: 1, scale: 1.02 } : undefined}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {imageUrl ? (
            <div className={`relative aspect-video rounded-2xl overflow-hidden shadow-2xl border ${colors.imageBorder}`}>
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
            <div className={`relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-gradient-to-br ${theme.fallbackGradient ?? 'from-slate-800 to-slate-700'} flex items-center justify-center`}>
              <FallbackIcon className="h-32 w-32 text-slate-600" />
            </div>
          )}
        </motion.div>
      </div>

      {/* Shadow reflection */}
      <div className={`absolute -bottom-4 left-[10%] right-[10%] h-16 bg-gradient-to-t ${theme.glowColors.shadowReflection ?? 'from-indigo-500/10'} to-transparent rounded-full blur-2xl`} aria-hidden="true" />

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
