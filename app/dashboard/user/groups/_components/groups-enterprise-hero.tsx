"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Search, Users2, Sparkles, ArrowRight, Globe2, BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GroupsSearchInput } from "./groups-search-input";
import { cn } from "@/lib/utils";

interface GroupsEnterpriseHeroProps {
  totalGroups?: number;
  totalMembers?: number;
}

// Floating decorative shapes
function FloatingShape({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay }}
      className={cn(
        "absolute rounded-full blur-3xl pointer-events-none",
        className
      )}
    />
  );
}

// Animated stat counter
function StatCounter({
  value,
  label,
  icon: Icon,
  delay = 0,
}: {
  value: number;
  label: string;
  icon: React.ElementType;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-[hsl(var(--groups-primary))]" />
        <motion.span
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: delay + 0.2 }}
          className="text-2xl sm:text-3xl font-bold text-[hsl(var(--groups-text))]"
        >
          {value.toLocaleString()}+
        </motion.span>
      </div>
      <span className="text-sm text-[hsl(var(--groups-text-muted))]">{label}</span>
    </motion.div>
  );
}

// Feature pill component
function FeaturePill({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
        "bg-[hsl(var(--groups-surface-elevated))] text-[hsl(var(--groups-text-muted))]",
        "border border-[hsl(var(--groups-border))]",
        "shadow-sm"
      )}
    >
      {children}
    </motion.span>
  );
}

export function GroupsEnterpriseHero({
  totalGroups = 150,
  totalMembers = 2400,
}: GroupsEnterpriseHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[500px] sm:min-h-[560px] lg:min-h-[600px] rounded-2xl sm:rounded-3xl overflow-hidden mb-8 sm:mb-12"
    >
      {/* Background with mesh gradient */}
      <div className="absolute inset-0 groups-hero-mesh groups-grain" />

      {/* Floating decorative elements */}
      <FloatingShape
        className="w-[500px] h-[500px] -top-40 -left-40 bg-[hsl(var(--groups-primary))] opacity-[0.08]"
        delay={0.2}
      />
      <FloatingShape
        className="w-[400px] h-[400px] -bottom-20 -right-20 bg-[hsl(var(--groups-accent))] opacity-[0.06]"
        delay={0.4}
      />
      <FloatingShape
        className="w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[hsl(var(--groups-secondary))] opacity-[0.05]"
        delay={0.6}
      />

      {/* Geometric decorations */}
      <motion.div
        initial={{ opacity: 0, rotate: -10 }}
        animate={{ opacity: 0.1, rotate: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-20 right-20 w-32 h-32 border-2 border-[hsl(var(--groups-primary))] rounded-2xl groups-float hidden lg:block"
      />
      <motion.div
        initial={{ opacity: 0, rotate: 10 }}
        animate={{ opacity: 0.08, rotate: 0 }}
        transition={{ duration: 1, delay: 0.7 }}
        className="absolute bottom-32 left-16 w-24 h-24 border-2 border-[hsl(var(--groups-accent))] rounded-full groups-float-delayed hidden lg:block"
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[500px] sm:min-h-[560px] lg:min-h-[600px] px-4 sm:px-6 lg:px-8 py-12">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <span
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full",
              "bg-gradient-to-r from-[hsl(var(--groups-primary-muted))] to-[hsl(var(--groups-accent-muted))]",
              "text-[hsl(var(--groups-primary))] font-semibold text-sm",
              "border border-[hsla(var(--groups-primary),0.2)]",
              "shadow-sm"
            )}
          >
            <Sparkles className="w-4 h-4" />
            Knowledge Communities
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-center mb-4 sm:mb-6 max-w-4xl leading-[1.1] tracking-tight"
        >
          <span className="text-[hsl(var(--groups-text))]">Connect.</span>{" "}
          <span className="text-[hsl(var(--groups-text))]">Collaborate.</span>{" "}
          <span
            className={cn(
              "bg-gradient-to-r from-[hsl(var(--groups-primary))] via-[hsl(var(--groups-gradient-mid))] to-[hsl(var(--groups-accent))]",
              "bg-clip-text text-transparent"
            )}
          >
            Grow.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-[hsl(var(--groups-text-muted))] text-center max-w-2xl mb-8 sm:mb-10 leading-relaxed px-4"
        >
          Join thriving learning communities where ideas flourish and knowledge transforms into lasting connections
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10"
        >
          <FeaturePill delay={0.3}>
            <Users2 className="w-3.5 h-3.5 text-[hsl(var(--groups-primary))]" />
            Peer Learning
          </FeaturePill>
          <FeaturePill delay={0.4}>
            <BookOpen className="w-3.5 h-3.5 text-[hsl(var(--groups-accent))]" />
            Curated Resources
          </FeaturePill>
          <FeaturePill delay={0.5}>
            <Globe2 className="w-3.5 h-3.5 text-[hsl(var(--groups-primary))]" />
            Global Network
          </FeaturePill>
        </motion.div>

        {/* Search and CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-2xl px-4"
        >
          <div
            className={cn(
              "flex-1 relative",
              "[&_input]:h-14 [&_input]:text-base [&_input]:rounded-xl",
              "[&_input]:bg-[hsl(var(--groups-surface-elevated))] [&_input]:border-[hsl(var(--groups-border))]",
              "[&_input]:shadow-sm [&_input]:pl-12",
              "[&_input:focus]:border-[hsl(var(--groups-primary))] [&_input:focus]:ring-2 [&_input:focus]:ring-[hsla(var(--groups-primary),0.2)]",
              "[&_svg]:left-4 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:text-[hsl(var(--groups-text-muted))]"
            )}
          >
            <GroupsSearchInput placeholder="Search communities by topic, skill, or interest..." />
          </div>
          <Link href="/groups/create">
            <Button
              size="lg"
              className={cn(
                "h-14 px-8 text-base font-semibold rounded-xl shadow-lg",
                "bg-[hsl(var(--groups-primary))] hover:bg-[hsl(var(--groups-primary-hover))]",
                "text-[hsl(var(--groups-primary-foreground))]",
                "transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
                "group"
              )}
            >
              Create Community
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-8 sm:gap-12 mt-10 sm:mt-14 pt-8 border-t border-[hsl(var(--groups-border-subtle))]"
        >
          <StatCounter
            value={totalGroups}
            label="Active Communities"
            icon={Users2}
            delay={0.7}
          />
          <StatCounter
            value={totalMembers}
            label="Engaged Members"
            icon={Sparkles}
            delay={0.8}
          />
          <StatCounter
            value={Math.floor(totalMembers / 8)}
            label="Daily Discussions"
            icon={BookOpen}
            delay={0.9}
          />
        </motion.div>
      </div>
    </section>
  );
}
