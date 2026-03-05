"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  ChevronRight,
  BookMarked,
  Send,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { BlogPost, BlogStatistics } from "./types";

// ============================================================================
// Shared editorial styles
// ============================================================================

const fonts = {
  headline: "'Crimson Text', 'Georgia', 'Times New Roman', serif",
  body: "'Libre Baskerville', 'Georgia', serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
};

const colors = {
  cream: "#f5f0e8",
  ink: "#1a1a1a",
  accent: "#8b1a1a",
  muted: "#5c5c5c",
  rule: "#c4b9a8",
  lightRule: "#d8d0c4",
  warmBg: "#eee7db",
};

// ============================================================================
// Types
// ============================================================================

interface BlogSidebarProps {
  trendingPosts: BlogPost[];
  statistics?: BlogStatistics | null;
  categories: { id: string; name: string; count: number }[];
  onCategorySelect?: (categoryId: string) => void;
  className?: string;
  variant?: "desktop" | "mobile";
}

interface Author {
  id: string;
  name: string;
  image?: string | null;
  articleCount: number;
}

// ============================================================================
// Section Header
// ============================================================================

function SidebarSectionHeader({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{
        fontFamily: fonts.headline,
        fontSize: 18,
        fontWeight: 700,
        color: colors.ink,
        marginBottom: 8,
      }}>
        {title}
      </h3>
      <div style={{
        height: 2,
        background: colors.ink,
        width: "100%",
      }} />
      <div style={{
        height: 1,
        background: colors.ink,
        width: "100%",
        marginTop: 2,
      }} />
    </div>
  );
}

// ============================================================================
// Trending Posts Widget — "Most Read"
// ============================================================================

