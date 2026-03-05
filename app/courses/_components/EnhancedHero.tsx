"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/theme-provider";
import {
  Search,
  ArrowRight,
  Brain,
  Target,
  Layers,
  GraduationCap,
  Sparkles,
  Compass,
  Zap,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ================================================================
   TYPES
   ================================================================ */

interface EnhancedHeroProps {
  statistics: {
    totalCourses: number;
    totalEnrollments: number;
    averageRating: number;
  };
  userId?: string;
}

/* ================================================================
   CONSTANTS
   ================================================================ */

const ROTATING_WORDS = ["Precisely", "Deeply", "Brilliantly", "Masterfully"];
const QUICK_SEARCHES = ["Python", "Web Development", "Data Science", "Machine Learning"];

const FEATURES = [
  { icon: Brain, label: "AI Tutor", desc: "Personal mentor" },
  { icon: Target, label: "Goal Tracking", desc: "Stay on course" },
  { icon: Layers, label: "Adaptive Path", desc: "Learn your way" },
  { icon: GraduationCap, label: "Certificates", desc: "Earn credentials" },
  { icon: Sparkles, label: "Smart Review", desc: "Spaced repetition" },
  { icon: Compass, label: "Discovery", desc: "Explore topics" },
];

/* ================================================================
   COLOR SYSTEM
   Light: Warm ivory + Deep prussian blue + Warm amber
   Dark:  Deep midnight + Luminous blue + Rich gold
   ================================================================ */

function useColors(isDark: boolean) {
  return isDark
    ? {
        bg: "linear-gradient(180deg, #08080f 0%, #0c1018 40%, #080c14 100%)",
        surface: "rgba(255,255,255,0.035)",
        surfaceHover: "rgba(255,255,255,0.06)",
        textPrimary: "#edeae2",
        textSecondary: "rgba(255,255,255,0.5)",
        textMuted: "rgba(255,255,255,0.22)",
        primary: "#5b9cf5",
        primarySoft: "rgba(91,156,245,0.08)",
        primaryGlow: "rgba(91,156,245,0.1)",
        accent: "#dba33c",
        accentGlow: "rgba(219,163,60,0.06)",
        rose: "#e88da0",
        border: "rgba(255,255,255,0.055)",
        borderAccent: "rgba(91,156,245,0.14)",
        orbit: "rgba(91,156,245,0.055)",
        orbitStrong: "rgba(91,156,245,0.09)",
        searchBg: "rgba(255,255,255,0.035)",
        searchBorder: "rgba(255,255,255,0.07)",
        searchFocusGlow: "rgba(91,156,245,0.08)",
        searchShadow: "0 8px 40px rgba(0,0,0,0.4)",
        btnShadow: "0 4px 24px rgba(91,156,245,0.2)",
        edgeLine: "rgba(91,156,245,0.1)",
      }
    : {
        bg: "linear-gradient(180deg, #faf9f5 0%, #f4f1ea 40%, #f8f6f1 100%)",
        surface: "rgba(255,255,255,0.75)",
        surfaceHover: "rgba(255,255,255,0.9)",
        textPrimary: "#17150f",
        textSecondary: "#706a60",
        textMuted: "#a8a090",
        primary: "#1c3d72",
        primarySoft: "rgba(28,61,114,0.06)",
        primaryGlow: "rgba(28,61,114,0.05)",
        accent: "#a85d14",
        accentGlow: "rgba(168,93,20,0.04)",
        rose: "#9e3c5c",
        border: "rgba(23,21,15,0.065)",
        borderAccent: "rgba(28,61,114,0.1)",
        orbit: "rgba(28,61,114,0.04)",
        orbitStrong: "rgba(28,61,114,0.065)",
        searchBg: "rgba(255,255,255,0.82)",
        searchBorder: "rgba(23,21,15,0.09)",
        searchFocusGlow: "rgba(28,61,114,0.06)",
        searchShadow: "0 8px 40px rgba(23,21,15,0.05)",
        btnShadow: "0 4px 24px rgba(28,61,114,0.16)",
        edgeLine: "rgba(28,61,114,0.06)",
      };
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export function EnhancedHero({ statistics, userId }: EnhancedHeroProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [heroSearch, setHeroSearch] = useState("");
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useTheme();
  const c = useColors(isDark);

  /* Rotate word every 3s */
  useEffect(() => {
    const id = setInterval(
      () => setWordIndex((p) => (p + 1) % ROTATING_WORDS.length),
      3000,
    );
    return () => clearInterval(id);
  }, []);

  /* Cmd+K search shortcut */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleHeroSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!heroSearch.trim()) return;
      document
        .querySelector("[data-results-section]")
        ?.scrollIntoView({ behavior: "smooth" });
      const params = new URLSearchParams(window.location.search);
      params.set("q", heroSearch.trim());
      router.push(`/courses?${params.toString()}`);
    },
    [heroSearch, router],
  );

  /* Animation variants */
  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 26 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="relative overflow-hidden" style={{ background: c.bg }}>
      {/* -------- Background layers -------- */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Luminous gradient orbs */}
        <motion.div
          className="absolute w-[650px] h-[650px] rounded-full blur-[150px]"
          style={{
            background: `radial-gradient(circle, ${c.primaryGlow}, transparent 60%)`,
            top: "-18%",
            right: "-6%",
          }}
          animate={{ x: [0, 20, 0], y: [0, -12, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[450px] h-[450px] rounded-full blur-[110px]"
          style={{
            background: `radial-gradient(circle, ${c.accentGlow}, transparent 60%)`,
            bottom: "-12%",
            left: "-4%",
          }}
          animate={{ x: [0, -14, 0], y: [0, 10, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Subtle horizontal rules — like scientific graph paper */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 119px,
              ${c.border} 119px,
              ${c.border} 120px
            )`,
          }}
        />
      </div>

      {/* -------- Concentric orbital rings -------- */}
      <div
        className="absolute inset-0 hidden md:flex items-center justify-center pointer-events-none"
        aria-hidden
      >
        {/* Inner ring — gentle pulse */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 300,
            height: 300,
            border: `1px solid ${c.orbit}`,
          }}
          animate={{ scale: [1, 1.035, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Middle ring — slow rotation, dashed */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 480,
            height: 480,
            border: `1px dashed ${c.orbitStrong}`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 140, repeat: Infinity, ease: "linear" }}
        />

        {/* Outer ring — opposite-phase pulse */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 660,
            height: 660,
            border: `1px solid ${c.orbit}`,
          }}
          animate={{ scale: [1.02, 0.99, 1.02] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* -------- Main content (centered) -------- */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center pt-20 sm:pt-28 lg:pt-36 pb-6 sm:pb-8"
        >
          {/* Eyebrow */}
          <motion.div variants={fadeUp}>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2"
              style={{
                background: c.primarySoft,
                border: `1px solid ${c.borderAccent}`,
              }}
            >
              <Zap className="h-3 w-3" style={{ color: c.primary }} />
              <span
                className="text-[11px] font-semibold tracking-[0.12em] uppercase"
                style={{
                  fontFamily: "var(--font-ui, 'Inter'), system-ui, sans-serif",
                  color: c.primary,
                }}
              >
                AI-Powered Learning
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div variants={fadeUp} className="mt-8 sm:mt-10">
            <h1>
              <span
                className="block text-[4rem] sm:text-[5.5rem] md:text-[7rem] lg:text-[8.5rem] font-bold leading-[0.85] tracking-[-0.04em]"
                style={{
                  fontFamily:
                    "var(--font-display, 'Playfair Display'), Georgia, serif",
                  color: c.textPrimary,
                }}
              >
                Learn
              </span>

              {/* Rotating accent word */}
              <span className="relative block mt-2 sm:mt-3">
                <span className="relative inline-block min-w-[220px] sm:min-w-[320px] md:min-w-[420px] lg:min-w-[520px]">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={wordIndex}
                      initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -36, filter: "blur(8px)" }}
                      transition={{
                        duration: 0.55,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="block text-[3.5rem] sm:text-[5rem] md:text-[6.5rem] lg:text-[8rem] font-bold leading-[0.85] tracking-[-0.04em]"
                      style={{
                        fontFamily:
                          "var(--font-display, 'Playfair Display'), Georgia, serif",
                        color: c.accent,
                        fontStyle: "italic",
                      }}
                    >
                      {ROTATING_WORDS[wordIndex]}

                      {/* Accent underline sweep */}
                      <motion.div
                        className="absolute -bottom-2 left-[10%] right-[10%] h-[2px] rounded-full"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)`,
                          transformOrigin: "center",
                        }}
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 0.5 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.15,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        key={`ul-${wordIndex}`}
                      />
                    </motion.span>
                  </AnimatePresence>

                  {/* Invisible spacer for layout stability */}
                  <span
                    className="invisible block text-[3.5rem] sm:text-[5rem] md:text-[6.5rem] lg:text-[8rem] font-bold italic leading-[0.85]"
                    style={{
                      fontFamily:
                        "var(--font-display, 'Playfair Display'), Georgia, serif",
                    }}
                    aria-hidden
                  >
                    Brilliantly
                  </span>
                </span>
              </span>

              {/* Subtitle line */}
              <span
                className="block mt-4 sm:mt-6 text-lg sm:text-xl md:text-[1.4rem] font-normal leading-relaxed"
                style={{
                  fontFamily:
                    "var(--font-body, 'Source Serif 4'), Georgia, serif",
                  color: c.textSecondary,
                  letterSpacing: "-0.01em",
                }}
              >
                Courses that adapt to how you think
              </span>
            </h1>
          </motion.div>

          {/* Description */}
          <motion.p
            variants={fadeUp}
            className="mt-4 sm:mt-5 text-[15px] sm:text-base leading-[1.8] max-w-[480px]"
            style={{
              fontFamily:
                "var(--font-body, 'Source Serif 4'), Georgia, serif",
              color: c.textSecondary,
            }}
          >
            Expert-crafted curriculum paired with an AI mentor that maps your
            gaps and builds a path made for{" "}
            <em style={{ color: c.textPrimary, fontStyle: "italic" }}>you</em>.
          </motion.p>

          {/* Search */}
          <motion.div
            variants={fadeUp}
            className="mt-8 sm:mt-10 w-full max-w-[560px]"
          >
            <form
              onSubmit={handleHeroSearch}
              className="relative group"
            >
              {/* Focus glow ring */}
              <div
                className="absolute -inset-[3px] rounded-2xl opacity-0 group-focus-within:opacity-100 blur-lg transition-opacity duration-600"
                style={{ background: c.searchFocusGlow }}
              />

              <div
                className="relative flex items-center rounded-xl overflow-hidden transition-all duration-300"
                style={{
                  background: c.searchBg,
                  border: `1.5px solid ${c.searchBorder}`,
                  backdropFilter: "blur(20px)",
                  boxShadow: c.searchShadow,
                }}
              >
                <Search
                  className="ml-5 h-[18px] w-[18px] flex-shrink-0"
                  style={{ color: c.textMuted }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Search courses, topics, skills..."
                  className="flex-1 bg-transparent px-4 py-4 sm:py-[18px] text-[15px] outline-none placeholder:opacity-40"
                  style={{
                    fontFamily:
                      "var(--font-body, 'Source Serif 4'), Georgia, serif",
                    color: c.textPrimary,
                  }}
                />

                {/* Keyboard shortcut */}
                <span
                  className="hidden sm:flex items-center gap-0.5 mr-2 px-2 py-1 rounded-md text-[10px]"
                  style={{
                    border: `1px solid ${c.border}`,
                    color: c.textMuted,
                    fontFamily:
                      "var(--font-ui, 'Inter'), system-ui, sans-serif",
                  }}
                >
                  &#8984;K
                </span>

                <button
                  type="submit"
                  className="mr-2.5 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 active:scale-95 hover:brightness-110"
                  style={{ background: c.primary }}
                >
                  <ArrowRight className="h-4 w-4 text-white" />
                </button>
              </div>
            </form>

            {/* Quick search tags */}
            <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
              <span
                className="font-medium uppercase"
                style={{
                  fontFamily:
                    "var(--font-ui, 'Inter'), system-ui, sans-serif",
                  color: c.textMuted,
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                }}
              >
                Trending
              </span>
              {QUICK_SEARCHES.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setHeroSearch(tag);
                    searchInputRef.current?.focus();
                  }}
                  className="rounded-full px-3 py-1.5 transition-all duration-200 hover:scale-[1.04]"
                  style={{
                    border: `1px solid ${c.border}`,
                    background: c.surface,
                    color: c.textSecondary,
                    fontFamily:
                      "var(--font-ui, 'Inter'), system-ui, sans-serif",
                    fontSize: "11px",
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>

          {/* CTA + Stats row */}
          <motion.div
            variants={fadeUp}
            className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center gap-7 sm:gap-10"
          >
            {/* CTA buttons */}
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                className="group/btn rounded-xl px-7 py-6 text-sm font-semibold tracking-wide transition-all duration-300 hover:brightness-110"
                style={{
                  background: c.primary,
                  color: "#FFFFFF",
                  fontFamily:
                    "var(--font-ui, 'Inter'), system-ui, sans-serif",
                  boxShadow: c.btnShadow,
                }}
                asChild
              >
                <Link href={userId ? "/dashboard/user" : "/auth/register"}>
                  {userId ? "Go to Dashboard" : "Start Learning Free"}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Link>
              </Button>

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("main-content")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="group/browse flex items-center gap-2 text-[13px] font-medium transition-colors"
                style={{
                  color: c.textSecondary,
                  fontFamily:
                    "var(--font-ui, 'Inter'), system-ui, sans-serif",
                }}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 group-hover/browse:scale-105"
                  style={{
                    border: `1px solid ${c.border}`,
                    background: c.surface,
                  }}
                >
                  <ChevronDown
                    className="h-3.5 w-3.5"
                    style={{ color: c.textMuted }}
                  />
                </span>
                <span className="hidden sm:inline hover:opacity-70 transition-opacity">
                  Browse catalog
                </span>
              </button>
            </div>

            {/* Vertical divider */}
            <div
              className="hidden sm:block w-px h-10"
              style={{ background: c.border }}
            />

            {/* Stats */}
            <div className="flex items-center gap-8 sm:gap-10">
              <StatCell
                value={
                  statistics.totalCourses > 0
                    ? `${statistics.totalCourses}`
                    : "0"
                }
                label="Courses"
                color={c.primary}
                mutedColor={c.textSecondary}
              />
              <div
                className="w-px h-8"
                style={{ background: c.border }}
              />
              <StatCell
                value={
                  statistics.totalEnrollments > 0
                    ? statistics.totalEnrollments.toLocaleString()
                    : "0"
                }
                label="Learners"
                color={c.accent}
                mutedColor={c.textSecondary}
              />
              <div
                className="w-px h-8"
                style={{ background: c.border }}
              />
              <StatCell
                value={
                  statistics.averageRating > 0
                    ? statistics.averageRating.toFixed(1)
                    : "--"
                }
                label="Rating"
                color={c.rose}
                mutedColor={c.textSecondary}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* ======== Feature strip ======== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          className="pb-10 sm:pb-14"
        >
          {/* Separator */}
          <div
            className="mx-auto mb-8 sm:mb-10 h-px max-w-[200px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${c.border}, transparent)`,
            }}
          />

          <div className="flex flex-wrap justify-center gap-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.95 + i * 0.06, duration: 0.35 }}
                className="flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-all duration-200 hover:scale-[1.04] cursor-default"
                style={{
                  border: `1px solid ${c.border}`,
                  background: c.surface,
                  backdropFilter: "blur(8px)",
                }}
              >
                <f.icon
                  className="h-3.5 w-3.5"
                  style={{ color: c.primary }}
                />
                <span
                  className="text-[11px] font-semibold"
                  style={{
                    fontFamily:
                      "var(--font-ui, 'Inter'), system-ui, sans-serif",
                    color: c.textPrimary,
                  }}
                >
                  {f.label}
                </span>
                <span
                  className="text-[10px] hidden sm:inline"
                  style={{ color: c.textSecondary }}
                >
                  {f.desc}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom edge accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${c.edgeLine} 50%, transparent)`,
        }}
      />
    </section>
  );
}

/* ================================================================
   SUB-COMPONENTS
   ================================================================ */

function StatCell({
  value,
  label,
  color,
  mutedColor,
}: {
  value: string;
  label: string;
  color: string;
  mutedColor: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-xl sm:text-2xl font-bold leading-none tracking-tight"
        style={{
          fontFamily:
            "var(--font-display, 'Playfair Display'), Georgia, serif",
          color,
        }}
      >
        {value}
      </span>
      <span
        className="mt-1 font-medium tracking-[0.12em] uppercase"
        style={{
          fontFamily: "var(--font-ui, 'Inter'), system-ui, sans-serif",
          fontSize: "10px",
          color: mutedColor,
        }}
      >
        {label}
      </span>
    </div>
  );
}
