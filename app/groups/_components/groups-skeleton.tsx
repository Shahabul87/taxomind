"use client";

import { cn } from "@/lib/utils";

interface GroupsSkeletonProps {
  count?: number;
  variant?: "card" | "list" | "trending";
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "groups-skeleton rounded-lg",
        className
      )}
    />
  );
}

function TrendingGroupSkeleton({ index }: { index: number }) {
  return (
    <div
      className={cn(
        "groups-entrance rounded-xl p-4 border border-[hsl(var(--groups-border-subtle))]",
        "bg-[hsl(var(--groups-surface-elevated))]",
        `groups-entrance-delay-${index + 1}`
      )}
    >
      {/* Avatar */}
      <SkeletonPulse className="w-12 h-12 rounded-full mb-3" />

      {/* Title */}
      <SkeletonPulse className="h-4 w-3/4 mb-2" />

      {/* Description */}
      <SkeletonPulse className="h-3 w-full mb-1" />
      <SkeletonPulse className="h-3 w-2/3 mb-3" />

      {/* Badge */}
      <SkeletonPulse className="h-5 w-16 rounded-full mb-2" />

      {/* Members count */}
      <SkeletonPulse className="h-3 w-20" />
    </div>
  );
}

function GroupCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className={cn(
        "groups-entrance rounded-2xl overflow-hidden",
        "border border-[hsl(var(--groups-border))]",
        "bg-[hsl(var(--groups-surface-elevated))]",
        `groups-entrance-delay-${(index % 6) + 1}`
      )}
    >
      {/* Image placeholder */}
      <SkeletonPulse className="h-40 w-full rounded-none" />

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <SkeletonPulse className="h-6 w-3/4 mb-3" />

        {/* Description lines */}
        <SkeletonPulse className="h-4 w-full mb-2" />
        <SkeletonPulse className="h-4 w-5/6 mb-4" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--groups-border-subtle))]">
          <div className="flex items-center gap-4">
            <SkeletonPulse className="h-4 w-16" />
            <SkeletonPulse className="h-4 w-20" />
          </div>
          <SkeletonPulse className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function GroupListSkeleton({ index }: { index: number }) {
  return (
    <div
      className={cn(
        "groups-entrance flex flex-col sm:flex-row gap-4 p-4 rounded-xl",
        "border border-[hsl(var(--groups-border))]",
        "bg-[hsl(var(--groups-surface-elevated))]",
        `groups-entrance-delay-${(index % 6) + 1}`
      )}
    >
      {/* Image placeholder */}
      <SkeletonPulse className="w-full sm:w-48 h-32 rounded-lg flex-shrink-0" />

      {/* Content */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row justify-between gap-2 mb-2">
          <SkeletonPulse className="h-6 w-48" />
          <SkeletonPulse className="h-6 w-20 rounded-full" />
        </div>

        <SkeletonPulse className="h-4 w-full mb-2" />
        <SkeletonPulse className="h-4 w-4/5 mb-4" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-auto">
          <SkeletonPulse className="h-4 w-24" />
          <SkeletonPulse className="h-4 w-28" />
          <SkeletonPulse className="h-9 w-28 rounded-lg ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function GroupsSkeleton({ count = 6, variant = "card" }: GroupsSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "trending") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {items.map((i) => (
          <TrendingGroupSkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-4">
        {items.map((i) => (
          <GroupListSkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((i) => (
        <GroupCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="groups-hero-mesh groups-grain relative min-h-[400px] sm:min-h-[480px] rounded-2xl overflow-hidden">
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        {/* Badge */}
        <SkeletonPulse className="h-8 w-40 rounded-full mb-6" />

        {/* Title */}
        <SkeletonPulse className="h-12 sm:h-16 w-3/4 max-w-xl mb-4" />
        <SkeletonPulse className="h-12 sm:h-16 w-1/2 max-w-md mb-6" />

        {/* Subtitle */}
        <SkeletonPulse className="h-5 w-full max-w-lg mb-2" />
        <SkeletonPulse className="h-5 w-4/5 max-w-md mb-8" />

        {/* Search and button */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
          <SkeletonPulse className="flex-1 h-14 rounded-xl" />
          <SkeletonPulse className="h-14 w-40 rounded-xl" />
        </div>

        {/* Stats */}
        <div className="flex gap-8 mt-8">
          <SkeletonPulse className="h-12 w-24" />
          <SkeletonPulse className="h-12 w-24" />
          <SkeletonPulse className="h-12 w-24" />
        </div>
      </div>
    </div>
  );
}

export function TrendingSectionSkeleton() {
  return (
    <section className="mb-10">
      <div
        className={cn(
          "rounded-2xl p-6 border border-[hsl(var(--groups-border))]",
          "bg-[hsl(var(--groups-surface-elevated))]"
        )}
      >
        <div className="flex justify-between items-center mb-6">
          <SkeletonPulse className="h-7 w-48" />
          <SkeletonPulse className="h-9 w-24 rounded-lg" />
        </div>
        <GroupsSkeleton count={5} variant="trending" />
      </div>
    </section>
  );
}
