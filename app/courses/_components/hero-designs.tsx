"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/theme-provider";
import {
  Search,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Brain,
  Target,
  Layers,
  Compass,
  Sparkles,
  Zap,
  ChevronDown,
  Award,
  Users,
  Star,
  TrendingUp,
  ArrowUpRight,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------
   SHARED: Types, Data, Colors, Hooks
   ------------------------------------------------ */

interface HeroProps {
  statistics: {
    totalCourses: number;
    totalEnrollments: number;
    averageRating: number;
  };
  userId?: string;
}

const WORDS = ["Precisely", "Deeply", "Brilliantly", "Masterfully"];
const TAGS = ["Python", "Web Development", "Data Science", "Machine Learning"];
const MARQUEE_WORDS = [
  "Algorithms", "React", "Python", "Machine Learning", "Data Science",
  "TypeScript", "Neural Networks", "Web Dev", "Statistics", "DevOps",
  "Calculus", "Design", "Rust", "Blockchain", "Quantum", "AI Ethics",
];

const FEATURES = [
  { icon: Brain, label: "AI Tutor", desc: "Personal mentor" },
  { icon: Target, label: "Goal Tracking", desc: "Stay on course" },
  { icon: Layers, label: "Adaptive Path", desc: "Learn your way" },
  { icon: GraduationCap, label: "Certificates", desc: "Earn credentials" },
  { icon: Sparkles, label: "Smart Review", desc: "Spaced repetition" },
  { icon: Compass, label: "Discovery", desc: "Explore topics" },
];

function useColors(isDark: boolean) {
  if (isDark) {
    return {
      bg: "linear-gradient(180deg, #0C0A09 0%, #1C1917 100%)",
      primary: "#5EEAD4",
      primaryMuted: "#2DD4BF",
      primarySoft: "rgba(94,234,212,0.08)",
      primaryBorder: "rgba(94,234,212,0.14)",
      accent: "#FB923C",
      accentSoft: "rgba(251,146,60,0.08)",
      textPrimary: "rgba(255,255,255,0.92)",
      textSecondary: "rgba(255,255,255,0.5)",
      textTertiary: "rgba(255,255,255,0.22)",
      surface: "rgba(255,255,255,0.04)",
      surfaceHover: "rgba(255,255,255,0.07)",
      border: "rgba(255,255,255,0.06)",
      contourStroke: "rgba(94,234,212,0.05)",
      statAccent2: "#FBBF24",
      orbGlow1: "rgba(94,234,212,0.07)",
      orbGlow2: "rgba(251,146,60,0.04)",
      nodeCard: "rgba(12,10,9,0.85)",
      hubBg: "linear-gradient(145deg, rgba(94,234,212,0.06), rgba(12,10,9,0.95))",
      hubBorder: "rgba(94,234,212,0.14)",
      hubShadow: "0 8px 32px rgba(0,0,0,0.4)",
      searchShadow: "0 4px 24px rgba(0,0,0,0.3)",
      btnShadow: "0 4px 20px rgba(94,234,212,0.12)",
      dotGlow1: "rgba(94,234,212,0.4)",
      dotGlow2: "rgba(251,146,60,0.35)",
      dotGlow3: "rgba(251,191,36,0.35)",
      edgeLine: "rgba(94,234,212,0.08)",
    };
  }
  return {
    bg: "linear-gradient(180deg, #FAF9F6 0%, #F3F1EC 50%, #FAF9F6 100%)",
    primary: "#0F766E",
    primaryMuted: "#0D9488",
    primarySoft: "rgba(15,118,110,0.06)",
    primaryBorder: "rgba(15,118,110,0.1)",
    accent: "#C2622D",
    accentSoft: "rgba(194,98,45,0.06)",
    textPrimary: "#1C1917",
    textSecondary: "#78716C",
    textTertiary: "#A8A29E",
    surface: "rgba(255,255,255,0.75)",
    surfaceHover: "rgba(255,255,255,0.9)",
    border: "rgba(28,25,23,0.07)",
    contourStroke: "rgba(15,118,110,0.04)",
    statAccent2: "#B45309",
    orbGlow1: "rgba(15,118,110,0.05)",
    orbGlow2: "rgba(194,98,45,0.03)",
    nodeCard: "rgba(255,255,255,0.92)",
    hubBg: "linear-gradient(145deg, rgba(255,255,255,0.97), rgba(250,249,246,0.95))",
    hubBorder: "rgba(15,118,110,0.1)",
    hubShadow: "0 8px 32px rgba(28,25,23,0.06), 0 2px 8px rgba(0,0,0,0.02)",
    searchShadow: "0 4px 24px rgba(28,25,23,0.03), 0 1px 4px rgba(0,0,0,0.02)",
    btnShadow: "0 4px 20px rgba(15,118,110,0.18)",
    dotGlow1: "rgba(15,118,110,0.3)",
    dotGlow2: "rgba(194,98,45,0.25)",
    dotGlow3: "rgba(180,83,9,0.25)",
    edgeLine: "rgba(15,118,110,0.06)",
  };
}

function useRotatingWord() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((p) => (p + 1) % WORDS.length), 2800);
    return () => clearInterval(t);
  }, []);
  return { word: WORDS[idx], idx };
}

function useHeroSearch() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        const el = document.querySelector("[data-results-section]");
        if (el) el.scrollIntoView({ behavior: "smooth" });
        const p = new URLSearchParams(window.location.search);
        p.set("q", query.trim());
        router.push(`/courses?${p.toString()}`);
      }
    },
    [query, router]
  );
  return { query, setQuery, inputRef, onSubmit };
}

