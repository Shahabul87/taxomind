"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useAnimation, PanInfo } from 'framer-motion';

// Types for touch interactions
interface TouchPoint {
  identifier: number;
  x: number;
  y: number;
  timestamp: number;
}

interface GestureState {
  isSwipeLeft: boolean;
  isSwipeRight: boolean;
  isSwipeUp: boolean;
  isSwipeDown: boolean;
  isPinching: boolean;
  isRotating: boolean;
  scale: number;
  rotation: number;
  velocity: { x: number; y: number };
}

interface TouchSystemProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onRotate?: (rotation: number) => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onTap?: () => void;
  children: React.ReactNode;
  className?: string;
  swipeThreshold?: number;
  velocityThreshold?: number;
  doubleTapDelay?: number;
  longPressDelay?: number;
  disabled?: boolean;
}

export function EnhancedTouchSystem({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  onRotate,
  onDoubleTap,
  onLongPress,
  onTap,
  children,
  className = '',
  swipeThreshold = 50,
  velocityThreshold = 500,
  doubleTapDelay = 300,
  longPressDelay = 500,
  disabled = false
}: TouchSystemProps) {
  const [touchState, setTouchState] = useState<GestureState>({
    isSwipeLeft: false,
    isSwipeRight: false,
    isSwipeUp: false,
    isSwipeDown: false,
    isPinching: false,
    isRotating: false,
    scale: 1,
    rotation: 0,
    velocity: { x: 0, y: 0 }
  });

  const [touchHistory, setTouchHistory] = useState<TouchPoint[]>([]);
  const [lastTap, setLastTap] = useState<number>(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [initialDistance, setInitialDistance] = useState<number>(0);
  const [initialAngle, setInitialAngle] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const rotate = useMotionValue(0);
  const controls = useAnimation();

  // Calculate distance between two points
  const getDistance = useCallback((p1: TouchPoint, p2: TouchPoint): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }, []);

  // Calculate angle between two points
  const getAngle = useCallback((p1: TouchPoint, p2: TouchPoint): number => {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const touches = Array.from(e.touches).map(touch => ({
      identifier: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }));

    setTouchHistory(touches);

    // Clear any existing long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }

    // Start long press timer for single touch
    if (touches.length === 1) {
      const timer = setTimeout(() => {
        onLongPress?.();
      }, longPressDelay);
      setLongPressTimer(timer);
    }

    // Handle multi-touch gestures
    if (touches.length === 2) {
      const distance = getDistance(touches[0], touches[1]);
      const angle = getAngle(touches[0], touches[1]);
      setInitialDistance(distance);
      setInitialAngle(angle);
    }
  }, [disabled, longPressTimer, longPressDelay, onLongPress, getDistance, getAngle]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    e.preventDefault();
    const touches = Array.from(e.touches).map(touch => ({
      identifier: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }));

    // Clear long press timer on move
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // Handle pinch and rotate gestures
    if (touches.length === 2 && touchHistory.length === 2) {
      const currentDistance = getDistance(touches[0], touches[1]);
      const currentAngle = getAngle(touches[0], touches[1]);
      
      if (initialDistance > 0) {
        const scaleValue = currentDistance / initialDistance;
        const rotationValue = currentAngle - initialAngle;
        
        setTouchState(prev => ({
          ...prev,
          scale: scaleValue,
          rotation: rotationValue,
          isPinching: Math.abs(scaleValue - 1) > 0.1,
          isRotating: Math.abs(rotationValue) > 5
        }));

        onPinch?.(scaleValue);
        onRotate?.(rotationValue);
      }
    }

    setTouchHistory(touches);
  }, [disabled, longPressTimer, touchHistory, initialDistance, initialAngle, getDistance, getAngle, onPinch, onRotate]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    const currentTime = Date.now();
    const touches = Array.from(e.changedTouches).map(touch => ({
      identifier: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp: currentTime
    }));

    // Handle single tap and double tap
    if (touches.length === 1 && touchHistory.length === 1) {
      const touch = touches[0];
      const startTouch = touchHistory[0];
      const deltaX = touch.x - startTouch.x;
      const deltaY = touch.y - startTouch.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = currentTime - startTouch.timestamp;

      // If it's a tap (small movement, short duration)
      if (distance < 10 && duration < 200) {
        // Check for double tap
        if (currentTime - lastTap < doubleTapDelay) {
          onDoubleTap?.();
          setLastTap(0);
        } else {
          setLastTap(currentTime);
          setTimeout(() => {
            if (lastTap === currentTime) {
              onTap?.();
            }
          }, doubleTapDelay);
        }
      } else if (distance > swipeThreshold) {
        // Handle swipe gestures
        const velocity = distance / duration;
        
        if (velocity > velocityThreshold / 1000) {
          const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
          
          if (angle > -45 && angle < 45) {
            onSwipeRight?.();
            setTouchState(prev => ({ ...prev, isSwipeRight: true }));
          } else if (angle > 45 && angle < 135) {
            onSwipeDown?.();
            setTouchState(prev => ({ ...prev, isSwipeDown: true }));
          } else if (angle > 135 || angle < -135) {
            onSwipeLeft?.();
            setTouchState(prev => ({ ...prev, isSwipeLeft: true }));
          } else if (angle > -135 && angle < -45) {
            onSwipeUp?.();
            setTouchState(prev => ({ ...prev, isSwipeUp: true }));
          }
        }
      }
    }

    // Reset touch state after a delay
    setTimeout(() => {
      setTouchState({
        isSwipeLeft: false,
        isSwipeRight: false,
        isSwipeUp: false,
        isSwipeDown: false,
        isPinching: false,
        isRotating: false,
        scale: 1,
        rotation: 0,
        velocity: { x: 0, y: 0 }
      });
    }, 300);

    setTouchHistory([]);
  }, [disabled, longPressTimer, touchHistory, lastTap, doubleTapDelay, swipeThreshold, velocityThreshold, onDoubleTap, onTap, onSwipeRight, onSwipeDown, onSwipeLeft, onSwipeUp]);

  // Handle pan gesture with framer-motion
  const handlePan = useCallback((event: any, info: PanInfo) => {
    if (disabled) return;

    const { offset, velocity } = info;
    
    setTouchState(prev => ({
      ...prev,
      velocity: { x: velocity.x, y: velocity.y }
    }));

    // Update motion values
    x.set(offset.x);
    y.set(offset.y);
  }, [disabled, x, y]);

  // Handle pan end
  const handlePanEnd = useCallback((event: any, info: PanInfo) => {
    if (disabled) return;

    const { offset, velocity } = info;
    
    // Snap back to original position
    controls.start({
      x: 0,
      y: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    });

    // Reset motion values
    x.set(0);
    y.set(0);
  }, [disabled, controls, x, y]);

  return (
    <motion.div
      ref={containerRef}
      className={`touch-system ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      whileTap={{ scale: 0.98 }}
      animate={controls}
      style={{
        x,
        y,
        scale,
        rotate,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {children}
    </motion.div>
  );
}

// Touch feedback component for visual feedback
export function TouchFeedback({ 
  isActive, 
  type = 'primary',
  size = 'medium',
  className = '' 
}: { 
  isActive: boolean;
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const typeClasses = {
    primary: 'bg-blue-500/20 border-blue-500/50',
    secondary: 'bg-gray-500/20 border-gray-500/50',
    success: 'bg-green-500/20 border-green-500/50',
    warning: 'bg-yellow-500/20 border-yellow-500/50',
    error: 'bg-red-500/20 border-red-500/50'
  };

  return (
    <motion.div
      className={`
        fixed pointer-events-none rounded-full border-2 z-50
        ${sizeClasses[size]} 
        ${typeClasses[type]} 
        ${className}
      `}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isActive ? 1 : 0,
        opacity: isActive ? 1 : 0
      }}
      transition={{ duration: 0.2 }}
    />
  );
}

// Swipe indicator component
export function SwipeIndicator({ 
  direction, 
  isActive, 
  className = '' 
}: { 
  direction: 'left' | 'right' | 'up' | 'down';
  isActive: boolean;
  className?: string;
}) {
  const directionClasses = {
    left: 'rotate-180',
    right: 'rotate-0',
    up: 'rotate-90',
    down: '-rotate-90'
  };

  return (
    <motion.div
      className={`
        fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        pointer-events-none z-50 ${className}
      `}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isActive ? 1 : 0,
        opacity: isActive ? 1 : 0
      }}
      transition={{ duration: 0.2 }}
    >
      <div className={`
        w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500/50
        flex items-center justify-center ${directionClasses[direction]}
      `}>
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.div>
  );
}

// Pinch zoom indicator
export function PinchZoomIndicator({ 
  isActive, 
  scale, 
  className = '' 
}: { 
  isActive: boolean;
  scale: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`
        fixed top-8 left-1/2 transform -translate-x-1/2
        pointer-events-none z-50 ${className}
      `}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isActive ? 1 : 0,
        opacity: isActive ? 1 : 0
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="
        px-4 py-2 rounded-full bg-gray-900/80 backdrop-blur-sm
        border border-gray-700/50 text-white text-sm font-medium
      ">
        {scale > 1 ? 'Zoom In' : 'Zoom Out'} {Math.round(scale * 100)}%
      </div>
    </motion.div>
  );
}

// Long press indicator
export function LongPressIndicator({ 
  isActive, 
  progress, 
  className = '' 
}: { 
  isActive: boolean;
  progress: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`
        fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        pointer-events-none z-50 ${className}
      `}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isActive ? 1 : 0,
        opacity: isActive ? 1 : 0
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-700/50" />
        <svg className="absolute inset-0 w-16 h-16 -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${progress * 176} 176`}
            className="text-blue-500 transition-all duration-100"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-blue-500/20 border-2 border-blue-500/50" />
        </div>
      </div>
    </motion.div>
  );
}

