'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, ArrowUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LevelUpCelebrationProps {
  isVisible: boolean;
  previousLevel: number;
  newLevel: number;
  previousLevelName: string;
  newLevelName: string;
  xpEarned: number;
  onClose: () => void;
  className?: string;
}

const CONFETTI_COLORS = [
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
];

const LEVEL_COLORS: Record<string, string> = {
  Rememberer: 'from-purple-500 to-purple-600',
  Understander: 'from-cyan-500 to-cyan-600',
  Applier: 'from-emerald-500 to-emerald-600',
  Analyzer: 'from-amber-500 to-amber-600',
  Evaluator: 'from-red-500 to-red-600',
  Creator: 'from-pink-500 to-pink-600',
};

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
}

export function LevelUpCelebration({
  isVisible,
  previousLevel,
  newLevel,
  previousLevelName,
  newLevelName,
  xpEarned,
  onClose,
  className,
}: LevelUpCelebrationProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  const generateConfetti = useCallback(() => {
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      });
    }
    setConfetti(pieces);
  }, []);

  useEffect(() => {
    if (isVisible) {
      generateConfetti();
      const interval = setInterval(generateConfetti, 3000);
      return () => clearInterval(interval);
    }
  }, [isVisible, generateConfetti]);

  const newLevelColor = LEVEL_COLORS[newLevelName] || 'from-purple-500 to-purple-600';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm',
            className
          )}
          onClick={onClose}
        >
          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confetti.map((piece) => (
              <motion.div
                key={piece.id}
                initial={{
                  x: `${piece.x}vw`,
                  y: '-10vh',
                  rotate: piece.rotation,
                  scale: piece.scale,
                }}
                animate={{
                  y: '110vh',
                  rotate: piece.rotation + 360,
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  ease: 'linear',
                }}
                className="absolute w-3 h-3 rounded-sm"
                style={{ backgroundColor: piece.color }}
              />
            ))}
          </div>

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>

            {/* Trophy Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', damping: 10 }}
              className="mb-6"
            >
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
                <Trophy className="h-12 w-12 text-white" />
              </div>
            </motion.div>

            {/* Level Up Text */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-6 w-6 text-amber-500" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  LEVEL UP!
                </h2>
                <Sparkles className="h-6 w-6 text-amber-500" />
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Your cognitive abilities have grown!
              </p>
            </motion.div>

            {/* Level Transition */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-4 mb-6"
            >
              <div className="text-center">
                <div className="text-sm text-slate-500 mb-1">From</div>
                <div className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <div className="text-lg font-bold text-slate-700 dark:text-slate-300">
                    {previousLevel.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500">{previousLevelName}</div>
                </div>
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                <ArrowUp className="h-8 w-8 text-emerald-500 transform rotate-90" />
              </motion.div>

              <div className="text-center">
                <div className="text-sm text-slate-500 mb-1">To</div>
                <div
                  className={cn(
                    'px-4 py-2 rounded-lg bg-gradient-to-br text-white shadow-lg',
                    newLevelColor
                  )}
                >
                  <div className="text-lg font-bold">{newLevel.toFixed(1)}</div>
                  <div className="text-xs opacity-90">{newLevelName}</div>
                </div>
              </div>
            </motion.div>

            {/* XP Earned */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800"
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  +{xpEarned.toLocaleString()} XP Earned!
                </span>
              </div>
            </motion.div>

            {/* Continue Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={onClose}
                className={cn('w-full bg-gradient-to-r text-white shadow-lg', newLevelColor)}
                size="lg"
              >
                Continue Learning
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
