"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { 
  Menu, X, ChevronLeft, ChevronRight, MoreHorizontal,
  Search, Bell, User, Home, BookOpen, BarChart3,
  Settings, LogOut, Play, Pause, Volume2, VolumeX,
  Download, Share, Star, Heart, MessageCircle
} from 'lucide-react';

// Mobile Navigation Hook
export const useMobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return {
    isOpen,
    activeTab,
    setActiveTab,
    toggleMenu,
    closeMenu
  };
};

// Mobile Navigation Component
export const MobileNavigation = () => {
  const { isOpen, activeTab, setActiveTab, toggleMenu, closeMenu } = useMobileNavigation();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, href: '/' },
    { id: 'courses', label: 'Courses', icon: BookOpen, href: '/courses' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b h-14 flex items-center justify-between px-4">
        <Button variant="ghost" size="sm" onClick={toggleMenu}>
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        <div className="font-semibold">Alam LMS</div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-white transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="font-semibold text-lg">Menu</div>
            <Button variant="ghost" size="sm" onClick={closeMenu}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab(item.id);
                    closeMenu();
                  }}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button variant="ghost" className="w-full justify-start text-red-600">
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "h-full rounded-none flex-col gap-1 text-xs",
                activeTab === item.id && "bg-blue-50 text-blue-600"
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

// Touch Gestures Hook
export const useTouchGestures = (onSwipeLeft?: () => void, onSwipeRight?: () => void) => {
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = 0;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};

// Mobile Carousel Component
export const MobileCarousel = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode[];
  className?: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { onTouchStart, onTouchMove, onTouchEnd } = useTouchGestures(
    () => setCurrentIndex(prev => Math.min(prev + 1, children.length - 1)),
    () => setCurrentIndex(prev => Math.max(prev - 1, 0))
  );

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div 
        className="flex transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children.map((child, index) => (
          <div key={index} className="w-full flex-shrink-0">
            {child}
          </div>
        ))}
      </div>
      
      {/* Indicators */}
      <div className="flex justify-center mt-4 gap-2">
        {children.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              currentIndex === index ? "bg-blue-600" : "bg-gray-300"
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

// Mobile Course Card
export const MobileCourseCard = ({ 
  course 
}: { 
  course: {
    id: string;
    title: string;
    description: string;
    image: string;
    progress: number;
    rating: number;
    duration: string;
    instructor: string;
  }
}) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <Image 
          src={course.image} 
          alt={course.title}
          className="w-full h-48 object-cover"
          width={400}
          height={192}
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm"
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-red-500 text-red-500")} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm"
          >
            <Share className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm">
            {course.duration}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{course.rating}</span>
          </div>
          <span className="text-sm text-gray-600">{course.instructor}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{course.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>
        
        <Button className="w-full mt-4">
          Continue Learning
        </Button>
      </CardContent>
    </Card>
  );
};

// Mobile Video Player
export const MobileVideoPlayer = ({ 
  src, 
  title 
}: { 
  src: string; 
  title: string;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPlaying, showControls]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        className="w-full aspect-video"
        onClick={() => setShowControls(true)}
        onEnded={() => setIsPlaying(false)}
      />
      
      {showControls && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white/80 backdrop-blur-sm"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/80 backdrop-blur-sm"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
        <h3 className="text-white font-medium text-sm">{title}</h3>
      </div>
    </div>
  );
};

// Mobile Layout Wrapper
export const MobileLayoutWrapper = ({ 
  children 
}: { 
  children: React.ReactNode;
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavigation />
      
      {/* Content with proper spacing for fixed headers */}
      <div className="pt-14 pb-16 lg:pt-0 lg:pb-0">
        {children}
      </div>
    </div>
  );
};

// Pull to Refresh Hook
export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;
    
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance * 0.5, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 50 && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  };

  return {
    isRefreshing,
    pullDistance,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};