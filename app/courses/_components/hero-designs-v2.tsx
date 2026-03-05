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
  MapPin,
  Terminal,
  Cpu,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ================================================================
   SHARED TYPES, CONSTANTS, HOOKS
   ================================================================ */

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
const FEATURES = [
  { icon: Brain, label: "AI Tutor", desc: "Personal mentor" },
  { icon: Target, label: "Goal Tracking", desc: "Stay on course" },
  { icon: Layers, label: "Adaptive Path", desc: "Learn your way" },
  { icon: GraduationCap, label: "Certificates", desc: "Earn credentials" },
  { icon: Sparkles, label: "Smart Review", desc: "Spaced repetition" },
  { icon: Compass, label: "Discovery", desc: "Explore topics" },
];

const F = {
  display: "var(--font-display, 'Playfair Display'), Georgia, serif",
  body: "var(--font-body, 'Source Serif 4'), Georgia, serif",
  ui: "var(--font-ui, 'Inter'), system-ui, sans-serif",
  mono: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
};

function useWord() {
  const [i, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((p) => (p + 1) % WORDS.length), 2800);
    return () => clearInterval(t);
  }, []);
  return { word: WORDS[i], idx: i };
}

function useSearch() {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!q.trim()) return;
      document
        .querySelector("[data-results-section]")
        ?.scrollIntoView({ behavior: "smooth" });
      const p = new URLSearchParams(window.location.search);
      p.set("q", q.trim());
      router.push(`/courses?${p.toString()}`);
    },
    [q, router],
  );
  return { q, setQ, ref, submit };
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

/* ================================================================
   DESIGN 1: MERIDIAN — Asymmetric Editorial

   Magazine-style layout with a bold vertical accent bar,
   editorial numbering, thin ruled lines, and typographic hierarchy.
   Think: opening spread of a premium print journal.
   ================================================================ */

function useMeridianColors(isDark: boolean) {
  return isDark
    ? {
        bg: "#0a0908",
        bgSub: "#110f0d",
        accent: "#e8713a",
        accentFade: "rgba(232,113,58,0.12)",
        text: "rgba(255,255,255,0.9)",
        textSub: "rgba(255,255,255,0.45)",
        textMuted: "rgba(255,255,255,0.2)",
        surface: "rgba(255,255,255,0.04)",
        border: "rgba(255,255,255,0.06)",
        rule: "rgba(255,255,255,0.04)",
        searchBg: "rgba(255,255,255,0.03)",
        btnBg: "#e8713a",
        btnShadow: "0 6px 24px rgba(232,113,58,0.2)",
        statColor2: "#60a5fa",
        statColor3: "#f472b6",
      }
    : {
        bg: "#faf8f5",
        bgSub: "#f5f0e8",
        accent: "#c2553d",
        accentFade: "rgba(194,85,61,0.08)",
        text: "#1a1714",
        textSub: "#8a7e72",
        textMuted: "#bdb3a6",
        surface: "rgba(255,255,255,0.7)",
        border: "rgba(26,23,20,0.08)",
        rule: "rgba(26,23,20,0.05)",
        searchBg: "rgba(255,255,255,0.85)",
        btnBg: "#c2553d",
        btnShadow: "0 6px 24px rgba(194,85,61,0.2)",
        statColor2: "#1d4ed8",
        statColor3: "#be185d",
      };
}

