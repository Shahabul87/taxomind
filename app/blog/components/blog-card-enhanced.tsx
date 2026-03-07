"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  MessageCircle,
  Eye,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { sanitizeHtml } from "@/lib/validations/blog";

// ============================================================================
// Types
// ============================================================================

interface BlogCardProps {
  post: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    published?: boolean | null;
    category: string | null;
    createdAt: string | Date;
    views?: number;
    comments?: Array<{ id: string }> | { length: number };
    user?: { name: string | null; image?: string | null };
    readingTime?: string;
  };
  variant?: "grid" | "list" | "featured" | "compact";
  className?: string;
  priority?: boolean;
  index?: number;
}

// ============================================================================
// Shared editorial styles
// ============================================================================

import { blogFonts as fonts, blogColors as colors } from "./types";

// ============================================================================
// Utility Functions
// ============================================================================

const formatDate = (dateString: string | Date) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recent";
  }
};

const formatDateShort = (dateString: string | Date) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recent";
  }
};

const getCleanDescription = (description: string | null) => {
  if (!description)
    return "Discover insights and knowledge in this thoughtfully crafted article.";
  const cleaned = sanitizeHtml(description, { stripTags: true });
  return cleaned.length > 150 ? cleaned.substring(0, 150) + "..." : cleaned;
};

const getReadingTime = (description: string | null, readingTime?: string) => {
  if (readingTime) return readingTime;
  if (!description) return "3 min read";
  const cleaned = sanitizeHtml(description, { stripTags: true });
  const words = cleaned.split(" ").filter((word) => word.length > 0).length;
  return `${Math.max(2, Math.ceil(words / 200))} min read`;
};

const getCommentCount = (
  comments?: Array<{ id: string }> | { length: number }
) => {
  if (!comments) return 0;
  return Array.isArray(comments) ? comments.length : comments.length || 0;
};

const formatViewCount = (views: number | undefined) => {
  if (!views && views !== 0) return "0";
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
};

// ============================================================================
// Grid View Card — Newspaper Column Article
// ============================================================================

