"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Custom animation hooks
export function useDelayedShow(delay: number = 150): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return show;
}

export function useStaggeredShow(itemCount: number, delay: number = 100): boolean[] {
  const [showItems, setShowItems] = useState<boolean[]>(Array(itemCount).fill(false));

  useEffect(() => {
    const timers = Array(itemCount).fill(null).map((_, index) => 
      setTimeout(() => {
        setShowItems(prev => {
          const newItems = [...prev];
          newItems[index] = true;
          return newItems;
        });
      }, index * delay)
    );

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [itemCount, delay]);

  return showItems;
}

// Animation Components
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, duration = 300, className }: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        "transition-all ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
}

export function SlideIn({ children, direction = 'left', delay = 0, duration = 300, className }: SlideInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const directionClasses = {
    left: isVisible ? "translate-x-0" : "-translate-x-4",
    right: isVisible ? "translate-x-0" : "translate-x-4",
    up: isVisible ? "translate-y-0" : "-translate-y-4",
    down: isVisible ? "translate-y-0" : "translate-y-4"
  };

  return (
    <div
      className={cn(
        "transition-all ease-out",
        isVisible ? "opacity-100" : "opacity-0",
        directionClasses[direction],
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, duration = 200, className }: ScaleInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        "transition-all ease-out",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

interface StaggeredListProps {
  children: React.ReactNode[];
  delay?: number;
  className?: string;
}

export function StaggeredList({ children, delay = 100, className }: StaggeredListProps) {
  const showItems = useStaggeredShow(children.length, delay);

  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={index * delay}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

interface PulseProps {
  children: React.ReactNode;
  className?: string;
}

export function Pulse({ children, className }: PulseProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      {children}
    </div>
  );
}

interface BounceProps {
  children: React.ReactNode;
  className?: string;
}

export function Bounce({ children, className }: BounceProps) {
  return (
    <div className={cn("animate-bounce", className)}>
      {children}
    </div>
  );
}

interface FloatProps {
  children: React.ReactNode;
  className?: string;
}

export function Float({ children, className }: FloatProps) {
  return (
    <div className={cn("animate-float", className)}>
      {children}
    </div>
  );
}

// Hover animations
interface HoverLiftProps {
  children: React.ReactNode;
  className?: string;
}

export function HoverLift({ children, className }: HoverLiftProps) {
  return (
    <div className={cn("transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg", className)}>
      {children}
    </div>
  );
}

interface HoverScaleProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

export function HoverScale({ children, scale = 1.05, className }: HoverScaleProps) {
  return (
    <div 
      className={cn("transition-transform duration-200 cursor-pointer", className)}
      style={{ 
        transform: 'scale(1)',
        ':hover': { transform: `scale(${scale})` }
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = `scale(${scale})`}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      {children}
    </div>
  );
}

// Progress animations
interface ProgressBarProps {
  value: number;
  max?: number;
  duration?: number;
  className?: string;
}

export function AnimatedProgressBar({ value, max = 100, duration = 1000, className }: ProgressBarProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);

    return () => clearTimeout(timer);
  }, [value]);

  const percentage = (animatedValue / max) * 100;

  return (
    <div className={cn("w-full bg-gray-200 rounded-full h-2", className)}>
      <div
        className="h-2 bg-blue-600 rounded-full transition-all ease-out"
        style={{ 
          width: `${percentage}%`,
          transitionDuration: `${duration}ms`
        }}
      />
    </div>
  );
}

// Counter animation
interface CounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, duration = 1000, className }: CounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = count;
    const difference = value - startValue;

    const updateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = Math.round(startValue + difference * easeOutQuart);
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }, [value, duration, count]);

  return <span className={className}>{count}</span>;
}

// Typewriter effect
interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({ text, speed = 50, delay = 0, className }: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      const typeTimer = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= text.length) {
            clearInterval(typeTimer);
            return prev;
          }
          setDisplayText(text.slice(0, prev + 1));
          return prev + 1;
        });
      }, speed);

      return () => clearInterval(typeTimer);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [text, speed, delay]);

  return (
    <span className={cn("typewriter", className)}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

// Modal animations
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedModal({ isOpen, onClose, children, className }: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={cn(
          "relative bg-white rounded-lg shadow-xl transition-all duration-300",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

// Notification animations
interface NotificationProps {
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export function AnimatedNotification({ show, message, type = 'info', duration = 3000, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const colors = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-black'
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 z-50",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full",
        colors[type]
      )}
    >
      {message}
    </div>
  );
}

// Card flip animation
interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  isFlipped: boolean;
  className?: string;
}

export function FlipCard({ front, back, isFlipped, className }: FlipCardProps) {
  return (
    <div className={cn("relative w-full h-full perspective-1000", className)}>
      <div 
        className={cn(
          "relative w-full h-full transition-transform duration-600 transform-style-preserve-3d",
          isFlipped ? "rotate-y-180" : ""
        )}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden">
          {front}
        </div>
        
        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          {back}
        </div>
      </div>
    </div>
  );
}

// Floating action button
interface FloatingActionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

export function FloatingActionButton({ children, onClick, className }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg",
        "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
        "hover:from-blue-600 hover:to-purple-700 hover:shadow-xl",
        "transition-all duration-300 hover:scale-110",
        "flex items-center justify-center z-40",
        className
      )}
    >
      {children}
    </button>
  );
}

// Ripple effect
interface RippleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function RippleButton({ children, onClick, className }: RippleButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);

    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn("relative overflow-hidden", className)}
    >
      {children}
      
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animation: 'ripple 0.6s ease-out'
          }}
        />
      ))}
    </button>
  );
}

// Add custom CSS for animations
const customStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes ripple {
    0% { transform: scale(0); opacity: 0.8; }
    100% { transform: scale(4); opacity: 0; }
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .perspective-1000 {
    perspective: 1000px;
  }
  
  .transform-style-preserve-3d {
    transform-style: preserve-3d;
  }
  
  .backface-hidden {
    backface-visibility: hidden;
  }
  
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = customStyles;
  document.head.appendChild(style);
}