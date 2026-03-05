"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  MapPin,
  Mountain,
  Compass,
  Navigation,
} from "lucide-react";

/*
  DESIGN 3: THE TOPOGRAPHY
  Aesthetic: Terrain contour map / cartographic explorer
  Concept: Learning as a journey across intellectual terrain.
  Courses are peaks on a topographic map.
  Color: Soft sage + terracotta + parchment + deep forest
  Typography: DM Serif Display (headlines) + Source Sans 3 (body)
*/

interface HeroProps {
  statistics: {
    totalCourses: number;
    totalEnrollments: number;
    averageRating: number;
  };
}

const TERRAIN_WORDS = ["Peaks", "Valleys", "Ridges", "Summits"];
const QUICK_TAGS = ["Python", "Web Dev", "AI", "Data", "Design", "DevOps"];

function TopoLines() {
  const svgRef = useRef<SVGSVGElement>(null);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity: 0.12 }}
    >
      {/* Contour lines - hand-crafted organic shapes */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <motion.ellipse
          key={i}
          cx={600 + Math.sin(i * 0.8) * 100}
          cy={350 + Math.cos(i * 1.2) * 60}
          rx={120 + i * 55}
          ry={70 + i * 35}
          fill="none"
          stroke="#5a7a5a"
          strokeWidth={0.8}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2 + i * 0.3, delay: i * 0.15, ease: "easeOut" }}
          style={{ transform: `rotate(${i * 5}deg)`, transformOrigin: "center" }}
        />
      ))}
      {/* Secondary cluster */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.ellipse
          key={`b-${i}`}
          cx={300 + Math.sin(i * 1.1) * 40}
          cy={250 + Math.cos(i * 0.9) * 30}
          rx={60 + i * 35}
          ry={40 + i * 22}
          fill="none"
          stroke="#8a6040"
          strokeWidth={0.6}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 1 + i * 0.2, ease: "easeOut" }}
          style={{ transform: `rotate(${-i * 7}deg)`, transformOrigin: "300px 250px" }}
        />
      ))}
      {/* Third cluster */}
      {[0, 1, 2, 3].map((i) => (
        <motion.ellipse
          key={`c-${i}`}
          cx={900 + Math.sin(i * 0.7) * 30}
          cy={450 + Math.cos(i * 1.3) * 20}
          rx={50 + i * 30}
          ry={35 + i * 18}
          fill="none"
          stroke="#5a7a5a"
          strokeWidth={0.5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 1.5 + i * 0.2, ease: "easeOut" }}
        />
      ))}
      {/* Grid lines */}
      {Array.from({ length: 13 }).map((_, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * 58}
          x2={1200}
          y2={i * 58}
          stroke="#5a7a5a"
          strokeWidth={0.2}
          opacity={0.3}
        />
      ))}
      {Array.from({ length: 21 }).map((_, i) => (
        <line
          key={`v-${i}`}
          x1={i * 60}
          y1={0}
          x2={i * 60}
          y2={700}
          stroke="#5a7a5a"
          strokeWidth={0.2}
          opacity={0.3}
        />
      ))}
    </svg>
  );
}

