"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from 'next/navigation';
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  LayoutDashboard as IconDashboard,
  User as IconUser,
  Settings as IconSettings,
  BookOpen as IconBook,
  BarChart3 as IconChartBar,
  Users as IconUsers,
  Calendar as IconCalendar,
  MessageCircle as IconMessageCircle,
  Brain as IconBrain,
  Library as IconLibrary,
  HelpCircle as IconHelpCircle,
  Menu as IconMenu2,
  X,
  Newspaper as IconNews,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

interface HomeSidebarProps {
  children?: React.ReactNode;
}

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  href?: string;
  submenu?: { label: string; href: string }[];
}

export function HomeSidebar({ children }: HomeSidebarProps) {
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isTablet, setIsTablet] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Debug user role
  useEffect(() => {
    if (user) {
}
  }, [user]);

  // Load persistent sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-expanded');
    if (savedState !== null) {
      setIsExpanded(JSON.parse(savedState));
    }
  }, []);

  // Check for user's motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update responsive detection for different screen sizes
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1024);
      setIsTablet(width >= 768 && width < 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // On small mobile (<768px), hide sidebar entirely - user menu handles navigation
  // On tablet (768px-1023px), show sidebar as overlay
  // On desktop (≥1024px), show sidebar normally
  const shouldShowSidebar = isTablet || !isMobile;

  // Toggle sidebar expansion
  const toggleExpansion = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    localStorage.setItem('sidebar-expanded', JSON.stringify(newExpanded));
  };

  // Handle hover effects only on desktop (now works with click toggle)
  const handleMouseEnter = () => {
    if (!isMobile && !isExpanded) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (!isMobile && !isExpanded) {
      setIsHovered(false);
      setActiveSubmenu(null);
    }
  };

  // Touch gesture handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Swipe right to open (from left edge)
      if (deltaX > 50 && touchStartX < 50 && !open) {
        setOpen(true);
      }
      // Swipe left to close
      else if (deltaX < -50 && open) {
        setOpen(false);
      }
    }
  };

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && (open || isExpanded)) {
      if (isMobile) {
        setOpen(false);
      } else {
        setIsExpanded(false);
      }
    }
  };

  // Focus management for better accessibility
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (open || isExpanded)) {
        if (isMobile) {
          setOpen(false);
        } else {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [open, isExpanded, isMobile]);

  // Determine if sidebar should show expanded content
  const shouldShowExpanded = isExpanded || (open && isMobile) || (!isMobile && isHovered);

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      icon: <IconDashboard className="w-5 h-5" />,
      href: user?.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/user",
    },
    {
      title: "Profile Manager",
      icon: <IconUser className="w-5 h-5" />,
      href: "/profile",
    },
    {
      title: "Settings",
      icon: <IconSettings className="w-5 h-5" />,
      href: "/settings",
    },
    {
      title: "Courses",
      icon: <IconBook className="w-5 h-5" />,
      submenu: [
        { label: "My Courses", href: "/my-courses" },
        { label: "All Courses", href: "/teacher/courses" },
        { label: "Create Course", href: "/teacher/create" },
      ],
    },
    {
      title: "Posts & Blog",
      icon: <IconNews className="w-5 h-5" />,
      submenu: [
        { label: "My Posts", href: "/post/all-posts" },
        { label: "Browse Posts", href: "/post" },
        { label: "Create Post", href: "/post/create-post" },
      ],
    },
    {
      title: "Analytics",
      icon: <IconChartBar className="w-5 h-5" />,
      href: "/analytics",
    },
    {
      title: "Study Groups",
      icon: <IconUsers className="w-5 h-5" />,
      submenu: [
        { label: "My Groups", href: "/groups/my-groups" },
        { label: "Browse Groups", href: "/groups" },
        { label: "Create Group", href: "/groups/create" },
      ],
    },
    {
      title: "Calendar",
      icon: <IconCalendar className="w-5 h-5" />,
      href: "/calendar",
    },
    {
      title: "AI Tutor",
      icon: <IconBrain className="w-5 h-5" />,
      href: "/ai-tutor",
    },
    {
      title: "Messages",
      icon: <IconMessageCircle className="w-5 h-5" />,
      href: "/messages",
    },
    {
      title: "Resources",
      icon: <IconLibrary className="w-5 h-5" />,
      href: "/resources",
    },
    {
      title: "Support",
      icon: <IconHelpCircle className="w-5 h-5" />,
      href: "/support",
    },
  ];

  const toggleSubmenu = (title: string) => {
    setActiveSubmenu(activeSubmenu === title ? null : title);
  };

  // Don't render sidebar on small mobile - user menu handles navigation
  if (!shouldShowSidebar) {
    return children ? <div className="flex-1 overflow-x-hidden">{children}</div> : null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setOpen(!open)}
          className="fixed top-20 left-4 z-50 p-3 rounded-xl shadow-lg backdrop-blur-sm
            dark:bg-gray-800/90 dark:text-gray-200 dark:hover:text-white dark:hover:bg-gray-700/90
            bg-white/90 text-gray-700 hover:text-gray-900 hover:bg-gray-100/90
            transition-all duration-200 md:hidden border dark:border-gray-700/50 border-gray-200/50
            focus:outline-none focus:ring-2 focus:ring-purple-500/20 hover:scale-105 hover:shadow-xl"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        >
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
          >
            {open ? (
              <X className="w-5 h-5" />
            ) : (
              <IconMenu2 className="w-5 h-5" />
            )}
          </motion.div>
        </button>
      )}

      {/* Backdrop */}
      {isMobile && open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 dark:bg-black/70 z-40 backdrop-blur-md md:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.div
        data-sidebar
        initial={false}
        animate={{ 
          width: shouldShowExpanded ? "280px" : "94px",
          x: isMobile && !open ? "-100%" : 0 
        }}
        transition={{
          duration: prefersReducedMotion ? 0.1 : 0.3,
          ease: prefersReducedMotion ? "linear" : [0.4, 0.0, 0.2, 1], // Custom easing for smoother animation
          width: { duration: prefersReducedMotion ? 0.1 : 0.3 },
          x: { duration: prefersReducedMotion ? 0.1 : 0.2 }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        role="navigation"
        aria-label="Main navigation"
        tabIndex={0}
        className={cn(
          "h-full border-r shadow-sm",
          "flex flex-col z-40 overflow-hidden", // Added overflow-hidden for better performance
          "dark:bg-gray-900/95 dark:border-gray-700/50 dark:shadow-gray-900/50",
          "bg-white/95 border-gray-200/50 shadow-gray-200/50",
          "backdrop-blur-sm"
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          "p-4 border-b bg-gradient-to-r",
          "dark:border-gray-700/50 dark:from-gray-900/50 dark:to-gray-800/50",
          "border-gray-200/50 from-gray-50/50 to-white/50"
        )}>
          <div className="flex items-center justify-between">
            <AnimatePresence initial={false}>
              {shouldShowExpanded ? <Logo /> : <LogoIcon />}
            </AnimatePresence>
            
            {/* Desktop Toggle Button */}
            {!isMobile && (
              <button
                onClick={toggleExpansion}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  "dark:hover:bg-gray-800/50 dark:text-gray-400 hover:dark:text-gray-200",
                  "hover:bg-gray-100/50 text-gray-600 hover:text-gray-900",
                  "focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                )}
                aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.div>
              </button>
            )}
            
            {/* Mobile Toggle Button */}
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
                  <IconMenu2 className="w-5 h-5 dark:text-gray-400 text-gray-600" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 no-scrollbar" role="list">
          {menuItems.map((item, index) => (
            <div key={index} role="listitem">
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (item.submenu) {
                      toggleSubmenu(item.title);
                    } else if (item.href) {
                      router.push(item.href);
                      if (isMobile) setOpen(false);
                    }
                  }
                }}
                role={item.submenu ? "button" : "link"}
                aria-expanded={item.submenu ? activeSubmenu === item.title : undefined}
                aria-haspopup={item.submenu ? "menu" : undefined}
                aria-label={item.title}
                tabIndex={0}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 mx-2 rounded-xl cursor-pointer",
                  "transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20",
                  "hover:scale-[1.02] hover:shadow-sm",
                  (pathname === item.href || activeSubmenu === item.title)
                    ? "dark:bg-gradient-to-r dark:from-purple-500/15 dark:to-purple-600/10 dark:text-purple-400 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200/50 dark:border-purple-500/20 shadow-sm"
                    : "dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-200 text-gray-600 hover:bg-gray-100/60 hover:text-gray-900 hover:border-gray-200/50 dark:hover:border-gray-700/50"
                )}
              >
                {item.icon}
                {shouldShowExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0.1 : 0.2, delay: prefersReducedMotion ? 0 : 0.1 }}
                    className="flex-1 text-sm font-medium"
                  >
                    {item.title}
                  </motion.span>
                )}
                {shouldShowExpanded && item.submenu && (
                  <motion.svg
                    animate={{ rotate: activeSubmenu === item.title ? 180 : 0 }}
                    transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
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
              {shouldShowExpanded && item.submenu && (
                <AnimatePresence initial={false}>
                  {activeSubmenu === item.title && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: prefersReducedMotion ? 0.1 : 0.2, ease: prefersReducedMotion ? "linear" : "easeInOut" }}
                      className="overflow-hidden"
                      role="menu"
                      aria-label={`${item.title} submenu`}
                    >
                      {item.submenu.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          href={subItem.href}
                          role="menuitem"
                          tabIndex={0}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2 mx-6 rounded-lg text-sm",
                            "transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20",
                            "hover:scale-[1.01] hover:shadow-sm",
                            pathname === subItem.href
                              ? "dark:text-purple-400 dark:bg-purple-500/10 text-purple-600 bg-purple-50 border border-purple-200/30 dark:border-purple-500/20 shadow-sm"
                              : "dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700/80 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 hover:border-gray-200/30 dark:hover:border-gray-600/30"
                          )}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                          {subItem.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </nav>
      </motion.div>

      {/* Touch Detection Area for Mobile Swipe Gestures */}
      {isMobile && (
        <div
          className="fixed inset-0 z-30 pointer-events-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ pointerEvents: !open ? 'auto' : 'none' }}
        >
          {/* Left edge swipe detection area */}
          <div className="absolute left-0 top-0 w-8 h-full" />
        </div>
      )}

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
      <span className="font-medium">Taxomind</span>
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