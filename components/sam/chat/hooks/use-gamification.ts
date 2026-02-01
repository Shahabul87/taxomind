import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createGamificationEngine,
  type GamificationEngine,
  type UserProgress,
  type XPEvent,
  type GamificationEvent,
} from '@/lib/sam/gamification';
import type { XPProgress } from '../types';
import { XP_LEVELS } from '../types';

interface UseGamificationOptions {
  enabled?: boolean;
  userId?: string;
}

interface UseGamificationReturn {
  userProgress: UserProgress | null;
  xpProgress: XPProgress | null;
  xpNotifications: XPEvent[];
  showXpAnimation: boolean;
  isFirstInteraction: boolean;
  awardXP: (type: string, metadata?: Record<string, unknown>) => void;
  checkStreak: () => void;
  setFirstInteractionDone: () => void;
  dismissXpAnimation: () => void;
}

function getXPProgress(progress: UserProgress): XPProgress {
  const currentLevel = XP_LEVELS[Math.min(progress.level - 1, XP_LEVELS.length - 1)];
  const current = progress.xp - currentLevel.minXP;
  const needed = currentLevel.maxXP - currentLevel.minXP;
  const percentage = Math.min((current / needed) * 100, 100);

  return {
    current,
    needed: needed === Infinity ? current : needed,
    percentage: needed === Infinity ? 100 : percentage,
    levelName: currentLevel.name,
  };
}

export function useGamification(options: UseGamificationOptions = {}): UseGamificationReturn {
  const { enabled = true, userId } = options;

  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [xpNotifications, setXpNotifications] = useState<XPEvent[]>([]);
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);

  const engineRef = useRef<GamificationEngine | null>(null);

  // Initialize gamification engine
  useEffect(() => {
    if (!enabled || !userId) return;

    const engine = createGamificationEngine(userId);
    engineRef.current = engine;
    setUserProgress(engine.getProgress());

    const unsubscribe = engine.subscribe((event: GamificationEvent) => {
      if (event.type === 'xp_gained') {
        setXpNotifications((prev) => [...prev, event.data]);
        setShowXpAnimation(true);
        setTimeout(() => setShowXpAnimation(false), 2000);
      }
      setUserProgress(engine.getProgress());
    });

    return () => {
      unsubscribe();
      engineRef.current = null;
    };
  }, [enabled, userId]);

  const xpProgress = userProgress ? getXPProgress(userProgress) : null;

  const awardXP = useCallback(
    (type: string, metadata?: Record<string, unknown>) => {
      engineRef.current?.awardXP(type, metadata);
    },
    []
  );

  const checkStreak = useCallback(() => {
    engineRef.current?.checkStreak();
  }, []);

  const setFirstInteractionDone = useCallback(() => {
    setIsFirstInteraction(false);
  }, []);

  const dismissXpAnimation = useCallback(() => {
    setShowXpAnimation(false);
  }, []);

  return {
    userProgress,
    xpProgress,
    xpNotifications,
    showXpAnimation,
    isFirstInteraction,
    awardXP,
    checkStreak,
    setFirstInteractionDone,
    dismissXpAnimation,
  };
}

export { getXPProgress };
