"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  ScanEye,
  Orbit,
  Star,
  Sparkles,
} from "lucide-react";

/*
  DESIGN 1: THE OBSERVATORY
  Aesthetic: Deep space / astronomical observatory
  Concept: Learning as cosmic exploration. Courses are stars.
  The hero is a view through a telescope into a knowledge universe.
  Color: Deep indigo-black, luminous cyan, warm amber stars
  Typography: Instrument Serif (display) + JetBrains Mono (data)
*/

interface HeroProps {
  statistics: {
    totalCourses: number;
    totalEnrollments: number;
    averageRating: number;
  };
}

const ROTATING_WORDS = ["Stars", "Galaxies", "Nebulae", "Universes"];
const QUICK_TAGS = ["Python", "Data Science", "Machine Learning", "React"];

function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    interface StarType {
      x: number;
      y: number;
      r: number;
      speed: number;
      brightness: number;
      twinkleSpeed: number;
      phase: number;
      color: string;
    }

    const stars: StarType[] = [];
    const colors = ["#67e8f9", "#fbbf24", "#c4b5fd", "#ffffff", "#93c5fd"];
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        r: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 0.15 + 0.02,
        brightness: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let raf: number;
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      t += 1;
      for (const s of stars) {
        const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color.replace(")", `,${alpha})`).replace("rgb", "rgba").replace("#", "");
        // Simple hex to rgba
        const hex = s.color;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();

        // Glow for bigger stars
        if (s.r > 1) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.08})`;
          ctx.fill();
        }

        s.y -= s.speed;
        if (s.y < -5) {
          s.y = canvas.offsetHeight + 5;
          s.x = Math.random() * canvas.offsetWidth;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.7 }}
    />
  );
}

export function HeroDesign1({ statistics }: HeroProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => setWordIndex((p) => (p + 1) % ROTATING_WORDS.length), 2800);
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
        background: "radial-gradient(ellipse 120% 80% at 50% 20%, #0c1631 0%, #050810 50%, #020204 100%)",
        minHeight: 700,
      }}
    >
      {/* Star field canvas */}
      <StarField />

      {/* Telescope vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle 45% at 50% 45%, transparent 0%, rgba(2,2,4,0.7) 100%)",
        }}
      />

      {/* Orbital rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            border: "1px solid rgba(103,232,249,0.06)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 720,
            height: 720,
            border: "1px dashed rgba(103,232,249,0.04)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
        />
        {/* Orbiting dot */}
        <motion.div
          className="absolute"
          style={{ width: 500, height: 500 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <div
            className="absolute"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#fbbf24",
              boxShadow: "0 0 12px 3px rgba(251,191,36,0.4)",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex flex-col items-center text-center pt-24 sm:pt-32 lg:pt-40 pb-16"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12 } },
          }}
        >
          {/* Eyebrow */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="flex items-center gap-2 mb-8"
          >
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: "rgba(103,232,249,0.06)",
                border: "1px solid rgba(103,232,249,0.12)",
              }}
            >
              <ScanEye className="w-3.5 h-3.5" style={{ color: "#67e8f9" }} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: 10,
                  color: "#67e8f9",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Knowledge Observatory
              </span>
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
            style={{
              fontFamily: "'Instrument Serif', 'Playfair Display', 'Georgia', serif",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              lineHeight: 1.05,
              color: "#edf0f7",
              letterSpacing: "-0.02em",
              maxWidth: 800,
            }}
          >
            Explore{" "}
            <span className="relative inline-block" style={{ minWidth: 200 }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -24, filter: "blur(6px)" }}
                  transition={{ duration: 0.5 }}
                  style={{
                    background: "linear-gradient(135deg, #67e8f9, #a78bfa, #fbbf24)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {ROTATING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
            <br />
            of Knowledge
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "clamp(0.8rem, 1.2vw, 0.95rem)",
              color: "rgba(237,240,247,0.4)",
              maxWidth: 520,
              lineHeight: 1.7,
              marginTop: 24,
            }}
          >
            Chart your course through {statistics.totalCourses}+ celestial bodies of wisdom.
            Each star a lesson. Each constellation a mastery.
          </motion.p>

          {/* Search - telescope finder style */}
          <motion.form
            onSubmit={handleSearch}
            variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
            className="w-full max-w-lg mt-10"
          >
            <div
              className="relative flex items-center"
              style={{
                background: "rgba(103,232,249,0.04)",
                border: "1px solid rgba(103,232,249,0.1)",
                borderRadius: 12,
                padding: "4px 4px 4px 20px",
              }}
            >
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(103,232,249,0.4)" }} />
              <input
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search the knowledge universe..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  padding: "14px 12px",
                  color: "#edf0f7",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                }}
              />
              <button
                type="submit"
                style={{
                  background: "linear-gradient(135deg, rgba(103,232,249,0.2), rgba(167,139,250,0.2))",
                  border: "1px solid rgba(103,232,249,0.15)",
                  borderRadius: 8,
                  padding: "10px 20px",
                  color: "#67e8f9",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Observe <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.form>

          {/* Quick tags */}
          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            className="flex flex-wrap justify-center gap-2 mt-5"
          >
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchVal(tag)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: "1px solid rgba(103,232,249,0.06)",
                  background: "rgba(103,232,249,0.03)",
                  color: "rgba(237,240,247,0.35)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(103,232,249,0.2)";
                  e.currentTarget.style.color = "rgba(237,240,247,0.7)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(103,232,249,0.06)";
                  e.currentTarget.style.color = "rgba(237,240,247,0.35)";
                }}
              >
                {tag}
              </button>
            ))}
          </motion.div>

          {/* Stats - mission control readout style */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="flex items-center gap-8 sm:gap-12 mt-14"
          >
            {[
              { icon: Orbit, label: "COURSES MAPPED", value: `${statistics.totalCourses}+` },
              { icon: Star, label: "EXPLORERS", value: `${(statistics.totalEnrollments / 1000).toFixed(1)}K` },
              { icon: Sparkles, label: "AVG RATING", value: statistics.averageRating.toFixed(1) },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <stat.icon className="w-4 h-4 mb-1" style={{ color: "rgba(103,232,249,0.3)" }} />
                <span
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "clamp(1.5rem, 3vw, 2rem)",
                    color: "#edf0f7",
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    color: "rgba(103,232,249,0.35)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom horizon glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(103,232,249,0.15), transparent)" }}
      />
    </section>
  );
}
