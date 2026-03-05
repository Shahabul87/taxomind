"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/theme-provider";
import {
  ArrowRight,
  Zap,
  Box,
  Cpu,
  ChevronDown,
} from "lucide-react";

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

const GLITCH_WORDS = ["LEARN.", "BUILD.", "THINK.", "GROW."];
const CATEGORY_TAGS = ["PYTHON", "AI/ML", "WEB", "DATA", "CLOUD", "DESIGN"];

/* ================================================================
   COLOR SYSTEM
   Light: Concrete gray + electric yellow + pure black
   Dark:  Deep charcoal + electric yellow + off-white
   ================================================================ */

function useColors(isDark: boolean) {
  return isDark
    ? {
        bg: "#121212",
        textPrimary: "#e8e4de",
        textMuted: "rgba(232,228,222,0.4)",
        accent: "#eab308",
        border: "#e8e4de",
        borderMuted: "rgba(232,228,222,0.15)",
        gridLine: "rgba(232,228,222,0.04)",
        scanLine: "rgba(232,228,222,0.04)",
        bgNumber: "rgba(232,228,222,0.025)",
        searchBg: "transparent",
        searchText: "#e8e4de",
        statBg: "transparent",
        tagHoverBg: "#e8e4de",
        tagHoverText: "#121212",
        ctaBg: "#eab308",
        ctaText: "#121212",
        ctaHoverBg: "#e8e4de",
        ctaHoverText: "#121212",
        statusDot: "#22c55e",
        greenAccent: "#22c55e",
        redAccent: "#ef4444",
        inputBg: "transparent",
        submitBg: "#e8e4de",
        submitText: "#eab308",
      }
    : {
        bg: "#e8e4de",
        textPrimary: "#1a1a1a",
        textMuted: "rgba(26,26,26,0.4)",
        accent: "#eab308",
        border: "#1a1a1a",
        borderMuted: "rgba(26,26,26,0.15)",
        gridLine: "rgba(0,0,0,0.02)",
        scanLine: "rgba(0,0,0,0.04)",
        bgNumber: "rgba(0,0,0,0.025)",
        searchBg: "transparent",
        searchText: "#1a1a1a",
        statBg: "transparent",
        tagHoverBg: "#1a1a1a",
        tagHoverText: "#eab308",
        ctaBg: "#eab308",
        ctaText: "#1a1a1a",
        ctaHoverBg: "#1a1a1a",
        ctaHoverText: "#eab308",
        statusDot: "#22c55e",
        greenAccent: "#22c55e",
        redAccent: "#ef4444",
        inputBg: "transparent",
        submitBg: "#1a1a1a",
        submitText: "#eab308",
      };
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export function EnhancedHero({ statistics, userId }: EnhancedHeroProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const [time, setTime] = useState("");
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useTheme();
  const c = useColors(isDark);

  /* Rotate word every 2s */
  useEffect(() => {
    const id = setInterval(
      () => setWordIndex((p) => (p + 1) % GLITCH_WORDS.length),
      2000,
    );
    return () => clearInterval(id);
  }, []);

  /* Live clock */
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
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

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchVal.trim()) return;
      document
        .querySelector("[data-results-section]")
        ?.scrollIntoView({ behavior: "smooth" });
      const params = new URLSearchParams(window.location.search);
      params.set("q", searchVal.trim());
      router.push(`/courses?${params.toString()}`);
    },
    [searchVal, router],
  );

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: c.bg, minHeight: 700 }}
    >
      {/* Font imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');
        @keyframes brutalist-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>

      {/* Concrete texture grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 40px, ${c.gridLine} 40px, ${c.gridLine} 41px),
            repeating-linear-gradient(90deg, transparent, transparent 40px, ${c.gridLine} 40px, ${c.gridLine} 41px)
          `,
        }}
      />

      {/* Scan line */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none"
        aria-hidden
        style={{
          background: c.scanLine,
          animation: "brutalist-scan 8s linear infinite",
        }}
      />

      {/* Giant background number */}
      <div
        className="absolute pointer-events-none select-none"
        aria-hidden
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(20rem, 40vw, 40rem)",
          color: c.bgNumber,
          lineHeight: 0.8,
          top: "5%",
          right: "-5%",
        }}
      >
        {statistics.totalCourses}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="pt-20 sm:pt-24 lg:pt-16 pb-10 sm:pb-16"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {/* Top status bar */}
          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            className="flex items-center justify-between mb-12"
            style={{
              borderBottom: `3px solid ${c.border}`,
              paddingBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                color: c.textPrimary,
                textTransform: "uppercase",
              }}
            >
              SYS.TIME: {time}
            </span>
            <span
              className="hidden sm:inline"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                color: c.textPrimary,
              }}
            >
              TAXOMIND_V2.0 // COURSE_MODULE
            </span>
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 8,
                  height: 8,
                  background: c.statusDot,
                  borderRadius: 2,
                }}
              />
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  color: c.textPrimary,
                }}
              >
                ONLINE
              </span>
            </div>
          </motion.div>

          {/* Two-column brutal layout */}
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left: Giant type + search */}
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -30 },
                show: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.6 },
                },
              }}
              className="pr-0 lg:pr-10"
            >
              {/* Rotating word */}
              <div style={{ minHeight: 120, marginBottom: 8 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={wordIndex}
                    initial={{ opacity: 0, x: -40, skewX: -5 }}
                    animate={{ opacity: 1, x: 0, skewX: 0 }}
                    exit={{ opacity: 0, x: 40, skewX: 5 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "clamp(5rem, 12vw, 9rem)",
                      color: c.textPrimary,
                      lineHeight: 0.9,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {GLITCH_WORDS[wordIndex]}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Yellow accent bar */}
              <div
                style={{
                  width: 120,
                  height: 8,
                  background: c.accent,
                  marginBottom: 24,
                }}
              />

              <h2
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "clamp(2rem, 4vw, 3.5rem)",
                  color: c.textPrimary,
                  lineHeight: 1,
                  letterSpacing: "0.02em",
                }}
              >
                NO DECORATION.
                <br />
                <span style={{ color: c.accent }}>PURE KNOWLEDGE.</span>
              </h2>

              <p
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 12,
                  color: c.textMuted,
                  lineHeight: 1.8,
                  marginTop: 20,
                  maxWidth: 420,
                }}
              >
                [{statistics.totalCourses}] courses. [
                {(statistics.totalEnrollments / 1000).toFixed(1)}K] learners. No
                fluff. No filler. Raw education stripped to its core. Enter the
                system.
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="mt-8">
                <div
                  className="flex"
                  style={{ border: `3px solid ${c.border}` }}
                >
                  <input
                    ref={searchInputRef}
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="QUERY_"
                    style={{
                      flex: 1,
                      background: c.inputBg,
                      border: "none",
                      outline: "none",
                      padding: "14px 16px",
                      color: c.searchText,
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 13,
                      textTransform: "uppercase",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: c.submitBg,
                      border: "none",
                      color: c.submitText,
                      padding: "14px 24px",
                      cursor: "pointer",
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    EXEC <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* CTA row */}
              <div className="flex items-center gap-4 mt-8">
                <Link
                  href={userId ? "/dashboard/user" : "/auth/register"}
                  style={{
                    padding: "12px 28px",
                    background: c.accent,
                    border: `3px solid ${c.border}`,
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 18,
                    color: c.ctaText,
                    letterSpacing: "0.1em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.15s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = c.ctaHoverBg;
                    e.currentTarget.style.color = c.ctaHoverText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = c.ctaBg;
                    e.currentTarget.style.color = c.ctaText;
                  }}
                >
                  {userId ? "DASHBOARD" : "START FREE"}{" "}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("main-content")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  style={{
                    padding: "12px 16px",
                    background: "transparent",
                    border: `3px solid ${c.border}`,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    color: c.textMuted,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = c.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = c.textMuted;
                  }}
                >
                  <ChevronDown className="w-3.5 h-3.5" /> BROWSE
                </button>
              </div>
            </motion.div>

            {/* Right: Data blocks */}
            <motion.div
              variants={{
                hidden: { opacity: 0, x: 30 },
                show: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.6 },
                },
              }}
              className="mt-12 lg:mt-0"
              style={{
                borderLeft: `3px solid ${c.border}`,
                paddingLeft: 40,
              }}
            >
              {/* Stat blocks */}
              {[
                {
                  label: "COURSES_TOTAL",
                  value: statistics.totalCourses.toString(),
                  icon: Box,
                  accent: c.accent,
                },
                {
                  label: "ACTIVE_USERS",
                  value: statistics.totalEnrollments.toLocaleString(),
                  icon: Cpu,
                  accent: c.greenAccent,
                },
                {
                  label: "SATISFACTION_%",
                  value: `${(statistics.averageRating * 20).toFixed(0)}%`,
                  icon: Zap,
                  accent: c.redAccent,
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                  style={{
                    borderBottom: `2px solid ${c.border}`,
                    padding: "20px 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon
                        className="w-3.5 h-3.5"
                        style={{ color: stat.accent }}
                      />
                      <span
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 10,
                          color: c.textMuted,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {stat.label}
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 48,
                      color: c.textPrimary,
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </span>
                </motion.div>
              ))}

              {/* Quick access category grid */}
              <div className="grid grid-cols-3 gap-0 mt-6">
                {CATEGORY_TAGS.map((tag, i) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchVal(tag);
                      searchInputRef.current?.focus();
                    }}
                    style={{
                      padding: "16px 8px",
                      border: `1.5px solid ${c.border}`,
                      background: "transparent",
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      color: c.textPrimary,
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      transition: "all 0.15s",
                      margin: "-0.75px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = c.tagHoverBg;
                      e.currentTarget.style.color = c.tagHoverText;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = c.textPrimary;
                    }}
                  >
                    [{String(i + 1).padStart(2, "0")}]
                    <br />
                    {tag}
                  </button>
                ))}
              </div>

              {/* CTA button */}
              <button
                onClick={() =>
                  document
                    .getElementById("main-content")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                style={{
                  width: "100%",
                  marginTop: 20,
                  padding: "16px",
                  background: c.ctaBg,
                  border: `3px solid ${c.border}`,
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 20,
                  color: c.ctaText,
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = c.ctaHoverBg;
                  e.currentTarget.style.color = c.ctaHoverText;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = c.ctaBg;
                  e.currentTarget.style.color = c.ctaText;
                }}
              >
                ENTER THE SYSTEM <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Bottom edge line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${c.borderMuted}, transparent)`,
        }}
      />
    </section>
  );
}
