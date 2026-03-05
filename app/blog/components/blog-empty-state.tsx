"use client";

import Link from "next/link";
import {
  PenSquare,
  Search,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  warmBg: "#eee7db",
};

// ============================================================================
// Types
// ============================================================================

interface EmptyStateProps {
  variant?: "no-posts" | "no-results" | "no-category" | "loading-error";
  searchQuery?: string;
  categoryName?: string;
  userId?: string;
  onClearFilters?: () => void;
  onRetry?: () => void;
  className?: string;
}

// ============================================================================
// No Posts Empty State
// ============================================================================

function NoPostsState({ userId }: { userId?: string }) {
  return (
    <div style={{
      background: colors.cream,
      border: `1px solid ${colors.rule}`,
      padding: "48px 32px",
      textAlign: "center",
    }}>
      {/* Decorative rule */}
      <div style={{
        width: 60,
        height: 2,
        background: colors.accent,
        margin: "0 auto 24px",
      }} />

      {/* Quill icon placeholder */}
      <div style={{
        fontFamily: fonts.headline,
        fontSize: 48,
        color: colors.rule,
        marginBottom: 16,
      }}>
        &#9998;
      </div>

      <h2 style={{
        fontFamily: fonts.headline,
        fontSize: 28,
        fontWeight: 700,
        color: colors.ink,
        marginBottom: 12,
      }}>
        The Press Awaits
      </h2>

      <p style={{
        fontFamily: fonts.body,
        fontSize: 14,
        lineHeight: 1.7,
        color: colors.muted,
        maxWidth: 420,
        margin: "0 auto 24px",
      }}>
        Our editorial pages are waiting for their first story. Share your insights,
        tutorials, or experiences with our growing readership.
      </p>

      {/* Feature highlights */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 24,
        marginBottom: 28,
        flexWrap: "wrap",
      }}>
        {[
          { label: "Share Ideas", desc: "Inspire readers" },
          { label: "Build Audience", desc: "Grow your reach" },
          { label: "Get Featured", desc: "Front page stories" },
        ].map((item) => (
          <div key={item.label} style={{
            textAlign: "center",
            padding: "12px 16px",
            border: `1px dotted ${colors.rule}`,
          }}>
            <p style={{
              fontFamily: fonts.headline,
              fontSize: 14,
              fontWeight: 700,
              color: colors.ink,
              marginBottom: 2,
            }}>
              {item.label}
            </p>
            <p style={{
              fontFamily: fonts.mono,
              fontSize: 10,
              color: colors.muted,
            }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <Link href={userId ? "/dashboard/user" : "/auth/login"}>
        <button style={{
          padding: "12px 28px",
          fontFamily: fonts.mono,
          fontSize: 12,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: colors.cream,
          background: colors.ink,
          border: `1px solid ${colors.ink}`,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          transition: "background 0.2s",
        }}>
          <PenSquare style={{ width: 14, height: 14 }} />
          {userId ? "Go to Dashboard" : "Sign In to Write"}
          <ArrowRight style={{ width: 14, height: 14 }} />
        </button>
      </Link>

      {/* Bottom decorative rule */}
      <div style={{
        width: 60,
        height: 2,
        background: colors.accent,
        margin: "28px auto 0",
      }} />
    </div>
  );
}

// ============================================================================
// No Search Results State
// ============================================================================

function NoResultsState({
  searchQuery,
  onClearFilters,
}: {
  searchQuery?: string;
  onClearFilters?: () => void;
}) {
  return (
    <div style={{
      background: colors.cream,
      border: `1px solid ${colors.rule}`,
      padding: "40px 32px",
      textAlign: "center",
    }}>
      <div style={{
        width: 48,
        height: 48,
        margin: "0 auto 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `2px solid ${colors.rule}`,
        borderRadius: "50%",
      }}>
        <Search style={{ width: 22, height: 22, color: colors.muted }} />
      </div>

      <h3 style={{
        fontFamily: fonts.headline,
        fontSize: 22,
        fontWeight: 700,
        color: colors.ink,
        marginBottom: 8,
      }}>
        No Articles Found
      </h3>

      <p style={{
        fontFamily: fonts.body,
        fontSize: 13,
        lineHeight: 1.7,
        color: colors.muted,
        maxWidth: 400,
        margin: "0 auto 20px",
      }}>
        {searchQuery ? (
          <>
            We couldn&apos;t find any articles matching &ldquo;<span style={{ fontWeight: 600, color: colors.accent }}>{searchQuery}</span>&rdquo;.
            Try a different search term or explore our sections.
          </>
        ) : (
          "No articles match your current filters. Try adjusting your search criteria."
        )}
      </p>

      {/* Suggestions */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 6,
        marginBottom: 20,
      }}>
        <span style={{
          fontFamily: fonts.mono,
          fontSize: 10,
          color: colors.muted,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          alignSelf: "center",
          marginRight: 4,
        }}>
          Try:
        </span>
        {["tutorials", "guides", "tips", "best practices"].map((suggestion) => (
          <span
            key={suggestion}
            style={{
              padding: "4px 10px",
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.ink,
              border: `1px solid ${colors.rule}`,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {suggestion}
          </span>
        ))}
      </div>

      {onClearFilters && (
        <button
          onClick={onClearFilters}
          style={{
            padding: "10px 20px",
            fontFamily: fonts.mono,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: colors.ink,
            background: "transparent",
            border: `1px solid ${colors.rule}`,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s",
          }}
        >
          <RefreshCw style={{ width: 12, height: 12 }} />
          Clear All Filters
        </button>
      )}
    </div>
  );
}

// ============================================================================
// No Category Results State
// ============================================================================

function NoCategoryState({
  categoryName,
  userId,
  onClearFilters,
}: {
  categoryName?: string;
  userId?: string;
  onClearFilters?: () => void;
}) {
  return (
    <div style={{
      background: colors.cream,
      border: `1px solid ${colors.rule}`,
      padding: "40px 32px",
      textAlign: "center",
    }}>
      <div style={{
        fontFamily: fonts.headline,
        fontSize: 36,
        color: colors.rule,
        marginBottom: 12,
      }}>
        &#167;
      </div>

      <h3 style={{
        fontFamily: fonts.headline,
        fontSize: 22,
        fontWeight: 700,
        color: colors.ink,
        marginBottom: 8,
      }}>
        No Articles in {categoryName || "This Section"}
      </h3>

      <p style={{
        fontFamily: fonts.body,
        fontSize: 13,
        lineHeight: 1.7,
        color: colors.muted,
        maxWidth: 400,
        margin: "0 auto 20px",
      }}>
        This section doesn&apos;t have any articles yet. Be the first to contribute
        or explore other sections.
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            style={{
              padding: "10px 20px",
              fontFamily: fonts.mono,
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: colors.ink,
              background: "transparent",
              border: `1px solid ${colors.rule}`,
              cursor: "pointer",
            }}
          >
            View All Articles
          </button>
        )}
        <Link href={userId ? "/dashboard/user" : "/auth/login"}>
          <button style={{
            padding: "10px 20px",
            fontFamily: fonts.mono,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: colors.cream,
            background: colors.ink,
            border: `1px solid ${colors.ink}`,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}>
            <PenSquare style={{ width: 12, height: 12 }} />
            {userId ? "Go to Dashboard" : "Sign In to Write"}
          </button>
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// Loading Error State
// ============================================================================

function LoadingErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div style={{
      background: colors.cream,
      border: `1px solid ${colors.accent}`,
      padding: "40px 32px",
      textAlign: "center",
    }}>
      <div style={{
        width: 48,
        height: 48,
        margin: "0 auto 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `2px solid ${colors.accent}`,
        borderRadius: "50%",
      }}>
        <RefreshCw style={{ width: 22, height: 22, color: colors.accent }} />
      </div>

      <h3 style={{
        fontFamily: fonts.headline,
        fontSize: 22,
        fontWeight: 700,
        color: colors.ink,
        marginBottom: 8,
      }}>
        Something Went Wrong
      </h3>

      <p style={{
        fontFamily: fonts.body,
        fontSize: 13,
        lineHeight: 1.7,
        color: colors.muted,
        maxWidth: 400,
        margin: "0 auto 20px",
      }}>
        We couldn&apos;t load the articles. Please check your connection and try again.
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "10px 20px",
            fontFamily: fonts.mono,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: colors.cream,
            background: colors.accent,
            border: `1px solid ${colors.accent}`,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCw style={{ width: 12, height: 12 }} />
          Try Again
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Main Empty State Component
// ============================================================================

export function BlogEmptyState({
  variant = "no-posts",
  searchQuery,
  categoryName,
  userId,
  onClearFilters,
  onRetry,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("w-full", className)}>
      {variant === "no-posts" && <NoPostsState userId={userId} />}
      {variant === "no-results" && (
        <NoResultsState searchQuery={searchQuery} onClearFilters={onClearFilters} />
      )}
      {variant === "no-category" && (
        <NoCategoryState categoryName={categoryName} userId={userId} onClearFilters={onClearFilters} />
      )}
      {variant === "loading-error" && <LoadingErrorState onRetry={onRetry} />}
    </div>
  );
}

export { NoPostsState, NoResultsState, NoCategoryState, LoadingErrorState };
