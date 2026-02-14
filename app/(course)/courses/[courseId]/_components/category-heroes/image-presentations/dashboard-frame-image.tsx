'use client';

import Image from 'next/image';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';
import { motion } from '@/components/lazy-motion';
import type { ImagePresentationProps } from './image-presentation';

export function DashboardFrameImage({ imageUrl, title, theme, shouldAnimate }: ImagePresentationProps) {
  const { colors } = theme;
  const FallbackIcon = theme.fallbackIcon;

  return (
    <div className="relative">
      <div className="relative rounded-xl bg-slate-900/60 border border-slate-700/50 overflow-hidden shadow-2xl">
        {/* Top metrics bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/80 border-b border-slate-700/40">
          <div className={`bg-slate-700/60 rounded-md px-3 py-1.5 flex items-center gap-1.5`}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-300 font-medium">Rows: 24.5K</span>
          </div>
          <div className="bg-slate-700/60 rounded-md px-3 py-1.5">
            <span className="text-xs text-slate-300 font-medium">Accuracy: 96.2%</span>
          </div>
          <div className="bg-slate-700/60 rounded-md px-3 py-1.5">
            <span className="text-xs text-slate-300 font-medium">Features: 42</span>
          </div>
        </div>

        <div className="flex">
          {/* Left sidebar strip */}
          <div className="w-10 bg-slate-900/40 border-r border-slate-700/40 flex flex-col items-center gap-3 py-4">
            <BarChart3 className="h-4 w-4 text-emerald-400/60" />
            <TrendingUp className="h-4 w-4 text-teal-400/60" />
            <PieChart className="h-4 w-4 text-cyan-400/60" />
          </div>

          {/* Image area */}
          <div className="flex-1">
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
              <div className={`relative aspect-video bg-gradient-to-br ${theme.fallbackGradient ?? 'from-slate-800 to-slate-700'} flex items-center justify-center`}>
                <div className="flex flex-col items-center gap-3">
                  <FallbackIcon className={`h-16 w-16 text-${colors.instructorText}/50`} />
                  {/* Animated gradient bars */}
                  <div className="flex items-end gap-1.5 h-8">
                    {[40, 65, 50, 80, 55, 70, 45].map((height, i) => (
                      <motion.div
                        key={i}
                        className="w-2 rounded-t bg-emerald-500/30"
                        style={{ height: `${height}%` }}
                        animate={shouldAnimate ? { height: [`${height}%`, `${Math.max(20, height - 20)}%`, `${height}%`] } : undefined}
                        transition={shouldAnimate ? { duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut' } : undefined}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating "Live Data" badge */}
      <motion.div
        className="absolute -bottom-3 -right-3 bg-slate-800/90 backdrop-blur-sm border border-emerald-400/30 rounded-lg px-3 py-1.5 shadow-lg z-10 flex items-center gap-1.5"
        initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
        animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
        transition={shouldAnimate ? { duration: 0.4, delay: 0.3 } : undefined}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-emerald-300 font-medium">Live Data</span>
      </motion.div>

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
