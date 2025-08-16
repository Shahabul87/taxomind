"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from 'next/navigation';
import Link from "next/link";
import { 
  ChevronRight, LayoutDashboard, User, Settings, BookOpen, BarChart3, Users,
  Calendar, MessageCircle, Brain, Library, HelpCircle, Menu, X, Newspaper,
  Layers, Target, TrendingUp, Clock, Award, Zap, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface EnhancedSidebarProps {
  children?: React.ReactNode;
  onDashboardTabChange?: (tab: string) => void;
  currentDashboardTab?: string;
}

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  href?: string;
  submenu?: { label: string; href: string }[];
}

// Dashboard tab configuration
interface DashboardTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const dashboardTabs: DashboardTab[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <LayoutDashboard className="w-4 h-4" />,
    description: 'AI insights & daily progress'
  },
  {
    id: 'learning',
    label: 'Learning',
    icon: <BookOpen className="w-4 h-4" />,
    description: 'Courses & learning journey'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Performance & predictions'
  },
  {
    id: 'achievements',
    label: 'Achievements',
    icon: <Award className="w-4 h-4" />,
    description: 'Badges & gamification'
  }
];

export function EnhancedSidebar({ children, onDashboardTabChange, currentDashboardTab = 'overview' }: EnhancedSidebarProps) {
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Check if we're on dashboard page
  const isDashboardPage = pathname?.startsWith('/dashboard/user');

  // Update mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle hover effects only on desktop
  const handleMouseEnter = () => {
    if (!isMobile) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
      setActiveSubmenu(null);
    }
  };

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: user?.role === "ADMIN" ? "/dashboard/admin" : (user ? "/dashboard/user" : "/"),
    },
    {
      title: "Profile Manager",
      icon: <User className="w-5 h-5" />,
      href: "/profile",
    },
    {
      title: "Settings",
      icon: <Settings className="w-5 h-5" />,
      href: "/settings",
    },
    {
      title: "Courses",
      icon: <BookOpen className="w-5 h-5" />,
      submenu: [
        { label: "My Courses", href: "/my-courses" },
        { label: "All Courses", href: "/teacher/courses" },
        { label: "Create Course", href: "/teacher/create" },
      ],
    },
    {
      title: "Posts",
      icon: <Newspaper className="w-5 h-5" />,
      submenu: [
        { label: "My Posts", href: "/post/all-posts" },
        { label: "Browse Posts", href: "/post" },
        { label: "Create Post", href: "/post/create-post" },
      ],
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      href: user?.role === "ADMIN" ? "/analytics/admin" : "/analytics/student",
    },
    {
      title: "Groups",
      icon: <Users className="w-5 h-5" />,
      submenu: [
        { label: "My Groups", href: "/groups/my-groups" },
        { label: "All Groups", href: "/groups" },
        { label: "Create Group", href: "/groups/create" },
      ],
    },
    {
      title: "Support",
      icon: <HelpCircle className="w-5 h-5" />,
      href: "/support",
    },
    {
      title: "Message Center",
      icon: <MessageCircle className="w-5 h-5" />,
      href: "/messages",
    },
    {
      title: "Resource Center",
      icon: <Library className="w-5 h-5" />,
      href: "/resources",
    },
    {
      title: "AI Tutor",
      icon: <Brain className="w-5 h-5" />,
      href: "/ai-tutor",
    },
  ];

  const toggleSubmenu = (title: string) => {
    setActiveSubmenu(activeSubmenu === title ? null : title);
  };

  // Mock data for quick stats
  const quickStats = {
    todayMinutes: 42,
    goalMinutes: 60,
    streak: 12,
    completionRate: 87,
    aiScore: 94
  };

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setOpen(!open)}
          className="fixed top-20 left-4 z-50 p-2 rounded-lg 
            dark:bg-gray-800 dark:text-gray-200 dark:hover:text-white dark:hover:bg-gray-700
            bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-100
            transition-colors md:hidden border dark:border-gray-700 border-gray-200"
        >
          {open ? (
            <X className="w-6 h-6" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Backdrop */}
      {isMobile && open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 dark:bg-black/70 z-40 backdrop-blur-md md:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.div
        data-sidebar
        initial={false}
        animate={{ 
          width: (open || (!isMobile && isHovered)) ? "320px" : "94px", // Wider when expanded
          x: isMobile && !open ? "-100%" : 0 
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "h-full border-r",
          "flex flex-col z-40 transition-all duration-300",
          "dark:bg-gray-900/95 dark:border-gray-700",
          "bg-white/95 border-gray-200",
          "backdrop-blur-xl"
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          "p-4 border-b",
          "dark:border-gray-700/50",
          "border-gray-200/50"
        )}>
          <div className="flex items-center justify-between">
            <AnimatePresence initial={false}>
              {(open || (!isMobile && isHovered)) ? <Logo /> : <LogoIcon />}
            </AnimatePresence>
            {isMobile && (
              <button
                onClick={() => setOpen(!open)}
                className={cn(
                  "p-2 rounded-lg transition-colors lg:hidden",
                  "dark:hover:bg-gray-800/50",
                  "hover:bg-gray-100/50"
                )}
              >
                {open ? (
                  <X className="w-5 h-5 dark:text-gray-400 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 dark:text-gray-400 text-gray-600" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Navigator - Only show on dashboard page */}
        {isDashboardPage && (open || (!isMobile && isHovered)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-4 border-b dark:border-gray-700/50 border-gray-200/50"
          >
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 px-2">
              DASHBOARD
            </h3>
            <div className="space-y-1">
              {dashboardTabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => onDashboardTabChange?.(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200",
                    currentDashboardTab === tab.id
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                  )}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {tab.icon}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{tab.label}</div>
                    <div className="text-xs opacity-70 truncate">{tab.description}</div>
                  </div>
                  {currentDashboardTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="w-2 h-2 bg-purple-500 rounded-full"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Stats - Only show on dashboard page */}
        {isDashboardPage && (open || (!isMobile && isHovered)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-4 border-b dark:border-gray-700/50 border-gray-200/50"
          >
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 px-2">
              TODAY&apos;S PROGRESS
            </h3>
            
            {/* Daily Goal Progress */}
            <div className="px-2 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Study Goal</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {quickStats.todayMinutes}/{quickStats.goalMinutes}m
                </span>
              </div>
              <Progress 
                value={(quickStats.todayMinutes / quickStats.goalMinutes) * 100} 
                className="h-2"
              />
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-3 text-center">
                  <Clock className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{quickStats.streak}</div>
                  <div className="text-xs text-gray-500">Day Streak</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-3 text-center">
                  <Target className="w-4 h-4 text-green-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{quickStats.completionRate}%</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </CardContent>
              </Card>
            </div>

            {/* AI Score */}
            <div className="mt-3 px-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI Score</span>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  {quickStats.aiScore}
                </Badge>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 space-y-1 no-scrollbar">
          {menuItems.map((item, index) => (
            <div key={index}>
              <motion.div
                initial={false}
                onClick={() => {
                  if (item.submenu) {
                    toggleSubmenu(item.title);
                  } else if (item.href) {
                    router.push(item.href);
                    if (isMobile) setOpen(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 mx-2 rounded-lg cursor-pointer",
                  "transition-all duration-300",
                  (pathname === item.href || activeSubmenu === item.title)
                    ? "dark:bg-purple-500/10 dark:text-purple-400 bg-purple-50 text-purple-600"
                    : "dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200 text-gray-600 hover:bg-gray-100/50 hover:text-gray-900"
                )}
              >
                {item.icon}
                {(open || (!isMobile && isHovered)) && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 text-sm font-medium"
                  >
                    {item.title}
                  </motion.span>
                )}
                {(open || (!isMobile && isHovered)) && item.submenu && (
                  <motion.svg
                    animate={{ rotate: activeSubmenu === item.title ? 180 : 0 }}
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </motion.svg>
                )}
              </motion.div>

              {/* Submenu */}
              {(open || (!isMobile && isHovered)) && item.submenu && (
                <AnimatePresence initial={false}>
                  {activeSubmenu === item.title && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      {item.submenu.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2 mx-6 rounded-lg text-sm",
                            "transition-all duration-300",
                            pathname === subItem.href
                              ? "dark:text-purple-400 dark:bg-purple-500/10 text-purple-600 bg-purple-50"
                              : "dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          )}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                          {subItem.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </div>

        {/* Dashboard Quick Actions - Only show on dashboard page */}
        {isDashboardPage && (open || (!isMobile && isHovered)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 border-t dark:border-gray-700/50 border-gray-200/50"
          >
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="w-full bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
                <Zap className="w-4 h-4 mr-1" />
                AI Tutor
              </Button>
              <Button variant="outline" size="sm" className="w-full bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
                <Eye className="w-4 h-4 mr-1" />
                Analytics
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Main Content (if provided) */}
      {children && (
        <div className="flex-1 overflow-x-hidden">
          {children}
        </div>
      )}
    </>
  );
}

// Logo components
export const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors">
      <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
        <Layers className="h-5 w-5" />
      </div>
      <span className="font-medium">iSham</span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link href="/" className="block">
      <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
        <Layers className="h-5 w-5 text-purple-400" />
      </div>
    </Link>
  );
};