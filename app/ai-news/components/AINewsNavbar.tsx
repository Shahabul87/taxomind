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
import {
  Menu,
  Home,
  BookOpen,
  Newspaper,
  Rss,
  ChevronRight,
  LogOut,
  User,
  Settings,
  Palette
} from "lucide-react";
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

interface AINewsNavbarProps {
  className?: string;
}

export function AINewsNavbar({ className }: AINewsNavbarProps) {
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const user = useCurrentUser();

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
      name: "AI News",
      link: "/ai-news",
      icon: Newspaper,
      description: "Latest AI updates"
    },
    {
      name: "Blog",
      link: "/blog",
      icon: Rss,
      description: "Read articles"
    },
  ];

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 80) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  });

  const shouldShow = isMounted && isVisible;

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-50",
        className
      )}
      style={{
        opacity: shouldShow ? 1 : 0,
        transform: shouldShow ? 'translateY(0)' : 'translateY(-20px)',
        pointerEvents: shouldShow ? "auto" : "none",
        transition: isMounted ? 'opacity 0.3s ease, transform 0.3s ease' : 'none',
      }}
    >
      {/* Desktop Navigation */}
      <motion.div
        initial={false}
        animate={{
          backdropFilter: shouldShow ? "blur(12px)" : "none",
          boxShadow: shouldShow
            ? "0 4px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)"
            : "none",
          width: shouldShow ? "65%" : "100%",
          y: shouldShow ? 12 : 0,
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
          "relative mx-auto hidden w-full max-w-5xl flex-row items-center justify-between self-start rounded-2xl px-5 py-2.5 lg:flex",
          shouldShow && "bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-700/50"
        )}
      >
        {/* Logo */}
        <Link
          href="/"
          className="relative z-20 flex items-center space-x-2.5 py-1"
        >
          <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md flex items-center justify-center">
            <Image
              src="/taxomind-logo.png"
              alt="Taxomind Logo"
              width={36}
              height={36}
              className="h-full w-full object-cover"
              priority
              onError={(e) => {
                e.currentTarget.src = getFallbackImageUrl('default');
              }}
            />
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white">
            Taxomind
          </span>
        </Link>

        {/* Navigation Items */}
        <motion.div
          onMouseLeave={() => setHovered(null)}
          className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-1 text-sm font-medium lg:flex"
        >
          {navItems.map((item, idx) => (
            <Link
              key={`nav-${idx}`}
              href={item.link}
              onMouseEnter={() => setHovered(idx)}
              className={cn(
                "relative px-4 py-2 rounded-lg transition-colors",
                item.link === "/ai-news"
                  ? "text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {hovered === idx && (
                <motion.div
                  layoutId="navhovered"
                  className="absolute inset-0 h-full w-full rounded-lg bg-slate-100 dark:bg-slate-800"
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
                className="rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm font-medium px-4"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Mobile Navigation */}
      <motion.div
        initial={false}
        animate={{
          backdropFilter: shouldShow ? "blur(12px)" : "none",
          boxShadow: shouldShow
            ? "0 4px 20px rgba(0, 0, 0, 0.08)"
            : "none",
          width: shouldShow ? "90%" : "100%",
          y: shouldShow ? 8 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 50,
        }}
        className={cn(
          "relative z-[60] mx-auto flex flex-row items-center justify-between rounded-xl px-4 py-3 lg:hidden",
          shouldShow && "bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-700/50"
        )}
      >
        {/* Mobile Logo */}
        <Link
          href="/"
          className="relative z-20 flex items-center space-x-2 py-1"
        >
          <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm flex items-center justify-center">
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
          <span className="font-bold text-base text-slate-900 dark:text-white">
            Taxomind
          </span>
        </Link>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2">
          {isMounted && (
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[320px] p-0 border-l border-slate-200 dark:border-slate-800"
              >
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 pb-8">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <SheetHeader className="space-y-2">
                      <SheetTitle className="text-white text-xl font-bold text-left">
                        AI News
                      </SheetTitle>
                      <SheetDescription className="text-slate-400 text-sm text-left">
                        Stay updated with AI
                      </SheetDescription>
                    </SheetHeader>

                    {user && (
                      <div className="mt-6 flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                        <Avatar className="h-12 w-12 ring-2 ring-white/20">
                          <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-400 text-white font-semibold">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">
                            {user.name || 'User'}
                          </p>
                          <p className="text-slate-400 text-xs truncate">
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
                    const isActive = item.link === "/ai-news";
                    return (
                      <Link
                        key={`mobile-nav-${idx}`}
                        href={item.link}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "group flex items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-200",
                          isActive
                            ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-lg",
                            isActive
                              ? "bg-blue-100 dark:bg-blue-500/20"
                              : "bg-slate-100 dark:bg-slate-800"
                          )}>
                            <Icon className={cn(
                              "h-5 w-5",
                              isActive
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-600 dark:text-slate-400"
                            )} />
                          </div>
                          <div>
                            <p className={cn(
                              "font-semibold text-sm",
                              isActive
                                ? "text-blue-700 dark:text-blue-400"
                                : "text-slate-700 dark:text-slate-300"
                            )}>
                              {item.name}
                            </p>
                            {item.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
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

                  <div className="group flex items-center justify-between rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Palette className="h-5 w-5 text-slate-600 dark:text-slate-400" />
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
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Link>
                  ) : (
                    <Link
                      href="/auth/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
                    >
                      <User className="h-4 w-4" />
                      Sign In
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </motion.div>
    </div>
  );
}