function TrendingWidget({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <div style={{
      background: colors.cream,
      border: `1px solid ${colors.rule}`,
      padding: 20,
    }}>
      <SidebarSectionHeader title="Most Read" />

      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {posts.slice(0, 5).map((post, index) => (
          <li
            key={post.id}
            style={{
              borderBottom: index < Math.min(posts.length, 5) - 1 ? `1px dotted ${colors.rule}` : "none",
            }}
          >
            <Link
              href={`/blog/${post.id}`}
              className="group"
              style={{ textDecoration: "none", display: "flex", gap: 12, padding: "12px 0" }}
              aria-label={`Read: ${post.title}`}
            >
              {/* Rank Number */}
              <span style={{
                fontFamily: fonts.headline,
                fontSize: 28,
                fontWeight: 700,
                color: index === 0 ? colors.accent : colors.lightRule,
                lineHeight: 1,
                flexShrink: 0,
                width: 28,
                textAlign: "center",
              }}>
                {index + 1}
              </span>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4
                  style={{
                    fontFamily: fonts.headline,
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    color: colors.ink,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    marginBottom: 4,
                    transition: "color 0.2s",
                  }}
                  className="group-hover:!text-[#8b1a1a]"
                >
                  {post.title}
                </h4>
                <div style={{
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  color: colors.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  {post.user.name && (
                    <>
                      <span style={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: 11 }}>
                        {post.user.name}
                      </span>
                      <span style={{ color: colors.rule }}>|</span>
                    </>
                  )}
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Eye style={{ width: 10, height: 10 }} />
                    {post.views.toLocaleString()}
                  </span>
                </div>
              </div>

              <ChevronRight
                style={{
                  width: 14,
                  height: 14,
                  color: colors.rule,
                  flexShrink: 0,
                  marginTop: 2,
                  transition: "color 0.2s, transform 0.2s",
                }}
                className="group-hover:!text-[#8b1a1a] group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ============================================================================
// Newsletter Widget — "The Dispatch"
// ============================================================================

function NewsletterWidget({ subscriberCount }: { subscriberCount?: number }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubscribed(true);
    setIsSubmitting(false);
  };

  const formatSubscribers = (count?: number) => {
    if (!count || count < 100) return null;
    if (count >= 10000) return `${Math.floor(count / 1000)}K+`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`;
    return `${count}+`;
  };

  const displayCount = formatSubscribers(subscriberCount);

  return (
    <div style={{
      background: colors.warmBg,
      border: `1px solid ${colors.rule}`,
      padding: 20,
    }}>
      <SidebarSectionHeader title="The Dispatch" />

      {isSubscribed ? (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <p style={{
            fontFamily: fonts.headline,
            fontSize: 20,
            fontWeight: 700,
            color: colors.ink,
            marginBottom: 8,
          }}>
            Welcome Aboard
          </p>
          <p style={{
            fontFamily: fonts.body,
            fontSize: 13,
            color: colors.muted,
            lineHeight: 1.6,
          }}>
            You&apos;re now subscribed. Check your inbox for a confirmation.
          </p>
        </div>
      ) : (
        <>
          <p style={{
            fontFamily: fonts.body,
            fontSize: 13,
            color: colors.muted,
            lineHeight: 1.7,
            marginBottom: 16,
          }}>
            Get the latest articles and insights delivered to your inbox every week. No spam, unsubscribe anytime.
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="newsletter-email-editorial" className="sr-only">
              Email address
            </label>
            <div style={{ display: "flex", gap: 0 }}>
              <input
                id="newsletter-email-editorial"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                autoComplete="email"
                aria-label="Email address"
                required
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: colors.ink,
                  background: colors.cream,
                  border: `1px solid ${colors.rule}`,
                  borderRight: "none",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: "10px 16px",
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: colors.cream,
                  background: colors.ink,
                  border: `1px solid ${colors.ink}`,
                  cursor: isSubmitting ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "background 0.2s",
                }}
              >
                {isSubmitting ? (
                  <span>...</span>
                ) : (
                  <>
                    <Send style={{ width: 12, height: 12 }} />
                    Subscribe
                  </>
                )}
              </button>
            </div>
          </form>

          {displayCount && (
            <p style={{
              fontFamily: fonts.mono,
              fontSize: 10,
              color: colors.muted,
              marginTop: 10,
              textAlign: "center",
            }}>
              Join <span style={{ fontWeight: 600, color: colors.accent }}>{displayCount}</span> readers
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// Popular Topics Widget — "Sections"
// ============================================================================

function PopularTopicsWidget({
  categories,
  statistics,
  onCategorySelect,
}: {
  categories: { id: string; name: string; count: number }[];
  statistics?: BlogStatistics | null;
  onCategorySelect?: (categoryId: string) => void;
}) {
  const getTopics = () => {
    const actualCategories = categories
      .filter(c => c.id !== "all" && c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    if (statistics?.popularCategories && statistics.popularCategories.length > 0) {
      const statsCategories = statistics.popularCategories.slice(0, 8);
      const merged = [...actualCategories];
      statsCategories.forEach(sc => {
        if (!merged.find(m => m.name.toLowerCase() === sc.category.toLowerCase())) {
          merged.push({ id: sc.category.toLowerCase(), name: sc.category, count: sc.count });
        }
      });
      return merged.slice(0, 8);
    }
    return actualCategories;
  };

  const topics = getTopics();
  if (topics.length === 0) return null;

  return (
    <div style={{
      background: colors.cream,
      border: `1px solid ${colors.rule}`,
      padding: 20,
    }}>
      <SidebarSectionHeader title="Sections" />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onCategorySelect?.(topic.id)}
            className="group"
            style={{
              padding: "6px 12px",
              fontFamily: fonts.mono,
              fontSize: 11,
              fontWeight: 500,
              color: colors.ink,
              background: "transparent",
              border: `1px solid ${colors.rule}`,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.ink;
              e.currentTarget.style.color = colors.cream;
              e.currentTarget.style.borderColor = colors.ink;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = colors.ink;
              e.currentTarget.style.borderColor = colors.rule;
            }}
          >
            {topic.name}
            {topic.count > 0 && (
              <span style={{
                fontSize: 10,
                opacity: 0.6,
              }}>
                ({topic.count})
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Top Contributors Widget — "Our Columnists"
// ============================================================================

function TopContributorsWidget({
  posts,
}: {
  posts: BlogPost[];
  statistics?: BlogStatistics | null;
}) {
  const getAuthors = (): Author[] => {
    const authorMap = new Map<string, Author>();
    posts.forEach(post => {
      if (post.user.name) {
        const existing = authorMap.get(post.user.name);
        if (existing) {
          existing.articleCount += 1;
        } else {
          authorMap.set(post.user.name, {
            id: post.user.name.toLowerCase().replace(/\s+/g, "-"),
            name: post.user.name,
            image: post.user.image || null,
            articleCount: 1,
          });
        }
      }
    });
    return Array.from(authorMap.values())
      .sort((a, b) => b.articleCount - a.articleCount)
      .slice(0, 5);
  };

  const authors = getAuthors();
  if (authors.length === 0) return null;

  return (
    <div style={{
      background: colors.cream,
      border: `1px solid ${colors.rule}`,
      padding: 20,
    }}>
      <SidebarSectionHeader title="Our Columnists" />

      <div>
        {authors.map((author, index) => (
          <div
            key={author.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderBottom: index < authors.length - 1 ? `1px dotted ${colors.rule}` : "none",
            }}
          >
            <Avatar className="w-10 h-10" style={{ border: `1px solid ${colors.rule}` }}>
              {author.image ? (
                <AvatarImage src={author.image} alt={author.name} />
              ) : null}
              <AvatarFallback style={{
                background: colors.warmBg,
                color: colors.ink,
                fontFamily: fonts.headline,
                fontWeight: 700,
                fontSize: 14,
              }}>
                {author.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: fonts.headline,
                fontSize: 14,
                fontWeight: 600,
                color: colors.ink,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {author.name}
              </p>
              <p style={{
                fontFamily: fonts.mono,
                fontSize: 10,
                color: colors.muted,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}>
                <BookMarked style={{ width: 10, height: 10 }} />
                {author.articleCount} {author.articleCount === 1 ? "article" : "articles"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Sidebar Component
// ============================================================================

export function BlogSidebarEnhanced({
  trendingPosts,
  statistics,
  categories,
  onCategorySelect,
  className,
  variant = "desktop",
}: BlogSidebarProps) {
  return (
    <div className={cn("space-y-5", className)}>
      <TrendingWidget posts={trendingPosts} />
      <NewsletterWidget subscriberCount={statistics?.totalReaders} />
      <PopularTopicsWidget
        categories={categories}
        statistics={statistics}
        onCategorySelect={onCategorySelect}
      />
      <TopContributorsWidget
        posts={trendingPosts}
        statistics={statistics}
      />
    </div>
  );
}

export { TrendingWidget, NewsletterWidget, PopularTopicsWidget, TopContributorsWidget };
