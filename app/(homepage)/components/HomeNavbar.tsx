"use client";

import { cn } from "@/lib/utils";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserMenu } from "@/app/(homepage)/_components/user-menu";

interface NavItem {
  name: string;
  link: string;
}

interface HomeNavbarProps {
  className?: string;
}

export function HomeNavbar({ className }: HomeNavbarProps) {
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const user = useCurrentUser();

  const navItems: NavItem[] = [
    { name: "Home", link: "/" },
    { name: "Courses", link: "/courses" },
    { name: "Blog", link: "/blog" },
    { name: "About", link: "/about" },
  ];

  // Show navbar only after scrolling past 100px
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
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
          backdropFilter: isVisible ? "blur(12px)" : "none",
          boxShadow: isVisible
            ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
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
          isVisible && "bg-white/80 dark:bg-slate-800/80"
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
                  className="absolute inset-0 h-full w-full rounded-full bg-gray-100 dark:bg-slate-700/50"
                />
              )}
              <span className="relative z-20">{item.name}</span>
            </Link>
          ))}
        </motion.div>

        {/* Auth Section */}
        <div className="relative z-20 flex items-center gap-4">
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
          backdropFilter: isVisible ? "blur(12px)" : "none",
          boxShadow: isVisible
            ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05)"
            : "none",
        }}
        className={cn(
          "relative z-[60] mx-auto flex w-full max-w-xl flex-row items-center justify-between rounded-full px-4 py-3 lg:hidden",
          isVisible && "bg-white/80 dark:bg-slate-800/80"
        )}
        style={{
          margin: "10px 16px",
        }}
      >
        {/* Mobile Logo */}
        <Link
          href="/"
          className="relative z-20 flex items-center space-x-2 py-1"
        >
          <div className="relative h-7 w-7 overflow-hidden rounded-full bg-white dark:bg-slate-900 shadow-md ring-2 ring-purple-500/20">
            <Image
              src="/taxomind-logo.png"
              alt="Taxomind Logo"
              width={28}
              height={28}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <span className="font-bold text-base bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Taxomind
          </span>
        </Link>

        {/* Mobile Auth Section */}
        <div className="flex items-center gap-2">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link href="/auth/login">
              <Button
                variant="default"
                size="sm"
                className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
