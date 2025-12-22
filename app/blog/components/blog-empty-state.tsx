"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  PenSquare,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Rocket,
  Lightbulb,
  TrendingUp,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface EmptyStateProps {
  variant?: "no-posts" | "no-results" | "no-category" | "loading-error";
  searchQuery?: string;
  categoryName?: string;
  onClearFilters?: () => void;
  onRetry?: () => void;
  className?: string;
}

// ============================================================================
// No Posts Empty State (When blog has no content)
// ============================================================================

function NoPostsState() {
  return (
    <div className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 rounded-full blur-3xl" />
      </div>

      <Card className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-3xl overflow-hidden">
        <CardContent className="p-8 sm:p-12 lg:p-16">
          <div className="max-w-2xl mx-auto text-center">
            {/* Animated Icon */}
            <div className="relative inline-flex mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                <Rocket className="w-12 h-12 sm:w-16 sm:h-16 text-white animate-bounce" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Be the First to Share
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-lg mx-auto">
              Our blog is waiting for its first story. Share your insights, tutorials,
              or experiences with our growing community.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Lightbulb, title: "Share Ideas", desc: "Inspire others" },
                { icon: TrendingUp, title: "Grow Reach", desc: "Build audience" },
                { icon: Zap, title: "Get Featured", desc: "Top writers" },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="group p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-700/50 dark:to-slate-800/50 border border-slate-200/50 dark:border-slate-600/50 transition-all duration-300 hover:shadow-lg hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{feature.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/teacher/posts/create">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 px-8 py-6 text-base font-semibold group transition-all duration-300"
                >
                  <PenSquare className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Write Your First Article
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// No Search Results State
// ============================================================================

function NoResultsState({
  searchQuery,
  onClearFilters
}: {
  searchQuery?: string;
  onClearFilters?: () => void;
}) {
  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl rounded-2xl overflow-hidden">
      <CardContent className="p-8 sm:p-12 text-center">
        {/* Icon */}
        <div className="relative inline-flex mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
            <Search className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
            <span className="text-lg">?</span>
          </div>
        </div>

        {/* Heading */}
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
          No Articles Found
        </h3>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
          {searchQuery ? (
            <>
              We couldn&apos;t find any articles matching &quot;<span className="font-semibold text-amber-600 dark:text-amber-400">{searchQuery}</span>&quot;.
              Try a different search term or explore our categories.
            </>
          ) : (
            "No articles match your current filters. Try adjusting your search criteria."
          )}
        </p>

        {/* Suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="text-sm text-slate-500">Try searching for:</span>
          {["tutorials", "guides", "tips", "best practices"].map((suggestion) => (
            <button
              key={suggestion}
              className="px-3 py-1 text-sm rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Actions */}
        {onClearFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear All Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// No Category Results State
// ============================================================================

function NoCategoryState({
  categoryName,
  onClearFilters
}: {
  categoryName?: string;
  onClearFilters?: () => void;
}) {
  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl rounded-2xl overflow-hidden">
      <CardContent className="p-8 sm:p-12 text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 flex items-center justify-center">
          <Filter className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
        </div>

        {/* Heading */}
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
          No Articles in {categoryName || "This Category"}
        </h3>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
          This category doesn&apos;t have any articles yet. Be the first to contribute
          or explore other categories.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onClearFilters && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
            >
              View All Articles
            </Button>
          )}
          <Link href="/teacher/posts/create">
            <Button className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white">
              <PenSquare className="w-4 h-4 mr-2" />
              Write Article
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Loading Error State
// ============================================================================

function LoadingErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-red-200/60 dark:border-red-900/60 shadow-xl rounded-2xl overflow-hidden">
      <CardContent className="p-8 sm:p-12 text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 flex items-center justify-center">
          <RefreshCw className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>

        {/* Heading */}
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Something Went Wrong
        </h3>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
          We couldn&apos;t load the articles. Please check your connection and try again.
        </p>

        {/* Actions */}
        {onRetry && (
          <Button
            onClick={onRetry}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Empty State Component
// ============================================================================

export function BlogEmptyState({
  variant = "no-posts",
  searchQuery,
  categoryName,
  onClearFilters,
  onRetry,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("w-full", className)}>
      {variant === "no-posts" && <NoPostsState />}
      {variant === "no-results" && (
        <NoResultsState searchQuery={searchQuery} onClearFilters={onClearFilters} />
      )}
      {variant === "no-category" && (
        <NoCategoryState categoryName={categoryName} onClearFilters={onClearFilters} />
      )}
      {variant === "loading-error" && <LoadingErrorState onRetry={onRetry} />}
    </div>
  );
}

export { NoPostsState, NoResultsState, NoCategoryState, LoadingErrorState };