export function HeroMeridian({ statistics, userId }: HeroProps) {
  const { word, idx } = useWord();
  const { q, setQ, ref, submit } = useSearch();
  const { isDark } = useTheme();
  const c = useMeridianColors(isDark);

  return (
    <section className="relative overflow-hidden min-h-[90vh]" style={{ background: c.bg }}>
      {/* Ruled lines background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px"
            style={{ top: `${(i + 1) * 7}%`, background: c.rule }}
          />
        ))}
      </div>

      {/* Vertical accent bar */}
      <div
        className="absolute left-6 sm:left-10 lg:left-16 top-0 bottom-0 w-[3px]"
        style={{ background: `linear-gradient(180deg, transparent, ${c.accent} 20%, ${c.accent} 80%, transparent)` }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="pl-10 sm:pl-16 lg:pl-24 pt-24 sm:pt-32 lg:pt-36 pb-12 max-w-[780px]"
        >
          {/* Editorial number + eyebrow */}
          <motion.div variants={fadeUp} className="flex items-baseline gap-6 mb-10">
            <span
              className="text-[4rem] sm:text-[5rem] font-light leading-none tracking-tight"
              style={{ fontFamily: F.display, color: c.accent, opacity: 0.25 }}
            >
              01
            </span>
            <div>
              <span
                className="text-[10px] font-semibold tracking-[0.2em] uppercase"
                style={{ fontFamily: F.ui, color: c.accent }}
              >
                Course Catalog
              </span>
              <div className="w-12 h-px mt-2" style={{ background: c.accent }} />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div variants={fadeUp}>
            <h1>
              <span
                className="block text-[4rem] sm:text-[5.5rem] md:text-[7rem] lg:text-[8rem] font-bold leading-[0.85] tracking-[-0.04em]"
                style={{ fontFamily: F.display, color: c.text }}
              >
                Learn
              </span>
              <span className="relative block mt-2">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="block text-[3.5rem] sm:text-[5rem] md:text-[6.5rem] lg:text-[7.5rem] font-bold leading-[0.85] tracking-[-0.04em]"
                    style={{ fontFamily: F.display, color: c.accent, fontStyle: "italic" }}
                  >
                    {word}
                    <motion.span
                      className="absolute -bottom-2 left-0 h-[2px]"
                      style={{ background: c.accent }}
                      initial={{ width: 0 }}
                      animate={{ width: "60%" }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                      key={`line-${idx}`}
                    />
                  </motion.span>
                </AnimatePresence>
                <span
                  className="invisible block text-[3.5rem] sm:text-[5rem] md:text-[6.5rem] lg:text-[7.5rem] font-bold italic leading-[0.85]"
                  style={{ fontFamily: F.display }}
                  aria-hidden
                >
                  Brilliantly
                </span>
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="mt-6 text-base sm:text-lg leading-relaxed max-w-[480px]"
            style={{ fontFamily: F.body, color: c.textSub }}
          >
            Expert-crafted courses with an AI mentor that maps your gaps
            and builds a learning path designed for{" "}
            <em style={{ color: c.text }}>you</em>.
          </motion.p>

          {/* Search */}
          <motion.div variants={fadeUp} className="mt-8">
            <form onSubmit={submit} className="relative max-w-[500px]">
              <div
                className="flex items-center rounded-lg overflow-hidden"
                style={{
                  border: `1px solid ${c.border}`,
                  background: c.searchBg,
                  backdropFilter: "blur(12px)",
                }}
              >
                <Search className="ml-4 h-4 w-4 flex-shrink-0" style={{ color: c.textMuted }} />
                <input
                  ref={ref}
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search courses, topics, skills..."
                  className="flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:opacity-40"
                  style={{ fontFamily: F.body, color: c.text }}
                />
                <button
                  type="submit"
                  className="mr-2 h-8 w-8 rounded-md flex items-center justify-center transition-transform active:scale-95"
                  style={{ background: c.btnBg }}
                >
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </form>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-medium tracking-[0.12em] uppercase" style={{ fontFamily: F.ui, color: c.textMuted }}>
                Trending
              </span>
              {TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setQ(t); ref.current?.focus(); }}
                  className="rounded-full px-2.5 py-1 text-[11px] transition-colors"
                  style={{ border: `1px solid ${c.border}`, color: c.textSub, fontFamily: F.ui }}
                >
                  {t}
                </button>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp} className="mt-8 flex items-center gap-5">
            <Button
              size="lg"
              className="rounded-lg px-6 py-5 text-sm font-semibold tracking-wide"
              style={{ background: c.btnBg, color: "#fff", fontFamily: F.ui, boxShadow: c.btnShadow }}
              asChild
            >
              <Link href={userId ? "/dashboard/user" : "/auth/register"}>
                {userId ? "Dashboard" : "Start Learning"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <button
              type="button"
              onClick={() => document.getElementById("main-content")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-2 text-[13px]"
              style={{ color: c.textSub, fontFamily: F.ui }}
            >
              <ChevronDown className="h-4 w-4" />
              Browse catalog
            </button>
          </motion.div>

          {/* Stats — editorial em-dash style */}
          <motion.div variants={fadeUp} className="mt-10 pt-6 flex items-center gap-6 sm:gap-10" style={{ borderTop: `1px solid ${c.border}` }}>
            {[
              { v: statistics.totalCourses > 0 ? `${statistics.totalCourses}` : "0", l: "Courses", color: c.accent },
              { v: statistics.totalEnrollments > 0 ? statistics.totalEnrollments.toLocaleString() : "0", l: "Learners", color: c.statColor2 },
              { v: statistics.averageRating > 0 ? statistics.averageRating.toFixed(1) : "--", l: "Rating", color: c.statColor3 },
            ].map((s, i) => (
              <div key={s.l} className="flex items-baseline gap-2">
                {i > 0 && <span className="text-lg" style={{ color: c.textMuted }}>&mdash;</span>}
                <span className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: F.display, color: s.color }}>
                  {s.v}
                </span>
                <span className="text-[10px] font-medium tracking-[0.12em] uppercase" style={{ fontFamily: F.ui, color: c.textSub }}>
                  {s.l}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Feature strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="pl-10 sm:pl-16 lg:pl-24 pb-10 flex flex-wrap gap-2.5"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.06 }}
              className="flex items-center gap-2 rounded-full px-3.5 py-2 cursor-default"
              style={{ border: `1px solid ${c.border}`, background: c.surface }}
            >
              <f.icon className="h-3.5 w-3.5" style={{ color: c.accent }} />
              <span className="text-[11px] font-semibold" style={{ fontFamily: F.ui, color: c.text }}>{f.label}</span>
              <span className="text-[10px] hidden sm:inline" style={{ color: c.textSub }}>{f.desc}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c.accent}40 50%, transparent)` }} />
    </section>
  );
}


/* ================================================================
   DESIGN 2: TOPOGRAPH — Cartographic Exploration

   Topographic contour lines as background, waypoint markers,
   coordinate-style notations, compass references.
   Think: beautiful cartographic map meets knowledge terrain.
   ================================================================ */

function useTopoColors(isDark: boolean) {
  return isDark
    ? {
        bg: "linear-gradient(170deg, #0c1929 0%, #0f1f33 40%, #0c1929 100%)",
        contour: "rgba(78,205,196,0.06)",
        contourStrong: "rgba(78,205,196,0.12)",
        accent: "#4ecdc4",
        accentFade: "rgba(78,205,196,0.1)",
        warm: "#daa520",
        warmFade: "rgba(218,165,32,0.1)",
        text: "rgba(255,255,255,0.9)",
        textSub: "rgba(255,255,255,0.45)",
        textMuted: "rgba(255,255,255,0.2)",
        surface: "rgba(255,255,255,0.04)",
        border: "rgba(255,255,255,0.07)",
        searchBg: "rgba(12,25,41,0.7)",
        dotColor: "#4ecdc4",
      }
    : {
        bg: "linear-gradient(170deg, #f5f0e6 0%, #ede5d5 40%, #f5f0e6 100%)",
        contour: "rgba(45,95,138,0.06)",
        contourStrong: "rgba(45,95,138,0.12)",
        accent: "#2d5f8a",
        accentFade: "rgba(45,95,138,0.07)",
        warm: "#b87333",
        warmFade: "rgba(184,115,51,0.07)",
        text: "#1c1510",
        textSub: "#7a6e5f",
        textMuted: "#b5a996",
        surface: "rgba(255,255,255,0.6)",
        border: "rgba(28,21,16,0.08)",
        searchBg: "rgba(255,255,255,0.75)",
        dotColor: "#2d5f8a",
      };
}

function TopoContours({ c }: { c: ReturnType<typeof useTopoColors> }) {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {/* Major contour lines */}
      <path d="M-100,400 Q200,200 600,350 T1300,300" stroke={c.contourStrong} strokeWidth="1.5" fill="none" />
      <path d="M-100,500 Q300,300 650,420 T1300,380" stroke={c.contour} strokeWidth="1" fill="none" />
      <path d="M-100,320 Q150,150 550,280 T1300,220" stroke={c.contour} strokeWidth="1" fill="none" />
      <path d="M-100,600 Q400,400 700,520 T1300,460" stroke={c.contour} strokeWidth="1" fill="none" />
      <path d="M-100,250 Q100,100 500,200 T1300,150" stroke={c.contourStrong} strokeWidth="1.5" fill="none" />
      <path d="M-100,700 Q350,500 750,620 T1300,550" stroke={c.contour} strokeWidth="0.8" fill="none" />
      {/* Minor contours */}
      <path d="M-100,450 Q250,250 620,380 T1300,340" stroke={c.contour} strokeWidth="0.5" fill="none" strokeDasharray="6 12" />
      <path d="M-100,550 Q350,350 680,470 T1300,420" stroke={c.contour} strokeWidth="0.5" fill="none" strokeDasharray="6 12" />
      {/* Elevation markers */}
      <circle cx="300" cy="280" r="2.5" fill={c.dotColor} opacity="0.3" />
      <circle cx="700" cy="400" r="2.5" fill={c.dotColor} opacity="0.3" />
      <circle cx="1000" cy="300" r="2.5" fill={c.dotColor} opacity="0.3" />
      <circle cx="500" cy="500" r="2" fill={c.dotColor} opacity="0.2" />
    </svg>
  );
}

export function HeroTopograph({ statistics, userId }: HeroProps) {
  const { word, idx } = useWord();
  const { q, setQ, ref, submit } = useSearch();
  const { isDark } = useTheme();
  const c = useTopoColors(isDark);

  return (
    <section className="relative overflow-hidden min-h-[90vh]" style={{ background: c.bg }}>
      <TopoContours c={c} />

      {/* Coordinate notation - top right */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-10" aria-hidden>
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3" style={{ color: c.accent }} />
          <span className="text-[10px] tracking-[0.15em]" style={{ fontFamily: F.mono, color: c.textMuted }}>
            47.3769&deg;N &middot; 8.5417&deg;E
          </span>
        </div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid lg:grid-cols-[1fr_340px] gap-12 lg:gap-20 items-center pt-24 sm:pt-32 lg:pt-36 pb-8"
        >
          {/* Left content */}
          <div className="max-w-[620px] space-y-5">
            {/* Eyebrow */}
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5" style={{ background: c.accentFade, border: `1px solid ${c.accent}20` }}>
                <Compass className="h-3.5 w-3.5" style={{ color: c.accent }} />
                <span className="text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ fontFamily: F.ui, color: c.accent }}>
                  Explore the Knowledge Terrain
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div variants={fadeUp}>
              <h1>
                <span
                  className="block text-[3.5rem] sm:text-[4.5rem] md:text-[5.5rem] lg:text-[6.5rem] font-bold leading-[0.88] tracking-[-0.03em]"
                  style={{ fontFamily: F.display, color: c.text }}
                >
                  Navigate
                </span>
                <span className="relative block mt-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                      transition={{ duration: 0.45 }}
                      className="block text-[3rem] sm:text-[4rem] md:text-[5rem] lg:text-[6rem] font-bold leading-[0.88] tracking-[-0.03em]"
                      style={{ fontFamily: F.display, color: c.warm, fontStyle: "italic" }}
                    >
                      {word}
                    </motion.span>
                  </AnimatePresence>
                  <span className="invisible block text-[3rem] sm:text-[4rem] md:text-[5rem] lg:text-[6rem] font-bold italic leading-[0.88]" style={{ fontFamily: F.display }} aria-hidden>
                    Brilliantly
                  </span>
                </span>
              </h1>
            </motion.div>

            <motion.p variants={fadeUp} className="text-[15px] sm:text-base leading-[1.8] max-w-[460px]" style={{ fontFamily: F.body, color: c.textSub }}>
              Chart your course through expert-crafted curriculum. Our AI mentor maps your knowledge terrain and guides you to mastery.
            </motion.p>

            {/* Search */}
            <motion.div variants={fadeUp}>
              <form onSubmit={submit} className="relative max-w-[500px]">
                <div
                  className="flex items-center rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${c.border}`, background: c.searchBg, backdropFilter: "blur(16px)" }}
                >
                  <Search className="ml-4 h-4 w-4 flex-shrink-0" style={{ color: c.textMuted }} />
                  <input
                    ref={ref} type="text" value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder="Search courses, topics, skills..."
                    className="flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:opacity-40"
                    style={{ fontFamily: F.body, color: c.text }}
                  />
                  <button type="submit" className="mr-2 h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: c.accent }}>
                    <ArrowRight className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              </form>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] tracking-[0.12em] uppercase" style={{ fontFamily: F.ui, color: c.textMuted }}>Waypoints</span>
                {TAGS.map((t) => (
                  <button key={t} type="button" onClick={() => { setQ(t); ref.current?.focus(); }}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]"
                    style={{ border: `1px solid ${c.border}`, color: c.textSub, fontFamily: F.ui }}
                  >
                    <span className="w-1 h-1 rounded-full" style={{ background: c.accent }} />
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div variants={fadeUp} className="flex items-center gap-4 pt-2">
              <Button size="lg" className="rounded-xl px-6 py-5 text-sm font-semibold" style={{ background: c.accent, color: "#fff", fontFamily: F.ui }} asChild>
                <Link href={userId ? "/dashboard/user" : "/auth/register"}>
                  {userId ? "Dashboard" : "Begin Expedition"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <button type="button" onClick={() => document.getElementById("main-content")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-2 text-[13px]" style={{ color: c.textSub, fontFamily: F.ui }}
              >
                <ChevronDown className="h-4 w-4" /> Browse terrain
              </button>
            </motion.div>
          </div>

          {/* Right — Waypoint Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="hidden lg:block"
          >
            <div className="space-y-5">
              {[
                { v: statistics.totalCourses > 0 ? `${statistics.totalCourses}` : "0", l: "COURSES", sub: "Available routes", color: c.accent },
                { v: statistics.totalEnrollments > 0 ? statistics.totalEnrollments.toLocaleString() : "0", l: "EXPLORERS", sub: "Active learners", color: c.warm },
                { v: statistics.averageRating > 0 ? statistics.averageRating.toFixed(1) : "--", l: "ELEVATION", sub: "Avg. rating", color: c.accent },
              ].map((s, i) => (
                <motion.div
                  key={s.l}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.12 }}
                  className="flex items-start gap-4 p-4 rounded-xl"
                  style={{ background: c.surface, border: `1px solid ${c.border}`, backdropFilter: "blur(8px)" }}
                >
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    <div className="w-px h-8" style={{ background: c.border }} />
                  </div>
                  <div>
                    <span className="text-3xl font-bold tracking-tight" style={{ fontFamily: F.display, color: s.color }}>{s.v}</span>
                    <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mt-0.5" style={{ fontFamily: F.ui, color: c.text }}>{s.l}</p>
                    <p className="text-[11px] mt-0.5" style={{ fontFamily: F.body, color: c.textSub }}>{s.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Feature strip */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="pb-10 flex flex-wrap justify-center gap-2.5">
          {FEATURES.map((f, i) => (
            <motion.div key={f.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 + i * 0.06 }}
              className="flex items-center gap-2 rounded-full px-3.5 py-2 cursor-default"
              style={{ border: `1px solid ${c.border}`, background: c.surface, backdropFilter: "blur(8px)" }}
            >
              <f.icon className="h-3.5 w-3.5" style={{ color: c.accent }} />
              <span className="text-[11px] font-semibold" style={{ fontFamily: F.ui, color: c.text }}>{f.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c.accent}30 50%, transparent)` }} />
    </section>
  );
}


/* ================================================================
   DESIGN 3: MONOLITH — Brutalist Minimal

   Viewport-filling massive typography. Near-empty background.
   Single accent line. Extreme whitespace. Pure confidence.
   Think: the power of restraint, every pixel intentional.
   ================================================================ */

function useMonolithColors(isDark: boolean) {
  return isDark
    ? {
        bg: "#000000",
        text: "#ffffff",
        textSub: "rgba(255,255,255,0.4)",
        textMuted: "rgba(255,255,255,0.15)",
        accent: "#ff3b30",
        border: "rgba(255,255,255,0.08)",
        surface: "rgba(255,255,255,0.03)",
        searchBg: "rgba(255,255,255,0.04)",
      }
    : {
        bg: "#ffffff",
        text: "#000000",
        textSub: "rgba(0,0,0,0.4)",
        textMuted: "rgba(0,0,0,0.12)",
        accent: "#ff3b30",
        border: "rgba(0,0,0,0.08)",
        surface: "rgba(0,0,0,0.02)",
        searchBg: "rgba(0,0,0,0.03)",
      };
}

export function HeroMonolith({ statistics, userId }: HeroProps) {
  const { word, idx } = useWord();
  const { q, setQ, ref, submit } = useSearch();
  const { isDark } = useTheme();
  const c = useMonolithColors(isDark);

  return (
    <section className="relative overflow-hidden min-h-[92vh] flex flex-col justify-center" style={{ background: c.bg }}>
      {/* Single accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: c.accent }} aria-hidden />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-[1100px] mx-auto">
          {/* Massive headline */}
          <motion.div variants={fadeUp}>
            <h1 className="text-center">
              <span
                className="block text-[15vw] sm:text-[12vw] md:text-[10vw] lg:text-[9vw] font-bold leading-[0.82] tracking-[-0.06em]"
                style={{ fontFamily: F.display, color: c.text }}
              >
                Learn
              </span>
              <span className="relative block">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="block text-[13vw] sm:text-[10vw] md:text-[8.5vw] lg:text-[7.5vw] font-bold leading-[0.82] tracking-[-0.06em]"
                    style={{ fontFamily: F.display, color: c.accent }}
                  >
                    {word}
                  </motion.span>
                </AnimatePresence>
                <span
                  className="invisible block text-[13vw] sm:text-[10vw] md:text-[8.5vw] lg:text-[7.5vw] font-bold leading-[0.82]"
                  style={{ fontFamily: F.display }}
                  aria-hidden
                >
                  Brilliantly
                </span>
              </span>
            </h1>
          </motion.div>

          {/* Thin divider */}
          <motion.div variants={fadeUp} className="flex justify-center mt-10 mb-8">
            <div className="w-16 h-px" style={{ background: c.border }} />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="text-center text-base sm:text-lg leading-relaxed max-w-[420px] mx-auto"
            style={{ fontFamily: F.body, color: c.textSub }}
          >
            Courses that adapt to how you think,
            powered by an AI mentor built for <em style={{ color: c.text }}>you</em>.
          </motion.p>

          {/* Search — centered, clean */}
          <motion.div variants={fadeUp} className="mt-8 max-w-[480px] mx-auto">
            <form onSubmit={submit}>
              <div
                className="flex items-center rounded-lg overflow-hidden"
                style={{ border: `1px solid ${c.border}`, background: c.searchBg }}
              >
                <Search className="ml-4 h-4 w-4" style={{ color: c.textMuted }} />
                <input
                  ref={ref} type="text" value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Search courses..."
                  className="flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:opacity-30"
                  style={{ fontFamily: F.body, color: c.text }}
                />
                <button type="submit" className="mr-2 h-8 w-8 rounded flex items-center justify-center" style={{ background: c.accent }}>
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </form>
            <div className="mt-3 flex justify-center gap-2 flex-wrap">
              {TAGS.map((t) => (
                <button key={t} type="button" onClick={() => { setQ(t); ref.current?.focus(); }}
                  className="text-[11px] px-2.5 py-1 rounded-full transition-colors"
                  style={{ border: `1px solid ${c.border}`, color: c.textSub, fontFamily: F.ui }}
                >
                  {t}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stats — minimal row */}
          <motion.div variants={fadeUp} className="mt-12 flex justify-center gap-12 sm:gap-16">
            {[
              { v: statistics.totalCourses > 0 ? `${statistics.totalCourses}` : "0", l: "Courses" },
              { v: statistics.totalEnrollments > 0 ? statistics.totalEnrollments.toLocaleString() : "0", l: "Learners" },
              { v: statistics.averageRating > 0 ? statistics.averageRating.toFixed(1) : "--", l: "Rating" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <span className="block text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: F.display, color: c.text }}>{s.v}</span>
                <span className="block mt-1 text-[10px] font-medium tracking-[0.15em] uppercase" style={{ fontFamily: F.ui, color: c.textMuted }}>{s.l}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp} className="mt-10 flex justify-center">
            <Button
              size="lg"
              className="rounded-lg px-8 py-5 text-sm font-semibold tracking-wide"
              style={{ background: c.accent, color: "#fff", fontFamily: F.ui }}
              asChild
            >
              <Link href={userId ? "/dashboard/user" : "/auth/register"}>
                {userId ? "Dashboard" : "Start Learning"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Features — ultra minimal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-14 flex flex-wrap justify-center gap-6"
          >
            {FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-1.5 cursor-default">
                <f.icon className="h-3 w-3" style={{ color: c.textMuted }} />
                <span className="text-[11px]" style={{ fontFamily: F.ui, color: c.textSub }}>{f.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: c.accent }} aria-hidden />
    </section>
  );
}


/* ================================================================
   DESIGN 4: AURORA — Organic Flowing Gradients

   Animated gradient mesh blobs, frosted glass content card,
   soft organic shapes, dreamy color palette.
   Think: northern lights meets crystalline glass UI.
   ================================================================ */

function useAuroraColors(isDark: boolean) {
  return isDark
    ? {
        bg: "#0a0118",
        text: "rgba(255,255,255,0.92)",
        textSub: "rgba(255,255,255,0.5)",
        textMuted: "rgba(255,255,255,0.22)",
        accent: "#a855f7",
        accentAlt: "#ec4899",
        teal: "#14b8a6",
        surface: "rgba(255,255,255,0.05)",
        glass: "rgba(255,255,255,0.04)",
        glassBorder: "rgba(255,255,255,0.08)",
        border: "rgba(255,255,255,0.06)",
        blob1: "rgba(168,85,247,0.15)",
        blob2: "rgba(236,72,153,0.12)",
        blob3: "rgba(20,184,166,0.1)",
        searchBg: "rgba(255,255,255,0.05)",
        btnBg: "linear-gradient(135deg, #a855f7, #ec4899)",
        btnShadow: "0 8px 30px rgba(168,85,247,0.25)",
      }
    : {
        bg: "#f8f5ff",
        text: "#1a0e2e",
        textSub: "#7c6b94",
        textMuted: "#b5a8c8",
        accent: "#7c3aed",
        accentAlt: "#db2777",
        teal: "#0d9488",
        surface: "rgba(255,255,255,0.7)",
        glass: "rgba(255,255,255,0.6)",
        glassBorder: "rgba(124,58,237,0.1)",
        border: "rgba(26,14,46,0.07)",
        blob1: "rgba(124,58,237,0.08)",
        blob2: "rgba(219,39,119,0.06)",
        blob3: "rgba(13,148,136,0.06)",
        searchBg: "rgba(255,255,255,0.8)",
        btnBg: "linear-gradient(135deg, #7c3aed, #db2777)",
        btnShadow: "0 8px 30px rgba(124,58,237,0.2)",
      };
}

function AuroraBlobs({ c }: { c: ReturnType<typeof useAuroraColors> }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <motion.div
        animate={{ x: [0, 60, -30, 0], y: [0, -40, 20, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[10%] right-[10%] w-[500px] h-[500px] rounded-full blur-[100px]"
        style={{ background: c.blob1 }}
      />
      <motion.div
        animate={{ x: [0, -50, 40, 0], y: [0, 30, -50, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] -left-[5%] w-[400px] h-[400px] rounded-full blur-[90px]"
        style={{ background: c.blob2 }}
      />
      <motion.div
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 40, 0], scale: [1, 1.1, 0.9, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[5%] right-[20%] w-[350px] h-[350px] rounded-full blur-[80px]"
        style={{ background: c.blob3 }}
      />
    </div>
  );
}

export function HeroAurora({ statistics, userId }: HeroProps) {
  const { word, idx } = useWord();
  const { q, setQ, ref, submit } = useSearch();
  const { isDark } = useTheme();
  const c = useAuroraColors(isDark);

  return (
    <section className="relative overflow-hidden min-h-[92vh]" style={{ background: c.bg }}>
      <AuroraBlobs c={c} />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 lg:pt-32 pb-10">
        {/* Main glass card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[720px] mx-auto rounded-3xl p-8 sm:p-10 lg:p-12"
          style={{
            background: c.glass,
            border: `1px solid ${c.glassBorder}`,
            backdropFilter: "blur(40px) saturate(1.3)",
            boxShadow: `0 20px 80px ${isDark ? "rgba(0,0,0,0.4)" : "rgba(124,58,237,0.06)"}`,
          }}
        >
          <motion.div variants={stagger} initial="hidden" animate="show">
            {/* Eyebrow */}
            <motion.div variants={fadeUp} className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5" style={{ background: `${c.accent}12`, border: `1px solid ${c.accent}20` }}>
                <Sparkles className="h-3.5 w-3.5" style={{ color: c.accent }} />
                <span className="text-[10px] font-semibold tracking-[0.12em] uppercase" style={{ fontFamily: F.ui, color: c.accent }}>
                  AI-Powered Learning
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div variants={fadeUp}>
              <h1 className="text-center">
                <span
                  className="block text-[3.5rem] sm:text-[4.5rem] md:text-[5.5rem] font-bold leading-[0.88] tracking-[-0.04em]"
                  style={{ fontFamily: F.display, color: c.text }}
                >
                  Learn
                </span>
                <span className="relative block mt-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
                      transition={{ duration: 0.45 }}
                      className="block text-[3rem] sm:text-[4rem] md:text-[5rem] font-bold leading-[0.88] tracking-[-0.04em]"
                      style={{
                        fontFamily: F.display,
                        fontStyle: "italic",
                        background: c.btnBg,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {word}
                    </motion.span>
                  </AnimatePresence>
                  <span className="invisible block text-[3rem] sm:text-[4rem] md:text-[5rem] font-bold italic leading-[0.88]" style={{ fontFamily: F.display }} aria-hidden>
                    Brilliantly
                  </span>
                </span>
                <span className="block mt-3 text-base sm:text-lg leading-relaxed" style={{ fontFamily: F.body, color: c.textSub }}>
                  Courses that adapt to how you think
                </span>
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p variants={fadeUp} className="text-center text-[15px] leading-[1.7] max-w-[440px] mx-auto mt-4" style={{ fontFamily: F.body, color: c.textSub }}>
              Taxomind pairs expert curriculum with an AI mentor
              that maps your gaps and builds a path for{" "}
              <em style={{ color: c.text }}>you</em>.
            </motion.p>

            {/* Search */}
            <motion.div variants={fadeUp} className="mt-7 max-w-[480px] mx-auto">
              <form onSubmit={submit}>
                <div className="flex items-center rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.glassBorder}`, background: c.searchBg, backdropFilter: "blur(12px)" }}>
                  <Search className="ml-4 h-4 w-4" style={{ color: c.textMuted }} />
                  <input ref={ref} type="text" value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder="Search courses, topics, skills..."
                    className="flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:opacity-35"
                    style={{ fontFamily: F.body, color: c.text }}
                  />
                  <button type="submit" className="mr-2 h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: c.btnBg }}>
                    <ArrowRight className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              </form>
              <div className="mt-3 flex justify-center gap-2 flex-wrap">
                <span className="text-[10px] tracking-[0.1em] uppercase" style={{ fontFamily: F.ui, color: c.textMuted }}>Trending</span>
                {TAGS.map((t) => (
                  <button key={t} type="button" onClick={() => { setQ(t); ref.current?.focus(); }}
                    className="text-[11px] rounded-full px-2.5 py-1"
                    style={{ border: `1px solid ${c.border}`, color: c.textSub, fontFamily: F.ui }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div variants={fadeUp} className="mt-7 flex justify-center gap-4">
              <Button size="lg" className="rounded-2xl px-7 py-5 text-sm font-semibold"
                style={{ background: c.btnBg, color: "#fff", fontFamily: F.ui, boxShadow: c.btnShadow }}
                asChild
              >
                <Link href={userId ? "/dashboard/user" : "/auth/register"}>
                  {userId ? "Dashboard" : "Start Learning"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <button type="button" onClick={() => document.getElementById("main-content")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-2 text-[13px] px-4 py-2 rounded-2xl"
                style={{ color: c.textSub, fontFamily: F.ui, border: `1px solid ${c.border}` }}
              >
                <ChevronDown className="h-4 w-4" /> Browse
              </button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Floating stat cards */}
        <div className="mt-8 flex justify-center gap-4 sm:gap-6 flex-wrap">
          {[
            { v: statistics.totalCourses > 0 ? `${statistics.totalCourses}` : "0", l: "Courses", color: c.accent },
            { v: statistics.totalEnrollments > 0 ? statistics.totalEnrollments.toLocaleString() : "0", l: "Learners", color: c.accentAlt },
            { v: statistics.averageRating > 0 ? statistics.averageRating.toFixed(1) : "--", l: "Rating", color: c.teal },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="px-6 py-4 rounded-2xl text-center min-w-[110px]"
              style={{ background: c.glass, border: `1px solid ${c.glassBorder}`, backdropFilter: "blur(20px)" }}
            >
              <span className="block text-2xl font-bold tracking-tight" style={{ fontFamily: F.display, color: s.color }}>{s.v}</span>
              <span className="block mt-0.5 text-[10px] font-medium tracking-[0.1em] uppercase" style={{ fontFamily: F.ui, color: c.textSub }}>{s.l}</span>
            </motion.div>
          ))}
        </div>

        {/* Feature strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-8 pb-6 flex flex-wrap justify-center gap-2.5">
          {FEATURES.map((f, i) => (
            <motion.div key={f.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 + i * 0.05 }}
              className="flex items-center gap-2 rounded-full px-3.5 py-2"
              style={{ border: `1px solid ${c.border}`, background: c.surface, backdropFilter: "blur(8px)" }}
            >
              <f.icon className="h-3.5 w-3.5" style={{ color: c.accent }} />
              <span className="text-[11px] font-semibold" style={{ fontFamily: F.ui, color: c.text }}>{f.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}


/* ================================================================
   DESIGN 5: CIRCUIT — Technical Blueprint

   PCB circuit board pattern, monospace labels, LED-dot indicators,
   "power-on" sequential animations, data readout aesthetic.
   Think: engineering control room meets precision learning.
   ================================================================ */

function useCircuitColors(isDark: boolean) {
  return isDark
    ? {
        bg: "#050d05",
        bgGrid: "rgba(0,255,65,0.03)",
        accent: "#00ff41",
        accentDim: "rgba(0,255,65,0.5)",
        accentFade: "rgba(0,255,65,0.08)",
        warm: "#fbbf24",
        warmFade: "rgba(251,191,36,0.1)",
        text: "rgba(0,255,65,0.9)",
        textLabel: "rgba(0,255,65,0.6)",
        textSub: "rgba(255,255,255,0.45)",
        textMuted: "rgba(0,255,65,0.2)",
        surface: "rgba(0,255,65,0.03)",
        border: "rgba(0,255,65,0.1)",
        searchBg: "rgba(0,10,0,0.6)",
        trace: "rgba(0,255,65,0.06)",
        led: "#00ff41",
        ledOff: "rgba(0,255,65,0.15)",
      }
    : {
        bg: "#f0f5f0",
        bgGrid: "rgba(0,80,30,0.04)",
        accent: "#166534",
        accentDim: "rgba(22,101,52,0.6)",
        accentFade: "rgba(22,101,52,0.06)",
        warm: "#b45309",
        warmFade: "rgba(180,83,9,0.06)",
        text: "#0f3d1c",
        textLabel: "rgba(22,101,52,0.7)",
        textSub: "#5a7a64",
        textMuted: "rgba(22,101,52,0.25)",
        surface: "rgba(22,101,52,0.04)",
        border: "rgba(22,101,52,0.12)",
        searchBg: "rgba(255,255,255,0.8)",
        trace: "rgba(22,101,52,0.06)",
        led: "#166534",
        ledOff: "rgba(22,101,52,0.2)",
      };
}

function CircuitGrid({ c }: { c: ReturnType<typeof useCircuitColors> }) {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${c.bgGrid} 1px, transparent 1px),
            linear-gradient(90deg, ${c.bgGrid} 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      {/* Circuit traces */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" fill="none" preserveAspectRatio="xMidYMid slice">
        {/* Horizontal traces */}
        <line x1="0" y1="200" x2="300" y2="200" stroke={c.trace} strokeWidth="2" />
        <line x1="300" y1="200" x2="320" y2="240" stroke={c.trace} strokeWidth="2" />
        <line x1="320" y1="240" x2="600" y2="240" stroke={c.trace} strokeWidth="2" />
        <line x1="800" y1="400" x2="1200" y2="400" stroke={c.trace} strokeWidth="2" />
        <line x1="900" y1="560" x2="1200" y2="560" stroke={c.trace} strokeWidth="2" />
        {/* Vertical traces */}
        <line x1="400" y1="0" x2="400" y2="180" stroke={c.trace} strokeWidth="1.5" />
        <line x1="1000" y1="300" x2="1000" y2="600" stroke={c.trace} strokeWidth="1.5" />
        {/* Nodes */}
        <circle cx="300" cy="200" r="4" fill={c.trace} />
        <circle cx="600" cy="240" r="4" fill={c.trace} />
        <circle cx="400" cy="180" r="3" fill={c.trace} />
        <circle cx="1000" cy="400" r="4" fill={c.trace} />
        {/* Pads */}
        <rect x="795" y="395" width="10" height="10" rx="1" fill="none" stroke={c.trace} strokeWidth="1" />
        <rect x="895" y="555" width="10" height="10" rx="1" fill="none" stroke={c.trace} strokeWidth="1" />
      </svg>
    </div>
  );
}

export function HeroCircuit({ statistics, userId }: HeroProps) {
  const { word, idx } = useWord();
  const { q, setQ, ref, submit } = useSearch();
  const { isDark } = useTheme();
  const c = useCircuitColors(isDark);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative overflow-hidden min-h-[90vh]" style={{ background: c.bg }}>
      <CircuitGrid c={c} />

      {/* System label top-left */}
      <div className="absolute top-5 left-5 sm:top-7 sm:left-7 z-10" aria-hidden>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <motion.div
            animate={{ opacity: booted ? [0.4, 1, 0.4] : 0.2 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full"
            style={{ background: c.led }}
          />
          <span className="text-[10px] tracking-[0.2em] uppercase" style={{ fontFamily: F.mono, color: c.textLabel }}>
            SYS.TAXOMIND v2.0
          </span>
        </motion.div>
      </div>

      {/* Status readout top-right */}
      <div className="absolute top-5 right-5 sm:top-7 sm:right-7 z-10" aria-hidden>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex items-center gap-3"
        >
          <div className="flex items-center gap-1.5">
            <Activity className="h-3 w-3" style={{ color: c.accentDim }} />
            <span className="text-[10px]" style={{ fontFamily: F.mono, color: c.textLabel }}>ONLINE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3 w-3" style={{ color: c.accentDim }} />
            <span className="text-[10px]" style={{ fontFamily: F.mono, color: c.textLabel }}>SAM.AI</span>
          </div>
        </motion.div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid lg:grid-cols-[1fr_300px] gap-10 lg:gap-16 items-center pt-24 sm:pt-32 lg:pt-36 pb-8"
        >
          {/* Left content */}
          <div className="max-w-[640px]">
            {/* Terminal label */}
            <motion.div variants={fadeUp} className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded" style={{ background: c.accentFade, border: `1px solid ${c.border}` }}>
                <Terminal className="h-3 w-3" style={{ color: c.accent }} />
                <span className="text-[10px] font-medium tracking-[0.15em] uppercase" style={{ fontFamily: F.mono, color: c.textLabel }}>
                  COURSE_CATALOG.INIT
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div variants={fadeUp}>
              <h1>
                <span
                  className="block text-[3.5rem] sm:text-[5rem] md:text-[6rem] lg:text-[7rem] font-bold leading-[0.85] tracking-[-0.04em]"
                  style={{ fontFamily: F.display, color: isDark ? "rgba(255,255,255,0.92)" : c.text }}
                >
                  Learn
                </span>
                <span className="relative block mt-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, filter: "blur(4px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, filter: "blur(4px)" }}
                      transition={{ duration: 0.35 }}
                      className="block text-[3rem] sm:text-[4.5rem] md:text-[5.5rem] lg:text-[6.5rem] font-bold leading-[0.85] tracking-[-0.04em]"
                      style={{ fontFamily: F.display, color: c.accent }}
                    >
                      {word}
                      <motion.span
                        className="inline-block w-[3px] h-[0.8em] ml-2 align-middle"
                        style={{ background: c.accent }}
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    </motion.span>
                  </AnimatePresence>
                  <span className="invisible block text-[3rem] sm:text-[4.5rem] md:text-[5.5rem] lg:text-[6.5rem] font-bold leading-[0.85]" style={{ fontFamily: F.display }} aria-hidden>
                    Brilliantly
                  </span>
                </span>
              </h1>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-5 text-[15px] leading-[1.7] max-w-[460px]" style={{ fontFamily: F.body, color: c.textSub }}>
              Initialize your learning sequence. AI-powered curriculum
              that adapts to your cognitive architecture.
            </motion.p>

            {/* Search */}
            <motion.div variants={fadeUp} className="mt-6">
              <form onSubmit={submit} className="max-w-[500px]">
                <div className="flex items-center rounded overflow-hidden" style={{ border: `1px solid ${c.border}`, background: c.searchBg }}>
                  <span className="ml-3 text-[10px]" style={{ fontFamily: F.mono, color: c.textMuted }}>&gt;</span>
                  <input ref={ref} type="text" value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder="query --courses --topics --skills"
                    className="flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:opacity-30"
                    style={{ fontFamily: F.mono, color: isDark ? c.accent : c.text, fontSize: "13px" }}
                  />
                  <button type="submit" className="mr-2 h-7 w-7 rounded flex items-center justify-center" style={{ background: c.accent }}>
                    <ArrowRight className="h-3 w-3" style={{ color: isDark ? "#000" : "#fff" }} />
                  </button>
                </div>
              </form>
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <span className="text-[10px]" style={{ fontFamily: F.mono, color: c.textMuted }}>TAGS:</span>
                {TAGS.map((t) => (
                  <button key={t} type="button" onClick={() => { setQ(t); ref.current?.focus(); }}
                    className="text-[11px] px-2 py-0.5 rounded"
                    style={{ border: `1px solid ${c.border}`, color: c.textLabel, fontFamily: F.mono }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div variants={fadeUp} className="mt-7 flex items-center gap-4">
              <Button size="lg" className="rounded px-6 py-5 text-sm font-semibold tracking-wide"
                style={{ background: c.accent, color: isDark ? "#000" : "#fff", fontFamily: F.mono }}
                asChild
              >
                <Link href={userId ? "/dashboard/user" : "/auth/register"}>
                  {userId ? "DASHBOARD" : "INITIALIZE"}
                  <Zap className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <button type="button" onClick={() => document.getElementById("main-content")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-2 text-[12px]" style={{ color: c.textSub, fontFamily: F.mono }}
              >
                <ChevronDown className="h-4 w-4" /> BROWSE
              </button>
            </motion.div>
          </div>

          {/* Right — LED Data Readouts */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="hidden lg:block">
            <div className="space-y-4">
              {[
                { v: statistics.totalCourses > 0 ? `${statistics.totalCourses}` : "000", l: "CRS", sub: "AVAILABLE", color: c.accent },
                { v: statistics.totalEnrollments > 0 ? statistics.totalEnrollments.toLocaleString() : "000", l: "USR", sub: "ENROLLED", color: c.warm },
                { v: statistics.averageRating > 0 ? statistics.averageRating.toFixed(1) : "0.0", l: "RTG", sub: "AVERAGE", color: c.accent },
              ].map((s, i) => (
                <motion.div
                  key={s.l}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.15 }}
                  className="p-4 rounded"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div
                      animate={{ opacity: booted ? [0.3, 1, 0.3] : 0.1 }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: s.color }}
                    />
                    <span className="text-[9px] tracking-[0.2em]" style={{ fontFamily: F.mono, color: c.textMuted }}>{s.sub}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight" style={{ fontFamily: F.mono, color: s.color }}>{s.v}</span>
                    <span className="text-[10px] tracking-[0.15em]" style={{ fontFamily: F.mono, color: c.textLabel }}>{s.l}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Feature nodes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="pb-10 flex flex-wrap justify-center gap-2.5">
          {FEATURES.map((f, i) => (
            <motion.div key={f.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 + i * 0.08 }}
              className="flex items-center gap-2 rounded px-3.5 py-2 cursor-default"
              style={{ border: `1px solid ${c.border}`, background: c.surface }}
            >
              <motion.div
                animate={{ opacity: booted ? [0.4, 1, 0.4] : 0.2 }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: c.led }}
              />
              <f.icon className="h-3 w-3" style={{ color: c.accent }} />
              <span className="text-[10px] font-medium" style={{ fontFamily: F.mono, color: isDark ? c.text : c.textLabel }}>{f.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c.accent}30 50%, transparent)` }} />
    </section>
  );
}