function GridCard({ post, priority = false }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.id}`}
      prefetch={true}
      className="group flex flex-col h-full"
      style={{ textDecoration: "none" }}
    >
      <article
        style={{
          background: colors.cream,
          border: `1px solid ${colors.rule}`,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          transition: "box-shadow 0.3s, transform 0.3s",
        }}
        className="hover:shadow-lg hover:-translate-y-0.5"
      >
        {/* Image */}
        <div style={{ position: "relative", height: 200, width: "100%", overflow: "hidden" }}>
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              quality={80}
              loading={priority ? "eager" : "lazy"}
              priority={priority}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: `linear-gradient(135deg, ${colors.warmBg} 0%, ${colors.lightRule} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen style={{ width: 32, height: 32, color: colors.muted, opacity: 0.5 }} />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "16px 16px 12px", display: "flex", flexDirection: "column" }}>
          {/* Category & Reading Time */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}>
            {post.category && (
              <span style={{
                fontFamily: fonts.mono,
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: colors.accent,
              }}>
                {post.category}
              </span>
            )}
            <span style={{
              fontFamily: fonts.mono,
              fontSize: 10,
              color: colors.muted,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}>
              <Clock style={{ width: 10, height: 10 }} />
              {getReadingTime(post.description, post.readingTime)}
            </span>
          </div>

          {/* Headline */}
          <h3
            style={{
              fontFamily: fonts.headline,
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1.3,
              color: colors.ink,
              marginBottom: 8,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              transition: "color 0.2s",
            }}
            className="group-hover:text-newspaper-accent"
          >
            {post.title}
          </h3>

          {/* Description */}
          <p style={{
            fontFamily: fonts.body,
            fontSize: 13,
            lineHeight: 1.6,
            color: colors.muted,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: 12,
          }}>
            {getCleanDescription(post.description)}
          </p>

          {/* Divider */}
          <div style={{
            marginTop: "auto",
            borderTop: `1px dotted ${colors.rule}`,
            paddingTop: 10,
          }}>
            {/* Byline & Stats */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                {post.user?.name && (
                  <span style={{
                    fontFamily: fonts.body,
                    fontSize: 11,
                    fontStyle: "italic",
                    color: colors.muted,
                  }}>
                    By {post.user.name}
                  </span>
                )}
                <div style={{
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  color: colors.muted,
                  marginTop: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <span>{formatDateShort(post.createdAt)}</span>
                  <span style={{ color: colors.rule }}>|</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Eye style={{ width: 10, height: 10 }} />
                    {formatViewCount(post.views)}
                  </span>
                  <span style={{ color: colors.rule }}>|</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <MessageCircle style={{ width: 10, height: 10 }} />
                    {getCommentCount(post.comments)}
                  </span>
                </div>
              </div>
              <ArrowRight
                style={{
                  width: 14,
                  height: 14,
                  color: colors.accent,
                  opacity: 0,
                  transition: "opacity 0.3s, transform 0.3s",
                }}
                className="group-hover:!opacity-100 group-hover:translate-x-0.5"
              />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ============================================================================
// List View Card — Newspaper Horizontal Article
// ============================================================================

function ListCard({ post, priority = false }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.id}`}
      prefetch={true}
      className="group block"
      style={{ textDecoration: "none" }}
    >
      <article
        style={{
          background: colors.cream,
          border: `1px solid ${colors.rule}`,
          display: "flex",
          flexDirection: "row",
          transition: "box-shadow 0.3s",
        }}
        className="hover:shadow-lg flex-col sm:flex-row"
      >
        {/* Image */}
        <div
          style={{
            position: "relative",
            flexShrink: 0,
            overflow: "hidden",
          }}
          className="w-full sm:w-64 md:w-72 h-48 sm:h-auto sm:min-h-[180px]"
        >
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 300px"
              quality={80}
              loading={priority ? "eager" : "lazy"}
              priority={priority}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              minHeight: 180,
              background: `linear-gradient(135deg, ${colors.warmBg} 0%, ${colors.lightRule} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <BookOpen style={{ width: 28, height: 28, color: colors.muted, opacity: 0.5 }} />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Meta Row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 10,
            fontFamily: fonts.mono,
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}>
            {post.category && (
              <span style={{ color: colors.accent, fontWeight: 600 }}>
                {post.category}
              </span>
            )}
            <span style={{ color: colors.rule }}>|</span>
            <span style={{ color: colors.muted }}>{formatDate(post.createdAt)}</span>
            <span style={{ color: colors.rule }}>|</span>
            <span style={{ color: colors.muted, display: "flex", alignItems: "center", gap: 3 }}>
              <Clock style={{ width: 10, height: 10 }} />
              {getReadingTime(post.description, post.readingTime)}
            </span>
          </div>

          {/* Headline */}
          <h3
            style={{
              fontFamily: fonts.headline,
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.25,
              color: colors.ink,
              marginBottom: 8,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              transition: "color 0.2s",
            }}
            className="group-hover:text-newspaper-accent"
          >
            {post.title}
          </h3>

          {/* Description */}
          <p style={{
            fontFamily: fonts.body,
            fontSize: 14,
            lineHeight: 1.7,
            color: colors.muted,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: 14,
          }}>
            {getCleanDescription(post.description)}
          </p>

          {/* Footer */}
          <div style={{
            marginTop: "auto",
            borderTop: `1px dotted ${colors.rule}`,
            paddingTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.muted,
            }}>
              {post.user?.name && (
                <span style={{ fontFamily: fonts.body, fontStyle: "italic" }}>
                  By {post.user.name}
                </span>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Eye style={{ width: 12, height: 12 }} />
                {formatViewCount(post.views)} views
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <MessageCircle style={{ width: 12, height: 12 }} />
                {getCommentCount(post.comments)}
              </span>
            </div>
            <span style={{
              fontFamily: fonts.body,
              fontSize: 12,
              fontStyle: "italic",
              color: colors.accent,
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "gap 0.3s",
            }}
            className="group-hover:gap-2"
            >
              Continue reading
              <ArrowRight style={{ width: 12, height: 12 }} />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ============================================================================
// Featured Card — Lead Story
// ============================================================================

function FeaturedCard({ post, priority = true }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.id}`}
      prefetch={true}
      className="group block"
      style={{ textDecoration: "none" }}
    >
      <article
        style={{
          position: "relative",
          overflow: "hidden",
          border: `1px solid ${colors.rule}`,
          transition: "box-shadow 0.3s",
        }}
        className="hover:shadow-xl"
      >
        {/* Image Container */}
        <div style={{ position: "relative", height: 320, width: "100%", overflow: "hidden" }}>
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={85}
              priority={priority}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, ${colors.lightRule} 0%, ${colors.rule} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <BookOpen style={{ width: 48, height: 48, color: colors.muted, opacity: 0.4 }} />
            </div>
          )}

          {/* Gradient Overlay */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.4) 40%, transparent 70%)",
          }} />

          {/* Content over image */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "24px",
          }}>
            {/* Category label */}
            {post.category && (
              <span style={{
                fontFamily: fonts.mono,
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#e8c8a0",
                borderBottom: "1px solid rgba(232,200,160,0.4)",
                paddingBottom: 2,
                marginBottom: 10,
                display: "inline-block",
              }}>
                {post.category}
              </span>
            )}

            {/* Headline */}
            <h3 style={{
              fontFamily: fonts.headline,
              fontSize: 26,
              fontWeight: 700,
              lineHeight: 1.2,
              color: colors.cream,
              marginBottom: 8,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {post.title}
            </h3>

            {/* Description */}
            <p style={{
              fontFamily: fonts.body,
              fontSize: 13,
              lineHeight: 1.6,
              color: "rgba(245,240,232,0.75)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              marginBottom: 12,
              maxWidth: "90%",
            }}>
              {getCleanDescription(post.description)}
            </p>

            {/* Meta */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontFamily: fonts.mono,
              fontSize: 10,
              color: "rgba(245,240,232,0.6)",
            }}>
              {post.user?.name && (
                <>
                  <span style={{ fontFamily: fonts.body, fontStyle: "italic", color: "rgba(245,240,232,0.8)" }}>
                    By {post.user.name}
                  </span>
                  <span style={{ opacity: 0.3 }}>|</span>
                </>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Eye style={{ width: 10, height: 10 }} />
                {formatViewCount(post.views)}
              </span>
              <span style={{ opacity: 0.3 }}>|</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Clock style={{ width: 10, height: 10 }} />
                {getReadingTime(post.description, post.readingTime)}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ============================================================================
// Compact Card — Brief / Sidebar Item
// ============================================================================

function CompactCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.id}`}
      className="group flex gap-3 py-3"
      style={{
        textDecoration: "none",
        borderBottom: `1px dotted ${colors.rule}`,
      }}
    >
      {/* Thumbnail */}
      <div style={{
        position: "relative",
        width: 64,
        height: 64,
        flexShrink: 0,
        overflow: "hidden",
      }}>
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="64px"
            quality={60}
          />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightRule} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <BookOpen style={{ width: 20, height: 20, color: colors.muted, opacity: 0.5 }} />
          </div>
        )}
      </div>

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
          className="group-hover:text-newspaper-accent"
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
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Eye style={{ width: 10, height: 10 }} />
            {formatViewCount(post.views)}
          </span>
          <span style={{ color: colors.rule }}>|</span>
          <span>{formatDateShort(post.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// Main Export Component
// ============================================================================

export function BlogCardEnhanced({
  post,
  variant = "grid",
  className,
  priority = false,
  index = 0,
}: BlogCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const components = {
    grid: GridCard,
    list: ListCard,
    featured: FeaturedCard,
    compact: CompactCard,
  };

  const Component = components[variant];

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.4,
        delay: shouldReduceMotion ? 0 : Math.min(index * 0.06, 0.36),
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Component post={post} priority={priority} />
    </motion.div>
  );
}

export { GridCard, ListCard, FeaturedCard, CompactCard };
