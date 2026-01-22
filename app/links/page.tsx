"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  Users,
  Mail,
  ExternalLink,
  Twitter,
  Youtube,
  Instagram,
  Linkedin,
  Github,
  MessageCircle,
  ArrowRight,
  Play,
  Brain,
  CheckCircle2,
  Zap,
  TrendingUp,
  Award,
  Loader2,
} from "lucide-react";

// ============================================
// Configuration - Easy to update
// ============================================

const PROFILE = {
  name: "TaxoMind",
  tagline: "AI-Powered Learning Platform",
  description: "Master any skill with Bloom's Taxonomy. Track your cognitive growth across 6 levels.",
  avatar: "/taxomind-logo.png",
  verified: true,
};

const MAIN_LINKS = [
  {
    id: "start",
    title: "Start Learning Free",
    description: "Create your account and begin your journey",
    href: "/auth/register",
    icon: Sparkles,
    gradient: "from-purple-500 to-indigo-600",
    featured: true,
  },
  {
    id: "courses",
    title: "Explore Courses",
    description: "Browse our AI-powered course catalog",
    href: "/courses",
    icon: BookOpen,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "demo",
    title: "Watch Demo",
    description: "See TaxoMind in action",
    href: "https://youtube.com/@taxomind",
    icon: Play,
    gradient: "from-red-500 to-rose-500",
    external: true,
  },
  {
    id: "blog",
    title: "Read Our Blog",
    description: "Tips, tutorials, and learning insights",
    href: "/blog",
    icon: Brain,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "enterprise",
    title: "Enterprise Solutions",
    description: "Custom learning for your organization",
    href: "/enterprise",
    icon: Users,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "contact",
    title: "Contact Us",
    description: "Get in touch with our team",
    href: "/contact",
    icon: Mail,
    gradient: "from-slate-500 to-slate-600",
  },
];

const SOCIAL_LINKS = [
  { name: "Twitter", href: "https://twitter.com/TaxoMind", icon: Twitter, hoverBg: "hover:bg-[#1DA1F2]" },
  { name: "YouTube", href: "https://youtube.com/@taxomind", icon: Youtube, hoverBg: "hover:bg-[#FF0000]" },
  { name: "Instagram", href: "https://instagram.com/taxomind.app", icon: Instagram, hoverBg: "hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737]" },
  { name: "TikTok", href: "https://www.tiktok.com/@taxomind", icon: null, hoverBg: "hover:bg-black dark:hover:bg-white dark:hover:text-black" },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/taxomind", icon: Linkedin, hoverBg: "hover:bg-[#0A66C2]" },
  { name: "GitHub", href: "https://github.com/TaxoMind", icon: Github, hoverBg: "hover:bg-[#333] dark:hover:bg-white dark:hover:text-black" },
  { name: "Discord", href: "https://discord.gg/X8bRJmkE", icon: MessageCircle, hoverBg: "hover:bg-[#5865F2]" },
];

// Stats configuration - icons only, values fetched from API
const STAT_CONFIG = [
  { key: "activeLearners", label: "Active Learners", icon: Users },
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "successRate", label: "Success Rate", icon: TrendingUp },
] as const;

// Platform stats API response type
interface PlatformStats {
  activeLearnerDisplay: string;
  totalCourses: number;
  successRate: number;
}

// ============================================
// TikTok Icon Component
// ============================================

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

// ============================================
// Link Card Component
// ============================================

