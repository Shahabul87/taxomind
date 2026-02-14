'use client';

import Image from 'next/image';
import { motion } from '@/components/lazy-motion';
import type { ImagePresentationProps } from './image-presentation';

export function GlassFrameImage({ imageUrl, title, theme, shouldAnimate }: ImagePresentationProps) {
  const { colors } = theme;
  const FallbackIcon = theme.fallbackIcon;

  return (
    <div className="relative">
      {/* Outer glass frame */}
      <div
        className="relative rounded-2xl p-3 bg-white/5 backdrop-blur-xl"
        style={{
          boxShadow: `0 0 0 1px rgba(129, 140, 248, 0.3), 0 0 30px rgba(129, 140, 248, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
        }}
      >
        {/* Corner accent dots */}
        <motion.div
          className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-indigo-400"
          style={{ boxShadow: '0 0 8px rgba(129, 140, 248, 0.6)' }}
          animate={shouldAnimate ? { opacity: [0.5, 1, 0.5] } : undefined}
          transition={shouldAnimate ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : undefined}
        />
        <motion.div
          className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-400"
          style={{ boxShadow: '0 0 8px rgba(96, 165, 250, 0.6)' }}
          animate={shouldAnimate ? { opacity: [1, 0.5, 1] } : undefined}
          transition={shouldAnimate ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : undefined}
        />

        {imageUrl ? (
          <div className={`relative aspect-video rounded-xl overflow-hidden border border-${colors.imageBorder}`}>
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
          <div className={`relative aspect-video rounded-xl overflow-hidden border border-${colors.imageBorder} bg-gradient-to-br ${theme.fallbackGradient ?? 'from-slate-900 to-indigo-900/40'} flex flex-col items-center justify-center gap-4`}>
            <FallbackIcon className={`h-24 w-24 text-${colors.instructorText}/50`} />
            <div className={`text-2xl font-serif text-${colors.instructorText}/30`}>
              f(x) = &#x222B; dx
            </div>
          </div>
        )}
      </div>

      {/* Context Badge (math formula) */}
      {theme.contextBadge && (
        <motion.div
          className={`absolute -bottom-4 -right-4 bg-slate-800/90 backdrop-blur-sm border border-${colors.badgeBorder} rounded-xl px-4 py-2 shadow-lg z-10`}
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={shouldAnimate ? { duration: 0.5, delay: 0.4 } : undefined}
        >
          <span className={`text-${colors.instructorText} ${theme.contextBadge.className ?? ''} text-sm`}>
            {theme.contextBadge.text}
          </span>
        </motion.div>
      )}

      {/* Floating Glow Elements */}
      <motion.div
        className={`absolute -right-4 -top-4 w-24 h-24 bg-${theme.glowColors[0]}/20 rounded-full blur-2xl`}
        animate={shouldAnimate ? { y: [0, -15, 0] } : undefined}
        transition={shouldAnimate ? { duration: 6, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
      <motion.div
        className={`absolute -left-4 -bottom-4 w-32 h-32 bg-${theme.glowColors[1]}/20 rounded-full blur-2xl`}
        animate={shouldAnimate ? { y: [0, 10, 0] } : undefined}
        transition={shouldAnimate ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
    </div>
  );
}
