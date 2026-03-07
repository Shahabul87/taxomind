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
import { blogFonts, blogColors, paperTexture } from "./types";

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
  onSearch?: (query: string) => void;
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
  onSearch,
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
      onSearch?.(searchVal.trim());
      const articlesSection = document.getElementById("articles-section");
      if (articlesSection) {
        articlesSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [searchVal, onSearch],
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
  const hasSubstantialContent = totalArticles >= 5 && totalReaders >= 50;

  return (
    <section
      className="relative overflow-hidden min-h-[500px] lg:min-h-[700px]"
      style={{
        background: blogColors.cream,
        backgroundImage: paperTexture,
      }}
    >

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="pt-8 sm:pt-12 pb-8"
        >
          {/* Masthead */}
          <motion.div variants={fadeUp} className="text-center">
            {/* Top rule */}
            <div
              style={{ borderTop: `3px double ${blogColors.ink}`, marginBottom: 12 }}
            />
            <div
              className="flex flex-col items-center gap-1 sm:flex-row sm:justify-between"
              style={{
                borderBottom: `1px solid ${blogColors.ink}`,
                paddingBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: blogFonts.body,
                  fontSize: 10,
                  color: blogColors.muted,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Vol. MMXXVI &bull; No. {totalArticles}
              </span>
              <span
                style={{
                  fontFamily: blogFonts.body,
                  fontSize: 10,
                  color: blogColors.muted,
                }}
              >
                {EDITION_DATE}
              </span>
              <span
                className="hidden sm:inline"
                style={{
                  fontFamily: blogFonts.body,
                  fontSize: 10,
                  color: blogColors.muted,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Blog Edition
              </span>
            </div>

            {/* Newspaper name */}
            <h1
              className="font-blog-masthead"
              style={{
                fontSize: "clamp(3rem, 8vw, 6rem)",
                color: blogColors.ink,
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
              <div className="hidden sm:block" style={{ flex: 1, height: 1, background: blogColors.ink }} />
              <span
                style={{
                  fontFamily: blogFonts.headline,
                  fontSize: 13,
                  fontStyle: "italic",
                  color: blogColors.muted,
                  padding: "0 12px",
                }}
              >
                &ldquo;Where Minds Are Forged Through Intelligence&rdquo;
              </span>
              <div className="hidden sm:block" style={{ flex: 1, height: 1, background: blogColors.ink }} />
            </div>

            {/* Sub rule */}
            <div style={{ borderBottom: `3px double ${blogColors.ink}` }} />
          </motion.div>

          {/* Main content - newspaper columns */}
          <div
            className="mt-8 hidden lg:grid"
            style={{
              gridTemplateColumns: hasSubstantialContent ? "1fr 2px 2.2fr 2px 1fr" : "2.2fr 2px 1fr",
              gap: 0,
            }}
          >
            {/* Left column - stats (hidden when sparse content) */}
            {hasSubstantialContent && <motion.div variants={fadeUp} style={{ padding: "0 20px 0 0" }}>
              <div
                style={{
                  borderBottom: `2px solid ${blogColors.ink}`,
                  paddingBottom: 6,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: blogFonts.headline,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: blogColors.ink,
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
                    borderBottom: `1px dotted ${blogColors.rule}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon
                      className="w-3.5 h-3.5"
                      style={{ color: blogColors.accent }}
                    />
                    <span
                      style={{
                        fontFamily: blogFonts.body,
                        fontSize: 10,
                        color: blogColors.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {stat.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: blogFonts.headline,
                      fontSize: 36,
                      fontWeight: 700,
                      color: blogColors.ink,
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
                  border: `2px solid ${blogColors.ink}`,
                  padding: 16,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: blogFonts.headline,
                    fontSize: 14,
                    fontStyle: "italic",
                    color: blogColors.muted,
                    display: "block",
                    lineHeight: 1.4,
                  }}
                >
                  &ldquo;The only investment that never depreciates is
                  education.&rdquo;
                </span>
                <span
                  style={{
                    fontFamily: blogFonts.body,
                    fontSize: 9,
                    color: blogColors.muted,
                    marginTop: 6,
                    display: "block",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  &mdash; Benjamin Franklin
                </span>
              </div>
            </motion.div>}

            {/* Divider (hidden when sparse content) */}
            {hasSubstantialContent && <div style={{ background: blogColors.ink }} />}

            {/* Center column - main headline */}
            <motion.div variants={fadeUp} style={{ padding: "0 28px" }}>
              {/* Breaking headline */}
              <div
                className="text-center mb-4"
                style={{
                  background: blogColors.accent,
                  color: blogColors.cream,
                  padding: "4px 12px",
                  display: "inline-block",
                }}
              >
                <span
                  style={{
                    fontFamily: blogFonts.headline,
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
                      fontFamily: blogFonts.headline,
                      fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                      fontWeight: 700,
                      color: blogColors.ink,
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
                  fontFamily: blogFonts.body,
                  fontSize: 13,
                  fontStyle: "italic",
                  color: blogColors.muted,
                  lineHeight: 1.8,
                  maxWidth: 460,
                  margin: "0 auto 24px",
                }}
              >
                Our contributors have published {totalArticles} articles
                spanning every frontier of modern knowledge. From artificial
                intelligence to creative design, discover the ideas that are
                defining a generation.
              </p>

              {/* Search - like a classifieds search box */}
              <form onSubmit={handleSearch}>
                <div
                  style={{
                    border: `2px solid ${blogColors.ink}`,
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(255,255,255,0.3)",
                  }}
                >
                  <div
                    style={{
                      background: blogColors.ink,
                      color: blogColors.cream,
                      padding: "12px 16px",
                      fontFamily: blogFonts.headline,
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
                      background: "transparent",
                      padding: "12px 16px",
                      fontFamily: blogFonts.body,
                      fontSize: 13,
                      color: blogColors.ink,
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: blogColors.accent,
                      border: "none",
                      color: blogColors.cream,
                      padding: "12px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: blogFonts.headline,
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
                  borderTop: `1px solid ${blogColors.rule}`,
                  paddingTop: 10,
                }}
              >
                {SECTIONS.map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setSearchVal(t); onSearch?.(t); }}
                    className="text-newspaper-muted hover:text-newspaper-accent transition-colors"
                    style={{
                      padding: "4px 14px",
                      fontFamily: blogFonts.headline,
                      fontSize: 12,
                      cursor: "pointer",
                      background: "transparent",
                      border: "none",
                      borderRight:
                        i < SECTIONS.length - 1
                          ? `1px solid ${blogColors.rule}`
                          : "none",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Divider */}
            <div style={{ background: blogColors.ink }} />

            {/* Right column - featured posts */}
            <motion.div variants={fadeUp} style={{ padding: "0 0 0 20px" }}>
              <div
                style={{
                  borderBottom: `2px solid ${blogColors.ink}`,
                  paddingBottom: 6,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: blogFonts.headline,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: blogColors.ink,
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
                      className="group"
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        style={{
                          marginBottom: 16,
                          paddingBottom: 16,
                          borderBottom: `1px dotted ${blogColors.rule}`,
                          cursor: "pointer",
                        }}
                      >
                        <h4
                          className="text-newspaper-ink hover:text-newspaper-accent transition-colors"
                          style={{
                            fontFamily: blogFonts.headline,
                            fontSize: 15,
                            fontWeight: 700,
                            lineHeight: 1.3,
                            marginBottom: 4,
                          }}
                        >
                          {post.title}
                        </h4>
                        <p
                          style={{
                            fontFamily: blogFonts.body,
                            fontSize: 11,
                            color: blogColors.muted,
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
                        borderBottom: `1px dotted ${blogColors.rule}`,
                      }}
                    >
                      <h4
                        style={{
                          fontFamily: blogFonts.headline,
                          fontSize: 15,
                          fontWeight: 700,
                          color: blogColors.ink,
                          lineHeight: 1.3,
                          marginBottom: 4,
                        }}
                      >
                        {item.title}
                      </h4>
                      <p
                        style={{
                          fontFamily: blogFonts.body,
                          fontSize: 11,
                          color: blogColors.muted,
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
                className="w-full bg-transparent border-newspaper-ink text-newspaper-ink hover:bg-[hsl(var(--blog-newspaper-ink))] hover:text-[hsl(var(--blog-newspaper-bg))] transition-colors"
                style={{
                  padding: "10px",
                  borderWidth: 2,
                  borderStyle: "solid",
                  fontFamily: blogFonts.headline,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
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
                  background: blogColors.accent,
                  color: blogColors.cream,
                  padding: "4px 12px",
                  display: "inline-block",
                }}
              >
                <span
                  style={{
                    fontFamily: blogFonts.headline,
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
                      fontFamily: blogFonts.headline,
                      fontSize: "clamp(1.5rem, 6vw, 2.2rem)",
                      fontWeight: 700,
                      color: blogColors.ink,
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
                  fontFamily: blogFonts.body,
                  fontSize: 13,
                  fontStyle: "italic",
                  color: blogColors.muted,
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
                    border: `2px solid ${blogColors.ink}`,
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(255,255,255,0.3)",
                  }}
                >
                  <input
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="Search articles..."
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      padding: "12px 16px",
                      fontFamily: blogFonts.body,
                      fontSize: 13,
                      color: blogColors.ink,
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: blogColors.accent,
                      border: "none",
                      color: blogColors.cream,
                      padding: "12px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: blogFonts.headline,
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

            {/* Mobile stats row (hidden when sparse content) */}
            {hasSubstantialContent && (
              <motion.div
                variants={fadeUp}
                className="flex justify-around"
                style={{
                  borderTop: `2px solid ${blogColors.ink}`,
                  borderBottom: `2px solid ${blogColors.ink}`,
                  padding: "12px 0",
                }}
              >
                {[
                  { label: "Articles", value: isLoading ? "..." : `${totalArticles}` },
                  { label: "Readers", value: isLoading ? "..." : formatStat(totalReaders) },
                  { label: "Authors", value: isLoading ? "..." : `${totalAuthors}` },
                ].map((s, i) => (
                  <div key={s.label} className="text-center" style={{ borderRight: i < 2 ? `1px solid ${blogColors.rule}` : "none", flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: blogFonts.headline,
                        fontSize: "clamp(20px, 5vw, 28px)",
                        fontWeight: 700,
                        color: blogColors.ink,
                        display: "block",
                      }}
                    >
                      {s.value}
                    </span>
                    <span
                      style={{
                        fontFamily: blogFonts.body,
                        fontSize: 9,
                        color: blogColors.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Bottom rule */}
          <motion.div variants={fadeUp}>
            <div
              style={{
                borderTop: `3px double ${blogColors.ink}`,
                marginTop: 24,
                paddingTop: 8,
              }}
            >
              <div className="flex justify-between items-center">
                <span
                  style={{
                    fontFamily: blogFonts.body,
                    fontSize: 9,
                    color: blogColors.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Continued on page A2...
                </span>
                <span
                  style={{
                    fontFamily: blogFonts.body,
                    fontSize: 9,
                    color: blogColors.muted,
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
