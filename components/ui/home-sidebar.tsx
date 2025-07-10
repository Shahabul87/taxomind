"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from 'next/navigation';
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  IconDashboard,
  IconUser,
  IconSettings,
  IconBook,
  IconChartBar,
  IconUsers,
  IconCalendar,
  IconMessageCircle,
  IconBrain,
  IconLibrary,
  IconHelpCircle,
  IconMenu2,
  IconX,
  IconNews,
  IconBrandTabler,
} from "@tabler/icons-react";
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
  const pathname = usePathname();
  const router = useRouter();

  // Update mobile detection to consider larger screens
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

  const getDashboardMenuItems = () => {
    // Create dashboard submenu based on user role
    let dashboardSubmenu = [];
    
    // Add user dashboard for all logged in users
    if (user) {
      dashboardSubmenu.push({ label: "User Dashboard", href: "/dashboard/user" });
    }
    
    // Add admin dashboard if user has admin role
    if (user?.role === "ADMIN") {
      dashboardSubmenu.push({ label: "Admin Dashboard", href: "/dashboard/admin" });
    }
    
    return dashboardSubmenu;
  };

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      icon: <IconDashboard className="w-5 h-5" />,
      href: user?.role === "ADMIN" ? "/dashboard/admin" : (user ? "/dashboard/user" : "/"),
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
      title: "Posts",
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
      href: user?.role === "ADMIN" ? "/analytics/admin" : "/analytics/student",
    },
    {
      title: "Groups",
      icon: <IconUsers className="w-5 h-5" />,
      submenu: [
        { label: "My Groups", href: "/groups/my-groups" },
        { label: "All Groups", href: "/groups" },
        { label: "Create Group", href: "/groups/create" },
      ],
    },
  
    {
      title: "Support",
      icon: <IconHelpCircle className="w-5 h-5" />,
      href: "/support",
    },
    {
      title: "Message Center",
      icon: <IconMessageCircle className="w-5 h-5" />,
      href: "/messages",
    },
    {
      title: "Resource Center",
      icon: <IconLibrary className="w-5 h-5" />,
      href: "/resources",
    },
    {
      title: "AI Tutor",
      icon: <IconBrain className="w-5 h-5" />,
      href: "/ai-tutor",
    },
  ];

  const toggleSubmenu = (title: string) => {
    setActiveSubmenu(activeSubmenu === title ? null : title);
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
            <IconX className="w-6 h-6" />
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
          width: (open || (!isMobile && isHovered)) ? "280px" : "94px",
          x: isMobile && !open ? "-100%" : 0 
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "h-full border-r",
          "flex flex-col z-40 transition-all duration-300",
          "dark:bg-gray-900 dark:border-gray-700",
          "bg-white border-gray-200"
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
                  <IconX className="w-5 h-5 dark:text-gray-400 text-gray-600" />
                ) : (
                  <IconMenu2 className="w-5 h-5 dark:text-gray-400 text-gray-600" />
                )}
              </button>
            )}
          </div>
        </div>

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
        <IconBrandTabler className="h-5 w-5" />
      </div>
      <span className="font-medium">iSham</span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link href="/" className="block">
      <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
        <IconBrandTabler className="h-5 w-5 text-purple-400" />
      </div>
    </Link>
  );
}; 