const FONT = {
  display: "var(--font-display, 'Playfair Display'), Georgia, serif",
  body: "var(--font-body, 'Source Serif 4'), Georgia, serif",
  ui: "var(--font-ui, 'Inter'), system-ui, sans-serif",
};

/* ================================================
   DESIGN 1: MARQUEE EDITORIAL
   Oversized typography with a continuously scrolling
   marquee of knowledge topics behind the headline.
   Thin horizontal rules. Poster-like composition.
   ================================================ */

function MarqueeStrip({ words, speed, c, reverse }: { words: string[]; speed: number; c: ReturnType<typeof useColors>; reverse?: boolean }) {
  const doubled = [...words, ...words];
  return (
    <div className="overflow-hidden whitespace-nowrap select-none pointer-events-none">
      <motion.div
        animate={{ x: reverse ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
        className="inline-flex gap-8"
      >
        {doubled.map((w, i) => (
          <span
            key={`${w}-${i}`}
            className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] font-bold tracking-[-0.03em] opacity-[0.04]"
            style={{ fontFamily: FONT.display, color: c.textPrimary }}
          >
            {w}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function HeroDesign1({ statistics, userId }: HeroProps) {
  const { word, idx } = useRotatingWord();
  const { query, setQuery, inputRef, onSubmit } = useHeroSearch();
  const { isDark } = useTheme();
  const c = useColors(isDark);

  return (
    <section className="relative overflow-hidden" style={{ background: c.bg }}>
      {/* Grain */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.018]" aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 lg:pt-24">
        {/* Top rule */}
        <div className="h-px w-full mb-8" style={{ background: `linear-gradient(90deg, ${c.primary}, ${c.accent}, ${c.primary})`, opacity: 0.15 }} />

        {/* Scrolling marquee background layer */}
        <div className="absolute inset-0 top-[15%] pointer-events-none overflow-hidden" aria-hidden>
          <div className="space-y-2">
            <MarqueeStrip words={MARQUEE_WORDS.slice(0, 8)} speed={45} c={c} />
            <MarqueeStrip words={MARQUEE_WORDS.slice(8)} speed={55} c={c} reverse />
            <MarqueeStrip words={[...MARQUEE_WORDS].reverse().slice(0, 8)} speed={50} c={c} />
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10">
          {/* Eyebrow with issue number styling */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4 mb-10"
          >
            <span
              className="text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ fontFamily: FONT.ui, color: c.textTertiary }}
            >
              Vol. I
            </span>
            <div className="h-px flex-1 max-w-[80px]" style={{ background: c.border }} />
            <span
              className="text-[10px] font-semibold tracking-[0.12em] uppercase"
              style={{ fontFamily: FONT.ui, color: c.primary }}
            >
              The Knowledge Atlas
            </span>
          </motion.div>

          {/* Massive headline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <h1 className="mb-2">
              <span
                className="block text-[4.5rem] sm:text-[6.5rem] md:text-[8rem] lg:text-[10rem] font-bold leading-[0.85] tracking-[-0.05em]"
                style={{ fontFamily: FONT.display, color: c.textPrimary }}
              >
                Learn
              </span>
            </h1>
            <div className="relative">
              <span className="relative inline-block min-w-[280px] sm:min-w-[420px] md:min-w-[520px]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                    animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                    exit={{ opacity: 0, clipPath: "inset(0 0 0 100%)" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="block text-[4rem] sm:text-[6rem] md:text-[7.5rem] lg:text-[9.5rem] font-bold leading-[0.85] tracking-[-0.05em]"
                    style={{ fontFamily: FONT.display, fontStyle: "italic", color: c.accent }}
                  >
                    {word}
                  </motion.span>
                </AnimatePresence>
                <span
                  className="invisible block text-[4rem] sm:text-[6rem] md:text-[7.5rem] lg:text-[9.5rem] font-bold italic leading-[0.85]"
                  style={{ fontFamily: FONT.display }}
                  aria-hidden
                >
                  Brilliantly
                </span>
              </span>
            </div>
          </motion.div>

          {/* Mid rule */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="h-px w-full my-8 origin-left"
            style={{ background: c.border }}
          />

          {/* Bottom section: two columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid lg:grid-cols-2 gap-10 lg:gap-20 pb-12"
          >
            {/* Left: description + search */}
            <div>
              <p
                className="text-lg sm:text-xl leading-[1.7] mb-8 max-w-[460px]"
                style={{ fontFamily: FONT.body, color: c.textSecondary }}
              >
                Taxomind pairs expert-crafted curriculum with an AI mentor that
                reads your pace, maps your gaps, and builds a path made for{" "}
                <em style={{ color: c.textPrimary, fontStyle: "italic" }}>you</em>.
              </p>

              <form onSubmit={onSubmit} className="max-w-[480px] mb-4">
                <div
                  className="flex items-center rounded-xl overflow-hidden transition-all"
                  style={{
                    border: `1.5px solid ${c.border}`,
                    background: c.surface,
                    backdropFilter: "blur(16px)",
                    boxShadow: c.searchShadow,
                  }}
                >
                  <Search className="ml-5 h-[18px] w-[18px] flex-shrink-0" style={{ color: c.textTertiary }} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search courses, topics, skills..."
                    className="flex-1 bg-transparent px-3.5 py-4 text-[15px] outline-none placeholder:opacity-40"
                    style={{ fontFamily: FONT.body, color: c.textPrimary }}
                  />
                  <button type="submit" className="mr-2 flex h-9 w-9 items-center justify-center rounded-lg active:scale-95" style={{ background: c.primary }}>
                    <ArrowRight className="h-4 w-4 text-white" />
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-2 mb-8">
                <span className="text-[10px] font-medium tracking-[0.1em] uppercase" style={{ fontFamily: FONT.ui, color: c.textTertiary }}>Popular</span>
                {TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setQuery(t); inputRef.current?.focus(); }}
                    className="rounded-full px-3 py-1.5 text-[11px] transition-all hover:scale-[1.03]"
                    style={{ border: `1px solid ${c.border}`, background: c.surface, color: c.textSecondary, fontFamily: FONT.ui }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <Button
                  size="lg"
                  className="rounded-xl px-7 py-6 text-sm font-semibold tracking-wide hover:brightness-110"
                  style={{ background: c.primary, color: "#FFF", fontFamily: FONT.ui, boxShadow: c.btnShadow }}
                  asChild
                >
                  <Link href={userId ? "/dashboard/user" : "/auth/register"}>
                    {userId ? "Go to Dashboard" : "Start Learning Free"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={() => document.getElementById("main-content")?.scrollIntoView({ behavior: "smooth" })}
                  className="flex items-center gap-2 text-[13px] font-medium"
                  style={{ color: c.textSecondary, fontFamily: FONT.ui }}
                >
                  <ChevronDown className="h-4 w-4" style={{ color: c.textTertiary }} />
                  Browse
                </button>
              </div>
            </div>

            {/* Right: oversized stats as decorative numerals */}
            <div className="flex flex-col justify-end">
              <div className="space-y-6">
                {[
                  { val: statistics.totalCourses > 0 ? `${statistics.totalCourses}` : "0", label: "Expert-crafted courses", color: c.primary },
                  { val: statistics.totalEnrollments > 0 ? statistics.totalEnrollments.toLocaleString() : "0", label: "Active learners worldwide", color: c.accent },
                  { val: statistics.averageRating > 0 ? statistics.averageRating.toFixed(1) : "--", label: "Average course rating", color: c.statAccent2 },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.12, duration: 0.5 }}
                    className="flex items-baseline gap-5"
                  >
                    <span
                      className="text-[3.5rem] sm:text-[4.5rem] font-bold leading-none tracking-[-0.04em]"
                      style={{ fontFamily: FONT.display, color: s.color }}
                    >
                      {s.val}
                    </span>
                    <span
                      className="text-[13px] font-medium leading-tight"
                      style={{ fontFamily: FONT.body, color: c.textSecondary }}
                    >
                      {s.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom edge */}
      <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${c.edgeLine} 50%, transparent)` }} />
    </section>
  );
}

/* ================================================
   DESIGN 2: ORGANIC SHAPES
   Abstract organic blob shapes float behind content.
   Shapes use the warm palette. Asymmetric layout.
   Content offset to the left with breathing shapes
   on the right creating a living canvas feel.
   ================================================ */

function FloatingBlob({ cx, cy, r, color, delay, duration }: { cx: string; cy: string; r: number; color: string; delay: number; duration: number }) {
  return (
    <motion.div
      animate={{
        x: [0, 15, -10, 5, 0],
        y: [0, -12, 8, -5, 0],
        scale: [1, 1.05, 0.97, 1.02, 1],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
      className="absolute rounded-full blur-[80px]"
      style={{
        left: cx,
        top: cy,
        width: `${r}px`,
        height: `${r}px`,
        background: color,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}

export function HeroDesign2({ statistics, userId }: HeroProps) {
  const { word, idx } = useRotatingWord();
  const { query, setQuery, inputRef, onSubmit } = useHeroSearch();
  const { isDark } = useTheme();
  const c = useColors(isDark);

  return (
    <section className="relative overflow-hidden min-h-[90vh]" style={{ background: c.bg }}>
      {/* Organic floating blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <FloatingBlob cx="65%" cy="20%" r={500} color={isDark ? "rgba(94,234,212,0.06)" : "rgba(15,118,110,0.045)"} delay={0} duration={18} />
        <FloatingBlob cx="75%" cy="60%" r={400} color={isDark ? "rgba(251,146,60,0.04)" : "rgba(194,98,45,0.03)"} delay={2} duration={22} />
        <FloatingBlob cx="55%" cy="80%" r={350} color={isDark ? "rgba(251,191,36,0.03)" : "rgba(180,83,9,0.02)"} delay={4} duration={20} />
        <FloatingBlob cx="80%" cy="40%" r={280} color={isDark ? "rgba(94,234,212,0.04)" : "rgba(15,118,110,0.03)"} delay={1} duration={16} />

        {/* Organic SVG shapes */}
        <svg className="absolute right-0 top-0 w-[60%] h-full opacity-[0.03]" viewBox="0 0 600 800" fill="none">
          <motion.path
            d="M300,100 C450,100 550,200 500,350 C450,500 550,600 400,700 C250,800 150,650 200,500 C250,350 150,100 300,100Z"
            fill={c.primary}
            animate={{ d: [
              "M300,100 C450,100 550,200 500,350 C450,500 550,600 400,700 C250,800 150,650 200,500 C250,350 150,100 300,100Z",
              "M320,80 C480,120 520,240 480,370 C440,500 530,620 380,720 C230,820 130,630 220,480 C310,330 160,80 320,80Z",
              "M300,100 C450,100 550,200 500,350 C450,500 550,600 400,700 C250,800 150,650 200,500 C250,350 150,100 300,100Z",
            ] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx="420"
            cy="250"
            r="120"
            fill={c.accent}
            animate={{ cx: [420, 440, 410, 420], cy: [250, 230, 260, 250], r: [120, 130, 115, 120] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-center min-h-[90vh] py-16 sm:py-20">
          {/* Asymmetric left-heavy layout */}
          <div className="max-w-[680px]">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-10"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: c.primarySoft, border: `1px solid ${c.primaryBorder}` }}
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: c.primary }} />
              </div>
              <div>
                <span className="text-[11px] font-semibold tracking-[0.1em] uppercase block" style={{ fontFamily: FONT.ui, color: c.primary }}>
                  Explore the Knowledge Atlas
                </span>
                <span className="text-[10px] tracking-wide" style={{ fontFamily: FONT.ui, color: c.textTertiary }}>
                  Powered by SAM AI Mentor
                </span>
              </div>
            </motion.div>

            {/* Headline with staggered letter reveal */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mb-3"
            >
              <span
                className="block text-[3.5rem] sm:text-[5rem] md:text-[6.5rem] lg:text-[7.5rem] font-bold leading-[0.88] tracking-[-0.04em]"
                style={{ fontFamily: FONT.display, color: c.textPrimary }}
              >
                Learn
              </span>
              <span className="relative block mt-1">
                <span className="relative inline-block min-w-[260px] sm:min-w-[380px]">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, y: 40, rotateX: 45 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      exit={{ opacity: 0, y: -30, rotateX: -30 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="block text-[3.25rem] sm:text-[4.75rem] md:text-[6rem] lg:text-[7rem] font-bold leading-[0.88] tracking-[-0.04em]"
                      style={{ fontFamily: FONT.display, fontStyle: "italic", color: c.accent }}
                    >
                      {word}
                    </motion.span>
                  </AnimatePresence>
                  <span className="invisible block text-[3.25rem] sm:text-[4.75rem] md:text-[6rem] lg:text-[7rem] font-bold italic leading-[0.88]" style={{ fontFamily: FONT.display }} aria-hidden>Brilliantly</span>
                </span>
              </span>
            </motion.h1>

            {/* Subtitle as a pullquote */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="flex gap-4 mb-10 pl-1"
            >
              <div className="w-[3px] rounded-full flex-shrink-0" style={{ background: `linear-gradient(180deg, ${c.primary}, ${c.accent})` }} />
              <div>
                <p
                  className="text-lg sm:text-xl leading-[1.7] mb-1"
                  style={{ fontFamily: FONT.body, color: c.textSecondary }}
                >
                  Courses that adapt to how you think.
                </p>
                <p
                  className="text-[15px] leading-[1.7]"
                  style={{ fontFamily: FONT.body, color: c.textTertiary }}
                >
                  Taxomind pairs expert-crafted curriculum with an AI mentor that reads your pace,
                  maps your gaps, and builds a path made for <em style={{ color: c.textPrimary }}>you</em>.
                </p>
              </div>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              <form onSubmit={onSubmit} className="max-w-[520px] mb-4">
                <div
                  className="flex items-center rounded-2xl overflow-hidden"
                  style={{ border: `1.5px solid ${c.border}`, background: c.surface, backdropFilter: "blur(16px)", boxShadow: c.searchShadow }}
                >
                  <Search className="ml-5 h-[18px] w-[18px] flex-shrink-0" style={{ color: c.textTertiary }} />
                  <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search courses, topics, skills..."
                    className="flex-1 bg-transparent px-3.5 py-4 text-[15px] outline-none placeholder:opacity-40"
                    style={{ fontFamily: FONT.body, color: c.textPrimary }}
                  />
                  <button type="submit" className="mr-2 flex h-9 w-9 items-center justify-center rounded-lg active:scale-95 hover:brightness-110" style={{ background: c.primary }}>
                    <ArrowRight className="h-4 w-4 text-white" />
                  </button>
                </div>
              </form>
              <div className="flex flex-wrap items-center gap-2 mb-8">
                <span className="text-[10px] font-medium tracking-[0.1em] uppercase" style={{ fontFamily: FONT.ui, color: c.textTertiary }}>Popular</span>
                {TAGS.map((t) => (
                  <button key={t} type="button" onClick={() => { setQuery(t); inputRef.current?.focus(); }}
                    className="rounded-full px-3 py-1.5 text-[11px] hover:scale-[1.03] transition-transform"
                    style={{ border: `1px solid ${c.border}`, background: c.surface, color: c.textSecondary, fontFamily: FONT.ui }}>
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* CTA + Stats inline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="flex flex-wrap items-center gap-6"
            >
              <Button size="lg" className="rounded-xl px-7 py-6 text-sm font-semibold hover:brightness-110"
                style={{ background: c.primary, color: "#FFF", fontFamily: FONT.ui, boxShadow: c.btnShadow }} asChild>
                <Link href={userId ? "/dashboard/user" : "/auth/register"}>
                  {userId ? "Go to Dashboard" : "Start Learning Free"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <div className="hidden sm:flex items-center gap-6">
                <div className="w-px h-8" style={{ background: c.border }} />
                {[
                  { val: statistics.totalCourses > 0 ? `${statistics.totalCourses}` : "0", label: "Courses", color: c.primary },
                  { val: statistics.totalEnrollments > 0 ? statistics.totalEnrollments.toLocaleString() : "0", label: "Learners", color: c.accent },
                  { val: statistics.averageRating > 0 ? statistics.averageRating.toFixed(1) : "--", label: "Rating", color: c.statAccent2 },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-xl font-bold leading-none" style={{ fontFamily: FONT.display, color: s.color }}>{s.val}</div>
                    <div className="text-[9px] font-semibold tracking-[0.12em] uppercase mt-1" style={{ fontFamily: FONT.ui, color: c.textTertiary }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c.edgeLine} 50%, transparent)` }} />
    </section>
  );
}

/* ================================================
   DESIGN 3: SPLIT SCREEN WITH 3D CARD STACK
   Left half: clean editorial content.
   Right half: a perspective 3D stack of floating
   feature/course cards that fan out with depth.
   ================================================ */

export function HeroDesign3({ statistics, userId }: HeroProps) {
  const { word, idx } = useRotatingWord();
  const { query, setQuery, inputRef, onSubmit } = useHeroSearch();
  const { isDark } = useTheme();
  const c = useColors(isDark);

  const cards = [
    { icon: Brain, title: "SAM AI Mentor", sub: "Personal learning companion", color: c.primary, rotate: -6, y: 0 },
    { icon: Target, title: "Adaptive Learning", sub: "Paths that evolve with you", color: c.accent, rotate: -2, y: 45 },
    { icon: GraduationCap, title: "Earn Certificates", sub: "Prove your expertise", color: c.statAccent2, rotate: 3, y: 90 },
    { icon: Sparkles, title: "Smart Review", sub: "Spaced repetition system", color: c.primary, rotate: 6, y: 135 },
  ];

  return (
    <section className="relative overflow-hidden" style={{ background: c.bg }}>
      {/* Subtle topographic lines */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 800" fill="none" preserveAspectRatio="xMidYMid slice">
          <path d="M-80,380 C180,220 480,480 720,320 S1100,440 1520,360" stroke={c.contourStroke} strokeWidth="1" fill="none" opacity="0.8" />
          <path d="M-60,440 C220,300 500,520 760,380 S1140,480 1540,400" stroke={c.contourStroke} strokeWidth="0.8" fill="none" opacity="0.5" />
          <path d="M-40,510 C260,380 540,560 800,440 S1180,530 1560,450" stroke={c.contourStroke} strokeWidth="0.6" fill="none" opacity="0.35" />
        </svg>
        <div
          className="absolute -top-[20%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: `radial-gradient(circle, ${c.orbGlow1}, transparent 60%)` }}
        />
        <div
          className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: `radial-gradient(circle, ${c.orbGlow2}, transparent 60%)` }}
        />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] gap-12 lg:gap-16 items-center pt-16 sm:pt-24 lg:pt-28 pb-16 sm:pb-20">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-[580px]"
          >
            <div
              className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 mb-8"
              style={{ background: c.primarySoft, border: `1px solid ${c.primaryBorder}` }}
            >
              <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full" style={{ background: c.primary }}>
                <Zap className="h-2.5 w-2.5 text-white" />
              </div>
              <span className="text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ fontFamily: FONT.ui, color: c.primary }}>
                Explore the Knowledge Atlas
              </span>
            </div>

            <h1 className="mb-5">
              <span className="block text-[3.25rem] sm:text-[4.5rem] md:text-[5.5rem] font-bold leading-[0.9] tracking-[-0.04em]"
                style={{ fontFamily: FONT.display, color: c.textPrimary }}>
                Learn
              </span>
              <span className="relative block -mt-1">
                <span className="relative inline-block min-w-[200px] sm:min-w-[280px] md:min-w-[340px]">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -24, filter: "blur(6px)" }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="block text-[3rem] sm:text-[4.25rem] md:text-[5.25rem] font-bold leading-[0.9] tracking-[-0.04em]"
                      style={{ fontFamily: FONT.display, fontStyle: "italic", color: c.accent }}
                    >
                      {word}
                      <motion.svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none" style={{ height: "10px" }}>
                        <motion.path d="M2,8 C40,2 80,10 120,5 S200,8 240,3 S280,7 298,5" stroke={c.accent} strokeWidth="2.5" strokeLinecap="round" fill="none"
                          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.5 }}
                          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }} />
                      </motion.svg>
                    </motion.span>
                  </AnimatePresence>
                  <span className="invisible block text-[3rem] sm:text-[4.25rem] md:text-[5.25rem] font-bold italic leading-[0.9]" style={{ fontFamily: FONT.display }} aria-hidden>Brilliantly</span>
                </span>
              </span>
              <span className="block mt-2 sm:mt-3 text-lg sm:text-xl md:text-[1.375rem] font-normal leading-relaxed"
                style={{ fontFamily: FONT.body, color: c.textSecondary, letterSpacing: "-0.01em" }}>
                with courses that adapt to how you think
              </span>
            </h1>

            <p className="text-[15px] sm:text-base leading-[1.8] max-w-[480px] mb-7"
              style={{ fontFamily: FONT.body, color: c.textSecondary }}>
              Taxomind pairs expert-crafted curriculum with an AI mentor that reads your pace,
              maps your gaps, and builds a path made for <em style={{ color: c.textPrimary, fontStyle: "italic" }}>you</em>.
            </p>

            {/* Search */}
            <form onSubmit={onSubmit} className="max-w-[520px] mb-3">
              <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1.5px solid ${c.border}`, background: c.surface, backdropFilter: "blur(16px)", boxShadow: c.searchShadow }}>
                <Search className="ml-5 h-[18px] w-[18px] flex-shrink-0" style={{ color: c.textTertiary }} />
                <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search courses, topics, skills..."
                  className="flex-1 bg-transparent px-3.5 py-4 text-[15px] outline-none placeholder:opacity-40"
                  style={{ fontFamily: FONT.body, color: c.textPrimary }} />
                <button type="submit" className="mr-2 flex h-9 w-9 items-center justify-center rounded-lg active:scale-95 hover:brightness-110" style={{ background: c.primary }}>
                  <ArrowRight className="h-4 w-4 text-white" />
                </button>
              </div>
            </form>
            <div className="flex flex-wrap items-center gap-2 mb-7">
              <span className="text-[10px] font-medium tracking-[0.1em] uppercase" style={{ fontFamily: FONT.ui, color: c.textTertiary }}>Popular</span>
              {TAGS.map((t) => (
                <button key={t} type="button" onClick={() => { setQuery(t); inputRef.current?.focus(); }}
                  className="rounded-full px-3 py-1.5 text-[11px] hover:scale-[1.03] transition-transform"
                  style={{ border: `1px solid ${c.border}`, background: c.surface, color: c.textSecondary, fontFamily: FONT.ui }}>
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Button size="lg" className="group/btn rounded-xl px-7 py-6 text-sm font-semibold tracking-wide hover:brightness-110"
                style={{ background: c.primary, color: "#FFF", fontFamily: FONT.ui, boxShadow: c.btnShadow }} asChild>
                <Link href={userId ? "/dashboard/user" : "/auth/register"}>
                  {userId ? "Go to Dashboard" : "Start Learning Free"}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
              <button type="button" onClick={() => document.getElementById("main-content")?.scrollIntoView({ behavior: "smooth" })}
                className="group/exp flex items-center gap-2.5 text-[13px] font-medium" style={{ color: c.textSecondary, fontFamily: FONT.ui }}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ border: `1px solid ${c.border}`, background: c.surface }}>
                  <ChevronDown className="h-4 w-4" style={{ color: c.textTertiary }} />
                </span>
                Browse catalog
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-10" style={{ borderTop: `1px solid ${c.border}`, paddingTop: "1.25rem" }}>
              {[
                { val: statistics.totalCourses > 0 ? `${statistics.totalCourses}` : "0", label: "Courses", color: c.primary },
                { val: statistics.totalEnrollments > 0 ? statistics.totalEnrollments.toLocaleString() : "0", label: "Learners", color: c.accent },
                { val: statistics.averageRating > 0 ? statistics.averageRating.toFixed(1) : "--", label: "Rating", color: c.statAccent2 },
              ].map((s, i) => (
                <div key={s.label}>
                  <div className="w-px h-10 hidden" style={{ background: c.border }} />
                  <div className="text-2xl sm:text-3xl font-bold leading-none tracking-tight" style={{ fontFamily: FONT.display, color: s.color }}>{s.val}</div>
                  <div className="mt-1.5 font-medium tracking-[0.12em] uppercase" style={{ fontFamily: FONT.ui, fontSize: "10px", color: c.textSecondary }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: 3D Fanned Card Stack */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block relative"
            style={{ perspective: "1000px" }}
          >
            <div className="relative h-[520px] w-full">
              {cards.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 60, rotateZ: 0 }}
                  animate={{ opacity: 1, y: card.y, rotateZ: card.rotate }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-1/2 -translate-x-1/2 w-[320px] xl:w-[360px]"
                  style={{ zIndex: cards.length - i }}
                >
                  <motion.div
                    animate={{ y: [0, i % 2 === 0 ? -4 : 4, 0] }}
                    transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
                    className="p-5 rounded-2xl"
                    style={{
                      background: c.nodeCard,
                      border: `1px solid ${c.primaryBorder}`,
                      backdropFilter: "blur(16px)",
                      boxShadow: isDark
                        ? `0 ${8 + i * 4}px ${24 + i * 8}px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)`
                        : `0 ${8 + i * 4}px ${24 + i * 8}px rgba(28,25,23,0.06), 0 0 0 1px rgba(255,255,255,0.6)`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                        style={{ background: isDark ? `${card.color}15` : `${card.color}0D`, border: `1px solid ${card.color}20` }}
                      >
                        <card.icon className="h-5 w-5" style={{ color: card.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate" style={{ color: c.textPrimary, fontFamily: FONT.ui }}>{card.title}</div>
                        <div className="text-[11px] truncate" style={{ color: c.textTertiary, fontFamily: FONT.body }}>{card.sub}</div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 flex-shrink-0" style={{ color: c.textTertiary }} />
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c.edgeLine} 50%, transparent)` }} />
    </section>
  );
}

