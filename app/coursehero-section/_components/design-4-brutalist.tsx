"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  Zap,
  Box,
  Cpu,
} from "lucide-react";

/*
  DESIGN 4: THE BRUTALIST
  Aesthetic: Raw concrete, exposed structure, anti-design
  Concept: Knowledge is raw material. No decoration, pure function.
  Harsh angles, monospace everywhere, giant bold type, visible grid.
  Color: Concrete gray + electric yellow + pure black
  Typography: Space Mono (everything) + Bebas Neue (display)
*/

interface HeroProps {
  statistics: {
    totalCourses: number;
    totalEnrollments: number;
    averageRating: number;
  };
}

const GLITCH_WORDS = ["LEARN.", "BUILD.", "THINK.", "GROW."];

export function HeroDesign4({ statistics }: HeroProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const [time, setTime] = useState("");
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => setWordIndex((p) => (p + 1) % GLITCH_WORDS.length), 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchVal.trim()) return;
      router.push(`/courses?q=${encodeURIComponent(searchVal.trim())}`);
    },
    [searchVal, router],
  );

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "#e8e4de",
        minHeight: 700,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');
        @keyframes brutalist-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>

      {/* Concrete texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0,0,0,0.02) 40px, rgba(0,0,0,0.02) 41px),
            repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.02) 40px, rgba(0,0,0,0.02) 41px)
          `,
        }}
      />

      {/* Scan line */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          background: "rgba(0,0,0,0.04)",
          animation: "brutalist-scan 8s linear infinite",
        }}
      />

      {/* Giant background number */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(20rem, 40vw, 40rem)",
          color: "rgba(0,0,0,0.025)",
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
          className="pt-16 pb-16"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {/* Top bar */}
          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            className="flex items-center justify-between mb-12"
            style={{
              borderBottom: "3px solid #1a1a1a",
              paddingBottom: 8,
            }}
          >
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#1a1a1a", textTransform: "uppercase" }}>
              SYS.TIME: {time}
            </span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#1a1a1a" }}>
              TAXOMIND_V2.0 // COURSE_MODULE
            </span>
            <div className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, background: "#22c55e", borderRadius: 2 }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#1a1a1a" }}>
                ONLINE
              </span>
            </div>
          </motion.div>

          {/* Two-column brutal layout */}
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left: Giant type */}
            <motion.div
              variants={{ hidden: { opacity: 0, x: -30 }, show: { opacity: 1, x: 0, transition: { duration: 0.6 } } }}
              style={{ paddingRight: 40 }}
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
                      color: "#1a1a1a",
                      lineHeight: 0.9,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {GLITCH_WORDS[wordIndex]}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Underline yellow block */}
              <div
                style={{
                  width: 120,
                  height: 8,
                  background: "#eab308",
                  marginBottom: 24,
                }}
              />

              <h2
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "clamp(2rem, 4vw, 3.5rem)",
                  color: "#1a1a1a",
                  lineHeight: 1,
                  letterSpacing: "0.02em",
                }}
              >
                NO DECORATION.
                <br />
                <span style={{ color: "#eab308" }}>PURE KNOWLEDGE.</span>
              </h2>

              <p
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 12,
                  color: "rgba(26,26,26,0.5)",
                  lineHeight: 1.8,
                  marginTop: 20,
                  maxWidth: 420,
                }}
              >
                [{statistics.totalCourses}] courses. [{(statistics.totalEnrollments / 1000).toFixed(1)}K] learners.
                No fluff. No filler. Raw education stripped to its core.
                Enter the system.
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="mt-8">
                <div
                  className="flex"
                  style={{
                    border: "3px solid #1a1a1a",
                  }}
                >
                  <input
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="QUERY_"
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      padding: "14px 16px",
                      color: "#1a1a1a",
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 13,
                      textTransform: "uppercase",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: "#1a1a1a",
                      border: "none",
                      color: "#eab308",
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
            </motion.div>

            {/* Right: Data blocks */}
            <motion.div
              variants={{ hidden: { opacity: 0, x: 30 }, show: { opacity: 1, x: 0, transition: { duration: 0.6 } } }}
              style={{
                borderLeft: "3px solid #1a1a1a",
                paddingLeft: 40,
              }}
            >
              {/* Stat blocks */}
              {[
                { label: "COURSES_TOTAL", value: statistics.totalCourses.toString(), icon: Box, accent: "#eab308" },
                { label: "ACTIVE_USERS", value: `${statistics.totalEnrollments.toLocaleString()}`, icon: Cpu, accent: "#22c55e" },
                { label: "SATISFACTION_%", value: `${(statistics.averageRating * 20).toFixed(0)}%`, icon: Zap, accent: "#ef4444" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                  style={{
                    borderBottom: "2px solid #1a1a1a",
                    padding: "20px 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className="w-3.5 h-3.5" style={{ color: stat.accent }} />
                      <span
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 10,
                          color: "rgba(26,26,26,0.4)",
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
                      color: "#1a1a1a",
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </span>
                </motion.div>
              ))}

              {/* Quick access blocks */}
              <div className="grid grid-cols-3 gap-0 mt-6">
                {["PYTHON", "AI/ML", "WEB", "DATA", "CLOUD", "DESIGN"].map((tag, i) => (
                  <button
                    key={tag}
                    onClick={() => setSearchVal(tag)}
                    style={{
                      padding: "16px 8px",
                      border: "1.5px solid #1a1a1a",
                      background: "transparent",
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      color: "#1a1a1a",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      transition: "all 0.15s",
                      margin: "-0.75px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#1a1a1a";
                      e.currentTarget.style.color = "#eab308";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#1a1a1a";
                    }}
                  >
                    [{String(i + 1).padStart(2, "0")}]
                    <br />
                    {tag}
                  </button>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => router.push("/courses")}
                style={{
                  width: "100%",
                  marginTop: 20,
                  padding: "16px",
                  background: "#eab308",
                  border: "3px solid #1a1a1a",
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 20,
                  color: "#1a1a1a",
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1a1a1a";
                  e.currentTarget.style.color = "#eab308";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#eab308";
                  e.currentTarget.style.color = "#1a1a1a";
                }}
              >
                ENTER THE SYSTEM <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
