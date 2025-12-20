"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  Trophy,
  Target,
  ChevronRight,
  Sparkles,
  Brain
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import Image from "next/image";
import { ensureHttpsUrl, getFallbackImageUrl } from "@/lib/cloudinary-utils";

interface UserMenuProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

export const UserMenu = ({ user }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dashboardLink = user?.role === "ADMIN" ? "/dashboard/admin" : "/dashboard";

  // Hydration fix
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const getInitial = (name?: string | null) => {
    return name?.charAt(0).toUpperCase() || "U";
  };

  // Learning-focused menu items
  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: dashboardLink,
      description: "Your learning hub",
      iconColor: "text-blue-600 dark:text-blue-400",
      bgLight: "bg-blue-50",
      bgDark: "dark:bg-blue-950/40",
    },
    {
      icon: BookOpen,
      label: "My Courses",
      href: "/my-courses",
      description: "Continue learning",
      iconColor: "text-purple-600 dark:text-purple-400",
      bgLight: "bg-purple-50",
      bgDark: "dark:bg-purple-950/40",
    },
    {
      icon: Target,
      label: "Progress",
      href: "/analytics",
      description: "Track your growth",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgLight: "bg-emerald-50",
      bgDark: "dark:bg-emerald-950/40",
    },
    {
      icon: Trophy,
      label: "Achievements",
      href: "/achievements",
      description: "Badges & certificates",
      iconColor: "text-amber-600 dark:text-amber-400",
      bgLight: "bg-amber-50",
      bgDark: "dark:bg-amber-950/40",
    },
  ];

  if (!isMounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-full"
        aria-label="Open user menu"
        aria-expanded={isOpen}
      >
        <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-blue-400/50 transition-all duration-300 shadow-md group-hover:shadow-lg">
          {user?.image ? (
            <Image
              src={ensureHttpsUrl(user.image) || getFallbackImageUrl("user")}
              alt={user.name || "User"}
              fill
              sizes="36px"
              className="object-cover"
              onError={(e) => {
                e.currentTarget.src = getFallbackImageUrl("user");
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
              {getInitial(user?.name)}
            </div>
          )}
        </div>
        {/* Online indicator */}
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-72 z-[9999]"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
              {/* Header - User Info */}
              <div className="relative px-4 py-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full blur-xl" />
                </div>

                <div className="relative flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-white/30 shadow-lg flex-shrink-0">
                    {user?.image ? (
                      <Image
                        src={ensureHttpsUrl(user.image) || getFallbackImageUrl("user")}
                        alt={user.name || "User"}
                        width={48}
                        height={48}
                        className="object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getFallbackImageUrl("user");
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-lg">
                        {getInitial(user?.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {user?.name || "Learner"}
                    </p>
                    <p className="text-white/70 text-xs truncate">
                      {user?.email}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <GraduationCap className="w-3 h-3 text-white/80" />
                      <span className="text-[10px] text-white/80 font-medium">
                        {user?.role === "ADMIN" ? "Instructor" : "Learner"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mini Progress Bar */}
                <div className="relative mt-3 pt-3 border-t border-white/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-white/90" />
                      <span className="text-[11px] text-white/90 font-medium">Cognitive Level</span>
                    </div>
                    <span className="text-[11px] text-white font-bold">4/6</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "67%" }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 text-center px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">3</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Courses</p>
                  </div>
                  <div className="flex-1 text-center px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">12</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Hours</p>
                  </div>
                  <div className="flex-1 text-center px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">85%</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Progress</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                  >
                    <motion.div
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    >
                      <div className={`w-9 h-9 rounded-lg ${item.bgLight} ${item.bgDark} flex items-center justify-center transition-all group-hover:scale-105`}>
                        <item.icon className={`w-[18px] h-[18px] ${item.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                          {item.label}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                    </motion.div>
                  </Link>
                ))}
              </div>

              {/* Continue Learning CTA */}
              <div className="px-3 pb-2">
                <Link href="/courses" onClick={() => setIsOpen(false)}>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Explore New Courses</span>
                  </motion.div>
                </Link>
              </div>

              {/* Logout */}
              <div className="px-2 py-2 border-t border-slate-100 dark:border-slate-800">
                <LogoutButton className="w-full">
                  <motion.div
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                      <LogOut className="w-4 h-4 text-red-500 dark:text-red-400" />
                    </div>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300">
                      Sign Out
                    </span>
                  </motion.div>
                </LogoutButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
