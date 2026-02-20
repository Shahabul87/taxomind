"use client";

import { Users, Star, Eye, Target } from "lucide-react";
import { MetricCard } from "@/components/analytics/enterprise/MetricCard";
import type { CreatorKpiCardsProps } from "./creator-types";

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

// Deterministic trend generation to avoid hydration mismatch
const TREND_WEIGHTS = [0.65, 0.78, 0.72, 0.85, 0.90, 0.82, 0.95, 1.0];

function generateTrend(value: number): number[] {
  if (value === 0) return [];
  return TREND_WEIGHTS.map(w => Math.max(0, Math.round(value * w)));
}

function growthLabel(growth: number): string {
  if (growth === 0) return "No change";
  const sign = growth > 0 ? "+" : "";
  return `${sign}${growth.toFixed(1)}% growth`;
}

export function CreatorKpiCards({ overview, onCardClick }: CreatorKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      <MetricCard
        label="Total Learners"
        value={formatNumber(overview.totalLearners)}
        subtitle={growthLabel(overview.monthlyGrowth)}
        icon={<Users className="w-full h-full" />}
        variant="primary"
        trend={generateTrend(overview.totalLearners)}
        showTrend
        onClick={() => onCardClick("learners")}
      />

      <MetricCard
        label="Course Rating"
        value={overview.averageRating.toFixed(1)}
        unit="/5"
        subtitle={`${formatNumber(overview.totalRatings)} reviews`}
        icon={<Star className="w-full h-full" />}
        variant="warning"
        trend={generateTrend(overview.averageRating * 20)}
        onClick={() => onCardClick("feedback")}
      />

      <MetricCard
        label="Total Views"
        value={formatNumber(overview.totalViews)}
        subtitle={`${formatNumber(overview.totalShares)} shares`}
        icon={<Eye className="w-full h-full" />}
        variant="accent"
        trend={generateTrend(overview.totalViews)}
        onClick={() => onCardClick("engagement")}
      />

      <MetricCard
        label="Completions"
        value={formatNumber(overview.totalCompletions)}
        subtitle={`${overview.totalCourses} courses`}
        icon={<Target className="w-full h-full" />}
        variant="success"
        trend={generateTrend(overview.totalCompletions)}
        showTrend
        onClick={() => onCardClick("overview")}
      />
    </div>
  );
}
