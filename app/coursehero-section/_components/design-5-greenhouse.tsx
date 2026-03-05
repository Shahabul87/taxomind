"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  Sprout,
  Sun,
  Droplets,
  TreePine,
  Leaf,
  Flower2,
} from "lucide-react";

/*
  DESIGN 5: THE GREENHOUSE
  Aesthetic: Organic botanical / greenhouse garden
  Concept: Knowledge as living plants. Learning = nurturing growth.
  Seeds, roots, blooming flowers as metaphors for mastery stages.
  Color: Deep forest green + warm earth + morning dew + bloom pink
  Typography: Fraunces (display) + Outfit (body)
*/

interface HeroProps {
  statistics: {
    totalCourses: number;
    totalEnrollments: number;
    averageRating: number;
  };
}

const GROWTH_WORDS = ["Seeds", "Roots", "Blooms", "Forests"];
const QUICK_TAGS = ["Python", "React", "AI", "Data Science", "Design"];

function FloatingLeaves() {
  const leaves = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 10 + Math.random() * 14,
      rotation: Math.random() * 360,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 10,
      opacity: 0.04 + Math.random() * 0.06,
    })),
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {leaves.current.map((leaf) => (
        <motion.div
          key={leaf.id}
          className="absolute"
          style={{
            left: `${leaf.x}%`,
            top: `${leaf.y}%`,
            opacity: leaf.opacity,
          }}
          animate={{
            y: [0, -80, -160],
            x: [0, Math.random() > 0.5 ? 30 : -30, 0],
            rotate: [leaf.rotation, leaf.rotation + 180, leaf.rotation + 360],
          }}
          transition={{
            duration: leaf.duration,
            delay: leaf.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Leaf
            style={{
              width: leaf.size,
              height: leaf.size,
              color: "#2d5a27",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

function GrowthSVG() {
  return (
    <svg
      className="absolute bottom-0 left-0 right-0 w-full"
      viewBox="0 0 1200 200"
      preserveAspectRatio="xMidYMax slice"
      style={{ opacity: 0.06, height: 200 }}
    >
      {/* Growing vine paths */}
      <motion.path
        d="M0,200 Q100,180 150,140 T300,100 T450,120 T600,80 T750,110 T900,70 T1050,90 T1200,60"
        fill="none"
        stroke="#2d5a27"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, ease: "easeOut" }}
      />
      <motion.path
        d="M0,200 Q200,160 250,130 T500,90 T750,100 T1000,60 T1200,80"
        fill="none"
        stroke="#2d5a27"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3.5, delay: 0.5, ease: "easeOut" }}
      />
      {/* Small circles as berries/buds along the vine */}
      {[150, 300, 450, 600, 750, 900, 1050].map((x, i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={100 + Math.sin(i) * 30}
          r={3}
          fill="#2d5a27"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.5 + i * 0.2, duration: 0.4 }}
        />
      ))}
    </svg>
  );
}

export function HeroDesign5({ statistics }: HeroProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => setWordIndex((p) => (p + 1) % GROWTH_WORDS.length), 3000);
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
        background: "linear-gradient(175deg, #f8faf5 0%, #f0f5e8 30%, #e8f0dd 60%, #dfe8d4 100%)",
        minHeight: 720,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400&family=Outfit:wght@300;400;500;600&display=swap');
      `}</style>

      {/* Floating leaves */}
      <FloatingLeaves />

      {/* Morning light gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 70% 20%, rgba(255,220,120,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Growth vines at bottom */}
      <GrowthSVG />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="pt-24 sm:pt-32 lg:pt-36 pb-20"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
        >
          {/* Two-column organic layout */}
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Left: Main content (3 cols) */}
            <div className="lg:col-span-3">
              {/* Greenhouse badge */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                className="mb-8"
              >
                <div
                  className="inline-flex items-center gap-2 px-4 py-2"
                  style={{
                    background: "rgba(45,90,39,0.06)",
                    border: "1px solid rgba(45,90,39,0.12)",
                    borderRadius: 40,
                  }}
                >
                  <Sprout className="w-3.5 h-3.5" style={{ color: "#4a8a3e" }} />
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 11,
                      color: "#4a8a3e",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fontWeight: 500,
                    }}
                  >
                    The Knowledge Greenhouse
                  </span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: "clamp(2.5rem, 5.5vw, 4.2rem)",
                  color: "#1a2e18",
                  lineHeight: 1.1,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                }}
              >
                Cultivate{" "}
                <span className="relative inline-block" style={{ minWidth: 140 }}>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={wordIndex}
                      initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                      transition={{ duration: 0.45 }}
                      style={{
                        color: "#4a8a3e",
                        fontStyle: "italic",
                        fontWeight: 300,
                      }}
                    >
                      {GROWTH_WORDS[wordIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <br />
                of Brilliance
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "clamp(0.9rem, 1.2vw, 1rem)",
                  color: "rgba(26,46,24,0.5)",
                  maxWidth: 480,
                  lineHeight: 1.8,
                  marginTop: 20,
                  fontWeight: 300,
                }}
              >
                Every great mind began as a seed. Plant yours in our greenhouse of
                {" "}{statistics.totalCourses} carefully tended courses, and watch it
                grow into something extraordinary.
              </motion.p>

              {/* Search - garden search */}
              <motion.form
                onSubmit={handleSearch}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                className="mt-10 max-w-lg"
              >
                <div
                  className="relative flex items-center"
                  style={{
                    background: "rgba(255,255,255,0.65)",
                    border: "1.5px solid rgba(45,90,39,0.12)",
                    borderRadius: 50,
                    padding: "4px 4px 4px 20px",
                    boxShadow: "0 4px 30px rgba(45,90,39,0.04)",
                  }}
                >
                  <Search className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(45,90,39,0.35)" }} />
                  <input
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="What would you like to grow?"
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      padding: "13px 12px",
                      color: "#1a2e18",
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 14,
                      fontWeight: 300,
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: "linear-gradient(135deg, #4a8a3e, #3a7030)",
                      border: "none",
                      borderRadius: 40,
                      padding: "11px 24px",
                      color: "#f8faf5",
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 4px 16px rgba(74,138,62,0.2)",
                    }}
                  >
                    Plant <Sprout className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.form>

              {/* Tags */}
              <motion.div
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                className="flex flex-wrap gap-2 mt-5"
              >
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchVal(tag)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 20,
                      border: "1px solid rgba(45,90,39,0.1)",
                      background: "rgba(255,255,255,0.4)",
                      color: "rgba(26,46,24,0.45)",
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 12,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontWeight: 400,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(74,138,62,0.3)";
                      e.currentTarget.style.color = "#4a8a3e";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(45,90,39,0.1)";
                      e.currentTarget.style.color = "rgba(26,46,24,0.45)";
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </motion.div>
            </div>

            {/* Right: Growth stages card (2 cols) */}
            <motion.div
              className="lg:col-span-2"
              variants={{ hidden: { opacity: 0, x: 30 }, show: { opacity: 1, x: 0, transition: { duration: 0.8 } } }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(45,90,39,0.08)",
                  borderRadius: 20,
                  padding: 28,
                  backdropFilter: "blur(10px)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 18,
                    color: "#1a2e18",
                    fontWeight: 500,
                    marginBottom: 20,
                  }}
                >
                  Growth Stages
                </h3>

                {/* Growth journey */}
                {[
                  { icon: Sprout, stage: "Seed", desc: "Begin your journey", color: "#8bc34a", count: `${statistics.totalCourses} courses` },
                  { icon: Sun, stage: "Sunlight", desc: "AI-powered nurturing", color: "#ff9800", count: "Personal mentor" },
                  { icon: Droplets, stage: "Nourish", desc: "Spaced repetition", color: "#2196f3", count: "Deep learning" },
                  { icon: Flower2, stage: "Bloom", desc: "Earn your mastery", color: "#e91e63", count: "Certificates" },
                  { icon: TreePine, stage: "Forest", desc: "Join the community", color: "#2d5a27", count: `${(statistics.totalEnrollments / 1000).toFixed(1)}K learners` },
                ].map((item, i) => (
                  <motion.div
                    key={item.stage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.12 }}
                    className="flex items-center gap-4 mb-4 last:mb-0"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(74,138,62,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Icon with growth line */}
                    <div className="relative flex flex-col items-center">
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: `${item.color}10`,
                          border: `1px solid ${item.color}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <item.icon style={{ width: 16, height: 16, color: item.color }} />
                      </div>
                      {i < 4 && (
                        <div
                          style={{
                            width: 1,
                            height: 16,
                            background: `rgba(45,90,39,0.1)`,
                            position: "absolute",
                            bottom: -16,
                          }}
                        />
                      )}
                    </div>

                    <div className="flex-1">
                      <span
                        style={{
                          fontFamily: "'Fraunces', serif",
                          fontSize: 14,
                          color: "#1a2e18",
                          fontWeight: 500,
                          display: "block",
                        }}
                      >
                        {item.stage}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 11,
                          color: "rgba(26,46,24,0.4)",
                          fontWeight: 300,
                        }}
                      >
                        {item.desc}
                      </span>
                    </div>

                    <span
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 11,
                        color: item.color,
                        fontWeight: 500,
                      }}
                    >
                      {item.count}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Star rating bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="flex items-center justify-center gap-3 mt-5"
                style={{
                  background: "rgba(255,255,255,0.4)",
                  borderRadius: 12,
                  padding: "10px 16px",
                  border: "1px solid rgba(45,90,39,0.06)",
                }}
              >
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: "#1a2e18", fontWeight: 500 }}>
                  {statistics.averageRating}
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      style={{
                        width: 14,
                        height: 14,
                        background: star <= Math.round(statistics.averageRating) ? "#ff9800" : "rgba(26,46,24,0.08)",
                        borderRadius: "50%",
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: "rgba(26,46,24,0.35)", fontWeight: 300 }}>
                  from {(statistics.totalEnrollments / 1000).toFixed(1)}K gardeners
                </span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
