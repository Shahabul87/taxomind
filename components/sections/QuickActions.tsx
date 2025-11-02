"use client";

import { ChevronRight, Rocket, Zap, GraduationCap, Brain } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

interface ActionCard {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  gradient: string;
}

const actionCards: ActionCard[] = [
  {
    id: "career",
    title: "Launch a new career",
    href: "/courses?filter=career",
    icon: Rocket,
    gradient: "from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20",
  },
  {
    id: "skills",
    title: "Gain in-demand skills",
    href: "/courses?filter=popular",
    icon: Zap,
    gradient: "from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20",
  },
  {
    id: "degree",
    title: "Earn a degree",
    href: "/courses?filter=degree",
    icon: GraduationCap,
    gradient: "from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20",
  },
  {
    id: "ai",
    title: "Get guidance from AI",
    href: "/courses?filter=ai-guided",
    icon: Brain,
    gradient: "from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20",
  },
];

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <section
      className={cn("py-8 md:py-12", className)}
      aria-label="Quick action tiles"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {actionCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.id}
              href={card.href}
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-2xl"
            >
              <Card
                className={cn(
                  "relative overflow-hidden rounded-2xl p-6 h-full transition-all duration-150",
                  "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1",
                  "bg-gradient-to-br",
                  card.gradient,
                  "border border-gray-200 dark:border-gray-800"
                )}
              >
                {/* Icon */}
                <div className="mb-4 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 leading-tight">
                  {card.title}
                </h3>

                {/* Arrow Icon */}
                <div className="flex items-center text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                  <ChevronRight
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>

                {/* Decorative element */}
                <div
                  className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-2xl"
                  aria-hidden="true"
                />
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