export function HeroDesign3({ statistics }: HeroProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => setWordIndex((p) => (p + 1) % TERRAIN_WORDS.length), 3200);
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
        background: "linear-gradient(170deg, #f7f4ef 0%, #f0ebe0 40%, #e8e0d2 100%)",
        minHeight: 700,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Source+Sans+3:wght@300;400;600&display=swap');
      `}</style>

      {/* Topo lines background */}
      <TopoLines />

      {/* Compass rose */}
      <motion.div
        className="absolute hidden lg:block"
        style={{ right: "8%", top: "15%" }}
        initial={{ opacity: 0, rotate: -30 }}
        animate={{ opacity: 0.08, rotate: 0 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      >
        <svg width="140" height="140" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="none" stroke="#5a7a5a" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="#5a7a5a" strokeWidth="0.3" />
          <line x1="50" y1="2" x2="50" y2="98" stroke="#5a7a5a" strokeWidth="0.5" />
          <line x1="2" y1="50" x2="98" y2="50" stroke="#5a7a5a" strokeWidth="0.5" />
          <line x1="15" y1="15" x2="85" y2="85" stroke="#5a7a5a" strokeWidth="0.3" />
          <line x1="85" y1="15" x2="15" y2="85" stroke="#5a7a5a" strokeWidth="0.3" />
          <text x="50" y="12" textAnchor="middle" fill="#5a7a5a" fontSize="6" fontFamily="serif">N</text>
          <text x="50" y="96" textAnchor="middle" fill="#5a7a5a" fontSize="6" fontFamily="serif">S</text>
          <text x="8" y="52" textAnchor="middle" fill="#5a7a5a" fontSize="6" fontFamily="serif">W</text>
          <text x="93" y="52" textAnchor="middle" fill="#5a7a5a" fontSize="6" fontFamily="serif">E</text>
        </svg>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex flex-col items-center text-center pt-24 sm:pt-32 lg:pt-36 pb-16"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        >
          {/* Coordinates badge */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="flex items-center gap-2 mb-8"
          >
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: "rgba(90,122,90,0.08)",
                border: "1px solid rgba(90,122,90,0.15)",
              }}
            >
              <Navigation className="w-3 h-3" style={{ color: "#5a7a5a" }} />
              <span
                style={{
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontSize: 10,
                  color: "#5a7a5a",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Lat 41.40 N &bull; Long 2.17 W &bull; Elev. {statistics.totalCourses}m
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              color: "#2a3a2a",
              lineHeight: 1.1,
              maxWidth: 720,
              letterSpacing: "-0.01em",
            }}
          >
            Navigate the{" "}
            <span className="relative inline-block" style={{ minWidth: 160 }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  style={{ color: "#8a6040", fontStyle: "italic" }}
                >
                  {TERRAIN_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
            <br />
            of Mastery
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            style={{
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: "clamp(0.9rem, 1.3vw, 1.05rem)",
              color: "rgba(42,58,42,0.55)",
              maxWidth: 500,
              lineHeight: 1.7,
              marginTop: 20,
              fontWeight: 300,
            }}
          >
            Every course is a peak waiting to be summited. Chart your expedition
            across {statistics.totalCourses} waypoints of knowledge terrain.
          </motion.p>

          {/* Search - map search field */}
          <motion.form
            onSubmit={handleSearch}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="w-full max-w-xl mt-10"
          >
            <div
              className="relative flex items-center"
              style={{
                background: "rgba(255,255,255,0.7)",
                border: "1.5px solid rgba(90,122,90,0.2)",
                borderRadius: 8,
                padding: "4px 4px 4px 16px",
                boxShadow: "0 4px 30px rgba(90,122,90,0.06)",
              }}
            >
              <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "#8a6040" }} />
              <input
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search for a destination..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  padding: "14px 12px",
                  color: "#2a3a2a",
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontSize: 14,
                }}
              />
              <button
                type="submit"
                style={{
                  background: "#5a7a5a",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 22px",
                  color: "#f7f4ef",
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Explore <Compass className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.form>

          {/* Quick tags as trail markers */}
          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            className="flex flex-wrap justify-center gap-2 mt-5"
          >
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchVal(tag)}
                className="flex items-center gap-1.5"
                style={{
                  padding: "5px 14px",
                  borderRadius: 4,
                  border: "1px solid rgba(90,122,90,0.12)",
                  background: "rgba(255,255,255,0.4)",
                  color: "rgba(42,58,42,0.5)",
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(138,96,64,0.3)";
                  e.currentTarget.style.color = "#8a6040";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(90,122,90,0.12)";
                  e.currentTarget.style.color = "rgba(42,58,42,0.5)";
                }}
              >
                <Mountain className="w-2.5 h-2.5" />
                {tag}
              </button>
            ))}
          </motion.div>

          {/* Stats - elevation markers */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="grid grid-cols-3 gap-8 mt-16"
            style={{ maxWidth: 480 }}
          >
            {[
              { label: "Waypoints", value: `${statistics.totalCourses}`, elevation: "2,400m" },
              { label: "Explorers", value: `${(statistics.totalEnrollments / 1000).toFixed(1)}K`, elevation: "Base Camp" },
              { label: "Trail Rating", value: `${statistics.averageRating}`, elevation: "Summit" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center"
                style={{
                  padding: 16,
                  borderLeft: "2px solid rgba(90,122,90,0.12)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: "clamp(1.5rem, 3vw, 2rem)",
                    color: "#2a3a2a",
                    display: "block",
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: 11,
                    color: "rgba(42,58,42,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    display: "block",
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {stat.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: 9,
                    color: "#8a6040",
                    display: "block",
                    marginTop: 2,
                  }}
                >
                  {stat.elevation}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom terrain line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(90,122,90,0.2), transparent)" }}
      />
    </section>
  );
}
