"use client";

import { cn } from "@/lib/utils";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserMenu } from "@/app/(homepage)/_components/user-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getFallbackImageUrl } from "@/lib/cloudinary-utils";
import { Menu, X, Home, BookOpen, FileText, Info, LogOut, User, Settings, ChevronRight, Palette } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  name: string;
  link: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface HomeNavbarProps {
  className?: string;
}

export function HomeNavbar({ className }: HomeNavbarProps) {
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const user = useCurrentUser();

  // Ensure consistent rendering between server and client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems: NavItem[] = [
    {
      name: "Home",
      link: "/",
      icon: Home,
      description: "Back to homepage"
    },
    {
      name: "Courses",
      link: "/courses",
      icon: BookOpen,
      description: "Browse all courses"
    },
    {
      name: "Blog",
      link: "/blog",
      icon: FileText,
      description: "Read latest articles"
    },
    {
      name: "About",
      link: "/about",
      icon: Info,
      description: "Learn about us"
    },
  ];

  // Show navbar only after scrolling past 100px
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  });

  // Don't render animations until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-50 pointer-events-none",
          className
        )}
        style={{ opacity: 0, pointerEvents: "none" }}
      >
        {/* Placeholder for SSR - matches structure but without animations */}
        <div className="relative mx-auto hidden w-full max-w-7xl flex-row items-center justify-between self-start rounded-full px-4 py-2 lg:flex" />
        <div className="relative z-[60] mx-auto flex flex-row items-center justify-between rounded-full px-3 py-2.5 sm:px-4 sm:py-3 lg:hidden" />
      </div>
    );
  }

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : -20,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 30,
      }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 pointer-events-none",
        className
      )}
      style={{
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      <motion.div
        animate={{
          backdropFilter: isVisible ? "blur(8px)" : "none",
          boxShadow: isVisible
            ? "0 4px 24px rgba(59, 130, 246, 0.1), 0 2px 8px rgba(59, 130, 246, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05)"
            : "none",
          width: isVisible ? "60%" : "100%",
          y: isVisible ? 10 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 50,
        }}
        style={{
          minWidth: "320px",
        }}
        className={cn(
          "relative mx-auto hidden w-full max-w-7xl flex-row items-center justify-between self-start rounded-full px-4 py-2 lg:flex",
          isVisible && "bg-blue-50 dark:bg-slate-800/95 border border-blue-100 dark:border-slate-700/50"
        )}
      >
        {/* Logo */}
        <Link
          href="/"
          className="relative z-20 flex items-center space-x-2 py-1"
        >
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-white dark:bg-slate-900 shadow-md ring-2 ring-purple-500/20">
            <Image
              src="/taxomind-logo.png"
              alt="Taxomind Logo"
              width={32}
              height={32}
              className="h-full w-full object-cover"
              priority
              onError={(e) => {
                e.currentTarget.src = getFallbackImageUrl('default');
              }}
            />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Taxomind
          </span>
        </Link>

        {/* Navigation Items */}
        <motion.div
          onMouseLeave={() => setHovered(null)}
          className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2"
        >
          {navItems.map((item, idx) => (
            <Link
              key={`nav-${idx}`}
              href={item.link}
              onMouseEnter={() => setHovered(idx)}
              className="relative px-4 py-2 text-neutral-600 dark:text-neutral-300"
            >
              {hovered === idx && (
                <motion.div
                  layoutId="hovered"
                  className="absolute inset-0 h-full w-full rounded-full bg-blue-100 dark:bg-slate-700/70"
                />
              )}
              <span className="relative z-20">{item.name}</span>
            </Link>
          ))}
        </motion.div>

        {/* Auth Section */}
        <div className="relative z-20 flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link href="/auth/login">
              <Button
                variant="default"
                size="sm"
                className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Mobile Navigation - Shows on scroll */}
      <motion.div
        animate={{
          backdropFilter: isVisible ? "blur(8px)" : "none",
          boxShadow: isVisible
            ? "0 4px 20px rgba(59, 130, 246, 0.1), 0 2px 6px rgba(59, 130, 246, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05)"
            : "none",
          width: isVisible ? "85%" : "100%",
          y: isVisible ? 8 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 50,
        }}
        style={{
          minWidth: "280px",
        }}
        className={cn(
          "relative z-[60] mx-auto flex flex-row items-center justify-between rounded-full px-3 py-2.5 sm:px-4 sm:py-3 lg:hidden",
          isVisible && "bg-blue-50 dark:bg-slate-800/95 border border-blue-100 dark:border-slate-700/50"
        )}
      >
        {/* Mobile Logo */}
        <Link
          href="/"
          className="relative z-20 flex items-center space-x-1.5 sm:space-x-2 py-1 flex-shrink-0"
        >
          <div className="relative h-6 w-6 sm:h-7 sm:w-7 overflow-hidden rounded-full bg-white dark:bg-slate-900 shadow-md ring-2 ring-purple-500/20">
            <Image
              src="/taxomind-logo.png"
              alt="Taxomind Logo"
              width={28}
              height={28}
              className="h-full w-full object-cover"
              priority
              onError={(e) => {
                e.currentTarget.src = getFallbackImageUrl('default');
              }}
            />
          </div>
          <span className="font-bold text-sm sm:text-base bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent whitespace-nowrap">
            Taxomind
          </span>
        </Link>

        {/* Mobile Auth Section */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Mobile Menu Button - Only show on smaller devices */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden rounded-full p-1.5 sm:p-2 hover:bg-blue-100 dark:hover:bg-slate-700"
                aria-label="Open navigation menu"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700 dark:text-slate-300" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[320px] sm:w-[380px] p-0 border-l border-slate-200 dark:border-slate-800"
            >
              {/* Enterprise Header with Gradient */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 dark:from-blue-600 dark:via-indigo-600 dark:to-purple-700 p-6 pb-8">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

                <div className="relative z-10">
                  <SheetHeader className="space-y-2">
                    <SheetTitle className="text-white text-xl font-bold text-left">
                      Menu
                    </SheetTitle>
                    <SheetDescription className="text-blue-50 text-sm text-left">
                      Navigate through Taxomind
                    </SheetDescription>
                  </SheetHeader>

                  {/* User Profile Section */}
                  {user && (
                    <div className="mt-6 flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <Avatar className="h-12 w-12 ring-2 ring-white/30">
                        <AvatarImage
                          src={user.image || ''}
                          alt={user.name || 'User'}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white font-semibold">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">
                          {user.name || 'User'}
                        </p>
                        <p className="text-blue-100 text-xs truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="p-4 space-y-1">
                <p className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Navigation
                </p>
                {navItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={`mobile-nav-${idx}`}
                      href={item.link}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="group flex items-center justify-between rounded-xl px-4 py-3.5 text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-800/50 transition-all duration-200 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 group-hover:from-blue-500/20 group-hover:to-indigo-500/20 dark:group-hover:from-blue-500/30 dark:group-hover:to-indigo-500/30 transition-all">
                          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  );
                })}
              </nav>

              <Separator className="my-4" />

              {/* Quick Actions */}
              <div className="px-4 pb-4 space-y-1">
                <p className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Quick Actions
                </p>

                {/* Dashboard Link (only for authenticated users) */}
                {user && (
                  <Link
                    href={user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/user'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group flex items-center gap-3 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="font-medium text-sm">Dashboard</span>
                  </Link>
                )}

                {/* Theme Toggle for Mobile */}
                <div className="group flex items-center justify-between rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20">
                      <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-medium text-sm">Appearance</span>
                  </div>
                  <ThemeToggle />
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
                {user ? (
                  <Link
                    href="/auth/logout"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
                  >
                    <User className="h-4 w-4" />
                    Sign In
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Theme Toggle and User Menu - Only show on md devices and above */}
          <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            {user ? (
              <UserMenu user={user} />
            ) : (
              <Link href="/auth/login">
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-3 py-1.5"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
