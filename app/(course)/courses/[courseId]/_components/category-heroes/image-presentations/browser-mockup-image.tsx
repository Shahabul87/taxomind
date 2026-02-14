'use client';

import Image from 'next/image';
import { motion } from '@/components/lazy-motion';
import type { ImagePresentationProps } from './image-presentation';

export function BrowserMockupImage({ imageUrl, title, theme, shouldAnimate }: ImagePresentationProps) {
  const { colors } = theme;
  const FallbackIcon = theme.fallbackIcon;

  return (
    <div className="relative">
      {/* Browser chrome frame */}
      <motion.div
        className="relative rounded-xl bg-slate-800/80 shadow-2xl overflow-hidden border border-slate-700/60"
        whileHover={shouldAnimate ? { scale: 1.01 } : undefined}
        transition={{ duration: 0.3 }}
      >
        {/* Chrome bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/80 border-b border-slate-700/50">
          {/* Traffic light dots */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          {/* URL bar */}
          <div className="flex-1 bg-slate-800/60 rounded-md px-3 py-1 border border-slate-700/50">
            <span className="text-xs text-slate-500 font-mono truncate block">
              localhost:3000/courses/...
            </span>
          </div>
        </div>

        {/* Content area */}
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
          <div className={`relative aspect-video bg-gradient-to-br ${theme.fallbackGradient ?? 'from-slate-800 to-slate-700'} flex flex-col items-center justify-center gap-4`}>
            <FallbackIcon className={`h-20 w-20 text-${colors.instructorText}/50`} />
            {/* Code-line placeholders */}
            <div className="space-y-2 w-3/5">
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-cyan-400/40" />
                <div className="h-2 bg-slate-700/60 rounded w-full" />
              </div>
              <div className="flex gap-2 items-center pl-4">
                <div className="w-2 h-2 rounded-full bg-blue-400/40" />
                <div className="h-2 bg-slate-700/40 rounded w-4/5" />
              </div>
              <div className="flex gap-2 items-center pl-4">
                <div className="w-2 h-2 rounded-full bg-purple-400/40" />
                <div className="h-2 bg-slate-700/40 rounded w-3/5" />
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Floating version badge */}
      {theme.contextBadge && (
        <motion.div
          className={`absolute -bottom-3 -right-3 bg-slate-800/90 backdrop-blur-sm border border-${colors.badgeBorder} rounded-lg px-3 py-1.5 shadow-lg z-10`}
          initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
          transition={shouldAnimate ? { duration: 0.4, delay: 0.3 } : undefined}
        >
          <span className={`text-${colors.instructorText} ${theme.contextBadge.className ?? ''} text-xs font-mono`}>
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
