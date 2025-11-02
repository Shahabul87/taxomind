"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  FileText,
  Award,
  Calendar,
  MessageSquare,
  Heart,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Home,
  Video,
  Newspaper,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User as NextAuthUser } from "next-auth";

interface SmartSidebarProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  roles?: string[];
  submenu?: { label: string; href: string }[];
}

export function SmartSidebar({ user }: SmartSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const pathname = usePathname();

  // Comprehensive navigation items based on existing sidebar
  const navigationItems: NavItem[] = [
    {
      label: "Dashboard",
      href: user.role === "ADMIN" ? "/dashboard/admin" : "/dashboard",
      icon: LayoutDashboard,
      roles: ["all"],
    },
    {
      label: "Profile Manager",
      href: "/profile",
      icon: User,
      roles: ["all"],
    },
    {
      label: "Courses",
      icon: BookOpen,
      roles: ["all"],
      submenu: [
        { label: "My Courses", href: "/my-courses" },
        { label: "All Courses", href: "/teacher/courses" },
        { label: "Create Course", href: "/teacher/create" },
      ],
    },
    {
      label: "Posts & Blog",
      icon: Newspaper,
      roles: ["all"],
      submenu: [
        { label: "My Posts", href: "/teacher/posts/all-posts" },
        { label: "Browse Posts", href: "/blog" },
        { label: "Create Post", href: "/teacher/posts/create-post" },
      ],
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      roles: ["all"],
    },
    {
      label: "Study Groups",
      icon: Users,
      roles: ["all"],
      submenu: [
        { label: "My Groups", href: "/groups/my-groups" },
        { label: "Browse Groups", href: "/groups" },
        { label: "Create Group", href: "/groups/create" },
      ],
    },
    {
      label: "Calendar",
      href: "/calendar",
      icon: Calendar,
      roles: ["all"],
    },
    {
      label: "AI Tutor",
      href: "/ai-tutor",
      icon: BookOpen,
      roles: ["all"],
    },
    {
      label: "Messages",
      href: "/messages",
      icon: MessageSquare,
      badge: "3",
      roles: ["all"],
    },
    {
      label: "Certificates",
      href: "/certificates",
      icon: Award,
      roles: ["all"],
    },
    {
      label: "Favorites",
      href: "/favorites",
      icon: Heart,
      roles: ["all"],
    },
  ];

  const bottomNavigationItems: NavItem[] = [
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["all"],
    },
    {
      label: "Help & Support",
      href: "/support",
      icon: HelpCircle,
      roles: ["all"],
    },
  ];

  // Filter navigation items based on user role
  const filterByRole = (items: NavItem[]) => {
    return items.filter((item) => {
      if (item.roles?.includes("all")) return true;
      if (item.roles?.includes("teacher") && user.isTeacher) return true;
      if (item.roles?.includes("affiliate") && user.isAffiliate) return true;
      return false;
    });
  };

  const filteredNavItems = filterByRole(navigationItems);
  const filteredBottomItems = filterByRole(bottomNavigationItems);

  const isActiveLink = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <motion.aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      initial={false}
      animate={{
        width: isExpanded ? 256 : 72,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50 z-40 overflow-hidden"
    >
      <div className="flex flex-col h-full">
        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          <div className="space-y-1 px-3">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href ? isActiveLink(item.href) : false;

              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isSubmenuActive = activeSubmenu === item.label;

              return (
                <div key={item.label}>
                  {/* Main Item */}
                  {item.href ? (
                    <Link href={item.href}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer relative group",
                          isActive
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        )}
                      >
                        <div className="flex-shrink-0">
                          <Icon
                            className={cn(
                              "h-5 w-5",
                              isActive
                                ? "text-white"
                                : "text-slate-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                            )}
                          />
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center justify-between flex-1 overflow-hidden"
                            >
                              <span className="text-sm font-medium whitespace-nowrap">
                                {item.label}
                              </span>
                              {item.badge && (
                                <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                                  {item.badge}
                                </span>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"
                          />
                        )}

                        {!isExpanded && (
                          <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                            {item.label}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
                          </div>
                        )}
                      </motion.div>
                    </Link>
                  ) : (
                    <motion.div
                      whileHover={{ x: 4 }}
                      onClick={() => setActiveSubmenu(isSubmenuActive ? null : item.label)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer relative group",
                        isSubmenuActive
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      )}
                    >
                      <div className="flex-shrink-0">
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            isSubmenuActive
                              ? "text-white"
                              : "text-slate-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                          )}
                        />
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-between flex-1 overflow-hidden"
                          >
                            <span className="text-sm font-medium whitespace-nowrap">
                              {item.label}
                            </span>
                            {hasSubmenu && (
                              <motion.div
                                animate={{ rotate: isSubmenuActive ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!isExpanded && (
                        <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                          {item.label}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Submenu */}
                  {hasSubmenu && isExpanded && (
                    <AnimatePresence>
                      {isSubmenuActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden mt-1"
                        >
                          {item.submenu?.map((subItem, subIndex) => {
                            const isSubActive = pathname === subItem.href;
                            return (
                              <Link key={subIndex} href={subItem.href}>
                                <motion.div
                                  whileHover={{ x: 4 }}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-2 ml-8 mr-2 rounded-lg text-sm transition-colors cursor-pointer",
                                    isSubActive
                                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                  )}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                  <span>{subItem.label}</span>
                                </motion.div>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-3 space-y-1">
          {filteredBottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href ? isActiveLink(item.href) : false;

            if (!item.href) return null;

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer relative group",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  )}
                >
                  <div className="flex-shrink-0">
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isActive
                          ? "text-white"
                          : "text-slate-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                      )}
                    />
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {!isExpanded && (
                    <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                      {item.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Expand/Collapse Indicator */}
        <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-3">
          <div className="flex items-center justify-center">
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-slate-400 dark:text-slate-600"
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
