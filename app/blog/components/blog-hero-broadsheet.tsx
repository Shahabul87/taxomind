"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Eye,
  Users,
  PenSquare,
} from "lucide-react";
import type { BlogPost, BlogStatistics } from "./types";

/*
  BLOG HERO: THE BROADSHEET
  Aesthetic: Editorial newspaper / magazine front page
  Concept: Blog posts as headlines. Knowledge as breaking news.
  Multi-column layout, large serif type, decorative rules.
  Color: Warm cream paper + deep black ink + cardinal red accents
  Typography: Crimson Text (headlines) + Libre Baskerville (body)
*/

interface BlogHeroBroadsheetProps {
  featuredPosts: BlogPost[];
  statistics?: BlogStatistics | null;
  isLoading?: boolean;
  userId?: string;
}

const EDITION_DATE = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const HEADLINES = [
  "Artificial Intelligence Reshapes How We Learn",
  "Open Source Communities Drive Innovation Forward",
  "New Frontiers in Machine Learning Open",
  "Web Development Skills in Record Demand",
];

const SECTIONS = ["Technology", "Science", "Business", "Design", "Data"];

export function BlogHeroBroadsheet({
  featuredPosts,
  statistics,
  isLoading,
  userId,
}: BlogHeroBroadsheetProps) {
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(
      () => setHeadlineIdx((p) => (p + 1) % HEADLINES.length),
      4000,
    );
    return () => clearInterval(id);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchVal.trim()) return;
      const articlesSection = document.getElementById("articles-section");
      if (articlesSection) {
        articlesSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [searchVal],
  );

  const formatStat = (num: number | undefined) => {
    if (!num || num === 0) return "0";
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return `${num}`;
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const totalArticles = statistics?.publishedArticles ?? featuredPosts.length;
  const totalReaders = statistics?.totalReaders ?? 0;
  const totalAuthors = statistics?.totalAuthors ?? 0;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "#f5f0e8",
        minHeight: 700,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      }}
    >
      {/* Google Fonts link via style tag for editorial fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=UnifrakturCook:wght@700&display=swap');
      `}</style>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="pt-12 pb-16"
        >
          {/* Masthead */}
          <motion.div variants={fadeUp} className="text-center">
            {/* Top rule */}
            <div
              style={{ borderTop: "3px double #1a1a1a", marginBottom: 12 }}
            />
            <div
              className="flex items-center justify-between"
              style={{
                borderBottom: "1px solid #1a1a1a",
                paddingBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: "'Libre Baskerville', serif",
                  fontSize: 10,
                  color: "#666",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Vol. MMXXVI &bull; No. {totalArticles}
              </span>
              <span
                style={{
                  fontFamily: "'Libre Baskerville', serif",
                  fontSize: 10,
                  color: "#666",
                }}
              >
                {EDITION_DATE}
              </span>
              <span
                style={{
                  fontFamily: "'Libre Baskerville', serif",
                  fontSize: 10,
                  color: "#666",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Blog Edition
              </span>
            </div>

            {/* Newspaper name */}
            <h1
              style={{
                fontFamily: "'UnifrakturCook', 'Crimson Text', serif",
                fontSize: "clamp(3rem, 8vw, 6rem)",
                color: "#1a1a1a",
                lineHeight: 1,
                margin: "20px 0 8px",
                letterSpacing: "0.02em",
              }}
            >
              The Taxomind Gazette
            </h1>

            <div
              className="flex items-center justify-center gap-3"
              style={{ marginBottom: 8 }}
            >
              <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
              <span
                style={{
                  fontFamily: "'Crimson Text', serif",
                  fontSize: 13,
                  fontStyle: "italic",
                  color: "#444",
                  padding: "0 12px",
                }}
              >
                &ldquo;Where Minds Are Forged Through Intelligence&rdquo;
              </span>
              <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
            </div>

            {/* Sub rule */}
            <div style={{ borderBottom: "3px double #1a1a1a" }} />
          </motion.div>

          {/* Main content - newspaper columns */}
          <div
            className="mt-8 hidden lg:grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2px 2.2fr 2px 1fr",
              gap: 0,
            }}
          >
            {/* Left column - stats */}
            <motion.div variants={fadeUp} style={{ padding: "0 20px 0 0" }}>
              <div
                style={{
                  borderBottom: "2px solid #1a1a1a",
                  paddingBottom: 6,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Crimson Text', serif",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "#1a1a1a",
                  }}
                >
                  By the Numbers
                </span>
              </div>

              {[
                {
                  icon: FileText,
                  label: "Articles Published",
                  value: isLoading ? "..." : `${totalArticles}`,
                },
                {
                  icon: Eye,
                  label: "Total Readers",
                  value: isLoading ? "..." : formatStat(totalReaders),
                },
                {
                  icon: Users,
                  label: "Contributing Authors",
                  value: isLoading ? "..." : `${totalAuthors}`,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    marginBottom: 16,
                    paddingBottom: 16,
                    borderBottom: "1px dotted rgba(26,26,26,0.2)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon
                      className="w-3.5 h-3.5"
                      style={{ color: "#8b1a1a" }}
                    />
                    <span
                      style={{
                        fontFamily: "'Libre Baskerville', serif",
                        fontSize: 10,
                        color: "#666",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {stat.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Crimson Text', serif",
                      fontSize: 36,
                      fontWeight: 700,
                      color: "#1a1a1a",
                      lineHeight: 1.1,
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}

              {/* Small ad box */}
              <div
                style={{
                  border: "2px solid #1a1a1a",
                  padding: 16,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Crimson Text', serif",
                    fontSize: 14,
                    fontStyle: "italic",
                    color: "#444",
                    display: "block",
                    lineHeight: 1.4,
                  }}
                >
                  &ldquo;The only investment that never depreciates is
                  education.&rdquo;
                </span>
                <span
                  style={{
                    fontFamily: "'Libre Baskerville', serif",
                    fontSize: 9,
                    color: "#888",
                    marginTop: 6,
                    display: "block",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  &mdash; Benjamin Franklin
                </span>
              </div>
            </motion.div>

            {/* Divider */}
            <div style={{ background: "#1a1a1a" }} />

            {/* Center column - main headline */}
            <motion.div variants={fadeUp} style={{ padding: "0 28px" }}>
              {/* Breaking headline */}
              <div
                className="text-center mb-4"
                style={{
                  background: "#8b1a1a",
                  color: "#f5f0e8",
                  padding: "4px 12px",
                  display: "inline-block",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Crimson Text', serif",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                  }}
                >
                  Breaking &bull; Today&apos;s Top Story
                </span>
              </div>

              {/* Main rotating headline */}
              <div style={{ minHeight: 160 }}>
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={headlineIdx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      fontFamily: "'Crimson Text', serif",
                      fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      lineHeight: 1.15,
                      textAlign: "center",
                    }}
                  >
                    {HEADLINES[headlineIdx]}
                  </motion.h2>
                </AnimatePresence>
              </div>

              {/* Byline */}
              <p
                className="text-center"
                style={{
                  fontFamily: "'Libre Baskerville', serif",
                  fontSize: 13,
                  fontStyle: "italic",
                  color: "#666",
                  lineHeight: 1.8,
                  maxWidth: 460,
                  margin: "0 auto 24px",
                }}
              >
                Our contributors have published {totalArticles} articles
                spanning every frontier of modern knowledge. From artificial
                intelligence to creative design, discover the ideas that&apos;s
                defining a generation.
              </p>

              {/* Search - like a classifieds search box */}
              <form onSubmit={handleSearch}>
                <div
                  style={{
                    border: "2px solid #1a1a1a",
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(255,255,255,0.5)",
                  }}
                >
                  <div
                    style={{
                      background: "#1a1a1a",
                      color: "#f5f0e8",
                      padding: "12px 16px",
                      fontFamily: "'Crimson Text', serif",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    SEARCH
                  </div>
                  <input
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="Find your next headline story..."
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      padding: "12px 16px",
                      fontFamily: "'Libre Baskerville', serif",
                      fontSize: 13,
                      color: "#1a1a1a",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: "#8b1a1a",
                      border: "none",
                      color: "#f5f0e8",
                      padding: "12px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "'Crimson Text', serif",
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Go <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Tags as "sections" */}
              <div
                className="flex justify-center gap-0 mt-5"
                style={{
                  borderTop: "1px solid rgba(26,26,26,0.15)",
                  paddingTop: 10,
                }}
              >
                {SECTIONS.map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSearchVal(t)}
                    style={{
                      padding: "4px 14px",
                      fontFamily: "'Crimson Text', serif",
                      fontSize: 12,
                      color: "#444",
                      cursor: "pointer",
                      background: "transparent",
                      border: "none",
                      borderRight:
                        i < SECTIONS.length - 1
                          ? "1px solid rgba(26,26,26,0.15)"
                          : "none",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#8b1a1a";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#444";
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Divider */}
            <div style={{ background: "#1a1a1a" }} />

            {/* Right column - featured posts */}
            <motion.div variants={fadeUp} style={{ padding: "0 0 0 20px" }}>
              <div
                style={{
                  borderBottom: "2px solid #1a1a1a",
                  paddingBottom: 6,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Crimson Text', serif",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "#1a1a1a",
                  }}
                >
                  Featured
                </span>
              </div>

              {featuredPosts.length > 0
                ? featuredPosts.slice(0, 3).map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        style={{
                          marginBottom: 16,
                          paddingBottom: 16,
                          borderBottom: "1px dotted rgba(26,26,26,0.2)",
                          cursor: "pointer",
                        }}
                      >
                        <h4
                          style={{
                            fontFamily: "'Crimson Text', serif",
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#1a1a1a",
                            lineHeight: 1.3,
                            marginBottom: 4,
                            transition: "color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#8b1a1a";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#1a1a1a";
                          }}
                        >
                          {post.title}
                        </h4>
                        <p
                          style={{
                            fontFamily: "'Libre Baskerville', serif",
                            fontSize: 11,
                            color: "#666",
                            lineHeight: 1.6,
                          }}
                        >
                          {post.views.toLocaleString()} views
                          {post.readingTime ? ` · ${post.readingTime}` : ""}
                        </p>
                      </div>
                    </Link>
                  ))
                : [
                    {
                      title: "AI-Powered Tutoring",
                      body: "Personal mentor that adapts to your learning style in real-time.",
                    },
                    {
                      title: "Deep Learning Insights",
                      body: "Understanding through scientifically structured learning levels.",
                    },
                    {
                      title: "Community Knowledge",
                      body: "Industry perspectives from our growing author community.",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: 16,
                        paddingBottom: 16,
                        borderBottom: "1px dotted rgba(26,26,26,0.2)",
                      }}
                    >
                      <h4
                        style={{
                          fontFamily: "'Crimson Text', serif",
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#1a1a1a",
                          lineHeight: 1.3,
                          marginBottom: 4,
                        }}
                      >
                        {item.title}
                      </h4>
                      <p
                        style={{
                          fontFamily: "'Libre Baskerville', serif",
                          fontSize: 11,
                          color: "#666",
                          lineHeight: 1.6,
                        }}
                      >
                        {item.body}
                      </p>
                    </div>
                  ))}

              {/* CTA */}
              <button
                type="button"
                onClick={() =>
                  router.push(
                    userId ? "/teacher/posts/create" : "/auth/register",
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #1a1a1a",
                  background: "transparent",
                  fontFamily: "'Crimson Text', serif",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#1a1a1a",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1a1a1a";
                  e.currentTarget.style.color = "#f5f0e8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#1a1a1a";
                }}
              >
                <PenSquare className="w-3 h-3" />
                Write an Article <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>
          </div>

          {/* Mobile layout - stacked single column */}
          <div className="mt-8 lg:hidden space-y-6">
            {/* Breaking headline */}
            <motion.div variants={fadeUp}>
              <div
                className="text-center mb-4"
                style={{
                  background: "#8b1a1a",
                  color: "#f5f0e8",
                  padding: "4px 12px",
                  display: "inline-block",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Crimson Text', serif",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                  }}
                >
                  Breaking &bull; Today&apos;s Top Story
                </span>
              </div>

              <div style={{ minHeight: 100 }}>
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={headlineIdx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      fontFamily: "'Crimson Text', serif",
                      fontSize: "clamp(1.5rem, 6vw, 2.2rem)",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      lineHeight: 1.15,
                      textAlign: "center",
                    }}
                  >
                    {HEADLINES[headlineIdx]}
                  </motion.h2>
                </AnimatePresence>
              </div>

              <p
                className="text-center"
                style={{
                  fontFamily: "'Libre Baskerville', serif",
                  fontSize: 13,
                  fontStyle: "italic",
                  color: "#666",
                  lineHeight: 1.8,
                  margin: "0 auto 20px",
                }}
              >
                Our contributors have published {totalArticles} articles
                spanning every frontier of modern knowledge.
              </p>
            </motion.div>

            {/* Mobile search */}
            <motion.div variants={fadeUp}>
              <form onSubmit={handleSearch}>
                <div
                  style={{
                    border: "2px solid #1a1a1a",
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(255,255,255,0.5)",
                  }}
                >
                  <input
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="Search articles..."
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      padding: "12px 16px",
                      fontFamily: "'Libre Baskerville', serif",
                      fontSize: 13,
                      color: "#1a1a1a",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: "#8b1a1a",
                      border: "none",
                      color: "#f5f0e8",
                      padding: "12px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "'Crimson Text', serif",
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Go <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Mobile stats row */}
            <motion.div
              variants={fadeUp}
              className="flex justify-around"
              style={{
                borderTop: "2px solid #1a1a1a",
                borderBottom: "2px solid #1a1a1a",
                padding: "12px 0",
              }}
            >
              {[
                { label: "Articles", value: isLoading ? "..." : `${totalArticles}` },
                { label: "Readers", value: isLoading ? "..." : formatStat(totalReaders) },
                { label: "Authors", value: isLoading ? "..." : `${totalAuthors}` },
              ].map((s, i) => (
                <div key={s.label} className="text-center" style={{ borderRight: i < 2 ? "1px solid rgba(26,26,26,0.2)" : "none", flex: 1 }}>
                  <span
                    style={{
                      fontFamily: "'Crimson Text', serif",
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#1a1a1a",
                      display: "block",
                    }}
                  >
                    {s.value}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Libre Baskerville', serif",
                      fontSize: 9,
                      color: "#666",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Bottom rule */}
          <motion.div variants={fadeUp}>
            <div
              style={{
                borderTop: "3px double #1a1a1a",
                marginTop: 24,
                paddingTop: 8,
              }}
            >
              <div className="flex justify-between items-center">
                <span
                  style={{
                    fontFamily: "'Libre Baskerville', serif",
                    fontSize: 9,
                    color: "#999",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Continued on page A2...
                </span>
                <span
                  style={{
                    fontFamily: "'Libre Baskerville', serif",
                    fontSize: 9,
                    color: "#999",
                  }}
                >
                  &copy; 2026 Taxomind Publishing
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
