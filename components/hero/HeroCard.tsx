"use client";

import { ArrowRight } from "lucide-react";
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
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-8 md:p-10 lg:p-12 shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_25px_50px_rgba(15,23,42,0.12)]",
        variant === "primary"
          ? "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40"
          : "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/40",
        className
      )}
    >
      {/* Tag/Badge */}
      {tag && (
        <Badge
          className={cn(
            "mb-4 px-3 py-1 text-xs font-semibold",
            variant === "primary"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-orange-600 text-white hover:bg-orange-700"
          )}
        >
          {tag}
        </Badge>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-lg">
        <h2
          className={cn(
            "text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight mb-4",
            variant === "primary"
              ? "text-gray-900 dark:text-white"
              : "text-gray-900 dark:text-white"
          )}
        >
          {title}
        </h2>

        <p
          className={cn(
            "text-base sm:text-lg mb-6 leading-relaxed",
            variant === "primary"
              ? "text-gray-700 dark:text-gray-300"
              : "text-gray-700 dark:text-gray-300"
          )}
        >
          {description}
        </p>

        {/* CTA Button */}
        <Link href={ctaHref}>
          <Button
            size="lg"
            className={cn(
              "h-12 px-6 rounded-full font-medium group transition-all duration-150",
              variant === "primary"
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                : "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg"
            )}
          >
            {ctaLabel}
            <ArrowRight
              className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Button>
        </Link>
      </div>

      {/* Decorative Background Elements */}
      <div
        className={cn(
          "absolute -right-4 -bottom-4 w-32 h-32 sm:w-40 sm:h-40 rounded-full blur-3xl opacity-20",
          variant === "primary" ? "bg-blue-400" : "bg-orange-400"
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          "absolute -left-8 -top-8 w-24 h-24 sm:w-32 sm:h-32 rounded-full blur-2xl opacity-10",
          variant === "primary" ? "bg-blue-500" : "bg-orange-500"
        )}
        aria-hidden="true"
      />
    </div>
  );
}