/* ================================================
   DESIGN 4: DIAGONAL SPLIT + FEATURE ORBIT
   A bold diagonal line splits the hero. Upper-left
   has the content. Lower-right has an orbital ring
   with feature nodes. The diagonal creates tension
   and visual interest. Stats run along the diagonal.
   ================================================ */

export function HeroDesign4({ statistics, userId }: HeroProps) {
  const { word, idx } = useRotatingWord();
  const { query, setQuery, inputRef, onSubmit } = useHeroSearch();
  const { isDark } = useTheme();
  const c = useColors(isDark);

  return (
    <section className="relative overflow-hidden" style={{ background: c.bg }}>
      {/* Diagonal split background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Diagonal fill on the lower-right */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <path
            d="M1440,300 L1440,900 L0,900 Z"
            fill={isDark ? "rgba(94,234,212,0.015)" : "rgba(15,118,110,0.015)"}
          />
          {/* Diagonal line */}
          <line x1="0" y1="900" x2="1440" y2="200" stroke={c.primaryBorder} strokeWidth="1" opacity="0.5" />
          {/* Secondary line */}
          <line x1="0" y1="900" x2="1440" y2="240" stroke={c.primaryBorder} strokeWidth="0.5" opacity="0.25" strokeDasharray="8 16" />
        </svg>

        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />

        {/* Glow orbs */}
        <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: `radial-gradient(circle, ${c.orbGlow1}, transparent 60%)` }} />
        <div className="absolute bottom-[5%] right-[10%] w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: `radial-gradient(circle, ${c.orbGlow2}, transparent 60%)` }} />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_440px] gap-10 lg:gap-8 items-start pt-16 sm:pt-24 lg:pt-28 pb-10 sm:pb-14">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-[600px]"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 mb-8"
              style={{ background: c.primarySoft, border: `1px solid ${c.primaryBorder}` }}>
              <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full" style={{ background: c.primary }}>
                <Zap className="h-2.5 w-2.5 text-white" />
              </div>
              <span className="text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ fontFamily: FONT.ui, color: c.primary }}>
                Explore the Knowledge Atlas
              </span>
            </div>

            <h1 className="mb-5">
              <span className="block text-[3.25rem] sm:text-[4.25rem] md:text-[5rem] lg:text-[5.5rem] font-bold leading-[0.92] tracking-[-0.04em]"
                style={{ fontFamily: FONT.display, color: c.textPrimary }}>Learn</span>
              <span className="relative block -mt-1">
                <span className="relative inline-block min-w-[200px] sm:min-w-[280px] md:min-w-[340px]">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, scale: 0.92, filter: "blur(12px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="block text-[3rem] sm:text-[4rem] md:text-[4.75rem] lg:text-[5.25rem] font-bold leading-[0.92] tracking-[-0.04em]"
                      style={{ fontFamily: FONT.display, fontStyle: "italic", color: c.accent }}
                    >
                      {word}
                    </motion.span>
                  </AnimatePresence>
                  <span className="invisible block text-[3rem] sm:text-[4rem] md:text-[4.75rem] lg:text-[5.25rem] font-bold italic leading-[0.92]"
                    style={{ fontFamily: FONT.display }} aria-hidden>Brilliantly</span>
                </span>
              </span>
              <span className="block mt-2 text-lg sm:text-xl leading-relaxed"
                style={{ fontFamily: FONT.body, color: c.textSecondary, letterSpacing: "-0.01em" }}>
                with courses that adapt to how you think
              </span>
            </h1>

            <p className="text-[15px] leading-[1.8] max-w-[460px] mb-7" style={{ fontFamily: FONT.body, color: c.textSecondary }}>
              Taxomind pairs expert-crafted curriculum with an AI mentor that reads your pace,
              maps your gaps, and builds a path made for <em style={{ color: c.textPrimary, fontStyle: "italic" }}>you</em>.
            </p>

            <form onSubmit={onSubmit} className="max-w-[520px] mb-3">
              <div className="flex items-center rounded-xl overflow-hidden"
                style={{ border: `1.5px solid ${c.border}`, background: c.surface, backdropFilter: "blur(16px)", boxShadow: c.searchShadow }}>
                <Search className="ml-5 h-[18px] w-[18px] flex-shrink-0" style={{ color: c.textTertiary }} />
                <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search courses, topics, skills..."
                  className="flex-1 bg-transparent px-3.5 py-4 text-[15px] outline-none placeholder:opacity-40"
                  style={{ fontFamily: FONT.body, color: c.textPrimary }} />
                <button type="submit" className="mr-2 flex h-9 w-9 items-center justify-center rounded-lg active:scale-95 hover:brightness-110"
                  style={{ background: c.primary }}>
                  <ArrowRight className="h-4 w-4 text-white" />
                </button>
              </div>
            </form>
            <div className="flex flex-wrap items-center gap-2 mb-7">
              <span className="text-[10px] font-medium tracking-[0.1em] uppercase" style={{ fontFamily: FONT.ui, color: c.textTertiary }}>Popular</span>
              {TAGS.map((t) => (
                <button key={t} type="button" onClick={() => { setQuery(t); inputRef.current?.focus(); }}
                  className="rounded-full px-3 py-1.5 text-[11px] hover:scale-[1.03] transition-transform"
                  style={{ border: `1px solid ${c.border}`, background: c.surface, color: c.textSecondary, fontFamily: FONT.ui }}>
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" className="group/btn rounded-xl px-7 py-6 text-sm font-semibold tracking-wide hover:brightness-110"
                style={{ background: c.primary, color: "#FFF", fontFamily: FONT.ui, boxShadow: c.btnShadow }} asChild>
                <Link href={userId ? "/dashboard/user" : "/auth/register"}>
                  {userId ? "Go to Dashboard" : "Start Learning Free"}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
              <button type="button" onClick={() => document.getElementById("main-content")?.scrollIntoView({ behavior: "smooth" })}
                className="group/exp flex items-center gap-2.5 text-[13px] font-medium" style={{ color: c.textSecondary, fontFamily: FONT.ui }}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ border: `1px solid ${c.border}`, background: c.surface }}>
                  <ChevronDown className="h-4 w-4" style={{ color: c.textTertiary }} />
                </span>
                Browse catalog
              </button>
            </div>
          </motion.div>

          {/* Right: Orbital feature ring with diagonal alignment */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="hidden lg:flex items-center justify-center pt-10"
          >
            <div className="relative w-[340px] h-[340px] xl:w-[400px] xl:h-[400px]">
              {/* Ambient glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px]"
                style={{ background: `radial-gradient(circle, ${c.orbGlow1}, ${c.orbGlow2}, transparent 70%)` }} />

              {/* Rings */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 420 420" fill="none">
                <circle cx="210" cy="210" r="165" stroke={c.primaryBorder} strokeWidth="0.6" strokeDasharray="5 12" />
                <circle cx="210" cy="210" r="115" stroke={c.primaryBorder} strokeWidth="0.8" opacity="0.8" />
                <circle cx="210" cy="210" r="55" stroke={c.primaryBorder} strokeWidth="0.5" strokeDasharray="2 8" opacity="0.5" />
              </svg>

              {/* Rotating dots */}
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} className="absolute inset-0">
                <div className="absolute top-[1%] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full" style={{ background: c.primary, boxShadow: `0 0 14px ${c.dotGlow1}` }} />
                <div className="absolute bottom-[1%] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ background: c.accent, boxShadow: `0 0 10px ${c.dotGlow2}` }} />
              </motion.div>

              {/* Center hub */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="relative">
                  <div className="absolute -inset-8 rounded-full blur-2xl" style={{ background: `radial-gradient(circle, ${c.orbGlow1}, transparent 70%)` }} />
                  <div className="relative flex h-[100px] w-[100px] xl:h-[116px] xl:w-[116px] items-center justify-center rounded-2xl"
                    style={{ border: `1.5px solid ${c.hubBorder}`, background: c.hubBg, backdropFilter: "blur(20px)", boxShadow: c.hubShadow }}>
                    <div className="text-center">
                      <Brain className="mx-auto h-7 w-7 xl:h-8 xl:w-8 mb-1" style={{ color: c.primary }} />
                      <p className="text-[11px] xl:text-xs font-bold tracking-[0.18em] uppercase" style={{ fontFamily: FONT.ui, color: c.primary }}>SAM</p>
                      <p className="text-[8px] xl:text-[9px] tracking-[0.08em] uppercase" style={{ color: c.textTertiary }}>AI Mentor</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature nodes on the ring */}
              {FEATURES.map((feature, i) => {
                const angle = (i * 60 - 90) * (Math.PI / 180);
                const radius = 108;
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                const nodeColors = [c.primary, c.accent, c.primary, c.statAccent2, c.accent, c.primary];
                return (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 + i * 0.08 }}
                    className="absolute left-1/2 top-1/2 z-20 group/node"
                    style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                  >
                    <motion.div
                      animate={{ y: [0, i % 2 === 0 ? -3 : 3, 0] }}
                      transition={{ duration: 5 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }}
                    >
                      <div className="flex h-9 w-9 xl:h-10 xl:w-10 items-center justify-center rounded-full transition-all group-hover/node:scale-110"
                        style={{
                          background: c.nodeCard,
                          border: `1.5px solid ${c.primaryBorder}`,
                          backdropFilter: "blur(14px)",
                          boxShadow: isDark ? `0 4px 14px rgba(0,0,0,0.35), 0 0 0 3px ${c.primarySoft}` : `0 4px 14px rgba(28,25,23,0.06), 0 0 0 3px ${c.primarySoft}`,
                        }}>
                        <feature.icon className="h-4 w-4 xl:h-[18px] xl:w-[18px]" style={{ color: nodeColors[i] }} />
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-7 opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none">
                        <span className="block whitespace-nowrap rounded-md px-2 py-0.5 text-[9px] font-semibold tracking-wide"
                          style={{ fontFamily: FONT.ui, color: c.textSecondary, background: c.nodeCard, border: `1px solid ${c.border}`, boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.05)" }}>
                          {feature.label}
                        </span>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Stats running along the diagonal - as a horizontal bar at the bottom */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="pb-12"
        >
          <div
            className="flex flex-wrap justify-center gap-3"
          >
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.06, duration: 0.35 }}
                className="flex items-center gap-2.5 rounded-full px-4 py-2.5 cursor-default hover:scale-[1.04] transition-transform"
                style={{ border: `1px solid ${c.border}`, background: c.surface, backdropFilter: "blur(8px)" }}
              >
                <feature.icon className="h-3.5 w-3.5" style={{ color: c.primary }} />
                <span className="text-[11px] font-semibold" style={{ fontFamily: FONT.ui, color: c.textPrimary }}>{feature.label}</span>
                <span className="text-[10px] hidden sm:inline" style={{ color: c.textTertiary }}>{feature.desc}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c.edgeLine} 50%, transparent)` }} />
    </section>
  );
}

/* ================================================
   DESIGN PICKER
   ================================================ */

export function HeroDesignPicker(props: HeroProps) {
  const [active, setActive] = useState(1);
  const { isDark } = useTheme();
  const c = useColors(isDark);

  const designs = [
    { id: 1, name: "Marquee Editorial", Component: HeroDesign1 },
    { id: 2, name: "Organic Shapes", Component: HeroDesign2 },
    { id: 3, name: "3D Card Stack", Component: HeroDesign3 },
    { id: 4, name: "Diagonal Split", Component: HeroDesign4 },
  ];

  const ActiveComponent = designs.find((d) => d.id === active)?.Component ?? HeroDesign1;

  return (
    <div className="relative">
      {/* Floating picker */}
      <div
        className="fixed top-20 right-4 z-[9999] flex flex-col gap-1 rounded-2xl p-3 shadow-2xl"
        style={{
          background: isDark ? "rgba(12,10,9,0.95)" : "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${c.border}`,
        }}
      >
        <span className="text-[9px] font-bold tracking-[0.15em] uppercase px-2 mb-1" style={{ fontFamily: FONT.ui, color: c.textTertiary }}>
          Pick Design
        </span>
        {designs.map((d) => (
          <button
            key={d.id}
            onClick={() => setActive(d.id)}
            className="text-left px-3 py-2 rounded-lg text-[11px] font-semibold transition-all"
            style={{
              fontFamily: FONT.ui,
              background: active === d.id ? c.primarySoft : "transparent",
              color: active === d.id ? c.primary : c.textSecondary,
              border: active === d.id ? `1px solid ${c.primaryBorder}` : "1px solid transparent",
            }}
          >
            {d.id}. {d.name}
          </button>
        ))}
      </div>

      <ActiveComponent {...props} />
    </div>
  );
}
