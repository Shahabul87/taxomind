"use client";

import { motion } from "framer-motion";
import {
  Newspaper,
  TrendingUp,
  Zap,
  Globe,
  Sparkles,
  Radio
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserMenu } from "@/app/(homepage)/_components/user-menu";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getFallbackImageUrl } from "@/lib/cloudinary-utils";

interface QuickStat {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

interface AINewsHeroProps {
  stats: {
    totalArticles: number;
    breakingNews: number;
    highImpact: number;
    sources: number;
  };
}

export function AINewsHero({ stats }: AINewsHeroProps) {
  const user = useCurrentUser();

  const quickStats: QuickStat[] = [
    {
      label: "Today&apos;s Articles",
      value: stats.totalArticles.toString(),
      icon: Newspaper,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-500/10"
    },
    {
      label: "Breaking News",
      value: stats.breakingNews.toString(),
      icon: Zap,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-500/10"
    },
    {
      label: "High Impact",
      value: stats.highImpact.toString(),
      icon: TrendingUp,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-500/10"
    },
    {
      label: "News Sources",
      value: stats.sources.toString(),
      icon: Globe,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-500/10"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50 pt-4 pb-12 sm:pt-6 sm:pb-16 md:pb-20">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-100/60 dark:bg-violet-500/5 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-indigo-100/60 dark:bg-indigo-500/5 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-purple-100/40 dark:bg-purple-500/5 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(0 0 0) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(0 0 0) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Top Navigation Bar */}
      <div className="relative z-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
              aria-label="Go to Taxomind home page"
            >
              <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md transition-transform group-hover:scale-105">
                <Image
                  src="/taxomind-logo.png"
                  alt="Taxomind Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
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

            {/* Auth Section */}
            <div className="flex items-center gap-3">
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
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <motion.div
        className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 md:pt-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 dark:bg-white/10 border border-slate-800 dark:border-white/20 mb-6 sm:mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            <span className="text-sm font-medium text-white dark:text-slate-200">
              Live AI Intelligence Feed
            </span>
            <Radio className="w-4 h-4 text-violet-400 animate-pulse" />
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-4 sm:mb-6"
          >
            <span className="block">Stay Ahead with</span>
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
              AI News Intelligence
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed"
          >
            Curated AI insights from top sources worldwide. Real-time updates on breakthroughs,
            research, and industry developments that shape your learning journey.
          </motion.p>

          {/* Stats Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto"
          >
            {quickStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="group relative bg-white dark:bg-slate-800/50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300"
                  whileHover={{ y: -2 }}
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bgColor} mb-3`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                  </div>
                  <div className={`text-2xl sm:text-3xl font-bold ${stat.color} mb-1`}>
                    {stat.value === '0' ? '—' : stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {stat.label.replace("&apos;", "'")}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Feature Tags */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-8 sm:mt-10"
          >
            {[
              { label: "Real-time Updates", icon: Zap },
              { label: "AI-Curated", icon: Sparkles },
              { label: "Multi-Source", icon: Globe },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{feature.label}</span>
                </div>
              );
            })}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
