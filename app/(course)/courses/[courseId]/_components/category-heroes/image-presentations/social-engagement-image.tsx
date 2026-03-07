'use client';

import Image from 'next/image';
import { Heart, TrendingUp, Share2, Megaphone } from 'lucide-react';
import { motion } from '@/components/lazy-motion';
import type { ImagePresentationProps } from './image-presentation';

const ENGAGEMENT_PILLS = [
  {
    icon: Heart,
    label: '24.5K',
    position: 'top-0 -left-3',
    borderColor: 'border-red-400/30',
    iconColor: 'text-red-400',
    textColor: 'text-red-300',
    delay: 0.2,
    animDuration: 5,
  },
  {
    icon: TrendingUp,
    label: '+340%',
    position: '-top-2 -right-3',
    borderColor: 'border-emerald-400/30',
    iconColor: 'text-emerald-400',
    textColor: 'text-emerald-300',
    delay: 0.4,
    animDuration: 6,
  },
  {
    icon: Share2,
    label: '1.2K',
    position: '-bottom-2 -right-4',
    borderColor: 'border-orange-400/30',
    iconColor: 'text-orange-400',
    textColor: 'text-orange-300',
    delay: 0.6,
    animDuration: 7,
  },
] as const;

export function SocialEngagementImage({ imageUrl, title, theme, shouldAnimate }: ImagePresentationProps) {
  const { colors } = theme;
  const FallbackIcon = theme.fallbackIcon;

  return (
    <div className="relative">
      {/* Main image with slight tilt */}
      <div className="relative" style={{ transform: 'rotate(1deg)' }}>
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
          <div className={`relative aspect-video rounded-2xl overflow-hidden shadow-2xl border ${colors.imageBorder} bg-gradient-to-br ${theme.fallbackGradient ?? 'from-slate-800 to-slate-700'} flex items-center justify-center`}>
            <Megaphone className={`h-24 w-24 ${colors.instructorTextHalf}`} />
          </div>
        )}
      </div>

      {/* Floating engagement metric pills */}
      {ENGAGEMENT_PILLS.map((pill) => (
        <motion.div
          key={pill.label}
          className={`absolute ${pill.position} bg-slate-800/80 backdrop-blur-sm border ${pill.borderColor} rounded-full px-3 py-1.5 shadow-lg z-10 flex items-center gap-1.5`}
          initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
          transition={shouldAnimate ? { duration: 0.4, delay: pill.delay } : undefined}
        >
          <motion.div
            animate={shouldAnimate ? { y: [0, -3, 0] } : undefined}
            transition={shouldAnimate ? { duration: pill.animDuration, repeat: Infinity, ease: 'easeInOut' } : undefined}
            className="flex items-center gap-1.5"
          >
            <pill.icon className={`h-3.5 w-3.5 ${pill.iconColor}`} />
            <span className={`text-xs font-semibold ${pill.textColor}`}>{pill.label}</span>
          </motion.div>
        </motion.div>
      ))}

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