interface LinkCardProps {
  link: typeof MAIN_LINKS[0];
  index: number;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = link.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
    >
      <Link
        href={link.href}
        target={link.external ? "_blank" : undefined}
        rel={link.external ? "noopener noreferrer" : undefined}
        className="block group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
            link.featured
              ? "bg-gradient-to-r " + link.gradient + " p-[2px] shadow-lg shadow-purple-500/20 dark:shadow-purple-500/10"
              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow-md"
          }`}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className={`relative flex items-center gap-4 p-4 sm:p-5 ${
            link.featured
              ? "bg-white dark:bg-slate-900 rounded-[14px]"
              : ""
          }`}>
            {/* Icon */}
            <div className={`relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
                  {link.title}
                </h3>
                {link.featured && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                    Popular
                  </span>
                )}
                {link.external && (
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {link.description}
              </p>
            </div>

            {/* Arrow */}
            <motion.div
              className="flex-shrink-0"
              animate={{ x: isHovered ? 4 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
            </motion.div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

// ============================================
// Social Button Component
// ============================================

interface SocialButtonProps {
  social: typeof SOCIAL_LINKS[0];
  index: number;
}

const SocialButton: React.FC<SocialButtonProps> = ({ social, index }) => {
  const Icon = social.icon;

  return (
    <motion.a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all duration-300 hover:text-white hover:border-transparent ${social.hoverBg}`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 + index * 0.05, type: "spring", stiffness: 300 }}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Follow us on ${social.name}`}
    >
      {Icon ? (
        <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors" />
      ) : (
        <TikTokIcon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-current transition-colors" />
      )}
    </motion.a>
  );
};

// ============================================
// Stats Card Component with Real Data
// ============================================

interface StatsCardProps {
  stats: PlatformStats | null;
  isLoading: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ stats, isLoading }) => {
  const getStatValue = (key: string): string => {
    if (!stats) return "—";
    switch (key) {
      case "activeLearners":
        return stats.activeLearnerDisplay;
      case "courses":
        return `${stats.totalCourses}+`;
      case "successRate":
        return `${stats.successRate}%`;
      default:
        return "—";
    }
  };

  return (
    <motion.div
      className="mb-8 p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <div className="flex items-center justify-around">
        {STAT_CONFIG.map((stat) => (
          <div key={stat.key} className="text-center px-2">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <stat.icon className="w-4 h-4 text-purple-500" />
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {getStatValue(stat.key)}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ============================================
// Main Page Component
// ============================================

export default function LinksPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const hasFetchedRef = useRef(false);

  // Fetch platform stats from API
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/platform/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      if (data.success && data.data) {
        setStats({
          activeLearnerDisplay: data.data.activeLearnerDisplay,
          totalCourses: data.data.totalCourses,
          successRate: data.data.successRate,
        });
      }
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      // Keep stats as null to show fallback
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchStats();
    }
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors">
      {/* Subtle background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Light mode decorations */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-200/40 dark:bg-cyan-900/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 container mx-auto px-4 py-10 sm:py-16 max-w-lg">
        {/* Profile Section */}
        <motion.div
          className="text-center mb-8 sm:mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Avatar */}
          <div className="relative inline-block mb-5">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 blur-xl opacity-40 dark:opacity-30 scale-110" />

            {/* Avatar ring */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[3px] bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
              <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-900 p-1">
                <Image
                  src={PROFILE.avatar}
                  alt={PROFILE.name}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover rounded-full"
                  priority
                />
              </div>
            </div>

            {/* Verified badge */}
            {PROFILE.verified && (
              <motion.div
                className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </motion.div>
            )}
          </div>

          {/* Name & Tagline */}
          <motion.h1
            className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {PROFILE.name}
          </motion.h1>
          <motion.p
            className="text-base sm:text-lg font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {PROFILE.tagline}
          </motion.p>
          <motion.p
            className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {PROFILE.description}
          </motion.p>
        </motion.div>

        {/* Stats Card - Real Data from API */}
        <StatsCard stats={stats} isLoading={isLoadingStats} />

        {/* Main Links */}
        <div className="space-y-3 mb-10">
          {MAIN_LINKS.map((link, index) => (
            <LinkCard key={link.id} link={link} index={index} />
          ))}
        </div>

        {/* Social Links Section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium mb-4">
            Connect With Us
          </p>
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {SOCIAL_LINKS.map((social, index) => (
              <SocialButton key={social.name} social={social} index={index} />
            ))}
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          className="mt-10 flex items-center justify-center gap-4 sm:gap-6 text-slate-400 dark:text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-1.5 text-xs">
            <Award className="w-4 h-4" />
            <span>Research-Backed</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center gap-1.5 text-xs">
            <Zap className="w-4 h-4" />
            <span>AI-Powered</span>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          className="mt-8 sm:mt-10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all"
          >
            <Image
              src="/taxomind-logo.png"
              alt="TaxoMind"
              width={20}
              height={20}
              className="rounded"
            />
            <span>taxomind.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            © {new Date().getFullYear()} TaxoMind. All rights reserved.
          </p>
        </motion.footer>
      </main>
    </div>
  );
}
