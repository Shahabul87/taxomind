"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSAMGlobal } from './sam-global-provider';
import { SamAITutorAssistant } from '@/app/(protected)/teacher/_components/sam-ai-tutor-assistant';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { 
  MessageCircle, 
  X, 
  ChevronUp, 
  ChevronDown,
  Maximize2,
  Minimize2,
  GraduationCap,
  BookOpen,
  Brain,
  BarChart3,
  HelpCircle
} from 'lucide-react';

interface SAMMobileResponsiveProps {
  className?: string;
}

export function SAMMobileResponsive({ className }: SAMMobileResponsiveProps) {
  const {
    isOpen,
    setIsOpen,
    learningContext,
    tutorMode,
    theme,
    screenSize,
    shouldShow
  } = useSAMGlobal();

  const [isExpanded, setIsExpanded] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null);
  const [touchStartY, setTouchStartY] = useState(0);

  // Handle touch events for mobile interactions
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartY) return;
    
    const currentY = e.touches[0].clientY;
    const diffY = touchStartY - currentY;
    
    if (Math.abs(diffY) > 10) {
      setSwipeDirection(diffY > 0 ? 'up' : 'down');
    }
  }, [touchStartY]);

  const handleTouchEnd = useCallback(() => {
    if (swipeDirection === 'up' && !isExpanded) {
      setIsExpanded(true);
    } else if (swipeDirection === 'down' && isExpanded) {
      setIsExpanded(false);
    }
    
    setTouchStartY(0);
    setSwipeDirection(null);
  }, [swipeDirection, isExpanded]);

  // Get theme-specific icon
  const getThemeIcon = () => {
    switch (theme) {
      case 'teacher': return GraduationCap;
      case 'student': return BookOpen;
      case 'learning': return Brain;
      case 'dashboard': return BarChart3;
      default: return HelpCircle;
    }
  };

  // Get theme-specific styling
  const getThemeStyles = () => {
    switch (theme) {
      case 'teacher':
        return 'from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700';
      case 'student':
        return 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700';
      case 'learning':
        return 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700';
      case 'dashboard':
        return 'from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700';
      default:
        return 'from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800';
    }
  };

  if (!shouldShow) return null;

  const ThemeIcon = getThemeIcon();

  // Mobile (< 768px) - Bottom Sheet
  if (screenSize === 'mobile') {
    return (
      <div className={cn("sam-mobile-responsive", className)}>
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button
              className={cn(
                "fixed bottom-4 right-4 z-[100] h-14 w-14 rounded-full shadow-lg",
                "border-2 border-white/20 backdrop-blur-sm",
                "transition-all duration-300 ease-in-out",
                "hover:scale-110 active:scale-95",
                `bg-gradient-to-r ${getThemeStyles()}`
              )}
            >
              <ThemeIcon className="h-6 w-6 text-white" />
            </Button>
          </DrawerTrigger>
          
          <DrawerContent className="h-[85vh] max-h-[85vh]">
            <div className="flex flex-col h-full">
              <DrawerHeader 
                className={cn(
                  "flex items-center justify-between p-4 border-b",
                  `bg-gradient-to-r ${getThemeStyles()}`
                )}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="flex items-center space-x-3">
                  <ThemeIcon className="h-6 w-6 text-white" />
                  <div>
                    <DrawerTitle className="text-white">SAM AI Tutor</DrawerTitle>
                    <p className="text-sm text-white/80 capitalize">
                      {tutorMode} Mode
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-white" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-white" />
                  )}
                </div>
              </DrawerHeader>
              
              <div className="flex-1 min-h-0">
                <SamAITutorAssistant />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  // Tablet (768px - 1024px) - Side Sheet
  if (screenSize === 'tablet') {
    return (
      <div className={cn("sam-tablet-responsive", className)}>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              className={cn(
                "fixed bottom-6 right-6 z-[100] h-12 w-12 rounded-full shadow-lg",
                "border-2 border-white/20 backdrop-blur-sm",
                "transition-all duration-300 ease-in-out",
                "hover:scale-110 active:scale-95",
                `bg-gradient-to-r ${getThemeStyles()}`
              )}
            >
              <ThemeIcon className="h-5 w-5 text-white" />
            </Button>
          </SheetTrigger>
          
          <SheetContent side="right" className="w-[400px] p-0">
            <div className="flex flex-col h-full">
              <SheetHeader 
                className={cn(
                  "flex items-center justify-between p-4 border-b",
                  `bg-gradient-to-r ${getThemeStyles()}`
                )}
              >
                <div className="flex items-center space-x-3">
                  <ThemeIcon className="h-6 w-6 text-white" />
                  <div>
                    <SheetTitle className="text-white">SAM AI Tutor</SheetTitle>
                    <p className="text-sm text-white/80 capitalize">
                      {tutorMode} Mode • {learningContext.subject || 'General'}
                    </p>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="flex-1 min-h-0">
                <SamAITutorAssistant />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Desktop (> 1024px) - Modal (handled by SAMGlobalAssistant)
  return null;
}

// Mobile-specific SAM Bottom Sheet Component
export function SAMBottomSheet({ 
  trigger, 
  children 
}: { 
  trigger: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const handleDragStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setDragOffset(e.touches[0].clientY);
  }, []);

  const handleDragMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const offset = currentY - dragOffset;
    
    if (offset > 100) {
      setIsOpen(false);
      setIsDragging(false);
    }
  }, [isDragging, dragOffset]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragOffset(0);
  }, []);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50">
          <div 
            className={cn(
              "fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl",
              "h-[85vh] max-h-[85vh] overflow-hidden",
              "transform transition-transform duration-300",
              isDragging ? "transition-none" : ""
            )}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {/* Drag Handle */}
            <div className="flex justify-center py-3 bg-gray-100 dark:bg-slate-800 rounded-t-3xl">
              <div className="w-12 h-1 bg-gray-400 rounded-full" />
            </div>
            
            {/* Content */}
            <div className="flex-1 h-full overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Mobile-specific SAM Side Panel Component
export function SAMSidePanel({ 
  position = 'right',
  width = '320px',
  collapsible = false,
  children 
}: {
  position?: 'left' | 'right';
  width?: string;
  collapsible?: boolean;
  children?: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      className={cn(
        "fixed top-0 bottom-0 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 z-[100]",
        position === 'left' ? 'left-0 border-l-0 border-r' : 'right-0',
        "transition-all duration-300 ease-in-out",
        isCollapsed ? 'w-16' : `w-[${width}]`
      )}
    >
      {collapsible && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-4 right-4 z-10"
        >
          {isCollapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
        </Button>
      )}
      
      <div className={cn("h-full overflow-hidden", isCollapsed && "opacity-50")}>
        {children}
      </div>
    </div>
  );
}

// Mobile-specific SAM Floating Window Component
export function SAMFloatingWindow({ 
  defaultPosition = { x: 20, y: 20 },
  draggable = true,
  resizable = false,
  children 
}: {
  defaultPosition?: { x: number; y: number };
  draggable?: boolean;
  resizable?: boolean;
  children?: React.ReactNode;
}) {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!draggable) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [draggable, position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      className="fixed bg-white dark:bg-slate-900 rounded-lg shadow-xl border z-[100] overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: resizable ? 'auto' : '400px',
        height: resizable ? 'auto' : '500px'
      }}
    >
      {/* Title Bar */}
      <div 
        className="bg-gray-100 dark:bg-slate-800 px-4 py-2 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">SAM AI Tutor</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-yellow-400 rounded-full" />
            <div className="w-3 h-3 bg-green-400 rounded-full" />
            <div className="w-3 h-3 bg-red-400 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}