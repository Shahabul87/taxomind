"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "next-auth";
import { usePathname } from "next/navigation";
import { 
  Brain, BookOpen, TrendingUp, Users, 
  Calendar, MessageSquare, Target, Zap,
  ChevronRight, MoreHorizontal, Bell,
  Search, Filter, Star, Clock,
  BarChart3, Award, BookmarkPlus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Import existing smart dashboard components
import { AIWelcomeHub } from './smart-dashboard/AIWelcomeHub';
import { LearningJourneyMap } from './smart-dashboard/LearningJourneyMap';
import { SmartActionDashboard } from './smart-dashboard/SmartActionDashboard';
import { GamificationEngine } from './smart-dashboard/GamificationEngine';
import { PredictiveAnalytics } from './smart-dashboard/PredictiveAnalytics';
import { RealtimePulse } from './smart-dashboard/RealtimePulse';
import { FloatingAITutor } from './smart-dashboard/FloatingAITutor';

interface AdaptiveDashboardProps {
  user: User;
}

interface DashboardSection {
  id: string;
  title: string;
  icon: any;
  priority: 'high' | 'medium' | 'low';
  component: React.ComponentType<{ user: User }>;
  minWidth: number; // minimum width needed for optimal display
  description: string;
}

export function AdaptiveDashboard({ user }: AdaptiveDashboardProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'focus'>('grid');
  const pathname = usePathname();

  // Monitor window size and sidebar state
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize(); // Initial call

    const handleSidebarState = () => {
      // Detect sidebar expansion by checking if sidebar width > 100px
      const sidebarElement = document.querySelector('[data-sidebar]');
      if (sidebarElement) {
        const width = sidebarElement.getBoundingClientRect().width;
        setSidebarExpanded(width > 150);
      }
    };

    // Initial sidebar state check
    setTimeout(handleSidebarState, 100);

    window.addEventListener('resize', handleResize);
    
    // Listen for sidebar mutations
    const observer = new MutationObserver(handleSidebarState);
    const sidebarElement = document.querySelector('[data-sidebar]');
    if (sidebarElement) {
      observer.observe(sidebarElement, { 
        attributes: true, 
        attributeFilter: ['style'],
        childList: true,
        subtree: true
      });
    }

    // Backup polling for sidebar state (in case mutations don't work)
    const pollingSidebarCheck = setInterval(handleSidebarState, 1000);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      clearInterval(pollingSidebarCheck);
    };
  }, []);

  // Dashboard sections configuration
  const dashboardSections: DashboardSection[] = [
    {
      id: 'ai-welcome',
      title: 'AI Welcome Hub',
      icon: Brain,
      priority: 'high',
      component: AIWelcomeHub,
      minWidth: 320,
      description: 'Personalized AI-powered dashboard overview'
    },
    {
      id: 'learning-journey',
      title: 'Learning Journey',
      icon: BookOpen,
      priority: 'high',
      component: LearningJourneyMap,
      minWidth: 400,
      description: 'Visual progress tracking and learning paths'
    },
    {
      id: 'smart-actions',
      title: 'Smart Actions',
      icon: Zap,
      priority: 'high',
      component: SmartActionDashboard,
      minWidth: 350,
      description: 'Context-aware quick actions and recommendations'
    },
    {
      id: 'predictive-analytics',
      title: 'Predictive Analytics',
      icon: TrendingUp,
      priority: 'medium',
      component: PredictiveAnalytics,
      minWidth: 450,
      description: 'AI-powered learning success predictions'
    },
    {
      id: 'gamification',
      title: 'Achievement System',
      icon: Award,
      priority: 'medium',
      component: GamificationEngine,
      minWidth: 300,
      description: 'Badges, streaks, and learning achievements'
    },
    {
      id: 'realtime-pulse',
      title: 'Live Pulse',
      icon: BarChart3,
      priority: 'low',
      component: RealtimePulse,
      minWidth: 350,
      description: 'Real-time learning activity and insights'
    }
  ];

  // Calculate available width for dashboard content
  const sidebarWidth = sidebarExpanded ? 280 : 80;
  const availableWidth = windowWidth - sidebarWidth - 64; // 64px for padding

  // Adaptive layout calculation
  const getLayoutConfig = () => {
    if (viewMode === 'focus' && activeSection) {
      return { columns: 1, sections: dashboardSections.filter(s => s.id === activeSection) };
    }
    
    if (viewMode === 'list') {
      return { columns: 1, sections: dashboardSections };
    }

    // Smart grid layout based on available width
    if (availableWidth < 600) {
      return { columns: 1, sections: dashboardSections.filter(s => s.priority === 'high') };
    } else if (availableWidth < 900) {
      return { columns: 2, sections: dashboardSections.filter(s => s.priority !== 'low') };
    } else if (availableWidth < 1200) {
      return { columns: 2, sections: dashboardSections };
    } else {
      return { columns: 3, sections: dashboardSections };
    }
  };

  const layoutConfig = getLayoutConfig();

  return (
    <div className="relative min-h-screen">
      {/* Background with adaptive margins */}
      <div 
        className={cn(
          "fixed inset-0 transition-all duration-300",
          "bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30",
          "dark:from-slate-950 dark:via-purple-950/20 dark:to-blue-950/20"
        )}
        style={{
          marginLeft: `${sidebarWidth}px`
        }}
      >
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-30 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0.3))]" />
        
        {/* Floating orbs that adapt to sidebar */}
        <motion.div 
          animate={{ 
            x: sidebarExpanded ? 100 : 50,
            scale: sidebarExpanded ? 1.2 : 1 
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute -top-40 -right-20 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"
        />
        <motion.div 
          animate={{ 
            x: sidebarExpanded ? -50 : -20,
            scale: sidebarExpanded ? 1.1 : 1 
          }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="absolute top-[30%] -left-20 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"
        />
      </div>

      {/* Main Dashboard Content */}
      <motion.div
        layout
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className={cn(
          "relative z-10 transition-all duration-300",
          "px-6 py-6"
        )}
        style={{
          marginLeft: `${sidebarWidth}px`
        }}
      >
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Welcome Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-purple-700 dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
                Welcome back, {user.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Your learning journey continues with AI-powered insights
              </p>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Search dashboard..."
                  className="pl-10 w-64 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700"
                />
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700">
                {['grid', 'list', 'focus'].map((mode) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode(mode as any)}
                    className={cn(
                      "text-xs px-3",
                      viewMode === mode && "bg-purple-500 text-white"
                    )}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                ))}
              </div>

              <Button variant="outline" size="sm" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Active Courses", value: "3", change: "+1", icon: BookOpen },
              { label: "Study Streak", value: "12 days", change: "+2", icon: Clock },
              { label: "Completion Rate", value: "87%", change: "+5%", icon: Target },
              { label: "AI Score", value: "94", change: "+3", icon: Brain }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <stat.icon className="w-5 h-5 text-purple-500 mb-1" />
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {stat.change}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Adaptive Dashboard Grid */}
        <motion.div
          layout
          className={cn(
            "grid gap-6",
            viewMode === 'list' ? "grid-cols-1" : 
            `grid-cols-1 md:grid-cols-${Math.min(layoutConfig.columns, 2)} xl:grid-cols-${layoutConfig.columns}`
          )}
        >
          <AnimatePresence mode="wait">
            {layoutConfig.sections.map((section, index) => {
              const Component = section.component;
              
              return (
                <motion.div
                  key={section.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring",
                    damping: 25,
                    stiffness: 300
                  }}
                  className={cn(
                    "group relative",
                    viewMode === 'focus' && "col-span-full",
                    section.priority === 'high' && layoutConfig.columns > 2 && "lg:col-span-2"
                  )}
                >
                  {/* Section Header (for list/focus modes) */}
                  {(viewMode === 'list' || viewMode === 'focus') && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <section.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">{section.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{section.description}</p>
                        </div>
                      </div>
                      
                      {viewMode === 'list' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setActiveSection(section.id);
                            setViewMode('focus');
                          }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Component Container */}
                  <div className={cn(
                    "transition-all duration-300",
                    viewMode === 'grid' && "hover:scale-[1.02]"
                  )}>
                    <Component user={user} />
                  </div>

                  {/* Focus mode exit button */}
                  {viewMode === 'focus' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setViewMode('grid');
                        setActiveSection(null);
                      }}
                      className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm"
                    >
                      Exit Focus
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Floating AI Tutor */}
        <FloatingAITutor user={user} />
      </motion.div>
    </div>
  );
}