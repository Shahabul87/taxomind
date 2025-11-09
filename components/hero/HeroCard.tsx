"use client";

import { ArrowRight, Sparkles, TrendingUp, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface HeroCardProps {
  variant: "primary" | "secondary";
  tag?: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  className?: string;
}

export function HeroCard({
  variant,
  tag,
  title,
  description,
  ctaLabel,
  ctaHref,
  className,
}: HeroCardProps) {
  const Icon = variant === "primary" ? GraduationCap : TrendingUp;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl p-8 md:p-10 lg:p-12 shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-slate-700/50",
        variant === "primary"
          ? "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-800"
          : "bg-gradient-to-br from-orange-500 via-pink-500 to-rose-600 dark:from-orange-600 dark:via-pink-600 dark:to-rose-700",
        className
      )}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Grid pattern background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Floating icon decoration */}
      <div className="absolute top-8 right-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
        <Icon className="w-32 h-32 text-white" strokeWidth={1} />
      </div>

      {/* Tag/Badge */}
      {tag && (
        <Badge
          className={cn(
            "relative z-10 mb-6 px-4 py-1.5 text-xs font-bold uppercase tracking-wider border-0 shadow-lg backdrop-blur-sm",
            "bg-white/20 text-white hover:bg-white/30 transition-colors duration-200"
          )}
        >
          <Sparkles className="w-3 h-3 mr-1.5 inline" />
          {tag}
        </Badge>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-xl">
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-white drop-shadow-lg"
        >
          {title}
        </h2>

        <p
          className="text-base sm:text-lg lg:text-xl mb-8 leading-relaxed text-white/95 font-medium"
        >
          {description}
        </p>

        {/* CTA Button */}
        <Link href={ctaHref}>
          <Button
            size="lg"
            className={cn(
              "h-14 px-8 rounded-full font-bold text-base group/btn transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105",
              "bg-white text-gray-900 hover:bg-gray-50"
            )}
          >
            {ctaLabel}
            <ArrowRight
              className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-2"
              aria-hidden="true"
            />
          </Button>
        </Link>
      </div>

      {/* Enhanced Decorative Background Elements */}
      <div
        className={cn(
          "absolute -right-12 -bottom-12 w-64 h-64 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500",
          "bg-white"
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          "absolute -left-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-15 group-hover:opacity-25 transition-opacity duration-500",
          "bg-white"
        )}
        aria-hidden="true"
      />

      {/* Additional floating orbs */}
      <div
        className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full blur-2xl opacity-10 bg-white animate-pulse"
        style={{ animationDuration: '4s' }}
        aria-hidden="true"
      />
    </div>
  );
}
