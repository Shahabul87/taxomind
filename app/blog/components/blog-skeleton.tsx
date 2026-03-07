/**
 * Blog Loading Skeletons — Broadsheet Editorial Style
 */

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { blogColors } from "./types";

const colors = {
  cream: blogColors.cream,
  rule: blogColors.rule,
  warmBg: blogColors.warmBg,
};

export function BlogCardSkeleton() {
  return (
    <div style={{
      background: colors.cream,
      border: `1px solid ${colors.rule}`,
      display: "flex",
      flexDirection: "column",
      height: "100%",
    }}>
      {/* Image Skeleton */}
      <div style={{ height: 200, width: "100%", background: colors.warmBg }}>
        <Skeleton className="w-full h-full rounded-none" style={{ background: colors.warmBg }} />
      </div>

      {/* Content Skeleton */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Category & Time */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Skeleton className="h-3 w-16 rounded-none" style={{ background: colors.warmBg }} />
          <Skeleton className="h-3 w-14 rounded-none" style={{ background: colors.warmBg }} />
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Skeleton className="h-5 w-full rounded-none" style={{ background: colors.warmBg }} />
          <Skeleton className="h-5 w-4/5 rounded-none" style={{ background: colors.warmBg }} />
        </div>

        {/* Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Skeleton className="h-3 w-full rounded-none" style={{ background: colors.warmBg }} />
          <Skeleton className="h-3 w-3/4 rounded-none" style={{ background: colors.warmBg }} />
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px dotted ${colors.rule}`, paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Skeleton className="h-3 w-24 rounded-none" style={{ background: colors.warmBg }} />
            <Skeleton className="h-3 w-20 rounded-none" style={{ background: colors.warmBg }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div style={{
      minHeight: "80vh",
      background: colors.cream,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}>
        <div style={{
          maxWidth: 800,
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}>
          <Skeleton className="h-8 w-48 rounded-none" style={{ background: colors.warmBg }} />
          <Skeleton className="h-12 w-full rounded-none" style={{ background: colors.warmBg }} />
          <Skeleton className="h-4 w-3/4 rounded-none" style={{ background: colors.warmBg }} />
          <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
            <Skeleton className="h-10 w-36 rounded-none" style={{ background: colors.warmBg }} />
            <Skeleton className="h-10 w-36 rounded-none" style={{ background: colors.warmBg }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: colors.cream, border: `1px solid ${colors.rule}`, padding: 20 }}>
        <Skeleton className="h-5 w-28 rounded-none mb-3" style={{ background: colors.warmBg }} />
        <div style={{ height: 2, background: colors.rule, marginBottom: 16 }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            display: "flex",
            gap: 12,
            padding: "12px 0",
            borderBottom: i < 5 ? `1px dotted ${colors.rule}` : "none",
          }}>
            <Skeleton className="h-7 w-7 rounded-none" style={{ background: colors.warmBg }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <Skeleton className="h-3 w-full rounded-none" style={{ background: colors.warmBg }} />
              <Skeleton className="h-3 w-2/3 rounded-none" style={{ background: colors.warmBg }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BlogPageSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: colors.cream }}>
      <HeroSkeleton />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px" }}>
        <div style={{ marginBottom: 32, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 16 }}>
            <Skeleton className="h-10 flex-1 rounded-none" style={{ background: colors.warmBg }} />
            <Skeleton className="h-10 w-28 rounded-none" style={{ background: colors.warmBg }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-none" style={{ background: colors.warmBg }} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