// Touch ripple effect
export function TouchRipple({ 
  isActive, 
  x, 
  y, 
  className = '' 
}: { 
  isActive: boolean;
  x: number;
  y: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`
        fixed pointer-events-none rounded-full z-50
        border-2 border-blue-500/50 ${className}
      `}
      style={{
        left: x - 24,
        top: y - 24
      }}
      initial={{ scale: 0, opacity: 0.8 }}
      animate={{
        scale: isActive ? 2 : 0,
        opacity: isActive ? 0 : 0.8
      }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-12 h-12 rounded-full bg-blue-500/20" />
    </motion.div>
  );
}

// Hook for using the touch system
export function useTouchGestures() {
  const [gestureState, setGestureState] = useState<GestureState>({
    isSwipeLeft: false,
    isSwipeRight: false,
    isSwipeUp: false,
    isSwipeDown: false,
    isPinching: false,
    isRotating: false,
    scale: 1,
    rotation: 0,
    velocity: { x: 0, y: 0 }
  });

  const resetGestures = useCallback(() => {
    setGestureState({
      isSwipeLeft: false,
      isSwipeRight: false,
      isSwipeUp: false,
      isSwipeDown: false,
      isPinching: false,
      isRotating: false,
      scale: 1,
      rotation: 0,
      velocity: { x: 0, y: 0 }
    });
  }, []);

  return {
    gestureState,
    setGestureState,
    resetGestures
  };
}

// Custom hook for haptic feedback
export function useHapticFeedback() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightTap = useCallback(() => vibrate(50), [vibrate]);
  const mediumTap = useCallback(() => vibrate(100), [vibrate]);
  const heavyTap = useCallback(() => vibrate(200), [vibrate]);
  const doubleTap = useCallback(() => vibrate([50, 50, 50]), [vibrate]);
  const successTap = useCallback(() => vibrate([100, 50, 100]), [vibrate]);
  const errorTap = useCallback(() => vibrate([200, 100, 200]), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    doubleTap,
    successTap,
    errorTap
  };
}