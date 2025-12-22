"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Users, TrendingUp, Search, Grid3X3, List, Filter, PlusCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EnterpriseGroupCard, TrendingGroupCard } from "./enterprise-group-card";
import { MobileGroupFilters } from "./mobile-group-filters";
import { GroupsSkeleton } from "./groups-skeleton";

interface GroupData {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  isPrivate: boolean;
  createdAt: Date;
  _count: {
    members: number;
  };
  creator?: {
    name: string | null;
    image: string | null;
  } | null;
}

interface TrendingSectionProps {
  groups: GroupData[];
  isLoading?: boolean;
}

interface MainGroupsSectionProps {
  groups: GroupData[];
  categories: Array<{ id: string; name: string }>;
  viewMode: "grid" | "list";
  currentCategory?: string;
  searchParams: Record<string, string | undefined>;
  isLoading?: boolean;
}

// Section header component
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div
            className={cn(
              "p-2 rounded-lg",
              "bg-gradient-to-br from-[hsl(var(--groups-primary-muted))] to-[hsl(var(--groups-accent-muted))]"
            )}
          >
            <Icon className="w-5 h-5 text-[hsl(var(--groups-primary))]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[hsl(var(--groups-text))]">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-sm text-[hsl(var(--groups-text-muted))] ml-11">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </motion.div>
  );
}

// View mode toggle component
function ViewModeToggle({
  viewMode,
  searchParams,
}: {
  viewMode: "grid" | "list";
  searchParams: Record<string, string | undefined>;
}) {
  return (
    <div
      className={cn(
        "hidden sm:flex items-center p-1 rounded-lg",
        "bg-[hsl(var(--groups-surface))]",
        "border border-[hsl(var(--groups-border))]"
      )}
    >
      <Link
        href={{
          pathname: "/groups",
          query: { ...searchParams, view: "grid" },
        }}
      >
        <Button
          variant={viewMode === "grid" ? "default" : "ghost"}
          size="sm"
          className={cn(
            "rounded-md h-8 w-8 p-0",
            viewMode === "grid" &&
              "bg-[hsl(var(--groups-primary))] hover:bg-[hsl(var(--groups-primary-hover))]"
          )}
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
      </Link>
      <Link
        href={{
          pathname: "/groups",
          query: { ...searchParams, view: "list" },
        }}
      >
        <Button
          variant={viewMode === "list" ? "default" : "ghost"}
          size="sm"
          className={cn(
            "rounded-md h-8 w-8 p-0",
            viewMode === "list" &&
              "bg-[hsl(var(--groups-primary))] hover:bg-[hsl(var(--groups-primary-hover))]"
          )}
        >
          <List className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "text-center py-16 sm:py-20 rounded-2xl",
        "bg-[hsl(var(--groups-surface))]",
        "border-2 border-dashed border-[hsl(var(--groups-border))]"
      )}
    >
      <div
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5",
          "bg-gradient-to-br from-[hsl(var(--groups-primary-muted))] to-[hsl(var(--groups-accent-muted))]"
        )}
      >
        <Search className="w-8 h-8 text-[hsl(var(--groups-primary))]" />
      </div>
      <h3 className="text-xl font-semibold text-[hsl(var(--groups-text))] mb-2">
        No communities found
      </h3>
      <p className="text-[hsl(var(--groups-text-muted))] max-w-md mx-auto mb-6 px-4">
        Try adjusting your search or filters to discover more learning communities.
      </p>
      <Link href="/groups/create">
        <Button
          className={cn(
            "bg-[hsl(var(--groups-primary))] hover:bg-[hsl(var(--groups-primary-hover))]",
            "text-[hsl(var(--groups-primary-foreground))]",
            "font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          )}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create a Community
        </Button>
      </Link>
    </motion.div>
  );
}

// Trending section
export function TrendingSection({ groups, isLoading }: TrendingSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="mb-10 sm:mb-14"
    >
      <div
        className={cn(
          "rounded-2xl p-5 sm:p-7",
          "bg-[hsl(var(--groups-surface-elevated))]",
          "border border-[hsl(var(--groups-border))]",
          "shadow-sm"
        )}
      >
        <SectionHeader
          icon={TrendingUp}
          title="Trending Communities"
          subtitle="Popular groups with active discussions"
          action={
            <Link href="/groups/trending">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-[hsl(var(--groups-primary))] hover:text-[hsl(var(--groups-primary-hover))]",
                  "hover:bg-[hsl(var(--groups-primary-muted))]",
                  "font-medium group"
                )}
              >
                View all
                <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          }
        />

        {isLoading ? (
          <GroupsSkeleton count={5} variant="trending" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {groups.map((group, index) => (
              <TrendingGroupCard key={group.id} group={group} index={index} />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}

// Main groups section
export function MainGroupsSection({
  groups,
  categories,
  viewMode,
  currentCategory,
  searchParams,
  isLoading,
}: MainGroupsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="mb-16 sm:mb-20"
    >
      <div
        className={cn(
          "rounded-2xl p-5 sm:p-7",
          "bg-[hsl(var(--groups-surface-elevated))]",
          "border border-[hsl(var(--groups-border))]",
          "shadow-sm"
        )}
      >
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--groups-text))] mb-2">
            Explore Communities
          </h2>
          <p className="text-[hsl(var(--groups-text-muted))]">
            Discover groups that match your learning goals and interests
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <ViewModeToggle viewMode={viewMode} searchParams={searchParams} />

          <MobileGroupFilters
            categories={categories}
            currentCategory={currentCategory}
          />

          <Link href="/groups/create" className="flex-1 sm:flex-initial sm:ml-auto">
            <Button
              className={cn(
                "w-full sm:w-auto h-10",
                "bg-[hsl(var(--groups-primary))] hover:bg-[hsl(var(--groups-primary-hover))]",
                "text-[hsl(var(--groups-primary-foreground))]",
                "font-semibold shadow-md hover:shadow-lg transition-all duration-300"
              )}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Community
            </Button>
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <GroupsSkeleton count={6} variant={viewMode === "list" ? "list" : "card"} />
        ) : groups.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
              >
                {groups.map((group, index) => (
                  <EnterpriseGroupCard
                    key={group.id}
                    group={group}
                    index={index}
                    variant="grid"
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {groups.map((group, index) => (
                  <EnterpriseGroupCard
                    key={group.id}
                    group={group}
                    index={index}
                    variant="list"
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Pagination placeholder */}
        {groups.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center mt-10"
          >
            <Button
              variant="outline"
              className={cn(
                "border-[hsl(var(--groups-border))]",
                "hover:border-[hsl(var(--groups-primary))]",
                "hover:bg-[hsl(var(--groups-primary-muted))]",
                "text-[hsl(var(--groups-text))]",
                "font-medium"
              )}
            >
              Load More Communities
            </Button>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
